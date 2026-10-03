---
phase: 01-eleventy-foundation
plan: 07
subsystem: infra
tags: [eleventy, site-url, build-guard, node-test, readme, gap-closure]

requires:
  - phase: 01-eleventy-foundation (01-01)
    provides: src/_data/site.js single source, test/helpers.js build harness, build.test.js
  - phase: 01-eleventy-foundation (01-04)
    provides: pages.yml workflow with SITE_URL/PATH_PREFIX job env, workflow.test.js, Polish README
  - phase: 01-eleventy-foundation (01-06)
    provides: links.test.js source audit (localhost:8080 only in site.js)
provides:
  - Production build guard: ELEVENTY_RUN_MODE=build with unset/blank SITE_URL throws unless ALLOW_LOCAL_SITE_URL=1
  - test/helpers.js cleanEnv() and runBuild() exports; build() opts out only for variants without SITE_URL
  - Guard edge tests (missing, blank, strict opt-out, set URL, serve/watch probe, inherited opt-out)
  - workflow.test.js (g)/(h) CI contract for SITE_URL and the opt-out
  - Polish README static-host deploy docs with SITE_URL (PowerShell + Git Bash), subfolder, guard, opt-out
affects: [02-seo, any phase adding absolute URLs (canonical, og:url, sitemap)]

actuals:
  tokens: 5556      # chars/4 over the realized diff (git diff b49c01b..b16c7df)
  tasks: 3
  commits: 4
plan_head_before: b49c01b43fed94b47240391e9e175ada6fd4220f
plan_head_after: b16c7df847f2664c6d4323f6f797758a42f02422

tech-stack:
  added: []
  patterns:
    - "Fail-loud config guard at module import: site.js throws in build run mode instead of falling back silently"
    - "Explicit strict opt-out env var (=== \"1\") stripped from inherited test env"
    - "Non-asserting runBuild() beside asserting build() so tests can inspect failing builds"

key-files:
  created:
    - .planning/phases/01-eleventy-foundation/01-07-SUMMARY.md
  modified:
    - src/_data/site.js
    - test/helpers.js
    - test/build.test.js
    - test/workflow.test.js
    - README.md
    - .planning/phases/01-eleventy-foundation/01-REVIEW-DISPOSITION.md
    - .planning/phases/01-eleventy-foundation/01-VALIDATION.md

key-decisions:
  - "Production builds (ELEVENTY_RUN_MODE=build) with unset or blank SITE_URL throw; only ALLOW_LOCAL_SITE_URL exactly \"1\" opts out, and serve/watch keep the http://localhost:8080 default (CR-01, G-01-5)"
  - "Test harness strips ALLOW_LOCAL_SITE_URL from the inherited env and adds the opt-out only for variants without SITE_URL, so production-like variants pass the guard for real"

patterns-established:
  - "Guard-before-render: env validation in a module imported by eleventy.config.js runs before any template renders, so a failed build writes no output"

requirements-completed: [FOUND-01, FOUND-03]

coverage:
  - id: D1
    description: "Production build without SITE_URL (unset or blank) exits non-zero with the guard message and writes no index.html"
    requirement: FOUND-03
    verification:
      - kind: integration
        ref: "test/build.test.js#production build without SITE_URL fails loudly"
        status: pass
      - kind: integration
        ref: "test/build.test.js#blank SITE_URL counts as missing"
        status: pass
      - kind: other
        ref: "env -u SITE_URL -u ALLOW_LOCAL_SITE_URL npm run build (exit non-zero, no _site/index.html)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Only ALLOW_LOCAL_SITE_URL=1 opts out (keeps localhost og:image); an inherited opt-out never reaches test builds"
    requirement: FOUND-03
    verification:
      - kind: integration
        ref: "test/build.test.js#ALLOW_LOCAL_SITE_URL=1 keeps the local default"
        status: pass
      - kind: integration
        ref: "test/build.test.js#only ALLOW_LOCAL_SITE_URL=1 opts out"
        status: pass
      - kind: integration
        ref: "test/build.test.js#build helpers never inherit an opt-out"
        status: pass
    human_judgment: false
  - id: D3
    description: "A set SITE_URL passes the guard without the opt-out and emits no localhost:8080"
    requirement: FOUND-03
    verification:
      - kind: integration
        ref: "test/build.test.js#a set SITE_URL passes the guard without the opt-out"
        status: pass
      - kind: other
        ref: "SITE_URL=https://guard.example npm run build (og:image https://guard.example/assets/hero-bg.jpg)"
        status: pass
    human_judgment: false
  - id: D4
    description: "npm run dev (serve) and watch mode keep the local default; GitHub Pages workflow sets SITE_URL/PATH_PREFIX and never the opt-out"
    requirement: FOUND-01
    verification:
      - kind: unit
        ref: "test/build.test.js#site.js keeps the local default in serve and watch mode"
        status: pass
      - kind: unit
        ref: "test/workflow.test.js#(g) build job env sets SITE_URL and PATH_PREFIX for npm test and npm run build"
        status: pass
      - kind: unit
        ref: "test/workflow.test.js#(h) the workflow never sets the local opt-out"
        status: pass
    human_judgment: false
  - id: D5
    description: "Polish README documents the static-host build with SITE_URL (PowerShell + Git Bash), subfolder PATH_PREFIX, the guard and the local opt-out"
    requirement: FOUND-01
    verification:
      - kind: other
        ref: "Task 3 README string loop + no discord.gg + no old one-line static-host sentence"
        status: pass
      - kind: manual_procedural
        ref: "PowerShell run of the documented commands (SITE_URL build ok, opt-out exit 0, plain build exit 1)"
        status: pass
    human_judgment: true
    rationale: "Natural Polish wording and copy-paste readability of the Wdrożenie section need a human read (plan human-check)"

duration: 5min
completed: 2026-10-03
status: complete
---

# Phase 1 Plan 07: SITE_URL Production Build Guard Summary

**Production builds now fail with a clear `SITE_URL is not set` error and no longer write `http://localhost:8080` into og:image. `ALLOW_LOCAL_SITE_URL=1` (exactly "1") opts out for local builds. Serve/watch and the GitHub Pages workflow are unchanged. The Polish README documents the SITE_URL build for PowerShell and Git Bash. This closes G-01-5 / CR-01.**

## Performance

- **Duration:** about 5 min
- **Started:** 2026-10-03T10:18:29Z
- **Completed:** 2026-10-03T10:23:30Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- `src/_data/site.js` throws on a build-mode import when SITE_URL is unset or blank, unless `ALLOW_LOCAL_SITE_URL === "1"`. The throw happens before any template renders, and `clean.js` has already emptied `_site/`, so a failed build leaves nothing to upload.
- `test/helpers.js` now exports `cleanEnv()` and a non-asserting `runBuild()`. `build()` adds the opt-out only for variants without SITE_URL, and `ALLOW_LOCAL_SITE_URL` is stripped from the inherited env, matched case-insensitively.
- 9 new tests: 7 in build.test.js (guard, opt-out, blank, strict, set URL, serve/watch probe, inherited opt-out) and 2 in workflow.test.js ((g) and (h)). Suite: 56/56 pass, and also pass under a CI-like env that exports SITE_URL, PATH_PREFIX and ALLOW_LOCAL_SITE_URL=1.
- README "Wdrożenie" covers the SITE_URL build, the subfolder case, the guard and the opt-out. "Szybki start" and "Konfiguracja" are corrected. 01-REVIEW-DISPOSITION marks CR-01 fixed (open: 12), and every build command in 01-VALIDATION carries the opt-out.

## Task Commits

1. **Task 1 (tracer, TDD): production build without SITE_URL fails loudly**
   - RED: `ff5b6dd` (test). The harness and failing guard test; RED evidence was verified `RED_EVIDENCE_OK`.
   - GREEN: `caebfa3` (feat). The guard in site.js.
2. **Task 2: lock guard edges, serve/watch and CI contract** - `8074b55` (test)
3. **Task 3: README SITE_URL docs, CR-01 fixed, VALIDATION commands** - `b16c7df` (docs)

No refactor commit was needed.

## Files Created/Modified

- `src/_data/site.js` - `localUrl` const, build-mode SITE_URL guard, rewritten header comment
- `test/helpers.js` - `ALLOW_LOCAL_SITE_URL` in `buildEnvKeys`, `cleanEnv`/`runBuild` exports, opt-out-aware `build()`
- `test/build.test.js` - 7 guard tests
- `test/workflow.test.js` - tests (g) and (h), header clause
- `README.md` - Polish static-host deploy docs with SITE_URL, PATH_PREFIX, the guard and the opt-out
- `.planning/phases/01-eleventy-foundation/01-REVIEW-DISPOSITION.md` - CR-01 fixed, open 12
- `.planning/phases/01-eleventy-foundation/01-VALIDATION.md` - opt-out-prefixed build commands, rows 01-07-T1..T3

## Decisions Made

- The guard message is copied exactly from the plan. It interpolates `localUrl`, so links.test.js (f) still finds the literal `localhost:8080` only in site.js.
- The tracer feedback gate ran in `end-of-phase` mode with an automated-only `<verify>`. That verify was re-run and passed (49/49, real `npm run build` guard, SITE_URL build), so the plan expanded with no checkpoint.

## Deviations from Plan

### Process notes

**1. Protected-branch assertion (#3819) reported `main` as protected.**
- **Found during:** the first task commit
- **Issue:** The executor's pre-commit assertion returns `protected=true` for `main`, and `git.allow_default_branch_commits` is not set.
- **Resolution:** The orchestrator explicitly dispatched this plan as a sequential executor committing on `main`, and plans 01-01..01-06 were committed there too. The project-root pin passed before every commit. All commits are local and were not pushed.

---

**Total deviations:** 0 code deviations. 1 process note.
**Impact on plan:** None. The plan was executed as written.

## TDD Gate Compliance

- RED `ff5b6dd` test(01-07) came before GREEN `caebfa3` feat(01-07).
- RED evidence came from `node --test --test-reporter=tap test/build.test.js` (exit 1). The target test "production build without SITE_URL fails loudly" failed on its status assertion, and the verdict was `RED_EVIDENCE_OK`.

## Issues Encountered

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Phase 2 absolute URLs (canonical, og:url, sitemap) inherit the guard automatically through `site.url`.
- WR-01 (SITE_URL/PATH_PREFIX validation) and the other review findings are still open and out of scope here.
- Human check still pending: read README "Wdrożenie" once to confirm the Polish reads naturally.

## Self-Check: PASSED

- All 7 modified files exist on disk.
- Commits ff5b6dd, caebfa3, 8074b55 and b16c7df are present in `git log`.
- Plan verification passed: `npm test` 56/56 (also under the CI-like env); a plain `npm run build` without SITE_URL exits 1 with no `_site/index.html`; `SITE_URL=https://guard.example npm run build` gives an absolute og:image; `ALLOW_LOCAL_SITE_URL=1 npm run build` exits 0; pages.yml, package.json, package-lock.json and eleventy.config.js are unchanged; the README string contract holds.

---
*Phase: 01-eleventy-foundation*
*Completed: 2026-10-03*
