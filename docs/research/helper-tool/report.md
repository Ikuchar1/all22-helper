# How should we build a Chrome side-panel helper that tells the user where a clicked Pokémon fits best in all22pokemon.com?

2026-10-15 · breadth-first · 1 wave · 3 researchers · 25 sources

Verification: 46 of 57 cited claims supported · see verification.md

## Answer

Build a Manifest V3 (MV3) Chrome extension and load it unpacked. It is the only option that gives you a real Chrome side panel, which is an extension page with access to every Chrome API [1]. Do the scoring inside the side panel using the extension's own copies of pokemon.js, pokedata.js and draft.js, not the page's functions. The site declares `DRAFT`, `POKEDATA`, `POKEMON_NAMES` and `HEIGHT_DM` as top-level `const` in classic scripts [15][16][17], so `window.DRAFT` is undefined. Reaching them would need a main-world script plus a `postMessage` relay [3][11] (analysis: bundling is simpler and keeps working if the page changes). A plain isolated content script can read the run straight from localStorage, because content scripts share storage with the page [8]. It reads the clicked Pokémon from the pick list's `canvas.thumb[data-id]` [14]. It forwards both with `chrome.runtime.sendMessage`, which reaches the side panel [7]. One change to the brief's design: clicking a lineup spot while a pick is pending places the Pokémon immediately [14]. So show fit scores when a Pokémon is chosen or hovered, not when a spot is clicked.

## Comparison

| Approach | Setup | Real side panel | Page state / globals | Click detection | Verdict |
|---|---|---|---|---|---|
| **MV3 extension + `chrome.sidePanel`** | Developer mode, then Load unpacked, once [9] | Yes, Chrome 114+, can be limited to one site [1][2] | localStorage directly [8]; globals only with `world: "MAIN"` [4] | Delegated DOM listeners | **Recommended** |
| Userscript (Tampermonkey/Violentmonkey) | Install a manager, then turn on its per-extension "Allow User Scripts" toggle (Chrome 138+) [18]; Violentmonkey ships an MV3 build [19] | No. You inject a floating `div` into the page, and the site's `style-src` blocks injected `<style>` tags and `style=` attributes [25] | Globals via `unsafeWindow` [20] | Yes | Solid fallback | [partly supported]
| Bookmarklet | Drag a link to the bookmarks bar | No, and you must re-click it after every reload | Main world, if it runs at all | Yes, until the next reload | Risky: the site's CSP (Content Security Policy, the header that limits which scripts may run) may block it (see Conflicts) |
| Separate local app | High | Its own window | Can't read another origin's storage [23]; the DevTools bridge needs a separate Chrome profile since Chrome 136 [24]; the site can't be iframed [13] | Only through the DevTools Protocol | Not worth it | [partly supported]

## Architecture

**Pieces and where they run**

- **Service worker** (`service-worker.js`): calls `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` so the toolbar icon opens the panel [2]. On `tabs.onUpdated` it calls `setOptions({tabId, path: 'sidepanel.html', enabled: true})` when the tab's origin matches and `{enabled: false}` otherwise. That is the official site-specific sample [2].
- **Isolated content script** (`content.js`, on `https://all22pokemon.com/*`):
  - reads `JSON.parse(localStorage.getItem('pokemon-all22-draft-v1'))` [8]
  - listens for clicks and hovers on `.cand` and `.hotspot`
  - detects state changes (see below)
  - posts `{state, focusId}` with `chrome.runtime.sendMessage` [7]
- **Side panel** (`sidepanel.html` + `sidepanel.js`):
  - loads its bundled `pokemon.js`, `pokedata.js` and `draft.js` with classic `<script>` tags in that order, the same order as the site [13]
  - listens on `chrome.runtime.onMessage` [6]
  - for each open spot (spots missing from `lineup`), calls `DRAFT.positionScore(id, slot, scheme)` and ranks the results
  - for the "rank every eligible Pokémon for this roll" view, scores each candidate the same way (analysis)
  - when it opens, asks the content script for the current state with `chrome.tabs.sendMessage(tabId, …)`, because `runtime.sendMessage` can't reach content scripts [7]

**Data flow, from a click to the panel**

1. You click a `button.cand`.
2. A delegated listener runs `e.target.closest('.cand')`, then `.querySelector('canvas.thumb').dataset.id`, and gets the dex id [14].
3. The content script reads localStorage and sends a message.
4. The panel scores that Pokémon against every open spot and renders the ranking.

**Detecting changes.** The `storage` event never fires in the tab that made the change [10].
- Simplest robust option (analysis): a `MutationObserver` on `document.body`'s `data-dp` attribute. The app sets it to `setup`, `turn`, `placing` or `done` on every phase change [14]. Re-read localStorage each time it fires, and add a cheap poll as a backstop.
- Heavier option: a `world: "MAIN"` script at `document_start` that wraps `Storage.prototype.setItem` and relays each write with `window.postMessage` [3][11]. One weak source (the researcher's own inference) suggests this pattern; no doc prescribes it.

**Main world vs isolated world.**
- Content scripts run in an isolated world by default. They share the DOM but can't see the page's JS variables [3].
- `"world": "MAIN"` in the manifest (Chrome 111+ [12]) or `chrome.scripting.executeScript({world: 'MAIN'})` (Chrome 95+ [5]) runs code in the page's own environment, where the bare name `DRAFT` would resolve. The Chrome docs warn that the page can interfere with such scripts [4].
- MAIN-world scripts can't use `chrome.runtime` and have to relay through the shared DOM or `postMessage` [11][3].
- The site's private state (`draft`, `lineup`, `SLOTS`) sits inside app.js's IIFE (immediately-invoked function), so no world can reach it [14].

## APIs and manifest

A minimal manifest, assembled from the docs (Medium confidence) [1][2][4]:

```json
{
  "manifest_version": 3,
  "name": "All22 helper",
  "version": "0.1",
  "background": { "service_worker": "service-worker.js" },
  "action": { "default_title": "Open helper" },
  "permissions": ["sidePanel", "tabs"],
  "host_permissions": ["https://all22pokemon.com/*"],
  "content_scripts": [{ "matches": ["https://all22pokemon.com/*"], "js": ["content.js"] }]
}
```

- **`side_panel.default_path`:** the site-specific sample leaves it out and sets `path` per tab, so the panel exists only on the target site [2]. [partly supported] If you add `default_path`, the panel appears on every site unless you disable it per tab.
- **Optional permissions:** add `"scripting"` only if you use `executeScript` [5], and `"storage"` only if you use `chrome.storage.session` as a shared store. Content scripts need `setAccessLevel` to use that store [8].
- **Keyboard shortcut:** the sample binds `_execute_action` to Command+B on macOS to toggle the panel [2]. [not supported]
- **Opening the panel:** `sidePanel.open()` needs Chrome 116+ and must run in response to a user action [1].
- **Loading it:** go to chrome://extensions, turn on Developer mode, then Load unpacked [9]. After editing a content script, reload the extension and the game tab. Extension HTML pages need no extension reload [9].

## What in the DOM identifies a Pokémon

- **Pick list (17–0):**
  - `dialog#draft-pick` contains `#cand-grid`, which holds one `button.cand` per choice [13][14].
  - The button itself has no id. The dex id is on the child `canvas.thumb[data-id]`, and `.num` text such as `#025` is a fallback [14].
  - Sprites are canvases, so there's no `<img src>` to read [14].
  - Locked Legendaries are `button.cand.locked[disabled]`, and disabled buttons don't fire click events [14].
- **Lineup spots:**
  - `#hotspots` holds one `button.hotspot[data-slot="S1|CB1|ILB2|…"]` per spot, laid over `canvas#field` [13][14].
  - Who fills a spot appears only in the button's `aria-label`, so take occupancy from localStorage `lineup` instead [14].
- **Pending pick:** `#dp-pick-img[data-id]` while `body[data-dp="placing"]` [14].
- **Re-rendering:** both containers are rebuilt with `replaceChildren` [14], so delegate from `#cand-grid` / `#hotspots` or `document` and use `closest()`. The site does the same itself [14]. [partly supported]
- **151 Challenge:** has no pick list and saves under `pokemon-all22-151-v1` [14].

## Risks

- **The site updates draft.js.** Your bundled copy goes stale, and the panel's scores drift from what the game shows (analysis). The live files matched the earlier local copies as of 2026-10-14 [13]. [not supported] Keep a re-fetch script handy.
- **Selectors change.** `.cand`, `canvas.thumb[data-id]` and `.hotspot[data-slot]` all come from app.js and can be renamed without warning [14].
- **Writes go through one function.** The run key is written only by `saveDraft()` → `saveRun()` [14]. [partly supported] Signed-in runs also end in `saveDraft()`, but whether every server field gets copied was not checked (Medium) [14]. [partly supported]
- **MAIN-world scripts are exposed.** The page can access and tamper with them [4]. That's one more reason to keep scoring in the panel.
- **Reloading the extension orphans content scripts** already running in open tabs. Reload the game tab too [9].

## Conflicts

- **Bookmarklets under a strict CSP.** The site sends `script-src 'self'` with no `'unsafe-inline'` [13]. [not supported] The CSP3 spec says page policy "SHOULD NOT interfere with … bookmarklets" [22]. MDN lists `javascript:` URLs as inline script that this policy blocks [21]. Neither side is clearly stronger. Test it with `javascript:alert(Object.keys(localStorage))` on the site.
- **Source for "Chrome 111+" on manifest `world`.** MDN's compatibility data says 111 [12]. Google's own pages give no version [4]. No real disagreement, just a thin source.

## Gaps and unverified

- Nobody tested in a browser that `window.DRAFT` is undefined while the bare name `DRAFT` works from a MAIN-world script. That comes from standard JS semantics [15]. [partly supported] Bundling avoids the question.
- saves.js (account sync) was not read. It could overwrite the run key from the server.
- Whether passing a `CustomEvent` `detail` object from the MAIN world to the isolated world works reliably is unverified. Use JSON strings or `postMessage`.
- Whether `GM_addStyle` gets past the site's `style-src` is unverified. Only matters for the userscript route.

## Assumptions

- Chrome stable on macOS, October 2026.
- Only the 17–0 Challenge matters (key `pokemon-all22-draft-v1`).
- "Ranking every eligible Pokémon for the current roll" means scoring the candidates shown in `#cand-grid`.
- The site is served at `https://all22pokemon.com` with no `www.`. Verify this in `host_permissions`.

## Sources

1. Chrome for Developers, chrome.sidePanel — https://developer.chrome.com/docs/extensions/reference/api/sidePanel
2. GoogleChrome samples, cookbook.sidepanel-site-specific — https://raw.githubusercontent.com/GoogleChrome/chrome-extensions-samples/main/functional-samples/cookbook.sidepanel-site-specific/service-worker.js
3. Chrome for Developers, Content scripts — https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
4. Chrome for Developers, manifest content_scripts — https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts
5. Chrome for Developers, chrome.scripting — https://developer.chrome.com/docs/extensions/reference/api/scripting
6. Chrome for Developers, Message passing — https://developer.chrome.com/docs/extensions/develop/concepts/messaging
7. Chrome for Developers, chrome.runtime — https://developer.chrome.com/docs/extensions/reference/api/runtime
8. Chrome for Developers, chrome.storage — https://developer.chrome.com/docs/extensions/reference/api/storage
9. Chrome for Developers, Hello World tutorial — https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world
10. MDN, Window: storage event — https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event
11. MDN, manifest.json content_scripts — https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts
12. MDN browser-compat-data, content_scripts.json — https://raw.githubusercontent.com/mdn/browser-compat-data/main/webextensions/manifest/content_scripts.json
13. all22pokemon.com index.html and response headers — https://all22pokemon.com/
14. all22pokemon.com app.js — https://all22pokemon.com/app.js
15. all22pokemon.com draft.js — https://all22pokemon.com/draft.js
16. all22pokemon.com pokedata.js — https://all22pokemon.com/pokedata.js
17. all22pokemon.com pokemon.js — https://all22pokemon.com/pokemon.js
18. Chrome for Developers, chrome.userScripts — https://developer.chrome.com/docs/extensions/reference/api/userScripts
19. Violentmonkey, Get it — https://violentmonkey.github.io/get-it/
20. Tampermonkey docs, unsafeWindow — https://www.tampermonkey.net/documentation.php?q=unsafeWindow
21. MDN, Content Security Policy guide — https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP
22. W3C, CSP Level 3 — https://www.w3.org/TR/CSP3/
23. MDN, Same-origin policy — https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy
24. Chrome blog, remote-debugging-port changes — https://developer.chrome.com/blog/remote-debugging-port
25. MDN, CSP style-src — https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src

## Run

- **Wave 1:** Chrome MV3 mechanics (r1), the live site's DOM, globals and CSP (r2), and the alternatives (r3). It covered every part of the plan. The key correction was that the page globals are `const`, not `window` properties.

Stopped because no open gap changes the answer.
Plan: plan.md · Gaps: gaps-*.md · Findings: wave-*/*.md
