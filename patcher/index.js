/* global xelib, registerPatcher */
//= require ./src/patcher-modes.js
const PATCHER_MODE = PatcherModes.RUN_PATCHER
//= require ./src/include.js

Patcher.sort()

registerPatcher({
  info: info,
  gameModes: [xelib.gmSSE, xelib.gmTES5],
  settings: {
    label: MOD_NAME,
    hide: true,
    defaultSettings: {
      patchFileName: PATCH_NAME,
    },
  },
  requiredFiles: [MASTER_NAME],
  execute (patchFile, helpers, settings, locals) {
    return {
      initialize: function () {
        globals.patchFile = patchFile
        globals.helpers   = helpers
        globals.settings  = settings
        globals.locals    = locals
        
        Utils.log('Initializing...')
        Master.init()
        Patcher.createMaster()
        Patcher.initialize()
        Utils.log('Initialization completed.')
      },
      process: Patcher.process,
      finalize: function () {
        Patcher.finalize()
      },
    }
  },
})

