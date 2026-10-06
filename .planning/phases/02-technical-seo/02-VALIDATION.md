---
phase: "02"
slug: "technical-seo"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-06"
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` + `node:assert/strict` (Node built-in), harness `test/helpers.js` |
| **Config file** | none — `package.json` `"test": "node --test \"test/*.test.js\""` |
| **Quick run command** | `node --test test/seo.test.js test/seo-gate.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/seo.test.js test/seo-gate.test.js` (plus any Phase 1 suite the task touches)
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green; `SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/ npm run build` exits 0; `SITE_URL=https://example.org SITE_INDEXABLE=1 npm run build` exits 1 naming the TODO markers while drafts are unconfirmed
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

Filled by the planner from the PLAN.md task IDs (2026-10-06). Every test file is created by the task it verifies (tracer-first, as in Phase 1), so no task references a missing file.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-T1 (tracer) | 02-01 | 1 | SEO-02, SEO-08 | T-02-04 | Gate chained unconditionally after Eleventy, no env switch of its own | integration (real build + CLI on a broken fixture) | `node --test test/seo-gate.test.js test/devpages.test.js && npm test && SITE_URL=https://guard.example npm run build` | created by task | ⬜ pending |
| 02-01-T2 | 02-01 | 1 | SEO-09, SEO-01 (canonical) | T-02-01, T-02-02 | noindex unless SITE_INDEXABLE is exactly "1" on an https host; SITE_URL/PATH_PREFIX validated | integration (root, prefix, mutated, indexable variants) | `node --test test/seo.test.js && npm test` | created by task | ⬜ pending |
| 02-01-T3 | 02-01 | 1 | SEO-02, SEO-08, SEO-09 | T-02-01, T-02-03 | robots.txt never disallows; G9 noindex both ways; build-kind banner | unit (fixtures) + integration | `node --test test/seo-gate.test.js test/seo.test.js && npm test` + preview/indexable builds print their banner | ✅ (from T1/T2) | ⬜ pending |
| 02-02-T1 | 02-02 | 1 | SEO-03, SEO-04, SEO-05 | T-02-SC | Blocking-human legitimacy gate before installing sharp 0.35.4 | registry check + human | `npm view sharp@0.35.4 repository.url \| grep -q "lovell/sharp"` | n/a | ⬜ pending |
| 02-02-T2 | 02-02 | 1 | SEO-03, SEO-04, SEO-05 | T-02-SC, T-02-05 | sharp isolated in tools/seo-images, exact pin, root lockfile untouched | static | `npm --prefix tools/seo-images ls sharp` + `node --check` + `git diff --quiet -- package.json package-lock.json` | n/a | ⬜ pending |
| 02-02-T3 | 02-02 | 1 | SEO-03, SEO-04, SEO-05 | T-02-06 | Card carries only D-06 wording; safe-area self-check | unit (image headers) + human-check (OG card) | `node --test test/seo-assets.test.js && npm test` | created by task | ⬜ pending |
| 02-03-T1 | 02-03 | 2 | SEO-01 | T-02-07 | Autoescape on meta values, no `safe` | integration | `node --test test/seo.test.js test/layout.test.js test/devpages.test.js && npm test` | ✅ | ⬜ pending |
| 02-03-T2 | 02-03 | 2 | SEO-01, SEO-08 | T-02-08 | G10 blocks drafts on indexable builds only | unit (fixtures) + text (FACTS.md) + indexable build must fail | `node --test test/seo-gate.test.js test/facts.test.js && npm test` + `SITE_URL=https://example.org SITE_INDEXABLE=1 npm run build` exits 1 naming TODO(FACTS-01) | created by task (facts) | ⬜ pending |
| 02-04-T1 | 02-04 | 3 | SEO-03 | T-02-09 | og/twitter URLs only via htmlBaseUrl(site.url) | integration | `node --test test/seo.test.js test/build.test.js test/links.test.js && npm test` | ✅ | ⬜ pending |
| 02-04-T2 | 02-04 | 3 | SEO-03, SEO-08 | T-02-09 | G3: absolute, consistent, existing, 1200×630 on indexable pages | unit (fixtures) + integration | `node --test test/seo-gate.test.js test/seo.test.js test/devpages.test.js test/links.test.js && npm test` | ✅ | ⬜ pending |
| 02-04-T3 | 02-04 | 3 | SEO-04 | T-02-10 | Manifest serialized with dump, prefixed URLs | integration + human-check (favicon, manifest, Discord stripe flag) | `node --test test/seo.test.js test/links.test.js && npm test` | ✅ | ⬜ pending |
| 02-05-T1 | 02-05 | 4 | SEO-05 | T-02-11, T-02-12 | jsonLd escapes `<`; no Person/rating nodes | unit + integration + human-check (schema validator) | `node --test test/schema.test.js test/layout.test.js && npm test` | created by task | ⬜ pending |
| 02-05-T2 | 02-05 | 4 | SEO-05, SEO-08 | T-02-13 | Footer loop keeps rel=noopener noreferrer; G5 | unit (fixtures) + integration | `node --test test/schema.test.js test/seo-gate.test.js test/layout.test.js test/links.test.js && npm test` | ✅ | ⬜ pending |
| 02-06-T1 | 02-06 | 4 | SEO-07 | T-02-15, T-02-16 | remove-before-add in web.config; 404 noindex, unlisted | integration + human-check (dev-server 404) | `node --test test/seo-files.test.js test/facts.test.js test/links.test.js && npm test` | created by task | ⬜ pending |
| 02-06-T2 | 02-06 | 4 | SEO-09 | T-02-17 | Workflow never opts into indexing; README pairs `$env:` with Remove-Item | text | `node --test test/docs.test.js test/workflow.test.js test/links.test.js && npm test` | created by task (docs) | ⬜ pending |

Requirement coverage: SEO-01 (02-01, 02-03), SEO-02 (02-01), SEO-03 (02-02, 02-04), SEO-04 (02-02, 02-04), SEO-05 (02-02, 02-05), SEO-07 (02-06), SEO-08 (02-01, 02-03, 02-04, 02-05), SEO-09 (02-01, 02-06), D-05 register (02-03, 02-06).

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Planned inside the tasks they verify (no separate stub wave):

- [ ] `test/helpers.js`: `SITE_INDEXABLE` in `buildEnvKeys` (02-01 T2); gate fixture writer and CLI spawn live in `test/seo-gate.test.js` (02-01 T1)
- [ ] `test/seo-gate.test.js`: created by 02-01 T1, extended per rule by 02-01 T3 (G0/G2/G7/G8/G9), 02-03 T2 (G1/G4/G6/G10), 02-04 T2 (G3), 02-05 T2 (G5)
- [ ] `test/seo.test.js`: created by 02-01 T2 (SEO-01 canonical, SEO-09), extended by 02-01 T3, 02-03 T1, 02-04 T1-T3
- [ ] `test/seo-assets.test.js` (02-02 T3), `test/facts.test.js` (02-03 T2), `test/schema.test.js` (02-05 T1), `test/seo-files.test.js` (02-06 T1), `test/docs.test.js` (02-06 T2)
- [ ] Phase 1 assertions updated in the task that changes the head: `test/devpages.test.js` (i) in 02-01 T1; `test/layout.test.js:105-108` and `test/devpages.test.js` (12, c, d) in 02-03 T1; `test/build.test.js` og:image and `test/links.test.js` (d)/(e) in 02-04 T1; `test/layout.test.js:109` in 02-05 T1
- [ ] `test/workflow.test.js` (i) "never opts into indexing" in 02-06 T2

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Discord rich preview | SEO-03 | Third-party renderer | Paste deployed Pages URL into a private Discord channel; confirm title, description, 1200×630 image |
| OG card visual quality | SEO-03 | Text layout/overflow is visual | Open generated OG image; headline fully inside frame, legible |
| Rich Results / Schema validator | SEO-05 | External validator | Paste built `_site/index.html` into validator.schema.org; no errors |
| IIS 404 status + httpErrors unlocked | SEO-07 | Production host only | From a remote machine: `curl -I https://<domena>/nie-istnieje` returns 404 with the Polish page |
| sharp package legitimacy | T-02-SC | Trust decision, never auto-approved | 02-02 T1 blocking-human checkpoint before install |
| Favicon in the tab, manifest panel | SEO-04 | Browser UI | 02-04 T3 human-check (dev server, light and dark theme) |
| Polish 404 in the dev server and on the Pages preview | SEO-07 | Host 404 behaviour | 02-06 T1 human-check; after deploy open a missing URL under /IBC-Website/ |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (planner, 2026-10-06)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (each test file is created by the task it verifies)
- [x] No watch-mode flags
- [ ] Feedback latency < 30s (confirm during execution)
- [ ] `nyquist_compliant: true` set in frontmatter (validate-phase)

**Approval:** pending
