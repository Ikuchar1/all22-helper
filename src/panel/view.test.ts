import { describe, expect, it } from "vitest";
import { parseRun } from "../run/parse-run";
import { game } from "../scoring/game-oracle";
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

  it("a new run the player hasn't started yet shows the empty state, not its unrevealed roll", () => {
    // What the game saves on "New run" (and on changing the variant before starting).
    const notStarted = { started: false, revealed: false, round: 0, lineup: {} };
    expect(panelView(saved(notStarted), null)).toEqual({ kind: "empty" });
    // Older saves have no `started`: the game counts a run as started once it has any progress.
    const { started: _started, ...olderNotStarted } = notStarted;
    expect(panelView(saved(olderNotStarted), null)).toEqual({ kind: "empty" });
    expect(panelView(saved({ ...olderNotStarted, revealed: true }), null)).toMatchObject({
      kind: "run",
    });
    expect(panelView(saved({ started: true, revealed: true, round: 0 }), null)).toMatchObject({
      kind: "run",
    });
  });

  it("the header shows the round as the game does, the roll's type and region, variant and rerolls left", () => {
    const view = panelView(saved(), null);
    expect(view.kind === "run" && view.header).toEqual({
      round: 4,
      roll: { type: "Fire", region: "Kanto" },
      variant: "all",
      rerollsLeft: { type: 1, region: 0 },
    });

    const retro = panelView(
      saved({
        started: true,
        round: 0,
        variant: "retro",
        roll: { gen: "4", type: "water" },
        lineup: {},
      }),
      null,
    );
    expect(retro.kind === "run" && retro.header).toMatchObject({
      round: 1,
      roll: { type: "Water", region: "Sinnoh" },
      variant: "retro",
    });
  });

  it("the table has every candidate at every open spot with the game's fit, best fits flagged", () => {
    const view = panelView(saved(), null);
    if (view.kind !== "run") throw new Error("expected a run");
    const { spots, rows } = view.table;

    const filled = Object.keys(SAVED.lineup);
    expect(spots).toHaveLength(19);
    expect([...spots, ...filled].sort()).toEqual(Object.keys(game.DRAFT.SLOT_ROLE).sort());
    // Charizard (6) is a Kanto Fire-type but already in the lineup.
    const offered = game.DRAFT.available("1", "fire", new Set(Object.values(SAVED.lineup)));
    expect(rows.map((r) => r.dexId)).toEqual(offered.map((p) => p.id));
    expect(rows.map((r) => r.name)).toEqual(offered.map((p) => p.name));

    for (const row of rows) {
      expect(row.cells.map((c) => c.spot)).toEqual(spots);
      for (const cell of row.cells) {
        // The run plays a 4-3 with a slot receiver.
        expect(cell.fit).toBe(
          game.DRAFT.positionScore(row.dexId, cell.spot, { def: "43", off: "slot" }),
        );
      }
      const best = Math.max(...row.cells.map((c) => c.fit));
      for (const cell of row.cells) expect(cell.bestForCandidate).toBe(cell.fit === best);
    }
    spots.forEach((spot, i) => {
      const column = rows.map((r) => r.cells[i]!);
      const best = Math.max(...column.map((c) => c.fit));
      for (const cell of column) {
        expect(cell.spot).toBe(spot);
        expect(cell.bestForSpot).toBe(cell.fit === best);
      }
    });
    expect(rows.flatMap((r) => r.cells).some((c) => c.bestForCandidate && !c.bestForSpot)).toBe(
      true,
    );
  });

  // The game's 3 best fits for a Pokémon among the run's open spots, best first.
  const gameBestFits = (dexId: number) => {
    const filled = new Set(Object.keys(SAVED.lineup));
    return Object.keys(game.DRAFT.SLOT_ROLE)
      .filter((spot) => !filled.has(spot))
      .map((spot) => game.DRAFT.positionScore(dexId, spot, { def: "43", off: "slot" }))
      .sort((a, b) => b - a)
      .slice(0, 3);
  };
  const hoverLineOf = (view: ReturnType<typeof panelView>) =>
    view.kind === "run" ? view.hoverLine : undefined;

  it("the hover line lists the focused Pokémon's 3 best open spots by fit", () => {
    // Arcanine (59), hovered in the pick list.
    const line = hoverLineOf(panelView(saved(), 59));
    expect(line).toMatchObject({ dexId: 59, name: "Arcanine", source: "focus" });
    expect(line!.spots.map((s) => s.fit)).toEqual(gameBestFits(59));
    for (const { spot, fit } of line!.spots) {
      expect(Object.keys(SAVED.lineup)).not.toContain(spot);
      expect(fit).toBe(game.DRAFT.positionScore(59, spot, { def: "43", off: "slot" }));
    }
  });

  it("with nothing hovered the hover line shows the pending pick, and with neither it's absent", () => {
    // Ninetales (38), picked but not yet placed.
    const line = hoverLineOf(panelView(saved({ pending: 38 }), null));
    expect(line).toMatchObject({ dexId: 38, name: "Ninetales", source: "pending" });
    expect(line!.spots.map((s) => s.fit)).toEqual(gameBestFits(38));

    expect(hoverLineOf(panelView(saved({ pending: 38 }), 59))).toMatchObject({
      dexId: 59,
      source: "focus",
    });
    expect(hoverLineOf(panelView(saved(), null))).toBeNull();
  });
});
