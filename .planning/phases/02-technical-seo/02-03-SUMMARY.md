---
phase: 02-technical-seo
plan: 03
subsystem: seo
tags: [title, meta-description, todo-markers, facts-register, seo-gate, node-test]
status: complete

requires:
  - phase: 02-technical-seo
    provides: "02-01 canonical/noindex head, isIndexableUrl predicate, scripts/check-seo.js checkSite with G0/G2/G7/G8/G9 and fixture helpers"
provides:
  - head.njk fullTitle (D-01 home title as is, D-02 ' | IBC' suffix, site-name fallback, never empty)
  - front-matter-only meta description (D-04, no fallback); keywords and author meta removed (D-14)
  - front-matter `todo` rendered as <!-- TODO(FACTS-NN) --> in the head (D-05)
  - src/index.njk front matter with the D-01 title, the drafted recruitment pitch (D-03, 156 chars) and todo FACTS-01
  - FACTS.md drafted-copy register (Polish), reused by Phase 4 CONT-06
  - test/facts.test.js marker <-> FACTS.md cross-check and marker-reaches-output check
  - gate rules G1 (title), G4 (description), G6 (no keywords), G10 (TODO markers, indexable builds only)
affects: [02-04 OG/twitter head block (og:title still legacy), 02-05 JSON-LD, phase-04 CONT-06 drafted copy, final SITE_INDEXABLE=1 cutover]

actuals:
  tokens: 5585
  tasks: 2
  commits: 2
plan_head_before: 2d2a7f82d8d200cabe5f3fd599357fc1e8d968cf
plan_head_after: 3a4c6f86173144433648882c26fb1142489ec99d

tech-stack:
  added: []
  patterns:
    - "Single head writer driven by front matter: title, description and todo come from the page, no site-wide fallbacks for descriptions"
    - "Drafted copy carries TODO(FACTS-NN) markers that reach the output; G10 blocks indexable builds until the clan confirms and removes them"
    - "Real-build tests never pin a draft ID: they accept only G10 problems that name open FACTS.md rows"

key-files:
  created:
    - FACTS.md
    - test/facts.test.js
  modified:
    - src/_includes/partials/head.njk
    - src/index.njk
    - scripts/check-seo.js
    - test/seo-gate.test.js
    - test/seo.test.js
    - test/layout.test.js
    - test/devpages.test.js

key-decisions:
  - "Home title also falls back to site.name when a future home page has no title, so the head never renders an empty <title> (SEO-01 empty edge)"
  - "G10 reports each marker as <relPath>:<line>: G10 unconfirmed draft marker TODO(FACTS-NN); problems are sorted by file, rule, then text so the output equals its own string sort"
  - "test/facts.test.js exempts the literal TODO({{ todo }}) in head.njk from the untracked-TODO check: it is the renderer of front-matter markers, not a draft"
  - "The CLI banner test accepts exit 1 on the real indexable build only when every reported problem is a G10 marker for an open FACTS.md row"

patterns-established:
  - "FACTS.md row format: | FACTS-NN | <where> | <drafted text> | do potwierdzenia / potwierdzone |"
  - "Marker convention: <!-- TODO(FACTS-NN): ... --> in a template body or todo: \"FACTS-NN\" in front matter (Nunjucks {# #} comments are not markers)"

requirements-completed: [SEO-01, SEO-08]

coverage:
  - id: D1
    description: "Home <title> is the D-01 string; subpages get ' | IBC'; untitled pages get 'Inglourious Basterds Clan | IBC'"
    requirement: SEO-01
    verification:
      - kind: integration
        ref: "test/seo.test.js#(h) home title and description (D-01, D-03, D-04)"
        status: pass
      - kind: integration
        ref: "test/seo.test.js#(i) subpage titles get the | IBC suffix and no empty tags (D-02, D-04)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Home has exactly one front-matter description (70-160 chars); no fallback description elsewhere; no meta keywords"
    requirement: SEO-01
    verification:
      - kind: integration
        ref: "test/seo.test.js#(h), (i), (j) no page carries meta keywords (D-14)"
        status: pass
    human_judgment: true
    rationale: "The pitch is drafted copy (FACTS-01); the clan must confirm its wording before the indexable cutover"
  - id: D3
    description: "Gate G1/G4/G6 fail their fixtures (empty, missing and duplicate titles naming both files, missing/empty/double description, keywords); 404 and /_dev/ exempt from G4"
    requirement: SEO-08
    verification:
      - kind: unit
        ref: "test/seo-gate.test.js#G1 *, G4 *, G6 meta keywords"
        status: pass
    human_judgment: false
  - id: D4
    description: "G10 fails indexable builds on TODO markers (one problem per marker, binaries ignored) and never fails preview builds; output stable and sorted"
    requirement: SEO-08
    verification:
      - kind: unit
        ref: "test/seo-gate.test.js#G10 TODO markers pass a preview build (D-19) / fail an indexable build / gate output is stable and sorted"
        status: pass
      - kind: other
        ref: "SITE_URL=https://example.org SITE_INDEXABLE=1 npm run build -> exit 1 naming G10 and TODO(FACTS-01); SITE_URL=https://guard.example npm run build -> exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "FACTS.md and source markers stay in sync; every marker reaches the output"
    requirement: SEO-08
    verification:
      - kind: unit
        ref: "test/facts.test.js (4 tests; mutation-checked: a 'potwierdzone' row with a live marker and an untracked TODO in style.css both fail)"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-10-07
---

# Phase 2 Plan 03: Titles, Descriptions and the Drafted-Copy Gate Summary

**Keyword-first home title with an automatic " | IBC" subpage suffix, front-matter-only meta descriptions, a TODO(FACTS-NN) marker convention registered in a new Polish FACTS.md, and gate rules G1/G4/G6/G10. G10 blocks SITE_INDEXABLE=1 builds while drafts are still unconfirmed.**

## Performance

- **Duration:** about 10 min
- **Completed:** 2026-10-07
- **Tasks:** 2
- **Files modified:** 9 (2 created, 7 modified)

## Accomplishments

- `head.njk` now writes `fullTitle`. The home page renders `Klan Arma 3 Milsim – Inglourious Basterds Clan (IBC)`, every other page renders `<title> | IBC`, and an untitled page falls back to `Inglourious Basterds Clan | IBC`. The description comes only from front matter. The keywords and author meta tags are gone. A front-matter `todo` value prints as `<!-- TODO(FACTS-NN) -->`.
- `src/index.njk` gets the D-01 title and a 156-character recruitment pitch built only from facts already on the site: a Polish clan, active since 2018, co-op operations, recruiting, Discord. The pitch is marked `todo: "FACTS-01"`.
- New gate rules in `scripts/check-seo.js`:
  - **G1:** exactly one non-empty title, unique across indexable pages. A duplicate is reported on both files, each naming the other.
  - **G4:** exactly one non-empty description on indexable pages.
  - **G6:** no keywords meta tag.
  - **G10:** any whole-word TODO in a shipped text file fails the build, on indexable builds only.
  - Problems are sorted by file, then rule, then text, so the output is stable.
- `FACTS.md` (Polish) explains the marker convention, the consequence for the build and the three confirmation steps. It holds the FACTS-01 row. `test/facts.test.js` keeps markers and rows in sync and checks that every marker reaches the output HTML.

## Task Commits

1. **Task 1: head title/description/TODO marker, home front matter, Phase 1 test updates, seo tests (h)-(j)**: `7c71863` (feat)
2. **Task 2: gate rules G1/G4/G6/G10, fixtures, FACTS.md, test/facts.test.js**: `3a4c6f8` (feat)

## Files Created/Modified

- `src/_includes/partials/head.njk`: isHome/fullTitle, description without fallback, TODO marker line, keywords and author removed
- `src/index.njk`: title, description and todo in the front matter
- `scripts/check-seo.js`: rules G1, G4, G6 and G10, and a stable three-key sort
- `test/seo-gate.test.js`: `validPage` takes title and description options; new G1/G4/G6/G10 and ordering fixtures; the real indexable build and CLI banner tests accept only open-draft G10 problems
- `test/seo.test.js`: tests (h), (i) and (j)
- `test/layout.test.js`, `test/devpages.test.js`: updated for the new title and the absent keywords tag
- `FACTS.md`: drafted-copy register
- `test/facts.test.js`: marker/register cross-check

## Decisions Made

See the `key-decisions` list in the frontmatter. The main one: the home title also falls back to `site.name` when a home page has no title, so the head never renders an empty title tag.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The CLI banner test required exit 0 on the real indexable build**
- **Found during:** Task 2
- **Issue:** `test/seo-gate.test.js` "CLI banner names the build kind" asserted `status 0` for the gate on the real `SITE_INDEXABLE=1` build. With G10 active and FACTS-01 open, that build now exits 1 by design (D-19).
- **Fix:** The test still asserts the INDEXABLE banner. It accepts exit 1 only when every stderr problem is a G10 marker for an open FACTS.md row, so it stays green after the user confirms the draft. This reuses the same `assertOnlyOpenDrafts` helper as the real-build test.
- **Files modified:** test/seo-gate.test.js
- **Commit:** 3a4c6f8

**2. [Rule 3 - Blocking] The untracked-TODO check would flag the head's marker renderer**
- **Found during:** Task 2
- **Issue:** `head.njk` contains the literal `<!-- TODO({{ todo }}) -->`, a whole-word TODO not followed by `(FACTS-`. Under the plan's rule as written, `test/facts.test.js` would flag it.
- **Fix:** The literal `TODO({{ todo }})` is stripped before the untracked-TODO scan. Every other TODO in src/ must still be `TODO(FACTS-NN)`.
- **Files modified:** test/facts.test.js
- **Commit:** 3a4c6f8

**3. [Rule 2 - Correctness] The home title falls back to the site name**
- **Found during:** Task 1
- **Issue:** The planned expression `title if isHome else ...` renders an empty `<title>` on a home page without a title.
- **Fix:** Changed it to `(title or site.name) if isHome else ...`. Current output is unchanged.
- **Files modified:** src/_includes/partials/head.njk
- **Commit:** 7c71863

## Known Stubs

None. FACTS-01 is intentionally drafted copy. It is tracked by its marker and FACTS.md, and G10 blocks it from reaching an indexable build. It is not a stub.

## Issues Encountered

- The Bash heredoc path collapsed `\\` in regex literals during the first edit of check-seo.js. The block was rewritten with the Edit tool and the module load was re-checked. The broken code was never committed.

## User Setup Required

Before the final `SITE_INDEXABLE=1` cutover:
1. Review the FACTS-01 description in `src/index.njk`.
2. Remove `todo: "FACTS-01"` from the front matter.
3. Set its FACTS.md row to `potwierdzone`.

## Next Phase Readiness

- 02-04 can replace the OG block. `og:title` and `og:description` still carry the legacy strings and can now reuse `fullTitle`/`description`.
- Phase 4 adds drafted copy as new FACTS.md rows using the same marker convention.

## Self-Check: PASSED

- FOUND: FACTS.md, test/facts.test.js, src/_includes/partials/head.njk, src/index.njk, scripts/check-seo.js
- FOUND: 7c71863, 3a4c6f8
- `npm test`: 113 tests, 0 failures. `SITE_URL=https://guard.example npm run build` exits 0. The indexable build exits 1 naming G10 and TODO(FACTS-01).
