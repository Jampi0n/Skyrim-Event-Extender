/* global xelib */

const effectKeywords = {
  resistNames: [
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
    'Damage'], resistRules: {
    'None': ['Any', 'None'],
    'Resist Fire': ['Any', 'Fire', 'Elemental', 'MagicOrElemental'],
    'Resist Frost': ['Any', 'Frost', 'Elemental', 'MagicOrElemental'],
    'Resist Shock': ['Any', 'Shock', 'Elemental', 'MagicOrElemental'],
    'Resist Magic': ['Any', 'Magic', 'MagicOrElemental'],
    'Poison Resist': ['Any', 'Poison'],
    'Disease Resist': ['Any', 'Disease'],
    'Damage Resist': ['Any', 'Damage'],
  }, keywordRules: [], addKeywordRule: function (keywordRule) {
    effectKeywords.keywordRules.push(keywordRule)
  },
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
  if (!utils.magicEffectHasFlag(magicEffect, 'Detrimental')) {
    return false
  }
  if (utils.magicEffectHasFlag(magicEffect, 'Recover')) {
    return false
  }
  let archType = xelib.GetValue(magicEffect,
    'Magic Effect Data\\DATA - Data\\Archtype')
  let av1 = xelib.GetValue(magicEffect,
    'Magic Effect Data\\DATA - Data\\Actor Value')
  let av2 = xelib.GetValue(magicEffect,
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

effectKeywords.addKeywordRule({
  initialize: function () { }, filter: function (magicEffect, name) {
    const ret = []
    if (isDamagingEffect(magicEffect)) {
      let resist = xelib.GetValue(magicEffect,
        'Magic Effect Data\\DATA - Data\\Resist Value')
      for (const effectName of effectKeywords.resistRules[resist]) {
        ret.push(getMasterFormID(name, 0,
          4 + effectKeywords.resistNames.indexOf(effectName)))
      }
    }
    return ret
  },
})

effectKeywords.addKeywordRule({
  initialize: function () { }, filter: function (magicEffect, name) {
    let ret = [effectKeywords.restoreAttribute]
    let restore = false
    if (utils.magicEffectHasFlag(magicEffect, 'Detrimental')) {
      return []
    }
    if (utils.magicEffectHasFlag(magicEffect, 'Recover')) {
      return []
    }
    let archType = xelib.GetValue(magicEffect,
      'Magic Effect Data\\DATA - Data\\Archtype')
    let av1 = xelib.GetValue(magicEffect,
      'Magic Effect Data\\DATA - Data\\Actor Value')
    let av2 = xelib.GetValue(magicEffect,
      'Magic Effect Data\\DATA - Data\\Second Actor Value')
    if (archType === 'Value Modifier' || archType === 'Peak Value Modifier') {
      if (av1 === 'Health') {
        restore = true
        ret.push(getMasterFormID(name, 0, 1))
      } else if (av1 === 'Magicka') {
        restore = true
        ret.push(getMasterFormID(name, 0, 2))
      } else if (av1 === 'Stamina') {
        restore = true
        ret.push(getMasterFormID(name, 0, 3))
      }
    }
    if (archType === 'Dual Value Modifier') {
      if (av1 === 'Health' || av2 === 'Health') {
        restore = true
        ret.push(getMasterFormID(name, 0, 1))
      }
      if (av1 === 'Magicka' || av2 === 'Magicka') {
        restore = true
        ret.push(getMasterFormID(name, 0, 2))
      }
      if (av1 === 'Stamina' || av2 === 'Stamina') {
        restore = true
        ret.push(getMasterFormID(name, 0, 3))
      }
    }
    if (restore) {
      return ret
    }

    return []
  },
})

new Patcher({
  name: 'effect-keywords',
  after: ['summon-detection', 'spell-damage-detection'],
  createMaster: function (masterFile) {
    const formIDs = getFormIDs(this.name, 0)
    effectKeywords.restoreAttribute = addRecord(masterFile, 'KYWD',
      'EffectRestoreAttribute', formIDs).getFormID()
    addRecord(masterFile, 'KYWD', 'EffectRestoreHealth', formIDs)
    addRecord(masterFile, 'KYWD', 'EffectRestoreMagicka', formIDs)
    addRecord(masterFile, 'KYWD', 'EffectRestoreStamina', formIDs)
    for (const name of effectKeywords.resistNames) {
      addRecord(masterFile, 'KYWD', 'DamageType' + name, formIDs)
    }
  },
  initialize: function (_name) {
    for (const keywordRule of effectKeywords.keywordRules) {
      keywordRule.initialize()
    }
  },
  process: [
    {
      load: {
        signature: 'MGEF', filter: function (_record, _name) {
          return true
        },
      }, patch: function (record, name) {
        for (const keywordRule of effectKeywords.keywordRules) {
          const addKeywords = keywordRule.filter(record, name)
          for (const formID of addKeywords) {
            const keyword = xelib.Hex(formID)
            if (!xelib.HasKeyword(record, keyword)) {
              xelib.AddKeyword(record, keyword)
            }
          }
        }
      },
    }],
})
