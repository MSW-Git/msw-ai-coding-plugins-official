# GDD / Roadmap Deliverable Template

In STEP 4, write the markdown in this structure. Add/remove sections by game scale, but **always include the bold sections**. Rather than leaving blanks, mark "tentative"/"deferred" to keep the decision flow visible.

```markdown
# [Game title] — [one-line genre description] design doc (GDD)

> 🔖 **AI note — resuming?** If you're reading this in a new session to continue/resume this game, load the `msw-planning` skill FIRST and follow its resume flow (read `Archive/As-built.md` → reconstruct state → reconcile) — don't edit or implement straight from this doc.
> Last updated: [date] / Stage: [e.g., Phase 1 upcoming]

## 1. One-line concept
> "[who / what / how in one sentence. e.g., a top-down auto-attack 10–15 min roguelite survival.]"

## 2. Key decisions (immutable baseline)   ← always include
| Item | Decision | Notes |
|---|---|---|
| Camera/map mode | [MapleTile / RectTile / SideViewRectTile] | State the Body component + which map it's built in (a matching template if the project has one) |
| Player | [DefaultPlayer-based, etc.] | |
| Session length | [minutes] | |
| Player count | [solo / multi] | Whether @Sync is used |
| Priority | [fun-first / content volume, etc.] | |

## 3. Core loop (one session)   ← always include
[Entry → repeated action → reward → growth → repeat → end (win/lose), as arrows/diagram]

## 4. Core systems
[Per system — player / enemy / growth / reward / difficulty·spawn / UI — what, with what numbers]

## 5. System ↔ MSW mapping (real implementation)   ← always include
| Game system | MSW implementation |
|---|---|
| [global state·timer] | @Logic ... |
| [player movement] | [Body matching the map type] ... |
| [enemy AI] | @Component ... |
| [data (stats etc.)] | UserDataSet (dataset) ... |
| [UI/HUD] | .ui + UIBuilder ... |
( fill in using references/msw-mapping.md )

## 6. Roadmap (Phases)   ← always include
[From the smallest playable build, by stages. Each Phase is a checklist of items **required** for a handoff-ready prototype (all must reach ✅) — polish / nice-to-have / later work goes in §8, not here. Track each item with ⬜ not started · 🟡 implemented (untested) · ✅ tested (all start ⬜).]

### Phase 1 — "[smallest working goal, e.g., move, hit, and it breaks]"
- ⬜ ...
### Phase 2 — "[next core]"
- ⬜ ...
### Phase 3+ — "[variety · difficulty · content]"
- ⬜ ...

## 7. Data-driven (if applicable)
[If values are many/tunable, move stats·balance into UserDataSet/CSV ("CSV is the source of truth"). Early Phases may hardcode; when the data grows/stabilizes, add a **roadmap goal to migrate hardcoded values → a dataset** (rebalance without code edits). Leads into the detailed dataset-design stage (authored via msw-general → `references/dataset.md`).]

## 8. Decided / deferred items
| Item | Status |
|---|---|
| [decided] | Decided: [value] |
| [deferred] | Deferred → [when to decide] |

## 9. Plan changes (revision log)   ← append when the plan is revised mid-development
| When | Type | What changed | Reason | Impact |
|---|---|---|---|---|
| [date] | Add / Remove / Modify | [rule / task] | [why] | [states reset · code to remove · new/affected tasks] |
```

## Writing guide
- **Phase 1 must be the "smallest playable build."** Don't pack flashy features into #1 — confirm the game "runs" with just movement · core action · fail condition.
- **The key-decisions table is for nailing things down.** Especially map type ↔ Body: once set, the whole stack follows, so lock it here.
- Ambitions beyond the **small first build (MVP)** (many maps · too many systems) go to **deferred items**, split off to Phase 5+ or "later."
- **Template cleanup (if the map ships sample entities)**: add a **late-Phase "remove sample entities" task** (before handing off to full implementation) so they don't carry into the real build. **Identify them by inspecting the actual map — don't assume fixed names** (often `*Template`-named idle/move/chase samples, but they vary). Useful early as AI-pattern references; removal happens during implementation via MapBuilder.
- **Suggested file layout (recommendation, not a mandate)**: when this plan is implemented, organizing the `.mlua`/`.model` files into folders that **mirror the plan's systems** keeps the codebase clean — e.g. `Player/`, `Monsters/`, `Skills/`, `Projectile/`, `Data/` (UserDataSet), world-wide managers under `Game/` (@Logic), and `.model` under `Models/<type>/` (per the platform rule). The implementation skills do the actual foldering; if the project already has its own folder convention, follow that instead.
- Save the deliverable under the **project-root `Docs/`** (e.g., `Docs/<game>-M<n>-GDD.md`, where `<game>` is a short **ASCII English/romanized slug** — not the raw non-English title — and `<n>` is the **milestone number** (numbering rule in SKILL.md STEP 5: first = M1, later = numeric max + 1); the *content* stays in the user's language, only the filename is ASCII; create the folder if missing). **Do NOT put it under `RootDesk/`** — Maker's `refresh_workspace` deletes non-MSW files (.md) under RootDesk. After producing it, tell the user the save location and the **next step** (phase detailed plan / dataset·UI design / start implementation).
- **Mid-development revisions** (add/remove/modify a planned rule) are logged in §9 and applied to the affected sections + checklist states — see SKILL.md "Revising the plan mid-development." Append to history; don't silently rewrite past decisions.

---

## Per-phase detailed plan template (STEP 6 — optional)

Use this to expand a specific Phase's checklist into deeper work units. Save: `Docs/<game>-M<n>-Phase<k>.md` (same `<game>-M<n>-` prefix as the milestone's GDD; `<k>` = phase number; project root, **outside RootDesk**).

```markdown
# [Game] — Phase [N] detailed plan
> 🔖 **AI note — resuming?** If you're reading this in a new session to continue the build, load the `msw-planning` skill FIRST and resume through it (read `Archive/As-built.md` + the GDD → reconstruct state) — don't treat this as plain implementation and start editing straight from this doc.
> Parent doc: [Game]-GDD.md · This Phase's goal: [one line]
> **Skills to reference (this Phase)**: skills the implementing session should load for this Phase — predicted from GDD §5 / `references/msw-mapping.md` §4. Per-task specifics under each task below.

## Status checklist
> States: ⬜ not started · 🟡 implemented (untested) · ✅ tested.
> All items start ⬜. Mark 🟡 when built, ✅ only after verification passes.
> Items the AI cannot verify itself stay 🟡 with a "needs user test" note until the user reports back.

- ⬜ [Task 1 title]
- ⬜ [Task 2 title]
- ⬜ [Task 3 title]  ⚠️ needs user test: [what the user must check — AI can't verify]

## Task detail

### [Task 1 title]
- **Goal**: what works / is complete when this task is done
- **Required systems·components**: @Logic/@Component/.model/.ui etc. (references/msw-mapping.md)
- **Data**: UserDataSet columns etc. (if applicable)
- **UI**: related .ui elements (if applicable)
- **Done (verification) criteria**: what you look at to call it done (log / screen / behavior) — and **who** can verify (AI-verifiable vs needs-user-test)
- **Dependencies**: prerequisite tasks · other items
- **Skills to reference (predicted)**: the skill(s) + reference doc this task needs (`references/msw-mapping.md` §4). The implementing session reads/loads these.

### [Task 2 title]
- ...

## Risks / cautions
- MSW silent-failure points to watch at this stage (map-type↔Body, empty SpriteRUID, 1 unit = 100px coordinates, etc.)
```

**Writing guide**
- Cut each task into "playably verifiable" units, with clear done (verification) criteria.
- So the doc can be carried straight into the implementation skills (`msw-general`·`msw-scripting` etc.), write down the needed components·data·verification points without gaps.
- **Track status, stay honest**: update each item ⬜ → 🟡 → ✅ as it's built and verified. Never mark ✅ on something the AI couldn't actually test — leave it 🟡, tell the user exactly what to check, and update it when they report back. If the user moves to the next Phase with items still untested, flag the incomplete ones but proceed if they want.
- **Document lifetime**: this detail doc is a transient artifact. Once that Phase's items are **all ✅ tested**, reflect completion in the GDD roadmap, **distill its as-built facts into `Archive/As-built.md`** (see below), then **delete this doc (mandatory)** — it must not linger. Progress history stays in the GDD; the as-built record stays in `Archive/As-built.md`.

---

## As-built log template (`Archive/As-built.md`)

Standalone, in **project-root `Archive/`** (survives milestone cleanup + `refresh_workspace`). An **AI / handoff reference, not a user-facing planning doc**. Seeded by a brownfield survey when the skill is first adopted on an existing project; updated at each Phase / milestone completion. It is a **curated current-state map + why/gotchas — NOT a change-log** (git already records raw changes).

```markdown
# [Game] — As-built log

> Running record of the world's implementation. Survives across milestones. ⚠️confirm = survey guess to verify with the user.

## Current state (by system)
| System | Built | Where (key files) | Notes / gotchas |
|---|---|---|---|
| [system] | [@Logic / @Component / .model / .ui / dataset] | [folder · file] | [deviations · gotchas · ⚠️confirm] |

## Log
### [date] Seed — surveyed on toolkit adoption   (brownfield only)
[what the survey found · ⚠️confirm items]
### [date] Milestone / Phase N complete
[key components·files added · deviations from plan · gotchas]
```

**Writing guide**
- Keep "Built / Where" to a *map* (point to files), not copied code — code is the real artifact; this is the index + the *why/gotchas* the code doesn't state.
- Update only at controlled moments (Phase / milestone completion, or brownfield seed) — **not per edit**. A stale As-built misleads worse than none.
- The next milestone's roadmap is planned **on top of** this file's current state.
