# Phase 03 — UI Review

**Audited:** 2026-10-11
**Baseline:** 03-UI-SPEC.md (PARITY LOCK, approved 2026-10-10) + D-15 parity evidence (`parity/`)
**Screenshots:** not captured (no dev server on localhost:3000, 5173 or 8080). Visual pillars are scored from the committed 03-11 parity pairs (`parity/before|after/*.png`, 15 pairs, all below 2.4 % pixel diff) plus a code/build audit of `_site/` (the /IBC-Website/ production build).
**Interaction captures:** off (workflow.ui_interaction_capture is false). Interaction findings below come from the code and from the 03-11 CDP probes recorded in parity.md. This audit did not capture any interaction itself.

Scoring scope: each pillar is scored on whether Phase 3 kept the locked design and met the new delivery contracts. Design debt that was frozen on purpose is listed as **Phase 5 notes** and does not lower Phase 3 scores.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | Every locked string is preserved. The recruitment CTA's accessible name lost a stray leading space, which is an improvement. |
| 2. Visuals | 3/4 | Layout parity holds after the two 03-11 fixes. The header logo is still softer (50w variant, no human sign-off yet). |
| 3. Color | 4/4 | No new color. Inline `#ef4444` became `.tag-error` / `.terminal-line-alert`, and red rgb(239,68,68) is confirmed on both sides. |
| 4. Typography | 3/4 | Font contract met. The "no visible reflow" claim for the fallback face is untested, because every shot waits for `document.fonts.ready`. |
| 5. Spacing | 3/4 | Two new spacing values (`margin-right: 2px` and `1.5px` on icons), against the "Phase 3 adds no spacing" rule. They were added to restore parity, but the contract is still broken. |
| 6. Experience Design | 3/4 | The state-class, module and lightbox contracts are all met. The header logo is `loading="lazy"` above the fold, and the D-18 PSI gate is still unrecorded. |

**Overall: 20/24**

---

## Top 3 Priority Fixes

1. **The D-18 PSI result is not recorded** (WARNING). The "Post-Phase 3" row in `parity/parity.md` is empty. Phase 3 is defined as done only at mobile PSI of 90 or more, so the phase has no proof that it met its goal. Fix: deploy to the GitHub Pages preview, run PSI mobile 3 times, and record the median with LCP/FCP/SI/CLS/TBT. Treat a result below 90 as a gap.
2. **Header logo is softer and lazy-loaded above the fold** (WARNING). `_site/index.html` serves `TJLye1VBUX-50.png` with `loading="lazy"` and `sizes="50px"`. On every page it is visible in the first viewport. Lazy loading can delay its paint, and the 50w lanczos variant looks softer than Chrome's own downscale (parity.md "Logo"). Fix: get the 03-04 human judgement now. If the user rejects the softness, serve the 100w variant at 1x (`sizes="100px"`, which is cheap at this size). Also consider `loading="eager"` for the logo, which is a delivery change only and has no visual change.
3. **Off-scale icon margins added in Phase 3** (WARNING). `src/css/partials/components.css:113` adds `.hud-btn .icon { margin-right: 2px }` and `src/css/partials/header.css:171` adds `.header-cta .icon { margin-right: 1.5px }`. Both are new spacing values, which UI-SPEC "Spacing Scale" forbids. They are the right parity fix (they replace the letter-spacing the FA glyph used to carry). Fix: record them in UI-SPEC as locked parity exceptions next to the other off-scale values, so Phase 5 normalises them on purpose instead of finding them by accident.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)
- Copy is unchanged across all 15 pairs. In the parity table, every difference is put down to glyph advances, logo raster or photo encoding, and no copy difference is reported. 404 copy is in `desktop-404.png`, and the terminal sequence matches word for word, including the WARN alert line.
- The accessible name of the recruitment button changed from " WEJDŹ NA DISCORD" to "WEJDŹ NA DISCORD", because the webfont glyph no longer adds a leading space. This is a small improvement and is allowed.
- Footer icon links are announced once each as "Discord", "YouTube" and "Facebook" (AX tree, parity.md).
- Phase 5 note: the lightbox `<img alt="Lightbox image">` is still English and static (`_site/index.html`). It is frozen on purpose under the spec's "known quirk" clause.

### Pillar 2: Visuals (3/4)
- The 03-11 capture found two real layout regressions: the logo moved 24 px right (caused by `picture > source` becoming flex items) and the icon buttons were 1.5 to 2 px narrower. Both were fixed (`39e5c21`, `6bcb04d`) and pinned in `test/css.test.js`. Both slipped past the 03-10 computed-style probe, so that probe is not reliable as a parity gate by itself.
- I compared `w320-top.png` before and after myself. Header, CTA, hamburger, hero type and buttons are identical.
- Remaining issue: the logo is softer at 3x zoom (parity.md "Logo"). This is still an open human check, so the pillar cannot get 4.
- Phase 5 note (pre-existing, frozen): at 320 px the hero h1 "INGLOURIOUS", the lead paragraph and both buttons run past the right edge and are clipped by `overflow-x: clip` (visible in both `before/w320-top.png` and `after/w320-top.png`). This is a real narrow-phone defect for Phase 5.

### Pillar 3: Color (4/4)
- No new tokens or hex values. `.terminal-line .tag-error` (`recruitment.css:134`) and `.terminal-line-alert .tag/.message` (`:138-139`) replace the inline `#ef4444`. Red is confirmed at rgb(239,68,68) after the easter egg.
- Icons use `fill="currentColor"` (all 5 SVGs in `_site/index.html`), so they follow the link and `.active` colors as specified.
- Phase 5 note: the accent covers 15 element groups (UI-SPEC "reserved for" list), which is well past a 10 % accent share. It is frozen.

### Pillar 4: Typography (3/4)
- The `@font-face` declarations match the contract exactly (`src/css/partials/fonts.css:4-21`): woff2, 100–900, swap, the full unicode-range, and the Arial fallback with 110.38/87.70/22.74/0 overrides.
- There is one font preload and it comes before the single stylesheet (`_site/index.html:17-18`). No Google Fonts, cdnjs or `fa-` strings remain in the output.
- The pangram renders at every weight, including the 800/900 wordmark (`desktop-font-test.png`).
- Gap: the spec's rule "the swap must not visibly reflow headings or buttons" has no evidence. The capture waits for `document.fonts.ready`, so no shot shows the fallback face. Fix: capture one shot with the font request blocked, or throttled to the fallback, and diff it against the after shot. If headings or buttons reflow, drop the fallback face as research A4 says.
- Phase 5 note: about 15 extra sizes and weights 800/900 are frozen. Weight 500 was removed only with dead CSS.

### Pillar 5: Spacing (3/4)
- `picture { display: contents }` plus `picture > source { display: none }` (`base.css:58-64`) keeps the wrapped boxes as they were.
- The inline-style conversions from 03-08 kept their values verbatim, and the built HTML has 0 `style=` attributes.
- WARNING: there are two new off-scale values, `2px` (`components.css:113`) and `1.5px` (`header.css:171`). The spec says "Phase 3 must not add a new spacing value". The values are needed for parity but are not listed as exceptions in the spec.
- Phase 5 note: off-scale values (5/6/10/14/15/25/30/35/50/60/100/120 px) are frozen.

### Pillar 6: Experience Design (3/4)
- All delivery contracts are met in `_site/index.html`:
  - hero `img` is eager with `fetchpriority="high"` and `sizes="100vw"`, and the typed AVIF preload has a matching `imagesizes`
  - gallery images are lazy with the declared `sizes` and 400–1200 widths
  - the lightbox `img` has no `src` and the picture has no `source` until first open
  - all 5 `data-js` hooks are present, with a single `<script type="module">`
  - all SVGs are `aria-hidden="true" focusable="false"`
- Behaviour probes passed: lightbox click, Enter, arrow keys, Esc and outside click; menu `aria-expanded` and follow-link close; scroll-spy; easter egg. `/404.html` fetches no lightbox or terminal module and logs no console errors.
- WARNING: the header logo is `loading="lazy"` but sits in the first viewport on every page.
- WARNING: the D-18 PSI verification is still missing, so the phase's user-facing performance outcome is unproven.
- Phase 5 note: there are no focus-visible styles, the scroll lock still uses `body.style.overflow` with no focus trap in the lightbox or console, and there is no reduced-motion handling. All three are frozen under D-15.

Registry audit: shadcn not initialised, so the registry audit was skipped.

---

## Files Audited
- `_site/index.html` (production build)
- `src/css/partials/base.css`, `components.css`, `header.css`, `fonts.css`, `gallery.css`, `footer.css`, `recruitment.css`, `responsive.css`
- `.planning/phases/03-performance-assets/03-UI-SPEC.md`, `03-CONTEXT.md`, `03-01..03-11-SUMMARY.md`
- `.planning/phases/03-performance-assets/parity/parity.md`, `parity/before/w320-top.png`, `parity/after/w320-top.png`
