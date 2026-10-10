// PERF-04 / D-10 self-hosted font checks: the committed variable Montserrat woff2 covers
// every Polish letter, an ASCII-only control subset does not (so the check can fail),
// the reader rejects non-WOFF2 input, and the OFL licence ships next to the font.
// The cmap is read with lib/woff2.js (Node built-ins only), so no build and no font library.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./helpers.js";
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
