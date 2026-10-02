# Phase 1: Eleventy Foundation - Pattern Map

**Mapped:** 2026-10-02
**Files analyzed:** 22 (new + moved + modified)
**Analogs found:** 13 / 22. The rest are greenfield tooling: no Node/Eleventy/CI file exists in the repo yet. Use the RESEARCH.md code examples for those.

**Tracked-source check:** every analog below is git-tracked (`git ls-files`): `index.html`, `css/style.css`, `js/main.js`, `assets/*`, `.gitignore`, `LICENSE`. There are no gitignored mirrors in this repo.

**Key fact:** the codebase has three source files. Almost every new template is a **slice of `index.html`** and must reproduce it byte-for-byte, apart from the listed D-05 changes. Line numbers below refer to the pre-move `index.html` / `js/main.js` / `css/style.css`.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/index.njk` | page template | build-time transform | `index.html` lines 74-236 + 239-248 | exact (verbatim slice) |
| `src/_includes/layouts/base.njk` | layout | build-time transform | `index.html` lines 1-3, 36-39, 72, 237, 295-297 | exact |
| `src/_includes/partials/head.njk` | partial | build-time transform | `index.html` lines 4-35 | exact |
| `src/_includes/partials/header.njk` | partial | build-time transform (data-driven) | `index.html` lines 42-69 | exact |
| `src/_includes/partials/discord-cta.njk` | partial/component | build-time transform | `index.html` line 230-232 (terminal Discord button) + `.hud-btn` CSS | role-match |
| `src/_includes/partials/footer.njk` | partial | build-time transform | `index.html` lines 250-293 | exact |
| `src/_data/site.js` | config | build-time data | none (values from `index.html:230`) | no analog |
| `src/_data/navigation.js` | config/data | build-time data | `index.html` lines 62-65, 258-261 | data source |
| `src/_dev/layout-test.njk` | dev page | build-time transform | `src/index.njk` (front matter + body) | role-match |
| `src/js/main.js` (git mv + edit) | client script | event-driven | itself (`js/main.js`) | exact |
| `src/css/style.css` (git mv + small add) | stylesheet | n/a | itself; `.hud-btn` lines 191-235, media queries 1391-1443 | exact |
| `src/assets/*` (git mv, 9 files) | static assets | file-I/O | unchanged | n/a |
| `eleventy.config.js` | config | build | none | no analog |
| `package.json` / `package-lock.json` | config | build | none | no analog |
| `.nvmrc` | config | n/a | none | no analog |
| `.gitignore` (modify) | config | n/a | `.gitignore` (1 line) | exact |
| `scripts/clean.js` | utility | file-I/O | none | no analog |
| `test/helpers.js` | test utility | batch | none | no analog |
| `test/build.test.js`, `test/layout.test.js`, `test/links.test.js` | test | batch | none | no analog |
| `.github/workflows/pages.yml` | CI config | event-driven | none | no analog |
| `README.md` | docs (Polish) | n/a | none (Polish copy tone: `index.html` text) | no analog |
| `api/` (delete) | n/a | n/a | n/a | delete only (empty dir, not tracked) |

## Pattern Assignments

### `src/index.njk` (page template)

**Analog:** `index.html` lines 74-236 (the hero, about, gallery and recruitment sections) plus lines 239-248 (lightbox).

Add front matter only (`layout: layouts/base.njk`). Do not include `<main>`, because the layout provides it. Copy the sections verbatim, including the inline styles (D-08: leave them). Make these changes only:

1. **Hero top anchor** (line 74): `<section class="hero">` becomes `<section id="hero" class="hero">`. `id="hero"` comes off `<body>` (line 37).
2. **Gallery `data-src`** (lines 144, 153, 162, 171). Current:
   ```html
   <div class="gallery-item hud-border" data-src="assets/op_patrol.jpg" role="button" tabindex="0" aria-label="Powiększ zdjęcie: Patrol Bojowy">
     <img src="assets/op_patrol.jpg" alt="Patrol Bojowy sekcji Alpha w rejonie operacji" loading="lazy" decoding="async" width="600" height="338">
   ```
   Target: `data-src="{{ '/assets/op_patrol.jpg' | htmlBaseUrl }}"` and `src="/assets/op_patrol.jpg"` (the plugin rewrites `img[src]`; it does not touch `data-*`). Same for `jo_1967.png`, `cos.png`, `funny.png`.
3. **Terminal console** (line 210): `<div class="terminal-body" id="terminal-console">` becomes `<div class="terminal-body" id="terminal-console" data-discord-url="{{ site.discord.invite }}">`.
4. **Big Discord button** (line 230): replace the literal href with `{{ site.discord.invite }}`. Keep every other attribute and the inline style unchanged:
   ```html
   <a href="https://discord.gg/DhJwkeehJK" target="_blank" rel="noopener noreferrer" class="hud-btn active" style="width: 100%; justify-content: center; font-size: 1.1rem; padding: 15px 0; display: inline-flex; align-items: center; gap: 10px;">
     <i class="fab fa-discord" style="font-size: 1.3rem;"></i> Wejdź na Discord
   </a>
   ```
5. **Lightbox** (lines 239-248): move it into `index.njk` after the recruitment section. Line 244 `<img src="" alt="Lightbox image">` becomes `<img alt="Lightbox image">` (Pitfall 4).
6. Hero buttons (lines 82-83, `href="#recruitment"` / `#about`) stay fragment-only.

---

### `src/_includes/layouts/base.njk` (layout)

**Analog:** the `index.html` document shell:
```html
<!DOCTYPE html>
<html lang="pl">
<head>
...
</head>
<body id="hero">
  <!-- Screen grid lines and overlay -->
  <div class="grid-bg"></div>
...
  <main>
...
  </main>
...
  <script src="js/main.js"></script>
</body>
</html>
```
Target shape: RESEARCH.md Pattern 3. Body has no id. Add the skip link `<a href="#main" class="skip-link">Przejdź do treści</a>` before `.grid-bg`, then `{% include "partials/header.njk" %}`, then `<main id="main">{{ content | safe }}</main>`, then `{% include "partials/footer.njk" %}`, then `<script src="/js/main.js"></script>`. The script path is root-relative so HtmlBasePlugin prefixes it, and it stays a classic script (no `type="module"`). Keep the HTML comment style (`<!-- NAVIGATION HEADER -->`, `<!-- FOOTER -->`).

---

### `src/_includes/partials/head.njk` (partial)

**Analog:** `index.html` lines 4-35. Copy them verbatim, including the comment headers `<!-- SEO Meta Tags -->`, `<!-- Stylesheets & Preconnect -->`, `<!-- Open Graph & Twitter Cards -->` and `<!-- Structured Data JSON-LD -->`. Change only:
- line 8: `<title>{{ title or "IBC Clan // Wizytówka Taktyczna Arma 3" }}</title>`
- line 10 (`meta keywords`) and lines 26-35 (SportsTeam JSON-LD): wrap them in `{% if page.url == "/" %} ... {% endif %}`
- line 17: `href="css/style.css"` becomes `href="/css/style.css"`
- line 22: `content="assets/hero-bg.jpg"` becomes `content="{{ '/assets/hero-bg.jpg' | htmlBaseUrl(site.url) }}"`
- Keep the FA CDN link (line 16) and the preconnects (14-15) unchanged (D-08).

---

### `src/_includes/partials/header.njk` (partial, data-driven)

**Analog:** `index.html` lines 42-69:
```html
  <header>
    <div class="nav-container">
      <div class="logo">
        <a href="#hero">
          <img src="assets/logo.png" alt="IBC Logo" class="logo-img" width="48" height="48" decoding="async">
          <div class="logo-text">
            <span>Inglourious</span>
            <span>Basterds</span>
            <span>Clan</span>
          </div>
        </a>
      </div>
      <button class="menu-toggle" aria-label="Przełącz menu" aria-expanded="false" aria-controls="mobile-nav">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav>
        <ul id="mobile-nav">
          <li><a href="#hero" class="active-nav">System</a></li>
          ...
        </ul>
      </nav>
    </div>
  </header>
```
Changes:
- logo `href="#hero"` becomes `href="/#hero"`, and `src="assets/logo.png"` becomes `src="/assets/logo.png"`
- the `<li>` list becomes the `{% for item in navigation %}` loop from RESEARCH.md Pattern 4, with `active-nav` only when `page.url == "/" and loop.first`
- `{% include "partials/discord-cta.njk" %}` goes inside `.nav-container` **outside** `nav ul` (Pitfall 5: keeps it out of the `nav ul li a` selectors used by `initMobileMenu` at `js/main.js:15` and `initScrollSpy` at `js/main.js:186`). Choose a position relative to `.menu-toggle` that keeps the flex `space-between` row intact. `.nav-container` is `display:flex; justify-content: space-between` (`css/style.css:251-258`), so the CTA and the toggle may need a wrapper.

---

### `src/_includes/partials/discord-cta.njk` (component)

**Analog:** the terminal Discord button (`index.html:230-231`) for markup, and the footer icon (`index.html:265`) for the `rel`/`aria` pattern:
```html
<a href="https://discord.gg/DhJwkeehJK" target="_blank" class="social-icon" rel="noopener noreferrer" aria-label="Discord"><i class="fab fa-discord"></i></a>
```
Target: `<a href="{{ site.discord.invite }}" target="_blank" rel="noopener noreferrer" class="hud-btn header-cta"><i class="fab fa-discord" aria-hidden="true"></i> <span class="header-cta-label">Discord</span></a>`. `rel="noopener noreferrer"` is mandatory (security table). Styling comes from the `.hud-btn` base (below) plus a compact `.header-cta` modifier.

---

### `src/_includes/partials/footer.njk` (partial)

**Analog:** `index.html` lines 250-293 (footer + `<!-- EASTER EGG DECRYPTION CONSOLE -->` overlay). Copy verbatim, including the inline style on `#easteregg-trigger` (line 271). Changes:
- footer links (lines 257-262) come from the same `navigation` loop (no active class)
- line 265 Discord href becomes `{{ site.discord.invite }}`; YouTube/Facebook stay literal
- The decryption overlay (lines 276-293) moves here unchanged, because its trigger is in the footer on every page.

---

### `src/_data/navigation.js` (data)

**Source data:** `index.html:62-65` labels (`System`, `O nas`, `Galeria`, `Rekrutacja`) mapped to `/#hero`, `/#about`, `/#gallery`, `/#recruitment`. Use the exact ESM shape from RESEARCH.md Pattern 4.

### `src/_data/site.js` (config)
No analog. Use RESEARCH.md Pattern 2 verbatim. This is the **only** file containing `discord.gg/DhJwkeehJK` (value from `index.html:230`).

### `src/_dev/layout-test.njk` (dev page)
Use RESEARCH.md Pattern 3 (second block): `devOnly: true`, `eleventyExcludeFromCollections: true`, `permalink: /_dev/layout-test/`. Write the body in Polish and use existing classes (`section-container`).

---

### `src/js/main.js` (client script, event-driven), git mv then edit

**Analog:** itself. Preserve the conventions: `/* --- NAME --- */` headers, `const`/`let`, guard clauses, arrow-function listeners, no console logging.

**Guard-clause pattern to copy** (lines 123-125):
```js
function initRecruitmentTerminal() {
  const consoleEl = document.getElementById('terminal-console');
  if (!consoleEl) return;
```
**Edit 1, terminal invite** (lines 132, 141, 174): read `consoleEl.getAttribute('data-discord-url') || ''`, pass it as a second arg `runBootSequence(consoleEl, discordUrl)`, and replace line 174 with `writeToConsole('Połączenie nawiązane: ' + discordUrl.replace(/^https?:\/\//, ''), 'success');`. The output must stay `discord.gg/DhJwkeehJK`. Move the message out of `innerHTML` (lines 156-160) by building the `.message` span with `textContent` (security). Keep the time/tag spans identical.

**Edit 2, scroll-spy** (lines 184-206). Current matching code:
```js
const id = entry.target.getAttribute('id') || (entry.target.tagName === 'HEADER' ? 'hero' : '');
...
const href = link.getAttribute('href');
if (href === `#${id}`) link.classList.add('active-nav');
```
Replace it with the RESEARCH.md Pattern 5 filter (`link.hash && link.pathname === window.location.pathname`) and `link.hash === \`#${id}\``. Keep the `HEADER → 'hero'` fallback, `rootMargin: '-30% 0px -60% 0px'`, and the `navLinks.length === 0` guard.

Do not touch `initMobileMenu`, `initLightbox` or `initEasterEgg`. The lightbox already reads `data-src` (line 56), so the prefixed value just works.

---

### `src/css/style.css`, git mv plus a small addition

**Base to reuse** (lines 192-207, 230-235):
```css
.hud-btn {
  font-family: var(--font-hud);
  background: transparent;
  color: var(--accent-color);
  border: 1px solid var(--accent-color);
  padding: 10px 24px;
  text-transform: uppercase;
  letter-spacing: 2px;
  ...
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
```
**Conflict to override** (lines 1434-1443):
```css
@media (max-width: 480px) {
  .hud-btn {
    width: 100%;
    justify-content: center;
  }
```
Add `.header-cta` (compact padding/font, tokens only) and `.skip-link` (visually hidden until `:focus`). Inside the 480px block use `.hud-btn.header-cta { width: auto; }`, which needs higher specificity, plus optional icon-only (`.header-cta-label` visually hidden). The mobile breakpoint is at line 1391 (`max-width: 768px`; the menu `top: 65px` assumes the header height, so the CTA must not grow the header). Follow the `/* --- SECTION --- */` comment style and `--accent-*` variables. Do not hardcode colours. `url('../assets/hero-bg.jpg')` (line 384) stays relative.

---

### `.gitignore` (modify)
Current content: `.planning/research/.cache/`. Append `_site/`, `_test/`, `node_modules/` and `.cache/`, plus Lighthouse report files if they are not committed (Open Question 3).

### Greenfield tooling (no analog; copy from RESEARCH.md)
| File | RESEARCH.md source |
|---|---|
| `eleventy.config.js` | Pattern 1 (ESM, HtmlBasePlugin, passthrough map, `devOnly` preprocessor, `export const config`) |
| `package.json` | "package.json" example (`type: module`, `engines >=22.19`, `test` uses the quoted glob) |
| `.nvmrc` | `24` |
| `scripts/clean.js` | "Clean script" example |
| `test/helpers.js` | "Test helper" example (`spawnSync(process.execPath, [cmd.cjs path])`, never a shell; file URL rather than `require.resolve`) |
| `test/*.test.js` | Validation Architecture test map + "Link resolver" sketch |
| `.github/workflows/pages.yml` | Pattern 7 verbatim |
| `README.md` | D-15 content list. Polish. Point to `src/_data/site.js` for the invite; never paste the URL. Show the PowerShell `$env:PATH_PREFIX` form and the Git Bash `MSYS_NO_PATHCONV=1` form |

## Shared Patterns

### Single-source config
**Source:** `src/_data/site.js`. **Apply to:** head, header CTA, footer, index terminal + button. The invite is always `{{ site.discord.invite }}`. The JS gets it only via `data-discord-url`.

### Root-relative URLs + HtmlBasePlugin
**Apply to:** every template. Author `/assets/...`, `/css/...`, `/js/...`, `/#about`. Use `| htmlBaseUrl` **explicitly** for `data-src`, and `| htmlBaseUrl(site.url)` for `<meta content>`. Never write `/IBC-Website/` by hand. Never leave an empty `src=""`.

### External links
**Source:** `index.html:230,265`. Every `target="_blank"` needs `rel="noopener noreferrer"`. Icon-only links get `aria-label` (footer pattern).

### JS conventions
**Source:** `js/main.js`. Use guard clause + early return (`if (!consoleEl) return;`), `/* --- NAME --- */` headers, `const`/`let`, no `console.*`, and Polish user-facing strings.

### Verbatim parity
Copy every moved markup block byte-for-byte except the D-05 edits listed above. Keep inline styles, comments and the FA CDN.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `eleventy.config.js`, `package.json`, `.nvmrc` | config | build | No build tooling exists yet |
| `src/_data/site.js` | config | build-time data | No config layer exists (values were hardcoded) |
| `scripts/clean.js` | utility | file-I/O | No Node scripts exist |
| `test/*.js` | test | batch | No tests exist |
| `.github/workflows/pages.yml` | CI | event-driven | No `.github/` dir |
| `README.md` | docs | n/a | No README exists |

## Metadata

**Analog search scope:** whole repo (`git ls-files`: index.html, css/style.css, js/main.js, assets/, .gitignore, LICENSE)
**Files scanned:** 4 (index.html in full, js/main.js in full, css/style.css lines 190-264 and 1380-1447, .gitignore)
**Pattern extraction date:** 2026-10-02
