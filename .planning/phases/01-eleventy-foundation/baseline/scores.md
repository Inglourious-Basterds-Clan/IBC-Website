# Baseline (pre-migration) — D-07

Commit: ef0d894
Captured: 2026-10-02T21:59:00Z
Lighthouse: 13.5.0 (mobile, default throttling)
Chrome: 154.0.8037.93 (headless)

Source: the old root site (`index.html`, `css/`, `js/`, `assets/` at the repository root), served with `python -m http.server 8077` and audited at `http://localhost:8077/`. Raw reports: `baseline/lh/mobile-1.json` .. `mobile-3.json` (gitignored, local only).

| Run | Performance | Accessibility | Best Practices | SEO |
|-----|-------------|---------------|----------------|-----|
| 1 | 39 | 96 | 77 | 100 |
| 2 | 46 | 96 | 77 | 100 |
| 3 | 46 | 96 | 77 | 100 |
| Median | 46 | 96 | 77 | 100 |

## Screenshots

Viewport screenshots (not full page: Lighthouse's full-page capture stretches the `min-height: 100vh` hero). Captured with headless Chrome over the DevTools protocol: load the URL, scroll the section into view with `scrollIntoView` (instant), wait about 3 s so scroll-spy and the terminal boot sequence settle, then capture the viewport.

- `mobile-top.png` — 390x844, `http://localhost:8077/`
- `mobile-about.png` — 390x844, `http://localhost:8077/#about`
- `mobile-gallery.png` — 390x844, `http://localhost:8077/#gallery`
- `mobile-recruitment.png` — 390x844, `http://localhost:8077/#recruitment`
- `desktop-top.png` — 1440x900, `http://localhost:8077/`
- `desktop-about.png` — 1440x900, `http://localhost:8077/#about`
- `desktop-gallery.png` — 1440x900, `http://localhost:8077/#gallery`
- `desktop-recruitment.png` — 1440x900, `http://localhost:8077/#recruitment`
- `w320-top.png` — 320x640, `http://localhost:8077/` (reference for the header Discord CTA check, plan 01-02)
- `w768-top.png` — 768x1024, `http://localhost:8077/` (reference for the header Discord CTA check, plan 01-02)
