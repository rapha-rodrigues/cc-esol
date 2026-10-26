// The hooks module: the ESOL pane, the session's lifecycle, and the prompt
// and turn hooks. The coach draws its own page; this file routes to it.

import type { EngineInterface, On, Register, RenderInput } from 'claude-code'

import { clearEnglishPending, drawEnglishPage, focusEsol, loadEnglish, registerEnglish, registerEnglishTool, scrollEsol, withCoaching } from './english'
import { phrase, type Phrase } from './lib/i18n'
import { drawPromptHint, frame, markRestored, MENU_NAME, PANE, PANE_BACKGROUND, PANE_SIZE, readLang, readMenu, readRestored, setMenu } from './ui/frame'
import { loadVoice, registerVoice, toggleVoice } from './voice'

// The pane ---------------------------------------------------------------------

// The pane opened on the ESOL page, or closed.
async function toggleMenu($: EngineInterface) {
  if ((await readMenu($)) !== null) {
    // The plugin's own close skips its own ui.close hook: the page resets here too.
    await $.ui.close({ id: PANE })
    await setMenu($, null)
    return
  }
  await setMenu($, 'esol')
  await $.ui.open({ id: PANE, closeOnEscape: true, focus: true, title: MENU_NAME, ...PANE_SIZE })
}

// The pane: the ESOL page and the footer with the keys, on the theme's background.
async function drawPane($: EngineInterface, e: RenderInput<'Pane'>) {
  const drawable = e.surface === 'terminal' || e.surface === 'desktop'
  if (!drawable) return null
  const { Box, Text } = $.ui.resolve(e)
  const lng = await readLang($)
  const t = (key: Phrase, vars?: Record<string, string | number>) => phrase(lng, key, vars)
  const columns = e.props.bodyColumns ?? PANE_SIZE.columns
  const ui = frame($, e, lng, t, columns)
  const body = await drawEnglishPage($, e, { heading: ui.heading, chip: ui.chip, chips: ui.chips, t, columns })
  return (
    <Box flexDirection="column" paddingX={1} backgroundColor={PANE_BACKGROUND} height={e.props.scroll.bodyRows} width={e.props.bodyColumns}>
      <Box flexDirection="column" flexGrow={1} flexShrink={1} overflow="hidden">
        {body}
      </Box>
      <Box key="footer" flexDirection="column" marginTop={1} flexShrink={0}>
        {ui.rule}
        <Text dimColor>{t('keys')}</Text>
      </Box>
    </Box>
  )
}

// The pane body's rows as last drawn, for the focus hook's measure of the list.
let bodyRowsSeen: number | undefined

function registerPane(on: On) {
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    bodyRowsSeen = e.props.scroll.bodyRows
    const open = (await readMenu($)) !== null
    return (open ? await drawPane($, e) : null) ?? $.ui.resolve(e).Text({ children: '' })
  })

  // However the pane closes (esc, the lamp), the page resets.
  on('ui.close', { id: PANE }, async ($, e, next) => {
    const closed = await next(e)
    await setMenu($, null)
    return closed
  }).catch(($, e, next) => next(e))

  // Another pane drawn beside this one (cc-focusdeck's, any mod's) closes
  // this one: the dock shows one pane, never the engine's row of tabs, and
  // the lamp brings it back.
  on('ui.open', async ($, e, next) => {
    const opened = await next(e)
    if (e.id !== PANE && 'value' in opened && opened.value.isPlaced && (await readMenu($)) !== null) {
      await $.ui.close({ id: PANE })
      await setMenu($, null)
    }
    return opened
  }).catch(($, e, next) => next(e))

  // The wheel moves the list, never the pane.
  on('ui.scroll', { requestId: PANE }, async ($, e, next) => {
    if (e.by === 0 || (await readMenu($)) === null) return next(e)
    await scrollEsol($, e.by, e.bodyRows)
    return {}
  }).catch(($, e, next) => next(e))

  // The focus ring reaching a row outside the list's window brings it into view.
  on('ui.focus', { requestId: PANE }, async ($, e, next) => {
    const moved = await next(e)
    if ((await readMenu($)) !== null) await focusEsol($, e.element, bodyRowsSeen ?? PANE_SIZE.rows)
    return moved
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => drawPromptHint($, e, next, () => toggleMenu($), () => toggleVoice($)))
}

// Lifecycle --------------------------------------------------------------------

// The kept settings into this session's values: at its start, and again
// after a /clear, which starts a session without a session.start.
async function restore($: EngineInterface) {
  await loadEnglish($)
  await loadVoice($)
  await markRestored($)
}

function registerLifecycle(on: On) {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await restore($)
    await registerEnglishTool($)
    await $.command.register({
      name: 'esol',
      description: 'Open the English coach: your latest corrections, the review and the settings',
      immediate: true,
    })
    return started
  })

  // A /clear ends the session and starts one with no session.start: the
  // pane, which outlives the session, is closed here, and the kept settings
  // come back at the first prompt (restore). Seen at session.end, which
  // reaches a user's mod on every account; the classic SessionStart event
  // does not on a Team or Enterprise login, where Claude Code's built-in
  // guard keeps the classic events from user mods.
  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      await $.ui.close({ id: PANE }).catch(() => {})
      await setMenu($, null)
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  on('command.run', { command: 'esol' }, async $ => {
    if ((await readMenu($)) === null) await toggleMenu($)
    return { text: 'The ESOL pane is open.' }
  })
}

// Prompts and turns ---------------------------------------------------------------

function registerTurns(on: On) {
  // The prompt as submitted, with the coaching's marker when it is English.
  on('prompt.submit', async ($, e, next) => {
    // After a /clear every session value is at its default: restore here
    // (a /clear starts a session without a session.start).
    if (!(await readRestored($))) await restore($)
    return next(await withCoaching($, e))
  }).catch(($, e, next) => next(e))

  // The main loop's end: a coached prompt that got no english_log call stops
  // waiting for one. A subagent's end (e.agentId) is heard too and is not the turn's.
  on('turn.complete', async ($, e, next) => {
    if ((e as { agentId?: string }).agentId === undefined) await clearEnglishPending($)
    return next(e)
  })
}

export const register: Register = on => {
  registerEnglish(on)
  registerVoice(on)
  registerLifecycle(on)
  registerPane(on)
  registerTurns(on)
}
