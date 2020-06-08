/* global xelib */
/**
 * Adds keywords to magic effects based on the magic effects.
 * Perks can then modify the power of these magic effects.
 */

/**
 * initialize()
 * filter(magicEffect) -> formID array
 */

let effectKeywords = {
  name: 'Effect Keywords',

  keywordArray: [],

  initialize: function () {
    for (let i = 0; i < effectKeywords.keywordArray.length; ++i) {
      effectKeywords.keywordArray[i].initialize()
    }
  },

  load: {
    signature: 'MGEF',
    filter: function (_record) {
      return true
    },
  },

  patch: function (record) {
    for (let i = 0; i < effectKeywords.keywordArray.length; ++i) {
      let formIDList = effectKeywords.keywordArray[i].filter(record)
      for (let j = 0; j < formIDList.length; ++j) {
        let hexString = xelib.Hex(formIDList[j] + globals.loadOrderOffset)
        xelib.AddKeyword(record, hexString)
      }
    }
  },
}

function addKeyword (keyword) {
  effectKeywords.keywordArray.push(keyword)
}

function hasFlag (magicEffect, flagName) {
  return xelib.GetFlag(magicEffect, 'Magic Effect Data\\DATA - Data\\Flags',
    flagName)
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
  if (!hasFlag(magicEffect, 'Detrimental')) {
    return false
  }
  if (hasFlag(magicEffect, 'Recover')) {
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

addKeyword({
  initialize: function () { },
  filter: function (magicEffect) {
    let ret = []
    if (isDamagingEffect(magicEffect)) {
      ret.push(0x800)
      let resist = xelib.GetValue(magicEffect,
        'Magic Effect Data\\DATA - Data\\Resist Value')
      switch (resist) {
        case 'None': {
          ret.push(0x801)
          break
        }
        case 'Resist Fire': {
          ret.push(0x802)
          ret.push(0x806)
          break
        }
        case 'Resist Frost': {
          ret.push(0x803)
          ret.push(0x806)
          break
        }
        case 'Resist Shock': {
          ret.push(0x804)
          ret.push(0x806)
          break
        }
        case 'Resist Magic': {
          ret.push(0x805)
          ret.push(0x806)
          break
        }
        case 'Poison Resist': {
          ret.push(0x807)
          break
        }
        case 'Disease Resist': {
          ret.push(0x808)
          break
        }
        case 'Damage Resist': {
          ret.push(0x809)
          break
        }

        default: { break }
      }
    }
    return ret
  },
})

addKeyword({
  initialize: function () { },
  filter: function (magicEffect) {
    let ret = [0x811]
    let restore = false
    if (hasFlag(magicEffect, 'Detrimental')) {
      return []
    }
    if (hasFlag(magicEffect, 'Recover')) {
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
        ret.push(0x80E)
      } else if (av1 === 'Magicka') {
        restore = true
        ret.push(0x80F)
      } else if (av1 === 'Stamina') {
        restore = true
        ret.push(0x810)
      }
    }
    if (archType === 'Dual Value Modifier') {
      if (av1 === 'Health' || av2 === 'Health') {
        restore = true
        ret.push(0x80E)
      }
      if (av1 === 'Magicka' || av2 === 'Magicka') {
        restore = true
        ret.push(0x80F)
      }
      if (av1 === 'Stamina' || av2 === 'Stamina') {
        restore = true
        ret.push(0x810)
      }
    }
    if (restore) {
      return ret
    }

    return []
  },
})
