# all22pokemon.com: DOM click targets, dex/slot recovery, page globals, script order, localStorage writes, re-rendering, CSP

Researched 2026-10-15. Budget: hard, used 11 tool calls.

Evidence files (downloaded with curl, never executed): `/Users/ikuchar/research/2026-10-15-all22pokemon-helper-tool/wave-1/r2-site/` holds `index.html`, `app.js` (3757 lines), `pokemon.js`, `pokedata.js`, `draft.js`. The live `pokemon.js`, `pokedata.js` and `draft.js` are byte-identical to the local copies in `.../2026-10-15-all22pokemon-scoring/wave-1/r1-bundle/` (checked with `cmp`). HTML `last-modified: Wed, 14 Oct 2026 13:41:20 GMT`.

## Answer
(a) The 17–0 pick list is `<div id="cand-grid">` inside `<dialog id="draft-pick">`. Each choice is a `<button class="cand">` with **no data-id on the button**. The dex id can be read from the child `canvas.thumb`'s `data-id` (set by `drawThumb`), or parsed from `.num` text (`#025`). There is no `<img src>`, because thumbnails are drawn to a canvas. Once picked, the pending Pokémon shows in `#dp-pick-img` (canvas with `data-id`) and `#dp-pick-name`. (b) The lineup spots are `<button class="hotspot" data-slot="S1|CB1|ILB2|…">` children of `<div id="hotspots">`, laid over `<canvas id="field">`. The field itself is canvas-drawn, so the DOM carries only the slot id plus an `aria-label` with the position and name. Both containers are fully rebuilt (`replaceChildren`) on each pick-list fill and formation change, so the extension should listen with event delegation on `#cand-grid` / `#hotspots` (or `document`, capture phase) and use `closest(".cand")` / `closest(".hotspot")`.

`DRAFT`, `POKEDATA`, `POKEMON_NAMES` and `HEIGHT_DM` are top-level `const` in classic (non-module) scripts. That makes them global *bindings*, but not `window.X` properties. App state (`draft`, `lineup`, `SLOTS`) is sealed inside app.js's IIFE (an immediately-invoked function, so it is private). `app.js` writes `pokemon-all22-draft-v1` only through the `saveDraft()` → `saveRun(g)` wrapper. The site sends a strict CSP *header* (`script-src 'self'`, no meta tag).

## Findings
1. **Script load order is classic `<script src>` tags at the end of body: saves.js, profile.js, pokemon.js, pokedata.js, draft.js, tips.js, app.js, plus a deferred Vercel insights script in head. None are `type="module"`.** (High)
   - https://all22pokemon.com/ (index.html lines 366–372, 30)
   - > `<script src="saves.js"></script>` / `<script src="profile.js"></script>` / `<script src="pokemon.js"></script>` / `<script src="pokedata.js"></script>` / `<script src="draft.js"></script>` / `<script src="tips.js"></script>` / `<script src="app.js"></script>`
   - > `<script defer src="/_vercel/insights/script.js"></script>` (line 30)
   - A grep for `type="module"` / `export` in index.html and draft.js returned nothing.

2. **The data and logic globals are top-level `const` in classic scripts, not `var` and not `window.X =`.** (High; read directly from source)
   - https://all22pokemon.com/draft.js line 4: > `const DRAFT = (() => {`
   - pokedata.js line 1031: > `const POKEDATA = POKEDATA_RAW.map((row) => {` (also line 3 `const TYPE_NAMES = [...]`, line 4 `const POKEDATA_RAW = [`)
   - pokemon.js line 2: > `const POKEMON_NAMES = [`; line 198: > `const HEIGHT_DM = [7,10,20,...`; line 217: > `const EDITION = {`; plus `const nameOf`, `ALL_POKEMON`, `POKEMON_BY_ID`, `LEGENDARIES`, `spriteUrl`, `iconUrl`
   - Implication (Low/Medium, standard JS semantics, not verified in a browser this run): top-level `const` in a classic script goes into the shared global lexical scope. Any later classic script in the **page's main world** can use `DRAFT.positionScore(...)` by bare name, but `window.DRAFT` is `undefined`. A Chrome content script in the default isolated world cannot see them at all. It would need `world: "MAIN"` injection, or its own copy of draft.js/pokedata.js/pokemon.js loaded in order (draft.js uses `POKEDATA`/`nameOf` from the earlier files).

3. **App state is not reachable: app.js is one strict-mode IIFE, and `draft`, `lineup`, `SLOTS`, `mode` and `game` are `let` inside it. Its only `window` writes are the Vercel analytics shim.** (High)
   - app.js lines 3–4: > `(() => {` / `"use strict";`
   - lines 103, 131, 146, 150: > `let SLOTS = [];` … `let lineup = fromHash ? fromHash.lineup : loadSavedLineup(gen, legends);` … `let draft = CHALLENGE_OK ? runs[game] : null;`
   - line 1835 (the only `window.X =` match): > `window.va = window.va || ((...args) => (window.vaq = window.vaq || []).push(args));`
   - So the helper must read state from localStorage or the DOM, not from page variables.

4. **Lineup spots: `#hotspots` holds one `<button class="hotspot">` per spot, with the spot id in `data-slot`. The site itself already delegates on `#hotspots` using `closest(".hotspot")`.** (High)
   - app.js lines 977–986 (`buildHotspots`): > `hotspotsEl.replaceChildren();` … `const el = document.createElement("button");` / `el.className = "hotspot";` / `el.dataset.slot = slot.id;`
   - line 1190: > `const hotspotAt = (target) => (target instanceof Element ? target.closest(".hotspot") : null);`
   - Slot ids come from `BASE_SLOTS` (line 22+): > `{ id: "S1", pos: "S", side: "D", lx: 528, ly: 112, s: 96, look: "R" },` (also `S2`, `CB1`, `OLB1`, `ILB1`, `ILB2`, `OLB2`, …; a kicker spot is added when `scheme.k`)
   - index.html lines 227–228: > `<canvas id="field" width="1536" height="1064" aria-label="Lineup field"></canvas>` / `<div id="hotspots"></div>`
   - Who is in a spot is **not** in a data attribute. It is only in `aria-label` (lines 1018–1023): > ``else if (id) label = `${slot.pos}: ${nameOf(id)}, locked in`;`` and > ``else if (draft.pending) label = `${slot.pos}: open. Place ${nameOf(draft.pending)} here`;``. Read occupancy from localStorage `lineup{spotId:dexId}` instead.

5. **Spot clicks in challenge mode go to a per-button listener, `draftSlotClick(slot.id)`. With a pending pick, that click places it immediately (no confirm step).** (High)
   - app.js lines 999–1000: > `el.addEventListener("click", () => {` / `if (mode === "draft") { draftSlotClick(slot.id); return; }`
   - line 2286: > `if (draft.pending) place(slotId);` (otherwise `openDraftPick()`)
   - Consequence (Low, inference): "click a spot to see its fit" collides with placing. Show fit when a Pokémon is *chosen* (cand click / `pending` set) or on hover over hotspots, not on spot click.

6. **Pick list (17–0): `<dialog id="draft-pick">` contains `<div id="cand-grid">`. Each choice is a `<button class="cand">` built per roll, with no dex id on the button itself.** (High)
   - index.html lines 263, 278: > `<dialog id="draft-pick" class="sheet pick-sheet" aria-labelledby="dlg-heading">` / `<div id="cand-grid" class="cand-grid"></div>`
   - app.js lines 2054–2071 (`candCard`): > `el.className = "cand";` … `<canvas class="thumb" width="128" height="128" aria-hidden="true"></canvas>` … `<span class="num">#${String(p.id).padStart(3, "0")}</span>` … `drawThumb(el.querySelector("canvas"), p.id);` … `el.addEventListener("click", () => choosePick(p.id));`
   - `drawThumb` (line 1992): > `cv.dataset.id = id;`, so **`btn.querySelector("canvas.thumb").dataset.id` is the dex id.** `parseInt(btn.querySelector(".num").textContent.slice(1), 10)` is a fallback.
   - Locked Legendaries are `button.cand.locked[disabled]` (line 2059: > `el.disabled = locked;`). Disabled buttons don't fire click, so the extension should check `.locked` and not rely on clicks on those.
   - Thumbnails are canvases, so there is **no `img src` containing the dex number** in the pick list.

7. **The pick list is rebuilt with `replaceChildren` every time it opens. Delegate from `#cand-grid` (stable, in the static HTML) or from `document`.** (High)
   - app.js line 2049: > `candGrid.replaceChildren(frag);` (in `fillDraftPick`, called from `openDraftPick`)

8. **After a choice, `draft.pending` is set and saved, the dialog closes, and the "placing" panel shows the pick in `#dp-pick-img` (canvas, `data-id` = dex) and `#dp-pick-name`. `<body data-dp>` reports the phase.** (High)
   - app.js lines 2073–2077: > `function choosePick(id) {` / `draft.pending = id;` / `saveDraft();` / `pickDlg.close();`
   - line 1908: > `drawThumb($("dp-pick-img"), draft.pending);`
   - line 1860: > `document.body.dataset.dp = done ? "done" : !draft.started ? "setup" : draft.pending ? "placing" : "turn";`
   - index.html line 178: > `<canvas id="dp-pick-img" class="thumb" width="128" height="128" aria-hidden="true"></canvas>`
   - A `MutationObserver` on `body[data-dp]`, or a `storage` poll, can detect "a Pokémon was chosen" without hooking clicks at all (Low, inference). Note that `storage` events don't fire in the same tab that wrote the value.

9. **151 Challenge has no pick list: the roll *is* the pick (`draft.pending = draft.roll.id`). Its run saves under a different key, `pokemon-all22-151-v1`.** (High)
   - app.js line 2245 area: > `// The rolled Pokémon is the pick: straight on to placing it.` / `draft.pending = draft.roll.id;`
   - line 96: > ``151: { name: "151 Challenge", runKey: `${EDITION.key}-151-v1`, statsKey: `${EDITION.key}-151-stats-v1` },``
   - line 2017: > `if (game === "151") return; // the roll is the pick`

10. **`pokemon-all22-draft-v1` is written only through the wrapper `saveDraft()` → `saveRun(game)` → `localStorage.setItem(CHALLENGES[g].runKey, JSON.stringify(runs[g]))`.** (High)
    - pokemon.js line 218: > `key: "pokemon-all22", // saved-data prefix`
    - app.js line 85: > ``const DRAFT_KEY = `${EDITION.key}-draft-v1`;`` and line 95: > `"17-0": { name: "17–0 Challenge", runKey: DRAFT_KEY, statsKey: DRAFT_STATS_KEY },`
    - lines 1658–1663: > `function saveRun(g) {` / `try { localStorage.setItem(CHALLENGES[g].runKey, JSON.stringify(runs[g])); } catch (_) { /* ignore */ }` / `function saveDraft() {` / `runs[game] = draft;` / `saveRun(game);`
    - `saveDraft()` call sites: lines 201, 2077 (choosePick), 2108 (reroll), 2249/2256 (after the roll reveal), 2314 (place), 2334 (new run), 2364, 2409. Other `setItem` calls write the mode, scheme, style, gen, legends, stats (`-draft-stats-v1`), teams and builder lineups, not the run.
    - Signed-in runs go through `serverMove("pick", ...)` (line 2297) and `adoptServer(draft, s)`, but still end in `saveDraft()` (line 2314), so localStorage stays current (Medium: I did not read `adoptServer` to confirm every field is copied).

11. **The page sends a strict CSP as an HTTP header. There is no CSP `<meta>` tag.** (High)
    - `curl -sI https://all22pokemon.com/` (2026-10-15): > `content-security-policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://pbs.twimg.com; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`
    - Also: > `x-frame-options: DENY` and `server: Vercel`
    - A grep of index.html head meta tags found only charset, viewport, description, og:* and twitter:*.
    - Implication (Low, inference, not tested): `script-src 'self'` with no `'unsafe-inline'` blocks inline `<script>` injection and probably `javascript:` bookmarklets. `connect-src 'self'` blocks page-world fetches to other hosts. `frame-ancestors 'none'` + `DENY` means the site can't be iframed into a side panel. Extension content scripts and `chrome.scripting.executeScript({world:"MAIN", files:[...]})` aren't governed by the page CSP the same way. That belongs to r1.

12. **Builder-mode picker (not the challenge) does carry `data-id` and an `<img>` on each tile.** (High; useful only if the helper also covers the builder)
    - app.js lines 1281–1286: > `el.className = "mon";` / `el.dataset.id = p.id;` … `<img loading="lazy" alt="" src="${tileIcon(p.id)}" width="72" height="72">`
    - Container: index.html line 260: > `<div id="picker-grid" class="grid"></div>` inside `<dialog id="picker">`.

## Conflicts
- None between sources. One correction to the brief's framing: the pick list's sprites are not `<img>` elements with a dex number in `src`. They are `<canvas class="thumb" data-id>` (finding 6). Only the builder picker uses `<img>`.

## Unverified
- Whether `adoptServer` (signed-in/server runs) copies every state field (`pending`, `roll`, `rerolls`) into `draft` before `saveDraft()`. I didn't read it.
- The browser-behavior claims (const bindings not on `window`; isolated vs MAIN world visibility; CSP blocking bookmarklets in Chrome) come from standard semantics. I didn't test them in a browser this run.
- The contents of `saves.js`, `profile.js` and `tips.js` (not downloaded). They could in theory define other globals or sync the run key from the server.

## Leads
- `saves.js` syncs saved data with the account (comment at app.js line 89–90: "Syncs (saves.js)"). It could overwrite `pokemon-all22-draft-v1` from the server, which is worth a look if the helper reads localStorage.
- The hotspot hover card (`showCard`, app.js ~1150–1185) already renders a per-spot "player card" with stats. It's a possible visual anchor or competitor for the helper's UI.
- `body[data-dp]` plus `#dp-pick-img[data-id]` give a click-free way to know the pending pick (finding 8).

## Sources read
- https://all22pokemon.com/ (HTML, last-modified 2026-10-14; fetched 2026-10-15): script order, static container ids, no CSP meta.
- `curl -sI https://all22pokemon.com/` (2026-10-15): CSP and other security headers.
- https://all22pokemon.com/app.js (fetched 2026-10-15, 3757 lines): hotspots, cand grid, choosePick/place, saveDraft/saveRun, IIFE scoping.
- https://all22pokemon.com/draft.js, /pokedata.js, /pokemon.js (fetched 2026-10-15; identical to the local r1-bundle copies): top-level `const` declarations, EDITION key.
