# Gaps after wave 1

## New this wave
- Full scoring code in draft.js: ROLES stat weights + type bonuses, normalization ranges, positionScore, rawTeam (82% weighted avg + 18% mean of 4 weakest), CURVES raw->1000 (r1-scoring.md)
- Slot importance weights OFFENSE_BY/DEFENSE_BY (r1-scoring.md)
- Data set embedded in pokedata.js / pokemon.js, record format (r1-scoring.md)
- 22 fixed spot ids; 4-3 / slot re-role via SCHEME_ROLE (r1, r2)
- Rolls: seeded uniform region then type; never empty; 1 type + 1 region reroll per run; 3-legend cap; free placement, no dupes (r2-mechanics-state.md)
- localStorage keys pokemon-all22-draft-v1 and -draft-stats-v1 with JSON shape (r2-mechanics-state.md)
- Creator @ColeThereum, no public repo; Heldgames "five rerolls" claim (r3-community.md)

## Open
1. Heldgames "five rerolls" vs code "one type + one region per run" — nice to know — resolved by code: MON_REROLLS = 5 belongs to the separate 151 Challenge (r1 #11, r2 #1/#7). Code is primary; report as conflict resolved.
   Source of the gap: conflict r3 vs r2.
2. Server-side scoring/rolls for signed-in leaderboard runs (api/app.mjs) — not findable — server code is not served.
   Source of the gap: r1/r2 Unverified.
3. Community high-score strategy (Discord, X) — nice to know — needs logged-in human.
   Source of the gap: r3 Leads.

## Decision
Stop: no open gap changes the answer; core questions answered from primary code.
