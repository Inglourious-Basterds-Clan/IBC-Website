# Stack Research

**Domain:** Small multi-page static marketing/recruitment site (Polish Arma 3 milsim clan), focused on SEO, Lighthouse ≥ 90 on mobile and image optimization
**Researched:** 2026-10-02
**Confidence:** HIGH for versions and the core recommendation (npm registry checked directly, key plugins run in a local smoke build on Node 26 / Windows). MEDIUM for ecosystem and governance claims (web sources).

## Verdict: Eleventy 3 vs Astro 7 vs plain HTML

**Use Eleventy (11ty) 3.1.x with Nunjucks templates, plain CSS and the existing vanilla JS.**

Why it fits this project:

1. **Least rewrite.** Eleventy templates are HTML with a few `{% include %}` / `{{ var }}` tags. The current `index.html` becomes `src/index.njk` almost unchanged. `css/style.css` and `js/main.js` are copied through as they are. Astro would require rewriting every section as `.astro` components, moving images into `src/` with `import` statements, and running CSS and JS through Vite's bundler.
2. **Covers every active requirement with official 11ty plugins, and adds no client JS:**
   - Shared header and footer: layouts and includes.
   - Image optimization: `@11ty/eleventy-img` transforms plain `<img>` tags into AVIF/WebP/JPEG `<picture>` with `srcset` and dimensions.
   - Font Awesome replacement: `@11ty/font-awesome` turns the existing `<i class="fab fa-discord">` markup into inline SVG at build time.
   - One URL config value: a global data file.
   - Sitemap and robots: plain templates.
   - Roster from the Discord bot: global data or `@11ty/eleventy-fetch`.
3. **Output is plain static files** in `_site/`, deployable to any host, which is a project constraint. The tool has no runtime.
4. **Low lock-in.** If Eleventy is ever abandoned, the templates are near-HTML and the output is already plain HTML.

Why Astro 7 is the runner-up and not the pick: it is excellent and would also reach Lighthouse ≥ 90. Its built-in `<Picture>`, stable Fonts API (local fonts, subsets, fallback metrics) and `@astrojs/sitemap` are real advantages. But on a 4-page site with zero client framework needs, those advantages are matched by Eleventy plugins, and Astro costs more:
- a full component rewrite
- Vite 8 / Rolldown in the pipeline
- strict HTML parsing (Astro 7 now errors on unclosed tags)
- a faster major-version cadence (Astro 7 shipped June 2026 with breaking changes)

Why not plain HTML: once you need shared header/footer across 4+ pages, AVIF/WebP generation, a sitemap and URL substitution, you end up writing a worse static site generator out of scripts. Header and footer drift between hand-copied pages is a known maintenance failure.

| Criterion | Eleventy 3.1.6 | Astro 7.3.5 | Plain HTML + scripts |
|-----------|----------------|-------------|----------------------|
| Migration effort from current `index.html` | **Low** (rename to `.njk`, split into layout and includes) | High (componentize, import images, Vite asset pipeline) | None at first, then grows with every page |
| Shared layout/partials | Built-in (layouts, includes) | Built-in (components, layouts) | Copy-paste, or a custom include script |
| Responsive AVIF/WebP | `@11ty/eleventy-img` 7 HTML transform (verified) | Built-in `astro:assets` `<Picture>` | Hand-rolled `sharp` script plus hand-written `<picture>` |
| Client JS shipped by framework | 0 KB | 0 KB by default | 0 KB |
| Icons to inline SVG | `@11ty/font-awesome` 2 (verified, accepts the existing `fab fa-*` markup) | `astro-icon` 1.2 | Paste SVGs by hand |
| Fonts | Fontsource files plus manual `@font-face` (or subset script) | Fonts API (stable) | Manual |
| Sitemap/robots/canonical | Templates plus a `site.url` global | `@astrojs/sitemap` plus `site` config | Manual |
| Build-time data (roster JSON) | `_data/*.js` / `eleventy-fetch` | Content collections / `fetch` in frontmatter | Manual |
| Node requirement | ≥ 18 core, ≥ 22 for eleventy-img 7 | ≥ 22.12 | None (≥ 20.9 if a sharp script is used) |
| Governance | Font Awesome-owned; GitHub repo renamed `11ty/buildawesome`; npm package still `@11ty/eleventy`, MIT | Cloudflare-owned since Jan 2026, MIT | n/a |

**Confidence: HIGH** that Eleventy is the right fit here. Astro is not a wrong answer; it costs more effort for no user-visible gain on this site.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Node.js | 24 LTS (or 26 once it enters LTS on 2026-10-28); set `"engines": {"node": ">=22.19"}` | Build-time runtime only | eleventy-img 7 needs Node ≥ 22. Lighthouse 13 needs ≥ 22.19. Node 24 is LTS until 2028-04. The local machine runs 26.7, which the smoke build ran on. | HIGH (Node release schedule JSON) |
| `@11ty/eleventy` | **3.1.6** (pin `~3.1.6`) | Static site generator: layouts, includes, data, output to `_site/` | Zero client JS, HTML-first, minimal rewrite of existing markup. 3.1.6 is the `latest` dist-tag (published 2026-06-02). | HIGH (npm registry, smoke build) |
| Nunjucks (bundled with Eleventy) | bundled (nunjucks ^3.2.4) | Template language for `.njk` pages and layouts | Default choice in the 11ty docs. Supports `{% include %}`, `{% set %}`, filters and `| dump` for safe JSON-LD. Liquid also works, but Nunjucks has better macros for repeated HUD components. | HIGH |
| `@11ty/eleventy-img` | **7.0.0** | Build-time AVIF/WebP/JPEG generation, `srcset`, `width`/`height`, `loading`/`decoding` | Official. The HTML Transform mode processes ordinary `<img>` tags, so existing markup keeps working. v7 (2026-07-29) fixed v6 memory problems and uses sharp 0.35. In the local test, a 1920 px JPEG produced 400/800/1200 px AVIF at 7.6/31.8/76.6 KB. | HIGH (smoke build) |
| Plain CSS (existing `style.css`) | n/a | Styling | 1400 lines of custom-property CSS already exist. A preprocessor or Tailwind would mean a rewrite without Lighthouse gains. | HIGH |
| Vanilla JS (existing `main.js`) | n/a | Menu, lightbox, scroll-spy, terminal animation, easter egg | Already framework-free. Passthrough-copy it, load with `defer`, and split per page only if it grows. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| `@11ty/font-awesome` | **2.0.0** | Turns `<i class="fa-brands fa-discord">` (and the older `fab fa-discord` used in the current markup) into a per-page, de-duplicated inline SVG sprite. No CSS or JS is shipped. | Phase that removes the Font Awesome CDN. A drop-in replacement for the ~70 KB+ `all.min.css` plus webfont. Needs `{% getBundle "fontawesome" %}` in the layout and the CSS `svg{height:1em}`. Verified in the smoke build. | HIGH |
| `@fontsource-variable/inter` | **5.3.0** | Self-hosted Inter variable woff2 | Fonts phase. Copy only `inter-latin-wght-normal.woff2` via passthrough and write your own `@font-face` (do not import Fontsource CSS, since there is no bundler). | HIGH |
| `@fontsource-variable/montserrat` | **5.3.0** | Self-hosted Montserrat variable woff2 | Same as Inter. | HIGH |
| HUD mono font: `@fontsource-variable/jetbrains-mono` 5.3.0 (or `@fontsource/oxanium` / `ibm-plex-mono`) | 5.3.0 | Replacement for Share Tech Mono | **Required decision.** Share Tech Mono ships a Latin-only subset (U+0000–00FF), with no ą ę ł ś ż ź ć ń. Polish HUD text such as "Instrukcja Zaciągu" falls back to a system font mid-word. Either swap to a latin-ext mono (JetBrains Mono, IBM Plex Mono) or keep Share Tech Mono strictly for ASCII-only labels. The final pick belongs in the UI phase. | HIGH (Fontsource API metadata, current CSS checked) |
| `subset-font` | **2.9.0** | Build script that creates a tiny "Polish diacritics only" woff2 per family | Fonts phase. Fontsource's `latin-ext` file is 85 KB for Inter and 71 KB for Montserrat, and every Polish page triggers it. Subsetting `latin-ext` down to the 18 Polish letters gives **5.5 KB (Inter), 7.2 KB (Montserrat), 3.6 KB (JetBrains Mono)**, measured locally. Serve it as a second `@font-face` with a narrow `unicode-range`. Saves about 140 KB on first load. | HIGH (measured) |
| `@11ty/eleventy-fetch` | **5.1.3** | Cached build-time HTTP fetch | Roster phase only, if the Discord bot exposes a JSON URL. Use `duration: "1h"` or similar. If the bot instead commits a JSON file, use a plain `src/_data/roster.json` and skip this. | HIGH (version), MEDIUM (fit depends on bot format) |
| `lightningcss` | **1.33.0** | CSS minify, plus optional nesting/lowering with browser targets | Optional, in the performance phase. Minify `style.css` in an `eleventy.after` hook or a custom `css` template format. Gzipped CSS savings are modest, so do this after images and fonts. | MEDIUM |
| `esbuild` | **0.28.2** | JS minify | Optional. `main.js` is small, so only add this if Lighthouse flags "Minify JavaScript". | MEDIUM |

Built-ins (no extra package needed):
- **`HtmlBasePlugin`**: rewrites URLs when `pathPrefix` is set. Needed if a pre-domain deploy lives at a subpath such as `user.github.io/IBC-Website/`.
- **Bundle plugin** (Eleventy 3 bundles `@11ty/eleventy-plugin-bundle`): per-page CSS/JS bundles, used by the Font Awesome plugin.
- **Dev server** (`@11ty/eleventy-dev-server` 2.0.8): live reload.

### Development Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| `npx @11ty/eleventy --serve` | bundled | Local dev with live reload | Replaces `python -m http.server`. |
| `lighthouse` CLI | **13.5.0** | Local mobile audits against `_site` served locally | Mobile is the default form factor. Example: `npx lighthouse http://localhost:8080/ --view`. Needs Node ≥ 22.19. Run 3× and take the median, because single runs are noisy. |
| `unlighthouse` | **0.19.0** | Crawls and audits **all** pages at once | Useful once there are 4+ pages. Optional. |
| PageSpeed Insights (web) | n/a | Real-world mobile score after deploy | This is the number that "Lighthouse ≥ 90" will be judged by. Run it on the deployed URL, not only on localhost. |
| Google Rich Results Test and validator.schema.org (web) | n/a | Validate JSON-LD | Note: FAQ rich results were fully retired by Google on 2026-05-07 (see below). |
| Prettier | 3.9.9 | Formatting `.njk`/CSS/JS | Optional. |

## Installation

```bash
# Core
npm install -D @11ty/eleventy@~3.1.6 @11ty/eleventy-img@^7.0.0 @11ty/font-awesome@^2.0.0

# Fonts (self-hosted)
npm install -D @fontsource-variable/inter@^5.3.0 @fontsource-variable/montserrat@^5.3.0
# + chosen latin-ext HUD font, e.g.
npm install -D @fontsource-variable/jetbrains-mono@^5.3.0
npm install -D subset-font@^2.9.0

# Later phases / optional
npm install -D @11ty/eleventy-fetch@^5.1.3     # roster phase, if bot exposes URL
npm install -D lightningcss@^1.33.0            # CSS minify (optional)
npm install -D lighthouse@^13.5.0              # local audits (or use npx)
```

`package.json` essentials:

```json
{
  "type": "module",
  "engines": { "node": ">=22.19" },
  "scripts": {
    "dev": "eleventy --serve",
    "build": "eleventy",
    "build:prod": "cross-env SITE_URL=https://example.pl eleventy"
  }
}
```

On Windows, setting an env var inline needs `cross-env` or a `.env` approach. The simpler route is to edit the default in `src/_data/site.js`.

### Single-source site URL (verified pattern)

```js
// src/_data/site.js  — THE one place the domain lives
export default {
  url: process.env.SITE_URL ?? "https://TODO-domain.pl", // no trailing slash
  name: "Inglourious Basterds Clan",
  locale: "pl_PL",
  discordInvite: "https://discord.gg/DhJwkeehJK", // also fixes the 3x duplicated invite
};
```

Usage: `<link rel="canonical" href="{{ site.url }}{{ page.url }}">`. The same expression builds OG/Twitter absolute image URLs, `sitemap.xml.njk` and `robots.txt.njk`. Verified: `SITE_URL=https://ibc.example` produced `<link rel="canonical" href="https://ibc.example/">`.

### Image transform config (verified behavior)

```js
// eleventy.config.js
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import fontAwesomePlugin from "@11ty/font-awesome";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["avif", "webp", "jpeg"],
    widths: [400, 800, 1200],
    urlPath: "/img/",
    outputDir: "./_site/img/",
    htmlOptions: { imgAttributes: { loading: "lazy", decoding: "async", sizes: "(min-width: 900px) 600px, 100vw" } },
  });
  eleventyConfig.addPlugin(fontAwesomePlugin);
  eleventyConfig.addPassthroughCopy({ "src/js": "js", "src/css": "css" });
  return { dir: { input: "src", output: "_site" } };
}
```

Gotchas confirmed in the smoke test:
- **A `width="600"` attribute on the source `<img>` makes the transform output only that one width.** In v7, `eleventy:widths` takes priority over `width`. For responsive images, either drop `width`/`height` from source markup (the plugin writes correct ones) or add `eleventy:widths="400,800,1200"`.
- **Without `urlPath`/`outputDir`, generated files land next to the page.** At the root, that means `_site/*.avif`. Always set both.
- **The hero/LCP image must be eager:** add `loading="eager" fetchpriority="high"` per image (per-image attributes override the defaults).
- **CSS `background-image` (the current hero uses `url('../assets/hero-bg.jpg')`) is NOT processed.** Convert the hero to an `<img>` with `object-fit: cover` under the gradient overlay.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Eleventy 3.1.6 | **Astro 7.3.5** | Choose it if the roster becomes an interactive app (client-side filtering/sorting with a UI framework island), if a collaborator already knows Astro/React, or if typed content collections for many op recaps become valuable. Astro gives built-in `<Picture>`, a stable Fonts API with automatic fallback metrics, and `@astrojs/sitemap`. |
| Eleventy 3.1.6 | Plain HTML + `sharp` scripts | Only if the owner refuses any Node toolchain. Accept hand-synced header/footer across pages and hand-written `<picture>` markup. |
| Eleventy 3.1.6 | Eleventy 4.0.0-alpha.x (canary) | Not for this project. The alpha has been in canary since 2025-07, and v4 is slated to ship under the "Build Awesome" name. Revisit when it reaches `latest`. |
| `@11ty/font-awesome` | Hand-pasted SVGs from `simple-icons` 16.33.0 in a Nunjucks include | Equally good with ~3–5 brand icons. Pick it if you want zero icon dependencies. Write SVGs with `aria-hidden="true"` and keep the link `aria-label`s. |
| Fontsource + `subset-font` | Astro Fonts API / `subfont` 7.3.0 | `subfont` auto-subsets by crawling built HTML and is powerful, but it is heavier and rewrites HTML. Overkill for 3 families. |
| Hand-written `sitemap.xml.njk` | Third-party Eleventy sitemap plugins | Templates are about 15 lines and avoid a third-party plugin of uncertain maintenance. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Font Awesome CDN `all.min.css` (current) | Render-blocking third-party CSS plus a webfont for ~5 icons. Hurts FCP/LCP and is flagged as unused CSS. | `@11ty/font-awesome` or inline SVG |
| Google Fonts via CSS `@import` (current) | Chained render-blocking requests (CSS → `@import` → fonts.googleapis → fonts.gstatic). It is also a privacy concern in the EU. | Self-hosted woff2 plus `<link rel="preload">` for the one above-the-fold font file, and `font-display: swap` |
| Share Tech Mono for any Polish text | No latin-ext glyphs, so mixed-font words appear on Polish diacritics | latin-ext mono (JetBrains Mono / IBM Plex Mono), or ASCII-only usage |
| Importing Fontsource CSS directly (`@import "@fontsource/..."`) | Without a bundler, paths resolve into `node_modules`. It also pulls cyrillic/greek/vietnamese `@font-face` rules. | Copy only the needed woff2 files and write 2 `@font-face` rules per family |
| Tailwind / Sass | Rewrite cost on 1400 lines of working CSS, with no Lighthouse benefit | Plain CSS with custom properties (and optionally `lightningcss` minify) |
| React/Vue/Preact islands, Next.js, Gatsby | Ship JS runtime for a content site. Next and Gatsby are not "plain static files on any host" without effort. Gatsby has seen little development in recent years (not re-verified here). | Eleventy and vanilla JS |
| `@lhci/cli` 0.15.1 as the primary audit tool | Last published 2025-06 and pins Lighthouse 12.6.1, a major behind Lighthouse 13.5.0 | `lighthouse` 13.5.0 CLI, `unlighthouse`, and PageSpeed Insights on the deployed URL |
| Committing the 25 MB of source images as served assets | `hero.jpg` and `hero-bg.jpg` are identical 4.7 MB files. PNG screenshots are 3.6–5 MB each. | Keep originals in `src/assets/` as build input only. Serve the eleventy-img outputs. Delete the duplicate hero. |
| `FAQPage` JSON-LD expecting rich results | Google retired FAQ rich results entirely on 2026-05-07, and Rich Results Test support was dropped in 2026-06. The markup is harmless but gives no SERP feature. | Still fine to include (low cost, may help other consumers). Prioritize `Organization`/`SportsTeam`, `WebSite`, `BreadcrumbList`, and `Event` for operations. |
| `.eleventy.js` CommonJS config | Eleventy 3 and eleventy-img 7 are ESM-first (eleventy-img 7 is ESM-only) | `eleventy.config.js` with `export default` and `"type": "module"` |

## Stack Patterns by Variant

**If the site is first deployed at a subpath (e.g. GitHub Pages project site before the domain is bought):**
- Set `pathPrefix: "/IBC-Website/"` in the Eleventy config return object and add the built-in `HtmlBasePlugin`.
- Reason: root-relative URLs (`/img/...`, `/css/...`) otherwise 404. Canonical URLs should still come from `site.url`.

**If the Discord bot publishes a JSON endpoint:**
- Use `@11ty/eleventy-fetch` in `src/_data/roster.js` with a cache duration, and rebuild on a schedule.
- Reason: the static output stays static, with no CORS, no client JS and no bot downtime affecting visitors.

**If the bot only writes a file / the roster must be live:**
- Have the bot commit `src/_data/roster.json` (triggers rebuild), or as a last resort do a client-side `fetch()` progressively enhancing a build-time snapshot.
- Reason: a crawler-visible roster must be in the HTML at build time.

**If Lighthouse Performance stalls in the 80s after images and fonts are fixed:**
- Inline the minified CSS into `<head>` (Eleventy bundle plugin `{% css %}` / `getBundle`), or move `backdrop-filter` and fixed overlays out of the mobile path.
- Reason: on a small site, render-blocking CSS and mobile paint cost are the usual remaining offenders.

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@11ty/eleventy@3.1.6` | `@11ty/eleventy-img@7.0.0`, `@11ty/font-awesome@2.0.0` | Verified together in a build on Node 26.7 / Windows 11. `@11ty/font-awesome` requires Eleventy ≥ 3.0.1. |
| `@11ty/eleventy-img@7.0.0` | Node ≥ 22, `sharp@^0.35.3` (transitive) | ESM-only. Removed the `<eleventy-image>` WebC component and `statsSync`. sharp ships prebuilt Windows/Linux/macOS binaries, so no native toolchain is needed. |
| `lighthouse@13.5.0` | Node ≥ 22.19 | The `@lhci/cli@0.15.1` bundle is still on Lighthouse 12.6.1. |
| `astro@7.3.5` (if chosen instead) | Node ≥ 22.12, Vite 8 | Astro 7 errors on malformed HTML that earlier versions auto-corrected. |
| Fontsource `5.3.0` packages | Any | File naming: `<family>-latin-wght-normal.woff2`, `<family>-latin-ext-wght-normal.woff2` (variable packages). |

## Sources

- npm registry (`npm view`, 2026-10-02): versions, dist-tags, engines and publish dates for `@11ty/eleventy` (3.1.6 latest, 4.0.0-alpha.10 canary), `@11ty/eleventy-img` 7.0.0, `@11ty/font-awesome` 2.0.0, `@11ty/eleventy-fetch` 5.1.3, `astro` 7.3.5, `@astrojs/sitemap` 3.7.4, `sharp` 0.35.5, `lighthouse` 13.5.0, `@lhci/cli` 0.15.1, `unlighthouse` 0.19.0, `lightningcss` 1.33.0, `esbuild` 0.28.2, `subset-font` 2.9.0, Fontsource 5.3.0. **HIGH** (primary source).
- Local smoke build in the session scratchpad: Eleventy 3.1.6, eleventy-img 7 and font-awesome 2 on Node 26.7. Verified the canonical URL from `SITE_URL`, AVIF/WebP/JPEG output sizes, the width-attribute and `urlPath` gotchas, and `fab fa-discord` to inline SVG. Measured `subset-font` sizes. **HIGH** (executed).
- Fontsource API `api.fontsource.org/v1/fonts/{share-tech-mono,inter,montserrat,jetbrains-mono,...}`: subset availability (Share Tech Mono = latin only). **HIGH**.
- Node.js release schedule (`github.com/nodejs/Release/schedule.json`): Node 24 LTS until 2028-04-30, Node 26 LTS from 2026-10-28. **HIGH**.
- https://www.11ty.dev/docs/plugins/image/: HTML Transform method, defaults, Node 22+ requirement. **MEDIUM** (official docs via WebFetch).
- https://github.com/11ty/eleventy-img/releases: v7.0.0 (2026-07-29) breaking changes and memory fixes. **MEDIUM**.
- `@11ty/font-awesome` README (npm): usage, `getBundle "fontawesome"`, sample CSS. **HIGH** (plus executed).
- https://www.11ty.dev/blog/build-awesome/ (2026-03-03) and https://www.11ty.dev/blog/ (Kickstarter posts Apr–May 2026); https://disassociated.com/font-awesome-cans-eleventy-renaming/ (2026-03-17, reports a pause). GitHub `11ty/eleventy` now 301-redirects to `11ty/buildawesome`. The rename status is somewhat contradictory across sources, but the npm package and MIT license are unchanged. **MEDIUM**.
- https://astro.build/blog/astro-7/ (2026-06-22): Rust compiler, Vite 8/Rolldown, strict HTML, Sätteri markdown. **MEDIUM**.
- https://docs.astro.build/en/guides/fonts/: Fonts API features (local, subsets, preload, fallbacks). **MEDIUM**.
- Cloudflare acquisition of Astro (2026-01-16): https://secure.businesswire.com/news/home/20260116386991/en/Cloudflare-Acquires-Astro-to-Accelerate-the-Future-of-High-Performance-Web-Development. **MEDIUM**.
- Google FAQ rich results retirement: https://www.searchenginejournal.com/google-drops-faq-rich-results/574429/ (2026-05-10), background https://developers.google.com/search/blog/2023/08/howto-faq-changes. **MEDIUM**. Re-verify against Google Search Central docs in the SEO phase.
- `classify-confidence` seam returns LOW for websearch/webfetch providers in this config. Claims above were upgraded only where cross-checked against the npm registry or local execution.

---
*Stack research for: SEO/performance-focused multi-page static site (IBC Arma 3 milsim clan)*
*Researched: 2026-10-02*
