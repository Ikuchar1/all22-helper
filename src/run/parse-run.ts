import { ROUNDS, type Formation, type Lineup, type Region, type Variant } from "../scoring/engine";

/** The current 17–0 run, read from the game's saved state (localStorage `pokemon-all22-draft-v1`). */
export type Run = {
  round: number;
  roll: { region: Region; type: string } | null;
  lineup: Lineup;
  /** A picked but not yet placed Pokémon's dex id. */
  pending: number | null;
  formation: Formation;
  variant: Variant;
  rerollsLeft: { type: number; region: number };
  /** Only signed-out runs expose it; the server keeps it on signed-in runs. */
  seed: number | null;
  signedIn: boolean;
  /** False for a new run still in setup: its roll isn't revealed and nothing is drafted. */
  started: boolean;
  finished: boolean;
};

// The run as the game saves it. It calls a region a "gen" and a formation a "scheme".
type SavedRun = {
  seed?: number;
  round: number;
  scheme: { def: Formation["defense"]; off: Formation["offense"] };
  lineup: Lineup;
  pending: number | null;
  variant: Variant;
  // A finished signed-in run may leave it out.
  roll?: { gen: Region; type: string } | null;
  rerolls: { type: number; gen: number };
  started?: unknown;
  revealed?: unknown;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function isSavedRun(value: unknown): value is SavedRun {
  if (!isObject(value)) return false;
  const { round, scheme, lineup, pending, variant, roll, rerolls } = value;
  return (
    typeof round === "number" &&
    isObject(scheme) &&
    (scheme.def === "34" || scheme.def === "43") &&
    (scheme.off === "fb" || scheme.off === "slot") &&
    isObject(lineup) &&
    Object.values(lineup).every((id) => typeof id === "number") &&
    (pending === null || typeof pending === "number") &&
    (variant === "all" || variant === "retro") &&
    (roll === null ||
      (roll === undefined && round >= ROUNDS) ||
      (isObject(roll) && typeof roll.gen === "string" && typeof roll.type === "string")) &&
    isObject(rerolls) &&
    typeof rerolls.type === "number" &&
    typeof rerolls.gen === "number"
  );
}

function readJson(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

/** The saved run, or null when there is none or it isn't a run the game would write. */
export function parseRun(json: string | null): Run | null {
  if (json === null) return null;
  const parsed = readJson(json);
  if (!isObject(parsed)) return null;
  // The game's own defaults when loading a run: runs saved before formations existed played the
  // 3-4 with a fullback, and before Retro every 17–0 run used all nine regions.
  const saved = { scheme: { def: "34", off: "fb" }, variant: "all", ...parsed };
  if (!isSavedRun(saved)) return null;
  return {
    round: saved.round,
    roll: saved.roll ? { region: saved.roll.gen, type: saved.roll.type } : null,
    lineup: saved.lineup,
    pending: saved.pending,
    formation: { defense: saved.scheme.def, offense: saved.scheme.off },
    variant: saved.variant,
    rerollsLeft: { type: saved.rerolls.type, region: saved.rerolls.gen },
    seed: typeof saved.seed === "number" ? saved.seed : null,
    // Signed-in runs are the server's: the game drops the seed from what it saves.
    signedIn: typeof saved.seed !== "number",
    // The game's own default for saves from before `started` existed.
    started:
      typeof saved.started === "boolean"
        ? saved.started
        : saved.round > 0 || Boolean(saved.revealed) || saved.pending !== null,
    // The game's own rule. Only signed-out runs clear the roll at the end; signed-in runs keep
    // whatever the server sent.
    finished: saved.round >= ROUNDS,
  };
}
