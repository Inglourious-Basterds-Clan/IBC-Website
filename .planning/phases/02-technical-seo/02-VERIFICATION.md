---
phase: 02-technical-seo
verified: 2026-10-08T21:20:00Z
status: passed
score: 5/5 roadmap success criteria verified (plan backstop truths 6/6 verified, 1 deferred to IIS cutover)
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
  - package-lock.json
  - package.json
  - scripts/check-seo.js
  - scripts/clean.js
  - src/404.njk
  - src/_data/site.js
  - src/_dev/og-override.njk
  - src/_includes/partials/footer.njk
  - src/_includes/partials/head.njk
  - src/assets/brand/ibc-logo-512.png
  - src/assets/icons/apple-touch-icon.png
  - src/assets/icons/icon-192.png
  - src/assets/icons/icon-512.png
  - src/assets/og/og-default-v1.jpg
  - src/favicon.ico
  - src/index.njk
  - src/robots.txt.njk
  - src/site.webmanifest.njk
  - src/sitemap.xml.njk
  - src/web.config.njk
  - test/schema.test.js
  - test/seo-assets.test.js
  - test/seo-gate.test.js
  - test/seo.test.js
  - tools/seo-images/make-seo-images.js
  - tools/seo-images/package-lock.json
  - tools/seo-images/package.json
covered_digest: "v2:sha256:f1531fab6bcd973fce7ae14b0806505fae5e460d26716abbe62b447c4487570f"
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "sharp is installed only inside tools/seo-images (exact version 0.35.4, its own package-lock.json, node_modules gitignored); the site's root package.json and package-lock.json do not change, so CI npm ci never downloads sharp"
    reason: "The literal version 0.35.4 was replaced by the user-vetted exact pin 0.35.5 in quick task 261008-vmd, which closes T-02-ADV-01 / GHSA-wq5f-xc86-pv6w. The intent still holds and was checked in code: sharp is isolated in tools/seo-images, pinned exactly, has its own lockfile, node_modules is gitignored, and sharp is not in the root manifests (STATE.md decision [Quick 261008-vmd] records that it supersedes the 0.35.4 decision)."
    accepted_by: "MiszczuZPolski (package legitimacy gate in quick 261008-vmd, verbatim: \"approved sharp 0.35.5\")"
    accepted_at: "2026-10-08T20:54:03Z"
re_verification:
  previous_status: human_needed
  previous_score: 5/5 roadmap success criteria verified (1 backstop truth outstanding)
  gaps_closed: []
  gaps_remaining: []
  regressions: []
deferred:
  - truth: "02-06 backstop: on the real IIS host at cutover, curl -I https://<domena>/nie-istnieje/ returns 404 with the Polish body, and curl -I https://<domena>/site.webmanifest returns Content-Type application/manifest+json"
    addressed_in: "Backlog Phase 999.1 (IIS cutover)"
    evidence: "ROADMAP.md Backlog: 'Phase 999.1: Follow-up — Phase 02 deferred UAT follow-up: Test 7 ... Test 7: skip - deferred to IIS cutover'; 02-UAT.md test 7 result: skipped, reason 'Deferred follow-up: skip - deferred to IIS cutover'. The final host and domain do not exist yet."
advisory:
  - finding: "runCli has no try/catch around checkSite: an unexpected exception inside a rule would exit non-zero (fail closed on the exit code) but would leave _site/ in place, while README.md:59 says the gate removes every rejected result from _site/"
    category: other
    reason: "Carried forward from the previous verification. Raised by reading scripts/check-seo.js:72; no input that makes checkSite throw was found. Resolve by wrapping checkSite so a crash also calls removeRejectedOutput, or by changing the README wording for crashes."
    evidence_status: "none provided"
---

# Phase 2: Technical SEO Verification Report

**Phase Goal:** Every page the site builds is ready for search and sharing from the start: correct head metadata, valid structured data, a sitemap and favicons. A build gate stops broken SEO or unconfirmed facts from shipping, and non-final hosts are never indexed.
**Verified:** 2026-10-08T21:20:00Z
**Status:** passed
**Re-verification:** Yes. The previous digest went stale after quick task 261008-vmd (sharp 0.35.4 to 0.35.5 in tools/seo-images). Previous status: human_needed, 5/5, no gaps.

## What changed since the previous verification (9111cd3)

`git diff --stat 9111cd3 HEAD` lists only these files:

| File | Change | Effect on the site build |
|------|--------|--------------------------|
| `tools/seo-images/package.json` | `"sharp": "0.35.4"` to `"sharp": "0.35.5"` (exact pin, no range) | None. The tool is not part of the build. |
| `tools/seo-images/package-lock.json` | `node_modules/sharp` is 0.35.5, integrity `sha512-Ywn4OnzG...`, which matches the vetted value in the quick SUMMARY | None |
| `test/seo-assets.test.js` | The two version assertions now expect 0.35.5. The root "no sharp" assertions did not change. | Test only |
| `.planning/STATE.md`, `ROADMAP.md`, `02-UAT.md`, quick PLAN/SUMMARY | Docs | None |

`git diff --stat 9111cd3 HEAD -- lib scripts src eleventy.config.js package.json package-lock.json .github README.md FACTS.md` is empty, so no site source, gate code, root manifest, workflow or docs changed.

## Regression checks for the sharp bump

| Check | Evidence | Status |
|-------|----------|--------|
| Full suite | `npm test` (run once): 163 tests, 163 pass, 0 fail, 0 skipped, 0 todo, EXIT=0. Same count as the previous verification. | ✓ PASS |
| T-02-SC isolation test | `✔ the image tool is isolated from the site build (T-02-SC)` in the same run. It asserts 0.35.5 in the tool manifest and lockfile, and no sharp in the root dependencies or devDependencies. | ✓ PASS |
| sharp absent from root lockfile | `grep -c '"sharp\|node_modules/sharp\|@img/sharp' package-lock.json` = 0 | ✓ PASS |
| Tool node_modules not committed | `git status --ignored tools/seo-images` shows `!! tools/seo-images/node_modules/` (`.gitignore:6`) | ✓ PASS |
| Committed SEO images unchanged | `git log -- src/assets`: last change is b91c726 (02-02). `git diff --stat b91c726 HEAD -- src/assets` is empty. The files are og-default-v1.jpg, icon-192/512, apple-touch-icon, ibc-logo-512 and favicon.ico. Header dimension tests pass in the suite. | ✓ PASS |
| Gate rejects an indexable build with open drafts | `SITE_URL=https://example.org PATH_PREFIX=/ SITE_INDEXABLE=1 npm run build` printed `INDEXABLE build` and two G10 lines (404.html:12 FACTS-02, index.html:12 FACTS-01), then `2 problem(s) ... moved to _site.rejected, nothing is left in _site`. EXIT=1, `_site` absent, `_site.rejected` present. | ✓ PASS |
| Pages preview build passes the gate | `SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/ npm run build` printed `preview build (noindex on every page)` and `OK, 2 page(s) checked`. EXIT=0. | ✓ PASS |

Cleanup: I deleted `_site.rejected/` from the reject run. `_site/` is the noindex Pages preview build, which passed the gate. The working tree shows only the changes that were there before I started.

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence (this run, plus UAT for the human items) |
|---|-------|--------|---------------------------------------------------|
| 1 | Discord rich preview. Every page has a unique title, a meta description, an absolute canonical and absolute OG/Twitter tags. | ✓ VERIFIED | Fresh preview build: canonical `https://inglourious-basterds-clan.github.io/IBC-Website/`, og:image `https://inglourious-basterds-clan.github.io/IBC-Website/assets/og/og-default-v1.jpg`. G1-G4 tests pass. The Discord preview and the 400 px legibility check passed in UAT (tests 1 and 4). |
| 2 | sitemap.xml lists every indexable page with absolute URLs. robots.txt points to it. Favicon, manifest and theme-color are present. | ✓ VERIFIED | `_site/sitemap.xml` has one absolute `<loc>` and no 404. robots.txt has `Allow: /`. The Sitemap line is only added on indexable builds (D-15, tests (f)/(g) pass). The head has favicon.ico 32x32, icon-192, the manifest link and `theme-color #080e11`. UAT 2 passed. |
| 3 | Valid Organization + WebSite JSON-LD (alternateName IBC, sameAs, foundingDate 2018). No SportsTeam, no Event, no meta keywords. | ✓ VERIFIED | I parsed the built JSON-LD: `@graph` = Organization, WebSite. alternateName = ['IBC', 'IBC Clan'], foundingDate 2018, 3 sameAs. No SportsTeam or Event. `name="keywords"` count is 0 on both pages. The validators passed in UAT 5. |
| 4 | Polish 404 in the site layout, with links home and to Discord | ✓ VERIFIED | `_site/404.html` contains `404 // UTRACONO SYGNAŁ` and noindex. UAT 6 passed. The IIS-host part is deferred (see Deferred Items). |
| 5 | The build fails with a clear message on canonical, og:image, JSON-LD, sitemap or TODO problems. Non-final hosts get noindex. A cutover checklist exists. | ✓ VERIFIED | Reject and pass builds above. Every G-rule test passes in the full run, including the junction and rejected-output regressions from the previous gap closure. Both preview pages have `<meta name="robots" content="noindex">`. Workflow test (i) "never opts into indexing" passes. README has the IIS cutover checklist (UAT 8 passed). |

**Score:** 5/5 roadmap truths verified (0 present-but-behavior-unverified)

### Plan-level backstop truths and changed plan truths

| Plan | Truth | Status | Evidence |
|------|-------|--------|----------|
| 02-01 | sitemap `<loc>` in ascending URL order | ✓ VERIFIED | Unchanged since the previous run. Test (f) passes. |
| 02-02 | sharp isolated in tools/seo-images, exact pin, own lockfile, not in root | ✓ PASSED (override) | Version is 0.35.5, not the literal 0.35.4. The user vetted and approved the change (quick 261008-vmd). The isolation intent is verified by the checks above. |
| 02-02 | OG card legible at about 400 px | ✓ VERIFIED | UAT 1 passed. The image was not regenerated (unchanged since b91c726). |
| 02-04 | Discord rich preview / favicon on light and dark themes | ✓ VERIFIED | UAT 4 and UAT 2 passed |
| 02-05 | RRT and schema.org validators accept the graph | ✓ VERIFIED | UAT 5 passed |
| 02-06 | Deployed Pages 404 | ✓ VERIFIED | UAT 6 and the previous live curl. No code changed since. |
| 02-06 | IIS `curl -I` 404 + manifest MIME at cutover | DEFERRED | Backlog 999.1. UAT 7 skipped with a reason. |

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | IIS cutover: `curl -I` on `/nie-istnieje/` returns 404 with the Polish body, and `/site.webmanifest` returns `application/manifest+json` | Backlog Phase 999.1 (IIS cutover) | ROADMAP.md Backlog 999.1 "Test 7: skip - deferred to IIS cutover". 02-UAT.md test 7: skipped. The final host does not exist yet. |

### Advisory (New Scope, Unevidenced)

| # | Finding | Category | Why Advisory |
|---|---------|----------|--------------|
| 1 | `scripts/check-seo.js:72`: a crash inside `checkSite` would exit non-zero but leave `_site/` in place | other | Carried forward. No reproducing input, the exit code still fails closed, and the file did not change since the previous verification. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tools/seo-images/package.json` | Isolated tool, exact sharp pin | ✓ VERIFIED | `"sharp": "0.35.5"` (override for the version literal) |
| `tools/seo-images/package-lock.json` | Own lockfile | ✓ VERIFIED | sharp 0.35.5 with the vetted integrity |
| `test/seo-assets.test.js` | T-02-SC isolation and image header tests | ✓ VERIFIED | Passes |
| `src/assets/**`, `src/favicon.ico` | Committed SEO images | ✓ VERIFIED | Byte-identical to the 02-02 commit |
| `scripts/check-seo.js`, `lib/check-seo.js`, `lib/html.js`, `lib/seo.js`, `lib/schema.js`, `src/_data/site.js`, head/footer partials, sitemap/robots/manifest/404/web.config templates, README, FACTS, workflow | Phase 2 SEO surface | ✓ VERIFIED | Unchanged since 9111cd3. Re-exercised by the full suite and both builds. |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| package.json `build` | scripts/check-seo.js | `node scripts/clean.js && eleventy && node scripts/check-seo.js` | ✓ WIRED (both builds ran the gate) |
| scripts/check-seo.js | lib/check-seo.js, lib/html.js, lib/seo.js, src/_data/site.js | ESM imports | ✓ WIRED |
| head.njk | lib/schema.js | `schemaGraph \| jsonLd` | ✓ WIRED (JSON-LD parsed from the build) |
| head.njk | site.js | `site.indexable` to noindex | ✓ WIRED |
| tools/seo-images | root build | none (by design) | ✓ ISOLATED (no sharp in the root manifests or lockfile) |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| head canonical/og:url/og:image | `site.url + pathPrefix` | env SITE_URL/PATH_PREFIX normalised in site.js | Yes (Pages origin in the build) | ✓ FLOWING |
| JSON-LD | `site` object | site.js via `schemaGraph` | Yes | ✓ FLOWING |
| sitemap `<loc>` | `collections.all` | Eleventy collection | Yes | ✓ FLOWING |
| gate verdict | built `_site/` | `checkSite(outDir, site)` | Yes (G10 fires on the real markers) | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full suite (run once) | `npm test` | 163/163 pass, EXIT=0 | ✓ PASS |
| Indexable build with drafts is rejected | `MSYS_NO_PATHCONV=1 SITE_URL=https://example.org PATH_PREFIX=/ SITE_INDEXABLE=1 npm run build` | G10 x2, EXIT=1, no `_site` | ✓ PASS |
| Pages preview build passes | `SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/ npm run build` | `OK, 2 page(s) checked`, EXIT=0 | ✓ PASS |
| JSON-LD graph | node parse of `_site/index.html` | Organization,WebSite; IBC; 2018; 3 sameAs; no forbidden types | ✓ PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh` probes are declared or present. SKIPPED.

### Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|-------------|-------------|--------|----------|
| SEO-01 | 02-03 | ✓ SATISFIED | Title, description and absolute canonical in the build. G1/G2/G4 tests pass. |
| SEO-02 | 02-01 | ✓ SATISFIED | Sitemap, plus the robots.txt Sitemap line on indexable builds. G7/G8 pass. |
| SEO-03 | 02-02, 02-04 | ✓ SATISFIED | Absolute OG/Twitter tags, unchanged 1200x630 card, G3. Discord UAT passed. |
| SEO-04 | 02-02, 02-04 | ✓ SATISFIED | favicon.ico, icons, manifest, theme-color |
| SEO-05 | 02-02, 02-05 | ✓ SATISFIED | JSON-LD graph checked above. Validators passed in UAT. |
| SEO-07 | 02-06 | ✓ SATISFIED | `_site/404.html` Polish page. Pages 404 verified. The IIS part is deferred to 999.1. |
| SEO-08 | 02-01, 02-03 | ✓ SATISFIED | Gate reject and pass reproduced in this run |
| SEO-09 | 02-01, 02-06 | ✓ SATISFIED | Noindex on preview builds. The workflow never opts in. README has the cutover checklist. |

All 8 phase IDs are claimed in plan frontmatter. Nothing is orphaned: SEO-06 maps to Phase 4. REQUIREMENTS.md still shows these 8 rows as `Gaps Found` / `[ ]`, so the orchestrator should update the traceability to Complete.

### Prohibitions

| Plan | Prohibition | Tier | Disposition |
|------|-------------|------|-------------|
| 02-02 | No time-sensitive or unconfirmed claims on the OG card | judgment | Human-resolved in UAT 1. The image has not changed since. |
| 02-03 | No new factual claims in drafted copy | judgment | Human-resolved in UAT 3 and UAT 6. G10 blocks indexable builds until the markers are removed (reproduced). |
| 02-05 | No AggregateRating/Review/Event/awards in JSON-LD | test | Enforced by `assertNoForbiddenContent` in test/schema.test.js. Passing. |
| 02-05 | No personal data (Person/founder/member/employee) | test | Enforced by the same function. Passing. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| scripts/check-seo.js | 72 | `checkSite` not wrapped | 📋 Advisory | Carried forward, see above |
| .planning/phases/02-technical-seo/02-SECURITY.md | 51 | The T-02-ADV-01 row still describes sharp 0.35.4 and closes it on code controls. It does not mention the 0.35.5 upgrade. | ℹ️ Info | Stale documentation only. It does not affect the build. |
| scripts/clean.js | 10 | Only `_site` is cleaned, so a stale `_site.rejected/` survives later builds | ℹ️ Info | Gitignored. README says never to upload it. |

The files changed in this round (`test/seo-assets.test.js`, `tools/seo-images/package.json`, lockfile) have no TBD/FIXME/XXX/TODO/HACK markers. The `TODO(FACTS-01/02)` markers in the templates are intentional, registered in FACTS.md, and blocked by G10.

### Human Verification Required

None. All human items passed in 02-UAT.md (status complete, 29 pass). The only remaining check, the IIS cutover, is recorded under Deferred Items (backlog 999.1) and does not block this phase.

### Gaps Summary

There are no gaps. The sharp bump (0.35.4 to 0.35.5) touched only the isolated image tool's manifest and lockfile and the version assertions in the T-02-SC test. No site source, gate code, root manifest or committed image changed. The full suite passes 163/163. The gate still rejects an indexable build with open draft markers and moves the output aside, and the Pages preview build still passes with noindex. sharp is still absent from the root install. The 02-02 plan's literal "0.35.4" pin is superseded by the user-approved 0.35.5 decision and recorded as an override; its isolation intent is verified. The phase goal is achieved.

---

_Verified: 2026-10-08T21:20:00Z_
_Verifier: Claude (gsd-verifier)_
