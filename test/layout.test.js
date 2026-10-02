// FOUND-02/05 checks: the home page renders through layouts/base.njk + partials with the
// same sections, ids and Polish copy as the old index.html, and every internal URL is
// root-relative so HtmlBasePlugin prefixes it under /IBC-Website/.
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { build, read, attrValues } from "./helpers.js";
import site from "../src/_data/site.js";

const prefix = "/IBC-Website/";
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

test("home page keeps its Polish copy and home-only head data", () => {
  for (const text of polishCopy) assert.ok(rootHtml.includes(text), `missing copy: ${text}`);
  assert.ok(rootHtml.includes("<title>IBC Clan // Wizytówka Taktyczna Arma 3</title>"), "default title changed");
  assert.ok(rootHtml.includes('name="keywords"'), "meta keywords missing on home");
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
