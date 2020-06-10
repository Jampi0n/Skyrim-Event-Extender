/* global xelib */

const shoutPerk = {
  wordPath: function (index) {return 'Words of Power\\[' + index + ']\\'},
  isShout: function (record) {
    const words = []
    const spells = []
    const spellLinks = []
    const cooldowns = []

    for (let i = 0; i < 3; ++i) {
      const path = this.wordPath(i)
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
  },
  patchShout: function (record) {
    for (let i = 0; i < 3; ++i) {
      let spell = xelib.GetLinksTo(record, this.wordPath(i) + 'Spell')
      spell = xelib.GetWinningOverride(spell)
      let currentPerk = xelib.GetLinksTo(spell, 'SPIT - Data\\Half-cost Perk')
      if (currentPerk !== 0) {
        let currentPerkFormID = xelib.GetFormID(currentPerk)
        if (currentPerkFormID !== fromEditorID('SpellIsShout')) {
          utils.log(`Shout spell ${xelib.GetHexFormID(
            spell)} already has a perk: ${xelib.Hex(currentPerkFormID)}`)
        }
        return
      }
      let copy = globals.helpers.copyToPatch(spell, false)
      xelib.SetUIntValue(copy, 'SPIT - Data\\Half-cost Perk',
        fromEditorID('SpellIsShout'))
    }
  },
}

new Patcher({
  name: 'shout-perk', createMaster: function (masterFile) {
    addRecord(masterFile, 'PERK', 'SpellIsShout', getFormIDs(this.name, 0)).
      init(function (record) {
        xelib.AddElement(record, 'FULL - Name')
        xelib.SetValue(record, 'FULL - Name', 'Spell Is Shout')
      })
  }, process: [
    {
      load: {
        signature: 'SHOU', filter: function (record, _name) {
          return shoutPerk.isShout(record)
        },
      }, patch: function (record, _name) {
        shoutPerk.patchShout(record)
      },
    }],
})
