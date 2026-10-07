// Post-build SEO gate (SEO-08, D-19). Runs after Eleventy in `npm run build`, so CI's
// build step fails on broken output before anything is deployed.
// Usage: node scripts/check-seo.js [--dir <folder relative to the repo root>] (default _site)
// Reads the build output only, never writes. Node built-ins only. Configuration comes only
// from src/_data/site.js (the same normalisation Eleventy used); the gate has no switch of its own.
// Rules: G0 empty output, G1 title, G2 canonical, G4 description, G6 no meta keywords,
// G7 sitemap, G8 robots.txt, G9 noindex both ways, G10 TODO markers (indexable builds only, D-19).
// Which pages are meant to be indexed comes from lib/seo.js, the predicate the templates use.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import site from "../src/_data/site.js";
import { isIndexableUrl, outputPathToUrl } from "../lib/seo.js";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const localHosts = ["localhost", "127.0.0.1", "[::1]"];

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

// True when html holds a <meta name="robots"> whose content includes noindex.
function hasNoindex(html) {
  return Array.from(html.matchAll(/<meta\s[^>]*name="robots"[^>]*>/gi)).some((match) => {
    const content = /\scontent="([^"]*)"/i.exec(match[0]);
    return content !== null && /\bnoindex\b/i.test(content[1]);
  });
}

// Inner text of every <title> element in html.
function titles(html) {
  return Array.from(html.matchAll(/<title(?=[\s>])[^>]*>([\s\S]*?)<\/title>/gi), (match) => match[1]);
}

// G1 (part one): exactly one non-empty <title> in <head>. Returns the trimmed title or null.
function checkTitle(head, report) {
  const found = titles(head);
  if (found.length === 0) {
    report(1, "missing <title> in <head>");
    return null;
  }
  if (found.length > 1) {
    report(1, `${found.length} <title> tags in <head>, expected exactly one`);
    return null;
  }
  const text = found[0].trim();
  if (text === "") {
    report(1, "empty <title>");
    return null;
  }
  return text;
}

// G1 (part two): titles are unique across indexable pages. Each duplicate is reported on
// every file that uses it, naming the other file(s).
function checkUniqueTitles(titled, reporter) {
  const byTitle = new Map();
  for (const { relPath, title } of titled) {
    if (!byTitle.has(title)) byTitle.set(title, []);
    byTitle.get(title).push(relPath);
  }
  for (const files of byTitle.values()) {
    if (files.length < 2) continue;
    for (const file of files) {
      for (const other of files) {
        if (other !== file) reporter(file)(1, `duplicate title also used by ${other}`);
      }
    }
  }
}

// G4: an indexable page has exactly one <meta name="description"> with non-empty content (D-04).
function checkDescription(head, report) {
  const tags = Array.from(head.matchAll(/<meta\s[^>]*name="description"[^>]*>/gi), (match) => match[0]);
  if (tags.length === 0) return report(4, 'missing <meta name="description"> on an indexable page');
  if (tags.length > 1) return report(4, `${tags.length} meta descriptions in <head>, expected exactly one`);
  const content = /\scontent="([^"]*)"/i.exec(tags[0]);
  if (content === null || content[1].trim() === "") report(4, "empty meta description");
}

// G6: no <meta name="keywords"> anywhere (D-14).
function checkNoKeywords(html, report) {
  if (/<meta\s[^>]*name="keywords"/i.test(html)) report(6, '<meta name="keywords"> must not be used (D-14)');
}

// Shipped text files G10 scans; images and other binaries are never read.
const textExts = [".html", ".xml", ".txt", ".webmanifest", ".config", ".css", ".js", ".json"];

// G10 (indexable builds only, D-19): no TODO token in any shipped text file. Drafted copy
// carries TODO(FACTS-NN) markers (FACTS.md) until the clan confirms it.
function checkTodoMarkers(outDir, reporter) {
  for (const full of listFiles(outDir, textExts)) {
    const relPath = relative(outDir, full).replace(/\\/g, "/");
    const lines = readFileSync(full, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const match of line.matchAll(/\bTODO\b(?:\([^)\s]*\))?/g)) {
        reporter(`${relPath}:${index + 1}`)(10, `unconfirmed draft marker ${match[0]} (confirm it in FACTS.md and remove the marker)`);
      }
    });
  }
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

// G9: preview builds are noindex everywhere; indexable builds follow the shared predicate.
function checkNoindex(head, url, indexable, report) {
  const noindex = hasNoindex(head);
  if (!indexable && !noindex) report(9, 'missing <meta name="robots" content="noindex"> on a non-indexable build');
  else if (indexable && isIndexableUrl(url) && noindex) report(9, "indexable page carries robots noindex");
  else if (indexable && !isIndexableUrl(url) && !noindex) report(9, "non-indexable page is missing robots noindex");
}

// Output-relative file for a sitemap <loc> under base ("" or ".../" -> index.html),
// or null when the value cannot be a file inside outDir.
function locToRelPath(loc, base) {
  let rest = loc.slice(base.length);
  try {
    rest = decodeURI(rest);
  } catch {
    return null;
  }
  if (rest === "" || rest.endsWith("/")) rest += "index.html";
  if (rest.split("/").some((segment) => segment === ".." || segment === ".")) return null;
  return rest;
}

// G7: the sitemap exists, every <loc> is unique, absolute under base and points at an
// indexable page, and every indexable page is listed.
function checkSitemap(outDir, base, pages, reporter) {
  const report = reporter("sitemap.xml");
  const sitemapPath = join(outDir, "sitemap.xml");
  if (!existsSync(sitemapPath)) return report(7, "missing");

  const locs = Array.from(readFileSync(sitemapPath, "utf8").matchAll(/<loc>([^<]*)<\/loc>/g), (match) => match[1].trim());
  const seen = new Set();
  for (const loc of locs) {
    if (seen.has(loc)) {
      report(7, `duplicate <loc> ${loc}`);
      continue;
    }
    seen.add(loc);
    if (!loc.startsWith(base)) {
      report(7, `<loc> ${loc} is not under ${base}`);
      continue;
    }
    const relPath = locToRelPath(loc, base);
    const full = relPath === null ? null : join(outDir, relPath);
    const exists = full !== null && existsSync(full) && statSync(full).isFile();
    if (!exists || !isIndexableUrl(outputPathToUrl(relPath))) {
      report(7, `<loc> ${loc} points at a missing or non-indexable page`);
    }
  }

  for (const page of pages) {
    if (isIndexableUrl(page.url) && !seen.has(page.absolute)) {
      reporter(page.relPath)(7, "indexable page is missing from sitemap.xml");
    }
  }
}

// G8: robots.txt exists, never blocks the whole site, and names the sitemap on indexable builds.
function checkRobots(outDir, base, indexable, report) {
  const robotsPath = join(outDir, "robots.txt");
  if (!existsSync(robotsPath)) return report(8, "missing");
  const lines = readFileSync(robotsPath, "utf8").split(/\r?\n/).map((line) => line.trim());
  if (lines.some((line) => line.toLowerCase() === "disallow: /")) {
    report(8, '"Disallow: /" hides the noindex from crawlers (D-15)');
  }
  const sitemapLine = `Sitemap: ${base}sitemap.xml`;
  if (indexable && !lines.includes(sitemapLine)) report(8, `missing "${sitemapLine}" on an indexable build`);
}

// Returns the problems found in the build output folder outDir, each "<relPath>: G<n> <text>",
// sorted by file and rule. site is { url, pathPrefix, indexable } as exported by src/_data/site.js.
export function checkSite(outDir, site) {
  const base = site.url + site.pathPrefix;
  const indexable = site.indexable === true;
  const problems = [];
  const reporter = (file) => (rule, text) => problems.push({ file, rule, text });

  const pages = listFiles(outDir, [".html"]).map((full) => {
    const relPath = relative(outDir, full).replace(/\\/g, "/");
    const url = outputPathToUrl(relPath);
    return { relPath, url, absolute: base + url.slice(1), html: readFileSync(full, "utf8") };
  });
  if (pages.length === 0) return [".: G0 no HTML pages in the build output"];

  const titled = [];
  for (const page of pages) {
    const report = reporter(page.relPath);
    const head = block(page.html, "head");
    const title = checkTitle(head, report);
    if (title !== null && isIndexableUrl(page.url)) titled.push({ relPath: page.relPath, title });
    checkCanonical(head, page.absolute, report);
    if (isIndexableUrl(page.url)) checkDescription(head, report);
    checkNoKeywords(page.html, report);
    checkNoindex(head, page.url, indexable, report);
  }
  checkUniqueTitles(titled, reporter);
  checkSitemap(outDir, base, pages, reporter);
  checkRobots(outDir, base, indexable, reporter("robots.txt"));
  if (indexable) checkTodoMarkers(outDir, reporter);

  // File, then rule number, then text: two runs on the same output give the same list.
  const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  problems.sort((a, b) => compare(a.file, b.file) || a.rule - b.rule || compare(a.text, b.text));
  return problems.map((problem) => `${problem.file}: G${problem.rule} ${problem.text}`);
}

// One line naming the kind of build being checked (Pitfall 9, R2-WR-03).
function banner(site) {
  const base = site.url + site.pathPrefix;
  if (localHosts.includes(new URL(site.url).hostname)) return `check-seo: LOCAL build (${site.url}), never deploy this output`;
  if (site.indexable) return `check-seo: INDEXABLE build for ${base}`;
  return `check-seo: preview build (noindex on every page) for ${base}`;
}

function runCli(argv) {
  process.stdout.write(`${banner(site)}\n`);

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
