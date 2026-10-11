---
phase: 03-performance-assets
plan: 08
subsystem: ui
tags: [css, lightningcss, bundling, minification, cache-busting, inline-styles, eleventy, parity]

requires:
  - phase: 03-06
    provides: "Build-output test conventions and the image pipeline the css builds run alongside"
  - phase: 03-07
    provides: ".icon / .recruitment-cta-icon rules; the recruitment button's remaining inline style handed over"
provides:
  - "lib/css.js: cssEntry, cssTargets (chrome/edge/firefox 100, safari/ios_saf 15), bundleCss(entryPath) -> { code, hash }, getCssBundle() (memoized), resetCssBundle()"
  - "src/css/style.11ty.js: writes /css/style.css from the Lightning CSS bundle; the src/css passthrough is gone"
  - "cssHash global data, eleventy.before reset, src/css/ watch target; head links /css/style.css?v={{ cssHash }}"
  - "Nine classes replace every inline style in the templates: about-heading, about-heading-spaced, stat-text, recruitment-badge, recruitment-heading, recruitment-lead, recruitment-steps, recruitment-cta, easteregg-trigger (plus a .recruitment-instructions rule)"
  - "test/css.test.js: one cache-busted stylesheet per page, minified with Safari prefixes, root/prefix byte identity, only-the-bundle-ships, no inline styles"
  - "lightningcss 1.33.0 exact devDependency, lockfile with lightningcss-linux-x64-gnu"
affects: [03-09 runtime state classes (lightbox/overlay/terminal), 03-10 partial split and dead CSS, 03-11 perf gate and parity checklist]

actuals:
  tokens: 5400
  tasks: 2
  commits: 2
plan_head_before: d03aeafc43f6ba9e7af451ac1809c5dfcc9dd4f2
plan_head_after: 3be633a437e91d04bad3f8eda32bdcdc9b900a71

tech-stack:
  added: [lightningcss 1.33.0]
  patterns:
    - "Build-time CSS: one memoized bundle shared by the 11ty.js template and the ?v= global, reset in eleventy.before so every build (and each --serve rebuild) bundles afresh"
    - "Inline style -> class: copy the declarations verbatim and pick a selector (ancestor class + class, 0,2,0) that outranks every competing rule, including the media queries"

key-files:
  created: [lib/css.js, src/css/style.11ty.js, test/css.test.js]
  modified: [package.json, package-lock.json, eleventy.config.js, src/_includes/partials/head.njk, test/build.test.js, test/deps.test.js, src/css/style.css, src/index.njk, src/_includes/partials/footer.njk]

key-decisions:
  - "The ?v= hash is the first 10 hex characters of the sha256 of the exact bytes Lightning CSS emits, and both the template and the head read the same memoized bundle, so the hash always matches the shipped file (css.test.js checks it per page)"
  - "Every converted rule uses an ancestor-class + class selector (0,2,0), so it outranks h3/p/*, .stat-card h3 (0,1,1), .hud-badge(.amber), .req-list, .hud-btn(.active) and the 480px .hud-btn rule regardless of source order; .recruitment-instructions alone stays (0,1,0) because only .hud-border competes and it sets none of those properties"
  - "Parity was proven by machine, not only by eye: full getComputedStyle (501 properties + box size) of all 12 converted elements is identical before/after at 1440 and 390 px in headless Chrome, and a negative control (new markup, old CSS) shows 319 differences"

patterns-established:
  - "New styling goes into src/css/style.css (or a 03-10 partial), never into a style attribute; test/css.test.js fails on any style attribute in a .njk template or built page"

requirements-completed: [PERF-06]

coverage:
  - id: D1
    description: "Every page of the root, /IBC-Website/ and dev builds links exactly one stylesheet <prefix>css/style.css?v=<10 hex> whose value matches the sha256 of that build's css/style.css"
    requirement: PERF-06
    verification:
      - kind: integration
        ref: "test/css.test.js#every page links one cache-busted stylesheet (D-12)"
        status: pass
      - kind: integration
        ref: "test/build.test.js (four stylesheet href checks, now regex with ?v=)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The bundle is minified (no comments, at most one line break) and keeps -webkit-backdrop-filter (3 occurrences) and @font-face"
    requirement: PERF-06
    verification:
      - kind: integration
        ref: "test/css.test.js#the bundle is minified and keeps the Safari prefixes (Pitfall 2)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Root and prefix builds ship byte-identical css/style.css with the same ?v=; the output css/ folder holds only style.css"
    requirement: PERF-06
    verification:
      - kind: integration
        ref: "test/css.test.js#root and prefix builds produce the same bytes (PERF-06 concurrency edge)"
        status: pass
      - kind: integration
        ref: "test/css.test.js#only the bundle ships from src/css"
        status: pass
    human_judgment: false
  - id: D4
    description: "lightningcss is pinned to exactly 1.33.0 and the lockfile has node_modules/lightningcss-linux-x64-gnu for CI"
    requirement: PERF-06
    verification:
      - kind: unit
        ref: "test/deps.test.js#lightningcss is pinned and CI has its linux binary (D-12, Pitfall 8)"
        status: pass
    human_judgment: false
  - id: D5
    description: "No built page (root, prefix, dev) carries a style attribute or <style> element, and no .njk template under src/ has a style attribute"
    requirement: PERF-06
    verification:
      - kind: integration
        ref: "test/css.test.js#no inline styles anywhere (D-12)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The converted elements (about headings, long stat titles, Karta Mobilizacyjna card, Discord button, v2.4.1 trigger) look identical to the Phase 1 baseline at 1440 px and 390 px"
    requirement: PERF-06
    verification:
      - kind: other
        ref: "scratchpad parity.mjs (headless Chrome CDP): 12 elements x 501 computed properties + box size, 0 differences at 1440x900 and 390x844; negative control 319 differences"
        status: pass
    human_judgment: true
    rationale: "The computed-style comparison is against the pre-plan build, not the Phase 1 baseline screenshots, and is not a committed test; the plan's human-check against root-desktop-about.png, root-desktop-recruitment.png and root-mobile-recruitment.png is collected at the end of the phase (03-11)"

duration: "~15 min active (wall clock 2026-10-10T20:47:40Z to 2026-10-11T09:24:02Z, including an interrupted first executor)"
completed: 2026-10-11
status: complete
---

# Phase 3 Plan 08: Lightning CSS Bundle and Inline-Style Classes Summary

**Every page now loads one Lightning CSS bundle, minified and with its Safari prefixes kept, at `/css/style.css?v=<sha256-10>`. The hash always matches the shipped bytes, and root and `/IBC-Website/` builds ship identical bytes. All eleven inline `style=` attributes in the templates are now classes with the same declarations. Headless Chrome shows identical computed styles before and after.**

## Performance

- **Duration:** about 15 min of active execution. Wall clock ran from 2026-10-10T20:47:40Z to 2026-10-11T09:24:02Z because the first executor was interrupted (see below).
- **Tasks:** 2 (2 commits)
- **Files modified:** 12 (3 created, 9 modified)

## Interruption and Resume

The first executor was killed by an API session limit in the middle of Task 1. It made no commits (HEAD stayed at `d03aeaf`) and left uncommitted, unverified partial work. The user chose to continue from that work. This executor reviewed every piece against Task 1 before trusting it:

- **package.json / package-lock.json:** correct. `lightningcss` is an exact `1.33.0` devDependency. The lockfile records `node_modules/lightningcss` 1.33.0 and all 11 platform binaries, including `lightningcss-linux-x64-gnu`. `detect-libc` 2.1.2 is deduped with sharp's copy. The installed `node_modules/lightningcss` is 1.33.0 with `lightningcss-win32-x64-msvc`. No reinstall was needed.
- **lib/css.js, src/css/style.11ty.js, eleventy.config.js, head.njk, test/deps.test.js:** correct and complete as planned: exports, targets, memo and reset, permalink, passthrough removal, `cssHash`, `eleventy.before`, the watch target and the `?v={{ cssHash }}` link. They were kept unchanged.
- **test/css.test.js:** assumed incomplete, but on review all four planned tests were present and correct. It was kept.
- **test/build.test.js:** the four href checks were correctly converted to `stylesheetHref(prefix)` regexes. One defect was fixed: the edit had dropped the space in `const inviteDomainPattern =/https…`.
- **Failure demonstration:** Task 1 is `type="tracer"` without `tdd="true"`, so no RED commit is required. To prove the new tests can fail, `test/css.test.js` was run against the pre-change code: HEAD `eleventy.config.js` and `head.njk` were restored and `style.11ty.js` moved aside, with backups in the scratchpad. "every page links one cache-busted stylesheet" failed with `404.html links /css/style.css, expected <prefix>css/style.css?v=<10 hex>`. The minification test failed with `css/style.css still holds a comment`. The byte-identity and only-the-bundle tests passed, because the old passthrough already satisfied them, so they are regression guards rather than RED targets. The implementation was then restored, and `git diff --stat` matched the earlier state.

## Accomplishments

- `lib/css.js` runs `bundle({ filename, minify: true, targets })` with chrome/edge/firefox 100 and safari/ios_saf 15. All three `-webkit-backdrop-filter` declarations survive. The `?v=` hash is the first 10 hex characters of the sha256 of the emitted bytes, memoized per build.
- `src/css/style.11ty.js` writes `/css/style.css`. With the `src/css` passthrough removed, the output `css/` holds only `style.css`, 22,356 B minified.
- `eleventy.config.js` registers the `cssHash` global, resets the memo in `eleventy.before` (keeping `npm run dev` fresh) and watches `src/css/`.
- `head.njk` links `/css/style.css?v={{ cssHash }}`. HtmlBasePlugin adds the `/IBC-Website/` prefix and keeps the query.
- The eleven inline styles in `src/index.njk` and `footer.njk` are now classes. Each rule sits at the end of its section (ABOUT US, RECRUITMENT SECTION, FOOTER), so 03-10's split carries it along.
- Headless Chrome (CDP) compared `getComputedStyle` (501 properties) and the bounding box of all 12 affected elements, including an unconverted control `h3`, between the pre-plan build and the converted build at 1440×900 and 390×844. All values were identical. A negative control (converted markup with the old CSS) showed 319 differences, so the probe does detect changes.
- `npm test`: 259/259. The production build (`SITE_URL=https://guard.example npm run build`, check-seo included) exits 0, and `_site/index.html` and `_site/404.html` have 0 `style=`.

## Task Commits

1. **Task 1 (tracer): one minified, prefixed, cache-busted Lightning CSS stylesheet.** Commit `15fda3b` (feat). Before the commit: the 4 targeted test files passed 38/38, `npm test` passed 258/258 and the production build plus greps passed. Tracer feedback gate: `human_verify_mode` is end-of-phase and the verify is automated only, so the verify was re-run after the commit. It passed again (38/38, build, cache-busted link in `_site/index.html`, `css/style.css` present). The tracer was verified end to end, then work moved to Task 2.
2. **Task 2: inline style attributes become classes with identical declarations.** Commit `3be633a` (feat). The "no inline styles anywhere (D-12)" test was written first and failed for the planned reason: `css-root: 404.html has inline styles: <span id="easteregg-trigger" … style="cursor: pointer; opacity: 0.3; margin-left: 10px;">`. After the conversion: css + layout tests 12/12, `npm test` 259/259, production build exit 0.

**Plan metadata:** in the docs(03-08) commit that adds this SUMMARY.

## Files Created/Modified

- `lib/css.js` (new): the Lightning CSS bundle, targets, hash and memo.
- `src/css/style.11ty.js` (new): the `/css/style.css` template.
- `test/css.test.js` (new): five stylesheet checks across the `css-root`, `css-prefix` and `css-dev` builds.
- `package.json`, `package-lock.json`: lightningcss 1.33.0 (exact).
- `eleventy.config.js`: the passthrough entry is removed; `cssHash`, the `eleventy.before` reset and the watch target are added.
- `src/_includes/partials/head.njk`: the cache-busted stylesheet link.
- `test/build.test.js`: the four href checks became `?v=` regexes.
- `test/deps.test.js`: the lightningcss pin and CI-binary test.
- `src/css/style.css`: the converted rules.
- `src/index.njk`, `src/_includes/partials/footer.njk`: classes instead of `style=`.

## Decisions Made

See key-decisions in the frontmatter: the hash comes from the emitted bytes and one shared memo, the converted rules use (0,2,0) descendant selectors, and parity is proven by computed-style comparison.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Dropped space in test/build.test.js from the interrupted executor**
- **Found during:** Task 1 (resume review)
- **Issue:** `const inviteDomainPattern =/https?…` lost its space when the first executor edited the file. The behavior was unaffected, but the line broke the file's formatting.
- **Fix:** Restored `const inviteDomainPattern = /https?…`.
- **Files modified:** test/build.test.js
- **Commit:** 15fda3b

### Acceptance-criterion note

- `grep -c "easteregg-trigger" src/_includes/partials/footer.njk` prints 1, not "at least 2". The id and the class are on the same line, and `grep -c` counts lines. `grep -o` finds 2 occurrences (id and class), which is what the criterion means. The markup was not split across lines just to satisfy the count.

**Total deviations:** 1 auto-fixed (Rule 1). **Impact:** none on behavior. Both tasks otherwise ran as written.

## Issues Encountered

- A heredoc-driven Node script stripped the backslashes from the new test's regexes, which first ran as `/sstyles*=/`. That run failed for the wrong reason, so it was not counted as RED evidence. The three regexes were fixed with the Edit tool, and the RED run that followed failed on the planned assertion.
- Git warns that LF will become CRLF in the touched files. This is the repo's existing autocrlf behavior. `src/css/style.css` stays CRLF.
- The parity script and its before/after builds used the scratchpad and `_test/` (gitignored), and the builds were deleted afterwards. The pre-change "before" build was made by temporarily restoring HEAD's `index.njk`, `footer.njk` and `style.css` from backups, then restoring the working files. `git diff --stat` was checked to be unchanged.

## Known Stubs

None.

## Threat Flags

None. T-03-SC (exact pin, lockfile integrity, deps test) and T-03-17 (the `?v=` hash matches the shipped bytes, checked per page) are mitigated as planned. No new network, auth or file-access surface was added.

## User Setup Required

None.

## Next Phase Readiness

- 03-09 can add `.lightbox.is-open`, `.decryption-overlay.is-open`, `.tag-error` and `.terminal-line-alert`. The no-inline-styles test already covers the HTML, and the runtime `element.style` writes in `main.js` belong to 03-09.
- 03-10 can split `src/css/style.css` behind `cssEntry` in lib/css.js. The new rules sit at the end of ABOUT US, RECRUITMENT SECTION and FOOTER, so they move with their partials.
- Open human check for 03-11 (D6): compare the converted elements with the Phase 1 baseline PNGs at 1440 and 390 px.

## Self-Check: PASSED

- FOUND: lib/css.js, src/css/style.11ty.js, test/css.test.js and all 9 modified files
- FOUND commits: 15fda3b, 3be633a (ancestors of HEAD; `git rev-list --count d03aeaf..HEAD` = 2)
- Acceptance Task 1: `"lightningcss": "1.33.0"` 1, `safari: 15 << 16` 1, `export function getCssBundle` 1, `permalink: "/css/style.css"` 1, `"src/css": "css"` 0, `addGlobalData("cssHash"` 1, `style.css?v={{ cssHash }}` 1, `npm test` exit 0
- Acceptance Task 2: `recruitment-cta` in index.njk 2, `easteregg-trigger` occurrences in footer.njk 2 (1 line), `.recruitment-instructions .recruitment-cta` 1, `.copyright .easteregg-trigger` 1, `node --test test/css.test.js` exit 0, `npm test` 259/259

---
*Phase: 03-performance-assets*
*Completed: 2026-10-11*
