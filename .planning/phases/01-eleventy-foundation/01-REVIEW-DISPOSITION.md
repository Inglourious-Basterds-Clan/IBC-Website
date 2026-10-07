---
phase: 01
review: 01-REVIEW.md
review_note: "Rows CR-01..IN-07 come from the full-phase review (superseded in git at 18efc6c); R2-* rows map to WR-*/IN-* in the incremental 01-07 review now in 01-REVIEW.md (d1c923f). IDs were prefixed by hand to avoid id reuse dropping the earlier open rows."
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "Documented \"any static host\" build ships `http://localhost:8080` absolute URLs"
  - id: WR-01
    severity: warning
    disposition: fixed
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
    disposition: fixed
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
  - id: R2-WR-01
    severity: warning
    disposition: fixed
    title: "The guard rejects only empty `SITE_URL`; a malformed value still ships broken `og:image` and exits 0"
  - id: R2-WR-02
    severity: warning
    disposition: fixed
    title: "Following the README \"Zmiana domeny\" steps now fails `npm test` in CI and blocks the deploy"
  - id: R2-WR-03
    severity: warning
    disposition: fixed
    title: "The opt-out gives no signal and stays set in PowerShell, so a forgotten `Remove-Item` brings CR-01 back"
  - id: R2-IN-01
    severity: info
    disposition: open
    title: "The \"inherited opt-out\" build assertion passes on any failure"
  - id: R2-IN-02
    severity: info
    disposition: open
    title: "\"empty env falls back to defaults\" now passes only because of a hidden opt-out; empty-string guard case untested"
  - id: R2-IN-03
    severity: info
    disposition: open
    title: "Comments that are inaccurate or repeated"
  - id: R2-IN-04
    severity: info
    disposition: fixed
    title: "The README still says `site.js` is the only configuration place"
  - id: R2-IN-05
    severity: info
    disposition: open
    title: "`site.js` now throws on import, and the test-runner processes import it unprotected"
open: 14
total: 21
recorded: 2026-10-02T22:49:37.594Z
---

# Phase 01: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | fixed | UAT 2026-10-03: user decided fix now in Phase 1 (gap G-01-5); fixed by 01-07 (build guard + README SITE_URL docs) |
| WR-01 | warning | fixed | fixed by 02-01 (SITE_URL/PATH_PREFIX validation in site.js) |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | fixed | fixed by 02-03/02-04 (head built from front matter) |
| WR-05 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |
| IN-06 | info | open | - |
| IN-07 | info | open | - |
| R2-WR-01 | warning | fixed | fixed by 02-01 (SITE_URL/PATH_PREFIX validation in site.js) |
| R2-WR-02 | warning | fixed | fixed by 02-06 (README cutover checklist; Pages stays the preview) |
| R2-WR-03 | warning | fixed | fixed by 02-01 (check-seo LOCAL build banner) + README Remove-Item steps |
| R2-IN-01 | info | open | 01-REVIEW.md (incremental, plan 01-07) IN-01 |
| R2-IN-02 | info | open | 01-REVIEW.md (incremental, plan 01-07) IN-02 |
| R2-IN-03 | info | open | 01-REVIEW.md (incremental, plan 01-07) IN-03 |
| R2-IN-04 | info | fixed | fixed by 02-06 (README Konfiguracja lists env overrides) |
| R2-IN-05 | info | open | 01-REVIEW.md (incremental, plan 01-07) IN-05 |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
