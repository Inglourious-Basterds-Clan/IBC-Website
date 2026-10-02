---
last_mapped_commit: 63f2ad5fb842c140afe59fe486169f7da112193b
last_mapped_at: 2026-10-02
---
# Coding Conventions

**Analysis Date:** 2026-10-02

## Naming Patterns

**Files:**
- HTML: `index.html` (single entry point)
- CSS: `style.css` (single stylesheet in `css/` directory)
- JavaScript: `main.js` (single script in `js/` directory)
- Pattern: lowercase with hyphens for directories (`css/`, `js/`, `assets/`)

**Functions:**
- camelCase for all function names
- Examples: `initMobileMenu()`, `initLightbox()`, `runBootSequence()`, `openLightbox()`, `closeLightbox()`
- Nested functions follow same pattern: `updateLightboxContent()`, `showNext()`, `showPrev()`
- Descriptive verb-first naming: functions start with action words (`init*`, `open*`, `close*`, `write*`, `update*`, `show*`)

**Variables:**
- camelCase for all variable names
- Examples: `toggle`, `navList`, `currentIndex`, `imageSources`, `consoleEl`, `booted`
- Descriptive names avoid abbreviations except for common DOM suffixes (`El` for element, `Btn` for button, `Str` for string)
- Constants: Use descriptive camelCase in function scope; no module-level constants

**CSS Classes:**
- kebab-case for all CSS class names
- Examples: `.hud-border`, `.gallery-item`, `.menu-toggle`, `.lightbox-close`, `.calendar-day`
- Semantic naming: class names describe purpose/component, not styling
- No object-oriented naming patterns (avoid `.red`, `.bold`); use semantic names (`.danger-color`, `.text-muted`)

**CSS Custom Properties:**
- kebab-case with double-dash prefix
- Organized by category: `--bg-*`, `--text-*`, `--accent-*`, `--border-*`, `--transition-*`
- Examples: `--bg-primary`, `--text-secondary`, `--accent-color`, `--border-color`, `--grid-line-color`
- All defined in `:root` for global availability (`css/style.css` lines 4-35)

## Code Style

**Formatting:**
- No automated formatter configured (no .prettierrc, eslint, or similar)
- Manual formatting conventions observed:
  - 2-space indentation (observed in HTML and CSS)
  - Consistent line breaks between logical sections
  - CSS properties organized by type (spacing, colors, transitions)

**Linting:**
- No linter configured (no .eslintrc files present)
- Manual code quality standards observed:
  - Early returns for guard clauses: `if (!lightbox || items.length === 0) return;` (`js/main.js:52`)
  - Defensive DOM checks before accessing elements
  - Consistent error handling patterns

**Semicolons:**
- Present on all statements in JavaScript
- Consistent use across all `.js` files

**Quotes:**
- Single quotes in HTML attributes: `class="menu-toggle"`, `id="hero"`
- Template literals used for complex HTML generation (`js/main.js:156-160`)

## Import Organization

**JavaScript:**
- No module system used (vanilla JavaScript)
- All code in single `js/main.js` file loaded at end of HTML document
- DOMContentLoaded event handler wraps initialization: `document.addEventListener('DOMContentLoaded', () => { ... })`

**CSS:**
- @import statement for Google Fonts at top of stylesheet (`css/style.css:1`)
- External Font Awesome CDN linked in HTML `<head>` section
- Single stylesheet linked in HTML: `<link rel="stylesheet" href="css/style.css">`

**HTML:**
- Semantic HTML5 structure: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- External resources in `<head>`: fonts, stylesheets, preconnect directives
- Structured data (JSON-LD) for SEO in `<head>` (lines 26-35)

## Error Handling

**Patterns:**
- Guard clauses with early returns prevent further execution
  - Example: `if (!lightbox || items.length === 0) return;` (`js/main.js:52`)
  - Example: `if (!toggle && navList) { ... }` (`js/main.js:17`)
- DOM existence checks before accessing properties
  - Example: `const consoleEl = document.getElementById('terminal-console'); if (!consoleEl) return;` (`js/main.js:124-125`)
- Safe array/collection access via Array.from() and map/forEach
- No try/catch blocks (not needed for vanilla DOM manipulation)
- No error logging or reporting (runs silently on failure)

**Null/Undefined Handling:**
- Ternary operators for conditional logic: `isActive ? 'true' : 'false'` (`js/main.js:22`)
- Logical operators for default values: `message || 'unknown'` pattern not used; always provide full values

## Logging

**Framework:** `console` methods (browser console only)

**Patterns:**
- No console logging in production code
- Console output left to browser DevTools inspection
- Application uses custom terminal display for status messages (`js/main.js:142-164`)

**Custom Logging:**
- Terminal simulation for recruitment section
- Status messages written via `writeToConsole()` helper function
- Messages timestamped in `HH:MM:SS` format
- Status levels: `'info'` (default), `'success'`, `'error'`, `'warn'` (`js/main.js:142`)

## Comments

**When to Comment:**
- Section headers with dashes: `/* --- FEATURE NAME --- */` separate major sections
- Inline comments explain non-obvious logic
- No comments for obvious code (e.g., `const toggle = document.querySelector('.menu-toggle');` doesn't need explanation)

**Examples:**
- Section header: `/* --- MOBILE MENU --- */` (`js/main.js:11`)
- Inline logic: `// Lock background scroll` (`js/main.js:65`)
- Nested explanation: `// Close menu when a link is clicked` (`js/main.js:26`)

**Code Comments:**
- Comments placed above or inline with complex logic
- Polish language used in some messages (target audience is Polish gaming clan)
- No JSDoc or TypeScript doc comments (vanilla JavaScript project)

## Function Design

**Size:**
- Functions are small, focused on single responsibility
- Largest function: `runBootSequence()` is ~40 lines but manages timed sequential output only
- Most functions: 10-25 lines
- Example small function: `closeLightbox()` (3 lines, `js/main.js:74-77`)

**Parameters:**
- Functions accept minimal parameters
- Example: `openLightbox(index)` takes only index, uses closure to access `imageSources`
- Complex data passed via closures or module scope, not parameters
- No destructuring patterns used

**Return Values:**
- Most functions return nothing (void) - perform side effects on DOM
- Guard clause functions early return without value: `if (!lightbox) return;`
- Nested functions use closure variables instead of returning data

**Arrow Functions:**
- Used consistently for event handlers and callbacks
- Pattern: `element.addEventListener('click', () => { ... })`
- Arrow functions preserve `this` context (not critical here as no classes used)

## Module Design

**Exports:**
- Single file (`js/main.js`) exports nothing - all functions are module-private
- No module.exports or ES6 export statements
- Functions scoped to file; only DOMContentLoaded callback is public entry point

**Barrel Files:**
- Not applicable; single JavaScript file

**Scoping:**
- All functions are file-scoped (not globally accessible)
- Only `document.addEventListener('DOMContentLoaded')` handler exposes entry point
- Variables declared with `const`/`let` (no `var`)
- Closure pattern used to maintain state: `currentIndex` in lightbox feature

## HTML Semantic Structure

**File:** `index.html`

**Organization:**
- Proper semantic HTML5 elements: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- Each section has unique `id` for navigation: `id="hero"`, `id="about"`, `id="gallery"`, `id="recruitment"`
- Accessibility attributes: `aria-label`, `aria-expanded`, `aria-controls` on interactive elements

**Attributes:**
- Images have `alt` text and dimensions: `alt="IBC Logo" class="logo-img" width="48" height="48"`
- Lazy loading: `decoding="async"` on images
- ARIA roles for accessibility

## CSS Organization

**Structure:** `css/style.css` (1449 lines)

**Organization by Section:**
1. Custom variables in `:root` (lines 3-35)
2. Base styles: `*`, `html`, `body` (lines 38-89)
3. Typography (lines 93-125)
4. Reusable HUD components (lines 127-236)
5. Header/Navigation (lines 237-364)
6. Hero section (lines 365-468)
7. Section general styles (lines 530-558)
8. About section (lines 559-620)
9. Roster section (lines 621-716)
10. Gallery section (lines 717-870)
11. Recruitment section (lines 871-1001)
12. Footer (lines 1003-1071)
13. Calendar section (lines 1072-1255)
14. Easter egg overlay (lines 1256-1365)
15. Responsive media queries (lines 1366-1449)

**Custom Properties:**
- All colors defined as CSS variables in `:root`
- Transition speeds unified: `--transition-speed: 0.25s` (line 34)
- Font stacks defined: `--font-hud`, `--font-body` (lines 25-26)
- Opacity and colors use RGB format for variable reuse: `--accent-rgb: 203, 177, 138` (line 11)

**Class Naming Convention:**
- Component-based: `.hud-*`, `.gallery-*`, `.calendar-*`, `.terminal-*`, `.recruitment-*`
- State modifiers: `.active`, `.open`, `.today`, `.empty`, `.danger`
- Pseudo-elements for decorative elements: `::before`, `::after` for corners, brackets, animations

## Accessibility Considerations

**HTML:**
- Semantic elements properly used
- ARIA attributes on interactive elements: `aria-label`, `aria-expanded`, `aria-controls`
- Form labels associated via `<label>` elements
- Skip links could be added for keyboard navigation

**CSS:**
- Color contrast verified: `--text-muted: #8e9fa9` has WCAG AA compliant contrast > 4.5:1 (line 23 comment)
- Focus states possible but not explicitly styled
- Animated elements have reasonable opacity changes (blinking status dot, 2s cycle)

---

*Convention analysis: 2026-10-02*
