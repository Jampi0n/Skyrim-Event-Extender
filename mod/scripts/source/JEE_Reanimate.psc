scriptname JEE_Reanimate extends ActiveMagicEffect
{

}

Actor Property PlayerRef Auto
int level = -1

Event OnEffectStart(Actor akTarget, Actor akCaster)
	if akCaster == PlayerRef
		level = GetMagnitude() as int
		int eventHandle = ModEvent.Create("OnPlayerActorReanimatedStart")
		if eventHandle
			ModEvent.PushInt(eventHandle, level)
			ModEvent.Send(eventHandle)
		endif
	endif
EndEvent

Event OnEffectFinish(Actor akTarget, Actor akCaster)
	if akCaster == PlayerRef
		int eventHandle = ModEvent.Create("OnPlayerActorReanimatedFinish")
		if eventHandle
			ModEvent.PushInt(eventHandle, level)
			ModEvent.Send(eventHandle)
		endif
	endif
EndEvent
