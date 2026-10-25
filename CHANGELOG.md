# Changelog

Notable changes to cc-esol. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-24

### Added

- **ESOL tab.** Passive American English coaching for speakers of other languages: every prompt you
  type or dictate in English runs as usual, and Claude logs a nativized correction with the reasons to
  a local learning log. A list of the latest corrections, a Review that reads the log and writes an
  analysis inside the tab, and settings for the language (twenty listed, or typed in), the cutoff and
  the minimum length.
- **Coaching cost contract.** The rules travel in the `english_log` tool's own description while
  coaching is on (in the cached tool list, never in the history, and past Claude Code's built-in
  guard on Team and Enterprise logins); each coached prompt carries one line, the gate's measure;
  the tool waits behind ToolSearch while coaching is off. The gate ignores prompts written in
  another script.
- **Model page.** The model, the effort (low to max) and the permission mode for the session.
- **Focus.** A band above the prompt with the task's progress. Claude posts its plan to the band's
  own `focus_progress` tool, then only the number of each step as it starts, in the same message as
  that step's first tool call, and a turn that ends on the last step finishes the task with no call
  of its own; todos, tasks and an approved plan feed it too where the session has them. Only the
  running step's row is tinted, in the band's color; a done step keeps a green dot. The band stops
  one column short of the screen's edge, and the Nerd Font icons come from the Basic Multilingual
  Plane, so a glyph a terminal draws wider than measured cannot wrap a line and leave stray
  characters behind. The tool sits in the tool list while Focus is on and behind ToolSearch while off, and each
  prompt typed while on carries one line pointing at it. A feed of the last tool calls as Claude
  described them sits under the running step; a row opens on what its call ran and the first lines
  it printed, and the calls stay until the next prompt. Each step and each call carries one mark
  (the brain until it is done, a check then, a cross for a call that failed); a turn interrupted,
  refused or failed with no list says so instead of Done. Tool calls and tool results are hidden,
  except a failed or interrupted call; ctrl+o shows every call, and the run-in-background hint
  stays. Six band colors plus a custom one.
- **Themes.** Terminal color themes from terminalcolors.com, downloaded at runtime and applied to the
  terminal (OSC, or a Windows Terminal profile) and to Claude Code's own colors.
- **Status line page and Layout Editor.** Install, check and remove ccstatusline; edit its layout
  line by line with a live preview, a dry run before every save and timestamped backups.
- **Voice button.** Dictation on or off through Claude Code's own `/voice`, beside Model.
- **Settings.** The Focus switch with its color as a painted chip, the Theme block with the chosen
  theme as its chip, a ccstatusline chip, and the icon set (Nerd Font, Unicode, auto) last.
- **`/esol` command** and the corner button that open the pane on a tab.

[Unreleased]: https://github.com/rapha-rodrigues/cc-esol/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/rapha-rodrigues/cc-esol/releases/tag/v1.0.0
