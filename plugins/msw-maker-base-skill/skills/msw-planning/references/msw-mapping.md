# Game System → MSW Implementation Mapping Cheat Sheet

Use this to fill the "System ↔ MSW mapping" section of a planning deliverable. Connect each game system to MSW's real implementation means (components · files · skills).

## 1. Map type ↔ camera/physics/movement (nail this down first)

The table that decides the whole stack. **If an entity's Body doesn't match the map type, it won't move or you get `[LEA-3004]` (a silent failure).**

| TileMapMode | View | Body component | Map structure | Gravity | Movement |
|---|---|---|---|---|---|
| `MapleTile` (0) | Side-scroll | `RigidbodyComponent` | `FootholdComponent` platforms | Yes | Left/right + jump |
| `RectTile` (1) | Top-down | `KinematicbodyComponent` | `RectTileMapComponent` tiles | No | Free 4-directional |
| `SideViewRectTile` (2) | Side-scroll | `SideviewbodyComponent` | `RectTileMapComponent` tiles | Yes | Left/right + jump (tile) + ladder/rope |

> For the exact rules · coordinate system (1 unit = 100px) · SpriteRUID etc., follow **msw-general's `references/platform.md`** and `platform-{maple|rect|sideview}.md` during implementation. At the planning stage, only decide up to "pair and nail down the map type and Body."

## 2. System → MSW implementation means

| Game system | MSW implementation | Notes |
|---|---|---|
| Global state · timer · game flow · pause | `@Logic` (GameDirector-style) | Lives the whole world session · survives map transitions |
| Enemy spawn · wave · director | `@Logic` or map-entity `@Component` | If map-scoped, use a map `@Component` |
| Player stats · input · skills · UI control | `@Logic` (PlayerLogic) or player `@Component` | If DefaultPlayer-based, msw-defaultplayer |
| Per enemy/NPC/object behavior | that entity's `@Component` | Lifetime tied to the actor |
| Player movement | per-map-type Body + DefaultPlayer or MovementComponent | See table 1 · **msw-defaultplayer** |
| Avatar appearance · costume · custom action / attack motion | CostumeManagerComponent (17 slots) + AvatarStateAnimationComponent / AvatarRendererComponent | msw-avatar (any avatar entity — player · NPC · monster) |
| Combat (attack · hit · damage · knockback · hit-stop) | msw-combat-system | Includes HP bar · effects. Refs: monster setup & **facing** → msw-general `monster.md`; projectile → `projectile.md`; HP → `hp-gauge.md` |
| Behavior-tree (BT) AI / FSM | msw-behaviourtree / StateComponent | |
| Data (stats · economy · drops · difficulty curve) | UserDataSet (dataset, CSV) | "Data-driven": CSV is the source of truth, update without code changes. Migrate hardcoded values → dataset when the value-set grows (plan it as a roadmap goal) |
| Localized text | LocaleDataSet | Mind ClientOnly |
| Persistent save (save · progress) | `_DataStorageService` | Key-value persistence |
| UI (HUD · popup · button · card select etc.) | `.ui` + UIBuilder (msw-ui-system) | Never edit raw JSON |
| Camera · screen-transition effects | CameraComponent/CameraService · ScreenTransitionService | |
| Particles · effects | ParticleService · EffectService | |
| Sound · BGM | SoundComponent · SoundService + msw-search | |
| Sprite · animation resources | search a RUID via msw-search → **assign it to the renderer (msw-sprite-ruid)** | If none found, draw directly with msw-painter |
| Model (entity appearance · physics · motion) | `.model` + ModelBuilder | |
| Entity placement · map | `.map` + MapBuilder | SpawnByModelId parent ≠ nil |
| Shop · item · badge (commerce) | world_item / world_badge / WorldShopService | Connect with BM deliverables |
| Standard game systems (inventory · ranking · quest etc.) | **check the msw-packages catalog first** | Don't build from scratch |

## 3. Scope rule — @Logic vs @Component

- **@Logic**: one per world, survives map transitions. For game flow · global managers. (Putting map-only state in @Logic leaks into the next map → reset it in `OnMapLeave`.)
- **Map-entity @Component**: content that lives only in that map (wave spawner · mini-game · NPC dialog). Cleaned up on map unload.
- **Actor @Component**: behavior of a specific entity (monster AI · item pickup). Lifetime tied to that actor.
- Decision test: *"Should it keep running when you move to another map?"* → Yes = @Logic / this map only = map @Component / this actor only = actor @Component.

## 4. Skills to reference when moving to implementation
> Point to the **specific reference doc**, not just the skill — that's where the silent-failure gotchas live (e.g. enemy facing). Don't copy the rules here; link to them.

- `msw-general` — platform/authoring foundation. Map-type/coords/SpriteRUID → `references/platform.md` (+ `platform-{maple|rect|sideview}.md`); **monster `.model` & facing → `references/monster.md`**; animation/FSM state → `references/animation-state.md`; tiles → `references/tile.md`; `.model` → `references/model.md`; entity placement/`.map` → `references/entity.md`; dataset (UserDataSet/LocaleDataSet · hardcoded→data) → `references/dataset.md`.
- `msw-scripting` — `.mlua` authoring · lifecycle · events; verify loop → `references/verify-checklist.md`; save/persist → `references/datastorage.md`.
- `msw-defaultplayer` — DefaultPlayer-based player: move speed · jump · HP · camera · auto/programmatic (AI-driven) control.
- `msw-avatar` — costume (17 equip slots) · avatar animation states · custom shoot/cast/dance · weapon-specific attack motion; any avatar-bearing entity (not only DefaultPlayer).
- `msw-ui-system` — `.ui` builder · HUD/popup/toast; component API → `references/component-api.md`; runtime patterns → `references/runtime-patterns.md`.
- `msw-combat-system` — combat concepts; **monster setup → `msw-general/references/monster.md`**; HP gauge → `references/hp-gauge.md`; projectile → `references/projectile.md`; BT/AI → `references/ai-bt.md`; FSM/state → `msw-general/references/animation-state.md`.
- `msw-behaviourtree` — authors `.behaviourtree` files (node graph · Blackboard · nodeProperties) + per-project bt-spec. (Combat-AI *concepts* → msw-combat-system `references/ai-bt.md`.)
- `msw-packages` — standard-systems catalog (inventory/shop/ranking/quest) — check before building.
- `msw-search` / `msw-painter` — resource search / draw a sprite directly.
- `msw-sprite-ruid` — assign a RUID to a renderer (`SpriteRUID` world / `ImageRUID` UI) · `thumbnail://` item & avatar icons. msw-search **finds** → msw-sprite-ruid **applies** (fixes empty-SpriteRUID → invisible).
