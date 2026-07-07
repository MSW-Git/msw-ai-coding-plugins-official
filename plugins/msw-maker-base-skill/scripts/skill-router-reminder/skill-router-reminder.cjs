#!/usr/bin/env node
'use strict';

// MSW Skill Router Reminder Hook
// Runs on every UserPromptSubmit: at the start of each turn, injects a strong
// reminder via stdout (delivered as a system message) telling the agent to
// "re-classify this message against the domain matrix, and even if other
// skills are already loaded, if a new domain matches you MUST load the
// additional skill."
//
// Core principles:
// - SKILL.md (the skill body) is ALWAYS loaded via the agent's skill system.
//   The skill files live in the agent's skill directory (not in the workspace's
//   plugins/ folder), so use the skill-loading mechanism provided by your agent.
// - For references/*.md: after SKILL.md is loaded, use the absolute path shown
//   in the result (or the relative link inside SKILL.md) and read the whole
//   file in one shot with the Read tool.
//
// This hook also forcibly breaks the following two inertias every turn:
// 1) The inertia of "the skill body is already in context, so I don't need
//    to load additional skills."
// 2) The inertia of "I loaded SKILL.md, so references/*.md can be skipped"
//    (the past UI-incident pattern).
//
// Auto-registered via the plugin's hooks/hooks.json — no manual setup needed.

const fs = require('fs');

function readInput() {
  try {
    const raw = fs.readFileSync(0, 'utf8').trim();
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

readInput();

process.stdout.write(
  `<msw-skill-router-reminder>\n` +
  `This is a NEW user message. Re-classify it against the MSW skill domain matrix BELOW,\n` +
  `even if msw-general or another MSW skill is already loaded in this session.\n` +
  `Already-loaded skills do NOT exempt you from loading additional skills when a new\n` +
  `domain emerges. The relevant skill must be LOADED (not recalled from memory) BEFORE\n` +
  `you plan or implement.\n` +
  `\n` +
  `=== HOW TO LOAD AND READ A SKILL (HARD RULES — violating these means you have NOT loaded the skill) ===\n` +
  `R1. Load every SKILL.md via the agent's **skill-loading system**.\n` +
  `    Use whichever mechanism your agent provides:\n` +
  `      - Claude Code  → 'Skill' tool with identifier '<name>'\n` +
  `      - Cursor       → the skill is auto-discovered under the agent skills directory;\n` +
  `                        load it via the /skill command or Read from the path shown in agent_skills\n` +
  `      - Codex        → Read from the skills directory (e.g. .codex/skills/<name>/SKILL.md)\n` +
  `      - Copilot      → auto-discovered under .github/skills/ or ~/.copilot/skills/\n` +
  `    Do NOT pass 'plugins/msw-maker-base-skill/skills/...' to Read, ls, Glob, or Grep.\n` +
  `    The skill files live in the agent's skill directory, not in the workspace's 'plugins/' folder.\n` +
  `R2. Read 'references/*.md' files in full via the **Read** tool, using paths\n` +
  `    derived from the loaded skill. The loaded SKILL.md exposes the skill's absolute\n` +
  `    folder; combine that with the relative reference link shown in SKILL.md\n` +
  `    (e.g. 'references/component-api.md') and issue ONE full Read call.\n` +
  `    NEVER use shell commands ('cat', 'head', 'tail', 'less', 'more', 'type',\n` +
  `    'Get-Content' / 'gc', or pipes like 'cat ... | head -N') to read any skill or\n` +
  `    reference .md file — they routinely show only a prefix and skip the parts that\n` +
  `    actually answer the request.\n` +
  `R3. Read each reference IN FULL in a single Read call. Do NOT pass 'offset' or 'limit'.\n` +
  `    SKILL.md and reference .md files are sized to be read whole; partial reads\n` +
  `    (e.g. only the first 80–150 lines) routinely miss the section you need.\n` +
  `R4. **Loading SKILL.md alone is NOT "skill loaded"** when references/*.md siblings exist\n` +
  `    (combat / scripting / general / search all have them). After SKILL.md is loaded:\n` +
  `      (a) scan SKILL.md for links to 'references/*.md' AND inspect its 'Per-task routing' /\n` +
  `          'Reference Documents' / 'Cross-references' sections,\n` +
  `      (b) for every reference whose topic intersects with THIS turn's request, Read it\n` +
  `          IN FULL via the Read tool (rules R2–R3) BEFORE planning,\n` +
  `      (c) the per-trigger reference enumeration BELOW (under each domain) is authoritative\n` +
  `          — if a trigger fires, the listed reference is required, not optional.\n` +
  `R5. Self-correction. If you catch yourself about to:\n` +
  `      - call Read('plugins/msw-maker-base-skill/...') or any other path under workspace-local 'plugins/',\n` +
  `      - run ls / Glob / Grep to locate '**/SKILL.md', '**/msw-maker-base-skill/**',\n` +
  `        or similar plugin files,\n` +
  `      - use shell commands to read a skill/reference file, or pass 'offset'/'limit' to Read,\n` +
  `    STOP. The skill is NOT in the workspace 'plugins/' folder. Re-load it via the\n` +
  `      agent's skill system (R1), or Read the reference using the absolute path\n` +
  `      provided by the loaded skill.\n` +
  `R6. **Foundation Skills + Foundation references — ALWAYS load/read on EVERY turn (you do NOT know MSW).**\n` +
  `    Generic LLM knowledge of "Galaga / Mario / Bomberman / dungeon RPG / boss fight / side-scrolling platformer / top-down / popup UI / Entity-Component"\n` +
  `    matches MSW only superficially. The actual silent-failure zones diverge:\n` +
  `      - Wrong TileMapMode ↔ Body mapping → no error, just doesn't move (or [LEA-3004])\n` +
  `      - Coordinates are in world units (1 unit = 100 px) — using raw pixel values is off by 100x\n` +
  `      - SpriteRUID = "" → no error, just invisible on screen\n` +
  `      - Missing .mlua + .codeblock pair, or no Maker refresh → not even registered\n` +
  `      - Only RootDesk/ is scanned by Maker; Global/ is read-only\n` +
  `      - SpawnByModelId(parent=nil) → runtime error\n` +
  `      - _LocalizationService is ClientOnly (returns nil if called on server)\n` +
  `      - MovementComponent.InputSpeed conversion differs by map type (×1 / ÷1.2 / ×1.5)\n` +
  `      - .ui must go through the builder (raw JSON editing is forbidden)\n` +
  `\n` +
  `    Therefore the following two layers are MSW's "rules of physics" — both REQUIRED before\n` +
  `    Plan on EVERY turn, REGARDLESS of which domain triggers fire:\n` +
  `\n` +
  `    (a) **Foundation Skills (2)** — load via the agent's skill system (R1), in this order:\n` +
  `        1. msw-general\n` +
  `             foundation — workspace structure, platform rules, MCP tools, authoring rules for\n` +
  `             .model/.map/.ui/.dataset, and the verified template catalog. Every other MSW skill\n` +
  `             assumes this one is already loaded.\n` +
  `        2. msw-ui-system\n` +
  `             The single entry point for UI — score/HP/lives HUD, popups, toasts, menus, tabs, dialogs, etc.\n` +
  `             An MSW world with zero UI is virtually nonexistent — even a simple "Galaga"-style mini-game\n` +
  `             needs a score/lives HUD, so planning without UI-system knowledge breaks on the very first screen.\n` +
  `             The rule "no raw .ui JSON editing → must go through the builder" lives only in this skill.\n` +
  `        ※ Do NOT reason that "this task has no UI, so I can skip (2)."\n` +
  `          The Galaga case (missing score HUD) was exactly that anti-pattern.\n` +
  `        ※ msw-packages (standard game-system catalog: inventory / shop / ranking / mail / quest /\n` +
  `          collection / key binding / GM / drop table, etc.) is NOT Foundation — it is domain-triggered\n` +
  `          (see [PACKAGES] in the matrix below). Load it via the Domain matrix the moment the user request\n` +
  `          matches a catalog keyword, BEFORE suggesting a from-scratch implementation.\n` +
  `\n` +
  `    (b) **Foundation references (4)** — immediately after (a) is loaded, Read in FULL every turn, unconditionally:\n` +
  `        • msw-general/references/platform.md (core)\n` +
  `             8 core / TileMapMode↔Body / LEA-3004 / coordinate system / SortingLayer / SpriteRUID /\n` +
  `             SpawnByModelId / .directory / .config / CoreVersion — every other reference is\n` +
  `             written assuming you already know this.\n` +
  `        • msw-general/references/workspace.md\n` +
  `             World instance / Room / DataStorage / folder layout / entering & leaving Play mode / refresh cycle /\n` +
  `             mid-workflow failure recovery — **the operational rules for how an edit is reflected and where it is verified**.\n` +
  `             Without this, "the code is correct but it doesn't show up in Maker"-class incidents repeat every task.\n` +
  `        • msw-general/references/entity.md\n` +
  `             Entity Work Preflight (Absolute Principle #0). Almost every MSW task creates, places,\n` +
  `             spawns, or scripts an entity in some way. inline @components vs modelId instances, snapshot,\n` +
  `             RUID and coordinate rules.\n` +
  `        • msw-general/references/authoring.md\n` +
  `             Schema-consistency and hand-edit risks common to all 5 file types\n` +
  `             (.mlua / .model / .map / .ui / .userdataset / .config) — fires whenever any of them is touched.\n` +
  `\n` +
  `    Once MapComponent.TileMapMode is identified, the matching ONE of:\n` +
  `      • msw-general/references/platform-maple.md   (TileMapMode = 0)\n` +
  `      • msw-general/references/platform-rect.md    (TileMapMode = 1)\n` +
  `      • msw-general/references/platform-sideview.md (TileMapMode = 2)\n` +
  `    is also Foundation. If you see debugging / silent-failure symptoms, read troubleshooting.md immediately as well.\n` +
  `\n` +
  `    Skipping any single Foundation Skill (2) or any single Foundation reference (4) =\n` +
  `    "skill NOT loaded" — even when no domain sub-trigger fires.\n` +
  `    "It's a trivial task so it's fine" is NOT a valid excuse — even a single-line .mlua edit touches\n` +
  `    the .mlua+.codeblock pair + RootDesk/ rules, and even a simple coordinate tweak touches\n` +
  `    world units + SortingLayer.\n` +
  `\n` +
  `    Self-check BEFORE Plan — if you cannot answer the following 7 questions from MSW reference text\n` +
  `    actually Read this turn, STOP and Read the matching references first:\n` +
  `      1. What is the target map's TileMapMode as a number?\n` +
  `      2. What Body component does that map's dynamic entities require?\n` +
  `      3. PC 12.8x7.2 / Mobile 9.6x5.4 world units — which one, and how were the coordinates derived?\n` +
  `      4. Where does each of .mlua / .model / .map / .ui go, and what pairing is required?\n` +
  `      5. What happens if SpriteRUID = "", and how do you find the real RUID?\n` +
  `      6. What do you pass as 'parent' in SpawnByModelId(... , parent)?\n` +
  `      7. What procedure (refresh / entering & leaving Play mode / DataStorage location) is needed for Maker\n` +
  `         to recognize this change, and where do you recover from if mid-workflow breaks? (workspace.md)\n` +
  `    If you cannot tell whether the answer comes from generic LLM knowledge or from a reference loaded this turn,\n` +
  `    that means the latter has not actually been loaded yet.\n` +
  `\n` +
  `    Anti-pattern (must NOT do):\n` +
  `      X "I know genres like Galaga / Mario / Bomberman / RPG, so I'll start planning from generic game-design intuition"\n` +
  `         → Recognizing the genre is only a hint for matching platform-{type}.md; planning without references breaks on the first Edit.\n` +
  `      X "This task has no explicit UI, so I can skip msw-ui-system"\n` +
  `         → Side UI like score HUD / toasts / menus accompanies almost every game. Load it every turn, unconditionally.\n` +
  `      X "The user asked for inventory / shop / ranking — let me just write it from scratch"\n` +
  `         → [PACKAGES] trigger fires. Load msw-packages and check the catalog FIRST; a prebuilt package may eliminate the work entirely.\n` +
  `\n` +
  `R7. Cross-platform tool selection — never use the shell for workspace exploration; use tools only.\n` +
  `    Windows (PowerShell / Git Bash) and macOS (bash / zsh) are not compatible in shell command\n` +
  `    or path handling. In particular, in bash, an absolute path with backslashes like\n` +
  `    'D:\\\\path\\\\foo' is interpreted with '\\\\' as an escape and collapses to 'D:pathfoo'.\n` +
  `    For workspace file/folder exploration, reading, and searching, use OS-agnostic tools only:\n` +
  `      - List/check folders & files       → Glob('RootDesk/MyDesk/**/*.mlua'), Glob('map/*')\n` +
  `      - Read file contents               → Read('RootDesk/MyDesk/Foo.mlua')  (use MapBuilder.read for .map)\n` +
  `      - Search contents                  → Grep('@Logic', glob: '*.mlua')\n` +
  `      - Find files by name               → Glob('**/PlayerController.mlua')\n` +
  `    The following shell commands are FORBIDDEN for workspace exploration:\n` +
  `      ls, dir, Get-ChildItem, gci, cat, type, Get-Content, gc, head, tail, more, less,\n` +
  `      find, where, grep, findstr, Select-String, sls, rg/ripgrep (called directly).\n` +
  `    The shell tool (Bash/Shell) is reserved for actual shell programs (git, npm, pnpm, MCP, build); even then:\n` +
  `      (a) prefer workspace-relative paths ('RootDesk/MyDesk/Foo.mlua'),\n` +
  `      (b) if an absolute path is unavoidable, use forward slashes + double quotes\n` +
  `          (e.g. \"D:/msw-world-projects/.../map/\" — never the 'D:\\\\...' form),\n` +
  `      (c) use POSIX commands only (ls/mv/cp/rm); Windows-only ones (dir/Get-ChildItem/type) are forbidden.\n` +
  `    Warning sign — if you see an error like \"ls: cannot access 'D:msw-...': No such file or directory\",\n` +
  `    stop immediately and retry the same operation with Glob/Read/Grep.\n` +
  `\n` +
  `Domain matrix (Korean / English trigger phrases → skill to LOAD + references to READ in full).\n` +
  `**This matrix sits ON TOP of the 2 Foundation Skills (R6 (a)) and 4 Foundation references (R6 (b))** —\n` +
  `Foundation is loaded EVERY turn unconditionally; the matrix below adds further skills/references when triggered.\n` +
  `When multiple sub-triggers fire under one domain, LOAD the skill AND READ every matching reference.\n` +
  `\n` +
  `[SCRIPTING] script / mlua / component / event / logic / lifecycle / Component / @Logic / @Event\n` +
  `  → Load skill: msw-scripting\n` +
  `  Sub-trigger refinements (read in ADDITION to SKILL.md):\n` +
  `  - DataStorage / save / persist / player data / _DataStorageService\n` +
  `      → Read: references/datastorage.md\n` +
  `  - Verify step / "make sure it works" (ALWAYS required for the Verify todo, every implementation turn)\n` +
  `      → Read: references/verify-checklist.md\n` +
  `\n` +
  `[UI] popup / HUD / button / toast / menu / tab / layout / screen / .ui / popup / button / UI\n` +
  `  → msw-general + msw-ui-system are already loaded every turn as Foundations (R6 / Decision rule 1).\n` +
  `    For UI tasks, additionally:\n` +
  `    a) Read the matching msw-ui-system references in full per its routing table\n` +
  `       (ui-fundamentals/ui-hierarchy/component-guide/component-api/layout-recipes/\n` +
  `        resolution-platform/runtime-patterns/builder-protocol as topic requires).\n` +
  `    b) For style templates: Read references/templates/templates.md and the chosen\n` +
  `       references/templates/style-N-*/{ruid-map.md, structure.md, Popupbutton.mlua}\n` +
  `       files in full.\n` +
  `  Sub-trigger refinements (read in ADDITION when topic matches):\n` +
  `  - Component properties / SpriteGUIRenderer / TextGUIRenderer / TextComponent / ButtonComponent full API\n` +
  `      → Read: references/component-api.md\n` +
  `  - enum / AlignmentOption / ImageType / Transition / Alignment value tables\n` +
  `      → Read: references/component-api.md §Enums\n` +
  `  - Runtime patterns / toast / popup fade / HP bar / tabs / drag-and-drop (copy-paste lua)\n` +
  `      → Read: references/runtime-patterns.md\n` +
  `\n` +
  `[ENTITY/MAP] entity placement / .map / spawn / SpawnByModelId / position / coordinate / transform / map editing\n` +
  `  → Load skill: msw-general\n` +
  `  + Read: references/entity.md (Entity Work Preflight — MUST, Absolute Principle #0)\n` +
  `  Sub-trigger refinements:\n` +
  `  - .map builder / entity placement / component patching\n` +
  `      → Read: references/entity.md (MapBuilder Protocol)\n` +
  `\n` +
  `[MODEL] .model / model authoring / template / EntryKey / Properties / Values / model catalog\n` +
  `  → Load skill: msw-general\n` +
  `  + Read: references/model.md\n` +
  `  Sub-trigger refinements:\n` +
  `  - .model JSON schema / serialization format details\n` +
  `      → Read: references/model/model-schema.md\n` +
  `  - Monster .model (lowercase ActionSheet / IsLegacy / SortingLayer / canonical 11 components)\n` +
  `      → Read: references/monster.md\n` +
  `\n` +
  `[PLATFORM/TILE] TileMapMode / Body / sideview / topdown / gravity / SortingLayer / SpriteRUID / 8 core / CoreVersion / spawn / SpawnByModelId / MovementComponent / InputSpeed / coordinates / visible screen range / .directory\n` +
  `  → Load skill: msw-general\n` +
  `  + Read: references/platform.md (core — common to all map types: 8 core, TileMapMode↔Body mapping, LEA-3004, coordinate system, RUID, spawn, ID, .config)\n` +
  `  Sub-trigger refinements (the SKILL.md only carries summary; the full implementation lives in these references — read in ADDITION when topic matches):\n` +
  `  - MapleTile (TileMapMode = 0) work — Foothold / Gravity / WalkSpeed / WalkJump / PredictFootholdEnd / IsOnGround / DownJump / FootholdEnter·LeaveEvent / Maple-style side-scroller\n` +
  `      → Read: references/platform-maple.md (full)\n` +
  `  - RectTile (TileMapMode = 1) work — KinematicbodyComponent / SpeedFactor / 4-direction free movement / visual-only jump / Movable tile / ToCellPosition / RectTileEnter·LeaveEvent / dynamic tiles (SetTile/BoxFill) / top-down RPG / Bomberman\n` +
  `      → Read: references/platform-rect.md (full)\n` +
  `  - SideViewRectTile (TileMapMode = 2) work — SideviewbodyComponent / JumpSpeed / JumpDrag / EnableDownJump / wall detection (RectTileCollisionBeginEvent + Normal) / GetUnderfootTile / Mario-style pixel action\n` +
  `      → Read: references/platform-sideview.md (full)\n` +
  `  - Symptom debugging — logs show [LEA-3004] / "doesn't move" / "invisible" / "floating" / "stuck on wall" / "out of map" / "falling off foothold edge" / "off by 100x" / "not visible in Maker" / "only client-side sync"\n` +
  `      → Read: references/troubleshooting.md (full) — symptom→cause→solution unified index\n` +
  `  - Tile painting / tilemap / RectTileMap / FootholdComponent / editing Movable·Collision properties\n` +
  `      → Read: references/tile.md\n` +
  `\n` +
  `[DATASET/I18N] DataSet / userdataset / .csv / localize / i18n / translation / LocaleDataSet / _LocalizationService\n` +
  `  → Load skill: msw-general\n` +
  `  + Read: references/dataset.md\n` +
  `\n` +
  `[MCP/WORKSPACE] MCP tool calls / refresh / play / stop / logs / screenshot / Room / DataStorage location / mode switching\n` +
  `  → Load skill: msw-general\n` +
  `  + Read: references/workspace.md\n` +
  `\n` +
  `[AUTHORING] file-authoring principles / common schema / direct-edit risks\n` +
  `  → Load skill: msw-general\n` +
  `  + Read: references/authoring.md\n` +
  `\n` +
  `[AVATAR] avatar / costume / equipment / outfit / animation / attack motion / costume / avatar / state / action\n` +
  `  → Load skill: msw-avatar (no references/ siblings)\n` +
  `\n` +
  `[DEFAULTPLAYER] DefaultPlayer / player / jump / move speed / HP / camera / respawn / jump / camera / respawn\n` +
  `  → Load skill: msw-defaultplayer (no references/ siblings)\n` +
  `\n` +
  `[COMBAT] attack / hit / damage / monster combat / critical / knockback / hit effect / attack / hit / damage / combat / monster\n` +
  `  → Load skill: msw-combat-system\n` +
  `  Sub-trigger refinements (the SKILL.md covers concepts + API tables only — full implementation\n` +
  `  for each sub-topic lives in the matching reference below; loading SKILL.md alone is NOT enough\n` +
  `  when a sub-trigger fires):\n` +
  `  - Monster .model assembly / ActionSheet / attaching MonsterAI / combat-capable monster setup\n` +
  `      → Read: ../msw-general/references/monster.md  (consolidated — Pattern A Soldier canonical + Pattern B MonsterCanonical)\n` +
  `  - HP gauge / health bar / overhead HP / PixelRendererComponent\n` +
  `      → Read: references/hp-gauge.md\n` +
  `  - Projectile / arrow / bullet / magic missile / homing / piercing / splash / OnUpdate Translate\n` +
  `      → Read: references/projectile.md\n` +
  `  - FSM / StateComponent / @State / state machine / IDLE/HIT/DEAD / boss phases\n` +
  `      → Read: ../msw-general/references/animation-state.md (state-machine + animation pipeline unified)\n` +
  `  - BT / BehaviourTree / Behavior Tree / AIComponent / @BTNode / Composite / Decorator / Threat\n` +
  `      → Read: references/ai-bt.md\n` +
  `\n` +
  `[SEARCH] sprite / animation resource / sound / RUID / resource search / API example search / sprite / sound / find\n` +
  `  → Load skill: msw-search\n` +
  `  Sub-trigger refinements (the SKILL.md's own routing tables map each query type to a specific\n` +
  `  references/resource/*.md — follow them):\n` +
  `  - searchResources / searchAvatarItems / findSimilarResources / resource_pack·sprite·animationclip·sound·avataritem search\n` +
  `      → Read: references/resource/search.md\n` +
  `  - getResource / RUID details / detail\n` +
  `      → Read: references/resource/detail.md\n` +
  `  - listResources / findPacksContaining / catalog browsing\n` +
  `      → Read: references/resource/browse.md\n` +
  `  - listAvatars / avatar catalog browsing\n` +
  `      → Read: references/resource/avatar.md\n` +
  `\n` +
  `[PACKAGES] inventory / shop / ranking / mail / quest / collection / key binding / GM / slash command / inventory / shop / ranking / mail / quest\n` +
  `  → Load skill: msw-packages\n` +
  `    Once loaded, consult the catalog in SKILL.md to check whether a matching package exists —\n` +
  `    if so, stop writing from scratch and switch to the package path. (no references/ siblings;\n` +
  `    each catalog package's README is fetched on demand from GitHub.)\n` +
  `    Note: msw-packages is NOT Foundation (it is domain-triggered) — load it only when this\n` +
  `    domain fires, not every turn.\n` +
  `\n` +
  `[PLANNING] plan a new game / new game / what to build / MVP scope / GDD / game design / scope an MVP / what game should I make\n` +
  `  → Load skill: msw-planning\n` +
  `    Plan a brand-new game from scratch: guided questions → genre-catalog grounding (3 map types · ~150 mechanics · solo-dev MVP feasibility)\n` +
  `    → nail down map-type↔Body → produce GDD/roadmap. Always pass the 'direction check' gate before writing the GDD.\n` +
  `    Read: references/genre-catalog.md (grounding) · references/gdd-template.md (output structure · per-phase detail) ·\n` +
  `          references/msw-mapping.md (system↔MSW mapping).\n` +
  `    Note: msw-planning is NOT Foundation (domain-triggered) — load it only when this domain fires.\n` +
  `\n` +
  `Notation in this matrix:\n` +
  `- 'Load skill: <name>' = load the skill's SKILL.md via your agent's skill system (see R1).\n` +
  `  The skill files live in the agent's skill directory — never pass a 'plugins/...' path.\n` +
  `- 'Read: references/<file>.md' = once the skill is loaded, Read the file at\n` +
  `  <skill_folder>/references/<file>.md. The skill's absolute folder is shown in the\n` +
  `  loaded result — that is the only correct base path.\n` +
  `\n` +
  `Decision rule:\n` +
  `1. **Foundation Skills + Foundation references FIRST, sub-triggers SECOND.** Per R6, on EVERY turn,\n` +
  `   regardless of any domain trigger:\n` +
  `     (a) Load skills: msw-general → msw-ui-system  (2 Foundation Skills)\n` +
  `     (b) Read msw-general/references/{platform.md (core), workspace.md, entity.md, authoring.md} in full\n` +
  `         (4 Foundation references)\n` +
  `   Once TileMapMode is identified, the matching ONE of platform-{maple|rect|sideview}.md joins Foundation.\n` +
  `   Skipping any single Foundation Skill or any single Foundation reference = "skill NOT loaded".\n` +
  `2. If this turn's domain ≠ previous turn's domain → LOAD the matching ADDITIONAL skill (msw-scripting /\n` +
  `   msw-search / msw-combat-system / msw-defaultplayer / msw-avatar / msw-packages / msw-planning) per rules R1–R6 BEFORE planning.\n` +
  `   These domain-specific skills come ON TOP OF the 2 Foundation Skills, never in place of them.\n` +
  `3. If this turn touches multiple domains → LOAD all matching skills, each in full, plus READ every triggered reference.\n` +
  `4. If a sub-trigger under a domain fires (e.g. 'BT' under combat, 'DataStorage' under scripting),\n` +
  `   the listed references/*.md is REQUIRED in ADDITION to Foundations, not optional — SKILL.md alone is insufficient.\n` +
  `5. If unsure which additional skill applies → load all 2 Foundations (rule 1) anyway, then route from there.\n` +
  `6. Never answer a cross-domain request from a previously-loaded skill alone.\n` +
  `</msw-skill-router-reminder>\n`
);
