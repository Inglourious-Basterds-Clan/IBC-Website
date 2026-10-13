---
phase: 04-join-operations-pages
plan: 05
subsystem: seo-gate
tags: [seo, json-ld, breadcrumbs, faq, gate, node-test]

requires:
  - phase: 04-join-operations-pages
    provides: "04-01 breadcrumb partial, pageGraph BreadcrumbList/FAQPage, lib/html.js visibleText; 04-02 CR-01 fix (gate always runs)"
  - phase: 02-seo-foundation
    provides: "lib/check-seo.js checkSite, G1..G10, fixture helpers in test/seo-gate.test.js"
provides:
  - "Gate rule G11: visible nav.breadcrumbs + exactly one valid, prefix-correct BreadcrumbList on every indexable subpage; none on home (SEO-06, D-17)"
  - "Gate rule G12: FAQPage JSON-LD equals the visible details.faq-item FAQ, entity-safe via visibleText (D-05, Pitfall 6)"
  - "Module-private helpers jsonLdNodes, jsonLdNodesOfType, checkBreadcrumbs, checkFaq in lib/check-seo.js"
  - "Fixture helpers breadcrumbNode, breadcrumbGraph, breadcrumbNav, graphOf, faqPageNode, faqFixture; validPage breadcrumb/body options"
affects: [04-08 README gate rule list, any future subpage or FAQ]

actuals:
  tokens: 5871
  tasks: 2
  commits: 4
plan_head_before: 26a799b0546bbe6e9b59f81bc7c24fecab21ad94
plan_head_after: af67f11202f9dedbd32d35342a73ee5b67aca8b2

tech-stack:
  added: []
  patterns:
    - "Structured data vs visible page: the gate parses JSON-LD nodes (jsonLdNodes) and compares them with visibleText of the matching markup"
    - "validPage fixtures carry a valid breadcrumb trail by default on indexable subpages, so every older fixture stays a valid site with one thing broken"

key-files:
  created: []
  modified:
    - lib/check-seo.js
    - test/seo-gate.test.js

key-decisions:
  - "G11 compares visible links only when the BreadcrumbList itself is valid, so each broken fixture reports its own problem and not a cascade"
  - "G11 resolves root-relative breadcrumb hrefs with site.url (HtmlBasePlugin already added the prefix); an absolute href is compared as is"
  - "G12 stops after structural problems (FAQPage count, presence, mainEntity, Question fields) and after a count mismatch; otherwise it reports the first differing question and the first differing answer"
  - "JSON-LD strings are only whitespace-collapsed, never entity-decoded; the visible side always goes through lib/html.js visibleText (same as test/pages.test.js)"

patterns-established:
  - "New JSON-LD rule = a jsonLdNodesOfType lookup plus a visibleText comparison, one fixture per broken case"

requirements-completed: [SEO-06, CONT-02]

coverage:
  - id: D1
    description: "npm run build fails with a G11 line when an indexable subpage lacks a valid, prefix-correct BreadcrumbList or a matching visible trail, or when the home page has either; 404 and /_dev/ exempt"
    requirement: SEO-06
    verification:
      - kind: unit
        ref: "test/seo-gate.test.js#G11 * (16 fixtures: missing, two, one-item, positions, empty name, relative, foreign host, first item, last item, no nav, text, href, link count, home list, home nav, exempt)"
        status: pass
      - kind: integration
        ref: "test/seo-gate.test.js#real prefix build passes the gate"
        status: pass
      - kind: other
        ref: "SITE_URL=https://guard.example npm run build && MSYS_NO_PATHCONV=1 SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/ npm run build (check-seo: OK)"
        status: pass
    human_judgment: false
  - id: D2
    description: "npm run build fails with a G12 line when FAQPage JSON-LD and the visible FAQ differ in presence, count, order, question or answer text, or when the FAQPage is malformed; entities, Polish quotes, nbsp and TODO comments never cause a false mismatch"
    requirement: CONT-02
    verification:
      - kind: unit
        ref: "test/seo-gate.test.js#G12 * (13 fixtures incl. entity/draft-comment positive case)"
        status: pass
      - kind: integration
        ref: "test/seo-gate.test.js#real indexable build fails the gate only on open FACTS.md drafts"
        status: pass
      - kind: other
        ref: "npm test (403 pass, 0 fail)"
        status: pass
    human_judgment: false

duration: 6 min
completed: 2026-10-13
status: complete
---

# Phase 4 Plan 05: Gate Rules G11 (Breadcrumbs) and G12 (FAQPage = Visible FAQ) Summary

**The post-build SEO gate now fails `npm run build` when a subpage's breadcrumbs or FAQ structured data differ from what visitors see. G11 checks the visible trail and a prefix-correct BreadcrumbList (and that the home page has neither). G12 checks the FAQPage against the visible `<details class="faq-item">` list after visibleText decoding.**

## Performance

- **Duration:** about 6 min
- **Started:** 2026-10-13T17:58:23Z
- **Completed:** 2026-10-13T18:04:35Z
- **Tasks:** 2 (1 tracer, 1 TDD)
- **Files modified:** 2

## Accomplishments

- G11 (SEO-06, D-17). Each indexable subpage needs exactly one BreadcrumbList with at least 2 ListItems. Positions must run 1..n, every name must be non-empty, and every item must be absolute under `site.url + pathPrefix`. The first item must be the home URL and the last the canonical. The page also needs a visible `nav.breadcrumbs` whose link texts and resolved hrefs equal the JSON-LD names and items. The home page may carry neither a BreadcrumbList nor a trail. 404 and `/_dev/` pages are exempt.
- G12 (D-05). The FAQPage and the visible FAQ must exist together, and a page may have at most one FAQPage. `mainEntity` must be non-empty, and each Question needs a non-empty `name` and `acceptedAnswer.text`. Count and order must match, and the first differing question and the first differing answer are both reported. The visible side uses the shared `visibleText`, so `&quot; &amp; &#39; &#160;`, „Polish quotes” and `<!-- TODO(FACTS-NN) -->` inside a details element never cause a false failure.
- Both rules are wired into `checkSite` after G5 and keep the sorted `<relPath>: G<n> <text>` output. Root, `/IBC-Website/` and dev-page builds pass. The indexable build still fails only on G10 for open FACTS rows (13 G10 lines, nothing else).
- An ad-hoc mutation of the real `/jak-dolaczyc/` output (one answer changed, trail removed) produced exactly one G11 and one G12 line, so the rules do check the real pages.

## Task Commits

1. **Task 1: Tracer: G11 wired into checkSite** - `14e0e88` (feat)
2. **Task 2: G12 FAQPage equals the visible FAQ (TDD)**
   - RED: `abb30fe` (test)
   - GREEN: `05b46ca` (feat)
   - REFACTOR: none needed
3. **Line-ending fix (deviation)** - `af67f11` (fix)

## TDD Gate Compliance

- **RED** (`abb30fe`): 13 G12 fixtures were added before any implementation. `node --test --test-reporter=tap test/seo-gate.test.js` exited 1 with 10 of 88 tests failing, all of them the new negative G12 fixtures. The 3 positive fixtures passed, as they should with no rule present. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (reason `target_test_failed`) for the target "G12 questions in a different order". Semantic assessment: the target ran and failed on its planned `assertProblem` assertion, because the gate returned no problems at all (`(none)`) for an otherwise valid fixture. There were no load, syntax or fixture errors, and all 78 pre-existing and G11 tests stayed green.
- **GREEN** (`05b46ca`): `checkFaq` added. All 88 seo-gate tests and the full 403-test suite pass.
- **REFACTOR:** none. The implementation was already small and reuses `jsonLdNodesOfType` and `collapseSpace` from Task 1.

## Files Created/Modified

- `lib/check-seo.js`: G11/G12 in the header rule list; `visibleText` import; `jsonLdNodes`, `jsonLdNodesOfType`, `collapseSpace`, `breadcrumbEntries`, `checkBreadcrumbs`, `visibleFaq`, `checkFaq`; both rules called in the page loop
- `test/seo-gate.test.js`: breadcrumb and FAQ fixture helpers; `validPage` gains the `breadcrumb` and `body` options (indexable subpages get a valid trail and BreadcrumbList by default); 16 G11 and 13 G12 tests

## Decisions Made

See `key-decisions` in the frontmatter. In short, each broken fixture reports its own problem instead of a cascade, and the visible side is always compared through `visibleText`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Editing tool converted both files to CRLF**
- **Found during:** SUMMARY metrics (after Task 2)
- **Issue:** `git diff --stat` showed 890 and 1575 changed lines. The Edit tool had written `lib/check-seo.js` and `test/seo-gate.test.js` with CRLF line endings. The repo stores LF (`core.autocrlf=false`, no `.gitattributes`), so every line looked changed in commits `14e0e88`..`05b46ca`.
- **Fix:** Converted both files back to LF and replaced one non-ASCII `…` in a new comment with `...` (the file was ASCII-only before). The net plan diff is now +458/-7.
- **Files modified:** lib/check-seo.js, test/seo-gate.test.js
- **Verification:** `git ls-files --eol` shows `i/lf w/lf` for both files; `npm test` 403/403 pass; both builds print `check-seo: OK`
- **Commit:** `af67f11`

**2. [Scope addition] Extra G11 fixtures beyond the plan's list**
- A link-count mismatch problem (`visible breadcrumbs show N links, the BreadcrumbList has M items`) and a ListItem `@type` check were added. Without the count check, a trail missing a link would be compared index by index against the wrong entries. A fixture covers the count case, and the G12 wrong-`@type` case is covered too.

**Total deviations:** 1 auto-fixed bug and 1 small scope addition. **Impact:** The intermediate commits carry CRLF churn, but the final tree and the net diff are clean. Behaviour is unchanged.

**Note on branch:** The commits were made on `main`, as the orchestrator instructed (sequential executor, `branching_strategy: none`). The generic protected-branch assertion reports `main` as protected, but the orchestrator's explicit instruction and the earlier phase-4 plans both commit there.

## Issues Encountered

None besides the line-ending deviation.

## Known Stubs

None. The `TODO(FACTS-04)` string in `test/seo-gate.test.js` is fixture input that proves G12 ignores draft comments. It is not shipped output.

## Next Phase Readiness

- 04-08 (README) can list G11 and G12 with the problem texts above.
- Any new subpage with front matter `breadcrumb` is checked automatically. A new FAQ must come with a matching FAQPage, or the build fails.

## Self-Check: PASSED

- FOUND: lib/check-seo.js, test/seo-gate.test.js, .planning/phases/04-join-operations-pages/04-05-SUMMARY.md
- FOUND commits: 14e0e88, abb30fe, 05b46ca, af67f11 (all ancestors of HEAD)
- Acceptance: checkBreadcrumbs 1, report(11 10, G11 in lib 3, "G11 " in tests 34; checkFaq 1, report(12 10, visibleText 5, "G12 " in tests 25
- `npm test` 403 pass / 0 fail; root and /IBC-Website/ builds `check-seo: OK`; indexable build fails on 13 G10 lines only
