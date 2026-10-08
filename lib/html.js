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
