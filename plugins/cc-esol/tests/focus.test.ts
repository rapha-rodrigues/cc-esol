import { describe, expect, test } from 'claude-code/testing'

import {
  actionOf,
  bandColors,
  barRuns,
  clockText,
  isApprovedPlan,
  parsePlanSteps,
  progressOf,
  stampSteps,
  stepCaption,
  stepsFromTodos,
  stepsInView,
  stepTime,
  stepTint,
  taskElapsed,
  toStatus,
  feedInView,
  FOCUS_NUDGE,
  FOCUS_TODO_NOTE,
  wantsList,
  withCall,
  withCallDone,
} from '../hooks/lib/focus'
import type { FocusTask, StepStatus } from '../types'

const taskOf = (...statuses: StepStatus[]): FocusTask => ({
  title: 'build it',
  startedAt: 0,
  doneAt: null,
  steps: statuses.map((status, i) => ({ id: `s${i}`, text: `step ${i + 1}`, status })),
})

describe('focus arithmetic', () => {
  test('progress and the caption follow the steps', () => {
    const t = taskOf('completed', 'in_progress', 'pending', 'pending')
    expect(progressOf(t)).toBe(25)
    expect(stepCaption(t)).toBe('Step 2 of 4')
    expect(progressOf(taskOf())).toBe(0)
    expect(stepCaption(taskOf())).toBe('Working…')
    expect(progressOf({ ...t, doneAt: 9 })).toBe(100)
    expect(stepCaption({ ...t, doneAt: 9 })).toBe('Done')
    // Without a running step the caption points at the first one not done.
    expect(stepCaption(taskOf('completed', 'completed', 'pending'))).toBe('Step 3 of 3')
    expect(stepCaption(taskOf('completed', 'completed'))).toBe('Step 2 of 2')
  })

  test('the bar fills whole cells, in one color or eight', () => {
    expect(barRuns('blue', '#60a5fa', 40, 50)).toEqual({ filled: 20, runs: [{ color: '#60a5fa', cells: 20 }] })
    expect(barRuns('green', '#4ade80', 40, 0)).toEqual({ filled: 0, runs: [] })
    expect(barRuns('green', '#4ade80', 10, 250).filled).toBe(10)
    const full = barRuns('rainbow', '', 40, 100)
    expect(full.runs).toHaveLength(8)
    expect(full.runs.reduce((n, r) => n + r.cells, 0)).toBe(40)
    const half = barRuns('rainbow', '', 40, 50)
    expect(half.runs.reduce((n, r) => n + r.cells, 0)).toBe(20)
    expect(half.runs.length).toBeLessThan(8)
  })

  test('the window keeps the running step near the top and never runs past the end', () => {
    const long = taskOf(...Array<StepStatus>(5).fill('completed'), 'in_progress', 'pending', 'pending', 'pending', 'pending')
    const shown = stepsInView(long)
    expect(shown).toHaveLength(6)
    expect(shown[2]?.status).toBe('in_progress')
    expect(stepsInView(taskOf('pending', 'pending'))).toHaveLength(2)
    const tail = taskOf(...Array<StepStatus>(8).fill('completed'), 'in_progress')
    expect(stepsInView(tail).map(s => s.id)).toEqual(['s3', 's4', 's5', 's6', 's7', 's8'])
  })

  test('todos become steps, the active form while one runs; a clock reads in seconds and minutes', () => {
    const steps = stepsFromTodos([
      { content: 'Plan', status: 'completed', activeForm: 'Planning' },
      { content: 'Build', status: 'in_progress', activeForm: 'Building' },
      { content: 'Ship', status: 'odd', activeForm: '' },
    ])
    expect(steps.map(s => [s.id, s.text, s.status])).toEqual([
      ['todo-0', 'Plan', 'completed'],
      ['todo-1', 'Building', 'in_progress'],
      ['todo-2', 'Ship', 'pending'],
    ])
    expect(toStatus('in_progress')).toBe('in_progress')
    expect(toStatus('whatever')).toBe('pending')
    expect(clockText(0)).toBe('0s')
    expect(clockText(59_999)).toBe('59s')
    expect(clockText(65_000)).toBe('1m 5s')
    expect(bandColors('custom', { bar: '#1', text: '#2', border: '#3' })).toEqual({ bar: '#1', text: '#2', border: '#3' })
    expect(bandColors('light', { bar: '#1', text: '#2', border: '#3' }).text).toBe('text')
  })

  test('step clocks: running stamps a start, done stamps an end, a relay from the finish before', () => {
    const a = { id: 'a', text: 'A', status: 'in_progress' as const }
    const b = { id: 'b', text: 'B', status: 'pending' as const }
    const c = { id: 'c', text: 'C', status: 'pending' as const }
    const first = stampSteps([], [a, b, c], 10_000, 0)
    expect(first[0]).toMatchObject({ startedAt: 10_000 })
    expect(first[0]).not.toHaveProperty('doneAt')
    expect(first[1]).not.toHaveProperty('startedAt')
    const second = stampSteps(first, [{ ...a, status: 'completed' }, { ...b, status: 'in_progress' }, c], 25_000, 0)
    expect(second[0]).toMatchObject({ startedAt: 10_000, doneAt: 25_000 })
    expect(second[1]).toMatchObject({ startedAt: 25_000 })
    const third = stampSteps(second, [{ ...a, status: 'completed' }, { ...b, status: 'completed' }, { ...c, status: 'completed' }], 40_000, 0)
    expect(third[1]).toMatchObject({ startedAt: 25_000, doneAt: 40_000 })
    expect(third[2]).toMatchObject({ startedAt: 25_000, doneAt: 40_000 })
    expect(stepTime(third[0]!, 99_000)).toBe('15s')
    expect(stepTime(second[1]!, 31_000)).toBe('6s')
    expect(stepTime(c, 31_000)).toBe('')
    const moved = stampSteps(second, [{ id: 'x', text: 'A', status: 'completed' }], 50_000, 0)
    expect(moved[0]).toMatchObject({ startedAt: 10_000, doneAt: 25_000 })
    expect(stepTint('completed', '#3b82f6', false)).not.toBe(stepTint('in_progress', '#3b82f6', false))
    expect(stepTint('pending', '#3b82f6', true)).toMatch(/^#[0-9a-f]{6}$/)
  })

  test('a plan approved in plan mode is read by its structure, and only when it is this conversation\'s own', () => {
    const plan = ['# Ship the dashboard', '', 'prose', '```', '1. not a step', '```', '## Work', '1. Scaffold the page', '2. [x] Wire the data', '- [ ] Draw the charts', '   - a nested note', '* Test it', ''].join('\n')
    const parsed = parsePlanSteps(plan)
    expect(parsed.title).toBe('Ship the dashboard')
    expect(parsed.steps.map(st => [st.text, st.status])).toEqual([
      ['Scaffold the page', 'pending'],
      ['Wire the data', 'completed'],
      ['Draw the charts', 'pending'],
      ['Test it', 'pending'],
    ])
    expect(parsePlanSteps('# T\n## First\nprose\n## Second').steps.map(st => st.text)).toEqual(['First', 'Second'])
    expect(parsePlanSteps('# T\n- only one')).toEqual({ title: 'T', steps: [] })
    const ok = { result: { plan: '# P\n1. a\n2. b', isAgent: false } }
    expect(isApprovedPlan({}, ok)).toBe('# P\n1. a\n2. b')
    expect(isApprovedPlan({ agentId: 'sub' }, ok)).toBe(null)
    expect(isApprovedPlan({}, { ...ok, deny: 'no' })).toBe(null)
    expect(isApprovedPlan({}, { ...ok, isError: true })).toBe(null)
    expect(isApprovedPlan({}, { result: { plan: null } })).toBe(null)
    expect(isApprovedPlan({}, { result: { plan: '  ' } })).toBe(null)
    expect(isApprovedPlan({}, { result: { plan: 'x', isAgent: true } })).toBe(null)
    expect(isApprovedPlan({}, { result: { plan: 'x', awaitingLeaderApproval: true } })).toBe(null)
  })

  test('the now line names the tool and what it is on; the task clock leaves paused time out', () => {
    expect(actionOf('Bash', { command: 'npm test', description: 'Run the tests' }, 1)).toEqual({ tool: 'Bash', target: 'Run the tests', startedAt: 1 })
    expect(actionOf('Bash', { command: 'npm test\necho done' }, 1).target).toBe('npm test')
    expect(actionOf('Read', { file_path: '/a/b/app.ts' }, 1).target).toBe('app.ts')
    expect(actionOf('Grep', { pattern: 'TODO' }, 1).target).toBe('TODO')
    expect(actionOf('Agent', { description: 'Audit auth' }, 1).target).toBe('Audit auth')
    expect(actionOf('mcp__github__create_issue', {}, 1)).toEqual({ tool: 'github:create_issue', target: '', startedAt: 1 })
    expect(actionOf('Bash', { description: 'x'.repeat(80) }, 1).target).toHaveLength(60)
    const t: FocusTask = { title: 'x', startedAt: 10_000, doneAt: null, steps: [], waitingAt: null, pausedMs: 4_000 }
    expect(taskElapsed(t, 30_000)).toBe(16_000)
    expect(taskElapsed({ ...t, waitingAt: 20_000 }, 30_000)).toBe(6_000)
    expect(taskElapsed({ ...t, doneAt: 25_000 }, 30_000)).toBe(11_000)
  })
})

describe('focus nudge', () => {
  test('rides only beside a prompt long enough to be several steps', async () => {
    expect(wantsList('continue')).toBe(false)
    expect(wantsList('please fix the failing test in the auth module')).toBe(false)
    expect(wantsList('Reorganize the settings tab: move the icons last, paint the focus chip and add a chip for the status line')).toBe(true)
    expect(wantsList('Two things:\n1. fix it\n2. test it')).toBe(true)
    expect(wantsList('')).toBe(false)
    expect(FOCUS_NUDGE.startsWith('Focus band:')).toBe(true)
    expect(FOCUS_NUDGE).toContain('TodoWrite')
    expect(FOCUS_NUDGE).toContain('more than two tool calls')
    expect(FOCUS_NUDGE.length).toBeLessThan(320)
    // The note on the todo tools says the same, and names TaskUpdate for the task list.
    for (const tool of ['TodoWrite', 'TaskCreate'] as const) {
      expect(FOCUS_TODO_NOTE(tool).startsWith('\n\nFocus band:')).toBe(true)
      expect(FOCUS_TODO_NOTE(tool)).toContain('more than two tool calls')
      expect(FOCUS_TODO_NOTE(tool).length).toBeLessThan(320)
    }
    expect(FOCUS_TODO_NOTE('TaskCreate')).toContain('TaskUpdate')
    expect(FOCUS_TODO_NOTE('TodoWrite')).not.toContain('TaskUpdate')
  })

  test('the feed keeps the last four calls, oldest first, and stamps one done by its id', async () => {
    const call = (id: number) => ({ id, tool: 'Bash', target: `c${id}`, startedAt: id })
    let feed = withCall([], call(1))
    for (const id of [2, 3, 4, 5]) feed = withCall(feed, call(id))
    expect(feed.map(a => a.id)).toEqual([2, 3, 4, 5])
    feed = withCallDone(feed, 4, 40)
    expect(feed.find(a => a.id === 4)?.doneAt).toBe(40)
    expect(feed.find(a => a.id === 5)?.doneAt).toBeUndefined()
    expect(withCallDone(feed, 9, 1)).toEqual(feed)
    // A slow call under way is not pushed out by quick ones that came after
    // it: the oldest done one goes first, and the view shows running ones first.
    let slow = [call(1)]
    for (const id of [2, 3, 4, 5, 6]) slow = withCallDone(withCall(slow, call(id)), id, id * 10)
    expect(slow.map(a => a.id)).toEqual([1, 4, 5, 6])
    expect(feedInView(slow, 2).map(a => a.id)).toEqual([1, 6])
    expect(feedInView(slow, 4).map(a => a.id)).toEqual([1, 4, 5, 6])
    expect(feedInView([call(7), call(8), call(9)], 2).map(a => a.id)).toEqual([8, 9])
  })
})
