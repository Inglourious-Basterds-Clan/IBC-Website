// Build-output checks of the content subpages, at the root and under /IBC-Website/:
// CONT-01 (join requirements, numbered steps, Discord CTA), CONT-02 (FAQ), CONT-03/CONT-04
// (operations page, later plans) and the visible part of SEO-06 (breadcrumb trail plus a
// BreadcrumbList whose items are absolute, prefix-correct URLs). Build names start with "pages-"
// (node --test runs files in parallel).
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { attrValues, block, build, read } from "./helpers.js";
import join from "../src/_data/join.js";
import site from "../src/_data/site.js";

const variants = {
  root: { name: "pages-root", env: {}, base: "http://localhost:8080/", prefix: "/" },
  prefix: {
    name: "pages-prefix",
    env: { SITE_URL: "https://guard.example", PATH_PREFIX: "/IBC-Website/" },
    base: "https://guard.example/IBC-Website/",
    prefix: "/IBC-Website/",
  },
};
const outDirs = {};

before(() => {
  for (const [key, variant] of Object.entries(variants)) outDirs[key] = build(variant.name, variant.env);
});

const joinPage = "jak-dolaczyc/index.html";

// Text of an HTML fragment: tags dropped, whitespace collapsed.
function plainText(fragment) {
  return fragment.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// Inner HTML of <div class="page-block" id="..."> (the join blocks hold no nested <div>).
function pageBlock(html, id) {
  const match = new RegExp(`<div class="page-block" id="${id}">([\\s\\S]*?)</div>`).exec(html);
  assert.ok(match, `no .page-block #${id}`);
  return match[1];
}

function jsonLdBlocks(html) {
  return Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g), (match) => JSON.parse(match[1]));
}

function canonicalOf(html) {
  const match = /<link rel="canonical" href="([^"]*)">/.exec(html);
  assert.ok(match, "page has no canonical link");
  return match[1];
}

for (const [key, variant] of Object.entries(variants)) {
  const page = () => read(outDirs[key], joinPage);

  test(`(${key} build) join page: one h1, title and description`, () => {
    const html = page();
    assert.equal(html.split("<h1").length - 1, 1, "expected exactly one <h1");
    assert.match(html, /<title>Jak dołączyć do klanu Arma 3 – rekrutacja \| IBC<\/title>/);
    const description = /<meta name="description" content="([^"]*)">/.exec(html);
    assert.ok(description && description[1].trim() !== "", "missing or empty meta description");
  });

  test(`(${key} build) join page: requirements and the six D-02 steps in order (CONT-01)`, () => {
    const html = page();
    const requirements = /<ul class="req-list">([\s\S]*?)<\/ul>/.exec(pageBlock(html, "wymagania"));
    assert.ok(requirements, "#wymagania has no ul.req-list");
    assert.equal(requirements[1].split("<li>").length - 1, join.requirements.length);

    const steps = /<ol class="join-steps">([\s\S]*?)<\/ol>/.exec(pageBlock(html, "kroki"));
    assert.ok(steps, "#kroki has no ol.join-steps");
    assert.equal(join.steps.length, 6, "join.steps must hold exactly the six D-02 steps");
    assert.equal(steps[1].split("<li>").length - 1, 6, "expected exactly 6 steps");
    const titles = Array.from(steps[1].matchAll(/<h3>([\s\S]*?)<\/h3>/g), (match) => plainText(match[1]));
    assert.deepEqual(titles, join.steps.map((step) => step.title));
  });

  test(`(${key} build) join page: Discord CTA and the confirmed D-02 wording`, () => {
    const html = page();
    const cta = /<div class="page-cta">([\s\S]*?)<\/div>/.exec(html);
    assert.ok(cta, "no .page-cta block");
    const anchor = /<a\s[^>]*>/.exec(cta[1]);
    assert.ok(anchor, ".page-cta has no link");
    assert.deepEqual(attrValues(anchor[0], "href"), [site.discord.invite]);
    assert.ok(anchor[0].includes('target="_blank"'), anchor[0]);
    assert.ok(anchor[0].includes('rel="noopener noreferrer"'), anchor[0]);

    assert.ok(html.includes("Zalecane 16+"), "missing Zalecane 16+");
    assert.match(html, /w ciągu 3 dni/i);
    const text = plainText(block(html, "main"));
    assert.doesNotMatch(text, /hardcore/i, "D-03: no hardcore milsim promises");
    assert.doesNotMatch(text, /usunię|wyrzuc/i, "D-02: the 3-day contact is a request, not a removal threat");
  });

  test(`(${key} build) join page: breadcrumb trail and prefix-correct BreadcrumbList (SEO-06)`, () => {
    const html = page();
    const nav = /<nav class="breadcrumbs" aria-label="Ścieżka nawigacji">([\s\S]*?)<\/nav>/.exec(html);
    assert.ok(nav, "no nav.breadcrumbs");
    assert.ok(nav[1].includes("<ol>"), "the breadcrumb trail must be an <ol>");
    const links = Array.from(nav[1].matchAll(/<a\s[^>]*>[\s\S]*?<\/a>/g), (match) => match[0]);
    assert.deepEqual(links.map(plainText), ["Start", "Jak dołączyć"]);
    assert.deepEqual(links.map((link) => attrValues(link, "href")[0]), [variant.prefix, variant.prefix + "jak-dolaczyc/"]);
    assert.ok(links[1].includes('aria-current="page"'), "the last crumb lacks aria-current=page");
    assert.ok(!links[0].includes("aria-current"), "only the last crumb is the current page");

    const canonical = canonicalOf(html);
    assert.equal(canonical, variant.base + "jak-dolaczyc/");
    const blocks = jsonLdBlocks(html);
    assert.equal(blocks.length, 1, "expected exactly one ld+json script");
    const list = blocks[0]["@graph"].find((node) => node["@type"] === "BreadcrumbList");
    assert.ok(list, "no BreadcrumbList");
    assert.deepEqual(list.itemListElement.map((item) => item.item), [variant.base, canonical]);
    assert.deepEqual(list.itemListElement.map((item) => item.name), ["Start", "Jak dołączyć"]);
  });

  test(`(${key} build) join page is in the sitemap; home has no breadcrumbs`, () => {
    const canonical = canonicalOf(page());
    assert.ok(read(outDirs[key], "sitemap.xml").includes(`<loc>${canonical}</loc>`), `sitemap lacks ${canonical}`);
    const home = read(outDirs[key], "index.html");
    assert.ok(!home.includes('class="breadcrumbs"'), "home renders breadcrumbs");
    assert.ok(!home.includes("BreadcrumbList"), "home carries a BreadcrumbList");
  });
}
