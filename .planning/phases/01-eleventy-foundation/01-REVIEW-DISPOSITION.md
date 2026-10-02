---
phase: 01
review: 01-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: open
    title: "Documented \"any static host\" build ships `http://localhost:8080` absolute URLs"
  - id: WR-01
    severity: warning
    disposition: open
    title: "`SITE_URL` / `PATH_PREFIX` are normalized but never validated, so bad values produce wrong URLs silently"
  - id: WR-02
    severity: warning
    disposition: open
    title: "Lightbox / easter-egg close sets `body.style.overflow = 'auto'`, which overrides the new `overflow-x: clip` header fix"
  - id: WR-03
    severity: warning
    disposition: open
    title: "Scroll-spy and in-page nav break when the home page is reached as `/index.html`"
  - id: WR-04
    severity: warning
    disposition: open
    title: "Shared head partial hardcodes `og:title`, `og:description` and `meta description` for every page"
  - id: WR-05
    severity: warning
    disposition: open
    title: "`devpages.test.js (h)` runs the real recursive delete against the repo root"
  - id: IN-01
    severity: info
    disposition: open
    title: "Easter egg still writes terminal lines via `innerHTML`, with hardcoded colors"
  - id: IN-02
    severity: info
    disposition: open
    title: "Terminal prints a dangling \"Połączenie nawiązane: \" when the invite attribute is missing, and the test enshrines it"
  - id: IN-03
    severity: info
    disposition: open
    title: "`clean.js` accepts any in-repo path and duplicates the output-dir literal"
  - id: IN-04
    severity: info
    disposition: open
    title: "Dev-page exclusion depends on every file repeating `devOnly: true`"
  - id: IN-05
    severity: info
    disposition: open
    title: "Duplicate `.menu-toggle` rule in the 768px media query"
  - id: IN-06
    severity: info
    disposition: open
    title: "Supply-chain hardening: mutable action tags next to `id-token: write`; CDN stylesheet without SRI"
  - id: IN-07
    severity: info
    disposition: open
    title: "Copyright year hardcoded"
open: 13
total: 13
recorded: 2026-10-02T22:49:37.594Z
---

# Phase 01: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | open | - |
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| WR-05 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |
| IN-06 | info | open | - |
| IN-07 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
