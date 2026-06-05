// Bundles the pure logic layer with esbuild (resolving the @ alias) and runs
// it in Node — a real runtime check of the data + engine without a browser.
import { build } from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const out = join(tmpdir(), `vsk-smoke-${Date.now()}.mjs`);

await build({
  entryPoints: [join(__dirname, "_smoke_entry.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: out,
  alias: { "@": join(root, "src") },
  loader: { ".json": "json" },
  logLevel: "warning",
});

await import(pathToFileURL(out).href);
