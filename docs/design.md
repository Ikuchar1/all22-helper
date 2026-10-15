# Design

Decisions from the design session on 2026-10-15. Vocabulary is defined in [`CONTEXT.md`](../CONTEXT.md). The evidence for how the game works is in [`research/scoring/report.md`](research/scoring/report.md) and [`research/helper-tool/report.md`](research/helper-tool/report.md).

## What it is

It's an unpacked Chrome MV3 extension. Chrome loads it from this folder through **Load unpacked**, and it never goes to the Web Store. It opens as a **side panel** that only works on all22pokemon.com. The panel advises which Pokémon to pick and which spot to put it in. The player still makes every click.

The goal is to push a best of 916 toward 1000 on the 17–0 challenge.

## How it works

| Part | Job |
|---|---|
| **Service worker** | `sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`. Uses per-tab `sidePanel.setOptions` so the panel is enabled only on all22pokemon.com. |
| **Content script** (isolated world) | Reads the run from `localStorage["pokemon-all22-draft-v1"]` and sends it to the panel with `chrome.runtime.sendMessage`. It sends again when `body[data-dp]` changes (MutationObserver) and from a ~1 s polling backstop, because `saveRun()` is also called from server catch-up, offerRetro, playOnThisDevice and foundSignedOut. It also reports hover/click on `.cand` (dex id from `canvas.thumb[data-id]`) and `.hotspot[data-slot]`. |
| **Side panel** (the brain) | Bundles its own copies of the site's `pokemon.js`, `pokedata.js` and `draft.js` and calls `DRAFT.positionScore` / `teamScore`. Runs the simulations, ranks, and renders. |

Clicking a hotspot while a pick is pending places the Pokémon right away. That's why the advice has to be on screen while the pick list is open, not after.

## The ranking

- **Edge** = (fit − ceiling) × the spot's effective weight, converted to **final-score points** (0–1000) on the run's variant curve. The effective weight includes the weak-links term (the 4 lowest fits count for 18% of raw).
- **Ceiling** = the fit a spot realistically ends up with, from a few hundred **simulated drafts** of the remaining rounds. It isn't the pool max.
- **Simulated drafts** use a **greedy drafter**: each round it takes the candidate × open spot with the highest fit × spot weight. Uniform region roll, then a type that region still has, the same as `roll()`.
- The **legend cap** (3) needs no special rule. A simulated draft that starts after you take a legendary can only take the remaining ones, so the cost of spending one is already in the edge. Late in a draft with legends unused, the ceilings drop and legends float to the top.
- Supports **both variants** (all / retro). The variant is read from the run, and it sets both the pool and the score curve.

## Reroll advice

One line: "hold both", "use type reroll", or "use region reroll". It recommends a reroll only when the expected gain beats the value of holding it.

## Formation advice

On the setup screen it recommends a defense (4-3/3-4) and an offense (slot/fullback). To get the recommendation, it simulates thousands of full drafts for each of the 4 combos, per variant, and picks the highest average score. The player currently defaults to 4-3 + slot without knowing whether that's best.

## Panel layout

```
Round 8 · Fire Kanto          Projected: 931
─────────────────────────────────────────────
Reroll: hold both
─────────────────────────────────────────────
1. Arcanine  → CB1   +18   fit 82 / ceil 60
2. Arcanine  → DE2   +11   fit 79 / ceil 69
3. Moltres ★ → QB    +9    fit 88 / ceil 83   legend 1 of 3
4. Rapidash  → S1    +3    fit 70 / ceil 65
   …top 10
─────────────────────────────────────────────
Hovering: Ninetales — best: WR2 +4, CB2 +2
```

The numbers above are made up. "Projected" is the average final score across the simulated drafts if you take pick #1.

## Modes

- **Normal mode** (built first): simulation only. Works the same signed in or signed out. The player usually plays signed in, where the server deals rolls and keeps the seed secret.
- **Cheat mode** (phase 2, signed-out only): reads `seed` from the run. Rolls are deterministic: `roll(seed, round, taken)`, with rerolls using `seed ^ 0x2e7011` (type) and `seed ^ 0x6e9e11` (region). So it can plan all 22 picks and both rerolls exactly. Same scoring and panel; only the planner changes. Its scores are for fun, not real attempts.

## Staying in sync with the game

- `npm run sync` downloads the live `draft.js`, `pokedata.js` and `pokemon.js` from all22pokemon.com into the project.
- When the panel opens, the content script fetches the live `draft.js` and compares it with the bundled copy. If they differ, the panel shows a red banner: "Game updated, run `npm run sync`."

## Stack

TypeScript + Vite, no UI framework. Claude writes the code and walks the player through it.

## Build order

Each slice works on its own.

1. **Scoring engine.** The site's scoring running in TypeScript, with fits checked against the numbers the game shows.
2. **Live panel, no brain.** The current roll plus every candidate's raw fit at every open spot. It's usable on real runs from here.
3. **Simulation.** Ceilings, edge in score points, the ranked top-10 list, projected score.
4. **Extras.** Reroll advice, formation recommendation, staleness banner.
5. **Cheat mode.**
