---
status: complete
phase: 01-eleventy-foundation
source: [01-VERIFICATION.md]
started: 2026-10-03T00:00:00Z
updated: 2026-10-06T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. D-07 parity walk-through at / (npm run dev, http://localhost:8080/)
expected: Everything behaves as on the old index.html (hero, about, lightbox, terminal, mobile menu, scroll-spy, easter egg, header Discord button at 320/390/768/1440, skip link, no console errors except /favicon.ico); only the header Discord button and skip link are new
result: pass

### 2. Same walk-through under /IBC-Website/ (PowerShell: $env:PATH_PREFIX="/IBC-Website/"; npm run dev, then Remove-Item Env:PATH_PREFIX)
expected: Identical behaviour and look under the subpath, incl. full-size lightbox images and the hero background
result: pass

### 3. Compare baseline/*.png with baseline/after/root-*.png and sub-*.png (10 pairs each)
expected: Same look apart from the header Discord button; scrolled mobile shots now show the fixed header (explained in parity.md)
result: pass

### 4. Answer parity.md question A5: is the old repo root served by any host other than GitHub Pages?
expected: If yes, that host must switch to deploying _site/ and set SITE_URL
result: pass
note: "User answered: no — only GitHub Pages serves the repo"

### 5. Decide on review finding CR-01 (plain `npm run build` emits og:image=http://localhost:8080/...)
expected: Explicit decision recorded in 01-REVIEW-DISPOSITION.md — fixed now (README + build guard) or deferred to Phase 2 (SC5 build gate)
result: pass
reported: "fix"
severity: major
resolved_by: 01-07 (gap G-01-5; CR-01 disposition fixed in 01-REVIEW-DISPOSITION.md; fix confirmed by test 8)
note: "Decision: fix CR-01 now in Phase 1 (build guard on missing SITE_URL + README SITE_URL docs), not deferred"

### 6. Confirm no existing Polish copy or factual claim changed; new visible text is only 'Przejdź do treści' and 'Discord'
expected: Confirmed
result: pass

### 7. GitHub Pages first deploy (01-USER-SETUP.md): Settings -> Pages -> Source: GitHub Actions, push/re-run workflow on main
expected: Build and deploy jobs green; https://inglourious-basterds-clan.github.io/IBC-Website/ serves the site with all assets
result: pass

### 8. Read README "Wdrożenie" and the SITE_URL bullet in "Konfiguracja" (re-verification after gap closure 01-07)
expected: Polish reads naturally; the PowerShell and Git Bash SITE_URL build commands work when pasted as written
result: pass

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-01-5
  truth: "A production build never silently emits http://localhost:8080 absolute URLs: `npm run build` without SITE_URL fails loudly (opt-out ALLOW_LOCAL_SITE_URL=1 for local/test builds), and README deploy instructions document SITE_URL (review finding CR-01)"
  status: resolved
  resolved_by: 01-07 (re-verified in 01-VERIFICATION.md)
  reason: "User reported: fix (decided to fix CR-01 in Phase 1 rather than defer to Phase 2)"
  severity: major
  test: 5
  root_cause: "src/_data/site.js:6-7 falls back to http://localhost:8080 whenever SITE_URL is unset and nothing guards a production build (ELEVENTY_RUN_MODE === 'build') against it; README.md:24 ('Dowolny hosting statyczny') tells self-hosters to run plain `npm run build` without mentioning SITE_URL. Reproduced in 01-REVIEW.md CR-01: output contains og:image=http://localhost:8080/assets/hero-bg.jpg"
  artifacts:
    - path: "src/_data/site.js"
      issue: "Silent localhost fallback for SITE_URL in production builds"
    - path: "README.md"
      issue: "Line 24 static-host deploy instructions omit SITE_URL"
    - path: "test/helpers.js"
      issue: "build() strips SITE_URL; variants relying on the default would fail once the guard exists unless they opt out"
  missing:
    - "Throw in src/_data/site.js when ELEVENTY_RUN_MODE === 'build' and SITE_URL is empty, unless ALLOW_LOCAL_SITE_URL=1 (fix sketch in 01-REVIEW.md CR-01)"
    - "Add ALLOW_LOCAL_SITE_URL to test/helpers.js buildEnvKeys and pass ALLOW_LOCAL_SITE_URL=1 for variants that rely on the default URL"
    - "Test: build without SITE_URL fails with the guard message; with ALLOW_LOCAL_SITE_URL=1 it succeeds"
    - "README 'Dowolny hosting statyczny': document SITE_URL=https://<domena> npm run build with PowerShell and Git Bash variants; note the new guard"
    - "Confirm .github/workflows/pages.yml build still sets SITE_URL (deploy unaffected) and npm run dev is unaffected (serve mode)"
  debug_session: "01-REVIEW.md#cr-01 (diagnosis reused from code review; no separate debug session)"
