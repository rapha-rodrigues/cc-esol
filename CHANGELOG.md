# Changelog

Notable changes to cc-esol. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.0.0] - 2026-10-26

cc-esol is the English coach alone now, so it installs beside any focus, theme or status line mod
without overlapping it. Everything else moved to its own plugin,
[cc-focusdeck](https://github.com/rapha-rodrigues/cc-focusdeck).

### Removed

- The Model page, Focus and its band, Themes, the Status line page and Layout Editor, the Settings
  tab and the icon sets, with the `/esol` arguments `model`, `settings`, `themes`, `focus`,
  `statusline`, `editor` and `debug`. They are in cc-focusdeck, which keeps its own settings: those
  kept by cc-esol 1.x do not carry over.
- The Model button under the prompt, and the pane's tab strip.

### Changed

- The row under the prompt keeps what Claude Code and the other mods draw there, with the lamp and
  Voice beside it, where it used to draw the row over them.
- The pane opens straight on the coach, on the background of Claude Code's theme, and closes when
  another pane opens (cc-focusdeck's, any mod's), so the sidebar shows one pane, never a row of tabs.
- The coach's settings and the learning log carry over unchanged.

## [1.0.2] - 2026-10-25

### Fixed

- A write to `~/.claude/settings.json` (a theme, the status line, the start mode) compared the file
  with what the page had read before the replace took its lock, so an edit another program made in
  between could be overwritten. The comparison is now the replace's last step before the move,
  under its lock, and a file that changed is left as it is, a file created meanwhile included. It
  is best effort against writers that do not take cc-esol's lock, which can still land in the
  instant between that comparison and the move; Windows has no lock at all.
- The Layout Editor's Save goes ahead only while the ccstatusline config is still the text its
  candidate was built from. An `updatemessage` ccstatusline rewrote after that is kept, and Save
  says the file changed outside the editor, where it used to write the older message back.

### Changed

- The `esol` marketplace has a description, so `claude plugin validate .` passes with no warning.

## [1.0.1] - 2026-10-24

### Fixed

- On Team and Enterprise logins, every prompt and tool call printed a notice that a cc-esol classic
  hook was skipped: Claude Code's built-in guard keeps those events from user plugins. cc-esol hooks
  no classic event any more, so the notice is gone on every account.

### Removed

- The Model page's "Running in" row and the "now" mark on the start-mode chips: only the classic
  events carry the running permission mode. The start-mode chips, the effort and the model work as
  before, and shift+tab still switches the running session's mode.

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

[Unreleased]: https://github.com/rapha-rodrigues/cc-esol/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/rapha-rodrigues/cc-esol/compare/v1.0.2...v2.0.0
[1.0.2]: https://github.com/rapha-rodrigues/cc-esol/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/rapha-rodrigues/cc-esol/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/rapha-rodrigues/cc-esol/releases/tag/v1.0.0
