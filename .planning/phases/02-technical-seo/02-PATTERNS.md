# Phase 2: Technical SEO - Pattern Map

**Mapped:** 2026-10-06
**Files analyzed:** 27 (new + modified)
**Analogs found:** 23 / 27

All analog paths below are git-tracked (verified with `git ls-files`).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/_data/site.js` (M) | config | build-time env transform | itself (extend) | exact |
| `src/_includes/partials/seo-head.njk` (N, replaces `head.njk`) | component (partial) | transform (front matter -> meta) | `src/_includes/partials/head.njk` | exact |
| `src/_includes/layouts/base.njk` (M) | layout | render | itself (line 4 include swap) | exact |
| `src/_includes/partials/footer.njk` (M) | component | render loop | `footer.njk` nav loop lines 9-11 | exact |
| `src/index.njk` (M) | page | front matter | `src/_dev/layout-test.njk` lines 1-7 | exact |
| `src/404.njk` (N) | page | render | `src/_dev/layout-test.njk` | exact |
| `src/sitemap.xml.njk` (N) | generated file template | transform | `src/_dev/layout-test.njk` (front matter) + RESEARCH sketch | partial |
| `src/robots.txt.njk` (N) | generated file template | transform | same | partial |
| `src/site.webmanifest.njk` (N) | generated file template | transform | same | partial |
| `src/web.config.njk` (N) | generated file template | transform | same | partial |
| `lib/seo.js` (N) | utility | transform (pure) | `src/_data/site.js` (ESM style) | role-partial |
| `lib/schema.js` (N) | utility | transform (pure) | `src/_data/site.js` | role-partial |
| `eleventy.config.js` (M) | config | — | itself | exact |
| `package.json` (M) | config | — | itself | exact |
| `scripts/check-seo.js` (N) | script (CLI + exported fn) | file-I/O batch | `scripts/clean.js` + `test/helpers.js` (`listFiles`, `attrValues`, `block`) | role-match |
| `scripts/make-seo-images.js` (N) | script (one-off) | file-I/O | `scripts/clean.js` | role-match |
| `src/favicon.ico`, `src/assets/og/og-default-v1.jpg`, `src/assets/icons/*.png`, `src/assets/brand/ibc-logo-512.png` (N) | static asset | passthrough | `src/assets/*` (passthrough eleventy.config.js:8-12) | exact |
| `FACTS.md` (N) | doc | — | none | no analog |
| `README.md` (M, cutover checklist PL) | doc | — | itself | exact |
| `.github/workflows/pages.yml` (M only if needed; must NOT set SITE_INDEXABLE) | config | CI | itself | exact |
| `test/helpers.js` (M: add `SITE_INDEXABLE` to buildEnvKeys) | test util | — | itself line 18 | exact |
| `test/seo.test.js` (N) | test | real builds | `test/build.test.js` | exact |
| `test/seo-gate.test.js` (N) | test | fixtures | `test/build.test.js` | role-match |
| `test/facts.test.js` (N) | test | file scan | `test/build.test.js` + `listFiles` | role-match |
| `test/layout.test.js`, `test/devpages.test.js`, `test/build.test.js`, `test/links.test.js` (M) | test | — | themselves | exact |

## Pattern Assignments

### `src/_data/site.js` (config, extend)
Existing file, 32 lines. Keep the guard (lines 9-18) and prefix logic (20-21) unchanged; add validation after line 18 and new keys in the export (lines 23-32). Header comment style (lines 1-7) is plain `//` prose. Strict env flag pattern to copy for `SITE_INDEXABLE`:
```js
process.env.ALLOW_LOCAL_SITE_URL !== "1"          // line 11
process.env.INCLUDE_DEV_PAGES === "1"             // line 31
```
Error message style (line 12-16): `throw new Error(` with concatenated sentences referencing README section `"Wdrożenie"`.
Export shape with trailing inline comments:
```js
export default {
  url, // no trailing slash; absolute URLs = url + pathPrefix + page path
  pathPrefix, // "/" or "/<segment>/"
  name: "Inglourious Basterds Clan",
  discord: {
    invite: "https://discord.gg/DhJwkeehJK", // the only literal copy of the invite
  },
```
Social URLs to move here come from `footer.njk` lines 16-17. Colour `#080e11` from `src/css/style.css` line 5.

### `src/_includes/partials/seo-head.njk` (replaces `head.njk`)
**Analog:** `src/_includes/partials/head.njk` (32 lines).
- Keep verbatim (Phase 3 owns them, Pitfall 10), lines 1-2 and 10-14:
```njk
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Stylesheets & Preconnect -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <link rel="stylesheet" href="/css/style.css">
```
- Absolute URL pattern to reuse (line 19): `{{ "/assets/hero-bg.jpg" | htmlBaseUrl(site.url) }}` -> apply to `page.url`, `ogImage or site.ogImage`.
- Home-only conditional (line 7/23): `{% if page.url == "/" %}...{% endif %}`.
- Delete: line 5 title fallback, lines 6/18 hardcoded description, line 7 keywords, line 8 author (optional), lines 17-18 hardcoded OG, lines 23-32 SportsTeam.
- Indentation: two leading spaces per tag, HTML comment section headers (`<!-- SEO Meta Tags -->`).
- Full tag set: RESEARCH.md "SEO head (sketch)" (lines 359-393).

### `src/_includes/layouts/base.njk`
Line 4: `{% include "partials/head.njk" %}` -> `partials/seo-head.njk` (or keep filename and rewrite). No other change; `<main id="main">` + skip link already there for 404.

### `src/_includes/partials/footer.njk`
Loop pattern to copy (lines 9-11):
```njk
{% for item in navigation %}
<li><a href="{{ item.href }}">{{ item.label }}</a></li>
{% endfor %}
```
Social anchor markup to preserve (line 16), replacing the literal URL and label/icon with `s.url`, `s.label`, `fa-{{ s.id }}`:
```njk
<a href="https://www.youtube.com/@IBC_A3" target="_blank" class="social-icon" rel="noopener noreferrer" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
```
Discord line 15 stays reading `site.discord.invite`.

### `src/index.njk` and `src/404.njk` (pages)
**Analog:** `src/_dev/layout-test.njk` lines 1-15:
```njk
---
layout: layouts/base.njk
title: "Test layoutu"
devOnly: true
eleventyExcludeFromCollections: true
permalink: /_dev/layout-test/
---
<section class="section-container">
  <div class="section-header">
    <h1>Test layoutu</h1>
    <p>Status // Strona deweloperska</p>
  </div>
  ...
  <p><a href="/">Powrót na stronę główną</a></p>
</section>
```
- `index.njk` currently has only `layout:` (lines 1-3); add `title`, `description`, `todo: "FACTS-01"`. Organization description reuses hero copy from line 11 (no TODO).
- `404.njk`: copy this structure, `permalink: /404.html`, `eleventyExcludeFromCollections: true`, `todo: "FACTS-02"`, `hud-btn` home link (class used at index.njk:13) and `{% include "partials/discord-cta.njk" %}` (partial is a single `<a ... class="hud-btn header-cta">`). Root-relative `href="/"` is prefixed by HtmlBasePlugin.

### Generated templates: `sitemap.xml.njk`, `robots.txt.njk`, `site.webmanifest.njk`, `web.config.njk`
No existing non-HTML template. Use the front-matter convention from `layout-test.njk` (`permalink:` + `eleventyExcludeFromCollections: true`, no layout) and the bodies in RESEARCH.md lines 438-503. URL helpers: `htmlBaseUrl(site.url)` for absolute (sitemap loc, robots Sitemap line), `htmlBaseUrl` with no arg for prefixed root-relative (web.config path, manifest src/start_url) — same no-arg usage as `index.njk:75` `{{ '/assets/op_patrol.jpg' | htmlBaseUrl }}`.

### `lib/seo.js`, `lib/schema.js` (pure utilities)
No `lib/` exists yet. Follow ESM conventions of `site.js`/`clean.js`: `export`, `const`, semicolons, double quotes, `//` header comment explaining purpose. Bodies in RESEARCH.md lines 397-434. Named exports (`buildSchemaGraph`, `isIndexableUrl`, `jsonLd`) so tests can import them, like `build.test.js:10` `import site from "../src/_data/site.js";`.

### `eleventy.config.js`
Existing (28 lines). Import style (lines 1-2): `import site from "./src/_data/site.js";` -> add `import { isIndexableUrl, jsonLd } from "./lib/seo.js";` etc. Register filters inside the default function next to line 6 (`eleventyConfig.addFilter(...)`). Passthrough object (lines 8-12) — add `"src/favicon.ico": "favicon.ico"`; `src/assets` already covers og/icons/brand. Keep comment style: one `//` line above each block.

### `package.json`
Line 10 `"build": "node scripts/clean.js && eleventy"` -> append `&& node scripts/check-seo.js`. Add `sharp` to devDependencies (line 14 style `"~x.y.z"`), behind a human-verify checkpoint (SUS verdict).

### `scripts/check-seo.js` (CLI + exported pure function)
**Analog:** `scripts/clean.js` (header + node built-ins + stderr/exit):
```js
// Deletes the build output folder ... (FOUND-01).
// Usage: node scripts/clean.js [dir relative to the repo root]
// ... Node built-ins only.
import { rmSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const target = resolve(repoRoot, process.argv[2] || "_site");
...
  process.stderr.write(`clean.js: refusing to remove ${target}\n`);
  process.exit(1);
```
Parsing helpers to copy (not import — scripts must not depend on test/) from `test/helpers.js`:
- `listFiles(dir, exts)` lines 64-72 (recursive walk)
- `attrValues(html, attr)` lines 76-79 (regex with leading `\s`)
- `block(html, tag)` lines 83-90 (`<head>` extraction)
- `escapeRegExp` lines 20-22
Export `checkSite(outDir, site)` returning `string[]`; run CLI only when `import.meta.url === pathToFileURL(process.argv[1]).href` (`pathToFileURL` already imported in `build.test.js:8`). Prefix messages `check-seo: ` like `clean.js: `. Rules G1-G10 in RESEARCH.md lines 521-533.

### `scripts/make-seo-images.js`
Same header/import/`repoRoot` pattern as `clean.js` lines 1-9. Uses sharp; outputs committed. ICO writer per RESEARCH.md line 539+.

### `test/helpers.js`
Line 18 — add `"SITE_INDEXABLE"`:
```js
const buildEnvKeys = ["SITE_URL", "PATH_PREFIX", "INCLUDE_DEV_PAGES", "ELEVENTY_RUN_MODE", "ALLOW_LOCAL_SITE_URL"];
```

### `test/seo.test.js`, `test/seo-gate.test.js`, `test/facts.test.js`
**Analog:** `test/build.test.js` lines 1-40:
```js
// FOUND-01/03/04/06 tracer checks: ...
import { test } from "node:test";
import assert from "node:assert/strict";
import { build, runBuild, cleanEnv, repoRoot, read, listFiles, attrValues, block } from "./helpers.js";
import site from "../src/_data/site.js";

function ogImage(html) {
  const head = block(html, "head");
  const match = /<meta property="og:image" content="([^"]*)"/.exec(head);
  assert.ok(match, "og:image meta tag missing from <head>");
  return match[1];
}

test("default build emits the site", () => {
  const out = build("build-root");
```
- Build names prefixed with suite name (`build("seo-root")`, `build("seo-prefix", { SITE_URL, PATH_PREFIX: "/IBC-Website/" })`) — helpers.js lines 48-49 comment.
- Failing-build checks use `runBuild` and inspect `result.status`/`stderr` (helpers.js 34-46).
- Gate tests: write fixture dirs under `_test/seo-gate-*` and call `checkSite` directly; TODO rule (G10) fixtures only.

### Existing tests to update (Pitfall 1)
- `test/layout.test.js:107-109` — new title; invert keywords/SportsTeam to absent.
- `test/devpages.test.js:12` defaultTitle; `:79-80` stay (absent); `:133` build script string.
- `test/build.test.js:71,82,114,133` and `test/links.test.js:143,152` — og:image expected `assets/hero-bg.jpg` -> `site.ogImage` path (`assets/og/og-default-v1.jpg`). `build.test.js:12-22` assetFiles list may need new asset dirs if it checks exact contents.

## Shared Patterns

### Absolute / prefixed URLs
**Source:** `head.njk:19`, `index.njk:75`. Absolute: `| htmlBaseUrl(site.url)`; prefixed root-relative in non-HTML output: `| htmlBaseUrl`. Never hardcode a host (links.test.js enforces).

### Env flags
**Source:** `site.js:11,31`. Strict `=== "1"` comparison; new env keys must be added to `test/helpers.js:18`.

### Front matter for generated/excluded output
**Source:** `src/_dev/layout-test.njk:1-7` — `permalink` + `eleventyExcludeFromCollections: true`.

### Node script style
**Source:** `scripts/clean.js` — `//` header with Usage line, `node:` built-in imports, `repoRoot` via `fileURLToPath(new URL("..", import.meta.url))`, `process.stderr.write` + `process.exit(1)`.

### CI
**Source:** `.github/workflows/pages.yml:22-24,33-34` — env only `SITE_URL`/`PATH_PREFIX`; `npm test` then `npm run build`. Gate runs via the build script; do not add `SITE_INDEXABLE`. `test/workflow.test.js` exists and may assert this file.

## No Analog Found

| File | Role | Reason |
|---|---|---|
| `src/sitemap.xml.njk`, `robots.txt.njk`, `site.webmanifest.njk`, `web.config.njk` | generated non-HTML templates | First non-HTML templates; use RESEARCH.md Code Examples (only front matter convention has an analog) |
| `lib/seo.js`, `lib/schema.js` | pure build utilities | No `lib/` yet; RESEARCH.md bodies |
| `FACTS.md` | drafted-copy register | New convention (`TODO(FACTS-NN)` rows) |
| `scripts/make-seo-images.js` (sharp parts) | image generation | No image tooling yet |

## Metadata

**Analog search scope:** `src/`, `scripts/`, `test/`, `eleventy.config.js`, `package.json`, `.github/workflows/`
**Files scanned:** 14
**Pattern extraction date:** 2026-10-06
