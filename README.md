<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/icon-dark.gif"><img src="docs/icon-light.gif" width="96" alt=""></picture></p>

# cc-esol

<p align="center"><b>English</b> · <a href="README.pt-BR.md">Português</a> · <a href="README.es.md">Español</a> · <a href="README.zh-CN.md">中文</a></p>

<p align="center">Listed on AIDojo: <a href="https://mods.aidojo.si/mods/rapha-rodrigues--cc-esol--cc-esol/"><img src="https://raw.githubusercontent.com/karanb192/awesome-claude-code-mods/main/badges/rapha-rodrigues--cc-esol--cc-esol-validates.svg" alt="validates"></a></p>

**Learn English from your daily Claude Code use.**

ESOL stands for *English for Speakers of Other Languages*. cc-esol is a passive English coach for [Claude Code](https://claude.com/claude-code): you keep prompting as you always do, and the English you type or dictate is corrected into a learning log you read when you want. It does the coaching and nothing else, so it sits beside whatever focus, theme or status line mods you already use.

## How it works

1. Click **💡 esol** under the prompt, open **Settings**, turn coaching **On** and pick your language.
2. Every prompt you write in English runs exactly as before. Claude, the model you are already talking to, writes a native version of it with the reasons to one local file: `~/.claude/english-learning/learning.md`.
3. The pane lists your corrections, newest first. **Review** has the model read the log and answer inside the pane: recurring patterns, interference from your language, whether they are fading, three drills.

<img src="docs/screenshots/esol-tab.png" alt="The ESOL pane: the latest corrections, one open with the original, the native version and the reasons" width="420">

Prompts in your own language are left alone, and so are slash commands, short replies ("yes", "continue") and prompts written in another script. Already-natural English is not logged. Missing apostrophes in contractions ("dont", "im", "thats") are ignored as typing speed; the word choices (its/it's, your/you're, their/they're) are coached. A single word from your language inside an English prompt is treated as a vocabulary gap: the entry gives you the English term.

## Speak it

The fastest way to practice is to dictate. Claude Code has voice dictation of its own (`/voice`), and the **Voice** button beside the lamp turns it on and off and shows its state. The coach corrects the English of the transcript, not your pronunciation; a word the recognizer probably misheard is tagged `[STT?]` instead of being counted as a grammar mistake. Keep the dictation language set to English in `/config`: speaking your own language with it produces garbled text, which nudges you toward English.

Voice dictation is Claude Code's feature, not this plugin's. It needs a claude.ai sign-in (it does not work with an API key, Bedrock, Vertex AI or Foundry), a local microphone (not over SSH or on the web) and Claude Code 2.1.69 or newer; transcription itself costs no tokens. Details in [Claude Code's voice dictation docs](https://code.claude.com/docs/en/voice-dictation).

## The pane

Click **💡 esol** under the prompt, or type `/esol`. **Tab** moves, **Enter** selects, **Esc** closes. The lamp and **Voice** sit beside whatever Claude Code and your other mods draw in that row. The pane follows Claude Code's theme, and closes when another mod's pane opens, so the sidebar shows one at a time.

Looking for the Focus band, the Model page, themes or the status line editor that cc-esol 1.x had? They are their own plugin now: [cc-focusdeck](https://github.com/rapha-rodrigues/cc-focusdeck).

## Privacy and cost

**Where your words go**

- The log is one local file, `~/.claude/english-learning/learning.md`, shared by every project by default. Set `ENGLISH_COACH_LOG` to move it, for instance into a synced notes folder. The plugin sends nothing anywhere on its own.
- The corrections are written by the model you are already talking to, as a call to the plugin's `english_log` tool that is part of your conversation. Your prompt and its correction travel through the same API as the rest of the session, nowhere else.
- **Review** sends the log (its newest 150,000 characters at most) to the model in one request and keeps the answer in the plugin's store, a JSON file at `~/.claude/plugins/store/cc-esol_*.json`. The `/cc-esol:english-review` command does the same in the transcript, listing every entry.
- To delete everything: remove the log file, and remove the store file to drop the kept review and the settings (coaching comes back Off). Uninstalling the plugin leaves the log in place.

**What it costs** (estimates, at about four characters per token)

- While coaching is On: about 700 tokens of rules in the `english_log` tool's description, sent with the tool list and cached; about 40 tokens beside each English prompt; and each correction is one tool call of roughly 150 to 300 output tokens that stays in the conversation. Off: nothing, the tool waits behind ToolSearch.
- Voice: nothing. It reads what Claude Code already emits and never adds to a request.
- For scale: every Claude Code request already carries tens of thousands of tokens of system prompt and tool definitions, so the fixed part is small; the corrections are what grows with use. Switching coaching on or off rewrites the prompt cache once.
- The plugin never changes Claude Code's system prompt: what it tells Claude rides in its own tool's description and beside your prompts.

## Requirements and install

Claude Code 2.1.299 or newer, on macOS, Linux or Windows. Developed and tested on 2.1.310.

```
claude plugin marketplace add rapha-rodrigues/cc-esol
claude plugin install cc-esol@esol --scope user
```

Run `/reload-plugins` or start a new session, then click **💡 esol** or type `/esol`. To update:

```
claude plugin marketplace update esol && claude plugin update cc-esol@esol
```

**Upgrading from 1.x:** your coaching settings and the learning log carry over. Focus, the Model page, themes and the status line moved to [cc-focusdeck](https://github.com/rapha-rodrigues/cc-focusdeck), which starts with its own settings: before updating, pick **Claude Code default** in the Themes page and settle any status line Uninstall or Put it back, then set them again there.

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

Twenty languages to pick from in the coach's settings, or **Other** with the name typed in. The language only tells the coach whose interference habits to look for; the gate that decides whether a prompt is English knows nothing about your language, so it works for any. The pane itself speaks English.

## Troubleshooting

- **No entries appear.** Open the pane's Settings and check that coaching is On. Hooks load at session start: restart Claude Code or run `/reload-plugins` after installing or updating.
- **A prompt in my language was coached.** Its English words reached the cutoff (loanwords like push, merge or fix count). Raise the cutoff in Settings. Claude also skips a message it can see is not English.
- **An English prompt was not coached.** Too few of its words are everyday English (short, jargon-heavy prompts). Lower the cutoff or the minimum words in Settings.
- **The Voice button says `/voice` is unavailable.** Sign in with a claude.ai account (`/login`); dictation does not work with an API key or a third-party provider.
- **The log keeps growing.** Nothing prunes it. Archive it with a rename; the next entry recreates the file. Past 4 MiB the pane stops previewing it and Review asks you to archive first.
- **A notice says a cc-esol hook was skipped.** Versions before 1.0.1 hooked two classic events that Claude Code's built-in guard (`cc-plugin-sec-default`) keeps from user plugins on Team and Enterprise logins, and the guard said so on every prompt and tool call. Update the plugin and the notice is gone; cc-esol works the same on every account.
- More in [docs/english-coach.md](docs/english-coach.md).

## Develop

```
claude --plugin-dir ./plugins/cc-esol
claude plugin validate ./plugins/cc-esol
claude plugin test ./plugins/cc-esol
```

Releases follow [docs/releasing.md](docs/releasing.md); changes are in [CHANGELOG.md](CHANGELOG.md).

## More for Claude Code

[cc-focusdeck](https://github.com/rapha-rodrigues/cc-focusdeck), by the same author: a Focus band with the task's progress above the prompt, model and effort controls, terminal themes and a status line editor. It installs beside cc-esol or on its own.

## License

[MIT](LICENSE).
