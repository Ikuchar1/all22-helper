# Plan

Type: breadth-first. Three independent parts: (a) Chrome MV3 extension mechanics, (b) the live site's DOM/app.js/globals, (c) comparison of alternative approaches (userscript, bookmarklet, local app). 3 researchers.

## Sub-questions
1. r1 Chrome MV3 mechanics — sidePanel API (site scoping, open behavior), isolated vs MAIN world content scripts, executeScript, reading localStorage + change detection (setItem wrapping, polling, MutationObserver), content-script <-> side-panel messaging, unpacked loading, manifest fields. Budget: hard. Findings: wave-1/r1-chrome-mv3.md
2. r2 Live site — app.js/index.html markup for pick list and lineup slots, how dex id is attached to elements, whether DRAFT/POKEDATA/POKEMON_NAMES/HEIGHT_DM are reachable as window globals, when localStorage is written, any CSP. Budget: hard. Findings: wave-1/r2-site-dom.md
3. r3 Alternatives — userscript managers on Chrome MV3 (Tampermonkey/Violentmonkey status, developer-mode/User Scripts toggle requirement, unsafeWindow, GM_addElement), bookmarklet limits (CSP, re-click each load), local app access to page state. Budget: medium. Findings: wave-1/r3-alternatives.md

## Assumptions
- Personal use, Chrome stable on macOS as of Oct 2026.
- Recommendation weighs "side panel" ask heavily but also setup friction.
