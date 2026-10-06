# Phase 2: Technical SEO - Research

**Researched:** 2026-10-06
**Domain:** Eleventy 3.1 SEO head system, JSON-LD, generated SEO files (sitemap, robots, manifest, IIS web.config, 404), a post-build SEO gate, and an indexing guard for non-final hosts
**Confidence:** HIGH for the Eleventy mechanics (read in `node_modules` and prototyped in a scratch build this session). MEDIUM for the Google, IIS and Discord behaviour (official docs fetched, but not tested against a live IIS or Discord).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Search snippet wording (SEO-01)
- **D-01:** Home `<title>` is **keyword first**: `Klan Arma 3 Milsim – Inglourious Basterds Clan (IBC)`. It replaces `IBC Clan // Wizytówka Taktyczna Arma 3`.
- **D-02:** Subpage titles = page `title` from front matter + ` | IBC`, appended automatically by the layout (e.g. `Jak dołączyć do klanu Arma 3 | IBC`). The home page uses its full title with no suffix.
- **D-03:** Home meta description = a **recruitment pitch** drafted by Claude in natural Polish: Polish clan, since 2018, regular co-op operations, recruiting, ending with a nudge to join via Discord. Keep it within about 150–160 chars. It is drafted copy, so it carries a TODO marker (see D-05).
- **D-04:** Every indexable page **must** declare its own `description`. A missing description fails the build; there is no site-wide fallback. The 404 page is exempt (it is noindex and not in the sitemap).
- **D-05:** Drafted copy (home description, 404 text, OG card text if any wording is new) gets **TODO markers** and is listed in **`FACTS.md`** (repo root or `.planning/`, planner decides; Phase 4 / CONT-06 reuses the same file). The user confirms it and removes the markers.

#### Share image & icons (SEO-03, SEO-04)
- **D-06:** The default OG image is a **designed 1200×630 card**: a crop of `hero-bg.jpg` + the IBC rose logo + the text "Klan Arma 3 Milsim" (and/or the clan name) in the HUD style (dark palette, accent `#cbb18a`, tactical look). It is generated once and **committed as a versioned file** (e.g. `og-default-v1.jpg`) so Discord/Facebook caches can be busted by renaming it. It must stay readable at Discord's small preview size.
- **D-07:** There is one default OG image, and any page can override it with `ogImage` in front matter. `og:image`, `og:url`, `twitter:image` are absolute (via `site.url` + pathPrefix). Twitter card = `summary_large_image`.
- **D-08:** Favicons / app icons = **the rose logo on a dark rounded tile** in the site background colour `#080e11`, so it reads on both light and dark tabs. The same artwork is used for favicon (ICO and/or SVG/PNG sizes), `apple-touch-icon` (180), and the manifest icons 192/512. This also fixes the pre-existing `favicon.ico` 404 (STATE.md).
- **D-09:** `theme-color` = site background `--bg-primary` **`#080e11`** (the manifest `background_color`/`theme_color` match it).

#### Clan identity in JSON-LD (SEO-05)
- **D-10:** Organization: `name` "Inglourious Basterds Clan", `alternateName` `["IBC", "IBC Clan"]`, `foundingDate` "2018", `url` = home absolute URL, Polish `description`.
- **D-11:** `sameAs` = **YouTube `https://www.youtube.com/@IBC_A3`, Facebook `https://www.facebook.com/IBCA3`, and the Discord invite** (`site.discord.invite`). No Steam or other profiles.
- **D-12:** Organization `logo` = **the transparent rose** (a resized copy of `logo.png`, square, ≥112 px as Google requires). The user picked this over the dark-tile icon even though it is faint on white.
- **D-13:** Social URLs move into **`site.js` as one list** (e.g. `site.social`). The footer icons and `sameAs` both read it, and the footer stops hardcoding YouTube/Facebook URLs. The Discord invite stays at `site.discord.invite` (single source, FOUND-04).
- **D-14:** Home has Organization + WebSite (WebSite `name`/`alternateName`/`url`, linked to the Organization by `@id`). **Remove the SportsTeam block and the meta keywords tag.** No Event markup (locked earlier).

#### Indexing guard, IIS and 404 (SEO-02, SEO-07, SEO-08, SEO-09)
- **D-15:** **Explicit opt-in indexing:** every build is `noindex` unless **`SITE_INDEXABLE=1`** is set. The GitHub Pages workflow **never** sets it. The IIS release build does. If the flag is forgotten, the site is hidden, not leaked; the cutover checklist catches it. Non-final host = no flag. Use `<meta name="robots" content="noindex">` (not a robots.txt `Disallow`, which would stop crawlers from seeing the noindex).
- **D-16:** The build emits a **minimal `web.config`** into `_site/` for IIS: `<httpErrors>` mapping 404 → `/404.html` (pathPrefix-aware) and a MIME map for `.webmanifest` (`application/manifest+json`). **Nothing else**: no URL Rewrite, HTTPS or www redirects (those are server setup and out of scope). It must not break GitHub Pages, which ignores the file.
- **D-17:** The **Polish 404 page** uses the HUD "signal lost" tone (e.g. `404 // UTRACONO SYGNAŁ`) plus a plain Polish line ("Ta strona nie istnieje"), a button back to home and the Discord CTA. It renders in the shared base layout, is always `noindex`, and is excluded from the sitemap. The copy is drafted and marked TODO (D-05). It must also work as the GitHub Pages 404 (`404.html` at the output root; asset links must survive being served from arbitrary missing paths, so they are root-relative + pathPrefix).
- **D-18:** After cutover, **GitHub Pages stays as a noindex preview** deployed by the existing workflow. Its canonical stays **self-referencing**: no cross-domain canonical to the real domain, because Google advises against mixing noindex with a cross-domain canonical.
- **D-19:** **SEO gate scope:** a post-build check (`check-seo.js` per research) fails **every** build on: a missing/relative canonical or og:image, a canonical not starting with `site.url`, a missing description on an indexable page, invalid JSON-LD (unparseable), or an indexable page missing from the sitemap. **TODO markers fail only indexable builds** (`SITE_INDEXABLE=1`). The noindex Pages preview still deploys with drafts, so the user can review them live. Dev (`npm run dev`) never fails on TODOs. This refines STATE.md's "TODO gate fails production builds only".
- **D-20:** The **domain cutover checklist** (documented, Polish, e.g. in README) must cover at least: set `SITE_URL` (+ `PATH_PREFIX=/` on IIS) and `SITE_INDEXABLE=1` for the IIS build; deploy `_site/` incl. `web.config`; confirm on IIS that `/404.html` and `.webmanifest` are served; Search Console verification (DNS) + sitemap submission; check the Discord preview (bump the OG version if cached); confirm the Pages preview is still noindex. The research also suggests a 301 from the old host, but GitHub Pages cannot 301 to another domain. Noindex + self-canonical (D-18) is the accepted substitute; say so in the checklist.

#### Already locked (from PROJECT.md / Phase 1, not re-discussed)
- `src/_data/site.js` is the single source for url/pathPrefix/invite. Production builds fail without `SITE_URL` (01-07). `ALLOW_LOCAL_SITE_URL=1` is the local opt-out.
- The Pages workflow sets `SITE_URL`/`PATH_PREFIX` only in `.github/workflows/pages.yml`, and its PR build job is where the SEO gate plugs in (Phase 1 D-04).
- Organization + WebSite JSON-LD; no Event, no SportsTeam, no meta keywords; FAQPage never drives design.
- Directory-style URLs with trailing slash; slugs `/jak-dolaczyc/`, `/operacje/`, `/sklad/` fixed.
- Polish only, `lang="pl"`.

### Claude's Discretion
- File names/layout: `seo-head.njk` partial vs. extending `head.njk`, `lib/schema.js`, `absoluteUrl`/`jsonLd` filters, template names for sitemap/robots/manifest/web.config.
- How the OG card and the favicon set are produced (one-off script with a dev dependency, or committed artwork). Exact icon size set and formats (ICO + SVG/PNG).
- Sitemap `lastmod` (omit, or git last-modified per research; if git dates are used, CI needs `fetch-depth: 0`). Whether robots.txt on noindex builds still lists the sitemap (it must not `Disallow` pages).
- How `check-seo.js` is wired (`npm run build` chain vs separate script called by the workflow) and the exact TODO marker syntax, as long as D-19 holds and the existing build/test harness (`test/helpers.js`, `node --test`) covers it.
- Exact Polish wording of the drafted copy (all marked TODO).

### Deferred Ideas (OUT OF SCOPE)
- IIS server-side rules (http→https, www→apex redirects via URL Rewrite) — hosting setup, out of scope. Mention them in the cutover checklist as the user's server task only.
- MIME maps for `.avif`/`.woff2` in `web.config` — add in Phase 3, when those files first exist.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEO-01 | Every page has a unique title, a meta description and an absolute canonical URL | Pattern 2 (single head writer driven by front matter); canonical = `page.url \| htmlBaseUrl(site.url)` (verified behaviour); gate rules G1–G4 |
| SEO-02 | `sitemap.xml` lists every indexable page, and `robots.txt` points to it | `sitemap.xml.njk` / `robots.txt.njk` prototyped this session with correct absolute, prefixed output; Pattern 4 (shared `isIndexableUrl` predicate); gate rule G7 |
| SEO-03 | Absolute OG/Twitter tags with a 1200×630 OG image | OG/Twitter tag set (Code Examples); sharp generator prototyped (1200×630 JPEG, 111 KB); `meta content` is NOT rewritten by HtmlBasePlugin, so absolute URLs must come from the filter |
| SEO-04 | Favicons, web manifest and `theme-color` | Icon set + manifest (Code Examples); Google favicon rules (no SVG, >48 px recommended); `.webmanifest` MIME on IIS |
| SEO-05 | Organization + WebSite JSON-LD; SportsTeam and keywords removed; no Event | `lib/schema.js` `@graph` with `@id` links; Google Organization + site-names docs; `\u003c` escaping |
| SEO-07 | Custom Polish 404 page | `404.njk` with `permalink: /404.html` (prototyped); dev server serves `404.html` automatically (read in eleventy-dev-server source); IIS `<httpErrors>` ExecuteURL |
| SEO-08 | Build fails on missing/relative canonical/og:image, invalid JSON-LD, page missing from sitemap, leftover TODO | `scripts/check-seo.js` chained after Eleventy in `npm run build`; rule table G1–G10; fixture-based gate tests |
| SEO-09 | Non-final hosts get `noindex`; cutover checklist documented | `site.indexable = process.env.SITE_INDEXABLE === "1"`; gate rule G9 checks the noindex both ways; README checklist content (Polish) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

`.claude/CLAUDE.md` was written before Phase 1, so parts of it describe the old no-build site ("No build step required", "No `package.json`"). Phase 1 superseded those parts with the locked Eleventy setup. These directives still apply:

- **Static output only.** The site must stay deployable to any static host, so everything goes into `_site/` as plain files. A light build step is fine.
- **Polish only**, `lang="pl"`.
- **The site URL is a single config value.** Never hardcode a host. Phase 1 test `links.test.js (f)` enforces this.
- **Naming:** camelCase JS functions and variables, verb-first function names (`buildSchemaGraph`, `checkSite`), kebab-case CSS classes, kebab-case directories.
- **Comments:** section headers like `/* --- NAME --- */` and short inline comments. No JSDoc requirement.
- **JS style:** `const`/`let`, never `var`. Use semicolons, guard clauses and early returns.
- **HTML:** semantic elements, `alt` text and dimensions on images, ARIA on interactive controls.
- **CSS:** colours as `:root` custom properties (`--bg-primary: #080e11`, `--accent-color: #cbb18a`).
- **GSD workflow:** edits only go through GSD commands (the planner/executor handle this).

## Summary

Phase 1 left a clean base: `src/_data/site.js` is the single source for `url`, `pathPrefix` and the invite. HtmlBasePlugin rewrites root-relative `href`/`src` in `.html` output. `test/helpers.js` gives every suite an isolated build. This phase replaces the hardcoded `partials/head.njk` with a head writer driven by front matter. It adds the JSON-LD builder, five generated files (`sitemap.xml`, `robots.txt`, `site.webmanifest`, `web.config`, `404.html`) and committed image assets (OG card, favicon set, square JSON-LD logo). It ends with a post-build gate, `scripts/check-seo.js`, chained into `npm run build` so CI's existing `npm run build` step runs it on every PR and push.

I checked the Eleventy mechanics in the installed 3.1.6 source and in a scratch build. `htmlBaseUrl(site.url)` gives correct absolute URLs with the prefix in non-HTML templates too: `https://ex.example/IBC-Website/sitemap.xml` with a prefix, `https://ex.example/sitemap.xml` at root. `htmlBaseUrl` with no argument gives a root-relative prefixed path, which `web.config` needs (`/IBC-Website/404.html` or `/404.html`). HtmlBasePlugin rewrites only `.html` output, and inside `<meta>` it rewrites `content` only for `http-equiv="refresh"`. So every `og:`/`twitter:` URL must be made absolute explicitly. Nunjucks autoescape is on by default in Eleventy, so attributes are safe, but JSON-LD must go out through `| safe` after a `<`-escaping serializer. The Eleventy dev server already serves `404.html` for missing paths.

The one real design problem is D-19. The gate must check "indexable page has a description / is in the sitemap" on **every** build, including the preview where every page carries `noindex`. So whether a page is meant to be indexed cannot be read from the robots meta. The recommendation is one shared predicate, `isIndexableUrl(url)` in `lib/seo.js`, used by the head template (page-level noindex), the sitemap template and the gate. Everything is indexable except `/404.html` and `/_dev/*`.

**Primary recommendation:** Build `lib/seo.js` (predicate, absolute-URL helper, JSON-LD serializer) and `lib/schema.js` (Organization + WebSite `@graph`). Replace `head.njk` with one SEO head driven by front matter. Add the five generated templates. Generate the images once with a committed `scripts/make-seo-images.js` (sharp dev dependency). Add `scripts/check-seo.js` as a pure, fixture-testable gate, and set `"build": "node scripts/clean.js && eleventy && node scripts/check-seo.js"`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Site URL, prefix, indexable flag, social list, theme colour | Build config (`src/_data/site.js`) | — | Single source (FOUND-03). Templates and the gate both import it |
| Title / description / canonical / OG / Twitter / robots / icons | Build-time templates (`seo-head.njk`) | Page front matter | Pages declare data, one partial writes all tags |
| JSON-LD graph | Build-time JS (`lib/schema.js`) | `seo-head.njk` (renders home only) | Pure and unit-testable, outside `src/` so it is never copied to output |
| sitemap.xml / robots.txt / site.webmanifest / web.config / 404.html | Build-time templates (`src/*.njk`) | CDN/Static (served as files) | Plain files in `_site/`, no server logic |
| 404 behaviour | Static host (GitHub Pages convention, IIS `<httpErrors>`) | Eleventy dev server (auto) | The host decides status and fallback. The build only ships the file and the IIS config |
| OG card, favicons, JSON-LD logo | Committed static assets (`src/assets/...`, `src/favicon.ico`) | One-off generator script | Generated once and versioned (D-06), not built on every run |
| SEO gate | Post-build Node script (`scripts/check-seo.js`) | `node --test` fixtures | Reads `_site/` only and never modifies output |
| Indexing decision | Build env (`SITE_INDEXABLE=1`) | Gate cross-check | Opt-in. The gate fails if noindex leaks into an indexable build, or is missing from a preview build |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@11ty/eleventy` | 3.1.6 (installed, `~3.1.6` in package.json) | Templates, HtmlBasePlugin (`htmlBaseUrl` filter), dev server with 404 support | Already the project SSG [VERIFIED: node_modules/@11ty/eleventy/package.json → `3.1.6`] |
| Node built-ins (`node:fs`, `node:path`, `node:url`, `node:test`) | Node ≥ 22.19 (`.nvmrc` 24, local 26.7) | Gate script and tests | Zero extra dependencies. Matches `scripts/clean.js` and the test harness [VERIFIED: package.json:5-7 `"node": ">=22.19"`] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sharp` | 0.35.5 (`~0.35.5`) | One-off generation of the OG card, icon PNGs and the square logo | Only by `scripts/make-seo-images.js`. Never by `npm run build` or `npm test`. Phase 3's `@11ty/eleventy-img@7` depends on `sharp ^0.35.3`, so it dedupes later [VERIFIED: npm registry `npm view @11ty/eleventy-img@7.0.0 dependencies.sharp` → `^0.35.3`]. `sharp` [WARNING: flagged as suspicious — verify before using.] (verdict SUS only because 0.35.5 is 9 days old; 133M weekly downloads, repo lovell/sharp, no install/postinstall script) |

No other packages. The sitemap, robots, manifest, web.config, JSON-LD and gate are all hand-written templates or small scripts. That is the standard Eleventy approach: the STACK research rejected the third-party sitemap plugin as unmaintained [CITED: .planning/research/STACK.md:173].

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sharp generator | Headless Chrome CDP screenshot of an HTML card (Phase 1 already used CDP) | No new dependency, and the real site fonts are used. But it needs about 80 lines of CDP plumbing and a transparent background for the rounded icons. sharp did the whole job in one 25-line probe |
| Hand-written PNG-in-ICO writer (~15 lines) | `png-to-ico@3.0.2` (legitimacy verdict OK, ESM) | One more dev dependency used once. The ICO container is trivial: 6-byte header, 16-byte entries, embedded PNGs |
| Gate in the npm build chain | `eleventy.after` hook in `eleventy.config.js` | The hook does make the CLI exit non-zero on a throw (`Eleventy.js:1460-1470` marks errors `fatal`). But `results` carry no front-matter data unless `dataFilterSelectors` is set, it also fires in `--serve`, and failure cases can only be tested by building broken sites. A standalone script can be tested against fixture folders |
| Git-date `lastmod` in the sitemap | Omit `lastmod` | Google uses `lastmod` only "if it's consistently and verifiably accurate" [CITED: developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap]. Git dates need `fetch-depth: 0` in CI and a page edit vs. layout edit policy. On a 1–4 page site, leaving it out costs nothing |

**Installation:**
```bash
npm install --save-dev sharp@~0.35.5
```

**Version verification (this session):** `npm view sharp version` → `0.35.5` (published 2026-09-27T13:46:24Z, engines `node >=20.9.0`). sharp 0.35.5 installed in a scratch folder on this Windows machine. libvips 8.18.7, rsvg 2.63.2, pango 1.58.2 and fontconfig 2.18.3 are bundled, so SVG text renders with system fonts.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| sharp | npm | 0.35.5 published 9 days ago (package since 2013) | 133.7M/wk | github.com/lovell/sharp | [SUS] (reason: `too-new`) | Flagged. Planner adds `checkpoint:human-verify` before install. Optionally pin `0.35.4` (2026-08-26) to clear the age signal |
| png-to-ico | npm | 3.0.2 published 2026-07-06 (package since 2016) | 541K/wk | github.com/steambap/png-to-ico | [OK] | Alternative only. Not recommended (hand-written ICO is smaller) |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `sharp`. The planner inserts `checkpoint:human-verify` before `npm install --save-dev sharp`. No postinstall script (`npm view sharp scripts.postinstall` → empty; seam signal `postinstall: null`).

## Architecture Patterns

### System Architecture Diagram

```
 env: SITE_URL, PATH_PREFIX, SITE_INDEXABLE ("1" = opt-in)
            │
            ▼
   src/_data/site.js ──(validate URL, derive indexable)──┐
            │                                             │
   page front matter (title, description, ogImage)        │
            │                                             │
            ▼                                             ▼
   layouts/base.njk ──include──▶ partials/seo-head.njk ◀── lib/seo.js (isIndexableUrl, jsonLd)
            │                       │  └─ home only ──▶ lib/schema.js (Organization + WebSite @graph)
            │                       ▼
            │        <title>, description, canonical, robots?, OG/Twitter, icons, manifest, theme-color, JSON-LD
            ▼
   Eleventy render ──▶ HtmlBasePlugin (.html only: prefixes root-relative href/src)
            │
            ├─▶ _site/**/index.html, _site/404.html
            ├─▶ _site/sitemap.xml   (collections.all ∩ isIndexableUrl, absolute <loc>)
            ├─▶ _site/robots.txt    (Sitemap: line only when indexable)
            ├─▶ _site/site.webmanifest, _site/web.config (prefix-aware 404 path)
            └─▶ passthrough: assets/og/*, assets/icons/*, assets/brand/*, favicon.ico
                     │
                     ▼
   scripts/check-seo.js  (reads _site/ + site.js, same env)
        ├─ every build: G1–G9 (canonical, og:image, description, JSON-LD, sitemap, robots, noindex)
        └─ SITE_INDEXABLE=1 only: G10 TODO markers
                     │ exit 1 + per-file messages on failure
                     ▼
   GitHub Pages workflow (noindex preview)   |   user's IIS release build (SITE_INDEXABLE=1)
```

### Recommended Project Structure
```
lib/                          # build-time JS, outside src/ (never copied to output)
├── seo.js                    # isIndexableUrl(), absoluteUrl(), jsonLd()
└── schema.js                 # buildSchemaGraph(site) → { "@context", "@graph": [Organization, WebSite] }
scripts/
├── clean.js                  # (exists)
├── check-seo.js              # post-build gate; exports checkSite(outDir, site) + CLI wrapper
└── make-seo-images.js        # one-off generator (sharp); outputs are committed
src/
├── _data/site.js             # + indexable, social, shortName, locale, themeColor, ogImage, ogImageAlt, URL validation
├── _includes/partials/
│   ├── head.njk              # replaced by / renamed to seo-head.njk (single head writer)
│   └── footer.njk            # socials loop over site.social
├── index.njk                 # + title, description, (todo) front matter
├── 404.njk                   # permalink: /404.html, eleventyExcludeFromCollections: true
├── sitemap.xml.njk           # permalink: /sitemap.xml
├── robots.txt.njk            # permalink: /robots.txt
├── site.webmanifest.njk      # permalink: /site.webmanifest
├── web.config.njk            # permalink: /web.config
├── favicon.ico               # passthrough to output root
└── assets/
    ├── og/og-default-v1.jpg  # 1200×630, < 300 KB
    ├── icons/apple-touch-icon.png (180), icon-192.png, icon-512.png
    └── brand/ibc-logo-512.png  # transparent rose, square (JSON-LD logo, D-12)
FACTS.md                      # repo root: drafted-copy register (D-05, reused by CONT-06)
test/
├── seo.test.js               # real builds: head tags, JSON-LD, generated files, noindex variants
├── seo-gate.test.js          # fixture folders: each gate rule fails / passes
└── facts.test.js             # every TODO(FACTS-NN) in src/ has a FACTS.md row and vice versa
```

### Pattern 1: `site.js` grows the SEO config (one source)
**What:** Add `indexable`, `shortName`, `locale`, `themeColor`, `ogImage`, `ogImageAlt` and `social` next to the existing keys. Validate `SITE_URL` while you are there: this closes review findings WR-01 / R2-WR-01, where a malformed `SITE_URL` silently ships a broken `og:image`.
**Example:**
```js
// src/_data/site.js (additions; existing guard and pathPrefix logic stay)
const indexable = process.env.SITE_INDEXABLE === "1"; // strict, like ALLOW_LOCAL_SITE_URL

let parsed;
try { parsed = new URL(url); } catch { parsed = null; }
if (!parsed || !/^https?:$/.test(parsed.protocol) || parsed.pathname !== "/" || parsed.search || parsed.hash) {
  throw new Error(`SITE_URL "${url}" is not an origin like https://<domain> (no path, query or hash).`);
}
if (indexable && (parsed.protocol !== "https:" || parsed.hostname === "localhost")) {
  throw new Error("SITE_INDEXABLE=1 needs a real https SITE_URL (cutover checklist, README).");
}

export default {
  url, pathPrefix,
  name: "Inglourious Basterds Clan",
  shortName: "IBC",
  locale: "pl_PL",
  themeColor: "#080e11",                       // = --bg-primary (D-09)
  indexable,
  ogImage: "/assets/og/og-default-v1.jpg",     // bump to -v2 to bust Discord cache
  ogImageAlt: "Inglourious Basterds Clan – klan Arma 3 milsim",
  discord: { invite: "https://discord.gg/DhJwkeehJK" },
  social: [
    { id: "youtube", label: "YouTube", url: "https://www.youtube.com/@IBC_A3" },
    { id: "facebook", label: "Facebook", url: "https://www.facebook.com/IBCA3" },
  ],
  includeDevPages: /* unchanged */,
};
```
Current values, quoted verbatim [VERIFIED: src/_data/site.js:9,18,20-21,26,28]: `const localUrl = "http://localhost:8080";`, `const url = (rawUrl || localUrl).replace(/\/+$/, "");`, `const pathPrefix = rawPrefix ? \`/${rawPrefix}/\` : "/";`, `name: "Inglourious Basterds Clan",`, `invite: "https://discord.gg/DhJwkeehJK",`. The social URLs are quoted from footer.njk [VERIFIED: src/_includes/partials/footer.njk:16-17]: `href="https://www.youtube.com/@IBC_A3"`, `href="https://www.facebook.com/IBCA3"`. Colour [VERIFIED: src/css/style.css:5] `--bg-primary: #080e11;`. The `ogImage` path, `shortName`, `locale` and `ogImageAlt` values are new proposals [ASSUMED].

Two cautions. The URL-shape validation must run only after the localhost default is applied, and it must accept `http://localhost:8080` for dev builds. `"https://mutated.example/"` (used in `build.test.js`) is still valid after the existing trailing-slash strip.

### Pattern 2: one SEO head writer
**What:** `partials/seo-head.njk` (or a rewritten `head.njk`) is the only place that writes `<head>` meta. Pages declare `title`, `description` and optionally `ogImage` and `todo` in front matter.
**When to use:** every page. Phase 4 subpages are born complete.
**Key facts:**
- `{{ page.url | htmlBaseUrl(site.url) }}` returns the absolute URL with the prefix. `htmlBaseUrl` calls `addPathPrefixToUrl(url, pathPrefix, base)` when the base is a full URL [VERIFIED: node_modules/@11ty/eleventy/src/Plugins/HtmlBasePlugin.js:7-20, 51-53]. Prototype output: `https://ex.example/IBC-Website/` for `/` with prefix `/IBC-Website/`.
- HtmlBasePlugin transforms `link: { href: true }` but `meta: { content: isHttpEquiv }` [VERIFIED: node_modules/@11ty/posthtml-urls/lib/defaultOptions.js]. A root-relative `og:image` would therefore stay relative, so always run it through the filter. Absolute URLs pass through untouched (`if (isValidUrl(url)) return url;`, HtmlBasePlugin.js:35-37).
- Icon and manifest `<link href="/...">` stay root-relative in the source, and the plugin prefixes them.
- Nunjucks autoescape is on: Eleventy passes `environmentOptions: { dev: true }` and Nunjucks defaults `autoescape` to `true` [VERIFIED: node_modules/@11ty/eleventy/src/UserConfig.js:125; node_modules/nunjucks/src/environment.js:68]. Descriptions with quotes are safe in `content="…"`. JSON-LD needs `| safe`.

### Pattern 3: JSON-LD `@graph` built in JS
**What:** `lib/schema.js` exports `buildSchemaGraph(site)`. It returns Organization + WebSite linked by `@id`. The head renders it only when `page.url == "/"` (D-14). `jsonLd()` escapes `<` so the content can never close the `<script>`.
**Google facts:** Organization has no required properties. The recommended ones include `name`, `url`, `logo`, `description`, `alternateName`, `sameAs` and `foundingDate`. The logo "must be 112x112px, at minimum… crawlable and indexable… Make sure the image looks how you intend it to look on a purely white background" [CITED: developers.google.com/search/docs/appearance/structured-data/organization]. WebSite needs `name` + `url` and "must be on the home page of the site… the domain or subdomain level root URI". Subdirectory home pages are not supported for site names [CITED: developers.google.com/search/docs/appearance/site-names]. So site-name signals only work on the final IIS root host, never on the `/IBC-Website/` preview. That is fine, because the preview is noindex.

### Pattern 4: one predicate decides which pages are meant to be indexed
**What:** `isIndexableUrl(url)` returns `false` for `/404.html` and anything under `/_dev/`, and `true` otherwise. Expose it as an Eleventy filter. Use it in (a) the head: `noindex` when `not site.indexable or not (page.url | isIndexableUrl)`, (b) the sitemap loop, (c) the gate, after mapping `x/index.html` → `/x/` and `404.html` → `/404.html`.
**Why:** D-19 requires "missing description on an indexable page" and "indexable page missing from the sitemap" to fail **every** build. In the Pages preview every page has `noindex`, so the gate cannot read the intent from the HTML. One predicate shared by template and gate keeps the intent in a single place. It also makes the sitemap check a real safety net: a page that is indexable by URL but missing from `collections.all` gets caught.
**Trade-off:** a future page that should be noindex must be added to the predicate's list, not just given a front-matter flag. On a 4-page site that is the clearer choice.

### Pattern 5: generated files as Nunjucks templates
`permalink:` + `eleventyExcludeFromCollections: true` on every generated file. Prototyped this session. Output started with `<?xml` (front matter fully stripped). `collections.all` held only real pages (index), and `404`, `sitemap`, `robots` and `web.config` were excluded. The `.config` and `.webmanifest` outputs were not touched by HtmlBasePlugin (`extensions: "html"`, HtmlBasePlugin.js:62).

### Pattern 6: post-build gate as a pure function + CLI wrapper
`scripts/check-seo.js` exports `checkSite(outDir, site) → string[]` (error messages) and, when run directly, prints the errors and exits 1. Tests run it on real `_test/<name>` builds and on small fixture folders. It imports `../src/_data/site.js`, so it shares the normalisation. In the npm chain the env is the same as the Eleventy step. `ELEVENTY_RUN_MODE` is not set in that second process, so site.js's build guard does not fire there (Eleventy already enforced it).

### Anti-Patterns to Avoid
- **Root-relative `og:image`/`og:url`:** HtmlBasePlugin never rewrites `meta content`. It ships relative, and Discord shows no image.
- **robots.txt `Disallow: /` for previews:** Google never sees the noindex. "If the page is blocked by a robots.txt file… the crawler will never see the noindex rule, and the page can still appear in search results" [CITED: developers.google.com/search/docs/crawling-indexing/block-indexing].
- **Cross-domain canonical on the preview:** rejected by D-18. Keep it self-referencing.
- **`{{ obj | dump }}` without `| safe` for JSON-LD:** autoescape turns the quotes into `&quot;`, and the JSON stops parsing.
- **Running the TODO gate on real source in tests with `SITE_INDEXABLE=1`:** the test result would flip when the user removes the markers. Test the TODO rule with fixtures only.
- **Gate inside `eleventy.after`:** it also fires in `--serve` (dev must never fail on TODOs), and failures are hard to test.
- **Site-wide description fallback:** forbidden by D-04.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Absolute URL + pathPrefix joining in templates | String concat `site.url ~ page.url` | `htmlBaseUrl(site.url)` filter (bundled) | Handles the prefix, double slashes and full-URL passthrough. Already proven by the Phase 1 og:image tests |
| Root-relative prefixed path in non-HTML files (web.config, manifest) | Manual `site.pathPrefix ~ "404.html"` | `htmlBaseUrl` with no argument (or the legacy `url` filter) | Prototype: `/IBC-Website/404.html` with a prefix, `/404.html` at root |
| Image resizing/compositing/JPEG encoding | Canvas/Chrome hacks | `sharp` | mozjpeg encoder, `fit: contain` with transparent padding, SVG overlay compositing (all verified in the probe) |
| HTML attribute escaping | Custom escaper | Nunjucks autoescape (on by default) | Already active |
| 404 handling in dev | Custom middleware | eleventy-dev-server built-in | `getOutputDirFilePath("404.html")` is served with status 404 [VERIFIED: node_modules/@11ty/eleventy-dev-server/server.js:603-607] |
| A full HTML parser in the gate | DOM library | Targeted regexes over our own known-shape output (same approach as `test/helpers.js` `attrValues`/`block`) | We control the markup. A new parser dependency is not worth it for ~6 tags |

**Key insight:** every tricky URL operation already has a tested Eleventy filter. The new code is mostly data (site.js, schema.js) and checks (gate).

## Runtime State Inventory

Not a rename phase. One runtime-state item matters for the cutover:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None. No datastore | — |
| Live service config | Discord's link-preview cache for the Pages URL (it may still hold the old card with the 4.7 MB `hero-bg.jpg`); Google index state of `inglourious-basterds-clan.github.io/IBC-Website/` (unknown) | The new versioned OG filename forces a refetch. Checklist step: run `site:inglourious-basterds-clan.github.io` after deploy to confirm the preview stays unindexed |
| OS-registered state | None in the repo. The IIS site, bindings and MIME/feature delegation live on the user's server (out of scope) | Checklist items only |
| Secrets/env vars | New env var `SITE_INDEXABLE`. Must be added to `buildEnvKeys` in `test/helpers.js` so a developer shell cannot leak it into test variants. Currently [VERIFIED: test/helpers.js:18] `const buildEnvKeys = ["SITE_URL", "PATH_PREFIX", "INCLUDE_DEV_PAGES", "ELEVENTY_RUN_MODE", "ALLOW_LOCAL_SITE_URL"];` | Code edit |
| Build artifacts | `_site/` is wiped by `scripts/clean.js` on every build | None |

## Common Pitfalls

### Pitfall 1: Existing Phase 1 tests pin the old head
**What goes wrong:** `npm test` fails right after the head rewrite.
**Why:** The tests assert the removed content. [VERIFIED: test/layout.test.js:107-109] `"<title>IBC Clan // Wizytówka Taktyczna Arma 3</title>"`, `'name="keywords"'`, `'"@type": "SportsTeam"'`. [VERIFIED: test/devpages.test.js:12] `const defaultTitle = "IBC Clan // Wizytówka Taktyczna Arma 3";`, plus the dev-page title assertions (`<title>Test layoutu</title>` becomes `Test layoutu | IBC` under D-02). `build.test.js` and `links.test.js` assert `og:image` ends in `assets/hero-bg.jpg`. [VERIFIED: test/devpages.test.js:133] `assert.equal(pkg.scripts.build, "node scripts/clean.js && eleventy");`.
**How to avoid:** Update these assertions in the same plan that changes the head or build script. Invert the SportsTeam/keywords checks to "absent". Point og:image expectations at `site.ogImage`.
**Warning signs:** red `layout.test.js`/`devpages.test.js` right after the head task.

### Pitfall 2: Page intent vs. site-wide noindex
**What goes wrong:** The gate skips description and sitemap checks on preview builds (every page has noindex), so D-19 "every build" is silently broken. Or it flags the 404 page as missing from the sitemap.
**How to avoid:** Pattern 4, the shared predicate. Gate rule G9 also checks the noindex in both directions: missing on any page of a non-indexable build → fail; present on an indexable page of an indexable build → fail.

### Pitfall 3: TODO gate breaks tests or dev
**How to avoid:** TODO rule (G10) runs only when `site.indexable`. `npm run dev` never runs the gate. Tests check G10 with fixture folders. The real-source indexable test build runs Eleventy only, not the gate.

### Pitfall 4: IIS 500.19 from a duplicate MIME entry or a locked section
**What goes wrong:** A `<mimeMap>` for an extension the server already maps gives "HTTP Error 500.19 … Cannot add duplicate collection entry". The fix is `<remove fileExtension=".webmanifest" />` before `<mimeMap …>` [CITED: learn.microsoft.com/en-us/archive/blogs/chaun/iis7-error-cannot-add-duplicate-collection-entry-of-type-mimemap-with-unique-key-attribute-fileextension]. If the server admin has locked `httpErrors` delegation, the same 500.19 appears for the whole site [ASSUMED].
**How to avoid:** Always pair `<remove>` with each `<mimeMap>` and each `<error>` (`<remove statusCode="404" />`). Checklist: "on 500.19, unlock Error Pages in IIS Manager → Feature Delegation (Read/Write)".

### Pitfall 5: Testing the IIS 404 on the server itself
**What goes wrong:** `errorMode` defaults to `DetailedLocalOnly`, so requests from the server see IIS's detailed error page, not `/404.html` [CITED: learn.microsoft.com/en-us/iis/configuration/system.webserver/httperrors/].
**How to avoid:** The checklist says to test from another machine (`curl -I https://<domena>/nie-ma/` → 404 + Polish page). Do not set `errorMode` in web.config (D-16 minimal). `ExecuteURL` requires a server-relative path ("the path value has to be a server relative URL"), so use `htmlBaseUrl` without a base. ExecuteURL keeps status 404, not 200 or 302, per community sources [ASSUMED. Verify with `curl -I` at cutover].

### Pitfall 6: Discord preview caching and image size
**What goes wrong:** An old card persists. A large image may not render.
**How to avoid:** Versioned filename (`og-default-v1.jpg`), a JPEG under 300 KB (the probe produced 111 KB), and `og:image:width`/`height`/`alt` + `twitter:card=summary_large_image`. Discord caches per URL [CITED: .planning/research/PITFALLS.md Pitfall 11, MEDIUM]. Verify by pasting the Pages preview URL into a private Discord channel after deploy. Discord ignores `noindex`, so the preview host is a valid test target.

### Pitfall 7: Non-square source logo
**What goes wrong:** `logo.png` is 4608×4500 (measured with sharp this session). A plain resize gives a non-square JSON-LD logo or favicon.
**How to avoid:** `resize(n, n, { fit: "contain", background: transparent })`. Check squareness in a test (PNG IHDR width == height).

### Pitfall 8: robots.txt under a subpath is never read
**What goes wrong:** Crawlers fetch only host-root `/robots.txt`. On the Pages preview, `/IBC-Website/robots.txt` is inert.
**How to avoid:** Nothing to fix. Know it so nobody relies on robots.txt for the preview. The noindex meta is the guard. On IIS (PATH_PREFIX `/`) it works normally.

### Pitfall 9: PowerShell keeps `SITE_INDEXABLE` set
**What goes wrong:** The documented form `$env:SITE_INDEXABLE="1"; npm run build` persists for the whole session (same as review R2-WR-03), so a later local build is indexable.
**How to avoid:** The README pairs it with `Remove-Item Env:SITE_INDEXABLE`. The gate prints one loud line on indexable builds, e.g. `check-seo: INDEXABLE build for https://<domena>/`.

### Pitfall 10: Parallel Phase 3 touches the same files
**What goes wrong:** Phase 3 can run in parallel (ROADMAP). It edits `head.njk` (fonts, Font Awesome), `eleventy.config.js` (image plugin), `package.json` (eleventy-img, which brings sharp) and possibly `logo.png`.
**How to avoid:** Keep the stylesheet/preconnect lines in the head as-is and move them unchanged into the new partial. Keep the JSON-LD logo and icons as separate generated files, independent of Phase 3's `logo.png` resize. Expect a `package.json` merge.

## Code Examples

### SEO head (sketch; tag set is the deliverable)
```njk
{# partials/seo-head.njk — the only writer of SEO meta #}
{% set isHome = page.url == "/" %}
{% set fullTitle = title if isHome else ((title or site.name) ~ " | " ~ site.shortName) %}
{% set canonical = page.url | htmlBaseUrl(site.url) %}
{% set ogImageUrl = (ogImage or site.ogImage) | htmlBaseUrl(site.url) %}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ fullTitle }}</title>
  {% if description %}<meta name="description" content="{{ description }}">{% endif %}
  <link rel="canonical" href="{{ canonical }}">
  {% if not site.indexable or not (page.url | isIndexableUrl) %}<meta name="robots" content="noindex">{% endif %}
  {% if todo %}<!-- TODO({{ todo }}) -->{% endif %}
  {# stylesheet / preconnect / Font Awesome lines: keep exactly as today (Phase 3 owns them) #}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="{{ site.name }}">
  <meta property="og:locale" content="{{ site.locale }}">
  <meta property="og:title" content="{{ fullTitle }}">
  {% if description %}<meta property="og:description" content="{{ description }}">{% endif %}
  <meta property="og:url" content="{{ canonical }}">
  <meta property="og:image" content="{{ ogImageUrl }}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{{ ogImageAlt or site.ogImageAlt }}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{{ fullTitle }}">
  {% if description %}<meta name="twitter:description" content="{{ description }}">{% endif %}
  <meta name="twitter:image" content="{{ ogImageUrl }}">
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" href="/assets/icons/icon-192.png" type="image/png">
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="{{ site.themeColor }}">
  {% if isHome %}<script type="application/ld+json">{{ site | schemaGraph | jsonLd | safe }}</script>{% endif %}
```
Notes: `og:locale` format is `language_TERRITORY` (`pl_PL`) [CITED: ogp.me]. Favicon recipe: ICO linked with `sizes="32x32"`, apple-touch-icon 180, manifest 192/512 [CITED: evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs]. Google Search supports ICO/PNG favicons (no SVG listed), wants a square, and recommends "larger than 48x48px". That is why a 192 px PNG `rel="icon"` is listed in addition to the ICO [CITED: developers.google.com/search/docs/appearance/favicon-in-search]. Drop `<meta name="author">`, which has no SEO value. Keeping it is harmless if the planner prefers no-change.

### JSON-LD builder
```js
// lib/schema.js
export function buildSchemaGraph(site) {
  const home = site.url + site.pathPrefix;            // "https://host/" or "https://host/IBC-Website/"
  const orgId = `${home}#organization`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: site.name,                                // "Inglourious Basterds Clan" (D-10)
        alternateName: ["IBC", "IBC Clan"],             // D-10
        url: home,
        logo: `${home}assets/brand/ibc-logo-512.png`,   // transparent, square (D-12)
        foundingDate: "2018",                           // D-10
        description: "Taktyczna symulacja militarna (Milsim) w grze Arma 3. …", // reuse confirmed hero copy → no TODO
        sameAs: [...site.social.map((s) => s.url), site.discord.invite],         // D-11
      },
      {
        "@type": "WebSite",
        "@id": `${home}#website`,
        name: site.name,
        alternateName: ["IBC", "IBC Clan"],
        url: home,
        inLanguage: "pl-PL",
        publisher: { "@id": orgId },
      },
    ],
  };
}

// lib/seo.js
export const jsonLd = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c");
const nonIndexable = ["/404.html"];
export const isIndexableUrl = (url) =>
  typeof url === "string" && !nonIndexable.includes(url) && !url.startsWith("/_dev/");
```
`home` must equal the canonical of `/`. Assert `Organization.url === canonical(index.html)` in a test. The Organization `description` reuses the hero paragraph text, which is existing, user-written copy [VERIFIED: src/index.njk:11 `<p>Taktyczna symulacja militarna (Milsim) w grze Arma 3. Prowadzimy realistyczne operacje bojowe, szkolenia taktyczne i zorganizowane misje kooperacyjne. Stawiamy na immersję, dyscyplinę radiową i współpracę zespołową.</p>`; front matter today is only `layout: layouts/base.njk` (lines 1-3)], so it needs no TODO. The `@id` fragments and `inLanguage` are conventions [ASSUMED].

### Generated files
```njk
{# src/sitemap.xml.njk #}
---
permalink: /sitemap.xml
eleventyExcludeFromCollections: true
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{%- for p in collections.all %}{% if p.url and (p.url | isIndexableUrl) %}
  <url><loc>{{ p.url | htmlBaseUrl(site.url) }}</loc></url>
{%- endif %}{% endfor %}
</urlset>
```
```njk
{# src/robots.txt.njk — never Disallow; Sitemap line only on indexable builds #}
---
permalink: /robots.txt
eleventyExcludeFromCollections: true
---
User-agent: *
Allow: /
{% if site.indexable %}
Sitemap: {{ "/sitemap.xml" | htmlBaseUrl(site.url) }}
{% endif %}
```
```njk
{# src/web.config.njk — D-16 minimal; GitHub Pages ignores it, IIS hides web.config from requests #}
---
permalink: /web.config
eleventyExcludeFromCollections: true
---
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <httpErrors>
      <remove statusCode="404" subStatusCode="-1" />
      <error statusCode="404" path="{{ '/404.html' | htmlBaseUrl }}" responseMode="ExecuteURL" />
    </httpErrors>
    <staticContent>
      <remove fileExtension=".webmanifest" />
      <mimeMap fileExtension=".webmanifest" mimeType="application/manifest+json" />
    </staticContent>
  </system.webServer>
</configuration>
```
```njk
{# src/site.webmanifest.njk — no service worker, no PWA (PITFALLS 20) #}
---
permalink: /site.webmanifest
eleventyExcludeFromCollections: true
---
{
  "name": "{{ site.name }}",
  "short_name": "{{ site.shortName }}",
  "lang": "pl",
  "start_url": "{{ '/' | htmlBaseUrl }}",
  "scope": "{{ '/' | htmlBaseUrl }}",
  "display": "browser",
  "background_color": "{{ site.themeColor }}",
  "theme_color": "{{ site.themeColor }}",
  "icons": [
    { "src": "{{ '/assets/icons/icon-192.png' | htmlBaseUrl }}", "sizes": "192x192", "type": "image/png" },
    { "src": "{{ '/assets/icons/icon-512.png' | htmlBaseUrl }}", "sizes": "512x512", "type": "image/png" }
  ]
}
```
```njk
{# src/404.njk #}
---
layout: layouts/base.njk
title: "404 – Nie znaleziono strony"
permalink: /404.html
eleventyExcludeFromCollections: true
todo: "FACTS-02"
---
<section class="section-container">
  <!-- TODO(FACTS-02): treść 404 do potwierdzenia -->
  <div class="section-header"><h1>404 // UTRACONO SYGNAŁ</h1><p>Ta strona nie istnieje.</p></div>
  <p><a href="/" class="hud-btn">Wróć na stronę główną</a> {% include "partials/discord-cta.njk" %}</p>
</section>
```
In `eleventy.config.js`: `addFilter("isIndexableUrl", isIndexableUrl)`, `addFilter("jsonLd", jsonLd)`, `addFilter("schemaGraph", buildSchemaGraph)`, plus `addPassthroughCopy({ "src/favicon.ico": "favicon.ico" })`. `src/assets/**` is already copied [VERIFIED: eleventy.config.js:8-12 `"src/css": "css",` `"src/js": "js",` `"src/assets": "assets",`]. The 404 `<h1>` keeps "one h1 per page". A 404 copy variant of the Discord CTA (class `header-cta`) may need its own small partial or class. Planner's call.

### Gate rules (check-seo.js)
| # | Rule | Builds |
|---|------|--------|
| G1 | Exactly one `<title>`, non-empty. Unique across indexable pages | every |
| G2 | Exactly one `<link rel="canonical">`, absolute, equals `site.url + site.pathPrefix + <url of file>` (stronger than "starts with site.url") | every |
| G3 | `og:image` and `twitter:image` present, absolute, start with `site.url + pathPrefix`, and the target file exists in outDir. `og:url` equals the canonical | every |
| G4 | Indexable page (predicate) has exactly one non-empty `meta description` | every |
| G5 | Every `<script type="application/ld+json">` passes `JSON.parse`. None contains `"@type"` `Event` or `SportsTeam` | every |
| G6 | No `<meta name="keywords">` | every |
| G7 | `sitemap.xml` exists. Every `<loc>` is absolute under the base and maps to an existing, indexable file. Every indexable HTML page is listed | every |
| G8 | `robots.txt` exists and has no `Disallow: /`. On indexable builds it contains `Sitemap: <base>sitemap.xml` | every |
| G9 | Non-indexable build: every HTML page has `robots noindex`. Indexable build: indexable pages lack it, non-indexable pages have it | every |
| G10 | No `TODO` token (regex `/\bTODO\b/`) in any shipped text file (`.html .xml .txt .webmanifest .config .css .js .json`) | `SITE_INDEXABLE=1` only |

G1, G5 (type ban), G6 and G8–G9 go beyond D-19's minimum list. They are cheap, and each enforces a locked decision (SEO-01 unique title, D-14, D-15). `src/` currently contains no `TODO` at all (grep exit 1 this session), so G10 starts clean apart from the deliberate drafts.

**TODO marker convention (Claude's discretion):** `TODO(FACTS-NN)`, where `NN` is the row in `FACTS.md`. It must reach the output, so put it (a) in an HTML comment next to drafted body copy, or (b) in a front-matter `todo: "FACTS-NN"` key that `seo-head.njk` renders as `<!-- TODO(FACTS-NN) -->` (keeps descriptions and Discord cards clean on the preview). Nunjucks `{# #}` comments are stripped, so they are NOT valid markers.

### ICO container (one-off generator)
```js
// PNG-embedded ICO (supported by all current browsers). pngs: [{ size, buf }]
function toIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, buf }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(buf.length, 8); e.writeUInt32LE(offset, 12);
    offset += buf.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.buf)]);
}
// favicon.ico = toIco([16, 32, 48] PNGs of the dark-tile icon)
```
The ICO layout is from training knowledge [ASSUMED]. Verify by opening the file in a browser tab, and in a test (read the header: type 1, count 3).

### OG card and icons (probe that ran this session)
```js
// sharp 0.35.5 — produced a 1200×630 JPEG of 111,020 bytes and a 192 px tile icon on Windows
const logo = await sharp("src/assets/logo.png").resize(420, 420, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
await sharp("src/assets/hero-bg.jpg").resize(1200, 630, { fit: "cover" })
  .composite([{ input: Buffer.from(svgOverlay) }, { input: logo, left: 90, top: 105 }])
  .jpeg({ quality: 82, mozjpeg: true }).toFile("src/assets/og/og-default-v1.jpg");
const tile = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="96" fill="#080e11"/></svg>');
```
`svgOverlay` is a 1200×630 SVG with a `#080e11` scrim and `<text>` in `#cbb18a`. Text renders through system fonts via fontconfig/pango, so the result depends on the machine. That is acceptable because the file is committed. In the probe, a long headline overflowed the right edge, so the layout needs a human visual check (checkpoint) and a ~400 px-wide preview check for Discord readability. `hero-bg.jpg` is actually a PNG (1920×1080) [VERIFIED: sharp metadata this session], and sharp reads it fine.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `SportsTeam` + `meta keywords` | Organization + WebSite `@graph`, no keywords | Locked in this project (D-14). Google ignores keywords | Remove both |
| FAQ rich results | Not shown for any site | Google retired them 2026-05-07 [CITED: .planning/research/STACK.md:187, MEDIUM] | Do not add FAQPage here |
| Lighthouse PWA category / service workers for "score" | Manifest + icons for polish only | Lighthouse 12 dropped PWA [CITED: .planning/research/PITFALLS.md Pitfall 20] | `display: browser`, no SW |
| `url` filter for the prefix | `htmlBaseUrl` (HtmlBasePlugin) | Eleventy 2–3 | `url` still exists (`defaultConfig.js:90`), but use `htmlBaseUrl` everywhere |

**Deprecated/outdated:** `<meta name="keywords">` (ignored by Google). SportsTeam markup for a gaming clan (wrong type, locked out). `og:image` as a relative path (the current bug).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | IIS `ExecuteURL` to `/404.html` returns status 404 (not 200/302) for missing static files | Pitfall 5, web.config | Soft-404s on the final host. Caught by the `curl -I` cutover step |
| A2 | `httpErrors` is delegated (not locked) on a default IIS install | Pitfall 4 | Site-wide 500.19 after deploy. Checklist has the unlock step |
| A3 | Discord uses `og:*`, `twitter:card` (large image) and `theme-color`, and caches per URL | Pitfall 6 | Preview shape differs. Manual Discord check covers it |
| A4 | ICO header layout in the generator snippet | Code Examples | Broken favicon. Test parses the header, and a browser check confirms |
| A5 | `@id` fragment naming and `inLanguage: "pl-PL"` | JSON-LD builder | None functionally (conventions) |
| A6 | Proposed values: `shortName "IBC"`, `locale "pl_PL"`, `ogImage` path, `ogImageAlt` text, icon paths | Pattern 1 | Cosmetic. Planner may rename |
| A7 | GitHub Pages serves `.webmanifest` with a manifest MIME type and serves `404.html` from the artifact root for missing paths under `/IBC-Website/` | 404 / manifest | Wrong 404 page on the preview. Checked manually after the first deploy |
| A8 | Leaving out `<meta name="author">` is acceptable | Head sketch | None |

## Open Questions

1. **Do Discord's embed colours follow `theme-color` `#080e11`?**
   - What we know: D-09 locks `#080e11`. Discord reportedly uses `theme-color` for the embed stripe.
   - What's unclear: whether a near-black stripe looks good in Discord's dark theme.
   - Recommendation: ship D-09 as decided. Mention it at the visual checkpoint. A stripe change would need a user decision (it conflicts with D-09).
2. **FACTS.md location**
   - Recommendation: repo root `FACTS.md` (visible to the user, reused by Phase 4 CONT-06), with a README pointer. Rows: id, location, drafted text, status.
3. **Should `og:title` drop the ` | IBC` suffix?**
   - Recommendation: keep it identical to `<title>` (simplest, consistent). Revisit in Phase 4 if subpage cards look cluttered.
4. **Reach of the IIS release build**
   - What we know: hosting is out of scope. The user builds locally with `SITE_URL` + `SITE_INDEXABLE=1` and copies `_site/`.
   - Recommendation: document the commands in the README (PowerShell + Git Bash, with `Remove-Item`). No new CI workflow.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build, gate, tests, generator | ✓ | v26.7.0 local (CI uses `.nvmrc` 24) | — |
| npm | install sharp | ✓ | 11.19.0 | — |
| sharp prebuilt binary (win32-x64) | `make-seo-images.js` | ✓ (installed in scratch, renders SVG text) | 0.35.5 | Chrome CDP screenshot |
| Google Chrome | optional preview/visual checks | ✓ | `C:/Program Files/Google/Chrome/Application/chrome.exe` | Edge present |
| git | commits | ✓ | 2.45.1 | — |
| IIS (Windows Server) | web.config behaviour | ✗ (user's server) | — | Manual cutover checklist. Not testable here |
| Discord / Rich Results Test / Search Console | manual verification | external | — | Rich Results Test accepts a pasted code snippet, so it works before the domain exists |

**Missing dependencies with no fallback:** none for the build. IIS behaviour is verified only at cutover (manual).
**Missing dependencies with fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` + `node:assert/strict` (Node built-in), existing harness `test/helpers.js` (`build`, `runBuild`, `cleanEnv`, `read`, `listFiles`, `attrValues`, `block`) |
| Config file | none. `package.json` `"test": "node --test \"test/*.test.js\""` |
| Quick run command | `node --test test/seo.test.js test/seo-gate.test.js` |
| Full suite command | `npm test` (56 tests, ~5 s before this phase, measured this session) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEO-01 | Home title = D-01 string. Dev page title gets ` \| IBC`. Description present. One canonical = `base + url`, absolute in root, prefix and mutated builds | integration (build + parse) | `node --test test/seo.test.js` | ❌ Wave 0 |
| SEO-01 | Gate fails on a missing/relative/foreign canonical and a missing description (fixtures) | unit (fixture dirs) | `node --test test/seo-gate.test.js` | ❌ Wave 0 |
| SEO-02 | `sitemap.xml` lists exactly the indexable pages as absolute URLs (root + prefix). No 404/_dev. `robots.txt` has the `Sitemap:` line only with `SITE_INDEXABLE=1`, never `Disallow: /` | integration | `node --test test/seo.test.js` | ❌ Wave 0 |
| SEO-02 | Gate fails when an indexable page is missing from the sitemap (fixture) | unit | `node --test test/seo-gate.test.js` | ❌ Wave 0 |
| SEO-03 | `og:image`/`og:url`/`twitter:image` absolute, follow mutated `SITE_URL`. `twitter:card=summary_large_image`. OG file exists and is 1200×630 (JPEG SOF parse in the test), < 300 KB | integration | `node --test test/seo.test.js` | ❌ Wave 0 |
| SEO-03 | Discord renders the card | manual | paste the Pages URL into a private Discord channel after deploy | manual |
| SEO-04 | `favicon.ico` at the output root (ICO header: type 1, ≥ 1 image). Icons 180/192/512 square PNG (IHDR). Manifest parses as JSON, icons/start_url prefixed. `theme-color` = `#080e11`. All head links resolve (existing `links.test.js (a)` covers this automatically) | integration | `node --test test/seo.test.js test/links.test.js` | ❌ Wave 0 (links ✅) |
| SEO-05 | Home JSON-LD parses. `@graph` has Organization + WebSite. `alternateName` includes "IBC". `foundingDate` "2018". `sameAs` = 2 social + invite. Logo square ≥ 112. No SportsTeam/Event/keywords on any page. `Organization.url` == home canonical | integration + unit (`lib/schema.js`) | `node --test test/seo.test.js` | ❌ Wave 0 |
| SEO-05 | Rich Results Test / validator.schema.org valid | manual | paste the built `_site/index.html` head snippet | manual |
| SEO-07 | `404.html` at the output root, base layout chrome (header/footer byte-equal to home, minus active nav), Polish copy, home link + invite, `noindex`, not in sitemap. Links resolve in the prefix build | integration | `node --test test/seo.test.js test/links.test.js` | ❌ Wave 0 |
| SEO-07 | `web.config` 404 path = `/404.html` (root) and `/IBC-Website/404.html` (prefix). Contains `<remove fileExtension=".webmanifest" />` + mimeMap. No `rewrite` element | integration | `node --test test/seo.test.js` | ❌ Wave 0 |
| SEO-08 | Gate passes on real root, prefix and mutated preview builds. Each rule G1–G10 fails its fixture with a message naming the file. TODO fixture fails only with `SITE_INDEXABLE=1` | unit + integration | `node --test test/seo-gate.test.js` | ❌ Wave 0 |
| SEO-08 | `package.json` build = `node scripts/clean.js && eleventy && node scripts/check-seo.js` | unit | `node --test test/devpages.test.js` (update (i)) | ✅ (update) |
| SEO-09 | No flag → every page `noindex`. `SITE_INDEXABLE=1` + https SITE_URL → home has no noindex, 404 keeps it. `SITE_INDEXABLE=true` → still noindex. `SITE_INDEXABLE=1` with localhost/http fails | integration | `node --test test/seo.test.js test/build.test.js` | ❌ Wave 0 |
| SEO-09 | `pages.yml` never contains `SITE_INDEXABLE`. README contains the cutover checklist headings/items (SITE_INDEXABLE, web.config, Search Console, sitemap, Discord/OG version, preview noindex) | unit (text) | `node --test test/workflow.test.js test/links.test.js` | ✅ (extend) |
| D-05 | Every `TODO(FACTS-NN)` in `src/` has a FACTS.md row and vice versa (open rows) | unit (text) | `node --test test/facts.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/seo.test.js test/seo-gate.test.js` (plus any Phase 1 suite the task touches)
- **Per wave merge:** `npm test`
- **Phase gate:** `npm test` green, plus `SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/ npm run build` exits 0 (gate passes in preview mode with drafts present), plus `SITE_URL=https://example.org SITE_INDEXABLE=1 npm run build` exits 1 naming the TODO markers (proves G10 while drafts are unconfirmed). Then `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `test/helpers.js`: add `"SITE_INDEXABLE"` to `buildEnvKeys`. Add a `checkSeo(outDir, env)` helper (spawns `node scripts/check-seo.js --dir <outDir>` with `cleanEnv(env)`) and a fixture writer (`writeFixture(name, files)` under `_test/`).
- [ ] `test/seo.test.js`: covers SEO-01..05, 07, 09 on real builds (prefix test dirs with `seo-`, since suites run in parallel processes).
- [ ] `test/seo-gate.test.js`: covers SEO-08 with fixtures (one per rule G1–G10) plus real-build passes.
- [ ] `test/facts.test.js`: D-05 / CONT-06 cross-reference.
- [ ] Update `test/layout.test.js:105-110`, `test/devpages.test.js:12, (c), (d), (i)`, `test/build.test.js` og:image expectations, `test/links.test.js (d)/(e)` (og path. Add `.webmanifest`/`.config` to the localhost scan in (e)).
- [ ] `test/workflow.test.js`: add "never sets SITE_INDEXABLE" (mirror of test (h)).

## Security Domain

### Applicable ASVS Categories (Level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — (static site) |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Validation, Sanitization, Encoding | yes | Nunjucks autoescape for attributes. `jsonLd()` escapes `<` → `\u003c` in `<script type="application/ld+json">`. `SITE_URL` shape validation in site.js |
| V6 Cryptography | no | — |
| V14 Configuration | yes | `web.config` minimal (no secrets, no rewrite rules). The gate blocks noindex leaks and keeps localhost URLs out of deployable builds. Pinned dev dependency with a human-verify checkpoint |

### Known Threat Patterns for a static Eleventy site

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| JSON-LD `</script>` breakout from data strings | Tampering | `JSON.stringify(...).replace(/</g, "\\u003c")` + `\| safe` only on that output |
| Attribute injection via front-matter description/title | Tampering | Autoescape (default on). Never `\| safe` on meta values |
| Wrong-host/indexed preview (brand split, duplicate content) | Spoofing/Info disclosure | Opt-in `SITE_INDEXABLE=1`, noindex meta (not Disallow), gate G9 in both directions, self-canonical (D-18) |
| Public `web.config` on GitHub Pages | Info disclosure | Contains only the 404 mapping + MIME map. No credentials or paths. IIS blocks requests for `web.config` by default [ASSUMED] |
| Supply chain via the new dev dependency | Tampering | `sharp` pinned via the lockfile, checkpoint before install, used only by a one-off script (not in CI build/test paths) |
| Reverse tabnabbing on new social links | Tampering | Keep `target="_blank" rel="noopener noreferrer"` (existing test `layout.test.js` "external links are safe") |

## Sources

### Primary (HIGH confidence, read or executed this session)
- `node_modules/@11ty/eleventy/src/Plugins/HtmlBasePlugin.js`: `htmlBaseUrl` semantics, html-only transform
- `node_modules/@11ty/posthtml-urls/lib/defaultOptions.js`: rewritten attributes (`meta content` only for refresh)
- `node_modules/@11ty/eleventy/src/Eleventy.js:1405-1470`: `eleventy.after` args and fatal error handling
- `node_modules/@11ty/eleventy/src/Template.js:858-918`: result object shape (data only with `dataFilterSelectors`)
- `node_modules/@11ty/eleventy-dev-server/server.js:603-607`: automatic `404.html`
- `node_modules/@11ty/eleventy/src/UserConfig.js:125` + `nunjucks/src/environment.js:68`: autoescape default
- Scratch prototype build (copy of repo + sitemap/robots/web.config/404 templates) with and without `PATH_PREFIX`
- sharp 0.35.5 scratch probe: OG card 1200×630 / 111 KB, icon tile, logo 4608×4500, hero is PNG 1920×1080
- npm registry (`npm view`, gsd `package-legitimacy check`): sharp, png-to-ico, eleventy-img sharp range
- Repo files: `src/_data/site.js`, `partials/head.njk`, `partials/footer.njk`, `package.json`, `test/*.test.js`, `.github/workflows/pages.yml`, `README.md`, Phase 1 review disposition

### Secondary (MEDIUM, official docs fetched)
- https://developers.google.com/search/docs/appearance/structured-data/organization
- https://developers.google.com/search/docs/appearance/site-names
- https://developers.google.com/search/docs/crawling-indexing/block-indexing
- https://developers.google.com/search/docs/appearance/favicon-in-search
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://learn.microsoft.com/en-us/iis/configuration/system.webserver/httperrors/
- https://learn.microsoft.com/en-us/archive/blogs/chaun/iis7-error-cannot-add-duplicate-collection-entry-of-type-mimemap-with-unique-key-attribute-fileextension
- https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs
- https://ogp.me (og:locale format)

### Tertiary (LOW, needs validation at cutover)
- Web search results on the IIS ExecuteURL status code (umbraco forum, tedgustaf.com): status 404 is preserved
- Discord embed behaviour (project PITFALLS.md, community-sourced)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Only Eleventy (installed) + sharp (installed and run in scratch).
- Architecture: HIGH. Filters and generated templates were prototyped. The gate design follows from the D-19 constraints.
- Pitfalls: MEDIUM-HIGH. Repo pitfalls were verified by reading the tests. IIS and Discord rest on docs/community and are verified manually at cutover.

**Research date:** 2026-10-06
**Valid until:** 2026-11-05 (stable domain. Re-check the sharp version before install)
