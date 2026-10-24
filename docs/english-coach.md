# English coach

Passive American English coaching for someone whose first language is not English, as the **ESOL** tab of the sidebar (English for Speakers of Other Languages). Every prompt you send (typed or voice-dictated) runs exactly as usual; Claude silently appends a nativized correction to a single learning file. No blocking, no interruptions, nothing in the reply.

## What it does

- On every prompt that is yours (typed or dictated, not a slash command, not a notification), the mod measures the text and, when it is English, attaches a one-line gate marker that Claude reads with the prompt; the coaching rules themselves travel in the `english_log` tool's description while coaching is on, never in the system prompt.
- Claude calls the mod's `english_log` tool with the original, a native version and the reasons; the mod appends one entry to the log. The file looks like this:

```markdown
## 2026-08-15 14:32 | project: my-app
- ORIGINAL: I builded a endpoint for get the users datas
- NATIVE: I built an endpoint to fetch the user data
- WHY:
  - "builded" > "built" (irregular past)
  - "a endpoint" > "an endpoint" (article before vowel sound)
  - "for get" > "to fetch" (infinitive of purpose)
  - "datas" > "data" (uncountable)
```

- Prompts in your own language are left alone. The gate counts **English words** (the, to, is, please, fix, file…) and coaches only when they are at least the cutoff share of the prompt (30% by default), so it works whatever your language is: a Portuguese or Spanish prompt borrowing a few English terms (push, merge, PR) stays under the line, while an English sentence carrying one word from your language is a vocabulary gap, coached, with the missing English term in its own `WHY` bullet. The gate is lexical; Claude is told it can be wrong and skips a message that is in fact in another language.
- Prompts that are already natural English are not logged, which keeps the file signal-dense.
- **Missing apostrophes in contractions are ignored** (`im`, `dont`, `thats`, `howd`, `theres`): typing speed, not a language gap. The word-choice pairs stay in scope, since those are grammar: `its`/`it's`, `your`/`you're`, `their`/`they're`/`there`, `whose`/`who's`, `were`/`we're`.
- Skipped automatically, at zero token cost: slash commands, prompts under the minimum word count ("yes", "continue"), prompts that are not English, and anything that is not your own words (notifications, messages from other sessions).
- Probable dictation (STT) errors are tagged `[STT?]` instead of being treated as grammar mistakes.
- The tab's **Review** reads the whole log in one model call (the session's model) and shows a compact analysis inside the tab: recurring patterns with real examples, false cognates and interference habits from your language, a progress signal over the last two weeks, three drills. The result is kept until you run it again. `/cc-esol:english-review` does the same in the transcript and then lists every entry; arguments: a topic (`/cc-esol:english-review prepositions`) narrows both parts, a number (`/cc-esol:english-review 20`) caps the listing at the 20 newest entries, and the two combine.

## The tab

Open the menu (click **💡 esol ▲** or type `/esol esol`) and pick **ESOL**. It opens on the corrections, newest first, one row each with the date and the start of what you wrote. Click a row (or Tab to it and press Enter) to open it: the original, the native version and the reasons, one per correction. The mouse wheel and the arrow keys scroll the list; the tab strip stays put.

**↗ Review** shows the last review, or runs one when there is none; **↻ Run again** on that page runs a fresh one. **⚙ Settings** holds:

| Setting | Default | What it does |
|---|---|---|
| English coaching | Off | On attaches the coaching block to your English prompts and lets `english_log` write. Off does both the other way, including refusing a write that was already requested. |
| Coach when English is at least | 30% | The cutoff. Lower it to coach heavily mixed prompts, raise it to skip sooner. A numbered English prompt full of jargon lands near 40%; a Portuguese or Spanish one borrowing English terms stays under 20%. |
| Minimum words | 4 | Prompts shorter than this are never coached. |
| Learning log | `~/.claude/english-learning/learning.md` | Where entries go, with the entry count and the newest date. Export `ENGLISH_COACH_LOG` to move it, for instance into a notes vault that syncs to your phone. |
| Your language | Portuguese (Brazil) | Twenty languages to pick from, or Other with a name typed in. The coaching block and the review speak of it (interference habits, false cognates). |

The settings and the last review are kept between sessions and survive `/clear`. The list shows the newest 200 entries; the log keeps them all.

## Permissions

Writing needs no permission: the mod appends the entry itself. The review command reads the log with Claude's Read tool, so when the log is outside your project, allow it once in `~/.claude/settings.json`:

```json
{
  "permissions": {
    "additionalDirectories": ["~/.claude/english-learning"]
  }
}
```

Adjust the path when `ENGLISH_COACH_LOG` points elsewhere.

## Usage with voice

1. Inside Claude Code, run `/voice` and grant microphone permission. In the VS Code integrated terminal, macOS attributes the request to VS Code: if no prompt appears, fully quit VS Code with Cmd+Q and record again.
2. In `/config`, keep the dictation language set to `en`. Speaking your own language with `en` set produces garbled transcriptions, which nudges you toward English.
3. Hold space to record, release to insert the transcription, edit if needed, press Enter. Typing keeps working alongside voice.

## Claude Desktop (same log file, best-effort)

Claude Desktop has no hooks, so coverage there is instruction-based: the model applies it most of the time, not deterministically. Claude Code remains the reliable capture channel.

Paste this into claude.ai Settings > Profile (user preferences), adjusting the note path to where your log lives:

```
English coaching: I am a <your language> speaker training American English.
When my message is written in English and contains grammar, word-choice, or
phrasing mistakes, AND a tool capable of writing to my notes vault or local
filesystem is available in this conversation: silently append one entry to the
note <path to your learning log>, formatted as:
## <date time> | project: desktop
- ORIGINAL: <my message verbatim>
- NATIVE: <natural American English version>
- WHY: <terse bullets, one per correction>
Rules: never mention the log or corrections in your reply; never block, delay,
or alter my actual request; skip messages under 4 words, messages that are
already natural English, and messages not written in English. A message that
is mostly English with a few words from my language is a vocabulary gap, not
another language: coach it and give me the English term. Ignore missing
apostrophes in contractions (im, dont, thats, howd) entirely, but do coach
its/it's, your/you're, their/they're/there and whose/who's, which are word
choices rather than typos. If no such tool is available, do nothing at all.
```

## Review ritual

The log is only worth what you extract from it. Suggested cadence: one weekly `/cc-esol:english-review`. Keeping the log in a synced notes folder makes it readable on your phone for passive review.

## Maintenance

- **Nothing prunes the log.** Every entry stays until you move it. At roughly 1 KB per entry this is a context cost long before it is a disk cost, since the review reads the whole file, and the tab stops previewing the log past 4 MiB. Archive with a plain rename:

  ```bash
  mv ~/.claude/english-learning/learning.md ~/.claude/english-learning/learning-$(date +%Y-%m).md
  ```

  The next entry recreates the file. Archived files are ignored by the review, which only reads the current log.
- **The log is not backed up by the mod.** Point `ENGLISH_COACH_LOG` at a synced folder if losing the history would bother you.
- Entries are appended with `sh` (`>>`), so two sessions logging at once never overwrite each other and an interrupted write never damages earlier entries. On Windows there is no `sh`: the entry goes to a sibling file and `cmd` appends it with `>>`, so the log is never read back or rewritten there either.

## Troubleshooting

- **No entries appearing**: open the tab's Settings and check that coaching is On; `/esol esol` opens the tab. Hooks load at session start, so restart Claude Code (or `/reload-plugins`) after installing or updating.
- **Claude announced the log or the corrections**: the instruction tells it not to; it occasionally does anyway. Nothing to configure.
- **Entries logged for prompts that were fine**: the "already natural" judgment is Claude's. Tighten rule 1 in `hooks/lib/english.ts` (`coachingContract`) if it over-logs.
- **Apostrophes still being corrected**: rule 2 in `coachingContract` covers them. Add the spelling you keep seeing to its list, but keep the `its`/`it's` style pairs out, since those are genuine word choices.
- **A prompt in my language got coached anyway**: its English words reached the cutoff (loanwords like push, merge or fix count). Raise the cutoff in Settings, or add missing English function words to `EN_WORDS` in `hooks/lib/english.ts`; that list leaves out words that are everyday words in other languages too (`a`, `as`, `do`, `no`, `me`), since a false hit costs a lesson. Claude also skips a message it can see is not English.
- **An English prompt was not coached**: too few of its words are on the English list (short, jargon-heavy prompts). Lower the cutoff in Settings.
- **The tool answered "No coached prompt is pending"**: `english_log` writes once per coached prompt, only after the coaching block was attached. A second call for the same prompt, or a call Claude makes on its own, is refused by design.
- **The review failed**: the message names the cause (no log yet, an empty log, a log over 4 MiB to archive first, an API error). Run again with **↻ Run again**; each run is one model call billed to your session like any other.
