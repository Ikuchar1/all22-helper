// Runs on all22pokemon.com. Sends the saved run and the Pokémon in focus to the side panel.
// Built as one self-contained classic script (vite.config.ts): content scripts can't import.
import type { PageMessage, RequestStateMessage } from "../messages";
import { dexIdFrom } from "./candidate";

const RUN_KEY = "pokemon-all22-draft-v1";
const POLL_MS = 1000;

// undefined = nothing sent yet, so the first read always goes out.
let sentRun: string | null | undefined;
let focus: number | null = null;

function send(message: PageMessage): void {
  // Rejects when no panel is open to receive it; the panel asks again when it opens.
  chrome.runtime.sendMessage(message).catch(() => {});
}

function sendRun(force = false): void {
  const json = localStorage.getItem(RUN_KEY);
  if (!force && json === sentRun) return;
  sentRun = json;
  send({ kind: "run", json });
}

function setFocus(dexId: number | null): void {
  if (dexId === focus) return;
  focus = dexId;
  send({ kind: "focus", dexId });
}

// The game sets body[data-dp] on every phase change (setup, turn, placing, done). It saves the
// run from several code paths, so a poll backs the observer up.
new MutationObserver(() => sendRun()).observe(document.body, {
  attributes: true,
  attributeFilter: ["data-dp"],
});
setInterval(() => sendRun(), POLL_MS);
sendRun();

// The pick list is rebuilt on every roll, so listen on the document.
document.addEventListener("mouseover", (event) => setFocus(dexIdFrom(event.target)));
document.addEventListener("click", (event) => {
  const dexId = dexIdFrom(event.target);
  if (dexId !== null) setFocus(dexId);
});

chrome.runtime.onMessage.addListener((message: RequestStateMessage) => {
  if (message.kind !== "request-state") return;
  sendRun(true);
  send({ kind: "focus", dexId: focus });
});
