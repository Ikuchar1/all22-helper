import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { fit, type Formation } from "./engine";

// The oracle: the site's three scripts run as classic scripts in one global scope, the way the
// page loads them. Independent of our Vite wrapper, so a broken wrapper can't agree with itself.
type GameScheme = { def: string; off: string };
type Game = {
  DRAFT: {
    positionScore(id: number, slot: string, scheme: GameScheme): number;
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
