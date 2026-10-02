# Phase 1: Eleventy Foundation - Context

**Gathered:** 2026-10-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Move the existing single-page site into Eleventy 3.1.x + Nunjucks so it builds to plain static files in `_site/`. The result must look and behave as before. The site URL (`SITE_URL`) and the Discord invite are each defined once. A shared base layout (header, nav, footer, Discord CTA) lets a new page render the full chrome from front matter plus body alone. The output must work at a domain root and under a GitHub Pages subpath.

Not in this phase: SEO head/JSON-LD/sitemap (Phase 2), images/fonts/icons/CSS-JS split (Phase 3), real subpages and nav switch (Phase 4), a11y and visual refresh (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Pre-domain hosting & deploy
- **D-01:** Until a domain is bought, the site is hosted on **GitHub Pages under a subpath**: `https://inglourious-basterds-clan.github.io/IBC-Website/`. The `/IBC-Website/` pathPrefix is a real production setup, not just a test case. (Phase 2's noindex guard must treat this host as non-final.)
- **D-02:** Add a **GitHub Actions workflow** (`.github/workflows/`) that runs `npm ci && npm run build` on push to `main` and publishes `_site/` to GitHub Pages (Pages-from-Actions). The user accepted this, even though it slightly crosses "hosting is out of scope". The README must say which repo setting to enable (Settings → Pages → Source: GitHub Actions). — **Reversibility:** reversible — delete the workflow file.
- **D-03:** **URL config through env vars.** `src/_data/site.js` defaults to local values (`url: http://localhost:8080`, `pathPrefix: "/"`) and reads `SITE_URL` / `PATH_PREFIX` from `process.env`. The Actions workflow sets `SITE_URL=https://inglourious-basterds-clan.github.io` and `PATH_PREFIX=/IBC-Website/`. Domain cutover = change the workflow env (or the defaults). The single-value rule (FOUND-03) still holds: no other file hardcodes a host.
- **D-04:** The same workflow also runs on **pull requests as a build-only check** (no deploy). Phase 2's SEO gate (`check-seo.js`) will plug into this job later.

### Parity rules
- **D-05:** **Visual parity, invisible fixes allowed.** The home page must look and behave the same. Markup changes that multi-page/pathPrefix needs are allowed: root-relative asset paths through the HTML Base plugin, nav hrefs like `/#about`, the terminal reading the invite from a `data-discord-url` attribute (removes the 3rd copy of the invite), and replacing `<body id="hero">` with a real top anchor while keeping scroll-to-top and scroll-spy behaviour.
- **D-06:** The base layout adds a **skip link and `<main id="main">`** now. The skip link is visually hidden until focused, so parity holds. Phase 5 (A11Y-01) only verifies it.
- **D-07:** **Before any migration**, capture desktop and mobile screenshots plus mobile Lighthouse scores of the current site. Verify after migration with side-by-side screenshots and a manual checklist: hero, about, gallery lightbox (incl. keyboard), recruitment terminal, mobile menu, scroll-spy, footer easter egg. No automated visual-diff tooling.
- **D-08:** Out of Phase 1 scope even though they're "wrong" today: inline styles, the Font Awesome CDN, the Google Fonts `@import`, unoptimized images, meta keywords/SportsTeam JSON-LD. These stay as they are and are fixed in Phases 2/3.

### Shared chrome
- **D-09:** **Navigation is data-driven** from `src/_data/navigation.js`. Items currently point to home anchors (`/#about`, `/#gallery`, `/#recruitment`, top), so they work from any page. On the home page they still scroll, and scroll-spy still works. Phase 4 switches entries to real pages by editing data only.
- **D-10:** **Shared Discord CTA = a compact "Discord" hud-btn in the header on every page** plus the existing footer Discord icon, all read from `site.discord.invite`. The home terminal keeps its big "Wejdź na Discord" button (same config value). The CTA never depends on the terminal animation.
- **D-11:** The header Discord button is **added to the home page now**. The user accepted this one visible change to the home page in Phase 1. Style it with existing tokens/`.hud-btn` so it fits the current look. It must also work in the mobile header/menu.
- **D-12:** Prove success criterion 4 with a **dev-only layout test page** (e.g. `src/_dev/layout-test.njk`: front matter + body only). It renders in dev/CI checks and is **excluded from production output** (never deployed, never in a future sitemap).

### Repo layout
- **D-13:** **`src/` is the Eleventy input.** `index.html` → `src/index.njk`, and `css/`, `js/`, `assets/` move into `src/` with `git mv` (history is kept). The old root copies are deleted. The repo root keeps only config (`package.json`, `eleventy.config.js`, `.nvmrc`, `.gitignore`), docs, `LICENSE`, `.planning/`, `.github/`. `_site/`, `node_modules/` and `.cache/` are gitignored. — **Reversibility:** costly — moving back touches every path and the deploy workflow.
- **D-14:** **Delete the empty `api/` dir.** Leave the unused roster/calendar CSS/markup alone. Phase 3's CSS split removes it.
- **D-15:** **Add a Polish `README.md`**: requirements (Node 24 LTS), `npm run dev` / `npm run build`, the deploy folder is `_site/` (no longer the repo root), where `SITE_URL` / `PATH_PREFIX` / the Discord invite live, how the Pages workflow deploys, and the one-time Pages setting.

### Already locked (from PROJECT.md / research, not re-discussed)
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope & requirements
- `.planning/ROADMAP.md` §Phase 1 — goal and the 5 success criteria
- `.planning/REQUIREMENTS.md` §Foundation — FOUND-01..06
- `.planning/PROJECT.md` — constraints (static output, Polish only, single URL config) and key decisions
- `.planning/STATE.md` §Blockers — deploy-target change must be documented for the user

### Research (stack & architecture)
- `.planning/research/SUMMARY.md` — consolidated recommendations, Phase 1 deliverables
- `.planning/research/ARCHITECTURE.md` — `site.js` shape, pathPrefix/HTML Base pattern, project structure, build order step 1–2 ("Scaffold at parity", "Layout + config extraction")
- `.planning/research/STACK.md` — pinned versions, Node requirement, Eleventy gotchas
- `.planning/research/PITFALLS.md` — hash→multi-page breakage, domain-less URL pitfalls

### Existing code
- `.planning/codebase/CONCERNS.md` — Discord invite duplicated 3×, relative OG path, inline styles (context for what's fixed now vs later)
- `.planning/codebase/STRUCTURE.md`, `.planning/codebase/CONVENTIONS.md` — current file layout and code style to preserve
- `index.html`, `css/style.css`, `js/main.js` — the parity baseline

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `index.html` contains no `{{`, `{%` or `{#` sequences (checked in research), so it can be renamed to `.njk` safely.
- `.hud-btn` / `.hud-btn.active` styles already exist and can be reused for the header Discord button.
- Footer social icons block (`index.html:264-268`) becomes the footer partial almost unchanged.

### Established Patterns
- `js/main.js` runs feature init functions on DOMContentLoaded with guard clauses (`if (!lightbox) return;`). Features already mostly no-op when their DOM is absent, which helps subpages.
- Scroll-spy (`js/main.js:190-205`) does an **exact match** `link.getAttribute('href') === '#' + id`. Once hrefs become `/#about` (or `/IBC-Website/#about` after pathPrefix), that match **breaks**. Compare on the link's hash instead (`new URL(link.href).hash` or `link.hash`). The HEADER fallback maps to `'hero'`, so a replacement top anchor must keep that mapping consistent.

### Integration Points
- Discord invite `https://discord.gg/DhJwkeehJK` today appears in `index.html:230` (terminal button) and `index.html:265` (footer), plus a third copy as display text in `js/main.js:174` (`'Połączenie nawiązane: discord.gg/DhJwkeehJK'`), which must come from the `data-discord-url` attribute instead. All of them must come from `site.discord.invite`.
- Relative paths today: `css/style.css`, `js/main.js`, `assets/*.png|jpg`, `data-src="assets/..."` on gallery items (the lightbox reads `data-src`, so pathPrefix must apply to these attributes too, not just `src`/`href`).
- `.gitignore` currently only has `.planning/research/.cache/`.
- Repo remote: `Inglourious-Basterds-Clan/IBC-Website` → Pages subpath `/IBC-Website/`.
- Local Node is v26.7; CI should pin Node 24 LTS.

</code_context>

<specifics>
## Specific Ideas

- Pages URL: `https://inglourious-basterds-clan.github.io/IBC-Website/`.
- The README is in Polish (clan audience).
- The header Discord button should look native to the current HUD style, not like a new design element (the refresh is Phase 5).

</specifics>

<deferred>
## Deferred Ideas

None. The discussion stayed within phase scope. (Possible later addition: a `/discord/` redirect page, mentioned in research. Not discussed, not in scope.)

</deferred>

---

*Phase: 01-eleventy-foundation*
*Context gathered: 2026-10-02*
