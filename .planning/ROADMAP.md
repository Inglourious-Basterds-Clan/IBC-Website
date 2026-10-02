# Roadmap: IBC Website

## Overview

This milestone takes the IBC site from one hand-written Polish landing page to a fast, well-indexed multi-page Eleventy site that turns Polish Arma 3 milsim searchers into Discord members. First the existing page moves into Eleventy with no visual change. The site URL and Discord invite each get a single config value, and a shared layout is added. Next, two independent tracks run in parallel. One builds the technical SEO system: head metadata, structured data, sitemap and a build gate that blocks bad SEO. The other builds the performance and asset pipeline: optimized images, self-hosted fonts, inline SVG icons, and CSS/JS split into modules. With both in place, the new `/jak-dolaczyc/` and `/operacje/` pages are SEO-complete and image-optimized from the start, and the nav switches to real page URLs. Finally, one accessibility and visual-refresh pass covers every page, and every page must score at least 90 on mobile Lighthouse. The roster page (`/sklad/`) is v2 and not part of this roadmap.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Eleventy Foundation** - Migrate the existing page to Eleventy at visual parity, with one config value for the site URL and Discord invite and a shared layout
- [ ] **Phase 2: Technical SEO** - Every page gets complete metadata, structured data, a sitemap, a noindex guard for non-final hosts and a build gate for SEO errors
- [ ] **Phase 3: Performance & Assets** - Optimized images, self-hosted Polish fonts, inline SVG icons, and modular CSS/JS that set the mobile performance budget
- [ ] **Phase 4: Join & Operations Pages** - Real `/jak-dolaczyc/` and `/operacje/` pages, multi-page navigation, breadcrumbs, user-confirmed facts and a live Discord badge
- [ ] **Phase 5: Accessibility & Visual Refresh** - Keyboard, screen reader and reduced-motion support, a polished tactical-HUD refresh, and a Lighthouse score of at least 90 on every page

## Phase Details

### Phase 1: Eleventy Foundation

**Goal**: The current site builds with Eleventy into plain static files and looks and behaves exactly as before. The site URL and Discord invite each live in one place, and new pages can reuse a shared layout.
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06
**Success Criteria** (what must be TRUE):
  1. The user runs one documented build command and gets a complete static site in `_site/`. The docs say which folder to deploy (this replaces deploying the repo root).
  2. The built home page looks and behaves the same as the old `index.html` side by side: hero, about, gallery lightbox, recruitment terminal, mobile menu, scroll-spy and footer easter egg all still work.
  3. Changing `SITE_URL` or the Discord invite in its single config location and rebuilding updates every absolute URL or Discord link in the output. A search of `_site/` finds no hardcoded host and no second copy of the invite.
  4. A new page that has only front matter and body content renders with the same header, nav, footer and Discord CTA as the home page.
  5. The built site works both at a domain root and under a subpath prefix (e.g. GitHub Pages `/IBC-Website/`). Every internal link, stylesheet, script and image resolves in both setups.

**Plans**: 2/6 plans executed

Plans:
**Wave 1**
- [x] 01-01-PLAN.md — D-07 baseline capture, then tracer: Eleventy builds src/ with site.js config at root and /IBC-Website/ (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 01-02-PLAN.md — Shared base layout + partials, data-driven nav, header Discord CTA, skip link (wave 2)
- [ ] 01-03-PLAN.md — Client JS: terminal reads invite from data-discord-url, hash-based scroll-spy (wave 2)
- [ ] 01-04-PLAN.md — GitHub Pages Actions workflow (PR build-only, deploy on main) + Polish README (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*
- [ ] 01-05-PLAN.md — Dev-only layout test pages + clean-before-build production output (wave 3)

**Wave 4** *(blocked on Wave 3 completion)*
- [ ] 01-06-PLAN.md — Dual-variant link/config/invite audit + after-migration parity capture and checklist (wave 4)

### Phase 2: Technical SEO

**Goal**: Every page the site builds is ready for search and sharing from the start: correct head metadata, valid structured data, a sitemap and favicons. A build gate stops broken SEO or unconfirmed facts from shipping, and non-final hosts are never indexed.
**Depends on**: Phase 1
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-07, SEO-08, SEO-09
**Success Criteria** (what must be TRUE):
  1. Pasting the site URL into Discord shows a rich preview with the IBC title, description and the 1200×630 OG image. The page source has a unique title, a meta description, an absolute canonical URL and absolute OG/Twitter tags.
  2. `/sitemap.xml` lists every indexable page by absolute URL and `/robots.txt` points to it. The browser tab shows the IBC favicon, and the web manifest and `theme-color` are present.
  3. Validating the home page (Rich Results Test / Schema.org validator) shows valid Organization + WebSite JSON-LD with alternateName "IBC", sameAs links and foundingDate 2018. There is no SportsTeam markup, Event markup or meta keywords tag.
  4. A visitor who opens a nonexistent URL sees a Polish 404 page in the site layout with a way back to the home page and Discord.
  5. The production build fails with a clear message on a missing or relative canonical or og:image, invalid JSON-LD, a page missing from the sitemap, or a leftover TODO marker. A build for a non-final host puts `noindex` on every page, and a documented domain cutover checklist exists.

**Plans**: TBD

### Phase 3: Performance & Assets

**Goal**: Pages load fast on mobile with optimized images, self-hosted fonts and no heavy third-party assets. CSS and JS are structured so new pages and the visual refresh fit within the performance budget.
**Depends on**: Phase 1
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04, PERF-05, PERF-06, PERF-07
**Success Criteria** (what must be TRUE):
  1. On a throttled mobile connection, the hero loads as an `<img fetchpriority="high">` of about 120 KB or less. Gallery images arrive as AVIF/WebP with responsive srcset and explicit dimensions, and below-the-fold images load only when scrolled into view.
  2. Opening any gallery image in the lightbox loads an optimized version under 300 KB. The logo is served at its display size, and the duplicate `hero.jpg` is gone from the output.
  3. The DevTools Network panel shows no requests to Google Fonts or the Font Awesome CDN. "Zażółć gęślą jaźń" renders correctly in every self-hosted font, and icons are inline SVGs that screen readers announce by name.
  4. Each page loads a single minified CSS bundle, and the built HTML contains no inline `style=` attributes.
  5. JS features load as ES modules through `data-js` hooks. A page without the gallery, terminal or easter egg loads with no console errors and doesn't run that feature's code.

**Plans**: TBD

### Phase 4: Join & Operations Pages

**Goal**: A Polish recruit can move around a real multi-page site, learn exactly how to join and how IBC plays, and see that the unit is active. The user confirms every drafted fact before publishing.
**Depends on**: Phase 2, Phase 3
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-07, SEO-06
**Success Criteria** (what must be TRUE):
  1. A visitor on `/jak-dolaczyc/` sees the requirements, numbered join steps and an expandable 12–16 question FAQ in natural Polish, plus a visible Discord CTA.
  2. A visitor on `/operacje/` sees the recurring schedule, mission types, eras, a "typowy wieczór" timeline and 3–5 dated operation recaps.
  3. Nav links go to real pages with the current page marked. An old link such as `/#recruitment` lands on the matching new page. Both subpages show visible breadcrumbs that pass BreadcrumbList validation.
  4. Every fact Claude drafted is marked TODO and listed in `FACTS.md`. The production build stays blocked until the user confirms each one and the markers are removed.
  5. The home page shows a live Discord members/online badge. It falls back to a static number when the request fails or JS is off, and its label doesn't contradict the "20+ aktywnych członków" claim.

**Plans**: TBD
**UI hint**: yes

### Phase 5: Accessibility & Visual Refresh

**Goal**: Every page works for keyboard, screen reader and reduced-motion users. The site looks polished and trustworthy while keeping its tactical HUD identity, and every page scores at least 90 in all four Lighthouse categories on mobile.
**Depends on**: Phase 4
**Requirements**: A11Y-01, A11Y-02, A11Y-03, A11Y-04, A11Y-05, UI-01, UI-02, UI-03, PERF-08
**Success Criteria** (what must be TRUE):
  1. A keyboard-only user can reach a skip link first on every page and work the mobile menu (`aria-expanded` toggles). The lightbox and easter-egg modals trap focus, close on Esc and return focus to the control that opened them. Each page has semantic landmarks and exactly one `h1`.
  2. With `prefers-reduced-motion` enabled, animations and scanlines are off and the recruitment terminal reads as static text. All text meets WCAG AA contrast, measured over the scanline overlay.
  3. The refreshed design matches the approved UI-SPEC, and a clan member still recognizes it as the tactical-HUD IBC site. HUD text shows "ą ę ł ś ź ż ć ń" correctly.
  4. Scrolling is smooth on a mid-range phone because `backdrop-filter` and scanline effects are reduced or turned off on mobile.
  5. Every page (home, `/jak-dolaczyc/`, `/operacje/`, 404) scores at least 90 in Performance, Accessibility, Best Practices and SEO on mobile Lighthouse, using the median of 3 runs.

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5. Phases 2 and 3 both depend only on Phase 1 and can run in parallel. Phase 4 needs both of them.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Eleventy Foundation | 2/6 | In Progress|  |
| 2. Technical SEO | 0/TBD | Not started | - |
| 3. Performance & Assets | 0/TBD | Not started | - |
| 4. Join & Operations Pages | 0/TBD | Not started | - |
| 5. Accessibility & Visual Refresh | 0/TBD | Not started | - |
