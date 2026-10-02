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
- ✓ Basic SEO: title, meta description, keywords, Open Graph tags, SportsTeam JSON-LD — existing

### Active

- [ ] Technical SEO is complete: canonical URLs, sitemap.xml, robots.txt, full OG/Twitter cards with absolute image URLs, favicons/manifest, richer structured data (Organization, FAQPage, Event, BreadcrumbList)
- [ ] Site URL is configured in one place so it can be switched once a domain is purchased
- [ ] Lighthouse scores are high (target ≥ 90 in Performance, Accessibility, Best Practices, SEO on mobile)
- [ ] Images optimized (WebP/AVIF, responsive sizes, explicit dimensions, lazy-loading)
- [ ] Third-party weight reduced (Font Awesome full CDN → inline SVG icons; self-hosted/subset fonts)
- [ ] Accessibility: semantic landmarks, skip link, ARIA for modals/menu, focus management, contrast, reduced-motion support
- [ ] Visual refresh that keeps the tactical identity but feels more polished and trustworthy to first-time visitors
- [ ] New indexable page: How to join / FAQ (requirements, mods, schedule, recruitment steps)
- [ ] New indexable page: Operations / events (when IBC plays, mission types, op recaps)
- [ ] Multi-page structure with shared header/footer and consistent internal linking
- [ ] Units / roster page fed by member data from the Discord bot a friend is building — LAST phase

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
| Open to a light build tool / SSG | Shared layouts and image optimization across pages are painful by hand | — Pending |
| Visual refresh allowed, tactical identity kept | Goal is better first impression, not a rebrand | — Pending |
| Roster page last, fed by Discord bot | Data source being built by a friend; avoid blocking other work | — Pending |
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
*Last updated: 2026-10-02 after initialization*
