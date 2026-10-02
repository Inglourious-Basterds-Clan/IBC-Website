# Architecture Research

**Domain:** Small multi-page static SEO site (Polish Arma 3 milsim clan), brownfield migration from one hand-written `index.html`
**Researched:** 2026-10-02
**Confidence:** MEDIUM overall. Package versions are HIGH because I checked them directly with `npm view` on 2026-10-02. Eleventy APIs are MEDIUM: they come from the official 11ty.dev docs via WebFetch, which the GSD seam rates LOW until cross-checked, and they match long-standing, widely used Eleventy patterns. The roster integration is LOW because the bot's data format does not exist yet.

> **Stack assumption.** This architecture assumes **Eleventy 3.1.x (`@11ty/eleventy@^3.1.6`) with Nunjucks templates**. Eleventy is the lowest-risk SSG for this migration because the current `index.html` contains no `{{`, `{%` or `{#` sequences (checked by grep). It can be renamed to `index.njk` and builds byte-for-byte on the first step. The component boundaries below do not depend on the SSG. If STACK.md picks Astro instead, the same boundaries map onto `src/layouts`, `src/components` and `astro:assets`.

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         AUTHORING LAYER  (src/)                          │
│                                                                          │
│  CONFIG / DATA (_data/)              CONTENT (pages)        ASSETS       │
│  ┌──────────┐ ┌────────────┐        ┌──────────────┐     ┌───────────┐  │
│  │ site.js  │ │navigation.js│       │ index.njk    │     │ assets/img│  │
│  │ (URL,    │ │ (menu,     │        │ dolacz.njk   │     │ assets/   │  │
│  │ discord, │ │ footer,    │        │ operacje.njk │     │  fonts    │  │
│  │ defaults)│ │ crumbs)    │        │ jednostki.njk│     │ favicon/og│  │
│  └────┬─────┘ └─────┬──────┘        │ 404.njk      │     └─────┬─────┘  │
│  ┌────┴─────┐ ┌─────┴──────┐        └──────┬───────┘           │        │
│  │ faq.json │ │operations. │  ┌───────────┐│ front matter:     │        │
│  │gallery.  │ │json        │  │ roster.js ││ title, desc,      │        │
│  │json      │ │            │  │ (fetch +  ││ ogImage, schema,  │        │
│  └────┬─────┘ └─────┬──────┘  │ adapter)  ││ breadcrumb, nav   │        │
│       │             │         └─────┬─────┘│                   │        │
├───────┴─────────────┴───────────────┴──────┴───────────────────┴────────┤
│                    TEMPLATE LAYER  (_includes/ + lib/)                    │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ layouts/      │  │ partials/    │  │ partials/    │  │ lib/       │  │
│  │ base.njk      │─▶│ seo-head.njk │  │ header.njk   │  │ schema.js  │  │
│  │ page.njk      │  │ (title, canon│  │ footer.njk   │  │ (JSON-LD   │  │
│  │               │  │  OG, Twitter,│  │ breadcrumbs  │  │  builders) │  │
│  │               │  │  JSON-LD)    │  │ discord-cta  │  │ filters.js │  │
│  └───────────────┘  └──────────────┘  │ icon (SVG)   │  │ shortcodes │  │
│                                       └──────────────┘  └────────────┘  │
├──────────────────────────────────────────────────────────────────────────┤
│                    BUILD PIPELINE  (eleventy.config.js)                   │
│  data cascade ─▶ render ─▶ HTML transforms ─▶ write _site/               │
│                              │ eleventy-img (<img> → <picture>)          │
│                              │ HTML base (pathPrefix)                    │
│  css/main.css ─▶ Lightning CSS bundle+minify ─▶ _site/css/main.css       │
│  js/**        ─▶ passthrough (native ES modules) ─▶ _site/js/            │
│  sitemap.xml.njk / robots.txt.njk / site.webmanifest.njk ─▶ _site/       │
│  post-build: scripts/check-seo.js (fails build on missing canonical...)  │
├──────────────────────────────────────────────────────────────────────────┤
│                    OUTPUT  (_site/, gitignored) → user deploys           │
│   /index.html  /dolacz/index.html  /operacje/index.html  /jednostki/…    │
│   /404.html  /sitemap.xml  /robots.txt  /css/  /js/  /img/  /fonts/      │
├──────────────────────────────────────────────────────────────────────────┤
│                    RUNTIME  (browser, progressive enhancement only)       │
│   js/main.js (type=module) ─▶ nav.js always                              │
│        └─ dynamic import() if hook present: lightbox / terminal /        │
│           easter-egg / (scrollspy on home only)                          │
│   No runtime data fetching. All indexable content is in the HTML.       │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility (owns) | Communicates with | Implementation |
|-----------|----------------------|-------------------|----------------|
| **Site config** `src/_data/site.js` | The only source for the site URL, path prefix, site name, `lang`, Discord invite URL, default OG image, theme colour, and the indexing switch (`noindex` for previews) | Read by every layout and partial, plus sitemap, robots, manifest, JSON-LD builders and the Discord CTA | JS data file that reads `process.env.SITE_URL` and falls back to a default value in the same file |
| **Navigation data** `src/_data/navigation.js` | Ordered page list: label, URL, whether it appears in the header or footer, and parent for breadcrumbs | `header.njk`, `footer.njk`, `breadcrumbs.njk`, `schema.js` (BreadcrumbList) | Plain array. Active state is computed at build time (`page.url == item.url` gives `aria-current="page"`) |
| **Content data** `faq.json`, `operations.json`, `gallery.json` | Structured content that renders twice: as visible HTML and as JSON-LD | Page templates and `schema.js` | JSON. One source for both renderings, so the visible content and the markup can never drift apart |
| **Roster adapter** `src/_data/roster.js` | Fetch bot JSON at build time, validate it, map it to an internal `Member` shape, and fall back to the committed snapshot | `jednostki.njk` only | `@11ty/eleventy-fetch` with a `try/catch` fallback to `roster.snapshot.json` |
| **Base layout** `layouts/base.njk` | The `<html lang="pl">` document shell: skip link, header, `<main id="main">`, footer, the single CSS and JS entry points | Includes all partials. Pages extend it | Nunjucks `{% extends %}` / `{% block %}` |
| **SEO head** `partials/seo-head.njk` | `<title>`, meta description, canonical, OG/Twitter (absolute URLs), robots meta, favicon/manifest links, preloads, JSON-LD `<script>` | Reads page front matter, `site`, and `schema.js` output | The only place where `<head>` meta is written |
| **Schema builders** `lib/schema.js` | Build the JSON-LD `@graph`: Organization and WebSite on every page, BreadcrumbList per page, FAQPage or Event when a page declares it | Called from `seo-head.njk` through a `jsonLd` filter or shortcode | Pure JS functions that take `(page, site, data)` and return an object. A safe serializer escapes `<` |
| **Header / footer / CTA partials** | Shared chrome and the Discord call-to-action button (the URL comes from `site.discord.invite`) | `navigation`, `site`, `icon` shortcode | Nunjucks includes. Fixes the Discord URL being duplicated in three places |
| **Icon shortcode** `{% icon "discord" %}` | Inline SVG icons, decorative by default (`aria-hidden="true"`) | Every template that needs icons | Reads `src/_includes/icons/*.svg`. Replaces the Font Awesome CDN |
| **Image pipeline** | Every content `<img>` becomes `<picture>` with AVIF/WebP/JPEG, `srcset`, `width`/`height` and lazy loading. The hero is eager with `fetchpriority="high"` | Runs as an HTML transform over all rendered pages | `eleventyImageTransformPlugin` from `@11ty/eleventy-img` 7.x (needs Node 22+) |
| **CSS pipeline** | Many source partials become one minified `/css/main.css` with no runtime `@import` chain | Linked once from `base.njk` | Lightning CSS `bundle()` through an Eleventy custom `css` extension |
| **JS runtime** `src/js/` | Progressive enhancement only: mobile menu, lightbox, terminal, easter egg, scroll-spy on the home page | DOM `data-js` hooks. Reads config such as the Discord URL from DOM attributes, never from hard-coded constants | Native ES modules, passthrough copy, no bundler |
| **Generated SEO files** | `sitemap.xml`, `robots.txt`, `site.webmanifest`, `404.html` | `collections.all`, `site` | Nunjucks templates with `permalink:` and `eleventyExcludeFromCollections: true` |
| **SEO audit** `scripts/check-seo.js` | Post-build guard. Every HTML page must have a unique `<title>`, a description, an absolute canonical that starts with `site.url`, an absolute `og:image`, JSON-LD that parses, and an entry in the sitemap | Reads `_site/` | Small Node script run by `npm run build` after Eleventy. Returns a non-zero exit code on failure |

---

## Recommended Project Structure

```
IBC-Website/
├── eleventy.config.js        # plugins, filters, shortcodes, passthrough, CSS extension
├── package.json              # "engines": { "node": ">=22" }; scripts: dev, build, check
├── .nvmrc                    # 22 (or 24 LTS). eleventy-img 7 needs Node 22+
├── .gitignore                # _site/  node_modules/  .cache/
├── lib/                      # build-time JS (never shipped to browser)
│   ├── schema.js             # JSON-LD builders: organization, website, breadcrumbs, faq, event
│   ├── filters.js            # absoluteUrl, jsonLd (safe serializer), dateIso, …
│   └── shortcodes.js         # icon, (optional) image for non-<img> cases
├── scripts/
│   └── check-seo.js          # post-build audit of _site/
└── src/                      # Eleventy input dir
    ├── _data/
    │   ├── site.js           # SINGLE SOURCE: url, pathPrefix, name, discord, defaults
    │   ├── navigation.js
    │   ├── faq.json          # Dołącz / FAQ content (visible + FAQPage JSON-LD)
    │   ├── operations.json   # schedule, mission types, recaps (visible + Event JSON-LD)
    │   ├── gallery.json      # src, alt, title, caption
    │   ├── roster.js         # build-time fetch + adapter + fallback   (LAST phase)
    │   └── roster.snapshot.json
    ├── _includes/
    │   ├── layouts/
    │   │   ├── base.njk      # document shell
    │   │   └── page.njk      # extends base; adds breadcrumbs + page header
    │   ├── partials/
    │   │   ├── seo-head.njk
    │   │   ├── header.njk
    │   │   ├── footer.njk
    │   │   ├── breadcrumbs.njk
    │   │   ├── discord-cta.njk
    │   │   ├── lightbox.njk        # modal markup, only on pages with a gallery
    │   │   └── decryption-overlay.njk
    │   └── icons/            # discord.svg, chevron.svg, … (5–8 files)
    ├── index.njk             # "/"           (migrated from index.html)
    ├── dolacz.njk            # "/dolacz/"    How to join + FAQ
    ├── operacje.njk          # "/operacje/"  Operations / events
    ├── jednostki.njk         # "/jednostki/" Units / roster (LAST)
    ├── 404.njk               # "/404.html"
    ├── sitemap.xml.njk
    ├── robots.txt.njk
    ├── site.webmanifest.njk
    ├── css/
    │   ├── main.css          # only @imports, the one emitted file
    │   ├── _fonts.css        # @font-face, self-hosted woff2, relative url()
    │   ├── _tokens.css       # custom properties (today style.css lines 1–35)
    │   ├── _base.css         # reset, typography, body overlays (+ reduced-motion)
    │   ├── _layout.css       # header, footer, section containers, grid
    │   ├── components/       # _hud.css, _buttons.css, _gallery.css, _lightbox.css,
    │   │                     # _terminal.css, _breadcrumbs.css, _faq.css, _roster.css
    │   └── _utilities.css    # .visually-hidden, .skip-link, …
    ├── js/
    │   ├── main.js           # entry: init nav, then lazy-import features by hook
    │   └── modules/
    │       ├── nav.js        # mobile menu (all pages)
    │       ├── modal.js      # shared open/close/focus-trap/Esc helper
    │       ├── lightbox.js
    │       ├── terminal.js
    │       ├── scrollspy.js  # home only (in-page sections)
    │       └── easter-egg.js
    └── assets/
        ├── img/              # originals (large); the build emits optimized variants
        ├── fonts/            # subsetted woff2 (latin + latin-ext for Polish)
        ├── favicon/          # favicon.svg, .ico, apple-touch-icon.png, 192/512 png
        └── og/               # og-default.jpg 1200×630 (stable URL, NOT transformed)
```

### Structure Rationale

- **`src/` vs repo root:** Separating input from output (`_site/`) is the main architectural change. Today the repo root is the deployable site. Afterwards `_site/` is. This changes how the user deploys: they will deploy the build output, not the branch root. Call it out explicitly in the first phase.
- **`_data/` holds every fact that appears more than once.** URL, Discord invite, nav and FAQ items are each defined in one place. This directly fixes CONCERNS.md items such as the Discord link being duplicated three times and the relative OG image path.
- **`lib/` sits outside `src/`.** Build-time code (schema builders, filters) is not content and must never be copied to the output or treated as a template.
- **CSS partials use the `_` prefix.** The CSS extension compiles only `main.css`. `_`-prefixed files are inputs to the bundle and are never emitted, which matches the official Eleventy Sass recipe's partial convention.
- **ASCII Polish slugs** (`/dolacz/`, `/operacje/`, `/jednostki/`). Diacritics in paths get percent-encoded in shared links and Search Console. ASCII slugs still match Polish queries because Google folds diacritics.
- **Directory-style URLs** (`/dolacz/index.html`, served as `/dolacz/`) are Eleventy's default. They work unchanged on GitHub Pages, Netlify, Cloudflare Pages and plain nginx, with no rewrite rules.
- **Delete `api/`.** It is empty and git does not track empty directories. The roster does not need it: data enters at build time through `_data/roster.js`.

---

## Architectural Patterns

### Pattern 1: Single site-config value, absolute URLs only at the edges

**What:** `site.url` (with no trailing slash) and `pathPrefix` live in `src/_data/site.js` and can be overridden by `SITE_URL` / `PATH_PREFIX` env vars. Internal links are root-relative (`/dolacz/`) and pass through Eleventy's bundled HTML Base plugin, so a sub-path deploy keeps working. Only machine-facing URLs are made absolute: canonical, `og:url`, `og:image`, `twitter:image`, sitemap `<loc>`, robots `Sitemap:`, and JSON-LD `url`/`@id`/`logo`. Each one goes through a single `absoluteUrl` filter.
**When to use:** Always. The domain is unknown, and the repo is `Inglourious-Basterds-Clan/IBC-Website`. If it is ever served from GitHub Pages without a custom domain, it lives under the sub-path `/IBC-Website/`, which breaks root-relative links unless `pathPrefix` is set.
**Trade-offs:** Requires discipline: never hand-write `https://` for your own site in a template. The `check-seo.js` audit enforces it.

```js
// src/_data/site.js
const url = (process.env.SITE_URL || "https://ibc-clan.example").replace(/\/$/, ""); // TODO: set when domain bought
export default {
  url,
  isPlaceholderUrl: url.includes(".example"),
  indexable: process.env.SITE_INDEXABLE !== "false",  // previews → false → noindex + Disallow
  name: "Inglourious Basterds Clan",
  shortName: "IBC",
  lang: "pl",
  locale: "pl_PL",
  discord: { invite: "https://discord.gg/DhJwkeehJK" },
  defaultOgImage: "/assets/og/og-default.jpg",
  themeColor: "#080e11",
};
```

```js
// lib/filters.js (excerpt)
export const absoluteUrl = (path, base) => new URL(path, base + "/").href;
// JSON-LD must not break out of <script>: escape "<"
export const jsonLd = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c");
```

Eleventy also ships an `htmlBaseUrl` filter (`{{ "/x/" | htmlBaseUrl: site.url }}`) that takes `pathPrefix` into account. Prefer it if `pathPrefix` is used. Either way, keep it behind one filter name.

### Pattern 2: Front matter declares intent, the layout renders all SEO

**What:** Pages never write `<meta>` tags. They declare data, and `seo-head.njk` turns it into tags plus JSON-LD.

```njk
---
layout: layouts/page.njk
permalink: /dolacz/
title: "Jak dołączyć do IBC – rekrutacja do klanu Arma 3 milsim"
description: "Wymagania, mody, harmonogram i kroki rekrutacji do IBC…"   # TODO confirm
ogImage: /assets/og/og-dolacz.jpg      # optional; falls back to site.defaultOgImage
schema: ["faq"]                        # extra JSON-LD nodes for this page
breadcrumb: { parent: "/" }
---
```

```njk
{# _includes/partials/seo-head.njk (excerpt) #}
{% set canonical = page.url | absoluteUrl(site.url) %}
<title>{{ title }}{% if page.url != "/" %} | {{ site.shortName }}{% endif %}</title>
<meta name="description" content="{{ description }}">
<link rel="canonical" href="{{ canonical }}">
{% if not site.indexable or noindex %}<meta name="robots" content="noindex">{% endif %}
<meta property="og:locale" content="{{ site.locale }}">
<meta property="og:url" content="{{ canonical }}">
<meta property="og:image" content="{{ (ogImage or site.defaultOgImage) | absoluteUrl(site.url) }}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{{ schemaGraph(page, site, collections, faq, operations) | jsonLd | safe }}</script>
```

**When to use:** Every page.
**Trade-offs:** None worth mentioning at this size. The alternative, per-page `<head>` blocks, is how the duplicated-meta and relative-OG bugs crept in.

### Pattern 3: One data source, two renderings (visible HTML + JSON-LD)

**What:** The FAQ answers, operation schedule and breadcrumbs are defined once in `_data/`. The page template loops over them to render visible HTML. `lib/schema.js` maps the same objects to `FAQPage`, `Event` and `BreadcrumbList`.
**When to use:** Any structured data. Google requires structured data to match visible content, and generating both from one source makes mismatches impossible.
**Trade-offs:** Copy now lives in JSON, which is slightly less pleasant to edit than HTML. Keep answer strings short. Allow simple inline HTML in answers, rendered with `| safe`, and strip it for JSON-LD.

```js
// lib/schema.js (shape)
export function schemaGraph(page, site, data) {
  const org = { "@type": "Organization", "@id": `${site.url}/#org`, name: site.name,
                url: `${site.url}/`, logo: `${site.url}/assets/favicon/icon-512.png`,
                sameAs: [site.discord.invite] };
  const graph = [org, website(site), breadcrumbs(page, site, data.navigation)];
  if (page.data?.schema?.includes("faq")) graph.push(faqPage(data.faq));
  if (page.data?.schema?.includes("events")) graph.push(...events(data.operations, site));
  return { "@context": "https://schema.org", "@graph": graph.filter(Boolean) };
}
```

Note for the features and pitfalls research: since August 2023 Google shows FAQ rich results only for authoritative government and health sites. FAQPage markup is harmless and still helps parsers, but it will not produce a rich result for IBC. `Event` only qualifies for real, dated occurrences (`startDate`, `eventAttendanceMode: OnlineEventAttendanceMode`, `location: VirtualLocation`). A recurring "every Saturday" schedule has no first-class representation.

### Pattern 4: Authors write plain `<img>`, the build makes it responsive

**What:** `eleventyImageTransformPlugin` post-processes every `<img>` in the output into `<picture>` with AVIF/WebP/JPEG `srcset` and intrinsic `width`/`height`. Per-image overrides use attributes: `eleventy:widths`, `eleventy:formats`, `eleventy:ignore`, `eleventy:output`, and `eleventy:pictureattr:NAME`.

```js
// eleventy.config.js (excerpt)
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
  formats: ["avif", "webp", "jpeg"],
  widths: [480, 960, 1600],
  htmlOptions: { imgAttributes: { loading: "lazy", decoding: "async", sizes: "(min-width: 992px) 33vw, 100vw" } },
});
```

```html
<!-- hero: LCP image. Opt out of lazy, raise priority -->
<img src="/assets/img/hero.jpg" alt="" class="hero-media" loading="eager" fetchpriority="high"
     sizes="100vw" eleventy:widths="640,1280,1920">
```

**Gaps the transform does not cover** (it only touches `<img>`/`<picture>`, not CSS `url()` or `data-*`). Each needs an architectural decision:
1. **Hero background** is currently a CSS `background-image` (`style.css:384`, 4.7 MB JPEG). Convert it to a real `<img>` that is absolutely positioned with `object-fit: cover`, and draw the gradient overlay with a pseudo-element. That gets it optimized and makes it a discoverable LCP element.
2. **Lightbox full-size** currently comes from `data-src` and is not transformed. Instead, have the lightbox clone the clicked thumbnail's `<picture>` and set `sizes="100vw"`, so the browser picks the 1600w candidate from the same `srcset`. No second pipeline and no `data-src` are needed.
3. **OG image** must have a stable, absolute, non-hashed URL. It is never referenced by `<img>`, so passthrough-copy a pre-made 1200×630 JPEG from `assets/og/`.
4. **Favicons and manifest icons** are also passthrough copied.
5. **`logo.png`** is 885 KB displayed at 48×48. Replace it with an SVG or let the transform emit `eleventy:widths="48,96"`.

### Pattern 5: JS = one module entry, features loaded by DOM hook

**What:** `<script type="module" src="/js/main.js">` goes in `base.njk`. Module scripts are deferred by default. `main.js` always initializes nav and lazily `import()`s feature modules only when their hook exists. Hooks are `data-js="…"` attributes, not styling classes, so the CSS refactor and visual refresh cannot break behaviour.

```js
// src/js/main.js
import { initNav } from "./modules/nav.js";
initNav();
const features = {
  lightbox: () => import("./modules/lightbox.js"),
  terminal: () => import("./modules/terminal.js"),
  scrollspy: () => import("./modules/scrollspy.js"),
  "easter-egg": () => import("./modules/easter-egg.js"),
};
for (const [hook, load] of Object.entries(features)) {
  const els = document.querySelectorAll(`[data-js="${hook}"]`);
  if (els.length) load().then((m) => m.init(els));
}
```

Config never lives in JS. The terminal's Discord link is read from `data-discord-url="{{ site.discord.invite }}"` on its container, which removes the third copy of the invite URL.
**Trade-offs:** No bundler means 2–3 extra small requests on pages with features, which is negligible over HTTP/2 at roughly 10 KB of total JS. Add `<link rel="modulepreload">` for `nav.js` if Lighthouse flags the chain. Do **not** add esbuild or Vite unless JS grows past about 50 KB.

### Pattern 6: CSS partials bundled at build time, one stylesheet at runtime

**What:** `src/css/main.css` contains only `@import "_tokens.css";` and similar lines. An Eleventy custom extension runs Lightning CSS `bundle({ filename, minify: true })` to inline the imports, so the browser receives one minified render-blocking file. Today's render-blocking Google Fonts `@import` (`style.css:1`) is removed. Fonts become self-hosted `@font-face` in `_fonts.css` with relative `url("../fonts/…")`, so `pathPrefix` does not matter, plus `<link rel="preload">` for the one or two critical woff2 files.

```js
// eleventy.config.js (excerpt, adapted from the official Sass recipe pattern)
import path from "node:path";
import { bundle } from "lightningcss";
eleventyConfig.addTemplateFormats("css");
eleventyConfig.addExtension("css", {
  outputFileExtension: "css",
  compile: async function (_content, inputPath) {
    if (path.basename(inputPath).startsWith("_")) return; // partials are not emitted
    return async () => bundle({ filename: inputPath, minify: true }).code.toString();
  },
});
```

**Trade-offs:** A change to a `_partial.css` must trigger a rebuild of `main.css` in watch mode. Register the imports with `this.addDependencies(inputPath, [...])` (`bundle()` reports them) or add a watch target. This is minor dev ergonomics only.

### Pattern 7: Roster = build-time data with an adapter and a committed fallback

**What:** The Discord bot (owned by a friend) publishes JSON at a URL. `_data/roster.js` fetches it at build time with `@11ty/eleventy-fetch` (disk-cached in `.cache/`; per the docs an expired cache entry is reused when the network fails). It then validates the payload and **maps it to an internal `Member` shape**. If both the fetch and the cache fail, or validation fails, it falls back to the committed `roster.snapshot.json` and logs a warning. The build never breaks because of the bot.

```js
// src/_data/roster.js
import Fetch from "@11ty/eleventy-fetch";
import snapshot from "./roster.snapshot.json" with { type: "json" };

const toMember = (raw) => ({            // ADAPTER: the only code that knows the bot's format
  name: String(raw.displayName ?? raw.name ?? "").trim(),
  rank: raw.rank ?? null,
  unit: raw.unit ?? raw.squad ?? "Nieprzydzieleni",
  roles: Array.isArray(raw.roles) ? raw.roles : [],
});

export default async function () {
  const url = process.env.ROSTER_URL;
  if (!url) return { members: snapshot.members, source: "snapshot", updated: snapshot.updated };
  try {
    const json = await Fetch(url, { duration: "1h", type: "json" });
    const members = (json.members ?? []).map(toMember).filter((m) => m.name);
    if (!members.length) throw new Error("empty roster");
    return { members, source: "bot", updated: json.updatedAt ?? new Date().toISOString() };
  } catch (e) {
    console.warn(`[roster] falling back to snapshot: ${e.message}`);
    return { members: snapshot.members, source: "snapshot", updated: snapshot.updated };
  }
}
```

**Why build-time and not client fetch:** The roster page exists for indexability and first impressions. Client-fetched content renders late, needs CORS and an always-on public bot endpoint, and adds a layout-shift and loading state. It also exposes the endpoint, and a request-time failure leaves the page empty. Build-time output is plain HTML and needs no secrets in the browser. Freshness equals deploy frequency, which is acceptable for a clan roster.
**Optional later enhancement:** A small `roster-live.js` module that re-fetches the same public JSON and updates counts and the "last updated" stamp in place. Treat it as progressive enhancement only, and only if the bot serves CORS. Do not build it in the first version.
**Contract first:** Agree on a minimal JSON shape with the friend before building the page (for example `{ updatedAt, members: [{ displayName, rank, unit, roles }] }`). Develop against a fixture so the phase is not blocked by the bot. Only the adapter function changes if the format drifts. Privacy: publish display names and in-clan ranks only. No Discord user IDs, and no avatars hot-linked from `cdn.discordapp.com`, because their hashes rotate and consent is unclear. If the bot API needs a token, it lives only in the build environment (`ROSTER_TOKEN`) and never appears in `_data` output or client JS.

---

## Data Flow

### Build-Time Flow (the important one)

```
env: SITE_URL, PATH_PREFIX, SITE_INDEXABLE, ROSTER_URL(+TOKEN)
          │
          ▼
_data/site.js ─┬─────────────────────────────────────────────┐
_data/navigation.js ─┐                                       │
_data/faq|operations|gallery.json ─┐                         │
_data/roster.js ──(fetch → .cache → adapter → fallback)─┐    │
                                   ▼                    ▼    ▼
                     ┌───────── Eleventy DATA CASCADE ─────────┐
                     │ global data < layout FM < page FM       │
                     └───────────────┬─────────────────────────┘
                                     ▼
 page.njk (front matter: title, description, ogImage, schema, breadcrumb)
     │ extends
     ▼
 layouts/base.njk ──includes──▶ seo-head.njk ──calls──▶ lib/schema.js (JSON-LD @graph)
                  ──includes──▶ header/footer/breadcrumbs (navigation, aria-current)
                  ──includes──▶ discord-cta (site.discord.invite)
     │ rendered HTML
     ▼
 HTML TRANSFORMS: eleventy-img (<img>→<picture>, writes /img/*) → HTML base (pathPrefix)
     │
     ▼
 _site/**.html ◀── sitemap.xml / robots.txt / webmanifest (from site + collections.all)
 _site/css/main.css ◀── Lightning CSS bundle(src/css/main.css + _partials)
 _site/js/**  ◀── passthrough   _site/assets/{fonts,favicon,og} ◀── passthrough
     │
     ▼
 scripts/check-seo.js  ──fail build on violations──▶  user deploys _site/
```

The direction is strictly one-way. Data flows into templates and templates flow into HTML. Nothing in `_site/` is ever edited by hand. Templates never compute facts such as URLs or invite links; they read them.

### Runtime Flow

```
Browser GET /dolacz/
  → static HTML (complete content, meta, JSON-LD)   ← search engines stop here
  → /css/main.css (1 blocking file) + preloaded woff2
  → /js/main.js (module, deferred) → nav.js
        → [data-js] hooks present? → import(lightbox|terminal|scrollspy|easter-egg)
  → <picture> lazy images (AVIF/WebP)
No runtime API calls. Discord = plain outbound link.
```

### Key Data Flows

1. **Site URL change (domain purchased):** Edit one value (`site.js` default or the `SITE_URL` env var), then rebuild. The canonical, OG, Twitter, sitemap, robots, manifest `start_url` and JSON-LD `@id`s all update. Verify with `check-seo.js`, which asserts that every canonical starts with `site.url`.
2. **Nav change / new page:** Add the page file and an entry in `navigation.js`. The header, footer, breadcrumbs, BreadcrumbList JSON-LD and sitemap all pick it up. Pages are in `collections.all` automatically. Opt out with `eleventyExcludeFromCollections: true` or `sitemap: false`.
3. **FAQ edit:** Edit `faq.json`. The visible accordion and the FAQPage JSON-LD stay in sync.
4. **Roster refresh:** Rebuild (manually, or later on a scheduled CI build). The adapter normalizes the data or falls back to the snapshot. `source` and `updated` are rendered on the page ("Stan na: …") so staleness is visible.
5. **Sitemap `lastmod`:** Use `date: git Last Modified` in front matter, which Eleventy supports, or omit `lastmod`. Do not use the default file date: in CI it is the checkout time, so every page looks modified on every build, and Google ignores unreliable `lastmod`. Git dates need a full clone (`fetch-depth: 0`) in CI.

---

## Suggested Build Order (migration-safe)

Dependencies decide the order. Each step leaves a deployable, visually unchanged or improved site.

```
1 Build scaffold (parity) ──▶ 2 Layout + config extraction ──┬─▶ 3 SEO head system + generated files
                                                             │
                                                             ├─▶ 4 Asset pipeline (CSS split, JS modules,
                                                             │      images, fonts, icons)
                                                             │
                              3 + 4 ──────────────────────────┴─▶ 5 New pages (Dołącz/FAQ, Operacje)
                                                                    + nav → multi-page, breadcrumbs
                                                                         │
                                                                         ▼
                                                              6 A11y + visual refresh (all pages)
                                                                         │
                                                                         ▼
                                                              7 Roster (contract → fixture → adapter → page)
```

| Step | What | Depends on | Safety check |
|------|------|-----------|--------------|
| **1. Scaffold at parity** | `package.json`, `eleventy.config.js`, move `index.html` to `src/index.njk` **verbatim** (verified: no Nunjucks-conflicting syntax), passthrough copy for `css/`, `js/`, `assets/`. `_site/` and `.cache/` go in `.gitignore`. Record baseline Lighthouse scores and screenshots first. | — | Diff `_site/index.html` against the old `index.html`; it should be identical. Visual check. Document the new deploy target (`_site/`) for the user. |
| **2. Layout + config extraction** | `site.js`, `navigation.js`, `base.njk`, header, footer, Discord CTA, icon shortcode. Convert relative asset paths (`assets/x`) to root-relative (`/assets/x`) so subpages work. Replace `<body id="hero">` with a real `#start`/`#top` target. Add the skip link and `<main id="main">`. | 1 | The home page renders the same. The Discord URL appears exactly once in `src/` (grep). |
| **3. SEO head system** | `seo-head.njk`, `lib/schema.js`, `absoluteUrl` and `jsonLd` filters, `sitemap.xml.njk`, `robots.txt.njk`, webmanifest, favicons, `404.njk`, `og-default.jpg`, `check-seo.js` wired into `npm run build`. | 2 (layout exists), `site.url` | `check-seo.js` passes. Rich Results Test / Schema validator on the built HTML (run locally, or paste the HTML). |
| **4. Asset pipeline** | CSS split into partials plus a Lightning CSS bundle. Self-hosted, subsetted fonts with latin-ext for Polish. Font Awesome replaced by SVG icons. Image transform. Hero converted to `<img>`. Lightbox reads `<picture>`. JS split into ES modules with `data-js` hooks and a shared modal helper. | 2 | Lighthouse Performance before and after. No visual regression. All JS features still work. |
| **5. New pages + multi-page nav** | `dolacz.njk` with `faq.json`, `operacje.njk` with `operations.json`, breadcrumbs, internal links (home CTA → `/dolacz/`). The header nav switches from `#anchors` to page URLs. Scroll-spy stays home-only. Footer links appear on every page. | 3 (so each new page is born with complete SEO), 4 (so new components use the split CSS and the image pipeline) | `check-seo.js` covers the new pages. The sitemap lists them. No broken internal links. |
| **6. A11y + visual refresh** | Polish the components across all pages: focus management in the modal helper, contrast, `prefers-reduced-motion` for overlays, the scanline effect and the terminal, and cheaper `backdrop-filter` on mobile. | 4 (CSS partials), 5 (all pages exist, so the refresh is done once) | Lighthouse Accessibility ≥ 90 on every page, plus keyboard walk-through. |
| **7. Roster** | Agree the data contract with the friend, then build the fixture snapshot, `roster.js` adapter, `jednostki.njk`, nav entry and (optionally) an `ItemList`/`Person`-free schema. | 2–5 (layout, SEO, nav, CSS) plus an external bot | Build succeeds with `ROSTER_URL` unset (snapshot), set (bot), and set but broken (fallback plus warning). |

**Ordering rationale:**
- **Parity first (1 before 2).** Introducing the build tool and restructuring the HTML in one step makes regressions impossible to attribute. A verbatim move costs about an hour and proves the toolchain on its own.
- **Layout and config (2) gate everything.** SEO head, new pages and the asset pipeline all need the shared shell and `site.url`. Root-relative paths must be in place before any second page exists, or that page's assets 404.
- **SEO head (3) before new pages (5).** Every new page is then born with canonical, OG, JSON-LD and a sitemap entry. Retrofitting SEO onto finished pages is how inconsistencies happen.
- **Asset pipeline (4) before new pages and the visual refresh.** Splitting a 1448-line CSS file while also adding page styles or redesigning invites merge pain. Do the mechanical split first, then style on top of partials. Steps 3 and 4 are independent and can run in parallel.
- **Visual refresh (6) after the pages exist.** That way it is done once across the whole site, not re-done per page.
- **Roster last.** It has an external dependency. The adapter and fallback pattern lets it ship against a fixture even if the bot is late.

---

## Scaling Considerations

Realistic scale: 5–10 pages, a roster of tens to low hundreds of members, a few hundred visits per day at most. Traffic scaling is entirely the static host's job, and any CDN-backed host is effectively unlimited.

| Concern | Now (5 pages) | Later (≈20 pages, galleries, op recaps) |
|---------|---------------|------------------------------------------|
| Build time | Seconds. Image encoding dominates, and AVIF is slowest. | Keep the eleventy-img disk cache between builds. Cache `.cache/` in CI or images re-encode every build. Consider dropping AVIF for large galleries if builds get slow. |
| Repo size | ~25 MB of source images today (PNG screenshots of 3–5 MB) | Store originals at a sensible maximum (2400 px JPEG at q≈85) before committing. Optimized variants live only in `_site/`. |
| Content editing | JSON plus Nunjucks is fine for one or two editors | Op recaps as Markdown files in `src/operacje/*.md` (an Eleventy collection) instead of growing `operations.json` |
| Roster | Single page | Split per unit (`/jednostki/{unit}/`) through Eleventy pagination over the adapter output |

### Scaling Priorities

1. **First bottleneck: image processing time and source image weight.** Fix it by downsizing the originals once and persisting the image cache.
2. **Second bottleneck: content in JSON gets unwieldy.** Move recaps to Markdown collections. The architecture already supports this with no structural change.

---

## Anti-Patterns

### Anti-Pattern 1: Hand-writing `<head>` per page

**What people do:** Copy the `<head>` of `index.html` into each new page and tweak it.
**Why it's wrong:** Duplicate or mismatched descriptions, relative `og:image` (an existing bug), and canonicals that point at the wrong page or still hold the old domain after the purchase.
**Do this instead:** Pages declare front matter, and `seo-head.njk` is the only writer. Enforce it with `check-seo.js`.

### Anti-Pattern 2: Hard-coding the domain (or the Discord invite) anywhere but `site.js`

**What people do:** Paste `https://ibc…/` into JSON-LD, the sitemap or the robots file, or the invite URL into JS.
**Why it's wrong:** Switching domains becomes a grep-and-pray exercise, and missed spots leave canonicals pointing at a dead or staging origin.
**Do this instead:** Read from `site` in templates and from DOM `data-*` attributes in JS. The audit asserts that no own-site absolute URL differs from `site.url`.

### Anti-Pattern 3: Keeping relative asset paths when going multi-page

**What people do:** Leave `src="assets/logo.png"` and `href="css/style.css"` as they are.
**Why it's wrong:** On `/dolacz/` these resolve to `/dolacz/assets/…` and return 404. The home page looks fine, so it goes unnoticed.
**Do this instead:** Use root-relative paths everywhere in templates, let the HTML Base plugin apply `pathPrefix`, and use relative `url()` only inside CSS.

### Anti-Pattern 4: Client-side rendering of indexable content (especially the roster)

**What people do:** Ship an empty `<div id="roster">` and `fetch()` the bot API in the browser.
**Why it's wrong:** The content arrives late or not at all, depends on CORS and bot uptime, causes CLS, and makes the page that is meant to impress first-time visitors show a spinner or an error.
**Do this instead:** Build-time data with a committed fallback (Pattern 7). Live refresh can only be a later enhancement on top of already-rendered HTML.

### Anti-Pattern 5: Turning the JS into a framework or SPA during the split

**What people do:** Introduce a client router, a bundler and a component framework "while we're refactoring main.js".
**Why it's wrong:** This hurts Lighthouse, adds a build-tool surface, and gains nothing for five progressive enhancements on a static site.
**Do this instead:** Native ES modules, `data-js` hooks, lazy `import()`. Real page navigations (multi-page) replace the anchor-based single page.

### Anti-Pattern 6: Coupling JS to styling classes

**What people do:** Keep `document.querySelector('.gallery-item')` and `nav ul li a`.
**Why it's wrong:** The visual refresh renames or restructures classes and silently breaks the lightbox and menu.
**Do this instead:** Use `data-js="lightbox"` and `data-js-item` hooks that CSS never targets.

### Anti-Pattern 7: Relying on the image transform for non-`<img>` images

**What people do:** Expect the CSS `background-image` hero, `data-src` lightbox sources and `og:image` to be optimized automatically.
**Why it's wrong:** The transform only processes `<img>`/`<picture>`. The 4.7 MB hero and multi-MB lightbox PNGs would still ship.
**Do this instead:** Make the hero a real `<img>`, have the lightbox reuse the `<picture>` `srcset`, and keep OG and favicons as pre-sized passthrough files (Pattern 4).

### Anti-Pattern 8: Indexing a temporary origin

**What people do:** Deploy to `*.github.io/IBC-Website/` (or a preview URL) with `site.url` set to the future domain, or with indexing open on the temporary origin.
**Why it's wrong:** Either the canonicals point at a domain that does not resolve, or Google indexes the temporary origin and later has to consolidate duplicates.
**Do this instead:** `site.url` always equals the origin actually being served. Use `SITE_INDEXABLE=false` (giving `noindex` and `Disallow: /`) for throwaway previews. When the custom domain is attached, update `site.url`, rebuild, and rely on the host's 301 from the old origin; GitHub Pages does this automatically for custom domains. Then submit the sitemap in Search Console.

---

## Integration Points

### External Services

| Service | Integration pattern | Notes |
|---------|---------------------|-------|
| Discord (invite) | Plain outbound `<a href>` from `site.discord.invite`, rendered via `discord-cta.njk` | `rel="noopener"` on `target=_blank`. Invite expiry is a content risk, so check that the invite is permanent. |
| Discord bot (friend's) | **Build-time** HTTP GET of public JSON from `ROSTER_URL`, through eleventy-fetch with a 1h cache, adapter and snapshot fallback | Contract first. Token (if any) lives in the build env only. No IDs or avatars. LOW confidence until the bot exists. |
| Google Fonts | **Removed.** Self-host subsetted woff2 (latin + latin-ext) | Removes a render-blocking `@import` and a third-party request |
| Font Awesome CDN | **Removed.** Inline SVG through the `icon` shortcode | About 5 icons. The full CSS is currently loaded for them. |
| Static host (user's choice) | Upload or deploy `_site/` | Needs Node ≥ 22 if the host builds (eleventy-img 7). Must serve `404.html`. Directory-style URLs need no rewrites. |
| Google Search Console / Bing Webmaster | Manual: verify the domain, submit `/sitemap.xml` | After the domain purchase. A verification meta tag, if used, goes in `site.js` and `seo-head.njk`. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `_data/*` → templates | Eleventy data cascade (read-only) | Templates never fetch or compute facts. Data files never emit HTML. |
| templates → `lib/schema.js` | Filter or shortcode call with plain objects | `schema.js` is pure and unit-testable with `node --test` if desired |
| `roster.js` adapter ↔ bot JSON | The adapter function `toMember()` | The only code that knows the bot's format |
| HTML ↔ JS | `data-js` hooks plus `data-*` config attributes | JS never hard-codes URLs or selectors that CSS also uses |
| `src/css/_*.css` → `main.css` | Lightning CSS `@import` resolved at build | Only `main.css` is emitted. Partials share tokens through custom properties. |
| `_site/` → `check-seo.js` | Filesystem read after the build | It is a gate, not a transform. It never modifies output. |

---

## Sources

- npm registry, queried 2026-10-02 with `npm view` (HIGH, direct): `@11ty/eleventy` latest **3.1.6** (canary 4.0.0-alpha.10); `@11ty/eleventy-img` **7.0.0** (engines `node >=22`); `@11ty/eleventy-fetch` **5.1.3**; `lightningcss` **1.33.0**; `nunjucks` 3.2.4 (last published 2023, stable but in maintenance); `@quasibit/eleventy-plugin-sitemap` 2.2.0 (last published 2022, so I recommend a hand-written sitemap template instead); `astro` 7.3.5; `vite` 8.3.2.
- Eleventy Image docs, https://www.11ty.dev/docs/plugins/image/: HTML transform, `eleventy:*` attributes, path resolution, Node 22+ requirement for v7 (WebFetch, MEDIUM).
- Eleventy Fetch docs, https://www.11ty.dev/docs/plugins/fetch/: duration, `type: "json"`, expired-cache fallback on network failure, `.cache` in `.gitignore` (WebFetch, MEDIUM).
- Eleventy HTML Base plugin, https://www.11ty.dev/docs/plugins/html-base/: bundled since 2.0, `htmlBaseUrl` filter for absolute URLs, transformed attributes (WebFetch, MEDIUM).
- Eleventy global data, https://www.11ty.dev/docs/data-global/, and bundle plugin, https://www.11ty.dev/docs/plugins/bundle/ (WebFetch, MEDIUM).
- Eleventy / "Build Awesome" rename context: https://www.11ty.dev/blog/build-awesome/ and https://disassociated.com/font-awesome-cans-eleventy-renaming/. v4 is to ship as "Build Awesome v4", and the rename was paused. Pin `^3.1.6` (MEDIUM).
- Google, "Changes to HowTo and FAQ rich results" (Aug 2023), https://developers.google.com/search/blog/2023/08/howto-faq-changes, and FAQPage docs https://developers.google.com/search/docs/appearance/structured-data/faqpage (WebSearch, MEDIUM).
- schema.org `VirtualLocation` / `eventAttendanceMode`, https://schema.org/VirtualLocation (MEDIUM).
- Codebase facts: `.planning/codebase/ARCHITECTURE.md`, `STRUCTURE.md` and `CONCERNS.md`, plus direct inspection of `index.html`, `css/style.css` and `assets/` sizes (HIGH).

---
*Architecture research for: small multi-page static SEO site (IBC clan), migrating from single-page vanilla HTML*
*Researched: 2026-10-02*
