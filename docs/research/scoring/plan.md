# Plan

Query type: breadth-first (deep). Separate parts — scoring internals, game/draft/state mechanics, and community/external sources — can be researched independently, mostly from the same live site + JS bundle.

## Sub-questions (wave 1)
1. r1 — Scoring internals: scouting page content, per-position stat weight table, type bonus table, final score formula (max 1000), Pokémon data set location. Boundary: not draft/reroll rules or localStorage. Budget: hard. Findings: wave-1/r1-scoring.md
2. r2 — Game mechanics + state: modes (17-0, Gen 1–9/1–4), formations (4-3/3-4, slot/fullback) -> position list and counts, draft/reroll rules, localStorage keys and JSON shape. Boundary: not the stat-weight/type/score formula. Budget: hard. Findings: wave-1/r2-mechanics-state.md
3. r3 — External sources: public GitHub repo, creator posts, Reddit/Discord/X strategy write-ups, any community-documented formula or tips for high scores. Boundary: not reading the live bundle in depth (r1/r2 do that). Budget: medium. Findings: wave-1/r3-community.md

## Assumptions
- "Max 1000" score is treated as the site's normalized max; researchers report whatever normalization the code shows.
- Base-stat data from the game's own bundle is preferred; generic stat sites only if absent.
- Report length ~2000 words plus tables per brief.
