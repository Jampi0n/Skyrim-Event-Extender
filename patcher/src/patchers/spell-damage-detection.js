/* global xelib */

/**
 * Clones damaging magic effects on every fire/frost/shock spell.
 * The cloned effect contains scripts to detect the damage that was dealt.
 *
 */

/**
 * Each resistance type gets exactly one event. Even though magic effects with fire resist are also reduced by magic resistance,
 * only the event for fire spells will be triggered. The event for magic spells is only triggered, if the resit value is magic.
 * This is for performance reasons, so that each spell only triggers one event.
 */

class ResistanceType {
  constructor (name, resistValue, index) {
    this.name = name
    this.resistValue = resistValue
    this.index = index
    RT_ARRAY.push(this)
  }
}

class BonusEffect {
  constructor (magicEffectFormID, magnitudeFactor) {
    this.magicEffectFormID = magicEffectFormID
    this.magnitudeFactor = magnitudeFactor
  }
}

let RT_ARRAY = []
let RT_NONE = new ResistanceType('None', 'None', 0)
let RT_FIRE = new ResistanceType('Fire', 'Resist Fire', 1)
let RT_FROST = new ResistanceType('Frost', 'Resist Frost', 2)
let RT_SHOCK = new ResistanceType('Shock', 'Resist Shock', 3)
let RT_MAGIC = new ResistanceType('Magic', 'Resist Magic', 4)
let RT_POISON = new ResistanceType('Poison', 'Poison Resist', 5)
let RT_DISEASE = new ResistanceType('Disease', 'Disease Resist', 6)
let RT_PHYSICAL = new ResistanceType('Physical', 'Damage Resist', 7)

let getResistanceType = function (record) {
  let resistValue = xelib.GetValue(record,
    'Magic Effect Data\\DATA - Data\\Resist Value')

  for (let i = 0; i < RT_ARRAY.length; ++i) {
    if (resistValue === RT_ARRAY[i].resistValue) {
      return i
    }
  }
  return -1
}

let spellDamageDetection1 = {
  name: 'Spell Damage Detection 1',

  spellListConc: [],
  spellListFireAndForget: [],

  initialize: function () {
    spellDamageDetection1.spellListConc = [[], [], [], [], [], [], [], []]
    spellDamageDetection1.spellListFireAndForget = [
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      []]
  },

  load: {
    signature: 'SPEL',
    filter: function (record) {
      return xelib.EditorID(record).startsWith(globals.prefix + '_BE_')
    },
  },
  patch: function (record) {
    let editorID = xelib.EditorID(record)
    let fireAndForget = false
    let concentration = false

    editorID = editorID.substring((globals.prefix + '_BE_').length,
      editorID.length)
    if (editorID.startsWith('FF_')) {
      editorID = editorID.substring(3, editorID.length)
      fireAndForget = true
    } else if (editorID.startsWith('CONC_')) {
      editorID = editorID.substring(5, editorID.length)
      concentration = true
    } else if (editorID.startsWith('ANY_')) {
      editorID = editorID.substring(4, editorID.length)
      fireAndForget = true
      concentration = true
    }

    let doWhile = true
    while (doWhile) {
      doWhile = false
      for (let i = 0; i < RT_ARRAY.length; ++i) {
        if (editorID.startsWith(RT_ARRAY[i].name)) {
          let formID = xelib.GetHexFormID(record)
          if (concentration) {
            spellDamageDetection1.spellListConc[i].push(record)
            globals.helpers.logMessage(
              `Adding spell ${formID} to spell list of type ${RT_ARRAY[i].name} for concentration spells.`)
          }
          if (fireAndForget) {
            spellDamageDetection1.spellListFireAndForget[i].push(record)
            globals.helpers.logMessage(
              `Adding spell ${formID} to spell list of type ${RT_ARRAY[i].name} for fire and forget spells.`)
          }
          editorID = editorID.substring(RT_ARRAY[i].name.length,
            editorID.length)
          doWhile = true
        }
      }
    }
  },
}

let removePrefix = function (editorID) {
  editorID = editorID.substring(7, editorID.length)
  if (editorID.startsWith('FF_')) {
    editorID = editorID.substring(3, editorID.length)
  } else if (editorID.startsWith('CONC_')) {
    editorID = editorID.substring(5, editorID.length)
  } else if (editorID.startsWith('ANY_')) {
    editorID = editorID.substring(4, editorID.length)
  }

  let doWhile = true
  while (doWhile) {
    doWhile = false
    for (let i = 0; i < RT_ARRAY.length; ++i) {
      if (editorID.startsWith(RT_ARRAY[i].name)) {
        editorID = editorID.substring(RT_ARRAY[i].name.length + 1,
          editorID.length)
        doWhile = true
      }
    }
  }
  return editorID
}

let patchSpellEffect = function (
  spell, magicEffect, resistanceType, magicEffectIndex) {
  let magicEffectFormID = xelib.GetFormID(magicEffect)
  // If the base effect has no generated magic effects, they need to be created
  if (!spellDamageDetection2.copiedMagicEffects.has(magicEffectFormID)) {
    // Start with empty list
    spellDamageDetection2.copiedMagicEffects.set(magicEffectFormID, [])
    // Loop over source spells and their magic effects
    let castTypeId = xelib.GetUIntValue(spell, 'SPIT - Data\\Cast Type')
    let spellList
    if (castTypeId === 1) {
      spellList = spellDamageDetection1.spellListFireAndForget[resistanceType]
    } else {
      spellList = spellDamageDetection1.spellListConc[resistanceType]
    }
    for (let i = 0; i < spellList.length; ++i) {
      for (let j = 0; true; ++j) {
        let sourceEffect = xelib.GetElement(spellList[i],
          'Effects\\[' + j + ']')
        if (sourceEffect === 0) {
          break
        }
        let sourceBase = xelib.GetLinksTo(spellList[i],
          'Effects\\[' + j + ']\\EFID - Base Effect')
        if (sourceBase === 0) {
          let formID = xelib.GetHexFormID(spellList[i])
          globals.helpers.logMessage(`baseEffect==0: ${formID}`)
          continue
        }
        sourceBase = xelib.GetWinningOverride(sourceBase)

        // Copy the base effect from the source spell
        xelib.AddRequiredMasters(sourceBase, globals.patchFile)
        let copy = globals.helpers.copyToPatch(sourceBase, true)
        globals.helpers.cacheRecord(copy,
          'JEE__' + xelib.EditorID(magicEffect) + '_' +
          removePrefix(xelib.EditorID(spellList[i])) + '_' + j)
        xelib.AddElementValue(copy, 'FULL - Name',
          'JEE__' + xelib.FullName(magicEffect) + '_' +
          xelib.FullName(spellList[i]) + '_' + j)

        // Edit generated magic effect:
        // The generated magic effect is now the same as the source magic effect.
        // Target and fire behavior needs to be adjusted to original behavior.
        // Conditions need to be added from the original behavior.

        xelib.SetValue(copy, 'Magic Effect Data\\DATA - Data\\Casting Type',
          xelib.GetValue(magicEffect,
            'Magic Effect Data\\DATA - Data\\Casting Type'))
        xelib.SetValue(copy, 'Magic Effect Data\\DATA - Data\\Delivery',
          xelib.GetValue(magicEffect,
            'Magic Effect Data\\DATA - Data\\Delivery'))
        xelib.SetValue(copy,
          'Magic Effect Data\\DATA - Data\\Spellmaking\\Area',
          xelib.GetValue(magicEffect,
            'Magic Effect Data\\DATA - Data\\Spellmaking\\Area'))
        xelib.SetValue(copy,
          'Magic Effect Data\\DATA - Data\\Spellmaking\\Casting Time',
          xelib.GetValue(magicEffect,
            'Magic Effect Data\\DATA - Data\\Spellmaking\\Casting Time'))

        // let spellID = xelib.GetHexFormID(spell);
        // let copyID = xelib.GetHexFormID(copy)
        // globals.helpers.logMessage(`spell: ${spellID} copy: ${copyID}`);

        for (let k = 0; true; ++k) {
          let originalCondition = xelib.GetElement(magicEffect,
            'Conditions\\[' + k + ']')
          if (originalCondition === 0) {
            break
          }
          xelib.CopyElement(originalCondition,
            xelib.GetElement(copy, 'Conditions'))
        }

        // Check conditions for references to the sourceBase and replace it by references to the copy.
        for (let k = 0; true; ++k) {
          let condition = xelib.GetElement(copy, 'Conditions\\[' + k + ']')
          if (condition === 0) {
            break
          }
          if (xelib.GetValue(condition, 'CTDA - \\Function') ===
            'HasMagicEffect') {
            let conditionMagicEffectID = xelib.GetUIntValue(condition,
              'CTDA - \\Parameter #1')
            let sourceBaseID = xelib.GetFormID(sourceBase)
            if (conditionMagicEffectID === sourceBaseID) {
              xelib.SetUIntValue(condition, 'CTDA - \\Parameter #1',
                xelib.GetFormID(copy))
            }
          }
        }

        // Store the generated magic effects for the original magic effect
        // Also store the factor, which is defined in the source spell
        let bonusEffect = new BonusEffect(xelib.GetFormID(copy),
          xelib.GetFloatValue(sourceEffect, 'EFIT - \\Magnitude'))
        spellDamageDetection2.copiedMagicEffects.get(magicEffectFormID).
          push(bonusEffect)
      }
    }
  }

  // Find the stored bonus effects for each magic effect and add them to the spell
  if (spellDamageDetection2.copiedMagicEffects.has(magicEffectFormID)) {
    let oldEffect = xelib.GetElement(spell,
      'Effects\\[' + magicEffectIndex + ']')
    let bonusEffects = spellDamageDetection2.copiedMagicEffects.get(
      magicEffectFormID)
    for (let i = 0; i < bonusEffects.length; ++i) {
      let newEffect = xelib.CopyElement(oldEffect, spell)
      let bonusEffect = bonusEffects[i]

      xelib.SetUIntValue(newEffect, 'EFID - Base Effect',
        bonusEffect.magicEffectFormID)
      let mag = xelib.GetFloatValue(newEffect, 'EFIT - \\Magnitude')
      xelib.SetFloatValue(newEffect, 'EFIT - \\Magnitude',
        mag * bonusEffect.magnitudeFactor)

      let dur = xelib.GetIntValue(newEffect, 'EFIT - \\Duration')
      if (dur === 0) {
        xelib.SetValue(newEffect, 'EFIT - \\Duration', '1')
      }
    }
  }

}

let spellDamageDetection2 = {
  name: 'Spell Damage Detection 2',

  ignoreKeyword: 'JEE_OnHit_NoHitEvent',

  initialize: function () {
    // Stores the corresponding generated magic effects for every patched base effect
    spellDamageDetection2.copiedMagicEffects = new Map([[0, 0]])
  },

  load: {
    signature: 'SPEL',
    filter: function (record) {
      // Ignore source spells
      if (xelib.EditorID(record).startsWith('JEE_BE_')) {
        return false
      }

      // Only concentration and fire & forget are allowed
      let castTypeId = xelib.GetIntValue(record, 'SPIT - Data\\Cast Type')
      if (castTypeId !== 1 && castTypeId !== 2) {
        return false
      }

      // Check if the spell has damaging effects
      for (let j = 0; true; j++) {
        // Magic effect in the spell list
        let magicEffect = xelib.GetElement(record, 'Effects\\[' + j + ']')
        if (magicEffect === 0) {
          break
        }
        // Base magic effect record
        magicEffect = xelib.GetLinksTo(record,
          'Effects\\[' + j + ']\\EFID - Base Effect')
        if (magicEffect === 0) {
          let formID = xelib.GetHexFormID(record)
          globals.helpers.logMessage(`baseEffect==0: ${formID}`)
          continue
        }
        // Base magic effect record - winning override
        magicEffect = xelib.GetWinningOverride(magicEffect)

        // Check if the magic effect is damaging
        if (!hasFlag(magicEffect, 'Detrimental')) {
          continue
        }
        if (hasFlag(magicEffect, 'Recover')) {
          continue
        }
        let archtype = xelib.GetValue(magicEffect,
          'Magic Effect Data\\DATA - Data\\Archtype')
        let av1 = xelib.GetValue(magicEffect,
          'Magic Effect Data\\DATA - Data\\Actor Value')
        let av2 = xelib.GetValue(magicEffect,
          'Magic Effect Data\\DATA - Data\\Second Actor Value')
        if (archtype === 'Value Modifier' || archtype ===
          'Peak Value Modifier') {
          if (av1 === 'Health') {
            return true
          }
        }
        if (archtype === 'Dual Value Modifier') {
          if (av1 === 'Health' || av2 === 'Health') {
            return true
          }
        }
      }
      return false
    },
  },

  patch: function (record) {
    // Count number of magic effects in the spell list
    let j
    for (j = 0; true; j++) {
      let magicEffect = xelib.GetElement(record, 'Effects\\[' + j + ']')
      if (magicEffect === 0) {
        break
      }
      magicEffect = xelib.GetLinksTo(record,
        'Effects\\[' + j + ']\\EFID - Base Effect')
      if (magicEffect === 0) {
        let formID = xelib.GetHexFormID(record)
        globals.helpers.logMessage(`baseEffect==0: ${formID}`)
      }
    }
    // Store number of magic effects before the patch
    let n = j
    for (j = 0; j < n; j++) {
      // Check if the magic effect is damaging, see also the filter function
      let patchEffect = false
      let magicEffect = xelib.GetElement(record, 'Effects\\[' + j + ']')
      if (magicEffect === 0) {
        break
      }
      magicEffect = xelib.GetLinksTo(record,
        'Effects\\[' + j + ']\\EFID - Base Effect')
      if (magicEffect === 0) {
        let formID = xelib.GetHexFormID(record)
        globals.helpers.logMessage(`baseEffect==0: ${formID}`)
        continue
      }
      magicEffect = xelib.GetWinningOverride(magicEffect)

      if (!hasFlag(magicEffect, 'Detrimental')) {
        continue
      }
      if (hasFlag(magicEffect, 'Recover')) {
        continue
      }
      if (xelib.GetValue(record, 'Effects\\[' + j + ']\\EFIT - \\Magnitude') <=
        0) {
        continue
      }
      let archtype = xelib.GetValue(magicEffect,
        'Magic Effect Data\\DATA - Data\\Archtype')
      let av1 = xelib.GetValue(magicEffect,
        'Magic Effect Data\\DATA - Data\\Actor Value')
      let av2 = xelib.GetValue(magicEffect,
        'Magic Effect Data\\DATA - Data\\Second Actor Value')
      if (archtype === 'Value Modifier' || archtype === 'Peak Value Modifier') {
        if (av1 === 'Health') {
          patchEffect = true
        }
      }
      if (archtype === 'Dual Value Modifier') {
        if (av1 === 'Health' || av2 === 'Health') {
          patchEffect = true
        }
      }

      // Get resist value
      let resistanceType = getResistanceType(magicEffect)
      if (resistanceType === -1) {
        let formID = xelib.GetHexFormID(record)
        globals.helpers.logMessage(`unknown resistance type: ${formID}`)
        patchEffect = false
      }

      // All checks passed, patch the spell + magic effect
      if (patchEffect) {
        patchSpellEffect(record, magicEffect, resistanceType, j)
      }

    }

  },
}


