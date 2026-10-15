# Gaps after wave 1

## New this wave
- sidePanel manifest/setPanelBehavior/site-specific setOptions sample; open() needs a user gesture, Chrome 116+ (r1-chrome-mv3.md)
- MAIN-world scripts have no chrome.runtime and must relay via postMessage; content scripts share localStorage with the page (r1)
- runtime.sendMessage reaches the side panel; the panel uses tabs.sendMessage to reach content scripts (r1)
- Load unpacked steps; content-script edits need an extension reload plus a page reload (r1)
- Pick list: #cand-grid button.cand > canvas.thumb[data-id]; spots: #hotspots button.hotspot[data-slot]; both rebuilt via replaceChildren (r2-site-dom.md)
- Globals are top-level const (not window props); app state private in an IIFE; spot click places the pending pick; body[data-dp] + #dp-pick-img[data-id] (r2)
- Run is written only via saveDraft/saveRun; strict CSP header; X-Frame-Options DENY (r2, r3)
- userScripts needs the "Allow User Scripts" toggle (Chrome 138+); Violentmonkey has an MV3 build; local app is blocked by the same-origin policy; CDP needs --user-data-dir since Chrome 136 (r3-alternatives.md)

## Open
1. Whether Chrome runs bookmarklets under this CSP — nice to know — bookmarklet isn't the recommendation either way. Source: r3 conflict.
2. Browser test that bare `DRAFT` is reachable from a manifest MAIN-world script — nice to know — bundling the three files into the panel sidesteps it. Source: r1/r2 Unverified.
3. saves.js may overwrite the run key from the server — nice to know — Source: r2 Leads.
4. adoptServer field completeness for signed-in runs — nice to know — Source: r2 Unverified.
5. GM_addStyle vs style-src — nice to know — the userscript isn't recommended.

## Decision
Stop: no open gap changes the answer.
