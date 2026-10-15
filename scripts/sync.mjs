// Downloads the site's game logic into vendor/. These files are the site creator's code:
// vendor/ is gitignored, so every checkout (and every worktree) runs `npm run sync` once.
import { mkdir, writeFile } from "node:fs/promises";

const BASE = "https://all22pokemon.com";
const FILES = ["draft.js", "pokedata.js", "pokemon.js"];

await mkdir("vendor", { recursive: true });
for (const file of FILES) {
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const text = await res.text();
  await writeFile(`vendor/${file}`, text);
  console.log(`vendor/${file} (${text.length} bytes)`);
}
