import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { fit, teamScore, type Formation, type Lineup } from "./engine";

// The oracle: the site's three scripts run as classic scripts in one global scope, the way the
// page loads them. Independent of our Vite wrapper, so a broken wrapper can't agree with itself.
type GameScheme = { def: string; off: string };
type Game = {
  DRAFT: {
    positionScore(id: number, slot: string, scheme: GameScheme): number;
    teamScore(
      lineup: Record<string, number>,
      scheme: GameScheme,
      variant: string,
    ): { score: number; offense: number; defense: number };
  };
};
const game: Game = (() => {
  const context = vm.createContext({});
  for (const file of ["pokemon.js", "pokedata.js", "draft.js"]) {
    vm.runInContext(readFileSync(`vendor/${file}`, "utf8"), context, { filename: file });
  }
  return vm.runInContext("({ DRAFT })", context) as Game;
})();

const THREE_FOUR_FULLBACK: Formation = { defense: "34", offense: "fb" };
const FOUR_THREE_SLOT: Formation = { defense: "43", offense: "slot" };

// Alakazam (65), Steelix (208), Crobat (169), Machamp (68)
const POKEMON = [65, 208, 169, 68];

describe("fit", () => {
  it.each(POKEMON)("Pokémon #%i at QB, LG and CB1 in a 3-4/fullback gets the game's fit", (id) => {
    for (const spot of ["QB", "LG", "CB1"] as const) {
      expect(fit(id, spot, THREE_FOUR_FULLBACK)).toBe(
        game.DRAFT.positionScore(id, spot, { def: "34", off: "fb" }),
      );
    }
  });

  it.each(POKEMON)(
    "Pokémon #%i in a 4-3/slot gets the game's fit, and a new one where the formation changes the role",
    (id) => {
      for (const spot of ["QB", "LG", "CB1", "NT", "ILB1", "ILB2", "FB"] as const) {
        expect(fit(id, spot, FOUR_THREE_SLOT)).toBe(
          game.DRAFT.positionScore(id, spot, { def: "43", off: "slot" }),
        );
      }
      // NT→DT, ILB1→MLB, ILB2→DT, FB→SLOT
      for (const spot of ["NT", "ILB1", "ILB2", "FB"] as const) {
        expect(fit(id, spot, FOUR_THREE_SLOT)).not.toBe(fit(id, spot, THREE_FOUR_FULLBACK));
      }
    },
  );
});

// A full lineup, one Pokémon per spot.
const LINEUP: Lineup = {
  QB: 65,
  HB: 59,
  FB: 76,
  WR1: 26,
  WR2: 22,
  TE: 130,
  LT: 208,
  LG: 95,
  C: 143,
  RG: 112,
  RT: 306,
  DE1: 68,
  DE2: 149,
  NT: 76,
  OLB1: 214,
  OLB2: 107,
  ILB1: 248,
  ILB2: 128,
  CB1: 169,
  CB2: 94,
  S1: 18,
  S2: 196,
};

describe("team score", () => {
  it.each([THREE_FOUR_FULLBACK, FOUR_THREE_SLOT])(
    "a full lineup gets the game's team score on both the all and retro curves (%o)",
    (formation) => {
      const scheme = { def: formation.defense, off: formation.offense };
      const all = teamScore(LINEUP, formation, "all");
      const retro = teamScore(LINEUP, formation, "retro");
      expect(all).toEqual(game.DRAFT.teamScore(LINEUP, scheme, "all"));
      expect(retro).toEqual(game.DRAFT.teamScore(LINEUP, scheme, "retro"));
      expect(all.score).not.toBe(retro.score);
    },
  );
});
