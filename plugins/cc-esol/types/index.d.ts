// The tabs, and the pages Settings opens (the strip lights Settings for them).
export type Panel = 'main' | 'model' | 'esol' | 'settings' | 'focus-band' | 'themes' | 'statusline' | CcslPanel

// The ccstatusline editor and its sub-pages, all under Settings.
export type CcslPanel = 'ccsl-editor' | 'ccsl-widget' | 'ccsl-add' | 'ccsl-color' | 'ccsl-powerline' | 'ccsl-layout' | 'ccsl-more'

export type FocusTheme = 'blue' | 'dark' | 'light' | 'green' | 'pink' | 'rainbow' | 'custom'

export type FocusColors = { bar: string; text: string; border: string }

export type StepStatus = 'pending' | 'in_progress' | 'completed'

// A step's clock: stamped when it starts running and when it is done.
export type FocusStep = { id: string; text: string; status: StepStatus; startedAt?: number; doneAt?: number }

// The icon glyphs the panel draws with: Nerd Font, Unicode, or Auto (Nerd
// Font when the status line config uses powerline).
export type IconSet = 'auto' | 'nerd' | 'unicode'

// waitingAt: the turn ended with steps still pending (the clock pauses);
// pausedMs: the time spent waiting, left out of the clock.
export type FocusTask = {
  title: string
  startedAt: number
  doneAt: number | null
  steps: FocusStep[]
  waitingAt?: number | null
  pausedMs?: number
}

// The tool call under way on the main loop, for the band's "now" line.
export type FocusAction = { tool: string; target: string; startedAt: number }

// colors: the theme's eight normal ANSI colors, drawn as its swatch.
export type ThemeEntry = { slug: string; name: string; colors: string[] }

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max'

export type Lang = 'en' | 'pt'

// One entry of the English learning log, as the ESOL tab lists it.
export type EnglishLogEntry = { ts: string; project: string; original: string; native: string; why: string[] }

// The learning log as last read: where it is, how many entries, the newest,
// and the newest ones in the log's order; tooLarge past the 4 MiB read cap,
// where the tab stops previewing it.
export type EnglishLog = {
  path: string
  count: number
  tooLarge: boolean
  last: EnglishLogEntry | null
  entries: EnglishLogEntry[]
}

// The status line as the Status line page last looked: what the setting is
// (none, another status line, ccstatusline installed by the person or from
// here), the command, the ccstatusline config, npx on PATH.
export type StatusLineInfo = {
  kind: 'none' | 'other' | 'unmanaged' | 'managed'
  command: string | null
  configExists: boolean
  summary: { version: number | null; lines: string[][]; powerline: boolean } | null
  hasNpx: boolean
  removed: boolean
  error?: string
}

// The last version check: idle, running, or its first output line.
export type StatusLineVersion = { state: 'idle' | 'checking' | 'ok' | 'failed'; text: string }

// ccstatusline's config as the editor holds it: the fields it edits named,
// everything else carried as read (per-widget metadata, separators, caps…).
export type CcslWidget = { id: string; type: string; color?: string; backgroundColor?: string; bold?: boolean; rawValue?: boolean; [key: string]: unknown }
export type CcslPowerline = { enabled?: boolean; theme?: string; autoAlign?: boolean; continueThemeAcrossLines?: boolean; [key: string]: unknown }
export type CcslConfig = {
  version?: number
  lines: CcslWidget[][]
  powerline?: CcslPowerline
  flexMode?: string
  compactThreshold?: number
  minimalistMode?: boolean
  updatemessage?: unknown
  [key: string]: unknown
}

// The editor's draft: the file as read (`text`, null when missing), the
// config parsed from it (null in the reduced state, with the reason), and
// whether the draft differs from the file.
export type CcslDraft = {
  path: string
  text: string | null
  config: CcslConfig | null
  reason: 'missing' | 'invalid-json' | 'no-lines' | 'old-version' | null
  dirty: boolean
}

// The editor's one-line result: what the last action did or refused.
export type CcslMessage = { kind: 'ok' | 'warn' | 'error'; text: string }

// The ESOL tab's pages: the corrections list, its settings, the review.
export type EsolView = 'list' | 'settings' | 'language' | 'review'

// The last review the model wrote for the tab, kept between sessions.
export type EsolReview = { at: string; model: string; text: string }

// A coached prompt waiting for its english_log call, stamped when the
// coaching block was attached.
export type EnglishPending = { ts: string; project: string }

declare module 'claude-code' {
  interface PluginState {
    'cc-esol': {
      menu: Panel | null
      focusOn: boolean
      focusTheme: FocusTheme
      focusCustom: FocusColors
      focusCollapsed: boolean
      task: FocusTask | null
      action: FocusAction | null
      now: number
      themes: ThemeEntry[]
      themeName: string | null
      themeQuery: string
      themeScroll: number
      themeStatus: string
      effort: Effort | null
      mode: string | null
      defaultMode: string | null
      isDownloading: boolean
      sessionEffort: Effort | null
      sessionModel: string | null
      paneBg: string | null
      defaultModeChosen: boolean
      lang: Lang
      englishOn: boolean
      englishEnCutoff: number
      englishMinWords: number
      englishNative: string
      englishLog: EnglishLog | null
      englishPending: EnglishPending | null
      esolView: EsolView
      esolScroll: number
      esolOpen: number | null
      esolReview: EsolReview | null
      esolReviewBusy: boolean
      esolReviewError: string | null
      esolReviewScroll: number
      statusLine: StatusLineInfo | null
      statusLineVersion: StatusLineVersion
      statusLineBusy: boolean
      statusLineConfirm: boolean
      ccslDraft: CcslDraft | null
      ccslLine: number
      ccslWidget: number | null
      ccslScroll: number
      ccslAddScroll: number
      ccslAddCategory: string | null
      ccslColorField: 'color' | 'backgroundColor'
      ccslBusy: boolean
      ccslMessage: CcslMessage | null
      ccslPreview: string[] | null
      ccslPreviewBusy: boolean
      ccslBackups: string[]
      ccslVersion: StatusLineVersion
      restored: boolean
      voiceOn: boolean | null
      icons: IconSet
    }
  }
}
