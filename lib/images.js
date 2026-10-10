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
import gallery from "../src/_data/gallery.js";

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
  // Gallery thumbnails (D-05): cover the grid slots (285 px, 50vw, 100vw) at 1x and 2x.
  thumb: {
    widths: [400, 600, 900, 1200],
    formats: ["avif", "webp", "jpeg"],
    sharpAvifOptions: { quality: 50 },
    sharpWebpOptions: { quality: 72 },
    sharpJpegOptions: { quality: 72, mozjpeg: true },
  },
  // Lightbox (D-04): one 1600 w variant per format, measured at most 224 KB (cap 300 KB).
  lightbox: {
    widths: [1600],
    formats: ["avif", "webp", "jpeg"],
    sharpAvifOptions: { quality: 50 },
    sharpWebpOptions: { quality: 72 },
    sharpJpegOptions: { quality: 72, mozjpeg: true },
  },
  // Header logo (PERF-03, Pitfall 7): shown 48 px tall, so 1x and 2x of 50 w (50x48, 100x97).
  // PNG keeps the transparency. Writes only into .cache/img; the committed brand logo under
  // src/assets/brand/ is a separate file and is never touched (D-06).
  logo: {
    widths: [50, 100],
    formats: ["avif", "webp", "png"],
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

// Resolves to { images: { hero, gallery, logo }, files }: the metadata per image and a Set of
// every variant path in .cache/img that the pages use. images.gallery keeps the order of
// src/_data/gallery.js: [{ file, title, desc, alt, thumb, lightbox }].
export function processImages() {
  pending ??= (async () => {
    const hero = await run("hero-bg.jpg", "hero");
    const galleryImages = [];
    for (const entry of gallery) {
      const thumb = await run(entry.file, "thumb");
      const lightbox = await run(entry.file, "lightbox");
      galleryImages.push({ ...entry, thumb, lightbox });
    }
    const logo = await run("logo.png", "logo");
    const all = [hero, ...galleryImages.flatMap((item) => [item.thumb, item.lightbox]), logo];
    const files = new Set(all.flatMap((meta) => Object.values(meta).flat().map((entry) => entry.outputPath)));
    return { images: { hero, gallery: galleryImages, logo }, files };
  })();
  return pending;
}
