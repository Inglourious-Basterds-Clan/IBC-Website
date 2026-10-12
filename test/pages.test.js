// Build-output checks of the content subpages, at the root and under /IBC-Website/:
// CONT-01 (join requirements, numbered steps, Discord CTA), CONT-02 (FAQ), CONT-03/CONT-04
// (operations page, later plans) and the visible part of SEO-06 (breadcrumb trail plus a
// BreadcrumbList whose items are absolute, prefix-correct URLs). Build names start with "pages-"
// (node --test runs files in parallel).
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { attrValues, block, build, read } from "./helpers.js";
import * as htmlLib from "../lib/html.js";
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

// IN-02 / Pitfall 6: visible text as the tests and the SEO gate compare it with JSON-LD strings.
test("(unit) visibleText decodes the autoescape entities, drops comments and tags", () => {
  assert.equal(typeof htmlLib.visibleText, "function", "lib/html.js does not export visibleText");
  const { visibleText } = htmlLib;
  assert.equal(
    visibleText("<p>Tak &amp; nie &quot;x&quot; &#39;y&#39; &lt;z&gt; &#92; &#261; „q”</p>"),
    "Tak & nie \"x\" 'y' <z> \\ ą „q”",
  );
  assert.equal(visibleText("<!-- TODO(FACTS-99) --><summary>\n  Pytanie?\n</summary>"), "Pytanie?");
  assert.equal(visibleText("a&#x105;b&#X105;"), "aąbą");
  assert.equal(visibleText("  jeden \n\t dwa  "), "jeden dwa");
});

// Every <details class="faq-item ..."> as { id, summaries: [inner], answer: inner of <p>, raw }.
function faqItems(html) {
  return Array.from(html.matchAll(/<details\s[^>]*class="[^"]*\bfaq-item\b[^"]*"[^>]*>([\s\S]*?)<\/details>/g), (match) => {
    const id = /\sid="([^"]*)"/.exec(match[0]);
    const answer = /<\/summary>\s*<p>([\s\S]*?)<\/p>/.exec(match[1]);
    return {
      id: id ? id[1] : null,
      summaries: Array.from(match[1].matchAll(/<summary>([\s\S]*?)<\/summary>/g), (summary) => summary[1]),
      answer: answer ? answer[1] : null,
      raw: match[1],
    };
  });
}

test("(data) join.faq: 12–16 entries, unique kebab-case ids, plain text without markers (D-04, CONT-06)", () => {
  assert.ok(Array.isArray(join.faq), "join.faq is not an array");
  assert.ok(join.faq.length >= 12 && join.faq.length <= 16, `join.faq has ${join.faq.length} entries, expected 12–16`);
  const ids = join.faq.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length, `duplicate FAQ ids: ${ids.join(", ")}`);
  for (const entry of join.faq) {
    assert.match(entry.id, /^[a-z0-9-]+$/, `FAQ id "${entry.id}" is not ASCII kebab-case`);
    assert.ok(!["wymagania", "kroki", "faq"].includes(entry.id), `FAQ id "${entry.id}" collides with a page block id`);
    for (const field of ["question", "answer"]) {
      assert.equal(typeof entry[field], "string", `${entry.id}.${field} is not a string`);
      assert.ok(entry[field].trim() !== "", `${entry.id}.${field} is empty`);
      assert.doesNotMatch(entry[field], /TODO|FACTS-\d+/, `${entry.id}.${field} holds a marker (markers belong in draft)`);
      assert.doesNotMatch(entry[field], /[<>]/, `${entry.id}.${field} holds HTML (answers are plain text)`);
    }
    if ("draft" in entry) assert.match(entry.draft, /^TODO\(FACTS-\d+\)$/, `${entry.id}.draft is not a TODO(FACTS-NN) marker`);
  }
});

for (const [key, variant] of Object.entries(variants)) {
  const page = () => read(outDirs[key], joinPage);

  test(`(${key} build) join page: native FAQ accordion equals the FAQPage JSON-LD (CONT-02, D-04, D-05)`, () => {
    const html = page();
    const { visibleText } = htmlLib;
    assert.equal(typeof visibleText, "function", "lib/html.js does not export visibleText");
    assert.ok(html.includes('<div class="page-block" id="faq">'), "no .page-block #faq");
    const items = faqItems(html);
    assert.ok(items.length >= 12 && items.length <= 16, `${items.length} FAQ items, expected 12–16`);
    for (const item of items) {
      assert.equal(item.summaries.length, 1, `FAQ ${item.id} needs exactly one <summary>`);
      assert.ok(item.answer !== null, `FAQ ${item.id} has no answer paragraph`);
    }
    const ids = items.map((item) => item.id);
    assert.equal(new Set(ids).size, ids.length, "duplicate FAQ ids on the page");
    for (const id of ids) assert.match(id || "", /^[a-z0-9-]+$/);

    const questions = items.map((item) => visibleText(item.summaries[0]));
    const answers = items.map((item) => visibleText(item.answer));
    assert.deepEqual(questions, join.faq.map((entry) => entry.question), "visible questions differ from join.faq");
    assert.deepEqual(answers, join.faq.map((entry) => entry.answer), "visible answers differ from join.faq");

    const blocks = jsonLdBlocks(html);
    assert.equal(blocks.length, 1, "expected exactly one ld+json script");
    const faqPages = blocks[0]["@graph"].filter((node) => node["@type"] === "FAQPage");
    assert.equal(faqPages.length, 1, "expected exactly one FAQPage node");
    const entities = faqPages[0].mainEntity;
    assert.ok(entities.every((entity) => entity["@type"] === "Question" && entity.acceptedAnswer["@type"] === "Answer"));
    assert.deepEqual(entities.map((entity) => entity.name), questions, "JSON-LD Question names differ from the visible questions");
    assert.deepEqual(entities.map((entity) => entity.acceptedAnswer.text), answers, "JSON-LD answers differ from the visible answers");
    for (const text of [...questions, ...answers]) assert.doesNotMatch(text, /TODO|FACTS-\d+/);
  });

  test(`(${key} build) join page: every drafted FAQ entry carries its marker comment (CONT-06)`, () => {
    const items = new Map(faqItems(page()).map((item) => [item.id, item]));
    const drafted = (join.faq || []).filter((entry) => entry.draft);
    assert.ok(drafted.length > 0, "no drafted FAQ entry: the non-D-02 answers must be marked");
    for (const entry of drafted) {
      assert.ok(items.has(entry.id), `FAQ ${entry.id} missing from the page`);
      assert.ok(items.get(entry.id).raw.includes(`<!-- ${entry.draft} -->`), `FAQ ${entry.id} lacks <!-- ${entry.draft} -->`);
    }
  });

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
