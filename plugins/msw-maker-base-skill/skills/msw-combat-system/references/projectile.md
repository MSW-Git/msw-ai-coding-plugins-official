# Projectile system — ProjectileComponent + SpawnByModelId

> Attack Resolution basics and per-Body knockback live in [`msw-combat-system/SKILL.md`](../SKILL.md) §1·§3.

> ⚠ **`CollisionGroups.Monster` in the examples below is an exact-match filter on the defender's `HitComponent.CollisionGroup`** — it only works because the target monsters' `HitComponent.CollisionGroup` is set to `Monster`. If your monsters keep the default (`HitBox`) or another group, the attack hits **0 targets with no error**. Either set the monsters' group to match, or omit the argument (`nil` = every `HitComponent`). Details: [`SKILL.md`](../SKILL.md) §1-2.

---

## Core architecture

### Why a separate entity

A projectile has an independent lifecycle (spawn → move → hit → destroy), so separating it from the firing unit into its own entity is the standard MSW pattern.

### Projectile model composition (no Body)

| Component | Role |
|-----------|------|
| `TransformComponent` | Position / scale |
| `SpriteRendererComponent` | Projectile image render |
| `ProjectileComponent` (custom) | Movement / hit handling. After writing the `.mlua` and running Maker **Refresh once**, the generated `.codeblock` lets you include it as a component directly in `.model` |

### Hit detection comparison

| Approach | Pros | Cons | Fit |
|----------|------|------|-----|
| **Distance-based (OnUpdate)** | Simple, target specification is precise | Pierce/area needs extra logic | Homing projectiles, tower defense |
| **TriggerComponent** | Reacts to unknown targets, pierce is natural | Requires Collider + collision group setup | Bullet hell, straight fire with no target |

When the target is already known → **distance-based is the simplest**.

### Server / client responsibility split

| Task | Execution location |
|------|--------------------|
| Spawn projectile | `@ExecSpace("ServerOnly")` |
| Movement / hit / damage | `@ExecSpace("ServerOnly")` |
| Hit effect playback | `@ExecSpace("Client")` — when called from server, dispatched to clients |

`@ExecSpace("ClientOnly")`: **ignored** when called from the server. Always use `"Client"`.

---

## Step 1: Create the ProjectileComponent script

Create the `.mlua` under `RootDesk/MyDesk/`. (The `.codeblock` is auto-generated after Maker Refresh.)

```lua
@Component
script ProjectileComponent extends Component

    property number Speed = 10          -- movement speed
    property number Damage = 10         -- damage on hit
    property number MaxLifetime = 3     -- auto-destroy time (seconds)
    property string HitEffectRUID = ""  -- hit effect RUID
    property number HitRadius = 0.5     -- hit distance threshold
    property string EnemyModelId = ""   -- enemy scan model id (straight projectile)

    method void OnBeginPlay()
        self._T.fired = false
        self._T.lifetime = 0
        self._T.dirX = 0
        self._T.dirY = 0
    end

    -- Fire: compute target direction, set fired=true
    @ExecSpace("ServerOnly")
    method void Fire(Entity target)
        self._T.target = target
        if target ~= nil and isvalid(target) then
            local myPos = self.Entity.TransformComponent.Position
            local tPos  = target.TransformComponent.Position
            local dx = tPos.x - myPos.x
            local dy = tPos.y - myPos.y
            local dist = math.sqrt(dx*dx + dy*dy)
            if dist > 0 then
                self._T.dirX = dx / dist
                self._T.dirY = dy / dist
            else
                self._T.dirX = 1
                self._T.dirY = 0
            end
        end
        self._T.fired = true
    end

    -- Movement + homing + hit detection
    @ExecSpace("ServerOnly")
    method void OnUpdate(number delta)
        if not self._T.fired then return end

        self._T.lifetime = self._T.lifetime + delta
        if self._T.lifetime >= self.MaxLifetime then
            _EntityService:Destroy(self.Entity)
            return
        end

        if self._T.target ~= nil and isvalid(self._T.target) then
            local myPos = self.Entity.TransformComponent.Position
            local tPos  = self._T.target.TransformComponent.Position
            local dx = tPos.x - myPos.x
            local dy = tPos.y - myPos.y
            local dist = math.sqrt(dx*dx + dy*dy)

            -- Hit
            if dist <= self.HitRadius then
                self:OnHit()
                return
            end

            -- Homing: recompute direction each frame (remove this block for straight projectiles)
            if dist > 0 then
                self._T.dirX = dx / dist
                self._T.dirY = dy / dist
            end
        end

        -- Move — for a Body-less entity, use Translate (§1-6)
        self.Entity.TransformComponent:Translate(
            self._T.dirX * self.Speed * delta,
            self._T.dirY * self.Speed * delta
        )
    end

    -- Hit handling (server)
    -- ⚠ Do not subtract HP directly — bypassing HitEvent skips damage skin / hit effect / IsHitTarget immunity entirely.
    --   Details: msw-combat-system/SKILL.md §2-3
    -- Recommended: add an AttackComponent-derived script to the projectile model → fire an ad-hoc hitbox via AttackFrom
    @ExecSpace("ServerOnly")
    method void OnHit()
        local pos = self.Entity.TransformComponent.Position      -- Vector3
        local ac = self.Entity.AttackComponent
        if ac ~= nil then
            ac:AttackFrom(
                Vector2(self.HitRadius * 2, self.HitRadius * 2),  -- hitbox size (Vector2)
                pos:ToVector2(),                                  -- hit position (Vector2 — AttackFrom takes Vector2, not Vector3)
                "projectile",                                     -- attackInfo
                CollisionGroups.Monster
            )
        end
        -- Preserve coordinates before destruction and call the effect (so it persists after entity destruction)
        self:ShowHitEffect(pos.x, pos.y, pos.z)
        _EntityService:Destroy(self.Entity)
    end

    -- Hit effect (client)
    -- Use PlayEffect (fixed coordinates): the effect keeps playing even after the entity is destroyed
    -- PlayEffectAttached (attached to the entity) disappears when the entity is destroyed
    @ExecSpace("Client")
    method void ShowHitEffect(number px, number py, number pz)
        if self.HitEffectRUID == "" then return end
        local mapEntity = self.Entity.CurrentMap
        if mapEntity == nil then return end
        _EffectService:PlayEffect(
            self.HitEffectRUID, mapEntity,
            Vector3(px, py, pz), 0, Vector3(1, 1, 1), false
        )
    end

    method void OnEndPlay()
        -- _T is cleaned up by the engine, no manual release needed
    end

end
```

---

## Step 2: Create the projectile model

After writing the `.mlua`, run Maker **Refresh** once → `ProjectileComponent.codeblock` is auto-generated. Then include the following in the `.model`:

| Component | Key values |
|-----------|------------|
| `MOD.Core.TransformComponent` | default (reduce `Scale` if needed) |
| `MOD.Core.SpriteRendererComponent` | `SpriteRUID = <projectile sprite RUID>`, `OrderInLayer = 5`(above units), `SortingLayer = "MapLayer0"` |
| `ProjectileAttackComponent` (custom, `AttackComponent`-derived) | Calls `AttackFrom` from `OnHit` → normal HitEvent pipeline. Override `CalcDamage`/`IsAttackTarget` for damage/target policy. **⚠ Do not add `@ExecSpace`** — the parent has an unspecified ExecSpace (=All), so adding `@ExecSpace("ServerOnly")` etc. in the child triggers LEA-3014. See [`msw-scripting/SKILL.md`](../../msw-scripting/SKILL.md) §9 |
| `ProjectileComponent` | Set property defaults (Speed/Damage etc.) in `.model` so spawns don't need to reconfigure |

> `ProjectileAttackComponent` (or an equivalent script) **must** be included for damage skin / hit effect / i-frame to work. Bypassing with simple `ai.HP -= damage` is wrong — see [`msw-combat-system/SKILL.md`](../SKILL.md) §2-3.

Projectile sprite search:
```
msw-search → resource search: "energy ball", "arrow", "fireball" / type: sprite / category: skill
```

---

## Step 3: Spawn + fire

Since `ProjectileComponent` is already included in the `.model`, use the component handle directly after `SpawnByModelId`.

```
-- SpawnService.d.mlua
_SpawnService:SpawnByModelId(string id, string name, Vector3 spawnPosition, Entity parent) → Entity
```

```lua
@ExecSpace("ServerOnly")
method void FireProjectile(Entity target)
    local parent = self.Entity.CurrentMap
    if parent == nil then return end

    -- Unique name (collision prevention)
    if self._T.projCount == nil then self._T.projCount = 0 end
    self._T.projCount = self._T.projCount + 1
    local name = "proj_" .. tostring(self._T.projCount)

    local myPos = self.Entity.TransformComponent.Position
    local proj = _SpawnService:SpawnByModelId(
        self._T.projectileModelId,     -- the .model's EntryKey (case-insensitive), not a URL
        name,
        Vector3(myPos.x, myPos.y, myPos.z),
        parent
    )
    if proj == nil then return end

    -- ProjectileComponent is already in the .model → just receive the handle and configure
    local pc = proj.ProjectileComponent
    if pc == nil then return end
    pc.Speed    = 10
    pc.Damage   = self.Damage
    pc.HitRadius = 0.5
    pc.HitEffectRUID = "<hit effect RUID>"
    pc:Fire(target)
end
```

### Obtaining the parent entity

```lua
self.Entity.CurrentMap                                  -- current map entity (recommended)
_EntityService:GetEntityByPath("/maps/MapName")          -- explicit path
```

---

## Step 4: Wire into the firing unit (melee ↔ ranged branch)

```lua
@ExecSpace("ServerOnly")
method void TryAttack()
    if self._T.target == nil or not isvalid(self._T.target) then return end
    if self._T.atkTm < self.AttackCooldown then return end
    self._T.atkTm = 0

    if self.UseProjectile then
        self:FireProjectile(self._T.target)
    else
        -- Direct melee hit
        local ac = self.Entity.AttackComponent
        if ac ~= nil then
            ac:Attack(Vector2(1.5, 1.0), Vector2(0, 0), "melee", CollisionGroups.Monster)
        end
    end
end
```

---

## Variants

### Straight projectile (no homing)

Remove the direction-recompute block in `OnUpdate`. Instead scan for enemies ahead via `EnemyModelId`:

```lua
-- Replace the homing block in OnUpdate with:
local enemies = _EntityService:GetEntitiesSpawnedByModelId(self.EnemyModelId)
if enemies ~= nil then
    for _, enemy in pairs(enemies) do
        if isvalid(enemy) then
            local ep = enemy.TransformComponent.Position
            local pos = self.Entity.TransformComponent.Position
            local dx = pos.x - ep.x
            local dy = pos.y - ep.y
            if math.sqrt(dx*dx + dy*dy) <= self.HitRadius then
                self._T.target = enemy
                self:OnHit()
                return
            end
        end
    end
end
self.Entity.TransformComponent:Translate(
    self._T.dirX * self.Speed * delta,
    self._T.dirY * self.Speed * delta
)
```

### Pierce projectile

Remove `Destroy` in `OnHit`, prevent duplicates with `hitList`. Damage goes through `AttackFrom` + check the hitList in an attacker-side `IsAttackTarget` override:

```lua
@ExecSpace("ServerOnly")
method void OnHit()
    if self._T.hitList == nil then self._T.hitList = {} end

    local pos = self.Entity.TransformComponent.Position          -- Vector3
    local ac = self.Entity.AttackComponent
    if ac ~= nil then
        ac:AttackFrom(
            Vector2(self.HitRadius * 2, self.HitRadius * 2),
            pos:ToVector2(), "projectile.pierce", CollisionGroups.Monster  -- AttackFrom takes Vector2
        )
    end

    self:ShowHitEffect(pos.x, pos.y, pos.z)
    -- Do not call Destroy → pierce
end
```

Block duplicate hits in `ProjectileAttackComponent`:

```lua
-- ⚠ AttackComponent.IsAttackTarget has an unspecified ExecSpace (=All) on the parent.
--   Adding @ExecSpace to the override triggers LEA-3014 SignatureMismatch.
--   Details: msw-scripting/SKILL.md §9 "Method override"
method boolean IsAttackTarget(Entity defender, string attackInfo)
    local proj = self.Entity.ProjectileComponent
    if proj == nil then return __base:IsAttackTarget(defender, attackInfo) end
    if proj._T.hitList == nil then proj._T.hitList = {} end
    local id = defender.Name
    if proj._T.hitList[id] then return false end
    proj._T.hitList[id] = true
    return __base:IsAttackTarget(defender, attackInfo)
end
```

### Area explosion (AOE)

```lua
@ExecSpace("ServerOnly")
method void OnHit()
    local pos = self.Entity.TransformComponent.Position          -- Vector3
    local blastRadius = 2.0
    local ac = self.Entity.AttackComponent
    if ac ~= nil then
        -- Circular AoE in one call — Shape-based Attack (CircleShape takes Vector2)
        ac:Attack(CircleShape(pos:ToVector2(), blastRadius), "projectile.aoe", CollisionGroups.Monster)
    end
    self:ShowHitEffect(pos.x, pos.y, pos.z)
    _EntityService:Destroy(self.Entity)
end
```

---

## Constraints

| Item | Rule |
|------|------|
| Spawn | `SpawnByModelId` can only be called on the server |
| Model id format | The `.model` file's **EntryKey** (case-insensitive bare string, e.g. `"Fireball"`). The engine lowercases it and prepends `model://` internally; do **not** pass the URL form (`"model://..."` or `"model:///UUID"`) yourself. |
| Name uniqueness | The name parameter must be unique within the map → use a counter (`_T.projCount`) |
| MaxLifetime | Always set it — so the projectile does not linger forever when the target is destroyed |
| Effect | Use `PlayEffect` (fixed coordinates) — `PlayEffectAttached` disappears when the entity is destroyed |
| Movement | Body-less projectile → use `TransformComponent:Translate` (per §1-6) |
| Custom script | Write the `.mlua` → Maker Refresh once → include in `.model` as a component. Placing it in `.model` while the `.codeblock` is missing causes silent exclusion during deserialization. |
