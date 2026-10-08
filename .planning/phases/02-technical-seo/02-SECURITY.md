---
phase: "02"
slug: "technical-seo"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-08"
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Build environment → site.js | SITE_URL, PATH_PREFIX, SITE_INDEXABLE env vars decide URLs and whether a build may be indexed | Deployment config (public, but wrong values cause accidental indexing or broken canonicals) |
| Build output → host (GitHub Pages / IIS) | `_site/` is published; the post-build gate decides whether output is fit to ship | Public HTML, sitemap, robots.txt, web.config |
| Page front matter / site data → head.njk | Titles, descriptions, OG values and JSON-LD rendered into HTML | Author-controlled text, autoescaped (JSON-LD escapes `<`) |
| npm registry → tools/seo-images | sharp and its prebuilt binaries installed for the one-off image generator | Third-party native code (supply chain) |
| Local files → sharp decoders | Two raster source images fed to sharp | Binary image data |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-02-01 | Information disclosure / Spoofing | head.njk robots meta, site.js `indexable` | high | mitigate | Indexable only for SITE_INDEXABLE exactly "1" on https non-local SITE_URL (site.js:63-66); noindex on every other build (head.njk:15); gate G9 (lib/check-seo.js) | closed |
| T-02-02 | Tampering | site.js SITE_URL / PATH_PREFIX parsing | medium | mitigate | `new URL` validation, normalised origin emitted (WR-04 fix), PATH_PREFIX whitelist (site.js:27-57); gate G2 | closed |
| T-02-03 | Denial of service (search visibility) | src/robots.txt.njk | medium | mitigate | robots.txt never emits Disallow; gate G8 catches every site-wide Disallow spelling (WR-05 fix) | closed |
| T-02-04 | Repudiation / Tampering | package.json build chain, scripts/check-seo.js | medium | mitigate | `build` chains `node scripts/check-seo.js` unconditionally; CLI always runs (CR-01 fix), no env reads in gate; failing output moved to `_site.rejected/` (CR-02 fix) | closed |
| T-02-SC | Tampering (supply chain) | npm install of sharp (tools/seo-images) | high | mitigate | Blocking-human legitimacy checkpoint approved by user; exact pin 0.35.4 with own lockfile; isolated from root install/CI; test/seo-assets.test.js asserts root has no sharp | closed |
| T-02-05 | Tampering | tools/seo-images/make-seo-images.js | low | mitigate | Writes only six fixed paths (all-or-nothing, IN-05 fix); two fixed inputs; no network imports | closed |
| T-02-06 | Repudiation / Information | committed OG card content | low | mitigate | Card carries only D-06 wording; versioned filename `og-default-v1.jpg` | closed |
| T-02-07 | Tampering | head.njk title/description output | medium | mitigate | Autoescape on; `safe` used only for the escaped JSON-LD line (head.njk:56) | closed |
| T-02-08 | Repudiation / Information | drafted copy on the indexable host | medium | mitigate | TODO(FACTS-NN) markers registered in FACTS.md; G10 fails indexable builds; test/facts.test.js | closed |
| T-02-09 | Spoofing / Tampering | og:image, og:url, twitter:image | medium | mitigate | Absolute URLs via htmlBaseUrl; gate G3 checks host, canonical match, file existence and size | closed |
| T-02-10 | Tampering | site.webmanifest | low | mitigate | Built as a dict and serialized with `dump(2)` (site.webmanifest.njk:21); test (m) | closed |
| T-02-11 | Tampering | jsonLd() output under `safe` | medium | mitigate | `jsonLd` replaces every `<` with `<` (lib/schema.js:47); gate G5 re-parses every block | closed |
| T-02-12 | Information disclosure | lib/schema.js graph | low | mitigate | test/schema.test.js forbids Person/Event/SportsTeam/rating nodes and founder/member/employee keys | closed |
| T-02-13 | Tampering (reverse tabnabbing) | footer social anchors | low | mitigate | `rel="noopener noreferrer"` on every `target="_blank"` link (footer.njk:15,18) | closed |
| T-02-14 | Information disclosure | src/web.config.njk on GitHub Pages | low | accept | See accepted risk AR-02-01 | closed |
| T-02-15 | Denial of service | web.config on IIS (500.19) | medium | mitigate | `<remove>` before each `<error>`/`<mimeMap>` (web.config.njk:13,17); README unlock step | closed |
| T-02-16 | Spoofing (soft 404) / Information | 404 page | low | mitigate | `eleventyExcludeFromCollections`, noindex on every build; ExecuteURL keeps 404 status (curl check at cutover) | closed |
| T-02-17 | Elevation of privilege (accidental indexing) | README PowerShell commands | medium | mitigate | README pairs `$env:` with `Remove-Item`; gate banner names build kind; workflow test asserts CI never sets SITE_INDEXABLE | closed |
| T-02-ADV-01 | Tampering / Elevation (RCE) | sharp 0.35.4 in tools/seo-images — GHSA-wq5f-xc86-pv6w (librsvg, glibc Linux, fixed in 0.35.5) | high | mitigate | Audited by gsd-security-auditor: every SVG fed to sharp is built from file constants (no env/argv/file input); both disk inputs pass `readRaster()` PNG/JPEG signature check and the checked buffer (not the path) is decoded; signature-prefixed SVG goes to PNG/JPEG decoders, never librsvg (probed on 0.35.4); not in root install, CI or build; no network imports. Closure rests on these code controls, not on the "Windows-only" run intent | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

### Follow-ups (non-blocking)

- Vet and pin sharp ≥ 0.35.5 in tools/seo-images, rerun the generator, and update the version pins in test/seo-assets.test.js:72,79. This removes the vulnerable code entirely.
- "Windows-only" is intent, not a control: no `process.platform` check exists and the tool lockfile includes the glibc libvips build. Consider a README note on the advisory until the upgrade.
- `readRaster()` has no regression test; extract and test it so a refactor cannot silently drop the signature check.
- **Phase 3:** `@11ty/eleventy-img@7` depends on `sharp ^0.35.3`, which would put sharp in the root tree and in CI on ubuntu-latest (glibc). The root lockfile must resolve sharp ≥ 0.35.5, and SVG-input exposure must be re-assessed for eleventy-img's inputs.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-02-01 | T-02-14 | GitHub Pages publishes `web.config` as a public file. It holds only a 404 mapping and a MIME entry (no credentials, paths or server names); the file comment warns against adding secrets (IN-01 fix). IIS itself refuses to serve web.config | Plan 02-06 threat model | 2026-10-07 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-08 | 19 | 19 | 0 | Orchestrator L1 grep (T-02-01..T-02-17, T-02-SC) + gsd-security-auditor (T-02-ADV-01, user chose "Verify all open threats") |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-08
