// WR-01 checks: every page loads /js/main.js?v=<hash>, where <hash> is lib/js.js's content hash
// of src/js, and main.js appends its own ?v= query to every literal module specifier, so a
// returning visitor never runs a cached old module against new HTML.
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { build, repoRoot, attrValues, listFiles } from "./helpers.js";
import { getJsHash, hashJs, jsSourceDir } from "../lib/js.js";

const hashPattern = /^[0-9a-f]{10}$/;

let rootDir;
let prefixDir;

before(() => {
  rootDir = build("js-version-root", { SITE_URL: "https://guard.example" });
  prefixDir = build("js-version-prefix", { SITE_URL: "https://guard.example", PATH_PREFIX: "/IBC-Website/" });
});

// A temp folder with a top-level file and one in a subfolder, removed after the callback.
function withTempJs(callback) {
  const dir = mkdtempSync(join(tmpdir(), "ibc-js-version-"));
  try {
    mkdirSync(join(dir, "modules"));
    writeFileSync(join(dir, "main.js"), "console.log('a');\n");
    writeFileSync(join(dir, "modules", "menu.js"), "export function init() {}\n");
    callback(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/* --- UNIT --- */
test("hashJs is 10 lowercase hex characters and stable on re-run", () => {
  withTempJs((dir) => {
    const first = hashJs(dir);
    assert.match(first, hashPattern);
    assert.equal(hashJs(dir), first);
  });
});

test("hashJs changes when one byte changes", () => {
  withTempJs((dir) => {
    const original = hashJs(dir);
    writeFileSync(join(dir, "modules", "menu.js"), "export function init() {}\r");
    assert.notEqual(hashJs(dir), original);
  });
});

test("hashJs changes when a file is added", () => {
  withTempJs((dir) => {
    const original = hashJs(dir);
    writeFileSync(join(dir, "modules", "terminal.js"), "");
    assert.notEqual(hashJs(dir), original);
  });
});

test("getJsHash() is the hash of src/js", () => {
  assert.equal(jsSourceDir, "src/js");
  assert.equal(getJsHash(), hashJs(join(repoRoot, "src/js")));
});

/* --- BUILD OUTPUT --- */
function assertVersionedScript(outDir, expectedSrc) {
  const pages = listFiles(outDir, [".html"]);
  assert.ok(pages.length >= 3, `expected the home page, the subpages and 404.html, found ${pages.length}`);
  for (const page of pages) {
    const rel = relative(outDir, page).replace(/\\/g, "/");
    const html = readFileSync(page, "utf8");
    const scripts = Array.from(html.matchAll(/<script\b[^>]*\ssrc="[^"]*"[^>]*>/g), (match) => match[0]);
    assert.equal(scripts.length, 1, `${rel}: expected one script with a src, found ${JSON.stringify(scripts)}`);
    assert.deepEqual(attrValues(scripts[0], "src"), [expectedSrc], `${rel}: ${scripts[0]}`);
  }
}

test("every page of the root build loads /js/main.js?v=<getJsHash()>", () => {
  assertVersionedScript(rootDir, `/js/main.js?v=${getJsHash()}`);
});

test("every page of the /IBC-Website/ build loads the prefixed, versioned main.js", () => {
  assertVersionedScript(prefixDir, `/IBC-Website/js/main.js?v=${getJsHash()}`);
});

/* --- STATIC --- */
test("every import() in main.js is a literal module path plus the version", () => {
  const source = readFileSync(join(repoRoot, "src/js/main.js"), "utf8");
  const calls = Array.from(source.matchAll(/import\([^)]*\)/g), (match) => match[0]);
  assert.ok(calls.length > 0, "main.js has no import() call");
  for (const call of calls) {
    assert.match(call, /^import\('\.\/modules\/[a-z0-9-]+\.js' \+ version\)$/, `unversioned or non-literal import: ${call}`);
  }
  assert.ok(source.includes("const version = new URL(import.meta.url).search;"), "main.js does not read its own ?v= query");
});
