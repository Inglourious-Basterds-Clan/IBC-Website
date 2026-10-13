---
last_mapped_commit: 498f19eefca8ec513547073c1d87eb4bb2a09b7d
last_mapped_at: 2026-10-13
---
# Codebase Structure

**Analysis Date:** 2026-10-13

## Directory Layout

```
IBC-Website/
├── .github/            # CI (workflows/pages.yml) and dependabot.yml
├── eleventy.config.js  # Eleventy 3 config (filters, shortcodes, passthrough)
├── package.json        # scripts: dev, build, test; ESM ("type": "module")
├── .nvmrc              # Node version for CI
├── FACTS.md            # Registry of unconfirmed content (draft markers)
├── README.md           # Usage, deploy (Wdrożenie), cutover checklist
├── lib/                # Build-time Node modules (never rendered)
├── scripts/            # CLIs run by npm scripts (clean, gates, warm-images)
├── src/                # Eleventy input
│   ├── _data/          # Global data (site, gallery, join, operations, navigation, discordBadge)
│   ├── _includes/      # layouts/base.njk, partials/*.njk
│   ├── _dev/           # Dev-only test pages (devOnly front matter)
│   ├── assets/         # brand/, icons/, og/ (passthrough -> assets/)
│   ├── css/            # style.css entry + partials/, style.11ty.js emitter
│   ├── fonts/          # Self-hosted Montserrat woff2 + OFL.txt
│   ├── images/         # Source images processed by eleventy-img
│   ├── js/             # main.js loader + modules/
│   └── *.njk           # Pages and generated files
├── test/               # node:test suites, helpers.js, fixtures/
└── tools/              # One-off tooling (seo-images generator, fonts notes)
```

## Directory Purposes

**`lib/`:** build helpers — `images.js`, `css.js`, `js.js`, `schema.js`, `seo.js`, `icons.js`, `dates.js`, `discord.js`, `html.js`, `image-size.js`, `woff2.js`, `reject-output.js`, `check-seo.js`, `check-perf.js`.

**`scripts/`:** `clean.js`, `check-seo.js`, `check-perf.js`, `warm-images.js` — CLIs only, never imported.

**`src/_data/`:** content and config as default-exported JS. Key: `site.js`.

**`src/_includes/partials/`:** `head.njk`, `header.njk`, `footer.njk`, `breadcrumbs.njk`, `discord-cta.njk`.

**`src/css/partials/`:** `fonts`, `base`, `components`, `header`, `hero`, `sections`, `gallery`, `recruitment`, `pages`, `footer`, `responsive` — imported in cascade order by `src/css/style.css`.

**`src/js/modules/`:** `menu.js`, `lightbox.js`, `terminal.js`, `scroll-spy.js`, `easter-egg.js`, `discord-badge.js`, `hash-redirect.js`.

**`test/`:** one `*.test.js` per concern (build, seo, perf-gate, schema, modules, pages, links, fonts, images...); `helpers.js` builds into `_test/<name>/`.

**`tools/seo-images/`:** separate package (own `package.json`) generating OG/icons into `src/assets/`.

## Key File Locations

**Entry Points:**
- `eleventy.config.js`: build config
- `src/index.njk`, `src/operacje.njk`, `src/jak-dolaczyc.njk`, `src/404.njk`: pages
- `src/js/main.js`: client entry

**Configuration:**
- `src/_data/site.js`: URL, pathPrefix, indexable, Discord, social
- `src/_data/navigation.js`: header/footer nav
- `.github/workflows/pages.yml`: CI/deploy
- `src/web.config.njk`: IIS config for final host

**Core Logic:**
- `lib/images.js`, `lib/css.js`, `lib/schema.js`, `lib/check-seo.js`, `lib/check-perf.js`

**Testing:**
- `test/helpers.js`, `test/*.test.js`, `test/fixtures/`

## Naming Conventions

**Files:** kebab-case (`check-seo.js`, `discord-cta.njk`, `scroll-spy.js`); page templates use Polish slugs matching the URL (`jak-dolaczyc.njk` -> `/jak-dolaczyc/`).
**Data files:** camelCase key names (`discordBadge.js` -> `discordBadge` global).
**Directories:** lowercase; Eleventy-special dirs prefixed `_` (`_data`, `_includes`, `_dev`).
**Versioned assets:** `og-default-v1.jpg` — bump suffix to bust caches.

## Where to Add New Code

**New page:**
- Template: `src/<polish-slug>.njk` with `layout: layouts/base.njk`, `title`, `description`, `permalink`, `breadcrumb`
- Content data: `src/_data/<name>.js`
- Nav entry: `src/_data/navigation.js`
- Styles: `src/css/partials/pages.css` or new partial imported in `src/css/style.css`
- Tests: `test/pages.test.js` or new `test/<name>.test.js`

**New client feature:**
- `src/js/modules/<name>.js` exporting `init(el)`; add literal loader in `src/js/main.js`; mark markup with `data-js="<name>"`; test in `test/modules.test.js`/`test/client.test.js`

**New image:** file in `src/images/`, register in `lib/images.js` (or via `gallery.js`/`operations.js`), render with `{% picture images.<key>, {...} %}`.

**New icon:** add path to `lib/icons.js`, use `{% icon "name" %}`.

**Build helper:** `lib/<name>.js` (Node built-ins preferred); CLI wrapper in `scripts/` if needed.

**Gate rule:** `lib/check-seo.js` or `lib/check-perf.js` (BUDGET), plus tests in `test/seo-gate.test.js` / `test/perf-gate.test.js`.

## Special Directories

**`_site/`:** build output — Generated: Yes, Committed: No
**`_site.rejected/`:** gate-rejected output — Generated: Yes, Committed: No
**`_test/`:** per-test build outputs — Generated: Yes, Committed: No
**`.cache/img/`:** content-addressed image variants — Generated: Yes, Committed: No
**`src/_dev/`:** dev-only pages, excluded from production builds unless `INCLUDE_DEV_PAGES=1` — Committed: Yes
**`.planning/`:** GSD planning artifacts — Committed: Yes

---

*Structure analysis: 2026-10-13*
