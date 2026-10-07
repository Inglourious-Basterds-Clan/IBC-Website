---
phase: 02-technical-seo
verified: 2026-10-07T20:05:00Z
status: gaps_found
score: 4/5 roadmap success criteria verified (SC5 partial; 7 backstop truths routed to human verification)
covered_files:
  - .github/workflows/pages.yml
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
  - lib/image-size.js
  - lib/schema.js
  - lib/seo.js
  - package.json
  - scripts/check-seo.js
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
  - tools/seo-images/make-seo-images.js
  - tools/seo-images/package.json
covered_digest: "v2:sha256:f7e64673c3b8513ba4238e567f2f30b9e110994ba50a40cc13c5e1c3ab02d752"
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "The production build fails with a clear message on a missing or relative canonical or og:image, invalid JSON-LD, a page missing from the sitemap, or a leftover TODO marker (ROADMAP SC5 / SEO-08; plan 02-01 truth: there is no environment switch that skips the gate)"
    status: partial
    reason: >
      The gate rules G0-G10 are implemented and fail correctly when the script is started by its real path
      (149/149 tests pass; an indexable build with open FACTS drafts exits 1 with G10 lines). But the CLI entry
      guard (scripts/check-seo.js:406, `import.meta.url === pathToFileURL(process.argv[1]).href`) fails open:
      reproduced by the verifier in PowerShell with the cwd inside a junction pointing at the repo,
      `SITE_URL=https://example.org SITE_INDEXABLE=1 npm run build` exited 0 with no check-seo output at all,
      leaving an indexable _site/ that carries TODO(FACTS-01) and TODO(FACTS-02). Invoking
      `node <junction>/scripts/check-seo.js --dir no-such-dir` also exits 0 silently (real path: exit 1).
      Separately (CR-02, reproduced), a build the gate rejects leaves its full output in _site/ (an indexable
      build failing G10 keeps an _site/index.html with no noindex and the unconfirmed drafts), while README.md:85
      claims such output "cannot be uploaded by mistake". IIS deployment is a manual copy of _site/, so the gate
      does not by itself stop unconfirmed facts from shipping on the production path. Both review findings are
      still `open` in 02-REVIEW-DISPOSITION.md.
    artifacts:
      - path: "scripts/check-seo.js"
        issue: "Lines 406-408: main-module guard compares realpath-based import.meta.url to a non-realpath argv[1]; under a symlink/junction runCli never runs and the process exits 0 (CR-01)"
      - path: "scripts/check-seo.js"
        issue: "runCli (lines 385-402) exits 1 on problems but leaves the rejected output in place in _site/ (CR-02)"
      - path: "README.md"
        issue: "Line 85 says a failed gate makes the output impossible to upload by mistake; untrue for the manual IIS copy (CR-02)"
      - path: "package.json"
        issue: "build script relies on the guarded CLI; no fail-closed path when the guard misfires"
    missing:
      - "Make the CLI fail closed: compare realpaths (realpathSync on both sides) or move checkSite into lib/ and make scripts/check-seo.js call runCli unconditionally"
      - "Add a test that runs the gate through a symlink/junction on a broken fixture and asserts exit 1"
      - "When the gate rejects the default _site build, move/remove the output (e.g. rename to _site.rejected) so nothing deployable remains; add a test that a failing gate leaves no _site/index.html"
      - "Correct README.md lines 59/85 to match the actual behaviour"
human_verification:
  - test: "Deploy the noindex preview (push to main), paste https://inglourious-basterds-clan.github.io/IBC-Website/ into a Discord channel"
    expected: "Rich embed with title 'Klan Arma 3 Milsim – Inglourious Basterds Clan (IBC)', the Polish description and the 1200x630 card (rose + KLAN ARMA 3 MILSIM); headline legible at ~400 px width"
    why_human: "Discord's crawler and embed rendering cannot be exercised from the repo (SC1 backstop truths in 02-02 and 02-04)"
  - test: "Run the deployed home page (or the built _site/index.html source) through validator.schema.org and Google Rich Results Test"
    expected: "Valid Organization + WebSite, alternateName IBC, sameAs YouTube/Facebook/Discord, foundingDate 2018; no SportsTeam/Event; no errors"
    why_human: "External validators; the gate only checks JSON.parse and @type lists (SC3 backstop)"
  - test: "Open the preview in Chrome/Edge/Firefox with light and dark browser themes; check the tab icon and that the manifest loads in DevTools > Application"
    expected: "Rose favicon visible on both themes; manifest parsed with name/short_name IBC/theme #080e11, icons load"
    why_human: "Visual appearance (SC2 backstop)"
  - test: "Open https://inglourious-basterds-clan.github.io/IBC-Website/nie-istnieje/ on the deployed preview"
    expected: "Styled Polish 404 '404 // UTRACONO SYGNAŁ' in the site layout; 'Wróć na stronę główną' goes to the preview home, Discord button opens the invite"
    why_human: "Depends on GitHub Pages serving 404.html for unknown paths (SC4 backstop)"
  - test: "At IIS cutover: `curl -I https://<domena>/nie-istnieje/` and `curl -I https://<domena>/site.webmanifest` from another machine"
    expected: "404 status with the Polish page body; manifest served as application/manifest+json"
    why_human: "Final host does not exist yet (02-06 backstop; verified at cutover)"
  - test: "Review the drafted copy registered in FACTS.md (FACTS-01 home meta description incl. 'Prowadzimy rekrutację', FACTS-02 404 copy) with the clan"
    expected: "Clan confirms or edits the wording, markers removed, rows set to potwierdzone before the indexable build"
    why_human: "Judgment-tier prohibition (02-03: no new unconfirmed claims); LLM-judge verdict non-authoritative: copy only restates 2018 founding, co-op ops and recruitment already on the site — unverified-prohibition, human review recommended"
  - test: "Once Phase 4 adds a second indexable page, inspect sitemap.xml order"
    expected: "<loc> entries in ascending URL order"
    why_human: "Backstop truth (02-01); only one indexable page exists, ordering cannot be exercised yet"
---

# Phase 2: Technical SEO Verification Report

**Phase Goal:** Every page the site builds is ready for search and sharing from the start: correct head metadata, valid structured data, a sitemap and favicons. A build gate stops broken SEO or unconfirmed facts from shipping, and non-final hosts are never indexed.
**Verified:** 2026-10-07T20:05:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Discord rich preview; unique title, meta description, absolute canonical, absolute OG/Twitter tags | ✓ VERIFIED (source) + human item | Built `_site/index.html` (SITE_URL=https://guard.example, PATH_PREFIX=/IBC-Website/): title `Klan Arma 3 Milsim – Inglourious Basterds Clan (IBC)`, one description, canonical `https://guard.example/IBC-Website/`, og:url = canonical, og:image = twitter:image = absolute `.../assets/og/og-default-v1.jpg` with 1200/630, summary_large_image. Card image viewed: 1200x630, D-06 wording only. Discord embed itself → human. |
| 2 | sitemap.xml lists every indexable page absolutely; robots.txt points to it; favicon, manifest, theme-color | ✓ VERIFIED (source) + human item | `_site/sitemap.xml` has the one indexable page as absolute `<loc>`, excludes 404.html; robots.txt has `Sitemap:` line on indexable builds only (preview builds deliberately omit it, D-15); `_site/favicon.ico`, icon-192/512, apple-touch-icon present; head links them plus `/site.webmanifest` and `theme-color #080e11`; manifest is valid JSON with prefix-aware paths. Tab icon appearance → human. |
| 3 | Valid Organization + WebSite JSON-LD (alternateName IBC, sameAs, foundingDate 2018); no SportsTeam, Event, meta keywords | ✓ VERIFIED (source) + human item | Single `application/ld+json` on home only (0 on 404), @graph Organization+WebSite linked by @id, alternateName ["IBC","IBC Clan"], foundingDate "2018", sameAs YouTube, Facebook, Discord; grep for SportsTeam/"Event"/keywords in `_site/*.html` returns nothing; `<` escaped by `jsonLd`. External validator → human. |
| 4 | Polish 404 in the site layout with links home and to Discord | ✓ VERIFIED (build) + human item | `_site/404.html` renders through base layout (same header/nav/CTA), h1 `404 // UTRACONO SYGNAŁ`, `Ta strona nie istnieje.`, prefix-aware home button and Discord invite; noindex; not in sitemap; `web.config` maps 404 → `/IBC-Website/404.html` ExecuteURL. Deployed behavior → human. |
| 5 | Build fails with clear message on canonical/og:image/JSON-LD/sitemap/TODO problems; non-final hosts noindex; cutover checklist | ✗ FAILED (partial) | Noindex on every non-`SITE_INDEXABLE=1` build: verified (preview build has noindex on all pages; workflow never sets SITE_INDEXABLE; test `(i) the workflow never opts into indexing` passes). Cutover checklist: README "Przeniesienie na docelową domenę (IIS)" covers the steps. Gate rules: all fixture tests pass, and a real indexable build fails with G10 lines and exit 1. **But** the gate fails open under a junction/symlink cwd (reproduced: indexable `npm run build` in PowerShell exits 0 with no check-seo output), and a rejected build leaves deployable indexable output in `_site/` while README.md:85 claims otherwise. See Gaps. |

**Score:** 4/5 roadmap truths verified (0 present-but-behavior-unverified; 7 backstop truths routed to human verification)

Plan-level must-haves (02-01..02-06): all non-backstop truths are covered by the suite (`npm test`: 149 pass, 0 fail) and spot-checked in the build output above. Exception: 02-01 truth "there is no environment switch that skips the gate" is contradicted by the CR-01 reproduction (an environmental condition, not a flag, but the effect is the same).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/seo.js` | isIndexableUrl, outputPathToUrl | ✓ VERIFIED | Used by eleventy.config.js filter and check-seo.js |
| `scripts/check-seo.js` | checkSite + CLI, G0-G10 | ⚠️ VERIFIED with defect | Rules substantive and tested; CLI guard fails open (CR-01) |
| `src/sitemap.xml.njk` | sorted absolute sitemap | ✓ VERIFIED | `sort(false,true,"url")` + isIndexableUrl |
| `src/robots.txt.njk` | no Disallow, Sitemap on indexable | ✓ VERIFIED | |
| `src/_data/site.js` | SITE_INDEXABLE, URL/prefix validation, SEO config | ✓ VERIFIED | Throws on indexable + http/localhost |
| `src/_includes/partials/head.njk` | title/desc/canonical/OG/icons/JSON-LD | ✓ VERIFIED | |
| `src/site.webmanifest.njk` | valid JSON manifest | ✓ VERIFIED | dump(2) output checked |
| `lib/schema.js` | buildSchemaGraph, jsonLd | ✓ VERIFIED | Registered as filters, rendered on home |
| `src/_includes/partials/footer.njk` | social loop from site.social | ✓ VERIFIED | test passes |
| `src/404.njk`, `src/web.config.njk` | Polish 404, IIS config | ✓ VERIFIED | |
| `src/assets/og/og-default-v1.jpg`, icons, `src/favicon.ico`, `src/assets/brand/ibc-logo-512.png` | committed SEO images | ✓ VERIFIED | Copied to `_site/`; header tests pass |
| `tools/seo-images/*` | isolated sharp tool | ✓ VERIFIED | Root package.json has no sharp; node_modules gitignored |
| `FACTS.md`, `README.md` | draft register, cutover docs | ✓ VERIFIED (README:85 inaccurate, see gap) | |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| sitemap.xml.njk | lib/seo.js | `addFilter("isIndexableUrl")` | ✓ WIRED |
| check-seo.js | lib/seo.js, lib/image-size.js | imports | ✓ WIRED |
| package.json | check-seo.js | `eleventy && node scripts/check-seo.js` | ⚠️ WIRED, fails open under junction (CR-01) |
| head.njk | site.js | `site.indexable` noindex | ✓ WIRED |
| head.njk | lib/schema.js | `site \| schemaGraph \| jsonLd \| safe` | ✓ WIRED |
| footer.njk / schema.js | site.js | `site.social` | ✓ WIRED |
| web.config.njk | 404.njk | `'/404.html' \| htmlBaseUrl` | ✓ WIRED |
| eleventy.config.js | src/favicon.ico | passthrough | ✓ WIRED |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Preview build passes gate | `SITE_URL=https://guard.example PATH_PREFIX=/IBC-Website/ npm run build` | banner `preview build (noindex on every page)`, `OK, 2 page(s)`, exit 0 | ✓ PASS |
| Indexable build blocks drafts | `SITE_URL=https://example.org SITE_INDEXABLE=1 npm run build` (real path) | 2× G10 lines, exit 1 | ✓ PASS |
| Rejected build leaves no deployable output | `ls _site` after the failed indexable build | full `_site/` present, index.html has 0 noindex and TODO(FACTS-01) | ✗ FAIL (CR-02) |
| Gate via junction path | `node <junction>/scripts/check-seo.js --dir no-such-dir` | no output, exit 0 (real path: exit 1) | ✗ FAIL (CR-01) |
| Gate via junction cwd in PowerShell | `Set-Location <junction>; SITE_INDEXABLE=1 ... npm run build` | exit 0 | ✗ FAIL (CR-01) |
| Full suite | `npm test` (once) | 149 pass / 0 fail | ✓ PASS |

The scratchpad junction was removed afterwards and `_site/` was rebuilt as a LOCAL noindex build (`ALLOW_LOCAL_SITE_URL=1 npm run build`), so no indexable output was left behind.

### Probe Execution

No `scripts/*/tests/probe-*.sh` probes declared or present. SKIPPED.

### Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|-------------|-------------|--------|----------|
| SEO-01 | 02-03 | ✓ SATISFIED | Titles/description/canonical in build; G1/G2/G4 tests |
| SEO-02 | 02-01 | ✓ SATISFIED | sitemap.xml + robots Sitemap line (indexable builds); G7/G8 |
| SEO-03 | 02-02, 02-04 | ✓ SATISFIED (Discord embed → human) | Absolute OG/Twitter, 1200x630 card; G3 |
| SEO-04 | 02-02, 02-04 | ✓ SATISFIED (visual → human) | favicon.ico, icons, manifest, theme-color |
| SEO-05 | 02-02, 02-05 | ✓ SATISFIED (validator → human) | JSON-LD graph; no SportsTeam/Event/keywords; G5 |
| SEO-07 | 02-06 | ✓ SATISFIED (deployed → human) | `_site/404.html` |
| SEO-08 | 02-01, 02-03 | ✗ PARTIAL | Rules work; CLI fails open under junction (CR-01); rejected output stays deployable (CR-02) |
| SEO-09 | 02-01, 02-06 | ✓ SATISFIED | Noindex unless SITE_INDEXABLE=1; workflow never opts in; README cutover checklist |

All 8 phase IDs are claimed by plans; no orphaned requirements (SEO-06 is mapped to Phase 4). REQUIREMENTS.md marks SEO-08 `[x] Complete`; this verification disagrees until the gap is closed.

### Prohibitions

| Plan | Prohibition | Tier | Disposition |
|------|-------------|------|-------------|
| 02-02 | No time-sensitive/unconfirmed claims on the OG card | judgment | Card viewed: only rose, "KLAN ARMA 3 MILSIM", "INGLOURIOUS BASTERDS CLAN". LLM-judge (non-authoritative): holds. |
| 02-03 | No new factual claims in drafted copy | judgment | Flagged — unverified-prohibition, human review recommended (FACTS-01/02 confirmation item) |
| 02-05 | No AggregateRating/Review/Event/awards in JSON-LD | test | Enforced: `test/schema.test.js` forbiddenTypes/forbiddenKeys, passing |
| 02-05 | No personal data (Person/founder/member/employee) | test | Enforced: same test, passing |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| scripts/check-seo.js | 406-408 | Fail-open main-module guard | 🛑 Blocker | Gate silently skipped under symlink/junction (CR-01) |
| scripts/check-seo.js / README.md | 397-401 / 85 | Rejected output kept; doc claims otherwise | 🛑 Blocker (with CR-01) | Indexable drafts deployable by manual IIS copy (CR-02) |
| src/_includes/partials/head.njk | 9 | Default og:image:alt used for overridden images | ⚠️ Warning | WR-01 |
| src/_data/site.js | 59-66 | Indexable + non-root PATH_PREFIX allowed | ⚠️ Warning | WR-02 |
| lib/seo.js | 10-15 | isIndexableUrl accepts non-HTML URLs | ⚠️ Warning | WR-03 |
| src/_data/site.js | 20 | SITE_URL not normalised to origin | ⚠️ Warning | WR-04 |
| scripts/check-seo.js | 324 | Narrow `Disallow: /` match | ⚠️ Warning | WR-05 |

No unreferenced TBD/FIXME/XXX markers. The `TODO(FACTS-NN)` markers are intentional, registered in FACTS.md and blocked by G10.

### Human Verification Required

1. **Discord preview** — paste the deployed preview URL into Discord; expect the IBC title, description and 1200x630 card, headline legible at ~400 px.
2. **Schema validators** — run validator.schema.org / Rich Results Test on the home page; expect valid Organization + WebSite, alternateName IBC, sameAs, foundingDate 2018.
3. **Favicon/manifest visuals** — rose icon on light and dark tab themes; manifest loads in DevTools.
4. **Deployed 404** — open `/IBC-Website/nie-istnieje/` on GitHub Pages; styled Polish 404 with working buttons.
5. **IIS cutover curl checks** — 404 status + Polish page; `.webmanifest` as `application/manifest+json`.
6. **FACTS-01/FACTS-02 confirmation** — clan confirms drafted copy before the indexable build.
7. **Sitemap ordering** — recheck once Phase 4 adds pages.

### Gaps Summary

One root cause blocks the "build gate stops broken SEO or unconfirmed facts from shipping" half of the goal: the gate is correct but not fail-closed. Its CLI can be skipped silently by how the script path is resolved (CR-01, reproduced in the user's own shell), and when it does reject a build the rejected, indexable output remains in `_site/` for the manual IIS copy, contradicting README.md:85 (CR-02, reproduced). Everything else in the goal — head metadata, OG/Twitter, sitemap, robots, favicons, manifest, JSON-LD, Polish 404, noindex on non-final hosts and the cutover checklist — is present, wired and exercised by the 149-test suite.

Mitigation already in place: README cutover step 2 tells the operator to confirm the `check-seo: INDEXABLE build ...` and `check-seo: OK` lines, which a skipped gate does not print. If the user accepts that process control instead of a code fix, record an override:

```yaml
overrides:
  - must_have: "The production build fails with a clear message on a missing or relative canonical or og:image, invalid JSON-LD, a page missing from the sitemap, or a leftover TODO marker"
    reason: "Gate fails correctly on the real repo path and in CI; cutover checklist step 2 requires seeing the INDEXABLE banner and check-seo: OK before copying _site/, which catches both a skipped gate and a rejected build"
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
```

The fixes are small (realpath guard or unconditional CLI, move rejected output aside, README correction, two tests), so closing the gap is preferable.

---

_Verified: 2026-10-07T20:05:00Z_
_Verifier: Claude (gsd-verifier)_
