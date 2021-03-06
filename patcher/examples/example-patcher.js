/* globals xelib */

// Allocate formIDs in src/configuration/allocation.js
// Always append at the bottom of src/configuration/allocation.js and do not
// edit or remove other lines.
Allocator.alloc('Example Patcher', 3)

// Patcher file in src/patchers/

{

  let patcherName      = ''
  let formIDOfKeyword2 = 0

  Patcher.add('example-patcher', 'Example Patcher',
    ['Required Patcher 1']).master(() => {
    // create records for the patcher
    const formIDs = Patcher.getFormIDs(0)
    Master.addRecord('KYWD', 'Keyword1', formIDs)
    // You can retrieve the formID with getFormID().
    formIDOfKeyword2 = Master.addRecord('KYWD', 'Keyword2', formIDs).getFormID()
    // You can change the record with init().
    Master.addRecord('KYWD', 'Keyword3', formIDs).init(function (record) {
      xelib.SetIntValue(record, 'CNAM - Color\\Red', 255)
    })
    // These wrappers are required, so that init() is only executed when
    // building the master plugin.
  }).begin(() => {
    // With globals.helpers you can access helpers of the patcher.
    globals.helpers.logMessage(
      '[' + patcherName + ']: initialize() is running.')
    // For logging you should use the Utils.log instead.
    Utils.log('LogLog')

    // Patcher.getFormID retrieves a formID allocated for the patcher.
    Utils.log(xelib.Hex(Patcher.getFormID(0, 0)))
    // You can also access the stored formID.
    Utils.log(xelib.Hex(formIDOfKeyword2))
    // Finally, you can access the formID by its EditorID:
    Utils.log(xelib.Hex(Master.fromEditorID('Keyword3')))
    patcherName = Patcher.currentPatcher.displayName
  }).process('MGEF', record => {
    if (xelib.EditorID(record).startsWith('Alch')) {
      Utils.log('FullName' + xelib.FullName(record))
      xelib.SetValue(record, 'EDID - Editor ID',
        'ExamplePatcher_' + xelib.EditorID(record))
      Utils.log(Patcher.getFormID(0, 0))
      Utils.log(formIDOfKeyword2)
      Utils.log(Master.fromEditorID('Keyword3'))

      const keywords = [
        Patcher.getFormID(0, 0),
        formIDOfKeyword2,
        Master.fromEditorID('Keyword3'),
      ]
      for (let keyword of keywords) {
        keyword = xelib.Hex(keyword)
        if (!xelib.HasKeyword(record, keyword)) {
          xelib.AddKeyword(record, keyword)
        }
      }
    }
  }).end(() => {
    Utils.log('[' + patcherName + ']: finalize() is running.')
  })

}
