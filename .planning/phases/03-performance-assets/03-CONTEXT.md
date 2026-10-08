# Phase 3: Performance & Assets - Context

**Gathered:** 2026-10-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the existing pages (home, 404, dev test pages) fast on mobile without changing how they look. This phase delivers:

- optimized responsive images (hero, gallery thumbnails, lightbox, header logo)
- one self-hosted Polish-capable font
- inline SVG icons in place of Font Awesome
- one minified CSS bundle built from partials, with no inline `style=`
- client JS split into native ES modules loaded through `data-js` hooks
- a post-build performance budget gate that Phases 4 and 5 must stay within

Requirements: PERF-01..PERF-07. PERF-08 (Lighthouse ≥ 90 in all four categories on every page) stays in Phase 5. New pages, design changes, a11y work and the final HUD font are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Image pipeline (PERF-01, PERF-02, PERF-03)
- **D-01:** Optimized variants are generated **at build time with `@11ty/eleventy-img`**, added to the root devDependencies. Templates use an image shortcode that emits `<picture>`, `srcset`/`sizes` and `width`/`height`. Variants are cached in `.cache/` (already gitignored). The root lockfile **must resolve `sharp` ≥ 0.35.5** (GHSA-wq5f-xc86-pv6w; same version the user vetted for `tools/seo-images`). The planner adds a test or check that guards this. — **Reversibility:** costly — every image call site uses the shortcode, and sharp becomes part of the root/CI dependency tree.
- **D-02:** **Originals stay in git as pipeline inputs but are no longer shipped.** Move them out of the passthrough-copied `src/assets/` (e.g. into an `src/images/` source folder; the planner names it) so only generated variants reach `_site/`. **Delete `src/assets/hero.jpg`** (the PERF-02 byte-identical duplicate of `hero-bg.jpg`). Keep `patrol.jpg` and `sniper.jpg` as unshipped sources for Phase 4 operation recaps.
- **D-03:** **Hero = one `<img fetchpriority="high">`, no art direction.** Same source image at responsive widths. CSS `object-fit: cover` (+ `object-position`) reproduces today's `background-size: cover` framing. The gradient overlay `linear-gradient(rgba(8,14,17,.35), rgba(8,14,17,.75))` moves to a pseudo-element or overlay element. The hero is **not** lazy-loaded, gets `decoding`/`fetchpriority` and a `<link rel="preload" as="image" imagesrcset=… fetchpriority="high">`. The largest mobile candidate is ≈ 120 KB or less. Mobile crop/art direction is not wanted (it would be a visible change).
- **D-04:** **The lightbox opens a ≤ 1600 px wide AVIF/WebP variant under 300 KB.** It picks the best format the browser supports (e.g. `<picture>`/`srcset` in the lightbox, or format-specific `data-*` attributes read by the module). Thumbnails keep their 600×338 display box with responsive `srcset`, `loading="lazy"` and explicit dimensions.
- **D-05:** **Formats = AVIF + WebP + JPEG fallback**, delivered as `<picture>` with the JPEG as `<img src>`.
- **D-06:** **The Phase 2 SEO images are left alone**: `src/assets/og/og-default-v1.jpg`, `src/assets/icons/*`, `src/favicon.ico`, `src/assets/brand/ibc-logo-512.png`. They stay committed, versioned and checked by the G3 gate. Only the **header logo** (`logo.png`, 4608×4500, displayed at 48 px, so 1x/2x variants) and the content images (hero, gallery) go through eleventy-img.

### Fonts & icons (PERF-04, PERF-05)
- **D-07:** **Self-host Montserrat only.** It is the only face that renders today: both `--font-hud` and `--font-body` start with `'Montserrat'`. Remove Inter and Share Tech Mono from the stacks and the Google Fonts `@import` (`src/css/style.css:1`) along with the `preconnect` links (`src/_includes/partials/head.njk:22-23`), and use system fallbacks behind Montserrat. This settles the STATE.md "Share Tech Mono has no Polish glyphs" concern for Phase 3. The final HUD/mono face is still Phase 5's UI-SPEC decision.
- **D-08:** **One variable Montserrat woff2**, subset to Latin + Latin Extended-A (all Polish letters), covering the weights in use (400, 500, 700, 800, 900). Phase 5 gets any weight for free.
- **D-09:** The woff2 is **downloaded once, subset and committed**, with its **OFL licence file** next to it. There is no runtime/npm font dependency. Use `@font-face` with `font-display: swap` and `<link rel="preload" as="font" type="font/woff2" crossorigin>` in the head.
- **D-10:** **An automated glyph test** (`node --test`) reads the committed woff2's cmap and asserts coverage of `ą ć ę ł ń ó ś ź ż` and `Ą Ć Ę Ł Ń Ó Ś Ź Ż`. UAT also checks "Zażółć gęślą jaźń" visually.
- **D-11:** **Icons come from one Nunjucks icon shortcode/partial** (e.g. `{% icon "discord" %}`) with the SVG paths stored in one place. The current icons are Discord, YouTube and Facebook, used in `discord-cta.njk`, `footer.njk` (incl. the `site.social` loop by `s.id`), `404.njk` and the `index.njk` terminal button. Icon-only links (footer) expose an accessible name (`aria-label` on the link + `aria-hidden` SVG, or `role="img"` + `<title>`, planner's choice). Icons next to visible text are `aria-hidden="true"`. Note the icon source licence (Simple Icons CC0 or FA Free brands CC BY 4.0). The Font Awesome CDN `<link>` (`head.njk:24`) is removed.

### CSS/JS build (PERF-06, PERF-07)
- **D-12:** **CSS = partials bundled and minified with Lightning CSS** (one dev dependency), run as part of the Eleventy build. Each page loads exactly **one** stylesheet. Remove every inline `style=` from templates by turning those styles into classes (the ~9 in `src/index.njk`, the terminal button style, etc.).
- **D-13:** **Delete dead CSS**: roster, calendar and any selector with no matching markup or JS-added class (fulfils Phase 1 D-14). Git history keeps it for the v2 `/sklad/` page.
- **D-14:** **JS = unbundled native ES modules.** A tiny `<script type="module">` entry finds `[data-js]` hooks and **dynamically `import()`s only the feature modules present**: menu, lightbox/gallery, recruitment terminal, scroll-spy, easter egg. A page without the gallery/terminal/easter egg never downloads that code and shows no console errors. Each module also guards against a missing hook (PERF-07). The `data-discord-url` terminal contract from Phase 1 is kept.
- **D-15:** **Strict visual parity** using the Phase 1 D-07 method: before/after desktop + mobile screenshots plus the manual checklist (hero, about, gallery lightbox incl. keyboard, recruitment terminal, mobile menu, scroll-spy, footer easter egg, 404). Tiny font-rendering differences from self-hosting are acceptable. No design changes; those belong to Phase 5.

### Performance budget & gate
- **D-16:** **The budgets are enforced by a post-build gate** in the `npm run build` chain, either new rules in the existing gate or a sibling `scripts/check-perf.js` + `lib/check-perf.js` following the `check-seo.js` pattern. It fails the build and the output goes to `_site.rejected/` as in Phase 2. Minimum rules:
  - the hero's largest mobile candidate is ≤ ~120 KB
  - every lightbox target is < 300 KB
  - no `fonts.googleapis.com`, `fonts.gstatic.com` or Font Awesome/cdnjs URLs in the output
  - no `style=` attributes in the HTML
  - exactly one stylesheet `<link>` per page
  - every `<img>` has `width` and `height`
  - non-hero images have `loading="lazy"`
  - no shipped original/unoptimized source images (e.g. multi-MB PNGs, `hero.jpg`) in `_site/`
- **D-17:** **The gate also caps total per-page weight.** Claude sets the CSS (gz), initial JS (gz) and font numbers from the post-Phase-3 measured sizes plus headroom, in **one config object** so Phase 4/5 must raise them deliberately. This is the "performance budget" the roadmap goal refers to.
- **D-18:** **Phase 3 is done at mobile PSI Performance ≥ 90** on the GitHub Pages preview, recorded against the 2026-10-08 baseline (Performance 67; LCP 0/25, FCP 4/10, SI 7/10, CLS 25/25, TBT 30/30) in the phase verification. A result below 90 is a verification gap, not a silent pass. Accessibility, Best Practices and SEO are recorded but not gated here (PERF-08 / Phase 5). The SEO "is-crawlable" failure on the preview is expected (noindex by design, Phase 2 D-15).
- **D-19:** **No Lighthouse CI.** PSI is run by hand at verification, and the deterministic byte-budget gate covers regressions.

### Already locked (from earlier phases, not re-discussed)
- Vanilla CSS/JS, no frameworks/Tailwind/Sass. Eleventy `~3.1.6` + Nunjucks, Node 24 LTS.
- `HtmlBasePlugin` rewrites root-relative `href`/`src`/`srcset` for the `/IBC-Website/` pathPrefix. Everything new (preloads, `imagesrcset`, font URLs in CSS, dynamic `import()` paths, lightbox `data-*` URLs) must work at the root and under the prefix (Phase 1 success criterion 5).
- Tests build into `_test/` and never `_site/`. The SEO gate (G0–G10) must keep passing.

### Claude's Discretion
- Image widths/quality per format, the `sizes` strings, and the eleventy-img shortcode name/signature. Whether to cache `.cache/` in CI.
- Folder name for the unshipped image sources. Exact partial names/order and how Lightning CSS hooks into Eleventy (template, `addExtension`, or a build step). Cache-busting (content hash or `?v=`).
- Whether JS modules are minified. Module file names. Whether scroll-spy/menu load on every page.
- The size-adjusted fallback `@font-face` (to avoid CLS on swap), the exact subset tool, and the font file name.
- Whether the perf rules extend `lib/check-seo.js` or live in a sibling gate. The exact cap numbers (D-17).
- Whether to also reduce the mobile cost of `backdrop-filter` / fixed overlays, but only if it is visually identical (otherwise leave it to Phase 5).

### Folded Todos
- **Fix mobile LCP and render-blocking CSS in Phase 3** (`.planning/todos/pending/2026-10-08-fix-mobile-lcp-and-render-blocking-css-in-phase-3.md`). Measured PSI mobile baseline 67, with LCP earning 0/25 because of the unoptimized `hero-bg.jpg` CSS background. FCP and SI are hurt by the render-blocking Google Fonts `@import` and the FA CDN. Order of work: **LCP first (D-03), then fonts/icons (D-07..D-11)**, then re-run PSI against the baseline (D-18). TBT and CLS are already perfect, so no effort goes there. The todo can be closed when Phase 3 verification records the new PSI run.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope & requirements
- `.planning/ROADMAP.md` §"Phase 3: Performance & Assets": goal and the 5 success criteria
- `.planning/REQUIREMENTS.md`: PERF-01..PERF-07 (PERF-08 is Phase 5)
- `.planning/todos/pending/2026-10-08-fix-mobile-lcp-and-render-blocking-css-in-phase-3.md`: PSI baseline numbers and the fix order

### Prior decisions that constrain this phase
- `.planning/phases/01-eleventy-foundation/01-CONTEXT.md`: D-05/D-07 parity method, D-13 `src/` layout, D-14 dead-CSS removal promised for Phase 3
- `.planning/phases/02-technical-seo/02-CONTEXT.md`: D-06/D-08/D-12 committed SEO images, D-15 noindex preview, D-19 gate pattern
- `.planning/phases/02-technical-seo/02-SECURITY.md`: sharp GHSA-wq5f-xc86-pv6w follow-up (root lockfile must resolve ≥ 0.35.5)
- `.planning/STATE.md` §Blockers/Concerns: Share Tech Mono / Polish glyph note, Phase 5 font decision

### Codebase maps
- `.planning/codebase/CONCERNS.md`: unoptimized images, FA full CSS for a few icons, render-blocking font `@import`, `backdrop-filter` cost, inline styles
- `.planning/codebase/CONVENTIONS.md`: naming/comment conventions for CSS/JS

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/check-seo.js` + `scripts/check-seo.js`: post-build gate pattern (rule functions, reporter, `_site.rejected/` move on failure) to copy or extend for the perf gate.
- `lib/html.js` (`listFiles`) and `lib/image-size.js` (header reader for committed images): reusable in the perf gate and tests.
- `test/helpers.js` + `node --test` harness that builds into `_test/`, and `test/build.test.js`/`links.test.js` for dual-variant (root + `/IBC-Website/`) checks.
- `test/client.test.js` runs `src/js/main.js` in a `node:vm` stub DOM. It must be adapted to the module split (ES modules + dynamic import), keeping its invite-source and `writeToConsole` sink checks.
- `tools/seo-images/` (sharp 0.35.5, isolated package): the precedent for the vetted sharp version and stays separate from the site build.

### Established Patterns
- `eleventy.config.js` passthrough-copies `src/css`, `src/js` and `src/assets` wholesale. All three change: CSS becomes a bundled output, JS stays passthrough (modules), assets must stop copying the originals.
- `HtmlBasePlugin` handles `pathPrefix` for root-relative URLs. URLs built in JS (dynamic `import()`, lightbox sources) need a prefix-safe base (e.g. `import.meta.url`-relative or `htmlBaseUrl` data attributes, as in `data-src="{{ … | htmlBaseUrl }}"` today).
- Single sources of truth live in `src/_data/site.js` (invite, `site.social` with `id` used for icon names).

### Integration Points
- `src/css/style.css:1`: Google Fonts `@import` (remove); `:25-26` font stacks; `:424` hero `background-image` (becomes `<img>`); `:132`/`:246` `backdrop-filter`; `:662+` roster CSS (delete).
- `src/_includes/partials/head.njk:22-25`: preconnects, FA CDN, stylesheet link (replace with font/hero preload + bundled CSS).
- `src/_includes/layouts/base.njk:23`: `<script src="/js/main.js">` (becomes the module entry).
- `src/index.njk:78-106`: gallery items (`data-src` + `<img>` → shortcode output), `:151-165` inline-styled recruitment card and terminal button, `:177` lightbox `<img>`.
- `src/_includes/partials/header.njk:5`: logo `<img>` (→ 48 px 1x/2x variants).
- `src/_includes/partials/footer.njk:15-18`, `discord-cta.njk`, `404.njk:16`: `<i class="fab …">` → icon shortcode.
- `.github/workflows/pages.yml`: `npm ci` will now install sharp (linux-x64) and Lightning CSS. Optional `.cache` caching.

</code_context>

<specifics>
## Specific Ideas

- Fix order follows the PSI evidence: LCP (hero) first, then render-blocking fonts/icons, then CSS/JS structure.
- The budget numbers become a contract for Phase 4 (new pages, live Discord badge) and Phase 5 (visual refresh): raising a cap must be a visible, deliberate edit.
- The user prefers the recommended, low-risk option throughout: parity over polish, deterministic gates over noisy CI tooling, single sources of truth.

</specifics>

<deferred>
## Deferred Ideas

- Art-directed mobile hero crop: visible change, so it goes to the Phase 5 visual refresh if wanted.
- Self-hosting a Polish-capable mono/HUD face: Phase 5 UI-SPEC font decision.
- Lighthouse CI on PRs: rejected for now (noisy, heavy). Revisit only if the byte gate proves insufficient.
- Lighthouse ≥ 90 in Accessibility/Best Practices/SEO on every page: PERF-08, Phase 5.

</deferred>

---

*Phase: 03-performance-assets*
*Context gathered: 2026-10-08*
