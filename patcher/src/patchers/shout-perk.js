/* global xelib */

{
  /**
   *
   * @param {number} index
   * @return {string}
   */
  function getWordPath (index) {
    return 'Words of Power\\[' + index + ']\\'
  }

  /**
   *
   * @param {number} record
   * @return {boolean}
   */
  function isShout (record) {
    const words      = []
    const spells     = []
    const spellLinks = []
    const cooldowns  = []

    for (let i = 0; i < 3; ++i) {
      const path = getWordPath(i)
      words.push(xelib.GetValue(record, path + 'Word'))
      spells.push(xelib.GetValue(record, path + 'Spell'))
      spellLinks.push(xelib.GetLinksTo(record, path + 'Spell'))
      cooldowns.push(xelib.GetValue(record, path + 'Recovery Time'))
    }

    // If not 3 words are specified, the later spells have NULL REFERENCE.
    if (spellLinks[0] === 0 || spellLinks[1] === 0 || spellLinks[2] === 0) {
      return false
    }

    // If all words are equal then it is not a normal shout.
    if (words[0] === words[1] && words[1] === words[2]) {
      return false
    }

    // If all spells are equal cooldown needs to change.
    if (spells[0] === spells[1] && spells[1] === spells[2]) {
      if (cooldowns[0] === cooldowns[1] && cooldowns[1] === cooldowns[2]) {
        return false
      }
    }
    // If cooldown is too short it is not a normal shout.
    if (cooldowns[0] < 0.5 || cooldowns[1] < 0.5 || cooldowns[2] < 0.5) {
      return false
    }
    // Otherwise, the shout record is considered to be a real shout.
    return true
  }

  /**
   *
   * @param {number} record
   * @return {boolean}
   */
  function patchShout (record) {
    if (!isShout(record)) {
      return false
    }
    for (let i = 0; i < 3; ++i) {
      let spell       = xelib.GetLinksTo(record, getWordPath(i) + 'Spell')
      spell           = xelib.GetWinningOverride(spell)
      let currentPerk = xelib.GetLinksTo(spell, 'SPIT - Data\\Half-cost Perk')
      if (currentPerk !== 0) {
        let currentPerkFormID = xelib.GetFormID(currentPerk)
        if (currentPerkFormID !== Master.fromEditorID('SpellIsShout')) {
          Utils.log(`Shout spell ${xelib.GetHexFormID(
            spell)} already has a perk: ${xelib.Hex(currentPerkFormID)}`)
        }
        return false
      }
      let copy = globals.helpers.copyToPatch(spell, false)
      xelib.SetUIntValue(copy, 'SPIT - Data\\Half-cost Perk',
        Master.fromEditorID('SpellIsShout'))
    }
    return false
  }

  Patcher.add('shout-perk', 'Shout Spell Detection').master(() => {
    Master.addRecord('PERK', 'SpellIsShout', Patcher.getFormIDs(0)).init(function (record) {
      xelib.AddElement(record, 'FULL - Name')
      xelib.SetValue(record, 'FULL - Name', 'Spell Is Shout')
    })
  }).process('SHOU', patchShout)
}
