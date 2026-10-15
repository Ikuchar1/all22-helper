import type { Run } from "../run/parse-run";
import {
  available,
  fit,
  isLegendary,
  LEGEND_CAP,
  rollFor,
  spotsOf,
  type Formation,
  type FullLineup,
  type Lineup,
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

  for (let round = run.round; open.length > 0; round++) {
    const noLegends = legends >= LEGEND_CAP;
    const roll = rollFor(seedFrom(random), round, taken, noLegends, run.variant);
    place(available(roll.region, roll.type, taken, noLegends));
  }
  return lineup as FullLineup;
}
