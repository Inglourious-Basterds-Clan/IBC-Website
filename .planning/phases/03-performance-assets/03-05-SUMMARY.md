---
phase: 03-performance-assets
plan: 05
subsystem: ui
tags: [fonts, woff2, montserrat, font-face, preload, iis, web.config, mime, eleventy, node-test]

# Dependency graph
requires:
  - phase: 03-01
    provides: home-only hero preload in head.njk; links.test.js url() resolution test (b)
  - phase: 03-02
    provides: src/fonts/montserrat-latin-ext.var.woff2, src/fonts/OFL.txt, lib/woff2.js (woff2CodePoints, woff2TableTags), test/fonts.test.js glyph tests
provides:
  - Self-hosted variable Montserrat wired end to end (passthrough src/fonts -> fonts, @font-face + metric-matched fallback face, one crossorigin font preload per page)
  - Google Fonts @import and both preconnects removed; Google font hosts dropped from the links.test.js allow-list
  - Build-output font guards in test/fonts.test.js (preload once, shipped unchanged, no Google host, stylesheet face and stacks, glyph per shipped code point, committed font never written)
  - web.config remove+mimeMap pairs for .avif, .webp and .woff2 (IIS 404.3 / 500.19 avoidance)
affects: [03-07 font-awesome removal, 03-08 css minification, 03-10, 03-11 parity screenshots and perf gate]

# Actuals (#2632) - chars/4 over the realized diff (git diff 034eb20..HEAD = 18066 chars)
actuals:
  tokens: 4517
  tasks: 2
  commits: 3
plan_head_before: 034eb208c870835ada7adac5cab0297f1dd9f160
plan_head_after: 049ba877850a48a6d514e7808928ff7b7b574196

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Build-output guards: a test file builds its own root and /IBC-Website/ variants in before() and asserts on _test/<suite>-<variant>/"
    - "Glyph coverage per Unicode code point (raw text plus numeric character references) against the woff2 cmap, failure lists each missing character with its files"
    - "web.config: every staticContent mimeMap is preceded by its own <remove>"

key-files:
  created: []
  modified:
    - eleventy.config.js
    - src/css/style.css
    - src/_includes/partials/head.njk
    - src/web.config.njk
    - test/fonts.test.js
    - test/links.test.js
    - test/seo-files.test.js

key-decisions:
  - "The font preload sits directly before the stylesheet links and carries crossorigin, so the woff2 is fetched once; HtmlBasePlugin prefixes its href under /IBC-Website/"
  - "The glyph check also decodes numeric character references (&#NNN; / &#xHH;), so an escaped character cannot slip past it"
  - "The correct human expectation for the Network > Font filter until 03-07 is: the only text font is the local Montserrat woff2 and nothing comes from fonts.gstatic.com / fonts.googleapis.com; fa-brands-400.woff2 from the Font Awesome CDN is expected and is removed by 03-07"

patterns-established:
  - "Font guard tests run on build output and tolerate minified CSS (03-08), so they keep holding after minification"

requirements-completed: [PERF-04]

coverage:
  - id: D1
    description: "No page requests Google Fonts: @import and preconnects gone, no shipped text file names fonts.googleapis.com or fonts.gstatic.com"
    requirement: PERF-04
    verification:
      - kind: integration
        ref: "test/fonts.test.js#no Google font host in the output (PERF-04)"
        status: pass
      - kind: integration
        ref: "test/links.test.js (d) allow-list without the Google font hosts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Exactly one crossorigin woff2 font preload per page, prefixed under /IBC-Website/, pointing at a shipped file"
    requirement: PERF-04
    verification:
      - kind: integration
        ref: "test/fonts.test.js#the head preloads the self-hosted font once (D-09)"
        status: pass
      - kind: other
        ref: "SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/ npm run build && grep prefixed preload in _site/index.html"
        status: pass
    human_judgment: false
  - id: D3
    description: "Font and OFL licence ship byte-identical to src/fonts/, and no build writes the committed woff2"
    requirement: PERF-04
    verification:
      - kind: integration
        ref: "test/fonts.test.js#the font and its licence ship unchanged (D-09)"
        status: pass
      - kind: integration
        ref: "test/fonts.test.js#builds never write the committed font (PERF-04 concurrency edge)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Stylesheet declares the Montserrat @font-face (swap, ../fonts url) and both stacks start with Montserrat without the dropped families"
    requirement: PERF-04
    verification:
      - kind: integration
        ref: "test/fonts.test.js#the stylesheet declares the self-hosted face (D-07, D-09)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every code point at or above U+0080 in the built HTML and JS has a glyph in the committed font"
    requirement: PERF-04
    verification:
      - kind: integration
        ref: "test/fonts.test.js#every shipped character has a glyph (PERF-04 encoding edge)"
        status: pass
    human_judgment: false
  - id: D6
    description: "web.config maps .webmanifest, .avif, .webp and .woff2, each <remove> before its <mimeMap>"
    verification:
      - kind: integration
        ref: "test/seo-files.test.js#(d) web.config maps 404 and the MIME types (D-16, research A3)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Headings, buttons, body text and Polish letters render in Montserrat and match the Phase 1 look"
    requirement: PERF-04
    verification:
      - kind: manual_procedural
        ref: "Tracer feedback gate after Task 1: user typed approved"
        status: pass
    human_judgment: true
    rationale: "Visual font rendering cannot be asserted by the tests; the user approved it at the tracer gate, and the phase-end parity screenshots (03-11) check it again"

# Metrics
duration: 33min
completed: 2026-10-10
status: complete
---

# Phase 3 Plan 05: Self-hosted Montserrat and IIS MIME types Summary

**Self-hosted variable Montserrat woff2 replaces Google Fonts on every page (one crossorigin preload, @font-face with a metric-matched Arial fallback, OFL shipped beside it), guarded by six build-output tests, plus IIS remove+mimeMap pairs for .avif, .webp and .woff2**

## Performance

- **Duration:** 33 min (includes the wait at the tracer feedback gate)
- **Started:** 2026-10-10T19:29:22Z
- **Completed:** 2026-10-10T20:02:33Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Google Fonts is gone: the CSS @import and both preconnect links are deleted, and a Google font URL brought back anywhere in the output now fails both links.test.js (d) and fonts.test.js.
- Montserrat is self-hosted. `src/fonts` is copied to `fonts/`, there is one `@font-face` (weights 100 to 900, `font-display: swap`) plus a "Montserrat Fallback" face built on local Arial, and each page has exactly one `<link rel="preload" as="font" type="font/woff2" crossorigin>`. This works at the root and under /IBC-Website/.
- `test/fonts.test.js` now has 11 tests (5 from 03-02, 6 added here). They build a root variant and a prefix variant and check:
  - each page preloads the font exactly once
  - the woff2 and OFL ship byte-identical to `src/fonts/`
  - no Google font host appears in any shipped text file
  - the @font-face rule and both font stacks are correct (the check works on minified CSS too)
  - every non-ASCII code point in the built HTML and JS has a glyph in the font
  - the committed woff2 has the same sha256 before and after the builds
- web.config maps .webmanifest, .avif, .webp and .woff2, each with its `<remove>` placed before its `<mimeMap>`. seo-files.test.js (d) checks all four, including that order.

## Task Commits

1. **Task 1: Tracer: self-hosted Montserrat replaces Google Fonts end to end** - `f9d8eba` (feat)
2. **Task 2: Build-output font guards and IIS MIME types (TDD)**
   - RED: `eb40965` (test)
   - GREEN: `049ba87` (feat)
   - REFACTOR: none needed

**Plan metadata:** see the docs(03-05) commit that follows this SUMMARY

## TDD Record (Task 2)

- **RED:** seo-files.test.js (d) was extended to the four extensions. Run: `node --test --test-reporter=tap test/seo-files.test.js`, exit 1, 4 pass / 1 fail. The target (d) failed with `root: web.config lacks <remove fileExtension=".avif" />`. Classifier: `RED_EVIDENCE_OK` (target_test_failed). Semantic assessment: the target ran and failed on the assertion the plan intended, and tests (a)-(c) and (e) passed, so this was not a build, fixture or load fault.
- **Expected green on the new fonts.test.js guards:** these six tests check the output of Task 1, which was already committed, so they passed when first written. That is the plan's design, not a sign the tests are wrong. To show they can fail, head.njk was changed temporarily: a fonts.gstatic.com preconnect, a second font preload and a U+2588 character were added. The preload-once, no-Google-host and glyph tests then failed, naming 404.html and index.html. head.njk was restored with `git checkout -- <file>`.
- **GREEN:** three remove+mimeMap pairs were added to web.config.njk. `node --test test/fonts.test.js test/seo-files.test.js` gave 16/16, and `npm test` gave 238/238.

## Files Created/Modified
- `eleventy.config.js` - passthrough `"src/fonts": "fonts"` (woff2 and OFL ship together)
- `src/css/style.css` - FONTS section with the Montserrat and Montserrat Fallback faces; `--font-hud` / `--font-body` stacks begin with Montserrat
- `src/_includes/partials/head.njk` - font preload; preconnects removed; block comment renamed to "Preloads & Stylesheets"
- `src/web.config.njk` - .avif, .webp, .woff2 remove+mimeMap pairs; header comment updated
- `test/fonts.test.js` - six build-output font guards
- `test/links.test.js` - Google font hosts removed from allowedHosts; (b) needs at least one local url() and the font url
- `test/seo-files.test.js` - (d) checks all four MIME mappings and that each remove comes before its mimeMap

## Decisions Made
- The glyph check also decodes numeric character references, so an escaped non-ASCII character still has to have a glyph.
- Tracer-gate observation from the user's check: with the Network panel filtered to Font, `fa-brands-400.woff2` from the Font Awesome CDN also loads. This is expected for now: Font Awesome is outside 03-05's scope and 03-07 removes it. The previous executor said to expect "exactly one font request", which was wrong. The right expectation is that the only text font is the local Montserrat woff2 and nothing loads from fonts.gstatic.com or fonts.googleapis.com. Font Awesome was not touched in this plan.

## Deviations from Plan

None. The plan was executed as written. (While writing the tests, a heredoc halved a backslash in one regex template literal. It was caught and fixed with Edit before the RED commit, so it never reached a commit.)

## Issues Encountered
- Under the Windows bash round-trip, a `\\s` inside a JS template literal written through a heredoc came out as `\s`. The test still passed, but it would have stopped tolerating whitespace in minified CSS. Fixed before the commit. Later test files should be written with the Write/Edit tools.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness
- 03-07 can remove the Font Awesome CDN stylesheet. links.test.js `allowedHosts` then only needs cdnjs.cloudflare.com dropped.
- 03-08 can minify CSS. The stylesheet test's regexes accept minified output, and the font url is relative to css/style.css, so it needs no rebasing.
- PERF-04 is shared with 03-03 and 03-11, so its REQUIREMENTS.md checkbox flips only once every plan that declares it has a SUMMARY.

## Self-Check: PASSED
- FOUND: test/fonts.test.js, src/web.config.njk, test/seo-files.test.js, src/css/style.css, src/_includes/partials/head.njk, eleventy.config.js, test/links.test.js
- FOUND commits: f9d8eba, eb40965, 049ba87 (evaluation-scope: 3 plan commits on this branch)
- Acceptance criteria re-run: passthrough 1, @font-face 2, font-display swap 1, preload 1, block comment 1, each MIME type 1, fonts.test.js 11/11, npm test 238/238
- Plan verification: the /IBC-Website/ production build passes check-seo (2 pages), the prefixed preload is in _site/index.html, _site/fonts has the woff2 and OFL.txt, and no Google font host appears in _site. The sha256 of the committed blob, the working copy and the output are identical for both the woff2 and OFL.txt.

---
*Phase: 03-performance-assets*
*Completed: 2026-10-10*
