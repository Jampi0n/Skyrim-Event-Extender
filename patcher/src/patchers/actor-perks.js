/* global xelib */

const actorPerk = {
  perkList: [],
}

new Patcher({
  name: 'actor-perks', after: ['enchantment-keywords'], process: [
    {
      load: {
        signature: 'PERK', filter: function (record, _name) {
          return xelib.EditorID(record).startsWith(globals.prefix + '_AP_')
        },
      },

      patch: function (record, _name) {
        actorPerk.perkList.push(xelib.GetHexFormID(record))
      },
    }, {
      load: {
        signature: 'NPC_', filter: function (_record) {
          return actorPerk.perkList.length > 0
        },
      },

      patch: function (record) {
        for (const perk of actorPerk.perkList) {
          xelib.AddPerk(record, perk, '1')
        }
      },
    }],
})
