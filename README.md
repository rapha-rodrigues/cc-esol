<p align="center"><img src="docs/icon.svg" width="96" alt=""></p>

# cc-esol

<p align="center"><b>English</b> · <a href="README.pt-BR.md">Português</a> · <a href="README.es.md">Español</a> · <a href="README.zh-CN.md">中文</a></p>

**Learn English from your daily Claude Code use.**

ESOL stands for *English for Speakers of Other Languages*. cc-esol is a sidebar for [Claude Code](https://claude.com/claude-code) with a passive English coach: you keep prompting as you always do, and the English you type or dictate is corrected into a learning log you read when you want. The same sidebar holds Focus mode, terminal themes, model and effort controls, a status line editor and a voice toggle.

## How it works

1. Open the sidebar, turn coaching **On** in the ESOL tab and pick your language.
2. Every prompt you write in English runs exactly as before. Claude, the model you are already talking to, writes a native version of it with the reasons to one local file: `~/.claude/english-learning/learning.md`.
3. The tab lists your corrections, newest first. **Review** has the model read the log and answer inside the tab: recurring patterns, interference from your language, whether they are fading, three drills.

<img src="docs/screenshots/esol-tab.png" alt="The ESOL tab: the latest corrections, one open with the original, the native version and the reasons" width="420">

Prompts in your own language are left alone, and so are slash commands, short replies ("yes", "continue") and prompts written in another script. Already-natural English is not logged. Missing apostrophes in contractions ("dont", "im", "thats") are ignored as typing speed; the word choices (its/it's, your/you're, their/they're) are coached. A single word from your language inside an English prompt is treated as a vocabulary gap: the entry gives you the English term.

## Speak it

The fastest way to practice is to dictate. Claude Code has voice dictation of its own (`/voice`), and the **Voice** button beside the corner button turns it on and off and shows its state. The coach corrects the English of the transcript, not your pronunciation; a word the recognizer probably misheard is tagged `[STT?]` instead of being counted as a grammar mistake. Keep the dictation language set to English in `/config`: speaking your own language with it produces garbled text, which nudges you toward English.

Voice dictation is Claude Code's feature, not this plugin's. It needs a claude.ai sign-in (it does not work with an API key, Bedrock, Vertex AI or Foundry), a local microphone (not over SSH or on the web) and Claude Code 2.1.69 or newer; transcription itself costs no tokens. Details in [Claude Code's voice dictation docs](https://code.claude.com/docs/en/voice-dictation).

## Privacy and cost

**Where your words go**

- The log is one local file, `~/.claude/english-learning/learning.md`, shared by every project by default. Set `ENGLISH_COACH_LOG` to move it, for instance into a synced notes folder. The plugin sends nothing anywhere on its own.
- The corrections are written by the model you are already talking to, as a call to the plugin's `english_log` tool that is part of your conversation. Your prompt and its correction travel through the same API as the rest of the session, nowhere else.
- **Review** sends the log (its newest 150,000 characters at most) to the model in one request and keeps the answer in the plugin's store, a JSON file at `~/.claude/plugins/store/cc-esol_*.json`. The `/cc-esol:english-review` command does the same in the transcript, listing every entry.
- To delete everything: remove the log file, and remove the store file to drop the kept review and the settings (coaching comes back Off). Uninstalling the plugin leaves the log in place.

**What it costs**

- Themes, Model, Status line, Voice and Icons cost no tokens: they read what Claude Code already emits and never add to a request. Focus adds one line of under 250 characters beside a prompt of twelve words or more, or of several lines, while it is On, asking Claude to keep a todo list if the task takes several steps; shorter prompts carry nothing, and the todo calls Claude then makes are its own, as on any task.
- The plugin never changes Claude Code's system prompt: what it says to Claude rides in its own tool's description and beside your prompts.
- ESOL is not free. While coaching is On, the coaching rules travel in the description of the plugin's own `english_log` tool (under 4,096 characters with the rest of it), in the cached tool list of every request rather than in the history. Each coached prompt carries one extra line of about 160 characters, the gate's measurement. Each correction is one tool call whose arguments are your original, the rewrite and the reasons, and that call stays in the conversation like any other. With coaching Off nothing is added and the tool waits behind ToolSearch.
- Measured on a fixed script of ten prompts, coaching Off and On, same model and version: see [Measured cost](#measured-cost) below.

## The rest of the sidebar

Click **💡 esol** at the bottom right, or type `/esol` (also `/esol model`, `/esol settings`, `/esol themes`, `/esol focus`, `/esol statusline`, `/esol editor`). Three tabs: **ESOL**, **Model**, **Settings**. **Tab** moves, **Enter** selects, **Esc** closes. Beside the corner button, **Model** jumps to the Model page and **Voice** toggles dictation.

<img src="docs/screenshots/footer.png" alt="The footer: ccstatusline's three lines, then the corner button, Model and Voice on" width="720">

### Model

The model (Fable, Opus, Sonnet, Haiku, or Claude Code's default), the effort from low to max, and the permission mode new sessions start in. The model switch runs Claude Code's own `/model`; the effort applies to every request and is remembered; the running session's mode changes with **shift+tab**, the pick here is saved as `permissions.defaultMode`.

<img src="docs/screenshots/model.png" alt="The Model page: model chips, effort chips low to max, the running mode and the mode new sessions start in" width="420">

### Focus

A band above the prompt with the task's title, a clock, a progress bar and the steps, fed by what Claude Code already emits: the todo list, tasks, the plan approved in plan mode and every tool call as a "now" line under the running step. While Focus is On, a prompt long enough to be several steps carries one short line asking Claude to keep a todo list, so the band has steps to show; without a list it shows the tool call under way, the last one and their count. Tool calls and tool results are hidden from the transcript while Focus is On, so the band and Claude's replies are all you see. The turn's end with steps still pending pauses the band; your next prompt resumes it. `[–]` shrinks it to one line. Colors: blue, dark, light, green, pink, rainbow or a custom one.

<img src="docs/screenshots/focus-band.png" alt="The Focus band above the prompt: the task's title and clock, the progress bar, the steps with their clocks and the running tool call" width="720">

In the fullscreen layout, three open Claude Code issues ([#102893](https://github.com/anthropics/claude-code/issues/102893), [#104197](https://github.com/anthropics/claude-code/issues/104197), [#104462](https://github.com/anthropics/claude-code/issues/104462)) can make the wheel jump or the last row blink on hidden rows.

### Themes

Over a hundred terminal color themes from [terminalcolors.com](https://terminalcolors.com), downloaded once to `~/.claude/cc-esol/themes/`. Click one: Claude Code's colors follow (written as `~/.claude/themes/cc-esol.json` and set in `~/.claude/settings.json`; restart once the first time, live after that) and so does the terminal's background on Windows Terminal (for the session, then restored) and on terminals that take OSC colors (Ghostty, iTerm2, kitty, WezTerm, Terminal.app). **Claude Code default** puts the original colors back.

<img src="docs/screenshots/themes.png" alt="The Themes page: a searchable list of themes, each with its eight-color swatch, the kept one marked" width="420">

### Status line and Layout Editor

The Status line page installs, checks and removes [ccstatusline](https://github.com/sirmalloc/ccstatusline), a third-party status line. Install writes the `statusLine` block into `~/.claude/settings.json` (keeping what was there, for Uninstall) and a starter config where none exists; a status line you set yourself is shown and left alone. **Layout Editor** edits `~/.config/ccstatusline/settings.json` in place: lines, widgets, colors, powerline and layout, with a live preview drawn by your own status line command. Save dry-runs the candidate the same way, backs the file up and replaces it in one step, keeping everything it does not edit. Details in [docs/statusline.md](docs/statusline.md).

<p>
<img src="docs/screenshots/statusline.png" alt="The Status line page: Layout Editor, Check version, Remove the statusLine setting, and the ccstatusline disclaimer" width="420">
<img src="docs/screenshots/layout-editor.png" alt="The Layout Editor: the three lines, the widgets of one with their colors, the live preview" width="420">
</p>

### Settings

The Focus switch and its color, the theme as a chip with its name, the status line, and the icon set (Nerd Font, Unicode, or Auto: Nerd Font when your ccstatusline config draws powerline, so no font is ever installed or required).

<img src="docs/screenshots/settings.png" alt="The Settings tab: Focus On/Off, the icon set, and the rows for the Focus color, the theme and the status line" width="420">

## Requirements and install

Claude Code 2.1.299 or newer, on macOS, Linux or Windows. Developed and tested on 2.1.306.

```
claude plugin marketplace add rapha-rodrigues/cc-esol
claude plugin install cc-esol@esol --scope user
```

Run `/reload-plugins` or start a new session, then click **💡 esol** or type `/esol`. To update:

```
claude plugin marketplace update esol && claude plugin update cc-esol@esol
```

**Upgrading from a `--plugin-dir` checkout:** the plugin's store is keyed by where the plugin was installed from, so the marketplace install starts with default settings (coaching Off, no kept review). The learning log is untouched: it lives outside the store.

<details>
<summary><b>Install with an AI agent</b></summary>

Point your coding agent at this repository and ask it to install the plugin. Steps for the agent:

1. Run `claude --version`; it must be 2.1.299 or higher.
2. Run `claude plugin marketplace add rapha-rodrigues/cc-esol`.
3. Run `claude plugin install cc-esol@esol --scope user`.
4. Check `claude plugin list` shows `cc-esol` enabled, then tell the user to run `/reload-plugins`.

On Windows, use forward slashes in paths when running in Git Bash.

</details>

## Languages

Twenty languages to pick from in the ESOL settings, or **Other** with the name typed in. The language only tells the coach whose interference habits to look for; the gate that decides whether a prompt is English knows nothing about your language, so it works for any. The sidebar itself speaks English.

## Measured cost

Pending: the ten-prompt script in [docs/releasing.md](docs/releasing.md) is run with coaching Off and On before each release that touches the coaching texts, and the `/usage` readings are published here with the model and the Claude Code version.

## Troubleshooting

- **No entries appear.** Open the ESOL tab's Settings and check that coaching is On. Hooks load at session start: restart Claude Code or run `/reload-plugins` after installing or updating.
- **A prompt in my language was coached.** Its English words reached the cutoff (loanwords like push, merge or fix count). Raise the cutoff in Settings. Claude also skips a message it can see is not English.
- **An English prompt was not coached.** Too few of its words are everyday English (short, jargon-heavy prompts). Lower the cutoff or the minimum words in Settings.
- **The Voice button says `/voice` is unavailable.** Sign in with a claude.ai account (`/login`); dictation does not work with an API key or a third-party provider.
- **The log keeps growing.** Nothing prunes it. Archive it with a rename; the next entry recreates the file. Past 4 MiB the tab stops previewing it and Review asks you to archive first.
- **A notice says a cc-esol hook was skipped.** On a Team or Enterprise login, Claude Code's built-in guard (`cc-plugin-sec-default`) keeps user plugins away from the system prompt and from the classic hook events, and says so in the transcript. cc-esol is built on what passes, so coaching, the band and the rest work as described; the one thing lost there is the Model page's "Running in" row, which never learns the current permission mode (shift+tab still switches it). Nothing to configure.
- More in [docs/english-coach.md](docs/english-coach.md) and [docs/statusline.md](docs/statusline.md).

## Develop

```
claude --plugin-dir ./plugins/cc-esol
claude plugin validate ./plugins/cc-esol
claude plugin test ./plugins/cc-esol
```

Releases follow [docs/releasing.md](docs/releasing.md); changes are in [CHANGELOG.md](CHANGELOG.md).

## License and credits

[MIT](LICENSE).

[ccstatusline](https://github.com/sirmalloc/ccstatusline) is a separate project by Matthew Breedlove, MIT-licensed; nothing of it ships in this plugin, which only recommends it, installs it and edits its config. The terminal themes come from [terminalcolors.com](https://terminalcolors.com) and are downloaded at runtime, on your request; none of them ships here either.
