---
phase: 02-technical-seo
fixed_at: 2026-10-08T19:49:44Z
review_path: .planning/phases/02-technical-seo/02-REVIEW.md
iteration: 2
findings_in_scope: 16
fixed: 16
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-10-08T19:49:44Z (iteration 1: 2026-10-08T19:30:00Z)
**Source review:** .planning/phases/02-technical-seo/02-REVIEW.md
**Iteration:** 2

**Summary:**
- Findings in scope: 16 (iteration 1: CR-01, CR-02, WR-01..WR-05; iteration 2, fix scope `all`: IN-01..IN-09)
- Fixed: 16 (7 in iteration 1, 9 in iteration 2)
- Skipped: 0
- Also in iteration 2: FACTS.md now says rule G10 lives in `lib/check-seo.js` (commit dd5635e).

## Fixed Issues

### CR-01: SEO gate silently skips itself (exit 0) when run through a symlinked or junction path

**Files modified:** `lib/check-seo.js` (new, moved from `scripts/check-seo.js` with `git mv`), `scripts/check-seo.js`, `test/seo-gate.test.js`, `test/seo-files.test.js`, `lib/seo.js`, `lib/image-size.js`, `eleventy.config.js`, `README.md`
**Commit:** b39c36f
**Applied fix:** I used the more robust option from the review. The rules (`checkSite` and helpers, with `listFiles` exported) now live in `lib/check-seo.js`. `scripts/check-seo.js` is now only the CLI (banner and `runCli`) and calls `runCli(process.argv.slice(2))` unconditionally, with no main-module guard. The tests import `checkSite` from `lib/check-seo.js`. Comments and the README project tree point at the new module.
**Regression test:** "CLI still runs and fails when started through a junction or symlink path". It creates a junction on Windows (a dir symlink elsewhere) in `os.tmpdir()` that points at the repo, then runs `node scripts/check-seo.js --dir <broken fixture>` with that link as the cwd, the same command line the build uses. It asserts exit 1 and a G2 line. It is skipped through `t.skip` if the link cannot be created. Cleanup uses `unlinkSync` on the link only, never a recursive remove. Before the fix this test failed (exit 0, no output), which reproduces the verifier's finding.

### CR-02: A rejected build stays in `_site/` and the README says it cannot be deployed by mistake

**Files modified:** `scripts/check-seo.js`, `test/seo-gate.test.js`, `README.md`, `.gitignore`
**Commit:** c08d4cc
**Applied fix:** When the gate fails, `runCli` calls `removeRejectedOutput(outDir)` before exiting 1:
- It deletes any older `<dir>.rejected` and renames the checked folder to `<dir>.rejected`, so `_site/` becomes `_site.rejected/`.
- If the rename fails (for example a file is locked on Windows), it deletes the folder instead.
- A folder outside the repo, or the repo root itself, is never touched. In that case the message says DO NOT DEPLOY IT.

The outcome is appended to the existing `... this output must not be deployed` line (one line, so the existing stderr filters still work). README lines 59 and 85 now describe the real behaviour, and `_site.rejected/` is gitignored. This applies to every `--dir`, not only the default, so the default `_site` path runs exactly the code the tests exercise.
**Regression test:** "CLI moves a rejected build aside so no deployable index.html is left". It builds an indexable fixture that fails only on G10 TODO markers (the real CR-02 scenario) and runs the gate twice. Each run must exit 1, the folder and its `index.html` must be gone, and `<dir>.rejected/index.html` must exist; the second run must replace the old `.rejected` folder. The existing "CLI exits 0 on a real build" test now also asserts that a passing gate leaves its output in place.
**End-to-end check (worktree):** `SITE_URL=https://example.org SITE_INDEXABLE=1 npm run build` exited 1 with the two G10 lines and `moved to _site.rejected, nothing is left in _site`; `_site/` did not exist afterwards.

### WR-01: A page that overrides og:image gets the default card's alt text

**Files modified:** `src/_includes/partials/head.njk`
**Commit:** a81a997
**Applied fix:** The template now sets `ogImageAltText = (ogImageAlt if ogImage else site.ogImageAlt)`. `og:image:alt` and `twitter:image:alt` are rendered only when that value is non-empty. Checks:
- Home: default alt, unchanged.
- `/_dev/og-override/`: its own alt, unchanged.
- An ad-hoc dev page with `ogImage` set and no `ogImageAlt` rendered no alt tags. That page was temporary and was deleted afterwards.

No new permanent fixture was added, so as not to change the dev-page set that other tests enumerate. The optional G3 rule from the review was not added.

### WR-02: Indexable builds are allowed with a non-root PATH_PREFIX, where robots.txt and its Sitemap line are never read

**Files modified:** `src/_data/site.js`, `test/seo.test.js`, `README.md`
**Commit:** c206270
**Applied fix:** `site.js` now throws `SITE_INDEXABLE=1 needs PATH_PREFIX=/ (robots.txt is only read at the host root), got <prefix>` next to the https guard. The README "Indeksowanie" list documents the rule. New test "(c2)": an indexable build with `PATH_PREFIX=/foo/` fails with that message.

### WR-03: `isIndexableUrl` treats any collection URL as an indexable page, including future non-HTML outputs

**Files modified:** `lib/seo.js`, `test/seo-gate.test.js`
**Commit:** 65c75e0
**Applied fix:** `isIndexableUrl` now returns false unless the URL ends in `/` or `.html`. New tests:
- A unit test of the predicate covering pages, `/feed.xml`, `/search.json`, `/robots.txt`, `/site.webmanifest`, `/404.html`, `/_dev/` and an empty string.
- A G7 fixture whose sitemap lists an existing `feed.xml`. The gate now reports it; it passed before the fix.

### WR-04: SITE_URL is validated through `new URL()` but emitted raw, so site.js accepts values the gate rejects

**Files modified:** `src/_data/site.js`, `test/seo.test.js`
**Commit:** 9209e00
**Applied fix:** The value that gets parsed and validated is now `candidateUrl`, and the exported `url` is `parsedUrl.origin`: lowercase scheme and host, no default port, no trailing slash. Error messages still show the raw input. New test "(a2)": a build with `SITE_URL=HTTPS://Guard.EXAMPLE:443/` must have canonical `https://guard.example/`, an og:image and a sitemap `<loc>` on the normalised origin, and no raw spelling anywhere in the page.

### WR-05: G8 `Disallow: /` detection only matches one exact spelling

**Files modified:** `lib/check-seo.js`, `test/seo-gate.test.js`
**Commit:** 07f5e6a
**Applied fix:** G8 now uses `/^disallow\s*:\s*\/\*?\s*(#.*)?$/i` on the trimmed lines. New fixtures for `Disallow:/`, `Disallow: /*`, `Disallow:  /`, `disallow : /` and `Disallow: / # preview` must each report G8. `Disallow: /_dev/` must still pass.

### IN-01: web.config comment says GitHub Pages ignores the file, but Pages publishes it

**Files modified:** `src/web.config.njk`
**Commit:** af8c25f
**Applied fix:** The XML comment now says only IIS interprets the file (and IIS never serves it), that GitHub Pages publishes it as a plain download, and that secrets or internal paths must never go in it.

### IN-02: Gate helpers duplicated between the script, the tests and site.js

**Files modified:** `lib/html.js` (new), `lib/check-seo.js`, `lib/seo.js`, `scripts/check-seo.js`, `src/_data/site.js`, `test/helpers.js`
**Commit:** ddbbbd9
**Applied fix:** Re-located in current code: the copies were in `lib/check-seo.js` (not `scripts/check-seo.js`, since CR-01 moved the rules) and `test/helpers.js`, and `localHosts` was in `site.js` and the CLI `scripts/check-seo.js`. Each now exists once:
- `escapeRegExp`, `listFiles` and `block` are in the new `lib/html.js`, as the review suggested.
- `localHosts` is exported from `lib/seo.js`.

The gate, the CLI, `site.js` and `test/helpers.js` import them. `helpers.js` re-exports `listFiles` and `block`, so no test import had to change.

### IN-03: The JSON-LD Organization description is a hand-copied duplicate of the hero paragraph

**Files modified:** `test/schema.test.js`, `lib/schema.js`
**Commit:** fab73c1
**Applied fix:** I used the test option from the review. The hero copy stays in `src/index.njk`, where Phase 4 content edits happen.
- A new test compares the built JSON-LD Organization description with the built `#hero` paragraph, with whitespace collapsed. When they differ, it fails and names both files.
- The `lib/schema.js` comment now points at that test.
- Proof: I changed one word in the hero temporarily, the test failed, and I restored the file.

### IN-04: The traversal guard in `locToRelPath` ignores backslash segments on Windows

**Files modified:** `lib/check-seo.js`, `test/seo-gate.test.js`
**Commit:** 7a038db
**Applied fix:** Re-located: `locToRelPath` is now in `lib/check-seo.js`. Its `..`/`.` guard now splits on `/[\\/]/`.
- New G7 fixture: a sitemap `<loc>` with `about\..\..\g7-traversal-outside\index.html` points at a real indexable page in a sibling folder, and the gate must report it.
- Without the fix this test fails on Windows: the gate accepted the page outside the build. With the fix it passes.

### IN-05: Regenerating the SEO images is machine-dependent and not atomic

**Files modified:** `tools/seo-images/make-seo-images.js`, `README.md`
**Commit:** 2a4ece4
**Applied fix:**
- **Font:** `checkCardFont()` renders a probe with `Montserrat` (bold) and one with a family name that cannot exist. If the pixels are identical, Montserrat is not installed, and the script stops with a clear error instead of shipping a card in a fallback font.
- **Atomic write:** `writeOutputs()` writes all six buffers to `<target>.tmp-<pid>` next to each target. It renames them into place only after all six are written. If writing a temp file fails, it deletes the temp files and leaves every committed image unchanged.
- **README:** notes both behaviours in Polish.

The font is not bundled. That would mean adding a font binary, which is out of scope for a code-only fix, so the script now fails loudly instead of being machine-dependent.

**Verification:**
- No npm package was installed or upgraded. A scratchpad loader hook pointed the bare `sharp` import at the existing install in the main checkout, `tools/seo-images/node_modules` (sharp 0.35.4).
- I ran the original script, then the modified one, in the worktree. Both regenerated all six images byte-identical to the committed files (`git status` was clean, no `.tmp-*` files left over), so no images were committed. Montserrat is installed in `C:\Windows\Fonts` here, and the committed card was rendered with it.
- The missing-font branch was run with a temporary copy whose probe family was swapped. It exited 1 with the font message, and the copy was deleted.

### IN-06: `--dir` pointing at a file crashes with a stack trace

**Files modified:** `scripts/check-seo.js`, `test/seo-gate.test.js`
**Commit:** 6b96c82
**Applied fix:** After the existence check, the CLI now checks `statSync(outDir).isDirectory()`. For a file it exits 1 with `check-seo: <dir> is not a folder (point --dir at the build output folder)`. A new CLI test passes a file as `--dir` and checks for that message, exit code 1 and no stack trace.

### IN-07: G3 checks only the first og:image:width/height and allows duplicates

**Files modified:** `lib/check-seo.js`, `test/seo-gate.test.js`
**Commit:** c637300
**Applied fix:** Re-located: the check is now in `checkShareTags` in `lib/check-seo.js`.
- G3 reports `N og:image:width tags, expected at most one` (same for height). This check runs before, and separately from, the image-file checks.
- The size is compared with the file only when exactly one tag is declared.
- New fixture: a page with a matching pair and a second, conflicting pair must report exactly the two duplicate problems. Without the fix this test fails.

### IN-08: Draft-marker format is narrower than FACTS.md suggests

**Files modified:** `src/_includes/partials/head.njk`, `test/facts.test.js`, `FACTS.md`
**Commit:** f8842e2
**Applied fix:**
- **`head.njk`:** renders one `<!-- TODO(FACTS-NN) -->` per id, for a single id or a list (`[todo] if todo is string else todo`). The built output for the current pages is byte-identical before and after (`diff -r` of two local builds).
- **`facts.test.js`:** reads every `FACTS-NN` in the front-matter `todo` value, including its indented continuation lines. That covers quoted or unquoted ids, a single id, a flow list and a block list. `markerRenderer` now matches the new template expression.
- **New tests:** one covers each front-matter form. Another renders the head marker line with Eleventy's own Nunjucks (resolved through `createRequire` from Eleventy's location, not a new dependency) for a single id, a list and no `todo`.
- **`FACTS.md`:** documents the list form `todo: ["FACTS-01", "FACTS-02"]`.

### IN-09: Workflow actions are pinned to mutable major tags while deploy holds `id-token: write`

**Files modified:** `.github/workflows/pages.yml`, `.github/dependabot.yml` (new), `test/workflow.test.js`
**Commit:** bd2343d
**Applied fix:** Each action is pinned to the full commit SHA that its major tag points at today, with the release tag in a comment:

| Action | Commit SHA | Tag |
|--------|------------|-----|
| `actions/checkout` | `3d3c42e5aac5ba805825da76410c181273ba90b1` | v7.0.1 |
| `actions/setup-node` | `949feb2413d6458794dcd2491c4babbbce0c15c1` | v7.1.0 |
| `actions/upload-pages-artifact` | `fc324d3547104276b827a68afc52ff2a11cc49c9` | v5.0.0 |
| `actions/deploy-pages` | `368f82528645a54fb793d4d04e342629a3f51346` | v5.0.1 |

- **SHA source:** each SHA was read twice with `git ls-remote https://github.com/actions/<repo>`: once over all `v5*`/`v7*` tags, and once for the exact tag plus its peeled `^{}` ref. No tag had a peeled entry, so they are lightweight tags and these are the commit SHAs. Each one is also the commit the movable major tag pointed at, so CI runs the same code as before.
- **Dependabot:** the new `.github/dependabot.yml` covers `github-actions` only, so it bumps the pins.
- **Tests:** the workflow test now needs a 40-character SHA plus `# vX.Y.Z` on every `uses:` line, on the expected major versions. It also checks that the Dependabot config exists.
- **Header comment:** it avoids the word "write", because test (b) forbids that word in the workflow-level header.

## Verification

**Iteration 2 (IN-01..IN-09 and the FACTS.md G10 path):**

- **Where it ran:**
  - Every fix was edited, checked and committed in an isolated git worktree (`.claude/worktrees/rf-02-770-1791488383`, branch `gsd-reviewfix/02-770`). Its `node_modules` came from `npm ci --prefer-offline` (the locked root dependencies; nothing new or upgraded). I checked that it held no junctions or symlinks before removing it.
  - I ran `npm test` in the worktree after each fix; it was green each time (156 at baseline, then 156, 156, 157, 158, 158, 159, 160, 162, 163, 163).
  - In the worktree, I also ran end-to-end builds:
    - A Pages preview build: `check-seo: OK`.
    - A `SITE_INDEXABLE=1` build: it failed only on the two open G10 drafts and was moved to `_site.rejected`.
  - After all fixes, `main` was fast-forwarded to dd5635e. Then the worktree, the temp branch and the recovery sentinel were removed.
  - I ran the final `npm test` again in the **main checkout**: 163 tests, 163 pass, 0 fail, 0 skipped.
- **Syntax checks:** `node --check` on each modified `.js` file. The Nunjucks change was checked by a byte-for-byte `diff -r` of two builds and by the new render test. The YAML changes were checked by reading them and by `test/workflow.test.js`.
- **Not staged or committed:** the pre-existing working-tree changes (`.planning/config.json`, `.planning/state.json`, `.planning/milestone.lock`, `.gsd/`). This file (REVIEW-FIX.md) is not committed either.

**Iteration 1 (CR-01, CR-02, WR-01..WR-05):**

- **Where it ran:**
  - Every fix was edited, checked and committed in an isolated git worktree (`.claude/worktrees/rf-02-1688-*`, branch `gsd-reviewfix/02-1688`). The worktree had its own real `node_modules` from `npm ci --prefer-offline`; I checked that it contained no junctions or symlinks.
  - I ran `npm test` in the worktree after each fix; it was green each time (149 at baseline, then 150, 151, 151, 152, 154, 155, 156).
  - After all fixes, `main` was fast-forwarded to 07f5e6a, and the worktree, temp branch and recovery sentinel were removed.
  - I ran the final `npm test` again in the **main checkout**: 156 tests, 156 pass, 0 fail, 0 skipped. The junction test really ran there; it was not skipped.
- **Syntax checks:** `node --check` on each modified `.js` file. The Nunjucks change was checked by building and reading the output.
- **Not staged or committed:** the pre-existing working-tree changes (`.planning/config.json`, `.planning/state.json`, `.planning/milestone.lock`, `.gsd/`). This file (REVIEW-FIX.md) is not committed either.

---

_Fixed: 2026-10-08T19:49:44Z (iteration 1: 2026-10-08T19:30:00Z)_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
