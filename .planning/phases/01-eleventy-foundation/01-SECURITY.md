---
phase: "01"
slug: "eleventy-foundation"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-06"
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm registry -> developer machine / CI | Third-party package code (Eleventy; Lighthouse via npx) runs locally and in CI | Package code (supply chain) |
| env (shell / CI job) -> build | SITE_URL / PATH_PREFIX / ALLOW_LOCAL_SITE_URL decide which absolute URLs ship in `_site/` | Public config values |
| repo data files -> templates | navigation.js and site.js values rendered into HTML | Repo-authored, public |
| build-time config -> DOM attribute -> client JS | Discord invite travels via data-discord-url into terminal text | Public invite URL |
| built HTML -> visitor browser | Outbound links opened with target="_blank" | Navigation context |
| pull request author -> CI runner | Untrusted PR code runs npm scripts in the build job | Untrusted code |
| CI build job -> GitHub Pages | Artifact upload and OIDC deploy publish the public site | Public site artifact; OIDC token |
| CLI argument -> filesystem delete | scripts/clean.js deletes a path derived from argv | Local filesystem |
| `_site/` -> public host / link-preview crawlers | og:image (later canonical/og:url/sitemap) read from deployed HTML | Public URLs |
| developer shell / CI env -> test harness | Inherited env vars could leak into test variants | Env config |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-01-01 | Tampering | test/helpers.js build env | low | mitigate | `buildEnvKeys` strips SITE_URL, PATH_PREFIX, INCLUDE_DEV_PAGES, ELEVENTY_RUN_MODE, ALLOW_LOCAL_SITE_URL from inherited env (test/helpers.js:18) | closed |
| T-01-02 | Tampering | src/_data/site.js env read | low | accept | See Accepted Risks AR-01 | closed |
| T-01-03 | Information Disclosure | baseline/lh Lighthouse JSON | low | mitigate | `.planning/phases/*/baseline/lh/` in .gitignore:2; no tracked files under `/lh/` | closed |
| T-01-04 | Tampering | invite anchors with target="_blank" | low | mitigate | `rel="noopener noreferrer"` in src/index.njk, discord-cta.njk, footer.njk; no `target="_blank"` without it | closed |
| T-01-05 | Tampering | discord-cta.njk reverse tabnabbing | medium | mitigate | `rel="noopener noreferrer"` on CTA; layout.test.js (d) asserts it on every `target="_blank"` anchor | closed |
| T-01-06 | Tampering | Nunjucks rendering of navigation/site data | low | mitigate | Autoescape on; single `\| safe` on `content` (src/_includes/layouts/base.njk:18) | closed |
| T-01-07 | Tampering | writeToConsole HTML construction (src/js/main.js) | low | mitigate | time/tag/message set via `textContent` (src/js/main.js:159-168); no innerHTML in writeToConsole | closed |
| T-01-08 | Elevation of Privilege | pages.yml deploy on pull_request | high | mitigate | Deploy `if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'` (pages.yml:40); upload skipped for PRs (pages.yml:35); workflow.test.js (c)/(d) | closed |
| T-01-09 | Elevation of Privilege | GITHUB_TOKEN permissions | high | mitigate | Workflow-level `contents: read` (pages.yml:11-12); `pages: write` + `id-token: write` only on deploy job (pages.yml:43-45); workflow.test.js (b)/(c)/(d) | closed |
| T-01-10 | Tampering | npm cache in a privileged job | medium | mitigate | `cache: npm` only in build job (pages.yml:29); deploy job has no setup-node; workflow.test.js (d) | closed |
| T-01-11 | Tampering | third-party actions by major tag | low | accept | See Accepted Risks AR-02 | closed |
| T-01-12 | Information Disclosure | README.md | low | accept | See Accepted Risks AR-03 | closed |
| T-01-13 | Information Disclosure | dev-only pages in production | low | mitigate | `includeDevPages` false for build unless INCLUDE_DEV_PAGES=1 (src/_data/site.js:31, eleventy.config.js:14); build cleans `_site/` first; devpages.test.js (e) | closed |
| T-01-14 | Tampering | scripts/clean.js argv path | medium | mitigate | Target resolved against repo root; root/parent/other-drive refused with exit 1 (scripts/clean.js:9-16); devpages.test.js (h) | closed |
| T-01-15 | Spoofing | own-site absolute URLs to wrong host | low | mitigate | links.test.js (d)-(f): non-allowlisted absolute URLs must start with SITE_URL + prefix | closed |
| T-01-16 | Information Disclosure | after-migration Lighthouse JSON | low | mitigate | Written under gitignored `baseline/lh/` (.gitignore:2); nothing tracked there | closed |
| T-01-17 | Tampering | site.js production output (og:image; later canonical/og:url/sitemap) | medium | mitigate | Guard throws on build with unset/blank SITE_URL unless ALLOW_LOCAL_SITE_URL=1 (src/_data/site.js:11-15); build.test.js runs real CLI; clean.js runs first | closed |
| T-01-18 | Tampering | ALLOW_LOCAL_SITE_URL opt-out leaking | low | mitigate | Strict `!== "1"` check (site.js:11); helpers.js strips the key; workflow.test.js (h) forbids it in pages.yml | closed |
| T-01-19 | Denial of Service | GitHub Pages deploy build job | low | mitigate | SITE_URL + PATH_PREFIX in build job env (pages.yml:22-23); workflow.test.js (g) | closed |
| T-01-20 | Information Disclosure | Guard error message and README | low | accept | See Accepted Risks AR-04 | closed |
| T-01-SC (01-01) | Tampering | npm install / npx | high | mitigate | Single direct dep `@11ty/eleventy ~3.1.6` (package.json:14), lockfile committed; Lighthouse only via `npx -y lighthouse@13.5.0`, not in package.json | closed |
| T-01-SC (01-02, 01-03, 01-05) | Tampering | npm installs | high | accept | See Accepted Risks AR-05 | closed |
| T-01-SC (01-04) | Tampering | npm ci in CI | high | mitigate | `npm ci` (pages.yml:30) installs the committed package-lock.json | closed |
| T-01-SC (01-06) | Tampering | npx lighthouse | high | mitigate | Exact `lighthouse@13.5.0` via npx; absent from package.json | closed |
| T-01-SC (01-07) | Tampering | npm installs | low | accept | See Accepted Risks AR-05 | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

**Informational (outside register):** `initEasterEgg` in src/js/main.js:240 still uses `innerHTML`, but only interpolates a locally computed `HH:MM:SS` string and constants — no external or config data reaches it. Not a sink at L1; candidate for the same textContent refactor later.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-01-02 | Env values come only from the repo-controlled workflow or the developer's own shell, never from visitors; Nunjucks autoescape encodes them in attributes | plan 01-01 threat model | 2026-10-03 |
| AR-02 | T-01-11 | All actions are GitHub-owned `actions/*` at current majors (v7/v5); SHA pinning optional at ASVS L1, can be added later | plan 01-04 threat model | 2026-10-03 |
| AR-03 | T-01-12 | README holds no secrets; invite referenced by location (src/_data/site.js), not copied | plan 01-04 threat model | 2026-10-03 |
| AR-04 | T-01-20 | Guard message names only env var names and the public localhost default; README holds no secrets or invite copy | plan 01-07 threat model | 2026-10-03 |
| AR-05 | T-01-SC (01-02, 01-03, 01-05, 01-07) | These plans install no packages; dependency set from 01-01 unchanged (Node built-ins only) | plan threat models | 2026-10-03 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-06 | 25 | 25 | 0 | /gsd-secure-phase (L1 grep-depth, orchestrator; auditor skipped per short-circuit — plan-time register, ASVS 1). `npm test`: 56/56 pass |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-06
