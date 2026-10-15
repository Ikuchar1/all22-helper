# Research brief: How does all22pokemon.com work, and how is its draft score computed?

- **Date:** 2026-10-15
- **Question:** How does the browser game all22pokemon.com work, with heavy focus on the scouting page (https://all22pokemon.com/scouting)? Specifically: (1) how much each Pokémon base stat (HP, Atk, Def, SpA, SpD, Spe, and any others) is worth at each football position, exactly as the scouting guide presents it; (2) what type bonuses exist and how they apply (per position? per team? synergy?); (3) how the final team score (max 1000) is computed from stats, positions and types — the actual formula if it can be found in the site's JavaScript bundle; (4) game modes and setup options: "17-0" mode, Gen 1–9 vs Gen 1–4 pool, 4-3 vs 3-4 defense, slot vs fullback offense, and which positions/slot counts each formation produces; (5) the draft mechanics: 22 picks, each roll gives a region/generation + a type, the rules for rerolling region or type (how many rerolls, any cost), and whether a pick can be any Pokémon matching both; (6) what game state the site keeps in browser localStorage (key names, JSON shape — current roll, roster, rerolls left, scores). Inspect the live site and its served JS/JSON directly: fetch the HTML, find the script bundles, and read them for scoring constants, position weight tables, type-bonus tables, the Pokémon data set, and localStorage keys.
- **Why:** The user wants to build a helper bot that, for each roll, recommends the best Pokémon to pick and the best position to place it, to push their best score from 916 toward 1000. This research feeds a design session about how to build that program.
- **Already known:**
  - Modes: 17-0, with a Gen 1–9 or Gen 1–4 pool; choose 4-3 or 3-4 defense; choose slot or fullback offense.
  - You draft 22 Pokémon. Each roll gives a region and a type (e.g. Fire + Kanto → Charizard or Moltres). You may reroll the region or the type.
  - 1000 is the best possible score; the user's best is 916.
  - A scouting guide shows how valuable each stat is per position (e.g. Sp. Atk is good for QB/WR/TE; offensive line wants high Defense) and there are type bonuses.
  - A friend reports the game keeps its state in localStorage.
- **Scope:** In: the all22pokemon.com site itself (pages, JS bundles, data files, API endpoints), any public source repo, and any community write-ups/strategy posts (Reddit, Discord summaries, GitHub). Out: general Pokémon competitive strategy unrelated to this game.
- **Preferred sources:** The live site and its own JavaScript/JSON (primary); a public GitHub repo for the site if one exists; the creator's own posts.
- **Avoid:** Generic Pokémon stat sites except as a source for base-stat data if the game's own data isn't found.
- **Effort:** deep
- **Output:** A report that answers first, then explains. Include the exact per-position stat weight table and type bonus table (as tables), the score formula as code/pseudocode if found, the formation→position list, the draft/reroll rules, and the localStorage keys with an example JSON shape. Flag clearly anything inferred rather than read from the site's code. Max ~2000 words plus tables.
- **Clarifications:** None asked.
