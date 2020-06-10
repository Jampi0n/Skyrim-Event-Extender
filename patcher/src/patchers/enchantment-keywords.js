/* global xelib */

let makeEnchantmentPatcher = function (signature, editorID) {
  return {
    load: {
      signature: signature, filter: function (record, _name) {
        return xelib.GetLinksTo(record, 'EITM - Object Effect') !== 0 &&
          !xelib.HasKeyword(record, xelib.Hex(0x000C27BD))
      },
    }, patch: function (record, name) {
      const enchantment = utils.winningOverride(
        xelib.GetLinksTo(record, 'EITM - Object Effect'))
      const baseEnchantment = utils.winningOverride(
        xelib.GetLinksTo(enchantment, 'ENIT - Effect Data\\Base Enchantment'))
      if (baseEnchantment !== 0) {
        const magicEffect = utils.winningOverride(
          xelib.GetLinksTo(baseEnchantment,
            'Effects\\[' + 0 + ']\\EFID - Base Effect'))
        if (magicEffect !== 0) {
          utils.addKeyword(globals.helpers.copyToPatch(magicEffect),
            fromEditorID(editorID))
        }
      }
    },
  }
}

new Patcher({
  name: 'enchantment-keywords', createMaster: function (masterFile) {
    addRecord(masterFile, 'KYWD', 'EnchantmentApparel',
      getFormIDs(this.name, 0))
    addRecord(masterFile, 'KYWD', 'EnchantmentWeapon', getFormIDs(this.name, 0))
  }, process: [
    makeEnchantmentPatcher('ARMO', 'EnchantmentApparel'),
    makeEnchantmentPatcher('WEAP', 'EnchantmentWeapon')],
})
