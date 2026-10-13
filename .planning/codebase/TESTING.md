---
last_mapped_commit: 498f19eefca8ec513547073c1d87eb4bb2a09b7d
last_mapped_at: 2026-10-13
---
# Testing Patterns

**Analysis Date:** 2026-10-13

## Test Framework

**Runner:**
- Node built-in test runner `node:test` (Node >= 22.19, `.nvmrc`)
- Config: none; script in `package.json`: `node --test "test/*.test.js"`
- `pretest` runs `scripts/warm-images.js` to pre-encode images into `.cache/img/`

**Assertion Library:**
- `node:assert/strict`

**Run Commands:**

```bash
npm test                                   # All tests (~430 across 24 files)
node --test test/seo-gate.test.js          # Single file
SITE_URL=https://example.org npm run build # Build + post-build gates (check-seo, check-perf)
```

In Git Bash set `MSYS_NO_PATHCONV=1` when passing `PATH_PREFIX=/IBC-Website/` on the command line. Test builds spawn Eleventy without a shell, so tests are unaffected.

## Test File Organization

**Location:**
- Separate `test/` directory, flat. Binary fixtures in `test/fixtures/` (`montserrat-ascii.var.woff2`).

**Naming:**
- `test/<area>.test.js`; helpers without the `.test` suffix (`test/helpers.js`)

**Structure:**

```
test/
├── helpers.js           # build(), runBuild(), cleanEnv(), read(), attrValues(), repoRoot
├── build.test.js        # SITE_URL guard, env handling
├── pages.test.js        # rendered page content
├── seo*.test.js         # SEO output + gate (seo-gate.test.js is largest, ~930 lines)
├── perf-gate.test.js    # lib/check-perf.js rules
├── client.test.js       # browser modules vs stub DOM
├── modules.test.js      # loader map / module contract
├── discord.test.js      # lib/discord.js + badge module
├── workflow.test.js     # .github/workflows/pages.yml read as text
├── deps.test.js, docs.test.js, facts.test.js  # repo hygiene contracts
└── fixtures/
```

## Test Structure

**Suite Organization:**
Flat top-level `test()` calls (no `describe`). File header comment names the requirement IDs covered. Long files are split by `/* --- SECTION --- */` comments.

```javascript
// CONT-07 checks (D-14..D-16): ...
import { test, before, afterEach } from "node:test";
import assert from "node:assert/strict";
import { build, read, attrValues } from "./helpers.js";

const out = {};
before(() => {
  out.root = build("discord-root");
  out.prefix = build("discord-prefix", { SITE_URL: "https://guard.example", PATH_PREFIX: "/IBC-Website/" });
});

test("terminal prints the invite from data-discord-url without its scheme", (t) => { ... });
```

**Patterns:**
- Setup: real Eleventy builds in `before()` via `build(name, env)` into `_test/<name>/`. Prefix `name` with the suite name; test files run in parallel processes.
- Test both a root build and a path-prefix build (`PATH_PREFIX: "/IBC-Website/"`) when output URLs matter.
- Teardown: `afterEach` deletes stub globals (`document`, `window`, `IntersectionObserver`) and restores `globalThis.fetch`.
- Assertions: `assert.equal`, `assert.ok(cond, "message")`, `assert.match`, `assert.throws`; always give a failure message that names what is missing.
- Test names are plain-English statements, often ending with the decision ID: `"scroll-spy on home manages only the hash links, never the page links (D-07, Pitfall 3)"`.

## Mocking

**Framework:** Hand-written stubs plus `node:test` built-in `t.mock.timers`.

**Patterns:**

```javascript
// Stub DOM on globalThis (test/client.test.js)
function bootTerminal(t, discordUrl) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const env = installDom();
  const consoleEl = createConsoleEl(discordUrl, env.recruitment);
  terminal.init(consoleEl);
  env.intersect(env.recruitment);   // fire the fake IntersectionObserver
  t.mock.timers.runAll();
  return consoleEl.children;
}
```

- Replace `globalThis.fetch` for network code and restore it in `afterEach` (`test/discord.test.js`)
- Builds always run with `DISCORD_FETCH=0` (`runBuild` default) so no test hits Discord

**What to Mock:**
- Browser globals (DOM, `IntersectionObserver`, `window`), timers, `fetch`

**What NOT to Mock:**
- Eleventy itself: run real builds through `test/helpers.js`
- Filesystem: write real fixture folders under `_test/`
- Build env: use `cleanEnv(env)`, which strips `SITE_URL`, `PATH_PREFIX`, `INCLUDE_DEV_PAGES`, `ELEVENTY_RUN_MODE`, `ALLOW_LOCAL_SITE_URL`, `SITE_INDEXABLE`, `DISCORD_FETCH` from the inherited env. Add any new output-affecting env var to `buildEnvKeys`.

## Fixtures and Factories

**Test Data:**

```javascript
// test/seo-gate.test.js: one folder per problem, a valid site with one thing broken
const fixtureSite = { url: "https://fixture.example", pathPrefix: "/", indexable: false };
function writeFixture(name, files) {
  const dir = join(repoRoot, "_test", "seo-gate-fixtures", name);
  rmSync(dir, { recursive: true, force: true });
  ...
  return dir;
}
```

- Byte-level factories for binary inputs (`pngHeader(width, height)` in `test/seo-gate.test.js`)
- Use `.example` domains for fake URLs

**Location:**
- Generated: `_test/` (gitignored, rebuilt each run). Committed: `test/fixtures/`.

## Coverage

**Requirements:** None enforced; no coverage tool. Coverage is by requirement ID: each requirement/decision gets a named test.

**View Coverage:**

```bash
node --test --experimental-test-coverage "test/*.test.js"
```

## Test Types

**Unit Tests:**
- Pure `lib/` functions (`lib/dates.js`, `lib/discord.js`, `lib/woff2.js`, `lib/schema.js`), including `assert.throws` on bad input

**Integration Tests:**
- Full Eleventy builds inspected as HTML text (regex helpers `attrValues`, `block` from `lib/html.js`)
- Gate tests: run `checkSite` on fixtures and spawn `scripts/check-seo.js` / `scripts/check-perf.js` to check exit codes and `.rejected` handling
- Contract tests on repo files: workflow YAML, dependencies, docs, `FACTS.md`

**E2E Tests:**
- Not used (no browser). Visual/UX checks are human UAT items in `.planning/`.

## Common Patterns

**Async Testing:**

```javascript
test("...", async () => {
  await initFeatures(stubRoot, loaders);
  assert.equal(...);
});
```

**Error Testing:**

```javascript
assert.throws(() => formatPlDate("2026-02-30"), /not a real calendar date/);
const { result } = runBuild("build-no-url", {});   // inspect a failing build without asserting
assert.notEqual(result.status, 0);
```

---

*Testing analysis: 2026-10-13*
