---
phase: 01-eleventy-foundation
plan: 06
subsystem: testing
tags: [eleventy, node-test, link-audit, lighthouse, cdp, parity]

requires:
  - phase: 01-eleventy-foundation (01-01)
    provides: test/helpers.js build/listFiles/attrValues contract, src/_data/site.js, D-07 baseline (scores.md + 10 PNGs + lh/mobile-*.json)
  - phase: 01-eleventy-foundation (01-02, 01-03, 01-04, 01-05)
    provides: layout/partials, data-driven invite in main.js, Pages workflow, dev-only pages and clean-before-build
provides:
  - "test/links.test.js: dual-variant (/ and /IBC-Website/) internal-URL resolver, CSS url() resolver, absolute-URL host allowlist, single-source host and invite audit, README/tree check"
  - "baseline/after/: 20 after-migration viewport screenshots (root-* and sub-*)"
  - "baseline/parity.md: Lighthouse before/after medians, screenshot pair table, D-07 manual checklist for / and /IBC-Website/, repo-root hosting question"
affects: [phase-02-seo, phase-03-performance, end-of-phase UAT]

actuals:
  tokens: 4200
  tasks: 2
  commits: 2
plan_head_before: 893226dc17dd0495102f57af8d2504043b245ac4
plan_head_after: 32c5a1c61cd1e02a11087b46c16d7cecc7513bb9

tech-stack:
  added: []
  patterns:
    - "Link invariant test: every href/src/data-src/srcset URL in every built HTML file must be root-relative, carry the variant prefix and resolve to a file in that output"
    - "Absolute-URL audit with an explicit external-host allowlist; everything else must start with SITE_URL + prefix"

key-files:
  created:
    - test/links.test.js
    - .planning/phases/01-eleventy-foundation/baseline/parity.md
    - .planning/phases/01-eleventy-foundation/baseline/after/ (20 PNG)
  modified:
    - .planning/phases/01-eleventy-foundation/deferred-items.md

key-decisions:
  - "After-migration screenshots use the baseline's CDP method (isolated profile, scrollIntoView instant, ~3 s wait, viewport capture) so the comparison is like-for-like"
  - "The missing fixed header in the baseline's scrolled mobile shots is a capture artifact of the pre-existing 498 px layout-viewport overflow, not a parity target; the after shots (header visible) are the intended behaviour"
  - "favicon.ico 404 (the only console error before and after) is pre-existing and deferred to Phase 2, not fixed here"

patterns-established:
  - "Resolver tests carry non-vacuous guards (>= 3 HTML files per variant, >= 20 internal URLs on index.html) so an empty output cannot pass"

requirements-completed: [FOUND-02, FOUND-03, FOUND-04, FOUND-06]

coverage:
  - id: D1
    description: "Every internal href/src/data-src/srcset URL resolves to a file in the root and the /IBC-Website/ build (dev pages included), none is relative"
    requirement: FOUND-06
    verification:
      - kind: integration
        ref: "test/links.test.js#(a) internal URLs resolve in the root build (/)"
        status: pass
      - kind: integration
        ref: "test/links.test.js#(a) internal URLs resolve in the prefix build (/IBC-Website/)"
        status: pass
      - kind: integration
        ref: "test/links.test.js#(b) CSS url() targets resolve from css/ in both builds"
        status: pass
      - kind: integration
        ref: "test/links.test.js#(c) no machine paths or broken empty src in any variant"
        status: pass
    human_judgment: false
  - id: D2
    description: "Absolute own-site URLs follow SITE_URL + prefix; only allowlisted external hosts otherwise; the GitHub Pages host and localhost:8080 live only where allowed"
    requirement: FOUND-03
    verification:
      - kind: integration
        ref: "test/links.test.js#(d) absolute URLs come from SITE_URL (mutated build)"
        status: pass
      - kind: integration
        ref: "test/links.test.js#(e) production values in the GitHub Pages build"
        status: pass
      - kind: unit
        ref: "test/links.test.js#(f) host literals live in one place"
        status: pass
    human_judgment: false
  - id: D3
    description: "The Discord invite literal exists once (src/_data/site.js) and every built invite in all four variants equals site.discord.invite"
    requirement: FOUND-04
    verification:
      - kind: unit
        ref: "test/links.test.js#(g) invite defined once, in src/_data/site.js"
        status: pass
      - kind: integration
        ref: "test/links.test.js#(h) every built invite equals site.discord.invite"
        status: pass
    human_judgment: false
  - id: D4
    description: "After-migration Lighthouse medians (44/96/77/100) within the D-07 gate of the baseline (46/96/77/100)"
    requirement: FOUND-02
    verification:
      - kind: other
        ref: "Task 2 <automated> verify (PNG count/size, parity.md table header, node Lighthouse median gate)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Visual and behavioural parity of the migrated home page at / and /IBC-Website/ (D-07 manual checklist in baseline/parity.md) and the repo-root hosting question"
    requirement: FOUND-02
    verification: []
    human_judgment: true
    rationale: "D-07 rules out automated visual diffing; lightbox keyboard, mobile menu, scroll-spy, easter egg and screenshot comparison need a human in a real browser, and only the user can answer the hosting question"

duration: 9min
completed: 2026-10-02
status: complete
---

# Phase 1 Plan 06: Link Audit and D-07 Parity Capture Summary

**A 10-test `node:test` suite proves every internal URL resolves at `/` and under `/IBC-Website/`, that absolute URLs follow SITE_URL, and that the host and the Discord invite each live only in `src/_data/site.js`. Plus 20 after-migration screenshots and mobile Lighthouse medians of 44/96/77/100 against a 46/96/77/100 baseline (gate passes).**

## Performance

- **Duration:** 9 min
- **Started:** 2026-10-02T22:33:35Z
- **Completed:** 2026-10-02T22:42:00Z
- **Tasks:** 2
- **Files modified:** 24 (test/links.test.js, parity.md, 20 PNGs, deferred-items.md, this summary)

## Accomplishments

- `test/links.test.js` builds four variants (`links-root`, `links-prefix` with dev pages, `links-prod`, `links-mutated`). It checks 20 internal URLs on index.html plus both dev pages in each prefix variant, CSS `url()` targets, absolute-URL hosts against a 7-host allowlist, og:image for the mutated and production URLs, the absence of `_dev/` in production, single-source host and invite literals, and the README/tree match. A mutation check confirmed it: a relative `assets/logo.png` injected into a dev page made (a) fail in both variants.
- `npm test`: 47/47 across build, layout, client, workflow, devpages and links.
- D-07 after-capture: three mobile Lighthouse 13.5.0 runs on the root build. Performance 44/44/45, Accessibility 96, Best Practices 77, SEO 100. The median delta against the baseline is -2/0/0/0.
- 20 viewport screenshots (`root-*`, `sub-*`) taken with the same CDP method, viewports and sections as the baseline. The root and subpath shots are effectively identical. Desktop and top-of-page shots match the baseline apart from the planned header Discord button.
- `baseline/parity.md` contains the comparison tables, an explanation of the one visible difference (scrolled mobile shots), and the D-07 checklist for `/` and `/IBC-Website/` as 20 unchecked items, plus the repo-root hosting question.

## Task Commits

1. **Task 1: Dual-variant link resolver and single-source audit** - `ac19278` (test)
2. **Task 2: After-migration D-07 parity capture** - `32c5a1c` (docs)

**Plan metadata:** see the final `docs(01-06)` commit (SUMMARY, STATE, ROADMAP, REQUIREMENTS)

## Files Created/Modified

- `test/links.test.js` - tests (a)-(i): resolver, CSS url(), machine paths, SITE_URL/allowlist, production values, host and invite single source, README
- `.planning/phases/01-eleventy-foundation/baseline/after/*.png` - 20 after-migration screenshots
- `.planning/phases/01-eleventy-foundation/baseline/parity.md` - Lighthouse comparison, screenshot pairs, manual checklist
- `.planning/phases/01-eleventy-foundation/deferred-items.md` - logs the pre-existing favicon.ico 404

## Decisions Made

- I used the baseline's CDP capture method, not `chrome --screenshot`, because `--screenshot` ignores `#section` (found in 01-01). It ran with an isolated scratch profile.
- I investigated the scrolled mobile difference instead of just recording it. I served the old site from commit `ef0d894` and measured both versions over CDP. At 390 px the old layout viewport was 498 px wide, and the visual viewport sat 234 px below the layout viewport, so the fixed header was out of frame in the baseline shots. The new build keeps the layout viewport at 390 px (01-02's `overflow-x: clip`), so the header is visible. On desktop the section lands within 1 px of the old position. This is recorded in parity.md so the user does not read it as a regression.

## Deviations from Plan

None. The plan was executed as written; no template or config defect was exposed by the new assertions.

## Issues Encountered

- To read the Chrome version for parity.md, I ran `chrome.exe --version` without `--user-data-dir`. As 01-01 had warned, this forwarded to the user's open Chrome session ("Otwieram w istniejącej sesji przeglądarki"), which may have opened a blank tab. I then read the version (154.0.8037.93) from the file metadata. All captures and Lighthouse runs used isolated profiles.
- The background `python -m http.server` tasks reported "failed" (exit 127) only because I stopped them on purpose with `Stop-Process` at the end of Task 2.
- The only console error before and after migration is a 404 for `/favicon.ico`, because the site has never had a favicon. It accounts for one of the two failed Best Practices audits. It is out of scope and logged in deferred-items.md for Phase 2.

## Known Stubs

None.

## User Setup Required

None. The end-of-phase manual parity sign-off is the checklist in `baseline/parity.md`.

## Next Phase Readiness

- Phase 1's automated gates are all green (47/47). The remaining phase gate is the human D-07 sign-off: walk through the `parity.md` checklist at `/` and `/IBC-Website/`, compare the screenshot pairs, and answer the repo-root hosting question (A5).
- Carry-overs for later phases are in `deferred-items.md`: the mobile `.about-stats` and hero overflow (Phase 3/5) and the missing favicon (Phase 2).

## Self-Check: PASSED

- FOUND: test/links.test.js, baseline/parity.md, baseline/after/root-mobile-top.png, baseline/after/sub-w768-top.png (20/20 PNGs, none under 10 KB)
- FOUND: ac19278, 32c5a1c
- Task 2 automated verify: PASS (Lighthouse gate exit 0); `git status --porcelain` shows nothing under `baseline/lh/` or `_test/`
- `npm test`: 47 pass, 0 fail

---
*Phase: 01-eleventy-foundation*
*Completed: 2026-10-02*
