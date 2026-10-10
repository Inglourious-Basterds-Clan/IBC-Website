---
phase: 03-performance-assets
plan: 03
subsystem: testing
tags: [perf-gate, budget, node-zlib, node-test, fixtures, post-build-gate]

# Dependency graph
requires:
  - phase: 02-technical-seo
    provides: check-seo gate pattern (lib rules + always-run CLI, reporter/sort, CR-02 reject-and-move)
provides:
  - lib/check-perf.js with rules P0-P11, frozen BUDGET, sourceImageDir, checkPerf(outDir, site, options), measurePerf(outDir, site)
  - scripts/check-perf.js CLI (--dir, check-perf: prefix, reject-and-move on problems and on a crash, measured-size line)
  - lib/reject-output.js shared removeRejectedOutput(outDir, repoRoot) / repoRelative(path, repoRoot) used by both gates
  - test/perf-gate.test.js with cleanSite(prefix) fixture and one named negative test per rule
affects: [03-04, 03-05, 03-06, 03-08, 03-09, 03-11, phase-04, phase-05]

actuals:
  tokens: 13881
  tasks: 2
  commits: 3
plan_head_before: 113c27015f0f0e81d5dae16b3e76530dfab88d9b
plan_head_after: 31d53be78829485ae9bfc6abd2cec75d31e29920

tech-stack:
  added: []
  patterns:
    - "Perf gate rule pattern: one small function per rule calling report(rule, text), sorted '<relPath>: P<n> <text>' output"
    - "resolveLocal: every HTML URL resolved inside the build folder only; escaping URLs reported, never read"
    - "One run context: every file read, sized and gzipped at most once (memoized maps)"
    - "Tag scanning on HTML with comments and script/style contents blanked, quoted attribute values consumed whole"

key-files:
  created:
    - lib/check-perf.js
    - lib/reject-output.js
    - scripts/check-perf.js
    - test/perf-gate.test.js
  modified:
    - scripts/check-seo.js

key-decisions:
  - "options.budget is merged over BUDGET, so a test or later phase can override one cap without restating the rest"
  - "A URL without the path prefix, with ../ (also percent-encoded) or that fails to decode resolves to { escapes: true } and is reported as 'points outside the build output'"
  - "P10 skips external script src values (P3 polices the CDN hosts); escaping or missing local scripts are problems"
  - "P3 also scans .mjs and .svg on top of the plan's text extensions (an SVG or ES module can @import a font CDN too)"
  - "CLI runs measurePerf only after a clean checkPerf, inside the same try/catch, so a crash in either rejects the output"

patterns-established:
  - "check-perf mirrors check-seo: rules in lib/, always-run CLI in scripts/, shared reject helper in lib/reject-output.js"
  - "All page-weight caps live in the one frozen BUDGET object (D-17); rules read only budget.<key>"

requirements-completed: [PERF-01, PERF-02, PERF-03, PERF-04, PERF-05, PERF-06, PERF-07]

coverage:
  - id: D1
    description: "Shared reject-and-move helper; check-seo behaves exactly as before"
    requirement: PERF-01
    verification:
      - kind: unit
        ref: "test/seo-gate.test.js (unchanged, git diff --quiet) via node --test test/seo-gate.test.js"
        status: pass
    human_judgment: false
  - id: D2
    description: "check-perf CLI rejects broken output (moved to <dir>.rejected, twice), rejects on a crash, exits 1 on a missing/non-folder --dir, prints OK plus measured sizes"
    requirement: PERF-01
    verification:
      - kind: integration
        ref: "test/perf-gate.test.js#CLI moves a rejected build aside so no deployable index.html is left"
        status: pass
      - kind: integration
        ref: "test/perf-gate.test.js#CLI rejects the output when the rules crash"
        status: pass
      - kind: integration
        ref: "test/perf-gate.test.js#CLI exits 0 with OK and the measured sizes on a clean fixture"
        status: pass
    human_judgment: false
  - id: D3
    description: "Rules P1-P11 each fail on their own broken fixture and pass on the clean (and prefixed) fixture"
    requirement: PERF-02
    verification:
      - kind: unit
        ref: "test/perf-gate.test.js (P1..P11 named tests, 49 tests total)"
        status: pass
    human_judgment: false
  - id: D4
    description: "One frozen BUDGET object; a custom budget flips the verdict; measurePerf matches node:zlib sizes"
    requirement: PERF-03
    verification:
      - kind: unit
        ref: "test/perf-gate.test.js#a custom budget flips a passing fixture to failing (D-17)"
        status: pass
      - kind: unit
        ref: "test/perf-gate.test.js#measurePerf on the clean fixture returns the sizes node:zlib gives"
        status: pass
    human_judgment: false
  - id: D5
    description: "URLs escaping the build folder are reported and never read (T-03-08)"
    requirement: PERF-01
    verification:
      - kind: unit
        ref: "test/perf-gate.test.js#a URL climbing out of the build folder is reported and never read (T-03-08)"
        status: pass
    human_judgment: false
  - id: D6
    description: "BUDGET cap values are sensible starting points until 03-11 resets them from measured sizes"
    verification: []
    human_judgment: true
    rationale: "The cap numbers are a judgment call (plan prohibition verification: judgment); 03-11 sets the final values"

duration: 9min
completed: 2026-10-10
status: complete
---

# Phase 3 Plan 03: Performance Gate Summary

**Post-build perf gate `scripts/check-perf.js` + `lib/check-perf.js`: rules P0-P11 cover the hero picture and mobile bytes, lightbox targets, third-party font/icon hosts, inline styles, one stylesheet, img dimensions and lazy loading, shipped originals, CSS/JS gzip and woff2 fonts. All caps sit in one frozen BUDGET object, and the CLI rejects output through a reject helper now shared with check-seo.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-10-10T19:03:45Z
- **Completed:** 2026-10-10T19:12:45Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- `lib/reject-output.js`: `removeRejectedOutput`/`repoRelative` moved out of `scripts/check-seo.js` unchanged in wording, so both gates use one disposition (T-03-07); `test/seo-gate.test.js` still passes and was not touched
- `lib/check-perf.js`: rules P0-P11, `BUDGET` (frozen, a comment per key naming its source), `sourceImageDir`, `checkPerf(outDir, site, { budget, sourceImageNames })`, `measurePerf(outDir, site)`. Every file is read, sized and gzipped at most once per run
- `resolveLocal` keeps every followed URL inside the build folder: unprefixed, `../` and `%2e%2e/` URLs are reported as "points outside the build output" and never read (T-03-08)
- `scripts/check-perf.js`: same messages and `--dir` handling as check-seo. Problems or a crash (T-03-09) make it exit 1 and move the folder to `<dir>.rejected`; on success it prints `check-perf: OK` and a line of measured sizes against their caps
- `test/perf-gate.test.js`: 49 tests. The `cleanSite(prefix)` fixture plus one named negative fixture per rule, a custom budget, the prefixed build, escaping URLs, stable sorting, measurePerf against node:zlib, and CLI reject, crash and missing-folder cases
- On the current real `_site/` the gate reports 29 problems, all of them the Phase 3 work that has not landed yet (Google Fonts/FA CDN, inline styles, two stylesheets, unoptimized originals, `hero.jpg`, eager logo, the lightbox `<img>` without dimensions). This confirms the gate must stay out of `npm run build` until 03-11

## Task Commits

1. **Task 1: Tracer: perf gate CLI end to end, P3, shared reject helper** - `fe031a1` (feat)
2. **Task 2: Every D-16 rule and the D-17 caps (TDD)**
   - RED: `19e3a01` (test), 35 of 49 tests failing on their assertions, positive controls passing
   - GREEN: `31d53be` (feat), 49/49
   - REFACTOR: none needed

## Files Created/Modified
- `lib/check-perf.js` - perf gate rules P0-P11, BUDGET, sourceImageDir, checkPerf, measurePerf
- `lib/reject-output.js` - shared reject-and-move helper for both gate CLIs
- `scripts/check-perf.js` - perf gate CLI (not yet in `npm run build`; 03-11 wires it)
- `scripts/check-seo.js` - imports the reject helper instead of its local copy
- `test/perf-gate.test.js` - fixture and CLI tests

## TDD Gate Compliance

- **RED** (`19e3a01`): `node --test --test-reporter=tap test/perf-gate.test.js` exit 1. The classifier (`gsd-tools check tdd-red-evidence`) returned `RED_EVIDENCE_OK` for the target `P4 inline style attribute fails`. Semantic assessment: the target ran and failed on the planned `assertRule` AssertionError ("expected a P4 problem on 404.html, got: (none)"). There were no load, syntax or fixture faults, and the positive controls (clean fixture, P0, P3, P8 img-variant exemption, prefixed fixture, CLI) passed, so the fixture itself is valid.
- **GREEN** (`31d53be`): 49/49 perf tests, 108/108 with seo-gate, full `npm test` 228/228.
- **REFACTOR:** none needed.

## Decisions Made
- `options.budget` is merged over BUDGET, so a single cap can be overridden. Passing a full budget still works as the plan describes.
- URLs that cannot be resolved inside the build folder (no path prefix, `../`, encoded `../`, undecodable, NUL) all count as escaping. The rule that followed the URL reports them and never reads the target.
- P10 counts only local `<script src>` files plus `js/modules/<hook>.js`. External script hosts are left to P3.
- The CLI runs `measurePerf` only after `checkPerf` comes back clean, inside the same try/catch.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] CLI crash-path test for T-03-09**
- **Found during:** Task 1
- **Issue:** The plan's Task 1 test list had no test proving that a crash rejects the output, even though the must-have truth and the T-03-09 mitigation need test proof
- **Fix:** Added `CLI rejects the output when the rules crash`, which uses a dangling junction/symlink named `broken.html` and is skipped only where links cannot be created (it ran here and was not skipped)
- **Files modified:** test/perf-gate.test.js
- **Committed in:** fe031a1

**2. [Rule 1 - Bug] Task 1 minimal fixture replaced by cleanSite()**
- **Found during:** Task 2 RED
- **Issue:** The Task 1 "clean minimal fixture" (index.html with no hero) correctly fails P1 once Task 2's rules exist, so it could not stay a passing control
- **Fix:** The clean, CLI-OK, reject and crash tests now use the full `cleanSite()` fixture
- **Files modified:** test/perf-gate.test.js
- **Committed in:** 19e3a01

**3. [Rule 2 - Missing critical] P3 also scans .mjs and .svg**
- **Found during:** Task 1
- **Issue:** An ES module or SVG can reference a font CDN (`@import`) and would ship unscanned
- **Fix:** Added `.mjs` and `.svg` to the P3 text extensions (a superset of the plan's list)
- **Files modified:** lib/check-perf.js
- **Committed in:** fe031a1

---

**Total deviations:** 3 auto-fixed (2 missing critical, 1 bug)
**Impact on plan:** Small additions for correctness and test proof. No scope creep, no new dependencies, package.json unchanged.

## Issues Encountered
- Existing sources use CRLF in the working tree (`core.autocrlf=true`), so the scripted edit of `scripts/check-seo.js` normalised line endings before replacing text. The committed content is LF as usual.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The gate is ready for 03-11 to chain after check-seo in `npm run build` and to reset the CSS/JS/font caps from measured sizes. Today the real build's CSS is 6,225 B gzip, already over the provisional 6,144 B cap before 03-08 removes dead CSS.
- Feature plans (03-04 lightbox and logo, 03-05 fonts, 03-06 originals, 03-08 CSS, 03-09 JS) can run `node scripts/check-perf.js --dir <folder>` to see what is left.

---
*Phase: 03-performance-assets*
*Completed: 2026-10-10*

## Self-Check: PASSED

- Files: lib/check-perf.js, lib/reject-output.js, scripts/check-perf.js, test/perf-gate.test.js, 03-03-SUMMARY.md all present
- Commits: fe031a1, 19e3a01, 31d53be are ancestors of HEAD; evaluation-scope resolves 3 plan commits on this branch
- Acceptance criteria (both tasks) re-run: all PASS; plan verification `node --test test/perf-gate.test.js test/seo-gate.test.js` 108/108; package.json unchanged; test/seo-gate.test.js unchanged
