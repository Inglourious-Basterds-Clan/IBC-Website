---
phase: 03-performance-assets
plan: 10
subsystem: ui
tags: [css, lightningcss, partials, dead-css, import, parity, d-12, d-13, d-15]

requires:
  - phase: 03-08
    provides: "lib/css.js Lightning CSS bundle (follows local @import in order), style.11ty.js, test/css.test.js bundle checks"
  - phase: 03-09
    provides: "Script-added classes (is-open, tag-error, terminal-line-alert, active, open, active-nav, terminal-line, time, tag, message) all written in src/js/modules/*.js"
provides:
  - "src/css/style.css: header comment plus 10 @import \"./partials/<name>.css\" lines in cascade order"
  - "src/css/partials/{fonts,base,components,header,hero,sections,gallery,recruitment,footer,responsive}.css, each a contiguous run of the original section headers"
  - "Dead CSS removed (D-13): roster, calendar (incl. Event Tooltip HUD and @keyframes fadeIn), status panel and countdown (incl. @keyframes blink), form styles, .hud-badge.green/.danger, the 480px .timer rule"
  - "test/css.test.js: dead-CSS, every-class-used, negative-control and entry-only-imports checks (selectorClasses/unusedClasses helpers)"
affects: [03-11 perf gate budgets and parity checklist, Phase 4 pages (new CSS goes into the partial named after its section), Phase 5 visual refresh]

actuals:
  tokens: 16900
  tasks: 3
  commits: 4
plan_head_before: 0d93f8a4d9f02d372d84eecbb4f9b098c439b056
plan_head_after: 0273b64b989510fbb624497884695b37c32acff9

tech-stack:
  added: []
  patterns:
    - "CSS partial split: slice at the /* --- NAME --- */ header lines with a throwaway script, then prove with cmp that the minified bundle is byte-identical"
    - "Every-class-used guard: class names from bundle selector preludes (url() stripped, at-rules skipped) must occur as a whole word ((?<![\\w-])name(?![\\w-])) in a .njk/.js under src/ or a .js under lib/"

key-files:
  created: [src/css/partials/fonts.css, src/css/partials/base.css, src/css/partials/components.css, src/css/partials/header.css, src/css/partials/hero.css, src/css/partials/sections.css, src/css/partials/gallery.css, src/css/partials/recruitment.css, src/css/partials/footer.css, src/css/partials/responsive.css]
  modified: [src/css/style.css, test/css.test.js]

key-decisions:
  - "The class collector scans only rule preludes (text before each { back to the previous }, { or ;) of the minified bundle, so declaration values like .5s or the font url() never count as classes"
  - "Whole-word match uses (?<![\\w-])name(?![\\w-]) rather than \\b, so a class is not counted as used just because a longer hyphenated class contains it (hud-btn vs hud-btn-group)"
  - "@keyframes blink and fadeIn were deleted with their blocks: each was referenced only by a dead rule (.status-dot, .calendar-hud-info.active)"
  - "The entry-only-imports test also pins the exact 10-name cascade order, not only that responsive.css is last"

patterns-established:
  - "New CSS goes into the partial named after the section it styles; a new partial needs an @import in src/css/style.css at its cascade position (css.test.js fails on an unimported or doubly imported partial)"
  - "A class selector ships only if markup or a script writes that class (css.test.js every-class-used check)"

requirements-completed: [PERF-06]

coverage:
  - id: D1
    description: "The entry imports its first partial and the Lightning CSS bundle is byte-identical across the cut (tracer)"
    requirement: PERF-06
    verification:
      - kind: other
        ref: "SITE_URL=https://guard.example npm run build && cmp _test/css-split/reference-1.css _site/css/style.css (identical, 23,454 B)"
        status: pass
      - kind: integration
        ref: "test/links.test.js (font url() resolves from css/style.css)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No roster, calendar, status-panel, countdown, timer, form-control or member- selector ships"
    requirement: PERF-06
    verification:
      - kind: integration
        ref: "test/css.test.js#no dead roster, calendar, status, countdown or form CSS ships (D-13)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every class selector in the bundle occurs as a whole word in a .njk or .js under src/ or a .js under lib/, and the check reports an invented class"
    requirement: PERF-06
    verification:
      - kind: integration
        ref: "test/css.test.js#every class selector in the bundle is used by a template or script (D-13)"
        status: pass
      - kind: integration
        ref: "test/css.test.js#the every-class-used check reports an invented class (negative control)"
        status: pass
    human_judgment: false
  - id: D4
    description: "src/css/style.css holds only comments and 10 partial @imports in cascade order; every partial exists and is imported once; the bundle is byte-identical across the split"
    requirement: PERF-06
    verification:
      - kind: integration
        ref: "test/css.test.js#the entry only imports partials (D-12)"
        status: pass
      - kind: other
        ref: "SITE_URL=https://guard.example npm run build && cmp _test/css-split/reference-2.css _site/css/style.css (identical, 16,957 B); /IBC-Website/ build also identical"
        status: pass
    human_judgment: false
  - id: D5
    description: "Deleting the dead CSS changed no live computed style (D-15 parity)"
    requirement: PERF-06
    verification:
      - kind: automated_ui
        ref: "scratchpad parity.mjs (headless Chrome CDP, frozen Date): every element + ::before/::after computed style and bounding box, index/404 x load/lightbox/easter-egg/menu/hover-gallery/recruitment-scrolled at 1440x900 and 390x844, 1,610,778 values, 0 differences; negative control (one appended rule) 17 differences per home-page state"
        status: pass
    human_judgment: true
    rationale: "The computed-style probe is not a committed test and compares against the pre-plan build, not the Phase 1 baseline PNGs; the plan's Task 3 human-check (served build at 1440 and 390 px vs root-desktop-top.png and root-mobile-recruitment.png) is collected at the end of the phase (03-11)"

duration: 22min
completed: 2026-10-11
status: complete
---

# Phase 3 Plan 10: CSS Partials and Dead-CSS Removal Summary

**`src/css/style.css` is now an import-only entry for 10 partials in the original cascade order, and the split leaves the Lightning CSS bundle byte-identical. The roster, calendar, status-panel, countdown and form CSS is gone: the bundle dropped from 23,454 B to 16,957 B (5,044 to 3,927 B gzip). Headless Chrome shows no change in any live computed style, and three new tests stop dead or unused selectors from coming back.**

## Performance

- **Duration:** about 22 min
- **Started:** 2026-10-11T09:41:58Z
- **Completed:** 2026-10-11T10:03:40Z
- **Tasks:** 3 (4 commits: 1 tracer, 1 TDD RED/GREEN pair, 1 auto)
- **Files modified:** 12 (10 created, 2 modified)

## Accomplishments

- **Tracer (Task 1):** `fonts.css` holds the FONTS section verbatim, with both `@font-face` rules and the `url()` written relative to the output `css/style.css`. The entry starts with a header comment and `@import "./partials/fonts.css";`. `cmp` against the pre-cut bundle: identical.
- **Dead CSS (Task 2), deleted from the stylesheet:**
  - the ROSTER and CALENDAR sections, including the Event Tooltip HUD and `@keyframes fadeIn`
  - the Status Panel and Countdown blocks inside HERO, including `@keyframes blink`
  - the Form Styles block inside RECRUITMENT
  - `.hud-badge.green` and `.hud-badge.danger`
  - the 480px `.timer` rule

  The diff is pure deletions (447 lines). `:root` custom properties are untouched.
- **Split (Task 3):** the remaining sections were sliced at their header lines into base, components, header, hero, sections, gallery, recruitment, footer and responsive. After the Task 2 deletion, FOOTER and EASTER EGG are adjacent, so `footer.css` is one contiguous run. The non-blank lines of the partials, joined in order, are identical to the pre-split stylesheet. `cmp` against the pre-split bundle: identical, and the `/IBC-Website/` build ships the same bytes.
- **Parity proof for the deletion:** a headless Chrome CDP probe compared the computed style (every property) of every element and its `::before`/`::after`, plus each bounding box, before and after.
  - Pages and states: home and 404 on load; lightbox open; easter egg open; mobile menu open; gallery hover; recruitment scrolled into view with the terminal booted.
  - Viewports: 1440×900 and 390×844.
  - Result: 1,610,778 values, 0 differences.
  - Negative control: one appended live rule produces 17 differences in each home-page state, so the probe does catch changes.
- **Tests and gates:**
  - `npm test`: 281/281 (277 before).
  - `SITE_URL=https://guard.example npm run build` passes check-seo.
  - The `/IBC-Website/` production build passes check-seo and check-perf (css 3,932 B gz against the 6,144 B cap). `_site` is left holding that prefixed build, as it was before.

## Task Commits

1. **Task 1 (tracer): entry imports fonts.css, bundle byte-identical.** `1c90f60` (feat). Tracer feedback gate: `human_verify_mode` is end-of-phase and the verify is automated only, so the verify was re-run after the commit. It passed again: `npm test` 277/277, guard build, `cmp` identical, import line present. The tracer was verified end to end, then work moved to Task 2.
2. **Task 2 RED:** `67148b2` (test). Dead-CSS, every-class-used and negative-control tests.
3. **Task 2 GREEN:** `bf80700` (feat). Dead CSS deleted.
4. **Task 3: nine more partials, import-only entry, entry-only-imports test.** `0273b64` (feat).

**Plan metadata:** in the docs(03-10) commit that adds this SUMMARY.

## TDD Gate Compliance

- **RED (`67148b2`):** command `node --test --test-reporter=tap test/css.test.js`, exit 1. The classifier returned `RED_EVIDENCE_OK` (`target_test_failed`) for the target "no dead roster, calendar, status, countdown or form CSS ships (D-13)".
  - Semantic assessment: the target ran and failed on its planned `deepEqual(dead, [])` assertion. It listed 27 dead classes (calendar*, countdown-box, form-control, member-*, roster*, status-panel, timer*), so this was not a load or syntax fault.
  - "every class selector … is used" also failed on its planned assertion, listing 44 unused classes, including green, danger, op, today, training, val and the status-* and form-* classes.
  - The negative control passed in RED, as intended: it checks the helper, not the stylesheet.
  - The five 03-08 tests passed (regression guards).
- **GREEN (`bf80700`):** css + links tests 18/18, `npm test` 280/280.
- **REFACTOR:** none needed.
- The RED record was written under `_test/` (gitignored) for the classifier, then moved to the session scratchpad.

## Files Created/Modified

- `src/css/style.css`: the entry, a header comment plus 10 `@import` lines.
- `src/css/partials/fonts.css`: FONTS (`@font-face` Montserrat and the metric-matched fallback).
- `src/css/partials/base.css`: CUSTOM VARIABLES, BASE STYLES, TACTICAL SCREEN OVERLAYS, TYPOGRAPHY.
- `src/css/partials/components.css`: REUSABLE HUD COMPONENTS.
- `src/css/partials/header.css`: HEADER / NAVIGATION, SKIP LINK & HEADER CTA.
- `src/css/partials/hero.css`: HERO SECTION.
- `src/css/partials/sections.css`: SECTION GENERAL STYLES, ABOUT US (O NAS).
- `src/css/partials/gallery.css`: GALLERY SECTION with the Lightbox Modal block.
- `src/css/partials/recruitment.css`: RECRUITMENT SECTION.
- `src/css/partials/footer.css`: FOOTER, EASTER EGG DECRYPTION CONSOLE with the Custom Scrollbar block.
- `src/css/partials/responsive.css`: RESPONSIVE MEDIA QUERIES (992, 768 and 480 px).
- `test/css.test.js`: the `selectorClasses`/`unusedClasses`/`classSources` helpers, three D-13 tests and the D-12 entry-only-imports test.

## Decisions Made

See key-decisions in the frontmatter:
- the class collector reads rule preludes only
- whole-word matching does not treat a hyphen as a word boundary
- the `blink` and `fadeIn` keyframes went with the blocks that alone used them
- the entry test pins the exact cascade order

## Deviations from Plan

None in what was built: the plan was executed as written.

### Contract note

UI-SPEC "Stylesheet structure" asks for byte-identical cuts and then the dead-CSS deletion. The plan instead cuts fonts first (Task 1), deletes the dead CSS (Task 2) and then cuts the rest (Task 3). Both cuts were checked with `cmp` and are byte-identical. The deletion, which is the only step that changes bytes, was checked for no live computed-style change with the CDP probe (D5). The UI-SPEC's guarantees hold under the plan's order.

**Total deviations:** 0. **Impact:** none.

## Issues Encountered

- The first parity run printed nothing for over 5 minutes because its output was piped through `tail`, so it was stopped. The rerun added progress logging and a 60 s CDP timeout, and captured pseudo-elements only when `content` is not `none`.
- That rerun showed 112 differences, all in the terminal's `SPAN.time` boxes. The boot lines print the wall-clock `HH:MM:SS`, and Montserrat's proportional digits change the span width from one capture to the next. With `Date` frozen through `Page.addScriptToEvaluateOnNewDocument`, the comparison is exact: 0 differences, now with boxes compared in every state. This was capture timing, not CSS.
- The first attempt to rebuild the `/IBC-Website/` build from Git Bash failed: `PATH_PREFIX` was rewritten to `C:/Program Files/Git/IBC-Website/`. The README's documented fix, `MSYS_NO_PATHCONV=1`, worked. No code was at fault.
- Git warns that LF will become CRLF on the touched files. This is the repo's autocrlf behaviour. The partials are written with CRLF to match `style.css`.

## Known Stubs

None.

## Threat Flags

None. T-03-16 is mitigated: the entry-only-imports test fails on any non-comment line that is not `@import "./partials/<name>.css";`, on a missing or doubly imported partial, and on a wrong order. A stray rule appended to the entry was checked to fail it. Lightning CSS bundles local files only. T-03-SC: no packages were installed. No new network, auth or file-access surface was added.

## User Setup Required

None.

## Next Phase Readiness

- 03-11 can set the CSS budget from measured sizes: 16,957 B raw, 3,932 B gz from check-perf, against the current 6,144 B cap.
- Still open for the 03-11 human check (D5): the Task 3 spot-check of a served build at 1440 and 390 px against `root-desktop-top.png` and `root-mobile-recruitment.png`.
- PERF-06 is declared by a sibling plan that is still incomplete, so `requirements.ready-ids` held it back (0/1 ready). It will be marked when the last declaring plan finishes.

## Self-Check: PASSED

- FOUND: src/css/style.css, all 10 partials, test/css.test.js
- FOUND commits: 1c90f60, 67148b2, bf80700, 0273b64. All are ancestors of HEAD; `git rev-list --count 0d93f8a..HEAD` = 4.
- Acceptance, Task 1:
  - `@font-face` in fonts.css: 2; in style.css: 0
  - `cmp` reference-1: identical
  - `npm test`: exit 0
- Acceptance, Task 2:
  - `ROSTER SECTION|CALENDAR SECTION` in style.css: 0
  - `node --test test/css.test.js`: exit 0
  - `npm test`: 280/280
- Acceptance, Task 3:
  - partials: 10
  - `^@import "./partials/` lines: 10
  - `cmp` reference-2: identical
  - `node --test test/css.test.js`: exit 0 (19/19 with links)
  - `npm test`: 281/281
- Plan verification:
  - `npm test` green
  - guard and prefixed production builds pass check-seo
  - two `cmp` runs identical
  - css.test.js proves no dead or unused class selector ships

---
*Phase: 03-performance-assets*
*Completed: 2026-10-11*
