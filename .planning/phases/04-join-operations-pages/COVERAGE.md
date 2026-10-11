# Phase 04 — API Coverage Matrix (Discord invite surface)

**Endpoint in scope:** `GET https://discord.com/api/v10/invites/{code}?with_counts=true` (public, no auth, CORS-enabled; live-tested in 04-RESEARCH.md).
**Consumers:** build time `lib/discord.js` via `src/_data/discordBadge.js` (baked fallback, plan 04-03); browser `src/js/modules/discord-badge.js` (live update, plan 04-03).
**Rule:** INTEGRATE by default; every OPT-OUT carries a one-line reason.

| capability | decision | reason |
|------------|----------|--------|
| `GET /invites/{code}` request built from `site.discord.invite` (code parsed by `inviteCode()`) | INTEGRATE | Single source of the invite (FOUND-04); the code is validated `^[A-Za-z0-9-]+$` before it reaches a URL (04-03) |
| `with_counts=true` query parameter | INTEGRATE | Required for the two count fields D-14 shows |
| `approximate_member_count` | INTEGRATE | Baked fallback (floored, e.g. "200+ osób") at build time and live number in the browser (D-14, D-16) |
| `approximate_presence_count` | INTEGRATE | Live "· N online" in the browser only; never baked, a baked online count goes stale within minutes (D-16) |
| Non-2xx responses (404 `10006 Unknown Invite`, 429, 5xx) | INTEGRATE | Handled: build falls back to `site.discord.membersBackstop`, browser keeps the baked text silently (D-16) |
| Network error / timeout (`AbortSignal.timeout(5000)`) | INTEGRATE | Handled the same way; the build never fails or hangs because of Discord (T-04-09) |
| Malformed body (non-JSON, non-integer or negative counts) | INTEGRATE | Rejected by integer validation; nothing is written (T-04-07) |
| `DISCORD_FETCH=0` offline switch | INTEGRATE | Test builds and offline builds skip the network deterministically (Pitfall 5) |
| `with_expiration` query parameter / `expires_at` field | OPT-OUT | The invite is permanent (`expires_at: null`, tested); expiry is never shown |
| `guild_scheduled_event_id` query parameter / `guild_scheduled_event` field | OPT-OUT | No event content on the site (Event markup and hand-maintained calendars are out of scope; bot calendar is ENG-04, v2) |
| `inviter` object (user id, username, avatar) | OPT-OUT | Privacy: personal user data is never read or rendered (ROST-03 spirit, T-04-11) |
| `guild` object (name, icon, banner, splash, description, features, vanity code, nsfw level) | OPT-OUT | Not rendered; clan name and branding come from `site.js`; avoids publishing server internals |
| `channel` object (id, name, type) | OPT-OUT | Internal channel names are not public site content |
| `profile` / guild profile fields | OPT-OUT | Not needed for the badge; not rendered |
| `code` and `type` fields of the response | OPT-OUT | The request already uses the configured code; the response echo is ignored |
| Rate-limit headers (`X-RateLimit-*`, `Retry-After`) | OPT-OUT | One GET per page view (only when the badge nears the viewport); failures fall back silently, no retry loop |
| Guild `widget.json` | OPT-OUT | Widget is disabled on the IBC guild (50004) and the widget iframe is out of scope (REQUIREMENTS) |
| OAuth2 / bot API (guild members, presences, roles) | OPT-OUT | Needs a secret token, impossible on a static site; roster data is v2 via the friend's bot (ROST-*) |
| Invite management endpoints (`DELETE /invites/{code}`, channel invite creation) | OPT-OUT | Require authentication; the site only reads public counts |

*Phase: 04-join-operations-pages — written during planning (2026-10-11).*
