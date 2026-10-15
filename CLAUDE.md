# All22 Helper

A Chrome side-panel extension that advises picks and placements in the all22pokemon.com 17–0 draft challenge.

- **Glossary:** [`CONTEXT.md`](CONTEXT.md). Use these terms in code and conversation (spot, fit, ceiling, edge, roll, region, formation, …).
- **Design and every decision made so far:** [`docs/design.md`](docs/design.md). Build in the slice order listed there.
- **How the game works:** [`docs/research/scoring/report.md`](docs/research/scoring/report.md). **How the extension talks to the page:** [`docs/research/helper-tool/report.md`](docs/research/helper-tool/report.md). Snapshots of the site's own JS (taken 2026-10-15) are in `docs/research/*/wave-1/`.

## Working agreement

- Claude writes the code, then walks Ian through what it did and why. Explanations are short, one piece at a time.
- Ian knows TypeScript, Angular, C#/.NET and SQL. Chrome extension APIs, Vite, and Monte Carlo simulation are new to him, so define those terms when they come up.
- The site's game logic (`draft.js`) is the source of truth. If our scoring disagrees with the number the game shows, ours is wrong.

## Workflow
Read by /drive-issue, developer, reviewer and /close-out. Field names are defined in claude-setup/WORKFLOW.md: change values here, not names.

- **Base branch:** main
- **Release branch:** none (main is what gets loaded into Chrome)
- **Branch names:** feature/<short-desc>, fix/<short-desc>
- **Issue link:** Closes #N
- **Issue copy:** ISSUE.md from ISSUE-TEMPLATE.md (gitignored)
- **PR template:** .github/pull_request_template.md
- **AI credit:** never
- **Worktrees:** .claude/worktrees/<name>; never work in the main folder
- **Setup:**
  - `npm ci`
  - `npm run sync`
- **Checks:**
  - `npm run format:check`
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
- **Tests first:** yes; where tests go is in .claude/rules/src.md
- **Developer skills:** none
- **Run:** `npm run build`, then Load unpacked from `dist/` in chrome://extensions
- **Slots:** none
- **UI test:** none (for now)
- **DB access:** none
- **Review against:** CLAUDE.md, CONTEXT.md, docs/design.md, the issue
- **Gates:** after the plan; before push. Never merge.
- **Known traps:**
  - `vendor/` and `docs/research/*/wave-1/r1-bundle/` are gitignored, so a fresh worktree has neither until Setup runs `npm run sync`. Use `vendor/`, never the research snapshot, from code and tests.
  - `npm run sync` pulls the live site. If the game changes, fits change with it: a test that suddenly fails after a sync means the game moved, not that our code broke.
  - The vendor files are classic scripts that declare globals, not ES modules. Importing one gives you nothing; it has to be wrapped or evaluated.
