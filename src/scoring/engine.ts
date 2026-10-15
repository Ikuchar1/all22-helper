import { DRAFT } from "virtual:site-game";

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
