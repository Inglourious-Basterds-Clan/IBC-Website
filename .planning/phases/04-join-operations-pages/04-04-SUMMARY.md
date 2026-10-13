---
phase: 04-join-operations-pages
plan: 04
subsystem: content-pages
tags: [eleventy, nunjucks, eleventy-img, intl, breadcrumbs, seo, facts]

requires:
  - phase: 04-join-operations-pages
    provides: "04-01 breadcrumb partial, pageGraph BreadcrumbList, draft-field marker form, test/pages.test.js builds"
  - phase: 03-performance-assets
    provides: "lib/images.js pipeline (thumb preset, run() guard), picture shortcode, perf gate P6/P7/P8"
provides:
  - "/operacje/ page (schedule, mission types, eras, five-step evening timeline, Discord-only 'Najbliższe misje', four recap cards)"
  - "src/_data/operations.js single source: schedule, missionTypes, eras, erasNote, evening, upcoming, lastUpdate, recaps"
  - "lib/dates.js formatPlDate (strict ISO -> Polish long date in UTC) and the plDate filter"
  - "images.recaps global data (recap entries + thumb metadata)"
  - "FACTS-06..13 rows and markers"
affects: [04-05 gate G11, 04-06 pages.css, 04-07 nav and teaser, ENG-04 bot calendar slot]

actuals:
  tokens: 8400
  tasks: 2
  commits: 4
plan_head_before: 6d2eb29456ce1eb0ecd27b266641cbb3e532ded3
plan_head_after: 25bf29048be4db12954adcbac992852b607cba1c

tech-stack:
  added: []
  patterns:
    - "Build-time date formatting through a Nunjucks filter backed by a strict, UTC-only Intl formatter"
    - "Recap images go through processImages() like the gallery; the template sorts images.recaps by date"

key-files:
  created:
    - src/_data/operations.js
    - src/operacje.njk
    - lib/dates.js
  modified:
    - lib/images.js
    - eleventy.config.js
    - FACTS.md
    - test/pages.test.js
    - test/seo.test.js
    - .planning/phases/03-performance-assets/03-REVIEW-DISPOSITION.md

key-decisions:
  - "Schedule items render as <li><h3>label</h3><p>text</p></li>, like the type list (UI-SPEC addition)"
  - "'Najbliższe misje' is a div.upcoming inside the #najblizsze-misje .page-block, with no list, no <time> and no date"
  - "The sniper.jpg recap is labelled modern (Współczesność · Takistan) instead of Cold War because the image shows modern gear"
  - "formatPlDate rejects non-strings, non-ISO shapes and impossible days (round-trip check), so a typo fails the build"

patterns-established:
  - "Data-file draft markers also cover nested entries (evening step OCAP) and singletons (lastUpdate)"

requirements-completed: [CONT-03, CONT-04, CONT-06, SEO-06]

coverage:
  - id: D1
    description: "/operacje/ shows the confirmed schedule (weekends 19:00, 2–3 h, same-day Zeus games), mission types PvE / Joint Operations / Gra Zeusowa, the eras and a five-step evening timeline in fixed order"
    requirement: CONT-03
    verification:
      - kind: integration
        ref: "test/pages.test.js#(root|prefix build) operations page: schedule, mission types and eras (CONT-03, D-02)"
        status: pass
      - kind: integration
        ref: "test/pages.test.js#(root|prefix build) operations page: the five-step evening timeline in order (CONT-03, D-02)"
        status: pass
    human_judgment: false
  - id: D2
    description: "'Najbliższe misje' links to site.discord.invite with no dates, no <time> and no Event structured data"
    requirement: CONT-03
    verification:
      - kind: integration
        ref: "test/pages.test.js#(root|prefix build) operations page: \"Najbliższe misje\" points to Discord and lists no dates (D-10)"
        status: pass
      - kind: integration
        ref: "test/pages.test.js#(root|prefix build) operations page has no Event markup and is in the sitemap"
        status: pass
    human_judgment: false
  - id: D3
    description: "Four recap cards, newest first, each with one lazy responsive picture with numeric dimensions and a meta line 'date · setting · type' with <time datetime> and a UTC Polish date; manual 'Ostatnia aktualizacja'"
    requirement: CONT-04
    verification:
      - kind: unit
        ref: "test/pages.test.js#(unit) formatPlDate formats in UTC whatever the process timezone (Pitfall 11)"
        status: pass
      - kind: unit
        ref: "test/pages.test.js#(unit) formatPlDate rejects invalid or non-ISO input"
        status: pass
      - kind: integration
        ref: "test/pages.test.js#(root|prefix build) operations page: 3–5 recap cards, newest first (CONT-04, D-12)"
        status: pass
      - kind: integration
        ref: "test/pages.test.js#(root|prefix build) operations page: each recap card has one lazy responsive picture and a meta line"
        status: pass
      - kind: integration
        ref: "test/images.test.js#img/ ships only referenced variants"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every drafted unit (description/status/lead, evening times, OCAP text, lastUpdate, four recaps) carries a TODO(FACTS-06..13) marker in the output and a FACTS.md row"
    requirement: CONT-06
    verification:
      - kind: integration
        ref: "test/facts.test.js#every source marker reaches the build output"
        status: pass
      - kind: integration
        ref: "test/pages.test.js#(root|prefix build) operations page: drafted evening and OCAP texts carry their markers (CONT-06)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Visible breadcrumbs Start / Operacje and a prefix-correct BreadcrumbList; /operacje/ in the sitemap; both gates pass at the root and under /IBC-Website/"
    requirement: SEO-06
    verification:
      - kind: integration
        ref: "test/pages.test.js#(root|prefix build) operations page: breadcrumb trail and prefix-correct BreadcrumbList (SEO-06)"
        status: pass
      - kind: integration
        ref: "test/seo.test.js#(f) sitemap lists exactly the indexable pages, sorted"
        status: pass
      - kind: other
        ref: "SITE_URL=https://guard.example npm run build && MSYS_NO_PATHCONV=1 SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/ npm run build (check-seo OK, check-perf OK)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Polish tone of the drafted recap stories and evening texts, and whether patrol.jpg and sniper.jpg are real clan screenshots"
    verification: []
    human_judgment: true
    rationale: "Tone and factual accuracy of drafted recaps need a clan member. The images look like promotional renders (patrol.jpg carries an ARMA watermark), so the user must confirm they are fit to show as clan recaps"

duration: 7 min
completed: 2026-10-13
status: complete
---

# Phase 4 Plan 04: Operations Page (/operacje/) Summary

**/operacje/ built from src/_data/operations.js: weekend schedule, three mission types, era tags, a five-step "typowy wieczór" timeline, a Discord-only "Najbliższe misje" block and four drafted recap cards. The cards use eleventy-img thumbnails and UTC-formatted Polish dates (lib/dates.js), and the page has breadcrumbs and a prefix-correct BreadcrumbList**

## Performance

- **Duration:** 7 min
- **Started:** 2026-10-13T17:49:06Z
- **Completed:** 2026-10-13T17:56:02Z
- **Tasks:** 2 (1 tracer, 1 TDD)
- **Files modified:** 9 (3 created, 6 modified)

## Accomplishments

- New page `/operacje/` (one h1, `#harmonogram`, `#rodzaje-misji`, `#epoki`, `#typowy-wieczor`, `#najblizsze-misje`, `#relacje`). It is in the sitemap and passes check-seo and check-perf at the root and under `/IBC-Website/`.
- `breadcrumb: "Operacje"` brings the visible trail and the BreadcrumbList from the 04-01 partial and builder. The page has no Event markup and no upcoming dates (D-10).
- Four recap cards are sorted newest first in the template (`sort(true, false, "date")`). Each card has one lazy `<picture>` with numeric width/height from the `thumb` preset and a meta line `<time datetime>` · setting · type.
- `formatPlDate` is strict and UTC-only. "2026-02-30", "2026-9-20", "20.09.2026", "" and non-strings all throw. A child process with `TZ=America/Los_Angeles` still prints "20 września 2026".
- FACTS-06..13 are registered and their markers reach the output. Review item IN-05 is closed: patrol.jpg and sniper.jpg are now recap images.

## Task Commits

1. **Task 1: Tracer for /operacje/ (schedule, types, eras, evening, upcoming, breadcrumbs, sitemap, both gates)** - `dbdbf2e` (feat)
2. **Task 2: Recap cards with images, UTC Polish dates and manual last update (TDD)**
   - RED: `edcb726` (test)
   - GREEN: `4c7fdfc` (feat)
   - REFACTOR: `25bf290` (refactor: static import of formatPlDate in the tests)

The tracer feedback gate re-ran Task 1's `<verify>` end to end (end-of-phase mode, automated-only verify) and it passed before Task 2 started.

## TDD Gate Compliance

- **RED** (`edcb726`): `node --test --test-reporter=tap test/pages.test.js` exited 1 with 10 of 40 tests failing. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` for the target "(unit) formatPlDate formats ISO dates as Polish long dates". Semantic assessment: every failure was an assertion on planned behaviour: "lib/dates.js does not export formatPlDate", "operations.recaps is not an array", "0 recap cards, expected 3–5" and "no p.recaps-updated". The TZ child-process test failed on its "the child process did not run west of UTC" assertion, because the child could not import the missing module. There were no load, syntax or fixture failures. lib/dates.js was loaded through a guarded dynamic import, so the missing module showed up as an assertion failure and not as a module-link error.
- **GREEN** (`4c7fdfc`): 40/40 pages tests and the full suite (374) pass.
- **REFACTOR** (`25bf290`): I replaced the guarded loader with a static import. Tests still pass (374/374).

## Files Created/Modified

- `src/_data/operations.js` - single source for /operacje/ (D-13), including the drafted evening, lastUpdate and recaps
- `src/operacje.njk` - the page template (front matter breadcrumb, todo FACTS-06)
- `lib/dates.js` - formatPlDate
- `lib/images.js` - imports operations.js, encodes recap thumbs, returns `images.recaps`, adds them to `all`/`files`
- `eleventy.config.js` - `plDate` filter
- `FACTS.md` - FACTS-06..13
- `test/pages.test.js` - operations page, recap and formatPlDate tests (root and prefix builds)
- `test/seo.test.js` - exact sitemap lists now include /operacje/
- `.planning/phases/03-performance-assets/03-REVIEW-DISPOSITION.md` - IN-05 fixed (04-04)

## Decisions Made

See key-decisions in the frontmatter. No CSS was added. The new classes (`.schedule-list`, `.type-list`, `.era-list`, `.evening-timeline`, `.evening-time`, `.upcoming`, `.recaps-updated`, `.recap-list`, `.recap-card`, `.recap-body`, `.recap-meta`) are styled in 04-06. The CSS bundle stays at 4003 B gz.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Content correctness] The sniper recap is modern, not Cold War**
- **Found during:** Task 2
- **Issue:** The plan asked for FACTS-12 as "a Cold War PvE reconnaissance/sniper op" using `sniper.jpg`. The image shows a modern multicam sniper with a modern scoped rifle. A Cold War caption on that picture would look wrong to a first-time visitor.
- **Fix:** The setting is "Współczesność · Takistan" (type PvE). The recaps still mix eras (Wietnam 1967 and modern settings) and all three mission types. No recap uses Cold War, which still appears in the era list.
- **Files modified:** src/_data/operations.js, FACTS.md
- **Verification:** The recap data and build tests pass (the type is a missionTypes name and the image is a committed original)
- **Committed in:** 4c7fdfc

**2. [Rule 3 - Blocking] Test helper for blocks with a nested div**
- **Found during:** Task 1
- **Issue:** The existing `pageBlock` helper matches up to the first `</div>`. `#najblizsze-misje` nests `div.upcoming`.
- **Fix:** Added `operationsBlock(html, id)`, which slices to the next `.page-block` or `</section>`.
- **Files modified:** test/pages.test.js
- **Committed in:** dbdbf2e

---

**Total deviations:** 2 auto-fixed (1 content correctness, 1 blocking)
**Impact on plan:** No scope change. Every acceptance criterion passes.

## Issues Encountered

- `lib/images.js` was CRLF in the working tree but LF in the index. I saved it with LF, so the commit diff contains only the planned lines.
- `patrol.jpg` (with an ARMA watermark) and `sniper.jpg` look like promotional renders, not clan screenshots. The FACTS-11 and FACTS-12 rows ask the user to confirm the images as well as the texts.

## Verification

- `npm test`: 374/374 pass. This includes the seo-gate test showing that the indexable build fails only on G10 for open FACTS rows.
- `SITE_URL=https://guard.example npm run build`: check-seo OK, check-perf OK (P6/P7/P8 hold for the recap images). The sitemap has `<loc>https://guard.example/operacje/</loc>`, and the output contains a BreadcrumbList, `class="recap-card hud-border"` and `TODO(FACTS-10)`.
- `/IBC-Website/` build: check-seo OK, check-perf OK. The output contains `"item":"https://inglourious-basterds-clan.github.io/IBC-Website/operacje/"`.
- This plan's diff has nothing under `src/css/`, `test/css.test.js` or `lib/check-perf.js`.

## Known Stubs

None. The drafted texts and recaps are intentional, marked and registered (FACTS-06..13). G10 blocks the indexable build until the clan confirms or replaces them.

## User Setup Required

None. Before the cutover, replace or confirm the four recaps, the evening times, the OCAP text and the last-update date in `src/_data/operations.js` (FACTS.md).

## Next Phase Readiness

- 04-05 can check `/operacje/` with G11 (same breadcrumb markup contract).
- 04-06 styles the operations classes listed above. The visual check (recaps newest first, lazy images, layout at 1280 and 390 px) is its human-check.
- 04-07 can link Operacje in the nav. "19:00" is on /operacje/.

## Self-Check: PASSED

- Created files exist: src/_data/operations.js, src/operacje.njk, lib/dates.js
- Commits dbdbf2e, edcb726, 4c7fdfc and 25bf290 are ancestors of HEAD

---
*Phase: 04-join-operations-pages*
*Completed: 2026-10-13*
