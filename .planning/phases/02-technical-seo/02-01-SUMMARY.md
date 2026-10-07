---
phase: 02-technical-seo
plan: 01
subsystem: seo
tags: [eleventy, nunjucks, sitemap, robots-txt, canonical, noindex, post-build-gate, node-test]

requires:
  - phase: 01-foundation
    provides: Eleventy 3 build, site.js SITE_URL/PATH_PREFIX normalisation, HtmlBasePlugin htmlBaseUrl filter, test/helpers.js build harness
provides:
  - lib/seo.js shared predicate isIndexableUrl(url) + outputPathToUrl(relPath) (Eleventy filter isIndexableUrl)
  - Absolute self-referencing canonical on every page (head.njk)
  - Indexing guard - robots noindex on every page unless SITE_INDEXABLE is exactly "1" on an https non-local SITE_URL
  - SITE_URL origin validation and PATH_PREFIX segment validation in site.js
  - SEO config contract in site.js - shortName, locale, themeColor, indexable, ogImage, ogImageAlt, social[]
  - src/sitemap.xml.njk (absolute, url-sorted, indexable pages only) and src/robots.txt.njk (no Disallow, Sitemap line only when indexable)
  - scripts/check-seo.js post-build gate - checkSite(outDir, site) with rules G0, G2, G7, G8, G9, CLI (--dir) with LOCAL/INDEXABLE/preview banner
  - npm run build = clean + eleventy + gate (CI build step now enforces the gate)
affects: [02-03 head rewrite and G1/G3-G6 rules, 02-04 OG image and icons, 02-05 404 and web.config, 02-06 docs/cutover, phase-04 subpages]

actuals:
  tokens: 9261
  tasks: 3
  commits: 3
plan_head_before: 4cec8000a1b29c0be338c1cb80ee050d57af1901
plan_head_after: bbf17ba0b695469173f987aa8e11c3312e675b50

tech-stack:
  added: []
  patterns:
    - "One indexing predicate (lib/seo.js) shared by head template, sitemap template and the gate"
    - "Post-build gate as pure function checkSite(outDir, site) -> string[] plus a CLI wrapper, chained into npm run build"
    - "Gate tests: real builds into _test/seo-gate-* plus one hand-written fixture folder per problem in _test/seo-gate-fixtures/"
    - "Generated non-HTML files as Nunjucks templates with permalink + eleventyExcludeFromCollections"

key-files:
  created:
    - lib/seo.js
    - scripts/check-seo.js
    - src/sitemap.xml.njk
    - src/robots.txt.njk
    - test/seo.test.js
    - test/seo-gate.test.js
  modified:
    - eleventy.config.js
    - src/_includes/partials/head.njk
    - src/_data/site.js
    - package.json
    - test/helpers.js
    - test/devpages.test.js

key-decisions:
  - "Sitemap omits lastmod (Google ignores unverifiable lastmod; no git history needed in CI)"
  - "Gate problems are '<relPath>: G<n> <text>', sorted by file then rule, so CLI output is stable"
  - "Gate CLI prints the build-kind banner before checking the folder, so every run (even a failing one) states LOCAL / INDEXABLE / preview"
  - "Sitemap <loc> mapping rejects '.' and '..' segments and undecodable URIs as missing pages, so the gate never reads outside the output folder"

patterns-established:
  - "validPage/validSitemap/validRobots/validFiles fixture helpers in test/seo-gate.test.js: later plans extend validPage when they add gate rules"
  - "site.js is the only place SEO config lives; wave-2+ plans read it and do not edit it in parallel"

requirements-completed: [SEO-02, SEO-08, SEO-09]

coverage:
  - id: D1
    description: "Every page has exactly one absolute self-referencing canonical (root, /IBC-Website/ prefix and mutated builds)"
    requirement: SEO-02
    verification:
      - kind: integration
        ref: "test/seo.test.js#(a) one absolute canonical per page in root, prefix and mutated builds"
        status: pass
      - kind: unit
        ref: "test/seo-gate.test.js#G2 relative canonical / G2 missing canonical / G2 two canonicals / G2 canonical on a foreign host"
        status: pass
    human_judgment: false
  - id: D2
    description: "sitemap.xml lists exactly the indexable pages by absolute, sorted <loc>; robots.txt never disallows and names the sitemap only on indexable builds"
    requirement: SEO-02
    verification:
      - kind: integration
        ref: "test/seo.test.js#(f) sitemap lists exactly the indexable pages, sorted"
        status: pass
      - kind: integration
        ref: "test/seo.test.js#(g) robots.txt never disallows and names the sitemap only when indexable"
        status: pass
    human_judgment: false
  - id: D3
    description: "Post-build gate chained into npm run build: fails with exit 1 and one 'check-seo: <file>: G<n>' line per problem (G0, G2, G7, G8, G9), prints the build-kind banner"
    requirement: SEO-08
    verification:
      - kind: unit
        ref: "test/seo-gate.test.js (24 tests: real builds, CLI exit codes, banner, one fixture per problem)"
        status: pass
      - kind: integration
        ref: "test/devpages.test.js#(i) the build script cleans _site/, runs Eleventy, then the SEO gate"
        status: pass
      - kind: other
        ref: "MSYS_NO_PATHCONV=1 SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/ npm run build -> preview banner + check-seo: OK"
        status: pass
    human_judgment: false
  - id: D4
    description: "Noindex on every page unless SITE_INDEXABLE is exactly \"1\"; SITE_INDEXABLE=1 refuses http/localhost; malformed SITE_URL/PATH_PREFIX fails the build; test helpers never inherit SITE_INDEXABLE"
    requirement: SEO-09
    verification:
      - kind: integration
        ref: "test/seo.test.js#(b) (c) (d) (e)"
        status: pass
      - kind: unit
        ref: "test/seo-gate.test.js#G9 preview page without noindex / G9 indexable home with noindex / G9 indexable build whose 404.html lacks noindex"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-10-07
status: complete
---

# Phase 2 Plan 01: SEO tracer, indexing guard and post-build gate Summary

**Absolute canonicals, an opt-in-only indexing guard (SITE_INDEXABLE=1), sitemap.xml and robots.txt driven by one shared isIndexableUrl predicate, and a check-seo.js gate (G0/G2/G7/G8/G9) that `npm run build` now runs after Eleventy**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-07T18:48:42Z
- **Completed:** 2026-10-07T18:53:55Z
- **Tasks:** 3
- **Files modified:** 12 (6 created, 6 modified)

## Accomplishments

- The tracer proved the D-19 seam end to end: `lib/seo.js` is used by the Eleventy filter (head + sitemap) and imported by the gate, and the gate is chained into `npm run build`, so CI's existing build step enforces it.
- Every build is noindex unless `SITE_INDEXABLE` is exactly `"1"`. That flag is refused on http or localhost URLs. A malformed `SITE_URL` (no scheme, a path, a query or a hash) or a Git Bash-rewritten `PATH_PREFIX` fails the build with a message that names the variable.
- `site.js` now holds the SEO config contract for later plans: `shortName`, `locale`, `themeColor`, `indexable`, `ogImage`, `ogImageAlt` and `social[]`.
- The gate checks the canonical value against `site.url + pathPrefix + path`, sitemap completeness and validity (missing, duplicate, foreign or dangling `<loc>`), robots.txt (exists, no `Disallow: /`, a Sitemap line on indexable builds) and noindex in both directions. It prints a LOCAL, INDEXABLE or preview banner on every run.
- `npm test` passes 87 tests with 0 failures. That includes 24 gate tests and 7 real-build SEO tests.

## Task Commits

1. **Task 1: Tracer: home canonical -> sitemap.xml -> check-seo.js gate -> npm run build** - `0da00c3` (feat)
2. **Task 2: Indexing guard and SEO config contract in site.js** - `62c7c87` (feat)
3. **Task 3: robots.txt and gate hardening (G0, G7, G8, G9, banner)** - `bbf17ba` (feat)

## Files Created/Modified

- `lib/seo.js` - `isIndexableUrl` (false for `/404.html`, `/_dev/*`, empty) and `outputPathToUrl`
- `scripts/check-seo.js` - `checkSite(outDir, site)` with rules G0/G2/G7/G8/G9, CLI with `--dir` and the build-kind banner. It does not read `process.env` itself.
- `src/sitemap.xml.njk` - XML declaration as the first bytes, `collections.all | sort(false, true, "url")` filtered by `isIndexableUrl`, absolute `<loc>`, no lastmod
- `src/robots.txt.njk` - `User-agent: *` / `Allow: /`, and the `Sitemap:` line only when `site.indexable`
- `src/_data/site.js` - URL/prefix validation, `indexable` guard, SEO config keys
- `src/_includes/partials/head.njk` - canonical line and conditional robots noindex line (nothing else changed)
- `eleventy.config.js` - `isIndexableUrl` filter registered
- `package.json` - `build` = `node scripts/clean.js && eleventy && node scripts/check-seo.js`
- `test/helpers.js` - `SITE_INDEXABLE` added to the stripped build env keys
- `test/devpages.test.js` - test (i) expects the new build chain
- `test/seo.test.js` - tests (a)-(g): canonicals, noindex variants, URL validation, env isolation, sitemap, robots
- `test/seo-gate.test.js` - real-build, CLI and banner tests, plus one fixture test per gate problem

## Decisions Made

- No `lastmod` in the sitemap. Research says Google ignores lastmod values it cannot verify, and leaving it out means CI does not need git history.
- Problems are sorted by file and then by rule number, so gate output is byte-stable.
- The banner prints before the output-folder check, so even a failing run says which kind of build it was (Pitfall 9).
- The sitemap `<loc>` to file mapping rejects `.`/`..` segments and undecodable URIs and reports them as dangling. The gate only reads inside the output folder.

## Deviations from Plan

### Auto-added coverage (within scope, no behaviour change beyond the plan)

**1. [Rule 2 - Missing critical] Extra gate tests and fixture helpers**
- **Found during:** Tasks 1 and 3
- **Issue:** The plan's fixture list did not cover the CLI's missing-folder exit, a `<loc>` outside the base, a `<loc>` pointing at a non-indexable page, or a check that the baseline fixtures are clean. Without that check, a fixture test could pass because of an unrelated problem.
- **Fix:** Added tests for "CLI exits 1 when the build folder does not exist", "valid preview and indexable fixtures pass the gate", "G7 <loc> outside the base" and "G7 <loc> pointing at a non-indexable page". Added `validFiles()`/`check()` helpers next to the planned `writeFixture`/`validPage`/`validSitemap`/`validRobots`, so each fixture is a valid site with exactly one thing broken.
- **Files modified:** test/seo-gate.test.js
- **Committed in:** 0da00c3, bbf17ba

**2. [Rule 3 - Blocking] Node inline edit script failed on template-literal escaping**
- **Found during:** Task 2
- **Issue:** A scripted multi-replace of site.js aborted before writing anything, because `\/` escaping inside a heredoc template literal did not match.
- **Fix:** Rewrote site.js with the Write tool and kept every existing guard and value verbatim. There was no impact on output.
- **Committed in:** 62c7c87

---

**Total deviations:** 2 (1 added test coverage, 1 tooling hiccup)
**Impact on plan:** None on behaviour or scope. All acceptance criteria pass as written.

## Issues Encountered

None.

## Known Stubs

None. `site.ogImage` (`/assets/og/og-default-v1.jpg`) is a config value. Plan 02-02 creates the file and plan 02-04 wires it into the head. No template reads it yet.

## Threat Flags

None. T-02-01..T-02-04 are mitigated as planned: an opt-in indexable flag with an https/non-local check, URL/prefix validation, robots.txt that never disallows, and a gate with no environment switch, chained unconditionally.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 02-03 can now rewrite the head on top of `site.shortName`/`locale`/`themeColor`, extend `validPage` and add G1/G3-G6/G10 to `checkSite`.
- 02-04 reads `site.ogImage`/`ogImageAlt`, and 02-05 adds `/404.html`, which `isIndexableUrl` already excludes and G9 already covers.
- `npm run build` without `SITE_URL` still fails by design (CR-01 guard from Phase 1). Use `SITE_URL=...` or `ALLOW_LOCAL_SITE_URL=1` locally.

---
*Phase: 02-technical-seo*
*Completed: 2026-10-07*

## Self-Check: PASSED

- Files: lib/seo.js, scripts/check-seo.js, src/sitemap.xml.njk, src/robots.txt.njk, test/seo.test.js, test/seo-gate.test.js all present
- Commits: 0da00c3, 62c7c87, bbf17ba found in git log
