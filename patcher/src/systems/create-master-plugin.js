/* global xelib */

let createFile = function (fileName) {
  let file = xelib.FileByName(fileName)
  if (file === 0) {
    file = xelib.AddFile(fileName)
  } else {
    xelib.NukeFile(file)
    xelib.CleanMasters(file)
  }
  return file
}

class Record {
  constructor (id, formID) {
    this.id = id
    this.formID = formID
  }

  init (initialize) {
    if (this.id !== 0 && globals.patcherMode === patcherModes.ptBuildMaster) {
      initialize(this.id)
    }
  }

  getFormID () {return this.formID}
}

/**
 * Creates a new element of a given signature.
 * @param file
 * @param signature
 * @param editorID
 * @param formIDs
 * @returns {Record}
 */
let addRecord = function (file, signature, editorID, formIDs) {
  if (formIDs[2] < formIDs[1]) {
    const currentFormID = formIDs[2]
    globals.editorIDMap[editorID] = currentFormID
    formIDs[2] += 1
    if (globals.patcherMode === patcherModes.ptBuildMaster) {
      xelib.SetNextObjectID(file, currentFormID)
      let record = xelib.AddElement(file, signature + '\\' + signature)
      xelib.AddElement(record, 'EDID - Editor ID')
      xelib.SetValue(record, 'EDID - Editor ID', globals.prefix_ + editorID)
      if (initRecord.hasOwnProperty(signature)) {
        initRecord[signature](record)
      }
      return new Record(record, convertToMasterFormID(currentFormID))
    } else {
      return new Record(0, convertToMasterFormID(currentFormID))
    }
  } else {
    return new Record(0, 0)
  }
}

let createMasterPlugin = function () {
  let masterPlugin = createFile(globals.masterName)
  xelib.SetFileAuthor(masterPlugin, authorName)
  xelib.SetIsESM(masterPlugin, true)
  let mainFormIDs = getFormIDs('create-master-plugin', 0)
  addRecord(masterPlugin, 'QUST', 'Main', mainFormIDs).init(function (record) {
    xelib.SetValue(xelib.AddElement(record, 'FULL - Name'), '', 'Main')

    const flags = xelib.AddElement(record, 'DNAM - General\\Flags')
    xelib.SetFlag(flags, '', 'Start Game Enabled', true)
    xelib.SetFlag(flags, '', 'Run Once', true)

    const alias = xelib.AddArrayItem(record, 'Aliases',
      'ALST - Reference Alias ID', '0')
    xelib.SetValue(xelib.AddElement(alias, 'ALID - Alias Name'), '',
      globals.prefix_ + 'Main_PlayerAlias')
    xelib.AddElement(alias, 'FNAM - Alias Flags')
    xelib.SetUIntValue(xelib.AddElement(alias, 'ALFR - Forced Reference'), '',
      0x14)
    xelib.SetUIntValue(xelib.AddElement(alias, 'VTCK - Voice Type'), '', 0x0)

    const vmad = xelib.AddElement(record, 'VMAD - Virtual Machine Adapter')
    xelib.SetIntValue(vmad, 'Version', 5)
    xelib.SetIntValue(vmad, 'Object Format', 2)
    const mainScript = xelib.AddScript(record, globals.prefix_ + 'Main',
      'Local')
    const mainScriptProperty = xelib.AddScriptProperty(mainScript, 'PatchName',
      'String', 'Edited')
    xelib.SetValue(mainScriptProperty, 'Value', globals.patchName)

    xelib.SetIntValue(vmad, 'Script Fragments\\Unknown', 2)
    const vmadAliases = xelib.AddArrayItem(vmad, 'Aliases', 'Version', '5')
    xelib.SetIntValue(vmadAliases, 'Object Format', 2)
    xelib.SetUIntValue(vmadAliases, 'Object Union\\Object v2\\FormID',
      xelib.GetFormID(record))
    xelib.SetValue(vmadAliases, 'Object Union\\Object v2\\Alias',
      '000 ' + globals.prefix_ + 'Main_PlayerAlias')
    const aliasScripts = xelib.AddArrayItem(vmadAliases, 'Alias Scripts',
      'scriptName', globals.prefix_ + 'Main_OnLoadGame')
    xelib.SetValue(aliasScripts, 'Flags', 'Local')
    const aliasProperties = xelib.AddArrayItem(aliasScripts, 'Properties',
      'propertyName', 'main')
    xelib.SetValue(aliasProperties, 'Type', 'Object')
    xelib.SetValue(aliasProperties, 'Flags', 'Edited')
    const objectV2 = xelib.GetElement(aliasProperties,
      'Value\\Object Union\\Object v2')
    xelib.SetUIntValue(objectV2, 'FormID', xelib.GetFormID(record))
    xelib.SetIntValue(objectV2, 'Alias', -1)

    xelib.SetIntValue(xelib.AddElement(record, 'ANAM - Next Alias ID'), '', 1)

  })
  return masterPlugin
}

let convertToMasterFormID = function (formID) {
  return globals.loadOrderOffset + formID
}

let fromEditorID = function (editorID) {
  return convertToMasterFormID(globals.editorIDMap[editorID])
}
