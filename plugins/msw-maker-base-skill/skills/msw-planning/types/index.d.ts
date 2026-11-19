// The state contract of msw-decision-pane: what the pane draws from.
// `gate` is the decision-data.json the pane watches, already normalized;
// `answers` is what the person picked on it, keyed to that gate's id.

/** One step of a card picture's recipe: a kit part, a shape or an emoji sticker, placed on the 40 x 26 canvas. */
export type SceneItem = {
  part?: string
  shape?: 'rect' | 'frame' | 'circle' | 'line' | 'tri'
  emoji?: string
  x: number
  y: number
  w?: number
  h?: number
  x2?: number
  y2?: number
  r?: number
  color?: string
  tint?: string
  flip?: boolean
  scale?: number
  count?: number
  dx?: number
  dy?: number
}

/** A card picture composed on demand: a backdrop, then items painted in order. */
export type SceneSpec = { bg: string; items: SceneItem[] }

export type SheetOption = {
  id: string
  label: string
  tagline: string
  visual: string
  scene?: SceneSpec
  emoji: string
  summary: string[]
  firstBuild: string
  effort: string
  tradeoff: string
  samples: string
}

export type SheetQuestion = {
  qid: string
  question: string
  context: string
  multiSelect: boolean
  recommended: string
  options: SheetOption[]
}

export type SheetInput = {
  key: string
  label: string
  placeholder: string
  required: boolean
  hint: string
}

export type SheetGateData = {
  gateId: string
  lang: string
  title: string
  context: string
  generatedAt: string
  allowNote: boolean
  questions: SheetQuestion[]
  inputs: SheetInput[]
}

/** empty: no file yet · open: a gate to answer · broken: a file that cannot be answered · closed: the gate's file was deleted after it was open */
export type SheetStatus = 'empty' | 'open' | 'broken' | 'closed'

export type SheetGate = {
  status: SheetStatus
  path: string
  mtimeMs: number
  problems: string[]
  data: SheetGateData | null
}

export type SheetAnswers = {
  gateId: string
  sel: { [qid: string]: string[] }
  notes: { [qid: string]: string }
  custom: { [qid: string]: string }
  vals: { [key: string]: string }
  sentAt: number
  /** which page the pane shows: a question's index, or the question count for the review page */
  step: number
}

// The build-status pane draws msw-planning's build docs: the roadmap, the active milestone's GDD and Phase docs,
// the archived GDDs and Archive/As-built.md, read into `build`.

/** One checklist line: its id (`T3`, or its place in the list), its name, its state, the user test it waits on. */
export type BuildItem = {
  id: string
  name: string
  state: '⬜' | '🟡' | '✅'
  /** what the person must check themselves (the text after the warning sign), empty when the AI can verify it */
  userCheck: string
  /** the task's detail bullets from its Phase doc (goal, done criteria, dependencies), empty without one */
  detail: string[]
}

export type BuildPhase = { n: number; title: string; items: BuildItem[]; hasDoc: boolean }

/** The roadmap's closed set of milestone statuses. */
export type MilestoneStatus = 'active' | 'usertest' | 'done' | 'planned' | 'candidate'

export type BuildChange = { kind: '+' | '-' | '~'; what: string }

/** A finished milestone against its roadmap line: what got built and what changed on the way. */
export type BuildPast = {
  /** found: an archived GDD or an As-built summary was there to read */
  found: boolean
  result: string[]
  changes: BuildChange[]
  phases: number
  items: number
  date: string
}

export type BuildMilestone = { n: number; theme: string; status: MilestoneStatus; past: BuildPast | null }

export type BuildBacklogItem = { what: string; why: string }

export type BuildIssue = { issue: string; count: string }

/** none: no roadmap yet · ok: read · broken: a roadmap with no milestone rows to read */
export type BuildModel = {
  status: 'none' | 'ok' | 'broken'
  lang: 'ko' | 'en'
  game: string
  milestones: BuildMilestone[]
  backlog: BuildBacklogItem[]
  /** the milestone being built (its GDD is in Docs/), 0 when none is */
  active: number
  gddFound: boolean
  phases: BuildPhase[]
  issues: BuildIssue[]
  problems: string[]
  /** the read files' names and times, so an unchanged set is not read again */
  stamp: string
}

/** What the person has open in the build-status pane: a tab, an unfolded item, a draft of what they want and where
    it goes (chosen by a press on an empty box, sent by Enter), the item whose drop was pressed once and waits on a
    second press, and the item whose change box is open with its draft. */
export type BuildView = {
  tab: string
  item: string
  idea: string
  ideaKind: '' | 'now' | 'later'
  armed: string
  editing: string
  change: string
}

declare module 'claude-code' {
  interface PluginState {
    /** waiting: the pane was opened unasked and waits undrawn (a terminal narrower than such a pane may take) */
    /** shape: the person's own choice of card shape on the terminal ('auto' until they press the toggle) */
    /** contextOpen: the gate's own context unfolded on a pane that folds it (cards on their side) */
    /** busy: a main-loop turn is running; running: the task the build-status pane started it for */
    /** asking: that turn waits on the person, its question (AskUserQuestion) up in the chat */
    /** planningSeen: msw-planning was read in this session; buildShown: the build-status pane is drawn */
    'msw-decision-pane': {
      gate: SheetGate
      answers: SheetAnswers
      waiting: boolean
      shape: 'auto' | 'upright' | 'row'
      contextOpen: boolean
      build: BuildModel
      busy: boolean
      running: string
      asking: boolean
      buildView: BuildView
      planningSeen: boolean
      buildShown: boolean
    }
  }
}
