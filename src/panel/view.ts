import type { Run } from "../run/parse-run";
import {
  candidatesFor,
  fit,
  openSpots,
  regionName,
  type Spot,
  type Variant,
} from "../scoring/engine";

export type Header = {
  /** 1-based, as the game shows it. */
  round: number;
  roll: { type: string; region: string } | null;
  variant: Variant;
  rerollsLeft: { type: number; region: number };
};

export type Cell = {
  spot: Spot;
  fit: number;
  /** The candidate's best fit among the open spots (ties all flagged). */
  bestForCandidate: boolean;
  /** The best fit any candidate has at this spot (ties all flagged). */
  bestForSpot: boolean;
};
export type Row = { dexId: number; name: string; legendary: boolean; cells: Cell[] };
/** Every candidate for the roll × every open spot. */
export type Table = { spots: Spot[]; rows: Row[] };

/** What the side panel shows, worked out from the run and the Pokémon in focus. */
export type PanelView = { kind: "empty" } | { kind: "run"; header: Header; table: Table };

// The game stores types lowercase ("fire").
const typeLabel = (type: string) => type.charAt(0).toUpperCase() + type.slice(1);

function tableFor(run: Run): Table {
  const spots = openSpots(run);
  const candidates = candidatesFor(run).map((candidate) => ({
    candidate,
    fits: spots.map((spot) => fit(candidate.dexId, spot, run.formation)),
  }));
  const bestAtSpot = spots.map((_, i) => Math.max(...candidates.map((c) => c.fits[i]!)));
  const rows = candidates.map(({ candidate, fits }) => {
    const best = Math.max(...fits);
    return {
      ...candidate,
      cells: spots.map((spot, i) => ({
        spot,
        fit: fits[i]!,
        bestForCandidate: fits[i] === best,
        bestForSpot: fits[i] === bestAtSpot[i],
      })),
    };
  });
  return { spots, rows };
}

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
    table: tableFor(run),
  };
}
