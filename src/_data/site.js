// Single source for the site URL, the path prefix and the Discord invite.
// SITE_URL and PATH_PREFIX env vars override the local defaults below
// (the deploy workflow sets them; an empty value falls back to the default).
// eleventy.config.js imports this file, so pathPrefix has exactly one source.

const rawUrl = (process.env.SITE_URL || "").trim();
const url = (rawUrl || "http://localhost:8080").replace(/\/+$/, "");

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
