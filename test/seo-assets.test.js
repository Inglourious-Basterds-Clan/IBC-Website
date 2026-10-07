// SEO-03/04/05 committed image checks: the OG card, icon set, favicon.ico and JSON-LD
// logo are read at header level with lib/image-size.js, so no build and no image
// library are needed. Also checks that sharp stays isolated in tools/seo-images.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./helpers.js";
import { readImageSize, readIcoEntries } from "../lib/image-size.js";

function readAsset(relPath) {
  return readFileSync(join(repoRoot, relPath));
}

function readJson(relPath) {
  return JSON.parse(readFileSync(join(repoRoot, relPath), "utf8"));
}

test("OG card is a 1200×630 JPEG under 300 KB (D-06)", () => {
  const relPath = "src/assets/og/og-default-v1.jpg";
  const size = readImageSize(readAsset(relPath));
  assert.deepEqual(size, { format: "jpeg", width: 1200, height: 630, hasAlpha: false });
  assert.ok(statSync(join(repoRoot, relPath)).size < 307200, "OG card must stay under 300 KB");
});

test("icons are square PNGs of the expected sizes (D-08)", () => {
  const apple = readImageSize(readAsset("src/assets/icons/apple-touch-icon.png"));
  assert.equal(apple.format, "png");
  assert.equal(apple.width, 180);
  assert.equal(apple.height, 180);

  for (const size of [192, 512]) {
    const icon = readImageSize(readAsset(`src/assets/icons/icon-${size}.png`));
    assert.deepEqual(icon, { format: "png", width: size, height: size, hasAlpha: true });
  }
});

test("JSON-LD logo is a transparent square of at least 112 px (D-12)", () => {
  const logo = readImageSize(readAsset("src/assets/brand/ibc-logo-512.png"));
  assert.deepEqual(logo, { format: "png", width: 512, height: 512, hasAlpha: true });
});

test("favicon.ico holds 16, 32 and 48 px PNG images", () => {
  const ico = readAsset("src/favicon.ico");
  const entries = readIcoEntries(ico);
  assert.ok(entries, "favicon.ico header not recognised");
  assert.deepEqual(
    entries.map((entry) => entry.width),
    [16, 32, 48]
  );
  for (const entry of entries) {
    assert.equal(entry.height, entry.width);
    assert.ok(entry.offset + entry.size <= ico.length, "ICO entry points past the end of the file");
    const png = readImageSize(ico.subarray(entry.offset, entry.offset + entry.size));
    assert.ok(png, `ICO entry ${entry.width} is not a PNG`);
    assert.equal(png.format, "png");
    assert.equal(png.width, entry.width);
    assert.equal(png.height, entry.width);
  }
});

test("parsers return null for non-images", () => {
  assert.equal(readImageSize(Buffer.from("not an image")), null);
  assert.equal(readIcoEntries(Buffer.alloc(4)), null);
  // A PNG signature cut short and a JPEG with no frame header are not images either.
  assert.equal(readImageSize(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), null);
  assert.equal(readImageSize(Buffer.from([0xff, 0xd8, 0xff, 0xd9])), null);
});

test("the image tool is isolated from the site build (T-02-SC)", () => {
  const tool = readJson("tools/seo-images/package.json");
  assert.equal(tool.dependencies.sharp, "0.35.4");

  const root = readJson("package.json");
  assert.equal(root.dependencies?.sharp, undefined, "sharp must not be a root dependency");
  assert.equal(root.devDependencies?.sharp, undefined, "sharp must not be a root devDependency");

  const lock = readJson("tools/seo-images/package-lock.json");
  assert.equal(lock.packages["node_modules/sharp"].version, "0.35.4");
});
