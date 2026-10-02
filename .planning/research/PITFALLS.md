# Pitfalls Research

**Domain:** Polish-language static gaming-clan (Arma 3 milsim) recruitment site. Brownfield single-page "tactical HUD" landing page moving to a multi-page, SEO/perf/a11y-hardened static site, with a Discord-bot-fed roster added last.
**Researched:** 2026-10-02
**Confidence:** MEDIUM overall
- HIGH for findings verified directly against this repo (file sizes, CSS, font subsets fetched live from Google Fonts).
- MEDIUM-HIGH for claims taken from official Google Search Central / web.dev pages fetched on 2026-10-02 and backed up by independent reporting.
- LOW-MEDIUM for legal (RODO/GDPR) interpretation. That part is not legal advice.
- Note: the `classify-confidence` seam rates every web provider LOW. The tiers above are my per-claim judgement of where each claim came from.

---

## Repo facts that drive these pitfalls (verified by inspection)

| Fact | Where | Why it matters |
|------|-------|----------------|
| `assets/hero-bg.jpg` is **4.7 MB**, and `hero.jpg` is a byte-identical duplicate | `assets/` | This is the LCP image. It is loaded as a CSS `background-image` (`css/style.css:384`), so the preload scanner can't discover it |
| Gallery images are **3.6–5.0 MB PNGs** (`cos.png`, `funny.png`, `jo_1967.png`) shown at 600x338 | `index.html` gallery | Image weight alone rules out a mobile Performance score of 90 or more |
| `logo.png` is **885 KB** and displayed at 48x48 | header | Probably reused as a favicon / OG / Organization logo too |
| `og:image` is the relative path `assets/hero-bg.jpg` (4.7 MB) | `<head>` | Broken on Discord/Facebook/X previews. Also above the X 5 MB limit |
| Google Fonts loaded via CSS `@import` (Inter 5 weights + Montserrat 7 weights + Share Tech Mono) | `css/style.css:1` | Render-blocking chain. Also sends visitor IPs to Google (GDPR, see Pitfall 9) |
| **Share Tech Mono only ships a `latin` subset. It has no ą ę ł ś ź ż ć ń** | fetched from fonts.googleapis.com | Any "make the HUD font mono again" refresh breaks Polish words (Pitfall 7) |
| `--font-hud: 'Montserrat', 'Share Tech Mono', monospace` | `css/style.css:25` | So the "HUD" look is really Montserrat today. Share Tech Mono is effectively unused dead weight |
| Full-viewport fixed `body::before` scanline overlay at `z-index: 9999`, plus fixed `.grid-bg`, plus 3x `backdrop-filter: blur()` | `css/style.css:59-89, 132, 246, 797` | Paint/compositing cost on mobile. The overlay also lowers the real text contrast that Lighthouse can't measure |
| Nav is hash anchors (`#hero`, `#about`, `#gallery`, `#recruitment`), `body id="hero"`, scroll-spy JS depends on them | `index.html`, `js/main.js` | Hash-to-multi-page migration (Pitfall 5) |
| Discord invite `discord.gg/DhJwkeehJK` hardcoded in 3 places, many inline styles | `index.html:230,265`, `js/main.js:174` | A config-in-one-place requirement exists for the URL. It should cover the invite too |
| `meta keywords` present, JSON-LD type is `SportsTeam` with `sport: "Arma 3 Milsim"` | `<head>` | Low-value or misleading signals (Pitfall 3) |

---

## Critical Pitfalls

### Pitfall 1: Building SEO plumbing against a domain that doesn't exist (relative or placeholder URLs ship to production)

**What goes wrong:**
- `rel=canonical`, `og:url`, `og:image`, sitemap `<loc>`, the robots.txt `Sitemap:` line and JSON-LD `url`/`logo`/`@id` all need **absolute** URLs.
- Without a domain, developers tend to do one of three things:
  - (a) use relative paths. Google says canonical "should" be absolute. The sitemaps protocol and the robots.txt `Sitemap:` directive *require* absolute URLs.
  - (b) hardcode `https://example.com` or a `*.github.io` / `*.netlify.app` URL in many places.
  - (c) leave the tags out "until later" and never add them.
- At domain purchase, half the references get updated. The site then canonicalises to a dead host, or the sitemap lists the wrong origin.

**Why it happens:** The site URL feels like a deploy-time concern, so it gets scattered through templates.

**How to avoid:**
- One `site.url` value in SSG data (e.g. `_data/site.json` or an env var `SITE_URL`). Every absolute URL is *derived* from it with one helper/filter (e.g. `absoluteUrl(path)`).
- Grep-able rule: **no template may contain `https://` + the site's own host.** Only the config value may.
- Build-time guard: if `SITE_URL` is unset or a placeholder, the build still produces relative-safe pages but prints a loud warning and emits `<meta name="robots" content="noindex">` (see Pitfall 2 for the inverse risk).
- Put the Discord invite, social links and `og:image` path in the same config. CONCERNS.md already flags the invite duplicated 3x.

**Warning signs:**
- `grep -r "example.com\|github.io\|netlify.app" _site/` returns hits.
- The sitemap contains `<loc>/` or `<loc>jak-dolaczyc/`.
- The Discord link preview of the site shows no image.

**Phase to address:** Foundation / build setup (first phase). The config value must exist before any SEO tags are written.

---

### Pitfall 2: Pre-domain deployment gets indexed on a throwaway host, or the "noindex until launch" guard leaks into production

**What goes wrong:** Two mirror-image failures.
1. **Indexed on the wrong host.** The user deploys to `*.github.io`, `*.pages.dev` or `*.netlify.app` before buying the domain, and Google indexes that host. After the domain move, the old host keeps serving identical content. You get duplicate content, a split brand query, and the "IBC" knowledge/site-name signals attached to the wrong origin.
   - GitHub Pages auto-301s `*.github.io` to a custom domain once configured.
   - Cloudflare Pages and Netlify **keep the default subdomain live**. You need an explicit redirect rule or canonical.
2. **Guard never removed.** The "noindex until launch" guard is added and then never removed. Lighthouse SEO flags `is-crawlable`, but only if someone runs it on the production URL. Also: a `robots.txt` `Disallow: /` *plus* a `noindex` meta means Google never sees the noindex. Blocked-but-linked URLs can still show up as "Indexed, though blocked by robots.txt".

**Why it happens:** No domain at build time, and the user deploys it themselves (out of scope for this project). Nobody owns the cutover checklist.

**How to avoid:**
- Make indexability a **derived** value: `indexable = SITE_URL is set AND SITE_URL host matches the deploy host`. Don't make it a manual flag.
- Never use `robots.txt Disallow` for staging hiding. Use `noindex` (meta or `X-Robots-Tag`) so Google can actually read it.
- Ship a written **domain cutover checklist** in the repo (README or `.planning`):
  - set `SITE_URL` and rebuild;
  - add a 301 from the platform subdomain to the domain;
  - verify in Search Console (Domain property via DNS TXT);
  - submit the sitemap;
  - re-share the link in Discord with a cache-busted og:image (see Pitfall 11).

**Warning signs:**
- `site:github.io "Inglourious Basterds"` returns results.
- Lighthouse SEO is below 100 with "Page is blocked from indexing".
- Search Console shows "Duplicate, Google chose different canonical than user".

**Phase to address:** Foundation (derived-indexability logic) plus the Technical SEO phase (cutover checklist doc). Verify again at launch.

---

### Pitfall 3: Investing in structured data Google no longer shows, or isn't eligible for (FAQPage, Event)

**What goes wrong:** PROJECT.md lists "Organization, FAQPage, Event, BreadcrumbList". As of 2026:
- **FAQPage rich results are gone.**
  - Restricted to authoritative government/health sites in Aug 2023.
  - Stopped appearing in Google Search for *all* sites on **May 7, 2026**.
  - Docs, report and Rich Results Test support were removed in June 2026.
  - The markup is harmless, but it produces nothing in Google.
- **Event rich results don't apply to IBC operations.**
  - Google's current Event guidelines: "Virtual experiences that have no real-world component aren't supported. Events must take place in a physical location."
  - Membership-only or invite-required events are excluded.
  - The event search experience isn't listed for Poland.
  - Arma 3 ops are online, members-only and recurring, so they miss on three counts. Marking them up as Events with a fake `Place` violates structured-data guidelines (manual-action risk for spammy markup).
- **`SportsTeam` with `sport: "Arma 3 Milsim"`** is a stretch. Google has no SportsTeam rich result, and it muddles entity understanding.
- **BreadcrumbList.** Breadcrumbs were removed from *mobile* SERP display in Jan 2025. They are still supported on desktop. Low value on a 4–5 page site, but cheap.

**Why it happens:** Older SEO checklists and blog posts still recommend FAQ/Event schema as quick wins.

**How to avoid:**
- Ship the schema that still earns something:
  - **`WebSite`** on the home page (`name`, `alternateName: ["IBC", "Inglourious Basterds Clan"]`, `url`). Drives the Google *site name*.
  - **`Organization`** on the home page (`name`, `alternateName`, `url`, `logo` of at least 112x112 that is crawlable and looks fine on white, `foundingDate: "2018"`, `sameAs` with the Discord/YouTube/etc. profile URLs, `@id` = `SITE_URL + "#organization"`).
  - **`BreadcrumbList`** on subpages (optional, cheap).
- **Do not add Event markup.** Show the op schedule as plain visible HTML.
- FAQPage: only if it's free from the SSG. Otherwise skip it. Never let it drive page design. The FAQ page is worth building for *people and long-tail queries*, not for a rich result.
- Validate with the Schema.org validator (validator.schema.org) for syntax. The Rich Results Test only covers *supported* features now, so a "no items detected" there is expected for FAQ.

**Warning signs:**
- A plan task says "add FAQPage schema for rich snippets" or "Event schema for ops".
- The Rich Results Test says FAQ is unsupported and someone tries to "fix" it.

**Phase to address:** Technical SEO / structured-data phase. The roadmapper should **rewrite the Active requirement** to "Organization + WebSite + BreadcrumbList; no Event; FAQPage optional/no-SERP-value".

---

### Pitfall 4: The LCP hero is a 4.7 MB CSS background, so Performance 90+ is impossible without rethinking how it loads

**What goes wrong:**
- The hero image is set in CSS (`.hero { background-image: url('../assets/hero-bg.jpg') }`). The browser only finds it after downloading and parsing `style.css`, which itself waits on the `@import` of Google Fonts CSS.
- web.dev: "Never lazy-load your LCP image". CSS-background LCP images must be preloaded with `fetchpriority="high"`.
- Common wrong fixes:
  - Converting to WebP but keeping it CSS-only, so discovery is still late.
  - Adding `loading="lazy"` to *all* images, including the hero.
  - Preloading one size, so mobile downloads the desktop image.
  - Converting to an `<img>` but forgetting `width`/`height`, which causes CLS.

**How to avoid:**
- Turn the hero into an `<img>` (or `<picture>` with AVIF/WebP/JPEG) with `fetchpriority="high"`, no `loading="lazy"`, explicit `width`/`height`, `object-fit: cover`, and the gradient as a CSS overlay pseudo-element.
- Responsive `srcset` (e.g. 640/1024/1600/1920w). Target a mobile hero under ~120 KB.
- Delete the duplicate `hero.jpg`.
- Gallery: generate 600w/1200w thumbnails and keep the lightbox full-size as a separate ~1920w/~250 KB asset. Today the 5 MB PNGs are the "thumbnails".
- Logo: export a 96x96 and a 192x192 WebP/PNG (under 10 KB each). Separate files for favicon, apple-touch-icon and the Organization logo (512x512).
- Remove the `@import` font chain (see Pitfall 7). It sits directly on the LCP critical path.

**Warning signs:**
- Lighthouse "LCP request discovery" insight (Lighthouse 13 `lcp-discovery-insight`) fails.
- LCP element is `section.hero`.
- Total page weight over 1 MB.

**Phase to address:** Performance/assets phase. It should come **before** the visual refresh, so the refresh is designed inside a known budget.

---

### Pitfall 5: Hash-anchor to multi-page migration breaks existing links, scroll-spy JS, and nav semantics

**What goes wrong:**
- **Fragments never reach the server.** Old shared links like `/#recruitment` can't be 301-redirected by any static host. If "Rekrutacja" moves to `/jak-dolaczyc/`, old links land on the home page at nothing.
- **`js/main.js` breaks on subpages.**
  - Scroll-spy and smooth-scroll code query sections that don't exist on subpages and throw (CONCERNS.md: no null checks).
  - Click handlers that `preventDefault()` on `a[href^="#"]` can hijack `/#about` links from subpages.
- **Nav state is wrong.** `active-nav` driven by scroll position becomes meaningless across pages. Pages need `aria-current="page"` set at build time.
- **Trailing-slash and `.html` inconsistency.** Hosts differ:
  - GitHub Pages serves `/faq.html` at `/faq`.
  - Cloudflare Pages 308-redirects `.html` to extensionless.
  - Netlify has "pretty URLs".
  - If canonical says `/faq` but the host serves `/faq/` (or the reverse), every canonical points at a redirect.
- **GitHub Pages project-site subpath.** This repo is `IBC-Website`. A project Pages deploy lives at `user.github.io/IBC-Website/`. Root-relative links (`/css/style.css`, `/jak-dolaczyc/`) 404 there. Google site names also don't work at subdirectory level.

**Why it happens:** Treating multi-page as "copy index.html N times". Host-agnostic URL behaviour is invisible until deployed.

**How to avoid:**
- **Directory-style URLs** (`/jak-dolaczyc/index.html` served as `/jak-dolaczyc/`) work identically on every static host. Canonicals always use the trailing slash.
- Keep the home-page sections that stay on home (`#o-nas`, `#galeria`) as anchors. For sections that move, add a ~10-line inline script on the home page mapping legacy hashes (`#recruitment` to `/jak-dolaczyc/`) via `location.replace`.
- Split `main.js` into per-feature modules that **no-op when their root element is absent**, and load only on pages that need them.
- SSG `pathPrefix` / base-URL support so the site works under a subpath *and* at a domain root. Test both before declaring the multi-page phase done.
- Consider renaming English anchors to Polish while migrating (`#about` to `#o-nas`). Cosmetic, but consistent with a Polish-only site. Keep the old ones in the redirect map.

**Warning signs:**
- Console errors on any subpage.
- Clicking "O nas" from `/operacje/` does nothing.
- Lighthouse "Links are not crawlable" or 404s in a link checker.
- Deploying to a GitHub Pages project URL shows an unstyled page.

**Phase to address:** Foundation / multi-page structure phase (first). This has to be settled before content pages are added.

---

### Pitfall 6: Visual refresh loses the tactical identity, or keeps every expensive effect "because it's the identity"

**What goes wrong:**
- **Too far:** a "more polished and trustworthy" refresh drifts into a generic dark Tailwind/Bootstrap gaming template. Brackets, mono labels, amber accents and terminal flavour get sanded off, and the clan stops recognising its own site.
- **Not far enough:** every effect is kept at full strength:
  - a full-viewport fixed scanline overlay at `z-index: 9999` above all text;
  - a fixed grid;
  - three `backdrop-filter: blur()` layers;
  - a blinking animation;
  - a typing terminal.
- The result is mobile scroll jank, poor INP on low-end Android, and text that's hard to read.

**Why it happens:** Identity is never written down, so the refresh negotiates every element ad hoc. Effects are judged on a desktop GPU.

**How to avoid:**
- Before the refresh, write a short **identity inventory** in the UI-SPEC: which 5–7 signature elements are kept, e.g. HUD corner brackets, mono uppercase labels with letter-spacing, amber/green accent on near-black, the terminal recruitment block, the subtle grid, the easter egg, the "v2.4.1" version tag. Treat those as non-negotiable and everything else as negotiable.
- **Effect budget per element.**
  - Scanlines: replace the full-screen fixed gradient with a static, low-opacity repeating background on hero/section panels only. Disable it under `prefers-reduced-motion` and `prefers-reduced-transparency`.
  - `backdrop-filter`: keep it only on the header. Give it a solid `rgba` fallback via `@supports not (backdrop-filter: blur())` and on small screens.
  - Blink/typing: honour `prefers-reduced-motion`. The terminal must render final text without JS.
- Use design tokens (CSS custom properties already exist: `--accent-color`, `--font-hud`). Refresh the tokens, not ad-hoc values. Kill the inline styles first (CONCERNS.md lists ~7).
- Before/after screenshot review with a clan member: "does this still feel like IBC?"

**Warning signs:**
- Refresh mockups with no HUD brackets or mono labels.
- Chrome DevTools Performance shows long "Paint"/"Composite Layers" while scrolling on 4x CPU throttle.
- Lighthouse TBT/INP regress after the refresh.

**Phase to address:** Visual refresh / UI phase. It needs a UI-SPEC with the identity inventory and effect budget, and must come *after* the perf phase sets the budget.

---

### Pitfall 7: Font optimisation silently breaks Polish diacritics (ą ę ł ś ź ż ć ń)

**What goes wrong:**
- **Share Tech Mono has only a Latin subset** (verified: Google Fonts serves only `/* latin */`, range U+0000-00FF etc.). It has no glyphs for ą ć ę ł ń ś ź ż.
  - If the refresh makes it the primary HUD font (the natural "make it more tactical" move), words like "Złóż podanie", "Dołącz" and "Instrukcja Zaciągu" render with a mix of fonts. ó comes from Share Tech Mono; ł, ż and ą come from the fallback `monospace`. It looks broken and amateurish to exactly the Polish audience being targeted.
- **Subsetting to `latin` only.** When self-hosting, many tutorials and tools (google-webfonts-helper defaults, `fontsource` "latin" imports, glyphhanger with a Latin range) drop `latin-ext`. Montserrat and Inter then lose Polish characters too.
- **CLS from `font-display: swap`.** Montserrat's metrics differ a lot from Arial/system-ui. Headings in uppercase with letter-spacing reflow noticeably.
- **Too many weights.** 7 Montserrat + 5 Inter weights is 12+ files. Usually 3–4 are actually used.

**How to avoid:**
- Self-host WOFF2 with **`latin` + `latin-ext` subsets** (both `unicode-range` blocks).
- Pick a mono HUD font that supports Polish if mono is wanted, e.g. JetBrains Mono, IBM Plex Mono, Space Mono, Fira Code or Roboto Mono (check `latin-ext` on each), or keep Montserrat as the HUD face as it is today.
- Drop Share Tech Mono entirely unless the glyph gap is accepted for digits/Latin-only UI chrome.
- Cut to about 3 weights per family, or use the variable-font files.
- `<link rel="preload" as="font" type="font/woff2" crossorigin>` for at most 1–2 above-the-fold faces.
- Add a fallback `@font-face` with `size-adjust` / `ascent-override` (e.g. Fontaine or `@capsizecss`-generated) to remove swap CLS.
- Test string on every page: **"Zażółć gęślą jaźń — ZAŻÓŁĆ GĘŚLĄ JAŹŃ"**, rendered in every font role.

**Warning signs:**
- In DevTools > Rendered Fonts, a heading lists two font families.
- The ł/ż glyphs look thinner or wider than neighbours.
- CLS over 0.05 attributed to text nodes in the Lighthouse `cls-culprits-insight`.

**Phase to address:** Performance/assets phase (self-hosting and subsetting) plus the Visual refresh phase (font choice). The test string belongs in verification for both.

---

### Pitfall 8: Thin, keyword-stuffed or unverified AI-drafted Polish content

**What goes wrong:**
- **Stuffing.** To rank for "klan Arma 3", "polski klan milsim", "Arma 3 rekrutacja", copy gets stuffed with unnatural exact-match phrases ("Klan Arma 3 Polska – najlepszy klan Arma 3 milsim w Polsce"). Polish is highly inflected (klan/klanu/klanie/klanem), and forcing nominative exact matches reads as spam to Polish speakers. Google handles Polish morphology, so it doesn't help ranking either.
- **Thin or doorway pages.** Spinning up near-empty pages ("Operacje" with one paragraph, city-targeted variants like "klan Arma 3 Warszawa") gives thin/doorway content. Google's scaled-content-abuse policy covers mass-produced low-value pages regardless of how they were made.
- **Unconfirmed drafts going live.** Per PROJECT.md, Claude drafts the Polish copy with TODO markers. The serious failure is **TODO markers or invented facts shipping**: wrong schedule, wrong modpack, an invented member count, a made-up op recap. For a recruitment site, a wrong fact ("operacje w każdą sobotę o 20:00" when it's actually Friday) directly costs recruits and trust.
- **Leftover keywords meta.** `meta name="keywords"` stays. Google ignores it. Bing has said it treats it as a possible spam signal.

**How to avoid:**
- One primary intent per page:
  - home = brand + "polski klan milsim Arma 3";
  - `/jak-dolaczyc/` = "rekrutacja / jak dołączyć / wymagania";
  - `/operacje/` = "kiedy gramy / rodzaje misji / relacje z operacji".
- Write for humans first. Each page needs substantive unique content: requirements, mod list, schedule, steps, recaps with screenshots.
- **Build-time content lint that fails the build** on `TODO`, `TBD`, `[[`, `XXX`, or a chosen marker like `⟦DO POTWIERDZENIA⟧`. Keep a `FACTS.md` list of every factual claim the user must confirm.
- Remove `meta keywords`.
- Titles: unique per page, brand at the end, Polish keyword up front, about 50–60 characters. E.g. "Jak dołączyć do klanu Arma 3 | IBC". The current "Wizytówka Taktyczna" has no search value.
- Use the vocabulary the Polish Arma community actually uses (modpack, Zeus, ORBAT, TFAR/ACRE, "opy", "sloty"). The user should review the register. AI Polish drifts into calques and an overly formal register.

**Warning signs:**
- The same phrase appears more than 3 times per 300 words.
- Any page under ~250 words of unique text.
- `grep -ri "todo" _site/` finds hits.
- The user can't confirm a sentence when asked "is this true?"

**Phase to address:** Content pages phase (FAQ / Jak dołączyć, Operacje). The content lint should be added in Foundation so it guards every later phase.

---

### Pitfall 9: Roster page leaks Discord members' personal data (RODO/GDPR, Discord Developer Policy)

**What goes wrong:** The bot exports every guild member's nickname, avatar, Discord user ID, roles, join date, maybe activity or "inactive"/"warned" roles. The site publishes all of it to the open web.
- **GDPR/RODO.** Nicknames and avatars that identify a person, and especially user IDs (stable, globally unique identifiers), are personal data. The household exemption doesn't cover publishing to an unlimited public audience (CJEU *Lindqvist*). Poland applies the GDPR default **age of digital consent of 16**. Arma 3 is PEGI 16, but younger members do exist in clans, and their data would need parental consent.
- **Discord Developer Policy.** Developers must not disclose a user's Discord data without their specific, informed consent, and must provide a privacy policy.
- **Wrong technical approaches.**
  - Calling the Discord API from browser JS. This needs the **bot token in client code**: total compromise.
  - Hotlinking `cdn.discordapp.com` avatars. Avatar hashes change, so images break. Attachment URLs are signed and expire after ~24h. Every visitor's IP also goes to Discord, the same issue as Google Fonts below.
  - Client-side-only rendering, which gives CLS and poor indexing.
- **Erasure isn't real.** A member leaves or asks to be removed, but the static build, CDN caches and the Wayback Machine keep them.

**Related, already present: Google Fonts IP leak.** LG München I (20.01.2022) held that loading Google Fonts from Google's servers without consent transmits visitor IPs unlawfully (€100 damages). That's a German court, not binding in Poland, but it reflects how EU DPAs read the issue. Self-hosting fonts (already planned) fixes it. Don't reintroduce third-party requests (Discord CDN, YouTube embeds without `youtube-nocookie` / click-to-load, etc.).

**How to avoid:**
- **Opt-in only.** The roster shows only members who opted in, e.g. via a bot command `/roster dołącz` or a dedicated Discord role. Opt-out removes them on the next build.
- **Data minimisation contract with the bot author:** display name (or chosen callsign), unit/role, rank. Never user IDs, usernames#discriminators, join dates, activity, moderation roles, or real names.
- Bot output is a **static JSON file consumed at build time** (or fetched from a CORS-enabled endpoint holding only the whitelisted fields). The token never leaves the bot host.
- Download avatars at build time into `assets/roster/` (resized WebP), or use rank/unit insignia instead of avatars. That's on-theme for a milsim HUD and avoids face and likeness issues entirely.
- Add a short Polish privacy note page ("Polityka prywatności"): which data, legal basis (consent), how to withdraw (Discord DM / bot command), and who the administrator is (clan leadership contact).
- Schema-validate the JSON at build time and fail closed. If a forbidden field appears, the build fails rather than publishing it.

**Warning signs:**
- Bot JSON samples contain `id`, `username`, `joined_at`, `avatar` hash URLs or `roles` arrays with moderation roles.
- Any `fetch('https://discord.com/api...')` in site JS.
- Network tab shows requests to `cdn.discordapp.com` from the site.

**Phase to address:** Roster phase (last). Write the **data contract (field whitelist + opt-in mechanism)** with the bot author *at the start* of that phase, before UI work. Font self-hosting in the perf phase removes the existing IP leak.

---

### Pitfall 10: Lighthouse 90+ "passes" while real accessibility and performance are still bad

**What goes wrong:**
- **Automated contrast checks miss the overlay.** Lighthouse computes contrast from CSS colours. It **can't see** the fixed scanline overlay (`body::before`, opacity 0.4, at `z-index: 9999` above everything) darkening every pixel of text. Amber/green-on-near-black at small mono uppercase sizes can pass on paper and fail in reality.
- **Things Lighthouse doesn't test:**
  - Modal focus management: lightbox and decryption overlay need focus trap, Esc, and return focus to the trigger.
  - Mobile menu: needs `aria-expanded` sync and Esc to close.
  - Terminal animation: an `aria-live` region spamming screen readers.
  - Keyboard access to the easter egg (`span role="button"` needs Enter/Space handlers).
- **No field data.** PageSpeed Insights needs a public URL (no domain yet), and a small clan site will never have CrUX field data. So Search Console Core Web Vitals will say "not enough data". Teams then optimise to a single noisy lab run.

**How to avoid:**
- Run Lighthouse CI (or `npx lighthouse` against a local static server) on **every page**, mobile preset, **3 runs, median**. Gate at 90 in the verification step of each phase.
- Manual a11y pass per phase:
  - keyboard-only walk-through;
  - NVDA (free, Windows) with Polish voice reading `lang="pl"` content. Mark English UI words with `lang="en"` where they're real English phrases;
  - contrast check with the overlay *on*, by screenshot and pixel sampling.
- Terminal: render the final instructions as static HTML. Animate decoratively with `aria-hidden="true"` on the animated copy. Skip animation under `prefers-reduced-motion`.
- Inline SVG icons that replace Font Awesome: `aria-hidden="true" focusable="false"` on the SVG, and an accessible name on the link (`aria-label="Discord IBC"`). Icon-only links are the most common Lighthouse a11y failure after an icon-font swap.

**Warning signs:**
- Lighthouse a11y is 100 but you can't close the lightbox with Esc, or Tab escapes the modal.
- Scores swing more than 10 points between runs.

**Phase to address:** Accessibility phase (focus/ARIA/reduced motion). Lighthouse gating should be set up in Foundation and enforced in every phase's verification.

---

### Pitfall 11: Discord link previews, the site's main share channel, show broken or stale cards

**What goes wrong:**
- The audience mostly encounters the URL **inside Discord**. Discord embeds use OG tags (`og:title`, `og:description`, `og:image`, `og:site_name`, and the `theme-color` meta for the embed stripe).
- Today `og:image` is relative and 4.7 MB, so no image shows.
- After fixing it, Discord **caches previews per URL** (reported as up to ~7 days or longer) with no manual refresh tool, so the old broken card persists.
- Other common errors:
  - `og:locale="pl-PL"`. The OG format is `pl_PL`.
  - No `og:image:width`/`height`, or `og:image:alt`.
  - Using the same OG image for every page.
  - Missing `twitter:card="summary_large_image"`.

**How to avoid:**
- Dedicated 1200x630 OG JPEG (under 300 KB) with the IBC logo on a HUD background, at an absolute URL from `SITE_URL`. Optionally per-page variants.
- Version the OG image filename (`og-ibc-v2.jpg`) or add `?v=2` so Discord re-fetches.
- Add `<meta name="theme-color" content="#…accent">` so embeds get the clan colour stripe.
- Test by posting the URL in a private Discord channel after deploying (Discord can't preview localhost). Also use opengraph.xyz or similar.

**Warning signs:** The Discord embed shows title only and no image, or a grey stripe.

**Phase to address:** Technical SEO phase (meta/OG). Re-test at domain cutover.

---

## Moderate Pitfalls

### Pitfall 12: Polish slugs generated with a naive slugify that drops "ł" or keeps diacritics
**What goes wrong:**
- Unicode NFD decomposition strips ą/ę/ś/ż, but **ł has no decomposition**. A naive `normalize('NFD').replace(/[^\w-]/g,'')` turns "dołącz" into "docz" and "służba" into "suba".
- Alternatively, slugs keep diacritics (`/jak-dołączyć/`). They work, but are percent-encoded as `%C5%82%C4%85...` when shared and pasted, which looks ugly in Discord and on forums.

**Prevention:**
- Hand-write ASCII-transliterated slugs for a site this small: `/jak-dolaczyc/`, `/operacje/`, `/sklad/` or `/jednostki/`, `/polityka-prywatnosci/`.
- If auto-generated, use a slugify with a Polish charmap (e.g. `@sindresorhus/slugify`, which Eleventy's `slugify` filter uses). Unit-test it on "Złóż, Dołącz, Służba, Źródło".
- Google accepts both forms and recommends audience-language words or transliteration, plus hyphens not underscores.

**Phase:** Foundation (URL scheme decided once and never changed afterwards).

### Pitfall 13: Brand ambiguity, since "IBC" and "Inglourious Basterds" are crowded queries
**What goes wrong:**
- "IBC" collides with intermediate bulk containers, the IBC broadcast show, banks and more.
- "Inglourious Basterds" is the Tarantino film, which will always dominate.
- Teams target the bare brand and conclude "SEO doesn't work".

**Prevention:**
- Brand target is the compound: "IBC Arma 3", "Inglourious Basterds Clan", "IBC klan".
- Put the full name and "Arma 3" in the home `<title>`, H1 and `WebSite.alternateName` / `Organization.alternateName`.
- Get `sameAs` links and backlinks from where Polish Arma players look: Discord server-list sites, Polish Arma forums/Facebook groups, the clan's YouTube, Steam group, and the Arma 3 Units page (units.arma3.com) if used.
- Expect to rank for brand+game, not for bare "IBC".

**Phase:** Technical SEO phase (titles/schema). Off-site listing is a user task to note in the launch checklist.

### Pitfall 14: Stale "Operacje" page signals an abandoned clan
**What goes wrong:**
- The page hardcodes "Najbliższa operacja: 14.11" or a "2026" season, and nobody updates it.
- The footer already hardcodes "© 2026".
- A visitor six months later sees a past date and assumes the clan is dead. This is the worst possible recruitment signal.

**Prevention:**
- Describe the *recurring* schedule ("piątki i soboty, 20:00 czasu polskiego"), not a specific next date.
- Op recaps are dated archive entries (stale-proof).
- Footer year comes from the build date.
- If a "next op" widget is ever wanted, have it come from bot data with a hide-if-past rule.
- Dates: use `Europe/Warsaw` and remember the DST offset change (+01:00 / +02:00) if any machine-readable times are emitted.

**Phase:** Content pages phase.

### Pitfall 15: Shared header/footer duplicated by hand instead of templated
**What goes wrong:** Without an SSG layout, each new page copies `<header>`, `<nav>`, `<footer>`, `<head>` meta and the Discord link. They drift within weeks: one page keeps the old invite, another misses canonical.

**Prevention:**
- Adopt the light SSG in the *first* phase (PROJECT.md already allows it).
- One base layout. Per-page front matter for `title`, `description`, `slug`, `ogImage`, `breadcrumbs`.
- `<head>` SEO tags generated from front matter only.

**Phase:** Foundation.

### Pitfall 16: Font Awesome to SVG swap regressions
**What goes wrong:**
- Icons lose accessible names, change visual size or alignment (icon fonts sit on the text baseline; SVGs don't), or brand icons get copied with no licence check.

**Prevention:**
- Use Simple Icons (CC0) for Discord/YouTube/Steam brand marks, or the Font Awesome Free brand SVGs. Those are CC BY 4.0, so keep the attribution comment.
- Use a single `icon` include/shortcode that sets `width`/`height` in em, `fill="currentColor"`, `aria-hidden="true"`, `focusable="false"`.

**Phase:** Performance/assets phase.

### Pitfall 17: The lightbox loads the original multi-MB images on click
**What goes wrong:** After thumbnails are optimised, `data-src` still points at the 5 MB PNG. Lighthouse doesn't see it because it's post-load, but mobile users on data do.

**Prevention:**
- The image pipeline emits a "large" derivative (about 1920w WebP/AVIF, under 300 KB).
- `data-src` / `srcset` reference it.
- Originals stay out of the deploy output, or in a non-linked `originals/` folder kept outside the published site.

**Phase:** Performance/assets phase.

---

## Minor Pitfalls

### Pitfall 18: `hreflang` / locale over-engineering
**What goes wrong:**
- `hreflang` tags get added on a single-language site, or `lang="pl-PL"` in some places and `pl` in others.
- `og:locale` gets the wrong format.

**Prevention:**
- `<html lang="pl">` everywhere and `og:locale="pl_PL"`. No `hreflang` at all, since there's only one language version.

### Pitfall 19: Polish typography details that undercut "trustworthy"
**What goes wrong:**
- Single-letter words (w, z, i, a, o, u) left hanging at line ends violate Polish typographic convention.
- English quotes appear instead of „…”.
- Dates come out as "11/14" instead of "14.11.2026" or "14 listopada".

**Prevention:**
- A build-time filter inserting `&nbsp;` after single-letter conjunctions/prepositions.
- `Intl.DateTimeFormat('pl-PL')` for dates.

### Pitfall 20: Chasing PWA or manifest for a score that no longer exists
**What goes wrong:**
- Time spent on a service worker or offline mode for a recruitment brochure. Lighthouse dropped the PWA category in v12.
- A misconfigured service worker can pin users to stale content, including an old Discord invite.

**Prevention:**
- `site.webmanifest` + favicons for tab and home-screen polish only. **No service worker.**

### Pitfall 21: Expired or rotated Discord invite
**What goes wrong:** The invite (`discord.gg/DhJwkeehJK`) expires or gets revoked during an anti-raid cleanup, and every CTA on every page dead-ends. That is the core-value funnel.

**Prevention:**
- Single config value (Pitfall 1).
- Create a **non-expiring, unlimited-use** invite tied to a welcome channel.
- Optionally a static `/discord/` redirect page (meta refresh + link) so shared links survive invite rotation.
- A link checker in CI flags a 404 invite.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode `https://placeholder` until domain bought | Tags "work" in validators | Silent wrong canonicals/sitemap at launch | Never. Use the single `SITE_URL` config |
| Copy-paste header/footer per page | No build tool needed | Drift (stale invite, missing meta) | Never once there are 2 or more pages |
| Keep 5 MB originals in `assets/` and just add `loading="lazy"` | Fast to do | LCP/page weight still fail; lightbox still heavy | Never for deployed assets. Keep originals in an unpublished `src/` folder |
| Add FAQPage/Event schema "for future-proofing" | Feels thorough | Wasted effort; Event markup on online ops violates guidelines | FAQPage only if free via SSG. Event never |
| Client-side fetch of roster JSON | No rebuild on roster change | CLS, weak indexing, CORS/rate-limit issues, exposure risk | Acceptable only if the endpoint returns whitelisted opt-in fields and the layout reserves space |
| `font-display: swap` without metric overrides | Quick fix for render-blocking fonts | CLS on uppercase HUD headings | MVP only. Add `size-adjust` fallbacks before the a11y/perf gate |
| Leaving inline `style=""` during refresh | Less refactor | Refresh tokens can't reach them; CSP `style-src` harder later | Never during refresh. Remove them first |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Discord bot to roster | Browser calls the Discord API with the bot token; publishes IDs/usernames/join dates | Bot exports whitelisted, opt-in JSON. Consumed at build time. Avatars downloaded and resized or replaced with insignia |
| Discord embeds (link previews) | Relative/huge `og:image`; expecting instant refresh | Absolute 1200x630 under 300 KB, versioned filename, `theme-color`, test in a private channel |
| Discord CDN | Hotlinking avatar/attachment URLs | Attachment URLs are signed and expire (~24h); avatar hashes change. Copy at build time |
| Google Fonts | `@import` in CSS (render-blocking) or `<link>` to Google (GDPR IP transfer) | Self-host WOFF2 with latin + latin-ext, preload 1–2 faces |
| YouTube (op recaps, if added) | Standard iframe embeds: heavy, third-party cookies/IP | `youtube-nocookie.com` plus click-to-load facade (thumbnail + play button) |
| Static host (unknown) | Assuming `/page` vs `/page/` vs `/page.html` behave the same; root-relative paths under a GitHub project subpath | Directory-style URLs, trailing-slash canonicals, SSG `pathPrefix` tested |
| Search Console | Waiting until launch to verify; URL-prefix property for the wrong protocol/host | Domain property via DNS TXT on purchase day; submit the sitemap immediately |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full-viewport fixed overlays (`body::before` scanlines, `.grid-bg`) | Scroll jank, high "Composite Layers" time | Static backgrounds on panels; drop the full-screen fixed layer on mobile | Mid/low-end Android at 4x CPU throttle; the Lighthouse mobile profile |
| Multiple `backdrop-filter: blur()` | Dropped frames when modals/header are over imagery | Header only; solid fallback on small screens | Any phone without a strong GPU |
| LCP via CSS background | LCP over 4s, "LCP request discovery" failure | `<img fetchpriority="high">` or a preload | Every mobile run |
| Gallery growth (CONCERNS: 4 items hardcoded) | Page weight climbs with each op recap | Build-time image pipeline; lazy-load below the fold; paginate the recap archive | Around 15–20 images on one page |
| Typing-terminal JS with timers on load | TBT/INP spikes, layout shifts as lines append | Reserve a fixed height; start on IntersectionObserver; skip under reduced motion | Low-end devices; interaction during animation |
| Async roster render | CLS when the list pops in | Build-time render, or reserved min-height plus skeleton | As soon as the roster ships |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Bot token or API key in site JS/repo | Bot hijack; server raided/nuked via the bot | Token lives only on the bot host. Site gets static JSON. Add secret scanning (`gitleaks`) to CI |
| Publishing members' Discord IDs/usernames | Doxxing/harassment across platforms; RODO breach | Field whitelist and opt-in (Pitfall 9) |
| Publishing minors' data | Parental-consent requirement under 16 in PL | Opt-in flow confirms the member is 16 or older, or show callsign + insignia only |
| No CSP once third-party scripts are removed | Missed cheap hardening | After self-hosting everything: `default-src 'self'` via host headers (`_headers` file for Netlify/Cloudflare). GitHub Pages can't set headers, so use a meta CSP subset |
| Footer `target="_blank"` links without `rel="noopener"` | Minor tabnabbing | Already mostly `noopener noreferrer`. Enforce in the link include |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Recruitment steps only inside the animated terminal | Users who scroll fast, screen-reader users and Google miss them | Static, numbered `<ol>` steps on `/jak-dolaczyc/`. Terminal is decoration |
| Discord CTA buried or present only at page bottom | Lower conversion (the core value) | Persistent header CTA "Dołącz na Discord" on every page, plus an end-of-page CTA |
| HUD jargon replacing plain labels in nav ("System", "Baza wiedzy") | First-time visitors don't know where to click; weaker internal-link anchor text | Plain Polish nav labels ("Start", "O nas", "Jak dołączyć", "Operacje", "Skład"). Keep HUD flavour in badges and subtitles |
| Easter egg overlay with long paragraphs (CONCERNS bug) | Cut off on mobile, traps focus | Scrollable dialog, focus trap, Esc. Keep it, since it's identity |
| Uppercase + letter-spaced mono for body-length text | Slower reading, worse for dyslexic readers | Uppercase HUD style for labels/headings only; sentence-case Inter/Montserrat for paragraphs |

## "Looks Done But Isn't" Checklist

- [ ] **Canonical/OG/sitemap:** all URLs are absolute and derived from `SITE_URL`. Verify: `grep -rE '(href|content|loc)="/' _site/` returns no SEO-tag hits, and there's no hardcoded host outside config.
- [ ] **robots.txt:** contains an absolute `Sitemap:` line and no leftover `Disallow: /`.
- [ ] **Indexability:** production build has no `noindex`. Staging/unset-domain build has it.
- [ ] **Polish glyphs:** "Zażółć gęślą jaźń" renders in a single font family for every font role (DevTools Rendered Fonts).
- [ ] **Fonts:** zero requests to `fonts.googleapis.com` / `fonts.gstatic.com` / `cdnjs` in the Network tab.
- [ ] **Hero:** LCP element is an `<img>` with `fetchpriority="high"`, not lazy, with width/height. Mobile LCP under 2.5s in a throttled run.
- [ ] **Lightbox:** opens a derivative under 300 KB, not the 5 MB original.
- [ ] **Legacy hashes:** `/#recruitment`, `/#about`, `/#gallery`, `/#hero` all land somewhere sensible.
- [ ] **Subpages:** zero console errors. Nav has `aria-current="page"`.
- [ ] **Subpath:** site works under both `/` and `/IBC-Website/` (if GitHub project Pages is used).
- [ ] **Content:** build fails on `TODO`/`TBD`/marker strings. Every fact in `FACTS.md` is ticked by the user.
- [ ] **Structured data:** passes validator.schema.org. Organization logo is at least 112x112 and absolute. No Event markup.
- [ ] **Discord embed:** posted in a private channel, it shows image + title + description + colour stripe.
- [ ] **Modals:** lightbox, mobile menu and decryption overlay all trap focus, close on Esc and return focus.
- [ ] **Reduced motion:** with OS "reduce motion" on, there's no blink, typing or smooth-scroll animation.
- [ ] **Roster:** JSON contains only whitelisted fields, only opted-in members, no `cdn.discordapp.com` requests, and a privacy note page is linked from the footer.
- [ ] **Lighthouse:** mobile, every page, median of 3, at least 90 in all four categories.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong-host indexing (platform subdomain) | MEDIUM | 301 from the platform subdomain to the domain (or canonical if the host can't redirect); Search Console Change of Address only works between verified domains; wait weeks |
| noindex shipped to production | LOW–MEDIUM | Remove, rebuild, request indexing in Search Console. Recovery takes days to weeks |
| Stale Discord embed | LOW | Rename/version the og:image file, re-share |
| Polish glyph breakage live | LOW | Swap the HUD font or add latin-ext subset files and rebuild |
| Member data published without consent | HIGH | Remove immediately and rebuild; request Wayback exclusion; notify affected members; assess Art. 33 breach-notification duty (72h to UODO if there's risk to rights) |
| Slugs changed after indexing | MEDIUM | Per-URL redirects (host-specific `_redirects`, or meta-refresh + canonical stub pages on hosts without redirect support) |
| Wrong facts on a recruitment page | LOW | Fix the copy; add the fact to `FACTS.md`; tighten the content lint |

## Pitfall-to-Phase Mapping

Phase names are suggestions. The roadmapper assigns numbers. Recommended order: Foundation, then Perf/Assets, Technical SEO, A11y, Visual refresh, Content pages, Roster, plus the Launch checklist (user-run).

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1 Domain-less absolute URLs | Foundation (SSG + `SITE_URL` config) | grep for hosts outside config; sitemap/canonical spot-check with two different `SITE_URL` values |
| 2 Wrong-host indexing / leaked noindex | Foundation + Launch checklist | Build with and without `SITE_URL`; diff robots meta |
| 3 FAQ/Event schema dead ends | Technical SEO | Schema list is Organization + WebSite + BreadcrumbList; validator.schema.org passes |
| 4 CSS-background 4.7 MB LCP | Perf/Assets | Lighthouse `lcp-discovery-insight` passes; mobile LCP under 2.5s lab |
| 5 Hash-to-multi-page breakage | Foundation | Legacy-hash test; zero console errors on all pages; subpath test |
| 6 Identity lost / effects too costly | Visual refresh (UI-SPEC with identity inventory + effect budget) | Clan-member review; 4x CPU throttle scroll trace; Lighthouse doesn't regress |
| 7 Polish diacritics in fonts | Perf/Assets (subsets) + Visual refresh (font choice) | "Zażółć gęślą jaźń" single-family check |
| 8 Thin/stuffed/unverified copy | Foundation (content lint) + Content pages | Build fails on markers; `FACTS.md` all confirmed; at least 250 unique words per page |
| 9 Roster privacy / bot integration | Roster (data contract first) + Perf (self-host fonts) | JSON schema whitelist test; no third-party requests; privacy page live |
| 10 Lighthouse-green but inaccessible | A11y (plus a Lighthouse gate in every phase) | Keyboard + NVDA walkthrough; overlay-on contrast check |
| 11 Discord embed broken/stale | Technical SEO + Launch | Private-channel embed test |
| 12 Slugify drops "ł" | Foundation | Slug unit test or hand-written slug list |
| 13 Brand ambiguity | Technical SEO | Titles/H1/alternateName include "Arma 3" + full name |
| 14 Stale ops page | Content pages | No hardcoded future dates; footer year from build |
| 15 Hand-duplicated layout | Foundation | Single base layout; no duplicated `<header>` markup in source |
| 16 Icon swap regressions | Perf/Assets | Lighthouse a11y "links have discernible name" passes |
| 17 Lightbox originals | Perf/Assets | Network tab on lightbox open is under 300 KB |
| 21 Invite expiry | Foundation (config) + Launch | Link checker in CI; invite set to never expire |

## Sources

- Google Search Central, FAQ (FAQPage) structured data. Deprecation notice: FAQ rich results stopped May 7, 2026, docs removed June 2026. https://developers.google.com/search/docs/appearance/structured-data/faqpage (fetched 2026-10-02)
- Independent reports of the FAQ removal: https://www.searchenginejournal.com/google-drops-faq-rich-results/574429/ ; https://jsonld.com/google-faq-rich-results-deprecated/ ; https://www.techwyse.com/news/ai-search/google-faq-rich-results-deprecated-2026
- Google Search Central, Event structured data ("Virtual experiences that have no real-world component aren't supported"; membership-only excluded; regional availability). https://developers.google.com/search/docs/appearance/structured-data/event
- Google Search Central blog, Simplifying search results (7 types phased out, June 12, 2025). https://developers.google.com/search/blog/2025/06/simplifying-search-results
- Breadcrumbs removed from mobile SERPs (Jan 2025), markup still supported: https://www.searchenginejournal.com/google-drops-breadcrumbs-from-mobile-search-results/538091/ ; https://sitebulb.com/resources/guides/breadcrumbs-in-seo-what-googles-mobile-change-actually-means/
- Google Search Central, Organization structured data (logo at least 112x112, alternateName, sameAs). https://developers.google.com/search/docs/appearance/structured-data/organization
- Google Search Central, Site names (WebSite markup; no subdirectory-level site names). https://developers.google.com/search/docs/appearance/site-names
- Google Search Central, Consolidate duplicate URLs (absolute canonicals; no robots.txt/noindex for canonicalisation). https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Google Search Central, URL structure (transliteration, percent-encoding, hyphens, fragments). https://developers.google.com/search/docs/crawling-indexing/url-structure
- web.dev, Optimize LCP (preload CSS-background LCP images, fetchpriority, never lazy-load LCP). https://web.dev/articles/optimize-lcp
- web.dev, Font best practices (avoid @import, WOFF2, unicode-range subsetting, size-adjust). https://web.dev/articles/font-best-practices
- Chrome for Developers, Lighthouse 13 (insight-based audits, scoring unchanged, Oct 2025). https://developer.chrome.com/blog/lighthouse-13-0
- Google Fonts CSS API, fetched live: Share Tech Mono serves only a `latin` subset; Montserrat serves latin + latin-ext. https://fonts.googleapis.com/css2?family=Share+Tech+Mono
- LG München I, 20.01.2022 (3 O 17493/20), Google Fonts IP transfer: https://forge12.com/en/?p=13198 ; https://www.uni-regensburg.de/universitaet/aktuelles/nachrichten/nachricht/04-04-2022_dynamische-einbindung-von-google-fonts-ohne-einwilligung-verstoesst-gegen-dsgvo
- Discord Developer Policy (consent before disclosing user data; privacy policy requirement): https://support-dev.discord.com/hc/articles/8563934450327. Direct fetch returned 403; content taken from search snippets, LOW-MEDIUM.
- Discord expiring signed attachment URLs: https://www.bleepingcomputer.com/news/security/discord-will-switch-to-temporary-file-links-to-block-malware-delivery
- Discord embed caching and cache-busting: https://israynotarray.com/en/misc/2026/05/14/force-refresh-social-og-cache-with-v-1-query-string/ ; https://env.dev/guides/opengraph-image-not-showing
- GDPR Art. 8 and the Polish age of digital consent (16): https://odo24.pl/en/rodo-nawigator-online/rodo/8 ; https://ceelegalmatters.com/poland/5941-new-rules-on-consent-to-data-processing
- Polish slug/transliteration practice: https://developers.google.com/search/docs/crawling-indexing/url-structure?hl=pl ; https://landingi.com/pl/blog/czy-domeny-moga-miec-polskie-znaki/
- Repo inspection: `index.html`, `css/style.css`, `assets/` file sizes, `.planning/codebase/CONCERNS.md` (2026-10-02)

---
*Pitfalls research for: Polish static Arma 3 milsim clan recruitment site (SEO + performance + accessibility + visual refresh + Discord roster)*
*Researched: 2026-10-02*
