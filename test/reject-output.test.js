// CR-01 checks: the post-build gates (via lib/reject-output.js) may only move or delete build
// output, _site or a folder under _test/. These tests never point a gate or a helper at a real
// source folder: unit tests use a throwaway fake repo root in the OS temp dir, CLI tests use a
// gitignored .cache/ fixture folder.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { cleanEnv, repoRoot } from "./helpers.js";
import { isDisposableOutput, removeRejectedOutput } from "../lib/reject-output.js";

const gateEnv = { SITE_URL: "https://guard.example" };

// A fresh fake repo root in the OS temp dir, removed by the caller in a finally.
function makeFakeRoot() {
  return mkdtempSync(join(tmpdir(), "ibc-cr01-"));
}

function writeFile(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

test("isDisposableOutput accepts only _site and folders under _test/", () => {
  const fakeRoot = makeFakeRoot();
  try {
    for (const rel of ["_site", "_test/a", "_test/a/b"]) {
      assert.equal(isDisposableOutput(join(fakeRoot, rel), fakeRoot), true, `${rel} should be build output`);
    }
    const refused = ["src", ".git", "node_modules", "lib", ".planning", ".cache/x", "_sitex", "_site/sub", "_test", "_test-x"];
    for (const rel of refused) {
      assert.equal(isDisposableOutput(join(fakeRoot, rel), fakeRoot), false, `${rel} must not be build output`);
    }
    assert.equal(isDisposableOutput(fakeRoot, fakeRoot), false, "the repo root must not be build output");
    assert.equal(isDisposableOutput(dirname(fakeRoot), fakeRoot), false, "the repo root's parent must not be build output");
    assert.equal(isDisposableOutput(join(dirname(fakeRoot), "_site"), fakeRoot), false, "a sibling _site must not be build output");
  } finally {
    rmSync(fakeRoot, { recursive: true, force: true });
  }
});

test("removeRejectedOutput leaves source folders in place and still says DO NOT DEPLOY IT", () => {
  const fakeRoot = makeFakeRoot();
  try {
    writeFile(join(fakeRoot, "src", "keep.txt"), "source");
    writeFile(join(fakeRoot, ".git", "HEAD"), "ref: refs/heads/main\n");
    for (const name of ["src", ".git"]) {
      const disposition = removeRejectedOutput(join(fakeRoot, name), fakeRoot);
      assert.match(disposition, /DO NOT DEPLOY IT$/, `${name}: ${disposition}`);
      assert.match(disposition, /is not build output/);
      assert.ok(!existsSync(join(fakeRoot, `${name}.rejected`)), `${name}.rejected was created`);
    }
    assert.ok(existsSync(join(fakeRoot, "src", "keep.txt")), "src/keep.txt was moved or deleted");
    assert.ok(existsSync(join(fakeRoot, ".git", "HEAD")), ".git/HEAD was moved or deleted");
  } finally {
    rmSync(fakeRoot, { recursive: true, force: true });
  }
});

test("removeRejectedOutput refuses lookalikes of the allow-list", () => {
  const fakeRoot = makeFakeRoot();
  try {
    for (const rel of ["_sitex", "_site/sub", "_test", "_test-x"]) {
      writeFile(join(fakeRoot, rel, "index.html"), "<p>kept</p>");
      const disposition = removeRejectedOutput(join(fakeRoot, rel), fakeRoot);
      assert.match(disposition, /DO NOT DEPLOY IT$/, `${rel}: ${disposition}`);
      assert.ok(existsSync(join(fakeRoot, rel, "index.html")), `${rel}/index.html was moved or deleted`);
      assert.ok(!existsSync(join(fakeRoot, `${rel}.rejected`)), `${rel}.rejected was created`);
    }
  } finally {
    rmSync(fakeRoot, { recursive: true, force: true });
  }
});

test("removeRejectedOutput still moves a rejected _site aside (CR-02 unchanged)", () => {
  const fakeRoot = makeFakeRoot();
  try {
    writeFile(join(fakeRoot, "_site", "index.html"), "<p>rejected</p>");
    writeFile(join(fakeRoot, "_site.rejected", "old.html"), "<p>older</p>");
    const disposition = removeRejectedOutput(join(fakeRoot, "_site"), fakeRoot);
    assert.equal(disposition, "moved to _site.rejected, nothing is left in _site");
    assert.ok(!existsSync(join(fakeRoot, "_site")), "_site is still in place");
    assert.ok(existsSync(join(fakeRoot, "_site.rejected", "index.html")), "_site was not moved to _site.rejected");
    assert.ok(!existsSync(join(fakeRoot, "_site.rejected", "old.html")), "the older _site.rejected was not replaced");
  } finally {
    rmSync(fakeRoot, { recursive: true, force: true });
  }
});

// The fixture has no HTML, so check-seo fails with G0 and check-perf with P0: both reach the
// rejection path with a folder that is not build output.
test("CLI gates fail on a non-output folder but leave it in place", () => {
  const fixtureRel = ".cache/reject-output-fixture";
  const fixture = join(repoRoot, ".cache", "reject-output-fixture");
  try {
    for (const script of ["scripts/check-seo.js", "scripts/check-perf.js"]) {
      rmSync(fixture, { recursive: true, force: true });
      rmSync(`${fixture}.rejected`, { recursive: true, force: true });
      writeFile(join(fixture, "keep.txt"), "not build output");
      const result = spawnSync(process.execPath, [script, "--dir", fixtureRel], {
        cwd: repoRoot,
        env: cleanEnv(gateEnv),
        encoding: "utf8",
      });
      assert.equal(result.status, 1, `${script} accepted a folder without HTML:\n${result.stdout}${result.stderr}`);
      assert.match(result.stderr, /must not be deployed; \.cache\/reject-output-fixture is not build output/, `${script}:\n${result.stderr}`);
      assert.match(result.stderr, /DO NOT DEPLOY IT/, `${script}:\n${result.stderr}`);
      assert.ok(existsSync(join(fixture, "keep.txt")), `${script} moved or deleted the fixture`);
      assert.ok(!existsSync(`${fixture}.rejected`), `${script} created a .rejected sibling`);
    }
  } finally {
    rmSync(fixture, { recursive: true, force: true });
    rmSync(`${fixture}.rejected`, { recursive: true, force: true });
  }
});

// scripts/clean.js shares the allow-list. Never pass src, .git or lib to the real clean.js:
// a refusal is proven on a gitignored .cache/ folder instead.
function runClean(target) {
  return spawnSync(process.execPath, ["scripts/clean.js", target], { cwd: repoRoot, encoding: "utf8" });
}

test("clean.js refuses a folder that is not build output and leaves it in place", () => {
  const fixture = join(repoRoot, ".cache", "reject-output-fixture");
  try {
    writeFile(join(fixture, "keep.txt"), "not build output");
    const result = runClean(".cache/reject-output-fixture");
    assert.equal(result.status, 1, `clean.js removed a non-output folder:\n${result.stderr}`);
    assert.match(result.stderr, /refusing/);
    assert.match(result.stderr, /only _site or a folder under _test\//);
    assert.ok(existsSync(join(fixture, "keep.txt")), "clean.js deleted the .cache fixture");
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("clean.js removes a folder under _test/", () => {
  const staleDir = join(repoRoot, "_test", "reject-output-stale");
  try {
    writeFile(join(staleDir, "index.html"), "<p>stale</p>");
    const result = runClean("_test/reject-output-stale");
    assert.equal(result.status, 0, `clean.js failed:\n${result.stderr}`);
    assert.ok(!existsSync(staleDir), "_test/reject-output-stale still exists");
  } finally {
    rmSync(staleDir, { recursive: true, force: true });
  }
});

// WR-04: never aim the real clean.js at the real repo root. clean.js takes its repo root from
// its own location, so a copy of it (and its one import) in a throwaway root is refused there
// instead. The copy sits one level down, so ".." is still inside the throwaway folder and a
// regression in isDisposableOutput can only delete temp files, never the working copy or tmpdir.
test("clean.js still refuses the repo root and its parent", () => {
  const fakeParent = makeFakeRoot();
  const fakeRoot = join(fakeParent, "repo");
  try {
    for (const rel of ["scripts/clean.js", "lib/reject-output.js"]) {
      writeFile(join(fakeRoot, rel), readFileSync(join(repoRoot, rel)));
    }
    writeFile(join(fakeRoot, "package.json"), '{"type":"module"}\n');
    for (const target of [".", ".."]) {
      const result = spawnSync(process.execPath, ["scripts/clean.js", target], { cwd: fakeRoot, encoding: "utf8" });
      assert.equal(result.status, 1, `clean.js ${target} should exit 1:\n${result.stderr}`);
      assert.match(result.stderr, /refusing/);
    }
    assert.ok(existsSync(join(fakeRoot, "package.json")), "clean.js deleted the fake repo root");
  } finally {
    rmSync(fakeParent, { recursive: true, force: true });
  }
});
