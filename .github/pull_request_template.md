<!--
TITLE: what this PR does, as an imperative sentence.
  - Start with a verb: "Add the scoring engine", "Fix fits for dual-type Pokémon"
  - Keep it under about 70 characters, with no trailing period, no issue number and no "feat:" prefix
  - Use the words in CONTEXT.md: spot, fit, ceiling, edge, roll, region, formation

BASE: `main`.

BODY: fill in each section and delete these comments. Delete a section marked (optional) if it doesn't apply.
Never credit Claude or AI; no "Generated with Claude Code" line.
-->

Closes #

## What and why

<!-- 1–3 sentences: what the helper can do now that it couldn't before, and why it's built this way if that isn't obvious. -->

## Changes

<!-- Bullets grouped by area. Say what changed, not how every line works. Delete the areas that didn't change. -->

**Engine** (`src/`, not the panel)

-

**Panel / extension** (`src/panel`, manifest, service worker, content script)

-

**Docs / tooling**

-

## Try it

<!-- The steps to see it working. -->

1. `npm run sync && npm run build`
2. …

## Checks

<!-- Tick only what actually ran and passed. If something failed or was skipped, leave it unticked and say why. -->

- [ ] `npm run format:check`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] A documented decision changed: `docs/design.md` is updated in this PR

## Notes (optional)

<!-- What to look at closely, decisions made along the way, follow-ups left for later, screenshots of the panel. -->
