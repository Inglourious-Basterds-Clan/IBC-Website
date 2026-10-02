---
phase: 01-eleventy-foundation
verified: 2026-10-03T12:00:00Z
status: human_needed
score: 39/43 must-haves verified
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
covered_digest: "v2:sha256:9e9f2ea890839b9a53ddbaa4a97c5ee5d3d63051e823e9abe23e7e00bf864f4a"
behavior_unverified: 4
overrides_applied: 0
behavior_unverified_items:
  - truth: "SC2: The built home page looks and behaves the same as the old index.html side by side (hero, about, gallery lightbox, recruitment terminal, mobile menu, scroll-spy, footer easter egg)"
    test: "Walk the baseline/parity.md D-07 checklist at http://localhost:8080/ and at http://localhost:8080/IBC-Website/ and compare the 10 baseline PNGs with their root-/sub- counterparts"
    expected: "Every checklist item works at both addresses; pages look like the baseline apart from the header Discord button and focus-only skip link"
    why_human: "Lightbox, mobile menu and easter-egg have no behavioural test; visual parity is a human judgment (D-07 rules out automated visual diffing). Terminal and scroll-spy are covered by node:vm tests only, not a real browser."
  - truth: "01-02: At 320, 390, 768 and 1440 px the header keeps logo, Discord CTA and (<=768 px) the hamburger on one row with the baseline header height"
    test: "DevTools device mode at 320/390/768/1440, compare with baseline/w320-top.png, mobile-top.png, w768-top.png, desktop-top.png; Tab once to reveal the skip link"
    expected: "One header row, no wrap/overlap, icon-only CTA at <=480 px, skip link 'Przejdź do treści' visible on first Tab"
    why_human: "Layout fit is visual; after/ screenshots look right at 320 px but no assertion can prove it"
  - truth: "01-04: A push to main runs npm ci, npm test, npm run build with the production env and deploys _site/ to GitHub Pages"
    test: "Enable Settings -> Pages -> Source: GitHub Actions (01-USER-SETUP.md, still Incomplete), push or re-run on main, then curl -sI https://inglourious-basterds-clan.github.io/IBC-Website/"
    expected: "Build and deploy run green; the URL returns 200"
    why_human: "Only the workflow file's structure is tested statically; Pages is not yet enabled on the repo, so no deploy has ever run"
  - truth: "01-06: The user has walked the D-07 checklist at / and /IBC-Website/ and confirmed visual and behavioural parity"
    test: "Tick the checklist in baseline/parity.md and answer the repo-root hosting question (A5)"
    expected: "All boxes checked; A5 answered"
    why_human: "Every checklist box in parity.md is still unchecked and the A5 answer is blank; this is a human sign-off by definition"
human_verification:
  - test: "D-07 parity walk-through at / (npm run dev, http://localhost:8080/): hero, about, gallery lightbox (click, Enter, Space, arrows, Esc, outside click), recruitment terminal line 'Połączenie nawiązane: discord.gg/DhJwkeehJK', mobile menu + aria-expanded, scroll-spy incl. 'System' at top, footer easter egg open/close, header Discord button at 320/390/768/1440, skip link on first Tab, no console errors except /favicon.ico"
    expected: "Everything behaves as on the old index.html; only the header Discord button and skip link are new"
    why_human: "Real-browser interaction and visual comparison; no automated test covers lightbox, menu or easter egg"
  - test: "Same walk-through at /IBC-Website/ (PowerShell: $env:PATH_PREFIX=\"/IBC-Website/\"; npm run dev, then Remove-Item Env:PATH_PREFIX), incl. full-size lightbox image loading under the prefix and the hero background image"
    expected: "Identical behaviour and look under the subpath"
    why_human: "Subpath rendering in a browser (CSS url(), lightbox data-src) is only asserted at the file-resolution level"
  - test: "Compare baseline/*.png with baseline/after/root-*.png and sub-*.png (10 pairs each)"
    expected: "Same look apart from the header Discord button; the scrolled mobile shots now show the fixed header (explained in parity.md)"
    why_human: "Visual judgment"
  - test: "Answer parity.md question A5: is the old repo root served by any host other than GitHub Pages?"
    expected: "If yes, that host must switch to deploying _site/ (and set SITE_URL, see next item)"
    why_human: "Only the user knows the current hosting"
  - test: "Decide on review finding CR-01: README 'Dowolny hosting statyczny' says just `npm run build`, which emits og:image=http://localhost:8080/assets/hero-bg.jpg (reproduced). Either fix now (document SITE_URL=https://<domena> npm run build in README and/or fail a production build without SITE_URL) or accept it as Phase 2 scope (Phase 2 SC5: build gate on canonical/og:image, noindex for non-final hosts, domain cutover checklist)"
    expected: "Explicit decision recorded in 01-REVIEW-DISPOSITION.md (fixed or deferred to Phase 2)"
    why_human: "Does not falsify SC1/SC3 as worded (the value comes from the single config location and the GitHub Pages path sets it), but it is a real defect on a documented deploy path; scope call belongs to the developer"
  - test: "Judgment-tier prohibition (01-02, FOUND-02 transparency): confirm no existing Polish copy or factual claim changed and new visible text is only 'Przejdź do treści' and 'Discord'"
    expected: "Confirmed"
    why_human: "Judgment-tier prohibition; LLM-judge verdict below is non-authoritative (unverified-prohibition, human review recommended)"
  - test: "GitHub Pages first deploy (01-USER-SETUP.md): enable Settings -> Pages -> Source: GitHub Actions, re-run the workflow on main"
    expected: "Build and deploy jobs green; https://inglourious-basterds-clan.github.io/IBC-Website/ serves the site with all assets"
    why_human: "Requires repo admin access and a real GitHub Actions run"
---

# Phase 1: Eleventy Foundation Verification Report

**Phase Goal:** The current site builds with Eleventy into plain static files and looks and behaves exactly as before. The site URL and Discord invite each live in one place, and new pages can reuse a shared layout.
**Verified:** 2026-10-03
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

Everything that can be checked automatically holds, and I checked it independently rather than relying on the SUMMARYs: the full test suite (47/47 pass), my own scratch builds at root and `/IBC-Website/`, a scratch-copy mutation of both the invite and SITE_URL, a real `npm run build` with a stale `_site/_dev/` page planted, a diff of the built home page against `git show ef0d894:index.html`, and the raw Lighthouse JSONs. What is left is the D-07 human parity sign-off. Every box in `parity.md` is still unchecked.

### Observable Truths — Roadmap Success Criteria (contract)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | One documented build command produces a complete static site in `_site/`; docs say which folder to deploy | ✓ VERIFIED (see CR-01 warning) | Planted `_site/_dev/stale/index.html`, ran `npm run build` → output is exactly index.html, css/style.css, js/main.js, 9 assets; stale page gone. README "Wdrożenie" says deploy `_site/`, not the repo root. Caveat: the same command without SITE_URL emits `og:image=http://localhost:8080/...` (CR-01) |
| SC2 | Built home page looks and behaves like old index.html (hero, about, lightbox, terminal, menu, scroll-spy, easter egg) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `diff -w old index.html built index.html`: only intended changes (root-relative URLs, skip link, header-actions + CTA, `section id="hero"` instead of `body id="hero"`, lightbox moved inside `<main>`, `data-discord-url`, og:image absolute). No Polish copy changed. CSS diff is additive only; JS diff is limited to the terminal invite source, textContent spans and the hash-based scroll-spy. Terminal and scroll-spy have passing node:vm tests. Lightbox, menu and easter egg have no behavioural test, and the parity checklist is unchecked |
| SC3 | Changing SITE_URL or the invite in its single config location and rebuilding updates every absolute URL / Discord link; no hardcoded host, no second invite | ✓ VERIFIED | Scratch copy with the invite changed to `discord.gg/MUTATED123` in `site.js` and `SITE_URL=https://mutated.example`: 0 old-invite hits in output (incl. js/main.js), 8 new-invite hits; hosts in output are only mutated.example + the allowlisted CDNs/socials. `links.test.js (f)(g)(h)` pass: invite literal once under src/, host literals only in site.js |
| SC4 | A new page with only front matter + body renders the same header, nav, footer, Discord CTA | ✓ VERIFIED | `src/_dev/layout-test.njk` (front matter + body) and `layout-empty.njk` (front matter only); `devpages.test.js (b)` asserts byte-equal `<header>`/`<footer>` vs home (minus active-nav); (d) empty page gets full chrome + default title |
| SC5 | Built site works at domain root and under `/IBC-Website/`; every internal link, stylesheet, script, image resolves in both | ✓ VERIFIED | Own `/IBC-Website/` build: every href/src/data-src is `/IBC-Website/...` or a same-page fragment; CSS `url('../assets/hero-bg.jpg')` is relative and resolves from css/. `links.test.js (a)(b)` resolve every URL to a file in both variants. after/sub-w320-top.png shows the hero background loading under the prefix |

### Observable Truths — PLAN must_haves (merged, roadmap duplicates removed)

| Plan | Truth (abridged) | Status | Evidence |
|------|------------------|--------|----------|
| 01-01 | D-07 baseline: 10 screenshots ≥10 KB + scores.md with 3 runs + median | ✓ VERIFIED | 10 PNGs 91–1428 KB; scores.md Median row; raw lh/mobile-1..3.json = 39/46/46 perf, 96/77/100 |
| 01-01 | `npm run build` emits index, css, js, 9 assets | ✓ VERIFIED | Real build listing above |
| 01-01 | PATH_PREFIX build links /IBC-Website/css + js; no `src="."`, no C:/ | ✓ VERIFIED | Own build; build.test + links.test (c) |
| 01-01 | SITE_URL trailing slash + PATH_PREFIX without slashes → exact og:image, no `//` | ✓ VERIFIED | build.test "SITE_URL and PATH_PREFIX are normalized" passes; site.js normalization read |
| 01-01 | Unset/empty env → localhost:8080 and `/` | ✓ VERIFIED | Own root build og:image = `http://localhost:8080/assets/hero-bg.jpg`; build.test "empty env" passes |
| 01-01 | Non-empty env overrides site.js; no third source | ✓ VERIFIED | site.js is the only reader of SITE_URL/PATH_PREFIX; eleventy.config.js imports `site.pathPrefix` |
| 01-01 | Every invite in home = site.discord.invite; index.njk has no literal | ✓ VERIFIED | index.njk uses `{{ site.discord.invite }}` only |
| 01-01 | Per-suite `_test/` dirs; helper strips SITE_URL/PATH_PREFIX/INCLUDE_DEV_PAGES/ELEVENTY_RUN_MODE | ✓ VERIFIED | test/helpers.js; suite passes in parallel |
| 01-02 | Home keeps all sections/ids/Polish text, one h1, 4 gallery items, #lightbox, #terminal-console[data-discord-url], overlay, trigger | ✓ VERIFIED | Diff vs old index.html; layout.test passes |
| 01-02 | index.njk is front matter + body; shell from base.njk + partials | ✓ VERIFIED | index.njk read; `layout: layouts/base.njk` |
| 01-02 | Header Discord hud-btn outside nav list, target _blank, rel noopener noreferrer | ✓ VERIFIED | discord-cta.njk, header.njk (`header-actions` after `</nav>`) |
| 01-02 | Nav order from navigation.js; only home marks System active | ✓ VERIFIED | header.njk `page.url == "/" and loop.first`; layout.test FOUND-05 |
| 01-02 | Under prefix logo/gallery src+data-src/css/js/nav start with /IBC-Website/ | ✓ VERIFIED | Own sub build ref list |
| 01-02 | Skip link first in body, hidden until focus; `<main id="main">` | ✓ VERIFIED (presence) | base.njk + `.skip-link`/`.skip-link:focus` CSS; visual reveal is in human items |
| 01-02 | Keywords + SportsTeam JSON-LD home-only; FA CDN, Google Fonts, inline styles unchanged | ✓ VERIFIED | head.njk `page.url == "/"`; diff shows no head/inline-style changes |
| 01-02 | Header one row at 320/390/768/1440 with baseline height | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | CSS present; after/*-w320-top.png looks right; planner-deferred human-check |
| 01-03 | main.js has no invite literal; terminal prints 'Połączenie nawiązane: ' + invite without scheme | ✓ VERIFIED | client.test passes; source read |
| 01-03 | Missing data-discord-url → still boots | ✓ VERIFIED | client.test "boots without data-discord-url" |
| 01-03 | Three spans via textContent; no innerHTML in writeToConsole | ✓ VERIFIED | Source + client.test |
| 01-03 | Scroll-spy hash-based, filtered by pathname; header → #hero | ✓ VERIFIED | client.test (vm, /IBC-Website/) passes |
| 01-03 | Scroll-spy inert on other paths | ✓ VERIFIED | client.test "inert" |
| 01-03 | Classic script, 5 inits on DOMContentLoaded, `node --check` | ✓ VERIFIED | client.test node --check |
| 01-04 | Push to main: npm ci → test → build with prod env, upload, deploy | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | pages.yml correct and contract-tested; Pages not enabled (01-USER-SETUP.md Incomplete), no deploy has run |
| 01-04 | PR runs build/test, never uploads/deploys | ✓ VERIFIED | `if: github.event_name != 'pull_request'` on upload and deploy job; workflow.test (c)(d) |
| 01-04 | Only deploy has pages/id-token write; no npm in deploy; workflow-level contents: read | ✓ VERIFIED | pages.yml read; workflow.test (b)(d) |
| 01-04 | Polish README: Node 24, dev/build/test, `_site/` replaces root, config in site.js, Pages workflow, Settings step | ✓ VERIFIED | README read; .nvmrc = 24 |
| 01-04 | README has no invite, no host outside workflow values | ✓ VERIFIED | No `discord.gg` in README; only the github.io deploy address |
| 01-05 | Front matter-only page renders chrome, empty main, default title | ✓ VERIFIED | devpages (d) |
| 01-05 | devOnly pages in dev/INCLUDE_DEV_PAGES only; prod has no _dev/ | ✓ VERIFIED | Real `npm run build` output has no _dev/; preprocessor in eleventy.config.js |
| 01-05 | `npm run build` deletes `_site/` first | ✓ VERIFIED | Planted stale page removed by real build |
| 01-05 | clean.js refuses repo root / outside paths | ✓ VERIFIED | devpages (h) passes; guard read |
| 01-05 | Dev pages have no keywords/JSON-LD; eleventyExcludeFromCollections | ✓ VERIFIED | Front matter + head.njk guard; devpages (c) |
| 01-06 | CSS url() targets resolve from css/ in both | ✓ VERIFIED | links.test (b) |
| 01-06 | Mutated SITE_URL build: all own absolute URLs under it, no github.io / localhost | ✓ VERIFIED | links.test (d); own mutated build |
| 01-06 | Absolute URLs only self or allowlisted hosts | ✓ VERIFIED | Own mutated build host list |
| 01-06 | No github.io host under src/ or config; localhost:8080 only in site.js | ✓ VERIFIED | links.test (f) |
| 01-06 | After-migration screenshots for both variants; Lighthouse medians within gate | ✓ VERIFIED | 20 PNGs in after/; raw after-mobile-1..3.json = 44/44/45, 96, 77, 100 vs baseline 46/96/77/100 |
| 01-06 | User walked D-07 checklist and confirmed parity | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | All parity.md boxes unchecked, A5 blank |

(01-05 truth 1 folded into SC4; 01-06 truths 1 and 5 folded into SC5 and SC3.)

**Score:** 39/43 truths verified (4 present, behavior-unverified)

### Prohibitions

| Plan | Prohibition | Tier | Disposition |
|------|-------------|------|-------------|
| 01-01 FOUND-06 | No developer filesystem paths in built HTML | test | ✓ Enforced and passing: build.test prefix variant + links.test (c) |
| 01-02 FOUND-02 | No change to existing Polish copy/facts; new text only Polish or "Discord" | judgment | **unverified-prohibition — human review recommended.** Non-authoritative LLM verdict: holds. The diff against ef0d894 shows no copy changes, and the new strings are "Przejdź do treści" and "Discord" |
| 01-02 FOUND-02 | No new third-party origin / tracking | test | ✓ Enforced: links.test host allowlist; own build hosts = fonts.googleapis/gstatic, cdnjs, discord.gg, youtube, facebook, schema.org + own host |
| 01-05 FOUND-05 | Dev pages never in production output/collections | test | ✓ Enforced: devpages (e), clean (g)(i), real build with a planted stale page |

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `package.json` | ✓ VERIFIED | `~3.1.6`, ESM, dev/build/test, `node scripts/clean.js && eleventy` |
| `eleventy.config.js` | ✓ VERIFIED | HtmlBasePlugin, passthrough, `pathPrefix: site.pathPrefix`, devOnly preprocessor |
| `src/_data/site.js` | ✓ VERIFIED | url, pathPrefix, name, discord.invite (only literal), includeDevPages |
| `src/_data/navigation.js` | ✓ VERIFIED | 4 entries, used by header + footer loops |
| `src/index.njk` | ✓ VERIFIED | Front matter + body, `site.discord.invite`, `htmlBaseUrl` on data-src |
| `src/_includes/layouts/base.njk` + 4 partials | ✓ VERIFIED | Included by index and both dev pages |
| `src/js/main.js` | ✓ VERIFIED | `getAttribute('data-discord-url')`, hash scroll-spy |
| `src/_dev/layout-test.njk`, `layout-empty.njk` | ✓ VERIFIED | devOnly, excluded from collections |
| `scripts/clean.js` | ✓ VERIFIED | Guarded rmSync, wired into the build script |
| `.github/workflows/pages.yml` | ✓ VERIFIED (static) | deploy-pages@v5; runtime deploy pending user setup |
| `README.md` | ✓ VERIFIED | Polish, `_site/`, site.js |
| `test/*.test.js` (6) + helpers | ✓ VERIFIED | 47/47 pass; links 202 lines, client 237, layout 177, devpages 134, build 98, workflow 91 |
| `baseline/scores.md`, `baseline/parity.md`, `baseline/after/` | ✓ VERIFIED | Present and match the raw reports; checklist unchecked |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| eleventy.config.js | site.js | `import site` → `pathPrefix: site.pathPrefix` | WIRED |
| head.njk | site.js | `htmlBaseUrl(site.url)` for og:image | WIRED (output confirmed) |
| index.njk / discord-cta / footer | site.js | `site.discord.invite` | WIRED (mutation propagated) |
| header/footer | navigation.js | `for item in navigation` | WIRED |
| main.js terminal | index.njk `data-discord-url` | `runBootSequence(consoleEl, discordUrl)` | WIRED |
| main.js scroll-spy | nav hrefs | `link.pathname === window.location.pathname`, `link.hash` | WIRED |
| package.json build | scripts/clean.js | `node scripts/clean.js && eleventy` | WIRED (stale page removed) |
| devOnly preprocessor | site.includeDevPages | `data.devOnly && !site.includeDevPages` | WIRED |
| pages.yml | package scripts / .nvmrc / env | npm ci→test→build, `node-version-file: .nvmrc`, SITE_URL/PATH_PREFIX | WIRED (static) |
| links.test | helpers / site.js | `build("links-*")`, `site.discord.invite` | WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| Built og:image | site.url + pathPrefix | env SITE_URL/PATH_PREFIX → site.js | Yes; mutated value flows | ✓ FLOWING (falls back to localhost when SITE_URL is unset, see CR-01) |
| Invite hrefs + terminal line | site.discord.invite | site.js → templates → `data-discord-url` → main.js | Yes; mutated value flows to all 8 occurrences, 0 stale | ✓ FLOWING |
| Nav items | navigation.js | global data → header/footer loops | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full suite (run once) | `npm test` | 47 pass, 0 fail | ✓ PASS |
| Documented build is clean + complete | plant `_site/_dev/stale`, `npm run build`, `find _site` | 12 files, no _dev | ✓ PASS |
| Subpath build | `PATH_PREFIX=/IBC-Website/ eleventy --output=<scratch>/sub` | all refs prefixed or fragment | ✓ PASS |
| Single-source mutation | scratch copy, invite + SITE_URL changed, rebuild | 0 old invite, 8 new, no stray host | ✓ PASS |
| Parity vs old page | `diff -w` old index.html vs built | only intended changes | ✓ PASS (structural) |
| Lighthouse gate | read raw lh/*.json | after 44/96/77/100 vs base 46/96/77/100 | ✓ PASS |
| Plain build og:image (CR-01) | `grep localhost:8080 _site/index.html` | 1 hit | ⚠️ reproduced |

### Probe Execution

No `scripts/*/tests/probe-*.sh` exist and no plan declares probes. Step 7c: SKIPPED.

### Requirements Coverage

| Req | Plans | Description | Status | Evidence |
|-----|-------|-------------|--------|----------|
| FOUND-01 | 01-01, 01-04, 01-05 | Builds into `_site/`, deploy steps documented | ✓ SATISFIED (CR-01 warning) | SC1 |
| FOUND-02 | 01-02, 01-03, 01-06 | Same content and look as before | ? NEEDS HUMAN | Structural diff clean; visual/behavioural sign-off pending |
| FOUND-03 | 01-01, 01-06 | One SITE_URL value, all absolute URLs from it | ✓ SATISFIED | SC3 mutation; links (d)(f) |
| FOUND-04 | 01-01..03, 01-06 | Invite defined once | ✓ SATISFIED | links (g)(h); mutation |
| FOUND-05 | 01-02, 01-05 | Shared layout | ✓ SATISFIED | SC4 |
| FOUND-06 | 01-01..03, 01-06 | Works at root and subpath | ✓ SATISFIED | SC5 |

All six phase IDs are claimed by at least one plan. No orphaned requirements. Note: REQUIREMENTS.md already marks FOUND-02 `[x] Complete`, but its human sign-off is still pending.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (all phase files) | — | TBD/FIXME/XXX/TODO | none found | — |
| README.md / src/_data/site.js | 24 / 6-7 | CR-01: generic deploy path omits SITE_URL → localhost og:image | ⚠️ Warning | Wrong social-preview URL for self-hosted deploys. GitHub Pages path is unaffected. The old site had a relative (also invalid) og:image, so this is not a parity regression |
| src/js/main.js | 76, 260, 267 | WR-02: `overflow = 'auto'` on close overrides the new `overflow-x: clip` | ⚠️ Warning | After a lightbox/easter-egg close, narrow phones fall back to the baseline overflow. No worse than baseline, but it undoes the 01-02 fix |
| src/js/main.js | 197-198 | WR-03: pathname filter breaks scroll-spy, and turns nav clicks into reloads, at `/index.html` | ⚠️ Warning | Behaviour regression vs the old `#about` hrefs when the page is reached as /index.html. The canonical `/` and `/IBC-Website/` are unaffected |
| src/_includes/partials/head.njk | 6, 17-18 | WR-04: og:title/description hardcoded in the shared head | ℹ️ Info for Phase 1 | Phase 2 (SEO-01) scope |
| test/devpages.test.js | 122-129 | WR-05: test runs the real rm against the repo root behind the guard | ⚠️ Warning | Test-safety risk only |
| src/_includes/partials/footer.njk | 21 | Hardcoded `© 2026` (IN-07) | ℹ️ Info | — |

All 13 review findings are still `open` in 01-REVIEW-DISPOSITION.md.

### CR-01 judgment (requested)

CR-01 does **not** falsify SC1 or SC3 as written:
- **SC1:** the documented command does produce a complete static site in `_site/`, and the docs name `_site/` as the folder to deploy.
- **SC3:** the localhost value is the default inside the single config location (`site.js`), not a template literal. Changing it, or setting SITE_URL, updates every absolute URL (proven by mutation). The production GitHub Pages path sets SITE_URL in the workflow.

It is still a real defect on a documented path. README "Dowolny hosting statyczny: uruchom `npm run build`" never mentions SITE_URL, and the project constraint is that the user deploys to any static host. Right now only og:image is affected, and the old page's relative og:image was invalid too, so it is not a regression. It becomes serious in Phase 2, when canonical/og:url/sitemap inherit the same fallback. Phase 2 SC5 (build gate for bad canonical/og:image, noindex for non-final hosts, domain cutover checklist) is the natural home for the guard. The one-line README fix is cheap enough to do now. I classified it as a WARNING and listed it as a human decision item, not a blocker.

### Human Verification Required

1. **D-07 parity at `/`.** Walk the `baseline/parity.md` checklist (`npm run dev`, http://localhost:8080/). Expected: everything behaves as on the old page. Why human: lightbox, menu and easter egg have no behavioural test; visual parity is judgment.
2. **D-07 parity at `/IBC-Website/`.** Same checklist with PATH_PREFIX set. Expected: identical, full-size lightbox images and hero background load. Why human: real-browser subpath rendering.
3. **Screenshot pairs.** Compare the 10 baseline PNGs with after/root-* and after/sub-*. Expected: only the header Discord button differs (plus the explained mobile fixed-header offset).
4. **Header fit at 320/390/768/1440 + skip link.** This check was deferred from 01-02 by the planner.
5. **Hosting question A5.** Answer it in parity.md.
6. **CR-01 decision.** Fix the README/build guard now, or defer to Phase 2 and record it in 01-REVIEW-DISPOSITION.md.
7. **Judgment-tier prohibition (FOUND-02 copy unchanged).** Confirm the non-authoritative LLM verdict above.
8. **GitHub Pages first deploy.** Complete 01-USER-SETUP.md and confirm a green deploy at https://inglourious-basterds-clan.github.io/IBC-Website/.

### Gaps Summary

There are no blocking gaps. Every automatable must-have holds against the actual code and fresh builds:
- build and clean;
- root and subpath link resolution;
- single-source SITE_URL and invite, proven by a real mutation;
- the shared layout for front-matter-only pages;
- terminal and scroll-spy behaviour;
- workflow structure;
- Lighthouse non-regression.

The phase cannot be marked passed because:
- the visual/behavioural parity sign-off (SC2, FOUND-02) has not happened: every parity.md box is unchecked;
- the GitHub Pages deploy has never run (user setup pending);
- the CR-01 scope decision and one judgment-tier prohibition need the developer.

WR-02 and WR-03 are worth a look during the parity walk. Opening and closing a lightbox at 390 px, and loading `/index.html`, would show them.

---

_Verified: 2026-10-03_
_Verifier: Claude (gsd-verifier)_
