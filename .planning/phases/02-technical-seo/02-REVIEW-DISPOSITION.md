---
phase: 02
review: 02-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "SEO gate silently skips itself (exit 0) when run through a symlinked or junction path"
  - id: CR-02
    severity: critical
    disposition: fixed
    title: "A rejected build stays in `_site/` and the README says it cannot be deployed by mistake"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "A page that overrides og:image gets the default card's alt text"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "Indexable builds are allowed with a non-root PATH_PREFIX, where robots.txt and its Sitemap line are never read"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "`isIndexableUrl` treats any collection URL as an indexable page, including future non-HTML outputs"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "SITE_URL is validated through `new URL()` but emitted raw, so site.js accepts values the gate rejects"
  - id: WR-05
    severity: warning
    disposition: fixed
    title: "G8 `Disallow: /` detection only matches one exact spelling"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "web.config comment says GitHub Pages ignores the file, but Pages publishes it"
  - id: IN-02
    severity: info
    disposition: fixed
    title: "Gate helpers duplicated between the script, the tests and site.js"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "The JSON-LD Organization description is a hand-copied duplicate of the hero paragraph"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "The traversal guard in `locToRelPath` ignores backslash segments on Windows"
  - id: IN-05
    severity: info
    disposition: fixed
    title: "Regenerating the SEO images is machine-dependent and not atomic"
  - id: IN-06
    severity: info
    disposition: fixed
    title: "`--dir` pointing at a file crashes with a stack trace"
  - id: IN-07
    severity: info
    disposition: fixed
    title: "G3 checks only the first og:image:width/height and allows duplicates"
  - id: IN-08
    severity: info
    disposition: fixed
    title: "Draft-marker format is narrower than FACTS.md suggests"
  - id: IN-09
    severity: info
    disposition: fixed
    title: "Workflow actions are pinned to mutable major tags while deploy holds `id-token: write`"
open: 0
total: 16
recorded: 2026-10-08T19:51:13.738Z
---

# Phase 02: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | fixed | 02-REVIEW-FIX.md |
| CR-02 | critical | fixed | 02-REVIEW-FIX.md |
| WR-01 | warning | fixed | 02-REVIEW-FIX.md |
| WR-02 | warning | fixed | 02-REVIEW-FIX.md |
| WR-03 | warning | fixed | 02-REVIEW-FIX.md |
| WR-04 | warning | fixed | 02-REVIEW-FIX.md |
| WR-05 | warning | fixed | 02-REVIEW-FIX.md |
| IN-01 | info | fixed | 02-REVIEW-FIX.md |
| IN-02 | info | fixed | 02-REVIEW-FIX.md |
| IN-03 | info | fixed | 02-REVIEW-FIX.md |
| IN-04 | info | fixed | 02-REVIEW-FIX.md |
| IN-05 | info | fixed | 02-REVIEW-FIX.md |
| IN-06 | info | fixed | 02-REVIEW-FIX.md |
| IN-07 | info | fixed | 02-REVIEW-FIX.md |
| IN-08 | info | fixed | 02-REVIEW-FIX.md |
| IN-09 | info | fixed | 02-REVIEW-FIX.md |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
