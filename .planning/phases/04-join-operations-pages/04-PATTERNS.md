# Phase 4: Join & Operations Pages - Pattern Map

**Mapped:** 2026-10-11
**Files analyzed:** 27 (new + modified, incl. test ripple)
**Analogs found:** 26 / 27 (all paths below verified git-tracked)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/_data/operations.js` (NEW) | data/config | build-time transform | `src/_data/gallery.js` | exact |
| `src/_data/join.js` (NEW) | data/config | build-time transform | `src/_data/gallery.js` | exact |
| `src/_data/discord.js` (NEW, async) | data | request-response (build fetch) | `src/_data/site.js` (env switch) + `lib/images.js` (memo) | partial |
| `src/_data/navigation.js` (EDIT) | config | — | itself | exact |
| `src/_data/site.js` (EDIT: `discord.membersBackstop`) | config | — | itself lines 89-91 | exact |
| `src/jak-dolaczyc.njk` (NEW) | page template | static render | `src/404.njk` | exact |
| `src/operacje.njk` (NEW) | page template | static render | `src/404.njk` + gallery loop in `src/index.njk` | exact |
| `src/index.njk` (EDIT) | page template | static render | itself | — |
| `src/_includes/partials/breadcrumbs.njk` (NEW) | partial | static render | `src/_includes/partials/discord-cta.njk` / header nav loop | role-match |
| `src/_includes/partials/header.njk` (EDIT) | partial | static render | itself line 22 | exact |
| `src/_includes/partials/head.njk` (EDIT) | partial | static render | itself line 62 | exact |
| `lib/schema.js` (EDIT) | utility (pure builder) | transform | itself `buildSchemaGraph` | exact |
| `lib/discord.js` (NEW) | utility/service | request-response | `lib/images.js` (memo, guards) + `lib/schema.js` (pure) | partial |
| `lib/images.js` (EDIT: recaps) | utility | file-I/O batch | itself lines 79-94 | exact |
| `lib/check-seo.js` (EDIT: G11, G12) | gate | batch/validation | `checkJsonLd` lines 191-210 | exact |
| `lib/reject-output.js` (EDIT FIRST, CR-01) | utility | file-I/O | itself | — |
| `eleventy.config.js` (EDIT: `pageGraph` filter) | config | — | lines 7, 20-21 | exact |
| `src/js/main.js` (EDIT: 2 loaders) | entry/loader | event-driven | itself lines 7-13 | exact |
| `src/js/modules/hash-redirect.js` (NEW) | client module | event-driven | `src/js/modules/terminal.js` | role-match |
| `src/js/modules/discord-badge.js` (NEW) | client module | request-response + IO observer | `src/js/modules/terminal.js` | exact (observer + data-* + textContent) |
| `src/js/modules/terminal.js` (EDIT: drop `getElementById('recruitment')`) | client module | event-driven | itself line 7 | — |
| `src/css/partials/pages.css` (NEW) | style | — | `src/css/partials/recruitment.css` | exact |
| `src/css/style.css` (EDIT: @import) | style bundle | — | lines 6-15 | exact |
| `FACTS.md` (EDIT) | docs | — | itself | exact |
| `test/pages.test.js` (NEW) | test | build + assert | `test/schema.test.js` | exact |
| `test/discord.test.js` (NEW) | test | unit | `test/schema.test.js` (unitSite) + `test/client.test.js` (stub DOM) | role-match |
| `test/helpers.js` + layout/devpages/seo-files/client/modules/schema/css/icons/seo-gate tests (EDIT) | test | — | see RESEARCH Pitfall 4 table | exact |

## Pattern Assignments

### `src/_data/operations.js`, `src/_data/join.js` (data, transform)
**Analog:** `src/_data/gallery.js` (lines 1-29)
```js
// Single source of the gallery content: the home gallery loop renders these entries and
// lib/images.js processes each `file` (thumbnails and the 1600 w lightbox variant).
// The order of the array is the display order on the page and in the lightbox.
export default [
  {
    file: "jo_1967.png",
    title: "Operacja Crimson Dawn",
    desc: "Joint Operations 1967 // Wsparcie CAS",
    alt: "Atak plutonu na pozycje Chedaki JO 1967",
  },
  ...
];
```
- Header comment states "single source" + consumers. Double quotes, trailing commas (data files style).
- Operations: export an object `{ updated, draft?, schedule, missionTypes[], eras[], evening[], recaps[] }`; recaps newest first, each with `draft: "TODO(FACTS-NN)"`, `file`, `date` (ISO), `title`, `era`, `type`, `text`, `alt`.
- Join: `{ requirements[], steps[], faq[{ question, answer, draft? }] }`. Marker NEVER inside `question`/`answer` (leaks into FAQPage). Answers plain text.
- Draft-marker form is the literal string field `draft: "TODO(FACTS-NN)"` (RESEARCH Pattern 2; matched by `test/facts.test.js:117` regex), rendered as `{% if x.draft %}<!-- {{ x.draft }} -->{% endif %}`.

### `src/_data/discord.js` (async global data)
**Analogs:** env-switch style from `src/_data/site.js` lines 62-63 (`const indexable = process.env.SITE_INDEXABLE === "1";` strict-string switch); import style from `src/_data/site.js` line 10 (`import { localHosts } from "../../lib/seo.js";`). Body: RESEARCH Pattern 7 (`export default async function`, `process.env.DISCORD_FETCH === "0"` skip, backstop from `site.discord.membersBackstop`).

### `src/_data/site.js` (EDIT)
Extend lines 89-91 only:
```js
  discord: {
    invite: "https://discord.gg/DhJwkeehJK", // the only literal copy of the invite
  },
```
Add `membersBackstop: <n>, // D-16 fallback when the build fetch fails` with a comment. Invite literal must stay single (test/links.test.js (g)).

### `src/_data/navigation.js` (EDIT)
Current (lines 1-8) — replace array per RESEARCH Pattern 4; Start stays `"/#hero"` (scroll-spy only manages hash links). Keep header comment style.

### `src/jak-dolaczyc.njk`, `src/operacje.njk` (page templates)
**Analog:** `src/404.njk` (lines 1-18)
```njk
---
layout: layouts/base.njk
title: "404 – Nie znaleziono strony"
permalink: /404.html
eleventyExcludeFromCollections: true
todo: "FACTS-02"
---
<section class="section-container">
  <div class="section-header">
    <h1>404 // UTRACONO SYGNAŁ</h1>
    <p>Status // Brak sygnału z tego sektora</p>
  </div>
  <p>...</p>
  <div class="hero-btn-group">
    <a href="/" class="hud-btn active">Wróć na stronę główną</a>
    <a href="{{ site.discord.invite }}" target="_blank" rel="noopener noreferrer" class="hud-btn">{% icon "discord" %} Dołącz na Discordzie</a>
  </div>
</section>
```
- Differences: `permalink: /jak-dolaczyc/` / `/operacje/`; NO `eleventyExcludeFromCollections` (must reach sitemap); add required `description` (G4); add `breadcrumb: "Jak dołączyć"` / `"Operacje"`; `faqSchema: true` on join page; `todo:` only if description is drafted.
- Exactly one `<h1>` in `.section-header`. `{% include "partials/breadcrumbs.njk" %}` before the section.
- Discord CTA: copy the 404 line 16 anchor verbatim (invite only through `site.discord.invite`).
- Recap images: `{% picture r.img, { "alt": r.alt, "loading": "lazy", "decoding": "async", "sizes": "..." } %}` reading `images.recaps` (sync shortcode, header.njk line 5 shows call shape).
- Dates: `<time datetime="{{ r.date }}">` with a Polish formatted date (add a filter using `Intl.DateTimeFormat('pl-PL', {..., timeZone: 'UTC'})` in eleventy.config.js next to lines 17-21).

### `src/_includes/partials/header.njk` (EDIT)
Line 22 today:
```njk
<li><a href="{{ item.href }}"{% if page.url == "/" and loop.first %} class="active-nav"{% endif %}>{{ item.label }}</a></li>
```
Add `{% elif item.href == page.url %} class="active-nav" aria-current="page"` (RESEARCH Pattern 4). Home must keep only `class="active-nav"` (devpages/seo-files header byte-equality tests).

### `src/_includes/partials/breadcrumbs.njk` (NEW)
No direct analog; follow header nav loop markup style (2-space indent, `{% for %}`). `<nav class="breadcrumbs" aria-label="Okruszki"><ol><li><a href="/">Start</a></li><li aria-current="page">{{ breadcrumb }}</li></ol></nav>` — hrefs unprefixed, HtmlBasePlugin prefixes.

### `src/_includes/partials/head.njk` (EDIT)
Copy line 61-62 pattern:
```njk
  {# D-14: Organization + WebSite on the home page only; jsonLd escapes "<", so this is the head's only safe #}
  {% if isHome %}<script type="application/ld+json">{{ site | schemaGraph | jsonLd | safe }}</script>{% endif %}
```
Add a sibling `{% if breadcrumb %}<script type="application/ld+json">{{ site | pageGraph({ url: page.url, breadcrumb: breadcrumb, faq: (join.faq if faqSchema else null) }) | jsonLd | safe }}</script>{% endif %}`. Update the comment (the "only safe" note).

### `lib/schema.js` (EDIT)
**Analog:** `buildSchemaGraph` lines 15-42. Copy: base `const home = site.url + site.pathPrefix;`, return `{ "@context": "https://schema.org", "@graph": [...] }`, pure exported functions, header comment listing consumers. Add `buildBreadcrumbList`, `buildFaqPage`, `buildPageGraph` exactly as RESEARCH Pattern 3. Update file header comment (line 1-4 currently says "home page only").

### `eleventy.config.js` (EDIT)
Lines 7, 20-21:
```js
import { buildSchemaGraph, jsonLd } from "./lib/schema.js";
  eleventyConfig.addFilter("schemaGraph", buildSchemaGraph);
  eleventyConfig.addFilter("jsonLd", jsonLd);
```
Add `buildPageGraph` import + `eleventyConfig.addFilter("pageGraph", buildPageGraph);` (+ optional `plDate` filter).

### `lib/images.js` (EDIT)
**Analog:** gallery loop lines 79-94:
```js
    const galleryImages = [];
    for (const entry of gallery) {
      const thumb = await run(entry.file, "thumb");
      const lightbox = await run(entry.file, "lightbox");
      galleryImages.push({ ...entry, thumb, lightbox });
    }
    ...
    const all = [hero, ...galleryImages.flatMap((item) => [item.thumb, item.lightbox]), logo];
    const files = new Set(all.flatMap((meta) => Object.values(meta).flat().map((entry) => entry.outputPath)));
    return { images: { hero, gallery: galleryImages, logo }, files };
```
Add `import operations from "../src/_data/operations.js";` next to line 11, a `recapImages` loop with `run(entry.file, "thumb")` → `{ ...entry, img }`, include in `all`, return `images.recaps`. Update the line 76-78 doc comment. `run()` path guard (lines 57-72) covers new files automatically.

### `lib/discord.js` (NEW)
Header-comment convention from `lib/images.js` lines 1-7 / `lib/schema.js` lines 1-4 ("Build-time code outside src/ ..."). Memo pattern from `lib/images.js` lines 74-80:
```js
let pending = null;
export function processImages() {
  pending ??= (async () => { ... })();
  return pending;
}
```
Body per RESEARCH Pattern 7 (`inviteCode`, `inviteApiUrl`, `floorCount`, `fetchInviteCounts` with injectable `fetchImpl`, `try/catch → null`). Input-validation throw style like `run()` line 62 (`throw new Error(\`...: ${fileName}\`)`).

### `src/js/main.js` (EDIT)
Lines 7-13 frozen map; add two literal entries (never build specifiers):
```js
  'easter-egg': () => import('./modules/easter-egg.js'),
  'hash-redirect': () => import('./modules/hash-redirect.js'),
  'discord-badge': () => import('./modules/discord-badge.js')
```
Single quotes, no trailing comma (client JS style).

### `src/js/modules/discord-badge.js`, `hash-redirect.js` (NEW)
**Analog:** `src/js/modules/terminal.js` lines 1-21:
```js
/* --- TACTICAL RECRUITMENT TERMINAL --- */
// Hook: data-js="terminal" on #terminal-console. The invite comes only from its
// data-discord-url attribute (build-time config) and is written with textContent.
export function init(el) {
  if (!el) return;
  const discordUrl = el.getAttribute('data-discord-url') || '';
  ...
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !booted) { ... }
    });
  }, { threshold: 0.3 });
  observer.observe(recSection);
}
```
- `/* --- NAME --- */` header + `// Hook:` comment; `export function init(el)`; guard clause `if (!el) return;`; config via `getAttribute('data-*') || ''`; text via `textContent` only; single quotes, semicolons; no console. Bodies in RESEARCH Patterns 5 and 7.

### `src/js/modules/terminal.js` (EDIT)
Line 7 `const recSection = document.getElementById('recruitment');` → `el.closest('section')` (Pitfall 1). Update `test/client.test.js` stub accordingly.

### `src/index.njk` (EDIT)
Section `id="recruitment"` → `id="rekrutacja"` + `data-js="hash-redirect"`; "Pełna instrukcja →" link with `data-legacy-hash="recruitment"`; hero "Złóż podanie" href `#recruitment` → `/jak-dolaczyc/`; badge markup (RESEARCH Pattern 7) after teaser Discord button; stat wording per D-09. Keep the terminal Discord button (layout.test `inviteHrefs.length >= 3`).

### `src/css/partials/pages.css` (NEW) + `src/css/style.css`
**Analog:** `src/css/partials/recruitment.css` lines 1-30: start with `/* --- SECTION NAME --- */`, kebab-case component classes (`.breadcrumbs`, `.faq-item`, `.join-steps`, `.evening-timeline`, `.recap-card`, `.discord-badge`), only `var(--*)` colors. Import in `style.css` between `recruitment.css` (line 13) and `footer.css`/before `responsive.css` (line 15); update `test/css.test.js:178` `partialOrder`. Watch CSS budget (3957/5120 B gzip).

### `lib/check-seo.js` (EDIT: G11, G12)
**Analog:** `checkJsonLd` lines 191-210 — iterate `jsonLdScripts(html)`, `JSON.parse` in try/catch, `report(N, "message")`. G11: subpages (non-home indexable) have a BreadcrumbList whose items have `position`/`name`/`item` and last `item` equals canonical. G12: FAQPage `mainEntity[].name` equals visible `<summary>` texts (decode entities, Pitfall 6). Add to header comment line 7-8 list.

### `test/pages.test.js`, `test/discord.test.js` (NEW)
**Analog:** `test/schema.test.js` lines 1-40: header comment of what is checked; `import { before, test } from "node:test"; import assert from "node:assert/strict";`; `import { build, read, ... } from "./helpers.js";`; unit fixtures like `unitSite` (lines 18-24); `jsonLdBlocks(html)` helper (lines 31-35). Build names prefixed with the suite name.

### `test/helpers.js` (EDIT)
Add `"DISCORD_FETCH"` to `buildEnvKeys` (lines 24-31) and default it to `"0"` in `build()`/`runBuild()` (like `ALLOW_LOCAL_SITE_URL: "1", ...env` in `build()` line 64).

## Shared Patterns

### Build-time config to client via data-* + textContent
Source: `src/js/modules/terminal.js` lines 2-6, 39-49. Apply to both new modules.

### Single sources
Invite only in `site.discord.invite`; content only in `_data/*.js`; JSON-LD from same data as visible markup (`lib/schema.js`). Unprefixed root-relative hrefs; `HtmlBasePlugin` prefixes; absolute URLs = `site.url + site.pathPrefix + url.slice(1)` (`lib/schema.js` line 18).

### FACTS markers
Front matter `todo: "FACTS-NN"` (head.njk line 17) for page-level; data field `draft: "TODO(FACTS-NN)"` printed as HTML comment for entries. Every new ID gets a FACTS.md row.

### Gates
Every new page must pass G0-G12 and perf P0-P11 (lazy + width/height on non-hero imgs via `{% picture %}`).

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/_includes/partials/breadcrumbs.njk` | partial | static | No breadcrumb markup exists; use RESEARCH + header nav style |
| Build-time network fetch (`lib/discord.js` network part) | service | request-response | No remote fetch exists in repo; use RESEARCH Pattern 7 |

## Metadata
**Analog search scope:** `src/`, `lib/`, `test/`, `eleventy.config.js`
**Files scanned:** ~20
**Pattern extraction date:** 2026-10-11
