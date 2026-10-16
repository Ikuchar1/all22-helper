// Side panel entry: keeps the latest run and focus from the game's tab and renders the view.
import type { PageMessage, RequestStateMessage } from "../messages";
import { parseRun, type Run } from "../run/parse-run";
import { render } from "./render";
import { panelView } from "./view";

const root = document.querySelector<HTMLElement>("#app")!;

let tabId: number | undefined;
let run: Run | null = null;
let focus: number | null = null;

const update = () => render(root, panelView(run, focus));

// runtime.sendMessage can't reach a content script, so ask the game's tab directly.
async function requestState(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  tabId = tab?.id;
  run = null;
  focus = null;
  update();
  if (tabId === undefined) return;
  const message: RequestStateMessage = { kind: "request-state" };
  // Rejects when the tab has no content script yet (e.g. opened before the extension loaded).
  chrome.tabs.sendMessage(tabId, message).catch(() => {});
}

chrome.runtime.onMessage.addListener((message: PageMessage, sender) => {
  if (sender.tab?.id !== tabId) return;
  if (message.kind === "run") run = parseRun(message.json);
  else if (message.kind === "focus") focus = message.dexId;
  else return;
  update();
});
chrome.tabs.onActivated.addListener(() => void requestState());

void requestState();
