# MSW Buildable Game-Genre Catalog (grounding reference)

Organized by MSW's technical characteristics (2D · mLua scripting [a Lua-extension language] · Unity engine · PC/mobile cross-platform): the buildable genres, map types, and mechanics. Map a user's idea onto this to produce a **feasible** plan.

- **Build-effort hint (Low / Medium / High)**: a rough signal of how much work a *full* version takes — a signal, not a verdict. Baseline: **Low** = a tiny MVP (≈1 map · core loop only · basic mLua); **Medium** = moderate (a few maps/systems · intermediate mLua; **tower defense sits here — the top of comfortably-solo**); **High** = large (many maps/systems/data · advanced or team-scale). High-effort genres are still buildable — **plan a scoped-down first build (MVP) and defer the rest**, rather than refusing the genre.
- **`MVP:` / `Growth:` line (per genre)**: `MVP:` = the smallest playable slice that already delivers the genre's fun — the seed for **Phase 1 / milestone M1** scoping (STEP 3 scoped-down option · STEP 4 Phase 1). `Growth:` = the axes a finished core typically grows along, in rough order — the seed for **later Phases / next milestones**. Both are hints to adapt, not fixed specs.
- Example notation: `[MSW]` = an actual MSW world / `[ref]` = external reference.

## Contents
1. Map types (3) + selection guide
2. Genre list (by category, 71)
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

Notation: sub-genre — `Build-effort` · recommended map type · `#core-mechanics` · examples, then an indented `MVP:` / `Growth:` hint line (see the legend above).

### Role-Playing
- **MMORPG** — High · TileMap · #leveling #gear-enhance #job-advance #party-play #exploration · [MSW] MapleLand / Artale / Rona World
  - MVP: 1 field map + 1 town · 3 monster types · EXP/level + 1 starter job · one short quest chain — Growth: regions/maps → jobs + skill trees → party/boss content → gear economy & trade
- **Monster-collecting RPG** — High · TileMap/RectTile · #turn-based-combat #evolution #dex-collection #monster-capture #creature-raising · [MSW] Pictra Monster / [ref] Pokémon
  - MVP: 1 route · 5 capturable species · 1v1 turn battle · party of 3 · capture item — Growth: dex expansion → evolution lines → trainers/gyms → trading & rare hunts
- **Action RPG** — High · TileMap/SideView · #real-time-combat #skill-combo #gear-progression #boss-fight · [MSW] Maple Slash / [ref] Zelda
  - MVP: 1 dungeon map · basic attack combo + 2 skills · 3 enemy types + 1 mini-boss · HP/potion — Growth: skill tree → gear drops/enhance → dungeon list → classes/difficulties
- **Dungeon crawler** — Medium · TileMap/SideView · #floor-progression #loot-drop #dungeon-exploration #turn-based-movement · [ref] Torneko's Great Adventure
  - MVP: 3 floors · descend-to-goal · 5 enemy types · HP/hunger + random loot — Growth: deeper floors/themes → item variety & identify → classes → daily runs
- **Story-driven RPG** — High · TileMap/RectTile · #npc-dialog #branching-choices #quest-progression #multiple-endings · [ref] Undertale
  - MVP: 1 chapter · dialog + choice engine (dataset-driven) · one branch → 2 endings — Growth: chapters → branch depth/flags → set-piece minigames → collectible lore
- **Boss-raid RPG** — High · TileMap · #boss-patterns #loot-drop #multiplayer-co-op #role-split · [ref] Monster Hunter
  - MVP: 1 boss with 3 telegraphed patterns · 4-player co-op · basic role kits · clear reward — Growth: boss roster → pattern/enrage depth → gear & enhance loop → weekly reset economy

### Action
- **Hack-and-slash** — High · TileMap/SideView · #skill-combo #mass-kill #loot-drop #fast-combat · [ref] Diablo
  - MVP: 1 arena · mob waves · combo attack + 1 AoE skill · loot drops — Growth: skill/gear depth → stage list → difficulty tiers → item sets/builds
- **Battle royale** — High · TileMap/RectTile · #real-time-pvp #item-looting #last-one-standing #shrinking-map · [ref] PUBG / Fortnite
  - MVP: 1 mid-size map · 8–16 players · loot spawns · shrinking zone · last-alive wins — Growth: map size/POIs → item meta → squads/revive → ranked seasons
- **Boss rush** — Medium · TileMap · #boss-patterns #pattern-memorization #consecutive-battles #rising-difficulty · [ref] Cuphead
  - MVP: 3 bosses back-to-back · 1 fixed player kit · retry + clear time score — Growth: boss roster → pattern tiers/EX modes → time-attack ranking → unlockable kits
- **Fighting / PvP** — High · TileMap/SideView · #skill-use #hit-detection #combo-system #real-time-pvp · [ref] Brawlhalla
  - MVP: 1 stage · 2 characters · hit/guard/combo core · best-of-3 rounds — Growth: roster → move-set depth → ranked & replays → balance via data
- **Co-op PvE** — High · TileMap/RectTile · #stage-clear #multiplayer-co-op #role-split #boss-fight · [ref] Castle Crashers
  - MVP: 1 stage · 2–4 players · 3 enemy types + stage boss · shared lives — Growth: stage list → classes/roles → difficulty modifiers → co-op-only mechanics
- **Vampire-survivors-like** — Low · RectTile · #auto-attack #mass-kill #level-up-choice #skill-combination #time-limit · [MSW] Meso Warrior / Million Aing / The Last Maple / [ref] Vampire Survivors
  - MVP: 1 open map · 1 auto-attack weapon · 10-min survival timer · 3-choice level-ups — Growth: weapon/synergy pool → characters → meta upgrades → stages/bosses
- **io-style arena** — Medium · RectTile · #real-time-pvp #many-player-competition #survival-time #mass-kill #score-competition · [ref] Agar.io / Slither.io (Agar-style scale growth syncs cheaply; Slither-style body-segment trails are sync-heavy — caution)
  - MVP: 1 arena · grow-by-eating loop · 8+ players (bots to fill) · live leaderboard — Growth: skins → abilities/classes → team & timed modes → season ranking

### Adventure
- **Point-and-click adventure** — Medium · TileMap/RectTile · #map-search #item-combine #npc-dialog #story-presentation · [ref] The Secret of Monkey Island
  - MVP: 3 rooms · pick-up/combine items · one puzzle chain to the exit — Growth: chapters → inventory-puzzle depth → dialog NPCs → hint system
- **Escape room** — Low · TileMap/RectTile · #item-combine #clue-search #unlocking #story-presentation
  - MVP: 1 room · 4–5 linked puzzles · unlock the door to escape — Growth: themed rooms → mechanism variety → co-op mode → clear-time ranking
- **Maze exploration** — Low · RectTile · #inventory #pathfinding #limited-vision #enemy-avoidance · [ref] Pac-Man
  - MVP: 1 maze · limited vision · reach-the-exit + 1 chaser — Growth: maze generator → items/traps → floor progression → multiplayer race
- **Resource-gathering survival** — High · TileMap/RectTile · #resource-gathering #building #stamina-management #crafting #exploration · [MSW] Durango / [ref] Terraria, Don't Starve
  - MVP: 1 map · gather 2 resource types · 3 craft recipes · hunger + day/night — Growth: tech tree → base building → threats/seasons → multiplayer world
- **Visual novel** — Medium · RectTile · #story-presentation #branching-choices #multiple-endings #npc-affinity · [ref] Ace Attorney
  - MVP: 1 episode · text + portrait engine (dataset script) · 3 choices → 2 endings — Growth: episodes → affinity routes → CG/gallery unlocks → sound & presentation polish

### Casual & Arcade
- **Typing action** — Low · TileMap/RectTile · #text-input #enemy-kill #time-limit #rising-difficulty · [ref] The Typing of the Dead
  - MVP: 1 lane · word-tagged enemies (dataset) · type-to-kill · HP + speed ramp — Growth: word packs → enemy types → boss words → ranking
- **Fishing game** — Low · TileMap/RectTile · #gear-enhance #dex-collection #timing-input #rarity-system
  - MVP: 1 spot · timing-bar catch · 5 fish rarities · sell → rod upgrade — Growth: spots/biomes → gear tree → fish dex & records → seasonal events
- **Dodging (Dodge)** — Low · TileMap/RectTile · #obstacle-avoidance #survival-time #rising-difficulty #score-competition
  - MVP: 1 arena · falling/homing hazards · survival timer + best score — Growth: hazard patterns → characters/perks → stages → daily ranking
- **Merging/combining** — Low · RectTile · #dex-collection #item-merge #recipe-discovery #physics-reaction · [ref] Suika Game, Little Alchemy
  - MVP: 1 board · drop-and-merge one 5-tier chain · score + fail line — Growth: merge-tree depth → boosters → dex/quests → events
- **Match-3 puzzle** — Low · RectTile · #block-swap #match-3 #chain-reaction #special-blocks · [ref] Candy Crush, Anipang
  - MVP: 6×8 board · swap-match core · 20 dataset levels · move limit — Growth: blockers/special pieces → level packs → lives/boosters → events
- **Memory card matching** — Low · RectTile · #memory #pair-matching #turn-limit #rising-difficulty
  - MVP: 4×4 pair grid · turn limit · 10 stages — Growth: grid sizes → themes → versus mode → daily challenge
- **Number/deduction** — Low · RectTile · #logic-deduction #hint #grid-fill #attempt-limit · [ref] Wordle, Mastermind
  - MVP: one rule (Wordle-style) · daily answer dataset · shareable result — Growth: rule variants → difficulty tiers → streak/ranking → hint economy
- **Sliding puzzle** — Low · RectTile · #block-slide #merge #min-moves · [ref] 2048, 15-puzzle
  - MVP: 4×4 2048 board · merge scoring · best record — Growth: board variants → obstacles → daily challenge → skins
- **Falling-block puzzle** — Low · RectTile · #block-rotate #line-clear #rising-fall-speed #chain-reaction · [ref] Tetris, Puyo Puyo
  - MVP: 1 well · 7 pieces · line clear + speed ramp — Growth: modes (sprint/marathon) → versus garbage battle → ranking → skins
- **Gacha simulator** — Low · RectTile · #probability-sim #enhance-attempts #result-presentation #stats-logging · [ref] StarForce sim
  - MVP: 1 banner · rate table (dataset) · pull animation + history log — Growth: enhance/star systems → collection goals → leaderboards → parody events
- **Rhythm/music game** — Medium · TileMap/RectTile · #music-sync #note-timing #combo #accuracy · [ref] O2Jam
  - MVP: 1 song · 4-key notes from a dataset chart · judgement + combo — Growth: song/chart list → difficulties → note skins → accuracy ranking
- **Board/card game** — Medium · RectTile · #multiplayer #turn-based-flow #rule-based #win-condition · [ref] Blue Marble, One Card (chess/go need high AI difficulty — caution)
  - MVP: one ruleset · 2–4 players · turn flow + win check — Growth: rule variants → AI opponent → items/boards → ranking
- **O/X quiz / elimination** — Low · RectTile · #round-progression #ox-choice #many-players #elimination
  - MVP: O/X floor zones · question dataset · elimination rounds → last survivors — Growth: question packs → twist modes → rewards → live/event hosting
- **Endless runner** — Low · TileMap/SideView · #auto-run #obstacle-avoidance #coin-collection #rising-difficulty #score-competition · [ref] Cookie Run, Jetpack Joyride
  - MVP: auto-run 1 course · jump/slide inputs · coins + distance score — Growth: obstacle patterns → characters/pets → missions → seasonal maps
- **Classic arcade remake** — Low · RectTile · #physics-reaction #score-competition #rising-difficulty #chain-reaction · [ref] Breakout, Snake, Pong
  - MVP: one classic loop (e.g., Breakout) on 1 screen · lives + score — Growth: level packs → modifiers/power-ups → 2P versus → remix mechanics

### Simulation
- **Gathering/mining sim** — Medium · TileMap/SideView · #gear-enhance #resource-gathering #stamina-management #depth-exploration · [MSW] Miner Simulator
  - MVP: 1 vertical mine · pickaxe tiers 1–3 · ore → sell → upgrade loop — Growth: depth layers → auto tools/helpers → quotas & quests → prestige reset
- **Management tycoon** — Medium · RectTile · #upgrade #revenue-management #customer-service #menu-product-management · [MSW] ChuChu Burger Branch 1
  - MVP: 1 shop · 1 product line · buy → serve → profit → upgrade loop — Growth: menu/staff → interior & expansion → branches → VIP/events
- **Housing/interior** — Medium · RectTile · #inventory #object-placement #free-placement #housing · [MSW] Maple Toytown / [ref] Animal Crossing
  - MVP: 1 room · ~20 furniture items · place/rotate + save (DataStorage) — Growth: item catalog → more rooms/lot → visits & likes → gifting/trade
- **Dress-up/styling** — Medium · RectTile · #inventory #item-combine #theme-mission #outfit-rating · [ref] Love Nikki
  - MVP: ~20-item closet · one theme mission · save the look — Growth: wardrobe expansion → rating/contests → gacha closet → social showcase
- **Farming/ranch** — High · RectTile · #crop-farming #animal-husbandry #time-passage #season-system · [ref] Stardew Valley
  - MVP: 1 field · 3 crops · plant → timed growth → harvest → sell — Growth: animals → seasons → processing/recipes → town requests & relationships
- **Life simulation** — High · RectTile · #npc-affinity #daily-activities #relationship-system #open-endedness · [ref] Animal Crossing, The Sims
  - MVP: 1 town map · day cycle · 3 NPCs with affinity · 2 daily activities — Growth: NPC depth/events → jobs/hobbies → housing → festivals
- **Pet raising** — Low · RectTile · #creature-raising #stamina-management #daily-activities #evolution · [ref] Tamagotchi, Pou
  - MVP: 1 pet · feed/play/clean meters · growth stages over real time — Growth: species & evolution branches → care minigames → room decor → breeding
- **Kitchen co-op action** — Medium · RectTile · #multiplayer-co-op #customer-service #time-limit #role-split · [ref] Overcooked
  - MVP: 1 kitchen · 3 recipes · order timer · 2P co-op serving loop — Growth: recipes/stations → stage gimmicks → 4P chaos → star ratings

### Strategy
- **Auto-battler** — Medium · TileMap/RectTile · #round-progression #auto-combat #unit-composition #synergy-combos · [ref] Auto Chess
  - MVP: 1 board · 8 units in 3 cost tiers · rounds vs AI waves · gold/reroll economy — Growth: synergy traits → 4–8P PvP → items → rotating sets
- **Card strategy/battle** — High · RectTile · #turn-based-combat #card-collection #deckbuilding #mana-management · [MSW] Maple Duel / [ref] Hearthstone
  - MVP: ~20-card pool · 1v1 vs AI · mana + attack/defense rules — Growth: card sets → PvP → classes/archetypes → ranked & drafts
- **Turn-based artillery** — Medium · TileMap/SideView · #angle-adjust #power-adjust #wind-variable #terrain-destruction · [ref] Fortress, Gunbound, Worms
  - MVP: 1 terrain · angle + power shot · wind · 2P hotseat or vs AI — Growth: weapon variety → destructible terrain depth → items/buffs → team modes
- **Resource-management strategy** — High · RectTile · #resource-allocation #tech-tree #territory-expansion #ai-opponent · [ref] Civilization
  - MVP: 1 small map · 2 resources · build 3 structure types · one win condition — Growth: tech tree → smarter AI opponent → map generation → factions
- **Grid tactics (SRPG)** — Medium · RectTile · #turn-based-combat #turn-based-movement #unit-composition #role-split · [ref] Fire Emblem, Into the Breach
  - MVP: one grid battle · 3 units vs 3 · move + attack turn order · terrain blocks — Growth: campaign missions → classes/skills → terrain effects → permadeath/hard modes

### Social
- **Party mini-games** — Medium · RectTile · #round-progression #random-game #many-player-competition #elimination · [ref] Mario Party, Fall Guys
  - MVP: 3 minigames · lobby rotation · cumulative score across rounds — Growth: minigame pool → items/interference → team modes → season ranking
- **Hide-and-seek/chase** — High · TileMap/RectTile · #it-tagging #stealth #real-time-chase #map-search · [ref] Prop Hunt, Red Light Green Light
  - MVP: 1 map · seeker vs hiders · round timer + tag-out — Growth: maps → roles/skills → prop-disguise mode → ranking
- **Social deduction** — High · RectTile · #social-deduction #many-players #elimination #map-search · [ref] Among Us, Mafia
  - MVP: 1 base map · crew vs 1 impostor · simple tasks · meeting + vote-out — Growth: role variety → maps/tasks → sabotage depth → ranked lobbies
- **Hangout/role-play world** — Low · TileMap/RectTile · #many-players #housing #daily-activities #outfit-rating · [ref] Habbo, ZEP
  - MVP: 1 themed lounge map · chat + emotes · seats & photo spots — Growth: zones/activities → personal rooms & shops → scheduled events → creator/staff roles

### Education
- **Quiz game** — Low · RectTile · #question-serving #answer-checking #score-competition #time-limit · [MSW] QPlay Archive
  - MVP: ~50-question dataset · 4-choice answering · score + timer — Growth: categories → modes (speed/battle) → ranking → user-submitted packs
- **Typing practice** — Low · RectTile · #text-input #wpm-measure #accuracy-check #rising-difficulty
  - MVP: sentence dataset · WPM + accuracy result screen — Growth: courses/lessons → tests & records → race mode → stat tracking
- **Word battle** — Low · RectTile · #text-input #answer-checking #many-player-competition #time-limit · [ref] Kkutu (Korean word-chain) (dictionary = a curated dataset subset, not a full national dictionary — caution)
  - MVP: word-chain 1v1 · dictionary dataset · turn timer + lives — Growth: modes (theme/speed) → many-player rooms → ranking → item twists

### Defense
- **Side-view wave defense** — Medium · TileMap/SideView · #wave-progression #real-time-combat #skill-use #rising-difficulty · [ref] Orcs Must Die
  - MVP: 1 lane · base HP · 5 waves · 1 hero with a skill — Growth: units/skills → wave & boss variety → maps → endless mode
- **Tower defense** — Medium · RectTile · #wave-progression #unit-enhance #resource-management #unit-placement #path-based · [MSW] Maple Random Defense / [ref] Kingdom Rush (**top of comfortably-solo**)
  - MVP: 1 map · 1 path · 3 tower types · 5 waves · leak = lose — Growth: tower tiers/synergies → new maps → heroes/abilities → endless & ranking
- **Base defense** — Medium · TileMap/RectTile · #wave-progression #object-placement #base-hp #omnidirectional-defense · [ref] Dungeon Defenders
  - MVP: 1 base · omnidirectional 5 waves · place walls/turrets between waves — Growth: buildable variety → enemy types → tech upgrades → co-op
- **Random defense** — Medium · RectTile · #wave-progression #random-draw #unit-merge #unit-placement · [ref] Random Dice
  - MVP: 1 board · random unit draw · merge same-kind to upgrade · shared waves — Growth: unit pool/grades → synergies → PvP race mode → seasons

### Shooter
- **Shoot-'em-up** — Low · TileMap/SideView · #projectile #enemy-patterns #power-up #score-competition #boss-fight · [ref] Galaga, 1945
  - MVP: 1 scrolling stage · 1 ship · 3 enemy patterns + 1 boss · score — Growth: stage list → power-ups/bombs → bullet-pattern depth → 2P mode

### Sports & Racing
- **Sports game** — Medium · TileMap/RectTile · #rule-based #score-competition #real-time-pvp #turn-based-flow · [ref] heading soccer
  - MVP: 1 court · 1v1 (vs AI ok) · minimal rules + score to win — Growth: teams → skills/stats → tournaments → ranking
- **Racing/running** — Medium · TileMap/RectTile · #async-pvp #speed-competition #track-design #score-competition · [ref] KartRider
  - MVP: 1 track · 2–4 racers · lap timer + finish order — Growth: track list → items (kart-style) → vehicles/tuning → ghost records & ranking

### Platformer
- **Obstacle run (obby)** — Low · TileMap/SideView · #stage-clear #timing-jump #moving-obstacles #rising-difficulty · [MSW] Maple Luck Run / [ref] Geometry Dash
  - MVP: ~10 obstacle sections · checkpoints · clear timer — Growth: stages/themes → moving gimmicks → race mode → records
- **Hardcore climbing** — Low · TileMap · #physics-movement #special-controls #fall-reset #extreme-difficulty · [MSW] Jar Game Returns / [ref] Getting Over It
  - MVP: 1 tall map · one special control scheme · fall-reset · height record — Growth: taller/harder routes → new control twists → ranking → spectate/replay
- **Jump quest (jumpquest)** — Low · TileMap · #precision-jump #fall-penalty #patience-repetition · [ref] Forest of Patience
  - MVP: 1 course · precision jumps · fall penalty · goal reward — Growth: course list → themes → clear records → hard variants

### Metroidvania
- **Metroidvania** — High · TileMap/SideView · #ability-unlock #backtracking #exploration #boss-fight · [ref] Hollow Knight, Ori
  - MVP: 3 connected rooms · 1 ability gate (e.g., double jump) · 1 boss — Growth: map regions → ability set → bosses → secrets/completion

### Roguelite
- **Run-based roguelite** — Medium · TileMap/RectTile · #run-repetition #random-skills #permanent-upgrade #boss-fight #build-variety · [ref] Hades, Dead Cells
  - MVP: 3-room run · random skill offer per room · death = restart + 1 meta upgrade — Growth: room/skill pool → characters → meta tree → bosses/acts
- **Deckbuilding roguelike** — High · RectTile · #run-repetition #path-choice #turn-based-combat #card-acquire #deck-construction · [ref] Slay the Spire
  - MVP: 10-card starter · 8-node path · add/remove cards · 1 act boss — Growth: card pool → relics/events → acts → ascension levels
- **Dungeon roguelike** — Medium · TileMap/RectTile · #floor-progression #procedural-generation #permanent-upgrade #item-combine #death-reset · [ref] The Binding of Isaac, Rogue Legacy
  - MVP: 3 procedural floors · permadeath · 5 items — Growth: floor themes → item synergies → classes → daily seed runs

### Idle
- **Idle RPG** — Medium · TileMap/RectTile · #auto-combat #prestige #offline-rewards #hero-hiring · [ref] Tap Titans
  - MVP: auto-battle stage line · gold → stat upgrades · offline gains — Growth: heroes/skills → prestige loop → dungeons/raids → events
- **Clicker/idle** — Low · RectTile · #upgrade #prestige #click #auto-accumulate · [ref] Cookie Clicker
  - MVP: click → currency · 5 upgrades · 1 auto-generator — Growth: generator chain → prestige → achievements → events

### Horror
- **Story horror** — Medium · TileMap/RectTile · #story-presentation #branching-choices #clue-search #unlocking · [ref] The Witch's House, Ib
  - MVP: 1 house · limited vision/flashlight · 3 scare events · one escape route — Growth: chapters → chase sequences → endings → lore collectibles
- **Horror escape** — Medium · TileMap/RectTile · #real-time-chase #clue-search #unlocking #stamina-management · [ref] Granny, Ao Oni
  - MVP: 1 map · 1 chaser AI · find 3 keys to exit — Growth: maps/chasers → co-op → difficulty tiers → randomized item spots

> **Low-effort picks (good first projects)**: Dodging · Falling-block puzzle · Match-3 · Jump quest · Obstacle run · Gacha sim · Vampire-survivors-like · Shoot-'em-up · Endless runner · Classic arcade remake · Pet raising · Hangout world · Word battle. (Tower defense is the natural next step up — Medium, the top of comfortably-solo.)

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

**Social/multi**: `#party-play` `#multiplayer-co-op` `#role-split` (tank/dps/heal) `#multiplayer` `#many-player-competition` `#many-players` `#it-tagging` `#social-deduction` (hidden roles · discussion · vote-out) `#customer-service` `#npc-dialog` `#npc-affinity`

**Decoration/appearance**: `#housing` `#theme-mission` `#outfit-rating`

**Misc (commonly used)**: `#time-limit` `#attempt-limit` `#turn-limit` `#rising-difficulty` `#score-competition` `#extreme-difficulty` `#patience-repetition` `#speed-competition` `#path-based` (enemies on a set path) `#pathfinding` `#limited-vision` `#stealth` `#map-search` `#exploration` `#ability-unlock` `#backtracking` `#enemy-avoidance` `#omnidirectional-defense` `#story-presentation` `#real-time-chase` `#multi-map` `#branching-choices` `#multiple-endings` `#quest-progression` `#turn-based-movement` `#fast-combat` `#rarity-system` (common/rare/legendary) `#hero-hiring` `#crafting` `#depth-exploration` `#season-system` `#time-passage` `#daily-activities` `#relationship-system` `#open-endedness` `#rule-based` `#win-condition` `#timing-input` `#memory` `#pair-matching` `#enemy-kill` `#track-design` `#menu-product-management` `#animal-husbandry` `#crop-farming` `#recipe-discovery` `#physics-reaction` `#enhance-attempts` `#result-presentation` `#stats-logging` `#click` `#auto-accumulate` `#offline-rewards` `#tech-tree` `#territory-expansion` `#ai-opponent` `#build-variety` `#monster-capture` `#creature-raising` `#skill-combination` `#boss-fight` `#consecutive-battles` `#dungeon-exploration`
