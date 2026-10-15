// The game's pick list: one `button.cand` per candidate, its dex id on a child
// `canvas.thumb[data-id]` (docs/research/helper-tool/report.md).
const CANDIDATE = ".cand";
const THUMB = "canvas.thumb";

type Found = { getAttribute(name: string): string | null; querySelector(s: string): Found | null };
type Closest = { closest(selector: string): Found | null };

const hasClosest = (target: unknown): target is Closest =>
  typeof target === "object" &&
  target !== null &&
  typeof (target as Partial<Closest>).closest === "function";

/** The dex id of the candidate an event target is on (or inside), or null if it isn't on one. */
export function dexIdFrom(target: unknown): number | null {
  if (!hasClosest(target)) return null;
  const id = target.closest(CANDIDATE)?.querySelector(THUMB)?.getAttribute("data-id");
  if (!id || !/^\d+$/.test(id)) return null;
  return Number(id);
}
