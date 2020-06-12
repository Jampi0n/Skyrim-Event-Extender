class PatcherManager {
  /** @type {Patcher[]} */  static patchers_       = []
  /** @type {Object} */     static patcherMap_     = {}
  /** @type {Patcher[]} */  static patcherOrder_   = []
  /** @type {Object[]} */   static process_        = []
  /** @type {Patcher} */    static currentPatcher_ = null

  static getCurrentPatcher () {
    return this.currentPatcher_
  }

  /**
   *
   * @param group
   * @return {*}
   */
  static getFormIDs (group) {
    return Allocator.getFormIDs(this.currentPatcher_.getIdentifier(), group)
  }

  /**
   *
   * @param group
   * @param index
   * @return {*}
   */
  static getFormID (group, index) {
    return Allocator.getFormID(this.currentPatcher_.getIdentifier(), group,
      index)
  }

  static sort () {

    /** @type {number[][]} */ const runAfterIds         = []
    /** @type {number[]} */ const remainingPatchersIds  = []
    /** @type {string[][]} */ const missingPatcherNames = []
    /** @type {number[]} */ const noRunAfterIds         = []

    // Store list of runAfterIds for every patcher.
    // Add patcherIds with no runAfters to noRunAfterIds.
    let index = 0
    for (const iPatcher of this.patchers_) {
      remainingPatchersIds.push(index)
      const runAfterArray = []
      for (const iRunAfter of iPatcher.getRunAfter()) {
        if (this.patcherMap_.hasOwnProperty(iRunAfter)) {
          runAfterArray.push(
            this.patchers_.indexOf(this.patcherMap_[iRunAfter]))
        } else {
          missingPatcherNames.push([iPatcher.getIdentifier(), iRunAfter])
        }
      }
      runAfterIds.push(runAfterArray)
      if (runAfterArray.length === 0) {
        noRunAfterIds.push(index)
      }
      index++
    }

    // Topological sorting of patchers.
    while (noRunAfterIds.length > 0) {
      const nextPatcherId = noRunAfterIds.pop()
      this.patcherOrder_.push(this.patchers_[nextPatcherId])
      Utils.removeFromArray(remainingPatchersIds, nextPatcherId)
      for (const iPatcherId of remainingPatchersIds) {
        if (Utils.removeFromArray(runAfterIds[iPatcherId], nextPatcherId) &&
          runAfterIds[iPatcherId].length === 0) {
          noRunAfterIds.push(iPatcherId)
        }
      }
    }

    for (const iPatcher of this.patcherOrder_) {
      Utils.log(iPatcher.getIdentifier() + '|' + iPatcher.getDisplayName())
      for (const iSingleProcess of iPatcher.getProcessBlocks()) {
        this.process_.push({
          load: {
            signature: iSingleProcess.load.signature,
            filter: function (record) {
              PatcherManager.currentPatcher_ = iPatcher
              return iSingleProcess.load.filter(record)
            },
          },
          patch: function (record) {
            PatcherManager.currentPatcher_ = iPatcher
            iSingleProcess.patch(record)
          },
        })
      }
    }

    if (remainingPatchersIds.length > 0) {
      let errorMessage = 'The following patchers could not be sorted: '
      for (const iPatcherId of remainingPatchersIds) {
        errorMessage += this.patchers_[iPatcherId].getIdentifier() + ', '
      }
      errorMessage = errorMessage.slice(0, -1)
      Utils.log(errorMessage)
      throw errorMessage
    }

    if (this.patchers_.length !== this.patcherOrder_.length) {
      const errorMessage = 'There was an error sorting the patchers.'
      Utils.log(errorMessage)
      throw errorMessage
    }

    return missingPatcherNames
  }

  static initialize () {
    for (const iPatcher of this.patcherOrder_) {
      Utils.log('Initializing: ' + iPatcher.getIdentifier())
      PatcherManager.currentPatcher_ = iPatcher
      iPatcher.initialize()
    }
  }

  static finalize () {
    for (const iPatcher of this.patcherOrder_) {
      Utils.log('Finalizing: ' + iPatcher.getIdentifier())
      PatcherManager.currentPatcher_ = iPatcher
      iPatcher.finalize()
    }
  }

  static createMaster () {
    for (const iPatcher of this.patcherOrder_) {
      Utils.log(
        'Building master records for patcher ' + iPatcher.getIdentifier())
      PatcherManager.currentPatcher_ = iPatcher
      iPatcher.createMaster()
    }
  }

  /**
   *
   * @param {string} identifier
   * @param {string} displayName
   * @param {string[]} [runAfter=[]]
   * @return {Patcher}
   */
  static add (identifier, displayName, runAfter = []) {
    const newPatcher = new Patcher(identifier, displayName, runAfter)
    this.patchers_.push(newPatcher)
    this.patcherMap_[newPatcher.getIdentifier()] = newPatcher
    return newPatcher
  }
}
