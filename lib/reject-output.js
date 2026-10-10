// Shared disposition of a rejected build for the post-build gates (scripts/check-seo.js,
// scripts/check-perf.js). Moved here from scripts/check-seo.js unchanged in behaviour and
// wording, so both gates reject output the same way and can never drift (T-03-07).
// Node built-ins only.
import { renameSync, rmSync } from "node:fs";
import { isAbsolute, relative, sep } from "node:path";

// Output path relative to the repo root with forward slashes, for messages.
export function repoRelative(path, repoRoot) {
  return relative(repoRoot, path).replace(/\\/g, "/");
}

// CR-02: a rejected build must leave nothing deployable behind. The IIS cutover is a manual
// copy of _site/, so exiting 1 is not enough: the output is moved to <dir>.rejected (kept
// for inspection, replacing an older one) or, if it cannot be moved, deleted. A folder
// outside the repo (or the repo root itself) is never touched. Returns what was done.
export function removeRejectedOutput(outDir, repoRoot) {
  const rel = relative(repoRoot, outDir);
  if (rel === "" || rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel)) {
    return `${outDir} is not a folder inside the repository, so it was left in place: DO NOT DEPLOY IT`;
  }
  const rejected = `${outDir}.rejected`;
  try {
    rmSync(rejected, { recursive: true, force: true });
    renameSync(outDir, rejected);
    return `moved to ${repoRelative(rejected, repoRoot)}, nothing is left in ${repoRelative(outDir, repoRoot)}`;
  } catch (moveError) {
    try {
      rmSync(outDir, { recursive: true, force: true });
      return `could not move it (${moveError.code || moveError.message}), so ${repoRelative(outDir, repoRoot)} was deleted`;
    } catch (removeError) {
      return `could not move or delete ${repoRelative(outDir, repoRoot)} (${removeError.code || removeError.message}): DO NOT DEPLOY IT`;
    }
  }
}
