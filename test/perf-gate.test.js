// D-16/D-17 perf gate checks: rules in lib/check-perf.js, CLI scripts/check-perf.js
// Hand-written fixture folders go to _test/perf-gate-fixtures/<name>/: cleanSite() is a valid
// build output, and each rule test breaks exactly one thing in it. Rule tests are named after
// their rule id ("P4 ..."), so every rule has at least one negative fixture.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";
import { build, cleanEnv, repoRoot } from "./helpers.js";
import * as perf from "../lib/check-perf.js";

const { BUDGET, checkPerf } = perf;
const fixtureSite = { url: "https://fixture.example", pathPrefix: "/" };
const prefixSite = { url: "https://fixture.example", pathPrefix: "/IBC-Website/" };
const fixturesDir = join(repoRoot, "_test", "perf-gate-fixtures");

// Write { relPath: string | Buffer } into a fresh _test/perf-gate-fixtures/<name>/ and return
// the folder. A null content leaves that file out.
function writeFixture(name, files) {
  const dir = join(fixturesDir, name);
  rmSync(dir, { recursive: true, force: true });
  rmSync(`${dir}.rejected`, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const [relPath, content] of Object.entries(files)) {
    if (content === null) continue;
    const full = join(dir, relPath);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

function runGate(dir, env = {}) {
  return spawnSync(process.execPath, ["scripts/check-perf.js", "--dir", dir], {
    cwd: repoRoot,
    env: cleanEnv(env),
    encoding: "utf8",
  });
}

// Deterministic text that gzip cannot shrink much (64-symbol alphabet, LCG), so a fixture can
// go over a gzip cap on purpose.
function noise(length) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let state = 12345;
  let text = "";
  for (let i = 0; i < length; i++) {
    state = (state * 1103515245 + 12345) % 2147483648;
    text += alphabet[(state >>> 16) % 64];
  }
  return text;
}

// A binary file of exactly n bytes. The gate only looks at image and font sizes, never pixels.
const bytes = (n) => Buffer.alloc(n, 0x41);

const cssText = "body{margin:0;background:#080e11;color:#e0e6e9}.hero-img{object-fit:cover}\n";
const mainJs = 'for (const el of document.querySelectorAll("[data-js]")) import(`./modules/${el.dataset.js}.js`);\n';
const lightboxJs = "export default function initLightbox(root) { if (!root) return; }\n";

// Sizes the clean fixture ships: research measurements for the 1280 w hero (81/114/110 KB) and
// lightbox targets under 300 KB.
const heroSizes = {
  640: { avif: 30000, webp: 42000, jpeg: 45000 },
  1280: { avif: 81000, webp: 114000, jpeg: 110000 },
  1920: { avif: 150000, webp: 210000, jpeg: 240000 },
};
const lightboxSizes = { avif: 150000, webp: 224000, jpeg: 280000 };
const fontSize = 36460;

function srcset(p, format) {
  return [640, 1280, 1920].map((width) => `${p}img/hero-${width}.${format} ${width}w`).join(", ");
}

function heroPicture(p) {
  return (
    `<picture><source type="image/avif" srcset="${srcset(p, "avif")}" sizes="100vw">` +
    `<source type="image/webp" srcset="${srcset(p, "webp")}" sizes="100vw">` +
    `<img alt="" class="hero-img" loading="eager" fetchpriority="high" decoding="async" src="${p}img/hero-640.jpeg" width="1920" height="1080" srcset="${srcset(p, "jpeg")}" sizes="100vw"></picture>`
  );
}

function head(p) {
  return (
    `<head><meta charset="utf-8"><title>IBC</title>\n` +
    `<link rel="stylesheet" href="${p}css/style.css?v=0123456789">\n` +
    `<script type="module" src="${p}js/main.js"></script>\n` +
    `<script type="application/ld+json">{"@context":"https://schema.org","name":"<img style=\\"x\\">"}</script>\n</head>`
  );
}

function indexPage(p) {
  return (
    `<!doctype html><html lang="pl">${head(p)}<body>\n` +
    `<header><img src="${p}assets/brand/logo-48.png" alt="IBC Logo" class="logo-img" width="48" height="48" loading="lazy" decoding="async"></header>\n` +
    `<main>\n<section id="hero" class="hero">${heroPicture(p)}<h1>Inglourious Basterds Clan</h1></section>\n` +
    `<section id="gallery" class="gallery" data-js="lightbox">\n` +
    `<a class="gallery-item" href="${p}img/shot-1600.jpeg" data-lightbox-avif="${p}img/shot-1600.avif" data-lightbox-webp="${p}img/shot-1600.webp" data-lightbox-jpeg="${p}img/shot-1600.jpeg">` +
    `<img src="${p}img/shot-600.jpeg" alt="Patrol bojowy" width="600" height="338" loading="lazy" decoding="async"></a>\n` +
    `</section>\n<p>Zasady: style="tekst" w treści to nie atrybut.</p>\n</main>\n</body></html>\n`
  );
}

function notFoundPage(p) {
  return `<!doctype html><html lang="pl">${head(p)}<body><main><h1>404</h1><p>Nie znaleziono strony.</p></main></body></html>\n`;
}

// A valid build output: index.html with hero, lightbox item, lazy thumbnail and lazy logo,
// a 404 page, one stylesheet, main.js plus the lightbox module, one woff2, a small brand PNG.
function cleanSite(p = "/") {
  const files = {
    "index.html": indexPage(p),
    "404.html": notFoundPage(p),
    "css/style.css": cssText,
    "js/main.js": mainJs,
    "js/modules/lightbox.js": lightboxJs,
    "fonts/montserrat-v1.woff2": bytes(fontSize),
    "assets/brand/logo-48.png": bytes(4000),
    "img/shot-600.jpeg": bytes(30000),
    "robots.txt": "User-agent: *\nAllow: /\n",
  };
  for (const [width, formats] of Object.entries(heroSizes)) {
    for (const [format, size] of Object.entries(formats)) files[`img/hero-${width}.${format}`] = bytes(size);
  }
  for (const [format, size] of Object.entries(lightboxSizes)) files[`img/shot-1600.${format}`] = bytes(size);
  return files;
}

// cleanSite() with one text replacement in one file; fails loudly when the text is not there.
function edit(files, relPath, from, to) {
  assert.ok(files[relPath].includes(from), `fixture ${relPath} has no "${from}"`);
  return { ...files, [relPath]: files[relPath].replace(from, to) };
}

function check(name, files, site = fixtureSite, options = {}) {
  return checkPerf(writeFixture(name, files), site, { sourceImageNames: ["hero-bg.jpg", "patrol.jpg"], ...options });
}

// Asserts at least one problem for rule n on file (a "<file>:<line>" prefix counts as the file).
function assertRule(problems, file, n) {
  const hit = problems.some((problem) => (problem.startsWith(`${file}: `) || problem.startsWith(`${file}:`)) && problem.includes(`: P${n} `));
  assert.ok(hit, `expected a P${n} problem on ${file}, got:\n${problems.join("\n") || "(none)"}`);
}

test("clean fixture passes the gate", () => {
  assert.deepEqual(check("clean", cleanSite()), []);
});

test("P0 empty output folder is reported", () => {
  assert.deepEqual(check("empty", {}), [".: P0 no HTML pages in the build output"]);
});

test("P1 index.html without a fetchpriority=high hero fails", () => {
  assertRule(check("p1-no-hero", edit(cleanSite(), "index.html", ' fetchpriority="high"', "")), "index.html", 1);
});

test("P1 a page with two fetchpriority=high images fails", () => {
  const files = edit(cleanSite(), "404.html", "<h1>404</h1>", `<h1>404</h1>${heroPicture("/")}${heroPicture("/")}`);
  assertRule(check("p1-two-heroes", files), "404.html", 1);
});

test("P1 hero picture without an avif source fails", () => {
  const files = edit(cleanSite(), "index.html", '<source type="image/avif"', '<source type="image/png"');
  assertRule(check("p1-no-avif", files), "index.html", 1);
});

test("P1 hero outside a picture fails", () => {
  let files = edit(cleanSite(), "index.html", "<picture>", "<div>");
  files = edit(files, "index.html", "</picture>", "</div>");
  assertRule(check("p1-no-picture", files), "index.html", 1);
});

test("P1 hero candidate of 1280 w over heroMobileMaxBytes fails", () => {
  const files = { ...cleanSite(), "img/hero-1280.webp": bytes(BUDGET.heroMobileMaxBytes + 1) };
  assertRule(check("p1-mobile-too-big", files), "index.html", 1);
});

test("P1 a 1920 w hero candidate over the mobile cap passes", () => {
  const files = { ...cleanSite(), "img/hero-1920.avif": bytes(BUDGET.heroMobileMaxBytes * 3) };
  assert.deepEqual(check("p1-desktop-big", files), []);
});

test("P1 hero candidate missing from the output fails", () => {
  const files = { ...cleanSite(), "img/hero-640.jpeg": null };
  assertRule(check("p1-missing-candidate", files), "index.html", 1);
});

test("P1 lazy hero fails", () => {
  const files = edit(cleanSite(), "index.html", 'loading="eager" fetchpriority="high"', 'loading="lazy" fetchpriority="high"');
  assertRule(check("p1-lazy-hero", files), "index.html", 1);
});

test("P2 lightbox target of exactly lightboxMaxBytes fails (strictly less than)", () => {
  const files = { ...cleanSite(), "img/shot-1600.webp": bytes(BUDGET.lightboxMaxBytes) };
  assertRule(check("p2-at-cap", files), "index.html", 2);
  const under = { ...cleanSite(), "img/shot-1600.webp": bytes(BUDGET.lightboxMaxBytes - 1) };
  assert.deepEqual(check("p2-under-cap", under), []);
});

test("P2 lightbox target wider than 1600 w fails", () => {
  const files = { ...edit(cleanSite(), "index.html", 'data-lightbox-avif="/img/shot-1600.avif"', 'data-lightbox-avif="/img/shot-1920.avif"'), "img/shot-1920.avif": bytes(100000) };
  assertRule(check("p2-too-wide", files), "index.html", 2);
});

test("P2 lightbox target without a width in its file name fails", () => {
  const files = { ...edit(cleanSite(), "index.html", 'data-lightbox-jpeg="/img/shot-1600.jpeg"', 'data-lightbox-jpeg="/img/shot.jpeg"'), "img/shot.jpeg": bytes(100000) };
  assertRule(check("p2-no-width", files), "index.html", 2);
});

test("P2 missing lightbox target fails", () => {
  const files = { ...cleanSite(), "img/shot-1600.webp": null };
  assertRule(check("p2-missing", files), "index.html", 2);
});

test("P3 Google Fonts stylesheet host fails", () => {
  const files = edit(cleanSite(), "index.html", "<title>IBC</title>", '<title>IBC</title>\n<link rel="preconnect" href="https://fonts.googleapis.com">');
  const problems = check("p3-google-fonts", files);
  assert.ok(
    problems.some((problem) => problem.startsWith("index.html:") && problem.includes("P3")),
    `no P3 problem on index.html:\n${problems.join("\n")}`,
  );
});

test("P3 Font Awesome host inside a stylesheet fails", () => {
  const files = { ...cleanSite(), "css/style.css": `@import url("https://use.fontawesome.com/releases/v6.0.0/css/all.css");\n${cssText}` };
  assertRule(check("p3-fa-css", files), "css/style.css", 3);
});

test("P4 inline style attribute fails", () => {
  const files = edit(cleanSite(), "404.html", "<h1>404</h1>", '<h1 style="color:red">404</h1>');
  assertRule(check("p4-inline-style", files), "404.html", 4);
});

test("P4 style= in text and inside a JSON-LD script is not an attribute", () => {
  // The clean fixture already carries both; this pins that they stay ignored.
  assert.ok(cleanSite()["index.html"].includes('style="tekst"'));
  assert.deepEqual(check("p4-text-only", cleanSite()), []);
});

test("P5 page without a stylesheet link fails", () => {
  const files = edit(cleanSite(), "404.html", '<link rel="stylesheet" href="/css/style.css?v=0123456789">', "");
  assertRule(check("p5-no-stylesheet", files), "404.html", 5);
});

test("P5 page with two stylesheet links fails", () => {
  const files = edit(cleanSite(), "404.html", "<title>IBC</title>", '<title>IBC</title><link href="/css/style.css" rel="stylesheet">');
  assertRule(check("p5-two-stylesheets", files), "404.html", 5);
});

test("P5 style element fails", () => {
  const files = edit(cleanSite(), "404.html", "</head>", "<style>body{margin:0}</style></head>");
  assertRule(check("p5-style-element", files), "404.html", 5);
});

test("P6 img without height fails", () => {
  const files = edit(cleanSite(), "index.html", 'width="600" height="338"', 'width="600"');
  assertRule(check("p6-no-height", files), "index.html", 6);
});

test("P6 img with a non-numeric width fails", () => {
  const files = edit(cleanSite(), "index.html", 'width="48" height="48"', 'width="auto" height="48"');
  assertRule(check("p6-bad-width", files), "index.html", 6);
});

test("P7 non-hero img without loading=lazy fails (header logo included)", () => {
  const files = edit(cleanSite(), "index.html", 'class="logo-img" width="48" height="48" loading="lazy"', 'class="logo-img" width="48" height="48"');
  assertRule(check("p7-eager-logo", files), "index.html", 7);
});

test("P8 file named like a source original fails", () => {
  const files = { ...cleanSite(), "assets/hero-bg.jpg": bytes(5000) };
  assertRule(check("p8-original", files), "assets/hero-bg.jpg", 8);
});

test("P8 assets/hero.jpg fails", () => {
  const files = { ...cleanSite(), "assets/hero.jpg": bytes(5000) };
  assertRule(check("p8-hero-jpg", files), "assets/hero.jpg", 8);
});

test("P8 200 KB PNG under assets fails", () => {
  const files = { ...cleanSite(), "assets/brand/huge.png": bytes(200 * 1024) };
  assertRule(check("p8-big-png", files), "assets/brand/huge.png", 8);
});

test("P8 250 KB variant under img is left to P1 and P2", () => {
  const files = { ...cleanSite(), "img/unused-1920.png": bytes(250 * 1024) };
  assert.deepEqual(check("p8-img-variant", files), []);
});

test("P8 reads the source image names from src/images by default", () => {
  // Without options.sourceImageNames the gate still runs; a clean fixture has no originals.
  assert.deepEqual(checkPerf(writeFixture("p8-default-names", cleanSite()), fixtureSite), []);
});

test("P9 CSS gzip over the cap fails", () => {
  const files = { ...cleanSite(), "css/style.css": `/* ${noise(12000)} */\n${cssText}` };
  assertRule(check("p9-css-too-big", files), "index.html", 9);
});

test("P9 stylesheet href that resolves to no file fails", () => {
  const files = { ...cleanSite(), "css/style.css": null };
  assertRule(check("p9-missing-css", files), "index.html", 9);
});

test("P10 data-js hook without its js/modules/<hook>.js fails", () => {
  const files = { ...cleanSite(), "js/modules/lightbox.js": null };
  assertRule(check("p10-missing-module", files), "index.html", 10);
});

test("P10 data-js hook with an unsafe name fails", () => {
  const files = edit(cleanSite(), "index.html", 'data-js="lightbox"', 'data-js="../main"');
  assertRule(check("p10-bad-hook", files), "index.html", 10);
});

test("P10 initial JS gzip over the cap fails", () => {
  // Base64 noise gzips to about 0.75 B per character, so twice the cap in characters is over it.
  const files = { ...cleanSite(), "js/modules/lightbox.js": `/* ${noise(BUDGET.initialJsGzipMaxBytes * 2)} */\n${lightboxJs}` };
  const problems = check("p10-js-too-big", files);
  assertRule(problems, "index.html", 10);
  // 404.html has no lightbox hook, so it does not pay for that module.
  assert.ok(!problems.some((problem) => problem.startsWith("404.html: P10")), problems.join("\n"));
});

test("P11 two woff2 files fail", () => {
  const files = { ...cleanSite(), "fonts/extra.woff2": bytes(1000) };
  assertRule(check("p11-two-fonts", files), ".", 11);
});

test("P11 ttf file fails", () => {
  const files = { ...cleanSite(), "fonts/montserrat.ttf": bytes(1000) };
  assertRule(check("p11-ttf", files), "fonts/montserrat.ttf", 11);
});

test("P11 woff2 over fontMaxBytes fails", () => {
  const files = { ...cleanSite(), "fonts/montserrat-v1.woff2": bytes(BUDGET.fontMaxBytes + 1) };
  assertRule(check("p11-font-too-big", files), "fonts/montserrat-v1.woff2", 11);
});

test("BUDGET is frozen", () => {
  assert.ok(Object.isFrozen(BUDGET));
});

test("a custom budget flips a passing fixture to failing (D-17)", () => {
  const dir = writeFixture("custom-budget", cleanSite());
  const options = { sourceImageNames: [] };
  assert.deepEqual(checkPerf(dir, fixtureSite, options), []);
  const problems = checkPerf(dir, fixtureSite, { ...options, budget: { ...BUDGET, cssGzipMaxBytes: 10 } });
  assertRule(problems, "index.html", 9);
});

test("prefixed fixture with prefixed URLs passes", () => {
  assert.deepEqual(check("prefixed", cleanSite("/IBC-Website/"), prefixSite), []);
});

test("an unprefixed URL on a prefixed build is reported outside the build output", () => {
  const files = edit(cleanSite("/IBC-Website/"), "404.html", 'href="/IBC-Website/css/style.css', 'href="/css/style.css');
  const problems = check("prefixed-unprefixed", files, prefixSite);
  assert.ok(problems.some((problem) => problem.startsWith("404.html: P9") && problem.includes("points outside the build output")), problems.join("\n"));
});

test("a URL climbing out of the build folder is reported and never read (T-03-08)", () => {
  // The target exists next to the fixture folder: reading it would make P9 pass silently.
  mkdirSync(fixturesDir, { recursive: true });
  writeFileSync(join(fixturesDir, "outside.css"), cssText);
  for (const url of ["/../outside.css", "/%2e%2e/outside.css"]) {
    const files = edit(cleanSite(), "404.html", 'href="/css/style.css?v=0123456789"', `href="${url}"`);
    const problems = check("escape", files);
    assert.ok(problems.some((problem) => problem.startsWith("404.html: P9") && problem.includes("points outside the build output")), `${url}:\n${problems.join("\n")}`);
  }
});

test("gate output is stable and sorted by file, rule and text", () => {
  let files = edit(cleanSite(), "index.html", 'width="600" height="338" loading="lazy"', 'style="x"');
  files = edit(files, "404.html", "<h1>404</h1>", '<h1 style="a">404</h1><style></style>');
  files = { ...files, "assets/hero.jpg": bytes(10) };
  const dir = writeFixture("sorted", files);
  const first = checkPerf(dir, fixtureSite, { sourceImageNames: [] });
  const second = checkPerf(dir, fixtureSite, { sourceImageNames: [] });
  assert.deepEqual(first, second);
  assert.ok(first.length >= 4, first.join("\n"));
  const key = (problem) => {
    const match = /^(.*?): P(\d+) (.*)$/.exec(problem);
    return [match[1], Number(match[2]), match[3]];
  };
  for (let i = 1; i < first.length; i++) {
    const [fa, ra, ta] = key(first[i - 1]);
    const [fb, rb, tb] = key(first[i]);
    const ordered = fa < fb || (fa === fb && (ra < rb || (ra === rb && ta <= tb)));
    assert.ok(ordered, `out of order:\n${first[i - 1]}\n${first[i]}`);
  }
});

test("measurePerf on the clean fixture returns the sizes node:zlib gives", () => {
  assert.equal(typeof perf.measurePerf, "function", "lib/check-perf.js exports no measurePerf");
  const dir = writeFixture("measure", cleanSite());
  const gz = (text) => gzipSync(Buffer.from(text)).length;
  const heroMobile = Math.max(...Object.values(heroSizes[640]), ...Object.values(heroSizes[1280]));
  assert.deepEqual(perf.measurePerf(dir, fixtureSite), {
    pages: 2,
    cssGzipBytes: gz(cssText),
    initialJsGzipBytes: gz(mainJs) + gz(lightboxJs),
    fontBytes: fontSize,
    fontFiles: 1,
    heroMobileMaxBytes: heroMobile,
    lightboxMaxBytes: Math.max(...Object.values(lightboxSizes)),
  });
});

test("CLI exits 0 with OK and the measured sizes on a clean fixture", () => {
  writeFixture("cli-clean", cleanSite());
  const result = runGate("_test/perf-gate-fixtures/cli-clean");
  assert.equal(result.status, 0, `gate failed on a clean fixture:\n${result.stderr}`);
  assert.match(result.stdout, /check-perf: OK, 2 page\(s\) checked/);
  assert.match(
    result.stdout,
    new RegExp(
      `check-perf: css \\d+ B gz \\(cap ${BUDGET.cssGzipMaxBytes}\\), initial js \\d+ B gz \\(cap ${BUDGET.initialJsGzipMaxBytes}\\), ` +
        `font ${fontSize} B \\(cap ${BUDGET.fontMaxBytes}\\), hero mobile max \\d+ B \\(cap ${BUDGET.heroMobileMaxBytes}\\), ` +
        `lightbox max \\d+ B \\(cap ${BUDGET.lightboxMaxBytes}\\)`,
    ),
  );
  assert.ok(existsSync(join(fixturesDir, "cli-clean", "index.html")), "a passing gate must leave the output in place");
});

function googleFontsSite() {
  return edit(cleanSite(), "index.html", "<title>IBC</title>", '<title>IBC</title>\n<link rel="preconnect" href="https://fonts.googleapis.com">');
}

// CR-02: a rejected build must leave nothing deployable behind, exactly like check-seo.
test("CLI moves a rejected build aside so no deployable index.html is left", () => {
  const dir = join(fixturesDir, "cli-rejected");
  const rejected = `${dir}.rejected`;
  rmSync(rejected, { recursive: true, force: true });
  // Twice: the second run must replace the .rejected folder the first one left.
  for (let run = 1; run <= 2; run += 1) {
    rmSync(dir, { recursive: true, force: true });
    for (const [relPath, content] of Object.entries(googleFontsSite())) {
      mkdirSync(dirname(join(dir, relPath)), { recursive: true });
      writeFileSync(join(dir, relPath), content);
    }
    const result = runGate("_test/perf-gate-fixtures/cli-rejected");
    assert.equal(result.status, 1, `run ${run}: gate accepted a Google Fonts link:\n${result.stdout}`);
    assert.match(result.stderr, /check-perf: index\.html:\d+: P3 /);
    assert.match(result.stderr, /must not be deployed; moved to _test\/perf-gate-fixtures\/cli-rejected\.rejected/);
    assert.ok(!existsSync(join(dir, "index.html")), `run ${run}: rejected output still has a deployable index.html`);
    assert.ok(!existsSync(dir), `run ${run}: the rejected output folder is still in place`);
    assert.ok(existsSync(join(rejected, "index.html")), `run ${run}: the rejected output was not kept in ${rejected}`);
  }
});

// T-03-09: a crash inside the rules is a failed check, never a pass. A dangling link named
// like a page makes reading it throw. Skipped where this machine cannot create a link.
test("CLI rejects the output when the rules crash", (t) => {
  const dir = writeFixture("cli-crash", cleanSite());
  try {
    symlinkSync(join(dir, "missing-target"), join(dir, "broken.html"), process.platform === "win32" ? "junction" : "file");
  } catch (error) {
    t.skip(`cannot create a link here: ${error.code || error.message}`);
    return;
  }
  const result = runGate("_test/perf-gate-fixtures/cli-crash");
  assert.equal(result.status, 1, `gate passed although the rules crashed:\n${result.stdout}`);
  assert.match(result.stderr, /check-perf: crashed: /);
  assert.match(result.stderr, /must not be deployed; moved to _test\/perf-gate-fixtures\/cli-crash\.rejected/);
  assert.ok(!existsSync(dir), "a crashed check left the output folder in place");
});

test("CLI exits 1 when the build folder does not exist", () => {
  const result = runGate("_test/perf-gate-does-not-exist");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /check-perf: _test\/perf-gate-does-not-exist does not exist \(run eleventy first\)/);
});

test("CLI exits 1 with its own message when --dir is a file", () => {
  writeFixture("cli-dir-is-file", { "robots.txt": "User-agent: *\n" });
  const result = runGate("_test/perf-gate-fixtures/cli-dir-is-file/robots.txt");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /check-perf: _test\/perf-gate-fixtures\/cli-dir-is-file\/robots\.txt is not a folder/);
});

// D-16/D-17 on the real site: the two production builds the project deploys (root and the
// /IBC-Website/ GitHub Pages preview) pass the gate with the final BUDGET, and npm run build
// ends with the gate. Built once per file; node --test runs files in parallel processes, so the
// folder names carry the suite name.
const realRoot = { dir: null, site: { url: "http://localhost:8080", pathPrefix: "/" } };
const realPrefix = { dir: null, site: { url: "https://inglourious-basterds-clan.github.io", pathPrefix: "/IBC-Website/" } };
function realBuild(variant) {
  if (variant.dir) return variant.dir;
  variant.dir =
    variant === realRoot
      ? build("perf-gate-real-root")
      : build("perf-gate-real-prefix", { SITE_URL: variant.site.url, PATH_PREFIX: variant.site.pathPrefix });
  return variant.dir;
}

test("real builds pass the perf gate (D-16)", () => {
  for (const variant of [realRoot, realPrefix]) {
    const problems = checkPerf(realBuild(variant), variant.site);
    assert.deepEqual(problems, [], `${variant.site.pathPrefix} build fails the perf gate:\n${problems.join("\n")}`);
  }
});

test("every measured size is within its cap (D-17)", () => {
  for (const variant of [realRoot, realPrefix]) {
    const sizes = perf.measurePerf(realBuild(variant), variant.site);
    const label = `${variant.site.pathPrefix} build`;
    assert.ok(sizes.cssGzipBytes > 0 && sizes.cssGzipBytes <= BUDGET.cssGzipMaxBytes, `${label}: css ${sizes.cssGzipBytes} B gz`);
    assert.ok(
      sizes.initialJsGzipBytes > 0 && sizes.initialJsGzipBytes <= BUDGET.initialJsGzipMaxBytes,
      `${label}: initial js ${sizes.initialJsGzipBytes} B gz`,
    );
    assert.ok(sizes.fontBytes > 0 && sizes.fontBytes <= BUDGET.fontMaxBytes, `${label}: font ${sizes.fontBytes} B`);
    assert.ok(sizes.fontFiles <= BUDGET.fontFilesMax, `${label}: ${sizes.fontFiles} font files`);
    assert.ok(
      sizes.heroMobileMaxBytes > 0 && sizes.heroMobileMaxBytes <= BUDGET.heroMobileMaxBytes,
      `${label}: hero mobile max ${sizes.heroMobileMaxBytes} B`,
    );
    assert.ok(sizes.lightboxMaxBytes > 0 && sizes.lightboxMaxBytes < BUDGET.lightboxMaxBytes, `${label}: lightbox max ${sizes.lightboxMaxBytes} B`);
  }
});

test("a regression in a real build is caught", () => {
  const dir = join(fixturesDir, "real-regression");
  rmSync(dir, { recursive: true, force: true });
  cpSync(realBuild(realRoot), dir, { recursive: true });
  const indexPath = join(dir, "index.html");
  const html = readFileSync(indexPath, "utf8");
  assert.match(html, /<main\b/, "the real index.html has no <main> element");
  writeFileSync(indexPath, html.replace(/<main\b/, '<main style="color:red"'));
  const problems = checkPerf(dir, realRoot.site);
  assert.ok(
    problems.some((problem) => /^index\.html(?::\d+)?: P4 /.test(problem)),
    `no P4 line for the inline style in index.html:\n${problems.join("\n")}`,
  );
});

test("npm run build ends with the perf gate", () => {
  const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  assert.equal(
    pkg.scripts.build,
    "node scripts/clean.js && eleventy && node scripts/check-seo.js && node scripts/check-perf.js",
  );
});
