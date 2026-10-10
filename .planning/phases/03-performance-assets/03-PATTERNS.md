# Phase 3: Performance & Assets - Pattern Map

**Mapped:** 2026-10-10
**Files analyzed:** 34 (new + modified)
**Analogs found:** 29 / 34

All analog paths below are git-tracked (`git ls-files`). `.planning/codebase/` maps are stale (pre-Eleventy) and were not used.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `lib/images.js` (NEW) | utility (build lib) | batch / file-I/O | `lib/schema.js` + `tools/seo-images/make-seo-images.js` (repoRoot/inputs) | role-match |
| `lib/css.js` (NEW) | utility (build lib) | transform | `lib/schema.js` (pure function used by config) | role-match |
| `lib/woff2.js` (NEW) | utility (binary header parser) | file-I/O / transform | `lib/image-size.js` | exact |
| `lib/check-perf.js` (NEW) | gate rules | batch (reads build output) | `lib/check-seo.js` | exact |
| `lib/reject-output.js` (NEW, extracted `removeRejectedOutput`) | utility | file-I/O | `scripts/check-seo.js:73-95` | exact (move) |
| `scripts/check-perf.js` (NEW) | CLI | batch | `scripts/check-seo.js` | exact |
| `scripts/warm-images.js` (NEW) | CLI | batch | `scripts/clean.js` / `scripts/check-seo.js` header style | role-match |
| `scripts/check-seo.js` (MOD) | CLI | batch | itself (import shared reject helper) | — |
| `eleventy.config.js` (MOD) | config | build wiring | itself | — |
| `package.json` (MOD) | config | — | itself (`build` chain, add `pretest`) | — |
| `src/css/style.css` (MOD → @import entry) | config/stylesheet | transform | itself | — |
| `src/css/partials/*.css` (NEW) | stylesheet | — | sections of `src/css/style.css` | exact (split) |
| `src/css/style.11ty.js` (NEW) | template (JS) | transform | `src/robots.txt.njk` / `src/sitemap.xml.njk` (permalinked non-HTML output) | partial |
| `src/_data/icons.js` (NEW) | data | static | `src/_data/navigation.js`, `src/_data/site.js` | role-match |
| `src/fonts/montserrat-latin-ext.var.woff2` + `OFL.txt` (NEW) | asset | — | none | no analog |
| `src/images/*` (MOVED originals) | asset source | — | `src/assets/*` (git mv) | — |
| `src/assets/hero.jpg` (DELETE) | — | — | — | — |
| `src/js/main.js` (MOD → module entry) | entry | event-driven | itself lines 1-7 | — |
| `src/js/modules/{menu,lightbox,terminal,scroll-spy,easter-egg}.js` (NEW) | feature module | event-driven | `src/js/main.js` `init*` functions | exact (split) |
| `src/_includes/partials/head.njk` (MOD) | partial | — | itself lines 21-25 | — |
| `src/_includes/layouts/base.njk` (MOD) | layout | — | itself line 23 | — |
| `src/_includes/partials/header.njk` (MOD) | partial | — | itself line 5 | — |
| `src/_includes/partials/footer.njk` (MOD) | partial | — | itself lines 15-23 | — |
| `src/_includes/partials/discord-cta.njk`, `src/404.njk` (MOD) | partial/page | — | themselves | — |
| `src/index.njk` (MOD) | page | — | itself lines 34-177 | — |
| `src/web.config.njk` (MOD) | config template | — | itself lines 16-19 | exact |
| `src/_dev/og-override.njk` (MOD) | dev page | — | itself (front matter) | — |
| `tools/seo-images/make-seo-images.js` (MOD) | tool | file-I/O | itself lines 21-24 | — |
| `test/perf-gate.test.js` (NEW) | test | — | `test/seo-gate.test.js` | exact |
| `test/fonts.test.js` (NEW, glyph test) | test | — | `test/seo-assets.test.js` (reads committed binaries) | role-match |
| `test/deps.test.js` (NEW, sharp/lockfile guard) | test | — | `test/workflow.test.js` / `test/docs.test.js` (static file reads) | role-match |
| `test/client.test.js` (MOD) | test | — | itself (stub DOM harness) | — |
| `test/build.test.js`, `layout.test.js`, `links.test.js`, `seo.test.js`, `seo-files.test.js`, `devpages.test.js` (MOD) | test | — | themselves | — |
| `.github/workflows/pages.yml` (MOD, optional `.cache` cache) | config | — | itself | — |

## Pattern Assignments

### `lib/check-perf.js` (gate rules, batch)

**Analog:** `lib/check-seo.js`

**Header/imports pattern** (lines 1-15): header comment states purpose, "reads the build output only, never writes. Node built-ins only", rule list; then
```js
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { block, escapeRegExp, listFiles } from "./html.js";
import { isIndexableUrl, outputPathToUrl } from "./seo.js";
import { readImageSize } from "./image-size.js";
```
Add `import { gzipSync } from "node:zlib";`.

**Per-rule function pattern** (lines 212-215): one small function per rule, `report(ruleNumber, text)`:
```js
// G6: no <meta name="keywords"> anywhere (D-14).
function checkNoKeywords(html, report) {
  if (/<meta\s[^>]*name="keywords"/i.test(html)) report(6, '<meta name="keywords"> must not be used (D-14)');
}
```

**Output-wide scan pattern** (lines 218-233, `checkTodoMarkers`): `listFiles(outDir, exts)` + `relative(outDir, full).replace(/\\/g, "/")` + `reporter(relPath)(rule, text)`. Copy for "no CDN font/FA URLs" and "no shipped originals" rules.

**Entry/reporter/sort pattern** (lines 318-361): copy exactly, renaming to `checkPerf(outDir, site, budget = BUDGET)` and prefix `P` instead of `G`:
```js
export function checkSite(outDir, site) {
  const problems = [];
  const reporter = (file) => (rule, text) => problems.push({ file, rule, text });
  const pages = listFiles(outDir, [".html"]).map((full) => {
    const relPath = relative(outDir, full).replace(/\\/g, "/");
    ...
  });
  if (pages.length === 0) return [".: G0 no HTML pages in the build output"];
  ...
  const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  problems.sort((a, b) => compare(a.file, b.file) || a.rule - b.rule || compare(a.text, b.text));
  return problems.map((problem) => `${problem.file}: G${problem.rule} ${problem.text}`);
}
```
Memoized file read (lines 336-341, `readSize` Map) — reuse for byte sizes of hero/lightbox candidates. Use `block(page.html, "head")` for the "exactly one stylesheet link" rule. Export `BUDGET` as one object (RESEARCH "Recommended budget object").

---

### `scripts/check-perf.js` (CLI, batch)

**Analog:** `scripts/check-seo.js` (full file, 85 lines)

Copy structure: header comment (lines 1-10, incl. CR-01 "runs unconditionally, no main-module guard"), `repoRoot` (line 19), `runCli(argv)` with `--dir` parsing + existence + `isDirectory` checks (lines 58-83), messages prefixed `check-perf:`, then `runCli(process.argv.slice(2));`.
```js
  const problems = checkSite(outDir, site);
  if (problems.length > 0) {
    for (const problem of problems) process.stderr.write(`check-seo: ${problem}\n`);
    const disposition = removeRejectedOutput(outDir);
    process.stderr.write(`check-seo: ${problems.length} problem(s), this output must not be deployed; ${disposition}\n`);
    process.exit(1);
  }
```
**Shared helper:** move `removeRejectedOutput` + `repoRelative` (`scripts/check-seo.js:29-56`) into `lib/reject-output.js` (taking `repoRoot`), import it from both CLIs. `package.json` build: `... && node scripts/check-seo.js && node scripts/check-perf.js`.

---

### `lib/woff2.js` (binary parser)

**Analog:** `lib/image-size.js`

Header comment pattern (lines 1-4): "Header-only image parsers ... Node built-ins only, no image library, so tests and the SEO gate ... can check the committed SEO images without sharp." Exported dispatcher with input guard (lines 57-62):
```js
export function readImageSize(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return null;
  if (buffer[0] === 0x89) return readPng(buffer);
  ...
}
```
Difference: `woff2CodePoints` throws on non-WOFF2 (RESEARCH Code Examples) — tests assert the throw.

---

### `lib/images.js`, `lib/css.js` (build libs)

**Analog:** `lib/html.js` header (lines 1-3: "Build-time code outside src/ (Eleventy never renders it)...") and the repoRoot idiom used everywhere:
```js
const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));   // scripts/check-seo.js:19, test/helpers.js:15
```
Input-path map style from `tools/seo-images/make-seo-images.js:21-24`:
```js
const inputs = {
  logo: join(repoRoot, "src/assets/logo.png"),
  hero: join(repoRoot, "src/assets/hero-bg.jpg"),
};
```
Core bodies: use RESEARCH Pattern 1 (memoized `processImages`, `formatFiltering: []`, `outputDir: .cache/img`, `urlPath: "/img/"`) and Pattern 4 (`bundle()` with explicit `cssTargets`). No codebase analog for eleventy-img/lightningcss calls.

---

### `eleventy.config.js` (MOD)

Self-analog. Conventions: one-line comment citing decision ID above each registration (lines 7-15):
```js
  // Shared indexing predicate (D-19): head noindex, sitemap and the SEO gate (lib/check-seo.js) use the same rule.
  eleventyConfig.addFilter("isIndexableUrl", isIndexableUrl);
```
Passthrough block (lines 17-23) changes: remove `"src/css": "css"`; keep `"src/js": "js"`; replace `"src/assets": "assets"` so only `og/`, `icons/`, `brand/` ship (or keep it once originals have moved to `src/images/`); add `"src/fonts": "fonts"`. Add `addGlobalData("images")`, sync `addShortcode("picture")`, `addShortcode("icon")`, `eleventy.after` copy of used `.cache/img` files, `addWatchTarget("src/css/")`, `addGlobalData("cssHash")` (RESEARCH Patterns 1, 4, 7). `HtmlBasePlugin` stays first (line 8).

---

### `src/css/style.11ty.js` (permalinked non-HTML template)

**Analog (partial):** `src/robots.txt.njk`, `src/sitemap.xml.njk` — permalinked non-HTML outputs. No JS template exists yet; use RESEARCH Pattern 4 (`export const data = { permalink: "/css/style.css", eleventyExcludeFromCollections: true }; export function render() {...}`).

### `src/css/partials/*.css` + `src/css/style.css`

Split `src/css/style.css` along its existing `/* --- NAME --- */` section headers (CLAUDE.md comment convention); keep `:root` variables first (lines 4-35). Line 1 Google Fonts `@import` removed; lines 25-26 font stacks per RESEARCH Pattern 6; hero rule lines 418-428 replaced per Pattern 2; `.logo-img` lines 267-271 unchanged. New classes replace inline styles (inventory below). `url()` written relative to output `/css/style.css`.

---

### `src/js/main.js` → entry + `src/js/modules/*.js`

**Analog:** `src/js/main.js` itself.

Current entry (lines 1-7) — replaced by literal loader map (RESEARCH Pattern 5):
```js
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initLightbox();
  initRecruitmentTerminal();
  initScrollSpy();
  initEasterEgg();
});
```
Module body pattern — each `init*` becomes `export function init(el)` keeping its guard clause and section header (lines 122-140):
```js
/* --- TACTICAL RECRUITMENT TERMINAL --- */
function initRecruitmentTerminal() {
  const consoleEl = document.getElementById('terminal-console');
  if (!consoleEl) return;
  const discordUrl = consoleEl.getAttribute('data-discord-url') || '';
  ...
}
```
Mapping: `initMobileMenu` (l.12) → `modules/menu.js`; `initLightbox` (l.43, incl. `openLightbox`/`updateLightboxContent`/`closeLightbox`) → `modules/lightbox.js` (switch from `data-src` to `data-lightbox-{avif,webp,jpeg}`, `<source>` srcset then `img.src`); `initRecruitmentTerminal` + `runBootSequence`/`writeToConsole` (l.123-190) → `modules/terminal.js`; `initScrollSpy` (l.194) → `modules/scroll-spy.js`; `initEasterEgg` (l.220) → `modules/easter-egg.js`. Optional: JS inline styles (l.23,32,64-65,75-76,114,163,228-229,259-267) → class toggles (`.is-open`).

---

### Templates (MOD)

- `src/_includes/partials/head.njk:21-25` — delete preconnects (22-23) and FA CDN (24); line 25 becomes `<link rel="stylesheet" href="/css/style.css?v={{ cssHash }}">`; add font preload and home-only hero AVIF preload (`imagesrcset` via `| htmlBaseUrl`, Pattern 2). Reuse `isHome` set at line 4.
- `src/_includes/layouts/base.njk:23` — `<script src="/js/main.js">` → `<script type="module" src="/js/main.js">`.
- `src/_includes/partials/header.njk:5` — `<img src="/assets/logo.png" ... width="48" height="48" decoding="async">` → `{% picture images.logo, { alt: "IBC Logo", class: "logo-img", sizes: "50px", decoding: "async" } %}` + `data-js="menu"` on `.menu-toggle`, `data-js="scroll-spy"` on `<nav>`.
- `src/_includes/partials/footer.njk:15,18` — `<i class="fab fa-discord"></i>` → `{% icon "discord" %}`, `<i class="fab fa-{{ s.id }}"></i>` → `{% icon s.id %}` (existing `aria-label` on `<a>` stays); line 23 easter-egg `style=` → class, add `data-js="easter-egg"`.
- `src/_includes/partials/discord-cta.njk:1`, `src/404.njk:16` — `<i class="fab fa-discord" aria-hidden="true"></i>` → `{% icon "discord" %}`.
- `src/index.njk` — 11 inline styles at :34, :37, :52, :60, :151, :153, :154, :155, :157, :164, :165 → classes; gallery items :78-106 (`data-src="{{ '/assets/x' | htmlBaseUrl }}"` precedent for `data-lightbox-*`) → `{% for %}` over `images.gallery` with `{% picture g.thumb, {...loading: "lazy"} %}`; `data-js="lightbox"` on `.gallery-grid`, `data-js="terminal"` on `#terminal-console`; lightbox :177 `<img alt="Lightbox image">` → `<picture>` with empty `<source>`s and `width`/`height` (no `src`). Hero `<div class="hero-image-bg">` gets the picture (Pattern 2).

### `src/web.config.njk` (MOD)

Self-analog, lines 16-19 — copy the pair for `.avif`/`image/avif`, `.webp`/`image/webp`, `.woff2`/`font/woff2`:
```xml
      <remove fileExtension=".webmanifest" />
      <mimeMap fileExtension=".webmanifest" mimeType="application/manifest+json" />
```

### `src/_data/icons.js` (NEW)

**Analog:** `src/_data/site.js` — leading comment block explaining single source (lines 1-9), ESM default export. Put the FA 6.0.0 CC BY 4.0 attribution in that header comment. Shape `{ discord: { viewBox, path }, youtube, facebook }`; keys must match `site.social[].id` ("youtube", "facebook").

### `tools/seo-images/make-seo-images.js` (MOD)
Lines 21-24 `inputs` paths `src/assets/...` → `src/images/...` only. No regeneration (D-06).

---

### `test/perf-gate.test.js` (NEW)

**Analog:** `test/seo-gate.test.js`

Imports + fixture helper (lines 1-32):
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { build, cleanEnv, repoRoot } from "./helpers.js";
import { checkSite } from "../lib/check-seo.js";

// Write { relPath: content } into a fresh _test/seo-gate-fixtures/<name>/ and return the folder.
function writeFixture(name, files) {
  const dir = join(repoRoot, "_test", "seo-gate-fixtures", name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  ...
}
```
Use `_test/perf-gate-*` and `_test/perf-gate-fixtures/<name>/`, one fixture per broken rule. `pngHeader(width, height)` (lines 34+) reusable for fake image files.

### `test/fonts.test.js`, `test/deps.test.js` (NEW)
Follow `test/helpers.js` conventions: `repoRoot` import, `readFileSync` of committed files, `node:assert/strict`. Lockfile test reads `package-lock.json` JSON (never `require("sharp/package.json")`, Pitfall 8).

### `test/client.test.js` (MOD)

Self-analog. Keep the stub DOM harness (lines 16-60+: `createElement`, `createConsoleEl(discordUrl)` with `getAttribute("data-discord-url")`, `createLink`) and the invite/`writeToConsole` static checks (`inviteDomainPattern` line 14). Replace `vm` execution of `mainSource` with `globalThis.document = stub; const { init } = await import("../src/js/modules/terminal.js"); init(stubEl);` and test `initFeatures` with spy loaders. `node --check` per module file.

### Other test edits (pinned layout)
- `test/build.test.js:12-22` `assetFiles` list (`"hero.jpg"`, etc. under `assets/`) → assert originals are absent and `img/` variants exist.
- `test/layout.test.js:114-120` logo/gallery URL assertions; keep "lightbox img has no src".
- `test/seo.test.js:302-309` hero-bg OG override → `/assets/brand/ibc-logo-512.png` 512×512 (and `src/_dev/og-override.njk` front matter).
- `test/links.test.js:14-17` drop `fonts.googleapis.com`, `fonts.gstatic.com`, `cdnjs.cloudflare.com` from allow-list; extend `urlValues()` to `imagesrcset` and `data-lightbox-*`.
- `test/seo-files.test.js` — web.config MIME assertions.

## Shared Patterns

### Build-output reading
**Source:** `lib/html.js` (`listFiles`, `block`, `escapeRegExp`) re-exported by `test/helpers.js:13`. **Apply to:** `lib/check-perf.js`, all new tests. Never duplicate these helpers (IN-02).

### Path prefix
**Source:** `HtmlBasePlugin` (`eleventy.config.js:8`) for `href`/`src`/`srcset`; `| htmlBaseUrl` filter for attributes it ignores, precedent `src/index.njk:78` `data-src="{{ '/assets/op_patrol.jpg' | htmlBaseUrl }}"` and `src/web.config.njk:14`. **Apply to:** `imagesrcset`, `data-lightbox-*`. Never on `img`/`source` (double prefix).

### Isolated test builds
**Source:** `test/helpers.js:45-66` (`runBuild`/`build` into `_test/<name>`, env stripped by `cleanEnv`). **Apply to:** every new build test; name prefix = suite name. Add `"pretest": "node scripts/warm-images.js"` to `package.json`.

### Gate failure disposition
**Source:** `scripts/check-seo.js:29-56` `removeRejectedOutput` (moves to `<dir>.rejected`). **Apply to:** both gate CLIs via shared lib.

### Comment style
`/* --- FEATURE NAME --- */` in CSS/JS; decision IDs (D-xx, CR-xx) cited in config/lib comments; no `console.*`; no "TODO" in shipped files (G10, `lib/check-seo.js:218`).

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `lib/images.js` core (eleventy-img calls) | utility | batch | No eleventy-img usage yet; use RESEARCH Pattern 1 |
| `lib/css.js` core (lightningcss) | utility | transform | Use RESEARCH Pattern 4 |
| `src/css/style.11ty.js` | JS template | transform | No `.11ty.js` templates exist; RESEARCH Pattern 4 |
| `src/fonts/*.woff2` + `OFL.txt` | asset | — | One-off pyftsubset output (RESEARCH Pattern 6) |
| `src/js/main.js` loader map | entry | event-driven | No ES modules yet; RESEARCH Pattern 5 |

## Metadata

**Analog search scope:** `eleventy.config.js`, `lib/`, `scripts/`, `src/`, `test/`, `tools/seo-images/`
**Files scanned:** ~25
**Pattern extraction date:** 2026-10-10
