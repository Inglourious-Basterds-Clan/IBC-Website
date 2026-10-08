---
created: 2026-10-08T20:29:58.435Z
title: Fix mobile LCP and render-blocking CSS in Phase 3
area: general
severity: minor
files:
  - src/assets/hero-bg.jpg
  - src/css/style.css:1
  - src/_includes/partials/head.njk:24
---

## Problem

Measured baseline for Phase 3 (Performance & Assets). PageSpeed Insights, **mobile**, on the GitHub Pages preview
https://inglourious-basterds-clan.github.io/IBC-Website/ — measured 2026-10-08 right after the Phase 2 deploy:

- **Performance: 67**
- Weighted metric points (earned / weight): **LCP 0/25**, FCP 4/10, SI 7/10, CLS 25/25, TBT 30/30 (sum 66 ≈ 67 with rounding)

Reading:
- **LCP is the dominant loss** (earns nothing, i.e. well past the mobile threshold). The LCP element is almost certainly the hero background, `src/assets/hero-bg.jpg` — a 1920×1080 PNG served under a .jpg name (noted by the Phase 2 security audit), unoptimized, not responsive, not preloaded.
- **FCP/SI are hurt by render-blocking third-party CSS**: the Google Fonts `@import` at the top of `src/css/style.css:1` (Inter, Montserrat 300–900, Share Tech Mono) and the Font Awesome 6.0.0 CDN stylesheet in `src/_includes/partials/head.njk:24`.
- JavaScript (TBT) and layout stability (CLS) are already perfect — do not spend Phase 3 effort there.

Also seen in the same PSI run, **not a defect**: the SEO audit "is-crawlable" fails on the preview because every preview page is `noindex` by design (D-15; CI never sets SITE_INDEXABLE). It passes only on the final indexable IIS build.

## Solution

Feed into Phase 3 planning, in this order:
1. LCP first: real JPEG/AVIF/WebP hero at responsive sizes (`srcset`), `<link rel="preload" as="image" fetchpriority="high">` for the hero, explicit dimensions. Note: if `@11ty/eleventy-img` is used, it pulls sharp into the root tree/CI on Linux — the root lockfile must resolve sharp ≥ 0.35.5 (GHSA-wq5f-xc86-pv6w, see 02-SECURITY.md follow-ups).
2. Then render-blocking CSS: self-host the Polish-subset fonts (fewer weights, `font-display: swap`, preload the critical one) and replace the Font Awesome CDN with inline SVG icons.
3. Re-run PSI mobile on the preview after Phase 3 and compare against this baseline (target set by the Phase 3 performance budget).
