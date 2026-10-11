// Build-time code outside src/ (Eleventy never renders it). The one place that runs Lightning CSS
// (D-12): bundle() reads src/css/style.css, follows any local @import in order and minifies the result.
// Explicit browser targets are required: without them every -webkit-backdrop-filter declaration is
// stripped and Safari loses the blurred HUD surfaces (Pitfall 2). url() values are emitted unchanged,
// not rebased, so every source writes them relative to the output css/style.css (Pitfall 4).
// getCssBundle() is memoized once per build; eleventy.config.js resets it in eleventy.before, so
// the css/style.css template and the head's ?v= hash always read the same bytes.
import { bundle } from "lightningcss";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

// Repo-relative entry of the stylesheet (03-10 turns it into an @import entry plus partials).
export const cssEntry = "src/css/style.css";

// Lightning CSS encodes browser versions as (major << 16) | (minor << 8) | patch.
export const cssTargets = Object.freeze({
  chrome: 100 << 16,
  edge: 100 << 16,
  firefox: 100 << 16,
  safari: 15 << 16,
  ios_saf: 15 << 16,
});

// The minified bundle as a string and the first 10 hex characters of its sha256 (the ?v= value).
export function bundleCss(entryPath) {
  const { code } = bundle({ filename: entryPath, minify: true, targets: cssTargets });
  return {
    code: code.toString(),
    hash: createHash("sha256").update(code).digest("hex").slice(0, 10),
  };
}

let cached = null;

export function getCssBundle() {
  if (!cached) cached = bundleCss(join(repoRoot, cssEntry));
  return cached;
}

export function resetCssBundle() {
  cached = null;
}
