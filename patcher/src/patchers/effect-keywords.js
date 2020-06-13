/* global xelib */

{
  const resistNames = [
    'Any',
    'None',
    'Fire',
    'Frost',
    'Shock',
    'Elemental',
    'Magic',
    'MagicOrElemental',
    'Poison',
    'Disease',
    'Damage',
  ]
  const resistRules = {
    'None': ['Any', 'None'],
    'Resist Fire': ['Any', 'Fire', 'Elemental', 'MagicOrElemental'],
    'Resist Frost': ['Any', 'Frost', 'Elemental', 'MagicOrElemental'],
    'Resist Shock': ['Any', 'Shock', 'Elemental', 'MagicOrElemental'],
    'Resist Magic': ['Any', 'Magic', 'MagicOrElemental'],
    'Poison Resist': ['Any', 'Poison'],
    'Disease Resist': ['Any', 'Disease'],
    'Damage Resist': ['Any', 'Damage'],
  }

  /** @type { (function(number):number[])[] } */
  const keywordRules = []

  /**
   * @param {function(number):number[]} keywordRule
   */
  function addKeywordRule (keywordRule) {
    keywordRules.push(keywordRule)
  }

  function isDamagingEffect (magicEffect) {
    // [X] Detrimental
    // [ ] Recover
    // Value Modifier
    //  - Actor Value == Health
    // Peak Value Modifier
    // - Actor Value == Health
    // Dual Value Modifier
    // - Actor Value == Health || Second Actor Value == Health
    if (!Utils.magicEffectHasFlag(magicEffect, 'Detrimental')) {
      return false
    }
    if (Utils.magicEffectHasFlag(magicEffect, 'Recover')) {
      return false
    }
    let archType = xelib.GetValue(magicEffect,
      'Magic Effect Data\\DATA - Data\\Archtype')
    let av1      = xelib.GetValue(magicEffect,
      'Magic Effect Data\\DATA - Data\\Actor Value')
    let av2      = xelib.GetValue(magicEffect,
      'Magic Effect Data\\DATA - Data\\Second Actor Value')
    if (archType === 'Absorb') {
      return av1 === 'Health'
    }
    if (archType === 'Value Modifier') {
      return av1 === 'Health'
    }
    if (archType === 'Peak Value Modifier') {
      return av1 === 'Health'
    }
    if (archType === 'Dual Value Modifier') {
      return av1 === 'Health' || av2 === 'Health'
    }
    return false
  }

  addKeywordRule(record => {
    const keywords = []
    if (isDamagingEffect(record)) {
      let resist = xelib.GetValue(record,
        'Magic Effect Data\\DATA - Data\\Resist Value')
      for (const iEffectName of resistRules[resist]) {
        keywords.push(
          Patcher.getFormID(0, 4 + resistNames.indexOf(iEffectName)))
      }
    }
    return keywords
  })

  addKeywordRule(record => {
    const keywords = [Patcher.getFormID(0, 0)]
    let restore    = false
    if (Utils.magicEffectHasFlag(record, 'Detrimental')) {
      return []
    }
    if (Utils.magicEffectHasFlag(record, 'Recover')) {
      return []
    }
    let archType = xelib.GetValue(record,
      'Magic Effect Data\\DATA - Data\\Archtype')
    let av1      = xelib.GetValue(record,
      'Magic Effect Data\\DATA - Data\\Actor Value')
    let av2      = xelib.GetValue(record,
      'Magic Effect Data\\DATA - Data\\Second Actor Value')
    if (archType === 'Value Modifier' || archType === 'Peak Value Modifier') {
      if (av1 === 'Health') {
        restore = true
        keywords.push(Patcher.getFormID(0, 1))
      } else if (av1 === 'Magicka') {
        restore = true
        keywords.push(Patcher.getFormID(0, 2))
      } else if (av1 === 'Stamina') {
        restore = true
        keywords.push(Patcher.getFormID(0, 3))
      }
    }
    if (archType === 'Dual Value Modifier') {
      if (av1 === 'Health' || av2 === 'Health') {
        restore = true
        keywords.push(Patcher.getFormID(0, 1))
      }
      if (av1 === 'Magicka' || av2 === 'Magicka') {
        restore = true
        keywords.push(Patcher.getFormID(0, 2))
      }
      if (av1 === 'Stamina' || av2 === 'Stamina') {
        restore = true
        keywords.push(Patcher.getFormID(0, 3))
      }
    }
    if (restore) {
      return keywords
    }
    return []
  })

  Patcher.add('effect-keywords', 'Magic Effect Keywords',
    ['summon-detection', 'spell-damage-detection']).master(() => {
    const formIDs = Patcher.getFormIDs(0)
    Master.addRecord('KYWD', 'EffectRestoreAny', formIDs)
    Master.addRecord('KYWD', 'EffectRestoreHealth', formIDs)
    Master.addRecord('KYWD', 'EffectRestoreMagicka', formIDs)
    Master.addRecord('KYWD', 'EffectRestoreStamina', formIDs)
    for (const iResistName of resistNames) {
      Master.addRecord('KYWD', 'DamageType' + iResistName, formIDs)
    }
  }).process('MGEF', record => {
    let copied = false
    for (const iKeywordRule of keywordRules) {
      const addKeywords = iKeywordRule(record)
      for (const iFormID of addKeywords) {
        if (!copied) {
          copied = true
          record = globals.helpers.copyToPatch(record, false)
        }
        Utils.addKeyword(record, iFormID)
      }
    }
    return false
  })
}
