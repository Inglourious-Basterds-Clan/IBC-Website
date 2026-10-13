---
phase: 04-join-operations-pages
plan: 08
subsystem: build/client-js, docs
tags: [eleventy, cache-busting, sha256, dynamic-import, readme, perf-budget]

requires:
  - phase: 04-05
    provides: discord-badge module, membersBackstop, DISCORD_FETCH switch
  - phase: 04-07
    provides: hash-redirect module, data-legacy-hash teaser link, nav to real pages
provides:
  - lib/js.js (jsSourceDir, hashJs, getJsHash, resetJsHash): content hash of src/js
  - jsHash global data; every page loads /js/main.js?v=<jsHash> (prefixed under /IBC-Website/)
  - main.js appends its own ?v= query to each of the 7 literal module specifiers (WR-01)
  - test/js-version.test.js (unit + root/prefix build output + static import shape)
  - Polish README sections for the Phase 4 pages, data files, switches, gates and JS versioning
  - 03-REVIEW WR-01 marked fixed
affects: [phase-05-roster, deploy, perf-budget]

actuals:
  tokens: 7745
  tasks: 2
  commits: 2
plan_head_before: 4916c8e30d2fe524e8919a8e0d879efa9814762b
plan_head_after: 67bc99cae58f5febb0188ef346d241bfadb3b460

tech-stack:
  added: []
  patterns:
    - "Content-hash version on the module entry, propagated to dynamic imports via new URL(import.meta.url).search"

key-files:
  created:
    - lib/js.js
    - test/js-version.test.js
  modified:
    - eleventy.config.js
    - src/_includes/layouts/base.njk
    - src/js/main.js
    - lib/check-perf.js
    - test/build.test.js
    - test/devpages.test.js
    - test/modules.test.js
    - test/perf-gate.test.js
    - test/docs.test.js
    - README.md
    - .planning/phases/03-performance-assets/03-REVIEW-DISPOSITION.md

key-decisions:
  - "WR-01: main.js is versioned with sha256 over every src/js file (sorted relative path + NUL + bytes + NUL, first 10 hex); main.js forwards its own ?v= to every module import, so any JS change renames every JS URL"
  - "BUDGET.initialJsGzipMaxBytes raised 6144 -> 7936 per the plan's rule (measured 6226 B gz on 2026-10-13 after versioned imports, +25 %, rounded up to 256)"
  - "P10 over-cap fixture now derives its noise length from BUDGET (2x cap chars) instead of a fixed 10000, so a cap raise cannot silently make the negative test pass"

patterns-established:
  - "Version propagation: entry script URL query is the single version source; module specifiers stay literal strings + version"

requirements-completed: [CONT-05, CONT-07, CONT-06]

coverage:
  - id: D1
    description: "Every page loads /js/main.js?v=<content hash of src/js>, at the root and under /IBC-Website/"
    requirement: CONT-05
    verification:
      - kind: integration
        ref: "test/js-version.test.js#every page of the root build loads /js/main.js?v=<getJsHash()>"
        status: pass
      - kind: integration
        ref: "test/js-version.test.js#every page of the /IBC-Website/ build loads the prefixed, versioned main.js"
        status: pass
      - kind: unit
        ref: "test/js-version.test.js#hashJs changes when one byte changes"
        status: pass
    human_judgment: false
  - id: D2
    description: "main.js appends its ?v= to all 7 literal module specifiers; hook text still only selects a map key"
    requirement: CONT-07
    verification:
      - kind: unit
        ref: "test/js-version.test.js#every import() in main.js is a literal module path plus the version"
        status: pass
      - kind: unit
        ref: "test/modules.test.js#main.js maps every hook to a literal module import"
        status: pass
    human_judgment: false
  - id: D3
    description: "Perf gate still sizes main.js and every hooked module; home JS 6226 B gz within the reviewed 7936 B cap"
    verification:
      - kind: integration
        ref: "test/perf-gate.test.js#real builds pass the perf gate (D-16)"
        status: pass
      - kind: other
        ref: "npm run build (root and /IBC-Website/) -> check-perf: OK"
        status: pass
    human_judgment: false
  - id: D4
    description: "Polish README documents the Phase 4 pages, data files, recap workflow, FACTS marker forms, DISCORD_FETCH/membersBackstop, legacy hash redirect, G11/G12, CR-01 and JS versioning"
    requirement: CONT-06
    verification:
      - kind: unit
        ref: "test/docs.test.js#(f) README documents the Phase 4 pages, data files and switches"
        status: pass
      - kind: unit
        ref: "test/docs.test.js#(d) README holds no Discord invite"
        status: pass
    human_judgment: true
    rationale: "Polish prose quality and clarity for the clan maintainer needs a human read; tests only pin names and paths"
  - id: D5
    description: "End-of-phase browser walk-through (redirect, nav, breadcrumbs, FAQ keyboard, live badge, FACTS-03..13 confirmation)"
    verification: []
    human_judgment: true
    rationale: "Plan's human-check: real-browser behaviour and clan confirmation of drafted texts (CONT-06) cannot be automated"

duration: 6min
completed: 2026-10-13
status: complete
---

# Phase 4 Plan 08: JS cache-busting (WR-01), Phase 4 README and phase gate Summary

**main.js is now loaded as `/js/main.js?v=<sha256 of src/js, 10 hex>` and forwards that query to every dynamic module import, so a deploy can never mix cached old modules with new HTML. The Polish README now documents everything Phase 4 added, and the full phase gate passes, with only open FACTS drafts blocking the indexable build.**

## Performance

- **Duration:** 6 min (measured from task start)
- **Tasks:** 2/2
- **Files modified:** 13 (2 created)

## Accomplishments

- `lib/js.js` hashes every `.js` under `src/js`: sorted forward-slash relative paths, a NUL, the bytes, then another NUL. The result is memoized per build and reset in `eleventy.before`. `src/js/` is a watch target.
- `base.njk` emits `/js/main.js?v={{ jsHash }}`, and HtmlBasePlugin prefixes it while keeping the query (`/IBC-Website/js/main.js?v=1605d283ff`).
- `main.js` reads `const version = new URL(import.meta.url).search;` and every loader is `import('./modules/<name>.js' + version)`. Specifiers are still literal strings, and hook text still only selects a key.
- `test/js-version.test.js` covers several things. Unit tests check that the hash is 10 lowercase hex characters, stays stable across runs, and changes when a byte changes or a file is added. A test checks that getJsHash matches the hash of src/js. Build-output tests check that every page of the root and prefix builds has exactly one script with the expected versioned src. A static test checks the shape of every import.
- README: there is a new section "Strony: Jak dołączyć i Operacje" (data files, the recap workflow, breadcrumbs, legacy links). The Konfiguracja section now covers membersBackstop and DISCORD_FETCH. The SEO gate section covers G11, G12 and the CR-01 allow-list. The FACTS section covers the third marker form and FACTS-03..13. The JS paragraph covers the hooks and versioning, and the project tree has 10 new entries. `test/docs.test.js (f)` pins all of this.
- WR-01 in `03-REVIEW-DISPOSITION.md` is now `fixed` (Source 04-08).

## Phase gate results

- `npm test`: 430 tests, 430 pass, 0 fail.
- Root preview (`SITE_URL=https://guard.example`): `check-seo: OK, 4 page(s) checked`; `check-perf: OK`. Sizes: `css 4663 B gz (cap 5120), initial js 6226 B gz (cap 7936), font 36460 B (cap 45824), hero mobile max 116260 B (cap 122880), lightbox max 229074 B (cap 307200)`.
- Root production (`SITE_URL=https://inglourious-basterds-clan.github.io`): `check-seo: OK`; `check-perf: OK` with identical sizes to the line above.
- `/IBC-Website/` production (`MSYS_NO_PATHCONV=1 SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/`): `check-seo: OK`; `check-perf: OK` with identical sizes.
- Indexable (`SITE_URL=https://example.org SITE_INDEXABLE=1`): fails as intended with 13 problems. All 13 are `G10 unconfirmed draft marker TODO(FACTS-NN)` lines, one for each FACTS-01..FACTS-13. The output was moved to `_site.rejected/`.

## Task Commits

1. **Task 1 (tracer): content-hashed main.js URL and versioned module imports (WR-01)**: `9090373` (feat)
2. **Task 2: Polish README for Phase 4, WR-01 closed, phase gate**: `67bc99c` (docs)

The tracer feedback gate passed. Its automated `<verify>` ran end to end (targeted tests, `npm test`, the prefixed build, the versioned-script grep and the module files) before Task 2 started.

## Decisions Made

- I followed plan step 7 for the budget. The home JS measured 6226 B gz, which is over the 6144 cap, so `initialJsGzipMaxBytes` became 7936 (6226 × 1.25 = 7782.5, rounded up to a multiple of 256). The comment beside it records the measurement and the date 2026-10-13.
- The `open:` count in the disposition file was already stale at 11, because 04-04 marked IN-05 fixed without decrementing it. It is now 9, which matches the 3 fixed findings out of 12.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] P10 negative fixture no longer exceeded the raised cap**
- **Found during:** Task 1 (after the authorized cap raise)
- **Issue:** `test/perf-gate.test.js` "P10 initial JS gzip over the cap fails" used a fixed `noise(10000)`, about 7.5 KB gz. That is under the new 7936 B cap, so the over-cap test failed.
- **Fix:** The noise length is now `BUDGET.initialJsGzipMaxBytes * 2` characters, about 1.5× the cap after gzip, with a comment. The negative test now follows any future cap change.
- **Files modified:** test/perf-gate.test.js (not listed in files_modified)
- **Commit:** 9090373

**2. [Rule 1 - Data] Stale `open:` count in 03-REVIEW-DISPOSITION.md**
- **Found during:** Task 2
- **Issue:** The count read 11, but 10 findings were open before this plan.
- **Fix:** It is now 9 after WR-01 (see Decisions).
- **Commit:** 67bc99c

**Total deviations:** 2 auto-fixed (1 blocking, 1 data). **Impact:** no scope change.

## Issues Encountered

- After `sed` CR-normalization, `git status` showed several unrelated test files as `M`, but their blob hashes match the index (no content diff). They were not staged.
- The indexable gate run leaves `_site/` absent and the output in `_site.rejected/`, as designed. Rebuild before a local preview.

## Known Stubs

None.

## Deferred human checks (end of phase)

- In a browser, check the redirect from `/#recruitment` to `/jak-dolaczyc/`, including under `/IBC-Website/`, and check Back-button behaviour.
- At 1280px, check the position of the "Pełna instrukcja →" link and check that the breadcrumb lines up with the h1.
- Confirm the recap images patrol.jpg and sniper.jpg (FACTS-11/12).
- Plan 04-08 human-check: check nav, breadcrumbs, FAQ keyboard use, the live Discord badge without layout shift, and the badge fallback with JS off. Then walk FACTS-03..FACTS-13 and confirm each one (CONT-06).
- New for WR-01: after a deploy, open DevTools Network on a returning visit and confirm that `main.js?v=` and the module URLs carry the new hash.

## Next Phase Readiness

This was the last plan of Phase 4, so the phase is complete and ready for verification (`/gsd-verify-work 04`). The indexable cutover is still blocked on purpose until the clan confirms FACTS-01..13.

## Self-Check: PASSED

- FOUND: lib/js.js, test/js-version.test.js, README.md, test/docs.test.js
- FOUND: 9090373, 67bc99c (ancestors of HEAD)
- Acceptance greps: hashJs=1, addGlobalData("jsHash")=1, `main.js?v={{ jsHash }}`=1, `+ version)`=7, `import.meta.url`=1, DISCORD_FETCH>=1, src/_data/operations.js>=1, G12>=1, `| WR-01 | warning | fixed |`=1
