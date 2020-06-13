/**
 * A process block consisting of load and patch.
 * @typedef {{load:{signature:string, filter:function(number):boolean },patch:function(number)}} processBlock
 */

class Patcher {

  /**
   * The unique string identifier of the patcher.
   * @return {string}
   */
  get identifier () {
    return this._identifier
  }

  /**
   * The display name of the patcher.
   * @return {string}
   */
  get displayName () {
    return this._displayName
  }

  /**
   * The unique string identifier of the patcher.
   * @private
   * @type {string}
   */
  _identifier    = ''
  /**
   * The display name of the patcher.
   * @private
   * @type {string}
   */
  _displayName   = ''
  /**
   * A list of patchers after which this patcher runs. These are not strict dependencies in the sense, that this
   * patcher needs the other patchers in order to run. Instead the other patchers modify data, which will change how
   * this patcher performs. For example, patchers that generate new magic effects should run before patchers that edit
   * magic effects.
   * @private
   * @type {string[]}
   */
  _runAfter      = []
  /**
   * The process block array consisting of load objects and patch functions.
   * @private
   * @type {processBlock[]}
   */
  _processBlocks = []

  /**
   * Creates a new patcher. Patchers are supposed to be generated
   * @private
   * @param {string} identifier
   * @param {string} displayName
   * @param {string[]} [runAfter=[]]
   */
  constructor (identifier, displayName, runAfter = []) {
    this._runAfter    = runAfter
    this._identifier  = identifier
    this._displayName = displayName
  }

  /**
   * @param {string} signature
   * @param {function(number):boolean} [filter= (_record) => true] filter
   * @return {Patcher} this
   */
  process (signature, filter = (_record) => true) {
    this._processBlocks.push({
      load: {
        signature: signature,
        filter: filter,
      },
      patch: (_) => {return undefined},
    })
    return this
  }

  /**
   * Sets the createMaster() function of the patcher. Use it to create records in the master plugin.
   * @param {function():void} patcherFunction
   * @return {Patcher} this
   */
  master (patcherFunction) {
    this.createMaster = patcherFunction
    return this
  }

  /**
   * Sets the initialize() function of the patcher. This function runs before all patchers are run. Settings that are
   * modified while the patcher runs or rely on the current load order need to be initialized here. Constant settings,
   * which do not rely on the current load order or xelib can be initialized directly.
   * @param {function():void} patcherFunction
   * @return {Patcher} this
   */
  begin (patcherFunction) {
    this.initialize = patcherFunction
    return this
  }

  /**
   * Sets the finalize() function of the patcher. This function runs after all patchers have run.
   * @param {function():void} patcherFunction
   * @return {Patcher} this
   */
  end (patcherFunction) {
    this.finalize = patcherFunction
    return this
  }

  /**
   * @private
   * Runs the createMaster(patcher) function of the patcher.
   */
  createMaster () {
  }

  /**
   * @private
   * Runs the initialize(patcher) function of the patcher.
   */
  initialize () {
  }

  /**
   * @private
   * Runs the finalize(patcher) function of the patcher.
   */
  finalize () {
  }

  /**
   * Returns the ordered list of patchers. Only works after Master.sort() was called.
   * @return {Patcher[]}
   */
  static get patcherOrder () {
    return this._patcherOrder
  }

  /**
   * Returns the process block array for use with process property of unified patching framework patchers.
   * @return {processBlock[]}
   */
  static get process () {
    return this._process
  }

  /**
   *
   * @return {Patcher}
   */
  static get currentPatcher () {
    return this._currentPatcher
  }

  /**
   *
   * @private
   * @type {Patcher[]}
   */
  static _patchers       = []
  /**
   *
   * @private
   * @type {Object.<string,Patcher>}
   */
  static _patcherMap     = {}
  /**
   *
   * @private
   * @type {Patcher[]}
   */
  static _patcherOrder   = []
  /**
   *
   * @private
   * @type {processBlock[]}
   */
  static _process        = []
  /**
   *
   * @private
   * @type {Patcher}
   */
  static _currentPatcher = null

  /**
   * Retrieves a formID group for the current Patcher.
   * @param group
   * @return {number[]}
   */
  static getFormIDs (group) {
    return Allocator.getFormIDs(this._currentPatcher.identifier, group)
  }

  /**
   * Retrieves formID at index in group for the current Patcher.
   * @param group
   * @param index
   * @return {number}
   */
  static getFormID (group, index) {
    return Allocator.getFormID(this._currentPatcher.identifier, group,
      index)
  }

  /**
   * Uses patcherOrder to create the process block array.
   * @private
   */
  static createProcess () {
    for (const iPatcher of this._patcherOrder) {
      for (const iSingleProcess of iPatcher._processBlocks) {
        this._process.push({
          load: {
            signature: iSingleProcess.load.signature,
            filter: (record) => {
              if (Patcher._currentPatcher !== iPatcher) {
                if (Patcher._currentPatcher !== null) {
                  Utils.log(this._currentPatcher.identifier + ' completed in ' +
                    globals.helpers.timerService.getSecondsStr('patchTimer') + '.')
                } else {
                  Utils.log('Initialization completed in ' +
                    globals.helpers.timerService.getSecondsStr('patchTimer') + '.')
                }
                Utils.log('Running: ' + iPatcher.identifier)
                Patcher._currentPatcher = iPatcher
                globals.helpers.timerService.start('patchTimer')
              }
              return iSingleProcess.load.filter(record)
            },
          },
          patch: function (_) {
            return undefined
          },
        })
      }
    }
  }

  /**
   * Sorts all patchers according to their runAfter settings.
   */
  static sort () {

    /** @type {number[][]} */ const runAfterIds        = []
    /** @type {number[]} */ const remainingPatchersIds = []
    /** @type {number[]} */ const noRunAfterIds        = []

    // Store list of runAfterIds for every patcher.
    // Add patcherIds with no runAfters to noRunAfterIds.
    for (const iPatcher of this._patchers) {
      const index = this._patchers.indexOf(iPatcher)
      remainingPatchersIds.push(index)
      const runAfterArray = []
      for (const iRunAfter of iPatcher._runAfter) {
        if (this._patcherMap.hasOwnProperty(iRunAfter)) {
          runAfterArray.push(this._patchers.indexOf(this._patcherMap[iRunAfter]))
        }
      }
      runAfterIds.push(runAfterArray)
      if (runAfterArray.length === 0) {
        noRunAfterIds.push(index)
      }
    }

    // Topological sorting of patchers.
    while (noRunAfterIds.length > 0) {
      const nextPatcherId = noRunAfterIds.pop()
      this._patcherOrder.push(this._patchers[nextPatcherId])
      Utils.removeFromArray(remainingPatchersIds, nextPatcherId)
      for (const iPatcherId of remainingPatchersIds) {
        if (Utils.removeFromArray(runAfterIds[iPatcherId], nextPatcherId) &&
          runAfterIds[iPatcherId].length === 0) {
          noRunAfterIds.push(iPatcherId)
        }
      }
    }

    this.createProcess()
    Utils.assert(remainingPatchersIds.length === 0, 'Some patchers could not be sorted.')
    Utils.assert(this._patchers.length === this._patcherOrder.length, 'There was an error sorting the patchers.')
  }

  /**
   * Runs the initialize() function of every patcher.
   */
  static initialize () {
    for (const iPatcher of this._patcherOrder) {
      Utils.log('Initializing: ' + iPatcher.identifier)
      Patcher._currentPatcher = iPatcher
      iPatcher.initialize()
    }
    Patcher._currentPatcher = null
    globals.helpers.timerService.start('patchTimer')
  }

  /**
   * Runs the finalize() function of every patcher.
   */
  static finalize () {
    Utils.log(this._currentPatcher.identifier + ' completed in ' +
      globals.helpers.timerService.getSecondsStr('patchTimer') + '.')
    for (const iPatcher of this._patcherOrder) {
      Utils.log('Finalizing: ' + iPatcher.identifier)
      Patcher._currentPatcher = iPatcher
      iPatcher.finalize()
    }
    Utils.log('Finalization completed in ' +
      globals.helpers.timerService.getSecondsStr('patchTimer') + '.')
  }

  /**
   * Runs the createMaster() function of every patcher.
   */
  static createMaster () {
    for (const iPatcher of this._patcherOrder) {
      Utils.log(
        'Building master records for patcher ' + iPatcher.identifier)
      Patcher._currentPatcher = iPatcher
      iPatcher.createMaster()
    }
  }

  /**
   * Adds a new patcher.
   * @param {string} identifier Unique string identifier. Should match the file name without extension.
   * @param {string} displayName Display name of the patcher.
   * @param {string[]} [runAfter=[]] List of patchers, that are run before this patcher.
   * @return {Patcher}
   */
  static add (identifier, displayName, runAfter = []) {
    const newPatcher = new Patcher(identifier, displayName, runAfter)
    this._patchers.push(newPatcher)
    this._patcherMap[newPatcher.identifier] = newPatcher
    return newPatcher
  }
}


