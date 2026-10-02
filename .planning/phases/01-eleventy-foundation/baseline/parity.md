# Parity check (after migration) — D-07

Commit: ac19278
Captured: 2026-10-02T22:40:00Z
Lighthouse: 13.5.0 (mobile, default throttling)
Chrome: 154.0.8037.93 (headless)

Source: the migrated Eleventy site, built into `_test/` (never `_site/`):

- Root build: `env -u SITE_URL -u PATH_PREFIX -u INCLUDE_DEV_PAGES npx @11ty/eleventy --output=_test/after-root --quiet`, served with `python -m http.server 8078 --directory _test/after-root` at `http://localhost:8078/`.
- Subpath build: `MSYS_NO_PATHCONV=1 PATH_PREFIX=/IBC-Website/ npx @11ty/eleventy --output=_test/after-sub/IBC-Website --quiet` (checked: `index.html` links `/IBC-Website/css/style.css`), served with `python -m http.server 8079 --directory _test/after-sub` at `http://localhost:8079/IBC-Website/`.

Raw reports: `baseline/lh/after-mobile-1.json` .. `after-mobile-3.json` (gitignored, local only). Same command shape as the baseline: `npx -y lighthouse@13.5.0 http://localhost:8078/ --output=json --output-path=... --chrome-flags="--headless=new" --quiet`.

## Lighthouse (mobile, 3 runs, root build)

| Run | Performance | Accessibility | Best Practices | SEO |
|-----|-------------|---------------|----------------|-----|
| 1 | 44 | 96 | 77 | 100 |
| 2 | 44 | 96 | 77 | 100 |
| 3 | 45 | 96 | 77 | 100 |
| Median | 44 | 96 | 77 | 100 |

| Category | Baseline median | After median | Delta |
|----------|-----------------|--------------|-------|
| Performance | 46 | 44 | -2 |
| Accessibility | 96 | 96 | 0 |
| Best Practices | 77 | 77 | 0 |
| SEO | 100 | 100 | 0 |

**Gate: PASS.** Accessibility, Best Practices and SEO are equal to the baseline; Performance is 2 points below, inside the allowed 5-point noise band (the baseline runs themselves ranged 39-46).

Notes from the reports:

- Best Practices fails the same two audits before and after: `is-on-https` (local HTTP server) and `errors-in-console`. The console error is in both cases a 404 for `/favicon.ico`: the site has never had a favicon. It is not a path-prefix regression (no other request returns 4xx in either report).
- Performance metrics, baseline run 1 vs after run 2: FCP 13.7 s vs 13.2 s, LCP 74.4 s vs 74.1 s, TBT 650 ms vs 430 ms, CLS 0 vs 0. The large LCP comes from the unoptimized hero image under simulated mobile throttling (Phase 3 scope).

## Screenshots

Captured with the same method as the baseline (`scores.md`): headless Chrome over the DevTools protocol with an isolated profile, viewport set per shot, page loaded, the section scrolled into view with `scrollIntoView` (instant), about 3 s wait, viewport captured. Same viewports and sections; `root-` = `http://localhost:8078/`, `sub-` = `http://localhost:8079/IBC-Website/`.

| Baseline | After, root build | After, /IBC-Website/ build | Viewport, section |
|----------|-------------------|----------------------------|-------------------|
| `mobile-top.png` | `after/root-mobile-top.png` | `after/sub-mobile-top.png` | 390x844, top |
| `mobile-about.png` | `after/root-mobile-about.png` | `after/sub-mobile-about.png` | 390x844, `#about` |
| `mobile-gallery.png` | `after/root-mobile-gallery.png` | `after/sub-mobile-gallery.png` | 390x844, `#gallery` |
| `mobile-recruitment.png` | `after/root-mobile-recruitment.png` | `after/sub-mobile-recruitment.png` | 390x844, `#recruitment` |
| `desktop-top.png` | `after/root-desktop-top.png` | `after/sub-desktop-top.png` | 1440x900, top |
| `desktop-about.png` | `after/root-desktop-about.png` | `after/sub-desktop-about.png` | 1440x900, `#about` |
| `desktop-gallery.png` | `after/root-desktop-gallery.png` | `after/sub-desktop-gallery.png` | 1440x900, `#gallery` |
| `desktop-recruitment.png` | `after/root-desktop-recruitment.png` | `after/sub-desktop-recruitment.png` | 1440x900, `#recruitment` |
| `w320-top.png` | `after/root-w320-top.png` | `after/sub-w320-top.png` | 320x640, top |
| `w768-top.png` | `after/root-w768-top.png` | `after/sub-w768-top.png` | 768x1024, top |

What the executor saw (to be confirmed by the user below):

- The root and `/IBC-Website/` shots are the same at every viewport (most PNGs are byte-for-byte the same size; the gallery and recruitment shots differ only by the terminal clock and timing).
- Desktop and the top-of-page shots match the baseline, apart from the new header Discord button (D-10/D-11).
- **Expected difference in the scrolled mobile shots (`mobile-about`, `mobile-gallery`, `mobile-recruitment`):** the baseline shows no header, the after shots show the fixed header, and the content sits at a different scroll offset. Measured over CDP against the old site (served from commit `ef0d894`): at 390 px the old page's layout viewport was 498 px wide (the pre-existing `.about-stats` overflow, see `../deferred-items.md`), so Chrome offset the visual viewport 234 px below the layout viewport and the fixed header was out of view. Plan 01-02's `body { overflow-x: clip; }` keeps the layout viewport at 390 px, so the header now stays on screen as intended. On desktop, where there is no overflow, the section lands at the same position before and after (old -7 px, new -6 px).
- DevTools-protocol console during all 20 captures: only the `/favicon.ico` 404 (pre-existing), no script errors.

## Manual checklist (D-07)

Run `npm run dev` and work through the list at http://localhost:8080/. Then run it again with the prefix (PowerShell: `$env:PATH_PREFIX="/IBC-Website/"; npm run dev`, afterwards `Remove-Item Env:PATH_PREFIX`) at http://localhost:8080/IBC-Website/.

### At `/`

- [ ] Hero: title, copy, both buttons and background image as in the baseline
- [ ] About: text and the four stat cards as in the baseline
- [ ] Gallery lightbox: opens on click; opens with Enter and with Space on a focused item; arrow keys switch images; Esc closes; a click outside the image closes; the full-size image loads
- [ ] Recruitment terminal: boot lines appear; the "Połączenie nawiązane: ..." line has the same text as the baseline
- [ ] Mobile menu: opens, closes on a link click, `aria-expanded` toggles
- [ ] Scroll-spy: all four links highlight while scrolling, and "System" highlights again back at the top
- [ ] Footer easter egg opens and closes
- [ ] Header Discord button is visible and usable at 320, 390, 768 and 1440 px
- [ ] Skip link appears on the first Tab
- [ ] DevTools: no console errors and no 404s (except `/favicon.ico`, which the site never had)

### At `/IBC-Website/`

- [ ] Hero: title, copy, both buttons and background image as in the baseline
- [ ] About: text and the four stat cards as in the baseline
- [ ] Gallery lightbox: opens on click; opens with Enter and with Space on a focused item; arrow keys switch images; Esc closes; a click outside the image closes; the full-size image loads under the prefix
- [ ] Recruitment terminal: boot lines appear; the "Połączenie nawiązane: ..." line has the same text as the baseline
- [ ] Mobile menu: opens, closes on a link click, `aria-expanded` toggles
- [ ] Scroll-spy: all four links highlight while scrolling, and "System" highlights again back at the top
- [ ] Footer easter egg opens and closes
- [ ] Header Discord button is visible and usable at 320, 390, 768 and 1440 px
- [ ] Skip link appears on the first Tab
- [ ] DevTools: no console errors and no 404s (except `/favicon.ico`, which the site never had)

### Question for the user

- [x] Is the old repository root currently served by any host other than GitHub Pages? (RESEARCH Open Question 2 / assumption A5.) If yes, that host must now deploy `_site/` (see README, "Wdrożenie").

Answer: No — only GitHub Pages serves this repository (confirmed by user in UAT, 2026-10-03).
