---
phase: 02-technical-seo
plan: 04
subsystem: seo
tags: [open-graph, twitter-card, favicon, web-manifest, theme-color, seo-gate, node-test]
status: complete

requires:
  - phase: 02-technical-seo
    provides: "02-02 OG card (assets/og/og-default-v1.jpg), icon set, src/favicon.ico, lib/image-size.js; 02-03 fullTitle/description head and the G1/G4/G6/G10 gate"
provides:
  - head.njk `canonical` and `ogImageUrl` variables (absolute via htmlBaseUrl(site.url))
  - full Open Graph + Twitter set on every page, per-page `ogImage`/`ogImageAlt`/`ogImageWidth`/`ogImageHeight` front-matter override
  - gate rule G3 (share tags, image file, declared size, 1200x630 on indexable pages)
  - src/_dev/og-override.njk dev-only override page
  - icon/manifest/theme-color block in head.njk; _site/favicon.ico; _site/site.webmanifest (dump-serialized, prefix-aware)
affects: [02-05 JSON-LD (head block below OG untouched), 02-06 cutover checklist (Discord preview, .webmanifest MIME), phase-04 pages (front matter ogImage override)]

actuals:
  tokens: 8062
  tasks: 3
  commits: 3
plan_head_before: 45bcbcb855da962aa89589495d29c34e21a69352
plan_head_after: e9816c2c278d9165d4b7bc738677cd2365a2f5c2

tech-stack:
  added: []
  patterns:
    - "Share URLs are absolute only through htmlBaseUrl(site.url); HtmlBasePlugin never rewrites <meta content>"
    - "Generated JSON files are Nunjucks dicts serialized with dump(2) | safe, never hand-written JSON"
    - "Gate fixtures carry a header-only PNG (signature + IHDR) so image-size rules run without real images"

key-files:
  created:
    - src/site.webmanifest.njk
    - src/_dev/og-override.njk
  modified:
    - src/_includes/partials/head.njk
    - eleventy.config.js
    - scripts/check-seo.js
    - test/build.test.js
    - test/links.test.js
    - test/seo.test.js
    - test/seo-gate.test.js

key-decisions:
  - "G3 compares og:url with the canonical actually present in the head (falling back to the expected absolute URL), so the message names the real mismatch"
  - "G3 reports a missing image file and stops: size checks run only on a readable PNG/JPEG; image headers are cached per output file"
  - "og:image:alt resolves once (ogImageAltText) and feeds both og:image:alt and twitter:image:alt"
  - "Override page declares the measured hero-bg.jpg size 1920x1080 (the file is a PNG with a .jpg name, readImageSize reads it either way)"

patterns-established:
  - "Per-page share override: front matter ogImage (+ ogImageWidth/ogImageHeight together, + ogImageAlt); without both sizes no width/height tags are emitted"

requirements-completed: [SEO-03, SEO-04]

coverage:
  - id: D1
    description: "Every page has the full absolute OG/Twitter set; og:url = canonical; twitter:image = og:image; no og:/twitter:description without a description; exactly one og:image/twitter:image"
    requirement: SEO-03
    verification:
      - kind: integration
        ref: "test/seo.test.js#(k) Open Graph and Twitter tags (D-07)"
        status: pass
      - kind: integration
        ref: "test/build.test.js, test/links.test.js (d)/(e) og:image = assets/og/og-default-v1.jpg under SITE_URL + prefix"
        status: pass
    human_judgment: false
  - id: D2
    description: "ogImage front matter overrides the default without emitting a second og:image"
    requirement: SEO-03
    verification:
      - kind: integration
        ref: "test/seo.test.js#(l) ogImage front matter overrides the default (D-07)"
        status: pass
    human_judgment: false
  - id: D3
    description: "G3 fails every broken-preview mode (missing, relative, foreign, missing file, twitter/og mismatch, og:url mismatch, card summary, wrong declared width, non-1200x630 on an indexable page) and passes real builds"
    requirement: SEO-03
    verification:
      - kind: unit
        ref: "test/seo-gate.test.js#G3 * (9 fixtures) and real build with dev pages passes the gate"
        status: pass
    human_judgment: false
  - id: D4
    description: "favicon.ico at the output root (3 entries), icon/manifest links prefixed, theme-color #080e11, valid prefixed manifest with matching icon sizes, manifest not in sitemap"
    requirement: SEO-04
    verification:
      - kind: integration
        ref: "test/seo.test.js#(m) favicons, manifest and theme-color (D-08, D-09); test/links.test.js (a) resolves every icon/manifest href"
        status: pass
    human_judgment: false
  - id: D5
    description: "Discord rich preview with the 1200x630 card; rose favicon readable on light and dark tabs; DevTools manifest panel clean; Discord stripe colour #080e11 acknowledged"
    requirement: SEO-03, SEO-04
    verification:
      - kind: manual
        ref: "Task 3 human-check (deferred to end of phase, human_verify_mode=end-of-phase); Discord check needs a deploy (02-06 checklist)"
        status: pending
    human_judgment: true
    rationale: "Visual and third-party crawler behaviour cannot be asserted from the build output"

duration: 4min
completed: 2026-10-07
---

# Phase 2 Plan 04: Open Graph, Twitter Cards, Favicons and Manifest Summary

**Every page now carries an absolute Open Graph/Twitter set pointing at the 1200x630 `og-default-v1.jpg` card (per-page `ogImage` override), enforced by the new gate rule G3, plus the rose favicon set, a prefix-aware `site.webmanifest` and `theme-color #080e11`. The Phase 1 favicon.ico 404 is fixed.**

## Performance

- **Duration:** about 4 min of execution (measured from the start marker; context loading before it not included)
- **Completed:** 2026-10-07
- **Tasks:** 3
- **Files modified:** 9 (2 created, 7 modified)

## Accomplishments

- `head.njk` computes `canonical` and `ogImageUrl` once with `htmlBaseUrl(site.url)` and writes og:type, og:site_name, og:locale, og:title (= `<title>`), og:description (only with a description), og:url (= canonical), og:image, og:image:width/height (1200/630 for the default, the page's own values for an override that sets both), og:image:alt, and twitter:card `summary_large_image`, twitter:title, twitter:description, twitter:image, twitter:image:alt. The old hardcoded og:title/og:description and the hero-bg.jpg og:image are gone.
- Gate rule **G3** in `scripts/check-seo.js` (every HTML page): exactly one og:image and one twitter:image, absolute and under `site.url + pathPrefix`, equal to each other; og:url equals the canonical; twitter:card is `summary_large_image`; the image file exists in the output; declared width/height match the file; pages that pass `isIndexableUrl` must use a 1200x630 image.
- `src/_dev/og-override.njk` (dev only) proves the override: `hero-bg.jpg`, 1920x1080, its own alt text, and a single og:image.
- Icon block: `/favicon.ico` (32x32), the 192 px PNG, the 180 px apple-touch-icon, `/site.webmanifest`, and `theme-color`. `eleventy.config.js` copies `src/favicon.ico` to the output root.
- `src/site.webmanifest.njk` builds a Nunjucks dict and outputs it with `dump(2) | safe`. In the GitHub Pages build it has `start_url`/`scope` `/IBC-Website/` and prefixed icon paths. `display` is `browser`.

## Task Commits

1. **Task 1: Open Graph and Twitter tags with absolute URLs on every page**: `7329cf6` (feat)
2. **Task 2: Gate rule G3, per-page ogImage override on a dev page, G3 fixtures**: `1823de3` (feat)
3. **Task 3: Favicons, web manifest and theme-color on every page**: `e9816c2` (feat)

## Files Created/Modified

- `src/_includes/partials/head.njk`: canonical/ogImageUrl/ogImageAltText variables, OG/Twitter block, icon/manifest/theme block
- `eleventy.config.js`: `"src/favicon.ico": "favicon.ico"` passthrough
- `src/site.webmanifest.njk`: new, dump-serialized manifest
- `src/_dev/og-override.njk`: new, dev-only override page
- `scripts/check-seo.js`: `metaContents`, `singleShareUrl`, `checkShareTags` (G3), cached header reads via `readImageSize`
- `test/build.test.js`, `test/links.test.js`: og:image expectations follow the card; links (e) also scans `.webmanifest` and `.config`
- `test/seo.test.js`: tests (k), (l), (m); a shared lazily built `seo-mutated` build
- `test/seo-gate.test.js`: `pngHeader`, `shareLines`, `validPage({ og })`, nine G3 fixtures and the real dev-page build

## Decisions Made

See the `key-decisions` list in the frontmatter.

## Deviations from Plan

None. The plan was executed as written. Small additions inside the plan's scope:
- `test/seo.test.js` (a) and (k) share one lazily built `seo-mutated` build instead of building twice.
- (k) also checks og:type, og:site_name, twitter:title and twitter:description, and runs the og:url = canonical and twitter:image = og:image checks on every page of the root and prefix builds.

## Issues Encountered

- As in 02-03, a quoted Bash heredoc collapsed `\\` inside a regex in `test/seo.test.js`. It was fixed with the Edit tool before the first test run and was never committed. All later regex edits used the Edit tool.

## Deferred Human Verification (end of phase)

The Task 3 human check is deferred because `human_verify_mode` is `end-of-phase`:
1. With `npm run dev`, open http://localhost:8080/ in Chrome. The tab should show the rose on the dark tile in both the light and the dark browser theme.
2. DevTools > Application > Manifest should show name "Inglourious Basterds Clan", short name IBC, theme colour #080e11 and both icons with no errors.
3. Discord stripe colour (flag only, D-09 is locked): after deploy, Discord draws the link-preview stripe in #080e11, which is near-black on Discord's dark theme. Changing it would change D-09.
4. Backstop truths (after deploy, 02-06 checklist): paste the preview URL into Discord and confirm the rich card shows.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- 02-05 can replace the legacy SportsTeam JSON-LD block. It sits directly below the new icon block and was not touched here.
- Phase 4 pages can set `ogImage` (with `ogImageWidth`, `ogImageHeight` and `ogImageAlt`) in front matter. G3 requires 1200x630 images on indexable pages.

## Self-Check: PASSED

- FOUND: src/site.webmanifest.njk, src/_dev/og-override.njk, src/_includes/partials/head.njk, scripts/check-seo.js, eleventy.config.js
- FOUND: 7329cf6, 1823de3, e9816c2
- `npm test`: 126 tests, 0 failures. `SITE_URL=https://guard.example npm run build` exits 0 (`check-seo: OK`) with no `_site/_dev`. The GitHub Pages-style build writes `_site/favicon.ico`, and its manifest has start_url `/IBC-Website/` and theme_color `#080e11`.
