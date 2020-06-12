/**
 * A general function that is run by the patcher.
 * @callback callback
 */

/**
 * A function the patcher runs for every record.
 * @callback patchFunction
 * @param {number} record
 */

/**
 * A filter function the patcher runs to evaluate whether a record is patched.
 * @callback filterFunction
 * @param {number} record
 * @return {boolean}
 */

/**
 * A process block consisting of load and patch.
 * @typedef {{load:{signature:string, filter:filterFunction },patch:
 *   patchFunction }} processBlock
 */

class Patcher {
  /** @type {string} */           identifier_    = ''
  /** @type {string} */           displayName_   = ''
  /** @type {string[]} */         runAfter_      = []
  /** @type {processBlock[]} */   processBlocks_ = []

  /**
   *
   * @param {string} identifier
   * @param {string} displayName
   * @param {string[]} [runAfter=[]]
   */
  constructor (identifier, displayName, runAfter = []) {
    this.identifier_  = identifier
    this.displayName_ = displayName
    this.runAfter_    = runAfter
  }

  /**
   * @param {patchFunction} patch
   * @param {string} signature
   * @param {filterFunction} [filter= (_record) => true] filter
   * @return {Patcher} this
   */
  process (patch, signature, filter = (_record) => true) {
    this.processBlocks_.push({
      load: {
        signature: signature,
        filter: filter,
      },
      patch: patch,
    })
    return this
  }

  /**
   *
   * @param {callback} patcherFunction
   * @return {Patcher} this
   */
  master (patcherFunction) {
    this.createMaster = patcherFunction
    return this
  }

  /**
   *
   * @param {callback} patcherFunction
   * @return {Patcher} this
   */
  begin (patcherFunction) {
    this.initialize = patcherFunction
    return this
  }

  /**
   *
   * @param {callback} patcherFunction
   * @return {Patcher} this
   */
  end (patcherFunction) {
    this.finalize = patcherFunction
    return this
  }

  /**
   * Runs the createMaster(patcher) function of the patcher.
   */
  createMaster () {
  }

  /**
   * Runs the initialize(patcher) function of the patcher.
   */
  initialize () {
  }

  /**
   * Runs the finalize(patcher) function of the patcher.
   */
  finalize () {
  }

  /**
   * Returns the identifier of the patcher.
   * @return {string}
   */
  getIdentifier () {
    return this.identifier_
  }

  /**
   * Returns the display name of the patcher.
   * @return {string}
   */
  getDisplayName () {
    return this.displayName_
  }

  /**
   * Returns the identifiers of patchers after which the patcher runs.
   * @return {string[]}
   */
  getRunAfter () {
    return this.runAfter_.slice()
  }

  /**
   * Returns the process blocks of the patcher.
   * @return {processBlock[]}
   */
  getProcessBlocks () {
    return this.processBlocks_
  }

}


