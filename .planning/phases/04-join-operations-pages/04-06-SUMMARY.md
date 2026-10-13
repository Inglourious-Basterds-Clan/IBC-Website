---
phase: 04-join-operations-pages
plan: 06
subsystem: ui
tags: [css, lightningcss, breadcrumbs, faq, details-summary, grid, perf-budget]

requires:
  - phase: 04-join-operations-pages
    provides: "04-01 /jak-dolaczyc/ markup, breadcrumbs partial and FAQ details; 04-04 /operacje/ markup with unstyled classes"
  - phase: 03-performance
    provides: "lib/css.js Lightning CSS bundling, check-perf P9 CSS gzip cap, css.test every-class-used and partialOrder"
provides:
  - "src/css/partials/pages.css: breadcrumbs cleared below the fixed header, subpage frame (h1, lead, blocks, CTA), join step counters 01-06, native FAQ accordion"
  - "Operations styles: schedule and mission type grids, era HUD tags, evening timeline, 'Najbliższe misje' block, recap card grid with 16:9 images"
  - "pages partial imported between recruitment and footer, pinned by test/css.test.js partialOrder"
affects: [04-07 home teaser and recruitment.css changes (shares the CSS budget), 05 visual refresh (UI-01..03), 05 a11y focus styles]

actuals:
  tokens: 1916
  tasks: 2
  commits: 2
plan_head_before: 55f9f35afae87b4ff5ab18cabb8162234a8d19e6
plan_head_after: 750f4495b5090fe3e92db4579ce5c47f1aaccba0

tech-stack:
  added: []
  patterns:
    - "One subpage partial (pages.css) with a single @media (max-width: 768px) block shared by every subpage rule"
    - "CSS counters (decimal-leading-zero) for HUD step numbers; separators drawn by li + li::before, never in markup"

key-files:
  created:
    - src/css/partials/pages.css
  modified:
    - src/css/style.css
    - test/css.test.js

key-decisions:
  - "Followed the approved UI-SPEC over the plan text where they differ (PD-1: 120px breadcrumb clearance at <=768px, not smaller; PD-2: step and FAQ answer text in the default p colour; PD-3: lead stays 16px with opacity 1 and max-width 70ch; PD-4: recap grid minmax(min(100%, 300px), 1fr); PD-6: breadcrumbs max-width 1240px and 32px gap; h1 addition at 2.2rem)"
  - "BUDGET.cssGzipMaxBytes left at 5120: the bundle measures 4661 B gz in both production builds, so lib/check-perf.js is untouched"
  - "Breadcrumb links are muted with an explicit accent hover rule, because the .breadcrumbs a colour overrides the global a colour"

patterns-established:
  - "Subpage blocks: .page-block (48px apart, accent h2), list items as li > h3 + p styled by one shared rule"

requirements-completed: [CONT-01, CONT-02, CONT-03, CONT-04, SEO-06]

coverage:
  - id: D1
    description: "pages.css is bundled into css/style.css, imported between recruitment and footer, every class used, no inline styles"
    requirement: "SEO-06"
    verification:
      - kind: unit
        ref: "node --test test/css.test.js test/pages.test.js (51 pass, 0 fail)"
        status: pass
      - kind: integration
        ref: "npm test (403 pass, 0 fail); grep of .breadcrumbs, .faq-item, .join-steps, .recap-card, .evening-timeline in _site/css/style.css"
        status: pass
    human_judgment: false
  - id: D2
    description: "CSS bundle within BUDGET.cssGzipMaxBytes in the guard, root and /IBC-Website/ production builds"
    verification:
      - kind: other
        ref: "npm run build x3: check-perf: css 4661 B gz (cap 5120), check-perf: OK, check-seo: OK"
        status: pass
    human_judgment: false
  - id: D3
    description: "Breadcrumbs below the fixed header at 1280/390/320 px, step counters 01-06, FAQ toggles with Enter and Space, no horizontal overflow"
    requirement: "SEO-06"
    verification:
      - kind: automated_ui
        ref: "headless Chrome CDP probe (scratchpad layout-check.mjs): crumb top 100 vs header 79 at 1280, 120 vs 99 at 390/320; FAQ open after Enter/Space and closed after the second press; 0 JS errors"
        status: pass
    human_judgment: true
    rationale: "The plan's human-check (overall HUD look, readability on a real device) is collected at the end of the phase"
  - id: D4
    description: "/operacje/ layout: 3/1/1 recap columns at 1280/390/320, full-width images, Discord button below the upcoming text, accent timeline line, era tag borders"
    requirement: "CONT-04"
    verification:
      - kind: automated_ui
        ref: "headless Chrome CDP probe: recapColumns 3 at 1280, 1 at 390 and 320; img width = card width minus 2px border; upcomingBtnBelowText true; overflowX false"
        status: pass
    human_judgment: true
    rationale: "Visual readability of the schedule, types, eras and timeline and lazy image loading are confirmed in the end-of-phase human check"

duration: 4min
completed: 2026-10-13
status: complete
---

# Phase 04 Plan 06: Subpage Styles Summary

**One Lightning-CSS-bundled partial, pages.css, styles both subpages with existing HUD tokens only: breadcrumbs cleared 100/120 px below the fixed header, CSS-counter steps 01-06, a native FAQ accordion, and the operations schedule, era tags, evening timeline, upcoming block and a 3-column recap grid, all at 4661 B gz CSS (cap 5120).**

## Performance

- **Duration:** about 4 min
- **Started:** 2026-10-13T18:08:29Z
- **Completed:** 2026-10-13T18:12:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Breadcrumbs "Start › Jak dołączyć" and "Start › Operacje" sit below the fixed header on both subpages (measured: top 100 px under a 79 px header at 1280 px, 120 px under a 99 px header at 390 and 320 px). The "›" comes from CSS, and the current item is accent.
- Join page: subpage h1 at 2.2rem, lead, 48 px block rhythm, step rows with HUD counters 01-06, FAQ items with the native marker that open and close with Enter and Space.
- Operations page: schedule and mission type grids, wrapping era tags, an accent-ruled evening timeline with times, the "Najbliższe misje" block with its Discord button under the text, and a recap grid with 3 columns at 1280 px and 1 column on mobile.
- CSS bundle grew from about 4009 to 4661 B gz (+652 B, within the UI-SPEC target of 900 B for 04-06 plus 04-07). The budget is unchanged.

## Task Commits

1. **Task 1: Tracer: pages.css wired end to end** - `b0b7a3c` (feat)
2. **Task 2: Operations page styles** - `750f449` (feat)

## Files Created/Modified

- `src/css/partials/pages.css` - all subpage rules plus one 768 px media block
- `src/css/style.css` - imports pages.css between recruitment and footer
- `test/css.test.js` - partialOrder includes "pages"

## Verification

- `node --test test/css.test.js test/pages.test.js`: 51 pass, 0 fail
- `npm test`: 403 pass, 0 fail
- Guard build (`SITE_URL=https://guard.example`), root and `/IBC-Website/` production builds: `check-seo: OK`, `check-perf: OK`, `check-perf: css 4661 B gz (cap 5120)`
- Acceptance greps: one pages import, `"recruitment", "pages", "footer"` once, one `@media` in pages.css, every required rule present in `_site/css/style.css`
- Tracer gate: verified end to end in headless Chrome (CDP probe) before Task 2 started. The plan's human-check stays queued for the end of the phase (human_verify_mode end-of-phase).

## Decisions Made

See key-decisions. The approved UI-SPEC (PD-1, PD-2, PD-3, PD-4, PD-6 and the h1 addition) was applied where it differs from the plan text, as the plan's context block instructs.

## Deviations from Plan

### Contract-driven adjustments (UI-SPEC, approved by the user)

1. **PD-1:** the mobile block sets breadcrumb `padding-top: 120px` (larger, not smaller), because the mobile header is 99 px tall.
2. **PD-2:** step and FAQ answer paragraphs keep the default `p` colour instead of the secondary text colour.
3. **PD-3:** `.page-lead` has no larger font size. It uses `opacity: 1; max-width: 70ch`.
4. **PD-4:** `.recap-list` uses `minmax(min(100%, 300px), 1fr)` instead of `minmax(280px, 1fr)`.
5. **PD-6:** `.breadcrumbs` uses `max-width: 1240px`, and `.breadcrumbs + .subpage` uses `padding-top: 32px`.
6. **Addition:** `.subpage .section-header h1 { font-size: 2.2rem; line-height: 1.2; color: var(--text-primary) }`.

None of these are Rule 1-4 deviations. They are the plan's own instruction to follow the UI-SPEC.

**Total deviations:** 0 auto-fixed. **Impact:** none.

## Issues Encountered

- One UI-SPEC backstop needs a human eye: "at 1280 px the breadcrumb text's left edge equals the h1's left edge". With the contract CSS (`max-width: 1240px`), the trail lines up with `.section-container` and the `.section-header` accent rule (both 33 px from the left in the probe). The h1 text sits 23 px further right (56 px) because of the section-header's 3 px border and 20 px padding. I kept the contract CSS and flag this for the end-of-phase visual check.
- `git.base-branch --is-protected main` reports true. The commits went to main as the orchestrator instructed (branching_strategy none, sequential executor).

## Next Phase Readiness

Ready for 04-07 (nav, home teaser, legacy redirect). It shares the CSS budget: 459 B gz remain under the 5120 B cap.

## Self-Check: PASSED

- FOUND: src/css/partials/pages.css, src/css/style.css, test/css.test.js
- FOUND: b0b7a3c, 750f449 (both ancestors of HEAD)
- lib/check-perf.js unchanged since the plan base
