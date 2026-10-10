// Build-time code outside src/ (Eleventy never renders it). The one place that runs
// @11ty/eleventy-img (D-01): presets, the list of source images and processImages().
// Variants are encoded into the shared content-addressed cache .cache/img/, never straight
// into the build output, because every build and every test cleans its own output folder;
// eleventy.config.js copies the used variants into <output>/img/ after each build.
// processImages() is memoized once per process, so global data, the copy step and
// scripts/warm-images.js all share one encoding run.
import Image from "@11ty/eleventy-img";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

export const imageCacheDir = join(repoRoot, ".cache", "img");

// Repo-relative folder of the original images (03-06 moves them to src/images, D-02).
export const sourceDir = "src/assets";

export const presets = {
  // Hero (D-03): measured 81 / 114 / 110 KB at 1280 w for AVIF / WebP / JPEG.
  hero: {
    widths: [640, 960, 1280, 1920],
    formats: ["avif", "webp", "jpeg"],
    sharpAvifOptions: { quality: 50 },
    sharpWebpOptions: { quality: 60 },
    sharpJpegOptions: { quality: 65, mozjpeg: true },
  },
};

// Only committed images inside the repository reach the decoder (T-03-01).
function run(fileName, presetName) {
  const path = resolve(repoRoot, sourceDir, fileName);
  const rel = relative(repoRoot, path);
  const outside = rel === "" || rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel);
  if (/^[a-z][a-z0-9+.-]*:/i.test(fileName) || outside) {
    throw new Error(`image source must be a local file inside the repository: ${fileName}`);
  }
  return Image(path, {
    ...presets[presetName],
    // Keep the JPEG fallback for opaque images that carry an alpha channel (Pitfall 3).
    formatFiltering: [],
    outputDir: imageCacheDir,
    // Root-relative; HtmlBasePlugin adds the pathPrefix in src/srcset.
    urlPath: "/img/",
  });
}

let pending = null;

// Resolves to { images: { hero }, files }: the metadata per image and a Set of every
// variant path in .cache/img that the pages use.
export function processImages() {
  pending ??= (async () => {
    const hero = await run("hero-bg.jpg", "hero");
    const all = [hero];
    const files = new Set(all.flatMap((meta) => Object.values(meta).flat().map((entry) => entry.outputPath)));
    return { images: { hero }, files };
  })();
  return pending;
}
