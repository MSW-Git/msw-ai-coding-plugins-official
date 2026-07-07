# MSW Buildable Game-Genre Catalog (grounding reference)

Organized by MSW's technical characteristics (2D · mLua scripting [a Lua-extension language] · Unity engine · PC/mobile cross-platform): the buildable genres, map types, and mechanics. Map a user's idea onto this to produce a **feasible** plan.

- **Build-effort hint (Low / Medium / High)**: a rough signal of how much work a *full* version takes — a signal, not a verdict. Baseline: **Low** = a tiny MVP (≈1 map · core loop only · basic mLua); **Medium** = moderate (a few maps/systems · intermediate mLua; **tower defense sits here — the top of comfortably-solo**); **High** = large (many maps/systems/data · advanced or team-scale). High-effort genres are still buildable — **plan a scoped-down first build (MVP) and defer the rest**, rather than refusing the genre.
- Example notation: `[MSW]` = an actual MSW world / `[ref]` = external reference.

## Contents
1. Map types (3) + selection guide
2. Genre list (by category, 62)
3. Core mechanic tags (by category)

---

## 1. Map types (3)

| Map type | View | Movement | Movement/Body component | Characteristics |
|---|---|---|---|---|
| **TileMap (MapleTile)** | Side-scroll | Left/right + jump | `RigidbodyComponent` | Foothold-based, like the original MapleStory. Gravity/jump/platforms built in |
| **RectTileMap (RectTile)** | Top-down | Free 4-directional | `KinematicbodyComponent` | Looking-down view. Suits RPG fields · strategy · puzzle · social |
| **SideViewRectTileMap** | Side-scroll | Left/right + jump | `SideviewbodyComponent` | Rect-tile side-scroll. Supports ladders/ropes; more terrain freedom than MapleTile |

**Selection guide**
- **TileMap** → MapleStory-style side-scroll. Required if you need jump/platform physics.
- **RectTileMap** → games that need top-down. Recommended for non-action like tycoon · strategy · puzzle · social.
- **SideViewRectTileMap** → side-scroll but with freely composed terrain. Custom-terrain action/platformer.
- **Multiple entries (/)** → both fit. E.g., a monster-collecting RPG works as side-scroll or top-down.

---

## 2. Genre list (by category)

Notation: sub-genre — `Build-effort` · recommended map type · `#core-mechanics` · examples

### Role-Playing
- **MMORPG** — High · TileMap · #leveling #gear-enhance #job-advance #party-play #exploration · [MSW] MapleLand / Artale / Rona World
- **Monster-collecting RPG** — High · TileMap/RectTile · #turn-based-combat #evolution #dex-collection #monster-capture #creature-raising · [MSW] Pictra Monster / [ref] Pokémon
- **Action RPG** — High · TileMap/SideView · #real-time-combat #skill-combo #gear-progression #boss-fight · [MSW] Maple Slash / [ref] Zelda
- **Dungeon crawler** — Medium · TileMap/SideView · #floor-progression #loot-drop #dungeon-exploration #turn-based-movement · [ref] Torneko's Great Adventure
- **Story-driven RPG** — High · TileMap/RectTile · #npc-dialog #branching-choices #quest-progression #multiple-endings · [ref] Undertale
- **Boss-raid RPG** — High · TileMap · #boss-patterns #loot-drop #multiplayer-co-op #role-split · [ref] Monster Hunter

### Action
- **Hack-and-slash** — High · TileMap/SideView · #skill-combo #mass-kill #loot-drop #fast-combat · [ref] Diablo
- **Battle royale** — High · TileMap/RectTile · #real-time-pvp #item-looting #last-one-standing #shrinking-map · [ref] PUBG / Fortnite
- **Boss rush** — Medium · TileMap · #boss-patterns #pattern-memorization #consecutive-battles #rising-difficulty · [ref] Cuphead
- **Fighting / PvP** — High · TileMap/SideView · #skill-use #hit-detection #combo-system #real-time-pvp · [ref] Brawlhalla
- **Co-op PvE** — High · TileMap/RectTile · #stage-clear #multiplayer-co-op #role-split #boss-fight · [ref] Castle Crashers
- **Vampire-survivors-like** — Low · RectTile · #auto-attack #mass-kill #level-up-choice #skill-combination #time-limit · [MSW] Meso Warrior / Million Aing / The Last Maple / [ref] Vampire Survivors

### Adventure
- **Point-and-click adventure** — Medium · TileMap/RectTile · #map-search #item-combine #npc-dialog #story-presentation · [ref] The Secret of Monkey Island
- **Escape room** — Low · TileMap/RectTile · #item-combine #clue-search #unlocking #story-presentation
- **Maze exploration** — Low · RectTile · #inventory #pathfinding #limited-vision #enemy-avoidance · [ref] Pac-Man
- **Resource-gathering survival** — High · TileMap/RectTile · #resource-gathering #building #stamina-management #crafting #exploration · [MSW] Durango / [ref] Terraria, Don't Starve

### Casual & Arcade
- **Typing action** — Low · TileMap/RectTile · #text-input #enemy-kill #time-limit #rising-difficulty · [ref] The Typing of the Dead
- **Fishing game** — Low · TileMap/RectTile · #gear-enhance #dex-collection #timing-input #rarity-system
- **Dodging (Dodge)** — Low · TileMap/RectTile · #obstacle-avoidance #survival-time #rising-difficulty #score-competition
- **Merging/combining** — Low · RectTile · #dex-collection #item-merge #recipe-discovery #physics-reaction · [ref] Suika Game, Little Alchemy
- **Match-3 puzzle** — Low · RectTile · #block-swap #match-3 #chain-reaction #special-blocks · [ref] Candy Crush, Anipang
- **Memory card matching** — Low · RectTile · #memory #pair-matching #turn-limit #rising-difficulty
- **Number/deduction** — Low · RectTile · #logic-deduction #hint #grid-fill #attempt-limit · [ref] Wordle, Mastermind
- **Sliding puzzle** — Low · RectTile · #block-slide #merge #min-moves · [ref] 2048, 15-puzzle
- **Falling-block puzzle** — Low · RectTile · #block-rotate #line-clear #rising-fall-speed #chain-reaction · [ref] Tetris, Puyo Puyo
- **Gacha simulator** — Low · RectTile · #probability-sim #enhance-attempts #result-presentation #stats-logging · [ref] StarForce sim
- **Rhythm/music game** — Medium · TileMap/RectTile · #music-sync #note-timing #combo #accuracy · [ref] O2Jam
- **Board/card game** — Medium · RectTile · #multiplayer #turn-based-flow #rule-based #win-condition · [ref] Blue Marble, One Card (chess/go need high AI difficulty — caution)
- **O/X quiz / elimination** — Low · RectTile · #round-progression #ox-choice #many-players #elimination

### Simulation
- **Gathering/mining sim** — Medium · TileMap/SideView · #gear-enhance #resource-gathering #stamina-management #depth-exploration · [MSW] Miner Simulator
- **Management tycoon** — Medium · RectTile · #upgrade #revenue-management #customer-service #menu-product-management · [MSW] ChuChu Burger Branch 1
- **Housing/interior** — Medium · RectTile · #inventory #object-placement #free-placement #housing · [MSW] Maple Toytown / [ref] Animal Crossing
- **Dress-up/styling** — Medium · RectTile · #inventory #item-combine #theme-mission #outfit-rating · [ref] Love Nikki
- **Farming/ranch** — High · RectTile · #crop-farming #animal-husbandry #time-passage #season-system · [ref] Stardew Valley
- **Life simulation** — High · RectTile · #npc-affinity #daily-activities #relationship-system #open-endedness · [ref] Animal Crossing, The Sims

### Strategy
- **Auto-battler** — Medium · TileMap/RectTile · #round-progression #auto-combat #unit-composition #synergy-combos · [ref] Auto Chess
- **Card strategy/battle** — High · RectTile · #turn-based-combat #card-collection #deckbuilding #mana-management · [MSW] Maple Duel / [ref] Hearthstone
- **Turn-based artillery** — Medium · TileMap/SideView · #angle-adjust #power-adjust #wind-variable #terrain-destruction · [ref] Fortress, Gunbound, Worms
- **Resource-management strategy** — High · RectTile · #resource-allocation #tech-tree #territory-expansion #ai-opponent · [ref] Civilization

### Social
- **Party mini-games** — Medium · RectTile · #round-progression #random-game #many-player-competition #elimination · [ref] Mario Party, Fall Guys
- **Hide-and-seek/chase** — High · TileMap/RectTile · #it-tagging #stealth #real-time-chase #map-search · [ref] Prop Hunt, Red Light Green Light

### Education
- **Quiz game** — Low · RectTile · #question-serving #answer-checking #score-competition #time-limit · [MSW] QPlay Archive
- **Typing practice** — Low · RectTile · #text-input #wpm-measure #accuracy-check #rising-difficulty

### Defense
- **Side-view wave defense** — Medium · TileMap/SideView · #wave-progression #real-time-combat #skill-use #rising-difficulty · [ref] Orcs Must Die
- **Tower defense** — Medium · RectTile · #wave-progression #unit-enhance #resource-management #unit-placement #path-based · [MSW] Maple Random Defense / [ref] Kingdom Rush (**top of comfortably-solo**)
- **Base defense** — Medium · TileMap/RectTile · #wave-progression #object-placement #base-hp #omnidirectional-defense · [ref] Dungeon Defenders
- **Random defense** — Medium · RectTile · #wave-progression #random-draw #unit-merge #unit-placement · [ref] Random Dice

### Shooter
- **Shoot-'em-up** — Low · TileMap/SideView · #projectile #enemy-patterns #power-up #score-competition #boss-fight · [ref] Galaga, 1945

### Sports & Racing
- **Sports game** — Medium · TileMap/RectTile · #rule-based #score-competition #real-time-pvp #turn-based-flow · [ref] heading soccer
- **Racing/running** — Medium · TileMap/RectTile · #async-pvp #speed-competition #track-design #score-competition · [ref] KartRider

### Platformer
- **Obstacle run (obby)** — Low · TileMap/SideView · #stage-clear #timing-jump #moving-obstacles #rising-difficulty · [MSW] Maple Luck Run / [ref] Geometry Dash
- **Hardcore climbing** — Low · TileMap · #physics-movement #special-controls #fall-reset #extreme-difficulty · [MSW] Jar Game Returns / [ref] Getting Over It
- **Jump quest (jumpquest)** — Low · TileMap · #precision-jump #fall-penalty #patience-repetition · [ref] Forest of Patience

### Metroidvania
- **Metroidvania** — High · TileMap/SideView · #ability-unlock #backtracking #exploration #boss-fight · [ref] Hollow Knight, Ori

### Roguelite
- **Run-based roguelite** — Medium · TileMap/RectTile · #run-repetition #random-skills #permanent-upgrade #boss-fight #build-variety · [ref] Hades, Dead Cells
- **Deckbuilding roguelike** — High · RectTile · #run-repetition #path-choice #turn-based-combat #card-acquire #deck-construction · [ref] Slay the Spire
- **Dungeon roguelike** — Medium · TileMap/RectTile · #floor-progression #procedural-generation #permanent-upgrade #item-combine #death-reset · [ref] The Binding of Isaac, Rogue Legacy

### Idle
- **Idle RPG** — Medium · TileMap/RectTile · #auto-combat #prestige #offline-rewards #hero-hiring · [ref] Tap Titans
- **Clicker/idle** — Low · RectTile · #upgrade #prestige #click #auto-accumulate · [ref] Cookie Clicker

### Horror
- **Story horror** — Medium · TileMap/RectTile · #story-presentation #branching-choices #clue-search #unlocking · [ref] The Witch's House, Ib
- **Horror escape** — Medium · TileMap/RectTile · #real-time-chase #clue-search #unlocking #stamina-management · [ref] Granny, Ao Oni

> **Low-effort picks (good first projects)**: Dodging · Falling-block puzzle · Match-3 · Jump quest · Obstacle run · Gacha sim · Vampire-survivors-like · Shoot-'em-up. (Tower defense is the natural next step up — Medium, the top of comfortably-solo.)

---

## 3. Core mechanic tags (by category)

Use these to combine genres or build a one-line concept.

**Progression/structure**: `#wave-progression` (enemies in stronger and stronger batches) `#round-progression` (independent rounds) `#stage-clear` (next on goal reached) `#floor-progression` (going up/down floors) `#run-repetition` (restart from scratch when done) `#path-choice` (pick branches)

**Movement/control**: `#timing-jump` `#precision-jump` `#auto-run` (auto-advance, dodge only) `#physics-movement` `#special-controls` `#obstacle-avoidance` `#moving-obstacles`

**Collection/resource**: `#dex-collection` `#inventory` `#item-combine` `#item-merge` (merge same kinds) `#loot-drop` `#item-looting` `#resource-management` `#resource-gathering` `#resource-allocation` `#coin-collection` `#revenue-management`

**Puzzle/logic**: `#block-rotate` `#block-swap` `#block-slide` `#line-clear` `#rising-fall-speed` `#match-3` `#chain-reaction` `#merge` `#special-blocks` `#logic-deduction` `#hint` `#grid-fill` `#min-moves` `#clue-search` `#unlocking`

**Cards/deck**: `#card-collection` `#card-acquire` `#deckbuilding` (build a combat deck) `#deck-construction` (add/remove during a run) `#mana-management`

**Reset/penalty**: `#death-reset` `#fall-reset` `#fall-penalty` `#elimination`

**Input/judgment**: `#text-input` `#wpm-measure` `#accuracy-check` `#music-sync` `#note-timing` `#combo` `#question-serving` `#answer-checking` `#ox-choice`

**Survival/state**: `#stamina-management` (hunger/HP) `#base-hp` `#survival-time` `#last-one-standing` `#shrinking-map` (shrinking safe zone)

**Random/probability**: `#procedural-generation` `#random-draw` `#random-skills` `#random-game` `#probability-sim` `#unit-merge`

**Shooting/firing**: `#projectile` `#enemy-patterns` `#power-up` `#angle-adjust` `#power-adjust` `#wind-variable` `#terrain-destruction`

**Combat/action**: `#real-time-combat` `#turn-based-combat` `#auto-combat` (composition/strategy only) `#auto-attack` `#skill-use` `#skill-combo` `#boss-patterns` `#pattern-memorization` `#hit-detection` `#combo-system` `#mass-kill` `#real-time-pvp` `#async-pvp`

**Growth/enhancement**: `#leveling` `#level-up-choice` (choices on level-up) `#gear-enhance` `#gear-progression` `#unit-enhance` `#upgrade` `#permanent-upgrade` `#prestige` (permanent bonus after reset) `#job-advance` `#evolution`

**Placement/construction**: `#unit-placement` `#unit-composition` `#synergy-combos` `#placement-strategy` `#object-placement` `#free-placement` `#building`

**Social/multi**: `#party-play` `#multiplayer-co-op` `#role-split` (tank/dps/heal) `#multiplayer` `#many-player-competition` `#many-players` `#it-tagging` `#customer-service` `#npc-dialog` `#npc-affinity`

**Decoration/appearance**: `#housing` `#theme-mission` `#outfit-rating`

**Misc (commonly used)**: `#time-limit` `#attempt-limit` `#turn-limit` `#rising-difficulty` `#score-competition` `#extreme-difficulty` `#patience-repetition` `#speed-competition` `#path-based` (enemies on a set path) `#pathfinding` `#limited-vision` `#stealth` `#map-search` `#exploration` `#ability-unlock` `#backtracking` `#enemy-avoidance` `#omnidirectional-defense` `#story-presentation` `#real-time-chase` `#multi-map` `#branching-choices` `#multiple-endings` `#quest-progression` `#turn-based-movement` `#fast-combat` `#rarity-system` (common/rare/legendary) `#hero-hiring` `#crafting` `#depth-exploration` `#season-system` `#time-passage` `#daily-activities` `#relationship-system` `#open-endedness` `#rule-based` `#win-condition` `#timing-input` `#memory` `#pair-matching` `#enemy-kill` `#track-design` `#menu-product-management` `#animal-husbandry` `#crop-farming` `#recipe-discovery` `#physics-reaction` `#enhance-attempts` `#result-presentation` `#stats-logging` `#click` `#auto-accumulate` `#offline-rewards` `#tech-tree` `#territory-expansion` `#ai-opponent` `#build-variety` `#monster-capture` `#creature-raising` `#skill-combination` `#boss-fight` `#consecutive-battles` `#dungeon-exploration`
