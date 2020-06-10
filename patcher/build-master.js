//= require ./src/include.js

globals.patcherMode = patcherModes.ptBuildMaster
globals.masterFile = createMasterPlugin()
const missingPatchers = globals.patcherManager.sort()
for (const patcher of missingPatchers) {
  utils.log(
    'Warning: Patcher ' + patcher[0] + ' must run after patcher ' + patcher[1] +
    ', which was not found.')
}
globals.patcherManager.create_master(globals.masterFile)
globals.loadOrderOffset = utils.getLoadOrderOffset(globals.masterFile)