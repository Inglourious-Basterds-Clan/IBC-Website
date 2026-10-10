// SEO-07 404 page and D-16 web.config checks: _site/404.html renders in the shared layout,
// survives being served for any missing path (GitHub Pages), is never indexed or listed,
// and _site/web.config maps 404 to it (pathPrefix-aware) plus the .webmanifest, .avif, .webp and
// .woff2 MIME types for IIS.
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { build, read, attrValues, block, repoRoot } from "./helpers.js";
import { checkSite } from "../lib/check-seo.js";
import site from "../src/_data/site.js";

const activeNav = ' class="active-nav"';
const noindexTag = '<meta name="robots" content="noindex">';

// One entry per build kind; outDir is filled in before().
const variants = {
  root: { env: {}, site: { url: "http://localhost:8080", pathPrefix: "/", indexable: false } },
  prefix: {
    env: { SITE_URL: "https://guard.example", PATH_PREFIX: "/IBC-Website/" },
    site: { url: "https://guard.example", pathPrefix: "/IBC-Website/", indexable: false },
  },
  indexable: {
    env: { SITE_URL: "https://example.org", SITE_INDEXABLE: "1" },
    site: { url: "https://example.org", pathPrefix: "/", indexable: true },
  },
};

before(() => {
  for (const [name, variant] of Object.entries(variants)) {
    variant.outDir = build(`seo-files-${name}`, variant.env);
  }
});

function notFoundPage(name) {
  const { outDir } = variants[name];
  assert.ok(existsSync(join(outDir, "404.html")), `${name}: 404.html is missing from the output root`);
  return read(outDir, "404.html");
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

// IDs of the FACTS.md rows still waiting for the clan's confirmation.
function openFactIds() {
  const facts = readFileSync(join(repoRoot, "FACTS.md"), "utf8");
  return Array.from(facts.matchAll(/^\|\s*(FACTS-\d+)\s*\|.*\|\s*do potwierdzenia\s*\|\s*$/gm), (match) => match[1]);
}

test("(a) 404.html renders in the shared layout", () => {
  for (const name of Object.keys(variants)) {
    const html = notFoundPage(name);
    const home = read(variants[name].outDir, "index.html");
    assert.ok(html.includes("<title>404 – Nie znaleziono strony | IBC</title>"), `${name}: wrong <title>`);
    assert.equal(count(html, "<h1"), 1, `${name}: expected exactly one <h1>`);
    assert.match(html, /<h1[^>]*>[^<]*404 \/\/ UTRACONO SYGNAŁ/, `${name}: h1 lacks the 404 headline`);
    assert.ok(html.includes("Ta strona nie istnieje."), `${name}: missing the plain Polish line`);
    assert.ok(html.includes('<main id="main">'), `${name}: missing <main id="main">`);
    assert.ok(/<a href="#main" class="skip-link">/.test(html), `${name}: missing skip link to #main`);

    const homeHeader = block(home, "header");
    assert.equal(count(homeHeader, activeNav), 1, `${name}: home header should carry exactly one active-nav class`);
    assert.equal(block(html, "header"), homeHeader.replace(activeNav, ""), `${name}: <header> differs from the home page`);
    assert.equal(block(html, "footer"), block(home, "footer"), `${name}: <footer> differs from the home page`);
  }
});

test("(b) 404 links survive any missing path", () => {
  for (const name of ["root", "prefix"]) {
    const html = notFoundPage(name);
    const prefix = variants[name].site.pathPrefix;
    const values = [...attrValues(html, "href"), ...attrValues(html, "src"), ...attrValues(html, "data-src")];
    assert.ok(values.length > 0, `${name}: no href/src values found`);
    for (const value of values) {
      const ok = value.startsWith("#") || /^https?:\/\//.test(value) || value.startsWith(prefix);
      assert.ok(ok, `${name}: "${value}" is neither a fragment, absolute, nor under ${prefix}`);
    }

    const main = block(html, "main");
    assert.ok(main.includes(`<a href="${prefix}" class="hud-btn active">`), `${name}: home button does not link to ${prefix}`);
    const discordLinks = Array.from(main.matchAll(/<a\s[^>]*>/g), (match) => match[0]).filter((tag) =>
      tag.includes(`href="${site.discord.invite}"`),
    );
    assert.equal(discordLinks.length, 1, `${name}: expected one Discord button in <main>`);
    assert.ok(discordLinks[0].includes('target="_blank"'), `${name}: Discord button does not open a new tab`);
    assert.ok(discordLinks[0].includes('rel="noopener noreferrer"'), `${name}: Discord button lacks rel="noopener noreferrer"`);
  }
});

test("(c) 404 is noindex, unlisted and marked as a draft", () => {
  for (const name of Object.keys(variants)) {
    const head = block(notFoundPage(name), "head");
    assert.ok(head.includes(noindexTag), `${name}: 404.html lacks robots noindex`);
    assert.ok(head.includes("TODO(FACTS-"), `${name}: 404.html head lacks its TODO(FACTS-NN) marker`);
    assert.ok(!/<meta\s[^>]*name="description"/.test(head), `${name}: 404.html must not carry a meta description`);

    const locs = Array.from(read(variants[name].outDir, "sitemap.xml").matchAll(/<loc>([^<]*)<\/loc>/g), (match) => match[1]);
    assert.ok(locs.length > 0, `${name}: sitemap.xml lists no URL`);
    assert.ok(!locs.some((loc) => loc.includes("404")), `${name}: sitemap.xml lists the 404 page`);
  }
});

// IIS answers 404.3 for an extension it has no MIME type for (research A3).
const mimeTypes = {
  ".webmanifest": "application/manifest+json",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

test("(d) web.config maps 404 and the MIME types (D-16, research A3)", () => {
  const expectedPaths = { root: 'path="/404.html" responseMode="ExecuteURL"', prefix: 'path="/IBC-Website/404.html" responseMode="ExecuteURL"' };
  for (const [name, expected] of Object.entries(expectedPaths)) {
    const { outDir } = variants[name];
    assert.ok(existsSync(join(outDir, "web.config")), `${name}: web.config is missing from the output root`);
    const config = read(outDir, "web.config");
    assert.ok(config.startsWith("<?xml"), `${name}: web.config does not start with the XML declaration`);
    assert.ok(config.includes(expected), `${name}: web.config lacks ${expected}`);
    assert.ok(config.includes('<remove statusCode="404"'), `${name}: web.config lacks <remove statusCode="404"`);
    assert.ok(config.indexOf('<remove statusCode="404"') < config.indexOf('<error statusCode="404"'), `${name}: <remove> must precede <error>`);
    for (const [ext, type] of Object.entries(mimeTypes)) {
      const remove = `<remove fileExtension="${ext}" />`;
      const mimeMap = `<mimeMap fileExtension="${ext}" mimeType="${type}" />`;
      assert.ok(config.includes(remove), `${name}: web.config lacks ${remove}`);
      assert.ok(config.includes(mimeMap), `${name}: web.config lacks ${mimeMap}`);
      // The remove first, so IIS never answers 500.19 where the type is already mapped.
      assert.ok(config.indexOf(remove) < config.indexOf(mimeMap), `${name}: ${remove} must precede its <mimeMap>`);
    }
    for (const forbidden of ["<rewrite", "errorMode", "redirect"]) {
      assert.ok(!config.includes(forbidden), `${name}: web.config must not contain ${forbidden} (D-16)`);
    }
    assert.ok(!read(outDir, "sitemap.xml").includes("web.config"), `${name}: sitemap.xml lists web.config`);
  }
});

test("(e) the gate accepts the 404 in every build kind", () => {
  for (const name of ["root", "prefix"]) {
    assert.deepEqual(checkSite(variants[name].outDir, variants[name].site), [], `${name}: the SEO gate reports problems`);
  }

  // Never pin a draft ID: the indexable build may fail only on markers that are open FACTS.md rows.
  const open = openFactIds();
  for (const problem of checkSite(variants.indexable.outDir, variants.indexable.site)) {
    const match = /: G10 unconfirmed draft marker TODO\((FACTS-\d+)\)/.exec(problem);
    assert.ok(match, `indexable build has a non-G10 problem or an untracked TODO:\n${problem}`);
    assert.ok(open.includes(match[1]), `${match[1]} is not an open (do potwierdzenia) row in FACTS.md:\n${problem}`);
  }
});
