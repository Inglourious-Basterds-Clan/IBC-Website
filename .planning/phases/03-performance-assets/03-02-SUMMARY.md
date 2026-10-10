---
phase: 03-performance-assets
plan: 02
subsystem: assets
tags: [fonts, woff2, montserrat, fonttools, brotli, cmap, polish-glyphs, node-test]

requires:
  - phase: 02-seo-foundation
    provides: test/helpers.js repoRoot, lib/image-size.js header-parser house style
provides:
  - "src/fonts/montserrat-latin-ext.var.woff2: one variable Montserrat (wght 100-900) subset to Latin + Latin Ext-A + punctuation, 36,460 B"
  - "src/fonts/OFL.txt: upstream SIL OFL 1.1 text, byte-identical to google/fonts at the pinned commit"
  - "lib/woff2.js: Node-only WOFF2 table directory + cmap (format 4/12) reader exporting woff2CodePoints and woff2TableTags"
  - "test/fonts.test.js: Polish coverage, ASCII-only negative control, empty/non-WOFF2 rejection, variable axis + size, licence checks"
  - "test/fixtures/montserrat-ascii.var.woff2: ASCII-only control subset"
  - "tools/fonts/README.md: provenance (commit sha, URLs, sha256s), tool versions and the exact reproducible subset commands"
affects: [03-05 font wiring (CSS @font-face, preload, Google Fonts removal, build-output font checks), 03-11 perf gate fontMaxBytes/fontFilesMax]

actuals:
  tokens: 4835
  tasks: 2
  commits: 1
plan_head_before: e2e5a9884c51e83f7baaace2c77867063b0312d1
plan_head_after: d07da8b1a7847a052b9f9179f60374673135c6f6

tech-stack:
  added: []
  patterns:
    - "Binary asset produced once by an external tool in a throwaway venv outside the repo, committed with a provenance README (no runtime or npm dependency)"
    - "Header/table parser with Node built-ins only that throws on truncation instead of returning partial data"
    - "Negative-control fixture committed beside the positive asset so the coverage test can fail"

key-files:
  created: [src/fonts/montserrat-latin-ext.var.woff2, src/fonts/OFL.txt, lib/woff2.js, test/fonts.test.js, test/fixtures/montserrat-ascii.var.woff2, tools/fonts/README.md]
  modified: []

key-decisions:
  - "Upstream pinned to google/fonts commit 8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5 (TTF sha256 0f7b311b...82f7); the fontTools subset is deterministic, so the README recipe reproduces the committed sha256 exactly"
  - "fontTools 4.66.1 and Brotli 1.2.0 were installed only into a scratchpad venv outside the repo after explicit human approval; package.json and package-lock.json untouched"
  - "woff2CodePoints throws on any read past the decompressed data or directory (and on a missing cmap) rather than returning a partial Set"

patterns-established:
  - "tools/<name>/README.md records upstream source, hashes, tool versions and exact commands for every committed generated artefact"

requirements-completed: [PERF-04]

coverage:
  - id: D1
    description: "Committed variable Montserrat woff2 covers all 18 Polish letters (D-10)"
    requirement: PERF-04
    verification:
      - kind: unit
        ref: "test/fonts.test.js#the committed font covers every Polish letter (D-10)"
        status: pass
    human_judgment: false
  - id: D2
    description: "ASCII-only control subset lacks every Polish letter, so the coverage check can fail (negative control)"
    requirement: PERF-04
    verification:
      - kind: unit
        ref: "test/fonts.test.js#the ASCII-only control lacks the Polish letters (negative control)"
        status: pass
    human_judgment: false
  - id: D3
    description: "woff2CodePoints rejects empty and non-WOFF2 buffers with 'not a WOFF2 file'"
    requirement: PERF-04
    verification:
      - kind: unit
        ref: "test/fonts.test.js#woff2CodePoints rejects empty and non-WOFF2 input (PERF-04 empty edge)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Font is one variable woff2 (cmap, fvar, gvar present) at most 46,080 bytes (D-08)"
    requirement: PERF-04
    verification:
      - kind: unit
        ref: "test/fonts.test.js#the font is one variable Montserrat woff2 (D-08)"
        status: pass
    human_judgment: false
  - id: D5
    description: "OFL licence ships next to the font (D-09)"
    requirement: PERF-04
    verification:
      - kind: unit
        ref: "test/fonts.test.js#the OFL licence sits next to the font (D-09)"
        status: pass
    human_judgment: false
  - id: D6
    description: "fonttools/Brotli legitimacy approved by a human before install; tools kept out of the repo and out of project dependencies"
    requirement: PERF-04
    verification:
      - kind: manual_procedural
        ref: "Task 1 checkpoint: user replied 'approved fonttools and brotli'; git status --porcelain package.json package-lock.json empty"
        status: pass
    human_judgment: true
    rationale: "Package legitimacy is a human judgment (blocking-human gate); already given in this session"

duration: 3min
completed: 2026-10-10
status: complete
---

# Phase 3 Plan 02: Self-hosted Polish-capable Montserrat font Summary

**One 36,460-byte variable Montserrat woff2 (wght 100-900, Latin + Latin Ext-A) subset with fontTools 4.66.1 from a pinned google/fonts commit, shipped with its OFL licence and proven to cover all 18 Polish letters by a Node-only cmap reader with an ASCII-only negative control.**

## Performance

- **Duration:** 3 min (continuation agent, Task 2 only; Task 1 checkpoint ran in the previous executor)
- **Started:** 2026-10-10T18:58:37Z
- **Completed:** 2026-10-10T19:01:28Z
- **Tasks:** 2 (1 checkpoint + 1 tracer)
- **Files modified:** 6 (all new)

## Accomplishments
- Committed `src/fonts/montserrat-latin-ext.var.woff2` (36,460 B, 354 mapped code points, tables cmap/fvar/gvar/avar/HVAR/MVAR/STAT kept, wght axis 100-900) and the byte-identical upstream `src/fonts/OFL.txt`
- `lib/woff2.js` reads the WOFF2 table directory and the cmap (format 4 with idRangeOffset, format 12) via `node:zlib` only; its code-point count (354) matches fontTools' own `getBestCmap()`, and it throws on truncated input
- `test/fonts.test.js`: 5 passing tests, including a negative control (ASCII fixture, 95 code points, none Polish); full suite 179/179 green
- `tools/fonts/README.md` (Polish) records commit sha, URLs, sha256 of source and both outputs, tool versions and both exact subset commands; re-running the subset reproduced the same sha256

## Task Commits

1. **Task 1: Package-legitimacy check for fonttools 4.66.1 and Brotli 1.2.0** - no commit (verification-only checkpoint, `gate="blocking-human"`). Prior executor ran read-only PyPI JSON queries: fonttools 4.66.1 -> github.com/fonttools/fonttools (maintainer Behdad Esfahbod); Brotli 1.2.0 -> github.com/google/brotli. Plan `<verify>` passed. **Outcome: approved by the user** ("approved fonttools and brotli"). Nothing was installed before approval.
2. **Task 2: Tracer: Polish-capable variable Montserrat woff2 to a passing cmap test** - `d07da8b` (feat)

Tracer feedback gate: `human_verify_mode` end-of-phase with an automated-only `<verify>`; re-ran `node --test test/fonts.test.js` + `git ls-files --error-unmatch` after the commit, passed. No expansion tasks follow.

## Files Created/Modified
- `src/fonts/montserrat-latin-ext.var.woff2` - the site font (03-05 wires it into CSS and head)
- `src/fonts/OFL.txt` - SIL OFL 1.1 licence, upstream bytes
- `lib/woff2.js` - WOFF2 directory + cmap reader (`woff2CodePoints`, `woff2TableTags`)
- `test/fonts.test.js` - PERF-04 / D-10 font checks
- `test/fixtures/montserrat-ascii.var.woff2` - ASCII-only negative-control font (19,884 B)
- `tools/fonts/README.md` - provenance and reproducible recipe

## Decisions Made
- Pinned upstream to google/fonts `8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5` (newest commit touching `ofl/montserrat` on 2026-10-10).
- Venv lived in the session scratchpad (`.../scratchpad/fontvenv`), never inside the repo; no requirements file written.
- Reader hardening beyond the plan's minimum: rejects non-minimal UIntBase128, unknown known-tag indices, a missing cmap, and format 12 groups with end < start or beyond U+10FFFF (all throw).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `core.autocrlf=true` warns that `src/fonts/OFL.txt` will be checked out with CRLF on Windows. The committed blob is byte-identical to upstream (sha256 `8b7141c0...802e` verified on `HEAD:src/fonts/OFL.txt`), and the woff2 files are detected as binary, so no change was needed. If 03-05 ever compares the shipped OFL bytes, compare the blob, not a Windows working copy.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 03-05 can add the `@font-face` (url `../fonts/montserrat-latin-ext.var.woff2`, matching unicode-range), the crossorigin font preload, passthrough-copy `src/fonts/` (the licence travels with it), remove Google Fonts, and extend `test/fonts.test.js` with build-output checks.
- 03-11 can use 36,460 B as the measured font size against `fontMaxBytes` (45 KB).

## Self-Check: PASSED
- FOUND: src/fonts/montserrat-latin-ext.var.woff2, src/fonts/OFL.txt, lib/woff2.js, test/fonts.test.js, test/fixtures/montserrat-ascii.var.woff2, tools/fonts/README.md
- FOUND: commit d07da8b on HEAD
- Acceptance: 5/5 tests pass; export greps print 1 and 1; `wOF2` header; README mentions the file (3) and 4.66.1 (2); package.json/package-lock.json unchanged
- Plan verification: human approval recorded; `node --test test/fonts.test.js` green incl. negative control; root manifests unchanged
