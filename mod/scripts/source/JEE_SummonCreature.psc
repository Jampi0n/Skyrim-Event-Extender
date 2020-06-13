scriptname JEE_SummonCreature extends ActiveMagicEffect
{

}

Actor Property PlayerRef Auto
int Property level Auto

Event OnEffectStart(Actor akTarget, Actor akCaster)
	if akCaster == PlayerRef
		int eventHandle = ModEvent.Create("OnPlayerActorSummonedStart")
		if eventHandle
			ModEvent.PushInt(eventHandle, level)
			ModEvent.Send(eventHandle)
		endif
	endif
EndEvent

Event OnEffectFinish(Actor akTarget, Actor akCaster)
	if akCaster == PlayerRef
		int eventHandle = ModEvent.Create("OnPlayerActorSummonedFinish")
		if eventHandle
			ModEvent.PushInt(eventHandle, level)
			ModEvent.Send(eventHandle)
		endif
	endif
EndEvent
