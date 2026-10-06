# Phase 2: Technical SEO - Context

**Gathered:** 2026-10-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Every page the site builds is ready for search and sharing from the start. That means a unique title, a meta description, an absolute canonical, absolute OG/Twitter tags with a 1200×630 image, favicons, a web manifest and `theme-color`. The home page gets Organization + WebSite JSON-LD, and SportsTeam and meta keywords are removed. The build also produces `sitemap.xml` + `robots.txt` and a Polish 404 page. A post-build gate fails on SEO errors and on leftover TODO markers. Non-final hosts get `noindex`, and a domain cutover checklist is documented.

**New in this discussion:** the final production host is **Windows Server IIS** (domain still unknown). The current GitHub Pages subpath stays as a noindex preview.

Not in this phase: breadcrumbs + BreadcrumbList (SEO-06, Phase 4), new subpages and the nav switch (Phase 4), image/font/icon optimisation (Phase 3), visual refresh (Phase 5), IIS server setup itself (HTTPS, bindings, URL Rewrite) — hosting stays out of scope.

</domain>

<decisions>
## Implementation Decisions

### Search snippet wording (SEO-01)
- **D-01:** Home `<title>` is **keyword first**: `Klan Arma 3 Milsim – Inglourious Basterds Clan (IBC)`. It replaces `IBC Clan // Wizytówka Taktyczna Arma 3`.
- **D-02:** Subpage titles = page `title` from front matter + ` | IBC`, appended automatically by the layout (e.g. `Jak dołączyć do klanu Arma 3 | IBC`). The home page uses its full title with no suffix.
- **D-03:** Home meta description = a **recruitment pitch** drafted by Claude in natural Polish: Polish clan, since 2018, regular co-op operations, recruiting, ending with a nudge to join via Discord. Keep it within about 150–160 chars. It is drafted copy, so it carries a TODO marker (see D-05).
- **D-04:** Every indexable page **must** declare its own `description`. A missing description fails the build; there is no site-wide fallback. The 404 page is exempt (it is noindex and not in the sitemap).
- **D-05:** Drafted copy (home description, 404 text, OG card text if any wording is new) gets **TODO markers** and is listed in **`FACTS.md`** (repo root or `.planning/`, planner decides; Phase 4 / CONT-06 reuses the same file). The user confirms it and removes the markers.

### Share image & icons (SEO-03, SEO-04)
- **D-06:** The default OG image is a **designed 1200×630 card**: a crop of `hero-bg.jpg` + the IBC rose logo + the text "Klan Arma 3 Milsim" (and/or the clan name) in the HUD style (dark palette, accent `#cbb18a`, tactical look). It is generated once and **committed as a versioned file** (e.g. `og-default-v1.jpg`) so Discord/Facebook caches can be busted by renaming it. It must stay readable at Discord's small preview size.
- **D-07:** There is one default OG image, and any page can override it with `ogImage` in front matter. `og:image`, `og:url`, `twitter:image` are absolute (via `site.url` + pathPrefix). Twitter card = `summary_large_image`.
- **D-08:** Favicons / app icons = **the rose logo on a dark rounded tile** in the site background colour `#080e11`, so it reads on both light and dark tabs. The same artwork is used for favicon (ICO and/or SVG/PNG sizes), `apple-touch-icon` (180), and the manifest icons 192/512. This also fixes the pre-existing `favicon.ico` 404 (STATE.md).
- **D-09:** `theme-color` = site background `--bg-primary` **`#080e11`** (the manifest `background_color`/`theme_color` match it).

### Clan identity in JSON-LD (SEO-05)
- **D-10:** Organization: `name` "Inglourious Basterds Clan", `alternateName` `["IBC", "IBC Clan"]`, `foundingDate` "2018", `url` = home absolute URL, Polish `description`.
- **D-11:** `sameAs` = **YouTube `https://www.youtube.com/@IBC_A3`, Facebook `https://www.facebook.com/IBCA3`, and the Discord invite** (`site.discord.invite`). No Steam or other profiles.
- **D-12:** Organization `logo` = **the transparent rose** (a resized copy of `logo.png`, square, ≥112 px as Google requires). The user picked this over the dark-tile icon even though it is faint on white.
- **D-13:** Social URLs move into **`site.js` as one list** (e.g. `site.social`). The footer icons and `sameAs` both read it, and the footer stops hardcoding YouTube/Facebook URLs. The Discord invite stays at `site.discord.invite` (single source, FOUND-04).
- **D-14:** Home has Organization + WebSite (WebSite `name`/`alternateName`/`url`, linked to the Organization by `@id`). **Remove the SportsTeam block and the meta keywords tag.** No Event markup (locked earlier).

### Indexing guard, IIS and 404 (SEO-02, SEO-07, SEO-08, SEO-09)
- **D-15:** **Explicit opt-in indexing:** every build is `noindex` unless **`SITE_INDEXABLE=1`** is set. The GitHub Pages workflow **never** sets it. The IIS release build does. If the flag is forgotten, the site is hidden, not leaked; the cutover checklist catches it. Non-final host = no flag. Use `<meta name="robots" content="noindex">` (not a robots.txt `Disallow`, which would stop crawlers from seeing the noindex).
- **D-16:** The build emits a **minimal `web.config`** into `_site/` for IIS: `<httpErrors>` mapping 404 → `/404.html` (pathPrefix-aware) and a MIME map for `.webmanifest` (`application/manifest+json`). **Nothing else**: no URL Rewrite, HTTPS or www redirects (those are server setup and out of scope). It must not break GitHub Pages, which ignores the file.
- **D-17:** The **Polish 404 page** uses the HUD "signal lost" tone (e.g. `404 // UTRACONO SYGNAŁ`) plus a plain Polish line ("Ta strona nie istnieje"), a button back to home and the Discord CTA. It renders in the shared base layout, is always `noindex`, and is excluded from the sitemap. The copy is drafted and marked TODO (D-05). It must also work as the GitHub Pages 404 (`404.html` at the output root; asset links must survive being served from arbitrary missing paths, so they are root-relative + pathPrefix).
- **D-18:** After cutover, **GitHub Pages stays as a noindex preview** deployed by the existing workflow. Its canonical stays **self-referencing**: no cross-domain canonical to the real domain, because Google advises against mixing noindex with a cross-domain canonical.
- **D-19:** **SEO gate scope:** a post-build check (`check-seo.js` per research) fails **every** build on: a missing/relative canonical or og:image, a canonical not starting with `site.url`, a missing description on an indexable page, invalid JSON-LD (unparseable), or an indexable page missing from the sitemap. **TODO markers fail only indexable builds** (`SITE_INDEXABLE=1`). The noindex Pages preview still deploys with drafts, so the user can review them live. Dev (`npm run dev`) never fails on TODOs. This refines STATE.md's "TODO gate fails production builds only".
- **D-20:** The **domain cutover checklist** (documented, Polish, e.g. in README) must cover at least: set `SITE_URL` (+ `PATH_PREFIX=/` on IIS) and `SITE_INDEXABLE=1` for the IIS build; deploy `_site/` incl. `web.config`; confirm on IIS that `/404.html` and `.webmanifest` are served; Search Console verification (DNS) + sitemap submission; check the Discord preview (bump the OG version if cached); confirm the Pages preview is still noindex. The research also suggests a 301 from the old host, but GitHub Pages cannot 301 to another domain. Noindex + self-canonical (D-18) is the accepted substitute; say so in the checklist.

### Already locked (from PROJECT.md / Phase 1, not re-discussed)
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope & requirements
- `.planning/ROADMAP.md` §Phase 2 — goal and the 5 success criteria
- `.planning/REQUIREMENTS.md` §SEO — SEO-01..05, SEO-07..09 (SEO-06 is Phase 4)
- `.planning/PROJECT.md` — constraints and key decisions (static output, single URL config, no Event markup)
- `.planning/STATE.md` §Blockers — noindex for non-final hosts, favicon.ico 404, TODO-gate scope note

### Research
- `.planning/research/SUMMARY.md` §Phase 2 — deliverables list, schema decision, cutover checklist items
- `.planning/research/ARCHITECTURE.md` — `site.js` shape incl. indexing switch, `seo-head.njk` pattern, `absoluteUrl` filter, `lib/schema.js`, generated SEO files, `check-seo.js` responsibilities, sitemap `lastmod` guidance
- `.planning/research/PITFALLS.md` — domain-less SEO / wrong-host indexing
- `.planning/research/STACK.md` — Eleventy plugin versions and gotchas

### Phase 1 outputs (must stay working)
- `.planning/phases/01-eleventy-foundation/01-CONTEXT.md` — D-01..D-04 (Pages subpath, workflow, env URL config, PR build job)
- `.planning/phases/01-eleventy-foundation/01-REVIEW-DISPOSITION.md` — open review warnings WR-01..03 / R2-* (check for any that touch head/SEO)
- `.planning/phases/01-eleventy-foundation/deferred-items.md` — deferred items (favicon 404 etc.)
- `README.md` — Polish build/deploy docs; the cutover checklist and the IIS notes are added here

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/_data/site.js` — already has `url` (no trailing slash), `pathPrefix`, `name`, `discord.invite`, `includeDevPages`, and the SITE_URL production guard. Extend it with `indexable` (from `SITE_INDEXABLE`), `social`, default description/OG image and theme colour.
- `src/_includes/partials/head.njk` — the current head: hardcoded title/description, `og:image` via `htmlBaseUrl(site.url)` (that filter already produces absolute URLs with pathPrefix), the SportsTeam JSON-LD and meta keywords to remove. It becomes the single SEO head writer.
- `src/_includes/layouts/base.njk` — the shared layout the 404 page renders through. The skip link and `<main id="main">` already exist.
- `src/_includes/partials/footer.njk` — the social icons to switch onto `site.social`.
- `src/_dev/layout-test.njk`, `layout-empty.njk` — dev-only pages (`devOnly` preprocessor); they must never reach the sitemap.
- `test/helpers.js` `build()` + `node --test` suites (`build.test.js`, `links.test.js`, `layout.test.js`, ...): build variants at root and `/IBC-Website/`. New SEO tests should follow this harness.
- `src/assets/logo.png` (4608×4500, transparent pale-beige low-poly rose) is the source for the icons and the JSON-LD logo. `src/assets/hero-bg.jpg` (actually a 1920×1080 PNG) is the source for the OG card.

### Established Patterns
- Absolute URLs come only from `site.url` (+ pathPrefix via the HTML Base plugin / `htmlBaseUrl`). Never hardcode a host (Phase 1 links audit test enforces this).
- Build-time config reaches client JS via `data-*` attributes; no inline secrets/hosts in JS.
- `npm run build` = `node scripts/clean.js && eleventy`; tests build into `_test/`, never `_site/`.

### Integration Points
- `eleventy.config.js` — add passthrough for icons/OG image, any filters (`absoluteUrl`, `jsonLd`), and possibly the post-build hook or script chain.
- `package.json` `build` script and `.github/workflows/pages.yml` build job — where `check-seo.js` runs. The Pages workflow must **not** set `SITE_INDEXABLE`.
- `src/index.njk` front matter — gets `title`/`description` (currently only `layout`).
- The 404 page at output root `404.html` (GitHub Pages convention) + `web.config` `<httpErrors>` (IIS).

</code_context>

<specifics>
## Specific Ideas

- Final host is **Windows Server IIS**; PATH_PREFIX will be `/` there. The Pages preview remains at `https://inglourious-basterds-clan.github.io/IBC-Website/`.
- Home title: `Klan Arma 3 Milsim – Inglourious Basterds Clan (IBC)`.
- 404 headline idea: `404 // UTRACONO SYGNAŁ`.
- Colours: background `#080e11`, accent `#cbb18a` (from `src/css/style.css` `:root`).
- Social: `https://www.youtube.com/@IBC_A3`, `https://www.facebook.com/IBCA3`, Discord invite from `site.discord.invite`.

</specifics>

<deferred>
## Deferred Ideas

- IIS server-side rules (http→https, www→apex redirects via URL Rewrite) — hosting setup, out of scope. Mention them in the cutover checklist as the user's server task only.
- MIME maps for `.avif`/`.woff2` in `web.config` — add in Phase 3, when those files first exist.

</deferred>

---

*Phase: 02-technical-seo*
*Context gathered: 2026-10-06*
