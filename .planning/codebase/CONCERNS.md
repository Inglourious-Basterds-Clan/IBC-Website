---
last_mapped_commit: 63f2ad5fb842c140afe59fe486169f7da112193b
last_mapped_at: 2026-10-02
---
# Codebase Concerns

**Analysis Date:** 2026-10-02

## Tech Debt

**Hardcoded Configuration Values:**
- Issue: Discord invite link appears in 3+ places (HTML and JavaScript) making updates difficult and error-prone
- Files: `index.html` (lines 230, 265), `js/main.js` (line 174)
- Impact: Any change to Discord link requires multiple edits; risk of inconsistency
- Fix approach: Extract to a single configuration object or constants file (`js/config.js`) that all modules reference

**Monolithic JavaScript File:**
- Issue: All functionality crammed into single `js/main.js` without modularization or separation of concerns
- Files: `js/main.js`
- Impact: Difficult to test individual components, hard to maintain, no code reuse patterns
- Fix approach: Break into separate modules: `js/menu.js`, `js/lightbox.js`, `js/recruitment.js`, `js/scrollspy.js`, `js/easteregg.js`

**Unmodularized CSS:**
- Issue: Single monolithic `css/style.css` with 1400+ lines mixing component styles, utilities, and media queries
- Files: `css/style.css`
- Impact: Difficult to locate specific styles, no clear separation between components
- Fix approach: Split into modular files: `css/variables.css`, `css/base.css`, `css/components/*.css`, `css/media-queries.css`

**Inline Styles in HTML:**
- Issue: Multiple inline `style` attributes throughout HTML (lines 100, 118, 126, 217, 219, 230, 271)
- Files: `index.html` (inline styles on h3, div, a elements)
- Impact: Violates separation of concerns, makes styling hard to maintain, difficult to apply consistent updates
- Fix approach: Move all inline styles to CSS classes in `css/style.css`

**Magic Numbers and Hard-coded Values:**
- Issue: DOM queries, timeout values, and layout constants scattered throughout JavaScript
- Files: `js/main.js` (threshold: 0.3, timeouts: 600ms, 1400ms, 2200ms, 41 chars width in mobile menu)
- Impact: No easy way to adjust timing, responsive breakpoints, or observer thresholds
- Fix approach: Create `js/constants.js` with all magic numbers and configuration

## Known Bugs

**Easter Egg Text Overflow:**
- Symptoms: Easter egg modal content (`#decryption-overlay`) has 7 extremely long paragraphs that may be cut off or cause layout shift on small screens
- Files: `index.html` (lines 284-290)
- Trigger: Click version number in footer to open easter egg modal on mobile device
- Workaround: Increase viewport height or manually scroll within modal
- Severity: Low - aesthetic issue only

**Scroll Position Loss on Mobile Menu Toggle:**
- Symptoms: When mobile menu opens/closes, `document.body.style.overflow` is manipulated which can reset scroll position
- Files: `js/main.js` (lines 23, 32)
- Trigger: Toggle menu on mobile, then close and scroll
- Cause: Setting/unsetting overflow property can cause jank
- Fix approach: Use transform-based scroll locking or `overflow: hidden` with `pointer-events: none` on body

**Gallery Lightbox Navigation Out of Sync:**
- Symptoms: If gallery items are reordered in DOM dynamically, lightbox index tracking breaks
- Files: `js/main.js` (line 55: `imageSources` array built once at init)
- Trigger: Add/remove gallery items after page load
- Cause: `imageSources` array created once during initialization, doesn't update if DOM changes
- Workaround: Refresh page if gallery content changes

## Security Considerations

**Hardcoded Sensitive Links:**
- Risk: Discord invite link is visible in plain text in source and easily accessible
- Files: `index.html` (lines 230, 265), `js/main.js` (line 174)
- Current mitigation: None - link is public but exposed
- Recommendations: Consider this acceptable for public recruitment links, but ensure:
  - Never put actual API keys or tokens in HTML/JS
  - If this link needs rotation, implement server-side redirect
  - Monitor Discord link for abuse if heavily shared

**No Content Security Policy (CSP):**
- Risk: No CSP headers means easier exploitation if CDN is compromised
- Files: Server configuration (not in repo)
- Current mitigation: None
- Recommendations: Add CSP header restricting scripts to `self` and `https://cdnjs.cloudflare.com`, `https://fonts.googleapis.com`

**External CDN Dependencies:**
- Risk: Relies on external CDNs for Font Awesome, Google Fonts, and cdnjs
- Files: `index.html` (lines 14-16)
- Current mitigation: HTTPS used, but no fallbacks
- Recommendations:
  - Download Font Awesome locally or use SVG icons
  - Download Google Fonts as web fonts to assets
  - Implement fallback system fonts if CDN fails
  - Add integrity hashes to all external script/stylesheet loads

**No Input Validation:**
- Risk: If recruitment form is implemented in future, no validation framework in place
- Files: `js/main.js` (form-related code not yet implemented)
- Current mitigation: Form not yet active
- Recommendations: Add validation library and sanitization when form is enabled

## Performance Bottlenecks

**Expensive Backdrop Filter Effects:**
- Problem: Header and multiple modals use `backdrop-filter: blur(10px)` which requires GPU compositing and is expensive on mobile
- Files: `css/style.css` (lines 132-133, 247, 798)
- Cause: Blur effect recomputed on every frame when scrolling/interaction
- Impact: Noticeable jank on mobile devices, 30-50% frame time loss on older phones
- Improvement path:
  1. Test on target devices
  2. Consider replacing blur with solid semi-transparent background on mobile
  3. Use media query `@media (prefers-reduced-motion)` to disable effects for users who prefer reduced motion

**Fixed Positioning Performance:**
- Problem: Multiple fixed-position elements (header, grid-bg, body::before overlay) cause layout reflows
- Files: `css/style.css` (lines 238-241, 62-73, 76-89)
- Cause: Fixed elements are not part of normal flow but force browser to repaint other layers
- Impact: Scroll jank on mobile, increased CPU usage
- Improvement path: Use `will-change: transform` or `transform3d` to promote elements to separate layers

**Scanline Overlay Animation:**
- Problem: `body::before` element with complex gradient and `opacity: 0.4` is drawn on every frame
- Files: `css/style.css` (lines 59-73)
- Cause: Semi-transparent overlay causes blending on every pixel
- Impact: Reduced frame rate during scrolling
- Improvement path: Use Canvas element instead of CSS gradient for scanline effect, or use a small repeating SVG background

**Unoptimized Images:**
- Problem: Hero background image `assets/hero-bg.jpg` and gallery images not optimized for web
- Files: `index.html` (line 384), `index.html` (lines 145-177)
- Impact: Slow initial page load, particularly on mobile
- Improvement path:
  1. Use WebP format with JPEG fallback
  2. Implement responsive images with `srcset`
  3. Add explicit width/height attributes to prevent layout shift
  4. Compress all JPG/PNG files (target < 100KB per image)

**FontAwesome CDN Loading:**
- Problem: Font Awesome 6.0 full CSS (all 1500+ icons) loaded even though only ~5 icons used
- Files: `index.html` (line 16)
- Impact: ~90KB additional CSS download
- Improvement path: Replace with inline SVGs or use icon font subset tool

## Fragile Areas

**Mobile Menu Toggle Logic:**
- Files: `js/main.js` (lines 12-36)
- Why fragile: Relies on specific DOM structure (`.menu-toggle`, `nav ul`, `nav ul li a`). If HTML structure changes, entire menu breaks. No error handling if elements don't exist.
- Safe modification: Add defensive checks and abstract selectors into constants. Consider using dataset attributes for safer selection.
- Test coverage: No tests for menu open/close/keyboard interaction

**Lightbox Image Selection:**
- Files: `js/main.js` (lines 43-120)
- Why fragile: Selects gallery items and builds array once at page load. Array order must match gallery DOM order. If gallery item HTML structure changes, array building breaks.
- Safe modification: Always query DOM fresh when navigating rather than relying on pre-built array. Add validation that `data-src` attribute exists.
- Test coverage: No tests for lightbox navigation, keyboard controls

**Scroll Spy Observer:**
- Files: `js/main.js` (lines 184-206)
- Why fragile: Uses `rootMargin: '-30% 0px -60% 0px'` which is magic number and fragile. Issues if viewport changes dramatically or sections have different heights. `getAttribute('id')` can fail if sections don't have IDs.
- Safe modification: Calculate margins based on viewport height. Validate all sections have IDs before use.
- Test coverage: No tests for navigation highlight as user scrolls

**Recruitment Terminal Boot Sequence:**
- Files: `js/main.js` (lines 141-181)
- Why fragile: Hard-coded timeouts (600ms, 1400ms, 2200ms) without configuration. If timing needs adjustment for A/B testing or animation tuning, code must be modified. Observer threshold (0.3) is magic number.
- Safe modification: Move timing values to configuration. Consider using Promise-based animation queuing.
- Test coverage: No tests for terminal animation sequence

## Scaling Limits

**No Pagination for Gallery:**
- Current capacity: 4 gallery items hardcoded in HTML
- Limit: Adding 20+ images breaks mobile layout and performance
- Scaling path: Implement lazy-loading gallery with pagination/infinite-scroll, load images on demand

**No Member Roster System:**
- Current capacity: Roster section HTML exists but unused; no API or data source
- Limit: Cannot scale to 50+ members without backend
- Scaling path: Create CMS or API endpoint for member data, render roster dynamically

**No Event Calendar Data Source:**
- Current capacity: Calendar section exists in CSS but no data binding
- Limit: Events are hard-coded; cannot scale to recurring operations
- Scaling path: Connect to Google Calendar API or implement event management backend

**Monolithic Frontend:**
- Current capacity: Single HTML file works for current scope
- Limit: Cannot scale to multiple pages (rules, calendar detail, member profiles)
- Scaling path: Migrate to static site generator (Hugo, 11ty) or SPA framework (Vue, React)

## Dependencies at Risk

**Font Awesome CDN:**
- Risk: Entire icon system depends on external CDN; if down, all icons disappear
- Impact: Discord/YouTube/Facebook icons missing, navigation appears broken
- Migration plan: Download Font Awesome locally or convert to SVG icons (smaller, no dependency)

**Google Fonts CDN:**
- Risk: Share Tech Mono, Montserrat, Inter fonts load from external CDN
- Impact: If CDN down, fallback to system fonts (likely), but layout may shift
- Migration plan: Download font files locally, use `@font-face` with woff2 format

**cdnjs CDN:**
- Risk: Font Awesome hosted on cdnjs which is third-party CDN
- Impact: If cdnjs experiences issues, no icons load
- Migration plan: Use jsDelivr or unpkg as more reliable alternatives, or self-host

## Missing Critical Features

**No Analytics:**
- Problem: No way to track user behavior, conversion (Discord link clicks), or traffic patterns
- Blocks: Cannot measure effectiveness of recruitment page
- Recommendation: Add Google Analytics 4 with event tracking for link clicks, section views

**No Form Validation:**
- Problem: Recruitment form HTML exists but no submit handler or validation
- Blocks: Cannot collect recruit applications
- Recommendation: Implement form validation with error messages; integrate with Google Forms or Discord webhook

**No Error Tracking:**
- Problem: No error logging if JavaScript breaks
- Blocks: Cannot know if users experience issues
- Recommendation: Add Sentry or similar error tracking

**No Accessibility Features:**
- Problem: No ARIA labels for complex components, no skip links
- Blocks: Site not fully accessible to screen reader users
- Recommendation: Add ARIA attributes, skip-to-content link, test with screen readers

**No Testing Framework:**
- Problem: No unit tests, integration tests, or E2E tests
- Blocks: Refactoring is risky; bugs introduced easily
- Recommendation: Add Vitest for unit tests, Playwright for E2E tests

## Test Coverage Gaps

**Mobile Menu Interactions:**
- What's not tested: Menu toggle, link clicks closing menu, keyboard navigation (none implemented)
- Files: `js/main.js` (initMobileMenu function)
- Risk: Changes to menu logic could break navigation
- Priority: High - core navigation feature

**Lightbox Gallery:**
- What's not tested: Opening/closing lightbox, keyboard controls (arrow keys, Escape), boundary conditions (first/last image), touch swipe gestures
- Files: `js/main.js` (initLightbox function)
- Risk: Gallery could break silently; users unable to view full-size images
- Priority: High - primary content interaction

**Scroll Spy Navigation Highlighting:**
- What's not tested: Nav links highlighting when sections are in view, behavior at boundaries, multiple rapid scrolls
- Files: `js/main.js` (initScrollSpy function)
- Risk: Navigation highlight could be wrong, confusing users about current section
- Priority: Medium - UX issue but not critical

**Responsive Layout:**
- What's not tested: Layout at 320px, 768px, 1024px, 1440px breakpoints; menu on mobile; gallery grid responsiveness
- Files: `css/style.css` (media queries at 992px, 768px, 480px)
- Risk: Site could be broken on some devices; poor UX
- Priority: High - affects all mobile users

**Easter Egg Easter Egg:**
- What's not tested: Opening/closing decryption overlay, keyboard escape, scroll behavior in modal
- Files: `js/main.js` (initEasterEgg function), `css/style.css` (decryption-overlay)
- Risk: Easter egg could malfunction silently
- Priority: Low - fun but non-critical

**Terminal Animation Sequence:**
- What's not tested: Boot sequence timing, observer intersection detection, terminal autoscroll
- Files: `js/main.js` (initRecruitmentTerminal, runBootSequence)
- Risk: Terminal could show wrong messages or timing could be off
- Priority: Medium - recruitment visual element

**No Cross-Browser Testing:**
- What's not tested: Safari (backdrop-filter support), Firefox (grid-auto-fit behavior), older Chrome (CSS Grid support)
- Risk: Features could break on 20% of users
- Priority: High - must support major browsers

---

*Concerns audit: 2026-10-02*
