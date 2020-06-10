/* global xelib, registerPatcher */
//= require ./src/include.js

globals.patcherMode = patcherModes.ptRunPatcher

const missingPatchers = globals.patcherManager.sort()

registerPatcher({
  info: info,
  gameModes: [xelib.gmSSE, xelib.gmTES5],
  settings: {
    label: modName, hide: true, defaultSettings: {
      patchFileName: globals.patchName,
    },
  },
  requiredFiles: [globals.masterName],
  execute (patchFile, helpers, settings, locals) {
    return {
      initialize: function () {
        globals.patchFile = patchFile
        globals.helpers = helpers
        globals.settings = settings
        globals.locals = locals

        for (const patcher of missingPatchers) {
          utils.log(
            'Warning: Patcher ' + patcher[0] + ' must run after patcher ' +
            patcher[1] + ', which was not found.')
        }

        for (const patcher of globals.patcherManager.patcherOrder) {
          utils.log(patcher.name)
        }

        utils.log('Initializing...')
        globals.masterFile = xelib.FileByName(globals.masterName)
        globals.loadOrderOffset = utils.getLoadOrderOffset(globals.masterFile)
        globals.patcherManager.create_master('')
        globals.patcherManager.initialize()
        utils.log('Initialization completed.')
      }, process: globals.patcherManager.process, finalize: function () {
        globals.patcherManager.finalize()
      },
    }
  },
})

