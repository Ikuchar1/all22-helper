# Verification

Supported: 46/57 (81%) · partly: 7 · not supported: 3 · unreachable: 1 · not checked: 0

Checked 2026-10-15T10:05:08-05:00 against quote-check.json. WebFetches: 1/15.

Abbreviations used below:
- "app.js set" = q51, q54–q90, q93–q95. Most are exact. q56, q57, q58, q70 and q94 are trimmed. q51 and q80 are reworded. q54, q63, q64, q68, q69, q84 and q95 are not_found.
- "site set" = q41–q48, q91, q92, q106, all not_found.
- Claims citing these were judged against the cached pages in .pages/.

## Claims
- **c1** · supported · quotes: q1 exact, q2 exact, q6 exact, q7 exact
  q7: side panels have access to all Chrome APIs. "Only option" is the report's own comparison.
- **c2** · supported · quotes: q49 exact, q50 not_found, q52 not_found, q53 not_found
  Cached files confirm all four: `const DRAFT` (draft.js line 4), `const POKEDATA` (pokedata.js line 1031), `const POKEMON_NAMES` and `const HEIGHT_DM` (pokemon.js lines 2 and 198). The index loads them as classic scripts.
- **c3** · supported · quotes: q8, q13–q17, q21, q22 exact
  MAIN-world scripts lack extension APIs. The docs show a postMessage bridge to the isolated world.
- **c4** · supported · quotes: q23 exact, q34–q37 exact
  q23: content scripts share the page's storage.
- **c5** · supported · quotes: app.js set
  In the cached app.js, candCard renders `<canvas class="thumb">` and drawThumb sets `cv.dataset.id = id`.
- **c6** · supported · quotes: q26 exact, q27 exact
  runtime.sendMessage reaches extension pages, including the side panel.
- **c7** · supported · quotes: app.js set
  draftSlotClick runs `if (draft.pending) place(slotId);`.
- **c8** · supported · quotes: q1–q4, q6, q7, q9–q11, q23, q34–q40 (q3, q4 reworded; rest exact)
  Every cell checks out:
  - Load unpacked [9]
  - Chrome 114+ (sidePanel page) [1]
  - limited to one site (the sample's per-tab setOptions) [2]
  - localStorage [8]
  - world MAIN [4]
- **c9** · supported · quotes: q96–q99 exact, q100 reworded, q101 reworded
  The userScripts page has a "Chrome versions 138 and newer (Allow User Scripts toggle)" section. The cached Violentmonkey page describes an MV3 build.
- **c10** · partly supported · quotes: q107 exact, q108 exact, q109 exact, q102 exact
  MDN style-src shows that `<style>` elements and `style=` attributes are blocked under a style-src policy, and unsafeWindow is supported. But no cited source shows that this site sends a style-src policy.
- **c11** · partly supported · quotes: q112–q114 exact, site set · fetched
  The same-origin storage limit and the Chrome 136 separate-profile requirement are supported. "The site can't be iframed [13]" isn't: the cached HTML and a WebFetch show no frame-ancestors or X-Frame-Options.
- **c12** · supported · quotes: q3 reworded, q4 reworded
  Cached service-worker.js lines 18–20 call setPanelBehavior({ openPanelOnActionClick: true }).
- **c13** · supported · quotes: q3 reworded, q4 reworded
  The cached file is the sample that enables the panel on one site (google.com).
- **c14** · supported · quotes: q23 exact, q34–q37 exact
  Content scripts can read localStorage. In app.js the key is EDITION.key "pokemon-all22" + "-draft-v1".
- **c15** · supported · quotes: q26 exact, q27 exact
  sendMessage is documented for this purpose. The payload shape is the design's own.
- **c16** · supported · quotes: site set
  The cached index.html loads saves.js, profile.js, pokemon.js, pokedata.js, draft.js, tips.js, app.js as classic (non-module) scripts, in that order.
- **c17** · supported · quotes: q28–q33 exact
  runtime.onMessage is documented as the receiver.
- **c18** · supported · quotes: q26 exact, q27 exact
  q27: extensions can't message content scripts with runtime.sendMessage, and tabs.sendMessage is the documented route.
- **c19** · supported · quotes: app.js set
  In app.js, `.cand` buttons contain `canvas.thumb` with dataset.id holding the dex id.
- **c20** · supported · quotes: q24 exact, q25 exact
  q25: the storage event doesn't fire in the tab that made the change.
- **c21** · supported · quotes: app.js set
  updateDraftPanel sets body.dataset.dp to done/setup/placing/turn and is called from refreshDraft.
- **c22** · supported · quotes: q8, q13–q17, q21, q22 exact
  The sources cover MAIN world, document_start and the postMessage relay. Wrapping setItem is the report's design and is presented as one.
- **c23** · supported · quotes: q8, q14–q17, q21, q22 exact
  Content-scripts page: content scripts share the DOM, but the page's JS variables are isolated from them.
- **c24** · supported · quotes: q12 not_found, q18 exact, q19 exact
  - The cached BCD json gives `world` chrome version_added "111".
  - The scripting page tags ScriptInjection.world and ExecutionWorld "Chrome 95+".
- **c25** · supported · quotes: q9–q11 exact
  q11 warns of risks when using the MAIN world.
- **c26** · supported · quotes: q13, q8, q14–q17, q21, q22 exact
  MAIN-world scripts have no extension APIs and relay through postMessage.
- **c27** · supported · quotes: app.js set
  app.js is wrapped in `(() => { "use strict"; ... })();`, and `let SLOTS`, `let lineup` and `let draft` sit inside it.
- **c28** · supported · quotes: q1–q4, q6, q7, q9–q11 (q3, q4 reworded; rest exact)
  The manifest fields match the cited docs and sample. The report itself labels it assembled and Medium confidence.
- **c29** · partly supported · quotes: q3 reworded, q4 reworded
  The cited service-worker.js sets `path` per tab and disables the panel elsewhere. No cited material shows the sample's manifest leaving out default_path.
- **c30** · supported · quotes: q18 exact, q19 exact
  The scripting page's Permissions section requires "scripting". The uncited storage half is a design suggestion.
- **c31** · supported · quotes: q23 exact, q34–q37 exact
  The storage page says session storage is "not exposed to content scripts" by default, and documents setAccessLevel with TRUSTED_AND_UNTRUSTED_CONTEXTS.
- **c32** · not supported · quotes: q3 reworded, q4 reworded
  The cited service-worker.js has no command or shortcut binding. The `_execute_action` / Command+B binding isn't in the cited source.
- **c33** · supported · quotes: q1, q2, q6, q7 exact
  The sidePanel page tags open()/OpenOptions "Chrome 116+", and q6 says it requires a user action.
- **c34** · supported · quotes: q38–q40 exact
  The Hello World steps are chrome://extensions, Developer mode, Load unpacked.
- **c35** · supported · quotes: q38–q40 exact
  The reload table lists "Other extension HTML pages: No".
- **c36** · supported · quotes: site set, app.js set
  index.html has dialog#draft-pick containing #cand-grid, and app.js builds `button.cand` per candidate.
- **c37** · supported · quotes: app.js set
  The dex id is on canvas.thumb dataset.id, and `.num` shows `#${String(p.id).padStart(3,"0")}`.
- **c38** · supported · quotes: app.js set
  Pick-list sprites are drawn to canvases via drawThumb.
- **c39** · supported · quotes: app.js set
  app.js sets `el.disabled = locked; el.classList.toggle("locked", locked)`. That disabled buttons don't fire clicks is standard DOM behaviour.
- **c40** · supported · quotes: site set, app.js set
  app.js builds button.hotspot with dataset.slot (S1, CB1, ILB2, ...) inside #hotspots, and index.html has canvas#field.
- **c41** · supported · quotes: app.js set
  updateHotspotLabels sets only aria-label, and lineup is persisted in localStorage.
- **c42** · supported · quotes: app.js set
  drawThumb on #dp-pick-img sets data-id, and body data-dp is "placing" while a pick is pending.
- **c43** · supported · quotes: app.js set
  app.js calls hotspotsEl.replaceChildren() and candGrid.replaceChildren(frag).
- **c44** · partly supported · quotes: app.js set
  The site does delegate on #hotspots (pointerover/focusin with closest(".hotspot")). But the cand buttons get per-button listeners (`el.addEventListener("click", () => choosePick(p.id))`), not delegation.
- **c45** · supported · quotes: app.js set
  app.js has `if (game === "151") return; // the roll is the pick`, and runKey is `${EDITION.key}-151-v1` with key "pokemon-all22".
- **c46** · not supported · quotes: site set
  The cited site can't show a comparison with the researcher's earlier local copies. Nothing in the sources supports the claim.
- **c47** · supported · quotes: app.js set
  All three selectors are created in app.js. "Can be renamed" is reasonable risk analysis.
- **c48** · partly supported · quotes: app.js set
  saveRun is the only writer of the run key, but it is also called directly, not via saveDraft, from offerRetro, catchUp, playOnThisDevice and foundSignedOut.
- **c49** · partly supported · quotes: app.js set
  The server catch-up path (catchUp) calls saveRun(g) directly, not saveDraft(). The Medium hedge on field copying is fair.
- **c50** · supported · quotes: q9–q11 exact
  q11 warns of risks with MAIN-world scripts, which the page can interfere with.
- **c51** · supported · quotes: q38–q40 exact
  The reload table lists "Content scripts: Yes (plus the host page)".
- **c52** · not supported · quotes: site set · fetched
  No cited source shows the site's CSP. The cached HTML has no meta CSP, and a WebFetch shows none; response headers aren't captured. `script-src 'self'` can't be confirmed.
- **c53** · unreachable · quotes: q110 unreachable
  The W3C CSP3 URL was unreachable.
- **c54** · supported · quotes: q111 exact
  MDN lists "JavaScript in a `javascript:` URL" among inline JavaScript blocked when script-src is set.
- **c55** · supported · quotes: q12 not_found
  The cached BCD content_scripts.json has `world` → chrome version_added "111".
- **c56** · supported · quotes: q9–q11 exact
  The cached Chrome content-scripts manifest page has no version number for `world` (grep for 111 / "Chrome 1xx" finds nothing).
- **c57** · partly supported · quotes: q49 exact, q50 not_found, q52 not_found, q53 not_found
  draft.js shows the top-level `const DRAFT`. That top-level const doesn't create a window property is a language rule the cited file doesn't state.

## Uncited sentences in the Answer
None.

## Annotate
c10 | partly supported | You inject a floating `div` into the page, and the site's `style-src` blocks injected `<style>` tags and `style=` attributes [25] | Globals via `unsafeWindow` [20] | Yes | Solid fallback |
c11 | partly supported | | Separate local app | High | Its own window | Can't read another origin's storage [23]; the DevTools bridge needs a separate Chrome profile since Chrome 136 [24]; the site can't be iframed [13] | Only through the DevTools Protocol | Not worth it |
c29 | partly supported | **`side_panel.default_path`:** the site-specific sample leaves it out and sets `path` per tab, so the panel exists only on the target site [2].
c32 | not supported | **Keyboard shortcut:** the sample binds `_execute_action` to Command+B on macOS to toggle the panel [2].
c44 | partly supported | The site does the same itself [14].
c46 | not supported | The live files matched the earlier local copies as of 2026-10-14 [13].
c48 | partly supported | **Writes go through one function.** The run key is written only by `saveDraft()` → `saveRun()` [14].
c49 | partly supported | Signed-in runs also end in `saveDraft()`, but whether every server field gets copied was not checked (Medium) [14].
c52 | not supported | **Bookmarklets under a strict CSP.** The site sends `script-src 'self'` with no `'unsafe-inline'` [13].
c57 | partly supported | That comes from standard JS semantics [15].
