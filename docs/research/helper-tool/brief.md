# Research brief: How should we build a Chrome side-panel helper that tells the user where a clicked Pokémon fits best in all22pokemon.com?

- **Date:** 2026-10-15
- **Question:** What is the best way to build a helper tool for all22pokemon.com's 17–0 draft challenge that runs alongside the game in Google Chrome? It should show a small window/panel on the side, and when the user clicks (or hovers/selects) a Pokémon in the game, it shows the best open spot for it and its fit score at each open spot, ideally also ranking every eligible Pokémon for the current roll. Compare the realistic approaches and recommend one:
  1. A Chrome extension (Manifest V3) using the `chrome.sidePanel` API, with a content script on all22pokemon.com.
  2. A userscript (Tampermonkey/Violentmonkey) that injects a floating panel into the page.
  3. A bookmarklet.
  4. A separate local app (e.g. a small local web page or desktop window) that gets game state some other way.
  For the recommended approach, research concretely: how a content script reads the page's localStorage (`pokemon-all22-draft-v1`) and detects changes (the `storage` event does not fire in the same tab — so what works: polling, MutationObserver on the DOM, wrapping `localStorage.setItem` from the page's main world); the difference between isolated-world and main-world scripts (`world: "MAIN"`, `chrome.scripting.executeScript`) and whether the extension can call the page's own global functions (`DRAFT.positionScore`, `DRAFT.teamScore`, globals `POKEDATA`, `POKEMON_NAMES`, `HEIGHT_DM`) or should instead bundle/re-fetch draft.js, pokedata.js and pokemon.js; how to detect which Pokémon the user clicked (DOM click listeners and how to find the Pokémon id from the element — inspect the live site's DOM/app.js for the markup of the pick list and lineup slots); how the content script messages the side panel (`chrome.runtime` messaging, ports); whether the side panel can be scoped to just this site; how to load an unpacked extension for personal use (no Web Store); and a minimal file layout (manifest.json fields, permissions, host_permissions).
- **Why:** The user will build this themselves next, in a design session with Claude. They want a recommendation and a clear picture of the moving parts, not finished code.
- **Already known:**
  - The game's scoring is fully client-side in plain, unminified https://all22pokemon.com/draft.js. It exposes pure functions `DRAFT.positionScore(id, slot, scheme)` and `DRAFT.teamScore(lineup, scheme, variant)` that depend only on globals from pokedata.js and pokemon.js.
  - The current run is in localStorage key `pokemon-all22-draft-v1`, JSON with `seed`, `round`, `scheme {def, off}`, `lineup {spotId: dexId}`, `pending` (picked-but-unplaced dex id or null), `variant` ("all"/"retro"), `roll {gen, type}`, `rerolls {type, gen}`.
  - Team score = curve(0.82 × avg of side-weighted fits + 0.18 × mean of 4 weakest fits). One type reroll + one region reroll per run. Max 3 Legendaries.
  - Signed-in leaderboard runs are dealt by the server via `/api/app?a=...`; signed-out runs are seeded locally.
  - Prior report with full details: /Users/ikuchar/research/2026-10-15-all22pokemon-scoring/report.md. Local copies of draft.js, pokedata.js, pokemon.js are in /Users/ikuchar/research/2026-10-15-all22pokemon-scoring/wave-1/r1-bundle/ (app.js is live at https://all22pokemon.com/app.js).
- **Scope:** In: Chrome on macOS, personal use only, current Chrome extension docs (MV3, sidePanel API), the live site's DOM and app.js for selectors and click targets. Out: publishing to the Chrome Web Store, other browsers, auto-clicking/automating moves (the tool advises; the user clicks).
- **Preferred sources:** developer.chrome.com official docs; the live site's own HTML/JS; MDN for web APIs.
- **Avoid:** outdated Manifest V2 tutorials, SEO blogs.
- **Effort:** auto
- **Output:** A report that answers first (the recommended approach and why, in a few sentences), then a comparison table of the approaches, then the architecture of the recommended one (which piece runs where, how data flows from a click to the panel), the specific APIs/manifest fields, what in the site's DOM identifies a clicked Pokémon, and risks (e.g. the site updating draft.js). Max ~1500 words.
- **Clarifications:** Asked which browser the user plays in → Chrome.
