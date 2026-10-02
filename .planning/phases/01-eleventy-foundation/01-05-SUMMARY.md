---
phase: 01-eleventy-foundation
plan: 05
subsystem: infra
tags: [eleventy, preprocessor, dev-pages, layout, clean-script, node-test]

requires:
  - phase: 01-eleventy-foundation (plan 01-01)
    provides: "src/_data/site.js includeDevPages, eleventy.config.js, test/helpers.js build/read/block/attrValues/repoRoot"
  - phase: 01-eleventy-foundation (plan 01-02)
    provides: "layouts/base.njk + partials (head/header/footer/discord-cta), navigation.js, home-only active-nav and head data"
provides:
  - "eleventy.config.js devOnly preprocessor: drops `devOnly: true` pages unless site.includeDevPages (serve/watch or INCLUDE_DEV_PAGES=1)"
  - "src/_dev/layout-test.njk: front matter + body page proving ROADMAP success criterion 4"
  - "src/_dev/layout-empty.njk: front-matter-only page (empty body, default title)"
  - "scripts/clean.js: guarded, dependency-free output cleaner (default _site/), refuses repo root / parents / other drives"
  - "package.json build = `node scripts/clean.js && eleventy`"
  - "test/devpages.test.js: tests (a)-(i) for shared-chrome equality, empty page, dev exclusion and clean script"
affects: [01-06, phase-2-seo (sitemap must not list _dev pages), phase-4-pages]

actuals:
  tokens: 2369   # chars/4 over the realized diff (9477 chars)
  tasks: 2
  commits: 4
plan_head_before: a4f4ce1e582d03087b31b585d7d7c6ff6207f5cf
plan_head_after: 7172b27d802082642b11e8cba0d6b23db3f33986

tech-stack:
  added: []
  patterns:
    - "Dev-only pages: `devOnly: true` + `eleventyExcludeFromCollections: true` + explicit `/_dev/<name>/` permalink"
    - "Production build always starts from an empty _site/ (clean script runs before Eleventy)"
    - "Destructive scripts resolve argv against the repo root and refuse root/outside targets"

key-files:
  created:
    - src/_dev/layout-test.njk
    - src/_dev/layout-empty.njk
    - scripts/clean.js
    - test/devpages.test.js
  modified:
    - eleventy.config.js
    - package.json

key-decisions:
  - "devOnly exclusion uses Eleventy's drafts-style addPreprocessor returning false, gated on site.includeDevPages (single source in site.js)"
  - "clean.js refuses rel === '', '..' or '..'+sep prefixes and absolute relatives (other drive); a dir literally named '..foo' is still allowed"
  - "Shared-chrome equality is strict: dev page header == home header minus the single active-nav attribute; footer byte-equal"

patterns-established:
  - "Dev page tests build into _test/devpages-included (INCLUDE_DEV_PAGES=1) and _test/devpages-default (no env)"

requirements-completed: [FOUND-05, FOUND-01]

coverage:
  - id: D1
    description: "A page made of front matter + body (layout-test) and one of front matter only (layout-empty) render the home page's header, nav, Discord CTA and footer byte-for-byte (minus home-only active-nav), with their own/default title and no home-only head data"
    requirement: FOUND-05
    verification:
      - kind: integration
        ref: "test/devpages.test.js#(a)-(d),(f)"
        status: pass
    human_judgment: false
  - id: D2
    description: "devOnly pages are excluded from a plain production build (no _dev/ directory) and from collections"
    requirement: FOUND-05
    verification:
      - kind: integration
        ref: "test/devpages.test.js#(e) a default build has no _dev directory"
        status: pass
      - kind: other
        ref: "INCLUDE_DEV_PAGES=1 npx @11ty/eleventy && test -d _site/_dev && npm run build && test ! -d _site/_dev && test -f _site/index.html"
        status: pass
    human_judgment: false
  - id: D3
    description: "npm run build deletes _site/ first through scripts/clean.js, which refuses the repo root, parents and other drives"
    requirement: FOUND-01
    verification:
      - kind: unit
        ref: "test/devpages.test.js#(g),(h),(i)"
        status: pass
      - kind: other
        ref: "node scripts/clean.js . (exit 1), node scripts/clean.js D:/x (exit 1), package.json intact"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-10-02
status: complete
---

# Phase 1 Plan 05: Dev-only Layout Pages and Clean-before-build Summary

**`devOnly` Eleventy preprocessor with two `src/_dev/` pages that render the home page's exact chrome in dev/test builds only, plus a guarded `scripts/clean.js` so `npm run build` always starts from an empty `_site/`**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-02T22:28:51Z
- **Completed:** 2026-10-02T22:31:23Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- ROADMAP success criterion 4 proven: `/_dev/layout-test/` (front matter + body) and `/_dev/layout-empty/` (front matter only) render header, nav, Discord CTA, footer and decryption overlay identical to the home page; no partial changes were needed for the strict equality to hold
- Dev pages render in `npm run dev` and with `INCLUDE_DEV_PAGES=1`, never in a plain build, and are excluded from collections (future sitemap safe)
- `npm run build` = `node scripts/clean.js && eleventy`; verified that a stale `_site/_dev/` from an INCLUDE_DEV_PAGES build is gone after `npm run build`
- `npm test`: 37/37 pass (28 previous + 9 new)

## Task Commits

Each task followed RED -> GREEN:

1. **Task 1: Dev-only layout test pages** - `478ce2f` (test, RED), `ecfb81b` (feat, GREEN)
2. **Task 2: Clean _site/ before build** - `2b57478` (test, RED), `7172b27` (feat, GREEN)

No REFACTOR commits (nothing to clean up).

## Files Created/Modified
- `eleventy.config.js` - devOnly preprocessor added after the passthrough copy; nothing else changed
- `src/_dev/layout-test.njk` - dev page: title "Test layoutu", one h1, Polish copy, root-relative link home, no inline styles
- `src/_dev/layout-empty.njk` - dev page: front matter only, no title, no body
- `scripts/clean.js` - rmSync of the target (default `_site`), refuses root/outside with `clean.js: refusing to remove <target>` and exit 1
- `package.json` - `build` script now cleans first; `dev` and `test` unchanged
- `test/devpages.test.js` - tests (a)-(i)

## Decisions Made
- Parent-escape check is separator-aware (`rel === ".."` or starts with `".." + sep`) rather than a bare `startsWith("..")`, so it refuses every path outside the repo without also refusing an in-repo folder whose name begins with two dots. Behaviour required by the plan (refuse `.`, `..`, other drives) is unchanged.
- `repoRoot` is wrapped in `resolve()` to drop the trailing separator from `fileURLToPath(new URL("..", ...))`, so the refusal message prints a clean path.

## TDD Gate Compliance
- RED evidence verified with `gsd-tools check tdd-red-evidence` for both tasks (verdict `RED_EVIDENCE_OK`): Task 1 failed (a)-(d),(f) on "not generated" assertions with (e) passing trivially; Task 2 failed (g)-(i) on exit-code / build-script assertions.
- RED commits (`test(01-05)`) precede GREEN commits (`feat(01-05)`) for both tasks.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 01-06 can use `/_dev/layout-test/`'s root-relative home link in its dual-prefix link resolver (build with INCLUDE_DEV_PAGES=1).
- Phase 2 sitemap: dev pages already carry `eleventyExcludeFromCollections: true`.

## Self-Check: PASSED
- FOUND: src/_dev/layout-test.njk, src/_dev/layout-empty.njk, scripts/clean.js, test/devpages.test.js
- FOUND commits: 478ce2f, ecfb81b, 2b57478, 7172b27
- All Task 1 and Task 2 acceptance criteria re-run: PASS

---
*Phase: 01-eleventy-foundation*
*Completed: 2026-10-02*
