import { describe, expect, it } from "vitest";
import { isGameUrl } from "./game-url";

describe("isGameUrl", () => {
  it.each(["https://all22pokemon.com/", "https://all22pokemon.com/draft?x=1#top"])(
    "the panel is enabled on the game's site (%s)",
    (url) => {
      expect(isGameUrl(url)).toBe(true);
    },
  );

  it.each([
    "https://example.com/",
    "https://all22pokemon.com.evil.example/",
    "https://example.com/?u=https://all22pokemon.com/",
    "chrome://extensions/",
    "not a url",
    "",
    undefined,
  ])("the panel is disabled anywhere else (%s)", (url) => {
    expect(isGameUrl(url)).toBe(false);
  });
});
