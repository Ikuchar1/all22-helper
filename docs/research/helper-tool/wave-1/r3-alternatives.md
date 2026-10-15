# How viable are non-extension alternatives (userscript, bookmarklet, local app) in Chrome on macOS for an all22pokemon.com helper panel?

Researched 2026-10-15. Budget: medium, used 16 tool calls.

## Answer
**Userscripts** work, but they aren't zero-setup. Tampermonkey and Violentmonkey are both MV3 extensions that use `chrome.userScripts`. On Chrome 138 and later, the user has to switch on a per-extension "Allow User Scripts" toggle; older Chrome needed Developer mode instead. Once that's done, a script can read page globals (`unsafeWindow` or `@sandbox raw`), run at `document-start`, and catch clicks with ordinary DOM listeners. It can't use Chrome's side panel, so the panel has to be a floating `div` injected into the page.

**Bookmarklets** have the least setup and run in the page's main world. They have to be re-clicked after every page load, though. The bigger risk is that all22pokemon.com sends a strict CSP (`script-src 'self'`, `style-src 'self'`, no `'unsafe-inline'`), and Chrome may refuse to run a `javascript:` URL under it. The CSP3 spec says it "SHOULD NOT" block bookmarklets, but I couldn't confirm what Chrome does today, so this needs a 30-second manual test.

**A separate local app** can't read the site's localStorage, because of the same-origin policy. It would need a bridge. The Chrome DevTools Protocol (CDP) bridge only works since Chrome 136 if Chrome is launched with a separate `--user-data-dir`, which means a separate profile, not the user's normal browser. That makes it the clunkiest option.

## Findings
1. **The `chrome.userScripts` API exists from Chrome 120 (MV3). From Chrome 138 users enable it with a per-extension "Allow User Scripts" toggle; before 138 they needed Developer mode.** (High)
   - https://developer.chrome.com/docs/extensions/reference/api/userScripts
   - > "The **Allow User Scripts** toggle is on each extension's details page."
   - The page's availability section says "Chrome 120+ MV3+", and its sample version check uses `if (version >= 138)` to pick which toggle to tell users about.
   - https://www.tampermonkey.net/faq.php?q=Q209. The summarizer only paraphrased Q209 here: Tampermonkey 5.3+ needs either "Allow User Scripts" (Chrome 138+, under right-click icon, then Manage Extension) or Developer Mode. It says this two-step authorization exists because the `userScripts` permission alone shows no install warning. Independent agreement, but paraphrased, so no verbatim quote.
2. **User scripts registered through the API default to the `USER_SCRIPT` world, which is exempt from the page's CSP. Scripts can also run in the main world.** (High)
   - https://developer.chrome.com/docs/extensions/reference/api/userScripts
   - > "the execution environment that is specific to user scripts and is exempt from the page's CSP."
   - > "Both user and content scripts can run in an isolated world or in the main world."
   - > "Scripts running in the main world are accessible to host pages and other extensions."
3. **Violentmonkey is still on the Chrome Web Store as an MV3 build. A separate MV2 build exists only for legacy browsers.** (Medium: primary source, but the MV3 rollout date is unclear)
   - https://violentmonkey.github.io/get-it/
   - > "Manifest V3 · for Chrome and Chromium-based browsers"
   - > "Manifest V2 · for legacy or Chromium-based browsers that require MV2"
   - The get-it page doesn't mention the "Allow User Scripts" toggle. That it's needed is an inference from Finding 1, since the MV3 build presumably uses the same API.
4. **Tampermonkey userscripts can reach the page's real `window` through `unsafeWindow` or `@sandbox raw`/`JavaScript`, and can run as early as `document-start`.** (Medium: Tampermonkey's own docs, but the fetch only returned fragments)
   - https://www.tampermonkey.net/documentation.php?q=unsafeWindow
   - > "provides access to the `window` object of the page that Tampermonkey is running on"
   - https://www.tampermonkey.net/documentation.php?q=sandbox
   - > "a script for compatibility reasons always needs to run in page context" (describes `raw`, the default)
   - > "Use this access mode if the script only needs DOM and no direct `unsafeWindow` access." (`DOM` mode, which would NOT see page globals)
   - https://www.tampermonkey.net/documentation.php?q=run_at
   - > "The script will be injected as fast as possible." (`document-start`)
   - localStorage doesn't need `unsafeWindow`, because it's per-origin and visible from any world on the page. Only JS globals such as the scoring functions need the page world. (Low: my inference)
5. **all22pokemon.com sends a strict CSP: `script-src 'self'`, `style-src 'self' https://fonts.googleapis.com`, no `'unsafe-inline'`, plus `frame-ancestors 'none'` and `X-Frame-Options: DENY`.** (High: observed directly)
   - Command: `curl -sIL https://all22pokemon.com` on 2026-10-15. Response header:
   - > "content-security-policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://pbs.twimg.com; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
   - What this means for the options: a bookmarklet can't load its code from an external URL, and a local app can't embed the site in an iframe.
6. **Under a `style-src` without `'unsafe-inline'`, injected `<style>` elements and `style="..."` attributes are blocked, but setting `element.style.prop` directly is not.** This matters for any injected floating panel, and for `GM_addStyle`, which inserts a `<style>` element. (High for the CSP rule; Low for how it affects `GM_addStyle`, which I didn't verify)
   - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src
   - > "Inline style attributes are also blocked:"
   - > "However, styles properties that are set directly on the element's `style` property will not be blocked, allowing users to safely manipulate styles via JavaScript:"
   - > "However no browser currently blocks these methods, so there is no need to apply `unsafe-eval`." (on CSSOM `insertRule()` / `cssText` setters)
   - Practical fallbacks: style the panel with `el.style.x = ...` or `CSSStyleSheet.insertRule`. Whether Tampermonkey's MV3 `GM_addStyle` gets past page CSP (for example via the extension's CSS injection) is unverified.
7. **Bookmarklets: CSP3 says page policy "SHOULD NOT" interfere with bookmarklets. MDN lists `javascript:` URLs as inline script that `script-src` blocks without `'unsafe-inline'`.** (Medium)
   - https://www.w3.org/TR/CSP3/ (section 9.1)
   - > "SHOULD NOT interfere with the operation of user-agent features like addons, extensions, or bookmarklets."
   - https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP
   - > "JavaScript in a `javascript:` URL:" (listed under inline JavaScript that CSP blocks)
   - What Chrome actually does in 2026 is unconfirmed. See Conflicts.
8. **Same-origin policy: a separate local page or app cannot read all22pokemon.com's localStorage.** (High)
   - https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy
   - > "Each origin gets its own separate storage, and JavaScript in one origin cannot read from or write to the storage belonging to another origin."
9. **Since Chrome 136, `--remote-debugging-port` is ignored on the default profile. It now requires `--user-data-dir` pointing to a non-default directory.** (High)
   - https://developer.chrome.com/blog/remote-debugging-port
   - > "from Chrome 136 we're making changes to the behavior of `--remote-debugging-port` and `--remote-debugging-pipe`."
   - > "These switches must now be accompanied by the `--user-data-dir` switch to point to a non-standard directory."
   - What this means here: a CDP-based helper has to launch a second Chrome with its own profile. The user's existing all22pokemon localStorage won't be in that profile unless they play there instead.

## Pros/cons summary (built from the findings above; the comparison itself is my synthesis)

| Option | Setup friction | Persistent side panel | Read globals / localStorage | Detect clicks in page |
|---|---|---|---|---|
| Userscript (TM/VM) | Medium. Install the manager, flip "Allow User Scripts" (Chrome 138+), paste the script. Runs automatically on every load after that (F1, F3) | No Chrome side panel. A floating `div` re-injected each load is effectively persistent. Style it via CSSOM, not `<style>` or `style=` (F5, F6) | Yes, via `unsafeWindow` / `@sandbox raw`. Can hook early with `document-start` (F4) | Yes, with normal `addEventListener('click', ..., true)` on the document |
| Bookmarklet | Lowest: drag a link to the bookmarks bar. No install | No. Must re-click after every reload or navigation (SPA route changes keep it alive). Same CSS limits as above | Yes if it runs, since it's in the page's main world | Yes, while it's alive |
| Local app plus bridge | High. Copy-paste of state is manual. CDP needs a separate Chrome launched with `--remote-debugging-port` and `--user-data-dir` (F9) | Yes. Its own window can stay open | Not directly (F8). Only through CDP `Runtime.evaluate` or copy-paste | Only via CDP (add a binding or poll), so complex |

## Conflicts
- **Do bookmarklets run under a strict page CSP in Chrome?** The CSP3 spec says policy "SHOULD NOT interfere with … bookmarklets" (https://www.w3.org/TR/CSP3/). MDN lists `javascript:` URLs as inline script blocked by `script-src` without `'unsafe-inline'` (https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP). Search snippets (not fetched) included a W3C list post saying Chrome lets the bookmarklet itself run, and a 2023 blog post and a Loggly-related post reporting bookmarklets blocked by CSP. Can't tell. **Test directly:** add a bookmark with URL `javascript:alert(Object.keys(localStorage))` and click it on all22pokemon.com. If the console shows "Refused to execute…", bookmarklets are out.

## Unverified
- How long a bookmarklet can be in Chrome. Not researched. Chrome's URL limit is about 2 MB, from memory and not fetched. Not likely to bind for a small helper, but the scoring logic would need to be inlined because `script-src 'self'` blocks loading external code.
- Whether Tampermonkey/Violentmonkey `GM_addStyle` gets past a strict page `style-src` under MV3.
- Whether `@grant none` makes Tampermonkey scripts run in the page context. The docs pages I fetched didn't cover `@grant`.
- When exactly Violentmonkey's Chrome MV3 build shipped. Search snippets mention Chrome Web Store reviews of v2.43.0 dated July 2026 and rocky early MV3 versions (extscope / Vivaldi forum, not fetched).
- Whether userscripts can use `chrome.sidePanel`. No fetched source says so outright. It's an inference from the fact that userscripts are page-injected code, not extension pages, and the GM_* API has no side-panel equivalent. (Low)

## Leads
- The site's CSP also affects option 1 (an MV3 extension). Content scripts in the isolated world are not bound by page CSP for their own JS, but any `<style>` they inject into the page DOM probably is. Injecting into a Shadow DOM, or using `chrome.scripting.insertCSS`, may be needed. Worth telling r1.
- `X-Frame-Options: DENY` / `frame-ancestors 'none'` rules out embedding the site in an iframe inside a helper page.
- If page globals are module-scoped (bundled by Vite/webpack on Vercel), there may be no `window` globals to read at all. Then any option has to re-implement the scoring or hook in at `document-start`. That's for r2 (site DOM/JS).

## Sources read
- https://developer.chrome.com/docs/extensions/reference/api/userScripts (Chrome docs, current): versions 120/138, toggles, `USER_SCRIPT` world is CSP-exempt
- https://developer.chrome.com/blog/remote-debugging-port (Chrome blog, 2025): Chrome 136 `--user-data-dir` requirement
- https://www.tampermonkey.net/faq.php and faq.php?q=Q209 (Tampermonkey): Allow User Scripts / Developer Mode requirement (paraphrased by the fetch tool)
- https://www.tampermonkey.net/documentation.php, ?q=unsafeWindow, ?q=sandbox, ?q=run_at (Tampermonkey): `unsafeWindow`, `@sandbox`, `@run-at`
- https://violentmonkey.github.io/get-it/ (Violentmonkey): MV3 build on the Chrome Web Store, MV2 for legacy
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP (MDN): `javascript:` URLs count as inline script
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src (MDN): what strict `style-src` blocks and allows
- https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy (MDN): storage is per-origin
- https://www.w3.org/TR/CSP3/ (W3C): bookmarklets "SHOULD NOT" be interfered with
- https://codereview.chromium.org/7748022/ (Chromium, 2011): not relevant to CSP; it covers bookmarklets on chrome: URLs
- `curl -sIL https://all22pokemon.com` (2026-10-15): live CSP and X-Frame-Options headers
