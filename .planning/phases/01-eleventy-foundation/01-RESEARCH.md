# Phase 1: Eleventy Foundation - Research

**Researched:** 2026-10-02
**Domain:** Brownfield migration of a single static `index.html` into Eleventy 3.1.x + Nunjucks with a shared layout, single-source config, pathPrefix support and a GitHub Pages Actions deploy
**Confidence:** HIGH. The core claims were run in a local smoke build: Eleventy 3.1.6 on Node 26.7 / Windows 11, in this session's scratchpad. Workflow action versions come from the GitHub releases API. A few UI-fit details are ASSUMED and listed in the Assumptions Log.

## Summary

The migration is low-risk. `index.html` contains no `{{`, `{%` or `{#` sequences (re-checked this session: `grep -c` returned 0), so it can become `src/index.njk`. The project-level research (`.planning/research/STACK.md`, `ARCHITECTURE.md`) already fixes the stack. This research checks the **Phase 1 mechanics** against real Eleventy 3.1.6 behaviour, and the checks turned up six things the planner must handle:

1. **The HTML Base plugin does not rewrite everything.** It rewrites `a[href]`, `link[href]`, `script[src]`, `img[src|srcset]`, `source` and similar. It does **not** rewrite `data-*` attributes, inline `style="…url()"` or `<meta content>` (except `http-equiv=refresh`). The gallery's `data-src` and the `og:image` must use the `htmlBaseUrl` filter explicitly. [VERIFIED: smoke build + `node_modules/@11ty/posthtml-urls/lib/defaultOptions.js`]
2. **Under a pathPrefix, the base plugin turns `<img src="">` into `<img src=".">`.** The lightbox's placeholder `<img src="" alt="Lightbox image">` would then request the page URL as an image. Drop the empty `src` attribute. [VERIFIED: smoke build]
3. **Git Bash path mangling.** `PATH_PREFIX=/IBC-Website/ npx eleventy` in Git Bash produced `href="c:/C:/Program%20Files/Git/IBC-Website/css/style.css"` (MSYS converts env values that look like POSIX paths). Inline env vars in Git Bash need `MSYS_NO_PATHCONV=1`. Tests must set env through Node's `spawnSync({ env })`, never through a shell. [VERIFIED: smoke build]
4. **Eleventy never cleans `_site/`.** A dev-only page written by `npm run dev` survives a later `npm run build`. The build script must delete `_site/` first, or the dev layout test page will be deployed from a local build. [VERIFIED: smoke build]
5. **The official `addPreprocessor` "drafts" pattern works** for the dev-only layout page. `ELEVENTY_RUN_MODE` is already set when `eleventy.config.js` imports `site.js`: `build` excludes the page, `serve` includes it, and `INCLUDE_DEV_PAGES=1` forces it in for tests. [VERIFIED: smoke build + CITED: 11ty.dev/docs/config-preprocessors/]
6. **The Eleventy dev server honours pathPrefix.** It prints `Server at http://localhost:8091/IBC-Website/`, 302-redirects `/` to the prefix, and serves passthrough assets under it. So the subpath setup can be tested locally with `npm run dev` plus a PowerShell env var. [VERIFIED: smoke build]

**Primary recommendation:** Do it in two steps. First, a verbatim scaffold that is diff-identical to the old page. Second, layout and config extraction (`site.js` → base layout + partials → root-relative paths through `HtmlBasePlugin`, plus `htmlBaseUrl` for `data-src`/`og:image` → scroll-spy hash fix → terminal reads `data-discord-url`). Back it with a `node:test` suite that builds the site twice (root and `/IBC-Website/`) through `spawnSync` and checks links, config mutation and shared chrome. Capture the Lighthouse and screenshot baseline **before** any `git mv`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Pre-domain hosting & deploy
- **D-01:** Until a domain is bought, the site is hosted on **GitHub Pages under a subpath**: `https://inglourious-basterds-clan.github.io/IBC-Website/`. The `/IBC-Website/` pathPrefix is a real production setup, not just a test case. (Phase 2's noindex guard must treat this host as non-final.)
- **D-02:** Add a **GitHub Actions workflow** (`.github/workflows/`) that runs `npm ci && npm run build` on push to `main` and publishes `_site/` to GitHub Pages (Pages-from-Actions). The user accepted this, even though it slightly crosses "hosting is out of scope". The README must say which repo setting to enable (Settings → Pages → Source: GitHub Actions). — **Reversibility:** reversible — delete the workflow file.
- **D-03:** **URL config through env vars.** `src/_data/site.js` defaults to local values (`url: http://localhost:8080`, `pathPrefix: "/"`) and reads `SITE_URL` / `PATH_PREFIX` from `process.env`. The Actions workflow sets `SITE_URL=https://inglourious-basterds-clan.github.io` and `PATH_PREFIX=/IBC-Website/`. Domain cutover = change the workflow env (or the defaults). The single-value rule (FOUND-03) still holds: no other file hardcodes a host.
- **D-04:** The same workflow also runs on **pull requests as a build-only check** (no deploy). Phase 2's SEO gate (`check-seo.js`) will plug into this job later.

#### Parity rules
- **D-05:** **Visual parity, invisible fixes allowed.** The home page must look and behave the same. Markup changes that multi-page/pathPrefix needs are allowed: root-relative asset paths through the HTML Base plugin, nav hrefs like `/#about`, the terminal reading the invite from a `data-discord-url` attribute (removes the 3rd copy of the invite), and replacing `<body id="hero">` with a real top anchor while keeping scroll-to-top and scroll-spy behaviour.
- **D-06:** The base layout adds a **skip link and `<main id="main">`** now. The skip link is visually hidden until focused, so parity holds. Phase 5 (A11Y-01) only verifies it.
- **D-07:** **Before any migration**, capture desktop and mobile screenshots plus mobile Lighthouse scores of the current site. Verify after migration with side-by-side screenshots and a manual checklist: hero, about, gallery lightbox (incl. keyboard), recruitment terminal, mobile menu, scroll-spy, footer easter egg. No automated visual-diff tooling.
- **D-08:** Out of Phase 1 scope even though they're "wrong" today: inline styles, the Font Awesome CDN, the Google Fonts `@import`, unoptimized images, meta keywords/SportsTeam JSON-LD. These stay as they are and are fixed in Phases 2/3.

#### Shared chrome
- **D-09:** **Navigation is data-driven** from `src/_data/navigation.js`. Items currently point to home anchors (`/#about`, `/#gallery`, `/#recruitment`, top), so they work from any page. On the home page they still scroll, and scroll-spy still works. Phase 4 switches entries to real pages by editing data only.
- **D-10:** **Shared Discord CTA = a compact "Discord" hud-btn in the header on every page** plus the existing footer Discord icon, all read from `site.discord.invite`. The home terminal keeps its big "Wejdź na Discord" button (same config value). The CTA never depends on the terminal animation.
- **D-11:** The header Discord button is **added to the home page now**. The user accepted this one visible change to the home page in Phase 1. Style it with existing tokens/`.hud-btn` so it fits the current look. It must also work in the mobile header/menu.
- **D-12:** Prove success criterion 4 with a **dev-only layout test page** (e.g. `src/_dev/layout-test.njk`: front matter + body only). It renders in dev/CI checks and is **excluded from production output** (never deployed, never in a future sitemap).

#### Repo layout
- **D-13:** **`src/` is the Eleventy input.** `index.html` → `src/index.njk`, and `css/`, `js/`, `assets/` move into `src/` with `git mv` (history is kept). The old root copies are deleted. The repo root keeps only config (`package.json`, `eleventy.config.js`, `.nvmrc`, `.gitignore`), docs, `LICENSE`, `.planning/`, `.github/`. `_site/`, `node_modules/` and `.cache/` are gitignored. — **Reversibility:** costly — moving back touches every path and the deploy workflow.
- **D-14:** **Delete the empty `api/` dir.** Leave the unused roster/calendar CSS/markup alone. Phase 3's CSS split removes it.
- **D-15:** **Add a Polish `README.md`**: requirements (Node 24 LTS), `npm run dev` / `npm run build`, the deploy folder is `_site/` (no longer the repo root), where `SITE_URL` / `PATH_PREFIX` / the Discord invite live, how the Pages workflow deploys, and the one-time Pages setting.

#### Already locked (from PROJECT.md / research, not re-discussed)
- Eleventy `~3.1.6` + Nunjucks; Node 24 LTS (`engines >=22.19`). No Astro, no Eleventy v4 alpha.
- `src/_data/site.js` is the single source for url, pathPrefix, name, Discord invite.
- Slugs fixed forever: `/jak-dolaczyc/`, `/operacje/`, `/sklad/`. Directory-style URLs with trailing slash.
- Keep the vanilla CSS/JS; no frameworks, Tailwind or Sass.

### Claude's Discretion
- Exact file/partial names under `src/_includes/` (e.g. `layouts/base.njk`, `partials/header.njk`, `partials/footer.njk`, `partials/discord-cta.njk`).
- How to exclude the dev test page in production (env check in a computed `permalink`, `eleventyExcludeFromCollections` + ignore, etc.).
- Using `npm` scripts vs extra tooling; whether to keep `js/main.js` as a classic script or change `type` (module split is Phase 3, so the minimal change is preferred).
- Whether the `htmlBaseUrl` filter or the HTML Base transform handles the pathPrefix.
- Workflow details (actions versions, Node version pin, caching).

### Deferred Ideas (OUT OF SCOPE)
None. The discussion stayed within phase scope. (Possible later addition: a `/discord/` redirect page, mentioned in research. Not discussed, not in scope.)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Site builds with Eleventy 3.1.x into static files in `_site/`, and the deploy steps are documented | Standard Stack; Pattern 1 (config); the clean-before-build pitfall; Pattern 7 (workflow); README contents list |
| FOUND-02 | Home page renders with the same content and look as before the migration | Two-step migration (verbatim first); baseline capture procedure; Pitfalls 2, 5, 6, 7; structural parity test |
| FOUND-03 | Site URL is set in one value (`SITE_URL`), and every absolute URL comes from it | Pattern 2 (`site.js`); `og:image` through `htmlBaseUrl(site.url)`; SITE_URL mutation test |
| FOUND-04 | Discord invite link is defined once and used everywhere | `site.discord.invite`; `data-discord-url` terminal change; one-literal grep test |
| FOUND-05 | All pages share one layout: header, nav, footer and Discord CTA | Pattern 3 (layout + partials); Pattern 4 (nav data); dev-only test page via preprocessor; shared-chrome equality test |
| FOUND-06 | Internal links work both at a domain root and under a subpath (pathPrefix, e.g. GitHub Pages) | HtmlBasePlugin coverage table; `htmlBaseUrl` for `data-src`; empty-`src` pitfall; dual-build link resolver test; dev server under prefix |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

`.claude/CLAUDE.md` was written before this migration. Several of its "Technology Stack" lines ("No build step required", "No package.json") describe the **current** state and are superseded by locked decision D-13 and PROJECT.md ("A light build step … is acceptable, but output must be plain static files"). These directives still apply:

- **Hosting:** output must be plain static files deployable to any static host. Eleventy satisfies this.
- **Language:** Polish only. Any new visible text, including the README (D-15), the header CTA label and skip link text, is Polish.
- **Domain:** the site URL must be a single config value.
- **JS conventions:** vanilla JS, no framework. camelCase verb-first function names (`init*`, `open*`). `const`/`let` only, no `var`. Guard clauses with early return. `DOMContentLoaded` entry point. Section headers `/* --- NAME --- */`. No console logging in production code.
- **CSS conventions:** kebab-case semantic class names. Colours only through `:root` custom properties (`--accent-color` etc.). State modifiers like `.active` and `.open`. No preprocessors or frameworks.
- **HTML:** semantic landmarks. Keep the existing `aria-*` attributes. Images keep `alt` and dimensions.
- **GSD workflow enforcement:** file changes happen through `/gsd-execute-phase`.
- **Out of scope here (D-08), even though CLAUDE.md lists them as current stack:** the Font Awesome CDN and the Google Fonts `@import` stay in Phase 1.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Site URL / pathPrefix / Discord invite config | Build time (`src/_data/site.js` + env) | CI (workflow env) | One value, read by templates at build time. CI only overrides through env |
| pathPrefix URL rewriting | Build time (HtmlBasePlugin transform + `htmlBaseUrl` filter) | — | Static output. Nothing is resolved at runtime |
| Shared header/nav/footer/CTA | Build time (Nunjucks layout + includes) | — | Rendered into each HTML file. No client includes |
| Navigation entries | Build time data (`src/_data/navigation.js`) | — | Phase 4 changes data only |
| Scroll-spy, lightbox, terminal, easter egg, mobile menu | Browser (`src/js/main.js`, classic script) | — | Progressive enhancement. Reads config from DOM `data-*` attributes, never constants |
| Dev-only layout page exclusion | Build time (`addPreprocessor`) | Test harness (`INCLUDE_DEV_PAGES=1`) | Production builds never emit it |
| Deploy | CI (GitHub Actions → Pages) | Static host (any) | `_site/` is the artifact. Pages is one consumer |
| Verification | Node test runner over built `_site` variants | Manual browser checklist (D-07) | Automatable structure and URL checks, plus human visual parity |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@11ty/eleventy` | 3.1.6 (pin `~3.1.6`) | SSG: Nunjucks layouts, global data, passthrough copy, HtmlBasePlugin, dev server | Locked decision. `latest` dist-tag, published 2026-06-02, `engines.node >=18`. Canary is `4.0.0-alpha.10` and must not be used [VERIFIED: npm registry `npm view` this session] |
| Nunjucks | bundled (`nunjucks ^3.2.4` dep of Eleventy) | Template language | Locked decision [VERIFIED: `npm view @11ty/eleventy dependencies`] |
| `HtmlBasePlugin` | bundled with Eleventy | Rewrites root-relative URLs with `pathPrefix` | Official. Must be added explicitly with `addPlugin` [CITED: 11ty.dev/docs/plugins/html-base/] [VERIFIED: smoke build] |
| `@11ty/eleventy-dev-server` | 2.0.8 (bundled) | `npm run dev` with live reload, serves under pathPrefix | Bundled [VERIFIED: npm registry, smoke build] |
| Node.js | CI: 24 LTS via `.nvmrc`; local 26.7 works | Build runtime | Locked. `engines: ">=22.19"` [VERIFIED: `node --version` = v26.7.0 locally] |

### Supporting (no install, built into Node)
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `node:test` + `node:assert/strict` | Node built-in | Automated phase checks (build, links, config mutation, shared chrome) | Every task commit. No test dependency needed [VERIFIED: smoke test passed on Node 26.7] |
| `node:child_process.spawnSync` | Node built-in | Run Eleventy with a per-test env and `--output` dir | Avoids shell env syntax (cmd.exe vs bash) and MSYS path mangling [VERIFIED: smoke test] |
| `lighthouse` (via `npx`, not installed) | 13.5.0 | D-07 baseline and after scores | Baseline capture only. `engines >=22.19` [VERIFIED: npm registry; ran successfully this session] |
| Chrome headless CLI | installed (`C:/Program Files/Google/Chrome/Application/chrome.exe`) | Viewport screenshots for D-07 | Baseline and after screenshots [VERIFIED: ran this session] |

### GitHub Actions (latest majors, GitHub releases API on 2026-10-02)
| Action | Latest | Use |
|--------|--------|-----|
| `actions/checkout` | v7.0.1 (2026-07-20) | `@v7` |
| `actions/setup-node` | v7.0.0 (2026-07-14) | `@v7` with `node-version-file: .nvmrc`, `cache: npm` |
| `actions/upload-pages-artifact` | v5.0.0 (2026-04-10) | `@v5`. Default `path: _site/`. Excludes dotfiles unless `include-hidden-files: true` |
| `actions/deploy-pages` | v5.0.1 (2026-09-01) | `@v5` |
| `actions/configure-pages` | v6.0.0 (2026-03-25) | Optional. Not needed, because env values are explicit (D-03) |

[VERIFIED: api.github.com/repos/actions/*/releases/latest this session.] The docs.github.com custom-workflow page still shows `@v4` examples. The docs lag the releases.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `addPreprocessor` dev-page exclusion | Computed `permalink: false` / `eleventyConfig.ignores` | The preprocessor is the documented "drafts" recipe and keys off front matter (`devOnly: true`). One rule covers any future dev page |
| `node:test` | Vitest/Jest + jsdom | Adds dependencies for checks that are file/string assertions. Not worth it in Phase 1 |
| Clean script `scripts/clean.js` | `rimraf` package, or an `eleventy.before` hook | Three lines of `fs.rmSync`, no dependency, works in cmd.exe and bash |
| `cross-env` for env in npm scripts | — | Not needed. Tests set env through `spawnSync`. Humans set env through PowerShell `$env:` or CI `env:` |

**Installation:**
```bash
npm install -D @11ty/eleventy@~3.1.6
```
Commit `package-lock.json`, because `npm ci` and the `setup-node` npm cache both need it.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@11ty/eleventy` | npm | 8+ yrs (created 2018-01-09) | ~244k/wk | github.com/11ty/eleventy | [OK] | Approved. No `postinstall` script |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none
`lighthouse@13.5.0` is run via `npx` for measurement only and is never added to `package.json`. It was already vetted in project STACK.md.

## Architecture Patterns

### System Architecture Diagram

```
 env (CI or shell)                 src/_data/site.js  ◀── single source: url, pathPrefix, discord.invite
 SITE_URL, PATH_PREFIX ──────────▶  (normalizes, defaults to localhost / "/")
 INCLUDE_DEV_PAGES                    │                      ▲
                                      │ imported by           │ global data
                                      ▼                      │
                          eleventy.config.js ── pathPrefix ──┘
                          (HtmlBasePlugin, passthrough, devOnly preprocessor)
                                      │
   src/index.njk ──┐                  ▼
   src/_dev/*.njk ─┼─▶ preprocessor: devOnly && runMode=build && !INCLUDE_DEV_PAGES ? drop : keep
                   │                  │
                   ▼                  ▼
        layouts/base.njk ◀── partials/head, header (navigation.js + CTA), footer (+easter egg overlay)
                   │ rendered HTML (root-relative URLs; data-src & og:image via htmlBaseUrl)
                   ▼
        HtmlBasePlugin transform: "/x" → "{pathPrefix}x" on href/src/srcset
                   │
                   ▼
   _site/index.html  _site/css/ _site/js/ _site/assets/   (passthrough, CSS url() stays relative)
                   │
        ┌──────────┴───────────┐
        ▼                      ▼
  npm test (node:test)    GitHub Actions: PR → build+test only
  builds root + prefix    push main → build+test → upload-pages-artifact → deploy-pages
  variants, asserts            │
                               ▼
                https://inglourious-basterds-clan.github.io/IBC-Website/
   Browser: main.js → menu, lightbox (data-src), terminal (data-discord-url), scroll-spy (link.hash), easter egg
```

### Recommended Project Structure
```
IBC-Website/
├── .github/workflows/pages.yml   # build on PR + push; deploy only on push to main
├── .nvmrc                        # 24
├── .gitignore                    # _site/ node_modules/ .cache/ _test/ + existing .planning/research/.cache/
├── eleventy.config.js            # ESM; imports src/_data/site.js for pathPrefix
├── package.json                  # private, type: module, engines, scripts
├── package-lock.json
├── README.md                     # Polish (D-15)
├── LICENSE
├── scripts/clean.js              # rm -rf _site (cross-platform)
├── test/
│   ├── helpers.js                # build(outDir, env) via spawnSync; collect html files
│   ├── build.test.js             # FOUND-01/03/04
│   ├── layout.test.js            # FOUND-02/05 (structure + shared chrome)
│   └── links.test.js             # FOUND-06 (root + /IBC-Website/ link resolution)
└── src/
    ├── _data/
    │   ├── site.js
    │   └── navigation.js
    ├── _includes/
    │   ├── layouts/base.njk
    │   └── partials/
    │       ├── head.njk           # current <head> content, parameterized
    │       ├── header.njk         # logo, nav from navigation.js, Discord CTA, menu toggle
    │       ├── discord-cta.njk    # compact header hud-btn
    │       └── footer.njk         # footer + decryption overlay (trigger lives in footer)
    ├── _dev/layout-test.njk       # devOnly: true; front matter + body only
    ├── index.njk
    ├── css/style.css              # git mv
    ├── js/main.js                 # git mv
    └── assets/…                   # git mv (all 9 files, unchanged)
```

### Pattern 1: ESM config that shares pathPrefix with `site.js`
**What:** The config imports the same data module, so `pathPrefix` has exactly one source.
```js
// eleventy.config.js — shape verified in smoke build (Eleventy 3.1.6)
import { HtmlBasePlugin } from "@11ty/eleventy";
import site from "./src/_data/site.js";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPassthroughCopy({ "src/css": "css", "src/js": "js", "src/assets": "assets" });

  // Dev-only pages (D-12): dropped from production builds, kept in serve/watch and in tests.
  eleventyConfig.addPreprocessor("devOnly", "*", (data) => {
    if (data.devOnly && !site.includeDevPages) return false;
  });
}

export const config = {
  dir: { input: "src", output: "_site" },
  pathPrefix: site.pathPrefix,
  htmlTemplateEngine: "njk",
  markdownTemplateEngine: "njk",
};
```
[VERIFIED: smoke build — `export const config` with `dir` + `pathPrefix` honoured; preprocessor excluded `_dev` page in `build`, included it in `serve` and with `INCLUDE_DEV_PAGES=1`]

### Pattern 2: `site.js`, the single source
```js
// src/_data/site.js
const url = (process.env.SITE_URL || "http://localhost:8080").replace(/\/+$/, "");
const rawPrefix = (process.env.PATH_PREFIX || "/").replace(/^\/+|\/+$/g, "");
const pathPrefix = rawPrefix ? `/${rawPrefix}/` : "/";

export default {
  url,                      // no trailing slash; absolute URLs = url + pathPrefix + page path
  pathPrefix,
  name: "Inglourious Basterds Clan",
  discord: { invite: "https://discord.gg/DhJwkeehJK" },   // the ONLY literal copy of the invite
  includeDevPages: process.env.ELEVENTY_RUN_MODE !== "build" || process.env.INCLUDE_DEV_PAGES === "1",
};
```
The invite value is quoted verbatim from `index.html:230`: `<a href="https://discord.gg/DhJwkeehJK" target="_blank" rel="noopener noreferrer" class="hud-btn active" …>`. The default URL and prefix come from D-03. [VERIFIED: index.html:230 read this session]
Prefix normalization matters. Without a leading slash, Eleventy still produced `/IBC-Website/` links (verified), but `htmlBaseUrl(site.url)` and future Phase 2 code read `site.pathPrefix` directly.

### Pattern 3: Base layout + partials; the page is front matter + body
```njk
{# src/_includes/layouts/base.njk #}
<!DOCTYPE html>
<html lang="pl">
<head>
  {% include "partials/head.njk" %}
</head>
<body>
  <a href="#main" class="skip-link">Przejdź do treści</a>
  <div class="grid-bg"></div>
  {% include "partials/header.njk" %}
  <main id="main">
    {{ content | safe }}
  </main>
  {% include "partials/footer.njk" %}
  <script src="/js/main.js"></script>
</body>
</html>
```
```njk
{# src/_dev/layout-test.njk — proves success criterion 4 #}
---
layout: layouts/base.njk
title: "Test layoutu"
devOnly: true
eleventyExcludeFromCollections: true
permalink: /_dev/layout-test/
---
<section class="section-container"><p>Strona testowa: tylko front matter i treść.</p></section>
```
- `partials/head.njk` reproduces the current `<head>`: `<title>{{ title or "IBC Clan // Wizytówka Taktyczna Arma 3" }}</title>`, description, FA CDN, preconnects, `/css/style.css`. Wrap `meta keywords` and the `SportsTeam` JSON-LD in `{% if page.url == "/" %}` so they stay on home only and Phase 2 deletes them in one place. `page.url` excludes the pathPrefix (verified: `pageurl=/` under `/IBC-Website/`).
- `og:image` changes from relative `assets/hero-bg.jpg` to `{{ "/assets/hero-bg.jpg" | htmlBaseUrl(site.url) }}`. A root-relative value in `<meta content>` is **not** rewritten by the base plugin, and a relative one breaks on any subpage. The filter output was verified as `https://inglourious-basterds-clan.github.io/IBC-Website/assets/hero-bg.jpg`. This is the one absolute own-site URL in Phase 1 and the thing the SITE_URL mutation test checks.
- The lightbox markup stays in `index.njk`, so it ends up inside `<main>`. It is `position: fixed` with `z-index: 110` (`css/style.css:790-799`), and `main`/`body` create no stacking context (`body { position: relative; min-height: 100vh; }`, no z-index). There is no visual change. [VERIFIED: css/style.css read this session]
- The decryption overlay goes into `footer.njk`. Its trigger `#easteregg-trigger` is in the footer on every page, and `initEasterEgg()` already guards the terminal log with `if (consoleEl)`.

### Pattern 4: Data-driven nav with hash links that work from any page
```js
// src/_data/navigation.js
export default [
  { label: "System", href: "/#hero" },
  { label: "O nas", href: "/#about" },
  { label: "Galeria", href: "/#gallery" },
  { label: "Rekrutacja", href: "/#recruitment" },
];
```
```njk
{# header.njk excerpt — reproduces index.html:60-67, plus initial active state on home only #}
<ul id="mobile-nav">
  {% for item in navigation %}
  <li><a href="{{ item.href }}"{% if page.url == "/" and loop.first %} class="active-nav"{% endif %}>{{ item.label }}</a></li>
  {% endfor %}
</ul>
```
Labels and hrefs are quoted from `index.html:62-65`: `<li><a href="#hero" class="active-nav">System</a></li>`, `<li><a href="#about">O nas</a></li>`, `<li><a href="#gallery">Galeria</a></li>`, `<li><a href="#recruitment">Rekrutacja</a></li>`. The footer links at `index.html:258-261` use the same four. [VERIFIED: index.html read this session]
- **Top anchor:** move `id="hero"` from `<body id="hero">` (`index.html:37`) onto `<section class="hero">` (`index.html:74`). `header` is `position: fixed` (`css/style.css:238-243`), so the hero section starts at document top 0 and `/#hero` still scrolls to the very top. Old shared `/#hero` links keep working. No CSS selects `#hero` (grep). The logo link becomes `href="/#hero"`.
- **Side effect to accept or note:** scroll-spy today observes `section, header`. The hero section has no id, and the fixed header never enters the `-30% 0px -60% 0px` band, so "System" is **never** re-highlighted after scrolling back up (it is set only by the initial class). With `id="hero"` on the section, scroll-spy re-highlights "System" at the top. This is an invisible-class fix that is consistent with D-05 ("keeping scroll-spy behaviour"). The planner should note it in the checklist. [VERIFIED: js/main.js:184-206 + css read; behaviour reasoning ASSUMED until checked in the browser]
- Hero buttons inside `index.njk` (`#recruitment`, `#about`) can stay fragment-only, because they only exist on home. The base plugin leaves `#…` alone (verified).

### Pattern 5: Scroll-spy compares hashes, scoped to same-page links
Current code (`js/main.js:193-198`, verbatim):
```js
const id = entry.target.getAttribute('id') || (entry.target.tagName === 'HEADER' ? 'hero' : '');
...
const href = link.getAttribute('href');
if (href === `#${id}`) link.classList.add('active-nav');
```
With `href="/IBC-Website/#about"` the exact match never succeeds. Replace it with:
```js
/* --- ACTIVE NAVIGATION HIGH-LIGHT ON SCROLL --- */
function initScrollSpy() {
  const sections = document.querySelectorAll('section, header');
  // Only links that point at this same document (home); on other pages scroll-spy is a no-op.
  const navLinks = Array.from(document.querySelectorAll('nav ul li a'))
    .filter(link => link.hash && link.pathname === window.location.pathname);

  if (navLinks.length === 0) return;
  // ... observer unchanged, except:
  //   if (link.hash === `#${id}`) link.classList.add('active-nav');
}
```
`HTMLAnchorElement.hash`/`.pathname` are resolved, so `/IBC-Website/#about` gives `hash === '#about'` and `pathname === '/IBC-Website/'`. [ASSUMED: standard DOM behaviour, verify in browser checklist]

### Pattern 6: Terminal reads the invite from the DOM
`js/main.js:174` (verbatim): `writeToConsole('Połączenie nawiązane: discord.gg/DhJwkeehJK', 'success');`. This is the third copy of the invite.
```njk
<div class="terminal-body" id="terminal-console" data-discord-url="{{ site.discord.invite }}">
```
```js
function initRecruitmentTerminal() {
  const consoleEl = document.getElementById('terminal-console');
  if (!consoleEl) return;
  const discordUrl = consoleEl.getAttribute('data-discord-url') || '';
  // ...pass discordUrl into runBootSequence(consoleEl, discordUrl)
}
// in runBootSequence:
writeToConsole('Połączenie nawiązane: ' + discordUrl.replace(/^https?:\/\//, ''), 'success');
```
The displayed text stays byte-identical (`discord.gg/DhJwkeehJK`). `writeToConsole` injects `message` through `innerHTML` (`js/main.js:156-160`). The value is build-time config, not user input, so risk is low. Even so, set the message span with `textContent` (see Security Domain).

### Pattern 7: Pages workflow (build on PR + push, deploy on push to main)
```yaml
# .github/workflows/pages.yml
name: Build and deploy
on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: pages-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      SITE_URL: https://inglourious-basterds-clan.github.io
      PATH_PREFIX: /IBC-Website/
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v5
        if: github.event_name != 'pull_request'
        with:
          path: _site/

  deploy:
    if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```
[CITED: docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages — permissions `pages: write` + `id-token: write`, env `github-pages`, `id: deployment`] [VERIFIED: action versions via GitHub API; `upload-pages-artifact` `action.yml` default `path: "_site/"` and dotfile exclusion]
- Elevated permissions apply only to the `deploy` job, which runs no npm code. The setup-node README recommends turning off caching where privileges are elevated, and this layout satisfies that.
- `npm test` runs before the deploy build. Tests write to `_test/`, not `_site/`, so they cannot pollute the artifact.
- Pages-from-Actions runs no Jekyll, so `_site/` and the `_dev`/underscore paths need no `.nojekyll`.

### Anti-Patterns to Avoid
- **Hand-prefixing `/IBC-Website/` anywhere.** Write root-relative `/x` and let the plugin or filter add the prefix.
- **Relative asset paths in templates** (`assets/logo.png`). They break on `/_dev/layout-test/` and on every Phase 4 page. Only CSS `url('../assets/…')` stays relative, because it resolves against `/css/style.css` (css/ and assets/ remain siblings in `_site/`).
- **Setting env inline in npm scripts** (`SITE_URL=… eleventy`). npm on Windows runs scripts through cmd.exe, and that syntax fails there.
- **A second copy of the invite in README or JS.** The README should name `src/_data/site.js` as the place to change it, not paste the URL.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| pathPrefix rewriting | Regex/string replace over output, or `{{ prefix }}` in every href | `HtmlBasePlugin` + `htmlBaseUrl` filter | The plugin covers ~20 tag/attr pairs, including `srcset` lists (verified rewriting `srcset="/a 1x, /b 2x"`) |
| Excluding dev pages | `permalink` ternaries scattered per file | `addPreprocessor` + `devOnly` front matter | Official drafts recipe. One rule |
| Subpath preview server | Copying `_site` into a nested folder + python http.server | `npm run dev` with `PATH_PREFIX` set | The dev server already serves at `/IBC-Website/` and redirects `/` there |
| Pages deploy | `gh-pages` branch push scripts / `peaceiris/actions-gh-pages` | `upload-pages-artifact` + `deploy-pages` | Official, OIDC, no deploy keys or branch |
| Test runner | Custom script runner | `node --test` | Built in |

**Key insight:** every pathPrefix bug in this phase lives in places the plugin does not see: `data-*`, `<meta content>`, inline `style`, JS string literals and empty `src`. The fix is to know that list exactly (from `posthtml-urls` defaults) and route those few values through `htmlBaseUrl`.

## HtmlBasePlugin Coverage (exact)

From `node_modules/@11ty/posthtml-urls/lib/defaultOptions.js`, verbatim filter keys:
`a: { href, ping }`, `area: { href, ping }`, `audio: { src }`, `base: { href }`, `blockquote: { cite }`, `button: { formaction }`, `del: { cite }`, `embed: { src }`, `form: { action }`, `iframe: { src }`, `img: { src, srcset }`, `input: { formaction, src }`, `ins: { cite }`, `link: { href }`, `meta: { content: isHttpEquiv }` (refresh only), `object: { data }`, `q: { cite }`, `script: { src }`, `source: { src, srcset }`, `track: { src }`, `video: { poster, src }`. [VERIFIED: file read this session]

Phase 1 values that need **explicit** `htmlBaseUrl`:
| Location | Current value (verbatim) | Phase 1 value |
|----------|--------------------------|---------------|
| `index.html:144,153,162,171` gallery `data-src` | `data-src="assets/op_patrol.jpg"`, `"assets/jo_1967.png"`, `"assets/cos.png"`, `"assets/funny.png"` | `data-src="{{ '/assets/op_patrol.jpg' \| htmlBaseUrl }}"` etc. (verified → `/IBC-Website/assets/x.jpg` under prefix, `/assets/x.jpg` at root) |
| `index.html:22` `og:image` | `content="assets/hero-bg.jpg"` | `content="{{ '/assets/hero-bg.jpg' \| htmlBaseUrl(site.url) }}"` |
| `index.html:244` lightbox img | `<img src="" alt="Lightbox image">` | `<img alt="Lightbox image">`. Under a prefix the plugin rewrites `src=""` to `src="."` (verified). JS sets `src` on open |
| `css/style.css:384` | `url('../assets/hero-bg.jpg')` | unchanged (relative, works under any prefix) |

## Runtime State Inventory

The phase moves files and changes the deploy root, so this inventory applies.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None. The site has no datastore. | None |
| Live service config | GitHub Pages is **not enabled** today (`api.github.com/repos/Inglourious-Basterds-Clan/IBC-Website` → `"has_pages": false`; the Pages URL returns 404). No existing deploy from the repo root breaks. Unknown: whether the user hosts the repo root anywhere else. | User enables Settings → Pages → Source: GitHub Actions (one-time, documented in README). Ask the user whether any other host serves the repo root today (Open Question 2) |
| OS-registered state | None. No scheduled tasks or services reference the repo. | None |
| Secrets/env vars | No secrets. New env names: `SITE_URL`, `PATH_PREFIX` (workflow `env:`), `INCLUDE_DEV_PAGES` (tests only). | Code only |
| Build artifacts | None today. New: `_site/`, `_test/`, `node_modules/`, `.cache/` are gitignored. Local `_site/` can go stale (dev page left behind). | `scripts/clean.js` runs before every build |

## Common Pitfalls

### Pitfall 1: MSYS (Git Bash) rewrites `PATH_PREFIX`
**What goes wrong:** `PATH_PREFIX=/IBC-Website/ npx eleventy` in Git Bash outputs `href="c:/C:/Program%20Files/Git/IBC-Website/css/style.css"`.
**Why:** MSYS converts POSIX-path-looking env values for native Windows programs.
**How to avoid:** In Git Bash prefix with `MSYS_NO_PATHCONV=1`. In PowerShell use `$env:PATH_PREFIX="/IBC-Website/"; npm run build`. Tests pass env through `spawnSync`. CI runs on Linux and is unaffected. Document the PowerShell form in the README.
**Warning signs:** `C:/` or `Program%20Files` in `_site/**/*.html`. Add a test assertion for it.

### Pitfall 2: Stale dev page deployed from a local build
**What goes wrong:** `npm run dev` writes `_site/_dev/layout-test/index.html`, and the next `npm run build` leaves it there (verified).
**How to avoid:** `"build": "node scripts/clean.js && eleventy"`. A test asserts that a default build has no `_dev` directory.

### Pitfall 3: `data-src` and `og:image` silently miss the prefix
**What goes wrong:** At the domain root everything looks fine. Under `/IBC-Website/` the lightbox opens a 404 image.
**How to avoid:** Use `htmlBaseUrl` (table above). The link-resolver test includes `data-src` and `meta[property=og:image]`.

### Pitfall 4: Empty `src` becomes `.`
**What goes wrong:** `<img src="">` turns into `<img src=".">` under a prefix. The browser then fetches the page as an image, which shows up as a console error and a wasted request.
**How to avoid:** Remove the empty attribute. The test asserts there is no `src="."`.

### Pitfall 5: Header Discord CTA breaks the mobile header
**What goes wrong:** `@media (max-width: 480px) { .hud-btn { width: 100%; justify-content: center; } }` (`css/style.css:1434-1443`) makes any header `.hud-btn` full-width. The header row (48 px logo + 3-line logo text, the CTA, the 44 px `.menu-toggle`, and `.nav-container` padding `15px 30px`) also has little room at 320–390 px.
**How to avoid:** Place the CTA in `.nav-container` **outside** `nav ul`. That keeps it visible while the off-canvas menu is closed and keeps it out of the `nav ul li a` selectors used by the mobile menu and scroll-spy. Add a modifier, for example `.header-cta`, with compact padding and font size, and override `width: auto` at ≤480 px with selector specificity ≥ `.hud-btn`. At ≤480 px consider an icon-only button with a visually hidden "Discord" label. Check screenshots at 320, 390, 768 and 1440 px. [ASSUMED: exact sizing; verify visually]
**Warning signs:** The hamburger wraps to a second line. The CTA overlaps the logo text.

### Pitfall 6: Scroll-spy silently dies
**What goes wrong:** Exact `href === '#about'` never matches `/IBC-Website/#about`. Nothing errors and nothing highlights.
**How to avoid:** Pattern 5. Add a manual checklist item: scroll through all sections at the root **and** under the prefix.

### Pitfall 7: Same-document navigation depends on the exact path
**What goes wrong:** The nav hrefs `/#about` resolve to `/IBC-Website/#about`. If the visitor is on `/IBC-Website/index.html` (not `/IBC-Website/`), the click reloads the page instead of smooth-scrolling.
**How to avoid:** Accept it. Pages and Eleventy links always use the directory URL, and the reload still lands on the right section. Note it in the checklist and do not engineer around it.

### Pitfall 8: Baseline captured after files moved
**What goes wrong:** D-07 needs the "before" state. Once `git mv` runs, the old site is gone from the working tree.
**How to avoid:** Make baseline capture the first task, before any `package.json`. If it is missed, recover with `git worktree add ../ibc-baseline e3c37ff`.

### Pitfall 9: First push to main fails the deploy job
**What goes wrong:** Pages is not enabled (`has_pages: false`), so `deploy-pages` fails until the user picks Source: GitHub Actions.
**How to avoid:** Add a human checkpoint task that enables Pages before the workflow first runs on main, or accept one red run and re-run.

## Code Examples

### Clean script (cross-platform)
```js
// scripts/clean.js
import { rmSync } from "node:fs";
rmSync(new URL("../_site", import.meta.url), { recursive: true, force: true });
```

### package.json
```json
{
  "name": "ibc-website",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.19" },
  "scripts": {
    "dev": "eleventy --serve",
    "build": "node scripts/clean.js && eleventy",
    "test": "node --test \"test/*.test.js\""
  },
  "devDependencies": { "@11ty/eleventy": "~3.1.6" }
}
```
`node --test test/` (a directory argument) **failed** on Node 26.7 with `Cannot find module …\test`. Use the quoted glob. [VERIFIED: smoke run]

### Test helper: build a variant without a shell
```js
// test/helpers.js — pattern verified passing on Node 26.7 / Windows
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const bin = fileURLToPath(new URL("../node_modules/@11ty/eleventy/cmd.cjs", import.meta.url));

export function build(outDir, env = {}) {
  rmSync(outDir, { recursive: true, force: true });
  const r = spawnSync(process.execPath, [bin, `--output=${outDir}`, "--quiet"], {
    env: { ...process.env, ...env }, encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stderr);
}
```
`require.resolve("@11ty/eleventy/cmd.cjs")` **fails** with `ERR_PACKAGE_PATH_NOT_EXPORTED`. Use the file URL. [VERIFIED: smoke run]

### Link resolver (FOUND-06 core)
```js
// For every _test/<variant>/**/*.html: collect href|src|data-src values and srcset candidates
// that start with "/". Assert each starts with the variant's prefix. Strip the prefix and the
// "#…"/"?…" suffix, map "" or "x/" to "x/index.html", and assert the file exists in the variant dir.
// Also assert: no "C:/", no 'src="."', og:image starts with SITE_URL + prefix.
```

### D-07 baseline capture (run BEFORE the first git mv; Git Bash)
```bash
B=.planning/phases/01-eleventy-foundation/baseline; mkdir -p "$B"
python -m http.server 8077 &          # serves the current repo root
npx -y lighthouse@13.5.0 http://localhost:8077/ --output=json --output=html --output-path="$B/lh-mobile" --chrome-flags="--headless=new" --quiet
npx -y lighthouse@13.5.0 http://localhost:8077/ --preset=desktop --output=json --output=html --output-path="$B/lh-desktop" --chrome-flags="--headless=new" --quiet
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
for vp in "390,844:mobile" "1440,900:desktop"; do size=${vp%%:*}; name=${vp##*:}
  for h in "" "#about" "#gallery" "#recruitment"; do
    "$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=$size \
      --run-all-compositor-stages-before-draw --virtual-time-budget=8000 \
      --screenshot="$(cygpath -w "$B")\\$name-${h:-top}.png" "http://localhost:8077/$h"
  done; done
# stop the server afterwards (PowerShell): Get-NetTCPConnection -LocalPort 8077 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }
```
- Verified this session: `--headless=new` **without** `--run-all-compositor-stages-before-draw` gave a blank 2.7 KB PNG, and the flags above gave a 1.4 MB PNG with content.
- Lighthouse's embedded `fullPageScreenshot` (412×4436) **stretches the `min-height: 100vh` hero**, so it cannot be used for parity. Use viewport shots per section.
- A preliminary single mobile run today: Performance 50, Accessibility 96, Best Practices 77, SEO 100. Record a median of 3 in the real baseline.
- Strip `#` from filenames when the shell needs it. The loop above names files `mobile-#about.png`, so the executor may sanitize the names.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.eleventy.js` CommonJS config | `eleventy.config.js` ESM with `export const config` | Eleventy 3.0 | Use ESM. `"type": "module"` |
| `url` filter for pathPrefix | `HtmlBasePlugin` + `htmlBaseUrl` | Eleventy 2.0 | Root-relative authoring |
| `gh-pages` branch deploys | Pages from Actions (`upload-pages-artifact`/`deploy-pages`) | 2022–23 | No branch, OIDC |
| setup-node `cache:` manual only | Auto npm cache when `packageManager` is set (v6+) | setup-node v6 | We set `cache: npm` explicitly in the build job only |

**Deprecated/outdated:** `upload-pages-artifact@v4` and `deploy-pages@v4`, as still shown in the GitHub docs. Use v5 (verified latest).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `link.hash`/`link.pathname` comparison makes scroll-spy work identically at root and under the prefix | Pattern 5 | Scroll-spy stays broken. Caught by the manual checklist |
| A2 | Putting `id="hero"` on the hero section keeps "scroll to top" identical, because the header is fixed and the hero is at y=0 | Pattern 4 | A small scroll offset. Caught visually |
| A3 | A compact header CTA fits at 320–390 px with an icon-only fallback ≤480 px | Pitfall 5 | Header layout break on mobile. Needs screenshot review; may need user sign-off on icon-only |
| A4 | Making `og:image` absolute in Phase 1 fits D-05/D-08. It is not on the D-08 "leave as is" list, and a relative value is broken on subpages and under the prefix | Pattern 3 | If the user wants the head untouched, the SITE_URL mutation test has no absolute URL to check until Phase 2 |
| A5 | No host other than (future) GitHub Pages serves the repo root today | Runtime State Inventory | An existing deploy would break when `index.html` moves to `src/` |

## Open Questions

1. **Should the header CTA be icon-only on narrow phones?**
   - What we know: `.hud-btn` goes full-width at ≤480 px, and header space is tight.
   - Unclear: whether the user accepts icon-only below 480 px.
   - Recommendation: build text+icon with an icon-only fallback ≤480 px. Show the screenshots in the end-of-phase human verify.
2. **Is the current site deployed anywhere from the repo root?**
   - What we know: GitHub Pages is off.
   - Recommendation: one-line confirmation in the human checkpoint. The README states the new deploy folder `_site/` either way.
3. **Should baseline artifacts be committed?**
   - Recommendation: commit the PNG screenshots and a small `scores.md` (median scores). Do not commit the multi-MB Lighthouse HTML/JSON reports. Gitignore them or delete them after extracting the scores.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build, tests | ✓ | 26.7.0 local (CI pins 24 via `.nvmrc`) | — |
| npm | install | ✓ | 11.19.0 | — |
| Git Bash + PowerShell | commands | ✓ | — | Use `MSYS_NO_PATHCONV=1` for env with paths |
| Python | baseline static server for the old root site | ✓ | 3.14.7 | `npx http-server` |
| Google Chrome | Lighthouse, headless screenshots | ✓ | installed at `C:/Program Files/Google/Chrome/Application/chrome.exe` | Edge (`msedge.exe` present) |
| Lighthouse | D-07 scores | ✓ via `npx` | 13.5.0 (ran OK) | PageSpeed Insights after deploy |
| `gh` CLI | — | ✗ | — | Not needed. User toggles the Pages setting in the web UI |
| GitHub Pages enabled on repo | deploy job | ✗ (`has_pages: false`) | — | Human step: Settings → Pages → Source: GitHub Actions |

**Missing dependencies with no fallback:** GitHub Pages enablement is a user action, which blocks only the deploy job and not the phase's local deliverables.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` + `node:assert/strict` (Node built-in; Node ≥22.19) |
| Config file | none. Glob in the npm script. Wave 0 creates `test/helpers.js` |
| Quick run command | `npm test` (builds 3 variants into `_test/`, about 1–3 s total; the smoke build took 0.06–0.8 s each) |
| Full suite command | `npm test && npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | Default build exits 0 and emits `index.html`, `css/style.css`, `js/main.js` and all 9 `assets/*`. No `_dev/` in the default build. `npm run build` removes stale files | integration | `npm test` (`test/build.test.js`) | ❌ Wave 0 |
| FOUND-02 | Built home has `#hero`, `#about`, `#gallery`, `#recruitment`, 4 `.gallery-item`, `#lightbox`, `#terminal-console[data-discord-url]`, `#decryption-overlay`, `#easteregg-trigger`, one `<h1>`, all original headings and texts. Visual parity is manual (D-07) | integration + manual | `npm test` (`test/layout.test.js`) + D-07 checklist | ❌ Wave 0 |
| FOUND-03 | With `SITE_URL=https://mutated.example` + prefix, `og:image` = `https://mutated.example/IBC-Website/assets/hero-bg.jpg`. No `localhost:8080` and no `inglourious-basterds-clan.github.io` anywhere in that output. No `C:/` | integration (mutation) | `npm test` (`test/build.test.js`) | ❌ Wave 0 |
| FOUND-04 | Exactly one `discord.gg/` literal across `src/**` (in `src/_data/site.js`). Every `discord\.gg/\w+` in the output equals the configured invite. `js/main.js` has no `discord.gg` | static + integration | `npm test` (`test/build.test.js`) | ❌ Wave 0 |
| FOUND-05 | With `INCLUDE_DEV_PAGES=1`, `/_dev/layout-test/index.html` exists. Its `<header>…</header>` and `<footer>…</footer>` blocks equal the home page's, apart from the home-only `active-nav` class. It contains the header Discord CTA with the invite | integration | `npm test` (`test/layout.test.js`) | ❌ Wave 0 |
| FOUND-06 | For the root and `/IBC-Website/` variants, every root-relative `href/src/srcset/data-src` starts with the prefix and resolves to a file in the output. No `src="."`. The CSS `url()` target exists. Browser behaviour under the prefix is checked manually via `npm run dev` with `$env:PATH_PREFIX` | integration + manual | `npm test` (`test/links.test.js`) | ❌ Wave 0 |

### Manual checklist (D-07, after migration, at `/` and at `/IBC-Website/`)
Hero; about; gallery lightbox (click, Enter/Space, arrows, Esc, outer click; image loads under the prefix); recruitment terminal (boot lines, invite text identical); mobile menu (open, close on link, `aria-expanded`); scroll-spy (all four links highlight, including "System" when back at the top); footer easter egg; header Discord CTA at 320/390/768/1440 px; skip link visible on Tab; no console errors; side-by-side screenshots vs baseline; Lighthouse mobile median of 3 compared with the baseline (should be within noise).

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test && npm run build`
- **Phase gate:** full suite green, plus the manual checklist at both root and subpath, before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `package.json` with `test` script, `@11ty/eleventy` installed, `package-lock.json`
- [ ] `test/helpers.js`: `build(outDir, env)`, `listHtml(dir)`, attribute extraction
- [ ] `test/build.test.js`, `test/layout.test.js`, `test/links.test.js`
- [ ] `.gitignore`: `_site/`, `_test/`, `node_modules/`, `.cache/`

## Security Domain

### Applicable ASVS Categories (Level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth. Static site |
| V3 Session Management | no | — |
| V4 Access Control | no | Public content |
| V5 Validation, Sanitization, Encoding | yes (light) | Nunjucks autoescape (layouts need `{{ content \| safe }}`, which shows autoescape is on). The terminal message goes into `.textContent` instead of `innerHTML` interpolation for the config-sourced invite |
| V6 Cryptography | no | — |
| V10 Malicious Code / V14 Configuration (supply chain, CI) | yes | `package-lock.json` + `npm ci`. Only 1 direct dependency (legitimacy OK, no postinstall). Workflow least privilege: top-level `contents: read`, `pages: write`/`id-token: write` only on the deploy job, which runs no npm code. PRs never deploy. Optionally pin actions by commit SHA |

### Known Threat Patterns for static Eleventy + GitHub Actions

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Reverse tabnabbing via new header CTA `target="_blank"` | Tampering | `rel="noopener noreferrer"` on the CTA, same as existing links (`index.html:230,265`) |
| Malicious PR modifying the workflow to deploy | Elevation | Deploy gated on `push` to `main` + the `github-pages` environment (default branch protection rule) |
| npm cache poisoning in a privileged job | Tampering | Cache only in the unprivileged build job (setup-node README guidance) |
| Dev/test page leaking to production | Information disclosure (minor) | Preprocessor exclusion, clean build, test asserting no `_dev/` |
| HTML injection through config values in `innerHTML` | Tampering | `textContent` for message text. Config is build-time, repo-controlled |

## Sources

### Primary (HIGH confidence)
- Local smoke build in this session's scratchpad (Eleventy 3.1.6, Node 26.7, Windows 11, Git Bash): HtmlBasePlugin rewrite coverage; `htmlBaseUrl` with and without base; `src=""`→`src="."`; `#fragment` untouched; preprocessor exclusion per run mode; dev server under prefix (302 + asset 200s); stale `_site` persistence; MSYS path mangling; `node --test` + `spawnSync` pattern; `--output` override.
- `node_modules/@11ty/posthtml-urls/lib/defaultOptions.js`: exact attribute map.
- npm registry: `@11ty/eleventy` 3.1.6 (dist-tags, engines, deps), `lighthouse` 13.5.0, package-legitimacy seam verdict OK.
- GitHub REST API: latest releases of checkout/setup-node/configure-pages/upload-pages-artifact/deploy-pages; repo `has_pages: false`.
- `actions/upload-pages-artifact` `action.yml` (main) and `actions/setup-node` README (v5–v7 breaking changes, caching guidance).
- Repo files read this session: `index.html`, `js/main.js`, `css/style.css` (sections cited), `.gitignore`, the planning docs.

### Secondary (MEDIUM confidence)
- https://www.11ty.dev/docs/plugins/html-base/: plugin must be added; `htmlBaseUrl` signature.
- https://www.11ty.dev/docs/config-preprocessors/: drafts recipe, `ELEVENTY_RUN_MODE`, v3.0.0+.
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages: permissions, environment, job structure.
- The GSD `classify-confidence` seam rates `webfetch` as LOW. These doc claims are rated higher only because each was reproduced in the smoke build.

### Tertiary (LOW confidence)
- None relied on.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Registry and an executed build.
- Architecture/patterns: HIGH for the build-time behaviour (executed). MEDIUM for the browser-side scroll-spy and CTA fit (A1–A3).
- Pitfalls: HIGH. Pitfalls 1–4 were reproduced. 5–9 come from reading the code.

**Research date:** 2026-10-02
**Valid until:** 2026-11-01 (Eleventy 3.1.x is stable. Recheck action majors if planning slips past a month)
