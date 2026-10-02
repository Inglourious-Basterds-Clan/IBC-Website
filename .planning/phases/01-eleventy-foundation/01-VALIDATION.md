---
phase: "1"
slug: "eleventy-foundation"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| **Full suite command** | `npm test && npm run build` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green, plus the D-07 manual checklist at root and `/IBC-Website/`
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (filled by planner/executor) | — | — | FOUND-01 | — | N/A | integration | `npm test` (`test/build.test.js`) | ❌ W0 | ⬜ pending |
| (filled by planner/executor) | — | — | FOUND-02 | — | N/A | integration + manual | `npm test` (`test/layout.test.js`) | ❌ W0 | ⬜ pending |
| (filled by planner/executor) | — | — | FOUND-03 | — | N/A | integration (mutation) | `npm test` (`test/build.test.js`) | ❌ W0 | ⬜ pending |
| (filled by planner/executor) | — | — | FOUND-04 | — | N/A | static + integration | `npm test` (`test/build.test.js`) | ❌ W0 | ⬜ pending |
| (filled by planner/executor) | — | — | FOUND-05 | — | N/A | integration | `npm test` (`test/layout.test.js`) | ❌ W0 | ⬜ pending |
| (filled by planner/executor) | — | — | FOUND-06 | — | N/A | integration + manual | `npm test` (`test/links.test.js`) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` with `build`, `dev`, `test` scripts; `@11ty/eleventy` installed; `package-lock.json`
- [ ] `test/helpers.js` — `build(outDir, env)` via `spawnSync({env})`, `listHtml(dir)`, attribute extraction
- [ ] `test/build.test.js`, `test/layout.test.js`, `test/links.test.js` — stubs for FOUND-01..06
- [ ] `.gitignore` — `_site/`, `_test/`, `node_modules/`, `.cache/`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual + behavioural parity with old `index.html` | FOUND-02 | Visual comparison and interactive JS need a browser | Run D-07 checklist: hero, about, lightbox (click, Enter/Space, arrows, Esc, outer click), terminal boot, mobile menu, scroll-spy (incl. top), easter egg, header CTA at 320/390/768/1440 px, skip link, no console errors; screenshots vs baseline; Lighthouse mobile median of 3 vs baseline |
| Browser behaviour under subpath prefix | FOUND-06 | Runtime asset loading (lightbox images, CSS url()) needs a browser | `$env:PATH_PREFIX='/IBC-Website/'; npm run dev`, repeat checklist at `/IBC-Website/` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
