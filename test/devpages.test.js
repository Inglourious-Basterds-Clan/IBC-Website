// FOUND-05 / D-12 checks: dev-only pages under src/_dev/ are front matter (+ optional body)
// and render exactly the home page's shared chrome, but only in dev/test builds
// (INCLUDE_DEV_PAGES=1). A plain production build emits no _dev/ directory.
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build, read, attrValues, block, repoRoot } from "./helpers.js";
import site from "../src/_data/site.js";

const defaultTitle = "IBC Clan // Wizytówka Taktyczna Arma 3";
const navLabels = ["System", "O nas", "Galeria", "Rekrutacja"];
const activeNav = ' class="active-nav"';

let includedDir;
let defaultDir;
let homeHtml;

before(() => {
  includedDir = build("devpages-included", { INCLUDE_DEV_PAGES: "1" });
  defaultDir = build("devpages-default");
  homeHtml = read(includedDir, "index.html");
});

// Read a generated dev page, failing with a clear assertion when it was not emitted.
function devPage(name) {
  const relPath = `_dev/${name}/index.html`;
  assert.ok(existsSync(join(includedDir, relPath)), `${relPath} was not generated with INCLUDE_DEV_PAGES=1`);
  return read(includedDir, relPath);
}

function count(html, needle) {
  return html.split(needle).length - 1;
}

// [{ href, label }] for every nav <a> inside the header <nav>, in document order.
function navLinks(html) {
  const nav = block(block(html, "header"), "nav");
  assert.ok(nav, "header has no <nav>");
  return Array.from(nav.matchAll(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g), (match) => ({
    href: match[1],
    label: match[2].trim(),
  }));
}

test("(a) INCLUDE_DEV_PAGES=1 emits both dev pages", () => {
  assert.ok(existsSync(join(includedDir, "_dev/layout-test/index.html")), "missing _dev/layout-test/index.html");
  assert.ok(existsSync(join(includedDir, "_dev/layout-empty/index.html")), "missing _dev/layout-empty/index.html");
});

test("(b) dev pages share the home page's header and footer byte for byte", () => {
  const homeHeader = block(homeHtml, "header");
  const homeFooter = block(homeHtml, "footer");
  assert.equal(count(homeHeader, activeNav), 1, "home header should carry exactly one active-nav class");
  const expectedHeader = homeHeader.replace(activeNav, "");

  for (const name of ["layout-test", "layout-empty"]) {
    const html = devPage(name);
    assert.equal(block(html, "header"), expectedHeader, `${name}: <header> differs from the home page`);
    assert.equal(block(html, "footer"), homeFooter, `${name}: <footer> differs from the home page`);
    assert.ok(html.includes('id="decryption-overlay"'), `${name}: missing decryption overlay`);
  }
});

test("(c) layout-test renders its own title and body inside the full chrome, without home-only head data", () => {
  const html = devPage("layout-test");
  assert.ok(html.includes("<title>Test layoutu</title>"), "wrong <title>");
  assert.equal(count(html, "<h1"), 1, "expected exactly one <h1>");
  assert.ok(html.includes('<main id="main">'), "missing <main id=\"main\">");
  assert.ok(/<a href="#main" class="skip-link">/.test(html), "missing skip link to #main");
  assert.ok(html.includes('src="/js/main.js"'), "missing /js/main.js");

  const header = block(html, "header");
  assert.ok(header.includes("hud-btn header-cta"), "missing header Discord CTA");
  assert.ok(attrValues(header, "href").includes(site.discord.invite), "header CTA does not link to site.discord.invite");

  assert.ok(!html.includes(activeNav), "dev page must not mark a nav link active");
  assert.ok(!html.includes('name="keywords"'), "dev page must not carry meta keywords");
  assert.ok(!html.includes("SportsTeam"), "dev page must not carry SportsTeam JSON-LD");
});

test("(d) layout-empty (front matter only) renders the chrome, an empty main and the default title", () => {
  const html = devPage("layout-empty");
  assert.ok(html.includes(`<title>${defaultTitle}</title>`), "missing default <title>");
  assert.ok(block(html, "header").includes("hud-btn header-cta"), "missing header Discord CTA");
  assert.ok(block(html, "footer"), "missing <footer>");
  assert.match(html, /<main id="main">\s*<\/main>/, "main element is not empty");
});

test("(e) a default build has no _dev directory", () => {
  assert.ok(existsSync(join(defaultDir, "index.html")), "default build produced no index.html");
  assert.ok(!existsSync(join(defaultDir, "_dev")), "default build contains _dev/");
});

test("(f) layout-test nav matches the home page: same labels in order, same hrefs", () => {
  const devNav = navLinks(devPage("layout-test"));
  const homeNav = navLinks(homeHtml);
  assert.deepEqual(
    devNav.map((link) => link.label),
    navLabels,
  );
  assert.deepEqual(devNav, homeNav);
});

// FOUND-01 / Pitfall 2: `npm run build` empties the output folder first through
// scripts/clean.js, which refuses to delete the repo root or anything outside it.
function runClean(target) {
  return spawnSync(process.execPath, ["scripts/clean.js", target], { cwd: repoRoot, encoding: "utf8" });
}

test("(g) clean.js removes a stale output folder inside the repo", () => {
  const staleDir = join(repoRoot, "_test", "devpages-stale");
  mkdirSync(join(staleDir, "_dev", "old"), { recursive: true });
  writeFileSync(join(staleDir, "_dev", "old", "index.html"), "<p>stale</p>");

  const result = runClean("_test/devpages-stale");
  assert.equal(result.status, 0, `clean.js failed:\n${result.stderr || result.error}`);
  assert.ok(!existsSync(staleDir), "_test/devpages-stale still exists");
});

test("(h) clean.js refuses the repo root and paths outside it", () => {
  for (const target of [".", ".."]) {
    const result = runClean(target);
    assert.equal(result.status, 1, `clean.js ${target} should exit 1`);
    assert.match(result.stderr, /refusing/, `clean.js ${target} should explain the refusal`);
  }
  assert.ok(existsSync(join(repoRoot, "package.json")), "package.json was deleted");
});

test("(i) the build script cleans _site/ before Eleventy runs", () => {
  const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  assert.equal(pkg.scripts.build, "node scripts/clean.js && eleventy");
});
