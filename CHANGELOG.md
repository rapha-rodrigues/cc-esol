# Changelog

Notable changes to cc-esol. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
- **Focus.** A band above the prompt with the task's progress, fed by Claude's own todos, tasks, an
  approved plan and a feed of the last four tool calls as Claude described them (the ones done
  dimmed, the one under way with its clock, their count in the header); while on, a prompt long
  enough to be several steps carries one short line asking Claude to open a todo list (only in a
  session that has a todo tool, which it names), the todo tools' descriptions carry the same note,
  the brain marks each step (each call when there is no list), and tool calls and tool results are
  hidden. Six band colors plus a custom one.
- **Themes.** Terminal color themes from terminalcolors.com, downloaded at runtime and applied to the
  terminal (OSC, or a Windows Terminal profile) and to Claude Code's own colors.
- **Status line page and Layout Editor.** Install, check and remove ccstatusline; edit its layout
  line by line with a live preview, a dry run before every save and timestamped backups.
- **Voice button.** Dictation on or off through Claude Code's own `/voice`, beside Model.
- **Settings.** The Focus switch with its color as a painted chip, the Theme block with the chosen
  theme as its chip, a ccstatusline chip, and the icon set (Nerd Font, Unicode, auto) last.
- **`/esol` command** and the corner button that open the pane on a tab.
