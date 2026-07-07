---
name: msw-planning
description: "MSW (MapleStory Worlds) game-planning mode — for BOTH starting a brand-new game from scratch AND continuing/resuming an in-progress prototype. Narrow the idea with guided questions, ground it in the MSW genre catalog (3 map types, ~150 core mechanic tags, build-effort hints), and produce or advance an implementation-ready GDD / roadmap (markdown). Trigger proactively (even without the word 'planning') whenever the user wants to decide WHAT to build, scope an MVP, or continue/resume a phased build — INCLUDING when a Docs/*-GDD.md or *-Phase*.md already exists and the user says to continue: do NOT treat that as plain implementation and jump straight into the phase doc; a continue/resume runs through this skill's resume flow first. Match triggers by intent, not exact wording — variants like '다음에 어떤 작업 해야해?', '이제 뭐 하지?', 'what now?', 'where were we?' fire it too. Triggers: 'plan a new game', 'GDD', 'what game should I make', 'scope an MVP', '기획 모드', '새 게임 만들고 싶어', 'continue my game', 'resume my game', '게임 이어서 만들어줘', '다음 작업 알려줘', '이어서 진행해줘', '다음 작업 진행해줘', 'next task'. (Plans & manages the game's build across its milestones — GDD · phase plans · progress · revisions; does NOT write code — implementation (.mlua/.model etc.) uses msw-general/msw-scripting.)"
---

# MSW New-Game Planning Mode (msw-planning)

## Purpose
When the user is at the "I want to make a game like this" stage, turn it into **what to build + how to build it in MSW**: a guided session produces a **GDD/roadmap**, then the skill **guides the phased build** — detailed Phase plans, progress tracking, and plan revisions — **until each milestone's build is ready to enter full implementation**. Someone who doesn't know game design can just follow the questions; for those who do, it documents decisions fast.

## Core principles (why it works this way)
- **Catalog grounding**: MSW is 2D · mLua (a Lua-extension scripting language) · cross-platform, so the space of "what you can build" is bounded. Map a vague idea onto the real genres/map-types/mechanics in `references/genre-catalog.md` to get a *feasible* plan. Planning from generic game knowledge alone leads to designs MSW can't realize.
- **Right-size the build**: the catalog gives a **build-effort hint** (Low / Medium / High) per genre — a signal, not a verdict (baseline 1–5 maps · 10–20 units/items · basic-to-intermediate mLua; **tower defense sits at the top of comfortably-solo**). Use it to set expectations, not to refuse a genre. Size the first build by **build-effort + scope (maps/content), never by a calendar/development-time estimate** — the skill can't know the user's skill level or available hours, so it doesn't promise 'this takes N days/weeks.' **When the user's ambition is large** (a High-effort genre, or many systems/maps, or "I want everything"), don't plan it all at once — **scope the *first build* down to a small playable core (MVP)** and push the rest to later Phases. This applies to any genre.
- **Single pass (no ping-pong) + one direction check**: limit user touchpoints to **STEP 1 (batched questions)** and **STEP 3 (direction check)** — don't keep asking back in between. But **never skip STEP 3 (direction check) before writing the GDD**: don't just flash the grounding result and jump straight to the GDD. Once the direction is confirmed, produce the deliverable immediately.
- **Standardized deliverable**: drop the result into the fixed GDD structure (`references/gdd-template.md`) as markdown, so the implementation skills can pick it up and carry it to an MVP.
- **Carry the project forward**: after each deliverable, **propose the next step first** (e.g., "Shall I write the Phase 1 detailed plan next?"). Proceed if the user wants it, stop if they say stop — it's a suggestion, not a push. (This differs from endless mid-document ping-pong — it connects the flow *between* deliverables.)
- **Decision gates = selectable choices, not free text**: at each user decision gate — **STEP 3 direction check**, the **Phase handoff** (implement now vs write the next-Phase plan), and the **soft Phase gate** — present the options as a **structured selectable choice** via the agent's multiple-choice UI when available (e.g., Claude Code's `AskUserQuestion`), so the user clicks an option instead of typing a free-text reply. Mark the recommended option but don't force it; if the agent has no such UI, fall back to a clearly enumerated prose choice.

## On startup — check for an existing GDD (resume / new / blocked)
A build spans multiple sessions and **milestones — each milestone is one GDD**. Where things live (all project-root, outside RootDesk, to survive `refresh_workspace`):
- **Active** GDD + Phase plan → `Docs/`.
- **Completed** GDD → `Archive/` (on milestone completion).
- **`Archive/As-built.md`** → the world's running implementation record: a curated current-state map kept by the skill, an **AI / handoff reference, not a user-facing planning doc** (see STEP 6 + *Brownfield* below).

**Before running the flow below, detect the plan files** — check **both** `Docs/` and `Archive/` for a `<game>-GDD.md`:
- **List** those directories (capital `Docs/` / `Archive/`) and match files ending in `-GDD.md` / `-Phase<N>.md` — **not by glob/grep** (case-sensitive + scope-fragile: `*.md` is top-level only, `docs/` ≠ `Docs/`) and not from memory.
- Conclude **"no GDD anywhere" only from genuinely empty `Docs/` + `Archive/` listings.**
- If **`Archive/As-built.md`** exists, **read it first** for the current-state map.
- Normally there's at most one active GDD; **if several exist, ask which game this is about first**, then apply the rules below.

**Gating rule — a "continue" / "next task" / resume request only acts when a plan exists in `Docs/` or `Archive/`** (a `<game>-GDD.md` / `<game>-Phase<N>.md`, or a prior milestone + `Archive/As-built.md`). If **nothing exists in either**, the request must **not** be treated as a resume and must **not** auto-start the STEP 1 questionnaire — instead: if the request is a **continue / "what next" intent, or the user says they're building on their own existing work** (not a fresh template start), go to *Brownfield* below; otherwise (a new-game or unclear intent) tell the user there's no saved plan and ask whether to start a new game (then STEP 1). **Don't infer brownfield from workspace files** — templates ship samples, so a non-empty workspace is not evidence of prior work.

**If a GDD exists, judge how much is actually done from the GDD / Phase-doc task states (`⬜/🟡/✅`) — NOT from workspace files** (templates ship with `.mlua`/`.model`/`.ui`, so file presence is not a reliable progress signal). Then branch:

- **The user explicitly asked to continue/resume** → **resume** (steps below), regardless of state.
- **Every roadmap & Phase item is `⬜`** (a plan with zero progress) → offer a **selectable choice** (see Core principles): **① continue this plan (*[game]*)** / **② discard it and plan a new game**. If they choose discard, **first state exactly which files will be removed** — `Docs/<game>-GDD.md` + that game's `Docs/<game>-Phase<N>.md` (only those) — delete them, then start fresh from STEP 1.
- **Any item is `🟡` or `✅`** (real progress — there is in-progress implementation in *this* world) → do **NOT** discard and do **NOT** plan a new game here. **Inform** the user that this world already has a prototype underway, and that a genuinely new game must be built in a **new world** — this skill **cannot create a world**, so the user creates one and runs the skill there — then **stop**. (If they actually meant to continue this one, resume instead.)
- **When the state is unclear** (missing or inconsistent Phase doc, ambiguous progress) → treat it as the `🟡/✅` case (don't discard, don't build over).

**To resume** an existing plan:
1. **Read the existing docs FIRST** — `Docs/<game>-GDD.md` (+ the current `Docs/<game>-Phase<N>.md` if present). Do **not** re-run STEP 1–4; the plan already exists.
2. **Reconstruct state**: the GDD's `Stage` line + roadmap `⬜/🟡/✅`, any `🟡 Implemented (untested)` items (flag these for re-test / user confirmation), and recent `§9 Plan changes`.
3. **Briefly restate where things stand** — done so far / current Phase / what's still untested / next step — then continue from there.
- If `Docs/` has **no GDD** but `Archive/` has a completed one (+ `Archive/As-built.md`), the previous milestone finished. **Confirm** whether to start a **next milestone** — a new GDD in `Docs/` (`<game>-M<n+1>-GDD.md`, next number per STEP 5), planned **on top of `Archive/As-built.md`** — rather than assuming a brand-new game. (Before writing it, **reconcile the record against the workspace — see *Reconcile before a next milestone* below**.)
- Completed Phases have no detail doc (deleted on completion by rule) — the GDD roadmap is their record; only the **in-progress** Phase has a `Docs/<game>-Phase<N>.md`.
- The `Docs/` files are the **source of truth across sessions**: the previous session's chat context does not carry over, so anything not written into the GDD/Phase docs is lost (which is why decisions and states are recorded there).

**No GDD in `Docs/` nor `Archive/` → before anything else, *classify the workspace, then decide* — mandatory, including for an explicit "new game" request: never jump straight to STEP 1 without first checking what's already built here.** (*Brownfield* = continuing the user's *own* already-built world; it is **user-driven, never inferred from raw file presence** — but the classification itself is **not** optional.) When real work exists, surface it; how prominently to offer brownfield is then decided by the user's *intent* (below), not the workspace.

A non-empty workspace is **not** a brownfield signal — a fresh template already ships scaffolding. **Treat known starter items as *zero progress*** (a known set, **not exhaustive** — template versions change and other templates differ; this is "things known to be scaffolding," not a complete manifest): tile dataset `RectTileData_Henesys`; `@Logic` `UIPopup`, `UIToast`; `@Component` `Monster`, `MonsterAttack`, `PlayerAttack`, `PlayerHit` (plus the always-present `Global/` defaults — DefaultPlayer, WorldConfig, the starter map).
- **Workspace ≈ only starter items (or less)** → fresh project → **proceed to STEP 1, no brownfield prompt.**
- **Work clearly *beyond* the starter items** (custom-named systems / maps / datasets / scripts suggesting real implementation) → a real game may be in progress. **How prominently to offer brownfield is decided by the user's *intent*, not the workspace:**
  - **Continue / "what next" intent** ("what should I do next?", "continue", "where were we?") → continuing the existing work *is* the natural reading → offer **brownfield as the recommended option** (alongside: start a separate new game; or just re-check / improve one specific system).
  - **Explicit new-game intent** ("I want to make a new game") → **honor it: the new game is the default / recommended choice.** Offer brownfield only as the **last, non-recommended** option (*"…or are you actually continuing a world you've already built?"*) — a safety-net, never recommended, never a mandatory fork that overrides what the user asked.
  - An explicit "build on my existing work" request → straight to the survey.
  Brownfield runs only if the user actually picks it.

When brownfield is chosen, don't plan in a vacuum — **light structural survey** (`map/` + `RootDesk/MyDesk/` — systems · models · datasets · UI; *structure only, not a line-by-line code read*; deep inspection is msw-general's job), present *"here's what I see already built — correct?"* with `⚠️confirm`, then **seed `Archive/As-built.md`** and plan the first milestone **on top of** the existing world.

**Reconcile before a next milestone** — when planning a new milestone on top of `Archive/` records (arrived from startup, or just after completing one): `Archive/As-built.md` (or a legacy handoff note) is a **starting hint, not ground truth** — work may have happened in other sessions / manual edits without updating it. **Before writing the new GDD**, run the same light structural survey as *Brownfield* above, but to **verify** the record (not discover from scratch): check the **area the new milestone will touch** — plus a quick scan for obviously-untracked major systems — against what the record claims. If it has **drifted**, **surface it and reconcile with the user first**, **update `Archive/As-built.md`** to match reality, *then* plan on top. This stops a whole GDD being written on a stale premise and the drift only surfacing mid-implementation.

## Flow

### STEP 1 — Guided questions (batched)
Don't re-ask what the user already gave; batch only the gaps:
1. **Genre / reference** — what's the feel? Any similar game? (If unsure, start from "what kind of fun do you want?")
2. **Core fun / core loop** — what do you repeat in one session? (e.g., kill enemies → grow → stronger enemies)
3. **Target · platform** — PC/mobile? Solo/multi?
4. **Scope (first build)** — a quick prototype or something bigger? Roughly how many maps / how much content?
5. **Must-haves / cuttable**

Batch into ~5 questions. If the user says "you decide," proceed with reasonable defaults but **state the assumptions**.

### STEP 2 — Catalog grounding + feasibility check
Read `references/genre-catalog.md` and:
- Find the **closest genre(s)** to the user's idea.
- Pull that genre's **recommended map type** and **core mechanic tags**.
- **Read the `build-effort` hint** (Low/Medium/High) and gauge the user's ambition. If it's High-effort or the user is asking for a lot at once, say so plainly and **propose a scoped-down first build** (one map · core loop only) that keeps the same fun, with the rest deferred to later Phases — regardless of genre.
- If needed, pick and combine mechanic tags into a one-line concept.

### STEP 3 — Direction check (user confirmation gate) ⚑ Do not skip
**Always get the direction confirmed by the user before writing the GDD.** Briefly show the grounding result and **don't jump straight to the GDD** — genre and map type decide the whole stack, so if you write the entire GDD on a wrong choice you have to redo all of it.

**Present briefly and ask** the user:
- **Recommended direction**: the matched *sub-genre(s)* (1–2 candidates) + **recommended map type ↔ Body** (e.g., RectTile + `KinematicbodyComponent`) + **build-effort hint (Low/Medium/High)** + **one-line concept**.
- If it's High-effort or the user is over-scoping, present a **scoped-down first-build (MVP) option** alongside — the same fun in a smaller first slice, with the rest deferred.
- Then ask, presenting the options **as a selectable choice** (see Core principles): **"Shall I build the GDD in this direction? Or are there other candidates / changes?"**
- **Only after the user confirms (or chooses)** move to STEP 4. (If they explicitly say "you decide," lock in the recommendation but state in one line what you chose.)
- Map type ↔ Body is nailed down here (`references/msw-mapping.md`). Getting it wrong causes "doesn't move" / `[LEA-3004]` silent failures in implementation. It is *applied* at setup by **building in a map that already has this type if one exists** (e.g., a per-type template); otherwise the user sets it in Maker. The AI never switches a map's type itself (see STEP 5).

### STEP 4 — Produce the GDD/roadmap
**In the direction the user confirmed in STEP 3**, write markdown in the `references/gdd-template.md` structure:
**one-line concept / key-decisions table / core loop / core systems / system↔MSW mapping / Phase roadmap checklist / decided·deferred items.**
- For the system↔MSW mapping, use `references/msw-mapping.md` to connect each system to `@Logic`/`@Component`/`.model`/`.ui`/dataset (UserDataSet).
- Split the roadmap into stages **starting from the smallest playable build (Phase 1)**, like "move, hit, and it breaks." Track each roadmap item with three states — `⬜ Not started` / `🟡 Implemented (untested)` / `✅ Tested` (all start ⬜; see STEP 6).
- **The roadmap checklist holds only items *required* for a handoff-ready prototype — and all of them must reach `✅`.** Polish / nice-to-have / later work goes in **§8 (Deferred) at planning time**, never as a checklist item. Discriminator: *would dropping it leave the full-implementation team a more incomplete base?* → required (checklist); *does production polish it anyway?* → §8.
- For data-heavy games, state "data-driven (UserDataSet/CSV is the source of truth)" in the roadmap. Early Phases may hardcode values for speed, but **add a later-Phase goal to migrate implementation data into a dataset (UserDataSet/CSV)** once the value-set grows or stabilizes — so balancing/content no longer needs code edits. Include this **only when warranted** (many tunable values · balance iteration expected · content scaling), not for a handful of constants. The dataset itself is authored via `msw-general` (see its `references/dataset.md`).
- **If the chosen map ships placeholder/sample entities**: include a task to **remove them before the prototype hands off to full implementation** so they don't carry into the real build. **Don't assume fixed names — inspect the actual map and identify its sample/placeholder entities** (often `*Template`-named idle/move/chase monster samples, but names vary by template). They're useful early as AI-pattern references; actual deletion happens during implementation, via MapBuilder removing them from the `.map`.

### STEP 5 — Save + next step
- Save the produced markdown **under the project-root `Docs/`** as **`Docs/<game>-M<n>-GDD.md`** — **`<game>`** is a short ASCII (English/romanized) slug (**never the raw non-English title**; CJK/non-ASCII filenames break globbing and cross-platform paths — e.g. `MapleIdle-M1-GDD.md`, not the raw CJK title) and **`<n>` is the milestone number**. **Milestone number**: the first milestone is **M1**; a later milestone takes **(the numerically highest existing `-M<n>-GDD.md` across `Docs/` + `Archive/`) + 1** — *parse the number, don't sort lexically* (so M9 → M10, not M2). The doc's **content stays in the user's language**; only the *filename* is ASCII. Phase docs inherit the same **`<game>-M<n>-` prefix** (STEP 6). Collect all planning deliverables (GDD · phase detail plans) here. Create the folder if missing. Kept as a file, the implementation skills can pick it up and carry it to an MVP.
- ⚠️ **Do NOT save under `RootDesk/`.** Maker's `refresh_workspace` cleans up (deletes) non-MSW files (.md etc.) under `RootDesk/`, so files there **vanish** when a refresh runs during implementation/playtesting. Always keep them outside RootDesk (project-root `Docs/`).
- **When the base GDD is done, propose naturally first**: "Shall I write the **Phase 1 detailed plan** next?" → if the user agrees, go straight to STEP 6.
- Other branches to offer: if numbers/data-heavy, go to dataset design; if screen-heavy, author UI with `msw-ui-system`; to build right away, start implementation with `msw-general`·`msw-scripting`. The default recommended flow is 'detail Phase 1 → implement.'
- **Apply the map type — build in a matching map if one exists, otherwise the user sets it**: the prototype must be built in a map whose `TileMapMode` already equals the decided type. At setup, check existing maps with `MapBuilder.read().getTileMapMode()`, then:
  - **If a map already matches** — e.g., the project keeps **per-map-type template maps** (one TileMap / RectTile / SideView each) — **build the prototype in that map**, no switch needed (the destructive switch is avoided). *This shortcut applies only when such a matching map/template exists.*
  - **If no map matches** — no per-type template, or starting from scratch — fall back to the standard policy: **the user switches a map's type in Maker** (msw-general `tile.md`; the AI verifies with `getTileMapMode()` afterward).
  - **Either way, the AI never switches a map's `TileMapMode` itself.** (If built in a template, its sample `*Template` entities are removed later per the cleanup rule.)

### STEP 6 — (Optional) Per-phase detailed plan
The base output (STEP 4) goes up to *the full roadmap + per-Phase checklist*. If the user wants the detailed plan for a specific Phase (e.g., "write the Phase 1 detailed plan," "break down stage 1"), generate an additional **detailed-plan markdown** that expands that Phase's checklist items in more depth.
- For each task, write: **goal · required systems/components** (`references/msw-mapping.md`) **· data (UserDataSet) · UI · done (verification) criteria · dependencies · skills to reference (predicted — skill + its reference doc, `references/msw-mapping.md` §4)**. Also record, near the top of the Phase doc, a **"Skills to reference (this Phase)"** summary — the implementing session reads it first.
- **Generate a status checklist** alongside the tasks — every item starts **Not started** and moves through three states as work proceeds:
  - `⬜ Not started` — not implemented yet.
  - `🟡 Implemented (untested)` — implementation done, not yet verified.
  - `✅ Tested` — implementation AND verification both done.
- Follow the **'Per-phase detailed plan template'** in `references/gdd-template.md`.
- Save: `Docs/<game>-M<n>-Phase<k>.md` (same **`<game>-M<n>-` prefix** as the milestone's GDD — see STEP 5; `<k>` = phase number; project-root `Docs/`, **outside RootDesk** — avoids refresh deletion).
- This too goes only up to *detailed planning* — writing actual code (.mlua/.model etc.) is still the job of the implementation skills (msw-general/msw-scripting etc.); those skills update the checklist states as they implement and verify.

#### Checklist state rules (apply during implementation)
- **Implement by Phase unit (continuous), not task-by-task**: when the user asks to implement a Phase, work through its tasks **in dependency order, end to end** — verify each inline, update its `⬜→🟡→✅` state, and keep going. **Don't stop after one task to ask whether to continue.** Pause only at: the **Phase is complete** (all `✅`, or only AI-unverifiable items left `🟡`); a **genuine blocker** (a decision or resource only the user can give, a user-test that gates the next task, or an unresolved failure); or a **context/output limit** (then do as much as possible, stop at a clean checkpoint, and state exactly what remains). At a pause, give **one batched report**, not a per-task check-in. ("Phase unit" means continuous progress to a natural checkpoint — not necessarily one turn; implement everything implementable first and collect visual/feel/on-device user-tests to surface together at the Phase boundary.)
- **Update each task's state immediately as you build it — mandatory, not deferrable.** Per task, in order: write the code → **right away mark that item `🟡 Implemented (untested)` in the Phase doc** (before starting the next task and before verification) → verify → set `✅ Tested` (or send it back to fixing). **Never leave an implemented task at `⬜`** — if its files exist, it is at least `🟡`. Don't batch the state updates to the end (that's how a Phase doc ends up all-`⬜` while the workspace is full of code, which then blocks the next session from knowing what's done). Keep the Phase doc current as you go, and reflect Phase-level completion back into the GDD roadmap. Tracking state only in an in-session/ephemeral tool (e.g. the harness's own TaskCreate/TaskUpdate list) does **not** count as updating the checklist — it is discarded at session end; the `Docs/<game>-M<n>-Phase<k>.md` checklist is the single durable source of truth, so mirror every `⬜→🟡→✅` change into it in the same step (tracking only in the ephemeral tool leaves the doc all-`⬜` — the same failure as above).
- **Untestable-by-AI items — be honest**: some items can't be verified by the AI alone (on-device feel, visual/audio judgment, real-player multiplayer, store/commerce — anything needing human eyes or a real client). Do NOT silently mark these `✅ Tested`. Tell the user plainly *which* items you couldn't test and *why*, leave them at `🟡 Implemented (untested)`, and ask the user to test; when they report back, reflect it into the checklist (`✅ Tested`, or send it back to fixing if it failed).
- **Phase gate (soft)**: if the user asks to start the **next Phase** while some items aren't yet `✅ Tested`, first **tell them which items are still untested**, then offer the choice **as a selectable prompt** (see Core principles): proceed to the next Phase anyway, or finish testing the untested items first. If the user still wants to proceed, **proceed** — it's a heads-up, not a block.
- **No silent deferral**: every checklist item is required (it wouldn't be in the checklist otherwise), so don't drop one mid-build with a "the prototype doesn't need it" rationale. If an item genuinely turns out non-required, **move it to §8 (Deferred) via a plan revision** (user confirmation + GDD §9 log) — never leave it parked as "Deferred" inside the checklist.
- **Phase-detail handoff**: after finishing a Phase detailed plan, offer the next step **as a selectable choice** (see Core principles) — **implement this stage** vs **write the next Phase N+1 detailed plan**.
- **Completed-stage cleanup (mandatory)**: once a Phase's items are **all `✅ Tested`**, in order — (1) **record that Phase 'done' in the GDD roadmap**; (2) **distill its as-built facts into `Archive/As-built.md`** (update the current-state map + log key components/files, deviations from plan, and gotchas — concise, *not a code dump*; git already logs raw changes); (3) **delete that Phase's detailed-plan md (`Docs/<game>-Phase<N>.md`)** — a transient artifact that must not linger. Nothing is lost: the roadmap keeps progress, `Archive/As-built.md` keeps the as-built record. (Always do 1+2 *before* deleting.)
- **Milestone-complete cleanup (mandatory)**: once **every** GDD roadmap item is `✅ Tested` — this milestone is implemented and verified — finish up: (1) set the GDD's `Stage` to complete; (2) **finalize `Archive/As-built.md`** so its current-state map reflects the whole milestone; (3) **move** `Docs/<game>-M<n>-GDD.md` into **`Archive/`** (project root, outside RootDesk; create if missing) — archived, not deleted, as this milestone's record. ⚠️ **Never overwrite an existing archived GDD**: if that name already exists in `Archive/` (shouldn't, under the `M<n>` rule), it signals a numbering error — **stop and flag it, don't silently rename**. **Leave `Docs/` in place** (the next milestone reuses it for a new GDD). Verify all items are truly `✅` first, then tell the user the milestone is complete + where things are. **A later milestone** (the user wants to evolve further) starts a **new GDD in `Docs/`** (`<game>-M<n+1>-GDD.md`, next number per STEP 5), planned on top of `Archive/As-built.md` (reconcile it against the workspace first — see *Reconcile before a next milestone*).

## Revising the plan mid-development (add / remove / change a rule)
Once the GDD exists and you're building phase by phase, the user may request changes to the plan. Handle the three kinds — **add**, **remove**, **modify** a planned rule/task — without breaking consistency with what's already built.

For any revision:
1. **Classify** it — add a new rule, remove an existing rule, or modify an existing rule.
2. **Locate** what it touches — which GDD section (key decisions / core systems / roadmap / data-driven) and/or which Phase doc + checklist item(s). A GDD prose item (§2/§4/§5/§7) has no state of its own; determine whether it's already built by tracing it to the roadmap/Phase checklist items that implement it, then apply the `🟡`/`✅` impact rules (step 3) to those.
3. **Assess impact honestly *before* applying** — especially when it touches work already built (`🟡`/`✅`):
   - **Add**: the new item enters the checklist as `⬜ Not started`. If it belongs to a Phase already marked done, say so and place it in the current/next Phase rather than silently re-opening the done one.
   - **Modify**: if the target was `🟡`/`✅`, the built work likely needs redo → reset that item to `⬜` (or `🟡` if only re-testing is needed) and tell the user it must be re-implemented/re-verified.
   - **Remove**: if the target was already built, the code must be removed too → flag a removal task for the implementation skill, then drop the item from the plan/checklist.
   - Note any **dependent** rules/tasks the change ripples into.
   - ⚠️ If it touches a **core decision** (key-decisions table — e.g., map type ↔ Body, solo/multi & `@Sync`), warn strongly: it cascades through the whole stack and can invalidate much of what's built. Confirm before proceeding.
4. **Confirm scope when it affects built/tested work or a core decision** — surface the impact (which states reset, what code to remove, which dependents) and get the user's go-ahead. A pure addition to not-yet-started work can proceed directly.
5. **Apply to the docs** — update the relevant GDD section and/or Phase doc; add/remove/modify the checklist item(s) with the correct states; and **log the change in the GDD's "Plan changes" section** (type / what / why / impact) so the plan's history stays visible.
6. **Hand off code changes** — writing/removing/altering actual code (.mlua/.model etc.) is the implementation skills' job; this skill updates the plan, checklist states, and flags the implementation/cleanup tasks.

## Boundaries (what this skill does NOT do)
- It does not write the actual code (.mlua/.model/.map/.ui) — that's the implementation skills' job. This skill **plans and manages the game's build across its milestones** (GDD · detailed Phase plans · progress tracking · plan revisions) and hands the code work off to msw-general/msw-scripting etc.
- A major improvement/expansion of an already-built, shipped world is out of scope (this skill plans the game's build — a new game and its successive milestones — up to readiness for full implementation).
- Reflect MSW platform rules (map-type↔Body, 1 unit = 100px, SpriteRUID, etc.) in the plan, but follow msw-general's platform references for the exact implementation rules.

## References
- `references/genre-catalog.md` — 3 map types · build-effort baseline · 62 genres (build-effort hint · recommended map type · core mechanics) · ~150 mechanic tags. **The heart of grounding — always read it in STEP 2.**
- `references/gdd-template.md` — the GDD/roadmap output structure + per-phase detailed-plan template (STEP 6).
- `references/msw-mapping.md` — map-type↔Body table + game-system → MSW component/skill mapping cheat sheet.
