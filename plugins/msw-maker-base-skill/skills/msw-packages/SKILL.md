---
name: msw-packages
description: "MSWPackages catalog — official 1st-party prebuilt packages for common MSW features. Use this skill BEFORE writing a feature from scratch when the user asks for any standard game system (toast/notification, ranking/leaderboard, inventory/equipment, shop/store, world shop, mail, quest/achievement, dialog/NPC conversation, key binding, game event broadcast, player data/save, collection/dex, slash command, scrollview/virtualized list, drop table, global config, GM message, resource/currency, UI components, object pool/entity reuse, custom behaviour tree composite nodes (shuffle/weighted random/switch)). Always check the catalog first; if a package matches the requested feature, fetch its README and propose integrating instead of building from zero. Keywords: MSWPackages, package, prebuilt, integration."
---

# MSW Packages — Official Prebuilt Catalog

[`MSW-Git/MSWPackages`](https://github.com/MSW-Git/MSWPackages) is the official MSW first-party repository of prebuilt feature packages. Before writing any standard game feature from scratch, **check this catalog first** — if a package matches, propose integration instead of zero-from-scratch implementation.

This skill is a thin index. Per-package details (README, source, integration steps) are fetched **on demand from GitHub** rather than mirrored here, so the catalog stays current automatically.

---

## Decision Flow

```
User asks for feature X
        │
        ▼
Match X against Feature → Package table below
        │
   ┌────┴─────┐
   │ Match    │ No match
   ▼          ▼
Scope-First check      Proceed with normal MSW
(see section below):   authoring (msw-scripting,
system vs UI-only?     msw-search, etc.)
        │
   ┌────┴───────────┐
   │ system         │ UI-only
   ▼                ▼
Fetch package    Route to msw-ui-system
README           (+ references/templates/, skip the rest of this skill)
        │
        ▼
Summarize for user
"Found <package>. README says: <summary>.
 Integrate this, or build from scratch?"
        │
   ┌────┴─────┐
   │          │
   ▼          ▼
Integrate    Build from scratch
        │
        ▼
Run Integration Workflow (below)
```

**Default posture**: ask the user before integrating. Do not auto-install without confirmation — packages can collide with existing UUIDs, sprite RUIDs, or naming conventions in the user's project.

---

## Feature → Package Mapping

When a user request mentions one of these features (Korean or English), look up the matching package and fetch its README first.

| Feature domain | Package | GitHub path |
|---|---|---|
| Toast / notification / banner | `maplestory-toast-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/maplestory-toast-package) |
| Ranking / leaderboard / scoreboard (basic) | `ranking-basic-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/ranking-basic-package) |
| Ranking / leaderboard (advanced — multi-board, season) | `ranking-advanced-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/ranking-advanced-package) |
| Inventory / item bag / equipment | `inventory-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/inventory-package) |
| Shop / store / purchase | `shop-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/shop-package) |
| World shop / premium shop | `worldshop-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/worldshop-package) |
| Mail / mailbox | `mail-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/mail-package) |
| Quest / achievement / mission | `quest-achievement-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/quest-achievement-package) |
| Dialog / NPC conversation (typewriter style) | `dialog-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/dialog-package) |
| Key binding / virtual button | `key-binding-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/key-binding-package) |
| Game event broadcast / pub-sub | `game-event-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/game-event-package) |
| Player data / save / profile | `player-data-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/player-data-package) |
| Collection / gallery / dex | `collections-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/collections-package) |
| Slash command / chat command | `command-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/command-package) |
| Virtualized scroll list / large list | `recyclescrollview-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/recyclescrollview-package) |
| Drop table / loot probability | `droptable-resolver-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/droptable-resolver-package) |
| Global config / shared settings | `global-config-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/global-config-package) |
| GM / system announcement | `gm-message-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/gm-message-package) |
| Game resource (currency, energy, refillable) | `resource-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/resource-package) |
| UI components and prefab models | `ui-component-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/ui-component-package) |
| Object pool / entity reuse (pre-created, spawn/release) | `objectpool-manager-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/objectpool-manager-package) |
| Behaviour tree composite nodes (shuffle, weighted random, switch, success threshold) | `custom-composite-node-package` | [link](https://github.com/MSW-Git/MSWPackages/tree/main/custom-composite-node-package) |

If multiple packages plausibly match (e.g. "ranking" → basic vs advanced), fetch both READMEs and let the user choose based on the comparison.

---

## Scope-First Routing (UI vs System)

When a request matches a catalog keyword but it is unclear whether the user wants the **full system** (data + logic + UI) or **just the UI screen**, ask ONE short question BEFORE fetching package files. Use the matching row from the table below.

| Request keyword | Question to ask |
|---|---|
| Ranking / leaderboard | "Do you need score saving and rank calculation too, or just the leaderboard screen?" |
| Inventory / bag | "Do you need add/remove item logic too, or just the slot screen?" |
| Shop / store | "Do you need currency deduction and purchase handling too, or just the shop screen?" |
| Mail / mailbox | "Do you need send/receive logic too, or just the mailbox screen?" |
| Quest / achievement | "Do you need progress tracking and rewards too, or just the quest list screen?" |
| Toast / notification | "Do you need the queueing/timing system too, or just the message popup?" |
| Dialog / NPC conversation | "Do you need branching dialogue and state too, or just the dialog window?" |
| Collection / dex | "Do you need collection state and progress tracking too, or just the dex screen?" |
| Player data / save | "Do you need persistence and load/save flow too, or just a profile screen?" |
| Anything else / unclear | "Do you need the working feature, or just the UI screen?" |

### Routing rule

Map the user's answer to a destination:

| User says... | Route to |
|---|---|
| "feature", "system", "logic", "save", "calculate", "handle", "process" | **Stay here (`msw-packages`)** — proceed to Fetch Protocol below |
| "screen", "UI", "look", "visual", "just the layout", "show only" | **`msw-ui-system` skill** (+ `references/templates/`) — pick a style template, then build via the UI builder |
| Low-level question (anchor, component property, enum) | **`msw-ui-system` skill** — answer directly via [`references/component-api.md`](../msw-ui-system/references/component-api.md) (incl. §Enums) / [`ui-fundamentals.md`](../msw-ui-system/references/ui-fundamentals.md), no fetch needed |

### When to skip the question

Skip the Scope-First question and route directly when the user's request is already explicit:

- "from scratch" / "just the UI" / "only the screen" → `msw-ui-system` skill (+ `references/templates/`)
- "full system" / "with backend" / "with data" / "save score" → stay in `msw-packages`
- Pure low-level UI question (e.g. "how do I set anchor?") → `msw-ui-system` skill

Only ask when the keyword matches a catalog package AND the scope is genuinely ambiguous.

---

## Fetch Protocol

When a candidate package is identified:

### 1. README first (always)

```
https://raw.githubusercontent.com/MSW-Git/MSWPackages/main/<package-name>/README.md
```

Use `WebFetch` to pull this. Summarize the public API and use cases for the user before going further.

### 2. File tree (when integration is likely)

Use the GitHub tree API and grep for the package path:

```
https://api.github.com/repos/MSW-Git/MSWPackages/git/trees/main?recursive=1
```

The response is large and may be truncated. Grep the response for `<package-name>/` to extract the file list. If truncated, fall back to per-directory tree calls:

```
https://api.github.com/repos/MSW-Git/MSWPackages/contents/<package-name>/MyDesk
```

Standard package layout:
- `<package-name>/README.md`
- `<package-name>/<PackageName>.modpackage` — installer manifest (treat as opaque)
- `<package-name>/MyDesk/<PackageName>/Core/` — core scripts/UI to copy
- `<package-name>/MyDesk/<PackageName>/Sample/` — example usage (do not copy unless requested)
- `<package-name>/MyDesk/Util/` — shared utilities (some packages)

### 3. Raw file fetch (per-file as needed)

```
https://raw.githubusercontent.com/MSW-Git/MSWPackages/main/<path>
```

Substitute `github.com/.../blob/main/...` with `raw.githubusercontent.com/.../main/...` for any browsing URL.

---

## Integration Workflow

After the user confirms integration:

1. **Map files into project layout**:
   - `MyDesk/<PackageName>/Core/*.mlua` → `RootDesk/MyDesk/<PackageName>/`
   - `MyDesk/Core/*.mlua` (no `<PackageName>` folder) → `RootDesk/MyDesk/<README title>/`
   - `MyDesk/<PackageName>/Core/*.ui` → `ui/`
   - `MyDesk/<PackageName>/Core/*.model` → `RootDesk/MyDesk/Models/<Category>/`
   - `MyDesk/Util/*` → `RootDesk/MyDesk/Util/` (reuse if already present)

2. **Check UUID collisions**: every entity `id` and `EntryKey` in incoming `.ui`/`.model` files must not already exist in the user's project. `grep` the workspace for collisions before writing. Regenerate any colliding UUID with a fresh hex UUID.

3. **Check sprite RUID dependencies**: scan the package files for hard-coded RUIDs. They reference MSW community resources — usually fine, but verify with `msw-search` if any look suspicious or you need a substitute.

4. **Resolve cross-package dependencies**: some packages depend on others (e.g. ranking may build on player-data). Read the package's README and source headers — install transitive packages first, then this one.

5. **Apply** with the standard MSW workflow: `stop` → `maker_refresh_workspace` → `play`. Verify in build logs and runtime logs.

6. **Wire into user's code**: most packages expose a `_<PackageName>` Logic singleton. Call its API from the user's existing scripts (e.g. `_MaplestoryToast:Show(...)`).

---

## Pitfalls

- **`.modpackage` files are NOT auto-installer scripts in this workflow** — they are Maker-editor metadata. Manual file copy is what actually integrates the package.
- **Hardcoded sprite RUIDs in samples**: package samples often reference specific RUIDs for decoration sprites. These work but the user may want to substitute. Note this when summarizing.
- **UI files use UIGroup root entities** — when copying, route through `msw-ui-system` (`UIBuilder.read/load` to inspect, builder API to mutate; design rules — UIGroup root configuration, anchor mode pitfalls — live in the same skill). Do not hand-edit raw `.ui` JSON.
- **`Sample/` content is illustrative, not production** — do not copy `Sample/` files unless the user explicitly asks. Sample scripts often bind to keyboard shortcuts that conflict with the user's controls.
- **No package replaces understanding of mlua** — packages provide pre-built features but the user still needs `msw-scripting` knowledge to extend them.
- **Don't bulk-install multiple packages speculatively** — each integration adds files and surface area. Install one feature at a time, validate, then move on.

---

## When the user has already chosen "build from scratch"

Skip integration entirely. Proceed with normal MSW authoring (`msw-scripting`, `msw-search`, etc.). Do not silently keep nudging toward packages.

---

## When `MSW-Git/MSWPackages` is unreachable

- WebFetch returns an error or 404 → confirm the URL hasn't changed.
- Sandboxed network may block direct `curl` to `api.github.com` — prefer `WebFetch` for raw and HTML URLs.
- If everything fails, fall back to building from scratch and tell the user the package is currently inaccessible.

---

## Cross-references

- `msw-general` — workspace, file paths, MCP tools, coordinate systems.
- `msw-scripting` — `.mlua` syntax for hooking package APIs into game logic.
- `msw-search` — sprite/animation/sound RUID lookup when substituting package-bundled resources.
- `msw-behaviourtree` — `bt-spec.md` rebuild and `.behaviourtree` placement after copying `custom-composite-node-package`.
