# cc-esol: listing and launch guide

Step by step for every catalogue, list and community worth submitting cc-esol to, except Anthropic's
official plugin directory, which is deferred. Researched on 2026-10-24; rules change, so reread each
target's own page before submitting.

## At a glance

| When | Target | How it gets in | Section |
|---|---|---|---|
| Now | Repository prep | Topics, validation, demo | [0](#0-prepare-the-repository) |
| Now | mods.aidojo.si | Automatic scan, or a seed PR | [1](#1-modsaidojosi) |
| Now | hamzafer/claude-code-mods | PR: README row + `community.json` | [2](#2-hamzaferclaude-code-mods) |
| Now | claudemods.chat | GitHub issue form | [3](#3-claudemodschat) |
| Now | claudemods.dev | Web form | [4](#4-claudemodsdev) |
| Now | claudemod.com | Web form, GitHub sign-in | [5](#5-claudemodcom) |
| Now | modsforclaude.com | Account, then submit | [6](#6-modsforclaudecom) |
| Week 1 and 2 | Reddit, Hacker News, TabNews | Posts | [7](#7-community-posts) |
| From 2026-11-07 | awesome-claude-code | Web issue form, by hand | [8](#8-awesome-claude-code-from-2026-11-07) |
| After the aidojo listing and the demo | aidojo Featured | Nomination form | [9](#9-aidojo-featured-nomination) |
| Every release | All of the above | Keep listings current | [10](#10-after-each-release) |

---

## 0. Prepare the repository

- [ ] **Topics.** The aidojo three-hourly scan looks for these topics on repos pushed since its last
  search. `claude-code-plugin` is already set.
  ```
  gh repo edit rapha-rodrigues/cc-esol --add-topic claude-code-mod --add-topic claude-code-mods
  ```
- [ ] **Validate.** aidojo leaves out a repo that fails validation, has a failing marketplace, or
  carries a UI compatibility warning.
  ```
  claude plugin validate plugins/cc-esol
  claude plugin validate .
  ```
  For a UI warning, inspect the strings the scan links and any value passed to `next()` as
  `props.text`; rewrite them as plain text and retest in an interactive session.
- [ ] **Demo recording.** 20 to 40 seconds: coaching On, an English prompt with mistakes, the entry
  opening in the ESOL tab, then the Focus band during a task. Use invented prompts only, as
  `docs/releasing.md` already requires for screenshots. The Featured nomination requires a real
  recording or screenshot, and every post below works better with one. Save it as a GIF or MP4 and
  link it from the README.
- [ ] **Keep committing.** awesome-claude-code requires active development across its 14-day window,
  not only a first day of commits.
- [ ] Optional: a social preview image in GitHub, Settings, Social preview (1280x640), so links
  shared on Reddit, HN and X show a card instead of the default.

---

## 1. mods.aidojo.si

Catalogue site: <https://mods.aidojo.si/>. Source repo:
[karanb192/awesome-claude-code-mods](https://github.com/karanb192/awesome-claude-code-mods) (742 stars).
Inclusion in the full catalogue is open; the README's Featured section is a separate selection
(section 9).

### Path A: let the scanner find it (try first)

- [ ] Finish section 0 (topics), then push any commit.
- [ ] Wait up to 48 hours. The three-hourly scan picks up repos with the `claude-code-mod` topic
  after their next push; the daily code search also matches any `hooks/hooks.json` with a `modules`
  key. The entry appears once the maintainer merges the generated scan PR.
- [ ] Check whether it landed:
  ```
  gh api repos/karanb192/awesome-claude-code-mods/contents/data/repos.txt --jq .content | base64 -d | grep -i cc-esol
  ```
  or search for cc-esol on the site.

### Path B: seed pull request (if Path A has not landed in 48 hours)

- [ ] Fork and branch:
  ```
  gh repo fork karanb192/awesome-claude-code-mods --clone
  cd awesome-claude-code-mods
  git checkout -b add-cc-esol-seed
  ```
- [ ] Edit `data/seeds.txt` by hand: insert `rapha-rodrigues/cc-esol` on its own line in
  alphabetical order ignoring case. On 2026-10-24 that is between `RadTech-Solutions/modwall` and
  `reporails/arcade`. Do not append at the end: that conflicts with every other open seed PR.
- [ ] Do not touch `README.md` or anything between the `<!-- scan:start -->`, `<!-- builtin:start -->`
  or `<!-- stats:start -->` markers; it is generated.
- [ ] Run the checks:
  ```
  npm ci
  npm test
  npm run lint
  ```
- [ ] Commit and open the PR, titled like the open ones:
  ```
  git commit -am "Add rapha-rodrigues/cc-esol to seeds"
  git push -u origin add-cc-esol-seed
  gh pr create --title "Add rapha-rodrigues/cc-esol to seeds" --body "Seed for cc-esol, a sidebar mod with an English coach, a Focus band, terminal themes and model controls. Validated with claude plugin validate on Claude Code 2.1.306."
  ```
- [ ] After the merge, the publish workflow scans the seed and comments on the PR with the new page.
  If the seed is left out (failed clone, failed validation, UI warning, possible duplicate), the run
  summary says why; fix the repo and it retries every three hours.
- If Path A lands while the PR is open, close the PR.

### After the listing

- [ ] Open the mod's page on mods.aidojo.si, copy the badge snippet at the bottom (`reach` and
  `validates`) and paste it at the top of `README.md`. Copy it from the page rather than building it:
  the file name can differ from the plugin name.
- [ ] If the access footprint looks wrong, open an issue there with your own
  `claude plugin validate` output.

---

## 2. hamzafer/claude-code-mods

Repo: [hamzafer/claude-code-mods](https://github.com/hamzafer/claude-code-mods) (380 stars). Its
"Community mods" table lists 12 mods from other authors, and the same list feeds the
`npx claude-code-mods` installer checklist, so each entry gets real visibility.

- [ ] Fork and branch:
  ```
  gh repo fork hamzafer/claude-code-mods --clone
  cd claude-code-mods
  git checkout -b add-cc-esol
  ```
- [ ] In `README.md`, section `## 🤝 Community mods`, add this row as the last row of the table, above
  the line "Built one? Open a PR that adds a row.":
  ```
  | 🎓 | **[cc-esol](https://github.com/rapha-rodrigues/cc-esol)** by [@rapha-rodrigues](https://github.com/rapha-rodrigues) | An English coach for non-native speakers in a sidebar: Claude logs a native rewrite of each English prompt, with the reasons, to a local learning log. Also a Focus progress band, terminal themes and model controls | `claude plugin marketplace add rapha-rodrigues/cc-esol` then `claude plugin install cc-esol@esol` |
  ```
- [ ] In `community.json`, append this object as the last item of `mods`:
  ```json
  {
    "name": "cc-esol",
    "marketplace": "esol",
    "repo": "rapha-rodrigues/cc-esol",
    "author": "rapha-rodrigues",
    "url": "https://github.com/rapha-rodrigues/cc-esol",
    "description": "An English coach for non-native speakers in a sidebar: Claude logs a native rewrite of each English prompt, with the reasons, to a local learning log. Also a Focus progress band, terminal themes and model controls",
    "tags": ["pane", "band", "command"]
  }
  ```
  The test enforces: the description is plain text (no backticks, `**` or links), the tags come from
  `band`, `pane`, `statusline`, `guard`, `toast`, `command`, the repo owner equals `author`, and the
  README row says `marketplace add rapha-rodrigues/cc-esol` and `install cc-esol@esol`.
- [ ] Run the tests:
  ```
  node --test test/*.test.mjs
  ```
- [ ] Commit and open the PR:
  ```
  git commit -am "Add cc-esol to Community mods"
  git push -u origin add-cc-esol
  gh pr create --title "Add cc-esol to Community mods" --body "cc-esol, in its own marketplace (esol): a sidebar with an English coach for non-native speakers, a Focus progress band, terminal themes and model controls. Tested on Claude Code 2.1.306."
  ```

---

## 3. claudemods.chat

Site: <https://claudemods.chat/>. Repo: [omarcevi/claudemods](https://github.com/omarcevi/claudemods).
A maintainer reviews each submission, a bot opens the PR, and its marketplace installs each mod pinned
to the commit they reviewed.

- [ ] Open the form in the browser:
  <https://github.com/omarcevi/claudemods/issues/new?template=submit.yml>
- [ ] Fill it in:

  | Field | Value |
  |---|---|
  | Name | `cc-esol` |
  | URL | `https://github.com/rapha-rodrigues/cc-esol` |
  | Type | the `mod` option (panes, bands, status lines, toasts, guards) |
  | Author | `rapha-rodrigues` |
  | What does it do? (140 max) | `Sidebar mod that logs native rewrites of your English prompts to a local learning log, plus a Focus band, themes and model controls.` (132) |
  | Tags | `english, learning, sidebar, focus, themes` |
  | Install command | leave empty, so it goes into their marketplace |

- [ ] Tick "Add it to the claudemods marketplace": the repo has `.claude-plugin/marketplace.json` at
  its root. Tick "It's public and open source".
- [ ] Submit and watch the issue for the maintainer's reply.

---

## 4. claudemods.dev

Site: <https://claudemods.dev/en/>, about 1,500 listings.

- [ ] Open <https://claudemods.dev/en/submit>.
- [ ] Fill in:
  - Project URL: `https://github.com/rapha-rodrigues/cc-esol`
  - X / GitHub handle: `rapha-rodrigues` (credited as the discoverer)
  - Additional notes: `Claude Code mod (plugin with hooks modules). Sidebar with an English coach for non-native speakers, a Focus progress band, terminal themes, model and effort controls and a ccstatusline layout editor. MIT. Install: claude plugin marketplace add rapha-rodrigues/cc-esol, then claude plugin install cc-esol@esol.`
  - Email: optional, only for notifications.
- [ ] Submit. An automatic review publishes scans with confidence of 0.85 or more; the rest go to
  manual review.

---

## 5. claudemod.com

Site: <https://www.claudemod.com/>, about 170 listings, a Mods category.

- [ ] Open <https://www.claudemod.com/submit> and sign in with GitHub. The form fields only show
  after sign-in, so they were not checked for this guide.
- [ ] Category: Mods. Use the one-sentence and the short descriptions from the
  [copy bank](#copy-bank).

---

## 6. modsforclaude.com

Site: <https://modsforclaude.com/>. Each listing shows its source, a pinned commit and a review
status.

- [ ] Create an account at <https://modsforclaude.com/register/> with "Sign up with GitHub".
- [ ] Submit the mod from your account. The review is tied to an exact commit, so submit after the
  version you want reviewed is pushed.

---

## 7. Community posts

Goal: stars and real users before the curated lists. awesome-claude-code also accepts 100 stars in
place of the 14-day rule. Space the posts a few days apart, answer every comment, and lead with the
English coach; the rest of the sidebar comes second.

- [ ] **r/ClaudeCode.** Read the sidebar rules first (they were not readable for this guide).
- [ ] **r/ClaudeAI.** A project showcase on the feed requires at least 50 total karma (mod note of
  April 2026); below that, post in the pinned "Built with Claude" megathread. Read its Rule 7 for the
  showcase requirements.
- [ ] **Show HN** on <https://news.ycombinator.com/submit>. The project must be something people can
  try with no sign-up. Title it `Show HN: cc-esol, an English coach for non-native speakers inside Claude Code`,
  link the GitHub repo, and add a first comment with the background and the token cost. Do not ask
  anyone for upvotes.
- [ ] **TabNews** (<https://www.tabnews.com.br/>), in Portuguese.
- [ ] Optional: Spanish and Chinese developer communities, since the README has both translations.
  Language-learning subreddits only if their rules allow posts about your own tools.

### Reddit draft

Title: `I built a Claude Code mod that turns my English prompts into a learning log`

```
English is not my first language, and I write most of my prompts in it. cc-esol is a Claude Code
mod that turns that into practice: every English prompt runs as usual, and Claude writes a native
version of it, with the reasons, to a local Markdown log. A sidebar tab lists the corrections, and
Review reads the log for recurring patterns and suggests drills.

- Local: the log is one file in ~/.claude/english-learning/. Corrections travel through your own
  session, nowhere else.
- Cost while on: about 700 cached tokens for the tool, about 40 per English prompt, and 150 to 300
  output tokens per correction. Off costs nothing.
- Works with /voice: words the recognizer probably misheard are tagged [STT?] instead of counted
  as mistakes.

The same sidebar has a Focus progress band, terminal themes, model and effort controls, and a
ccstatusline layout editor.

Install:
claude plugin marketplace add rapha-rodrigues/cc-esol
claude plugin install cc-esol@esol

Repo: https://github.com/rapha-rodrigues/cc-esol

Feedback welcome, especially from other non-native speakers.
```

### TabNews draft

Título: `Criei um mod para o Claude Code que transforma meus prompts em inglês em aula`

```
Escrevo quase todos os meus prompts em inglês, e o inglês não é minha primeira língua. O cc-esol é
um mod para o Claude Code que aproveita isso: cada prompt em inglês roda normalmente, e o Claude
grava uma versão nativa dele, com os motivos de cada correção, num log Markdown local. Uma aba na
barra lateral lista as correções, e o Review lê o log, aponta os padrões que se repetem e sugere
exercícios.

- Tudo local: o log é um arquivo em ~/.claude/english-learning/.
- Custo ligado: cerca de 700 tokens em cache para a ferramenta, uns 40 por prompt em inglês e de
  150 a 300 tokens de saída por correção. Desligado não custa nada.
- Funciona com o /voice: palavras que o reconhecimento provavelmente errou ficam marcadas como
  [STT?] em vez de contar como erro.

Instalação:
claude plugin marketplace add rapha-rodrigues/cc-esol
claude plugin install cc-esol@esol

Repositório: https://github.com/rapha-rodrigues/cc-esol
```

---

## 8. awesome-claude-code (from 2026-11-07)

List: [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)
(56k stars). Read [CONTRIBUTING.md](https://github.com/hesreallyhim/awesome-claude-code/blob/main/CONTRIBUTING.md)
again before submitting.

- [ ] **Eligibility.** 14 days since the first commit on the default branch with commits after the
  first day, or 100 stars. The first commit is 2026-10-23 22:37 UTC, so the window closes
  2026-11-06 22:37 UTC: submit on 2026-11-07 or later. A submission that fails the rule is closed
  automatically.
- [ ] **Read the list yourself**, especially the Mods category, and confirm cc-esol is distinct from
  what is there. The form makes you attest to it.
- [ ] **Submit by hand in the browser.** No PR, no `gh` CLI, and no agent: the maintainer restricts
  accounts that do otherwise. One resource at a time.
  <https://github.com/hesreallyhim/awesome-claude-code/issues/new?template=recommend-resource.yml>

  | Field | Value |
  |---|---|
  | Display Name | `cc-esol` |
  | Category | `Mods` |
  | Link | `https://github.com/rapha-rodrigues/cc-esol` |
  | Author Name | `Rapha Rodrigues` |
  | Author Link | `https://github.com/rapha-rodrigues` |
  | Description | the long description in the [copy bank](#copy-bank) (306 characters; the form takes 10 to 500, descriptive, no emojis, does not address the reader) |

- [ ] **Checklist.** Tick the first five only if they are true. **Leave the last box unchecked**:
  it exists to catch people who tick everything.
- [ ] A bot validates the form and comments. Review is best effort, with no deadline and no
  guarantee.
- [ ] If accepted, add the badge to `README.md`:
  ```
  [![Mentioned in Awesome Claude Code](https://awesome.re/mentioned-badge.svg)](https://github.com/hesreallyhim/awesome-claude-code)
  ```

---

## 9. aidojo Featured nomination

After the catalogue listing (section 1) and the demo (section 0). The maintainer picks Featured
entries; self-nominations are welcome with the relationship disclosed.

- [ ] Open <https://github.com/karanb192/awesome-claude-code-mods/issues/new?template=featured-nomination.yml>.
- [ ] **Mod URL:** `https://github.com/rapha-rodrigues/cc-esol`
- [ ] **What task does it help with?**
  ```
  Practicing English while coding, for developers who are not native speakers. Every English prompt
  runs unchanged; Claude logs a native rewrite with the reasons to a local Markdown file, and the
  ESOL tab lists the entries and reviews them for recurring patterns and drills. With /voice it also
  corrects dictated prompts, tagging probable recognition errors as [STT?].
  ```
- [ ] **Evidence that it works:** the demo link, then:
  ```
  Install:
  claude plugin marketplace add rapha-rodrigues/cc-esol
  claude plugin install cc-esol@esol
  then /reload-plugins and /esol.
  Checked on Claude Code <version>, macOS, <terminal>.
  Limitations: voice dictation needs a claude.ai sign-in and a local microphone. In the fullscreen
  layout, three open Claude Code issues (#102893, #104197, #104462) can make the wheel jump or the
  last row blink.
  ```
- [ ] **Access details:**
  ```
  All local unless noted.
  Writes: ~/.claude/english-learning/learning.md (the log; ENGLISH_COACH_LOG moves it), the plugin
  store ~/.claude/plugins/store/cc-esol_*.json, and, only when picked in the sidebar,
  ~/.claude/settings.json (theme, statusLine, permissions.defaultMode), ~/.claude/themes/cc-esol.json
  and ~/.config/ccstatusline/settings.json (backed up before each save). On Windows Terminal it
  changes the background for the session and restores it.
  Runs: npx ccstatusline, only when the user installs or previews ccstatusline from the Status line
  page; Claude Code's own /model and /voice.
  Network: terminalcolors.com, when the user opens Themes; the themes are cached in
  ~/.claude/cc-esol/themes/.
  Model: corrections are tool calls in the user's own session; Review sends the newest 150,000
  characters of the log at most, in one request.
  Catalogue entry: <link to the cc-esol page on mods.aidojo.si>
  ```
- [ ] **Your relationship to the mod:** `Author`

---

## 10. After each release

- [ ] aidojo: the nightly scan follows new commits on the default branch and refreshes the footprint
  and badges. Nothing to do unless a warning appears.
- [ ] claudemods.chat and modsforclaude.com pin a reviewed commit. Check whether the listing moved to
  the new version; if not, ask for a bump in an issue or from the account.
- [ ] hamzafer/claude-code-mods installs from your marketplace, so updates reach it without a PR.
  Update the row only if the description changes.

---

## Not in this plan, and why

| Target | Reason |
|---|---|
| Anthropic's official directory | Deferred by choice. When you come back to it: the README must exist inside `plugins/cc-esol/`; `hooks/pages/model.tsx` can save `bypassPermissions` as `permissions.defaultMode`, which the security scan looks for; `hooks/lib/ccstatusline.ts` runs `ccstatusline@latest` unpinned; submit from a personal Pro or Max account so the listing is yours. |
| composio-community/awesome-claude-plugins | Last push 2026-07-26, 474 open issues, 2 merges in its last 30 closed PRs. |
| ccplugins/awesome-claude-code-plugins | Last push 2026-08-12, no recent merges. |
| rohitg00/awesome-claude-code-toolkit | Last push 2026-05-12. |
| travisvn/awesome-claude-skills | Skills only. |
| jqueryscript/awesome-claude-code | Active, but no merges in its last 20 closed PRs and contribution guidelines "Under Construction". |
| quemsah/awesome-claude-plugins | Indexes repos on its own and shows the top 100 by stars; nothing to submit. |

---

## Copy bank

**One sentence, 132 characters:**
```
Sidebar mod that logs native rewrites of your English prompts to a local learning log, plus a Focus band, themes and model controls.
```

**Short description, 306 characters:**
```
A Claude Code mod for non-native English speakers: Claude logs a native rewrite of each English prompt, with the reasons, to a local learning log that a sidebar tab lists and reviews. The same sidebar adds a Focus progress band, terminal themes, model and effort controls, and a ccstatusline layout editor.
```

**Install:**
```
claude plugin marketplace add rapha-rodrigues/cc-esol
claude plugin install cc-esol@esol
```

---

## Sources

- [awesome-claude-code CONTRIBUTING.md](https://github.com/hesreallyhim/awesome-claude-code/blob/main/CONTRIBUTING.md) and its [issue form](https://github.com/hesreallyhim/awesome-claude-code/blob/main/.github/ISSUE_TEMPLATE/recommend-resource.yml)
- [awesome-claude-code-mods contributing.md](https://github.com/karanb192/awesome-claude-code-mods/blob/main/contributing.md)
- [claude-code-mods CONTRIBUTING.md](https://github.com/hamzafer/claude-code-mods/blob/main/CONTRIBUTING.md) and [test/community.test.mjs](https://github.com/hamzafer/claude-code-mods/blob/main/test/community.test.mjs)
- [claudemods submit form](https://github.com/omarcevi/claudemods/blob/main/.github/ISSUE_TEMPLATE/submit.yml)
- [claudemods.dev submit page](https://claudemods.dev/en/submit)
- [r/ClaudeAI showcase megathread mod note](https://redlib.groet-infra.nl/r/ClaudeAI/comments/1sly3jm/built_with_claude_project_showcase_megathread/oq1cg2n/?context=3)
- [Hacker News Show HN guidelines](https://news.ycombinator.com/showhn.html)
