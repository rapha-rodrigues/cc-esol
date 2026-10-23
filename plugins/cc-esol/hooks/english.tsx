// The English tab: passive American English coaching for someone whose first
// language is not English. Every prompt in English runs as usual; the rules
// sit in the system prompt while coaching is on, a one-line marker rides
// beside each prompt the gate passed, and Claude logs a nativized correction
// through the english_log tool. The gate, the contract and the formats are
// in ./lib/english.ts.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, PromptComposeInput, PromptComposeResult, PromptSubmitInput, RenderChildren, RenderInput } from 'claude-code'

import type { EnglishLog, EnglishLogEntry, EnglishPending, EsolReview, EsolView } from '../types'
import {
  appendArgv,
  asEntryInput,
  basename,
  classify,
  COACHING_SECTION_ID,
  coachingContract,
  DEFAULT_EN_CUTOFF,
  DEFAULT_MIN_WORDS,
  DEFAULT_NATIVE,
  LANGUAGES,
  ENGLISH_TOOL,
  ENGLISH_TOOL_NAME,
  ENGLISH_TOOL_SCHEMA,
  formatEntry,
  MAX_LIST,
  MAX_PREVIEW_BYTES,
  MIN_WORDS_CHOICES,
  parseLog,
  EN_CUTOFFS,
  resolveLogPath,
  reviewPrompt,
  reviewTail,
  shortDate,
  timestamp,
  wrapLines,
} from './lib/english'
import type { Phrase } from './lib/i18n'
import { homeDir, isWindows } from './lib/platform'
import { readableModel } from './lib/session-controls'
import { TAB_STRIP_ROWS } from './ui/frame'

// Session values; the settings among them are mirrored to $.store.
export const englishOn = atom({ plugin: 'cc-esol', key: 'englishOn' } as const, false)
export const englishEnCutoff = atom({ plugin: 'cc-esol', key: 'englishEnCutoff' } as const, DEFAULT_EN_CUTOFF)
export const englishMinWords = atom({ plugin: 'cc-esol', key: 'englishMinWords' } as const, DEFAULT_MIN_WORDS)
export const englishNative = atom({ plugin: 'cc-esol', key: 'englishNative' } as const, DEFAULT_NATIVE)
export const englishLog = atom({ plugin: 'cc-esol', key: 'englishLog' } as const, null)
export const englishPending = atom({ plugin: 'cc-esol', key: 'englishPending' } as const, null)
export const esolView = atom({ plugin: 'cc-esol', key: 'esolView' } as const, 'list')
export const esolScroll = atom({ plugin: 'cc-esol', key: 'esolScroll' } as const, 0)
export const esolOpen = atom({ plugin: 'cc-esol', key: 'esolOpen' } as const, null)
export const esolReview = atom({ plugin: 'cc-esol', key: 'esolReview' } as const, null)
export const esolReviewBusy = atom({ plugin: 'cc-esol', key: 'esolReviewBusy' } as const, false)
export const esolReviewError = atom({ plugin: 'cc-esol', key: 'esolReviewError' } as const, null)
export const esolReviewScroll = atom({ plugin: 'cc-esol', key: 'esolReviewScroll' } as const, 0)

// Paths ------------------------------------------------------------------------

export async function logPath($: EngineInterface) {
  return resolveLogPath(await $.env.get('ENGLISH_COACH_LOG'), await homeDir($))
}

// Settings --------------------------------------------------------------------

export async function setEnglishOn($: EngineInterface, isOn: boolean) {
  await update($, englishOn, () => isOn)
  await $.store.set('englishOn', isOn)
  if (!isOn) await update($, englishPending, () => null)
  // The tool's place (the prompt's list, or behind ToolSearch) follows the
  // switch; the rules section needs no asking, composed anew for every request.
  $.ui.invalidate('tool.describe')
}

// The contract for this session's language and log.
async function contractOf($: EngineInterface) {
  const path = (await read($, englishLog))?.path ?? (await logPath($))
  return coachingContract(await read($, englishNative), path)
}

async function setEnCutoff($: EngineInterface, cutoff: number) {
  await update($, englishEnCutoff, () => cutoff)
  await $.store.set('englishEnCutoff', cutoff)
}

async function setNative($: EngineInterface, name: string) {
  const native = name.trim() === '' ? DEFAULT_NATIVE : name.trim()
  await update($, englishNative, () => native)
  await $.store.set('englishNative', native)
}

async function setMinWords($: EngineInterface, minWords: number) {
  await update($, englishMinWords, () => minWords)
  await $.store.set('englishMinWords', minWords)
}

// The log as the tab previews it: where it is, how many entries, the newest.
// Read once here and after each write, never while drawing.
export async function refreshLog($: EngineInterface) {
  const path = await logPath($)
  try {
    if (!(await $.fs.exists(path))) {
      await update($, englishLog, () => ({ path, count: 0, tooLarge: false, last: null, entries: [] }))
      return
    }
    const stat = await $.fs.stat(path)
    if (stat.size > MAX_PREVIEW_BYTES) {
      await update($, englishLog, () => ({ path, count: 0, tooLarge: true, last: null, entries: [] }))
      return
    }
    const summary = parseLog(await $.fs.read(path))
    await update($, englishLog, () => ({ path, tooLarge: false, ...summary }))
  } catch {}
}

// The kept settings, back into the session's values: at the session's start
// and after a /clear (from restore in register.tsx).
export async function loadEnglish($: EngineInterface) {
  const isOn = await $.store.get('englishOn')
  if (typeof isOn === 'boolean') await update($, englishOn, () => isOn)
  const cutoff = await $.store.get('englishEnCutoff')
  if (typeof cutoff === 'number' && EN_CUTOFFS.includes(cutoff)) await update($, englishEnCutoff, () => cutoff)
  const minWords = await $.store.get('englishMinWords')
  if (typeof minWords === 'number' && MIN_WORDS_CHOICES.includes(minWords)) await update($, englishMinWords, () => minWords)
  const native = await $.store.get('englishNative')
  if (typeof native === 'string' && native.trim() !== '') await update($, englishNative, () => native)
  await update($, englishPending, () => null)
  const review = await $.store.get('esolReview')
  if (isReview(review)) await update($, esolReview, () => review)
  await update($, esolView, () => 'list')
  await update($, esolOpen, () => null)
  await update($, esolScroll, () => 0)
  await refreshLog($)
}

const isReview = (v: unknown): v is EsolReview => {
  const r = v as { at?: unknown; model?: unknown; text?: unknown } | null
  return r !== null && typeof r === 'object' && typeof r.at === 'string' && typeof r.model === 'string' && typeof r.text === 'string'
}

// The log ------------------------------------------------------------------------

async function appendEntry($: EngineInterface, entry: string, path: string) {
  if (await isWindows($)) {
    // No sh: a read and a whole-file write, not atomic (documented).
    const old = (await $.fs.exists(path)) ? await $.fs.read(path) : ''
    await $.fs.write(path, old + entry)
    return
  }
  const ran = await $.process.run(appendArgv(entry, path))
  if (ran.exitCode !== 0) throw new Error(ran.stderr.trim() || `sh exited with ${ran.exitCode}`)
}

// The person's own words: typed or dictated into the composer, or submitted
// on their behalf by a plugin that says so. Never a slash command, a prompt
// the person does not see, a notification or a peer's message.
export const isOwnWords = (e: { command?: unknown; isMeta?: true; origin: { kind: string; asUser?: true } }): boolean =>
  e.command === undefined && e.isMeta !== true && (e.origin.kind === 'composer' || (e.origin.kind === 'plugin' && e.origin.asUser === true))

// Drawing ----------------------------------------------------------------------

// The listed label for a language name, or the name itself for an Other.
const languageLabel = (native: string) => LANGUAGES.find(l => l.name === native)?.label ?? native
const slug = (label: string) => label.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '')

// What drawPane in register.tsx lends the tab: its chip and heading idiom,
// the phrase function and the pane's width.
export type TabHelpers = {
  heading: (text: string, extra?: RenderChildren) => RenderChildren
  chip: (key: string, label: string, isOn: boolean, onPress: () => unknown, color?: string) => RenderChildren
  chips: (key: string, items: RenderChildren[]) => RenderChildren
  t: (key: Phrase, vars?: Record<string, string | number>) => string
  columns: number
}

// Rows the list page spends besides the list: the tab strip (3), the header
// (1), the chips row (3), the footer (3) and one spare in case a row wraps.
const LIST_OVERHEAD = TAB_STRIP_ROWS + 1 + 3 + 3 + 1
// The review page: the tab strip, the chips row, the status line, the footer, one spare.
const REVIEW_OVERHEAD = TAB_STRIP_ROWS + 3 + 1 + 3 + 1
// Columns a row loses to the pane's padding and the marker and date in front.
const ROW_INDENT = 2
const MARKER_WIDTH = 2 + 6

export const listRoom = (bodyRows: number) => Math.max(3, bodyRows - LIST_OVERHEAD)
export const reviewRoom = (bodyRows: number) => Math.max(3, bodyRows - REVIEW_OVERHEAD)

// The pane's width as last drawn: the scroll and focus hooks wrap with it.
let paneColumns = 56

const textWidth = (columns: number) => Math.max(10, columns - 2 - ROW_INDENT)

// The entries newest first, as the list shows them.
const newestFirst = (log: EnglishLog | null): EnglishLogEntry[] => (log === null ? [] : [...log.entries].reverse())

// The rows one entry takes: one collapsed, or its heading and every wrapped
// line of the original, the native version and the reasons.
const entryRows = (entry: EnglishLogEntry, isOpen: boolean, columns: number): number => {
  if (!isOpen) return 1
  const w = textWidth(columns)
  return (
    1 +
    wrapLines(entry.original, w).length +
    wrapLines(entry.native, w).length +
    entry.why.reduce((n, why) => n + wrapLines(why, w - 2).length, 0)
  )
}

// The entries from `top` that fit in `room` rows: [from, to), always at least one.
export const windowOf = (list: readonly EnglishLogEntry[], top: number, open: number | null, room: number, columns: number) => {
  const from = Math.max(0, Math.min(top, Math.max(0, list.length - 1)))
  let rows = 0
  let to = from
  while (to < list.length) {
    const r = entryRows(list[to]!, to === open, columns)
    if (rows + r > room && to > from) break
    rows += r
    to++
  }
  return { from, to }
}

async function goTo($: EngineInterface, view: EsolView) {
  await update($, esolView, () => view)
}

async function toggleOpen($: EngineInterface, i: number) {
  await update($, esolOpen, open => (open === i ? null : i))
}

// The wheel and the scroll keys move the list's or the review's own window,
// never the pane, so the tabs stay put (from register.tsx's ui.scroll hook).
export async function scrollEsol($: EngineInterface, by: number, bodyRows: number) {
  const view = await read($, esolView)
  if (view === 'review') {
    const review = await read($, esolReview)
    if (review === null) return
    const lines = wrapLines(review.text, Math.max(10, paneColumns - 2))
    const last = Math.max(0, lines.length - reviewRoom(bodyRows))
    await update($, esolReviewScroll, top => Math.max(0, Math.min(last, top + by)))
  } else if (view === 'list') {
    const list = newestFirst(await read($, englishLog))
    const last = Math.max(0, list.length - listRoom(bodyRows))
    await update($, esolScroll, top => Math.max(0, Math.min(last, top + by)))
  }
}

// The focus ring stepping onto an entry past either end of the window brings
// it into view (from register.tsx's ui.focus hook).
export async function focusEsol($: EngineInterface, element: string | undefined, bodyRows: number) {
  if ((await read($, esolView)) !== 'list' || !element?.startsWith('esol:')) return
  const i = Number(element.slice('esol:'.length))
  if (!Number.isInteger(i)) return
  const list = newestFirst(await read($, englishLog))
  const top = await read($, esolScroll)
  const room = listRoom(bodyRows)
  const { to } = windowOf(list, top, await read($, esolOpen), room, paneColumns)
  if (i < top) await update($, esolScroll, () => i)
  else if (i >= to) await update($, esolScroll, () => Math.max(0, Math.min(i, list.length - 1) - room + 1))
}

const modelLabel = readableModel

// The review: the model reads the whole log and writes the analysis the tab
// shows. Kept in $.store, so the tab opens on the last one until it is run again.
export async function runReview($: EngineInterface) {
  if (await read($, esolReviewBusy)) return
  await update($, esolReviewBusy, () => true)
  await update($, esolReviewError, () => null)
  await update($, esolView, () => 'review')
  try {
    const path = await logPath($)
    if (!(await $.fs.exists(path))) throw new Error('the log does not exist yet')
    const stat = await $.fs.stat(path)
    if (stat.size > MAX_PREVIEW_BYTES) throw new Error('the log is over 4 MiB: archive it first')
    const text = await $.fs.read(path)
    if (text.trim() === '') throw new Error('the log is empty')
    let model = 'sonnet'
    try {
      model = (await $.session.model()) || model
    } catch {}
    const reply = await $.model.complete({ model, prompt: reviewPrompt(reviewTail(text), await read($, englishNative)), effort: 'medium', maxTokens: 2500, timeoutMs: 180_000 })
    if (!reply.isAnswered) {
      throw new Error(reply.reason === 'api-error' ? `API error${reply.status === null ? '' : ` ${reply.status}`}` : reply.reason)
    }
    const review: EsolReview = { at: timestamp(new Date()), model: modelLabel(model), text: reply.text.trim() }
    await update($, esolReview, () => review)
    await update($, esolReviewScroll, () => 0)
    await $.store.set('esolReview', review)
  } catch (error) {
    await update($, esolReviewError, () => (error instanceof Error ? error.message : String(error)))
  } finally {
    await update($, esolReviewBusy, () => false)
  }
}

export async function drawEnglishTab($: EngineInterface, e: RenderInput<'Pane'>, tab: TabHelpers): Promise<RenderChildren[]> {
  if (e.surface !== 'terminal' && e.surface !== 'desktop') return []
  const { Box, Text, Button, Input } = $.ui.resolve(e)
  paneColumns = tab.columns
  const bodyRows = e.props.scroll.bodyRows
  const view = await read($, esolView)
  const isOn = await read($, englishOn)
  const log = await read($, englishLog)
  const rows: RenderChildren[] = []

  const native = await read($, englishNative)

  if (view === 'settings') {
    const cutoff = await read($, englishEnCutoff)
    const minWords = await read($, englishMinWords)
    const count =
      log === null || log.count === 0 || log.last === null
        ? tab.t('noEntries')
        : log.tooLarge
          ? tab.t('logTooLarge')
          : log.count === 1
            ? tab.t('entryOne', { date: log.last.ts })
            : tab.t('entries', { n: log.count, date: log.last.ts })
    rows.push(
      tab.chips('esol-nav', [tab.chip('esol-back', tab.t('back'), false, () => goTo($, 'list'))]),
      tab.heading(tab.t('coaching')),
      tab.chips('english-onoff', [
        tab.chip('english-on', tab.t('on'), isOn, () => setEnglishOn($, true)),
        tab.chip('english-off', tab.t('off'), !isOn, () => setEnglishOn($, false)),
      ]),
      <Text key="english-note" dimColor>
        {tab.t('coachingNote')}
      </Text>,
      tab.heading(tab.t('enCutoff')),
      tab.chips(
        'english-cutoff',
        EN_CUTOFFS.map(n => tab.chip(`english-cutoff-${n}`, `${n}%`, n === cutoff, () => setEnCutoff($, n))),
      ),
      tab.heading(tab.t('minWords')),
      tab.chips(
        'english-min',
        MIN_WORDS_CHOICES.map(n => tab.chip(`english-min-${n}`, String(n), n === minWords, () => setMinWords($, n))),
      ),
      tab.heading(tab.t('logFile')),
      <Text key="english-log-path" dimColor wrap="truncate">
        {log?.path ?? ''}
      </Text>,
      <Text key="english-log-count">{count}</Text>,
      tab.heading(tab.t('languageRow')),
      <Button key="esol-language" plain label={tab.t('languageRow')} onPress={() => goTo($, 'language')}>
        <Text bold>{languageLabel(native)}</Text>
        <Text dimColor>{' ›'}</Text>
      </Button>,
    )
    return rows
  }

  if (view === 'language') {
    const isOther = LANGUAGES.every(l => l.name !== native)
    rows.push(
      tab.chips('esol-nav', [tab.chip('esol-back', tab.t('back'), false, () => goTo($, 'settings'))]),
      tab.heading(tab.t('languageTitle')),
      tab.chips('english-langs', [
        ...LANGUAGES.map(l => tab.chip(`english-lang-${slug(l.label)}`, l.label, l.name === native, () => setNative($, l.name))),
        tab.chip('english-lang-other', tab.t('other'), isOther, () => setNative($, isOther ? native : tab.t('other'))),
      ]),
    )
    if (isOther) {
      rows.push(
        <Input key="english-lang-name" label={tab.t('languageName')} value={native} placeholder={DEFAULT_NATIVE} submitLabel="set" onSubmit={value => setNative($, value)} />,
      )
    }
    return rows
  }

  if (view === 'review') {
    const review = await read($, esolReview)
    const busy = await read($, esolReviewBusy)
    const error = await read($, esolReviewError)
    const top = await read($, esolReviewScroll)
    const room = reviewRoom(bodyRows)
    const lines = review === null ? [] : wrapLines(review.text, Math.max(10, tab.columns - 2))
    const below = Math.max(0, lines.length - top - room)
    rows.push(
      tab.chips('esol-nav', [
        tab.chip('esol-back', tab.t('back'), false, () => goTo($, 'list')),
        tab.chip('esol-review-run', tab.t('reviewAgain'), busy, () => runReview($)),
      ]),
      <Box key="esol-review-status" justifyContent="space-between" gap={1} flexShrink={0}>
        <Text wrap="truncate" color={error === null ? undefined : 'red'} dimColor={error === null}>
          {busy
            ? tab.t('reviewRunning')
            : error !== null
              ? tab.t('reviewFailed', { reason: error })
              : review === null
                ? ''
                : tab.t('reviewAt', { date: review.at, model: review.model })}
        </Text>
        <Text dimColor>{top > 0 || below > 0 ? `${top + 1}–${Math.min(lines.length, top + room)}/${lines.length}` : ''}</Text>
      </Box>,
    )
    if (review === null && !busy && error === null) {
      rows.push(
        <Text key="esol-review-none" dimColor>
          {tab.t('reviewNone')}
        </Text>,
      )
    }
    rows.push(...lines.slice(top, top + room).map((line, k) => <Text key={`esol-review-line-${top + k}`}>{line === '' ? ' ' : line}</Text>))
    return rows
  }

  // The list: the newest corrections first, one row each, the chosen one open.
  const list = newestFirst(log)
  const open = await read($, esolOpen)
  const top = await read($, esolScroll)
  const room = listRoom(bodyRows)
  const { from, to } = windowOf(list, top, open, room, tab.columns)
  const w = textWidth(tab.columns)
  const clip = (s: string, width: number) => (s.length > width ? `${s.slice(0, Math.max(1, width - 1))}…` : s)
  rows.push(
    <Box key="esol-head" justifyContent="space-between" gap={1} flexShrink={0}>
      <Text dimColor>{tab.t('lastCorrections')}</Text>
      <Text dimColor>{list.length > to - from ? `${from + 1}–${to}/${list.length}` : ''}</Text>
    </Box>,
  )
  if (list.length === 0) {
    rows.push(
      <Text key="esol-none" dimColor>
        {log?.tooLarge ? tab.t('logTooLarge') : tab.t('noEntriesHint')}
      </Text>,
    )
  }
  if (!isOn) {
    rows.push(
      <Text key="esol-off" color="claude">
        {tab.t('coachingOffHint')}
      </Text>,
    )
  }
  for (let i = from; i < to; i++) {
    const entry = list[i]!
    const isOpen = i === open
    rows.push(
      <Button key={`esol:${i}`} plain label={entry.original} onPress={() => toggleOpen($, i)}>
        <Text color={isOpen ? 'claude' : undefined}>{isOpen ? '▾ ' : '▸ '}</Text>
        <Text dimColor>{`${shortDate(entry.ts)} `}</Text>
        {!isOpen && <Text wrap="truncate">{clip(entry.original, Math.max(10, tab.columns - 2 - MARKER_WIDTH))}</Text>}
      </Button>,
    )
    if (!isOpen) continue
    rows.push(
      ...wrapLines(entry.original, w).map((line, k) => (
        <Text key={`esol:${i}:o${k}`}>
          {'  '}
          {line}
        </Text>
      )),
      ...wrapLines(entry.native, w).map((line, k) => (
        <Text key={`esol:${i}:n${k}`} color="claude">
          {'  '}
          {line}
        </Text>
      )),
      ...entry.why.flatMap((why, j) =>
        wrapLines(why, w - 2).map((line, k) => (
          <Text key={`esol:${i}:w${j}-${k}`} dimColor>
            {k === 0 ? '  · ' : '    '}
            {line}
          </Text>
        )),
      ),
    )
  }
  rows.push(
    <Box key="esol-spacer" flexGrow={1} />,
    tab.chips('esol-actions', [
      tab.chip('esol-settings', tab.t('settings'), false, () => goTo($, 'settings')),
      tab.chip('esol-review', tab.t('review'), false, () => runReviewOrShow($)),
    ]),
  )
  return rows
}

// The Review chip: the last review when there is one, a fresh one otherwise.
async function runReviewOrShow($: EngineInterface) {
  if ((await read($, esolReview)) === null) await runReview($)
  else await goTo($, 'review')
}

// Hooks ------------------------------------------------------------------------

// The engine takes one hook per event without a matcher from a plugin, so the
// English parts of session.start, prompt.submit and turn.complete are these
// functions, each called from the hook register.tsx already has.

// Claude's own logging tool, registered at the session's start. Where it
// waits (the prompt's list, or behind ToolSearch) is the tool.describe hook's.
export async function registerEnglishTool($: EngineInterface) {
  try {
    const { toolDescription } = await contractOf($)
    await $.tool.register({ name: ENGLISH_TOOL_NAME, description: toolDescription, inputSchema: ENGLISH_TOOL_SCHEMA })
  } catch {}
}

// The prompt as submitted, the gate's marker attached when it is one of the
// person's English prompts and coaching is on; read with the prompt, never
// shown. The rules it points at are in the system prompt. A failure here
// leaves the prompt as it was.
export async function withCoaching($: EngineInterface, e: PromptSubmitInput): Promise<PromptSubmitInput> {
  try {
    if (!(await read($, englishOn)) || !isOwnWords(e)) return e
    const enCutoff = await read($, englishEnCutoff)
    const verdict = classify(e.text, { minWords: await read($, englishMinWords), enCutoff })
    if (verdict.skip !== null) return e
    const pending: EnglishPending = { ts: timestamp(new Date()), project: basename(await $.session.cwd()) }
    await update($, englishPending, () => pending)
    const { marker } = await contractOf($)
    return { ...e, context: [...(e.context ?? []), marker({ enTokens: verdict.enTokens, tokens: verdict.tokens, enCutoff })] }
  } catch {
    return e
  }
}

// Prompts composed for nobody who types: the one-line prompt (--bare), a
// print session (no composer, so nothing is ever coached) and a teammate's
// render of its lead's prompt.
const UNCOACHED_TRAITS: ReadonlySet<string> = new Set(['bare', 'print', 'teammate'])

// A coached prompt whose turn ended without a write stays unlogged.
export async function clearEnglishPending($: EngineInterface) {
  try {
    if ((await read($, englishPending)) !== null) await update($, englishPending, () => null)
  } catch {}
}

// The rules, as a section of the system prompt while coaching is on: behind
// the cache boundary, on every request, never in the history. From the
// prompt.compose hook in register.tsx; a failure leaves the list as composed.
export async function withEsolSection($: EngineInterface, e: PromptComposeInput, composed: PromptComposeResult): Promise<PromptComposeResult> {
  try {
    if (!(await read($, englishOn)) || e.traits.some(t => UNCOACHED_TRAITS.has(t))) return composed
    const { rules } = await contractOf($)
    return { sections: [...composed.sections, { id: COACHING_SECTION_ID, text: rules, scope: 'session' as const }] }
  } catch {
    return composed
  }
}

export function registerEnglish(on: On) {
  // The tool's schema sits in the prompt's list while coaching is on and
  // behind ToolSearch while it is off; setEnglishOn asks again on a change.
  on('tool.describe', { tool: 'mcp__cc-esol__english_log' }, async ($, e, next) => ({ ...(await next(e)), isDeferred: !(await read($, englishOn)) }))

  // One entry per coached prompt, only while coaching is on: the pending
  // stamp is set when the block was attached and consumed by the first write.
  // The literal, not ENGLISH_TOOL, so `claude plugin validate` reads the matcher.
  on('tool.call', { tool: 'mcp__cc-esol__english_log' }, async ($, e) => {
    if (!(await read($, englishOn))) return { result: 'English coaching is off: nothing logged.' }
    const pending = await read($, englishPending)
    if (pending === null) return { result: 'No coached prompt is pending (one entry per coached prompt): nothing logged.' }
    const input = asEntryInput(e)
    if (input === null) return { result: 'Invalid input: original, native and why are required and must not be empty.' }
    const path = await logPath($)
    const entry = { ...pending, ...input }
    try {
      await appendEntry($, formatEntry(entry), path)
    } catch (error) {
      return { result: `Could not write the learning log at ${path}: ${String(error)}` }
    }
    await update($, englishPending, () => null)
    const listed: EnglishLogEntry = { ts: entry.ts, project: entry.project, original: entry.original, native: entry.native, why: [...entry.why] }
    await update($, englishLog, log => ({
      path,
      tooLarge: log?.tooLarge ?? false,
      count: (log?.count ?? 0) + 1,
      last: listed,
      entries: [...(log?.entries ?? []), listed].slice(-MAX_LIST),
    }))
    return { result: 'Logged.' }
  }).catch(() => ({ result: 'Could not log the entry: the english_log hook failed.' }))
}
