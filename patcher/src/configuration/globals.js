const MOD_NAME = 'SkyrimEventExtender'
const AUTHOR_NAME = 'Jampion'

const MASTER_NAME = MOD_NAME + '.esm'
const PATCH_NAME = MOD_NAME + '_patch.esp'
const PREFIX = 'JEE'
const PREFIX_ = PREFIX + '_'

let globals = {
  patchFile: 0, editorIDMap: {}, helpers: null, settings: null, locals: null,
}
