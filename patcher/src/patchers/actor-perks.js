/* global xelib */

{
  let perkList = []
  Patcher.add('actor-perks', 'Actor Perk Distributor').begin(() => {
    perkList = []
  }).process('PERK', record => {
    if (xelib.EditorID(record).startsWith(PREFIX_ + 'AP_')) {
      perkList.push(xelib.GetHexFormID(record))
    }
    return false
  }).process('NPC_', record => {
    if (perkList.length > 0) {
      record = globals.helpers.copyToPatch(record, false)
      for (const perk of perkList) {
        xelib.AddPerk(record, perk, '1')
      }
    }
    return false
  }, () => {return perkList.length > 0})
}
