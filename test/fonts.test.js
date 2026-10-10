// PERF-04 / D-10 self-hosted font checks: the committed variable Montserrat woff2 covers
// every Polish letter, an ASCII-only control subset does not (so the check can fail),
// the reader rejects non-WOFF2 input, and the OFL licence ships next to the font.
// The cmap is read with lib/woff2.js (Node built-ins only), so no font library.
// The build-output checks (D-07, D-09, PERF-04 edges) run on a root and an /IBC-Website/ build:
// one font preload per page, the font and licence shipped unchanged, no Google font host,
// the @font-face and stacks in the stylesheet, a glyph for every shipped character, and
// a committed font that no build ever writes.
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { build, listFiles, read, repoRoot } from "./helpers.js";
import { woff2CodePoints, woff2TableTags } from "../lib/woff2.js";

const fontPath = "src/fonts/montserrat-latin-ext.var.woff2";
const controlPath = "test/fixtures/montserrat-ascii.var.woff2";
const licencePath = "src/fonts/OFL.txt";
const fontMaxBytes = 46080;

// The 18 Polish letters (D-10), named so a failure names the missing letter.
const polishLetters = {
  "Ą": 0x0104, "ą": 0x0105, "Ć": 0x0106, "ć": 0x0107, "Ę": 0x0118, "ę": 0x0119,
  "Ł": 0x0141, "ł": 0x0142, "Ń": 0x0143, "ń": 0x0144, "Ó": 0x00d3, "ó": 0x00f3,
  "Ś": 0x015a, "ś": 0x015b, "Ź": 0x0179, "ź": 0x017a, "Ż": 0x017b, "ż": 0x017c,
};

function readAsset(relPath) {
  return readFileSync(join(repoRoot, relPath));
}

test("the committed font covers every Polish letter (D-10)", () => {
  const codePoints = woff2CodePoints(readAsset(fontPath));
  for (const [letter, codePoint] of Object.entries(polishLetters)) {
    assert.ok(codePoints.has(codePoint), `${fontPath} has no glyph for ${letter} (U+${codePoint.toString(16).toUpperCase().padStart(4, "0")})`);
  }
});

test("the ASCII-only control lacks the Polish letters (negative control)", () => {
  const codePoints = woff2CodePoints(readAsset(controlPath));
  assert.ok(codePoints.has(0x0041), "the control font should still cover A (U+0041)");
  for (const [letter, codePoint] of Object.entries(polishLetters)) {
    assert.ok(!codePoints.has(codePoint), `the ASCII-only control unexpectedly covers ${letter}`);
  }
});

test("woff2CodePoints rejects empty and non-WOFF2 input (PERF-04 empty edge)", () => {
  assert.throws(() => woff2CodePoints(Buffer.alloc(0)), /not a WOFF2 file/);
  assert.throws(() => woff2CodePoints(Buffer.from("not a font at all, just text padding to 48 bytes........")), /not a WOFF2 file/);
});

test("the font is one variable Montserrat woff2 (D-08)", () => {
  const font = readAsset(fontPath);
  assert.equal(font.toString("latin1", 0, 4), "wOF2");
  assert.ok(statSync(join(repoRoot, fontPath)).size <= fontMaxBytes, `${fontPath} is over ${fontMaxBytes} bytes`);
  const tags = woff2TableTags(font);
  for (const tag of ["cmap", "fvar", "gvar"]) {
    assert.ok(tags.includes(tag), `${fontPath} has no ${tag} table`);
  }
});

test("the OFL licence sits next to the font (D-09)", () => {
  assert.ok(existsSync(join(repoRoot, licencePath)), `${licencePath} is missing`);
  const licence = readFileSync(join(repoRoot, licencePath), "utf8");
  assert.match(licence, /SIL Open Font License/i);
  assert.match(licence, /Montserrat/);
});

// --- Build-output checks (D-07, D-09, PERF-04 edges) ---

const fontFile = "montserrat-latin-ext.var.woff2";
const googleFontHosts = ["fonts.googleapis.com", "fonts.gstatic.com"];
const shippedTextExts = [".html", ".css", ".js", ".xml", ".txt", ".webmanifest", ".config", ".json"];
// The families the Google Fonts stylesheet used to load next to Montserrat (D-07).
const droppedFamilies = [/Share Tech Mono/i, /\bInter\b/i];

// One entry per build kind; outDir is filled in before().
const builds = {
  root: { env: {}, prefix: "/" },
  prefix: { env: { SITE_URL: "https://guard.example", PATH_PREFIX: "/IBC-Website/" }, prefix: "/IBC-Website/" },
};

function sha256(relPath) {
  return createHash("sha256").update(readAsset(relPath)).digest("hex");
}

let fontHashBefore;

before(() => {
  fontHashBefore = sha256(fontPath);
  for (const [name, variant] of Object.entries(builds)) {
    variant.outDir = build(`fonts-${name}`, variant.env);
  }
});

function outName(outDir, file) {
  return relative(outDir, file).split("\\").join("/");
}

function linkTags(html) {
  return Array.from(html.matchAll(/<link\s[^>]*>/g), (match) => match[0]);
}

function hex(codePoint) {
  return "U+" + codePoint.toString(16).toUpperCase().padStart(4, "0");
}

// Every code point of the text, plus the numeric character references (&#322; / &#x142;).
function codePointsOf(text) {
  const found = new Set(Array.from(text, (char) => char.codePointAt(0)));
  for (const match of text.matchAll(/&#(x[0-9a-f]+|[0-9]+);/gi)) {
    const ref = match[1];
    found.add(ref[0].toLowerCase() === "x" ? parseInt(ref.slice(1), 16) : parseInt(ref, 10));
  }
  return found;
}

// The value of a custom property, or undefined; tolerates minified CSS.
function customProperty(css, name) {
  const match = new RegExp(`${name}\\s*:\\s*([^;}]+)`).exec(css);
  return match ? match[1].trim() : undefined;
}

test("the head preloads the self-hosted font once (D-09)", () => {
  for (const [name, { outDir, prefix }] of Object.entries(builds)) {
    const pages = listFiles(outDir, [".html"]);
    assert.ok(pages.length > 0, `${name}: no HTML pages in the build`);
    const expectedHref = `${prefix}fonts/${fontFile}`;
    for (const page of pages) {
      const preloads = linkTags(readFileSync(page, "utf8")).filter((tag) => /\sas="font"/.test(tag));
      const where = `${name}: ${outName(outDir, page)}`;
      assert.equal(preloads.length, 1, `${where} has ${preloads.length} font preloads, expected 1`);
      const [tag] = preloads;
      assert.match(tag, /\srel="preload"/, `${where}: the font link is not rel="preload"`);
      assert.match(tag, /\stype="font\/woff2"/, `${where}: the font preload lacks type="font/woff2"`);
      assert.match(tag, /\scrossorigin(?=[\s>=])/, `${where}: the font preload lacks crossorigin (it would be fetched twice)`);
      assert.ok(tag.includes(`href="${expectedHref}"`), `${where}: the font preload does not point at ${expectedHref}:\n${tag}`);
    }
    assert.ok(existsSync(join(outDir, "fonts", fontFile)), `${name}: the preloaded fonts/${fontFile} is missing from the output`);
  }
});

test("the font and its licence ship unchanged (D-09)", () => {
  for (const [name, { outDir }] of Object.entries(builds)) {
    for (const file of [fontFile, "OFL.txt"]) {
      const shipped = join(outDir, "fonts", file);
      assert.ok(existsSync(shipped), `${name}: fonts/${file} is missing from the output`);
      assert.ok(readFileSync(shipped).equals(readAsset(`src/fonts/${file}`)), `${name}: fonts/${file} differs from src/fonts/${file}`);
    }
  }
});

test("no Google font host in the output (PERF-04)", () => {
  for (const [name, { outDir }] of Object.entries(builds)) {
    const files = listFiles(outDir, shippedTextExts);
    assert.ok(files.length > 0, `${name}: no text files in the build`);
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const host of googleFontHosts) {
        assert.ok(!text.includes(host), `${name}: ${outName(outDir, file)} names ${host}`);
      }
    }
  }
});

test("the stylesheet declares the self-hosted face (D-07, D-09)", () => {
  for (const [name, { outDir }] of Object.entries(builds)) {
    const css = read(outDir, "css/style.css");
    const faces = Array.from(css.matchAll(/@font-face\s*\{([^}]*)\}/g), (match) => match[1]);
    const face = faces.find((body) => /font-family\s*:\s*["']?Montserrat["']?\s*(;|$)/.test(body.trim()));
    assert.ok(face, `${name}: css/style.css has no @font-face for "Montserrat"`);
    assert.match(face, /font-display\s*:\s*swap/, `${name}: the Montserrat @font-face lacks font-display: swap`);
    assert.match(face, /url\(\s*["']?\.\.\/fonts\/montserrat-latin-ext\.var\.woff2["']?\s*\)/, `${name}: the Montserrat @font-face does not load ../fonts/${fontFile}`);

    for (const property of ["--font-hud", "--font-body"]) {
      const value = customProperty(css, property);
      assert.ok(value, `${name}: css/style.css does not set ${property}`);
      assert.match(value, /^["']?Montserrat["']?\s*,/, `${name}: ${property} does not start with Montserrat: ${value}`);
      for (const family of droppedFamilies) {
        assert.doesNotMatch(value, family, `${name}: ${property} still names a dropped family: ${value}`);
      }
    }
  }
});

test("every shipped character has a glyph (PERF-04 encoding edge)", () => {
  const codePoints = woff2CodePoints(readAsset(fontPath));
  const { outDir } = builds.root;
  const jsDir = join(outDir, "js");
  const files = [...listFiles(outDir, [".html"]), ...(existsSync(jsDir) ? listFiles(jsDir, [".js"]) : [])];
  assert.ok(files.length > 0, "root: no HTML or JS files in the build");

  // code point -> files that contain it, for every non-ASCII code point without a glyph
  const missing = new Map();
  for (const file of files) {
    for (const codePoint of codePointsOf(readFileSync(file, "utf8"))) {
      if (codePoint < 0x80 || codePoints.has(codePoint)) continue;
      if (!missing.has(codePoint)) missing.set(codePoint, new Set());
      missing.get(codePoint).add(outName(outDir, file));
    }
  }
  const report = Array.from(missing, ([codePoint, where]) => `${hex(codePoint)} "${String.fromCodePoint(codePoint)}" in ${[...where].join(", ")}`);
  assert.deepEqual(report, [], `characters with no glyph in ${fontPath}:\n${report.join("\n")}`);
});

test("builds never write the committed font (PERF-04 concurrency edge)", () => {
  assert.equal(sha256(fontPath), fontHashBefore, `${fontPath} changed while the test builds ran`);
});
