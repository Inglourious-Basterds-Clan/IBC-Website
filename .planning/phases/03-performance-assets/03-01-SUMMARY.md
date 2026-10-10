---
phase: 03-performance-assets
plan: 01
subsystem: build
tags: [eleventy-img, sharp, avif, webp, lcp, preload, node-test]

requires:
  - phase: 02-seo-foundation
    provides: HtmlBasePlugin prefix handling, check-seo gate, tools/seo-images sharp 0.35.5 vetting, test/helpers.js
provides:
  - "lib/images.js: hero preset, repo-only source guard, memoized processImages() writing into .cache/img/"
  - "eleventy.config.js: images global data, sync picture shortcode, eleventy.after copy of used variants into <output>/img/"
  - "Hero as <picture> (AVIF/WebP/JPEG) with <img fetchpriority=high loading=eager>, home-only typed AVIF preload passed through htmlBaseUrl"
  - "scripts/warm-images.js + npm pretest: shared cache warmed before parallel test builds"
  - "test/images.test.js and test/deps.test.js guards; links.test.js resolves imagesrcset and data-lightbox-* URLs"
affects: [03-04 gallery/lightbox/logo images, 03-05 font url(), 03-06 asset move to src/images, 03-11 perf gate and parity checklist]

actuals:
  tokens: 13228
  tasks: 2
  commits: 3
plan_head_before: 4ad4530d098383cbfa17dafea76f492c7d574c3c
plan_head_after: df0762f82470a527de98ade399001a99b8d7c6ab

tech-stack:
  added: ["@11ty/eleventy-img 7.0.0 (devDependency, exact)", "sharp 0.35.5 (transitive, pinned via overrides)"]
  patterns:
    - "One memoized image step -> global data -> sync shortcode (Image.generateHTML)"
    - "Variants encoded into the shared content-addressed .cache/img/, copied per build by eleventy.after"
    - "URLs in attributes HtmlBasePlugin does not rewrite (imagesrcset, data-*) go through htmlBaseUrl exactly once"

key-files:
  created: [lib/images.js, scripts/warm-images.js, test/images.test.js, test/deps.test.js]
  modified: [package.json, package-lock.json, eleventy.config.js, src/index.njk, src/_includes/partials/head.njk, src/css/style.css, test/links.test.js, test/seo-assets.test.js]

key-decisions:
  - "sharp pinned by package.json overrides (0.35.5), never a direct root dependency; deps.test.js fails on any other resolution"
  - "Only the AVIF set is preloaded (typed preload); imagesizes=100vw mirrors the img sizes to avoid a double download"
  - "The pretest warm step got its own target test in images.test.js, the honest RED for Task 2 (the build-output checks already passed after the Task 1 tracer)"

patterns-established:
  - "picture shortcode: {% picture images.<name>, { quoted-key attrs } %} with the metadata from the images global data"
  - "picture { display: contents } so wrapping an img never changes layout"

requirements-completed: [PERF-02, PERF-01]

coverage:
  - id: D1
    description: "Hero ships as a <picture> with AVIF/WebP sources and a JPEG <img fetchpriority=high loading=eager width=1920 height=1080>"
    requirement: PERF-02
    verification:
      - kind: integration
        ref: "test/images.test.js#hero is a high-priority picture (PERF-02)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Exactly one typed AVIF image preload on the home page; prefix build URLs start with /IBC-Website/img/ and resolve; 404.html has none"
    requirement: PERF-02
    verification:
      - kind: integration
        ref: "test/images.test.js#hero preload matches the img (D-03, Pitfall 1)"
        status: pass
      - kind: integration
        ref: "test/links.test.js#(a) internal URLs resolve in the prefix build (/IBC-Website/)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every hero candidate of 1280 w or less is at most 122880 bytes in AVIF, WebP and JPEG (measured 83/116/113 KB at 1280 w)"
    requirement: PERF-02
    verification:
      - kind: integration
        ref: "test/images.test.js#hero mobile candidates fit 120 KB (D-03)"
        status: pass
    human_judgment: false
  - id: D4
    description: "img/ ships only variants some page references; .cache/img is never passthrough-copied"
    requirement: PERF-01
    verification:
      - kind: integration
        ref: "test/images.test.js#img/ ships only referenced variants"
        status: pass
    human_judgment: false
  - id: D5
    description: "npm pretest warms .cache/img before parallel test builds"
    verification:
      - kind: integration
        ref: "test/images.test.js#the shared image cache is warmed before parallel test builds (Pitfall 5)"
        status: pass
      - kind: other
        ref: "rm -rf .cache/img && npm test (174/174 pass)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Lockfile resolves exactly one sharp 0.35.5 (overrides), records the linux-x64 binaries, eleventy-img pinned to 7.0.0"
    verification:
      - kind: unit
        ref: "test/deps.test.js (6 tests incl. 0.35.4 negative control)"
        status: pass
      - kind: unit
        ref: "test/seo-assets.test.js#the image tool is isolated from the site build (T-02-SC)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Hero looks the same as the former CSS background (cover/centre framing, same gradient overlay on ::after, behind the content)"
    verification: []
    human_judgment: true
    rationale: "Visual parity (D-03, D-15) is a judgment call no test asserts; check the home page at desktop and phone widths, including softness of the 1280 candidate on a 3x phone (Pitfall 9)"

duration: 5min
completed: 2026-10-10
status: complete
---

# Phase 3 Plan 01: Hero Image Pipeline (eleventy-img tracer) Summary

**The 4.7 MB PNG hero background is now a build-time AVIF/WebP/JPEG `<picture>` from @11ty/eleventy-img with a prefix-safe `fetchpriority="high"` AVIF preload, 83/116/113 KB at 1280 w, with sharp locked to the vetted 0.35.5**

## Performance

- **Duration:** about 5 min
- **Started:** 2026-10-10T18:49:30Z
- **Completed:** 2026-10-10T18:54:21Z
- **Tasks:** 2
- **Files modified:** 12 (4 created, 8 modified)

## Accomplishments

- Hero renders as `<picture>` with `image/avif` and `image/webp` sources and a JPEG `<img loading="eager" fetchpriority="high" decoding="async" width="1920" height="1080">` (widths 640/960/1280/1920).
- `index.html` head has one `<link rel="preload" as="image" type="image/avif" fetchpriority="high" imagesizes="100vw" imagesrcset=…>`. Under `/IBC-Website/` every candidate starts with `/IBC-Website/img/` and resolves. 404.html has no image preload.
- Hero sizes at 1280 w: AVIF 83,360 B, WebP 116,260 B, JPEG 112,776 B. All are under the 122,880 B budget, and so is every smaller width.
- The eleventy-img architecture is proven end to end for 03-04: shared `.cache/img/` cache, `images` global data, sync `picture` shortcode, and an `eleventy.after` copy of exactly the used variants.
- `npm test` runs `pretest` (warm-images) first. From a cold cache: `warm-images: 12 file(s) ready in .cache/img`, then 174/174 tests pass.
- `npm ls sharp` shows a single `sharp@0.35.5 overridden`. The lockfile has `@img/sharp-linux-x64` and `@img/sharp-libvips-linux-x64` for CI.

## Task Commits

1. **Task 1 (tracer): hero goes from source through eleventy-img into a preloaded picture.** `0eb52ee` (feat)
2. **Task 2 (TDD): cache warm step and guards.** RED `dd23a9f` (test), GREEN `df0762f` (feat). No refactor commit (nothing to clean up).

## TDD Record (Task 2)

- **RED:** `node --test --test-reporter=tap test/images.test.js` exited 1, with 5 tests, 4 passing and 1 failing. The failing test was the target, "the shared image cache is warmed before parallel test builds (Pitfall 5)". It failed on its first planned assertion: `scripts.pretest` was `undefined`, not `"node scripts/warm-images.js"`. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`, format `tap`). Semantic assessment: the target executed and failed for the intended reason, not because of a load, syntax or fixture fault. The other four build-output tests passed because the Task 1 tracer had already shipped that behavior.
- **Planned wrong-expectation check:** a temporary copy of images.test.js set the budget to 50,000 B and wrote an unreferenced `img/stale-640.avif`. The budget test failed with "avif 960 w is 50379 bytes, over the 50000-byte budget". The stale-file test failed with "root: img/stale-640.avif is not referenced by any page". The copy was then deleted.
- **GREEN:** adding `scripts/warm-images.js` and `"pretest"` brought images, deps and seo-assets to 17/17 passing and the full suite to 174/174.
- **REFACTOR:** none needed.

## Files Created/Modified

- `lib/images.js`: presets (hero), `sourceDir`, `imageCacheDir`, repo-only `run()` guard (T-03-01), memoized `processImages()`.
- `scripts/warm-images.js`: the pretest step that fills `.cache/img`.
- `eleventy.config.js`: `images` global data, sync `picture` shortcode, `eleventy.after` copy into `<output>/img/`.
- `src/index.njk`: hero `{% picture images.hero, … %}` inside `.hero-image-bg`.
- `src/_includes/partials/head.njk`: home-only AVIF preload, built through `htmlBaseUrl`.
- `src/css/style.css`: `picture { display: contents }`, `.hero-img`, `.hero-image-bg::after` gradient, background declarations removed, `width/height: auto` on `.lightbox-content img`.
- `test/links.test.js`: the resolver now also checks `imagesrcset` and `data-lightbox-*`. Test (b) no longer requires at least one url().
- `test/images.test.js`, `test/deps.test.js`: new guards.
- `test/seo-assets.test.js`: root `overrides.sharp` must equal the tool's vetted sharp.
- `package.json` / `package-lock.json`: `@11ty/eleventy-img` 7.0.0 (exact), `overrides.sharp` 0.35.5, `pretest`.

## Decisions Made

- The `pretest` behavior got its own target test, which gave Task 2 a real RED. Everything else Task 2 checks already existed after the Task 1 tracer.
- `run()` treats any `scheme:` name as a URL and rejects it. This also rejects Windows drive-letter paths, which are outside the allowed "file name inside src/assets" input anyway.
- The preload sits in its own `{% if isHome %}` block just above the `<!-- Stylesheets & Preconnect -->` comment, so it comes before the stylesheet links.

## Deviations from Plan

None. The plan was executed as written. The extra pretest target test in images.test.js covers behavior the plan already required (acceptance: "4 or more passing tests").

## Issues Encountered

- `npm install` reports 9 audit findings (braces, sprintf-js, js-yaml via gray-matter/chokidar/nunjucks). All come from the existing `@11ty/eleventy` tree, which was already in the lockfile before this plan. They are out of scope and were left alone.
- Several source files have CRLF line endings, so edits went through the Edit tool and kept each file's endings.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 03-04 can add gallery, lightbox and logo entries to `presets` and `processImages()`. The shortcode, copy step, budget/stale tests and the links resolver for `data-lightbox-*` are already in place.
- Human parity check (D7) is still open: the hero should look identical to before, with softness of the 1280 candidate on 3x phones accepted under D-03 (listed for the 03-11 parity checklist).

## Self-Check: PASSED

- FOUND: lib/images.js, scripts/warm-images.js, test/images.test.js, test/deps.test.js
- FOUND commits: 0eb52ee, dd23a9f, df0762f (`check evaluation-scope --plan 03-01 --commits-only` resolved all 3)
- Plan verification: root and `/IBC-Website/` production builds pass with check-seo OK; `npm test` 174/174; `npm ls sharp` shows one sharp@0.35.5.

---
*Phase: 03-performance-assets*
*Completed: 2026-10-10*
