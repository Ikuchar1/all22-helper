# Chrome MV3 platform mechanics for a side-panel helper on all22pokemon.com (sidePanel, MAIN vs ISOLATED worlds, localStorage, messaging, load unpacked, minimal manifest)

Researched 2026-10-15. Budget: hard, used 17 tool calls.

## Answer
To declare the panel, add `"permissions": ["sidePanel"]` and `"side_panel": {"default_path": "sidepanel.html"}`. The service worker calls `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` so that clicking the toolbar icon opens the panel. To limit the panel to one site, the official cookbook sample listens to `tabs.onUpdated` and calls `setOptions({tabId, path, enabled: true})` when the origin matches and `setOptions({tabId, enabled: false})` otherwise. That sample omits `default_path` and requests the `"tabs"` permission so it can read `tab.url`. `sidePanel` needs Chrome 114+. `sidePanel.open()` needs Chrome 116+ and "may only be called in response to a user action."

Content scripts run by default in an isolated world: they share the DOM but cannot see page JS variables. Setting `"world": "MAIN"` in manifest `content_scripts` (Chrome 111+) or calling `scripting.executeScript({world: 'MAIN'})` (Chrome 95+) runs code in the page's own JS environment, where it can use globals like `DRAFT`. A MAIN-world script cannot use the content-script extension APIs, so it has to relay through `window.postMessage` (or a DOM event) to an isolated content script. That isolated script then calls `chrome.runtime.sendMessage`, which reaches every extension frame, including the side panel.

Content scripts share localStorage with the host page. The `storage` event does not fire in the window that made the change, so detecting same-tab changes takes polling or a MAIN-world wrapper around `setItem`. For development, load the extension through chrome://extensions → Developer mode → Load unpacked. Content-script edits need an extension reload plus a reload of the host page. Edits to extension HTML pages need no reload.

## Findings
1. **Manifest declaration of the side panel: `sidePanel` permission plus `side_panel.default_path`. The API is Chrome 114+ and MV3+.** (High)
   - https://developer.chrome.com/docs/extensions/reference/api/sidePanel
   - > "Chrome 114+ MV3+"
   - > `"permissions": [ "sidePanel" ]` and `"side_panel": { "default_path": "sidepanel.html" }` (manifest snippets on the page)
   - MDN browser-compat-data (`webextensions/api/sidePanel.json`, read via raw GitHub) lists `"chrome": {"version_added": "114"}` for `sidePanel`.

2. **To make the toolbar icon open the panel, call `setPanelBehavior({ openPanelOnActionClick: true })`.** (High)
   - https://raw.githubusercontent.com/GoogleChrome/chrome-extensions-samples/main/functional-samples/cookbook.sidepanel-site-specific/service-worker.js
   - > "chrome.sidePanel\n  .setPanelBehavior({ openPanelOnActionClick: true })\n  .catch((error) => console.error(error));"
   - The sidePanel reference page shows the same call.

3. **The official site-specific sample enables the panel per tab on `tabs.onUpdated` and disables it everywhere else.** (High)
   - https://raw.githubusercontent.com/GoogleChrome/chrome-extensions-samples/main/functional-samples/cookbook.sidepanel-site-specific/service-worker.js
   - > "chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {\n  if (!tab.url) return;\n  const url = new URL(tab.url);\n  // Enables the side panel on google.com\n  if (url.origin === GOOGLE_ORIGIN) {\n    await chrome.sidePanel.setOptions({\n      tabId,\n      path: 'sidepanel.html',\n      enabled: true\n    });\n  } else {\n    // Disables the side panel on all other sites\n    await chrome.sidePanel.setOptions({\n      tabId,\n      enabled: false\n    });\n  }\n});"
   - The sample's manifest.json has **no** `side_panel.default_path`. It has `"permissions": ["sidePanel", "tabs"]`, `"background": {"service_worker": "service-worker.js"}`, and `"action": {"default_title": "Click to open panel"}`, plus a `_execute_action` command bound to `"Ctrl+B"` / `"Command+B"`. For all22pokemon, replace `GOOGLE_ORIGIN` with `https://all22pokemon.com` and check whether the site uses a `www.` prefix.
   - README: > "This example demonstrates how to display the side panel only on google.com using the Side Panel API."

4. **`sidePanel.open()` needs a user gesture and Chrome 116+.** (High)
   - https://developer.chrome.com/docs/extensions/reference/api/sidePanel
   - > "This may only be called in response to a user action."
   - The method is marked Chrome 116+. The What's New page lists Chrome 116 with "You can now open side panels programmatically." MDN BCD lists `OpenOptions` as `"version_added": "116"`.

5. **The side panel is an extension page, so it can use every chrome.* API, including `runtime.onMessage`, `tabs.sendMessage` and `storage`.** (High, primary source)
   - https://developer.chrome.com/docs/extensions/reference/api/sidePanel
   - > "As an extension page, side panels have access to all Chrome APIs."

6. **By default, content scripts run in an isolated world. They share the page's DOM but cannot see its JS variables.** (High)
   - https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
   - > "Content scripts live in an isolated world." Their variables are "not visible to the host page or other extensions' content scripts." They "share access to the page's DOM."

7. **Setting manifest `content_scripts[].world: "MAIN"` makes the script share the page's JS environment. This is supported in Chrome 111+.** (High)
   - https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts
   - > "The JavaScript world for a script to execute within. Defaults to "ISOLATED", which is the execution environment unique to the content script."
   - > "Choosing the "MAIN" world means the script will share the execution environment with the host page's JavaScript."
   - > "There are risks involved when using the "MAIN" world. The host page can access and interfere with the injected script."
   - Version: MDN browser-compat-data `webextensions/manifest/content_scripts.json` gives `"world": {"version_added": "111"}` for Chrome. Apple Developer Forums thread 728849 agrees: > "Google has been adding support for running content scripts in `world: "MAIN"` via either `registerContentScripts` or since Chrome 111 directly on `content_scripts` in the manifest."

8. **MAIN-world scripts have no content-script extension APIs (no `chrome.runtime`). They must relay to an isolated script.** (High)
   - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts
   - > "The web page's execution environment. This environment is shared with the web page without isolation. Scripts in this environment don't have any access to the APIs that are only available to content scripts."
   - Chrome docs list the APIs that isolated content scripts *do* get: `dom`, `i18n`, `storage`, and `runtime.connect()`, `runtime.getURL()`, `runtime.sendMessage()`, `runtime.onMessage`. > "Content scripts are unable to access other APIs directly." (https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
   - The Chrome manifest reference does not say this explicitly. MDN is the source that does.

9. **The official page-to-content-script bridge is `window.postMessage` plus a `message` listener in the content script.** (High)
   - https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
   - > "it must do so through the shared DOM."
   - > `window.postMessage({type : "FROM_PAGE", text : "Hello from the webpage!"}, "*");`
   - > `window.addEventListener("message", (event) => {` (the content script ignores messages whose source isn't its own window, then forwards them to the extension over a port)

10. **`scripting.executeScript` accepts `world: 'MAIN'` (Chrome 95+). It requires the `"scripting"` permission plus host_permissions or activeTab.** (High)
    - https://developer.chrome.com/docs/extensions/reference/api/scripting
    - > "MAIN": "Specifies the main world of the DOM, which is the execution environment shared with the host page's JavaScript."
    - > ScriptInjection `world` (Chrome 95+): "The JavaScript "world" to run the script in. Defaults to `ISOLATED`."
    - API availability: > "Chrome 88+ MV3+". RegisteredContentScript `world` is "Chrome 102+."
    - What's New, Chrome 95: > "The chrome.scripting API's executeScript() method can now inject scripts directly into a page's main world."

11. **`run_at: "document_start"` injects before the page's own scripts. The default is `document_idle`.** (High)
    - https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
    - > `document_start`: scripts run "before any other DOM is constructed or any other script is run."
    - > "Use "document_idle" whenever possible."
    - Implication (Low, inference): a MAIN-world script at `document_start` runs before draft.js has defined `DRAFT`. That is the right time to wrap `Storage.prototype.setItem`. Reading `DRAFT`/`POKEDATA` needs `document_idle` (or deferring until after load).

12. **Content scripts share web storage (localStorage) with the host page.** (High, primary source)
    - https://developer.chrome.com/docs/extensions/reference/api/storage
    - > "Content scripts share storage with the host page."
    - So an ordinary isolated content script can read `localStorage.getItem('pokemon-all22-draft-v1')` directly. No MAIN world is needed just to *read* it.

13. **The `storage` event does not fire in the window that made the change.** (High; consistent with Already known)
    - https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event
    - > "The storage event of the Window interface fires when another document that shares the same storage area (either localStorage or sessionStorage) as the current window updates that storage area."
    - > "The event is not fired on the window that made the change."
    - Same-tab detection options: poll `localStorage` from the isolated script; watch the DOM with MutationObserver; or wrap `Storage.prototype.setItem` in a MAIN-world script at `document_start` and post a message after each call. These options are **my inference (Low)**. No fetched doc prescribes them.

14. **`runtime.sendMessage` from a content script reaches every extension frame except the sender's, which includes the side panel. It cannot reach content scripts.** (High)
    - https://developer.chrome.com/docs/extensions/reference/api/runtime
    - > "If sending to your extension, the runtime.onMessage event will be fired in every frame of your extension (except for the sender's frame)."
    - > "Note that extensions cannot send messages to content scripts using this method." The panel must use `tabs.sendMessage` (or `tabs.connect`) to talk to a content script.

15. **One-shot messaging works through `runtime.sendMessage` / `tabs.sendMessage(tab.id, ...)` and `onMessage`. Long-lived messaging works through `runtime.connect` ports.** (High)
    - https://developer.chrome.com/docs/extensions/develop/concepts/messaging
    - > `const response = await browser.runtime.sendMessage({greeting: "hello"});`
    - > `browser.tabs.sendMessage(tab.id, {greeting: "hello"}, function(response) {`
    - > "To respond asynchronously using `sendResponse()`, return a literal `true`"
    - > "From Chrome 148, you can return a promise from a message listener to respond asynchronously."
    - > `const port = browser.runtime.connect({name: "knockknock"});` / `port.postMessage({joke: "Knock knock"});`
    - The runtime reference says `runtime.connect` "does not connect to any listeners in a content script". The panel uses `tabs.connect` to reach one.
    - Note: the current docs pages render their examples with the `browser.` namespace. Chrome code uses `chrome.` (the official sample uses `chrome.`).

16. **`chrome.storage.session` can serve as a shared state store instead of messages, but content scripts need `setAccessLevel` to use it.** (High, primary source)
    - https://developer.chrome.com/docs/extensions/reference/api/storage
    - > "Session storage holds data in memory while an extension is loaded."
    - > "The storage is cleared if the extension is disabled, reloaded, updated, and when the browser restarts."
    - > "The storage limit is 10 MB (1 MB in Chrome 111 and earlier)." It is available in Chrome 102+.
    - Content scripts get no access by default. The page says "this behavior can be changed by calling" `storage.session.setAccessLevel()`, and the enum value is "TRUSTED_AND_UNTRUSTED_CONTEXTS". The panel listens with `storage.onChanged`: > "To track changes made to storage, add a listener to its `onChanged` event."
    - Using it requires the `"storage"` permission (my knowledge, not quoted; Low).

17. **Load unpacked and reload behavior.** (High, primary source)
    - https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world
    - > "Go to the Extensions page by entering `chrome://extensions` in a new tab."
    - > "Enable Developer Mode by clicking the toggle switch next to **Developer mode**."
    - > "Click the **Load unpacked** button and select the extension directory."
    - Reload table: Manifest "Yes"; Service worker "Yes"; Content scripts "Yes (plus the host page)"; Popup "No"; Options page "No"; Other extension HTML pages "No". The table does not list the side panel. It is an extension HTML page, so by inference it needs no extension reload, but reopen or refresh the panel (Low).

18. **Minimal manifest (assembled from the sources above; Medium).**
    ```json
    {
      "manifest_version": 3,
      "name": "All22 helper",
      "version": "0.1",
      "minimum_chrome_version": "116",
      "background": { "service_worker": "service-worker.js" },
      "action": { "default_title": "Open helper" },
      "side_panel": { "default_path": "sidepanel.html" },
      "permissions": ["sidePanel", "tabs"],
      "host_permissions": ["https://all22pokemon.com/*"],
      "content_scripts": [
        { "matches": ["https://all22pokemon.com/*"], "js": ["bridge.js"], "run_at": "document_start" },
        { "matches": ["https://all22pokemon.com/*"], "js": ["main-world.js"], "world": "MAIN", "run_at": "document_start" }
      ]
    }
    ```
    - Add `"scripting"` only if you use `executeScript`, and `"storage"` only if you use `chrome.storage.session`. Whether to keep `default_path` or drop it like the sample (so the panel exists only on the target site) is a design choice. The `minimum_chrome_version` key and the exact host pattern are not quoted from a fetched page. Verify whether the site serves from `www.`.

## Conflicts
- **Where the Chrome 111 claim for manifest `world` comes from:** the Chrome manifest reference and the What's New page do not state a version. What's New mentions only Chrome 95 (executeScript MAIN) and Chrome 102 (dynamic registration). MDN browser-compat-data says 111, and an Apple forum post says 111. These agree with each other. The gap is only that Google's own pages are silent on the version.
- **`default_path` versus the site-specific sample:** the sidePanel reference shows `side_panel.default_path` in the manifest. The site-specific sample omits it and sets `path` per tab instead. If `default_path` is present, the panel is available on every site unless `setOptions({enabled:false})` turns it off per tab. Both approaches work. For a one-site panel, follow the sample.

## Unverified
- **The `window.DRAFT` versus bare `DRAFT` detail (Low, my knowledge):** a MAIN-world script can read any global by its bare name. If draft.js declares `DRAFT` with top-level `const`/`let`, though, `window.DRAFT` is `undefined`, because lexical globals are not window properties. Only `var`/function declarations or explicit `window.X =` assignments appear on `window`. Check how draft.js declares them (that is r2's job).
- **CustomEvent `detail` crossing worlds:** object `detail` values may not reliably cross from the MAIN world to the isolated world. Sending a JSON string or using `window.postMessage` (structured clone) is the safe route. Not verified in a fetched source.
- Reading `tab.url` in `tabs.onUpdated` needs either the `"tabs"` permission (as in the sample) or a matching host permission. This is general knowledge; I did not fetch a page stating it.
- If the extension is reloaded while a tab is open, content scripts already in that tab lose their connection ("Extension context invalidated"). This is consistent with the "plus the host page" reload row, but not quoted.

## Leads
- Firefox and Safari do not support `sidePanel` (MDN BCD lists `false`). Irrelevant if the target is Chrome only.
- The `_execute_action` keyboard shortcut (Cmd+B on macOS) in the sample is a cheap way to toggle the panel.
- Chrome 146/148 changed `onMessage` error and promise semantics (messaging doc). These matter only if you target recent Chrome versions.

## Sources read
- https://developer.chrome.com/docs/extensions/reference/api/sidePanel (Chrome for Developers, current): manifest keys, setPanelBehavior, setOptions, open() gesture rule, versions 114/116.
- https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/functional-samples/cookbook.sidepanel-site-specific and raw service-worker.js / manifest.json (Google, 2023): exact sample code and manifest.
- https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts: isolated worlds, run_at, postMessage bridge, APIs available to content scripts.
- https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts: `world` key, MAIN-world risk warning.
- https://developer.chrome.com/docs/extensions/reference/api/scripting: ExecutionWorld, executeScript world (95+), permissions.
- https://developer.chrome.com/docs/extensions/develop/concepts/messaging: sendMessage, tabs.sendMessage, return true / promise (148), ports.
- https://developer.chrome.com/docs/extensions/reference/api/runtime: sendMessage reaches every extension frame and not content scripts; connect does not reach content scripts.
- https://developer.chrome.com/docs/extensions/reference/api/storage: storage.session details; content scripts share web storage with the host page.
- https://developer.chrome.com/docs/extensions/whats-new: Chrome 95, 102, 114 and 116 entries.
- https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world: Load unpacked steps and reload table.
- https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event (MDN): storage event not fired in the same window.
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts (MDN): MAIN world has no content-script APIs; document_start semantics.
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/webextensions/manifest/content_scripts.json and .../api/sidePanel.json (MDN BCD): world = Chrome 111, sidePanel = 114, open = 116.
- https://developer.apple.com/forums/thread/728849 (Apple Developer Forums, 2023): second source for Chrome 111 manifest MAIN world.
