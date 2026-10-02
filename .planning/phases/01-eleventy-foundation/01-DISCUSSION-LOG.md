# Phase 1: Eleventy Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-02
**Phase:** 01-eleventy-foundation
**Areas discussed:** Pre-domain hosting, How strict is parity, Shared chrome on subpages, Repo layout & old files

---

## Pre-domain hosting

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Pages subpath | Served at the github.io /IBC-Website/ URL until a domain exists | ✓ |
| Another host at root | Netlify/Cloudflare Pages at a root URL | |
| Not live until domain | Local builds only | |

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Actions workflow | Build on push to main, publish _site/ to Pages | ✓ |
| Docs only | README only, no CI files | |
| Docs + optional workflow file | Workflow file that does nothing until Pages is enabled | |

| Option | Description | Selected |
|--------|-------------|----------|
| Env vars, workflow sets them | Local defaults in site.js; workflow passes SITE_URL/PATH_PREFIX | ✓ |
| Pages URL as the default | site.js defaults to the Pages URL + prefix | |

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, build-check PRs | Build-only job on pull requests | ✓ |
| No, deploy on main only | Smallest workflow | |

**User's choice:** Pages subpath, Actions deploy, env-var config, PR build check.

---

## How strict is parity

| Option | Description | Selected |
|--------|-------------|----------|
| Visual parity, invisible fixes OK | Root-relative paths, /#anchors, data-discord-url, real top anchor | ✓ |
| Two-step: verbatim, then refactor | Byte-identical first commit, then extraction | |
| Byte parity only | No markup changes beyond strict need | |

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, skip link + main in base layout now | Visually hidden until focused | ✓ |
| No, leave for Phase 5 | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Baseline screenshots + manual checklist | Screenshots + Lighthouse before, side-by-side after | ✓ |
| Automated visual diff | Playwright screenshot comparison | |
| You decide | | |

---

## Shared chrome on subpages

| Option | Description | Selected |
|--------|-------------|----------|
| Data-driven, home anchors for now | navigation.js with /#about etc. | ✓ |
| Same hash links everywhere | #about links, broken on subpages | |

| Option | Description | Selected |
|--------|-------------|----------|
| Header button + footer icon | Compact Discord hud-btn in header on every page | ✓ |
| CTA band above footer | Subpages only | |
| Footer icon only for now | Strict parity | |

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, excluded from output in prod | Dev-only layout test page | ✓ |
| Yes, a real stub page | /jak-dolaczyc/ placeholder now | |
| No test page | Temporary file during execution | |

| Option | Description | Selected |
|--------|-------------|----------|
| Add it now | Accept one visible change to home in Phase 1 | ✓ |
| Build it, hide on home until Phase 5 | Front-matter flag | |

---

## Repo layout & old files

| Option | Description | Selected |
|--------|-------------|----------|
| src/ input, delete root copies | git mv into src/ | ✓ |
| Keep files at root | Eleventy reads root | |

| Option | Description | Selected |
|--------|-------------|----------|
| Delete api/, leave CSS for Phase 3 | | ✓ |
| Delete both now | | |
| Keep everything | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Polish README | Build/deploy/config docs in Polish | ✓ |
| English README | | |

---

## Claude's Discretion

- Partial/layout file names, how the dev test page is excluded in production, HTML Base filter vs transform, workflow details, keeping main.js a classic script.

## Deferred Ideas

- None raised. (`/discord/` redirect page from research was not discussed.)
