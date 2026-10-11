---
phase: 03-performance-assets
verified: 2026-10-11T12:00:00Z
status: human_needed
score: 5/7 must-haves verified (2 backstop truths need human evidence)
covered_files: [".planning/phases/03-performance-assets/03-01-PLAN.md", ".planning/phases/03-performance-assets/03-01-SUMMARY.md", ".planning/phases/03-performance-assets/03-02-PLAN.md", ".planning/phases/03-performance-assets/03-02-SUMMARY.md", ".planning/phases/03-performance-assets/03-03-PLAN.md", ".planning/phases/03-performance-assets/03-03-SUMMARY.md", ".planning/phases/03-performance-assets/03-04-PLAN.md", ".planning/phases/03-performance-assets/03-04-SUMMARY.md", ".planning/phases/03-performance-assets/03-05-PLAN.md", ".planning/phases/03-performance-assets/03-05-SUMMARY.md", ".planning/phases/03-performance-assets/03-06-PLAN.md", ".planning/phases/03-performance-assets/03-06-SUMMARY.md", ".planning/phases/03-performance-assets/03-07-PLAN.md", ".planning/phases/03-performance-assets/03-07-SUMMARY.md", ".planning/phases/03-performance-assets/03-08-PLAN.md", ".planning/phases/03-performance-assets/03-08-SUMMARY.md", ".planning/phases/03-performance-assets/03-09-PLAN.md", ".planning/phases/03-performance-assets/03-09-SUMMARY.md", ".planning/phases/03-performance-assets/03-10-PLAN.md", ".planning/phases/03-performance-assets/03-10-SUMMARY.md", ".planning/phases/03-performance-assets/03-11-PLAN.md", ".planning/phases/03-performance-assets/03-11-SUMMARY.md", "README.md", "eleventy.config.js", "lib/check-perf.js", "lib/css.js", "lib/icons.js", "lib/images.js", "lib/reject-output.js", "lib/woff2.js", "package.json", "scripts/check-perf.js", "scripts/check-seo.js", "scripts/warm-images.js", "src/404.njk", "src/_data/gallery.js", "src/_dev/font-test.njk", "src/_dev/og-override.njk", "src/_includes/layouts/base.njk", "src/_includes/partials/discord-cta.njk", "src/_includes/partials/footer.njk", "src/_includes/partials/head.njk", "src/_includes/partials/header.njk", "src/css/partials/base.css", "src/css/partials/components.css", "src/css/partials/fonts.css", "src/css/partials/footer.css", "src/css/partials/gallery.css", "src/css/partials/header.css", "src/css/partials/hero.css", "src/css/partials/recruitment.css", "src/css/partials/responsive.css", "src/css/partials/sections.css", "src/css/style.11ty.js", "src/css/style.css", "src/fonts/OFL.txt", "src/fonts/montserrat-latin-ext.var.woff2", "src/index.njk", "src/js/main.js", "src/js/modules/easter-egg.js", "src/js/modules/lightbox.js", "src/js/modules/menu.js", "src/js/modules/scroll-spy.js", "src/js/modules/terminal.js", "src/web.config.njk", "test/build.test.js", "test/client.test.js", "test/css.test.js", "test/deps.test.js", "test/devpages.test.js", "test/docs.test.js", "test/fixtures/montserrat-ascii.var.woff2", "test/fonts.test.js", "test/icons.test.js", "test/images.test.js", "test/layout.test.js", "test/links.test.js", "test/modules.test.js", "test/perf-gate.test.js", "test/seo-assets.test.js", "test/seo-files.test.js", "test/seo.test.js", "test/workflow.test.js", "tools/fonts/README.md", "tools/seo-images/make-seo-images.js"]
covered_digest: "v3:sha256:462f8f2183d995028d376a65c18bf7b463f6627e451835aa9faeee83a0800987"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "D-18 PSI gate: push/merge the branch to main, wait for the 'Build and deploy' workflow, run mobile PageSpeed Insights 3 times on https://inglourious-basterds-clan.github.io/IBC-Website/ and record the median row in parity/parity.md"
    expected: "Mobile Performance >= 90 (baseline 67; LCP 0/25). Below 90 is a verification gap (D-18 prohibition), not a pass"
    why_human: "Needs a deploy to GitHub Pages and an external PSI run; the post-Phase-3 PSI row in parity.md is empty. Backstop truth (insufficient_spec): build-size evidence cannot stand in for a field/lab score"
  - test: "D-15 visual parity: walk parity/before vs parity/after (15 pairs) and the D-15 checklist in parity.md; compare against Phase 1 baselines root-desktop-top.png and root-mobile-recruitment.png"
    expected: "No visible design change beyond sub-pixel font-rendering and photo re-encoding differences"
    why_human: "Backstop truth; visual judgment. Diffs 0.22-2.36 % were classified by the executor, not by an independent check"
  - test: "Hero on a real 3x phone (and a 428-430 CSS px 3x phone such as iPhone Pro Max)"
    expected: "Hero sharpness acceptable; note that at 1284+ device px the browser picks the 1920 w candidate (AVIF 183 KB / WebP 259 KB / JPEG 242 KB), above the ~120 KB mobile target"
    why_human: "Pitfall 9 / research A5: candidate selection and perceived softness depend on the device; the gate defines mobile deterministically as <= 1280 w"
  - test: "Header logo at 1440 and 390 px"
    expected: "Slight softness of the 50 w/100 w variants is acceptable; position and spacing match before"
    why_human: "Visual judgment of residual raster softness (03-04 / 03-11)"
  - test: "Open /_dev/font-test/ (npm run dev) and the home page; check DevTools Network"
    expected: "'Zażółć gęślą jaźń' / 'ZAŻÓŁĆ GĘŚLĄ JAŹŃ' render with correct Polish glyphs at every weight; only self-hosted font requests, no Google Fonts / cdnjs"
    why_human: "cmap coverage is verified by test; actual rendering quality at each weight is visual"
  - test: "Icons: glyph, size and baseline; screen reader (NVDA/VoiceOver) on footer icon links, header CTA at 390 px and the recruitment button"
    expected: "Footer links announced once as 'Discord', 'YouTube', 'Facebook'; header CTA as 'Discord' even when the label is visually hidden on mobile; no doubled names"
    why_human: "Markup (aria-label + aria-hidden svg) verified; actual announcement is AT behaviour. Also resolves the judgment-tier prohibition from 03-07"
  - test: "Served build: exercise menu, lightbox (click, Enter/Space, arrows, Esc, outer click), terminal boot, scroll-spy, easter egg; then load /404.html with DevTools console + Network open"
    expected: "All five features behave as before; /404.html fetches main.js + menu/scroll-spy/easter-egg modules only, no lightbox/terminal module, no failed fetch, no console error"
    why_human: "Unit tests use a fake DOM; real-browser console cleanliness and module fetches are runtime observations"
  - test: "Review the judgment-tier prohibitions listed in the report (hero look unchanged, no computed-style change from bundling/splitting, BUDGET caps only raised by reviewed edit — the JS cap went 5120 -> 6144 in 528052a, Python font tools not in repo, budget numbers only in BUDGET)"
    expected: "Each confirmed by the reviewer"
    why_human: "unverified-prohibition — human review recommended (judgment tier; the verifier's verdict below is non-authoritative)"
---

# Phase 3: Performance & Assets Verification Report

**Phase Goal:** Pages load fast on mobile with optimized images, self-hosted fonts and no heavy third-party assets. CSS and JS are structured so new pages and the visual refresh fit within the performance budget.
**Verified:** 2026-10-11
**Status:** human_needed
**Re-verification:** No (initial verification)

All evidence below was produced by the verifier in its own process:
- fresh root (`SITE_URL=https://guard.example`) and `/IBC-Website/` production builds into the session scratchpad
- `check-perf` on both (OK)
- `check-seo` on the prefix build (OK)
- one full `npm test` run (288/288, 0 fail)
- direct greps of the built output and the sources

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP SC unless noted) | Status | Evidence |
|---|---|---|---|
| 1 | Hero is `<img fetchpriority="high">` ≤ ~120 KB on mobile; gallery is AVIF/WebP with responsive srcset and explicit dimensions; below-the-fold images lazy-load | ✓ VERIFIED | **Hero:** `<img class="hero-img" loading="eager" fetchpriority="high" width="1920" height="1080">` sits inside a `<picture>` with avif and webp sources. There is one typed AVIF preload, and its `imagesrcset` is prefixed `/IBC-Website/img/`. Hero files at ≤ 1280 w measure: 1280 AVIF 83,360 / WebP 116,260 / JPEG 112,776 B, all ≤ 122,880. **Gallery:** 4 pictures with avif and webp `srcset` at 400–1200 w, `width`/`height` set, `loading="lazy"` and `decoding="async"`. The lightbox img is also lazy. Tests: `images.test.js` (hero, preload, 120 KB, gallery) and `perf-gate` P1/P6/P7. |
| 2 | Lightbox loads an optimized version under 300 KB; logo served at display size; duplicate `hero.jpg` gone | ✓ VERIFIED | **Lightbox data:** all 12 `data-lightbox-*` URLs point at 1600 w files. The largest is 229,074 B (< 307,200). **Lightbox behaviour:** the code inserts the avif/webp `<source>`s before setting `img.src`. `modules.test.js` "lightbox opens item 0 with avif/webp sources set before img.src" passes. **Logo:** 50 w/100 w AVIF/WebP/PNG variants with `sizes="50px"`; the 50 w PNG is 6,295 B. **hero.jpg:** `git ls-files` has no `src/assets/hero.jpg`, and the output has no original under its own name. `assets/` ships only `og/`, `icons/` and `brand/`. |
| 3 | No Google Fonts / Font Awesome CDN requests; "Zażółć gęślą jaźń" renders in every self-hosted font; icons are inline SVGs announced by name | ✓ VERIFIED (visual and AT confirmation in human items) | **No CDN hosts:** a grep of every shipped text file in both builds for `fonts.googleapis`, `fonts.gstatic`, `cdnjs`, `font-awesome` and `fa-*` classes finds 0 hits. The only external `src`/`href` values are the Discord, YouTube and Facebook links and the canonicals. **Font:** one `@font-face` for Montserrat from `../fonts/montserrat-latin-ext.var.woff2` with weight 100 900 and `swap`, plus one `font/woff2` preload. **Glyphs:** `fonts.test.js` "covers every Polish letter" and "every shipped character has a glyph" both pass. **Icons:** every `<svg>` has `aria-hidden="true" focusable="false"`. Icon-only links carry `aria-label` "Discord", "YouTube" or "Facebook". The header CTA keeps a visually hidden `header-cta-label` on mobile. |
| 4 | Each page loads a single minified CSS bundle; built HTML has no inline `style=` | ✓ VERIFIED | **One bundle:** each page has exactly one stylesheet link, `css/style.css?v=2b958c735b`. The bundle is 17,054 B on one line and keeps the `-webkit-` prefixes (css.test). **No inline styles:** 0 `style=` attributes and 0 `<style>` elements in either build. `css/` ships only `style.css`. **Source layout:** `src/css/style.css` is only `@import`s of 10 partials. Tests: `css.test.js` (11 tests) and `perf-gate` P4/P5. |
| 5 | JS features load as ES modules through `data-js` hooks; a page without gallery/terminal/easter egg loads without console errors and doesn't run that code | ✓ VERIFIED | **Loading:** every page has one `<script type="module" src=".../js/main.js">`. `main.js` uses a frozen literal loader map with an `hasOwnProperty` guard. **Hooks:** `index.html` has menu, scroll-spy, lightbox, terminal and easter-egg. `404.html` has menu, scroll-spy and easter-egg only, so the lightbox and terminal modules are never fetched there. **Guards:** each module's `init(el)` returns early when an element it needs is missing. Tests: `modules.test.js` (16 tests: no hooks means no loader, unknown name, document order, adjacency, no-op guards, 404/dev hooks). The real-browser console check is human item 7. |
| 6 | (03-11 backstop, D-15) Side-by-side screenshots show no visible design change beyond tiny font-rendering differences | ? insufficient_spec | 15/15 before/after PNG pairs exist in `parity/` along with a diff table (0.22–2.36 %). The judgment is visual and the truth is tagged `verification: backstop`, so it goes to human review. |
| 7 | (03-11 backstop, D-18) Mobile PSI Performance on the GitHub Pages preview ≥ 90, recorded in parity.md | ? insufficient_spec | The PSI "Post-Phase 3" row in `parity/parity.md` is empty. Lab proxies are good: CSS 3,957 B gz, initial JS 4,857 B gz, font 36,460 B, hero mobile max 116,260 B, render-blocking third-party CSS removed. A score needs a deploy and a PSI run. Per D-18 this is the Phase 3 done-gate and must not be reported as passed without it. |

**Score:** 5/7 truths verified (0 present-but-behavior-unverified; 2 backstop truths need human evidence)

#### Plan-level must-haves (spot-verified against the codebase)

| Plan | Key truths | Status | Evidence |
|---|---|---|---|
| 03-01 | eleventy-img pipeline, shared `.cache/img`, `pretest` warm, sharp pinned 0.35.5 | ✓ | `npm ls sharp` shows `sharp@0.35.5 overridden` as a single copy. `package.json` has `"pretest": "node scripts/warm-images.js"`. The `eleventy.after` hook copies `processImages().files`. `img/` holds 78 files, all referenced (images.test). |
| 03-02 | variable Montserrat ≤ 45 KB, Polish cmap, OFL beside it, provenance | ✓ | The woff2 is 36,460 B. `OFL.txt` is the full licence (92 lines, sections intact). `tools/fonts/README.md` exists. Glyph test and ASCII negative control pass. |
| 03-03 | check-perf P0–P11, frozen BUDGET, reject-and-move, sorted output | ✓ | 54 perf-gate tests pass. `BUDGET` is `Object.freeze`, and no cap literal appears outside it in `lib/` or `scripts/`. |
| 03-04 | gallery loop, 1600 w lightbox variants, logo picture, SEO images untouched | ✓ | See truths 1 and 2. `git diff --stat 03ce0de..HEAD -- src/assets/og src/assets/icons src/assets/brand src/favicon.ico` is empty, so the SEO images are byte-identical. |
| 03-05 | Google Fonts removed, `@font-face` + preload, fallback face, IIS MIME | ✓ | Both stacks are `"Montserrat", "Montserrat Fallback", …`. `web.config` has a `<remove>` + `<mimeMap>` pair for each of `.avif`, `.webp` and `.woff2`. |
| 03-06 | originals in `src/images/`, `hero.jpg` deleted, `og-override` repointed | ✓ | `src/images/` tracks 8 originals, including `patrol.jpg` and `sniper.jpg` (build.test "originals stay in git"). No original ships. |
| 03-07 | inline SVG via `{% icon %}`, `renderIcon` throws on bad names, FA CDN gone | ✓ | `addShortcode("icon", renderIcon)` is registered. All 10 icons.test tests pass. |
| 03-08 | Lightning CSS bundle with `?v=` hash, no inline styles, lightningcss 1.33.0 | ✓ | `lib/css.js` targets Chrome/Edge/Firefox 100 and Safari/iOS 15. Root and prefix builds produce byte-identical CSS (css.test). |
| 03-09 | module entry, five modules, `init(el)` no-ops, terminal contract | ✓ | See truth 5. `client.test.js` boots the terminal and finds "Połączenie nawiązane: invite.example/TEST123". |
| 03-10 | 10 partials, dead CSS removed, every class used | ✓ | css.test "no dead roster…", "every class selector… used" and its negative control pass. |
| 03-11 | build chain ends in check-perf, measured caps, no Lighthouse CI, README, pangram page, parity | ✓ (except the backstops in truths 6 and 7) | **Build and caps:** `build` = `clean && eleventy && check-seo && check-perf`. Each cap has a `// measured … B on 2026-10-11` comment. **Docs and dev page:** README has `## Wydajność i zasoby`. `font-test.njk` sets `devOnly: true` and contains the pangram. **CI:** workflow.test (j) passes. |

### Prohibitions (ADR-550)

| Plan | Prohibition | Tier | Disposition |
|---|---|---|---|
| 03-01 | Sharp only the vetted 0.35.5 | test | ✓ enforced by `test/deps.test.js`; `npm ls` confirms |
| 03-02 | OFL shipped and unedited | test | ✓ present and complete. Enforcement is partial: the test checks the "SIL Open Font License" and "Montserrat" strings plus the output hash, not the full text. |
| 03-03 | Failed or crashed build never left deployable | test | ✓ CLI tests (moved aside, crash rejects). See the CR-01 warning below. |
| 03-04 / 03-06 | SEO images never regenerated or moved | test | ✓ by direct git evidence (empty diff since `03ce0de`). Test enforcement checks dimensions and format, not bytes. |
| 03-05 / 03-07 | No third-party host for fonts or icons | test | ✓ fonts.test, icons.test, perf-gate P3 |
| 03-06 | `patrol.jpg` and `sniper.jpg` not deleted | test | ✓ build.test "originals stay in git" |
| 03-09 | Terminal messages unchanged; no gallery or terminal code on pages without them | test | ✓ client.test, modules.test |
| 03-10 | Roster/calendar/form CSS not kept | test | ✓ css.test |
| 03-01 | Hero look unchanged | judgment | flagged, needs human review. LLM verdict, non-authoritative: CSS keeps the same box, `object-fit: cover` and gradient, and the CDP boxes match. |
| 03-02 | Python font tools not in repo or deps | judgment | flagged. LLM verdict, non-authoritative: no `.py`, venv or requirements file is tracked, and `package.json` has only the 3 devDeps. |
| 03-03 | Budget numbers only in BUDGET | judgment | flagged. LLM verdict, non-authoritative: no cap literal outside BUDGET. |
| 03-07 | No doubled or unnamed SR announcements | judgment | flagged (human item 6) |
| 03-08 / 03-10 | No computed-style change | judgment | flagged (human item 2) |
| 03-11 | Caps only raised by a reviewed edit | judgment | flagged. The JS cap rose from 5120 to 6144 by the D-17 formula in `528052a`, so a reviewer should confirm that diff. |
| 03-11 | Phase 3 not reported done when PSI < 90 | judgment | honoured: the status is `human_needed`, not `passed` |

### Required Artifacts

| Artifact | Status | Details |
|---|---|---|
| `lib/images.js`, `scripts/warm-images.js` | ✓ VERIFIED | Wired through `eleventy.config.js` (global data, picture shortcode, `eleventy.after`) and the `pretest` script |
| `lib/woff2.js`, `src/fonts/*`, `tools/fonts/README.md` | ✓ VERIFIED | Imported by `fonts.test.js`; the font is passthrough-copied and referenced by `fonts.css` |
| `lib/check-perf.js`, `scripts/check-perf.js`, `lib/reject-output.js` | ✓ VERIFIED | The CLI imports the lib, and the build script chains the CLI |
| `src/_data/gallery.js` | ✓ VERIFIED | Consumed by `lib/images.js` and the index loop |
| `lib/icons.js` | ✓ VERIFIED | `addShortcode("icon", renderIcon)`; used in the footer, `discord-cta` and index |
| `lib/css.js`, `src/css/style.11ty.js`, `src/css/partials/` (10) | ✓ VERIFIED | `getCssBundle` feeds the template and `cssHash` feeds the `?v=` |
| `src/js/main.js`, `src/js/modules/*` (5) | ✓ VERIFIED | `base.njk` loads the module script; there are hooks in the templates |
| `src/_dev/font-test.njk`, `parity/parity.md` | ✓ VERIFIED (PSI row empty, by design) | The parity record exists; the PSI value is pending a human |

### Key Link Verification

| From | To | Via | Status |
|---|---|---|---|
| `src/index.njk` / `head.njk` | `lib/images.js` | `{% picture images.hero %}`, `images.hero.avif` preload loop | ✓ WIRED (output shows the picture and prefixed preload) |
| `eleventy.config.js` | `.cache/img` -> `<out>/img` | `eleventy.after` copy | ✓ WIRED (78 referenced files) |
| `package.json` | `scripts/warm-images.js`, `scripts/check-perf.js` | `pretest`; build chain | ✓ WIRED |
| `header.njk` | `lib/images.js` | `picture images.logo` | ✓ WIRED |
| `index.njk` gallery | `modules/lightbox.js` | `data-lightbox-avif/webp/jpeg` | ✓ WIRED (prefixed URLs resolve) |
| `fonts.css` | woff2 | `url(../fonts/montserrat-latin-ext.var.woff2)` | ✓ WIRED (resolves in both builds; links.test) |
| `footer.njk` | `lib/icons.js` | `{% icon s.id %}` | ✓ WIRED |
| `head.njk` | `lib/css.js` | `style.css?v={{ cssHash }}` | ✓ WIRED |
| `base.njk` | `main.js` -> `modules/` | module script + literal `import('./modules/…')` | ✓ WIRED |
| `scripts/check-seo.js`, `scripts/check-perf.js` | `lib/reject-output.js` | `removeRejectedOutput` | ✓ WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|---|---|---|---|---|
| Hero, gallery and logo pictures | `images.*` metadata | `processImages()` running eleventy-img on `src/images/*` | yes (real encoded files with measured sizes) | ✓ FLOWING |
| Lightbox | `data-lightbox-*` | `images.gallery` 1600 w variants | yes | ✓ FLOWING |
| Terminal invite | `data-discord-url` | `site.discord.invite` | yes | ✓ FLOWING |
| CSS bundle and hash | `getCssBundle()` | Lightning CSS over the partials | yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Perf gate on a real root build | `node scripts/check-perf.js --dir <scratch>/root-g` | `check-perf: OK, 2 page(s) checked`; css 3957 / js 4857 / font 36460 / hero 116260 / lightbox 229074 B | ✓ PASS |
| Perf and SEO gates on a real `/IBC-Website/` build | `check-perf` + `check-seo --dir <scratch>/pfx-g` with prefix env | both OK | ✓ PASS |
| Full suite (run once) | `npm test` | 288 tests, 288 pass, 0 fail | ✓ PASS |
| Single sharp | `npm ls sharp` | `sharp@0.35.5 overridden` | ✓ PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh` exist and no plan declares one. Step 7c: N/A. The perf gate CLI (above) is the phase's runnable check.

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|---|---|---|---|---|
| PERF-01 | 03-01, 03-04 | AVIF/WebP, responsive srcset, explicit dimensions, lazy below the fold | ✓ SATISFIED | Truth 1 |
| PERF-02 | 03-01, 03-06 | Hero `<img fetchpriority=high>` ≤ ~120 KB mobile; `hero.jpg` removed | ✓ SATISFIED | Truths 1 and 2 (see the DPR-3 note in Human Verification) |
| PERF-03 | 03-04 | Lightbox < 300 KB; logo at display size | ✓ SATISFIED | Truth 2 |
| PERF-04 | 03-02, 03-05 | Self-hosted woff2 with Polish glyphs; no Google Fonts | ✓ SATISFIED | Truth 3 |
| PERF-05 | 03-07 | Inline SVG icons with accessible names | ✓ SATISFIED | Truth 3 |
| PERF-06 | 03-08, 03-10 | CSS partials into one minified bundle; inline styles removed | ✓ SATISFIED | Truth 4 |
| PERF-07 | 03-09 | ES modules via `data-js`; no-op without the feature | ✓ SATISFIED | Truth 5 |

No orphaned requirements. REQUIREMENTS.md maps exactly PERF-01..07 to Phase 3, and PERF-08 (Lighthouse ≥ 90 in all four categories) to Phase 5.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `lib/reject-output.js` | 17-35 | CR-01 (code review, open): `--dir <any in-repo folder>` such as `src` or `.git` gets P0, then is renamed or recursively deleted | ⚠️ Warning | Tooling safety, not the phase goal. The behaviour predates Phase 3 (Phase 2's `check-seo`), but Phase 3 added a second CLI and the P0 rule that guarantees a reject for non-output folders. Recommend the allow-list fix (`_site`, `_test/**`) before Phase 4. |
| `src/js/main.js` | 7-21 | WR-01 / IN-02: module URLs not cache-busted; `Promise.all` without a rejection handler | ⚠️ Warning | Stale JS can run after a deploy; a failed module import becomes an unhandled rejection |
| `src/js/modules/lightbox.js`, `easter-egg.js` | — | WR-02: `body.style.overflow = 'auto'` on close | ℹ️ Info | Runtime style only (not in the built HTML); can override an `overflow-x` guard |
| `lib/check-perf.js` | — | WR-03 / WR-04: thumbnails, logo and the desktop hero are not size-gated; P10 fails open for external and inline scripts | ⚠️ Warning | The budget can be bypassed in Phase 4/5 without the gate noticing |
| `test/perf-gate.test.js` | — | deferred-items.md: transient Windows `EPERM` flake in the CLI-rejected fixture test | ℹ️ Info | Did not reproduce in this run (288/288) |

No `TBD`, `FIXME` or `XXX` markers in any phase-modified file. The `TODO(FACTS-NN)` occurrences are the intentional Phase 2 draft-marker mechanism.

### Human Verification Required

#### 1. D-18 mobile PSI ≥ 90 (phase done-gate)

**Test:** Merge or push the branch to main and wait for "Build and deploy". Then run mobile PSI 3 times on https://inglourious-basterds-clan.github.io/IBC-Website/ and record the median in `parity/parity.md`.
**Expected:** Performance ≥ 90 (baseline 67). A lower score is a gap.
**Why human:** It needs a deploy and an external service. This is a backstop truth.

#### 2. D-15 visual parity

**Test:** Walk the 15 before/after pairs and the D-15 checklist, and compare against the Phase 1 baselines.
**Expected:** No visible design change beyond sub-pixel rendering.
**Why human:** Visual judgment; backstop truth.

#### 3. Hero on 3x phones

**Test:** Look at the hero on a 390 px 3x phone and a 428–430 px 3x phone.
**Expected:** Sharpness is acceptable. Be aware that the wider device selects the 1920 w candidate (AVIF 183 KB), above the ~120 KB target.
**Why human:** Device-dependent `srcset` selection and perceived softness.

#### 4. Logo softness

**Test:** View the header logo at 1440 and 390 px.
**Expected:** The residual softness is acceptable.
**Why human:** Visual.

#### 5. Fonts

**Test:** Open `/_dev/font-test/` and the Network panel.
**Expected:** Polish glyphs are correct at every weight and only self-hosted fonts are requested.
**Why human:** Rendering quality.

#### 6. Icons and screen reader

**Test:** Check glyph, size and baseline. Use NVDA or VoiceOver on the footer icons, the mobile header CTA and the recruitment button.
**Expected:** Each control is announced once by name.
**Why human:** Assistive-technology behaviour.

#### 7. Scripted features and 404 console

**Test:** Exercise all five features on a served build, then open `/404.html` with the console and Network panel open.
**Expected:** The features behave as before. `/404.html` fetches no lightbox or terminal module, and there are no failed fetches or errors.
**Why human:** A real browser runtime (the tests use a fake DOM).

#### 8. Judgment-tier prohibitions

**Test:** Review the judgment-tier prohibitions in the table above.
**Expected:** Each one is confirmed, including the JS cap change from 5120 to 6144.
**Why human:** These are unverified prohibitions, so human review is recommended.

### Gaps Summary

No blocking gaps. All 5 roadmap success criteria and all 7 requirements are met in the built output, with tests that pass in the verifier's own run.

The phase cannot be `passed` yet:
- The D-18 done-gate (mobile PSI ≥ 90) has not been measured. The parity.md row is empty and needs a deploy.
- The D-15 parity judgment is a human backstop.

If PSI comes back below 90, record it as a gap. The PERF-08 work in Phase 5 does not replace the Phase 3 D-18 gate.

Recommended before Phase 4, advisory only: fix CR-01 (restrict `removeRejectedOutput` to `_site` and `_test/**`), and consider WR-03/WR-04 so the budget actually covers every image and script that Phase 4/5 adds.

---

_Verified: 2026-10-11_
_Verifier: Claude (gsd-verifier)_
