---
phase: 03-performance-assets
plan: 06
subsystem: build
tags: [eleventy-img, assets, originals, passthrough, seo-images, node-test]

requires:
  - phase: 03-performance-assets
    provides: "03-04: every page references only generated variants (picture shortcode, data-lightbox-*), so no template names an original; 03-03: perf gate P8 reads its original names from src/images"
provides:
  - "src/images/: the eight unshipped originals (pipeline inputs), moved with git mv so history follows; patrol.jpg and sniper.jpg kept for Phase 4"
  - "src/assets/hero.jpg deleted (byte-identical duplicate of hero-bg.jpg)"
  - "lib/images.js sourceDir = \"src/images\""
  - "tools/seo-images/make-seo-images.js reads src/images/logo.png and src/images/hero-bg.jpg (not run)"
  - "/_dev/og-override/ overrides og:image with the shipped brand logo (512x512)"
  - "test/build.test.js guards: originals never ship (root + /IBC-Website/), negative control, hero.jpg gone, originals stay in git, SEO tool inputs"
affects: [03-07 icons, 03-11 README pipeline docs and perf gate chaining, Phase 4 operation recaps (patrol.jpg, sniper.jpg)]

actuals:
  tokens: 1611
  tasks: 2
  commits: 3
plan_head_before: 10de97f749087d4230427285069fefe116839e59
plan_head_after: 93a4c31fed0e6345ca8a2dd3ffee567f769166cc

tech-stack:
  added: []
  patterns:
    - "Pipeline inputs live outside the passthrough-copied folder (src/images/); only generated variants under <output>/img/ and the committed SEO images under src/assets/ ship"
    - "Never-ship checks compare output base names against `git ls-files src/images`, so a new original is covered without editing the test"

key-files:
  created: [src/images/ (8 files moved from src/assets/)]
  modified: [lib/images.js, src/_dev/og-override.njk, test/seo.test.js, test/build.test.js, tools/seo-images/make-seo-images.js]

key-decisions:
  - "Task 2 RED targets the SEO tool's input paths (parsed from the tool source), because Task 1 (the tracer) had already made the never-ship, hero.jpg-gone and stay-in-git guards pass; those three are regression guards, and the negative control proves the never-ship helper can fail"
  - "The never-ship comparison is case-insensitive on the base name at any depth of the output, matching the perf gate's P8 rule"
  - "The og-override test also asserts the brand logo is 512x512, so the front matter's width/height cannot drift from the file"

patterns-established:
  - "An image the build must never ship belongs in src/images/; anything under src/assets/ is published as is"

requirements-completed: [PERF-02, PERF-01]

coverage:
  - id: D1
    description: "The eight originals live in git under src/images/ (patrol.jpg and sniper.jpg included); src/assets/ holds only og/, icons/ and brand/"
    requirement: PERF-02
    verification:
      - kind: integration
        ref: "test/build.test.js#originals stay in git (D-02)"
        status: pass
      - kind: other
        ref: "git ls-files src/images | wc -l = 8"
        status: pass
    human_judgment: false
  - id: D2
    description: "No original ships: no file in the root or /IBC-Website/ build has a src/images/ base name; a production /IBC-Website/ build passes check-seo with only og/, icons/ and brand/ under _site/assets/ and 1600 w AVIF variants under _site/img/"
    requirement: PERF-02
    verification:
      - kind: integration
        ref: "test/build.test.js#originals never ship (D-02, PERF-02)"
        status: pass
      - kind: unit
        ref: "test/build.test.js#the never-ship check reports a shipped original (negative control)"
        status: pass
      - kind: integration
        ref: "test/build.test.js#default build emits the site"
        status: pass
      - kind: other
        ref: "SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/ npm run build && test ! -e _site/assets/hero-bg.jpg && test ! -e _site/assets/logo.png && ls _site/img/*-1600.avif"
        status: pass
    human_judgment: false
  - id: D3
    description: "The duplicate src/assets/hero.jpg is deleted from the repository and the index, and assets/hero.jpg is absent from both outputs"
    requirement: PERF-02
    verification:
      - kind: integration
        ref: "test/build.test.js#the duplicate hero.jpg is gone (PERF-02)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The image pipeline reads from src/images/ and the hero, gallery, lightbox and logo still render with the same variants"
    requirement: PERF-01
    verification:
      - kind: integration
        ref: "test/images.test.js (all); npm test 243/243"
        status: pass
    human_judgment: false
  - id: D5
    description: "The /_dev/og-override/ dev page overrides og:image and twitter:image with the shipped 512x512 brand logo"
    verification:
      - kind: integration
        ref: "test/seo.test.js#(l) ogImage front matter overrides the default (D-07)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The SEO image tool reads its two inputs from src/images; the committed Phase 2 SEO images are byte-identical to 03ce0de and were not regenerated"
    verification:
      - kind: unit
        ref: "test/build.test.js#the SEO image tool reads its two inputs from src/images (D-06)"
        status: pass
      - kind: other
        ref: "git diff --quiet 03ce0de -- src/assets/og src/assets/icons src/assets/brand src/favicon.ico (exit 0)"
        status: pass
      - kind: integration
        ref: "test/seo-assets.test.js (all)"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-10-10
status: complete
---

# Phase 3 Plan 06: Unshipped Originals Folder Summary

**The eight original images moved with `git mv` from the passthrough-copied `src/assets/` to an unshipped `src/images/` folder. The 4.7 MB duplicate `hero.jpg` is deleted. The image pipeline and the SEO tool read from the new folder, and build tests fail if any original reaches the root or `/IBC-Website/` output or leaves git.**

## Performance

- **Duration:** about 5 min
- **Started:** 2026-10-10T20:32:12Z
- **Completed:** 2026-10-10T20:36:49Z
- **Tasks:** 2
- **Files modified:** 14 (8 renames, 1 deletion, 5 text edits)

## Accomplishments

- `src/images/` holds cos.png, funny.png, hero-bg.jpg, jo_1967.png, logo.png, op_patrol.jpg, patrol.jpg and sniper.jpg. Git records them as renames, so history follows. `src/assets/` now holds only `og/`, `icons/` and `brand/`.
- `src/assets/hero.jpg` (byte-identical to hero-bg.jpg, confirmed with `cmp`) is removed with `git rm`.
- `lib/images.js` has `sourceDir = "src/images"`. Every picture is still built from the same originals with the same presets. 03-03's perf gate already reads its P8 list from `src/images`, so it now sees the real originals.
- `/_dev/og-override/` uses `/assets/brand/ibc-logo-512.png` (512x512, alt "Logo IBC (test nadpisania obrazu OG)"). Test (l) checks that URL and the file's real size.
- The `/IBC-Website/` production build passes check-seo. `_site/assets/` contains only `brand`, `icons` and `og`, and `_site/img/` has the 1600 w AVIF lightbox variants.
- `make-seo-images.js` reads `src/images/logo.png` and `src/images/hero-bg.jpg`. The tool was not run, and the committed SEO images are byte-identical to 03ce0de (D-06).
- `npm test`: 243/243 pass (238 after Task 1, plus 5 new build tests).

## Task Commits

1. **Task 1 (tracer): originals leave the shipped folder end to end.** `d796638` (feat). Tracer feedback gate (interactive, end-of-phase, automated-only verify): verify re-run on the committed tree, 36/36 targeted, 238/238 full suite, prefix build checks OK, then continued.
2. **Task 2 (TDD): never-ship and stay-in-git guards; SEO tool reads the new folder.**
   - RED `a141ed1` (test)
   - GREEN `93a4c31` (feat)
   - No refactor needed

**Plan metadata:** in the docs(03-06) commit that adds this SUMMARY.

## TDD Gate Compliance

- **RED** `a141ed1`: `node --test --test-reporter=tap test/build.test.js` ran 17 tests (16 pass, 1 fail) and exited 1. The target test "the SEO image tool reads its two inputs from src/images (D-06)" failed on `deepStrictEqual`: actual `['src/assets/logo.png','src/assets/hero-bg.jpg']`, expected `['src/images/logo.png','src/images/hero-bg.jpg']`. Classifier `check tdd-red-evidence`: `RED_EVIDENCE_OK` (`target_test_failed`, format tap, no report errors). **Semantic assessment:** the target ran and failed on the planned assertion for the intended reason, because the tool still pointed at the old folder. There were no load, syntax or fixture faults and no unrelated failures.
- The other three behavior tests (never ship, hero.jpg gone, stay in git) already passed at RED, because the tracer Task 1 had done the move. They are regression guards. The negative control shows the never-ship helper does report a shipped original.
- **GREEN** `93a4c31`: two path strings changed. build + seo-assets 23/23 pass, `npm test` 243/243.

## Files Created/Modified

- `src/images/*` (8 files, renamed from `src/assets/`): unshipped originals the pipeline reads.
- `src/assets/hero.jpg`: deleted.
- `lib/images.js`: `sourceDir = "src/images"` and its comment.
- `src/_dev/og-override.njk`: front matter override set to the brand logo.
- `test/seo.test.js`: test (l) expects the brand logo URL and its 512x512 size.
- `test/build.test.js`: the "default build emits the site" test now checks that originals are absent. It also adds the `trackedOriginals` / `shippedOriginals` / `allFiles` helpers and five new tests.
- `tools/seo-images/make-seo-images.js`: the two `inputs` paths.

## Decisions Made

- Task 2's RED targets the SEO tool's input paths (read from the tool's source, since the tool imports sharp and must not run). The plan put the move in the Task 1 tracer, so the other guards could not fail before implementation.
- The never-ship check matches base names case-insensitively at any depth of the output, the same rule as perf gate P8.

## Deviations from Plan

None in scope. The one addition is a fifth Task 2 test, "the SEO image tool reads its two inputs from src/images (D-06)". It gives the TDD task a real RED, because the behavior tests were already green after the tracer. It is covered under TDD Gate Compliance.

**Total deviations:** 0 auto-fixed. **Impact:** none.

## Issues Encountered

- The first `npm test` run after Task 1 had one failure in `test/perf-gate.test.js`: the CLI-rejected fixture could not be renamed (`EPERM`, so the gate deleted it instead), and the message assertion failed. The file passes on its own (49/49), and the next two full runs were green (238/238, then 243/243). This is a Windows file lock during parallel test runs, not related to this plan. It is logged in `deferred-items.md` for a later look.
- Git warns that LF will become CRLF in the edited files. This is the repo's existing `core.autocrlf=true` behavior.
- The README's SEO-generator source paths and its "Struktura projektu" line still name `src/assets/`. 03-11 Task 2 updates them, as the plan states.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 03-07 (inline SVG icons) can run. No shared files.
- 03-11 can chain the perf gate into the build: P8 now sees the real originals in `src/images/`, and none ship.
- Phase 4 can use `src/images/patrol.jpg` and `sniper.jpg` through `processImages()` by adding presets/entries.

## Self-Check: PASSED

- FOUND: src/images/ (8 files, `git ls-files src/images` = 8), lib/images.js, src/_dev/og-override.njk, test/build.test.js, test/seo.test.js, tools/seo-images/make-seo-images.js; src/assets/hero.jpg absent
- FOUND commits: d796638, a141ed1, 93a4c31 (ancestors of HEAD; evaluation-scope --plan 03-06 resolves all three; `git rev-list --count 10de97f..HEAD` = 3)
- Acceptance: AC Task 1 all pass (8 tracked, hero.jpg untracked, sourceDir 1, ibc-logo-512.png 1); Task 2 grep counts 1/1, D-06 `git diff --quiet 03ce0de -- ...` exit 0, `node --check` OK; `npm test` 243/243; /IBC-Website/ production build + check-seo OK, no original under _site/assets/

---
*Phase: 03-performance-assets*
*Completed: 2026-10-10*
