import { DRAFT, LEGENDARIES, POKEDATA, POKEMON_NAMES } from "virtual:site-game";

export type Formation = { defense: "34" | "43"; offense: "fb" | "slot" };

export type Spot =
  | "QB"
  | "HB"
  | "FB"
  | "WR1"
  | "WR2"
  | "TE"
  | "LT"
  | "LG"
  | "C"
  | "RG"
  | "RT"
  | "DE1"
  | "DE2"
  | "NT"
  | "OLB1"
  | "OLB2"
  | "ILB1"
  | "ILB2"
  | "CB1"
  | "CB2"
  | "S1"
  | "S2";

const schemeOf = (formation: Formation) => ({ def: formation.defense, off: formation.offense });

/** 0–100: how well a Pokémon suits a spot under a formation, as the game computes it. */
export function fit(dexId: number, spot: Spot, formation: Formation): number {
  return DRAFT.positionScore(dexId, spot, schemeOf(formation));
}

export type Variant = "all" | "retro";
export type Lineup = Partial<Record<Spot, number>>;
export type TeamScore = { score: number; offense: number; defense: number };

/** The game's Team Score (0–1000) of a lineup, with its offense and defense ratings. */
export function teamScore(lineup: Lineup, formation: Formation, variant: Variant): TeamScore {
  const { score, offense, defense } = DRAFT.teamScore(lineup, schemeOf(formation), variant);
  return { score, offense, defense };
}

export type SpotInfo = { spot: Spot; role: string; side: "offense" | "defense"; weight: number };

/** The 22 spots of a formation, each with its scoring role, side of the ball and spot weight. */
export function spotsOf(formation: Formation): SpotInfo[] {
  const scheme = schemeOf(formation);
  const side = (name: SpotInfo["side"], weights: Record<string, number>) =>
    Object.entries(weights).map(([spot, weight]) => ({
      spot: spot as Spot,
      role: DRAFT.roleOf(spot, scheme),
      side: name,
      weight,
    }));
  return [
    ...side("offense", DRAFT.OFFENSE_BY[formation.offense]),
    ...side("defense", DRAFT.DEFENSE_BY[formation.defense]),
  ];
}

/** A region id as the game stores it: "1" (Kanto) to "9" (Paldea). */
export type Region = string;
export type PoolEntry = { dexId: number; name: string; legendary: boolean };

/** Rounds in a run: one Pokémon placed per round, so a run is done after this many. */
export const ROUNDS: number = DRAFT.ROUNDS;

/** A run may draft at most this many Legendaries. */
export const LEGEND_CAP: number = DRAFT.MAX_LEGENDS;
/** The regions a variant's rolls draw from. */
export const regionsOf = (variant: Variant): Region[] => [...DRAFT.VARIANTS[variant]];
/** Every Pokémon in a region's draft pool, Legendaries included. */
export const poolOf = (region: Region): PoolEntry[] =>
  (DRAFT.POOL[region] ?? []).map((p) => ({ dexId: p.id, name: p.name, legendary: p.legendary }));

/** A Pokémon's types, as the game's lowercase names ("fire", "water", …). */
export const typesOf = (dexId: number): string[] => [...(POKEDATA[dexId - 1]?.types ?? [])];

export const isLegendary = (dexId: number): boolean => LEGENDARIES.has(dexId);

export const nameOf = (dexId: number): string => POKEMON_NAMES[dexId - 1] ?? "";
