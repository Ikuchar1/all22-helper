// Test-only: the oracle. The site's three scripts run as classic scripts in one global scope, the
// way the page loads them. Independent of our Vite wrapper, so a broken wrapper can't agree with
// itself. Never import this from extension code.
import { readFileSync } from "node:fs";
import vm from "node:vm";

type GameScheme = { def: string; off: string };
type PoolEntry = { id: number; name: string; legendary: boolean };

export type Game = {
  DRAFT: {
    positionScore(id: number, slot: string, scheme: GameScheme): number;
    teamScore(
      lineup: Record<string, number>,
      scheme: GameScheme,
      variant: string,
    ): { score: number; offense: number; defense: number };
    SLOT_ROLE: Record<string, string>;
    roleOf(slot: string, scheme: GameScheme): string;
    OFFENSE_BY: Record<string, Record<string, number>>;
    DEFENSE_BY: Record<string, Record<string, number>>;
    MAX_LEGENDS: number;
    REGIONS: Record<string, string>;
    available(gen: string, type: string, taken: Set<number>, noLegends?: boolean): PoolEntry[];
    VARIANTS: Record<string, string[]>;
    POOL: Record<string, PoolEntry[]>;
  };
  POKEDATA: { types: string[] }[];
  POKEMON_NAMES: string[];
  LEGENDARIES: Set<number>;
};

export const game: Game = (() => {
  const context = vm.createContext({});
  for (const file of ["pokemon.js", "pokedata.js", "draft.js"]) {
    vm.runInContext(readFileSync(`vendor/${file}`, "utf8"), context, { filename: file });
  }
  return vm.runInContext("({ DRAFT, POKEDATA, POKEMON_NAMES, LEGENDARIES })", context) as Game;
})();
