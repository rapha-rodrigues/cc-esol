// Focus mode: a progress band above the prompt, fed by what Claude Code
// already emits (todos, tasks, the approved plan, tool calls as a feed of
// Claude's own one-line descriptions), and the tool rows hidden from the
// transcript while it is on. Costs one short line beside a prompt long
// enough to be several steps while on (the ask for a todo list) and a note
// on the todo tools' descriptions, cached; nothing else.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, PromptSubmitInput, RenderChildren, RenderInput, Timer } from 'claude-code'

import type { FocusAction, FocusColors, FocusStep, FocusTask, FocusTheme, Panel } from '../../types'
import { glyph } from '../icons'
import {
  actionOf,
  bandColors,
  barRuns,
  callsText,
  clockText,
  feedInView,
  focusNudge,
  FOCUS_THEMES,
  FOCUS_TODO_NOTE,
  isApprovedPlan,
  isWaiting,
  parsePlanSteps,
  progressOf,
  RAINBOW,
  stampSteps,
  stepCaption,
  stepColor,
  stepsFromTodos,
  stepsInView,
  stepTime,
  stepTint,
  taskElapsed,
  todoToolAmong,
  toStatus,
  wantsList,
  withCall,
  withCallDone,
} from '../lib/focus'
import { rainbow, type Frame } from '../ui/frame'

const focusOn = atom({ plugin: 'cc-esol', key: 'focusOn' } as const, false)
const theme = atom({ plugin: 'cc-esol', key: 'focusTheme' } as const, 'blue')
const customColors = atom({ plugin: 'cc-esol', key: 'focusCustom' } as const, { bar: '#60a5fa', text: '#e2e8f0', border: '#3b82f6' } satisfies FocusColors)
const collapsed = atom({ plugin: 'cc-esol', key: 'focusCollapsed' } as const, false)
const task = atom({ plugin: 'cc-esol', key: 'task' } as const, null)
const feed = atom({ plugin: 'cc-esol', key: 'feed' } as const, [])
const now = atom({ plugin: 'cc-esol', key: 'now' } as const, 0)

const HEX_COLOR = /^#[0-9a-f]{6}$/i
// How long "Done" stays on the band before it clears.
const DONE_LINGER_MS = 8000
// Rows the band gives its steps, and its feed of calls: alone, or under the running step.
const STEP_ROWS = 6
const FEED_ROWS = 4
const FEED_ROWS_UNDER_STEP = 2

// Settings ---------------------------------------------------------------------

async function switchFocus($: EngineInterface, on: boolean) {
  await update($, focusOn, () => on)
  await $.store.set('focusOn', on)
  if (!on) await update($, task, () => null)
  // The todo tools' descriptions carry the band's note only while on.
  $.ui.invalidate('tool.describe')
}

async function pickTheme($: EngineInterface, next: FocusTheme) {
  await update($, theme, () => next)
  await $.store.set('focusTheme', next)
}

async function pickCustomColor($: EngineInterface, part: keyof FocusColors, raw: string) {
  const value = raw.trim()
  if (!HEX_COLOR.test(value)) {
    $.ui.toast(`${raw} is not a hex color like #3b82f6`)
    return
  }
  const colors = await update($, customColors, c => ({ ...c, [part]: value }))
  await $.store.set('focusCustom', colors)
}

export async function loadFocus($: EngineInterface) {
  const on = await $.store.get('focusOn')
  if (typeof on === 'boolean') await update($, focusOn, () => on)
  const kept = await $.store.get('focusTheme')
  if ((FOCUS_THEMES as readonly unknown[]).includes(kept)) await update($, theme, () => kept as FocusTheme)
  const colors = await $.store.get('focusCustom')
  if (colors !== undefined) await update($, customColors, () => colors as FocusColors)
}

// The clock -------------------------------------------------------------------

// One pulse per module load, moving `now` once a second while a task runs.
let pulse: Timer | undefined

function stopClock() {
  pulse?.cancel()
  pulse = undefined
}

function runClock($: EngineInterface) {
  stopClock()
  const tick = () => void $.clock.now().then(at => update($, now, () => at))
  pulse = $.clock.every(1000, tick)
}

// The task ---------------------------------------------------------------------

// The first line of the last prompt typed: the band's title.
let promptTitle = ''

async function openTask($: EngineInterface, title: string) {
  const at = await $.clock.now()
  const opened: FocusTask = { title: title || 'Working', startedAt: at, doneAt: null, steps: [], waitingAt: null, pausedMs: 0 }
  await update($, task, () => opened)
  await update($, feed, () => [])
  await update($, now, () => at)
  runClock($)
}

// A waiting task goes on; the time it waited leaves the clock.
async function continueTask($: EngineInterface) {
  const at = await $.clock.now()
  await update($, task, t => (t === null || !isWaiting(t) ? t : { ...t, waitingAt: null, pausedMs: (t.pausedMs ?? 0) + (at - t.waitingAt!) }))
  await update($, feed, () => [])
  await update($, now, () => at)
  runClock($)
}

// New steps land on the task under way; after a finished one, or none, on a new task.
async function landingTask($: EngineInterface) {
  const current = await read($, task)
  if (current === null || current.doneAt !== null) await openTask($, promptTitle)
  else if (isWaiting(current)) await continueTask($)
}

// The steps replaced, their clocks stamped against the ones before; the title when given.
async function replaceSteps($: EngineInterface, make: (prev: FocusStep[]) => FocusStep[], title?: string) {
  const at = await $.clock.now()
  await update($, task, t => (t === null ? t : { ...t, ...(title === undefined ? {} : { title }), steps: stampSteps(t.steps, make(t.steps), at, t.startedAt) }))
}

// Each prompt typed continues the waiting task or opens a new one, and a
// prompt long enough to be several steps carries the ask for a list, naming
// the todo tool the session has; a session with none gets nothing. From
// the prompt.submit hook in register.tsx.
export async function focusPromptSubmit($: EngineInterface, e: PromptSubmitInput): Promise<PromptSubmitInput> {
  const typed = e.text.trim()
  if (e.origin.kind !== 'composer' || typed === '' || typed.startsWith('/')) return e
  promptTitle = (typed.split('\n')[0] ?? '').slice(0, 200)
  if (!(await read($, focusOn))) return e
  const underway = await read($, task)
  if (underway !== null && underway.doneAt === null && isWaiting(underway)) await continueTask($)
  else await openTask($, promptTitle)
  if (!wantsList(typed)) return e
  let tool: ReturnType<typeof todoToolAmong> = null
  try {
    tool = todoToolAmong((await $.tool.list()).map(t => t.name))
  } catch {}
  return tool === null ? e : { ...e, context: [...(e.context ?? []), focusNudge(tool)] }
}

// The turn's end: waiting when steps are still pending (the clock pauses),
// done when every step is or there were none. From the turn.complete hook.
export async function focusTurnComplete($: EngineInterface) {
  stopClock()
  await update($, feed, () => [])
  const underway = await read($, task)
  if (underway === null || underway.doneAt !== null || isWaiting(underway)) return
  const at = await $.clock.now()
  await update($, now, () => at)
  if (underway.steps.some(s => s.status !== 'completed')) {
    await update($, task, t => (t === null ? t : { ...t, waitingAt: at }))
    return
  }
  await update($, task, t => (t === null ? t : { ...t, doneAt: at }))
  $.clock.after(DONE_LINGER_MS, () => {
    void update($, task, t => (t !== null && t.doneAt === at ? null : t))
  })
}

// Drawing ----------------------------------------------------------------------

type Look = { colors: FocusColors; theme: FocusTheme; isLight: boolean }

async function lookNow($: EngineInterface): Promise<Look> {
  const current = await read($, theme)
  return { colors: bandColors(current, await read($, customColors)), theme: current, isLight: current === 'light' }
}

// The band above the prompt: null when Focus is off or nothing is running.
async function drawBand($: EngineInterface, e: RenderInput<'AbovePrompt'>) {
  const t = await read($, task)
  if (t === null || !(await read($, focusOn))) return null
  const { Box, Text, Button } = $.ui.resolve(e)
  const look = await lookNow($)
  const { colors } = look
  const isFolded = await read($, collapsed)
  const clock = await read($, now)
  const frameProps = { borderStyle: 'round', borderColor: colors.border, paddingX: 1 } as const
  const titleText = (text: string) => (
    <Text color={colors.text} bold wrap="truncate">
      {text}
    </Text>
  )
  const paused = isWaiting(t)
  const percent = progressOf(t)
  // The title is the prompt: a star while the task runs, the done mark once
  // it is over. The brain marks the steps, not the title.
  const brain = await glyph($, 'brain')
  const doneMark = await glyph($, 'done')
  const mark = t.doneAt === null ? '✶' : doneMark

  // The bar takes the room the title, the caption and the percent leave.
  const columns = Math.max(e.props.bodyColumns ?? 80, 30)
  const titleCells = isFolded ? Math.min(30, t.title.length + 2) : 0
  const barWidth = Math.max(8, columns - 26 - titleCells)
  const { filled, runs } = barRuns(look.theme, colors.bar, barWidth, percent)
  const bar = (
    <Box>
      {runs.map(run => (
        <Text color={run.color}>{'█'.repeat(run.cells)}</Text>
      ))}
      <Text dimColor>{'░'.repeat(barWidth - filled)}</Text>
    </Box>
  )
  const percentText = (
    <Text color={colors.text} bold>
      {`${percent}%`.padStart(4)}
    </Text>
  )
  const foldButton = <Button key="focus-collapse" plain dimColor label={isFolded ? '[+]' : '[–]'} onPress={() => update($, collapsed, v => !v)} />

  if (isFolded)
    return (
      <Box {...frameProps} gap={1}>
        <Box width={titleCells}>{titleText(`${mark} ${t.title}`)}</Box>
        {t.steps.length > 0 ? bar : <Text dimColor>{`${stepCaption(t)}${callsText(t) === '' ? '' : ` · ${callsText(t)}`}`}</Text>}
        {t.steps.length > 0 && percentText}
        {foldButton}
      </Box>
    )

  const runningMark = await glyph($, 'running')
  // The feed: the last calls of the turn, each as Claude described it, the
  // ones done dimmed and the one under way in the band's color with its
  // clock. Under the running step, or in the steps' place without a list,
  // where each call is a step and takes the brain in the gutter; nothing once
  // the turn is over.
  const calls = await read($, feed)
  const feedRows = (indent: number, rows: number, asSteps: boolean): RenderChildren[] =>
    t.doneAt !== null || paused
      ? []
      : feedInView(calls, rows).map(call => {
          const running = call.doneAt == null
          return (
            <Box key={`feed-${call.id}`} paddingLeft={indent} gap={1}>
              {asSteps && <Text dimColor>{brain}</Text>}
              <Box flexGrow={1} gap={1} justifyContent="space-between">
                <Text wrap="truncate" dimColor={!running} color={running ? colors.text : undefined}>
                  {`${running ? runningMark : doneMark} `}
                  <Text bold={running}>{call.tool}</Text>
                  {call.target === '' ? '' : `  ${call.target}`}
                </Text>
                {running && (
                  <Text dimColor>{clockText(clock - call.startedAt)}</Text>
                )}
              </Box>
            </Box>
          )
        })
  const callCount = callsText(t)
  const shown = stepsInView(t, STEP_ROWS)
  const runningRow = shown.findIndex(step => step.status === 'in_progress')
  const finished = t.steps.filter(s => s.status === 'completed').length

  // One row a step: the brain and the step's number in the gutter, then a
  // strip tinted by state with the dot, the title, Working on the running
  // one (Paused while the turn is over) and the step's clock.
  const stepRow = (step: FocusStep, i: number) => {
    const running = step.status === 'in_progress'
    const number = String(t.steps.indexOf(step) + 1).padStart(2)
    const time = stepTime(step, clock)
    return (
      <Box key={`step-${step.id}`} flexDirection="column">
        <Box gap={1}>
          <Text dimColor>{`${brain} ${number}`}</Text>
          <Box flexGrow={1} backgroundColor={stepTint(step.status, colors.bar, look.isLight)} paddingX={1} justifyContent="space-between" gap={1}>
            <Text wrap="truncate">
              <Text color={stepColor(step.status, colors.bar)}>{'● '}</Text>
              <Text color={running ? colors.text : undefined} bold={running} dimColor={step.status === 'pending'}>
                {step.text}
              </Text>
            </Text>
            <Box gap={2} flexShrink={0}>
              {running && <Text color={colors.text}>{paused ? 'Paused' : 'Working'}</Text>}
              {time !== '' && <Text dimColor>{time}</Text>}
            </Box>
          </Box>
        </Box>
        {i === runningRow && feedRows(5, FEED_ROWS_UNDER_STEP, false)}
      </Box>
    )
  }

  return (
    <Box {...frameProps} flexDirection="column">
      <Box gap={1} justifyContent="space-between">
        {titleText(`${mark} ${t.title}`)}
        <Box flexShrink={0} gap={1}>
          <Text dimColor>{paused ? 'paused' : clockText(taskElapsed(t, clock))}</Text>
          {callCount !== '' && <Text dimColor>{`· ${callCount}`}</Text>}
          {foldButton}
        </Box>
      </Box>
      {t.steps.length > 0 ? (
        <Box gap={1}>
          <Text dimColor>{stepCaption(t).padEnd(14)}</Text>
          {bar}
          {percentText}
        </Box>
      ) : (
        // No list: the caption, then the feed in the steps' place, no bar to fill.
        <Text dimColor>{stepCaption(t)}</Text>
      )}
      {t.steps.length === 0 && feedRows(0, FEED_ROWS, true)}
      {shown.map(stepRow)}
      {t.steps.length > shown.length && <Text dimColor>{`${brain} +${t.steps.length - shown.length} more · ${finished} done`}</Text>}
    </Box>
  )
}

// Focus on and off, on the Settings page, and the chip that opens the color
// page, framed and written in the band's color (rainbow: one color a letter).
export async function drawFocusSettings($: EngineInterface, e: RenderInput<'Pane'>, ui: Frame, go: (panel: Panel) => unknown): Promise<RenderChildren[]> {
  const { Text, Button } = $.ui.resolve(e)
  const { t, heading, chips, chip, framed } = ui
  const on = await read($, focusOn)
  const picked = await read($, theme)
  const { bar } = bandColors(picked, await read($, customColors))
  const label = t('focusBandRow')
  const painted = framed(
    'focus-band',
    true,
    <Button key="focus-band" plain label={label} onPress={() => go('focus-band')}>
      <Text color={bar}>{picked === 'rainbow' ? rainbow(label).map(({ ch, color }) => <Text color={color}>{ch}</Text>) : label}</Text>
    </Button>,
    bar,
  )
  return [
    heading(t('focusMode')),
    chips('focus-switch', [chip('focus-on', t('on'), on, () => switchFocus($, true)), chip('focus-off', t('off'), !on, () => switchFocus($, false)), painted]),
  ]
}

// The Focus color page, opened from Settings: the presets as rows of
// swatches, and three fields when the custom one is picked.
export async function drawFocusBandPage($: EngineInterface, e: RenderInput<'Pane'>, ui: Frame, go: (panel: Panel) => unknown): Promise<RenderChildren[]> {
  if (e.surface !== 'terminal' && e.surface !== 'desktop') return []
  const { Box, Text, Button, Input } = $.ui.resolve(e)
  const { t, heading, chips, chip, check, swatches } = ui
  const picked = await read($, theme)
  const custom = await read($, customColors)
  const rows: RenderChildren[] = [chips('focus-band-nav', [chip('focus-band-back', t('backSettings'), false, () => go('settings'))]), heading(t('bandColor'))]
  for (const option of FOCUS_THEMES) {
    const isOn = option === picked
    const sample = option === 'rainbow' ? RAINBOW.slice(0, 6) : Array<string>(6).fill(bandColors(option, custom).bar)
    rows.push(
      <Button key={`focus-theme-${option}`} plain label={option} onPress={() => pickTheme($, option)}>
        {swatches(sample)}
        <Text bold={isOn}>{option}</Text>
        {check(isOn)}
      </Button>,
    )
  }
  if (picked === 'custom') {
    const parts: (keyof FocusColors)[] = ['bar', 'text', 'border']
    const fields = parts.map(part => (
      <Input key={`focus-color-${part}`} label={`${part} ${t('colorSuffix')}`} value={custom[part]} placeholder="#3b82f6" submitLabel="set" onSubmit={value => pickCustomColor($, part, value)} />
    ))
    rows.push(
      <Box key="focus-custom" flexDirection="column">
        {fields}
      </Box>,
    )
  }
  return rows
}

// Hooks ------------------------------------------------------------------------

// Nothing drawn in a tool row's place while Focus is on.
const NOTHING = { display: 'none' } as const

export function registerFocus(on: On) {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    return (await drawBand($, e)) ?? next(e)
  })
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => ((await read($, focusOn)) ? $.ui.resolve(e).Box(NOTHING) : next(e)))
  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => ((await read($, focusOn)) ? $.ui.resolve(e).Box(NOTHING) : next(e)))
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => ((await read($, focusOn)) ? $.ui.resolve(e).Box(NOTHING) : next(e)))
  on('ui.render', { component: 'ToolProgress' }, async ($, e, next) => ((await read($, focusOn)) ? $.ui.resolve(e).Box(NOTHING) : next(e)))

  // Claude's todo list, whole, each time it changes. A subagent's list
  // (e.agentId) is its own, not the band's.
  on('tool.call', { tool: 'TodoWrite' }, async ($, e, next) => {
    if (isAgentCall(e)) return next(e)
    const steps = stepsFromTodos(e.todos)
    if (steps.length > 0 && (await read($, focusOn))) await landingTask($)
    await replaceSteps($, () => steps)
    return next(e)
  }).catch(($, e, next) => next(e))

  // A plan approved in plan mode, read as steps.
  on('tool.call', { tool: 'ExitPlanMode' }, async ($, e, next) => {
    const ran = await next(e)
    const plan = isApprovedPlan(e as { agentId?: string }, ran as { deny?: unknown; isError?: unknown; result?: unknown })
    if (plan === null || !(await read($, focusOn))) return ran
    const parsed = parsePlanSteps(plan)
    if (parsed.steps.length > 0) await landingTask($)
    if (parsed.steps.length > 0 || parsed.title !== null) await replaceSteps($, prev => (parsed.steps.length > 0 ? parsed.steps : prev), parsed.title ?? undefined)
    return ran
  }).catch(($, e, next) => next(e))

  // Tasks: one step each, created pending, updated or removed by id.
  on('tool.call', { tool: 'TaskCreate' }, async ($, e, next) => {
    if (isAgentCall(e)) return next(e)
    const ran = await next(e)
    const created = ran.result as { task?: { id?: string } } | undefined
    const id = created?.task?.id
    if (id === undefined) return ran
    if (await read($, focusOn)) await landingTask($)
    await replaceSteps($, prev => [...prev.filter(s => s.id !== id), { id, text: e.subject, status: 'pending' }])
    return ran
  }).catch(($, e, next) => next(e))
  on('tool.call', { tool: 'TaskUpdate' }, async ($, e, next) => {
    if (isAgentCall(e)) return next(e)
    const ran = await next(e)
    const refused = ran.deny !== undefined || ran.isError === true
    if (refused) return ran
    await replaceSteps($, prev =>
      e.status === 'deleted'
        ? prev.filter(s => s.id !== e.taskId)
        : prev.map(s => (s.id === e.taskId ? { ...s, text: e.subject ?? s.text, status: e.status === undefined ? s.status : toStatus(e.status) } : s)),
    )
    return ran
  }).catch(($, e, next) => next(e))

  // Every tool call of the main loop joins the band's feed while it runs,
  // stays there done once it returns, and is counted on the task.
  on('tool.call', async ($, e, next) => {
    if (isAgentCall(e) || !(await read($, focusOn))) return next(e)
    const at = await $.clock.now()
    const call: FocusAction = { id: ++callSeq, ...actionOf(e.tool, e as unknown as Record<string, unknown>, at) }
    await update($, feed, list => withCall(list, call))
    await update($, task, t => (t === null || t.doneAt !== null ? t : { ...t, calls: (t.calls ?? 0) + 1 }))
    try {
      return await next(e)
    } finally {
      const ended = await $.clock.now()
      await update($, feed, list => withCallDone(list, call.id, ended))
    }
  }).catch(($, e, next) => next(e))

  // The todo tools' descriptions carry the band's ask while Focus is on:
  // cached in the tool list, read where the model decides to use them. The
  // tools are the engine's own, so the answer passes Claude Code's built-in
  // guard; switchFocus asks again on a change.
  on('tool.describe', { tool: 'TodoWrite' }, async ($, e, next) => {
    const described = await next(e)
    return (await read($, focusOn)) ? { ...described, description: described.description + FOCUS_TODO_NOTE('TodoWrite') } : described
  })
  on('tool.describe', { tool: 'TaskCreate' }, async ($, e, next) => {
    const described = await next(e)
    return (await read($, focusOn)) ? { ...described, description: described.description + FOCUS_TODO_NOTE('TaskCreate') } : described
  })
}

// Numbers the calls of this process, so the feed tells parallel ones apart.
let callSeq = 0

// A subagent's call carries its agent's id; the main loop's carries none.
const isAgentCall = (e: unknown): boolean => (e as { agentId?: string }).agentId !== undefined

