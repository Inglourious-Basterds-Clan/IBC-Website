# Phase 3: Performance & Assets - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> The decisions are in CONTEXT.md. This log keeps the alternatives that were considered.

**Date:** 2026-10-08
**Phase:** 03-performance-assets
**Areas discussed:** Image pipeline, Fonts to self-host (+ icons), CSS/JS build tooling, Performance budget & gate
**Folded todo:** Fix mobile LCP and render-blocking CSS in Phase 3 (PSI baseline 67)

---

## Image pipeline

| Option | Description | Selected |
|--------|-------------|----------|
| Build time, eleventy-img | Root devDependency, shortcode emits srcset/dims, sharp ≥0.35.5 in root + CI | ✓ |
| Pre-generated, committed | tools/ script like seo-images, manual regenerate per image | |

| Option | Description | Selected |
|--------|-------------|----------|
| Keep in repo, stop shipping | Originals as pipeline inputs only; delete hero.jpg; keep patrol/sniper as unshipped sources | ✓ |
| Keep, but downscale originals | Re-save ~1920px masters once | |
| Delete all unused | Remove hero.jpg, patrol.jpg, sniper.jpg | |

| Option | Description | Selected |
|--------|-------------|----------|
| Same image, object-fit | Responsive widths, object-fit cover, overlay via pseudo-element | ✓ |
| Art-directed mobile crop | `<picture>` with a portrait crop for phones | |

| Option | Description | Selected |
|--------|-------------|----------|
| 1600px wide, AVIF/WebP | Under 300 KB, sharp on desktop | ✓ |
| 1920px (full source res) | Max detail, WebP may approach the cap | |
| You decide | Claude picks | |

| Option | Description | Selected |
|--------|-------------|----------|
| AVIF + WebP + JPEG fallback | `<picture>`, JPEG as `<img src>` | ✓ |
| AVIF + WebP only | Smaller output, no legacy fallback | |

| Option | Description | Selected |
|--------|-------------|----------|
| Leave SEO images as-is | Only header logo + content images in the pipeline | ✓ |
| Move them into the pipeline | One system, risks OG cache-busting and the G3 tests | |

**Notes:** Scout found `hero.jpg` byte-identical to `hero-bg.jpg` (both PNG data), `logo.png` at 4608×4500 for a 48 px display, and `patrol.jpg`/`sniper.jpg` unreferenced.

---

## Fonts to self-host (+ icons)

| Option | Description | Selected |
|--------|-------------|----------|
| Montserrat only | The only face that renders today; drop Inter and Share Tech Mono | ✓ |
| Montserrat + interim mono | Add a Polish-capable mono now | |

| Option | Description | Selected |
|--------|-------------|----------|
| One variable woff2 | Latin + Latin-Ext subset, all weights | ✓ |
| Static 400/700/900 only | Remap 500/800 | |
| Static, all 5 weights | Exact parity, 5 files | |

| Option | Description | Selected |
|--------|-------------|----------|
| Commit subset woff2 + preload | OFL licence committed, font-display swap | ✓ |
| npm @fontsource package | Dependency-managed, two unicode-range files | |

| Option | Description | Selected |
|--------|-------------|----------|
| Automated test too | node --test cmap check for Polish letters | ✓ |
| Manual check only | Visual UAT only | |

| Option | Description | Selected |
|--------|-------------|----------|
| Nunjucks icon partial/shortcode | Single SVG source, accessible names on icon-only links | ✓ |
| Hand-paste SVG markup | Duplicated paths at each call site | |

---

## CSS/JS build tooling

| Option | Description | Selected |
|--------|-------------|----------|
| Lightning CSS | One dev dependency, bundles @import partials + minifies | ✓ |
| Zero-dep concat script | No dependency, weaker minification | |
| esbuild for CSS + JS | Conflicts with per-feature data-js modules | |

| Option | Description | Selected |
|--------|-------------|----------|
| Unbundled native modules | Entry dynamically imports features found via `[data-js]` | ✓ |
| Statically imported, all loaded | Every module downloaded, early-exit guards | |

| Option | Description | Selected |
|--------|-------------|----------|
| Delete unused selectors | Roster/calendar and other dead CSS removed | ✓ |
| Move to an unbundled partial | Keep for v2 | |

| Option | Description | Selected |
|--------|-------------|----------|
| Same look, Phase 1 D-07 method | Screenshots + manual checklist | ✓ |
| Small polish allowed | Minor tweaks permitted | |

---

## Performance budget & gate

| Option | Description | Selected |
|--------|-------------|----------|
| Post-build gate | Size/asset rules in the build chain, reject like Phase 2 | ✓ |
| Tests only | Assertions in npm test, build not blocked | |
| Manual PSI only | No automated guard | |

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, Claude sets numbers | CSS/JS/font caps in one config object | ✓ |
| Only the roadmap criteria | No total-weight caps | |

| Option | Description | Selected |
|--------|-------------|----------|
| Performance ≥ 90, recorded | PSI mobile on preview vs the 67 baseline; <90 = verification gap | ✓ |
| Record only, no threshold | | |
| ≥ 90 in all four categories | Pulls PERF-08 forward | |

| Option | Description | Selected |
|--------|-------------|----------|
| No, manual PSI run | Byte gate covers regressions | ✓ |
| Yes, Lighthouse CI | @lhci/cli on PRs | |

---

## Claude's Discretion

- Image widths/quality/sizes, shortcode naming, `.cache` in CI, folder name for unshipped sources
- Lightning CSS integration point, partial names/order, cache-busting
- JS minification, module file names, which modules load on every page
- Fallback `@font-face` metrics, subset tool, font file name
- Gate location (extend check-seo or sibling) and exact cap numbers
- `backdrop-filter` mobile optimization, only if visually identical

## Deferred Ideas

- Art-directed mobile hero crop (Phase 5)
- Polish-capable mono/HUD face (Phase 5 UI-SPEC)
- Lighthouse CI (rejected for now)
- Lighthouse ≥ 90 in all categories (PERF-08, Phase 5)
