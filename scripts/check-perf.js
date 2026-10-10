// Post-build performance gate (D-16, D-17; no Lighthouse CI, D-19). Runs after
// scripts/check-seo.js in `npm run build` (wired in by 03-11), so a build that breaks the
// byte budget fails before anything is deployed.
// Usage: node scripts/check-perf.js [--dir <folder relative to the repo root>] (default _site)
// The path prefix comes only from src/_data/site.js (the same normalisation Eleventy used);
// the gate has no switch of its own. The rules and the BUDGET object live in lib/check-perf.js.
// On failure, and on a crash inside the rules (T-03-09), it exits 1 and moves the checked
// folder to <folder>.rejected (CR-02, lib/reject-output.js, shared with scripts/check-seo.js),
// so a rejected _site/ can never be copied to the server by mistake.
// This file is only ever run, never imported, so the CLI below runs unconditionally: a
// main-module guard comparing import.meta.url with process.argv[1] failed open (exit 0,
// no checks) when the repo was reached through a symlink or a Windows junction (CR-01).
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import site from "../src/_data/site.js";
import { checkPerf } from "../lib/check-perf.js";
import { listFiles } from "../lib/html.js";
import { removeRejectedOutput } from "../lib/reject-output.js";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

// Prints the reason, moves the output aside and exits 1.
function reject(outDir, lines, summary) {
  for (const line of lines) process.stderr.write(`check-perf: ${line}\n`);
  const disposition = removeRejectedOutput(outDir, repoRoot);
  process.stderr.write(`check-perf: ${summary}, this output must not be deployed; ${disposition}\n`);
  process.exit(1);
}

function runCli(argv) {
  const dirIndex = argv.indexOf("--dir");
  const dirArg = dirIndex === -1 ? "_site" : argv[dirIndex + 1] || "";
  const outDir = resolve(repoRoot, dirArg);
  if (!dirArg || !existsSync(outDir)) {
    process.stderr.write(`check-perf: ${dirArg || "(no --dir value)"} does not exist (run eleventy first)\n`);
    process.exit(1);
  }
  // A file instead of a folder gets the gate's own message, not a readdirSync stack trace (IN-06).
  if (!statSync(outDir).isDirectory()) {
    process.stderr.write(`check-perf: ${dirArg} is not a folder (point --dir at the build output folder)\n`);
    process.exit(1);
  }

  let problems;
  try {
    problems = checkPerf(outDir, site);
  } catch (error) {
    // T-03-09: a crash is a failed check, not a pass; the output is rejected like any other.
    reject(outDir, [`crashed: ${error && error.message ? error.message : String(error)}`], "the gate crashed");
  }
  if (problems.length > 0) reject(outDir, problems, `${problems.length} problem(s)`);

  const pageCount = listFiles(outDir, [".html"]).length;
  process.stdout.write(`check-perf: OK, ${pageCount} page(s) checked\n`);
}

runCli(process.argv.slice(2));
