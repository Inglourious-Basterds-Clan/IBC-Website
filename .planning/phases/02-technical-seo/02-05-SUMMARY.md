---
phase: 02-technical-seo
plan: 05
subsystem: seo
tags: [json-ld, schema.org, organization, website, eleventy, nunjucks, check-seo]

# Dependency graph
requires:
  - phase: 02-technical-seo (02-02)
    provides: "src/assets/brand/ibc-logo-512.png and lib/image-size.js readImageSize"
  - phase: 02-technical-seo (02-04)
    provides: "head.njk isHome/canonical writer, site.social list, check-seo G3 and validPage fixtures"
provides:
  - "lib/schema.js buildSchemaGraph(site) and jsonLd(value)"
  - "schemaGraph and jsonLd Eleventy filters"
  - "Home-only Organization + WebSite JSON-LD @graph linked by @id"
  - "Footer social icons looped from site.social (shared with sameAs)"
  - "check-seo rule G5 (JSON-LD parses, no Event/SportsTeam, home identity graph)"
affects: [02-06, phase-04-content, phase-05-visual-refresh]

# Actuals (#2632)
actuals:
  tokens: 4600
  tasks: 2
  commits: 2
plan_head_before: 55da96c561c52e304a5dd1800dc754e5c3674dad
plan_head_after: 3a31a508007514e003c4b2c0aac542980d8e0dee

tech-stack:
  added: []
  patterns:
    - "Structured data built in a pure JS module from site.js and serialized with a <-escaping jsonLd filter; the only `safe` in the head"
    - "Gate rules parse and walk JSON-LD recursively rather than string-matching types"

key-files:
  created:
    - lib/schema.js
    - test/schema.test.js
  modified:
    - eleventy.config.js
    - src/_includes/partials/head.njk
    - src/_includes/partials/footer.njk
    - scripts/check-seo.js
    - test/layout.test.js
    - test/seo-gate.test.js

key-decisions:
  - "G5 checks the identity graph on index.html only; Organization/WebSite are looked up at the top level of a block (@graph array, node array or single node)"
  - "G5 forbidden types are Event and SportsTeam (D-14); Person/AggregateRating/Review/founder/member/employee are enforced by test/schema.test.js prohibition checks, not the gate"
  - "validPage fixtures carry a minimal Organization + WebSite graph on the home page by default (jsonLd option; null leaves it out)"

patterns-established:
  - "Social profiles have one source (site.social): footer loop and JSON-LD sameAs both read it"

requirements-completed: [SEO-05]

coverage:
  - id: D1
    description: "Home page publishes exactly one Organization + WebSite JSON-LD graph built from site.js (name, alternateName IBC/IBC Clan, foundingDate 2018, description, url = canonical, 512x512 alpha PNG logo, sameAs = social + Discord); no other page carries JSON-LD"
    requirement: SEO-05
    verification:
      - kind: integration
        ref: "test/schema.test.js#(root build) home page carries one Organization + WebSite graph from site.js"
        status: pass
      - kind: integration
        ref: "test/schema.test.js#(prefix build) home page carries one Organization + WebSite graph from site.js"
        status: pass
      - kind: integration
        ref: "test/schema.test.js#(root build) no other page carries JSON-LD"
        status: pass
      - kind: unit
        ref: "test/schema.test.js#(unit) buildSchemaGraph at the root"
        status: pass
    human_judgment: false
  - id: D2
    description: "jsonLd serializer escapes every < so no value can close the script element"
    requirement: SEO-05
    verification:
      - kind: unit
        ref: "test/schema.test.js#(unit) jsonLd escapes < so a value cannot close the script element"
        status: pass
    human_judgment: false
  - id: D3
    description: "Legacy SportsTeam block removed; graph holds no Person/Event/SportsTeam/AggregateRating/Review nodes or founder/member/employee keys (plan prohibitions)"
    requirement: SEO-05
    verification:
      - kind: integration
        ref: "test/layout.test.js#home page keeps its Polish copy and its new head title (D-01, D-14)"
        status: pass
      - kind: unit
        ref: "test/schema.test.js#(unit) buildSchemaGraph at the root"
        status: pass
    human_judgment: false
  - id: D4
    description: "Footer social icons rendered from site.social with target=_blank rel=noopener noreferrer; footer.njk holds no social URL literal (D-13)"
    verification:
      - kind: integration
        ref: "test/schema.test.js#(footer) social icons come from site.social (D-13)"
        status: pass
    human_judgment: false
  - id: D5
    description: "check-seo G5 fails unparseable JSON-LD, a nested Event, the legacy SportsTeam type and a home page without Organization + WebSite; GitHub Pages-style build passes"
    requirement: SEO-05
    verification:
      - kind: unit
        ref: "test/seo-gate.test.js#G5 unparseable JSON-LD"
        status: pass
      - kind: unit
        ref: "test/seo-gate.test.js#G5 Event nested inside the home @graph"
        status: pass
      - kind: unit
        ref: "test/seo-gate.test.js#G5 legacy SportsTeam JSON-LD"
        status: pass
      - kind: unit
        ref: "test/seo-gate.test.js#G5 home page graph without the WebSite node"
        status: pass
      - kind: integration
        ref: "MSYS_NO_PATHCONV=1 SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/ npm run build"
        status: pass
    human_judgment: false
  - id: D6
    description: "Rich Results Test / validator.schema.org accept the built home graph (Organization + WebSite, alternateName IBC, sameAs, foundingDate 2018)"
    requirement: SEO-05
    verification: []
    human_judgment: true
    rationale: "External Google/schema.org validators cannot be run from the test suite (plan backstop truth and Task 1 human-check)"

duration: 3min
completed: 2026-10-07
status: complete
---

# Phase 2 Plan 05: Organization + WebSite JSON-LD Summary

**Home-only schema.org @graph (Organization + WebSite linked by @id, alternateName IBC, foundingDate 2018, sameAs from site.social + Discord) built by lib/schema.js with a <-escaping serializer, footer socials moved onto site.social, and check-seo rule G5 guarding JSON-LD**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-07T19:16:02Z
- **Completed:** 2026-10-07T19:19:18Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- `lib/schema.js` builds the Organization + WebSite graph from `src/_data/site.js`; `jsonLd()` turns every `<` into `<`; both registered as Eleventy filters and rendered by one line in `head.njk` on the home page only
- Legacy SportsTeam JSON-LD removed; the Phase 1 layout assertion inverted (SportsTeam absent, ld+json present)
- Footer social icons loop over `site.social`, so the footer and `sameAs` share one list (D-13)
- Gate rule G5: JSON-LD parses, no Event/SportsTeam at any depth, `index.html` has an Organization + WebSite graph; four failing fixtures prove it
- `test/schema.test.js`: unit tests, root and prefix real-build checks (logo is a 512x512 alpha PNG in the output, url = home canonical, sameAs = site.js), prohibition checks and the footer check

## Task Commits

1. **Task 1: Organization + WebSite JSON-LD from lib/schema.js; legacy block removed** - `5a37cf9` (feat)
2. **Task 2: Footer socials from site.social and gate rule G5** - `3a31a50` (feat)

## Files Created/Modified
- `lib/schema.js` - buildSchemaGraph(site) and jsonLd(value)
- `test/schema.test.js` - SEO-05 unit, real-build, prohibition and footer checks
- `eleventy.config.js` - schemaGraph and jsonLd filters
- `src/_includes/partials/head.njk` - home-only JSON-LD line replaces the SportsTeam block
- `src/_includes/partials/footer.njk` - `{% for s in site.social %}` social icons
- `scripts/check-seo.js` - rule G5 (jsonLdScripts, jsonLdTypes, hasOrganizationAndWebsite, checkJsonLd)
- `test/layout.test.js` - inverted legacy JSON-LD assertion
- `test/seo-gate.test.js` - homeGraph helper, validPage jsonLd option, four G5 fixtures

## Decisions Made
- G5 checks the identity graph on `index.html` only and looks for Organization/WebSite at the top level of a block (`@graph` array, node array or single node); forbidden types are found at any depth.
- G5 bans Event and SportsTeam (D-14). The wider prohibitions (Person, AggregateRating, Review, founder/member/employee keys, Organization key allow-list) live in `test/schema.test.js`, as the plan specifies.
- Fixture home pages carry a minimal valid graph by default so every existing fixture still passes G5.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- The prefix build has no page besides `index.html` (dev pages are excluded and the 404 page is not built yet), so the "no other page carries JSON-LD" test only requires other pages in the root build (dev pages included).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Ready for 02-06. Human backstop pending (end-of-phase UAT): paste the `<script type="application/ld+json">` block from `_site/index.html` into https://validator.schema.org/ and https://search.google.com/test/rich-results; expect Organization + WebSite, alternateName IBC, foundingDate 2018, three sameAs links (logo is pale on white by design, D-12).
- Site-name signals only count on the final root host; the GitHub Pages preview is noindex, so this is expected.

---
*Phase: 02-technical-seo*
*Completed: 2026-10-07*

## Self-Check: PASSED
