// Deletes the build output folder (default _site/) before `npm run build`, so pages
// from an earlier dev or INCLUDE_DEV_PAGES build never reach a deploy (FOUND-01).
// Usage: node scripts/clean.js [dir relative to the repo root]
// CR-01: the same allow-list as the gates (lib/reject-output.js): only _site or a folder
// under _test/ is ever removed; anything else is refused. Node built-ins only.
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDisposableOutput } from "../lib/reject-output.js";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const target = resolve(repoRoot, process.argv[2] || "_site");

if (!isDisposableOutput(target, repoRoot)) {
  process.stderr.write(`clean.js: refusing to remove ${target} (only _site or a folder under _test/)\n`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
