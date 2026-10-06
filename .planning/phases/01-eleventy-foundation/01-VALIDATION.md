---
phase: "1"
slug: "eleventy-foundation"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-02"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` + `node:assert/strict` (Node built-in) |
| **Config file** | none — Wave 0 creates `package.json` test script and `test/helpers.js` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test && ALLOW_LOCAL_SITE_URL=1 npm run build` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && ALLOW_LOCAL_SITE_URL=1 npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green, plus the D-07 manual checklist at root and `/IBC-Website/`
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-T1 | 01-01 | 1 | (D-07 baseline) | T-01-03, T-01-SC | Lighthouse reports gitignored; exact `lighthouse@13.5.0` via npx | evidence capture | `test` PNG count/size + `grep '^| Median'` (baseline dir) | ✅ | ✅ green |
| 01-01-T2 (tracer) | 01-01 | 1 | FOUND-01, FOUND-03, FOUND-04, FOUND-06 | T-01-01, T-01-04, T-01-SC | Test env stripped of SITE_URL/PATH_PREFIX; invite links keep `rel=noopener noreferrer` | integration (root, prefix, mutated, empty env) | `npm test && ALLOW_LOCAL_SITE_URL=1 npm run build` (`test/build.test.js`) | ✅ | ✅ green |
| 01-02-T1 | 01-02 | 2 | FOUND-02, FOUND-05, FOUND-06 | T-01-06 | Single `| safe` (layout content only) | integration (structure parity, prefix URLs) | `npm test` (`test/layout.test.js`) | ✅ | ✅ green |
| 01-02-T2 | 01-02 | 2 | FOUND-05, FOUND-04 | T-01-05 | Every `target=_blank` anchor has `rel=noopener noreferrer` | integration + human-check (CTA at 320/390/768/1440) | `npm test` + CSS marker greps | ✅ (layout.test.js from T1) | ✅ green |
| 01-03-T1 | 01-03 | 2 | FOUND-04, FOUND-02 | T-01-07 | Terminal text via textContent, no HTML-string sink | unit (node:vm stub DOM) + static | `node --test test/client.test.js && npm test` | ✅ | ✅ green |
| 01-03-T2 | 01-03 | 2 | FOUND-06, FOUND-02 | — | N/A | unit (node:vm stub DOM) | `node --test test/client.test.js && npm test` | ✅ (client.test.js from T1) | ✅ green |
| 01-04-T1 | 01-04 | 2 | FOUND-01 | T-01-08, T-01-09, T-01-10, T-01-SC | PRs never deploy; write perms only on deploy job; no npm cache in privileged job | static contract | `node --test test/workflow.test.js && npm test` | ✅ | ✅ green |
| 01-04-T2 | 01-04 | 2 | FOUND-01 | T-01-12 | Invite not copied into README | static (doc strings) | README string loop + `! grep "discord\.gg" README.md` | ✅ | ✅ green |
| 01-05-T1 | 01-05 | 3 | FOUND-05 | T-01-13 | Dev pages absent from default build | integration (chrome equality, empty page, exclusion) | `node --test test/devpages.test.js && npm test` | ✅ | ✅ green |
| 01-05-T2 | 01-05 | 3 | FOUND-01 | T-01-13, T-01-14 | clean.js refuses root/outside paths | integration + real dev-then-build sequence | `node --test test/devpages.test.js && npm test && ALLOW_LOCAL_SITE_URL=1 INCLUDE_DEV_PAGES=1 npx @11ty/eleventy --quiet && ALLOW_LOCAL_SITE_URL=1 npm run build && test ! -d _site/_dev` | ✅ (devpages.test.js from T1) | ✅ green |
| 01-06-T1 | 01-06 | 4 | FOUND-06, FOUND-03, FOUND-04 | T-01-15 | Absolute URLs only to self or allowlisted pre-existing hosts | integration (4 variants, link resolver, source audit) | `node --test test/links.test.js && npm test` | ✅ | ✅ green |
| 01-06-T2 | 01-06 | 4 | FOUND-02 | T-01-16, T-01-SC | Lighthouse reports gitignored | evidence + Lighthouse gate + manual D-07 checklist | PNG count/size + parity.md header + node median gate | ✅ | ✅ green |
| 01-07-T1 (tracer) | 01-07 | 5 | FOUND-01, FOUND-03 | T-01-17, T-01-18 | Production build without SITE_URL exits non-zero; opt-out only via ALLOW_LOCAL_SITE_URL=1 | integration (real Eleventy CLI) | `node --test test/build.test.js && npm test` | ✅ | ✅ green |
| 01-07-T2 | 01-07 | 5 | FOUND-01, FOUND-03 | T-01-18, T-01-19 | serve/watch unaffected; CI sets SITE_URL and never the opt-out; inherited opt-out stripped | unit (site.js probe) + static contract | `node --test test/build.test.js test/workflow.test.js && npm test` | ✅ | ✅ green |
| 01-07-T3 | 01-07 | 5 | FOUND-01 | T-01-20 | Invite not copied into README | static (doc strings) | README string loop | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Planned as part of the tracer (01-01 Task 2) rather than a separate stub wave; every later suite is created by the task it verifies, so no task references a missing test file.

- [x] `package.json` with `build`, `dev`, `test` scripts; `@11ty/eleventy` installed; `package-lock.json` — 01-01 T2
- [x] `test/helpers.js` — `repoRoot`, `build(name, env)` via `spawnSync({ env })` into `_test/<name>`, `read`, `listFiles`, `attrValues`, `block` — 01-01 T2
- [x] `test/build.test.js` — 01-01 T2; `test/layout.test.js` — 01-02 T1; `test/client.test.js` — 01-03 T1; `test/workflow.test.js` — 01-04 T1; `test/devpages.test.js` — 01-05 T1; `test/links.test.js` — 01-06 T1
- [x] `.gitignore` — `_site/`, `_test/`, `node_modules/`, `.cache/` (01-01 T2) and `.planning/phases/*/baseline/lh/` (01-01 T1)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual + behavioural parity with old `index.html` | FOUND-02 | Visual comparison and interactive JS need a browser | Run D-07 checklist: hero, about, lightbox (click, Enter/Space, arrows, Esc, outer click), terminal boot, mobile menu, scroll-spy (incl. top), easter egg, header CTA at 320/390/768/1440 px, skip link, no console errors; screenshots vs baseline; Lighthouse mobile median of 3 vs baseline |
| Browser behaviour under subpath prefix | FOUND-06 | Runtime asset loading (lightbox images, CSS url()) needs a browser | `$env:PATH_PREFIX='/IBC-Website/'; npm run dev`, repeat checklist at `/IBC-Website/` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-10-06

---

## Validation Audit 2026-10-06

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All 15 map rows COVERED. `npm test`: 56/56 green (build 12, client 9, devpages 9, layout 7, links 10, workflow 9). Evidence rows: baseline has 10 PNGs, after/ has 20 (root + sub), scores.md and parity.md carry the `| Median` rows. README has no `discord.gg` copy. Dev-then-build sequence leaves no `_site/_dev`. The manual-only rows (FOUND-02 parity, FOUND-06 subpath browser run) passed in 01-UAT.md tests 1-3.
