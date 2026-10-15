# all22pokemon.com: game modes, formations, draft/reroll mechanics, and client storage

Researched 2026-10-15. Budget: hard, used 14 tool calls.

Method: `curl` of https://all22pokemon.com/ (title "Pokémon All-22 Builder"), /draft, /play, /patch-notes, /about, and every same-origin script they load (app.js, draft.js, pokemon.js, pokedata.js, saves.js, profile.js, tips.js, field.js, fantasy.js, hub.js, regions.js, age.js, wordfilter.js, patch-notes.js), saved to /tmp/all22dl.nV1i. The scripts are plain, unminified and commented (no bundler). Nothing was executed. All quotes below are copied verbatim from those files as fetched on 2026-10-15.

**Where the game lives:** the 17–0 Challenge is "Draft Mode" on the root page `/` (app.js + draft.js). Hashes `#challenge`, `#17-0`, `#draft` open it, and `#retro` opens the Gen 1–4 variant. The `/draft` route is a different game: a multiplayer "Fantasy Draft" (fantasy.js) with snake-order leagues. `/play` is a hub page.

## Answer
The 17–0 Challenge has two pools, called "variants": `all` (Gen 1–9) and `retro` (Gen 1–4). It has two formation toggles: defense `"34"`/`"43"` and offense `"fb"`/`"slot"`. Both are locked once the run starts. There are always 22 spots, and every spot keeps the same id in every formation. The 4-3 relabels NT→DT, ILB2→DT and ILB1→MLB. The slot offense relabels FB→WR (scored as the "SLOT" role) and HB→RB.

Each round rolls a region first, then a type, uniformly at random from a seeded PRNG (pseudo-random number generator). Only regions and types that still have an un-drafted, eligible Pokémon are candidates, so a roll is never empty. You get exactly **one type reroll and one region reroll per run**, not per pick. They cost nothing beyond using them up, and a reroll always gives a different value.

You may pick any Pokémon matching the rolled region and type, then place it in **any open spot you choose**. Placed picks are locked in. Duplicates are impossible because taken Pokémon are filtered out. There is a cap of 3 Legendary/Mythical Pokémon per run.

State lives in localStorage:
- The current run is under `pokemon-all22-draft-v1` (seed, round, roll, rerolls, lineup, pending pick, scheme, variant).
- Lifetime stats are under `pokemon-all22-draft-stats-v1` (`runs`, `perfect`, `bestScore`, `bestWins`).
- Retro has no separate key: it uses the same run key with `variant: "retro"`.

For a run played locally (signed out), the seed is stored, so every future roll can be computed in advance from it. For a signed-in leaderboard run, the server deals the rolls and the client deletes the seed.

## Findings
1. **The 17–0 Challenge has two pool variants: all nine generations ("all") or Retro, Gen 1–4 ("retro").** (High, primary source code)
   - https://all22pokemon.com/draft.js
   - > "const VARIANTS = { all: GENS, retro: ["1", "2", "3", "4"] };"
   - > "const REGIONS = {\n    1: "Kanto", 2: "Johto", 3: "Hoenn", 4: "Sinnoh", 5: "Unova", 6: "Kalos", 7: "Alola", 8: "Galar", 9: "Paldea",\n  };"
   - https://all22pokemon.com/app.js: > "\"#retro\" into its\n  // Retro (Gen 1–4) variant and \"#151\" into the 151 Challenge"
   - There is also a separate "151 Challenge" (Kanto only, a single Pokémon rolled per round, 5 rerolls), stored under its own keys.

2. **Formations are defense "34"/"43" × offense "fb"/"slot". In the challenge they are chosen before the run and locked once it starts. The challenge has no kicker.** (High)
   - https://all22pokemon.com/app.js
   - > "const DEFAULT_SCHEME = { def: \"34\", off: \"fb\", k: false };"
   - > "const isScheme = (sc) => Boolean(sc) && (sc.def === \"34\" || sc.def === \"43\") && (sc.off === \"fb\" || sc.off === \"slot\");"
   - > "// A run starts with picking its Pokémon (all nine generations, or Retro: Gen 1–4) and formation,\n  // locked in once it starts."
   - > "return mode === \"draft\" ? { def: draft.scheme.def, off: draft.scheme.off, k: false } : builderScheme;"

3. **There are always 22 spot ids. The base 3-4 + fullback formation has: S1, S2, CB1, CB2, OLB1, OLB2, ILB1, ILB2, DE1, DE2, NT (11 defense) and WR1, WR2, LT, LG, C, RG, RT, TE, QB, FB, HB (11 offense).** (High)
   - https://all22pokemon.com/draft.js
   - > "const SLOT_ROLE = {\n    S1: \"S\", S2: \"S\", CB1: \"CB\", CB2: \"CB\", OLB1: \"OLB\", OLB2: \"OLB\", ILB1: \"ILB\", ILB2: \"ILB\",\n    DE1: \"DE\", DE2: \"DE\", NT: \"NT\",\n    WR1: \"WR\", WR2: \"WR\", LT: \"OL\", LG: \"OL\", C: \"OL\", RG: \"OL\", RT: \"OL\", TE: \"TE\",\n    QB: \"QB\", FB: \"FB\", HB: \"HB\",\n  };"
   - Position counts per formation (derived from the role maps; Low only in the sense that I computed the counts):
     - **3-4 defense:** 2 S, 2 CB, 2 OLB, 2 ILB, 2 DE, 1 NT.
     - **4-3 defense:** 2 S, 2 CB, 2 OLB, 1 MLB (ILB1), 2 DT (NT, ILB2), 2 DE.
     - **Fullback offense:** 2 WR, 5 OL (LT, LG, C, RG, RT), 1 TE, 1 QB, 1 FB, 1 HB.
     - **Slot offense:** 3 WR (WR1, WR2, plus FB scored as role "SLOT"), 5 OL, 1 TE, 1 QB, 1 RB (HB).

4. **The 4-3 and slot formations relabel spots but keep their ids. The scoring role map is `SCHEME_ROLE`.** (High)
   - https://all22pokemon.com/draft.js
   - > "const SCHEME_ROLE = { \"43\": { NT: \"DT\", ILB2: \"DT\", ILB1: \"MLB\" }, slot: { FB: \"SLOT\" } };"
   - https://all22pokemon.com/app.js (display labels): > "slot: { FB: { pos: \"WR\", lx: 268, ly: 748, s: 124, look: \"R\", sx: null, sb: null }, HB: { pos: \"RB\", ly: 966 } },"
   - So a bot should key off spot ids, map them to roles through `roleOf(slot, scheme)`, and ignore the display labels.

5. **A run is 22 rounds. Each round rolls a region and a type; you pick one matching Pokémon and place it in any open position.** (High)
   - https://all22pokemon.com/draft.js
   - > "// Draft mode: each round rolls a region and a type, you pick one of the matching Pokémon and place\n// it in an open position; after 22 rounds the team gets a Team Score (out of 1000) and plays a\n// 17-game season."
   - > "const ROUNDS = 22;"
   - Pick dialog text in app.js: > "`Pick one, then place it in any of your ${open.length} open ${open.length === 1 ? \"spot\" : \"spots\"}.${legendNote}`"

6. **Rolls are uniform random picks from a deterministic seeded PRNG: region first (among regions with at least one available type), then type (among types that region still has). So a roll is never empty.** (High)
   - https://all22pokemon.com/draft.js
   - > "// A fresh roll: region first (one of the variant's), then a type that region still has Pokémon for."
   - > "const gen = pickFrom(gensOf(variant).filter((g) => typesFor(g, taken, noLegends).length > 0), rand(seed, i * 2));\n    const type = pickFrom(typesFor(gen, taken, noLegends), rand(seed, i * 2 + 1));"
   - > "const pickFrom = (list, r) => list[Math.floor(r * list.length)];"
   - Consequence (my inference, Low/Medium): the draw is not weighted by how many Pokémon a region/type has. Each eligible region is equally likely, then each eligible type within it is equally likely. "Available" excludes already-drafted Pokémon, and excludes Legendaries once 3 are used.

7. **Rerolls: one type reroll and one region reroll per run, not per pick. A reroll keeps the other half of the roll and always changes the rerolled half to a different value that still has Pokémon available.** (High)
   - https://all22pokemon.com/app.js
   - > "// A run: 22 rounds, each with a rolled region + type; one type reroll and one region reroll per run."
   - > "return { ...run, variant, roll: DRAFT.roll(seed, 0, new Set(), false, variant), rerolls: { type: 1, gen: 1 } };"
   - https://all22pokemon.com/draft.js: > "const options = typesFor(current.gen, taken, noLegends).filter((t) => t !== current.type);" and > "const options = gensFor(current.type, taken, noLegends, variant).filter((g) => g !== current.gen);"
   - Cost: nothing besides decrementing the counter (`draft.rerolls[kind] -= 1;`). Rerolling clears any pending pick.
   - A local reroll is also deterministic: `DRAFT.rerollType(draft.roll, draft.seed ^ 0x2e7011, draft.round, ...)` and `DRAFT.rerollGen(draft.roll, draft.seed ^ 0x6e9e11, draft.round, ...)`.

8. **You can pick any Pokémon that matches both the region and the type, except taken ones and (after the cap) Legendaries. A Pokémon matches if the rolled type is either of its types.** (High)
   - https://all22pokemon.com/draft.js
   - > "return POOL[gen].filter((p) => !taken.has(p.id) && !(noLegends && p.legendary) && POKEDATA[p.id - 1].types.includes(type));"

9. **Each run allows at most 3 Legendary/Mythical Pokémon. Once the cap is reached, rolls avoid region/type combos where only Legendaries are left.** (High)
   - https://all22pokemon.com/draft.js
   - > "const MAX_LEGENDS = 3;"
   - > "// noLegends: the run has used up its Legendaries, so only regular Pokémon count (rolls never land\n  // on a region and type that only has Legendaries left)."

10. **No duplicates: drafted Pokémon are removed from all later rolls, and the save validator rejects repeated ids.** (High)
    - https://all22pokemon.com/app.js
    - > "if (!BASE_IDS.has(slot) || !Number.isInteger(id) || id < 1 || id > POKEMON_NAMES.length || !gens.includes(genOf(id)) || seen.has(id)) return false;"

11. **Placement is chosen by the player and is final. After placing, the round advances and the next roll is computed as `DRAFT.roll(seed, round, taken, legendsFull, variant)`.** (High)
    - https://all22pokemon.com/app.js
    - > "draft.lineup[slotId] = draft.pending;\n      draft.round += 1;"
    - > ": DRAFT.roll(draft.seed, draft.round, takenIds(), legendsFull(), draft.variant);"
    - Tapping a filled spot shows: > "toast(`${nameOf(id)} is locked in at ${SLOT_BY_ID.get(slotId).pos}`);"

12. **Signed-in runs are server-dealt leaderboard runs. The client deletes the seed and sends `pick`/`reroll` moves to `/api/app?a=...`, and the server rejects moves that come too fast.** (High)
    - https://all22pokemon.com/app.js
    - > "Started signed in (any account), a run is a leaderboard run: it gets an id and the server deals it from\n  // then on (its seed stays secret, and the server keeps the rolls, the step it's on, the final\n  // result and its ranks)"
    - > "const s = await serverMove(\"pick\", { slot: slotId, pick: draft.pending });"
    - > "const MIN_MOVE_MS = 1000;"
    - > "const res = await fetch(`/api/app?a=${action}`, body"
    - Start call: `api("start", { game: g, variant: run.variant, def: run.scheme.def, off: run.scheme.off })`.

13. **localStorage key names. The prefix is `EDITION.key = "pokemon-all22"`.** (High)
    - https://all22pokemon.com/pokemon.js: > "key: \"pokemon-all22\", // saved-data prefix"
    - https://all22pokemon.com/app.js:
      - > "const DRAFT_KEY = `${EDITION.key}-draft-v1`;"
      - > "const DRAFT_STATS_KEY = `${EDITION.key}-draft-stats-v1`;"
      - > "151: { name: \"151 Challenge\", runKey: `${EDITION.key}-151-v1`, statsKey: `${EDITION.key}-151-stats-v1` },"
    - Resolved key list:
      - `pokemon-all22-draft-v1`: current 17–0 run (both the all and retro variants).
      - `pokemon-all22-draft-stats-v1`: 17–0 lifetime stats.
      - `pokemon-all22-151-v1` and `pokemon-all22-151-stats-v1`: the 151 Challenge.
      - `pokemon-all22-mode-v1`: `"builder"`, `"draft"` or `"151"`.
      - `pokemon-all22-formation-v1`: the builder's scheme JSON `{def,off,k}`. This is not the run's scheme.
      - Builder-only settings: `pokemon-all22-gen-v1`, `pokemon-all22-style-v1`, `pokemon-all22-legends-v1` (`"1"`/`"0"`), `pokemon-all22-shiny-v1`, and `pokemon-all22-lineup-…-v1` / `pokemon-all22-teams-<g>-v1`.
      - Misc: `all22-notes-seen`, `all22-shiny-test`.
      - sessionStorage: `all22-hub-pick` and `all22-sync-reload`.
    - No IndexedDB use was found.

14. **Run JSON shape (from `newDraft` + `saveRun`, which calls `JSON.stringify(runs[g])`).** (High: fields from the code; the example values are reconstructed)
    - https://all22pokemon.com/app.js
    - > "const run = { v: 1, seed, round: 0, revealed: false, started: false, scheme: { def: scheme.def, off: scheme.off }, lineup: {}, pending: null };"
    - > "try { localStorage.setItem(CHALLENGES[g].runKey, JSON.stringify(runs[g])); } catch (_) { /* ignore */ }"
    - Reconstructed example, a local mid-run 17–0 run after 3 picks:
      ```json
      {
        "v": 1,
        "seed": -1234567890,
        "round": 3,
        "revealed": true,
        "started": true,
        "scheme": { "def": "43", "off": "slot" },
        "lineup": { "QB": 65, "LT": 208, "CB1": 6 },
        "pending": null,
        "variant": "all",
        "roll": { "gen": "1", "type": "fire" },
        "rerolls": { "type": 1, "gen": 0 }
      }
      ```
    - Field types:
      - `lineup` maps spot id → national-dex id (integer).
      - `roll.gen` is a string from "1" to "9", and `roll.type` is a lowercase name from `TYPE_NAMES`.
      - `pending` is the dex id that has been picked but not yet placed, or null.
      - `rerolls.type` and `rerolls.gen` are each 0 or 1.
      - `round` is the number of placed picks. The validator requires `Object.keys(d.lineup).length === d.round`.
    - A signed-in run has no `seed`. It adds `id` (string), `step` (int), `uid`, `result`, `post` and `shiny`, taken from the server: > "Object.assign(run, { id: s.id, step: s.step, round: s.round, roll: s.roll, rerolls: { ...s.rerolls }, result: s.result || null, post: s.post || null, shiny: Array.isArray(s.shiny) ? s.shiny : [] });\n    delete run.seed;"
    - A finished local run has `roll: null` and gets `counted: true`. Its score is not stored; it is recomputed: > "worked out from the lineup\n  // and seed (and never stored) for one played on this device."

15. **Stats JSON shape: `{ runs, perfect, bestScore, bestWins }`.** (High)
    - https://all22pokemon.com/app.js
    - > "return { runs: n(s.runs, 1e9), perfect: n(s.perfect, 1e9), bestScore: n(s.bestScore, 1000), bestWins: n(s.bestWins, DRAFT.GAMES) };"
    - Example: `{"runs":42,"perfect":1,"bestScore":916,"bestWins":17}`. The stats keys sync to the account (saves.js: > "/^pokemon-all22-(draft|151)-stats-v1$/, // the challenges' lifetime stats"). The run key itself is not on the sync list.

16. **(Outside scope, noted briefly) The whole score formula is client-side in draft.js.** (High) It includes `ROLES` (stat weights and type bonuses per role), `positionScore`, `rawTeam` (per-spot importance weights `OFFENSE_BY`/`DEFENSE_BY`, plus a weak-link penalty `WEAK_LINKS = 4`, `WEAK_WEIGHT = 0.18`) and `CURVES` mapping raw→0–1000. Comment: > "Calibrated on the real results of ~57,000 seasons (October 2026)". CURVES for "all": > "all: [[19.5, 0], [71.51, 950], [74, 1000]],". Stats come from `POKEDATA` (pokedata.js) and height from `HEIGHT_DM` (pokemon.js).

## Conflicts
- Brief vs code: the brief calls the pools "Gen 1–9 vs Gen 1–4". In code the 17–0 Challenge variants are `all` and `retro`, so this is the same thing under different names. The separate `/draft` Fantasy Draft page has more pools (`kanto`, `retro`, `wild`, `gen2`…`gen9`), but that is a different game. No actual contradiction.

## Unverified
- Server-side rules for leaderboard runs (api/app.mjs) were not readable. The client comments say the server "deals" rolls and checks picks, and presumably it uses the same `DRAFT` logic, but I could not confirm that server rolls follow the same uniform region→type procedure.
- I did not confirm whether the run key's `revealed` flag matters to a bot. It only gates the reveal animation: "until then it shows as unrolled, so reloading can't change it."

## Leads
- **Future rolls are predictable for local (signed-out) runs.** `seed` is in `pokemon-all22-draft-v1`, and `DRAFT.roll(seed, round, taken, noLegends, variant)` is deterministic. Each future roll depends on which Pokémon are taken, so a bot could do a full lookahead search over the remaining rolls. This would help offline optimization, but it may count as exploiting the game, and it doesn't apply to signed-in leaderboard runs, where the seed is secret.
- For the scoring researcher: draft.js lines ~76–200 hold the full formula. `positionScore` normalizes stats (hp 20–150, others 20–140, spe 20–130, log weight 5–400 kg, height 0.3–2.2 m) and adds the max type bonus.
- The 151 Challenge (`pokemon-all22-151-v1`, `rerolls: { mon: 5 }`, roll `{ id }`) is a separate mode with its own score curve.

## Sources read
- https://all22pokemon.com/ (live, 2026-10-15): page HTML; script list (saves, profile, pokemon, pokedata, draft, tips, app).
- https://all22pokemon.com/app.js (live, 2026-10-15): modes, formations/spot coordinates, run state, localStorage keys, pick/place/reroll flow, server API.
- https://all22pokemon.com/draft.js (live, 2026-10-15): ROUNDS, VARIANTS, PRNG, roll/reroll logic, legend cap, roles, score formula.
- https://all22pokemon.com/pokemon.js (live): `EDITION.key = "pokemon-all22"`, LEGENDARIES, genOf.
- https://all22pokemon.com/pokedata.js (live): TYPE_NAMES (lowercase).
- https://all22pokemon.com/saves.js (live): list of synced keys (stats sync, run key not synced).
- https://all22pokemon.com/fantasy.js, hub.js, /draft, /play (live): confirmed /draft is a separate multiplayer Fantasy Draft, not the 17–0 Challenge.
