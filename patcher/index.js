/* global ngapp, xelib, registerPatcher, patcherUrl */
//= require ./src/patchers/*

let masterName = "SkyrimEventExtender.esm"

let globals = {
	patchFile: 0,
	helpers: 0,
	settings: 0,
	locals: 0,
	initFunctions: [],
	patchers: [],
	loadOrderOffset: 0,
	prefix: "JEE",
	prefix_: 'JEE_'
};

globals.patchers = [armorEnchantments, weaponEnchantments, actorPerk1, actorPerk2, shoutPerk, spellDamageDetection1, spellDamageDetection2, summonDetection, effectKeywords];

let GetRecord = function (formID) {
	return xelib.GetRecord(globals.masterFile, xelib.GetFileLoadOrder(globals.masterFile) * 0x01000000 + formID);
}

let createFile = function(fileName) {
	let file = xelib.FileByName(fileName);
	if(file === 0) {
		file = xelib.AddFile(fileName);
	} else {
		xelib.NukeFile(file);
		xelib.CleanMasters(file);
	}
	return file;
}

registerPatcher({
	info: info,
	gameModes: [xelib.gmSSE, xelib.gmTES5],
	settings: {
		label: 'Skyrim Event Extender',
		hide: true,
		defaultSettings: {
			patchFileName: 'SkyrimEventExtender_Patch.esp'
		}
	},
	//requiredFiles: [masterName],
	execute(patchFile, helpers, settings, locals) {

		return {
			initialize: function () {
				globals.patchFile = patchFile;
				globals.helpers = helpers;
				globals.settings = settings;
				globals.locals = locals;

				globals.masterFile = xelib.FileByName(masterName);
				globals.loadOrderOffset = xelib.GetFileLoadOrder(globals.masterFile) * 0x01000000;

				for (let i = 0; i < globals.patchers.length; ++i) {
					globals.helpers.logMessage("Initializing: " + globals.patchers[i].name);
					globals.patchers[i].initialize();
				}
			},

			process: globals.patchers,

			finalize: function () { }

		};

	}
})
