# Releasing

Every published change bumps the version. The three places that must agree: `version` in
`plugins/cc-esol/.claude-plugin/plugin.json`, the `CHANGELOG.md` entry, the git tag.

## Checklist

1. **Version.** Bump `version` in `plugins/cc-esol/.claude-plugin/plugin.json` (patch for fixes, minor
   for features, major for a change that breaks settings or the learning log's format).
2. **Changelog.** Move the `Unreleased` entries under `## [x.y.z] - YYYY-MM-DD`.
3. **Gate.** From the repository root:
   ```
   claude plugin validate plugins/cc-esol
   claude plugin test plugins/cc-esol
   ```
   No failures; the only warnings allowed are the plugin directory's.
4. **Scan.** No home paths, employer names, private emails or real learning-log text anywhere:
   ```
   git grep -n -i -E "/Users/|/home/[a-z]|@gmail|@hotmail" -- . ':!LICENSE'
   ```
   Every image under `docs/screenshots/` was staged with invented prompts.
5. **Candidate.** Install from the repository itself, before the tag, and run the live script below:
   ```
   claude plugin marketplace add rapha-rodrigues/cc-esol
   claude plugin install cc-esol@esol
   ```
6. **Tag and release.** Commit `Release x.y.z`, tag `vx.y.z`, push with tags, and create the GitHub
   release with the changelog section as its notes.
7. **Installed copies** update with `claude plugin update cc-esol@esol`.

## Live coaching script

With the candidate installed, coaching On and the language set, send these one at a time and read
the log (`~/.claude/english-learning/learning.md`) after each. Expected: an entry only where marked.

| Prompt | Entry |
|---|---|
| `Please list the files in this folder and tell me which ones are tests.` | no |
| `I builded a endpoint for get the users datas, can you check it?` | yes |
| `Make the tests more faster and explain me what you changed.` | yes |
| `isso não funciona direito, pode ver o que houve?` (or your own language) | no |
| `请修复登录页面的错误 fix the bug now` | no |
| `please update the arquivo with the new names and run the tests` | yes, the one foreign word named as a vocabulary gap |
| ```fix this: `for (const x of xs) { if (x == null) continue }` and run the tests``` | no, or an entry about the English around the code only |
| `yes` | no |
| `/help` | no |

Then set coaching Off and resend the second prompt: no entry, and no `english_log` call in the
transcript.

## Measuring the coaching cost

Run before a release that changes the rules, the marker or the tool description, so the README's
numbers stay measured, never estimated.

1. Start a session, coaching **Off**, send the ten prompts of the script above in order, run `/usage`
   and record input, output, cache-write and cache-read tokens.
2. Start a new session, coaching **On**, same prompts, same `/usage` reading.
3. Note the model and the Claude Code version. The difference is the cost of coaching for that run;
   what moves it is the number of entries (each one is a tool call carrying the original, the rewrite
   and the reasons) and the length of the prompts.
