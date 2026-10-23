// The Settings page: Focus on and off inline, then one row per section that
// opens its own page and comes back with the Back chip.

import type { EngineInterface, RenderChildren, RenderInput } from 'claude-code'

import type { Panel } from '../../types'
import type { Frame } from '../ui/frame'
import { drawFocusSettings, readFocusTheme } from './focus'
import { readStatusLineSummary } from './statusline'
import { readThemeName } from './themes'
import { ICON_SETS, readIconSet, setIconSet } from '../icons'

export async function drawSettingsPage($: EngineInterface, e: RenderInput<'Pane'>, ui: Frame, go: (panel: Panel) => unknown): Promise<RenderChildren[]> {
  if (e.surface !== 'terminal' && e.surface !== 'desktop') return []
  const { Box, Text, Button } = $.ui.resolve(e)
  const { t, heading, chip, chips } = ui
  const iconSet = await readIconSet($)
  const band = await readFocusTheme($)
  const theme = (await readThemeName($)) ?? t('terminalDefault')
  const statusLine = await readStatusLineSummary($)

  // A row: the section's name, its current value, and the chevron that opens it.
  const row = (key: string, label: string, value: string, panel: Panel) => (
    <Button key={key} plain label={label} onPress={() => go(panel)}>
      <Text>{label.padEnd(20)}</Text>
      <Text bold>{value}</Text>
      <Text dimColor>{' ›'}</Text>
    </Button>
  )

  return [
    ...(await drawFocusSettings($, ui)),
    heading(t('iconsTitle')),
    chips(
      'settings-icons',
      ICON_SETS.map(set => chip(`settings-icons-${set}`, t(set === 'auto' ? 'iconsAuto' : set === 'nerd' ? 'iconsNerd' : 'iconsUnicode'), set === iconSet, () => setIconSet($, set))),
    ),
    heading(t('tabSettings')),
    <Box key="settings-rows" flexDirection="column">
      {row('settings-focus-band', t('focusBandRow'), band, 'focus-band')}
      {row('settings-theme', t('themeRow'), theme, 'themes')}
      {row('settings-statusline', t('statusLineRow'), statusLine, 'statusline')}
    </Box>,
  ]
}
