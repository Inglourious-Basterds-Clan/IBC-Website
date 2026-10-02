# Phase 1 Deferred Items

Out-of-scope issues found during execution. They were not fixed in Phase 1, because the fix would change how the home page looks (D-05 visual parity).

## From plan 01-02

- **Mobile content overflows horizontally (pre-existing, also in the D-07 baseline).** At widths up to about 650 px, `.about-stats` (`grid-template-columns: 1fr 1fr`) grows to the min-content width of the 1.8rem stat headings ("Paczka modyfikacji", "Dedykowany"). That makes the about section about 478 px wide at a 390 px viewport. At 320 px the hero `h1` ("INGLOURIOUS" at 2.5rem) also overflows. The right edge of the about text and stat cards is cut off on phones (see `baseline/mobile-about.png`). Plan 01-02 only stopped this overflow from widening the layout viewport (`body { overflow-x: clip; }`), so the fixed header stays as wide as the screen. The clipped content itself is unchanged. Suggested owner: Phase 3 (performance/mobile) or Phase 5 (a11y), with a responsive `.about-stats` and hero `h1` sizing.
