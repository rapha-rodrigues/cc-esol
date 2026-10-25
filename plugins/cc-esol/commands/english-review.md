---
description: Summarize recurring English mistakes from the learning log and suggest targeted drills
---

Read the learning log at `$ENGLISH_COACH_LOG` if that environment variable is set, otherwise at `~/.claude/english-learning/learning.md`.

If the file does not exist or is empty, say so and stop.

Otherwise produce two parts, in this order.

## Part 1: Analysis

Keep this part under 40 lines. No praise, no filler.

1. **Top recurring error patterns** (max 5), each with: the pattern, 2-3 real examples from the log (ORIGINAL vs NATIVE), and frequency.
2. **False cognates and first-language interference habits** spotted (e.g., false friends, article misuse, preposition transfer).
3. **Progress signal**: compare the last ~2 weeks of entries against older ones. Are the same mistakes repeating or fading? If the log is too short or too sparse to support a trend, say that instead of inventing one.
4. **Three targeted drills**: one-line exercises the user can practice by dictating prompts during normal work (e.g., "This week, phrase every request as an imperative without 'please can you'").

## Part 2: Every entry, reformatted

Then reproduce the log entries, newest first, with `NATIVE` and `WHY` nested under `ORIGINAL`:

```
**2026-09-15 · english-coach**
- ORIGINAL: Ill test sending these message here.
  - NATIVE: I'll test by sending a few messages here.
  - WHY:
    - "Ill" -> "I'll": missing apostrophe. "Ill" is a real word meaning sick, so this one changes the meaning rather than just looking sloppy.
    - "these message" -> "these messages": "these" is plural and needs a plural noun.
```

Rules for Part 2:

- Include **every** entry in scope. Do not summarize, merge, truncate or drop any of them, and do not add commentary between them.
- Keep the `ORIGINAL`, `NATIVE` and `WHY` text verbatim from the log. This part is a reformatting, not a rewrite.
- The `**date · project**` line above each entry comes from that entry's `##` heading.
- Part 2 has no line budget. Part 1's 40-line limit does not apply to it.
- Before Part 2, state how many entries it contains and the date range.

## Arguments

- **A topic** (`/english-review prepositions`): focus Part 1 entirely on that topic, and limit Part 2 to the entries whose `WHY` bullets touch it.
- **A number** (`/english-review 20`): limit Part 2 to the 20 newest entries. Part 1 still analyzes the whole log.
- **Both** (`/english-review prepositions 20`): apply both.
- **Neither**: Part 1 analyzes everything, Part 2 lists everything.

If the log holds more than 80 entries and no number was passed, list the 80 newest in Part 2 and say plainly how many were left out and which argument shows them.
