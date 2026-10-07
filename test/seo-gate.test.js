// SEO-08 gate checks: scripts/check-seo.js passes real builds and fails broken output.
// Real builds go to _test/seo-gate-*; hand-written fixture folders go to
// _test/seo-gate-fixtures/<name>/, one per rule, each a valid site with one thing broken.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { build, cleanEnv, repoRoot } from "./helpers.js";
import { checkSite } from "../scripts/check-seo.js";

const fixtureSite = { url: "https://fixture.example", pathPrefix: "/" };
const fixtureBase = fixtureSite.url + fixtureSite.pathPrefix;

// Write { relPath: content } into a fresh _test/seo-gate-fixtures/<name>/ and return the folder.
function writeFixture(name, files) {
  const dir = join(repoRoot, "_test", "seo-gate-fixtures", name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const [relPath, content] of Object.entries(files)) {
    const full = join(dir, relPath);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

// A minimal page that passes every gate rule implemented so far. url is the page.url ("/", "/o-nas/").
function validPage(base, url, { canonical } = {}) {
  const href = canonical === undefined ? base + url.slice(1) : canonical;
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <title>Fixture</title>
  <link rel="canonical" href="${href}">
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

function hasProblem(problems, prefix) {
  return problems.some((problem) => problem.startsWith(prefix));
}

function runGate(dir, env = {}) {
  return spawnSync(process.execPath, ["scripts/check-seo.js", "--dir", dir], {
    cwd: repoRoot,
    env: cleanEnv(env),
    encoding: "utf8",
  });
}

const prefixEnv = { SITE_URL: "https://guard.example", PATH_PREFIX: "/IBC-Website/" };

test("real prefix build passes the gate", () => {
  const out = build("seo-gate-prefix", prefixEnv);
  assert.deepEqual(checkSite(out, { url: "https://guard.example", pathPrefix: "/IBC-Website/" }), []);
});

test("CLI exits 0 on a real build and 1 on a broken one", () => {
  build("seo-gate-cli", prefixEnv);
  const ok = runGate("_test/seo-gate-cli", prefixEnv);
  assert.equal(ok.status, 0, `gate failed on a real build:\n${ok.stderr}`);
  assert.match(ok.stdout, /check-seo: OK/);

  writeFixture("cli-broken", {
    "index.html": validPage(fixtureBase, "/", { canonical: "/" }),
    "sitemap.xml": validSitemap(fixtureBase, ["/"]),
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

test("G2 relative canonical", () => {
  const dir = writeFixture("g2-relative", {
    "index.html": validPage(fixtureBase, "/", { canonical: "/" }),
    "sitemap.xml": validSitemap(fixtureBase, ["/"]),
  });
  assert.ok(hasProblem(checkSite(dir, fixtureSite), "index.html: G2"));
});

test("G7 page missing from sitemap", () => {
  const dir = writeFixture("g7-missing-page", {
    "index.html": validPage(fixtureBase, "/"),
    "about/index.html": validPage(fixtureBase, "/about/"),
    "sitemap.xml": validSitemap(fixtureBase, ["/"]),
  });
  const problems = checkSite(dir, fixtureSite);
  assert.ok(hasProblem(problems, "about/index.html: G7"), problems.join("\n"));
  assert.ok(!hasProblem(problems, "index.html: G7"), problems.join("\n"));
});
