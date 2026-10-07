// D-01..D-04 contract for .github/workflows/pages.yml: build + test on every PR and push,
// deploy only on push to main, and elevated permissions only on the deploy job (which runs no npm).
// The build job env must carry SITE_URL, because production builds refuse to run without it.
// The YAML is read as text so no YAML dependency is needed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { repoRoot } from "./helpers.js";
import path from "node:path";

const inviteDomainPattern = /(?:https?:\/\/)?(?:www\.)?discord(?:\.gg|(?:app)?\.com\/invite)\/[A-Za-z0-9-]+/;

const workflow = readFileSync(path.join(repoRoot, ".github", "workflows", "pages.yml"), "utf8").replace(/\r\n/g, "\n");
const lines = workflow.split("\n");
const deployLine = lines.indexOf("  deploy:");
const buildPart = lines.slice(0, Math.max(deployLine, 0)).join("\n");
const deployPart = lines.slice(Math.max(deployLine, 0)).join("\n");
const header = workflow.slice(0, workflow.indexOf("\njobs:"));

function indexOrFail(text, needle) {
  const index = text.indexOf(needle);
  assert.ok(index >= 0, `missing: ${needle}`);
  return index;
}

test("workflow has a build job and a separate deploy job", () => {
  assert.ok(deployLine > 0, "no '  deploy:' job line");
  assert.ok(workflow.includes("\njobs:\n"), "no jobs: block");
  assert.ok(buildPart.includes("\n  build:\n"), "no build job");
});

test("(a) triggers: push to main, pull_request, workflow_dispatch", () => {
  assert.match(header, /\n {2}push:\n {4}branches: \[main\]\n/);
  assert.match(header, /\n {2}pull_request:\n/);
  assert.match(header, /\n {2}workflow_dispatch:\n/);
});

test("(b) workflow-level permission is contents: read only", () => {
  assert.match(header, /\npermissions:\n {2}contents: read\n/);
  assert.ok(!header.includes("write"), "workflow-level section grants a write permission");
  assert.ok(header.includes("cancel-in-progress: ${{ github.event_name == 'pull_request' }}"), "main deploys could be cancelled");
});

test("(c) build job: env, setup, npm ci -> npm test -> npm run build -> upload (skipped on PRs)", () => {
  for (const needle of [
    "SITE_URL: https://inglourious-basterds-clan.github.io",
    "PATH_PREFIX: /IBC-Website/",
    "actions/checkout@v7",
    "actions/setup-node@v7",
    "node-version-file: .nvmrc",
    "cache: npm",
  ]) {
    assert.ok(buildPart.includes(needle), `build job is missing: ${needle}`);
  }

  const ci = indexOrFail(buildPart, "run: npm ci");
  const unitTests = indexOrFail(buildPart, "run: npm test");
  const siteBuild = indexOrFail(buildPart, "run: npm run build");
  const upload = indexOrFail(buildPart, "actions/upload-pages-artifact@v5");
  assert.ok(ci < unitTests && unitTests < siteBuild && siteBuild < upload, "build steps are out of order");

  const uploadStep = buildPart.slice(upload);
  assert.ok(uploadStep.includes("if: github.event_name != 'pull_request'"), "upload step runs on pull requests");
  assert.ok(uploadStep.includes("path: _site/"), "upload step does not publish _site/");

  assert.ok(!buildPart.includes("pages: write"), "build job has pages: write");
  assert.ok(!buildPart.includes("id-token: write"), "build job has id-token: write");
});

test("(d) deploy job: main pushes only, least privilege, no npm and no setup-node", () => {
  for (const needle of [
    "needs: build",
    "github.event_name != 'pull_request' && github.ref == 'refs/heads/main'",
    "pages: write",
    "id-token: write",
    "name: github-pages",
    "id: deployment",
    "actions/deploy-pages@v5",
  ]) {
    assert.ok(deployPart.includes(needle), `deploy job is missing: ${needle}`);
  }
  assert.ok(!deployPart.includes("npm "), "deploy job runs an npm command");
  assert.ok(!deployPart.includes("setup-node"), "deploy job uses setup-node (and its cache)");
});

test("(e) .nvmrc pins Node 24", () => {
  assert.equal(readFileSync(path.join(repoRoot, ".nvmrc"), "utf8").trim(), "24");
});

test("(f) workflow holds no Discord invite", () => {
  assert.ok(!inviteDomainPattern.test(workflow), "workflow contains a Discord invite");
});

test("(g) build job env sets SITE_URL and PATH_PREFIX for npm test and npm run build", () => {
  // Job-level env reaches every run step, so `npm run build` passes the SITE_URL guard.
  const jobStart = indexOrFail(workflow, "\n  build:\n");
  const stepsStart = workflow.indexOf("\n    steps:", jobStart);
  assert.ok(stepsStart > jobStart, "build job has no steps: line");
  const jobHead = workflow.slice(jobStart, stepsStart);
  assert.ok(jobHead.includes("\n    env:\n"), "build job has no job-level env:");
  assert.ok(jobHead.includes("SITE_URL: https://inglourious-basterds-clan.github.io"), "build job env is missing SITE_URL");
  assert.ok(jobHead.includes("PATH_PREFIX: /IBC-Website/"), "build job env is missing PATH_PREFIX");
});

test("(h) the workflow never sets the local opt-out", () => {
  assert.ok(!workflow.includes("ALLOW_LOCAL_SITE_URL"), "workflow sets ALLOW_LOCAL_SITE_URL");
});

test("(i) the workflow never opts into indexing (D-15, D-18)", () => {
  assert.ok(!workflow.includes("SITE_INDEXABLE"), "workflow mentions SITE_INDEXABLE; the Pages preview must stay noindex");
});
