---
phase: 04
review: 04-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "Live Discord badge sends every home-page visitor's IP address to Discord (GDPR), the same problem that led to removing Google Fonts"
  - id: WR-02
    severity: warning
    disposition: open
    title: "Tests require the draft markers to exist, so the documented FACTS confirmation steps break `npm test`"
  - id: WR-03
    severity: warning
    disposition: open
    title: "Subpage anchors scroll under the fixed header, and FAQ deep links stay collapsed"
  - id: WR-04
    severity: warning
    disposition: open
    title: "CR-01 test runs the real `clean.js` against the repository root and its parent"
  - id: IN-01
    severity: info
    disposition: open
    title: "The `/operacje/` schedule and the \"Typowy wieczór\" timeline disagree"
  - id: IN-02
    severity: info
    disposition: open
    title: "`overflow: hidden` on recap cards clips the `.hud-border` corner brackets"
  - id: IN-03
    severity: info
    disposition: open
    title: "Module versioning (WR-01) only covers `import()` calls in `main.js`, and no test enforces that"
  - id: IN-04
    severity: info
    disposition: open
    title: "An exception in the G12 text helpers skips the rejection path and leaves `_site/` in place"
open: 8
total: 8
recorded: 2026-10-13T20:15:23.620Z
---

# Phase 04: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
