// msw-decision-pane: msw-planning's decision sheet, drawn as a Claude Code pane.
//
// The skill writes Docs/web/decision-data.json at a design-shaping gate. This
// mod watches that file, draws the gate in a pane beside the chat, and sends
// the person's answer back as the sheet's own whole-gate paste block, so the
// session reads it exactly as references/decision-sheet.md §5 describes. No
// packer, no local server, no browser, no clipboard.
//
// The pane walks the gate one question at a time: picking a card moves on to
// the next question, the step row and the back button return to any earlier
// one, and a last review page lists every answer before it is sent.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement } from 'claude-code'

import type { BuildItem, BuildMilestone, BuildModel, BuildPhase, BuildView, SheetGate, SheetGateData, SheetOption, SheetQuestion } from '../types'
import {
  CARD_FRAME,
  CUSTOM,
  DELEGATE,
  PIXEL_SIZES,
  answerText,
  captionFor,
  composeAll,
  effortLabel,
  emojiSvg,
  sizedSvg,
  emptyAnswers,
  fill,
  isAnswered,
  missingRequired,
  packCells,
  paneColumnsFor,
  pictureSizeFor,
  cardShapeFor,
  ROW_CARDS_MIN,
  rowPictureFor,
  rowTextFor,
  type RowText,
  pixelScene,
  pixelWords,
  readGate,
  stringsFor,
  type Strings,
  svgFor,
  toggle,
  unanswered,
} from './sheet'
import { fitScene, own, paintScene, paintSceneFine, sceneProps, sceneSvg } from './scene'
import {
  EMPTY_BUILD,
  type BuildAction,
  type BuildFiles,
  buildModel,
  buildStrings,
  currentPhase,
  defaultTab,
  itemMenu,
  bandLine,
  nextStep,
  tabLabel,
  taskName,
} from './status'

const PANE = 'msw-decision'
const PLUGIN = 'msw-decision-pane'
/* why the pane last waited undrawn, as Claude Code said it ("unasked below 144 columns (120 now): ..."), for the band */
let waitReason = ''
/* the shape the terminal pane last drew, which the toggle flips */
let drawnShape: 'upright' | 'row' = 'upright'
const COMMAND = 'decision-sheet'
const DATA_TAIL = /(^|[\\/])Docs[\\/]web[\\/]decision-data\.json$/i
/* the surfaces that have drawn the pane in this load: the terminal's keyboard needs the focus ring to move */
const paneSurfaces = new Set<string>()
const POLL_MS = 1500
/* a card's content width where the picture is an SVG (desktop, mobile): the medium picture's */
const SVG_CARD_COLUMNS = PIXEL_SIZES.medium.columns
/* a desktop picture asks for this width in CSS pixels and is drawn as wide as its card up to it: a wider pane
   (the app's expand button) grows the pictures with the cards, six screen pixels a pixel at most */
const DESKTOP_PICTURE_PX = 960

const EMPTY_GATE: SheetGate = { status: 'empty', path: '', mtimeMs: 0, problems: [], data: null }
const gate = atom({ plugin: 'msw-decision-pane', key: 'gate' } as const, EMPTY_GATE)
const answers = atom({ plugin: 'msw-decision-pane', key: 'answers' } as const, emptyAnswers(''))
const waiting = atom({ plugin: 'msw-decision-pane', key: 'waiting' } as const, false)
/* the card shape the person chose with the toggle, kept in their store so later sessions keep it */
const cardShape = atom({ plugin: 'msw-decision-pane', key: 'shape' } as const, 'auto' as 'auto' | 'upright' | 'row')
const SHAPE_KEY = 'cardShape'
/* where cards lie on their side the gate's context folds away, so three cards fit one screen; the person unfolds it */
const contextOpen = atom({ plugin: 'msw-decision-pane', key: 'contextOpen' } as const, false)

/* The build-status pane: msw-planning's build docs read into `build`, re-read when they change. It only reads;
   its buttons send a request into the chat and Claude changes the docs by the skill's rules. */
const STATUS_PANE = 'msw-build'
/* the fields of an open change box and of the box at the bottom; not `b:` keys, so a desktop click into one is not
   taken for a button press */
const CHANGE_INPUT = 'change-input'
const IDEA_INPUT = 'idea-input'
const STATUS_COMMAND = 'build-status'
const BUILD_POLL_MS = 4000
const DOC_TAIL = /(^|[\\/])(Docs|Archive)[\\/][^\\/]+\.md$/i
const build = atom({ plugin: 'msw-decision-pane', key: 'build' } as const, EMPTY_BUILD)
/* a main-loop turn runs: the pane offers no step to start meanwhile, so requests do not pile up behind it */
const busy = atom({ plugin: 'msw-decision-pane', key: 'busy' } as const, false)
/* the task the pane started the running turn for, named while it runs */
const running = atom({ plugin: 'msw-decision-pane', key: 'running' } as const, '')
/* that turn asks the person in the chat (AskUserQuestion) and waits on them: the pane offers its steps again */
const asking = atom({ plugin: 'msw-decision-pane', key: 'asking' } as const, false)
/* the main loop's running turn, which a press made while it asks withdraws */
let mainTurn = ''
const buildView = atom({ plugin: 'msw-decision-pane', key: 'buildView' } as const, { tab: '', item: '', idea: '', ideaKind: '', armed: '', editing: '', change: '' } as BuildView)
/* the session is working with msw-planning once it has read the skill: from then on, with a roadmap, a band above
   the prompt shows where the build stands and opens the pane */
const planningSeen = atom({ plugin: 'msw-decision-pane', key: 'planningSeen' } as const, false)
/* the build-status pane is drawn, so the band steps aside */
const buildShown = atom({ plugin: 'msw-decision-pane', key: 'buildShown' } as const, false)
const SKILL_FILE = /(^|[\\/])msw-planning[\\/]SKILL\.md$/i
let buildReading = false
const statusSurfaces = new Set<string>()

// The watcher's own bookkeeping; a reload starts it over, which is harmless.
let watchPath = ''
let missing = 0
let unreadable = 0
let polling = false

const isAbsolute = (p: string) => /^([A-Za-z]:[\\/]|[\\/])/.test(p)
function joinPath(dir: string, rel: string): string {
  const sep = dir.includes('\\') ? '\\' : '/'
  return dir.replace(/[\\/]+$/, '') + sep + rel.replace(/[\\/]+/g, sep)
}

/** Reads the watched file into `gate`. `force` re-reads an unchanged file; answers what `gate` holds after. */
async function poll($: EngineInterface, opts: { force?: boolean; announce?: boolean } = {}): Promise<SheetGate> {
  const prev = await read($, gate)
  if (polling || !watchPath) return prev
  polling = true
  try {
    const path = watchPath
    const st = await $.fs.stat(path).catch(() => undefined)
    if (!st || st.kind !== 'file') {
      missing += 1
      unreadable = 0
      /* one missing read is a gate being replaced; two in a row is a closed gate */
      if (missing < 2 && !opts.force) return prev
      const wasOpen = prev.status === 'open' || prev.status === 'broken'
      const next: SheetGate = { ...EMPTY_GATE, path, status: wasOpen || prev.status === 'closed' ? 'closed' : 'empty' }
      if (prev.status !== next.status || prev.path !== path) {
        await update($, gate, () => next)
        if (wasOpen) $.clock.after(2500, () => closeIfSettled($))
      }
      return next
    }
    missing = 0
    const isSame = st.mtimeMs === prev.mtimeMs && prev.path === path && (prev.status === 'open' || prev.status === 'broken')
    if (isSame && !opts.force) return prev

    let raw: unknown
    try {
      const body = await $.fs.read(path)
      raw = JSON.parse(typeof body === 'string' ? body : '')
    } catch (err) {
      unreadable += 1
      /* a file caught mid-write recovers on the next read; three in a row is broken */
      if (unreadable < 3 && !opts.force) return prev
      const said = /^ko\b/i.test(prev.data?.lang ?? '') ? '파일을 읽거나 해석할 수 없어요' : 'the file could not be read or parsed'
      const next: SheetGate = {
        ...EMPTY_GATE,
        path,
        mtimeMs: st.mtimeMs,
        status: 'broken',
        problems: [`${said}: ${String((err as Error)?.message ?? err).slice(0, 140)}`],
      }
      await update($, gate, () => next)
      return next
    }
    unreadable = 0

    const { data, problems } = readGate(raw)
    const next: SheetGate = { status: data && !problems.length ? 'open' : 'broken', path, mtimeMs: st.mtimeMs, problems, data }
    await update($, gate, () => next)
    const held = await read($, answers)
    if (data && data.gateId && data.gateId !== held.gateId) {
      await update($, answers, () => emptyAnswers(data.gateId))
      if (opts.announce) {
        await openPane($, data)
        $.ui.toast(stringsFor(data.lang).arrived)
      }
    }
    return next
  } finally {
    polling = false
  }
}

async function closeIfSettled($: EngineInterface): Promise<void> {
  const now = await read($, gate)
  if (now.status === 'closed') await $.ui.close({ id: PANE })
}

/* The system-prompt section that tells the session, before its first gate,
   that the pane is here. references/decision-sheet.md §2 ⓪ keys on its first
   words, so keep them as they are. */
const ACTIVE_ID = 'msw-decision-pane:active'
const ACTIVE_TEXT =
  "msw-decision-pane is active: this Claude Code session shows msw-planning's decision sheet in a native pane beside the chat. " +
  'At a gate that opens the sheet, follow references/decision-sheet.md §2 ⓪: write Docs/web/decision-data.json and stop there. ' +
  'No packer, no browser, no chat picker; the pane opens by itself and sends the answer back as the whole-gate paste block.'

/** Whether a surface that draws panes is attached: the same test that tells the session the pane is active, so a
    session never told (-p, an SDK host) is never held to the pane's picture rule. */
async function drawsPanes($: EngineInterface): Promise<boolean> {
  return (await $.session.surfaces().catch((): readonly string[] => [])).length > 0
}

/** Why a gate write is refused before it lands: some card would show no picture of its own. Undefined lets it through. */
function refusalFor(content: unknown): string | undefined {
  let raw: unknown
  try {
    raw = JSON.parse(typeof content === 'string' ? content : '')
  } catch {
    return undefined
  }
  const { problems, pictures } = readGate(raw)
  if (!pictures.length) return undefined
  const others = problems.filter(p => !pictures.includes(p))
  return [
    '[msw-decision-pane] Not written: in the pane every option of every question shows a picture composed from its own "scene", and these would not:',
    ...pictures.map(p => `- ${p}`),
    ...(others.length ? ['Also fix:', ...others.map(p => `- ${p}`)] : []),
    'Give each listed option a scene (references/decision-scene-kit.md: a kit backdrop, kit parts or shapes, emoji only as accents). An abstract choice is drawn as the situation it creates, so no option is exempt. Then write the whole file again.',
  ].join('\n')
}

/** The one line a gate-file write draws in the transcript in place of the file it wrote (the pane shows the
    questions); undefined for any other tool result, which draws as the engine draws it. */
function gateRowText(output: unknown, isErrored: boolean): string | undefined {
  if (isErrored) {
    const said = typeof output === 'string' ? output : JSON.stringify(output ?? '')
    if (!said.includes('[msw-decision-pane] Not written')) return undefined
    return stringsFor(/[가-힣]/.test(said) ? 'ko' : 'en').gateRefused
  }
  if (!output || typeof output !== 'object') return undefined
  const o = output as { filePath?: unknown; content?: unknown }
  if (typeof o.filePath !== 'string' || !DATA_TAIL.test(o.filePath)) return undefined
  let raw: { lang?: unknown; questions?: unknown } | undefined
  try {
    raw = typeof o.content === 'string' ? JSON.parse(o.content) : undefined
  } catch {
    raw = undefined
  }
  const s = stringsFor(typeof raw?.lang === 'string' ? raw.lang : undefined)
  const n = Array.isArray(raw?.questions) ? raw.questions.length : 0
  return n ? fill(s.gateWritten, { n }) : s.gateEdited
}

/** Whether a pane that was not placed waits only for width: the person's own ask opens it at any width. */
function waitsForWidth(reason: string | undefined): boolean {
  return /below \d+ (terminal )?columns/i.test(reason ?? '')
}

/** Opens (or retitles) the pane and remembers whether it waits undrawn, which the band above the prompt then
    offers to open: an open answering the person's press or command is placed at any width. */
/* The pane asks for one width whatever the gate, so it looks the same from one gate to the next. On the terminal
   that is more columns than any dock gives: Claude Code holds a docked pane to its own share of the terminal, so it
   opens as wide as that share allows (a width the person dragged the dock to still wins). Elsewhere it is the width
   of three cards side by side. */
const FULL_DOCK_COLUMNS = 999
const STEADY_COLUMNS = 3 * (SVG_CARD_COLUMNS + CARD_FRAME) + (3 - 1) + 2

async function openPane($: EngineInterface, data: SheetGateData | null, opts: { focus?: boolean } = {}) {
  const surfaces = await $.session.surfaces().catch((): readonly string[] => [])
  const isTerminalOnly = surfaces.length > 0 && surfaces.every(s => s === 'terminal')
  const opened = await $.ui.open({
    id: PANE,
    title: stringsFor(data?.lang).paneTitle,
    columns: isTerminalOnly ? FULL_DOCK_COLUMNS : STEADY_COLUMNS,
    ...(opts.focus ? { focus: true as const } : {}),
  })
  waitReason = opened.isPlaced ? '' : opened.reason
  await update($, waiting, () => !opened.isPlaced)
  return opened
}

/** What the band offers for a pane waiting on width. Below the 144 columns an unasked pane needs, a press both
    opens it and lets later gates open by themselves (Claude Code places an unasked pane from 110 columns once the
    person has opened it); already allowed and still too narrow (under 110), it only opens it. */
function bandOffer(s: Strings, reason: string): { label: string; why: string } {
  const short = widthShortfall(reason)
  /* the numbers only choose the offer: they are Claude Code's, change with its updates, and are never shown */
  if (short && short.need <= 110) return { label: s.openPane, why: s.bandNarrow }
  return { label: s.allowAuto, why: s.bandHint }
}

/** The floor a waiting pane fell under and the terminal's width now, read from Claude Code's reason. */
function widthShortfall(reason: string): { need: number; now: number } | undefined {
  const hit = /below (\d+) (?:terminal )?columns \((\d+) now/i.exec(reason)
  return hit ? { need: Number(hit[1]), now: Number(hit[2]) } : undefined
}

/** What the session reads after it wrote the gate file. */
function noteFor(g: SheetGate, isPlaced: boolean, reason: string | undefined): string {
  const tag = '[msw-decision-pane]'
  if (!isPlaced && waitsForWidth(reason))
    return [
      `${tag} The pane waits undrawn: this terminal is narrower than a pane opened unasked may take (${reason}).`,
      `A band above the prompt now offers the person a button, "${bandOffer(stringsFor(g.data?.lang), reason ?? '').label}", that opens it at any width.`,
      "Do not run the packer, open a browser, or ask these questions in chat. End your turn with one short line, in the user's language, asking them to press that button above the prompt (or to type /decision-sheet); once opened it opens by itself from then on. Do not quote column counts or width thresholds: they are Claude Code's and change with its updates. At most, say a wider terminal shows the pane more comfortably.",
    ].join(' ')
  if (!isPlaced)
    return `${tag} The native pane could not be shown for this gate (${reason ?? 'not placed'}): no surface here draws panes. Fall back to references/decision-sheet.md §2 ①/② for this gate: run the packer with --serve (it keeps the file you wrote), open the page, and ask the questions in chat as §4 says.`
  if (g.status !== 'open' || !g.data)
    return `${tag} The pane shows this gate as unanswerable: ${g.problems.join('; ') || 'no gate in the file'}. Write Docs/web/decision-data.json again from scratch with these fixed (decision-sheet.md §6). Do not run the packer or open a browser: the pane re-reads the file by itself.`
  const id = g.data.gateId
  return [
    `${tag} Gate "${id}" is open in the native decision pane (decision-sheet.md §2 ⓪).`,
    "Do not run the packer, open a browser, or ask these questions in chat (no AskUserQuestion, no prose list). End your turn with one short line, in the user's language, pointing them to the pane.",
    `The answer arrives as the whole-gate paste block "[… · gate ${id}]": read it exactly as §5 says, gate id first. Delete the file once the answer is reflected (§7); the pane closes itself.`,
  ].join(' ')
}

// ---------- what the pane's controls do ----------

/* A new page starts at the top, where the step row and the Back / Next buttons are. */
function toTop($: EngineInterface) {
  return $.ui.scroll({ in: PANE, to: 'start' }).catch(() => undefined)
}

/** Picks or unpicks a card; a finished pick on a one-answer question moves on to the next page. */
async function pickOption($: EngineInterface, q: SheetQuestion, id: string, index: number) {
  let isMoving = false
  await update($, answers, cur => {
    if (cur.sentAt) return cur
    const picked = toggle(q, own(cur.sel, q.qid) ?? [], id)
    isMoving = !q.multiSelect && picked.length > 0 && !picked.includes(CUSTOM)
    return { ...cur, sel: { ...cur.sel, [q.qid]: picked }, step: isMoving ? index + 1 : index }
  })
  if (isMoving) await toTop($)
}

async function goTo($: EngineInterface, step: number) {
  await update($, answers, cur => ({ ...cur, step }))
  await toTop($)
}

function setText($: EngineInterface, field: 'notes' | 'custom' | 'vals', key: string, value: string) {
  return update($, answers, cur => (cur.sentAt ? cur : { ...cur, [field]: { ...cur[field], [key]: value } }))
}

/** Enter in a written-in answer keeps it and, when it says something, moves on. */
async function submitCustom($: EngineInterface, qid: string, value: string, nextStep: number) {
  await update($, answers, cur =>
    cur.sentAt ? cur : { ...cur, custom: { ...cur.custom, [qid]: value }, step: value.trim() ? nextStep : cur.step },
  )
  if (value.trim()) await toTop($)
}

function unlock($: EngineInterface) {
  return update($, answers, cur => ({ ...cur, sentAt: 0 }))
}

/** The answer, when it is complete; otherwise toasts what is missing and answers undefined. */
async function ready($: EngineInterface): Promise<{ data: SheetGateData; text: string } | undefined> {
  const now = await read($, gate)
  const cur = await read($, answers)
  if (!now.data || now.status !== 'open' || now.data.gateId !== cur.gateId) return undefined
  const s = stringsFor(now.data.lang)
  const left = unanswered(now.data, cur)
  if (left.length) {
    const total = now.data.questions.length
    $.ui.toast(fill(s.progress, { done: total - left.length, total }) + fill(s.remaining, { list: left.map(q => q.qid).join(', ') }))
    return undefined
  }
  const req = missingRequired(now.data, cur)
  if (req.length) {
    $.ui.toast(fill(s.needRequired, { list: req.map(i => i.label).join(', ') }))
    return undefined
  }
  return { data: now.data, text: composeAll(now.data, cur) }
}

async function sendAnswer($: EngineInterface): Promise<void> {
  const got = await ready($)
  if (!got) return
  await $.prompt.submit({ text: got.text, asUser: true })
  await update($, answers, cur => ({ ...cur, sentAt: Date.now() }))
}

/* A desktop click reaches the plugin as a focus move onto the button, and its press is lost to the redraw that
   move brings: the focus move acts, and a late press of the same button that echoes it is let go. */
let echo = { key: '', at: 0 }

/** What a press on one of the pane's Buttons does, by its key: a Button's own press and a desktop click's focus
    move both land here. */
async function act($: EngineInterface, key: string, via: 'press' | 'focus'): Promise<void> {
  if (via === 'press' && key === echo.key && Date.now() - echo.at < 1500) {
    echo = { key: '', at: 0 }
    return
  }
  if (via === 'focus') echo = { key, at: Date.now() }
  const d = (await read($, gate)).data
  if (!d) return
  if (key === 'edit') return unlock($).then(() => undefined)
  if (key === 'context') return update($, contextOpen, isOpen => !isOpen).then(() => undefined)
  if (key === 'shape') {
    const next = drawnShape === 'row' ? 'upright' : 'row'
    await update($, cardShape, () => next)
    await $.store.set(SHAPE_KEY, next).catch(() => undefined)
    return
  }
  if (key === 'send' || key === 'top:send') return sendAnswer($)
  const a = await read($, answers)
  const total = d.questions.length
  const step = Math.min(Math.max(a.gateId === d.gateId ? (a.step ?? 0) : 0, 0), total)
  if (key === 'prev') return step > 0 ? goTo($, step - 1) : undefined
  if (key === 'next') return step < total ? goTo($, step + 1) : undefined
  if (key === 'step:review') return goTo($, total)
  for (const [i, q] of d.questions.entries()) {
    if (key === `step:${i}` || key === `change:${q.qid}`) return goTo($, i)
    if (key === `d:${q.qid}`) return pickOption($, q, DELEGATE, i)
    if (key === `c:${q.qid}`) return pickOption($, q, CUSTOM, i)
    const o = q.options.find(op => key === `o:${q.qid}:${op.id}`)
    if (o) return pickOption($, q, o.id, i)
  }
}

const lines = (txt: string) => txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

// ---------- the build-status pane ----------

/** Reads the build docs into `build` when their names or times changed (`force` re-reads them anyway): the
    roadmap in Docs/, its game's GDDs and Phase docs there, the archived GDDs and As-built.md in Archive/. */
async function loadBuild($: EngineInterface, opts: { force?: boolean } = {}): Promise<BuildModel> {
  const prev = await read($, build)
  if (buildReading) return prev
  buildReading = true
  try {
    const cwd = await $.session.cwd()
    const docsDir = joinPath(cwd, 'Docs')
    const archiveDir = joinPath(cwd, 'Archive')
    const isMd = (f: { name: string; kind: string }) => f.kind === 'file' && /\.md$/i.test(f.name)
    const docs = (await $.fs.list(docsDir).catch(() => [])).filter(isMd)
    const archive = (await $.fs.list(archiveDir).catch(() => [])).filter(isMd)
    const roadmap = docs.filter(f => /-Roadmap\.md$/i.test(f.name)).sort((x, y) => y.mtimeMs - x.mtimeMs)[0]
    if (!roadmap) {
      if (prev.status !== 'none') await update($, build, () => EMPTY_BUILD)
      return EMPTY_BUILD
    }
    const slug = roadmap.name.replace(/-Roadmap\.md$/i, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const gddName = new RegExp(`^${slug}-M(\\d+)-GDD\\.md$`, 'i')
    const phaseName = new RegExp(`^${slug}-M(\\d+)-Phase(\\d+)\\.md$`, 'i')
    const inDocs = docs.filter(f => f === roadmap || gddName.test(f.name) || phaseName.test(f.name))
    const inArchive = archive.filter(f => gddName.test(f.name) || /^As-built\.md$/i.test(f.name))
    const stamp = [...inDocs.map(f => `D/${f.name}:${f.mtimeMs}`), ...inArchive.map(f => `A/${f.name}:${f.mtimeMs}`)].sort().join('|')
    if (stamp === prev.stamp && !opts.force) return prev
    const text = async (dir: string, name: string) => {
      const body = await $.fs.read(joinPath(dir, name)).catch(() => '')
      return typeof body === 'string' ? body : ''
    }
    const files: BuildFiles = { roadmap: await text(docsDir, roadmap.name), gdds: [], phaseDocs: [], archived: [], asBuilt: '', stamp }
    for (const f of inDocs) {
      const g = gddName.exec(f.name)
      const p = phaseName.exec(f.name)
      if (g) files.gdds.push({ m: Number(g[1]), text: await text(docsDir, f.name) })
      if (p) files.phaseDocs.push({ m: Number(p[1]), n: Number(p[2]), text: await text(docsDir, f.name) })
    }
    for (const f of inArchive) {
      const g = gddName.exec(f.name)
      if (g) files.archived.push({ m: Number(g[1]), text: await text(archiveDir, f.name) })
      else files.asBuilt = await text(archiveDir, f.name)
    }
    const model = buildModel(files)
    await update($, build, () => model)
    /* the roadmap just written in a session planning with msw-planning (a new game's plan settled): its build shows
       beside the chat, unasked, so only where there is room for it */
    if (prev.status !== 'ok' && model.status === 'ok' && (await read($, planningSeen))) await openStatus($).catch(() => undefined)
    return model
  } catch {
    return prev
  } finally {
    buildReading = false
  }
}

async function openStatus($: EngineInterface, opts: { focus?: boolean } = {}) {
  const m = await read($, build)
  const surfaces = await $.session.surfaces().catch((): readonly string[] => [])
  const isTerminalOnly = surfaces.length > 0 && surfaces.every(s => s === 'terminal')
  return $.ui.open({
    id: STATUS_PANE,
    title: buildStrings(m.lang).paneTitle,
    columns: isTerminalOnly ? FULL_DOCK_COLUMNS : STEADY_COLUMNS,
    ...(opts.focus ? { focus: true as const } : {}),
  })
}

/** msw-planning taken up (loaded, or its SKILL.md read): the session plans with it from now on, and a roadmap's build
    shows beside the chat, unasked. A roadmap this read finds for the first time is opened by loadBuild itself. */
async function takeUpPlanning($: EngineInterface): Promise<void> {
  await update($, planningSeen, () => true)
  const hadRoadmap = (await read($, build)).status === 'ok'
  const m = await loadBuild($)
  if (hadRoadmap && m.status === 'ok') await openStatus($).catch(() => undefined)
}

/** Whether a decision gate waits for the person's answer, which comes before any next step. */
async function gateIsOpen($: EngineInterface): Promise<boolean> {
  const g = await read($, gate)
  const a = await read($, answers)
  return !!g.data && g.status === 'open' && !(a.gateId === g.data.gateId && a.sentAt > 0)
}

/** A turn runs that the pane waits out: one asking the person in the chat waits on them, and the pane may answer it. */
async function holdsSteps($: EngineInterface): Promise<boolean> {
  return (await read($, busy)) && !(await read($, asking))
}

/** Carries out a step the pane offers: opens the decision pane, drafts into the prompt box, or sends a request
    into the chat as the person's own, naming the task while its turn runs. Pressed while Claude asks in the chat,
    the press is the answer: the question is withdrawn with its turn, and the request comes next. */
async function runBuildAction($: EngineInterface, action: BuildAction | undefined): Promise<void> {
  if (!action) return
  if (action.opensGate) {
    await openPane($, (await read($, gate)).data, { focus: true })
    return
  }
  if ((await read($, asking)) && mainTurn) await $.turn.abort({ turnId: mainTurn }).catch(() => undefined)
  if (action.draft !== undefined) {
    await $.prompt.fill({ text: action.draft }).catch(() => undefined)
    return
  }
  if (!action.prompt) return
  await update($, running, () => action.running ?? '')
  await $.prompt.submit({ text: action.prompt, asUser: true })
}

/** Sends what the person wrote about the plan as a whole: a new task for this milestone, or something for later (a
    change of the plan's direction is no button: the person asks for it in the chat); while a turn runs it waits for
    its end. While Claude asks in the chat it is held,
    the draft kept: free text is no answer to that question, and it must not slip in behind it. A button pressed on an
    empty box only says where the next words go: the field takes the keys, and Enter sends them there. */
async function sendIdea($: EngineInterface, when: 'now' | 'later', via: 'button' | 'enter'): Promise<void> {
  const m = await read($, build)
  const view = await read($, buildView)
  const s = buildStrings(m.lang)
  const text = view.idea.trim()
  if (!text) {
    if (via === 'enter') {
      $.ui.toast(s.ideaEmpty)
      return
    }
    await update($, buildView, v => ({ ...v, ideaKind: when }))
    void $.ui.focus({ requestId: STATUS_PANE, key: IDEA_INPUT }).catch(() => undefined)
    return
  }
  if (await read($, asking)) {
    $.ui.toast(s.ideaAsking)
    return
  }
  const prompt = when === 'now' ? fill(s.pIdeaNow, { m: m.active, text }) : fill(s.pIdeaLater, { text })
  await update($, buildView, (v): BuildView => ({ ...v, idea: '', ideaKind: '' }))
  if (await read($, busy)) $.ui.toast(s.ideaQueued)
  await $.prompt.submit({ text: prompt, asUser: true })
}

/** Enter in the box at the bottom: the words go where a button said; with none pressed yet, the person is asked to
    choose. */
async function submitIdea($: EngineInterface, value: string): Promise<void> {
  await update($, buildView, v => ({ ...v, idea: value }))
  const view = await read($, buildView)
  const m = await read($, build)
  const kind = view.ideaKind === 'now' && m.active === 0 ? '' : view.ideaKind
  if (kind) return sendIdea($, kind, 'enter')
  if (value.trim()) $.ui.toast(buildStrings(m.lang).ideaPick)
}

let buildEcho = { key: '', at: 0 }

/** What a press on one of the build-status pane's Buttons does, by its key (all start `b:`). */
async function buildAct($: EngineInterface, key: string, via: 'press' | 'focus'): Promise<void> {
  if (!key.startsWith('b:')) return
  if (via === 'press' && key === buildEcho.key && Date.now() - buildEcho.at < 1500) {
    buildEcho = { key: '', at: 0 }
    return
  }
  if (via === 'focus') buildEcho = { key, at: Date.now() }
  if (key === 'b:refresh') return loadBuild($, { force: true }).then(() => undefined)
  /* a drop pressed once, and a change box left open, are forgotten once the person looks elsewhere */
  const away = { armed: '', editing: '', change: '' }
  if (key.startsWith('b:tab:')) return update($, buildView, v => ({ ...v, ...away, tab: key.slice(6), item: '' })).then(() => undefined)
  if (key.startsWith('b:item:')) {
    const id = key.slice(7)
    return update($, buildView, v => ({ ...v, ...away, item: v.item === id ? '' : id })).then(() => undefined)
  }
  if (key === 'b:idea:now' || key === 'b:idea:later') return sendIdea($, key === 'b:idea:now' ? 'now' : 'later', 'button')
  const m = await read($, build)
  /* a step is offered only while no turn runs, or one waits on the person: one that gets here late does nothing */
  if (await holdsSteps($)) return
  if (key === 'b:primary' || key === 'b:secondary') {
    const step = nextStep(m, { busy: false, running: '', gateOpen: await gateIsOpen($) })
    return runBuildAction($, key === 'b:primary' ? step.primary : step.secondary)
  }
  const [, verb, id] = /^b:(do|edit|change|suggest|cancel|defer|drop):(.+)$/.exec(key) ?? []
  const it = id ? currentPhase(m)?.items.find(x => x.id === id) : undefined
  if (!it) return
  const s = buildStrings(m.lang)
  const menu = itemMenu(it, s)
  if (verb === 'do') return runBuildAction($, menu.does)
  if (verb === 'defer') return runBuildAction($, menu.defer)
  /* the change box opens under the task, its field taking the keys so the person can type at once */
  if (verb === 'edit') {
    const isOpen = (await read($, buildView)).editing === it.id
    await update($, buildView, v => ({ ...v, armed: '', editing: isOpen ? '' : it.id, change: '' }))
    if (!isOpen) void $.ui.focus({ requestId: STATUS_PANE, key: CHANGE_INPUT }).catch(() => undefined)
    return
  }
  if (verb === 'cancel') return update($, buildView, v => ({ ...v, editing: '', change: '' })).then(() => undefined)
  if (verb === 'change' || verb === 'suggest') {
    const text = (await read($, buildView)).change.trim()
    if (verb === 'change' && !text) {
      $.ui.toast(s.changeEmpty)
      return
    }
    /* written words are no answer to a question Claude asks in the chat: held, the box and its draft kept, as the box
       at the bottom holds its own; a suggestion asked for is a step, and answers in place of the question */
    if (verb === 'change' && (await read($, asking))) {
      $.ui.toast(s.ideaAsking)
      return
    }
    await update($, buildView, v => ({ ...v, editing: '', change: '' }))
    return runBuildAction($, verb === 'change' ? menu.change(text) : menu.suggest)
  }
  /* a drop takes a second press: the first only asks for it */
  if ((await read($, buildView)).armed !== it.id) return update($, buildView, v => ({ ...v, armed: it.id })).then(() => undefined)
  await update($, buildView, v => ({ ...v, armed: '' }))
  return runBuildAction($, menu.drop)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: COMMAND,
      description: 'Show the msw-planning decision sheet (Docs/web/decision-data.json) in a pane',
      argumentHint: '[path to decision-data.json]',
    })
    const chosen = await $.store.get(SHAPE_KEY).catch(() => undefined)
    if (chosen === 'upright' || chosen === 'row') await update($, cardShape, () => chosen)
    const saved = await read($, gate)
    watchPath = saved.path || joinPath(await $.session.cwd(), 'Docs/web/decision-data.json')
    missing = 0
    unreadable = 0
    const first = await poll($, { announce: false }).catch(() => saved)
    const held = await read($, answers)
    if (first.status === 'open' && first.data && !(held.gateId === first.data.gateId && held.sentAt)) {
      /* a reload finds the pane already drawn: nothing waits, nothing to say */
      const isDrawn = (await $.ui.panes().catch(() => [])).some(p => p.id === PANE && p.isPlaced)
      if (!isDrawn) $.ui.toast(stringsFor(first.data.lang).waitingAtStart)
      await update($, waiting, () => !isDrawn)
    }
    $.clock.every(POLL_MS, () => poll($, { announce: true }).catch(() => undefined))
    await $.command.register({
      name: STATUS_COMMAND,
      description: "Show the msw-planning build's status (roadmap, milestones, the current Phase) in a pane",
    })
    await loadBuild($).catch(() => undefined)
    $.clock.every(BUILD_POLL_MS, () => loadBuild($).catch(() => undefined))
    return next(e)
  })

  on('command.run', { command: STATUS_COMMAND }, async ($, e) => {
    const m = await loadBuild($, { force: true })
    const s = buildStrings(m.lang)
    const opened = await openStatus($, { focus: true })
    return { text: opened.isPlaced ? s.paneTitle : `${s.paneTitle}: ${opened.reason ?? 'not placed'}` }
  })

  // msw-planning loaded (a resume, "what's next", a planning step): the session works with it from now on, and where a
  // roadmap exists its build shows beside the chat. Unasked, so Claude Code places it only where the terminal is wide
  // enough; the band above the prompt and /build-status open it anywhere.
  on('skill.prompt', async ($, e, next) => {
    const expanded = await next(e)
    if (/(^|:)msw-planning$/.test(e.skill)) await takeUpPlanning($)
    return expanded
  }).catch(($, e, next) => next(e))

  // The pane closed (by the person, or with the session): the band comes back.
  on('ui.close', async ($, e, next) => {
    const closed = await next(e)
    if (e.id === STATUS_PANE) await update($, buildShown, () => false)
    return closed
  }).catch(($, e, next) => next(e))

  // A main-loop turn running holds back the steps the pane offers; its end re-reads the docs it may have changed.
  on('turn.start', async ($, e, next) => {
    const started = await next(e)
    if (e.agentId === undefined) {
      mainTurn = e.turnId
      await update($, busy, () => true)
      await update($, asking, () => false)
    }
    return started
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const ended = await next(e)
    if (e.agentId === undefined) {
      mainTurn = ''
      await update($, busy, () => false)
      await update($, asking, () => false)
      await update($, running, () => '')
      await loadBuild($).catch(() => undefined)
    }
    return ended
  }).catch(($, e, next) => next(e))

  // Claude asks the person in the chat, and its turn waits on them: the pane's steps come back meanwhile.
  on('tool.call', { tool: 'AskUserQuestion' }, async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    await update($, asking, () => true)
    try {
      return await next(e)
    } finally {
      await update($, asking, () => false)
    }
  }).catch(($, e, next) => next(e))

  // Tell the session up front, so its first gate skips the packer instead of learning after the write.
  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    /* nothing draws a pane in a run no surface attaches to (-p, an SDK host) */
    if (!e.surfaces.length || composed.sections.some(s => s.id === ACTIVE_ID)) return composed
    return { sections: [...composed.sections, { id: ACTIVE_ID, text: ACTIVE_TEXT, scope: 'session' as const }] }
  }).catch(($, e, next) => next(e))

  on('command.run', { command: COMMAND }, async ($, e) => {
    const arg = e.args.trim().replace(/^"(.*)"$/, '$1')
    if (arg) watchPath = isAbsolute(arg) ? arg : joinPath(await $.session.cwd(), arg)
    missing = 0
    unreadable = 0
    const g = await poll($, { force: true, announce: false })
    const s = stringsFor(g.data?.lang)
    const opened = await openPane($, g.data, { focus: true })
    return {
      text: opened.isPlaced ? `${s.paneTitle} · ${watchPath}` : `${s.paneTitle}: ${opened.reason ?? 'not placed'}`,
    }
  })

  // A click on a card's picture (hooks/picture.tsx) picks that card, as its name button does.
  on('ui.message', async ($, e, next) => {
    const hit = /^pic:(\d+):(\d+)$/.exec(e.element)
    const isPick = (e.data as { pick?: unknown } | null)?.pick === true
    if (e.requestId !== PANE || !hit || !isPick) return next(e)
    const qIndex = Number(hit[1])
    const now = await read($, gate)
    const q = now.data?.questions[qIndex]
    const o = q?.options[Number(hit[2])]
    if (q && o) await pickOption($, q, o.id, qIndex)
    return next(e)
  }).catch(($, e, next) => next(e))

  // The session writes the gate file: show it at once and tell the session the pane has it.
  on('tool.call', async ($, e, next) => {
    const tool = String(e.tool)
    const path = String((e as { file_path?: unknown }).file_path ?? '')
    const isGateFile = (tool === 'Write' || tool === 'Edit' || tool === 'MultiEdit') && DATA_TAIL.test(path)
    /* a card with no picture of its own never reaches the pane: the write is refused before it lands, where a pane
       can be drawn at all */
    const refused = isGateFile && tool === 'Write' && (await drawsPanes($)) ? refusalFor((e as { content?: unknown }).content) : undefined
    if (refused) return { deny: refused }
    const ran = await next(e)
    /* a build doc written: the build-status pane shows it now, not at the next poll */
    const isDoc = (tool === 'Write' || tool === 'Edit' || tool === 'MultiEdit') && DOC_TAIL.test(path)
    if (isDoc && ran.deny === undefined && !ran.isError) await loadBuild($).catch(() => undefined)
    /* the skill read by its path rather than loaded: the session works with msw-planning all the same */
    if (tool === 'Read' && SKILL_FILE.test(path) && ran.deny === undefined && !ran.isError) await takeUpPlanning($).catch(() => undefined)
    if (!isGateFile || ran.deny !== undefined || ran.isError) return ran
    watchPath = isAbsolute(path) ? path : joinPath(await $.session.cwd(), path)
    missing = 0
    unreadable = 0
    const g = await poll($, { force: true, announce: false })
    const opened = await openPane($, g.data)
    const reason = opened.isPlaced ? undefined : opened.reason
    return { ...ran, context: [...(ran.context ?? []), noteFor(g, opened.isPlaced, reason)] }
  }).catch(($, e, next) => next(e))

  // A prompt the person enters is their own ask, and an open answering it is placed at any width: a pane still
  // waiting opens with their next message, whatever it says.
  on('prompt.submit', async ($, e, next) => {
    if (e.origin.kind === 'composer' && !e.command && (await read($, waiting))) {
      const g = await read($, gate)
      if (g.data && (g.status === 'open' || g.status === 'broken')) await openPane($, g.data).catch(() => undefined)
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  // The band above the prompt, one at a time. A decision pane waiting undrawn comes first: the band offers it, and a
  // press is the person's own ask, which opens it at any width. Otherwise, in a session working with msw-planning on a
  // game with a roadmap, a line says where the build stands, with a button that opens the build-status pane; it
  // steps aside while that pane is drawn.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const isWaiting = await read($, waiting)
    const g = await read($, gate)
    const a = await read($, answers)
    const d = g.data
    const isOpen = !!d && (g.status === 'open' || g.status === 'broken') && !(a.gateId === d.gateId && a.sentAt > 0)
    if (!isWaiting || !d || !isOpen) {
      const m = await read($, build)
      const line = bandLine(m)
      if (!line || !(await read($, planningSeen)) || (await read($, buildShown))) return next(e)
      const { Box, Text, Button } = $.ui.resolve(e)
      return (
        <Box flexDirection="row" flexWrap="wrap" alignItems="center" gap={2} paddingX={1}>
          <Text>{line}</Text>
          <Button key="b:band-open" label={buildStrings(m.lang).bandOpen} onPress={() => void openStatus($, { focus: true })} />
        </Box>
      )
    }
    const { Box, Text, Button } = $.ui.resolve(e)
    const s = stringsFor(d.lang)
    const offer = bandOffer(s, waitReason)
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box flexDirection="row" flexWrap="wrap" alignItems="center" gap={2}>
          <Text bold>{fill(s.waitingBand, { n: d.questions.length })}</Text>
          <Button key="open-pane" variant="primary" label={offer.label} onPress={() => void openPane($, d, { focus: true })} />
        </Box>
        <Text dimColor>{offer.why}</Text>
      </Box>
    )
  }).catch(($, e, next) => next(e))

  // A gate-file write draws one line in the transcript, not the JSON it wrote: the questions live in the pane.
  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
    const line = gateRowText(e.props.output, e.props.isErrored)
    if (!line) return next(e)
    const { Text } = $.ui.resolve(e)
    return <Text dimColor>{line}</Text>
  }).catch(($, e, next) => next(e))

  // On the desktop a click on a button reaches the plugin as a focus move onto it, and the press itself is lost:
  // a second click was needed. Where no terminal draws the pane (whose keyboard walks the ring with Tab, which
  // must not press) a person's move onto one of the pane's buttons acts as its press.
  on('ui.focus', { requestId: PANE }, async ($, e, next) => {
    const moved = await next(e)
    if (e.origin.kind === 'person' && e.plugin === PLUGIN && e.element && !moved.deny && !paneSurfaces.has('terminal'))
      await act($, e.element, 'focus').catch(() => undefined)
    return moved
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    paneSurfaces.add(e.surface)
    /* drawn, so not waiting: cleared just after this draw (a draw may not write state), which takes the band down */
    if (await read($, waiting)) $.clock.after(0, () => void update($, waiting, () => false))
    const els = $.ui.resolve(e)
    const { Box, Text, Button } = els
    /* decided by the surface itself: some builds hand every surface the whole table */
    const isTerminal = e.surface === 'terminal'
    const Input = e.surface !== 'mobile' && 'Input' in els ? els.Input : undefined
    const Svg = !isTerminal && 'Svg' in els ? els.Svg : undefined
    const Raster = isTerminal && 'Raster' in els ? els.Raster : undefined
    /* the terminal draws pictures in a Client region so a click on one picks its card */
    const Client = isTerminal && 'Client' in els ? els.Client : undefined
    const g = await read($, gate)
    const a = await read($, answers)
    const d = g.data
    const s = stringsFor(d?.lang)

    if (g.status === 'empty' || g.status === 'closed' || !d) {
      return (
        <Box flexDirection="column" gap={1} paddingX={1}>
          <Text bold>{g.status === 'closed' ? s.closedTitle : g.status === 'broken' ? s.brokenTitle : s.emptyTitle}</Text>
          {g.status === 'empty' && <Text dimColor>{s.emptyBody}</Text>}
          {g.status === 'broken' && g.problems.map(p => <Text color="error">{`• ${p}`}</Text>)}
          {g.path !== '' && <Text dimColor>{g.path}</Text>}
        </Box>
      )
    }

    if (a.gateId === d.gateId && a.sentAt > 0) {
      return (
        <Box flexDirection="column" gap={1} paddingX={1}>
          <Text bold color="success">{s.sentTitle}</Text>
          {lines(composeAll(d, a)).map(l => <Text dimColor>{l}</Text>)}
          <Button key="edit" label={s.edit} onPress={() => void act($, 'edit', 'press')} />
        </Box>
      )
    }

    const isBroken = g.status === 'broken'
    const total = d.questions.length
    /* the page shown: a question's index, or `total` for the review page */
    const step = Math.min(Math.max(a.gateId === d.gateId ? (a.step ?? 0) : 0, 0), total)
    const bodyColumns = e.props.bodyColumns
    /* the card shape: the automatic one for the width, or the person's own choice where both shapes fit (from
       ROW_CARDS_MIN columns; narrower, upright cards one under another is the only one that reads) */
    const canChooseShape = isTerminal && bodyColumns >= ROW_CARDS_MIN
    const chosenShape = await read($, cardShape)
    const shape: 'upright' | 'row' = !isTerminal ? 'upright' : canChooseShape && chosenShape !== 'auto' ? chosenShape : cardShapeFor(bodyColumns)
    if (isTerminal) drawnShape = shape
    const foldsContext = isTerminal && shape === 'row' && !!d && lines(d.context).length > 0
    const isContextOpen = await read($, contextOpen)

    /* the schematic as SVG where the surface draws it, a colour pixel scene on the terminal (pressable where a
       Client region can host it, a plain Raster otherwise), a caption under either. With `reserve` (a sibling
       card has a picture), a card without one keeps the same space, its emoji centred, so the texts line up. */
    function visual(q: SheetQuestion, o: SheetOption, qIndex: number, oIndex: number, size: 'small' | 'medium', reserve: boolean, isRow = false) {
      const { columns, rows } = PIXEL_SIZES[size]
      /* a recipe the session wrote for this card wins over the built-in schematics */
      if (o.scene) {
        /* the desktop paints the recipe four times finer; the terminal at its own half-block resolution */
        const terminalScene = () => sceneProps(size === 'small' ? fitScene(o.scene!, columns, rows * 2) : paintScene(o.scene!))
        const picture = Svg ? (
          <Svg source={sizedSvg(sceneSvg(paintSceneFine(o.scene)), DESKTOP_PICTURE_PX)} alt={o.label} />
        ) : Client ? (
          <Client key={`pic:${qIndex}:${oIndex}`} module="./picture.tsx" props={terminalScene()} width={columns} height={rows} />
        ) : undefined
        if (picture) {
          return (
            <Box flexDirection="column" flexShrink={0}>
              {picture}
              {!isRow && <Text dimColor>{' '}</Text>}
            </Box>
          )
        }
      }
      const hasOwn = o.visual !== 'none' && svgFor(o.visual) !== undefined
      if (!hasOwn) {
        const emoji = o.visual === 'none' ? '' : o.emoji
        if (!reserve) return emoji ? <Text>{emoji}</Text> : undefined
        return (
          <Box flexDirection="column" flexShrink={0}>
            {Svg ? (
              <Svg source={sizedSvg(emojiSvg(emoji), DESKTOP_PICTURE_PX)} alt={emoji || o.label} />
            ) : (
              <Box key={`blank:${q.qid}:${o.id}`} width={columns} height={rows} alignItems="center" justifyContent="center">
                <Text>{emoji || ' '}</Text>
              </Box>
            )}
            {!isRow && <Text dimColor>{' '}</Text>}
          </Box>
        )
      }
      const caption = captionFor(o.visual, d?.lang)
      const svg = svgFor(o.visual)
      const scene = !Svg && Client ? pixelScene(o.visual, size) : undefined
      const words = !Svg && !scene && Raster ? pixelWords(o.visual, size) : undefined
      const picture =
        svg && Svg ? (
          <Svg source={sizedSvg(svg, DESKTOP_PICTURE_PX)} alt={caption || o.visual} />
        ) : scene && Client ? (
          <Client key={`pic:${qIndex}:${oIndex}`} module="./picture.tsx" props={scene} width={columns} height={rows} />
        ) : words && Raster ? (
          <Raster key={`v:${q.qid}:${o.id}`} columns={columns} rows={rows} cells={packCells(words)} />
        ) : undefined
      if (!picture) return o.emoji ? <Text>{o.emoji}</Text> : undefined
      return (
        <Box flexDirection="column" flexShrink={0}>
          {picture}
          {caption !== '' && <Text dimColor>{caption}</Text>}
        </Box>
      )
    }

    /* One upright card: picture, then the option's name, then its sections set apart by blank
       lines and rules. Cards in a row stretch to the tallest, the footer kept at the bottom. */
    function card(
      q: SheetQuestion,
      o: SheetOption,
      index: number,
      oIndex: number,
      size: 'small' | 'medium',
      width: number,
      boxWidth: number | string,
      reserve: boolean,
      isRow = false,
    ) {
      const isOn = (own(a.sel, q.qid) ?? []).includes(o.id)
      const mark = q.multiSelect ? (isOn ? '☑' : '☐') : isOn ? '●' : '○'
      const rec = q.recommended === o.id ? `  ${s.recommended}` : ''
      const meta = [effortLabel(o.effort, s), o.samples ? s.samples + o.samples : ''].filter(Boolean).join('  ·  ')
      /* one card a row, on its side or upright in a narrow pane, keeps its text short: the rule right under the
         title, no effort line */
      const isCompact = isRow || (isTerminal && bodyColumns < ROW_CARDS_MIN)
      /* a card on its side rules its text column, beside the picture */
      const textColumns = isRow ? width - CARD_FRAME - PIXEL_SIZES[size].columns - 2 : width - CARD_FRAME
      const rule = '─'.repeat(Math.max(4, textColumns))
      const title = `${mark} ${o.id}. ${o.label}${rec}`
      /* on its side the card says the most that fits beside its picture, every line under a heading that names it */
      const wording: RowText = isRow ? rowTextFor({ ...o, title }, textColumns, PIXEL_SIZES[size].rows) : 'full'
      const lead = o.firstBuild || o.summary.join(' · ')
      const leadHeading = o.firstBuild !== '' ? s.firstBuild : `🎮 ${s.buildsSect}`
      return (
        <Box
          key={`card:${q.qid}:${o.id}`}
          flexDirection={isRow ? 'row' : 'column'}
          width={boxWidth}
          {...(isTerminal ? {} : { minWidth: 30 })}
          flexShrink={0}
          gap={isRow ? 2 : 1}
          paddingX={1}
          borderStyle={isOn ? 'bold' : 'round'}
          {...(isOn ? { borderColor: 'success' } : {})}
        >
          {visual(q, o, index, oIndex, size, reserve, isRow)}
          <Box flexDirection="column" flexGrow={1} flexShrink={1} gap={1}>
            <Box key={`head:${q.qid}:${o.id}`} flexDirection="column">
              <Button
                key={`o:${q.qid}:${o.id}`}
                label={title}
                {...(isOn ? { variant: 'primary' as const } : {})}
                onPress={() => void act($, `o:${q.qid}:${o.id}`, 'press')}
              />
              {o.tagline !== '' && <Text dimColor>{o.tagline}</Text>}
              {/* a compact card saves a line: the rule sits right under the title */}
              {isCompact && <Text dimColor wrap="truncate">{rule}</Text>}
            </Box>
            {!isCompact && <Text dimColor wrap="truncate">{rule}</Text>}
            {/* short of room, what the choice builds first and what it postpones, one line each, the heading in front */}
            {wording === 'inline' && (
              <Box flexDirection="column">
                {lead !== '' && (
                  <Box flexDirection="row" gap={1}>
                    <Text bold>{leadHeading}</Text>
                    <Text>{lead}</Text>
                  </Box>
                )}
                <Box flexDirection="row" gap={1}>
                  <Text bold color="warning">{s.tradeoff}</Text>
                  <Text color="warning">{o.tradeoff}</Text>
                </Box>
              </Box>
            )}
            {wording === 'labeled' && lead !== '' && (
              <Box flexDirection="column">
                <Text bold>{leadHeading}</Text>
                <Text>{lead}</Text>
              </Box>
            )}
            {wording === 'full' && o.summary.length > 0 && (
              <Box flexDirection="column">
                <Text bold>{s.buildsSect}</Text>
                {o.summary.map(x => <Text>{`· ${x}`}</Text>)}
              </Box>
            )}
            {wording === 'full' && o.firstBuild !== '' && (
              <Box flexDirection="column">
                <Text bold>{s.firstBuild}</Text>
                <Text>{o.firstBuild}</Text>
              </Box>
            )}
            {wording !== 'inline' && (
              <Box flexDirection="column">
                <Text bold color="warning">{s.tradeoff}</Text>
                <Text color="warning">{o.tradeoff}</Text>
              </Box>
            )}
            {/* a compact card keeps its text short: effort and similar games stay on the cards side by side */}
            {meta !== '' && !isCompact && (
              <Box flexDirection="column" flexGrow={1} justifyContent="flex-end">
                <Text dimColor wrap="truncate">{rule}</Text>
                <Text dimColor>{meta}</Text>
              </Box>
            )}
          </Box>
        </Box>
      )
    }

    function questionPage(q: SheetQuestion, index: number) {
      const picked = own(a.sel, q.qid) ?? []
      const isDelegated = picked.includes(DELEGATE)
      const isCustom = picked.includes(CUSTOM)
      const { size, width, cardWidth, escapeWidth, isRow } = rowLayout(q)
      const rec = q.options.find(o => o.id === q.recommended)
      /* when any card here has a picture, every card keeps a picture's room */
      const reserve = q.options.some(o => !!o.scene || (o.visual !== 'none' && svgFor(o.visual) !== undefined))
      const escapeCard = (kind: 'd' | 'c', isOn: boolean, title: string, body: RenderElement) => (
        <Box
          key={`ecard:${kind}:${q.qid}`}
          flexDirection="column"
          width={escapeWidth}
          flexShrink={0}
          gap={1}
          paddingX={1}
          borderStyle={isOn ? 'bold' : 'round'}
          {...(isOn ? { borderColor: 'success' } : {})}
        >
          <Button
            key={`${kind}:${q.qid}`}
            label={`${isOn ? '●' : '○'} ${title}`}
            {...(isOn ? { variant: 'primary' as const } : {})}
            onPress={() => void act($, `${kind}:${q.qid}`, 'press')}
          />
          {body}
        </Box>
      )
      return (
        <Box flexDirection="column" gap={1}>
          <Box flexDirection="column">
            <Box flexDirection="row" justifyContent="space-between" gap={2}>
              <Text dimColor>{`${fill(s.stepOf, { n: index + 1, total })}  ·  ${q.multiSelect ? s.modeMulti : s.modeSingle}`}</Text>
              {canChooseShape && (
                <Button key="shape" plain dimColor label={shape === 'row' ? s.shapeToUpright : s.shapeToRow} onPress={() => void act($, 'shape', 'press')} />
              )}
            </Box>
            <Text bold>{`${index + 1}. ${q.question}`}</Text>
            {lines(q.context).map(l => <Text dimColor>{l}</Text>)}
          </Box>
          <Box key={`cards:${q.qid}`} flexDirection="row" flexWrap="wrap" alignItems="stretch" gap={1}>
            {q.options.map((o, oIndex) => card(q, o, index, oIndex, size, width, cardWidth, reserve, isRow))}
          </Box>
          <Box key={`escapes:${q.qid}`} flexDirection="row" flexWrap="wrap" alignItems="stretch" gap={1}>
            {escapeCard(
              'd',
              isDelegated,
              s.delegate,
              rec ? (
                <Box flexDirection="column">
                  <Text dimColor>{s.delegateRec}</Text>
                  <Text>{`${s.recommended}  ${rec.id}. ${rec.label}`}</Text>
                </Box>
              ) : (
                <Text dimColor>{s.delegateAny}</Text>
              ),
            )}
            {escapeCard(
              'c',
              isCustom,
              s.custom,
              Input && isCustom ? (
                <Input
                  key={`ci:${q.qid}`}
                  placeholder={s.customPh}
                  value={own(a.custom, q.qid) ?? ''}
                  onInput={v => void setText($, 'custom', q.qid, v)}
                  onSubmit={v => void submitCustom($, q.qid, v, index + 1)}
                />
              ) : (
                <Text dimColor>{s.customHint}</Text>
              ),
            )}
          </Box>
        </Box>
      )
    }

    function sendButton(key: string, isReady: boolean) {
      if (isTerminal && isReady)
        return (
          <Button key={key} variant="primary" label={s.send} onPress={() => void act($, key, 'press')}>
            <Text bold inverse color="success">{` ${s.send} `}</Text>
          </Button>
        )
      return <Button key={key} variant="primary" label={s.send} onPress={() => void act($, key, 'press')} />
    }

    /* A question's card row: the size that puts most of its cards on one row, one width for every card so they
       line up, and the escape cards' width, half the row each. */
    function rowLayout(q: SheetQuestion): {
      size: 'small' | 'medium'
      width: number
      cardWidth: number | string
      escapeWidth: number | string
      isRow: boolean
    } {
      if (isTerminal && shape === 'row') {
        /* one or two upright cards a row: list them on their side instead, each the pane's full width */
        const full = Math.max(16, bodyColumns - 2)
        return { size: rowPictureFor(bodyColumns, e.props.scroll.bodyRows), width: full, cardWidth: full, escapeWidth: Math.floor((full - 1) / 2), isRow: true }
      }
      /* one card size for the whole gate, set by the pane's width alone (the size that puts three in a row), so a
         two-option question shows the same cards as a five-option one */
      const size = pictureSizeFor(bodyColumns, 3)
      const content = isTerminal ? PIXEL_SIZES[size].columns : SVG_CARD_COLUMNS
      const width = Math.max(16, Math.min(content + CARD_FRAME, bodyColumns - 2))
      if (!isTerminal) {
        /* a desktop column is the app's own pixels, so cards take shares of the row instead: up to three side by
           side at whatever width the pane opened, each picture scaled down to its card */
        const shares = Math.min(Math.max(q.options.length, 1), 3)
        return { size, width, cardWidth: shares === 3 ? '32%' : shares === 2 ? '49%' : '100%', escapeWidth: '49%', isRow: false }
      }
      /* the escape cards share the width of a full row of cards, the same on every question */
      const fit = Math.max(1, Math.floor((bodyColumns - 2 + 1) / (width + 1)))
      const rowWidth = fit * width + (fit - 1)
      const escapeWidth = fit >= 2 ? Math.floor((rowWidth - 1) / 2) : width
      return { size, width, cardWidth: width, escapeWidth, isRow: false }
    }

    function reviewPage() {
      if (!d) return undefined
      const left = unanswered(d, a)
      /* write-ins sit side by side, each as wide as an escape card on the question pages */
      const fieldWidth = isTerminal ? Math.max(...d.questions.map(q => Number(rowLayout(q).escapeWidth)), 16) : '49%'
      /* the gate-wide note only where the gate asks for nothing in writing: its write-ins already take free
         text, and a gate without them still needs one place to say something along with the answer */
      const takesGateNote = d.allowNote && d.inputs.length === 0
      const progress =
        fill(s.progress, { done: total - left.length, total }) +
        (left.length ? fill(s.remaining, { list: left.map(q => q.qid).join(', ') }) : '')
      return (
        <Box flexDirection="column" gap={1}>
          <Text bold>{s.reviewTitle}</Text>
          {d.questions.map((q, i) => {
            const isDone = isAnswered(q, a)
            const answer = isDone ? answerText(q, a, s) : ''
            return (
              <Box flexDirection="column">
                <Text>{`${i + 1}. ${q.question}`}</Text>
                <Box flexDirection="row" gap={2}>
                  <Text color={isDone ? 'success' : 'warning'}>{`   → ${isDone ? answer : s.notChosen}`}</Text>
                  <Button key={`change:${q.qid}`} plain dimColor label={s.change} onPress={() => void act($, `change:${q.qid}`, 'press')} />
                </Box>
              </Box>
            )
          })}
          {Input && (d.inputs.length > 0 || takesGateNote) && (
            <Box flexDirection="column" gap={1}>
              <Box flexDirection="column">
                <Text bold>{s.inputsTitle}</Text>
                <Text dimColor>{s.inputsHint}</Text>
              </Box>
              {/* each write-in is a framed box with its name on top, so it reads as a field to fill, not as a line of
                  text; two share a row, a third wraps under them */}
              <Box key="fields" flexDirection="row" flexWrap="wrap" alignItems="stretch" gap={1}>
              {d.inputs.map(inp => (
                <Box key={`box:${inp.key}`} width={fieldWidth} flexDirection="column" borderStyle="round" borderColor="suggestion" paddingX={1}>
                  <Text bold>{`${inp.label}${inp.required ? s.required : ''}`}</Text>
                  <Input
                    key={`v:${inp.key}`}
                    placeholder={inp.placeholder}
                    value={own(a.vals, inp.key) ?? ''}
                    onInput={v => void setText($, 'vals', inp.key, v)}
                    onSubmit={v => void setText($, 'vals', inp.key, v)}
                  />
                  {inp.hint !== '' && <Text dimColor>{inp.hint}</Text>}
                </Box>
              ))}
              {takesGateNote && (
                <Box key="box:__note" width={fieldWidth} flexDirection="column" borderStyle="round" borderColor="suggestion" paddingX={1}>
                  <Text bold>{s.noteLabel}</Text>
                  <Input
                    key="v:__note"
                    placeholder={s.notePh2}
                    value={a.vals.__note ?? ''}
                    onInput={v => void setText($, 'vals', '__note', v)}
                    onSubmit={v => void setText($, 'vals', '__note', v)}
                  />
                </Box>
              )}
              </Box>
            </Box>
          )}
          {/* the one way out of the gate: framed, and lit up once every question has an answer */}
          {!isBroken ? (
            <Box
              key="sendbar"
              flexDirection="row"
              flexWrap="wrap"
              alignItems="center"
              justifyContent="space-between"
              gap={2}
              borderStyle="round"
              borderColor={left.length ? 'warning' : 'success'}
              paddingX={1}
            >
              <Text bold color={left.length ? 'warning' : 'success'}>{left.length ? progress : s.sendReady}</Text>
              {sendButton('send', !left.length)}
            </Box>
          ) : (
            <Text dimColor>{progress}</Text>
          )}
        </Box>
      )
    }

    const current = step < total ? d.questions[step] : undefined

    return (
      <Box flexDirection="column" gap={1} paddingX={1}>
        {/* the top row: where the gate stands on the left, where to go next on the right */}
        <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
          <Box flexDirection="row" flexWrap="wrap" flexShrink={1} gap={2}>
            {d.questions.map((q, i) => (
              <Button
                key={`step:${i}`}
                plain
                dimColor={i !== step}
                label={`${i === step ? '●' : isAnswered(q, a) ? '✓' : '○'} ${i + 1}`}
                onPress={() => void act($, `step:${i}`, 'press')}
              />
            ))}
            <Button key="step:review" plain dimColor={step !== total} label={`${step === total ? '●' : '○'} ${s.reviewStep}`} onPress={() => void act($, 'step:review', 'press')} />
          </Box>
          <Box flexDirection="row" flexShrink={0} gap={1}>
            {step > 0 && <Button key="prev" label={s.prev} onPress={() => void act($, 'prev', 'press')} />}
            {step < total && (
              <Button key="next" {...(step === total - 1 ? { variant: 'primary' as const } : {})} label={step === total - 1 ? s.toReview : s.next} onPress={() => void act($, 'next', 'press')} />
            )}
            {step === total && !isBroken && sendButton('top:send', unanswered(d, a).length === 0)}
          </Box>
        </Box>
        <Box flexDirection="column">
          <Box flexDirection="row" flexWrap="wrap" gap={2}>
            <Text bold>{`🤔 ${d.title || s.paneTitle}`}</Text>
            {foldsContext && (
              <Button key="context" plain dimColor label={isContextOpen ? s.contextHide : s.contextShow} onPress={() => void act($, 'context', 'press')} />
            )}
          </Box>
          {(!foldsContext || isContextOpen) && lines(d.context).map(l => <Text dimColor>{l}</Text>)}
        </Box>
        {isBroken && (
          <Box flexDirection="column" borderStyle="round" borderColor="error" paddingX={1}>
            <Text bold color="error">{s.brokenTitle}</Text>
            <Text dimColor>{s.brokenBody}</Text>
            {g.problems.map(p => <Text color="error">{`• ${p}`}</Text>)}
          </Box>
        )}
        {current ? questionPage(current, step) : reviewPage()}
        <Text dimColor>{[d.generatedAt, `gate ${d.gateId}`].filter(Boolean).join('  ·  ')}</Text>
      </Box>
    )
  })

  // The desktop's first click on a build-status button arrives as a focus move, as on the decision pane.
  on('ui.focus', { requestId: STATUS_PANE }, async ($, e, next) => {
    const moved = await next(e)
    if (e.origin.kind === 'person' && e.plugin === PLUGIN && e.element && !moved.deny && !statusSurfaces.has('terminal'))
      await buildAct($, e.element, 'focus').catch(() => undefined)
    return moved
  }).catch(($, e, next) => next(e))

  /* The build-status pane: the game and its milestones as tabs, the one next step for where the build stands, the
     tab's own view (the current milestone's Phase and checklist, a finished one's summary against its plan, a future
     one's line, the backlog), and a box for something the person wants. */
  on('ui.render', { component: 'Pane', requestId: STATUS_PANE }, async ($, e) => {
    statusSurfaces.add(e.surface)
    /* drawn, so the band steps aside: set just after this draw, as a draw may not write state */
    if (!(await read($, buildShown))) $.clock.after(0, () => void update($, buildShown, () => true))
    const els = $.ui.resolve(e)
    const { Box, Text, Button } = els
    const isTerminal = e.surface === 'terminal'
    const Input = e.surface !== 'mobile' && 'Input' in els ? els.Input : undefined
    const m = await read($, build)
    const s = buildStrings(m.lang)
    const view = await read($, buildView)
    const isTurn = await read($, busy)
    const isAsking = isTurn && (await read($, asking))
    const isBusy = isTurn && !isAsking
    const step = nextStep(m, { busy: isBusy, running: await read($, running), gateOpen: await gateIsOpen($) })
    const press = (key: string) => () => void buildAct($, key, 'press')
    const themeHead = (theme: string) => theme.split(/\s+[—–]\s+/)[0] ?? theme
    const themeRest = (theme: string) => theme.split(/\s+[—–]\s+/).slice(1).join(' — ')

    /* the one next step, framed: what to do now and its buttons, or what Claude is doing meanwhile */
    function nowBox() {
      return (
        <Box key="b:now" flexDirection="column" borderStyle="round" borderColor={isBusy ? 'warning' : 'suggestion'} paddingX={1}>
          <Text dimColor>{s.nowTitle}</Text>
          <Text bold>{step.title}</Text>
          {step.note !== '' && <Text dimColor>{step.note}</Text>}
          {isAsking && <Text color="suggestion">{s.askingNote}</Text>}
          {(step.primary || step.secondary) && (
            <Box flexDirection="row" flexWrap="wrap" gap={1}>
              {/* the recommended step stands out on the terminal as the sheet's send button does */}
              {step.primary &&
                (isTerminal ? (
                  <Button key="b:primary" variant="primary" label={step.primary.label} onPress={press('b:primary')}>
                    <Text bold inverse color="success">{` ${step.primary.label} `}</Text>
                  </Button>
                ) : (
                  <Button key="b:primary" variant="primary" label={step.primary.label} onPress={press('b:primary')} />
                ))}
              {step.secondary && <Button key="b:secondary" label={step.secondary.label} onPress={press('b:secondary')} />}
            </Box>
          )}
        </Box>
      )
    }

    function bar(p: BuildPhase) {
      const total = Math.max(1, p.items.length)
      const width = Math.max(10, Math.min(40, (isTerminal ? e.props.bodyColumns : 80) - 6))
      const ok = Math.round((p.items.filter(it => it.state === '✅').length / total) * width)
      const built = Math.round((p.items.filter(it => it.state !== '⬜').length / total) * width) - ok
      const left = Math.max(0, width - ok - built)
      return (
        <Box flexDirection="row">
          {ok > 0 && <Text color="success">{'█'.repeat(ok)}</Text>}
          {built > 0 && <Text color="warning">{'█'.repeat(built)}</Text>}
          {left > 0 && <Text dimColor>{'░'.repeat(left)}</Text>}
        </Box>
      )
    }

    /* what an open change box holds: a field for how the task should change (more, less, different), the change sent,
       choices asked of Claude instead, or the box closed */
    function changeBox(it: BuildItem) {
      return (
        <Box key={`b:changebox:${it.id}`} flexDirection="column" borderStyle="round" borderColor="suggestion" paddingX={1}>
          {Input ? (
            <Input
              key={CHANGE_INPUT}
              placeholder={s.changePh}
              submitLabel={s.changeSubmit}
              value={view.change}
              onInput={v => void update($, buildView, cur => ({ ...cur, change: v }))}
              onSubmit={v =>
                void update($, buildView, cur => ({ ...cur, change: v })).then(() => buildAct($, `b:change:${it.id}`, 'press'))
              }
            />
          ) : (
            <Text dimColor>{s.ideaNoInput}</Text>
          )}
          <Box flexDirection="row" flexWrap="wrap" gap={1}>
            {Input && <Button key={`b:change:${it.id}`} variant="primary" label={s.changeSend} onPress={press(`b:change:${it.id}`)} />}
            <Button key={`b:suggest:${it.id}`} label={s.changeSuggest} onPress={press(`b:suggest:${it.id}`)} />
            <Button key={`b:cancel:${it.id}`} plain dimColor label={s.changeCancel} onPress={press(`b:cancel:${it.id}`)} />
          </Box>
        </Box>
      )
    }

    /* a checklist line: pressed, it unfolds its detail and its buttons (none while a turn runs): its own step, change
       it, put it off, drop it (a second press confirms) */
    function itemRow(it: BuildItem) {
      const isOpen = view.item === it.id
      const menu = isBusy ? undefined : itemMenu(it, s)
      return (
        <Box key={`b:row:${it.id}`} flexDirection="column">
          <Button
            key={`b:item:${it.id}`}
            plain
            label={`${isOpen ? '▾' : '▸'} ${it.state} ${taskName(it)}${it.userCheck !== '' ? ' ⚠️' : ''}`}
            onPress={press(`b:item:${it.id}`)}
          />
          {isOpen && (
            <Box flexDirection="column" paddingLeft={4}>
              {it.detail.map(line => <Text dimColor>{line}</Text>)}
              {it.userCheck !== '' && <Text color="warning">{`⚠️ ${it.userCheck}`}</Text>}
              {menu && (
                <Box flexDirection="row" flexWrap="wrap" gap={1}>
                  {menu.does && <Button key={`b:do:${it.id}`} label={menu.does.label} onPress={press(`b:do:${it.id}`)} />}
                  <Button
                    key={`b:edit:${it.id}`}
                    label={s.editThis}
                    {...(view.editing === it.id ? { variant: 'primary' as const } : {})}
                    onPress={press(`b:edit:${it.id}`)}
                  />
                  {menu.defer && <Button key={`b:defer:${it.id}`} label={menu.defer.label} onPress={press(`b:defer:${it.id}`)} />}
                  <Button key={`b:drop:${it.id}`} label={view.armed === it.id ? s.dropConfirm : menu.drop.label} onPress={press(`b:drop:${it.id}`)} />
                </Box>
              )}
              {menu && view.editing === it.id && changeBox(it)}
            </Box>
          )}
        </Box>
      )
    }

    function currentView() {
      const p = currentPhase(m)
      if (!p) return undefined
      const count = (state: BuildItem['state']) => p.items.filter(it => it.state === state).length
      const later = m.phases.filter(x => x.n > p.n)
      const unverified = p.items.filter(it => it.state === '🟡' && it.userCheck === '')
      const yours = p.items.filter(it => it.userCheck !== '' && it.state !== '✅')
      return (
        <Box key={`b:current:${p.n}`} flexDirection="column" gap={1}>
          <Box flexDirection="column">
            <Text bold>{p.title ? fill(s.phaseLine, { n: p.n, title: p.title }) : `Phase ${p.n}`}</Text>
            {bar(p)}
            <Text dimColor>{fill(s.counts, { ok: count('✅'), mid: count('🟡'), no: count('⬜') })}</Text>
            {later.length > 0 && (
              <Text dimColor>{fill(s.laterPhases, { list: later.map(x => fill(s.phaseCount, { n: x.n, k: x.items.length })).join(' · ') })}</Text>
            )}
          </Box>
          {(unverified.length > 0 || yours.length > 0) && (
            <Box flexDirection="column">
              <Text bold>{s.attention}</Text>
              {unverified.length > 0 && <Text color="warning">{fill(s.unverified, { n: unverified.length })}</Text>}
              {yours.map(it => <Text color="warning">{fill(s.yours, { task: taskName(it), note: it.userCheck })}</Text>)}
            </Box>
          )}
          {p.items.length > 0 && (
            <Box flexDirection="column">
              <Text bold>{s.checklist}</Text>
              {p.items.map(it => itemRow(it))}
            </Box>
          )}
        </Box>
      )
    }

    /* a finished milestone against its roadmap line: what got built, what changed, how big, what is still open */
    function pastView(ms: BuildMilestone) {
      const past = ms.past
      const row = (label: string, body: RenderElement | RenderElement[]) => (
        <Box flexDirection="row" gap={1}>
          <Box width={10} flexShrink={0}>
            <Text dimColor>{label}</Text>
          </Box>
          <Box flexDirection="column" flexShrink={1}>
            {body}
          </Box>
        </Box>
      )
      const changes = past?.changes ?? []
      return (
        <Box key={`b:past:${ms.n}`} flexDirection="column" borderStyle="round" paddingX={1}>
          <Text bold color="success">{`✅ M${ms.n} · ${themeHead(ms.theme)}`}</Text>
          {row(s.plan, <Text>{themeRest(ms.theme) || ms.theme}</Text>)}
          {row(s.result, past?.result.length ? past.result.map(l => <Text>{l}</Text>) : <Text dimColor>{s.noSummary}</Text>)}
          {row(
            s.changes,
            changes.length
              ? changes.slice(0, 5).map(c => (
                  <Text {...(c.kind === '+' ? { color: 'success' } : c.kind === '-' ? { color: 'warning' } : {})}>{`${c.kind === '~' ? '±' : c.kind} ${c.what}`}</Text>
                ))
              : <Text dimColor>{s.noChanges}</Text>,
          )}
          {!!past?.phases && row(s.scale, <Text>{fill(s.scaleText, { p: past.phases, i: past.items })}</Text>)}
          {m.issues.length > 0 &&
            row(
              s.issues,
              m.issues.slice(0, 3).map(x => <Text color="warning">{x.count ? `${x.issue} ${fill(s.issueCount, { n: x.count })}` : x.issue}</Text>),
            )}
          {!!past?.date && row(s.finished, <Text>{past.date}</Text>)}
        </Box>
      )
    }

    function futureView(ms: BuildMilestone) {
      return (
        <Box key={`b:future:${ms.n}`} flexDirection="column" borderStyle="round" paddingX={1}>
          <Text bold>{`M${ms.n} · ${themeHead(ms.theme)}`}</Text>
          {themeRest(ms.theme) !== '' && <Text>{themeRest(ms.theme)}</Text>}
          <Text dimColor>{ms.status === 'candidate' ? s.candidateNote : s.futureNote}</Text>
        </Box>
      )
    }

    function backlogView() {
      return (
        <Box key="b:backlog" flexDirection="column">
          <Text bold>{s.backlogTitle}</Text>
          {m.backlog.length === 0 && <Text dimColor>{s.backlogEmpty}</Text>}
          {m.backlog.map(b => (
            <Box flexDirection="column">
              <Text>{`• ${b.what}`}</Text>
              {b.why !== '' && <Text dimColor>{`  ${b.why}`}</Text>}
            </Box>
          ))}
        </Box>
      )
    }

    /* something the person wants for the plan as a whole, whatever is unfolded: a new task for this milestone (Claude
       places it in a Phase) or something for later (the roadmap); a change to one task is that task's own ✏️ button,
       and a change of the plan's direction, too far-reaching for one press, is asked for in the chat */
    function ideaBox() {
      /* where the next words go, once a button was pressed on the empty box: that button lit, an example and a hint
         of its own, and Enter sends there */
      const kind = view.ideaKind === 'now' && m.active === 0 ? '' : view.ideaKind
      const placeholder = kind === 'later' ? s.ideaPhLater : s.ideaPh
      const hint = kind === 'now' ? s.ideaHintNow : kind === 'later' ? s.ideaHintLater : ''
      const lit = (k: string) => (kind === k ? { variant: 'primary' as const } : {})
      return (
        <Box key="b:ideabox" flexDirection="column" borderStyle="round" borderColor="suggestion" paddingX={1}>
          <Text bold>{s.ideaTitle}</Text>
          {Input ? (
            <Input
              key={IDEA_INPUT}
              placeholder={placeholder}
              {...(kind ? { submitLabel: s.ideaSubmit } : {})}
              value={view.idea}
              onInput={v => void update($, buildView, cur => ({ ...cur, idea: v }))}
              onSubmit={v => void submitIdea($, v)}
            />
          ) : (
            <Text dimColor>{s.ideaNoInput}</Text>
          )}
          {Input && hint !== '' && <Text color="suggestion">{hint}</Text>}
          {Input && (
            <Box flexDirection="row" flexWrap="wrap" gap={1}>
              {m.active > 0 && <Button key="b:idea:now" label={s.ideaNow} {...lit('now')} onPress={press('b:idea:now')} />}
              <Button key="b:idea:later" label={s.ideaLater} {...lit('later')} onPress={press('b:idea:later')} />
            </Box>
          )}
          {Input && isTurn && <Text dimColor>{s.ideaBusy}</Text>}
        </Box>
      )
    }

    const refresh = <Button key="b:refresh" plain dimColor label={s.refresh} onPress={press('b:refresh')} />
    if (m.status !== 'ok') {
      return (
        <Box flexDirection="column" gap={1} paddingX={1}>
          <Box flexDirection="row" justifyContent="space-between" gap={2}>
            <Text bold>{m.status === 'broken' ? s.brokenTitle : s.noPlanTitle}</Text>
            {refresh}
          </Box>
          {m.status === 'none' && <Text dimColor>{s.noPlanBody}</Text>}
          {m.problems.map(p => <Text color="error">{`• ${p}`}</Text>)}
          {m.status === 'none' && nowBox()}
        </Box>
      )
    }

    const tab = view.tab === 'backlog' || m.milestones.some(x => `m${x.n}` === view.tab) ? view.tab : defaultTab(m)
    const shown = m.milestones.find(x => `m${x.n}` === tab)
    const body =
      tab === 'backlog'
        ? backlogView()
        : !shown
          ? undefined
          : shown.n === m.active
            ? currentView()
            : shown.status === 'done'
              ? pastView(shown)
              : futureView(shown)
    return (
      <Box flexDirection="column" gap={1} paddingX={1}>
        <Box flexDirection="row" justifyContent="space-between" gap={2}>
          <Text bold>{`🎮 ${m.game}`}</Text>
          {refresh}
        </Box>
        <Box key="b:tabs" flexDirection="row" flexWrap="wrap" gap={2}>
          {m.milestones.map(x => (
            <Button
              key={`b:tab:m${x.n}`}
              plain
              dimColor={tab !== `m${x.n}`}
              label={`${tab === `m${x.n}` ? '●' : '○'} ${tabLabel(x, s)}`}
              onPress={press(`b:tab:m${x.n}`)}
            />
          ))}
          <Button
            key="b:tab:backlog"
            plain
            dimColor={tab !== 'backlog'}
            label={`${tab === 'backlog' ? '●' : '○'} ${fill(s.tabBacklog, { n: m.backlog.length })}`}
            onPress={press('b:tab:backlog')}
          />
        </Box>
        {nowBox()}
        {body}
        {ideaBox()}
      </Box>
    )
  })
}
