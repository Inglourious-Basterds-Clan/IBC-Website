---
phase: 04-join-operations-pages
verified: 2026-10-13T20:20:16Z
status: human_needed
score: 12/14 must-haves verified
covered_files:
  - .planning/phases/04-join-operations-pages/04-01-PLAN.md
  - .planning/phases/04-join-operations-pages/04-01-SUMMARY.md
  - .planning/phases/04-join-operations-pages/04-02-PLAN.md
  - .planning/phases/04-join-operations-pages/04-02-SUMMARY.md
  - .planning/phases/04-join-operations-pages/04-03-PLAN.md
  - .planning/phases/04-join-operations-pages/04-03-SUMMARY.md
  - .planning/phases/04-join-operations-pages/04-04-PLAN.md
  - .planning/phases/04-join-operations-pages/04-04-SUMMARY.md
  - .planning/phases/04-join-operations-pages/04-05-PLAN.md
  - .planning/phases/04-join-operations-pages/04-05-SUMMARY.md
  - .planning/phases/04-join-operations-pages/04-06-PLAN.md
  - .planning/phases/04-join-operations-pages/04-06-SUMMARY.md
  - .planning/phases/04-join-operations-pages/04-07-PLAN.md
  - .planning/phases/04-join-operations-pages/04-07-SUMMARY.md
  - .planning/phases/04-join-operations-pages/04-08-PLAN.md
  - .planning/phases/04-join-operations-pages/04-08-SUMMARY.md
  - FACTS.md
  - README.md
  - eleventy.config.js
  - lib/check-perf.js
  - lib/check-seo.js
  - lib/dates.js
  - lib/discord.js
  - lib/html.js
  - lib/images.js
  - lib/js.js
  - lib/reject-output.js
  - lib/schema.js
  - scripts/clean.js
  - src/_data/discordBadge.js
  - src/_data/join.js
  - src/_data/navigation.js
  - src/_data/operations.js
  - src/_data/site.js
  - src/_includes/layouts/base.njk
  - src/_includes/partials/breadcrumbs.njk
  - src/_includes/partials/head.njk
  - src/_includes/partials/header.njk
  - src/css/partials/pages.css
  - src/css/partials/recruitment.css
  - src/css/style.css
  - src/index.njk
  - src/jak-dolaczyc.njk
  - src/js/main.js
  - src/js/modules/discord-badge.js
  - src/js/modules/hash-redirect.js
  - src/js/modules/terminal.js
  - src/operacje.njk
  - test/pages.test.js
covered_digest: "v3:sha256:45f78a081b47cef71d75d8d700244916b1294a02e171bc5dcd2e673d283bacf2"
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:
  - truth: "The live Discord badge replaces the baked text with the live count without moving any other element (no layout shift), and shows the fallback with JS off"
    test: "npm run dev, Chrome at 1280 px and 390 px, home page: scroll to the recruitment card and watch the line under 'Wejdź na Discord' change from 'Discord: 200+ osób' to 'Discord: N osób · M online'; record a DevTools Performance trace; then disable JavaScript and reload"
    expected: "No Layout Shift entry attributed to the badge or anything near it; with JS off the line reads 'Discord: 200+ osób'; offline reload leaves the fallback and no uncaught console error"
    why_human: "The swap logic is unit-tested with stub DOM/fetch, and the CSS sets white-space: nowrap + ellipsis, but no test measures layout shift in a real rendering engine"
human_verification:
  - test: "FACTS walk (goal clause 'the user confirms every drafted fact before publishing'): go through FACTS.md rows FACTS-01..FACTS-13 and confirm or correct each drafted text; for FACTS-11/12 also confirm patrol.jpg and sniper.jpg are clan screenshots fit to show; while there, also skim copy that was classified as confirmed but adds small wording beyond D-02 (join.js step texts 'Od tej chwili widzisz kanał kadetów.' and 'Umówicie się na rozmowę w dogodnym terminie.'; the evening step descriptions on /operacje/, whose FACTS-07 row lists only the times; the 'Gra Zeusowa' description), and check the recap texts name no members or callsigns (04-04 judgment prohibition). PRECONDITION: fix WR-02 first (see Anti-Patterns), or deleting the draft lines as documented turns npm test and the CI workflow red"
    expected: "Every row is set to 'potwierdzone' with its marker removed; SITE_URL=https://<domena> SITE_INDEXABLE=1 npm run build then prints check-seo: OK (no G10 lines); npm test stays green"
    why_human: "Factual accuracy and tone of clan copy can only be confirmed by the clan; 0 of 13 rows are confirmed today"
  - test: "Serve the root build and the /IBC-Website/ build; open /#recruitment and /IBC-Website/#recruitment; then press Back; also open /#about and /#gallery"
    expected: "The address bar ends on /jak-dolaczyc/ (prefixed in the second case), Back does not return to the #recruitment URL, and #about/#gallery scroll on home and stay there; the terminal still types its boot lines when the teaser scrolls into view"
    why_human: "The redirect logic is unit-tested with a stub window and the built link is verified, but location.replace history behaviour and module load timing need a real browser"
  - test: "Live Discord badge behaviour (see behavior_unverified_items), the backstop value 240 ('200+ osób'), and a decision on review finding WR-01 (the browser fetch sends each home visitor's IP to Discord without consent, the same concern that removed Google Fonts)"
    expected: "No layout shift, JS-off fallback visible, backstop accepted or replaced, WR-01 either accepted as the locked D-15 decision or changed (bake-only / click-to-load / privacy note)"
    why_human: "Rendering behaviour plus a privacy policy decision only the owner can make"
  - test: "Chrome at 1280 px and 390 px on /jak-dolaczyc/ and /operacje/: breadcrumbs 'Start › …' below the fixed header; breadcrumb left edge vs h1 (UI review notes a 23 px offset); steps 01–06; Tab to a FAQ question and press Enter and Space; open /jak-dolaczyc/#mody directly (review WR-03: no scroll-margin-top, so the target may sit under the header and stay collapsed)"
    expected: "Breadcrumbs fully visible, FAQ toggles from the keyboard without JS errors, offset and deep-link behaviour either accepted or fixed"
    why_human: "Visual alignment and scroll position under a fixed header cannot be checked by grep"
  - test: "Home at 1280 px and 390 px: the 'Centrum Rekrutacyjne' teaser shows four short requirements, the terminal, 'Instrukcja Zaciągu' with the short summary, 'Pełna instrukcja →', 'Wejdź na Discord' and the badge; the stat reads '19:00 / Start misji w weekendy'; the nav shows Start, O nas, Operacje, Dołącz and marks the current page on both subpages"
    expected: "The teaser reads well and the 'Pełna instrukcja →' link does not float mid-card (UI review issue)"
    why_human: "Visual layout inside a space-between flex card"
  - test: "/operacje/ at 1280 px and 390 px: schedule, mission types, era tags, evening timeline with times, 'Najbliższe misje' with the Discord button and no dates, four recap cards newest first; DevTools Network (Img) while scrolling"
    expected: "Readable on both widths; recap images load only when scrolled near"
    why_human: "Visual readability and real lazy-load timing"
  - test: "After the next deploy, open the site as a returning visitor with DevTools Network open"
    expected: "main.js?v=<hash> and every module URL carry the new hash"
    why_human: "Needs a deployed host and a warm browser cache"
---

# Phase 4: Join & Operations Pages Verification Report

**Phase Goal:** A Polish recruit can move around a real multi-page site, learn exactly how to join and how IBC plays, and see that the unit is active. The user confirms every drafted fact before publishing.
**Verified:** 2026-10-13T20:20:16Z
**Status:** human_needed
**Re-verification:** No (initial verification)

The code side of the goal is in place and I checked it against fresh builds, not against the summaries. Two things remain. First, the user has confirmed none of the 13 drafted facts yet, and that step is part of the goal. Second, nothing has been checked in a real browser yet. One review finding (WR-02) should be fixed before the user starts confirming facts, because following the documented confirmation steps currently breaks `npm test` and CI.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1: `/jak-dolaczyc/` shows requirements, numbered join steps, an expandable 12–16 question FAQ and a visible Discord CTA | ✓ VERIFIED | Fresh root build: one h1; `ul.req-list` has 6 items; `ol.join-steps` h3 titles are the 6 D-02 steps in order; 15 native `<details class="faq-item">`; CTA href is the invite from site.js. No "hardcore" or removal wording. The tone of the Polish copy goes to the FACTS walk. |
| 2 | SC2: `/operacje/` shows the schedule, mission types, eras, a "typowy wieczór" timeline and 3–5 dated recaps | ✓ VERIFIED | Built page: `#harmonogram`, `#rodzaje-misji` (PvE / Joint Operations / Gra Zeusowa), `#epoki`. `ol.evening-timeline` lists 18:45 Sloty → 19:00 Odprawa → 19:15 Misja → ok. 21:30 Debriefing → ok. 21:45 Przegląd OCAP. There are 4 recap cards, newest first (10.10, 04.10, 27.09, 20.09), each with `<time datetime>`, a Polish UTC date, one lazy `<picture>` with numeric width/height, and the meta line "date · setting · type". "Najbliższe misje" has no dates and no `<time>`. There is no Event anywhere. |
| 3 | SC3a: nav links go to real pages with the current page marked | ✓ VERIFIED | Built nav on every page: Start `/#hero`, O nas `/#about`, Operacje `/operacje/`, Dołącz `/jak-dolaczyc/`. On each subpage only its own link has `class="active-nav" aria-current="page"`. Home marks only Start, without aria-current, and 404 marks nothing. Under `/IBC-Website/` every href is prefixed. `scroll-spy.js` filters to same-path hash links, so the page links are never touched. |
| 4 | SC3b: an old link such as `/#recruitment` lands on the matching new page | ✓ VERIFIED (logic) | `hash-redirect.js` does an exact `===` match on `data-legacy-hash` and calls `location.replace(link.href)` on load and on hashchange. It is wired through the literal loader entry in `main.js`. The built home has `<section id="rekrutacja" … data-js="hash-redirect">` and `<a href="/IBC-Website/jak-dolaczyc/" … data-legacy-hash="recruitment">` in the prefix build. There is no `id="recruitment"` or `#recruitment` link left. 4 stub-window tests pass. The real-browser check is listed under Human Verification. |
| 5 | SC3c: both subpages show visible breadcrumbs that pass BreadcrumbList validation | ✓ VERIFIED | Built: `nav.breadcrumbs > ol` with Start → page (`aria-current="page"`). The JSON-LD BreadcrumbList items are `[base, canonical]` at the root and under `/IBC-Website/`. Gate G11 (`lib/check-seo.js:280`) enforces this on every build, with 16 fixtures passing. Home has neither, and 404 carries no JSON-LD. The position below the fixed header comes from the `pages.css` padding; the visual check is a human item. |
| 6 | SC4: every drafted fact is marked TODO and listed in FACTS.md; the production build stays blocked until each is confirmed and the markers are removed | ✓ VERIFIED | `SITE_INDEXABLE=1` build run here: exit 1 with exactly 13 problem lines, all `G10 unconfirmed draft marker TODO(FACTS-01..13)`, and nothing else. Every marker has a FACTS.md row with status "do potwierdzenia". `facts.test.js` keeps markers and rows in sync. Caveat: see WR-02 below. |
| 7 | SC5 (static part): home shows the Discord badge with a static fallback, labelled so it does not contradict "20+ aktywnych członków" | ✓ VERIFIED | Built home: `<p class="discord-badge" data-js="discord-badge" data-api-url="https://discord.com/api/v10/invites/…?with_counts=true">Discord: <span …>200+ osób</span><span class="discord-badge-online"></span></p>`, so the fallback is in the HTML (JS off). The online count is not baked. `<h3>20+</h3><p>Aktywnych członków</p>` is unchanged. |
| 8 | SC5 (live part): the badge updates live with members/online, without layout shift, and fails silently | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `discord-badge.js` behaviour: a URL-prefix guard, one fetch on first intersection, integer-only counts, textContent writes and `.catch`. Stub tests cover the swap and every failure mode. The CSS sets `white-space: nowrap`. No test measures layout shift in a real engine, so this goes to human verification. |
| 9 | Goal clause: the user confirms every drafted fact before publishing | ? UNCERTAIN (human) | The mechanism is in place (truth 6). The confirmation itself has not happened: all 13 FACTS rows are "do potwierdzenia". |
| 10 | 04-05: gates fail the build when breadcrumbs or the FAQPage differ from the visible page | ✓ VERIFIED | G11 and G12 are wired in `checkSite` (lines 516–517); 16 G11 and 13 G12 fixtures pass. My own decoding check: the 15 visible summaries and answers (after `visibleText`) equal the JSON-LD Question names and answers in order, at the root and under the prefix. |
| 11 | 04-02 (CR-01): gates and `clean.js` only ever move or delete `_site` or `_test/**` | ✓ VERIFIED | `isDisposableOutput` is checked first in `removeRejectedOutput` and imported by `scripts/clean.js`. The `reject-output.test.js` unit and CLI tests pass. The indexable run here moved `_site` to `_site.rejected` as designed. |
| 12 | 04-08 (WR-01): `main.js?v=<content hash>` and the same version on every module import | ✓ VERIFIED | Built: `<script type="module" src="/IBC-Website/js/main.js?v=1605d283ff">`. `main.js` has `const version = new URL(import.meta.url).search` and 7 literal `import('./modules/….js' + version)` calls. The `js-version.test.js` tests pass. |
| 13 | 04-07 / D-09: home and subpages never contradict each other | ✓ VERIFIED | Home: "Zalecane 16+ – liczy się dojrzałość.", "Mikrofon, TeamSpeak i ACRE2.", "Modpack ok. 90 GB…", "19:00 / Start misji w weekendy". Cross-page and old-copy tests pass. No built page contains "Ukończone 16 lat" or "Pt/Sob/Ndz". |
| 14 | 04-07: the recruitment terminal still boots in the renamed teaser section | ✓ VERIFIED | `terminal.js:7` uses `el.closest('section')`. The "terminal observes its enclosing section" and "no-op outside a section" stub tests pass. |

**Score:** 12/14 truths verified (1 present but behavior-unverified, 1 awaiting the user's FACTS confirmation)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/_data/join.js` | requirements, 6 steps, 12–16 FAQ | ✓ VERIFIED | 6 / 6 / 15; FACTS-04 and FACTS-05 drafts in the `draft` field only |
| `src/jak-dolaczyc.njk` | join page | ✓ VERIFIED | breadcrumb, faqSchema, todo FACTS-03; loops over join.* |
| `src/_includes/partials/breadcrumbs.njk` | visible trail | ✓ VERIFIED | included from base.njk under `{% if breadcrumb %}` |
| `lib/schema.js` | buildBreadcrumbList, buildFaqPage, buildPageGraph | ✓ VERIFIED | used by the `pageGraph` filter in head.njk |
| `lib/html.js` | visibleText | ✓ VERIFIED | used by check-seo G11/G12 and by the tests |
| `lib/reject-output.js`, `scripts/clean.js` | CR-01 allow-list | ✓ VERIFIED | shared `isDisposableOutput` |
| `lib/discord.js`, `src/_data/discordBadge.js`, `src/js/modules/discord-badge.js` | badge | ✓ VERIFIED | baked text in HTML, module loaded through main.js |
| `src/_data/operations.js`, `src/operacje.njk`, `lib/dates.js` | operations page | ✓ VERIFIED | `images.recaps` from lib/images.js; `plDate` filter |
| `lib/check-seo.js` | G11, G12 | ✓ VERIFIED | wired in checkSite |
| `src/css/partials/pages.css` | subpage styles | ✓ VERIFIED | imported in style.css between recruitment and footer; in the bundle; CSS 4663 B gz (cap 5120) |
| `src/js/modules/hash-redirect.js`, `src/_data/navigation.js`, `header.njk` | redirect and nav | ✓ VERIFIED | see truths 3–4 |
| `lib/js.js` | JS content hash | ✓ VERIFIED | `jsHash` global data → base.njk |
| `README.md` | Phase 4 docs | ✓ VERIFIED | docs.test (f) passes |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| head.njk | lib/schema.js | `pageGraph(...)` → jsonLd, with `faq: (join.faq if faqSchema else none)` | ✓ WIRED (BreadcrumbList + FAQPage in the built join page) |
| base.njk | breadcrumbs.njk | `{% if breadcrumb %}` include inside `<main>` | ✓ WIRED |
| jak-dolaczyc.njk | join.js | `join.requirements / steps / faq` loops | ✓ WIRED |
| lib/images.js | operations.js | `operations.recaps` → `images.recaps` | ✓ WIRED (4 cards with eleventy-img pictures) |
| eleventy.config.js | lib/dates.js | `plDate` filter | ✓ WIRED (Polish dates in the output) |
| lib/check-seo.js | lib/html.js | `visibleText` | ✓ WIRED |
| scripts/clean.js | lib/reject-output.js | `isDisposableOutput` | ✓ WIRED |
| index.njk | discordBadge.js | `discordBadge.apiUrl / fallbackText` | ✓ WIRED |
| main.js | discord-badge.js, hash-redirect.js | literal loader entries + version | ✓ WIRED (both files in `_site/js/modules/`) |
| header.njk | navigation.js | `item.href == page.url` → active-nav + aria-current | ✓ WIRED |
| base.njk | lib/js.js | `main.js?v={{ jsHash }}` | ✓ WIRED |
| style.css | pages.css | `@import` | ✓ WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| join page FAQ + FAQPage | `join.faq` | src/_data/join.js (one array for both) | yes; 15/15 equal after decoding | ✓ FLOWING |
| recap cards | `images.recaps` | operations.recaps → eleventy-img thumbs | yes; 4 drafted (by design, D-11) | ✓ FLOWING |
| badge fallback | `discordBadge.fallbackText` | build-time fetch, or the site.js backstop 240 | yes ("200+ osób" offline) | ✓ FLOWING |
| badge live text | invite API JSON | browser fetch | stub-tested only | ⚠️ needs a browser |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full suite (run once) | `npm test` | 430 tests, 430 pass, 0 fail | ✓ PASS |
| Root production build | `SITE_URL=https://inglourious-basterds-clan.github.io DISCORD_FETCH=0 npm run build` | check-seo OK, check-perf OK (css 4663/5120, js 6226/7936) | ✓ PASS |
| Prefix build | `MSYS_NO_PATHCONV=1 … PATH_PREFIX=/IBC-Website/ npm run build` | check-seo OK, check-perf OK; prefixed nav, breadcrumbs, BreadcrumbList items, legacy link, versioned script, sitemap | ✓ PASS |
| Indexable build blocked by drafts | `SITE_URL=https://example.org SITE_INDEXABLE=1 npm run build` | exit 1; 13 problem lines, 13 of them G10 FACTS-01..13, 0 other | ✓ PASS (by design) |
| FAQ visible = JSON-LD (my own script) | node inspect script over `_site/jak-dolaczyc/index.html` | 15 = 15, equal in order | ✓ PASS |

After the checks I rebuilt the root production `_site/`, because the indexable run had moved it to `_site.rejected/`.

### Probe Execution

Step 7c: SKIPPED. No `scripts/*/tests/probe-*.sh` exist, and no plan declares one.

### Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|-------------|-------------|--------|----------|
| CONT-01 | 04-01, 04-06 | ✓ SATISFIED | truth 1 |
| CONT-02 | 04-01, 04-05, 04-06 | ✓ SATISFIED | truths 1, 10 |
| CONT-03 | 04-04, 04-06 | ✓ SATISFIED | truth 2 |
| CONT-04 | 04-04, 04-06 | ✓ SATISFIED | truth 2 (4 recaps, all drafted) |
| CONT-05 | 04-07, 04-08 | ✓ SATISFIED (real-browser redirect check pending) | truths 3, 4, 12 |
| CONT-06 | 04-01, 04-02, 04-04, 04-07, 04-08 | ? NEEDS HUMAN | Marking, register and gate are verified (truth 6). "The user confirms them before publishing" has not happened (0/13), and WR-02 breaks tests on confirmation. REQUIREMENTS.md already shows it as Complete. |
| CONT-07 | 04-03, 04-08 | ✓ SATISFIED (live/no-shift part needs a human) | truths 7, 8 |
| SEO-06 | 04-01, 04-04, 04-05, 04-06 | ✓ SATISFIED | truth 5 |

Orphaned requirements: none. REQUIREMENTS.md maps exactly these 8 IDs to Phase 4, and every one is claimed by at least one plan.

### Prohibitions

- **Test-tier prohibitions:** each has wired enforcement that passed in this run. The tests are:
  - no hardcore or removal wording
  - FAQPage equals the visible FAQ (test plus G12)
  - drafted FAQ answers carry markers
  - CR-01 refusals
  - no server size presented as members, and the 20+ stat kept
  - only the two count fields are read (static test)
  - no baked online count
  - no upcoming list and no Event
  - every recap carries a draft marker
  - unknown and existing hashes are not redirected
  - D-09 consistency
  - no invite in the README
- **Judgment-tier prohibition (04-04):** "MUST NOT publish member names, callsigns or personal data in recap texts".
  - Non-authoritative LLM judgment: none of the 4 recap texts or alts names a person or callsign.
  - Flag: **unverified-prohibition, human review recommended**. This is folded into the FACTS walk.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| test/pages.test.js | 139, 271, 341, 345, 352 | Tests require draft markers to exist (review WR-02) | ⚠️ Warning (fix before the FACTS walk) | Following FACTS.md/README ("delete the `draft` line") makes `npm test` fail. CI (`.github/workflows/pages.yml` runs `npm test` before `npm run build`) then stops the GitHub Pages preview deploy. A recap dated on the same day as `lastUpdate` also fails (strict `<`). The goal's confirmation step works for `npm run build` but turns the test suite red. |
| src/css/partials/pages.css | (none) | No `scroll-margin-top` for subpage anchors (review WR-03) | ⚠️ Warning | `/jak-dolaczyc/#mody` and the `.page-block` anchors land under the fixed header, and a FAQ deep link stays collapsed |
| src/js/modules/discord-badge.js | 14–31 | Browser request to Discord without consent (review WR-01) | ⚠️ Warning, owner decision | It matches the locked D-15 decision, but the project removed Google Fonts for the same GDPR reason |
| test/reject-output.test.js | 246–253 | Real clean.js run on "." and ".." (review WR-04) | ℹ️ Info | Destructive only if a future isDisposableOutput regression happens |
| src/_data/join.js, src/_data/operations.js | steps 1–2; evening step texts | Small unmarked elaborations beyond D-02 | ℹ️ Info | Examples: "Od tej chwili widzisz kanał kadetów.", "Umówicie się na rozmowę w dogodnym terminie.", and evening step descriptions that the times-only FACTS-07 row does not cover. These are folded into the FACTS walk. |

There are no TBD, FIXME or XXX markers in any phase-modified file.

### Human Verification Required

1. **FACTS walk (goal clause).** Confirm or correct FACTS-01..13. Check that patrol.jpg and sniper.jpg are real clan screenshots. Skim the small unmarked elaborations and confirm the recaps name no members. **Fix WR-02 first.** Expected: every row `potwierdzone`, the markers removed, the indexable build `check-seo: OK`, and `npm test` green.
2. **Legacy redirect in a real browser.** Test `/#recruitment` and `/IBC-Website/#recruitment`, then the Back button, then `#about` and `#gallery` scrolling, then the terminal boot.
3. **Live badge.** Check that there is no layout shift, the JS-off fallback, the offline case with no uncaught error, and the backstop value of 240. Also make a decision on WR-01 (visitor IP sent to Discord).
4. **Subpages at 1280/390 px.** Breadcrumbs should sit below the header. Check the 23 px breadcrumb/h1 offset, the steps 01–06, FAQ toggling with Enter/Space, and the `#mody` deep link (WR-03).
5. **Home teaser at 1280/390 px.** Check the position of the "Pełna instrukcja →" link, the stat wording and the nav marking.
6. **/operacje/ readability and lazy images.**
7. **After a deploy.** On a returning visit, check that the `?v=` hash is on main.js and on every module.

### Gaps Summary

No must-have truth failed. Everything that can be built or tested is present, wired and passing:
- Two indexable Polish subpages, with breadcrumbs and gate-enforced structured data.
- Real-page nav with build-time `aria-current`.
- A safe legacy hash redirect.
- A Discord badge with a baked fallback.
- Every drafted text marked and blocking the indexable build. I confirmed this myself: exactly 13 G10 lines and nothing else.

The phase is not finished, for two reasons:
- The goal's last sentence is a human action that has not happened. All 13 FACTS rows are still open.
- Runtime and visual behaviour (redirect history, badge layout shift, breadcrumbs under the fixed header) has only been tested with stubs or not at all.

**Escalation for the developer.** WR-02 means the documented confirmation step (delete the `draft` line) breaks `npm test`, and with it the CI preview deploy. It does not stop the local indexable build, so I classified it as a warning rather than a blocker. It should still be fixed before the FACTS walk, or the user will hit red tests the moment they confirm a fact. WR-01 (consent for the browser call to Discord) and WR-03 (anchor offset) need a decision: fix them now, or accept them.

---

_Verified: 2026-10-13T20:20:16Z_
_Verifier: Claude (gsd-verifier)_
