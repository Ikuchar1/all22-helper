import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import type { Run } from "../run/parse-run";
import { simulatedDraft, type Random } from "./simulate";

// The oracle: the site's three scripts run as classic scripts in one global scope, the way the
// page loads them. Independent of our Vite wrapper, so a broken wrapper can't agree with itself.
type Game = {
  DRAFT: {
    rand(seed: number, i: number): number;
    SLOT_ROLE: Record<string, string>;
    MAX_LEGENDS: number;
    VARIANTS: Record<string, string[]>;
    POOL: Record<string, { id: number; name: string; legendary: boolean }[]>;
  };
  POKEDATA: { types: string[] }[];
  LEGENDARIES: Set<number>;
};
const game: Game = (() => {
  const context = vm.createContext({});
  for (const file of ["pokemon.js", "pokedata.js", "draft.js"]) {
    vm.runInContext(readFileSync(`vendor/${file}`, "utf8"), context, { filename: file });
  }
  return vm.runInContext("({ DRAFT, POKEDATA, LEGENDARIES })", context) as Game;
})();

/** A reproducible random source, from the game's own seeded generator. */
const seeded = (seed: number): Random => {
  let i = 0;
  return () => game.DRAFT.rand(seed, i++);
};

const ALL_SPOTS = Object.keys(game.DRAFT.SLOT_ROLE).sort();

const run = (overrides: Partial<Run> = {}): Run => ({
  round: 0,
  roll: null,
  lineup: {},
  pending: null,
  formation: { defense: "34", offense: "fb" },
  variant: "all",
  rerollsLeft: { type: 1, region: 1 },
  seed: null,
  signedIn: true,
  finished: false,
  ...overrides,
});

// Alakazam (65), Steelix (208), Crobat (169), Machamp (68)
const MID_RUN = run({ round: 4, lineup: { QB: 65, LT: 208, CB1: 169, DE1: 68 } });

describe("simulated draft", () => {
  it("fills every open spot, keeps the filled ones, and never drafts a taken Pokémon or one twice", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const lineup = simulatedDraft(MID_RUN, seeded(seed));
      expect(Object.keys(lineup).sort()).toEqual(ALL_SPOTS);
      expect(lineup).toMatchObject(MID_RUN.lineup);
      const ids = Object.values(lineup);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it.each([
    ["an empty lineup", run()],
    // Mewtwo (150), Lugia (249), Rayquaza (384): the legend cap is already used up
    ["a run with 3 legends", run({ round: 3, lineup: { QB: 150, DE1: 249, LT: 384 } })],
  ])("never drafts past the legend cap, from %s", (_, start) => {
    for (let seed = 1; seed <= 30; seed++) {
      const ids = Object.values(simulatedDraft(start, seeded(seed)));
      expect(ids.filter((id) => game.LEGENDARIES.has(id)).length).toBeLessThanOrEqual(
        game.DRAFT.MAX_LEGENDS,
      );
    }
  });
});
