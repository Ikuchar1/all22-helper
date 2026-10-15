import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import type { Run } from "../run/parse-run";
import { rollIndex, simulate, simulatedDraft, type Random } from "./simulate";

// The oracle: the site's three scripts run as classic scripts in one global scope, the way the
// page loads them. Independent of our Vite wrapper, so a broken wrapper can't agree with itself.
type Game = {
  DRAFT: {
    rand(seed: number, i: number): number;
    roll(
      seed: number,
      i: number,
      taken: Set<number>,
      noLegends: boolean,
      variant: string,
    ): { gen: string; type: string };
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

describe("indexed roll", () => {
  const poolIds = (region: string) => (game.DRAFT.POOL[region] ?? []).map((p) => p.id);
  const everyId = Object.keys(game.DRAFT.POOL).flatMap(poolIds);
  const randomTaken = (seed: number, density: number) => {
    const random = seeded(seed);
    return new Set(everyId.filter(() => random() < density));
  };
  const hasType = (type: string) => (id: number) => game.POKEDATA[id - 1]?.types.includes(type);
  const regular = (id: number) => !game.LEGENDARIES.has(id);
  const TAKEN: [string, Set<number>][] = [
    ["nothing", new Set()],
    ...[0.05, 0.2, 0.5, 0.8, 0.95].map((d, i): [string, Set<number>] => [
      `a random ${d * 100}%`,
      randomTaken(100 + i, d),
    ]),
    ["all of Johto", new Set(poolIds("2"))],
    ["every regular Kanto Pokémon", new Set(poolIds("1").filter(regular))],
    [
      "every Fire-type, and every regular Water-type",
      new Set([
        ...everyId.filter(hasType("fire")),
        ...everyId.filter(hasType("water")).filter(regular),
      ]),
    ],
  ];

  it.each(
    TAKEN.flatMap(([name, taken]) =>
      (["all", "retro"] as const).map((v) => [name, v, taken] as const),
    ),
  )(
    "deals the game's roll, the source of truth, with %s taken (%s variant)",
    (_, variant, taken) => {
      const fromSet = rollIndex(variant, taken);
      const fromTakes = rollIndex(variant, []);
      for (const id of taken) fromTakes.take(id);
      for (const noLegends of [false, true]) {
        for (let seed = 1; seed <= 40; seed++) {
          const round = seed % 22;
          const s = seed * 2654435761;
          const { gen, type } = game.DRAFT.roll(s, round, taken, noLegends, variant);
          const expected = { region: gen, type };
          expect(fromSet.roll(s, round, noLegends)).toEqual(expected);
          expect(fromTakes.roll(s, round, noLegends)).toEqual(expected);
        }
      }
    },
  );
});

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

  it.each(["all", "retro"] as const)(
    "every drafted Pokémon comes from a region the %s variant rolls",
    (variant) => {
      const regions = game.DRAFT.VARIANTS[variant] ?? [];
      const rollable = new Set(regions.flatMap((r) => (game.DRAFT.POOL[r] ?? []).map((p) => p.id)));
      for (let seed = 1; seed <= 30; seed++) {
        const lineup = simulatedDraft(run({ variant }), seeded(seed));
        for (const id of Object.values(lineup)) {
          expect(rollable.has(id), `#${id}`).toBe(true);
        }
      }
    },
  );

  it("a retro run only drafts Gen 1–4 Pokémon", () => {
    // Sinnoh ends at Arceus (493).
    for (let seed = 1; seed <= 30; seed++) {
      const ids = Object.values(simulatedDraft(run({ variant: "retro" }), seeded(seed)));
      expect(Math.max(...ids)).toBeLessThanOrEqual(493);
    }
  });

  it("a pending Pokémon ends up in the lineup", () => {
    // Charizard (6) picked but not yet placed
    const pending = run({ ...MID_RUN, pending: 6 });
    for (let seed = 1; seed <= 20; seed++) {
      const ids = Object.values(simulatedDraft(pending, seeded(seed)));
      expect(ids.filter((id) => id === 6)).toEqual([6]);
    }
  });
});

describe("simulate", () => {
  it("returns a ceiling for exactly the open spots, each 0–100, and an average score 0–1000", () => {
    const { ceilings, averageScore } = simulate(MID_RUN, 50, seeded(7));
    const open = ALL_SPOTS.filter((spot) => !(spot in MID_RUN.lineup));
    expect(Object.keys(ceilings).sort()).toEqual(open);
    for (const ceiling of Object.values(ceilings)) {
      expect(ceiling).toBeGreaterThanOrEqual(0);
      expect(ceiling).toBeLessThanOrEqual(100);
    }
    expect(averageScore).toBeGreaterThan(0);
    expect(averageScore).toBeLessThanOrEqual(1000);
  });

  it("the same seeded random source gives identical results twice", () => {
    expect(simulate(MID_RUN, 30, seeded(11))).toEqual(simulate(MID_RUN, 30, seeded(11)));
    expect(simulatedDraft(run(), seeded(12))).toEqual(simulatedDraft(run(), seeded(12)));
  });

  it("a spot's ceiling drops when the legends that would have filled it are already used", () => {
    // The same three spots filled, with Mewtwo (150), Lugia (249) and Rayquaza (384) in one
    // lineup and Alakazam (65), Steelix (208) and Crobat (169) in the other.
    const legendsUsed = run({ round: 3, lineup: { DE1: 150, LT: 249, CB1: 384 } });
    const legendsLeft = run({ round: 3, lineup: { DE1: 65, LT: 208, CB1: 169 } });
    const withoutLegends = simulate(legendsUsed, 200, seeded(21)).ceilings.QB ?? 0;
    const withLegends = simulate(legendsLeft, 200, seeded(21)).ceilings.QB ?? 0;
    expect(withoutLegends).toBeLessThan(withLegends - 2);
  });

  it("300 simulated drafts from round 1 finish fast enough to run on every pick", () => {
    // A formation no other test uses, so its fits aren't cached yet: the slowest case.
    const start = run({ formation: { defense: "43", offense: "slot" } });
    const began = performance.now();
    simulate(start, 300, seeded(31));
    const elapsed = performance.now() - began;
    console.log(`300 simulated drafts from round 1: ${elapsed.toFixed(0)} ms`);
    expect(elapsed).toBeLessThan(500);
  });
});
