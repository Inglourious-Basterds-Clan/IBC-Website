// D-05 / CONT-06: drafted-copy markers and FACTS.md stay in sync.
// Markers are TODO(FACTS-NN) in a template (an HTML comment) or `todo: "FACTS-NN"` (or a list
// of ids) in front matter, which the head renders as one <!-- TODO(FACTS-NN) --> per id. No draft ID is pinned here:
// the user confirms drafts and removes markers, and this suite must stay green through that.
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import { build, listFiles, repoRoot } from "./helpers.js";

const statuses = ["do potwierdzenia", "potwierdzone"];
const sourceExts = [".njk", ".md", ".html", ".js", ".css", ".json"];
const srcDir = join(repoRoot, "src");

// head.njk prints front-matter markers with this expression; it is the renderer, not a draft.
const markerRenderer = "TODO({{ id }})";

let rows;
let sources;

before(() => {
  rows = parseFacts(readFileSync(join(repoRoot, "FACTS.md"), "utf8"));
  sources = listFiles(srcDir, sourceExts).map((full) => ({
    relPath: relative(repoRoot, full).replace(/\\/g, "/"),
    text: readFileSync(full, "utf8"),
  }));
});

// [{ id, status }] for every "| FACTS-NN | ... | <status> |" table row.
function parseFacts(text) {
  return Array.from(text.matchAll(/^\|\s*(FACTS-\d+)\s*\|.*\|\s*([^|]*?)\s*\|\s*$/gm), (match) => ({
    id: match[1],
    status: match[2],
  }));
}

// FACTS-NN IDs of every marker in text: TODO(FACTS-NN) anywhere, plus every FACTS-NN in the
// value of the front-matter todo key (IN-08): quoted or not, a single id, a [flow, list] or
// an indented "- FACTS-NN" block list.
function markerIds(text) {
  const inline = Array.from(text.matchAll(/\bTODO\((FACTS-\d+)\)/g), (match) => match[1]);
  return [...inline, ...frontMatterTodoIds(text)];
}

function frontMatterTodoIds(text) {
  const frontMatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!frontMatter) return [];
  const lines = frontMatter[1].split(/\r?\n/);
  const start = lines.findIndex((line) => /^todo\s*:/.test(line));
  if (start === -1) return [];
  // The todo line, then its indented continuation lines (a block list).
  const value = [lines[start]];
  for (const line of lines.slice(start + 1)) {
    if (!/^\s+\S/.test(line)) break;
    value.push(line);
  }
  return Array.from(value.join("\n").matchAll(/FACTS-\d+/g), (match) => match[0]);
}

// Map of marker ID -> source files that carry it.
function sourceMarkers() {
  const found = new Map();
  for (const { relPath, text } of sources) {
    for (const id of markerIds(text)) {
      if (!found.has(id)) found.set(id, new Set());
      found.get(id).add(relPath);
    }
  }
  return found;
}

test("FACTS.md rows have unique IDs and a known status", () => {
  assert.ok(rows.length > 0, "FACTS.md has no FACTS-NN rows");
  const ids = rows.map((row) => row.id);
  assert.equal(new Set(ids).size, ids.length, `duplicate FACTS.md IDs: ${ids.join(", ")}`);
  for (const row of rows) {
    assert.ok(statuses.includes(row.status), `${row.id} has status "${row.status}", expected one of: ${statuses.join(", ")}`);
  }
});

test("src/ has no untracked TODO (every TODO is a TODO(FACTS-NN) marker)", () => {
  const untracked = [];
  for (const { relPath, text } of sources) {
    text.split(/\r?\n/).forEach((line, index) => {
      const cleaned = line.split(markerRenderer).join("");
      for (const match of cleaned.matchAll(/\bTODO\b(?!\(FACTS-\d+\))/g)) {
        untracked.push(`${relPath}:${index + 1}: ${match.input.trim()}`);
      }
    });
  }
  assert.deepEqual(untracked, [], `TODO without a FACTS-NN id (add a FACTS.md row and use TODO(FACTS-NN)):\n${untracked.join("\n")}`);
});

test("every marker has a FACTS.md row, every open row a marker, every confirmed row none", () => {
  const markers = sourceMarkers();
  const byId = new Map(rows.map((row) => [row.id, row]));
  for (const [id, files] of markers) {
    assert.ok(byId.has(id), `${id} (in ${[...files].join(", ")}) has no row in FACTS.md`);
    assert.notEqual(
      byId.get(id).status,
      "potwierdzone",
      `${id} is "potwierdzone" in FACTS.md but its marker is still in ${[...files].join(", ")}`,
    );
  }
  for (const row of rows) {
    if (row.status === "do potwierdzenia") {
      assert.ok(markers.has(row.id), `${row.id} is "do potwierdzenia" but no source file carries its marker`);
    }
  }
});

test("every source marker reaches the build output", () => {
  const outDir = build("facts-root", { INCLUDE_DEV_PAGES: "1" });
  const outputIds = new Set();
  for (const full of listFiles(outDir, [".html"])) {
    for (const match of readFileSync(full, "utf8").matchAll(/TODO\((FACTS-\d+)\)/g)) outputIds.add(match[1]);
  }
  for (const [id, files] of sourceMarkers()) {
    assert.ok(outputIds.has(id), `${id} (in ${[...files].join(", ")}) does not reach the output HTML, so G10 cannot see it`);
  }
});

// IN-08: the front-matter forms markerIds must see, so no drafted page escapes this cross-check.
test("markerIds reads every front-matter todo form", () => {
  const page = (todo) => `---\nlayout: x\n${todo}\ntitle: "y"\n---\n<p>body</p>\n`;
  assert.deepEqual(markerIds(page('todo: "FACTS-07"')), ["FACTS-07"]);
  assert.deepEqual(markerIds(page("todo: 'FACTS-07'")), ["FACTS-07"]);
  assert.deepEqual(markerIds(page("todo: FACTS-07")), ["FACTS-07"]);
  assert.deepEqual(markerIds(page('todo: ["FACTS-07", FACTS-08]')), ["FACTS-07", "FACTS-08"]);
  assert.deepEqual(markerIds(page("todo:\n  - FACTS-07\n  - \"FACTS-08\"")), ["FACTS-07", "FACTS-08"]);
  assert.deepEqual(markerIds(page("other: FACTS-09")), [], "a FACTS id outside the todo key is not a marker");
  assert.deepEqual(markerIds("<p>todo: FACTS-09</p>\n"), [], "body text is not front matter");
});

// IN-08: head.njk renders one TODO(FACTS-NN) comment per id, for a single id and for a list,
// with the Nunjucks that Eleventy itself uses.
test("head.njk renders one marker per front-matter todo id", () => {
  const eleventyRequire = createRequire(join(repoRoot, "node_modules", "@11ty", "eleventy", "cmd.cjs"));
  const nunjucks = eleventyRequire("nunjucks");
  const head = readFileSync(join(srcDir, "_includes", "partials", "head.njk"), "utf8");
  const line = head.split(/\r?\n/).find((text) => text.includes(markerRenderer));
  assert.ok(line, `head.njk has no line with ${markerRenderer}`);
  const render = (todo) => Array.from(nunjucks.renderString(line, { todo }).matchAll(/TODO\((FACTS-\d+)\)/g), (match) => match[1]);
  assert.deepEqual(render("FACTS-07"), ["FACTS-07"]);
  assert.deepEqual(render(["FACTS-07", "FACTS-08"]), ["FACTS-07", "FACTS-08"]);
  assert.deepEqual(render(undefined), []);
});
