# MSW File Authoring

Authoring guide for **.map / .model / .ui / .dataset** files and tile map assets in MSW world creation. Each file type has its own reference file — read only the topics you need.

> ⚠️ **Schema consistency warning (important)**
> `.map` / `.model` / `.ui` / `.tileset` / `.userdataset` / `.localedataset` are all large files with strict formats. Writing or modifying their JSON by hand easily produces **silent failures** like:
> - Missing model value metadata, duplicate UUIDs, broken component/value consistency
> - Mismatched tile map 2D array dimensions, `TileMapMode` ↔ Body mismatch, `tileIndex` offset
> - `.ui` anchor / pivot coordinate errors, missing RUID, parent-child `path` mismatch
> - Dataset row / column schema violations
>
> Use the dedicated builder or skill for each file type before editing. **The call protocol for `.map` / `.model` / `.ui` is one entry point — [`builder-protocol.md`](builder-protocol.md) (core) plus the per-builder files ([`builder-protocol-map.md`](builder-protocol-map.md) / [`builder-protocol-model.md`](builder-protocol-model.md) / [`builder-protocol-ui.md`](builder-protocol-ui.md)). The core + the matching per-builder file must be in context before any mutation (read only if missing).** `.model` files are builder-only. `.map` files are builder-first: see builder-protocol-map.md §1 (read alongside [`entity.md`](entity.md) for domain context) and use the builder for covered operations; direct `.map` JSON edits are reserved for the explicit coverage gaps in §1.6 and must be minimal scope plus verified by `refresh` / logs.
>
> **Entity reference binding (Entity/EntityRef property) is injected by the AI as a UUID string directly** — do not ask the user to drag in the Maker editor. Detail: `msw-scripting §7 Entity/Component reference properties`.

---

## Per-target Routing

| Task | File to read |
|------|--------------|
| Edit **tile map / tile set** in `.map` (TileMapMode, `tileMap` array, `.tileset`) | [tile.md](tile.md) |
| Create or modify a `.model` template | [model.md](model.md) — builder-only |
| Place **entities** in `.map`, spawn, parent-child, manage runtime components | [entity.md](entity.md) |
| `.map` / `.model` / `.ui` builder call protocol (unified) | [builder-protocol.md](builder-protocol.md) (core) + [builder-protocol-map.md](builder-protocol-map.md) / [builder-protocol-model.md](builder-protocol-model.md) / [builder-protocol-ui.md](builder-protocol-ui.md) |
| `.ui` authoring, component API, enums, mlua runtime patterns | **`msw-ui-system` skill** (single UI entry point — design guide + component API + builder invocation + runtime patterns) |
| `.userdataset` / `.localedataset` structure, types, runtime API | [dataset.md](dataset.md) |
| Template catalog when creating a new `.model` | [model.md §2.1](model.md) → `../models/*.model` |
| **Authoring a monster** (canonical components, `ActionSheet`, HitComponent, IsLegacy) | [monster.md](monster.md) → `../models/MonsterCanonical.model` |

### Keyword → File Map

- **tile, tile map, tileset, TileMapMode, RectTile, MapleTile, SideViewRectTile, tileIndex** → [`tile.md`](tile.md)
- **model, .model, template, NPC model, player, Foothold, Ladder, Rope, Portal, MapObject, particle, Sound, UIButton, Values, Children, BaseModelId** → [`model.md`](model.md) (+ builder + `../models/` catalog)
- **create monster, monster ActionSheet, stand/move/attack/hit/die/jump, HitComponent, IsLegacy, CollisionGroup, AIChase, AIWander, script.Monster, script.MonsterAttack** → [`monster.md`](monster.md) (+ `../models/MonsterCanonical.model`)
- **entity, .map, placement, spawn, SpawnService, CurrentMap, componentNames, modelId reference, hierarchy, Foothold** → [`entity.md`](entity.md)
- **UI, button, text, image, canvas, UITransform, anchoredPosition, AlignmentOption, UIGroup, DefaultShow, GridView, popup, anchor** → `msw-ui-system` skill (design, component API, and builder integrated)
- **dataset, UserDataSet, LocaleDataSet, translation, table, .userdataset, .localedataset, DataService** → [`dataset.md`](dataset.md)

---

## Shared Principles (across all 5 file types)

### Absolute Principles

1. **Prefer the dedicated skill or builder** — `.model` uses `ModelBuilder`; `.map` uses `MapBuilder`; `.ui` uses `msw-ui-system`; other files use their relevant reference/tooling.
2. **Inject entity references as UUID strings directly** — do not ask the user to drag in Maker.
3. **MCP `refresh` after every file change** (if in play mode, `stop` first).
4. **Never modify `Environment/*.d.mlua`** — API definitions are read-only.
5. **Never create or modify `.codeblock` by hand** — Maker `refresh` generates it from `.mlua`.
6. **Structured files prefer builders** — `.model` / `.ui` are builder-only. `.map` uses `MapBuilder` first; direct JSON edits are allowed only for unsupported gaps, with minimal scope and verification.
7. **Do not touch `Global/common.gamelogic` and the `common` entity** — these are special engine-managed entries. Do not edit the file's JSON directly, and do not attach components to the `common` entity (including via Maker `AddComponent` or runtime `AddComponent`). For global logic, **author a regular Logic script under `RootDesk/MyDesk/`** and wire up an entry point.

### UUID / ID Rules

- **`.model` identifiers are managed by `ModelBuilder`**. Use `fromTemplate()` / `renameModel()` instead of editing `EntryKey` or internal IDs directly.
- **Entity `id` in `.map` is managed by `MapBuilder`**, kept consistent with path and component metadata.
- **The id portion of `EntryKey` should be lowercase** (e.g., `model://mymonster`, `userdataset://itemtable`).
- When duplicating a file, **always generate a new UUID** with a cross-platform command: `node -e "console.log(require('node:crypto').randomUUID())"`.

### RUID Rules

- Resources are identified by an **RUID string**. If `SpriteRUID` is empty, the entity is **invisible on screen** (no error).
- In `.model`, set RUIDs through `ModelBuilder.value()`. `SpriteRUID` is a plain string.
- Use `msw-search` and `_ResourceService` for asset search. Replace temporary placeholders with real assets before deployment.

### Representation Consistency

- `.model` value descriptors are generated by `ModelBuilder.value()`. Pass an explicit `typeKey` for new or changed values.
- `.map` component values use a different representation; use `MapBuilder` for map edits.

### TileMapMode ↔ Body ↔ Entity

- The map root's `MapComponent.TileMapMode` (0/1/2) determines the **entire movement / gravity / collision / tile system**.
- If an entity's Body-family component does not match the map, it **does not move** (no error).
- Mapping table and check protocol: [platform.md §4](platform.md).

### Save Locations

- **New user models go under `RootDesk/MyDesk/`** (with a `Models/` subfolder; folder metadata comes from Refresh).
- **Adding new `.model` files arbitrarily under `Global/` may cause Maker to not recognize them.**
- Maps: `./map/`, UI: `./ui/`, datasets: under `RootDesk/MyDesk/`.

### Validation Loop

- **`refresh` → `logs`** → if needed, **`play` → `logs` → `stop`**.
- If a step fails, **stop later steps** — fix the cause and retry.

---

## Per File Type Summary

### `.map` tile map — [tile.md](tile.md)

The 3 `TileMapMode` values (MapleTile/RectTile/SideViewRectTile) completely change the tile map component (`TileMapComponent` vs `RectTileMapComponent`), the array key (`Tiles` vs `tileMap`), and the `TileSetRUID` form (DataId object vs `tileset://` string). Do not confuse tile coordinates (grid cells) with entity coordinates (world units).

### `.model` template — [model.md](model.md)

The blueprint for an entity. Pick the closest template from the **`../models/` catalog** (validated starting points for monsters/NPCs/players/terrain/UI/particles/sound/tile maps, etc.), load it with `ModelBuilder.fromTemplate()`, and customize it with builder methods. Spawn at runtime via `SpawnByModelId`, or place in `.map` by `modelId`.

### `.map` entity placement — [entity.md](entity.md)

Add entity instances under `.map`'s `ContentProto.Entities`. Use the `modelId` form (template reference + minimal override) or the inline form (`@components` listed in full). `id`/`path`/`componentNames`/`jsonString.path` consistency is mandatory. Runtime spawn uses `self.Entity.CurrentMap` as the parent.

### `.ui` — [`msw-ui-system`](../../msw-ui-system/SKILL.md)

Based on FHD 1920x1080 with the origin at center. Place via `UITransformComponent.anchoredPosition` + anchors (`AlignmentOption`, Anchors, Pivot) + `OffsetMin/Max` (do not touch `Position`). UIGroup separation principle, `DefaultShow`, Enable vs Visible, Connect / Disconnect event pairs. UI entities are **client-only** — server RPC / Sync do not work on them.

### `.dataset` — [dataset.md](dataset.md)

`UserDataSet` / `LocaleDataSet` each consist of a **`.userdataset`/`.localedataset` metadata wrapper + `.csv` sidecar pair**. The CSV holds the actual tabular data (all cells are strings); the wrapper holds the `EntryKey`, `name` (runtime lookup key), and `serveronly` flag. Required column rules for LocaleDataSet: `Key`/`Source`/`Note` + locale columns. Runtime APIs: **`_DataService:GetTable(name)` / `:GetCell` / `:GetRowCount`** for UserDataSet, **`_LocalizationService:GetText(key)`** (ClientOnly) for LocaleDataSet. Prefer Maker UI for create / delete.

---

## Related Skills / Documents

| Target | Purpose |
|--------|---------|
| [platform.md](platform.md) (core) | TileMapMode ↔ Body, SpriteRUID, spawn, coordinates, folder metadata, ID generation, `.config` (common to all map types) |
| [platform-maple.md](platform-maple.md) / [platform-rect.md](platform-rect.md) / [platform-sideview.md](platform-sideview.md) | Per-map-type physics, events, patterns, and checklists |
| [troubleshooting.md](troubleshooting.md) | Symptom → cause → fix reference (e.g., `LEA-3004`) |
| [workspace.md](workspace.md) | Workspace / hierarchy / file path rules |
| `msw-scripting` | Component/Logic, properties, lifecycle, @ExecSpace |
| `msw-defaultplayer` | Player model, Values, Body components |
| `msw-search` | RUID / asset / document search |
