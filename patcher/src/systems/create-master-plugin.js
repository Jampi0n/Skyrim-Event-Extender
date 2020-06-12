/* global xelib */

class Record {
  /** @type {number} */ formID_ = -1
  /** @type {number} */ id_     = -1

  /**
   *
   * @param {number} id
   * @param {number} formID
   */
  constructor (id, formID) {
    this.id_     = id
    this.formID_ = formID
  }

  /**
   *
   * @param {function(number):void} initialize
   */
  init (initialize) {
    if (this.id_ !== 0 && PATCHER_MODE === PatcherModes.BUILD_MASTER) {
      initialize(this.id_)
    }
  }

  /**
   *
   * @return {number}
   */
  getFormID () {
    return this.formID_
  }
}

class Master {
  /** @type {Object.<string,number>} */ static editorIDMap_ = {}

  /** @type {number} */ static loadOrderOffset
  /** @type {number} */ static file

  /**
   *
   * @param {string} signature
   * @param {string} editorID
   * @param {number[]} formIDs
   * @return {Record}
   */
  static addRecord (signature, editorID, formIDs) {
    if (formIDs[2] < formIDs[1]) {
      const currentFormID         = formIDs[2]
      this.editorIDMap_[editorID] = currentFormID
      formIDs[2] += 1
      if (PATCHER_MODE === PatcherModes.BUILD_MASTER) {
        xelib.SetNextObjectID(this.file, currentFormID % 0x01000000)
        let record = xelib.AddElement(this.file, signature + '\\' + signature)
        xelib.AddElement(record, 'EDID - Editor ID')
        xelib.SetValue(record, 'EDID - Editor ID', PREFIX_ + editorID)
        if (initRecord.hasOwnProperty(signature)) {
          initRecord[signature](record)
        }
        return new Record(record, currentFormID)
      } else {
        return new Record(0, currentFormID)
      }
    } else {
      return new Record(0, 0)
    }
  }

  /**
   *
   */
  static init () {
    this.file            = xelib.FileByName(MASTER_NAME)
    this.loadOrderOffset = Utils.getLoadOrderOffset(this.file)
  }

  /**
   *
   */
  static create () {
    Utils.createFile(MASTER_NAME)
    this.init()
    xelib.SetFileAuthor(this.file, AUTHOR_NAME)
    xelib.SetIsESM(this.file, true)
    let mainFormIDs = Allocator.getFormIDs('create-master-plugin', 0)
    this.addRecord('QUST', 'Main', mainFormIDs).init(function (record) {
      xelib.SetValue(xelib.AddElement(record, 'FULL - Name'), '', 'Main')

      const flags = xelib.AddElement(record, 'DNAM - General\\Flags')
      xelib.SetFlag(flags, '', 'Start Game Enabled', true)
      xelib.SetFlag(flags, '', 'Run Once', true)

      const alias = xelib.AddArrayItem(record, 'Aliases',
        'ALST - Reference Alias ID', '0')
      xelib.SetValue(xelib.AddElement(alias, 'ALID - Alias Name'), '',
        PREFIX + '_Main_PlayerAlias')
      xelib.AddElement(alias, 'FNAM - Alias Flags')
      xelib.SetUIntValue(xelib.AddElement(alias, 'ALFR - Forced Reference'),
        '', 0x14)
      xelib.SetUIntValue(xelib.AddElement(alias, 'VTCK - Voice Type'), '',
        0x0)

      const mainScript = ScriptUtils.addScript(record, PREFIX + 'Main')
      ScriptUtils.addStringProperty(mainScript, 'PatchName', PATCH_NAME)

      const vmad = xelib.GetElement(record, 'VMAD - Virtual Machine Adapter')

      xelib.SetIntValue(vmad, 'Script Fragments\\Unknown', 2)
      const vmadAliases = xelib.AddArrayItem(vmad, 'Aliases', 'Version', '5')
      xelib.SetIntValue(vmadAliases, 'Object Format', 2)
      xelib.SetUIntValue(vmadAliases, 'Object Union\\Object v2\\FormID',
        xelib.GetFormID(record))
      xelib.SetValue(vmadAliases, 'Object Union\\Object v2\\Alias',
        '000 ' + PREFIX + 'Main_PlayerAlias')
      const aliasScripts = xelib.AddArrayItem(vmadAliases, 'Alias Scripts',
        'scriptName', PREFIX + 'Main_OnLoadGame')
      xelib.SetValue(aliasScripts, 'Flags', 'Local')
      const aliasProperties = xelib.AddArrayItem(aliasScripts, 'Properties',
        'propertyName', 'main')
      xelib.SetValue(aliasProperties, 'Type', 'Object')
      xelib.SetValue(aliasProperties, 'Flags', 'Edited')
      const objectV2 = xelib.GetElement(aliasProperties,
        'Value\\Object Union\\Object v2')
      xelib.SetUIntValue(objectV2, 'FormID', xelib.GetFormID(record))
      xelib.SetIntValue(objectV2, 'Alias', -1)

      xelib.SetIntValue(xelib.AddElement(record, 'ANAM - Next Alias ID'), '',
        1)

    })
  }

  /**
   *
   * @param {string} editorID
   * @return {number}
   */
  static fromEditorID (editorID) {
    return this.editorIDMap_[editorID]
  }
}


