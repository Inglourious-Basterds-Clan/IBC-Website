---
phase: 03-performance-assets
plan: 11
subsystem: infra
tags: [perf-gate, budget, build-chain, readme, parity, d-15, d-16, d-17, d-18, d-19, headless-chrome]

requires:
  - phase: 03-03
    provides: "lib/check-perf.js (BUDGET, checkPerf, measurePerf) and scripts/check-perf.js CLI"
  - phase: 03-10
    provides: "Final CSS partials and dead-CSS removal (the bundle the CSS cap is measured on)"
provides:
  - "npm run build = clean -> eleventy -> check-seo -> check-perf (&&-joined); every local, CI and IIS build is perf-gated"
  - "Final BUDGET: css 5120 / initial js 6144 / font 45824 B = measured 3957 / 4857 / 36460 B + 25 %, rounded up to 256, measured value and date beside each"
  - "Real-build gate tests (root and /IBC-Website/ pass, sizes within caps, inline-style regression caught, build chain pinned) and workflow test (j) no Lighthouse CI"
  - "README section 'Wydajność i zasoby' (image/font/icon/CSS/JS pipelines, perf gate, BUDGET reviewed-edit rule, manual PSI), src/images/ as the source folder, Phase 3 folders in 'Struktura projektu'"
  - "src/_dev/font-test.njk: Polish pangram at every styled weight (dev builds only)"
  - "parity/: 15 before (03ce0de) / after (6bcb04d) shot pairs, pixel-diff table, D-15 checklist with behaviour probes, final check-perf line, PSI table with the 67 baseline"
  - "Two D-15 layout fixes: picture > source { display: none } (header logo 24 px shift) and icon margins in lettered buttons (1.5-2 px narrower buttons)"
affects: [phase-04, phase-05, gsd-verify-work 03]

actuals:
  tokens: 6800
  tasks: 3
  commits: 7
plan_head_before: 1568c3a00ef00ea0629d17021a9a2f554b4f5382
plan_head_after: 7753ba61e7bb1fe811f4aea1449ccedd853afe6f

tech-stack:
  added: []
  patterns:
    - "Budget caps = measured post-phase size x 1.25, rounded up to a multiple of 256 B, with '// measured <n> B on <date> (<plan>)' beside each"
    - "Parity capture: python http.server --protocol HTTP/1.1, headless Chrome CDP, frozen Date, 3 s settle (7 s for the terminal), pixel share with any channel > 16 differing, second run as the noise floor"

key-files:
  created:
    - src/_dev/font-test.njk
    - .planning/phases/03-performance-assets/parity/parity.md
    - .planning/phases/03-performance-assets/parity/before/*.png (15)
    - .planning/phases/03-performance-assets/parity/after/*.png (15)
  modified:
    - package.json
    - lib/check-perf.js
    - scripts/check-perf.js
    - test/perf-gate.test.js
    - test/workflow.test.js
    - test/devpages.test.js
    - README.md
    - test/docs.test.js
    - src/css/partials/base.css
    - src/css/partials/components.css
    - src/css/partials/header.css
    - test/css.test.js

key-decisions:
  - "Caps measured on the largest of the root and /IBC-Website/ production builds (identical): css 3957 -> 5120, js 4857 -> 6144 (up from the provisional 5120, by the D-17 formula), font 36460 -> 45824"
  - "The CSS measurement was re-recorded after each parity fix (3932 -> 3938 -> 3957 B); the cap stayed 5120 throughout"
  - "picture > source { display: none } fixes the header logo shift at its root: display: contents made Chrome's visible-by-default source elements into flex items that each took the 12 px gap"
  - "Icons in lettered buttons get margin-right equal to the button letter-spacing (2px; 1.5px on .header-cta), the space the Font Awesome text glyph carried inside its box"
  - "The logo's slight softness is left to the 03-04 human check: AVIF q85 and sizes=100px were tried on throwaway builds and changed nothing visible, so the cause is the downscale path, not encoding"
  - "Committed parity set is the second capture run: runs are pixel-identical except the first navigation of a run"

patterns-established:
  - "A parity screenshot difference is chased to a computed box (CDP getBoundingClientRect) before it is classified as rendering noise"
  - "A new BUDGET measurement is a separate, reviewed commit that only edits the comment (or the cap) in lib/check-perf.js"

requirements-completed: [PERF-01, PERF-02, PERF-03, PERF-04, PERF-05, PERF-06, PERF-07]

coverage:
  - id: D1
    description: "npm run build ends with the perf gate; real root and /IBC-Website/ builds print check-perf: OK; a regression in a real build is reported"
    requirement: PERF-01
    verification:
      - kind: integration
        ref: "test/perf-gate.test.js#real builds pass the perf gate (D-16)"
        status: pass
      - kind: integration
        ref: "test/perf-gate.test.js#a regression in a real build is caught"
        status: pass
      - kind: unit
        ref: "test/perf-gate.test.js#npm run build ends with the perf gate; test/devpages.test.js#(i)"
        status: pass
      - kind: other
        ref: "SITE_URL=https://guard.example npm run build; MSYS_NO_PATHCONV=1 SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/ npm run build (both check-perf: OK)"
        status: pass
    human_judgment: false
  - id: D2
    description: "BUDGET CSS/JS/font caps = measured + 25 % rounded up to 256 B, with measured value and date beside each; other caps unchanged"
    requirement: PERF-07
    verification:
      - kind: integration
        ref: "test/perf-gate.test.js#every measured size is within its cap (D-17)"
        status: pass
    human_judgment: true
    rationale: "Prohibition 'MUST NOT raise a cap without a visible reviewed edit' is verification: judgment; the JS cap rose 5120 -> 6144 by the D-17 formula and the reviewer confirms that diff"
  - id: D3
    description: "CI keeps npm ci, npm test, npm run build and has no Lighthouse step"
    verification:
      - kind: unit
        ref: "test/workflow.test.js#(j) no Lighthouse CI (D-19)"
        status: pass
    human_judgment: false
  - id: D4
    description: "README documents the image, font, icon, CSS and JS pipelines, the perf gate, the BUDGET reviewed-edit rule and src/images/ as the source folder"
    verification:
      - kind: unit
        ref: "test/docs.test.js#(b) and #(e)"
        status: pass
    human_judgment: false
  - id: D5
    description: "/_dev/font-test/ shows the Polish pangram at every styled weight in dev builds only"
    verification:
      - kind: other
        ref: "ALLOW_LOCAL_SITE_URL=1 INCLUDE_DEV_PAGES=1 eleventy --output=_test/font-test-check; grep 'ZAŻÓŁĆ GĘŚLĄ JAŹŃ' _dev/font-test/index.html"
        status: pass
      - kind: integration
        ref: "test/devpages.test.js, test/css.test.js, test/modules.test.js, test/fonts.test.js"
        status: pass
    human_judgment: true
    rationale: "D-10 glyph appearance at each weight is a visual check (human check item 4)"
  - id: D6
    description: "Header logo position and lettered icon-button widths match the pre-Phase-3 site (D-15 fixes)"
    verification:
      - kind: unit
        ref: "test/css.test.js#picture sources never form a box (D-15); #icons in lettered buttons keep the old glyph's trailing letter-spacing (D-15)"
        status: pass
      - kind: automated_ui
        ref: "scratchpad CDP box probe: logo img x=30 / text x=91.0 (before 91.1); header CTA 127.5 px @1440, 39.5 px @390 (before identical)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Side-by-side screenshots show no visible design change beyond tiny font-rendering differences (D-15)"
    verification:
      - kind: automated_ui
        ref: "parity/before/*.png vs parity/after/*.png, parity.md pair table (0.22-2.36 %, all classified) and behaviour probes"
        status: pass
    human_judgment: true
    rationale: "Truth is verification: backstop; the user walks the D-15 checklist and judges the residual logo softness and hero softness on a 3x phone"
  - id: D8
    description: "Mobile PSI Performance on the GitHub Pages preview >= 90, recorded against the 67 baseline (D-18)"
    verification: []
    human_judgment: true
    rationale: "Needs the branch pushed to main and deployed (user action); the PSI row in parity.md is empty until the user runs it. Below 90 is a verification gap, not a pass"

duration: 49min
completed: 2026-10-11
status: complete
---

# Phase 3 Plan 11: Perf Gate in the Build, Final Budget, Docs and Parity Evidence Summary

**`npm run build` now ends with `check-perf` and the caps are set from measured post-Phase-3 sizes: CSS 3,957 B gzip, JS 4,857 B gzip and font 36,460 B give caps of 5,120 / 6,144 / 45,824 B. The README documents the new asset pipeline and the BUDGET rule, and a dev-only Polish pangram page checks the font. The before/after parity run found two real layout regressions, the header logo shifted 24 px and icon buttons 1.5–2 px narrower, and both are fixed before the 15 committed shot pairs were taken.**

## Performance

- **Duration:** about 49 min
- **Started:** 2026-10-11T10:06:58Z
- **Completed:** 2026-10-11T10:55:33Z
- **Tasks:** 3 (7 commits)
- **Files modified:** 44, of which 30 are screenshots

## Accomplishments

- **Build chain (D-16):** `node scripts/clean.js && eleventy && node scripts/check-seo.js && node scripts/check-perf.js`. Both production builds print `check-perf: OK`; the `/IBC-Website/` build also prints the check-seo preview banner. `_site/` again holds the `/IBC-Website/` build.
- **Final BUDGET (D-17):**
  - css 5120 (measured 3957)
  - initialJs 6144 (measured 4857)
  - font 45824 (measured 36460)

  Each has `// measured <n> B on 2026-10-11 (03-11), cap = measured + 25 %` beside it. The header note states that the numbers are the Phase 4/5 contract and that raising one is a reviewed edit. Hero, lightbox, width, font-count and shipped-image caps are unchanged.
- **Tests:**
  - perf-gate: real root and prefix builds return `[]`; every measured size is within its cap; an inline `style` on `<main>` of a copied real build is reported as P4; the build chain is pinned
  - workflow (j): no Lighthouse step, and npm ci, npm test and npm run build still run in order
  - devpages (i): updated to the new chain
  - css: two D-15 rules pinned

  `npm test`: 288/288.
- **README (Polish):**
  - new section `## Wydajność i zasoby` covering images, the font, icons, CSS, JS, the perf gate (P1-P11, `_site.rejected/`), the BUDGET rule and manual PSI with no Lighthouse CI
  - SEO generator sources moved to `src/images/logo.png` and `src/images/hero-bg.jpg`
  - "Struktura projektu" lists `src/images/`, `src/fonts/`, `src/css/partials/`, `src/css/style.11ty.js`, `src/js/modules/`, `scripts/check-perf.js`, `scripts/warm-images.js` and `tools/fonts/`, and has a fuller `lib/` line
  - the `npm run build` quick-start line names both gates
- **`/_dev/font-test/`:** "Zażółć gęślą jaźń" and "ZAŻÓŁĆ GĘŚLĄ JAŹŃ" in h1, section-header p, h2, h3, p, strong, `a.hud-btn` and `span.hud-badge.amber`. It uses only existing classes, has no inline styles, and appears in dev builds only.
- **Parity evidence (D-15):** 15 named pairs, before `03ce0de` and after `6bcb04d`. After the fixes, every remaining difference (0.22–2.36 %) falls into one of three groups:
  - the logo raster
  - sub-pixel glyph advances after Polish letters (line breaks and boxes are identical)
  - photo re-encoding inside gallery and lightbox images

  Behaviour probes on both builds agree: lightbox click, arrow keys, Esc, Enter and outside click; menu `aria-expanded` on open, close and link-follow; scroll-spy on all 4 links; terminal text and the red easter-egg line; AX names of the footer icons; no third-party font or icon hosts after Phase 3; a clean `/404.html` module set.
- **PSI record (D-18):** table with the 2026-10-08 baseline row (Performance 67; LCP 0/25, FCP 4/10, SI 7/10, CLS 25/25, TBT 30/30) and an empty post-Phase-3 row for the user.

## Task Commits

1. **Task 1 (tracer): build ends with the perf gate, caps from measured sizes:** `528052a` (feat). Tracer feedback gate: `human_verify_mode` is end-of-phase and the verify is automated only, so the full verify was re-run after the commit. It passed (288/288 at the time was 286/286, plus both builds OK). The tracer was verified end to end, then work moved to Task 2.
2. **Task 2: README pipeline section, docs test, pangram page:** `6a498d2` (docs)
3. **Task 3: parity evidence and PSI record:** `7753ba6` (docs). Fixes made during the task:
   - `39e5c21` (fix) picture sources hidden
   - `4b1c65b` (chore) CSS measurement 3938
   - `6bcb04d` (fix) icon margins
   - `9ee7c4e` (chore) final CSS measurement 3957

**Plan metadata:** in the docs(03-11) commit that adds this SUMMARY.

## Files Created/Modified

- `package.json`: build chain ends with `node scripts/check-perf.js`
- `lib/check-perf.js`: final CSS/JS/font caps with measurements; contract header note
- `scripts/check-perf.js`: header comment says the gate runs in `npm run build`
- `test/perf-gate.test.js`: real-build pass, caps, regression and build-chain tests
- `test/workflow.test.js`: (j) no Lighthouse CI
- `test/devpages.test.js`: (i) expects the new chain
- `README.md`: `## Wydajność i zasoby`, `src/images/` paths, project structure
- `test/docs.test.js`: new needles and paths
- `src/_dev/font-test.njk`: Polish pangram specimen (new)
- `src/css/partials/base.css`: `picture > source { display: none }`
- `src/css/partials/components.css`: `.hud-btn .icon { margin-right: 2px }`
- `src/css/partials/header.css`: `.header-cta .icon { margin-right: 1.5px }`
- `test/css.test.js`: both D-15 rules pinned
- `.planning/phases/03-performance-assets/parity/`: `parity.md` plus 15 + 15 PNGs (new)

## Decisions Made

See key-decisions in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Header logo 24 px right of its pre-Phase-3 position at every viewport**
- **Found during:** Task 3, first capture (w320-top 3.25 %, mobile-top 2.74 %)
- **Issue:** `picture { display: contents }` (03-01) made the logo's two `<source>` children into flex items of `.logo a`. Chrome does not hide `source`, so each one took the 12 px gap. 03-10's computed-style probe compared against a build that already had the shift, so it could not see it.
- **Fix:** `picture > source { display: none }` in base.css, plus a css.test.js check
- **Files modified:** src/css/partials/base.css, test/css.test.js
- **Verification:** CDP shows the img at x=30 and the text at 91.0 (before: 91.1); the w320-top diff fell to 1.45 %
- **Commit:** `39e5c21`

**2. [Rule 1 - Bug] Lettered icon buttons 1.5-2 px narrower than before**
- **Found during:** Task 3, header CTA box measurement
- **Issue:** the Font Awesome glyph was text, so the button's `letter-spacing` sat after it inside the icon box. The inline SVG (03-07) dropped that space, and the header CTA, 404 and recruitment Discord buttons shrank or shifted.
- **Fix:** `.hud-btn .icon { margin-right: 2px }` and `.header-cta .icon { margin-right: 1.5px }`, plus a css.test.js check
- **Files modified:** src/css/partials/components.css, src/css/partials/header.css, test/css.test.js
- **Verification:** CDP shows header CTA widths of 127.5 px at 1440 and 39.5 px at 390, identical to before
- **Commit:** `6bcb04d`

**3. [Rule 1 - Bug] Old build-chain assertion**
- **Found during:** Task 1
- **Issue:** `test/devpages.test.js` (i) pinned the old three-step build script and failed on the new chain
- **Fix:** it now expects the four-step chain
- **Commit:** `528052a`

**4. [Rule 3 - Blocking] Python `http.server` reset connections during capture**
- **Found during:** Task 3
- **Issue:** a local AdGuard filter proxies Chrome's traffic. The default HTTP/1.0 server reset some requests, so `load` never fired and CDP timed out.
- **Fix:** served with `--protocol HTTP/1.1`; the files served are the same
- **Commit:** none (capture setup only)

### Other notes

- Each parity fix changed the CSS bundle, so the measurement in the `BUDGET` comment was updated twice in separate commits (`4b1c65b`, `9ee7c4e`). The CSS cap stayed 5120.
- The JS cap rises from the provisional 5120 to 6144. That is what the D-17 formula gives (4857 × 1.25 = 6071 → 6144), not a loosening for convenience. It is called out here for the D-17 reviewed-edit rule.

**Total deviations:** 4 auto-fixed (3 Rule 1, 1 Rule 3). **Impact:** two real D-15 regressions from earlier plans are gone; no scope creep beyond them.

## Issues Encountered

- The Bash tool collapses `\\` escapes inside heredocs. An appended test got real newlines and backspace characters inside JS strings; this was caught at once and repaired with the Edit tool. Throwaway probe scripts were then written with the Write tool.
- The logo is slightly softer than before at 3× zoom. AVIF q85 and `sizes="100px"` were tried on throwaway builds and neither changed it visibly, so both were reverted. The cause is the downscale path (sharp lanczos at build time vs Chrome downscaling the 4608 px original). It is left to the human check rather than reversing 03-04's display-size decision.
- The parity folder adds 13 MB of PNGs to git history, as the plan asks and as Phase 1 did.

## Pending Human Checks (end of phase)

From parity.md "Human checks collected from 03-01 to 03-10":

1. Hero look, including softness on a 3× phone (03-01)
2. Gallery and lightbox formats and keyboard (03-04; already approved once)
3. Logo at 1440 and 390 px; judge the residual softness (03-04)
4. Fonts and Polish glyphs on `/_dev/font-test/`; Network panel shows only self-hosted fonts (03-05; approved once)
5. Icon glyph, size and baseline, and screen-reader names (03-07)
6. Visual comparison against the Phase 1 baselines `root-desktop-top.png` and `root-mobile-recruitment.png` (03-08 D6, 03-10 Task 3)
7. Five scripted features and a clean console with no failed module fetch on `/404.html` (03-09)
8. **PSI (D-18, needs user action):** push the branch to main, wait for "Build and deploy", then run mobile PageSpeed Insights 3 times on https://inglourious-basterds-clan.github.io/IBC-Website/ and enter the median in the parity.md PSI table. Below 90 is a verification gap.

## Known Stubs

None. The empty post-Phase-3 PSI row in parity.md is the intended human-filled record (D-18), not a stub.

## Threat Flags

None. T-03-21 is mitigated: the frozen BUDGET object has the measured value and date beside each cap, the README states the reviewed-edit rule, and real-build tests compare the measurements with the caps. T-03-22 is mitigated: check-perf is chained with `&&`, two tests pin the chain, and rejected output is moved to `_site.rejected/`. T-03-SC: no packages were installed; sharp was used only from node_modules in throwaway scratchpad scripts.

## User Setup Required

None beyond the PSI human-action step above.

## Next Phase Readiness

- Phase 3 has all 11 plans executed. The phase verification needs the human checks above and the PSI number. If PSI is below 90, it is recorded as a gap.
- Phase 4/5 work is gated by the BUDGET in every build. New CSS goes into a partial, and a new feature goes into a `data-js` module.

## Self-Check: PASSED

- FOUND: src/_dev/font-test.njk, parity/parity.md, 15 PNGs in parity/before/ and 15 in parity/after/ with matching names
- FOUND commits (ancestors of HEAD): 528052a, 6a498d2, 39e5c21, 4b1c65b, 6bcb04d, 9ee7c4e, 7753ba6. `git rev-list --count 1568c3a..HEAD` = 7.
- Acceptance, Task 1:
  - build-chain grep: 1
  - `measured` in lib/check-perf.js: 5
  - perf-gate + workflow tests: exit 0
  - `npm test`: 288/288
  - production `check-perf: css` line: every value at or below its cap
- Acceptance, Task 2:
  - `## Wydajność i zasoby`: 1
  - `scripts/check-perf.js` in README: 3
  - `src/images/` in README: 5
  - non-heading `src/assets/logo.png`: 0
  - pangram in font-test.njk: 7
  - `devOnly: true`: 1
  - docs test and `npm test`: exit 0
- Acceptance, Task 3:
  - 15/15 matching PNG names
  - parity.md has the pair table, the D-15 checklist, the `check-perf:` line and the PSI table with the baseline row
  - `git ls-files parity` = 31
- Plan verification:
  - `npm test` green
  - both production builds print `check-perf: OK`
  - README names `src/images/`
  - parity evidence committed

---
*Phase: 03-performance-assets*
*Completed: 2026-10-11*
