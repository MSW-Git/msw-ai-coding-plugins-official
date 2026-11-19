// The decision sheet's rules, without the engine: read a gate, say what is
// wrong with it, and write the answer in the exact paste shape that
// msw-planning's references/decision-sheet.md §5 tells the session to read.
// Ported from assets/msw-decision-sheet.html (questionsOf, gateProblems,
// answerTextOf, pushValue, compose); keep the two in step.

import type {
  SheetAnswers,
  SheetGateData,
  SheetInput,
  SheetOption,
  SheetQuestion,
} from '../types'
import { BACKGROUNDS, PARTS, own, readScene } from './scene'

export const DELEGATE = '__delegate'
export const CUSTOM = '__custom'

const STRINGS = {
  en: {
    paneTitle: 'Planning choice',
    emptyTitle: 'Nothing to choose right now.',
    emptyBody: 'When the planning chat needs a decision, this pane opens by itself.',
    closedTitle: '✔ That question is settled — nothing to choose now.',
    brokenTitle: "⚠ This sheet can't be answered as it stands",
    brokenBody: 'The planning session has to write the gate again. Sending is off so a broken answer cannot reach the chat.',
    modeMulti: '☑️ Pick any number',
    modeSingle: '◉ Pick one',
    recommended: '★ Recommended',
    buildsSect: 'What this builds',
    firstBuild: '🎮 First result',
    tradeoff: '⚖️ What it postpones',
    samples: 'Similar games · ',
    stepOf: 'Question {n} of {total}',
    shapeToUpright: '▦ Cards upright',
    shapeToRow: '▤ Cards on their side',
    contextShow: '▸ Show details',
    contextHide: '▾ Hide details',
    reviewStep: 'Review',
    prev: '◀ Back',
    next: 'Next ▶',
    toReview: 'Review ▶',
    reviewTitle: '✔ Check your answers, then send',
    change: 'Change',
    notChosen: '(not chosen yet)',
    effortLow: 'Effort · low',
    effortMid: 'Effort · medium',
    effortHigh: 'Effort · high',
    delegate: '🤝 You decide this one',
    delegateRec: 'Goes with the recommendation:',
    delegateAny: 'Claude picks what fits and goes on.',
    custom: "✏️ My answer isn't listed",
    customHint: 'When no card fits, write your own answer. Enter moves on.',
    customPh: 'Write the answer you want here (this is what gets sent)',
    inputsTitle: '✍️ In your own words',
    inputsHint: 'Any box not marked required can stay empty.',
    required: ' · required',
    noteLabel: 'Extra notes (optional)',
    notePh2: "Why you chose it, or anything you'd like",
    send: '📨 Send to Claude',
    sendReady: 'All chosen. Send it and Claude carries on from here.',
    progress: 'Chosen {done}/{total}',
    remaining: ' — still open: {list}',
    needRequired: 'Fill the required write-in: {list}',
    sentTitle: '✔ Sent. The pane closes once Claude has reflected it.',
    edit: '↩ Change my answer',
    arrived: '🤔 A planning choice is waiting in the pane.',
    gateWritten: '🤔 {n} questions are up in the decision pane beside the chat.',
    gateEdited: '🤔 The decision pane was updated.',
    gateRefused: '⚠ Some cards had no picture of their own, so Claude is writing the questions again.',
    waitingAtStart: 'An open planning choice is waiting — press the button above the prompt, or run /decision-sheet.',
    waitingBand: '🤔 {n} planning questions are waiting in the decision pane',
    openPane: '📋 Open the decision pane',
    allowAuto: '✅ Open it by itself from now on',
    bandHint: 'Press it once: these questions open now, and later ones open by themselves when they come. A wider terminal window shows the pane more comfortably.',
    bandNarrow: 'Widen the terminal window and the pane opens by itself, easier to read too. For now, open it here.',
    ansNone: '(not selected)',
    ansDelegate: '(delegated — go with the recommendation)',
    ansCustom: '(not in the options · written in) ',
    blockAll: '[Planning answer · gate {gate}]',
    notePrefix: 'note',
    extraNote: 'Extra notes',
  },
  ko: {
    paneTitle: '기획 선택',
    emptyTitle: '지금은 고를 것이 없어요.',
    emptyBody: '기획 대화 중 선택이 필요해지면 이 패널이 자동으로 열립니다.',
    closedTitle: '✔ 이 질문은 정리됐어요 — 지금은 고를 것이 없어요.',
    brokenTitle: '⚠ 이 시트는 지금 상태로는 답할 수 없어요',
    brokenBody: '기획 세션이 질문 데이터를 다시 써야 해요. 깨진 답이 채팅에 들어가지 않도록 보내기를 막아 두었어요.',
    modeMulti: '☑️ 여러 개 선택 가능',
    modeSingle: '◉ 하나만 선택',
    recommended: '★ 추천',
    buildsSect: '이걸 고르면 만들어져요',
    firstBuild: '🎮 첫 결과물',
    tradeoff: '⚖️ 대신 미루는 것',
    samples: '비슷한 게임 · ',
    stepOf: '질문 {n} / {total}',
    shapeToUpright: '▦ 세로형 카드로 보기',
    shapeToRow: '▤ 가로형 카드로 보기',
    contextShow: '▸ 설명 펼치기',
    contextHide: '▾ 설명 숨기기',
    reviewStep: '확인',
    prev: '◀ 이전',
    next: '다음 ▶',
    toReview: '확인 ▶',
    reviewTitle: '✔ 고른 내용을 확인하고 보내 주세요',
    change: '바꾸기',
    notChosen: '(아직 안 고름)',
    effortLow: '난이도 낮음',
    effortMid: '난이도 중간',
    effortHigh: '난이도 높음',
    delegate: '🤝 이 항목은 맡길게요',
    delegateRec: '추천안대로 진행해요:',
    delegateAny: 'Claude가 알맞게 정해서 진행해요.',
    custom: '✏️ 여기 없는 답을 할게요',
    customHint: '맞는 카드가 없으면 원하는 답을 직접 적어 주세요. 적고 Enter를 누르면 다음으로 넘어가요.',
    customPh: '여기에 원하시는 답을 적어주세요 (이 내용이 답변으로 전달됩니다)',
    inputsTitle: '✍️ 직접 적어 주세요',
    inputsHint: '필수 표시가 없는 칸은 비워 두고 보내도 돼요.',
    required: ' · 필수',
    noteLabel: '추가 의견 (선택)',
    notePh2: '선택한 이유나 바라는 점이 있으면 자유롭게 적어주세요',
    send: '📨 Claude에게 보내기',
    sendReady: '다 골랐어요. 보내면 Claude가 바로 이어서 진행해요.',
    progress: '선택 {done}/{total}',
    remaining: ' — 남은 항목: {list}',
    needRequired: '필수 입력을 채워주세요: {list}',
    sentTitle: '✔ 보냈어요. Claude가 반영하면 패널이 닫혀요.',
    edit: '↩ 답 고치기',
    arrived: '🤔 기획 선택이 필요해요 — 패널에서 골라주세요.',
    gateWritten: '🤔 질문 {n}개를 옆 결정 패널에 올렸어요.',
    gateEdited: '🤔 결정 패널 내용을 고쳤어요.',
    gateRefused: '⚠ 그림이 빠진 카드가 있어서 Claude가 질문을 다시 쓰고 있어요.',
    waitingAtStart: '열려 있는 기획 선택이 있어요 — 입력창 위 버튼이나 /decision-sheet 로 열 수 있어요.',
    waitingBand: '🤔 기획 질문 {n}개가 결정 패널에서 기다리고 있어요',
    openPane: '📋 결정 패널 열기',
    allowAuto: '✅ 앞으로 자동으로 열기',
    bandHint: '한 번 누르면 지금 질문이 바로 열리고, 다음부터는 질문이 생길 때 자동으로 열려요. 터미널 창을 넓히면 패널 내용을 더 편하게 볼 수 있어요.',
    bandNarrow: '터미널 창을 넓히면 패널이 자동으로 열리고, 내용도 더 편하게 볼 수 있어요. 지금은 여기서 열어 주세요.',
    ansNone: '(미선택)',
    ansDelegate: '(맡김 — 추천안대로)',
    ansCustom: '(보기에 없음 · 직접 답변) ',
    blockAll: '[기획 선택 응답 · gate {gate}]',
    notePrefix: '메모',
    extraNote: '추가 의견',
  },
} as const

export type Strings = { [K in keyof (typeof STRINGS)['en']]: string }

export function stringsFor(lang: string | undefined): Strings {
  return /^ko\b/i.test(lang ?? '') ? STRINGS.ko : STRINGS.en
}

export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (all, name: string) =>
    name in values ? String(values[name]) : all,
  )
}

// ---------- reading a gate ----------

type Raw = { [key: string]: unknown }

const isObject = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v)
const text = (v: unknown): string => (v == null ? '' : String(v))
/* a break inside text that shares a paste line would mint a bare protocol line */
const oneLine = (v: unknown): string => text(v).replace(/\s*[\r\n]+\s*/g, ' ').trim()

/** Normalizes a parsed decision-data.json and lists what makes it unanswerable. */
const SHAPE_NAMES: readonly string[] = ['rect', 'frame', 'circle', 'line', 'tri']

/** Why an option's scene would not give its card a picture of its own: none, off the kit, or emoji alone. Empty when it draws. */
function sceneIssues(raw: unknown, ko: boolean): string[] {
  const say = (k: string, e: string) => (ko ? k : e)
  if (!isObject(raw)) return [say('그림(scene)이 없어요 — 패널에서는 보기마다 필요해요', 'no scene — the pane needs one on every option')]
  const issues: string[] = []
  const bg = typeof raw.bg === 'string' ? raw.bg : ''
  if (!bg) issues.push(say('배경(bg)이 없어요', 'no backdrop (bg)'))
  else if (!(BACKGROUNDS as readonly string[]).includes(bg)) issues.push(say(`키트에 없는 배경이에요: "${bg}"`, `backdrop "${bg}" is not in the kit`))
  let drawn = 0
  let stickers = 0
  for (const it of Array.isArray(raw.items) ? raw.items : []) {
    if (!isObject(it) || typeof it.x !== 'number' || typeof it.y !== 'number') {
      issues.push(say('x·y가 없는 항목이 있어요', 'an item has no x, y'))
    } else if (typeof it.part === 'string') {
      if (Object.prototype.hasOwnProperty.call(PARTS, it.part)) drawn += 1
      else issues.push(say(`키트에 없는 부품이에요: "${it.part}"`, `part "${it.part}" is not in the kit`))
    } else if (typeof it.shape === 'string') {
      if (SHAPE_NAMES.includes(it.shape)) drawn += 1
      else issues.push(say(`없는 도형이에요: "${it.shape}"`, `shape "${it.shape}" does not exist`))
    } else if (typeof it.emoji === 'string' && it.emoji) {
      stickers += 1
    } else {
      issues.push(say('아무것도 그리지 않는 항목이 있어요 (part·shape·emoji 중 하나)', 'an item draws nothing (needs a part, shape or emoji)'))
    }
  }
  if (!issues.length && !drawn)
    issues.push(stickers ? say('이모지뿐이에요 — 키트 부품이나 도형으로 그려 주세요', 'emoji stickers only — draw it with kit parts or shapes') : say('그림 항목(items)이 없어요', 'no items'))
  return [...new Set(issues)]
}

export function readGate(raw: unknown, lang?: string): { data: SheetGateData | null; problems: string[]; pictures: string[] } {
  const ko = /^ko\b/i.test(lang ?? (isObject(raw) ? text(raw.lang) : ''))
  const say = (k: string, e: string) => (ko ? k : e)
  if (raw === null || raw === undefined) return { data: null, problems: [say('파일에 질문이 없어요 (null)', 'the file declares no gate (null)')], pictures: [] }
  if (!isObject(raw)) return { data: null, problems: [say('질문 데이터가 객체가 아니에요', 'the gate data is not an object')], pictures: [] }

  const problems: string[] = []
  /* the subset of problems that leave a card without a picture of its own: the pane refuses such a write */
  const pictures: string[] = []
  const flagPicture = (line: string) => {
    problems.push(line)
    pictures.push(line)
  }
  const gateId = text(raw.gateId).trim()
  if (!gateId) problems.push(say('gateId가 없어요 — 답이 어느 질문의 것인지 구분할 수 없어요', 'gateId is missing — an answer could not be traced back to its gate'))
  else if (/[\r\n\]]/.test(text(raw.gateId))) problems.push(say('gateId에 줄바꿈이나 "]"가 있어요 — 응답 머리글이 깨져요', 'gateId contains a line break or a "]" — it would split the paste header'))
  if (raw.questions != null && !Array.isArray(raw.questions)) problems.push(say('questions가 목록이 아니에요', 'questions is not a list'))
  if (raw.inputs != null && !Array.isArray(raw.inputs)) problems.push(say('inputs가 목록이 아니에요', 'inputs is not a list'))

  const many = Array.isArray(raw.questions) ? raw.questions : []
  const one = Array.isArray(raw.options) ? raw.options : []
  const list: unknown[] = many.length
    ? many
    : one.length
      ? [{ id: 'Q1', question: raw.question, context: raw.context, multiSelect: raw.multiSelect, recommended: raw.recommended, options: one }]
      : []
  if (!list.length) problems.push(say('질문이 하나도 없어요 — "questions"는 비어 있지 않은 목록이어야 해요', 'the data declares no question — "questions" must be a non-empty list'))

  const seenQ = new Set<string>()
  const questions: SheetQuestion[] = []
  list.forEach((entry, i) => {
    const n = i + 1
    if (!isObject(entry)) { problems.push(say(`Q${n}: 질문 항목이 객체가 아니에요`, `Q${n}: this entry is not an object`)); return }
    const qid = text(entry.id).trim()
    const question = oneLine(entry.question)
    const tag = `Q${n} "${question.slice(0, 40)}"`
    if (!qid) problems.push(say(`Q${n}: 질문 id가 없어요`, `Q${n}: the question has no id`))
    if (entry.id != null && typeof entry.id !== 'string') problems.push(say(`${tag}: id가 문자열이 아니에요`, `${tag}: the id is not text`))
    if (/[\r\n]/.test(qid)) problems.push(say(`${tag}: id에 줄바꿈이 있어요`, `${tag}: the id contains a line break`))
    if (qid && seenQ.has(qid)) problems.push(say(`질문 id "${qid}"가 중복돼요`, `duplicate question id "${qid}"`))
    seenQ.add(qid)
    if (!question) problems.push(say(`Q${n}: 질문 문장이 없어요`, `Q${n}: the question text is missing`))
    if (entry.options != null && !Array.isArray(entry.options)) problems.push(say(`${tag}: options가 목록이 아니에요`, `${tag}: options is not a list`))
    const rawOptions = Array.isArray(entry.options) ? entry.options : []
    if (!rawOptions.length) problems.push(say(`${tag}: 보기가 없어요`, `${tag}: no options`))

    const seenO = new Set<string>()
    const options: SheetOption[] = []
    rawOptions.forEach(o => {
      if (!isObject(o)) { problems.push(say(`${tag}: 보기 중 하나가 객체가 아니에요`, `${tag}: one of the options is not an object`)); return }
      const id = text(o.id).trim()
      if (!id) { problems.push(say(`${tag}: id 없는 보기가 있어요`, `${tag}: an option has no id`)); return }
      if (id === DELEGATE || id === CUSTOM) { problems.push(say(`${tag}: 보기 id "${id}"는 예약어예요`, `${tag}: option id "${id}" is reserved`)); return }
      if (o.id != null && typeof o.id !== 'string') problems.push(say(`${tag}: 보기 id ${id}가 문자열이 아니에요`, `${tag}: option id ${id} is not text`))
      if (/[\r\n]/.test(id)) problems.push(say(`${tag}: 보기 id에 줄바꿈이 있어요`, `${tag}: an option id contains a line break`))
      if (seenO.has(id)) problems.push(say(`${tag}: 보기 id "${id}"가 중복돼요`, `${tag}: duplicate option id "${id}"`))
      seenO.add(id)
      const label = oneLine(o.label)
      if (!label) problems.push(say(`${tag}: 보기 "${id}"에 label이 없어요`, `${tag}: option "${id}" has no label`))
      const tradeoff = text(o.tradeoff).trim()
      if (!tradeoff) problems.push(say(`${tag} · 보기 ${id}: tradeoff가 없어요 (필수)`, `${tag} · option ${id}: tradeoff is missing (required)`))
      const issues = sceneIssues(o.scene, ko)
      if (issues.length) flagPicture(say(`${tag} · 보기 ${id}: ${issues.join(' · ')}`, `${tag} · option ${id}: ${issues.join(' · ')}`))
      options.push({
        id,
        label,
        tagline: oneLine(o.tagline),
        visual: text(o.visual).trim(),
        ...(o.scene !== undefined && readScene(o.scene) ? { scene: readScene(o.scene) } : {}),
        emoji: text(o.emoji).trim(),
        summary: Array.isArray(o.summary) ? o.summary.map(oneLine).filter(Boolean) : [],
        firstBuild: oneLine(o.firstBuild),
        effort: text(o.effort).trim(),
        tradeoff,
        samples: oneLine(o.samples),
      })
    })
    /* one picture, one difference: two cards drawn alike tell the person nothing */
    const drawnBy = new Map<string, string>()
    for (const op of options) {
      if (!op.scene) continue
      const key = JSON.stringify(op.scene)
      const twin = drawnBy.get(key)
      if (twin) flagPicture(say(`${tag}: 보기 ${twin}·${op.id}의 그림이 똑같아요 — 서로 다른 점이 보이게 그려 주세요`, `${tag}: options ${twin} and ${op.id} have the same scene — draw what tells them apart`))
      else drawnBy.set(key, op.id)
    }
    const recommended = text(entry.recommended).trim()
    if (recommended && !seenO.has(recommended)) problems.push(say(`${tag}: 추천 "${recommended}"에 맞는 보기가 없어요`, `${tag}: recommended "${recommended}" matches no option`))
    questions.push({
      qid: qid || `Q${n}`,
      question,
      context: text(entry.context),
      multiSelect: !!entry.multiSelect,
      recommended,
      options,
    })
  })

  const seenK = new Set<string>()
  const inputs: SheetInput[] = []
  ;(Array.isArray(raw.inputs) ? raw.inputs : []).forEach(inp => {
    if (!isObject(inp)) { problems.push(say('입력 항목 중 하나가 객체가 아니에요', 'one of the inputs is not an object')); return }
    const key = text(inp.key).trim()
    if (!key) { problems.push(say('key 없는 입력 항목이 있어요', 'an input has no key')); return }
    if (key === '__note') { problems.push(say('입력 key "__note"는 예약어예요', 'input key "__note" is reserved')); return }
    if (/[\r\n]/.test(key)) problems.push(say(`입력 key "${key}"에 줄바꿈이 있어요`, `input key "${key}" contains a line break`))
    if (seenK.has(key)) problems.push(say(`입력 key "${key}"가 중복돼요`, `duplicate input key "${key}"`))
    seenK.add(key)
    const label = oneLine(inp.label)
    if (!label) problems.push(say(`입력 "${key}"에 label이 없어요`, `input "${key}" has no label`))
    inputs.push({
      key,
      label: label || key,
      placeholder: oneLine(inp.placeholder),
      required: !!inp.required,
      hint: oneLine(inp.hint),
    })
  })

  return {
    data: {
      gateId,
      lang: text(raw.lang).trim(),
      title: oneLine(raw.title),
      context: text(raw.context),
      generatedAt: oneLine(raw.generatedAt),
      allowNote: raw.allowNote !== false,
      questions,
      inputs,
    },
    problems,
    pictures,
  }
}

// ---------- answering ----------

export function emptyAnswers(gateId: string): SheetAnswers {
  return { gateId, sel: {}, notes: {}, custom: {}, vals: {}, sentAt: 0, step: 0 }
}

/** The next selection of one question after a press on `id` (an option, DELEGATE or CUSTOM). */
export function toggle(q: SheetQuestion, picked: readonly string[], id: string): string[] {
  /* the two escapes stand alone: picking one clears the cards, and the reverse */
  if (id === DELEGATE || id === CUSTOM) return picked.includes(id) ? [] : [id]
  const cards = picked.filter(p => p !== DELEGATE && p !== CUSTOM)
  if (!q.multiSelect) return cards.includes(id) ? [] : [id]
  const next = cards.includes(id) ? cards.filter(p => p !== id) : [...cards, id]
  /* option order, not click order, so the same choice always pastes the same */
  return q.options.map(o => o.id).filter(o => next.includes(o))
}

export function isAnswered(q: SheetQuestion, a: SheetAnswers): boolean {
  const picked = own(a.sel, q.qid) ?? []
  if (!picked.length) return false
  if (picked.includes(CUSTOM)) return !!(own(a.custom, q.qid) ?? '').trim()
  return true
}

export function unanswered(d: SheetGateData, a: SheetAnswers): SheetQuestion[] {
  return d.questions.filter(q => !isAnswered(q, a))
}

export function missingRequired(d: SheetGateData, a: SheetAnswers): SheetInput[] {
  return d.inputs.filter(inp => inp.required && !(own(a.vals, inp.key) ?? '').trim())
}

const valueLines = (raw: string | undefined): string[] =>
  (raw ?? '').split(/\r?\n/).map(s => s.trim()).filter(Boolean)
const bullet = (p: string): string => '- ' + p.replace(/^[-•*]\s+/, '')

/* every multi-line value takes one shape: the label alone, then one "- item" per line */
function pushValue(out: string[], label: string, raw: string | undefined): void {
  const parts = valueLines(raw)
  if (!parts.length) return
  if (parts.length === 1) { out.push(`${label}: ${parts[0]}`); return }
  out.push(`${label}:`)
  parts.forEach(p => out.push(bullet(p)))
}

export function answerText(q: SheetQuestion, a: SheetAnswers, s: Strings): string {
  const picked = own(a.sel, q.qid) ?? []
  if (!picked.length) return s.ansNone
  if (picked.includes(DELEGATE)) return s.ansDelegate
  if (picked.includes(CUSTOM)) {
    const parts = valueLines(own(a.custom, q.qid))
    return s.ansCustom + (parts[0] ?? '') + parts.slice(1).map(p => '\n' + bullet(p)).join('')
  }
  return picked
    .map(id => {
      const o = q.options.find(x => x.id === id)
      return o?.label ? `${id}. ${o.label}` : id
    })
    .join(' · ')
}

/** The whole-gate paste block (decision-sheet.md §5, third shape). */
export function composeAll(d: SheetGateData, a: SheetAnswers): string {
  const s = stringsFor(d.lang)
  const lines = [fill(s.blockAll, { gate: d.gateId })]
  d.questions.forEach((q, i) => {
    lines.push(`${i + 1}) ${q.qid} · ${q.question} → ${answerText(q, a, s)}`)
    if (!(own(a.sel, q.qid) ?? []).includes(CUSTOM)) {
      const note: string[] = []
      pushValue(note, s.notePrefix, own(a.notes, q.qid))
      note.forEach(l => lines.push('   ' + l))
    }
  })
  d.inputs.forEach(inp => pushValue(lines, `${inp.key} · ${inp.label || inp.key}`, own(a.vals, inp.key)))
  pushValue(lines, `__note · ${s.extraNote}`, a.vals.__note)
  return lines.join('\n')
}

// ---------- drawing aids ----------

export function effortLabel(effort: string, s: Strings): string {
  if (/낮|low|easy/i.test(effort)) return s.effortLow
  if (/높|high|hard/i.test(effort)) return s.effortHigh
  return effort ? s.effortMid : ''
}

// ---------- the schematics ----------
// The sheet's built-in schematics as shape data on the HTML form's 200x120
// canvas, drawn as SVG where the surface has `Svg` (desktop, mobile).
// The page's CSS variables become mid-tones that read on a light or dark pane.

type Tone = 'muted' | 'brand' | 'line'
type Shape =
  | { rect: readonly [number, number, number, number]; tone: Tone }
  | { d: string; tone: Tone; dash?: string; isFilled?: true }
  | { dot: readonly [number, number, number] }

const SHAPES: Record<string, readonly Shape[]> = {
  topdown: [
    { rect: [30, 14, 140, 92], tone: 'muted' },
    { d: 'M65 14v92M100 14v92M135 14v92M30 45h140M30 76h140', tone: 'line' },
    { dot: [100, 62, 7] },
    { d: 'M100 40v-14M100 84v14M78 62h-14M122 62h14', tone: 'brand' },
    { d: 'M96 28l4-6 4 6M96 94l4 6 4-6M84 58l-6 4 6 4M116 58l6 4-6 4', tone: 'brand' },
  ],
  sideview: [
    { d: 'M14 100h172', tone: 'muted' },
    { d: 'M56 72h38M120 50h36', tone: 'muted' },
    { dot: [40, 90, 8] },
    { d: 'M50 84 Q70 48 92 66', tone: 'brand', dash: '4 4' },
    { d: 'M88 60l5 7-8 1z', tone: 'brand', isFilled: true },
  ],
  maple: [
    { d: 'M14 102h172M40 74h60M110 48h60M60 26h50', tone: 'muted' },
    { d: 'M90 74v28M140 48v54', tone: 'line', dash: '3 4' },
    { dot: [70, 66, 8] },
    { d: 'M80 60 Q95 40 112 42', tone: 'brand', dash: '4 4' },
  ],
  boardui: [
    { rect: [16, 14, 110, 92], tone: 'muted' },
    { d: 'M16 45h110M16 76h110M53 14v92M90 14v92', tone: 'line' },
    { dot: [71, 60, 6] },
    { rect: [138, 14, 48, 92], tone: 'muted' },
    { d: 'M146 32h32M146 50h32M146 68h24', tone: 'brand' },
  ],
  systems: [
    { rect: [20, 20, 56, 30], tone: 'muted' },
    { rect: [124, 20, 56, 30], tone: 'muted' },
    { rect: [72, 72, 56, 30], tone: 'brand' },
    { d: 'M76 40h48M100 50v22M152 50 Q152 66 128 76', tone: 'muted', dash: '4 4' },
  ],
}

const STROKE: Record<Tone, string> = {
  muted: 'stroke="#8b93a1" stroke-width="2" fill="none"',
  brand: 'stroke="#e8833a" stroke-width="2.5" fill="none"',
  line: 'stroke="#8b93a1" stroke-opacity="0.45" stroke-width="1.5" fill="none"',
}
const RGB: Record<Tone, number> = { line: 0x6b7280, muted: 0x8b93a1, brand: 0xe8833a }

/** The schematic for `visual` as an SVG document, or undefined where the card shows its emoji (or nothing). */
export function svgFor(visual: string): string | undefined {
  const shapes = own(SHAPES, visual)
  if (!shapes) return undefined
  const body = shapes
    .map(s => {
      if ('dot' in s) return `<circle cx="${s.dot[0]}" cy="${s.dot[1]}" r="${s.dot[2]}" fill="#e8833a"/>`
      if ('rect' in s) {
        const [x, y, w, h] = s.rect
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" ${STROKE[s.tone]}/>`
      }
      if (s.isFilled) return `<path d="${s.d}" fill="#${RGB[s.tone].toString(16)}"/>`
      return `<path d="${s.d}" ${STROKE[s.tone]}${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}/>`
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">${body}</svg>`
}

// ---------- the terminal pictures ----------
// On the terminal a card shows a colour pixel scene instead of the SVG: cells
// of '▀', each cell two stacked pixels (foreground = the top pixel, background
// = the bottom one), so every pixel carries its own colour. Two sizes, each
// drawn by hand for its grid — scaling one into the other turns it to mud:
// 'medium' is 40 x 26 pixels (40 x 13 cells), small enough that three cards
// share one row of a 136-column pane; 'small' is 30 x 20 pixels (30 x 10
// cells) for a pane where that row would otherwise hold fewer cards.
// One letter per pixel, coloured by PIXEL_PALETTE.

export const PIXEL_SIZES = {
  small: { columns: 30, rows: 10 },
  medium: { columns: 40, rows: 13 },
} as const
export type PixelSize = keyof typeof PIXEL_SIZES

const PIXEL_PALETTE: Record<string, number> = {
  '0': 0xd9cdb0,
  '5': 0x7ad66a,
  '6': 0x3f9a35,
  '8': 0x2a3446,
  '9': 0xb3a481,
  A: 0x8fd0ff,
  B: 0x3d7ddb,
  C: 0xc6e9ff,
  D: 0x9a6332,
  E: 0x46a12f,
  F: 0xffe1b0,
  G: 0x57b83a,
  H: 0x6fcd4b,
  I: 0x4aa8e8,
  J: 0x3a5fb0,
  K: 0x2a2a2a,
  L: 0xd8b36a,
  M: 0x5fd0a8,
  N: 0x1f2633,
  O: 0xf08a24,
  P: 0xe8d7a8,
  Q: 0x7a4a24,
  R: 0xe0483e,
  S: 0x9fd8ff,
  T: 0xb7c0cc,
  U: 0xc9a06a,
  V: 0x93c9a8,
  W: 0xffffff,
  X: 0x5a3b1e,
  Y: 0xffd23f,
  Z: 0xff6fa8,
  a: 0xa9dcff,
  b: 0x8fb8ff,
  d: 0x6e4521,
  e: 0x86dd5c,
  f: 0x6f52b8,
  g: 0x2f7a22,
  h: 0x9b7be0,
  i: 0x8fd3ff,
  j: 0x2f7fc0,
  k: 0xf7b7b0,
  l: 0x9c7536,
  m: 0x3aa884,
  n: 0x34425e,
  o: 0xffb25c,
  p: 0xc4a872,
  q: 0xb97a40,
  r: 0xa8302a,
  s: 0xc96a12,
  t: 0x7d8792,
  u: 0xa8834f,
  v: 0x7fb894,
  w: 0xdceefa,
  x: 0x25611b,
  y: 0xd9a514,
  z: 0xfff07a,
}

const PIXEL_SCENES: Record<PixelSize, Record<string, readonly string[]>> = {
  small: {
    topdown: [
      'GGGGGHHHHHGGGGGHHHHHGGGGGHHHHH',
      'GGggGHHHHHGGGGGHHHHHGGGGGHHHHH',
      'GggggHHHHHGGGGYHHHHHGGGGTTHHHH',
      'GggggHHHHHGGGYYYHHHHGGGGtTHHHH',
      'GGddGHHHHHGGYYYYYHHHGGGGGHHHHH',
      'HHHHHGGGGGHHHHYGGGGGHHHHHGGGGG',
      'HHHHHGGGGGHHHHYGGGGGHHHHHGGGGG',
      'HHHHHGGGGGHHHHHGGGGGHHHHHGGGGG',
      'HHHHHGGYGGHHHKKKGGGGYHHHHGGGGG',
      'HHHHHGYYGGHHKFFFKGGGYYHHHGGGGG',
      'GGGGGYYYYYGGGOOOHHYYYYYGGHHHHH',
      'GGGGGHYYHHGGOOOOOHHHYYGGGHHHHH',
      'GGGGGHHYHHGGGKGKHHHHYGGGGHHHHH',
      'GGGGGHHHHHGGGGGHHHHHGGGGGHHHHH',
      'GGGGGHHHHHGGGGYHHHHHGGGGGHggHH',
      'HHHTtGGGGGHHHHYGGGGGHHHHHggggG',
      'HHHHHGGGGGHHYYYYYGGGHHHHHggggG',
      'HHHHHGGGGGHHHYYYGGGGHHHHHGddGG',
      'HHHHHGGGGGHHHHYGGGGGHHHHHGGGGG',
      'HHHHHGGGGGHHHHHGGGGGHHHHHGGGGG',
    ],
    sideview: [
      'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'SSSWWWSSSSSSSSSSSSSSSSSSSSSSSS',
      'SSWWWWWWSSSSSSWWSSSSSSSWWWSSSS',
      'SSSwwwwSSSSSWWWSWWSSSSWWWWWWSS',
      'SYYYYYSSSSSSWSSSSSWSSSSwwwwSSS',
      'SYKKKYSSSSSWSSSSSSWSSSSSSSSSSS',
      'SYYYKYSSSSWSSSSSSSSWSSSSSSSSSS',
      'SYYKYYSSSWSSSSSSSSSSWSSSSSSSSS',
      'SYYYYYSSSWSSSSSSSSSSWWWSSSSSSS',
      'SYYKYYSSWSSSSSSSSSSSSWSSSSSSSS',
      'SSSSSSSSWSSSSSSSSSSSSSSSSSSSSS',
      'SSSSRRRSSSSSSSSSSSSDdDDDdDDDdD',
      'SSSSFFFSSSSSSSSSSSSddddddddddd',
      'SSSOOOOOSSSSSSSSSSSDDDdDDDdDDD',
      'SSSSOOOSSSSSSSSSSSSddddddddddd',
      'SSSSKSKSSSSSSSSSSSSDdDDDdDDDdD',
      'dDDDdDDDdDDDdDDDdDDDdDDDdDDDdD',
      'dddddddddddddddddddddddddddddd',
      'DDdDDDdDDDdDDDdDDDdDDDdDDDdDDD',
      'dddddddddddddddddddddddddddddd',
    ],
    maple: [
      'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'SSSSWWWSSSSSSSSSSSSSSSRRSSSSSS',
      'SSSWWWWWWSSSSSSSSSSSSSFFSSSSSS',
      'SSSSwwwwSSSSSSSSSSSSSOOOOSSSSS',
      'SSSSSSSSSSSSSSSSSSSSSSKSKSSSSS',
      'SSSSSSSSSSSSSSSSSGGGGGGGGGGGGS',
      'SSSSSSSSSSSSSSSSSSDDDDDDDDDDSS',
      'SSSSSOOOOSSSSSSSSSSddddddddSSS',
      'SSSSOWOOWOSSSSSSSSSSSSLSSSSSSS',
      'SSSSOOOOOOSSSSSSSSSSSSlSSSSSSS',
      'SSSSSFKFKSSSSSSSSSSSSSLSSSSSSS',
      'SSSSSFFFFSSSSSSSSSSSSSLSSSSSSS',
      'SGGGGGGGGGGGGGSSSSSSSSlSSSSSSS',
      'SSDDDDDDDDDDDSSSSSSSSSLSSSSSSS',
      'SSSdddddddddSSSSSSSSSSLSSSSSSS',
      'SSSSSSSSSSSSSSSSSSSSSSlSSSSSSS',
      'SSSSSSSSSSSSSSSSSSSSSSLSSSSSSS',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
      'dDDdDDdDDdDDdDDdDDdDDdDDdDDdDD',
    ],
    boardui: [
      'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
      'NPPPpppPPPpppPPPpppNNnnnnnnnnN',
      'NPBPpppPPPpppBPPpppNNnOOOOOOnN',
      'NPPPpppPPPpppPPPpppNNnOOOOOOnN',
      'NpppPPPpppPPPpppPPPNNnnnnnnnnN',
      'NpppPPPpppPPPpppPPPNNnnnnnnnnN',
      'NpppPPPpppPPPpppPPPNNnbbbbbbnN',
      'NPPPpppYYYpppPPPpppNNnnnnnnnnN',
      'NPPPpppYRYpppPPPpppNNnbbbbnnnN',
      'NPPPpppYYYpppPPPpppNNnnnnnnnnN',
      'NpppPPPpppPPPpppPPPNNnbbbbbnnN',
      'NpppPPPpppPPPpppRPPNNnnnnnnnnN',
      'NpppPPPpppPPPpppPPPNNnbbbnnnnN',
      'NPPPpppPPPpppPPPpppNNnnnnnnnnN',
      'NPPPRppPPPpppPPPpppNNnnnnnnnnN',
      'NPPPpppPPPBppPPPpppNNnMMMMMMnN',
      'NpppPPPpppPPPpppPPPNNnMMMMMMnN',
      'NpppPPPpppPPPpppPPPNNnnnnnnnnN',
      'NpppPPPpppPPPpppPPPNNnnnnnnnnN',
      'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
    ],
    systems: [
      'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
      'NBBBBBBBBBNNNNNNNNNNMMMMMMMMMN',
      'NBBWWWWWBBNNNNNNNNNNMMMMWMMMMN',
      'NBBWBBBWBBTNTNTNTNTNMMMWWWMMMN',
      'NBBWWWWWBBNNNNNNNNNNMMWWWWWMMN',
      'NBBBWBWBBBNNNNNNNNNNMMMMWMMMMN',
      'NBBBBBBBBBNNNNNNNNNNMMMMMMMMMN',
      'NNNNNTNNNNNNNNNNNNNNNNNNTNNNNN',
      'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
      'NNNNNTNNNNNNNNNNNNNNNNNNTNNNNN',
      'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
      'NNNNNTNNNNNNNNNNNNNNNNNNTNNNNN',
      'NNNNNNNNNNOOOOOOOOOONNNNNNNNNN',
      'NNNNNTNNNNOOOOYYOOOONNNNTNNNNN',
      'NNNNNNNNNNOOOYYYYOOONNNNNNNNNN',
      'NNNNNNTNTNOOYYYYYYOOTNTNNNNNNN',
      'NNNNNNNNNNOOOYYYYOOONNNNNNNNNN',
      'NNNNNNNNNNOOOOYYOOOONNNNNNNNNN',
      'NNNNNNNNNNOOOOOOOOOONNNNNNNNNN',
      'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
    ],
  },
  medium: {
    topdown: [
      'EGGGGGGGHHHHHHHHGG00900EHHHHHHHHGGGGGGGG',
      'GGGgggGGHHHHHHHHGG90000GHHeHHHHHGIIIGGGG',
      'GGeEgggGHHHHHZHHGG00Y90GHHHHHeHHiiIIIGGG',
      'GgEEEgggHeHHZzZHGG0YYY0GHHHHHHHIiIIIIIGG',
      'GggEggggxHHHeHHHGGYYYYYGHHHHHHHIIIIIIIGG',
      'GgggggggxHHHHHHeGGy0Y0yGHHHHHHHIIIIIIIEG',
      'GGgggggxxHHHHHHHGG90Y00GHHHHHHHHIIIIjGGG',
      'GGGgggxxHHHHHHHHGG00090GHHHHHHHHGIIIGGGG',
      'HeHHxxxHGGGGGGGGHH09000HEGGGGGGGHHHHHHHH',
      'HHHHeHHHGGGGGGGGHHXXXX9HGGGEGGGGHHHHHHHH',
      'EEEEEEEEEEEEEEEEEXXXXXXEEEEEEEEEEEEEEEEE',
      '0000900009y000900XFFFFX090000y0000900009',
      '000900009YY009000FKFFKF900009YY009000090',
      '00900009YYYYY000FOOOOOOF000YYYYY90000900',
      '090000900YY900009OOOOOO000900YY900009000',
      '9000090000y0000900J09J0009000y9000090000',
      'EEEEEEEEEEEEEEEEEEK00K0EEEEEEEEEEEEEEEEE',
      'GGGGGEGGHHHHHHHHGG00090GHHHHeHHHGGGGGGGG',
      'GTtGGGgggHHHHHHHGG09000GHHHHHHHeGgggGGGG',
      'GttGGeEgggHeHHHHGG00Y09GHHHHEEHHeEgggGGG',
      'GGGGgEEEgggHHHeHGGy0Y0yGHHHEggEgEEEgggGG',
      'GGGGggEggggxHHHHGEYYYYYGHHHHEEHggEggggxG',
      'GGGGgggggggxHHHHGG0YYY0GHHHHHHHgggggggxG',
      'EGGGGgggggxxHHHHGG09Y00EHHHHHHHHgggggxxG',
      'HHHeHHgggxxGGGGGHH00009HGGEGGGGGHgggxxHH',
      'HHHHHHexxxGGGGGGHH00900HGGGGGEGGHHxxxHHH',
    ],
    sideview: [
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'AAAyAAAAAyAAAAAAWWWAAAAAAAAAAAAAAAAAAAAA',
      'AAyYyAAAyYyAAAAWWWWWCWWAAAAAAAAAWWWAAAAA',
      'AAAyAAAAAyAAAAWWCWWWWWWWWAAAAAAWWWWWWWAA',
      'AAAAAAAAAAAAAAAWWwwwwwAACWAAAAWWWWWWWWWA',
      'AyyyyyyddddddAWCAAAAAAAAAWWAAAAwwwwwwwAA',
      'AyYKKYydDDdDdWCAAAAAAAAAAAWWAAAAAAAAAAAA',
      'AyYYKYyddddddCAAAAAAAAAAAAAWAAAAAAAAAAAA',
      'ayYKYYydDdDDdaaaaaaaaaaaaaaaWaaaa5555aaa',
      'ayYYYYyddddddaaaaaaaaaaaaaaaWWWa55K5K5aa',
      'ayyKyyyddddddaaaaaaaaaaaaaaaaWaa555555aa',
      'aaaaXXXXaaaaaaaaaaaaaaaaaaaaaaaa666666aa',
      'vvvXXXXXXaaaaaaaaaaaaaaaaaaeGGeGGeGGeGGe',
      'VVVXFFFFXaaaaaaaaaaaaaaaaaaDDDDDdDDDDDdD',
      'VVVVKFFKaaaaaaaaaaaaaaaaavvddddddddddddd',
      'VVVVFFFFvaaaaaaaaaaaaaavvVVqqdqqqqqdqqqq',
      'VVVOOOOOOvvCCCCCCCCCCvvVVVVDDdDDDDDdDDDD',
      'VVVFOOOOFVVvvCCCCCCvvVVVVVVddddddddddddd',
      'VVVVJJJJVVVVVvvvvvvVVVVVVVVqqqqqdqqqqqdq',
      'VVVVKVVKVVVVVVVVVVVVVVVVVVVDDDDDdDDDDDdD',
      'eGGeGGeGGeGGeGGeGGeGGeGGeGGeGGeGGeGGeGGe',
      'DDDDDdDDDDDdDDDDDdDDDDDdDDDDDdDDDDDdDDDD',
      'dddddddddddddddddddddddddddddddddddddddd',
      'qqdqqqqqdqqqqqdqqqqqdqqqqqdqqqqqdqqqqqdq',
      'DDdDDDDDdDDDDDdDDDDDdDDDDDdDDDDDdDDDDDdD',
      'dddddddddddddddddddddddddddddddddddddddd',
    ],
    maple: [
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAXXXXAAAAAAAAA',
      'AAAWWWAAAAAAAAAAAAAAAAAAAAXXXXXXAAAAAAAA',
      'AAWWWWWWWAAAAAAAAAAAAAAAAAXFFFFXAAAAAAAA',
      'AWWWWWWWWWAAAAAWWWAAAAAAAAAKFFKAAAAAAAAA',
      'AAwwwwwwwAAAAAWWWWWWWAAAAAAFFFFAAAAAAAAA',
      'AAAAAAAKKKKAAWWWWWWWWWAAAAOOOOOOAAAAAAAA',
      'AAAAAKKOOOOKKAwwwwwwwAAAAAFOOOOFAAAAAAAA',
      'AAAAKOooOOOWWKAAAAAAAAAAAAAJJJJAAAAAAAAA',
      'aaaKOooOOOOWWOKaaaaaaaaaaEaKaaKaaaaEaaaa',
      'aaaKOOOOWWOOOOKaaaaaaaGGeGGeGGeGGeGGeGGa',
      'aaaaKKKKKKKKKKaaaaaaaaEEEEEEEEEEEEEEEEEa',
      'aaaaaKFFFFFFKaaaaaaaaaaqqqqqqqqqqqqqqqaa',
      'aaaaaKFKFFKFKaaaaaaaaaaaDDDdDDDllDDdDaaa',
      'aaaaaKkFFFFkKaaaaaaaaaaaaQQQQQQLuQQQaaaa',
      'aavvvEKKaaKKaaaEaaaaaaaaaaaaaaaLuavvvvvv',
      'vGGeGGeGGeGGeGGeGGaaaaaaaaaaaaallvVVVVVV',
      'VEEEEEEEEEEEEEEEEECCCCCCCCCCCCvLuVVVVVVV',
      'VVqqqqqqqqqqqqqqqCCCCCCCCCCCvvVLuVVVVVVV',
      'VVVdDDDdDDDdDDDdCCCCCCCCCCvvVVVllVVVVVVV',
      'VVVVQQQQQQQQQQQVvvCCCCCCvvVVVVVLuVVVVVVV',
      'VVVZVVVVVVVVVVVVVVvvvZvvVVVVVVVLuVVVVVVV',
      'VEZzZEVVVEVVVEVVVEVVZzZVVEVVVEVllEVUuEVV',
      'eGGeGGeGGeGGeGGeGGeGGeGGeGGeGGeLueGGeGGe',
      'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
      'DDdDDDDdDDDDdDDDDdDDDDdDDDDdDDDDdDDDDdDD',
      'dddQddddddQddddddQddddddQddddddQddddddQd',
    ],
    boardui: [
      '8888888888888888888888888888888888888888',
      'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
      'NddddddddddddddddddddddNNOOOOOOOOOOOOOON',
      '8dPPPPpBBpPPPPppppPPPPd88OOoooooooOOOOO8',
      'NdPPPPBbBBPPPPppppPPPPdNNOOOOOOOOOOOOOON',
      'NdPPPPBBBBPPPPppppPPPPdNNnnnnnnnnnnnnnnN',
      '8dPPPPpBBpPPPPppppPPPPd88nnnnnnnnnnnnnn8',
      'NdppppPPPPppppPBBPppppdNNnnNNRNNnRRRrrnN',
      'NdppppPPPPppppBbBBppppdNNnnNRRRNnRRRrrnN',
      '8dppppPPPPppppBBBBppppd88nnNNRNNnnnnnnn8',
      'NdppppPPPPppppPBBPppppdNNnnNrrrNnBBJJJnN',
      'NdPPPPppppYBBYppppPPPPdNNnnNNNNNnBBJJJnN',
      '8dPPPPppppBbBBppppPPPPd88nnnnnnnnnnnnnn8',
      'NdPPPPppppBBBBppppPPPPdNNnnnnnnnnnnnnnnN',
      'NdPPPPppppYBBYppppPPPPdNNnnYYnbbbbbbbnnN',
      '8dpRRpPPPPppppPRRPppppd88nnYYntttttnnnn8',
      'NdRkRRPMMPpMMpRkRRppppdNNnnnnnnnnnnnnnnN',
      'NdRRRRPMMPpMMpRRRRppppdNNnnYYnbbbbbnnnnN',
      '8dpRRpPPPPppppPRRPppppd88nnYYntttnnnnnn8',
      'NdPPPPppppPPPPppppPRRPdNNnnnnnnnnnnnnnnN',
      'NdPPPPppppPPPPppppRkRRdNNnnMMMMMMMMMMnnN',
      '8dPPPPppppPPPPppppRRRRd88nnMMmmmmmMMMnn8',
      'NdPPPPppppPPPPppppPRRPdNNnnnnnnnnnnnnnnN',
      'NddddddddddddddddddddddNNnnnnnnnnnnnnnnN',
      '8888888888888888888888888888888888888888',
      'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
    ],
    systems: [
      '8NNN8NNN8NNN8NNN8NNN8NNN8NNN8NNN8NNN8NNN',
      'NNBBBBBBBBBNNNNNNNNNNNNNNNNNNMMMMMMMMMNN',
      'NBBBBBBBWBBBNNNNNNNNNNNNNNNNMMMTTTTTMMMN',
      'NBBBBBWBWBBBNNNNNNNNNNNNNNNNMMMTTTTTMMMN',
      '8BBWBBWBWBBBTTNTTNTT8TTNTTNTMMMMMLMMMMMN',
      'NBBWBBWBWBBBNNNNNNNNNNNNNNNNMMMMMLMMMMMN',
      'NBBWWWWWWBBBNNNNNNNNNNNNNNNNMMMMMlMMMMMN',
      'NBBBBBBBBBBBNNNNNNNNNNNNNNNNMMMMMMMMMMMN',
      '8NJJJJJJJJJN8NNN8NNN8NNN8NNN8mmmmmmmmmNN',
      'NNNNNNTNNNNNNNNNNNNNNNNNNNNNNNNNNTNNNNNN',
      'NNNNNNTNNNNNNNNNNNNNNNNNNNNNNNNNNTNNNNNN',
      'NNNNNNTTNTTNTTNTTNTTTTNTTNTTNTTNTTNNNNNN',
      '8NNN8NNN8NNN8NNN8NNT8NNN8NNN8NNN8NNN8NNN',
      'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
      'NNNNNNNNNNNNNNNOOOOOOOOOONNNNNNNNNNNNNNN',
      'NNNNNNNNNNNNNNOOOOOYYOOOOONNNNNNNNNNNNNN',
      '8NNN8NNN8NNN8NOOOOYYYYOOOONN8NNN8NNN8NNN',
      'NNhhhhhhhhhNNNOYYYYYYYYYYONNNNNNNNNNNNNN',
      'NhhhhWWhhhhhNNOOYYYYYYYYOONNNNNNNNNNNNNN',
      'NhhhYYYYYhhhTNOOOYYYYYYOOONNNNNNNNNNNNNN',
      '8hhYYzYYYYhhTTOOOYYyyYYOOONN8NNN8NNN8NNN',
      'NhhYYYYYYYhhTNOOYYyOOyYYOONNNNNNNNNNNNNN',
      'NhhhYYYYYhhhNNOOYOOOOOOYOONNNNNNNNNNNNNN',
      'NhhhhhhhhhhhNNOOOOOOOOOOOONNNNNNNNNNNNNN',
      '8NfffffffffN8NNssssssssssNNN8NNN8NNN8NNN',
      'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
    ],
  },
}

const CAPTIONS: Record<'ko' | 'en', Record<string, string>> = {
  ko: { topdown: '탑다운 · 사방 이동', sideview: '타일 횡스크롤 · 점프', maple: '메이플식 · 발판과 줄', boardui: '보드 + 옆 정보창', systems: '시스템 연결' },
  en: { topdown: 'Top-down · move any way', sideview: 'Tile side view · jumps', maple: 'Maple style · footholds & ropes', boardui: 'Board + side panel', systems: 'Linked systems' },
}

/** One line under a card's picture saying what it shows; empty where `visual` has no picture. */
export function captionFor(visual: string, lang: string | undefined): string {
  return own(CAPTIONS[/^ko\b/i.test(lang ?? '') ? 'ko' : 'en'], visual) ?? ''
}

/**
 * The scene for `visual` at `size` as Raster cells, three words per cell
 * [codePoint, foreground, background]; undefined where `visual` has no scene.
 */
export function pixelWords(visual: string, size: PixelSize = 'small'): Uint32Array | undefined {
  const scene = own(PIXEL_SCENES[size], visual)
  if (!scene) return undefined
  const { columns, rows } = PIXEL_SIZES[size]
  const words = new Uint32Array(columns * rows * 3)
  for (let r = 0; r < rows; r++) {
    const top = scene[r * 2] ?? ''
    const bottom = scene[r * 2 + 1] ?? ''
    for (let c = 0; c < columns; c++) {
      const at = (r * columns + c) * 3
      words[at] = 0x2580 /* ▀ upper half block */
      words[at + 1] = PIXEL_PALETTE[top[c] ?? ''] ?? 0
      words[at + 2] = PIXEL_PALETTE[bottom[c] ?? ''] ?? 0
    }
  }
  return words
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** A Raster's `cells`: the words as little-endian u32 bytes, in standard padded base64. */
export function packCells(words: Uint32Array): string {
  const bytes: number[] = []
  for (const word of words) bytes.push(word & 0xff, (word >>> 8) & 0xff, (word >>> 16) & 0xff, (word >>> 24) & 0xff)
  let out = ''
  for (let k = 0; k < bytes.length; k += 3) {
    const a = bytes[k] ?? 0
    const b = bytes[k + 1]
    const c = bytes[k + 2]
    const n = (a << 16) | ((b ?? 0) << 8) | (c ?? 0)
    out += B64[(n >> 18) & 63]
    out += B64[(n >> 12) & 63]
    out += b === undefined ? '=' : B64[(n >> 6) & 63]
    out += c === undefined ? '=' : B64[n & 63]
  }
  return out
}


// ---------- laying cards out ----------

/** A card's border and padding around its content, in columns. */
export const CARD_FRAME = 4
const PANE_PADDING = 2
const CARD_GAP = 1

/** How many cards of `size` fit one row of a pane `bodyColumns` wide. */
export function cardsPerRow(bodyColumns: number, size: PixelSize): number {
  const card = PIXEL_SIZES[size].columns + CARD_FRAME
  return Math.max(0, Math.floor((bodyColumns - PANE_PADDING + CARD_GAP) / (card + CARD_GAP)))
}

/** The picture size that puts the most of a question's `count` cards in one row; medium on a tie. */
export function pictureSizeFor(bodyColumns: number, count: number): PixelSize {
  const medium = Math.min(count, cardsPerRow(bodyColumns, 'medium'))
  const small = Math.min(count, cardsPerRow(bodyColumns, 'small'))
  return medium > 0 && medium >= small ? 'medium' : 'small'
}

/* a card lying on its side: picture on the left, text beside it, this many columns for the text at least */
const ROW_TEXT_MIN = 30
const ROW_GAP = 2
/** The narrowest pane that lists cards on their side; narrower, the upright cards stack one under another. */
export const ROW_CARDS_MIN = 70

/** How a terminal pane lays its option cards out. Where three or more cards fit a row they stand upright side by
    side; where only one or two would, a list of cards on their side (picture left, text right) shows more at once
    and lines every option up the same way, as long as the text keeps room beside the picture. */
export function cardShapeFor(bodyColumns: number): 'upright' | 'row' {
  return cardsPerRow(bodyColumns, 'small') >= 3 || bodyColumns < ROW_CARDS_MIN ? 'upright' : 'row'
}

/** Rows a pane must show for the question and three cards on their side with the medium picture (15 rows each). */
export const ROW_MEDIUM_MIN_ROWS = 60

/** The picture of a card on its side: medium while the text keeps its room beside it and the pane is tall enough
    to show three such cards at once; else small, so three cards (12 rows each) fit a common terminal. */
export function rowPictureFor(bodyColumns: number, bodyRows = 0): PixelSize {
  const room = bodyColumns - PANE_PADDING - CARD_FRAME - ROW_GAP - ROW_TEXT_MIN
  return room >= PIXEL_SIZES.medium.columns && bodyRows >= ROW_MEDIUM_MIN_ROWS ? 'medium' : 'small'
}

/** Columns a text takes on a terminal: Hangul, CJK, fullwidth forms and emoji take two, joiners and selectors none. */
export function textCells(text: string): number {
  let cells = 0
  for (const ch of text) {
    const c = ch.codePointAt(0) ?? 0
    if (c === 0x200d || c === 0xfe0f || (c >= 0x300 && c < 0x370)) continue
    const isWide =
      (c >= 0x1100 && c <= 0x115f) ||
      (c >= 0x2600 && c <= 0x27bf) ||
      (c >= 0x2e80 && c <= 0xa4cf) ||
      (c >= 0xac00 && c <= 0xd7a3) ||
      (c >= 0xf900 && c <= 0xfaff) ||
      (c >= 0xfe30 && c <= 0xfe4f) ||
      (c >= 0xff00 && c <= 0xff60) ||
      (c >= 0xffe0 && c <= 0xffe6) ||
      c >= 0x1f300
    cells += isWide ? 2 : 1
  }
  return cells
}

/** Rows a text takes wrapped at word breaks in a column: a few columns spared for the words that move down whole. */
export function rowsIn(text: string, columns: number): number {
  return Math.max(1, Math.ceil(textCells(text) / Math.max(1, columns - 4)))
}

/** How a card on its side words its text: 'full' as an upright card (every section under its heading), 'labeled' (what
    comes first and what waits, each under its heading), 'inline' (those two a line each, the heading in front). */
export type RowText = 'full' | 'labeled' | 'inline'

/** The most a card on its side can say beside its picture without growing past it, so a row of cards stays as short
    as the picture and three still fit one screen. */
export function rowTextFor(
  o: { title: string; tagline: string; summary: readonly string[]; firstBuild: string; tradeoff: string },
  columns: number,
  rows: number,
): RowText {
  const head = rowsIn(o.title, columns) + (o.tagline !== '' ? rowsIn(o.tagline, columns) : 0) + 1
  /* each section: the gap above it, its heading, its body */
  const section = (body: number) => 2 + body
  const tradeoff = section(rowsIn(o.tradeoff, columns))
  const summary = o.summary.length > 0 ? section(o.summary.reduce((n, x) => n + rowsIn(`· ${x}`, columns), 0)) : 0
  const firstBuild = o.firstBuild !== '' ? section(rowsIn(o.firstBuild, columns)) : 0
  if (head + summary + firstBuild + tradeoff <= rows) return 'full'
  const lead = o.firstBuild || o.summary.join(' · ')
  return head + (lead !== '' ? section(rowsIn(lead, columns)) : 0) + tradeoff <= rows ? 'labeled' : 'inline'
}

/** The pane width that holds a gate's widest question in one row: medium cards, small ones when that passes 150 columns. */
export function paneColumnsFor(d: SheetGateData | null): number {
  const count = Math.max(1, ...(d?.questions ?? []).map(q => q.options.length))
  const need = (size: PixelSize) => count * (PIXEL_SIZES[size].columns + CARD_FRAME) + (count - 1) * CARD_GAP + PANE_PADDING
  const medium = need('medium')
  return Math.max(60, medium <= 150 ? medium : Math.min(need('small'), 150))
}

/**
 * The scene for `visual` at `size` as plain data for the clickable picture
 * region (hooks/picture.tsx): its pixel rows, one letter per pixel, and the
 * colour of each letter it uses; undefined where `visual` has no scene.
 */
export function pixelScene(visual: string, size: PixelSize = 'small'): { rows: string[]; palette: { [letter: string]: string } } | undefined {
  const scene = own(PIXEL_SCENES[size], visual)
  if (!scene) return undefined
  const palette: { [letter: string]: string } = {}
  for (const row of scene) for (const ch of row) {
    const rgb = PIXEL_PALETTE[ch]
    if (rgb !== undefined && !(ch in palette)) palette[ch] = '#' + rgb.toString(16).padStart(6, '0')
  }
  return { rows: [...scene], palette }
}

/**
 * A stand-in picture the size of the schematics for a card that has none, so
 * its text starts level with its neighbours': the emoji centred, or nothing.
 */
export function emojiSvg(emoji: string): string {
  const safe = emoji.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c)
  /* the scene canvas's shape (40 x 26), so a stand-in takes a picture's room exactly */
  const body = safe ? `<text x="100" y="84" font-size="56" text-anchor="middle">${safe}</text>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130">${body}</svg>`
}

/** An SVG given a drawn width, and the height its viewBox implies: a surface draws it at that size, or smaller
    where its slot is narrower. */
export function sizedSvg(svg: string, width: number): string {
  const box = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)
  if (!box) return svg
  const height = Math.round((width * Number(box[2])) / Number(box[1]))
  return svg.replace('<svg ', `<svg width="${width}" height="${height}" `)
}
