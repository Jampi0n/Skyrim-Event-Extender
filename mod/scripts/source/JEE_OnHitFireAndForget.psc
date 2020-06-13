Scriptname JEE_OnHitFireAndForget extends activemagiceffect  
{
	If the same spell is cast at the same, only one of them might trigger.
}

String Property EventName Auto
Actor Property PlayerRef Auto

Event OnEffectStart(Actor akTarget, Actor akCaster)
	if self != none
		if akCaster == PlayerRef && akTarget != none
			float dur = self.GetDuration()
			int eventHandle = ModEvent.Create(EventName)
			if eventHandle
				ModEvent.PushForm(eventHandle, akTarget as Form)
				ModEvent.PushFloat(eventHandle, Self.GetMagnitude())
				ModEvent.PushFloat(eventHandle, dur)
				ModEvent.Send(eventHandle)
			endif
		endif
		if self != none
			self.dispel()
		endif
	endif
EndEvent
