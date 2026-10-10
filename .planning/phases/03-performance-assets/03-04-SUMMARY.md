---
phase: 03-performance-assets
plan: 04
subsystem: build
tags: [eleventy-img, avif, webp, picture, lightbox, gallery, logo, node-test]

requires:
  - phase: 03-performance-assets
    provides: "03-01 lib/images.js presets + memoized processImages(), images global data, sync picture shortcode, eleventy.after copy into <output>/img/, links.test.js data-lightbox-* resolver"
provides:
  - "src/_data/gallery.js: single source of the gallery content ({ file, title, desc, alt }, display order)"
  - "lib/images.js: thumb (400/600/900/1200 w), lightbox (1600 w) and logo (50/100 w, avif/webp/png) presets; images.gallery[] and images.logo"
  - "Gallery rendered from one {% for %} loop of lazy <picture>s with data-lightbox-avif/webp/jpeg on each .gallery-item"
  - "<picture class=\"lightbox-picture\"> that ships without <source> or src; the lightbox inserts typed sources on first open (ensureSources) and sets the JPEG src last"
  - "Header logo as a 50/100 w AVIF/WebP/PNG <picture> instead of the 4608x4500 original"
affects: [03-06 asset move to src/images and hero.jpg removal, 03-09 main.js module split, 03-11 perf gate budgets and parity checklist]

actuals:
  tokens: 5074
  tasks: 2
  commits: 2
plan_head_before: b6a0ca837b5449633d10bd9d5fc93cd99208fd66
plan_head_after: 546d885ff478ccc5d7659088fba1767c02bfa816

tech-stack:
  added: []
  patterns:
    - "Content lists live in src/_data/*.js and lib/images.js imports them, so the template loop and the image step read one source"
    - "Lazy media containers ship empty (<picture> with no <source>, <img> with no src but width/height) and the script fills them on first use"
    - "Typed <source> srcset is set before img.src so changing src forces a new source selection (research A1)"

key-files:
  created: [src/_data/gallery.js]
  modified: [lib/images.js, src/index.njk, src/js/main.js, src/_includes/partials/header.njk, test/images.test.js, test/layout.test.js]

key-decisions:
  - "Logo loads lazily (D-16 locked rule for every non-hero image wins over research Pitfall 10's eager suggestion); the 2-6 KB variant arrives right after first layout"
  - "Logo preset uses eleventy-img default encoder quality; 50/100 w come out at AVIF 2.4/6.2 KB, WebP 2.9/8.3 KB, PNG 6.3/19.4 KB"
  - "Logo <img> carries width=100 height=97 (eleventy-img emits the largest variant's size); .logo-img height 48px / width auto keeps the rendered size, the attributes only fix the aspect ratio"

patterns-established:
  - "Gallery entries: images.gallery[] = { ...entry, thumb, lightbox } in src/_data/gallery.js order"
  - "URLs outside HtmlBasePlugin's reach (data-lightbox-*) go through htmlBaseUrl once; never inside the picture shortcode"

requirements-completed: [PERF-01, PERF-03]

coverage:
  - id: D1
    description: "Four gallery items render from one loop as <picture>s with image/avif and image/webp sources (responsive srcset + sizes) and a lazy, async JPEG <img> with width/height; alpha-channel PNG sources keep their JPEG fallback"
    requirement: PERF-01
    verification:
      - kind: integration
        ref: "test/images.test.js#gallery thumbnails are lazy AVIF/WebP pictures with a JPEG fallback (PERF-01)"
        status: pass
      - kind: integration
        ref: "test/layout.test.js#prefix build puts every internal URL under the prefix"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every gallery item's data-lightbox-avif/webp/jpeg points at an existing 1600 w variant under 307200 bytes (largest 229,074 B); under /IBC-Website/ every value starts with /IBC-Website/img/"
    requirement: PERF-03
    verification:
      - kind: integration
        ref: "test/images.test.js#lightbox targets are 1600 w and under 300 KB (PERF-03, D-04)"
        status: pass
      - kind: integration
        ref: "test/links.test.js (data-lightbox-* resolve in root and prefix builds)"
        status: pass
    human_judgment: false
  - id: D3
    description: "At rest the lightbox <picture> has no <source> and its img has no src but width=1600 height=900 loading=lazy"
    requirement: PERF-03
    verification:
      - kind: integration
        ref: "test/images.test.js#the lightbox loads nothing at rest"
        status: pass
    human_judgment: false
  - id: D4
    description: "Opening the lightbox shows the right 1600 w image in the best supported format with caption; arrows, ArrowLeft/ArrowRight, Esc and outer click work as before; gallery grid matches the Phase 1 framing"
    requirement: PERF-03
    verification:
      - kind: manual_procedural
        ref: "Tracer feedback gate after Task 1 (human-verify): approved by the user"
        status: pass
    human_judgment: true
    rationale: "Runtime source selection in a real browser (research A1) and visual parity with the Phase 1 screenshot are not asserted by any test; the user approved the tracer check, and 03-11 repeats it in the parity run"
  - id: D5
    description: "Header logo is a <picture> of 50/100 w AVIF/WebP/PNG variants with class logo-img, width/height, loading=lazy; the prefix build logo src starts with /IBC-Website/img/; header identical on dev pages"
    requirement: PERF-03
    verification:
      - kind: integration
        ref: "test/images.test.js#logo is served at its display size (PERF-03)"
        status: pass
      - kind: integration
        ref: "test/layout.test.js#prefix build puts every internal URL under the prefix"
        status: pass
      - kind: integration
        ref: "test/devpages.test.js#(b) dev pages share the home page's header and footer byte for byte"
        status: pass
    human_judgment: false
  - id: D6
    description: "Header logo looks the same as before at 1440 px and 390 px (48 px tall, same spacing to the clan name)"
    requirement: PERF-03
    verification: []
    human_judgment: true
    rationale: "Visual parity of the logo (D-15, Pitfall 7 sub-pixel width difference) is a judgment call; collected at the end of the phase (03-11 parity checklist)"
  - id: D7
    description: "Phase 2 SEO images (OG card, icons, favicon.ico, brand logo) byte-identical to 03ce0de (D-06)"
    verification:
      - kind: other
        ref: "git diff --quiet 03ce0de -- src/assets/og src/assets/icons src/assets/brand src/favicon.ico (exit 0)"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-10-10
status: complete
---

# Phase 3 Plan 04: Gallery, Lightbox and Logo Images Summary

**The gallery now ships lazy 400-1200 w AVIF/WebP/JPEG pictures from one data-driven loop, the lightbox opens a 1600 w variant (at most 224 KB) in the best supported format by inserting typed sources on first open, and the 4608 px header logo is replaced by 50/100 w AVIF/WebP/PNG variants of 2-19 KB**

## Performance

- **Duration:** about 7 min of execution (the tracer human check paused the plan between tasks)
- **Started:** 2026-10-10T19:19:37Z
- **Completed:** 2026-10-10T19:26:34Z
- **Tasks:** 2
- **Files modified:** 7 (1 created, 6 modified)

## Accomplishments

- `src/_data/gallery.js` holds the four gallery entries (file, title, desc, alt) in display order. `lib/images.js` imports it and runs the thumb and lightbox presets on each file. `src/index.njk` renders the grid from `{% for g in images.gallery %}`.
- Each gallery `<picture>` has `image/avif` and `image/webp` sources with a 4-width srcset and `sizes="auto, (min-width: 1240px) 285px, (min-width: 660px) 50vw, 100vw"`, plus a lazy, async JPEG `<img>` with width and height. The two PNGs with an alpha channel keep their JPEG fallback (`formatFiltering: []`).
- Lightbox targets are 1600 w variants. The largest is 229,074 B (a WebP), well under the 307,200 B cap. In the `/IBC-Website/` build every `data-lightbox-*` value starts with `/IBC-Website/img/` and resolves.
- The lightbox `<picture class="lightbox-picture">` ships empty. `initLightbox` guards every element, `ensureSources()` creates the avif/webp `<source>`s on first open, and `updateLightboxContent()` sets the avif srcset, then the webp srcset, then the JPEG `img.src` last.
- The header logo is `{% picture images.logo, … %}`: AVIF 2.4/6.2 KB, WebP 2.9/8.3 KB, PNG 6.3/19.4 KB at 50/100 w, instead of the 4608x4500 `logo.png`. `.logo-img` still renders it 48 px tall.
- No template or stylesheet references an original under `src/assets/` any more, apart from the noindex `/_dev/og-override/` dev page (03-06 repoints it). The Phase 2 SEO images are byte-identical to 03ce0de.
- `npm test`: 232/232 pass.

## Task Commits

1. **Task 1 (tracer): gallery thumbnails and the lightbox serve optimized AVIF/WebP/JPEG end to end.** `c8bebc2` (feat). Tracer feedback gate (human-verify): the user approved it.
2. **Task 2: header logo served at its display size.** `546d885` (feat)

**Plan metadata:** in the docs(03-04) commit that adds this SUMMARY.

## Files Created/Modified

- `src/_data/gallery.js` (new): the single source of the gallery content.
- `lib/images.js`: `thumb`, `lightbox` and `logo` presets. `processImages()` returns `images.gallery` and `images.logo` and adds all of their outputs to `files`.
- `src/index.njk`: the gallery loop with `data-lightbox-*` attributes (through `htmlBaseUrl`) and the empty lightbox picture.
- `src/js/main.js`: `initLightbox` reads `data-lightbox-avif/webp/jpeg` and switches typed sources (`ensureSources`).
- `src/_includes/partials/header.njk`: the logo `<picture>`.
- `test/images.test.js`: gallery picture, lightbox budget, lightbox-at-rest and logo tests.
- `test/layout.test.js`: the prefix test checks the gallery img src, the `data-lightbox-*` values and the logo src under `/IBC-Website/img/`.

## Decisions Made

- The logo uses `loading="lazy"`. The locked D-16 rule covers every non-hero image, and the plan chose it over the eager loading that research Pitfall 10 suggested.
- The logo preset keeps eleventy-img's default encoder quality. At 2-19 KB the variants are already tiny, so no tuning was needed.
- The logo `<img>` gets `width="100" height="97"` because eleventy-img emits the largest variant's size. CSS (`height: 48px; width: auto`) sets the rendered size, and the attributes only reserve the aspect ratio.

## Deviations from Plan

None. The plan was executed as written.

## Issues Encountered

- Git warns that LF will become CRLF in the four Task 2 files the next time it touches them. This is the repo's existing autocrlf behavior, and the content is unchanged.
- The previous executor may have left an Eleventy dev server running on port 8080. Nothing here needed that port, so it was left alone.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 03-06 can move the originals from `src/assets/` to `src/images/` (update `sourceDir`) and delete `hero.jpg`. Only the `/_dev/og-override/` dev page still points at an original.
- 03-09 can turn `initLightbox` into a module. Its markup contract is `data-lightbox-*` on `.gallery-item` plus `<picture class="lightbox-picture">`.
- Open human checks for the 03-11 parity checklist: logo appearance at 1440 and 390 px (D6), and the lightbox format selection in a real browser (research A1, already approved once at the tracer gate).

## Self-Check: PASSED

- FOUND: src/_data/gallery.js, lib/images.js, src/index.njk, src/js/main.js, src/_includes/partials/header.njk, test/images.test.js, test/layout.test.js
- FOUND commits: c8bebc2, 546d885 (both ancestors of HEAD; `git rev-list --count b6a0ca8..HEAD` = 2)
- Acceptance: `grep -c "picture images.logo" header.njk` = 1; `grep -c "logo:" lib/images.js` = 1; D-06 `git diff --quiet 03ce0de -- …` exit 0; `node --test test/images.test.js test/layout.test.js test/devpages.test.js` 25/25; `npm test` 232/232

---
*Phase: 03-performance-assets*
*Completed: 2026-10-10*
