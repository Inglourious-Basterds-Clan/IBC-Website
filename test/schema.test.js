// SEO-05 JSON-LD checks: lib/schema.js builds the home-page Organization + WebSite graph from
// src/_data/site.js (D-10..D-14), jsonLd() cannot close the <script> element, the real builds
// carry exactly one graph on the home page and none anywhere else, and the graph holds no
// unconfirmed claims or personal data (plan prohibitions).
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { attrValues, block, build, listFiles, read, repoRoot } from "./helpers.js";
import { buildSchemaGraph, jsonLd } from "../lib/schema.js";
import { readImageSize } from "../lib/image-size.js";
import site from "../src/_data/site.js";

const unitSocial = [
  { id: "youtube", label: "YouTube", url: "https://www.youtube.com/@example" },
  { id: "facebook", label: "Facebook", url: "https://www.facebook.com/example" },
];
const unitSite = {
  url: "https://ex.example",
  pathPrefix: "/",
  name: "Inglourious Basterds Clan",
  social: unitSocial,
  discord: { invite: "https://discord.gg/abc" },
};

const organizationKeys = ["@type", "@id", "name", "alternateName", "url", "logo", "foundingDate", "description", "sameAs"];
const forbiddenTypes = ["Person", "Event", "SportsTeam", "AggregateRating", "Review"];
const forbiddenKeys = ["founder", "member", "employee", "aggregateRating", "review"];

const jsonLdPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

// The parsed JSON of every ld+json script in html.
function jsonLdBlocks(html) {
  return Array.from(html.matchAll(jsonLdPattern), (match) => JSON.parse(match[1]));
}

function canonicalOf(html) {
  const match = /<link rel="canonical" href="([^"]*)">/.exec(html);
  assert.ok(match, "page has no canonical link");
  return match[1];
}

function nodeOfType(graph, type) {
  const nodes = graph["@graph"].filter((node) => node["@type"] === type);
  assert.equal(nodes.length, 1, `expected exactly one ${type} node`);
  return nodes[0];
}

// Every @type and every key anywhere in value (objects and arrays, recursively).
function walk(value, types = [], keys = []) {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, types, keys);
  } else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      keys.push(key);
      if (key === "@type") types.push(...[child].flat());
      walk(child, types, keys);
    }
  }
  return { types, keys };
}

// Prohibitions (test tier): only the D-10..D-12 keys on the Organization, no claims, no people.
function assertNoForbiddenContent(graph) {
  const organization = nodeOfType(graph, "Organization");
  for (const key of Object.keys(organization)) {
    assert.ok(organizationKeys.includes(key), `Organization carries an unexpected key: ${key}`);
  }
  const { types, keys } = walk(graph);
  for (const type of forbiddenTypes) assert.ok(!types.includes(type), `graph contains @type ${type}`);
  for (const key of forbiddenKeys) assert.ok(!keys.includes(key), `graph contains key ${key}`);
}

test("(unit) buildSchemaGraph at the root", () => {
  const graph = buildSchemaGraph(unitSite);
  assert.equal(graph["@context"], "https://schema.org");
  assert.deepEqual(graph["@graph"].map((node) => node["@type"]), ["Organization", "WebSite"]);

  const organization = nodeOfType(graph, "Organization");
  assert.equal(organization.url, "https://ex.example/");
  assert.equal(organization["@id"], "https://ex.example/#organization");
  assert.equal(organization.logo, "https://ex.example/assets/brand/ibc-logo-512.png");
  assert.deepEqual(organization.sameAs, [...unitSocial.map((s) => s.url), "https://discord.gg/abc"]);
  assert.equal(organization.foundingDate, "2018");
  assert.deepEqual(organization.alternateName, ["IBC", "IBC Clan"]);

  const website = nodeOfType(graph, "WebSite");
  assert.equal(website.url, "https://ex.example/");
  assert.equal(website["@id"], "https://ex.example/#website");
  assert.equal(website.inLanguage, "pl-PL");
  assert.deepEqual(website.publisher, { "@id": "https://ex.example/#organization" });
  assertNoForbiddenContent(graph);
});

test("(unit) buildSchemaGraph under a path prefix", () => {
  const home = "https://ex.example/IBC-Website/";
  const graph = buildSchemaGraph({ ...unitSite, pathPrefix: "/IBC-Website/" });
  const organization = nodeOfType(graph, "Organization");
  const website = nodeOfType(graph, "WebSite");
  assert.equal(organization.url, home);
  assert.equal(organization["@id"], home + "#organization");
  assert.equal(organization.logo, home + "assets/brand/ibc-logo-512.png");
  assert.equal(website.url, home);
  assert.equal(website["@id"], home + "#website");
  assert.equal(website.publisher["@id"], home + "#organization");
});

test("(unit) jsonLd escapes < so a value cannot close the script element", () => {
  const value = { a: "</script><b>" };
  const text = jsonLd(value);
  assert.ok(!text.includes("<"), text);
  assert.ok(text.includes("\\u003c/script>"), text);
  assert.deepEqual(JSON.parse(text), value);
});

const variants = {
  root: { name: "schema-root", env: { INCLUDE_DEV_PAGES: "1" } },
  prefix: { name: "schema-prefix", env: { SITE_URL: "https://guard.example", PATH_PREFIX: "/IBC-Website/" } },
};
const outDirs = {};

before(() => {
  for (const [key, variant] of Object.entries(variants)) outDirs[key] = build(variant.name, variant.env);
});

for (const key of Object.keys(variants)) {
  test(`(${key} build) home page carries one Organization + WebSite graph from site.js`, () => {
    const outDir = outDirs[key];
    const html = read(outDir, "index.html");
    const blocks = jsonLdBlocks(html);
    assert.equal(blocks.length, 1, "expected exactly one ld+json script on the home page");
    const graph = blocks[0];
    assert.equal(graph["@context"], "https://schema.org");
    assert.deepEqual(graph["@graph"].map((node) => node["@type"]).sort(), ["Organization", "WebSite"]);

    const organization = nodeOfType(graph, "Organization");
    const website = nodeOfType(graph, "WebSite");
    const canonical = canonicalOf(html);
    for (const node of [organization, website]) {
      assert.equal(node.name, "Inglourious Basterds Clan");
      assert.ok(node.alternateName.includes("IBC"), "alternateName lacks IBC");
      assert.ok(node.alternateName.includes("IBC Clan"), "alternateName lacks IBC Clan");
      assert.equal(node.url, canonical, `${node["@type"]}.url is not the home canonical`);
    }
    assert.equal(organization.foundingDate, "2018");
    assert.equal(typeof organization.description, "string");
    assert.ok(organization.description.trim().length > 0, "empty Organization description");
    assert.equal(website.inLanguage, "pl-PL");
    assert.equal(website.publisher["@id"], organization["@id"], "publisher does not point at the Organization");
    assert.deepEqual(organization.sameAs, [...site.social.map((s) => s.url), site.discord.invite]);
    assertNoForbiddenContent(graph);

    // D-12: the logo is a square transparent PNG of at least 112 px that ships in the output.
    assert.ok(organization.logo.startsWith(canonical), `logo ${organization.logo} is not under ${canonical}`);
    const logoPath = organization.logo.slice(canonical.length);
    const logo = readImageSize(readFileSync(join(outDir, logoPath)));
    assert.ok(logo, `${logoPath} is not a readable image`);
    assert.equal(logo.format, "png");
    assert.equal(logo.width, 512);
    assert.equal(logo.height, 512);
    assert.ok(logo.hasAlpha, "logo has no alpha channel");
  });

  test(`(${key} build) no other page carries JSON-LD`, () => {
    const outDir = outDirs[key];
    const pages = listFiles(outDir, [".html"]).map((full) => relative(outDir, full).replace(/\\/g, "/"));
    const others = pages.filter((relPath) => relPath !== "index.html");
    // The root build includes the dev pages, so it always has pages besides the home page.
    if (key === "root") assert.ok(others.some((relPath) => relPath.startsWith("_dev/")), "dev pages missing from the root build");
    for (const relPath of others) {
      assert.ok(!read(outDir, relPath).includes("application/ld+json"), `${relPath} carries JSON-LD`);
    }
  });
}

test("(footer) social icons come from site.social (D-13)", () => {
  const footer = block(read(outDirs.root, "index.html"), "footer");
  const icons = footer.match(/<a\s[^>]*class="social-icon"[^>]*>/g) || [];
  assert.ok(icons.length >= 1, "footer has no social icons");
  assert.ok(icons[0].includes(`href="${site.discord.invite}"`), "the Discord icon must stay first");

  const socials = icons.slice(1);
  assert.deepEqual(socials.map((tag) => attrValues(tag, "href")[0]), site.social.map((s) => s.url));
  assert.deepEqual(socials.map((tag) => attrValues(tag, "aria-label")[0]), site.social.map((s) => s.label));
  for (const tag of socials) {
    assert.ok(tag.includes('target="_blank"'), `social icon must open in a new tab: ${tag}`);
    assert.ok(tag.includes('rel="noopener noreferrer"'), `social icon without rel: ${tag}`);
  }

  // One list: footer.njk holds no social URL literal, so footer and sameAs cannot drift apart.
  const source = readFileSync(join(repoRoot, "src/_includes/partials/footer.njk"), "utf8");
  for (const s of site.social) assert.ok(!source.includes(s.url), `footer.njk hardcodes ${s.url}`);
});
