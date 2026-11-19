// The build-status pane's reading of msw-planning's build docs: the roadmap
// (Docs/<game>-Roadmap.md), the active milestone's GDD and Phase docs, the
// archived GDDs and Archive/As-built.md, read into one BuildModel; and the one
// next step it offers for where the build stands. Pure: register.tsx reads
// the files and draws the pane.
//
// The pane only reads. Its buttons send a request into the chat, and Claude
// changes the docs by the skill's own rules (references/build-management.md).

import type {
  BuildBacklogItem,
  BuildChange,
  BuildIssue,
  BuildItem,
  BuildMilestone,
  BuildModel,
  BuildPast,
  BuildPhase,
  MilestoneStatus,
} from '../types'

import { fill, textCells } from './sheet'

const STRINGS = {
  en: {
    paneTitle: 'Build status',
    noPlanTitle: 'No game plan yet',
    noPlanBody: 'Once msw-planning writes Docs/<game>-Roadmap.md, the build shows here.',
    brokenTitle: 'The roadmap could not be read',
    refresh: '⟳ Reload',
    tabActive: '▶ M{m} in progress',
    tabUserTest: '⏳ M{m} awaiting tests',
    tabDone: '✅ M{m}',
    tabPlanned: 'M{m} planned',
    tabCandidate: 'M{m} candidate',
    tabBacklog: 'For later {n}',
    nowTitle: 'What to do now',
    busy: '⏳ Claude is working',
    busyOn: '⏳ Claude is working on {task}',
    busyNote: 'The buttons come back when this turn ends.',
    askingNote: 'Claude is asking you in the chat: you can pick here instead.',
    gateWaits: 'A planning question is waiting for your answer',
    openGate: 'Open the decision pane',
    startPlanTitle: 'Plan a game first',
    startPlan: '🎮 Start planning a game',
    writeGddTitle: 'M{m} has no design doc yet',
    writeGdd: '📝 Write the M{m} design doc',
    userTestTitle: 'Waiting on your play test',
    userTestNote: 'Play it, then tell Claude what you saw.',
    tellResults: '🧪 Tell the test results',
    phaseGoTitle: 'Phase {n} · {built} of {total} built',
    implPhase: '▶ Continue Phase {n}',
    startPhase: '▶ Start building Phase {n}',
    planFirst: '📝 Plan Phase {n} first',
    onlyThis: 'Only {task}',
    nextTask: 'Next task: {task}',
    verifyTitle: 'Phase {n} is built: verify it',
    verify: '🧪 Verify Phase {n}',
    wrapPhaseTitle: 'Phase {n} is all verified',
    wrapPhase: '🏁 Wrap up Phase {n}',
    planPhaseTitle: 'Phase {n} is next',
    planPhase: '📝 Plan Phase {n} in detail',
    implDirect: '▶ Build Phase {n} from the design doc',
    finishTitle: 'Every M{m} item is verified',
    finishMilestone: '🏁 Wrap up M{m}',
    nextMilestoneTitle: 'M{m} is next on the roadmap',
    planMilestone: '🗺 Plan M{m}',
    allDoneTitle: 'Every milestone on the roadmap is done',
    chooseNext: '🗺 Decide what comes next',
    phaseLine: 'Phase {n} · {title}',
    counts: '✅ verified {ok} · 🟡 built {mid} · ⬜ left {no}',
    laterPhases: 'Then: {list}',
    phaseCount: 'Phase {n} ({k})',
    attention: 'Needs a check',
    unverified: '🟡 {n} built but not verified yet',
    yours: '⚠️ {task}: {note}',
    checklist: 'Checklist',
    doThis: '▶ Do this task',
    verifyThis: '🧪 Verify this task',
    deferThis: '🕓 Move to later',
    dropThis: '🗑 Drop from the plan',
    dropConfirm: '🗑 Press again to drop it',
    editThis: '✏️ Change this task',
    changePh: 'How should it change? More, less or different',
    changeSubmit: 'change',
    changeSend: '✏️ Change it like this',
    changeSuggest: '💡 Suggest changes',
    changeCancel: 'Cancel',
    changeEmpty: 'Write the change first, or press 💡 Suggest changes',
    plan: 'Planned',
    result: 'Built',
    changes: 'Changed',
    scale: 'Size',
    issues: 'Known issues',
    finished: 'Finished',
    scaleText: '{p} phases · {i} tasks',
    noChanges: 'No plan changes',
    noSummary: 'No summary in Archive/As-built.md yet.',
    issueCount: '({n}×)',
    futureNote: 'Not planned in detail yet: its design doc is written once the milestone before it is done.',
    candidateNote: 'A candidate: its order and scope are settled when the milestone before it ends.',
    backlogTitle: 'For later: wanted, not yet placed in a milestone',
    backlogEmpty: 'Nothing saved for later yet.',
    ideaTitle: '💡 Something to add to the plan',
    ideaPh: 'e.g. Warn the player before the boss appears',
    ideaPhLater: 'e.g. Let it be played on mobile too',
    ideaHintNow: 'Write the new task and press Enter: it goes into this milestone',
    ideaHintLater: 'Write it and press Enter: it is saved for later',
    ideaPick: 'Choose where it goes with a button below',
    ideaSubmit: 'send',
    ideaNow: '➕ Add as a new task',
    ideaLater: '🗂 Save it for later',
    ideaEmpty: 'Write what you want first',
    ideaBusy: 'Sent while Claude works, it is delivered when this turn ends.',
    ideaQueued: 'Sent: Claude reads it when the current work ends.',
    ideaAsking: 'Claude is asking in the chat: answer that first. What you wrote stays here.',
    ideaNoInput: 'Type it in the chat: this surface has no text field.',
    pStartPlan: "Let's plan a new game",
    pWriteGdd: 'Write the M{m} design doc',
    pImplPhase: 'Continue implementing Phase {n}',
    pStartPhase: 'Start implementing Phase {n}',
    pDoTask: 'Implement {task}',
    pVerifyTask: 'Verify {task}',
    pDeferTask: '[{task}] Take this task out of this milestone and save it for later',
    pDropTask: '[{task}] Drop this task from the plan',
    pEditTask: '[{task}] Change this task like this: {text}',
    pSuggestTask: '[{task}] I want to change this task. Look at what it says now and give me choices to pick from: more, less or different',
    pVerify: 'Verify what is built in Phase {n}: {ids}',
    pWrapPhase: 'Phase {n} is all verified: wrap it up',
    pPlanPhase: 'Write the Phase {n} detailed plan',
    pFinish: 'Wrap up milestone M{m}',
    pPlanMilestone: 'Plan the next milestone, M{m}',
    pChooseNext: "Let's decide what comes after this roadmap",
    fResults: 'Play test results: ',
    pIdeaNow: 'Add this to the current milestone (M{m}) as a new task: {text}',
    pIdeaLater: 'Save this on the roadmap as something for later: {text}',
    bandActive: '📋 M{m} · Phase {n} · built {built}/{total} · verified {ok}/{total}',
    bandMilestone: '📋 M{m}',
    bandNext: '📋 Next: M{m}',
    bandAllDone: '📋 Every milestone done',
    bandOpen: 'Show build status',
  },
  ko: {
    paneTitle: '빌드 현황',
    noPlanTitle: '아직 게임 기획서가 없어요',
    noPlanBody: 'msw-planning이 Docs/<게임>-Roadmap.md 를 쓰면 여기서 진행 상황을 볼 수 있어요.',
    brokenTitle: '로드맵을 읽지 못했어요',
    refresh: '⟳ 다시 읽기',
    tabActive: '▶ M{m} 진행 중',
    tabUserTest: '⏳ M{m} 테스트 대기',
    tabDone: '✅ M{m}',
    tabPlanned: 'M{m} 예정',
    tabCandidate: 'M{m} 후보',
    tabBacklog: '나중에 할 일 {n}',
    nowTitle: '지금 할 일',
    busy: '⏳ Claude가 작업 중이에요',
    busyOn: '⏳ Claude가 {task} 작업 중이에요',
    busyNote: '이번 작업이 끝나면 버튼이 다시 나타나요.',
    askingNote: 'Claude가 채팅에서 묻고 있어요. 여기서 골라도 돼요.',
    gateWaits: '먼저 답할 기획 질문이 있어요',
    openGate: '결정 패널 열기',
    startPlanTitle: '먼저 게임을 기획해요',
    startPlan: '🎮 새 게임 기획 시작',
    writeGddTitle: 'M{m} 기획서가 아직 없어요',
    writeGdd: '📝 M{m} 기획서 쓰기',
    userTestTitle: '직접 플레이 테스트를 기다리고 있어요',
    userTestNote: '플레이해 보고 본 것을 Claude에게 알려 주세요.',
    tellResults: '🧪 테스트 결과 알려주기',
    phaseGoTitle: 'Phase {n} · {total}개 중 {built}개 구현',
    implPhase: '▶ Phase {n} 구현 이어가기',
    startPhase: '▶ Phase {n} 구현 시작',
    planFirst: '📝 Phase {n} 상세 기획 먼저',
    onlyThis: '{task}만 진행',
    nextTask: '다음 작업: {task}',
    verifyTitle: 'Phase {n} 구현이 끝났어요 — 검증할 차례예요',
    verify: '🧪 Phase {n} 검증 진행',
    wrapPhaseTitle: 'Phase {n} 검증이 모두 끝났어요',
    wrapPhase: '🏁 Phase {n} 마무리하기',
    planPhaseTitle: '다음은 Phase {n}이에요',
    planPhase: '📝 Phase {n} 상세 기획하기',
    implDirect: '▶ 기획서대로 Phase {n} 바로 구현',
    finishTitle: 'M{m}의 모든 항목이 검증됐어요',
    finishMilestone: '🏁 M{m} 마무리하기',
    nextMilestoneTitle: '로드맵의 다음은 M{m}이에요',
    planMilestone: '🗺 M{m} 기획하기',
    allDoneTitle: '로드맵의 마일스톤을 모두 마쳤어요',
    chooseNext: '🗺 다음 단계 정하기',
    phaseLine: 'Phase {n} · {title}',
    counts: '✅ 검증 {ok} · 🟡 구현 {mid} · ⬜ 남음 {no}',
    laterPhases: '이어서: {list}',
    phaseCount: 'Phase {n} ({k}개)',
    attention: '확인이 필요해요',
    unverified: '🟡 구현만 되고 검증 전인 작업 {n}개',
    yours: '⚠️ {task}: {note}',
    checklist: '체크리스트',
    doThis: '▶ 이 작업 진행',
    verifyThis: '🧪 이 작업 검증',
    deferThis: '🕓 나중으로 미루기',
    dropThis: '🗑 계획에서 빼기',
    dropConfirm: '🗑 한 번 더 누르면 빼요',
    editThis: '✏️ 이 작업 고치기',
    changePh: '어떻게 바꿀지 적어요 — 늘리기·줄이기·다르게',
    changeSubmit: '고치기',
    changeSend: '✏️ 이렇게 고치기',
    changeSuggest: '💡 고칠 방향 제안받기',
    changeCancel: '취소',
    changeEmpty: '바꿀 내용을 먼저 적어 주세요. 잘 모르겠으면 💡 제안받기를 눌러요',
    plan: '계획',
    result: '결과',
    changes: '변경',
    scale: '규모',
    issues: '남은 문제',
    finished: '완료',
    scaleText: 'Phase {p}개 · 작업 {i}개',
    noChanges: '계획 변경 없음',
    noSummary: 'Archive/As-built.md 에 아직 완료 요약이 없어요.',
    issueCount: '({n}회)',
    futureNote: '아직 상세 기획 전이에요. 앞 마일스톤을 마치면 이 마일스톤의 기획서를 써요.',
    candidateNote: '후보 단계예요. 순서와 범위는 앞 마일스톤을 마치며 다시 정해요.',
    backlogTitle: '나중에 할 일 — 아직 마일스톤을 정하지 않은 것',
    backlogEmpty: '나중에 할 일이 아직 없어요.',
    ideaTitle: '💡 계획에 더하고 싶은 것',
    ideaPh: '예: 보스 등장 전에 경고 연출 넣기',
    ideaPhLater: '예: 모바일에서도 할 수 있게',
    ideaHintNow: '새 할 일을 적고 Enter를 누르면 이번 마일스톤에 넣어요',
    ideaHintLater: '적고 Enter를 누르면 나중에 할 일로 적어요',
    ideaPick: '어디에 넣을지 아래 버튼으로 골라 주세요',
    ideaSubmit: '보내기',
    ideaNow: '➕ 새 할 일로 넣기',
    ideaLater: '🗂 나중에 할 일로 적기',
    ideaEmpty: '먼저 하고 싶은 것을 적어 주세요',
    ideaBusy: 'Claude가 작업 중일 때 보내면 이번 작업이 끝난 뒤 전달돼요.',
    ideaQueued: '보냈어요. 지금 작업이 끝나면 Claude가 읽어요.',
    ideaAsking: 'Claude가 채팅에서 묻고 있어요. 먼저 답해 주세요. 적은 내용은 그대로 남아 있어요.',
    ideaNoInput: '여기서는 입력칸을 쓸 수 없어요. 채팅에 적어 주세요.',
    pStartPlan: '새 게임 기획을 시작하자',
    pWriteGdd: 'M{m} 기획서 써줘',
    pImplPhase: 'Phase {n} 구현 이어서 진행해줘',
    pStartPhase: 'Phase {n} 구현 시작해줘',
    pDoTask: '{task} 작업 진행해줘',
    pVerifyTask: '{task} 검증해줘',
    pDeferTask: '[{task}] 이 작업을 이번 마일스톤에서 빼서 나중에 할 일로 옮겨줘',
    pDropTask: '[{task}] 이 작업을 계획에서 빼줘',
    pEditTask: '[{task}] 이 작업을 이렇게 고쳐줘: {text}',
    pSuggestTask: '[{task}] 이 작업을 고치고 싶어. 지금 내용을 보고 늘리기·줄이기·다르게 바꾸기 중에서 고를 수 있게 선택지를 보여줘',
    pVerify: 'Phase {n}에서 구현된 {ids} 검증 진행해줘',
    pWrapPhase: 'Phase {n} 검증이 모두 끝났어. 마무리 정리해줘',
    pPlanPhase: 'Phase {n} 상세 기획 써줘',
    pFinish: 'M{m} 마일스톤 마무리 정리해줘',
    pPlanMilestone: '다음 마일스톤 M{m} 기획해줘',
    pChooseNext: '로드맵 다음 단계를 같이 정하자',
    fResults: '플레이 테스트 결과: ',
    pIdeaNow: '이번 마일스톤(M{m})에 새 할 일로 넣어줘: {text}',
    pIdeaLater: '나중에 할 일로 로드맵에 적어줘: {text}',
    bandActive: '📋 M{m} · Phase {n} · 구현 {built}/{total} · 검증 {ok}/{total}',
    bandMilestone: '📋 M{m}',
    bandNext: '📋 다음: M{m}',
    bandAllDone: '📋 모든 마일스톤 완료',
    bandOpen: '빌드 현황 보기',
  },
} as const

export type BuildStrings = { [K in keyof (typeof STRINGS)['en']]: string }

export function buildStrings(lang: string | undefined): BuildStrings {
  return /^ko\b/i.test(lang ?? '') ? STRINGS.ko : STRINGS.en
}

export const EMPTY_BUILD: BuildModel = {
  status: 'none',
  lang: 'en',
  game: '',
  milestones: [],
  backlog: [],
  active: 0,
  gddFound: false,
  phases: [],
  issues: [],
  problems: [],
  stamp: '',
}

// ---------- reading the docs ----------

const STATE_LINE = /^\s*[-*]\s*(⬜|🟡|✅)\s*(.+?)\s*$/u
const BULLET = /^\s*[-*]\s+(.+?)\s*$/
const TABLE_ROW = /^\s*\|(.+)\|\s*$/

/** Markdown emphasis and code ticks off, runs of space as one. */
function clean(text: string): string {
  return text.replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim()
}

/** The lines under a heading that matches, up to the next heading of the same or a higher level. */
function section(lines: readonly string[], heading: RegExp): string[] {
  const at = lines.findIndex(l => heading.test(l))
  if (at < 0) return []
  const level = (/^#+/.exec(lines[at]!)?.[0] ?? '##').length
  const end = lines.findIndex((l, i) => i > at && new RegExp(`^#{1,${level}}\\s`).test(l))
  return lines.slice(at + 1, end < 0 ? lines.length : end)
}

/** A table's body rows as cells: the header row, the rule under it and template placeholders left out. */
function tableRows(lines: readonly string[]): string[][] {
  const rows = lines
    .map(l => TABLE_ROW.exec(l)?.[1])
    .filter((r): r is string => r !== undefined)
    .map(r => r.split('|').map(c => clean(c)))
  return rows.slice(1).filter(r => !r.every(c => /^:?-{2,}:?$/.test(c) || c === '') && !/^\[.*\]$/.test(r[0] ?? ''))
}

/** A line cut at its " — ", " – " and ": " separators, none inside brackets or code ticks. */
function topSegments(text: string): string[] {
  const segs: string[] = []
  let depth = 0
  let isCode = false
  let from = 0
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]!
    if (c === '`') isCode = !isCode
    else if (!isCode && '([{（'.includes(c)) depth += 1
    else if (!isCode && ')]}）'.includes(c)) depth = Math.max(0, depth - 1)
    if (isCode || depth > 0) continue
    const sep = [' — ', ' – ', ': '].find(x => text.startsWith(x, i))
    if (sep && i > from) {
      segs.push(text.slice(from, i))
      from = i + sep.length
      i = from - 1
    }
  }
  segs.push(text.slice(from))
  return segs.map(x => x.trim()).filter(Boolean)
}

/** A checklist line's parts: the id it opens with (`T3.`), its name, and the user test after ⚠️. The name is the
    line up to its first separator, with short tags after it kept ("자동 스킬 1종 — 매직 클로") and the file
    names and notes that follow left out. A line without an id takes its place in the list. */
export function readItem(text: string, index: number): Omit<BuildItem, 'state' | 'detail'> {
  const [main = '', ...warn] = text.split('⚠️')
  const userCheck = clean(warn.join(' '))
  let body = main.replace(/\*\*/g, '').trim()
  const idHit = /^(T\d+)\.?\s+/i.exec(body)
  if (idHit) body = body.slice(idHit[0].length)
  const [head = '', ...rest] = topSegments(body)
  let name = head
  for (const seg of rest) {
    if (seg.startsWith('`') || textCells(clean(seg)) > 10) break
    name += ` — ${seg}`
  }
  return { id: idHit ? idHit[1]!.toUpperCase() : `${index + 1}`, name: clean(name), userCheck }
}

function itemsOf(lines: readonly string[]): BuildItem[] {
  const items: BuildItem[] = []
  for (const l of lines) {
    const hit = STATE_LINE.exec(l)
    if (hit) items.push({ ...readItem(hit[2]!, items.length), state: hit[1] as BuildItem['state'], detail: [] })
  }
  return items
}

/* The status leads its cell. What follows " — " is not a status but a done milestone's one-line summary ("✅ done —
   interactive tutorial", "✅ 완료 — 성장 진행 루프"). Before it, a sign anywhere decides, the one still waiting first:
   a hybrid such as "✅ code-complete (⏳ user-test pending)" is waiting on a user test. With no sign, waiting on a
   user test still comes first, then the words before any "(…)" note, which may say "(Phase 1/2 done)". */
function statusOf(cell: string): MilestoneStatus {
  const head = cell.trim().split(/\s+[—–-]\s+/)[0] ?? ''
  if (/⏳/.test(head)) return 'usertest'
  if (/🔨/.test(head)) return 'active'
  if (/✅/.test(head)) return 'done'
  if (/user-?test|유저 ?테스트/i.test(head)) return 'usertest'
  const label = head.split(/\s*\(/)[0] ?? ''
  if (/\bdone\b|완료/i.test(label)) return 'done'
  if (/\bactive\b|진행/i.test(label)) return 'active'
  if (/\bplanned\b|예정/i.test(label)) return 'planned'
  return 'candidate'
}

export function readRoadmap(text: string): { game: string; milestones: BuildMilestone[]; backlog: BuildBacklogItem[] } {
  const lines = text.split(/\r?\n/)
  const head = clean((lines.find(l => /^#\s/.test(l)) ?? '').replace(/^#\s*/, ''))
  const game = head.split(/\s+[—–]\s+/)[0] ?? head
  const milestones: BuildMilestone[] = []
  for (const l of lines) {
    const hit = /^\s*\|\s*M(\d+)\s*\|(.*)\|([^|]*)\|\s*$/.exec(l)
    if (!hit) continue
    /* the pointer to the milestone's GDD file is a link for the session, not part of the theme */
    milestones.push({ n: Number(hit[1]), theme: clean(hit[2]!.replace(/→\s*\S*\.md\S*\s*$/i, '')), status: statusOf(hit[3]!), past: null })
  }
  /* the roadmap's last section: For later (나중에 할 일 in a Korean doc) as references/gdd-template.md names it now,
     Backlog (백로그) in a roadmap written before */
  const backlog = section(lines, /^##\s*(For later|나중에? 할 ?일|Backlog|백로그)/i)
    .map(l => BULLET.exec(l)?.[1])
    .filter((b): b is string => !!b)
    .map(b => {
      const [what = '', ...why] = clean(b).split(/\s+[—–]\s+/)
      return { what, why: why.join(' — ') }
    })
  return { game, milestones, backlog }
}

/** A GDD: its §6 Phases and their checklists, its date, and its §9 plan changes. */
export function readGdd(text: string): { phases: BuildPhase[]; date: string; changes: BuildChange[] } {
  const lines = text.split(/\r?\n/)
  const phases: BuildPhase[] = []
  let cur: BuildPhase | undefined
  for (const l of section(lines, /^##\s*6[.\s]/)) {
    const ph = /^###\s*Phase\s*(\d+)\+?\s*[—–-]*\s*(.*)$/i.exec(l)
    if (ph) {
      cur = { n: Number(ph[1]), title: clean(ph[2]!.replace(/["“”]/g, '')), items: [], hasDoc: false }
      phases.push(cur)
      continue
    }
    const hit = cur && STATE_LINE.exec(l)
    if (cur && hit) cur.items.push({ ...readItem(hit[2]!, cur.items.length), state: hit[1] as BuildItem['state'], detail: [] })
  }
  const dated = lines.map(l => /Last updated\s*:\s*([^/|]+)/i.exec(l)?.[1]).find(Boolean)
  const changes = tableRows(section(lines, /^##\s*9[.\s]/))
    .map(r => {
      const type = r[1] ?? ''
      const kind: BuildChange['kind'] = /add|추가/i.test(type) ? '+' : /remove|삭제|제거|제외/i.test(type) ? '-' : '~'
      return { kind, what: r[2] ?? '' }
    })
    .filter(c => c.what !== '')
  return { phases, date: clean(dated ?? ''), changes }
}

/** A Phase doc: its status checklist (the working truth while the Phase runs), each item with its detail bullets. */
export function readPhaseDoc(text: string): BuildItem[] {
  const lines = text.split(/\r?\n/)
  const firstDetail = lines.findIndex(l => /^###\s/.test(l))
  const items = itemsOf(firstDetail < 0 ? lines : lines.slice(0, firstDetail))
  for (let i = Math.max(firstDetail, 0); firstDetail >= 0 && i < lines.length; i += 1) {
    const h = /^###\s+(.+)$/.exec(lines[i]!)
    if (!h) continue
    const heading = readItem(h[1]!, -1)
    const item = items.find(it => (/^T\d+$/.test(heading.id) && it.id === heading.id) || it.name.startsWith(heading.name))
    if (!item) continue
    for (let j = i + 1; j < lines.length && !/^#{1,3}\s/.test(lines[j]!); j += 1) {
      const b = BULLET.exec(lines[j]!)?.[1]
      if (b && item.detail.length < 4) item.detail.push(clean(b))
    }
  }
  return items
}

/** Archive/As-built.md: each finished milestone's summary entry, and the standing issues. */
export function readAsBuilt(text: string): { summaries: Map<number, { date: string; lines: string[] }>; issues: BuildIssue[] } {
  const lines = text.split(/\r?\n/)
  const summaries = new Map<number, { date: string; lines: string[] }>()
  for (const [i, l] of lines.entries()) {
    const h = /^###\s*(.*?)\bM(\d+)\b.*(complete|완료)/i.exec(l)
    if (!h) continue
    const body: string[] = []
    for (let j = i + 1; j < lines.length && !/^#{1,3}\s/.test(lines[j]!); j += 1) {
      const t = clean(lines[j]!.replace(/^\s*[-*]\s+/, ''))
      if (t && !/^\[.*\]$/.test(t)) body.push(t)
    }
    summaries.set(Number(h[2]), { date: /\d{4}-\d{2}-\d{2}/.exec(h[1]!)?.[0] ?? '', lines: body })
  }
  const issues = tableRows(section(lines, /^##\s*(Standing|반복|알려진)/i)).map(r => ({ issue: r[0] ?? '', count: r[2] ?? '' }))
  return { summaries, issues: issues.filter(x => x.issue !== '') }
}

/** The files register.tsx found, read: the roadmap, and by milestone the GDDs in Docs/ and Archive/, the Phase
    docs, and Archive/As-built.md. */
export type BuildFiles = {
  roadmap: string
  gdds: { m: number; text: string }[]
  phaseDocs: { m: number; n: number; text: string }[]
  archived: { m: number; text: string }[]
  asBuilt: string
  stamp: string
}

export function buildModel(files: BuildFiles): BuildModel {
  const road = readRoadmap(files.roadmap)
  const lang = /[가-힣]/.test(files.roadmap) ? 'ko' : 'en'
  if (!road.milestones.length)
    return {
      ...EMPTY_BUILD,
      status: 'broken',
      lang,
      game: road.game,
      stamp: files.stamp,
      problems: [lang === 'ko' ? '로드맵에서 마일스톤 표(| M1 | ... |)를 찾지 못했어요' : 'no milestone table (| M1 | ... |) in the roadmap'],
    }
  const asBuilt = readAsBuilt(files.asBuilt)
  /* the milestone being built: the roadmap's active row, else the GDD that sits in Docs/ */
  const marked = road.milestones.find(ms => ms.status === 'active' || ms.status === 'usertest')?.n
  const active = marked ?? Math.max(0, ...files.gdds.map(g => g.m))
  const gdd = files.gdds.find(g => g.m === active)
  const phases = gdd ? readGdd(gdd.text).phases : []
  /* a Phase doc is the working truth for its Phase while it runs: its checklist replaces the GDD's */
  for (const doc of files.phaseDocs.filter(p => p.m === active).sort((a, b) => a.n - b.n)) {
    const items = readPhaseDoc(doc.text)
    const at = phases.find(p => p.n === doc.n)
    if (at) Object.assign(at, { items: items.length ? items : at.items, hasDoc: true })
    else phases.push({ n: doc.n, title: '', items, hasDoc: true })
  }
  phases.sort((a, b) => a.n - b.n)
  const milestones = road.milestones.map(ms => {
    if (ms.status !== 'done') return ms
    const archived = files.archived.find(a => a.m === ms.n)
    const read = archived ? readGdd(archived.text) : undefined
    const summary = asBuilt.summaries.get(ms.n)
    const past: BuildPast = {
      found: !!read || !!summary,
      result: summary?.lines.slice(0, 3) ?? [],
      changes: read?.changes ?? [],
      phases: read?.phases.length ?? 0,
      items: read?.phases.reduce((n, p) => n + p.items.length, 0) ?? 0,
      date: summary?.date || read?.date || '',
    }
    return { ...ms, past }
  })
  return {
    status: 'ok',
    lang,
    game: road.game,
    milestones,
    backlog: road.backlog,
    active: marked !== undefined || gdd ? active : 0,
    gddFound: !!gdd,
    phases,
    issues: asBuilt.issues,
    problems: [],
    stamp: files.stamp,
  }
}

// ---------- where the build stands ----------

/** The Phase being worked: the first with a Phase doc, else the first not all verified. */
export function currentPhase(m: BuildModel): BuildPhase | undefined {
  return m.phases.find(p => p.hasDoc) ?? m.phases.find(p => p.items.some(it => it.state !== '✅'))
}

/** How an item is named in a request: its id when it has one of its own. */
export function taskName(it: BuildItem): string {
  return /^T\d+$/.test(it.id) ? `${it.id} ${it.name}` : it.name
}

export type BuildAction = {
  label: string
  /** a request sent into the chat as the person's own */
  prompt?: string
  /** text put in the prompt box for the person to finish */
  draft?: string
  opensGate?: boolean
  /** what the pane names while the turn this starts runs */
  running?: string
}

export type BuildNext = { title: string; note: string; primary?: BuildAction; secondary?: BuildAction }

/** The one next step for where the build stands, worded for the person; none while a turn runs. */
export function nextStep(m: BuildModel, ctx: { busy: boolean; running: string; gateOpen: boolean }): BuildNext {
  const s = buildStrings(m.lang)
  if (ctx.busy) return { title: ctx.running ? fill(s.busyOn, { task: ctx.running }) : s.busy, note: s.busyNote }
  if (ctx.gateOpen) return { title: s.gateWaits, note: '', primary: { label: s.openGate, opensGate: true } }
  if (m.status !== 'ok') return { title: s.startPlanTitle, note: '', primary: { label: s.startPlan, prompt: s.pStartPlan } }
  const ms = m.milestones.find(x => x.n === m.active)
  if (m.active && !m.gddFound)
    return { title: fill(s.writeGddTitle, { m: m.active }), note: '', primary: { label: fill(s.writeGdd, { m: m.active }), prompt: fill(s.pWriteGdd, { m: m.active }) } }
  if (ms?.status === 'usertest') return { title: s.userTestTitle, note: s.userTestNote, primary: { label: s.tellResults, draft: s.fResults } }
  if (m.active) {
    const p = currentPhase(m)
    if (!p)
      return {
        title: fill(s.finishTitle, { m: m.active }),
        note: '',
        primary: { label: fill(s.finishMilestone, { m: m.active }), prompt: fill(s.pFinish, { m: m.active }), running: `M${m.active}` },
      }
    const n = p.n
    const todo = p.items.filter(it => it.state === '⬜')
    const built = p.items.filter(it => it.state !== '⬜').length
    const started = p.items.some(it => it.state !== '⬜')
    /* a Phase not yet planned in detail: plan it, or build it straight from the GDD (the detail plan is optional) */
    if (!p.hasDoc && !started)
      return {
        title: fill(s.planPhaseTitle, { n }),
        note: '',
        primary: { label: fill(s.planPhase, { n }), prompt: fill(s.pPlanPhase, { n }), running: `Phase ${n}` },
        secondary: { label: fill(s.implDirect, { n }), prompt: fill(s.pImplPhase, { n }), running: `Phase ${n}` },
      }
    if (todo.length) {
      const first = todo[0]!
      /* nothing built yet, its detailed plan just written: build it, or plan the next Phase first (the skill's own
         handoff after a detailed plan offers the same two) */
      const after = started ? undefined : m.phases.find(x => x.n > n)
      return {
        title: fill(s.phaseGoTitle, { n, built, total: p.items.length }),
        note: fill(s.nextTask, { task: taskName(first) }),
        primary: started
          ? { label: fill(s.implPhase, { n }), prompt: fill(s.pImplPhase, { n }), running: `Phase ${n}` }
          : { label: fill(s.startPhase, { n }), prompt: fill(s.pStartPhase, { n }), running: `Phase ${n}` },
        secondary:
          after && !after.hasDoc
            ? { label: fill(s.planFirst, { n: after.n }), prompt: fill(s.pPlanPhase, { n: after.n }), running: `Phase ${after.n}` }
            : { label: fill(s.onlyThis, { task: first.id.startsWith('T') ? first.id : first.name }), prompt: fill(s.pDoTask, { task: taskName(first) }), running: taskName(first) },
      }
    }
    const unverified = p.items.filter(it => it.state === '🟡')
    if (unverified.length && unverified.every(it => it.userCheck !== ''))
      return { title: s.userTestTitle, note: s.userTestNote, primary: { label: s.tellResults, draft: s.fResults } }
    if (unverified.length) {
      const ids = unverified.filter(it => it.userCheck === '').map(it => (/^T\d+$/.test(it.id) ? it.id : it.name))
      return {
        title: fill(s.verifyTitle, { n }),
        note: '',
        primary: { label: fill(s.verify, { n }), prompt: fill(s.pVerify, { n, ids: ids.join(', ') }), running: `Phase ${n}` },
      }
    }
    return { title: fill(s.wrapPhaseTitle, { n }), note: '', primary: { label: fill(s.wrapPhase, { n }), prompt: fill(s.pWrapPhase, { n }), running: `Phase ${n}` } }
  }
  const upcoming = m.milestones.find(x => x.status === 'planned') ?? m.milestones.find(x => x.status === 'candidate')
  if (upcoming)
    return {
      title: fill(s.nextMilestoneTitle, { m: upcoming.n }),
      note: '',
      primary: { label: fill(s.planMilestone, { m: upcoming.n }), prompt: fill(s.pPlanMilestone, { m: upcoming.n }), running: `M${upcoming.n}` },
    }
  return { title: s.allDoneTitle, note: '', primary: { label: s.chooseNext, prompt: s.pChooseNext } }
}

/** What one checklist item's own button does: build it, verify it, or nothing once verified. */
export function itemAction(it: BuildItem, s: BuildStrings): BuildAction | undefined {
  if (it.state === '⬜') return { label: s.doThis, prompt: fill(s.pDoTask, { task: taskName(it) }), running: taskName(it) }
  if (it.state === '🟡') return { label: s.verifyThis, prompt: fill(s.pVerifyTask, { task: taskName(it) }), running: taskName(it) }
  return undefined
}

/** Everything an unfolded checklist item offers: its own step, changing it (as the person writes, or from choices
    Claude suggests), putting it off (not once verified), dropping it. Each is a request: the session revises the plan
    (references/build-management.md), the pane never edits a doc. */
export function itemMenu(
  it: BuildItem,
  s: BuildStrings,
): {
  does: BuildAction | undefined
  change: (text: string) => BuildAction
  suggest: BuildAction
  defer: BuildAction | undefined
  drop: BuildAction
} {
  const task = taskName(it)
  return {
    does: itemAction(it, s),
    change: text => ({ label: s.changeSend, prompt: fill(s.pEditTask, { task, text: text.trim() }), running: task }),
    suggest: { label: s.changeSuggest, prompt: fill(s.pSuggestTask, { task }), running: task },
    defer: it.state === '✅' ? undefined : { label: s.deferThis, prompt: fill(s.pDeferTask, { task }), running: task },
    drop: { label: s.dropThis, prompt: fill(s.pDropTask, { task }), running: task },
  }
}

/** The band's one line above the prompt: the milestone, the Phase and its counts. */
export function bandLine(m: BuildModel): string | undefined {
  if (m.status !== 'ok') return undefined
  const s = buildStrings(m.lang)
  const p = currentPhase(m)
  if (m.active && p) {
    const ok = p.items.filter(it => it.state === '✅').length
    const built = p.items.filter(it => it.state !== '⬜').length
    return fill(s.bandActive, { m: m.active, n: p.n, built, ok, total: p.items.length })
  }
  if (m.active) return fill(s.bandMilestone, { m: m.active })
  const upcoming = m.milestones.find(x => x.status === 'planned') ?? m.milestones.find(x => x.status === 'candidate')
  return upcoming ? fill(s.bandNext, { m: upcoming.n }) : s.bandAllDone
}

/** A tab's label in the milestone row. */
export function tabLabel(ms: BuildMilestone, s: BuildStrings): string {
  const by: Record<MilestoneStatus, string> = {
    active: s.tabActive,
    usertest: s.tabUserTest,
    done: s.tabDone,
    planned: s.tabPlanned,
    candidate: s.tabCandidate,
  }
  return fill(by[ms.status], { m: ms.n })
}

/** The tab the pane opens on: the milestone being built, else the next one, else the last. */
export function defaultTab(m: BuildModel): string {
  const ms =
    m.milestones.find(x => x.n === m.active) ??
    m.milestones.find(x => x.status === 'planned' || x.status === 'candidate') ??
    m.milestones[m.milestones.length - 1]
  return ms ? `m${ms.n}` : 'backlog'
}
