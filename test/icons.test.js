// PERF-05 / D-11 icon checks: every icon is an inline SVG rendered by the {% icon %} shortcode
// from lib/icons.js (Font Awesome Free 6.0.0 brand paths, CC BY 4.0). renderIcon throws on an
// empty, missing, unknown or inherited icon name and on an invalid extra class, so a typo
// fails the build instead of emitting empty markup. The build-output checks run on a root
// build: the footer icon-only links are named by their aria-label and hold one aria-hidden SVG,
// every SVG is hidden from screen readers, the text buttons keep their visible text next to the
// icon, and no shipped text file references the Font Awesome CDN or its classes (T-03-24).
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { build, listFiles, read, repoRoot } from "./helpers.js";
import site from "../src/_data/site.js";
import { iconPaths, renderIcon } from "../lib/icons.js";

function svgTags(html) {
  return Array.from(html.matchAll(/<svg\b[^>]*>/g), (match) => match[0]);
}

test("renderIcon('discord') is one accessible-hidden inline svg (D-11)", () => {
  const svg = renderIcon("discord");
  assert.equal(svgTags(svg).length, 1, `expected one <svg>, got:\n${svg}`);
  const [tag] = svgTags(svg);
  assert.match(tag, /\sclass="icon icon-discord"/);
  assert.match(tag, /\saria-hidden="true"/);
  assert.match(tag, /\sfocusable="false"/);
  assert.match(tag, /\sviewBox="0 0 640 512"/);
  assert.match(tag, /\sfill="currentColor"/);
  assert.equal((svg.match(/<path\b/g) || []).length, 1, "expected exactly one <path>");
  assert.match(svg, /<path d="M[^"]+"\/><\/svg>$/);
  assert.ok(!svg.includes("\n"), "the svg must be a single line");
});

test("youtube and facebook keep their Font Awesome viewBoxes (D-15)", () => {
  assert.match(renderIcon("youtube"), /\sviewBox="0 0 576 512"/);
  assert.match(renderIcon("youtube"), /\sclass="icon icon-youtube"/);
  assert.match(renderIcon("facebook"), /\sviewBox="0 0 512 512"/);
  assert.match(renderIcon("facebook"), /\sclass="icon icon-facebook"/);
});

test("renderIcon adds a valid extra class and rejects an invalid one (T-03-14)", () => {
  assert.match(renderIcon("discord", "recruitment-cta-icon"), /\sclass="icon icon-discord recruitment-cta-icon"/);
  assert.throws(() => renderIcon("discord", "bad class"), /class/i);
  assert.throws(() => renderIcon("discord", '"><script>'), /class/i);
});

test("renderIcon throws on an empty, missing, unknown or inherited name (PERF-05 empty edge)", () => {
  for (const name of ["", undefined, "nope", "toString", "__proto__"]) {
    assert.throws(() => renderIcon(name), /Unknown icon/, `renderIcon(${JSON.stringify(name)}) did not throw`);
  }
});

test("every site.social id has an icon", () => {
  assert.ok(site.social.length > 0, "site.social is empty");
  for (const { id } of site.social) {
    assert.ok(Object.hasOwn(iconPaths, id), `site.social id "${id}" has no entry in lib/icons.js`);
  }
});

test("lib/icons.js keeps the Font Awesome licence", () => {
  const source = readFileSync(join(repoRoot, "lib/icons.js"), "utf8");
  assert.ok(source.includes("Font Awesome Free 6.0.0"), "the Font Awesome version line is missing");
  assert.ok(source.includes("CC BY 4.0"), "the CC BY 4.0 icon licence is missing");
});

// --- Build-output checks (PERF-05, D-11) ---

let outDir;

before(() => {
  outDir = build("icons-root");
});

test("the footer social links are named and hold one aria-hidden icon each (D-11)", () => {
  const html = read(outDir, "index.html");
  const footer = html.slice(html.indexOf("<footer"), html.indexOf("</footer>"));
  const links = Array.from(footer.matchAll(/<a\s[^>]*class="social-icon"[^>]*>([\s\S]*?)<\/a>/g));
  const expectedIds = ["discord", ...site.social.map((s) => s.id)];
  assert.equal(links.length, expectedIds.length, `expected ${expectedIds.length} social-icon links, got ${links.length}`);
  links.forEach((match, index) => {
    const [whole, inner] = match;
    const label = /\saria-label="([^"]*)"/.exec(whole);
    assert.ok(label && label[1].trim() !== "", `social link ${index} has no aria-label:\n${whole}`);
    const svgs = svgTags(inner);
    assert.equal(svgs.length, 1, `social link "${label[1]}" holds ${svgs.length} svgs, expected 1`);
    assert.match(svgs[0], new RegExp(`\\sclass="icon icon-${expectedIds[index]}"`));
    assert.match(svgs[0], /\saria-hidden="true"/);
    assert.ok(!/<i\b/.test(inner), `social link "${label[1]}" still holds a Font Awesome <i>`);
  });
});

const shippedTextExts = [".html", ".css", ".js", ".xml", ".txt", ".webmanifest", ".config", ".json"];
// A class token fab or fa-<name> anywhere in a shipped file (HTML class, CSS selector, JS string).
const faClassPattern = /(?<![\w-])\.?(fab|fa-[a-z][\w-]*)(?![\w-])/;

function outName(file) {
  return relative(outDir, file).split("\\").join("/");
}

// Every <a>…</a> whose inner markup contains text.
function anchorsWithText(html, text) {
  return Array.from(html.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)).filter((match) => match[1].includes(text));
}

test("no shipped text file references the Font Awesome CDN or its classes (PERF-05, T-03-24)", () => {
  const files = listFiles(outDir, shippedTextExts);
  assert.ok(files.length > 0, "no text files in the build");
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    const where = outName(file);
    assert.ok(!text.includes("cdnjs.cloudflare.com"), `${where} references cdnjs.cloudflare.com`);
    assert.ok(!/font-awesome/i.test(text), `${where} references font-awesome`);
    const token = faClassPattern.exec(text);
    assert.equal(token, null, `${where} carries the Font Awesome class token "${token && token[0]}"`);
  }
});

test("every svg in every page is hidden from screen readers (D-11)", () => {
  const pages = listFiles(outDir, [".html"]);
  let count = 0;
  for (const page of pages) {
    for (const tag of svgTags(readFileSync(page, "utf8"))) {
      count += 1;
      const where = `${outName(page)}: ${tag.slice(0, 80)}`;
      assert.match(tag, /\saria-hidden="true"/, `${where} lacks aria-hidden="true"`);
      assert.match(tag, /\sfocusable="false"/, `${where} lacks focusable="false"`);
      assert.match(tag, /\sclass="[^"]*\bicon\b[^"]*"/, `${where} has no icon class`);
    }
  }
  assert.ok(count > 0, "no svg found in any page");
});

test("the text buttons keep their visible text next to a hidden Discord icon (D-11, D-15)", () => {
  const home = read(outDir, "index.html");
  const header = home.slice(home.indexOf("<header"), home.indexOf("</header>"));
  const cases = [
    { where: "header CTA", html: header, text: "Discord", marker: 'class="hud-btn header-cta"' },
    { where: "404 Discord button", html: read(outDir, "404.html"), text: "Dołącz na Discordzie" },
    { where: "recruitment button", html: home, text: "Wejdź na Discord", iconClass: "icon icon-discord recruitment-cta-icon" },
  ];
  for (const { where, html, text, marker, iconClass = "icon icon-discord" } of cases) {
    const matches = anchorsWithText(html, text).filter((match) => !marker || match[0].includes(marker));
    assert.equal(matches.length, 1, `expected one ${where} with "${text}", got ${matches.length}`);
    const inner = matches[0][1];
    const svgs = svgTags(inner);
    assert.equal(svgs.length, 1, `${where} holds ${svgs.length} svgs, expected 1`);
    assert.ok(svgs[0].includes(`class="${iconClass}"`), `${where} icon is not class="${iconClass}":\n${svgs[0]}`);
    assert.ok(!/<i\b/.test(inner), `${where} still holds a Font Awesome <i>`);
  }
});
