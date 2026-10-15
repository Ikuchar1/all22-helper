import type { Run } from "../run/parse-run";
import { regionName, type Variant } from "../scoring/engine";

export type Header = {
  /** 1-based, as the game shows it. */
  round: number;
  roll: { type: string; region: string } | null;
  variant: Variant;
  rerollsLeft: { type: number; region: number };
};

/** What the side panel shows, worked out from the run and the Pokémon in focus. */
export type PanelView = { kind: "empty" } | { kind: "run"; header: Header };

// The game stores types lowercase ("fire").
const typeLabel = (type: string) => type.charAt(0).toUpperCase() + type.slice(1);

export function panelView(run: Run | null, _focusDexId: number | null): PanelView {
  if (!run || run.finished) return { kind: "empty" };
  return {
    kind: "run",
    header: {
      round: run.round + 1,
      roll: run.roll && { type: typeLabel(run.roll.type), region: regionName(run.roll.region) },
      variant: run.variant,
      rerollsLeft: run.rerollsLeft,
    },
  };
}
