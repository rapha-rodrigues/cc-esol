// The one way this plugin writes ~/.claude/settings.json: a snapshot read
// first, a write refused when the file changed in between (nothing another
// tool wrote is lost), one backup before the first change, and on POSIX the
// new text landing in one step.

import type { ConfigValue, EngineInterface } from 'claude-code'

import { homeDir, isWindows, moveFileWinArgv, REPLACE_LOCKED_EXIT, replaceFileArgv } from './platform'

export type SettingsSnapshot = { path: string; text: string; data: Record<string, unknown> }

export async function settingsPath($: EngineInterface) {
  return `${await homeDir($)}/.claude/settings.json`
}

// The user settings as they stand: the text and the parsed object. A file
// that does not parse throws here, so it is never rewritten.
export async function readSettings($: EngineInterface): Promise<SettingsSnapshot> {
  const path = await settingsPath($)
  const text = (await $.fs.exists(path)) ? await $.fs.read(path) : '{}'
  const data: unknown = JSON.parse(text)
  if (data === null || typeof data !== 'object' || Array.isArray(data)) throw new Error('settings.json is not a JSON object')
  return { path, text, data: data as Record<string, unknown> }
}

// Writes `data` over the file the snapshot came from. Refused when the file
// changed since the snapshot. The window left is the moment between this
// re-read and the write.
export async function writeSettings($: EngineInterface, snapshot: SettingsSnapshot, data: Record<string, unknown>) {
  const now = (await $.fs.exists(snapshot.path)) ? await $.fs.read(snapshot.path) : '{}'
  if (now !== snapshot.text) throw new Error('settings.json changed meanwhile: try again')
  const backup = `${snapshot.path}.cc-esol.bak`
  if (!(await $.fs.exists(backup))) await $.fs.write(backup, snapshot.text)
  await replaceFile($, snapshot.path, `${JSON.stringify(data, null, 2)}\n`)
}

// `text` over the file at `path`, in one step on every platform.
export async function replaceFile($: EngineInterface, path: string, text: string) {
  if (await isWindows($)) {
    const tmp = `${path}.tmp-${Math.random().toString(36).slice(2, 8)}`
    await $.fs.write(tmp, text)
    const moved = await $.process.run(moveFileWinArgv(tmp, path), { timeoutMs: 10_000 })
    if (moved.exitCode !== 0) throw new Error(moved.stderr.trim() || `move exited with ${moved.exitCode}`)
    return
  }
  const ran = await $.process.run(replaceFileArgv(path), { stdin: text })
  if (ran.exitCode === REPLACE_LOCKED_EXIT) throw new Error('another save is in progress: try again in a moment')
  if (ran.exitCode !== 0) throw new Error(ran.stderr.trim() || `sh exited with ${ran.exitCode}`)
}

// Sets one top-level key (undefined deletes it): through the /config row when
// the engine has one for it, else through the file. Returns whether anything changed.
export async function setSettingsKey($: EngineInterface, key: string, value: unknown): Promise<boolean> {
  if (value !== undefined) {
    try {
      const row = (await $.config.list()).find(r => r.key === key)
      if (row !== undefined) {
        const set = await $.config.set({ key, value: value as ConfigValue })
        if (set.deny === undefined) return true
      }
    } catch {}
  }
  const snapshot = await readSettings($)
  if (JSON.stringify(snapshot.data[key]) === JSON.stringify(value)) return false
  const data = { ...snapshot.data }
  if (value === undefined) delete data[key]
  else data[key] = value
  await writeSettings($, snapshot, data)
  return true
}
