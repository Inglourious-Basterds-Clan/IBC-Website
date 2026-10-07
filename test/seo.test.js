// SEO-01/SEO-09 checks on real builds: absolute canonicals, the noindex guard
// (SITE_INDEXABLE=1 is the only opt-in) and SITE_URL / PATH_PREFIX validation.
// Every build name starts with "seo-" (node --test runs files in parallel).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { build, runBuild, cleanEnv, read, listFiles, block } from "./helpers.js";

const noindexTag = '<meta name="robots" content="noindex">';

function count(html, needle) {
  return html.split(needle).length - 1;
}

// href of every <link rel="canonical"> inside <head>.
function canonicals(html) {
  const head = block(html, "head");
  return Array.from(head.matchAll(/<link rel="canonical" href="([^"]*)">/g), (match) => match[1]);
}

function canonical(outDir, relPath) {
  const hrefs = canonicals(read(outDir, relPath));
  assert.equal(hrefs.length, 1, `${relPath} has ${hrefs.length} canonical links`);
  return hrefs[0];
}

// [{ relPath, html }] for every HTML file of a build.
function htmlFiles(outDir) {
  return listFiles(outDir, [".html"]).map((full) => ({
    relPath: relative(outDir, full).replace(/\\/g, "/"),
    html: readFileSync(full, "utf8"),
  }));
}

function noindexCount(outDir, relPath) {
  return count(block(read(outDir, relPath), "head"), noindexTag);
}

let rootDir;
function rootBuild() {
  rootDir ??= build("seo-root", { INCLUDE_DEV_PAGES: "1" });
  return rootDir;
}

let prefixDir;
function prefixBuild() {
  prefixDir ??= build("seo-prefix", { SITE_URL: "https://guard.example", PATH_PREFIX: "/IBC-Website/" });
  return prefixDir;
}

let indexableDir;
function indexableBuild() {
  indexableDir ??= build("seo-indexable", { SITE_URL: "https://example.org", SITE_INDEXABLE: "1", INCLUDE_DEV_PAGES: "1" });
  return indexableDir;
}

test("(a) one absolute canonical per page in root, prefix and mutated builds", () => {
  const root = rootBuild();
  assert.equal(canonical(root, "index.html"), "http://localhost:8080/");
  assert.equal(canonical(root, "_dev/layout-test/index.html"), "http://localhost:8080/_dev/layout-test/");
  for (const { relPath, html } of htmlFiles(root)) {
    assert.equal(canonicals(html).length, 1, `${relPath} must have exactly one canonical`);
  }

  assert.equal(canonical(prefixBuild(), "index.html"), "https://guard.example/IBC-Website/");

  const mutated = build("seo-mutated", { SITE_URL: "https://mutated.example/", PATH_PREFIX: "IBC-Website" });
  assert.equal(canonical(mutated, "index.html"), "https://mutated.example/IBC-Website/");
});

test("(b) noindex everywhere unless SITE_INDEXABLE=1", () => {
  for (const { relPath } of htmlFiles(rootBuild())) {
    assert.equal(noindexCount(rootDir, relPath), 1, `${relPath} must carry the noindex tag exactly once`);
  }

  const indexable = indexableBuild();
  assert.equal(noindexCount(indexable, "index.html"), 0, "indexable home must not be noindex");
  assert.equal(noindexCount(indexable, "_dev/layout-test/index.html"), 1, "dev page leaked into the index");
  assert.equal(noindexCount(indexable, "_dev/layout-empty/index.html"), 1, "dev page leaked into the index");

  const notStrict = build("seo-indexable-true", { SITE_URL: "https://example.org", SITE_INDEXABLE: "true" });
  assert.equal(noindexCount(notStrict, "index.html"), 1, 'SITE_INDEXABLE="true" must not opt in');
});

test("(c) SITE_INDEXABLE=1 refuses localhost and http", () => {
  const variants = {
    "seo-indexable-local": { SITE_INDEXABLE: "1", ALLOW_LOCAL_SITE_URL: "1" },
    "seo-indexable-http": { SITE_INDEXABLE: "1", SITE_URL: "http://example.org" },
  };
  for (const [name, env] of Object.entries(variants)) {
    const { result } = runBuild(name, env);
    assert.notEqual(result.status, 0, `${name} built although it is indexable on a non-https or local URL`);
    assert.ok(result.stderr.includes("needs a real https SITE_URL"), `${name}: guard message missing:\n${result.stderr}`);
  }
});

test("(d) malformed SITE_URL or PATH_PREFIX fails the build", () => {
  const badUrls = ["ibc.example", "https://example.org/sub", "https://example.org/?x=1"];
  badUrls.forEach((siteUrl, index) => {
    const { result } = runBuild(`seo-bad-url-${index}`, { SITE_URL: siteUrl });
    assert.notEqual(result.status, 0, `SITE_URL "${siteUrl}" was accepted`);
    assert.ok(result.stderr.includes("is not an origin"), `SITE_URL "${siteUrl}": message missing:\n${result.stderr}`);
  });

  const { result } = runBuild("seo-bad-prefix", {
    SITE_URL: "https://example.org",
    PATH_PREFIX: "C:/Program Files/Git/IBC-Website/",
  });
  assert.notEqual(result.status, 0, "a Git Bash-rewritten PATH_PREFIX was accepted");
  assert.ok(result.stderr.includes("PATH_PREFIX"), `PATH_PREFIX message missing:\n${result.stderr}`);
});

test("(e) build helpers never inherit SITE_INDEXABLE", () => {
  const saved = process.env.SITE_INDEXABLE;
  process.env.SITE_INDEXABLE = "1";
  try {
    const keys = Object.keys(cleanEnv({})).map((key) => key.toUpperCase());
    assert.ok(!keys.includes("SITE_INDEXABLE"), "cleanEnv kept SITE_INDEXABLE");
    const out = build("seo-inherited");
    assert.equal(noindexCount(out, "index.html"), 1, "an inherited SITE_INDEXABLE made the test build indexable");
  } finally {
    if (saved === undefined) delete process.env.SITE_INDEXABLE;
    else process.env.SITE_INDEXABLE = saved;
  }
});

function sitemapLocs(outDir) {
  return Array.from(read(outDir, "sitemap.xml").matchAll(/<loc>([^<]*)<\/loc>/g), (match) => match[1]);
}

test("(f) sitemap lists exactly the indexable pages, sorted", () => {
  const rootLocs = sitemapLocs(rootBuild());
  assert.deepEqual(rootLocs, ["http://localhost:8080/"]);
  assert.deepEqual(sitemapLocs(prefixBuild()), ["https://guard.example/IBC-Website/"]);
  for (const locs of [rootLocs, sitemapLocs(indexableBuild())]) {
    assert.deepEqual(locs, [...locs].sort(), "sitemap <loc> entries are not sorted");
    for (const loc of locs) {
      assert.ok(!loc.includes("_dev") && !loc.includes("404"), `non-indexable page in sitemap: ${loc}`);
    }
  }
  assert.ok(read(rootDir, "sitemap.xml").startsWith("<?xml"), "sitemap.xml must start with the XML declaration");
});

test("(g) robots.txt never disallows and names the sitemap only when indexable", () => {
  const rootRobots = read(rootBuild(), "robots.txt");
  assert.ok(rootRobots.startsWith("User-agent: *"), `robots.txt must start with User-agent:\n${rootRobots}`);
  assert.ok(!/^\s*Disallow/im.test(rootRobots), "robots.txt must never contain a Disallow line");
  assert.ok(!/^\s*Sitemap:/im.test(rootRobots), "preview robots.txt must not name a sitemap");

  const indexableRobots = read(indexableBuild(), "robots.txt");
  assert.ok(indexableRobots.includes("Sitemap: https://example.org/sitemap.xml"), indexableRobots);
  assert.ok(!/^\s*Disallow/im.test(indexableRobots), "robots.txt must never contain a Disallow line");
});
