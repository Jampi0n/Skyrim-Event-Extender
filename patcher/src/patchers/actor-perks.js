/* global xelib */

{
  let perkList = []
  PatcherManager.add('actor-perks', 'Actor Perk Distributor').begin(() => {
    perkList = []
  }).process(record => {
      perkList.push(xelib.GetHexFormID(record))
    }, 'PERK',
    (record) => {
      return xelib.EditorID(record).startsWith(PREFIX + '_AP_')
    }).process(record => {
    for (const perk of perkList) {
      xelib.AddPerk(record, perk, '1')
    }
  }, 'NPC_', (_) => {return perkList.length > 0})
}
