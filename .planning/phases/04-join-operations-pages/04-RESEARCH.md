# Phase 4: Join & Operations Pages - Research

**Researched:** 2026-10-11
**Domain:** Eleventy 3.1 multi-page content, data-driven JSON-LD (BreadcrumbList, FAQPage), progressive-enhancement client modules, build-time remote data with offline fallback
**Confidence:** HIGH (codebase patterns and gates read this session; Discord endpoint live-tested; Google/Discord docs fetched)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Clan facts (user-confirmed, CONT-01..03, CONT-06)
- **D-01:** The user supplied the facts below in the discussion. Copy that states them is **confirmed: no TODO marker**. Only wording Claude adds beyond them (FAQ answers not covered here, timeline times, recap stories, flavour lines) gets `TODO(FACTS-NN)` + a `FACTS.md` row, using the existing format.
- **D-02:** Confirmed facts:
  - **Schedule:** missions mostly on **weekends at 19:00**, lasting **about 2–3 hours**. Besides planned missions there are **Zeus games** (a game master builds the scenario on the fly). They are more casual and announced on the same day.
  - **Eras / settings:** Zeus games are **modern only**. Missions cover whatever the Mission Maker (MM) builds: **modern, Vietnam, Cold War, sometimes WW2**, and unusual settings such as **Warhammer 40k or post-apo**.
  - **Mission types:** mostly **PvE**, sometimes **Joint Operations (JO/JOP)** with other Polish and foreign clans.
  - **Style:** **casual milsim, no RP**, but players need the maturity to follow the leader's orders. Recruiting **Polish players**.
  - **Comms:** **TeamSpeak + ACRE2** mainly. **TFAR** is used in some JOs.
  - **Modpack:** state it as **"ok. 90 GB"** (about 55 mods). Players get it through the **Steam Workshop**, and the preset is shared on Discord. It is the standard pack for Zeus games and mission making, and it is **required for basic training**. Missions can have their own tailored modpacks.
  - **DLC:** **no CDLC required**. They are nice to have for Vietnam missions. Compat data works without them but shows ads.
  - **Age:** **"Zalecane 16+"**. It is not enforced strictly, and maturity matters more. This replaces the hard "Ukończone 16 lat".
  - **Typical evening:** **slotting → briefing → mission → debrief** (feedback for the MM) **→ OCAP review**. Exact times (e.g. a muster before 19:00) are not confirmed, so they get a TODO.
  - **Join flow** (from the cadet channel):
    1. Join Discord and pick the **Kadet** role.
    2. **Within 3 days**, message a recruiter on the cadet channel. Phrase this gently, e.g. "w ciągu 3 dni odezwij się do rekrutera"; don't word it as a threat of removal.
    3. Install the standard modpack (ok. 90 GB, Steam Workshop preset from Discord).
    4. Recruitment interview, usually **15–20 minutes**, covering the rules and how the clan works.
    5. **Basic training** right after the interview. It takes **2–3.5 hours** for someone who has just bought Arma 3.
    6. After basic training the player is **automatically promoted to Klanowicz** and can take specializations and join games.
- **D-03:** Copy is natural Polish with a "casual but disciplined" tone. Don't overpromise realism ("hardcore milsim", RP).

#### FAQ (CONT-02)
- **D-04:** 12–16 questions in natural Polish (search phrasing such as "Czy muszę mieć doświadczenie w Arma 3?", "Ile miejsca zajmują mody?", "Czy potrzebuję DLC?", "Ile trzeba mieć lat?"). Shown as a native `<details>/<summary>` accordion, no JS.
- **D-05:** **FAQPage JSON-LD is emitted** on `/jak-dolaczyc/`, built from **the same data** as the visible accordion (one source). It gives no Google rich result, which is accepted. The gate/tests must check that the JSON-LD questions match the visible ones and that the JSON-LD is valid. Gate G5 still bans Event.

#### Home vs. subpages & nav (CONT-05)
- **D-06:** The home recruitment section becomes a **teaser**. Keep the terminal and the Discord CTA (they're part of the site's identity), cut requirements/steps down to a short summary, and add a "Pełna instrukcja →" link to `/jak-dolaczyc/`. The teaser section gets a **new id** (e.g. `#rekrutacja`) so `#recruitment` is free for the redirect.
- **D-07:** Nav (`src/_data/navigation.js`) = **Start / O nas (`/#about`) / Operacje (`/operacje/`) / Dołącz (`/jak-dolaczyc/`)**. Galeria and System are dropped from the nav (the gallery stays on home). The header Discord button stays separate. The current page is marked (`aria-current="page"`) on subpages, and scroll-spy keeps working on home for the anchor items.
- **D-08:** **Legacy hash redirects only for removed or mapped anchors.** A small `data-js` module on home redirects mapped hashes with `location.replace`: at least `#recruitment → /jak-dolaczyc/`. The planner checks whether `#hero`/`#gallery` need entries. Anchors that still exist (`#about`, `#gallery`) keep scrolling. It must work under pathPrefix.
- **D-09:** **Home facts are updated to match** (text only, no visual changes). The stat "19:00 Pt/Sob/Ndz" becomes a weekend wording, "Ukończone 16 lat" becomes "Zalecane 16+", and TeamSpeak is mentioned alongside ACRE2. Home and subpages must never contradict each other.

#### Operations page & recaps (CONT-03, CONT-04)
- **D-10:** `/operacje/` gets a **"Najbliższe misje" block** saying upcoming missions are announced on Discord, with the Discord CTA. This is the slot where the bot-fed calendar (ENG-04, v2) will go later. There is **no hand-maintained upcoming list**.
- **D-11:** **3–5 recaps drafted by Claude, every name/date/story marked TODO** (FACTS rows). Build them around the existing screenshots, e.g. "Operacja Crimson Dawn", JO 1967, from `jo_1967.png`. The user replaces them with real ops before the cutover, and G10 blocks the indexable build until then. Mix the confirmed types (PvE, JO, Zeus) and eras.
- **D-12:** A recap is a **card with one photo**: HUD-bordered, a lazy-loaded image through the existing eleventy-img pipeline (it can use the unshipped `patrol.jpg`, `sniper.jpg` and the gallery sources), then a meta line with **date · era/map · type**, a title and 2–3 sentences. Newest first, with a visible "ostatnia aktualizacja" date.
- **D-13:** Schedule, mission types, eras and recaps are stored in **one data file**, `src/_data/operations.js`, following the `gallery.js` pattern.

#### Live Discord badge (CONT-07)
- **D-14:** The badge shows **Discord server size + online**, e.g. "Discord: 246 osób · 94 online", clearly labelled as Discord. The **"20+ aktywnych członków" stat stays** because it counts players in ops. Different labels mean no contradiction.
- **D-15:** It sits **next to the home recruitment teaser's Discord CTA**. Data comes from `GET https://discord.com/api/v10/invites/<code>?with_counts=true`, with the invite code taken from `site.discord.invite` (single source).
- **D-16:** **The fallback number is baked in at build time.** The build fetches the counts once and renders them rounded down (e.g. "200+ osób"). The browser then updates them live with no layout shift, and fails silently (rate limit, offline, JS off). If the build fetch fails, a committed backstop value in `site.js` is used, so the build never breaks because of Discord.

#### Breadcrumbs (SEO-06)
- **D-17:** Both subpages show visible breadcrumbs (Start › Page) and BreadcrumbList JSON-LD with absolute URLs from `site.url` + pathPrefix. Home has no breadcrumbs. The look is Claude's call and stays in HUD style.

### Claude's Discretion
- Exact FAQ question list and wording within D-04. Answers beyond the confirmed facts get TODO.
- Where `/jak-dolaczyc/` content data lives (front matter vs `_data/join.js`/`faq.js`), the breadcrumb markup and styling, the recap card CSS, and the "typowy wieczór" timeline presentation.
- How the build-time Discord fetch is done (global data file with timeout, cached), the backstop number, and the badge module name.
- The exact hash-redirect map beyond `#recruitment`, the new teaser id, and the home teaser wording.
- New gate/test rules (BreadcrumbList validity, FAQ schema matches visible FAQ, nav `aria-current`). Raising perf BUDGET caps only through a reviewed edit, if new CSS/JS needs it.

### Deferred Ideas (OUT OF SCOPE)
- **Bot-fed upcoming missions calendar on `/operacje/`**: ENG-04, v2. It goes in the "Najbliższe misje" slot (D-10). Prefer a bot JSON feed rendered as HTML over an iframe.
- Per-recap pages (ENG-03, v2). Recaps stay in one data file until then.
- **Squad XML as a roster source** (`https://ibc.tacticool.pl/xml/squad.xml`, ~30 members): a candidate input for the v2 `/sklad/` roster next to the bot. It needs opt-in, and no emails or real names may be published (ROST-02/03).
- **Arma 3 Units profile** (`units.arma3.com/unit/ibc`) as an extra footer/`sameAs` link. Phase 2 D-11 locked sameAs to YouTube/Facebook/Discord, so adding it is a reviewed change to `site.social`. Ask the user before adding it.

**Specifics carried from CONTEXT.md (`<specifics>`):** explain "Zeus" in plain words; mention tailored modpacks; squad XML / unit tag may appear in an FAQ answer **only as a TODO**, and no member data may be published from it (ROST-03); the user's friend preferred an iframe calendar, recorded only for v2 (bot JSON rendered as HTML).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONT-01 | `/jak-dolaczyc/` shows requirements and numbered join steps | Pattern 1 (data-driven page), the D-02 join flow maps 1:1 onto an `<ol>`; Pitfall 9 (description required, title unique) |
| CONT-02 | `/jak-dolaczyc/` has a 12–16 question Polish FAQ | Pattern 3 (one `faq` array feeds `<details>` and FAQPage); proposed question list in Code Examples; G12 gate rule; Pitfall 6 (entity decoding) |
| CONT-03 | `/operacje/` shows schedule, mission types, eras and a "typowy wieczór" timeline | Pattern 1, `src/_data/operations.js` shape (D-13); timeline as `<ol>`; times are TODO |
| CONT-04 | `/operacje/` shows 3–5 dated operation recaps | Pattern 6 (recap images through `processImages()`), `<time datetime>` + `Intl.DateTimeFormat('pl-PL', …, timeZone: 'UTC')` (Pitfall 11); every recap is a FACTS row |
| CONT-05 | Nav links to real pages; old `#hash` links redirect | Pattern 4 (nav data + `aria-current`), Pattern 5 (hash-redirect module reading prefixed `href`s); Pitfalls 1, 2, 3 (terminal id, hero CTA, scroll-spy "Start") |
| CONT-06 | Drafted facts are TODO-marked and listed in FACTS.md | Pattern 2 (literal `TODO(FACTS-NN)` string in data files → rendered HTML comment); existing `test/facts.test.js` + G10 already enforce it |
| CONT-07 | Live Discord badge with a static fallback, not contradicting "20+" | Pattern 7 (`lib/discord.js` + `src/_data/discord.js` + `discord-badge` module); Polish plurals (Pitfall 7); offline test builds (Pitfall 5) |
| SEO-06 | Subpages show visible breadcrumbs + BreadcrumbList JSON-LD | Pattern 3 (`buildPageGraph` in `lib/schema.js`), Google BreadcrumbList rules (fetched), new gate rule G11 |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

`.claude/CLAUDE.md` is partly stale (it still says "no build step", "single `js/main.js`", Font Awesome CDN, Google Fonts). The orchestrator confirmed: trust the repo. The directives that still bind:

- **Static output only.** Must stay a static site any host can serve; the user deploys it. A light build step is fine. `[VERIFIED: .claude/CLAUDE.md "Constraints"]`
- **Polish only.** `lang="pl"`, Polish copy. `[VERIFIED: .claude/CLAUDE.md]`
- **Site URL is one config value** (`SITE_URL` → `src/_data/site.js`). `[VERIFIED: src/_data/site.js]`
- **Naming:** camelCase JS functions (verb-first: `init*`, `update*`), kebab-case CSS classes and custom properties, semantic class names. `[VERIFIED: .claude/CLAUDE.md "Conventions"]`
- **Comments:** `/* --- FEATURE NAME --- */` section headers in JS; no JSDoc. `[VERIFIED: .claude/CLAUDE.md]`
- **Error handling:** guard clauses with early return, no console logging, run silently on failure. `[VERIFIED: .claude/CLAUDE.md]` This matches D-16 "fails silently".
- **Semicolons on every JS statement; `const`/`let`, no `var`.** `[VERIFIED: .claude/CLAUDE.md]`
- **GSD workflow enforcement:** edits only through GSD commands (this phase runs through `/gsd-execute-phase`).
- **Current repo patterns that supersede the stale parts** (from STATE.md decisions and the code read this session): client JS reads build-time config from `data-*` attributes and writes text with `textContent`, never `innerHTML`; features load through the frozen `data-js` loader map in `src/js/main.js`; CSS lives in `src/css/partials/*.css` bundled by Lightning CSS; images go through `lib/images.js`; `npm run build` = clean → eleventy → check-seo → check-perf. `[VERIFIED: package.json, src/js/main.js, lib/css.js, lib/images.js]`

## Summary

Phase 4 adds two content pages to an Eleventy 3.1.6 site that already has strong gates (check-seo G0–G10, check-perf P0–P11), a FACTS/TODO pipeline, an image pipeline and a `data-js` module loader. Almost everything needed already exists in the repo. **No new npm packages are needed.** The work is: two data files (`src/_data/operations.js`, plus a `src/_data/join.js` for requirements/steps/FAQ), two page templates with fixed permalinks, JSON-LD builders added to `lib/schema.js`, a nav rewrite through `navigation.js`, two new client modules (`hash-redirect`, `discord-badge`), one build-time data file for Discord counts, and new gate rules plus test updates.

The biggest planning risk is not the new code. It is the **ripple through existing tests and modules**. Renaming `#recruitment` breaks `terminal.js` (it looks the section up by that id). Changing the nav breaks `layout.test.js`, `devpages.test.js`, `seo-files.test.js` and `client.test.js` fixtures. Adding JSON-LD to subpages breaks the schema test "no other page carries JSON-LD". Adding two modules breaks the "five hooks" assertions in `modules.test.js`. The planner should give these updates explicit tasks next to the code changes that cause them, not leave them to "fix tests at the end".

The second risk is the **budgets**. CSS has about 1.16 KB gzip of headroom (3957 of 5120 B) and home JS about 1.2 KB (4857 of 6144 B). Breadcrumbs, FAQ accordion, timeline, recap cards and the badge will use most of the CSS headroom. Measure after the CSS task. Raise `BUDGET.cssGzipMaxBytes` only by a reviewed edit with the new measurement written beside it (the existing convention). The third risk is **network in tests**: a build-time Discord fetch in every one of about 30 test builds would make the suite flaky and hammer Discord. Builds need an offline switch that the test harness sets by default.

**Primary recommendation:** Build both pages as front-matter-only templates over `_data/` files, emit one `@graph` (BreadcrumbList, plus FAQPage on `/jak-dolaczyc/`) from new `lib/schema.js` builders, put draft markers as literal `"TODO(FACTS-NN)"` strings in data fields that templates print as HTML comments, use native `fetch` + `AbortSignal.timeout` (no eleventy-fetch) behind a `DISCORD_FETCH=0` test switch, and add gate rules G11 (BreadcrumbList) and G12 (FAQPage = visible FAQ). Fix the open CR-01 (`lib/reject-output.js`) first, as STATE.md asks.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Join/operations content, FAQ, recaps | Build (Eleventy `_data/` + Nunjucks) | CDN/Static | Content renders to static HTML at build time; crawlable, works with JS off |
| BreadcrumbList / FAQPage JSON-LD | Build (`lib/schema.js` filters) | — | Same data as the visible markup; pure functions, unit-testable |
| Nav current-page marking | Build (`header.njk` compares `item.href` with `page.url`) | Browser (scroll-spy on home only) | `aria-current` must exist with JS off; scroll-spy only highlights home anchors |
| Legacy `#hash` → page redirect | Browser (`hash-redirect` module) | Build (prefixed target `href`) | The fragment never reaches the server, so no static host can redirect it; only client JS can |
| Discord counts fallback | Build (`src/_data/discord.js` → `lib/discord.js`) | Committed backstop in `site.js` | D-16: baked at build time, never breaks the build |
| Discord counts live update | Browser (`discord-badge` module, cross-origin `fetch`) | — | Progressive enhancement; endpoint sends CORS headers (live-tested) |
| Recap images | Build (`lib/images.js` / eleventy-img) | CDN/Static (`img/` variants) | Reuses the Phase 3 pipeline; originals never ship (P8) |
| Draft-fact enforcement | Build gate (G10) + `test/facts.test.js` | — | Indexable build fails while any `TODO` ships |

## Standard Stack

### Core (all already installed; nothing to add)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@11ty/eleventy` | 3.1.6 (`~3.1.6`) | Pages, `_data/` global data, permalinks, `HtmlBasePlugin` | Project SSG since Phase 1 `[VERIFIED: node_modules/@11ty/eleventy/package.json "version": "3.1.6"]` |
| `@11ty/eleventy-img` | 7.0.0 (pinned) | Recap card images (AVIF/WebP/JPEG, srcset, width/height) | Already used for hero/gallery/logo `[VERIFIED: package.json]` |
| `lightningcss` | 1.33.0 (pinned) | Bundles the new CSS partial(s) | Project CSS pipeline `[VERIFIED: package.json]` |
| Nunjucks (via Eleventy) | 3.2.4 | Templates; autoescape on by default | `[VERIFIED: node_modules/nunjucks/package.json]` |
| Node built-ins | Node ≥ 22.19 (`engines`), CI uses `.nvmrc` = 24, local 26.7.0 | `fetch`, `AbortSignal.timeout`, `Intl.DateTimeFormat`, `Intl.PluralRules` | No dependency; full ICU in official Node builds (verified `pl-PL` output locally) |

### Supporting (browser APIs, no packages)
| API | Purpose | When to Use |
|-----|---------|-------------|
| `<details>/<summary>` | FAQ accordion, no JS (D-04) | Every FAQ item |
| `fetch` + `AbortController` | Live Discord counts | `discord-badge` module only |
| `Intl.PluralRules('pl-PL')` | "osoba / osoby / osób" for the live number | Live badge text |
| `IntersectionObserver` | Start the live fetch only when the badge nears the viewport | `discord-badge` (already used by terminal and scroll-spy) |
| `location.replace` | Legacy hash redirect without a history entry | `hash-redirect` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `fetch` + `AbortSignal.timeout` in `lib/discord.js` | `@11ty/eleventy-fetch` 5.1.3 (already in the tree as a transitive dep of eleventy-img) | eleventy-fetch adds a disk cache and stale fallback, but importing a transitive dep is fragile and adding it as a direct dep means a new pin plus `deps.test.js` work. The need here is one GET per process with a backstop, so native fetch plus a module-level memo is enough. |
| `src/_data/join.js` for requirements/steps/FAQ | Front matter in `jak-dolaczyc.njk` | Front matter is YAML (awkward for 14 Polish Q&As with quotes) and can't be imported by `lib/` or unit tests. A `_data/*.js` file matches the `gallery.js` and `operations.js` pattern. |
| One gate rule per JSON-LD type in `lib/check-seo.js` | Tests only | D-05 says "gate/tests"; a gate catches drift on every `npm run build` including CI, a test only on `npm test`. Do both: gate rules G11/G12 plus fixture tests. |

**Installation:** none. `npm ci` is unchanged.

**Version verification:** No package is added. Versions above were read from `package.json` and `node_modules/*/package.json` this session.

## Package Legitimacy Audit

This phase installs **no external packages**. The legitimacy gate does not apply.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| *(none)* | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

If the planner decides to use `@11ty/eleventy-fetch` directly anyway, that is a new direct dependency: it needs the legitimacy check, an exact pin, and a `deps.test.js` assertion. Recommendation: don't.

## Architecture Patterns

### System Architecture Diagram

```
                         BUILD TIME (npm run build / CI / IIS release build)
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │ src/_data/site.js ──(invite URL, url, pathPrefix, discord backstop)──┐           │
 │ src/_data/navigation.js ──(Start, O nas, Operacje, Dołącz)───────┐   │           │
 │ src/_data/join.js ──(requirements, steps, faq[] incl. draft ids)─┼─┐ │           │
 │ src/_data/operations.js ──(schedule, types, eras, evening,       │ │ │           │
 │                            recaps[] incl. draft ids, updated)────┼─┼─┼──┐        │
 │                                                                  │ │ │  │        │
 │ src/_data/discord.js ──► lib/discord.js ──► GET discord.com/api/v10/invites/<code>│
 │      │  DISCORD_FETCH=0? ──yes──► skip network                   │ │ │  │        │
 │      │  ok? ──► floor(count) ; fail/timeout ──► site backstop    │ │ │  │        │
 │      ▼                                                           │ │ │  │        │
 │  { members, label "200+", apiUrl }                               │ │ │  │        │
 │                                                                  ▼ ▼ ▼  ▼        │
 │ lib/images.js processImages() ◄── recaps[].file ─────────── Nunjucks templates  │
 │      (thumb preset → .cache/img → <out>/img)                    index.njk         │
 │                                                                  jak-dolaczyc.njk │
 │ lib/schema.js buildPageGraph(site, url, breadcrumb, faq) ──────► head.njk JSON-LD │
 │                                                                       │           │
 │                                     HtmlBasePlugin prefixes href/src  ▼           │
 │                                                                  _site/*.html     │
 │   check-seo: G1..G10 + G11 BreadcrumbList + G12 FAQ==visible ◄────────┤           │
 │   check-perf: P1..P11 (CSS/JS budgets, lazy imgs, dims) ◄─────────────┘           │
 │   fail ──► move to _site.rejected (fix CR-01 allow-list first)                    │
 └──────────────────────────────────────────────────────────────────────────────────┘

                         RUN TIME (visitor's browser)
 Visitor ──► /#recruitment ──► index.html ──► main.js loader ──► hash-redirect.init
                                                     │   hash in map? ──yes──► location.replace(<prefixed link href>)
                                                     │                 └─no──► normal anchor scroll (#about, #gallery)
                                                     ├──► discord-badge.init ──(badge near viewport)──► fetch apiUrl
                                                     │        ok + integers ──► textContent "246 osób · 108 online"
                                                     │        error/429/offline/JS off ──► baked "200+ osób" stays
                                                     └──► scroll-spy (home anchors only), terminal, menu, lightbox
 Visitor ──► /jak-dolaczyc/ or /operacje/ ──► static HTML (breadcrumbs, <details>, recaps) ── no page-specific JS
```

### Recommended Project Structure
```
src/
├── _data/
│   ├── navigation.js        # EDIT: Start / O nas / Operacje / Dołącz
│   ├── site.js              # EDIT: discord.membersBackstop (committed fallback)
│   ├── join.js              # NEW: requirements[], steps[], faq[] (id, question, answer, draft?)
│   ├── operations.js        # NEW (D-13): schedule, missionTypes[], eras[], evening[], recaps[], updated
│   └── discord.js           # NEW: async global data → lib/discord.js (build-time counts)
├── _includes/partials/
│   ├── head.njk             # EDIT: per-page JSON-LD graph when breadcrumb is set
│   ├── header.njk           # EDIT: aria-current + active-nav on the matching page link
│   └── breadcrumbs.njk      # NEW: visible <nav aria-label> <ol> trail
├── css/partials/
│   └── pages.css            # NEW: breadcrumbs, faq, steps, timeline, recap cards, badge (import before responsive.css)
├── js/modules/
│   ├── hash-redirect.js     # NEW
│   └── discord-badge.js     # NEW
├── js/main.js               # EDIT: two literal loader entries
├── jak-dolaczyc.njk         # NEW: permalink /jak-dolaczyc/
├── operacje.njk             # NEW: permalink /operacje/
└── index.njk                # EDIT: teaser (#rekrutacja), stats wording, badge, hero CTA href
lib/
├── schema.js                # EDIT: buildBreadcrumbList, buildFaqPage, buildPageGraph
├── discord.js               # NEW: inviteCode, inviteApiUrl, floorCount, fetchInviteCounts (pure, injectable fetch)
├── images.js                # EDIT: process operations.recaps[] images
├── check-seo.js             # EDIT: G11, G12
└── reject-output.js         # EDIT FIRST: CR-01 allow-list (_site, _test/**)
test/
├── pages.test.js            # NEW: both pages' content, breadcrumbs, nav aria-current, FAQ count 12–16
├── discord.test.js          # NEW: lib/discord.js units + badge module stub-DOM tests
└── (updates) layout, devpages, seo-files, client, modules, schema, seo-gate, css, facts helpers
FACTS.md                     # EDIT: FACTS-03.. rows + document the data-file marker form
```

### Pattern 1: Data-driven content page (front matter + `_data/`)
**What:** The page template holds structure only. All copy lives in a `_data/*.js` file that is an ES module `export default`, exactly like `src/_data/gallery.js`.
**When to use:** Both new pages. Required for FAQ (one source for `<details>` and FAQPage, D-05) and for recaps (one source for cards and `processImages()`, like gallery).
**Example (page front matter):**
```njk
---
layout: layouts/base.njk
title: "Jak dołączyć do klanu Arma 3 – rekrutacja"
description: "<drafted, ≤ 160 chars>"
permalink: /jak-dolaczyc/
breadcrumb: "Jak dołączyć"
todo: "FACTS-03"
---
{% include "partials/breadcrumbs.njk" %}
<section class="section-container"> … <h1> … </section>
```
Notes:
- `layouts/base.njk` already supplies head/header/footer/main. `title` gets " | IBC" automatically (Phase 2 D-02). `description` is mandatory on indexable pages: G4 fails without it (Phase 2 D-04). `[VERIFIED: src/_includes/partials/head.njk; lib/check-seo.js checkDescription]`
- `todo: "FACTS-NN"` in front matter already renders `<!-- TODO(FACTS-NN) -->` via head.njk, so it fits a drafted `description`. `[VERIFIED: head.njk line "{% if todo %}{% for id in ([todo] if todo is string else todo) %}<!-- TODO({{ id }}) -->{% endfor %}{% endif -%}"]`
- `page.url` for these is `"/jak-dolaczyc/"` / `"/operacje/"`. `isIndexableUrl` returns true (ends with `/`, not 404, not `/_dev/`), so the sitemap picks them up with no change. `[VERIFIED: lib/seo.js isIndexableUrl; src/sitemap.xml.njk]`
- Exactly one `<h1>` per page (the 404 page uses `<h1>` inside `.section-header`; copy that).

### Pattern 2: Draft markers inside data files (CONT-06)
**What:** A data entry carries its marker as a **literal string field**, and the template prints it as an HTML comment next to the text.
```js
// src/_data/operations.js (shape; values are drafts)
recaps: [
  {
    draft: "TODO(FACTS-10)",
    file: "jo_1967.png",
    date: "2026-09-19",        // drafted, confirm
    title: "Operacja Crimson Dawn",
    era: "Wietnam 1967",
    type: "Joint Operations",
    text: "…",
    alt: "…",
  },
]
```
```njk
{% for r in images.recaps %}
<article class="recap-card hud-border">{% if r.draft %}<!-- {{ r.draft }} -->{% endif %}
  …
</article>
{% endfor %}
```
**Why this exact form:** `test/facts.test.js` finds source markers with the regex `\bTODO\((FACTS-\d+)\)` across every `.njk/.md/.html/.js/.css/.json` file under `src/`, and then requires each ID to reach the output HTML. `[VERIFIED: test/facts.test.js:117 "matchAll(/TODO\((FACTS-\d+)\)/g)"]` A data field `todo: "FACTS-10"` would **not** be found (front-matter parsing applies only to `---` blocks), so the "every open row has a marker" test would fail. A JS comment `// TODO(FACTS-10)` would be found in source but never reach the output, so "every source marker reaches the build output" would fail. The literal-string field passes both, and its template line contains no bare `TODO` word, so the "untracked TODO" test (`\bTODO\b(?!\(FACTS-\d+\))`) stays green. The user confirms by deleting the `draft:` line and flipping the FACTS.md row to `potwierdzone`.
**Never** put the marker inside `question`/`answer`/`text`: it would leak into FAQPage JSON-LD and visible text.
**Update FACTS.md "Znaczniki"** to document this third form (data-file field `draft: "TODO(FACTS-NN)"`).

### Pattern 3: Page JSON-LD from the same data (SEO-06, D-05)
**What:** Extend `lib/schema.js` with pure builders and render one `<script type="application/ld+json">` per subpage through the existing `jsonLd` filter (it escapes `<`).
```js
// lib/schema.js (add; site = src/_data/site.js)
// trail: [{ name, url }] with root-relative page.url values ("/", "/jak-dolaczyc/").
export function buildBreadcrumbList(site, trail) {
  const base = site.url + site.pathPrefix; // same base the canonical uses
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: base + crumb.url.slice(1),
    })),
  };
}

export function buildFaqPage(faq) {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

export function buildPageGraph(site, { url, breadcrumb, faq }) {
  const graph = [buildBreadcrumbList(site, [{ name: "Start", url: "/" }, { name: breadcrumb, url }])];
  if (faq) graph.push(buildFaqPage(faq));
  return { "@context": "https://schema.org", "@graph": graph };
}
```
```njk
{# head.njk, next to the home block #}
{% if breadcrumb %}<script type="application/ld+json">{{ site | pageGraph({ url: page.url, breadcrumb: breadcrumb, faq: (join.faq if faqSchema else null) }) | jsonLd | safe }}</script>{% endif %}
```
- Google: `itemListElement` is required; `ListItem` needs `position`, `name`, `item`; "If the breadcrumb is the last item in the breadcrumb trail, `item` is not required." `[CITED: developers.google.com/search/docs/appearance/structured-data/breadcrumb]` Including `item` on the last crumb too (equal to the canonical) is valid and simpler to gate.
- `site.url` has no trailing slash and `pathPrefix` is `"/"` or `"/<seg>/"`, so `site.url + site.pathPrefix + url.slice(1)` equals the canonical that `head.njk` builds with `page.url | htmlBaseUrl(site.url)`. `[VERIFIED: src/_data/site.js "url, // no trailing slash; absolute URLs = url + pathPrefix + page path"; lib/check-seo.js checkSite "absolute: base + url.slice(1)"]`
- FAQPage is a WebPage subtype; `acceptedAnswer` expects `Answer` or `ItemList`. `[CITED: schema.org/FAQPage, schema.org/Question]` Google removed FAQ rich results (2026), so this is for validity only. `[CITED: .planning/research/PITFALLS.md Pitfall 3, Google FAQPage deprecation notice]`
- Keep answers **plain text** (no HTML/links) so the visible text and `Answer.text` are byte-identical before escaping. A Discord link can sit outside the accordion (page CTA).
- G5 still runs: it parses every block and bans `Event`/`SportsTeam` at any depth; FAQPage/BreadcrumbList pass. `[VERIFIED: lib/check-seo.js "const forbiddenJsonLdTypes = [\"Event\", \"SportsTeam\"];"]`

### Pattern 4: Data-driven nav with build-time current page (CONT-05, D-07)
```js
// src/_data/navigation.js
export default [
  { label: "Start", href: "/#hero" },
  { label: "O nas", href: "/#about" },
  { label: "Operacje", href: "/operacje/" },
  { label: "Dołącz", href: "/jak-dolaczyc/" },
];
```
```njk
{# header.njk #}
<li><a href="{{ item.href }}"{% if page.url == "/" and loop.first %} class="active-nav"{% elif item.href == page.url %} class="active-nav" aria-current="page"{% endif %}>{{ item.label }}</a></li>
```
- **Use `/#hero` for "Start", not `/`.** `scroll-spy.js` only manages links that have a hash and the same pathname: `.filter(link => link.hash && link.pathname === window.location.pathname)`. `[VERIFIED: src/js/modules/scroll-spy.js]` With a hash-less `"/"`, the server-rendered `active-nav` on Start would never be removed, so Start and "O nas" would both light up after scrolling. `/#hero` keeps every existing scroll-spy test valid (`"scroll-spy maps the fixed header to #hero"`), matches the logo link (`href="/#hero"` in header.njk), and still lands at the top from subpages. `#hero` exists on home, so it needs no redirect entry.
- `item.href == page.url` works because nav hrefs are unprefixed and `page.url` is unprefixed; `HtmlBasePlugin` adds the prefix to the output `href` afterwards. `[VERIFIED: eleventy.config.js "Rewrites root-relative href/src/srcset with pathPrefix"]`
- Footer reuses `navigation`. Marking `aria-current` in the footer too is optional. If you do, use the same condition.

### Pattern 5: Legacy hash redirect module (D-08)
**What:** A `data-js="hash-redirect"` hook on home. The redirect target is a **real link's prefixed `href`**, so pathPrefix is handled by `HtmlBasePlugin` and no URL is built from the hash.
```njk
{# index.njk teaser #}
<section id="rekrutacja" class="recruitment" data-js="hash-redirect">
  …
  <a href="/jak-dolaczyc/" class="hud-btn" data-legacy-hash="recruitment">Pełna instrukcja →</a>
```
```js
/* --- LEGACY HASH REDIRECT --- */
// Hook: data-js="hash-redirect". Links with data-legacy-hash="<old id>" are the only targets.
export function init(el) {
  if (!el) return;
  const links = Array.from(el.querySelectorAll('a[data-legacy-hash]'));
  if (links.length === 0) return;

  const redirect = () => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const link = links.find(candidate => candidate.getAttribute('data-legacy-hash') === hash);
    if (link) window.location.replace(link.href);
  };

  redirect();
  window.addEventListener('hashchange', redirect);
}
```
- Map = `#recruitment → /jak-dolaczyc/` only. Historical index.html ids across all git history are exactly `hero, about, gallery, recruitment` (+ modal ids). `hero`, `about`, `gallery` still exist on home, so they need no entry. `[VERIFIED: git show <each commit>:index.html | grep id= — commits fe18130, 63f2ad5]`
- `link.href` (property) is the absolute resolved URL, already including the prefix. Compare the hash with `===` against the attribute, never build a selector from `location.hash` (selector injection) and never put the hash into a URL (open redirect).
- Module JS runs after parsing (deferred module), so there's a brief flash of home before the redirect. That's acceptable. An inline head script would be faster but breaks the "every page has exactly one script with a src" / module-only pattern.

### Pattern 6: Recap images through the existing pipeline (D-12)
**What:** `lib/images.js` imports `operations.js` the same way it imports `gallery.js`, and processes each `recaps[].file` with the existing `thumb` preset (widths 400/600/900/1200, AVIF/WebP/JPEG). It returns `images.recaps = recaps.map(r => ({ ...r, img }))` and adds the variant paths to `files`.
```njk
{% picture r.img, { "alt": r.alt, "loading": "lazy", "decoding": "async", "sizes": "auto, (min-width: 1240px) 380px, (min-width: 660px) 50vw, 100vw" } %}
```
- P6 needs numeric `width`/`height` (eleventy-img's `generateHTML` provides them) and P7 needs `loading="lazy"` on every non-hero `<img>`. `[VERIFIED: lib/check-perf.js checkImages]`
- `jo_1967.png` is used by both the gallery and a recap. The same preset dedupes in eleventy-img's cache, and `files` is a `Set`. Using `patrol.jpg`/`sniper.jpg` also resolves review item IN-05 (unused originals).
- The `{% picture %}` shortcode is synchronous on purpose (async shortcodes break inside `{% for %}`). Keep using pre-computed metadata from global `images`. `[VERIFIED: eleventy.config.js comment "Sync on purpose (D-01)"]`

### Pattern 7: Build-time Discord counts + live badge (CONT-07, D-14..D-16)
**Build side:**
```js
// lib/discord.js (pure; fetchImpl injectable for tests)
export function inviteCode(invite) {
  const code = new URL(invite).pathname.split('/').filter(Boolean).pop() || '';
  if (!/^[A-Za-z0-9-]+$/.test(code)) throw new Error(`site.discord.invite has no invite code: ${invite}`);
  return code;
}
export const inviteApiUrl = (invite) =>
  `https://discord.com/api/v10/invites/${inviteCode(invite)}?with_counts=true`;

// 246 -> 200, 87 -> 80 (D-16 example: "200+ osób")
export const floorCount = (n) => (n >= 100 ? Math.floor(n / 50) * 50 : Math.floor(n / 10) * 10);

export async function fetchInviteCounts(invite, { fetchImpl = fetch, timeoutMs = 5000 } = {}) {
  try {
    const response = await fetchImpl(inviteApiUrl(invite), { signal: AbortSignal.timeout(timeoutMs), headers: { accept: 'application/json' } });
    if (!response.ok) return null;
    const body = await response.json();
    const members = body.approximate_member_count;
    const online = body.approximate_presence_count;
    if (!Number.isInteger(members) || members < 0) return null;
    return { members, online: Number.isInteger(online) && online >= 0 ? online : null };
  } catch {
    return null;
  }
}
```
```js
// src/_data/discord.js (async global data; one fetch per process via memo in lib/discord.js)
import site from "./site.js";
import { fetchInviteCounts, floorCount, inviteApiUrl } from "../../lib/discord.js";
export default async function () {
  const live = process.env.DISCORD_FETCH === "0" ? null : await fetchInviteCounts(site.discord.invite);
  const members = live ? live.members : site.discord.membersBackstop;
  return { apiUrl: inviteApiUrl(site.discord.invite), fallbackLabel: `${floorCount(members)}+` };
}
```
- Eleventy awaits an `export default async function` data file. `[CITED: 11ty.dev/docs/data-js/]`
- **Endpoint facts (live-tested this session):** `GET https://discord.com/api/v10/invites/DhJwkeehJK?with_counts=true` → HTTP 200, `approximate_member_count` 246, `approximate_presence_count` 107–108, `expires_at` null; with `Origin: https://example.org` the response carries `access-control-allow-origin: https://example.org`; an unknown code → 404 `{"message": "Unknown Invite", "code": 10006}`. Node `fetch` + `AbortSignal.timeout(5000)` works. `[VERIFIED: curl + node fetch this session]` Docs: `with_counts` → "whether the invite should contain approximate member counts"; `approximate_presence_count` = "approximate count of online members". `[CITED: docs.discord.com/developers/resources/invite]`
- The response also contains `inviter` and `guild` details. **Read only the two count fields**; never render anything else.
- Show **members only** in the baked fallback ("Discord: 200+ osób"). A baked online number goes stale within minutes and would be the kind of misleading figure FEATURES.md warns about. The live update adds "· 108 online".

**Client side (`discord-badge` module):**
```njk
<p class="discord-badge" data-js="discord-badge" data-api-url="{{ discord.apiUrl }}">
  Discord: <span class="discord-badge-members">{{ discord.fallbackLabel }} osób</span><span class="discord-badge-online"></span>
</p>
```
```js
/* --- LIVE DISCORD BADGE --- */
// Hook: data-js="discord-badge". Fetches only data-api-url (a discord.com API URL rendered at build time).
export function init(el) {
  if (!el) return;
  const apiUrl = el.getAttribute('data-api-url') || '';
  const membersEl = el.querySelector('.discord-badge-members');
  const onlineEl = el.querySelector('.discord-badge-online');
  if (!apiUrl.startsWith('https://discord.com/api/') || !membersEl || !onlineEl) return;

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    updateBadge(apiUrl, membersEl, onlineEl);
  }, { rootMargin: '200px' });
  observer.observe(el);
}

function updateBadge(apiUrl, membersEl, onlineEl) {
  fetch(apiUrl, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(5000) })
    .then(response => (response.ok ? response.json() : null))
    .then(body => {
      if (!body) return;
      const members = body.approximate_member_count;
      const online = body.approximate_presence_count;
      if (!Number.isInteger(members) || members < 0) return;
      membersEl.textContent = members + ' ' + personWord(members);
      if (Number.isInteger(online) && online >= 0) onlineEl.textContent = ' · ' + online + ' online';
    })
    .catch(() => {});
}

function personWord(n) {
  const form = new Intl.PluralRules('pl-PL').select(n);
  if (form === 'one') return 'osoba';
  if (form === 'few') return 'osoby';
  return 'osób';
}
```
- No layout shift: `white-space: nowrap`, fixed line height, left-aligned, last element in its block, so a wider text never moves a sibling (CLS counts moved boxes, not changed text in a box with nothing after it).
- Invite single source: the invite literal stays only in `site.js`. `discord.com/api/v10/invites/…` does not match the links-test invite pattern `discord(?:\.gg|(?:app)?\.com\/invite)\/…` (that needs `discord.com/invite/` directly), so tests (g)/(h) stay green. `[VERIFIED: test/links.test.js "(g) invite defined once"]` Still, keep the API host string in `lib/discord.js` only.

### Anti-Patterns to Avoid
- **Hand-maintained "upcoming ops" list:** out of scope (REQUIREMENTS Out of Scope; D-10). The "Najbliższe misje" block points to Discord only.
- **Event JSON-LD for recaps or schedule:** banned by G5 and REQUIREMENTS.
- **Discord widget iframe:** out of scope (widget disabled, heavy).
- **`innerHTML` for badge or redirect:** violates the project rule and opens XSS from a third-party response.
- **Building the redirect URL from `location.hash`:** open-redirect / selector-injection risk. Look up a fixed link instead.
- **Publishing squad.xml member data:** ROST-03. An FAQ may mention the unit tag only as a TODO.
- **Baking the build date as "ostatnia aktualizacja":** every rebuild would claim freshness. Use a manual `updated` field in `operations.js` (drafted, TODO).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accordion | JS toggle, ARIA wiring | `<details>/<summary>` | Native keyboard/AT support, works with JS off, crawlable (D-04) |
| Responsive recap images | `<img>` with manual srcset | `processImages()` + `{% picture %}` | Already tuned presets, P1/P6/P7/P8 compliance |
| Polish plural forms | `n % 10` rules | `Intl.PluralRules('pl-PL')` | Verified this session: 22 → few, 25 → many, 12 → many, 1 → one |
| Polish dates | Month-name arrays | `Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })` | Verified: "20 września 2026", "7 marca 2026" |
| Absolute URLs | String concatenation per template | `site.url + site.pathPrefix + url.slice(1)` in `lib/schema.js`, `htmlBaseUrl` in templates | Same formula as canonical and the gate |
| JSON-LD escaping | Manual escaping | Existing `jsonLd` filter (`<` → `<`) | Already unit-tested |
| Path prefix in JS | Reading `site.pathPrefix` in the browser | Prefixed `href` rendered by `HtmlBasePlugin`, read via `link.href` | Single source; works at root and under `/IBC-Website/` |
| Fetch timeout | `setTimeout` + flags | `AbortSignal.timeout(ms)` | Built-in in Node ≥ 17.3 and evergreen browsers |

**Key insight:** every hard part of this phase already has a home in the repo (image pipeline, gates, FACTS process, loader map, schema builders). New code should be thin glue in the same shape, so the existing tests and gates keep policing it.

## Runtime State Inventory

This phase renames a public anchor (`#recruitment` → new teaser id) and changes the nav. That is partly a migration, so:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None. The site has no datastore. | None |
| Live service config | Links to `…/#recruitment` (and `/#hero`, `/#about`, `/#gallery`) can live in Discord channel messages, Steam posts and bookmarks outside git. | Code: the `hash-redirect` module covers `#recruitment`; the other three ids stay on home. No external edit needed. |
| OS-registered state | None. Static files, no scheduled tasks or services. | None |
| Secrets / env vars | No secrets. New optional env var `DISCORD_FETCH` (build switch). | Add it to `buildEnvKeys` in `test/helpers.js` and default it to `"0"` in test builds; document it in README. |
| Build artifacts / caches | Returning visitors' browsers cache `/js/main.js` and modules **without a version** (review WR-01). A stale `main.js` has no `hash-redirect`/`discord-badge` loader, and a stale `terminal.js` looks up `#recruitment` and silently no-ops. | Recommended: fix WR-01 (version `main.js` and module URLs like the CSS `?v=`) in this phase, because Phase 4 changes the JS contract. At minimum, record the risk. |

## Common Pitfalls

### Pitfall 1: Renaming `#recruitment` silently kills the terminal
**What goes wrong:** The terminal never boots on home.
**Why it happens:** `terminal.js` finds the section by the old id: `const recSection = document.getElementById('recruitment');` `[VERIFIED: src/js/modules/terminal.js:7]`. With `id="rekrutacja"` it returns null and `init` returns early. No error, by design.
**How to avoid:** Observe `el.closest('section')` (or the new id). Update the `client.test.js` stub (`getElementById(id) { if (id === "recruitment") … }`) and `layout.test.js` needles `'id="recruitment"'` and the gallery slice `prefixHtml.indexOf('id="recruitment"')`.
**Warning signs:** Empty terminal in the browser; client tests still pass if only the stub is kept.

### Pitfall 2: In-page links that still point at `#recruitment`
**What goes wrong:** The hero button "Złóż podanie" (`href="#recruitment"`) now triggers a redirect hop or goes nowhere.
**How to avoid:** Point it at `/jak-dolaczyc/` (an apply button should go to the instructions) or at `#rekrutacja`. Grep `src/` for `recruitment"` / `#recruitment` after the change; only the `data-legacy-hash="recruitment"` attribute should remain.

### Pitfall 3: "Start" link and scroll-spy fight
**What goes wrong:** Two nav items highlighted on home.
**Why:** scroll-spy only manages hash links (Pattern 4). **How to avoid:** `href: "/#hero"` for Start.

### Pitfall 4: Existing tests pinned to the old nav, copy and hook count
Update these in the same task that changes the code (each was read this session):
| File | Pinned value (verbatim) | Change |
|------|------------------------|--------|
| `test/layout.test.js:10-11` | `const navLabels = ["System", "O nas", "Galeria", "Rekrutacja"];` / `const navHrefs = ["/#hero", "/#about", "/#gallery", "/#recruitment"];` | New labels/hrefs |
| `test/layout.test.js` `polishCopy` | `"Ukończone 16 lat."`, `"19:00"`, `"Wymagania wstępne"`, `"Instrukcja Zaciągu"` | Match the new teaser copy (D-09) |
| `test/layout.test.js` | `inviteHrefs.length >= 3` ("header CTA, terminal button and footer icon") | Keep the teaser Discord button |
| `test/devpages.test.js:13` | `const navLabels = ["System", "O nas", "Galeria", "Rekrutacja"];` | New labels |
| `test/devpages.test.js`, `test/seo-files.test.js` | header byte-equality via `homeHeader.replace(activeNav, "")` with `const activeNav = ' class="active-nav"';` | Still holds for 404/dev pages if home carries only `class="active-nav"` (no `aria-current` on home). Subpage headers differ by design, so don't add them to these comparisons |
| `test/modules.test.js:14` | `const hookNames = ["menu", "scroll-spy", "lightbox", "terminal", "easter-egg"];` and the test "main.js maps all five hooks" (`imports.length === hookNames.length`) and "index.html has exactly one hook for each feature" | Add `hash-redirect`, `discord-badge` |
| `test/schema.test.js` | test "no other page carries JSON-LD" | Subpages carry BreadcrumbList (+FAQPage); 404/dev still carry none |
| `test/client.test.js` | `const sectionIds = ["hero", "about", "gallery", "recruitment"];` | New teaser id |
| `test/css.test.js:178` | `const partialOrder = ["fonts", "base", "components", "header", "hero", "sections", "gallery", "recruitment", "footer", "responsive"];` | Insert the new partial name |
| `test/icons.test.js` | recruitment button text `"Wejdź na Discord"` with `iconClass: "icon icon-discord recruitment-cta-icon"` | Keep or update with the teaser |

### Pitfall 5: Network in tests and CI
**What goes wrong:** Every test build (about 30 per `npm test`) calls Discord. Flaky failures, slow suite, possible rate limiting; nondeterministic HTML.
**How to avoid:** `DISCORD_FETCH=0` skips the network. In `test/helpers.js`, add `"DISCORD_FETCH"` to `buildEnvKeys` and default `DISCORD_FETCH: "0"` in `runBuild` unless the variant sets it. Unit-test `fetchInviteCounts` with a stub `fetchImpl` (200 ok, 404, non-integer counts, thrown error, timeout via `AbortSignal`). The real `npm run build` (CI, IIS) fetches; any failure falls back to the backstop and never throws.

### Pitfall 6: Comparing visible FAQ text with JSON-LD text
**What goes wrong:** G12/tests report mismatches for `"`, `'`, `&`.
**Why:** Nunjucks autoescape: `'&': '&amp;'`, `'"': '&quot;'`, `'\'': '&#39;'`, `'<': '&lt;'`, `'>': '&gt;'`, `'\\': '&#92;'` `[VERIFIED: node_modules/nunjucks/src/lib.js:5-12]`, while `JSON.stringify` leaves them as is.
**How to avoid:** In the gate, strip tags, decode exactly those six entities (plus numeric `&#NN;`), collapse whitespace, then compare with the JSON-LD strings. Keep answers plain text. Polish typographic quotes „ ” are not escaped, so prefer them.

### Pitfall 7: Polish plurals in the live badge
"246 osób" but "242 osoby" and "1 osoba". The baked "200+ osób" is always genitive plural and correct. Use `Intl.PluralRules` (verified: 242 → few, 246 → many).

### Pitfall 8: Budgets
- CSS: `cssGzipMaxBytes: 5120, // measured 3957 B on 2026-10-11 (03-11), cap = measured + 25 %` `[VERIFIED: lib/check-perf.js:37]` gives about 1163 B of headroom. One bundle serves every page, so the new page CSS counts on home too.
- JS: `initialJsGzipMaxBytes: 6144, // measured 4857 B on 2026-10-11 (03-11), cap = measured + 25 %` `[VERIFIED: lib/check-perf.js:39]`. Home loads `main.js` plus each hook's module, each gzipped separately. Today: main 678, menu 411, scroll-spy 568, terminal 1149, lightbox 1215, easter-egg 889 B gzip (measured from `_site/` this session). Two new modules of about 400–600 B gzip each fit. Comments ship unminified, so keep module comments short.
- If a cap must rise, edit `BUDGET` only, with the new measurement and date in the comment (03-11 convention; CONTEXT discretion).

### Pitfall 9: SEO gate requirements for new pages
Each indexable page needs exactly one non-empty `<title>` unique across pages (G1), a canonical equal to `base + url` (G2, automatic), share tags (G3, automatic with the default 1200×630 OG image), a non-empty `description` (G4), and a sitemap entry (G7, automatic). `[VERIFIED: lib/check-seo.js]`

### Pitfall 10: G10 scans shipped JS and CSS too
`const textExts = [".html", ".xml", ".txt", ".webmanifest", ".config", ".css", ".js", ".json"];` and the regex `\bTODO\b(?:\([^)\s]*\))?` `[VERIFIED: lib/check-seo.js:218 and checkTodoMarkers]`. Any word "TODO" in a comment in `src/js/modules/*.js` or a CSS partial fails the indexable build, and `test/facts.test.js` fails it in `npm test` too. Never write "TODO" in shipped code.

### Pitfall 11: Recap dates off by one
`new Date("2026-09-20")` is UTC midnight, and formatting it in a local timezone west of UTC prints the 19th. Always format with `timeZone: 'UTC'`, and emit `<time datetime="2026-09-20">`. Do the formatting at build time (a Nunjucks filter or a precomputed field), not in the browser.

### Pitfall 12: Breadcrumb markup colliding with header CSS/JS
`header.css` styles `nav ul`, `nav ul li a`, and `menu.js` uses `document.querySelector('nav ul')` and `'nav ul li a'`. `[VERIFIED: src/css/partials/header.css:60-92; src/js/modules/menu.js]` A breadcrumb `<nav><ul>` would inherit header nav styles and could become the menu's target. Use `<nav class="breadcrumbs" aria-label="Ścieżka nawigacji"><ol>…</ol></nav>` (an `ol`, as the WAI breadcrumb pattern suggests anyway).

### Pitfall 13: Every CSS class must be used, and dead ones removed
`test/css.test.js` "every class selector in the bundle is used by a template or script". Trimming the teaser may orphan `.recruitment-steps`, `.recruitment-lead` and so on. Delete their CSS in the same task, or keep them used.

### Pitfall 14: CR-01 is still open
`lib/reject-output.js` can move or delete a source folder when `--dir` is mistyped (review CR-01, critical). STATE.md says to fix it "before Phase 4". Make it task 1 (allow-list `_site` and `_test/**`, plus tests for `--dir src` and `--dir .git`).

### Pitfall 15: Two `aria-current="page"` on a subpage
The nav link and the breadcrumb's last item both carry it. That is the documented WAI-ARIA breadcrumb pattern and is fine. Don't "fix" it by dropping one.

## Code Examples

### Breadcrumb partial
```njk
{# partials/breadcrumbs.njk — rendered only when front matter has breadcrumb #}
<nav class="breadcrumbs" aria-label="Ścieżka nawigacji">
  <ol>
    <li><a href="/">Start</a></li>
    <li><a href="{{ page.url }}" aria-current="page">{{ breadcrumb }}</a></li>
  </ol>
</nav>
```
CSS separator: `.breadcrumbs li + li::before { content: "›"; }`. Place it inside `<main>` (the layout's `{{ content }}`), above the `<h1>`, with top spacing that clears the fixed header (sections use `section { padding: 100px 20px; }` `[VERIFIED: src/css/partials/sections.css]`).

### FAQ accordion from data
```njk
<div class="faq-list">
  {% for item in join.faq %}
  <details class="faq-item hud-border" id="{{ item.id }}">{% if item.draft %}<!-- {{ item.draft }} -->{% endif %}
    <summary>{{ item.question }}</summary>
    <p>{{ item.answer }}</p>
  </details>
  {% endfor %}
</div>
```
`id` lets a recruiter link `…/jak-dolaczyc/#mody` from Discord (FEATURES.md). Keep ids ASCII kebab-case.

### Proposed FAQ list (14 questions; source per D-02)
| id | Question | Source |
|----|----------|--------|
| `wiek` | Ile trzeba mieć lat, żeby dołączyć? | Confirmed (Zalecane 16+, maturity) |
| `doswiadczenie` | Czy muszę mieć doświadczenie w Arma 3? | Derived from "basic training 2–3.5 h for someone who just bought Arma 3", but the "no experience needed" wording is a claim → TODO |
| `rekrutacja` | Jak wygląda rekrutacja krok po kroku? | Confirmed (join flow) |
| `szkolenie` | Ile trwa rozmowa i szkolenie podstawowe? | Confirmed (15–20 min; 2–3.5 h) |
| `kiedy-gracie` | Kiedy gracie i ile trwa misja? | Confirmed (weekends 19:00, 2–3 h) |
| `obecnosc` | Czy muszę być na każdej misji? | **Not confirmed** → TODO |
| `styl-gry` | Jaki styl gry macie: milsim czy luźna gra? | Confirmed (casual milsim, no RP, follow orders) |
| `mody` | Ile miejsca zajmują mody i skąd je pobrać? | Confirmed (ok. 90 GB, ~55 mods, Steam Workshop, preset on Discord) |
| `modpack-misji` | Czy każda misja ma ten sam modpack? | Confirmed (standard pack; missions may have their own) |
| `dlc` | Czy potrzebuję DLC? | Confirmed (no CDLC; nice for Vietnam; compat data shows ads) |
| `radio` | Czy potrzebuję mikrofonu i TeamSpeaka? Jakie radio? | Confirmed (TS + ACRE2, TFAR in some JOs); microphone from existing home copy |
| `zeus` | Czym są gry Zeusowe? | Confirmed (on the fly, modern, announced same day) |
| `jo` | Czym są Joint Operations (JO/JOP)? | Confirmed (with Polish and foreign clans) |
| `epoki` | W jakich epokach i scenariuszach gracie? | Confirmed (modern, Vietnam, Cold War, sometimes WW2, 40k, post-apo) |
| `po-szkoleniu` | Co dalej po szkoleniu podstawowym? | Confirmed (auto Klanowicz, specializations); a list of specializations would be TODO |

Optional (all TODO): "Czy są jakieś opłaty?", "Czy mogę grać też w innym klanie?", squad XML / unit tag (TODO only, per CONTEXT specifics).

### `operations.js` shape (D-13)
```js
export default {
  updated: "2026-10-11",            // drafted "ostatnia aktualizacja"; TODO until the user sets it
  schedule: { … },                  // confirmed: weekends 19:00, 2–3 h; Zeus same-day
  missionTypes: [ … ],              // confirmed: PvE, JO/JOP, Zeus
  eras: [ … ],                      // confirmed list
  evening: [                        // confirmed order; times are TODO
    { step: "Sloty", time: null }, { step: "Odprawa (briefing)" }, { step: "Misja" },
    { step: "Debriefing (feedback dla MM)" }, { step: "Przegląd OCAP" },
  ],
  recaps: [ /* 3–5, newest first, each with draft: "TODO(FACTS-NN)" */ ],
};
```
OCAP explained in plain Polish ("nagranie przebiegu misji, które oglądamy po grze") is Claude's wording → TODO. `[ASSUMED: OCAP = "Operation Capture And Playback", a web replay of a mission]`

### Gate rule sketches (lib/check-seo.js)
- **G11 (SEO-06):** for every indexable page except `index.html`: exactly one BreadcrumbList node in its JSON-LD; `itemListElement` length ≥ 2; positions `1..n` in order; every `name` a non-empty string; every `item` absolute and starting with `base`; first `item === base`; last `item ===` the page canonical; the page has a visible `<nav class="breadcrumbs"` (or `aria-label="Ścieżka nawigacji"`) whose link texts equal the names. `index.html` must have **no** BreadcrumbList (D-17).
- **G12 (D-05):** on any page with a FAQPage node: `mainEntity` non-empty; each Question has a non-empty `name` and `acceptedAnswer.text`; the list of `name`s equals the visible `<summary>` texts in order, and the answers equal the visible answer texts (after Pitfall 6 decoding).
- Add one fixture per broken case in `test/seo-gate.test.js` (its `writeFixture` + `homeGraph` helpers exist), matching the Phase 2/3 "one fixture per rule" style.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FAQPage markup for SERP accordions | Visible FAQ for people and AI answers; FAQPage optional, no rich result | FAQ rich results stopped May 2026, docs removed June 2026 `[CITED: .planning/research/PITFALLS.md sources]` | Emit it for validity (D-05), never design around it |
| Breadcrumb rich results on mobile | Desktop only; markup still supported | Jan 2025 `[CITED: PITFALLS.md sources]` | Cheap to add; low SEO value on a 3-page site |
| Discord widget iframe / `widget.json` | Invite endpoint `?with_counts=true` | Widget disabled on IBC guild (FEATURES.md) | Only usable live source without a bot |
| `@11ty/eleventy-fetch` for every remote call | Native `fetch` + `AbortSignal.timeout` for a single tiny call | Node 18+ | No extra dependency |

**Deprecated/outdated:** `.claude/CLAUDE.md` stack section (no build step, Font Awesome, Google Fonts). The repo superseded it in Phases 1–3.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | OCAP means "Operation Capture And Playback", a browser replay of the mission | Code Examples (operations.js) | Wrong explanation in copy; it's TODO-marked anyway, so the user catches it |
| A2 | Discord does not rate-limit ordinary visitors' single GET on the invite endpoint in practice (no `X-RateLimit-*` headers were returned in this session's test) | Pattern 7 | Some visitors see only the fallback; silent by design |
| A3 | A cross-origin fetch failure (e.g. a 429 without CORS headers) logs a console error that Lighthouse "Best Practices" may count | Pattern 7 / Validation | Possible small Best Practices deduction in Phase 5 PERF-08; mitigated by fetching only when the badge is near the viewport |
| A4 | Rounding the fallback to the nearest lower 50 (≥ 100) / 10 (< 100) is what the user meant by "200+ osób" | Pattern 7 | Cosmetic; one constant to change |
| A5 | Chrome auto-opens a closed `<details>` when the URL fragment targets it (`#mody`); other browsers may only scroll to it | Code Examples (FAQ) | Recruiter deep links scroll but don't expand in some browsers; no JS planned for this |
| A6 | The hero "Złóż podanie" button should point to `/jak-dolaczyc/` | Pitfall 2 | Copy/UX preference; `#rekrutacja` also works |

## Open Questions

1. **Is a UI-SPEC needed before planning?** `workflow.ui_phase` is `true` and the phase has a UI hint, but Phase 5 owns the visual refresh (UI-01). Recommendation: no full `/gsd-ui-phase`. The planner reuses existing HUD primitives (`.hud-border`, `.hud-btn`, `.section-header`, `.req-list`) and adds one small `pages.css` partial. If the orchestrator's flow insists on a UI-SPEC, keep it minimal (layout of 2 pages only).
2. **Fix WR-01 (unversioned JS) in this phase?** Phase 4 changes the JS contract (new hooks, terminal lookup). Recommendation: yes, one small task (version `main.js` with a content hash like `cssHash` and append it to the literal import specifiers), because returning visitors would otherwise miss the badge and redirect until their cache expires. Planner/user decision.
3. **Backstop value in `site.js`:** today's live count is 246 members. Recommendation: `membersBackstop: 240` (floors to "200+"). It's a number the user should glance at, not a TODO (it is derived from a live measurement).
4. **Exact FACTS row granularity:** recommendation: one row per independently confirmable unit (each drafted FAQ answer, each recap, the evening times, each page description, the `updated` date, page intro/flavour lines). Expect roughly FACTS-03…FACTS-20.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build, tests | ✓ | v26.7.0 local; CI from `.nvmrc` (24) | — |
| npm deps (eleventy, eleventy-img, lightningcss) | Build | ✓ | 3.1.6 / 7.0.0 / 1.33.0 | — |
| Network to `discord.com` | Build-time counts (CONT-07) | ✓ (tested) | API v10 | `site.discord.membersBackstop`; tests run with `DISCORD_FETCH=0` |
| Browser (Chrome) for UAT | Manual checks: redirect, badge, no CLS | ✓ (used in Phase 3 UAT) | — | — |
| validator.schema.org / Rich Results Test | Optional manual JSON-LD check | Online | — | Gate G11/G12 cover structure |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node built-in `node:test` + `node:assert/strict` |
| Config file | none. `package.json`: `"pretest": "node scripts/warm-images.js"`, `"test": "node --test \"test/*.test.js\""` |
| Quick run command | `node --test test/<file>.test.js` |
| Full suite command | `npm test && SITE_URL=https://guard.example npm run build && MSYS_NO_PATHCONV=1 SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/ npm run build` (Git Bash) |
| Indexable check (expected to FAIL until FACTS are confirmed) | `SITE_URL=https://example.org SITE_INDEXABLE=1 npm run build` → only G10 lines naming open FACTS rows |

Note: `recaps` add images, so the first `npm test` after the change re-warms `.cache/img` (pretest).

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-01 | `/jak-dolaczyc/` has requirements list, `<ol>` of 6 steps (D-02 order), Discord CTA with `site.discord.invite`, one `h1` | build-output | `node --test test/pages.test.js` | ❌ Wave 0 |
| CONT-02 | 12 ≤ FAQ count ≤ 16; every item a `<details>` with `<summary>`; FAQPage names/answers equal visible text | build-output + gate | `node --test test/pages.test.js test/seo-gate.test.js` | ❌ / ✅ extend |
| CONT-03 | `/operacje/` has schedule, mission types, eras, evening `<ol>` in confirmed order, "Najbliższe misje" block linking Discord, no Event | build-output | `node --test test/pages.test.js` | ❌ Wave 0 |
| CONT-04 | 3–5 recap cards, newest first, each `<time datetime>` ISO + Polish label, lazy `<picture>` with dims, "ostatnia aktualizacja" visible | build-output + perf gate | `node --test test/pages.test.js test/perf-gate.test.js` | ❌ / ✅ |
| CONT-05 | Nav labels/hrefs per D-07 in header and footer; `aria-current="page"` only on the matching subpage link; home has one `active-nav` and no `aria-current`; `data-legacy-hash="recruitment"` link resolves to `/jak-dolaczyc/` (prefixed); module calls `location.replace(link.href)` for `#recruitment`, not for `#about` | build-output + unit (stub DOM) | `node --test test/layout.test.js test/client.test.js test/modules.test.js` | ✅ update + extend |
| CONT-06 | Every `TODO(FACTS-NN)` in `src/_data/*.js` reaches the output; FACTS.md rows match; indexable build fails only with G10 on open rows | unit + build-output | `node --test test/facts.test.js test/seo-files.test.js` | ✅ (works unchanged with Pattern 2) |
| CONT-07 | `lib/discord.js`: code parse, floor, fetch ok/404/bad JSON/throw/timeout → null; badge module: textContent only, plural forms, ignores non-integers, no fetch for a non-discord URL; baked fallback text present with `DISCORD_FETCH=0` | unit + build-output | `node --test test/discord.test.js` | ❌ Wave 0 |
| SEO-06 | Visible `nav.breadcrumbs` on both subpages; BreadcrumbList G11 rules; home has none; prefix build URLs under `/IBC-Website/` | gate fixtures + build-output | `node --test test/seo-gate.test.js test/schema.test.js test/pages.test.js` | ✅ extend / ❌ |

### Sampling Rate
- **Per task commit:** the task's own suites (`node --test test/<file>.test.js …`), then `npm test`
- **Per wave merge:** full suite command above (both gates print OK in both builds)
- **Phase gate:** full suite green; the indexable build fails only on G10 for open FACTS rows; manual UAT in a browser: `/#recruitment` → `/jak-dolaczyc/` at root and under `/IBC-Website/`, badge updates live with no visible shift, JS-off shows the fallback, breadcrumbs visible, FAQ opens with keyboard

### Wave 0 Gaps
- [ ] `lib/reject-output.js` CR-01 allow-list + tests for `--dir src` / `--dir .git` (STATE.md: before Phase 4)
- [ ] `test/helpers.js`: `DISCORD_FETCH` in `buildEnvKeys`, default `"0"` in test builds
- [ ] `test/pages.test.js`: new suite for both pages (CONT-01..04, SEO-06 visible part, nav marking)
- [ ] `test/discord.test.js`: `lib/discord.js` units + badge module stub-DOM tests (reuse the stub harness style of `client.test.js`)
- [ ] `test/seo-gate.test.js`: G11/G12 fixtures

## Security Domain

`security_enforcement: true`, ASVS level 1, block on high.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No accounts |
| V3 Session Management | no | No sessions; badge fetch uses `credentials: 'omit'` |
| V4 Access Control | no | Public static pages |
| V5 Validation, Sanitization, Encoding | yes | Nunjucks autoescape for all data copy; `jsonLd` filter escapes `<` in JSON-LD (only `| safe` use); badge accepts only non-negative integers and writes via `textContent`; redirect target only from a fixed attribute match |
| V6 Cryptography | no | — |
| V10 Malicious Code / V14 Configuration | yes | No new dependencies; no inline scripts; invite literal single-sourced; fetch URL prefix-checked (`https://discord.com/api/`) |
| V12/V13 (privacy of personal data, GDPR context) | yes | Render only the two count fields from the invite response (it also returns `inviter` user data); never publish squad.xml members (ROST-03) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via third-party API response (Discord) | Tampering | Integer validation + `textContent`; never `innerHTML` |
| Open redirect / selector injection via `location.hash` | Spoofing | Compare hash with `getAttribute('data-legacy-hash')` by `===`; redirect only to that link's `href` |
| JSON-LD script breakout from drafted copy | Tampering | Existing `jsonLd` (`<` → `<`) |
| Visitor IP disclosed to Discord on home view | Information disclosure | Fetch only when the badge nears the viewport; `referrerPolicy: 'no-referrer'`, `credentials: 'omit'`; mention in the v2 privacy page (ROST-05). Locked decision D-15, so a mitigation, not a block |
| Build broken or hung by a remote API | Denial of service | `AbortSignal.timeout(5000)`, try/catch → backstop; tests offline by default |
| Gate CLI deleting source folders (CR-01) | Tampering | Allow-list `_site` and `_test/**` before adding new gate rules |
| Drafted claims published as fact | Repudiation / trust | G10 + `test/facts.test.js` (existing) |

## Sources

### Primary (HIGH confidence)
- Repo files read this session: `package.json`, `eleventy.config.js`, `src/_data/{site,navigation,gallery}.js`, `src/_includes/layouts/base.njk`, `src/_includes/partials/{head,header,footer,discord-cta}.njk`, `src/index.njk`, `src/404.njk`, `src/sitemap.xml.njk`, `src/web.config.njk`, `src/js/main.js`, `src/js/modules/{scroll-spy,terminal,menu}.js`, `src/css/style.css`, `src/css/partials/{recruitment,components,sections,header}.css` (parts), `lib/{schema,seo,check-seo,check-perf,images,css,html}.js`, `scripts/check-seo.js`, `test/{helpers,facts,layout,client,devpages,seo-files,modules,schema,links,css,deps,docs,seo-gate}.test.js` (relevant parts), `FACTS.md`, `.planning/config.json`, `.planning/STATE.md`, `.planning/REQUIREMENTS.md`, `.planning/phases/03-performance-assets/{03-REVIEW,03-REVIEW-DISPOSITION,03-VALIDATION}.md`, `.planning/research/{FEATURES,PITFALLS,ARCHITECTURE}.md` (relevant parts), `node_modules/nunjucks/src/lib.js:5-12`
- Live test: `curl` and Node `fetch` of `https://discord.com/api/v10/invites/DhJwkeehJK?with_counts=true` (200, counts, CORS header echo) and an unknown code (404, code 10006)
- Local runtime checks: `Intl.DateTimeFormat('pl-PL')`, `Intl.PluralRules('pl-PL')`, gzip sizes of `_site/css/style.css` and `_site/js/**`

### Secondary (MEDIUM confidence)
- https://developers.google.com/search/docs/appearance/structured-data/breadcrumb (BreadcrumbList/ListItem properties, last item `item` optional)
- https://docs.discord.com/developers/resources/invite (Get Invite, `with_counts`, count fields)
- https://www.11ty.dev/docs/data-js/ (async JS data files)
- https://schema.org/FAQPage, https://schema.org/Question (FAQPage is a WebPage; `acceptedAnswer` types)

### Tertiary (LOW confidence)
- OCAP meaning, `<details>` fragment auto-expansion, and Discord rate-limit behaviour for anonymous visitors (Assumptions A1, A2, A5)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. No new packages; versions read from the installed tree.
- Architecture: HIGH. Every pattern extends a repo mechanism that was read this session (loader map, image pipeline, schema filters, FACTS markers, gates).
- Pitfalls: HIGH for the repo-specific ones (exact lines quoted); MEDIUM for browser behaviour (CLS, console errors).
- Discord endpoint: HIGH (live-tested and documented).

**Research date:** 2026-10-11
**Valid until:** 2026-11-10 (stable stack; re-test the Discord endpoint if the invite changes)
