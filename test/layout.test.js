// FOUND-02/05 checks: the home page renders through layouts/base.njk + partials with the
// same sections, ids and Polish copy as the old index.html, and every internal URL is
// root-relative so HtmlBasePlugin prefixes it under /IBC-Website/.
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { build, read, attrValues, block } from "./helpers.js";
import site from "../src/_data/site.js";

const prefix = "/IBC-Website/";
const navLabels = ["System", "O nas", "Galeria", "Rekrutacja"];
const navHrefs = ["/#hero", "/#about", "/#gallery", "/#recruitment"];
const inviteDomainPattern = /https?:\/\/(?:www\.)?discord(?:\.gg|(?:app)?\.com\/invite)\/[A-Za-z0-9-]+/g;
const galleryFiles = ["op_patrol.jpg", "jo_1967.png", "cos.png", "funny.png"];

const polishCopy = [
  "Profil Działalności",
  "Kim jesteśmy?",
  "Nasz Styl Gry",
  "Galeria Operacyjna",
  "Centrum Rekrutacyjne",
  "Wymagania wstępne",
  "Instrukcja Zaciągu",
  "Wejdź na Discord",
  "TERMINAL REKRUTACYJNY v1.0.0",
  "Aktywnych członków",
  "20+",
  "19:00",
  "Ukończone 16 lat.",
  "// RAPORT DEKRYPTOWANIA: PROJEKT DIABLO",
  "WSZELKIE PRAWA ZASTRZEŻONE",
];

let rootHtml;
let prefixHtml;

before(() => {
  rootHtml = read(build("layout-root"), "index.html");
  prefixHtml = read(build("layout-prefix", { PATH_PREFIX: prefix }), "index.html");
});

function count(html, needle) {
  return html.split(needle).length - 1;
}

// The substring from the opening tag that contains marker up to the next closing </ul>.
function list(html, marker) {
  const start = html.indexOf(marker);
  assert.ok(start !== -1, `missing ${marker}`);
  const end = html.indexOf("</ul>", start);
  assert.ok(end !== -1, `${marker} is not closed`);
  return html.slice(start, end + "</ul>".length);
}

// [{ href, label }] for every <a> in the fragment, in document order.
function anchors(fragment) {
  return Array.from(fragment.matchAll(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g), (match) => ({
    href: match[1],
    label: match[2].trim(),
  }));
}

function anchorTags(html) {
  return html.match(/<a\s[^>]*>/g) || [];
}

test("home page keeps its structure and ids", () => {
  const h1s = rootHtml.match(/<h1[\s>][\s\S]*?<\/h1>/g) || [];
  assert.equal(h1s.length, 1, "expected exactly one <h1>");
  assert.ok(h1s[0].includes("Inglourious Basterds Clan"), "h1 text changed");

  const bodyTag = /<body[^>]*>/.exec(rootHtml);
  assert.ok(bodyTag, "no <body> tag");
  assert.equal(bodyTag[0], "<body>", "body tag must carry no attributes (top anchor moved to the hero)");

  for (const needle of [
    '<section id="hero" class="hero">',
    'id="about"',
    'id="gallery"',
    'id="recruitment"',
    'id="lightbox"',
    'id="decryption-overlay"',
    'id="easteregg-trigger"',
    'id="mobile-nav"',
    '<main id="main">',
  ]) {
    assert.ok(rootHtml.includes(needle), `missing ${needle}`);
  }

  const terminal = /<div[^>]*id="terminal-console"[^>]*>/.exec(rootHtml);
  assert.ok(terminal, "missing #terminal-console");
  assert.ok(terminal[0].includes(`data-discord-url="${site.discord.invite}"`), "terminal lost data-discord-url");

  assert.equal(count(rootHtml, 'class="gallery-item hud-border"'), 4, "expected 4 gallery items");

  const skip = rootHtml.indexOf('href="#main"');
  const grid = rootHtml.indexOf('class="grid-bg"');
  assert.ok(skip !== -1, "skip link missing");
  assert.ok(skip < grid, "skip link must come before the grid background");

  const lightboxImg = /<div class="lightbox-content">[\s\S]*?(<img[^>]*>)/.exec(rootHtml);
  assert.ok(lightboxImg, "lightbox img missing");
  assert.ok(!/\ssrc=/.test(lightboxImg[1]), "lightbox img must have no src attribute");
});

test("home page keeps its Polish copy and its new head title (D-01, D-14)", () => {
  for (const text of polishCopy) assert.ok(rootHtml.includes(text), `missing copy: ${text}`);
  assert.ok(rootHtml.includes("<title>Klan Arma 3 Milsim – Inglourious Basterds Clan (IBC)</title>"), "home title is not the D-01 title");
  assert.ok(!rootHtml.includes('name="keywords"'), "meta keywords must be gone (D-14)");
  assert.ok(rootHtml.includes('"@type": "SportsTeam"'), "SportsTeam JSON-LD missing on home");
});

test("prefix build puts every internal URL under the prefix", () => {
  assert.ok(prefixHtml.includes(`src="${prefix}assets/logo.png"`), "logo src missing the prefix");

  const srcs = attrValues(prefixHtml, "src");
  const dataSrcs = attrValues(prefixHtml, "data-src");
  for (const file of galleryFiles) {
    assert.ok(srcs.includes(`${prefix}assets/${file}`), `gallery img src for ${file} missing the prefix`);
    assert.ok(dataSrcs.includes(`${prefix}assets/${file}`), `gallery data-src for ${file} missing the prefix`);
  }

  assert.ok(attrValues(prefixHtml, "href").includes(`${prefix}#about`), "nav hrefs missing the prefix");
  assert.ok(!prefixHtml.includes('src="."'), 'output contains src="."');

  for (const attr of ["href", "src", "data-src"]) {
    for (const value of attrValues(prefixHtml, attr)) {
      if (value.startsWith("/")) assert.ok(value.startsWith(prefix), `${attr}="${value}" is not under ${prefix}`);
    }
  }
});

test("header and footer nav follow navigation.js order (FOUND-05)", () => {
  const header = block(rootHtml, "header");
  const headerLinks = anchors(list(header, '<ul id="mobile-nav">'));
  assert.deepEqual(headerLinks.map((link) => link.label), navLabels, "header nav labels/order");
  assert.deepEqual(headerLinks.map((link) => link.href), navHrefs, "header nav hrefs/order");

  const footerLinks = anchors(list(block(rootHtml, "footer"), '<ul class="footer-links">'));
  assert.deepEqual(footerLinks.map((link) => link.label), navLabels, "footer nav labels/order");
  assert.deepEqual(footerLinks.map((link) => link.href), navHrefs, "footer nav hrefs/order");

  assert.equal(count(rootHtml, 'class="active-nav"'), 1, "expected exactly one active-nav on home");
});

test("header carries the Discord CTA outside the nav list (D-10, D-11)", () => {
  const header = block(rootHtml, "header");
  const cta = anchorTags(header).filter((tag) => tag.includes('class="hud-btn header-cta"'));
  assert.equal(cta.length, 1, "expected one header CTA");
  assert.ok(cta[0].includes(`href="${site.discord.invite}"`), "CTA href is not site.discord.invite");
  assert.ok(cta[0].includes('target="_blank"'), "CTA must open in a new tab");
  assert.ok(cta[0].includes('rel="noopener noreferrer"'), "CTA must carry rel=noopener noreferrer");
  assert.ok(!list(header, '<ul id="mobile-nav">').includes("header-cta"), "CTA must stay outside the nav list");
});

test("external links are safe and the invite has one source", () => {
  for (const tag of anchorTags(rootHtml)) {
    if (tag.includes('target="_blank"')) {
      assert.ok(tag.includes('rel="noopener noreferrer"'), `target=_blank without rel: ${tag}`);
    }
  }

  const inviteHrefs = attrValues(rootHtml, "href").filter((value) => value === site.discord.invite);
  assert.ok(inviteHrefs.length >= 3, `expected header CTA, terminal button and footer icon, found ${inviteHrefs.length}`);
  for (const invite of rootHtml.match(inviteDomainPattern) || []) assert.equal(invite, site.discord.invite);
});

test("prefix build prefixes nav hrefs and leaves the CTA alone", () => {
  const header = block(prefixHtml, "header");
  const headerLinks = anchors(list(header, '<ul id="mobile-nav">'));
  assert.deepEqual(
    headerLinks.map((link) => link.href),
    navHrefs.map((href) => prefix + href.slice(1)),
    "prefixed nav hrefs",
  );
  const cta = anchorTags(header).find((tag) => tag.includes("header-cta"));
  assert.ok(cta && cta.includes(`href="${site.discord.invite}"`), "CTA href changed under the prefix");
});
