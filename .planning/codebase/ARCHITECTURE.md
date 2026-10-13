---
last_mapped_commit: 498f19eefca8ec513547073c1d87eb4bb2a09b7d
last_mapped_at: 2026-10-13
---
<!-- refreshed: 2026-10-13 -->

# Architecture

**Analysis Date:** 2026-10-13

## System Overview

```text
┌──────────────────────────────────────────────────────────────────┐
│                Build configuration (Node >=22.19, ESM)            │
│  `eleventy.config.js`  +  `src/_data/site.js` (env -> site config) │
└──────────────┬──────────────────────────┬────────────────────────┘
               │                          │
               ▼                          ▼
┌────────────────────────────┐  ┌──────────────────────────────────┐
│  Content + templates       │  │  Build-time library (`lib/`)     │
│  `src/*.njk` pages         │  │  images.js (eleventy-img)        │
│  `src/_data/*.js` data     │◄─┤  css.js (Lightning CSS bundle)   │
│  `src/_includes/` layout   │  │  js.js (content hash), schema.js │
│  `src/css/`, `src/js/`     │  │  seo.js, icons.js, dates.js,     │
└──────────────┬─────────────┘  │  discord.js                      │
               │ eleventy       └──────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  Static output `_site/` (HTML, css/style.css, js/, img/, assets/) │
└──────────────┬───────────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  Post-build gates: `scripts/check-seo.js` -> `scripts/check-perf.js`│
│  rules in `lib/check-seo.js`, `lib/check-perf.js`; failure moves   │
│  output to `_site.rejected/` (`lib/reject-output.js`)              │
└──────────────┬───────────────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  Browser: `/js/main.js` loader -> `src/js/modules/*.js` by data-js │
└──────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Eleventy config | Filters, shortcodes, global data, passthrough, dev-page preprocessor | `eleventy.config.js` |
| Site config | Single source of URL, pathPrefix, indexable flag, Discord invite, social links; validates env | `src/_data/site.js` |
| Content data | Gallery, join page FAQ/steps, operations, navigation, Discord badge | `src/_data/*.js` |
| Base layout | HTML shell, skip link, header/footer, module script with `?v=jsHash` | `src/_includes/layouts/base.njk` |
| Head partial | Meta, canonical, OG, JSON-LD, robots noindex, stylesheet `?v=cssHash` | `src/_includes/partials/head.njk` |
| Image pipeline | Encodes variants into `.cache/img/`, copied to `<output>/img/` | `lib/images.js` |
| CSS bundle | Lightning CSS bundle of `src/css/style.css` + partials, hashed | `lib/css.js`, `src/css/style.11ty.js` |
| JS version hash | sha256 over `src/js/**` for cache busting | `lib/js.js` |
| JSON-LD | Organization/WebSite graph (home), BreadcrumbList/FAQPage (subpages) | `lib/schema.js` |
| Index predicate | Which URLs are indexable (head, sitemap, gate share it) | `lib/seo.js` |
| Icons | Inline SVG paths for `{% icon %}` shortcode | `lib/icons.js` |
| SEO gate | Rules G0–G12 over build output | `lib/check-seo.js`, `scripts/check-seo.js` |
| Perf gate | Rules P0–P11 + BUDGET over build output | `lib/check-perf.js`, `scripts/check-perf.js` |
| Client loader | Maps `data-js` hooks to lazily imported modules | `src/js/main.js` |
| Client features | menu, lightbox, terminal, scroll-spy, easter-egg, discord-badge, hash-redirect | `src/js/modules/*.js` |

## Pattern Overview

**Overall:** Static site generator (Eleventy 3) with data-driven Nunjucks templates, build-time asset pipelines, post-build validation gates, and progressive-enhancement ES modules in the browser.

**Key Characteristics:**
- Single source of truth per fact: `src/_data/site.js` for URL/invite; `src/_data/join.js` feeds both visible FAQ and FAQPage JSON-LD.
- Build-time code lives in `lib/` (never rendered by Eleventy); CLIs in `scripts/` only run, never imported.
- Memoized per-build helpers (`getCssBundle`, `getJsHash`, `processImages`) reset in `eleventy.before`.
- Builds fail loudly: invalid env, unknown icon, bad ISO date, gate violations all throw / exit 1.
- No root-level legacy `index.html`/`css/`/`js/` remain; all source is under `src/`.

## Layers

**Configuration:**
- Purpose: Environment-driven build settings
- Location: `eleventy.config.js`, `src/_data/site.js`, `.nvmrc`, `package.json`
- Depends on: env vars `SITE_URL`, `PATH_PREFIX`, `SITE_INDEXABLE`, `ALLOW_LOCAL_SITE_URL`, `INCLUDE_DEV_PAGES`, `DISCORD_FETCH`
- Used by: every template, `lib/`, gates

**Data:**
- Purpose: Page content as JS modules
- Location: `src/_data/`
- Used by: templates, `lib/images.js` (imports `gallery.js`, `operations.js`)

**Templates:**
- Purpose: Pages and partials
- Location: `src/*.njk`, `src/_includes/`, `src/_dev/` (dev-only, `devOnly` front matter)
- Depends on: data, filters (`isIndexableUrl`, `schemaGraph`, `pageGraph`, `jsonLd`, `plDate`), shortcodes (`picture`, `icon`)

**Build library:**
- Location: `lib/`
- Contains: pure helpers and asset pipelines; Node built-ins plus eleventy-img / lightningcss

**Gates / scripts:**
- Location: `scripts/`
- Contains: `clean.js`, `check-seo.js`, `check-perf.js`, `warm-images.js`

**Client runtime:**
- Location: `src/js/` (passthrough-copied to `js/`)
- Contains: `main.js` loader and one module per feature exporting `init(el)`

## Data Flow

### Build Path (`npm run build`)

1. `scripts/clean.js` removes `_site/` (allow-list from `lib/reject-output.js`)
2. Eleventy loads `eleventy.config.js`, which imports `src/_data/site.js` (throws if `SITE_URL` missing in build mode)
3. `eleventy.before` resets CSS bundle and JS hash; global data `images`, `cssHash`, `jsHash` computed
4. Pages in `src/*.njk` render via `layouts/base.njk`; `src/css/style.11ty.js` emits `/css/style.css`
5. `eleventy.after` copies used image variants from `.cache/img/` to `_site/img/`
6. `scripts/check-seo.js` then `scripts/check-perf.js`; failure renames output to `_site.rejected/`

### Client Path

1. `base.njk` loads `<script type="module" src="/js/main.js?v=…">`
2. `src/js/main.js` scans `[data-js]`, looks up a frozen loader map (own keys only)
3. Imports `./modules/<name>.js` + same `?v=` and calls `mod.init(el)`

### Discord Badge

1. `src/_data/discordBadge.js` fetches invite counts once per process via `lib/discord.js` (skipped when `DISCORD_FETCH=0`), falling back to `site.discord.membersBackstop`
2. Fallback text baked into HTML; `src/js/modules/discord-badge.js` updates live in browser

**State Management:**
- Build: module-level memoization in `lib/css.js`, `lib/js.js`, `lib/images.js`, `src/_data/discordBadge.js`
- Client: closure state inside each module's `init`; DOM classes for visibility

## Key Abstractions

**Feature module contract:**
- Purpose: Progressive enhancement per hook
- Examples: `src/js/modules/menu.js`, `src/js/modules/lightbox.js`
- Pattern: `export function init(el)`; registered in `loaders` in `src/js/main.js`; markup carries `data-js="<name>"`

**Data-file-as-content:**
- Examples: `src/_data/join.js`, `src/_data/operations.js`, `src/_data/gallery.js`
- Pattern: default-exported objects/arrays; unconfirmed facts carry a `draft` field (FACTS marker, see `FACTS.md`)

**Gate rule module + CLI split:**
- Examples: `lib/check-seo.js` + `scripts/check-seo.js`
- Pattern: rules exported for tests; CLI runs unconditionally (no main-module guard)

## Entry Points

**Build:** `package.json` scripts `dev`, `build`, `test` -> `eleventy.config.js`
**Pages:** `src/index.njk` (/), `src/operacje.njk` (/operacje/), `src/jak-dolaczyc.njk` (/jak-dolaczyc/), `src/404.njk`, plus `src/robots.txt.njk`, `src/sitemap.xml.njk`, `src/site.webmanifest.njk`, `src/web.config.njk` (IIS)
**Browser:** `src/js/main.js`
**CI:** `.github/workflows/pages.yml` (npm test + build, deploys `_site/` to GitHub Pages on main)

## Architectural Constraints

- **Threading:** Single build process; tests spawn isolated Eleventy builds in parallel into `_test/<name>/` (`test/helpers.js`), hence `scripts/warm-images.js` as `pretest`.
- **Global state:** memoized singletons in `lib/css.js`, `lib/js.js`, `lib/images.js`, `src/_data/discordBadge.js`.
- **Circular imports:** None; `lib/images.js` imports from `src/_data/`, `src/_data/site.js` imports `lib/seo.js`.
- **Path prefix:** All URLs root-relative; `HtmlBasePlugin` rewrites them. CSS `url()` must be relative to output `css/style.css` (not rebased).
- **Indexability:** noindex by default; only `SITE_INDEXABLE=1` with https URL and `/` prefix allows indexing.
- **Output-only static:** no server runtime.

## Anti-Patterns

### Building module specifiers from attribute text

**What happens:** Tempting to `import('./modules/' + el.dataset.js)`.
**Why it's wrong:** Arbitrary module loading; breaks cache-busting.
**Do this instead:** Add a literal entry to the frozen `loaders` map in `src/js/main.js`.

### Hardcoding the site URL / Discord invite

**What happens:** Copying `https://discord.gg/...` or a domain into a template.
**Why it's wrong:** `site.js` is documented as the only literal copy.
**Do this instead:** Use `site.discord.invite`, `site.url` from `src/_data/site.js`.

### Passthrough-copying CSS or `.cache/img`

**Why it's wrong:** Bypasses the bundle/hash and can ship stale variants.
**Do this instead:** Add a partial `@import` in `src/css/style.css`; register images in `lib/images.js`.

## Error Handling

**Strategy:** Fail the build loudly; degrade gracefully only for network (Discord).

**Patterns:**
- `throw new Error` in config/data/lib on invalid input (`src/_data/site.js`, `lib/dates.js`, `lib/icons.js`, `lib/discord.js`)
- Gates exit 1 and move output to `<dir>.rejected`
- Client modules guard-clause and return when elements are missing

## Cross-Cutting Concerns

**Logging:** `process.stdout/stderr.write` in scripts; none in client.
**Validation:** env validation in `src/_data/site.js`; output validation in gates.
**Authentication:** Not applicable.

---

*Architecture analysis: 2026-10-13*
