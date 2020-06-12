//= require ./src/patcher-modes.js
const PATCHER_MODE = PatcherModes.BUILD_MASTER
//= require ./src/include.js

Master.create()
Patcher.sort()
Patcher.createMaster()
