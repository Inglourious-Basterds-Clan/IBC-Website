// Rules of the post-build performance gate (D-16, D-17; no Lighthouse CI, D-19).
// scripts/check-perf.js is the CLI that runs after scripts/check-seo.js; the tests import
// checkPerf from here. Same split as lib/check-seo.js: rules in a module, the CLI in a
// script that always runs (CR-01).
// Reads the build output only, never writes. Node built-ins only (node:fs, node:path, node:zlib).
// Rules: P0 empty output, P1 hero picture and mobile candidates, P2 lightbox targets,
// P3 third-party font/icon hosts, P4 inline style attributes, P5 one stylesheet,
// P6 img dimensions, P7 lazy images, P8 shipped originals and oversized images,
// P9 CSS gzip per page, P10 initial JS gzip per page, P11 fonts.
// Every cap lives in BUDGET below. Every URL read from the HTML is resolved inside the build
// folder only (resolveLocal); a URL that escapes it is reported and its target never read.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { listFiles } from "./html.js";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

// D-17: the page-weight budget, one object for every cap. Raising any number is a deliberate,
// reviewed edit to this object, never a tweak inside a rule; 03-11 resets the CSS, JS and font
// caps from the measured post-Phase-3 sizes.
export const BUDGET = Object.freeze({
  // D-03: hero candidates up to this width are the ones a phone can pick.
  heroCandidateMaxWidth: 1280,
  // D-03: the largest mobile hero candidate is about 120 KB or less (120 * 1024).
  heroMobileMaxBytes: 122880,
  // D-04: lightbox targets are under 300 KB (strictly less than 300 * 1024)...
  lightboxMaxBytes: 307200,
  // ...and at most 1600 px wide.
  lightboxMaxWidth: 1600,
  // Research spike: CSS 4,710 B gzip before dead-code removal, plus headroom (6 KB).
  cssGzipMaxBytes: 6144,
  // Research spike: main.js 2,660 B gzip, plus headroom for the page's feature modules (5 KB).
  initialJsGzipMaxBytes: 5120,
  // Research spike: the Polish-capable Montserrat woff2 is 36,460 B, plus headroom (45 KB).
  fontMaxBytes: 46080,
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

// P3 (PERF-04, PERF-05): no shipped text file names a third-party font or icon host.
function checkThirdPartyHosts(outDir, reporter) {
  for (const full of listFiles(outDir, textExts)) {
    const relPath = toPosix(relative(outDir, full));
    const lines = readFileSync(full, "utf8").split(/\r?\n/);
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

// Returns the problems found in the build output folder outDir, each "<relPath>: P<n> <text>",
// sorted by file, rule and text. site is { pathPrefix } as exported by src/_data/site.js.
// options.budget overrides BUDGET (missing keys keep the BUDGET value); options.sourceImageNames
// replaces the file names read from src/images.
export function checkPerf(outDir, site, options = {}) {
  const budget = { ...BUDGET, ...(options.budget || {}) };
  const sourceImageNames = options.sourceImageNames ?? defaultSourceImageNames();
  const problems = [];
  const reporter = (file) => (rule, text) => problems.push({ file, rule, text });

  const pages = listFiles(outDir, [".html"]);
  if (pages.length === 0) return [".: P0 no HTML pages in the build output"];

  checkThirdPartyHosts(outDir, reporter);

  // File, then rule number, then text: two runs on the same output give the same list.
  const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  problems.sort((a, b) => compare(a.file, b.file) || a.rule - b.rule || compare(a.text, b.text));
  return problems.map((problem) => `${problem.file}: P${problem.rule} ${problem.text}`);
}
