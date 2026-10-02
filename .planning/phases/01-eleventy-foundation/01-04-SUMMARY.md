---
phase: 01-eleventy-foundation
plan: 04
subsystem: infra
tags: [github-actions, github-pages, ci, readme, node-test]

requires:
  - phase: 01-eleventy-foundation (plan 01-01)
    provides: "package.json scripts (dev/build/test), .nvmrc = 24, src/_data/site.js reading SITE_URL/PATH_PREFIX, test/helpers.js that strips both from the inherited env"
provides:
  - ".github/workflows/pages.yml: build + test on every PR and push, upload _site/ and deploy to GitHub Pages only on push to main"
  - "test/workflow.test.js: static contract for triggers, env, step order and the permission split"
  - "README.md (Polish): requirements, npm commands, _site/ as the new deploy folder, single config location, subpath preview, domain cutover, structure, dev pages"
  - "01-USER-SETUP.md: one-time Settings -> Pages -> Source: GitHub Actions"
affects: [01-05, 01-06, phase-2-seo (check-seo.js plugs into the build job), domain cutover]

actuals:
  tokens: 2491   # chars/4 over pages.yml + workflow.test.js + README.md
  tasks: 2
  commits: 2
plan_head_before: 312513892dc3634cc7e677e86160f767c3de86b4
plan_head_after: e380f0c4174bcbbff43198b8cf60c2d339709375

tech-stack:
  added: ["GitHub Actions: actions/checkout@v7, actions/setup-node@v7, actions/upload-pages-artifact@v5, actions/deploy-pages@v5"]
  patterns:
    - "Production host lives only in the build job env of pages.yml (SITE_URL, PATH_PREFIX); site.js keeps local defaults"
    - "Privileged deploy job runs no npm and no setup-node; workflow-level permission is contents: read"
    - "CI/config contract tests read YAML as text (split at '  deploy:'), no YAML dependency"

key-files:
  created:
    - .github/workflows/pages.yml
    - test/workflow.test.js
    - README.md
    - .planning/phases/01-eleventy-foundation/01-USER-SETUP.md
  modified: []

key-decisions:
  - "Workflow follows RESEARCH Pattern 7 verbatim; comments avoid the strings 'write', 'npm ' and 'setup-node' in the sections the contract test scans"
  - "README links the Discord invite only by location (src/_data/site.js), never by value; domain cutover documents Settings -> Pages -> Custom domain"

patterns-established:
  - "Workflow contract test: header (before jobs:) has only contents: read; build part has no write permissions; deploy part has no npm/setup-node"

requirements-completed: [FOUND-01]

coverage:
  - id: D1
    description: "pages.yml runs npm ci -> npm test -> npm run build with SITE_URL/PATH_PREFIX on PR and push; uploads _site/ and deploys only on push to main; write permissions only on the deploy job"
    requirement: FOUND-01
    verification:
      - kind: unit
        ref: "test/workflow.test.js#(a)-(f) (7 tests)"
        status: pass
      - kind: other
        ref: "grep -c acceptance checks (PATH_PREFIX, SITE_URL, id-token: write, pages: write, cache: npm each = 1); js-yaml parse of pages.yml"
        status: pass
    human_judgment: false
  - id: D2
    description: "The workflow actually deploys to https://inglourious-basterds-clan.github.io/IBC-Website/ after Pages is enabled"
    requirement: FOUND-01
    verification: []
    human_judgment: true
    rationale: "Requires the one-time GitHub Settings -> Pages -> Source: GitHub Actions change and a push to main; observable only on GitHub after the phase"
  - id: D3
    description: "Polish README documents Node.js 24, npm ci/dev/build/test, _site/ replacing the repo root as deploy folder, src/_data/site.js config, PowerShell and Git Bash subpath preview, Pages setting, domain cutover; no invite URL"
    requirement: FOUND-01
    verification:
      - kind: other
        ref: "Task 2 <automated> verify loop (14 required strings, no discord.gg) + 7 heading checks"
        status: pass
    human_judgment: true
    rationale: "Natural-Polish wording and clarity for the clan audience is a human judgment"

duration: 5min
completed: 2026-10-02
status: complete
---

# Phase 1 Plan 04: GitHub Pages Workflow + Polish README Summary

**`.github/workflows/pages.yml` builds and tests every PR and push with the GitHub Pages SITE_URL/PATH_PREFIX, and publishes `_site/` only on push to `main` through a least-privilege deploy job. A Polish README tells the clan that `_site/` is now the deploy folder and that `src/_data/site.js` is the one place for URL, prefix and the Discord invite.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-10-02T22:22Z (context reading; first file written 22:25Z)
- **Completed:** 2026-10-02T22:27Z
- **Tasks:** 2
- **Files modified:** 3 (+ 01-USER-SETUP.md)

## Accomplishments

- Workflow `Build and deploy`: triggers push (main), pull_request, workflow_dispatch; `contents: read` at workflow level; concurrency cancels only PR runs; build job `npm ci -> npm test -> npm run build -> upload-pages-artifact@v5 (skipped on PRs, path _site/)`; deploy job gated on `github.event_name != 'pull_request' && github.ref == 'refs/heads/main'` with `pages: write` + `id-token: write`, `github-pages` environment, `deploy-pages@v5` only.
- `test/workflow.test.js` (7 tests) locks assertions (a)-(f) from the plan; full suite now 28/28 green.
- Polish `README.md` with all seven required sections; no invite URL.

## Task Commits

1. **Task 1: GitHub Pages workflow (D-01..D-04)** - `8b47b6a` (feat)
2. **Task 2: Polish README (D-15, FOUND-01)** - `e380f0c` (docs)

**Plan metadata:** see the `docs(01-04)` commit that adds this SUMMARY.

## Files Created/Modified

- `.github/workflows/pages.yml` - CI build/test on PR and push, Pages deploy on push to main
- `test/workflow.test.js` - static contract test for the workflow shape
- `README.md` - Polish developer and deploy documentation
- `.planning/phases/01-eleventy-foundation/01-USER-SETUP.md` - the one-time Pages setting

## Decisions Made

- Followed RESEARCH Pattern 7 verbatim; only two explanatory comments added (header and the `npm test` step), worded so the contract test's string checks stay exact (`grep -c "pages: write"` = 1 etc.).
- README "Zmiana domeny" names `Settings → Pages → Custom domain` as the place to attach the domain.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Notes (not stubs)

- README describes `scripts/clean.js`, `src/_dev/` and "`npm run build` always deletes `_site/` first". These come from plan 01-05 (same phase, not yet executed). Until 01-05 lands, `npm run build` does not clean `_site/` and `src/_dev/` does not exist. The plan specifies this README content up front; no action needed if 01-05 executes as planned.

## User Setup Required

**GitHub Pages must be enabled once.** See [01-USER-SETUP.md](./01-USER-SETUP.md): github.com/Inglourious-Basterds-Clan/IBC-Website → Settings → Pages → Build and deployment → Source: **GitHub Actions**. Until then the `deploy` job fails on pushes to `main` (build/PR checks still pass). Nothing was pushed by this plan.

## Next Phase Readiness

- Ready for 01-05 (clean script + dev-only pages; it prepends `node scripts/clean.js && ` to the build script, which the workflow picks up unchanged).
- Phase 2's `check-seo.js` can be added as another `run:` step in the build job; the contract test only fixes the relative order of ci/test/build/upload.

---
*Phase: 01-eleventy-foundation*
*Completed: 2026-10-02*

## Self-Check: PASSED

- Files: pages.yml, workflow.test.js, README.md, 01-USER-SETUP.md, 01-04-SUMMARY.md all present
- Commits: 8b47b6a, e380f0c, 8694b68 found
- npm test: 28/28 pass; Task 2 verify loop passes; discord.gg count in README = 0
- FOUND-01 not yet marked complete: requirements.ready-ids reports a sibling plan in phase 01 still declares it (shared-ID gate)
