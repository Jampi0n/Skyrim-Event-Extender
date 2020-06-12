/* global xelib, registerPatcher */
//= require ./src/patcher-modes.js
const PATCHER_MODE = PatcherModes.RUN_PATCHER
//= require ./src/include.js

const missingPatchers = Patcher.sort()

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

        for (const patcher of missingPatchers) {
          Utils.log(
            'Warning: Patcher ' + patcher[0] + ' must run after patcher ' +
            patcher[1] + ', which was not found.')
        }

        for (const patcher of Patcher.patcherOrder) {
          Utils.log(patcher.name)
        }
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

