// Focus mode's arithmetic and look: the band's colors, the progress numbers,
// the step clocks, the approved plan read as steps, the "now" line, and the
// one line that asks for a list beside a long prompt while Focus is on. Pure.

import type { FocusAction, FocusColors, FocusStep, FocusTask, FocusTheme, StepStatus } from '../../types'
import { blend } from './colors'

// Eight colors, red to pink, for the rainbow band and the rainbow effort word.
export const RAINBOW = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#60a5fa', '#c084fc', '#f472b6']

export const FOCUS_THEMES: readonly FocusTheme[] = ['blue', 'dark', 'light', 'green', 'pink', 'rainbow', 'custom']

// The bar, the text and the border of each preset. `light` writes in the
// theme's own text color, so it reads on a dark terminal and on a light one.
const PRESET_COLORS: Readonly<Record<Exclude<FocusTheme, 'custom'>, FocusColors>> = {
  blue: { bar: '#60a5fa', text: '#dbeafe', border: '#3b82f6' },
  dark: { bar: '#d1d5db', text: '#e5e7eb', border: '#4b5563' },
  light: { bar: '#bfdbfe', text: 'text', border: '#d1d5db' },
  green: { bar: '#4ade80', text: '#dcfce7', border: '#16a34a' },
  pink: { bar: '#f472b6', text: '#fce7f3', border: '#db2777' },
  rainbow: { bar: '#f87171', text: '#fbcfe8', border: '#f472b6' },
}

export const bandColors = (theme: FocusTheme, custom: FocusColors): FocusColors => (theme === 'custom' ? custom : PRESET_COLORS[theme])

export const STEP_STATUSES: readonly StepStatus[] = ['pending', 'in_progress', 'completed']
export const toStatus = (value: unknown): StepStatus => ((STEP_STATUSES as readonly unknown[]).includes(value) ? (value as StepStatus) : 'pending')

// A span of milliseconds as `12s` or `3m 05s`-style `3m 5s`.
export const clockText = (ms: number): string => {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(seconds / 60)
  return minutes === 0 ? `${seconds}s` : `${minutes}m ${seconds % 60}s`
}

const doneCount = (t: FocusTask) => t.steps.filter(s => s.status === 'completed').length

// `3 calls`, for the band's header; empty before the first call.
export const callsText = (t: FocusTask): string => {
  const n = t.calls ?? 0
  return n === 0 ? '' : `${n} call${n === 1 ? '' : 's'}`
}

// The one line Focus adds beside a prompt that reads as a task of several
// steps while on: the band mirrors Claude's own list, so it asks for one,
// with a threshold the model can apply before it starts. Beside the prompt,
// not in the system prompt: Claude Code's built-in guard keeps a user's
// plugin out of the system prompt on a Team or Enterprise login, and a line
// beside the prompt reaches the model everywhere.
export const FOCUS_NUDGE =
  'Focus band: a progress band above the prompt mirrors your todo list. Before your first tool call, if this will take more than two tool calls, write the list with TodoWrite (TaskCreate where that is what you have): one item per step, exactly one in_progress, each marked completed as it ends.'

// What the band adds to the todo tools' own descriptions while Focus is on
// (tool.describe, cached in the tool list; nothing per prompt): the same ask,
// read where the model decides whether to use the tool.
export const FOCUS_TODO_NOTE = (tool: 'TodoWrite' | 'TaskCreate'): string =>
  `\n\nFocus band: a progress band above the prompt mirrors this list while Focus is on. Open the list before the first tool call of any task that will take more than two tool calls, one item per step; keep exactly one in_progress and mark each completed as soon as it ends${tool === 'TaskCreate' ? ' (TaskUpdate)' : ''}. A task of one step needs no list.`

// The band's feed: the last calls of the main loop in the order they
// started, at most `cap` kept. A call under way stays whatever comes after
// it (calls run in parallel); the oldest done one gives way first.
export const FEED_CAP = 4
export const withCall = (feed: readonly FocusAction[], call: FocusAction, cap = FEED_CAP): FocusAction[] => {
  const next = [...feed, call]
  while (next.length > cap) {
    const oldestDone = next.findIndex(a => a.doneAt != null)
    next.splice(oldestDone === -1 ? 0 : oldestDone, 1)
  }
  return next
}
export const withCallDone = (feed: readonly FocusAction[], id: number, at: number): FocusAction[] =>
  feed.map(a => (a.id === id ? { ...a, doneAt: at } : a))
// The `rows` calls the band draws: every one under way first, then the
// newest done ones, back in the order they started.
export const feedInView = (feed: readonly FocusAction[], rows: number): FocusAction[] => {
  const running = feed.filter(a => a.doneAt == null)
  const done = feed.filter(a => a.doneAt != null)
  const room = rows - Math.min(rows, running.length)
  const picked = new Set([...running.slice(-rows), ...(room > 0 ? done.slice(-room) : [])])
  return feed.filter(a => picked.has(a))
}

// A prompt long enough to be a task of several steps: twelve words, or more
// than one line. "yes", "continue" and one-liners get nothing.
export const wantsList = (text: string): boolean => {
  const trimmed = text.trim()
  if (trimmed === '') return false
  return trimmed.split(/\r?\n/).filter(l => l.trim() !== '').length > 1 || trimmed.split(/\s+/).length >= 12
}

// Done steps over all steps, in whole percent; a finished task is 100.
export const progressOf = (t: FocusTask): number => {
  const total = t.steps.length
  if (t.doneAt !== null) return 100
  return total === 0 ? 0 : Math.round((100 * doneCount(t)) / total)
}

// "Step 3 of 7": the running step's number, else the first one not done.
export const stepCaption = (t: FocusTask): string => {
  const finished = t.doneAt !== null
  if (finished) return 'Done'
  const total = t.steps.length
  if (total === 0) return 'Working…'
  const running = t.steps.findIndex(s => s.status === 'in_progress')
  const number = (running >= 0 ? running : doneCount(t)) + 1
  return `Step ${Math.min(total, number)} of ${total}`
}

export type BarRun = { color: string; cells: number }

// The filled cells of a bar `width` wide at `percent`, as runs of color:
// one run in the band's color, or the rainbow cut into eight equal bands.
export const barRuns = (theme: FocusTheme, color: string, width: number, percent: number): { filled: number; runs: BarRun[] } => {
  const share = Math.max(0, Math.min(100, percent)) / 100
  const filled = Math.round(width * share)
  if (theme !== 'rainbow') return { filled, runs: filled > 0 ? [{ color, cells: filled }] : [] }
  const edges = RAINBOW.map((_, i) => Math.floor((width * i) / RAINBOW.length))
  edges.push(width)
  const runs = RAINBOW.map((c, i) => ({ color: c, cells: Math.max(0, Math.min(edges[i + 1]!, filled) - edges[i]!) })).filter(run => run.cells > 0)
  return { filled, runs }
}

// The steps the band shows: up to `room` of them, the running one kept a
// couple of rows from the top so what comes next is in view.
export const stepsInView = (t: FocusTask, room = 6): FocusStep[] => {
  const running = t.steps.findIndex(s => s.status === 'in_progress')
  const lastStart = Math.max(0, t.steps.length - room)
  const anchor = running < 0 ? 0 : running - 2
  const first = Math.max(0, Math.min(anchor, lastStart))
  const last = first + room
  return t.steps.slice(first, last)
}

// Claude's todo list as steps: the active form while a todo runs.
export const stepsFromTodos = (todos: readonly { content: string; status: string; activeForm: string }[]): FocusStep[] =>
  todos.map((todo, i) => {
    const running = todo.status === 'in_progress'
    const text = running && todo.activeForm !== '' ? todo.activeForm : todo.content
    return { id: `todo-${i}`, text, status: toStatus(todo.status) }
  })

// Step clocks: a step entering in_progress is stamped; one completing with
// no start takes the latest finish before it, or the task's start, like a
// relay. Earlier stamps are kept by id, else by text; a pending step has none.
export const stampSteps = (prev: readonly FocusStep[], next: readonly FocusStep[], now: number, taskStart: number): FocusStep[] => {
  const lastDone = Math.max(taskStart, ...prev.flatMap(s => (s.doneAt === undefined ? [] : [s.doneAt])))
  return next.map(step => {
    const before = prev.find(s => s.id === step.id) ?? prev.find(s => s.text === step.text)
    let startedAt = before?.startedAt
    let doneAt = before?.doneAt
    if (step.status === 'in_progress') {
      startedAt ??= now
      doneAt = undefined
    } else if (step.status === 'completed') {
      startedAt ??= lastDone
      doneAt ??= now
    } else {
      startedAt = undefined
      doneAt = undefined
    }
    const { startedAt: _s, doneAt: _d, ...bare } = step
    return { ...bare, ...(startedAt === undefined ? {} : { startedAt }), ...(doneAt === undefined ? {} : { doneAt }) }
  })
}

// What a step's row shows at the right: its duration once done, the time so far while running.
export const stepTime = (step: FocusStep, now: number): string =>
  step.status === 'completed' && step.startedAt !== undefined && step.doneAt !== undefined
    ? clockText(step.doneAt - step.startedAt)
    : step.status === 'in_progress' && step.startedAt !== undefined
      ? clockText(now - step.startedAt)
      : ''

// A row's dot and tint by state: green done, the Focus color running, gray
// pending; the tint a shade of that over black, or over white on the light theme.
export const STEP_GREEN = '#22c55e'
export const STEP_GRAY = '#6b7280'
export const stepColor = (status: StepStatus, bar: string): string => (status === 'completed' ? STEP_GREEN : status === 'in_progress' ? bar : STEP_GRAY)
export const stepTint = (status: StepStatus, bar: string, isLightTheme: boolean): string =>
  blend(isLightTheme ? '#ffffff' : '#000000', stepColor(status, bar), isLightTheme ? 0.18 : 0.22)

// The task's clock: paused time left out, frozen while waiting or done.
export const taskElapsed = (t: FocusTask, now: number): number => (t.doneAt ?? t.waitingAt ?? now) - t.startedAt - (t.pausedMs ?? 0)

export const isWaiting = (t: FocusTask): boolean => t.waitingAt !== null && t.waitingAt !== undefined

// A plan approved for this conversation: the main loop's own call, answered,
// with a plan in it, not a subagent's and not one still waiting on a leader.
export const isApprovedPlan = (e: { agentId?: string }, ran: { deny?: unknown; isError?: unknown; result?: unknown }): string | null => {
  if (e.agentId !== undefined || ran.deny !== undefined || ran.isError === true) return null
  const r = ran.result as { plan?: unknown; isAgent?: unknown; awaitingLeaderApproval?: unknown } | undefined
  if (r === undefined || typeof r.plan !== 'string' || r.plan.trim() === '') return null
  if (r.isAgent === true || r.awaitingLeaderApproval === true) return null
  return r.plan
}

// The steps a plan's Markdown holds: fenced code dropped, every top-level
// list item in order (numbered, bulleted, or a checkbox, a checked one
// done), the headings when there are no items at all. The title is the first
// heading. Fewer than two items: no steps, the title alone.
export const parsePlanSteps = (markdown: string): { title: string | null; steps: FocusStep[] } => {
  const text = markdown.replace(/```[\s\S]*?```/g, '')
  const lines = text.split(/\r?\n/)
  const title = lines.map(l => l.match(/^#\s+(.+?)\s*$/)?.[1] ?? null).find(t => t !== null) ?? null
  const items: { text: string; done: boolean }[] = []
  for (const line of lines) {
    const m = line.match(/^(?:\d+[.)]|[-*+])\s+(?:\[([ xX])\]\s+)?(.+?)\s*$/)
    if (m !== null && m[2] !== undefined) items.push({ text: m[2], done: m[1] !== undefined && m[1] !== ' ' })
  }
  const picked =
    items.length > 0
      ? items
      : lines.flatMap(l => {
          const h = l.match(/^#{2,}\s+(.+?)\s*$/)
          return h?.[1] === undefined ? [] : [{ text: h[1], done: false }]
        })
  if (picked.length < 2) return { title, steps: [] }
  return { title, steps: picked.map((it, i) => ({ id: `plan-${i}`, text: it.text, status: it.done ? 'completed' : 'pending' })) }
}

// The "now" line's words for a tool call: the tool and what it is on.
export const actionOf = (tool: string, input: Record<string, unknown>, startedAt: number): Omit<FocusAction, 'id'> => {
  const str = (k: string) => (typeof input[k] === 'string' ? (input[k] as string) : '')
  const base = (path: string) => path.split(/[\\/]/).pop() ?? path
  const mcp = tool.match(/^mcp__([^_]+(?:_[^_]+)*)__(.+)$/)
  const name = mcp ? `${mcp[1]}:${mcp[2]}` : tool
  let target = ''
  if (tool === 'Bash' || tool === 'PowerShell') target = str('description') || str('command').split('\n')[0] || ''
  else if (tool === 'Read' || tool === 'Edit' || tool === 'Write' || tool === 'NotebookEdit') target = base(str('file_path') || str('notebook_path'))
  else if (tool === 'Grep' || tool === 'Glob') target = str('pattern')
  else if (tool === 'Agent' || tool === 'Task') target = str('description')
  else if (tool === 'WebFetch' || tool === 'WebSearch') target = str('url') || str('query')
  return { tool: name, target: target.slice(0, 60), startedAt }
}
