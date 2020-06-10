class PatcherManager {
  constructor () {
    this.patchers = []
    this.patcherMap = {}
    this.patcherOrder = []
    this.process = []
  }

  sort () {
    this.patcherOrder = []

    const noAfterIds = []
    let remainingPatchersIds = []
    let missingPatcherNames = []
    // Build afterIndices for every patcher and noAfter
    for (const patcher of this.patchers) {
      remainingPatchersIds.push(patcher.index)
      for (const after of patcher.after) {
        if (this.patcherMap.hasOwnProperty(after)) {
          patcher.afterIndices.push(this.patcherMap[after].index)
        } else {
          missingPatcherNames.push([patcher.name, after])
        }
      }
      if (patcher.afterIndices.length === 0) {
        noAfterIds.push(patcher.index)
      }
    }
    utils.log('1 noAfterIds: ' + JSON.stringify(noAfterIds))
    utils.log('2 remainingPatchersIds: ' + JSON.stringify(remainingPatchersIds))
    while (noAfterIds.length > 0) {
      // Find patcher with no afterIndices

      noAfterIds.sort(function (a, b) {
        const aName = globals.patcherManager.patchers[a].name
        const bName = globals.patcherManager.patchers[b].name
        if (aName < bName) { return 1 }
        if (aName > bName) { return -1 }
        return 0
      })

      utils.log('3 noAfterIds: ' + JSON.stringify(noAfterIds))

      const nextPatcherId = noAfterIds.pop()
      utils.log('4 nextPatcherId: ' + nextPatcherId)
      utils.log('5 noAfterIds: ' + JSON.stringify(noAfterIds))

      // Add nextPatcher to patcherOrder
      this.patcherOrder.push(this.patchers[nextPatcherId])

      // Remove nextPatcher from remainingPatchers
      const index = remainingPatchersIds.indexOf(nextPatcherId)
      utils.log('6 index: ' + index)
      if (index < 0) {
        throw 'asd'
      }
      remainingPatchersIds.splice(index, 1)
      utils.log(
        '7 remainingPatchersIds: ' + JSON.stringify(remainingPatchersIds))
      // Remove nextPatcher from afterIndices of all remaining patchers
      for (const patcherId of remainingPatchersIds) {
        utils.log('8 patcherId: ' + patcherId)
        const patcher = this.patchers[patcherId]
        const index = patcher.afterIndices.indexOf(nextPatcherId)
        utils.log('9 index: ' + index)
        if (index >= 0) {
          patcher.afterIndices.splice(index, 1)
          if (patcher.afterIndices.length === 0) {
            noAfterIds.push(patcherId)
            utils.log('10 noAfterIds: ' + JSON.stringify(noAfterIds))
          }
        }
      }
    }
    for (const patcher of this.patcherOrder) {
      for (const singleProcess of patcher.process) {
        this.process.push({
          load: {
            signature: singleProcess.load.signature, filter: function (record) {
              return singleProcess.load.filter(record, patcher.name)
            },
          }, patch: function (record) {
            singleProcess.patch(record, patcher.name)
          },
        })
      }
    }
    if (remainingPatchersIds.length > 0) {
      let errorMessage = 'The following patchers could not be sorted: '
      for (const patcherId of remainingPatchersIds) {
        errorMessage += this.patchers[patcherId].name + ', '
      }
      throw errorMessage.slice(0, -1)
    }
    return missingPatcherNames
  }

  initialize () {
    for (const patcher of this.patcherOrder) {
      utils.log('Initializing: ' + patcher.name)
      patcher.initialize()
    }
  }

  finalize () {
    for (const patcher of this.patcherOrder) {
      utils.log('Finalizing: ' + patcher.name)
      patcher.finalize()
    }
  }

  create_master (masterFile) {
    for (const patcher of this.patchers) {
      utils.log('Building master records for patcher ' + patcher.name)
      patcher.createMaster(masterFile)
    }
  }

  /**
   *
   * @param {Patcher} patcher
   */
  add_patcher (patcher) {
    patcher.index = this.patchers.length
    this.patchers.push(patcher)
    this.patcherMap[patcher.name] = patcher
  }
}

class Patcher {
  constructor (patcherObject) {
    this.index = -1
    if (patcherObject.hasOwnProperty('name')) {
      this.name = patcherObject.name
    }
    if (patcherObject.hasOwnProperty('createMaster')) {
      this.createMaster = patcherObject.createMaster
    } else {
      this.createMaster = function (_masterFile) {}
    }
    if (patcherObject.hasOwnProperty('initialize')) {
      this.initialize = patcherObject.initialize
    } else {
      this.initialize = function () {}
    }
    if (patcherObject.hasOwnProperty('process')) {
      this.process = patcherObject.process
    } else {
      this.process = []
    }
    if (patcherObject.hasOwnProperty('finalize')) {
      this.finalize = patcherObject.finalize
    } else {
      this.finalize = function () {}
    }
    if (patcherObject.hasOwnProperty('after')) {
      this.after = patcherObject.after
    } else {
      this.after = []
    }
    this.afterIndices = []
    globals.patcherManager.add_patcher(this)
  }
}

globals.patcherManager = new PatcherManager()
