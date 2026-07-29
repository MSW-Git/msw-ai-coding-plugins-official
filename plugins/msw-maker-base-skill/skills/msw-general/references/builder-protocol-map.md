# Builder Protocol — §1 MapBuilder (`.map`)

Per-builder file of the unified Builder Protocol. **[builder-protocol.md](builder-protocol.md) (core) must be in context alongside this file** — routing, the common workflow, the cross-builder chaining contract, §0 pre-flight, §4 cross-builder flow, and the §5 checklist live in the core and are not repeated here. Mutating another file type in the same turn requires that type's per-builder file too.

## Method index — what `MapBuilder` actually exposes

Alpha-sorted **camelCase** method names. **camelCase is canonical** — if a name does not appear here, do not call it. Signatures live in §1.3 below. Internal helpers (prefixed with `_`) are omitted.

**`MapBuilder`** — instance: `build` · `component` · `empty` · `entity` · `find` · `getFootholdBounds` · `getFootholds` · `getMapInfo` · `getTileAt` · `getTileBounds` · `getTileMapMode` · `getTiles` · `listEntities` · `patch` · `patchComponent` · `placeModel` · `remove` · `removeComponent` · `rename` · `snapshot` · `sprite` · `upsertComponent` · `write`. Static: `MapBuilder.fromTemplate` · `MapBuilder.load` · `MapBuilder.read` · `MapBuilder.snapshot` · `MapBuilder.templatePath`.

## §1 MapBuilder — `.map`

`MapBuilder` covers the safe subset needed for common agent map work. It does not replace Maker. Use it first for any covered operation; raw `.map` editing is allowed only for the explicit gaps listed in §1.6.

### §1.1 Load / Inspect

```javascript
const { MapBuilder } = require("./scripts/map/msw_map_builder.cjs");

const map = MapBuilder.read("map/map01.map");
MapBuilder.snapshot("map/map01.map");      // summary only, no instantiation

map.getMapInfo();        // TileMapMode, Gravity, IsInstanceMap, entity/tile/foothold counts
map.getTileMapMode();    // 0 MapleTile / 1 RectTile / 2 SideViewRectTile
map.listEntities();      // compact entity list
map.find("map01");       // by map root name
map.find("Monster01");   // child by relative name or /maps/... absolute path
map.component("Monster01", "MOD.Core.TransformComponent");
```

### §1.2 Snapshot Workflow (get → edit → set)

```
1. GET     MapBuilder.read("./map/{map}.map")
2. EDIT    builder API only (placeModel / sprite / patch / patchComponent / ...)
3. SET     map.write("./map/{map}.map")
4. SYNC    Maker MCP `refresh`
5. (opt.)  `play` → verify via `logs`
```

`.map` `Entities` arrays are very large. Direct raw JSON editing is reserved for the §1.6 coverage gaps and must stay minimal — everyday work goes through the builder snapshot/patch API.

### §1.3 API Reference

| Method | Returns | Purpose |
|---|---|---|
| `MapBuilder.fromTemplate(templatePath, mapName)` | `MapBuilder` | Clone a Maker-saved `.map`, rewriting `EntryKey`, root path, root name, entity UUIDs, and internal UUID/path references |
| `MapBuilder.read(path)` | `MapBuilder` | Load a `.map` |
| `MapBuilder.snapshot(path)` | summary | Read-only summary without instantiating |
| `MapBuilder.templatePath(kind)` | absolute path | Skill-local validated map template: `maple`/`0`, `rect`/`1`, `sideview`/`2` |
| `getMapInfo()` | summary | TileMapMode, gravity, instance flag, counts |
| `getTileMapMode()` | `0`/`1`/`2` | MapleTile / RectTile / SideViewRectTile |
| `listEntities()` | array | Compact entity list |
| `find(name)` | entity record | Lookup by map root name, relative child name, or `/maps/...` path |
| `component(name, compType)` | component object | Read a component on an entity |
| `placeModel(name, modelPath, opts)` | `MapBuilder` | Place a `.model` instance (`pos`, `componentOverrides`, ...). Root id via `lastId()` |
| `sprite(name, opts)` | `MapBuilder` | Sprite-renderer entity (`ruid`, `pos`, `order`). Id via `lastId()` |
| `empty(name, opts)` | `MapBuilder` | Empty / script-only entity (`pos`, `scripts`). Id via `lastId()` |
| `entity(name, components, opts)` | `MapBuilder` | Low-level entity placement. Id via `lastId()`. Upsert: existing-path root metadata (`name`/`nameEditable`/`enable`/`visible`/`localize`/`modelId`/`origin`/`displayOrder`) is preserved unless overridden in `opts`. `@components` is rebuilt from the caller's array (caller's components are authoritative when calling `entity()` directly). `sprite()` / `empty()` / `placeModel()` route through `entity()` with an internal preserve flag: when the caller does NOT pass `pos` on re-call, the existing `MOD.Core.TransformComponent` is reused so the entity stays in place; passing `pos` triggers full transform replacement. To move an existing entity, pass `pos` explicitly to the same creator or call `patch({ pos })` / `patchComponent("MOD.Core.TransformComponent", { Position })` |
| `patch(name, updates)` | `MapBuilder` | Position / enable / rename in one call. Throws if `name` missing |
| `patchComponent(name, compType, fields)` | `MapBuilder` | Field-level component update. Throws if entity or component missing |
| `upsertComponent(name, compType, body)` | `MapBuilder` | Add or replace a component. Throws if entity missing |
| `removeComponent(name, compType)` | `MapBuilder` | Drop a component. Throws if entity or component missing |
| `rename(oldName, newName)` | `MapBuilder` | Rename an entity. Throws if `oldName` missing |
| `remove(name)` | `MapBuilder` | Delete an entity and its descendants. Throws if `name` missing |
| `lastId()` | UUID string \| `null` | UUID of the entity targeted by the most recent creator call — new path → fresh UUID, existing path → existing UUID (upsert). Not touched by update/remove mutators |
| `getTiles()` / `getTileAt(x,y)` / `getTileBounds()` | tile data | Tile inspection |
| `getFootholds(layer)` / `getFootholdBounds(layer)` | foothold data | Foothold inspection |
| `build()` | JSON | In-memory map JSON |
| `snapshot()` | summary | Current builder-state summary |
| `write(path)` | `MapBuilder` | Save back to `.map` |

Read-only inspection is `find()` + `component()`. To read raw entity JSON when the builder cannot cover the case, fall back to parsing the `.map` file's `ContentProto.Entities[*].jsonString` directly (only within a §1.6 gap).

`MapBuilder` throws when the target is missing (`patch` / `rename` / `upsertComponent` / `patchComponent` / `removeComponent` / `remove`). Use `find()` to pre-check if conditional behavior is needed.

```javascript
MapBuilder.read("map/map01.map")
  .patch("Slime01", { pos: [5, 1, 0], enable: true })
  .patchComponent("Slime01", "MOD.Core.SpriteRendererComponent", { OrderInLayer: 20 })
  .write("map/map01.map");
```

### §1.3.1 New map files

Use `MapBuilder.fromTemplate(MapBuilder.templatePath(kind), mapName)`; do not start from `new MapBuilder(...)` or a blank JSON shell. Skill-local validated template kinds: `maple`/`0` = MapleTile, `rect`/`1` = RectTile, `sideview`/`2` = SideViewRectTile.

`mapName` is the plain map id: no `map://` prefix, no `.map` suffix, no path separators. The builder preserves terrain and map settings, rewrites `EntryKey` to `map://{mapName}`, rewrites `/maps/{old}` paths to `/maps/{mapName}`, regenerates every entity UUID, and updates internal UUID/path strings. After writing `map/{mapName}.map`, add `map://{mapName}` to `Global/SectorConfig.config` if the map should be reachable by the world.

```javascript
MapBuilder.fromTemplate(MapBuilder.templatePath("rect"), "city01")
  .write("map/city01.map");
```

### §1.4 Entity Placement

Prefer `.model` + `modelId` placement for repeated or runtime-spawned content. `pos` accepts `[x, y, z]` (preferred), `{ x, y, z }`, or the exported `vector3(x, y, z)` helper; all normalize to the same component value.

> ⚠️ Unknown option keys are silently ignored — only `pos` and `componentOverrides` are read. Keys like `position`, `transform`, `location` are dropped without warning, so the entity spawns at `(0,0,0)` with no error.

> ⚠️ **Asymmetric re-call behavior.** `sprite()` / `empty()` / `placeModel()` on an existing path are NOT a full replace:
>
> - **`MOD.Core.TransformComponent`** — preserved when the call does NOT pass `pos`. Re-calling `mb.sprite("Tree", { ruid: "newRUID" })` (no `pos`) keeps the existing Position. Passing `pos` explicitly (`mb.sprite("Tree", { pos: [5, 5, 0], ruid: "newRUID" })`) triggers full replacement and moves the entity.
> - **Non-Transform components** (`SpriteRendererComponent` fields, scripts list, anything in the model template for `placeModel`) — **always rebuilt** from the call's arguments. Re-calling `mb.sprite("Tree", { ruid: "newRUID" })` after an earlier `mb.sprite("Tree", { color: "red" })` resets `Color` to the default because the new call did not pass `color`. For incremental updates to non-Transform components, use `patchComponent` / `upsertComponent`.
> - **`entity()` called directly** — caller's components array is authoritative; no preserve flag. The internal preservation only applies to the higher-level `sprite()` / `empty()` / `placeModel()` paths.
> - **`placeModel()` descendants** — wiped entirely on re-call regardless of `pos`. See the placeModel warning in [builder-protocol.md](builder-protocol.md) §4.

```javascript
map.placeModel("Monster01", "RootDesk/MyDesk/Models/Monsters/Slime.model", {
  pos: [3, 1, 0],
});

map.sprite("Tree01", {
  ruid: "1705e3c5b2c146ac9a699f96fb067408",
  pos: [-2, 0, 0],
  order: 5,
});

map.empty("WaveController", {
  pos: [0, 0, 0],
  scripts: ["script.WaveController"],
});
```

`placeModel()` mirrors the model's component list into the map instance and applies `Values` / property links to matching component fields. Per-instance overrides go in `componentOverrides`.

```javascript
map.placeModel("FastMonster01", "RootDesk/MyDesk/Models/Monsters/FastMonster.model", {
  pos: [5, 1, 0],
  componentOverrides: {
    "MOD.Core.MovementComponent": { InputSpeed: 1.4 },
  },
});
```

#### `modelId` vs Inline — decision rule

| Situation | Form |
|---|---|
| Same composition placed **≥2 times** in this map | **`modelId`** (always — author a `.model` first if none exists) |
| Same composition reused in **another map** | **`modelId`** |
| Will be spawned at runtime via `SpawnByModelId` | **`modelId`** (required) |
| Truly one-off composition that will never recur | inline `@components` is acceptable |

> When in doubt, choose `modelId`. Five inline copies of "the same monster" silently drift over edits (one gets `IsLegacy: true`, another loses `SortingLayer`). The model anchors the canonical values; a single edit propagates.

> ⚠️ **`modelId` is not an authoring-form signal.** `sprite()` / `empty()` also set it — to the shared system models `mapobject` / `mapempty` — so `listEntities()` shows a non-null `modelId` for every placed entity. You cannot tell "inline" from a `.model` instance by the field, and never edit `mapobject` / `mapempty` to change one sprite (they are shared by every such entity). To change any placed entity's content, mutate its map `@components` (`patchComponent` / `upsertComponent` / re-call the creator) — the map's inline `@components` is authoritative on load.

### §1.5 Map Mode Rules

Always confirm `TileMapMode` before any map work ([builder-protocol.md](builder-protocol.md) §0 Pre-flight). The builder can **read** the mode but never **write** it — mode switching is a Maker Hierarchy right-click operation.

The AI must never write `MapComponent.TileMapMode` directly. Mode switching swaps tile components, rebuilds footholds, and converts tile-data formats — Maker handles all of that internally.

Guide the user to switch the mode in Maker:

1. Open the Maker editor's **Hierarchy** window.
2. **Right-click the target map entity**.
3. From the context menu, choose the matching **"Switch ..."** option (Switch TileMap / RectTileMap / SideViewRectTileMap).
4. After the user reports the switch is complete, call MCP **`refresh`**, then re-read `getTileMapMode()` to verify and re-check every dynamic entity's Body component against the new mode.

### §1.6 Coverage gaps (operations the builder intentionally does not cover)

Use Maker UI first, or carefully scoped direct `.map` edits, when a task requires one of these — in either case, verify with `refresh` + logs.

- New map creation from an arbitrary blank schema
- `TileMapMode` switching
- Most tile-painting workflows
- Foothold add / delete / re-chain authoring
- MapLayer creation, rename, sorting, visibility, and locking
- Background editing
- Portal / SpawnLocation / SectorConfig high-level workflows
- RectTileMap-specific high-level editing
- Collision / sorting layer / camera / map bounds / map area high-level APIs
- Maker internal migration or normalization behavior

> Before filling any gap, verify the behavior against a Maker-saved file or engine metadata and add a focused smoke test.

### §1.7 Tile-map entity transform is locked

The map's tile-grid container — the entity carrying `TileMapComponent` (MapleTile) or `RectTileMapComponent` (RectTile / SideViewRectTile) — has its `TransformComponent` **locked by the tile-map component itself**. Writes to `TransformComponent.Position` / `EulerAngles` / `Scale` are **silently rejected** with a `LWA-3047 NativeIssue_UnableToChange` warning. The engine keeps this entity at a fixed origin (`(0, 0, z)`, or a half-cell offset for odd-grid RectTile maps) so tile coordinates and world coordinates stay in a known relationship.

This applies whether the entity was placed via `modelId` or as inline `@components` — the lock comes from the tile-map component, not the authoring form. Do not try to move the tile-map entity. Anchor your game's coordinate system to the locked origin: keep gameplay anchors (grid origin, spawn points, path waypoints) in tile coordinates and convert via the tile-map component's helpers (e.g. `RectTileMapComponent:ToWorldPosition(cellPos)`).

Symptoms when the rule is ignored:

- A `Position` written into `.map` JSON reverts to `(0, 0, z)` after Maker `refresh`.
- Runtime `TransformComponent.Position = ...` writes have no observable effect; `logs` shows `[LWA-3047] UnableToChange`.
- Adding a custom child entity to the tile-map entity works, but the child's effective world position is still measured relative to the locked parent at `(0, 0)`.

Decoration / spawn anchor / overlay entities that need to be elsewhere should live as **siblings under the map root, not as children of the tile-map entity**.

### §1.8 Entity instance invariants in `.map`

- **`id`**: UUID v4 (with hyphens). Generate a fresh one for new entities.
- **`path`**: `/maps/{mapname}/{entityname}` — parent-child hierarchy is the path prefix.
- **`componentNames`**: comma-joined `@type` values of `@components`, **kept in sync at all times**.
- **`jsonString.path`**: identical to the outer `path`.
- **`pathConstraints`**: root `//`, child `///`.
- **`displayOrder`**: avoid overlap among siblings.

For `modelId` entities, use `MapBuilder.placeModel()` — it creates the model-instance metadata, keeps component names in sync, mirrors model components, and applies per-instance `TransformComponent.Position` / `componentOverrides`.

Adding a new map to the world may require appending `map://{mapId}` to `entries` in `Global/SectorConfig.config`.

### §1.9 RPC → File-Based replacement table (legacy Maker RPC removed)

| Old (RPC) | Current equivalent |
|---|---|
| Create entity | Author `.model` under `RootDesk/MyDesk/Models/{Category}/` + place with `MapBuilder.placeModel()` |
| Delete entity | `MapBuilder.remove()` |
| Change property | `MapBuilder.patchComponent()` for map instances; `ModelBuilder` Values for templates |
| Add/remove component | `MapBuilder.upsertComponent()` / `removeComponent()` for one-off map-local changes |
| Register / edit / delete model | CRUD `.model` files under `RootDesk/MyDesk/` (`refresh`) |
| List entities | `MapBuilder.snapshot()` / `listEntities()` |
