# all22pokemon.com scoring internals: per-position stat weights, type bonuses, Team Score formula, data set

Researched 2026-10-15. Budget: hard, used 8 tool calls.

Method: `curl` of https://all22pokemon.com/ and /scouting. The page loads plain (unbundled, unminified) scripts: `app.js, draft.js, pokedata.js, pokemon.js, profile.js, saves.js, tips.js`. It's not Next.js and has no chunks. All scoring lives in **`https://all22pokemon.com/draft.js`** (last-modified `Wed, 14 Oct 2026 13:41:20 GMT`, etag `"7cd0a6621e9735cb36bcc5545e0118ac"`). Copies of draft.js, pokedata.js, pokemon.js and scouting.html are saved in `/Users/ikuchar/research/2026-10-15-all22pokemon-scoring/wave-1/r1-bundle/`. I did not execute any downloaded code.

## Answer
The scoring is fully client-side and readable in `draft.js`. Each Pokémon gets a per-slot fit score from 0 to 100: `100 * Σ(weight × normalized stat) + max type bonus` (bonus 2–6 points, only the single best matching type counts), clamped to 0–100. Stats are normalized linearly: HP over 20–150, Atk/Def/SpA/SpD over 20–140, Spe over 20–130. Weight uses log(kg) between 5 kg and 400 kg, and height runs over 0.3–2.2 m. The team's raw value is `0.82 × mean(offense weighted avg, defense weighted avg) + 0.18 × mean(4 lowest fits of all 22 starters)`. A piecewise-linear curve per variant maps that raw value to 0–1000. For "all" (Gen 1–9) the points are raw 19.5→0, 71.51→950 and 74→1000. For Retro they are 19.5→0, 61.73→820, 70.33→950 and 71.83→1000. A score of 1000 needs raw ≥ 74.0 (all) or ≥ 71.83 (retro). By my arithmetic (not the site's), 916 in "all" is about raw 69.65, so roughly +4.35 raw is needed. The scouting page shows only qualitative labels ("key / helps / a small part / doesn't count"); the exact weights are in the code below. Pokémon data is embedded in `pokedata.js` (types, 6 base stats, kg) and `pokemon.js` (names, HEIGHT_DM, LEGENDARIES, gen ranges). No JSON file is needed. `/api/app` handles server-side rolls and online-run results.

## Findings

1. **Per-role stat weights and type bonuses (exact code).** (High: primary source code)
   - https://all22pokemon.com/draft.js
   - Verbatim:
   ```js
   // Each role values a mix of base stats (and size); a few types get a small football-flavored bump.
   const ROLES = {
     QB: { stats: { spa: 0.34, spd: 0.22, spe: 0.18, atk: 0.1, hp: 0.16 }, types: { psychic: 6, normal: 2, dragon: 2 } },
     HB: { stats: { spe: 0.34, atk: 0.3, hp: 0.16, def: 0.1, kg: 0.1 }, types: { fighting: 3, ground: 3, normal: 2 } },
     FB: { stats: { atk: 0.28, def: 0.26, hp: 0.2, kg: 0.26 }, types: { rock: 4, ground: 4, fighting: 3, normal: 2 } },
     WR: { stats: { spe: 0.5, atk: 0.14, spa: 0.14, m: 0.12, spd: 0.1 }, types: { electric: 4, flying: 4 } },
     TE: { stats: { atk: 0.24, def: 0.2, hp: 0.16, spe: 0.14, kg: 0.14, m: 0.12 }, types: { fighting: 3, water: 2 } },
     OL: { stats: { def: 0.3, hp: 0.24, kg: 0.3, atk: 0.1, spd: 0.06 }, types: { rock: 5, steel: 5, ground: 3, fighting: 2 } },
     DE: { stats: { atk: 0.34, spe: 0.28, hp: 0.14, kg: 0.14, def: 0.1 }, types: { fighting: 5, dark: 2, dragon: 2 } },
     NT: { stats: { kg: 0.34, hp: 0.24, def: 0.22, atk: 0.2 }, types: { rock: 4, ground: 4, steel: 3, fighting: 2 } },
     OLB: { stats: { atk: 0.3, spe: 0.3, def: 0.18, hp: 0.14, spd: 0.08 }, types: { fighting: 4, dark: 3, bug: 2 } },
     ILB: { stats: { atk: 0.3, def: 0.28, hp: 0.2, spe: 0.14, spd: 0.08 }, types: { fighting: 4, dark: 3, ground: 2 } },
     CB: { stats: { spe: 0.46, spd: 0.22, def: 0.14, atk: 0.1, m: 0.08 }, types: { flying: 3, dark: 3, ghost: 3 } },
     S: { stats: { spe: 0.32, spd: 0.26, def: 0.16, hp: 0.14, spa: 0.12 }, types: { flying: 4, psychic: 3 } },
     // 4-3 front and the slot offense
     DT: { stats: { kg: 0.28, atk: 0.26, hp: 0.2, def: 0.18, spe: 0.08 }, types: { rock: 3, ground: 3, steel: 3, fighting: 3 } },
     MLB: { stats: { atk: 0.28, def: 0.24, hp: 0.18, spe: 0.16, spd: 0.14 }, types: { fighting: 4, dark: 3, ground: 2 } },
     SLOT: { stats: { spe: 0.48, atk: 0.16, spd: 0.14, spa: 0.12, hp: 0.1 }, types: { electric: 4, flying: 3, fairy: 2 } },
   };
   ```
   - Key: `kg` = weight feature and `m` = height feature (see Finding 3). Every role's stat weights sum to 1.0, so the stat part is at most 100.
   - The same data as a table (blank = 0):

   | Role | HP | Atk | Def | SpA | SpD | Spe | Weight(kg) | Height(m) | Type bonus (pts) |
   |---|---|---|---|---|---|---|---|---|---|
   | QB | .16 | .10 | | .34 | .22 | .18 | | | Psychic 6, Normal 2, Dragon 2 |
   | HB | .16 | .30 | .10 | | | .34 | .10 | | Fighting 3, Ground 3, Normal 2 |
   | FB | .20 | .28 | .26 | | | | .26 | | Rock 4, Ground 4, Fighting 3, Normal 2 |
   | SLOT | .10 | .16 | | .12 | .14 | .48 | | | Electric 4, Flying 3, Fairy 2 |
   | WR | | .14 | | .14 | .10 | .50 | | .12 | Electric 4, Flying 4 |
   | TE | .16 | .24 | .20 | | | .14 | .14 | .12 | Fighting 3, Water 2 |
   | OL | .24 | .10 | .30 | | .06 | | .30 | | Rock 5, Steel 5, Ground 3, Fighting 2 |
   | DE | .14 | .34 | .10 | | | .28 | .14 | | Fighting 5, Dark 2, Dragon 2 |
   | NT | .24 | .20 | .22 | | | | .34 | | Rock 4, Ground 4, Steel 3, Fighting 2 |
   | DT | .20 | .26 | .18 | | | .08 | .28 | | Rock 3, Ground 3, Steel 3, Fighting 3 |
   | OLB | .14 | .30 | .18 | | .08 | .30 | | | Fighting 4, Dark 3, Bug 2 |
   | ILB | .20 | .30 | .28 | | .08 | .14 | | | Fighting 4, Dark 3, Ground 2 |
   | MLB | .18 | .28 | .24 | | .14 | .16 | | | Fighting 4, Dark 3, Ground 2 |
   | CB | | .10 | .14 | | .22 | .46 | | .08 | Flying 3, Dark 3, Ghost 3 |
   | S | .14 | | .16 | .12 | .26 | .32 | | | Flying 4, Psychic 3 |

2. **The type bonus is per pick, not team synergy: only the single highest matching type bonus applies, as flat points added to the 0–100 fit, then clamped.** (High: primary code)
   - https://all22pokemon.com/draft.js
   - ```js
     // 0–100: how well a Pokémon fits a slot in a scheme.
     function positionScore(id, slot, scheme = BASE_SCHEME) {
       const role = ROLES[roleOf(slot, scheme)];
       const f = features(id);
       let s = 0;
       for (const k in role.stats) s += role.stats[k] * f[k];
       let bonus = 0;
       for (const t of POKEDATA[id - 1].types) bonus = Math.max(bonus, role.types[t] || 0);
       return Math.max(0, Math.min(100, s * 100 + bonus));
     }
     ```
   - I found no team-level type-synergy code in draft.js. `rawTeam` (Finding 5) uses only `positionScore`. A dual-type Pokémon that matches two bonus types gets only the larger one (`Math.max`).
   - The scouting page agrees qualitatively: "Some types get a small bonus at certain spots, listed in the chart with the biggest first ... It's a nudge on top of the stats." (https://all22pokemon.com/scouting)

3. **Stat normalization: linear clamps; weight is on a log scale; height is in meters from HEIGHT_DM/10.** (High: primary code)
   - https://all22pokemon.com/draft.js
   - ```js
     const norm = (v, lo, hi) => Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
     ...
       f = {
         hp: norm(p.hp, 20, 150), atk: norm(p.atk, 20, 140), def: norm(p.def, 20, 140),
         spa: norm(p.spa, 20, 140), spd: norm(p.spd, 20, 140), spe: norm(p.spe, 20, 130),
         kg: norm(Math.log(Math.max(p.kg, 0.1)), Math.log(5), Math.log(400)),
         m: norm(HEIGHT_DM[id - 1] / 10, 0.3, 2.2),
       };
     ```
   - Implications (my reading of the code): stats saturate, so HP ≥ 150, Atk/Def/SpA/SpD ≥ 140 and Spe ≥ 130 all count as 1.0. Weight saturates at 400 kg (≤ 5 kg counts as 0). Height saturates at 2.2 m (the scouting page says "It tops out around 7'3"", and 2.2 m ≈ 7'3"). BST is not used anywhere.

4. **Slot → role mapping and schemes (3-4/4-3, fullback/slot).** (High: primary code)
   - https://all22pokemon.com/draft.js
   - ```js
     const BASE_SCHEME = { def: "34", off: "fb" };
     const SLOT_ROLE = {
       S1: "S", S2: "S", CB1: "CB", CB2: "CB", OLB1: "OLB", OLB2: "OLB", ILB1: "ILB", ILB2: "ILB",
       DE1: "DE", DE2: "DE", NT: "NT",
       WR1: "WR", WR2: "WR", LT: "OL", LG: "OL", C: "OL", RG: "OL", RT: "OL", TE: "TE",
       QB: "QB", FB: "FB", HB: "HB",
     };
     const SCHEME_ROLE = { "43": { NT: "DT", ILB2: "DT", ILB1: "MLB" }, slot: { FB: "SLOT" } };
     ```
   - There are 22 starting slots. The kicker (K) is not in the score: "Kicker: not part of a challenge's Team Score." (scouting page)

5. **Slot importance weights (each side sums to 1).** (High: primary code)
   - https://all22pokemon.com/draft.js
   - ```js
     // How much each spot matters to its side of the ball (each side sums to 1).
     const OL = { LT: 0.074, LG: 0.074, C: 0.074, RG: 0.074, RT: 0.074 };
     const OFFENSE_BY = {
       fb: { QB: 0.24, HB: 0.1, FB: 0.04, WR1: 0.09, WR2: 0.09, TE: 0.07, ...OL },
       slot: { QB: 0.24, HB: 0.1, FB: 0.06, WR1: 0.085, WR2: 0.085, TE: 0.06, ...OL },
     };
     const DEFENSE_BY = {
       "34": { DE1: 0.11, DE2: 0.11, NT: 0.1, OLB1: 0.08, OLB2: 0.08, ILB1: 0.09, ILB2: 0.09, CB1: 0.11, CB2: 0.11, S1: 0.06, S2: 0.06 },
       "43": { DE1: 0.11, DE2: 0.11, NT: 0.085, ILB2: 0.085, OLB1: 0.08, OLB2: 0.08, ILB1: 0.11, CB1: 0.11, CB2: 0.11, S1: 0.06, S2: 0.06 },
     };
     ```
   - Because the final raw value averages offense and defense, each slot's effective weight in the whole team is half its side weight. Example: QB = 0.12 of the blended average, and the 5 OL together = 0.185.

6. **Team raw value = 82% weighted average + 18% mean of the 4 weakest fits among all 22.** (High: primary code)
   - https://all22pokemon.com/draft.js
   - ```js
     const WEAK_LINKS = 4;
     const WEAK_WEIGHT = 0.18;
     function rawTeam(lineup, scheme = BASE_SCHEME) {
       const side = (weights) => {
         let avg = 0;
         const fits = [];
         for (const slot in weights) {
           const v = positionScore(lineup[slot], slot, scheme);
           avg += weights[slot] * v;
           fits.push(v);
         }
         fits.sort((a, b) => a - b);
         return { avg, fits, rated: avg * (1 - WEAK_WEIGHT) + ((fits[0] + fits[1]) / 2) * WEAK_WEIGHT };
       };
       const off = side(OFFENSE_BY[scheme.off]), def = side(DEFENSE_BY[scheme.def]);
       const all = [...off.fits, ...def.fits].sort((a, b) => a - b);
       const weak = all.slice(0, WEAK_LINKS).reduce((a, b) => a + b, 0) / WEAK_LINKS;
       const blended = (off.avg + def.avg) / 2;
       return { offense: off.rated, defense: def.rated, raw: blended * (1 - WEAK_WEIGHT) + weak * WEAK_WEIGHT };
     }
     ```
   - The `offense`/`defense` "rated" values (which use each side's 2 weakest spots) are only the displayed sub-scores. The Team Score comes from `raw`. Fits are not rounded inside scoring; `app.js` rounds them only for display: `const fitOf = (id, slotId) => Math.round(DRAFT.positionScore(id, slotId, draft.scheme));`.

7. **Raw → 0–1000 Team Score is a piecewise-linear curve that differs by variant.** (High: primary code)
   - https://all22pokemon.com/draft.js
   - ```js
     const CURVES = {
       all: [[19.5, 0], [71.51, 950], [74, 1000]],
       retro: [[19.5, 0], [61.73, 820], [70.33, 950], [71.83, 1000]],
       151: [[24, 0], [49.49, 885], [56.3, 950], [58.52, 1000]],
     };
     function toScore(raw, variant) {
       const pts = CURVES[variant] || CURVES.all;
       if (raw <= pts[0][0]) return 0;
       for (let i = 1; i < pts.length; i++) {
         const [r0, s0] = pts[i - 1];
         const [r1, s1] = pts[i];
         if (raw <= r1) return Math.round(s0 + ((s1 - s0) * (raw - r0)) / (r1 - r0));
       }
       return 1000;
     }
     function teamScore(lineup, scheme = BASE_SCHEME, variant = "all") {
       const t = rawTeam(lineup, scheme);
       return { score: toScore(t.raw, variant), offense: toScore(t.offense, variant), defense: toScore(t.defense, variant) };
     }
     ```
   - The comment says: "Calibrated on the real results of ~57,000 seasons (October 2026) ... about 0.1% of teams reach 950 and about 0.01% reach 1000".
   - My own arithmetic (Low, inference): in "all", 916 ≈ raw 19.5 + (916/950)·52.01 ≈ 69.65, and 1000 needs raw ≥ 74.0 (+4.35). In retro, 916 ≈ raw 61.73 + (96/130)·8.6 ≈ 68.08, and 1000 needs ≥ 71.83 (+3.75). Above 950, one raw point is worth about 20 score points ("all") or about 33 (retro).
   - Which variant applies: `app.js` calls `DRAFT.teamScore(draft.lineup, draft.scheme, game === "151" ? "151" : draft.variant);`, and draft.js has `const VARIANTS = { all: GENS, retro: ["1", "2", "3", "4"] };`.

8. **Season simulation (for context): win probability is logistic in the score gap.** (High: primary code)
   - https://all22pokemon.com/draft.js
   - `const opponentsFor = (names) => names.map((name, i) => ({ name, score: 350 + (560 * i) / 16 }));` (opponents run 350…910), `const SPREAD = 77.5;`, `const winChance = (score, opp) => 1 / (1 + Math.exp(-(score - opp.score) / SPREAD));`

9. **The data set is embedded in plain JS files, indexed by National Dex number − 1 (#1–1025).** (High: primary code)
   - https://all22pokemon.com/pokedata.js
   - > "// Each entry: "types|HP,Atk,Def,SpA,SpD,Spe|weightKg", types as indexes into TYPE_NAMES."
   - `const TYPE_NAMES = ["normal", "fighting", "flying", "poison", "ground", "rock", "bug", "ghost", "steel", "fire", "water", "grass", "electric", "psychic", "ice", "dragon", "dark", "fairy"];`
   - Sample record: `"11,3|45,49,49,65,65,45|6.9",` (Bulbasaur: grass/poison).
   - Parsed shape: `return { types: t.split(",").map((i) => TYPE_NAMES[Number(i)]), hp, atk, def, spa, spd, spe, kg: Number(w) };`
   - https://all22pokemon.com/pokemon.js supplies `POKEMON_NAMES` (array, dex order), `HEIGHT_DM` ("Official Pokédex heights in decimeters, index = dex number - 1 (source: PokéAPI data)"), the `LEGENDARIES` Set, and `const GEN_ENDS = [151, 251, 386, 493, 649, 721, 809, 905, 1025];`.
   - Weight is stored in kg (`kg`) and height in decimeters. The scouting page's "lb" and feet-and-inches are display conversions.

10. **Scouting page labels (qualitative, exactly as presented) match the code weights.** (High: primary page)
    - https://all22pokemon.com/scouting
    - > "The exact numbers stay secret, because scouting players by eye is half the fun."
    - Key: "Key / Helps / A small part / Doesn't count there". The page columns are HP, ATK, DEF, SPA, SPD, SPE, HEIGHT, WEIGHT and type bonus:

    | Pos | HP | ATK | DEF | SPA | SPD | SPE | HT | WT | Type bonus |
    |---|---|---|---|---|---|---|---|---|---|
    | QB | helps | small | — | key | helps | helps | — | — | Psychic Normal Dragon |
    | HB | helps | key | small | — | — | key | — | small | Fighting Ground Normal |
    | FB | helps | key | key | — | — | — | — | key | Rock Ground Fighting Normal |
    | SLOT | small | helps | — | small | helps | key | — | — | Electric Flying Fairy |
    | WR | — | helps | — | helps | small | key | small | — | Electric Flying |
    | TE | helps | helps | helps | — | — | helps | small | helps | Fighting Water |
    | OL | helps | small | key | — | small | — | — | key | Rock Steel Ground Fighting |
    | DE | helps | key | small | — | — | key | — | helps | Fighting Dark Dragon |
    | NT | helps | helps | helps | — | — | — | — | key | Rock Ground Steel Fighting |
    | DT | helps | key | helps | — | — | small | — | key | Rock Ground Steel Fighting |
    | OLB | helps | key | helps | — | small | key | — | — | Fighting Dark Bug |
    | ILB | helps | key | key | — | small | helps | — | — | Fighting Dark Ground |
    | MLB | helps | key | helps | — | helps | helps | — | — | Fighting Dark Ground |
    | CB | — | small | helps | — | helps | key | small | — | Flying Dark Ghost |
    | S | helps | — | helps | small | key | key | — | — | Flying Psychic |

    (— = "doesn't count", small = "a small part")
    - Grading text: > "Weak spots count extra. Your worst fits drag the score down harder than a star lifts it, so don't leave a hole anywhere."
    - > "It counts on a sliding scale: going from 50 to 100 lb is worth as much as going from 400 to 800 lb." (consistent with the log-kg feature)

11. **Out of scope, noted briefly: draft rules in the same file.** (High: primary code)
    - draft.js: `const ROUNDS = 22;`, `const MAX_LEGENDS = 3;`, `const MON_REROLLS = 5;` (151 Challenge). Each round rolls region then type (`roll`, `rerollType`, `rerollGen`). Randomness is seeded and deterministic (`rand(seed, i)`).

## Conflicts
- **Scouting page vs code, slot importance:** the page says "On defense, the ends and the cornerbacks count most and the safeties least." The 3-4 code matches (DE/CB 0.11, S 0.06). In 4-3, though, ILB1 (MLB) is also 0.11, tied with DE/CB. This is a minor wording gap, not a contradiction.
- **Scouting page vs code, "Defense and Weight matter most for linemen, then HP":** the OL code matches (def 0.3, kg 0.3, hp 0.24). No conflict.
- **Scouting page, "biggest first" type order vs code:** for CB, the page lists "Flying Dark Ghost", and the code has all three at 3. For WR, the page lists "Electric Flying", and both are 4. Ties, so no conflict.
- None of substance found otherwise. Every "key" in the page maps to the largest code weights for that role.

## Unverified
- **Online runs may be scored server-side.** `app.js` comments: "A finished run's Team Score and season: the server's for an online run; worked out from the lineup and seed (and never stored) for one played on this device." Rolls also go through `fetch("/api/app?a=roll", ...)`. I could not see the server code, so I can't confirm that the server uses the identical ROLES/CURVES. It probably shares draft.js ("Pure game logic (no DOM), so it can also be simulated outside the browser"), but that is unconfirmed.
- The code may change: the file was last modified 2026-10-14 and the CURVES comment says "October 2026". Re-fetch draft.js before trusting the constants long-term.

## Leads
- `/api/app?a=<action>` (actions seen: `roll`, `claim`) handles online-run rolls and results. Another researcher handling draft and localStorage should look at `app.js` ~line 1716 and `saves.js` ~line 449.
- `DEFAULT_LINEUPS` in pokemon.js (per-gen starting lineups for the free builder) aren't relevant to scoring.
- A helper bot can load `pokedata.js` + `pokemon.js` + `draft.js` directly and call `DRAFT.positionScore(id, slot, scheme)` / `DRAFT.teamScore(lineup, scheme, variant)`. They are pure functions that depend only on the globals `POKEDATA`, `HEIGHT_DM`, `POKEMON_NAMES`, `LEGENDARIES`, `genOf` and `TYPE_NAMES`.

## Sources read
- https://all22pokemon.com/ (live HTML, fetched 2026-10-15): the list of script files.
- https://all22pokemon.com/scouting (live HTML, 2026-10-15): the qualitative chart, the grading explanation, and the height/weight text.
- https://all22pokemon.com/draft.js (last-modified 2026-10-14): ROLES, slot weights, normalization, rawTeam, CURVES, toScore, season simulation.
- https://all22pokemon.com/pokedata.js (2026-10-15): stats/types/kg data and record format.
- https://all22pokemon.com/pokemon.js (2026-10-15): names, HEIGHT_DM, LEGENDARIES, GEN_ENDS.
- https://all22pokemon.com/app.js (2026-10-15): which variant curve is used, server-result comment, `/api/app` calls.
- https://all22pokemon.com/tips.js (2026-10-15): stat tooltip text only. No numbers.
