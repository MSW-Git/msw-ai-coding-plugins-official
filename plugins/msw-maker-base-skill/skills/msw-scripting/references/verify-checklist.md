# Verify Checklist — Final Verification Before Completion

Perform this checklist after modifying or creating `.mlua` files, **immediately before** reporting "done" to the user.
Provides the **final PASS/FAIL criteria** to be used alongside the playtest/debug workflow in Section 17.

Run it **once per turn, covering every change made this turn in one runtime cycle** — never one play cycle per todo or per file. Plant all `[VRF]` markers while implementing, then collect evidence for all of them in a single play session. Only a FAIL verdict restarts the cycle.

---

## Core Principle

> **"No errors ≠ Pass."**
> Even if the log shows no errors, it is a FAIL if there is no **positive evidence (positive log evidence)** that the intended logic actually executed.
> That is why you plant `log()` calls during implementation — prefixed **`[VRF]`**, e.g. `log("[VRF] wave spawned n=3")` — at `OnBeginPlay` entry, branch results, key variable values, and event order. One shared prefix lets a single scoped log read collect every piece of evidence.

---

## Step 1 — Runtime Execution (Maker MCP)

Call in order:

0. **First cycle of a session only**: `maker_get_current_map` — require `status` `ok`, and the returned `name`/`id` to equal a `map/<name>.map` file and its root entity id (`ContentProto.Entities[0].id`). Anything else → stop and ask the user to open this world in Maker: a Maker holding another world answers every tool `ok` with clean logs (false PASS). A **copied** workspace passes this check with the same ids — if fresh `[VRF]` logs then never appear in Step 3, ask the user which world Maker has open instead of looping refresh. Re-check only after a Maker restart or a suspected world switch.
1. `stop` — reset state
2. `clear_logs` — remove previous output (isolate current output)
3. `refresh` — sync file changes to the runtime
4. `logs(kind="build")` — check build log; if errors exist, fix and restart from step 1
5. `play` — enter play mode
6. Wait a few seconds, then `logs(kind="normal")` — collect runtime output. Scope the read as narrowly as the tool schema allows (severity / filters); the `[VRF]` lines plus any errors are all Step 3 needs. The `OnBeginPlay` `[VRF]` marker doubles as the boot signal — if it has not appeared yet, you read too early: read again instead of concluding failure.

Retain the raw logs for Step 3.

**Reproduce scenarios with the fewest tool calls** — every call is a full model round-trip and its output stays in context for the rest of the session:

- When the scenario can be driven programmatically, prefer **one `maker_execute_script` probe** that drives the scenario and emits the `[VRF]` evidence over a chain of `keyboard_input` / `mouse_input` calls. Simulate real input only when the input path itself is what you are verifying.
- Do not re-collect logs you already have; keep every `logs` read scoped (see step 6).
- `screenshot` is never routine verification — log evidence decides PASS/FAIL (screenshot only for coordinate targeting or on explicit user request).

---

## Step 2 — Code Review Checklist

Check every modified/created file against **every item** below. A file you wrote or already read in full this session is in context — do **not** re-read it. Re-`Read` only files that are not fully in context (never loaded, or lost to compaction).

### General
- [ ] **Logic correctness** — Does it match what the user requested?
- [ ] **ExecSpace** — Is `@ExecSpace` correct? (Server/Client/ServerOnly/ClientOnly)
- [ ] **Override ExecSpace match** — When overriding a parent method (`extends`), does the child's `@ExecSpace` **byte-match** the parent? If the parent has no `@ExecSpace` (e.g. `AttackComponent.CalcDamage`/`IsAttackTarget`/`IsHitTarget`), the override must also **omit** `@ExecSpace`. Otherwise → LEA-3014 `SignatureMismatch` at play time. Detail: [`msw-scripting/SKILL.md`](../SKILL.md) §9 "Method override".
- [ ] **Entity existence** — Do referenced entities actually exist? Are `nil` guards in place?
- [ ] **Event wiring** — Are events connected for both existing and future entities/players?
- [ ] **Edge cases** — Concurrent players, mid-spawn/destroy entry, map transition handling?
- [ ] **Performance** — No heavy operations or DataStorage calls inside `OnUpdate`/short timers?
- [ ] **Completeness** — Is every part of the request implemented?

### MSW-Specific Checks
- [ ] Does the `origin` field in `.model` reference an **actually existing model**?
- [ ] When accessing `Values` arrays, is matching done by **`Name` field** rather than index?
- [ ] Does `SpriteRendererComponent` have a valid **`SpriteRUID`**?
- [ ] Does the Body component **match the map's `TileMapMode`**? (MapleTile↔Rigidbody / RectTile↔Kinematicbody / SideViewRectTile↔Sideviewbody)
- [ ] When calling `SpawnService`, is **`parent` a non-nil** map entity?
- [ ] Are **custom scripts NOT declared directly in `.model`**, and instead attached via `entity:AddComponent("name")` immediately after spawn?
- [ ] Is `ConnectEvent` called **only from Entity/Logic/Service** (not Component), with the returned handler stored in a `property any`?
- [ ] Do DataStorage calls follow the **cache → dirty check → debounce flush** pattern? No individual Set/Get inside loops?
- [ ] At typed-enum parameter slots (e.g. `GetSortedAndWait(SortDirection sortDirection, ...)`), is an **enum member** (`SortDirection.Descending`) passed, not an integer literal (`1`)? The runtime tolerates the int form, but `mlua-diagnose` rejects it as a type mismatch.

### File & Path Checks
- [ ] New `.mlua` → `RootDesk/MyDesk/`, new `.model` → `RootDesk/MyDesk/Models/`, `.map` → `map/`, `.ui` → `ui/`?
- [ ] Is `Environment/` left unmodified, with no **new** files created or files deleted under `Global/`? (Existing `Global/*.model` files may be edited in place through `ModelBuilder` + Maker Refresh.)
- [ ] Are `.codeblock` files left unmodified?

---

## Step 1b — Tool limitations to know during runtime checks

- **`mouse_input` simulator does not fire `KeyDownEvent` for mouse buttons.** Only `ScreenTouchEvent` is emitted. PC right-click code paths bound to `KeyDownEvent` + `KeyboardKey.Mouse1` cannot be regression-tested through the simulator — verify those on a real PC build instead. Listening to both `ScreenTouchEvent` and `KeyDownEvent` simultaneously is the standard pattern: the simulator validates the `ScreenTouchEvent` path while the real PC covers the `KeyDownEvent` path; they do not double-fire.

---

## Step 2b — Short-lived visual elements

`keyboard_input → screenshot` runs 1–4 s end-to-end; any element with lifetime ≤ 2 s (damage popups, toasts, hit flashes, brief particles) often expires before capture. An empty screenshot looks identical to a real bug.

- [ ] `[VRF]` `log()` at create AND destroy sites — paired logs prove it ran even when the screenshot misses it.
- [ ] Temporarily extend lifetime to ≥ 5 s for the verify round only, then revert before reporting PASS.
- [ ] Verify on the production show/hide path — don't swap to `Enable` / `Visible` toggles to "make capture easier".
- [ ] When a screenshot IS available (user-requested), judge it for playfield readability too — does new UI/VFX obscure the play area or overlap other HUD elements? — not just for the element's presence.

---

## Step 3 — Log Evidence Verification

For the logs collected in Step 1:

- [ ] **Zero build errors** (`logs(kind="build")`) — re-confirm after play
- [ ] Is there a **`[VRF]` line for every checkpoint planted this turn** (entry, branch results, values, event order) — across **all** of the turn's changes, not just the last one?
- [ ] Are values the **expected values**, not nil/0/empty string?
- [ ] Were logs printed on the **correct side** (Server/Client)?
- [ ] If a `[VRF]` log at a critical checkpoint is **missing** — return to the Implement step, add it, then re-run from Step 1. Cannot PASS without log evidence.

---

## Step 4 — Final Verdict

| Verdict | Condition | Next Action |
|---------|-----------|-------------|
| **PASS** | All checks OK + concrete log evidence that the feature worked | Report to user. Mark Verify todo as `completed` |
| **FAIL** | Any check failed or evidence insufficient | Fix the cause → re-run from Step 1 |

---

## Step 5 — When Unresolvable

Only guide the user here when local implementation, Maker MCP, and `msw-search` have all failed:

> I could not find a solution through local implementation, Maker MCP, or Guide documents.
> You can get help from the MapleStory Worlds official Discord community:
> **https://discord.com/invite/maplestoryworlds**
