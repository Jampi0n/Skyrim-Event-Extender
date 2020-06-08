/* global xelib */

/**
 * Adds a perk to all actors.
 */
let actorPerk1 = {
  name: 'Actor Perk 1',

  perkList: [],

  initialize: function () {
    actorPerk1.perkList = []
  },

  load: {
    signature: 'PERK',
    filter: function (record) {
      return xelib.EditorID(record).startsWith(globals.prefix + '_AP_')
    },
  },

  patch: function (record) {
    actorPerk1.perkList.push(xelib.GetHexFormID(record))
  },
}

let actorPerk2 = {
  name: 'Actor Perk 2',

  initialize: function () {
  },

  load: {
    signature: 'NPC_',
    filter: function (_record) {
      return actorPerk1.perkList.length > 0
    },
  },

  patch: function (record) {
    for (let i = 0; i < actorPerk1.perkList.length; i++) {
      xelib.AddPerk(record, actorPerk1.perkList[i], '1')
    }
  },
}