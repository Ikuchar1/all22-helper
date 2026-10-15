import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

// The site's game files are classic scripts that declare globals. This virtual module joins them
// in the page's load order into one module scope and exports the globals we use. Done at build
// time because the extension page's CSP forbids eval and new Function.
const SITE_GAME = "virtual:site-game";
const RESOLVED_SITE_GAME = "\0" + SITE_GAME;
const VENDOR_FILES = ["pokemon.js", "pokedata.js", "draft.js"].map((file) =>
  fileURLToPath(new URL(`./vendor/${file}`, import.meta.url)),
);

function siteGame(): Plugin {
  return {
    name: "site-game",
    resolveId(id) {
      return id === SITE_GAME ? RESOLVED_SITE_GAME : undefined;
    },
    load(id) {
      if (id !== RESOLVED_SITE_GAME) return undefined;
      const parts = VENDOR_FILES.map((path) => {
        this.addWatchFile(path);
        return readFileSync(path, "utf8");
      });
      return (
        parts.join("\n;\n") +
        "\nexport { DRAFT, POKEDATA, TYPE_NAMES, POKEMON_NAMES, LEGENDARIES };\n"
      );
    },
  };
}

export default defineConfig({
  plugins: [siteGame()],
  build: {
    rollupOptions: {
      input: { panel: "panel.html" },
    },
  },
});
