import { describe, expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { voiceEnabledIn, voiceStateIn } from '../hooks/voice'

const PLUGIN = 'cc-esol'
const HOME = '/home/someone'
const hint = { component: 'PromptHint' as const, props: { isDraft: false, isWorking: false, hint: '? for shortcuts' } }
const OK = { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false }

describe('voice, pure', () => {
  test('the state is read from the settings Claude Code writes, or from what /voice said', () => {
    expect(voiceEnabledIn({ voice: { enabled: true, mode: 'hold' } })).toBe(true)
    expect(voiceEnabledIn({ voice: { enabled: false }, voiceEnabled: true })).toBe(false)
    expect(voiceEnabledIn({ voiceEnabled: true })).toBe(true)
    expect(voiceEnabledIn({})).toBe(null)
    expect(voiceEnabledIn(undefined)).toBe(null)
    expect(voiceStateIn('Voice mode enabled (hold). Hold space to record.')).toBe(true)
    expect(voiceStateIn('Voice mode disabled.')).toBe(false)
    expect(voiceStateIn('Voice mode requires a Claude.ai account')).toBe(null)
  })
})

// The engine beneath: settings with dictation on or off, and a /voice that flips it.
const engineBeneath = (on: On, state: { enabled: boolean }) => {
  const files = new Map<string, string>([[`${HOME}/.claude/settings.json`, '{}\n']])
  const ran: string[] = []
  mock.clock(on)
  mock.store(on, {})
  mock.env(on, { HOME })
  on('ui.render', ($, e) => $.ui.resolve(e).Text({ children: 'engine' }))
  on('ui.open', () => ({ value: { isPlaced: true as const } }))
  on('ui.close', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.cwd', () => ({ value: `${HOME}/p` }))
  on('session.model', () => ({ value: 'claude-opus-5-5' }))
  on('tool.register', (_, e) => ({ value: { tool: `mcp__${PLUGIN}__${e.name}` } }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('config.list', () => ({ value: [] }) as never)
  on('fs.exists', (_, e) => ({ value: files.has(e.path) }))
  on('fs.read', (_, e) => ({ value: files.get(e.path) ?? '' }))
  on('fs.write', (_, e) => {
    files.set(e.path, e.text)
    return { value: undefined }
  })
  on('fs.list', () => ({ value: [] }))
  on('process.run', () => ({ value: { ...OK, exitCode: 1 } }))
  on('settings.read', () => ({ value: { voice: { enabled: state.enabled, mode: 'hold' } } }) as never)
  on('command.run', { command: 'voice' }, async (_$, e) => {
    ran.push(e.args)
    state.enabled = !state.enabled
    return { text: state.enabled ? 'Voice mode enabled (hold). Hold space to record.' : 'Voice mode disabled.' }
  })
  return { ran }
}

describe('voice button', () => {
  test('shows dictation on or off beside the lamp and toggles it through /voice', async ($, on) => {
    const state = { enabled: true }
    const { ran } = engineBeneath(on, state)
    await $.session.start({ cwd: `${HOME}/p`, surface: 'terminal', isInteractive: true })
    const corner = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint })
    expect(await corner.find({ key: 'esol-toggle' })).toBeDefined()
    expect((await corner.find({ key: 'esol-voice' }))?.text).toMatch(/Voice on/)
    await corner.press({ key: 'esol-voice' })
    expect(ran).toEqual([''])
    expect((await corner.find({ key: 'esol-voice' }))?.text).toMatch(/Voice off/)
    await corner.press({ key: 'esol-voice' })
    expect((await corner.find({ key: 'esol-voice' }))?.text).toMatch(/Voice on/)
  })

  test('starts off when the settings say so', async ($, on) => {
    engineBeneath(on, { enabled: false })
    await $.session.start({ cwd: `${HOME}/p`, surface: 'terminal', isInteractive: true })
    const corner = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint })
    expect((await corner.find({ key: 'esol-voice' }))?.text).toMatch(/Voice off/)
  })
})
