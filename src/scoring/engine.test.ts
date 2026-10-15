import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import type { Run } from "../run/parse-run";
import {
  candidatesFor,
  fit,
  isLegendary,
  LEGEND_CAP,
  nameOf,
  poolOf,
  regionsOf,
  spotsOf,
  teamScore,
  typesOf,
  type Formation,
  type FullLineup,
} from "./engine";

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
    SLOT_ROLE: Record<string, string>;
    roleOf(slot: string, scheme: GameScheme): string;
    OFFENSE_BY: Record<string, Record<string, number>>;
    DEFENSE_BY: Record<string, Record<string, number>>;
    MAX_LEGENDS: number;
    available(
      gen: string,
      type: string,
      taken: Set<number>,
      noLegends?: boolean,
    ): { id: number; name: string; legendary: boolean }[];
    VARIANTS: Record<string, string[]>;
    POOL: Record<string, { id: number; name: string; legendary: boolean }[]>;
  };
  POKEDATA: { types: string[] }[];
  POKEMON_NAMES: string[];
  LEGENDARIES: Set<number>;
};
const game: Game = (() => {
  const context = vm.createContext({});
  for (const file of ["pokemon.js", "pokedata.js", "draft.js"]) {
    vm.runInContext(readFileSync(`vendor/${file}`, "utf8"), context, { filename: file });
  }
  return vm.runInContext("({ DRAFT, POKEDATA, POKEMON_NAMES, LEGENDARIES })", context) as Game;
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
const LINEUP: FullLineup = {
  QB: 65,
  HB: 59,
  FB: 75,
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

  it("a lineup with an empty spot can't be scored, since the game throws on one", () => {
    const { QB: _qb, ...missingQb } = LINEUP;
    expect(() => game.DRAFT.teamScore(missingQb, { def: "34", off: "fb" }, "all")).toThrow();
    // @ts-expect-error teamScore takes a full lineup only
    expect(() => teamScore(missingQb, THREE_FOUR_FULLBACK, "all")).toThrow();
  });
});

describe("spots", () => {
  it.each([THREE_FOUR_FULLBACK, FOUR_THREE_SLOT])(
    "every formation has 22 spots with the game's role and spot weight, each side summing to 1 (%o)",
    (formation) => {
      const scheme = { def: formation.defense, off: formation.offense };
      const spots = spotsOf(formation);
      expect(spots.map((s) => s.spot).sort()).toEqual(Object.keys(game.DRAFT.SLOT_ROLE).sort());
      for (const { spot, role, side, weight } of spots) {
        expect(role).toBe(game.DRAFT.roleOf(spot, scheme));
        const weights =
          side === "offense"
            ? game.DRAFT.OFFENSE_BY[scheme.off]
            : game.DRAFT.DEFENSE_BY[scheme.def];
        expect(weight).toBe(weights?.[spot]);
      }
      for (const side of ["offense", "defense"] as const) {
        const sum = spots.filter((s) => s.side === side).reduce((total, s) => total + s.weight, 0);
        expect(sum).toBeCloseTo(1, 9);
      }
    },
  );
});

describe("game data", () => {
  it("the retro variant rolls the game's regions", () => {
    expect(regionsOf("retro")).toEqual([...(game.DRAFT.VARIANTS.retro ?? [])]);
    expect(regionsOf("all")).toEqual([...(game.DRAFT.VARIANTS.all ?? [])]);
  });

  it("each region's pool lists the game's Pokémon with names and legendary flags", () => {
    for (const region of regionsOf("all")) {
      expect(poolOf(region)).toEqual(
        (game.DRAFT.POOL[region] ?? []).map((p) => ({
          dexId: p.id,
          name: p.name,
          legendary: p.legendary,
        })),
      );
    }
  });

  it("types, names and legendary status match the game's data for every Pokémon", () => {
    game.POKEMON_NAMES.forEach((name, i) => {
      const dexId = i + 1;
      expect(nameOf(dexId)).toBe(name);
      expect(typesOf(dexId)).toEqual([...(game.POKEDATA[i]?.types ?? [])]);
      expect(isLegendary(dexId)).toBe(game.LEGENDARIES.has(dexId));
    });
  });

  it("the legend cap is the game's", () => {
    expect(LEGEND_CAP).toBe(game.DRAFT.MAX_LEGENDS);
  });
});

// A run in progress, signed out, 3-4/fullback.
const run = (overrides: Partial<Run> = {}): Run => ({
  round: 3,
  roll: { region: "1", type: "fire" },
  lineup: { QB: 65, LT: 208, CB1: 6 },
  pending: null,
  formation: THREE_FOUR_FULLBACK,
  variant: "all",
  rerollsLeft: { type: 1, region: 1 },
  seed: 42,
  signedIn: false,
  finished: false,
  ...overrides,
});
const asPool = (entries: { id: number; name: string; legendary: boolean }[]) =>
  entries.map((p) => ({ dexId: p.id, name: p.name, legendary: p.legendary }));

describe("candidates", () => {
  it("the candidates for a roll are the region's Pokémon of that type the game offers, minus the lineup", () => {
    // Charizard (6) is in the lineup and is a Kanto Fire-type.
    const kantoFire = run();
    const candidates = candidatesFor(kantoFire);
    expect(candidates).toEqual(asPool(game.DRAFT.available("1", "fire", new Set([65, 208, 6]))));
    expect(candidates.map((c) => c.dexId)).not.toContain(6);
    expect(candidates.map((c) => c.dexId)).toContain(4);

    const johtoWater = run({ roll: { region: "2", type: "water" } });
    expect(candidatesFor(johtoWater)).toEqual(
      asPool(game.DRAFT.available("2", "water", new Set([65, 208, 6]))),
    );
  });

  it("once the lineup has 3 Legendaries, Legendaries are no longer candidates; with 2 they are", () => {
    // Moltres (146) is Kanto's Legendary Fire-type. Articuno (144), Zapdos (145), Mewtwo (150).
    const twoLegends = run({ lineup: { QB: 150, LT: 144 } });
    expect(candidatesFor(twoLegends).map((c) => c.dexId)).toContain(146);

    const threeLegends = run({ lineup: { QB: 150, LT: 144, CB1: 145 } });
    const candidates = candidatesFor(threeLegends);
    expect(candidates).toEqual(
      asPool(game.DRAFT.available("1", "fire", new Set([150, 144, 145]), true)),
    );
    expect(candidates.map((c) => c.dexId)).not.toContain(146);
    expect(candidates.length).toBeGreaterThan(0);
  });
});
