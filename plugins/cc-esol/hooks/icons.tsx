// The icons the panel draws with: Nerd Font glyphs (one cell, monochrome)
// where the terminal's font has them, Unicode emoji elsewhere. No mod can
// see the terminal's font, so Auto follows the ccstatusline config: a
// powerline status line already relies on such glyphs. Settings overrides.

import { atom, read, update } from 'claude-code'
import type { EngineInterface } from 'claude-code'

import type { IconSet } from '../types'
import { readStatusLinePowerline } from './pages/statusline'

const icons = atom({ plugin: 'cc-esol', key: 'icons' } as const, 'auto')

export const ICON_SETS: readonly IconSet[] = ['auto', 'nerd', 'unicode']
export type IconName = 'brain' | 'lamp'
// md-brain U+F09D1 and md-lightbulb_on_outline U+F06E9 from the Nerd Fonts.
export const GLYPHS: Record<IconName, { nerd: string; unicode: string }> = {
  brain: { nerd: '\u{F09D1}', unicode: '🧠' },
  lamp: { nerd: '\u{F06E9}', unicode: '💡' },
}

export function readIconSet($: EngineInterface) {
  return read($, icons)
}

export async function setIconSet($: EngineInterface, set: IconSet) {
  await update($, icons, () => set)
  await $.store.set('icons', set)
}

export async function loadIcons($: EngineInterface) {
  const kept = await $.store.get('icons')
  if (ICON_SETS.includes(kept as IconSet)) await update($, icons, () => kept as IconSet)
}

// The set in force now: Auto resolves by the status line's powerline.
export async function iconSetNow($: EngineInterface): Promise<'nerd' | 'unicode'> {
  const set = await read($, icons)
  if (set !== 'auto') return set
  return (await readStatusLinePowerline($)) ? 'nerd' : 'unicode'
}

export async function glyph($: EngineInterface, name: IconName): Promise<string> {
  return GLYPHS[name][await iconSetNow($)]
}
