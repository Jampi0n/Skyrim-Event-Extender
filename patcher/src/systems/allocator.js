class Allocator {
  static nextID_    = 0x800
  static formIDMap_ = {}

  /**
   * Allocates a number of consecutive formIDs for the patcher with identifier patcherIdentifier. The formIDs are added
   * as new formID group.
   * @param {string} patcherIdentifier
   * @param {number} count
   */
  static alloc (patcherIdentifier, count) {
    if (!this.formIDMap_.hasOwnProperty(patcherIdentifier)) {
      this.formIDMap_[patcherIdentifier] = []
    }
    const patcherFormIDs = this.formIDMap_[patcherIdentifier]
    patcherFormIDs.push([this.nextID_, this.nextID_ + count, this.nextID_])
    this.nextID_ += count
    this.formIDMap_[patcherIdentifier] = patcherFormIDs
  }

  /**
   * Retrieves a formID group for the patcher with identifier patcherIdentifier.
   * @param {string} patcherIdentifier
   * @param {number} group
   * @return {number[]}
   */
  static getFormIDs (patcherIdentifier, group) {
    const formIDs = this.formIDMap_[patcherIdentifier][group].slice()
    for (let i = 0; i < formIDs.length; ++i) {
      formIDs[i] += Master.loadOrderOffset
    }
    return [formIDs[0], formIDs[1], formIDs[2]]
  }

  /**
   * Retrieves formID at index in group for the patcher with identifier patcherIdentifier.
   * @param {string} patcherIdentifier
   * @param {number} group
   * @param {number} index
   * @return {number}
   */
  static getFormID (patcherIdentifier, group, index) {
    return index + this.getFormIDs(patcherIdentifier, group)[0]
  }
}

