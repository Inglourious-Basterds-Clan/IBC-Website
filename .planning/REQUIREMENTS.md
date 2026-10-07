# Requirements: IBC Website

**Defined:** 2026-10-02
**Core Value:** A Polish player searching for an Arma 3 milsim clan (or for "IBC" by name) finds this site, understands what IBC is and how to join, and clicks through to Discord.

## v1 Requirements

Requirements for this milestone. Each maps to a roadmap phase.

### Foundation

- [x] **FOUND-01**: Site builds with Eleventy 3.1.x into static files in `_site/`, and the deploy steps are documented
- [x] **FOUND-02**: Home page renders with the same content and look as before the migration
- [x] **FOUND-03**: Site URL is set in one value (`SITE_URL`), and every absolute URL comes from it
- [x] **FOUND-04**: Discord invite link is defined once and used everywhere
- [x] **FOUND-05**: All pages share one layout: header, nav, footer and Discord CTA
- [x] **FOUND-06**: Internal links work both at a domain root and under a subpath (pathPrefix, e.g. GitHub Pages)

### SEO

- [x] **SEO-01**: Every page has a unique title, a meta description and an absolute canonical URL
- [x] **SEO-02**: `sitemap.xml` lists every indexable page, and `robots.txt` points to it
- [x] **SEO-03**: Every page has absolute OG/Twitter tags with a 1200×630 OG image, so Discord link previews render correctly
- [x] **SEO-04**: Favicons, web manifest and `theme-color` are present
- [x] **SEO-05**: Home page has Organization + WebSite JSON-LD (alternateName "IBC", sameAs links, foundingDate 2018); SportsTeam and meta keywords are removed; no Event markup
- [ ] **SEO-06**: Subpages show visible breadcrumbs and have BreadcrumbList JSON-LD
- [x] **SEO-07**: Custom Polish 404 page
- [x] **SEO-08**: Build fails on a missing or relative canonical/og:image, invalid JSON-LD, a page missing from the sitemap, or a leftover TODO marker
- [x] **SEO-09**: Non-final hosts are served `noindex` automatically, and a domain cutover checklist is documented

### Performance

- [ ] **PERF-01**: Images are served as AVIF/WebP with responsive srcset and explicit dimensions; below-the-fold images lazy-load
- [ ] **PERF-02**: Hero is an `<img fetchpriority="high">` of about 120 KB or less on mobile, and the duplicate `hero.jpg` is removed
- [ ] **PERF-03**: Lightbox loads optimized images under 300 KB, and the logo is resized to its display size
- [ ] **PERF-04**: Fonts are self-hosted woff2 that include Polish characters; no requests go to Google Fonts
- [ ] **PERF-05**: Font Awesome CDN is replaced by inline SVG icons with accessible names
- [ ] **PERF-06**: CSS is split into partials and bundled into one minified file; inline styles are removed
- [ ] **PERF-07**: JS is split into ES modules loaded through `data-js` hooks, and each module does nothing on pages where its feature isn't present
- [ ] **PERF-08**: Every page scores ≥ 90 in all four Lighthouse categories on mobile

### Content

- [ ] **CONT-01**: `/jak-dolaczyc/` shows requirements and numbered join steps
- [ ] **CONT-02**: `/jak-dolaczyc/` has a 12–16 question Polish FAQ
- [ ] **CONT-03**: `/operacje/` shows schedule, mission types, eras and a "typowy wieczór" timeline
- [ ] **CONT-04**: `/operacje/` shows 3–5 dated operation recaps
- [ ] **CONT-05**: Nav links to real pages, and old `#hash` links redirect to the matching new page
- [ ] **CONT-06**: Facts drafted by Claude are marked TODO and listed in `FACTS.md`; the user confirms them before publishing
- [ ] **CONT-07**: Live Discord badge (members/online) with a static fallback, labelled so it doesn't conflict with "20+ aktywnych członków"

### Accessibility

- [ ] **A11Y-01**: Skip link, semantic landmarks, one `h1` per page
- [ ] **A11Y-02**: Lightbox and easter-egg modals trap focus, close on Esc and return focus when closed
- [ ] **A11Y-03**: Mobile menu works from the keyboard and exposes `aria-expanded`
- [ ] **A11Y-04**: `prefers-reduced-motion` turns off animations and scanlines, and the terminal content is readable as static HTML
- [ ] **A11Y-05**: Text contrast meets WCAG AA, including over the scanline overlay

### Visual

- [ ] **UI-01**: Refreshed visual design, defined in a UI-SPEC, that keeps the tactical HUD identity
- [ ] **UI-02**: HUD font displays Polish letters (ą ę ł ś ź ż ć ń)
- [ ] **UI-03**: Heavy effects (`backdrop-filter`, scanlines) are reduced on mobile

## v2 Requirements

Deferred to a future milestone. Tracked but not in the current roadmap.

### Roster

- **ROST-01**: Roster page at `/sklad/` built from the friend's Discord bot data at build time
- **ROST-02**: Agreed data contract with the bot author (field whitelist: callsign, rank, unit, role)
- **ROST-03**: Members appear only after opting in; no Discord IDs, avatars or join dates are published
- **ROST-04**: Build falls back to a committed snapshot when the bot is unavailable
- **ROST-05**: Polish privacy page ("Polityka prywatności")

### Engagement

- **ENG-01**: Member testimonials on the home and join pages
- **ENG-02**: Modpack quick-start (how to install the clan mods)
- **ENG-03**: Separate recap page for each operation
- **ENG-04**: Upcoming ops fed by the bot (not maintained by hand)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Event JSON-LD | Google excludes online-only and members-only events and doesn't show Event results in Poland; risk of a spam manual action |
| Hand-maintained upcoming-ops calendar | Goes stale and makes the unit look inactive |
| On-site application form | Recruitment happens on Discord |
| Discord widget iframe | Widget is disabled on the server; heavy third-party embed |
| Analytics | Not a goal for this milestone |
| English version | Target audience is Polish players |
| Hosting / deployment setup | User deploys the site themselves |
| Building the Discord bot | Owned by a friend; this project only consumes its data |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| FOUND-05 | Phase 1 | Complete |
| FOUND-06 | Phase 1 | Complete |
| SEO-01 | Phase 2 | Complete |
| SEO-02 | Phase 2 | Complete |
| SEO-03 | Phase 2 | Complete |
| SEO-04 | Phase 2 | Complete |
| SEO-05 | Phase 2 | Complete |
| SEO-06 | Phase 4 | Pending |
| SEO-07 | Phase 2 | Complete |
| SEO-08 | Phase 2 | Complete |
| SEO-09 | Phase 2 | Complete |
| PERF-01 | Phase 3 | Pending |
| PERF-02 | Phase 3 | Pending |
| PERF-03 | Phase 3 | Pending |
| PERF-04 | Phase 3 | Pending |
| PERF-05 | Phase 3 | Pending |
| PERF-06 | Phase 3 | Pending |
| PERF-07 | Phase 3 | Pending |
| PERF-08 | Phase 5 | Pending |
| CONT-01 | Phase 4 | Pending |
| CONT-02 | Phase 4 | Pending |
| CONT-03 | Phase 4 | Pending |
| CONT-04 | Phase 4 | Pending |
| CONT-05 | Phase 4 | Pending |
| CONT-06 | Phase 4 | Pending |
| CONT-07 | Phase 4 | Pending |
| A11Y-01 | Phase 5 | Pending |
| A11Y-02 | Phase 5 | Pending |
| A11Y-03 | Phase 5 | Pending |
| A11Y-04 | Phase 5 | Pending |
| A11Y-05 | Phase 5 | Pending |
| UI-01 | Phase 5 | Pending |
| UI-02 | Phase 5 | Pending |
| UI-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-02*
*Last updated: 2026-10-02 after roadmap creation*
