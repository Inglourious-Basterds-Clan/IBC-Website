---
last_mapped_commit: 498f19eefca8ec513547073c1d87eb4bb2a09b7d
last_mapped_at: 2026-10-13
---
# Codebase Concerns

**Analysis Date:** 2026-10-13

Sources cross-checked against code: `.planning/phases/03-performance-assets/03-REVIEW-DISPOSITION.md` (9 open of 12), `.planning/phases/04-join-operations-pages/04-REVIEW.md` + `04-REVIEW-DISPOSITION.md` (8 open of 8), `FACTS.md`.

## Tech Debt

**Unconfirmed drafted facts block the indexable build:**
- Issue: 13 registered entries (FACTS-01..13) in `FACTS.md` are still "do potwierdzenia". Drafted copy carries `TODO(FACTS-NN)` markers.
- Files: `src/_data/join.js:52,73` (FACTS-04/05), `src/_data/operations.js:42,67,77,84,94,104,114` (FACTS-07..13), front matter `todo:` in `src/404.njk`, `src/jak-dolaczyc.njk`, `src/operacje.njk`; marker emitted by `src/_includes/partials/head.njk:17`
- Impact: G10 in `lib/check-seo.js:388-395` fails any `SITE_INDEXABLE=1` build while a marker exists, so the site cannot go live/indexable.
- Fix approach: Clan confirms copy, delete `draft` lines / `todo` keys, update `FACTS.md` rows. Fix WR-02 (below) first or confirmation breaks tests.

**Stale project documentation in CLAUDE.md:**
- Issue: `.claude/CLAUDE.md` Technology Stack / Conventions / Architecture sections describe the pre-migration site (root `index.html`, `css/style.css`, `js/main.js`, Google Fonts, Font Awesome CDN, "no build step"). The repo is Eleventy 3 (`eleventy.config.js`, `src/`, `lib/`, `scripts/`), self-hosted fonts (`src/fonts/`), inline icons (`lib/icons.js`), modular JS (`src/js/modules/`).
- Impact: Agents reading CLAUDE.md get wrong file paths and wrong constraints.
- Fix approach: Regenerate those sections from `.planning/codebase/*.md`.

**Legacy/leftover artifacts:**
- No tracked legacy root files remain (`index.html`, `css/`, `js/`, `assets/` at root are gone; verified via `git ls-files`).
- Untracked local leftovers: `_site.rejected/` (rejected build output, gitignored), `_test/`, `.gsd/dispatch-isolation-sentinel.json`, `.planning/milestone.lock`, `.planning/state.json`.
- Dev-only templates `src/_dev/*.njk` (font-test, layout-test, og-override, layout-empty) live in the source tree; covered by `test/devpages.test.js` - keep them excluded from production output.

**Duplicated scroll-lock logic:**
- Issue: Three modules set `document.body.style.overflow` independently with different reset values (`'auto'` vs `''`).
- Files: `src/js/modules/lightbox.js:44,59`, `src/js/modules/easter-egg.js:12,17`, `src/js/modules/menu.js:14,23`
- Impact: Phase 03 WR-02 - `'auto'` overrides the `overflow-x: clip` guard after closing lightbox/easter egg, re-enabling horizontal overflow.
- Fix approach: Reset to `''` everywhere, or pass a shared lock helper via `init()` (not a static import - see IN-03).

**Large committed source images:**
- Issue: `src/images/` holds ~20 MB of originals (`funny.png` 5.1 MB, `hero-bg.jpg` 4.7 MB, `jo_1967.png` 3.8 MB, `cos.png` 3.7 MB).
- Impact: Repo bloat, slow clones and slow `scripts/warm-images.js` / eleventy-img runs.
- Fix approach: Pre-downscale originals to max needed width (e.g. 2560px) or move to Git LFS.

## Known Bugs

**Confirming FACTS breaks `npm test` (04 WR-02):**
- Symptoms: Tests assert draft markers exist.
- Files: `test/pages.test.js:139,271,341,345,352,396,406`
- Trigger: Deleting a `draft` line as documented in `FACTS.md`/`README.md`; also adding a recap dated today (strict `<` at `:345`).
- Workaround: None. Fix: guard with `if ("draft" in x)`, use `<=`.

**Anchors hidden under fixed header; FAQ deep links stay collapsed (04 WR-03):**
- Files: `src/css/partials/pages.css:59-61`, `src/jak-dolaczyc.njk`, `src/operacje.njk`, `src/_data/join.js:42-43`
- Trigger: Visit `/jak-dolaczyc/#mody` or `/operacje/#relacje`. No `scroll-margin-top` exists anywhere.
- Fix: `scroll-margin-top` on `.page-block, .faq-item` (100px / 120px mobile); open `details.faq-item` matching `location.hash` (extend `src/js/modules/hash-redirect.js`).

**Schedule vs. timeline mismatch (04 IN-01):**
- Files: `src/_data/operations.js:11,50-63`, `src/_data/join.js:69`
- Issue: "19:00 start, 2-3 h" vs. mission at 19:15 and debrief "ok. 21:30". Add to FACTS-07 for clan to settle.

**Recap card brackets clipped (04 IN-02):**
- Files: `src/css/partials/pages.css:243-247` (`overflow: hidden` on `.recap-card`) vs `src/css/partials/components.css:29-39`
- Fix: drop `overflow: hidden` or use `overflow: clip; overflow-clip-margin: 2px`.

**Lightbox alt text static English (03 IN-03):**
- Files: `src/js/modules/lightbox.js`
- Fix: Copy the thumbnail's Polish `alt` into the lightbox `<img>` on navigation.

**Stale image data in dev server (03 WR-05):**
- Files: `lib/images.js` (`processImages()` memoized per process)
- Trigger: Edit `src/images/` or `src/_data/gallery.js` during `npm run dev`; restart required.

## Security Considerations

**Discord badge leaks visitor IP to Discord (04 WR-01, GDPR):**
- Risk: Client `fetch` to `https://discord.com/api/v10/invites/...` without consent - same reason Google Fonts was removed.
- Files: `src/js/modules/discord-badge.js:14-31`, hook in `src/index.njk:138`, build-time data `src/_data/discordBadge.js`
- Current mitigation: `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`, 5 s timeout.
- Recommendations: Bake the build-time count and delete the module, or fetch only on user click, or add a privacy note linked from `src/_includes/partials/footer.njk`.

**Destructive test against real repo root (04 WR-04):**
- Risk: `test/reject-output.test.js:246-253` runs real `scripts/clean.js` with `.` and `..`; a regression in `isDisposableOutput` (`lib/reject-output.js`) would `rmSync` the repo.
- Recommendations: Run against a copied fake root (fix in 04-REVIEW.md).

**Image containment check too broad (03 IN-01):**
- Files: `lib/images.js` - source path checked against repo root, not `src/images/`. Tighten to `src/images/`.

**CI pinning:** `.github/workflows/pages.yml` pins actions to SHAs, minimal permissions; `.github/dependabot.yml` updates them. No concern.

## Performance Bottlenecks

**Perf gate blind spots (03 WR-03, WR-04, IN-06):**
- Files: `lib/check-perf.js` (522 lines), `scripts/check-perf.js`
- Problem: Most image variants (thumbnails, logo, desktop hero) never sized/checked; initial-JS budget P10 fails open for external and inline scripts; P3 third-party host list covers only the replaced CDNs.
- Improvement path: Enumerate all `<img>/<source>` srcset entries; count inline + external scripts in P10; generalize P3 to "any non-self origin".

**Image processing cost:** `scripts/warm-images.js` runs as `pretest`; large originals make cold runs slow (`.cache/`).

## Fragile Areas

**SEO/perf gate scripts:**
- Files: `lib/check-seo.js` (530 lines), `lib/check-perf.js`, `lib/html.js`, `scripts/check-seo.js:47`
- Why fragile: Regex/string-based HTML parsing; `lib/html.js:44-46` `String.fromCodePoint` throws on entities > U+10FFFF and `checkSite` is unwrapped, so `removeRejectedOutput` is skipped and a bad `_site/` stays (04 IN-04).
- Safe modification: Clamp code points; wrap `checkSite` in try/catch routing to rejection. Run `test/seo-gate.test.js`, `test/perf-gate.test.js`.

**JS module cache-busting:**
- Files: `src/js/main.js:9-18`, `test/js-version.test.js:87-95`
- Why fragile: `?v=` only applies to `import()` in `main.js` loader map; any static `import` between modules bypasses it (04 IN-03). Loader has no rejection handling (03 IN-02).
- Safe modification: Never import between modules; pass shared helpers via `init()`. Add a test asserting no `import` in `src/js/modules/`; add `.catch` to loader.

**Site URL config:**
- Files: `src/_data/site.js` - throws on missing/invalid `SITE_URL` in build mode; `PATH_PREFIX` must match host. Always set both (see `.github/workflows/pages.yml`).

**Font size caps:** Three inconsistent caps (03 IN-04) across `lib/woff2.js` / `lib/check-perf.js` / tests - unify into one constant.

## Scaling Limits

**Content in JS data files:**
- Current capacity: Operations recaps and FAQ hand-edited in `src/_data/operations.js`, `src/_data/join.js`.
- Limit: Each recap requires code edit + rebuild; no CMS.
- Scaling path: Move to Markdown collection (`src/relacje/*.md`) if recap volume grows.

## Dependencies at Risk

**sharp override:**
- Risk: `package.json` `overrides.sharp: 0.35.5` pinned under `@11ty/eleventy-img` 7.0.0; native binary; mismatch on upgrade.
- Migration plan: Re-verify override when bumping eleventy-img.

**Separate tool package:** `tools/seo-images/package.json` has its own lockfile outside Dependabot scope unless configured.

## Missing Critical Features

**Roster page:**
- Problem: Not implemented; depends on external Discord bot data format (scheduled last per project constraints).

**Privacy note:** No privacy policy page, needed if the live Discord fetch stays.

**Final host cutover:** IIS target (`src/web.config.njk`) built locally only; no automated indexable deploy - by design, but blocked by FACTS.

## Test Coverage Gaps

**Phantom-modified test files (line endings):**
- What's affected: `git status` lists `test/deps.test.js`, `facts.test.js`, `fonts.test.js`, `icons.test.js`, `images.test.js`, `seo-assets.test.js`, `seo-files.test.js`, `workflow.test.js` as modified, but `git diff` is empty — content matches HEAD; the flag is a CRLF/LF normalization artifact on Windows.
- Risk: Noise only (can hide a real change in `git status`). Priority: Low. Clear with a renormalize (`git add --renormalize .`) or by re-checking-out the files.

**Client JS behaviour:**
- What's not tested: Real-browser behaviour of `src/js/modules/*.js` (scroll lock, focus, anchors); `test/client.test.js`/`modules.test.js` are static/node-level. No E2E.
- Risk: WR-02/WR-03-type UI regressions go unnoticed. Priority: Medium.

**Gate exception paths:** No test for `lib/html.js` invalid entity crash path. Priority: Low.

---

*Concerns audit: 2026-10-13*
