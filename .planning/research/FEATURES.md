# Feature Research

**Domain:** Recruitment and SEO website for a Polish Arma 3 milsim community (Inglourious Basterds Clan, IBC). The site is static and sends visitors to Discord.
**Researched:** 2026-10-02
**Confidence:** MEDIUM overall. Google structured-data facts and the Discord API behaviour are HIGH because they come from official docs and a live API test. Recruit expectations and Polish conventions are MEDIUM, cross-checked across several clan recruitment posts. Polish keyword volumes are LOW because no keyword tool was available.

---

## Key Findings (read first)

1. **Few Polish clans have a real website to compete with.** For queries like "klan arma 3 polska" and "milsim polska arma 3", the results are almost entirely Steam group pages (`steamcommunity.com/groups/arma3-polska`, the comment threads of individual clans) and Discord server-discovery listings. The Polish groups that do have a site have thin ones. ArmA Fans Team Poland's forum is "w trakcie budowy". ArmaForces is in "light hibernation" and only offers missions and a mod list. A fast, multi-page Polish site with real content about joining and operations can realistically rank for these long-tail queries. (MEDIUM: based on observed results, no volume data.)
2. **Recruits mainly want to know whether the unit is active and whether they fit.** Bohemia's own "how to find a unit" guide tells players to check region, operation times, play style and membership details, and to watch out for dead units ("a number of those registered units may no longer be active"). Every feature should either prove the unit is active (recent ops, live member count, dates) or answer a fit question (age, schedule, play style, mods, commitment).
3. **FAQ and Event structured data will not produce rich results for IBC.** (HIGH, from official Google docs.)
   - FAQ rich results were removed from Google Search. Before that they were limited to government and health sites from Aug/Sep 2023, and the documentation was formally removed in June 2026.
   - Event rich results require an event at a physical location. Google's docs say "Virtual experiences that have no real-world component aren't supported", and events must not require membership. They are also only shown in 8 regions, and Poland is not one of them.
   - PROJECT.md lists "FAQPage, Event" as goals. Those goals should be downgraded (see Anti-Features).
4. **The Discord invite endpoint gives live member counts with no bot and supports CORS.** A live test of `GET https://discord.com/api/v10/invites/DhJwkeehJK?with_counts=true` returned `approximate_member_count: 246` and `approximate_presence_count: 94`. It also sent `access-control-allow-origin` matching the requesting origin and `expires_at: null`, so the invite is permanent. The guild `widget.json` returns "Widget Disabled", so the invite endpoint is the one to use. (HIGH, tested.)
5. **The site's numbers disagree with each other.** The site claims "20+ aktywnych członków" while Discord shows 246 members, 94 of them online. A first-time visitor who sees mismatched or understated numbers trusts the site less. Pick one honest framing and show it everywhere.
6. **Google's site name needs a domain root.** WebSite structured data for the site name in search results only works at a domain or subdomain root, not a subdirectory (HIGH, Google docs). If the site runs at `user.github.io/IBC-Website/` before the domain is bought, the "IBC" site name will not show. This is one more reason to keep the site URL in a single config value.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Without these, a recruit bounces back to the search results or the Steam group, or Google indexes the site badly.

#### A. Recruitment content (what recruits need)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Requirements list** (wiek 16+, legalna kopia Arma 3, mikrofon, TeamSpeak 3 + Discord, weekend availability) | Every Polish recruitment post opens with this block (GAD, JW Bielik, GWAiS, Aspidis, Vector Tactics; the age floor is usually 14 to 16). It is the first fit filter. | LOW | Already on the home page. Move the full version to the join page and keep a short version on the home page. |
| **Step-by-step "Jak dołączyć"** (numbered steps: Discord → rola Kadet → kanał kadetów → szkolenie/pierwsza misja → pełny członek) | 16AA uses a 4-step process (application → interview → Phase 1 training → assessment). Recruits want to know what happens after they click. | LOW | The existing 3 steps stop at "read the welcome message". Add what follows: the probation period, the first mission and when they become a full member. Mark unknown facts with TODO for the user. |
| **Schedule with explicit days and time** ("Pt/Sob/Ndz 19:00", with the timezone written out as czasu polskiego / CET/CEST) | Bohemia's guide lists "operation times" as a primary evaluation criterion. Polish groups always state the time (e.g. "soboty 18:30"). | LOW | Exists as a stat. Repeat it on the join and operations pages. Say whether all three days are mandatory, because the current copy is ambiguous: "Zdolność do udziału w cotygodniowych operacjach" vs Pt/Sob/Ndz. |
| **Play-style statement** (milsim vs semi-milsim vs "chillsim"; degree of hierarchy; whether there is "Yes sir" discipline) | r/FindAUnit and Polish posts label themselves explicitly ("semi-milsimowa", "chillsim", "bez nadmiernego realizmu"). This is the main fit question for milsim players. | LOW | Current copy ("elastyczność", PvE, kampanie dynamiczne, JOPy) is vague about strictness. Add one plain sentence that sets the level. |
| **Mods / modpack info** (what is used, approximate size in GB, how to install) | Every unit FAQ covers this. ACE/TFAR/ACRE/CUP/RHS-style packs of 40 to 80+ mods are normal and are the biggest technical hurdle for a new recruit. | LOW to MED | At minimum: the core mods, size, and a link to the Steam Workshop collection or Arma 3 Launcher preset (`.html`). MED if the user wants an install mini-guide with screenshots. |
| **DLC / CDLC requirements** | Ops like "Joint Operations 1967" suggest S.O.G. Prairie Fire or other CDLC. Recruits need to know whether they must buy anything. | LOW | FAQ entry. Facts are TODO for the user. |
| **Single, obvious Discord CTA on every page** | Discord is the whole conversion funnel. Every competitor (7Cav "Enlist Today", 16AA "Join us now") repeats the CTA. | LOW | The invite is currently duplicated in 3 places (CONCERNS.md). Make it one config value. The CTA must be clickable right away and must not wait for the terminal animation. |
| **Proof of activity and history** (founded 2018, real screenshots, named operations, recent dates) | Activity is the main concern from Bohemia's guide. A site with no dates looks abandoned. | LOW | Already has the 2018 date, gallery and op names. Recent op dates come from the operations page (section B). |
| **Contact / social links** (Discord, plus Steam group / YouTube / TeamSpeak address if they exist) | Recruits cross-check across platforms, as the Bohemia guide recommends verifying "through multiple sources". | LOW | Footer. Only include links that are active. |

#### B. Operations / events page

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Regular schedule block** (days, start time, typical length, briefing time / slotting) | Bohemia's guide calls this "how their play sessions generally unfold". | LOW | Static text. Polish terms: "briefing", "zapisy na sloty / slotowanie", "debriefing". |
| **Mission types explained** (PvE wewnątrzklanowe, kampanie dynamiczne, Joint Operations z innymi grupami, eras: WW2 / Wietnam / współczesność, special ops like Prima Aprilis) | Content variety is a deciding factor and IBC's selling point ("pasja historyczna", "każdy znajdzie coś dla siebie"). | LOW | Each type gets an H2/H3 section. This is the main indexable copy for "arma 3 coop polska"-type queries. |
| **"What a typical evening looks like"** (meeting → briefing → slots → mission → AAR) | Removes uncertainty for players who have never done milsim. Strongest conversion copy for beginners. | LOW | Short narrative or timeline. Reuse the HUD "terminal/timeline" styling. |
| **Operation recaps / AARs** (name, date, era/map, 3 to 6 screenshots, short story) | Shows the unit is active, which matters most. Each recap is also a long-tail indexable item ("Operacja Crimson Dawn"). | MED | Content-heavy and needs the image pipeline (WebP/AVIF). Start with 3 to 5 recaps from existing gallery material. Recaps are a list on one page for v1. Separate pages per recap come later (Differentiators). |

#### C. Technical SEO and first impression (in PROJECT.md Active; expected by search engines and users)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Distinct, keyword-matched `<title>`/meta description per page** | Each page has to target its own query cluster (see the Keyword Map below). | LOW | Requires the shared layout. |
| **Canonical URLs, `sitemap.xml`, `robots.txt`** | Basic indexing hygiene. | LOW | Requires the site-URL config. |
| **Absolute OG/Twitter image + per-page OG** | Links get pasted into Discord, Messenger and Facebook groups. Discord unfurls links using OG tags, and this preview is often the first impression. | LOW | 1200×630 image. Discord's embed colour comes from `theme-color`. |
| **Organization + WebSite JSON-LD (site name "IBC" / "Inglourious Basterds Clan"), BreadcrumbList on subpages** | WebSite controls the site name in results. Organization supplies the logo, `sameAs` (Discord/Steam/YouTube) and `foundingDate: 2018`. | LOW | WebSite site name only works at a domain root (see Key Finding 6). Replace the current `SportsTeam` type with Organization or keep both. SportsTeam is semantically odd for a gaming clan, though harmless. |
| **Polish URL slugs without diacritics** (`/jak-dolaczyc/`, `/operacje/`, `/sklad/`) | Diacritics in URLs get percent-encoded and look broken when shared. This is standard Polish SEO practice. | LOW | Body copy keeps its diacritics. |
| **Fast mobile load (Lighthouse ≥90)** | Many recruits arrive from a phone link in Discord or Steam. | MED | Covered by other research dimensions (STACK/PITFALLS). |
| **Accessible navigation, skip link, focus management** | Lighthouse a11y score, and basic usability. | MED | Covered elsewhere. |
| **Favicon + manifest + `theme-color`** | Browser tabs, Discord embeds and Google's favicon in mobile results. | LOW | Google shows the favicon next to results on mobile. |

### Differentiators (Competitive Advantage)

These go beyond what Polish competitors offer. Most of them support the Core Value of building trust and converting visitors to Discord.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Live Discord stats badge** ("246 członków · 94 online") | Proves activity in real time and backs up claims. No Polish competitor site does this. | LOW | Client-side `fetch` of the invite endpoint with `?with_counts=true`. CORS works (tested). **Must** render a static fallback number in HTML and progressively enhance it, with no layout shift and silent failure if rate-limited. Can also run at build time if an SSG is adopted. Also replaces the inconsistent "20+". |
| **Dedicated FAQ in natural Polish questions** (see the FAQ Content Spec below) | Polish competitors only publish requirement bullets in Steam posts. A real FAQ answers the long-tail questions people type into Google ("czy muszę mieć doświadczenie w arma 3", "ile miejsca zajmują mody") and helps visibility in AI answers. | LOW | Native `<details>/<summary>` accordion: accessible, no JS, crawlable. FAQPage JSON-LD is optional and gives no rich result (Key Finding 3). |
| **Beginner-friendly onboarding emphasis** ("Nie musisz znać milsimu", training on request, mentor/kadet system) | Top r/FindAUnit trait: "welcome new players… training available". GAD and JW Bielik both state that "doświadczenie wojskowe nie jest wymagane". This is the largest addressable audience. | LOW | Copy only. Confirm the kadet/training facts with the user (TODO). |
| **"Typowy wieczór" timeline + era/mission-type cards** | Makes the unique mix (historical eras + JOPy with other groups) concrete. This is what sets IBC apart from mono-era units. | LOW to MED | Reuse the HUD visual language. |
| **Modpack quick-start** (one-click Steam Workshop collection or launcher preset download, size, "test your mods" note) | Removes the main technical hurdle before the first op. ArmaForces built a whole mod-list tool. A link plus 4 steps gets most of that value. | LOW | Static links. Keep the modlist on Discord if it changes often. Link to it rather than copying it to avoid staleness. |
| **Per-operation recap pages** (`/operacje/crimson-dawn/`) | Each one is a separately indexable page. Recaps with screenshots are the content that gets shared. | MED | Only worth it once an SSG / content collection exists and the user commits to writing recaps. v1.x. |
| **Units/roster page (ORBAT)** fed by the Discord bot: sections/squads, ranks, specializations (medyk, pilot, JTAC, saper, RTO), callsigns | Shows structure and scale. Polish groups advertise "system specjalizacji", 16AA shows an ORBAT, and Guild Order sells "skład według rangi i roli". Recruits see the roles they could grow into. | HIGH | Depends on the bot's data contract, a build-time fetch (or JSON in repo), and a privacy decision (see Anti-Features / Pitfalls). Scheduled last per PROJECT.md. The existing unused `.roster-*` CSS can be reused. |
| **Testimonials / member quotes** (2 to 4 short quotes with nickname and join year) | 16AA uses them. Cheap social proof for first-time visitors. | LOW | Content needs the user's input. The nickname must be consented. |
| **Off-site presence that links back** (units.arma3.com listing, Steam group "arma3-polska" recruitment posts, r/FindAUnit, BI Forums "Squads" section, Discord "Polskie społeczności" lists) | The SERP is dominated by these platforms, so being present there and linking to the site is both a backlink and a discovery channel. | LOW (non-code) | Put this on the checklist. It is not a site feature but it multiplies the site's reach. Also add these to Organization `sameAs`. |
| **YouTube/trailer section with a lightweight facade** | Bohemia's guide points recruits to video to see how sessions go. | LOW to MED | Only if IBC has videos. Use a click-to-load facade with `youtube-nocookie.com` to keep Lighthouse scores and avoid cookies (see Anti-Features). |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Event JSON-LD for weekly ops** (currently in PROJECT.md Active) | It seems like an easy route to Google event listings. | Ineligible: online-only events are explicitly unsupported, events must be open to the public without membership, and rich results are not shown in Poland. Marking up non-eligible events goes against Google's structured-data guidelines and brings zero benefit. | Skip Event markup. Put the schedule in visible text ("Pt/Sob/Ndz 19:00"), which Google and AI answers do read. Re-evaluate only if IBC holds a real-world meetup. |
| **Relying on FAQPage JSON-LD for SERP visibility** | Old SEO advice. | FAQ rich results were removed from Google Search entirely. | Write a good visible FAQ. JSON-LD is optional, harmless, and LOW priority. |
| **On-site application form** | It looks "professional" (7Cav, 16AA, Guild Order). | It needs a backend or third-party form, spam handling, and GDPR handling of applicants' personal data. Discord is already where recruitment happens, so a form adds a second funnel nobody monitors. | Keep the single Discord CTA. Explain what to post in the kadet channel. |
| **Member login / attendance tracking / forum** (7Cav milpacs, AFTP forum) | Big units have them. | Out of scope for a static site. It duplicates Discord and creates a maintenance burden. | Leave internal tooling on Discord or the bot. |
| **Manually maintained "upcoming ops" calendar** (the existing unused calendar markup) | It looks active. | It goes stale within weeks. A calendar showing ops from 3 months ago is a bigger red flag than no calendar, because "inactive unit" is the main concern. | Show the regular schedule (always true) and dated recaps of past ops. Add upcoming ops only once the Discord bot provides them automatically (v2). |
| **Embedded Discord widget iframe** | One-line embed. | The widget is disabled on the IBC guild. The iframe is heavy, hurts Lighthouse and has poor a11y. | Live count via the invite endpoint plus the existing CTA button. |
| **Auto-playing hero video / heavy particle effects** | "Tactical" feel. | Kills mobile LCP and conflicts with reduced-motion and the ≥90 target. | Optimized still image with existing scanline/grid overlays, and an optional click-to-play trailer. |
| **CTA gated behind the terminal typing animation** | Theme immersion. | Any delay before the Discord button appears hurts conversion and a11y, and conflicts with reduced-motion. | Render the CTA immediately and play the animation as decoration next to it. Honour `prefers-reduced-motion`. |
| **Inflated or vague numbers** ("20+" next to a Discord showing 246) | Marketing. | Inconsistency reduces trust, and recruits cross-check. | One honest metric, live or build-time: Discord members, plus "regularnie na misjach: ~N" if known. |
| **Meta keywords tag / keyword-stuffed copy / doorway pages per keyword** ("klan arma 3", "grupa arma 3", "milsim polska" pages) | Old SEO habits. The existing site already has a keywords meta. | Google ignores meta keywords. Near-duplicate pages per keyword violate spam policies. | One page per intent (home / join / operations / roster). Use the phrases naturally in headings and body text. |
| **Public roster with real names, avatars or ages by default** | The ORBAT looks impressive. | IBC is EU-based with members from 16+ (minors), so GDPR applies. Discord avatars and nicknames can identify people, and members never agreed to be on a public website. | Nickname + rank + role only. Opt-in or opt-out via the bot. No avatars or ages. Document this in the roster phase. |
| **YouTube iframes / Google Fonts from Google's CDN without consent** | Convenience. | They set cookies or leak IPs to third parties, which under EU rules can trigger a cookie-banner requirement. They also hurt Lighthouse. | Self-host fonts (already planned) and use a facade with `youtube-nocookie`. With no analytics (out of scope), the site can stay cookie-free with no banner. |
| **English version** | Wider reach. | Out of scope in PROJECT.md and dilutes Polish focus. | `lang="pl"`, and optionally `og:locale="pl_PL"`. |

---

## FAQ / Join Page: Content Spec

The recommended structure is one page, `/jak-dolaczyc/`. Both the title and H1 target "rekrutacja / jak dołączyć". The page has requirements and steps at the top and the FAQ below them. Splitting FAQ into its own page is optional. With roughly 15 questions, one strong page beats two thin ones.

**Above the fold:** H1 (e.g. "Rekrutacja do IBC – jak dołączyć do naszej grupy Arma 3"), a 2-line pitch, the requirements checklist, and the Discord CTA.

**Steps (numbered, `<ol>`):** 1) Dołącz do Discorda → 2) Wybierz rolę Kadet → 3) Przeczytaj powitanie na kanale kadetów → 4) Zainstaluj mody [TODO: link] → 5) Szkolenie / pierwsza misja [TODO] → 6) Okres próbny → pełnoprawny członek [TODO: czas trwania].

**FAQ questions** (Polish wording as players type them; TODO = facts the user must confirm):

| # | Question (PL) | Answer source |
|---|---------------|---------------|
| 1 | Ile muszę mieć lat? | Existing: 16+ |
| 2 | Czy muszę mieć doświadczenie w Arma 3 lub milsimie? | TODO (recommend "nie – nauczymy") |
| 3 | Jaki styl gry prezentujecie – milsim, semi-milsim? | TODO (plain-language level) |
| 4 | Kiedy gracie i ile trwa misja? | Existing: Pt/Sob/Ndz 19:00 + TODO duration |
| 5 | Czy obecność na każdej misji jest obowiązkowa? | TODO (current copy ambiguous) |
| 6 | Jakie mody są wymagane i ile zajmują miejsca? | TODO (list core mods, GB, Workshop/preset link) |
| 7 | Jak zainstalować mody? | TODO (launcher preset steps) |
| 8 | Czy potrzebuję DLC (np. S.O.G. Prairie Fire, Global Mobilization)? | TODO |
| 9 | Czy muszę mieć mikrofon i TeamSpeak? Jakie radio (TFAR/ACRE)? | Existing: mic + TS3; TODO radio mod |
| 10 | Jak wygląda okres próbny / szkolenie dla nowych? | TODO |
| 11 | Jakie role/specjalizacje mogę pełnić (medyk, pilot, JTAC…)? | TODO (links to roster later) |
| 12 | Czy mogę należeć do innej grupy jednocześnie? | TODO (common rule in units) |
| 13 | Czy są jakieś opłaty lub składki? | TODO (Polish posts often state "bez składek") |
| 14 | Czym są Joint Operations (JOPy)? | Existing concept, expand |
| 15 | Jaki sprzęt/PC jest potrzebny? | TODO (optional) |
| 16 | Czy gracie też w Arma Reforger / planujecie Arma 4? | TODO (captures adjacent searches; omit if no) |

Implementation: `<details>` per question, each with an `id` anchor so a recruiter can link "przeczytaj #mody" in Discord. Text stays visible in HTML so it can be indexed.

## Operations Page: Content Spec

`/operacje/` targets "misje / operacje Arma 3", "coop Arma 3 polska" and "joint operations".
1. **H1 + intro.** How often IBC plays and how varied the ops are.
2. **Harmonogram.** Days, 19:00 czasu polskiego, typical duration, when slotting/briefing happens. [TODO details]
3. **Rodzaje operacji.** Cards for PvE wewnątrzklanowe, kampanie dynamiczne, Joint Operations, special/holiday ops.
4. **Epoki i teatry działań.** WW2 / Wietnam 1967 / współczesność / other [TODO], with a matching screenshot each.
5. **Typowy wieczór.** Timeline: zbiórka → briefing → sloty → misja → debriefing/AAR.
6. **Ostatnie operacje (recaps).** 3 to 6 entries: name, **date** (critical for proving activity), era/map, 2 to 3 sentences, optimized images. Newest first. A visible "ostatnia aktualizacja" date.
7. **CTA.** "Chcesz zagrać z nami? → Discord" plus a link to `/jak-dolaczyc/`.

## Keyword Map (LOW to MEDIUM confidence; phrasing from observed SERPs and competitor posts, no volume data)

| Page | Primary intent / phrases (naturally in title, H1, H2, body) |
|------|-------------------------------------------------------------|
| `/` | "Inglourious Basterds Clan", "IBC", "polska grupa / klan Arma 3", "milsim polska". The brand needs "Arma 3" next to it because "Inglourious Basterds" alone collides with the film and "IBC" with unrelated entities. |
| `/jak-dolaczyc/` | "rekrutacja Arma 3", "jak dołączyć do klanu Arma 3", "klan Arma 3 rekrutacja", "wymagania", long-tail FAQ questions |
| `/operacje/` | "misje Arma 3", "coop Arma 3 polska", "Joint Operations Arma 3", "operacje milsim", era terms (Wietnam, II wojna) |
| `/sklad/` (last) | brand + "skład", "ORBAT", specializations |

Write the copy with Polish diacritics. Google handles queries typed without diacritics ("dolaczyc"), so don't duplicate text for them.

---

## Feature Dependencies

```
Site URL single config
    └──required by──> canonical, sitemap.xml, absolute OG URLs, WebSite/Organization JSON-LD
                          └──> WebSite site name only works once deployed at a domain root

Shared layout / multi-page structure (SSG or templates)
    ├──required by──> /jak-dolaczyc/ (Join + FAQ)
    ├──required by──> /operacje/ (Operations)
    ├──required by──> per-page titles/meta, BreadcrumbList, internal linking
    └──required by──> /sklad/ (Roster)

Discord invite single config
    ├──required by──> CTA on every page
    └──required by──> Live Discord stats badge (same invite code)

Image optimization pipeline (WebP/AVIF, sizes)
    └──required by──> Operation recaps, era cards, OG image (1200×630)

User-confirmed facts (TODO markers)
    └──required by──> FAQ answers, schedule details, modpack links, probation steps

Operations page (recaps v1)
    └──enables──> Per-operation recap pages (v1.x)

Discord bot data contract + privacy decision (opt-in/out, fields)
    └──required by──> Roster/ORBAT page
                          └──enables (v2)──> bot-fed "upcoming ops" (replaces manual calendar)

Live Discord stats ──enhances──> Hero / proof of activity
FAQ entry "specjalizacje" ──enhances (link)──> Roster page
Manual upcoming-ops calendar ──conflicts──> "proof of activity" (goes stale)
Event JSON-LD ──conflicts──> Google structured-data guidelines (online-only, members-only)
Terminal animation ──conflicts──> immediate CTA / reduced-motion (unless decoupled)
```

### Dependency Notes

- **New pages require the shared layout.** Hand-copying header and footer across 4+ pages recreates the duplication problems in CONCERNS.md.
- **The live stats badge requires the single invite config.** Both read the same invite code. A changed invite has to update both.
- **Recaps require the image pipeline.** Recaps with raw PNG/JPG screenshots would push Lighthouse below 90 on the page meant to prove quality.
- **The roster requires a data contract and a privacy decision before any UI work.** Agree the JSON shape with the bot owner (fields, update cadence, delivery: build-time fetch or committed JSON) at the start of that phase.
- **FAQ and operations copy depend on the user.** Claude drafts with TODO markers, so these pages can ship as structure first while facts are filled in. Pages with unanswered TODOs must not be indexed: hold them back from the sitemap or block them until confirmed, or have Claude draft safe defaults.

---

## MVP Definition

### Launch With (v1)

- [ ] Shared layout + per-page meta + canonical/sitemap/robots + absolute OG. Basic indexing for multiple pages.
- [ ] `/jak-dolaczyc/` with requirements, numbered steps and a `<details>` FAQ of 12 to 16 questions. This is the most direct conversion and long-tail SEO page.
- [ ] `/operacje/` with schedule, mission types, eras, typical evening, and 3 to 5 dated recaps. Proves activity and is unique content.
- [ ] Single Discord CTA config, visible immediately on every page. The whole funnel depends on it.
- [ ] Organization + WebSite + BreadcrumbList JSON-LD. Drop Event and treat FAQPage as optional.
- [ ] Consistent, honest member metric (static number at minimum). Fixes "20+" vs 246.
- [ ] Clear play-style and attendance statement. The main fit question.

### Add After Validation (v1.x)

- [ ] Live Discord stats badge (progressive enhancement). Once the static version ships, it is a cheap upgrade.
- [ ] Modpack quick-start with Workshop/preset link. Once the user confirms the mod distribution method.
- [ ] Testimonials. When 2 to 4 members agree to be quoted.
- [ ] Per-operation recap pages. When there are 5+ recaps and the user commits to writing more.
- [ ] YouTube facade section. If IBC has video content.
- [ ] Off-site listings (units.arma3.com, Steam group posts, r/FindAUnit) linking to the domain. Once the domain is bought.

### Future Consideration (v2+)

- [ ] Roster/ORBAT from the Discord bot. Last per PROJECT.md, blocked on the external data format.
- [ ] Bot-fed upcoming ops list. Only once automated, so it never goes stale.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Shared layout + multi-page | HIGH | MEDIUM | P1 |
| Technical SEO basics (canonical, sitemap, OG, robots) | HIGH | LOW | P1 |
| Join page: requirements + steps + FAQ | HIGH | LOW | P1 |
| Operations page with dated recaps | HIGH | MEDIUM | P1 |
| Single immediate Discord CTA | HIGH | LOW | P1 |
| Play-style and attendance clarity | HIGH | LOW | P1 |
| Organization/WebSite/Breadcrumb JSON-LD | MEDIUM | LOW | P1 |
| Honest, consistent member metric | MEDIUM | LOW | P1 |
| Live Discord stats badge | MEDIUM | LOW | P2 |
| Modpack quick-start | MEDIUM | LOW | P2 |
| Testimonials | MEDIUM | LOW | P2 |
| Per-operation recap pages | MEDIUM | MEDIUM | P2 |
| YouTube facade | LOW to MEDIUM | LOW | P3 |
| FAQPage JSON-LD | LOW | LOW | P3 |
| Roster / ORBAT (bot-fed) | MEDIUM | HIGH | P3 (scheduled last) |
| Event JSON-LD | NONE (ineligible) | LOW | Do not build |
| Manual upcoming-ops calendar | NEGATIVE when stale | MEDIUM | Do not build |
| On-site application form | LOW | HIGH | Do not build |

**Priority key:** P1 = must have for this milestone. P2 = add when possible. P3 = nice to have or scheduled late.

---

## Competitor Feature Analysis

| Feature | 16AA (UK, intl. benchmark) | 7th Cavalry (US, large) | ArmaForces (PL) | Typical PL clans (GAD, JW Bielik, GWAiS, Aspidis) | IBC approach |
|---------|----------------------------|-------------------------|-----------------|-------------------------------------------------|--------------|
| Own website | Yes, polished | Yes, portal | Yes, minimal | **No.** Steam group post + Discord only | Yes, multi-page, fast, Polish |
| Recruitment steps | 4-step process on homepage | "Enlist Today" + requirements page | "Join us!" link | Bullet requirements in Steam post | Numbered steps + requirements + FAQ |
| Requirements | 18+ | 18+, no VAC bans 5 yrs | n/a | 14 to 16+, legal copy, mic, TS3/Discord | 16+, legal copy, mic, TS3 (existing) |
| Schedule | Weekly ops (stated) | Detailed public event times | Google Sheets calendar | "Soboty 18:30" in post | Static schedule + dated recaps |
| Mods | External | Guides | Mod-list selector tool | "rotacyjne paczki modów" | Size + Workshop/preset link + FAQ |
| FAQ | None visible | Wiki | Wiki/statute | None | Dedicated `<details>` FAQ (differentiator in PL) |
| ORBAT/roster | ORBAT page | Milpacs DB | None | "system specjalizacji" mentioned | Bot-fed roster, last phase |
| Social proof | Stats + testimonials + campaign grid | Announcements, graduations | None | None | Live Discord count, recaps, optional testimonials |
| Activity proof | Campaign list | Live announcements | "Light hibernation" (negative) | Post date | Dated recaps + live online count |

---

## Sources

- Bohemia Interactive, "How to find an Arma 3 unit in 2024": https://arma3.com/news/how-to-find-an-arma-3-unit-in-2024 (MEDIUM to HIGH: official publisher guide on what recruits evaluate)
- Google Search Central, Event structured data (online events unsupported, membership exclusion, 8-region limit): https://developers.google.com/search/docs/appearance/structured-data/event (HIGH)
- Google Search Central, FAQPage (deprecated/removed): https://developers.google.com/search/docs/appearance/structured-data/faqpage and https://developers.google.com/search/blog/2023/08/howto-faq-changes (HIGH)
- Google Search Central, Site names (domain/subdomain root only): https://developers.google.com/search/docs/appearance/site-names (HIGH)
- Google Search Central, "Simplifying search results" (June 2025 deprecations; Event/Organization/Breadcrumb unaffected): https://developers.google.com/search/blog/2025/06/simplifying-search-results (HIGH)
- Discord API live test: `GET /api/v10/invites/DhJwkeehJK?with_counts=true` → 200, CORS reflected origin, member/presence counts. Guild `widget.json` → 50004 "Widget Disabled" (HIGH, tested 2026-10-02)
- Polish recruitment posts in Steam group "ArmA 3 Polish Community": https://steamcommunity.com/groups/arma3-polska/comments (MEDIUM: Vector Tactics, GWAiS, JW Bielik, Aspidis, ARMA COOP CORPS conventions)
- Polish clan listings via search (Klan GAD, DOS, Elite Corps, OSA): https://steamcommunity.com/groups/arma3-polska, https://discord.com/servers/oddzial-specjalny-army-osa-793886952885452840 (MEDIUM)
- ArmaForces (PL) site structure: https://armaforces.com (MEDIUM)
- AFTP (PL) forum, under construction: https://forum.armafans.pl (MEDIUM)
- 16 Air Assault: https://www.16aa.net/ (MEDIUM)
- 7th Cavalry Gaming: https://7cav.us/ (MEDIUM)
- Guild Order Arma 3 unit website builder (what units expect: roster by rank/role, ops calendar, application form): https://guildorder.com/pl/games/arma3/website (LOW to MEDIUM, vendor marketing)
- units.arma3.com fields (about, emblem, members, server/TS info, apply): https://forums.bohemia.net/forums/topic/186322-arma-3-units-feedback-thread/ (MEDIUM)
- r/FindAUnit and Steam unit-recruitment discussions (traits recruits value: new-player friendly, flexible attendance, mature leadership): https://steamcommunity.com/app/107410/discussions/21/4755222397154361483 (LOW to MEDIUM)

---
*Feature research for: Polish Arma 3 milsim clan recruitment/SEO website (IBC)*
*Researched: 2026-10-02*
