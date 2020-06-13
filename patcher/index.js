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
      customProgress: _ => {
        const max = Patcher.getTotalProgress()
        return Progress.setMax(max)
      },
      initialize: () => {
        globals.patchFile = patchFile
        globals.helpers   = helpers
        globals.settings  = settings
        globals.locals    = locals

        Utils.log('Initializing...')
        Master.init()
        Patcher.createMaster()
        Utils.log('Running...')
        Patcher.runAll()
        Progress.complete()
      },
      process: [],
    }
  },
  removeWarnings: [this.execute().initialize(), this.execute().customProgress()],
})

