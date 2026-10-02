---
phase: 01-eleventy-foundation
plan: 01
subsystem: infra
tags: [eleventy, nunjucks, html-base-plugin, node-test, lighthouse, baseline]

requires: []
provides:
  - "D-07 pre-migration baseline: 10 viewport screenshots + baseline/scores.md (mobile Lighthouse 3 runs + median)"
  - "Eleventy 3.1.6 build: src/ -> _site/ with HtmlBasePlugin and passthrough css/js/assets"
  - "src/_data/site.js single source (url, pathPrefix, name, discord.invite, includeDevPages) with env override and normalization"
  - "test/helpers.js contract: repoRoot, build, read, listFiles, attrValues, block"
  - "test/build.test.js: root, /IBC-Website/, mutated SITE_URL, empty env, invite checks"
  - "data-discord-url hook on #terminal-console (consumed by plan 01-03)"
affects: [01-02, 01-03, 01-04, 01-05, 01-06, phase-2-seo, phase-3-performance]

actuals:
  tokens: 19446   # chars/4 over the realized text diff (17501 authored + 60283 package-lock.json); PNGs excluded
  tasks: 2
  commits: 2
plan_head_before: ef0d8949427d8fd956188dd48c743a3285861b80
plan_head_after: e7d4d16ee961222d3e2fc576b8679607b9ec94c5

tech-stack:
  added: ["@11ty/eleventy ~3.1.6 (devDependency, resolved 3.1.6)", "node:test (built-in)", "lighthouse 13.5.0 via npx (measurement only, not in package.json)"]
  patterns:
    - "Root-relative URLs in templates; HtmlBasePlugin adds pathPrefix; htmlBaseUrl(site.url) for <meta content>"
    - "eleventy.config.js imports src/_data/site.js so pathPrefix has one source"
    - "Tests spawn Eleventy via spawnSync(process.execPath, [cmd.cjs]) with an explicit env (no shell), each variant in _test/<suite>-<variant>/"

key-files:
  created:
    - package.json
    - package-lock.json
    - .nvmrc
    - eleventy.config.js
    - src/_data/site.js
    - test/helpers.js
    - test/build.test.js
    - .planning/phases/01-eleventy-foundation/baseline/scores.md
    - .planning/phases/01-eleventy-foundation/baseline/*.png (10 files)
  modified:
    - .gitignore
    - src/index.njk (git mv from index.html + 7 line edits)
    - src/css/style.css (git mv only)
    - src/js/main.js (git mv only)
    - src/assets/* (git mv only, 9 files)

key-decisions:
  - "Baseline section screenshots captured through the Chrome DevTools protocol (scrollIntoView + capture) because headless --screenshot ignores #hash scrolling; the scratch script stays outside the repo"
  - "Test helper strips SITE_URL/PATH_PREFIX/INCLUDE_DEV_PAGES/ELEVENTY_RUN_MODE case-insensitively from the inherited env before merging the variant env"
  - "Prefix test also rejects any drive-letter path pattern, not only the literal C:/ and Program%20Files"

patterns-established:
  - "Test suites name build dirs <suite>-<variant> under _test/ because node --test runs files in parallel"
  - "site.js normalizes env: trim, empty -> default, url trailing slashes stripped, pathPrefix -> '/' or '/<segment>/'"

requirements-completed: [FOUND-01, FOUND-03, FOUND-04, FOUND-06]

coverage:
  - id: D1
    description: "D-07 pre-migration baseline recorded before any file move: 10 viewport screenshots (>=10 KB each) and scores.md with 3 mobile Lighthouse runs + median"
    verification:
      - kind: other
        ref: "Task 1 <automated> verify (PNG count/size, '| Median', 'Commit: ', lh/ ignore line)"
        status: pass
    human_judgment: true
    rationale: "Whether the screenshots faithfully represent the old site is a visual judgment used later for side-by-side parity (D-07)"
  - id: D2
    description: "npm run build turns src/ into _site/index.html, css/style.css, js/main.js and all 9 assets"
    requirement: FOUND-01
    verification:
      - kind: integration
        ref: "test/build.test.js#default build emits the site"
        status: pass
      - kind: other
        ref: "npm run build && test -f _site/index.html ... && ls _site/assets | wc -l == 9"
        status: pass
    human_judgment: false
  - id: D3
    description: "PATH_PREFIX=/IBC-Website/ build prefixes stylesheet and script, no src=\".\" and no drive-letter/Program%20Files path"
    requirement: FOUND-06
    verification:
      - kind: integration
        ref: "test/build.test.js#prefix build rewrites root-relative URLs"
        status: pass
    human_judgment: false
  - id: D4
    description: "SITE_URL/PATH_PREFIX normalization: trailing-slash URL + slashless prefix give exact og:image; empty env falls back to localhost:8080 and /"
    requirement: FOUND-03
    verification:
      - kind: integration
        ref: "test/build.test.js#SITE_URL and PATH_PREFIX are normalized"
        status: pass
      - kind: integration
        ref: "test/build.test.js#empty env falls back to defaults"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every Discord invite in the built home page equals site.discord.invite; src/index.njk has no invite literal; data-discord-url exactly once"
    requirement: FOUND-04
    verification:
      - kind: integration
        ref: "test/build.test.js#invite comes from site.js"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-10-02
status: complete
---

# Phase 1 Plan 01: Baseline + Eleventy Tracer Summary

**The pre-migration site is on record (10 screenshots, mobile Lighthouse median 46/96/77/100). The home page now builds with Eleventy 3.1.6 from `src/`, and `src/_data/site.js` is the single source for URL, pathPrefix and the Discord invite. Tests prove it at the domain root, under `/IBC-Website/`, with a mutated SITE_URL and with empty env.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-02T21:54:53Z
- **Completed:** 2026-10-02T22:03:01Z
- **Tasks:** 2
- **Files modified:** 31 (incl. 13 renames and 10 PNGs)

## Accomplishments
- D-07 baseline captured from the old root site before any `git mv`: three mobile Lighthouse 13.5.0 runs (Performance 39/46/46, Accessibility 96, Best Practices 77, SEO 100; median 46/96/77/100) and 10 section viewport screenshots. Raw JSON reports stay local in the gitignored `baseline/lh/`.
- Repo moved to the D-13 layout: `src/index.njk`, `src/css`, `src/js`, `src/assets` (history kept through `git mv`). The empty `api/` dir is removed.
- Eleventy 3.1.6 pipeline end to end: env → `site.js` → `eleventy.config.js` (HtmlBasePlugin, passthrough, `pathPrefix: site.pathPrefix`) → `src/index.njk` → `_site/`.
- `node:test` suite (5 tests, all passing) builds four variants through `spawnSync`, with no shell. The inherited build env is stripped, so a dev shell or CI env cannot leak in. This was checked by running the suite with `PATH_PREFIX`/`SITE_URL`/`ELEVENTY_RUN_MODE` set in the shell: still 5/5.

## Task Commits

1. **Task 1: Capture the D-07 pre-migration baseline** - `f3a705d` (docs)
2. **Task 2: Tracer — Eleventy builds the home page from src/** - `e7d4d16` (feat)

**Plan metadata:** see the final docs commit for this SUMMARY

## Files Created/Modified
- `.planning/phases/01-eleventy-foundation/baseline/*.png` - 10 viewport screenshots (mobile/desktop × top/about/gallery/recruitment, 320 and 768 top)
- `.planning/phases/01-eleventy-foundation/baseline/scores.md` - Lighthouse runs, median, capture method, screenshot index
- `.gitignore` - adds `.planning/phases/*/baseline/lh/`, `_site/`, `_test/`, `node_modules/`, `.cache/`
- `package.json` / `package-lock.json` / `.nvmrc` - ESM project, engines `>=22.19`, `dev`/`build`/`test` scripts, Eleventy `~3.1.6`, Node 24 for CI
- `eleventy.config.js` - HtmlBasePlugin, passthrough map, `src` → `_site`, pathPrefix from site.js
- `src/_data/site.js` - single source config with env override and normalization
- `src/index.njk` - moved from `index.html`. 7 lines changed: root-relative css/js, `og:image` via `htmlBaseUrl(site.url)`, two invite hrefs and `data-discord-url` from `site.discord.invite`, lightbox `<img alt="Lightbox image">` without the empty src
- `test/helpers.js` - `repoRoot`, `build`, `read`, `listFiles`, `attrValues`, `block`
- `test/build.test.js` - FOUND-01/03/04/06 tracer tests

## Decisions Made
- Baseline section screenshots were captured through the Chrome DevTools protocol, not with `chrome --screenshot`. See deviation 1.
- `build()` strips the four build env keys case-insensitively, because Windows env names are case-insensitive. A copied `process.env` object is not.
- The prefix test also rejects any drive-letter path pattern, which also catches the `c:/C:/…` form seen in research, not only the literal strings.
- Test (e) rebuilds `build-root` instead of reusing test (a)'s output, so it still passes when run alone with `--test-name-pattern`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Headless `--screenshot` ignored `#section` URLs, so every "section" shot showed the hero**
- **Found during:** Task 1
- **Issue:** The planned `chrome --headless --screenshot … http://localhost:8077/#gallery` produced valid, large (>10 KB) PNGs, but all of them showed the top of the page. The page uses `scroll-behavior: smooth` and the capture does not follow the fragment. The automated size check would have passed on unusable images.
- **Fix:** A scratch Node script (outside the repo, Node's built-in WebSocket, no packages) drives headless Chrome over CDP. It sets the viewport, loads the page, runs `scrollIntoView` (instant) on the section, waits 3 s for scroll-spy and the terminal boot, and captures the viewport. Same 10 file names, viewports and URLs. The method is written down in `scores.md`.
- **Files modified:** `baseline/*.png`, `baseline/scores.md`
- **Verification:** Checked visually (gallery shows the gallery cards; recruitment shows the "REKRUTACJA" nav highlight and terminal output). Task 1 verify passes.
- **Committed in:** f3a705d

**2. [Process] Commits made on `main`**
- The executor's pre-commit guard treats `main` as protected. The orchestrator dispatched this plan sequentially on `main`, and the project uses `branching_strategy: none`, which `execute-phase` defines as warn-and-continue on the current branch (`steps/protected-branch.md`). Commits went to `main`, the same as the earlier planning commits. Nothing was rewritten.

---

**Total deviations:** 1 auto-fixed (Rule 1), 1 process note
**Impact on plan:** The baseline now really shows each section, which D-07's side-by-side parity check needs. No scope creep.

## Issues Encountered
- In the first screenshot loop a `\\$1` escape collapsed, and all shots overwrote one stray file `baseline$1.png`. It was deleted before staging and never committed.
- Running `chrome.exe --version` on Windows forwards to an already-running Chrome session (it printed "Otwieram w istniejącej sesji przeglądarki"), so the user's browser may have opened a blank tab. The version was then read from the file metadata. All captures used an isolated `--user-data-dir` in the scratchpad.

## Known Stubs
None that block this plan's goal. These interim states are intentional and owned by later plans:
- `src/js/main.js:174` still has the display string `discord.gg/DhJwkeehJK`. Plan 01-03 switches it to read `data-discord-url`, which this plan added. Until then the comment in `site.js` ("the only literal copy") is true for templates and config, but not yet for the JS display text.
- Gallery/logo `src="assets/…"` and `data-src="assets/…"` stay relative. They resolve on the home page under any prefix, and plan 01-02 converts them.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plans 01-02, 01-05 and 01-06 can import `test/helpers.js` and `site.js` with the contract names above.
- `npm run build` does not clean `_site/` yet. Plan 01-05 adds the clean step together with the dev-only page.

---
*Phase: 01-eleventy-foundation*
*Completed: 2026-10-02*

## Self-Check: PASSED

All 9 key files exist; commits f3a705d and e7d4d16 are in history; all Task 1 and Task 2 acceptance criteria re-run and pass; plan verification (`npm test` 5/5, `npm run build` with 9 assets) passes.
