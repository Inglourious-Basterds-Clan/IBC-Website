# Parity check (Phase 3, performance and assets): D-15 and D-18

- Before: commit `03ce0de`, the last commit that touched `src/`, `lib/`, `scripts/`, tests or tools before Phase 3. Built from `git archive 03ce0de src lib eleventy.config.js package.json`, extracted into `_test/parity-before-src/`, with `src/_dev/font-test.njk` copied in.
- After: commit `6bcb04d`, the source tree the shots were captured from. The commits after it on this branch change only the `BUDGET` comment in `lib/check-perf.js` and `.planning/` files.
- Captured: 2026-10-11, headless Chrome/154.0.8037.98 over the DevTools protocol, Python 3.14.7 `http.server`.

## Method

Both trees were built into `_test/`, never `_site/`, with `ALLOW_LOCAL_SITE_URL=1 INCLUDE_DEV_PAGES=1`:

- before: `node ../../node_modules/@11ty/eleventy/cmd.cjs --output=../parity-before --quiet`, run from `_test/parity-before-src/`
- after: `node node_modules/@11ty/eleventy/cmd.cjs --output=_test/parity-after --quiet`

Serving and capture:

- Served with `python -m http.server <port> --protocol HTTP/1.1 --bind 127.0.0.1 --directory <build>`: port 8090 for before, 8091 for after. HTTP/1.1 is needed on this machine; see Notes.
- Captured with the Phase 1 method (`../../01-eleventy-foundation/baseline/scores.md`):
  - isolated Chrome profile
  - viewport set per shot, `deviceScaleFactor` 1, mobile emulation below 500 px
  - load the page and wait for `document.fonts.ready`
  - scroll the section into view (`scrollIntoView`, instant), wait 3 s, then capture the viewport (not the full page)
- The recruitment shots wait 7 s, so the terminal boot sequence has finished on both sides.
- `Date` is frozen on both sides, because the terminal prints `HH:MM:SS` and Montserrat's proportional digits change the line widths.
- The before build loaded Google Fonts and the Font Awesome CDN live during capture. Both CDNs still serve the same files, so the Phase 1 fallback was not needed.

Comparison:

- A throwaway sharp script counts the share of pixels whose R, G or B differs by more than 16.
- Every pair above 0.5 % was opened as a diff mask and as zoomed before/after crops.
- The capture is deterministic: a second full run gave 0.00 % against the first on 29 of the 30 shots. The exception was the first navigation of a run (`before/mobile-top`, 1.09 % between runs). The committed set is the second run, whose first shot matches the third run.

Behaviour probes on both servers ran over the same CDP session: clicks, keys, the AX tree and network/console logs. Their results are in the checklist below.

## Pairs

| Shot | Viewport, state | Diff % | Note |
|------|-----------------|--------|------|
| `mobile-top.png` | 390×844, top | 0.70 | Logo raster (see "Logo"), Discord icon anti-aliasing, glyph advances after Polish letters ("radiową i współpracę", "ZŁÓŻ") |
| `mobile-about.png` | 390×844, `#about` | 1.31 | Words containing ł/ś/ż/ę/ą are shifted by under 1 px (same line breaks, indistinguishable at 3× zoom); logo |
| `mobile-gallery.png` | 390×844, `#gallery` | 1.00 | Scattered pixels inside the photos (AVIF/WebP/JPEG thumbnails vs the originals); captions and frames identical; logo |
| `mobile-recruitment.png` | 390×844, `#recruitment` | 0.57 | Glyph advances in the terminal line "Użyj … dołączyć do serwera … złożyć"; logo |
| `desktop-top.png` | 1440×900, top | 0.22 | Logo, glyph advances |
| `desktop-about.png` | 1440×900, `#about` | 0.53 | Glyph advances in the justified prose and "AKTYWNYCH CZŁONKÓW"; logo; 1 px anti-aliasing on the header CTA edge |
| `desktop-gallery.png` | 1440×900, `#gallery` | 0.42 | Photo encoding, logo |
| `desktop-recruitment.png` | 1440×900, `#recruitment` | 0.25 | Glyph advances, logo |
| `w320-top.png` | 320×640, top | 1.45 | Logo, Discord icon, glyph advances after Polish letters (largest share because the viewport is small) |
| `w768-top.png` | 768×1024, top | 0.30 | Logo, glyph advances |
| `desktop-lightbox.png` | 1440×900, first gallery item clicked, image loaded | 2.36 | Only inside the photo: the 1600 w AVIF (D-04) vs the original `op_patrol.jpg`. Frame, caption, ‹ › buttons and "[X] ZAMKNIJ" identical |
| `mobile-menu.png` | 390×844, `.menu-toggle` clicked | 0.42 | Logo, header icon; the open-menu panel is identical |
| `desktop-easter-egg.png` | 1440×900, `#easteregg-trigger` clicked | 0.87 | Justified Polish text: glyph advances move words by sub-pixel amounts; same line breaks |
| `desktop-404.png` | 1440×900, `/404.html` | 0.26 | Logo, glyph advances |
| `desktop-font-test.png` | 1440×900, `/_dev/font-test/` | 0.55 | Pangram at every weight: same shapes, sub-pixel advances; logo |

### Defects found and fixed in this plan

The first capture showed two real layout differences. Both are fixed and the shots above are from after the fixes:

1. **Header logo 24 px to the right at every viewport** (first run: w320-top 3.25 %, mobile-top 2.74 %). `picture { display: contents }` (03-01) lifted the logo's two `<source>` elements into the `.logo a` flex row. Chrome's UA stylesheet does not hide `source`, so each 0×0 source was a flex item and took the 12 px gap. Fix: `picture > source { display: none }` (`39e5c21`). CDP: img x=30 and text x=91.0 vs 91.1 before.
2. **Lettered icon buttons 1.5 to 2 px narrower.** The Font Awesome glyph was text, so the button's `letter-spacing` sat after it inside the icon box (17.5 px = 16 + 1.5 on the header CTA). The inline SVG (03-07) dropped that space. Fix: `.hud-btn .icon { margin-right: 2px }` and `.header-cta .icon { margin-right: 1.5px }` (`6bcb04d`). CDP: header CTA 127.5 px at 1440 and 39.5 px at 390, identical to before; the 404 "Dołącz na Discordzie" button 324.7 vs 324.9 px (the 0.2 px is glyph advance).

`test/css.test.js` pins both rules.

### Logo (residual, for the human check)

The after logo is slightly softer and lower in contrast at 3× zoom. Before, Chrome downscaled the 4608×4500 `logo.png` straight to 49 px. Now the build serves a 50 w variant (03-04, Pitfall 7).

Two changes were tried on throwaway builds; neither made a visible difference, so both were reverted:

- AVIF quality 85 instead of the encoder default (RMSE against a lanczos 50 w reference drops from 9.5 to 3.9)
- `sizes="100px"`, so the 100 w variant is used at 1×

The remaining difference is how the original is downscaled (sharp lanczos vs Chrome's own downscale), not the encoding. It does not change position, size or spacing. Whether it is acceptable is the 03-04 human check below.

## D-15 checklist (automated observations; the user confirms in the human check)

- [x] **Hero framing and gradient.** Hero h1, copy and buttons have identical boxes at 390 and 320 px (CDP, to 0.01 px). The `.hero-img` covers the whole hero (0,0 to 390×844), and the gradient overlay is the same. *Hero softness on a 3× phone (Pitfall 9) is not visible in 1× shots; the user checks it on a phone.*
- [x] **About.** Headings and the two long stat titles ("PACZKA MODYFIKACJI", "DEDYKOWANY") wrap the same way; only glyph advances differ.
- [x] **Gallery.** Captions, frames and grid are identical; the photo pixels differ by encoding. Hover was checked in 03-10's computed-style probe (0 differences).
- [x] **Lightbox.** Both builds:
  - click opens it, with caption "Patrol Bojowy // Sekcja Alpha w rejonie operacji"
  - → shows "Operacja Crimson Dawn // …", ← goes back
  - Esc closes; Enter on the focused first item opens; a click outside the image closes
  - after loads `/img/JCzxLZKbuY-1600.avif` (before: `/assets/op_patrol.jpg`)
- [x] **Recruitment terminal.** The boot text is identical on both sides: 5 lines, including "Połączenie nawiązane: discord.gg/…". After the easter egg opens, both append "[WARN] RAPORT DIABLO UJAWNIONY. PROTOKÓŁ ZŁAMANY." in red (rgb(239, 68, 68)).
- [x] **Mobile menu.** Both: `aria-expanded` true on open and false on close; following the "O nas" link closes the menu (false) and moves to `#about`. The open panel looks identical in `mobile-menu.png`.
- [x] **Scroll-spy.** Both highlight "O nas", "Galeria", "Rekrutacja" at their sections and "System" back at the top.
- [x] **Footer.** Icons are 20/18/16 × 16 px at the same y on both sides; the dim "v2.4.1" is identical (`desktop-font-test.png`). The easter egg opens and closes on both.
- [x] **404 page.** `desktop-404.png` matches apart from the logo and glyph advances. After, `/404.html` requests only `main.js` plus the menu, scroll-spy and easter-egg modules: no lightbox or terminal module, no failed request, no exception (03-09 check).
- [x] **Icon glyph, size and baseline.** Footer icons are identical in width, height and y. The header CTA icon is at the same y (32.6 at 1440, 42.6 at 390), with the box width restored by the fix above. *Compare against `../../01-eleventy-foundation/baseline/after/root-desktop-top.png` and `root-desktop-recruitment.png` in the human check.*
- [x] **Pangram on `/_dev/font-test/`.** "Zażółć gęślą jaźń" and "ZAŻÓŁĆ GĘŚLĄ JAŹŃ" render with every Polish letter at:
  - h1, h2, h3 (700)
  - paragraph (400)
  - strong (700)
  - `.hud-btn` (700)
  - `.hud-badge`
  - the header logo (800/900)

  The after side uses only the self-hosted Montserrat; before used Google Fonts.
- [x] **Each footer icon link announced once by name.** AX tree on both sides: "Discord", "YouTube", "Facebook" once each. The header CTA is "DISCORD". The recruitment button was " WEJDŹ NA DISCORD" before (the webfont glyph added a leading space) and is "WEJDŹ NA DISCORD" after.
- [x] **No third-party font or icon hosts.** Home page requests on the after side go only to the local server (before: `fonts.googleapis.com`, `fonts.gstatic.com`, `cdnjs.cloudflare.com`). Console: no errors or exceptions on either side.

### Human checks collected from 03-01 to 03-10 (end of phase)

1. Hero look, including softness on a 3× phone (03-01, Pitfall 9).
2. Gallery and lightbox on a served build: formats and keyboard (03-04; already approved once).
3. Logo at 1440 and 390 px. Position and spacing are fixed; judge the slight softness described under "Logo" (03-04).
4. Fonts including Polish glyphs: "Zażółć gęślą jaźń" on `/_dev/font-test/` (`npm run dev`), and the Network panel shows only self-hosted fonts, no CDN (03-05; approved once).
5. Icon glyph, size and baseline, and screen-reader names of the footer icons (03-07).
6. The visual comparison against the Phase 1 baselines (`root-desktop-top.png`, `root-mobile-recruitment.png`): the converted inline styles (03-08 D6) and the CSS split (03-10 Task 3).
7. All five scripted features, and a clean DevTools console with no failed module fetch on `/404.html` (03-09).
8. PSI on the GitHub Pages preview (D-18, below).

## Final perf gate line

Production builds `SITE_URL=https://guard.example npm run build` and `MSYS_NO_PATHCONV=1 SITE_URL=https://inglourious-basterds-clan.github.io PATH_PREFIX=/IBC-Website/ npm run build`, identical sizes:

```text
check-perf: OK, 2 page(s) checked
check-perf: css 3957 B gz (cap 5120), initial js 4857 B gz (cap 6144), font 36460 B (cap 45824), hero mobile max 116260 B (cap 122880), lightbox max 229074 B (cap 307200)
```

## PageSpeed Insights, mobile (D-18)

URL: https://inglourious-basterds-clan.github.io/IBC-Website/. Run 3 times and record the median. Below 90 is a verification gap, not a pass. The SEO "is-crawlable" failure is expected on the noindex preview.

| Run | Date | Performance | LCP | FCP | SI | CLS | TBT |
|-----|------|-------------|-----|-----|----|-----|-----|
| Baseline (Phase 2 deploy) | 2026-10-08 | Performance 67 | 0/25 | 4/10 | 7/10 | 25/25 | 30/30 |
| Post-Phase 3, median of 3 (user fills in after deploying) | | | | | | | |

## Notes

- **Python server resets.** On this machine a local AdGuard filter proxies Chrome's traffic, and Python's default HTTP/1.0 `http.server` reset some connections (`main.js`, `hero-bg.jpg`), so the `load` event never fired. `--protocol HTTP/1.1` fixed it; the files served are the same.
- **Console warnings.** "Permissions-Policy: Unrecognized feature" warnings appear on every page of both builds. AdGuard injects these headers; the site and `http.server` send none.
- **Not committed.** The capture, diff and probe scripts were throwaway scripts in the session scratchpad. The `_test/parity-*` folders are gitignored.
