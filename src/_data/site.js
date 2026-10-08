// Single source for the site URL, the path prefix and the Discord invite.
// SITE_URL and PATH_PREFIX env vars override the local defaults below (the deploy
// workflow sets them). The local SITE_URL default applies only in serve/watch mode
// (`npm run dev`) or with ALLOW_LOCAL_SITE_URL=1. A production build
// (ELEVENTY_RUN_MODE=build, which Eleventy sets before it imports eleventy.config.js,
// which imports this file) with an unset or blank SITE_URL throws (CR-01).
// eleventy.config.js imports this file, so pathPrefix has exactly one source.
// SITE_INDEXABLE=1 (exactly "1") is the only way to let search engines index a build (D-15):
// it is opt-in for the final cutover only, and the GitHub Pages workflow never sets it.

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

// SITE_URL must be an origin (WR-01): a path, query or hash would break every absolute URL.
// Runs after the local default is applied, so the default is validated too.
let parsedUrl = null;
try {
  parsedUrl = new URL(url);
} catch {
  parsedUrl = null;
}
if (
  !parsedUrl ||
  (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") ||
  parsedUrl.pathname !== "/" ||
  parsedUrl.search ||
  parsedUrl.hash ||
  parsedUrl.username ||
  parsedUrl.password
) {
  throw new Error(
    `SITE_URL "${rawUrl || url}" is not an origin like https://<domain>: use the scheme and domain only, ` +
      'with no path, query or hash (README.md, "Wdrożenie").',
  );
}

const rawPrefix = (process.env.PATH_PREFIX || "").trim().replace(/^\/+|\/+$/g, "");
const pathPrefix = rawPrefix ? `/${rawPrefix}/` : "/";

// Every prefix segment must be a plain URL path segment (R2-WR-01). This also catches
// Git Bash rewriting /IBC-Website/ to C:/Program Files/Git/IBC-Website/.
const validSegment = (segment) => /^[A-Za-z0-9._~-]+$/.test(segment) && segment !== "." && segment !== "..";
if (rawPrefix && !rawPrefix.split("/").every(validSegment)) {
  throw new Error(
    `PATH_PREFIX "${process.env.PATH_PREFIX}" is not a path like /<folder>/. ` +
      'In Git Bash set MSYS_NO_PATHCONV=1 (README.md, "Podgląd pod podścieżką").',
  );
}

// Strict "1", like ALLOW_LOCAL_SITE_URL: "true" or "yes" keep the build noindex.
const indexable = process.env.SITE_INDEXABLE === "1";
const localHosts = ["localhost", "127.0.0.1", "[::1]"];
if (indexable && (parsedUrl.protocol !== "https:" || localHosts.includes(parsedUrl.hostname))) {
  throw new Error(
    `SITE_INDEXABLE=1 needs a real https SITE_URL; this build would let search engines index ${url} ` +
      "(README.md, cutover checklist).",
  );
}
// Crawlers read robots.txt (and its Sitemap line) only at the host root (WR-02), so an
// indexable build under a subfolder would publish a robots.txt no crawler ever fetches.
if (indexable && pathPrefix !== "/") {
  throw new Error(
    `SITE_INDEXABLE=1 needs PATH_PREFIX=/ (robots.txt is only read at the host root), got ${pathPrefix} ` +
      "(README.md, cutover checklist).",
  );
}

export default {
  url, // no trailing slash; absolute URLs = url + pathPrefix + page path
  pathPrefix, // "/" or "/<segment>/"
  name: "Inglourious Basterds Clan",
  shortName: "IBC", // title suffix (D-02)
  locale: "pl_PL", // og:locale
  themeColor: "#080e11", // = --bg-primary in src/css/style.css (D-09)
  indexable, // D-15: opt-in only (SITE_INDEXABLE=1); every other build is noindex
  ogImage: "/assets/og/og-default-v1.jpg", // D-06: versioned; rename to -v2 and update here to bust Discord/Facebook caches
  ogImageAlt: "Róża IBC i napis „Klan Arma 3 Milsim” na ciemnym tle pola walki", // og:image:alt
  discord: {
    invite: "https://discord.gg/DhJwkeehJK", // the only literal copy of the invite
  },
  // Social profiles (D-13) in display order; the Discord invite stays only in discord.invite.
  social: [
    { id: "youtube", label: "YouTube", url: "https://www.youtube.com/@IBC_A3" },
    { id: "facebook", label: "Facebook", url: "https://www.facebook.com/IBCA3" },
  ],
  // Dev-only pages render in serve/watch and when INCLUDE_DEV_PAGES=1 (tests), never in a plain build.
  includeDevPages: process.env.ELEVENTY_RUN_MODE !== "build" || process.env.INCLUDE_DEV_PAGES === "1",
};
