---
phase: 04-join-operations-pages
plan: 03
subsystem: ui
tags: [discord, eleventy-global-data, intersection-observer, fetch, intl-pluralrules, css]

requires:
  - phase: 03
    provides: data-js module loader (src/js/main.js), CSS bundle partials, check-perf JS/CSS budgets
provides:
  - lib/discord.js (inviteApiBase, inviteCode, inviteApiUrl, floorCount, personWord, fallbackText, fetchInviteCounts)
  - global data discordBadge { apiUrl, fallbackText } with DISCORD_FETCH=0 switch and committed backstop
  - site.discord.membersBackstop (240)
  - src/js/modules/discord-badge.js and loader key 'discord-badge'
  - markup/CSS contract .recruitment-cta-group, .discord-badge, .discord-badge-members, .discord-badge-online
  - test/discord.test.js (builds discord-root, discord-prefix)
affects: [04-07 home teaser (must keep button + badge together), 04-08 README (DISCORD_FETCH), phase 5 PERF-08]

actuals:
  tokens: 8200
  tasks: 3
  commits: 4
plan_head_before: bb46ddf90a05030fb8891b9af337a565d88e2221
plan_head_after: 72b019fa46512e358dec57e58c81ce81428b6bb0

tech-stack:
  added: []
  patterns:
    - "Build-time network data: memoized async global data, env switch to skip the network, committed backstop, never throws"
    - "Test builds default DISCORD_FETCH=0 in runBuild; variants may override"
    - "Client module fetches only a build-time URL from a data-* attribute, validated by prefix, textContent only, silent .catch"

key-files:
  created:
    - lib/discord.js
    - src/_data/discordBadge.js
    - src/js/modules/discord-badge.js
    - test/discord.test.js
  modified:
    - src/_data/site.js
    - src/index.njk
    - src/js/main.js
    - src/css/partials/recruitment.css
    - test/helpers.js
    - test/modules.test.js
    - test/links.test.js

key-decisions:
  - "Baked fallback shows members only ('Discord: 200+ osób'); the online count appears only after the live update"
  - "discord-badge.js size guard is 800 B gzip (measured 775 B): the plan's 700 B aim cannot hold the guards the plan requires"
  - "A started flag in the observer callback guarantees one fetch even if the callback fires again after disconnect"

patterns-established:
  - "DISCORD_FETCH exactly '0' skips the build-time Discord call; any failure uses site.discord.membersBackstop"

requirements-completed: [CONT-07]

coverage:
  - id: D1
    description: "Home recruitment card bakes 'Discord: N+ osób' from the build-time count or the backstop, at the root and under /IBC-Website/"
    requirement: CONT-07
    verification:
      - kind: integration
        ref: "test/discord.test.js#root and prefix builds bake one badge with the API URL and the backstop text"
        status: pass
      - kind: integration
        ref: "DISCORD_FETCH=0 SITE_URL=https://guard.example npm run build (200+ osób) and SITE_URL=https://guard.example npm run build (networked, baked count)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Live badge module replaces the baked text with 'N osób · M online' on first intersection; every failure keeps the fallback silently"
    requirement: CONT-07
    verification:
      - kind: unit
        ref: "test/discord.test.js#end to end: the built data-api-url becomes live member and online text"
        status: pass
      - kind: unit
        ref: "test/discord.test.js#failed or malformed responses leave both spans unchanged"
        status: pass
    human_judgment: false
  - id: D3
    description: "lib/discord.js rounding, Polish plural and fetch failure modes"
    requirement: CONT-07
    verification:
      - kind: unit
        ref: "test/discord.test.js#floorCount rounds down at its 10 and 100 boundaries"
        status: pass
      - kind: unit
        ref: "test/discord.test.js#fetchInviteCounts returns null on malformed bodies"
        status: pass
    human_judgment: false
  - id: D4
    description: "Single-line badge with no layout shift on live update, JS-off fallback, backstop value 240 acceptable"
    requirement: CONT-07
    verification:
      - kind: unit
        ref: "test/discord.test.js#the badge reads 'Discord: N+ osób/osoby/osoba' with an empty online span"
        status: pass
    human_judgment: true
    rationale: "Layout shift, JS-off rendering and the backstop number need the Task 3 human-check in a real browser (Chrome 1280/390 px, DevTools Performance)"

duration: 25min
completed: 2026-10-13
status: complete
---

# Phase 4 Plan 03: Live Discord Badge Summary

**Home recruitment card now shows "Discord: 200+ osób" baked at build time (live count or committed backstop) and a 775 B module that swaps in "246 osób · 108 online" from the Discord invite API when the badge nears the viewport, failing silently.**

## Performance

- **Duration:** about 25 min of work (run interrupted by an API usage limit and resumed)
- **Started:** 2026-10-12T16:11:47Z
- **Completed:** 2026-10-13T17:06:21Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- `lib/discord.js`: the invite code is validated, the API URL is built at build time, counts are rounded down (>=100 to 50, 10-99 to 10), Polish plurals come from `Intl.PluralRules`, and `fetchInviteCounts` reads only the two count fields, uses a 5 s timeout, and never throws or logs.
- `src/_data/discordBadge.js`: memoized global data. `DISCORD_FETCH=0` skips the network, and any failure falls back to `site.discord.membersBackstop` (240, rendered as "200+ osób").
- `discord-badge` module behaviour: it refuses any URL outside `https://discord.com/api/` and fetches once on first intersection (rootMargin 200px) with `credentials: 'omit'` and `referrerPolicy: 'no-referrer'`. It accepts only non-negative integer counts and writes them with textContent; `.catch` keeps the baked text on any failure.
- The badge is a single nowrap/ellipsis HUD line under "Wejdź na Discord" inside `.recruitment-cta-group`. The "20+ Aktywnych członków" stat is unchanged.
- Test builds never call Discord: `runBuild` defaults `DISCORD_FETCH=0` and strips an inherited value.
- Budgets after the plan: CSS 4003 / 5120 B gz, home JS 5648 / 6144 B gz.

## Task Commits

1. **Task 1: Tracer (invite → baked fallback → module → live text)** - `4af32ee` (feat)
2. **Task 2: Failure modes, boundaries, guards**: RED `8287acb` (test), GREEN `60a9791` (feat)
3. **Task 3: Single-line styling and build-output guarantees** - `72b019f` (feat)

## TDD Gate Compliance (Task 2)

- **RED** `8287acb`: I wrote 26 behaviour tests. Run with `node --test --test-reporter=tap test/discord.test.js`, it exited 1 with 26 passing and 2 failing. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (target_test_failed).
  - Target: "the observer disconnects after the first intersection and fetch runs once". It failed on its planned assertion: fetch ran twice (2 !== 1) because there was no once-guard.
  - The second failure was the planned module size (800 B gzip).
  - Semantic assessment: both failures are genuine. The other tests passed because the Task 1 tracer had already built those behaviours.
- **GREEN** `60a9791`: I added a `started` flag, inlined the plural lookup and shortened the comments. The module went from 800 B to 775 B gzip, and 28/28 tests pass.
- **REFACTOR:** none needed.

## Files Created/Modified
- `lib/discord.js` - build-time invite helpers and the count fetch
- `src/_data/discordBadge.js` - global data `discordBadge` { apiUrl, fallbackText }
- `src/_data/site.js` - `discord.membersBackstop: 240`
- `src/index.njk` - `.recruitment-cta-group` wrapping the Discord button and the badge paragraph
- `src/js/main.js` - loader entry `'discord-badge'`
- `src/js/modules/discord-badge.js` - live badge module
- `src/css/partials/recruitment.css` - `.recruitment-cta-group` and `.discord-badge` rules
- `test/helpers.js` - `DISCORD_FETCH` in `buildEnvKeys`, default `"0"` in `runBuild`
- `test/modules.test.js` - hook list gains `discord-badge`, test renamed to "main.js maps every hook to a literal module import"
- `test/links.test.js` - `discord.com` allowed host (badge API URL)
- `test/discord.test.js` - 32 tests: lib units, stub-DOM module tests, static source checks, build output

## Decisions Made
- Only the member count is baked. The online count appears only after the live update, because a baked one goes stale.
- The module size guard is 800 B gzip instead of the 700 B aim (see the deviation below).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fetch could run twice if the observer callback fired again after disconnect**
- **Found during:** Task 2 (RED)
- **Issue:** The module relied on `disconnect()` alone, so a second callback triggered a second fetch.
- **Fix:** Added a `started` flag checked before the fetch.
- **Files modified:** src/js/modules/discord-badge.js
- **Verification:** test "the observer disconnects after the first intersection and fetch runs once" passes
- **Committed in:** 60a9791

**2. [Plan aim not met] discord-badge.js is 775 B gzip, not under 700 B**
- **Found during:** Task 2 (GREEN)
- **Issue:** The plan aimed for under 700 B gzip. Every guard the plan requires (URL prefix, span presence, IntersectionObserver check, AbortSignal feature check, `response.ok`, integer counts, `.catch`) adds up to about 775 B even with short comments. Reaching 700 B would mean dropping some of them.
- **Fix:** The test size cap is 800 B, with a comment that records the measurement. The home page JS total (5648 B) stays under BUDGET.initialJsGzipMaxBytes (6144 B), so `lib/check-perf.js` is unchanged.
- **Files modified:** test/discord.test.js
- **Committed in:** 60a9791

---

**Total deviations:** 2 (1 auto-fixed bug, 1 size aim relaxed with measurement)
**Impact on plan:** No scope change. Home JS headroom is now 496 B under the 6144 B cap, which matters for later JS work in 04-07/04-08.

## Issues Encountered
- The worktree had no `node_modules`, so I ran `npm ci` from the existing lockfile. No packages were added.
- The run was cut off by an API usage limit after Task 2 and resumed for Task 3.

## Known Stubs
None. The empty `.discord-badge-online` span is intentional: the online count is filled only by the live update (plan prohibition: no baked online count).

## Threat Flags
None. The new network surface (the visitor's browser calling discord.com and the build calling discord.com) is covered by T-04-09..T-04-12 in the plan's threat model.

## User Setup Required
None. `DISCORD_FETCH=0` is optional, for offline builds. Plan 04-08 documents it in the README.

## Next Phase Readiness
- End-of-phase human check (Task 3) is still open. In Chrome at 1280 and 390 px, check that the live update causes no layout shift, that the line reads "Discord: 200+ osób" with JS off, that going offline leaves no uncaught error, and confirm the backstop of 240.
- Plan 04-07 must keep `.recruitment-cta-group` (button + badge) together when it trims the recruitment section.
- Assumptions A2 (no rate limit on single anonymous GETs) and A3 (a 429 without CORS may log a console error) stay open for Phase 5.

---
*Phase: 04-join-operations-pages*
*Completed: 2026-10-13*
