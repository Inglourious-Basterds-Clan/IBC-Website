// FOUND-03/04/06 phase-gate checks: every internal URL resolves to a file in the root
// and the /IBC-Website/ build, absolute URLs follow SITE_URL, and the site host and the
// Discord invite each live in one source file (src/_data/site.js).
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { build, read, listFiles, attrValues, repoRoot } from "./helpers.js";
import site from "../src/_data/site.js";

const prodHost = "inglourious-basterds-clan.github.io";
const localHost = "localhost:8080";
const mutatedBase = "https://mutated.example/IBC-Website/";
const allowedHosts = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "cdnjs.cloudflare.com",
  "discord.gg",
  "www.youtube.com",
  "www.facebook.com",
  "schema.org",
];
const sourceExts = [".njk", ".js", ".css", ".json", ".md", ".html"];
const inviteDomainPattern = /discord\.gg\/[A-Za-z0-9]+/g;
const absoluteUrlPattern = /https?:\/\/[^\s"'<>)\\]+/g;

const out = {};

before(() => {
  out.root = build("links-root", { INCLUDE_DEV_PAGES: "1" });
  out.prefix = build("links-prefix", { INCLUDE_DEV_PAGES: "1", PATH_PREFIX: "/IBC-Website/" });
  out.prod = build("links-prod", { SITE_URL: `https://${prodHost}`, PATH_PREFIX: "/IBC-Website/" });
  out.mutated = build("links-mutated", { SITE_URL: "https://mutated.example", PATH_PREFIX: "/IBC-Website/" });
});

const resolverVariants = [
  { name: "root", prefix: "/" },
  { name: "prefix", prefix: "/IBC-Website/" },
];

// href, src and data-src values plus the URL token of every srcset candidate.
function urlValues(html) {
  const values = [...attrValues(html, "href"), ...attrValues(html, "src"), ...attrValues(html, "data-src")];
  for (const srcset of attrValues(html, "srcset")) {
    for (const candidate of srcset.split(",")) {
      const token = candidate.trim().split(/\s+/)[0];
      if (token) values.push(token);
    }
  }
  return values;
}

function isExternalOrFragment(value) {
  return /^(#|https?:\/\/|mailto:|data:)/i.test(value);
}

// Asserts that one internal URL resolves to a file in outDir; returns nothing.
function assertResolves(outDir, prefix, file, value) {
  assert.ok(value.startsWith("/"), `${file}: relative internal URL "${value}" (must be root-relative)`);
  assert.ok(value.startsWith(prefix), `${file}: "${value}" does not start with the prefix ${prefix}`);
  let rest = value.slice(prefix.length).replace(/[#?].*$/, "");
  if (rest === "" || rest.endsWith("/")) rest += "index.html";
  const target = join(outDir, decodeURIComponent(rest));
  assert.ok(existsSync(target), `${file}: "${value}" points at a missing file (${rest})`);
}

function allFiles(dir, exts) {
  return listFiles(dir, exts).map((path) => ({ path, text: readFileSync(path, "utf8") }));
}

function sourceFiles() {
  return [
    ...allFiles(join(repoRoot, "src"), sourceExts),
    { path: join(repoRoot, "eleventy.config.js"), text: readFileSync(join(repoRoot, "eleventy.config.js"), "utf8") },
  ];
}

function rel(path) {
  return relative(repoRoot, path).replace(/\\/g, "/");
}

function ogImage(html) {
  const match = /<meta\s+property="og:image"\s+content="([^"]*)"/.exec(html);
  assert.ok(match, "og:image meta tag is missing");
  return match[1];
}

for (const variant of resolverVariants) {
  test(`(a) internal URLs resolve in the ${variant.name} build (${variant.prefix})`, () => {
    const outDir = out[variant.name];
    const htmlFiles = listFiles(outDir, [".html"]);
    assert.ok(htmlFiles.length >= 3, `expected at least 3 HTML files, found ${htmlFiles.length}`);

    let indexChecked = 0;
    for (const path of htmlFiles) {
      const file = relative(outDir, path).replace(/\\/g, "/");
      const internal = urlValues(readFileSync(path, "utf8")).filter((value) => !isExternalOrFragment(value));
      for (const value of internal) assertResolves(outDir, variant.prefix, file, value);
      if (file === "index.html") indexChecked = internal.length;
    }
    assert.ok(indexChecked >= 20, `expected at least 20 internal URLs on index.html, checked ${indexChecked}`);
  });
}

test("(b) CSS url() targets resolve from css/ in both builds", () => {
  for (const variant of resolverVariants) {
    const outDir = out[variant.name];
    const css = read(outDir, "css/style.css");
    const targets = Array.from(css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g), (match) => match[2].trim()).filter(
      (value) => !/^(https?:|data:)/i.test(value),
    );
    assert.ok(targets.length >= 1, `${variant.name}: no local url() found in css/style.css`);
    for (const value of targets) {
      const target = resolve(outDir, "css", value.replace(/[#?].*$/, ""));
      assert.ok(existsSync(target), `${variant.name}: css url(${value}) points at a missing file`);
    }
  }
});

test("(c) no machine paths or broken empty src in any variant", () => {
  for (const [name, outDir] of Object.entries(out)) {
    for (const { path, text } of allFiles(outDir, [".html"])) {
      const file = `${name}/${relative(outDir, path).replace(/\\/g, "/")}`;
      for (const needle of ['src="."', "C:/", "Program%20Files"]) {
        assert.ok(!text.includes(needle), `${file} contains ${needle}`);
      }
    }
  }
});

test("(d) absolute URLs come from SITE_URL (mutated build)", () => {
  let checked = 0;
  for (const { path, text } of allFiles(out.mutated, [".html"])) {
    const file = relative(out.mutated, path).replace(/\\/g, "/");
    for (const raw of text.match(absoluteUrlPattern) || []) {
      const url = new URL(raw);
      checked += 1;
      if (allowedHosts.includes(url.host)) continue;
      assert.ok(raw.startsWith(mutatedBase), `${file}: absolute URL ${raw} is neither SITE_URL-based nor an allowed host`);
    }
  }
  assert.ok(checked >= 5, `expected absolute URLs in the mutated build, found ${checked}`);
  assert.equal(ogImage(read(out.mutated, "index.html")), `${mutatedBase}assets/og/og-default-v1.jpg`);
  for (const { path, text } of allFiles(out.mutated, [".html", ".css", ".js"])) {
    const file = relative(out.mutated, path).replace(/\\/g, "/");
    assert.ok(!text.includes(prodHost), `${file} contains the GitHub Pages host`);
    assert.ok(!text.includes(localHost), `${file} contains ${localHost}`);
  }
});

test("(e) production values in the GitHub Pages build", () => {
  assert.equal(ogImage(read(out.prod, "index.html")), `https://${prodHost}/IBC-Website/assets/og/og-default-v1.jpg`);
  for (const { path, text } of allFiles(out.prod, [".html", ".css", ".js", ".json", ".xml", ".txt"])) {
    assert.ok(!text.includes(localHost), `${relative(out.prod, path)} contains ${localHost}`);
  }
  assert.ok(!existsSync(join(out.prod, "_dev")), "production build must not contain _dev/");
});

test("(f) host literals live in one place", () => {
  const files = sourceFiles();
  assert.ok(files.length >= 10, `expected the src/ scan to cover the templates, found ${files.length} files`);
  for (const { path, text } of files) {
    assert.ok(!text.includes(prodHost), `${rel(path)} contains the GitHub Pages host`);
    if (rel(path) !== "src/_data/site.js") {
      assert.ok(!text.includes(localHost), `${rel(path)} contains ${localHost} (only src/_data/site.js may)`);
    }
  }
  assert.ok(readFileSync(join(repoRoot, "src/_data/site.js"), "utf8").includes(localHost), "site.js lost its local default");
});

test("(g) invite defined once, in src/_data/site.js", () => {
  const matches = [];
  for (const { path, text } of sourceFiles()) {
    for (const match of text.match(inviteDomainPattern) || []) matches.push({ file: rel(path), match });
  }
  assert.equal(matches.length, 1, `expected exactly one invite literal, found: ${JSON.stringify(matches)}`);
  assert.equal(matches[0].file, "src/_data/site.js");
  const mainJs = readFileSync(join(repoRoot, "src/js/main.js"), "utf8");
  assert.equal((mainJs.match(inviteDomainPattern) || []).length, 0, "src/js/main.js holds an invite literal");
});

test("(h) every built invite equals site.discord.invite", () => {
  const expected = site.discord.invite.replace(/^https?:\/\//, "");
  for (const [name, outDir] of Object.entries(out)) {
    for (const { path, text } of allFiles(outDir, [".html", ".css", ".js"])) {
      for (const match of text.match(inviteDomainPattern) || []) {
        assert.equal(match, expected, `${name}/${relative(outDir, path)} has a different invite: ${match}`);
      }
    }
  }
  const rootIndex = read(out.root, "index.html");
  const count = (rootIndex.match(inviteDomainPattern) || []).length;
  assert.ok(count >= 3, `expected header CTA, terminal button and footer invites on index.html, found ${count}`);
});

test("(i) README matches the tree", () => {
  const readme = readFileSync(join(repoRoot, "README.md"), "utf8");
  for (const path of ["scripts/clean.js", "src/_dev/"]) {
    assert.ok(readme.includes(path), `README.md does not mention ${path}`);
    assert.ok(existsSync(join(repoRoot, path)), `${path} is mentioned in README.md but missing`);
  }
});
