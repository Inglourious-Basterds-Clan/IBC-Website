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
