# MSW Workspace / Domain Knowledge

World architecture, workspace structure, hierarchy, file path rules, and play mode rules.

---

## World Architecture

### World Instance

- **World instance**: an execution unit created from the world data authored in Maker.
- **Auto-created / destroyed** based on max player count: e.g., a world capped at 10 receiving 100 players spawns 10 instances.
- All instances **share a single DataStorage**.
- Inter-instance communication: use `_RoomService`, `_WorldInstanceService`.
- After some time post-creation, an instance enters retirement — existing users stay, new users cannot join.

### Room (Static Room / Instance Room)

| Aspect | Static Room | Instance Room |
|--------|-------------|---------------|
| Creation timing | **Always** when a world instance is created | Created **dynamically** by the server |
| Maps included | Static Maps only | Instance Maps only |
| Destruction | With the instance | On explicit deletion or instance shutdown |

- **Static Map**: a `.map` file whose MapComponent has InstanceMap unchecked (default).
- **Instance Map**: a map whose MapComponent has InstanceMap checked. Exists only inside Instance Rooms.

### Local Entity

- An entity that **exists only on the client, not on the server**.
- Invisible to other clients.
- Used for effects, client-only UI objects, etc.

### Shared Memory

| Scope | Class | Range |
|-------|-------|-------|
| Within a Room | `RoomSharedMemory` | Data shared between players in the same Room |
| Within an Instance | `WorldInstanceSharedMemory` | Data shared across the entire world instance |

### WorldConfig Settings

Key settings in `Global/WorldConfig.config` that control world behavior:

| Setting | Function |
|---------|----------|
| `LegacyAnimation` | Apply legacy MapleStory Worlds movement / animation |
| `PlayerEntityAuthorityCheck` | Restrict server function calls on player entities to the local client (security hardening) |
| `ServiceAuthorityCheck` | Switch native service server functions to ServerOnly (security hardening) |
| `SourceLanguage` | Source language for auto-translation |

---

## Workspace Core Concepts

- **Workspace**: the top-level container of a game project. All models, components, scripts, and maps live inside it.
- **Model**: an entity template (preset) registered in the workspace. Components and properties are pre-configured; instances inherit the configuration as-is.
- **Entity**: an actual object instance placed on a map. Created from a model or assembled directly from scratch.
- **Hierarchy**: the tree-structure panel of entities placed on the current map.
- **Engine Component**: a unit of functionality attached to an entity (Transform, SpriteRenderer, Rigidbody, etc.).
- **Script (CodeBlock)**: a code unit residing in the workspace. Written in MSW's custom Lua dialect (mlua).

---

## File Path Rules

| Folder | Contents | AI work |
|--------|----------|---------|
| `./Global/` | Existing engine/global templates (`*.model`, configs, sets) | Existing `*.model` files are editable in place through `ModelBuilder`; `CollisionGroupSet.collisiongroupset` through `CollisionGroupSetBuilder`; `.config` values-only. Do not create new files here |
| `./RootDesk/MyDesk/` | User scripts (.mlua), user models (.model) | **AI's primary work area** |
| `./map/` | Map files (.map) | Editable |
| `./ui/` | UI files (.ui) | Properties editable |
| `./Environment/NativeScripts/` | Engine API definitions (.d.mlua) | **Never modify** |

> **Key**: the AI creates new scripts and new models under `./RootDesk/MyDesk/`. Within `./Global/`, edit only existing files in place; never add new Global assets. Use `ModelBuilder` for every `.model` edit and `CollisionGroupSetBuilder` for `CollisionGroupSet.collisiongroupset`.

---

## Hierarchy Structure

```
World (top)
├── common          ← Game-wide common entities (GameManager, etc.)
├── maps            ← Per-map entities
│   └── map01       ← Currently active map
└── ui              ← UI editor-only entities
    ├── DefaultGroup
    ├── PopupGroup
    └── ToastGroup
```

**File ↔ hierarchy relationship:**
- `.map` files in `./map/` → map entities under `maps`
- `.ui` files in `./ui/` → UI entities under `ui`
- `.model` files in `./RootDesk/MyDesk/` → workspace models (when placed on a map, they appear in the hierarchy)
- `.config` and `.model` files in `./Global/` → system settings, default models

---

## Play Mode Rules

- **Edit operations are blocked during play mode.** File modification, refresh, etc. are not allowed.
- If play mode is on before an edit operation, end it first with `stop`.
- By default, every operation assumes **edit (authoring) mode**.

---

## refresh Call Rule

After completing any operation that **changes the workspace** — creating, modifying, or deleting a file — **always call the MCP `refresh` tool**. This rule applies universally.

---

## Handling Mid-Workflow Failure

If a step in a multi-step operation fails, **do not proceed to later steps.** Fix the root cause first, then continue.

---

## Common Work Patterns

### Refresh workspace after editing
```
1. Create / modify a file (e.g., .mlua, .model)
2. Call MCP refresh
3. Verify the change
```

### Playtesting / debugging

Default flow: **edit file → refresh → (check build logs) → play → control / logs → stop → repeat**.

> Build log triage, error classification, regression testing, Lua debugging, and other **detailed workflow are in the `msw-scripting` skill**.
