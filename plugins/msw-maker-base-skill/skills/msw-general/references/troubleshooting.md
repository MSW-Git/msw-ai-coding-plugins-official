# MSW Troubleshooting — Symptom Dictionary

**A debugging dictionary indexed by symptom.** When a user says things like "it's not moving" / "it's not showing" / `LEA-3004`, **open this file first**, find the matching row, and navigate to the referenced § in [`platform.md`](platform.md) / `platform-{type}.md`.

> This file was split from [`platform.md` §11 / §12](platform.md) as a unified troubleshooting index. Per-map-type troubleshooting details also appear in the "Troubleshooting" sections of [`platform-maple.md`](platform-maple.md) / [`platform-rect.md`](platform-rect.md) / [`platform-sideview.md`](platform-sideview.md).

---

## 1. Symptom-Driven Index — Trigger Phrases First

| What the user/log shows | Primary suspect | Go-to section |
|---|---|---|
| "Won't move" / "Movement broken" / entity stays still with no error | TileMapMode ↔ Body mismatch | [§2 Map Type Mismatch](#2-map-type-mismatch) → the corresponding `platform-*.md` |
| "Won't render" / "Disappeared" / blank spot on screen | `SpriteRUID = ""` | [§3 Other Common Pitfalls — invisible](#3-other-common-pitfalls) → [`platform.md` §7](platform.md) |
| "Floating in mid-air" / "Won't touch the ground" | `Gravity = 0` (MapleTile) or wrong Body | [`platform-maple.md` §7](platform-maple.md) |
| "Stuck in a wall" / "Passes through walls" | Wall detection not implemented (SideView) or tile Movable not set (RectTile) | [`platform-sideview.md` §7](platform-sideview.md) / [`platform-rect.md` §7](platform-rect.md) |
| "Falls off the foothold" / "Should stop at the edge" | `PredictFootholdEnd` not used (MapleTile) | [`platform-maple.md` §5 Monster patrol pattern](platform-maple.md) |
| "Disappears off the map" | Gravity code left over in a RectTile map | [`platform-rect.md` §7](platform-rect.md) |
| "Can't jump over the wall" (RectTile) | RectTile jump is visual-only — Movable property needed | [`platform-rect.md` §6](platform-rect.md) |
| "Won't spawn" / "Runtime error" | `parent = nil` or wrong modelId | [§3](#3-other-common-pitfalls) → [`platform.md` §8](platform.md) |
| "Coordinates are way too big/small" / entity off-screen | Pixel values used (missing 1 unit = 100px conversion) | [`platform.md` §5](platform.md) |
| "File doesn't show up in Maker" | File created under `Global/` | [`platform.md` §2](platform.md) |
| "Only moves on the client / no multiplayer sync" | Missing `[server only]` | [§3](#3-other-common-pitfalls) |
| Occluded entity appears behind another entity | SortingLayer / OrderInLayer / Z priority | [`platform.md` §6](platform.md) |

---

## 2. Map Type Mismatch

**The most common silent failure when authoring maps.**

### LEA-3004 MissingComponent

**If any of the following three messages appear in the runtime log, it is 100% a TileMapMode ↔ Body mismatch.**

| TileMapMode | Required Body | Log when missing |
|---|---|---|
| `0` MapleTile | `RigidbodyComponent` | `[LEA-3004] MissingComponent : Entity is missing 'RigidbodyComponent'.` |
| `1` RectTile | `KinematicbodyComponent` | `[LEA-3004] MissingComponent : Entity is missing 'KinematicbodyComponent'.` |
| `2` SideViewRectTile | `SideviewbodyComponent` | `[LEA-3004] MissingComponent : Entity is missing 'SideviewbodyComponent'.` |

**Cause patterns**:
- A `.model` imported from a different map type (Body doesn't match)
- A dynamic entity missing a Body entirely
- The map's `TileMapMode` was changed but existing models/entities weren't updated to match

**Fix**: Add/swap the correct Body from the table above in the `.model` or the entity's `@components` → `refresh`. **Do not work around this by removing `MovementComponent`** — collision/events will all break.

**Prevention**: Always read `MapComponent.TileMapMode` as a number at the start of work, and verify that every dynamic entity's Body matches ([`platform.md` §4 Check protocol](platform.md)).

### Map Type Mismatch — Per-Body Symptoms

| Symptom | Cause | Fix |
|---|---|---|
| Entity doesn't move (no error) | Body ↔ TileMapMode mismatch | Body swap per [`platform.md`](platform.md) §4 mapping table |
| Monster floating in mid-air (MapleTile) | `Gravity = 0` | Set `Gravity` to a positive value |
| Monster falls off platform edge (MapleTile) | No foothold-end handling | Reverse direction with `PredictFootholdEnd` |
| Monster disappears off-map (RectTile) | Leftover gravity code | Remove gravity code in RectTile |
| Can't jump over walls in RectTile | RectTile jump is **visual-only** | Change the tile's Movable property |
| Floating in mid-air in SideViewRectTile | Using `KinematicbodyComponent` | Switch to `SideviewbodyComponent` |
| Tile collision broken in SideViewRectTile | Using `RigidbodyComponent` | Switch to `SideviewbodyComponent` |
| `PredictFootholdEnd` error in SideViewRectTile | Not a Foothold system (MapleTile-only) | Use `RectTileCollisionBeginEvent` Normal for wall detection |
| Monster gets stuck in wall (SideViewRectTile) | No wall detection logic | Use `RectTileCollisionBeginEvent + Normal` |

---

## 3. Other Common Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Not visible on screen | `SpriteRUID = ""` | Find and assign an RUID via `msw-search` or Resource API ([`platform.md` §7](platform.md)) |
| Only `TransformComponent` moves; gravity/collision ignored | Not using Body's `MoveVelocity` | Use the Body component's `MoveVelocity` |
| Moves only on client; no multiplayer sync | Missing `[server only]` | Run movement logic on the server |
| `SpawnByModelId` runtime error | `parent = nil` | Pass `self.Entity.CurrentMap` |
| `SpawnByModelId` returns nil | Model id typo / doesn't exist | nil-check the return value |
| Coordinates off by 100× | Using pixel values | Use world units (÷100) |
| File not visible in Maker | Created under `Global/` | Move to `RootDesk/MyDesk/` |
| Should be on top but rendered behind | SortingLayer / OrderInLayer / Z priority not set | Check the 3-level priority in [`platform.md` §6](platform.md) |
| All existing models break after mode switch | Body and event handlers not updated after TileMapMode change | [`platform.md` §4 Cautions When Switching Map Type](platform.md) |
| New folder not recognized in Maker | Folder meta Refresh not run | Run Maker Refresh. If no Refresh tool is available, just leave the folder ([`platform.md` §2](platform.md)) |
| `script ... extends ...` not registered | `.codeblock` not created | Run `refresh` ([`platform.md` §3](platform.md)) |
| CoreVersion warning | CoreVersion mismatch in `Environment/config` | Verify it is `26.7.0.0` ([`platform.md` §16](platform.md)) |

---

## 4. When Stuck — Decision Tree

1. **If `[LEA-3004]` appears in the log** → Go straight to §2 LEA-3004 table. Body swap.
2. **If nothing in the log but entity doesn't move** → Almost certainly a silent failure. Re-read `TileMapMode` as a number ([`platform.md` §4](platform.md)) and re-verify the Body mapping.
3. **If nothing in the log but entity is invisible** → Check if `SpriteRUID` is `""` first ([`platform.md` §7](platform.md)). Then check SortingLayer ([`platform.md` §6](platform.md)).
4. **If nothing in the log but coordinates are wrong** → Pixel ↔ world unit conversion ([`platform.md` §5](platform.md)).
5. **If still unresolved** → Read the entire Troubleshooting section of the matching `platform-{maple|rect|sideview}.md` and compare.

---

## 5. Cross-references

- [`platform.md`](platform.md) — 8 core rules, TileMapMode↔Body mapping, common rules for coordinates/RUID/spawn/SortingLayer
- [`platform-maple.md`](platform-maple.md) — MapleTile (side-view + foothold) patterns, events, checklist
- [`platform-rect.md`](platform-rect.md) — RectTile (top-down) specific
- [`platform-sideview.md`](platform-sideview.md) — SideViewRectTile (side-view + tile grid) specific
- [`entity.md`](entity.md) — Entity placement / Map Work Preflight
- [`tile.md`](tile.md) — Tile painting / Movable property
