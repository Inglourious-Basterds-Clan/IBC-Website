---
phase: 01-eleventy-foundation
plan: 02
subsystem: ui
tags: [eleventy, nunjucks, layout, partials, navigation, discord-cta, skip-link, css]

requires:
  - phase: 01-01
    provides: "Eleventy build from src/, site.js single source, HtmlBasePlugin, test/helpers.js"
provides:
  - "layouts/base.njk: document shell with skip link, grid, header/footer includes, <main id=\"main\">, classic main.js script"
  - "partials/head.njk (title param, keywords + SportsTeam JSON-LD home-only), header.njk, footer.njk (incl. decryption overlay), discord-cta.njk"
  - "src/_data/navigation.js: ordered { label, href } nav entries for header and footer"
  - "Body-only src/index.njk (front matter `layout: layouts/base.njk`), id=hero on the hero section"
  - "CSS: .skip-link, .header-actions, .header-cta, .header-cta-label, body overflow-x clip"
  - "test/layout.test.js: layout-root / layout-prefix structural, copy, nav-order, CTA and prefix checks"
affects: [01-03, 01-05, 01-06, phase-2-seo, phase-4-pages, phase-5-a11y]

actuals:
  tokens: 8244   # chars/4 over the realized diff (32975 chars)
  tasks: 2
  commits: 2
plan_head_before: f20ef905286e4de43622ee90294b18286867d21b
plan_head_after: fcd3cebaff21da11dad4d7025b7a4c442718d850

tech-stack:
  added: []
  patterns:
    - "Pages are front matter + body; layouts/base.njk + partials own all chrome"
    - "Home-only head data gated by `page.url == \"/\"` (removed in one place in Phase 2)"
    - "Nav rendered from _data/navigation.js in both header and footer"
    - "`| safe` used exactly once (content in base.njk)"
    - "data-* asset URLs go through `| htmlBaseUrl` explicitly"

key-files:
  created:
    - src/_includes/layouts/base.njk
    - src/_includes/partials/head.njk
    - src/_includes/partials/header.njk
    - src/_includes/partials/footer.njk
    - src/_includes/partials/discord-cta.njk
    - src/_data/navigation.js
    - test/layout.test.js
    - .planning/phases/01-eleventy-foundation/deferred-items.md
  modified:
    - src/index.njk
    - src/css/style.css

key-decisions:
  - "body { overflow-x: clip } added so pre-existing mobile content overflow cannot widen the layout viewport and push the header CTA and hamburger off-screen at 320/390 px. Section pixels are unchanged."
  - "Header row order on mobile is logo | Discord CTA | hamburger (flex order + margin-left:auto); on desktop the nav stays right-aligned with the CTA after it"
  - "CTA is the outline hud-btn (not .active), so the filled terminal button stays the primary call to action; icon-only at 480 px and below with the visually hidden 'Discord' label as the accessible name"
  - "Nav loops render one <li> per line so whitespace matches the original markup"

patterns-established:
  - "New pages: `layout: layouts/base.njk` plus optional `title`; nothing else is needed for full chrome"
  - "Header controls live in .header-actions outside `nav ul`, so main.js `nav ul li a` selectors never pick them up"

requirements-completed: [FOUND-02, FOUND-04, FOUND-05, FOUND-06]

coverage:
  - id: D1
    description: "Home page renders through layouts/base.njk + partials with the same sections, ids and Polish copy (one h1, hero/about/gallery/recruitment, 4 gallery items, lightbox without src, terminal data-discord-url, decryption overlay, easter-egg trigger, main#main, skip link before grid)"
    requirement: FOUND-02
    verification:
      - kind: integration
        ref: "test/layout.test.js#home page keeps its structure and ids"
        status: pass
      - kind: integration
        ref: "test/layout.test.js#home page keeps its Polish copy and home-only head data"
        status: pass
    human_judgment: true
    rationale: "Visual and behavioural parity is judged in the D-07 side-by-side review (plan 01-06); rendered-HTML diff against the old page shows only the planned edits"
  - id: D2
    description: "Under PATH_PREFIX=/IBC-Website/ every root-relative href/src/data-src (logo, gallery src + data-src, css, js, nav) starts with the prefix; no src=\".\""
    requirement: FOUND-06
    verification:
      - kind: integration
        ref: "test/layout.test.js#prefix build puts every internal URL under the prefix"
        status: pass
      - kind: integration
        ref: "test/layout.test.js#prefix build prefixes nav hrefs and leaves the CTA alone"
        status: pass
    human_judgment: false
  - id: D3
    description: "Header and footer nav come from navigation.js in order System, O nas, Galeria, Rekrutacja (/#hero, /#about, /#gallery, /#recruitment); exactly one active-nav on home"
    requirement: FOUND-05
    verification:
      - kind: integration
        ref: "test/layout.test.js#header and footer nav follow navigation.js order (FOUND-05)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Header Discord CTA (hud-btn header-cta) on every base.njk page, href = site.discord.invite, target=_blank + rel=noopener noreferrer, outside the nav list; every target=_blank anchor has rel; invite appears as href at least 3 times and only as site.discord.invite"
    requirement: FOUND-04
    verification:
      - kind: integration
        ref: "test/layout.test.js#header carries the Discord CTA outside the nav list (D-10, D-11)"
        status: pass
      - kind: integration
        ref: "test/layout.test.js#external links are safe and the invite has one source"
        status: pass
    human_judgment: false
  - id: D5
    description: "Header fits on one row at 320/390/768/1440 px with the baseline header height; CTA icon-only at 480 px and below; skip link shows on first Tab; hamburger still opens the menu with the CTA visible"
    verification:
      - kind: other
        ref: "Scratch headless-Chrome CDP check: header height 99/99/99/79 px (pre-plan site measured identical), CTA and toggle inside the viewport at all 4 widths, first Tab focuses .skip-link at top 0, menu click sets aria-expanded=true"
        status: pass
    human_judgment: true
    rationale: "Final look of the new header element is the plan's human-check (end-of-phase UAT, RESEARCH A3)"

duration: 11min
completed: 2026-10-02
status: complete
---

# Phase 1 Plan 02: Shared Base Layout, Data-Driven Nav and Header Discord CTA Summary

**The home page now renders through `layouts/base.njk` and four partials. Nav comes from `_data/navigation.js`, every page gets a compact outline Discord `hud-btn` in the header (icon-only at 480 px and below), and a focus-only "Przejdź do treści" skip link targets `<main id="main">`. All internal URLs are root-relative, and tests check them at the root and under `/IBC-Website/`.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-10-02T22:06:03Z
- **Completed:** 2026-10-02T22:16:51Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- `src/index.njk` is now front matter plus body only. The doctype, head, header, footer, easter-egg overlay and script come from the layout and partials. A diff of the rendered HTML against the pre-plan page shows only the planned edits: `<body>` without id, skip link, `/#…` nav hrefs, `/assets/…` logo and gallery URLs, `main#main`, `id="hero"` on the hero section, and the lightbox moved inside `<main>`.
- Meta keywords and the SportsTeam JSON-LD render on the home page only (`page.url == "/"`). The title defaults to the old value. Font Awesome, the preconnects and the og:image filter are unchanged.
- Header and footer nav are driven by data, so Phase 4 only edits `navigation.js`.
- The header Discord CTA sits outside `nav ul`, which keeps it out of the `initMobileMenu`/`initScrollSpy` selectors. It uses `rel="noopener noreferrer"` (T-01-05 mitigated and test-asserted).
- `test/layout.test.js` adds 7 tests (177 lines). `npm test` passes 12/12 (5 from build.test.js plus 7 new).

## Task Commits

1. **Task 1: Home page renders through the shared base layout at parity** - `a3bc38f` (feat)
2. **Task 2: Data-driven navigation, header Discord CTA, skip-link styling** - `fcd3ceb` (feat)

**Plan metadata:** see the docs commit for this SUMMARY

## Files Created/Modified
- `src/_includes/layouts/base.njk` - document shell, skip link, `<main id="main">`, the only `| safe`
- `src/_includes/partials/head.njk` - old `<head>` verbatim plus the title param and home-only keywords/JSON-LD
- `src/_includes/partials/header.njk` - logo, menu toggle, `.header-actions` (nav loop + CTA include)
- `src/_includes/partials/footer.njk` - footer with the nav loop, socials, decryption overlay
- `src/_includes/partials/discord-cta.njk` - compact header Discord button
- `src/_data/navigation.js` - 4 ordered nav entries
- `src/index.njk` - body only, `layout: layouts/base.njk`
- `src/css/style.css` - new `/* --- SKIP LINK & HEADER CTA --- */` block plus additions inside the 768 px and 480 px media queries (no existing rule changed, no hex literals)
- `test/layout.test.js` - FOUND-02/04/05/06 layout suite
- `.planning/phases/01-eleventy-foundation/deferred-items.md` - pre-existing mobile overflow, logged

## Decisions Made
See `key-decisions` in the frontmatter. The main one is the `body { overflow-x: clip; }` rule (deviation 1).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Header CTA and hamburger rendered off-screen at 320 and 390 px**
- **Found during:** Task 2 (headless-Chrome check of the header at 320/390/768/1440 px)
- **Issue:** The about section overflows horizontally on phones. `.about-stats` `1fr 1fr` grows to the min-content width of the 1.8rem stat headings, and at 320 px the hero h1 also overflows. This is pre-existing and also visible in the D-07 baseline. Mobile Chrome therefore widens the layout viewport to about 498 px, and the fixed header becomes 498 px wide. In the old header the hamburger was centered by `space-between` and happened to stay mostly visible at 390 px. With the planned right-aligned `logo | CTA | hamburger` row, the CTA and the hamburger both landed at x=384-468, outside a 390 px screen. That would break the mobile menu (D-05) and D-11 ("must also work in the mobile header").
- **Fix:** Added `body { overflow-x: clip; }` at the top of the new CSS block. The overflowing content is clipped exactly where `html { overflow-x: hidden }` already clipped it visually, so the about and hero pixels are unchanged (`w390-about` matches `baseline/mobile-about.png`). The layout viewport now equals the device width, so the header controls sit at the right edge. Fixed overlays (lightbox, decryption overlay, scanlines, grid) are not clipped, because their containing block is the viewport. As a side effect, the hamburger at 320 px is now fully visible. In the baseline it was mostly off-screen (x=309-354).
- **Files modified:** src/css/style.css
- **Verification:** At 320/390/768/1440 px: header height 99/99/99/79 px, identical to the pre-plan site measured the same way. CTA at 206-246 / 276-315 / 565-693 / 1162-1290 and toggle at 246-290 / 315-360 / 693-738 are inside the viewport. `docW` equals the viewport width. `npm test` passes 12/12.
- **Committed in:** fcd3ceb
- **Root cause deferred:** the content overflow itself is logged in `deferred-items.md`. Fixing it would visibly change the about section, which D-05 parity rules out.

**2. [Process] Commits made on `main`**
- `branching_strategy: none`. The orchestrator dispatched this plan sequentially on `main`, the same as plan 01-01.

---

**Total deviations:** 1 auto-fixed (Rule 1), 1 process note
**Impact on plan:** The CSS rule is needed for D-11 and mobile-menu parity. No scope creep. The overflow root cause is deferred.

## Issues Encountered
- A shell one-liner fallback (`python - … || node -e …`) started the Windows Python REPL stub and timed out. It changed no files. The edit was redone with a node script, and the file state was verified before committing.

## Known Stubs
None. Known interim states that are owned by later plans:
- **Scroll-spy highlight is inert until plan 01-03.** `src/js/main.js:198` compares `href === '#'+id`, but nav hrefs are now `/#…`. When the hero section (now `id="hero"`) intersects, scroll-spy clears every `active-nav` and adds none, so "System" loses its underline after load (visible in the 1440 px check). Plan 01-03 Pattern 5 (hash/pathname comparison) fixes this. Nav clicks still scroll correctly.
- `src/js/main.js` still has the terminal display string `discord.gg/…` (from 01-01; plan 01-03 switches it to `data-discord-url`).

## Human Check Pending (end-of-phase UAT)
Task 2 `<human-check>`: run `npm run dev`. At 320/390/768/1440 px, compare the header with the `baseline/*-top.png` screenshots. Press Tab and then Enter for the skip link, and open/close the hamburger at 390 px. The automated pre-check passed (see deviation 1). The user should confirm icon-only at 480 px and below (RESEARCH A3).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 01-03 can rely on `.header-actions` sitting outside `nav ul`, nav hrefs of the form `/#id`, `id="hero"` on the hero section, and `data-discord-url` on `#terminal-console`.
- Plan 01-05's dev page needs only `layout: layouts/base.njk` and a `title` to get the full chrome.

---
*Phase: 01-eleventy-foundation*
*Completed: 2026-10-02*

## Self-Check: PASSED

All 10 key files exist. Commits a3bc38f and fcd3ceb are in history. All Task 1 and Task 2 acceptance criteria were re-run and pass. Plan verification (`npm test` 12/12) passes.
