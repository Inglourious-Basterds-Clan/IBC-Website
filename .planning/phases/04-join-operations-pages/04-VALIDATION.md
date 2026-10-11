---
phase: "04"
slug: "join-operations-pages"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-11"
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node built-in `node:test` + `node:assert/strict` |
| **Config file** | none — `package.json` scripts (`pretest`: `node scripts/warm-images.js`, `test`: `node --test "test/*.test.js"`) |
| **Quick run command** | `node --test test/<file>.test.js` |
| **Full suite command** | `npm test && SITE_URL=https://guard.example npm run build && MSYS_NO_PATHCONV=1 SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/ npm run build` (Git Bash) |
| **Estimated runtime** | ~120 seconds (first run after new recap images re-warms `.cache/img`) |

Indexable check (expected to FAIL until FACTS are confirmed): `SITE_URL=https://example.org SITE_INDEXABLE=1 npm run build` → only G10 lines naming open FACTS rows.

---

## Sampling Rate

- **After every task commit:** Run the task's own suites (`node --test test/<file>.test.js …`), then `npm test`
- **After every plan wave:** Run the full suite command (both gates print OK in both builds)
- **Before `/gsd-verify-work`:** Full suite must be green; indexable build fails only on G10 for open FACTS rows
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

Filled by the planner per task. Requirement → test map from research:

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| CONT-01 | `/jak-dolaczyc/` requirements list, `<ol>` of join steps (D-02 order), Discord CTA, one `h1` | build-output | `node --test test/pages.test.js` | ❌ W0 | ⬜ pending |
| CONT-02 | 12–16 FAQ `<details>`/`<summary>`; FAQPage names/answers equal visible text | build-output + gate | `node --test test/pages.test.js test/seo-gate.test.js` | ❌ / ✅ extend | ⬜ pending |
| CONT-03 | `/operacje/` schedule, mission types, eras, evening `<ol>`, "Najbliższe misje" block, no Event | build-output | `node --test test/pages.test.js` | ❌ W0 | ⬜ pending |
| CONT-04 | 3–5 recaps newest first, `<time datetime>`, lazy `<picture>` with dims, "ostatnia aktualizacja" | build-output + perf gate | `node --test test/pages.test.js test/perf-gate.test.js` | ❌ / ✅ | ⬜ pending |
| CONT-05 | Nav per D-07, `aria-current="page"` on matching subpage only, legacy `#recruitment` redirect | build-output + unit | `node --test test/layout.test.js test/client.test.js test/modules.test.js` | ✅ update | ⬜ pending |
| CONT-06 | Every `TODO(FACTS-NN)` reaches output; FACTS.md rows match; indexable build fails only on G10 | unit + build-output | `node --test test/facts.test.js test/seo-files.test.js` | ✅ | ⬜ pending |
| CONT-07 | `lib/discord.js` fetch/fallback units; badge module textContent, plural forms, integer validation; baked fallback with `DISCORD_FETCH=0` | unit + build-output | `node --test test/discord.test.js` | ❌ W0 | ⬜ pending |
| SEO-06 | Visible breadcrumbs on both subpages; BreadcrumbList G11; prefixed URLs | gate fixtures + build-output | `node --test test/seo-gate.test.js test/schema.test.js test/pages.test.js` | ✅ extend / ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/reject-output.js` CR-01 allow-list + tests for `--dir src` / `--dir .git`
- [ ] `test/helpers.js` — `DISCORD_FETCH` in `buildEnvKeys`, default `"0"` in test builds
- [ ] `test/pages.test.js` — new suite for both pages (CONT-01..04, SEO-06 visible part, nav marking)
- [ ] `test/discord.test.js` — `lib/discord.js` units + badge module stub-DOM tests
- [ ] `test/seo-gate.test.js` — G11/G12 fixtures

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `/#recruitment` lands on `/jak-dolaczyc/` in a real browser | CONT-05 | Real navigation + `location.replace` | Open `/#recruitment` at root and under `/IBC-Website/`; confirm the URL becomes the join page |
| Live badge updates with no visible layout shift | CONT-07 | Live network + CLS is visual | Load home with network on; watch badge; repeat with JS off and confirm fallback text |
| FAQ opens via keyboard; breadcrumbs visible | CONT-02, SEO-06 | Interaction / visual | Tab to a `<summary>`, press Enter/Space; confirm breadcrumbs render on both subpages |
| User confirms each drafted fact | CONT-06 | Human fact confirmation | Walk FACTS.md rows; remove markers only after confirmation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
