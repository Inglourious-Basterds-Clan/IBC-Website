import { HtmlBasePlugin } from "@11ty/eleventy";
import site from "./src/_data/site.js";
import { isIndexableUrl } from "./lib/seo.js";
import { buildSchemaGraph, jsonLd } from "./lib/schema.js";

export default function (eleventyConfig) {
  // Rewrites root-relative href/src/srcset with pathPrefix and provides the htmlBaseUrl filter.
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Shared indexing predicate (D-19): head noindex, sitemap and the SEO gate (lib/check-seo.js) use the same rule.
  eleventyConfig.addFilter("isIndexableUrl", isIndexableUrl);

  // Home-page JSON-LD (SEO-05, D-14): site -> Organization + WebSite graph -> "<"-escaped JSON.
  eleventyConfig.addFilter("schemaGraph", buildSchemaGraph);
  eleventyConfig.addFilter("jsonLd", jsonLd);

  eleventyConfig.addPassthroughCopy({
    "src/css": "css",
    "src/js": "js",
    "src/assets": "assets",
    // Root favicon for browsers that request /favicon.ico on their own (fixes the Phase 1 404).
    "src/favicon.ico": "favicon.ico",
  });

  // Dev-only pages (D-12): dropped from production builds, kept in serve/watch and when INCLUDE_DEV_PAGES=1.
  eleventyConfig.addPreprocessor("devOnly", "*", (data) => {
    if (data.devOnly && !site.includeDevPages) return false;
  });
}

export const config = {
  dir: {
    input: "src",
    output: "_site",
  },
  pathPrefix: site.pathPrefix,
  htmlTemplateEngine: "njk",
  markdownTemplateEngine: "njk",
};
