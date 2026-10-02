---
gsd_state_version: "1.0"
current_phase: 01
current_phase_name: Eleventy Foundation
status: executing
stopped_at: Completed 01-05-PLAN.md
last_updated: "2026-10-02T22:32:11.996Z"
last_activity: 2026-10-02
last_activity_desc: Phase 01 execution started
state_head: 5c0619754f86f4fddc355025b508072ddd78039d
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 6
  completed_plans: 5
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-02)

**Core value:** A Polish player searching for an Arma 3 milsim clan (or for "IBC" by name) finds this site, understands what IBC is and how to join, and clicks through to Discord.
**Current focus:** Phase 01 — Eleventy Foundation

## Current Position

Phase: 01 (Eleventy Foundation) — EXECUTING
Plan: 6 of 6
Status: Ready to execute
Last activity: 2026-10-02 — Phase 01 execution started

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 8 min | 2 tasks | 31 files |
| Phase 01 P02 | 11 min | 2 tasks | 10 files |
| Phase 01 P03 | 3min | 2 tasks | 2 files |
| Phase 01 P04 | 5min | 2 tasks | 4 files |
| Phase 01 P05 | 3min | 2 tasks | 6 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 5 phases. Phases 2 (SEO) and 3 (Performance) both depend only on Phase 1 and can run in parallel.
- [Roadmap]: PERF-08 (Lighthouse ≥ 90 on every page) is verified in Phase 5, after the visual refresh.
- [Roadmap]: SEO-06 (breadcrumbs) is delivered in Phase 4, when subpages first exist.
- [Roadmap]: Roster (`/sklad/`, ROST-*) is v2 and not in this roadmap.
- [Phase 01]: Baseline section screenshots use Chrome DevTools protocol (scrollIntoView + capture); headless --screenshot ignores #hash scrolling
- [Phase 01]: test/helpers.js build() strips SITE_URL/PATH_PREFIX/INCLUDE_DEV_PAGES/ELEVENTY_RUN_MODE case-insensitively before merging the variant env
- [Phase 01]: 01-02: body { overflow-x: clip } keeps pre-existing mobile content overflow from widening the layout viewport, so the header Discord CTA and hamburger stay on screen at 320/390 px; overflow root cause (.about-stats, hero h1) deferred in deferred-items.md
- [Phase 01]: 01-02: mobile header row is logo | outline hud-btn Discord CTA | hamburger; CTA icon-only at 480px and below; CTA sits in .header-actions outside nav ul
- [Phase 01]: Client JS reads build-time config (Discord invite) from data-* attributes; terminal lines are textContent spans (no innerHTML)
- [Phase 01]: Scroll-spy matches by resolved link.hash and only same-pathname links; /IBC-Website/index.html leaves it inactive (accepted, Pitfall 7)
- [Phase 01]: Pages workflow: production SITE_URL/PATH_PREFIX live only in the build job env of .github/workflows/pages.yml; deploy job (pages/id-token write) runs no npm
- [Phase 01]: README (Polish) references the Discord invite only by location (src/_data/site.js); _site/ replaces the repo root as deploy folder
- [Phase 01]: 01-05: dev-only pages use devOnly preprocessor (returns false unless site.includeDevPages) plus eleventyExcludeFromCollections
- [Phase 01]: 01-05: npm run build = node scripts/clean.js && eleventy; clean.js refuses repo root, parents and other drives

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1]: ~~The deploy target changes from the repo root to `_site/`. The user must be told and the change documented.~~ Documented in README.md (01-04); remaining user step: enable Settings -> Pages -> Source: GitHub Actions (01-USER-SETUP.md).
- [Phase 1/2]: Domain and host are unknown. Decide whether to deploy before the domain exists (GitHub Pages subpath → pathPrefix + noindex).
- [Phase 3/5]: Share Tech Mono has no Polish glyphs. Phase 3 self-hosts fonts with Polish coverage (interim mono if needed); the Phase 5 UI-SPEC makes the final HUD font choice.
- [Phase 4]: Needs clan facts from the user (schedule, modpack, DLC, join steps, play style, honest member metric) to confirm in FACTS.md.
- [Phase 2/4]: The TODO-marker gate (SEO-08) should fail production builds only, so Phase 4 drafting can still build in dev.
- [Phase 5]: Run `/gsd-ui-phase` first (UI-SPEC: identity inventory, effect budget, HUD font).

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-10-02T22:32:11.954Z
Stopped at: Completed 01-05-PLAN.md
Resume file: None
