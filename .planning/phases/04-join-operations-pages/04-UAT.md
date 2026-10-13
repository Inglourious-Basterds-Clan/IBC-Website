---
status: complete
phase: 04-join-operations-pages
source: [04-VERIFICATION.md]
started: 2026-10-13T20:25:00Z
updated: 2026-10-13T22:02:25.786Z
---

## Current Test

[testing complete]

## Tests

### 1. FACTS walk — confirm or correct FACTS-01..FACTS-13 (precondition: fix review WR-02 first)
expected: Every row 'potwierdzone' with marker removed; indexable build prints check-seo: OK; npm test stays green; recap images confirmed; recaps name no members or callsigns
result: issue
reported: "npm run build erros with that site_url, patrol and sniper jpg are ai generated shit to be replaced"
severity: blocker

### 2. Legacy #recruitment redirect in a real browser (root and /IBC-Website/)
expected: /#recruitment and /IBC-Website/#recruitment end on /jak-dolaczyc/ (prefixed in the second case); Back does not return to the #recruitment URL; #about and #gallery scroll on home and stay; the terminal still types its boot lines when the teaser scrolls into view
result: pass

### 3. Live Discord badge + WR-01 privacy decision
expected: No layout shift when the live count arrives; JS-off fallback "Discord: 200+ osób" visible; backstop value 240 accepted or replaced; WR-01 (browser fetch sends visitor IP to Discord) either accepted as locked D-15 or changed (bake-only / click-to-load / privacy note)
note: Resolved by removal (2026-10-13, quick 261013-vh0): the owner removed the badge, its browser fetch and the build-time count, so WR-01 is fixed and no badge is left to check.
result: pass
reported: "ok, fuck that discord badge, we dont need it, i dont want to deal with gdpr and cookies"

### 4. Subpages at 1280 px and 390 px — breadcrumbs, FAQ keyboard, deep link
expected: Breadcrumbs 'Start › …' fully visible below the fixed header; 23 px breadcrumb-vs-h1 offset accepted or fixed; steps 01–06 render; FAQ toggles with Enter and Space without JS errors; /jak-dolaczyc/#mody deep-link behaviour (WR-03: may sit under header, stays collapsed) accepted or fixed
result: pass

### 5. Home teaser at 1280 px and 390 px
expected: Teaser shows four short requirements, terminal, 'Instrukcja Zaciągu' summary, 'Pełna instrukcja →', 'Wejdź na Discord' (no badge: removed in quick 261013-vh0); stat reads '19:00 / Start misji w weekendy'; nav shows Start / O nas / Operacje / Dołącz and marks the current page; 'Pełna instrukcja →' does not float mid-card
result: pass

### 6. /operacje/ at 1280 px and 390 px
expected: Schedule, mission types, era tags, evening timeline with times, 'Najbliższe misje' with Discord button and no dates, four recap cards newest first — readable on both widths; recap images load only when scrolled near (DevTools Network → Img)
result: pass

### 7. Versioned JS after the next deploy
expected: As a returning visitor with DevTools Network open, main.js?v=<hash> and every module URL carry the new hash
result: pass
note: Live site serves main.js?v=d2eb6bfb28; hash moved da284b608b -> d2eb6bfb28 when src/js changed (c6a4277) and stays unchanged on non-JS commits, as designed.

## Summary

total: 7
passed: 6
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-04-1
  truth: "Indexable build (SITE_URL=https://<domena> SITE_INDEXABLE=1 npm run build) succeeds with check-seo: OK; recap images are real clan screenshots"
  status: failed
  reason: "User reported: npm run build erros with that site_url, patrol and sniper jpg are ai generated shit to be replaced"
  severity: blocker
  test: 1
  artifacts: []  # Filled by diagnosis
  missing: []    # Filled by diagnosis
