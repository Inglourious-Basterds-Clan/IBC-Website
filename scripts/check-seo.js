// Post-build SEO gate (SEO-08, D-19). Runs after Eleventy in `npm run build`, so CI's
// build step fails on broken output before anything is deployed.
// Usage: node scripts/check-seo.js [--dir <folder relative to the repo root>] (default _site)
// Configuration comes only from src/_data/site.js (the same normalisation Eleventy used);
// the gate has no switch of its own. The rules live in lib/check-seo.js.
// On failure it exits 1 and moves the checked folder to <folder>.rejected (CR-02), so a
// rejected _site/ can never be copied to the server by mistake. The move itself lives in
// lib/reject-output.js, shared with scripts/check-perf.js.
// This file is only ever run, never imported, so the CLI below runs unconditionally: a
// main-module guard comparing import.meta.url with process.argv[1] failed open (exit 0,
// no checks) when the repo was reached through a symlink or a Windows junction (CR-01).
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import site from "../src/_data/site.js";
import { checkSite } from "../lib/check-seo.js";
import { listFiles } from "../lib/html.js";
import { localHosts } from "../lib/seo.js";
import { removeRejectedOutput } from "../lib/reject-output.js";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

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
  // A file instead of a folder gets the gate's own message, not a readdirSync stack trace (IN-06).
  if (!statSync(outDir).isDirectory()) {
    process.stderr.write(`check-seo: ${dirArg} is not a folder (point --dir at the build output folder)\n`);
    process.exit(1);
  }

  const problems = checkSite(outDir, site);
  if (problems.length > 0) {
    for (const problem of problems) process.stderr.write(`check-seo: ${problem}\n`);
    const disposition = removeRejectedOutput(outDir, repoRoot);
    process.stderr.write(`check-seo: ${problems.length} problem(s), this output must not be deployed; ${disposition}\n`);
    process.exit(1);
  }
  const pageCount = listFiles(outDir, [".html"]).length;
  process.stdout.write(`check-seo: OK, ${pageCount} page(s) checked\n`);
}

runCli(process.argv.slice(2));
