// SEO-08 gate checks: scripts/check-seo.js passes real builds and fails broken output.
// Real builds go to _test/seo-gate-*; hand-written fixture folders go to
// _test/seo-gate-fixtures/<name>/, one per problem, each a valid site with one thing broken.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { build, cleanEnv, repoRoot } from "./helpers.js";
import { checkSite } from "../scripts/check-seo.js";

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

// A minimal page that passes every gate rule implemented so far. url is the page.url ("/", "/o-nas/").
// head replaces the default head lines; noindex defaults to true (a preview page).
function validPage(base, url, { canonical, noindex = true, head } = {}) {
  const href = canonical === undefined ? base + url.slice(1) : canonical;
  const lines = head ?? [`<link rel="canonical" href="${href}">`, ...(noindex ? [noindexTag] : [])];
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <title>Fixture</title>
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

test("real indexable build passes the gate", () => {
  assert.deepEqual(checkSite(indexableBuild(), { url: "https://example.org", pathPrefix: "/", indexable: true }), []);
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

  writeFixture("cli-broken", {
    ...validFiles(),
    "index.html": validPage(fixtureBase, "/", { canonical: "/" }),
  });
  const broken = runGate("_test/seo-gate-fixtures/cli-broken", { SITE_URL: fixtureSite.url });
  assert.equal(broken.status, 1, "gate accepted a relative canonical");
  assert.match(broken.stderr, /check-seo: index\.html: G2/);
  assert.match(broken.stderr, /must not be deployed/);
});

test("CLI exits 1 when the build folder does not exist", () => {
  const result = runGate("_test/seo-gate-does-not-exist", prefixEnv);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /does not exist \(run eleventy first\)/);
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
  assert.equal(indexable.status, 0, indexable.stderr);
  assert.match(indexable.stdout, /check-seo: INDEXABLE build for https:\/\/example\.org\//);
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

test("G7 <loc> outside the base", () => {
  const sitemap = validSitemap(fixtureBase, ["/", "/about/"]).replace("</urlset>", "  <url><loc>https://evil.example/</loc></url>\n</urlset>");
  assertProblem(check("g7-foreign", { "sitemap.xml": sitemap }), "sitemap.xml: G7 <loc> https://evil.example/ is not under");
});

test("G8 missing robots.txt", () => {
  assertProblem(check("g8-missing", { "robots.txt": null }), "robots.txt: G8 missing");
});

test("G8 Disallow: / line", () => {
  assertProblem(check("g8-disallow", { "robots.txt": "User-agent: *\nDisallow: /\n" }), "robots.txt: G8");
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
