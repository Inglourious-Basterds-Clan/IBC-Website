import { HtmlBasePlugin } from "@11ty/eleventy";
import site from "./src/_data/site.js";

export default function (eleventyConfig) {
  // Rewrites root-relative href/src/srcset with pathPrefix and provides the htmlBaseUrl filter.
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addPassthroughCopy({
    "src/css": "css",
    "src/js": "js",
    "src/assets": "assets",
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
