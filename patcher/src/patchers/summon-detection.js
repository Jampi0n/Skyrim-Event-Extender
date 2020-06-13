/* global xelib */

{
  /**
   *
   * @param {number} record
   * @return {boolean}
   */
  function isSummoningEffect (record) {
    const archtype = xelib.GetValue(record,
      'Magic Effect Data\\DATA - Data\\Archtype')
    return archtype === 'Summon Creature' || archtype === 'Reanimate'
  }

  /**
   *
   * @param {number} record
   * @return {boolean}
   */
  function patchSummoningEffect (record) {
    if (!isSummoningEffect(record)) {
      return false
    }
    record = globals.helpers.copyToPatch(record, false)
    xelib.AddElement(record, 'VMAD - Virtual Machine Adapter')
    xelib.SetValue(record, 'VMAD - Virtual Machine Adapter\\Version', '5')
    xelib.SetValue(record, 'VMAD - Virtual Machine Adapter\\Object Format', '2')

    let archType = xelib.GetValue(record,
      'Magic Effect Data\\DATA - Data\\Archtype')
    if (archType === 'Summon Creature') {
      let summonedActor = xelib.GetLinksTo(record,
        'Magic Effect Data\\DATA - Data\\Assoc. Item')
      let level         = xelib.GetIntValue(summonedActor,
        'ACBS - Configuration\\Level')

      const script = ScriptUtils.addScript(record, PREFIX_ + 'SummonCreature')
      ScriptUtils.addPlayerProperty(script)
      ScriptUtils.addIntProperty(script, 'level', level)

    } else if (archType === 'Reanimate') {
      const script = ScriptUtils.addScript(record, PREFIX_ + 'Reanimate')
      ScriptUtils.addPlayerProperty(script)
    }
    return false
  }

  Patcher.add('summon-detection', 'Summoning Effect Detection',
    ['spell-damage-detection']).process('MGEF', patchSummoningEffect)
}
