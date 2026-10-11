// Rules of the post-build performance gate (D-16, D-17; no Lighthouse CI, D-19).
// scripts/check-perf.js is the CLI that runs after scripts/check-seo.js; the tests import
// checkPerf and measurePerf from here. Same split as lib/check-seo.js: rules in a module, the
// CLI in a script that always runs (CR-01).
// Reads the build output only, never writes. Node built-ins only (node:fs, node:path, node:zlib).
// Rules: P0 empty output, P1 hero picture and mobile candidates, P2 lightbox targets,
// P3 third-party font/icon hosts, P4 inline style attributes, P5 one stylesheet,
// P6 img dimensions, P7 lazy images, P8 shipped originals and oversized images,
// P9 CSS gzip per page, P10 initial JS gzip per page, P11 fonts.
// Every cap lives in BUDGET below. Every URL read from the HTML is resolved inside the build
// folder only (resolveLocal); a URL that escapes it is reported and its target never read.
// Variant widths come from eleventy-img's <hash>-<width>.<format> file names (no AVIF/WebP
// header parser); a file name without a width is reported, never passed.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { listFiles } from "./html.js";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

// D-17: the page-weight budget, one object for every cap, and the contract Phase 4 and Phase 5
// work against. The CSS, JS and font caps are the measured post-Phase-3 sizes (largest of the
// root and /IBC-Website/ production builds) plus 25 %, rounded up to a multiple of 256 bytes.
// Raising any number is a deliberate edit of this object, reviewed in the diff, with the new
// measurement and its date written beside it; never a tweak inside a rule.
export const BUDGET = Object.freeze({
  // D-03: hero candidates up to this width are the ones a phone can pick.
  heroCandidateMaxWidth: 1280,
  // D-03: the largest mobile hero candidate is about 120 KB or less (120 * 1024).
  heroMobileMaxBytes: 122880,
  // D-04: lightbox targets are under 300 KB (strictly less than 300 * 1024)...
  lightboxMaxBytes: 307200,
  // ...and at most 1600 px wide.
  lightboxMaxWidth: 1600,
  // The bundled css/style.css per page, gzip.
  cssGzipMaxBytes: 5120, // measured 3957 B on 2026-10-11 (03-11), cap = measured + 25 %
  // main.js plus the feature modules a page's data-js hooks load, gzip.
  initialJsGzipMaxBytes: 6144, // measured 4857 B on 2026-10-11 (03-11), cap = measured + 25 %
  // The largest woff2 file (the Polish-capable Montserrat subset).
  fontMaxBytes: 45824, // measured 36460 B on 2026-10-11 (03-11), cap = measured + 25 %
  // D-08: one self-hosted variable font file.
  fontFilesMax: 1,
  // D-06: the largest legitimately shipped committed image is ibc-logo-512.png (154,476 B);
  // the cap is 160 KB.
  shippedImageMaxBytes: 163840,
});

// D-02: the repo folder holding the original images. They are pipeline inputs only and must
// never appear in the build output under their own file names (P8). Repo-relative.
export const sourceImageDir = "src/images";

// Shipped text files P3 scans; images, fonts and other binaries are never read.
const textExts = [".html", ".css", ".js", ".mjs", ".xml", ".txt", ".webmanifest", ".config", ".json", ".svg"];
const imageExts = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif"];
const fontExts = [".woff2", ".woff", ".ttf", ".otf", ".eot"];

// P3: hosts of the third-party font and icon CDNs Phase 3 replaces (PERF-04, PERF-05).
const thirdPartyHosts = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "use.fontawesome.com",
  "kit.fontawesome.com",
  "ka-f.fontawesome.com",
  "cdnjs.cloudflare.com",
];

const toPosix = (path) => path.replace(/\\/g, "/");

// Resolves a URL from the HTML to a file inside outDir (T-03-08). Returns null for an
// external URL (http:, https:, data:, mailto:, or protocol-relative //host), { path } when the
// URL lands inside outDir, and { escapes: true } when it does not: a URL without the path
// prefix, one that climbs out with ../ (also percent-encoded), or one that does not decode.
// The caller reports an escaping URL as "points outside the build output" and never reads it.
function resolveLocal(outDir, pathPrefix, url) {
  const trimmed = url.trim();
  if (/^(?:https?:|data:|mailto:|\/\/)/i.test(trimmed)) return null;
  const bare = trimmed.replace(/[?#].*$/s, "");
  if (!bare.startsWith(pathPrefix)) return { escapes: true };
  let rest;
  try {
    rest = decodeURIComponent(bare.slice(pathPrefix.length));
  } catch {
    return { escapes: true };
  }
  if (rest.includes("\0")) return { escapes: true };
  const full = join(outDir, rest);
  const rel = relative(outDir, full);
  if (rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel)) return { escapes: true };
  return { path: full };
}

// File names in <repoRoot>/src/images when that folder exists, else an empty list.
function defaultSourceImageNames() {
  const dir = join(repoRoot, sourceImageDir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
}

// Every non-directory entry under dir, as absolute paths.
function walk(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full));
    else found.push(full);
  }
  return found;
}

// HTML with comments removed and the contents of <script> and <style> blanked (the opening
// tags stay), so tag rules never match text inside JSON-LD, inline code or comments.
function stripInert(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/(<script\b(?:"[^"]*"|'[^']*'|[^'">])*>)[\s\S]*?(<\/script\s*>)/gi, "$1$2")
    .replace(/(<style\b(?:"[^"]*"|'[^']*'|[^'">])*>)[\s\S]*?(<\/style\s*>)/gi, "$1$2");
}

// Attributes of one start tag, lower-case names, first occurrence wins. Quoted values are
// consumed whole, so "style=" inside an alt text is never taken for an attribute.
function parseAttrs(tagText) {
  const attrs = new Map();
  const body = tagText.replace(/^<[a-z][a-z0-9-]*/i, "").replace(/\/?>$/, "");
  for (const match of body.matchAll(/([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    const name = match[1].toLowerCase();
    if (!attrs.has(name)) attrs.set(name, match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attrs;
}

// Every start tag in markup as { name, index, text, attrs }.
function startTags(markup) {
  return Array.from(markup.matchAll(/<([a-z][a-z0-9-]*)(?=[\s/>])(?:"[^"]*"|'[^']*'|[^'">])*>/gi), (match) => ({
    name: match[1].toLowerCase(),
    index: match.index,
    text: match[0],
    attrs: parseAttrs(match[0]),
  }));
}

const isHero = (tag) => (tag.attrs.get("fetchpriority") || "").toLowerCase() === "high";
const isLazy = (tag) => (tag.attrs.get("loading") || "").toLowerCase() === "lazy";
const isStylesheet = (tag) => (tag.attrs.get("rel") || "").toLowerCase().split(/\s+/).includes("stylesheet");

function imgLabel(tag) {
  if (tag.attrs.has("src")) return `<img src="${tag.attrs.get("src")}">`;
  if (tag.attrs.has("alt")) return `<img alt="${tag.attrs.get("alt")}">`;
  return "<img>";
}

// Width from an eleventy-img variant file name (<hash>-<width>.<format>), else null.
function nameWidth(url) {
  const match = /-(\d+)\.[a-z0-9]+$/i.exec(url.replace(/[?#].*$/s, ""));
  return match ? Number(match[1]) : null;
}

// Candidates of a srcset attribute: "<url> <width>w" entries; a missing w descriptor falls
// back to the file-name width.
function srcsetCandidates(value) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [url, descriptor = ""] = entry.split(/\s+/);
      const match = /^(\d+)w$/i.exec(descriptor);
      return { url, width: match ? Number(match[1]) : nameWidth(url) };
    });
}

// One run over one output folder: pages parsed once, every file read, sized and gzipped at
// most once (memoized like lib/check-seo.js memoizes image headers).
function createContext(outDir, site) {
  const pathPrefix = site.pathPrefix || "/";
  const buffers = new Map();
  const sizes = new Map();
  const gzips = new Map();
  const read = (path) => {
    if (!buffers.has(path)) buffers.set(path, readFileSync(path));
    return buffers.get(path);
  };
  const fileSize = (path) => {
    if (!sizes.has(path)) {
      const stat = existsSync(path) ? statSync(path) : null;
      sizes.set(path, stat && stat.isFile() ? stat.size : null);
    }
    return sizes.get(path);
  };
  const gzipSize = (path) => {
    if (!gzips.has(path)) gzips.set(path, gzipSync(read(path)).length);
    return gzips.get(path);
  };
  // { url, status: "external" | "escapes" | "missing" | "ok", path, size } for a URL.
  const resolveFile = (url) => {
    const resolved = resolveLocal(outDir, pathPrefix, url);
    if (resolved === null) return { url, status: "external" };
    if (resolved.escapes) return { url, status: "escapes" };
    const size = fileSize(resolved.path);
    if (size === null) return { url, status: "missing", path: resolved.path };
    return { url, status: "ok", path: resolved.path, size };
  };
  const pages = listFiles(outDir, [".html"]).map((full) => {
    const markup = stripInert(read(full).toString("utf8"));
    return { relPath: toPosix(relative(outDir, full)), markup, tags: startTags(markup) };
  });
  const files = walk(outDir).map((full) => ({ full, relPath: toPosix(relative(outDir, full)) }));
  return { outDir, read, fileSize, gzipSize, resolveFile, pages, files };
}

// Problem text for a URL that did not resolve to a file in the build output.
function unresolved(what, file) {
  if (file.status === "external") return `${what} ${file.url} is not a file in the build output`;
  if (file.status === "escapes") return `${what} ${file.url} points outside the build output`;
  return `${what} ${file.url} is missing from the build output`;
}

// The <picture>…</picture> block around the tag at index, or null.
function enclosingPicture(markup, index) {
  const lower = markup.toLowerCase();
  const open = lower.lastIndexOf("<picture", index);
  if (open === -1 || lower.lastIndexOf("</picture", index) > open) return null;
  const close = lower.indexOf("</picture>", index);
  if (close === -1) return null;
  return markup.slice(open, close + "</picture>".length);
}

// Hero candidates: every srcset in its <picture> (or on the img alone) plus the img src,
// one entry per URL.
function heroCandidates(page, hero) {
  const picture = enclosingPicture(page.markup, hero.index);
  const scope = picture ? startTags(picture).filter((tag) => tag.name === "source" || tag.name === "img") : [hero];
  const found = new Map();
  for (const tag of scope) {
    for (const candidate of srcsetCandidates(tag.attrs.get("srcset") || "")) {
      if (!found.has(candidate.url)) found.set(candidate.url, candidate);
    }
  }
  const src = hero.attrs.get("src");
  if (src && !found.has(src)) found.set(src, { url: src, width: nameWidth(src) });
  return { picture, candidates: Array.from(found.values()) };
}

// P1 (D-03, D-05): one hero on index.html (at most one elsewhere), inside a <picture> with
// AVIF and WebP sources, never lazy, every candidate up to the mobile width within the cap.
function checkHero(ctx, page, budget, report) {
  const heroes = page.tags.filter((tag) => tag.name === "img" && isHero(tag));
  if (page.relPath === "index.html" && heroes.length !== 1) {
    report(1, `needs exactly one <img fetchpriority="high"> hero, found ${heroes.length} (D-03)`);
  } else if (heroes.length > 1) {
    report(1, `has ${heroes.length} <img fetchpriority="high"> heroes, at most one is allowed (D-03)`);
  }
  for (const hero of heroes) {
    const label = imgLabel(hero);
    const { picture, candidates } = heroCandidates(page, hero);
    if (!picture) {
      report(1, `hero ${label} is not inside a <picture> (D-05)`);
    } else {
      const types = startTags(picture)
        .filter((tag) => tag.name === "source")
        .map((tag) => (tag.attrs.get("type") || "").toLowerCase());
      for (const type of ["image/avif", "image/webp"]) {
        if (!types.includes(type)) report(1, `hero <picture> has no <source type="${type}"> (D-05)`);
      }
    }
    if (isLazy(hero)) report(1, `hero ${label} must not be loading="lazy" (D-03)`);
    for (const candidate of candidates) {
      if (candidate.width === null) report(1, `hero candidate ${candidate.url} has no readable width`);
    }
    const mobile = candidates.filter((candidate) => candidate.width !== null && candidate.width <= budget.heroCandidateMaxWidth);
    if (mobile.length === 0) report(1, `hero ${label} has no candidate of ${budget.heroCandidateMaxWidth} w or less (D-03)`);
    for (const candidate of mobile) {
      const file = ctx.resolveFile(candidate.url);
      if (file.status !== "ok") report(1, unresolved("hero candidate", file));
      else if (file.size > budget.heroMobileMaxBytes) {
        report(1, `hero candidate ${candidate.url} (${candidate.width} w) is ${file.size} B, over the mobile cap ${budget.heroMobileMaxBytes} B (D-03)`);
      }
    }
  }
}

// Distinct data-lightbox-avif|webp|jpeg values of a page.
function lightboxUrls(page) {
  const urls = new Set();
  for (const tag of page.tags) {
    for (const format of ["avif", "webp", "jpeg"]) {
      const value = tag.attrs.get(`data-lightbox-${format}`);
      if (value !== undefined) urls.add(value);
    }
  }
  return Array.from(urls);
}

// P2 (D-04): every lightbox target exists, is smaller than lightboxMaxBytes and at most
// lightboxMaxWidth wide (by its file name).
function checkLightbox(ctx, page, budget, report) {
  for (const url of lightboxUrls(page)) {
    const file = ctx.resolveFile(url);
    if (file.status === "escapes" || file.status === "external") {
      report(2, unresolved("lightbox target", file));
      continue;
    }
    const width = nameWidth(url);
    if (width === null) report(2, `lightbox target ${url} has no readable width (no -<width>. in its file name)`);
    else if (width > budget.lightboxMaxWidth) report(2, `lightbox target ${url} is ${width} w, over the cap ${budget.lightboxMaxWidth} w (D-04)`);
    if (file.status === "missing") report(2, unresolved("lightbox target", file));
    else if (file.size >= budget.lightboxMaxBytes) {
      report(2, `lightbox target ${url} is ${file.size} B, it must be under ${budget.lightboxMaxBytes} B (D-04)`);
    }
  }
}

// P3 (PERF-04, PERF-05): no shipped text file names a third-party font or icon host.
function checkThirdPartyHosts(ctx, reporter) {
  for (const { full, relPath } of ctx.files) {
    if (!textExts.includes(extname(full).toLowerCase())) continue;
    const lines = ctx.read(full).toString("utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      const lower = line.toLowerCase();
      for (const host of thirdPartyHosts) {
        if (lower.includes(host)) {
          reporter(`${relPath}:${index + 1}`)(3, `third-party font/icon host ${host} (PERF-04, PERF-05)`);
        }
      }
    });
  }
}

// P4 (D-12): no inline style attribute on any element.
function checkInlineStyles(page, report) {
  const count = page.tags.filter((tag) => tag.attrs.has("style")).length;
  if (count > 0) report(4, `${count} inline style attribute(s), move them to classes (D-12)`);
}

// P5 (D-12): exactly one stylesheet <link>, no <style> element.
function checkOneStylesheet(page, report) {
  const links = page.tags.filter((tag) => tag.name === "link" && isStylesheet(tag)).length;
  if (links !== 1) report(5, `${links} stylesheet <link> elements, exactly one is allowed (D-12)`);
  const styles = page.tags.filter((tag) => tag.name === "style").length;
  if (styles > 0) report(5, `${styles} <style> element(s), all CSS belongs in the one stylesheet (D-12)`);
}

// P6 (D-16): numeric width and height on every <img>. P7 (D-16): every non-hero <img> is
// loading="lazy", the header logo included.
function checkImages(page, report) {
  for (const tag of page.tags.filter((candidate) => candidate.name === "img")) {
    const numeric = (name) => /^\d+$/.test(tag.attrs.get(name) || "");
    if (!numeric("width") || !numeric("height")) report(6, `${imgLabel(tag)} has no numeric width and height (D-16)`);
    if (!isHero(tag) && !isLazy(tag)) report(7, `${imgLabel(tag)} is not loading="lazy" (D-16)`);
  }
}

// P8 (D-02, D-16): no original under its own file name, no hero.jpg, and no image outside the
// generated img/ folder (policed by P1/P2) larger than shippedImageMaxBytes.
function checkShippedImages(ctx, budget, sourceImageNames, reporter) {
  const originals = new Set(sourceImageNames.map((name) => name.toLowerCase()));
  for (const { full, relPath } of ctx.files) {
    const report = reporter(relPath);
    const name = basename(full).toLowerCase();
    if (originals.has(name)) report(8, `source original ${basename(full)} ships in the output; originals stay in ${sourceImageDir} (D-02)`);
    else if (name === "hero.jpg") report(8, "hero.jpg must not ship (PERF-02 duplicate, D-02)");
    if (imageExts.includes(extname(name)) && !relPath.startsWith("img/")) {
      const size = ctx.fileSize(full);
      if (size !== null && size > budget.shippedImageMaxBytes) {
        report(8, `image is ${size} B, over the cap ${budget.shippedImageMaxBytes} B for shipped images (D-06)`);
      }
    }
  }
}

// Gzip bytes of the stylesheets a page links, each counted once, plus problem texts.
function pageCss(ctx, page) {
  const seen = new Set();
  const problems = [];
  let total = 0;
  for (const tag of page.tags.filter((candidate) => candidate.name === "link" && isStylesheet(candidate))) {
    const href = tag.attrs.get("href");
    if (!href) {
      problems.push("stylesheet <link> has no href");
      continue;
    }
    const file = ctx.resolveFile(href);
    if (file.status !== "ok") problems.push(unresolved("stylesheet", file));
    else if (!seen.has(file.path)) {
      seen.add(file.path);
      total += ctx.gzipSize(file.path);
    }
  }
  return { total, problems };
}

// Gzip bytes of the JS a page loads up front: every local <script src> plus
// js/modules/<hook>.js for each distinct data-js hook (D-14), each counted once.
function pageJs(ctx, page) {
  const seen = new Set();
  const problems = [];
  let total = 0;
  const add = (path) => {
    if (seen.has(path)) return;
    seen.add(path);
    total += ctx.gzipSize(path);
  };
  for (const tag of page.tags.filter((candidate) => candidate.name === "script" && candidate.attrs.get("src"))) {
    const file = ctx.resolveFile(tag.attrs.get("src"));
    if (file.status === "ok") add(file.path);
    else if (file.status !== "external") problems.push(unresolved("script", file));
  }
  const hooks = new Set(page.tags.filter((tag) => tag.attrs.has("data-js")).map((tag) => tag.attrs.get("data-js")));
  for (const hook of hooks) {
    if (!/^[a-z0-9-]+$/.test(hook)) {
      problems.push(`data-js hook "${hook}" is not a module name (a-z, 0-9, -)`);
      continue;
    }
    const path = join(ctx.outDir, "js", "modules", `${hook}.js`);
    if (ctx.fileSize(path) === null) problems.push(`data-js hook "${hook}" has no js/modules/${hook}.js (D-14)`);
    else add(path);
  }
  return { total, problems };
}

// P9 (D-17): CSS gzip per page within cssGzipMaxBytes.
function checkCss(ctx, page, budget, report) {
  const { total, problems } = pageCss(ctx, page);
  for (const problem of problems) report(9, problem);
  if (total > budget.cssGzipMaxBytes) report(9, `CSS is ${total} B gzip, over the cap ${budget.cssGzipMaxBytes} B (D-17)`);
}

// P10 (D-17, D-14): initial JS gzip per page within initialJsGzipMaxBytes.
function checkJs(ctx, page, budget, report) {
  const { total, problems } = pageJs(ctx, page);
  for (const problem of problems) report(10, problem);
  if (total > budget.initialJsGzipMaxBytes) report(10, `initial JS is ${total} B gzip, over the cap ${budget.initialJsGzipMaxBytes} B (D-17)`);
}

const fontFiles = (ctx) => ctx.files.filter(({ full }) => fontExts.includes(extname(full).toLowerCase()));
const woff2Files = (ctx) => fontFiles(ctx).filter(({ full }) => extname(full).toLowerCase() === ".woff2");

// P11 (PERF-04, D-08): woff2 only, at most fontFilesMax files, each within fontMaxBytes.
function checkFonts(ctx, budget, reporter) {
  for (const { full, relPath } of fontFiles(ctx)) {
    const ext = extname(full).toLowerCase();
    if (ext !== ".woff2") reporter(relPath)(11, `font format ${ext} must not ship, woff2 only (PERF-04, D-08)`);
  }
  const woff2 = woff2Files(ctx);
  if (woff2.length > budget.fontFilesMax) reporter(".")(11, `${woff2.length} woff2 files, the cap is ${budget.fontFilesMax} (D-08)`);
  for (const { full, relPath } of woff2) {
    const size = ctx.fileSize(full);
    if (size > budget.fontMaxBytes) reporter(relPath)(11, `woff2 is ${size} B, over the cap ${budget.fontMaxBytes} B (D-17)`);
  }
}

// Returns the problems found in the build output folder outDir, each "<relPath>: P<n> <text>",
// sorted by file, rule and text. site is { pathPrefix } as exported by src/_data/site.js.
// options.budget overrides BUDGET (missing keys keep the BUDGET value); options.sourceImageNames
// replaces the file names read from src/images.
export function checkPerf(outDir, site, options = {}) {
  const budget = { ...BUDGET, ...(options.budget || {}) };
  const sourceImageNames = options.sourceImageNames ?? defaultSourceImageNames();
  const problems = [];
  const reporter = (file) => (rule, text) => problems.push({ file, rule, text });

  const ctx = createContext(outDir, site);
  if (ctx.pages.length === 0) return [".: P0 no HTML pages in the build output"];

  for (const page of ctx.pages) {
    const report = reporter(page.relPath);
    checkHero(ctx, page, budget, report);
    checkLightbox(ctx, page, budget, report);
    checkInlineStyles(page, report);
    checkOneStylesheet(page, report);
    checkImages(page, report);
    checkCss(ctx, page, budget, report);
    checkJs(ctx, page, budget, report);
  }
  checkThirdPartyHosts(ctx, reporter);
  checkShippedImages(ctx, budget, sourceImageNames, reporter);
  checkFonts(ctx, budget, reporter);

  // File, then rule number, then text: two runs on the same output give the same list.
  const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  problems.sort((a, b) => compare(a.file, b.file) || a.rule - b.rule || compare(a.text, b.text));
  return problems.map((problem) => `${problem.file}: P${problem.rule} ${problem.text}`);
}

// The measured sizes the budget is set from (D-17), using the same helpers as the rules:
// CSS and initial JS as the largest per-page gzip value, font as the largest woff2, hero as
// the largest candidate up to BUDGET.heroCandidateMaxWidth, lightbox as the largest target.
// URLs that do not resolve count as 0 B here; checkPerf reports them.
export function measurePerf(outDir, site) {
  const ctx = createContext(outDir, site);
  const result = {
    pages: ctx.pages.length,
    cssGzipBytes: 0,
    initialJsGzipBytes: 0,
    fontBytes: 0,
    fontFiles: 0,
    heroMobileMaxBytes: 0,
    lightboxMaxBytes: 0,
  };
  const sizeOf = (url) => {
    const file = ctx.resolveFile(url);
    return file.status === "ok" ? file.size : 0;
  };
  for (const page of ctx.pages) {
    result.cssGzipBytes = Math.max(result.cssGzipBytes, pageCss(ctx, page).total);
    result.initialJsGzipBytes = Math.max(result.initialJsGzipBytes, pageJs(ctx, page).total);
    for (const hero of page.tags.filter((tag) => tag.name === "img" && isHero(tag))) {
      for (const candidate of heroCandidates(page, hero).candidates) {
        if (candidate.width !== null && candidate.width <= BUDGET.heroCandidateMaxWidth) {
          result.heroMobileMaxBytes = Math.max(result.heroMobileMaxBytes, sizeOf(candidate.url));
        }
      }
    }
    for (const url of lightboxUrls(page)) result.lightboxMaxBytes = Math.max(result.lightboxMaxBytes, sizeOf(url));
  }
  const woff2 = woff2Files(ctx);
  result.fontFiles = woff2.length;
  for (const { full } of woff2) result.fontBytes = Math.max(result.fontBytes, ctx.fileSize(full) ?? 0);
  return result;
}
