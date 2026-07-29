# Builder Protocol — `.map` / `.model` / `.collisiongroupset` / `.ui` Mutation

`.map` / `.model` / `.ui` are created and modified through dedicated CJS builders; the existing `Global/CollisionGroupSet.collisiongroupset` is **modified only** through `CollisionGroupSetBuilder` — never create a new `.collisiongroupset` file. The call protocol is one unified entry point split across **this core file (shared contract) plus one per-builder file per target type**:

| Protocol file | Covers |
|---|---|
| **this file (core)** | routing, common workflow, cross-builder chaining contract, §0 pre-flight, §4 cross-builder flow, §5 checklist |
| [builder-protocol-map.md](builder-protocol-map.md) | §1 `MapBuilder` (`.map`) |
| [builder-protocol-model.md](builder-protocol-model.md) | §2 `ModelBuilder` (`.model`) + §2.7 `CollisionGroupSetBuilder` (`.collisiongroupset`) |
| [builder-protocol-ui.md](builder-protocol-ui.md) | §3 `UIBuilder` (`.ui`) |

## ⚠️ MANDATORY — core + matching per-builder file(s) must be in context BEFORE invoking any builder

- **This core file, plus the per-builder file for every file type the turn mutates, must be fully in context** on every turn that touches `.map` / `.model` / `.ui`. `Read` a file in full only if it was never loaded this session or was lost to context compaction — do **not** re-read a file that is already fully in context. Working from a memorized summary of call signatures / `typeKey` values / coverage gaps is not an exemption — the in-context file is the source of truth.
- **"The core alone is enough" is a false assumption** — each per-builder file carries that builder's write-side contract (`componentNames` sync, `Values` metadata, write-time auto-lint, child-entity invariants, coverage gaps). Mutating a type whose per-builder file is not in context bypasses that contract in full. Cross-flow work (model authoring → map placement → ui binding, §4) loads every matching per-builder file.
- **No direct raw JSON editing.** Do not pull file contents with `Read` / `cat` / `Get-Content` / `Select-String` / `grep` and patch by hand either (a registered guard blocks `.ui`; the same rule applies to `.map` / `.model`). Use only the builders' read-side API (`Builder.read` / `snapshot` / `find` / `listEntities`) for inspection.

### File → Builder routing

| Target file | Builder class | Script path (when invoked from skill root) |
|---|---|---|
| `./map/*.map` | `MapBuilder` | `scripts/map/msw_map_builder.cjs` |
| `./RootDesk/MyDesk/Models/**/*.model` | `ModelBuilder` | `scripts/model/msw_model_builder.cjs` |
| existing `./Global/*.model` | `ModelBuilder` read + **write** (Maker Refresh after) | (same module as above) |
| existing `./Global/CollisionGroupSet.collisiongroupset` | `CollisionGroupSetBuilder` read + **write** (Maker Refresh after) | `scripts/collisiongroupset/msw_collisiongroupset_builder.cjs` |
| `./ui/*.ui` | `UIBuilder` | `../msw-ui-system/scripts/msw_ui_builder.cjs` |

Use `node scripts/...` after changing CWD to the relevant skill root. In JavaScript `require(...)`, use an explicit relative specifier such as `require("./scripts/map/msw_map_builder.cjs")`; Node treats `require("scripts/...")` as a package name, not a filesystem path. To reach a script in a different skill, resolve the sibling skill directory explicitly (for example `../msw-ui-system/scripts/...` from `msw-general`), because `<SKILL_ROOT>` is only documentation shorthand and is not automatically substituted at runtime.

### Decision matrix — which builder for which task?

| Task | Primary builder | Notes |
|---|---|---|
| Create a new `.map` from a validated map template | `MapBuilder.fromTemplate(MapBuilder.templatePath(...), mapName)` | Copies terrain / map mode, rewrites map ids and `/maps/{name}` paths; then register `map://{name}` in `SectorConfig.config` |
| Create a new `.model` from a template | `ModelBuilder.fromTemplate` | Never start from a blank model — pick the closest template from the catalog ([builder-protocol-model.md](builder-protocol-model.md) §2.1) |
| Edit Values / Components / Children on an existing `.model` | `ModelBuilder.read` → mutate → `write` | [builder-protocol-model.md](builder-protocol-model.md) §2 |
| Edit collision groups or collision matrix | `CollisionGroupSetBuilder.read` → mutate → `write` | [builder-protocol-model.md](builder-protocol-model.md) §2.7 |
| Place a model instance in a `.map` (≥2 instances / runtime spawn) | `MapBuilder.placeModel` | Author the `.model` first → `placeModel` (§4 cross-flow) |
| One-off inline sprite / empty entity in `.map` (single use) | `MapBuilder.sprite` / `empty` / `entity` | If the same composition appears ≥2 times, switch to `.model` immediately |
| Patch a component field, rename, remove on `.map` | `MapBuilder.patchComponent` / `patch` / `rename` / `remove` | [builder-protocol-map.md](builder-protocol-map.md) §1 |
| Tile painting / `TileMapMode` switching / Foothold chaining | Not a builder operation — guide the user to Maker UI | [builder-protocol-map.md](builder-protocol-map.md) §1.6 Coverage gaps |
| Create / patch `.ui`, component CRUD | the full `UIBuilder` API | [builder-protocol-ui.md](builder-protocol-ui.md) §3 |
| Inject `.ui` entity UUIDs into `.mlua` property defaults | `b.write(path, { bind })` or `b.injectBindings(...)` | [builder-protocol-ui.md](builder-protocol-ui.md) §3.6 Binding injection |

---


## Common Workflow — every builder follows this

```
(1) OPEN      existing file (any builder) → Builder.read(path) / Builder.load(path)
              new .map                    → MapBuilder.fromTemplate(MapBuilder.templatePath(kind), name)
              new .model                  → ModelBuilder.fromTemplate(templatePath, name)
              new .ui                     → new UIBuilder(groupName)   (UIBuilder has no fromTemplate — builder-protocol-ui.md §3)
(2) INSPECT   snapshot() / find() / listEntities() / getMapInfo() / listComponents()
(3) MUTATE    builder fluent API only (never raw JSON)
(4) WRITE     write(path) — auto lint (UI) / validate (Model) / id+componentNames sync (Map)
(5) REFRESH   Maker MCP `refresh` (call `stop` first if in play mode)
```

On any mid-workflow failure (RuntimeError / validate failure / lint error), **stop immediately**. Do not proceed to later steps; fix the cause and restart from (1).

### Cross-builder chaining contract

All builders (`MapBuilder` / `ModelBuilder` / `CollisionGroupSetBuilder` / `UIBuilder`) share one contract: **every mutator — creators, updaters, removers, and `write()` — returns the builder itself, and a missing target throws `Error` (never returns `false` / `null`).** Inspection helpers (`find` / `getId` / `get*` / `has*` / `list*` / `snapshot` / `validate` / `build`) return data and must be called on their own line; pre-check with `has*()` / `find()` when conditional behavior is needed. `MapBuilder` and `UIBuilder` additionally expose `b.lastId()` — the id of the entity targeted by the most recent creator call (`entity` / `empty` / `sprite` / `placeModel`, or any UI creator). For a brand-new path a fresh UUID is assigned; for a path that already exists the creator upserts in place and `lastId()` returns the existing UUID, so the caller always gets the id usable to address that entity. Update/remove mutators (`patch` / `patchComponent` / `rename` / `upsertComponent` / `setComponentEnabled` / `remove` / `removeComponent`) do **not** touch `lastId()`. For `MapBuilder.placeModel`, `lastId()` returns the **root** id of the placed model, not the last placed child. `ModelBuilder` and `CollisionGroupSetBuilder` operate on a single file and have no `lastId()`.

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

### Rules common to all builders

1. **No raw JSON edits** — direct edits are allowed only in the coverage-gap areas listed in the per-builder files ([builder-protocol-map.md](builder-protocol-map.md) §1.6 / [builder-protocol-ui.md](builder-protocol-ui.md) §3.10), and only with minimal scope plus `refresh` + logs verification.
2. **Always `refresh` after a write** (`stop` first if in play mode). Maker must ingest content-file changes.
3. **Never touch `.codeblock`** — the `.codeblock` paired with a `.mlua` is auto-generated by Maker `refresh`.
4. **`Environment/*.d.mlua` is read-only** — API definitions, not for modification.
5. **Empty `SpriteRUID` = invisible** (no error). Never leave `SpriteRUID` empty in any builder.
6. **Entity / Component / EntityRef / ComponentRef property defaults are UUID strings.** In AI automation, the builder injects UUIDs directly — never tell the user to "drag in Maker."
7. **Stop work on CoreVersion mismatch** — verify `Environment/config`'s CoreVersion is `26.7.0.0` before any work.
8. **Component type strings are auto-qualified — but pass them fully qualified anyway.** Native components use `MOD.Core.XxxComponent` (e.g. `MOD.Core.TransformComponent`); mlua script components use `script.XxxComponent` (e.g. `script.Monster`). The engine keys `.map` / `.model` / `.ui` components by exact `@type`, and a wrongly-namespaced or mistyped `@type` silently fails to attach (Maker logs only a warning and the inspector shows no component). To remove that footgun, the component-bearing builders (`MapBuilder` / `ModelBuilder` / `UIBuilder`) **auto-qualify any bare (un-prefixed) component-type string at the call site**: a name in the native catalog becomes `MOD.Core.<name>`, any other bare name becomes `script.<name>`, and the builder prints a one-time advisory on stderr stating what it did and what to pass next time. A string that already starts with `MOD.` or `script.` is left untouched and silent — so the clean habit is to always pass the fully-qualified form. `null` / missing still throws `TypeError`.
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

> Changing the mode itself is a user action in Maker (Hierarchy right-click → Switch ...). The AI must never write `TileMapMode` directly ([builder-protocol-map.md](builder-protocol-map.md) §1.5 "Map Mode Rules").

### When working on `.model`

- **Do not start from a blank model.** Pick the closest template from the skill-local `models/` catalog and load it with `ModelBuilder.fromTemplate(absPath, name)`. Catalog: [builder-protocol-model.md](builder-protocol-model.md) §2.1.
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

**`.ui` ↔ `.mlua` integration** ([builder-protocol-ui.md](builder-protocol-ui.md) §3.6):

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

After calls to multiple builders, consolidate into a single `refresh`.

---

## §5 Constraint Rules Checklist (common to all builders)

### Files / Editor / MCP

1. **`refresh` after file changes** (`stop` first if in play mode).
2. **`.map` / `.model` / `.ui` are all builder-first** — direct raw JSON edits are reserved for the explicit gaps in [builder-protocol-map.md](builder-protocol-map.md) §1.6 / [builder-protocol-model.md](builder-protocol-model.md) §2 / [builder-protocol-ui.md](builder-protocol-ui.md) §3.10, must stay minimal, and must be verified with `refresh` + logs.
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
| [builder-protocol-map.md](builder-protocol-map.md) | §1 `MapBuilder` call protocol — API, placement, coverage gaps, map-mode rules |
| [builder-protocol-model.md](builder-protocol-model.md) | §2 `ModelBuilder` + §2.7 `CollisionGroupSetBuilder` call protocol — template catalog, `typeKey`, children, validation |
| [builder-protocol-ui.md](builder-protocol-ui.md) | §3 `UIBuilder` call protocol — creators, auto-lint, anchor/pivot, binding injection |
| [entity.md](entity.md) | `.map` entity domain — Scope, RUID, TileMapMode preflight, modelId vs inline rule, coordinate / foothold / camera, runtime verification |
| [model.md](model.md) | `.model` authoring domain — when to create, template catalog, component combinations, script-component lifecycle |
| [monster.md](monster.md) | Monster canonical 11 components + pitfalls — read before authoring a monster |
| [platform.md](platform.md) | TileMapMode ↔ Body mapping, spawn, RUID, coordinate system (common to all map types) |
| [platform-maple.md](platform-maple.md) / [platform-rect.md](platform-rect.md) / [platform-sideview.md](platform-sideview.md) | Per-map-type physics / events / patterns |
| [troubleshooting.md](troubleshooting.md) | Symptom → cause → fix (LEA-3004, "won't move", "won't render", LWA-3047, etc.) |
| [`msw-ui-system` SKILL](../../msw-ui-system/SKILL.md) | UI design guide + component API — read together when working on `.ui` |
| [`msw-ui-system/references/component-api.md`](../../msw-ui-system/references/component-api.md) | Full UI component fields / enums — when applying the `patchComponent` workaround |
| [`msw-ui-system/references/ui-fundamentals.md`](../../msw-ui-system/references/ui-fundamentals.md) | Coordinate system / 16 anchor presets, resolution / safe area |

**Core principle**: *"`.map` / `.model` / `.ui` mutations all go through dedicated builders, and every call is made with this core plus the matching per-builder file in context."*
