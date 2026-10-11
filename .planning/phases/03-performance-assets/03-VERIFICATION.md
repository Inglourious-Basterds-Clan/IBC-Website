---
phase: 03-performance-assets
verified: 2026-10-11T15:10:00Z
status: passed
score: 7/7 must-haves verified
covered_files: [".planning/phases/03-performance-assets/03-01-PLAN.md", ".planning/phases/03-performance-assets/03-01-SUMMARY.md", ".planning/phases/03-performance-assets/03-02-PLAN.md", ".planning/phases/03-performance-assets/03-02-SUMMARY.md", ".planning/phases/03-performance-assets/03-03-PLAN.md", ".planning/phases/03-performance-assets/03-03-SUMMARY.md", ".planning/phases/03-performance-assets/03-04-PLAN.md", ".planning/phases/03-performance-assets/03-04-SUMMARY.md", ".planning/phases/03-performance-assets/03-05-PLAN.md", ".planning/phases/03-performance-assets/03-05-SUMMARY.md", ".planning/phases/03-performance-assets/03-06-PLAN.md", ".planning/phases/03-performance-assets/03-06-SUMMARY.md", ".planning/phases/03-performance-assets/03-07-PLAN.md", ".planning/phases/03-performance-assets/03-07-SUMMARY.md", ".planning/phases/03-performance-assets/03-08-PLAN.md", ".planning/phases/03-performance-assets/03-08-SUMMARY.md", ".planning/phases/03-performance-assets/03-09-PLAN.md", ".planning/phases/03-performance-assets/03-09-SUMMARY.md", ".planning/phases/03-performance-assets/03-10-PLAN.md", ".planning/phases/03-performance-assets/03-10-SUMMARY.md", ".planning/phases/03-performance-assets/03-11-PLAN.md", ".planning/phases/03-performance-assets/03-11-SUMMARY.md", "README.md", "eleventy.config.js", "lib/check-perf.js", "lib/css.js", "lib/icons.js", "lib/images.js", "lib/reject-output.js", "lib/woff2.js", "package.json", "scripts/check-perf.js", "scripts/check-seo.js", "scripts/warm-images.js", "src/404.njk", "src/_data/gallery.js", "src/_dev/font-test.njk", "src/_dev/og-override.njk", "src/_includes/layouts/base.njk", "src/_includes/partials/discord-cta.njk", "src/_includes/partials/footer.njk", "src/_includes/partials/head.njk", "src/_includes/partials/header.njk", "src/css/partials/base.css", "src/css/partials/components.css", "src/css/partials/fonts.css", "src/css/partials/footer.css", "src/css/partials/gallery.css", "src/css/partials/header.css", "src/css/partials/hero.css", "src/css/partials/recruitment.css", "src/css/partials/responsive.css", "src/css/partials/sections.css", "src/css/style.11ty.js", "src/css/style.css", "src/fonts/OFL.txt", "src/fonts/montserrat-latin-ext.var.woff2", "src/index.njk", "src/js/main.js", "src/js/modules/easter-egg.js", "src/js/modules/lightbox.js", "src/js/modules/menu.js", "src/js/modules/scroll-spy.js", "src/js/modules/terminal.js", "src/web.config.njk", "test/build.test.js", "test/client.test.js", "test/css.test.js", "test/deps.test.js", "test/devpages.test.js", "test/docs.test.js", "test/fixtures/montserrat-ascii.var.woff2", "test/fonts.test.js", "test/icons.test.js", "test/images.test.js", "test/layout.test.js", "test/links.test.js", "test/modules.test.js", "test/perf-gate.test.js", "test/seo-assets.test.js", "test/seo-files.test.js", "test/seo.test.js", "test/workflow.test.js", "tools/fonts/README.md", "tools/seo-images/make-seo-images.js"]
covered_digest: "v3:sha256:a9e94c8bbf434aaf89945510126feedae0ead317218cc6eee26143befa5e0c59"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 5/7
  gaps_closed:
    - "(03-11 backstop, D-15) Side-by-side screenshots show no visible design change beyond tiny font-rendering differences: closed by 03-UAT.md test 2 (pass)"
    - "(03-11 backstop, D-18) Mobile PSI Performance on the GitHub Pages preview >= 90: closed by 03-UAT.md test 1 (pass, Performance 100); the live preview serves the Phase 3 build (style.css?v=2b958c735b, matching the local build)"
  gaps_remaining: []
  regressions: []
---

# Phase 3: Performance & Assets Verification Report

**Phase Goal:** Pages load fast on mobile with optimized images, self-hosted fonts and no heavy third-party assets. CSS and JS are structured so new pages and the visual refresh fit within the performance budget.
**Verified:** 2026-10-11
**Status:** passed
**Re-verification:** Yes. The previous report (`human_needed`, 5/7) had no `gaps:` section, only two backstop truths waiting for human evidence. The completed UAT (`03-UAT.md`, 8/8 pass) now provides that evidence.

## What changed since the previous report

- **Code: nothing.** `git diff --stat 9ee7c4e..HEAD -- . ':!.planning'` is empty and the working tree is clean. Every commit since the last code commit touches `.planning/` only: review, security, validation, UI review and UAT.
- **Why the digest moved:** The fingerprint changed from `462f8f…` to `a9e94c8b…` because of line endings on disk. `git ls-files --eol` shows `i/lf w/crlf` (the system gitconfig has `autocrlf=true`, the repo config has `false`). It is not a content change.
- **Human evidence:** `03-UAT.md` (status `complete`, 8 passed, 0 issues) covers all 8 items from the previous `human_verification` list.

Evidence I produced in my own process for this re-verification:

- **Regression build and gate:** a fresh `/IBC-Website/` production build into the session scratchpad, followed by `check-perf` on it: `OK, 2 page(s) checked`.
- **Built-output greps:** the hero `<img>`, lazy loading, the single stylesheet, inline styles, `data-js` hooks, icon labels and absent CDN hosts.
- **Live page:** one GET of the deployed GitHub Pages preview.
- **Test suite:** the orchestrator ran `npm test` (288/288 pass). I did not run the suite again.

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP SC unless noted) | Status | Evidence |
|---|---|---|---|
| 1 | Hero is `<img fetchpriority="high">` ≤ ~120 KB on mobile; gallery is AVIF/WebP with responsive srcset and explicit dimensions; below-the-fold images lazy-load | ✓ VERIFIED | **Hero:** the rebuilt `index.html` has `<img class="hero-img" loading="eager" fetchpriority="high" … width="1920" height="1080" srcset="…640w … 1920w" sizes="100vw">`. `check-perf` reports `hero mobile max 116260 B (cap 122880)`. **Lazy loading:** 6 `loading="lazy"` attributes: the 4 gallery images, the lightbox `<img>` and the header logo. The logo is above the fold, so lazy loading it is harmless but unnecessary (see Info). Tests: `images.test.js` and perf-gate P1/P6/P7, all part of the 288/288 run. The UAT 3x-phone check passed (test 3). |
| 2 | Lightbox loads an optimized version under 300 KB; logo served at display size; duplicate `hero.jpg` gone | ✓ VERIFIED | **Lightbox:** `check-perf` reports `lightbox max 229074 B (cap 307200)`. **hero.jpg:** `git ls-files \| grep -c 'hero\.jpg$'` returns 0. **Logo:** 50 w/100 w variants, unchanged since the previous report (no code change). The UAT logo check passed (test 4). |
| 3 | No Google Fonts / Font Awesome CDN requests; "Zażółć gęślą jaźń" renders in every self-hosted font; icons are inline SVGs announced by name | ✓ VERIFIED | **No CDN hosts:** a grep of the rebuilt output for `fonts.googleapis`, `cdnjs` and `font-awesome` finds 0 files. The live preview also has 0 hits and references `montserrat-latin-ext.var.woff2`. **Icons:** `aria-label` values Discord, YouTube and Facebook appear once each. **Font:** `check-perf` reports `font 36460 B`. **Human checks:** UAT test 5 (glyphs at every weight, self-hosted requests only) and test 6 (NVDA/VoiceOver names, no doubled announcements) passed. |
| 4 | Each page loads a single minified CSS bundle; built HTML has no inline `style=` | ✓ VERIFIED | **One bundle:** `index.html` and `404.html` have one `<link rel="stylesheet">` each, `css/style.css?v=2b958c735b`. `css/` holds only `style.css`. **No inline styles:** `style=` count is 0 in both pages. **Size:** `check-perf` reports `css 3957 B gz (cap 5120)`. |
| 5 | JS features load as ES modules through `data-js` hooks; a page without gallery/terminal/easter egg loads without console errors and doesn't run that code | ✓ VERIFIED | **Hooks:** `index.html` has menu, scroll-spy, lightbox, terminal and easter-egg. `404.html` has menu, scroll-spy and easter-egg only. **Modules:** `js/modules/` ships the 5 modules. **Tests:** `modules.test.js` and `client.test.js` (in the 288 pass). **Real browser:** UAT test 7 passed. `/404.html` fetched no lightbox or terminal module, and the console showed no errors and no failed fetches. |
| 6 | (03-11 backstop, D-15) Side-by-side screenshots show no visible design change beyond tiny font-rendering differences | ✓ VERIFIED (human evidence) | **Screenshots:** 15/15 before/after pairs plus a diff table (0.22–2.36 %) in `parity/`. **Human judgment:** UAT test 2 passed; the user compared the pairs and the Phase 1 baselines. The backstop requires explicit human evidence, and this is it. |
| 7 | (03-11 backstop, D-18) Mobile PSI Performance on the GitHub Pages preview ≥ 90, recorded against the 2026-10-08 baseline (67) | ✓ VERIFIED (human evidence; see warning) | **Measurement:** UAT test 1 passed with the note "Mobile Performance 100" (target ≥ 90, baseline 67). **Corroboration (mine):** the live preview `https://inglourious-basterds-clan.github.io/IBC-Website/` returns 200. It serves `style.css?v=2b958c735b`, the same hash as my local build, and has `fetchpriority="high"`, `type="module" src="/IBC-Website/js/main.js"` and the self-hosted woff2, with no CDN hosts. So the score was measured on the Phase 3 build. **Gap in the record:** the plan wording "recorded in parity.md" is not met. The "Post-Phase 3, median of 3" row in `parity/parity.md` is still empty. The value lives only in `03-UAT.md`, as a single number without a 3-run median or LCP/FCP/SI/CLS/TBT sub-scores. This is a bookkeeping warning, not a goal failure. |

**Score:** 7/7 truths verified (0 present-but-behavior-unverified)

#### Plan-level must-haves (regression check; no code changed since the previous full verification)

| Plan | Key truths | Status | Evidence |
|---|---|---|---|
| 03-01 | eleventy-img pipeline, `.cache/img`, `pretest` warm, sharp 0.35.5 | ✓ | `package.json` `pretest` = `node scripts/warm-images.js`; `deps.test.js` in 288 pass |
| 03-02 | variable Montserrat ≤ 45 KB, Polish cmap, OFL | ✓ | font 36,460 B (`check-perf`); `fonts.test.js` pass |
| 03-03 | check-perf P0–P11, frozen BUDGET, reject-and-move | ✓ | gate OK on the fresh build; `perf-gate.test.js` pass |
| 03-04 | gallery loop, 1600 w lightbox, logo picture, SEO images untouched | ✓ | truths 1 and 2 |
| 03-05 | Google Fonts removed, `@font-face` + preload, IIS MIME | ✓ | truth 3; unchanged sources |
| 03-06 | originals in `src/images/`, `hero.jpg` deleted | ✓ | `git ls-files` returns 0 `hero.jpg` |
| 03-07 | inline SVG `{% icon %}`, FA CDN gone | ✓ | truth 3 |
| 03-08 | Lightning CSS bundle with `?v=` hash, no inline styles | ✓ | truth 4 |
| 03-09 | module entry, five modules, `init(el)` no-ops | ✓ | truth 5 |
| 03-10 | 10 partials, dead CSS removed | ✓ | `css.test.js` pass |
| 03-11 | build chain ends in check-perf, measured caps, no Lighthouse CI, README, pangram page, parity | ✓ | `build` = `node scripts/clean.js && eleventy && node scripts/check-seo.js && node scripts/check-perf.js`. Backstops are truths 6 and 7. |

### Prohibitions (ADR-550)

| Plan | Prohibition | Tier | Disposition |
|---|---|---|---|
| 03-01 | Sharp only the vetted 0.35.5 | test | ✓ `test/deps.test.js` |
| 03-02 | OFL shipped and unedited | test | ✓ present; the test checks key strings plus the output hash |
| 03-03 | Failed or crashed build never left deployable | test | ✓ CLI tests (see the CR-01 warning) |
| 03-04 / 03-06 | SEO images never regenerated or moved | test | ✓ unchanged since the previous report (no code commits) |
| 03-05 / 03-07 | No third-party host for fonts or icons | test | ✓ tests, the fresh build and the live page |
| 03-06 | `patrol.jpg` and `sniper.jpg` not deleted | test | ✓ `build.test.js` |
| 03-09 | Terminal messages unchanged; no gallery or terminal code on pages without them | test | ✓ `client.test.js`, `modules.test.js`, and UAT test 7 |
| 03-10 | Roster/calendar/form CSS not kept | test | ✓ `css.test.js` |
| 03-01, 03-02, 03-03, 03-08/10, 03-11 (caps) | Hero look unchanged; Python tools not in repo; budget numbers only in BUDGET; no computed-style change; caps only raised by a reviewed edit (JS cap 5120 to 6144 in `528052a`) | judgment | ✓ resolved by a human in UAT test 8 (pass) |
| 03-07 | No doubled or unnamed SR announcements | judgment | ✓ resolved by a human in UAT test 6 (pass) |
| 03-11 | Phase 3 not reported done when PSI < 90 | judgment | ✓ honoured: the measured value is 100, and the phase stayed `human_needed` until it was measured |

No flagged (unresolved) prohibitions remain.

### Required Artifacts

| Artifact | Status | Details |
|---|---|---|
| `lib/images.js`, `scripts/warm-images.js` | ✓ VERIFIED | wired via `eleventy.config.js` and `pretest` |
| `lib/woff2.js`, `src/fonts/*`, `tools/fonts/README.md` | ✓ VERIFIED | font shipped and referenced |
| `lib/check-perf.js`, `scripts/check-perf.js`, `lib/reject-output.js` | ✓ VERIFIED | the build chain runs the gate; it ran OK on the fresh build |
| `src/_data/gallery.js` | ✓ VERIFIED | consumed by `lib/images.js` and the index loop |
| `lib/icons.js` | ✓ VERIFIED | labelled icons in the output |
| `lib/css.js`, `src/css/style.11ty.js`, `src/css/partials/` (10) | ✓ VERIFIED | one hashed bundle |
| `src/js/main.js`, `src/js/modules/*` (5) | ✓ VERIFIED | module script and hooks in the output |
| `src/_dev/font-test.njk` | ✓ VERIFIED | pangram page (dev only); UAT test 5 |
| `parity/parity.md` | ⚠️ PARTIAL | D-15 record complete. The D-18 PSI table exists, but the post-Phase-3 row is empty (the value is only in `03-UAT.md`). |

### Key Link Verification

The links are unchanged since the previous report because no code changed. All 10 links were confirmed WIRED there. The fresh build confirms the observable ends:

- the hero picture with prefixed `/IBC-Website/img/` URLs
- the `style.css?v=` hash
- the module script with `data-js` hooks
- the labelled icons
- check-perf running against the build

| From | To | Via | Status |
|---|---|---|---|
| `package.json` | `scripts/check-perf.js` | build chain | ✓ WIRED |
| `src/index.njk` / `head.njk` | `lib/images.js` | picture shortcode, preload | ✓ WIRED |
| `head.njk` | `lib/css.js` | `style.css?v={{ cssHash }}` | ✓ WIRED |
| `base.njk` | `main.js` → `modules/` | module script + `data-js` | ✓ WIRED |
| `footer.njk` | `lib/icons.js` | `{% icon %}` | ✓ WIRED |
| `scripts/check-seo.js`, `scripts/check-perf.js` | `lib/reject-output.js` | `removeRejectedOutput` | ✓ WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|---|---|---|---|---|
| Hero, gallery and logo pictures | `images.*` | `processImages()` over `src/images/*` | yes (encoded files with measured sizes) | ✓ FLOWING |
| Lightbox | `data-lightbox-*` | `images.gallery` 1600 w variants | yes | ✓ FLOWING |
| CSS bundle and hash | `getCssBundle()` | Lightning CSS over the partials | yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Perf gate on a fresh `/IBC-Website/` build | `eleventy --output=<scratch>/pfx` then `check-perf --dir <scratch>/pfx` | `check-perf: OK, 2 page(s) checked`; css 3957 / initial js 4910 / font 36460 / hero 116260 / lightbox 229074 B, all under the caps | ✓ PASS |
| Deployed preview is the Phase 3 build | `curl https://inglourious-basterds-clan.github.io/IBC-Website/` | 200; `style.css?v=2b958c735b`, `fetchpriority="high"`, module `main.js`, self-hosted woff2, 0 CDN hosts | ✓ PASS |
| Full suite (orchestrator regression gate) | `npm test` | 288/288 pass | ✓ PASS |

The initial JS is 4910 B gz locally against 4857 B in the previous report and the parity record. The difference is CRLF line endings in the working tree (`w/crlf`). CI checks out LF, so the deployed bytes match the recorded 4857 B. Both are under the 6144 cap.

### Probe Execution

No `scripts/*/tests/probe-*.sh` exist and no plan declares one, so Step 7c does not apply. The perf gate CLI above is the phase's runnable check.

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|---|---|---|---|---|
| PERF-01 | 03-01, 03-04, 03-11 | AVIF/WebP, responsive srcset, explicit dimensions, lazy below the fold | ✓ SATISFIED | Truth 1 |
| PERF-02 | 03-01, 03-06, 03-11 | Hero `<img fetchpriority=high>` ≤ ~120 KB on mobile; `hero.jpg` removed | ✓ SATISFIED | Truths 1 and 2 |
| PERF-03 | 03-04, 03-11 | Lightbox < 300 KB; logo at display size | ✓ SATISFIED | Truth 2 |
| PERF-04 | 03-02, 03-05, 03-11 | Self-hosted woff2 with Polish glyphs; no Google Fonts | ✓ SATISFIED | Truth 3 |
| PERF-05 | 03-07, 03-11 | Inline SVG icons with accessible names | ✓ SATISFIED | Truth 3 |
| PERF-06 | 03-08, 03-10, 03-11 | CSS partials into one minified bundle; inline styles removed | ✓ SATISFIED | Truth 4 |
| PERF-07 | 03-09, 03-11 | ES modules via `data-js`; no-op without the feature | ✓ SATISFIED | Truth 5 |

No orphaned requirements. REQUIREMENTS.md maps exactly PERF-01..07 to Phase 3, and all are marked Complete. PERF-08 (Lighthouse ≥ 90 in all four categories) belongs to Phase 5.

### Advisory (New Scope, Unevidenced)

None. No new code entered scope since the previous report.

### Anti-Patterns Found

These are carried from `03-REVIEW.md` / `03-REVIEW-DISPOSITION.md`, where all 12 findings are still `open`. None of them blocks the phase goal.

| File | Pattern | Severity | Impact |
|---|---|---|---|
| `lib/reject-output.js` | CR-01: `--dir` pointed at any in-repo folder (`src`, `.git`) gets P0 and is then moved or recursively deleted | ⚠️ Warning | Tooling safety, not the phase goal. Fix with an allow-list (`_site`, `_test/**`) before Phase 4. The review rates it critical, so triage it explicitly. |
| `src/js/main.js` | WR-01 / IN-02: module URLs not cache-busted; `Promise.all` has no rejection handler | ⚠️ Warning | Stale JS can run after a deploy |
| `lib/check-perf.js` | WR-03 / WR-04: thumbnails, logo and desktop hero are not size-gated; P10 fails open for external and inline scripts | ⚠️ Warning | Phase 4/5 additions could bypass the budget |
| `lib/images.js` | WR-05: `processImages()` is memoized for the whole dev process | ℹ️ Info | Dev-server staleness only |
| header logo `<img class="logo-img">` (built `index.html`) | `loading="lazy"` on an above-the-fold image | ℹ️ Info | Tiny (logo is 50 w, not the LCP element; PSI 100), but `loading="eager"` would be the correct hint |
| `src/js/modules/lightbox.js`, `easter-egg.js` | WR-02: `body.style.overflow = 'auto'` on close | ℹ️ Info | Runtime-only; can override the `overflow-x` guard |
| `parity/parity.md` | The D-18 "Post-Phase 3, median of 3" row is empty | ⚠️ Warning | The evidence record disagrees with `03-UAT.md`. Fill in the row (median of 3, with sub-scores if available). |

No `TBD`, `FIXME` or `XXX` markers in phase-modified source files (grep of `lib`, `scripts`, `src/js`, `src/css`, `src/_includes`, `src/index.njk`, `src/404.njk` and `eleventy.config.js` returned nothing).

### Human Verification Required

None outstanding. All 8 items from the previous report were completed in `03-UAT.md` (8 passed, 0 issues, 0 skipped):

1. PSI: 100
2. D-15 parity
3. Hero on 3x phones
4. Logo
5. Fonts
6. Icons and screen reader
7. Scripted features and the 404 console
8. Judgment-tier prohibitions

### Gaps Summary

No blocking gaps. All 5 roadmap success criteria, all 11 plans' must-haves and all 7 PERF requirements are met:

- **Automated evidence:** the fresh build, the perf gate, the built-output greps and the 288/288 suite.
- **Human evidence for the two backstop truths:** D-15 parity passed, and D-18 mobile PSI Performance is 100 against a ≥ 90 target and a 67 baseline. The live preview is confirmed to serve the Phase 3 build.

Recommended follow-ups (non-blocking):
1. Fill in the D-18 row in `parity/parity.md` (median of 3 runs and sub-scores) so the plan's own record matches `03-UAT.md`.
2. Triage CR-01 before Phase 4. The review rates it critical, and it is a destructive-tooling risk.
3. Consider WR-03 and WR-04 so the budget gate covers what Phase 4 and 5 will add.

---

_Verified: 2026-10-11_
_Verifier: Claude (gsd-verifier)_
