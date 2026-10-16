import { describe, expect, it } from "vitest";
import { parseRun } from "./parse-run";

// Saved runs as the game writes them to localStorage under `pokemon-all22-draft-v1`
// (shape from docs/research/scoring/report.md, "localStorage").
const SIGNED_OUT = {
  v: 1,
  seed: -1234567890,
  round: 3,
  revealed: true,
  started: true,
  scheme: { def: "43", off: "slot" },
  lineup: { QB: 65, LT: 208, CB1: 6 },
  pending: null,
  variant: "all",
  roll: { gen: "1", type: "fire" },
  rerolls: { type: 1, gen: 0 },
};

describe("parseRun", () => {
  it("a signed-out run keeps its seed and names the region and formation", () => {
    expect(parseRun(JSON.stringify(SIGNED_OUT))).toEqual({
      round: 3,
      roll: { region: "1", type: "fire" },
      lineup: { QB: 65, LT: 208, CB1: 6 },
      pending: null,
      formation: { defense: "43", offense: "slot" },
      variant: "all",
      rerollsLeft: { type: 1, region: 0 },
      seed: -1234567890,
      signedIn: false,
      started: true,
      finished: false,
    });
  });

  it("a signed-in run has no seed", () => {
    const { seed: _seed, ...rest } = SIGNED_OUT;
    const signedIn = { ...rest, id: "run-42", step: 7, uid: "user-1", shiny: false };
    expect(parseRun(JSON.stringify(signedIn))).toMatchObject({ seed: null, signedIn: true });
  });

  it("a run with a picked but unplaced Pokémon has it pending", () => {
    const pendingPick = { ...SIGNED_OUT, pending: 38 };
    expect(parseRun(JSON.stringify(pendingPick))).toMatchObject({
      pending: 38,
      lineup: SIGNED_OUT.lineup,
      finished: false,
    });
  });

  it("a finished signed-out run has no roll", () => {
    const finished = { ...SIGNED_OUT, round: 22, roll: null, counted: true };
    expect(parseRun(JSON.stringify(finished))).toMatchObject({ roll: null, finished: true });
  });

  it("a signed-in run is finished after the last round even when the server kept its roll", () => {
    const { seed: _seed, ...rest } = SIGNED_OUT;
    const finished = { ...rest, round: 22, uid: "user-1" };
    expect(parseRun(JSON.stringify(finished))).toMatchObject({
      roll: { region: "1", type: "fire" },
      finished: true,
    });
  });

  it("a signed-in run is finished after the last round when the server left the roll out", () => {
    const { seed: _seed, roll: _roll, ...rest } = SIGNED_OUT;
    const finished = { ...rest, round: 22, uid: "user-1" };
    expect(parseRun(JSON.stringify(finished))).toMatchObject({ roll: null, finished: true });
  });

  it("a run still drafting is not finished", () => {
    expect(parseRun(JSON.stringify({ ...SIGNED_OUT, round: 21 }))).toMatchObject({
      finished: false,
    });
  });

  it("a run saved before formations and Retro existed gets the game's defaults", () => {
    const { scheme: _scheme, variant: _variant, ...older } = SIGNED_OUT;
    expect(parseRun(JSON.stringify(older))).toMatchObject({
      formation: { defense: "34", offense: "fb" },
      variant: "all",
    });
  });

  it.each([
    ["no saved run", null],
    ["text that isn't JSON", "{not json"],
    ["JSON that isn't an object", "42"],
    ["JSON null", "null"],
    ["an object missing the run's fields", JSON.stringify({ v: 1 })],
    ["a run with a lineup that isn't an object", JSON.stringify({ ...SIGNED_OUT, lineup: 5 })],
  ])("%s gives no run", (_label, json) => {
    expect(parseRun(json)).toBeNull();
  });
});
