---
phase: 01-eleventy-foundation
reviewed: 2026-10-03T00:00:00Z
depth: standard
scope: incremental (gap-closure plan 01-07, diff 18efc6c..HEAD)
files_reviewed: 5
files_reviewed_list:
  - README.md
  - src/_data/site.js
  - test/build.test.js
  - test/helpers.js
  - test/workflow.test.js
findings:
  critical: 0
  warning: 3
  info: 5
  total: 8
status: issues_found
---

# Phase 01: Code Review Report (incremental, plan 01-07)

**Reviewed:** 2026-10-03
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

This review covers only gap-closure plan 01-07 (G-01-5 / CR-01). Production builds must now fail when `SITE_URL` is unset, and `ALLOW_LOCAL_SITE_URL=1` opts out. It replaces the earlier full-phase review. Findings from that review that are outside this diff (WR-02..WR-05, IN-01..IN-07 of the earlier report) were not re-checked here and stay open unless closed elsewhere.

**What I verified:**

- **Guard timing and coverage:** sound. Eleventy 3.1.6 writes `process.env.ELEVENTY_RUN_MODE` in `initializeConfig()` (`node_modules/@11ty/eleventy/src/Eleventy.js:260-264`, `:636`) before it imports the user config. The programmatic API defaults `runMode` to `"build"` (`Eleventy.js:148`), so the guard also fires for non-CLI builds.
- **CI path:** the build job sets `SITE_URL`/`PATH_PREFIX` at job level (`pages.yml:21-23`), so `npm run build` in CI passes the guard. `cleanEnv` strips both keys from every test child process, so CI env cannot leak into test variants.
- **Tests:** `node --test test/build.test.js test/workflow.test.js` runs 21 tests and all pass.

**What is wrong:**

- The guard only checks that `SITE_URL` is empty. A malformed value still produces broken absolute URLs, and the build exits 0. I confirmed this with a scratch build.
- The README's domain-change procedure now breaks CI because of a new hardcoded workflow assertion.
- The opt-out gives no signal when it is active, and the documented PowerShell form keeps it set for the rest of the session.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: The guard rejects only empty `SITE_URL`; a malformed value still ships broken `og:image` and exits 0

**File:** `src/_data/site.js:10-18`
**Issue:** The guard treats any non-blank string as valid. The new README text (`README.md:24-54`) now asks people to type `SITE_URL` by hand. Leaving out the scheme is an easy mistake, and it silently produces the same broken output CR-01 was meant to stop. I reproduced it:

```
SITE_URL=ibc.example node node_modules/@11ty/eleventy/cmd.cjs --output=_test/review-probe --quiet
status=0
og:image" content="/ibc.example/assets/hero-bg.jpg"
```

That `og:image` is a relative path, so Discord and Facebook previews break with no error. A value with a path (`https://example.com/sub`, which README line 24 forbids in prose) and a non-http scheme are also accepted. This is the earlier review's WR-01, still open. Plan 01-07 increased the exposure by moving the "any static host" path onto a manually typed variable.

**Fix:** validate the value in the same place as the empty check:

```js
const localUrl = "http://localhost:8080";
const rawUrl = (process.env.SITE_URL || "").trim();
const isBuild = process.env.ELEVENTY_RUN_MODE === "build";
if (!rawUrl && isBuild && process.env.ALLOW_LOCAL_SITE_URL !== "1") {
  throw new Error(/* existing message */);
}
let parsed;
try {
  parsed = new URL(rawUrl || localUrl);
} catch {
  throw new Error(`SITE_URL "${rawUrl}" is not an absolute URL; use https://<domain>.`);
}
if (!/^https?:$/.test(parsed.protocol) || parsed.pathname !== "/" || parsed.search || parsed.hash) {
  throw new Error(`SITE_URL "${rawUrl}" must be http(s)://<host> with no path, query or hash; put a subfolder in PATH_PREFIX.`);
}
const url = parsed.origin;
```

Then add `runBuild` cases for `SITE_URL: "ibc.example"` and `SITE_URL: "https://example.com/sub"` that expect a non-zero exit.

### WR-02: Following the README "Zmiana domeny" steps now fails `npm test` in CI and blocks the deploy

**File:** `test/workflow.test.js:94-103` (new test (g)); also `test/workflow.test.js:46-47` (test (c)); `README.md:118-126`
**Issue:** `README.md:122` tells the maintainer to set `SITE_URL` to `https://<domena>` and `PATH_PREFIX` to `/` in `pages.yml`. Line 126 then says "Nic więcej w kodzie nie trzeba zmieniać" ("nothing else in the code needs changing"). The new test (g) requires the literal strings `SITE_URL: https://inglourious-basterds-clan.github.io` and `PATH_PREFIX: /IBC-Website/` in the build job's env (lines 101-102). After the documented cutover, `npm test` fails in the build job, so `npm run build` and the deploy never run. Test (c) already had the same literals. Test (g) adds a second copy instead of testing what CR-01 needs, which is "a non-empty absolute `SITE_URL` is set at job level". This also conflicts with the project constraint that the site URL is a single config value.
**Fix:** check the shape of the values, not the literals:

```js
const siteUrlLine = /\n {6}SITE_URL: (https:\/\/[^\s/]+)\n/.exec(jobHead);
assert.ok(siteUrlLine, "build job env has no absolute https SITE_URL");
assert.match(jobHead, /\n {6}PATH_PREFIX: \/(?:[^\s/]+\/)?\n/, "build job env has no PATH_PREFIX");
```

Do the same for the two literals in test (c). If the literal pin is intentional, add a step 4 to `README.md:118-126` ("update `test/workflow.test.js`") and remove "Nic więcej w kodzie nie trzeba zmieniać".

### WR-03: The opt-out gives no signal and stays set in PowerShell, so a forgotten `Remove-Item` brings CR-01 back

**File:** `src/_data/site.js:11-18`; `README.md:63-69` (also `:28-32`, `:44-49`)
**Issue:** The documented PowerShell form `$env:ALLOW_LOCAL_SITE_URL="1"; npm run build` sets a session-wide variable. Clearing it depends on the user running `Remove-Item` by hand afterwards. If they forget, or close the editor's terminal pane and reopen the same session, every later `npm run build` in that session writes `http://localhost:8080` into `og:image` and exits 0. That is the exact CR-01 output, and the guard is bypassed. `site.js` prints nothing when the opt-out is what let the build through, so the build log gives no warning. The Git Bash form (`VAR=1 cmd`) is scoped to one command. The PowerShell form is not.
**Fix:** (1) Make the opt-out visible on every build where it is the reason the build passes:

```js
if (!rawUrl && process.env.ELEVENTY_RUN_MODE === "build" && process.env.ALLOW_LOCAL_SITE_URL === "1") {
  console.warn(`[site.js] ALLOW_LOCAL_SITE_URL=1: building with ${localUrl} absolute URLs. Do NOT deploy this _site/.`);
}
```

(2) Scope the PowerShell examples so the variable is always removed, even when the build fails:

```powershell
try { $env:ALLOW_LOCAL_SITE_URL="1"; npm run build } finally { Remove-Item Env:ALLOW_LOCAL_SITE_URL }
```

Use the same `try/finally` form for the `SITE_URL` and `PATH_PREFIX` examples.

## Info

### IN-01: The "inherited opt-out" build assertion passes on any failure

**File:** `test/build.test.js:169-170`
**Issue:** `runBuild("build-guard-inherited", {})` only asserts `result.status !== 0`. A template error, a crash, or a signal kill (`status === null`) also passes, so this half of the test does not prove that the guard caused the failure. The `cleanEnv` key check at lines 167-168 does cover the stripping itself.
**Fix:** add `assert.ok(result.stderr.includes("SITE_URL is not set"), result.stderr);`, as the other guard tests already do.

### IN-02: "empty env falls back to defaults" now passes only because of a hidden opt-out, and the empty-string guard case is untested

**File:** `test/build.test.js:1-2`, `:79-84`; `test/helpers.js:53-54`
**Issue:** `build()` silently adds `ALLOW_LOCAL_SITE_URL=1` whenever `SITE_URL` is blank. So `build("build-empty", { SITE_URL: "" })` now asserts behaviour (an empty `SITE_URL` gives localhost) that a production build forbids. The test name and the file header ("with empty env values") still describe the old contract. No test runs a build-mode `SITE_URL: ""` without the opt-out. Only the unset case (line 105) and the whitespace case (line 118) are covered.
**Fix:** rename the test to say it runs under the opt-out and pass `ALLOW_LOCAL_SITE_URL: "1"` explicitly. Add `runBuild("build-guard-empty", { SITE_URL: "" })` that expects a non-zero exit and the guard message.

### IN-03: Comments that are inaccurate or repeated

**File:** `src/_data/site.js:5-7`; `test/build.test.js:139-141`; `test/workflow.test.js:94-95`
**Issue:**
- `site.js` lines 5-6 and line 7 both say that `eleventy.config.js` imports this file.
- `build.test.js:139-141` says `cmd.cjs` "writes it to ELEVENTY_RUN_MODE before importing the config". In fact `cmd.cjs:86` only passes `runMode`, and `Eleventy.js:260-264`/`:636` writes the env var.
- The title of test (g) says the job env is "for npm test". `cleanEnv` strips `SITE_URL`/`PATH_PREFIX` from every test build, so the job env has no effect on `npm test`.

**Fix:** remove the duplicate sentence, name `Eleventy#initializeConfig` as the writer, and drop "npm test" from the (g) title.

### IN-04: The README still says `site.js` is the only configuration place

**File:** `README.md:88-94`
**Issue:** Line 90 was edited in this plan but kept "Jedynym miejscem konfiguracji jest plik `src/_data/site.js`" ("the only configuration place is `src/_data/site.js`"). A production build can no longer get its URL from `site.js`: it must come from the shell env or `pages.yml`. `pages.yml:2` also calls itself "the only place the production host is set". Two "only place" claims contradict each other.
**Fix:** reword it, for example: "Wartości domyślne i link Discorda są w `src/_data/site.js`; produkcyjny `SITE_URL` podaje się przez zmienną środowiskową (GitHub Actions: `.github/workflows/pages.yml`)." ("Defaults and the Discord link are in `src/_data/site.js`; the production `SITE_URL` comes from an environment variable (GitHub Actions: `.github/workflows/pages.yml`).")

### IN-05: `site.js` now throws on import, and the test-runner processes import it unprotected

**File:** `test/build.test.js:10` (also `test/devpages.test.js:10`, `test/layout.test.js:7`, `test/links.test.js:9`)
**Issue:** The guard runs when the module is evaluated. The test files import `site.js` in the parent `node --test` process, where `cleanEnv` does not apply. If a shell has `ELEVENTY_RUN_MODE=build` exported and no `SITE_URL`, four suites crash at load with the guard message instead of running. This is unlikely, but the failure message points to the wrong cause.
**Fix:** read `discord.invite` from a side-effect-free module (for example `src/_data/discord.js` re-exported by `site.js`), or document that `ELEVENTY_RUN_MODE` must not be set when running `npm test`.

---

_Reviewed: 2026-10-03_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
