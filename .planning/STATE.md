---
gsd_state_version: "1.0"
current_phase: 03
current_phase_name: performance-assets
status: executing
stopped_at: Completed 03-04-PLAN.md
last_updated: "2026-10-10T19:27:59.537Z"
last_activity: 2026-10-10
last_activity_desc: Phase 2 complete, transitioned to Phase 3
state_head: 001ad8fa0d0292b9d94d9df553907e948b76a03b
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 24
  completed_plans: 17
  percent: 40
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-08)

**Core value:** A Polish player searching for an Arma 3 milsim clan (or for "IBC" by name) finds this site, understands what IBC is and how to join, and clicks through to Discord.
**Current focus:** Phase 03 — Performance & Assets

## Current Position

Phase: 03 (performance-assets) — EXECUTING
Plan: 5 of 11
Status: Executing (03-01 complete)
Last activity: 2026-10-10 — Completed 03-01 (hero image pipeline, eleventy-img tracer)

Progress: [████░░░░░░] 40%

## Performance Metrics

**Velocity:**
- Total plans completed: 13
- Average duration: -
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 7 | - | - |
| 2 | 6 | - | - |

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
| Phase 03 P01 | 5 min | 2 tasks | 12 files |
| Phase 03 P02 | 3 min | 2 tasks | 6 files |
| Phase 03 P03 | 9 min | 2 tasks | 5 files |
| Phase 03 P04 | 7 min | 2 tasks | 7 files |

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
- [Quick 261008-vmd]: sharp bumped to user-vetted 0.35.5 in tools/seo-images (supersedes the 0.35.4 decision above, closes T-02-ADV-01); committed SEO images not regenerated
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
- [Phase 03]: 03-01: sharp pinned via package.json overrides to the vetted 0.35.5 (never a direct root dep); test/deps.test.js guards it
- [Phase 03]: 03-01: hero preload is a single typed AVIF preload with imagesizes=100vw; imagesrcset URLs pass through htmlBaseUrl once
- [Phase 03]: 03-01: image variants live in the shared .cache/img; eleventy.after copies only used variants; npm pretest warms the cache
- [Phase 03]: 03-02: Montserrat pinned to google/fonts 8b0a1d0; fontTools 4.66.1 + Brotli 1.2.0 used once in a throwaway venv outside the repo after human approval, never a project dependency
- [Phase 03]: 03-02: lib/woff2.js cmap reader throws on truncated or non-WOFF2 input instead of returning a partial set; ASCII-only fixture is the negative control
- [Phase 03]: 03-03: perf gate is a sibling of check-seo (lib/check-perf.js rules P0-P11 + scripts/check-perf.js CLI); reject-and-move lives in lib/reject-output.js shared by both gates
- [Phase 03]: 03-03: every perf cap lives in the frozen BUDGET object; checkPerf options.budget merges over it; 03-11 resets CSS/JS/font caps from measured sizes
- [Phase 03]: 03-03: perf gate resolves every HTML URL inside the build folder only (resolveLocal); unprefixed or ../ URLs are reported as outside the build output and never read
- [Phase 03]: 03-04: gallery content lives in src/_data/gallery.js; lib/images.js imports it, so the template loop and the image step read one list
- [Phase 03]: 03-04: lightbox <picture> ships with no <source> and no src; ensureSources() inserts avif/webp sources on first open and img.src (JPEG) is set last
- [Phase 03]: 03-04: header logo is a 50/100 w AVIF/WebP/PNG picture with loading=lazy (D-16 wins over Pitfall 10); SEO images untouched (D-06)

### Pending Todos

- [2026-10-08] [general] Fix mobile LCP and render-blocking CSS in Phase 3 — [todo file](.planning/todos/pending/2026-10-08-fix-mobile-lcp-and-render-blocking-css-in-phase-3.md) — Needs Feed into Phase 3 planning, in this order:.

### Blockers/Concerns

- [Cutover]: Domain still unknown. Before go-live: confirm FACTS-01/FACTS-02 (G10 blocks indexable builds until then), build with SITE_INDEXABLE=1, run the IIS 404/manifest curl.exe checks (backlog 999.1).
- [Phase 2 advisory]: scripts/check-seo.js:72 — a crash inside checkSite fails the build but leaves _site/ in place; scripts/clean.js does not remove a stale _site.rejected/.
- [Phase 2 docs]: 02-SECURITY.md T-02-ADV-01 row still describes sharp 0.35.4 (bumped to 0.35.5 in quick 261008-vmd).
- [Phase 2+]: initEasterEgg still builds a line with innerHTML (constants only; not a sink) — candidate for textContent refactor.
- [Phase 3/5]: Share Tech Mono has no Polish glyphs. Phase 3 self-hosts fonts with Polish coverage (interim mono if needed); the Phase 5 UI-SPEC makes the final HUD font choice.
- [Phase 4]: Needs clan facts from the user (schedule, modpack, DLC, join steps, play style, honest member metric) to confirm in FACTS.md.
- [Phase 5]: Run `/gsd-ui-phase` first (UI-SPEC: identity inventory, effect budget, HUD font).

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 261008-vmd | Bump sharp to 0.35.5 in tools/seo-images | 2026-10-08 | 03ce0de | [261008-vmd-bump-sharp-to-0-35-5-in-tools-seo-images](./quick/261008-vmd-bump-sharp-to-0-35-5-in-tools-seo-images/) |

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-10-10T19:27:59.413Z
Stopped at: Completed 03-04-PLAN.md
Resume file: None
