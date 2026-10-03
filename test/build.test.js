// FOUND-01/03/04/06 tracer checks: the home page builds from src/ at the domain root,
// under /IBC-Website/, with a mutated SITE_URL and with empty env values.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build, runBuild, cleanEnv, repoRoot, read, listFiles, attrValues, block } from "./helpers.js";
import site from "../src/_data/site.js";

const assetFiles = [
  "cos.png",
  "funny.png",
  "hero-bg.jpg",
  "hero.jpg",
  "jo_1967.png",
  "logo.png",
  "op_patrol.jpg",
  "patrol.jpg",
  "sniper.jpg",
];

// A drive-letter path such as C:/ or c:\ (not the "s:/" inside "https://").
const drivePathPattern = /(?<![A-Za-z])[A-Za-z]:[\\/](?![\\/])/;
const inviteDomainPattern = /https?:\/\/(?:www\.)?discord(?:\.gg|(?:app)?\.com\/invite)\/[A-Za-z0-9-]+/g;

function ogImage(html) {
  const head = block(html, "head");
  const match = /<meta property="og:image" content="([^"]*)"/.exec(head);
  assert.ok(match, "og:image meta tag missing from <head>");
  return match[1];
}

function allHtml(outDir) {
  return listFiles(outDir, [".html"]).map((file) => readFileSync(file, "utf8"));
}

test("default build emits the site", () => {
  const out = build("build-root");
  for (const rel of ["index.html", "css/style.css", "js/main.js"]) {
    assert.ok(existsSync(join(out, rel)), `missing ${rel}`);
  }
  for (const name of assetFiles) {
    assert.ok(existsSync(join(out, "assets", name)), `missing assets/${name}`);
  }
  const html = read(out, "index.html");
  assert.ok(html.includes('href="/css/style.css"'), "stylesheet is not root-relative");
  assert.ok(html.includes('src="/js/main.js"'), "script is not root-relative");
});

test("prefix build rewrites root-relative URLs", () => {
  const out = build("build-prefix", { PATH_PREFIX: "/IBC-Website/" });
  const html = read(out, "index.html");
  assert.ok(html.includes('href="/IBC-Website/css/style.css"'), "stylesheet missing the prefix");
  assert.ok(html.includes('src="/IBC-Website/js/main.js"'), "script missing the prefix");
  assert.ok(attrValues(html, "src").every((value) => value !== "."), 'empty src rewritten to "."');

  for (const page of allHtml(out)) {
    assert.ok(!page.includes('src="."'), 'output contains src="."');
    assert.ok(!page.includes("C:/"), "output contains a C:/ path");
    assert.ok(!page.includes("Program%20Files"), "output contains Program%20Files");
    assert.ok(!drivePathPattern.test(page), "output contains a drive-letter path");
  }
});

test("SITE_URL and PATH_PREFIX are normalized", () => {
  const out = build("build-mutated", { SITE_URL: "https://mutated.example/", PATH_PREFIX: "IBC-Website" });
  const html = read(out, "index.html");
  const image = ogImage(html);
  assert.equal(image, "https://mutated.example/IBC-Website/assets/hero-bg.jpg");
  assert.ok(!image.replace(/^https:\/\//, "").includes("//"), "double slash after the host");
  assert.ok(html.includes('href="/IBC-Website/css/style.css"'), "slashless PATH_PREFIX not normalized");
  for (const page of allHtml(out)) {
    assert.ok(!page.includes("localhost:8080"), "default SITE_URL leaked into a mutated build");
  }
});

test("empty env falls back to defaults", () => {
  const out = build("build-empty", { SITE_URL: "", PATH_PREFIX: "" });
  const html = read(out, "index.html");
  assert.equal(ogImage(html), "http://localhost:8080/assets/hero-bg.jpg");
  assert.ok(html.includes('href="/css/style.css"'), "empty PATH_PREFIX did not fall back to /");
});

test("invite comes from site.js", () => {
  const out = build("build-root"); // rebuilt so this test also runs on its own
  const html = read(out, "index.html");
  const invites = html.match(inviteDomainPattern) || [];
  assert.ok(invites.length > 0, "no Discord invite in the built home page");
  for (const invite of invites) assert.equal(invite, site.discord.invite);

  const hrefCount = attrValues(html, "href").filter((value) => value === site.discord.invite).length;
  assert.ok(hrefCount >= 2, `expected at least 2 invite hrefs, found ${hrefCount}`);
  const dataCount = attrValues(html, "data-discord-url").filter((value) => value === site.discord.invite).length;
  assert.equal(dataCount, 1, "expected exactly one data-discord-url with the invite");

  const template = readFileSync(new URL("../src/index.njk", import.meta.url), "utf8");
  assert.ok(!template.includes("discord.gg"), "src/index.njk contains an invite literal");
});

// CR-01 / G-01-5: a production build (Eleventy CLI, run mode "build") without SITE_URL must
// stop instead of writing http://localhost:8080 into absolute URLs such as og:image.
test("production build without SITE_URL fails loudly", () => {
  const { outDir, result } = runBuild("build-guard-missing", {});
  assert.notEqual(result.status, 0, "build without SITE_URL succeeded");
  assert.ok(result.stderr.includes("SITE_URL is not set"), `guard message missing from stderr:\n${result.stderr}`);
  assert.ok(result.stderr.includes("ALLOW_LOCAL_SITE_URL=1"), "guard message does not name the opt-out");
  assert.ok(!existsSync(join(outDir, "index.html")), "failed build still wrote index.html");
});

test("ALLOW_LOCAL_SITE_URL=1 keeps the local default", () => {
  const out = build("build-guard-optout", { ALLOW_LOCAL_SITE_URL: "1" });
  assert.equal(ogImage(read(out, "index.html")), "http://localhost:8080/assets/hero-bg.jpg");
});

test("blank SITE_URL counts as missing", () => {
  const { result } = runBuild("build-guard-blank", { SITE_URL: "   " });
  assert.notEqual(result.status, 0, "build with a blank SITE_URL succeeded");
  assert.ok(result.stderr.includes("SITE_URL is not set"), `guard message missing from stderr:\n${result.stderr}`);
});

test("only ALLOW_LOCAL_SITE_URL=1 opts out", () => {
  const { result } = runBuild("build-guard-strict", { ALLOW_LOCAL_SITE_URL: "true" });
  assert.notEqual(result.status, 0, 'ALLOW_LOCAL_SITE_URL="true" bypassed the guard');
  assert.ok(result.stderr.includes("SITE_URL is not set"), `guard message missing from stderr:\n${result.stderr}`);
});

test("a set SITE_URL passes the guard without the opt-out", () => {
  // runBuild directly, so the helper adds no ALLOW_LOCAL_SITE_URL.
  const { outDir, result } = runBuild("build-guard-set", { SITE_URL: "https://guard.example" });
  assert.equal(result.status, 0, `build with SITE_URL failed:\n${result.stderr || result.error}`);
  assert.equal(ogImage(read(outDir, "index.html")), "https://guard.example/assets/hero-bg.jpg");
  for (const page of allHtml(outDir)) {
    assert.ok(!page.includes("localhost:8080"), "localhost:8080 leaked into a build with SITE_URL");
  }
});

// Eleventy's cmd.cjs maps --serve to run mode "serve", --watch to "watch" and everything
// else to "build", and writes it to ELEVENTY_RUN_MODE before importing the config. So
// importing site.js with ELEVENTY_RUN_MODE=serve stands in for `npm run dev`.
test("site.js keeps the local default in serve and watch mode", () => {
  const siteHref = pathToFileURL(join(repoRoot, "src/_data/site.js")).href;
  const probe = `import site from ${JSON.stringify(siteHref)}; console.log(site.url);`;
  const runProbe = (mode) =>
    spawnSync(process.execPath, ["--input-type=module", "-e", probe], {
      cwd: repoRoot,
      encoding: "utf8",
      env: cleanEnv({ ELEVENTY_RUN_MODE: mode }),
    });

  for (const mode of ["serve", "watch"]) {
    const result = runProbe(mode);
    assert.equal(result.status, 0, `site.js threw in ${mode} mode:\n${result.stderr}`);
    assert.equal(result.stdout.trim(), "http://localhost:8080");
  }

  const buildResult = runProbe("build");
  assert.notEqual(buildResult.status, 0, "site.js did not throw in build mode without SITE_URL");
  assert.ok(buildResult.stderr.includes("SITE_URL is not set"), `guard message missing from stderr:\n${buildResult.stderr}`);
});

test("build helpers never inherit an opt-out", () => {
  const saved = process.env.ALLOW_LOCAL_SITE_URL;
  process.env.ALLOW_LOCAL_SITE_URL = "1";
  try {
    const leaked = Object.keys(cleanEnv({})).filter((key) => key.toUpperCase() === "ALLOW_LOCAL_SITE_URL");
    assert.deepEqual(leaked, [], "cleanEnv kept the inherited ALLOW_LOCAL_SITE_URL");
    const { result } = runBuild("build-guard-inherited", {});
    assert.notEqual(result.status, 0, "an inherited ALLOW_LOCAL_SITE_URL bypassed the guard");
  } finally {
    if (saved === undefined) delete process.env.ALLOW_LOCAL_SITE_URL;
    else process.env.ALLOW_LOCAL_SITE_URL = saved;
  }
});
