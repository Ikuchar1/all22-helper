import { describe, expect, it } from "vitest";
import { parseRun } from "../run/parse-run";
import { panelView } from "./view";

// A run as the game saves it to localStorage, signed out, round 4 of 22.
const SAVED = {
  v: 1,
  seed: -1234567890,
  round: 3,
  scheme: { def: "43", off: "slot" },
  lineup: { QB: 65, LT: 208, CB1: 6 },
  pending: null,
  variant: "all",
  roll: { gen: "1", type: "fire" },
  rerolls: { type: 1, gen: 0 },
};
const saved = (overrides: Record<string, unknown> = {}) =>
  parseRun(JSON.stringify({ ...SAVED, ...overrides }));

describe("panel view", () => {
  it("no saved run, an unparseable run, or a finished run shows the empty state", () => {
    expect(panelView(parseRun(null), null)).toEqual({ kind: "empty" });
    expect(panelView(parseRun("{not json"), null)).toEqual({ kind: "empty" });
    expect(panelView(parseRun(JSON.stringify({ round: "three" })), 25)).toEqual({ kind: "empty" });
    expect(panelView(saved({ round: 22, roll: null }), null)).toEqual({ kind: "empty" });
  });
});
