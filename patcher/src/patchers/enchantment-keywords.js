/* global xelib */

/**
 * Adds keywords to all base enchantments that can be available to the player.
 * Apparel and weapons get different keywords.
 * Can be used to increase number of charges of weapon enchantments by reducing magicka cost with a perk.
 */

let enchantmentKeywords = {
  patch: function (record, object) {
    let ench = xelib.GetWinningOverride(
      xelib.GetLinksTo(record, 'EITM - Object Effect'))
    let baseEnch = xelib.GetLinksTo(ench,
      'ENIT - Effect Data\\Base Enchantment')
    if (baseEnch !== 0) {
      baseEnch = xelib.GetWinningOverride(baseEnch)
      let mEffect = xelib.GetLinksTo(baseEnch,
        'Effects\\[' + 0 + ']\\EFID - Base Effect')
      if (mEffect !== 0) {
        mEffect = xelib.GetWinningOverride(mEffect)
        let copy = globals.helpers.copyToPatch(mEffect)
        if (!xelib.HasKeyword(copy, object.keyword)) {
          xelib.AddKeyword(copy, object.keyword)
        }
      }
    }
  },
}

let armorEnchantments = {
  name: 'Armor Enchantments',

  initialize: function () {
    armorEnchantments.keyword = xelib.Hex(0x80A + globals.loadOrderOffset)
    armorEnchantments.noDisenchant = xelib.Hex(0x000C27BD)
  },

  load: {
    signature: 'ARMO',
    filter: function (record) {
      return xelib.GetLinksTo(record, 'EITM - Object Effect') !== 0 &&
        !xelib.HasKeyword(record, armorEnchantments.noDisenchant)
    },
  },

  patch: function (record) {
    enchantmentKeywords.patch(record, armorEnchantments)
  },
}

let weaponEnchantments = {
  name: 'Weapon Enchantments',

  initialize: function () {
    weaponEnchantments.keyword = xelib.Hex(0x80B + globals.loadOrderOffset)
    weaponEnchantments.noDisenchant = xelib.Hex(0x000C27BD)
  },

  load: {
    signature: 'WEAP',
    filter: function (record) {
      return xelib.GetLinksTo(record, 'EITM - Object Effect') !== 0 &&
        !xelib.HasKeyword(record, weaponEnchantments.noDisenchant)
    },
  },

  patch: function (record) {
    enchantmentKeywords.patch(record, weaponEnchantments)
  },
}