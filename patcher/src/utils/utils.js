/* global zedit, xelib */

class Utils {
  static log (msg) {
    switch (PATCHER_MODE) {
      case(PatcherModes.BUILD_MASTER):
        zedit.log(msg)
        break
      case(PatcherModes.RUN_PATCHER):
        if (globals.helpers !== null) {
          globals.helpers.logMessage(msg)
        }
        break
      default:
    }
  }

  static getLoadOrderOffset (file) {
    return xelib.GetFileLoadOrder(file) * 0x01000000
  }

  static winningOverride (id) {
    return id === 0 ? 0 : xelib.GetWinningOverride(id)
  }

  /**
   * Adds keyword with FormID keyword to record id.
   * @param {Number} record
   * @param {Number} keyword
   */
  static addKeyword (record, keyword) {
    if (!Utils.hasKeyword(record, keyword)) {
      xelib.AddKeyword(record, xelib.GetHexFormID(xelib.GetRecord(0, keyword)))
    }
  }

  /**
   * Returns whether record id has the keyword with FormID keyword.
   * @param {Number} record
   * @param {Number} keyword
   * @returns {Boolean}
   */
  static hasKeyword (record, keyword) {
    return xelib.HasKeyword(record,
      xelib.GetHexFormID(xelib.GetRecord(0, keyword)))
  }

  /**
   * Returns whether magicEffect has the specified flag.
   * @param magicEffect
   * @param flag
   * @returns {Boolean}
   */
  static magicEffectHasFlag (magicEffect, flag) {
    return xelib.GetFlag(magicEffect, 'Magic Effect Data\\DATA - Data\\Flags',
      flag)
  }

  static createFile (fileName) {
    let file = xelib.FileByName(fileName)
    if (file === 0) {
      file = xelib.AddFile(fileName)
    } else {
      xelib.NukeFile(file)
      xelib.CleanMasters(file)
    }
    return file
  }

  /**
   * Removes element from array. Returns true, if the element was found.
   * @template T
   * @param {T[]} array
   * @param {T} element
   * @return {boolean}
   */
  static removeFromArray (array, element) {
    const index = array.indexOf(element)
    if (index >= 0) {
      array.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Returns a new string without the prefix.
   * @param {string} string
   * @param {string} prefix
   */
  static removePrefix (string, prefix) {
    return string.slice(prefix.length)
  }

  /**
   *
   * @param {boolean} bool
   * @param {string} msg
   */
  static assert (bool, msg) {
    if (!bool) {
      Utils.log(msg)
      throw msg
    }
  }

}
