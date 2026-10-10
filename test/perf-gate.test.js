// D-16/D-17 perf gate checks: rules in lib/check-perf.js, CLI scripts/check-perf.js
// Hand-written fixture folders go to _test/perf-gate-fixtures/<name>/, one per problem,
// each a valid build output with one thing broken.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { cleanEnv, repoRoot } from "./helpers.js";
import { checkPerf } from "../lib/check-perf.js";

const fixtureSite = { url: "https://fixture.example", pathPrefix: "/" };

// Write { relPath: string | Buffer } into a fresh _test/perf-gate-fixtures/<name>/ and return
// the folder. A null content leaves that file out.
function writeFixture(name, files) {
  const dir = join(repoRoot, "_test", "perf-gate-fixtures", name);
  rmSync(dir, { recursive: true, force: true });
  rmSync(`${dir}.rejected`, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const [relPath, content] of Object.entries(files)) {
    if (content === null) continue;
    const full = join(dir, relPath);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

function runGate(dir, env = {}) {
  return spawnSync(process.execPath, ["scripts/check-perf.js", "--dir", dir], {
    cwd: repoRoot,
    env: cleanEnv(env),
    encoding: "utf8",
  });
}

// One page with one stylesheet link and its css file.
function minimalSite() {
  return {
    "index.html": '<!doctype html><html lang="pl"><head><link rel="stylesheet" href="/css/style.css?v=0123456789"></head><body><p>IBC</p></body></html>\n',
    "css/style.css": "body{margin:0}\n",
  };
}

function googleFontsSite() {
  return {
    ...minimalSite(),
    "index.html":
      '<!doctype html><html lang="pl"><head>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat">\n</head><body></body></html>\n',
  };
}

test("clean minimal fixture passes the gate", () => {
  assert.deepEqual(checkPerf(writeFixture("clean-minimal", minimalSite()), fixtureSite), []);
});

test("P0 empty output folder is reported", () => {
  assert.deepEqual(checkPerf(writeFixture("empty", {}), fixtureSite), [".: P0 no HTML pages in the build output"]);
});

test("P3 Google Fonts stylesheet host fails", () => {
  const problems = checkPerf(writeFixture("p3-google-fonts", googleFontsSite()), fixtureSite);
  assert.ok(
    problems.some((problem) => problem.startsWith("index.html:") && problem.includes("P3")),
    `no P3 problem on index.html:\n${problems.join("\n")}`,
  );
});

test("CLI exits 0 with OK on a clean fixture", () => {
  writeFixture("cli-clean", minimalSite());
  const result = runGate("_test/perf-gate-fixtures/cli-clean");
  assert.equal(result.status, 0, `gate failed on a clean fixture:\n${result.stderr}`);
  assert.match(result.stdout, /check-perf: OK, 1 page\(s\) checked/);
  assert.ok(existsSync(join(repoRoot, "_test", "perf-gate-fixtures", "cli-clean", "index.html")), "a passing gate must leave the output in place");
});

// CR-02: a rejected build must leave nothing deployable behind, exactly like check-seo.
test("CLI moves a rejected build aside so no deployable index.html is left", () => {
  const dir = join(repoRoot, "_test", "perf-gate-fixtures", "cli-rejected");
  const rejected = `${dir}.rejected`;
  rmSync(rejected, { recursive: true, force: true });
  // Twice: the second run must replace the .rejected folder the first one left.
  for (let run = 1; run <= 2; run += 1) {
    rmSync(dir, { recursive: true, force: true });
    for (const [relPath, content] of Object.entries(googleFontsSite())) {
      mkdirSync(dirname(join(dir, relPath)), { recursive: true });
      writeFileSync(join(dir, relPath), content);
    }
    const result = runGate("_test/perf-gate-fixtures/cli-rejected");
    assert.equal(result.status, 1, `run ${run}: gate accepted a Google Fonts link:\n${result.stdout}`);
    assert.match(result.stderr, /check-perf: index\.html:\d+: P3 /);
    assert.match(result.stderr, /must not be deployed; moved to _test\/perf-gate-fixtures\/cli-rejected\.rejected/);
    assert.ok(!existsSync(join(dir, "index.html")), `run ${run}: rejected output still has a deployable index.html`);
    assert.ok(!existsSync(dir), `run ${run}: the rejected output folder is still in place`);
    assert.ok(existsSync(join(rejected, "index.html")), `run ${run}: the rejected output was not kept in ${rejected}`);
  }
});

// T-03-09: a crash inside the rules is a failed check, never a pass. A dangling link named
// like a page makes reading it throw. Skipped where this machine cannot create a link.
test("CLI rejects the output when the rules crash", (t) => {
  const dir = writeFixture("cli-crash", minimalSite());
  try {
    symlinkSync(join(dir, "missing-target"), join(dir, "broken.html"), process.platform === "win32" ? "junction" : "file");
  } catch (error) {
    t.skip(`cannot create a link here: ${error.code || error.message}`);
    return;
  }
  const result = runGate("_test/perf-gate-fixtures/cli-crash");
  assert.equal(result.status, 1, `gate passed although the rules crashed:\n${result.stdout}`);
  assert.match(result.stderr, /check-perf: crashed: /);
  assert.match(result.stderr, /must not be deployed; moved to _test\/perf-gate-fixtures\/cli-crash\.rejected/);
  assert.ok(!existsSync(dir), "a crashed check left the output folder in place");
});

test("CLI exits 1 when the build folder does not exist", () => {
  const result = runGate("_test/perf-gate-does-not-exist");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /check-perf: _test\/perf-gate-does-not-exist does not exist \(run eleventy first\)/);
});

test("CLI exits 1 with its own message when --dir is a file", () => {
  writeFixture("cli-dir-is-file", { "robots.txt": "User-agent: *\n" });
  const result = runGate("_test/perf-gate-fixtures/cli-dir-is-file/robots.txt");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /check-perf: _test\/perf-gate-fixtures\/cli-dir-is-file\/robots\.txt is not a folder/);
});
