import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Builds the extension the way `npm run build` does, into a scratch folder.
const outDir = mkdtempSync(join(tmpdir(), "all22-helper-build-"));
const read = (file: string) => readFileSync(join(outDir, file), "utf8");

beforeAll(async () => {
  await build({
    configFile: "vite.config.ts",
    logLevel: "silent",
    build: { outDir, emptyOutDir: true },
  });
}, 60_000);
afterAll(() => rmSync(outDir, { recursive: true, force: true }));

describe("build", () => {
  it("emits the manifest, the service worker, the content script and the panel it names", () => {
    const manifest = JSON.parse(read("manifest.json"));
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.background).toEqual({ service_worker: "service-worker.js", type: "module" });
    expect(manifest.content_scripts[0].js).toEqual(["content-script.js"]);
    for (const file of ["service-worker.js", "content-script.js", "panel.html"]) {
      expect(existsSync(join(outDir, file)), file).toBe(true);
    }
    // The panel the service worker opens.
    expect(read("service-worker.js")).toContain("panel.html");
  });

  it("the content script is one classic script: no import or export statements", () => {
    const script = read("content-script.js");
    expect(script).not.toMatch(/(^|[;\s}])import\s*[\s{*("']/);
    expect(script).not.toMatch(/(^|[;\s}])export\s*[\s{*]/);
    // It does carry the candidate lookup it would otherwise import.
    expect(script).toContain("canvas.thumb");
  });
});
