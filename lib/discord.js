// Build-time code outside src/ (Eleventy never renders it). Discord invite helpers for the
// live members badge (CONT-07, D-14..D-16): the invite API URL built from site.discord.invite,
// the rounded "200+ osób" fallback text and the one build-time count fetch.
// Only approximate_member_count and approximate_presence_count are ever read from the invite
// response; its inviter, guild and channel data are never touched. Node built-ins only.

export const inviteApiBase = "https://discord.com/api/v10/invites/";

// The invite code is the last path segment of site.discord.invite. Throws when it is
// missing or not a plain code ([A-Za-z0-9-]+), so a broken invite fails the build loudly.
export function inviteCode(invite) {
  const code = new URL(invite).pathname.split("/").filter(Boolean).pop() || "";
  if (!/^[A-Za-z0-9-]+$/.test(code)) throw new Error(`site.discord.invite has no invite code: ${invite}`);
  return code;
}

export function inviteApiUrl(invite) {
  return inviteApiBase + inviteCode(invite) + "?with_counts=true";
}

// Rounds down for the baked fallback (D-16): >= 100 to a multiple of 50, 10..99 to a
// multiple of 10, below 10 exact. 246 -> 200, 99 -> 90, 9 -> 9.
export function floorCount(n) {
  if (!Number.isInteger(n) || n < 0) throw new Error(`member count must be a non-negative integer, got ${n}`);
  if (n >= 100) return Math.floor(n / 50) * 50;
  if (n >= 10) return Math.floor(n / 10) * 10;
  return n;
}

// Polish plural of "osoba" (Pitfall 7): 1 osoba, 2-4 / 22-24 osoby, 5+ / 12-14 osób.
const pluralRules = new Intl.PluralRules("pl-PL");
export function personWord(n) {
  const category = pluralRules.select(n);
  if (category === "one") return "osoba";
  if (category === "few") return "osoby";
  return "osób";
}

// 240 -> "200+ osób". Only the member count is baked; an online count goes stale in minutes.
export function fallbackText(members) {
  const floored = floorCount(members);
  return `${floored}+ ${personWord(floored)}`;
}

const isCount = (value) => Number.isInteger(value) && value >= 0;

// One GET of the invite endpoint. Resolves to { members, online } (online null when absent or
// invalid) or to null on any failure: non-2xx, timeout, network error, bad JSON, bad counts.
// Never throws and never logs, so Discord can never break the build (D-16).
export async function fetchInviteCounts(invite, { fetchImpl = globalThis.fetch, timeoutMs = 5000 } = {}) {
  try {
    const response = await fetchImpl(inviteApiUrl(invite), {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    const body = await response.json();
    const members = body.approximate_member_count;
    const online = body.approximate_presence_count;
    if (!isCount(members)) return null;
    return { members, online: isCount(online) ? online : null };
  } catch {
    return null;
  }
}
