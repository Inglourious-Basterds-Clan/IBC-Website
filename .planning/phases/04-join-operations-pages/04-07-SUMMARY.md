---
phase: 04-join-operations-pages
plan: 07
subsystem: ui
tags: [navigation, aria-current, hash-redirect, data-js, teaser, d-09-consistency]

requires:
  - phase: 04-join-operations-pages
    provides: "04-01 /jak-dolaczyc/ page and breadcrumbs (own aria-current); 04-03 live Discord badge next to the home CTA; 04-04 /operacje/ page; 04-06 pages.css (shared CSS budget)"
  - phase: 03-performance
    provides: "D-14 data-js feature loader (frozen literal map in src/js/main.js), check-perf P9/P10 budgets"
provides:
  - "src/js/modules/hash-redirect.js (init): legacy #recruitment -> location.replace(href of a[data-legacy-hash]) on load and on hashchange"
  - "Loader key 'hash-redirect' in src/js/main.js; data-js=\"hash-redirect\" on section#rekrutacja"
  - "Attribute contract data-legacy-hash=\"<old id>\" on a real build-time link (prefix-correct by HtmlBasePlugin)"
  - "Home section id rekrutacja (teaser): terminal, Discord CTA + badge, four confirmed requirements, short flow summary, 'Pełna instrukcja →' link"
  - "Nav data Start (/#hero), O nas (/#about), Operacje (/operacje/), Dołącz (/jak-dolaczyc/) for header and footer"
  - "header.njk build-time marking: current subpage link gets class active-nav + aria-current=\"page\""
  - ".recruitment-more link class (recruitment.css); .recruitment-steps rule removed"
affects: [04-08 (WR-01 stale main.js without the hash-redirect loader; initial JS has 47 B headroom), 05 a11y (aria-current already present), 05 visual refresh of the teaser]

actuals:
  tokens: 6795
  tasks: 3
  commits: 5
plan_head_before: e297720bb061a52a911c802aa1c073131d57233d
plan_head_after: daf2915933c68b8ad66adec46639351e626a5be6

tech-stack:
  added: []
  patterns:
    - "Legacy-hash redirect follows a real link's resolved href (no URL or selector built from location.hash), so the path prefix comes from the build"
    - "Build-time current-page marking in Nunjucks: item.href == page.url (unprefixed), HtmlBasePlugin prefixes the output"
    - "Modules locate their observed container with el.closest('section') instead of a fixed id"

key-files:
  created:
    - src/js/modules/hash-redirect.js
  modified:
    - src/index.njk
    - src/js/main.js
    - src/js/modules/terminal.js
    - src/_data/navigation.js
    - src/_includes/partials/header.njk
    - src/css/partials/recruitment.css
    - test/client.test.js
    - test/modules.test.js
    - test/layout.test.js
    - test/devpages.test.js
    - test/pages.test.js

key-decisions:
  - "lib/check-perf.js left untouched: home initial JS measures 6097 B gz against the 6144 B cap (47 B headroom), CSS 4663 B gz of 5120"
  - "Hero 'Złóż podanie' links to /jak-dolaczyc/ (assumption A6), not to the teaser anchor"
  - "Human checks of the tracer (redirect in a browser at / and /IBC-Website/, Back behaviour, terminal boot) are deferred to the end-of-phase check per human_verify_mode=end-of-phase and the plan's <verification>"

patterns-established:
  - "data-legacy-hash contract: one real link per legacy id, exact (case-sensitive) match only"

requirements-completed: [CONT-05, CONT-06]

coverage:
  - id: D1
    description: "/#recruitment redirects to /jak-dolaczyc/ (prefixed) via location.replace of the legacy link's href; #hero/#about/#gallery, empty, case-changed, encoded and //evil.example hashes never navigate; later hashchange handled"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "test/client.test.js hash-redirect tests (4) with stub window/location"
        status: pass
      - kind: integration
        ref: "test/layout.test.js 'the old recruitment anchor is gone and its legacy link points at the join page' (root + /IBC-Website/ builds); prefixed build grep of section#rekrutacja and href=/IBC-Website/jak-dolaczyc/ legacy link; _site/js/modules/hash-redirect.js exists"
        status: pass
    human_judgment: true
    rationale: "Real-browser redirect, no extra history entry and anchor scrolling are confirmed in the end-of-phase human check"
  - id: D2
    description: "Recruitment terminal observes its enclosing section and is a no-op outside one"
    verification:
      - kind: unit
        ref: "test/client.test.js 'terminal observes its enclosing section, not a fixed id' and 'terminal is a no-op outside a section'"
        status: pass
    human_judgment: false
  - id: D3
    description: "Header and footer nav read Start / O nas / Operacje / Dołącz on home, both subpages and 404 (root and prefix); subpages mark exactly their own link with active-nav + aria-current; home marks only Start; 404 and dev pages mark nothing; breadcrumb aria-current kept (two per subpage)"
    requirement: "CONT-05"
    verification:
      - kind: integration
        ref: "test/pages.test.js nav tests (6), test/layout.test.js, test/devpages.test.js, test/seo-files.test.js, test/links.test.js (96 pass)"
        status: pass
      - kind: other
        ref: "SITE_URL=https://guard.example npm run build + grep of active-nav aria-current on operacje and jak-dolaczyc"
        status: pass
    human_judgment: false
  - id: D4
    description: "Scroll-spy on home highlights only hash links, never the page links"
    requirement: "CONT-05"
    verification:
      - kind: unit
        ref: "test/client.test.js 'scroll-spy on home manages only the hash links, never the page links'"
        status: pass
    human_judgment: false
  - id: D5
    description: "Home teaser and about stat agree with the subpages (Zalecane 16+, TeamSpeak + ACRE2, ok. 90 GB, weekend 19:00); no built page carries the old age line or Pt/Sob/Ndz; teaser keeps terminal, CTA, badge and drops the step list"
    requirement: "CONT-06"
    verification:
      - kind: integration
        ref: "test/pages.test.js teaser/consistency tests (5, incl. dev-pages build), test/layout.test.js polishCopy, test/css.test.js, test/icons.test.js, test/discord.test.js (112 pass)"
        status: pass
      - kind: other
        ref: "npm test 422 pass 0 fail; guard and /IBC-Website/ production builds: check-seo OK, check-perf OK (css 4663 B, js 6097 B)"
        status: pass
    human_judgment: true
    rationale: "Teaser look at 1280 px and 390 px (position of the 'Pełna instrukcja →' link inside the space-between card) is confirmed in the end-of-phase human check"

duration: 7min
completed: 2026-10-13
status: complete
---

# Phase 04 Plan 07: Multi-page Nav, Legacy Hash Redirect and Home Teaser Summary

**Old `/#recruitment` links now land on `/jak-dolaczyc/` (prefixed under `/IBC-Website/`). A `data-js="hash-redirect"` module calls `location.replace` with the href of a real `a[data-legacy-hash]` link. The nav is now Start / O nas / Operacje / Dołącz, and the current subpage gets `aria-current="page"` at build time. The home recruitment section is now a `#rekrutacja` teaser that states the same facts as the subpages.**

## Performance

- **Duration:** about 7 min
- **Started:** 2026-10-13T18:14:36Z
- **Completed:** 2026-10-13T18:21:43Z
- **Tasks:** 3
- **Files modified:** 12 (1 created)

## Accomplishments

- `src/js/modules/hash-redirect.js`: reads `location.hash.slice(1)` and compares it with `===` against `data-legacy-hash` values. On a match it calls `window.location.replace(link.href)`. It runs once on load and again on `hashchange`. It never builds a URL or a selector from the hash (T-04-20, T-04-21).
- The home section `#recruitment` became `<section id="rekrutacja" class="recruitment" data-js="hash-redirect">`. The legacy link "Pełna instrukcja →" points to `/jak-dolaczyc/`, and the hero button "Złóż podanie" also goes to `/jak-dolaczyc/`.
- The terminal now finds its section with `el.closest('section')`, so renaming the id did not break the boot sequence.
- Nav data is Start / O nas / Operacje / Dołącz. `header.njk` marks `item.href == page.url` with `class="active-nav" aria-current="page"`. The home page keeps only `class="active-nav"` on Start, so the existing byte-equality tests for the header still pass.
- Teaser requirements: "Zalecane 16+ – liczy się dojrzałość.", "Arma 3 – żadne DLC nie są wymagane.", "Mikrofon, TeamSpeak i ACRE2.", "Modpack ok. 90 GB ze Steam Workshop.". The lead is now a two-sentence summary of the Discord flow. The step list is removed. The about stat reads "19:00 / Start misji w weekendy".
- CSS: the dead `.recruitment-steps` rule was removed and a `.recruitment-more` HUD text-link rule was added. The CSS bundle is 4663 B gz (was 4661).

## Task Commits

1. **Task 1: Tracer: legacy hash redirect, teaser id, terminal section lookup**: `5f2b87b` (feat)
2. **Task 2: Nav to real pages with build-time aria-current**: `e16d1c5` (test, RED), `2500c4c` (feat, GREEN)
3. **Task 3: Home teaser with confirmed facts, cross-page consistency**: `b94b767` (test, RED), `daf2915` (feat, GREEN)

## Files Created/Modified

- `src/js/modules/hash-redirect.js`: new legacy hash redirect module
- `src/js/main.js`: loader entry `'hash-redirect'`
- `src/js/modules/terminal.js`: `closest('section')` lookup and an updated hook comment
- `src/index.njk`: teaser id and hook, legacy link, hero href, confirmed requirements, lead, weekend stat
- `src/_data/navigation.js`: Start / O nas / Operacje / Dołącz
- `src/_includes/partials/header.njk`: `elif item.href == page.url` marking
- `src/css/partials/recruitment.css`: `.recruitment-more` added, `.recruitment-steps` removed
- `test/client.test.js`: terminal `closest` stub, section tests, hash-redirect tests, mixed-nav scroll-spy test
- `test/modules.test.js`: `hookNames` includes `hash-redirect`
- `test/layout.test.js`: new needles, nav constants, polishCopy, legacy link and hero href assertions
- `test/devpages.test.js`: nav labels
- `test/pages.test.js`: nav marking tests, teaser and cross-page consistency tests, dev-pages old-copy scan

## TDD Gate Compliance

- **Task 2 RED** (`e16d1c5`): `node --test --test-reporter=tap test/pages.test.js` exited 1 with 6 of 46 failing. Classifier verdict: `RED_EVIDENCE_OK` (target_test_failed). Semantic check: the target test "(root build) subpages mark exactly their own header link with aria-current (D-07)" ran and failed on the planned assertion. It found no aria-current-marked header link where `[Operacje]` was expected. There were no load, syntax or fixture faults.
- **Task 2 GREEN** (`2500c4c`): 96 of 96 targeted tests pass, `npm test` 417 of 417.
- **Task 3 RED** (`b94b767`): the same command exited 1 with 5 of 51 failing. Classifier verdict: `RED_EVIDENCE_OK`. Semantic check: the target teaser test failed on `home lacks "Zalecane 16+"`, and the old-copy scan failed on `index.html carries "Ukończone 16 lat"`. Both are the planned assertions.
- **Task 3 GREEN** (`daf2915`): 112 of 112 targeted tests pass, `npm test` 422 of 422.
- No REFACTOR commits were needed. Task 1 is a tracer (`type="tracer"`, not TDD). Its tests landed in the same feat commit.

## Decisions Made

- `lib/check-perf.js` is unchanged. Initial JS is 6097 B gz against a 6144 B cap, so P10 did not trip.
- The tracer feedback gate was handled automatically: the automated `<verify>` passed end to end. The `<human-check>` items are collected at the end of the phase (`human_verify_mode=end-of-phase`, plan `<verification>`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Normalized CRLF working-tree files to LF before editing**
- **Found during:** Task 1
- **Issue:** Several tracked files were checked out as CRLF, even though the index stores LF. Exact-string edits failed, and the Edit tool would have produced whole-file diffs.
- **Fix:** Before each edit, stripped `\r` from every file this plan touches: terminal.js, client.test.js, layout.test.js, header.njk, index.njk and recruitment.css. Every commit diff contains only the intended lines.
- **Commit:** 5f2b87b, 2500c4c, daf2915

**2. [Rule 1 - Test sequencing] Task 1 "no link to the old anchor" assertion staged across tasks**
- **Found during:** Task 1
- **Issue:** Until Task 2 the nav still carried `/#recruitment`, so a "no href ending in #recruitment" assertion could not pass in Task 1.
- **Fix:** Task 1 asserts that no in-page `#recruitment` fragment link exists. Task 2 tightens this to "no href ends with #recruitment" on the root and prefix builds.
- **Commit:** 5f2b87b, e16d1c5

**Total deviations:** 2 auto-fixed (1 blocking, 1 test sequencing). **Impact:** none on scope. Every acceptance criterion and test the plan specified is in place, plus two extra terminal-section tests.

## Issues Encountered

- In Git Bash heredocs on this machine, `\\` collapses to `\`, which broke two generated regex literals in the tests. They were fixed with exact edits before RED was recorded, so the RED runs used the final test code.

## Known Stubs

None. The `todo: "FACTS-01"` front matter in `src/index.njk` existed before this plan and was not changed.

## Notes for Next Plans

- Initial JS headroom is only 47 B (6097 of 6144). 04-08 (WR-01, stale cached main.js) should account for this before adding any shipped bytes.
- `.recruitment-more` is a flex item inside the `space-between` instruction card. At 1280 px, if the right card is taller than its content, the link may sit between the lead and the CTA group with free space around it. This should be checked visually in the end-of-phase human check.

## Next Phase Readiness

Ready for 04-08.

## Self-Check: PASSED

- FOUND: src/js/modules/hash-redirect.js, src/_data/navigation.js, src/_includes/partials/header.njk
- FOUND commits: 5f2b87b, e16d1c5, 2500c4c, b94b767, daf2915
