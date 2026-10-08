// Post-build SEO gate (SEO-08, D-19). Runs after Eleventy in `npm run build`, so CI's
// build step fails on broken output before anything is deployed.
// Usage: node scripts/check-seo.js [--dir <folder relative to the repo root>] (default _site)
// Configuration comes only from src/_data/site.js (the same normalisation Eleventy used);
// the gate has no switch of its own. The rules live in lib/check-seo.js.
// This file is only ever run, never imported, so the CLI below runs unconditionally: a
// main-module guard comparing import.meta.url with process.argv[1] failed open (exit 0,
// no checks) when the repo was reached through a symlink or a Windows junction (CR-01).
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import site from "../src/_data/site.js";
import { checkSite, listFiles } from "../lib/check-seo.js";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const localHosts = ["localhost", "127.0.0.1", "[::1]"];

// One line naming the kind of build being checked (Pitfall 9, R2-WR-03).
function banner(site) {
  const base = site.url + site.pathPrefix;
  if (localHosts.includes(new URL(site.url).hostname)) return `check-seo: LOCAL build (${site.url}), never deploy this output`;
  if (site.indexable) return `check-seo: INDEXABLE build for ${base}`;
  return `check-seo: preview build (noindex on every page) for ${base}`;
}

function runCli(argv) {
  process.stdout.write(`${banner(site)}\n`);

  const dirIndex = argv.indexOf("--dir");
  const dirArg = dirIndex === -1 ? "_site" : argv[dirIndex + 1] || "";
  const outDir = resolve(repoRoot, dirArg);
  if (!dirArg || !existsSync(outDir)) {
    process.stderr.write(`check-seo: ${dirArg || "(no --dir value)"} does not exist (run eleventy first)\n`);
    process.exit(1);
  }

  const problems = checkSite(outDir, site);
  if (problems.length > 0) {
    for (const problem of problems) process.stderr.write(`check-seo: ${problem}\n`);
    process.stderr.write(`check-seo: ${problems.length} problem(s), this output must not be deployed\n`);
    process.exit(1);
  }
  const pageCount = listFiles(outDir, [".html"]).length;
  process.stdout.write(`check-seo: OK, ${pageCount} page(s) checked\n`);
}

runCli(process.argv.slice(2));
