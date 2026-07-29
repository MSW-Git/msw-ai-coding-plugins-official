# MSW `.model` Files — Authoring Domain

A `.model` is an entity template. This document carries the **domain rules** of `.model` authoring — when to create one, which template to start from, which component combinations fit which entity types, and the lifecycle order when a script component is bound to a model.

> **The actual call protocol for `.model` mutation — `ModelBuilder` API, fluent-chaining rules, `typeKey` values, validation (M030–M036), child entity invariants, event-link authoring, `.model` → `.map` cross-flow — lives in [builder-protocol-model.md §2](builder-protocol-model.md), with the shared contract in the [builder-protocol.md](builder-protocol.md) core. Both must be in context on every turn that touches `.model` (read only if missing — see the Builder Protocol Preflight in SKILL.md).**

## 0. Non-Negotiable Rule (summary)

- Do not inspect or edit `.model` JSON directly. No `Read` / `cat` / `Get-Content` / `grep` / manual JSON patches.
- All read / create / update / write goes through `scripts/model/msw_model_builder.cjs` (`ModelBuilder`).
- The builder **fully owns** `EntryKey`, `ContentProto.Json.Id/Name`, value type descriptors, inspector-property links, child model shape, and event-link preservation.
- Concrete call patterns / API tables / chaining-safe vs non-builder returns / `typeKey` values / helper functions → [builder-protocol-model.md §2](builder-protocol-model.md).

## 1. When to Create a `.model`

Default rule: if the same entity composition will appear two or more times, author a `.model` and place instances via `modelId`. Runtime spawning with `SpawnByModelId` also requires a registered model.

| Situation | Choice |
|---|---|
| Same composition placed `>= 2` times in one map | Create `.model` |
| Same composition used across maps | Create `.model` |
| Runtime spawn via `SpawnByModelId` | Create `.model` |
| Complex inspector-exposed defaults | Create `.model` |
| Truly one-off decoration used once | Inline map entity is acceptable |

Save user models under `RootDesk/MyDesk/Models/{Category}/{Name}.model`, never directly under `MyDesk/`, directly under `Models/`, or under `Global/`.

When creating a new folder, create the folder only. Maker Refresh generates folder metadata later.

## 2. Template Catalog

Never start from a blank model. Pick the closest template from the skill-local `models/` folder, then load it with `ModelBuilder.fromTemplate()`.

### 2.0 Template Path

Templates live in this skill's own `models/` folder, sibling to `scripts/` and `references/`. The `../models/<Name>.model` notation in the tables below is a **catalog identifier** — not the literal string to pass to `fromTemplate`.

`fromTemplate`'s first argument is resolved against `process.cwd()`, so always pass either an **absolute path** or a `__dirname`-derived path. Never guess. Templates are NOT under `Global/`, `RootDesk/`, `MyDesk/`, or a top-level `Models/` — those are output locations. An error like `model file not found: ./Global/<Name>.model` means the path was fabricated; recompute it from the skill location, do not create a file there.

```javascript
const path = require("path");
const templateDir = path.join(__dirname, "..", "models"); // from a script under scripts/model/
ModelBuilder.fromTemplate(path.join(templateDir, "ChaseMonster.model"), "MyMonster");
```

### Base

| Template | Use |
|---|---|
| `../models/TransformOnly.model` | Empty entity with only `TransformComponent` |

### Characters / Players

| Template | Use |
|---|---|
| `../models/Player.model` | Player variant |
| `../models/DefaultPlayer.model` | DefaultPlayer customization, usually with `BaseModelId` |

### Monsters

Read [`monster.md`](monster.md) before authoring a monster.

| Template | Use |
|---|---|
| `../models/MonsterCanonical.model` | Default start for new monsters |
| `../models/ChaseMonster.model` | Chasing side-view monster, with caveats in [`monster.md`](monster.md) |
| `../models/MoveMonster.model` | Patrol movement monster, with caveats in [`monster.md`](monster.md) |
| `../models/StaticMonster.model` | Stationary attacker, with caveats in [`monster.md`](monster.md) |

### NPC / Interaction

| Template | Use |
|---|---|
| `../models/StaticNPC.model` | Static NPC with dialogue/name tag |

### Terrain

| Template | Use |
|---|---|
| `../models/Foothold.model` | MapleTile foothold |
| `../models/Ladder.model` | Climbable ladder |
| `../models/Rope.model` | Climbable rope |
| `../models/Portal.model` | Map portal/teleport trigger |

### Map Objects / Decoration

| Template | Use |
|---|---|
| `../models/MapObject.model` | Generic decorative object |
| `../models/ParticleMapObject.model` | Object with particles |
| `../models/SkeletonMapObject.model` | Skeleton-based animated object |
| `../models/ItemAsset.model` | Item display |

### Particles / Effects

| Template | Use |
|---|---|
| `../models/BasicParticle.model` | Generic particle |
| `../models/SpriteParticle.model` | Sprite-sheet particle |
| `../models/AreaParticle.model` | Area effect |
| `../models/AnimationPlayer.model` | One-shot animation effect |

### Sound

| Template | Use |
|---|---|
| `../models/Sound.model` | Position-based sound |
| `../models/SoundEffect.model` | One-shot SFX |

### Tilemap Containers

| Template | Use |
|---|---|
| `../models/TileMap.model` | MapleTile tile container |
| `../models/RectTileMap.model` | RectTile/SideViewRectTile tile container |
| `../models/MapleMapLayer.model` | Maple-style map layer |
| `../models/MapEmpty.model` | Empty map container |

### External Media / UI Prefabs

| Template | Use |
|---|---|
| `../models/WebSprite.model` | External image URL |
| `../models/YoutubePlayerWorld.model` | YouTube world object |
| `../models/UIButton.model` | UI button prefab |
| `../models/UIText.model` | Simple UI text prefab |
| `../models/UITextGUIRenderer.model` | Text GUI renderer prefab |
| `../models/UISprite.model` | UI sprite prefab |
| `../models/UIGroup.model` | UI group prefab |
| `../models/UIEmpty.model` | Empty UI prefab |

For full UI layout work, use the `msw-ui-system` skill instead of authoring UI models directly.

## 3. Builder Workflow / 4. API Quick Reference — see builder-protocol-model.md

The call sequence (`fromTemplate` / `read` / fluent mutate / `write`), per-method API signatures, chaining-safe vs `false`-return distinction, `typeKey` values (`bool` / `int` / ... / `action_sheet`), helpers (`vector2` / `vector3` / `quaternion` / `dataRef` / `collisionGroup` / `actionSheet`), Inspector Property / Child Entity tree (child shell schema, ParentId invariants, validation rules M030–M036), Event Link, and `.model` → `.map` cross-flow (`ModelBuilder.write` → `MapBuilder.placeModel`) — **every invocation detail is consolidated in [builder-protocol-model.md §2](builder-protocol-model.md) + [builder-protocol.md §4](builder-protocol.md).**

This document covers only the **domain** side of `.model` authoring:

- When to create a `.model` (§1)
- Which template to start from (§2)
- Which component combinations fit which entity types (§5)
- Lifecycle order when a script component lives inside a `.model` (§6)
- Pre-completion checklist (§7)

## 5. Component Combinations

| Entity Type | Core Components |
|---|---|
| Visual object | `TransformComponent`, `SpriteRendererComponent` |
| MapleTile side-view moving monster | `MovementComponent`, `RigidbodyComponent`, `StateComponent`, `HitComponent` |
| RectTile top-down moving object | `MovementComponent`, `KinematicbodyComponent` |
| SideViewRectTile moving object | `MovementComponent`, `SideviewbodyComponent` |
| Interactive NPC | `SpriteRendererComponent`, `TouchReceiveComponent` |
| Attackable enemy | `AttackComponent`, `HitComponent` |

Body component must match the target map's `TileMapMode`; see [`platform.md`](platform.md) §4.

## 6. Script Components

Custom `script.XXX` components in `.model` depend on the script type already being registered.

Required order:

1. Write the script `.mlua`.
2. Maker `refresh`.
3. Build or patch the `.model` through `ModelBuilder`.
4. Maker `refresh` again.

If this order is inconvenient, keep the `.model` native-only and attach the script at spawn time with `entity:AddComponent("ScriptName")`.

## 7. Checklist

- [ ] Used `ModelBuilder.read()` / `snapshot()` / `fromTemplate()`, not raw `.model` reading.
- [ ] `fromTemplate` path is absolute or `__dirname`-derived (§2.0); never `./Global/...`, `./Models/...`, or a guess.
- [ ] Saved under `RootDesk/MyDesk/Models/{Category}/`.
- [ ] Created any needed folder only; left folder metadata to Maker Refresh.
- [ ] Picked the Body component matching `TileMapMode`.
- [ ] Set a real `SpriteRUID` when using `SpriteRendererComponent`.
- [ ] Used explicit `typeKey` for new or changed values.
- [ ] Called Maker `refresh` after write.
- [ ] Checked logs after refresh/play.

## 8. Related Docs

| Doc | Purpose |
|---|---|
| [builder-protocol-model.md §2](builder-protocol-model.md) | **`.model` call protocol — ModelBuilder API, chaining rules, `typeKey`, Child Entity, Event Link, validation** (with the [builder-protocol.md](builder-protocol.md) core — both in context whenever a turn touches `.model`) |
| [builder-protocol.md §4](builder-protocol.md) | `.model` → `.map` cross-flow (`ModelBuilder.write` → `MapBuilder.placeModel` → `refresh`) |
| [`entity.md`](entity.md) | Placing the authored model in a map, spawn, runtime verification domain |
| [`monster.md`](monster.md) | Monster-specific canonical defaults and pitfalls |
| [platform.md](platform.md) (core) | File location rules, folder metadata, TileMapMode ↔ Body, ID generation |
| [platform-maple.md](platform-maple.md) / [platform-rect.md](platform-rect.md) / [platform-sideview.md](platform-sideview.md) | Per-map-type Body / movement patterns |
| `msw-scripting` | Authoring the `.mlua` scripts attached to models |
| `msw-search` | Resource lookup such as `SpriteRUID` |
