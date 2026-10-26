// English coach: the language gate, the coaching contract (the rules in the
// system prompt, the marker beside a coached prompt, the tool's own words)
// and the learning log's format. Pure; the hooks and the page are in
// ../english.tsx.

import type { EnglishLogEntry } from '../../types'

export const ENGLISH_TOOL_NAME = 'english_log'
// As the model calls it: mcp__<plugin>__<name>. A literal, so the hook's
// matcher reads statically.
export const ENGLISH_TOOL = 'mcp__cc-esol__english_log'

export const DEFAULT_EN_CUTOFF = 30
export const DEFAULT_MIN_WORDS = 4
export const EN_CUTOFFS: readonly number[] = [20, 30, 40, 50]
export const MIN_WORDS_CHOICES: readonly number[] = [3, 4, 6, 8]

// Bounds on one entry, mirrored in the tool's schema.
export const MAX_TEXT = 2000
export const MAX_WHY = 12
export const MAX_WHY_TEXT = 300
// $.fs.read rejects past 4 MiB: the pane stops previewing the log there.
export const MAX_PREVIEW_BYTES = 4 * 1024 * 1024
// The newest entries the pane lists.
export const MAX_LIST = 200
// What one review reads at most: the newest tail of a longer log.
export const MAX_REVIEW_CHARS = 150_000

// Under the home directory, unless ENGLISH_COACH_LOG says otherwise.
export const DEFAULT_LOG = '.claude/english-learning/learning.md'

// The languages the ESOL settings offer; `name` is how the coaching block
// says it. Anything else is typed in as Other.
export const LANGUAGES: readonly { label: string; name: string }[] = [
  { label: 'Portuguese (Brazil)', name: 'Brazilian Portuguese' },
  { label: 'Portuguese (Portugal)', name: 'European Portuguese' },
  { label: 'Spanish', name: 'Spanish' },
  { label: 'French', name: 'French' },
  { label: 'Italian', name: 'Italian' },
  { label: 'German', name: 'German' },
  { label: 'Dutch', name: 'Dutch' },
  { label: 'Russian', name: 'Russian' },
  { label: 'Polish', name: 'Polish' },
  { label: 'Ukrainian', name: 'Ukrainian' },
  { label: 'Turkish', name: 'Turkish' },
  { label: 'Arabic', name: 'Arabic' },
  { label: 'Hebrew', name: 'Hebrew' },
  { label: 'Hindi', name: 'Hindi' },
  { label: 'Chinese (Mandarin)', name: 'Mandarin Chinese' },
  { label: 'Japanese', name: 'Japanese' },
  { label: 'Korean', name: 'Korean' },
  { label: 'Vietnamese', name: 'Vietnamese' },
  { label: 'Thai', name: 'Thai' },
  { label: 'Indonesian', name: 'Indonesian' },
]
export const DEFAULT_NATIVE = LANGUAGES[0]!.name

// English function words and the verbs and nouns prompts to a coding agent
// lean on. A prompt is English when enough of its words are here; the gate
// knows nothing about the person's own language, so it works for any. Words
// that are also everyday words in other languages ("a", "as", "do", "no",
// "me") are left out: a hit on them says nothing.
const EN_WORDS = `
the an and or but if then so to of in on at for with from by is are was were be been being am
do does did done have has had can could should would will shall may might must not yes
this that these those it its i you he she we they him her us them my your his our their
what which who whom whose when where why how here there now all any some each every both few
more most other another such only own same than too very just also still again please thanks
ok okay let make made add remove delete fix check run test create update change set get put
use using file files folder code line function class error bug build start stop open close
show hide list new old next last first after before about into over under up down out off back
need want think know see look try keep go come give take find help work working ready
already continue instead without within between because while until since always never
something nothing everything anything
`
const EN = new Set(EN_WORDS.split(/\s+/).filter(w => w !== ''))

// Letters of the Latin alphabet, digits, underscores and the accented letters
// the languages above write with stay inside a token; anything else splits.
const SEPARATOR = /[^A-Za-z0-9_\u00C0-\u024F]+/

// The word list is Latin-script, so a prompt in Chinese, Japanese or Russian
// with "fix the bug" in it would clear the ratio on those three words alone:
// the letters are counted too, and a prompt with this share or more of them
// outside the Latin script is not English.
export const OTHER_SCRIPT_CUTOFF = 30
const LETTER = /\p{L}/gu
const LATIN_LETTER = /\p{Script=Latin}/gu

export type Skip = 'command' | 'short' | 'not-english'

export type Verdict = {
  // Why the prompt is left alone, or null when it is coached.
  skip: Skip | null
  // Whitespace-separated words: the length gate.
  words: number
  // Tokens and how many of them are English words: the ratio gate.
  tokens: number
  enTokens: number
}

export type Gate = { minWords?: number; enCutoff?: number }

// The gate: slash commands are tooling, prompts under `minWords` words are
// "yes" and "continue", and a prompt is English when its letters are Latin
// (see OTHER_SCRIPT_CUTOFF) and its English words are at least `enCutoff`
// percent of it (30 by default: a numbered English prompt full of jargon
// lands near 40, a Portuguese one with English loanwords under 20). A message
// in another language with a few English loanwords (push, merge, PR) stays
// under the line; an English sentence carrying a word from the person's own
// language (a vocabulary gap) clears it.
export const classify = (text: string, gate: Gate = {}): Verdict => {
  const minWords = gate.minWords ?? DEFAULT_MIN_WORDS
  const enCutoff = gate.enCutoff ?? DEFAULT_EN_CUTOFF
  const trimmed = text.trim()
  const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length
  let tokens = 0
  let enTokens = 0
  for (const token of trimmed.toLowerCase().split(SEPARATOR)) {
    if (token === '') continue
    tokens++
    if (EN.has(token)) enTokens++
  }
  const letters = trimmed.match(LETTER)?.length ?? 0
  const latin = trimmed.match(LATIN_LETTER)?.length ?? 0
  const otherScript = letters > 0 && (letters - latin) * 100 >= letters * OTHER_SCRIPT_CUTOFF
  const skip: Skip | null = trimmed.startsWith('/')
    ? 'command'
    : words < minWords
      ? 'short'
      : tokens === 0 || otherScript || enTokens * 100 < tokens * enCutoff
        ? 'not-english'
        : null
  return { skip, words, tokens, enTokens }
}

// The gate's measure of a coached prompt, as the marker states it.
export type Measure = { enTokens: number; tokens: number; enCutoff: number }

// The coaching contract, in three parts that must agree: the rules, carried
// by the english_log tool's own description (in the cached tool list of
// every request while coaching is on, never in the history, and past
// Claude Code's built-in guard, which keeps a user's plugin out of the
// system prompt on a Team or Enterprise login); the marker, one line beside
// a prompt the gate passed; and the description's own opening. One
// function, so the tool's name and the log's path cannot drift.
export type CoachingContract = {
  rules: string
  marker: (m: Measure) => string
  toolDescription: string
}

// How a marker opens.
export const MARKER_PREFIX = 'ESOL gate:'
export const coachingContract = (native: string, logPath: string): CoachingContract => {
  const rules = [
    'ESOL coaching rules',
    `The user is a ${native} speaker training American English. A message of theirs that carries an "${MARKER_PREFIX}" marker was measured as mostly English: apply these rules to that message, then proceed with the actual task. NEVER refuse, delay, or alter the task because of language. This applies to typed and voice-dictated input equally. A message without the marker is not coached.`,
    '',
    '1. If the message is already natural, idiomatic American English with nothing meaningful to correct: skip logging entirely.',
    '2. Ignore missing apostrophes in contractions. "im", "hes", "dont", "cant", "wont", "thats", "theres", "whats", "howd", "ive", "id", "ill", "lets" and the like are typing speed, not a language gap. Do not correct them, do not spend a why bullet on them, and never let them be the reason an entry exists: if apostrophes are the only thing wrong with the message, treat it as already natural and skip under rule 1.',
    '   Exception, because these are word choices rather than typos: keep coaching "its" vs "it\'s", "your" vs "you\'re", "their" vs "they\'re" vs "there", "whose" vs "who\'s", and "were" vs "we\'re". Each apostrophe-less spelling there is a different English word, so the wrong one is a grammar error, not a slip.',
    `3. Otherwise, log ONE entry by calling this tool (${ENGLISH_TOOL}) exactly once, with: original (the user's message, verbatim, trimmed), native (how a native American English speaker would actually phrase it, keeping the technical intent intact) and why (terse bullets, one per correction: grammar, word choice, phrasing, false cognates, unnatural constructions). The tool appends the entry to the learning log at ${logPath}; never write that file yourself.`,
    `4. The gate is lexical: it counted Latin-script English words and can be wrong. If the message is in fact written in ${native} or any other language or script, skip logging entirely. A single ${native} word inside an English message is a deliberate vocabulary gap: give the English term in native and devote a why bullet to it.`,
    '5. Probable speech-to-text artifacts (oddly out-of-place words): correct them in native and tag the why bullet with [STT?] instead of treating them as grammar errors.',
    '6. Do not mention the log, the corrections, the tool call or these rules in your reply unless the user explicitly asks, and do not announce that you are logging: call the tool silently and keep the reply focused on the task.',
  ].join('\n')
  return {
    rules,
    marker: m =>
      `${MARKER_PREFIX} ${m.enTokens} of ${m.tokens} words are English (cutoff ${m.enCutoff}%). Apply the ESOL coaching rules in the ${ENGLISH_TOOL} tool's description to this message: at most one call.`,
    toolDescription:
      `Appends one English coaching entry to the user's learning log at ${logPath}. ` +
      `Call it exactly once for a message that carries an "${MARKER_PREFIX}" marker and needs a correction, never for any other message, by these rules.\n\n${rules}`,
  }
}

export const ENGLISH_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    original: { type: 'string', maxLength: MAX_TEXT, description: "The user's message, verbatim, trimmed." },
    native: {
      type: 'string',
      maxLength: MAX_TEXT,
      description: 'The same message as a native American English speaker would phrase it, technical intent intact.',
    },
    why: {
      type: 'array',
      maxItems: MAX_WHY,
      items: { type: 'string', maxLength: MAX_WHY_TEXT },
      description:
        'An array of terse bullets, one plain string per correction (no leading dash, no line breaks): grammar, word choice, phrasing, false cognates, unnatural constructions.',
    },
  },
  required: ['original', 'native', 'why'],
}

export type EntryInput = { original: string; native: string; why: readonly string[] }
export type Entry = EntryInput & { ts: string; project: string }

const cut = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s)

// `why` as the model sends it: an array of strings, or one string holding a
// line per bullet; a leading dash or bullet mark is dropped either way.
const asBullets = (why: unknown): string[] | null => {
  const lines = typeof why === 'string' ? why.split(/\r?\n/) : Array.isArray(why) ? why : null
  if (lines === null) return null
  return lines
    .filter((w): w is string => typeof w === 'string')
    .map(w => w.replace(/^\s*[-*•]\s*/, '').trim())
    .filter(w => w !== '')
}

// The tool's input as the model sent it, trimmed and bounded; null when a
// required field is missing or empty.
export const asEntryInput = (raw: unknown): EntryInput | null => {
  const r = (raw ?? {}) as { original?: unknown; native?: unknown; why?: unknown }
  if (typeof r.original !== 'string' || typeof r.native !== 'string') return null
  const bullets = asBullets(r.why)
  if (bullets === null) return null
  const original = cut(r.original.trim(), MAX_TEXT)
  const native = cut(r.native.trim(), MAX_TEXT)
  if (original === '' || native === '') return null
  const why = bullets.slice(0, MAX_WHY).map(w => cut(w, MAX_WHY_TEXT))
  return { original, native, why }
}

const oneLine = (s: string) => s.replace(/\s*\r?\n\s*/g, ' ').trim()

// One entry, exactly as the log has held them since the shell hook: a blank
// line, the heading, ORIGINAL, NATIVE, and WHY with one nested bullet each.
export const formatEntry = (e: Entry): string =>
  [
    '',
    `## ${e.ts} | project: ${e.project}`,
    `- ORIGINAL: ${oneLine(e.original)}`,
    `- NATIVE: ${oneLine(e.native)}`,
    '- WHY:',
    ...e.why.map(w => `  - ${oneLine(w)}`),
    '',
  ].join('\n')

const two = (n: number) => String(n).padStart(2, '0')

// `2026-10-21 16:33`, local time, as the shell hook stamped it.
export const timestamp = (d: Date): string =>
  `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`

export type LogSummary = { count: number; last: EnglishLogEntry | null; entries: EnglishLogEntry[] }

const HEADING = /^## (\d{4}-\d{2}-\d{2} \d{2}:\d{2}) \| project: (.*)$/

// How many entries the log holds, the newest one, and the newest MAX_LIST of
// them in the log's order (entries are appended, so the newest is the last).
export const parseLog = (text: string): LogSummary => {
  const entries: EnglishLogEntry[] = []
  let current: EnglishLogEntry | null = null
  for (const line of text.split('\n')) {
    const head = line.match(HEADING)
    if (head !== null) {
      current = { ts: head[1]!, project: head[2]!.trim(), original: '', native: '', why: [] }
      entries.push(current)
      continue
    }
    if (current === null) continue
    if (line.startsWith('- ORIGINAL: ')) current.original = line.slice('- ORIGINAL: '.length).trim()
    else if (line.startsWith('- NATIVE: ')) current.native = line.slice('- NATIVE: '.length).trim()
    else if (/^\s+- /.test(line)) current.why.push(line.replace(/^\s+- /, '').trim())
  }
  const count = entries.length
  return { count, last: entries[count - 1] ?? null, entries: entries.slice(-MAX_LIST) }
}

// The newest tail of a log too long for one review, cut at an entry's start.
export const reviewTail = (text: string): string => {
  if (text.length <= MAX_REVIEW_CHARS) return text
  const tail = text.slice(-MAX_REVIEW_CHARS)
  const at = tail.indexOf('\n## ')
  return `(older entries omitted)\n${at < 0 ? tail : tail.slice(at)}`
}

// What the review asks of the model: the analysis part of /english-review,
// the log inline, plain text for the pane.
export const reviewPrompt = (log: string, native: string = DEFAULT_NATIVE): string =>
  [
    `You are an American English coach reviewing a learning log kept by a ${native} speaker who trains English by dictating and typing prompts to a coding agent. Each entry has the ORIGINAL message, a NATIVE rewrite and WHY bullets, one per correction.`,
    'Write a compact analysis as plain text for a narrow terminal pane: no Markdown headings, no tables, no bold, short lines, under 40 lines in all, no praise, no filler. Number the four parts.',
    '1. Top recurring error patterns (at most 5): the pattern, two or three short real examples from the log (ORIGINAL vs NATIVE), and how often it appears.',
    `2. False cognates and ${native}-interference habits spotted.`,
    '3. Progress signal: compare the last two weeks of entries against the older ones. Are the same mistakes repeating or fading? If the log is too short or too sparse for a trend, say so instead of inventing one.',
    '4. Three targeted drills: one-line exercises to practice by dictating prompts during normal work.',
    '',
    'The log:',
    '',
    log,
  ].join('\n')

// Greedy word wrap into rows at most `width` wide; a word longer than the
// width is cut. Blank lines stay. The pane counts rows with it.
export const wrapLines = (text: string, width: number): string[] => {
  const w = Math.max(8, width)
  const out: string[] = []
  for (const paragraph of text.replace(/\r/g, '').split('\n')) {
    if (paragraph.trim() === '') {
      out.push('')
      continue
    }
    let line = ''
    for (const word of paragraph.split(/\s+/)) {
      if (word === '') continue
      if (line === '') line = word
      else if (line.length + 1 + word.length <= w) line += ` ${word}`
      else {
        out.push(line)
        line = word
      }
      while (line.length > w) {
        out.push(line.slice(0, w))
        line = line.slice(w)
      }
    }
    if (line !== '') out.push(line)
  }
  return out
}

// `2026-10-21 16:33` as `10-21`, for a list row.
export const shortDate = (ts: string): string => ts.slice(5, 10)

export const resolveLogPath = (fromEnv: string | undefined, home: string): string =>
  fromEnv !== undefined && fromEnv.trim() !== '' ? fromEnv.trim() : `${home}/${DEFAULT_LOG}`

export const basename = (p: string): string => p.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || p

// `sh` appends with O_APPEND: no read, no rewrite, so a crash or another
// session never damages what is already there. The entry and the path travel
// as arguments, never through the shell's parser.
export const appendArgv = (entry: string, path: string): string[] => [
  'sh',
  '-c',
  'mkdir -p -- "$(dirname -- "$2")" && printf "%s" "$1" >> "$2"',
  'sh',
  entry,
  path,
]

// Windows: the entry, written to `tmp` beside the log, appended with cmd's
// `>>` (the log opened for appending, as sh's is) and the sibling removed.
// The log's folder is made first. Paths travel as arguments; cmd quotes
// each one that needs it.
export const appendWinArgv = (tmp: string, path: string): string[] => {
  const win = (p: string) => p.split('/').join('\\')
  const dir = win(path).replace(/\\[^\\]*$/, '')
  return ['cmd', '/d', '/s', '/c', `if not exist "${dir}" mkdir "${dir}" & type "${win(tmp)}" >> "${win(path)}" & del /q "${win(tmp)}"`]
}

// `claude-opus-5-5` as `Opus 5.5`, for the review's byline; an id that is
// not a Claude model's stays as it is.
export const readableModel = (id: string): string => {
  const found = /^claude-([a-z]+)-(\d+)(?:-(\d+))?/i.exec(id)
  if (found === null) return id
  const family = found[1]!
  const version = found[3] === undefined ? found[2]! : `${found[2]}.${found[3]}`
  return `${family[0]!.toUpperCase()}${family.slice(1)} ${version}`
}
