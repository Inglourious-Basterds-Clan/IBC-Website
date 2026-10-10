// D-01 dependency guard: the root lockfile. sharp joins the site build through
// @11ty/eleventy-img, so the lockfile must resolve exactly one sharp, at least the
// human-vetted 0.35.5 (GHSA-wq5f-xc86-pv6w), pinned by package.json overrides, with the
// linux-x64 binaries CI's `npm ci` needs (Pitfall 8). Files are read with readFileSync:
// sharp's exports block require("sharp/package.json").
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./helpers.js";

const minimumSharp = "0.35.5";

function readJson(relPath) {
  return JSON.parse(readFileSync(join(repoRoot, relPath), "utf8"));
}

// True when the dotted numeric version is >= minimum (e.g. atLeast("0.35.10", "0.35.5")).
function atLeast(version, minimum) {
  const parts = String(version).split(".").map(Number);
  const floor = minimum.split(".").map(Number);
  if (parts.length !== floor.length || parts.some(Number.isNaN)) return false;
  for (let i = 0; i < floor.length; i += 1) {
    if (parts[i] !== floor[i]) return parts[i] > floor[i];
  }
  return true;
}

const pkg = readJson("package.json");
const lock = readJson("package-lock.json");

test("lockfile sharp is the vetted version pinned by overrides", () => {
  const sharp = lock.packages["node_modules/sharp"];
  assert.ok(sharp, "package-lock.json has no node_modules/sharp entry");
  assert.ok(atLeast(sharp.version, minimumSharp), `sharp ${sharp.version} is below ${minimumSharp}`);
  assert.equal(sharp.version, pkg.overrides?.sharp, "lockfile sharp must equal package.json overrides.sharp");
});

test("atLeast rejects a version below the vetted one (negative control)", () => {
  assert.equal(atLeast("0.35.4", minimumSharp), false);
  assert.equal(atLeast("0.34.9", minimumSharp), false);
  assert.equal(atLeast("0.35.5", minimumSharp), true);
  assert.equal(atLeast("0.35.10", minimumSharp), true);
  assert.equal(atLeast("garbage", minimumSharp), false);
});

test("exactly one sharp in the tree", () => {
  const nested = Object.keys(lock.packages).filter(
    (key) => key.endsWith("/node_modules/sharp") || key.endsWith("node_modules/@11ty/eleventy-img/node_modules/sharp"),
  );
  assert.deepEqual(nested, [], `nested sharp copies: ${nested.join(", ")}`);
});

test("lockfile records the linux-x64 sharp binaries CI needs (Pitfall 8)", () => {
  for (const key of ["node_modules/@img/sharp-linux-x64", "node_modules/@img/sharp-libvips-linux-x64"]) {
    assert.ok(lock.packages[key], `package-lock.json has no ${key} entry (npm ci on ubuntu would fail)`);
  }
});

test("eleventy-img is pinned exactly", () => {
  assert.equal(pkg.devDependencies["@11ty/eleventy-img"], "7.0.0");
  assert.equal(lock.packages["node_modules/@11ty/eleventy-img"]?.version, "7.0.0");
});

test("installed sharp matches the lockfile", () => {
  const installed = readJson("node_modules/sharp/package.json");
  assert.equal(installed.version, lock.packages["node_modules/sharp"].version);
});
