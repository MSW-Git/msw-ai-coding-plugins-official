# Skill Framework (Registry & Dispatch Foundation)

How this project turns a data-only skill definition into a usable, hotkey-bound in-game skill, and how many concrete skills coexist without copy-pasting a property/method group per skill. This is the architectural foundation the other domain files (targeting-judgment, damage-presentation, knockback-hit-reaction, death-sequence, casting-lock, cast-effect-attachment, multi-target-presentation) plug into — read this FIRST when the request is "add a skill", "add a skill type", "bind a new hotkey", or "let the player use skill X". See [../SKILL.md](../SKILL.md) for the Domain Reference Files index.

A `@Component` reaches the Registry `@Logic` through the name-derived global accessor `_<ScriptName>` (this project's Registry `AttackSkillLogic` → `_AttackSkillLogic`), per `msw-scripting`. The pseudocode below writes `AttackSkillLogic:UseSkill(...)` for readability; the real call uses that accessor (`_AttackSkillLogic:UseSkill(...)`).

## Why `@Logic`, not `@Component`, owns the skill foundation

Per `AGENTS.md`'s own Logic-vs-Component rule of thumb ("should this still be running/defined when the player walks into another map?"): skill **definitions** (damage, cooldown, animation key, RUIDs — the whole [skill-data-contract.md](skill-data-contract.md) shape) and the **type dispatch table** (which handler runs for `normal_attack_skill` vs. a future second type) are world-wide, load-once data — not tied to any one player entity or map. Forcing this onto a `@Component` is the scaling problem this split avoids: it would mean one inspector-property group per skill key bolted onto the same file forever. A `@Logic` is created once per world session and is the natural home for a shared registry every player's input reads from.

What stays on a per-player `@Component` (`PlayerAttack.mlua`) instead, because it IS per-entity state:

- Hotkey → skill-key binding (`SkillSlots`)
- Casting-lock `@Sync` state (each player's own cast is independent)
- Client-side avatar animation playback and local input prediction

## File Split & Responsibilities

| File | Kind | Owns |
|---|---|---|
| `RootDesk/MyDesk/AttackSkillLogic.mlua` | `@Logic` | `SkillDatabase` (every concrete skill's tuned data), `SkillTypeHandlers` (type → handler dispatch table), the `ServerOnly` judgment/presentation-trigger methods each type's handler runs, per-caster cooldown state |
| `RootDesk/MyDesk/PlayerAttack.mlua` | `@Component` (on the player) | `SkillSlots` (hotkey → skill key), client key-input handling, `CastingLockActive`/`CastingSkillKey` sync state, request relay into `AttackSkillLogic`, client avatar animation playback |
| `RootDesk/MyDesk/Monster.mlua` | `@Component` (on the monster) | HP/death/respawn, `TakeDamage` — unchanged by this redesign |

This does not reintroduce the `CombatProfileLogic`/`PlayerAutoCombat`/`PlayerAnimationLogic` split that `SKILL.md` previously ruled out — those were speculative extra files with no clear ownership boundary. `AttackSkillLogic` has one job (skill registry + dispatch); `PlayerAttack` has one job (per-player input/presentation adapter).

## Reuse-or-New-File Rule (binary test, not a judgment call)

Applies equally to `@Component` and `@Logic`:

1. Check whether the exact logic a new skill needs already exists somewhere in the current file split (an existing `SkillTypeHandlers[type].OnUse`, an existing helper method, the existing casting-lock/animation flow, etc.).
2. **Exists already** → reuse it as-is. Do not duplicate it under a new name.
3. **Does not exist** → do not retrofit the gap into an existing file's scope (no new unrelated method/property bolted onto `PlayerAttack.mlua`, no new unrelated logic bolted onto `AttackSkillLogic.mlua`). Always create a brand-new script under a different name instead — a new `@Component` when the missing logic is per-entity state/behavior, a new `@Logic` when it's world-wide/shared state — sized to that one responsibility.

There is no middle option ("extend the existing file a little bit"). The test is binary: found → reuse; not found → new file.

## Skill Data Registry (`SkillDatabase`)

Replaces one property group per skill key scattered on a single Component. Every concrete skill is one entry in a Lua table declared inside `AttackSkillLogic.mlua`, keyed by `key`, using exactly the [skill-data-contract.md](skill-data-contract.md) Concrete Skill Data Shape:

```lua
SkillDatabase = {
    skill_a = { key = "skill_a", type = "normal_attack_skill", damage = 5, attackCount = 3, cooldown = 1.2, hitDelay = 0.12, --[[ ...rest of the skill-data-contract.md shape... ]] },
    skill_b = { key = "skill_b", type = "normal_attack_skill", damage = 8, attackCount = 1, cooldown = 2.0, hitDelay = 0.18, --[[ ... ]] },
}
```

Adding a concrete skill of an already-defined type is a **pure data change**: one new `SkillDatabase` entry + one new `SkillSlots` binding on `PlayerAttack.mlua`. No new method, no new property, no new file.

## Skill Type Handler Registry (`SkillTypeHandlers`)

Formalizes the existing Implementation Rules ("branch by skill `type`, not by individual skill key"; "prefer one generic dispatch method over one method per skill") as an actual dispatch table instead of a growing if/elseif chain:

```lua
SkillTypeHandlers = {
    normal_attack_skill = {
        OnUse = function(self, caster, data) --[[ Runtime Sequence from targeting-judgment.md ]] end,
    },
    projectile_attack_skill = {
        OnUse = function(self, caster, data) --[[ Projectile Runtime Sequence from targeting-judgment.md / projectile.md:
            same delayed judgment, but hitDelay is computed per target ((distance / projectileSpeed) * 0.03),
            each target scheduled independently, and a pooled projectile entity flies to each target ]] end,
    },
    -- add a new entry (with a matching row in skill-data-contract.md's Type Design table)
    -- only when a skill's requirements genuinely don't fit an existing type's OnUse handler.
}
```

### Projectile lifecycle is a separate `@Logic` + `@Component`, not part of the Registry

`projectile_attack_skill`'s `OnUse` drives *when* projectiles are launched, but the projectile-entity lifecycle and travel are their own responsibilities. Per the Reuse-or-New-File Rule they are **not** bolted onto `AttackSkillLogic` or `PlayerAttack` — they are two new scripts plus a minimal `.model`:

- A **new `@Logic`** (`ProjectilePoolLogic`, accessor `_ProjectilePoolLogic`) — pooled acquire/reuse/release, never `Destroy`. `Launch(...)` acquires then delegates travel to the projectile's own mover.
- A **new `@Component`** (`ProjectileMover`) on the projectile `.model` — owns movement (precompute-time `OnUpdate` lerp) and self-retires to the pool on arrival. Movement lives here, **not** as a central timer loop in the pool `@Logic`.
- A minimal projectile `.model` (Transform + SpriteRenderer + `script.ProjectileMover`).

None exist until the first projectile skill is built; create and record them under Current Project Instantiation at that time — do not assume they already exist. Full rules: [projectile.md](projectile.md).

`AttackSkillLogic:UseSkill(caster, skillKey)` (`ServerOnly`, the single generic entry point) looks up `SkillDatabase[skillKey]`, resolves `SkillTypeHandlers[data.type]`, and calls its `OnUse`. This is the ONE place a skill type is wired in — every domain file's Runtime Sequence (targeting-judgment.md, damage-presentation.md, knockback-hit-reaction.md, death-sequence.md) describes what a given type's `OnUse` must do internally; none of them describe a per-skill-key method anymore.

## Hotkey / Skill Slot Input Layer ("making a skill usable")

A skill fully defined in `SkillDatabase` is inert until some input binds a key to it — this is the layer that makes it usable, distinct from defining it. `PlayerAttack.mlua` declares its own hotkey table, independent of `SkillDatabase`'s content:

```lua
SkillSlots = {
    { key = Key.LeftShift, skillKey = "skill_a" },
    { key = Key.Q,         skillKey = "skill_b" },
}
```

On `OnKeyDown(key)` (client): look up the matching `skillKey` in `SkillSlots`; if none matches, ignore the key.

## Casting State Ownership (generic, not per-skill)

One casting lock per player, not one per skill key — a player casts at most one skill at a time by default. (If a future skill needs concurrent-cast, e.g. a dash that doesn't block a separate attack key, that's a new explicit ask — do not assume it silently.)

```lua
@Sync property boolean CastingLockActive = false
property string CastingSkillKey = ""  -- which SkillDatabase key currently holds the lock; "" when not casting
```

Skill identity is carried in `CastingSkillKey`, and its data (`animationKey`, etc.) is looked up from the registry as `SkillDatabase[self.CastingSkillKey]` — not duplicated as a per-skill Component property (`self.<Skill>LockActive` / `self.<Skill>AnimationKey`). There is one `CastingLockActive` / `CastingSkillKey` pair, not one per skill key.

## Request / Response Flow

1. **Client** (`PlayerAttack.OnKeyDown`): resolve `skillKey` via `SkillSlots`. If `CastingLockActive` is already `true`, ignore the key. Otherwise set `CastingLockActive = true` and `CastingSkillKey = skillKey` locally (zero-latency prediction, per [casting-lock.md](casting-lock.md) principle 3), then call `@ExecSpace("Server")` `RequestUseSkill(skillKey)`.
2. **Server** (`PlayerAttack.RequestUseSkill`, `@ExecSpace("Server")`): call `AttackSkillLogic:CanUseSkill(self.Entity, skillKey)` (cooldown gate). On success, call `AttackSkillLogic:UseSkill(self.Entity, skillKey)`.
3. **Logic** (`AttackSkillLogic:UseSkill`, `ServerOnly`): look up `SkillDatabase[skillKey]` and `SkillTypeHandlers[data.type].OnUse`; run the type's Runtime Sequence (cast-time targeting snapshot, `hitDelay` callback, `TakeDamage`, presentation triggers — see the other domain files); stamp the per-caster cooldown.
4. **Client presentation** (still `PlayerAttack.mlua`, since animation playback is per-entity): play the caster's avatar animation for `SkillDatabase[skillKey].animationKey` via `ActionStateChangedEvent`; subscribe to `SpriteAnimPlayerEndEvent` to release `CastingLockActive`/`CastingSkillKey` and RPC `RequestReleaseCastingLock()` — see [casting-lock.md](casting-lock.md).

## Cooldown Ownership

Cooldown is per-caster, per-skill — tracked inside `AttackSkillLogic` (not the player Component), keyed by caster entity Id, since the Logic is the one place every request already routes through:

```lua
_T.cooldownExpireAt = {}  -- [callerEntityId][skillKey] = expireTimestamp
```

`CanUseSkill(caster, skillKey)` reads `_T.cooldownExpireAt[caster.Id] and _T.cooldownExpireAt[caster.Id][skillKey]` against `_UtilLogic.ElapsedSeconds`. This avoids adding a `@Sync` cooldown property per skill per player, and avoids per-player cooldown state disappearing on a map transition (a `@Component`'s state would not survive that the same way; `@Logic` does).

## Adding a New Concrete Skill (of an existing type)

1. Run the MANDATORY PROACTIVE QUESTIONING checklist in `../SKILL.md`.
2. Add one entry to `AttackSkillLogic.SkillDatabase` using the confirmed answers, per [skill-data-contract.md](skill-data-contract.md).
3. Add one `SkillSlots` entry on `PlayerAttack.mlua` binding a hotkey to the new `key`.
4. No new methods, no new `@Sync` properties, no new file — the existing type's `OnUse` handler and the generic casting-lock/animation flow already cover it.

## Adding a New Skill Type

1. Add a row to [skill-data-contract.md](skill-data-contract.md)'s Type Design table with real confirmed values, not a placeholder.
2. Add an entry to `AttackSkillLogic.SkillTypeHandlers` with the new type's `OnUse` implementation.
3. Update the Runtime Sequence description in the relevant domain file(s) (targeting-judgment.md at minimum) for the new type.
4. Any concrete skill of the new type is then just a `SkillDatabase` entry + `SkillSlots` binding, per above.
