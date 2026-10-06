# Decision Sheet — the web view for design-shaping gates

Read this **in full before writing `Docs/web/decision-data.json` or running the packer**. [`SKILL.md`](../SKILL.md) STEP 5 decides *whether* a gate gets a sheet; everything about *how* lives here.

The sheet **briefs and collects** — it shows what each option actually builds and what it postpones. **The answer always happens in chat** (clicked, typed, or pasted). The flow must never block when a browser can't open.

---

## 1. What ships, and where things live

| Artifact | Path | Who writes it |
|---|---|---|
| The form | [`assets/msw-decision-sheet.html`](../assets/msw-decision-sheet.html) (skill base dir, shown when the skill loads) | **Fixed asset — never edit** |
| The packer | [`assets/build-status-data.cjs`](../assets/build-status-data.cjs) | **Fixed asset — never edit** |
| Deployed form | `<project>/Docs/web/DecisionSheet.html` | the packer (self-heals every run) |
| Gate data | `<project>/Docs/web/decision-data.json` | **you**, per gate |

**Hard rules**

- **The form and the packer are fixed assets — never edit them.** They ship with the skill and are redeployed by the packer on every run, so a local change is overwritten anyway.
- **`decision-data.json` is yours to write** — one fresh file per gate, plain JSON. The form **fetches and parses** it; it is never executed, so a file that was tampered with or built with a quoting mistake can only fail to parse. It is a **disposable presentation package**: regenerate it freely, but never hand-edit it after writing, and **never read it back as planning input**. Markdown (GDD · roadmap · phase docs) is the single source of truth; no planning decision or state is ever sourced from a web view.
- All web artifacts live under `Docs/web/` — never the project root, never `RootDesk/`. **The packer creates that folder**, so on a first gate run it before writing the data file (§3); nothing else creates the directory for you.
- `Docs/web/` is **generated output, not a plan document**. One packer run rebuilds everything in it, the names are fixed (nothing piles up across gates or sessions), so deleting the folder costs nothing.
- Never mention the markdown docs inside web-view content.

---

## 2. Opening the view

⚠️ **Before running the packer, check your own tool list for a tool that opens a page INSIDE the app** — an in-app browser or preview pane (e.g. `preview_start`, a Browser pane; the tell is that it renders a page in a panel beside the chat instead of shelling out to the OS). Do this check **every time** and never assume you have none — silently taking the OS-browser path while a pane is available is a failure, not a safe default.

⚠️ **The page must be served over http, both ways.** The form reads its gate data with `fetch`, and browsers refuse that read for a page opened straight off the disk — a `file://` sheet shows "open this through the local server" and nothing else. So **always run the packer with `--serve`**; the only difference between ① and ② is where you open the printed address.

### ① Pane available — preferred

```
node "<skill base>/assets/build-status-data.cjs" "<project root>" --serve
```

Run it **in the background** (it stays running), then open the printed `http://127.0.0.1:<port>/DecisionSheet.html` in the pane.

- ⚠️ **Never point an in-app pane at the local `file://` path.** Besides the fetch block above, those panes render local files as an opaque `data:` snapshot, so nothing beside the page itself resolves.
- Use the pane's **preview/open** entry point for the localhost URL — a plain "navigate" may be policy-blocked.
- The server is throwaway: `Docs/web` only, bound to `127.0.0.1`, and it dies with the session.

### ② No in-app pane — the OS browser

Same command as ①, still with `--serve`. Then open **the printed `http://127.0.0.1:<port>/DecisionSheet.html`** — not the file on disk — in the OS default browser. **On Windows the command depends on the shell you are actually in:**

| Shell / OS | Command |
|---|---|
| PowerShell | `Start-Process "<url>"` |
| cmd.exe or Git Bash | `start "" "<url>"` |
| macOS | `open "<url>"` |
| Linux | `xdg-open "<url>"` |

In PowerShell `start` is an alias for `Start-Process`, which reads the `""` as an empty program name and fails — so the cmd form is **not** portable. Check which shell you are in before picking.

**If the server cannot start at all** (every port refused), say so and fall back to asking the questions in chat with the tradeoffs written into each option (§4) — do not send the user to the `.html` file, which can only show the "serve me" message.

---

## 3. The gate data

**Order matters on a first gate: run the packer BEFORE writing the data.** `Docs/web/` does not exist in a fresh project, and the packer is what creates it (§2). Run it, then write the file into the folder it made, then open the printed address — the sheet shows its empty state for the moment in between and picks the gate up on its own within seconds.

Write `Docs/web/decision-data.json` — **plain JSON**, no `window.` assignment and no trailing commas. This is a complete valid file; copy it and replace the values:

```json
{
  "gateId": "m1-direction-01",
  "lang": "ko",
  "title": "방향 확정 — 기획서를 쓰기 직전 마지막 확인",
  "context": "이미 정해진 것: PC 우선 · 솔로 플레이.\n맵 타입은 한 번 정하면 지형·이동·충돌이 통째로 따라옵니다.\n여기서 확정하면 바로 기획서를 씁니다.",
  "generatedAt": "2026-08-12",
  "allowNote": true,
  "questions": [
    {
      "id": "Q1",
      "question": "핵심 루프를 무엇으로 잡을까요?",
      "context": "한 판이 30초~2분이면 재미 검증이 빠릅니다.",
      "multiSelect": false,
      "recommended": "A",
      "options": [
        {
          "id": "A",
          "label": "전투 → 보상 → 성장",
          "tagline": "물량 처치감 우선",
          "visual": "topdown",
          "emoji": "⚔️",
          "summary": [
            "몬스터 웨이브",
            "자동 공격 1종"
          ],
          "firstBuild": "1맵 + 몬스터 1종 + 자동 공격",
          "effort": "medium",
          "tradeoff": "몬스터·전투 작업이 늘어납니다.",
          "samples": "메소 워리어"
        },
        {
          "id": "B",
          "label": "탐험 → 수집 → 강화",
          "tagline": "느긋한 진행",
          "visual": "topdown",
          "emoji": "🧭",
          "summary": [
            "넓은 맵",
            "수집물"
          ],
          "firstBuild": "1맵 + 수집물 3종",
          "effort": "low",
          "tradeoff": "초반 몰입이 약합니다.",
          "samples": "—"
        }
      ]
    }
  ],
  "inputs": [
    {
      "key": "name",
      "label": "게임 이름",
      "placeholder": "예: 단풍 던전",
      "required": false,
      "hint": "나중에 바꿔도 됩니다"
    },
    {
      "key": "must",
      "label": "꼭 넣고 싶은 것",
      "placeholder": "떠오르는 대로",
      "multiline": true
    }
  ]
}
```

**Content is in the user's language.** One entry in `questions` per question — a single-question gate is just one entry.

### Field reference

| Field | Type | Required | What it does |
|---|---|---|---|
| `gateId` | string | **yes** | Identifies **this** gate. Every paste block carries it, and that is the only way to tell a current answer from one pasted out of a stale tab (§5). Make it new for every gate you open — never reuse one. |
| `lang` | string | **always set it** | The language code you are writing in (`"ko"`, `"en"`, …). The form's own chrome is **English by default** and switches to a shipped translation when one matches; a language with no table simply stays English, so a missing translation never blocks a gate. Without `lang` the form falls back to the *browser's* language, which is often not the one you wrote in. |
| `title` | string | yes | The gate's headline. |
| `context` | string | recommended | **2–4 short lines separated by `\n`**, one idea per line (what is already fixed / why these candidates / why it must be decided now). It renders as-is, so never one long run-on paragraph. |
| `generatedAt` | string | optional | Shown in the footer. |
| `allowNote` | boolean | optional (default `true`) | Adds the gate-wide "extra notes" box. |
| `questions[]` | array | **yes** | One entry per question. A gate that declares none is refused (§6). |
| `questions[].id` | string | yes | Short, unique in the gate (`"Q1"`). Appears in the paste so an answer maps to a question even if the wording repeats. |
| `questions[].question` | string | yes | The question itself. |
| `questions[].context` | string | optional | Same line rules as the gate `context`. |
| `questions[].multiSelect` | boolean | optional | `true` → the user may pick several. |
| `questions[].recommended` | string | optional | An option `id` to mark as recommended. Must match one. |
| `options[].id` | string | **yes** | Unique within the question. `"__delegate"` and `"__custom"` are reserved by the form. |
| `options[].label` | string | yes | The card's title. |
| `options[].tagline` | string | optional | One short line under the title. |
| `options[].visual` | enum | optional | `topdown` · `sideview` · `maple` · `boardui` · `systems` — a small schematic in the card's visual box. `none` = no visual box at all (any `emoji` is then ignored). |
| `options[].emoji` | string | optional | The card's visual when no schematic fits: drawn large in the visual box **when `visual` is unset or unrecognized**. There is no slot beside the id badge. |
| `options[].summary` | string[] | optional | "if you pick this, you build…" bullets. |
| `options[].firstBuild` | string | optional | The first playable result of this choice. |
| `options[].effort` | enum | optional | `low` · `medium` · `high`. |
| `options[].tradeoff` | string | **REQUIRED per option** | What picking this postpones or gives up. It is the information a text-only choice always loses, and the reason this gate exists. |
| `options[].samples` | string | optional | Similar games. |
| `inputs[].key` | string | yes | Machine key, unique in the gate; it appears in the paste. `"__note"` is reserved. |
| `inputs[].label` | string | yes | Shown above the box. |
| `inputs[].placeholder` | string | optional | |
| `inputs[].required` | boolean | optional | Blocks the whole-gate copy until filled. |
| `inputs[].hint` | string | optional | Small text under the box. |
| `inputs[].multiline` | boolean | optional | Starts the box three rows tall across the full width — set it whenever the field invites a list ("everything that comes to mind"). Every field grows as the user types either way. |

**Single-line rule.** Ids and keys (`gateId`, `questions[].id`, `options[].id`, `inputs[].key`) must not contain line breaks — each anchors one line of every paste block, and the sheet **refuses the gate** otherwise (§6). Free text that shares those lines (`question`, `options[].label`, `inputs[].label`) has any line break **collapsed to a space** by the sheet, on screen and in the paste alike. Multi-line prose belongs in the `context` fields, which render as-is and never enter a paste block.

**Don't author the escapes.** The form adds two to every question by itself — a **delegate** one ("🤝 You decide this one") and a **free-text** one ("✏️ My answer isn't listed"). Never tell the user the options are exhaustive.

### ⚠️ One axis per question

Options must cover the plausible answers. When a question secretly merges two independent axes (platform × player-count, scope × theme), some real combinations silently disappear — merge platform with player-count and "PC only, solo" can end up unpickable. Split the axes into separate questions, or make the option set cover the combinations.

---

## 4. The sheet and the chat must not drift

Run the packer, open the view (§2), **and ask the SAME questions in chat at the same moment.**

- ⚠️ **Same questions, same order, letter-for-letter matching `id`/`label`s.** Don't number the questions yourself (`"1) …"`) — the sheet numbers them.
- **Split the roles: the sheet compares, the chat picks.** With the sheet open, each chat option carries **one short line — just enough to tell the cards apart** (~40 chars is plenty). What it builds, the tradeoff, effort and similar games are already on the card, laid out far better than a picker can; repeating them makes the user read the same paragraph twice, and it keeps the tool call small (an oversized payload risks being rejected as unparsable and retried, which the user sees as a stall).
  **Exception — when the sheet could not be opened** (no browser, blocked pane, server failed): the chat is the only place the user can see anything, so put the **tradeoff into each option's description as well**. Choosing without knowing what a pick postpones is exactly what this gate exists to prevent.
- ⚠️ **Ask every question on the sheet — your picker's per-call limit is not a limit on the gate.** Multiple-choice UIs cap how many questions one call may carry, and **the cap differs per agent** (Claude Code's `AskUserQuestion` takes 4 — a hard schema limit; other agents differ, and some have no picker at all and use prose). Ask as many questions as the gate genuinely needs; when the batch exceeds **your** UI's cap, ask the first batch, and **the moment it is answered, immediately ask the rest in a follow-up call** — repeat until every sheet question has actually been asked. **A question that stays on the sheet but is never asked silently drops that axis.** Before leaving a gate, check the sheet's question count against the number you actually asked.
- **If you do split, make the seam visible** — the user is reading the sheet, where all N questions sit side by side. Silence after the last question of a batch reads as "the flow ended," and the next batch then looks like a surprise. So **(1) say it up front** when you open the gate — *"There are N questions; the chat can't show them all at once, so they come in batches"* (in the user's language) — and **(2) bridge at the seam immediately**, in one line, before the next call — *"Got those. Here are the remaining M."* Never leave the seam unnarrated. Use your own numbers, and **skip this entirely if your UI asks them all at once** — don't quote another agent's limit.
- **Replacing the data updates an open sheet by itself** — a second or two after the file changes the sheet notices, swaps to the new gate, scrolls back to its first question and says so in the bar pinned to the bottom of the page. ⚠️ **Write the gate BEFORE you ask, never after**: the sheet cannot show a file that is not there yet, and a user who answers the moment your question appears would otherwise be reading the *previous* gate's cards. You don't need to send the user hunting for the Refresh button at the top; a one-line heads-up that the next question is on the sheet is enough. Two things the watcher deliberately will **not** do, so don't rely on them: it ignores a **single** missing or half-written read — replacing a gate briefly deletes the file, and one bad poll must not blank the page — and it waits until the user stops typing before swapping. ⚠️ **A run of them is a state, not a pause**: missing **twice in a row** closes the gate to the empty state (§7), and **three** unreadable reads **in a row** take it off the screen as broken (§6). "In a row" counts only reads that actually reach the file — a missing read restarts the unreadable count, and a read that could not reach the file at all (dead server) moves neither counter. Pressing 🔄 Refresh reads authoritatively: it shows the result at once, from any state, and restarts both counters. A tab that was left in the background, or one the watcher could not reach, can still be showing an older gate — §5's gate-id check is what stops that answer from landing.
- **Expect the chat picker to present the questions as steps** (one at a time) even when you ask them in a single call. That is fine — the sheet gives each question its own copy button ("📋 Copy this item"), so the user answers step by step. What you must NOT do is drift: never ask a question that isn't on the sheet, and never reorder them. **Don't open a *new* batch while the current one is unanswered** — but once it is answered, continuing with the remaining sheet questions is exactly right, not a violation.

### `inputs` belong to the whole gate, not to any one question

The sheet solves the timing two ways: values already filled **ride along with the last question's copy** (one paste carries the question block *and* the input block), and the write-in card always has its own copy button.

- **Accept the input block whenever it arrives** — before, between, after, or appended to a question block — and just record the values.
- A value the user wrote across several lines arrives as `key · label:` followed by `- item` lines. **Treat every one of those lines as part of that field**, never just the first. ⚠️ **This is the one rule for every multi-line free text**, not just inputs — a note and a written-in answer continue the same way. **A `- item` line always belongs to the value above it**; it is never a new answer, never a new field, and never a header, however much it looks like one. That is exactly why it exists: without it, a user whose note says `Q2 · … → X. …` would silently answer a question they never touched.
- ⚠️ **Close the gate ON the inputs, don't drift past them.** A stepped chat ends at the last question, so a user who fills the input fields late is left with no turn to send them. When the final question's answer arrives, if the gate declared `inputs` and no input block has come, **ask for them in one short turn** (point at the write-in card's copy button) before moving on. Never proceed on invented values, and never silently drop a declared input.

---

## 5. The three paste shapes — all authoritative

**Every block carries the `gateId`**, and each line carries the question `id` or the input `key`. **The header follows the gate's `lang`**, English by default (the `ko` form is shown after each). You set `lang`, so you know which wording to expect — but accept either.

| Shape | Header | Body |
|---|---|---|
| One question | `[Planning answer n/N · gate <gateId>]` / `[기획 선택 응답 n/N · gate <gateId>]` | `Qid · question → id. label`, optionally `note: …` / `메모: …` |
| Inputs only | `[Planning answer · inputs · gate <gateId>]` / `[기획 선택 응답 · 입력 · gate <gateId>]` | `key · label: value` |
| Whole gate | `[Planning answer · gate <gateId>]` / `[기획 선택 응답 · gate <gateId>]` | every question as `n) Qid · question → id. label`, an optional indented note line, then the input values |

**Anything the user typed can run to several lines, and every one of them uses the same shape**: the label alone on its line, then one `- item` per line. An input becomes `key · label:` + `- item` lines; a note becomes `note:` / `메모:` + `- item` lines (indented in the whole-gate shape); a written-in answer keeps its first line on the answer line and continues as `- item` beneath it.

Example of the one-question shape:

```
[기획 선택 응답 1/2 · gate m1-direction-01]
Q1 · 핵심 루프를 무엇으로 잡을까요? → A. 전투 → 보상 → 성장
메모: 타격감이 제일 중요합니다
```

**Reading an answer**

- ⚠️ **Check the gate id first.** If the block's `gate <id>` is not the gate you currently have open, it came from a **stale tab** — an earlier gate still sitting in another window. **Do not apply it**: it would re-answer something already settled, and if the values differ it silently overturns a decision the plan is already built on. Say which gate it belongs to, point at 🔄 Refresh, and re-ask only what the *current* gate still needs. A block with **no** gate id at all came from an older sheet — treat it the same way.
- **Map by the question `id`, then the question text — never by position.**
- ⚠️ **A line starting with `- ` is never a line of the protocol.** It continues whatever value sits above it, verbatim. A header, an arrow, a `key:` — anything a user quoted into their own text — arrives bulleted precisely so it cannot be mistaken for the sheet talking.
- A block answers exactly the questions it names — **never re-ask those**, even if their chat prompts are still pending. If a whole-gate block arrives at the first step, treat the remaining steps as already answered: say so in one line and move on.
- `(delegated — go with the recommendation)` / `(맡김 — 추천안대로)` — a picked-nothing answer. Decide it yourself and **state what you chose**.
- `(not in the options · written in) …` / `(보기에 없음 · 직접 답변) …` — **a real answer the options failed to cover.** Take it as given and adapt the plan to it; never push the user back toward the nearest card. If it changes what the other options assumed, say so in one line.

---

## 6. When the sheet says it can't be answered

The form validates the gate **before drawing it** and refuses to be answered when something essential is missing — no `gateId`, a `gateId` carrying a line break or a `]` (it is printed inside every paste header and would split it), a question id, option id or input key carrying a line break (each anchors one paste line), a question with no options, an option with no `id` or no `tradeoff`, duplicate ids, a `recommended` matching nothing, an option id colliding with the form's own escapes, or gate data the browser could not read or could not parse. It lists the problems at the top and **disables every copy button**, rather than quietly dropping the question.

An **open** sheet arrives there on its own as well: after **three** unreadable reads in a row (about five seconds — a file being written recovers long before that) it takes the questions down and says the file cannot be read. It reports that from whatever it was showing, the empty state included, so a gate you wrote badly never sits behind a screen that says "nothing to choose". Rewrite the file correctly and the sheet picks it up by itself; if the gate is identical to the one it removed, the answers already given are still there.

If the user reports that state, do **not** open the file and patch it — a data file is never hand-edited (§1). Correct the gate definition and **write `decision-data.json` again from scratch**, exactly as you did the first time, then ask the user to press **🔄 Refresh**. Don't work around it by asking in chat only: the same defect would reach the next gate.

---

## 7. Close the gate when it's answered

`decision-data.json` describes an **open** question. Once you have taken the answer and reflected it (GDD / roadmap / next step), **delete `Docs/web/decision-data.json`**.

Leaving it means a user who reopens the sheet later sees an already-decided question with live copy buttons, and answers it again. **A sheet that is still open follows the deletion by itself**: after two missing reads in a row — a few seconds, since one alone is ignored (§4) — it clears to its empty state ("Nothing to choose right now."), which is the truth between gates. That holds whatever it was showing, including an error left over from an earlier broken file. Deleting is safe — the next gate writes a fresh one, and nothing else reads this file.
