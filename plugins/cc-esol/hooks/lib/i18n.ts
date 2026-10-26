// The panel's words, in English: the pane speaks English. Pure; the hooks are in register.tsx.

import type { Lang } from '../../types'

const EN = {
  keys: 'tab move · enter select · wheel scrolls · esc close',
  language: 'Language',
  on: 'On',
  off: 'Off',
  coaching: 'English coaching',
  coachingNote: 'Each prompt in English runs as usual; a nativized correction is logged silently. Prompts in your own language are left alone.',
  enCutoff: 'Coach when English is at least',
  languageRow: 'Your language',
  languageTitle: 'Your language: the coaching and the review speak of it',
  other: 'Other',
  languageName: 'Language name',
  minWords: 'Minimum words',
  logFile: 'Learning log',
  entries: '{n} entries · last {date}',
  entryOne: '1 entry · last {date}',
  noEntries: 'No entries yet',
  logTooLarge: 'Too large to preview (over 4 MiB): archive it',
  lastCorrections: 'Last corrections',
  noEntriesHint: 'Entries appear here as you write prompts in English.',
  coachingOffHint: 'Coaching is off: turn it on in Settings.',
  settings: '⚙ Settings',
  back: '← Back',
  review: '↗ Review',
  reviewAgain: '↻ Run again',
  reviewRunning: 'Reviewing the log… this takes a minute.',
  reviewNone: 'No review yet. Run one: the model reads the whole log and sums up the patterns, the interference habits, the trend and three drills.',
  reviewFailed: 'The review failed: {reason}',
  reviewAt: 'Reviewed {date} · {model}',
}

export type Phrase = keyof typeof EN

const PHRASES: Record<Lang, Record<Phrase, string>> = { en: EN }

// A phrase in `lang`, each {name} filled from `vars`.
export const phrase = (lang: Lang, key: Phrase, vars: Record<string, string | number> = {}) =>
  PHRASES[lang][key].replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ''))

