---
last_mapped_commit: 498f19eefca8ec513547073c1d87eb4bb2a09b7d
last_mapped_at: 2026-10-13
---
# External Integrations

**Analysis Date:** 2026-10-13

## APIs & External Services

**Discord (community funnel + member badge):**
- Invite link `https://discord.gg/DhJwkeehJK` - the only literal copy lives in `site.discord.invite` (`src/_data/site.js`)
- Discord Invite API `https://discord.com/api/v10/invites/<code>?with_counts=true` (no auth)
  - Build time: `fetchInviteCounts()` in `lib/discord.js` (global `fetch`, 5 s `AbortSignal.timeout`), called once per process from `src/_data/discordBadge.js`. Any failure falls back to `site.discord.membersBackstop` (240) so the build never breaks. `DISCORD_FETCH=0` disables it (tests).
  - Client side: `src/js/modules/discord-badge.js` fetches the same URL live (`credentials: 'omit'`, `referrerPolicy: 'no-referrer'`) to show member/online counts; baked fallback text stays if it fails.
  - Only `approximate_member_count` / `approximate_presence_count` are read.

**Social profiles (links only):**
- YouTube `https://www.youtube.com/@IBC_A3`, Facebook `https://www.facebook.com/IBCA3` - `site.social` in `src/_data/site.js`, rendered in `src/_includes/partials/footer.njk`

**Schema.org:**
- JSON-LD vocabulary only (`lib/schema.js`), no network calls

**CDNs:** None. Fonts (`src/fonts/`) and icons (`lib/icons.js` inline SVG) are self-hosted.

## Data Storage

**Databases:**
- None. Content is in JS data files under `src/_data/`.

**File Storage:**
- Local filesystem only: source images `src/images/`, static assets `src/assets/` (incl. `assets/og/og-default-v1.jpg`), processed image cache `.cache/img/`

**Caching:**
- Build-side `.cache/img/` content-addressed image cache (`lib/images.js`)
- Browser cache busting via `?v=` hashes (`cssHash` from `lib/css.js`, `jsHash` from `lib/js.js`)

## Authentication & Identity

**Auth Provider:**
- None. No user accounts or login.

## Monitoring & Observability

**Error Tracking:**
- None

**Logs:**
- Build-time console output only; quality gates `scripts/check-seo.js` and `scripts/check-perf.js` fail the build on violations

## CI/CD & Deployment

**Hosting:**
- Preview: GitHub Pages (`https://inglourious-basterds-clan.github.io/IBC-Website/`), always noindex
- Final: IIS host (config via generated `/web.config` from `src/web.config.njk`), built locally with `SITE_URL`/`SITE_INDEXABLE=1`

**CI Pipeline:**
- GitHub Actions `.github/workflows/pages.yml`: on PR/push/dispatch runs `npm ci`, `npm test`, `npm run build`; push to `main` uploads `_site/` and deploys with `actions/deploy-pages`. Actions pinned to commit SHAs; `.github/dependabot.yml` bumps them.

## Environment Configuration

**Required env vars:**
- `SITE_URL` (production builds), `PATH_PREFIX` (subfolder hosting)
- Optional: `SITE_INDEXABLE`, `ALLOW_LOCAL_SITE_URL`, `INCLUDE_DEV_PAGES`, `DISCORD_FETCH`

**Secrets location:**
- None required. No API keys; Discord invite API is public. CI uses only GitHub's built-in OIDC (`id-token: write`) for Pages deploy.

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None (only read-only GET to the Discord invite API)

## Planned

- Roster integration depending on an external Discord bot's data format (per project constraints) - not implemented

---

*Integration audit: 2026-10-13*
