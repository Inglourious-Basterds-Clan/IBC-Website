// Single source for the site URL, the path prefix and the Discord invite.
// SITE_URL and PATH_PREFIX env vars override the local defaults below (the deploy
// workflow sets them). The local SITE_URL default applies only in serve/watch mode
// (`npm run dev`) or with ALLOW_LOCAL_SITE_URL=1. A production build
// (ELEVENTY_RUN_MODE=build, which Eleventy sets before it imports eleventy.config.js,
// which imports this file) with an unset or blank SITE_URL throws (CR-01).
// eleventy.config.js imports this file, so pathPrefix has exactly one source.

const localUrl = "http://localhost:8080";
const rawUrl = (process.env.SITE_URL || "").trim();
if (!rawUrl && process.env.ELEVENTY_RUN_MODE === "build" && process.env.ALLOW_LOCAL_SITE_URL !== "1") {
  throw new Error(
    `SITE_URL is not set: a production build would emit ${localUrl} absolute URLs. ` +
      'Set SITE_URL=https://<domain> (README.md, "Wdrożenie"), ' +
      "or ALLOW_LOCAL_SITE_URL=1 for a local/test build that is never deployed.",
  );
}
const url = (rawUrl || localUrl).replace(/\/+$/, "");

const rawPrefix = (process.env.PATH_PREFIX || "").trim().replace(/^\/+|\/+$/g, "");
const pathPrefix = rawPrefix ? `/${rawPrefix}/` : "/";

export default {
  url, // no trailing slash; absolute URLs = url + pathPrefix + page path
  pathPrefix, // "/" or "/<segment>/"
  name: "Inglourious Basterds Clan",
  discord: {
    invite: "https://discord.gg/DhJwkeehJK", // the only literal copy of the invite
  },
  // Dev-only pages render in serve/watch and when INCLUDE_DEV_PAGES=1 (tests), never in a plain build.
  includeDevPages: process.env.ELEVENTY_RUN_MODE !== "build" || process.env.INCLUDE_DEV_PAGES === "1",
};
