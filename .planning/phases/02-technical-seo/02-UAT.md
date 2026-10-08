---
status: partial
phase: 02-technical-seo
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md, 02-06-SUMMARY.md]
started: 2026-10-08T20:07:47Z
updated: 2026-10-08T20:36:01Z
---

## Current Test

[testing paused — 1 items outstanding]

## Tests

### 1. Share card (OG image) looks right
expected: Open src/assets/og/og-default-v1.jpg. It is 1200×630 with the rose, "KLAN ARMA 3 / MILSIM" and "INGLOURIOUS BASTERDS CLAN" — no dates, recruitment status or counts. Text stays inside the margins and is still legible when the image is shrunk to about 400 px wide (Discord preview size).
result: pass

### 2. Favicon, icons and web manifest
expected: Run `npm run dev` and open http://localhost:8080/. The browser tab shows the rose favicon, readable on both a light and a dark browser theme. In DevTools → Application → Manifest the manifest loads with no errors, shows the icons (192/512) and theme colour #080e11.
result: pass

### 3. Home page description wording (FACTS-01)
expected: The drafted home meta description in src/index.njk (the 156-character recruitment pitch registered as FACTS-01 in FACTS.md) is accurate for the clan and you are happy with its Polish wording. (Confirming it later means: remove `todo: "FACTS-01"` from src/index.njk and set the FACTS.md row to `potwierdzone`.)
result: pass

### 4. Discord rich preview
expected: After pushing main so GitHub Pages redeploys, pasting the Pages URL into Discord shows a rich preview with the IBC title, the description and the 1200×630 card; the embed stripe is dark (#080e11).
result: pass

### 5. Structured data validates
expected: Paste the JSON-LD from the DEPLOYED page (view-source of https://inglourious-basterds-clan.github.io/IBC-Website/) into https://validator.schema.org/ and the Code tab of https://search.google.com/test/rich-results (URL mode refuses the noindex preview; never paste the dev-server _site, which has localhost URLs). Both detect Organization and WebSite with no errors: alternateName includes "IBC", foundingDate 2018, three sameAs links. (The logo looks pale on white by design, D-12.)
result: pass
note: "First run pasted dev-server _site JSON-LD (logo http://localhost:8080/...) and got Nieprawidłowy URL w polu logo; re-run with the deployed snippet: user reported \"yeah. good now\""

### 6. Polish 404 page (FACTS-02)
expected: With `npm run dev` running, open http://localhost:8080/nie-ma-takiej-strony/. You see the styled page in the site layout with heading "404 // UTRACONO SYGNAŁ", Polish letters render correctly, the home button goes to the home page and the Discord button opens the invite in a new tab. You are happy with the drafted FACTS-02 wording.
result: pass

### 7. IIS 404 and manifest at cutover
expected: On the real IIS host at cutover, `curl -I https://<domain>/nie-istnieje/` returns status 404 (not 200 or 500.19) and `curl -I https://<domain>/site.webmanifest` returns Content-Type application/manifest+json.
result: blocked
blocked_by: server
reason: "blocked (needs the final IIS host at domain cutover)"

### 8. Polish README reads correctly
expected: README.md's new sections (SEO gate after every build, SITE_INDEXABLE switch with PowerShell/Git Bash commands, 7-step IIS cutover checklist, FACTS.md, regenerating SEO images, Konfiguracja env overrides) read clearly and correctly in Polish and match how you will actually deploy.
result: pass

### 9. 02-01 D1: Every page has exactly one absolute self-referencing canonical (root, /IBC-Website/ prefix and mutated builds)
expected: Every page has exactly one absolute self-referencing canonical (root, /IBC-Website/ prefix and mutated builds)
result: pass
source: automated
coverage_id: 02-01-D1

### 10. 02-01 D2: sitemap.xml lists exactly the indexable pages by absolute, sorted <loc>; robots.txt never disallows and names the sitemap only on indexable builds
expected: sitemap.xml lists exactly the indexable pages by absolute, sorted <loc>; robots.txt never disallows and names the sitemap only on indexable builds
result: pass
source: automated
coverage_id: 02-01-D2

### 11. 02-01 D3: Post-build gate chained into npm run build: fails with exit 1 and one 'check-seo: <file>: G<n>' line per problem (G0, G2, G7, G8, G9), prints the build-kind banner
expected: Post-build gate chained into npm run build: fails with exit 1 and one 'check-seo: <file>: G<n>' line per problem (G0, G2, G7, G8, G9), prints the build-kind banner
result: pass
source: automated
coverage_id: 02-01-D3

### 12. 02-01 D4: Noindex on every page unless SITE_INDEXABLE is exactly "1"; SITE_INDEXABLE=1 refuses http/localhost; malformed SITE_URL/PATH_PREFIX fails the build; test helpers never inherit SITE_INDEXABLE
expected: Noindex on every page unless SITE_INDEXABLE is exactly "1"; SITE_INDEXABLE=1 refuses http/localhost; malformed SITE_URL/PATH_PREFIX fails the build; test helpers never inherit SITE_INDEXABLE
result: pass
source: automated
coverage_id: 02-01-D4

### 13. 02-02 D3: 512x512 transparent JSON-LD logo
expected: 512x512 transparent JSON-LD logo
result: pass
source: automated
coverage_id: 02-02-D3

### 14. 02-02 D4: Header parsers readImageSize / readIcoEntries (null for non-images)
expected: Header parsers readImageSize / readIcoEntries (null for non-images)
result: pass
source: automated
coverage_id: 02-02-D4

### 15. 02-02 D5: sharp isolated in tools/seo-images at exactly 0.35.4; root package.json has no sharp
expected: sharp isolated in tools/seo-images at exactly 0.35.4; root package.json has no sharp
result: pass
source: automated
coverage_id: 02-02-D5

### 16. 02-03 D1: Home <title> is the D-01 string; subpages get ' | IBC'; untitled pages get 'Inglourious Basterds Clan | IBC'
expected: Home <title> is the D-01 string; subpages get ' | IBC'; untitled pages get 'Inglourious Basterds Clan | IBC'
result: pass
source: automated
coverage_id: 02-03-D1

### 17. 02-03 D3: Gate G1/G4/G6 fail their fixtures (empty, missing and duplicate titles naming both files, missing/empty/double description, keywords); 404 and /_dev/ exempt from G4
expected: Gate G1/G4/G6 fail their fixtures (empty, missing and duplicate titles naming both files, missing/empty/double description, keywords); 404 and /_dev/ exempt from G4
result: pass
source: automated
coverage_id: 02-03-D3

### 18. 02-03 D4: G10 fails indexable builds on TODO markers (one problem per marker, binaries ignored) and never fails preview builds; output stable and sorted
expected: G10 fails indexable builds on TODO markers (one problem per marker, binaries ignored) and never fails preview builds; output stable and sorted
result: pass
source: automated
coverage_id: 02-03-D4

### 19. 02-03 D5: FACTS.md and source markers stay in sync; every marker reaches the output
expected: FACTS.md and source markers stay in sync; every marker reaches the output
result: pass
source: automated
coverage_id: 02-03-D5

### 20. 02-04 D1: Every page has the full absolute OG/Twitter set; og:url = canonical; twitter:image = og:image; no og:/twitter:description without a description; exactly one og:image/twitter:image
expected: Every page has the full absolute OG/Twitter set; og:url = canonical; twitter:image = og:image; no og:/twitter:description without a description; exactly one og:image/twitter:image
result: pass
source: automated
coverage_id: 02-04-D1

### 21. 02-04 D2: ogImage front matter overrides the default without emitting a second og:image
expected: ogImage front matter overrides the default without emitting a second og:image
result: pass
source: automated
coverage_id: 02-04-D2

### 22. 02-04 D3: G3 fails every broken-preview mode (missing, relative, foreign, missing file, twitter/og mismatch, og:url mismatch, card summary, wrong declared width, non-1200x630 on an indexable page) and passes real builds
expected: G3 fails every broken-preview mode (missing, relative, foreign, missing file, twitter/og mismatch, og:url mismatch, card summary, wrong declared width, non-1200x630 on an indexable page) and passes real builds
result: pass
source: automated
coverage_id: 02-04-D3

### 23. 02-04 D4: favicon.ico at the output root (3 entries), icon/manifest links prefixed, theme-color #080e11, valid prefixed manifest with matching icon sizes, manifest not in sitemap
expected: favicon.ico at the output root (3 entries), icon/manifest links prefixed, theme-color #080e11, valid prefixed manifest with matching icon sizes, manifest not in sitemap
result: pass
source: automated
coverage_id: 02-04-D4

### 24. 02-05 D1: Home page publishes exactly one Organization + WebSite JSON-LD graph built from site.js (name, alternateName IBC/IBC Clan, foundingDate 2018, description, url = canonical, 512x512 alpha PNG logo, sameAs = social + Discord); no other page carries JSON-LD
expected: Home page publishes exactly one Organization + WebSite JSON-LD graph built from site.js (name, alternateName IBC/IBC Clan, foundingDate 2018, description, url = canonical, 512x512 alpha PNG logo, sameAs = social + Discord); no other page carries JSON-LD
result: pass
source: automated
coverage_id: 02-05-D1

### 25. 02-05 D2: jsonLd serializer escapes every < so no value can close the script element
expected: jsonLd serializer escapes every < so no value can close the script element
result: pass
source: automated
coverage_id: 02-05-D2

### 26. 02-05 D3: Legacy SportsTeam block removed; graph holds no Person/Event/SportsTeam/AggregateRating/Review nodes or founder/member/employee keys (plan prohibitions)
expected: Legacy SportsTeam block removed; graph holds no Person/Event/SportsTeam/AggregateRating/Review nodes or founder/member/employee keys (plan prohibitions)
result: pass
source: automated
coverage_id: 02-05-D3

### 27. 02-05 D4: Footer social icons rendered from site.social with target=_blank rel=noopener noreferrer; footer.njk holds no social URL literal (D-13)
expected: Footer social icons rendered from site.social with target=_blank rel=noopener noreferrer; footer.njk holds no social URL literal (D-13)
result: pass
source: automated
coverage_id: 02-05-D4

### 28. 02-05 D5: check-seo G5 fails unparseable JSON-LD, a nested Event, the legacy SportsTeam type and a home page without Organization + WebSite; GitHub Pages-style build passes
expected: check-seo G5 fails unparseable JSON-LD, a nested Event, the legacy SportsTeam type and a home page without Organization + WebSite; GitHub Pages-style build passes
result: pass
source: automated
coverage_id: 02-05-D5

### 29. 02-06 D4: GitHub Pages workflow never opts into indexing; header comment describes the noindex preview
expected: GitHub Pages workflow never opts into indexing; header comment describes the noindex preview
result: pass
source: automated
coverage_id: 02-06-D4

### 30. 02-06 D5: 01-REVIEW-DISPOSITION records WR-01, WR-04, R2-WR-01, R2-WR-02, R2-WR-03, R2-IN-04 as fixed, open 14
expected: 01-REVIEW-DISPOSITION records WR-01, WR-04, R2-WR-01, R2-WR-02, R2-WR-03, R2-IN-04 as fixed, open 14
result: pass
source: automated
coverage_id: 02-06-D5

## Summary

total: 30
passed: 29
issues: 0
pending: 0
skipped: 0
blocked: 1

## Gaps
- gap_id: G-02-5
  truth: "Rich Results Test accepts the home Organization + WebSite graph with no errors or warnings, including the logo field"
  status: resolved
  resolved_by: "Test-procedure correction (no code change): re-ran with deployed JSON-LD in RRT Code tab, no logo warning; 02-VALIDATION.md and UAT test 5 wording fixed"
  resolved_at: 2026-10-08T20:36:01Z
  reason: "User reported: pass but google reports \"Nieprawidłowy URL w polu \"logo\" (opcjonalnie)\" (schema.org validator and the rest of the graph passed; deployed logo URL https://inglourious-basterds-clan.github.io/IBC-Website/assets/brand/ibc-logo-512.png is absolute and returns 200 image/png)"
  severity: minor
  test: 5
  root_cause: "Likely test-procedure input, not code: test 5 told the tester to paste JSON-LD from _site/index.html, which the dev server builds with localhost URLs (logo http://localhost:8080/assets/brand/ibc-logo-512.png); Google cannot fetch it. Deployed logo meets every Google Organization logo rule. Unconfirmed until RRT is re-run in URL mode on the deployed page; fallback: transient fetch failure minutes after first deploy of the image."
  artifacts:
    - path: ".planning/phases/02-technical-seo/02-UAT.md"
      issue: "Test 5 procedure allows pasting dev-server _site JSON-LD (localhost URLs)"
    - path: ".planning/phases/02-technical-seo/02-VALIDATION.md"
      issue: "Line 86 carries the same paste-from-_site wording (from 02-05-PLAN.md:135, 02-RESEARCH.md:625)"
  missing:
    - "Re-run Rich Results Test in URL mode on the deployed page to confirm"
    - "Reword the RRT procedure: deployed URL or a SITE_URL/PATH_PREFIX build, never the dev-server _site"
  debug_session: .planning/debug/rich-results-logo-url.md
