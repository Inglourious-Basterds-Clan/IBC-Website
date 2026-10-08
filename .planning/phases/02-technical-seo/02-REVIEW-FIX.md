---
phase: 02-technical-seo
fixed_at: 2026-10-08T19:30:00Z
review_path: .planning/phases/02-technical-seo/02-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-10-08T19:30:00Z
**Source review:** .planning/phases/02-technical-seo/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (CR-01, CR-02, WR-01..WR-05; Info findings out of scope)
- Fixed: 7
- Skipped: 0

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

## Verification

- **Where it ran:**
  - Every fix was edited, checked and committed in an isolated git worktree (`.claude/worktrees/rf-02-1688-*`, branch `gsd-reviewfix/02-1688`). The worktree had its own real `node_modules` from `npm ci --prefer-offline`; I checked that it contained no junctions or symlinks.
  - I ran `npm test` in the worktree after each fix; it was green each time (149 at baseline, then 150, 151, 151, 152, 154, 155, 156).
  - After all fixes, `main` was fast-forwarded to 07f5e6a, and the worktree, temp branch and recovery sentinel were removed.
  - I ran the final `npm test` again in the **main checkout**: 156 tests, 156 pass, 0 fail, 0 skipped. The junction test really ran there; it was not skipped.
- **Syntax checks:** `node --check` on each modified `.js` file. The Nunjucks change was checked by building and reading the output.
- **Not staged or committed:** the pre-existing working-tree changes (`.planning/config.json`, `.planning/state.json`, `.planning/milestone.lock`, `.gsd/`). This file (REVIEW-FIX.md) is not committed either.

---

_Fixed: 2026-10-08T19:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
