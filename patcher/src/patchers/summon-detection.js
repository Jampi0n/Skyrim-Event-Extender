/* global xelib */
/**
 * Adds a script to all summoning magic effects to track the number and power of summons the player has.
 * The power of summon creature effects depends on the creature level.
 * The power of reanimation effects depends on the maximum level the spell can target.
 */

let summonDetection = {
  name: 'Summon Detection',

  initialize: function () {

  },

  load: {
    signature: 'MGEF',
    filter: function (record) {
      let archtype = xelib.GetValue(record,
        'Magic Effect Data\\DATA - Data\\Archtype')
      return archtype === 'Summon Creature' || archtype === 'Reanimate'
    },
  },

  patch: function (record) {
    xelib.AddElement(record, 'VMAD - Virtual Machine Adapter')
    xelib.SetValue(record, 'VMAD - Virtual Machine Adapter\\Version', '5')
    xelib.SetValue(record, 'VMAD - Virtual Machine Adapter\\Object Format',
      '2')

    let archType = xelib.GetValue(record,
      'Magic Effect Data\\DATA - Data\\Archtype')
    if (archType === 'Summon Creature') {
      let summonedActor = xelib.GetLinksTo(record,
        'Magic Effect Data\\DATA - Data\\Assoc. Item')
      let level = xelib.GetIntValue(summonedActor,
        'ACBS - Configuration\\Level')

      let script = xelib.AddScript(record, 'JEE_SummonCreature', 'Local')

      let property = xelib.AddScriptProperty(script, 'PlayerRef', 'Object',
        'Edited')
      xelib.SetUIntValue(property, 'Value\\Object Union\\Object v2\\FormID',
        0x14)
      xelib.SetValue(property, 'Value\\Object Union\\Object v2\\Alias', 'None')

      property = xelib.AddScriptProperty(script, 'level', 'Int32', 'Edited')
      xelib.SetValue(property, 'Value', '' + level)
    } else if (archType === 'Reanimate') {
      let script = xelib.AddScript(record, 'JEE_Reanimate', 'Local')

      let property = xelib.AddScriptProperty(script, 'PlayerRef', 'Object',
        'Edited')
      xelib.SetUIntValue(property, 'Value\\Object Union\\Object v2\\FormID',
        0x14)
      xelib.SetValue(property, 'Value\\Object Union\\Object v2\\Alias', 'None')
    }
  },
}
