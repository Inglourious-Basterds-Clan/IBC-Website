// PERF-01/02/03 image checks: build output in the root and the /IBC-Website/ build.
// The hero is a high-priority <picture> (D-03), the home head preloads its AVIF set with
// prefix-safe URLs (Pitfall 1), every mobile candidate fits the 120 KB budget and img/
// ships only the variants some page references (T-03-03).
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { build, read, listFiles, attrValues, block, repoRoot } from "./helpers.js";

const prefix = "/IBC-Website/";
const heroBudget = 122880;
const mobileMaxWidth = 1280;
const urlAttrs = ["src", "data-lightbox-avif", "data-lightbox-webp", "data-lightbox-jpeg"];
const srcsetAttrs = ["srcset", "imagesrcset"];

const out = {};

before(() => {
  out.root = build("images-root");
  out.prefix = build("images-prefix", { PATH_PREFIX: prefix });
});

// Every <tag ...> opening tag of the given name.
function tags(html, name) {
  return html.match(new RegExp(`<${name}\\s[^>]*>`, "g")) || [];
}

// One attribute value of a single tag, or undefined.
function attr(tag, name) {
  return attrValues(tag, name)[0];
}

// [{ url, width }] for every candidate of a srcset value.
function candidates(srcset) {
  return srcset
    .split(",")
    .map((candidate) => candidate.trim().split(/\s+/))
    .filter(([url]) => url)
    .map(([url, descriptor = ""]) => ({ url, width: Number.parseInt(descriptor, 10) }));
}

function heroImg(html) {
  const imgs = tags(html, "img").filter((tag) => tag.includes('fetchpriority="high"'));
  assert.equal(imgs.length, 1, `expected exactly one fetchpriority="high" img, found ${imgs.length}`);
  return imgs[0];
}

function heroPicture(html) {
  const img = heroImg(html);
  const picture = (html.match(/<picture>[\s\S]*?<\/picture>/g) || []).find((block) => block.includes(img));
  assert.ok(picture, "the hero img is not inside a <picture>");
  return picture;
}

function imagePreloads(html) {
  return tags(block(html, "head"), "link").filter((tag) => tag.includes('rel="preload"') && tag.includes('as="image"'));
}

// Root-relative URL -> path inside outDir, after stripping the build's prefix.
function outputPath(outDir, buildPrefix, url) {
  assert.ok(url.startsWith(buildPrefix), `"${url}" does not start with ${buildPrefix}`);
  return join(outDir, decodeURIComponent(url.slice(buildPrefix.length)));
}

// Every image URL any HTML page of the build references (src, data-lightbox-*, srcset, imagesrcset).
function referencedUrls(outDir) {
  const urls = new Set();
  for (const path of listFiles(outDir, [".html"])) {
    const html = readFileSync(path, "utf8");
    for (const name of urlAttrs) for (const value of attrValues(html, name)) urls.add(value);
    for (const name of srcsetAttrs) {
      for (const value of attrValues(html, name)) for (const { url } of candidates(value)) urls.add(url);
    }
  }
  return urls;
}

test("hero is a high-priority picture (PERF-02)", () => {
  const html = read(out.root, "index.html");
  const picture = heroPicture(html);
  assert.ok(picture.includes('<source type="image/avif"'), "hero picture has no image/avif source");
  assert.ok(picture.includes('<source type="image/webp"'), "hero picture has no image/webp source");
  const img = heroImg(html);
  assert.equal(attr(img, "loading"), "eager");
  assert.equal(attr(img, "width"), "1920");
  assert.equal(attr(img, "height"), "1080");
  assert.match(attr(img, "src"), /\.jpeg$/, "hero img src must be the JPEG fallback (D-05)");
});

test("hero preload matches the img (D-03, Pitfall 1)", () => {
  for (const [name, outDir] of Object.entries(out)) {
    const preloads = imagePreloads(read(outDir, "index.html"));
    assert.equal(preloads.length, 1, `${name}: expected exactly one image preload in the head, found ${preloads.length}`);
    const [link] = preloads;
    assert.equal(attr(link, "type"), "image/avif", `${name}: preload type`);
    assert.equal(attr(link, "fetchpriority"), "high", `${name}: preload fetchpriority`);
    assert.equal(attr(link, "imagesizes"), "100vw", `${name}: preload imagesizes must equal the img sizes`);
    assert.equal(imagePreloads(read(outDir, "404.html")).length, 0, `${name}: 404.html must not preload an image`);
  }

  const link = imagePreloads(read(out.prefix, "index.html"))[0];
  const tokens = candidates(attr(link, "imagesrcset"));
  assert.ok(tokens.length >= 3, `expected several imagesrcset candidates, found ${tokens.length}`);
  for (const { url } of tokens) {
    assert.ok(url.startsWith(`${prefix}img/`), `imagesrcset URL "${url}" does not start with ${prefix}img/`);
    assert.ok(existsSync(outputPath(out.prefix, prefix, url)), `imagesrcset URL "${url}" points at a missing file`);
  }
});

test("hero mobile candidates fit 120 KB (D-03)", () => {
  const picture = heroPicture(read(out.root, "index.html"));
  const sets = {
    avif: attr(tags(picture, "source").find((tag) => tag.includes('type="image/avif"')), "srcset"),
    webp: attr(tags(picture, "source").find((tag) => tag.includes('type="image/webp"')), "srcset"),
    jpeg: attr(heroImg(picture), "srcset"),
  };
  for (const [format, srcset] of Object.entries(sets)) {
    assert.ok(srcset, `hero has no ${format} srcset`);
    const mobile = candidates(srcset).filter(({ width }) => width <= mobileMaxWidth);
    assert.ok(mobile.length >= 1, `hero has no ${format} candidate of ${mobileMaxWidth} w or less`);
    for (const { url, width } of mobile) {
      const { size } = statSync(outputPath(out.root, "/", url));
      assert.ok(size <= heroBudget, `${format} ${width} w is ${size} bytes, over the ${heroBudget}-byte budget`);
    }
  }
});

test("img/ ships only referenced variants", () => {
  for (const [name, outDir] of Object.entries(out)) {
    const buildPrefix = name === "prefix" ? prefix : "/";
    const imgDir = join(outDir, "img");
    const files = readdirSync(imgDir);
    assert.ok(files.length >= 1, `${name}: img/ is empty`);
    const referenced = referencedUrls(outDir);
    for (const file of files) {
      const url = `${buildPrefix}img/${file}`;
      assert.ok(referenced.has(url), `${name}: img/${file} is not referenced by any page (${relative(repoRoot, imgDir)})`);
    }
  }
});

test("the shared image cache is warmed before parallel test builds (Pitfall 5)", () => {
  const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  assert.equal(pkg.scripts.pretest, "node scripts/warm-images.js", "npm test must warm .cache/img first");
  const result = spawnSync(process.execPath, [join(repoRoot, "scripts", "warm-images.js")], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `warm-images.js failed:\n${result.stderr || result.error}`);
  assert.match(result.stdout, /^warm-images: \d+ file\(s\) ready in \.cache\/img/m);
});
