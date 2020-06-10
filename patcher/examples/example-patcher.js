/* globals xelib */

// Allocate formIDs in src/configuration/allocation.js
// Always append at the bottom of src/configuration/allocation.js and do not
// edit or remove other lines.
allocateFormIDs('Example Patcher', 3)

// Patcher file in src/patchers/

// Object to store data for the patcher
const examplePatcher = {
  formIDOfKeyword2: 0,
}

new Patcher({
  name: 'Example Patcher', // Unique name of the patcher
  after: ['Required Patcher 1'], // The patcher will only run after all
                                 // patchers in this field are completed.
  createMaster: function (masterFile) {
    // create records for the patcher
    const formIDs = getFormIDs(this.name, 0)
    addRecord(masterFile, 'KYWD', 'Keyword1', formIDs)
    // You can retrieve the formID with getFormID().
    examplePatcher.formIDOfKeyword2 = addRecord(masterFile, 'KYWD', 'Keyword2',
      formIDs).
      getFormID()
    // You can change the record with init().
    addRecord(masterFile, 'KYWD', 'Keyword3', formIDs).
      init(function (record) {
        xelib.SetIntValue(record, 'CNAM - Color\\Red', 255)
      })
    // These wrappers are required, so that init() is only executed when
    // building the master plugin.

  }, // The initialize runs before any patchers runs.
  // This function is optional.
  initialize: function () {
    // With globals.helpers you can access helpers of the patcher.
    globals.helpers.logMessage('[' + this.name + ']: initialize() is running.')
    // For logging you should use the utils.log instead.
    utils.log('LogLog')

    // getMasterFormID retrieves a formID allocated for the patcher.
    utils.log(xelib.Hex(getMasterFormID(this.name, 0, 0)))
    // You can also access the stored formID.
    utils.log(xelib.Hex(examplePatcher.formIDOfKeyword2))
    // Finally, you can access the formID by its EditorID:
    utils.log(xelib.Hex(fromEditorID('Keyword3')))
  }, process: [
    // Define process blocks consisting of load and patch.
    // They are exactly like standard upf process blocks, except that the
    // filer and patch functions use an additional parameter for the name of
    // the patcher.
    {
      load: {
        signature: 'MGEF', filter: function (record, _name) {
          if (xelib.HasElement(record, 'EDID - Editor ID')) {
            return xelib.EditorID(record).startsWith('Alch')
          } else {return false}
        },
      }, patch: function (record, name) {
        utils.log('FullName' + xelib.FullName(record))
        xelib.SetValue(record, 'EDID - Editor ID',
          'ExamplePatcher_' + xelib.EditorID(record))

        utils.log(getMasterFormID(name, 0, 0))
        utils.log(examplePatcher.formIDOfKeyword2)
        utils.log(fromEditorID('Keyword3'))

        const keywords = [
          getMasterFormID(name, 0, 0),
          examplePatcher.formIDOfKeyword2,
          fromEditorID('Keyword3')]
        for (let keyword of keywords) {
          keyword = xelib.Hex(keyword)
          if (!xelib.HasKeyword(record, keyword)) {
            xelib.AddKeyword(record, keyword)
          }
        }

      },
    }], // The finalize runs after all patchers have run.
  // This function is optional.
  finalize: function (record, name) {
    utils.log('[' + this.name + ']: finalize() is running.')
  },
})

