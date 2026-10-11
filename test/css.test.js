// PERF-06 / D-12 / D-13 stylesheet checks on a root, an /IBC-Website/ and a dev-page build:
// every page links exactly one stylesheet, /css/style.css?v=<hash>, whose hash matches the
// shipped bytes; the Lightning CSS bundle is minified and keeps the Safari prefixes (Pitfall 2);
// root and prefix builds ship the same bytes (PERF-06 concurrency edge); only the bundle ships
// from src/css; no page or template carries an inline style; the entry only imports the partials in
// cascade order; no dead or unused class selector ships (03-10, D-13).
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { build, listFiles, repoRoot } from "./helpers.js";

const variants = [
  { name: "css-root", prefix: "/", env: {} },
  { name: "css-prefix", prefix: "/IBC-Website/", env: { PATH_PREFIX: "/IBC-Website/" } },
  { name: "css-dev", prefix: "/", env: { INCLUDE_DEV_PAGES: "1" } },
];

const hrefPattern = /^(\/|\/IBC-Website\/)css\/style\.css\?v=([0-9a-f]{10})$/;

const out = {};

before(() => {
  for (const variant of variants) out[variant.name] = build(variant.name, variant.env);
});

function pages(outDir) {
  const files = listFiles(outDir, [".html"]);
  assert.ok(files.length > 0, `no HTML pages in ${outDir}`);
  return files.map((path) => ({ file: relative(outDir, path).replace(/\\/g, "/"), html: readFileSync(path, "utf8") }));
}

function stylesheetLinks(html) {
  return Array.from(html.matchAll(/<link\b[^>]*>/gi), (match) => match[0]).filter((tag) =>
    /\srel=["']?stylesheet["']?(?=[\s>])/i.test(tag),
  );
}

function cssBytes(outDir) {
  return readFileSync(join(outDir, "css", "style.css"));
}

function shortHash(bytes) {
  return createHash("sha256").update(bytes).digest("hex").slice(0, 10);
}

// The ?v= value of the one stylesheet link on outDir's index.html.
function versionOf(outDir) {
  const [link] = stylesheetLinks(readFileSync(join(outDir, "index.html"), "utf8"));
  return /\shref="[^"]*\?v=([0-9a-f]{10})"/.exec(link)?.[1];
}

test("every page links one cache-busted stylesheet (D-12)", () => {
  for (const variant of variants) {
    const outDir = out[variant.name];
    const expected = shortHash(cssBytes(outDir));
    for (const { file, html } of pages(outDir)) {
      const links = stylesheetLinks(html);
      assert.equal(links.length, 1, `${variant.name}: ${file} has ${links.length} stylesheet links, expected 1`);
      const href = /\shref="([^"]*)"/.exec(links[0])?.[1] ?? "";
      const match = hrefPattern.exec(href);
      assert.ok(match, `${variant.name}: ${file} links ${href}, expected <prefix>css/style.css?v=<10 hex>`);
      assert.equal(match[1], variant.prefix, `${variant.name}: ${file} stylesheet has the wrong prefix`);
      assert.equal(match[2], expected, `${variant.name}: ${file} ?v=${match[2]} does not match the shipped bytes (${expected})`);
    }
  }
});

test("the bundle is minified and keeps the Safari prefixes (Pitfall 2)", () => {
  for (const variant of variants) {
    const css = cssBytes(out[variant.name]).toString("utf8");
    assert.ok(!css.includes("/*"), `${variant.name}: css/style.css still holds a comment`);
    const lineBreaks = (css.match(/\n/g) || []).length;
    assert.ok(lineBreaks <= 1, `${variant.name}: css/style.css has ${lineBreaks} line breaks, expected at most 1`);
    assert.ok(css.includes("-webkit-backdrop-filter"), `${variant.name}: the -webkit-backdrop-filter prefix was stripped`);
    assert.ok(css.includes("@font-face"), `${variant.name}: css/style.css has no @font-face`);
  }
});

test("root and prefix builds produce the same bytes (PERF-06 concurrency edge)", () => {
  const root = cssBytes(out["css-root"]);
  const prefix = cssBytes(out["css-prefix"]);
  assert.ok(root.equals(prefix), "css/style.css differs between the root and /IBC-Website/ builds");
  assert.equal(versionOf(out["css-root"]), versionOf(out["css-prefix"]), "the ?v= values differ between the builds");
});

test("only the bundle ships from src/css", () => {
  for (const variant of variants) {
    const names = readdirSync(join(out[variant.name], "css")).sort();
    assert.deepEqual(names, ["style.css"], `${variant.name}: the output css/ folder holds ${names.join(", ")}`);
  }
});

// Every start tag that carries a style attribute (D-12): inline styles became classes.
function styledTags(markup) {
  return Array.from(markup.matchAll(/<[A-Za-z][^>]*>/g), (match) => match[0]).filter((tag) =>
    /\sstyle\s*=/i.test(tag),
  );
}

test("no inline styles anywhere (D-12)", () => {
  for (const variant of variants) {
    for (const { file, html } of pages(out[variant.name])) {
      const styled = styledTags(html);
      assert.equal(styled.length, 0, `${variant.name}: ${file} has inline styles: ${styled.join(" ")}`);
      assert.ok(!/<style[\s>]/i.test(html), `${variant.name}: ${file} has a <style> element`);
    }
  }
  const templates = listFiles(join(repoRoot, "src"), [".njk"]);
  assert.ok(templates.length > 0, "no .njk templates under src/");
  for (const path of templates) {
    const styled = styledTags(readFileSync(path, "utf8"));
    const file = relative(repoRoot, path).replace(/\\/g, "/");
    assert.equal(styled.length, 0, `${file} has inline styles: ${styled.join(" ")}`);
  }
});

// Class names in the selectors of a (minified) bundle. url(...) contents are dropped first, then each
// rule prelude (the text before a "{" back to the previous "}", "{" or ";") is scanned; at-rule
// preludes (@media, @keyframes, @font-face) carry no class selectors and are skipped.
function selectorClasses(css) {
  const pieces = css.replace(/url\([^)]*\)/g, "url()").split("{");
  const names = new Set();
  for (const piece of pieces.slice(0, -1)) {
    const prelude = piece.slice(Math.max(piece.lastIndexOf("}"), piece.lastIndexOf(";")) + 1).trim();
    if (prelude.startsWith("@")) continue;
    for (const match of prelude.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) names.add(match[1]);
  }
  return [...names].sort();
}

// The text of every file a class can come from (D-13): .njk and .js under src/ (recursive, so
// src/js/modules/ and src/_data/ count) and .js under lib/ (icons.js writes class="icon").
function classSources() {
  const files = [...listFiles(join(repoRoot, "src"), [".njk", ".js"]), ...listFiles(join(repoRoot, "lib"), [".js"])];
  assert.ok(files.length > 0, "no .njk or .js sources found");
  return files.map((path) => readFileSync(path, "utf8"));
}

// The bundle's class names that occur as a whole word (not inside a longer hyphenated name) in none of the sources.
function unusedClasses(css, sources) {
  return selectorClasses(css).filter((name) => {
    const word = new RegExp(`(?<![\\w-])${name.replace(/[-]/g, "\\-")}(?![\\w-])`);
    return !sources.some((text) => word.test(text));
  });
}

test("no dead roster, calendar, status, countdown or form CSS ships (D-13)", () => {
  const classes = selectorClasses(cssBytes(out["css-root"]).toString("utf8"));
  assert.ok(classes.length > 0, "no class selectors found in css/style.css");
  const dead = classes.filter((name) => /^(roster|calendar|countdown|timer|status-panel|form-control|member-)/.test(name));
  assert.deepEqual(dead, [], `css/style.css still styles dead classes: ${dead.join(", ")}`);
});

test("every class selector in the bundle is used by a template or script (D-13)", () => {
  const unused = unusedClasses(cssBytes(out["css-root"]).toString("utf8"), classSources());
  assert.deepEqual(unused, [], `css/style.css styles classes no .njk or .js file uses: ${unused.join(", ")}`);
});

// The cascade order of the partials (D-12): the order of the original stylesheet's sections.
const partialOrder = ["fonts", "base", "components", "header", "hero", "sections", "gallery", "recruitment", "footer", "responsive"];

test("the entry only imports partials (D-12)", () => {
  const entry = readFileSync(join(repoRoot, "src", "css", "style.css"), "utf8");
  const lines = entry
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const names = lines.map((line) => {
    const match = /^@import "\.\/partials\/([a-z0-9-]+)\.css";$/.exec(line);
    assert.ok(match, `src/css/style.css has a line that is not a partial @import: ${line}`);
    return match[1];
  });
  const partialsDir = join(repoRoot, "src", "css", "partials");
  for (const name of names) assert.ok(existsSync(join(partialsDir, `${name}.css`)), `src/css/style.css imports a missing partial: ${name}.css`);
  assert.equal(new Set(names).size, names.length, `src/css/style.css imports a partial twice: ${names.join(", ")}`);
  const files = readdirSync(partialsDir).filter((file) => file.endsWith(".css")).map((file) => file.slice(0, -4)).sort();
  assert.deepEqual([...names].sort(), files, "every file in src/css/partials/ must be imported exactly once");
  assert.equal(names.at(-1), "responsive", "responsive.css must be the last import");
  assert.deepEqual(names, partialOrder, "the partials must be imported in the original cascade order");
});

test("the every-class-used check reports an invented class (negative control)", () => {
  const css = `${cssBytes(out["css-root"]).toString("utf8")}.zz-invented-class:hover .hud-border{color:red}`;
  assert.deepEqual(unusedClasses(css, classSources()).filter((name) => name.startsWith("zz-")), ["zz-invented-class"]);
});
