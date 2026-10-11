---
phase: 03-performance-assets
reviewed: 2026-10-11T11:13:30Z
depth: standard
files_reviewed: 59
files_reviewed_list:
  - eleventy.config.js
  - lib/check-perf.js
  - lib/css.js
  - lib/icons.js
  - lib/images.js
  - lib/reject-output.js
  - lib/woff2.js
  - package.json
  - README.md
  - scripts/check-perf.js
  - scripts/check-seo.js
  - scripts/warm-images.js
  - src/_data/gallery.js
  - src/_dev/font-test.njk
  - src/_dev/og-override.njk
  - src/_includes/layouts/base.njk
  - src/_includes/partials/discord-cta.njk
  - src/_includes/partials/footer.njk
  - src/_includes/partials/head.njk
  - src/_includes/partials/header.njk
  - src/404.njk
  - src/css/partials/base.css
  - src/css/partials/components.css
  - src/css/partials/fonts.css
  - src/css/partials/footer.css
  - src/css/partials/gallery.css
  - src/css/partials/header.css
  - src/css/partials/hero.css
  - src/css/partials/recruitment.css
  - src/css/partials/responsive.css
  - src/css/partials/sections.css
  - src/css/style.11ty.js
  - src/css/style.css
  - src/index.njk
  - src/js/main.js
  - src/js/modules/easter-egg.js
  - src/js/modules/lightbox.js
  - src/js/modules/menu.js
  - src/js/modules/scroll-spy.js
  - src/js/modules/terminal.js
  - src/web.config.njk
  - test/build.test.js
  - test/client.test.js
  - test/css.test.js
  - test/deps.test.js
  - test/devpages.test.js
  - test/docs.test.js
  - test/fonts.test.js
  - test/icons.test.js
  - test/images.test.js
  - test/layout.test.js
  - test/links.test.js
  - test/modules.test.js
  - test/perf-gate.test.js
  - test/seo.test.js
  - test/seo-assets.test.js
  - test/seo-files.test.js
  - test/workflow.test.js
  - tools/fonts/README.md
  - tools/seo-images/make-seo-images.js
findings:
  critical: 1
  warning: 5
  info: 6
  total: 12
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-10-11T11:13:30Z
**Depth:** standard
**Files Reviewed:** 59
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

I reviewed every listed file and also checked the output of a real `/IBC-Website/` build in a scratch folder (pictures, preload, web.config, CSS bundle, JS layout). The image pipeline, icon shortcode, Lightning CSS bundle, WOFF2 cmap reader and the data-js loader are mostly sound. The WOFF2 directory, format 4 and format 12 parsing match the spec. `resolveLocal` contains path traversal correctly. The icon and hook allow-lists fail closed.

The main concerns:

1. **Shared rejection helper can move or delete source folders (BLOCKER).** `lib/reject-output.js` will move, and as a fallback recursively delete, any in-repo folder given to `--dir`. The new P0 rule makes every folder that is not build output fail, so `--dir src` or `--dir .git` renames or deletes that folder.
2. **JS is not cache-busted.** The CSS is, but `main.js` is not. For a returning visitor, this deploy pairs the new HTML with the cached old `main.js`, and the gallery lightbox breaks.
3. **Gaps in the perf gate.** Gallery thumbnails, logo variants and the desktop hero candidates have no size cap and no existence check. External and inline scripts are not counted in the JS budget.
4. **Close handlers undo `overflow-x: clip`.** The lightbox and easter-egg close handlers set `overflow: auto` on body, which overrides the `overflow-x: clip` guard. This bug existed before and was carried into the new modules.
5. **Stale images in `npm run dev`.** `processImages()` is memoized for the whole process, so edits to `gallery.js` or `src/images/` do not show until a restart.

No visual or design changes are recommended (D-15).

## Critical Issues

### CR-01: A mistyped `--dir` moves or recursively deletes source folders (`src/`, `.git/`, `node_modules/`)

**File:** `lib/reject-output.js:17-35` (called from `scripts/check-perf.js:24-28,54` and `scripts/check-seo.js:50`; triggered by `lib/check-perf.js:465`)
**Issue:** `removeRejectedOutput` refuses only the repo root and paths outside it. Any other folder inside the repository is fair game.

- `node scripts/check-perf.js --dir src` passes the CLI checks: the folder exists and is a directory.
- `checkPerf` finds no `.html` files and returns the P0 problem (`lib/check-perf.js:465`).
- The CLI then runs `rmSync("src.rejected")` followed by `renameSync("src", "src.rejected")`.
- If the rename fails, `rmSync(outDir, { recursive: true, force: true })` deletes the folder. On Windows this is common, because `EPERM`/`EBUSY` is raised when a watcher or an open terminal holds a handle inside the folder, for example `npm run dev` watching `src/`.

The same thing happens with `--dir .git` (the repository is "lost"), `--dir node_modules`, `--dir lib` and so on. P0 guarantees that any folder which is not build output gets rejected, so this is not a rare edge case: one wrong argument to a documented option loses uncommitted source. Because the helper is shared, `check-seo.js` behaves the same way. T-03-07 did not consider which folders may be disposed of.

**Fix:** Only dispose of folders that are clearly build output. Never use a recursive-delete fallback on anything else.

```js
// lib/reject-output.js
const disposable = (rel) => {
  const posix = rel.split(sep).join("/");
  return posix === "_site" || posix.startsWith("_test/");
};

export function removeRejectedOutput(outDir, repoRoot) {
  const rel = relative(repoRoot, outDir);
  if (rel === "" || rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel) || !disposable(rel)) {
    return `${outDir} is not a build output folder (_site/ or _test/**), so it was left in place: DO NOT DEPLOY IT`;
  }
  // ... existing move / delete logic ...
}
```

Also add tests for `--dir src` and `--dir .git` that assert each folder is left untouched.

## Warnings

### WR-01: `/js/main.js` and its modules are not cache-busted, so returning visitors run stale JS against new HTML

**File:** `src/_includes/layouts/base.njk:23`, `src/js/main.js:7-13`
**Issue:** The stylesheet is versioned (`/css/style.css?v=<hash>`, `head.njk:31`). The script is not:

- `<script type="module" src="/js/main.js">` has no version.
- The modules are imported from fixed URLs (`./modules/lightbox.js`).
- Neither GitHub Pages (`max-age=600`) nor IIS (heuristic freshness from `Last-Modified`, no `clientCache` in `web.config`) forces a revalidation.

This phase changed the JS contract: `data-src` became `data-lightbox-*`, `DOMContentLoaded` became module hooks, and display became `.is-open`. A returning visitor with the old `main.js` cached gets that old script at the same URL. It runs as a module, its `initLightbox` reads the now-missing `data-src`, and it sets `imgEl.src = null`, so the lightbox opens on a broken image. None of the new modules load. This repeats on any later deploy that changes a hook or a module API.

**Fix:** Version the entry the same way as the CSS. Hash `src/js/**` at build time and emit `<script type="module" src="/js/main.js?v={{ jsHash }}">`. Then either build the module URLs in `main.js` from `import.meta.url`'s `?v=` (a literal map such as `() => import('./modules/menu.js' + v)`), or include the hash in the module file names. Alternatively, set `<clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="0.00:10:00">` for `/js` in `web.config`. That is weaker, but bounded.

### WR-02: Closing the lightbox or the easter egg sets `body { overflow: auto }`, which overrides the `overflow-x: clip` guard

**File:** `src/js/modules/lightbox.js:59`, `src/js/modules/easter-egg.js:12` (guard in `src/css/partials/header.css:133-135`)
**Issue:** `document.body.style.overflow = 'auto'` is the shorthand, so the inline style also sets `overflow-x: auto`. That overrides the stylesheet's `body { overflow-x: clip }`, which exists so that narrow-phone overflow does not widen the layout. After the first close, body becomes a horizontal scroll container, and the overflow the clip was hiding becomes pannable. `menu.js:14,23` already does this correctly with `''`. This bug was copied unchanged from the old `main.js` into the new modules.
**Fix:** Clear the inline style instead of forcing a value:
```js
document.body.style.overflow = ''; // lightbox.js:59 and easter-egg.js:12
```

### WR-03: The perf gate never sizes or checks most shipped image variants (thumbnails, logo, desktop hero)

**File:** `lib/check-perf.js:355-371` (line 364), `lib/check-perf.js:272-280`
**Issue:**

- P8 skips every image under `img/` and says these are "policed by P1/P2".
- P1 checks only hero candidates of 1280 w or less.
- P2 checks only the `data-lightbox-*` targets.

So the gallery thumbnails (400–1200 w × 3 formats), the logo variants and the 1920 w hero candidates have no byte cap at all, for example after a quality or format regression in `lib/images.js` presets. They are also never checked for existence: a missing thumbnail `srcset` URL or a missing 1920 hero file passes both production gates, because check-seo does not check `src`/`srcset` either. The test `"P8 250 KB variant under img is left to P1 and P2"` (`test/perf-gate.test.js:287`) locks in this gap.
**Fix:**
- Resolve every `<img src>`, `<img srcset>`, `<source srcset>` and `<link imagesrcset>` URL on each page through `ctx.resolveFile`, and report anything that is not `ok`.
- Add a `thumbMaxBytes`-style cap, or a generic `variantMaxBytes` in `BUDGET` (measured + 25 %), for `img/` files that P1 and P2 do not already govern.
- Correct the comment at lines 355-356.

### WR-04: The initial-JS budget (P10) fails open for external and inline scripts

**File:** `lib/check-perf.js:405-409`
**Issue:**

- `pageJs` skips a `<script src>` that resolves to `external` without reporting it.
- `stripInert` blanks inline `<script>` bodies before any rule runs.

A third-party script tag (an analytics or widget bundle from a CDN) or a large inline script adds unbounded JS to every page, and P10 still passes. P3 catches only the six font and icon hosts. P10 is supposed to enforce the "initial JS gzip per page" cap from D-17.
**Fix:** Report external script sources (`problems.push(unresolved("script", file))` for `status === "external"`), or list explicitly allowed hosts in `BUDGET`. Measure the gzip size of inline non-JSON-LD script bodies from the unstripped markup and add it to `total`.

### WR-05: `processImages()` is memoized for the whole process, so `npm run dev` serves stale gallery and image data

**File:** `lib/images.js:74-94`, `eleventy.config.js:25,33-38`
**Issue:**

- `pending ??= ...` is never reset, unlike the CSS bundle, which resets in `eleventy.before`.
- `lib/images.js` imports `src/_data/gallery.js` through Node's ESM cache.
- `index.njk:79` loops over `images.gallery`, not over the `gallery` global data.

So during `npm run dev`, editing a title, description, alt text or the order in `gallery.js` changes nothing on the page until a restart. Adding or replacing a file in `src/images/` is not picked up either. A rejected encode (for example a bad file) also stays memoized for the session. The README asks for a restart only after adding an image, not after editing `gallery.js`.
**Fix:** Reset the memo per build the same way as the CSS, and read the gallery through Eleventy's data or with a cache-busted import:
```js
// lib/images.js
export function resetImages() { pending = null; }
// eleventy.config.js
eleventyConfig.on("eleventy.before", () => { resetCssBundle(); resetImages(); });
eleventyConfig.addWatchTarget("src/images/");
```
Then load the gallery with `await import(\`../src/_data/gallery.js?t=${Date.now()}\`)` inside `processImages`. The eleventy-img disk cache keeps rebuilds cheap.

## Info

### IN-01: The image-source containment check is against the repo root, not `src/images/`

**File:** `lib/images.js:57-63`
**Issue:** `outside` is computed relative to `repoRoot`, so a gallery entry such as `"../../package.json"` or `"../assets/brand/ibc-logo-512.png"` passes the guard. The comment and D-02 say that originals live in `src/images`.
**Fix:** Compute `relative(resolve(repoRoot, sourceDir), path)` and reject anything that starts with `..`.

### IN-02: The feature loader has no rejection handling

**File:** `src/js/main.js:17-22`
**Issue:** If a module fails to load (a 404 from a stale cache, see WR-01, or a network error) or its `init` throws, the `Promise.all` rejection is never handled. You get an "Uncaught (in promise)" error with no context. The other features still run.
**Fix:** `.then(mod => mod.init(el)).catch(() => {})` per hook, or `Promise.allSettled`.

### IN-03: The lightbox `<img>` keeps a static English alt for every photo

**File:** `src/index.njk:153`, `src/js/modules/lightbox.js:47-55`
**Issue:** `alt="Lightbox image"` is never updated. `gallery.js` now has a proper Polish `alt` per photo, but the screen-reader text in the lightbox stays the same English placeholder. This predates the phase but sits in rewritten code.
**Fix:** Emit `data-lightbox-alt="{{ g.alt }}"` on each item and set `imgEl.alt = data.alt` in `updateLightboxContent`.

### IN-04: Three different font size caps

**File:** `lib/check-perf.js:41` (45 824 B), `test/fonts.test.js:20` (46 080 B), `tools/fonts/README.md:92` ("45 KB (46 080 bajtów), sprawdzany przez test/fonts.test.js")
**Issue:** The README names the test as the enforcer and gives a cap that differs from the D-17 `BUDGET` value. The values will drift.
**Fix:** Import `BUDGET.fontMaxBytes` in `test/fonts.test.js`, and point the README at `BUDGET`.

### IN-05: Unused originals are committed in the pipeline input folder

**File:** `src/images/patrol.jpg`, `src/images/sniper.jpg`
**Issue:** These files (about 2.1 MB) are in no preset and not in `gallery.js`. They only exist as names that P8 polices.
**Fix:** Delete them, or add them to `gallery.js` on purpose (Phase 5 content decision).

### IN-06: The P3 host list covers only the replaced CDNs

**File:** `lib/check-perf.js:59-66`
**Issue:** Other common font and icon hosts (`use.typekit.net`, `fonts.bunny.net`, `cdn.jsdelivr.net`, `unpkg.com`) would pass, so PERF-04/05 ("no third-party font/icon host") is enforced only against the old providers.
**Fix:** Extend the list, or turn it into an allow-list of external origins the site may reference (Discord, YouTube, Facebook, schema.org).

---

_Reviewed: 2026-10-11T11:13:30Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
