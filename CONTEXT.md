# All22 Helper

A Chrome side-panel helper for the all22pokemon.com 17–0 draft challenge. It advises which Pokémon to pick and which spot to place it in; the player still makes every click.

## Language

**Spot**:
One of the 22 lineup positions a Pokémon is placed in (QB, LT, CB1, S2, …). Each spot has one scoring role.
_Avoid_: Slot, position

**Fit**:
How well one Pokémon suits one spot, on a 0–100 scale, as the game computes it from stats, weight, height and type bonus.
_Avoid_: Rating, grade

**Spot weight**:
How much a spot counts toward the team score relative to the other spots (QB is the highest).
_Avoid_: Importance, priority

**Ceiling**:
The fit a spot can realistically expect to get from the rest of the draft, estimated by simulating the remaining rolls — not the best fit anywhere in the pool.
_Avoid_: Max, best possible, pool max

**Edge**:
How much a Pokémon's fit at a spot beats that spot's ceiling, scaled by the spot's real weight and shown in final-score points (0–1000 scale). The ranked list sorts by edge.
_Avoid_: Gain, value, score

**Dumping spot**:
A low-weight spot where a mediocre pull costs the team the least.
_Avoid_: Filler, garbage spot

**Weak links**:
The team's 4 lowest fits across all 22 spots; their average counts for 18% of the raw team score regardless of spot weight.
_Avoid_: Bottom four, weakest spots

**Roll**:
The region + type pair dealt each round; the player picks any available Pokémon matching both.
_Avoid_: Pull, draw

**Region**:
The generation a roll draws from (Kanto = Gen 1, Johto = Gen 2, …). The game's code calls it `gen`.
_Avoid_: Gen, generation

**Reroll**:
Replacing one half of the current roll. Each run has exactly one type reroll and one region reroll.
_Avoid_: Redraw, mulligan

**Seed**:
The hidden number that decides every roll in a run. Visible only on signed-out runs; the server keeps it secret on signed-in runs.
_Avoid_: Random seed, RNG

**Normal mode**:
The helper's default: it estimates ceilings by simulating rolls it can't see. Works on any run.
_Avoid_: Signed-in mode

**Cheat mode**:
A signed-out-only mode that reads the seed, knows every future roll, and plans the whole draft in advance. Scores from it are not real attempts.
_Avoid_: Foresight mode, seed mode

**Variant**:
Which Pokémon a 17–0 run can roll: all regions (Gen 1–9) or retro (Gen 1–4). Each variant has its own score curve.
_Avoid_: Mode, edition

**Legend cap**:
A run may draft at most 3 Legendaries; after the third, none are offered. Each unused legend is a resource to spend on a high-weight spot.
_Avoid_: Legendary limit

**Formation**:
The defense (4-3 or 3-4) and offense (slot or fullback) chosen before round 1 and locked for the run. It changes some spots' roles and weights. The game's code calls it `scheme`.
_Avoid_: Scheme, playbook

**Simulated draft**:
One fake finish of the current run, from the next round to round 22, with random rolls and a greedy drafter (highest fit × spot weight each round). Ceilings come from hundreds of these.
_Avoid_: Rollout, playout
