/* global xelib */

{
  /** @type {Map.<number,boolean>} */
  let patchedBaseEnchantments
  /** @type {Map.<number,boolean>} */
  let patchedMagicEffects

  /**
   * Adds the keyword belonging to editorID to all enchantment magic effects of
   * the item record.
   * @param {string} editorID
   * @return {function(number):boolean}
   */
  function patchEnchEffects (editorID) {
    return record => {
      if (!canBeDisenchanted(record)) {
        return false
      }
      const enchantment     = Utils.winningOverride(
        xelib.GetLinksTo(record, 'EITM - Object Effect'))
      const baseEnchantment = Utils.winningOverride(
        xelib.GetLinksTo(enchantment, 'ENIT - Effect Data\\Base Enchantment'))
      if (baseEnchantment === 0) {
        return false
      }
      const baseEnchantmentFormID = xelib.GetFormID(baseEnchantment)
      if (!patchedBaseEnchantments.has(baseEnchantmentFormID)) {
        patchedBaseEnchantments.set(baseEnchantmentFormID, true)
        for (let i = 0; true; ++i) {
          const magicEffect = Utils.winningOverride(
            xelib.GetLinksTo(baseEnchantment,
              'Effects\\[' + i + ']\\EFID - Base Effect'))
          if (magicEffect === 0) {
            break
          }
          const magicEffectFormID = xelib.GetFormID(magicEffect)
          if (!patchedMagicEffects.has(magicEffectFormID)) {
            patchedMagicEffects.set(magicEffectFormID, true)
            Utils.addKeyword(globals.helpers.copyToPatch(magicEffect),
              Master.fromEditorID(editorID))
          }
        }
      }
      return false
    }
  }

  /**
   * Returns true, if the item has an enchantment and does not have the
   * DisallowEnchanting keyword.
   * @param {number} record
   * @return {boolean}
   */
  function canBeDisenchanted (record) {
    return xelib.GetLinksTo(record, 'EITM - Object Effect') !== 0 &&
      !Utils.hasKeyword(record, 0x000C27BD)
  }

  Patcher.add('enchantment-keywords', 'Enchantment Effect Keywords')
         .master(() => {
           const formIDs = Patcher.getFormIDs(0)
           Master.addRecord('KYWD', 'EnchantmentApparel', formIDs)
           Master.addRecord('KYWD', 'EnchantmentWeapon', formIDs)
         })
         .begin(_ => {
           patchedBaseEnchantments = new Map()
           patchedMagicEffects     = new Map()
         })
         .process('ARMO', patchEnchEffects('EnchantmentApparel'))
         .process('WEAP', patchEnchEffects('EnchantmentWeapon'))
}
