# Knockback & Hit Reaction Reference Code

## Contents

- [Attack Logic Fragment](#attack-logic-fragment)
- [Monster Defender Fragment](#monster-defender-fragment)

The fragments below use `Hp <= 0` only as their local lethal guard because this Defender updates HP synchronously inside `TakeDamage()`. That guard prevents duplicate judgment, later knockback pulses, and non-lethal velocity restoration after the shown damage call. It does **not** replace the discovered immediate gameplay-exclusion owner required by [death.md](death.md): contact damage, monster ATTACK callbacks, AI, input/target eligibility outside this synchronous HP path, and the rest of Death-Hold must use that role-mapped exclusion capability. Never use `IsDead` as either guard; it is valid only as the final StateSet transition input for a model proven to use `ConditionIsDead`.

## Attack Logic Fragment

~~Logic.mlua
```mlua
	method void ResolveNormalAttackHit(Entity caster, table data, Entity targetEntity, Monster targetMonster, number dirX)
		-- Immediate real judgment against the cast-time snapshot target: one lump-sum TakeDamage call; presentation is scheduled separately.
		if isvalid(targetEntity) == false or isvalid(targetMonster) == false then
			return
		end
		if targetMonster.Hp <= 0 then
			return
		end

		local skinId = self:GetAttackerSkinId(caster, data)
		local totalDamage = data.damage * data.attackCount
		if targetMonster.Hp <= totalDamage then
			targetMonster:FaceAttacker(dirX)
			targetMonster:PreHitReaction()
		end
		targetMonster:TakeDamage(caster, totalDamage, data.attackCount, data.damageSkinInterval, skinId, data.hitDelay)

		_TimerService:SetTimerOnce(function()
			if isvalid(targetEntity) == false or isvalid(targetMonster) == false then return end
			self:PlayHitEffects(data, targetEntity, dirX)
			self:PlayHitSound(data)

			if targetMonster.Hp <= 0 then
				return
			end

			targetMonster:FaceAttacker(dirX)
			self:StartKnockbackCycle(data, targetEntity, targetMonster, dirX)
		end, data.hitDelay)
	end

	@ExecSpace("ServerOnly")
	method string GetAttackerSkinId(Entity caster, table data)
		-- Defaults to the attacker's own DamageSkinSettingComponent.DamageSkinId, per the Manual Damage & Damage-Skin Rule.
		local setting = caster.DamageSkinSettingComponent
		if isvalid(setting) and isvalid(setting.DamageSkinId) then
			return setting.DamageSkinId.DataId
		end
		return data.damageSkinRuid
	end

	@ExecSpace("ServerOnly")
	method void PlayHitEffects(table data, Entity targetEntity, number dirX)
		-- Hit effect repeat count follows hitEffectPolicy, independent of the damage-skin split.
		if data.hitEffectRuid == nil or data.hitEffectRuid == "" then
			return
		end

		-- Hit Effect Offset Rule: default Vector3.zero (target origin); X flips with attack facing so a positive x pushes with the attack.
		local off = data.hitEffectOffset
		if off == nil then
			off = Vector3.zero
		end
		local localPos = Vector3(off.x * dirX, off.y, off.z)

		if data.hitEffectPolicy == _SkillCatalogLogic.HitEffectPolicyPerHit then
			for i = 1, data.attackCount do
				local delay = (i - 1) * data.damageSkinInterval
				_TimerService:SetTimerOnce(function()
					if isvalid(targetEntity) then
						_EffectService:PlayEffectAttached(data.hitEffectRuid, targetEntity, localPos, 0, Vector3.one, false, { FlipX = dirX > 0 })
					end
				end, delay)
			end
		else
			_EffectService:PlayEffectAttached(data.hitEffectRuid, targetEntity, localPos, 0, Vector3.one, false, { FlipX = dirX > 0 })
		end
	end

	@ExecSpace("ServerOnly")
	method void StartKnockbackCycle(table data, Entity targetEntity, Monster targetMonster, number dirX)
		-- Fires pulse 1 immediately; each pulse locks movement only for HitReactionDuration.
		local totalDuration = data.attackCount * data.damageSkinInterval
		targetMonster:ApplyKnockback(dirX, data.knockbackPower)
		targetMonster:PlayHitReaction()
		self:ScheduleNextKnockbackPulse(data, targetEntity, targetMonster, dirX, totalDuration)
	end

	@ExecSpace("ServerOnly")
	method void ScheduleNextKnockbackPulse(table data, Entity targetEntity, Monster targetMonster, number dirX, number remainingAtPulseStart)
		-- Cadence = movement-locked pulse duration + a movement-enabled fixed 0.09s gap.
		local cadenceDelay = targetMonster.HitReactionDuration + 0.09
		_TimerService:SetTimerOnce(function()
			if isvalid(targetEntity) == false or isvalid(targetMonster) == false or targetMonster.Hp <= 0 then
				return
			end
			local remainingNow = remainingAtPulseStart - cadenceDelay
			if remainingNow < 0.2 then
				return
			end
			targetMonster:FaceAttacker(dirX)
			targetMonster:ApplyKnockback(dirX, data.knockbackPower)
			targetMonster:PlayHitReaction()
			self:ScheduleNextKnockbackPulse(data, targetEntity, targetMonster, dirX, remainingNow)
		end, cadenceDelay)
	end
```

## Monster Defender Fragment

Monster.mlua
```mlua
    property number HitReactionDuration = 0.45

	method void FaceAttacker(number dirX)
		self.HitFacingDirX = dirX
		self.HitFacingLocked = true
		self:ApplyLockedHitFacing()
	end

	method void ApplyLockedHitFacing()
		-- Target sits on the attacker's dirX side; its new Scale.x sign matches sign(dirX).
		local t = self.Entity.TransformComponent
		if isvalid(t) == false then
			return
		end
		local s = t.Scale
		local sign = 1
		if self.HitFacingDirX < 0 then
			sign = -1
		end
		t.Scale = Vector3(math.abs(s.x) * sign, s.y, s.z)
	end

	method void ApplyKnockback(number dirX, number knockbackPower)
		-- Knockback Direction & API Rule: SetForce (not AddForce); MoveVelocity is cleared first so AI/movement can't cancel it.
		local body = self.Entity.RigidbodyComponent
		if isvalid(body) == false then
			return
		end
		body.MoveVelocity = Vector2.zero
		body:SetForce(Vector2(dirX * knockbackPower, 0))
	end

    method void PlayHitReaction()
		-- Locks movement for one knockback pulse and plays HIT only when the current action state may be interrupted.
		if self.Hp <= 0 then
			return
		end

		local body = self.Entity.RigidbodyComponent
		if isvalid(body) then
			if self.HitStateActive == false then
				self.CachedMoveVelocity = body.MoveVelocity
			end
			body.MoveVelocity = Vector2.zero
		end
		self:FreezeMovement()

		self.HitStateActive = true
		self.HitAnimationActive = false
		local sc = self.Entity.StateComponent

        -- no StateSet case. if StateComponet has valid StateSetId, that mean that use StateSet
		if isvalid(sc) and (sc.StateSetId == nil or sc.StateSetId == "") then
			local stateName = sc.CurrentStateName
			if stateName == "IDLE" or stateName == "MOVE" or stateName == "CHASE" or stateName == "HIT" then
				self.HitAnimationActive = true
				sc:ChangeState("HIT")
			end
		end

		if self.HitReturnTimerId ~= 0 then
			_TimerService:ClearTimer(self.HitReturnTimerId)
		end
		self.HitReturnTimerId = _TimerService:SetTimerOnce(function() self:EndHitReaction() end, self.HitReactionDuration)
	end

	method void FreezeMovement()
		local mv = self.Entity.MovementComponent
		if isvalid(mv) then
			mv:Stop()
		end
		local wander = self.Entity.AIWanderComponent
		if isvalid(wander) then
			wander.Enable = false
		end
		local chase = self.Entity.AIChaseComponent
		if isvalid(chase) then
			chase.Enable = false
		end
	end

	method void UnfreezeMovement()
		local attack = self.Entity.MonsterAttack
		if isvalid(attack) and attack.AttackAnimationActive then
			return
		end
		local wander = self.Entity.AIWanderComponent
		if isvalid(wander) then
			wander.Enable = true
		end
		local chase = self.Entity.AIChaseComponent
		if isvalid(chase) then
			chase.Enable = true
		end
	end

	method void PreHitReaction()
		self:PreHitReaction_Client()

		local body = self.Entity.RigidbodyComponent
		if isvalid(body) then
			if self.HitStateActive == false then
				self.CachedMoveVelocity = body.MoveVelocity
			end
			body.MoveVelocity = Vector2.zero
			body:SetForce(Vector2.zero)
		end
		self.HitStateActive = true

		local mv = self.Entity.MovementComponent
		if isvalid(mv) then
			mv:Stop()
		end
		local wander = self.Entity.AIWanderComponent
		if isvalid(wander) then
			wander.Enable = false
		end
		local chase = self.Entity.AIChaseComponent
		if isvalid(chase) then
			chase.Enable = false
		end
	end

	method void PreHitReaction_Client()

		local body = self.Entity.RigidbodyComponent
		if isvalid(body) then
			body.MoveVelocity = Vector2.zero
			body:SetForce(Vector2.zero)
		end

		local mv = self.Entity.MovementComponent
		if isvalid(mv) then
			mv:Stop()
		end

	end

	method void EndHitReaction()
		-- Ends only the active knockback window; the following inter-pulse delay is movement-enabled.
		self.HitReturnTimerId = 0
		if self.Hp <= 0 then
			if self.DeathHoldActive and self.HitAnimationActive then
				self:OnPreservedAnimationEnded()
			end
			self.HitAnimationActive = false
			return
		end

		if self.HitAnimationActive then
			local sc = self.Entity.StateComponent
			if isvalid(sc) and sc.CurrentStateName == "HIT" and (sc.StateSetId == nil or sc.StateSetId == "") then
				sc:ChangeState("IDLE")
			end
		end
		self.HitAnimationActive = false
		self.HitFacingLocked = false
		self.HitFacingDirX = 0

		local body = self.Entity.RigidbodyComponent
		if isvalid(body) then
			body.MoveVelocity = self.CachedMoveVelocity
		end
		self.HitStateActive = false
		self:UnfreezeMovement()
	end

	method void TakeDamage(Entity attacker, integer totalDamage, integer hitCount, number damageSkinInterval, string skinId, number presentationDelay)
		-- Applies one lump-sum HP judgment immediately, then schedules damage-skin presentation and DEAD timing.
		if self.Hp <= 0 then
			return
		end

		_TimerService:SetTimerOnce(function()
			local damages = self:SplitDamage(totalDamage, hitCount)
			_DamageSkinService:Play(self.Entity, skinId, damageSkinInterval, damages, DamageSkinTweenType.Default, false, self.DamageSkinOffset, Vector2(1, 1), 1.0, 1.0, LitMode.Default)
		end, presentationDelay)

		local originalHp = self.Hp
		self.Hp = self.Hp - totalDamage

		if self.Hp <= 0 then
			local dieAnimationStartDelay = presentationDelay + hitCount * damageSkinInterval
			self:Dead(dieAnimationStartDelay)
		end
	end
```
