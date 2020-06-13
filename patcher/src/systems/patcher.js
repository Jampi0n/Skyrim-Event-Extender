/* globals xelib */
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
   * @type {string}
   * @private
   */
  _identifier    = ''
  /**
   * The display name of the patcher.
   * @type {string}
   * @private
   */
  _displayName   = ''
  /**
   * A list of patchers after which this patcher runs. These are not strict dependencies in the sense, that this
   * patcher needs the other patchers in order to run. Instead the other patchers modify data, which will change how
   * this patcher performs. For example, patchers that generate new magic effects should run before patchers that edit
   * magic effects.
   * @type {string[]}
   * @private
   */
  _runAfter      = []
  /**
   * The process block array consisting of load objects and patch functions.
   * @type {{signature:string,patch:function(number):void}[]}
   * @private
   */
  _processBlocks = []

  /**
   * Creates a new patcher. Patchers are supposed to be generated
   * @param {string} identifier
   * @param {string} displayName
   * @param {string[]} [runAfter=[]]
   * @private
   */
  constructor (identifier, displayName, runAfter = []) {
    this._runAfter    = runAfter
    this._identifier  = identifier
    this._displayName = displayName
  }

  /**
   * @param {string} signature
   * @param {function(number)} patch
   * @return {Patcher} this
   */
  process (signature, patch) {
    this._processBlocks.push({
      signature: signature,
      patch: patch,
    })

    return this
  }

  /**
   * Sets the createMaster() function of the patcher. Use it to create records in the master plugin.
   * @param {function():void} patcherFunction
   * @return {Patcher} this
   */
  master (patcherFunction) {
    this._createMaster = patcherFunction
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
    this._initialize = patcherFunction
    return this
  }

  /**
   * Sets the finalize() function of the patcher. This function runs after all patchers have run.
   * @param {function():void} patcherFunction
   * @return {Patcher} this
   */
  end (patcherFunction) {
    this._finalize = patcherFunction
    return this
  }

  /**
   * Runs the createMaster(patcher) function of the patcher.
   * @private
   */
  _createMaster () {
  }

  /**
   * Runs the initialize(patcher) function of the patcher.
   * @private
   */
  _initialize () {
  }

  /**
   * Runs the finalize(patcher) function of the patcher.
   * @private
   */
  _finalize () {
  }

  /**
   * Runs the patcher
   * @private
   */
  _run () {

    for (const processBlock of this._processBlocks) {
      const signature   = processBlock.signature
      const patch       = processBlock.patch
      const records     = globals.helpers.loadRecords(signature, false)
      const addProgress = 1.0 / records.length
      for (const record of records) {
        patch(Utils.winningOverride(record))
        Progress.add(addProgress)
      }
    }
  }

  /**
   * Returns the progress amount for this patcher.
   * @param {string[]} filesToPatch
   * @return {number}
   * @private
   */
  _getMaxProgress (filesToPatch) {
    let progress = 0
    progress += 1
    for (const processBlock of this._processBlocks) {
      progress += 1
    }
    progress += 1
    return progress
  }

  /**
   * Returns the currently running patcher.
   * @return {Patcher}
   */
  static get currentPatcher () {
    return this._currentPatcher
  }

  /**
   *
   * @type {Patcher[]}
   * @private
   */
  static _patchers     = []
  /**
   *
   * @type {Object.<string,Patcher>}
   * @private
   */
  static _patcherMap   = {}
  /**
   *
   * @type {Patcher[]}
   * @private
   */
  static _patcherOrder = []

  /**
   *
   * @type {Patcher}
   * @private
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

    Utils.assert(remainingPatchersIds.length === 0, 'Some patchers could not be sorted.')
    Utils.assert(this._patchers.length === this._patcherOrder.length, 'There was an error sorting the patchers.')
  }

  /**
   * Runs the createMaster() function of every patcher.
   */
  static createMaster () {
    for (const iPatcher of this._patcherOrder) {
      Utils.log(
        'Building master records for patcher ' + iPatcher.identifier)
      Patcher._currentPatcher = iPatcher
      iPatcher._createMaster()
    }
  }

  /**
   * Runs all patchers.
   */
  static work () {
    for (const iPatcher of this._patcherOrder) {
      Patcher._currentPatcher = iPatcher
      globals.helpers.timerService.start('patchTimer')
      Utils.log(
        'Running patcher ' + iPatcher.identifier)
      iPatcher._initialize()
      Progress.add(1)
      iPatcher._run()
      iPatcher._finalize()
      Progress.add(1)
      Utils.log('Patcher ' + iPatcher.identifier + ' completed in ' +
        globals.helpers.timerService.getSecondsStr('patchTimer') + '.')

    }
  }

  /**
   * Returns the total progress amount.
   * @param {string[]} filesToPatch
   * @return {number}
   */
  static getTotalProgress (filesToPatch) {
    let progress = 0

    for (const iPatcher of this._patcherOrder) {
      progress += iPatcher._getMaxProgress(filesToPatch)
    }

    return progress
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


