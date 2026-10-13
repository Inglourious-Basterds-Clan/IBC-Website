---
phase: quick-261013-vh0
plan: 01
subsystem: home-page / build data / tests / docs
status: complete
tags: [privacy, gdpr, discord, review-fix, WR-01]
requires: []
provides:
  - "Home page with no Discord member badge and no Discord API traffic (browser or build)"
affects:
  - "Phase 04 records: WR-01 fixed, UAT/VERIFICATION item 3 resolved by removal, CONT-07 annotated"
tech-stack:
  added: []
  patterns:
    - "allowedHosts in test (d) acts as the project's connect-src equivalent: discord.com is no longer allowed in built HTML"
key-files:
  created: []
  modified:
    - src/index.njk
    - src/js/main.js
    - src/css/partials/recruitment.css
    - src/_data/site.js
    - test/modules.test.js
    - test/pages.test.js
    - test/links.test.js
    - test/helpers.js
    - test/docs.test.js
    - README.md
    - .planning/phases/04-join-operations-pages/04-REVIEW-DISPOSITION.md
    - .planning/phases/04-join-operations-pages/04-UAT.md
    - .planning/phases/04-join-operations-pages/04-VERIFICATION.md
    - .planning/REQUIREMENTS.md
  deleted:
    - src/js/modules/discord-badge.js
    - test/discord.test.js
    - src/_data/discordBadge.js
    - lib/discord.js
decisions:
  - "Discord member badge removed entirely (browser fetch and build-time count) by owner decision; supersedes phase 04 D-14/D-15/D-16 and fixes review WR-01"
  - "CONT-07 kept checked in REQUIREMENTS.md with a removal annotation so requirements tooling still parses it"
metrics:
  duration: 4 min
  completed: 2026-10-13
  tasks: 3
  files: 18
estimate:
  tokens: 45000
  tasks: 3
actuals:
  tokens: 12800
  tasks: 3
  commits: 3
plan_head_before: 3ccca67493fb1cf9ff5a2b2179870928d7ddf4c5
plan_head_after: 8f148f8760ad2e243fa6ddf04f5b9b7d086e4919
---

# Quick 261013-vh0 Plan 01: Remove Discord member badge Summary

Removed the home-page Discord member badge end to end (markup, browser module fetching discord.com/api, loader entry, CSS, build-time invite-count fetch in `src/_data/discordBadge.js` + `lib/discord.js`, `membersBackstop`, the build-time fetch switch and their tests/README docs), keeping every Discord invite link and the "Wejdź na Discord" CTA; review finding WR-01 is now recorded as fixed.

## Tasks

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 (tracer) | Badge gone from the page: markup, loader entry, browser module, CSS, pinned tests | c6a4277 | src/index.njk, src/js/main.js, src/css/partials/recruitment.css, test/modules.test.js, test/pages.test.js, test/links.test.js; deleted src/js/modules/discord-badge.js, test/discord.test.js |
| 2 | Drop build-time fetch, backstop and fetch switch; README (PL) + docs test | 0fe44df | src/_data/site.js, test/helpers.js, README.md, test/docs.test.js; deleted src/_data/discordBadge.js, lib/discord.js |
| 3 | Record WR-01 fixed by removal; annotate CONT-07 | 8f148f8 | 04-REVIEW-DISPOSITION.md, 04-UAT.md, 04-VERIFICATION.md, REQUIREMENTS.md |

## Verification

- Task 1 verify: targeted suites 180/180 pass; both deleted files absent; no `discord-badge` / `data-api-url` / `discord.com` anywhere in `src/`. Tracer gate re-run passed before expansion.
- Task 2 verify: `npm test` 398/398 pass; no reference to the badge data, helpers, backstop or fetch switch in src, lib, scripts, eleventy.config.js, .github, package.json, README.md, test/helpers.js, test/docs.test.js.
- Task 3 verify: table row and parsed front matter both read `disposition: fixed`, `open: 4`; UAT has 2 and VERIFICATION 4+ `quick 261013-vh0` mentions; VERIFICATION front matter still parses 7 human_verification items; CONT-07 annotated.
- Final `npm test` after all three commits: **398 tests, 398 pass, 0 fail**.
- `git status` afterwards still shows only the unrelated pre-existing edits (.planning/config.json, eight test/*.test.js files modified; .planning/milestone.lock, .planning/state.json untracked); none was staged or committed.

## Deviations from Plan

- **Minor wording:** in the 04-VERIFICATION.md anti-patterns row a period was added before the appended "Resolved 2026-10-13: …" sentence so the Impact cell reads as two sentences. No effect on parsing or verification.
- **Protected-branch guard:** the executor's pre-commit assertion flags `main` as a protected/default branch. Commits were made on `main` because the orchestrator explicitly directed sequential execution in the main checkout, the project uses `branching_strategy: none`, and all prior phase/quick commits live on `main`. The commits are local and unpushed.

Otherwise the plan was executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. The change only removes surface (one browser → discord.com request path and one build → discord.com request path).

## Self-Check: PASSED

- Deleted files absent: src/js/modules/discord-badge.js, test/discord.test.js, src/_data/discordBadge.js, lib/discord.js
- Commits present in HEAD history: c6a4277, 0fe44df, 8f148f8
