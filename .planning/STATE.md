---
gsd_state_version: "1.0"
current_phase: 4
current_phase_name: Join & Operations Pages
status: planning
stopped_at: Phase 4 context gathered
last_updated: "2026-10-11T15:02:45.742Z"
last_activity: 2026-10-11
last_activity_desc: Phase 3 complete, transitioned to Phase 4
state_head: 5c399ad19dccbd289ea498babd6f572c40402395
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 24
  completed_plans: 24
  percent: 60
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-11)

**Core value:** A Polish player searching for an Arma 3 milsim clan (or for "IBC" by name) finds this site, understands what IBC is and how to join, and clicks through to Discord.
**Current focus:** Phase 04 — Join & Operations Pages

## Current Position

Phase: 4 — Join & Operations Pages
Plan: Not started
Status: Ready to plan
Last activity: 2026-10-11 — Phase 3 complete, transitioned to Phase 4

Progress: [██████░░░░] 60%

## Performance Metrics

**Velocity:**
- Total plans completed: 24
- Average duration: -
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 7 | - | - |
| 2 | 6 | - | - |
| 3 | 11 | - | - |

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
| Phase 03 P05 | 33 min | 2 tasks | 7 files |
| Phase 03 P06 | 5 min | 2 tasks | 14 files |
| Phase 03 P07 | 5 min | 2 tasks | 10 files |
| Phase 03 P08 | 15 min | 2 tasks | 12 files |
| Phase 03 P09 | 11 min | 3 tasks | 15 files |
| Phase 03 P10 | 22 min | 3 tasks | 12 files |
| Phase 03 P11 | 49 min | 3 tasks | 44 files |

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
- [Phase 03]: 03-05: font preload sits directly before the stylesheets with crossorigin (fetched once; HtmlBasePlugin prefixes it); glyph coverage check also decodes numeric character references
- [Phase 03]: 03-05: until 03-07 the Network Font filter also shows fa-brands-400.woff2 from the Font Awesome CDN; the only text font is the local Montserrat woff2 and nothing loads from Google font hosts
- [Phase 03]: 03-06: originals live in unshipped src/images/ (git mv); anything under src/assets/ is published as is; never-ship tests compare output base names to git ls-files src/images
- [Phase 03]: 03-07: renderIcon takes no label; accessible names stay on the links (aria-label or visible text) and every SVG is aria-hidden/focusable=false
- [Phase 03]: 03-07: icon names checked with Object.hasOwn on a frozen table (inherited names throw); extra class must match ^[a-z0-9-]+$ (T-03-14)
- [Phase 03]: 03-07: no-Font-Awesome guard scans every shipped text file for cdnjs, the literal font-awesome and fab/fa-* tokens
- [Phase 03]: 03-08: ?v= hash is sha256[0..10] of the exact Lightning CSS bytes; the 11ty.js template and the head share one memoized bundle reset in eleventy.before
- [Phase 03]: 03-08: former inline styles are (0,2,0) ancestor-class + class rules at the end of their section, outranking every competing rule incl. the 480px .hud-btn; parity proven by headless-Chrome computed-style diff (0 of 501 props)
- [Phase 03]: 03-09: main.js is a module entry: frozen literal loader map (own-property check) imports js/modules/<data-js>.js and calls init(el); modules read the DOM only inside init and no-op when elements are missing
- [Phase 03]: 03-09: runtime state is classes (.lightbox.is-open, .decryption-overlay.is-open, .tag-error, .terminal-line-alert) and textContent; only body.style.overflow scroll lock remains as a runtime style
- [Phase 03]: 03-10: the every-class-used guard reads bundle rule preludes only and matches class names as whole words with (?<![\w-])name(?![\w-]), so hyphenated supersets do not count as use
- [Phase 03]: 03-10: dead CSS (roster, calendar, status panel, countdown, form styles, green/danger badges, 480px timer rule, keyframes blink/fadeIn) deleted; computed-style parity proven by a CDP probe with frozen Date (0 of 1.61M values differ)
- [Phase 03]: 03-11: npm run build = clean, eleventy, check-seo, check-perf (&&); final BUDGET css 5120 / js 6144 / font 45824 B = measured 3957 / 4857 / 36460 + 25 % rounded to 256
- [Phase 03]: 03-11: picture > source { display: none } fixes the 24 px header logo shift that picture { display: contents } caused
- [Phase 03]: 03-11: icons in lettered buttons get margin-right = button letter-spacing (2px, 1.5px header CTA) to keep pre-Phase-3 button widths
- [Phase 03]: 03-11: residual logo softness (downscale path, not encoding) left to the 03-04 human check; PSI >= 90 needs the user's deploy and run
- [Phase 03]: UAT 8/8 passed 2026-10-11; mobile PSI Performance 100 (target 90, baseline 67); verification re-run passed 7/7

### Pending Todos

None. (2026-10-08 mobile LCP todo resolved by Phase 3: PSI mobile 100.)

### Blockers/Concerns

- [Cutover]: Domain still unknown. Before go-live: confirm FACTS-01/FACTS-02 (G10 blocks indexable builds until then), build with SITE_INDEXABLE=1, run the IIS 404/manifest curl.exe checks (backlog 999.1).
- [Phase 2 advisory]: scripts/check-seo.js:72 — a crash inside checkSite fails the build but leaves _site/ in place; scripts/clean.js does not remove a stale _site.rejected/.
- [Phase 2 docs]: 02-SECURITY.md T-02-ADV-01 row still describes sharp 0.35.4 (bumped to 0.35.5 in quick 261008-vmd).
- [Phase 3/5]: Share Tech Mono has no Polish glyphs. Phase 3 self-hosts fonts with Polish coverage (interim mono if needed); the Phase 5 UI-SPEC makes the final HUD font choice.
- [Phase 3 review]: CR-01 (critical, open) — lib/reject-output.js can move/delete an in-repo folder if `--dir` points at src/.git; add an allow-list (_site, _test/**) before Phase 4. All 12 findings in 03-REVIEW-DISPOSITION.md still `open` (WR-01 module cache-busting, WR-03/04 perf-gate coverage, WR-05 dev image cache).
- [Phase 3 docs]: parity/parity.md "Post-Phase 3, median of 3" PSI row is empty (UAT recorded Performance 100); header logo could use loading="eager".
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

Last session: 2026-10-11T15:02:45.593Z
Stopped at: Phase 4 context gathered
Resume file: .planning/phases/04-join-operations-pages/04-CONTEXT.md
