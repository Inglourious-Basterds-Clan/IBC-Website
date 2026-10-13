---
phase: "04"
slug: "join-operations-pages"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-13"
---

# Phase 04 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Package registries → repo | No package was installed in this phase (T-04-SC accepted in every plan) | none |
| Data files → built HTML / JSON-LD | `join.js`, `operations.js`, breadcrumb front matter reach markup and `<script type="application/ld+json">` | Markup (XSS surface), structured data |
| Build → discord.com | Build-time invite lookup for the baked member count (`lib/discord.js`) | Public invite metadata |
| Browser → discord.com | Live badge fetch from the visitor's browser (locked D-15) | Visitor IP; approximate member/presence counts |
| URL hash → navigation | Legacy `#recruitment` redirect (`hash-redirect.js`) | Untrusted `location.hash` |
| Build → deploy | check-seo (G1–G12) and check-perf gates; rejected output moved aside | Build artifacts |
| Build scripts → filesystem | `scripts/clean.js` and `removeRejectedOutput` delete/move folders | Source tree integrity |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-04-SC (01–08) | Tampering | npm installs | low | accept | No package installed in any plan; package.json unchanged | closed |
| T-04-01 | Tampering | head.njk subpage JSON-LD | high | mitigate | `lib/schema.js:97` `jsonLd` escapes `<` as `<`; head.njk only safe use is through it | closed |
| T-04-02 | Repudiation | drafted FAQ answers, description, intro | medium | mitigate | `draft: "TODO(FACTS-NN)"` in `src/_data/join.js`; G10 blocks indexable build; facts.test.js sync | closed |
| T-04-03 | Spoofing | FAQPage / BreadcrumbList vs page | medium | mitigate | Single data source; `test/pages.test.js` compares `visibleText` with JSON-LD; G11/G12 gate | closed |
| T-04-04 | Tampering | Nunjucks output of data copy | low | mitigate | Autoescape not disabled anywhere in `eleventy.config.js`; no `| safe` on data | closed |
| T-04-05 | Tampering | `lib/reject-output.js` removeRejectedOutput | high | mitigate | `isDisposableOutput` allow-list (`_site`, `_test/**`) before any rename/rmSync; reject-output.test.js | closed |
| T-04-06 | Tampering | `scripts/clean.js` rmSync | high | mitigate | Imports and enforces the same `isDisposableOutput`; refusal exits 1 | closed |
| T-04-07 | Information disclosure / Tampering | refused rejected folder left in place | medium | mitigate | Gate still exits 1 with "DO NOT DEPLOY IT"; only non-output folders are left | closed |
| T-04-08 | Tampering (DOM XSS) | `discord-badge.js` | high | mitigate | Integer-only values written with `textContent`; no HTML-string sinks | closed |
| T-04-09 | Denial of service | build-time Discord fetch | medium | mitigate | `AbortSignal.timeout` in `lib/discord.js`; null → committed backstop; `DISCORD_FETCH=0` in tests | closed |
| T-04-10 | Information disclosure | visitor IP sent to Discord (D-15) | medium | mitigate | Lazy fetch near viewport; `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`; privacy page deferred to ROST-05 | closed |
| T-04-11 | Information disclosure | inviter/guild/channel data in response | medium | mitigate | Only `approximate_member_count` / `approximate_presence_count` read | closed |
| T-04-12 | Spoofing / Tampering | `data-api-url` pointing elsewhere | low | mitigate | Module refuses any URL not starting with `https://discord.com/api/` | closed |
| T-04-13 | Repudiation | drafted recaps, evening, lastUpdate | medium | mitigate | `draft: "TODO(FACTS-NN)"` in `src/_data/operations.js` (FACTS-06..13); G10 | closed |
| T-04-14 | Spoofing (search policy) | structured data for recaps/schedule | medium | mitigate | G5 bans Event at any depth; no upcoming dates on the page | closed |
| T-04-15 | Tampering | recap `file` values → image decoder | low | mitigate | `lib/images.js` `run()` path guard; pages.test.js asserts committed originals | closed |
| T-04-16 | Information disclosure | member names in recap texts | low | mitigate | No names/callsigns in recap copy; user confirms each recap via FACTS.md before indexing | closed |
| T-04-17 | Spoofing (search spam policy) | FAQPage / BreadcrumbList diverging | medium | mitigate | G11 + G12 in `lib/check-seo.js`, 29 fixtures in seo-gate.test.js | closed |
| T-04-18 | Tampering | gate failing open on malformed JSON-LD | medium | mitigate | G5 fails unparseable blocks; G11 treats a missing node as a problem | closed |
| T-04-19 | Denial of service | regex scanning of large HTML | low | accept | Inputs are the site's own small build output; non-nested bounded patterns | closed |
| T-04-20 | Spoofing (open redirect) | `hash-redirect.js` | high | mitigate | Exact `===` against `data-legacy-hash`; target is the link's build-time href; `#//evil.example` test never navigates | closed |
| T-04-21 | Tampering (selector injection) | `hash-redirect.js` | medium | mitigate | Only fixed `a[data-legacy-hash]` query; nothing built from `location.hash` | closed |
| T-04-22 | Tampering (DOM XSS) | teaser and nav templates | low | mitigate | Autoescape; client.test.js static check forbids HTML-string sinks | closed |
| T-04-23 | Tampering (code integrity) | stale cached main.js/modules | medium | mitigate | Content-hashed `?v=` on main.js (base.njk) and every module import; js-version.test.js | closed |
| T-04-24 | Tampering | `version` concatenated into import() | low | accept | Version comes from main.js's own build-set URL; specifier paths literal; hook names are map keys only | closed |
| T-04-25 | Information disclosure | README content | low | mitigate | docs.test.js (d) keeps the invite out of the README; no secrets in project | closed |
| T-04-26 | Denial of service (performance) | CSS bundle growth | low | mitigate | check-perf P9 `cssGzipMaxBytes` 5120 enforced every build (4663 B measured) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-04-01 | T-04-SC | No package installed in any Phase 4 plan; nothing new enters the supply chain | plan-time threat model | 2026-10-13 |
| AR-04-02 | T-04-19 | Gate regexes only scan the site's own few build pages; no attacker-controlled input | plan-time threat model | 2026-10-13 |
| AR-04-03 | T-04-24 | `version` cannot be influenced by page URLs or attributes; import specifiers stay literal | plan-time threat model | 2026-10-13 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-13 | 26 | 26 | 0 | secure-phase (orchestrator, L1 grep evidence; register authored at plan time) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-13
