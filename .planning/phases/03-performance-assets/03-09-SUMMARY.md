---
phase: 03-performance-assets
plan: 09
subsystem: ui
tags: [es-modules, dynamic-import, data-js, lightbox, terminal, easter-egg, state-classes, textcontent, parity]

requires:
  - phase: 03-04
    provides: "Lightbox data-lightbox-* attributes, ensureSources() and the srcset-then-src order the lightbox module keeps"
  - phase: 03-08
    provides: "No-inline-style test, Lightning CSS bundle of src/css/style.css, the easteregg-trigger class"
provides:
  - "src/js/main.js: module entry with a frozen five-entry literal loader map and export initFeatures(root, featureLoaders)"
  - "src/js/modules/{menu,lightbox,terminal,scroll-spy,easter-egg}.js, each export init(el) with no-op guards; terminal.js also exports writeToConsole(consoleEl, message, status)"
  - "data-js hooks: menu (.menu-toggle), scroll-spy (header <nav>), lightbox (.gallery-grid), terminal (#terminal-console), easter-egg (#easteregg-trigger)"
  - "<script type=\"module\" src=\"/js/main.js\"> in base.njk"
  - "CSS state rules: .lightbox.is-open, .decryption-overlay.is-open, .terminal-line .tag-error, .terminal-line-alert .tag/.message"
  - "test/modules.test.js (16 tests) and the ESM rewrite of test/client.test.js (11 tests)"
affects: [03-10 partial split (new rules sit in GALLERY, RECRUITMENT and EASTER EGG sections), 03-11 JS budget and parity checklist, Phase 4 features plugging in through data-js]

actuals:
  tokens: 12300
  tasks: 3
  commits: 5
plan_head_before: c60b28199581f9d71c54904c4a3c1ab7892aace4
plan_head_after: 01823a3b3b5c9be184ba0cc06dd6a4f95bbbfa73

tech-stack:
  added: []
  patterns:
    - "Feature hook: data-js=\"<name>\" on one element; main.js maps the name through a frozen literal map (own-property check) to import('./modules/<name>.js') and calls init(el)"
    - "Module DOM access only inside init(el), so tests install fresh globalThis.document/window/IntersectionObserver stubs per test"
    - "Runtime state as classes (is-open, tag-error, terminal-line-alert); the only runtime style write left is the body.style.overflow scroll lock"

key-files:
  created: [src/js/modules/menu.js, src/js/modules/lightbox.js, src/js/modules/terminal.js, src/js/modules/scroll-spy.js, src/js/modules/easter-egg.js, test/modules.test.js]
  modified: [src/js/main.js, src/_includes/layouts/base.njk, src/_includes/partials/header.njk, src/_includes/partials/footer.njk, src/index.njk, src/css/style.css, test/client.test.js, test/images.test.js, test/layout.test.js]

key-decisions:
  - "initFeatures returns Promise.all of the per-hook load-then-init chains; loaders are called synchronously in querySelectorAll order, and unknown or inherited names (constructor, __proto__) load nothing via Object.prototype.hasOwnProperty.call"
  - "terminal.js exports writeToConsole at module scope (the boot sequence never writes an error line, so the tag-error class is tested by calling it directly); the loader only ever calls init"
  - "terminal init returns before creating its IntersectionObserver when #recruitment is missing (the classic script created an unused one), so a missing element means no observer"
  - "The easter-egg alert line is a div.terminal-line.terminal-line-alert with three createElement spans set by textContent; .terminal-line-alert .tag/.message use --danger-color (#ef4444, the old inline value)"

patterns-established:
  - "New client features: add a module under src/js/modules/<name>.js exporting init(el), a literal entry in the main.js loader map and a data-js hook; modules.test.js checks each hook has its module in the output"

requirements-completed: [PERF-07]

coverage:
  - id: D1
    description: "Every page loads one <script type=\"module\"> main.js (prefixed under /IBC-Website/); main.js imports only modules whose data-js hook is present, from literal specifiers"
    requirement: PERF-07
    verification:
      - kind: integration
        ref: "test/modules.test.js#every page has exactly one script with a src: the module main.js"
        status: pass
      - kind: unit
        ref: "test/modules.test.js#main.js maps all five hooks to literal module imports"
        status: pass
      - kind: other
        ref: "Task 1 verify: prefixed build, grep '<script type=\"module\" src=\"/IBC-Website/js/main.js\">' _site/index.html, _site/js/modules/terminal.js present"
        status: pass
    human_judgment: false
  - id: D2
    description: "initFeatures edge cases: no hooks calls no loader, unknown names load nothing, duplicate hooks each get init(el), loaders run in document order"
    requirement: PERF-07
    verification:
      - kind: unit
        ref: "test/modules.test.js#initFeatures without hooks calls no loader and resolves"
        status: pass
      - kind: unit
        ref: "test/modules.test.js#initFeatures loads only known hooks and passes the hook element to init"
        status: pass
      - kind: unit
        ref: "test/modules.test.js#two elements with the same hook each get their own init call"
        status: pass
      - kind: unit
        ref: "test/modules.test.js#loaders are called in the document order of the hooks"
        status: pass
    human_judgment: false
  - id: D3
    description: "menu, lightbox and easter-egg init(el) return without throwing or attaching listeners when their elements are missing"
    requirement: PERF-07
    verification:
      - kind: unit
        ref: "test/modules.test.js (three no-op guard tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "404 and dev pages carry no lightbox or terminal hook; index.html has exactly one hook per feature; every hook has js/modules/<hook>.js in the output"
    requirement: PERF-07
    verification:
      - kind: integration
        ref: "test/modules.test.js#404 and dev pages carry no lightbox or terminal hook"
        status: pass
      - kind: integration
        ref: "test/modules.test.js#index.html has exactly one hook for each feature"
        status: pass
      - kind: integration
        ref: "test/modules.test.js#every data-js hook in the output has its module file"
        status: pass
    human_judgment: false
  - id: D5
    description: "Terminal prints the same boot lines with the invite from data-discord-url; scroll-spy behaviour unchanged (ported to ESM)"
    requirement: PERF-07
    verification:
      - kind: unit
        ref: "test/client.test.js (three terminal and four scroll-spy behaviour tests, invite/textContent static check)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Lightbox and decryption overlay toggle is-open; the easter-egg line and error tags are classes plus textContent; no src/js file assigns HTML strings or sets style.display/style.color"
    requirement: PERF-07
    verification:
      - kind: unit
        ref: "test/modules.test.js (is-open lightbox, is-open easter egg, terminal-line-alert tests)"
        status: pass
      - kind: unit
        ref: "test/client.test.js#an error line's tag carries tag-error; other statuses only the tag class (D-12)"
        status: pass
      - kind: unit
        ref: "test/client.test.js#no file under src/js assigns an HTML string or sets style.display / style.color"
        status: pass
    human_judgment: false
  - id: D7
    description: "In a real browser all five features look and behave as before (lightbox click/Enter/Space/arrows/Esc/outside click, mobile menu, terminal boot, scroll-spy, red [WARN] line) and /404.html shows no console errors and fetches no lightbox.js or terminal.js"
    requirement: PERF-07
    verification:
      - kind: automated_ui
        ref: "scratchpad smoke.mjs / smoke-prefix.mjs (headless Chrome CDP) on root and /IBC-Website/ builds: 0 console errors on 404 and home; 404 fetches main, menu, scroll-spy, easter-egg only; lightbox display none/flex/none on every path; alert line rgb(239, 68, 68)"
        status: pass
    human_judgment: true
    rationale: "The plan's human-check (served build, Chrome desktop and 390 px, DevTools Console/Network on /404.html) is collected at the end of the phase (03-11); the CDP smoke run is not a committed test and does not compare against the Phase 1 baseline shots"

duration: 11min
completed: 2026-10-11
status: complete
---

# Phase 3 Plan 09: ES Module Feature Loading Summary

**`main.js` is now a module entry. It reads the page's `data-js` hooks and imports only the matching modules (menu, lightbox, terminal, scroll-spy, easter-egg) through a frozen map of literal specifiers. Each module's `init(el)` does nothing when its elements are missing. Lightbox and overlay visibility, the error tag and the easter-egg alert line are now CSS classes plus `textContent`, so no inline display or colour styles and no HTML strings remain in the client code.**

## Performance

- **Duration:** about 11 min
- **Started:** 2026-10-11T09:27:29Z
- **Completed:** 2026-10-11T09:38:21Z
- **Tasks:** 3 (5 commits: 1 tracer + 2 TDD RED/GREEN pairs)
- **Files modified:** 15 (6 created, 9 modified)

## Accomplishments

- `base.njk` loads `<script type="module" src="/js/main.js">`. HtmlBasePlugin prefixes it, and the relative `import('./modules/…')` calls resolve against main.js, so they work at the root and under `/IBC-Website/`.
- `main.js` has only the header comment, the frozen five-entry loader map, `export function initFeatures(root, featureLoaders)` and the `initFeatures(document, loaders)` call.
- Five modules under `src/js/modules/` carry the old code with unchanged behaviour. Each reads the DOM only inside `init(el)` and returns early when an element is missing.
- Hooks are placed per the UI-SPEC: `menu` on `.menu-toggle`, `scroll-spy` on the header `<nav>`, `lightbox` on `.gallery-grid`, `terminal` on `#terminal-console` (which keeps `data-discord-url`), and `easter-egg` on `#easteregg-trigger`.
- New CSS rules, each in its named section: `.lightbox.is-open` (GALLERY), `.terminal-line .tag-error` and `.terminal-line-alert .tag/.message` (end of RECRUITMENT), `.decryption-overlay.is-open` (EASTER EGG).
- Tests: `npm test` passes 277/277 (259 before). `SITE_URL=https://guard.example npm run build` and the `/IBC-Website/` production build both pass check-seo. On the prefixed build, `check-perf` passes with initial JS at 4,857 B gz against a 5,120 B cap.
- Headless Chrome (CDP) smoke run on the root and the `/IBC-Website/` builds:
  - No console errors on `/404.html` or `/`.
  - 404 fetches only `main.js`, `menu.js`, `scroll-spy.js` and `easter-egg.js`. The home page fetches all five modules.
  - Lightbox: display goes from none to flex and back on click, Enter, Space, Esc, the close button and an outside click. The arrows act only while it is open. The AVIF and WebP sources are inserted on the first open.
  - Terminal: five boot lines in the accent colour, with the time in muted grey.
  - Easter egg: the alert line is `terminal-line terminal-line-alert` with red (239, 68, 68) tag and message.
  - Menu at 390 px: `aria-expanded` and the body scroll lock toggle, and following a link closes the menu.

## Task Commits

1. **Task 1 (tracer): module entry loads terminal and scroll-spy through data-js hooks.** `60d223a` (feat). Tracer feedback gate: `human_verify_mode` is end-of-phase and the verify is automated only, so the verify was re-run after the commit. It passed again: 35/35 targeted tests, the prefixed build and the greps. Work then moved to Task 2.
2. **Task 2 RED:** `64bbee1` (test). 13 tests, 6 failing.
3. **Task 2 GREEN:** `3352f46` (feat). Menu, lightbox and easter-egg modules, entry-only main.js, three hooks.
4. **Task 3 RED:** `b6a0c27` (test). 27 tests across both files, 5 failing.
5. **Task 3 GREEN:** `01823a3` (feat). State classes, textContent alert line, tag-error, CSS rules.

**Plan metadata:** in the docs(03-09) commit that adds this SUMMARY.

## TDD Gate Compliance

- **Task 2 RED (`64bbee1`):** command `node --test --test-reporter=tap test/modules.test.js`, exit 1. The classifier returned `RED_EVIDENCE_OK` (`target_test_failed`) for the target "index.html has exactly one hook for each feature".
  - Semantic assessment: the target ran and failed on the planned assertion, `index.html: expected one data-js="menu", got ["scroll-spy","terminal"]` (0 !== 1). It was not a load or syntax fault.
  - The other failures were also planned. The literal-import test reported `main.js has no literal import for menu`, and the module tests reported `src/js/modules/<name>.js does not exist` as assertions.
  - Four initFeatures tests and three build-output tests passed in RED. Task 1 (the tracer) had already delivered `initFeatures`, and those build tests are regression guards.
- **Task 3 RED (`b6a0c27`):** command `node --test --test-reporter=tap test/modules.test.js test/client.test.js`, exit 1. The classifier returned `RED_EVIDENCE_OK` for the target "lightbox open adds is-open; Escape and the close button remove it; arrows act only while open".
  - Semantic assessment: the target failed on its first planned assertion, `Enter on an item did not add is-open`.
  - The other four failures were all planned: `click did not add is-open`, the alert-line className/children deep-equal, `terminal.js does not export writeToConsole`, and `easter-egg.js assigns an HTML string`.
- **GREEN:** `3352f46` and `01823a3`. No REFACTOR commits were needed.
- The RED records were written inside the project for the classifier, then copied to the session scratchpad and removed from the tree.

## Files Created/Modified

- `src/js/main.js`: module entry, loader map, `initFeatures`.
- `src/js/modules/menu.js`, `lightbox.js`, `terminal.js`, `scroll-spy.js`, `easter-egg.js` (new): one feature each, `export function init(el)`.
- `src/_includes/layouts/base.njk`: `type="module"` script.
- `src/_includes/partials/header.njk`, `footer.njk`, `src/index.njk`: the five `data-js` hooks.
- `src/css/style.css`: the four state and colour rules (21 lines, CRLF kept).
- `test/client.test.js`: ESM rewrite without `node:vm`, plus the tag-error, static-sink and node --check checks.
- `test/modules.test.js` (new): loader, no-op guard, lightbox and easter-egg behaviour, and build-output hook checks.
- `test/images.test.js`, `test/layout.test.js`: locate the gallery grid by its opening-tag prefix (see Deviations).

## Decisions Made

See key-decisions in the frontmatter: `initFeatures` resolves through `Promise.all` with an own-property check, `writeToConsole` is exported for testing, the terminal creates no observer without `#recruitment`, and the alert line uses `--danger-color` classes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two tests matched the gallery grid's exact opening tag**
- **Found during:** Task 2 (GREEN run of `npm test`)
- **Issue:** `test/images.test.js` (`galleryPictures`) and `test/layout.test.js` ("prefix build puts every internal URL under the prefix") searched for the literal `<div class="gallery-grid">`. Once the planned `data-js="lightbox"` hook was added, they no longer found the grid and failed with "gallery grid missing" and "expected 4 gallery img src values".
- **Fix:** both now search for the opening-tag prefix `<div class="gallery-grid"`. They still check the same markup, now with any attributes after the class.
- **Files modified:** test/images.test.js, test/layout.test.js
- **Verification:** `npm test` 272/272 after the fix
- **Committed in:** 3352f46

**Total deviations:** 1 auto-fixed (Rule 3). **Impact:** test locators only; product behaviour is as planned.

## Issues Encountered

- As an extra check, I ran `node scripts/check-perf.js` on the prefixed `_site` without `PATH_PREFIX` in the env. The gate takes its prefix from `site.js`, so it reported every `/IBC-Website/` URL as missing and moved `_site` to `_site.rejected`, which is its designed behaviour. I deleted the gitignored `_site.rejected`, rebuilt with the prefix env, and the gate then passed (`check-perf: OK, 2 page(s) checked`). The code was not at fault.
- Git warns that LF will become CRLF on the touched files. This is the repo's autocrlf behaviour, and the index stays LF.

## Known Stubs

None.

## Threat Flags

None. T-03-18 is mitigated: hook text is only a key into a frozen literal map with an own-property check, `constructor` and `__proto__` are tested to load nothing, and modules.test.js asserts that every `import(` is followed by a quote. T-03-19 is mitigated: the last `innerHTML` is gone, and client.test.js fails if any src/js file assigns HTML strings. No new network, auth or file-access surface was added.

## User Setup Required

None.

## Next Phase Readiness

- 03-10 can cut `src/css/style.css` into partials. The new rules sit in the GALLERY (Lightbox Modal block), RECRUITMENT and EASTER EGG sections, and every new class (`is-open`, `tag-error`, `terminal-line-alert`) is written by a module under `src/js/modules/`.
- 03-11: initial JS is 4,857 B gz against the 5,120 B cap on the home page, which loads all five modules. Re-check the cap when setting budgets from measured sizes. Still open: the human check of the five features and of a clean 404 console (D7).

## Self-Check: PASSED

- FOUND: the five modules, test/modules.test.js, src/js/main.js
- FOUND commits: 60d223a, 64bbee1, 3352f46, b6a0c27, 01823a3 (ancestors of HEAD; `git rev-list --count c60b281..HEAD` = 5)
- Acceptance Task 1: `export function initFeatures` 1, `import('./modules/terminal.js')` 1, `export function init` in terminal.js and scroll-spy.js 1 each, `type="module" src="/js/main.js"` 1, client.test.js 9+ passing (11), `npm test` exit 0
- Acceptance Task 2: `import('./modules/` 5, legacy functions in main.js 0, 5 module files, menu, easter-egg and lightbox hooks 1 each, modules.test.js exit 0, `npm test` exit 0
- Acceptance Task 3: `is-open` lightbox.js 3, easter-egg.js 2, `.lightbox.is-open` 1, `.decryption-overlay.is-open` 1, `tag-error` in terminal.js 1, modules and client tests exit 0, `npm test` 277/277, guard build exit 0

---
*Phase: 03-performance-assets*
*Completed: 2026-10-11*
