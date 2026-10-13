// Build-time code outside src/ (Eleventy never renders it). Small file and HTML helpers shared by
// the SEO gate (lib/check-seo.js, scripts/check-seo.js) and the tests (test/helpers.js), so the
// gate and the tests always read the build output the same way (IN-02). Node built-ins only.
import { readdirSync } from "node:fs";
import { extname, join } from "node:path";

export function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

// The entities Nunjucks autoescape writes (& " ' < > \); Polish letters and „ ” pass through.
const namedEntities = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">", "&#92;": "\\" };

// Visible text of an HTML fragment, compared with JSON-LD strings (Pitfall 6, D-05): HTML comments
// and tags removed, the autoescape entities plus numeric &#NNN; / &#xHH; decoded in one pass (so
// "&amp;lt;" stays "&lt;"), whitespace runs collapsed to one space, trimmed. Shared by the tests
// and the SEO gate so both compare visible text the same way (IN-02).
export function visibleText(fragment) {
  return fragment
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:amp|quot|lt|gt|#39|#92);|&#(\d+);|&#[xX]([0-9a-fA-F]+);/g, (entity, dec, hex) => {
      if (dec) return String.fromCodePoint(Number(dec));
      if (hex) return String.fromCodePoint(parseInt(hex, 16));
      return namedEntities[entity];
    })
    .replace(/\s+/g, " ")
    .trim();
}
