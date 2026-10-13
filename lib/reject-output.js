// Shared disposition of a rejected build for the post-build gates (scripts/check-seo.js,
// scripts/check-perf.js). Moved here from scripts/check-seo.js unchanged in behaviour and
// wording, so both gates reject output the same way and can never drift (T-03-07).
// CR-01: only build output (_site, or a folder under _test/) may ever be moved or deleted;
// scripts/clean.js uses the same allow-list. Node built-ins only.
import { renameSync, rmSync } from "node:fs";
import { isAbsolute, relative, sep } from "node:path";

// Output path relative to the repo root with forward slashes, for messages.
export function repoRelative(path, repoRoot) {
  return relative(repoRoot, path).replace(/\\/g, "/");
}

// "" is the root itself, ".." escapes it, and an absolute result means another drive on Windows.
function isOutsideRepo(rel) {
  return rel === "" || rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel);
}

// CR-01: true only for <repoRoot>/_site or a folder under <repoRoot>/_test/. Everything else
// (src, .git, node_modules, lib, .planning, .cache/x, _sitex, _site/sub, _test itself,
// _test-x, the repo root and anything outside it) is not build output and must stay put.
export function isDisposableOutput(outDir, repoRoot) {
  const rel = relative(repoRoot, outDir);
  if (isOutsideRepo(rel)) return false;
  const posix = rel.replace(/\\/g, "/");
  if (posix === "_site") return true;
  if (!posix.startsWith("_test/")) return false;
  return posix.slice("_test/".length).split("/").some((segment) => segment !== "");
}

// CR-02: a rejected build must leave nothing deployable behind. The IIS cutover is a manual
// copy of _site/, so exiting 1 is not enough: the output is moved to <dir>.rejected (kept
// for inspection, replacing an older one) or, if it cannot be moved, deleted. CR-01: that
// only ever happens to build output; any other folder is left in place. Returns what was done.
export function removeRejectedOutput(outDir, repoRoot) {
  if (isOutsideRepo(relative(repoRoot, outDir))) {
    return `${outDir} is not a folder inside the repository, so it was left in place: DO NOT DEPLOY IT`;
  }
  if (!isDisposableOutput(outDir, repoRoot)) {
    return `${repoRelative(outDir, repoRoot)} is not build output (_site or a folder under _test/), so it was left in place: DO NOT DEPLOY IT`;
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
