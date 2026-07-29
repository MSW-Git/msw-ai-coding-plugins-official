# AI BehaviourTree — `AIComponent` + Composite/Action Node

## 0. When to use BT

| Pattern | Fit |
|---------|-----|
| **FSM** (`StateComponent`) | Simple enemies (3~5 states), player IDLE/HIT/DEAD, boss phases, animation sync (`AvatarStateAnimationComponent` auto mapping, SKILL §10) |
| **BT** (`AIComponent`) | Patrol + chase + attack combos, varied boss patterns, Composite/Decorator reuse, probability-weighted actions |

MSW supports **both paradigms natively**. Use BT for multi-layer decision making and reusable action modules.

> **Code-based BT vs data-based BT — pick one per `AIComponent`.** This reference covers the **code-based** path: `@BTNode` mlua scripts assembled at runtime via `AIComponent:CreateNode` / `SetRootNode`. The data-based path is a separate `.behaviourtree` JSON file edited in the Maker editor with `definitionId` wiring — that pipeline has its own authoring rules and lives in the **`msw-behaviourtree`** sibling skill. The two pipelines do **not** mix on the same `AIComponent`; if a project already has `.behaviourtree` assets, use `msw-behaviourtree` instead of this reference.
>
> The mix ban is enforced at runtime: calling `SetRootNode` on an `AIComponent` that has a `BehaviourTreeEntry` assigned **discards the entry tree and its Blackboard** — `BlackBoard` reads `nil` afterward and `*Key` node properties no longer resolve. If the tree relies on the editor Blackboard, never swap its root from script.

---

## 1. `AIComponent` API

```
@Component AIComponent
  property boolean IsLegacy = false                 -- fixed false (legacy deprecated)
  property boolean LogEnabled = false               -- BT execution log in Maker mode
  property UpdateAuthorityType UpdateAuthority = UpdateAuthorityType.Server

  method BTNode CreateLeafNode(string nodeName, func(float) -> BehaviourTreeStatus onBehave)
  method BTNode CreateNode(string nodeType, string nodeName = nil, func(float) -> BehaviourTreeStatus = nil)
  method void   SetRootNode(BTNode node)
```

`BehaviourTreeStatus`:

| Value | Meaning |
|-------|---------|
| `Success = 0` | Proceed to the next sibling node |
| `Running = 1` | Re-run the same node next frame (parent restarts from this child) |
| `Failure = 2` | Sequence terminates immediately / Selector tries the next sibling |

---

## 2. Composite Nodes (4 native + custom)

| Node | Child flow | Termination |
|------|-----------|-------------|
| `SequenceNode(name)` | Sequential | Returns Failure immediately on any child Failure; Success if all succeed |
| `SelectorNode(name)` | Sequential | Returns Success immediately on any child Success; Failure if all fail |
| `RandomSelectorNode(name)` | **Picks one child by weighted probability** and runs it | Returns the chosen child's result as-is. While Running, sticks to the same child |
| `ParallelNode(name)` | All children run in parallel | Success when all succeed; Failure if any fails |

### Common methods (all Composites, 1-indexed)

```
method void    AttachChild(BTNode node)
method void    AttachChildAt(BTNode node, int32 index)
method boolean DetachChild(BTNode node | string nodeName)
method void    DetachChildAt(int32 index)
```

> ⚠ **Attach/Detach work only on composites created from script** (`CreateNode` or a native composite constructor). Calling them on a composite loaded from a `.behaviourtree` (assigned via `AIComponent.BehaviourTreeId`) logs an InvalidOperation error and does nothing.

### Extra methods on `RandomSelectorNode`

```
method void    AttachChild(BTNode node, number probability)        -- 0~1
method boolean SetChildNodeProbability(BTNode node, number probability)
```

### Custom Composite — `@BTNode ... extends CompositeNode`

When the four native child-flow policies don't fit (round-robin, priority re-scan, weighted retry, ...), extend `CompositeNode` instead of `BTNode` and drive the children yourself from `OnBehave`:

- `ChildCount` (read-only) — number of attached children
- `ChildBehave(index, delta)` — runs child `index` (**1-based**) and returns its `BehaviourTreeStatus`; out-of-range index returns `Failure`

```lua
@BTNode
script RoundRobin extends CompositeNode
    @HideFromInspector
    property number Cursor = 1

    method any OnBehave(number delta)
        if self.ChildCount == 0 then return BehaviourTreeStatus.Failure end
        local r = self:ChildBehave(self.Cursor, delta)
        if r == BehaviourTreeStatus.Running then return r end
        self.Cursor = (self.Cursor % self.ChildCount) + 1
        return r
    end
end
```

Create it with the same call as Action nodes — `AIComponent:CreateNode("RoundRobin", "cycle")` (the engine picks the node category from the `extends` base) — then wire children with `AttachChild` as usual.

---

## 3. Action Node — user-defined via `@BTNode`

> **The source annotation and the Maker UI menu name differ.** The only annotation written in the mlua source is `@BTNode`. Confusing it with the "Create BTNodeType" menu name in the Maker UI and writing `@BTNodeType` **passes the build (info-level) but does not generate the `.codeblock`** → `CreateNode("ActionWait", ...)` returns `nil` → `[LEA-2007] AttemptToIndex`.
>
> **`extends BTNode` is required.** Inheritance is what activates the `Behave`/`ParentAI`/`Name` members.

### Lifecycle

| Method | When called |
|--------|-------------|
| `OnInit()` | Right before `OnBehave()`. **Not called if the previous frame returned Running** (state-preserving semantics) |
| `OnBehave(number delta)` | Every frame the node executes. Must return a `BehaviourTreeStatus` |

### Two ways to create

**(a) `CreateNode` — based on a `@BTNode` script (reusable)**

```lua
@BTNode
script ActionWait extends BTNode
    property number Time = 2
    property number ElapsedTime = 0

    method void OnInit()
        self.ElapsedTime = 0
    end

    method any OnBehave(number delta)
        self.ElapsedTime += delta
        if self.ElapsedTime < self.Time then
            return BehaviourTreeStatus.Running
        end
        return BehaviourTreeStatus.Success
    end
end
```

```lua
local waitNode = self.Entity.AIComponent:CreateNode("ActionWait", "wait1")
```

**(b) `CreateLeafNode` — inline function (one-off)**

```lua
local logNode = self.Entity.AIComponent:CreateLeafNode("printLog", function(delta)
    log("Action!")
    return BehaviourTreeStatus.Success
end)
```

> ⚠ **Engine enums cannot cross execution spaces via `any`.** Boss/monster Action Nodes commonly broadcast a particle / effect from server logic via an `@ExecSpace("Client")` helper. Passing an engine enum (`BasicParticleType.SparkRadialExplosion`, etc.) through an `any` parameter triggers `[LEA-3036] InvalidCast` on the first call, and declaring the parameter with the enum type itself is rejected by mlua diagnostics. Encode the enum as a `string` key and branch on the receiver:
>
> ```lua
> @ExecSpace("Client")
> method void BroadcastParticle(string particleKey, Vector3 pos)
>     if particleKey == "spark_radial" then
>         _ParticleService:PlayBasicParticle(BasicParticleType.SparkRadialExplosion, self.Entity, pos, 0, Vector3(1,1,1), false, nil)
>     elseif particleKey == "charge" then
>         _ParticleService:PlayBasicParticle(BasicParticleType.Charge, self.Entity, pos, 0, Vector3(1,1,1), false, nil)
>     end
> end
> ```
>
> Same rule for `@ExecSpace("Server" | "Multicast")` parameters that carry enum values — declare them as `string` and decode in the receiver.

---

## 4. Decorator Node — custom (not native)

Conditional child execution, result inversion, repetition, etc. Standard pattern:

```lua
@BTNode
script DecoInverter extends BTNode
    property any Child = nil

    method any OnBehave(number delta)
        if self.Child == nil then return BehaviourTreeStatus.Failure end
        local r = self.Child:Behave(delta)
        if r == BehaviourTreeStatus.Success then return BehaviourTreeStatus.Failure end
        if r == BehaviourTreeStatus.Failure then return BehaviourTreeStatus.Success end
        return BehaviourTreeStatus.Running
    end
end
```

---

## 5. Memory (Blackboard) — custom (not native)

A shared state channel between Action Nodes. **`BTNode.ParentAI`** references the AIComponent that owns this tree → the access path to memory.

> `AIComponent.BlackBoard` (the editor Blackboard) exists **only for entry-based trees** — it is `nil` for runtime-assembled trees and after any `SetRootNode` call (§0 note). For code-built trees, share state with the Memory pattern below.

```lua
@Component
script AIPatrolComponent extends AIComponent
    property table Memory = {}

    @ExecSpace("ServerOnly")
    method void SetMemory(string key, any value)
        self.Memory[key] = value
    end

    @ExecSpace("ServerOnly")
    method any GetMemory(string key)
        return self.Memory[key]
    end
end
```

```lua
-- Inside an Action Node:
method any OnBehave(number delta)
    local parentAI = self.ParentAI       -- BTNode's ParentAI property
    local target = parentAI:GetMemory("PlayerInRange")
    if target == nil then return BehaviourTreeStatus.Failure end
    -- target chase logic
    return BehaviourTreeStatus.Running
end
```

---

## 6. Tree assembly — standard pattern

```lua
@ExecSpace("ServerOnly")
method void OnBeginPlay()
    -- 1. Create Composites
    local root     = SelectorNode("root")
    local chaseSeq = SequenceNode("chase")
    local idleSeq  = SequenceNode("idle")

    -- 2. Create Actions
    local hasTarget = self:CreateNode("DecoHasTarget",   "hasTarget")
    local follow    = self:CreateNode("ActionFollow",    "follow")
    local noTarget  = self:CreateNode("DecoHasNoTarget", "noTarget")
    local wander    = self:CreateNode("ActionMoveRandom","wander")
    local wait      = self:CreateNode("ActionWait",      "wait")

    -- 3. Wire (left→right = high→low priority)
    chaseSeq:AttachChild(hasTarget)
    chaseSeq:AttachChild(follow)
    idleSeq:AttachChild(noTarget)
    idleSeq:AttachChild(wander)
    idleSeq:AttachChild(wait)
    root:AttachChild(chaseSeq)
    root:AttachChild(idleSeq)

    -- 4. Register root → runs automatically every frame
    self:SetRootNode(root)
end
```

Each frame traverses from the root left→right, top→bottom. Children that return Running are re-run by the parent next frame, starting from that child.

---

## 7. Running semantics — essentials

- Child returns Running → the parent re-runs **from that child** next frame (if the first child of a Sequence returns Running, the second is not called)
- `Parallel` exception: every child runs every frame; children that already returned Success/Failure are skipped
- `OnInit()` is not called the next frame after Running → accumulated time/state is preserved

---

## 8. Native BT components — `AIChaseComponent` / `AIWanderComponent`

Usable immediately without writing your own BT. Both have `CreateLeafNode`/`CreateNode`/`SetRootNode` → **native chase/wander can be mixed with custom BT nodes**.

| Component | Behavior | Extra API |
|-----------|----------|-----------|
| `AIChaseComponent` | Auto-chases the nearest player within `DetectionRange` (default 5) | `IsChaseNearPlayer`, `TargetEntityRef`, `GetCurrentTarget()`, `SetTarget(Entity)` |
| `AIWanderComponent` | Random direction wandering | — |

> ⚠ **Velocity conflict**: `AIChaseComponent`/`AIWanderComponent` call `MovementComponent.MoveToDirection` → `Body.SetVelocity` every frame. When used alongside a custom chase script, they overwrite the velocity. **Remove both from the `.model` when using custom AI.** The two cannot coexist.

---

## 9. Threat / Aggro Table — custom (Memory pattern extension)

```lua
@ExecSpace("ServerOnly")
method void AddThreat(Entity attacker, number amount)
    local t = self:GetMemory("ThreatTable") or {}
    t[attacker] = (t[attacker] or 0) + amount
    self:SetMemory("ThreatTable", t)
end

method Entity GetTopThreat()
    local t = self:GetMemory("ThreatTable") or {}
    local best, max = nil, 0
    for ent, v in pairs(t) do
        if v > max then best, max = ent, v end
    end
    return best
end
```

In `HandleHitEvent`, call `AddThreat(event.AttackerEntity, event.TotalDamage)` → the BT chase node uses `GetTopThreat()` to pick priorities.

---

## 10. Checklist

- [ ] **Custom Action/Decorator scripts have both `@BTNode` and `extends BTNode`; custom Composites use `@BTNode` + `extends CompositeNode`** (`@BTNodeType` builds but does not generate the `.codeblock`)
- [ ] After `refresh`, a `.codeblock` with the same name exists next to the custom BTNode `.mlua` — if missing, the annotation or extends is missing
- [ ] If `CreateNode("XXX", ...)` returns `nil`, `[LEA-2007] AttemptToIndex` follows → check annotation and extends
- [ ] `AIComponent.IsLegacy = false` (legacy deprecated)
- [ ] Keep `UpdateAuthority = Server` (same space as a custom chase script)
- [ ] Every Action Node `OnBehave` returns a `BehaviourTreeStatus`
- [ ] Be aware of Running semantics — when a Sequence's first child Runs, the second is not called
- [ ] When using custom BT, **remove** `AIChaseComponent`/`AIWanderComponent` from the `.model`
- [ ] Access the Memory table only through `@ExecSpace("ServerOnly")` methods (to prevent RPC leakage)
- [ ] `DisconnectEvent` external event handlers in `OnEndPlay`
