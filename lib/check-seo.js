// Rules of the post-build SEO gate (SEO-08, D-19). scripts/check-seo.js is the CLI that
// `npm run build` runs after Eleventy; the tests import checkSite from here. Keeping the
// rules in a module and the CLI in a script that always runs means the CLI can never skip
// itself (CR-01: a main-module guard failed open under a symlinked or junctioned path).
// Reads the build output only, never writes. Node built-ins only.
// Rules: G0 empty output, G1 title, G2 canonical, G3 Open Graph/Twitter share tags, G4 description,
// G5 JSON-LD (parses, no Event/SportsTeam, home has Organization + WebSite), G6 no meta keywords,
// G7 sitemap, G8 robots.txt, G9 noindex both ways, G10 TODO markers (indexable builds only, D-19),
// G11 breadcrumbs (visible trail + matching BreadcrumbList on indexable subpages, none on home;
// SEO-06, D-17), G12 FAQPage JSON-LD equals the visible details.faq-item FAQ (D-05).
// Which pages are meant to be indexed comes from lib/seo.js, the predicate the templates use.
// The file and HTML helpers come from lib/html.js, the same copies the tests use (IN-02).
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { block, escapeRegExp, listFiles, visibleText } from "./html.js";
import { isIndexableUrl, outputPathToUrl } from "./seo.js";
import { readImageSize } from "./image-size.js";

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

// content of every <meta {attr}="{key}"> in head (attr is "property" or "name"; null for a tag
// without content). The closing quote keeps og:image from matching og:image:width.
function metaContents(head, attr, key) {
  const pattern = new RegExp(`<meta\\s[^>]*${attr}="${escapeRegExp(key)}"[^>]*>`, "gi");
  return Array.from(head.matchAll(pattern), (match) => {
    const content = /\scontent="([^"]*)"/i.exec(match[0]);
    return content ? content[1] : null;
  });
}

// G3 helper: exactly one tag, absolute and under base. Returns the URL or null.
function singleShareUrl(head, attr, key, base, report) {
  const values = metaContents(head, attr, key);
  const value = values.length === 1 ? values[0] : null;
  let problem = null;
  if (values.length === 0) problem = `missing ${key}`;
  else if (values.length > 1) problem = `${values.length} ${key} tags, expected exactly one`;
  else if (value === null || !/^https?:\/\//.test(value)) problem = `${key} "${value}" is not absolute`;
  else if (!value.startsWith(base)) problem = `${key} "${value}" is not under ${base}`;
  if (problem === null) return value;
  report(3, problem);
  return null;
}

// G3 (SEO-03, D-07): one absolute og:image and twitter:image under base, equal to each other;
// og:url equals the canonical; twitter:card is summary_large_image; the image file exists, its
// declared og:image:width/height (at most one of each) match the file, and indexable pages use
// a 1200x630 image.
// readSize(relPath) returns { width, height } for an output file, or null when it is unreadable.
function checkShareTags(head, page, base, outDir, readSize, report) {
  const ogImage = singleShareUrl(head, "property", "og:image", base, report);
  const twitterImage = singleShareUrl(head, "name", "twitter:image", base, report);
  if (ogImage !== null && twitterImage !== null && twitterImage !== ogImage) {
    report(3, `twitter:image "${twitterImage}" differs from og:image "${ogImage}"`);
  }

  const canonicals = canonicalHrefs(head);
  const canonical = canonicals.length === 1 && canonicals[0] !== null ? canonicals[0] : page.absolute;
  const ogUrls = metaContents(head, "property", "og:url");
  if (ogUrls.length !== 1) report(3, `${ogUrls.length} og:url tags, expected exactly one`);
  else if (ogUrls[0] !== canonical) report(3, `og:url is "${ogUrls[0]}", expected the canonical "${canonical}"`);

  const cards = metaContents(head, "name", "twitter:card");
  if (cards.length !== 1 || cards[0] !== "summary_large_image") {
    report(3, `twitter:card is "${cards.join(", ")}", expected exactly one "summary_large_image"`);
  }

  // og:image:width/height are optional, but at most one of each (IN-07): with two, only the
  // first would be compared and a conflicting second one would ship unchecked.
  const declaredSizes = new Map();
  for (const key of ["og:image:width", "og:image:height"]) {
    const declared = metaContents(head, "property", key);
    if (declared.length > 1) report(3, `${declared.length} ${key} tags, expected at most one`);
    declaredSizes.set(key, declared);
  }

  if (ogImage === null) return;
  const relPath = locToRelPath(ogImage.replace(/[?#].*$/, ""), base);
  const full = relPath === null ? null : join(outDir, relPath);
  if (full === null || !existsSync(full) || !statSync(full).isFile()) {
    return report(3, `og:image file ${relPath ?? ogImage} is missing from the output`);
  }
  const size = readSize(relPath);
  if (size === null) return report(3, `og:image file ${relPath} is not a readable PNG or JPEG`);
  for (const [key, actual] of [["og:image:width", size.width], ["og:image:height", size.height]]) {
    const declared = declaredSizes.get(key);
    if (declared.length === 1 && Number(declared[0]) !== actual) {
      report(3, `${key} ${declared[0]} does not match ${relPath} (${actual})`);
    }
  }
  if (isIndexableUrl(page.url) && (size.width !== 1200 || size.height !== 630)) {
    report(3, `og:image ${relPath} is ${size.width}x${size.height}, an indexable page needs 1200x630 (SEO-03)`);
  }
}

// Types that must never appear in JSON-LD (D-14): Event markup (unconfirmed claims) and the
// legacy sports-team type the old home page used.
const forbiddenJsonLdTypes = ["Event", "SportsTeam"];

// Inner text of every <script type="application/ld+json"> in html.
function jsonLdScripts(html) {
  return Array.from(html.matchAll(/<script\s[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi), (match) => match[1]);
}

// Every @type value anywhere in value (objects and arrays, recursively; array @types flattened).
function jsonLdTypes(value, found = []) {
  if (Array.isArray(value)) {
    for (const item of value) jsonLdTypes(item, found);
  } else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "@type") found.push(...[child].flat().filter((type) => typeof type === "string"));
      jsonLdTypes(child, found);
    }
  }
  return found;
}

// True when one parsed JSON-LD block (an @graph object, an array of nodes or a single node)
// holds both an Organization and a WebSite node at its top level.
function hasOrganizationAndWebsite(value) {
  let nodes = [value];
  if (Array.isArray(value)) nodes = value;
  else if (value !== null && typeof value === "object" && Array.isArray(value["@graph"])) nodes = value["@graph"];
  const types = nodes.flatMap((node) => (node !== null && typeof node === "object" ? [node["@type"]].flat() : []));
  return types.includes("Organization") && types.includes("WebSite");
}

// G5 (SEO-05, D-14): every JSON-LD block parses and holds no forbidden @type anywhere; the home
// page (index.html) carries at least one graph with both an Organization and a WebSite node.
function checkJsonLd(html, isHome, report) {
  let homeHasIdentity = false;
  for (const text of jsonLdScripts(html)) {
    let value;
    try {
      value = JSON.parse(text);
    } catch (error) {
      report(5, `invalid JSON-LD: ${error.message}`);
      continue;
    }
    const types = new Set(jsonLdTypes(value));
    for (const type of forbiddenJsonLdTypes) {
      if (types.has(type)) report(5, `forbidden @type ${type}`);
    }
    if (hasOrganizationAndWebsite(value)) homeHasIdentity = true;
  }
  if (isHome && !homeHasIdentity) report(5, "home page lacks Organization + WebSite JSON-LD");
}

// Flat list of the top-level JSON-LD nodes in html: the members of an @graph, the members of an
// array, or the single object. Blocks that do not parse are skipped (G5 already reports them).
function jsonLdNodes(html) {
  const nodes = [];
  for (const text of jsonLdScripts(html)) {
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      continue;
    }
    if (Array.isArray(value)) nodes.push(...value);
    else if (value !== null && typeof value === "object" && Array.isArray(value["@graph"])) nodes.push(...value["@graph"]);
    else nodes.push(value);
  }
  return nodes.filter((node) => node !== null && typeof node === "object" && !Array.isArray(node));
}

// The top-level JSON-LD nodes of html whose @type (a string or an array) includes type.
function jsonLdNodesOfType(html, type) {
  return jsonLdNodes(html).filter((node) => [node["@type"]].flat().includes(type));
}

// One space for every whitespace run, trimmed: how JSON-LD strings are compared with visible text.
function collapseSpace(text) {
  return text.replace(/\s+/g, " ").trim();
}

// The visible breadcrumb trail (D-17): the first <nav> whose class list holds "breadcrumbs".
const breadcrumbNavPattern = /<nav\s[^>]*class="[^"]*\bbreadcrumbs\b[^"]*"[^>]*>([\s\S]*?)<\/nav>/i;

// G11 helper: validates one BreadcrumbList node. Returns [{ name, item }] when it is valid,
// null after reporting its problems.
function breadcrumbEntries(list, page, base, report) {
  const elements = list.itemListElement;
  if (!Array.isArray(elements) || elements.length < 2) {
    report(11, `itemListElement must list at least 2 ListItems, found ${Array.isArray(elements) ? elements.length : "none"}`);
    return null;
  }
  let valid = true;
  const problem = (text) => {
    report(11, text);
    valid = false;
  };
  const entries = elements.map((element, index) => {
    const position = index + 1;
    const node = element !== null && typeof element === "object" ? element : {};
    if (node["@type"] !== "ListItem") problem(`breadcrumb item ${position} @type is "${node["@type"]}", expected "ListItem"`);
    if (node.position !== position) problem(`breadcrumb item ${position} has position ${JSON.stringify(node.position)}, expected ${position}`);
    if (typeof node.name !== "string" || node.name.trim() === "") problem(`breadcrumb item ${position} has an empty name`);
    if (typeof node.item !== "string" || !node.item.startsWith(base)) {
      problem(`breadcrumb item ${position} item "${node.item}" is not an absolute URL under ${base}`);
    }
    return { name: typeof node.name === "string" ? collapseSpace(node.name) : "", item: node.item };
  });
  if (entries[0].item !== base) problem(`first breadcrumb item is "${entries[0].item}", expected the home URL "${base}"`);
  const last = entries[entries.length - 1].item;
  if (last !== page.absolute) problem(`last breadcrumb item is "${last}", expected the canonical "${page.absolute}"`);
  return valid ? entries : null;
}

// G11 (SEO-06, D-17): the home page carries neither a BreadcrumbList nor a visible trail; every
// other indexable page carries exactly one valid BreadcrumbList (positions 1..n, non-empty names,
// items absolute under base, first item the home URL, last item the page canonical) and a visible
// <nav class="breadcrumbs"> whose link texts and hrefs equal the JSON-LD names and items.
// 404.html and /_dev/ pages are exempt.
function checkBreadcrumbs(page, site, base, report) {
  const lists = jsonLdNodesOfType(page.html, "BreadcrumbList");
  const nav = breadcrumbNavPattern.exec(page.html);
  if (page.relPath === "index.html") {
    if (lists.length > 0) report(11, "home page must not carry a BreadcrumbList (D-17)");
    if (nav !== null) report(11, "home page must not show breadcrumbs (D-17)");
    return;
  }
  if (!isIndexableUrl(page.url)) return;

  let entries = null;
  if (lists.length === 0) report(11, "missing BreadcrumbList JSON-LD on an indexable subpage (SEO-06)");
  else if (lists.length > 1) report(11, `${lists.length} BreadcrumbList nodes, expected exactly one`);
  else entries = breadcrumbEntries(lists[0], page, base, report);

  if (nav === null) return report(11, 'missing visible <nav class="breadcrumbs"> (SEO-06)');
  if (entries === null) return;

  const links = Array.from(nav[1].matchAll(/<a\s[^>]*>[\s\S]*?<\/a>/gi), (match) => {
    const href = /\shref="([^"]*)"/i.exec(match[0]);
    return { text: visibleText(match[0]), href: href ? href[1] : null };
  });
  if (links.length !== entries.length) {
    return report(11, `visible breadcrumbs show ${links.length} links, the BreadcrumbList has ${entries.length} items`);
  }
  for (const [index, link] of links.entries()) {
    const entry = entries[index];
    const position = index + 1;
    if (link.text !== entry.name) {
      return report(11, `visible breadcrumb ${position} text "${link.text}" differs from the BreadcrumbList name "${entry.name}"`);
    }
    // Hrefs are root-relative (HtmlBasePlugin adds the path prefix); site.url makes them absolute.
    const resolved = link.href === null ? null : /^https?:\/\//.test(link.href) ? link.href : site.url + link.href;
    if (resolved !== entry.item) {
      return report(11, `visible breadcrumb ${position} href "${link.href}" resolves to "${resolved}", expected the BreadcrumbList item "${entry.item}"`);
    }
  }
}

// G12 helper: the visible FAQ, one { question, answer } per <details class="… faq-item …">.
// question is the visible text of its <summary>, answer the visible text after </summary>
// (lib/html.js visibleText: comments such as a TODO(FACTS-NN) marker dropped, entities decoded).
function visibleFaq(html) {
  return Array.from(html.matchAll(/<details\s[^>]*class="[^"]*\bfaq-item\b[^"]*"[^>]*>([\s\S]*?)<\/details>/gi), (match) => {
    const summary = /<summary(?=[\s>])[^>]*>([\s\S]*?)<\/summary>/i.exec(match[1]);
    if (summary === null) return { question: "", answer: visibleText(match[1]) };
    return { question: visibleText(summary[1]), answer: visibleText(match[1].slice(summary.index + summary[0].length)) };
  });
}

// G12 (D-05, Pitfall 6): a FAQPage JSON-LD node and the visible <details class="faq-item"> list
// exist together or not at all, there is at most one FAQPage, every Question has a non-empty name
// and acceptedAnswer.text, and the questions and answers equal the visible ones in count and order.
// JSON-LD strings are compared after whitespace collapse only (JSON.parse already gives raw text).
function checkFaq(page, report) {
  const faqPages = jsonLdNodesOfType(page.html, "FAQPage");
  const visible = visibleFaq(page.html);
  if (faqPages.length === 0 && visible.length === 0) return;
  if (faqPages.length > 1) return report(12, `${faqPages.length} FAQPage nodes, expected at most one`);
  if (faqPages.length === 0) return report(12, `visible FAQ (${visible.length} details.faq-item) without FAQPage JSON-LD (D-05)`);
  if (visible.length === 0) return report(12, "FAQPage JSON-LD without a visible FAQ (details.faq-item) (D-05)");

  const mainEntity = faqPages[0].mainEntity;
  if (!Array.isArray(mainEntity) || mainEntity.length === 0) {
    return report(12, "FAQPage mainEntity must be a non-empty array of Questions");
  }
  let valid = true;
  const questions = mainEntity.map((entry, index) => {
    const position = index + 1;
    const node = entry !== null && typeof entry === "object" ? entry : {};
    const answer = node.acceptedAnswer !== null && typeof node.acceptedAnswer === "object" ? node.acceptedAnswer.text : undefined;
    if (node["@type"] !== "Question") {
      report(12, `FAQPage question ${position} @type is "${node["@type"]}", expected "Question"`);
      valid = false;
    }
    if (typeof node.name !== "string" || node.name.trim() === "") {
      report(12, `FAQPage question ${position} has an empty name`);
      valid = false;
    }
    if (typeof answer !== "string" || answer.trim() === "") {
      report(12, `FAQPage question ${position} has an empty acceptedAnswer.text`);
      valid = false;
    }
    return { question: typeof node.name === "string" ? collapseSpace(node.name) : "", answer: typeof answer === "string" ? collapseSpace(answer) : "" };
  });
  if (!valid) return;
  if (questions.length !== visible.length) {
    return report(12, `${visible.length} visible FAQ items but ${questions.length} FAQPage questions`);
  }

  const questionIndex = questions.findIndex((entry, index) => entry.question !== visible[index].question);
  if (questionIndex !== -1) {
    report(12, `question ${questionIndex + 1} "${questions[questionIndex].question}" differs from the visible summary "${visible[questionIndex].question}"`);
  }
  const answerIndex = questions.findIndex((entry, index) => entry.answer !== visible[index].answer);
  if (answerIndex !== -1) {
    report(12, `answer ${answerIndex + 1} "${questions[answerIndex].answer}" differs from the visible answer "${visible[answerIndex].answer}"`);
  }
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
  // Both separators (IN-04): on Windows path.join treats "\" as one too, so "a\..\..\x"
  // would otherwise resolve outside outDir.
  if (rest.split(/[\\/]/).some((segment) => segment === ".." || segment === ".")) return null;
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
  // Any spelling that blocks the whole site (WR-05): "Disallow:/", "Disallow: /*",
  // extra spaces, any case, a trailing # comment.
  if (lines.some((line) => /^disallow\s*:\s*\/\*?\s*(#.*)?$/i.test(line))) {
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

  // og:image files are shared by most pages: read each header once.
  const sizes = new Map();
  const readSize = (relPath) => {
    if (!sizes.has(relPath)) sizes.set(relPath, readImageSize(readFileSync(join(outDir, relPath))));
    return sizes.get(relPath);
  };

  const titled = [];
  for (const page of pages) {
    const report = reporter(page.relPath);
    const head = block(page.html, "head");
    const title = checkTitle(head, report);
    if (title !== null && isIndexableUrl(page.url)) titled.push({ relPath: page.relPath, title });
    checkCanonical(head, page.absolute, report);
    checkShareTags(head, page, base, outDir, readSize, report);
    if (isIndexableUrl(page.url)) checkDescription(head, report);
    checkJsonLd(page.html, page.relPath === "index.html", report);
    checkBreadcrumbs(page, site, base, report);
    checkFaq(page, report);
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
