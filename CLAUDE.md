# All22 Helper

A Chrome side-panel extension that advises picks and placements in the all22pokemon.com 17–0 draft challenge.

- **Glossary:** [`CONTEXT.md`](CONTEXT.md). Use these terms in code and conversation (spot, fit, ceiling, edge, roll, region, formation, …).
- **Design and every decision made so far:** [`docs/design.md`](docs/design.md). Build in the slice order listed there.
- **How the game works:** [`docs/research/scoring/report.md`](docs/research/scoring/report.md). **How the extension talks to the page:** [`docs/research/helper-tool/report.md`](docs/research/helper-tool/report.md). Snapshots of the site's own JS (taken 2026-10-15) are in `docs/research/*/wave-1/`.

## Working agreement

- Claude writes the code, then walks Ian through what it did and why. Explanations are short, one piece at a time.
- Ian knows TypeScript, Angular, C#/.NET and SQL. Chrome extension APIs, Vite, and Monte Carlo simulation are new to him, so define those terms when they come up.
- The site's game logic (`draft.js`) is the source of truth. If our scoring disagrees with the number the game shows, ours is wrong.
