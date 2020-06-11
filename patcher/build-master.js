//= require ./src/patcher-modes.js
const PATCHER_MODE = PatcherModes.BUILD_MASTER
//= require ./src/include.js

Master.create()
const missingPatchers = PatcherManager.sort()
for (const patcher of missingPatchers) {
  Utils.log(
    'Warning: Patcher ' + patcher[0] + ' must run after patcher ' + patcher[1] +
    ', which was not found.')
}
PatcherManager.createMaster()