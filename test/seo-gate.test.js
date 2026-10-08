// SEO-08 gate checks: the gate (rules in lib/check-seo.js, CLI scripts/check-seo.js) passes real builds and fails broken output.
// Real builds go to _test/seo-gate-*; hand-written fixture folders go to
// _test/seo-gate-fixtures/<name>/, one per problem, each a valid site with one thing broken.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmdirSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { build, cleanEnv, repoRoot } from "./helpers.js";
import { checkSite } from "../lib/check-seo.js";
import { isIndexableUrl } from "../lib/seo.js";

const fixtureSite = { url: "https://fixture.example", pathPrefix: "/", indexable: false };
const indexableSite = { ...fixtureSite, indexable: true };
const fixtureBase = fixtureSite.url + fixtureSite.pathPrefix;
const noindexTag = '<meta name="robots" content="noindex">';

// Write { relPath: content } into a fresh _test/seo-gate-fixtures/<name>/ and return the folder.
// A null content leaves that file out.
function writeFixture(name, files) {
  const dir = join(repoRoot, "_test", "seo-gate-fixtures", name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const [relPath, content] of Object.entries(files)) {
    if (content === null) continue;
    const full = join(dir, relPath);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

// Header-only PNG (signature + IHDR) declaring width x height: enough for readImageSize.
function pngHeader(width, height) {
  const buffer = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer, 0);
  buffer.writeUInt32BE(13, 8);
  buffer.write("IHDR", 12, "latin1");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  buffer[24] = 8; // bit depth
  buffer[25] = 2; // colour type: RGB
  return buffer;
}

const fixtureOgImage = "assets/og.png";

// OG/Twitter lines for validPage (G3). og overrides one value; null leaves that tag out.
// Defaults: og:url = the canonical, og:image = base + fixtureOgImage declared 1200x630,
// twitter:image = og:image, twitter:card = summary_large_image.
function shareLines(base, href, og = {}) {
  const image = og.image === undefined ? base + fixtureOgImage : og.image;
  const values = {
    url: og.url === undefined ? href : og.url,
    image,
    width: og.width === undefined ? "1200" : og.width,
    height: og.height === undefined ? "630" : og.height,
    card: og.card === undefined ? "summary_large_image" : og.card,
    twitterImage: og.twitterImage === undefined ? image : og.twitterImage,
  };
  const tags = [
    ["property", "og:url", values.url],
    ["property", "og:image", values.image],
    ["property", "og:image:width", values.width],
    ["property", "og:image:height", values.height],
    ["name", "twitter:card", values.card],
    ["name", "twitter:image", values.twitterImage],
  ];
  return tags.filter(([, , value]) => value !== null).map(([attr, key, value]) => `<meta ${attr}="${key}" content="${value}">`);
}

// The smallest home graph G5 accepts: an Organization and a WebSite node in one @graph.
// extraNodes are appended to the @graph; drop removes the node of that @type.
function homeGraph(base, { extraNodes = [], drop } = {}) {
  const nodes = [
    { "@type": "Organization", "@id": `${base}#organization`, name: "Fixture Clan", url: base },
    { "@type": "WebSite", "@id": `${base}#website`, name: "Fixture Clan", url: base, publisher: { "@id": `${base}#organization` } },
    ...extraNodes,
  ].filter((node) => node["@type"] !== drop);
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });
}

// A minimal page that passes every gate rule implemented so far. url is the page.url ("/", "/o-nas/").
// head replaces the default head lines; noindex defaults to true (a preview page).
// title defaults to a title unique per url; description defaults to a non-empty one on
// indexable urls and none elsewhere (D-04). null leaves the tag out. og overrides the
// share tags (shareLines). jsonLd is the text of one ld+json script, added after the head
// lines; it defaults to homeGraph on the home page and none elsewhere (G5); null leaves it out.
function validPage(base, url, { canonical, noindex = true, head, title, description, og, jsonLd } = {}) {
  const href = canonical === undefined ? base + url.slice(1) : canonical;
  const pageTitle = title === undefined ? `Fixture ${url}` : title;
  const pageDescription = description === undefined ? (isIndexableUrl(url) ? `Opis strony ${url}` : null) : description;
  const pageJsonLd = jsonLd === undefined ? (url === "/" ? homeGraph(base) : null) : jsonLd;
  const lines = [
    ...(head ?? [
      ...(pageTitle === null ? [] : [`<title>${pageTitle}</title>`]),
      `<link rel="canonical" href="${href}">`,
      ...(noindex ? [noindexTag] : []),
      ...(pageDescription === null ? [] : [`<meta name="description" content="${pageDescription}">`]),
      ...shareLines(base, href, og),
    ]),
    ...(pageJsonLd === null ? [] : [`<script type="application/ld+json">${pageJsonLd}</script>`]),
  ];
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  ${lines.join("\n  ")}
</head>
<body><h1>Fixture</h1></body>
</html>
`;
}

function validSitemap(base, urls) {
  const entries = urls.map((url) => `  <url><loc>${base + url.slice(1)}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function validRobots(base, indexable) {
  return `User-agent: *\nAllow: /\n${indexable ? `Sitemap: ${base}sitemap.xml\n` : ""}`;
}

// A complete valid preview (or indexable) fixture site with a home and an /about/ page.
function validFiles(indexable = false) {
  return {
    "index.html": validPage(fixtureBase, "/", { noindex: !indexable }),
    "about/index.html": validPage(fixtureBase, "/about/", { noindex: !indexable }),
    "404.html": validPage(fixtureBase, "/404.html"),
    "sitemap.xml": validSitemap(fixtureBase, ["/", "/about/"]),
    "robots.txt": validRobots(fixtureBase, indexable),
    [fixtureOgImage]: pngHeader(1200, 630),
  };
}

// checkSite on a valid fixture with overrides; returns the problems.
function check(name, overrides, siteConfig = fixtureSite) {
  const dir = writeFixture(name, { ...validFiles(siteConfig.indexable), ...overrides });
  return checkSite(dir, siteConfig);
}

function assertProblem(problems, prefix) {
  assert.ok(
    problems.some((problem) => problem.startsWith(prefix)),
    `expected a problem starting with "${prefix}", got:\n${problems.join("\n") || "(none)"}`,
  );
}

function runGate(dir, env = {}) {
  return spawnSync(process.execPath, ["scripts/check-seo.js", "--dir", dir], {
    cwd: repoRoot,
    env: cleanEnv(env),
    encoding: "utf8",
  });
}

const prefixEnv = { SITE_URL: "https://guard.example", PATH_PREFIX: "/IBC-Website/" };

let prefixDir;
function prefixBuild() {
  prefixDir ??= build("seo-gate-prefix", prefixEnv);
  return prefixDir;
}

let indexableDir;
function indexableBuild() {
  indexableDir ??= build("seo-gate-indexable", { SITE_URL: "https://example.org", SITE_INDEXABLE: "1" });
  return indexableDir;
}

test("real prefix build passes the gate", () => {
  assert.deepEqual(checkSite(prefixBuild(), { url: "https://guard.example", pathPrefix: "/IBC-Website/" }), []);
});

// IDs of the FACTS.md rows still waiting for the clan's confirmation.
function openFactIds() {
  const facts = readFileSync(join(repoRoot, "FACTS.md"), "utf8");
  return Array.from(facts.matchAll(/^\|\s*(FACTS-\d+)\s*\|.*\|\s*do potwierdzenia\s*\|\s*$/gm), (match) => match[1]);
}

// G10 problems name the marker; returns the problem's FACTS-NN id or null.
function g10FactId(problem) {
  const match = /: G10 unconfirmed draft marker TODO\((FACTS-\d+)\)/.exec(problem);
  return match ? match[1] : null;
}

// Research Pitfall 3: never pin a draft ID. The real indexable build may only fail on G10
// markers that are open FACTS.md rows, so this stays green once the user confirms a draft.
function assertOnlyOpenDrafts(problems) {
  const open = openFactIds();
  for (const problem of problems) {
    const id = g10FactId(problem);
    assert.ok(id !== null, `indexable build has a non-G10 problem or an untracked TODO:\n${problem}`);
    assert.ok(open.includes(id), `${id} is not an open (do potwierdzenia) row in FACTS.md:\n${problem}`);
  }
}

test("real indexable build fails the gate only on open FACTS.md drafts", () => {
  assertOnlyOpenDrafts(checkSite(indexableBuild(), { url: "https://example.org", pathPrefix: "/", indexable: true }));
});

test("valid preview and indexable fixtures pass the gate", () => {
  assert.deepEqual(check("valid-preview", {}), []);
  assert.deepEqual(check("valid-indexable", {}, indexableSite), []);
});

test("CLI exits 0 on a real build and 1 on a broken one", () => {
  build("seo-gate-cli", prefixEnv);
  const ok = runGate("_test/seo-gate-cli", prefixEnv);
  assert.equal(ok.status, 0, `gate failed on a real build:\n${ok.stderr}`);
  assert.match(ok.stdout, /check-seo: OK/);
  assert.ok(existsSync(join(repoRoot, "_test", "seo-gate-cli", "index.html")), "a passing gate must leave the output in place");

  writeFixture("cli-broken", {
    ...validFiles(),
    "index.html": validPage(fixtureBase, "/", { canonical: "/" }),
  });
  const broken = runGate("_test/seo-gate-fixtures/cli-broken", { SITE_URL: fixtureSite.url });
  assert.equal(broken.status, 1, "gate accepted a relative canonical");
  assert.match(broken.stderr, /check-seo: index\.html: G2/);
  assert.match(broken.stderr, /must not be deployed/);
});

// CR-02: the IIS cutover is a manual copy of _site/, so a rejected build must leave nothing
// deployable. The typical case: an indexable build that fails only on G10 draft markers.
test("CLI moves a rejected build aside so no deployable index.html is left", () => {
  const dir = writeFixture("cli-rejected", todoFiles(true));
  const rejected = `${dir}.rejected`;
  const indexableEnv = { SITE_URL: fixtureSite.url, SITE_INDEXABLE: "1" };
  // Twice: the second run must replace the .rejected folder the first one left.
  for (let run = 1; run <= 2; run += 1) {
    if (run === 2) writeFixture("cli-rejected", todoFiles(true));
    const result = runGate("_test/seo-gate-fixtures/cli-rejected", indexableEnv);
    assert.equal(result.status, 1, `run ${run}: gate accepted TODO markers on an indexable build:\n${result.stdout}`);
    assert.match(result.stderr, /: G10 /);
    assert.match(result.stderr, /must not be deployed; moved to _test\/seo-gate-fixtures\/cli-rejected\.rejected/);
    assert.ok(!existsSync(join(dir, "index.html")), `run ${run}: rejected output still has a deployable index.html`);
    assert.ok(!existsSync(dir), `run ${run}: the rejected output folder is still in place`);
    assert.ok(existsSync(join(rejected, "index.html")), `run ${run}: the rejected output was not kept in ${rejected}`);
  }
});

// CR-01: `npm run build` started from a symlinked or junctioned folder (a junctioned
// Documents/OneDrive folder, a symlinked workspace) must still run every rule and fail.
// Skipped where this machine cannot create a link.
test("CLI still runs and fails when started through a junction or symlink path", (t) => {
  const linkParent = mkdtempSync(join(tmpdir(), "ibc-gate-link-"));
  const link = join(linkParent, "repo");
  try {
    symlinkSync(repoRoot, link, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    rmdirSync(linkParent);
    t.skip(`cannot create a junction or symlink here: ${error.code || error.message}`);
    return;
  }
  try {
    writeFixture("cli-broken-link", {
      ...validFiles(),
      "index.html": validPage(fixtureBase, "/", { canonical: "/" }),
    });
    // Same command line as the build script, with the cwd inside the link.
    const result = spawnSync(process.execPath, ["scripts/check-seo.js", "--dir", "_test/seo-gate-fixtures/cli-broken-link"], {
      cwd: link,
      env: cleanEnv({ SITE_URL: fixtureSite.url }),
      encoding: "utf8",
    });
    assert.equal(result.status, 1, `gate run through ${link} did not fail:\n${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /check-seo: index\.html: G2/);
  } finally {
    unlinkSync(link); // removes the link only, never the repository it points at
    rmdirSync(linkParent);
  }
});

test("CLI exits 1 when the build folder does not exist", () => {
  const result = runGate("_test/seo-gate-does-not-exist", prefixEnv);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /does not exist \(run eleventy first\)/);
});

test("CLI exits 1 with its own message when --dir is a file (IN-06)", () => {
  writeFixture("cli-dir-is-file", { "robots.txt": "User-agent: *\n" });
  const result = runGate("_test/seo-gate-fixtures/cli-dir-is-file/robots.txt", prefixEnv);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /check-seo: _test\/seo-gate-fixtures\/cli-dir-is-file\/robots\.txt is not a folder/);
  assert.ok(!/\n\s+at /.test(result.stderr), `gate printed a stack trace:\n${result.stderr}`);
});

test("CLI banner names the build kind", () => {
  prefixBuild();
  const preview = runGate("_test/seo-gate-prefix", prefixEnv);
  assert.equal(preview.status, 0, preview.stderr);
  assert.match(preview.stdout, /check-seo: preview build \(noindex on every page\) for https:\/\/guard\.example\/IBC-Website\//);

  build("seo-gate-local");
  const local = runGate("_test/seo-gate-local", { ALLOW_LOCAL_SITE_URL: "1" });
  assert.equal(local.status, 0, local.stderr);
  assert.match(local.stdout, /check-seo: LOCAL build \(http:\/\/localhost:8080\), never deploy this output/);

  indexableBuild();
  const indexable = runGate("_test/seo-gate-indexable", { SITE_URL: "https://example.org", SITE_INDEXABLE: "1" });
  assert.match(indexable.stdout, /check-seo: INDEXABLE build for https:\/\/example\.org\//);
  // While drafts are open the indexable gate exits 1 on their G10 markers only (D-19).
  const problems = indexable.stderr
    .split(/\r?\n/)
    .filter((line) => line.startsWith("check-seo: ") && !line.includes("must not be deployed"))
    .map((line) => line.slice("check-seo: ".length));
  assert.equal(indexable.status, problems.length === 0 ? 0 : 1, indexable.stderr);
  assertOnlyOpenDrafts(problems);
});

test("G0 empty output folder", () => {
  const dir = writeFixture("g0-empty", {});
  assert.deepEqual(checkSite(dir, fixtureSite), [".: G0 no HTML pages in the build output"]);
});

test("G2 relative canonical", () => {
  assertProblem(check("g2-relative", { "index.html": validPage(fixtureBase, "/", { canonical: "/" }) }), "index.html: G2");
});

test("G2 missing canonical", () => {
  const page = validPage(fixtureBase, "/about/", { head: [noindexTag] });
  assertProblem(check("g2-missing", { "about/index.html": page }), "about/index.html: G2 missing");
});

test("G2 two canonicals", () => {
  const href = fixtureBase + "about/";
  const page = validPage(fixtureBase, "/about/", {
    head: [`<link rel="canonical" href="${href}">`, `<link rel="canonical" href="${href}">`, noindexTag],
  });
  assertProblem(check("g2-two", { "about/index.html": page }), "about/index.html: G2 2 canonical links");
});

test("G2 canonical on a foreign host", () => {
  const page = validPage(fixtureBase, "/", { canonical: "https://evil.example/" });
  assertProblem(check("g2-foreign", { "index.html": page }), 'index.html: G2 canonical is "https://evil.example/"');
});

test("G7 page missing from sitemap", () => {
  const problems = check("g7-missing-page", { "sitemap.xml": validSitemap(fixtureBase, ["/"]) });
  assertProblem(problems, "about/index.html: G7");
  assert.ok(!problems.some((problem) => problem.startsWith("index.html: G7")), problems.join("\n"));
});

test("G7 missing sitemap.xml", () => {
  assertProblem(check("g7-no-sitemap", { "sitemap.xml": null }), "sitemap.xml: G7 missing");
});

test("G7 empty urlset while index.html exists", () => {
  assertProblem(check("g7-empty-urlset", { "sitemap.xml": validSitemap(fixtureBase, []) }), "index.html: G7");
});

test("G7 duplicate <loc> (SEO-02 adjacency edge)", () => {
  const sitemap = validSitemap(fixtureBase, ["/", "/about/", "/about/"]);
  assertProblem(check("g7-duplicate", { "sitemap.xml": sitemap }), `sitemap.xml: G7 duplicate <loc> ${fixtureBase}about/`);
});

test("G7 <loc> pointing at a missing file", () => {
  const sitemap = validSitemap(fixtureBase, ["/", "/about/", "/gone/"]);
  assertProblem(check("g7-gone", { "sitemap.xml": sitemap }), `sitemap.xml: G7 <loc> ${fixtureBase}gone/ points at`);
});

test("G7 <loc> pointing at a non-indexable page", () => {
  const sitemap = validSitemap(fixtureBase, ["/", "/about/", "/404.html"]);
  assertProblem(check("g7-404", { "sitemap.xml": sitemap }), `sitemap.xml: G7 <loc> ${fixtureBase}404.html points at`);
});

test("isIndexableUrl accepts HTML pages only (WR-03)", () => {
  for (const url of ["/", "/o-nas/", "/strona.html"]) assert.equal(isIndexableUrl(url), true, url);
  for (const url of ["/feed.xml", "/search.json", "/robots.txt", "/site.webmanifest", "/404.html", "/_dev/og/", ""]) {
    assert.equal(isIndexableUrl(url), false, url);
  }
});

test("G7 <loc> pointing at a non-HTML output (WR-03)", () => {
  const sitemap = validSitemap(fixtureBase, ["/", "/about/", "/feed.xml"]);
  const problems = check("g7-feed", { "sitemap.xml": sitemap, "feed.xml": '<?xml version="1.0"?><feed/>\n' });
  assertProblem(problems, `sitemap.xml: G7 <loc> ${fixtureBase}feed.xml points at`);
});

test("G7 <loc> outside the base", () => {
  const sitemap = validSitemap(fixtureBase, ["/", "/about/"]).replace("</urlset>", "  <url><loc>https://evil.example/</loc></url>\n</urlset>");
  assertProblem(check("g7-foreign", { "sitemap.xml": sitemap }), "sitemap.xml: G7 <loc> https://evil.example/ is not under");
});

// IN-04: a <loc> with backslash ".." segments must not reach a page outside the build folder.
// On Windows path.join reads "\" as a separator, so this <loc> resolves to a real indexable
// page in a sibling folder; the gate must still report it.
test("G7 <loc> with backslash .. segments escaping the build folder (IN-04)", () => {
  writeFixture("g7-traversal-outside", { "index.html": validPage(fixtureBase, "/") });
  const loc = `${fixtureBase}about\\..\\..\\g7-traversal-outside\\index.html`;
  const sitemap = validSitemap(fixtureBase, ["/", "/about/"]).replace("</urlset>", `  <url><loc>${loc}</loc></url>\n</urlset>`);
  assertProblem(check("g7-traversal", { "sitemap.xml": sitemap }), `sitemap.xml: G7 <loc> ${loc} points at`);
});

test("G8 missing robots.txt", () => {
  assertProblem(check("g8-missing", { "robots.txt": null }), "robots.txt: G8 missing");
});

test("G8 Disallow: / line", () => {
  assertProblem(check("g8-disallow", { "robots.txt": "User-agent: *\nDisallow: /\n" }), "robots.txt: G8");
});

test("G8 other spellings that block the whole site (WR-05)", () => {
  const spellings = ["Disallow:/", "Disallow: /*", "Disallow:  /", "disallow : /", "Disallow: / # preview"];
  spellings.forEach((line, index) => {
    const problems = check(`g8-disallow-${index}`, { "robots.txt": `User-agent: *\n${line}\n` });
    assertProblem(problems, 'robots.txt: G8 "Disallow: /" hides the noindex');
  });
  // A rule for one folder does not block the site.
  assert.deepEqual(check("g8-disallow-folder", { "robots.txt": "User-agent: *\nDisallow: /_dev/\n" }), []);
});

test("G8 indexable site without the Sitemap line", () => {
  const problems = check("g8-no-sitemap-line", { "robots.txt": validRobots(fixtureBase, false) }, indexableSite);
  assertProblem(problems, "robots.txt: G8 missing \"Sitemap:");
});

test("G9 preview page without noindex", () => {
  const page = validPage(fixtureBase, "/about/", { noindex: false });
  assertProblem(check("g9-preview", { "about/index.html": page }), "about/index.html: G9");
});

test("G9 indexable home with noindex", () => {
  const page = validPage(fixtureBase, "/", { noindex: true });
  assertProblem(check("g9-indexable-home", { "index.html": page }, indexableSite), "index.html: G9 indexable page carries robots noindex");
});

test("G9 indexable build whose 404.html lacks noindex", () => {
  const page = validPage(fixtureBase, "/404.html", { noindex: false });
  assertProblem(check("g9-404", { "404.html": page }, indexableSite), "404.html: G9 non-indexable page is missing robots noindex");
});

test("G1 empty <title> (SEO-01 empty edge)", () => {
  const page = validPage(fixtureBase, "/about/", { title: "  " });
  assertProblem(check("g1-empty", { "about/index.html": page }), "about/index.html: G1 empty <title>");
});

test("G1 missing <title>", () => {
  const page = validPage(fixtureBase, "/about/", { title: null });
  assertProblem(check("g1-missing", { "about/index.html": page }), "about/index.html: G1 missing <title>");
});

test("G1 two <title> tags", () => {
  const href = fixtureBase + "about/";
  const page = validPage(fixtureBase, "/about/", {
    head: ["<title>Jeden</title>", "<title>Dwa</title>", `<link rel="canonical" href="${href}">`, noindexTag, '<meta name="description" content="Opis">'],
  });
  assertProblem(check("g1-two", { "about/index.html": page }), "about/index.html: G1 2 <title> tags");
});

test("G1 two indexable pages share a title, naming both files (SEO-01 adjacency edge)", () => {
  const problems = check("g1-duplicate", {
    "index.html": validPage(fixtureBase, "/", { title: "Ten sam tytuł" }),
    "about/index.html": validPage(fixtureBase, "/about/", { title: "Ten sam tytuł" }),
  });
  assertProblem(problems, "about/index.html: G1 duplicate title also used by index.html");
  assertProblem(problems, "index.html: G1 duplicate title also used by about/index.html");
});

test("G1 a non-indexable page may share an indexable page's title", () => {
  const problems = check("g1-404-shared", { "404.html": validPage(fixtureBase, "/404.html", { title: "Fixture /" }) });
  assert.deepEqual(problems, []);
});

test("G4 indexable page without a description", () => {
  const page = validPage(fixtureBase, "/about/", { description: null });
  assertProblem(check("g4-missing", { "about/index.html": page }), 'about/index.html: G4 missing <meta name="description">');
});

test('G4 indexable page with content=""', () => {
  const page = validPage(fixtureBase, "/about/", { description: "" });
  assertProblem(check("g4-empty", { "about/index.html": page }), "about/index.html: G4 empty meta description");
});

test("G4 indexable page with two descriptions", () => {
  const href = fixtureBase + "about/";
  const page = validPage(fixtureBase, "/about/", {
    head: ["<title>O nas</title>", `<link rel="canonical" href="${href}">`, noindexTag, '<meta name="description" content="A">', '<meta name="description" content="B">'],
  });
  assertProblem(check("g4-two", { "about/index.html": page }), "about/index.html: G4 2 meta descriptions");
});

test("G4 exempts 404.html and /_dev/ pages (D-04)", () => {
  const problems = check("g4-exempt", {
    "404.html": validPage(fixtureBase, "/404.html", { description: null }),
    "_dev/layout-test/index.html": validPage(fixtureBase, "/_dev/layout-test/", { description: null }),
  });
  assert.ok(!problems.some((problem) => problem.includes(": G4 ")), problems.join("\n"));
  assert.deepEqual(problems, []);
});

// G5 fixtures (SEO-05, D-14): each breaks the JSON-LD of one page.
function g5Problems(problems) {
  return problems.filter((problem) => problem.includes(": G5 "));
}

test("G5 unparseable JSON-LD", () => {
  const page = validPage(fixtureBase, "/about/", { jsonLd: '{"@context": "https://schema.org", "@type": "Organization",' });
  const problems = check("g5-unparseable", { "about/index.html": page });
  assertProblem(problems, "about/index.html: G5 invalid JSON-LD: ");
  assert.equal(g5Problems(problems).length, 1, problems.join("\n"));
});

test("G5 Event nested inside the home @graph", () => {
  const event = { "@type": "WebPage", about: { "@type": "Event", name: "Operacja" } };
  const page = validPage(fixtureBase, "/", { jsonLd: homeGraph(fixtureBase, { extraNodes: [event] }) });
  const problems = check("g5-event", { "index.html": page });
  assert.deepEqual(g5Problems(problems), ["index.html: G5 forbidden @type Event"]);
});

test("G5 legacy SportsTeam JSON-LD", () => {
  const legacy = JSON.stringify({ "@context": "https://schema.org", "@type": "SportsTeam", name: "Fixture Clan" });
  const problems = check("g5-sportsteam", { "about/index.html": validPage(fixtureBase, "/about/", { jsonLd: legacy }) });
  assert.deepEqual(g5Problems(problems), ["about/index.html: G5 forbidden @type SportsTeam"]);
});

test("G5 home page graph without the WebSite node", () => {
  const page = validPage(fixtureBase, "/", { jsonLd: homeGraph(fixtureBase, { drop: "WebSite" }) });
  const problems = check("g5-no-website", { "index.html": page });
  assert.deepEqual(g5Problems(problems), ["index.html: G5 home page lacks Organization + WebSite JSON-LD"]);
});

test("G6 meta keywords", () => {
  const href = fixtureBase + "about/";
  const page = validPage(fixtureBase, "/about/", {
    head: [
      "<title>O nas</title>",
      `<link rel="canonical" href="${href}">`,
      noindexTag,
      '<meta name="description" content="Opis">',
      '<meta name="keywords" content="arma, milsim">',
    ],
  });
  assertProblem(check("g6-keywords", { "about/index.html": page }), "about/index.html: G6");
});

// A fixture with a front-matter style marker in index.html, a TODO comment in the CSS and
// the bytes TODO inside a .png, which G10 never reads.
function todoFiles(indexable) {
  return {
    ...validFiles(indexable),
    "index.html": validPage(fixtureBase, "/", { noindex: !indexable }).replace("</head>", "  <!-- TODO(FACTS-01) -->\n</head>"),
    "css/style.css": "body { color: #fff; }\n/* TODO: kolory */\n",
    "assets/image.png": Buffer.from("\x89PNG TODO TODO", "latin1"),
  };
}

test("G10 TODO markers pass a preview build (D-19)", () => {
  const dir = writeFixture("g10-preview", todoFiles(false));
  assert.deepEqual(checkSite(dir, fixtureSite), []);
});

test("G10 TODO markers fail an indexable build, one problem per marker, images ignored", () => {
  const dir = writeFixture("g10-indexable", todoFiles(true));
  const problems = checkSite(dir, indexableSite).filter((problem) => problem.includes(": G10 "));
  assert.equal(problems.length, 2, problems.join("\n"));
  assert.match(problems[0], /^css\/style\.css:2: G10 unconfirmed draft marker TODO /);
  assert.match(problems[1], /^index\.html:\d+: G10 unconfirmed draft marker TODO\(FACTS-01\) \(confirm it in FACTS\.md/);
  assert.ok(!problems.some((problem) => problem.startsWith("assets/")), "G10 read a binary file");
  assert.deepEqual(checkSite(dir, indexableSite), problems, "the TODO fixture should fail on G10 only");
});

test("gate output is stable and sorted (SEO-01 ordering edge)", () => {
  const dir = writeFixture("ordering", {
    ...validFiles(),
    "index.html": validPage(fixtureBase, "/", { title: "Ten sam", description: null }),
    "about/index.html": validPage(fixtureBase, "/about/", { title: "Ten sam", canonical: "/about/" }),
  });
  const first = checkSite(dir, fixtureSite);
  const second = checkSite(dir, fixtureSite);
  assert.ok(first.length >= 4, first.join("\n"));
  assert.deepEqual(first, second, "two runs on the same output differ");
  assert.deepEqual(first, [...first].sort(), "problems are not sorted by file then rule");
  assert.ok(new Set(first.map((problem) => problem.split(":")[0])).size === 2, "expected problems in two files");
});

// G3 fixtures (SEO-03, D-07): each breaks one share tag on the /about/ page (or the image file).
const aboutHref = fixtureBase + "about/";

function g3About(name, og, extra = {}) {
  return check(name, { "about/index.html": validPage(fixtureBase, "/about/", { og }), ...extra });
}

test("G3 og:image missing", () => {
  assertProblem(g3About("g3-missing", { image: null, twitterImage: fixtureBase + fixtureOgImage }), "about/index.html: G3 missing og:image");
});

test("G3 relative og:image", () => {
  assertProblem(g3About("g3-relative", { image: "/assets/og.png" }), 'about/index.html: G3 og:image "/assets/og.png" is not absolute');
});

test("G3 og:image on a foreign host", () => {
  const problems = g3About("g3-foreign", { image: "https://evil.example/assets/og.png" });
  assertProblem(problems, 'about/index.html: G3 og:image "https://evil.example/assets/og.png" is not under');
});

test("G3 og:image file missing from the output", () => {
  assertProblem(check("g3-no-file", { [fixtureOgImage]: null }), "index.html: G3 og:image file assets/og.png is missing");
});

test("G3 twitter:image differs from og:image (SEO-03 adjacency edge)", () => {
  const problems = g3About("g3-twitter-differs", { twitterImage: fixtureBase + "assets/other.png" });
  assertProblem(problems, `about/index.html: G3 twitter:image "${fixtureBase}assets/other.png" differs from og:image`);
});

test("G3 og:url differs from the canonical (SEO-03 adjacency edge)", () => {
  assertProblem(g3About("g3-og-url", { url: fixtureBase }), `about/index.html: G3 og:url is "${fixtureBase}", expected the canonical "${aboutHref}"`);
});

test("G3 twitter:card summary", () => {
  assertProblem(g3About("g3-card", { card: "summary" }), 'about/index.html: G3 twitter:card is "summary"');
});

test("G3 declared og:image:width does not match the file", () => {
  assertProblem(g3About("g3-width", { width: "1000" }), "about/index.html: G3 og:image:width 1000 does not match assets/og.png (1200)");
});

test("G3 indexable page needs a 1200x630 og:image; a /_dev/ page may use another size", () => {
  const small = { image: fixtureBase + "assets/small.png", width: null, height: null };
  const problems = check("g3-small", {
    "about/index.html": validPage(fixtureBase, "/about/", { og: small }),
    "_dev/og/index.html": validPage(fixtureBase, "/_dev/og/", { og: small }),
    "assets/small.png": pngHeader(600, 315),
  });
  assertProblem(problems, "about/index.html: G3 og:image assets/small.png is 600x315, an indexable page needs 1200x630");
  assert.ok(!problems.some((problem) => problem.startsWith("_dev/")), problems.join("\n"));
  assert.equal(problems.length, 1, problems.join("\n"));
});

test("real build with dev pages passes the gate (per-page ogImage override)", () => {
  const dir = build("seo-gate-dev", { INCLUDE_DEV_PAGES: "1" });
  assert.deepEqual(checkSite(dir, { url: "http://localhost:8080", pathPrefix: "/", indexable: false }), []);
});
