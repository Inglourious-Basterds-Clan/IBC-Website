# Phase 04 — API Coverage Matrix (Discord invite surface)

**Endpoint in scope:** `GET https://discord.com/api/v10/invites/{code}?with_counts=true` (public, no auth, CORS-enabled; live-tested in 04-RESEARCH.md).
**Consumers:** build time `lib/discord.js` via `src/_data/discordBadge.js` (baked fallback, plan 04-03); browser `src/js/modules/discord-badge.js` (live update, plan 04-03).
**Status (2026-10-13):** The whole integration was removed in quick task 261013-vh0 (WR-01, GDPR: visitor IPs sent to Discord). Former INTEGRATE rows are now OPT-OUT; nothing on the site or in the build calls this endpoint.
**Rule:** INTEGRATE by default; every OPT-OUT carries a one-line reason.

| capability | decision | reason |
|------------|----------|--------|
| `GET /invites/{code}` request built from `site.discord.invite` | OPT-OUT | Removed 2026-10-13 (quick 261013-vh0, review WR-01): the site no longer calls Discord |
| `with_counts=true` query parameter | OPT-OUT | Removed 2026-10-13 (quick 261013-vh0, review WR-01): the site no longer calls Discord |
| `approximate_member_count` | OPT-OUT | Removed 2026-10-13 (quick 261013-vh0, review WR-01): the site no longer calls Discord |
| `approximate_presence_count` | OPT-OUT | Removed 2026-10-13 (quick 261013-vh0, review WR-01): the site no longer calls Discord |
| Non-2xx responses (404 `10006 Unknown Invite`, 429, 5xx) | OPT-OUT | Removed 2026-10-13 (quick 261013-vh0, review WR-01): the site no longer calls Discord |
| Network error / timeout (`AbortSignal.timeout(5000)`) | OPT-OUT | Removed 2026-10-13 (quick 261013-vh0, review WR-01): the site no longer calls Discord |
| Malformed body (non-JSON, non-integer or negative counts) | OPT-OUT | Removed 2026-10-13 (quick 261013-vh0, review WR-01): the site no longer calls Discord |
| `DISCORD_FETCH=0` offline switch | OPT-OUT | Removed 2026-10-13 (quick 261013-vh0, review WR-01): the site no longer calls Discord |
| `with_expiration` query parameter / `expires_at` field | OPT-OUT | The invite is permanent (`expires_at: null`, tested); expiry is never shown |
| `guild_scheduled_event_id` query parameter / `guild_scheduled_event` field | OPT-OUT | No event content on the site (Event markup and hand-maintained calendars are out of scope; bot calendar is ENG-04, v2) |
| `inviter` object (user id, username, avatar) | OPT-OUT | Privacy: personal user data is never read or rendered (ROST-03 spirit, T-04-11) |
| `guild` object (name, icon, banner, description, features) | OPT-OUT | Not rendered; clan name and branding come from `site.js`; avoids publishing server internals |
| `channel` object (id, name, type) | OPT-OUT | Internal channel names are not public site content |
| `profile` / guild profile fields | OPT-OUT | Not needed for the badge; not rendered |
| `code` and `type` fields of the response | OPT-OUT | The request already uses the configured code; the response echo is ignored |
| Rate-limit headers (`X-RateLimit-*`, `Retry-After`) | OPT-OUT | One GET per page view (only when the badge nears the viewport); failures fall back silently, no retry loop |
| Guild `widget.json` | OPT-OUT | Widget is disabled on the IBC guild (50004) and the widget iframe is out of scope (REQUIREMENTS) |
| OAuth2 / bot API (guild members, presences, roles) | OPT-OUT | Needs a secret token, impossible on a static site; roster data is v2 via the friend's bot (ROST-*) |
| Invite management endpoints (`DELETE /invites/{code}`, channel invite creation) | OPT-OUT | Require authentication; the site only reads public counts |

*Phase: 04-join-operations-pages — written during planning (2026-10-11).*
