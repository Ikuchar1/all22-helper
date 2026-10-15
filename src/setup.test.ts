import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("setup", () => {
  it.each(["draft.js", "pokedata.js", "pokemon.js"])("vendor/%s is synced", (file) => {
    expect(existsSync(`vendor/${file}`), "run `npm run sync`").toBe(true);
  });
});
