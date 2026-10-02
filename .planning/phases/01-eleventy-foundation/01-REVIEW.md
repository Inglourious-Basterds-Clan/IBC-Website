---
phase: 01-eleventy-foundation
reviewed: 2026-10-03T00:00:00Z
depth: standard
files_reviewed: 26
files_reviewed_list:
  - .github/workflows/pages.yml
  - .gitignore
  - .nvmrc
  - eleventy.config.js
  - package.json
  - README.md
  - scripts/clean.js
  - src/_data/navigation.js
  - src/_data/site.js
  - src/_dev/layout-empty.njk
  - src/_dev/layout-test.njk
  - src/_includes/layouts/base.njk
  - src/_includes/partials/discord-cta.njk
  - src/_includes/partials/footer.njk
  - src/_includes/partials/head.njk
  - src/_includes/partials/header.njk
  - src/css/style.css
  - src/index.njk
  - src/js/main.js
  - test/build.test.js
  - test/client.test.js
  - test/devpages.test.js
  - test/helpers.js
  - test/layout.test.js
  - test/links.test.js
  - test/workflow.test.js
findings:
  critical: 1
  warning: 5
  info: 7
  total: 13
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-10-03
**Depth:** standard
**Files Reviewed:** 26
**Status:** issues_found

## Summary

I reviewed the Eleventy 3 migration: config, single-source site data, layout and partials, dev-only page gating, the clean script, the GitHub Pages workflow, client JS changes, and the node:test suites. I also checked the claims I could test directly:

- **Dev-page gate:** sound. Eleventy 3.1.6 sets `process.env.ELEVENTY_RUN_MODE` in `initializeConfig()` before it imports the user config (`node_modules/@11ty/eleventy/src/Eleventy.js:260-264`), so `site.includeDevPages` is computed correctly when `eleventy.config.js` imports `site.js`.
- **Action versions:** every pinned tag exists on GitHub (`checkout@v7`, `setup-node@v7`, `upload-pages-artifact@v5`, `deploy-pages@v5`).
- **Lightbox inside `<main>`:** `main` has no styles, so it creates no stacking context. The lightbox at z-index 110 still sits above the header at z-index 100.

Scratch builds into the session scratchpad confirmed these problems:

- A plain build (no `SITE_URL`) writes `og:image content="http://localhost:8080/assets/hero-bg.jpg"`.
- `SITE_URL=example.com` writes `og:image content="/example.com/assets/hero-bg.jpg"`.
- `SITE_URL=https://example.com/sub` silently drops `/sub`.

Main concerns:
1. The README's "any static host" deploy path ships localhost absolute URLs, and nothing guards against it.
2. `site.js` does not validate `SITE_URL`/`PATH_PREFIX`.
3. Pre-existing scroll-unlock code (`overflow = 'auto'`) cancels the new `overflow-x: clip` header fix.
4. Root-relative nav hrefs plus the strict pathname filter break scroll-spy at `/index.html`.
5. `og:title`/descriptions are hardcoded in the shared head partial.
6. A test runs the real `rm -rf` script against the repo root.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Documented "any static host" build ships `http://localhost:8080` absolute URLs

**File:** `src/_data/site.js:6-7`, `README.md:24`, `src/_includes/partials/head.njk:19`
**Issue:** `site.url` falls back to `http://localhost:8080` whenever `SITE_URL` is unset, and nothing guards a production build (`ELEVENTY_RUN_MODE === "build"`) against that fallback. README line 24 tells self-hosters: "uruchom `npm run build` i wgraj zawartość folderu `_site/`". It never mentions `SITE_URL`. I ran that build and the output contains `<meta property="og:image" content="http://localhost:8080/assets/hero-bg.jpg">`.

The project funnels visitors through Discord, and Discord and Facebook link previews read `og:image`, so every shared link from such a deploy gets a broken preview. Every absolute URL added in later SEO phases (canonical, `og:url`, sitemap) would inherit the same localhost value. The project constraints say the user "deploys it themselves" to any static host, so this is a documented deployment path that produces wrong output silently.
**Fix:** Fail or loudly warn when a production build has no `SITE_URL`, and document the variable in the deploy instructions:
```js
// src/_data/site.js
const rawUrl = (process.env.SITE_URL || "").trim();
if (!rawUrl && process.env.ELEVENTY_RUN_MODE === "build" && process.env.ALLOW_LOCAL_SITE_URL !== "1") {
  throw new Error("SITE_URL is not set: a production build would emit http://localhost:8080 absolute URLs. " +
    "Set SITE_URL=https://<domain> (or ALLOW_LOCAL_SITE_URL=1 for local/test builds).");
}
```
`test/helpers.js` would then pass `ALLOW_LOCAL_SITE_URL: "1"` for variants that rely on the default. In README "Dowolny hosting statyczny", use `SITE_URL=https://<domena> npm run build` (with PowerShell and Git Bash variants).

## Warnings

### WR-01: `SITE_URL` / `PATH_PREFIX` are normalized but never validated, so bad values produce wrong URLs silently

**File:** `src/_data/site.js:6-10`
**Issue:** I confirmed three silent failures with real builds:
- `SITE_URL=example.com` (missing scheme) makes `htmlBaseUrl` treat the base as a path. The output is `og:image content="/example.com/assets/hero-bg.jpg"`, a relative URL in a field that must be absolute.
- `SITE_URL=https://example.com/sub` loses `/sub` (`og:image` = `https://example.com/IBC/assets/hero-bg.jpg`), because `htmlBaseUrl` resolves a root-relative path against the origin.
- The Git Bash MSYS path rewrite that README lines 59-63 warn about (`PATH_PREFIX=C:/Program Files/Git/IBC-Website/`) is accepted as-is. It becomes `pathPrefix = "/C:/Program Files/Git/IBC-Website/"` and breaks every link. The code could reject it cheaply instead of relying on a README warning.

For a project whose core constraint is "site URL must be a single config value", that value deserves validation at the point of definition.
**Fix:**
```js
let parsed;
try { parsed = new URL(url); } catch { throw new Error(`SITE_URL is not an absolute URL: "${rawUrl}"`); }
if (!/^https?:$/.test(parsed.protocol)) throw new Error(`SITE_URL must be http(s): "${rawUrl}"`);
if (parsed.pathname !== "/") throw new Error(`SITE_URL must be an origin only; put "${parsed.pathname}" in PATH_PREFIX`);
if (/[:\\\s]/.test(rawPrefix)) throw new Error(`PATH_PREFIX looks like a filesystem path: "${process.env.PATH_PREFIX}" (Git Bash? use MSYS_NO_PATHCONV=1)`);
```

### WR-02: Lightbox / easter-egg close sets `body.style.overflow = 'auto'`, which overrides the new `overflow-x: clip` header fix

**File:** `src/js/main.js:76`, `src/js/main.js:260`, `src/js/main.js:267` (interacting with `src/css/style.css:368-370`)
**Issue:** This phase added `body { overflow-x: clip; }` so the pre-existing narrow-phone overflow cannot widen the layout and push the fixed header's Discord CTA and menu toggle off-screen. The `overflow` shorthand set inline sets both axes, though:
- `closeLightbox()` and both easter-egg close paths set `document.body.style.overflow = 'auto'`. The inline `overflow-x: auto` then beats the stylesheet's `clip` for the rest of the session. After a visitor opens and closes one gallery image, body becomes a horizontal scroll container and the overflow the fix was meant to hide comes back.
- The mobile menu (lines 23 and 32) restores with `''`, so the three handlers are already inconsistent.
**Fix:** Clear the inline value instead of forcing `auto`:
```js
document.body.style.overflow = ''; // restore stylesheet value (keeps overflow-x: clip)
```
Apply this at lines 76, 260 and 267. Better still, add the shared `showModal`/`hideModal` helper that CLAUDE.md already recommends.

### WR-03: Scroll-spy and in-page nav break when the home page is reached as `/index.html`

**File:** `src/js/main.js:197-198`, `src/_data/navigation.js:4-7`
**Issue:** The nav hrefs changed from `#about` to root-relative `/#about` (or `/IBC-Website/#about` after prefixing). Scroll-spy now keeps only links where `link.pathname === window.location.pathname`. On the same document served as `/index.html` or `/IBC-Website/index.html` (old bookmarks, a local `python -m http.server`, hosts that link `index.html`), the link pathname is `/IBC-Website/` and the location pathname is `/IBC-Website/index.html`. Two things break:
- Scroll-spy is silently inert.
- Every nav click becomes a cross-document navigation (full page reload) instead of an in-page scroll. The old `#about` hrefs worked from any URL, so this phase introduced the regression.
**Fix:** Normalize a trailing `index.html` before comparing:
```js
const normalize = (p) => p.replace(/\/index\.html?$/, '/');
const here = normalize(window.location.pathname);
const navLinks = Array.from(document.querySelectorAll('nav ul li a'))
  .filter(link => link.hash && normalize(link.pathname) === here);
```
Also consider a canonical redirect or `<link rel="canonical">` in the SEO phase. Add a `client.test.js` case with `pathname: "/IBC-Website/index.html"`.

### WR-04: Shared head partial hardcodes `og:title`, `og:description` and `meta description` for every page

**File:** `src/_includes/partials/head.njk:6`, `src/_includes/partials/head.njk:17-18`
**Issue:** `head.njk` is now the shared head for every page. Only `<title>` reads front matter (`title or ...`). `og:title`, `og:description` and `<meta name="description">` are literals, so any page with its own `title` advertises the home page's title and description in social previews and search snippets.

The dev page shows this already: `/_dev/layout-test/` renders `<title>Test layoutu</title>` next to `og:title="IBC Clan // Wizytówka Taktyczna Arma 3"`. The phase's purpose is a multi-page, well-indexed site, and duplicate descriptions across pages hurt it directly. No test catches this; `devpages.test.js (c)` checks only `<title>`.
**Fix:**
```njk
{% set pageTitle = title or "IBC Clan // Wizytówka Taktyczna Arma 3" %}
{% set pageDescription = description or "Oficjalna strona klanu IBC w Arma 3. ..." %}
<title>{{ pageTitle }}</title>
<meta name="description" content="{{ pageDescription }}">
<meta property="og:title" content="{{ pageTitle }}">
<meta property="og:description" content="{{ pageDescription }}">
```
Extend `devpages.test.js (c)` to assert `og:title` equals the page title.

### WR-05: `devpages.test.js (h)` runs the real recursive delete against the repo root

**File:** `test/devpages.test.js:122-129`, `scripts/clean.js:14-19`
**Issue:** The test spawns `scripts/clean.js .` and `scripts/clean.js ..`, which the guard is supposed to refuse. If a future edit weakens the guard (a refactor of the `rel` checks, or a different `repoRoot` computation), `npm test` itself runs `rmSync(repoRoot, { recursive: true, force: true })`. That wipes the working tree, including `.git` and any uncommitted work, before the assertion can fail. The post-check at line 128 (`package.json was deleted`) can only report the damage after it has happened. A test whose failure mode destroys the developer's repository is not a reliable test.
**Fix:** Move the guard into a pure, exported function and unit-test it without touching the filesystem. Keep the CLI as a thin wrapper:
```js
// scripts/clean.js
export function isSafeTarget(repoRoot, target) {
  const rel = relative(repoRoot, target);
  return !(rel === "" || rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel));
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) { /* existing CLI using isSafeTarget */ }
```
Test `isSafeTarget(repoRoot, resolve(repoRoot, "."))` etc. Alternatively, run the CLI with a `--dry-run` flag, or against a temp-dir copy of the script so its computed `repoRoot` is disposable.

## Info

### IN-01: Easter egg still writes terminal lines via `innerHTML`, with hardcoded colors

**File:** `src/js/main.js:240-244`, `src/js/main.js:163`
**Issue:** This phase hardened `writeToConsole` to use `textContent`, but `openEasterEgg` still builds the same three-span line with `innerHTML`. The content is static, so it is not exploitable today, but the logic is duplicated and the hardening is inconsistent. The `client.test.js` static check covers only `writeToConsole`. Lines 163 and 242-243 also hardcode `#ef4444` even though `--danger-color` exists. The ternary on line 163 returns `var(--accent-color)` for both success and default, so it is partly redundant.
**Fix:** Lift `writeToConsole` to module scope (taking `consoleEl`), reuse it from `openEasterEgg` with an `'error'`-style status, and use `var(--danger-color)`.

### IN-02: Terminal prints a dangling "Połączenie nawiązane: " when the invite attribute is missing, and the test enshrines it

**File:** `src/js/main.js:126`, `src/js/main.js:184`, `test/client.test.js:159-169`
**Issue:** If `data-discord-url` is absent, `discordUrl` is `''` and the terminal claims a connection to nothing. `client.test.js` asserts this degenerate output as the expected behavior instead of a sensible fallback.
**Fix:** Skip the connection line, or print a `warn` line, when `discordUrl` is empty, and update the test to assert that behavior.

### IN-03: `clean.js` accepts any in-repo path and duplicates the output-dir literal

**File:** `scripts/clean.js:10`, `eleventy.config.js:23`
**Issue:** The guard refuses only the root and outside paths, so `node scripts/clean.js .git` or `node scripts/clean.js src` deletes them. Separately, `_site` is hardcoded in both `clean.js` and `eleventy.config.js`. If `dir.output` changes, `npm run build` silently stops cleaning the real output folder, and stale `_dev/` pages could then ship, which defeats FOUND-01.
**Fix:** Import the output dir from the Eleventy config (`import { config } from "../eleventy.config.js"`), and restrict targets to that dir or `_test/*`.

### IN-04: Dev-page exclusion depends on every file repeating `devOnly: true`

**File:** `src/_dev/layout-empty.njk:3`, `src/_dev/layout-test.njk:4`, `eleventy.config.js:15-17`
**Issue:** A new file in `src/_dev/` that omits `devOnly: true` is published to production. `devpages.test.js (e)` would catch it, but only if tests run.
**Fix:** Add `src/_dev/_dev.11tydata.json` with `{ "devOnly": true, "eleventyExcludeFromCollections": true }` so the directory sets the flag for every file in it.

### IN-05: Duplicate `.menu-toggle` rule in the 768px media query

**File:** `src/css/style.css:1436-1442`
**Issue:** Two consecutive `.menu-toggle` blocks in the same media query (`display: flex;`, then `order: 3;`).
**Fix:** Merge them into one rule.

### IN-06: Supply-chain hardening: mutable action tags next to `id-token: write`; CDN stylesheet without SRI

**File:** `.github/workflows/pages.yml:25-26,34,51`, `src/_includes/partials/head.njk:13`
**Issue:** All actions are pinned to mutable major tags, and the deploy job holds `pages: write` + `id-token: write`. Font Awesome 6.0.0 loads from cdnjs without `integrity`/`crossorigin`.
**Fix:** Pin actions to commit SHAs (with a `# vX` comment) and add Dependabot for `github-actions`. Add the cdnjs SRI hash with `crossorigin="anonymous"`, or self-host the icon subset.

### IN-07: Copyright year hardcoded

**File:** `src/_includes/partials/footer.njk:21`
**Issue:** `&copy; 2026` goes stale every January even though there is now a build step.
**Fix:** Add a global data value (e.g. `year: new Date().getFullYear()` in `site.js`) and render `&copy; {{ site.year }}`.

---

_Reviewed: 2026-10-03_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
