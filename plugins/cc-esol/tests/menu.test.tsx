import { describe, expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const PLUGIN = 'cc-esol'

// The two drawings the plugin owns: the pane and the row under the prompt.
const paneAt = {
  component: 'Pane' as const,
  requestId: 'cc-esol',
  props: { title: 'esol', isFocused: true, bodyColumns: 56, placement: 'dock' as const, scroll: { offset: 0, bodyRows: 26 }, view: {} },
}
const hintAt = { component: 'PromptHint' as const, props: { isDraft: false, isWorking: false, hint: '? for shortcuts' } }

// The least an engine beneath needs for the pane to draw; the ids it closes
// land in closed.
const bareEngine = (on: On, closed: string[] = []) => {
  mock.store(on)
  on('ui.render', ($, e) => $.ui.resolve(e).Text({ children: 'engine' }))
  on('ui.open', () => ({ value: { isPlaced: true as const } }))
  on('ui.close', (_$, e) => (closed.push(e.id), { value: undefined }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mountAll = async ($: any) => ({
  hint: await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hintAt }),
  pane: await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...paneAt }),
})

describe('the pane', () => {
  test('the lamp opens the pane on the coach, with no tabs, on the terminal and the desktop', async ($, on) => {
    bareEngine(on)
    for (const surface of ['terminal', 'desktop'] as const) {
      const hint = await $.ui.mount({ plugin: PLUGIN, surface, ...hintAt })
      const pane = await $.ui.mount({ plugin: PLUGIN, surface, ...paneAt })
      expect((await hint.find({ key: 'esol-toggle' }))?.text).toMatch(/esol ▲/)
      expect(await pane.find({ key: 'esol-settings' })).toBeUndefined()
      await hint.press({ key: 'esol-toggle' })
      expect((await hint.find({ key: 'esol-toggle' }))?.text).toMatch(/▼/)
      for (const key of ['esol-settings', 'esol-review']) expect(await pane.find({ key })).toBeDefined()
      for (const key of ['tab-esol', 'tab-model', 'tab-settings']) expect(await pane.find({ key })).toBeUndefined()
      await hint.press({ key: 'esol-toggle' })
      expect(await pane.find({ key: 'esol-settings' })).toBeUndefined()
      await hint.unmount()
      await pane.unmount()
    }
  })

  test('the hint row keeps what the engine and the other mods draw there, the lamp and Voice beside it', async ($, on) => {
    bareEngine(on)
    const { hint } = await mountAll($)
    expect(await hint.find({ type: 'Text', text: /^engine$/ })).toBeDefined()
    for (const key of ['esol-toggle', 'esol-voice']) expect(await hint.find({ key })).toBeDefined()
    expect(await hint.find({ key: 'esol-model' })).toBeUndefined()
  })

  test('/esol opens the pane, and a /clear closes it', async ($, on) => {
    const closedIds: string[] = []
    bareEngine(on, closedIds)
    on('session.end', () => ({ sessionId: 's1' }))
    const { pane } = await mountAll($)
    const opened = await $.command.run({ command: 'esol', args: '' })
    expect(opened.text).toMatch(/open/)
    expect(await pane.find({ key: 'esol-settings' })).toBeDefined()
    await $.session.end({ reason: 'clear' } as never)
    expect(closedIds).toEqual(['cc-esol'])
    expect(await pane.find({ key: 'esol-settings' })).toBeUndefined()
  })
})
