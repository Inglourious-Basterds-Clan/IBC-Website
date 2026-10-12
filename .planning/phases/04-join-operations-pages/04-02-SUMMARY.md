---
phase: 04-join-operations-pages
plan: 02
subsystem: build-gates
tags: [node, cli, safety, gates, cr-01]

requires:
  - phase: 03-performance-assets
    provides: "lib/reject-output.js shared rejection helper (CR-02) used by check-seo and check-perf; scripts/clean.js"
provides:
  - "isDisposableOutput(outDir, repoRoot) allow-list: only _site or a folder under _test/"
  - "removeRejectedOutput that leaves any non-output folder in place with a DO NOT DEPLOY IT message"
  - "scripts/clean.js on the same allow-list"
  - "test/reject-output.test.js (unit on temp fake roots, CLI on a .cache fixture)"
affects: [04-05 gate rules G11/G12, build pipeline, check-seo, check-perf]

actuals:
  tokens: 3000
  tasks: 2
  commits: 3
plan_head_before: bb46ddf90a05030fb8891b9af337a565d88e2221
plan_head_after: b822bc2cfcde45177ff3c09550c9120643af1501

tech-stack:
  added: []
  patterns:
    - "One allow-list (isDisposableOutput) gates every folder move/delete in the build tooling"
    - "Destructive-path tests use mkdtemp fake roots or gitignored .cache/ fixtures, never real source"

key-files:
  created:
    - test/reject-output.test.js
  modified:
    - lib/reject-output.js
    - scripts/clean.js
    - .planning/phases/03-performance-assets/03-REVIEW-DISPOSITION.md

key-decisions:
  - "Kept the existing 'not a folder inside the repository' wording for paths outside the repo and added a separate 'is not build output (_site or a folder under _test/)' message for in-repo non-output folders; both end with DO NOT DEPLOY IT"
  - "Allow-list is exact: _site itself, or _test/<non-empty segment>...; _site/sub, _sitex, _test and _test-x are refused"

patterns-established:
  - "CR-01 allow-list: any code that moves or deletes a folder must call isDisposableOutput first"

requirements-completed: [CONT-06]

coverage:
  - id: D1
    description: "A failing check-seo/check-perf run only moves or deletes _site or _test/**; any other folder is left in place and the gate still exits 1 with DO NOT DEPLOY IT"
    requirement: CONT-06
    verification:
      - kind: unit
        ref: "test/reject-output.test.js#isDisposableOutput accepts only _site and folders under _test/"
        status: pass
      - kind: unit
        ref: "test/reject-output.test.js#removeRejectedOutput leaves source folders in place and still says DO NOT DEPLOY IT"
        status: pass
      - kind: unit
        ref: "test/reject-output.test.js#removeRejectedOutput refuses lookalikes of the allow-list"
        status: pass
      - kind: integration
        ref: "test/reject-output.test.js#CLI gates fail on a non-output folder but leave it in place"
        status: pass
    human_judgment: false
  - id: D2
    description: "CR-02 move-aside behaviour unchanged for _site and _test/** (seo-gate and perf-gate CLI tests green)"
    requirement: CONT-06
    verification:
      - kind: unit
        ref: "test/reject-output.test.js#removeRejectedOutput still moves a rejected _site aside (CR-02 unchanged)"
        status: pass
      - kind: integration
        ref: "node --test test/seo-gate.test.js test/perf-gate.test.js"
        status: pass
    human_judgment: false
  - id: D3
    description: "scripts/clean.js removes only _site or _test/** and refuses everything else with 'refusing' and exit 1; production build still cleans _site"
    requirement: CONT-06
    verification:
      - kind: integration
        ref: "test/reject-output.test.js#clean.js refuses a folder that is not build output and leaves it in place"
        status: pass
      - kind: integration
        ref: "test/reject-output.test.js#clean.js removes a folder under _test/"
        status: pass
      - kind: integration
        ref: "test/devpages.test.js#(h) clean.js refuses the repo root and paths outside it"
        status: pass
      - kind: other
        ref: "SITE_URL=https://guard.example npm run build"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-10-12
status: complete
---

# Phase 4 Plan 02: CR-01 Build-Output Allow-List Summary

**Gate rejection (lib/reject-output.js) and the pre-build clean (scripts/clean.js) now share one `isDisposableOutput` allow-list, so a mistyped `--dir src` or `clean.js .git` refuses instead of moving or deleting source.**

## Performance

- **Duration:** about 4 min
- **Started:** 2026-10-12T16:11:17Z
- **Completed:** 2026-10-12T16:15:01Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `isDisposableOutput(outDir, repoRoot)` exported from `lib/reject-output.js`. It returns true only for `_site` or `_test/<segment>...`. Windows separators are normalised before the comparison.
- `removeRejectedOutput` checks the allow-list before any `rmSync`/`renameSync`. The move and the recursive-delete fallback can now only touch `_site` or `_test/**`.
- `scripts/clean.js` refuses every target outside the allow-list with `clean.js: refusing to remove <target> (only _site or a folder under _test/)` and exit 1.
- CR-01 is marked `fixed` in the Phase 3 review disposition (front matter `open: 11`, table Source `04-02`).

## Task Commits

1. **Task 1 (tracer): gate rejection allow-list + tests** - `8b16f0f` (fix)
2. **Task 2 RED: clean.js allow-list tests** - `837ff71` (test)
3. **Task 2 GREEN: clean.js on the allow-list, CR-01 fixed** - `b822bc2` (feat)

## TDD Gate Compliance (Task 2)

- **RED:** `node --test --test-reporter=tap test/reject-output.test.js` exited 1. Target test "clean.js refuses a folder that is not build output and leaves it in place" failed on its first assertion (`0 !== 1`): the old clean.js deleted the `.cache` fixture. The other 7 tests passed. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (target_test_failed, tap). **Semantic assessment:** the target ran and failed on the planned behaviour. There was no load, syntax or fixture fault.
- **GREEN:** clean.js imports `isDisposableOutput`. `node --test test/reject-output.test.js test/devpages.test.js` shows 17/17 passing, and `npm test` shows 296/296.
- **REFACTOR:** none needed.

## Files Created/Modified
- `lib/reject-output.js` - adds `isDisposableOutput`, a shared `isOutsideRepo` helper, and the guarded `removeRejectedOutput`
- `scripts/clean.js` - uses the shared allow-list in place of the root/outside-only check
- `test/reject-output.test.js` - 8 CR-01 tests: unit tests on `mkdtemp` fake roots, CLI tests on `.cache/reject-output-fixture` and `_test/reject-output-stale`
- `.planning/phases/03-performance-assets/03-REVIEW-DISPOSITION.md` - CR-01 marked `fixed`

## Decisions Made
- Two refusal messages. Paths outside the repo keep the old wording, and in-repo non-output folders get "is not build output (_site or a folder under _test/)". Both end with "DO NOT DEPLOY IT", so CI and the README cutover flow still stop.
- The CLI tests set `SITE_URL=https://guard.example` through `cleanEnv()` so check-seo's site config loads. The gates then reach the G0/P0 rejection path.

## Deviations from Plan

None in the plan code. One acceptance check could not pass for an environmental reason:

- Task 1 acceptance `test -d src && test -d .git`: in this git worktree `.git` is a file, not a directory, so `test -d .git` fails. `test -d src` passes and `test -e .git` passes. The tests never touch the real `.git`; they use a fake `.git/HEAD` in a temp root.
- `node_modules` was missing in the worktree, so I restored it with `npm ci` from the existing lockfile. No new package was installed and nothing in `package.json` changed.

**Total deviations:** 0 auto-fixes. **Impact:** none.

## Issues Encountered
- In the RED run, the old clean.js deleted the throwaway `.cache/reject-output-fixture`. That is the CR-01 bug the test reproduces. The fixture is gitignored and recreated by each test.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness
- Plan 04-05 can add gate rules G11 and G12 on top of a rejection path that cannot destroy source.
- Out of scope and still open: a `_site` that is itself a symlink or junction into source. `renameSync` and `rmSync` act on the link entry, not on its target.

---
*Phase: 04-join-operations-pages*
*Completed: 2026-10-12*

## Self-Check: PASSED
- FOUND: lib/reject-output.js, scripts/clean.js, test/reject-output.test.js, 03-REVIEW-DISPOSITION.md
- FOUND commits: 8b16f0f, 837ff71, b822bc2 (all ancestors of HEAD)
- All task acceptance criteria re-run and passing, except the environmental `test -d .git` explained above. Plan verification: `npm test` passed 296/296 and `SITE_URL=https://guard.example npm run build` exited 0.
