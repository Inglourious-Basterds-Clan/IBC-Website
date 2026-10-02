# Project Research Summary

**Project:** IBC Website (Inglourious Basterds Clan)
**Domain:** Polish-language static recruitment/SEO site for an Arma 3 milsim clan. Brownfield move from a single hand-written page to a multi-page site.
**Researched:** 2026-10-02
**Confidence:** MEDIUM-HIGH (stack and repo facts HIGH; Google policy HIGH; Polish keyword demand LOW; roster LOW until the bot exists)

## Executive Summary

IBC needs a small, fast, crawlable brochure site whose only job is to get Polish Arma 3 players into Discord. Competition is weak. Most Polish clans have no website, only Steam group posts and Discord listings, so a fast multi-page Polish site with real join and operations content can realistically rank for long-tail queries like "klan arma 3 rekrutacja" and "milsim polska". Recruits mostly want answers to two questions: is the unit active, and do I fit (age, schedule, play style, mods, commitment)? Every page should answer one of those.

The recommended approach is **Eleventy 3.1.x + Nunjucks**, with the existing CSS and vanilla JS kept. The current `index.html` moves into a template almost unchanged. Official plugins handle image optimization (`@11ty/eleventy-img` 7), icons (`@11ty/font-awesome` 2, inline SVG) and data, and the build ships no client JS of its own. A single `src/_data/site.js` holds the site URL and Discord invite. All SEO tags come from one `seo-head.njk` partial driven by page front matter, and a post-build `check-seo.js` script fails the build on bad canonicals, missing meta or TODO markers. The output is plain files in `_site/`. That changes the user's deploy target, and the user must be told.

The biggest risks are: (1) SEO plumbing built against a domain that does not exist yet, plus indexing a temporary host; (2) the 4.7 MB CSS-background hero and multi-MB PNG gallery, which make Lighthouse ≥ 90 on mobile impossible until fixed; (3) font work that breaks Polish diacritics, because Share Tech Mono has no latin-ext glyphs; (4) unconfirmed AI-drafted Polish facts going live; and (5) the roster leaking members' personal data (GDPR/RODO; minors aged 16+ are likely). Each has a concrete, cheap prevention, listed below.

### Resolved conflict: structured data

STACK.md suggested prioritizing `Event` markup for operations. FEATURES.md and PITFALLS.md cite Google Search Central directly: Event rich results require a physical location ("Virtual experiences that have no real-world component aren't supported"), exclude members-only events, and are not shown in Poland. IBC ops fail all three tests, and fake-location markup risks a spam manual action. FAQ rich results were removed for all sites on 2026-05-07. The primary-source evidence wins.

**Decision:** Ship `Organization` + `WebSite` (site name, `alternateName` "IBC" / "Inglourious Basterds Clan", `sameAs`, `foundingDate` 2018) on the home page, and `BreadcrumbList` on subpages. **No Event markup.** `FAQPage` is optional and expected to produce no rich result, so it should never drive design. Replace or drop the current `SportsTeam` type. Rewrite the PROJECT.md Active requirement to match.

## Key Findings

### Recommended Stack

Eleventy wins over Astro 7 because migration costs much less (rename to `.njk` instead of rewriting components) and Astro's advantages bring no visible gain on a 4–5 page site with zero framework needs. Plain HTML loses because once you need shared layouts, AVIF/WebP and a sitemap, you end up building a worse SSG out of scripts. Versions were checked against the npm registry, and the core plugins ran in a local smoke build on Windows.

**Core technologies:**
- **Node 24 LTS** (`engines >=22.19`): build-time only. eleventy-img 7 and Lighthouse 13 need Node 22+.
- **@11ty/eleventy ~3.1.6 + Nunjucks**: layouts, includes, data cascade. Pin 3.x; avoid the v4 "Build Awesome" alpha.
- **@11ty/eleventy-img 7.0.0**: HTML transform turns plain `<img>` into AVIF/WebP/JPEG `<picture>`. Gotchas: a source `width` attribute collapses srcset to one size; always set `urlPath`/`outputDir`; CSS backgrounds are not processed.
- **@11ty/font-awesome 2.0.0** (or hand-pasted Simple Icons SVGs): replaces the Font Awesome CDN for about 5 icons.
- **Self-hosted Fontsource variable woff2 + `subset-font`**: Inter, Montserrat, and a latin-ext mono (JetBrains Mono or IBM Plex Mono) if mono is wanted. A Polish-only subset is about 4–7 KB and saves roughly 140 KB.
- **Optional:** `lightningcss` (CSS bundle/minify), `@11ty/eleventy-fetch` (roster), `lighthouse` 13.5 CLI / `unlighthouse` for audits. Avoid `@lhci/cli`, which pins Lighthouse 12. Also avoid Tailwind/Sass, UI frameworks, a service worker, and the meta keywords tag.

### Expected Features

**Must have (table stakes):**
- Shared layout, per-page title/description, canonical, sitemap, robots, absolute per-page OG/Twitter, favicon/manifest/`theme-color`. Discord link previews are the main share channel.
- `/jak-dolaczyc/`: requirements, numbered steps (Discord → Kadet → training → probation → member), and a 12–16 question `<details>` FAQ in natural Polish.
- `/operacje/`: recurring schedule (days + 19:00 czasu polskiego), mission types, eras, "typowy wieczór" timeline, and 3–5 **dated** recaps.
- A single Discord CTA from config, visible immediately on every page and never gated behind the terminal animation.
- A clear play-style and attendance statement, and one honest member metric. Today the site says "20+" while Discord shows 246 members.
- Organization + WebSite + BreadcrumbList JSON-LD. ASCII Polish slugs.

**Should have (differentiators):**
- Live Discord stats badge through the public invite endpoint (`?with_counts=true`, CORS tested), as progressive enhancement over a static number.
- Beginner-friendly onboarding copy, modpack quick-start link, testimonials, per-operation recap pages, YouTube click-to-load facade.
- Off-site listings (units.arma3.com, Steam group, r/FindAUnit). This is a user task, not code.

**Do not build:** Event JSON-LD, manually maintained upcoming-ops calendar (it goes stale and signals a dead unit), on-site application form, Discord widget iframe, keyword doorway pages, public roster with avatars/IDs.

**Defer (v2+):** Roster/ORBAT from the bot (last phase), bot-fed upcoming ops.

### Architecture Approach

One-way build pipeline: `_data/` (site config, navigation, faq/operations/gallery JSON, roster adapter) → Nunjucks layouts/partials → HTML transforms (eleventy-img, HTML Base for `pathPrefix`) → `_site/` → `check-seo.js` gate. All indexable content is in static HTML; JS is progressive enhancement only.

**Major components:**
1. **`src/_data/site.js`**: the single source of truth for URL, pathPrefix, indexable flag, name, locale, Discord invite, default OG image, theme colour.
2. **`base.njk` + `seo-head.njk` + `lib/schema.js`**: the only writer of `<head>` meta and the JSON-LD `@graph`. Pages only declare front matter.
3. **Content data files** (`faq.json`, `operations.json`): one source rendered as both visible HTML and JSON-LD, so they cannot drift.
4. **Asset pipeline**: image transform; hero converted from CSS background to `<img fetchpriority="high">`; lightbox reuses the `<picture>` srcset; OG and favicons are passthrough files with stable names; CSS partials bundled to one file.
5. **JS runtime**: `main.js` ES module that lazy-imports features via `data-js` hooks, so JS is decoupled from styling classes and the visual refresh cannot break behaviour.
6. **Roster adapter** (`_data/roster.js`): build-time fetch, validate, map to an internal `Member` shape, fall back to a committed snapshot. The build never breaks because of the bot.

**Slug decision (resolving a minor conflict):** ARCHITECTURE used `/dolacz/` and `/jednostki/`; FEATURES and PITFALLS used `/jak-dolaczyc/` and `/sklad/`. Recommend **`/jak-dolaczyc/`** (matches the "jak dołączyć" query), **`/operacje/`**, and **`/sklad/`** (or `/jednostki/`; the user decides). Fix slugs in Phase 1 and never change them.

### Critical Pitfalls

1. **Domain-less SEO / wrong-host indexing.** Derive every absolute URL from `site.url` through one filter. Grep-guard against hardcoded hosts. Use `noindex` (not robots `Disallow`) for non-final hosts. Ship a domain cutover checklist (set URL, 301 from the platform subdomain, Search Console DNS verification, submit sitemap, versioned OG image).
2. **4.7 MB CSS-background LCP hero + 5 MB PNG gallery.** Convert the hero to an eager `<img fetchpriority="high">` with srcset (mobile under about 120 KB), delete the duplicate `hero.jpg`, generate thumbnails plus an under-300 KB lightbox derivative, resize `logo.png` (885 KB), and remove the Google Fonts `@import` chain.
3. **Polish diacritics broken by fonts.** Never use Share Tech Mono for Polish text. Always ship latin + latin-ext (or a Polish subset). Test with "Zażółć gęślą jaźń" in every font role.
4. **Unverified or stuffed AI Polish copy.** Add a build-time lint that fails on TODO markers, keep a `FACTS.md` of claims the user must confirm, use one intent per page, and write natural inflected Polish with no keyword stuffing.
5. **Hash to multi-page breakage.** Use root-relative paths plus `pathPrefix` support, directory-style URLs with trailing-slash canonicals, a legacy-hash redirect map (`#recruitment` → `/jak-dolaczyc/`), feature modules that no-op when absent, and build-time `aria-current`.
6. **Roster privacy** (last phase). Opt-in only, a field whitelist (display name/callsign, rank, unit, role), no IDs/avatars/join dates, build-time JSON only with no token in the client, schema validation that fails closed, and a Polish privacy note page.
7. **Lighthouse-green but still inaccessible.** The scanline overlay lowers real contrast without Lighthouse noticing. Modals need focus traps and Esc. The terminal must be static HTML with decorative animation. Do manual keyboard and NVDA passes.

## Implications for Roadmap

Order follows ARCHITECTURE's dependency chain, which PITFALLS supports: build the foundation and SEO before adding pages, run the asset/performance work before the visual refresh, and keep the roster last.

### Phase 1: Foundation: Eleventy scaffold, layout and config
**Rationale:** Everything depends on the shared shell and `site.url`. A verbatim move to Eleventy first means any regression can be traced to one change.
**Delivers:** `package.json`/`eleventy.config.js`, `src/` → `_site/` split (documented for the user's deploy), `index.html` → `index.njk` at byte parity, baseline Lighthouse scores, `site.js` (URL, invite, indexable flag), `navigation.js`, `base.njk`, header/footer/CTA partials, root-relative paths, skip link + `<main>`, slug scheme fixed, content-marker lint.
**Addresses:** single URL config, single Discord invite config, multi-page base.
**Avoids:** Pitfalls 1, 2, 5, 12, 15, 21.

### Phase 2: Technical SEO system
**Rationale:** New pages must be born with complete SEO. It is independent of Phase 3 and can run in parallel with it.
**Delivers:** `seo-head.njk`, `absoluteUrl`/`jsonLd` filters, `lib/schema.js` (Organization + WebSite + BreadcrumbList; no Event; FAQPage optional), sitemap/robots/manifest/404 templates, favicons, a 1200×630 versioned OG image, `theme-color`, removal of meta keywords and SportsTeam, titles that include "Arma 3" plus the full name, `check-seo.js` wired into the build, and the domain cutover checklist.
**Avoids:** Pitfalls 3, 11, 13.

### Phase 3: Performance and asset pipeline
**Rationale:** Sets the performance budget the visual refresh has to work within. The CSS split must happen before new page styles are added.
**Delivers:** eleventy-img transform, hero as `<img>`, lightbox derivatives, logo/favicon sizes, self-hosted and subsetted fonts with latin-ext and metric fallbacks, Font Awesome → SVG with accessible names, CSS partials + Lightning CSS bundle, JS split into `data-js` modules with a shared modal helper.
**Avoids:** Pitfalls 4, 7, 16, 17, plus the GDPR Google Fonts IP leak.

### Phase 4: Content pages and multi-page navigation
**Rationale:** Needs Phases 2 and 3 so the pages arrive SEO-complete and image-optimized. These pages are the core SEO and conversion value.
**Delivers:** `/jak-dolaczyc/` (requirements, steps, FAQ from `faq.json`), `/operacje/` (schedule, mission types, eras, typical evening, dated recaps from `operations.json`), nav switched to page URLs, breadcrumbs, legacy-hash redirects, honest member metric, play-style statement, footer year taken from the build. Claude drafts with TODO markers; the lint blocks publishing until the user confirms the facts.
**Avoids:** Pitfalls 8, 14.

### Phase 5: Accessibility and visual refresh
**Rationale:** Done once across every page, after the pages exist and the performance budget is set. Needs a UI-SPEC containing an identity inventory and an effect budget.
**Delivers:** focus traps, Esc and focus return on all modals, `aria-expanded` on the menu, reduced-motion and reduced-transparency support, overlay-aware contrast, a static terminal, scanlines/`backdrop-filter` limited on mobile, a final HUD font choice (latin-ext), refreshed tokens with inline styles removed, a clan-member identity review, and a Lighthouse ≥ 90 gate on every page (mobile, median of 3).
**Avoids:** Pitfalls 6, 10, 19.
**Optional v1.x additions (here or in a small follow-up):** live Discord stats badge, modpack quick-start, testimonials.

### Phase 6: Roster / units page (last)
**Rationale:** External dependency on the friend's bot. The adapter and fixture pattern prevents the phase from being blocked.
**Delivers:** an agreed data contract (field whitelist + opt-in mechanism) **first**, then the fixture snapshot, the `roster.js` adapter with validation that fails closed, `/sklad/`, a nav entry, and a "Polityka prywatności" page.
**Avoids:** Pitfall 9.

### Phase Ordering Rationale
- Config and layout gate everything. Writing SEO before content prevents retrofitting. Performance before the refresh keeps the design inside a budget. The refresh comes after the pages so it happens once. The roster is isolated because it depends on an outside party.
- Phases 2 and 3 can run in parallel.
- Lighthouse and `check-seo.js` gates start in Phase 1–2 and are enforced in every later phase's verification.

### Research Flags

Phases likely needing `/gsd-plan-phase --research-phase`:
- **Phase 6 (Roster):** the bot format does not exist yet; GDPR/consent details and the Discord Developer Policy need checking.
- **Phase 5 (Visual refresh):** run the UI-SPEC (`/gsd-ui-phase`) for the identity inventory, the font choice and the effect budget.
- **Phase 3 (Assets), light:** the eleventy-img v7 transform plus the custom Lightning CSS extension has a few verified gotchas but is not deeply documented.

Phases with standard patterns (skip research): Phase 1 (Eleventy scaffold), Phase 2 (SEO templates; the schema decision is already made), Phase 4 (the content specs in FEATURES.md are ready to use).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | npm registry checked plus a local smoke build of Eleventy, eleventy-img and font-awesome; subset sizes measured. Eleventy governance/rename status is MEDIUM. |
| Features | MEDIUM | Google policy and the Discord invite API are HIGH (official docs, live test). Recruit expectations are MEDIUM. Polish keyword volumes are LOW (no tool). |
| Architecture | MEDIUM-HIGH | Standard Eleventy patterns, consistent with the stack verification. The roster section is LOW. |
| Pitfalls | MEDIUM-HIGH | Repo facts verified by inspection; Google/web.dev guidance is primary-source. Legal (RODO) interpretation is LOW-MEDIUM and is not legal advice. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address
- **Domain and host unknown:** decide whether to do a pre-domain deploy (GitHub Pages subpath means `pathPrefix` plus `noindex`) and write the cutover checklist in Phase 2.
- **Clan facts:** schedule (which days are mandatory, duration), modpack size and distribution, DLC needs, probation/training steps, play-style level, fees, honest member metric. Collect these in `FACTS.md` and confirm them in Phase 4.
- **HUD font choice:** JetBrains Mono, IBM Plex Mono, or keep Montserrat. Decide in the UI-SPEC.
- **Roster data contract and opt-in mechanism:** to be agreed with the bot author at the start of Phase 6.
- **Final slugs** (`/sklad/` vs `/jednostki/`): confirm with the user in Phase 1.
- **Discord invite:** confirm it is permanent (the API showed `expires_at: null`) and consider a `/discord/` redirect page.
- **Keyword demand:** unverified. Validate in Search Console after launch.

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view`, 2026-10-02) and a local Eleventy 3.1.6 / eleventy-img 7 / font-awesome 2 smoke build on Node 26.7
- Google Search Central: Event, FAQPage, Organization, Site names, URL structure, Consolidate duplicate URLs, "Simplifying search results" (2025-06)
- Discord API live test of the invite endpoint (`with_counts`, CORS) and widget disabled
- Fontsource API / Google Fonts CSS API: Share Tech Mono is latin-only
- Repo inspection: `index.html`, `css/style.css`, `assets/` sizes, `.planning/codebase/CONCERNS.md`

### Secondary (MEDIUM confidence)
- 11ty.dev docs (Image, Fetch, HTML Base, Bundle, global data); Astro 7 release notes; web.dev (Optimize LCP, Font best practices); Lighthouse 13 release notes
- Search Engine Journal and others on the FAQ rich result removal (2026-05-07) and mobile breadcrumbs
- Bohemia "How to find an Arma 3 unit in 2024"; Polish Steam group recruitment posts; 16AA, 7Cav and ArmaForces sites

### Tertiary (LOW confidence)
- Polish keyword phrasing (observed SERPs, no volume data)
- Discord Developer Policy (from search snippets; the direct fetch returned 403)
- GDPR/RODO interpretation for the roster (not legal advice)

---
*Research completed: 2026-10-02*
*Ready for roadmap: yes*
