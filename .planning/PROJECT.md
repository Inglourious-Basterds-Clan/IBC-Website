# IBC Website

## What This Is

The public website of the Inglourious Basterds Clan (IBC), a Polish Arma 3 milsim community founded in 2018. Today it is a single-page, Polish-language "tactical HUD" landing page that funnels visitors to the clan Discord. This project turns it into a fast, well-indexed, multi-page site that ranks for Polish Arma 3 / milsim recruitment searches and gives first-time visitors a polished, trustworthy impression.

## Core Value

A Polish player searching for an Arma 3 milsim clan (or for "IBC" by name) finds this site, understands what IBC is and how to join, and clicks through to Discord.

## Requirements

### Validated

<!-- Inferred from existing code (see .planning/codebase/) -->

- ✓ Single-page landing with hero, about, gallery and recruitment sections in Polish — existing
- ✓ Tactical HUD visual theme (dark palette, grid/scanline overlays, Share Tech Mono / Montserrat / Inter) — existing
- ✓ Responsive layout with mobile hamburger menu — existing
- ✓ Gallery lightbox with keyboard navigation — existing
- ✓ Animated recruitment "terminal" that links to Discord — existing
- ✓ Scroll-spy navigation highlighting — existing
- ✓ Footer easter egg (decryption overlay) — existing
- ✓ Basic SEO: title, meta description, keywords, Open Graph tags, SportsTeam JSON-LD — existing (superseded in Phase 2: keywords and SportsTeam removed)
- ✓ Eleventy 3.1 build into `_site/` with documented deploy (GitHub Pages workflow + any static host) — Phase 1
- ✓ Site URL is configured in one place (`SITE_URL`); production builds fail without it — Phase 1
- ✓ Discord invite defined once (`src/_data/site.js`) — Phase 1
- ✓ Shared layout (header, nav, footer, Discord CTA) and pathPrefix-safe links at root and under `/IBC-Website/` — Phase 1
- ✓ Technical SEO: unique titles/descriptions, absolute canonicals, sitemap.xml + robots.txt, full absolute OG/Twitter cards with a 1200×630 card, favicons/manifest/theme-color, Organization + WebSite JSON-LD, Polish 404 — Phase 2
- ✓ Post-build SEO gate (`scripts/check-seo.js`, rules G0–G10) fails broken output and unconfirmed TODO(FACTS-NN) drafts; rejected builds are moved to `_site.rejected/` — Phase 2
- ✓ Indexing is opt-in (`SITE_INDEXABLE=1` on an https final host); every other host is `noindex`; IIS cutover checklist in README — Phase 2

### Active

- [ ] Breadcrumbs: visible breadcrumbs + BreadcrumbList JSON-LD on subpages (SEO-06, Phase 4; rest of technical SEO validated in Phase 2)
- [ ] Domain cutover: confirm FACTS-01/FACTS-02 drafts, build with `SITE_INDEXABLE=1`, deploy to IIS and run the 404/manifest `curl.exe` checks (backlog 999.1)
- [ ] Lighthouse scores are high (target ≥ 90 in Performance, Accessibility, Best Practices, SEO on mobile)
- [ ] Images optimized (WebP/AVIF, responsive sizes, explicit dimensions, lazy-loading)
- [ ] Third-party weight reduced (Font Awesome full CDN → inline SVG icons; self-hosted/subset fonts)
- [ ] Accessibility: semantic landmarks, skip link (added in Phase 1), ARIA for modals/menu, focus management, contrast, reduced-motion support
- [ ] Visual refresh that keeps the tactical identity but feels more polished and trustworthy to first-time visitors
- [ ] New indexable page: How to join / FAQ (requirements, mods, schedule, recruitment steps)
- [ ] New indexable page: Operations / events (when IBC plays, mission types, op recaps)
- [ ] Multi-page structure with consistent internal linking (shared layout done in Phase 1; subpages in Phase 4)
- [ ] Live Discord member/online badge (public invite endpoint) with static fallback

### Deferred (v2)

- Units / roster page (`/sklad/`) fed by member data from the Discord bot a friend is building — next milestone, once the bot exists

### Out of Scope

- Hosting/deployment setup — user deploys the site themselves
- English / multilingual version — Polish players are the target audience
- Visitor feedback/comment forms — "feedback" here means Lighthouse scores and visitor impression, not collecting opinions
- Analytics — not selected as a goal for this milestone
- Building the Discord bot itself — a friend owns it; this project only consumes its data
- Rules / regulamin page — not selected

## Context

- Brownfield: plain HTML/CSS/JS, no build step, files `index.html`, `css/style.css` (~1400 lines), `js/main.js`. Codebase map in `.planning/codebase/`.
- Language `pl`; all copy is Polish.
- Existing concerns (from CONCERNS.md): Discord invite link duplicated in 3 places, inline styles, unoptimized images, expensive `backdrop-filter` and fixed overlays on mobile, full Font Awesome CSS for ~5 icons, Google Fonts via CSS `@import` (render-blocking), no ARIA/skip links, OG image is a relative path.
- Unused roster/calendar markup/CSS already exists; `api/` directory is empty/reserved.
- Copy for new pages: Claude drafts Polish text with clear TODO markers for facts the user must confirm; user edits ("mix").
- Domain not yet purchased; will be bought later.

## Constraints

- **Hosting**: Must remain a static site deployable to any static host — user deploys it themselves
- **Tooling**: A light build step (static site generator, image optimization) is acceptable, but output must be plain static files
- **Language**: Polish only
- **Domain**: Unknown at build time — site URL must be a single config value
- **Roster dependency**: Roster depends on an external Discord bot's data format; scheduled last

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Expand from single page to multi-page | Generic recruitment queries need more indexable content than one landing page | — Pending |
| Open to a light build tool / SSG | Shared layouts and image optimization across pages are painful by hand | ✓ Good — Phase 1 migrated at visual parity |
| Visual refresh allowed, tactical identity kept | Goal is better first impression, not a rebrand | — Pending |
| Roster deferred to v2 | Bot not ready yet; avoid blocking v1 | — Pending |
| Eleventy 3.1 + Nunjucks | Least-rewrite SSG, zero client JS, official image/icon plugins (research) | ✓ Good — Phase 1 (single dep, 56 node:test tests) |
| Deploy `_site/` via GitHub Pages Actions; production host set only in pages.yml | Repo root no longer deployable; PRs never deploy; write perms only on deploy job | ✓ Good — Phase 1, live at inglourious-basterds-clan.github.io/IBC-Website/ |
| Production build fails without SITE_URL (opt-out ALLOW_LOCAL_SITE_URL=1) | Prevents shipping localhost absolute URLs (review CR-01, UAT decision) | ✓ Good — Phase 1 (01-07) |
| No Event JSON-LD | Google ineligibility for online/members-only events in PL | ✓ Good — Phase 2 (gate G5 bans Event at any depth) |
| Indexing opt-in via SITE_INDEXABLE=1; GitHub Pages stays a noindex preview | Domain unknown; non-final hosts must never be indexed | ✓ Good — Phase 2 |
| Post-build SEO gate in `npm run build`; no env switch skips it | Broken SEO or unconfirmed facts must never ship; IIS deploy is a manual copy of `_site/` | ✓ Good — Phase 2 (CR-01/CR-02 hardened) |
| Drafted facts carry TODO(FACTS-NN) tracked in FACTS.md | Claude drafts copy, user confirms; G10 blocks indexable builds until confirmed | ✓ Good — Phase 2 |
| SEO images generated once by isolated `tools/seo-images` (sharp pinned exactly, now 0.35.5) and committed | Keeps image libraries out of the site build and CI | ✓ Good — Phase 2 (sharp bump user-vetted 2026-10-08) |
| Slugs /jak-dolaczyc/, /operacje/, /sklad/ | Match Polish search phrasing; fixed forever | — Pending |
| Polish only | Target audience is Polish players | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-08 after Phase 2*
