# Verification

Supported: 45/54 (83%) · partly: 9 · not supported: 0 · unreachable: 0 · not checked: 0

Checked 2026-10-15T09:34:55-05:00 against quote-check.json. WebFetches: 0/15.

## Claims
- **c1** · partly supported · quotes: draft.js set (q5–q27), none on point · cache
  draft.js is plain and unminified, but the "last modified 2026-10-14" date isn't in the page. app.js (comment above draftResult) says an online run's Team Score is "the server's", so "all of the scoring runs in the browser" overstates it.
- **c2** · supported · quotes: draft.js set · cache
  positionScore: `s*100 + max type bonus`, clamped 0–100. Bonus values in ROLES range from 2 to 6.
- **c3** · supported · quotes: draft.js set · cache
  features(): hp 20–150, atk/def/spa/spd 20–140, spe 20–130.
- **c4** · supported · quotes: draft.js set · cache
  features() uses only the individual stats, kg and m. No BST anywhere.
- **c5** · supported · quotes: draft.js set · cache
  rawTeam: `blended*(1-0.18) + weak*0.18`, where weak = mean of the 4 lowest of all 22 fits.
- **c6** · supported · quotes: draft.js set · cache
  CURVES.retro matches exactly.
- **c7** · supported · quotes: draft.js set · cache
  The only type effect is the per-pick bonus in positionScore. There's no team-level type term.
- **c8** · supported · quotes: q18 exact, q19 reworded, q20 exact · cache
  roll() uses pickFrom (uniform) for the region, filtered to regions with types left, then a type that region has.
- **c9** · supported · quotes: q31 exact
  The toast says "is locked in at".
- **c10** · supported · quotes: q21 exact, q22 trimmed, q26 exact
  `rerolls: { type: 1, gen: 1 }` per run. MAX_LEGENDS = 3.
- **c11** · supported · quotes: q37 exact, q38 exact · cache
  DRAFT_KEY/DRAFT_STATS_KEY are the 17–0 runKey/statsKey. app.js also uses the literal `pokemon-all22-` prefix.
- **c12** · supported · quotes: draft.js set · cache
  All 15 ROLES rows sum to 1.0 (checked by hand). The table values match the code.
- **c13** · supported · quotes: q2 exact · cache
  The four labels and the quote are on /scouting. Every "Key" cell corresponds to the top weight(s) of its role (checked all 15 roles).
- **c14** · supported · quotes: q4 exact · cache
  The "nudge on top of the stats" and "sliding scale" passages are verbatim on /scouting.
- **c15** · supported · quotes: draft.js set · cache
  `Math.max(0, Math.min(100, s * 100 + bonus))`.
- **c16** · supported · quotes: draft.js set · cache
  `rated` uses fits[0], fits[1] per side. teamScore.score = toScore(t.raw).
- **c17** · partly supported · quotes: draft.js set · cache
  True (app.js `fitOf = Math.round(DRAFT.positionScore(...))`), but the sentence cites only draft.js, which never rounds and doesn't mention display.
- **c18** · partly supported · quotes: draft.js set · cache
  True in app.js (`DRAFT.teamScore(draft.lineup, draft.scheme, ... draft.variant)`), but the sentence cites only draft.js, which just has a `variant` parameter.
- **c19** · supported · quotes: draft.js set · cache
  The comment above CURVES matches the quoted text, with a fair ellipsis.
- **c20** · supported · quotes: draft.js set · cache
  The comment says "each side sums to 1". OFFENSE_BY/DEFENSE_BY each sum to 1.0, and the report's table matches.
- **c21** · supported · quotes: draft.js set · cache
  Labelled analysis. Derived from CURVES: 50/2.49 ≈ 20 (all), 50/1.5 ≈ 33 (retro).
- **c22** · supported · quotes: q13 exact
  SCHEME_ROLE verbatim. The code comment says every spot keeps its id.
- **c23** · supported · quotes: q10 reworded, q11 exact · cache
  app.js: "Picked before round 1 and locked in once the run starts", and the draft scheme has `k: false`. /scouting: kicker "not part of a challenge's Team Score".
- **c24** · partly supported · quotes: none on point · cache
  app.js only names "Fantasy Draft" as a mode in the menu comment. The `/draft` URL and "snake-draft against your friends" are on the About page [7], which isn't cited here.
- **c25** · supported · quotes: q5 exact
  `VARIANTS = { all: GENS, retro: ["1","2","3","4"] }`.
- **c26** · supported · quotes: draft.js set · cache
  draft.js: 151 Challenge "rolls one of the original 151", `MON_REROLLS = 5`, its own CURVES entry.
- **c27** · partly supported · quotes: q21 exact, q16 exact (draft.js)
  The literal `ROUNDS = 22` is in draft.js. The cited app.js only says "22 rounds" and uses `DRAFT.ROUNDS`.
- **c28** · supported · quotes: q19 · cache
  app.js validDraft: "An unfinished run needs a roll that still has Pokémon left". The roll logic in draft.js agrees.
- **c29** · partly supported · quotes: none on point · cache
  The inference is sound (pickFrom picks uniformly over a filtered list, unweighted), but that code is in draft.js. The cited app.js has no roll logic.
- **c30** · partly supported · quotes: q25 exact (draft.js)
  `POOL[gen].filter(...)` is in draft.js's available(). The cited app.js only calls DRAFT.available.
- **c31** · supported · quotes: q28 exact
  The validator rejects `seen.has(id)`, and taken ids are excluded from rolls.
- **c32** · supported · quotes: q27 reworded · cache
  app.js fitLegendLimit re-rolls if the current roll "only has Legendaries left". draft.js has the same comment.
- **c33** · supported · quotes: q21 exact, q22 trimmed · cache
  useReroll only decrements the counter and clears the pending pick. No other cost.
- **c34** · supported · quotes: · cache
  app.js useReroll: `draft.seed ^ 0x2e7011` (type) and `draft.seed ^ 0x6e9e11` (region).
- **c35** · supported · quotes: q32 reworded, q34 exact, q35 exact · cache
  "The server takes a move no sooner than this after dealing its roll", with MIN_MOVE_MS = 1000. The seed "stays secret".
- **c36** · supported · quotes: q36 exact, q37 exact
  `key: "pokemon-all22"` in pokemon.js, used as the prefix in app.js.
- **c37** · supported · quotes: q45 exact · cache
  saves.js lists `pokemon-all22-(draft|151)-stats-v1` among "The keys that sync".
- **c38** · supported · quotes: · cache
  No "indexedDB" in app.js (case-insensitive grep).
- **c39** · supported · quotes: q40 exact
  The shape matches newDraft. The sentence correctly calls the values reconstructed.
- **c40** · supported · quotes: q42 reworded · cache
  adoptServer adds id/step/result/post/shiny and runs `delete run.seed`. `run.uid` is set on sign-in start.
- **c41** · supported · quotes: q1 exact, q36 exact
  The data is in pokedata.js/pokemon.js as JS constants.
- **c42** · supported · quotes: q1 exact
  Format string verbatim.
- **c43** · supported · quotes: q36 · cache
  pokemon.js defines POKEMON_NAMES, LEGENDARIES, HEIGHT_DM and GEN_ENDS with the exact values.
- **c44** · supported · quotes: draft.js set · cache
  draft.js: "Pure game logic (no DOM)". It depends only on globals from pokemon.js and pokedata.js, and both functions are exported.
- **c45** · supported · quotes: q53 exact
  Verbatim.
- **c46** · supported · quotes: q22 trimmed · cache
  app.js newDraft `rerolls: { type: 1, gen: 1 }`. draft.js `MON_REROLLS = 5` for the 151 Challenge.
- **c47** · supported · quotes: q47 exact
  Verbatim.
- **c48** · supported · quotes: draft.js set · cache
  `blended*(1-0.18) + weak*0.18`: a blend, not a subtraction.
- **c49** · supported · quotes: · cache
  The quote is verbatim from draft.js line 3, and the sentence is hedged ("probably").
- **c50** · supported · quotes: draft.js set
  Advice. It adds no factual claim beyond draft.js being the source.
- **c51** · partly supported · quotes: q54, q55 exact · cache
  The About page links no repository, but that only shows none is linked, not that "there's no public repo".
- **c52** · supported · quotes: q57 exact · cache
  Dexerto embeds @ColeThereum's announcement post dated October 9, 2026.
- **c53** · partly supported · quotes: q54 exact · cache
  The About page names @ColeThereum and links the Discord. That they "need a logged-in human to read" is the researcher's own observation, not the page's.
- **c54** · supported · quotes: q51 exact
  Verbatim match on the fan wiki.

## Uncited sentences in the Answer
1. "A per-variant piecewise-linear curve then maps raw to 0–1000:"
2. "Gen 1–9: 19.5→0, 71.51→950, 74→1000"
3. "It is 22 rounds."

## Annotate
c1 | partly supported | All of the scoring runs in the browser, in plain, unminified `https://all22pokemon.com/draft.js` (last modified 2026-10-14) [1].
c17 | partly supported | Fits are rounded only for display (`app.js`) [1].
c18 | partly supported | The variant passed in is `draft.variant` (`all` or `retro`) [1].
c24 | partly supported | The `/draft` page is a different game: a multiplayer Fantasy Draft [2].
c27 | partly supported | **Rounds:** `ROUNDS = 22` [2].
c29 | partly supported | (Inference, from the researcher's reading of the code) Rolls are not weighted by how many Pokémon a region or type has [2].
c30 | partly supported | **Eligible picks:** any Pokémon in `POOL[gen]` that isn't taken, isn't a Legendary once the cap is used, and has the rolled type as either of its types [2].
c51 | partly supported | **No community strategy material.** There's no public repo [7].
c53 | partly supported | The creator (@ColeThereum) and the Discord (discord.gg/B8YvRMtrVt) need a logged-in human to read [7].
