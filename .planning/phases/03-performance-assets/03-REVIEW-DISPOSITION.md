---
phase: 03
review: 03-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "A mistyped `--dir` moves or recursively deletes source folders (`src/`, `.git/`, `node_modules/`)"
  - id: WR-01
    severity: warning
    disposition: open
    title: "`/js/main.js` and its modules are not cache-busted, so returning visitors run stale JS against new HTML"
  - id: WR-02
    severity: warning
    disposition: open
    title: "Closing the lightbox or the easter egg sets `body { overflow: auto }`, which overrides the `overflow-x: clip` guard"
  - id: WR-03
    severity: warning
    disposition: open
    title: "The perf gate never sizes or checks most shipped image variants (thumbnails, logo, desktop hero)"
  - id: WR-04
    severity: warning
    disposition: open
    title: "The initial-JS budget (P10) fails open for external and inline scripts"
  - id: WR-05
    severity: warning
    disposition: open
    title: "`processImages()` is memoized for the whole process, so `npm run dev` serves stale gallery and image data"
  - id: IN-01
    severity: info
    disposition: open
    title: "The image-source containment check is against the repo root, not `src/images/`"
  - id: IN-02
    severity: info
    disposition: open
    title: "The feature loader has no rejection handling"
  - id: IN-03
    severity: info
    disposition: open
    title: "The lightbox `<img>` keeps a static English alt for every photo"
  - id: IN-04
    severity: info
    disposition: open
    title: "Three different font size caps"
  - id: IN-05
    severity: info
    disposition: open
    title: "Unused originals are committed in the pipeline input folder"
  - id: IN-06
    severity: info
    disposition: open
    title: "The P3 host list covers only the replaced CDNs"
open: 11
total: 12
recorded: 2026-10-11T11:15:17.278Z
---

# Phase 03: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | fixed | 04-02 |
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

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
