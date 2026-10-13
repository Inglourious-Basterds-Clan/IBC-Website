// Build-time code outside src/ (Eleventy never renders it). The version every page puts on
// /js/main.js (WR-01): the first 10 hex characters of a sha256 over every .js file under src/js,
// fed as sorted forward-slash relative paths and file bytes. main.js passes its own ?v= query on
// to every module import, so any change to main.js or a module gives every script a new URL and a
// deploy never mixes cached old modules with new HTML. getJsHash() is memoized once per build;
// eleventy.config.js resets it in eleventy.before, so each --serve rebuild hashes afresh.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { listFiles } from "./html.js";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

// Repo-relative folder copied to <output>/js (passthrough in eleventy.config.js).
export const jsSourceDir = "src/js";

// Content hash of every .js file under dirPath. Each file contributes its relative path, a NUL
// byte, its bytes and a NUL byte, so a rename, an added file or a one-byte edit all change it.
export function hashJs(dirPath) {
  const files = listFiles(dirPath, [".js"])
    .map((full) => ({ full, rel: relative(dirPath, full).replace(/\\/g, "/") }))
    .sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
  const hash = createHash("sha256");
  for (const { full, rel } of files) {
    hash.update(rel);
    hash.update("\0");
    hash.update(readFileSync(full));
    hash.update("\0");
  }
  return hash.digest("hex").slice(0, 10);
}

let cached = null;

export function getJsHash() {
  if (cached === null) cached = hashJs(join(repoRoot, jsSourceDir));
  return cached;
}

export function resetJsHash() {
  cached = null;
}
