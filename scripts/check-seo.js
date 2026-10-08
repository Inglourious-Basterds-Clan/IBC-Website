// Post-build SEO gate (SEO-08, D-19). Runs after Eleventy in `npm run build`, so CI's
// build step fails on broken output before anything is deployed.
// Usage: node scripts/check-seo.js [--dir <folder relative to the repo root>] (default _site)
// Configuration comes only from src/_data/site.js (the same normalisation Eleventy used);
// the gate has no switch of its own. The rules live in lib/check-seo.js.
// On failure it exits 1 and moves the checked folder to <folder>.rejected (CR-02), so a
// rejected _site/ can never be copied to the server by mistake.
// This file is only ever run, never imported, so the CLI below runs unconditionally: a
// main-module guard comparing import.meta.url with process.argv[1] failed open (exit 0,
// no checks) when the repo was reached through a symlink or a Windows junction (CR-01).
import { existsSync, renameSync, rmSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import site from "../src/_data/site.js";
import { checkSite } from "../lib/check-seo.js";
import { listFiles } from "../lib/html.js";
import { localHosts } from "../lib/seo.js";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

// One line naming the kind of build being checked (Pitfall 9, R2-WR-03).
function banner(site) {
  const base = site.url + site.pathPrefix;
  if (localHosts.includes(new URL(site.url).hostname)) return `check-seo: LOCAL build (${site.url}), never deploy this output`;
  if (site.indexable) return `check-seo: INDEXABLE build for ${base}`;
  return `check-seo: preview build (noindex on every page) for ${base}`;
}

// Output path relative to the repo root with forward slashes, for messages.
function repoRelative(path) {
  return relative(repoRoot, path).replace(/\\/g, "/");
}

// CR-02: a rejected build must leave nothing deployable behind. The IIS cutover is a manual
// copy of _site/, so exiting 1 is not enough: the output is moved to <dir>.rejected (kept
// for inspection, replacing an older one) or, if it cannot be moved, deleted. A folder
// outside the repo (or the repo root itself) is never touched. Returns what was done.
function removeRejectedOutput(outDir) {
  const rel = relative(repoRoot, outDir);
  if (rel === "" || rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel)) {
    return `${outDir} is not a folder inside the repository, so it was left in place: DO NOT DEPLOY IT`;
  }
  const rejected = `${outDir}.rejected`;
  try {
    rmSync(rejected, { recursive: true, force: true });
    renameSync(outDir, rejected);
    return `moved to ${repoRelative(rejected)}, nothing is left in ${repoRelative(outDir)}`;
  } catch (moveError) {
    try {
      rmSync(outDir, { recursive: true, force: true });
      return `could not move it (${moveError.code || moveError.message}), so ${repoRelative(outDir)} was deleted`;
    } catch (removeError) {
      return `could not move or delete ${repoRelative(outDir)} (${removeError.code || removeError.message}): DO NOT DEPLOY IT`;
    }
  }
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
    const disposition = removeRejectedOutput(outDir);
    process.stderr.write(`check-seo: ${problems.length} problem(s), this output must not be deployed; ${disposition}\n`);
    process.exit(1);
  }
  const pageCount = listFiles(outDir, [".html"]).length;
  process.stdout.write(`check-seo: OK, ${pageCount} page(s) checked\n`);
}

runCli(process.argv.slice(2));
