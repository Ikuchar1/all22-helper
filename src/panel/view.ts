import type { Run } from "../run/parse-run";

/** What the side panel shows, worked out from the run and the Pokémon in focus. */
export type PanelView = { kind: "empty" } | { kind: "run" };

export function panelView(run: Run | null, _focusDexId: number | null): PanelView {
  if (!run || run.finished) return { kind: "empty" };
  return { kind: "run" };
}
