---
phase: 02-technical-seo
reviewed: 2026-10-07T19:32:54Z
depth: standard
files_reviewed: 34
files_reviewed_list:
  - .github/workflows/pages.yml
  - eleventy.config.js
  - FACTS.md
  - lib/image-size.js
  - lib/schema.js
  - lib/seo.js
  - package.json
  - README.md
  - scripts/check-seo.js
  - src/_data/site.js
  - src/_dev/og-override.njk
  - src/_includes/partials/footer.njk
  - src/_includes/partials/head.njk
  - src/404.njk
  - src/index.njk
  - src/robots.txt.njk
  - src/site.webmanifest.njk
  - src/sitemap.xml.njk
  - src/web.config.njk
  - test/build.test.js
  - test/devpages.test.js
  - test/docs.test.js
  - test/facts.test.js
  - test/helpers.js
  - test/layout.test.js
  - test/links.test.js
  - test/schema.test.js
  - test/seo.test.js
  - test/seo-assets.test.js
  - test/seo-files.test.js
  - test/seo-gate.test.js
  - test/workflow.test.js
  - tools/seo-images/make-seo-images.js
  - tools/seo-images/package.json
findings:
  critical: 2
  warning: 5
  info: 9
  total: 16
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-10-07T19:32:54Z
**Depth:** standard
**Files Reviewed:** 34
**Status:** issues_found

## Summary

The phase adds the technical SEO layer: head and share tags, sitemap, robots.txt, manifest, IIS web.config, the 404 page, the JSON-LD graph, the committed SEO images, the FACTS.md draft register and the post-build gate `scripts/check-seo.js`. Template logic, prefix handling and the JSON-LD escaping are sound, and the test suite is thorough on the happy and broken-fixture paths.

The main problems are in the gate, the mechanism that is supposed to stop bad output from being deployed:

1. **The gate fails open (verified).** The CLI only runs when `import.meta.url === pathToFileURL(process.argv[1]).href`. When the script is reached through a symlink or a Windows junction, the two values differ, so `node scripts/check-seo.js` does nothing and exits 0. That silently turns off every rule, including G10, the rule that blocks drafts.
2. **A failed gate still leaves deployable output.** After the gate rejects a build, the rejected files stay in `_site/`. The IIS cutover is a manual copy of `_site/`, so an indexable build that failed on open FACTS drafts can still be uploaded. The README says this cannot happen.

Lower-severity issues:

- A wrong og:image:alt fallback when a page overrides the share image.
- Indexable builds are allowed under a non-root prefix, where robots.txt is never read by crawlers.
- The indexability predicate does not check for HTML outputs.
- SITE_URL is not normalised.
- The `Disallow: /` detection is too narrow.

## Critical Issues

### CR-01: SEO gate silently skips itself (exit 0) when run through a symlinked or junction path

**File:** `scripts/check-seo.js:406-408`
**Issue:** The CLI entry guard is:

```js
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli(process.argv.slice(2));
}
```

Node builds `import.meta.url` for the main module from the **realpath** of the entry file. `process.argv[1]` is only `path.resolve`d and still contains the symlink. When the repo, or the cwd that `npm run build` uses, is reached through a symlink or a Windows junction, the comparison is false. Common cases are a junctioned Documents or OneDrive folder, a symlinked workspace, and macOS `/tmp`. In that case `runCli` never runs, nothing is printed and the process exits 0. `npm run build` (`... && eleventy && node scripts/check-seo.js`, `package.json:10`) then reports success.

I reproduced this in the scratchpad with an identical guard. Running the script by its real path printed `CLI RAN` and exited 1. Running it through a junction printed nothing and exited 0. A safety gate that passes without checking anything turns off G1–G10, including the G10 draft block for the indexable IIS cutover (D-19).
**Fix:** Compare real paths, or move the CLI into a file that always runs:

```js
import { realpathSync } from "node:fs";

function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isMainModule()) runCli(process.argv.slice(2));
```

A more robust option is to move `checkSite` into `lib/check-seo.js`, so the tests import it from there, and make `scripts/check-seo.js` an unconditional `runCli(process.argv.slice(2))`. Add a test to `test/seo-gate.test.js` that runs the gate through a junction or symlink pointing at the repo and asserts exit code 1 on a broken fixture.

### CR-02: A rejected build stays in `_site/` and the README says it cannot be deployed by mistake

**File:** `package.json:10`, `scripts/check-seo.js:397-401`, `README.md:85`
**Issue:** `npm run build` runs `clean -> eleventy -> check-seo`. When the gate finds problems it writes to stderr and calls `process.exit(1)`, but the full Eleventy output stays in `_site/`. README line 85 says the opposite: "przerywa build, więc takiego wyniku nie da się przez pomyłkę wgrać" (it stops the build, so such output cannot be uploaded by mistake).

That is true only in CI, where the upload step is skipped. The production target is IIS, and the cutover (README step 3) is a manual "copy the whole content of `_site/`". The typical failure makes this concrete. A `SITE_INDEXABLE=1` build that fails only on G10, because FACTS-01 and FACTS-02 are still "do potwierdzenia", leaves an indexable `_site/` in place. It has no noindex and it contains the unconfirmed drafts. This is exactly the output D-19 is meant to keep off the live domain.
**Fix:** Make a failed gate leave nothing deployable. For example, move the rejected output aside in `runCli`:

```js
import { renameSync, rmSync } from "node:fs";
// ...
if (problems.length > 0) {
  for (const problem of problems) process.stderr.write(`check-seo: ${problem}\n`);
  const rejected = `${outDir}.rejected`;
  rmSync(rejected, { recursive: true, force: true });
  renameSync(outDir, rejected);
  process.stderr.write(`check-seo: ${problems.length} problem(s); output moved to ${rejected}, nothing to deploy\n`);
  process.exit(1);
}
```

This should apply only when the default `_site` is checked, or behind a flag, so the tests that call `--dir` on fixtures keep their folders. Another option is to build into a staging folder and promote it to `_site/` only after the gate passes. Then correct README lines 59 and 85 and add a test that a failing gate leaves no `_site/index.html`.

## Warnings

### WR-01: A page that overrides og:image gets the default card's alt text

**File:** `src/_includes/partials/head.njk:9` (used at lines 37 and 42)
**Issue:** `ogImageAltText = ogImageAlt or site.ogImageAlt`. If a page sets `ogImage` but not `ogImageAlt`, the page's `og:image:alt` and `twitter:image:alt` still say "Róża IBC i napis „Klan Arma 3 Milsim” na ciemnym tle pola walki". That sentence describes the default OG card, not the image actually being shared, so screen-reader users and platforms get wrong alt text. Neither the gate nor the tests catch this. The only override page (`src/_dev/og-override.njk`) happens to set an alt.
**Fix:** Use the default alt only with the default image, and leave the tag out (or fail) otherwise:

```njk
{%- set ogImageAltText = (ogImageAlt if ogImage else site.ogImageAlt) %}
...
{% if ogImageAltText %}<meta property="og:image:alt" content="{{ ogImageAltText }}">{% endif %}
```

Optionally, add a G3 rule that a page whose og:image is not `site.ogImage` must declare its own alt.

### WR-02: Indexable builds are allowed with a non-root PATH_PREFIX, where robots.txt and its Sitemap line are never read

**File:** `src/_data/site.js:59-66`, `src/robots.txt.njk:7`, `scripts/check-seo.js:320-329`
**Issue:** Crawlers only read `/robots.txt` at the host root. With `SITE_INDEXABLE=1 PATH_PREFIX=/foo/`, the build writes `/foo/robots.txt` with `Sitemap: https://host/foo/sitemap.xml`. No crawler ever fetches that file, but G8 checks that the line exists and passes. The README's generic "Wdrożenie" section explicitly documents subfolder deployments, so this combination is reachable. The result is an indexable deployment whose sitemap can only be found by submitting it by hand.
**Fix:** Reject the combination in `site.js`, next to the https guard:

```js
if (indexable && pathPrefix !== "/") {
  throw new Error(`SITE_INDEXABLE=1 needs PATH_PREFIX=/ (robots.txt is only read at the host root), got ${pathPrefix}`);
}
```

Alternatively, have G8 report it when `indexable && site.pathPrefix !== "/"`.

### WR-03: `isIndexableUrl` treats any collection URL as an indexable page, including future non-HTML outputs

**File:** `lib/seo.js:10-15`, `src/sitemap.xml.njk:7`
**Issue:** The sitemap includes every `collections.all` entry for which `isIndexableUrl(p.url)` is true, and that is true for any string not in `["/404.html"]` and not under `/_dev/`. Today robots, sitemap, the manifest and web.config stay out only because each sets `eleventyExcludeFromCollections: true`. The first new non-HTML template that forgets the flag (e.g. `feed.xml`, `search.json`) will appear in `sitemap.xml`. G7 will then accept it, because the file exists and `isIndexableUrl("/feed.xml")` is true. The predicate is described as "the one predicate that decides which pages are meant to be indexed", but it never checks that the URL is a page.
**Fix:**

```js
export function isIndexableUrl(url) {
  if (typeof url !== "string" || url === "") return false;
  if (!(url.endsWith("/") || url.endsWith(".html"))) return false; // pages only
  if (nonIndexableUrls.includes(url)) return false;
  if (url.startsWith("/_dev/")) return false;
  return true;
}
```

### WR-04: SITE_URL is validated through `new URL()` but emitted raw, so site.js accepts values the gate rejects

**File:** `src/_data/site.js:20`, `src/_data/site.js:61`
**Issue:** `url` is `rawUrl` with trailing slashes stripped. It is not `parsedUrl.origin`. Some consequences:

- `SITE_URL=HTTPS://example.org` passes every site.js check, including the indexable `protocol === "https:"` check, because `URL` lowercases the scheme. But the canonicals, og:image and sitemap all start with `HTTPS://`, and the gate's case-sensitive `/^https?:\/\//` (check-seo.js:130 and 259) then fails every page with a misleading "is not absolute".
- `https://Example.ORG` emits mixed-case hosts into canonicals and the sitemap.
- `https://example.org:443` emits a redundant `:443`.

**Fix:** After validation, emit the normalised origin:

```js
const url = parsedUrl.origin; // scheme + lowercased host + non-default port, no trailing slash
```

This means splitting the current `const url = ...` line into a "candidate" value that is parsed and an exported `url` taken from `parsedUrl.origin`.

### WR-05: G8 `Disallow: /` detection only matches one exact spelling

**File:** `scripts/check-seo.js:324`
**Issue:** `line.toLowerCase() === "disallow: /"` misses equivalent blocking rules such as `Disallow:/`, `Disallow: /*`, `Disallow:  /` and `Disallow: / # preview`. Any of these hides the noindex from crawlers (D-15), which is exactly what G8 exists to stop, and the gate still passes.
**Fix:**

```js
if (lines.some((line) => /^disallow\s*:\s*\/\*?\s*(#.*)?$/i.test(line))) {
  report(8, '"Disallow: /" hides the noindex from crawlers (D-15)');
}
```

Add fixtures for `Disallow:/` and `Disallow: /*` to `test/seo-gate.test.js`.

## Info

### IN-01: web.config comment says GitHub Pages ignores the file, but Pages publishes it

**File:** `src/web.config.njk:10`
**Issue:** "GitHub Pages ignores this file" is wrong. The file is part of the Pages artifact and anyone can download it at `/IBC-Website/web.config`. The current content holds nothing sensitive, but the comment may lead someone to put server secrets or internal paths there later.
**Fix:** Reword the comment to something like "GitHub Pages serves this file as a plain download; only IIS interprets it. Never put secrets here."

### IN-02: Gate helpers duplicated between the script, the tests and site.js

**File:** `scripts/check-seo.js:18-44`, `test/helpers.js:28-98`, `src/_data/site.js:60`
**Issue:** `escapeRegExp`, `listFiles` and `block` exist in both `scripts/check-seo.js` and `test/helpers.js`. `localHosts` is defined in both `site.js` and `check-seo.js`. If one copy changes and the other does not, the tests and the gate will quietly disagree.
**Fix:** Move the shared helpers into `lib/` (e.g. `lib/html.js`, and export `localHosts` from `lib/seo.js`) and import them in all three places.

### IN-03: The JSON-LD Organization description is a hand-copied duplicate of the hero paragraph

**File:** `lib/schema.js:6-10`
**Issue:** The comment says the text "mirrors the hero paragraph in src/index.njk", but no code or test links the two. When the hero copy is edited during the Phase 4 content work, the structured data will drift without any warning.
**Fix:** Move the sentence into `site.js` (e.g. `site.description`) and render it in both places, or add a test asserting that `buildSchemaGraph(site).@graph[0].description` appears verbatim in the built home page.

### IN-04: The traversal guard in `locToRelPath` ignores backslash segments on Windows

**File:** `scripts/check-seo.js:273-283`
**Issue:** The guard checks only `/`-separated `..` segments. On Windows, `path.join(outDir, "a\\..\\..\\x")` normalises the backslashes and resolves outside `outDir`, so a `<loc>` or og:image value containing `..\` would make the gate stat or read a file outside the build. The input is the project's own build output, so the impact is low.
**Fix:** Split on `/[\\/]/`, or check `relative(outDir, resolve(outDir, rest))` the same way `scripts/clean.js` does.

### IN-05: Regenerating the SEO images is machine-dependent and not atomic

**File:** `tools/seo-images/make-seo-images.js:40`, `:99-105`, `:203-208`
**Issue:**
- The OG card text is rendered by librsvg with `Montserrat, 'Segoe UI', Arial, sans-serif`. Montserrat is not normally installed system-wide, so the committed card depends on whichever font the generating machine has.
- The six outputs are written one after another, so a failure partway through leaves a mix of old and new images.

**Fix:** Bundle the font and point fontconfig at it (or render the text from a committed PNG), then write all outputs to a temp folder and rename them into place only after every buffer has been produced.

### IN-06: `--dir` pointing at a file crashes with a stack trace

**File:** `scripts/check-seo.js:388-394`
**Issue:** The script only checks `existsSync(outDir)`. If the path is a file, `readdirSync` throws `ENOTDIR` without being caught. The exit code is still non-zero, but the user gets a stack trace instead of the gate's message.
**Fix:** Use `!existsSync(outDir) || !statSync(outDir).isDirectory()`.

### IN-07: G3 checks only the first og:image:width/height and allows duplicates

**File:** `scripts/check-seo.js:167-172`
**Issue:** `declared[0]` is the only value compared. A head with two `og:image:width` tags (e.g. a page that sets dimensions while the default branch also emits them) passes as long as the first one matches.
**Fix:** Report `declared.length > 1` as a G3 problem, the same way og:image duplicates are reported.

### IN-08: Draft-marker format is narrower than FACTS.md suggests

**File:** `test/facts.test.js:40`, `src/_includes/partials/head.njk:15`
**Issue:**
- facts.test recognises only the double-quoted `todo: "FACTS-NN"`. An unquoted `todo: FACTS-03` is still caught by G10 in the build output, but facts.test no longer cross-checks it against FACTS.md.
- `head.njk` renders a single `todo` value, so a page with two drafted blocks would need an array. That renders as `TODO(FACTS-01,FACTS-02)`, which facts.test's `TODO\((FACTS-\d+)\)` does not parse.

**Fix:** Accept optional quotes in the regex, and support a list in head.njk (`{% for t in ([todo] | flatten) %}<!-- TODO({{ t }}) -->{% endfor %}`), or document the single-ID limit in FACTS.md.

### IN-09: Workflow actions are pinned to mutable major tags while deploy holds `id-token: write`

**File:** `.github/workflows/pages.yml:25-26`, `:34`, `:51`
**Issue:** `actions/checkout@v7`, `setup-node@v7`, `upload-pages-artifact@v5` and `deploy-pages@v5` use movable tags. The deploy job has `pages: write` and `id-token: write`, so a compromised tag would run with deploy rights.
**Fix:** Pin each action to a full commit SHA with a `# vX.Y.Z` comment, and let Dependabot (`package-ecosystem: github-actions`) bump them.

---

_Reviewed: 2026-10-07T19:32:54Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
