// D-20 / SEO-09: README documents the indexing switch and the cutover.
// The README is Polish prose, so this checks the load-bearing headings, commands and names
// only, plus that every repo path it points the user at exists.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./helpers.js";

const readme = readFileSync(join(repoRoot, "README.md"), "utf8").replace(/\r\n/g, "\n");

test("(a) README has the indexing and cutover sections", () => {
  for (const heading of ["## Przeniesienie na docelową domenę (IIS)", "## Indeksowanie w wyszukiwarkach (SITE_INDEXABLE)"]) {
    assert.ok(readme.split("\n").includes(heading), `README.md is missing the heading: ${heading}`);
  }
});

test("(b) README covers every D-20 cutover item", () => {
  for (const needle of [
    "SITE_INDEXABLE=1",
    "Remove-Item Env:SITE_INDEXABLE",
    "web.config",
    "404.html",
    "application/manifest+json",
    "500.19",
    "curl -I",
    "Search Console",
    "sitemap.xml",
    "og-default-v1.jpg",
    "noindex",
    "301",
    "FACTS.md",
    "tools/seo-images",
    "scripts/check-seo.js",
  ]) {
    assert.ok(readme.includes(needle), `README.md does not mention ${needle}`);
  }
});

test("(c) README drops the old Pages custom-domain steps (R2-WR-02)", () => {
  assert.ok(!readme.split("\n").includes("## Zmiana domeny"), "README.md still has the old ## Zmiana domeny section");
  assert.ok(!readme.includes("Custom domain"), "README.md still points a Pages custom domain at the final domain");
});

test("(d) README holds no Discord invite", () => {
  assert.ok(!readme.includes("discord.gg/"), "README.md contains a Discord invite URL (it lives only in src/_data/site.js)");
});

test("(e) the paths the README points at exist", () => {
  for (const path of ["scripts/check-seo.js", "lib/seo.js", "tools/seo-images/make-seo-images.js", "FACTS.md"]) {
    assert.ok(existsSync(join(repoRoot, path)), `${path} is missing from the repo`);
  }
});
