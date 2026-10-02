// Shared test helpers: build the site into an isolated _test/<name>/ dir and
// pull values out of the generated HTML. Eleventy is spawned directly with
// node (never through a shell), so Git Bash cannot rewrite PATH_PREFIX.
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

export const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

// require.resolve("@11ty/eleventy/cmd.cjs") fails with ERR_PACKAGE_PATH_NOT_EXPORTED, so use the file path.
const cmdPath = fileURLToPath(new URL("../node_modules/@11ty/eleventy/cmd.cjs", import.meta.url));

// Env vars that change the build output. They are stripped from the inherited env so
// a developer shell or CI job env cannot leak into a variant; each test sets its own.
const buildEnvKeys = ["SITE_URL", "PATH_PREFIX", "INCLUDE_DEV_PAGES", "ELEVENTY_RUN_MODE"];

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Build into <repoRoot>/_test/<name>. Prefix <name> with the suite name:
// node --test runs test files in parallel processes.
export function build(name, env = {}) {
  const outDir = join(repoRoot, "_test", name);
  rmSync(outDir, { recursive: true, force: true });

  const childEnv = { ...process.env };
  for (const key of Object.keys(childEnv)) {
    if (buildEnvKeys.includes(key.toUpperCase())) delete childEnv[key];
  }
  Object.assign(childEnv, env);

  const result = spawnSync(process.execPath, [cmdPath, "--output=" + outDir, "--quiet"], {
    cwd: repoRoot,
    env: childEnv,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `Eleventy build "${name}" failed:\n${result.stderr || result.error}`);
  return outDir;
}

export function read(outDir, relPath) {
  return readFileSync(join(outDir, relPath), "utf8");
}

// Recursive list of absolute file paths under dir whose extension is in exts (e.g. [".html"]).
export function listFiles(dir, exts) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...listFiles(full, exts));
    else if (exts.includes(extname(entry.name).toLowerCase())) found.push(full);
  }
  return found;
}

// Every double-quoted value of attribute attr. The name must follow whitespace,
// so attrValues(html, "src") never returns data-src values.
export function attrValues(html, attr) {
  const pattern = new RegExp(`\\s${escapeRegExp(attr)}="([^"]*)"`, "g");
  return Array.from(html.matchAll(pattern), (match) => match[1]);
}

// From the first <tag (followed by whitespace or ">") up to and including the first </tag>.
// block(html, "head") never matches <header>. Returns "" when the tag is missing.
export function block(html, tag) {
  const open = new RegExp(`<${escapeRegExp(tag)}(?=[\\s>])`).exec(html);
  if (!open) return "";
  const closeTag = `</${tag}>`;
  const end = html.indexOf(closeTag, open.index);
  if (end === -1) return "";
  return html.slice(open.index, end + closeTag.length);
}
