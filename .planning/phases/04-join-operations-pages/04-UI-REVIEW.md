# Phase 04 — UI Review

**Audited:** 2026-10-13
**Baseline:** 04-UI-SPEC.md (approved, retroactive contract)
**Screenshots:** not captured. No dev server was running on 3000/5173/8080. `_site/` was served on :8765, but `npx playwright screenshot` (1.64.0) failed for every capture, most likely because no browser binary is installed. This is a code-only audit.
**Interaction captures:** off (workflow.ui_interaction_capture is false)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Home teaser lead deviates from the contract's exact string |
| 2. Visuals | 3/4 | The breadcrumb is not aligned with the h1 (23 px offset), and "Pełna instrukcja →" floats mid-card |
| 3. Color | 3/4 | Accent is used only on declared elements, but the join step list double-accents (counter and title) on 6 rows, which pushes accent density past 10% |
| 4. Typography | 3/4 | The four declared sizes and two weights are honoured. The inherited 15.2 px status line is a fifth size on subpages |
| 5. Spacing | 4/4 | Every value in pages.css matches the declared scale or a justified exception |
| 6. Experience Design | 3/4 | States match the contract. The two backstop layout checks (alignment, 320 px overflow) are unverified or failing |

**Overall: 19/24**

---

## Top 3 Priority Fixes

1. **WARNING: the breadcrumb left edge does not equal the h1 left edge** (contract backstop "Breadcrumb alignment (E1)"). `.section-header` adds `border-left: 3px` + `padding-left: 20px` (sections.css:12-16), so the h1 text starts 23 px right of the trail at ≥ 1240 px. The trail looks detached from the page column. Fix: add `padding-left: 23px` to `.breadcrumbs ol` (container-aligned trail, text-aligned items), or amend the UI-SPEC to say "container-aligned" and close the backstop explicitly.
2. **WARNING: "Pełna instrukcja →" floats in the middle of the teaser card.** `.recruitment-instructions` is `flex-direction: column; justify-content: space-between` (recruitment.css:91-96), and the link is now a fourth flex child (index.njk:133). Space-between hands it a free-floating slot between the lead and the CTA group, detached from both. Fix: wrap the link and `.recruitment-cta-group` in one container, or give the link `margin-top: auto` and drop its separate slot, so it reads as part of the CTA cluster.
3. **WARNING: the teaser lead copy does not match the contract.** index.njk:130 reads "Rekrutacja w klanie IBC odbywa się na naszym serwerze Discord: …", but the contract (Copywriting row "Home teaser lead (04-07, confirmed facts)") specifies "Rekrutacja odbywa się na naszym Discordzie: …". Fix: use the contract string, or update the contract if the longer phrasing was a deliberate SEO choice (it adds "klanie IBC").

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)
- PASS: CTA "Wejdź na Discord" appears in join `.page-cta` (jak-dolaczyc.njk:49), in operations `.upcoming` (operacje.njk:111) and on home (index.njk:136).
- PASS: hero "Złóż podanie" goes to `/jak-dolaczyc/` (index.njk:18). The h1 and status lines match on both pages, and so do the operations lead and the block headings.
- PASS: the teaser requirements match the 4 exact strings (index.njk:106-109). The breadcrumb `aria-label="Ścieżka nawigacji"` is correct.
- WARNING: the teaser lead deviates (index.njk:130). See Fix 3.
- WARNING (minor): the home teaser heading "Wymagania wstępne" (index.njk:104) and the join page heading "Wymagania" disagree for the same list. This is not covered by the contract but is inconsistent.
- The empty state "Najbliższe misje" is data-driven (`operations.upcoming.*`), so exact-string conformance relies on `src/_data` and its tests, not the template.

### Pillar 2: Visuals (3/4)
- PASS: each subpage has one h1 with the accent left rule. The join page uses the 01–06 counter spine, and the operations page uses the recap grid and accent timeline. These match the declared focal points.
- PASS: recap cards are non-interactive (no pointer, zoom or link). The only hover is the `.hud-border:hover` border/glow (components.css:11-14).
- WARNING: breadcrumb/h1 misalignment (Fix 1).
- WARNING: teaser link placement (Fix 2).
- WARNING: on the join page, the `.page-cta` has a single button that ends the page with no supporting text, and the FAQ (12–16 hud-border cards) dominates the lower half. The CTA is visually weaker than the 16 bordered FAQ cards above it. Consider a one-line lead-in above the button (contract allows `.page-cta` gap 16 px).

### Color (3/4)
- PASS: no hardcoded colours in pages.css. All values are `var(--…)` tokens. No new custom property.
- PASS: accent is absent from body `p`, recap titles (`.recap-body h3` uses `--text-primary`, pages.css:272), `.recap-meta`, era tags (`--text-secondary`) and the non-current breadcrumb.
- WARNING: accent density. On `/jak-dolaczyc/` the accent (or the identical `--text-secondary` hex) paints: the section-header rule, 3 h2s, 6 counters, 6 step h3s, the `.req-list` text and markers, every open FAQ summary, the CTA, the nav item and the breadcrumb. That is more than 20 accent elements in one viewport-scroll. It is contract-compliant (items 4 and 5 are declared), but the step list makes the counter and title both accent, so neither is the anchor. Recommend `--text-primary` for `.join-steps h3` so the counter carries the accent (requires a UI-SPEC amendment).
- Note: `.recaps-updated` and `.recap-meta` are `<p>`, so they inherit `opacity: 0.85` (base.css:120-124) on `--text-muted`. Contrast stays above 4.5:1 on `--bg-primary` but is lower than the token's documented value.

### Pillar 4: Typography (3/4)
- PASS: pages.css uses only 0.85rem, 1rem, 1.5rem and 2.2rem, and weights 400/700 (700 on `.evening-time`, counters and h3s). This matches the contract.
- WARNING: the inherited `.section-header p` at 0.95rem (sections.css:24) adds a fifth size (15.2 px) to every subpage, next to the 13.6 px labels. It is not new in Phase 4, but it breaks the declared four-size scale. Defer to Phase 5 or align it to 0.85rem.
- Minor: `.era-list li` is uppercase without the `letter-spacing: 1px` used on the breadcrumb label. Two uppercase label styles differ.

### Pillar 5: Spacing (4/4)
- Every declared value is used exactly: breadcrumbs 100/120 px clearance + 20 px gutter, `.breadcrumbs + .subpage` 32 px, `.page-block` 48 px, h2 → content 24 px, step grid 48 px / 16 px (8 px ≤ 768 px), FAQ 16/24 px (16 px mobile), grids 24 px, era tag 4/8 px, timeline 24 px, `.upcoming` 24 px (16 px mobile), recap meta and title 8 px.
- One `@media (max-width: 768px)` block only (pages.css:277), as the contract caps.
- `.recruitment-more { margin-bottom: 20px }` is a documented exception.
- Spacing earns 4/4 but is the main source of the Pillar 2 alignment defect: the 20 px gutter math ignores the 23 px `.section-header` inset.

### Pillar 6: Experience Design (3/4)
- PASS: the FAQ uses native `<details>` with the marker kept. There is no `outline: none`, no `list-style` or `display` rule on `summary`, and no transition or animation in pages.css.
- PASS: recap `<picture>` gets lazy/async loading, and the 16:9 `aspect-ratio` prevents layout shift. The empty state "Najbliższe misje" always renders with the CTA.
- PASS: both header and breadcrumb carry `aria-current="page"` (header.njk:22, breadcrumbs.njk:7).
- WARNING: backstop "Breadcrumb alignment" fails by code inspection (Fix 1). The backstops "320 px no overflow" and "breadcrumb below the fixed header at 390 px" were not visually verified in this audit (no screenshots). The 120 px value assumes a 99 px header that the header's wrap behaviour can change.
- WARNING: there is no styled `:focus-visible`, so focus rings fall back to browser defaults on a near-black background. Phase 5 owns this per the contract. It is recorded here because default rings on `.hud-btn.active` (accent fill) can be low-visibility.
- Registry audit: skipped (no shadcn, `shadcn_initialized: false`).

---

## Files Audited
- src/css/partials/pages.css
- src/css/partials/recruitment.css (lines 91-124)
- src/css/partials/sections.css (lines 12-28)
- src/css/partials/base.css (p rule)
- src/css/partials/components.css (.hud-border:hover)
- src/jak-dolaczyc.njk
- src/operacje.njk
- src/index.njk (hero, #rekrutacja)
- src/_includes/partials/breadcrumbs.njk
- src/_includes/partials/header.njk
