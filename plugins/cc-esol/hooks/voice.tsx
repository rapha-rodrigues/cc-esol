// The Voice button on the row under the prompt: Claude Code's own /voice
// (dictation) toggled from here, with its state beside it. The state is what
// Claude Code persists in the settings (`voice.enabled`, or the older
// `voiceEnabled`), read at the start and after every /voice, typed or pressed.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

const voiceOn = atom({ plugin: 'cc-esol', key: 'voiceOn' } as const, null)

export function readVoiceOn($: EngineInterface) {
  return read($, voiceOn)
}

// `voice.enabled` as Claude Code writes it; `voiceEnabled` from older builds beneath.
export const voiceEnabledIn = (settings: unknown): boolean | null => {
  const s = settings as { voice?: { enabled?: unknown }; voiceEnabled?: unknown } | null | undefined
  if (typeof s?.voice?.enabled === 'boolean') return s.voice.enabled
  if (typeof s?.voiceEnabled === 'boolean') return s.voiceEnabled
  return null
}

// What /voice said: "Voice mode enabled (hold)…" or "Voice mode disabled".
export const voiceStateIn = (said: string): boolean | null => (/\benabled\b/i.test(said) ? true : /\bdisabled\b/i.test(said) ? false : null)

export async function loadVoice($: EngineInterface) {
  try {
    const state = voiceEnabledIn(await $.settings.read())
    await update($, voiceOn, () => state)
  } catch {}
}

// Claude Code's /voice with no argument: a toggle, the mode kept. Its answer
// says what happened; the settings it wrote are the fallback.
export async function toggleVoice($: EngineInterface) {
  try {
    const result = await $.command.run({ command: 'voice', args: '' })
    const fromAnswer = voiceStateIn(result.text ?? '')
    const fromSettings = voiceEnabledIn(await $.settings.read())
    await update($, voiceOn, () => fromAnswer ?? fromSettings)
  } catch (error) {
    $.ui.toast(`/voice: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export function registerVoice(on: On) {
  // A /voice typed at the prompt (or run from here): the button follows.
  on('command.run', { command: 'voice' }, async ($, e, next) => {
    const result = await next(e)
    const state = voiceStateIn(result.text ?? '')
    if (state !== null) await update($, voiceOn, () => state)
    else await loadVoice($)
    return result
  }).catch(($, e, next) => next(e))
}
