---
phase: 02-technical-seo
plan: 02
subsystem: seo
tags: [sharp, og-image, favicon, ico, icons, json-ld-logo, image-headers, node-test]

requires:
  - phase: 02-technical-seo
    provides: "02-01 site.ogImage = /assets/og/og-default-v1.jpg (the file name produced here)"
provides:
  - tools/seo-images/ isolated tool package pinning sharp 0.35.4 exactly (own lockfile; root package.json untouched)
  - tools/seo-images/make-seo-images.js one-off generator (OG card with pixel safe-area check, icon set, toIco favicon, JSON-LD logo)
  - src/assets/og/og-default-v1.jpg 1200x630 JPEG, 70,132 bytes (D-06)
  - src/assets/icons/apple-touch-icon.png (180, full bleed, no alpha), icon-192.png and icon-512.png (rounded tile, alpha) (D-08)
  - src/favicon.ico with 16/32/48 px PNG entries
  - src/assets/brand/ibc-logo-512.png 512x512 transparent rose (D-12)
  - lib/image-size.js readImageSize(buffer) / readIcoEntries(buffer), Node built-ins only
  - test/seo-assets.test.js header-level checks of all six images plus sharp isolation
affects: [02-04 head OG/icon tags and favicon passthrough + gate G3, 02-05 JSON-LD logo check, phase-03 eleventy-img]

actuals:
  tokens: 8972
  tasks: 3
  commits: 2
plan_head_before: 72326b343f3f090e80e72b67ae64cd81aac76f26
plan_head_after: b91c72691dc88c70d5ac8ab97e5a8dcdbdf122de

tech-stack:
  added: ["sharp 0.35.4 (tools/seo-images only, not a site dependency)"]
  patterns:
    - "Binary SEO assets are generated once by a script in an isolated tool package and committed; build and tests read them with header parsers only"
    - "The OG text layer is one SVG used for both the composite and the safe-area pixel scan, so the check sees exactly what ships"
    - "Generator inputs must carry a PNG/JPEG signature before reaching sharp (no file can be decoded as SVG)"

key-files:
  created:
    - tools/seo-images/package.json
    - tools/seo-images/package-lock.json
    - tools/seo-images/make-seo-images.js
    - lib/image-size.js
    - test/seo-assets.test.js
    - src/assets/og/og-default-v1.jpg
    - src/assets/icons/apple-touch-icon.png
    - src/assets/icons/icon-192.png
    - src/assets/icons/icon-512.png
    - src/assets/brand/ibc-logo-512.png
    - src/favicon.ico
  modified: []

key-decisions:
  - "Stayed on the human-approved sharp 0.35.4 despite advisory GHSA-wq5f-xc86-pv6w (librsvg, fixed in 0.35.5): the generator only decodes SVG it builds from constants, runs locally on Windows, never in CI; inputs are signature-checked. Upgrading needs a new legitimacy check by the user"
  - "OG layout: rose 300 px at (90,165), text from x=440; headline 84 px bold in two lines (KLAN ARMA 3 / MILSIM), clan name 30 px cream, thin accent rule, HUD corner brackets; left-to-right #080e11 scrim 0.94 -> 0.72"
  - "Icon rose at 390/512 (76 %) on an rx 96 tile; apple-touch rose 137/180 on a full-bleed tile with alpha removed"

patterns-established:
  - "lib/image-size.js is the shared header reader for tests and scripts/check-seo.js (02-04 G3, 02-05 logo check)"
  - "OG card cache rule: a changed card after deploy gets a new -vN file name and a new site.ogImage"

requirements-completed: [SEO-03, SEO-04, SEO-05]

coverage:
  - id: D1
    description: "1200x630 OG card under 300 KB with only the D-06 wording, text inside the safe area"
    requirement: SEO-03
    verification:
      - kind: unit
        ref: "test/seo-assets.test.js#OG card is a 1200×630 JPEG under 300 KB (D-06)"
        status: pass
      - kind: other
        ref: "node tools/seo-images/make-seo-images.js (safe-area pixel scan and size guard passed, 70,132 bytes)"
        status: pass
    human_judgment: true
    rationale: "Visual quality and legibility at about 400 px wide (Discord preview) are a judgment call; the plan's Task 3 human-check asks the user to approve the card"
  - id: D2
    description: "Icon set and favicon.ico: apple-touch 180, icon-192/512 with alpha, ICO with 16/32/48 PNG entries"
    requirement: SEO-04
    verification:
      - kind: unit
        ref: "test/seo-assets.test.js#icons are square PNGs of the expected sizes (D-08)"
        status: pass
      - kind: unit
        ref: "test/seo-assets.test.js#favicon.ico holds 16, 32 and 48 px PNG images"
        status: pass
    human_judgment: true
    rationale: "Whether the rose reads on the dark tile in a browser tab is visual; the plan's human-check covers icon-192 and favicon.ico"
  - id: D3
    description: "512x512 transparent JSON-LD logo"
    requirement: SEO-05
    verification:
      - kind: unit
        ref: "test/seo-assets.test.js#JSON-LD logo is a transparent square of at least 112 px (D-12)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Header parsers readImageSize / readIcoEntries (null for non-images)"
    verification:
      - kind: unit
        ref: "test/seo-assets.test.js#parsers return null for non-images"
        status: pass
      - kind: other
        ref: "scratch cross-check of readImageSize against sharp metadata on all 14 PNG/JPEG files in src/assets (all match)"
        status: pass
    human_judgment: false
  - id: D5
    description: "sharp isolated in tools/seo-images at exactly 0.35.4; root package.json has no sharp"
    verification:
      - kind: unit
        ref: "test/seo-assets.test.js#the image tool is isolated from the site build (T-02-SC)"
        status: pass
      - kind: other
        ref: "npm --prefix tools/seo-images ls sharp -> sharp@0.35.4; git diff --quiet -- package.json package-lock.json; git check-ignore tools/seo-images/node_modules"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-10-07
status: complete
---

# Phase 2 Plan 02: SEO share card, icon set and JSON-LD logo Summary

**A 70 KB 1200×630 OG card (rose plus "KLAN ARMA 3 / MILSIM" and the clan name in the HUD palette), the rose-on-dark-tile icon set with a 16/32/48 PNG favicon.ico, and a 512 px transparent JSON-LD logo. All of them come from a one-off generator that uses sharp 0.35.4, which is isolated in tools/seo-images. The committed images are checked by header-only parsers, so no image library is needed at build or test time.**

## Performance

- **Duration:** 4 min (continuation; Task 1 was the package-legitimacy checkpoint in the previous run)
- **Started:** 2026-10-07T18:56:14Z
- **Completed:** 2026-10-07T19:00:30Z
- **Tasks:** 3 (Task 1 human-approved, Tasks 2-3 executed here)
- **Files modified:** 11 created, 0 modified

## Accomplishments

- Before installing sharp, I checked it against the registry again. Version 0.35.4 and integrity `sha512-n++8XWcj…MDA==` matched the values the user approved. The lockfile records the same integrity.
- sharp is installed only in `tools/seo-images/`, with its own `package-lock.json`. Its `node_modules` is gitignored. The root `package.json` and lockfile did not change, so CI `npm ci` never downloads sharp.
- The generator checks every text pixel of the OG card against the safe area: 60 px right margin, 40 px top and bottom, 20 px clear of the logo. It refuses a card of 300 KB or more and logs each output with its byte size. The card came out at 70,132 bytes.
- I viewed the card at full size and at 400 px wide. The headline, clan name and rose are inside the frame and the headline is readable at Discord preview size. I also viewed icon-192, apple-touch-icon and the brand logo.
- `npm test` passes 93 tests with 0 failures, including 6 new ones.

## Task Commits

1. **Task 1: Verify sharp@0.35.4 legitimacy** - no commit (checkpoint, user replied "approved")
2. **Task 2: Isolated tool package and generator** - `0e5f021` (feat)
3. **Task 3: Generated images, header parsers, asset tests** - `b91c726` (feat)

## Files Created/Modified

- `tools/seo-images/package.json` - `ibc-seo-images`, `"sharp": "0.35.4"` exact, `generate` script
- `tools/seo-images/package-lock.json` - pins sharp 0.35.4 and the `@img/sharp-*` binaries with integrity hashes
- `tools/seo-images/make-seo-images.js` - generator: 2 fixed inputs, 6 fixed outputs, `toIco(pngs)`, safe-area scan, size guard, input signature guard
- `lib/image-size.js` - `readImageSize` (PNG IHDR, JPEG SOF walk) and `readIcoEntries`
- `test/seo-assets.test.js` - the 6 header-level tests from the plan (plus truncated PNG/JPEG null cases)
- `src/assets/og/og-default-v1.jpg`, `src/assets/icons/{apple-touch-icon,icon-192,icon-512}.png`, `src/assets/brand/ibc-logo-512.png`, `src/favicon.ico` - generated, committed binaries

## Decisions Made

- **Stayed on sharp 0.35.4 after a new advisory.** During install, `npm audit` reported GHSA-wq5f-xc86-pv6w (high). It is a librsvg memory bug that can allow remote code execution on glibc Linux when sharp decodes a crafted SVG. It affects sharp below 0.35.5 and was published 2026-10-06. The user had not approved 0.35.5, and the research marked that version as too new. Installing it would be an unvetted package install, so I kept 0.35.4. In this tool the exposure is minimal. The only SVGs it decodes are built from constants inside the script. It runs by hand on Windows and never in CI or the site build. I also added a check so that only files starting with a PNG or JPEG signature reach sharp. A swapped-in SVG file can never get to the SVG loader. To upgrade, run the same legitimacy check on 0.35.5 and regenerate.
- **OG layout values** (exact numbers are in key-decisions): the headline is 84 px, more than the plan's 60 px minimum. It is about 28 px tall at 400 px wide.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] JPEG SOF offsets counted from the wrong byte**
- **Found during:** Task 3 (first test run)
- **Issue:** `readImageSize` measured the SOF height and width offsets from the marker code byte instead of the 0xFF byte. It returned 45059×30212 for the 1200×630 card.
- **Fix:** It now measures from the 0xFF byte (`offset - 2`), as the plan specifies (marker offset + 5 / + 7).
- **Files modified:** lib/image-size.js
- **Verification:** The seo-assets tests pass. readImageSize gives the same width, height and alpha as sharp metadata on all 14 PNG/JPEG files in src/assets.
- **Committed in:** b91c726

**2. [Rule 2 - Missing critical] Input signature guard in the generator**
- **Found during:** Task 2 (npm audit reported GHSA-wq5f-xc86-pv6w on sharp 0.35.4)
- **Issue:** sharp picks the decoder from the file content. If logo.png or hero-bg.jpg were replaced by an SVG, it would go through the vulnerable librsvg loader.
- **Fix:** `readRaster()` reads each input and refuses anything without a PNG or JPEG signature before it reaches sharp.
- **Files modified:** tools/seo-images/make-seo-images.js
- **Committed in:** 0e5f021

**Note (not a code deviation):** the GSD pre-commit guard flags `main` as a protected branch. Commits went to `main` anyway, because the project config sets `branching_strategy: none`, the orchestrator dispatched this sequential run on main, and 02-01 committed the same way.

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** No scope change. All acceptance criteria pass as written.

## Issues Encountered

- `npm audit` reported the high-severity sharp advisory above. It is handled as described under Decisions Made and is flagged for the user.

## Pending Human Check (end-of-phase)

The human-check in Task 3 is deferred to end-of-phase UAT (`human_verify_mode: end-of-phase`). The user should:
1. Open `src/assets/og/og-default-v1.jpg` at full size and at about 400 px wide.
2. Look at `icon-192.png` and `favicon.ico` on the dark tile.
3. Note D-09: theme-color #080e11 gives a near-black Discord stripe.

I checked the card at both sizes and the icons myself with the Read tool, and they looked correct.

Note for 02-05: the brand logo is a pale rose on transparency. On a white background, such as a Google knowledge panel, contrast is low. That is how D-12 specifies it, so this is for awareness only.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: vulnerable-dependency | tools/seo-images/package-lock.json | sharp 0.35.4 is inside GHSA-wq5f-xc86-pv6w (fixed in 0.35.5). It is used only by a local one-off generator that feeds it self-built SVGs and signature-checked raster files. It is not in the site build or CI. Upgrade after the user vets 0.35.5. |

## User Setup Required

None.

## Next Phase Readiness

- 02-04 can link `/assets/og/og-default-v1.jpg` (matches `site.ogImage`), the icon set and `/favicon.ico`, which still needs a passthrough. It can use `readImageSize` for gate G3.
- 02-05 can reference `/assets/brand/ibc-logo-512.png` as the Organization logo and check it with `readImageSize`.

---
*Phase: 02-technical-seo*
*Completed: 2026-10-07*

## Self-Check: PASSED

- Files: all 11 created files are present (test -f checks ran before this was written)
- Commits: 0e5f021 and b91c726 are in git log
- `node --test test/seo-assets.test.js` 6/6 pass and `npm test` 93/93 pass. The root package.json and package-lock.json have no diff.
