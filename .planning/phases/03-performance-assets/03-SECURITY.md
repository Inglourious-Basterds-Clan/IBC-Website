---
phase: "03"
slug: "performance-assets"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-11"
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Package registries → repo | npm (eleventy-img, sharp, lightningcss) and PyPI (fonttools, Brotli; throwaway venv only) | Build-time code; supply chain |
| Upstream asset sources → repo | google/fonts (Montserrat TTF, OFL), Font Awesome 6.0.0 path data | Vendored binary/vector assets |
| Repo image sources → sharp decoder | Only committed files under `src/images/` are decoded | Image bytes |
| Templates / data → built HTML | Build-time literals (gallery.js, eleventy-img metadata, icon names) reach attributes | Markup (XSS surface) |
| Built site → browser | Static output on GitHub Pages / IIS; no third-party font, icon or CSS hosts remain | Public static assets |
| Build → deploy | check-seo and check-perf gates reject output before deploy | Build artifacts |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-SC (01) | Tampering | npm install @11ty/eleventy-img 7.0.0 + sharp | high | mitigate | Exact pins; `overrides.sharp = 0.35.5` (package.json); lockfile guard in test/deps.test.js | closed |
| T-03-SC (02) | Tampering | pip install fonttools 4.66.1 + Brotli 1.2.0 | high | mitigate | Blocking-human legitimacy checkpoint approved by user 2026-10-10; throwaway venv outside repo; not in package.json / any requirements file | closed |
| T-03-SC (08) | Tampering | npm install lightningcss 1.33.0 | high | mitigate | Legitimacy audit OK; exact pin in package.json; deps.test.js asserts pin and CI binary entry | closed |
| T-03-SC (03,04,05,06,07,09,10,11) | Tampering | dependency tree | low | accept | No installs in these plans | closed |
| T-03-01 | Tampering / Elevation | lib/images.js → sharp decoder | high | mitigate | sharp 0.35.5 (GHSA-wq5f-xc86-pv6w fix); lib/images.js throws on paths outside the repo | closed |
| T-03-02 | Tampering (XSS) | picture shortcode attributes | medium | mitigate | Build-time literals only; eleventy-img escapes alt | closed |
| T-03-03 | Integrity | .cache/img → output img/ | low | mitigate | Only current processImages() files copied; images.test.js fails on unreferenced files | closed |
| T-03-04 | Denial of service | preload under /IBC-Website/ | low | mitigate | imagesrcset via htmlBaseUrl in head.njk; prefix-build tests | closed |
| T-03-05 | Tampering | downloaded Montserrat TTF | medium | mitigate | Pinned google/fonts commit 8b0a1d0; sha256 of source and outputs in tools/fonts/README.md; cmap tests | closed |
| T-03-06 | Repudiation (licence) | font redistribution | low | mitigate | src/fonts/OFL.txt shipped; fonts.test.js checks it | closed |
| T-03-07 | Integrity | check-perf disposition | high | mitigate | Shared removeRejectedOutput in lib/reject-output.js used by both gates; CLI tests | closed |
| T-03-08 | Information disclosure / Tampering | URL resolution in lib/check-perf.js | medium | mitigate | resolveLocal keeps paths inside build folder; "points outside the build output" fixture test | closed |
| T-03-09 | Integrity | crash inside perf rules | medium | mitigate | try/catch in scripts/check-perf.js rejects output, exits 1; crash test | closed |
| T-03-10 | Information disclosure / DoS | multi-MB originals shipped | medium | mitigate | Originals in unshipped src/images/ (8 tracked); build.test.js never-ship guard; perf gate P8 | closed |
| T-03-11 | Tampering (XSS) | data-lightbox-* / gallery attributes | low | mitigate | Build-time literals, Nunjucks autoescape; lightbox.js assigns srcset/src only, no innerHTML | closed |
| T-03-12 | Integrity | committed SEO images | medium | mitigate | og/icons/brand byte-identical to 03ce0de (git diff --quiet) | closed |
| T-03-13 | Information disclosure / Tampering | Google Fonts requests | high | mitigate | No googleapis/gstatic in src/; fonts.test.js + links.test.js allow-list + perf gate P3 | closed |
| T-03-14 | Tampering (XSS) | renderIcon attributes | medium | mitigate | Own-key check on iconPaths; extra class `^[a-z0-9-]+$`; build throws otherwise | closed |
| T-03-15 | Denial of service | IIS serving .avif/.webp/.woff2 | medium | mitigate | remove+mimeMap pairs in src/web.config.njk; seo-files.test.js | closed |
| T-03-16 | Tampering | CSS @import resolution | low | mitigate | Entry imports only ./partials/*.css; css.test.js; Lightning CSS fails on missing import | closed |
| T-03-17 | Integrity | stale CSS after deploy | low | mitigate | `?v=` content hash in head.njk; css.test.js checks it matches shipped bytes | closed |
| T-03-18 | Tampering / Elevation | dynamic import() | high | mitigate | Frozen literal module map with own-property check in src/js/main.js; modules.test.js asserts literal specifiers | closed |
| T-03-19 | Tampering (DOM XSS) | terminal / easter-egg DOM writes | medium | mitigate | createElement + textContent; no innerHTML/outerHTML/insertAdjacentHTML anywhere in src/js | closed |
| T-03-20 | Denial of service | a module failing to load | low | accept | Failure disables only that feature on that page; hook-to-file test | closed |
| T-03-21 | Repudiation | silent budget raise | medium | mitigate | Frozen BUDGET with measurement + date per cap in lib/check-perf.js; README reviewed-edit rule | closed |
| T-03-22 | Integrity | perf gate bypass | high | mitigate | check-perf chained with && in `npm run build`; perf-gate.test.js pins the chain | closed |
| T-03-23 | Integrity | parity / PSI evidence | low | accept | Reviewed by user in human check and by /gsd-verify-work | closed |
| T-03-24 | Information disclosure / Tampering | Font Awesome CDN requests | high | mitigate | No cdnjs/font-awesome in src/; icons.test.js + links.test.js allow-list + perf gate | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-03-01 | T-03-SC (no-install plans) | Plans 03-03..07, 09..11 install no packages; dependency tree unchanged by them | plan threat model | 2026-10-10 |
| AR-03-02 | T-03-20 | A failed module import only disables that one feature on that page; static site, no data at risk | plan threat model (03-09) | 2026-10-10 |
| AR-03-03 | T-03-23 | Parity screenshots and PSI numbers are evidence reviewed by humans, not security controls | plan threat model (03-11) | 2026-10-10 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-11 | 27 | 27 | 0 | /gsd-secure-phase (orchestrator, ASVS L1 grep evidence; auditor skipped per short-circuit rule) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-11
