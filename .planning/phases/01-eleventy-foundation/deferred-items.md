# Phase 1 Deferred Items

Out-of-scope issues found during execution. They were not fixed in Phase 1, because the fix would change how the home page looks (D-05 visual parity).

## From plan 01-02

- **Mobile content overflows horizontally (pre-existing, also in the D-07 baseline).** At widths up to about 650 px, `.about-stats` (`grid-template-columns: 1fr 1fr`) grows to the min-content width of the 1.8rem stat headings ("Paczka modyfikacji", "Dedykowany"). That makes the about section about 478 px wide at a 390 px viewport. At 320 px the hero `h1` ("INGLOURIOUS" at 2.5rem) also overflows. The right edge of the about text and stat cards is cut off on phones (see `baseline/mobile-about.png`). Plan 01-02 only stopped this overflow from widening the layout viewport (`body { overflow-x: clip; }`), so the fixed header stays as wide as the screen. The clipped content itself is unchanged. Suggested owner: Phase 3 (performance/mobile) or Phase 5 (a11y), with a responsive `.about-stats` and hero `h1` sizing.

## From plan 01-06

- **No favicon: every page load logs a 404 for `/favicon.ico` (pre-existing, also in the D-07 baseline).** It is the only console error in both the baseline and the after-migration Lighthouse runs, and it is one of the two failed Best Practices audits (the other is `is-on-https`, local HTTP only). Under `/IBC-Website/` the browser requests the host root `/favicon.ico`, so the fix is a `<link rel="icon" href="/assets/...">` in `partials/head.njk` (HtmlBasePlugin prefixes it) plus an icon file. Suggested owner: Phase 2 (SEO/head metadata).
