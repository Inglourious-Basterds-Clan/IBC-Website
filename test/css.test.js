// PERF-06 / D-12 / D-13 stylesheet checks on a root, an /IBC-Website/ and a dev-page build:
// every page links exactly one stylesheet, /css/style.css?v=<hash>, whose hash matches the
// shipped bytes; the Lightning CSS bundle is minified and keeps the Safari prefixes (Pitfall 2);
// root and prefix builds ship the same bytes (PERF-06 concurrency edge); only the bundle ships
// from src/css; no page or template carries an inline style. 03-10 adds the partial and dead-CSS checks.
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
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
