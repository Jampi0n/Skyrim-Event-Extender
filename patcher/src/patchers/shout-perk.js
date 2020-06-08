/* global xelib */
/**
 * Goes through all shout records (SHOU), searching for shouts that look like they can be used by the player.
 * The shouts' spells get the perk JPO__SpellIsShout, so they can be detected easily.
 */

let shoutPerk = {
  name: 'Shout Effect Keyword',

  initialize: function () {
    shoutPerk.perk = xelib.Hex(0x80C + globals.loadOrderOffset)
  },

  load: {
    signature: 'SHOU',
    filter: function (record) {
      let element = xelib.GetElement(record, 'Words of Power')
      let count = xelib.ElementCount(element)
      return (count === 3)
    },
  },

  getWord: function (record, index) {
    return xelib.GetValue(record, 'Words of Power\\[' + index + ']\\Word')
  },
  getSpell: function (record, index) {
    return xelib.GetValue(record, 'Words of Power\\[' + index + ']\\Spell')
  },
  getSpellLink: function (record, index) {
    return xelib.GetLinksTo(record, 'Words of Power\\[' + index + ']\\Spell')
  },
  getCooldown: function (record, index) {
    return xelib.GetValue(record,
      'Words of Power\\[' + index + ']\\Recovery Time')
  },

  patchSpell: function (record) {
    if (record === 0) {
      return
    }
    record = xelib.GetWinningOverride(record)
    let perk = xelib.GetLinksTo(record, 'SPIT - Data\\Half-cost Perk')
    if (perk !== 0) {
      let hex = xelib.Hex(xelib.GetFormID(perk))
      if (hex !== shoutPerk.perk) {
        globals.helpers.logMessage(`Unknown perk: ${hex}`)
      }
      return
    }
    let copy = globals.helpers.copyToPatch(record, false)
    xelib.SetValue(copy, 'SPIT - Data\\Half-cost Perk', shoutPerk.perk)

  },

  patch: function (record) {
    let words = [
      shoutPerk.getWord(record, 0),
      shoutPerk.getWord(record, 1),
      shoutPerk.getWord(record, 2)]
    let spells = [
      shoutPerk.getSpell(record, 0),
      shoutPerk.getSpell(record, 1),
      shoutPerk.getSpell(record, 2)]
    let spellLinks = [
      shoutPerk.getSpellLink(record, 0),
      shoutPerk.getSpellLink(record, 1),
      shoutPerk.getSpellLink(record, 2)]
    let cooldowns = [
      shoutPerk.getCooldown(record, 0),
      shoutPerk.getCooldown(record, 1),
      shoutPerk.getCooldown(record, 2)]

    // If not 3 words are specified, the later spells have NULL REFERENCE.
    if (spellLinks[0] === 0 || spellLinks[1] === 0 || spellLinks[2] === 0) {
      return
    }

    // If all words are equal then it is not a normal shout.
    if (words[0] === words[1] && words[1] === words[2]) {
      return
    }

    // If all spells are equal cooldown needs to change.
    if (spells[0] === spells[1] && spells[1] === spells[2]) {
      if (cooldowns[0] === cooldowns[1] && cooldowns[1] === cooldowns[2]) {
        return
      }
    }
    // If cooldown is too short it is not a normal shout.
    if (cooldowns[0] < 0.5 || cooldowns[1] < 0.5 || cooldowns[2] < 0.5) {
      return
    }

    shoutPerk.patchSpell(spellLinks[0])
    shoutPerk.patchSpell(spellLinks[1])
    shoutPerk.patchSpell(spellLinks[2])
  },
}