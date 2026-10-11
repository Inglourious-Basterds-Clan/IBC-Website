---
status: testing
phase: 03-performance-assets
source: [03-VERIFICATION.md]
started: 2026-10-11T11:22:52.869Z
updated: 2026-10-11T11:22:52.869Z
---

## Current Test

number: 1
name: D-18 PSI gate: push/merge the branch to main, wait for the 'Build and deploy' workflow, run mobile PageSpeed Insights 3 times on https://inglourious-basterds-clan.github.io/IBC-Website/ and record the median row in parity/parity.md
expected: |
  Mobile Performance >= 90 (baseline 67; LCP 0/25). Below 90 is a verification gap (D-18 prohibition), not a pass
awaiting: user response

## Tests

### 1. D-18 PSI gate: push/merge the branch to main, wait for the 'Build and deploy' workflow, run mobile PageSpeed Insights 3 times on https://inglourious-basterds-clan.github.io/IBC-Website/ and record the median row in parity/parity.md
expected: Mobile Performance >= 90 (baseline 67; LCP 0/25). Below 90 is a verification gap (D-18 prohibition), not a pass
result: [pending]

### 2. D-15 visual parity: walk parity/before vs parity/after (15 pairs) and the D-15 checklist in parity.md; compare against Phase 1 baselines root-desktop-top.png and root-mobile-recruitment.png
expected: No visible design change beyond sub-pixel font-rendering and photo re-encoding differences
result: [pending]

### 3. Hero on a real 3x phone (and a 428-430 CSS px 3x phone such as iPhone Pro Max)
expected: Hero sharpness acceptable; note that at 1284+ device px the browser picks the 1920 w candidate (AVIF 183 KB / WebP 259 KB / JPEG 242 KB), above the ~120 KB mobile target
result: [pending]

### 4. Header logo at 1440 and 390 px
expected: Slight softness of the 50 w/100 w variants is acceptable; position and spacing match before
result: [pending]

### 5. Open /_dev/font-test/ (npm run dev) and the home page; check DevTools Network
expected: 'Zażółć gęślą jaźń' / 'ZAŻÓŁĆ GĘŚLĄ JAŹŃ' render with correct Polish glyphs at every weight; only self-hosted font requests, no Google Fonts / cdnjs
result: [pending]

### 6. Icons: glyph, size and baseline; screen reader (NVDA/VoiceOver) on footer icon links, header CTA at 390 px and the recruitment button
expected: Footer links announced once as 'Discord', 'YouTube', 'Facebook'; header CTA as 'Discord' even when the label is visually hidden on mobile; no doubled names
result: [pending]

### 7. Served build: exercise menu, lightbox (click, Enter/Space, arrows, Esc, outer click), terminal boot, scroll-spy, easter egg; then load /404.html with DevTools console + Network open
expected: All five features behave as before; /404.html fetches main.js + menu/scroll-spy/easter-egg modules only, no lightbox/terminal module, no failed fetch, no console error
result: [pending]

### 8. Review the judgment-tier prohibitions listed in the report (hero look unchanged, no computed-style change from bundling/splitting, BUDGET caps only raised by reviewed edit — the JS cap went 5120 -> 6144 in 528052a, Python font tools not in repo, budget numbers only in BUDGET)
expected: Each confirmed by the reviewer
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps
