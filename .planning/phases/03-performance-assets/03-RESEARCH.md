# Phase 3: Performance & Assets - Research

**Researched:** 2026-10-10
**Domain:** Eleventy 3.1 build-time asset pipeline (eleventy-img/sharp, Lightning CSS, self-hosted font, inline SVG, native ES modules) + post-build perf gate
**Confidence:** HIGH. Every load-bearing claim was checked against installed source, a scratchpad spike on the real repo images and font, or the npm registry. Gaps are listed in the Assumptions Log.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Image pipeline (PERF-01, PERF-02, PERF-03)
- **D-01:** Optimized variants are generated **at build time with `@11ty/eleventy-img`**, added to the root devDependencies. Templates use an image shortcode that emits `<picture>`, `srcset`/`sizes` and `width`/`height`. Variants are cached in `.cache/` (already gitignored). The root lockfile **must resolve `sharp` ≥ 0.35.5** (GHSA-wq5f-xc86-pv6w; same version the user vetted for `tools/seo-images`). The planner adds a test or check that guards this. — **Reversibility:** costly — every image call site uses the shortcode, and sharp becomes part of the root/CI dependency tree.
- **D-02:** **Originals stay in git as pipeline inputs but are no longer shipped.** Move them out of the passthrough-copied `src/assets/` (e.g. into an `src/images/` source folder; the planner names it) so only generated variants reach `_site/`. **Delete `src/assets/hero.jpg`** (the PERF-02 byte-identical duplicate of `hero-bg.jpg`). Keep `patrol.jpg` and `sniper.jpg` as unshipped sources for Phase 4 operation recaps.
- **D-03:** **Hero = one `<img fetchpriority="high">`, no art direction.** Same source image at responsive widths. CSS `object-fit: cover` (+ `object-position`) reproduces today's `background-size: cover` framing. The gradient overlay `linear-gradient(rgba(8,14,17,.35), rgba(8,14,17,.75))` moves to a pseudo-element or overlay element. The hero is **not** lazy-loaded, gets `decoding`/`fetchpriority` and a `<link rel="preload" as="image" imagesrcset=… fetchpriority="high">`. The largest mobile candidate is ≈ 120 KB or less. Mobile crop/art direction is not wanted (it would be a visible change).
- **D-04:** **The lightbox opens a ≤ 1600 px wide AVIF/WebP variant under 300 KB.** It picks the best format the browser supports (e.g. `<picture>`/`srcset` in the lightbox, or format-specific `data-*` attributes read by the module). Thumbnails keep their 600×338 display box with responsive `srcset`, `loading="lazy"` and explicit dimensions.
- **D-05:** **Formats = AVIF + WebP + JPEG fallback**, delivered as `<picture>` with the JPEG as `<img src>`.
- **D-06:** **The Phase 2 SEO images are left alone**: `src/assets/og/og-default-v1.jpg`, `src/assets/icons/*`, `src/favicon.ico`, `src/assets/brand/ibc-logo-512.png`. They stay committed, versioned and checked by the G3 gate. Only the **header logo** (`logo.png`, 4608×4500, displayed at 48 px, so 1x/2x variants) and the content images (hero, gallery) go through eleventy-img.

#### Fonts & icons (PERF-04, PERF-05)
- **D-07:** **Self-host Montserrat only.** It is the only face that renders today: both `--font-hud` and `--font-body` start with `'Montserrat'`. Remove Inter and Share Tech Mono from the stacks and the Google Fonts `@import` (`src/css/style.css:1`) along with the `preconnect` links (`src/_includes/partials/head.njk:22-23`), and use system fallbacks behind Montserrat. This settles the STATE.md "Share Tech Mono has no Polish glyphs" concern for Phase 3. The final HUD/mono face is still Phase 5's UI-SPEC decision.
- **D-08:** **One variable Montserrat woff2**, subset to Latin + Latin Extended-A (all Polish letters), covering the weights in use (400, 500, 700, 800, 900). Phase 5 gets any weight for free.
- **D-09:** The woff2 is **downloaded once, subset and committed**, with its **OFL licence file** next to it. There is no runtime/npm font dependency. Use `@font-face` with `font-display: swap` and `<link rel="preload" as="font" type="font/woff2" crossorigin>` in the head.
- **D-10:** **An automated glyph test** (`node --test`) reads the committed woff2's cmap and asserts coverage of `ą ć ę ł ń ó ś ź ż` and `Ą Ć Ę Ł Ń Ó Ś Ź Ż`. UAT also checks "Zażółć gęślą jaźń" visually.
- **D-11:** **Icons come from one Nunjucks icon shortcode/partial** (e.g. `{% icon "discord" %}`) with the SVG paths stored in one place. The current icons are Discord, YouTube and Facebook, used in `discord-cta.njk`, `footer.njk` (incl. the `site.social` loop by `s.id`), `404.njk` and the `index.njk` terminal button. Icon-only links (footer) expose an accessible name (`aria-label` on the link + `aria-hidden` SVG, or `role="img"` + `<title>`, planner's choice). Icons next to visible text are `aria-hidden="true"`. Note the icon source licence (Simple Icons CC0 or FA Free brands CC BY 4.0). The Font Awesome CDN `<link>` (`head.njk:24`) is removed.

#### CSS/JS build (PERF-06, PERF-07)
- **D-12:** **CSS = partials bundled and minified with Lightning CSS** (one dev dependency), run as part of the Eleventy build. Each page loads exactly **one** stylesheet. Remove every inline `style=` from templates by turning those styles into classes (the ~9 in `src/index.njk`, the terminal button style, etc.).
- **D-13:** **Delete dead CSS**: roster, calendar and any selector with no matching markup or JS-added class (fulfils Phase 1 D-14). Git history keeps it for the v2 `/sklad/` page.
- **D-14:** **JS = unbundled native ES modules.** A tiny `<script type="module">` entry finds `[data-js]` hooks and **dynamically `import()`s only the feature modules present**: menu, lightbox/gallery, recruitment terminal, scroll-spy, easter egg. A page without the gallery/terminal/easter egg never downloads that code and shows no console errors. Each module also guards against a missing hook (PERF-07). The `data-discord-url` terminal contract from Phase 1 is kept.
- **D-15:** **Strict visual parity** using the Phase 1 D-07 method: before/after desktop + mobile screenshots plus the manual checklist (hero, about, gallery lightbox incl. keyboard, recruitment terminal, mobile menu, scroll-spy, footer easter egg, 404). Tiny font-rendering differences from self-hosting are acceptable. No design changes; those belong to Phase 5.

#### Performance budget & gate
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

#### Already locked (from earlier phases, not re-discussed)
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

#### Folded Todos
- **Fix mobile LCP and render-blocking CSS in Phase 3** (`.planning/todos/pending/2026-10-08-fix-mobile-lcp-and-render-blocking-css-in-phase-3.md`). Measured PSI mobile baseline 67, with LCP earning 0/25 because of the unoptimized `hero-bg.jpg` CSS background. FCP and SI are hurt by the render-blocking Google Fonts `@import` and the FA CDN. Order of work: **LCP first (D-03), then fonts/icons (D-07..D-11)**, then re-run PSI against the baseline (D-18). TBT and CLS are already perfect, so no effort goes there. The todo can be closed when Phase 3 verification records the new PSI run.

### Deferred Ideas (OUT OF SCOPE)
- Art-directed mobile hero crop: visible change, so it goes to the Phase 5 visual refresh if wanted.
- Self-hosting a Polish-capable mono/HUD face: Phase 5 UI-SPEC font decision.
- Lighthouse CI on PRs: rejected for now (noisy, heavy). Revisit only if the byte gate proves insufficient.
- Lighthouse ≥ 90 in Accessibility/Best Practices/SEO on every page: PERF-08, Phase 5.
</user_constraints>

## Summary

Phase 3 swaps four render-path costs for build-time artefacts, then locks the result behind a byte-budget gate. The costs are a 4.7 MB PNG hero sitting behind a `.jpg` name and loaded as a CSS background, the Google Fonts `@import`, the full Font Awesome CDN stylesheet, and an unminified single CSS file. Everything needed is either already installed (Eleventy 3.1.6, `HtmlBasePlugin`, Node `zlib` with Brotli) or comes from two new dev dependencies: `@11ty/eleventy-img@7.0.0`, which pulls in `sharp@0.35.5`, and `lightningcss@1.33.0`.

A spike on the real repo files confirmed the numbers. The hero at 1280 w is 81 KB as AVIF (q50), 114 KB as WebP (q60) and 110 KB as JPEG (q65 mozjpeg), so it fits the ≈120 KB budget. Every 1600 w lightbox variant is ≤ 224 KB at q72, comfortably under 300 KB. The logo at 50/100 w is 2–19 KB. The Montserrat variable font subset to Latin + Latin Ext-A is 36.5 KB as woff2 (full 100–900 axis). Current CSS minifies to 21.9 KB, or 4.7 KB gzipped, before dead-code removal. Generating every image cold took about 21 s on this machine, so a **shared content-addressed image cache** is required to keep the test suite (about 25 Eleventy builds) usable.

Five non-obvious traps shape the plan:
1. `HtmlBasePlugin` does **not** rewrite `<link imagesrcset>` or any `data-*` attribute. It only touches `link[href]`, `img[src,srcset]`, `source[src,srcset]` and a few others.
2. Lightning CSS **strips `-webkit-backdrop-filter`** unless `targets` is set, which breaks visual parity on Safari ≤ 17.
3. Lightning CSS does **not rebase `url()`** in imported partials.
4. eleventy-img **drops JPEG output for any source with an alpha channel** (`formatFiltering: ["transparent", …]` by default). Two gallery PNGs have an (opaque) alpha channel, so the D-05 JPEG fallback would silently vanish.
5. IIS (the final host) needs MIME entries for `.avif`/`.webp`/`.woff2` in `web.config`.

**Primary recommendation:** Generate all image variants in **one config-level, memoized `processImages()` step** (lib module) whose output directory is the shared `.cache/img/`. Expose the metadata as global data (`images`) and render it with a **synchronous** `picture` shortcode (`Image.generateHTML`). Copy exactly the used files into `<output>/img/` in `eleventy.after`. Bundle CSS with a Lightning CSS `bundle()` call (explicit `targets`) into one hashed or `?v=` stylesheet. Load JS via `<script type="module">` with a literal `import()` map. Enforce everything in `lib/check-perf.js` and `scripts/check-perf.js`, a sibling of the SEO gate.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERF-01 | Images are served as AVIF/WebP with responsive srcset and explicit dimensions; below-the-fold images lazy-load | Pattern 1 (memoized `processImages` + sync `picture` shortcode); `generateHTML` emits `<picture>`, `<source type>`, `width`/`height` (spike output). `formatFiltering: []` keeps the JPEG fallback (Pitfall 3). Gallery `sizes` string. |
| PERF-02 | Hero is an `<img fetchpriority="high">` of about 120 KB or less on mobile, and the duplicate `hero.jpg` is removed | Hero quality preset (AVIF q50 / WebP q60 / JPEG q65 mozjpeg → 81/114/110 KB at 1280 w, measured). Hero markup pattern (wrapper + `::after` overlay, `object-fit: cover`). Manually prefixed preload `imagesrcset` (Pitfall 1). `hero.jpg` deletion + test updates. |
| PERF-03 | Lightbox loads optimized images under 300 KB, and the logo is resized to its display size | Lightbox 1600 w variants (max 224 KB measured). Lightbox `<picture>` swap pattern with `data-lightbox-*` URLs passed through `htmlBaseUrl`. Logo widths `[50, 100]`, AVIF/WebP/PNG (alpha kept). `.lightbox-content img { width:auto; height:auto }` (Pitfall 6). |
| PERF-04 | Fonts are self-hosted woff2 that include Polish characters; no requests go to Google Fonts | `pyftsubset` recipe (36.5 KB result). `@font-face` + preload. Node-only WOFF2 cmap reader (spike passed, negative control failed as expected). OFL file. Metric-override fallback face. |
| PERF-05 | Font Awesome CDN is replaced by inline SVG icons with accessible names | FA Free 6.0.0 brand SVGs (exact glyph parity, CC BY 4.0 attribution comment kept in the icon data file). `svg-inline--fa` sizing rules. Icon shortcode with aria pattern. |
| PERF-06 | CSS is split into partials and bundled into one minified file; inline styles are removed | Lightning CSS `bundle()` via memoized config step + `11ty.js` template. `targets` required (Pitfall 2). `url()` not rebased (Pitfall 4). Inline-style inventory (11 in `index.njk`, 1 in `footer.njk`, 3 set by JS). Dead-selector inventory. |
| PERF-07 | JS is split into ES modules loaded through `data-js` hooks, and each module does nothing on pages where its feature isn't present | Module entry with a literal loader map, `import()` resolved against `import.meta.url` (prefix-safe). Each module `export function init(el)`. Tests import modules directly with stub globals (no `vm` modules needed). |
</phase_requirements>

## Architectural Responsibility Map

Static site, so the "tiers" are the build-time pipeline, the static output (CDN/host) and the browser.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Image resizing/encoding (AVIF/WebP/JPEG) | Build (Eleventy config + sharp) | — | Output must be plain static files. No image CDN. |
| Responsive image selection (`srcset`/`sizes`/`<picture>`) | Browser | Build (emits markup) | The browser picks the candidate. The build only declares candidates. |
| Hero preload / fetch priority | Build (head markup) | Browser | `<link rel=preload>` must be in the initial HTML. |
| Font hosting + subsetting | Build-time one-off (committed woff2) | Static host (serves `/fonts/`) | D-09: no runtime or npm font dependency. |
| Glyph coverage check | Test (`node --test`) | — | D-10. |
| Icons | Build (Nunjucks shortcode inlines SVG) | — | No runtime icon font or JS. |
| CSS bundling/minification | Build (Lightning CSS) | — | D-12. |
| Feature JS loading | Browser (ES module entry + dynamic `import()`) | Build (emits `data-js` hooks) | D-14. The hooks are the contract between markup and modules. |
| Performance budget | Build gate (post-Eleventy CLI) | Tests | D-16/D-17: deterministic bytes, no Lighthouse CI. |
| MIME types for new formats | Static host config (`web.config` for IIS) | — | IIS answers 404.3 for unmapped extensions. |

## Project Constraints (from CLAUDE.md)

`.claude/CLAUDE.md` describes the pre-Eleventy site. These directives still apply. Directives contradicted by later locked decisions (e.g. "no build step", "no package.json") were superseded in Phases 1–2 and are not repeated here.
- **Static output only**: deployable to any static host. The user deploys it.
- **Light build step OK**, but output must be plain static files.
- **Polish only** (`lang="pl"`). Site URL is a single config value (`SITE_URL`).
- **Naming**: camelCase JS functions with verb-first names (`init*`, `open*`, `close*`), kebab-case CSS classes, `--category-*` custom properties in `:root`, section-header comments `/* --- FEATURE NAME --- */`.
- **No console logging in production code**. Guard clauses with early `return` when DOM is missing (this is exactly the PERF-07 "no-op" contract).
- **Vanilla only**: no framework, no CSS preprocessor (Lightning CSS is a bundler/minifier, not a preprocessor; D-12 locks it).
- **Accessibility attributes** on interactive elements (`aria-label`, `aria-expanded`, `aria-controls`). Images have `alt` + dimensions.
- **GSD workflow enforcement**: edits happen inside `/gsd-execute-phase`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@11ty/eleventy` | 3.1.6 (installed) | SSG, `HtmlBasePlugin`, `addGlobalData`, `eleventy.after` | Already locked. [VERIFIED: node_modules/@11ty/eleventy/package.json "version": "3.1.6"] |
| `@11ty/eleventy-img` | 7.0.0 (latest, published 2026-07-29) | Build-time image variants + `<picture>` markup | Official Eleventy image utility. Requires Node ≥ 22, ESM. Depends on `"sharp": "^0.35.3"`. [VERIFIED: npm registry, `npm view @11ty/eleventy-img`] [CITED: https://www.11ty.dev/docs/plugins/image/: "Image v7.0.0 requires Node 22+ (and is ESM)."] |
| `sharp` | 0.35.5 (transitive; pin with a direct devDependency or `overrides`) | libvips encoder used by eleventy-img | User-vetted version (quick 261008-vmd). Fixes GHSA-wq5f-xc86-pv6w. No install script; ships prebuilt `@img/sharp-*` optional packages. [VERIFIED: npm registry, `npm view sharp@0.35.5 scripts.install` empty; spike `npm ls sharp` → `sharp@0.35.5`] |
| `lightningcss` | 1.33.0 (published 2026-07-20) | `@import` bundling + minify + vendor prefixing | D-12. Single dependency (`detect-libc`) plus a platform binary (`lightningcss-win32-x64-msvc` / `lightningcss-linux-x64-gnu`). [VERIFIED: npm registry; spike install] |

### Supporting (one-off tooling, not a project dependency)
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| fontTools `pyftsubset` (+ `brotli` for woff2) | fonttools 4.66.1, brotli 1.2.0 | Subset `Montserrat[wght].ttf` to Latin + Latin Ext-A woff2 | Once, by hand or via a documented `tools/fonts/README` command. The output is committed (D-09). Run it in a throwaway venv. [VERIFIED: PyPI `pip index versions`; spike produced a 36,460-byte woff2] |
| Montserrat variable TTF + `OFL.txt` | google/fonts `ofl/montserrat/Montserrat[wght].ttf` (wght axis 100–900) | Font source + licence | Download once. The commit includes `OFL.txt` (copyright line: "Copyright 2024 The Montserrat.Git Project Authors"). [VERIFIED: downloaded in spike; fvar axis `('wght', 100.0, 100.0, 900.0)`] |
| `@fortawesome/fontawesome-free` 6.0.0 `svgs/brands/{discord,youtube,facebook}.svg` | 6.0.0 | Exact-parity icon paths (same version as today's CDN) | Copy path data once into the icon data file. Do not install. [VERIFIED: npm pack in spike; viewBoxes `0 0 640 512`, `0 0 576 512`, `0 0 512 512`] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| async `{% image %}` shortcode per call site | Memoized global data + **sync** `picture` shortcode (recommended) | Async Nunjucks shortcodes fail inside `{% for %}` and macros [CITED: 11ty.dev/docs/plugins/image-shortcodes: "Nunjucks macros are not async-friendly"]. The head (preload) and the header partial also need the hero/logo metadata before the page body renders. Global data solves both. |
| eleventy-img HTML Transform plugin | Shortcode (locked by D-01) | Transform is the docs' "Recommended" path, but D-01 locks a shortcode. The transform also cannot feed the preload `imagesrcset` or the lightbox `data-*` URLs. |
| FA 6.0.0 brand SVGs (CC BY 4.0) | Simple Icons (CC0) | Simple Icons glyphs differ visibly from today's FA glyphs, which breaks D-15 strict parity. FA needs its attribution comment kept in source. |
| fontTools `pyftsubset` | `subset-font` npm (harfbuzzjs) | `subset-font` was flagged SUS (too-new release). Python fontTools is Google Fonts' own toolchain. Both are one-off. |
| `?v=<hash>` on `/css/style.css` | content-hashed filename `style.<hash>.css` | `?v=` keeps the path stable, so fewer test edits (`build.test.js`, `links.test.js` read `css/style.css`). `assertResolves` already strips `?…`. Both bust GitHub Pages and IIS caches. |

**Installation:**
```bash
npm install --save-dev --save-exact @11ty/eleventy-img@7.0.0 lightningcss@1.33.0 sharp@0.35.5
# sharp as a direct devDependency makes npm dedupe eleventy-img's "^0.35.3" onto 0.35.5;
# alternatively "overrides": { "sharp": "0.35.5" } in package.json.
```

**Version verification (run 2026-10-10):** `npm view @11ty/eleventy-img version` → 7.0.0. `npm view lightningcss version` → 1.33.0. `npm view sharp version` → 0.35.5 (latest; versions list ends `"0.35.4", "0.35.5-rc.0", "0.35.5-rc.1", "0.35.5"`).

## Package Legitimacy Audit

Run via `gsd-tools query package-legitimacy check` on 2026-10-10.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@11ty/eleventy-img` | npm | 7.0.0 published 2026-07-29 (package since 2019) | 24.7k/wk | github.com/11ty/image | OK | Approved |
| `lightningcss` | npm | 1.33.0 published 2026-07-20 | 177.7M/wk | github.com/parcel-bundler/lightningcss | OK | Approved |
| `sharp` | npm | 0.35.5 published 2026-09-27 | 114.5M/wk | github.com/lovell/sharp | SUS ("too-new") | **Already human-vetted** (quick 261008-vmd bumped `tools/seo-images` to exactly this version). The planner still adds a lightweight `checkpoint:human-verify` to confirm the root install resolves the same 0.35.5. |
| `fonttools` (PyPI, one-off tool) | PyPI | 4.66.1 published 2026-09-29 | n/a (seam returned null) | github.com/fonttools/fonttools | SUS ("too-new") | Flagged. Planner adds `checkpoint:human-verify` before the one-off install (throwaway venv, never a project dependency). |
| `brotli` (PyPI, one-off tool) | PyPI | 1.2.0 published 2025-11-05 | n/a | github.com/google/brotli | SUS (no download data) | Flagged. Same checkpoint as fonttools. |
| `subset-font` | npm | 2.9.0 published 2026-09-20 | 407k/wk | github.com/papandreou/subset-font | SUS ("too-new") | **Not recommended.** fontTools is used instead. |

No package has a `postinstall` script (`npm view <pkg> scripts.postinstall` empty for eleventy-img, lightningcss, subset-font; sharp 0.35.5 has no `install`/`postinstall`).

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `sharp` (pre-vetted by the user; confirm only), `fonttools` + `brotli` (one-off Python tools; checkpoint before install), `subset-font` (not used).

## Architecture Patterns

### System Architecture Diagram

```
                        npm run build  (scripts/clean.js → eleventy → check-seo → check-perf)
                                              │
  src/images/*.{jpg,png} ──► processImages() ─┼─► .cache/img/<hash>-<w>.<fmt>   (shared, content-addressed;
  (unshipped originals)      (lib/images.js,  │        reused by every build and every test process)
                              memoized once   │
                              per build)      ├─► global data `images` (metadata: url/width/height/size per format)
                                              │        │
  src/css/style.css (entry, @imports) ─► bundleCss() (Lightning CSS bundle+minify, targets) ─► {code, hash}
  src/css/partials/*.css                      │        │
                                              ▼        ▼
  templates (.njk) ──► Nunjucks render ──► {% picture %} sync shortcode → <picture><source avif><source webp><img jpeg/png>
                          │                 {% icon %} shortcode → inline <svg>
                          │                 head: preload font + hero (imagesrcset via htmlBaseUrl), 1 stylesheet
                          ▼
                    HtmlBasePlugin (rewrites a/link href, img/source src+srcset, script src ONLY)
                          │
                          ▼
                     <output>/*.html, /css/style.css (11ty.js template), /js/** (passthrough),
                     /fonts/** (passthrough), /assets/{og,icons,brand} (passthrough)
                          │
     eleventy.after ──────┴─► copy the exact set of used .cache/img files → <output>/img/
                          │
                          ▼
              scripts/check-seo.js (G0–G10)  ─► scripts/check-perf.js (P-rules + budget object)
                          │ fail → move <output> to <output>.rejected, exit 1
                          ▼
                     deployable _site/
  Browser: HTML → (preload) hero AVIF + Montserrat woff2 → style.css → <script type="module" src=/js/main.js>
           main.js: querySelectorAll('[data-js]') → import('./modules/<name>.js') only for hooks present → init(el)
```

### Recommended Project Structure
```
src/
├── images/                 # NEW: unshipped originals (hero-bg.jpg, op_patrol.jpg, jo_1967.png, cos.png, funny.png, logo.png, patrol.jpg, sniper.jpg)
├── assets/                 # passthrough, now only og/, icons/, brand/ (Phase 2 SEO images, D-06)
├── fonts/                  # NEW passthrough: montserrat-latin-ext.var.woff2 + OFL.txt
├── css/
│   ├── style.css           # entry: only @import lines (order = today's section order)
│   ├── style.11ty.js       # (or css.11ty.js) permalink /css/style.css, returns the bundled code
│   └── partials/           # fonts.css, variables.css, base.css, overlays.css, typography.css, components.css,
│                           # header.css, hero.css, sections.css, about.css, gallery.css, lightbox.css,
│                           # recruitment.css, footer.css, easter-egg.css, responsive.css
├── js/
│   ├── main.js             # module entry: hook scan + literal import() map
│   └── modules/            # menu.js, lightbox.js, terminal.js, scroll-spy.js, easter-egg.js (each: export function init(el))
├── _data/
│   ├── site.js             # unchanged
│   └── icons.js            # NEW: { discord: { viewBox, path }, youtube: …, facebook: … } + FA CC BY 4.0 attribution comment
└── _includes/…
lib/
├── images.js               # NEW: presets, source list, processImages() (memoized), used-file set
├── css.js                  # NEW: bundleCss() (Lightning CSS, targets constant)
├── woff2.js                # NEW: Node-only WOFF2 → cmap code point Set (used by test + optional gate rule)
└── check-perf.js           # NEW: perf rules + BUDGET object (sibling of check-seo.js)
scripts/
├── check-perf.js           # NEW CLI (copy of check-seo.js structure, shared reject/move helper)
└── warm-images.js          # NEW: runs processImages() once (npm "pretest") so parallel test builds only read the cache
```
Put `src/images/` outside `addPassthroughCopy`, so originals never reach `_site/`. Eleventy ignores non-template files (`.jpg`/`.png` are not template formats) in the input dir. [VERIFIED: eleventy.config.js:17-23 passthrough block `"src/css": "css", "src/js": "js", "src/assets": "assets", … "src/favicon.ico": "favicon.ico"`]

### Pattern 1: One memoized image step → global data → sync `picture` shortcode
**What:** All `Image()` calls happen once per build in a config-level async function. Templates get plain metadata and call a synchronous shortcode built on `Image.generateHTML`.
**Why:** (a) async Nunjucks shortcodes break in `{% for %}`/macros. (b) `head.njk` (preload) and `header.njk` (logo) render in the layout, and need the metadata whatever the body did. (c) One place lists every source image, which makes the "no originals shipped" gate rule and the warm step trivial.
**Example:**
```js
// lib/images.js  (sketch — option names verified in @11ty/eleventy-img 7.0.0 src/global-options.js)
import Image from "@11ty/eleventy-img";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
export const imageCacheDir = join(repoRoot, ".cache", "img");

const photoQuality = { sharpAvifOptions: { quality: 50 }, sharpWebpOptions: { quality: 72 }, sharpJpegOptions: { quality: 72, mozjpeg: true } };
const presets = {
  hero: { widths: [640, 960, 1280, 1920], formats: ["avif", "webp", "jpeg"],
          sharpAvifOptions: { quality: 50 }, sharpWebpOptions: { quality: 60 }, sharpJpegOptions: { quality: 65, mozjpeg: true } },
  thumb: { widths: [400, 600, 900, 1200], formats: ["avif", "webp", "jpeg"], ...photoQuality },
  lightbox: { widths: [1600], formats: ["avif", "webp", "jpeg"], ...photoQuality },
  logo: { widths: [50, 100], formats: ["avif", "webp", "png"] },
};

async function run(src, preset) {
  return Image(join(repoRoot, src), {
    ...presets[preset],
    formatFiltering: [],          // keep JPEG for opaque PNGs that carry an alpha channel (Pitfall 3)
    outputDir: imageCacheDir,     // shared cache, NOT the build output
    urlPath: "/img/",             // root-relative; HtmlBasePlugin adds the pathPrefix in src/srcset
  });
}

let pending = null;
export function processImages() {   // memoized per process
  pending ??= (async () => {
    const hero = await run("src/images/hero-bg.jpg", "hero");
    // ... gallery thumbs + lightbox (same source, same quality ⇒ same hash, different width suffix), logo
    const all = [hero /*, … */];
    const files = new Set(all.flatMap((meta) => Object.values(meta).flat().map((entry) => entry.outputPath)));
    return { images: { hero /*, gallery: [...], logo */ }, files };
  })();
  return pending;
}
```
```js
// eleventy.config.js additions (sketch)
import Image from "@11ty/eleventy-img";
import { cpSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import { processImages } from "./lib/images.js";

eleventyConfig.addGlobalData("images", async () => (await processImages()).images);
eleventyConfig.addShortcode("picture", (metadata, attrs) => Image.generateHTML(metadata, attrs)); // sync
eleventyConfig.on("eleventy.after", async ({ directories }) => {
  const { files } = await processImages();
  const target = join(directories.output, "img");
  mkdirSync(target, { recursive: true });
  for (const file of files) cpSync(file, join(target, basename(file)));
});
```
`eleventy.after` receives `directories`, which respects the tests' `--output=_test/<name>`. [VERIFIED: node_modules/@11ty/eleventy/src/Eleventy.js:1408-1420 `let eventsArg = { directories, inputDir: directories.input, … runMode: this.runMode, outputMode: to, … }` and :1460 `await this.config.events.emit("eleventy.after", eventsArg);`]. `addShortcode` with a non-async function registers a sync universal shortcode. An `async function` is routed to `addAsyncShortcode`. [VERIFIED: node_modules/@11ty/eleventy/src/UserConfig.js:468-472 `addShortcode(name, callback) { // This method *requires* \`async function\` … if (isAsyncFunction(callback)) { this.addAsyncShortcode(name, callback); return; }`]

Spike output of `generateHTML` for the hero (real file, eleventy-img 7.0.0):
```html
<picture><source type="image/avif" srcset="/img/x4RIAUpOEh-640.avif 640w, … /img/x4RIAUpOEh-1920.avif 1920w" sizes="100vw"><source type="image/webp" srcset="…" sizes="100vw"><img src="/img/x4RIAUpOEh-640.jpeg" alt="" fetchpriority="high" decoding="async" width="1920" height="1080" srcset="…" sizes="100vw"></picture>
```
It sets `width`/`height` from the largest output (`htmlOptions.fallback: "largest"` default) and `src` from the smallest JPEG. Without explicit `sizes`, `loading="lazy"` images get `sizes="auto"` automatically. [VERIFIED: src/generate-html.js:111-112 `if(lowsrc.length > 1 && !imgAttributes.sizes && imgAttributes.loading === "lazy") { imgAttributes.sizes = "auto";`]

### Pattern 2: Hero as `<img>` with identical framing
```njk
{# index.njk: replaces <div class="hero-image-bg"></div> #}
<div class="hero-image-bg">
  {% picture images.hero, { alt: "", class: "hero-img", sizes: "100vw", fetchpriority: "high", decoding: "async", loading: "eager" } %}
</div>
```
```css
/* hero.css: the wrapper keeps today's box (absolute, inset 0, z-index -1); the overlay moves to ::after */
.hero-image-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; }
.hero-image-bg picture { display: contents; }
.hero-img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
.hero-image-bg::after { content: ""; position: absolute; inset: 0;
  background: linear-gradient(rgba(8, 14, 17, 0.35), rgba(8, 14, 17, 0.75)); }
```
Today's rule (to reproduce exactly): `background-image: linear-gradient(rgba(8, 14, 17, 0.35), rgba(8, 14, 17, 0.75)), url('../assets/hero-bg.jpg'); background-size: cover; background-position: center; z-index: -1;` [VERIFIED: src/css/style.css:418-428 read this session]. The decorative hero image keeps `alt=""` (it was a CSS background, so it has no accessible name today).

Preload (head, home only). `<link imagesrcset>` is **not** rewritten by HtmlBasePlugin, so each URL goes through `htmlBaseUrl` once:
```njk
{% if images and page.url == "/" %}
<link rel="preload" as="image" type="image/avif" fetchpriority="high" imagesizes="100vw"
      imagesrcset="{% for e in images.hero.avif %}{{ e.url | htmlBaseUrl }} {{ e.width }}w{% if not loop.last %}, {% endif %}{% endfor %}">
{% endif %}
```
Preload **only AVIF** with `type`. A preload does not stop at the first supported type the way `<picture>` does, so several typed preloads would all download. Browsers without AVIF skip the typed preload. [CITED: https://web.dev/articles/preload-responsive-images]. `imagesizes` must equal the `<img sizes>`, or the preload fetches a different candidate (double download).

### Pattern 3: Gallery thumbnail + lightbox `<picture>`
```njk
<div class="gallery-item hud-border" data-js-item role="button" tabindex="0" aria-label="Powiększ zdjęcie: {{ g.title }}"
     data-lightbox-avif="{{ g.lightbox.avif[0].url | htmlBaseUrl }}"
     data-lightbox-webp="{{ g.lightbox.webp[0].url | htmlBaseUrl }}"
     data-lightbox-jpeg="{{ g.lightbox.jpeg[0].url | htmlBaseUrl }}">
  {% picture g.thumb, { alt: g.alt, loading: "lazy", decoding: "async",
       sizes: "auto, (min-width: 1240px) 285px, (min-width: 660px) 50vw, 100vw" } %}
```
The gallery list can live in the `images` global data (title/desc/alt next to the source path), and the four hand-written items become one `{% for %}` loop. That is safe with a sync shortcode.
Lightbox markup:
```html
<picture><source type="image/avif"><source type="image/webp"><img alt="" width="1600" height="900"></picture>
```
On open, the module sets `avifSource.srcset`, `webpSource.srcset`, then `img.src`. Changing a `<source>`'s `srcset` inside `<picture>` re-runs image selection [ASSUMED: HTML spec "relevant mutations"]. Setting `img.src` last guarantees an update either way. The `.lightbox-content img` rule must gain `width: auto; height: auto;` (Pitfall 6). Keep the existing test contract "lightbox img must have no src attribute" (test/layout.test.js).

### Pattern 4: Lightning CSS bundle, memoized, served by an 11ty.js template
```js
// lib/css.js
import { bundle } from "lightningcss";
import { createHash } from "node:crypto";
// Lightning CSS encodes versions as (major << 16) | (minor << 8) | patch.
export const cssTargets = { chrome: 100 << 16, edge: 100 << 16, firefox: 100 << 16, safari: 15 << 16, ios_saf: 15 << 16 };
export function bundleCss(entryPath) {
  const { code } = bundle({ filename: entryPath, minify: true, targets: cssTargets });
  return { code: code.toString(), hash: createHash("sha256").update(code).digest("hex").slice(0, 10) };
}
```
```js
// src/css/style.11ty.js  (permalink /css/style.css; remove "src/css": "css" from addPassthroughCopy)
import { bundleCss } from "../../lib/css.js";
export const data = { permalink: "/css/style.css", eleventyExcludeFromCollections: true };
export function render() { return bundleCss("src/css/style.css").code; }
```
Expose the hash to the head with `eleventyConfig.addGlobalData("cssHash", () => bundleCss(...).hash)` (memoize per build) and `<link rel="stylesheet" href="/css/style.css?v={{ cssHash }}">`. Add `eleventyConfig.addWatchTarget("src/css/")` for `npm run dev`. `.css` is not an Eleventy template format, so partials are not emitted on their own once the passthrough is removed.

Spike results (lightningcss 1.33.0, real repo CSS):
- Without `targets`, all three `-webkit-backdrop-filter` declarations are **removed**. With the targets above they are kept. Output with targets: `-webkit-text-fill-color,-webkit-background-clip,-webkit-backdrop-filter ×3,-webkit-user-select,-webkit-scrollbar…`. [VERIFIED: spike]
- `url("../fonts/m.woff2")` written in `partials/fonts.css` is emitted **unchanged** (no rebasing). Write every `url()` relative to the **output** file `/css/style.css`, e.g. `url("../fonts/montserrat-latin-ext.var.woff2")`. [VERIFIED: spike]
- Today's CSS: 30,244 B raw → 21,873 B minified → **4,710 B gzip** (before dead-code removal). Today's `main.js`: 9,083 B raw / **2,660 B gzip**. [VERIFIED: spike]

### Pattern 5: ES module entry with a literal loader map
```html
<!-- base.njk, replaces <script src="/js/main.js"></script>; HtmlBasePlugin rewrites script[src] -->
<script type="module" src="/js/main.js"></script>
```
```js
// src/js/main.js — module scripts are deferred: the DOM is parsed when this runs (no DOMContentLoaded needed)
const loaders = {
  menu: () => import('./modules/menu.js'),
  lightbox: () => import('./modules/lightbox.js'),
  terminal: () => import('./modules/terminal.js'),
  'scroll-spy': () => import('./modules/scroll-spy.js'),
  'easter-egg': () => import('./modules/easter-egg.js'),
};

export function initFeatures(root, featureLoaders) {
  root.querySelectorAll('[data-js]').forEach((el) => {
    const load = featureLoaders[el.getAttribute('data-js')];
    if (!load) return;
    load().then((mod) => mod.init(el));
  });
}

initFeatures(document, loaders);
```
- Literal relative specifiers resolve against the module's own URL (`/IBC-Website/js/main.js` under the prefix), so there is nothing to prefix. Never build a specifier from attribute text. The map is the allow-list.
- One hook element per feature: `menu` on `.menu-toggle`, `lightbox` on `.gallery-grid`, `terminal` on `#terminal-console` (keeps `data-discord-url`), `scroll-spy` on `<nav>`, `easter-egg` on `#easteregg-trigger`. Menu, scroll-spy and easter-egg hooks live in shared partials, so they load on every page. That is fine: scroll-spy already no-ops off the home page by its same-pathname filter. The gallery and terminal modules are never fetched on 404/dev pages.
- Each module keeps its guard clauses (`if (!lightbox) return;`). D-14 asks for both the hook gate and the in-module guard.
- **Testing without `vm` modules:** `package.json` has `"type": "module"`, so `node --test` can `await import("../src/js/modules/terminal.js")` after setting `globalThis.document`/`IntersectionObserver` stubs and call `init(stubEl)` directly. `initFeatures` is exported, so a test can pass a stub root plus spy loaders and assert that only present hooks load. `vm.SourceTextModule` (needs `--experimental-vm-modules`) is not needed.
- The current `test/client.test.js` test "main.js is a valid classic script (node --check)" must change. Run `node --check` per module file (it parses ESM by the package `type`).

### Pattern 6: Self-hosted font
```css
/* partials/fonts.css — url() is relative to the OUTPUT /css/style.css */
@font-face {
  font-family: "Montserrat";
  src: url("../fonts/montserrat-latin-ext.var.woff2") format("woff2");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0100-017F, U+2000-206F, U+20AC, U+2122, U+2190-2193, U+2212;
}
/* Optional metric-matched fallback to limit swap shift (values computed from the wght=400 instance vs Arial) */
@font-face {
  font-family: "Montserrat Fallback";
  src: local("Arial");
  size-adjust: 110.38%; ascent-override: 87.70%; descent-override: 22.74%; line-gap-override: 0%;
}
:root {
  --font-hud: 'Montserrat', 'Montserrat Fallback', monospace;      /* D-07: Share Tech Mono removed */
  --font-body: 'Montserrat', 'Montserrat Fallback', sans-serif;    /* D-07: Inter removed */
}
```
```njk
{# head.njk — href is rewritten by HtmlBasePlugin; crossorigin is REQUIRED for font preloads #}
<link rel="preload" href="/fonts/montserrat-latin-ext.var.woff2" as="font" type="font/woff2" crossorigin>
```
Today's stacks: `--font-hud: 'Montserrat', 'Share Tech Mono', monospace;` and `--font-body: 'Montserrat', 'Inter', sans-serif;` [VERIFIED: src/css/style.css:25-26]. Weights in CSS today: `500`, `800`, `900`, `bold` ×6, plus default heading bold. One `font-style: italic` is synthesized today (no italic face was loaded) and stays synthesized. Do not add an italic file. Subset command (spike, 36,460 B):
```bash
pyftsubset Montserrat[wght].ttf \
  --unicodes="U+0000-00FF,U+0100-017F,U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212" \
  --layout-features='kern,liga,calt,ccmp,locl,mark,mkmk' \
  --flavor=woff2 --output-file=montserrat-latin-ext.var.woff2
```
(`--layout-features='*'` gives 64,712 B. The listed features cover kerning and Polish diacritic composition.) The variable axis stays `wght` 100–900, so Phase 5 can use any weight (D-08).

### Pattern 7: Icon shortcode (FA 6.0.0 paths, parity sizing)
```js
// eleventy.config.js
import icons from "./src/_data/icons.js";
eleventyConfig.addShortcode("icon", (name, label) => {
  const icon = icons[name];
  if (!icon) throw new Error(`Unknown icon "${name}"`);           // fail the build, never emit empty markup
  const a11y = label ? `role="img" aria-label="${label}"` : `aria-hidden="true" focusable="false"`;
  return `<svg class="icon icon-${name}" ${a11y} viewBox="${icon.viewBox}" fill="currentColor"><path d="${icon.path}"/></svg>`;
});
```
```css
/* reproduces FA's .svg-inline--fa sizing so the glyphs sit where the webfont glyphs sat */
.icon { display: inline-block; height: 1em; overflow: visible; vertical-align: -0.125em; }
```
FA's own rule: `.svg-inline--fa { display: var(--fa-display, inline-block); height: 1em; overflow: visible; vertical-align: -.125em; }` [VERIFIED: @fortawesome/fontawesome-free 6.0.0 css/svg-with-js.css:18-22]. Recommended a11y split: footer icon-only links keep their existing `aria-label` on the `<a>` and call `{% icon s.id %}` (aria-hidden). Icons next to text (`header CTA`, `404`, terminal button) are also aria-hidden. The `<i class="fab fa-{{ s.id }}">` loop maps directly to `{% icon s.id %}`, since `site.social` ids are `"youtube"`/`"facebook"` [VERIFIED: src/_data/site.js:93-96 `{ id: "youtube", label: "YouTube", url: "https://www.youtube.com/@IBC_A3" },` / `{ id: "facebook", label: "Facebook", url: "https://www.facebook.com/IBCA3" },`]. Keep the FA attribution comment (`Font Awesome Free 6.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0 …) Copyright 2022 Fonticons, Inc.`) in `src/_data/icons.js`. The terminal button's inline `style="font-size: 1.3rem;"` on the `<i>` becomes a class on the SVG.

### Pattern 8: Perf gate sibling
`lib/check-perf.js` exports `checkPerf(outDir, site, budget = BUDGET)` → `string[]` problems formatted `<relPath>: P<n> <text>`, sorted (same convention as G-rules). `scripts/check-perf.js` is a copy of `scripts/check-seo.js` (banner, `--dir`, reject-move). Extract `removeRejectedOutput` into `lib/` so both CLIs share it. Chain with `&&` in `package.json` `build`, so check-perf only runs when check-seo passed and found an intact `_site/`. Use `zlib.gzipSync` for gz sizes and `lib/image-size.js`/`fs.statSync` for bytes. The hero "mobile candidate" is defined deterministically as **every hero `srcset` candidate with width ≤ 1280, in every format** (1280 covers a 390–428 CSS-px phone at DPR 3 = 1170–1284 device px, and PSI's emulated Moto G at 412×1.75 = 721).

### Anti-Patterns to Avoid
- **Writing eleventy-img output straight into `_site/img/`** (the default `outputDir`): the build cleans `_site/` and every test uses a fresh `_test/<name>/`, so each of about 25 builds would re-encode about 70 files (around 21 s each on this machine).
- **Async `{% image %}` shortcode inside the gallery `{% for %}`** or a macro (Nunjucks async limitations).
- **Pre-prefixing URLs that HtmlBasePlugin will also prefix**: `htmlBaseUrl` on an `img src` produces `/IBC-Website/IBC-Website/…`. Apply `htmlBaseUrl` only to attributes the plugin ignores (`imagesrcset`, `data-*`).
- **`passthroughCopy(".cache/img")`**: it would ship every stale variant ever generated, and on a cold cache it can race the image generation.
- **Computed `import()` specifiers** from `data-js` text: path injection and unbundler-hostile. Use the literal map.
- **Keeping JS-set inline styles that gate state** (`lightbox.style.display === 'flex'`): move open/closed state to a class (`.is-open`) where it is a 1:1 swap. Easter egg `innerHTML` with inline `style` becomes `textContent` + a modifier class (STATE.md concern). This is not required by the "no `style=` in built HTML" rule, but it is free while the modules are being split.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Resizing/encoding AVIF/WebP/JPEG + srcset markup | sharp scripts + string-built `<picture>` | `@11ty/eleventy-img` (`Image()` + `Image.generateHTML`) | Content hashing, disk cache, `sizes` validation, width/height from the largest output, `<source type>` ordering |
| CSS `@import` inlining, minify, vendor prefixes | regex concatenation / custom minifier | `lightningcss` `bundle()` with `targets` | Correct cascade order, `@media`/`layer` imports, prefix insertion/removal by target |
| Font subsetting / woff2 encoding | — | fontTools `pyftsubset --flavor=woff2` | Keeps GSUB/GPOS/gvar for the variable axis |
| Gzip size for budgets | external tool | `node:zlib` `gzipSync` | Built-in, deterministic |
| WOFF2 table decompression | a font library | `node:zlib` `brotliDecompressSync` + ~80-line table-directory/cmap reader (`lib/woff2.js`) | Built-ins only, matching the `lib/image-size.js` precedent. Spike verified (below). |
| Path-prefix handling | string concatenation with `site.pathPrefix` | `HtmlBasePlugin` for `href`/`src`/`srcset`; `htmlBaseUrl` filter for everything else | One mechanism, already tested in both variants |
| Icon font | — | Inline SVG via shortcode | No request, no FOUT, accessible-name control |

**Key insight:** The only custom code this phase needs is glue (memoization, copy-used-files, the gate rules, the cmap reader). Every transformation is done by a vetted library or a Node built-in.

## Runtime State Inventory

This phase moves and renames files, so this section is included.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None. No database. The `.cache/img/` content-addressed cache is new and is created by the build. | none |
| Live service config | **GitHub Pages** serves whatever the last deploy uploaded. Old `/assets/hero-bg.jpg`, `/css/style.css` (unhashed) and FA CDN links stay cached in visitors' browsers until revalidation (GitHub Pages `max-age=600` [ASSUMED]). Discord/Facebook link previews use `og-default-v1.jpg`, which is unchanged (D-06). | none. `?v=` busting covers CSS |
| OS-registered state | **IIS (final host, local cutover)**: no `.avif`/`.webp`/`.woff2` MIME mapping in `src/web.config.njk` today. Only `.webmanifest` is mapped: `<remove fileExtension=".webmanifest" />` / `<mimeMap fileExtension=".webmanifest" mimeType="application/manifest+json" />` [VERIFIED: src/web.config.njk:16-19] | **code edit**: add `remove`+`mimeMap` pairs for `.avif` (`image/avif`), `.webp` (`image/webp`), `.woff2` (`font/woff2`). Extend the `seo-files`/`web.config` test. |
| Secrets/env vars | None. No new env var. `SITE_URL`/`PATH_PREFIX` keep working because all new URLs go through HtmlBasePlugin/`htmlBaseUrl`. | none |
| Build artifacts / installed packages | (1) `tools/seo-images/make-seo-images.js:22-23` reads `src/assets/logo.png` and `src/assets/hero-bg.jpg`. These paths break when the originals move to `src/images/`. (2) `src/_dev/og-override.njk` front matter `ogImage: "/assets/hero-bg.jpg"` with `ogImageWidth: 1920`, `ogImageHeight: 1080`. The file stops being shipped. (3) `package-lock.json` must gain the `@img/sharp-*` and `lightningcss-*` platform entries. (4) Stale `_site.rejected/` is not cleaned by `scripts/clean.js` (STATE.md advisory). | (1) code edit of the tool's input paths (no image regeneration, D-06). (2) Re-point the dev override to a still-shipped image, e.g. `/assets/brand/ibc-logo-512.png` with 512×512, and update `test/seo.test.js` (l), which reads `assets/hero-bg.jpg`. (3) `npm install` on Windows writes all optional platform entries. Verify with a test (Pitfall 8). (4) optional: clean.js also removes `_site.rejected/`. |

**Tests that pin today's asset layout** (must be updated in the same plan that moves the files): `test/build.test.js:12-22` `assetFiles` list (`"cos.png", "funny.png", "hero-bg.jpg", "hero.jpg", "jo_1967.png", "logo.png", "op_patrol.jpg", "patrol.jpg", "sniper.jpg"`) and its `existsSync(join(out, "assets", name))` loop. `test/layout.test.js:114-120` (logo `assets/logo.png` and gallery `src`/`data-src` under the prefix). `test/seo.test.js:302-309` (`hero-bg.jpg` OG override). `test/client.test.js` (classic-script vm harness, `node --check`). `test/devpages.test.js:72` and `test/build.test.js:49,56` (`src="/js/main.js"` stays valid if the entry keeps that path). `test/links.test.js:14-17` allow-list still contains `fonts.googleapis.com`, `fonts.gstatic.com` and `cdnjs.cloudflare.com`. Remove them, so a reintroduced CDN URL fails. Its `urlValues()` reads `href`/`src`/`data-src`/`srcset` only. Add `imagesrcset` and `data-lightbox-*`, so those URLs are resolver-checked in both variants.

## Common Pitfalls

### Pitfall 1: Preload `imagesrcset` and lightbox `data-*` URLs miss the path prefix
**What goes wrong:** Under `/IBC-Website/` the hero preload and lightbox images 404 while the page images work.
**Why it happens:** HtmlBasePlugin only rewrites a fixed attribute list. [VERIFIED: node_modules/@11ty/posthtml-urls/lib/defaultOptions.js:22,25,29-30 `img: { src: true, srcset: true },` `link: { href: true },` `script: { src: true },` `source: { src: true, srcset: true },`]
**How to avoid:** Pass these URLs through `| htmlBaseUrl` (as `data-src` does today). Never apply it to `img`/`source` attributes (double prefix: the `url` filter joins `pathPrefix` + any root-relative URL).
**Warning signs:** `links.test.js` variant "prefix" passes while the browser 404s. That is why the resolver must also read `imagesrcset`/`data-lightbox-*`.

### Pitfall 2: Lightning CSS without `targets` silently drops Safari prefixes
**What goes wrong:** Header, card and lightbox blur disappear on iOS/Safari ≤ 17.
**Why it happens:** With no targets, Lightning CSS treats prefixes as removable. [VERIFIED: spike on src/css/style.css]
**How to avoid:** Pass explicit `targets` (Pattern 4). Add a test: the bundled CSS contains `-webkit-backdrop-filter`.

### Pitfall 3: eleventy-img drops the JPEG fallback for PNGs with an alpha channel
**What goes wrong:** `jo_1967.png` and `cos.png` (alpha channel present, fully opaque: sharp `stats().isOpaque === true`) get no JPEG, so `<img src>` falls back to WebP/AVIF. That breaks D-05 and very old browsers.
**Why it happens:** Default `formatFiltering: ["transparent", "animated"]` filters formats to transparency-capable ones when `metadata.hasAlpha`. [VERIFIED: @11ty/eleventy-img 7.0.0 src/global-options.js:12 `formatFiltering: ["transparent", "animated"],`; src/image.js:545 `let hasAlpha = metadata.hasAlpha && Array.isArray(this.options.formatFiltering) && this.options.formatFiltering.includes("transparent");`]
**How to avoid:** `formatFiltering: []` for photo presets. Logo uses `["avif","webp","png"]` (real transparency).

### Pitfall 4: `url()` in partials is not rebased
**What goes wrong:** The font 404s after bundling, or works only by accident.
**How to avoid:** Write `url()` relative to `/css/style.css`. `test/links.test.js` (b) already resolves every bundled `url()` from `css/` in both variants. After the hero leaves CSS, the font `url()` is the one that keeps that test's "≥ 1 url()" assertion meaningful.

### Pitfall 5: Parallel test builds racing on the shared image cache (Windows EBUSY / partial files)
**What goes wrong:** `node --test "test/*.test.js"` runs files in parallel processes. Two cold processes write the same `.cache/img/<hash>-<w>.avif`. One can copy a half-written file, or Windows can throw EBUSY/EPERM.
**How to avoid:** `"pretest": "node scripts/warm-images.js"`. npm runs it automatically before `npm test`, including in CI. It calls the same `processImages()`, so every later build only reads. eleventy-img skips files that already exist (disk cache keyed by content + sharp options hash). [VERIFIED: src/image.js:668-683 `isOutputCached(targetFile, sourceInput) { … if(!diskCache.isCached(targetFile, …)) { return false; } return true; }` and src/disk-cache.js:38 `if(this.#existsCache?.exists(targetFile)) {`]. A developer running a single `node --test test/x.test.js` builds sequentially within that file, so there is no race.
**Warning signs:** Flaky image-size assertions, or `EBUSY` only on the first run after changing a preset.

### Pitfall 6: `width`/`height` attributes distort the lightbox box
**What goes wrong:** Adding `width="1600" height="900"` (required by the gate) makes `.lightbox-content img` (`max-width: 100%; max-height: 80vh; object-fit: contain`) keep a 900 px presentational height capped to 80vh. The bordered frame changes shape on short viewports.
**How to avoid:** Add `width: auto; height: auto;` to `.lightbox-content img`. The attributes then only supply the aspect ratio. Logo (`height: 48px; width: auto`), gallery thumbs and hero (`100%/100%`) are already safe.

### Pitfall 7: Logo variant height rounding
`logo.png` is 4608×4500. eleventy-img computes height by flooring, so width 49 → 49×47. Widths **50/100** → 50×48 / 100×97 (spike: 49→`49x47`, 98→`98x95`). CSS keeps `height: 48px; width: auto` [VERIFIED: src/css/style.css:267-271 `.logo-img {` `height: 48px;` `width: auto;` `display: block;`], so the rendered size is unchanged. Use `sizes="50px"`. Spike sizes: AVIF 2.2/5.8 KB, PNG 6.0/18.6 KB.

### Pitfall 8: Lockfile missing Linux binaries → `npm ci` breaks in CI
**What goes wrong:** The lockfile is created on Windows. CI (ubuntu) `npm ci` needs `@img/sharp-linux-x64` (+ `@img/sharp-libvips-linux-x64`) and `lightningcss-linux-x64-gnu`.
**How to avoid:** A dependency test asserts `package-lock.json` `packages["node_modules/sharp"].version` ≥ 0.35.5, no nested `node_modules/@11ty/eleventy-img/node_modules/sharp`, and presence of `node_modules/@img/sharp-linux-x64` and `node_modules/lightningcss-linux-x64-gnu` keys. Do **not** read `require("sharp/package.json")`: sharp's `exports` blocks it (`ERR_PACKAGE_PATH_NOT_EXPORTED`, seen in the spike). Read the lockfile JSON or `node_modules/sharp/package.json` with `readFileSync`.

### Pitfall 9: Hero framing / sharpness on phones
**What goes wrong:** `sizes="100vw"` picks by viewport **width**, but the hero is `min-height: 100vh` with `cover`. On a portrait phone the image is displayed about 1,500 CSS px wide (844 px tall × 16/9) and cropped. Today it decodes the 1920 px original. The 1280 candidate is softer than today on 3× phones.
**How to avoid:** Accept it (D-03 locks ≤ 120 KB and no art direction), and add the hero to the D-15 parity checklist explicitly ("hero softness on a 3× phone acceptable under the dark gradient"). Do not raise `sizes` to chase sharpness: that breaks the budget (1600 w WebP q60 = 168.7 KB).

### Pitfall 10: Gate rule "non-hero images lazy" vs the header logo
The logo is above the fold on every page. `loading="lazy"` on it delays it slightly and Lighthouse may flag it. Define the rule as: every `<img>` has an explicit `loading`; `loading="eager"` (or none) is allowed only for the hero (`fetchpriority="high"`) and `.logo-img`. Everything else must be `lazy`.

### Pitfall 11: G10 scans the new text outputs
`lib/check-seo.js:218` `const textExts = [".html", ".xml", ".txt", ".webmanifest", ".config", ".css", ".js", ".json"];` are scanned for TODO tokens on indexable builds. The new JS modules, the CSS bundle and `fonts/OFL.txt` are scanned. Keep "TODO" out of shipped comments. The OFL text contains none.

## Code Examples

### WOFF2 cmap reader (Node built-ins only), verified on the real subset
```js
// lib/woff2.js — condensed from the passing spike. Table-directory parsing per the WOFF2 spec:
// flags byte (tag index in bits 0-5, transform version in bits 6-7), UIntBase128 lengths,
// transformLength present for glyf/loca when version 0 and for other tables when version != 0.
import { brotliDecompressSync } from "node:zlib";
const knownTags = ["cmap","head","hhea","hmtx","maxp","name","OS/2","post","cvt ","fpgm","glyf","loca","prep","CFF ","VORG","EBDT","EBLC","gasp","hdmx","kern","LTSH","PCLT","VDMX","vhea","vmtx","BASE","GDEF","GPOS","GSUB","EBSC","JSTF","MATH","CBDT","CBLC","COLR","CPAL","SVG ","sbix","acnt","avar","bdat","bloc","bsln","cvar","fdsc","feat","fmtx","fvar","gvar","hsty","just","lcar","mort","morx","opbd","prop","trak","Zapf","Silf","Glat","Gloc","Feat","Sill"];
function readBase128(buf, pos) { let v = 0; for (let i = 0; i < 5; i++) { const b = buf[pos.offset++]; v = v * 128 + (b & 0x7f); if (!(b & 0x80)) return v; } throw new Error("bad UIntBase128"); }
export function woff2CodePoints(buf) {
  if (buf.toString("latin1", 0, 4) !== "wOF2") throw new Error("not a WOFF2 file");
  const numTables = buf.readUInt16BE(12), compressed = buf.readUInt32BE(20), pos = { offset: 48 }, tables = [];
  for (let i = 0; i < numTables; i++) {
    const flags = buf[pos.offset++], idx = flags & 0x3f, version = flags >> 6;
    const tag = idx === 63 ? buf.toString("latin1", pos.offset, (pos.offset += 4)) : knownTags[idx];
    const orig = readBase128(buf, pos);
    const transformed = tag === "glyf" || tag === "loca" ? version === 0 : version !== 0;
    tables.push({ tag, length: transformed ? readBase128(buf, pos) : orig });
  }
  const data = brotliDecompressSync(buf.subarray(pos.offset, pos.offset + compressed));
  let off = 0, cmap = null;
  for (const t of tables) { if (t.tag === "cmap") cmap = data.subarray(off, off + t.length); off += t.length; }
  return parseCmap(cmap); // format 4 + format 12 subtables of platform 0 / (3,1) / (3,10); gid 0 = not covered
}
```
Spike result: the committed-candidate subset → `codepoints 354 missing: none` for `ąćęłńóśźżĄĆĘŁŃÓŚŹŻ`. The ASCII-only control subset → `missing: ąćęłńóśźżĄĆĘŁŃÓŚŹŻ`. The reader therefore really distinguishes the cases (negative control). The full `parseCmap` (format 4 with `idRangeOffset`, format 12 groups) is in the spike file and about 35 lines. The test also asserts `woff2CodePoints` throws on a non-WOFF2 buffer.

### Inline-style inventory (D-12): convert each into a class
`src/index.njk` (11): `:34`, `:37` `h3` accent 1.3rem (+ margin-top 15px); `:52`, `:60` stat-card `h3` `font-size: 1.8rem`; `:151` recruitment-instructions box (padding 30px, flex column, space-between); `:153` hud-badge margin/inline-block; `:154` h3 accent/1.3rem/margin/`--font-hud`; `:155` paragraph (margin, 0.95rem, 1.6 line-height, `--text-primary`, opacity .9); `:157` req-list margin-bottom 25px; `:164` full-width Discord button; `:165` `<i>` 1.3rem. `src/_includes/partials/footer.njk` (1): `#easteregg-trigger` `cursor: pointer; opacity: 0.3; margin-left: 10px;`. JS-set (not in HTML, convert opportunistically): `body.style.overflow`, `lightbox.style.display`, `overlay.style.display`, terminal `tagSpan.style.color`, easter-egg `innerHTML` with `style="color: #ef4444"`. [Grep count this session: `src/index.njk:11`, `footer.njk:1`, all other templates 0]

### Dead-selector inventory (D-13), audit result to confirm per selector
Class selectors in `style.css` with no match in any template or `main.js` (classes main.js adds: `active`, `open`, `active-nav`, `terminal-line`, `time`, `tag`, `message`): `roster*`, `member-*`, `val`, `calendar*`, `day-number`, `day-events`, `today`, `empty`, `training`, `status-panel`, `status-header`, `status-title`, `status-indicator`, `status-dot`, `status-grid`, `status-item`, `value`, `countdown-box`, `timer*`, `recruitment-form`, `form-group`, `form-control`, `error-message`, `green`, `danger`. (`hud-border`, `amber` and `header-cta` **are** used.) The executor re-runs the audit after the split and checks compound selectors (`.hud-badge.green`) by hand before deleting.

### Recommended budget object (D-17), to be finalised from post-Phase-3 measurements
```js
// lib/check-perf.js — raising any number is a deliberate, reviewed edit (Phase 4/5 contract)
export const BUDGET = {
  heroCandidateMaxWidth: 1280,          // "mobile candidates" = hero srcset entries with w <= this
  heroMobileMaxBytes: 120 * 1024,       // every format (measured: 81 / 114 / 110 KB)
  lightboxMaxBytes: 300 * 1024 - 1,     // "< 300 KB" (measured max 224 KB)
  cssGzipMaxBytes: 6 * 1024,            // measured 4.7 KB gz before dead-CSS removal
  initialJsGzipMaxBytes: 5 * 1024,      // entry + modules for the hooks present on that page; today 2.7 KB gz total
  fontMaxBytes: 45 * 1024,              // measured 36.5 KB
  fontFilesMax: 1,
  shippedImageMaxBytes: 160 * 1024,     // largest legitimately shipped image today: assets/brand/ibc-logo-512.png 154,476 B
};
```
"Initial JS" is computed per page: `js/main.js` + `js/modules/<hook>.js` for every `data-js="<hook>"` in that HTML file. Name modules after their hook, so the gate needs no map. "No shipped originals": fail on any output file whose basename equals a file in `src/images/`, and on any image over `shippedImageMaxBytes`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| eleventy-img `useCacheValidityInHash`, `ImageSize` re-export | Removed in v6/v7; read dimensions from the returned metadata | v6.0.0 / v7.0.0 | Don't copy older blog snippets |
| `Image.generateHTML(metadata, attrs)` only | `returnType: "html"` + `htmlOptions` | v6.0 | Either works; `generateHTML` suits the sync shortcode |
| eleventy-img Node ≥ 18 | Node ≥ 22, ESM only | v7.0.0 | Repo `engines` `>=22.19` and CI Node 24 satisfy it |
| `failOnError` sharp option | sharp 0.35 `failOn` (default `"warning"`) | sharp 0.35 / eleventy-img 7 | A corrupt source fails the build (desired) |
| Hero as CSS `background-image` | `<img fetchpriority="high">` + typed preload | — | LCP discoverable by the preload scanner |
| Icon fonts | Inline SVG | — | No render-blocking CSS, no FOIT, accessible names |

**Deprecated/outdated:** Google Fonts `@import` inside CSS (it serialises the font CSS behind the stylesheet), and `preconnect` to font hosts the site no longer uses.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Mutating a `<source srcset>` inside `<picture>` re-runs selection (HTML "relevant mutations"); setting `img.src` last also forces it | Pattern 3 | Lightbox shows the previous image in one format. Mitigated by setting `img.src` last. Verify in UAT. |
| A2 | GitHub Pages serves assets with `Cache-Control: max-age=600` | Runtime State | Only affects how long old CSS lingers. `?v=` makes it moot. |
| A3 | IIS default MIME map lacks `.avif` (and possibly `.webp`). A West Wind post says IIS 10 maps `.woff2`. | Runtime State / Security | 404.3 on the final host. `remove`+`mimeMap` pairs are harmless either way, so add all three. |
| A4 | Fallback-face metric overrides (size-adjust 110.38 %, ascent 87.70 %, descent 22.74 %) are good enough; computed from a letter sample at wght 400 vs Arial, not with fontaine/capsize | Pattern 6 | Slight swap shift. CLS is already 25/25 and this is optional (discretion). Drop the fallback face if the parity screenshots differ. |
| A5 | Chrome picks the 1280 w candidate for a 390 px DPR-3 phone with `sizes="100vw"` (1170 device px) | Pitfall 9 / budget | A 428 px DPR-3 phone (1284 px) may pick 1920 (179–293 KB). The gate defines "mobile" as ≤ 1280 w deterministically. PSI's Moto G emulation (721 px) picks 960. |
| A6 | `sizes="auto, …"` fallback list is honoured (Chrome) and ignored gracefully elsewhere | Pattern 3 | Slightly larger thumbnail download. No visual change. |
| A7 | Python `fonttools`/`brotli` installs are acceptable as a one-off in a throwaway venv (seam flagged both SUS for missing download data) | Standard Stack | Needs a human checkpoint before install. The committed woff2 is the only artefact. |

## Open Questions (RESOLVED)

1. **Cold image generation time in CI.** RESOLVED: no `.cache` caching in CI.
   - What we know: about 21 s locally for every variant (hero 3.7 s, gallery 16 s, logo 1.1 s), once per `npm test` (pretest warm) and reused by `npm run build` in the same job.
   - What's unclear: ubuntu runner timing.
   - Recommendation: no `.cache` caching in CI at first (deterministic, one less moving part). Add `actions/cache` keyed on `hashFiles('src/images/**', 'lib/images.js', 'package-lock.json')` only if the job exceeds a few minutes.
   - Decision: adopted as recommended. 03-01 Task 2 adds `scripts/warm-images.js` as the npm `pretest` step, so CI encodes every variant once per job and `npm run build` reuses the warm cache; `.github/workflows/pages.yml` gets no cache step (03-01 flagged assumption). 03-11 Task 1 keeps the workflow contract (`npm ci`, `npm test`, `npm run build`) under test.
2. **Should OFL.txt be shipped in `_site/fonts/` or only committed?** RESOLVED: shipped next to the woff2.
   - Recommendation: ship it next to the woff2. It is 4.4 KB, OFL wants the licence to accompany redistributed font files, and the G10 scan is clean.
   - Decision: adopted as recommended. 03-02 Task 2 commits `src/fonts/OFL.txt` beside the font and tests it; 03-05 Task 1 passthrough-copies `src/fonts` to `fonts/`, and 03-05 Task 2 tests that `fonts/OFL.txt` ships byte-identical in the root and `/IBC-Website/` builds.
3. **Easter-egg module eager vs on-interaction import.** RESOLVED: eager import through its `data-js` hook.
   - Recommendation: eager via its hook (it is on every page through the footer, and small). Lazy-on-click is a later optimisation.
   - Decision: adopted as recommended. 03-09 Task 2 puts `data-js="easter-egg"` on the footer `#easteregg-trigger` and adds `easter-egg` to the literal loader map, so the module loads on every page through its hook; its gzip size counts toward the initial-JS cap that 03-11 sets.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Eleventy, eleventy-img (≥ 22), tests | ✓ (local) | v26.7.0 local; CI uses `.nvmrc` = `24` | — |
| npm | install | ✓ | 11.19.0 | — |
| sharp prebuilt binaries | eleventy-img | ✓ (win32-x64 installed in spike; linux-x64 via lockfile in CI) | 0.35.5 | — |
| lightningcss binary | CSS bundle | ✓ (`lightningcss-win32-x64-msvc` installed in spike) | 1.33.0 | — |
| Python | one-off font subsetting | ✓ | 3.14.7 | `subset-font` npm (SUS, not recommended) |
| fontTools + brotli | one-off font subsetting | ✗ (not installed globally; installed in a scratchpad venv for the spike) | 4.66.1 / 1.2.0 | Checkpoint, then `python -m venv` + `pip install fonttools brotli` |
| curl | one-off font download | ✓ | (Git Bash) | Browser download |
| Chrome (PSI is web-based) | D-18 verification | manual | — | PageSpeed Insights website |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** fontTools/brotli (one-off, behind a human checkpoint).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node built-in `node:test` + `node:assert/strict` (Node 24 in CI) |
| Config file | none. `package.json` `"test": "node --test \"test/*.test.js\""`; add `"pretest": "node scripts/warm-images.js"` |
| Quick run command | `node --test test/<file>.test.js` |
| Full suite command | `npm test && SITE_URL=https://guard.example npm run build` (Git Bash; prefix builds need `MSYS_NO_PATHCONV=1`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERF-01 | Every content `<img>` sits in a `<picture>` with `image/avif` + `image/webp` `<source>`s and a JPEG `<img src>`. Every `<img>` has `width`+`height`. Non-hero, non-logo imgs have `loading="lazy"`. srcset URLs resolve in root and `/IBC-Website/` builds. | build-output | `node --test test/images.test.js` | ❌ Wave 0 |
| PERF-01 | Resolver reads `imagesrcset` and `data-lightbox-*`. Google Fonts/cdnjs removed from the allow-list. | build-output | `node --test test/links.test.js` | ✅ (extend) |
| PERF-02 | Hero `<img>` has `fetchpriority="high"`, is not lazy, has a matching `<link rel=preload as=image type=image/avif imagesrcset imagesizes fetchpriority=high>` whose URLs carry the prefix. Every hero candidate ≤ 1280 w is ≤ 120 KB in each format. `hero.jpg` is absent from `src/` and the output. | build-output + gate unit | `node --test test/images.test.js test/perf-gate.test.js` | ❌ Wave 0 |
| PERF-03 | Every `data-lightbox-*` target exists, is ≤ 1600 w and < 300 KB. Logo variants are ≤ 100 w and `<img>` declares 50×48. No source basename from `src/images/` exists in the output. | build-output | `node --test test/images.test.js` | ❌ Wave 0 |
| PERF-04 | Committed woff2 covers `ąćęłńóśźżĄĆĘŁŃÓŚŹŻ` (cmap) and rejects an ASCII fixture. `OFL.txt` sits next to it. Output has no `fonts.googleapis.com`/`fonts.gstatic.com`. Head has one font preload with `crossorigin`. The CSS `url()` resolves (links (b)). | unit + build-output | `node --test test/fonts.test.js test/links.test.js` | ❌ Wave 0 |
| PERF-05 | No `fa-`/`fab` classes or cdnjs in the output. Every `<svg class="icon">` is `aria-hidden="true"` or `role="img"` with a name. Footer icon links keep `aria-label`. An unknown icon name fails the build. | build-output + unit | `node --test test/icons.test.js` | ❌ Wave 0 |
| PERF-06 | Exactly one `<link rel="stylesheet">` per HTML page. Zero `style=` in any output HTML. The bundle is minified (no comments, single line), keeps `-webkit-backdrop-filter`, and has no `roster`/`calendar` selectors. `src/css/style.css` contains only `@import`s. | build-output | `node --test test/css.test.js` | ❌ Wave 0 |
| PERF-07 | `initFeatures` calls only loaders whose hook is present (spy loaders). Each module's `init` no-ops on a missing child element. The terminal still prints `data-discord-url` via `textContent`. 404 and `_dev/layout-empty` contain no `data-js="lightbox"`/`"terminal"`. Every module passes `node --check`. | unit (direct ESM import with stub globals) + build-output | `node --test test/client.test.js test/modules.test.js` | ✅ client.test.js (rewrite) / ❌ modules.test.js |
| D-16/17 | Each P-rule fails on a crafted fixture dir and passes on the real build. The budget object is exported. The CLI moves `<dir>` to `<dir>.rejected` on failure. | unit (fixture dirs, like `seo-gate.test.js`) | `node --test test/perf-gate.test.js` | ❌ Wave 0 |
| D-01 | `package-lock.json`: sharp ≥ 0.35.5, no nested sharp under eleventy-img, linux-x64 sharp + lightningcss entries present. | unit | `node --test test/deps.test.js` | ❌ Wave 0 |
| Build chain | `package.json` build = `clean && eleventy && check-seo && check-perf`. The workflow still runs `npm ci`, `npm test` and `npm run build`. | static | `node --test test/workflow.test.js` | ✅ (extend) |
| D-18 | Mobile PSI Performance ≥ 90 on the Pages preview | manual | PSI web UI, recorded in VERIFICATION | manual-only (D-19: no Lighthouse CI) |
| D-15 | Visual parity screenshots + checklist (hero softness on 3× phone, lightbox frame shape, icon alignment, "Zażółć gęślą jaźń") | manual | Phase 1 CDP screenshot method | manual-only |

### Sampling Rate
- **Per task commit:** the touched suite, e.g. `node --test test/images.test.js`.
- **Per wave merge:** `npm test && SITE_URL=https://guard.example npm run build && MSYS_NO_PATHCONV=1 SITE_URL=https://guard.example PATH_PREFIX=/IBC-Website/ npm run build`.
- **Phase gate:** Full suite green and both gates (check-seo, check-perf) pass before `/gsd-verify-work`. PSI recorded.

### Wave 0 Gaps
- [ ] `test/images.test.js` covers PERF-01/02/03 (build-output assertions, both variants)
- [ ] `test/fonts.test.js` + `lib/woff2.js` cover PERF-04 (cmap + negative control)
- [ ] `test/icons.test.js` covers PERF-05
- [ ] `test/css.test.js` covers PERF-06
- [ ] `test/modules.test.js` + rewritten `test/client.test.js` cover PERF-07
- [ ] `test/perf-gate.test.js` + `lib/check-perf.js` + `scripts/check-perf.js` cover D-16/D-17
- [ ] `test/deps.test.js` covers D-01 sharp guard + platform binaries
- [ ] `scripts/warm-images.js` + `"pretest"` (Pitfall 5)
- [ ] Update `test/build.test.js`, `test/layout.test.js`, `test/seo.test.js` (l), `test/links.test.js`, `test/devpages.test.js` for the moved assets and new markup

## Security Domain

`security_enforcement: true`, ASVS level 1. A static site with no auth, sessions or user input, so the surface is the build supply chain and output integrity.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation / Output Encoding | yes (build-time) | `Image.generateHTML` escapes only `alt`; every other attribute is inserted raw [VERIFIED: src/generate-html.js:191-195 `if(key === "alt") { return \`${key}="${value ? escapeAttribute(value) : ""}"\`; } return \`${key}="${value}"\`;`]. Only author-controlled literals go into `picture`/`icon` shortcode attributes. The icon shortcode throws on unknown names. No `innerHTML` in modules (terminal and easter egg use `textContent`). |
| V6 Cryptography | no (sha256 for cache-busting only, via `node:crypto`) | — |
| V10 Malicious Code / V14 Config (dependencies) | yes | Exact-pinned devDependencies, lockfile guard test (sharp ≥ 0.35.5, GHSA-wq5f-xc86-pv6w), no postinstall scripts (verified), sharp decodes only committed, repo-owned images |
| V14 Config (headers/MIME) | yes | IIS `web.config` MIME entries for `.avif`/`.webp`/`.woff2` (with `remove` first, avoiding 500.19). Font preload with `crossorigin` (anonymous CORS fetch, same origin) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious/compromised image triggers a libvips bug at build | Tampering / Elevation | sharp 0.35.5 (patched). Inputs are committed repo files only, no remote URLs in `processImages()`. Assert sources are local paths. |
| Dependency confusion / slopsquat during install | Tampering | Packages verified via registry + legitimacy seam; `npm ci` from the lockfile; sharp version guard test |
| Third-party CDN compromise (FA, Google Fonts) | Tampering / Info disclosure (visitor IPs to Google) | Removed entirely (PERF-04/05). The gate forbids those hosts in the output. |
| Dynamic `import()` path injection | Tampering | Literal loader map; hook text is only a map key |
| Attribute injection through generated markup | Tampering (XSS) | Shortcode inputs are build-time literals; the alt text is escaped by eleventy-img |
| Partial/rejected build deployed | Integrity | check-perf reuses the `_site.rejected/` move (CR-02 pattern) |

## Sources

### Primary (HIGH confidence)
- Installed source: `node_modules/@11ty/eleventy/src/{UserConfig.js,Eleventy.js,Plugins/HtmlBasePlugin.js,Filters/Url.js}`, `node_modules/@11ty/posthtml-urls/lib/defaultOptions.js` (Eleventy 3.1.6)
- `@11ty/eleventy-img@7.0.0` package source (npm pack): `img.js`, `src/global-options.js`, `src/image.js`, `src/disk-cache.js`, `src/generate-html.js`
- npm registry (`npm view`) for eleventy-img, lightningcss, sharp, subset-font. gsd-tools package-legitimacy seam.
- Spikes on the real repo files (scratchpad): eleventy-img variant sizes/timings, Lightning CSS prefix/url behaviour and sizes, pyftsubset output size, WOFF2 cmap reader with a negative control, FA 6.0.0 SVG/CSS (npm pack)
- Repo files read this session: `package.json`, `eleventy.config.js`, `src/_includes/partials/head.njk`, `src/css/style.css`, `src/_data/site.js`, `src/web.config.njk`, `test/build.test.js`, `tools/seo-images/make-seo-images.js`, `lib/check-seo.js`, plus the related templates/tests listed above

### Secondary (MEDIUM confidence)
- [11ty Image docs](https://www.11ty.dev/docs/plugins/image/): Node 22+/ESM, options, caching
- [11ty Image shortcodes](https://www.11ty.dev/docs/plugins/image-shortcodes/): async shortcode, "Nunjucks macros are not async-friendly"
- [Lightning CSS bundling](https://lightningcss.dev/bundling.html): `bundle()` API (silent on url rebasing; behaviour verified by spike)
- [web.dev: Preload responsive images](https://web.dev/articles/preload-responsive-images): `imagesrcset`/`imagesizes`, `type` to skip unsupported formats, omit `href`

### Tertiary (LOW confidence)
- [West Wind: FontAwesome fonts and MIME types in IIS](https://weblog.west-wind.com/posts/2016/Jan/25/FontAwesome-Fonts-and-Mime-Types-in-IIS-and-other-Web-Servers): IIS 10 maps `.woff2`; AVIF/WebP defaults unconfirmed (A3)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Registry-verified versions, installed and run against the real assets.
- Architecture: HIGH. Every integration point was checked in installed Eleventy/eleventy-img source (attribute rewrite list, `eleventy.after` args, sync/async shortcode routing, disk cache).
- Pitfalls: HIGH for 1–8 and 11 (reproduced or read in source), MEDIUM for 9–10 (browser-selection behaviour, A5/A6).

**Research date:** 2026-10-10
**Valid until:** 2026-11-10 (eleventy-img and lightningcss move fast; re-run `npm view` before install)
