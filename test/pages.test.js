// Build-output checks of the content subpages, at the root and under /IBC-Website/:
// CONT-01 (join requirements, numbered steps, Discord CTA), CONT-02 (FAQ), CONT-03/CONT-04
// (operations page) and the visible part of SEO-06 (breadcrumb trail plus a
// BreadcrumbList whose items are absolute, prefix-correct URLs). Build names start with "pages-"
// (node --test runs files in parallel).
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { attrValues, block, build, listFiles, read, repoRoot } from "./helpers.js";
import { formatPlDate } from "../lib/dates.js";
import * as htmlLib from "../lib/html.js";
import join from "../src/_data/join.js";
import operations from "../src/_data/operations.js";
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
    // WR-02: confirming an entry (deleting its draft line, FACTS.md) leaves nothing to check here,
    // so a fully confirmed FAQ is valid; a confirmed entry must not keep a marker comment.
    const drafted = (join.faq || []).filter((entry) => entry.draft);
    for (const entry of (join.faq || []).filter((entry) => !entry.draft)) {
      assert.ok(items.has(entry.id), `FAQ ${entry.id} missing from the page`);
      assert.doesNotMatch(items.get(entry.id).raw, /<!-- TODO\(FACTS-\d+\) -->/, `confirmed FAQ ${entry.id} still carries a marker comment`);
    }
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

// ---------------------------------------------------------------------------------------------
// /operacje/ (CONT-03, CONT-04, D-10, D-13, SEO-06)

const operationsPage = "operacje/index.html";

// Markup of the .page-block #id up to the next .page-block or the end of the section (operations
// blocks nest a <div>, so the non-greedy pageBlock helper above does not fit).
function operationsBlock(html, id) {
  const start = html.indexOf(`<div class="page-block" id="${id}">`);
  assert.ok(start !== -1, `no .page-block #${id}`);
  const rest = html.slice(start + 1);
  const ends = [rest.indexOf('<div class="page-block"'), rest.indexOf("</section>")].filter((index) => index !== -1);
  return html.slice(start, start + 1 + Math.min(...ends));
}

for (const [key, variant] of Object.entries(variants)) {
  const page = () => read(outDirs[key], operationsPage);

  test(`(${key} build) operations page: one h1, title and description`, () => {
    const html = page();
    assert.equal(html.split("<h1").length - 1, 1, "expected exactly one <h1");
    assert.match(html, /<title>Operacje klanu Arma 3 – harmonogram, misje i relacje \| IBC<\/title>/);
    const description = /<meta name="description" content="([^"]*)">/.exec(html);
    assert.ok(description && description[1].trim() !== "", "missing or empty meta description");
  });

  test(`(${key} build) operations page: schedule, mission types and eras (CONT-03, D-02)`, () => {
    const text = plainText(block(page(), "main"));
    for (const fact of ["19:00", "2–3", "PvE", "Joint Operations", "Zeus", "Wietnam", "Zimna wojna"]) {
      assert.ok(text.includes(fact), `operations page lacks "${fact}"`);
    }
    assert.doesNotMatch(text, /hardcore/i, "D-03: no hardcore milsim promises");
  });

  test(`(${key} build) operations page: the five-step evening timeline in order (CONT-03, D-02)`, () => {
    const timeline = /<ol class="evening-timeline">([\s\S]*?)<\/ol>/.exec(operationsBlock(page(), "typowy-wieczor"));
    assert.ok(timeline, "#typowy-wieczor has no ol.evening-timeline");
    assert.equal(timeline[1].split("<li>").length - 1, 5, "expected exactly 5 timeline steps");
    const names = Array.from(timeline[1].matchAll(/<h3>([\s\S]*?)<\/h3>/g), (match) => htmlLib.visibleText(match[1]));
    assert.deepEqual(names, operations.evening.steps.map((step) => step.name));
    assert.equal(names[0], "Sloty");
    assert.equal(names[4], "Przegląd OCAP");
    assert.equal((timeline[1].match(/<span class="evening-time">/g) || []).length, 5, "every step needs a time");
  });

  test(`(${key} build) operations page: "Najbliższe misje" points to Discord and lists no dates (D-10)`, () => {
    const upcoming = operationsBlock(page(), "najblizsze-misje");
    assert.ok(upcoming.includes('<div class="upcoming">'), "no div.upcoming");
    const anchors = Array.from(upcoming.matchAll(/<a\s[^>]*>/g), (match) => match[0]);
    assert.ok(anchors.some((anchor) => attrValues(anchor, "href")[0] === site.discord.invite), "no Discord link in #najblizsze-misje");
    assert.ok(!upcoming.includes("<time"), "#najblizsze-misje must not hold a <time> element");
    assert.doesNotMatch(upcoming, /\d{4}-\d{2}-\d{2}/, "#najblizsze-misje must not list dates");
  });

  test(`(${key} build) operations page: drafted evening and OCAP texts carry their markers (CONT-06)`, () => {
    const evening = operationsBlock(page(), "typowy-wieczor");
    // WR-02: the marker is checked only while it exists; confirming FACTS-07 deletes it.
    if (operations.evening.draft) {
      assert.ok(evening.includes(`<!-- ${operations.evening.draft} -->`), `#typowy-wieczor lacks <!-- ${operations.evening.draft} -->`);
    }
    for (const step of operations.evening.steps.filter((entry) => entry.draft)) {
      assert.ok(evening.includes(`<!-- ${step.draft} -->`), `step ${step.name} lacks <!-- ${step.draft} -->`);
    }
  });

  test(`(${key} build) operations page: breadcrumb trail and prefix-correct BreadcrumbList (SEO-06)`, () => {
    const html = page();
    const nav = /<nav class="breadcrumbs" aria-label="Ścieżka nawigacji">([\s\S]*?)<\/nav>/.exec(html);
    assert.ok(nav, "no nav.breadcrumbs");
    const links = Array.from(nav[1].matchAll(/<a\s[^>]*>[\s\S]*?<\/a>/g), (match) => match[0]);
    assert.deepEqual(links.map(plainText), ["Start", "Operacje"]);
    assert.deepEqual(links.map((link) => attrValues(link, "href")[0]), [variant.prefix, variant.prefix + "operacje/"]);
    assert.ok(links[1].includes('aria-current="page"'), "the last crumb lacks aria-current=page");
    assert.ok(!links[0].includes("aria-current"), "only the last crumb is the current page");

    const canonical = canonicalOf(html);
    assert.equal(canonical, variant.base + "operacje/");
    const blocks = jsonLdBlocks(html);
    assert.equal(blocks.length, 1, "expected exactly one ld+json script");
    const list = blocks[0]["@graph"].find((node) => node["@type"] === "BreadcrumbList");
    assert.ok(list, "no BreadcrumbList");
    assert.deepEqual(list.itemListElement.map((item) => item.item), [variant.base, canonical]);
    assert.deepEqual(list.itemListElement.map((item) => item.name), ["Start", "Operacje"]);
  });

  test(`(${key} build) operations page has no Event markup and is in the sitemap`, () => {
    const html = page();
    assert.ok(!html.includes('"Event"'), "operations page carries Event structured data");
    const canonical = canonicalOf(html);
    assert.ok(read(outDirs[key], "sitemap.xml").includes(`<loc>${canonical}</loc>`), `sitemap lacks ${canonical}`);
  });
}

// ---------------------------------------------------------------------------------------------
// Recaps (CONT-04, D-11, D-12) and the Polish date formatter (Pitfall 11)

test("(unit) formatPlDate formats ISO dates as Polish long dates", () => {
  assert.equal(formatPlDate("2026-09-20"), "20 września 2026");
  assert.equal(formatPlDate("2026-03-07"), "7 marca 2026");
});

test("(unit) formatPlDate formats in UTC whatever the process timezone (Pitfall 11)", () => {
  const datesUrl = new URL("../lib/dates.js", import.meta.url).href;
  const script = `import(${JSON.stringify(datesUrl)}).then((m) => console.log(new Date("2026-09-20T00:00:00Z").getDate() + "|" + m.formatPlDate("2026-09-20")));`;
  const result = spawnSync(process.execPath, ["-e", script], {
    env: { ...process.env, TZ: "America/Los_Angeles" },
    encoding: "utf8",
  });
  const [localDay, formatted] = result.stdout.trim().split("|");
  assert.equal(localDay, "19", `the child process did not run west of UTC:\n${result.stderr}`);
  assert.equal(formatted, "20 września 2026", `formatPlDate shifted the day under TZ=America/Los_Angeles:\n${result.stderr}`);
});

test("(unit) formatPlDate rejects invalid or non-ISO input", () => {
  for (const input of ["2026-02-30", "2026-9-20", "20.09.2026", "", undefined, null, 20260920]) {
    assert.throws(() => formatPlDate(input), `formatPlDate(${JSON.stringify(input)}) did not throw`);
  }
});

test("(data) operations.recaps: 3–5 entries with mission types and committed images (CONT-04, D-11)", () => {
  const recaps = operations.recaps;
  assert.ok(Array.isArray(recaps), "operations.recaps is not an array");
  assert.ok(recaps.length >= 3 && recaps.length <= 5, `operations.recaps has ${recaps.length} entries, expected 3–5`);
  const typeNames = operations.missionTypes.map((type) => type.name);
  const committed = spawnSync("git", ["ls-files", "src/images"], { cwd: repoRoot, encoding: "utf8" }).stdout.split(/\r?\n/);
  const dates = recaps.map((recap) => recap.date);
  assert.equal(new Set(dates).size, dates.length, `duplicate recap dates: ${dates.join(", ")}`);
  for (const recap of recaps) {
    // WR-02: a confirmed or newly added recap has no draft field; a present one must be well-formed.
    if ("draft" in recap) assert.match(recap.draft, /^TODO\(FACTS-\d+\)$/, `recap "${recap.title}".draft is not a TODO(FACTS-NN) marker`);
    assert.ok(typeNames.includes(recap.type), `recap "${recap.title}" type "${recap.type}" is not one of ${typeNames.join(", ")}`);
    assert.ok(committed.includes(`src/images/${recap.file}`), `recap image ${recap.file} is not a committed original under src/images/`);
    assert.match(recap.date, /^\d{4}-\d{2}-\d{2}$/, `recap "${recap.title}" date is not ISO`);
    // README "Nowa relacja" sets lastUpdate.date to today, so a recap of today's operation is valid.
    assert.ok(recap.date <= operations.lastUpdate.date, `recap "${recap.title}" is dated after the last update`);
    for (const field of ["title", "setting", "text", "alt"]) {
      assert.equal(typeof recap[field], "string", `recap ${recap.file}.${field} is not a string`);
      assert.ok(recap[field].trim() !== "", `recap ${recap.file}.${field} is empty`);
      assert.doesNotMatch(recap[field], /TODO|FACTS-\d+/, `recap ${recap.file}.${field} holds a marker (markers belong in draft)`);
    }
  }
  assert.ok(operations.lastUpdate, "operations.lastUpdate is missing");
  if ("draft" in operations.lastUpdate) {
    assert.match(operations.lastUpdate.draft, /^TODO\(FACTS-\d+\)$/, "lastUpdate.draft is not a TODO(FACTS-NN) marker");
  }
});

// Every <article class="recap-card ..."> as { raw, datetime, meta }.
function recapCards(html) {
  return Array.from(html.matchAll(/<article class="recap-card hud-border">([\s\S]*?)<\/article>/g), (match) => {
    const meta = /<p class="recap-meta">([\s\S]*?)<\/p>/.exec(match[1]);
    const time = meta ? /<time datetime="([^"]*)">/.exec(meta[1]) : null;
    return { raw: match[1], meta: meta ? htmlLib.visibleText(meta[1]) : null, datetime: time ? time[1] : null };
  });
}

for (const [key] of Object.entries(variants)) {
  const page = () => read(outDirs[key], operationsPage);

  test(`(${key} build) operations page: 3–5 recap cards, newest first (CONT-04, D-12)`, () => {
    const cards = recapCards(page());
    assert.ok(cards.length >= 3 && cards.length <= 5, `${cards.length} recap cards, expected 3–5`);
    const datetimes = cards.map((card) => card.datetime);
    for (const value of datetimes) assert.match(value || "", /^\d{4}-\d{2}-\d{2}$/, `recap <time datetime="${value}"> is not an ISO date`);
    for (let index = 1; index < datetimes.length; index += 1) {
      assert.ok(datetimes[index - 1] >= datetimes[index], `recaps are not newest first: ${datetimes.join(", ")}`);
    }
    assert.deepEqual(datetimes, (operations.recaps || []).map((recap) => recap.date).sort().reverse());
  });

  test(`(${key} build) operations page: each recap card has one lazy responsive picture and a meta line`, () => {
    const cards = recapCards(page());
    assert.ok(cards.length >= 3, "no recap cards");
    const byDate = new Map((operations.recaps || []).map((recap) => [recap.date, recap]));
    for (const card of cards) {
      const recap = byDate.get(card.datetime);
      assert.ok(recap, `card dated ${card.datetime} matches no recap`);
      assert.equal((card.raw.match(/<picture>/g) || []).length, 1, `recap ${recap.file} needs exactly one <picture>`);
      const img = /<img\s[^>]*>/.exec(card.raw);
      assert.ok(img, `recap ${recap.file} has no <img>`);
      assert.ok(img[0].includes('loading="lazy"'), `recap ${recap.file} image is not lazy`);
      assert.match(img[0], /\swidth="\d+"/, `recap ${recap.file} image has no numeric width`);
      assert.match(img[0], /\sheight="\d+"/, `recap ${recap.file} image has no numeric height`);
      const alt = attrValues(img[0], "alt")[0];
      assert.ok(alt && alt.trim() !== "", `recap ${recap.file} image has an empty alt`);
      assert.ok(card.meta.includes(formatPlDate(recap.date)), `meta "${card.meta}" lacks the Polish date`);
      assert.ok(card.meta.includes(recap.setting), `meta "${card.meta}" lacks the setting`);
      assert.ok(card.meta.includes(recap.type), `meta "${card.meta}" lacks the type`);
      if (recap.draft) {
        assert.ok(card.raw.includes(`<!-- ${recap.draft} -->`), `recap ${recap.file} lacks <!-- ${recap.draft} -->`);
      } else {
        assert.doesNotMatch(card.raw, /<!-- TODO\(FACTS-\d+\) -->/, `confirmed recap ${recap.file} still carries a marker comment`);
      }
    }
  });

  test(`(${key} build) operations page: manual "Ostatnia aktualizacja" date with its marker`, () => {
    const html = page();
    const lastUpdate = operations.lastUpdate || {};
    const updated = /<p class="recaps-updated">([\s\S]*?)<\/p>/.exec(html);
    assert.ok(updated, "no p.recaps-updated");
    assert.match(updated[1], new RegExp(`Ostatnia aktualizacja: <time datetime="${lastUpdate.date}">`), updated[1]);
    if (lastUpdate.draft) {
      assert.ok(updated[1].includes(`<!-- ${lastUpdate.draft} -->`), `p.recaps-updated lacks <!-- ${lastUpdate.draft} -->`);
    }
  });
}

/* --- NAV TO REAL PAGES WITH BUILD-TIME aria-current (CONT-05, D-07) --- */
const navLabels = ["Start", "O nas", "Operacje", "Dołącz"];
const navHrefs = ["/#hero", "/#about", "/operacje/", "/jak-dolaczyc/"];

// Every <a> opening tag + label inside the fragment, in document order.
function navAnchors(fragment) {
  return Array.from(fragment.matchAll(/(<a\s[^>]*>)([\s\S]*?)<\/a>/g), (match) => ({
    tag: match[1],
    href: attrValues(match[1], "href")[0],
    label: match[2].trim(),
  }));
}

function headerNav(html) {
  const nav = block(block(html, "header"), "nav");
  assert.ok(nav, "header has no <nav>");
  return navAnchors(nav);
}

function footerNav(html) {
  const start = html.indexOf('<ul class="footer-links">');
  assert.ok(start !== -1, "footer has no ul.footer-links");
  return navAnchors(html.slice(start, html.indexOf("</ul>", start)));
}

const navPages = ["index.html", "operacje/index.html", "jak-dolaczyc/index.html", "404.html"];
const currentNav = { "operacje/index.html": "Operacje", "jak-dolaczyc/index.html": "Dołącz" };

for (const [key, variant] of Object.entries(variants)) {
  const expectedHrefs = navHrefs.map((href) => variant.prefix + href.slice(1));

  test(`(${key} build) header and footer nav read Start / O nas / Operacje / Dołącz on every page (CONT-05)`, () => {
    for (const rel of navPages) {
      const html = read(outDirs[key], rel);
      for (const [where, links] of [["header", headerNav(html)], ["footer", footerNav(html)]]) {
        assert.deepEqual(links.map((link) => link.label), navLabels, `${rel} ${where} labels`);
        assert.deepEqual(links.map((link) => link.href), expectedHrefs, `${rel} ${where} hrefs`);
      }
      for (const link of footerNav(html)) assert.ok(!/active-nav|aria-current/.test(link.tag), `${rel} footer marks ${link.label}`);
    }
  });

  test(`(${key} build) subpages mark exactly their own header link with aria-current (D-07)`, () => {
    for (const [rel, label] of Object.entries(currentNav)) {
      const html = read(outDirs[key], rel);
      const marked = headerNav(html).filter((link) => link.tag.includes('aria-current="page"'));
      assert.deepEqual(marked.map((link) => link.label), [label], `${rel} aria-current links`);
      assert.ok(/\sclass="active-nav"/.test(marked[0].tag), `${rel}: the current link lacks class active-nav`);
      const active = headerNav(html).filter((link) => link.tag.includes("active-nav"));
      assert.deepEqual(active.map((link) => link.label), [label], `${rel} active-nav links`);
      // Pitfall 15: the breadcrumb keeps its own aria-current, so a subpage has two.
      assert.equal(html.split('aria-current="page"').length - 1, 2, `${rel}: expected header + breadcrumb aria-current`);
    }
  });

  test(`(${key} build) home marks only Start with active-nav and 404 marks nothing`, () => {
    const home = headerNav(read(outDirs[key], "index.html"));
    assert.deepEqual(home.filter((link) => link.tag.includes("active-nav")).map((link) => link.label), ["Start"]);
    assert.ok(home.every((link) => !link.tag.includes("aria-current")), "home header carries aria-current");
    const notFound = read(outDirs[key], "404.html");
    assert.ok(!notFound.includes("active-nav"), "404 marks a nav link active");
    assert.ok(!notFound.includes("aria-current"), "404 carries aria-current");
  });
}

/* --- HOME AGREES WITH THE SUBPAGES (D-06, D-09, CONT-06) --- */
const oldAgeLine = "Ukończone 16 lat";
const oldDaysLabel = "Pt/Sob/Ndz";

for (const [key] of Object.entries(variants)) {
  test(`(${key} build) the home teaser states the confirmed facts and keeps terminal and CTA, without the Discord member badge (D-06, D-09, WR-01)`, () => {
    const home = read(outDirs[key], "index.html");
    for (const text of ["Zalecane 16+", "TeamSpeak", "ACRE2", "ok. 90 GB", "Start misji w weekendy", "19:00", "20+", "Aktywnych członków", "Pełna instrukcja", "Wejdź na Discord", "Instrukcja Zaciągu", "Wymagania wstępne"]) {
      assert.ok(home.includes(text), `home lacks "${text}"`);
    }
    const start = home.indexOf('<section id="rekrutacja"');
    assert.ok(start !== -1, "no section#rekrutacja");
    const teaser = home.slice(start, home.indexOf("</section>", start));
    assert.ok(!teaser.includes("recruitment-steps"), "the teaser still has the step list");
    assert.ok(teaser.includes('data-js="terminal"'), "the teaser lost the terminal");
    assert.ok(teaser.includes("Wejdź na Discord"), "the teaser lost the Discord CTA");
    assert.ok(!teaser.includes("discord-badge") && !teaser.includes("data-api-url"), "the Discord member badge was removed (quick 261013-vh0, review WR-01)");
    assert.ok(teaser.indexOf("Pełna instrukcja") < teaser.indexOf("recruitment-cta-group"), "Pełna instrukcja must come before the CTA group");
  });

  test(`(${key} build) home and subpages state the same age, schedule and modpack size (D-09)`, () => {
    const pagesHtml = Object.fromEntries(["index.html", joinPage, operationsPage].map((rel) => [rel, read(outDirs[key], rel)]));
    for (const [text, rels] of [["Zalecane 16+", ["index.html", joinPage]], ["19:00", ["index.html", operationsPage]], ["ok. 90 GB", ["index.html", joinPage]]]) {
      for (const rel of rels) assert.ok(pagesHtml[rel].includes(text), `${rel} lacks "${text}"`);
    }
  });
}

test("no built page (dev pages included) carries the old age line or the Friday/Saturday/Sunday label (D-09)", () => {
  const outDir = build("pages-dev", { INCLUDE_DEV_PAGES: "1" });
  const files = listFiles(outDir, [".html"]);
  assert.ok(files.length >= 6, `expected the pages and the dev pages, found ${files.length}`);
  for (const file of files) {
    const html = readFileSync(file, "utf8");
    const rel = relative(outDir, file);
    assert.ok(!html.includes(oldAgeLine), `${rel} carries "${oldAgeLine}"`);
    assert.ok(!html.includes(oldDaysLabel), `${rel} carries "${oldDaysLabel}"`);
  }
});
