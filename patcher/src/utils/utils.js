/* global zedit, xelib */

const utils = {
  log: function (msg) {
    switch (globals.patcherMode) {
      case(patcherModes.ptBuildMaster):
        zedit.log(msg)
        break
      case(patcherModes.ptRunPatcher):
        if (globals.helpers !== null) {
          globals.helpers.logMessage(msg)
        }
        break
      default:
    }
  }, getLoadOrderOffset: function (file) {
    return xelib.GetFileLoadOrder(file) * 0x01000000
  }, /**
   * Returns a handle for the winning override of record `id`.
   * Return 0, if the id is 0.
   * @param {Number} id
   * @returns {Number}
   */
  winningOverride: function (id) {
    return id === 0 ? 0 : xelib.GetWinningOverride(id)
  }, /**
   * Adds keyword with FormID keyword to record id.
   * @param {Number} record
   * @param {Number} keyword
   */
  addKeyword: function (record, keyword) {
    if (!utils.hasKeyword(record, keyword)) {
      xelib.AddKeyword(record, xelib.GetHexFormID(xelib.GetRecord(0, keyword)))
    }
  }, /**
   * Returns whether record id has the keyword with FormID keyword.
   * @param {Number} record
   * @param {Number} keyword
   * @returns {Boolean}
   */
  hasKeyword: function (record, keyword) {
    return xelib.HasKeyword(record,
      xelib.GetHexFormID(xelib.GetRecord(0, keyword)))
  }, /**
   * Returns whether magicEffect has the specified flag.
   * @param magicEffect
   * @param flag
   * @returns {Boolean}
   */
  magicEffectHasFlag: function (magicEffect, flag) {
    return xelib.GetFlag(magicEffect, 'Magic Effect Data\\DATA - Data\\Flags',
      flag)
  },
}
