import { HtmlBasePlugin } from "@11ty/eleventy";
import Image from "@11ty/eleventy-img";
import { cpSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import site from "./src/_data/site.js";
import { isIndexableUrl } from "./lib/seo.js";
import { buildSchemaGraph, jsonLd } from "./lib/schema.js";
import { processImages } from "./lib/images.js";
import { renderIcon } from "./lib/icons.js";
import { getCssBundle, resetCssBundle } from "./lib/css.js";

export default function (eleventyConfig) {
  // Rewrites root-relative href/src/srcset with pathPrefix and provides the htmlBaseUrl filter.
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Shared indexing predicate (D-19): head noindex, sitemap and the SEO gate (lib/check-seo.js) use the same rule.
  eleventyConfig.addFilter("isIndexableUrl", isIndexableUrl);

  // Home-page JSON-LD (SEO-05, D-14): site -> Organization + WebSite graph -> "<"-escaped JSON.
  eleventyConfig.addFilter("schemaGraph", buildSchemaGraph);
  eleventyConfig.addFilter("jsonLd", jsonLd);

  // Build-time images (D-01): lib/images.js encodes every variant once per process into .cache/img/.
  // The metadata is global data, so the layout (head preload) and the pages read the same object.
  eleventyConfig.addGlobalData("images", async () => (await processImages()).images);
  // Sync on purpose (D-01): async shortcodes break inside Nunjucks {% for %} and macros.
  eleventyConfig.addShortcode("picture", (metadata, attrs) => Image.generateHTML(metadata, attrs));
  // Inline SVG icons (D-11): lib/icons.js holds the paths; an unknown name throws and fails the build.
  // Sync like picture, so it works inside the footer {% for %} loop.
  eleventyConfig.addShortcode("icon", renderIcon);
  // Copy exactly the variants the pages use into <output>/img/ (respects --output). .cache/img is
  // never passthrough-copied: it can hold stale variants from earlier presets (T-03-03).
  eleventyConfig.on("eleventy.after", async ({ directories }) => {
    const { files } = await processImages();
    const target = join(directories.output, "img");
    mkdirSync(target, { recursive: true });
    for (const file of files) cpSync(file, join(target, basename(file)));
  });

  // One stylesheet (D-12): src/css/style.11ty.js writes css/style.css from the Lightning CSS bundle,
  // so the CSS sources are not passthrough-copied. The head links it with ?v=<cssHash>, the first
  // 10 hex characters of the bundle's sha256, so a deploy never serves a stale cached copy.
  eleventyConfig.addGlobalData("cssHash", () => getCssBundle().hash);
  // Every build (also each --serve rebuild) bundles afresh, so npm run dev picks up CSS edits.
  eleventyConfig.on("eleventy.before", () => resetCssBundle());
  eleventyConfig.addWatchTarget("src/css/");

  eleventyConfig.addPassthroughCopy({
    "src/js": "js",
    "src/assets": "assets",
    // Self-hosted Montserrat (D-09): the woff2 and its OFL licence ship together, unchanged.
    "src/fonts": "fonts",
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
