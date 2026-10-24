// What every page of the pane draws with: the open page and the language
// (atoms live here, read through accessors elsewhere), the pane's constants,
// the row under the prompt, and the chip, heading and swatch idiom built
// once per drawing from the surface's own elements.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, RenderChildren, RenderInput } from 'claude-code'

import type { Lang, Panel } from '../../types'
import { glyph } from '../icons'
import { RAINBOW } from '../lib/focus'
import type { Phrase } from '../lib/i18n'
import { readVoiceOn } from '../voice'

const openPage = atom({ plugin: 'cc-esol', key: 'menu' } as const, null)
const language = atom({ plugin: 'cc-esol', key: 'lang' } as const, 'en')
// Whether this session's values were refilled from the store. A /clear
// resets every session value, this one too, so the next prompt restores
// whether or not a session.start event reached the plugin.
const refilled = atom({ plugin: 'cc-esol', key: 'restored' } as const, false)

export function readMenu($: EngineInterface) {
  return read($, openPage)
}
export function setMenu($: EngineInterface, panel: Panel | null) {
  return update($, openPage, () => panel)
}
export function readRestored($: EngineInterface) {
  return read($, refilled)
}
export function markRestored($: EngineInterface) {
  return update($, refilled, () => true)
}
export function readLang($: EngineInterface) {
  return read($, language)
}

// The pane: a sidebar in the fullscreen layout, a block above the prompt otherwise.
export const PANE = 'cc-esol'
export const PANE_SIZE = { rows: 26, columns: 56 }
// The pane's background until the terminal's own is known.
export const PANE_BACKGROUND = '#0b0b0b'
export const MENU_NAME = 'esol'
// The tab strip's rows: the tabs and the rule under them.
export const TAB_STRIP_ROWS = 2

// A word in the rainbow, one color a letter.
export const rainbow = (text: string) => [...text].map((ch, i) => ({ ch, color: RAINBOW[i % RAINBOW.length]! }))

export type T = (key: Phrase, vars?: Record<string, string | number>) => string

export type Frame = {
  lng: Lang
  t: T
  columns: number
  rule: RenderChildren
  framed: (key: string, isOn: boolean, button: RenderChildren, frame?: string) => RenderChildren
  chip: (key: string, label: string, isOn: boolean, onPress: () => unknown, color?: string) => RenderChildren
  chips: (key: string, items: RenderChildren[]) => RenderChildren
  check: (isOn: boolean) => RenderChildren
  swatches: (colors: readonly string[]) => RenderChildren
  heading: (text: string, extra?: RenderChildren) => RenderChildren
}

// The engine's hint on one row (a second line holding only a separator
// drew as a stray dot).
const oneLineHint = (hint: string): string => {
  const lines = hint.split(/\r?\n/).map(l => l.trim())
  const spoken = lines.filter(l => /[\p{L}\p{N}]/u.test(l))
  return spoken.join(' · ')
}

// The row under the prompt: the engine's hint at the left; at the right the
// lamp that opens the sidebar, the Model shortcut, and the Voice toggle.
export async function drawPromptHint($: EngineInterface, e: RenderInput<'PromptHint'>, toggleMenu: () => unknown, openModel: () => unknown, toggleVoice: () => unknown) {
  const { Box, Text, Button } = $.ui.resolve(e)
  const page = await read($, openPage)
  const voice = await readVoiceOn($)
  const lamp = `${await glyph($, 'lamp')} ${MENU_NAME} ${page === null ? '▲' : '▼'}`
  const onModel = page === 'model'
  return (
    <Box flexGrow={1} gap={1} justifyContent="space-between">
      <Text wrap="truncate" dimColor>
        {oneLineHint(e.props.hint)}
      </Text>
      <Box gap={2} flexShrink={0}>
        <Button key="esol-toggle" plain label={lamp} onPress={toggleMenu} />
        <Button key="esol-model" plain label="Model" onPress={openModel}>
          <Text bold={onModel} color={onModel ? 'claude' : undefined}>
            Model
          </Text>
        </Button>
        <Button key="esol-voice" plain label="Voice" onPress={toggleVoice}>
          <Text>Voice </Text>
          <Text bold={voice === true} color={voice === true ? 'claude' : undefined} dimColor={voice !== true}>
            {voice === null ? '·' : voice ? 'on' : 'off'}
          </Text>
        </Button>
      </Box>
    </Box>
  )
}

// The drawing idiom, bound to one drawing's elements. A chip is a Button in
// a rounded frame (keyed `<key>-box`): the chosen one framed and written in
// the accent color, or in `frame`; the rest dim. Chips sit in a wrapping row.
export function frame($: EngineInterface, e: RenderInput<'Pane'>, lng: Lang, t: T, columns: number): Frame {
  const { Box, Text, Button } = $.ui.resolve(e)
  const width = Math.max(10, columns - 2)
  const rule = <Text dimColor>{'─'.repeat(width)}</Text>
  const framed: Frame['framed'] = (key, isOn, button, frameColor) => (
    <Box key={`${key}-box`} borderStyle="round" borderColor={isOn ? (frameColor ?? 'claude') : undefined} borderDimColor={!isOn} paddingX={1}>
      {button}
    </Box>
  )
  const chip: Frame['chip'] = (key, label, isOn, onPress, color) =>
    framed(
      key,
      isOn,
      <Button key={key} plain label={label} onPress={onPress}>
        <Text bold={isOn} color={isOn ? 'claude' : color}>
          {label}
        </Text>
      </Button>,
    )
  const chips: Frame['chips'] = (key, items) => (
    <Box key={key} flexWrap="wrap" columnGap={1}>
      {items}
    </Box>
  )
  const check: Frame['check'] = isOn => isOn && <Text color="claude">{' ✓'}</Text>
  const swatches: Frame['swatches'] = colors => (
    <Text>
      {colors.map(color => (
        <Text color={color}>{'■ '}</Text>
      ))}
    </Text>
  )
  const heading: Frame['heading'] = (text, extra) => (
    <Box key={`h-${text}`} marginTop={1} gap={1}>
      <Text dimColor>{text}</Text>
      {extra}
    </Box>
  )
  return { lng, t, columns, rule, framed, chip, chips, check, swatches, heading }
}
