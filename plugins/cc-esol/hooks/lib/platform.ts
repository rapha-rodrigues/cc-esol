// Where the person's files are and what the machine is. Pure wrappers over $.env.

import type { EngineInterface } from 'claude-code'

export async function homeDir($: EngineInterface) {
  const windowsHome = await $.env.get('USERPROFILE')
  const home = windowsHome ?? (await $.env.get('HOME')) ?? '.'
  return home.split('\\').join('/')
}

export async function isWindows($: EngineInterface) {
  const os = await $.env.get('OS')
  return os === 'Windows_NT'
}
