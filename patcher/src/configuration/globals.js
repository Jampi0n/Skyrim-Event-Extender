const modName = 'SkyrimEventExtender'
const authorName = 'Jampion'

const patcherModes = {
  ptUndefined: 0, ptBuildMaster: 1, ptRunPatcher: 2,
}

let globals = {
  patcherMode: patcherModes.ptUndefined,
  masterFile: 0,
  masterName: modName + '.esm',
  patchFile: 0,
  patchName: modName + '_patch.esp',
  editorIDMap: {},
  helpers: null,
  settings: null,
  locals: null,
  patcherManager: null,
  loadOrderOffset: 0,
  prefix: 'JEE',
  prefix_: 'JEE_',
}
