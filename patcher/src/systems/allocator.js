let currentFormID = 0x800
let formIDMap = {}

let allocateFormIDs = function (patcher, count) {
  if (!formIDMap.hasOwnProperty(patcher)) {
    formIDMap[patcher] = []
  }
  let patcherFormIDs = formIDMap[patcher]
  patcherFormIDs.push([currentFormID, currentFormID + count, currentFormID])
  currentFormID += count
  formIDMap[patcher] = patcherFormIDs
}

let getFormIDs = function (patcher, group) {
  return formIDMap[patcher][group].slice()
}

let getFormID = function (patcher, group, index) {
  return index + getFormIDs(patcher, group)[0]
}

let getMasterFormID = function (patcher, group, index) {
  return convertToMasterFormID(getFormID(patcher, group, index))
}
