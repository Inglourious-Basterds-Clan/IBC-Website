// Build-time code outside src/ (Eleventy never renders it). The one predicate that decides
// which pages are meant to be indexed (D-19, research Pattern 4). Shared by
// eleventy.config.js (the isIndexableUrl filter used by the head and the sitemap) and by
// the SEO gate (lib/check-seo.js), so template intent and gate intent always agree.
// A page that must stay out of search results is added to nonIndexableUrls (or lives under /_dev/).

const nonIndexableUrls = ["/404.html"];

// url is an Eleventy page.url without the path prefix, e.g. "/", "/o-nas/", "/404.html".
// Only HTML pages can be indexable (WR-03): a non-HTML output such as /feed.xml or
// /search.json never reaches the sitemap, even if its template forgets
// eleventyExcludeFromCollections.
export function isIndexableUrl(url) {
  if (typeof url !== "string" || url === "") return false;
  if (!(url.endsWith("/") || url.endsWith(".html"))) return false;
  if (nonIndexableUrls.includes(url)) return false;
  if (url.startsWith("/_dev/")) return false;
  return true;
}

// Output file path relative to the build folder -> page.url:
// "index.html" -> "/", "o-nas/index.html" -> "/o-nas/", "404.html" -> "/404.html".
export function outputPathToUrl(relPath) {
  const path = relPath.replace(/\\/g, "/");
  if (path === "index.html") return "/";
  if (path.endsWith("/index.html")) return "/" + path.slice(0, -"index.html".length);
  return "/" + path;
}
