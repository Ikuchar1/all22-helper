import type { Run } from "../run/parse-run";
import {
  available,
  fit,
  isLegendary,
  LEGEND_CAP,
  rollFor,
  spotsOf,
  teamScore,
  type Formation,
  type FullLineup,
  type Lineup,
  type Spot,
  type SpotInfo,
} from "../scoring/engine";

/** A source of random numbers, 0 ≤ x < 1. */
export type Random = () => number;

/** Fits are fixed per formation, so each (dex id, spot) is computed once and kept. */
const fitCaches = new Map<string, Map<number, number>>();

function fitsFor(formation: Formation): (dexId: number, spot: SpotInfo, index: number) => number {
  const key = formation.defense + formation.offense;
  let cache = fitCaches.get(key);
  if (!cache) fitCaches.set(key, (cache = new Map()));
  const fits = cache;
  return (dexId, spot, index) => {
    const cacheKey = dexId * 32 + index;
    let value = fits.get(cacheKey);
    if (value === undefined) fits.set(cacheKey, (value = fit(dexId, spot.spot, formation)));
    return value;
  };
}

/** A seed for the game's roll, drawn from the random source. */
const seedFrom = (random: Random): number => Math.floor(random() * 4294967296) | 0;

/**
 * One simulated draft: the rest of the run rolled the way the game rolls, drafted by the greedy
 * drafter (each round, the candidate × open spot with the highest fit × spot weight).
 */
export function simulatedDraft(run: Run, random: Random): FullLineup {
  const spots = spotsOf(run.formation);
  const fitOf = fitsFor(run.formation);
  const lineup: Lineup = { ...run.lineup };
  const taken = new Set(Object.values(lineup));
  let legends = [...taken].filter(isLegendary).length;
  const open = spots.map((_, i) => i).filter((i) => lineup[spots[i]!.spot] === undefined);

  const place = (candidates: number[]) => {
    let best = { score: -1, dexId: 0, at: 0 };
    for (const dexId of candidates) {
      for (let at = 0; at < open.length; at++) {
        const index = open[at]!;
        const spot = spots[index]!;
        const score = fitOf(dexId, spot, index) * spot.weight;
        if (score > best.score) best = { score, dexId, at };
      }
    }
    const [index] = open.splice(best.at, 1);
    lineup[spots[index!]!.spot] = best.dexId;
    taken.add(best.dexId);
    if (isLegendary(best.dexId)) legends++;
  };

  // A picked but unplaced Pokémon is the current round's pick: the greedy drafter places it first.
  let round = run.round;
  if (run.pending !== null) {
    place([run.pending]);
    round++;
  }
  for (; open.length > 0; round++) {
    const noLegends = legends >= LEGEND_CAP;
    const roll = rollFor(seedFrom(random), round, taken, noLegends, run.variant);
    place(available(roll.region, roll.type, taken, noLegends));
  }
  return lineup as FullLineup;
}

export type Simulation = {
  /** Open spot → the mean fit it ends up with across the simulated drafts. */
  ceilings: Partial<Record<Spot, number>>;
  /** Mean final Team Score (0–1000) of the simulated drafts, on the run's variant. */
  averageScore: number;
};

/** Ceilings for the run's open spots and the average final score, from `count` simulated drafts. */
export function simulate(run: Run, count: number, random: Random = Math.random): Simulation {
  const spots = spotsOf(run.formation);
  const fitOf = fitsFor(run.formation);
  const open = spots
    .map((spot, index) => ({ spot, index }))
    .filter(({ spot }) => run.lineup[spot.spot] === undefined);
  const totals = open.map(() => 0);
  let totalScore = 0;
  for (let i = 0; i < count; i++) {
    const lineup = simulatedDraft(run, random);
    open.forEach(({ spot, index }, at) => {
      totals[at]! += fitOf(lineup[spot.spot], spot, index);
    });
    totalScore += teamScore(lineup, run.formation, run.variant).score;
  }
  const ceilings: Partial<Record<Spot, number>> = {};
  open.forEach(({ spot }, at) => (ceilings[spot.spot] = totals[at]! / count));
  return { ceilings, averageScore: totalScore / count };
}
