// SEO-01/SEO-09 checks on real builds: absolute canonicals, the noindex guard
// (SITE_INDEXABLE=1 is the only opt-in) and SITE_URL / PATH_PREFIX validation.
// Every build name starts with "seo-" (node --test runs files in parallel).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { build, runBuild, cleanEnv, read, listFiles, block, repoRoot } from "./helpers.js";
import { readIcoEntries, readImageSize } from "../lib/image-size.js";

const noindexTag = '<meta name="robots" content="noindex">';

function count(html, needle) {
  return html.split(needle).length - 1;
}

// href of every <link rel="canonical"> inside <head>.
function canonicals(html) {
  const head = block(html, "head");
  return Array.from(head.matchAll(/<link rel="canonical" href="([^"]*)">/g), (match) => match[1]);
}

function canonical(outDir, relPath) {
  const hrefs = canonicals(read(outDir, relPath));
  assert.equal(hrefs.length, 1, `${relPath} has ${hrefs.length} canonical links`);
  return hrefs[0];
}

// [{ relPath, html }] for every HTML file of a build.
function htmlFiles(outDir) {
  return listFiles(outDir, [".html"]).map((full) => ({
    relPath: relative(outDir, full).replace(/\\/g, "/"),
    html: readFileSync(full, "utf8"),
  }));
}

function noindexCount(outDir, relPath) {
  return count(block(read(outDir, relPath), "head"), noindexTag);
}

let rootDir;
function rootBuild() {
  rootDir ??= build("seo-root", { INCLUDE_DEV_PAGES: "1" });
  return rootDir;
}

let prefixDir;
function prefixBuild() {
  prefixDir ??= build("seo-prefix", { SITE_URL: "https://guard.example", PATH_PREFIX: "/IBC-Website/" });
  return prefixDir;
}

let mutatedDir;
function mutatedBuild() {
  mutatedDir ??= build("seo-mutated", { SITE_URL: "https://mutated.example/", PATH_PREFIX: "IBC-Website" });
  return mutatedDir;
}

let indexableDir;
function indexableBuild() {
  indexableDir ??= build("seo-indexable", { SITE_URL: "https://example.org", SITE_INDEXABLE: "1", INCLUDE_DEV_PAGES: "1" });
  return indexableDir;
}

test("(a) one absolute canonical per page in root, prefix and mutated builds", () => {
  const root = rootBuild();
  assert.equal(canonical(root, "index.html"), "http://localhost:8080/");
  assert.equal(canonical(root, "_dev/layout-test/index.html"), "http://localhost:8080/_dev/layout-test/");
  for (const { relPath, html } of htmlFiles(root)) {
    assert.equal(canonicals(html).length, 1, `${relPath} must have exactly one canonical`);
  }

  assert.equal(canonical(prefixBuild(), "index.html"), "https://guard.example/IBC-Website/");

  assert.equal(canonical(mutatedBuild(), "index.html"), "https://mutated.example/IBC-Website/");
});

test("(b) noindex everywhere unless SITE_INDEXABLE=1", () => {
  for (const { relPath } of htmlFiles(rootBuild())) {
    assert.equal(noindexCount(rootDir, relPath), 1, `${relPath} must carry the noindex tag exactly once`);
  }

  const indexable = indexableBuild();
  assert.equal(noindexCount(indexable, "index.html"), 0, "indexable home must not be noindex");
  assert.equal(noindexCount(indexable, "_dev/layout-test/index.html"), 1, "dev page leaked into the index");
  assert.equal(noindexCount(indexable, "_dev/layout-empty/index.html"), 1, "dev page leaked into the index");

  const notStrict = build("seo-indexable-true", { SITE_URL: "https://example.org", SITE_INDEXABLE: "true" });
  assert.equal(noindexCount(notStrict, "index.html"), 1, 'SITE_INDEXABLE="true" must not opt in');
});

test("(c) SITE_INDEXABLE=1 refuses localhost and http", () => {
  const variants = {
    "seo-indexable-local": { SITE_INDEXABLE: "1", ALLOW_LOCAL_SITE_URL: "1" },
    "seo-indexable-http": { SITE_INDEXABLE: "1", SITE_URL: "http://example.org" },
  };
  for (const [name, env] of Object.entries(variants)) {
    const { result } = runBuild(name, env);
    assert.notEqual(result.status, 0, `${name} built although it is indexable on a non-https or local URL`);
    assert.ok(result.stderr.includes("needs a real https SITE_URL"), `${name}: guard message missing:\n${result.stderr}`);
  }
});

test("(c2) SITE_INDEXABLE=1 refuses a non-root PATH_PREFIX (WR-02)", () => {
  const { result } = runBuild("seo-indexable-prefix", { SITE_INDEXABLE: "1", SITE_URL: "https://example.org", PATH_PREFIX: "/foo/" });
  assert.notEqual(result.status, 0, "an indexable build under /foo/ was accepted; crawlers never read /foo/robots.txt");
  assert.ok(result.stderr.includes("SITE_INDEXABLE=1 needs PATH_PREFIX=/"), `guard message missing:\n${result.stderr}`);
});

test("(d) malformed SITE_URL or PATH_PREFIX fails the build", () => {
  const badUrls = ["ibc.example", "https://example.org/sub", "https://example.org/?x=1"];
  badUrls.forEach((siteUrl, index) => {
    const { result } = runBuild(`seo-bad-url-${index}`, { SITE_URL: siteUrl });
    assert.notEqual(result.status, 0, `SITE_URL "${siteUrl}" was accepted`);
    assert.ok(result.stderr.includes("is not an origin"), `SITE_URL "${siteUrl}": message missing:\n${result.stderr}`);
  });

  const { result } = runBuild("seo-bad-prefix", {
    SITE_URL: "https://example.org",
    PATH_PREFIX: "C:/Program Files/Git/IBC-Website/",
  });
  assert.notEqual(result.status, 0, "a Git Bash-rewritten PATH_PREFIX was accepted");
  assert.ok(result.stderr.includes("PATH_PREFIX"), `PATH_PREFIX message missing:\n${result.stderr}`);
});

test("(e) build helpers never inherit SITE_INDEXABLE", () => {
  const saved = process.env.SITE_INDEXABLE;
  process.env.SITE_INDEXABLE = "1";
  try {
    const keys = Object.keys(cleanEnv({})).map((key) => key.toUpperCase());
    assert.ok(!keys.includes("SITE_INDEXABLE"), "cleanEnv kept SITE_INDEXABLE");
    const out = build("seo-inherited");
    assert.equal(noindexCount(out, "index.html"), 1, "an inherited SITE_INDEXABLE made the test build indexable");
  } finally {
    if (saved === undefined) delete process.env.SITE_INDEXABLE;
    else process.env.SITE_INDEXABLE = saved;
  }
});

function sitemapLocs(outDir) {
  return Array.from(read(outDir, "sitemap.xml").matchAll(/<loc>([^<]*)<\/loc>/g), (match) => match[1]);
}

test("(f) sitemap lists exactly the indexable pages, sorted", () => {
  const rootLocs = sitemapLocs(rootBuild());
  assert.deepEqual(rootLocs, ["http://localhost:8080/"]);
  assert.deepEqual(sitemapLocs(prefixBuild()), ["https://guard.example/IBC-Website/"]);
  for (const locs of [rootLocs, sitemapLocs(indexableBuild())]) {
    assert.deepEqual(locs, [...locs].sort(), "sitemap <loc> entries are not sorted");
    for (const loc of locs) {
      assert.ok(!loc.includes("_dev") && !loc.includes("404"), `non-indexable page in sitemap: ${loc}`);
    }
  }
  assert.ok(read(rootDir, "sitemap.xml").startsWith("<?xml"), "sitemap.xml must start with the XML declaration");
});

test("(g) robots.txt never disallows and names the sitemap only when indexable", () => {
  const rootRobots = read(rootBuild(), "robots.txt");
  assert.ok(rootRobots.startsWith("User-agent: *"), `robots.txt must start with User-agent:\n${rootRobots}`);
  assert.ok(!/^\s*Disallow/im.test(rootRobots), "robots.txt must never contain a Disallow line");
  assert.ok(!/^\s*Sitemap:/im.test(rootRobots), "preview robots.txt must not name a sitemap");

  const indexableRobots = read(indexableBuild(), "robots.txt");
  assert.ok(indexableRobots.includes("Sitemap: https://example.org/sitemap.xml"), indexableRobots);
  assert.ok(!/^\s*Disallow/im.test(indexableRobots), "robots.txt must never contain a Disallow line");
});

const homeTitle = "Klan Arma 3 Milsim – Inglourious Basterds Clan (IBC)";

// The `description` value from the front matter of src/index.njk (the user edits the draft,
// so the test reads it instead of pinning the sentence).
function homeDescriptionSource() {
  const source = readFileSync(join(repoRoot, "src", "index.njk"), "utf8");
  const line = source.split(/\r?\n/).find((text) => text.startsWith("description:"));
  assert.ok(line, "src/index.njk has no description: front matter line");
  return line.slice("description:".length).trim().replace(/^"(.*)"$/, "$1");
}

// content of every <meta name="description"> in <head>.
function descriptions(html) {
  const head = block(html, "head");
  return Array.from(head.matchAll(/<meta\s[^>]*name="description"[^>]*>/g), (match) => {
    const content = /\scontent="([^"]*)"/.exec(match[0]);
    return content ? content[1] : null;
  });
}

test("(h) home title and description (D-01, D-03, D-04)", () => {
  const html = read(rootBuild(), "index.html");
  assert.ok(html.includes(`<title>${homeTitle}</title>`), "home <title> is not the D-01 title");
  assert.equal(count(block(html, "head"), "<title>"), 1, "home must have exactly one <title>");

  const expected = homeDescriptionSource();
  assert.deepEqual(descriptions(html), [expected], "home must carry exactly the front-matter description");
  const length = [...expected].length;
  assert.ok(length >= 70 && length <= 160, `home description is ${length} characters, expected 70-160`);
});

test("(i) subpage titles get the | IBC suffix and no empty tags (D-02, D-04)", () => {
  const root = rootBuild();
  const layoutTest = read(root, "_dev/layout-test/index.html");
  const layoutEmpty = read(root, "_dev/layout-empty/index.html");
  assert.ok(layoutTest.includes("<title>Test layoutu | IBC</title>"), "layout-test title lacks the | IBC suffix");
  assert.ok(layoutEmpty.includes("<title>Inglourious Basterds Clan | IBC</title>"), "layout-empty title is not the site-name fallback");
  for (const [name, html] of [["layout-test", layoutTest], ["layout-empty", layoutEmpty]]) {
    assert.ok(!html.includes('name="description"'), `${name} must not carry a description (no fallback, D-04)`);
  }
  for (const { relPath, html } of htmlFiles(root)) {
    assert.ok(!html.includes('content=""'), `${relPath} has an empty content attribute`);
    assert.ok(!/<title>\s*<\/title>/.test(html), `${relPath} has an empty <title>`);
  }
});

test("(j) no page carries meta keywords (D-14)", () => {
  for (const dir of [rootBuild(), prefixBuild()]) {
    for (const { relPath, html } of htmlFiles(dir)) {
      assert.ok(!html.includes('name="keywords"'), `${relPath} carries meta keywords`);
    }
  }
});

// content of every <meta {attr}="{key}"> in <head> (attr is "property" or "name").
function metas(html, attr, key) {
  const head = block(html, "head");
  const pattern = new RegExp(`<meta\\s[^>]*${attr}="${key.replace(/[.:]/g, "\\$&")}"[^>]*>`, "g");
  return Array.from(head.matchAll(pattern), (match) => {
    const content = /\scontent="([^"]*)"/.exec(match[0]);
    return content ? content[1] : null;
  });
}

// The single value of a meta tag, failing when it is missing or repeated.
function meta(html, attr, key) {
  const values = metas(html, attr, key);
  assert.equal(values.length, 1, `expected exactly one <meta ${attr}="${key}">, found ${values.length}`);
  return values[0];
}

const prefixOgImage = "https://guard.example/IBC-Website/assets/og/og-default-v1.jpg";

test("(k) Open Graph and Twitter tags (D-07)", () => {
  const home = read(prefixBuild(), "index.html");
  assert.equal(meta(home, "property", "og:image"), prefixOgImage);
  assert.equal(meta(home, "name", "twitter:image"), prefixOgImage);
  assert.equal(meta(home, "property", "og:url"), canonical(prefixDir, "index.html"));
  const titleText = /<title>([^<]*)<\/title>/.exec(block(home, "head"))[1];
  assert.equal(meta(home, "property", "og:title"), titleText);
  assert.equal(meta(home, "name", "twitter:title"), titleText);
  assert.deepEqual(descriptions(home), [meta(home, "property", "og:description")]);
  assert.equal(meta(home, "name", "twitter:description"), meta(home, "property", "og:description"));
  assert.equal(meta(home, "property", "og:locale"), "pl_PL");
  assert.equal(meta(home, "property", "og:type"), "website");
  assert.equal(meta(home, "property", "og:site_name"), "Inglourious Basterds Clan");
  assert.equal(meta(home, "property", "og:image:width"), "1200");
  assert.equal(meta(home, "property", "og:image:height"), "630");
  assert.ok(meta(home, "property", "og:image:alt").length > 0, "og:image:alt is empty");
  assert.equal(meta(home, "name", "twitter:card"), "summary_large_image");

  const mutated = read(mutatedBuild(), "index.html");
  assert.ok(meta(mutated, "property", "og:image").startsWith("https://mutated.example/IBC-Website/"), "og:image ignores SITE_URL");

  // SEO-03 empty edge: no description means no og:/twitter:description tag at all.
  const layoutTest = read(rootBuild(), "_dev/layout-test/index.html");
  assert.equal(meta(layoutTest, "property", "og:image"), "http://localhost:8080/assets/og/og-default-v1.jpg");
  assert.equal(meta(layoutTest, "name", "twitter:image"), "http://localhost:8080/assets/og/og-default-v1.jpg");
  assert.equal(metas(layoutTest, "property", "og:description").length, 0, "layout-test carries og:description");
  assert.equal(metas(layoutTest, "name", "twitter:description").length, 0, "layout-test carries twitter:description");

  for (const dir of [rootDir, prefixDir]) {
    for (const { relPath, html } of htmlFiles(dir)) {
      assert.equal(metas(html, "property", "og:image").length, 1, `${relPath} must have exactly one og:image`);
      assert.equal(metas(html, "name", "twitter:image").length, 1, `${relPath} must have exactly one twitter:image`);
      assert.equal(meta(html, "name", "twitter:image"), meta(html, "property", "og:image"), `${relPath}: twitter:image differs`);
      assert.equal(meta(html, "property", "og:url"), canonicals(html)[0], `${relPath}: og:url differs from the canonical`);
    }
  }

  const size = readImageSize(readFileSync(join(prefixDir, "assets", "og", "og-default-v1.jpg")));
  assert.deepEqual(size && [size.format, size.width, size.height], ["jpeg", 1200, 630]);
});

// A scalar value from the front matter of a src/ template (quotes stripped).
function frontMatterValue(relPath, key) {
  const source = readFileSync(join(repoRoot, relPath), "utf8");
  const line = source.split(/\r?\n/).find((text) => text.startsWith(`${key}:`));
  assert.ok(line, `${relPath} has no ${key}: front matter line`);
  return line.slice(key.length + 1).trim().replace(/^"(.*)"$/, "$1");
}

test("(l) ogImage front matter overrides the default (D-07)", () => {
  const root = rootBuild();
  const override = read(root, "_dev/og-override/index.html");
  const heroUrl = "http://localhost:8080/assets/hero-bg.jpg";
  // SEO-03 precedence edge: the override wins and the default is not emitted as a second tag.
  assert.deepEqual(metas(override, "property", "og:image"), [heroUrl]);
  assert.deepEqual(metas(override, "name", "twitter:image"), [heroUrl]);
  assert.ok(!override.includes("og-default-v1.jpg"), "override page still mentions the default card");

  const hero = readImageSize(readFileSync(join(root, "assets", "hero-bg.jpg")));
  assert.ok(hero, "assets/hero-bg.jpg header not recognised");
  assert.equal(meta(override, "property", "og:image:width"), String(hero.width));
  assert.equal(meta(override, "property", "og:image:height"), String(hero.height));
  const alt = frontMatterValue("src/_dev/og-override.njk", "ogImageAlt");
  assert.equal(meta(override, "property", "og:image:alt"), alt);
  assert.equal(meta(override, "name", "twitter:image:alt"), alt);

  const layoutTest = read(root, "_dev/layout-test/index.html");
  assert.equal(meta(layoutTest, "property", "og:image"), "http://localhost:8080/assets/og/og-default-v1.jpg");
  assert.equal(meta(layoutTest, "property", "og:image:width"), "1200");
});

// The icon and manifest tags every page must carry (D-08, D-09), hrefs without the prefix.
const iconTags = [
  (prefix) => `<link rel="icon" href="${prefix}favicon.ico" sizes="32x32">`,
  (prefix) => `<link rel="icon" href="${prefix}assets/icons/icon-192.png" type="image/png" sizes="192x192">`,
  (prefix) => `<link rel="apple-touch-icon" href="${prefix}assets/icons/apple-touch-icon.png">`,
  (prefix) => `<link rel="manifest" href="${prefix}site.webmanifest">`,
];

test("(m) favicons, manifest and theme-color (D-08, D-09)", () => {
  for (const [dir, prefix] of [[rootBuild(), "/"], [prefixBuild(), "/IBC-Website/"]]) {
    const entries = readIcoEntries(readFileSync(join(dir, "favicon.ico")));
    assert.ok(entries, `${dir}: favicon.ico missing or unreadable at the output root`);
    assert.equal(entries.length, 3, "favicon.ico must hold 3 images");

    for (const { relPath, html } of htmlFiles(dir)) {
      const head = block(html, "head");
      for (const tag of iconTags) {
        assert.equal(count(head, tag(prefix)), 1, `${relPath} lacks ${tag(prefix)}`);
      }
      assert.equal(count(head, '<meta name="theme-color" content="#080e11">'), 1, `${relPath} lacks theme-color`);
    }

    const manifest = JSON.parse(read(dir, "site.webmanifest"));
    assert.equal(manifest.name, "Inglourious Basterds Clan");
    assert.equal(manifest.short_name, "IBC");
    assert.equal(manifest.lang, "pl");
    assert.equal(manifest.display, "browser");
    assert.equal(manifest.background_color, "#080e11");
    assert.equal(manifest.theme_color, "#080e11");
    assert.equal(manifest.start_url, prefix);
    assert.equal(manifest.scope, prefix);
    assert.equal(manifest.icons.length, 2);
    for (const icon of manifest.icons) {
      assert.ok(icon.src.startsWith(prefix), `manifest icon ${icon.src} lacks the prefix ${prefix}`);
      assert.equal(icon.type, "image/png");
      const size = readImageSize(readFileSync(join(dir, icon.src.slice(prefix.length))));
      assert.ok(size, `manifest icon ${icon.src} is missing or unreadable`);
      assert.equal(`${size.width}x${size.height}`, icon.sizes, `${icon.src} is not ${icon.sizes}`);
    }
    assert.ok(!read(dir, "sitemap.xml").includes("webmanifest"), "site.webmanifest is listed in sitemap.xml");
  }
});
