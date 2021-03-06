Scriptname JEE_Main extends Quest  
{

}

String Property PatchName Auto

Function DisplayError(String msg)
	Debug.MessageBox("[Skyrim Event Extender]\n" + msg)
EndFunction

Function CheckRequirements()
	if Game.GetModByName(PatchName) == 255
		DisplayError("It seems like the patch is missing.\nMake sure the patch is named " + PatchName + ".")
		Game.QuitToMainMenu()
	endif

	if SKSE.GetVersion() == 1
		; Classic Edition
		if SKSE.GetVersionMinor() < 7
			DisplayError("Your version of SKSE is not supported. Please install at least version 1.7.0.")
			Game.QuitToMainMenu()
		endif
	elseif SKSE.GetVersion() == 2
		; Special Edition
		if SKSE.GetVersionMinor() < 0
			DisplayError("Your version of SKSE is not supported. Please install at least version 2.5.0.")
			Game.QuitToMainMenu()
		endif
	else
		DisplayError("Please install SKSE.")
		Game.QuitToMainMenu()
	endif
EndFunction

Function OnLoadGame()
	Utility.Wait(0.01)
	CheckRequirements()
EndFunction

Event OnInit()
	Utility.Wait(0.01)
	CheckRequirements()
EndEvent
