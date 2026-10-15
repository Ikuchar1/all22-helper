---
paths:
  - "src/**"
  - "scripts/**"
---
# Working in src/
- `vendor/` holds the site's own `draft.js`, `pokedata.js` and `pokemon.js`, downloaded by `npm run sync`. Never edit them; wrap them. They are classic browser scripts that declare globals (`const DRAFT = (() => {…})()`, `POKEMON_NAMES`, `TYPE_NAMES`), not ES modules.
- The site's logic is the source of truth. A test's expected fit comes from the game (or from calling `DRAFT` directly), never from our own reimplementation.
- Names follow CONTEXT.md: spot, fit, ceiling, edge, roll, region, formation.
- Prettier, 100 wide. Run `npm run format` rather than formatting by hand.

## Where tests go
Next to the code: `src/<area>/<file>.test.ts`, run by Vitest (Node environment). Name tests after behavior in the glossary's words: "a Fire-type at QB gets the fit the game shows", not "positionScore returns 82".

## Running one test
`npx vitest run src/scoring/fit.test.ts -t "QB"`
