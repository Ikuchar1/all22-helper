// The extension's background service worker: the toolbar icon opens the side panel, and the
// panel is enabled only on the game's site.
import { isGameUrl } from "./game-url";

const PANEL_PATH = "panel.html";

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

function updatePanel(tabId: number, url: string | undefined): void {
  const options = isGameUrl(url)
    ? { tabId, path: PANEL_PATH, enabled: true }
    : { tabId, enabled: false };
  chrome.sidePanel.setOptions(options).catch(console.error);
}

chrome.tabs.onUpdated.addListener((tabId, _info, tab) => updatePanel(tabId, tab.url));
chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId).then((tab) => updatePanel(tabId, tab.url), console.error);
});
