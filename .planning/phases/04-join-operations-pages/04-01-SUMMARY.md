---
phase: 04-join-operations-pages
plan: 01
subsystem: content-pages
tags: [eleventy, nunjucks, json-ld, breadcrumbs, faq, seo]

requires:
  - phase: 02-seo-foundation
    provides: head.njk canonical/todo markers, jsonLd filter, isIndexableUrl, sitemap, check-seo gate
  - phase: 03-performance
    provides: icon shortcode, CSS bundle and perf gate (unchanged here)
provides:
  - /jak-dolaczyc/ page (requirements, 6 D-02 steps, Discord CTA, 15-question native FAQ)
  - src/_data/join.js (requirements, steps, faq) as the single source of page and FAQPage JSON-LD
  - partials/breadcrumbs.njk rendered by base.njk for any page with front matter `breadcrumb`
  - lib/schema.js buildBreadcrumbList, buildFaqPage, buildPageGraph + pageGraph filter
  - lib/html.js visibleText (entity-decoding visible-text helper for tests and gate)
  - test/pages.test.js (pages-root / pages-prefix builds), extended by 04-04 and 04-07
  - data-file draft marker form `draft: "TODO(FACTS-NN)"`; FACTS-03..05 rows
affects: [04-04 operacje page, 04-05 gate rules G11/G12, 04-06 pages.css, 04-07 nav]

actuals:
  tokens: 10164
  tasks: 2
  commits: 3
plan_head_before: bb46ddf90a05030fb8891b9af337a565d88e2221
plan_head_after: f8d1cd064a6af4e50716b307c989111cd269f5e5

tech-stack:
  added: []
  patterns:
    - "Front matter `breadcrumb` drives both the visible trail (base.njk) and BreadcrumbList JSON-LD (head.njk)"
    - "Front matter `faqSchema: true` passes join.faq to pageGraph so accordion and FAQPage share one array"
    - "Drafted data entries carry `draft: \"TODO(FACTS-NN)\"`, printed as an HTML comment, never inside text"

key-files:
  created:
    - src/_data/join.js
    - src/jak-dolaczyc.njk
    - src/_includes/partials/breadcrumbs.njk
    - test/pages.test.js
  modified:
    - src/_includes/layouts/base.njk
    - src/_includes/partials/head.njk
    - lib/schema.js
    - lib/html.js
    - eleventy.config.js
    - FACTS.md
    - test/schema.test.js
    - test/seo.test.js

key-decisions:
  - "BreadcrumbList items are absolute on site.url + pathPrefix, the last item included (equals the canonical)"
  - "buildPageGraph adds FAQPage only for a non-empty faq array; null/undefined/[] give BreadcrumbList only"
  - "assertNoForbiddenContent now checks Organization keys only when the graph has an Organization (subpage graphs have none); the home test still asserts exactly one Organization via nodeOfType"
  - "Status line drafted as 'Status // Rekrutacja otwarta' and marked FACTS-03 with description and intro"

patterns-established:
  - "Subpage JSON-LD: one ld+json block per indexable subpage, @graph types limited to BreadcrumbList/FAQPage"
  - "Visible-vs-JSON-LD comparison goes through lib/html.js visibleText"

requirements-completed: [CONT-01, CONT-02, CONT-06, SEO-06]

coverage:
  - id: D1
    description: "/jak-dolaczyc/ with one h1, requirements list, exactly 6 D-02 steps in order and a Discord CTA, gentle 3-day wording, no hardcore/removal wording"
    requirement: CONT-01
    verification:
      - kind: integration
        ref: "test/pages.test.js#(root|prefix build) join page: requirements and the six D-02 steps in order (CONT-01)"
        status: pass
      - kind: integration
        ref: "test/pages.test.js#(root|prefix build) join page: Discord CTA and the confirmed D-02 wording"
        status: pass
    human_judgment: false
  - id: D2
    description: "15-question native details/summary FAQ whose FAQPage JSON-LD equals the visible questions and answers"
    requirement: CONT-02
    verification:
      - kind: integration
        ref: "test/pages.test.js#(root|prefix build) join page: native FAQ accordion equals the FAQPage JSON-LD (CONT-02, D-04, D-05)"
        status: pass
      - kind: unit
        ref: "test/schema.test.js#(unit) buildFaqPage maps question/answer and ignores id and draft"
        status: pass
    human_judgment: false
  - id: D3
    description: "Visible breadcrumb trail and prefix-correct BreadcrumbList on /jak-dolaczyc/; none on home; no JSON-LD on 404/_dev"
    requirement: SEO-06
    verification:
      - kind: integration
        ref: "test/pages.test.js#(root|prefix build) join page: breadcrumb trail and prefix-correct BreadcrumbList (SEO-06)"
        status: pass
      - kind: integration
        ref: "test/schema.test.js#(root|prefix build) only home and indexable subpages carry JSON-LD"
        status: pass
      - kind: other
        ref: "SITE_URL=https://guard.example npm run build && MSYS_NO_PATHCONV=1 SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/ npm run build (check-seo OK, check-perf OK)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Drafted texts (description, status line, intro, FAQ doswiadczenie/obecnosc) marked TODO(FACTS-03..05) in output with FACTS.md rows"
    requirement: CONT-06
    verification:
      - kind: integration
        ref: "test/facts.test.js#every source marker reaches the build output"
        status: pass
      - kind: integration
        ref: "test/pages.test.js#(root|prefix build) join page: every drafted FAQ entry carries its marker comment (CONT-06)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Polish copy tone (casual but disciplined, D-03) of requirements, steps and FAQ answers"
    verification: []
    human_judgment: true
    rationale: "Tone and naturalness of Polish copy need a native-speaking clan member; drafts are also tracked in FACTS.md"

duration: ~45 min active (wall clock spans an API usage-limit interruption)
completed: 2026-10-13
status: complete
---

# Phase 4 Plan 01: Join Page (/jak-dolaczyc/) Summary

**/jak-dolaczyc/ built from src/_data/join.js: 6 requirements, the six D-02 join steps, a Discord CTA and a 15-question native FAQ, with visible breadcrumbs and a prefix-correct BreadcrumbList + FAQPage JSON-LD generated from the same data**

## Performance

- **Duration:** about 45 min of active work (started 2026-10-12T16:11:24Z, finished 2026-10-13T17:05Z; the run was paused by an API usage limit in between)
- **Tasks:** 2 (1 tracer, 1 TDD)
- **Files modified:** 12 (4 created, 8 modified)

## Accomplishments

- New page `/jak-dolaczyc/` (one h1, `#wymagania`, `#kroki`, `#faq`, `.page-cta`), in the sitemap, passing check-seo and check-perf at the root and under `/IBC-Website/`
- One front-matter key (`breadcrumb`) drives the visible `nav.breadcrumbs` (an `<ol>`) and the BreadcrumbList JSON-LD. Home has neither, and 404 and `_dev` pages carry no JSON-LD
- FAQPage JSON-LD and the `<details class="faq-item">` accordion read the same `join.faq` array. Tests compare them through `visibleText`
- Drafts are marked: FACTS-03 (description, status line, intro), FACTS-04 (FAQ `doswiadczenie`), FACTS-05 (FAQ `obecnosc`). FACTS.md also documents the `draft:` data-field marker form

## Task Commits

1. **Task 1: Tracer for /jak-dolaczyc/ with breadcrumbs, BreadcrumbList, sitemap and both gates** - `33bcd10` (feat)
2. **Task 2: FAQ accordion + FAQPage JSON-LD (TDD)**
   - RED: `eb09c10` (test)
   - GREEN: `f8d1cd0` (feat)
   - REFACTOR: none needed

## TDD Gate Compliance

- **RED** (`eb09c10`): new tests in test/schema.test.js (buildFaqPage, buildPageGraph with faq) and test/pages.test.js (visibleText unit, join.faq data checks, build-output FAQ vs JSON-LD, draft markers). `node --test --test-reporter=tap test/schema.test.js test/pages.test.js` exited 1 with 9 of 31 tests failing. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` for the target "(unit) buildFaqPage maps question/answer and ignores id and draft". Semantic assessment: every failure was on a planned assertion ("lib/schema.js does not export buildFaqPage", "lib/html.js does not export visibleText", "join.faq is not an array", buildPageGraph lacking FAQPage, "no drafted FAQ entry"). There were no load, syntax or fixture failures. The new exports are reached through a namespace import, so a missing export fails as an assertion and not as a module-link error. Two tests first failed with a TypeError; I tightened them to assertion failures before recording the evidence.
- **GREEN** (`f8d1cd0`): the implementation made all 37 targeted tests and the full suite (310) pass.

## Files Created/Modified

- `src/_data/join.js` - requirements, 6 steps, 15 FAQ entries (single source)
- `src/jak-dolaczyc.njk` - the page template (front matter breadcrumb, faqSchema, todo FACTS-03)
- `src/_includes/partials/breadcrumbs.njk` - visible trail markup contract for gate G11
- `src/_includes/layouts/base.njk` - includes breadcrumbs when `breadcrumb` is set
- `src/_includes/partials/head.njk` - subpage JSON-LD line via `pageGraph` + `jsonLd`
- `lib/schema.js` - buildBreadcrumbList, buildFaqPage, buildPageGraph
- `lib/html.js` - visibleText
- `eleventy.config.js` - `pageGraph` filter
- `FACTS.md` - FACTS-03..05 rows, third marker form
- `test/pages.test.js` - new subpage build-output suite
- `test/schema.test.js` - breadcrumb/FAQ units; "only home and indexable subpages carry JSON-LD"
- `test/seo.test.js` - exact sitemap lists now include /jak-dolaczyc/

## Decisions Made

See key-decisions in the frontmatter above. No CSS was added: the new classes (`.breadcrumbs`, `.subpage`, `.page-lead`, `.page-block`, `.join-steps`, `.page-cta`, `.faq-list`, `.faq-item`) are styled in 04-06.

## Deviations from Plan

None. The plan was executed as written. Two small adjustments made while executing:
- The breadcrumbs partial comment first said "<ol>", which made the acceptance grep `grep -c "<ol>"` return 2. I reworded the comment so the count is 1 (committed in `33bcd10`).
- `assertNoForbiddenContent` in test/schema.test.js now handles graphs without an Organization, which the plan's new subpage JSON-LD test needs (committed in `33bcd10`).

## Issues Encountered

- The worktree had no `node_modules`. I ran `npm ci` from the existing lockfile; no new package was installed and package.json is unchanged.
- An API usage limit interrupted the run after the GREEN commit. I resumed and finished the verification and this summary.

## Verification

- `npm test`: 310/310 pass
- `SITE_URL=https://guard.example npm run build`: check-seo OK and check-perf OK. BreadcrumbList, FAQPage and TODO(FACTS-04) are present, and the sitemap has `<loc>https://guard.example/jak-dolaczyc/</loc>`
- `/IBC-Website/` build: check-seo OK and check-perf OK. The absolute item `https://inglourious-basterds-clan.github.io/IBC-Website/jak-dolaczyc/` is present, and so is `href="/IBC-Website/jak-dolaczyc/" aria-current="page"`
- This plan's diff contains nothing under `src/css/` and no `test/css.test.js` or `lib/check-perf.js` (CSS stays at 3957 B gz)

## Known Stubs

None. The drafted texts are intentional, marked, and tracked in FACTS.md (FACTS-03..05). G10 blocks the indexable build until the clan confirms them.

## User Setup Required

None.

## Next Phase Readiness

- 04-04 can reuse `breadcrumb` front matter, the markup classes and test/pages.test.js
- 04-05 can build G11/G12 on the breadcrumbs markup contract and `visibleText`
- 04-06 must style the new classes. The visual check (breadcrumbs below the fixed header, numbered steps, keyboard FAQ) is its human-check

## Self-Check: PASSED

- All 4 created files exist; commits 33bcd10, eb09c10 and f8d1cd0 are ancestors of HEAD

---
*Phase: 04-join-operations-pages*
*Completed: 2026-10-13*
