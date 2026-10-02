// Deletes the build output folder (default _site/) before `npm run build`, so pages
// from an earlier dev or INCLUDE_DEV_PAGES build never reach a deploy (FOUND-01).
// Usage: node scripts/clean.js [dir relative to the repo root]
// Refuses the repo root itself and anything outside it. Node built-ins only.
import { rmSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const target = resolve(repoRoot, process.argv[2] || "_site");
const rel = relative(repoRoot, target);

// "" is the root itself, ".." escapes it, and an absolute result means another drive on Windows.
if (rel === "" || rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel)) {
  process.stderr.write(`clean.js: refusing to remove ${target}\n`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
