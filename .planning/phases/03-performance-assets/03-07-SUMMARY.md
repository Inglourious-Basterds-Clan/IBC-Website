---
phase: 03-performance-assets
plan: 07
subsystem: ui
tags: [icons, inline-svg, font-awesome, eleventy-shortcode, a11y, aria-hidden, node-test]

requires:
  - phase: 03-04
    provides: "Sync shortcode pattern (picture) in eleventy.config.js; build-output test conventions"
  - phase: 03-05
    provides: "head.njk Preloads & Stylesheets block with the FA link still in it; links.test.js allow-list without Google font hosts"
provides:
  - "lib/icons.js: iconPaths (Font Awesome Free 6.0.0 discord/youtube/facebook paths, CC BY 4.0 attribution) and renderIcon(name, className?)"
  - "Sync {% icon %} shortcode used in five places (footer Discord + site.social loop, header CTA, 404 button, recruitment button)"
  - ".icon (Font Awesome's SVG sizing rule) and .recruitment-cta-icon (1.3rem) in src/css/style.css"
  - "Font Awesome CDN stylesheet removed from every page; cdnjs.cloudflare.com dropped from the links.test.js allow-list"
  - "test/icons.test.js: renderIcon unit tests plus root-build checks (footer names, every svg hidden, text buttons, no CDN / fa-* anywhere)"
affects: [03-08 css minification and inline-style conversion, 03-10 css partial split, 03-11 perf gate and parity checklist]

actuals:
  tokens: 4629
  tasks: 2
  commits: 4
plan_head_before: ba8d627d310dc4797879cee7126d264fede4e552
plan_head_after: 17bf3ba455bd39a30cadd0e19f9c4abffb59a311

tech-stack:
  added: []
  patterns:
    - "Icons: one frozen path table + one throwing render function behind a sync universal shortcode; no free text reaches the SVG"
    - "Accessible names live on the link (aria-label or visible text); every SVG is aria-hidden and focusable=false"

key-files:
  created: [lib/icons.js, test/icons.test.js]
  modified: [eleventy.config.js, src/_includes/partials/footer.njk, src/_includes/partials/discord-cta.njk, src/404.njk, src/index.njk, src/_includes/partials/head.njk, src/css/style.css, test/links.test.js]

key-decisions:
  - "renderIcon has no title/label parameter: accessible names stay on the links (D-11 option aria-label on the link + aria-hidden SVG), so no label text passes through the shortcode"
  - "Icon names are checked with Object.hasOwn on a frozen table, so inherited names (toString, __proto__) throw like typos; an extra class must match ^[a-z0-9-]+$ (T-03-14)"
  - "The no-Font-Awesome guard scans every shipped text file for a fab / fa-<name> token with a hyphen-aware word boundary, not only HTML class attributes, so a reintroduced CSS selector or JS class string also fails"
  - "The font-awesome check is the literal hyphenated string (case-insensitive), so the D-15 comment 'Font Awesome's own SVG sizing rule' in the shipped stylesheet does not trip it while the CDN path does"

patterns-established:
  - "New icons: add { viewBox, path } to iconPaths (verbatim from the FA 6.0.0 SVG) and call {% icon \"name\" %}; a site.social id without an icon fails test/icons.test.js"

requirements-completed: [PERF-05]

coverage:
  - id: D1
    description: "renderIcon returns one single-line <svg class=\"icon icon-<name>\" aria-hidden=\"true\" focusable=\"false\" viewBox fill=\"currentColor\"> with one path; viewBoxes 640/576/512 x 512; valid extra class added, invalid class throws"
    requirement: PERF-05
    verification:
      - kind: unit
        ref: "test/icons.test.js#renderIcon('discord') is one accessible-hidden inline svg (D-11)"
        status: pass
      - kind: unit
        ref: "test/icons.test.js#youtube and facebook keep their Font Awesome viewBoxes (D-15)"
        status: pass
      - kind: unit
        ref: "test/icons.test.js#renderIcon adds a valid extra class and rejects an invalid one (T-03-14)"
        status: pass
    human_judgment: false
  - id: D2
    description: "renderIcon throws /Unknown icon/ on '', undefined, 'nope', 'toString', '__proto__'; every site.social id has an icon; lib/icons.js keeps the FA Free 6.0.0 / CC BY 4.0 licence line"
    requirement: PERF-05
    verification:
      - kind: unit
        ref: "test/icons.test.js#renderIcon throws on an empty, missing, unknown or inherited name (PERF-05 empty edge)"
        status: pass
      - kind: unit
        ref: "test/icons.test.js#every site.social id has an icon"
        status: pass
      - kind: unit
        ref: "test/icons.test.js#lib/icons.js keeps the Font Awesome licence"
        status: pass
    human_judgment: false
  - id: D3
    description: "Built footer: three social-icon links (discord, youtube, facebook in order), each with a non-empty aria-label and exactly one aria-hidden svg.icon; every svg on every page is aria-hidden, focusable=false and classed icon"
    requirement: PERF-05
    verification:
      - kind: integration
        ref: "test/icons.test.js#the footer social links are named and hold one aria-hidden icon each (D-11)"
        status: pass
      - kind: integration
        ref: "test/icons.test.js#every svg in every page is hidden from screen readers (D-11)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Header CTA, 404 Discord button and recruitment button each hold one icon-discord svg next to their visible text; the recruitment icon carries recruitment-cta-icon"
    requirement: PERF-05
    verification:
      - kind: integration
        ref: "test/icons.test.js#the text buttons keep their visible text next to a hidden Discord icon (D-11, D-15)"
        status: pass
      - kind: integration
        ref: "test/layout.test.js#header carries the Discord CTA outside the nav list (D-10, D-11)"
        status: pass
    human_judgment: false
  - id: D5
    description: "No shipped text file names cdnjs.cloudflare.com or font-awesome or carries a fab / fa-* class token; cdnjs is no longer an allowed external host"
    requirement: PERF-05
    verification:
      - kind: integration
        ref: "test/icons.test.js#no shipped text file references the Font Awesome CDN or its classes (PERF-05, T-03-24)"
        status: pass
      - kind: integration
        ref: "test/links.test.js (allowedHosts without cdnjs.cloudflare.com)"
        status: pass
      - kind: other
        ref: "SITE_URL=https://guard.example npm run build (check-seo exit 0); grep -rlE 'cdnjs|font-awesome' _site (no match)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Header CTA, footer icons, recruitment button and 404 button show the same glyphs, size and vertical alignment as the Phase 1 baseline, and each footer link / the CTA is announced once by name"
    requirement: PERF-05
    verification: []
    human_judgment: true
    rationale: "Visual parity (D-15) and screen-reader announcement are not asserted by any test; the plan's human-check is collected at the end of the phase (03-11 parity run, compare root-desktop-recruitment.png and root-desktop-top.png)"

duration: 5min
completed: 2026-10-10
status: complete
---

# Phase 3 Plan 07: Inline SVG Icons Summary

**Font Awesome's CDN stylesheet is gone: all five icon uses now render as single-line, aria-hidden inline SVGs from `lib/icons.js` (Font Awesome Free 6.0.0 brand paths, CC BY 4.0) through a sync `{% icon %}` shortcode. An unknown icon name or an unsafe extra class fails the build.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-10T20:39:39Z
- **Completed:** 2026-10-10T20:44:45Z
- **Tasks:** 2 (4 commits, TDD RED/GREEN for each)
- **Files modified:** 10 (2 created, 8 modified)

## Accomplishments

- `lib/icons.js` is the one place the icon paths live. It holds a frozen `iconPaths` table with discord (`0 0 640 512`), youtube (`0 0 576 512`) and facebook (`0 0 512 512`), each `viewBox` and `d` copied verbatim from the FA Free 6.0.0 SVGs on jsDelivr. A script compared the copies with the downloaded files and found them identical. The licence line is kept word for word.
- `renderIcon(name, className?)` throws `Unknown icon "<name>"` unless the name is an own key of the table, and throws on an extra class outside `^[a-z0-9-]+$`. It has no label parameter, so accessible names stay in the Nunjucks-escaped `aria-label` or the visible text of each link.
- `eleventyConfig.addShortcode("icon", renderIcon)` is sync, so it works inside the footer's `{% for s in site.social %}` loop.
- Five call sites are swapped: the footer Discord link, the footer social loop (`{% icon s.id %}`), the header CTA, the 404 button and the recruitment button (`{% icon "discord", "recruitment-cta-icon" %}`).
- In `src/css/style.css`, `.icon` reproduces Font Awesome's own SVG rule (`inline-block; height: 1em; overflow: visible; vertical-align: -0.125em`). `.recruitment-cta-icon { font-size: 1.3rem }` replaces the old inline font-size. Neither rule adds spacing, color or a new size (D-15).
- The Font Awesome 6.0.0 CDN `<link>` is deleted from `head.njk`, and `cdnjs.cloudflare.com` is removed from the `links.test.js` allow-list. The production build (`SITE_URL=https://guard.example npm run build`, check-seo included) exits 0, and no file in `_site` names cdnjs or font-awesome.
- `npm test`: 253/253 pass.

## Task Commits

1. **Task 1 (tracer): one icon source renders accessible inline SVGs in the footer of every page**
   - RED `ce779bd` (test): 7 tests. Run against a temporary uncommitted stub (`iconPaths = {}`, `renderIcon` returning `""`), all 7 failed with AssertionError. The target "the footer social links are named and hold one aria-hidden icon each (D-11)" failed with `social link "Discord" holds 0 svgs, expected 1`. The classifier returned `RED_EVIDENCE_OK` (`target_test_failed`). Semantic assessment: the target ran and failed on the planned assertion, because the footer still rendered the FA `<i>`. There were no load, syntax or fixture faults: the stub existed only so that the import resolved.
   - GREEN `4870508` (feat): `lib/icons.js`, the shortcode, the footer swap and `.icon`. 14/14 for `test/icons.test.js` + `test/layout.test.js`, and 250/250 for `npm test`.
   - Tracer feedback gate: `human_verify_mode` is end-of-phase and the tracer's `<verify>` is automated only, so the verify was re-run after the commit. It passed (the build plus the `icon-youtube` grep in 404.html and the `icon-facebook` grep in index.html). Tracer verified end to end, then expanded to Task 2.
2. **Task 2: remaining icons swapped, Font Awesome CDN removed, no-CDN and accessibility checks on every page**
   - RED `16a9818` (test): 3 new tests. The target "no shipped text file references the Font Awesome CDN or its classes" failed with `404.html references cdnjs.cloudflare.com`, and the text-button test failed with `header CTA holds 0 svgs, expected 1`. The classifier returned `RED_EVIDENCE_OK`. Semantic assessment: both are AssertionErrors on the planned behavior. "every svg in every page is hidden" passed already, because it is a regression guard over the footer SVGs from Task 1 and not a RED target.
   - GREEN `17bf3ba` (feat): the template swaps, the FA link removal, `.recruitment-cta-icon` and the allow-list change. 27/27 for icons + links + layout, and 253/253 for `npm test`.

**Plan metadata:** in the docs(03-07) commit that adds this SUMMARY.

## TDD Gate Compliance

Both RED commits (`test(03-07)`) come before their GREEN commits (`feat(03-07)`). Each RED was validated with `check tdd-red-evidence` (`RED_EVIDENCE_OK`) and checked by hand. No REFACTOR was needed.

## Files Created/Modified

- `lib/icons.js` (new): the icon path table and `renderIcon`.
- `test/icons.test.js` (new): unit tests and root-build (`icons-root`) output checks.
- `eleventy.config.js`: the `icon` shortcode.
- `src/_includes/partials/footer.njk`: the Discord link and the social loop use `{% icon %}`. The aria-labels are unchanged.
- `src/_includes/partials/discord-cta.njk`, `src/404.njk`, `src/index.njk`: Discord icon swaps.
- `src/_includes/partials/head.njk`: the Font Awesome CDN stylesheet link is removed.
- `src/css/style.css`: `.icon` at the end of REUSABLE HUD COMPONENTS, and `.recruitment-cta-icon` at the end of RECRUITMENT SECTION.
- `test/links.test.js`: `cdnjs.cloudflare.com` is removed from `allowedHosts`.

## Decisions Made

See key-decisions in the frontmatter. In short:
- Accessible names stay on the links, and the shortcode takes no label.
- Icon names are checked with `Object.hasOwn`, and extra classes must match `^[a-z0-9-]+$`.
- The fa-token guard scans every shipped text file.
- The literal `font-awesome` check leaves the D-15 comment in the stylesheet alone.

## Deviations from Plan

None. The plan was executed as written. The test file also covers `__proto__` and a `"><script>` class, both inside the planned behavior (inherited names and invalid classes throw).

## Issues Encountered

- `eleventy.config.js` and other working copies use CRLF (autocrlf), so a scripted exact-string replacement found no match. The edits were made with the Edit tool instead. The content was not affected.
- Git warns that LF will become CRLF in the touched files. This is the repo's existing autocrlf behavior.
- The RED evidence records were written under the gitignored `_test/` and deleted after classification. Their verdicts are recorded above.

## Known Stubs

None.

## Threat Flags

None. This plan removes a third-party request surface (T-03-24) and adds no new one.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 03-08 can convert the recruitment button's remaining inline `style` attribute into a class. The icon's own inline font-size is already gone.
- 03-10's partial split must keep `.icon` in components and `.recruitment-cta-icon` in recruitment.
- Open human check for the 03-11 parity checklist (D6): icon glyph, size and baseline against the Phase 1 baseline, and one announcement per link in a screen reader or Chrome's Accessibility pane.

## Self-Check: PASSED

- FOUND: lib/icons.js, test/icons.test.js and all 8 modified files
- FOUND commits: ce779bd, 4870508, 16a9818, 17bf3ba (all ancestors of HEAD; `git rev-list --count ba8d627..HEAD` = 4)
- Acceptance: renderIcon export 1, CC BY 4.0 1, `addShortcode("icon"` 1, `{% icon s.id %}` 1, `.icon {` 1, 404/CTA `{% icon "discord"` 1/1, `.recruitment-cta-icon` 1, recruitment shortcode call 1; `node --test test/icons.test.js` 10/10; `npm test` 253/253; production build exit 0 with the icon-discord and recruitment-cta-icon greps on `_site/index.html`

---
*Phase: 03-performance-assets*
*Completed: 2026-10-10*
