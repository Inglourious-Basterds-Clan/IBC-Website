---
phase: "04"
slug: "join-operations-pages"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
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

Filled by the planner per task (each command is the task's own suite; every task then runs `npm test`, and build tasks run the root and/or `/IBC-Website/` production build):

| Task | Wave | Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|------|------|-------------|----------|-----------|-------------------|-------------|--------|
| 04-01 T1 (tracer) | 1 | CONT-01, SEO-06 | /jak-dolaczyc/ requirements, 6 steps, CTA, breadcrumbs, BreadcrumbList, sitemap | build-output + unit | `node --test test/pages.test.js test/schema.test.js test/facts.test.js test/devpages.test.js test/seo.test.js test/fonts.test.js` | ✅ | ✅ green |
| 04-01 T2 | 1 | CONT-02, CONT-06 | 15 FAQ details, FAQPage = visible text, draft markers | build-output + unit | `node --test test/pages.test.js test/schema.test.js test/facts.test.js` | ✅ after T1 | ✅ green |
| 04-02 T1 (tracer) | 1 | CONT-06 (gate safety) | CR-01 allow-list in removeRejectedOutput | unit + CLI | `node --test test/reject-output.test.js test/seo-gate.test.js test/perf-gate.test.js` | ✅ | ✅ green |
| 04-02 T2 | 1 | CONT-06 (gate safety) | clean.js on the same allow-list | CLI | `node --test test/reject-output.test.js test/devpages.test.js` | ✅ after T1 | ✅ green |
| 04-03 T1 (tracer) | 1 | CONT-07 | baked fallback, hook, live update end to end (stub) | build-output + unit | `node --test test/discord.test.js test/modules.test.js test/links.test.js test/layout.test.js` | ✅ | ✅ green |
| 04-03 T2 | 1 | CONT-07 | failure modes, plurals, rounding, guards | unit (stub DOM) | `node --test test/discord.test.js` | ✅ after T1 | ✅ green |
| 04-03 T3 | 1 | CONT-07 | single-line badge, 20+ kept, no baked online, budgets | build-output + perf gate | `node --test test/discord.test.js test/css.test.js` | ✅ | ✅ green |
| 04-04 T1 (tracer) | 2 | CONT-03, SEO-06 | /operacje/ schedule, types, eras, 5-step evening, Najbliższe misje, breadcrumbs | build-output | `node --test test/pages.test.js test/schema.test.js test/facts.test.js test/seo.test.js test/fonts.test.js` | ✅ | ✅ green |
| 04-04 T2 | 2 | CONT-04, CONT-06 | 3–5 recaps newest first, UTC dates, lazy pictures, markers | build-output + unit + perf gate | `node --test test/pages.test.js test/images.test.js test/facts.test.js test/links.test.js` | ✅ | ✅ green |
| 04-05 T1 (tracer) | 2 | SEO-06 | gate G11 + fixtures; real builds pass | gate fixtures | `node --test test/seo-gate.test.js test/seo-files.test.js test/pages.test.js` | ✅ extend | ✅ green |
| 04-05 T2 | 2 | CONT-02 | gate G12 + fixtures (entity-safe) | gate fixtures | `node --test test/seo-gate.test.js test/pages.test.js` | ✅ extend | ✅ green |
| 04-06 T1 (tracer) | 3 | SEO-06, CONT-01..02 | pages.css partial wired into the bundle, breadcrumbs below the fixed header, join steps + FAQ styles, every class used, CSS budget | unit + build-output + perf gate | `node --test test/css.test.js test/pages.test.js` + `grep` of `.breadcrumbs`/`.faq-item`/`.join-steps` in `_site/css/style.css` | ✅ | ✅ green |
| 04-06 T2 | 3 | CONT-03..04 | operations and recap-card styles within the CSS budget, both builds | unit + build-output + perf gate | `node --test test/css.test.js test/pages.test.js` + `grep` of `.recap-card`/`.evening-timeline` in `_site/css/style.css` | ✅ | ✅ green |
| 04-07 T1 (tracer) | 4 | CONT-05 | /#recruitment redirect, teaser id, terminal closest(section) | unit (stub DOM) + build-output | `node --test test/client.test.js test/modules.test.js test/layout.test.js test/icons.test.js` | ✅ update | ✅ green |
| 04-07 T2 | 4 | CONT-05 | nav Start/O nas/Operacje/Dołącz, aria-current, scroll-spy mix | build-output + unit | `node --test test/layout.test.js test/devpages.test.js test/seo-files.test.js test/pages.test.js test/client.test.js test/links.test.js` | ✅ update | ✅ green |
| 04-07 T3 | 4 | CONT-06 (D-09) | teaser facts, no contradictions across pages | build-output | `node --test test/layout.test.js test/pages.test.js test/css.test.js test/icons.test.js test/discord.test.js` | ✅ update | ✅ green |
| 04-08 T1 (tracer) | 5 | CONT-05, CONT-07 (WR-01) | versioned main.js and module URLs | unit + build-output | `node --test test/js-version.test.js test/build.test.js test/devpages.test.js test/modules.test.js test/client.test.js test/links.test.js test/perf-gate.test.js` | ✅ | ✅ green |
| 04-08 T2 | 5 | CONT-06 (phase gate) | README docs; indexable build fails only on open FACTS rows | docs test + builds | `node --test test/docs.test.js test/links.test.js` + indexable build check | ✅ extend | ✅ green |

Requirement → test map from research (kept for reference):

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| CONT-01 | `/jak-dolaczyc/` requirements list, `<ol>` of join steps (D-02 order), Discord CTA, one `h1` | build-output | `node --test test/pages.test.js` | ✅ | ✅ green |
| CONT-02 | 12–16 FAQ `<details>`/`<summary>`; FAQPage names/answers equal visible text | build-output + gate | `node --test test/pages.test.js test/seo-gate.test.js` | ✅ | ✅ green |
| CONT-03 | `/operacje/` schedule, mission types, eras, evening `<ol>`, "Najbliższe misje" block, no Event | build-output | `node --test test/pages.test.js` | ✅ | ✅ green |
| CONT-04 | 3–5 recaps newest first, `<time datetime>`, lazy `<picture>` with dims, "ostatnia aktualizacja" | build-output + perf gate | `node --test test/pages.test.js test/perf-gate.test.js` | ✅ | ✅ green |
| CONT-05 | Nav per D-07, `aria-current="page"` on matching subpage only, legacy `#recruitment` redirect | build-output + unit | `node --test test/layout.test.js test/client.test.js test/modules.test.js` | ✅ update | ✅ green |
| CONT-06 | Every `TODO(FACTS-NN)` reaches output; FACTS.md rows match; indexable build fails only on G10 | unit + build-output | `node --test test/facts.test.js test/seo-files.test.js` | ✅ | ✅ green |
| CONT-07 | `lib/discord.js` fetch/fallback units; badge module textContent, plural forms, integer validation; baked fallback with `DISCORD_FETCH=0` | unit + build-output | `node --test test/discord.test.js` | ✅ | ✅ green |
| SEO-06 | Visible breadcrumbs on both subpages; BreadcrumbList G11; prefixed URLs | gate fixtures + build-output | `node --test test/seo-gate.test.js test/schema.test.js test/pages.test.js` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `lib/reject-output.js` CR-01 allow-list + tests for `--dir src` / `--dir .git` (04-02 T1, on fake repo roots and `.cache/` fixtures only)
- [x] `test/helpers.js` — `DISCORD_FETCH` in `buildEnvKeys`, default `"0"` in test builds (04-03 T1)
- [x] `test/pages.test.js` — new suite for both pages (04-01 T1 creates it; 04-04 and 04-07 extend it)
- [x] `test/discord.test.js` — `lib/discord.js` units + badge module stub-DOM tests (04-03 T1/T2)
- [x] `test/seo-gate.test.js` — G11/G12 fixtures (04-05)
- [x] `test/js-version.test.js` — WR-01 checks (04-08 T1)

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

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-13 (validate-phase audit: 0 gaps; npm test 430/430; both production builds OK; indexable build fails only on G10 for open FACTS rows)

## Validation Audit 2026-10-13

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
