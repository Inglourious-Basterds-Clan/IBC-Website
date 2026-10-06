---
phase: 01-eleventy-foundation
verified: 2026-10-03T14:00:00Z
status: passed
score: 50/50 must-haves verified
covered_files:
  - .github/workflows/pages.yml
  - .gitignore
  - .nvmrc
  - .planning/phases/01-eleventy-foundation/01-01-PLAN.md
  - .planning/phases/01-eleventy-foundation/01-01-SUMMARY.md
  - .planning/phases/01-eleventy-foundation/01-02-PLAN.md
  - .planning/phases/01-eleventy-foundation/01-02-SUMMARY.md
  - .planning/phases/01-eleventy-foundation/01-03-PLAN.md
  - .planning/phases/01-eleventy-foundation/01-03-SUMMARY.md
  - .planning/phases/01-eleventy-foundation/01-04-PLAN.md
  - .planning/phases/01-eleventy-foundation/01-04-SUMMARY.md
  - .planning/phases/01-eleventy-foundation/01-05-PLAN.md
  - .planning/phases/01-eleventy-foundation/01-05-SUMMARY.md
  - .planning/phases/01-eleventy-foundation/01-06-PLAN.md
  - .planning/phases/01-eleventy-foundation/01-06-SUMMARY.md
  - .planning/phases/01-eleventy-foundation/01-07-PLAN.md
  - .planning/phases/01-eleventy-foundation/01-07-SUMMARY.md
  - README.md
  - eleventy.config.js
  - package.json
  - scripts/clean.js
  - src/_data/navigation.js
  - src/_data/site.js
  - src/_dev/layout-empty.njk
  - src/_dev/layout-test.njk
  - src/_includes/layouts/base.njk
  - src/_includes/partials/discord-cta.njk
  - src/_includes/partials/footer.njk
  - src/_includes/partials/head.njk
  - src/_includes/partials/header.njk
  - src/css/style.css
  - src/index.njk
  - src/js/main.js
  - test/build.test.js
  - test/client.test.js
  - test/devpages.test.js
  - test/helpers.js
  - test/layout.test.js
  - test/links.test.js
  - test/workflow.test.js

covered_digest: "v2:sha256:2d7c3ca26291f439ef93bee7b647ebb61e24c24f09d98585b52e06b046d631bf"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 39/43
  gaps_closed:
    - "G-01-5 (CR-01): a production build never silently emits http://localhost:8080 absolute URLs; npm run build without SITE_URL fails loudly, ALLOW_LOCAL_SITE_URL=1 opts out, README documents SITE_URL"
    - "SC2 / FOUND-02 visual+behavioural parity at / and /IBC-Website/ (UAT tests 1-3 passed, human-attested)"
    - "01-02 header fit at 320/390/768/1440 + skip link (UAT test 1)"
    - "01-04 GitHub Pages deploy (UAT test 7 passed; live URL independently fetched: 200, Eleventy build with /IBC-Website/ prefix)"
    - "01-06 D-07 parity sign-off and A5 hosting question (UAT tests 1-4)"
    - "01-02 judgment-tier prohibition: Polish copy unchanged (UAT test 6)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Read README.md section 'Wdrożenie' (and the SITE_URL bullet in 'Konfiguracja') once, in Polish"
    expected: "The Polish reads naturally, and the PowerShell and Git Bash commands copy-paste and run as written (SITE_URL build succeeds; plain build stops with 'SITE_URL is not set'; opt-out build succeeds)"
    why_human: "Planner-deferred <human-check> from 01-07 Task 3; natural-language quality and copy-paste ergonomics are a human judgment"
---

# Phase 1: Eleventy Foundation Verification Report

**Phase Goal:** The current site builds with Eleventy into plain static files and looks and behaves exactly as before. The site URL and Discord invite each live in one place, and new pages can reuse a shared layout.
**Verified:** 2026-10-03
**Status:** human_needed (one planner-deferred README readability check; no gaps)
**Re-verification:** Yes. This follows UAT (6 passed, 1 issue: G-01-5) and gap-closure plan 01-07.

## What changed since the previous verification

The previous report (`c5ae6c3`) was `human_needed` at 39/43. Since then, `git diff c5ae6c3..HEAD` outside `.planning/` touches exactly five files:
- `README.md`
- `src/_data/site.js`
- `test/build.test.js`
- `test/helpers.js`
- `test/workflow.test.js`

No template, CSS, JS, `eleventy.config.js`, `package.json` or `pages.yml` changed. The `site.js` change can only alter behaviour when SITE_URL is blank and the run mode is `build`. So the earlier human parity sign-off (UAT tests 1-3) still applies to the current code.

## Goal Achievement

I checked the following myself. I did not rely on the 01-07 SUMMARY.
- **Test suite:** `npm test`, run once in a clean env: 56/56 pass.
- **Real `npm run build`:**
  - with no SITE_URL: exit 1, guard message, no `_site/`;
  - with `ALLOW_LOCAL_SITE_URL=true`: exit 1;
  - with `SITE_URL=https://verify.example`: exit 0, absolute og:image, 0 localhost hits, 12 files.
- **Scratch builds:**
  - `SITE_URL=""`: exit 1, no output;
  - the CI env (`SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/`): exit 0, every href/src/data-src prefixed or a fragment/external;
  - the opt-out: localhost og:image;
  - a malformed SITE_URL (R2-WR-01 reproduced).
- **Eleventy run-mode mapping:** confirmed in `node_modules/@11ty/eleventy` (`cmd.cjs:86`, `Eleventy.js:636`).
- **Live site:** fetched https://inglourious-basterds-clan.github.io/IBC-Website/. It returns 200 and is the Eleventy build: `/IBC-Website/css/style.css`, the skip link, `data-discord-url`, absolute og:image.

### Observable Truths: Roadmap Success Criteria (contract)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | One documented build command produces a complete static site in `_site/`; docs say which folder to deploy | ✓ VERIFIED | `SITE_URL=https://verify.example npm run build` gives index.html, css/style.css, js/main.js and 9 assets, with og:image `https://verify.example/assets/hero-bg.jpg`. README "Wdrożenie" names `_site/` and now documents SITE_URL for PowerShell and Git Bash. CR-01 is closed: a plain `npm run build` exits 1 with `SITE_URL is not set…` and leaves no `_site/`, so it cannot silently ship localhost URLs |
| SC2 | Built home page looks and behaves like the old index.html | ✓ VERIFIED (human-attested) | UAT tests 1, 2 and 3 passed: the D-07 walk-through at `/` and `/IBC-Website/`, and the screenshot pairs. Earlier structural diff vs `ef0d894:index.html` is clean. No template, CSS or JS changed after the UAT |
| SC3 | Changing SITE_URL or the invite in its single config location updates every absolute URL / Discord link; no hardcoded host or second invite in `_site/` | ✓ VERIFIED | `links.test (d)(f)(g)(h)` pass. The invite literal appears once under `src/` (site.js). The CI-like build has 4 invite hits, all from site.js, and 0 localhost. The SITE_URL mutation flows to og:image (verify.example). See R2-WR-02 below for the domain-cutover doc issue in the test file |
| SC4 | A front-matter-only page renders the shared header/nav/footer/Discord CTA | ✓ VERIFIED | `devpages.test (b)(d)` pass. Layout files are unchanged since the previous verification |
| SC5 | Works at domain root and under a subpath prefix | ✓ VERIFIED | `links.test (a)(b)` pass. My own `/IBC-Website/` build has no unprefixed internal ref. The live Pages site serves prefixed assets with 200 |

### Observable Truths: plan 01-07 must_haves (new)

| # | Truth (abridged) | Status | Evidence |
|---|------------------|--------|----------|
| 1 | Build-mode with unset, empty or blank SITE_URL exits non-zero, prints `SITE_URL is not set` and `ALLOW_LOCAL_SITE_URL=1`, writes no index.html | ✓ VERIFIED | Real `npm run build` (unset) exits 1, the message contains both strings (2 hits for the opt-out name), no `_site/`. Scratch `SITE_URL=""` exits 1 with no output dir. Tests "fails loudly" and "blank SITE_URL counts as missing" pass |
| 2 | Only `ALLOW_LOCAL_SITE_URL=1` opts out and keeps the localhost og:image | ✓ VERIFIED | `=true` exits 1. `=1` exits 0 with og:image `http://localhost:8080/assets/hero-bg.jpg`. `site.js:11` uses strict `!== "1"` |
| 3 | A set SITE_URL passes without the opt-out and emits no localhost | ✓ VERIFIED | verify.example and CI-env builds: exit 0, 0 localhost hits. Test "a set SITE_URL passes the guard" passes |
| 4 | `npm run dev` (serve) and watch are unaffected | ✓ VERIFIED | Test "site.js keeps the local default in serve and watch mode" passes. It is a real child-process import with `ELEVENTY_RUN_MODE=serve/watch`, and the probe matches production: `cmd.cjs:86` maps `--serve`→"serve", and `Eleventy.js:636` writes the env var |
| 5 | `npm test` green, also with an inherited SITE_URL/PATH_PREFIX/opt-out; helpers strip the opt-out and add it only for variants without SITE_URL | ✓ VERIFIED | 56/56. `helpers.js`: `buildEnvKeys` includes `ALLOW_LOCAL_SITE_URL` (case-insensitive strip); `build()` adds the opt-out only when `env.SITE_URL` is blank. Test "build helpers never inherit an opt-out" passes |
| 6 | pages.yml sets SITE_URL/PATH_PREFIX at job level, never the opt-out, unchanged | ✓ VERIFIED | pages.yml is unchanged since `c5ae6c3`. Job-level `env:` has both values. workflow.test (g)(h) pass |
| 7 | README documents the static-host build (PowerShell + Git Bash), the subfolder, the guard and the opt-out; Szybki start and Konfiguracja corrected | ✓ VERIFIED | README read in full: all blocks present, 0 `discord.gg`, the old one-line sentence is gone. Polish readability is the remaining human item |

### Observable Truths: earlier plans (regression check)

All 39 truths verified in the previous report still hold. The full suite is green, and none of their artifacts changed except the five files above, whose changes are confined to the guard. The 4 truths previously marked ⚠️ PRESENT_BEHAVIOR_UNVERIFIED are now resolved by direct human observation recorded in 01-UAT.md:

| Plan | Truth | Previous | Now | Evidence |
|------|-------|----------|-----|----------|
| — | SC2 parity | ⚠️ | ✓ VERIFIED | UAT 1-3 pass |
| 01-02 | Header one row at 320/390/768/1440, skip link | ⚠️ | ✓ VERIFIED | UAT 1 (explicitly lists header CTA at those widths and the skip link) |
| 01-04 | Push to main deploys `_site/` to Pages | ⚠️ | ✓ VERIFIED | UAT 7 pass. Independent `curl` of the live URL: 200, Eleventy output with prefix and absolute og:image |
| 01-06 | User walked D-07 checklist | ⚠️ | ✓ VERIFIED | UAT 1-4 pass. A5 answered "no" and ticked in parity.md. See the ℹ️ note on the checklist boxes |

**Score:** 50/50 truths verified (0 present-but-behavior-unverified). That is 43 earlier truths plus 7 from 01-07.

### Prohibitions

| Plan | Prohibition | Tier | Disposition |
|------|-------------|------|-------------|
| 01-01 FOUND-06 | No developer filesystem paths in built HTML | test | ✓ Enforced, passing |
| 01-02 FOUND-02 | No change to Polish copy/facts | judgment | ✓ Resolved by human: UAT test 6 passed |
| 01-02 FOUND-02 | No new third-party origin | test | ✓ Enforced, passing |
| 01-05 FOUND-05 | Dev pages never in production output | test | ✓ Enforced. The real build output has no `_dev/` |

### Required Artifacts (01-07)

| Artifact | Status | Details |
|----------|--------|---------|
| `src/_data/site.js` | ✓ VERIFIED | `localUrl` const. Guard at lines 11-17 with the exact message. Export shape unchanged. Imported by eleventy.config.js |
| `test/helpers.js` | ✓ VERIFIED | `cleanEnv`, `runBuild` exported. Opt-out-aware `build()`. Used by every test suite |
| `test/build.test.js` | ✓ VERIFIED | 7 guard tests (lines 104-175). All substantive and passing |
| `test/workflow.test.js` | ✓ VERIFIED | (g) and (h) present and passing |
| `README.md` | ✓ VERIFIED | Contains `$env:SITE_URL`, `SITE_URL is not set`, opt-out commands, MSYS subfolder form |

### Key Link Verification (01-07)

| From | To | Via | Status |
|------|----|-----|--------|
| site.js | eleventy.config.js / Eleventy run mode | config imports site.js after `Eleventy.js:636` sets `ELEVENTY_RUN_MODE` | WIRED. The real CLI build fails before any output is written |
| helpers.js | site.js | `ALLOW_LOCAL_SITE_URL: "1"` only for SITE_URL-less variants | WIRED. Production-like variants pass the real guard |
| pages.yml | site.js | job-level `SITE_URL` reaches `npm run build` | WIRED. Statically asserted; CI-env reproduced locally; the deploy before 01-07 was green |
| README | site.js | quotes the guard error, documents the opt-out | WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| og:image | site.url + pathPrefix | env SITE_URL (required in build mode) → site.js | Yes | ✓ FLOWING. The localhost fallback can no longer reach a production build silently |
| Invite hrefs + terminal | site.discord.invite | site.js → templates → `data-discord-url` → main.js | Yes | ✓ FLOWING |
| Nav | navigation.js | header/footer loops | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full suite (run once) | `env -u SITE_URL -u ALLOW_LOCAL_SITE_URL -u PATH_PREFIX -u ELEVENTY_RUN_MODE npm test` | 56 pass, 0 fail | ✓ PASS |
| Plain production build is guarded | `npm run build` (no SITE_URL) | exit 1, guard message, no `_site/` | ✓ PASS |
| Strict opt-out | `ALLOW_LOCAL_SITE_URL=true npm run build` | exit 1 | ✓ PASS |
| Empty SITE_URL | `SITE_URL= eleventy --output=<scratch>` | exit 1, no output | ✓ PASS |
| Documented build | `SITE_URL=https://verify.example npm run build` | exit 0, 12 files, absolute og:image, 0 localhost | ✓ PASS |
| CI-env subpath build | `SITE_URL=…github.io PATH_PREFIX=/IBC-Website/ eleventy --output=<scratch>` | exit 0, all internal refs prefixed | ✓ PASS |
| Opt-out build | `ALLOW_LOCAL_SITE_URL=1 eleventy --output=<scratch>` | exit 0, localhost og:image | ✓ PASS |
| Live deploy | `curl -sI` / `curl -s` the Pages URL | 200; prefixed CSS, skip link, invite, absolute og:image | ✓ PASS |
| Malformed SITE_URL (R2-WR-01) | `SITE_URL=ibc.example eleventy --output=<scratch>` | exit 0, og:image `/ibc.example/assets/hero-bg.jpg` | ⚠️ reproduced (warning) |

I removed `_site/` afterwards (`node scripts/clean.js`), so no verify.example build is left behind.

### Probe Execution

No `scripts/*/tests/probe-*.sh` exist and no plan declares probes. Step 7c: SKIPPED.

### Requirements Coverage

| Req | Plans | Status | Evidence |
|-----|-------|--------|----------|
| FOUND-01 | 01-01, 01-04, 01-05, 01-07 | ✓ SATISFIED | SC1. The deploy steps are now correct for both GitHub Pages and any static host |
| FOUND-02 | 01-02, 01-03, 01-06 | ✓ SATISFIED | SC2, human-attested in UAT 1-3 and 6 |
| FOUND-03 | 01-01, 01-06, 01-07 | ✓ SATISFIED | SC3. Build-mode SITE_URL is mandatory; mutation flows. Malformed values are a warning (R2-WR-01) |
| FOUND-04 | 01-01..03, 01-06 | ✓ SATISFIED | One invite literal; links (g)(h) |
| FOUND-05 | 01-02, 01-05 | ✓ SATISFIED | SC4 |
| FOUND-06 | 01-01..03, 01-06 | ✓ SATISFIED | SC5 plus the live prefixed deploy |

All six IDs are claimed by at least one plan and marked Complete in REQUIREMENTS.md. There are no orphaned requirements.

### Anti-Patterns Found

The debt-marker scan (TBD/FIXME/XXX/TODO) over the five changed files found nothing.

Assessment of the three incremental-review warnings, as requested:

| Finding | File | Severity | Blocks goal? | Reasoning |
|---------|------|----------|--------------|-----------|
| R2-WR-01: malformed SITE_URL passes the guard (same root as WR-01) | `src/_data/site.js:10-18` | ⚠️ Warning | No | Reproduced: `SITE_URL=ibc.example` exits 0 and gives a relative og:image. This does not falsify any SC or the G-01-5 truth: the value still comes from the single SITE_URL source, and the guard's stated job (missing value → loud failure) holds. 01-07 scoped WR-01 out explicitly. **Phase 2 SC5 ("production build fails with a clear message on a missing or relative canonical or og:image") covers it directly.** Fix sketch in 01-REVIEW.md, cheap to land now |
| R2-WR-02: test (g) pins the exact Pages host/prefix, so the README "Zmiana domeny" steps break CI | `test/workflow.test.js:94-103` (and the pre-existing pin in (c) at :46-47); `README.md:118-126` | ⚠️ Warning | No | Confirmed by reading: after the documented cutover, `npm test` in the build job fails before `npm run build`, so "Nic więcej w kodzie nie trzeba zmieniać" is false. The pin in test (c) already existed at the previous verification (missed then); (g) adds a second copy. SC3 still holds as worded: the rebuild with a new SITE_URL updates every URL in `_site/`, and the failure is loud, not silent. The domain is unknown today, and **Phase 2 SC5 ("a documented domain cutover checklist exists")** owns the cutover procedure. Recommended fix: assert the shape of the values, not the literals |
| R2-WR-03: PowerShell `$env:ALLOW_LOCAL_SITE_URL="1"` persists for the session silently | `README.md:63-69`; `site.js` | ⚠️ Warning | No | The bypass needs an explicit, documented opt-out the user typed, and the README shows `Remove-Item` right after it. It is an ergonomic hole: the user's primary shell is PowerShell. Recommended fix: `console.warn` when the opt-out is what lets a build through, plus `try { … } finally { Remove-Item … }` in the README. Not phase-goal relevant |
| R2-IN-01..05 | tests/README/site.js | ℹ️ Info | No | IN-04 is worth fixing with WR-02: the README "Jedynym miejscem konfiguracji jest `src/_data/site.js`" is now inaccurate for the production SITE_URL |
| WR-02..WR-05, IN-01..IN-07 (earlier review) | various | ⚠️/ℹ️ | No | Unchanged since the previous verification; still `open` in 01-REVIEW-DISPOSITION.md |
| parity.md checklist boxes | `baseline/parity.md` | ℹ️ Info | No | 20 boxes are still unticked (only A5 is ticked), but UAT tests 1-3 record a human pass. The UAT is the sign-off record; ticking the boxes is bookkeeping |
| Unpushed guard | git | ℹ️ Info | No | Local `main` is 11 commits ahead of `origin/main`. The live site predates 01-07. The first CI run with the guard is still to come. pages.yml sets SITE_URL at job level, and I reproduced the CI env locally (exit 0) |

None of these is a blocker, and none is a carried-forward gap. The warnings are recorded with evidence, not downgraded to advisory.

### Advisory (New Scope, Unevidenced)

None. All new-scope findings above are evidenced warnings, not unevidenced blocker candidates.

### Human Verification Required

1. **README "Wdrożenie" readability (planner-deferred from 01-07 Task 3).**
   - **Test:** Read the section and the SITE_URL bullet in "Konfiguracja" once. Optionally paste the PowerShell commands.
   - **Expected:** The Polish reads naturally, and the commands work as written.
   - **Why human:** This is a language-quality and ergonomics judgment.

Recommended developer decision while doing that read (not a gate): set dispositions in 01-REVIEW-DISPOSITION.md for R2-WR-01..03. My suggestion:
- R2-WR-01 and R2-WR-02: `deferred` to Phase 2 SC5, or fix now (both are small).
- R2-WR-03: fix now (a warn line plus try/finally in the README).

### Gaps Summary

There are no gaps. G-01-5 / CR-01 is closed in the code:
- A production build without SITE_URL stops before rendering, with a clear message and no deployable output.
- Only `ALLOW_LOCAL_SITE_URL=1` bypasses the guard.
- Serve/watch and the GitHub Pages workflow are unaffected.
- The README documents SITE_URL for both shells.

All five roadmap success criteria and all six FOUND requirements hold. The four behaviour-unverified items from the previous round now have human UAT evidence, and the live deploy was confirmed independently.

The only open item is the 01-07 planner-deferred human read of the Polish README. The three incremental-review warnings are real, but they do not block the phase goal. Two of them map onto Phase 2 SC5.

---

_Verified: 2026-10-03_
_Verifier: Claude (gsd-verifier)_
