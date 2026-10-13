// Global data `discordBadge` for the live Discord badge on the home page (CONT-07, D-16).
// The baked fallback text comes from one build-time fetch per process (memoized below).
// DISCORD_FETCH exactly "0" skips the network (every test build sets it, Pitfall 5).
// Any failure (offline, timeout, non-2xx, malformed body) uses the committed
// site.discord.membersBackstop, so Discord never breaks the build. Only the member count
// is baked; the online count is shown only by the live update in the browser.
import site from "./site.js";
import { fallbackText, fetchInviteCounts, inviteApiUrl } from "../../lib/discord.js";

let pending = null;

export default async function () {
  pending ??= (async () => {
    const live = process.env.DISCORD_FETCH === "0" ? null : await fetchInviteCounts(site.discord.invite);
    return {
      apiUrl: inviteApiUrl(site.discord.invite),
      fallbackText: fallbackText(live ? live.members : site.discord.membersBackstop),
    };
  })();
  return pending;
}
