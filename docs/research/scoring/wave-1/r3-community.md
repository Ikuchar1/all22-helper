# External sources on all22pokemon.com: repo, creator posts, community write-ups explaining score, position weights, type bonuses, rerolls, tips for ~1000

Researched 2026-10-15. Budget: medium, used 14 tool calls.

## Answer
No public source repo exists. The site and its About page link to X and Discord only, and the GitHub code search turned up nothing but unrelated projects that mention the site. The creator is @ColeThereum on X, and the concept comes from @OldTownJB. The site launched around 2026-10-09, so it is about a week old, and the community material is thin: three press or guide articles (Dexerto, Heldgames, Retro Dodo), one unaffiliated fan wiki (all22pokemonhub.wiki), and a Discord I can't read. None of them gives a formula, numeric stat weights, type-bonus values, or tips for reaching 1000. Taken together, the external sources add only three things to what's already known. Each Pokémon is graded on "base stats, size and type". QB, pass rushers and corners count most, and "your four weakest spots drag the whole team down". The fan wiki adds that weight matters for linemen and fullbacks and height for WR/TE/CB. The four-weakest penalty is the most useful lead for the bot: a lineup with no weak spots probably beats one with a few stars. The exact numbers will have to come from the JS bundle.

## Findings
1. **The site's own text says grades come from base stats, size and type, that QB, pass rushers and corners weigh most, and that the four weakest spots drag the team down.** (High: primary source, and Heldgames independently paraphrases it)
   - https://all22pokemon.com
   - > "Each Pokémon is graded on how well it fits its position, from its base stats, size and type."
   - > "QB, pass rushers and corners count the most, and your four weakest spots drag the whole team down."
   - > "Opponents range from 350 to 910."
   - https://heldgames.com/guides/all22-pokemon-football-game-handhelds (2026-10-12): > "Each Pokémon is scored on base stats, size and type." / > "Quarterback, pass rushers and cornerbacks count for the most"
2. **The fan wiki says size is position-dependent: weight matters for linemen and fullbacks, height for receivers, tight ends and corners.** (Medium: one unaffiliated fan site with no operator named. It may be paraphrasing the /scouting page, so verify against the bundle.)
   - https://all22pokemonhub.wiki
   - > "Weight is important for linemen and fullbacks, while height is used for receivers, tight ends and corners."
   - > "This is an independent fan guide. Play the actual game at all22pokemon.com."
3. **Rerolls: five for the whole draft, in several kinds.** (Medium-High: the site UI labels plus one article)
   - https://heldgames.com/guides/all22-pokemon-football-game-handhelds
   - > "You get up to five rerolls for the whole draft, which is the main strategic resource."
   - The site UI (via WebFetch of https://all22pokemon.com) shows the labels "Reroll Pokémon," "Reroll type," "Reroll region," and "Original 151 Rerolls," with a counter at 5. These are UI labels, not prose explaining the rules. It isn't confirmed whether each kind costs one from a shared pool of 5.
4. **The creator is @ColeThereum on X, the idea is credited to @OldTownJB, and the contact channels are X and Discord. No repo is linked.** (High: the site's homepage and About page)
   - https://all22pokemon.com/about
   - > "Built by @ColeThereum." / > "The All-22 idea comes from @OldTownJB."
   - Discord: https://discord.gg/B8YvRMtrVt (not readable via fetch)
5. **No public source repository was found.** (Medium: absence of evidence)
   - A `gh search repos` for "all22 pokemon" and "all22pokemon" returned no repo for the game. A `gh search code "all22pokemon"` found only unrelated projects that mention it: `pnascimento9596/pokedraft` (a clone-inspired project that says "Nothing copied from all22pokemon.com"), `ecbarish/generations` (a research doc), `threej-in/game-portal` (embeds a mirror at all22pokemon.top), and a newly-registered-domains list showing all22pokemon.com in the 2026-10-10 file.
   - https://github.com/ecbarish/generations (docs/research/lantern-bowl-deep-comparison.md, 14 Oct 2026): > "ALL-22: I describe its techniques only. No code or assets were copied, because it has no licence and uses Pokémon IP."
6. **The site launched about 2026-10-09 from an X post. The creator's own best early results were modest (10-7, later 13-4).** (Medium)
   - https://www.dexerto.com/pokemon/pokemon-browser-game-lets-fans-draft-fantasy-football-teams-and-play-full-seasons-3417793/ (published 2026-10-10). It quotes the creator's tweets: > "I made a game where you draft your All 22 Pokemon team from randomly rolled Regions and Pokemon Types" / > "So far my best record is 10-7 lol"
   - https://heldgames.com/guides/all22-pokemon-football-game-handhelds: > "the creator's own best run was 10-7, later improving to 13-4."
   - Dexerto's launch date is the WebFetch summarizer's inference from tweet dates, not a quoted sentence.
7. **The third-party research doc's notes on the on-field sim suggest that games are simulated with randomness on top of the rating.** (Low: secondhand notes by a non-affiliated researcher. They describe the sim, not the 0–1000 score.)
   - https://github.com/ecbarish/generations, docs/research/lantern-bowl-deep-comparison.md
   - > "full 11-a-side with real block engagement, shed timers (1.6-3.4 s × U(0.45-1.55)), leverage, pancakes, tackle rolls from about 0.56 with modifiers"

## Conflicts
- Game description: Retro Dodo (https://retrododo.com/pokemon-meets-american-football-in-this-new-free-to-play-browser-game/, updated 2026-10-12) says > "All 22 has two modes: Pro and Bowl." and describes playable controls. The site itself, Dexerto and Heldgames describe a lineup draft followed by a simulated 17-game season. Retro Dodo may be describing the on-field viewer, or it may be confused. Either way it doesn't bear on scoring. The site is the stronger source.

## Unverified
- How the "four weakest spots" penalty is calculated (subtraction, averaging, or a multiplier) and the exact weight multipliers per position. No external source gives numbers.
- Type bonus values or which types fit which positions. The fan wiki and articles say only that "type" is an input.
- Whether 1000 is reachable in practice, or what the leaderboard top scores are. The leaderboard is linked to X and wasn't fetched.
- Whether the different reroll types share one pool of 5.
- A Reddit discussion: searches found none indexed. The WebSearch summary claimed the launch post had about 847,000 views and a 17-0 follow-up about 1.4 million, but I didn't fetch a source for this.
- The original @OldTownJB idea post (x.com returned HTTP 402).

## Leads
- The Discord (https://discord.gg/B8YvRMtrVt) is the most likely place for creator explanations of the formula and high-score strategy. It needs a logged-in human.
- The creator's X timeline (@ColeThereum) may contain replies explaining the weights. It needs an authenticated X fetch.
- all22pokemonhub.wiki may have sub-pages per position ("positions, formations, lineups, and challenges"). Only the homepage was read.
- The "four weakest spots" penalty is the single most important design hint for the helper bot. Raising the floor of a lineup with no weak spots likely matters more than a few elite picks. The bundle team should confirm the exact mechanic.

## Sources read
- https://all22pokemon.com (live site, read 2026-10-15): creator credit, the grading sentence, the "four weakest spots" sentence, reroll labels, opponent range 350–910.
- https://all22pokemon.com/about (live site): "Built by @ColeThereum", Discord link, no repo.
- https://www.dexerto.com/pokemon/pokemon-browser-game-lets-fans-draft-fantasy-football-teams-and-play-full-seasons-3417793/ (Dexerto, 2026-10-10): the creator's tweets, launch context, no scoring detail.
- https://heldgames.com/guides/all22-pokemon-football-game-handhelds (Heldgames, 2026-10-12): the "five rerolls" sentence, position weighting, the creator's 10-7 and 13-4 runs.
- https://retrododo.com/pokemon-meets-american-football-in-this-new-free-to-play-browser-game/ (Retro Dodo, 2026-10-12): the Pro/Bowl description, no scoring detail.
- https://all22pokemonhub.wiki (anonymous fan wiki, undated): the height/weight-by-position sentence.
- GitHub code search plus `ecbarish/generations` docs/research/lantern-bowl-deep-comparison.md (2026-10-14) and `pnascimento9596/pokedraft` docs/decisions/dispatch-3.md: confirm there's no public repo, plus third-party sim notes.
- https://x.com/OldTownJB/status/2108255031028015484: fetch failed (HTTP 402).
