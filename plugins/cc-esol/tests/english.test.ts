import { describe, expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import {
  appendArgv,
  appendWinArgv,
  asEntryInput,
  basename,
  classify,
  coachingContract,
  ENGLISH_TOOL,
  MARKER_PREFIX,
  formatEntry,
  parseLog,
  resolveLogPath,
  reviewPrompt,
  reviewTail,
  timestamp,
  wrapLines,
} from '../hooks/lib/english'
import { isOwnWords, windowOf } from '../hooks/english'

const PLUGIN = 'cc-esol'
const HOME = '/home/someone'
const LOG = `${HOME}/.claude/english-learning/learning.md`
const PROJECT_DIR = `${HOME}/my-app`

// Invented sentences only: the real log never enters the repository.
const ENGLISH = 'I builded a endpoint for get the users datas'
const MIXED = 'please update the arquivo with the new names'
const PORTUGUESE = 'isso não funciona direito aqui'

const OK_RUN = { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false }

const pane = {
  component: 'Pane' as const,
  requestId: 'cc-esol',
  props: {
    title: 'esol',
    isFocused: true,
    bodyColumns: 56,
    placement: 'dock' as const,
    scroll: { offset: 0, bodyRows: 26 },
    view: {},
  },
}

const hint = {
  component: 'PromptHint' as const,
  props: { isDraft: false, isWorking: false, hint: '? for shortcuts' },
}

describe('english gate', () => {
  test('coaches English, skips another language even when it borrows English words', async () => {
    expect(classify(ENGLISH).skip).toBe(null)
    expect(classify('FOR-55 already landed merge and continue fix now').skip).toBe(null)
    // One word from the person's own language inside an English sentence: a vocabulary gap, still coached.
    const mixed = classify(MIXED)
    expect(mixed.skip).toBe(null)
    expect(mixed.enTokens).toBeGreaterThanOrEqual(5)
    // Portuguese with English loanwords: under the line.
    for (const text of [
      PORTUGUESE,
      'comite push e merge',
      'resolva as issues do PR #79',
      'Sim, pode seguir com a lista completa',
      'corrija. Mas vc rodou a suite e2e?',
      'Continue com as outras fases',
      '1. ok 2. sim 3. confirmo 4. sim',
      'branch t7 criada, pode iniciar',
    ]) {
      expect(classify(text).skip, text).toBe('not-english')
    }
  })

  test('the gate knows no particular language: Spanish and French are left alone too', async () => {
    expect(classify('arregla el error en el archivo de configuración').skip).toBe('not-english')
    expect(classify('corrige le bug dans le fichier de config').skip).toBe('not-english')
  })

  test('short prompts and slash commands are skipped', async () => {
    expect(classify('yes please').skip).toBe('short')
    expect(classify('').skip).toBe('short')
    expect(classify('/english-review prepositions 20').skip).toBe('command')
    expect(classify('continue with the next step', { minWords: 6 }).skip).toBe('short')
    expect(classify('continue with the next step', { minWords: 5 }).skip).toBe(null)
  })

  test('the cutoff is a setting', async () => {
    // 4 English words of 9: coached at 40, not at 50.
    const text = 'I builded a endpoint for get the users datas'
    expect(classify(text, { enCutoff: 40 }).skip).toBe(null)
    expect(classify(text, { enCutoff: 50 }).skip).toBe('not-english')
    // A numbered English prompt full of jargon clears the default; a Portuguese one with English words does not.
    expect(classify('1. what actually changed in the 0.3.0 version? 2. I want to update the README and the Makefile').skip).toBe(null)
    expect(classify('mas no final o script ficou apenas assim: [bloco de código com a correção]').skip).toBe('not-english')
  })

  test('a prompt in another script is not English, whatever English words it borrows', async () => {
    // "fix the bug" clears the word ratio on its own; the letters say otherwise.
    expect(classify('请修复登录页面的错误 fix the bug now').skip).toBe('not-english')
    expect(classify('ログインページのバグを直して please fix it').skip).toBe('not-english')
    expect(classify('исправь ошибку в файле please fix the file').skip).toBe('not-english')
    expect(classify('请修复登录页面的错误并运行测试', { minWords: 1 }).skip).toBe('not-english')
    // One word from another script inside an English sentence: a vocabulary gap, coached.
    expect(classify('please update the login 文件 with the new names and run the tests').skip).toBe(null)
    expect(classify('please update the login файл with the new names and run the tests').skip).toBe(null)
    // Accented Latin letters are Latin: a French or Portuguese prompt falls to the word ratio, as before.
    expect(classify('corrige l\'erreur dans le fichier de connexion').skip).toBe('not-english')
  })

  test('the contract: the rules, the marker and the tool description agree', async () => {
    const { rules, marker, toolDescription } = coachingContract('Spanish', LOG)
    expect(rules.startsWith('ESOL coaching rules')).toBe(true)
    expect(rules).toContain('a Spanish speaker training American English')
    expect(rules).toContain('written in Spanish or any other language or script, skip logging')
    expect(rules).toContain('do not announce that you are logging')
    expect(rules).not.toContain('heredoc')
    expect(rules).not.toContain('<english-coach>')
    const line = marker({ enTokens: 5, tokens: 9, enCutoff: 40 })
    expect(line.startsWith(`${MARKER_PREFIX} 5 of 9 words are English (cutoff 40%)`)).toBe(true)
    expect(line.includes('\n')).toBe(false)
    expect(line.length).toBeLessThan(200)
    // The description carries the rules whole and stays under what the model
    // is sent of a description; the rules and the marker name the tool; the
    // rules and the tool name the log; the marker and the tool name the rules.
    expect(toolDescription).toContain(rules)
    expect(toolDescription.length).toBeLessThan(4096)
    for (const text of [rules, line]) expect(text).toContain(ENGLISH_TOOL)
    for (const text of [rules, toolDescription]) expect(text).toContain(LOG)
    for (const text of [rules, toolDescription]) expect(text).toContain(MARKER_PREFIX)
    expect(line).toContain('ESOL coaching rules')
    expect(toolDescription).toContain('exactly once')
    expect(reviewPrompt('LOG', 'German')).toContain('kept by a German speaker')
    expect(reviewPrompt('LOG', 'German')).toContain('German-interference')
  })
})

describe('english log', () => {
  const entry = {
    ts: '2026-10-21 16:33',
    project: 'my-app',
    original: ENGLISH,
    native: 'I built an endpoint to fetch the user data',
    why: ['"builded" > "built" (irregular past)', '"a endpoint" > "an endpoint" (article before vowel sound)'],
  }

  test('formats an entry the way the log already holds them, and parses it back', async () => {
    const text = formatEntry(entry)
    expect(text).toBe(
      '\n## 2026-10-21 16:33 | project: my-app\n' +
        `- ORIGINAL: ${ENGLISH}\n` +
        '- NATIVE: I built an endpoint to fetch the user data\n' +
        '- WHY:\n' +
        '  - "builded" > "built" (irregular past)\n' +
        '  - "a endpoint" > "an endpoint" (article before vowel sound)\n',
    )
    const parsed = parseLog(text)
    expect(parsed.count).toBe(1)
    expect(parsed.last).toEqual({ ts: entry.ts, project: 'my-app', original: entry.original, native: entry.native, why: entry.why })
    expect(parsed.entries).toEqual([parsed.last])
    // Line breaks inside a field would break the bullet layout.
    const folded = formatEntry({ ...entry, original: 'line one\n  line two', why: [] })
    expect(folded).toContain('- ORIGINAL: line one line two\n- NATIVE: ')
    expect(folded.endsWith('- WHY:\n')).toBe(true)
  })

  test('an existing log: the count and the newest entry', async () => {
    const log = [
      formatEntry({ ...entry, ts: '2026-09-01 21:19', original: 'first', native: 'First' }),
      formatEntry({ ...entry, ts: '2026-09-04 13:32', project: 'website', original: 'second', native: 'Second' }),
      formatEntry({ ...entry, ts: '2026-10-21 16:33', original: 'third', native: 'Third' }),
    ].join('')
    const parsed = parseLog(log)
    expect(parsed.count).toBe(3)
    expect(parsed.last?.original).toBe('third')
    expect(parsed.entries.map(e => e.original)).toEqual(['first', 'second', 'third'])
    expect(parsed.entries[1]?.project).toBe('website')
    expect(parseLog('')).toEqual({ count: 0, last: null, entries: [] })
    expect(parseLog('\n# notes\nno entries here\n')).toEqual({ count: 0, last: null, entries: [] })
  })

  test('the tool input is trimmed, bounded and checked', async () => {
    expect(asEntryInput({ original: ' x ', native: ' y ', why: ['a', 7, '', ' b '] })).toEqual({ original: 'x', native: 'y', why: ['a', 'b'] })
    // One string of lines, or bullets with their dashes, as the model sometimes sends them.
    expect(asEntryInput({ original: 'x', native: 'y', why: '- a\n- b\n\n' })?.why).toEqual(['a', 'b'])
    expect(asEntryInput({ original: 'x', native: 'y', why: ['- a', '• b', 'c'] })?.why).toEqual(['a', 'b', 'c'])
    expect(asEntryInput({ original: 'x', native: 'y', why: 7 })).toBe(null)
    expect(asEntryInput({ original: 'x', native: '', why: [] })).toBe(null)
    expect(asEntryInput({ original: 'x', native: 'y' })).toBe(null)
    expect(asEntryInput(undefined)).toBe(null)
    const long = asEntryInput({ original: 'o'.repeat(3000), native: 'n', why: Array(20).fill('w'.repeat(400)) })
    expect(long?.original.length).toBe(2000)
    expect(long?.why).toHaveLength(12)
    expect(long?.why[0]?.length).toBe(300)
  })

  test('the log path comes from the environment or the home', async () => {
    expect(resolveLogPath(undefined, HOME)).toBe(LOG)
    expect(resolveLogPath('  ', HOME)).toBe(LOG)
    expect(resolveLogPath('/vault/English/learning.md', HOME)).toBe('/vault/English/learning.md')
    expect(basename('/home/someone/my-app/')).toBe('my-app')
    expect(basename('C:\\work\\my-app')).toBe('my-app')
  })

  test('the entry is appended through sh, as an argument, never rewritten', async () => {
    const argv = appendArgv('ENTRY', LOG)
    expect(argv[0]).toBe('sh')
    expect(argv[2]).toContain('>>')
    expect(argv[2]).not.toContain('ENTRY')
    expect(argv.slice(-2)).toEqual(['ENTRY', LOG])
  })

  test('timestamps read like the shell hook stamped them', async () => {
    expect(timestamp(new Date(2026, 9, 21, 7, 5))).toBe('2026-10-21 07:05')
  })

  test('text wraps into rows for the pane', async () => {
    expect(wrapLines('one two three four five', 9)).toEqual(['one two', 'three', 'four five'])
    expect(wrapLines('a\n\nb', 20)).toEqual(['a', '', 'b'])
    expect(wrapLines('x'.repeat(25), 10)).toEqual(['xxxxxxxxxx', 'xxxxxxxxxx', 'xxxxx'])
  })

  test('the review reads the log inline and keeps only the newest tail of a huge one', async () => {
    expect(reviewPrompt('LOG')).toContain('\nThe log:\n\nLOG')
    expect(reviewPrompt('LOG')).toContain('Brazilian Portuguese speaker')
    expect(reviewTail('short')).toBe('short')
    const huge = `${'x'.repeat(200_000)}\n## 2026-10-21 16:33 | project: a\n- ORIGINAL: tail\n`
    const tail = reviewTail(huge)
    expect(tail.startsWith('(older entries omitted)\n\n## 2026-10-21')).toBe(true)
    expect(tail.length).toBeLessThan(1000)
  })

  test('the list window fits the room, an open entry taking its own rows', async () => {
    const entries = Array.from({ length: 30 }, (_, i) => ({ ts: '2026-10-21 16:33', project: 'p', original: `o${i}`, native: `n${i}`, why: ['w'] }))
    expect(windowOf(entries, 0, null, 10, 56)).toEqual({ from: 0, to: 10 })
    expect(windowOf(entries, 25, null, 10, 56)).toEqual({ from: 25, to: 30 })
    // Open: a heading, the original, the native version and one reason: four rows.
    expect(windowOf(entries, 0, 0, 10, 56)).toEqual({ from: 0, to: 7 })
    expect(windowOf([], 0, null, 10, 56)).toEqual({ from: 0, to: 0 })
  })
})

// Stands in for the engine beneath the mod: the store, the drawing, the
// process and file system calls the English tab makes, and the session.
const engineBeneath = (on: On, entries: Record<string, unknown> = {}, log?: string) => {
  const runs: string[][] = []
  const invalidated: string[] = []
  const registered: string[] = []
  mock.clock(on)
  mock.store(on, entries)
  mock.env(on, { HOME })
  on('fs.stat', () => ({ value: { kind: 'file' as const, size: log?.length ?? 0, mtimeMs: 0, isLink: false } }))
  on('fs.read', () => ({ value: log ?? '' }))
  on('ui.render', ($, e) => $.ui.resolve(e).Text({ children: 'engine' }))
  on('ui.open', () => ({ value: { isPlaced: true as const } }))
  on('ui.close', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.cwd', () => ({ value: PROJECT_DIR }))
  on('tool.register', (_, e) => {
    registered.push(e.description)
    return { value: { tool: `mcp__${PLUGIN}__${e.name}` } }
  })
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('fs.exists', (_, e) => ({ value: log !== undefined && e.path === LOG }))
  on('process.run', (_, e) => {
    runs.push([...e.argv])
    return { value: OK_RUN }
  })
  on('prompt.submit', (_, e) => ({ text: e.text, context: e.context }))
  on('tool.describe', (_, e) => ({ description: e.description, isDeferred: true }))
  on('ui.invalidate', (_, e) => {
    invalidated.push(e.event)
    return { value: undefined }
  })
  return { runs, invalidated, registered }
}

const describeTool = ($: { tool: { describe: (input: { tool: string; description: string; provider: { plugin: string; tier: 'user' } }) => Promise<{ description: string; isDeferred?: boolean }> } }) =>
  $.tool.describe({ tool: ENGLISH_TOOL, description: 'as registered', provider: { plugin: PLUGIN, tier: 'user' } })

const isMarker = (c: string) => c.startsWith(MARKER_PREFIX)

const start = ($: { session: { start: (args: { cwd: string; surface: 'terminal'; isInteractive: true }) => Promise<unknown> } }) =>
  $.session.start({ cwd: PROJECT_DIR, surface: 'terminal', isInteractive: true })

describe('english hooks', () => {
  test("only the person's own words are coached", async () => {
    const composer = { origin: { kind: 'composer' } }
    expect(isOwnWords(composer)).toBe(true)
    expect(isOwnWords({ origin: { kind: 'plugin', asUser: true } })).toBe(true)
    expect(isOwnWords({ origin: { kind: 'plugin' } })).toBe(false)
    expect(isOwnWords({ origin: { kind: 'task-notification' } })).toBe(false)
    expect(isOwnWords({ ...composer, command: { name: 'help', args: '' } })).toBe(false)
    expect(isOwnWords({ ...composer, isMeta: true })).toBe(false)
  })

  test('the gate marker rides on English prompts while coaching is on, the rules do not', async ($, on) => {
    engineBeneath(on, { englishOn: true })
    await start($)

    const coached = await $.prompt.submit({ text: ENGLISH, wait: false, origin: { kind: 'composer' } })
    const markers = (coached.context ?? []).filter(isMarker)
    expect(markers).toHaveLength(1)
    expect(markers[0]).toMatch(/^ESOL gate: \d+ of \d+ words are English \(cutoff 30%\)\./)
    expect(markers[0]).toContain(ENGLISH_TOOL)
    expect(coached.context?.some(c => c.includes('apostrophes'))).toBe(false)

    const portuguese = await $.prompt.submit({ text: PORTUGUESE, wait: false, origin: { kind: 'composer' } })
    expect(portuguese.context ?? []).toHaveLength(0)

    const short = await $.prompt.submit({ text: 'yes please', wait: false, origin: { kind: 'composer' } })
    expect(short.context ?? []).toHaveLength(0)

    // A plugin's own prompt is not the person's words.
    const plugin = await $.prompt.submit({ text: ENGLISH, wait: false, origin: { kind: 'plugin', name: 'other' } })
    expect(plugin.context ?? []).toHaveLength(0)
  })

  test('nothing is coached while coaching is off (the default)', async ($, on) => {
    engineBeneath(on)
    await start($)
    const result = await $.prompt.submit({ text: ENGLISH, wait: false, origin: { kind: 'composer' } })
    expect(result.context ?? []).toHaveLength(0)
  })

  test("the rules travel in the tool's description, for the language chosen, registered and described alike", async ($, on) => {
    const { registered } = engineBeneath(on, { englishOn: true, englishNative: 'Spanish' })
    await start($)
    expect(registered).toHaveLength(1)
    expect(registered[0]).toContain('ESOL coaching rules')
    expect(registered[0]).toContain('a Spanish speaker training American English')
    expect(registered[0]).toContain(LOG)
    const described = await describeTool($)
    expect(described.description).toBe(registered[0])
    expect(described.isDeferred).toBe(false)
    // The composed system prompt is left alone: nothing of ours rides there.
    expect(registered[0]!.length).toBeLessThan(4096)
  })

  test('english_log waits behind ToolSearch while coaching is off, and each switch asks for it again', async ($, on) => {
    const { invalidated, runs } = engineBeneath(on)
    const appends = () => runs.filter(argv => argv[0] === 'sh' && (argv[2] ?? '').includes('>>'))
    await start($)
    expect((await describeTool($)).isDeferred).toBe(true)

    const corner = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint })
    const menu = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...pane })
    await corner.press({ key: 'esol-toggle' })
    await menu.press({ key: 'tab-esol' })
    await menu.press({ key: 'esol-settings' })

    await menu.press({ key: 'english-on' })
    expect(invalidated.filter(e => e === 'tool.describe')).toHaveLength(1)
    const listed = await describeTool($)
    expect(listed.isDeferred).toBe(false)
    expect(listed.description).toContain('ESOL coaching rules')
    // On, a coached prompt's entry lands.
    await $.prompt.submit({ text: ENGLISH, wait: false, origin: { kind: 'composer' } })
    const logged = (await $.tool.call({ tool: ENGLISH_TOOL, original: ENGLISH, native: 'I built an endpoint to fetch the user data', why: ['"builded" > "built"'] } as never)) as { result?: unknown }
    expect(String(logged.result)).toBe('Logged.')
    expect(appends()).toHaveLength(1)

    await menu.press({ key: 'english-off' })
    expect(invalidated.filter(e => e === 'tool.describe')).toHaveLength(2)
    expect((await describeTool($)).isDeferred).toBe(true)
  })

  test('english_log appends once per coached prompt, through sh, and refuses otherwise', async ($, on) => {
    const { runs } = engineBeneath(on, { englishOn: true })
    // Only the appends to the log: the session start also looks tools up on PATH.
    const appends = () => runs.filter(argv => argv[0] === 'sh' && (argv[2] ?? '').includes('>>'))
    await start($)
    const call = () =>
      $.tool.call({ tool: ENGLISH_TOOL, original: ENGLISH, native: 'I built an endpoint to fetch the user data', why: ['"builded" > "built"'] } as never)

    // Nothing pending: refused, nothing run.
    const refused = (await call()) as { result?: unknown }
    expect(String(refused.result)).toMatch(/pending/)
    expect(appends()).toHaveLength(0)

    await $.prompt.submit({ text: ENGLISH, wait: false, origin: { kind: 'composer' } })
    const logged = (await call()) as { result?: unknown }
    expect(String(logged.result)).toBe('Logged.')
    expect(appends()).toHaveLength(1)
    const argv = appends()[0]!
    expect(argv[0]).toBe('sh')
    expect(argv[argv.length - 1]).toBe(LOG)
    const entry = argv[argv.length - 2]!
    expect(entry).toContain('| project: my-app\n')
    expect(entry).toContain(`- ORIGINAL: ${ENGLISH}\n`)
    expect(entry).toContain('- NATIVE: I built an endpoint to fetch the user data\n')
    expect(entry).toContain('  - "builded" > "built"\n')

    // The pending stamp was consumed: a second call for the same prompt is refused.
    const again = (await call()) as { result?: unknown }
    expect(String(again.result)).toMatch(/pending/)
    expect(appends()).toHaveLength(1)
  })

  test('a failed append is reported to the model, not swallowed', async ($, on) => {
    mock.clock(on)
    mock.store(on, { englishOn: true })
    mock.env(on, { HOME })
    on('ui.render', ($, e) => $.ui.resolve(e).Text({ children: 'engine' }))
    on('ui.open', () => ({ value: { isPlaced: true as const } }))
    on('ui.close', () => ({ value: undefined }))
    on('session.start', (_, e) => ({ cwd: e.cwd }))
    on('session.cwd', () => ({ value: PROJECT_DIR }))
    on('tool.register', (_, e) => ({ value: { tool: `mcp__${PLUGIN}__${e.name}` } }))
    on('command.register', (_, e) => ({ value: { command: e.name } }))
    on('fs.exists', () => ({ value: false }))
    on('process.run', () => ({ value: { ...OK_RUN, exitCode: 1, stderr: 'sh: cannot create' } }))
    on('prompt.submit', (_, e) => ({ text: e.text, context: e.context }))
    await start($)
    await $.prompt.submit({ text: ENGLISH, wait: false, origin: { kind: 'composer' } })
    const failed = (await $.tool.call({ tool: ENGLISH_TOOL, original: ENGLISH, native: 'x', why: [] } as never)) as { result?: unknown }
    expect(String(failed.result)).toMatch(/Could not write the learning log/)
    // The stamp was given back: a retry is not refused as "nothing pending".
    const again = (await $.tool.call({ tool: ENGLISH_TOOL, original: ENGLISH, native: 'x', why: [] } as never)) as { result?: unknown }
    expect(String(again.result)).toMatch(/Could not write the learning log/)
  })

  test('one entry per prompt even when calls arrive together, and none from a subagent', async ($, on) => {
    const { runs } = engineBeneath(on, { englishOn: true })
    const appends = () => runs.filter(argv => argv[0] === 'sh' && (argv[2] ?? '').includes('>>'))
    await start($)
    await $.prompt.submit({ text: ENGLISH, wait: false, origin: { kind: 'composer' } })
    const agent = (await $.tool.call({ tool: ENGLISH_TOOL, agentId: 'a1', original: ENGLISH, native: 'x', why: [] } as never)) as { result?: unknown }
    expect(String(agent.result)).toMatch(/subagent/)
    expect(appends()).toHaveLength(0)
    const call = () => $.tool.call({ tool: ENGLISH_TOOL, original: ENGLISH, native: 'I built an endpoint to fetch the user data', why: ['x'] } as never)
    const results = (await Promise.all([call(), call(), call()])) as { result?: unknown }[]
    expect(results.filter(r => String(r.result) === 'Logged.')).toHaveLength(1)
    expect(results.filter(r => /pending/.test(String(r.result)))).toHaveLength(2)
    expect(appends()).toHaveLength(1)
  })

  test('on Windows the entry is appended through cmd from a sibling file, never by rewriting the log', async ($, on) => {
    mock.clock(on)
    mock.store(on, { englishOn: true })
    mock.env(on, { USERPROFILE: 'C:\\Users\\someone', OS: 'Windows_NT' })
    const writes: { path: string; text: string }[] = []
    const runs: string[][] = []
    on('ui.render', ($, e) => $.ui.resolve(e).Text({ children: 'engine' }))
    on('ui.open', () => ({ value: { isPlaced: true as const } }))
    on('ui.close', () => ({ value: undefined }))
    on('session.start', (_, e) => ({ cwd: e.cwd }))
    on('session.cwd', () => ({ value: 'C:\\Users\\someone\\my-app' }))
    on('tool.register', (_, e) => ({ value: { tool: `mcp__${PLUGIN}__${e.name}` } }))
    on('command.register', (_, e) => ({ value: { command: e.name } }))
    on('fs.exists', () => ({ value: false }))
    on('fs.read', () => ({ value: '' }))
    on('fs.write', (_, e) => {
      writes.push({ path: e.path, text: e.text })
      return { value: undefined }
    })
    on('process.run', (_, e) => {
      runs.push([...e.argv])
      return { value: OK_RUN }
    })
    on('prompt.submit', (_, e) => ({ text: e.text, context: e.context }))
    await start($)
    await $.prompt.submit({ text: ENGLISH, wait: false, origin: { kind: 'composer' } })
    const logged = (await $.tool.call({ tool: ENGLISH_TOOL, original: ENGLISH, native: 'I built an endpoint to fetch the user data', why: ['x'] } as never)) as { result?: unknown }
    expect(String(logged.result)).toBe('Logged.')
    // Matched by the tail: on a POSIX host a C:/ path may come back resolved.
    const LOG_TAIL = 'Users/someone/.claude/english-learning/learning.md'
    const entry = writes.find(w => w.path.includes(`${LOG_TAIL}.entry-`))
    expect(entry).toBeDefined()
    expect(entry!.text).toContain(`- ORIGINAL: ${ENGLISH}\n`)
    // The log itself is never written whole.
    expect(writes.some(w => w.path.endsWith(LOG_TAIL))).toBe(false)
    const append = runs.find(argv => argv[0] === 'cmd' && (argv[4] ?? '').includes('>>'))
    expect(append).toBeDefined()
    expect(append!.slice(0, 4)).toEqual(['cmd', '/d', '/s', '/c'])
    expect(append![4]).toContain('>> "C:\\Users\\someone\\.claude\\english-learning\\learning.md"')
    expect(append![4]).toContain('if not exist "C:\\Users\\someone\\.claude\\english-learning" mkdir')
    expect(appendWinArgv('/x/y.md.entry-1', '/x/y.md')[4]).toBe('if not exist "\\x" mkdir "\\x" & type "\\x\\y.md.entry-1" >> "\\x\\y.md" & del /q "\\x\\y.md.entry-1"')
  })

  test('the ESOL tab keeps its settings behind a chip, and Off there stops the coaching', async ($, on) => {
    engineBeneath(on, { englishOn: true })
    await start($)
    for (const surface of ['terminal', 'desktop'] as const) {
      const corner = await $.ui.mount({ plugin: PLUGIN, surface, ...hint })
      const menu = await $.ui.mount({ plugin: PLUGIN, surface, ...pane })
      await corner.press({ key: 'esol-toggle' })
      await menu.press({ key: 'tab-esol' })
      expect((await menu.find({ key: 'tab-esol' }))?.text).toMatch(/ESOL/)
      for (const key of ['esol-settings', 'esol-review']) expect(await menu.find({ key })).toBeDefined()
      expect(await menu.find({ key: 'english-on' })).toBeUndefined()
      expect(await menu.find({ type: 'Text', text: /Entries appear here/ })).toBeDefined()

      await menu.press({ key: 'esol-settings' })
      for (const key of ['esol-back', 'english-on', 'english-off', 'english-cutoff-40', 'english-min-4', 'esol-language']) {
        expect(await menu.find({ key })).toBeDefined()
      }
      // A Text is found by its words, not by a key: no log exists beneath this test.
      expect(await menu.find({ type: 'Text', text: /No entries yet/ })).toBeDefined()

      await menu.press({ key: 'english-off' })
      const off = await $.prompt.submit({ text: ENGLISH, wait: false, origin: { kind: 'composer' } })
      expect(off.context ?? []).toHaveLength(0)

      await menu.press({ key: 'english-on' })
      const back = await $.prompt.submit({ text: ENGLISH, wait: false, origin: { kind: 'composer' } })
      expect(back.context?.some(isMarker)).toBe(true)

      await menu.press({ key: 'esol-back' })
      expect(await menu.find({ key: 'esol-settings' })).toBeDefined()
      await corner.press({ key: 'esol-toggle' })
      await corner.unmount()
      await menu.unmount()
    }
  })

  test('the language is chosen from a list, Other typed in, and reaches the rules', async ($, on) => {
    const { registered } = engineBeneath(on, { englishOn: true })
    await start($)
    const corner = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint })
    const menu = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...pane })
    await corner.press({ key: 'esol-toggle' })
    await menu.press({ key: 'esol-settings' })
    expect((await menu.find({ key: 'esol-language' }))?.text).toMatch(/Portuguese \(Brazil\)/)
    await menu.press({ key: 'esol-language' })
    expect(await menu.find({ key: 'english-lang-spanish' })).toBeDefined()
    expect(await menu.find({ key: 'english-lang-name' })).toBeUndefined()
    await menu.press({ key: 'english-lang-spanish' })
    const rulesText = async () => (await describeTool($)).description
    expect(await rulesText()).toContain('a Spanish speaker')
    // A new language registers the tool again, with the rules for it.
    expect(registered[registered.length - 1]).toContain('a Spanish speaker')

    await menu.press({ key: 'english-lang-other' })
    expect(await menu.find({ key: 'english-lang-name' })).toBeDefined()
    await menu.input({ key: 'english-lang-name', text: 'Catalan' })
    expect(await rulesText()).toContain('a Catalan speaker')
    await menu.press({ key: 'esol-back' })
    expect((await menu.find({ key: 'esol-language' }))?.text).toMatch(/Catalan/)
  })

  const THREE = [
    { ts: '2026-09-01 21:19', project: 'my-app', original: 'first prompt with a mistake', native: 'First prompt with a mistake', why: ['capital letter'] },
    { ts: '2026-09-04 13:32', project: 'website', original: 'second prompt here', native: 'Second prompt here', why: ['capital letter'] },
    { ts: '2026-10-21 16:33', project: 'my-app', original: ENGLISH, native: 'I built an endpoint to fetch the user data', why: ['"builded" > "built"', '"datas" > "data"'] },
  ]

  test('the list shows the newest corrections first, and a press opens one', async ($, on) => {
    engineBeneath(on, { englishOn: true }, THREE.map(formatEntry).join(''))
    await start($)
    const corner = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint })
    const menu = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...pane })
    await corner.press({ key: 'esol-toggle' })
    await menu.press({ key: 'tab-esol' })
    const rows = (await menu.findAll({ type: 'Button' })).filter(b => b.key?.startsWith('esol:'))
    expect(rows.map(r => r.key)).toEqual(['esol:0', 'esol:1', 'esol:2'])
    expect(rows[0]?.text).toMatch(/10-21/)
    expect(rows[0]?.text).toMatch(/I builded a endpoint/)
    expect(await menu.find({ type: 'Text', text: /I built an endpoint to fetch/ })).toBeUndefined()

    await menu.press({ key: 'esol:0' })
    expect(await menu.find({ type: 'Text', text: /I built an endpoint to fetch the user data/ })).toBeDefined()
    expect(await menu.find({ type: 'Text', text: /"datas" > "data"/ })).toBeDefined()
    await menu.press({ key: 'esol:0' })
    expect(await menu.find({ type: 'Text', text: /I built an endpoint to fetch the user data/ })).toBeUndefined()
  })

  test('the review runs through the model inside the tab and is kept', async ($, on) => {
    engineBeneath(on, { englishOn: true }, THREE.map(formatEntry).join(''))
    const prompts: string[] = []
    on('session.model', () => ({ value: 'claude-opus-5-5' }))
    on('model.complete', (_, e) => {
      prompts.push(String((e as { prompt?: unknown }).prompt ?? ''))
      return { value: { isAnswered: true as const, text: '1. Articles: "a endpoint" vs "an endpoint" (2x).\n4. Drill: say the article out loud.', usage: {} } } as never
    })
    await start($)
    const corner = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...hint })
    const menu = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...pane })
    await corner.press({ key: 'esol-toggle' })
    await menu.press({ key: 'tab-esol' })
    await menu.press({ key: 'esol-review' })
    expect(prompts).toHaveLength(1)
    expect(prompts[0]).toContain(ENGLISH)
    expect(await menu.find({ type: 'Text', text: /Drill: say the article out loud/ })).toBeDefined()
    expect(await menu.find({ type: 'Text', text: /Opus 5\.5/ })).toBeDefined()
    await menu.press({ key: 'esol-back' })
    expect(await menu.find({ key: 'esol:0' })).toBeDefined()
    // The kept review opens without a new call.
    await menu.press({ key: 'esol-review' })
    expect(prompts).toHaveLength(1)
    expect(await menu.find({ key: 'esol-review-run' })).toBeDefined()
  })
})
