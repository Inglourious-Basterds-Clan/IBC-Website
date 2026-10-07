// D-05 / CONT-06: drafted-copy markers and FACTS.md stay in sync.
// Markers are TODO(FACTS-NN) in a template (an HTML comment) or `todo: "FACTS-NN"` in front
// matter, which the head renders as <!-- TODO(FACTS-NN) -->. No draft ID is pinned here:
// the user confirms drafts and removes markers, and this suite must stay green through that.
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { build, listFiles, repoRoot } from "./helpers.js";

const statuses = ["do potwierdzenia", "potwierdzone"];
const sourceExts = [".njk", ".md", ".html", ".js", ".css", ".json"];
const srcDir = join(repoRoot, "src");

// head.njk prints front-matter markers with this expression; it is the renderer, not a draft.
const markerRenderer = "TODO({{ todo }})";

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

// FACTS-NN IDs of every marker in text: TODO(FACTS-NN) anywhere, todo: "FACTS-NN" in front matter.
function markerIds(text) {
  const inline = Array.from(text.matchAll(/\bTODO\((FACTS-\d+)\)/g), (match) => match[1]);
  const frontMatter = Array.from(text.matchAll(/^todo:\s*"(FACTS-\d+)"\s*$/gm), (match) => match[1]);
  return [...inline, ...frontMatter];
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
