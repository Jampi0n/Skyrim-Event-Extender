/* global xelib */

{
  const BONUS_EFFECT_PREFIX_ = PREFIX_ + 'BE_'

  class ResistType {
    name
    resistValue
    index
    static AllTypes = []

    constructor (name, resistValue) {
      this.name        = name
      this.resistValue = resistValue
      this.index       = ResistType.AllTypes.length
      ResistType.AllTypes.push(this)
    }
  }

  class BonusEffect {
    constructor (magicEffectFormID, magnitudeFactor) {
      this.magicEffectFormID = magicEffectFormID
      this.magnitudeFactor   = magnitudeFactor
    }
  }

  new ResistType('None', 'None')
  new ResistType('Fire', 'Resist Fire')
  new ResistType('Frost', 'Resist Frost')
  new ResistType('Shock', 'Resist Shock')
  new ResistType('Magic', 'Resist Magic')
  new ResistType('Poison', 'Poison Resist')
  new ResistType('Disease', 'Disease Resist')
  new ResistType('Physical', 'Damage Resist')

  function getResistType (record) {
    let resistValue = xelib.GetValue(record,
      'Magic Effect Data\\DATA - Data\\Resist Value')

    for (let i = 0; i < ResistType.AllTypes.length; ++i) {
      if (resistValue === ResistType.AllTypes[i].resistValue) {
        return i
      }
    }
    return -1
  }

  let spellListConc          = []
  let spellListFireAndForget = []
  let copiedMagicEffects     = null

  function initialize () {
    copiedMagicEffects = new Map([[0, 0]])
    for (const iResistType of ResistType.AllTypes) {
      spellListConc.push([])
      spellListFireAndForget.push([])
    }
  }

  /**
   * @readonly
   * @enum {number}
   */
  const CastTypes = {
    NONE: 0,
    FIRE_AND_FORGET: 1,
    CONCENTRATION: 2,
    ANY: 3,
  }

  /**
   * Checks for the bonus effects prefix and removes it.
   * @param {string} string
   * @return {string}
   */
  function parsePrefix (string) {
    if (string.startsWith(BONUS_EFFECT_PREFIX_)) {
      return Utils.removePrefix(string, BONUS_EFFECT_PREFIX_)
    }
    return ''
  }

  /**
   * Checks for a cast type prefix and removes it.
   * @param {string} string
   * @return {{string:string, castType:CastTypes}}
   */
  function parseCastType (string) {
    const prefixes  = ['FF_', 'CONC_', 'ANY_']
    const castTypes = [
      CastTypes.FIRE_AND_FORGET, CastTypes.CONCENTRATION, CastTypes.ANY,
    ]
    for (let i = 0; i < 3; ++i) {
      if (string.startsWith(prefixes[i])) {
        return {
          string: Utils.removePrefix(string, prefixes[i]),
          castType: castTypes[i],
        }
      }
    }
    return {
      string: string,
      castType: CastTypes.NONE,
    }
  }

  /**
   * Checks for resistance type prefixes and removes them.
   * @param {string} string
   * @return {{string:string, resistTypes:ResistType[]}}
   */
  function parseResistTypes (string) {
    const resistTypes = []
    while (true) {
      const prev = string
      for (const iResistType of ResistType.AllTypes) {
        const prefix = iResistType.name + '_'
        if (string.startsWith(prefix)) {
          string = Utils.removePrefix(string, prefix)
          resistTypes.push(iResistType)
        }
      }
      if (prev === string) {
        break
      }
    }
    return {
      string: string,
      resistTypes: resistTypes,
    }
  }

  /**
   * Removes the entire prefix from the editorID.
   * @param editorID
   * @return {string}
   */
  function removePrefix (editorID) {
    editorID = parsePrefix(editorID)
    if (editorID) {
      editorID = parseCastType(editorID).string
      editorID = parseResistTypes(editorID).string
    }
    return editorID
  }

  /**
   * Parses a spell record and adds it to the corresponding spell lists.
   * @param {number} record
   * @return {boolean}
   */
  function parseSourceSpell (record) {
    let editorID = xelib.EditorID(record)
    if (editorID === '') {
      return false
    }
    editorID = parsePrefix(editorID)

    let result     = parseCastType(editorID)
    const castType = result.castType

    result            = parseResistTypes(result.string)
    const resistTypes = result.resistTypes

    const fireAndForget = castType === CastTypes.ANY || castType === CastTypes.FIRE_AND_FORGET
    const concentration = castType === CastTypes.ANY || castType === CastTypes.CONCENTRATION

    for (const iResistType of resistTypes) {
      const formID = xelib.GetHexFormID(record)
      const index  = iResistType.index
      if (concentration) {
        spellListConc[index].push(record)
        Utils.log(
          `Adding spell ${formID} to spell list of type ${ResistType.AllTypes[index].name} for concentration spells.`)
      }
      if (fireAndForget) {
        spellListFireAndForget[index].push(record)
        Utils.log(
          `Adding spell ${formID} to spell list of type ${ResistType.AllTypes[index].name} for fire and forget spells.`)
      }
    }
    return false
  }

  /**
   *
   * @param {number} spell
   * @param {number} index
   */
  function getEffect (spell, index) {
    const magicEffect = xelib.GetLinksTo(spell,
      'Effects\\[' + index + ']\\EFID - Base Effect')
    if (magicEffect === 0) {
      Utils.log('The spell ' + xelib.GetHexFormID(spell) +
        ' has no base magic effect at index ' + index + '.')
      return 0
    }
    return xelib.GetWinningOverride(magicEffect)
  }

  /**
   *
   * @param {number} spell
   * @param {function(number, number)} callback
   * @return {number} The number of magic effects.
   */
  function doForAllEffects (spell, callback) {
    for (let i = 0; true; i++) {
      let magicEffect = xelib.GetElement(spell, 'Effects\\[' + i + ']')
      if (magicEffect === 0) {
        return i - 1
      }
      callback(spell, getEffect(spell, i))
    }
  }

  /**
   * Adds a bonus effect to the spell record spell for its magic effect with
   * index effectIndex and base effect baseEffect.
   * @param spell The spell, for which a bonus effect is added.
   * @param baseEffect The base effect of the damaging spell.
   * @param resistType The resist type of the damaging spell.
   * @param effectIndex The magic effect index of the damaging spell.
   * @param secondAV Whether the damaging part of the spell is the
   *   second actor value.
   */
  function patchSpellEffect (
    spell, baseEffect, resistType, effectIndex, secondAV) {
    let magicEffectFormID = xelib.GetFormID(baseEffect)
    // If the base effect has no generated magic effects, they need to be
    // created
    if (!copiedMagicEffects.has(magicEffectFormID)) {
      // Start with empty list
      copiedMagicEffects.set(magicEffectFormID, [])
      // Loop over source spells and their magic effects
      let castTypeId = xelib.GetUIntValue(spell, 'SPIT - Data\\Cast Type')
      let spellList
      if (castTypeId === CastTypes.FIRE_AND_FORGET) {
        spellList = spellListFireAndForget[resistType]
      } else {
        spellList = spellListConc[resistType]
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
            Utils.log(`baseEffect==0: ${formID}`)
            continue
          }
          sourceBase = xelib.GetWinningOverride(sourceBase)

          // Copy the base effect from the source spell
          xelib.AddRequiredMasters(sourceBase, globals.patchFile)
          let copy = globals.helpers.copyToPatch(sourceBase, true)
          globals.helpers.cacheRecord(copy,
            'JEE__' + xelib.EditorID(baseEffect) + '_' +
            removePrefix(xelib.EditorID(spellList[i])) + '_' + j)
          xelib.AddElementValue(copy, 'FULL - Name',
            'JEE__' + xelib.FullName(baseEffect) + '_' +
            xelib.FullName(spellList[i]) + '_' + j)

          // Edit generated magic effect:
          // The generated magic effect is now the same as the source magic
          // effect. Target and fire behavior needs to be adjusted to original
          // behavior. Conditions need to be added from the original behavior.

          xelib.SetValue(copy, 'Magic Effect Data\\DATA - Data\\Casting Type',
            xelib.GetValue(baseEffect,
              'Magic Effect Data\\DATA - Data\\Casting Type'))
          xelib.SetValue(copy, 'Magic Effect Data\\DATA - Data\\Delivery',
            xelib.GetValue(baseEffect,
              'Magic Effect Data\\DATA - Data\\Delivery'))
          xelib.SetValue(copy,
            'Magic Effect Data\\DATA - Data\\Spellmaking\\Area',
            xelib.GetValue(baseEffect,
              'Magic Effect Data\\DATA - Data\\Spellmaking\\Area'))
          xelib.SetValue(copy,
            'Magic Effect Data\\DATA - Data\\Spellmaking\\Casting Time',
            xelib.GetValue(baseEffect,
              'Magic Effect Data\\DATA - Data\\Spellmaking\\Casting Time'))

          for (let k = 0; true; ++k) {
            let originalCondition = xelib.GetElement(baseEffect,
              'Conditions\\[' + k + ']')
            if (originalCondition === 0) {
              break
            }
            xelib.CopyElement(originalCondition,
              xelib.GetElement(copy, 'Conditions'))
          }

          // Check conditions for references to the sourceBase and replace it
          // by references to the copy.
          for (let k = 0; true; ++k) {
            let condition = xelib.GetElement(copy, 'Conditions\\[' + k + ']')
            if (condition === 0) {
              break
            }
            if (xelib.GetValue(condition, 'CTDA - \\Function') ===
              'HasMagicEffect') {
              let conditionMagicEffectID = xelib.GetUIntValue(condition,
                'CTDA - \\Parameter #1')
              let sourceBaseID           = xelib.GetFormID(sourceBase)
              if (conditionMagicEffectID === sourceBaseID) {
                xelib.SetUIntValue(condition, 'CTDA - \\Parameter #1',
                  xelib.GetFormID(copy))
              }
            }
          }

          // Store the generated magic effects for the original magic effect
          // Also store the factor, which is defined in the source spell
          let magnitude = xelib.GetFloatValue(sourceEffect,
            'EFIT - \\Magnitude')
          if (secondAV) {
            const secondWeight = xelib.GetFloatValue(baseEffect,
              'Magic Effect Data\\DATA - Data\\Second AV Weight')
            if (secondWeight <= 0) {
              Utils.log('Dual Value Modifier 0 Weight: ' +
                xelib.GetHexFormID(baseEffect))
            }
            magnitude *= secondWeight
          }

          let bonusEffect = new BonusEffect(xelib.GetFormID(copy), magnitude)
          copiedMagicEffects.get(magicEffectFormID).push(bonusEffect)
        }
      }
    }

    // Find the stored bonus effects for each magic effect and add them to the
    // spell
    if (copiedMagicEffects.has(magicEffectFormID)) {
      let oldEffect    = xelib.GetElement(spell, 'Effects\\[' + effectIndex + ']')
      let bonusEffects = copiedMagicEffects.get(magicEffectFormID)
      for (let i = 0; i < bonusEffects.length; ++i) {
        let newEffect   = xelib.CopyElement(oldEffect, spell)
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

  /**
   * Adds bonus effects for each damaging magic effect of the spell.
   * @param record
   * @return {boolean}
   */
  function patchSpell (record) {
    let copied                 = false
    const numberOfMagicEffects = doForAllEffects(record, (_) => {
    })
    for (let i = 0; i < numberOfMagicEffects; ++i) {
      let patchEffect   = false
      const magicEffect = getEffect(record, i)
      const effectPath  = 'Effects\\[' + i + ']\\EFIT - \\'
      if (!Utils.magicEffectHasFlag(magicEffect, 'Detrimental')) {
        continue
      }
      if (Utils.magicEffectHasFlag(magicEffect, 'Recover')) {
        continue
      }
      if (xelib.GetValue(record, effectPath + 'Magnitude') <= 0) {
        continue
      }
      const dataPath = 'Magic Effect Data\\DATA - Data\\'
      let archtype   = xelib.GetValue(magicEffect, dataPath + 'Archtype')
      let av1        = xelib.GetValue(magicEffect, dataPath + 'Actor Value')
      let av2        = xelib.GetValue(magicEffect, dataPath + 'Second Actor Value')
      if (archtype === 'Value Modifier' || archtype === 'Peak Value Modifier') {
        if (av1 === 'Health') {
          patchEffect = true
        }
      }
      let secondActorValue = false
      if (archtype === 'Dual Value Modifier') {
        if (av2 === 'Health') {
          patchEffect      = true
          secondActorValue = true
          if (av1 === 'Health') {
            let formID = xelib.GetHexFormID(record)
            Utils.log('Dual Value Modifier Health+Health: ' + formID)
          }
        }
        if (av1 === 'Health') {
          patchEffect = true
        }
      }

      // Get resist value
      let resistType = getResistType(magicEffect)
      if (resistType === -1) {
        let formID = xelib.GetHexFormID(record)
        Utils.log('Unknown resist type: ' + formID)
        patchEffect = false
      }

      // All checks passed, patch the spell + magic effect
      if (patchEffect) {
        if (!copied) {
          copied = true
          record = globals.helpers.copyToPatch(record, false)
        }
        patchSpellEffect(record, magicEffect, resistType, i,
          secondActorValue)
      }
    }
    return false
  }

  Patcher.add('spell-damage-detection', 'Damage Spells Bonus Effects')
         .begin(() => initialize())
         .process('SPEL', parseSourceSpell)
         .process('SPEL', patchSpell)
}
