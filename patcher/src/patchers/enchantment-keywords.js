/* global xelib */

{
  /**
   * Adds the keyword belonging to editorID to all enchantment magic effects of
   * the item record.
   * @param {number} record
   * @param {string} editorID
   */
  function patchEnchEffects (record, editorID) {
    const enchantment     = Utils.winningOverride(
      xelib.GetLinksTo(record, 'EITM - Object Effect'))
    const baseEnchantment = Utils.winningOverride(
      xelib.GetLinksTo(enchantment, 'ENIT - Effect Data\\Base Enchantment'))
    for (let i = 0; true; ++i) {
      const magicEffect = Utils.winningOverride(
        xelib.GetLinksTo(baseEnchantment,
          'Effects\\[' + i + ']\\EFID - Base Effect'))
      if (magicEffect === 0) {
        break
      }
      Utils.addKeyword(globals.helpers.copyToPatch(magicEffect),
        Master.fromEditorID(editorID))
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
      !xelib.HasKeyword(record, xelib.Hex(0x000C27BD))
  }

  PatcherManager.add('enchantment-keywords', 'Enchantment Effect Keywords').master(() => {
    const formIDs = Allocator.getFormIDs(
      PatcherManager.getCurrentPatcher().getIdentifier(), 0)
    Master.addRecord('KYWD', 'EnchantmentApparel', formIDs)
    Master.addRecord('KYWD', 'EnchantmentWeapon', formIDs)
  }).process((record) => {
      patchEnchEffects(record, 'EnchantmentApparel')
    },
    'ARMO', canBeDisenchanted).process((record) => {
      patchEnchEffects(record, 'EnchantmentWeapon')
    }, 'WEAP',
    canBeDisenchanted)
}
