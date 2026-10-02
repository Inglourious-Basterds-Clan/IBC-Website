---
phase: 01-eleventy-foundation
plan: 03
subsystem: client-js
tags: [javascript, scroll-spy, recruitment-terminal, discord-invite, textContent, node-vm, tdd]

requires:
  - phase: 01-01
    provides: "#terminal-console data-discord-url rendered from site.discord.invite; src/js/main.js moved under src/"
  - phase: 01-02
    provides: "nav hrefs of the form /#id from navigation.js; id=\"hero\" on the hero section; header CTA outside nav ul"
provides:
  - "runBootSequence(consoleEl, discordUrl): terminal invite comes from data-discord-url, printed without its scheme"
  - "writeToConsole builds time/tag/message spans with textContent (no innerHTML sink)"
  - "initScrollSpy filters nav links by link.hash && link.pathname === window.location.pathname and matches link.hash === '#' + id"
  - "test/client.test.js: node:vm stub-DOM harness plus 9 terminal/scroll-spy/static tests"
affects: [01-05, 01-06, phase-4-pages, phase-5-a11y]

actuals:
  tokens: 3188   # chars/4 over the realized diff (12751 chars)
  tasks: 2
  commits: 4
plan_head_before: 64eec5bd5ea423d38ea33a56ceb9b60a56d3d328
plan_head_after: 8399ee089830e59a8bf3866f8e0fbd7813c3d72b

tech-stack:
  added: []
  patterns:
    - "Client JS reads build-time config from data-* attributes, never from literals"
    - "Client behaviour tested by running main.js in node:vm against a stub DOM (no jsdom dependency)"
    - "Scroll-spy uses resolved anchor hash/pathname, so href form and path prefix do not matter"

key-files:
  created:
    - test/client.test.js
  modified:
    - src/js/main.js

key-decisions:
  - "Test 4 uses the build.test.js invite regex with the scheme made optional, so the scheme-less display copy (discord.gg/...) counts as a literal; the strict regex would have passed against the old code"
  - "Scroll-spy match uses string concatenation ('#' + id) rather than a template literal, matching the plan's grep contract"
  - "Visiting /IBC-Website/index.html leaves scroll-spy inactive (pathname differs from the directory URL); accepted per RESEARCH Pitfall 7"

patterns-established:
  - "New client features that need config get it from a data-* attribute on their root element"
  - "test/client.test.js loadMain({ discordUrl, withTerminal, pathname, links, sections }) is the harness to extend for future main.js behaviour"

requirements-completed: [FOUND-02, FOUND-04, FOUND-06]

coverage:
  - id: D1
    description: "Recruitment terminal prints 'Połączenie nawiązane: ' + invite without scheme, sourced from data-discord-url; boots without the attribute; no invite literal in main.js"
    requirement: FOUND-04
    verification:
      - kind: unit
        ref: "test/client.test.js#terminal prints the invite from data-discord-url without its scheme"
        status: pass
      - kind: unit
        ref: "test/client.test.js#terminal boots without data-discord-url"
        status: pass
      - kind: unit
        ref: "test/client.test.js#main.js has no invite literal and writeToConsole uses textContent"
        status: pass
    human_judgment: false
  - id: D2
    description: "Terminal lines are time/tag/message spans set with textContent; writeToConsole assigns no innerHTML (T-01-07)"
    requirement: FOUND-02
    verification:
      - kind: unit
        ref: "test/client.test.js#terminal lines are three spans (time, tag, message)"
        status: pass
      - kind: unit
        ref: "test/client.test.js#main.js is a valid classic script (node --check)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Scroll-spy highlights by resolved hash at / and under /IBC-Website/, maps the header to #hero, ignores hash-less links, and creates no observer on pages the nav does not point at"
    requirement: FOUND-06
    verification:
      - kind: unit
        ref: "test/client.test.js#scroll-spy highlights the intersecting section's link under /IBC-Website/"
        status: pass
      - kind: unit
        ref: "test/client.test.js#scroll-spy maps the fixed header to #hero"
        status: pass
      - kind: unit
        ref: "test/client.test.js#scroll-spy is inert on a page the nav links do not point at"
        status: pass
      - kind: unit
        ref: "test/client.test.js#scroll-spy ignores nav links without a hash"
        status: pass
    human_judgment: true
    rationale: "The stub assumes HTMLAnchorElement.hash/.pathname resolve as specified (RESEARCH A1); real-browser scrolling at / and /IBC-Website/ is confirmed in the plan 01-06 D-07 checklist"

duration: 3min
completed: 2026-10-02
status: complete
---

# Phase 1 Plan 03: Terminal Invite from the DOM and Hash-Based Scroll-Spy Summary

**The recruitment terminal now reads the Discord invite from `#terminal-console[data-discord-url]` and writes each line as three `textContent` spans. Scroll-spy matches nav links by resolved `link.hash` and only considers links whose `pathname` is the current page, so the `active-nav` highlight works again with the `/#…` hrefs at the root and under `/IBC-Website/`.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-02T22:20:04Z
- **Completed:** 2026-10-02T22:22:49Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- The last invite literal is gone from client JS. The connection line is `'Połączenie nawiązane: ' + discordUrl.replace(/^https?:\/\//, '')`, so with `site.discord.invite = https://discord.gg/DhJwkeehJK` the visible text is unchanged (`discord.gg/DhJwkeehJK`). A missing attribute falls back to `''` and the boot sequence still runs.
- `writeToConsole` no longer interpolates HTML. Time, tag and message are separate `span`s set with `textContent`, and the tag color expression is the same as before. `.terminal-line` is a flex row with a 10 px gap, so dropping the whitespace text nodes changes nothing visually (T-01-07 mitigated).
- Scroll-spy works again. Plan 01-02 had left it inert, because `/#hero` never equalled `#hero`. It now compares resolved hashes, keeps the HEADER to `#hero` fallback, the `rootMargin` and the empty-list guard, and creates no observer on pages such as `/_dev/layout-test/`.
- `test/client.test.js` (237 lines, 9 tests) runs `src/js/main.js` in `node:vm` with a stub DOM: `document`, `window.location`, an `IntersectionObserver` that records its callback and targets, and an immediate `setTimeout`. No dependency was added, and `test/helpers.js` is untouched.
- `npm test` passes 21/21: 5 build + 7 layout + 9 client.

## Task Commits

1. **Task 1 RED: failing terminal tests** - `1a19c2b` (test)
2. **Task 1 GREEN: terminal reads the invite from data-discord-url** - `afa891e` (feat)
3. **Task 2 RED: failing scroll-spy tests** - `5363c4d` (test)
4. **Task 2 GREEN: scroll-spy matches nav links by resolved hash** - `8399ee0` (feat)

No REFACTOR commits were needed.

**Plan metadata:** see the docs commit for this SUMMARY

## TDD Gate Compliance
- **Task 1:** The RED run had Tests 1-4 failing on assertions and Test 5 (`node --check`) passing. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` for target "terminal prints the invite from data-discord-url without its scheme". GREEN: 5/5.
- **Task 2:** The RED run had Tests 6-9 failing on assertions (Test 8: "scroll-spy created an IntersectionObserver"). `RED_EVIDENCE_OK` for target "scroll-spy highlights the intersecting section's link under /IBC-Website/", and Test 8 is listed among the failing tests. GREEN: 9/9.
- Each `test(01-03)` commit comes before its `feat(01-03)` commit.

## Files Created/Modified
- `src/js/main.js` - `initRecruitmentTerminal`/`runBootSequence`/`writeToConsole` (invite from the DOM, textContent spans) and the `initScrollSpy` matching logic. `initMobileMenu`, `initLightbox` and `initEasterEgg` are untouched.
- `test/client.test.js` - node:vm stub-DOM harness and Tests 1-9

## Decisions Made
See `key-decisions` in the frontmatter.

## Deviations from Plan

### Plan acceptance-criterion conflict (documented, no code change)

**1. [Plan defect] `grep -c "runBootSequence(consoleEl, discordUrl)"` prints 2, not 1**
- **Found during:** Task 1 acceptance gate
- **Issue:** The criterion's pattern is a substring of the definition line that the next criterion requires (`function runBootSequence(consoleEl, discordUrl)`). Both criteria cannot print 1 at the same time.
- **Resolution:** The intent is one call and one definition. `grep -n` shows line 133 (call) and line 142 (definition). Excluding the definition, `grep "runBootSequence(consoleEl, discordUrl)" | grep -vc "function "` prints 1. The key_link pattern is still satisfied. No code change was needed.

### Test-design note

**2. [Rule 2 - Test strength] Test 4 invite regex has an optional scheme**
- **Found during:** Task 1 RED
- **Issue:** The `inviteDomainPattern` in build.test.js requires `https?://`. The old main.js held only the scheme-less display copy `discord.gg/DhJwkeehJK`, so the strict regex would not have caught it.
- **Fix:** client.test.js uses the same pattern with `(?:https?:\/\/)?`. Test 4 then failed on that assertion in RED, as the plan intended.
- **Commit:** 1a19c2b

---

**Total deviations:** 1 plan-criterion conflict (documented), 1 test-strength adjustment
**Impact on plan:** None on behaviour. All other acceptance criteria print the expected values.

## Issues Encountered
None.

## Known Stubs
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Scroll-spy and the terminal behave correctly at `/` and under `/IBC-Website/` in tests. The real-browser check (scroll through every section at both bases, terminal connection line) belongs to the plan 01-06 D-07 checklist.
- Future main.js behaviour can be tested by extending `loadMain(...)` in `test/client.test.js`.

---
*Phase: 01-eleventy-foundation*
*Completed: 2026-10-02*

## Self-Check: PASSED

`src/js/main.js` and `test/client.test.js` exist. Commits 1a19c2b, afa891e, 5363c4d and 8399ee0 are in history (`git rev-list --count 64eec5b..HEAD` = 4). All Task 1 and Task 2 acceptance criteria were re-run and print the expected values, apart from the documented grep-count conflict. `node --test test/client.test.js` passes 9/9 and `npm test` passes 21/21.
