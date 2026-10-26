// The pane's one page.
export type Panel = 'esol'

export type Lang = 'en'

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

// The ESOL tab's pages: the corrections list, its settings, the review.
export type EsolView = 'list' | 'settings' | 'language' | 'review'

// The last review the model wrote for the tab, kept between sessions.
export type EsolReview = { at: string; model: string; text: string }

// A coached prompt waiting for its english_log call, stamped when the
// marker was attached; `claim` is the id of the call writing it, so one
// write lands per prompt whatever calls arrive together.
export type EnglishPending = { ts: string; project: string; claim?: number }

declare module 'claude-code' {
  interface PluginState {
    'cc-esol': {
      menu: Panel | null
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
      restored: boolean
      voiceOn: boolean | null
    }
  }
}
