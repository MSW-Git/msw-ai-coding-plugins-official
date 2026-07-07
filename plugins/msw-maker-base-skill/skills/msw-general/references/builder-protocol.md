# Builder Protocol — `.map` / `.model` / `.ui` Mutation

`.map` / `.model` / `.ui` are all created and modified through dedicated CJS builders. This file is the **single entry point** for the call protocol of those three builders (`MapBuilder` / `ModelBuilder` / `UIBuilder`).

## ⚠️ MANDATORY — read this BEFORE invoking any builder

- **Re-read this file at the start of every turn** that touches `.map` / `.model` / `.ui`. "I already saw it last turn" is not an exemption. Do not memorize call signatures / `typeKey` values / coverage gaps.
- "Knowing one builder's protocol is enough" is a false assumption — model authoring → map placement → ui binding flow cross-builder (§4). If you only know one builder's protocol and call another, you bypass that builder's write-side contract (`componentNames` sync, `Values` metadata, write-time auto-lint, etc.) in full.
- **No direct raw JSON editing.** Do not pull file contents with `Read` / `cat` / `Get-Content` / `Select-String` / `grep` and patch by hand either (a registered guard blocks `.ui`; the same rule applies to `.map` / `.model`). Use only the builders' read-side API (`Builder.read` / `snapshot` / `find` / `listEntities`) for inspection.

### File → Builder routing

| Target file | Builder class | Script path (when invoked from skill root) |
|---|---|---|
| `./map/*.map` | `MapBuilder` | `scripts/map/msw_map_builder.cjs` |
| `./RootDesk/MyDesk/Models/**/*.model` | `ModelBuilder` | `scripts/model/msw_model_builder.cjs` |
| `./Global/*.model` (engine defaults — read-only) | `ModelBuilder.read` / `snapshot` only | (same module as above) |
| `./ui/*.ui` | `UIBuilder` | `../msw-ui-system/scripts/msw_ui_builder.cjs` |

Use `node scripts/...` after changing CWD to the relevant skill root. In JavaScript `require(...)`, use an explicit relative specifier such as `require("./scripts/map/msw_map_builder.cjs")`; Node treats `require("scripts/...")` as a package name, not a filesystem path. To reach a script in a different skill, resolve the sibling skill directory explicitly (for example `../msw-ui-system/scripts/...` from `msw-general`), because `<SKILL_ROOT>` is only documentation shorthand and is not automatically substituted at runtime.

### Decision matrix — which builder for which task?

| Task | Primary builder | Notes |
|---|---|---|
| Create a new `.model` from a template | `ModelBuilder.fromTemplate` | Never start from a blank model — pick the closest template from the §2 catalog |
| Edit Values / Components / Children on an existing `.model` | `ModelBuilder.read` → mutate → `write` | §2 |
| Place a model instance in a `.map` (≥2 instances / runtime spawn) | `MapBuilder.placeModel` | Author the `.model` first → `placeModel` (§4 cross-flow) |
| One-off inline sprite / empty entity in `.map` (single use) | `MapBuilder.sprite` / `empty` / `entity` | If the same composition appears ≥2 times, switch to `.model` immediately |
| Patch a component field, rename, remove on `.map` | `MapBuilder.patchComponent` / `patch` / `rename` / `remove` | §1 |
| Tile painting / `TileMapMode` switching / Foothold chaining | Not a builder operation — guide the user to Maker UI | §1 Coverage gaps |
| Create / patch `.ui`, component CRUD | the full `UIBuilder` API | §3 |
| Inject `.ui` entity UUIDs into `.mlua` property defaults | `b.write(path, { bind })` or `b.injectBindings(...)` | §3 Binding injection |

---

## Method index — what each builder actually exposes

Alpha-sorted **camelCase** method names per builder. **camelCase is canonical** — if a name does not appear here, do not call it. Signatures live in the per-builder API Reference sections below (§1.3 / §2.3 / §3.3). Internal helpers (prefixed with `_`) are omitted.

**`MapBuilder`** — instance: `build` · `component` · `empty` · `entity` · `find` · `getFootholdBounds` · `getFootholds` · `getMapInfo` · `getTileAt` · `getTileBounds` · `getTileMapMode` · `getTiles` · `listEntities` · `patch` · `patchComponent` · `placeModel` · `remove` · `removeComponent` · `rename` · `snapshot` · `sprite` · `upsertComponent` · `write`. Static: `MapBuilder.load` · `MapBuilder.read` · `MapBuilder.snapshot`.

**`ModelBuilder`** — instance: `addComponent` · `build` · `child` · `childComponent` · `childEnable` · `childEventLink` · `childFromModel` · `childFromTemplate` · `childProperty` · `childValue` · `childVisible` · `component` · `enable` · `entityEnable` · `entityVisible` · `eventLink` · `getChild` · `getChildValue` · `getValue` · `getValueEntry` · `hasChild` · `hasComponent` · `hasValue` · `listChildren` · `listComponents` · `listEventLinks` · `listValues` · `moveChild` · `property` · `removeChild` · `removeChildComponent` · `removeChildEventLink` · `removeChildProperty` · `removeChildValue` · `removeComponent` · `removeEventLink` · `removeProperty` · `removeValue` · `renameChild` · `renameModel` · `setBaseModelId` · `setChildBaseModelId` · `snapshot` · `upsertEventLink` · `validate` · `value` · `write`. Static: `ModelBuilder.fromTemplate` · `ModelBuilder.load` · `ModelBuilder.read` · `ModelBuilder.snapshot`.

**`UIBuilder`** — instance: `addComponent` · `areaParticle` · `avatar` · `basicParticle` · `build` · `button` · `chat` · `empty` · `find` · `getComponent` · `getId` · `gridView` · `group` · `hasComponent` · `injectBindings` · `joystick` · `line` · `listEntities` · `mask` · `panel` · `patch` · `patchComponent` · `polygon` · `remove` · `removeComponent` · `rename` · `script` · `scrollLayout` · `setComponentEnabled` · `skeleton` · `softMask` · `sprite` · `spriteParticle` · `text` · `textInput` · `touchReceive` · `upsertComponent` · `write`. Static: `UIBuilder.load` · `UIBuilder.read` · `UIBuilder.snapshot`.

---

## Common Workflow — every builder follows this

```
(1) READ      Builder.read(path) | Builder.fromTemplate(...) | new Builder(...)
(2) INSPECT   snapshot() / find() / listEntities() / getMapInfo() / listComponents()
(3) MUTATE    builder fluent API only (never raw JSON)
(4) WRITE     write(path) — auto lint (UI) / validate (Model) / id+componentNames sync (Map)
(5) REFRESH   Maker MCP `refresh` (call `stop` first if in play mode)
```

On any mid-workflow failure (RuntimeError / validate failure / lint error), **stop immediately**. Do not proceed to later steps; fix the cause and restart from (1).

### Cross-builder chaining contract

All three builders (`MapBuilder` / `ModelBuilder` / `UIBuilder`) share one contract: **every mutator — creators, updaters, removers, and `write()` — returns the builder itself, and a missing target throws `Error` (never returns `false` / `null`).** Inspection helpers (`find` / `getId` / `get*` / `has*` / `list*` / `snapshot` / `validate` / `build`) return data and must be called on their own line; pre-check with `has*()` / `find()` when conditional behavior is needed. `MapBuilder` and `UIBuilder` additionally expose `b.lastId()` — the id of the entity targeted by the most recent creator call (`entity` / `empty` / `sprite` / `placeModel`, or any UI creator). For a brand-new path a fresh UUID is assigned; for a path that already exists the creator upserts in place and `lastId()` returns the existing UUID, so the caller always gets the id usable to address that entity. Update/remove mutators (`patch` / `patchComponent` / `rename` / `upsertComponent` / `setComponentEnabled` / `remove` / `removeComponent`) do **not** touch `lastId()`. For `MapBuilder.placeModel`, `lastId()` returns the **root** id of the placed model, not the last placed child. `ModelBuilder` operates on a single model file and has no `lastId()`.

> [!IMPORTANT]
> **`placeModel` has destructive descendant sync semantics.** The root path is updated in place, but when `placeModel` is called on a path that already exists, it removes every existing descendant before re-creating the model tree from the template. Any `patchComponent` overrides on the existing tree are lost. See the `placeModel` section in §4 for the full warning and workarounds.

```javascript
// MapBuilder — chain + lastId() for the newly created entity
const map = MapBuilder.read("map/map01.map")
  .empty("WaveController", { pos: [0, 0, 0] })
  .placeModel("Boss", "RootDesk/MyDesk/Models/Monsters/Boss.model", { pos: [3, 1, 0] });
const bossId = map.lastId();  // root id of the placed model

// ModelBuilder — chain + has-pre-check for conditional remove
const slime = ModelBuilder.read("RootDesk/MyDesk/Models/Monsters/Slime.model");
if (slime.hasValue("MovementComponent", "InputSpeed")) slime.removeValue("MovementComponent", "InputSpeed");
slime.value("MovementComponent", "InputSpeed", 2.5, "float").write("RootDesk/MyDesk/Models/Monsters/Slime.model");
```

### Rules common to all three builders

1. **No raw JSON edits** — direct edits are allowed only in the coverage-gap areas listed below, and only with minimal scope plus `refresh` + logs verification.
2. **Always `refresh` after a write** (`stop` first if in play mode). Maker must ingest content-file changes.
3. **Never touch `.codeblock`** — the `.codeblock` paired with a `.mlua` is auto-generated by Maker `refresh`.
4. **`Environment/*.d.mlua` is read-only** — API definitions, not for modification.
5. **Empty `SpriteRUID` = invisible** (no error). Never leave `SpriteRUID` empty in any builder.
6. **Entity / Component / EntityRef / ComponentRef property defaults are UUID strings.** In AI automation, the builder injects UUIDs directly — never tell the user to "drag in Maker."
7. **Stop work on CoreVersion mismatch** — verify `Environment/config`'s CoreVersion is `26.5.0.0` before any work.
8. **Component type strings are auto-qualified — but pass them fully qualified anyway.** Native components use `MOD.Core.XxxComponent` (e.g. `MOD.Core.TransformComponent`); mlua script components use `script.XxxComponent` (e.g. `script.Monster`). The engine keys `.map` / `.model` / `.ui` components by exact `@type`, and a wrongly-namespaced or mistyped `@type` silently fails to attach (Maker logs only a warning and the inspector shows no component). To remove that footgun, all three builders **auto-qualify any bare (un-prefixed) component-type string at the call site**: a name in the native catalog becomes `MOD.Core.<name>`, any other bare name becomes `script.<name>`, and the builder prints a one-time advisory on stderr stating what it did and what to pass next time. A string that already starts with `MOD.` or `script.` is left untouched and silent — so the clean habit is to always pass the fully-qualified form. `null` / missing still throws `TypeError`.
   - **The one residual footgun is a *misspelled native* name.** `"SpriteRendrerComponent"` is not in the catalog, so it auto-qualifies to `script.SpriteRendrerComponent` — which no script defines, so it silently fails to attach at runtime. The builders guard this by detecting a bare name within a small edit distance of a real native and emitting a louder advisory (`looks like a typo of native "MOD.Core.SpriteRendererComponent"`). Read the advisory; if you meant the native, fix the spelling.
   - Auto-qualification fires on **every** helper that accepts a component-type string — not just `addComponent` / `upsertComponent`, but read-side helpers (`hasComponent` / `getComponent` / `patchComponent` / `removeComponent` / `setComponentEnabled` where the builder exposes them), value / property-link / event-link helpers that key by component type (`ModelBuilder.value(targetType, ...)`, `getValue`, `removeValue`, `property({ target, ... })`), and option-bag entries that key by component type (`MapBuilder.placeModel`'s `componentOverrides`). Each builder only exposes a subset; calling one a particular builder does **not** expose (e.g. `MapBuilder.hasComponent`, `ModelBuilder.getComponent`) raises `TypeError: ... is not a function`, not a qualification path.
   - To confirm the canonical name of a native component, list the workspace's `Environment/NativeScripts/Component/*.d.mlua` — each filename (e.g. `MovementComponent.d.mlua`) is the bare name; prefix it with `MOD.Core.` to get the fully qualified `@type`.

---

## §0 Pre-flight (before any builder call)

### When working on `.map`

1. Identify the target map path and root entity explicitly.
2. Read `MapComponent.TileMapMode` as an **integer** via `MapBuilder.read(...).getTileMapMode()`.
3. Do not proceed with entity / model / script work while the mode is unknown. A mismatch surfaces as `[LEA-3004] MissingComponent` at runtime, or as a silent failure (entity refuses to move with no error).

| Value | Mode | Required Body | LEA-3004 log on mismatch |
|:--:|---|---|---|
| `0` | MapleTile (side-view + Foothold) | `RigidbodyComponent` | `[LEA-3004] MissingComponent : Entity is missing 'RigidbodyComponent'.` |
| `1` | RectTile (top-down) | `KinematicbodyComponent` | `[LEA-3004] MissingComponent : Entity is missing 'KinematicbodyComponent'.` |
| `2` | SideViewRectTile (side-view tile grid) | `SideviewbodyComponent` | `[LEA-3004] MissingComponent : Entity is missing 'SideviewbodyComponent'.` |

> Changing the mode itself is a user action in Maker (Hierarchy right-click → Switch ...). The AI must never write `TileMapMode` directly (see §1 "Map Mode Rules").

### When working on `.model`

- **Do not start from a blank model.** Pick the closest template from the skill-local `models/` catalog and load it with `ModelBuilder.fromTemplate(absPath, name)`. Catalog: §2.
- **Save into a typed subfolder**: `RootDesk/MyDesk/Models/{Category}/{Name}.model` (e.g. `Models/Monsters/Slime.model`). Never save directly under `MyDesk/`, directly under `Models/`, or under `Global/`.
- If the target folder does not exist, create the folder only and let Maker Refresh generate the metadata.

### When working on `.ui`

- Read at least one design reference from the `msw-ui-system` skill first — anchor/pivot modes, UIGroup hierarchy, and component-selection criteria live there. Knowing the call protocol without the design context produces "looks fine at authoring time, breaks on resolution change" UI.
  - [`msw-ui-system/references/ui-fundamentals.md`](../../msw-ui-system/references/ui-fundamentals.md) §1–§6 — coordinate system + 16 anchor presets
  - [`msw-ui-system/references/ui-hierarchy.md`](../../msw-ui-system/references/ui-hierarchy.md) — UIGroup / displayOrder / Enable vs Visible
  - [`msw-ui-system/references/component-api.md`](../../msw-ui-system/references/component-api.md) — component selection + field/enum tables
  - [`msw-ui-system/references/layout-recipes.md`](../../msw-ui-system/references/layout-recipes.md) — HUD / popup / toast / grid recipes
- **Name the `.ui` file the same as its UIGroup (root) name.** `new UIBuilder("ShopWindow")` sets the root entity path to `/ui/ShopWindow`, but `write(path)` writes to whatever path you pass and does **not** check that the file basename matches. Save it as `ui/ShopWindow.ui`, not `ui/Shop.ui`. A mismatch is silent at write time but surfaces after `refresh` as a renamed / duplicated `.ui` and a briefly stale Glob index (the file follows the UIGroup name, not your chosen filename).

---

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
| `MapBuilder.read(path)` | `MapBuilder` | Load a `.map` |
| `MapBuilder.snapshot(path)` | summary | Read-only summary without instantiating |
| `getMapInfo()` | summary | TileMapMode, gravity, instance flag, counts |
| `getTileMapMode()` | `0`/`1`/`2` | MapleTile / RectTile / SideViewRectTile |
| `listEntities()` | array | Compact entity list |
| `find(name)` | entity record | Lookup by map root name, relative child name, or `/maps/...` path |
| `component(name, compType)` | component object | Read a component on an entity |
| `placeModel(name, modelPath, opts)` | `MapBuilder` | Place a `.model` instance (`pos`, `componentOverrides`, ...). Root id via `lastId()` |
| `sprite(name, opts)` | `MapBuilder` | Inline sprite entity (`ruid`, `pos`, `order`). Id via `lastId()` |
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

### §1.4 Entity Placement

Prefer `.model` + `modelId` placement for repeated or runtime-spawned content. `pos` accepts `[x, y, z]` (preferred), `{ x, y, z }`, or the exported `vector3(x, y, z)` helper; all normalize to the same component value.

> ⚠️ Unknown option keys are silently ignored — only `pos` and `componentOverrides` are read. Keys like `position`, `transform`, `location` are dropped without warning, so the entity spawns at `(0,0,0)` with no error.

> ⚠️ **Asymmetric re-call behavior.** `sprite()` / `empty()` / `placeModel()` on an existing path are NOT a full replace:
>
> - **`MOD.Core.TransformComponent`** — preserved when the call does NOT pass `pos`. Re-calling `mb.sprite("Tree", { ruid: "newRUID" })` (no `pos`) keeps the existing Position. Passing `pos` explicitly (`mb.sprite("Tree", { pos: [5, 5, 0], ruid: "newRUID" })`) triggers full replacement and moves the entity.
> - **Non-Transform components** (`SpriteRendererComponent` fields, scripts list, anything in the model template for `placeModel`) — **always rebuilt** from the call's arguments. Re-calling `mb.sprite("Tree", { ruid: "newRUID" })` after an earlier `mb.sprite("Tree", { color: "red" })` resets `Color` to the default because the new call did not pass `color`. For incremental updates to non-Transform components, use `patchComponent` / `upsertComponent`.
> - **`entity()` called directly** — caller's components array is authoritative; no preserve flag. The internal preservation only applies to the higher-level `sprite()` / `empty()` / `placeModel()` paths.
> - **`placeModel()` descendants** — wiped entirely on re-call regardless of `pos`. See §4 placeModel warning.

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

### §1.5 Map Mode Rules

Always confirm `TileMapMode` before any map work (see §0 Pre-flight). The builder can **read** the mode but never **write** it — mode switching is a Maker Hierarchy right-click operation.

The AI must never write `MapComponent.TileMapMode` directly. Mode switching swaps tile components, rebuilds footholds, and converts tile-data formats — Maker handles all of that internally.

Guide the user to switch the mode in Maker:

1. Open the Maker editor's **Hierarchy** window.
2. **Right-click the target map entity**.
3. From the context menu, choose the matching **"Switch ..."** option (Switch TileMap / RectTileMap / SideViewRectTileMap).
4. After the user reports the switch is complete, call MCP **`refresh`**, then re-read `getTileMapMode()` to verify and re-check every dynamic entity's Body component against the new mode.

### §1.6 Coverage gaps (operations the builder intentionally does not cover)

Use Maker UI first, or carefully scoped direct `.map` edits, when a task requires one of these — in either case, verify with `refresh` + logs.

- New map creation from a Maker-compatible template
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

---

## §2 ModelBuilder — `.model`

A `.model` is an entity template. AI agents **do not** inspect or edit its JSON directly. All read / create / update / write operations go through the skill-local CJS builder:

```javascript
const { ModelBuilder, vector3 } = require("./scripts/model/msw_model_builder.cjs");
```

### §2.0 Non-Negotiable Rule

Do not use `Read`, `cat`, `Get-Content`, `grep`, or manual JSON patches on `.model` files for normal authoring.

Use:

- `ModelBuilder.read(filepath)` / `ModelBuilder.snapshot(filepath)` to inspect existing models.
- `ModelBuilder.fromTemplate(templatePath, name, { model_id })` to create from a shipped template.
- `component()`, `value()`, `property()`, `child()`, `childFromTemplate()`, `childFromModel()`, `eventLink()`, `setBaseModelId()`, `renameModel()` to mutate.
- `write(filepath)` to save, then Maker `refresh`.

The builder owns `EntryKey`, `ContentProto.Json.Id/Name`, value type descriptors, inspector-property links, child model shape, and event-link preservation.

Prefer fluent chaining for normal create/update flows. The mutation methods above return the builder instance, and `write()` also returns the builder after saving. Keep inspection and conditional methods outside the chain: `snapshot()`, `validate()`, `build()`, `get*()`, `has*()`, `list*()`, and boolean-returning removals return data or booleans, not the builder.

### §2.1 Template Catalog

Never start from a blank model. Pick the closest template from the skill-local `models/` folder and load it with `ModelBuilder.fromTemplate()`.

**Template path rule** — templates live in this skill's own `models/` folder, sibling to `scripts/` and `references/`. `fromTemplate`'s first argument is resolved against `process.cwd()`, so always pass either an **absolute path** or a `__dirname`-derived path. Never guess. Templates are **not** under `Global/`, `RootDesk/`, `MyDesk/`, or a top-level `Models/` — those are output locations. An error like `model file not found: ./Global/<Name>.model` means the path was fabricated; recompute it from the skill location, do not create a file there.

```javascript
const path = require("path");
const templateDir = path.join(__dirname, "..", "models"); // from a script under scripts/model/
ModelBuilder.fromTemplate(path.join(templateDir, "ChaseMonster.model"), "MyMonster");
```

#### Base

| Template | Use |
|---|---|
| `../models/TransformOnly.model` | Empty entity with only `TransformComponent` |

#### Characters / Players

| Template | Use |
|---|---|
| `../models/Player.model` | Player variant |
| `../models/DefaultPlayer.model` | DefaultPlayer customization, usually with `BaseModelId` |

#### Monsters

Read [`monster.md`](monster.md) before authoring a monster.

| Template | Use |
|---|---|
| `../models/MonsterCanonical.model` | Default start for new monsters |
| `../models/ChaseMonster.model` | Chasing side-view monster (caveats in [`monster.md`](monster.md)) |
| `../models/MoveMonster.model` | Patrol movement monster |
| `../models/StaticMonster.model` | Stationary attacker |

#### NPC / Interaction

| Template | Use |
|---|---|
| `../models/StaticNPC.model` | Static NPC with dialogue / name tag |

#### Terrain

| Template | Use |
|---|---|
| `../models/Foothold.model` | MapleTile foothold |
| `../models/Ladder.model` | Climbable ladder |
| `../models/Rope.model` | Climbable rope |
| `../models/Portal.model` | Map portal / teleport trigger |

#### Map Objects / Decoration

| Template | Use |
|---|---|
| `../models/MapObject.model` | Generic decorative object |
| `../models/ParticleMapObject.model` | Object with particles |
| `../models/SkeletonMapObject.model` | Skeleton-based animated object |
| `../models/ItemAsset.model` | Item display |

#### Particles / Effects

| Template | Use |
|---|---|
| `../models/BasicParticle.model` | Generic particle |
| `../models/SpriteParticle.model` | Sprite-sheet particle |
| `../models/AreaParticle.model` | Area effect |
| `../models/AnimationPlayer.model` | One-shot animation effect |

#### Sound

| Template | Use |
|---|---|
| `../models/Sound.model` | Position-based sound |
| `../models/SoundEffect.model` | One-shot SFX |

#### Tilemap Containers

| Template | Use |
|---|---|
| `../models/TileMap.model` | MapleTile tile container |
| `../models/RectTileMap.model` | RectTile / SideViewRectTile tile container |
| `../models/MapleMapLayer.model` | Maple-style map layer |
| `../models/MapEmpty.model` | Empty map container |

#### External Media / UI Prefabs

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

> For full UI layout work, use the `msw-ui-system` skill's `UIBuilder` (§3) instead of authoring UI models directly.

### §2.2 Builder Workflow

#### Create from Template

```javascript
const path = require("path");
const { ModelBuilder, vector3 } = require("./scripts/model/msw_model_builder.cjs");

const b = ModelBuilder.fromTemplate(
  path.join(__dirname, "..", "models", "TransformOnly.model"),
  "MyObject"
);

b.component("SpriteRendererComponent")
  .value("SpriteRendererComponent", "SpriteRUID", "1705e3c5b2c146ac9a699f96fb067408", "string")
  .value("TransformComponent", "Position", vector3(0, 1, 0), "vector3")
  .write("RootDesk/MyDesk/Models/MapObjects/MyObject.model");

console.log(b.snapshot());
```

#### Patch Existing Model

```javascript
const b = ModelBuilder.read("RootDesk/MyDesk/Models/Monsters/Slime.model");

b.value("MovementComponent", "InputSpeed", 2.5, "float")
  .value("SpriteRendererComponent", "SpriteRUID", "1705e3c5b2c146ac9a699f96fb067408", "string")
  .write("RootDesk/MyDesk/Models/Monsters/Slime.model");

console.log(b.snapshot());
```

Removal mutators throw when the target value/property/child/event-link is missing. Guard with `hasValue` / `hasChild` if you need idempotent semantics:

```javascript
const b = ModelBuilder.read("RootDesk/MyDesk/Models/Monsters/Slime.model");

if (b.hasValue("MovementComponent", "InputSpeed")) {
  b.removeValue("MovementComponent", "InputSpeed");
}

b.value("MovementComponent", "InputSpeed", 2.5, "float")
  .write("RootDesk/MyDesk/Models/Monsters/Slime.model");
```

#### Inspector Property

```javascript
b.property("speed", {
  target: "MovementComponent",
  property: "InputSpeed",
  type_key: "float",
  display_name: "Movement Speed",
  show_in_inspector: true,
});
```

#### Child Entity

A `.model` describes a tree of entities. The root carries top-level `Components` / `Properties` / `Values` / `EventLinks`; additional entities live in `Children`.

**Child shell schema** — each entry in the root's `Children` array is a wrapper around a full inner model:

| Field | Meaning |
|---|---|
| `Id` | UUID of this child entity. Equals `Model.Id` for builder-created children |
| `ParentId` | UUID of the parent — either the root `model_id`, or another child's `Id` for nested trees |
| `Name` | Display name |
| `Model` | A complete model definition with the same schema as the root: `Version`, `Name`, `Id`, `BaseModelId`, `Components`, `Properties`, `Values`, `EventLinks`, `Children` |
| `ModelReplaced?` | Optional boolean flag set by `childFromTemplate` / `childFromModel` / `{ modelReplaced: true }` |

**Tree representation** — the builder stores all descendants in **one flat array** (`this.children`); the tree shape is recovered from `ParentId`. The inner `Model.Children` array is preserved on round-trip but the builder does **not** read from or write to it — to add grandchildren, pass `{ parent: "..." }` to `child()` so the new entry goes into the flat list with the right `ParentId`.

**Invariants**:

- `child.Id === child.Model.Id` for builder-created children. Templates may diverge unless `preserve_model_id: false` is used (which `childFromTemplate` defaults to).
- `child.ParentId` must point to the root `model_id` **or** another existing child's `Id`. Orphan values are rejected by `validate()` rule M034.
- Each child owns its `Components` / `Values` / `Properties` / `EventLinks` independently. **No implicit inheritance from the root** — to share a base, set `BaseModelId` on the child via `setChildBaseModelId`.
- New children automatically receive `MOD.Core.MODEntity.Enable = true` and `MOD.Core.MODEntity.Visible = true` in their `Values`.
- `renameModel(newName, newId)` rewrites only those `child.ParentId` entries that equal the old root `model_id`; nested (child-of-child) links are left intact, which is correct.
- Child `TransformComponent.Position` is **parent-local**, not world. In MSW 2D only X/Y are meaningful — depth ordering is controlled by `SpriteRendererComponent.SortingLayer` + `OrderInLayer`, not `z`. A child `QuaternionRotation` with `w = -1` is the common horizontal-flip pattern (alternative to `FlipX`).

**Examples**:

```javascript
b.child("WeaponSlot", ["TransformComponent", "SpriteRendererComponent"])
  .childValue("WeaponSlot", "TransformComponent", "Position", vector3(0.5, 0, 0), "vector3");
```

For Maker-style model hierarchy work, prefer the options form — stable IDs, nested parents, template-backed children, model inheritance, and child-local properties / event links:

```javascript
b.child("Body", {
  components: ["TransformComponent", "SpriteRendererComponent"],
  id: "body",
  enable: true,
  visible: true,
})
  .child("NameTag", {
    parent: "Body",
    components: ["TransformComponent", "TextComponent"],
    id: "name_tag",
  })
  .childValue("NameTag", "TransformComponent", "Position", vector3(0, 1.1, 0), "vector3")
  .childProperty("NameTag", "text", {
    target: "TextComponent",
    property: "Text",
    type_key: "string",
  });
```

Clone a shipped template as a child:

```javascript
b.childFromTemplate("Aura", "./skills/msw-general/models/BasicParticle.model", {
  parent: "Body",
  id: "aura",
  preserve_model_id: false,
});
```

Use `model_id` / `base_model_id` only when the child is intentionally tied to a registered model identity. Otherwise let the builder create an owned child model ID from the child ID.

**Validation rules for children** — `b.validate()` (called automatically by `b.write()`) reports these schema violations:

| Rule | Trigger | Fix |
|---|---|---|
| M030 | Child has no `Id` | `child()` auto-fills with `randomUuid()`; only fires for hand-built shells |
| M031 | Child has no `ParentId` | Use `child()` / `moveChild()`, never write the shell directly |
| M032 | Two children share an `Id` | Pass distinct `id` options, or let the builder generate UUIDs |
| M033 | A child `Values` entry has no `ValueType.type` | Always pass `typeKey` when calling `childValue()` |
| M034 | `ParentId` does not match the root or any other child's `Id` | Pass an existing name/id to `parent`; `moveChild()` resolves names automatically |
| M035 | `ParentId === Id` (self-parenting) | `moveChild()` rejects this; only triggered by manual edits |
| M036 | Cycle in the `ParentId` chain | Avoid `moveChild()` calls that close a loop |

#### Event Link

EventLinks are intentionally generic because project shapes vary.

```javascript
b.eventLink({ Id: "openDialog", EventName: "TouchEvent", Target: "DialogLogic" }, { key: "Id" });
b.removeEventLink("Id", "openDialog");
```

### §2.3 Builder API Quick Reference

```javascript
new ModelBuilder(name, { model_id, base_model_id });
ModelBuilder.read(filepath);
ModelBuilder.load(filepath);
ModelBuilder.snapshot(filepath);
ModelBuilder.fromTemplate(templatePath, name, { model_id });

b.snapshot();
b.renameModel(name, modelId);
b.setBaseModelId(baseModelIdOrNull);
b.validate();

b.component(compName);
b.addComponent(compName);
b.hasComponent(compName);
b.removeComponent(compName);
b.listComponents();           // silent — returns array of component type names
b.printComponents();          // listComponents() + log each

b.value(targetType, name, val, typeKey);
b.getValue(targetType, name, fallback);
b.getValueEntry(targetType, name);
b.hasValue(targetType, name);
b.removeValue(targetType, name);
b.enable(targetType, enabled);
b.entityEnable(enabled);
b.entityVisible(visible);
b.listValues();               // silent — returns cloned values array
b.printValues();              // listValues() + log each

b.property(name, { target, property, type_key, display_name, show_in_inspector });
b.removeProperty(name);

b.child(name, components);
b.child(name, { components, parent, id, model_id, base_model_id, enable, visible });
b.childFromTemplate(name, templatePath, options);
b.childFromModel(name, modelJsonOrContent, options);
b.getChild(name);
b.hasChild(name);
b.childComponent(childName, compName);
b.removeChildComponent(childName, compName);
b.childValue(childName, targetType, name, val, typeKey);
b.getChildValue(childName, targetType, name, fallback);
b.removeChildValue(childName, targetType, name);
b.childEnable(childName, enabled);
b.childVisible(childName, visible);
b.childProperty(childName, name, { target, property, type_key, display_name, show_in_inspector });
b.removeChildProperty(childName, name);
b.setChildBaseModelId(childName, baseModelId);
b.moveChild(childName, parentNameOrId);
b.renameChild(childName, newName);
b.childEventLink(childName, linkObject, { key });
b.removeChildEventLink(childName, key, value);
b.removeChild(name);
b.listChildren();             // silent — returns cloned children array
b.printChildren();            // listChildren() + log summary

b.eventLink(linkObject, { key });
b.upsertEventLink(linkObject, { key });
b.removeEventLink(key, value);
b.listEventLinks();           // silent — returns cloned event_links array
b.printEventLinks();          // listEventLinks() + log each

b.build();
b.write(filepath, { ensure_sprite_ruid: true });
```

**Every mutator chains** (`return this`). Missing target → `Error`. See the cross-builder chaining contract above.

- Creators / updaters: `renameModel()`, `setBaseModelId()`, `component()`, `addComponent()`, `value()`, `enable()`, `entityEnable()`, `entityVisible()`, `property()`, `child()`, `childFromTemplate()`, `childFromModel()`, `childComponent()`, `childValue()`, `childEnable()`, `childVisible()`, `childProperty()`, `setChildBaseModelId()`, `moveChild()`, `renameChild()`, `childEventLink()`, `eventLink()`, `upsertEventLink()`, `write()`.
- Removers (throw on miss): `removeComponent()`, `removeChildComponent()`, `removeValue()`, `removeProperty()`, `removeChildValue()`, `removeChildProperty()`, `removeChildEventLink()`, `removeChild()`, `removeEventLink()`.
- Inspection (no chaining): `snapshot()`, `validate()`, `build()`, `get*()`, `has*()`, `list*()` — call on their own line.

**`typeKey` values**: `bool`, `int`, `long`, `float`, `double`, `string`, `vector2`, `vector3`, `quaternion`, `collision_group`, `data_ref`, `sync_string_dict`, `action_sheet`.

**Helpers**: `vector2`, `vector3`, `quaternion`, `collisionGroup` / `collision_group`, `dataRef` / `data_ref`, `actionSheet`.

`SpriteRUID` is a plain string. Do not wrap it in `dataRef()`.

The default generated MOD.Core assembly version is `26.5.0.0`. If a different project CoreVersion requires a different version for newly generated value type blocks, set `MSW_MODEL_BUILDER_MOD_CORE_VERSION` before running Node.

### §2.4 Component Combinations

| Entity type | Core components |
|---|---|
| Visual object | `TransformComponent`, `SpriteRendererComponent` |
| MapleTile side-view moving monster | `MovementComponent`, `RigidbodyComponent`, `StateComponent`, `HitComponent` |
| RectTile top-down moving object | `MovementComponent`, `KinematicbodyComponent` |
| SideViewRectTile moving object | `MovementComponent`, `SideviewbodyComponent` |
| Interactive NPC | `SpriteRendererComponent`, `TouchReceiveComponent` |
| Attackable enemy | `AttackComponent`, `HitComponent` |

The Body component must match the target map's `TileMapMode`; see [`platform.md`](platform.md) §4.

### §2.5 Script Components

Custom `script.XXX` components in a `.model` depend on the script type already being registered.

Required order:

1. Write the script `.mlua`.
2. Maker `refresh`.
3. Build or patch the `.model` through `ModelBuilder`.
4. Maker `refresh` again.

If this order is inconvenient, keep the `.model` native-only and attach the script at spawn time with `entity:AddComponent("ScriptName")`.

### §2.6 Model Checklist

- [ ] Used `ModelBuilder.read()` / `snapshot()` / `fromTemplate()`, not raw `.model` reading.
- [ ] `fromTemplate` path is absolute or `__dirname`-derived (§2.1); never `./Global/...`, `./Models/...`, or a guess.
- [ ] Saved under `RootDesk/MyDesk/Models/{Category}/`.
- [ ] Created any needed folder only; left folder metadata to Maker Refresh.
- [ ] Picked the Body component matching `TileMapMode`.
- [ ] Set a real `SpriteRUID` when using `SpriteRendererComponent`.
- [ ] Used explicit `typeKey` for new or changed values.
- [ ] Called Maker `refresh` after write.
- [ ] Checked logs after refresh / play.

---

## §3 UIBuilder — `.ui`

`.ui` layouts are mutated only through builder calls — never edit JSON directly. **This protocol alone is not enough** — UI calls only make sense on top of the design context (anchor/pivot, UIGroup hierarchy, component selection). Read the `msw-ui-system` design references listed in §0 Pre-flight first.

### §3.1 Basic Workflow

1. Determine the target `.ui` path and the scope of entities / components to modify.
2. If the file already exists, load it with `UIBuilder.load()` (alias of `UIBuilder.read()`).
3. For one-off modifications, call directly; for repeated / high-risk modifications, separate into a `.builder-work/` temporary script.
4. Reopen the resulting `.ui` to verify hierarchy and rect / anchor.
5. If needed, run the preview script to check placement and touch-guide warnings.

### §3.2 Call Protocol

- Do not read the `.cjs` internal implementation every time. Call in the fixed order below.
- Basic order: `UIBuilder.read/load()` → `find/snapshot()` → `patch / entity / component API` → `write()`.
- Internal script inspection is limited to one-time, minimal scope only in exceptional situations (errors, unclear API).

### §3.3 `write()` Auto-Lint (Default ON)

`write(filepath)` automatically runs the sibling `msw-ui-system/scripts/ui_lint.cjs` immediately after saving. Default behavior:

- One or more errors → **build failure** via `RuntimeError` (the file remains on disk; the caller must observe the failure).
- Warnings only → one-line summary, details hidden.
- Nothing found → `✓ ui_lint: clean`.

`write(filepath)` overwrites the target `.ui` path. Do not delete and recreate `.ui` files — load (or construct) the intended state, then write once.

Flags:

| Argument | Default | Meaning |
|---|---|---|
| `lint` | `True` | Setting to `False` skips lint entirely. Use only for special paths like one-off dumps. |
| `strict` | `True` | If `False`, errors are printed but proceed without exception. |
| `lint_verbose` | `False` | If `True`, prints full text of all warnings / errors. |

```javascript
b.write("ui/PopupGroup.ui");                                   // default: strict + summary
b.write("ui/PopupGroup.ui", { lint_verbose: true });            // verbose warnings
b.write("ui/_scratch.ui", { lint: false });                     // skip lint
```

Applied rule IDs (`L001`–`L017`, `L023`–`L031`) are implemented as `ruleLNNN` functions in `msw-ui-system/scripts/ui_lint.cjs`. Hierarchy-focused guards:

- **`L025` (ERROR)** — an entity path implies an intermediate parent that does not exist in the file.
- **`L029` (ERROR)** — `UIGroupComponent` exists below the root group.
- **`L030` (WARN)** — a root-level text entity overlaps a sibling sprite/button box instead of being nested under it or merged onto it.
- **`L031` (WARN)** — `ScrollLayoutGroupComponent` layout / scrollbar direction enum values are outside their valid ranges.

### §3.4 pos / anchor Rules — Builder Auto-Pivot

Canvas 1920×1080, center origin `(0, 0)`. X: ±960, Y: ±540. All values are in **UI pixels**. For the coordinate model, 16 anchor presets (`top-left`–`stretch`), and the basic `pos = ±(margin + size/2)` formula, see [`ui-fundamentals.md`](../../msw-ui-system/references/ui-fundamentals.md) §1–§6 — only **builder-specific behavior** is covered here.

When the builder is called without a `pivot` argument, it automatically assigns a **pivot identical to the anchor point** (`middle-left` → (0, 0.5), `top-right` → (1, 1), `stretch*` → (0.5, 0.5), etc.). With edge anchors, supplying `pos = (margin, ...)` makes the element's **corresponding edge stick exactly at the margin position**:

```javascript
// auto pivot (recommended)
b.panel("Left", { anchor: "middle-left", pos: [20, 0], rect_size: [260, 80] });
// → pivot=(0, 0.5), rect left edge = x+20

// explicit pivot=(0.5, 0.5) — center-based offset (ui-fundamentals default mode)
b.panel("Left", {
  anchor: "middle-left",
  pos: [20, 0],
  rect_size: [260, 80],
  pivot: [0.5, 0.5],
});
// → rect left edge = x-110, outside parent boundary
```

**Two mode formulas**:
- Auto pivot (builder default): `pos = (±margin, ±margin)` — no need to add half the size.
- Explicit `pivot=(0.5, 0.5)`: `pos = ±(margin + size/2)` — the general formula from ui-fundamentals §4.

`ui_lint`'s `L005` rule detects edge-overflow patterns where "pos absolute value < size/2".

> **Breaking note**: among `.ui` files generated with older builder versions that appeared to use edge anchor + center pivot, restore intentionally center-based layouts by explicitly specifying `pivot=(0.5, 0.5)`.

All public APIs (`panel / text / sprite / button / script / slider / scrollLayout / textInput`, etc.) and `patch()` accept `pivot=(x, y)`. `patch()` preserves the existing `Pivot` value when not explicitly specified.

### §3.5 API Reference

`identifier` accepts three forms — all point to the same entity:

- Absolute path — `"/ui/<group>/Panel/Text"` (paths to other groups raise `ValueError`).
- Group-name prefix — `"<group>"`, `"<group>/Panel/Text"`.
- Relative name — `"Panel/Text"` (from direct children of the root).

To refer to the root itself, use any of `"<group>"`, `"/ui/<group>"`, or `"/"`. An empty string raises `ValueError`.

#### Hierarchy by Path

Builder creation methods do not take a separate `parent` argument. The parent is encoded in the `name` path:

```javascript
b.panel("Window", { rect_size: [700, 500] });                 // /ui/<group>/Window
b.sprite("Window/Bg", { anchor: "stretch" });                 // child of Window
b.button("Window/Card_SA", "A", { rect_size: [96, 132] });     // child of Window
```

Names without `/` are root-level children of the UI group. Passing `{ parent: "Window" }` or `{ parent: "/" }` to `empty()` / `panel()` / `text()` / `sprite()` / `button()` / other creator methods now throws. Use `"Window/Child"` path notation for nested children, or `"Child"` for root-level children. All missing intermediate parents must be created explicitly before adding children — adding a nested child whose parent entity does not yet exist now **throws** (and `ui_lint` rule `L025` flags any orphaned entity that reaches a file). An orphan cannot be mounted as a proper UI container on import, so create the parent `empty()` or `panel()` first.

Build related controls as a tree, not root-level coordinate overlays. A window, row, slot, tab, chip, or card should be a parent entity with its visual parts below it so movement / fade / enable / binding work as one unit. `ui_lint` rule `L030` warns when a root-level text entity overlaps a sibling sprite/button box. Fix by nesting the text under the box (`"Chip/Label"`), using `button()` for clickable labeled boxes, or using `panel()` / `sprite()` `text` options when the label belongs directly on the box entity.

Binding injection follows the same path notation. When a property points at `"Window/TitleText"`, pass that full path to `injectBindings`; a short leaf name such as `"TitleText"` is ambiguous and fails lookup.

#### Create / Load

```javascript
new UIBuilder(groupName, displayOrder = 1, defaultShow = true, defaultRuid = DEFAULT_SPRITE_RUID);
UIBuilder.load(filepath)  |  UIBuilder.read(filepath);
UIBuilder.snapshot(filepath);                              // returns compact entity view only
```

#### Entity Lookup

```javascript
b.find(identifier);                         // raw entity dict or null
b.getId(identifier);                       // UUID string or null (lookup by path)
b.lastId();                                 // UUID of entity targeted by the most recent creator call (new path → fresh UUID, existing path → existing UUID via upsert); not touched by update/remove
b.hasComponent(identifier, comp_type);
b.getComponent(identifier, comp_type);     // {"@type": ..., ...} or null
b.listEntities();                          // silent — returns array (name/path/depth/kind/pos/size/enable)
b.printEntities();                         // listEntities() + indented tree log to console
```

`find()` return dict — `@components` is one level deeper, so direct access raises KeyError:

```
{
  "id":             str,
  "path":           str,
  "componentNames": str,
  "jsonString": {
      "name", "path", "enable", "visible", "displayOrder", ...,
      "@components": [ {"@type": "MOD.Core.UITransformComponent", ...}, ... ],
      "@version": 1,
  },
}
```

When you only need component data, use `b.getComponent(path, comp_type)` instead of unwrapping the raw structure:

```javascript
const btn = b.getComponent("Panel/BtnOk", "MOD.Core.ButtonComponent");
if (btn?.Enable) { /* use */ }
```

#### Entity Creation (upsert — components replaced, existing root metadata preserved)

> When the same path already exists, the creator preserves the existing root metadata (`name`, `nameEditable`, `visible`, `localize`, `revision`, `origin`) and re-applies only what the caller passed. `@components` is replaced with the new value. For `UITransformComponent`, a re-call with no transform option (`anchor`, `pos`, `rect_size`, `pivot`) preserves the existing transform, and a re-call with partial transform options merges omitted transform fields from the existing transform. Example: `sprite("Bg", { rect_size: [1200, 900] })` keeps the existing anchor / position / pivot and changes only the size. For stretch anchors, omitted stretch-axis offsets are preserved instead of being collapsed to the new `pos`. To change `name` / `enable` / `visible`, call `patch()` rather than re-invoking the creator, or pass the field explicitly in the creator options.


Tuple-shaped options (`pos`, `rect_size`, `cell_size`, `padding`, `spacing`, `softness`, ...) accept `[a, b]` / `[a, b, c, d]` (preferred) or `{ x, y, z, w }`. Both normalize to the same value.

> **Default sprite skin (applies to every SpriteGUIRendererComponent the builder mints).** `panel` / `sprite` / `button` / `slider` / `textInput` / `joystick` all default their background sprite to `image_ruid = "2860136c06ab075439721c027de365af"` (`DEFAULT_SPRITE_RUID`), `sprite_type = 1` (Sliced 9-slice), and `color = RGBA(26, 26, 26, 60)` (dark translucent).
>
> **This dark gray is only a DEFAULT, never a constraint.** It fills in what the caller leaves unspecified — it does **not** mean every panel must be gray. Give any individual element its own color whenever the design calls for it: pass `color` (for `panel`/`sprite`) or `bg_color` (for `button`/`slider`/`textInput`) as a hex string (`"#cc3344"`) or `{ r, g, b, a }`, and adjust `alpha` / `sprite_type` / `image_ruid` the same way. `color` for `button`/`slider`/`textInput` is the **text** color (defaulting to `#FFFFFF` so labels stay readable on the dark fill). Transparent helpers (`text` / `mask` / `softMask` / `chat`) keep their own invisible sprite (`alpha = 0`) and are unaffected.
>
> ```javascript
> b.panel("InfoBox");                              // default dark-gray translucent
> b.panel("Danger", { color: "#cc3344" });          // red panel
> b.panel("Hero",   { color: { r: 0.1, g: 0.3, b: 0.8, a: 0.9 } }); // custom blue, mostly opaque
> b.panel("Solid",  { alpha: 1.0 });                // same gray, fully opaque
> ```

```javascript
b.panel(name, { anchor: "middle-center", pos: [0, 0], rect_size: [1920, 1080], color: null, alpha: null, sprite_type: 1, fill_method: 0, raycast: false, image_ruid: null, enable: true, pivot: null });
b.empty(name, { anchor: "middle-center", pos: [0, 0], rect_size: [100, 100], enable: true, pivot: null });
b.text(name, text, {
  size: 24, color: null, bold: false,
  alignment: 4,      // 0=UpperLeft .. 4=MiddleCenter(default) .. 8=LowerRight
  overflow: 0,       // 0=Overflow, 1=Truncate, 2=Ellipsis
  bestfit: false, min_size: 10, max_size: null,
  outline: false, outline_color: null, outline_width: null,
  anchor: "middle-center", pos: [0, 0], rect_size: null,
  enable: true, pivot: null,
});
b.sprite(name, { anchor, pos, rect_size, color, alpha: null, fill_method: 0, sprite_type: 1, raycast: false, enable: true, image_ruid: null, pivot: null });
b.button(name, text, { rect_size: null, pos, anchor, font_size: 24, color: "#FFFFFF", bg_color: null, sprite_type: 1, enable: true, image_ruid: null, pivot: null });
b.slider(name, { min_val: 0, max_val: 1, value: 0, direction: 0, use_handle: true, use_integer: false, bg_color: null, sprite_type: 1, anchor, pos, rect_size: [200, 30], enable: true, image_ruid: null, pivot: null });
b.scrollLayout(name, { layout_type: 1, spacing: 0, cell_size: [100, 100], use_scroll: true, padding: [0, 0, 0, 0], v_scroll_dir: 2, h_scroll_dir: 0, anchor, pos, rect_size: [400, 600], enable: true, pivot: null });
b.textInput(name, { placeholder: "", char_limit: 0, content_type: 0, line_type: 0, font_size: 24, color: "#FFFFFF", bg_color: null, sprite_type: 1, anchor, pos, rect_size: [300, 50], enable: true, image_ruid: null, pivot: null });
b.script(name, scriptName, { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080], enable: true, pivot: null });

// Root UIGroup only; nested group() throws. Use empty()/panel() for inner containers.
b.group(name, { default_show: true, group_order: 0, group_type: 1, blocks_raycasts: true, group_alpha: 1.0, interactable: true, anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080], enable: true, pivot: null });

// Clipping mask
b.mask(name, { shape: 0, padding: [0, 0, 0, 0], softness: [0, 0], anchor: "middle-center", pos: [0, 0], rect_size: [200, 200], color: null, alpha: 0.0, image_ruid: null, enable: true, pivot: null });

// Virtualized grid
b.gridView(name, { total_count: 0, cell_size: [100, 100], fixed_count: 1, fixed_type: 0, spacing: [0, 0], padding: [0, 0, 0, 0], use_scroll: true, scroll_bar_visible: 1, scroll_bar_thickness: 10.0, anchor, pos, rect_size: [400, 600], enable: true, pivot: null });

// Avatar / Touch / Skeleton / Particle
b.avatar(name, { color: null, flip_x: false, flip_y: false, play_rate: 1.0, preserve_avatar: 0, raycast: true, material_id: "", anchor, pos, rect_size: [200, 300], enable: true, pivot: null });
b.touchReceive(name, { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080], enable: true, pivot: null });
b.skeleton(name, { skeleton_ruid: "", animations: null, skins: null, color: null, flip_x: false, flip_y: false, loop: true, play_rate: 1.0, preserve_mode: 0, raycast: true, anchor, pos, rect_size: [200, 200], enable: true, pivot: null });
b.areaParticle(name, { particle_type: 0, area_size: [100, 100], area_offset: [0, 0], color: null, local_scale: [1, 1], play_speed: 1.0, particle_size: 1.0, particle_speed: 1.0, particle_count: 1.0, particle_lifetime: 1.0, loop: true, play_on_enable: true, prewarm: false, auto_random_seed: true, random_seed: 0, anchor, pos, rect_size: [100, 100], enable: true, pivot: null });
b.basicParticle(name, { particle_type: 0, color: null, local_scale: [1, 1], play_speed: 1.0, particle_size: 1.0, particle_speed: 1.0, particle_count: 1.0, particle_lifetime: 1.0, loop: true, play_on_enable: true, prewarm: false, auto_random_seed: true, random_seed: 0, anchor, pos, rect_size: [100, 100], enable: true, pivot: null });
b.spriteParticle(name, { particle_type: 0, sprite_ruid: "", apply_sprite_color: false, color: null, local_scale: [1, 1], play_speed: 1.0, particle_size: 1.0, particle_speed: 1.0, particle_count: 1.0, particle_lifetime: 1.0, loop: true, play_on_enable: true, prewarm: false, auto_random_seed: true, random_seed: 0, anchor, pos, rect_size: [100, 100], enable: true, pivot: null });

// Virtual joystick (mobile controls)
b.joystick(name, { dynamic_stick: true, axis: 1, up_arrow: 273, down_arrow: 274, left_arrow: 276, right_arrow: 275, anchor: "bottom-left", pos: [200, 200], rect_size: [300, 300], image_ruid: null, color: null, alpha: null, sprite_type: 1, enable: true, pivot: null });

// Soft mask (UGUI SoftMask style)
b.softMask(name, { invert_mask: false, invert_outsides: false, anchor: "middle-center", pos: [0, 0], rect_size: [200, 200], color: null, alpha: 0.0, image_ruid: null, enable: true, pivot: null });

// Chat UI
b.chat(name, { use_chat_balloon: false, expand: true, use_chat_emotion: true, chat_emotion_duration: 5.0, enable_voice_chat: true, hide_world_chat_button: false, message_align_bottom: false, anchor: "bottom-left", pos: [200, 200], rect_size: [400, 300], image_ruid: null, color: null, alpha: 0.0, enable: true, pivot: null });

// Line / Polygon renderer (HUD lines, guidelines, speech-bubble tails, custom shapes)
b.line(name, { points: [{ pos: [0, 0], color: "#FFFFFF", width: 2.0 }, /* ... */], is_flexible: true, flexibility: 3.0, is_smooth: false, loop: false, material_id: "", anchor, pos, rect_size: [100, 100], enable: true, pivot: null });
b.polygon(name, { points: [[0, 0], [100, 0], [50, 100]], color: null, use_custom_uvs: false, uvs: null, material_id: "", anchor, pos, rect_size: [100, 100], enable: true, pivot: null });
```

All creation methods return the builder for chaining. The UUID of the created / updated entity is exposed via `b.lastId()` — call it immediately after the creator if you need the id.

Use `button()` as the default for any colored or imaged rectangle that needs centered text and click handling. It creates the clickable tile as one entity instead of requiring a separate `sprite()` + `text()` pair. For non-clickable labeled boxes, `panel()` and `sprite()` accept `text`, `text_size`, `text_color`, `text_bold`, `text_alignment`, and `text_outline*` options; these add `TextGUIRendererComponent` to the same entity. Use a separate child `text()` only when the label needs its own rect inside a larger parent.

**Button color rule**:

- `button(..., { color })` controls `TextGUIRendererComponent.FontColor` only — button **text** color, not background. It defaults to `#FFFFFF` (white) so labels stay readable on the default dark fill.
- The background is the same entity's `SpriteGUIRendererComponent.Color` / `ImageRUID`, defaulting to the dark translucent skin (RGBA 26,26,26,60, Sliced). Retint it via the `bg_color` option (or `patchComponent`), not `color`.
- For light buttons, set a light `bg_color` **and** a dark text `color` (e.g. `color: "#111827"`); otherwise white text on a light fill becomes invisible.

```javascript
// Default dark button — white text on the dark translucent fill (no extra setup)
b.button("BtnAttack", "Attack", {
  anchor: "bottom-center", pos: [-220, 80], rect_size: [400, 120], font_size: 30,
});

// Opaque dark button — override the default 60/255 alpha
b.button("BtnSolid", "Confirm", {
  anchor: "bottom-center", pos: [0, 80], rect_size: [400, 120], font_size: 30,
  bg_color: { r: 0.12, g: 0.16, b: 0.22, a: 1.0 },
});

// Light button with readable dark text
b.button("BtnRun", "Run", {
  anchor: "bottom-center", pos: [220, 80], rect_size: [400, 120], font_size: 30,
  color: "#111827", bg_color: { r: 0.90, g: 0.94, b: 1.0, a: 1.0 },
});
```

#### Signature gotchas

**`sprite()` fill options are int-only.** `sprite_type` and `fill_method` accept integer codes; string enums (`"Filled"`, `"Horizontal"`) throw at the int32 cast. The full enum catalog is in `#### Enum catalog` below — `sprite_type` ∈ `Simple=0 / Sliced=1 / Tiled=2 / Filled=3` (builder default is **Sliced=1**), `fill_method` ∈ `Horizontal=0 / Vertical=1 / Radial90=2 / Radial180=3 / Radial360=4`. `fill_origin` and `fill_amount` are **not** exposed as builder options — they start at engine defaults (`FillOrigin=0`, `FillAmount=1.0`). Runtime code that animates a fill writes `entity.FillAmount` directly each frame.

```javascript
b.sprite("Cooldown/Fill", { color: "2ecc71", sprite_type: 3, fill_method: 0 });   // ✅ int
b.sprite("Cooldown/Fill", { image_type: "Filled", fill_method: "Horizontal" });   // ❌ throws "FillMethod must be int32. Got 'Horizontal'"
b.sprite("HPBar/Fill", { image_ruid: "f0911af597259044aa624a11332c0595", sprite_type: 1, pivot: [0, 0.5] }); // ✅ linear HP: resize width at runtime
```

**`script(name, scriptName, options)` is 3-arg and `scriptName` must be fully qualified.** Same shape as `text(name, text, opts)` / `button(name, text, opts)` — the second positional argument is the **content string** (the script component type, e.g. `"script.WoWPlayerHUDController"`), not the options object. Packing the script name into options (`b.script(name, { scripts: ["script.X"] })`) now throws at the builder call site. Options-only patterns are reserved for content-free entities (`panel` / `sprite` / `mask` / etc.).

```javascript
b.script("Controller", "script.WoWPlayerHUDController", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080] });  // ✅
b.script("Controller", { scripts: ["script.WoWPlayerHUDController"] });                                                // ❌ throws — use 3-arg form
```

#### Enum catalog

| Method | Argument | Enum | Values |
|---|---|---|---|
| `mask` | `shape` | `MaskShape` | `Rect=0` |
| `gridView` | `fixed_type` | `GridViewFixedType` | `ColumnCountFixed=0` (vertical scroll), `RowCountFixed=1` (horizontal) |
| `gridView` | `scroll_bar_visible` | `ScrollBarVisibility` | `AlwaysShow=0`, `AutoHide=1`, `Hide=2` |
| `avatar` | `preserve_avatar` | `PreserveSpriteType` | `None=0`, `AspectOnly=1`, `NativeSize=2` |
| `group` | `group_type` | `UIGroupType` | `DefaultType=0`, `UIType=1` (recommended), `EditorType=2` |
| `skeleton` | `preserve_mode` | `PreserveSpriteType` | `None=0`, `AspectOnly=1`, `NativeSize=2` |
| `areaParticle` | `particle_type` | `UIAreaParticleType` | `None=0`, `FogCalm=1`, `FogHeavy=2`, `FogLively=3`, `CalmStarField=4`, `StarFieldSimple=5`, `StarFog=6`, `StarFogFlow=7` |
| `basicParticle` | `particle_type` | `UIBasicParticleType` | `None=0` + 1–45 (full table in [`ui-system/references/component-api.md`](../../msw-ui-system/references/component-api.md) §Enums) |
| `spriteParticle` | `particle_type` | `UISpriteParticleType` | `None=0`, `BurstBig=1`, `SpawnField=2`, `BurstNova=3`, `SimpleSpawn=4`, `Burst=5`, `Stream=6`, `StreamSharp=7`, `AdditiveColor=8` |
| `joystick` | `axis` | `AxisType` | `Axis_4=0`, `Axis_8=1` (default) |
| `joystick` | arrow keys | `KeyboardKey` | Integer key codes. Defaults: `UpArrow=273`, `DownArrow=274`, `RightArrow=275`, `LeftArrow=276` |

#### Notes on group / mask / gridView

- **`group()` is root-only** — nested `group()` calls throw. For inner cards, gauges, tabs, sub-popups, and other local containers, create `empty()` or `panel()` and toggle that entity's `Enable`; use `CanvasGroup` when you need alpha/interactable control.
- **`mask` requires `SpriteGUIRenderer`** — the builder attaches it automatically, but leaving `image_ruid` empty renders a placeholder (SpawnLocation pin shape). To hide the visual mask shape, keep the default `alpha=0`; to make it visible, specify `alpha` / `color` / `image_ruid`.
- **`gridView`'s `ItemEntity` is a runtime prefab** — the builder only fills static fields like `TotalCount` / `CellSize`. The actual cell template must be injected in the script's `OnBeginPlay` via `self.Entity.GridViewComponent.ItemEntity = ...` followed by a `Refresh()` call. This is the only component that cannot be completed by the builder alone.

#### Notes on touchReceive / skeleton / particle

- **`touchReceive` has no rendering** — works without `RaycastTarget`. To create a visible area, place a `b.sprite(...)` or `b.panel(...)` at the same position and put the touch receiver on the layer above. All 7 events (`UITouchEnter/Exit/Down/Up/BeginDrag/Drag/EndDrag`) are ClientOnly. Actions requiring server sync (e.g. inventory moves resulting from a drag) should be delegated by calling `Server` ExecSpace methods.
- **`skeleton` is Spine 4.1 only** — RUIDs from other versions fail to load. Track 1 is reserved by the engine, so passing 1 as the `trackIndex` argument to `SetAnimation` / `AddAnimation` / `ClearTrack` in user code is ignored (use only 0, 2+). The `animations` / `skins` fields only set the initial track-0 animation and active skin list at builder time — runtime changes use ClientOnly methods (`SetAnimation`, `SetAttachment`, etc.).
- **`SkeletonRUID` is a plain string** — the builder serializes it as `"SkeletonRUID": "<ruid>"`. Do not confuse it with SpriteGUIRenderer's `ImageRUID: {"DataId": ...}` MODDataRef wrapping.
- **`areaParticle` / `basicParticle` are preset-based** — the `ParticleType` value determines the visual appearance. `LocalScale` / `ParticleSize` / `ParticleSpeed` / `ParticleCount` / `ParticleLifeTime` are global tuning multipliers on top of the preset. To change the shape itself, switch to a different `particle_type`.
- **Default particle Color is `(0.5, 0.25, 0.25, 1)`** (brown/sepia) — preserves the engine default. For white or high-saturation colors, specify `color="#FFFFFF"` / `color=(1,1,1)` explicitly.
- **`AreaSize` engine metadata default is `(0,0)`**, which emits particles from a point. The builder uses `(100, 100)` as a usable default. To intentionally emit from a point, specify `area_size=(0, 0)` explicitly.
- **`play_on_enable=True` (default) + `loop=True`** → infinite playback starts immediately when the entity is enabled. To show the effect only once, use `loop=False`, or set `play_on_enable=False` and control the `Play()` call from script. `Play` / `Stop` are ClientOnly.

#### Notes on joystick / softMask / chat / line / polygon

- **`joystick` is for mobile input only** — desktop uses keyboard mappings (`up_arrow` / `down_arrow` / `left_arrow` / `right_arrow`) for alternative input. With `dynamic_stick=true` (default), the stick follows the touch start position. The builder attaches both `SpriteGUIRenderer` and `Joystick`, and the engine automatically sets `SpriteGUIRenderer.RaycastTarget` to `false` at `BeginPlay`. If `image_ruid` is not specified, the builder's default sprite is used.
- **`softMask` is an unpublish feature** — gated by permission (`EnableUnpublishFeature`). Unlike `MaskComponent`, it supports soft-edge clipping, and only `RawImageGUIRenderer` / `SpriteGUIRenderer` children are clipped. `invert_mask=true` clips inside the mask, `invert_outsides=true` clips outside.
- **`chat` is a world / session-level chat UI** — typically only one per world. `use_chat_balloon=true` enables speech-bubble mode (bubbles above other users' characters). `expand` / `use_chat_emotion` / `enable_voice_chat` / `hide_world_chat_button` / `message_align_bottom` are UI display details.
- **`line`'s `points`** — `[{ pos: [x, y], color: "#RRGGBB" | Color, width: float }, ...]`. An empty array draws nothing. A single `null` point prevents the engine from drawing any of it. Corners are smoothed only when `is_flexible=true` + `flexibility>=1`.
- **`polygon`'s `points`** — `[[x, y], ...]` Vector2 array. Fewer than 3 points or self-intersecting polygons are not drawn (`IsDrawable()` false). `uvs` is used only when `use_custom_uvs=true`, and its length must match `points`.

#### WorldUI sort fields (common)

All 6 methods `sprite` / `text` / `button` / `slider` / `scrollLayout` / `textInput` support the same 4 sort fields. These are meaningful only when UITransform `UIMode=World(2)` (Screen UI ignores sort fields).

```javascript
b.text("BossName", "Boss", { world_ui: true, sorting_layer: "World", order_in_layer: 10 });
// world_ui: true → override_sorting=true, sorting_layer="UI" (default), order_in_layer=0, ignore_map_layer_check=false
// Individual override: specify override_sorting / sorting_layer / order_in_layer / ignore_map_layer_check directly
```

`override_sorting=false` (default) means sort fields are emitted but follow the UI group's sorting. Specify `world_ui: true` or `override_sorting: true` only when independent WorldUI sorting is needed.

#### Patch / Rename / Remove

```javascript
b.patch(identifier, { anchor, pos, rect_size, pivot, enable, visible, localize, display_order, new_name }); // throws if missing
b.rename(identifier, newName);  // updates all child paths; throws if missing
b.remove(identifier);           // deletes subtree (root not allowed); throws if missing
```

#### Component CRUD

```javascript
b.addComponent(identifier, comp_type, comp_data = null);       // throws if it already exists
b.upsertComponent(identifier, comp_type, comp_data = null);    // replaces if it exists
b.patchComponent(identifier, comp_type, updates);              // field merge; throws if missing
b.removeComponent(identifier, comp_type);                      // rejects UITransform; throws if missing
b.setComponentEnabled(identifier, comp_type, enabled);         // throws if missing
```

`comp_data` defaults to `{"@type": comp_type, "Enable": True}` when omitted. The `componentNames` field is auto-synced. All mutators return the builder; missing entity/component throws.

#### Output

```javascript
b.build();                                                   // completed JSON (not saved to file)
b.write(filepath, { lint: true, strict: true, lint_verbose: false, bind: null });
```

### §3.6 Binding Injection (`.ui` UUID → `.mlua` property)

For `.mlua` scripts to reference entities created by the builder, the property default must contain that UUID. In the AI automation route, the builder updates the `.mlua` file in the same call right after `write()` — without drag binding.

**Key fact — a single entity UUID is all you need.** The right side of `.mlua` property defaults is always a **single entity UUID string**. Component-typed properties work the same way:

```lua
property Entity popupGroup    = "<entity UUID>"   -- Entity / EntityRef
property TextGUIRendererComponent message = "<entity UUID>"  -- same for components
property ButtonComponent btnOk = "<entity UUID>"
```

The engine reads the property declaration type (`TextGUIRendererComponent`, etc.) and wraps it at runtime as `MODComponentRef("{uuid}:{TypeName}")` → resolves the component via `entity.GetComponent(typeId)`. Therefore the builder only needs to pass **one kind: `getId(path)`**. (Earlier guides describing a separate "extract component UUID" procedure were based on an incorrect assumption.)

**`write(path, { bind: ... })` — write + injection in one call**:

```javascript
b.write("ui/PopupGroup.ui", {
  bind: {
    mlua: "RootDesk/MyDesk/UIPopup.mlua",
    props: {
      popupGroup: "/ui/PopupGroup/Panel",       // property Entity popupGroup
      btnOk: "/ui/PopupGroup/Panel/BtnOk",      // property ButtonComponent btnOk
      btnCancel: "Panel/BtnCancel",             // relative path also OK
      message: "Panel/Message",
    },
  },
});
```

`props` = `{ mlua property name → entity path }`. The builder converts each path → entity UUID, uses regex to replace the `property <Type> <name> = "..."` line default in the target `.mlua`, and saves as UTF-8.

Or as separate calls:

```javascript
b.write("ui/PopupGroup.ui");
b.injectBindings("RootDesk/MyDesk/UIPopup.mlua", {
  popupGroup: "Panel",
  btnOk: "Panel/BtnOk",
});
```

**Protected failure cases (RuntimeError)**:

- The entity path does not exist.
- The target `.mlua` does not declare that property at all (typo / undeclared).
- The same property name is declared more than once in the `.mlua` (ambiguous).
- The target `.mlua` file does not exist → `FileNotFoundError`.

Verify that the `.mlua` actually exists and the target property is declared before calling. `.codeblock` is not touched — Maker Refresh regenerates it.

**Failure ordering** — `b.write({ bind })` runs `validate()` and pre-bakes the `.mlua` patch in memory **before** writing `.ui`. If anything before the `.ui` write throws (validation error, missing entity, undeclared property, duplicate property), neither file is touched. If strict `ui_lint` fails after `.ui` is on disk, the invalid `.ui` remains on disk for inspection/recovery, and `.mlua` is left untouched. `.mlua` is written last, only after `.ui` + lint pass. Property replacement is line-anchored and skips Lua line comments (`--`) and block comments (`--[[ ... ]]`), so a commented-out `property string Foo = "..."` is never overwritten.

**`b.validate()`** — call directly to inspect findings (`{ severity, rule, message }[]`) without writing. `write()` calls it internally and throws on any `severity: "error"`. Rules: `U001` invalid number (NaN / Infinity), `U002` int32 component field, `U003` finite-number component field, `U004` boolean component field, `U005` Vector2-shape component field (e.g. `GridViewComponent.Spacing` — must be `{ x, y }` with finite numbers).

**Naming convention (recommended)**:

```
/ui/Popup/Panel/BtnOk       → btnOk    (or okBtn)
/ui/Popup/Panel/Message     → message  (or messageText)
/ui/Popup/Panel             → popupGroup / panel / root
```

Keep the last path segment in camelCase + role suffix (`Btn` / `Text` / `Panel`). When in doubt, **specify the injection table explicitly** and trust only that — do not auto-infer.

### §3.7 Scope (what UIBuilder covers)

- Adding empty / panel / text / sprite / button / slider / scrollLayout / textInput / script
- Root UIGroup (`group`) only; inner grouping uses `empty()` / `panel()`
- mask / gridView / avatar — clipping, virtualized lists, avatar rendering
- touchReceive — invisible drag / multi-touch receiver
- skeleton — Spine 4.1 skeleton UI renderer
- areaParticle / basicParticle / spriteParticle — preset-based particles
- anchor / position / rect_size adjustment
- HUD / popup / menu layout modification
- entity rename / remove (including subtree)
- component add / replace / patch / remove
- path-based entity lookup

### §3.8 `patchComponent` workaround for fields beyond the signature

Component fields not covered by the signature parameters of `text()` / `sprite()` / `button()` (e.g. `Font`, `FontStyle`, `Underlay`, `Padding`, `FillAmount`, `FillOrigin`, `OrderInLayer`) must be set explicitly via `patchComponent(path, comp_type, updates)`. `text()` / `button()` emit `TextGUIRendererComponent`, whose `Font` is a **string** (`"Default"` / `"Maple"` / `"Bazzi"` / `"Football"`) and whose drop shadow is the `Underlay` family — patch those, not the legacy `TextComponent` field names.

When patching `TextGUIRendererComponent` alignment fields directly, use the component enums, not the `text(..., { alignment })` 0-8 helper index: `HorizontalAlignment` uses `Left=1 / Center=2 / Right=4 / Justified=8`, and `VerticalAlignment` uses `Top=256 / Middle=512 / Bottom=1024`.

```javascript
b.patchComponent("Panel/Title", "MOD.Core.TextGUIRendererComponent",
                  { Font: "Maple", FontStyle: 1 });

b.patchComponent("Panel/Title", "MOD.Core.TextGUIRendererComponent",
                  { Underlay: true,
                    UnderlayColor: { r: 0, g: 0, b: 0, a: 0.6 } });

b.patchComponent("Cooldown/Fill", "MOD.Core.SpriteGUIRendererComponent",
                  { Type: 3, FillMethod: 0, FillOrigin: 0,
                    FillAmount: 1.0 });
```

Per-entity forced values (intentional design separation):

- `button()` → `RaycastTarget` is always `True` (button = click area).
- `sprite(raycast=False)` is the default (sprite = decoration). Explicitly set `raycast=True` for modal dimmers and drag areas.
- `text()`'s background sprite is fixed as a transparent sprite with `alpha=0`.

Full enum lists (Alignment, Overflow, ImageType, etc.): [`ui-system/references/component-api.md`](../../msw-ui-system/references/component-api.md) §Enums.

### §3.9 UI-specific failure modes (must know before calling)

**`UITransformComponent.ActivePlatform` — UI not displayed when missing from JSON**

The `PlatformType` enum (`PC=1, Mobile=2, All=0xff(255)`) determines which platforms the UI is active on. If `ActivePlatform` is missing or set to `0`, the UI can be invisible on both PC and Mobile.

The builder automatically injects `ActivePlatform: 255` (all platforms) when creating a new UITransformComponent. Only watch out for these patterns:

- When partially modifying UITransform fields via `patchComponent(identifier, "MOD.Core.UITransformComponent", updates)`, do not touch `ActivePlatform`.
- For mobile-only UI, set explicitly with `b.patchComponent(name, "MOD.Core.UITransformComponent", { ActivePlatform: 2 })`. For PC-only, use `1`.
- Among **existing `.ui` files** loaded via `load()`, entries missing the `ActivePlatform` field entirely are **not** auto-corrected. Fill them in manually with `patchComponent`.

**`default_show=False` caveat — script lifecycle halted**

The `UIBuilder` default is `default_show=True` (recommended). If the root UIGroup is saved as hidden with `default_show=False`, `OnBeginPlay` / `OnUpdate` for scripts inside the group will not be called — a common cause of "the popup doesn't appear even after leveling up."

**Standard pattern** — always keep the root UIGroup at `default_show=True`, and have scripts toggle the `Enable` property of child entities (`Enable` vs `Visible` difference is covered in [`ui-hierarchy.md`](../../msw-ui-system/references/ui-hierarchy.md) §5 — summary: always use `Enable`; `Visible=False` keeps clicks alive and OnUpdate still runs).

```javascript
const ui = new UIBuilder("LevelUpUI");          // defaultShow=true (default)
ui.sprite("dimmer", { ... });
ui.text("title", "Level Up", { ... });
// Script starts with child entities Enable=false in OnBeginPlay,
// then sets Enable=true at the trigger point.
```

Use `default_show=False` only when the group contains **no** controller script and the flow toggles the group's `Enable` externally.

**Diagnosis** — when a popup doesn't appear: check root `UIGroupComponent.DefaultShow` → verify whether the controller's `OnBeginPlay` log fires → if not, the group being hidden is the cause. Recreate with `default_show=True` and migrate to the child `Enable` toggle pattern.

**`scrollLayout()` direction caveat — vertical lists need vertical scroll-bar enum values**

`layout_type`: `0=Horizontal`, `1=Vertical`, `2=Grid`. `v_scroll_dir` must use `2=BottomToTop` or `3=TopToBottom`; `0` and `1` are horizontal-scrollbar values. The builder defaults to `layout_type:1` and `v_scroll_dir:2`; when patching existing `.ui` files manually, keep both fields consistent.

### §3.10 UIBuilder coverage gaps (out of scope)

- `.map` / `.model` / `.tileset` builders — §1 / §2
- `.ui` JSON schema (raw field shapes, `@type` / `@components` wrapping, AlignmentOption 0–15 mapping) — handled internally by the builder; users / AI do not need to know directly.
- Accessibility patterns (alt text, screen-reader hints, focus order) — not covered.
- Error-state UI patterns (disabled-button styling beyond `Transition.Disabled`, validation messages, loading spinners) — not covered; design ad-hoc per project.
- Automated UI testing / layout assertions beyond `ui_lint.cjs` and `preview_ui_layout.cjs` — not provided.
- Custom shader materials (`MaterialId`) — the field is exposed but authoring shaders is out of scope.

---

## §4 Cross-Builder Workflow

The most common cross-flow: **author model → place in map → bind ui → refresh**.

```javascript
const path = require("path");
const { ModelBuilder, vector3 } = require("./scripts/model/msw_model_builder.cjs");
const { MapBuilder } = require("./scripts/map/msw_map_builder.cjs");

const skillRoot = path.join(process.cwd(), "skills", "msw-general");

// (1) Model authoring
const modelPath = "RootDesk/MyDesk/Models/Monsters/Slime.model";
ModelBuilder.fromTemplate(
  path.join(skillRoot, "models", "MonsterCanonical.model"),
  "Slime"
).value("TransformComponent", "Position", vector3(0, 0, 0), "vector3")
  .write(modelPath);

// (2) Map placement
MapBuilder.read("map/map01.map")
  .placeModel("Slime01", modelPath, {
    pos: [3, 1, 0],
    componentOverrides: {
      "MOD.Core.SpriteRendererComponent": { OrderInLayer: 10 },
    },
  })
  .write("map/map01.map");

// (3) Maker MCP `refresh`
```

`placeModel(name, modelPathOrJson, options)` behavior:

- Reads the `.model`, derives `modelId` from `ContentProto.Json.Id` or `EntryKey`, mirrors its component list into the placed map entity, and applies model `Values` to matching component fields.
- Returns the builder for chaining. The root entity id of the placed instance is exposed via `b.lastId()`.
- Places model children recursively, preserving parent-child paths and `origin` metadata.
- Accepts `options.pos` as `[x, y, z]` / `{ x, y, z }` / `vector3(...)`; arrays preferred.
- Accepts `options.componentOverrides` as a map keyed by component type. The target component must exist in the model or the builder throws.
- Accepts `options.modelId` only for an intentional override. Usually omit it and let the builder use the model's own id.

> [!WARNING]
> **`placeModel` is destructive on re-call.** When the target path already exists, `placeModel` wipes the existing root **and every descendant** before re-creating the tree from the template. Any in-place edits made between the original call and the re-call are lost:
>
> - `patchComponent("Monster01/Head", ...)` overrides on root or descendant entities.
> - Customizations applied in the Maker editor (color, position, custom child entities added by the level designer).
> - Child entities added by other builder calls (e.g. an `empty("Monster01/HPBar", ...)` placed after `placeModel`).
>
> **Re-running the same authoring script is a re-call.** If the script's flow is `placeModel(...) -> patchComponent(...) -> write(...)`, re-running it is safe — the override is reapplied each run. The footgun is mixing builder placement with out-of-band edits (Maker UI tweaks, second builder scripts that customize the instance) and then re-running the placement script later. The wipe happens with no warning.
>
> **Workarounds, in order of preference:**
>
> 1. **Don't re-call `placeModel` for in-place updates.** Make the placement call idempotent in your script — guard with `if (!map.find("Monster01")) map.placeModel(...)` if you want create-once semantics — and use `patchComponent` / `patch` / `upsertComponent` for everything else.
> 2. **Co-locate customization with placement.** Put the `patchComponent` calls in the same script as `placeModel` so the customization survives any re-run.
> 3. **Snapshot overrides before re-placing.** If you must re-run `placeModel` (e.g. swapping templates), `snapshot()` the entity tree first, re-place, then reapply the overrides from the snapshot.
>
> A `refreshModel`-style additive sync method is not provided — the cost / benefit didn't justify a built-in API. If you keep hitting this, raise it and we'll revisit.

**`.ui` ↔ `.mlua` integration** (§3.6):

```javascript
const { UIBuilder } = require("../msw-ui-system/scripts/msw_ui_builder.cjs");

const ui = UIBuilder.load("ui/PopupGroup.ui");
// ... mutate ...
ui.write("ui/PopupGroup.ui", {
  bind: {
    mlua: "RootDesk/MyDesk/UI/PopupController.mlua",
    props: {
      popupGroup: "/ui/PopupGroup/Panel",
      btnOk: "Panel/BtnOk",
    },
  },
});
```

After calls to all three builders, consolidate into a single `refresh`.

---

## §5 Constraint Rules Checklist (common to all builders)

### Files / Editor / MCP

1. **`refresh` after file changes** (`stop` first if in play mode).
2. **`.map` / `.model` / `.ui` are all builder-first** — direct raw JSON edits are reserved for the explicit gaps in §1.6 / §2 / §3.10, must stay minimal, and must be verified with `refresh` + logs.
3. **Do not modify `Environment/*.d.mlua`** — read-only API definitions.
4. **Do not create or edit `.codeblock` manually** — Maker `refresh` generates it from `.mlua`.
5. **Take `screenshot` only when the user explicitly asks or when identifying coordinates for input simulation.**

### Physics / Movement / Map

6. **TileMapMode ↔ Body components must match** (§0).
7. On **MapleTile**, placement Y is **foothold-based**; assumes gravity / Rigidbody.
8. On **RectTile**, do not expect vertical foothold physics — assumes Kinematicbody.
9. When inspecting or changing foothold data, use `MapBuilder` APIs so Id / Length / OwnerId consistency stays centralized.

### Render / Resource

10. **If a visual is needed, do not leave `SpriteRUID` empty.**
11. **RUIDs must be project-registered resources** — arbitrary strings are missing at runtime.
12. **Match the form of `TileSetRUID` / sprite DataRef** to existing maps.

### Entity / Spawn / Hierarchy

13. **Keep `id` / `path` / `componentNames` / `jsonString.path` consistent in `.map`.**
14. **`SpawnService` parent must not be nil** — pass a map entity such as `self.Entity.CurrentMap`.
15. **When referencing `modelId`**, `origin.entry_id` = `modelId`, and `origin.root_entity_id` = the entity's own outer `id` (top-level instance).
16. **Use `MapBuilder.placeModel()` for `modelId` instances** — it mirrors model components and keeps `componentNames` in sync. Empty component names or partial component arrays silently remove components at runtime.
17. Child entities must have a **`path` that is a prefix of the parent**.

### Input / UI Boundary

18. **TouchReceive (world) vs Button (UI)** — do not confuse input layers.
19. Keep UI-only groups (the `ui` hierarchy) and map entities' responsibilities separated.

### State / Animation

20. Do not confuse the roles of **StateComponent (logic)** vs **StateAnimationComponent (sprite action)**.
21. Action-name strings must **match** across code, action sheet, and animation data.

### Verification Loop

22. **`refresh` → `logs`** → **`play` → `logs` → `stop`**.
23. On intermediate failure, **stop later steps** — fix the cause and retry.

---

## Related Docs

| Doc | Purpose |
|---|---|
| [entity.md](entity.md) | `.map` entity domain — Scope, RUID, TileMapMode preflight, modelId vs inline rule, coordinate / foothold / camera, runtime verification |
| [model.md](model.md) | `.model` authoring domain — when to create, template catalog, component combinations, script-component lifecycle |
| [monster.md](monster.md) | Monster canonical 11 components + pitfalls — read before authoring a monster |
| [platform.md](platform.md) | TileMapMode ↔ Body mapping, spawn, RUID, coordinate system (common to all map types) |
| [platform-maple.md](platform-maple.md) / [platform-rect.md](platform-rect.md) / [platform-sideview.md](platform-sideview.md) | Per-map-type physics / events / patterns |
| [troubleshooting.md](troubleshooting.md) | Symptom → cause → fix (LEA-3004, "won't move", "won't render", LWA-3047, etc.) |
| [`msw-ui-system` SKILL](../../msw-ui-system/SKILL.md) | UI design guide + component API — read together when working on `.ui` |
| [`msw-ui-system/references/component-api.md`](../../msw-ui-system/references/component-api.md) | Full UI component fields / enums — when applying the `patchComponent` workaround |
| [`msw-ui-system/references/ui-fundamentals.md`](../../msw-ui-system/references/ui-fundamentals.md) | Coordinate system / 16 anchor presets, resolution / safe area |

**Core principle**: *"`.map` / `.model` / `.ui` mutations all go through dedicated builders, and the builders re-confirm with this document at the start of every call."*
