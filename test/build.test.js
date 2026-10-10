// FOUND-01/03/04/06 tracer checks: the home page builds from src/ at the domain root,
// under /IBC-Website/, with a mutated SITE_URL and with empty env values.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import { build, runBuild, cleanEnv, repoRoot, read, listFiles, attrValues, block } from "./helpers.js";
import site from "../src/_data/site.js";

// The file names that used to sit in src/assets/ (now src/images/, D-02; hero.jpg deleted, PERF-02).
const originalNames = [
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

// The originals the pipeline reads (D-02): every file tracked under src/images/.
function trackedOriginals() {
  const result = spawnSync("git", ["ls-files", "-z", "src/images"], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(result.status, 0, `git ls-files failed:\n${result.stderr || result.error}`);
  return result.stdout.split("\0").filter(Boolean);
}

// Output files (any depth) whose base name equals an original's name, case-insensitive.
function shippedOriginals(outputFiles, originalFiles) {
  const names = new Set(originalFiles.map((file) => basename(file).toLowerCase()));
  return outputFiles.filter((file) => names.has(basename(file).toLowerCase()));
}

function allFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...allFiles(full));
    else found.push(full);
  }
  return found;
}

test("default build emits the site", () => {
  const out = build("build-root");
  for (const rel of ["index.html", "css/style.css", "js/main.js"]) {
    assert.ok(existsSync(join(out, rel)), `missing ${rel}`);
  }
  // Originals stay out of the output (D-02); the pipeline's variants ship under img/.
  for (const name of originalNames) {
    assert.ok(!existsSync(join(out, "assets", name)), `original assets/${name} ships in the output`);
  }
  assert.ok(listFiles(join(out, "img"), [".avif"]).length > 0, "no AVIF variant under img/");
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

test("originals never ship (D-02, PERF-02)", () => {
  const originals = trackedOriginals();
  assert.ok(originals.length > 0, "no original tracked under src/images/");
  for (const out of [build("build-root"), build("build-prefix", { PATH_PREFIX: "/IBC-Website/" })]) {
    const shipped = shippedOriginals(allFiles(out), originals);
    assert.deepEqual(shipped, [], `originals ship in ${out}`);
  }
});

test("the never-ship check reports a shipped original (negative control)", () => {
  const out = join(repoRoot, "_test", "fake-output");
  const files = [join(out, "index.html"), join(out, "img", "Ab12cd-1600.avif"), join(out, "media", "HERO-BG.JPG")];
  assert.deepEqual(shippedOriginals(files, ["src/images/hero-bg.jpg", "src/images/logo.png"]), [files[2]]);
});

test("the duplicate hero.jpg is gone (PERF-02)", () => {
  assert.ok(!existsSync(join(repoRoot, "src", "assets", "hero.jpg")), "src/assets/hero.jpg still exists");
  const tracked = spawnSync("git", ["ls-files", "--", "src/assets/hero.jpg"], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(tracked.status, 0, `git ls-files failed:\n${tracked.stderr || tracked.error}`);
  assert.equal(tracked.stdout.trim(), "", "src/assets/hero.jpg is still tracked");
  for (const out of [build("build-root"), build("build-prefix", { PATH_PREFIX: "/IBC-Website/" })]) {
    assert.ok(!existsSync(join(out, "assets", "hero.jpg")), `assets/hero.jpg ships in ${out}`);
  }
});

test("originals stay in git (D-02)", () => {
  const names = trackedOriginals().map((file) => file.replace(/^src\/images\//, "")).sort();
  assert.deepEqual(names, [
    "cos.png",
    "funny.png",
    "hero-bg.jpg",
    "jo_1967.png",
    "logo.png",
    "op_patrol.jpg",
    "patrol.jpg",
    "sniper.jpg",
  ]);
});

// The SEO image tool is never run by the build (D-06), so only its source can show where it reads.
test("the SEO image tool reads its two inputs from src/images (D-06)", () => {
  const source = readFileSync(join(repoRoot, "tools", "seo-images", "make-seo-images.js"), "utf8");
  const inputsBlock = /const inputs = \{([\s\S]*?)\};/.exec(source);
  assert.ok(inputsBlock, "no `const inputs = { ... }` block in make-seo-images.js");
  const paths = Array.from(inputsBlock[1].matchAll(/join\(repoRoot, "([^"]+)"\)/g), (match) => match[1]);
  assert.deepEqual(paths, ["src/images/logo.png", "src/images/hero-bg.jpg"]);
  for (const path of paths) assert.ok(existsSync(join(repoRoot, path)), `SEO tool input ${path} does not exist`);
});

test("SITE_URL and PATH_PREFIX are normalized", () => {
  const out = build("build-mutated", { SITE_URL: "https://mutated.example/", PATH_PREFIX: "IBC-Website" });
  const html = read(out, "index.html");
  const image = ogImage(html);
  assert.equal(image, "https://mutated.example/IBC-Website/assets/og/og-default-v1.jpg");
  assert.ok(!image.replace(/^https:\/\//, "").includes("//"), "double slash after the host");
  assert.ok(html.includes('href="/IBC-Website/css/style.css"'), "slashless PATH_PREFIX not normalized");
  for (const page of allHtml(out)) {
    assert.ok(!page.includes("localhost:8080"), "default SITE_URL leaked into a mutated build");
  }
});

test("empty env falls back to defaults", () => {
  const out = build("build-empty", { SITE_URL: "", PATH_PREFIX: "" });
  const html = read(out, "index.html");
  assert.equal(ogImage(html), "http://localhost:8080/assets/og/og-default-v1.jpg");
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
  assert.equal(ogImage(read(out, "index.html")), "http://localhost:8080/assets/og/og-default-v1.jpg");
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
  assert.equal(ogImage(read(outDir, "index.html")), "https://guard.example/assets/og/og-default-v1.jpg");
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
