Scriptname JEE_OnHitConcentration extends activemagiceffect  
{
	If the same spell is cast at the same, only one of them might trigger.
}

String Property EventName Auto
Actor Property PlayerRef Auto

bool stillExists = true

Event OnUpdate()
	if self && stillExists
		self.dispel() ;can cause errors, if the magic effect was already removed. Ignore in papyrus log.
	endif
EndEvent

Event OnEffectFinish(Actor akTarget, Actor akCaster)
	stillExists = false
EndEvent

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
			if self != none
				self.RegisterForSingleUpdate(0.9)
			endif
		endif
	endif
EndEvent
