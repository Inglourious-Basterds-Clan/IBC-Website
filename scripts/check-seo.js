// Post-build SEO gate (SEO-08, D-19). Runs after Eleventy in `npm run build`, so CI's
// build step fails on broken output before anything is deployed.
// Usage: node scripts/check-seo.js [--dir <folder relative to the repo root>] (default _site)
// Reads the build output only, never writes. Node built-ins only. Configuration comes only
// from src/_data/site.js (the same normalisation Eleventy used); the gate has no switch of its own.
// Rules: G2 canonical, G7 sitemap.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import site from "../src/_data/site.js";
import { isIndexableUrl, outputPathToUrl } from "../lib/seo.js";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Recursive list of absolute file paths under dir whose extension is in exts (e.g. [".html"]).
function listFiles(dir, exts) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...listFiles(full, exts));
    else if (exts.includes(extname(entry.name).toLowerCase())) found.push(full);
  }
  return found;
}

// From the first <tag (followed by whitespace or ">") up to and including the first </tag>.
// Returns "" when the tag is missing.
function block(html, tag) {
  const open = new RegExp(`<${escapeRegExp(tag)}(?=[\\s>])`).exec(html);
  if (!open) return "";
  const closeTag = `</${tag}>`;
  const end = html.indexOf(closeTag, open.index);
  if (end === -1) return "";
  return html.slice(open.index, end + closeTag.length);
}

// href values of every <link rel="canonical"> in html (null for a tag without href).
function canonicalHrefs(html) {
  return Array.from(html.matchAll(/<link\s[^>]*rel="canonical"[^>]*>/g), (match) => {
    const href = /\shref="([^"]*)"/.exec(match[0]);
    return href ? href[1] : null;
  });
}

// G2: exactly one absolute canonical in <head>, equal to base + page path.
function checkCanonical(head, expected, report) {
  const hrefs = canonicalHrefs(head);
  if (hrefs.length === 0) return report(2, 'missing <link rel="canonical"> in <head>');
  if (hrefs.length > 1) return report(2, `${hrefs.length} canonical links in <head>, expected exactly one`);
  const href = hrefs[0];
  if (href === null || !/^https?:\/\//.test(href)) return report(2, `canonical "${href}" is not absolute`);
  if (href !== expected) report(2, `canonical is "${href}", expected "${expected}"`);
}

// Returns the problems found in the build output folder outDir, each "<relPath>: G<n> <text>",
// sorted by file and rule. site is { url, pathPrefix } as exported by src/_data/site.js.
export function checkSite(outDir, site) {
  const base = site.url + site.pathPrefix;
  const problems = [];
  const reporter = (file) => (rule, text) => problems.push({ file, rule, text });

  const pages = listFiles(outDir, [".html"]).map((full) => {
    const relPath = relative(outDir, full).replace(/\\/g, "/");
    const url = outputPathToUrl(relPath);
    return { relPath, url, absolute: base + url.slice(1), html: readFileSync(full, "utf8") };
  });

  for (const page of pages) {
    const report = reporter(page.relPath);
    checkCanonical(block(page.html, "head"), page.absolute, report);
  }

  // G7: the sitemap exists and lists every indexable page.
  const sitemapPath = join(outDir, "sitemap.xml");
  if (!existsSync(sitemapPath)) {
    reporter("sitemap.xml")(7, "missing");
  } else {
    const locs = Array.from(readFileSync(sitemapPath, "utf8").matchAll(/<loc>([^<]*)<\/loc>/g), (match) => match[1].trim());
    for (const page of pages) {
      if (isIndexableUrl(page.url) && !locs.includes(page.absolute)) {
        reporter(page.relPath)(7, "indexable page is missing from sitemap.xml");
      }
    }
  }

  problems.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.rule - b.rule));
  return problems.map((problem) => `${problem.file}: G${problem.rule} ${problem.text}`);
}

function runCli(argv) {
  const dirIndex = argv.indexOf("--dir");
  const dirArg = dirIndex === -1 ? "_site" : argv[dirIndex + 1] || "";
  const outDir = resolve(repoRoot, dirArg);
  if (!dirArg || !existsSync(outDir)) {
    process.stderr.write(`check-seo: ${dirArg || "(no --dir value)"} does not exist (run eleventy first)\n`);
    process.exit(1);
  }

  const problems = checkSite(outDir, site);
  if (problems.length > 0) {
    for (const problem of problems) process.stderr.write(`check-seo: ${problem}\n`);
    process.stderr.write(`check-seo: ${problems.length} problem(s), this output must not be deployed\n`);
    process.exit(1);
  }
  const pageCount = listFiles(outDir, [".html"]).length;
  process.stdout.write(`check-seo: OK, ${pageCount} page(s) checked\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli(process.argv.slice(2));
}
