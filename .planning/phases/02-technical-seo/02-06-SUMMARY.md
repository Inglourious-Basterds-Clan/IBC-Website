---
phase: 02-technical-seo
plan: 06
subsystem: seo
tags: [eleventy, 404, iis, web.config, readme, cutover, noindex]

requires:
  - phase: 02-technical-seo
    provides: "02-01 SITE_INDEXABLE switch and check-seo gate; 02-03 front-matter head (title suffix, noindex via isIndexableUrl, todo marker); 02-04 site.webmanifest; 02-05 footer socials"
provides:
  - "Polish 404 page _site/404.html (shared layout, always noindex, not in sitemap, FACTS-02 draft)"
  - "Minimal IIS _site/web.config: 404 -> pathPrefix-aware /404.html (ExecuteURL) and .webmanifest MIME"
  - "Polish README: SEO gate, SITE_INDEXABLE section, IIS cutover checklist (D-20), FACTS.md and SEO image docs"
  - "test/seo-files.test.js, test/docs.test.js, workflow test (i)"
affects: [03-performance, 04-content-pages, cutover]

actuals:
  tokens: 8000
  tasks: 2
  commits: 2
plan_head_before: 076c20a528834831792c0f92409514cba58ef451
plan_head_after: c34faa4a422681707d59e7bb71683ea713b380fe

tech-stack:
  added: []
  patterns:
    - "Generated host config as a Nunjucks template (web.config.njk) with htmlBaseUrl for server-relative prefixed paths"
    - "Every IIS collection entry is preceded by a <remove> to avoid 500.19 duplicates"
    - "Docs contract test: README headings, commands and referenced paths asserted in test/docs.test.js"

key-files:
  created:
    - src/404.njk
    - src/web.config.njk
    - test/seo-files.test.js
    - test/docs.test.js
  modified:
    - FACTS.md
    - README.md
    - .github/workflows/pages.yml
    - test/workflow.test.js
    - .planning/phases/01-eleventy-foundation/01-REVIEW-DISPOSITION.md

key-decisions:
  - "404 writes its own Discord hud-btn (not discord-cta.njk, which is the header variant with a hidden label)"
  - "web.config keeps an XML comment saying GitHub Pages ignores it; the explanatory Nunjucks comment sits before the XML declaration with whitespace control so the file starts with <?xml"
  - "README keeps GitHub Pages as the noindex preview; the cutover checklist targets a local IIS build, the workflow is never pointed at the final domain (D-18, R2-WR-02)"

patterns-established:
  - "404 chrome equality: header equals the home header minus active-nav, footer equals the home footer, checked per build kind"

requirements-completed: [SEO-07, SEO-09]

coverage:
  - id: D1
    description: "Polish 404 page in the shared layout with home and Discord buttons, root-relative+prefix links, noindex in every build, not in sitemap, draft copy registered as FACTS-02"
    requirement: SEO-07
    verification:
      - kind: integration
        ref: "test/seo-files.test.js#(a) 404.html renders in the shared layout"
        status: pass
      - kind: integration
        ref: "test/seo-files.test.js#(b) 404 links survive any missing path"
        status: pass
      - kind: integration
        ref: "test/seo-files.test.js#(c) 404 is noindex, unlisted and marked as a draft"
        status: pass
      - kind: integration
        ref: "test/seo-files.test.js#(e) the gate accepts the 404 in every build kind"
        status: pass
      - kind: unit
        ref: "test/facts.test.js"
        status: pass
    human_judgment: true
    rationale: "Visual check in npm run dev and on the deployed Pages preview (styled page, Polish letters, buttons work) and acceptance of the FACTS-02 draft wording need a human (plan human-check, backstop truth)"
  - id: D2
    description: "Minimal IIS web.config: httpErrors 404 -> /404.html (prefix-aware, ExecuteURL) after <remove>, .webmanifest MIME after <remove>, no rewrite/redirect/errorMode"
    requirement: SEO-07
    verification:
      - kind: integration
        ref: "test/seo-files.test.js#(d) web.config maps 404 and the manifest MIME type (D-16)"
        status: pass
    human_judgment: true
    rationale: "Real IIS behaviour (status 404 kept by ExecuteURL, MIME served, no 500.19) can only be confirmed with curl -I at cutover (research A1, A2)"
  - id: D3
    description: "Polish README: SEO gate, SITE_INDEXABLE switch with PowerShell Remove-Item and Git Bash, IIS cutover checklist covering every D-20 item, FACTS.md and SEO image sections, Konfiguracja lists env overrides"
    requirement: SEO-09
    verification:
      - kind: unit
        ref: "test/docs.test.js"
        status: pass
      - kind: unit
        ref: "test/links.test.js#(i) README matches the tree"
        status: pass
    human_judgment: true
    rationale: "Readability and correctness of the Polish prose for the user is a judgment call"
  - id: D4
    description: "GitHub Pages workflow never opts into indexing; header comment describes the noindex preview"
    requirement: SEO-09
    verification:
      - kind: unit
        ref: "test/workflow.test.js#(i) the workflow never opts into indexing (D-15, D-18)"
        status: pass
      - kind: unit
        ref: "test/workflow.test.js#(b) workflow-level permission is contents: read only"
        status: pass
    human_judgment: false
  - id: D5
    description: "01-REVIEW-DISPOSITION records WR-01, WR-04, R2-WR-01, R2-WR-02, R2-WR-03, R2-IN-04 as fixed, open 14"
    verification:
      - kind: other
        ref: "node -e disposition check from 02-06-PLAN Task 2 verify; grep -c '^open: 14'"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-10-07
status: complete
---

# Phase 2 Plan 06: Polish 404, IIS web.config and Cutover Docs Summary

**Polish `404 // UTRACONO SYGNAŁ` page in the shared layout (always noindex, FACTS-02 draft), a minimal IIS web.config mapping 404 to the prefix-aware /404.html with ExecuteURL plus the .webmanifest MIME type, and a Polish README with the SITE_INDEXABLE switch and a full D-20 IIS cutover checklist.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-10-07T19:21:17Z
- **Completed:** 2026-10-07T19:25:18Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- `src/404.njk` renders `_site/404.html` at the output root in root, prefix and indexable builds: one h1 `404 // UTRACONO SYGNAŁ`, status line, `Ta strona nie istnieje. ...`, a home button (`/` or `/IBC-Website/`) and a Discord button with `target="_blank" rel="noopener noreferrer"`. Header and footer match the home page (minus active-nav). It is noindex in every build (lib/seo.js), never in the sitemap, has no description and carries `TODO(FACTS-02)`.
- `src/web.config.njk` emits `_site/web.config` starting with `<?xml`: `<remove statusCode="404" subStatusCode="-1" />` + `<error ... path="/404.html|/IBC-Website/404.html" responseMode="ExecuteURL" />`, and `<remove fileExtension=".webmanifest" />` + `<mimeMap ... mimeType="application/manifest+json" />`. Nothing else.
- README (Polish): build comment names `scripts/check-seo.js`; Wdrożenie explains the gate and its three banners; new `## Indeksowanie w wyszukiwarkach (SITE_INDEXABLE)` with PowerShell (with `Remove-Item` for all three vars and the session warning) and Git Bash commands; `## Zmiana domeny` replaced by `## Przeniesienie na docelową domenę (IIS)` with a 7-step checklist (FACTS confirmed, indexable build + banner, copy `_site/` incl. web.config, `curl -I` from another machine + 500.19 unlock, Search Console DNS + sitemap, Discord preview + OG `-v2` bump, Pages preview still noindex), notes on 301 and IIS-side redirects; new FACTS.md and SEO image sections; Konfiguracja lists site.js values and the env overrides; Struktura projektu lists the new files.
- pages.yml header comment now describes the noindex Pages preview (1 line changed); workflow test (i) proves CI never mentions SITE_INDEXABLE.
- Phase 1 review disposition: six findings fixed, open 20 -> 14.

## Task Commits

1. **Task 1: Polish 404 page and minimal IIS web.config** - `922ba81` (feat)
2. **Task 2: README cutover checklist, indexing docs, workflow comment, docs/workflow tests, review disposition** - `c34faa4` (docs)

## Files Created/Modified

- `src/404.njk` - Polish 404 page (permalink /404.html, todo FACTS-02)
- `src/web.config.njk` - minimal IIS config (httpErrors 404 + .webmanifest MIME)
- `FACTS.md` - FACTS-02 row for the 404 draft copy
- `test/seo-files.test.js` - 404 and web.config checks (a)-(e) in root, prefix and indexable builds
- `README.md` - gate, indexing switch, IIS cutover checklist, FACTS.md, SEO images, config overrides, structure
- `.github/workflows/pages.yml` - second header comment line only
- `test/workflow.test.js` - test (i)
- `test/docs.test.js` - README docs contract (a)-(e)
- `.planning/phases/01-eleventy-foundation/01-REVIEW-DISPOSITION.md` - six findings fixed, open 14

## Verification

- `node --test test/seo-files.test.js test/facts.test.js test/links.test.js`: 19 pass, 0 fail
- `node --test test/docs.test.js test/workflow.test.js test/links.test.js`: 25 pass, 0 fail
- `npm test`: 149 tests, 149 pass, 0 fail
- `MSYS_NO_PATHCONV=1 SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/ npm run build`: gate OK, `_site/404.html` present, web.config holds `path="/IBC-Website/404.html"`
- `SITE_URL=https://guard.example npm run build`: `check-seo: OK, 2 page(s) checked`
- All acceptance-criteria greps print 1; `git diff --numstat` on pages.yml: 1 insertion, 1 deletion; disposition check prints no "not fixed".

## Decisions Made

- The 404 writes its own Discord `hud-btn` (the shared partial is the header variant with a hidden label on small screens), as the plan interfaces suggested.
- The explanatory Nunjucks comment in web.config.njk uses whitespace control so the output's first bytes are `<?xml`; the XML comment inside `<configuration>` says GitHub Pages ignores the file.
- In the README the `## Indeksowanie ...` section sits right after `## Wdrożenie`, and the cutover, FACTS.md and SEO image sections follow Konfiguracja, so the reading order goes from everyday builds to the one-time cutover.

## Deviations from Plan

None - plan executed exactly as written.

## Known Drafts

- `src/404.njk` copy is drafted (FACTS-02, `do potwierdzenia`). This is intentional (D-05): it blocks only the indexable build (G10) until the clan confirms it and removes the marker. Not a stub.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The IIS cutover steps in README are for the final host and are verified at cutover (backstop truths).

## Human Checks (end-of-phase)

- `npm run dev`, open http://localhost:8080/nie-ma-takiej-strony/: header, nav, footer, headline `404 // UTRACONO SYGNAŁ` with Polish letters, `Ta strona nie istnieje.`; home button opens the home page; Discord button opens the invite in a new tab; accept or change the FACTS-02 wording.
- After deploy: https://inglourious-basterds-clan.github.io/IBC-Website/nie-istnieje/ shows the styled 404 (backstop).

## Next Phase Readiness

- Phase 2 plans are all complete; phase verification and completion are run by the orchestrator.
- At cutover the user follows the README IIS checklist; ExecuteURL keeping status 404 and httpErrors delegation (research A1, A2) are confirmed there with `curl -I`.

---
*Phase: 02-technical-seo*
*Completed: 2026-10-07*

## Self-Check: PASSED

All four created files exist; commits 922ba81 and c34faa4 are in the log.
