---
gsd_state_version: "1.0"
current_phase: 02
current_phase_name: Technical SEO
status: verifying
stopped_at: Completed 02-06-PLAN.md
last_updated: "2026-10-07T19:26:21.718Z"
last_activity: 2026-10-07
last_activity_desc: Phase 02 execution started
state_head: 60b1ef883b51d6cf2e75a376469dfea6219be7a9
progress:
  total_phases: 5
  completed_phases: 1
  total_plans: 13
  completed_plans: 13
  percent: 20
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-06)

**Core value:** A Polish player searching for an Arma 3 milsim clan (or for "IBC" by name) finds this site, understands what IBC is and how to join, and clicks through to Discord.
**Current focus:** Phase 02 — Technical SEO

## Current Position

Phase: 02 (Technical SEO) — EXECUTING
Plan: 6 of 6
Status: Phase complete — ready for verification
Last activity: 2026-10-07 — Phase 02 execution started

Progress: [██░░░░░░░░] 20%

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: -
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 7 | - | - |

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
| Phase 01 P06 | 9 min | 2 tasks | 24 files |
| Phase 01 P07 | 5 min | 3 tasks | 7 files |
| Phase 02 P01 | 5 min | 3 tasks | 12 files |
| Phase 02 P02 | 4 min | 3 tasks | 11 files |
| Phase 02 P03 | 10min | 2 tasks | 9 files |
| Phase 02 P04 | 4min | 3 tasks | 9 files |
| Phase 02 P05 | 3min | 2 tasks | 8 files |
| Phase 02 P06 | 4min | 2 tasks | 9 files |

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
- [Phase 01]: 01-06: After-migration screenshots use the baseline CDP method; the missing header in baseline scrolled mobile shots is an artifact of the pre-existing 498px layout-viewport overflow, not a parity target
- [Phase 01]: 01-06: favicon.ico 404 (only console error before and after) is pre-existing; deferred to Phase 2
- [Phase 01]: Production builds (ELEVENTY_RUN_MODE=build) with unset/blank SITE_URL throw; only ALLOW_LOCAL_SITE_URL=1 opts out; serve/watch keep the localhost default (CR-01, G-01-5)
- [Phase 01]: Test harness strips ALLOW_LOCAL_SITE_URL from the inherited env and adds the opt-out only for variants without SITE_URL
- [Phase 02]: Sitemap omits lastmod (Google ignores unverifiable lastmod; no git history needed in CI)
- [Phase 02]: check-seo gate output is '<relPath>: G<n> <text>' sorted by file then rule; banner (LOCAL/INDEXABLE/preview) printed on every run
- [Phase 02]: Indexing is opt-in only: SITE_INDEXABLE exactly "1" on an https non-local SITE_URL; site.js holds the SEO config contract (shortName, locale, themeColor, indexable, ogImage, ogImageAlt, social)
- [Phase 02]: 02-02: kept human-approved sharp 0.35.4 despite GHSA-wq5f-xc86-pv6w (fixed in 0.35.5); tool decodes only self-built SVG, inputs signature-checked; upgrade needs user vetting of 0.35.5
- [Phase 02]: 02-02: lib/image-size.js is the shared header reader for committed SEO images (tests, 02-04 G3, 02-05 logo check)
- [Phase 02]: Home title falls back to site.name so <title> is never empty (SEO-01 empty edge)
- [Phase 02]: G10 problems are <relPath>:<line>: G10 unconfirmed draft marker TODO(FACTS-NN); gate output sorted by file, rule, text
- [Phase 02]: Real indexable build tests accept only G10 problems naming open FACTS.md rows (never pin a draft ID)
- [Phase 02]: G3 compares og:url with the canonical present in the head; image headers are read once per output file
- [Phase 02]: Per-page share override via front matter ogImage (+ ogImageWidth/ogImageHeight together, + ogImageAlt); G3 requires 1200x630 on indexable pages
- [Phase 02]: site.webmanifest is a Nunjucks dict serialized with dump(2), display browser, prefix-aware paths
- [Phase 02]: 02-05: G5 checks the Organization + WebSite identity graph on index.html only and bans Event/SportsTeam at any depth; Person/Review/AggregateRating/founder/member/employee prohibitions live in test/schema.test.js
- [Phase 02]: 02-05: site.social is the single social list; footer loop and JSON-LD sameAs (social then Discord invite) both read it
- [Phase 02]: 02-06: 404 writes its own Discord hud-btn (discord-cta.njk is the header variant)
- [Phase 02]: 02-06: README cutover targets a local IIS build with SITE_INDEXABLE=1; the Pages workflow stays the noindex preview and is never pointed at the final domain (D-18, R2-WR-02)

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 2]: Domain still unknown; site is live on the GitHub Pages subpath, so Phase 2 needs the noindex guard for non-final hosts.
- [Phase 2]: favicon.ico 404 (pre-existing) and review warnings WR-01..03 / R2-* left open in 01-REVIEW-DISPOSITION.md.
- [Phase 2+]: initEasterEgg still builds a line with innerHTML (constants only; not a sink) — candidate for textContent refactor.
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

Last session: 2026-10-07T19:26:21.664Z
Stopped at: Completed 02-06-PLAN.md
Resume file: None
