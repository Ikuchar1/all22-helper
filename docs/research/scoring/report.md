# How does all22pokemon.com work, and how is its draft score computed?

2026-10-15 · breadth-first (deep) · 1 wave · 3 researchers · 11 sources

Verification: 45 of 54 cited claims supported · see verification.md

## Answer
All of the scoring runs in the browser, in plain, unminified `https://all22pokemon.com/draft.js` (last modified 2026-10-14) [1]. [partly supported]

**How one pick is scored.** A Pokémon's fit for a spot runs from 0 to 100. It is `100 × Σ(role weight × normalized stat)`, plus the largest type bonus among the Pokémon's types (2–6 points), clamped to 0–100 [1].
- Stats are normalized linearly and capped. HP runs 20–150, Atk/Def/SpA/SpD run 20–140, and Spe runs 20–130 [1].
- Weight uses log(kg) from 5 to 400 kg, and height runs from 0.3 to 2.2 m. BST (base stat total) is not used [1].

**How the team is scored.** `raw = 0.82 × (offense weighted avg + defense weighted avg)/2 + 0.18 × mean(4 lowest fits of all 22 starters)` [1]. A per-variant piecewise-linear curve then maps raw to 0–1000:
- Gen 1–9: 19.5→0, 71.51→950, 74→1000
- Retro (Gen 1–4): 19.5→0, 61.73→820, 70.33→950, 71.83→1000 [1]

There is no team-synergy type bonus [1].

**The draft.** It is 22 rounds. Each round rolls a region uniformly at random, then a type that region still has [1][2].
- You may pick any un-drafted Pokémon from that region that has the rolled type as either of its types, and place it in any open spot. The placement is final [1][2].
- Each run has exactly **one type reroll and one region reroll** in total, and a run allows at most 3 Legendaries [1][2].

**Saved state.** The current run is stored in localStorage under `pokemon-all22-draft-v1`, and lifetime stats under `pokemon-all22-draft-stats-v1` [2].

## Per-position stat weights and type bonuses (from `ROLES` in draft.js)
Blank means weight 0. Each row's stat weights sum to 1.0 [1]. "Wt" is the log-scaled weight feature (`kg`) and "Ht" is the height feature (`m`).

| Role | HP | Atk | Def | SpA | SpD | Spe | Wt | Ht | Type bonus (pts) |
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

**What the scouting page shows.** The page at /scouting gives only labels ("Key / Helps / A small part / Doesn't count there") and says "The exact numbers stay secret, because scouting players by eye is half the fun." [5] Every "key" label on the page matches the largest code weights for that role, so the page and the code agree [1][5]. The page also says "Some types get a small bonus at certain spots ... It's a nudge on top of the stats." It describes weight as "a sliding scale: going from 50 to 100 lb is worth as much as going from 400 to 800 lb", which fits the log-kg feature [5].

**How the type bonus applies.** It is per pick only. A dual-type Pokémon that matches two bonus types gets only the larger one (`Math.max`). The bonus is added after the stat sum and before the 0–100 clamp [1].

## Score formula (verbatim core of draft.js [1])
```js
const norm = (v, lo, hi) => Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
// features(id):
//   hp: norm(p.hp,20,150), atk/def/spa/spd: norm(x,20,140), spe: norm(p.spe,20,130),
//   kg: norm(Math.log(Math.max(p.kg,0.1)), Math.log(5), Math.log(400)),
//   m:  norm(HEIGHT_DM[id-1]/10, 0.3, 2.2)
function positionScore(id, slot, scheme = BASE_SCHEME) {
  const role = ROLES[roleOf(slot, scheme)];
  const f = features(id);
  let s = 0;
  for (const k in role.stats) s += role.stats[k] * f[k];
  let bonus = 0;
  for (const t of POKEDATA[id - 1].types) bonus = Math.max(bonus, role.types[t] || 0);
  return Math.max(0, Math.min(100, s * 100 + bonus));
}
const WEAK_LINKS = 4, WEAK_WEIGHT = 0.18;
// rawTeam: for each side, avg = Σ slotWeight × positionScore
//   all = all 22 fits sorted ascending; weak = mean(all[0..3])
//   raw = ((off.avg + def.avg) / 2) * 0.82 + weak * 0.18
const CURVES = {
  all:   [[19.5, 0], [71.51, 950], [74, 1000]],
  retro: [[19.5, 0], [61.73, 820], [70.33, 950], [71.83, 1000]],
  151:   [[24, 0], [49.49, 885], [56.3, 950], [58.52, 1000]],
};
// toScore: linear interpolation between curve points, Math.round, 1000 above the last point
```

**How the code is wired.**
- The displayed offense and defense sub-scores use each side's 2 weakest spots instead, but the Team Score comes only from `raw` [1].
- Fits are rounded only for display (`app.js`) [1]. [partly supported]
- The variant passed in is `draft.variant` (`all` or `retro`) [1]. [partly supported]
- A code comment says the curves were "Calibrated on the real results of ~57,000 seasons (October 2026) ... about 0.1% of teams reach 950 and about 0.01% reach 1000" [1].

**Slot importance weights** (each side sums to 1) [1]:

| Offense | fb | slot |
|---|---|---|
| QB | .24 | .24 |
| HB | .10 | .10 |
| FB (SLOT role in slot) | .04 | .06 |
| WR1 / WR2 | .09 each | .085 each |
| TE | .07 | .06 |
| LT, LG, C, RG, RT | .074 each | .074 each |

| Defense | 3-4 | 4-3 |
|---|---|---|
| DE1 / DE2 | .11 each | .11 each |
| NT (DT in 4-3) | .10 | .085 |
| OLB1 / OLB2 | .08 each | .08 each |
| ILB1 (MLB in 4-3) | .09 | .11 |
| ILB2 (DT in 4-3) | .09 | .085 |
| CB1 / CB2 | .11 each | .11 each |
| S1 / S2 | .06 each | .06 each |

(analysis) Because raw averages offense and defense, each slot's weight in the whole team is half its side weight. QB is 0.12 of the blended average, and the 5 OL together are 0.185. Every one of the 22 slots can also land in the weak-4 term.

(analysis, Low: researcher arithmetic) In Gen 1–9, a score of 916 is about raw 69.65. Reaching 1000 needs raw ≥ 74.0, about +4.35 raw. Above 950, one raw point is worth about 20 score points in "all" and about 33 in retro [1].

## Formations and positions
Every formation uses the same 22 spot ids. Only the scoring role changes, through `SCHEME_ROLE = { "43": { NT: "DT", ILB2: "DT", ILB1: "MLB" }, slot: { FB: "SLOT" } }` [1][2]. Formations are chosen before the run and locked once it starts, and the challenge has no kicker [2][5].

| Formation | Positions (spot id → role) |
|---|---|
| 3-4 defense | S1,S2→S; CB1,CB2→CB; OLB1,OLB2→OLB; ILB1,ILB2→ILB; DE1,DE2→DE; NT→NT |
| 4-3 defense | S×2, CB×2, OLB×2, DE×2; ILB1→MLB; NT and ILB2→DT |
| Fullback offense | WR1,WR2→WR; LT,LG,C,RG,RT→OL; TE; QB; FB; HB |
| Slot offense | as fullback, but FB→SLOT (displayed as WR) and HB displayed as RB |

**Modes.** The 17–0 Challenge is "Draft Mode" on `/`, opened via `#challenge`, `#17-0` or `#draft`, with `#retro` for Gen 1–4. The `/draft` page is a different game: a multiplayer Fantasy Draft [2]. [partly supported] The pool variants are `all: GENS` and `retro: ["1","2","3","4"]` [1][2]. A separate "151 Challenge" rolls a single Kanto Pokémon each round, has 5 rerolls and uses its own curve [1][2].

## Draft and reroll rules
- **Rounds:** `ROUNDS = 22` [2]. [partly supported]
- **Rolls:** each roll is a uniform pick from a seeded PRNG (pseudo-random number generator). The region comes first, from regions with at least one available type, then a type that region still has. A roll is therefore never empty [2]. (Inference, from the researcher's reading of the code) Rolls are not weighted by how many Pokémon a region or type has [2]. [partly supported]
- **Eligible picks:** any Pokémon in `POOL[gen]` that isn't taken, isn't a Legendary once the cap is used, and has the rolled type as either of its types [2]. [partly supported]
- **Placement:** you place the pick in any open spot, and it is locked in. Duplicates are impossible [2].
- **Legendaries:** `MAX_LEGENDS = 3`. Once the cap is reached, rolls never land on a region and type that only has Legendaries left [2].
- **Rerolls:** the run starts with `rerolls: { type: 1, gen: 1 }`. That is one of each per run, and they cost nothing beyond using them up [2].
  - A reroll keeps the other half of the roll and always yields a different value that still has Pokémon.
  - Rerolling clears a pending pick.
- **Signed-out runs:** the rolls are deterministic from the stored `seed`, including rerolls (`seed ^ 0x2e7011` / `seed ^ 0x6e9e11`) [2]. (analysis) A bot could therefore simulate future rolls for local runs.
- **Signed-in runs:** these are leaderboard runs. The server deals them through `/api/app?a=...`, the seed is kept secret, and moves must be at least 1000 ms apart [2].

## localStorage
The prefix is `"pokemon-all22"` [2][4].

| Key | Contents |
|---|---|
| `pokemon-all22-draft-v1` | current 17–0 run (both `all` and `retro` variants) |
| `pokemon-all22-draft-stats-v1` | `{runs, perfect, bestScore, bestWins}` (synced to the account [8]) |
| `pokemon-all22-151-v1` / `-151-stats-v1` | 151 Challenge |
| `pokemon-all22-mode-v1` | `"builder"`, `"draft"` or `"151"` |
| `pokemon-all22-formation-v1` | the builder's scheme (not the run's) |

The table lists the keys that matter for the challenge. The site also keeps builder-only and misc keys, and two sessionStorage keys. No IndexedDB use was found [2].

The run's JSON shape comes from the code. The example values are reconstructed [2]:
```json
{
  "v": 1, "seed": -1234567890, "round": 3, "revealed": true, "started": true,
  "scheme": { "def": "43", "off": "slot" },
  "lineup": { "QB": 65, "LT": 208, "CB1": 6 },
  "pending": null, "variant": "all",
  "roll": { "gen": "1", "type": "fire" },
  "rerolls": { "type": 1, "gen": 0 }
}
```
- `lineup` maps spot id → National Dex id, and `round` equals the number of placed picks.
- `roll.gen` is a string from "1" to "9", and `roll.type` is a lowercase name from `TYPE_NAMES`.
- `pending` is a picked-but-unplaced dex id, or null.
- A finished local run has `roll: null` and adds `counted: true`. Its score is never stored; it is recomputed from the lineup.
- Signed-in runs drop `seed` and add `id`, `step`, `uid`, `result`, `post` and `shiny` [2].

## Pokémon data
The data is embedded JS, indexed by National Dex number − 1 (#1–1025). There is no JSON file [3][4].
- **`pokedata.js` [3]:** one string per Pokémon, `"types|HP,Atk,Def,SpA,SpD,Spe|weightKg"`. The types are indexes into `TYPE_NAMES = ["normal","fighting","flying","poison","ground","rock","bug","ghost","steel","fire","water","grass","electric","psychic","ice","dragon","dark","fairy"]`. For example, Bulbasaur is `"11,3|45,49,49,65,65,45|6.9"`.
- **`pokemon.js` [4]:** `POKEMON_NAMES`, `HEIGHT_DM` (decimeters), the `LEGENDARIES` set, and `GEN_ENDS = [151,251,386,493,649,721,809,905,1025]`.

The functions are pure. `DRAFT.positionScore(id, slot, scheme)` and `DRAFT.teamScore(lineup, scheme, variant)` depend only on these globals, so a bot can load the three files and call them directly [1].

## Conflicts
1. **How many rerolls.** Heldgames says "You get up to five rerolls for the whole draft" [9]. The site's code gives the 17–0 run `rerolls: { type: 1, gen: 1 }` [2], and the 5 belongs to the separate 151 Challenge (`MON_REROLLS = 5`) [1]. The code is the primary source, so for the 17–0 challenge **one type reroll and one region reroll** stands. The article most likely mixed up the modes (analysis).
2. **How the weak-spot penalty is described.** The homepage says "your four weakest spots drag the whole team down" [6]. The code implements this as an 18% blend toward the mean of the 4 lowest fits, not as a subtraction [1]. The two agree; the code gives the exact mechanism.

## Gaps and unverified
- **Server-side scoring for signed-in runs.** For an online run, `app.js` says the Team Score is "the server's". The server code (`/api/app`) isn't served, so it's unconfirmed that the server uses the same constants or roll procedure. It probably shares draft.js ("Pure game logic (no DOM), so it can also be simulated outside the browser") [1][2].
- **The constants change.** draft.js was modified on 2026-10-14 and its curves are dated October 2026. Re-fetch it before relying on these numbers [1].
- **No community strategy material.** There's no public repo [7]. [partly supported] The site launched around 2026-10-09 [10]. The creator (@ColeThereum) and the Discord (discord.gg/B8YvRMtrVt) need a logged-in human to read [7]. [partly supported] One fan wiki agrees that weight matters for linemen and fullbacks and height for WR/TE/CB [11].

## Assumptions
- "Gen 1–9 / Gen 1–4" means the code's `all` / `retro` variants.
- The constants are as served on 2026-10-15.
- Researcher copies of draft.js, pokedata.js, pokemon.js and scouting.html are in `/Users/ikuchar/research/2026-10-15-all22pokemon-scoring/wave-1/r1-bundle/`.

## Sources
1. all22pokemon.com draft.js — https://all22pokemon.com/draft.js
2. all22pokemon.com app.js — https://all22pokemon.com/app.js
3. all22pokemon.com pokedata.js — https://all22pokemon.com/pokedata.js
4. all22pokemon.com pokemon.js — https://all22pokemon.com/pokemon.js
5. Scouting guide — https://all22pokemon.com/scouting
6. Homepage — https://all22pokemon.com
7. About page — https://all22pokemon.com/about
8. all22pokemon.com saves.js — https://all22pokemon.com/saves.js
9. Heldgames guide — https://heldgames.com/guides/all22-pokemon-football-game-handhelds
10. Dexerto — https://www.dexerto.com/pokemon/pokemon-browser-game-lets-fans-draft-fantasy-football-teams-and-play-full-seasons-3417793/
11. All22 fan wiki — https://all22pokemonhub.wiki

## Run
Wave 1:
- r1 read the scoring code: the full formula, weights, curves and data format.
- r2 read the mechanics: modes, formations, rolls, rerolls and localStorage.
- r3 searched external sources: no repo; creator credits; the "five rerolls" claim, which the code refutes for 17–0.

Stopped because no open gap changes the answer; the core questions are answered from the site's own code.
Plan: plan.md · Gaps: gaps-1.md · Findings: wave-1/*.md
