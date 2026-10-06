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

Filled by the planner from PLAN.md task IDs. Requirement → test map from research:

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| SEO-01 | Unique title, description, one absolute canonical (root, prefix, mutated) | integration | `node --test test/seo.test.js` | ❌ W0 | ⬜ pending |
| SEO-01 | Gate fails on missing/relative/foreign canonical, missing description | unit (fixtures) | `node --test test/seo-gate.test.js` | ❌ W0 | ⬜ pending |
| SEO-02 | sitemap lists exactly indexable pages absolute; robots `Sitemap:` only when indexable | integration | `node --test test/seo.test.js` | ❌ W0 | ⬜ pending |
| SEO-02 | Gate fails when indexable page missing from sitemap | unit | `node --test test/seo-gate.test.js` | ❌ W0 | ⬜ pending |
| SEO-03 | og/twitter absolute, follow SITE_URL; OG file 1200×630 < 300 KB | integration | `node --test test/seo.test.js` | ❌ W0 | ⬜ pending |
| SEO-04 | favicon.ico, 180/192/512 PNGs, manifest JSON prefixed, theme-color `#080e11`, head links resolve | integration | `node --test test/seo.test.js test/links.test.js` | ❌ W0 | ⬜ pending |
| SEO-05 | Organization + WebSite JSON-LD, alternateName IBC, foundingDate 2018, sameAs, no SportsTeam/Event/keywords | integration + unit | `node --test test/seo.test.js` | ❌ W0 | ⬜ pending |
| SEO-07 | 404.html in layout, Polish, home + invite links, noindex, not in sitemap; web.config 404 path prefix-aware | integration | `node --test test/seo.test.js test/links.test.js` | ❌ W0 | ⬜ pending |
| SEO-08 | Gate passes real builds; each rule G1–G10 fails its fixture naming the file; build script runs gate | unit + integration | `node --test test/seo-gate.test.js test/devpages.test.js` | ❌ W0 | ⬜ pending |
| SEO-09 | Default noindex everywhere; `SITE_INDEXABLE=1` + https lifts it except 404; http/localhost rejected; pages.yml never sets flag; README cutover checklist | integration + text | `node --test test/seo.test.js test/build.test.js test/workflow.test.js` | ❌ W0 | ⬜ pending |
| D-05 | Every `TODO(FACTS-NN)` in src has a FACTS.md row and vice versa | unit (text) | `node --test test/facts.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/helpers.js` — add `SITE_INDEXABLE` to `buildEnvKeys`; `checkSeo(outDir, env)` helper; fixture writer under `_test/`
- [ ] `test/seo.test.js` — SEO-01..05, 07, 09 on real builds (dirs prefixed `seo-`)
- [ ] `test/seo-gate.test.js` — SEO-08 fixtures G1–G10 + real-build passes
- [ ] `test/facts.test.js` — D-05 cross-reference
- [ ] Update Phase 1 assertions: `test/layout.test.js:105-110`, `test/devpages.test.js` (12, c, d, i), `test/build.test.js` og:image, `test/links.test.js` (d)/(e)
- [ ] `test/workflow.test.js` — "never sets SITE_INDEXABLE"

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Discord rich preview | SEO-03 | Third-party renderer | Paste deployed Pages URL into a private Discord channel; confirm title, description, 1200×630 image |
| OG card visual quality | SEO-03 | Text layout/overflow is visual | Open generated OG image; headline fully inside frame, legible |
| Rich Results / Schema validator | SEO-05 | External validator | Paste built `_site/index.html` into validator.schema.org; no errors |
| IIS 404 status + httpErrors unlocked | SEO-07 | Production host only | From a remote machine: `curl -I https://<domena>/nie-istnieje` returns 404 with the Polish page |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
