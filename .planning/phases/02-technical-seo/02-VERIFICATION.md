---
phase: 02-technical-seo
verified: 2026-10-08T21:05:00Z
status: human_needed
score: 5/5 roadmap success criteria verified (1 backstop truth outstanding: IIS cutover check, final host does not exist yet)
covered_files:
  - .github/dependabot.yml
  - .github/workflows/pages.yml
  - .gitignore
  - .planning/phases/02-technical-seo/02-01-PLAN.md
  - .planning/phases/02-technical-seo/02-01-SUMMARY.md
  - .planning/phases/02-technical-seo/02-02-PLAN.md
  - .planning/phases/02-technical-seo/02-02-SUMMARY.md
  - .planning/phases/02-technical-seo/02-03-PLAN.md
  - .planning/phases/02-technical-seo/02-03-SUMMARY.md
  - .planning/phases/02-technical-seo/02-04-PLAN.md
  - .planning/phases/02-technical-seo/02-04-SUMMARY.md
  - .planning/phases/02-technical-seo/02-05-PLAN.md
  - .planning/phases/02-technical-seo/02-05-SUMMARY.md
  - .planning/phases/02-technical-seo/02-06-PLAN.md
  - .planning/phases/02-technical-seo/02-06-SUMMARY.md
  - FACTS.md
  - README.md
  - eleventy.config.js
  - lib/check-seo.js
  - lib/html.js
  - lib/image-size.js
  - lib/schema.js
  - lib/seo.js
  - package.json
  - scripts/check-seo.js
  - scripts/clean.js
  - src/404.njk
  - src/_data/site.js
  - src/_dev/og-override.njk
  - src/_includes/partials/footer.njk
  - src/_includes/partials/head.njk
  - src/index.njk
  - src/robots.txt.njk
  - src/site.webmanifest.njk
  - src/sitemap.xml.njk
  - src/web.config.njk
  - test/schema.test.js
  - test/seo-gate.test.js
  - test/seo.test.js
  - tools/seo-images/make-seo-images.js
  - tools/seo-images/package.json
covered_digest: "v2:sha256:ed83296294903a359faf4105d0ceb80e74ad46b3eac9f73058a8d9edab179516"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 4/5
  gaps_closed:
    - "The production build fails with a clear message on a missing or relative canonical or og:image, invalid JSON-LD, a page missing from the sitemap, or a leftover TODO marker (ROADMAP SC5 / SEO-08): CR-01 junction fail-open and CR-02 deployable rejected output both fixed and reproduced closed"
  gaps_remaining: []
  regressions: []
advisory:
  - finding: "runCli has no try/catch around checkSite: an unexpected exception inside a rule would exit non-zero (fail closed on exit code) but would leave _site/ in place, while README.md:59 says the gate removes every rejected result from _site/"
    category: other
    reason: "Raised by reading scripts/check-seo.js:72; no input that makes checkSite throw was found. Resolve by wrapping checkSite so a crash also calls removeRejectedOutput, or by wording the README for crashes."
    evidence_status: "none provided"
human_verification:
  - test: "At IIS cutover, from another machine: `curl -I https://<domena>/nie-istnieje/` and `curl -I https://<domena>/site.webmanifest`"
    expected: "First returns status 404 (not 200 or 500.19) with the Polish 404 body; second returns Content-Type application/manifest+json"
    why_human: "02-06 backstop truth; the final IIS host and domain do not exist yet. Already tracked as blocked in 02-UAT.md test 7 (blocked_by: server)."
---

# Phase 2: Technical SEO Verification Report

**Phase Goal:** Every page the site builds is ready for search and sharing from the start: correct head metadata, valid structured data, a sitemap and favicons. A build gate stops broken SEO or unconfirmed facts from shipping, and non-final hosts are never indexed.
**Verified:** 2026-10-08T21:05:00Z
**Status:** human_needed (no gaps; one cutover-only check outstanding)
**Re-verification:** Yes, after gap closure (previous: gaps_found, 4/5)

## Re-verification of the previous gap (SC5 / SEO-08)

The previous report failed SC5 for two reasons. I reproduced both again against the current `main` (HEAD bd4322d). The FACTS-01/FACTS-02 draft markers are still in `src/index.njk` and `src/404.njk`, so a real indexable build is a real G10 rejection case.

| Repro | Before (2026-10-07) | Now | Status |
|-------|---------------------|-----|--------|
| PowerShell, cwd = scratchpad junction pointing at the repo, `$env:SITE_URL='https://example.org'; $env:PATH_PREFIX='/'; $env:SITE_INDEXABLE='1'; npm run build` | exit 0, no check-seo output, indexable `_site/` with drafts | `check-seo: INDEXABLE build for https://example.org/`, two G10 lines (404.html:12 FACTS-02, index.html:12 FACTS-01), `2 problem(s), this output must not be deployed; moved to _site.rejected, nothing is left in _site`, **EXIT=1**, `Test-Path _site` = False, `_site.rejected\index.html` = True | ✓ CR-01 + CR-02 closed |
| `node <junction>/scripts/check-seo.js --dir no-such-dir` (cwd outside repo) | no output, exit 0 | banner + `no-such-dir does not exist (run eleventy first)`, exit 1 (same as the real path) | ✓ CR-01 closed |
| Git Bash, real path, `MSYS_NO_PATHCONV=1 SITE_URL=https://example.org PATH_PREFIX=/ SITE_INDEXABLE=1 npm run build` | exit 1 but full `_site/` left | exit 1, same G10 lines, `_site` absent, `_site.rejected` present | ✓ CR-02 closed |
| README.md:59 and :85 claims | "cannot be uploaded by mistake" was false | Text now says the rejected output is moved to `_site.rejected/`, `_site/` does not exist, never upload `_site.rejected/`; matches observed behaviour | ✓ |

Code evidence:
- `scripts/check-seo.js:85` calls `runCli(process.argv.slice(2))` with no main-module guard. The rules moved to `lib/check-seo.js`. Nothing imports `scripts/check-seo.js` (grep: only `package.json` and spawnSync in tests run it), so the unconditional call has no import side effects.
- `repoRoot` comes from `import.meta.url`, which Node resolves to the real path. `outDir` is resolved against it, so the "inside the repo" safety check in `removeRejectedOutput` stays consistent under a junction (confirmed by the junction repro above, which moved the real `_site`).
- `removeRejectedOutput` (lines 37-56): renames to `<dir>.rejected`, falls back to delete, and never touches the repo root or folders outside it.
- No environment variable can skip the gate: `process.env` is read only in `src/_data/site.js` (SITE_URL, PATH_PREFIX, SITE_INDEXABLE, ALLOW_LOCAL_SITE_URL, INCLUDE_DEV_PAGES, ELEVENTY_RUN_MODE). None of them disables a rule.
- Regression tests exist and run (not skipped): `CLI still runs and fails when started through a junction or symlink path` (creates a real junction on Windows, asserts exit 1 and a G2 line) and `CLI moves a rejected build aside so no deployable index.html is left` (two runs, asserts `<dir>` gone and `<dir>.rejected/index.html` present). Both pass in the full run.

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Discord rich preview; unique title, meta description, absolute canonical, absolute OG/Twitter tags | ✓ VERIFIED | Fresh Pages-style build (`SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/`): title `Klan Arma 3 Milsim – Inglourious Basterds Clan (IBC)`, one description, absolute canonical = og:url, og:image = twitter:image absolute with 1200/630, `summary_large_image`, alt only with the default image (WR-01). Discord embed and 400 px legibility were confirmed by the user (02-UAT tests 1 and 4: pass). |
| 2 | sitemap.xml lists every indexable page absolutely; robots.txt points to it; favicon, manifest, theme-color | ✓ VERIFIED | `_site/sitemap.xml` has one absolute `<loc>` and excludes 404. robots.txt has `Allow: /` and no Sitemap line on the preview build; the Sitemap line appears on indexable builds only (D-15, tests (f)/(g) pass), and indexable builds now need `PATH_PREFIX=/` (WR-02, reproduced: `/foo/` refused, no `_site`). favicon.ico, icon-192, apple-touch-icon, manifest link and `theme-color #080e11` are in the head. Live: `site.webmanifest` on Pages returns 200 `application/manifest+json`. Tab icon on light and dark themes: user-verified (UAT 2). |
| 3 | Valid Organization + WebSite JSON-LD (alternateName IBC, sameAs, foundingDate 2018); no SportsTeam, Event, meta keywords | ✓ VERIFIED | One `application/ld+json` on home with `@graph` Organization + WebSite. `grep -c "SportsTeam\|\"Event\"\|name=\"keywords\""` = 0 on both pages. validator.schema.org and Rich Results Test passed on the deployed snippet (UAT 5; G-02-5 resolved as test-procedure input). |
| 4 | Polish 404 in the site layout with links home and to Discord | ✓ VERIFIED | Live fetch of `https://inglourious-basterds-clan.github.io/IBC-Website/nie-istnieje/`: HTTP 404, body contains `404 // UTRACONO SYGNAŁ`, `href="/IBC-Website/"` and noindex. Buttons and layout were user-verified (UAT 6). The IIS host part is a cutover backstop (see Human Verification). |
| 5 | Build fails with clear message on canonical/og:image/JSON-LD/sitemap/TODO problems; non-final hosts noindex; cutover checklist | ✓ VERIFIED (gap closed) | See the re-verification table above. Rule coverage in the full run: G2 (relative/missing/double/foreign canonical), G3 (missing/relative/foreign/missing-file og:image, duplicates), G5 (unparseable, nested Event, SportsTeam, missing WebSite), G7 (page missing from sitemap, missing sitemap, non-HTML loc, traversal), G10 (indexable fails per marker, preview passes): all ✔. The preview build has noindex on both pages (`grep -c` = 1 each). The workflow never sets SITE_INDEXABLE (test (i) ✔). README has the IIS cutover checklist. |

**Score:** 5/5 roadmap truths verified (0 present-but-behavior-unverified)

### Plan-level backstop truths

| Plan | Backstop truth | Status | Evidence |
|------|----------------|--------|----------|
| 02-01 | sitemap `<loc>` in ascending URL order | ✓ VERIFIED | I ran the exact template expression `sort(false, true, "url")` through the project's own nunjucks with 5 out-of-order URLs. Output: `/ /Zeta/ /a/ /jak-dolaczyc/ /operacje/` (ascending, case-sensitive code-point order, byte-stable). Test (f) also asserts sorting on real builds. |
| 02-02 | OG card legible at ~400 px | ✓ VERIFIED | UAT 1 pass (human) |
| 02-04 | Discord rich preview of deployed URL | ✓ VERIFIED | UAT 4 pass (human) |
| 02-04 | Rose favicon on light and dark themes | ✓ VERIFIED | UAT 2 pass (human) |
| 02-05 | RRT / schema.org validator accept the graph | ✓ VERIFIED | UAT 5 pass (human, deployed snippet) |
| 02-06 | Deployed Pages 404 | ✓ VERIFIED | Live curl above + UAT 6 |
| 02-06 | IIS `curl -I` 404 + manifest MIME at cutover | ? UNCERTAIN, human | Final host does not exist; UAT 7 blocked |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/check-seo.js` | CLI only, unconditional run, rejected-output handling | ✓ VERIFIED | 85 lines; no guard; `removeRejectedOutput`; IN-06 file-as-dir check |
| `lib/check-seo.js` | Rules G0-G10 (`checkSite`) | ✓ VERIFIED | 360 lines; imported by the CLI and two test files |
| `lib/html.js` | Shared helpers (IN-02) | ✓ VERIFIED | Imported by the CLI, rules, site.js and test helpers |
| `lib/seo.js` | isIndexableUrl (HTML-only, WR-03), localHosts | ✓ VERIFIED | Used by eleventy.config.js filter, gate and CLI banner |
| `src/_data/site.js` | origin-normalised url (WR-04), indexable guards (https, PATH_PREFIX=/) | ✓ VERIFIED | Both refusals reproduced (exit 1, no `_site`) |
| `src/_includes/partials/head.njk` | metadata, alt only for default image, per-id TODO markers | ✓ VERIFIED | Built head inspected |
| `src/sitemap.xml.njk`, `src/robots.txt.njk`, `src/site.webmanifest.njk`, `src/404.njk`, `src/web.config.njk` | SEO files | ✓ VERIFIED | In `_site/`; web.config comment corrected (IN-01) |
| `lib/schema.js`, `src/_includes/partials/footer.njk` | JSON-LD graph, social loop | ✓ VERIFIED | |
| `README.md`, `FACTS.md`, `.gitignore` | accurate gate/cutover docs, `_site.rejected/` ignored | ✓ VERIFIED | README:59/85 match the observed behaviour |
| `.github/workflows/pages.yml`, `.github/dependabot.yml` | SHA-pinned actions, never indexable | ✓ VERIFIED | test/workflow.test.js passes |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| package.json `build` | scripts/check-seo.js | `node scripts/clean.js && eleventy && node scripts/check-seo.js` | ✓ WIRED; runs from real path and junction cwd |
| scripts/check-seo.js | lib/check-seo.js, lib/html.js, lib/seo.js, src/_data/site.js | ESM imports | ✓ WIRED |
| sitemap.xml.njk / head.njk | lib/seo.js | `isIndexableUrl` filter | ✓ WIRED |
| head.njk | lib/schema.js | `schemaGraph \| jsonLd` | ✓ WIRED |
| head.njk | site.js | `site.indexable` → noindex | ✓ WIRED |
| web.config.njk | 404.html | `htmlBaseUrl` | ✓ WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| head canonical/og:url/og:image | `site.url + pathPrefix` | env SITE_URL/PATH_PREFIX normalised in site.js | Yes (Pages origin in build) | ✓ FLOWING |
| JSON-LD | `site` object | site.js via `schemaGraph` | Yes | ✓ FLOWING |
| sitemap `<loc>` | `collections.all` | Eleventy collection | Yes | ✓ FLOWING |
| gate verdict | built `_site/` files | `checkSite(outDir, site)` | Yes (G10 fires on real markers) | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Indexable build via junction cwd (PowerShell) | see table above | G10 ×2, moved to `_site.rejected`, EXIT=1, no `_site` | ✓ PASS |
| Gate via junction script path | `node <junction>/scripts/check-seo.js --dir no-such-dir` | error line, exit 1 | ✓ PASS |
| Indexable build, real path (Git Bash) | `... SITE_INDEXABLE=1 npm run build` | exit 1, no `_site` | ✓ PASS |
| Pages preview build passes and keeps output | `SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/ npm run build` | preview banner, `OK, 2 page(s) checked`, exit 0, `_site` present | ✓ PASS |
| Indexable + http URL refused | `SITE_URL=http://example.org SITE_INDEXABLE=1 npm run build` | exit 1, no `_site` | ✓ PASS |
| Indexable + non-root prefix refused (WR-02) | `PATH_PREFIX=/foo/ SITE_INDEXABLE=1 ...` | exit 1 with the PATH_PREFIX message, no `_site` | ✓ PASS |
| Deployed 404 / manifest | `curl` on the Pages URLs | 404 text/html Polish page; manifest 200 application/manifest+json | ✓ PASS |
| Full suite (run once) | `npm test` | 163 tests, 163 pass, 0 fail, 0 skipped | ✓ PASS |

Cleanup: the scratchpad junction was removed with `rmdir` (the link only; the repo is intact), `_site.rejected/` from my repros was deleted, and `_site/` was left as a noindex Pages preview build that passed the gate. The working tree shows only the pre-existing changes.

### Probe Execution

No `scripts/*/tests/probe-*.sh` probes are declared or present. SKIPPED.

### Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|-------------|-------------|--------|----------|
| SEO-01 | 02-03 | ✓ SATISFIED | Title/description/canonical in build; G1/G2/G4 tests |
| SEO-02 | 02-01 | ✓ SATISFIED | sitemap + robots Sitemap line on indexable builds; G7/G8 |
| SEO-03 | 02-02, 02-04 | ✓ SATISFIED | Absolute OG/Twitter, 1200x630 card; G3; Discord UAT pass |
| SEO-04 | 02-02, 02-04 | ✓ SATISFIED | favicon.ico, icons, manifest (live MIME correct on Pages), theme-color |
| SEO-05 | 02-02, 02-05 | ✓ SATISFIED | JSON-LD graph; no SportsTeam/Event/keywords; validators UAT pass |
| SEO-07 | 02-06 | ✓ SATISFIED | `_site/404.html`; live Pages 404 verified |
| SEO-08 | 02-01, 02-03 | ✓ SATISFIED | Gate fails closed under a junction; rejected output removed from `_site` |
| SEO-09 | 02-01, 02-06 | ✓ SATISFIED | noindex unless SITE_INDEXABLE=1; workflow never opts in; README cutover checklist |

All 8 phase IDs are claimed by plan frontmatter. There are no orphaned requirements: SEO-06 maps to Phase 4. REQUIREMENTS.md still shows these rows as `Gaps Found` / `[ ]`, so the orchestrator should update the traceability.

### Prohibitions

| Plan | Prohibition | Tier | Disposition |
|------|-------------|------|-------------|
| 02-02 | No time-sensitive or unconfirmed claims on the OG card | judgment | Human-resolved: UAT 1 pass ("no dates, recruitment status or counts") |
| 02-03 | No new factual claims in drafted copy | judgment | Human-resolved: UAT 3 (FACTS-01) and UAT 6 (FACTS-02) pass. The markers stay until cutover, and G10 blocks any indexable build until they are removed. |
| 02-05 | No AggregateRating/Review/Event/awards in JSON-LD | test | Enforced: `assertNoForbiddenContent` in test/schema.test.js (forbiddenTypes/forbiddenKeys), called from passing unit tests; G5 fixtures ✔ |
| 02-05 | No personal data (Person/founder/member/employee) | test | Enforced: same function, passing |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| scripts/check-seo.js | 72 | `checkSite` not wrapped: a rule crash exits non-zero but leaves `_site/` | 📋 Advisory | New scope, no reproducing input; exit code still fails closed |
| scripts/clean.js | 10 | Only `_site` is cleaned; a stale `_site.rejected/` survives later successful builds | ℹ️ Info | Gitignored; README says never upload it |

There are no TBD/FIXME/XXX/HACK markers in any file changed since the previous verification. The `TODO(FACTS-01/02)` markers are intentional, registered in FACTS.md and blocked by G10 on indexable builds.

### Human Verification Required

1. **IIS cutover checks** (02-06 backstop, already tracked as blocked in 02-UAT.md test 7). At cutover, run `curl -I https://<domena>/nie-istnieje/` and `curl -I https://<domena>/site.webmanifest` from another machine. Expected: 404 with the Polish body, and `application/manifest+json`. This needs a human because the final host does not exist yet.

Items that passed in UAT (Discord preview, validators, favicon themes, 404 and FACTS wording) are not routed again.

### Gaps Summary

There are no gaps. Both causes of the previous SC5/SEO-08 failure are fixed in code, covered by passing regression tests, and confirmed closed by repeating the original reproductions:
- The gate now runs and rejects an indexable build with open drafts from a junction cwd in PowerShell (exit 1).
- A rejected build no longer leaves a deployable `_site/`.

The WR/IN fixes caused no regressions: the full suite passes 163/163, the Pages preview build passes the gate, and the head, sitemap, robots, icons and JSON-LD outputs look as expected. The status is `human_needed` only because of the IIS cutover check, which cannot run until the final domain exists. The orchestrator can either keep it as a cutover item (it is already in 02-UAT.md as blocked) or accept it with an override.

---

_Verified: 2026-10-08T21:05:00Z_
_Verifier: Claude (gsd-verifier)_
