# GDD / Roadmap Deliverable Template

In STEP 4, write the markdown in this structure. Add/remove sections by game scale, but **always include the bold sections**. Rather than leaving blanks, mark "tentative"/"pending" to keep the decision flow visible (beyond-milestone work never stays in the GDD — it goes to the milestone roadmap).

```markdown
# [Game title] — [one-line genre description] design doc (GDD)

> 🔖 **AI note — resuming?** If you're reading this in a new session to continue/resume this game, load the `msw-planning` skill FIRST and follow its resume flow (read `[game]-Roadmap.md` + `Archive/As-built.md` → reconstruct state → reconcile) — don't edit or implement straight from this doc. **Before touching any `⬜/🟡/✅` state or running a completion, Read the skill's `references/build-management.md` IN FULL.**
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
[From the smallest playable build, by stages — seed Phase 1 from the matched genre's `MVP:` hint and the later Phases from its `Growth:` axes (genre-catalog, as adapted in STEP 2–3). Each Phase is a checklist of items **required** for a handoff-ready prototype (all must reach ✅) — polish / nice-to-have / later work goes to the **milestone roadmap** (`Docs/[game]-Roadmap.md`), not here and not in §8. Track each item with ⬜ not started · 🟡 implemented (untested) · ✅ tested (all start ⬜).]

### Phase 1 — "[smallest working goal, e.g., move, hit, and it breaks]"
- ⬜ ...
### Phase 2 — "[next core]"
- ⬜ ...
### Phase 3+ — "[variety · difficulty · content]"
- ⬜ ...

## 7. Data-driven (if applicable)
[If values are many/tunable, move stats·balance into UserDataSet/CSV ("CSV is the source of truth"). Early Phases may hardcode; when the data grows/stabilizes, plan the migration **by horizon**: within this milestone → a later-Phase task in §6; **beyond this milestone → an entry in the milestone roadmap** (that M's slot or the Backlog), leaving only a pointer here — a migration promise written only in this section is buried when the GDD archives (next-milestone planning reads the roadmap + As-built, not archived GDDs). Leads into the detailed dataset-design stage (authored via msw-general → `references/dataset.md`).]

## 8. Decisions (this milestone)
| Item | Status |
|---|---|
| [decided] | Decided: [value] |
| [pending] | Pending → [decided when — within this milestone] |

> ⚠️ Nothing beyond this milestone lives here. Cut features / later-milestone work go to the **milestone roadmap** (`Docs/[game]-Roadmap.md` — a future-M slot or its Backlog) the moment they surface. "Pending" = a decision this milestone still owes (e.g., a value to lock at Phase 3), not deferred work. The GDD may *mention* a beyond-milestone item as **name + roadmap pointer only** (a boundary note like "excluded here → M4" is fine) — its plan content lives only in the roadmap; if they diverge, the roadmap wins.

## 9. Plan changes (revision log)   ← append when the plan is revised mid-development
| When | Type | What changed | Reason | Impact |
|---|---|---|---|---|
| [date] | Add / Remove / Modify | [rule / task] | [why] | [states reset · code to remove · new/affected tasks] |
```

## Writing guide
- **Phase 1 must be the "smallest playable build."** Don't pack flashy features into #1 — confirm the game "runs" with just movement · core action · fail condition. The matched genre's `MVP:` hint (STEP 2 grounding) is the natural seed — adapt it to the confirmed direction, don't copy it verbatim.
- **Coverage check (before saving)**: §6's Phases must collectively deliver §1's one-line concept — trace each capability §1 (and, for M2+, the promoted roadmap-slot line) claims to the checklist item(s) that implement it, and fix any hole now (add the tasks, or reword the claim with the user's agreement). **Verification limits don't shrink scope**: a flow the AI can't verify alone (real multiplayer, on-device feel, commerce) is still planned as tasks that will end `🟡 needs-user-test` — never silently omitted. The milestone-complete procedure re-runs this same check ([*Milestone-complete cleanup*](build-management.md#milestone-complete-cleanup-mandatory) Step 0), so a hole left here WILL surface — later and more expensively.
- **The key-decisions table is for nailing things down.** Especially map type ↔ Body: once set, the whole stack follows, so lock it here.
- Ambitions beyond the **small first build (MVP)** (many maps · too many systems) go to the **milestone roadmap** — a future-milestone slot or its Backlog — never into this GDD. The genre's `Growth:` axes suggest what naturally lands there (later Phases of *this* milestone may still absorb some — §6).
- **Template cleanup (if the project ships sample entities)**: add a **late-Phase "remove sample entities" task** (before handing off to full implementation) so they don't carry into the real build. **Scope it project-wide**: enumerate ALL maps (full `map/` listing) and inspect each — samples can sit in **any** map (template-derived maps often carry them, some carry none), and one map scanning clean is not evidence for the others. Write the task's done-criteria as "every map enumerated and clean" and **name the scanned maps in the verification record**. **Don't assume fixed names** (often `*Template`-named idle/move/chase samples, but they vary). Useful early as AI-pattern references; removal happens during implementation via MapBuilder. Two more template-residue rules: **(a) rename the build map EARLY** — if building in a `*Template`-named map, put a **Phase 1 task** to rename it to a game-appropriate ASCII name (references are fewest at the start; done-criteria = rename + all references updated + entry verified; read-only `Global/` references are the user's Maker action); **(b) unused template maps** — at handoff, ask the user whether to **delete or keep** each template map the game doesn't use (never delete unconfirmed), deciding **before** sample-cleaning them — "every map clean" applies to the maps that remain.
- **Suggested file layout (recommendation, not a mandate)**: when this plan is implemented, organizing the `.mlua`/`.model` files into folders that **mirror the plan's systems** keeps the codebase clean — e.g. `Player/`, `Monsters/`, `Skills/`, `Projectile/`, `Data/` (UserDataSet), world-wide managers under `Game/` (@Logic), and `.model` under `Models/<type>/` (per the platform rule). The implementation skills do the actual foldering; if the project already has its own folder convention, follow that instead.
- Save the deliverable under the **project-root `Docs/`** (e.g., `Docs/<game>-M<n>-GDD.md`, where `<game>` is a short **ASCII English/romanized slug** — not the raw non-English title — and `<n>` is the **milestone number** (numbering rule in SKILL.md STEP 5: first = M1, later = numeric max + 1); the *content* stays in the user's language, only the filename is ASCII; create the folder if missing). **Do NOT put it under `RootDesk/`** — Maker's `refresh_workspace` deletes non-MSW files (.md) under RootDesk. Create/update the **milestone roadmap** (`Docs/<game>-Roadmap.md`, template below) alongside the GDD. After producing them, tell the user the save locations and the **next step** (phase detailed plan / dataset·UI design / start implementation).
- **Mid-development revisions** (add/remove/modify a planned rule) are logged in §9 and applied to the affected sections + checklist states — see [*Revising the plan mid-development*](build-management.md#revising-the-plan-mid-development-add--remove--change-a-rule). Append to history; don't silently rewrite past decisions.

---

## Milestone roadmap template (`Docs/<game>-Roadmap.md` — STEP 5)

One per game, **created together with the M1 GDD**, kept in `Docs/` permanently (never archived, outside RootDesk). The **single home for everything beyond the current milestone** — the GDD holds nothing beyond its own milestone, so this file is where cut features, later-milestone ideas, and mid-build "let's do that someday" requests land the moment they surface.

```markdown
# [Game] — Milestone roadmap

> 🔖 Cross-milestone direction: vision · release criteria · one slot per milestone · Backlog.
> This is NOT a GDD — the active milestone's contract is its `-M<n>-GDD.md`. Updated only at controlled moments (see guide).
> Last updated: [date] ← date only — no status/progress annotations on this line

## Vision & release criteria
- Vision: [one line — what this game is when it's done]
- Release criteria: [what must be true to call it releasable — criteria, not a feature dump]

## Milestones
| M | Theme (one line) | Status |
|---|---|---|
| M1 | [theme] → `[game]-M1-GDD.md` | 🔨 active |
| M2 | [theme + assigned features, one line] | planned |
| M3 | [theme + assigned features, one line] | candidate |

## Backlog (wanted, not yet slotted)
- [item] — [why it waits / what would trigger revisiting it]
```

**Writing guide**
- **One line per future milestone** — theme + assigned features only. Detailed design happens in that milestone's own GDD when it starts; a detailed future plan goes stale and then misleads (same principle as As-built).
- **Statuses (a CLOSED set — never coin new labels or hybrids like "✅ code-complete")**: `🔨 active` (its GDD is in `Docs/`) · `⏳ user-test pending` (all remaining items await user tests — see build-management.md "Milestone blocked on user testing") · `✅ done` (one-line summary; the archived GDD is the full record) · `planned` (next in line) · `candidate` (order may change). Slot an item into a milestone when the timing is known; otherwise Backlog — don't force day-one assignments (future milestones WILL be reshaped by what playtesting teaches).
- **Coarse progress marker (the only progress allowed here)**: the active slot's Status cell may read exactly **`🔨 active (Phase k/n done)`**, updated ONLY at phase-completion cleanup. No percentages, no free-text status, nowhere else in this file — real progress (which items, what states) lives in the GDD checklist. The `Last updated` line stays **date-only**, no status annotations.
- **Single-home rule**: whenever "later" work surfaces — during planning, mid-build discussion, or a user request — record it here immediately (slot or Backlog) and confirm placement in one line. Never park it in the GDD. The GDD may reference an item here as **name + pointer only** (boundary notes are fine) — never restate its plan content; on divergence, this file wins.
- **Update at controlled moments** (a stale roadmap misleads worse than none) — **adding an item is always one of them**: a new "later" item surfacing (append it to a slot or the Backlog the moment it comes up) · creation with the M1 GDD · each milestone completion (mark `✅ done`, promote/re-order slots, review the Backlog with the user) · next-milestone GDD creation (promote that slot into the new GDD) · a plan revision that changes long-term direction. What waits for a controlled moment is **re-shaping** — moving items between slots, changing statuses, promoting — not recording a new one. Not per edit.
- **§9 logging boundary**: a purely beyond-milestone change (a new future item, a Backlog reshuffle) gets **no GDD §9 entry** — this file is its record. Log in §9 only when the change also touches **this** milestone — e.g. work cut from the current GDD and moved here — because that changes the active checklist (see [*Revising the plan mid-development*](build-management.md#revising-the-plan-mid-development-add--remove--change-a-rule)).
- **Scale to the game**: a single-milestone game's roadmap is a few lines — M1 = release, empty Backlog. That's fine; it grows only if the game does.

---

## Per-phase detailed plan template (STEP 6 — optional)

Use this to expand a specific Phase's checklist into deeper work units. Save: `Docs/<game>-M<n>-Phase<k>.md` (same `<game>-M<n>-` prefix as the milestone's GDD; `<k>` = phase number; project root, **outside RootDesk**).

```markdown
# [Game] — Phase [N] detailed plan
> 🔖 **AI note — resuming?** If you're reading this in a new session to continue the build, load the `msw-planning` skill FIRST and resume through it (read `Archive/As-built.md` + the GDD → reconstruct state) — don't treat this as plain implementation and start editing straight from this doc. **Before implementing tasks or updating any `⬜/🟡/✅` state, Read the skill's `references/build-management.md` IN FULL** (state rules · completion cleanups · revision flow).
> Parent doc: [Game]-M<n>-GDD.md · This Phase's goal: [one line]
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
- **Document lifetime**: this detail doc is a transient artifact, but it is deleted **only at all-✅**. Once that Phase's items are **all ✅ tested**, reflect completion in the GDD roadmap, **distill its as-built facts into `Archive/As-built.md`** (see below), then **delete this doc (mandatory)** — it must not linger. While any item is still 🟡 awaiting a user test, this doc **stays in `Docs/`** (a `⏳ user-test boundary`), so the current Phase's doc and an earlier waiting one can coexist there. Progress history stays in the GDD; the as-built record stays in `Archive/As-built.md`.

---

## As-built log template

The file is `Archive/As-built.md` — standalone, in **project-root `Archive/`** (survives milestone cleanup + `refresh_workspace`). An **AI / handoff reference, not a user-facing planning doc**. Seeded by a brownfield survey when the skill is first adopted on an existing project; updated at each Phase / milestone completion. It is a **curated current-state map + why/gotchas — NOT a change-log** (git already records raw changes).

```markdown
# [Game] — As-built log

> Running record of the world's implementation. Survives across milestones. ⚠️confirm = survey guess to verify with the user.

## Current state (by system)
| System | Built | Where (key files) | Notes / gotchas |
|---|---|---|---|
| [system] | [@Logic / @Component / .model / .ui / dataset] | [folder · file] | [deviations · gotchas · ⚠️confirm] |

## Standing issues & handoff rules   (update in place — never re-append)
| Issue / rule | Workaround / rule | Count | First → last seen |
|---|---|---|---|
| [recurring issue or standing handoff rule] | [what to do when it hits] | 2 | [mm-dd] → [mm-dd] |

## Log   (entries: the ACTIVE milestone only + ONE summary per completed milestone)
### [date] Seed — surveyed on toolkit adoption   (brownfield only)
[what the survey found · ⚠️confirm items]
### [date] Milestone M<n> complete — summary
[≤15 lines: what shipped · standing deviations · pointers to archived GDD / regression docs]
### [date] Phase N complete
[≤15 lines: what/why/gotchas]
```

**Writing guide**
- Keep "Built / Where" to a *map* (point to files), not copied code — code is the real artifact; this is the index + the *why/gotchas* the code doesn't state.
- **State scope precisely — including what was NOT done**: write "removed 3 samples from `RectTileMapTemplate.map` (other maps untouched)", never just "samples removed". A scope-less entry reads as project-wide and later becomes a false "already done" that downstream checks inherit.
- Update only at controlled moments (Phase / milestone completion, or brownfield seed) — **not per edit**. A stale As-built misleads worse than none.
- **Entry cap (~15 lines)**: a Log entry records *what / why / gotchas* only. Verify evidence, log dumps, and file-change lists do NOT belong here — git and the regression docs keep those. "Concise" failed as a soft word; treat the cap as the rule.
- **Recurring issues update in place — never re-append**: when an issue recurs (same symptom + same root cause + same fix), do NOT write a new Log entry restating it — update its **Standing issues** row instead: increment Count, refresh last-seen, refine the workaround wording only if something new was learned. Same symptom with a *different* root cause = a new row (link the old one). **Count ≥ 3 is an escalation trigger**: stop re-applying the workaround silently and propose a root-cause task to the user (a checklist item or roadmap entry). A standing handoff rule discovered once (e.g. a cache-regen procedure) also lives here, not in per-entry prose.
- **Milestone compaction (at milestone-complete cleanup)**: compress that milestone's Log entries into ONE `M<n> complete — summary` entry (≤15 lines) and delete the per-Phase/per-fix entries — git, the archived GDD, and the regression docs keep the detail. The Log therefore holds: the seed entry, one summary per completed milestone, and the active milestone's entries.
- **Size guardrail**: if this file exceeds **~500 lines / ~30KB** at any controlled moment, compact on sight (run the milestone compaction + Standing-issues dedup). The file must stay readable in **one full Read** — the resume flow depends on reading it whole; an As-built too big to read whole silently truncates the next session's knowledge of the world.
- **Scope of update-in-place**: this rule applies to As-built ONLY. The GDD's §9 Plan-changes log stays append-only — never rewrite decision history.
- The next milestone's GDD is planned **on top of** this file's current state **plus the milestone roadmap's next slot** (`Docs/<game>-Roadmap.md`).
