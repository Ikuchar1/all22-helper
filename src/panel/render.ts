import type { Header, HoverLine, PanelView, Table } from "./view";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

const VARIANT_LABEL = { all: "All regions", retro: "Retro" } as const;

function header({ round, roll, variant, rerollsLeft }: Header): HTMLElement {
  const box = el("header");
  const rollText = roll ? `${roll.type} ${roll.region}` : "Waiting for the roll";
  box.append(
    el("h1", `Round ${round} · ${rollText}`),
    el(
      "p",
      `${VARIANT_LABEL[variant]} · Rerolls left: type ${rerollsLeft.type}, region ${rerollsLeft.region}`,
      "meta",
    ),
  );
  return box;
}

function table({ spots, rows }: Table): HTMLElement {
  if (rows.length === 0 || spots.length === 0) return el("p", "No candidates for this roll.");
  const wrap = el("div", undefined, "table-wrap");
  const grid = el("table");
  const head = el("tr");
  head.append(el("th", "Pokémon"), ...spots.map((spot) => el("th", spot)));
  const body = el("tbody");
  for (const row of rows) {
    const tr = el("tr");
    tr.append(el("th", row.legendary ? `${row.name} ★` : row.name, "name"));
    for (const cell of row.cells) {
      const classes = [
        cell.bestForCandidate ? "best-candidate" : "",
        cell.bestForSpot ? "best-spot" : "",
      ];
      tr.append(el("td", String(cell.fit), classes.filter(Boolean).join(" ")));
    }
    body.append(tr);
  }
  const thead = el("thead");
  thead.append(head);
  grid.append(thead, body);
  wrap.append(grid);
  return wrap;
}

function hoverLine(line: HoverLine | null): HTMLElement {
  if (!line) return el("p", "Hover a candidate on the page to see its best spots.", "hover muted");
  const label = line.source === "focus" ? "Hovering" : "Pending";
  const best = line.spots.map(({ spot, fit }) => `${spot} ${fit}`).join(", ");
  return el("p", `${label}: ${line.name} — best: ${best}`, "hover");
}

/** Replaces the panel's contents with the view. */
export function render(root: HTMLElement, view: PanelView): void {
  if (view.kind === "empty") {
    root.replaceChildren(
      el("p", "No run in progress. Start a 17–0 draft on all22pokemon.com.", "empty"),
    );
    return;
  }
  root.replaceChildren(header(view.header), table(view.table), hoverLine(view.hoverLine));
}
