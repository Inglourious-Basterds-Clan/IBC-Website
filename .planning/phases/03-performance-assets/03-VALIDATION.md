---
phase: "03"
slug: "performance-assets"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-10"
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node built-in `node:test` + `node:assert/strict` (Node 24 in CI, `.nvmrc`) |
| **Config file** | none — `package.json` `"test": "node --test \"test/*.test.js\""`; 03-01 adds `"pretest": "node scripts/warm-images.js"` (fills `.cache/img/` before the parallel test builds) |
| **Quick run command** | `node --test test/<file>.test.js` (the task's own suite) |
| **Full suite command** | `npm test && SITE_URL=https://guard.example npm run build && MSYS_NO_PATHCONV=1 SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/ npm run build` (Git Bash) |
| **Estimated runtime** | quick 5-30 s; full about 90-120 s (about 30 Eleventy builds; a cold image cache adds about 20 s once) |

---

## Sampling Rate

- **After every task commit:** Run the task's `<automated>` command (its own suite, usually followed by `npm test`)
- **After every plan wave:** Run the full suite command above
- **Before `/gsd-verify-work`:** Full suite green, both gates (check-seo, check-perf) print OK in both builds, parity evidence committed (03-11)
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | PERF-02, PERF-01 | T-03-SC, T-03-01, T-03-02, T-03-04 | sharp pinned to vetted 0.35.5; only repo-local image sources decoded; preload URLs prefix-safe | build-output | `SITE_URL=https://guard.example npm run build && … && npm test` (hero picture, AVIF preload, prefixed imagesrcset) | ✅ (existing suites) | ⬜ pending |
| 03-01-02 | 01 | 1 | PERF-02 | T-03-SC, T-03-03 | lockfile guard (sharp ≥ 0.35.5, single copy, linux binaries); img/ ships only referenced variants | unit + build-output | `node --test test/images.test.js test/deps.test.js test/seo-assets.test.js && npm test` | ❌ created in task | ⬜ pending |
| 03-02-01 | 02 | 1 | PERF-04 | T-03-SC | blocking human legitimacy check of fonttools/Brotli before any install | registry query | `curl -fsSL https://pypi.org/pypi/fonttools/4.66.1/json \| grep -q …` | n/a | ⬜ pending |
| 03-02-02 | 02 | 1 | PERF-04 | T-03-05, T-03-06 | pinned upstream source + hashes; OFL shipped | unit (cmap + negative control) | `node --test test/fonts.test.js` | ❌ created in task | ⬜ pending |
| 03-03-01 | 03 | 1 | PERF-01..07 (verification coverage: gate) | T-03-07, T-03-09 | failed or crashed gate moves output to `.rejected` | unit (fixtures) + CLI | `node --test test/perf-gate.test.js test/seo-gate.test.js` | ❌ created in task | ⬜ pending |
| 03-03-02 | 03 | 1 | PERF-01..07 (verification coverage: gate) | T-03-08 | URL resolution stays inside the build folder | unit (one fixture per rule) | `node --test test/perf-gate.test.js test/seo-gate.test.js` | ✅ (from 03-03-01) | ⬜ pending |
| 03-04-01 | 04 | 2 | PERF-01, PERF-03 | T-03-11 | data-lightbox-* values only reach srcset/src properties | build-output | `node --test test/images.test.js test/layout.test.js test/links.test.js && npm test` | ✅ | ⬜ pending |
| 03-04-02 | 04 | 2 | PERF-03 | — | SEO images byte-identical (D-06) | build-output + repo | `node --test test/images.test.js test/layout.test.js test/devpages.test.js && npm test && git diff --quiet 03ce0de -- src/assets/og …` | ✅ | ⬜ pending |
| 03-05-01 | 05 | 2 | PERF-04 | T-03-13 | no Google font hosts; prefix-safe font preload | build-output | `node --test test/links.test.js test/fonts.test.js && npm test && … grep -q 'href="/IBC-Website/fonts/…' _site/index.html && test -f _site/fonts/OFL.txt …` | ✅ | ⬜ pending |
| 03-05-02 | 05 | 2 | PERF-04 | T-03-13, T-03-15 | font ships unchanged and covers every shipped character; IIS MIME entries | unit + build-output | `node --test test/fonts.test.js test/seo-files.test.js && npm test` | ✅ (extend) | ⬜ pending |
| 03-06-01 | 06 | 3 | PERF-02, PERF-01 | T-03-10 | no originals shipped; hero.jpg deleted | build-output + repo | `node --test test/build.test.js test/seo.test.js test/images.test.js && npm test && … npm run build && test ! -e _site/assets/hero-bg.jpg …` | ✅ | ⬜ pending |
| 03-06-02 | 06 | 3 | PERF-02 | T-03-10, T-03-12 | originals never ship and stay in git; SEO images byte-identical | build-output + repo | `node --test test/build.test.js test/seo-assets.test.js && npm test && node --check tools/seo-images/make-seo-images.js && git diff --quiet 03ce0de -- …` | ✅ | ⬜ pending |
| 03-07-01 | 07 | 3 | PERF-05 | T-03-14 | icon names validated; SVGs aria-hidden in named links | unit + build-output | `node --test test/icons.test.js test/layout.test.js && npm test && … grep -q 'class="icon icon-youtube' _site/404.html …` | ❌ created in task | ⬜ pending |
| 03-07-02 | 07 | 3 | PERF-05 | T-03-24 | no FA/cdnjs in output; every svg hidden | unit + build-output | `node --test test/icons.test.js test/links.test.js test/layout.test.js && npm test && …` | ✅ (from 03-07-01) | ⬜ pending |
| 03-08-01 | 08 | 4 | PERF-06 | T-03-SC, T-03-17 | lightningcss pinned; ?v= content hash | build-output | `node --test test/css.test.js test/build.test.js test/deps.test.js test/links.test.js && npm test && …` | ❌ created in task | ⬜ pending |
| 03-08-02 | 08 | 4 | PERF-06 | — | N/A | build-output | `node --test test/css.test.js test/layout.test.js && npm test && SITE_URL=https://guard.example npm run build` | ✅ | ⬜ pending |
| 03-09-01 | 09 | 5 | PERF-07 | T-03-18 | literal import() map | unit (ESM stubs) + build-output | `node --test test/client.test.js test/build.test.js test/devpages.test.js && npm test && … grep -q '<script type="module" src="/IBC-Website/js/main.js">'` | ✅ (rewritten) | ⬜ pending |
| 03-09-02 | 09 | 5 | PERF-07 | T-03-18, T-03-20 | unknown hooks load nothing; every hook has its module | unit + build-output | `node --test test/modules.test.js test/client.test.js test/layout.test.js test/devpages.test.js && npm test` | ❌ created in task | ⬜ pending |
| 03-09-03 | 09 | 5 | PERF-07 | T-03-19 | no HTML-string DOM writes | unit + static | `node --test test/modules.test.js test/client.test.js test/css.test.js && npm test && …` | ✅ | ⬜ pending |
| 03-10-01 | 10 | 6 | PERF-06 | T-03-16 | bundle byte-identical through @import | build + byte compare | `npm test && SITE_URL=https://guard.example npm run build && cmp _test/css-split/reference-1.css _site/css/style.css && …` | ✅ | ⬜ pending |
| 03-10-02 | 10 | 6 | PERF-06 (D-13) | — | N/A | build-output | `node --test test/css.test.js test/links.test.js && npm test && SITE_URL=https://guard.example npm run build` | ✅ | ⬜ pending |
| 03-10-03 | 10 | 6 | PERF-06 | T-03-16 | entry imports only ./partials/*.css | build-output + byte compare | `node --test test/css.test.js test/links.test.js && npm test && … && cmp _test/css-split/reference-2.css _site/css/style.css` | ✅ | ⬜ pending |
| 03-11-01 | 11 | 7 | PERF-01..07 (verification coverage: gate in build) | T-03-21, T-03-22 | gate chained in npm run build; caps from measurements | build + unit | `npm test && out=$(SITE_URL=https://guard.example npm run build) && echo "$out" \| grep -q 'check-perf: OK' && …` | ✅ | ⬜ pending |
| 03-11-02 | 11 | 7 | PERF-04 (D-10 UAT) | — | N/A | unit + build-output | `node --test test/docs.test.js test/devpages.test.js test/css.test.js test/modules.test.js test/fonts.test.js && npm test && …` | ✅ | ⬜ pending |
| 03-11-03 | 11 | 7 | D-15, D-18 | T-03-23 | N/A | evidence files + manual | `test -f …/parity/parity.md && test "$(ls …/parity/after/*.png \| wc -l)" -ge 15 …` | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No separate Wave 0: each new suite is created by the task that first needs it (no `MISSING` verify placeholders). Created along the way:
- [ ] `scripts/warm-images.js` + `pretest` — 03-01 (Pitfall 5, parallel builds share `.cache/img/`)
- [ ] `test/images.test.js`, `test/deps.test.js` — 03-01 (PERF-01/02/03, D-01)
- [ ] `test/fonts.test.js` + `lib/woff2.js` + `test/fixtures/montserrat-ascii.var.woff2` — 03-02 (PERF-04, D-10)
- [ ] `test/perf-gate.test.js` — 03-03 (D-16/D-17)
- [ ] `test/icons.test.js` — 03-07 (PERF-05)
- [ ] `test/css.test.js` — 03-08 (PERF-06; 03-10 adds the partial and dead-CSS checks)
- [ ] `test/modules.test.js` + rewritten `test/client.test.js` — 03-09 (PERF-07)
- [ ] Updated pinned-layout suites: `test/build.test.js`, `test/layout.test.js`, `test/seo.test.js` (l), `test/links.test.js`, `test/seo-files.test.js`, `test/seo-assets.test.js`, `test/docs.test.js`, `test/workflow.test.js`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile PSI Performance ≥ 90 on the GitHub Pages preview (baseline 67) | D-18 (PERF-01..05 outcome) | D-19: no Lighthouse CI; needs the deployed preview | 03-11 Task 3 human check: push to main, run PSI mobile 3×, record the median in parity/parity.md |
| Strict visual parity (hero, about, gallery, lightbox incl. keyboard, terminal, mobile menu, scroll-spy, easter egg, 404) | D-15 | No automated visual-diff tooling (Phase 1 D-07 method) | 03-11 Task 3: review the 15 before/after pairs and the pixel-diff table in parity/parity.md |
| "Zażółć gęślą jaźń" renders in Montserrat at every weight | D-10 (PERF-04) | Glyph presence is automated; rendering quality is visual | Open /_dev/font-test/ in `npm run dev` (page added by 03-11) |
| Lightbox opens the AVIF variant; self-hosted font only; icons announced once by name; converted inline styles look the same; no console errors on /404.html | PERF-03, PERF-04, PERF-05, PERF-06, PERF-07 | Browser format selection, rendering and screen-reader output | Human checks in 03-04, 03-05, 03-07, 03-08 and 03-09, collected at the end of the phase (human_verify_mode end-of-phase) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (25/25 tasks across 11 plans, each with a `<fails_when>`)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none used)
- [x] No watch-mode flags
- [ ] Feedback latency < 120 s (confirm during execution)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** {pending / approved YYYY-MM-DD}
