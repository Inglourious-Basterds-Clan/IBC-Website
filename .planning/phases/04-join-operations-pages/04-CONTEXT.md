# Phase 4: Join & Operations Pages - Context

**Gathered:** 2026-10-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Two new indexable Polish pages, `/jak-dolaczyc/` (requirements, numbered join steps, 12–16 question FAQ, Discord CTA) and `/operacje/` (schedule, mission types, eras, "typowy wieczór" timeline, 3–5 dated recaps). The nav switches to real pages with the current page marked; legacy `/#hash` links that no longer have a home section redirect to the matching page; both subpages get visible breadcrumbs + BreadcrumbList JSON-LD. Every fact Claude invents is marked `TODO(FACTS-NN)` and listed in `FACTS.md`. The home page gets a live Discord members/online badge with a static fallback.

Not in this phase: visual refresh, a11y work (Phase 5), roster `/sklad/` and the bot-fed mission calendar (v2), per-recap pages (ENG-03, v2).

</domain>

<decisions>
## Implementation Decisions

### Clan facts (user-confirmed, CONT-01..03, CONT-06)
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

### FAQ (CONT-02)
- **D-04:** 12–16 questions in natural Polish (search phrasing such as "Czy muszę mieć doświadczenie w Arma 3?", "Ile miejsca zajmują mody?", "Czy potrzebuję DLC?", "Ile trzeba mieć lat?"). Shown as a native `<details>/<summary>` accordion, no JS.
- **D-05:** **FAQPage JSON-LD is emitted** on `/jak-dolaczyc/`, built from **the same data** as the visible accordion (one source). It gives no Google rich result, which is accepted. The gate/tests must check that the JSON-LD questions match the visible ones and that the JSON-LD is valid. Gate G5 still bans Event.

### Home vs. subpages & nav (CONT-05)
- **D-06:** The home recruitment section becomes a **teaser**. Keep the terminal and the Discord CTA (they're part of the site's identity), cut requirements/steps down to a short summary, and add a "Pełna instrukcja →" link to `/jak-dolaczyc/`. The teaser section gets a **new id** (e.g. `#rekrutacja`) so `#recruitment` is free for the redirect.
- **D-07:** Nav (`src/_data/navigation.js`) = **Start / O nas (`/#about`) / Operacje (`/operacje/`) / Dołącz (`/jak-dolaczyc/`)**. Galeria and System are dropped from the nav (the gallery stays on home). The header Discord button stays separate. The current page is marked (`aria-current="page"`) on subpages, and scroll-spy keeps working on home for the anchor items.
- **D-08:** **Legacy hash redirects only for removed or mapped anchors.** A small `data-js` module on home redirects mapped hashes with `location.replace`: at least `#recruitment → /jak-dolaczyc/`. The planner checks whether `#hero`/`#gallery` need entries. Anchors that still exist (`#about`, `#gallery`) keep scrolling. It must work under pathPrefix.
- **D-09:** **Home facts are updated to match** (text only, no visual changes). The stat "19:00 Pt/Sob/Ndz" becomes a weekend wording, "Ukończone 16 lat" becomes "Zalecane 16+", and TeamSpeak is mentioned alongside ACRE2. Home and subpages must never contradict each other.

### Operations page & recaps (CONT-03, CONT-04)
- **D-10:** `/operacje/` gets a **"Najbliższe misje" block** saying upcoming missions are announced on Discord, with the Discord CTA. This is the slot where the bot-fed calendar (ENG-04, v2) will go later. There is **no hand-maintained upcoming list**.
- **D-11:** **3–5 recaps drafted by Claude, every name/date/story marked TODO** (FACTS rows). Build them around the existing screenshots, e.g. "Operacja Crimson Dawn", JO 1967, from `jo_1967.png`. The user replaces them with real ops before the cutover, and G10 blocks the indexable build until then. Mix the confirmed types (PvE, JO, Zeus) and eras.
- **D-12:** A recap is a **card with one photo**: HUD-bordered, a lazy-loaded image through the existing eleventy-img pipeline (it can use the unshipped `patrol.jpg`, `sniper.jpg` and the gallery sources), then a meta line with **date · era/map · type**, a title and 2–3 sentences. Newest first, with a visible "ostatnia aktualizacja" date.
- **D-13:** Schedule, mission types, eras and recaps are stored in **one data file**, `src/_data/operations.js`, following the `gallery.js` pattern.

### Live Discord badge (CONT-07)
- **D-14:** The badge shows **Discord server size + online**, e.g. "Discord: 246 osób · 94 online", clearly labelled as Discord. The **"20+ aktywnych członków" stat stays** because it counts players in ops. Different labels mean no contradiction.
- **D-15:** It sits **next to the home recruitment teaser's Discord CTA**. Data comes from `GET https://discord.com/api/v10/invites/<code>?with_counts=true`, with the invite code taken from `site.discord.invite` (single source).
- **D-16:** **The fallback number is baked in at build time.** The build fetches the counts once and renders them rounded down (e.g. "200+ osób"). The browser then updates them live with no layout shift, and fails silently (rate limit, offline, JS off). If the build fetch fails, a committed backstop value in `site.js` is used, so the build never breaks because of Discord.

### Breadcrumbs (SEO-06)
- **D-17:** Both subpages show visible breadcrumbs (Start › Page) and BreadcrumbList JSON-LD with absolute URLs from `site.url` + pathPrefix. Home has no breadcrumbs. The look is Claude's call and stays in HUD style.

### Claude's Discretion
- Exact FAQ question list and wording within D-04. Answers beyond the confirmed facts get TODO.
- Where `/jak-dolaczyc/` content data lives (front matter vs `_data/join.js`/`faq.js`), the breadcrumb markup and styling, the recap card CSS, and the "typowy wieczór" timeline presentation.
- How the build-time Discord fetch is done (global data file with timeout, cached), the backstop number, and the badge module name.
- The exact hash-redirect map beyond `#recruitment`, the new teaser id, and the home teaser wording.
- New gate/test rules (BreadcrumbList validity, FAQ schema matches visible FAQ, nav `aria-current`). Raising perf BUDGET caps only through a reviewed edit, if new CSS/JS needs it.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope & requirements
- `.planning/ROADMAP.md` — Phase 4 goal and 5 success criteria
- `.planning/REQUIREMENTS.md` — CONT-01..07, SEO-06; Out of Scope (no Event JSON-LD, no hand-maintained calendar, no Discord widget iframe)
- `.planning/PROJECT.md` — constraints, Key Decisions (slugs fixed, Polish only)

### Research
- `.planning/research/FEATURES.md` — FAQ content spec, operations page outline, live Discord badge (invite endpoint tested, CORS ok), anti-features
- `.planning/research/ARCHITECTURE.md` — data-driven content + `lib/schema.js` pattern (FAQPage/BreadcrumbList from the same data)
- `.planning/research/PITFALLS.md` — hash→multi-page breakage

### Facts process
- `FACTS.md` — TODO(FACTS-NN) marker format and register; Phase 4 appends rows
- `test/facts.test.js` — keeps markers and the register in sync

### Prior phase decisions
- `.planning/phases/01-eleventy-foundation/01-CONTEXT.md` — data-driven nav (D-09), pathPrefix rules, scroll-spy hash matching
- `.planning/phases/02-technical-seo/02-CONTEXT.md` — title suffix, required description, TODO gate G10, indexing opt-in
- `.planning/phases/03-performance-assets/03-CONTEXT.md` — image pipeline, `data-js` modules, perf BUDGET gate

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/_includes/layouts/base.njk`: shared layout. New pages need only front matter + body.
- `src/_data/navigation.js`: nav data read by `partials/header.njk` and `partials/footer.njk`.
- `src/_data/gallery.js` + `lib/images.js` + the `{% picture %}` shortcode: the pattern for recap images (`src/images/` holds unshipped originals incl. `patrol.jpg`, `sniper.jpg`).
- `lib/schema.js`: JSON-LD builders (Organization/WebSite). Extend it with BreadcrumbList and FAQPage.
- `{% icon "discord" %}` shortcode (`lib/icons.js`) and the `.hud-btn`, `.hud-border`, `.req-list`, `.section-header` classes.
- `src/js/modules/*` + `src/js/main.js` loader map: new modules (badge, hash redirect) go through the frozen `data-js` map.

### Established Patterns
- Post-build gates `lib/check-seo.js` (G0–G10) and `lib/check-perf.js` (frozen BUDGET) run in `npm run build`. New pages must pass both, and new JSON-LD types must not trip G5.
- Client JS reads build-time config from `data-*` attributes. Text goes in through `textContent`, never `innerHTML`.
- Tests build into `_test/` with `test/helpers.js`. They use `node --test`.

### Integration Points
- `src/index.njk` recruitment section (teaser + new id + badge), `about-stats` (fact wording).
- New `src/jak-dolaczyc.njk` / `src/operacje.njk` (or folders) with `permalink` to the fixed slugs. `sitemap.xml.njk` picks them up.
- `src/js/modules/scroll-spy.js` must cope with the new nav mix (anchors + pages).

</code_context>

<specifics>
## Specific Ideas

- Typical evening: slotting → briefing → mission → debrief with feedback for the Mission Maker → OCAP review.
- Explain "Zeus" in plain words for newcomers (a scenario built on the fly, usually announced on the day).
- Mention that missions can use tailored modpacks besides the standard one.
- The user pointed to the clan squad XML at `https://ibc.tacticool.pl/xml/` (`squad.xml`: unit tag `IBC`, ~30 member entries, web `units.arma3.com/unit/ibc`). It backs the "20+ aktywnych członków" claim. Planner: an FAQ answer may mention squad XML / unit tag only as a TODO (how and when a member is added is not confirmed). Do not publish member data from it (ROST-03 privacy rule).
- The user's friend wanted the calendar as an iframe. Recorded preference for v2: the bot publishes JSON that the site renders as HTML, instead of an iframe (SEO, perf, offline fallback).

</specifics>

<deferred>
## Deferred Ideas

- **Bot-fed upcoming missions calendar on `/operacje/`**: ENG-04, v2. It goes in the "Najbliższe misje" slot (D-10). Prefer a bot JSON feed rendered as HTML over an iframe.
- Per-recap pages (ENG-03, v2). Recaps stay in one data file until then.
- **Squad XML as a roster source** (`https://ibc.tacticool.pl/xml/squad.xml`, ~30 members): a candidate input for the v2 `/sklad/` roster next to the bot. It needs opt-in, and no emails or real names may be published (ROST-02/03).
- **Arma 3 Units profile** (`units.arma3.com/unit/ibc`) as an extra footer/`sameAs` link. Phase 2 D-11 locked sameAs to YouTube/Facebook/Discord, so adding it is a reviewed change to `site.social`. Ask the user before adding it.

</deferred>

---

*Phase: 04-join-operations-pages*
*Context gathered: 2026-10-11*
