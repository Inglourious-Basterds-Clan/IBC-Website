<!-- GSD:project-start source:PROJECT.md -->

## Project

**IBC Website**

The public website of the Inglourious Basterds Clan (IBC), a Polish Arma 3 milsim community founded in 2018. Today it is a single-page, Polish-language "tactical HUD" landing page that funnels visitors to the clan Discord. This project turns it into a fast, well-indexed, multi-page site that ranks for Polish Arma 3 / milsim recruitment searches and gives first-time visitors a polished, trustworthy impression.

**Core Value:** A Polish player searching for an Arma 3 milsim clan (or for "IBC" by name) finds this site, understands what IBC is and how to join, and clicks through to Discord.

### Constraints

- **Hosting**: Must remain a static site deployable to any static host — user deploys it themselves
- **Tooling**: A light build step (static site generator, image optimization) is acceptable, but output must be plain static files
- **Language**: Polish only
- **Domain**: Unknown at build time — site URL must be a single config value
- **Roster dependency**: Roster depends on an external Discord bot's data format; scheduled last

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- HTML5 - Markup for all pages (`index.html`)
- CSS3 - Styling with custom properties/CSS variables (`css/style.css`)
- JavaScript (ES6+) - Client-side interactivity, no framework (`js/main.js`)
- JSON - Structured data for SEO (embedded in HTML via JSON-LD schema)

## Runtime

- Browser (client-side only)
- No server-side runtime required
- Static site deployment (serves as-is via HTTP/HTTPS)
- No build step required

## Frameworks

- Vanilla JavaScript (no framework like React, Vue, or Angular)
- Custom DOM manipulation for interactivity
- CSS3 with CSS Custom Properties (variables)
- No preprocessing (SASS/LESS)
- No CSS framework (no Bootstrap, Tailwind)
- No build tools detected (no webpack, Vite, or similar)
- No task runner detected (no Gulp, Grunt)

## Key Dependencies

- **Google Fonts API** - Font delivery
- **Font Awesome CDN** 6.0.0 - Icon library
- **Browser APIs** - No external packages, native APIs only

## Configuration

- No `.env` file or environment configuration
- All configuration is hardcoded in HTML/CSS/JS
- Language: Polish (HTML lang="pl", content in Polish)
- No build configuration files detected
- No `package.json`, `webpack.config.js`, or similar
- Project is deploy-as-is
- Images stored in `assets/` directory
- Supported formats: PNG, JPG
- Types: Logo, hero backgrounds, gallery images

## Platform Requirements

- Text editor (VS Code, Sublime Text, etc.)
- Local web server for testing (e.g., `python -m http.server`, Live Server extension)
- No Node.js, Python, or other runtime required for development
- Static hosting (GitHub Pages, Netlify, Vercel, traditional web server)
- HTTP/2 support preferred
- HTTPS recommended for Discord OAuth in future (if added)
- CDN for Font Awesome and Google Fonts (already configured)

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- HTML: `index.html` (single entry point)
- CSS: `style.css` (single stylesheet in `css/` directory)
- JavaScript: `main.js` (single script in `js/` directory)
- Pattern: lowercase with hyphens for directories (`css/`, `js/`, `assets/`)
- camelCase for all function names
- Examples: `initMobileMenu()`, `initLightbox()`, `runBootSequence()`, `openLightbox()`, `closeLightbox()`
- Nested functions follow same pattern: `updateLightboxContent()`, `showNext()`, `showPrev()`
- Descriptive verb-first naming: functions start with action words (`init*`, `open*`, `close*`, `write*`, `update*`, `show*`)
- camelCase for all variable names
- Examples: `toggle`, `navList`, `currentIndex`, `imageSources`, `consoleEl`, `booted`
- Descriptive names avoid abbreviations except for common DOM suffixes (`El` for element, `Btn` for button, `Str` for string)
- Constants: Use descriptive camelCase in function scope; no module-level constants
- kebab-case for all CSS class names
- Examples: `.hud-border`, `.gallery-item`, `.menu-toggle`, `.lightbox-close`, `.calendar-day`
- Semantic naming: class names describe purpose/component, not styling
- No object-oriented naming patterns (avoid `.red`, `.bold`); use semantic names (`.danger-color`, `.text-muted`)
- kebab-case with double-dash prefix
- Organized by category: `--bg-*`, `--text-*`, `--accent-*`, `--border-*`, `--transition-*`
- Examples: `--bg-primary`, `--text-secondary`, `--accent-color`, `--border-color`, `--grid-line-color`
- All defined in `:root` for global availability (`css/style.css` lines 4-35)

## Code Style

- No automated formatter configured (no .prettierrc, eslint, or similar)
- Manual formatting conventions observed:
- No linter configured (no .eslintrc files present)
- Manual code quality standards observed:
- Present on all statements in JavaScript
- Consistent use across all `.js` files
- Single quotes in HTML attributes: `class="menu-toggle"`, `id="hero"`
- Template literals used for complex HTML generation (`js/main.js:156-160`)

## Import Organization

- No module system used (vanilla JavaScript)
- All code in single `js/main.js` file loaded at end of HTML document
- DOMContentLoaded event handler wraps initialization: `document.addEventListener('DOMContentLoaded', () => { ... })`
- @import statement for Google Fonts at top of stylesheet (`css/style.css:1`)
- External Font Awesome CDN linked in HTML `<head>` section
- Single stylesheet linked in HTML: `<link rel="stylesheet" href="css/style.css">`
- Semantic HTML5 structure: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- External resources in `<head>`: fonts, stylesheets, preconnect directives
- Structured data (JSON-LD) for SEO in `<head>` (lines 26-35)

## Error Handling

- Guard clauses with early returns prevent further execution
- DOM existence checks before accessing properties
- Safe array/collection access via Array.from() and map/forEach
- No try/catch blocks (not needed for vanilla DOM manipulation)
- No error logging or reporting (runs silently on failure)
- Ternary operators for conditional logic: `isActive ? 'true' : 'false'` (`js/main.js:22`)
- Logical operators for default values: `message || 'unknown'` pattern not used; always provide full values

## Logging

- No console logging in production code
- Console output left to browser DevTools inspection
- Application uses custom terminal display for status messages (`js/main.js:142-164`)
- Terminal simulation for recruitment section
- Status messages written via `writeToConsole()` helper function
- Messages timestamped in `HH:MM:SS` format
- Status levels: `'info'` (default), `'success'`, `'error'`, `'warn'` (`js/main.js:142`)

## Comments

- Section headers with dashes: `/* --- FEATURE NAME --- */` separate major sections
- Inline comments explain non-obvious logic
- No comments for obvious code (e.g., `const toggle = document.querySelector('.menu-toggle');` doesn't need explanation)
- Section header: `/* --- MOBILE MENU --- */` (`js/main.js:11`)
- Inline logic: `// Lock background scroll` (`js/main.js:65`)
- Nested explanation: `// Close menu when a link is clicked` (`js/main.js:26`)
- Comments placed above or inline with complex logic
- Polish language used in some messages (target audience is Polish gaming clan)
- No JSDoc or TypeScript doc comments (vanilla JavaScript project)

## Function Design

- Functions are small, focused on single responsibility
- Largest function: `runBootSequence()` is ~40 lines but manages timed sequential output only
- Most functions: 10-25 lines
- Example small function: `closeLightbox()` (3 lines, `js/main.js:74-77`)
- Functions accept minimal parameters
- Example: `openLightbox(index)` takes only index, uses closure to access `imageSources`
- Complex data passed via closures or module scope, not parameters
- No destructuring patterns used
- Most functions return nothing (void) - perform side effects on DOM
- Guard clause functions early return without value: `if (!lightbox) return;`
- Nested functions use closure variables instead of returning data
- Used consistently for event handlers and callbacks
- Pattern: `element.addEventListener('click', () => { ... })`
- Arrow functions preserve `this` context (not critical here as no classes used)

## Module Design

- Single file (`js/main.js`) exports nothing - all functions are module-private
- No module.exports or ES6 export statements
- Functions scoped to file; only DOMContentLoaded callback is public entry point
- Not applicable; single JavaScript file
- All functions are file-scoped (not globally accessible)
- Only `document.addEventListener('DOMContentLoaded')` handler exposes entry point
- Variables declared with `const`/`let` (no `var`)
- Closure pattern used to maintain state: `currentIndex` in lightbox feature

## HTML Semantic Structure

- Proper semantic HTML5 elements: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- Each section has unique `id` for navigation: `id="hero"`, `id="about"`, `id="gallery"`, `id="recruitment"`
- Accessibility attributes: `aria-label`, `aria-expanded`, `aria-controls` on interactive elements
- Images have `alt` text and dimensions: `alt="IBC Logo" class="logo-img" width="48" height="48"`
- Lazy loading: `decoding="async"` on images
- ARIA roles for accessibility

## CSS Organization

- All colors defined as CSS variables in `:root`
- Transition speeds unified: `--transition-speed: 0.25s` (line 34)
- Font stacks defined: `--font-hud`, `--font-body` (lines 25-26)
- Opacity and colors use RGB format for variable reuse: `--accent-rgb: 203, 177, 138` (line 11)
- Component-based: `.hud-*`, `.gallery-*`, `.calendar-*`, `.terminal-*`, `.recruitment-*`
- State modifiers: `.active`, `.open`, `.today`, `.empty`, `.danger`
- Pseudo-elements for decorative elements: `::before`, `::after` for corners, brackets, animations

## Accessibility Considerations

- Semantic elements properly used
- ARIA attributes on interactive elements: `aria-label`, `aria-expanded`, `aria-controls`
- Form labels associated via `<label>` elements
- Skip links could be added for keyboard navigation
- Color contrast verified: `--text-muted: #8e9fa9` has WCAG AA compliant contrast > 4.5:1 (line 23 comment)
- Focus states possible but not explicitly styled
- Animated elements have reasonable opacity changes (blinking status dot, 2s cycle)

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Mobile Menu | Toggle navigation on mobile devices, close on link click | `js/main.js` initMobileMenu() |
| Lightbox Gallery | Display gallery images in fullscreen modal with navigation controls | `js/main.js` initLightbox() |
| Recruitment Terminal | Simulate boot sequence and display recruitment status in terminal format | `js/main.js` initRecruitmentTerminal() |
| Scroll Spy | Highlight active navigation link based on current scroll position | `js/main.js` initScrollSpy() |
| Easter Egg Console | Display hidden decryption overlay with narrative content | `js/main.js` initEasterEgg() |
| Page Styling | Apply tactical/HUD theme with dark colors, glows, and grid backgrounds | `css/style.css` |

## Pattern Overview

- No framework dependencies (pure vanilla JS)
- DOM-based state management (visibility classes and inline styles)
- Event listener attachment on DOMContentLoaded
- Modular initialization functions for each feature
- Responsive design with mobile-first approach
- Dark tactical HUD-inspired visual theme

## Layers

- Purpose: Define semantic page structure with sections for hero, about, gallery, recruitment
- Location: `index.html` (root)
- Contains: Navigation header, main content sections, footer, modal containers
- Depends on: CSS for styling, JavaScript for interactivity
- Used by: Browser renders to display page content
- Purpose: Apply dark tactical theme, responsive layout, animations, and visual effects
- Location: `css/style.css`
- Contains: CSS variables for colors, typography, grid backgrounds, scanline effects, component styling
- Depends on: Google Fonts for typefaces (Inter, Montserrat, Share Tech Mono)
- Used by: HTML elements through class/id selectors
- Purpose: Handle user interactions and manage modal/menu states
- Location: `js/main.js`
- Contains: Five initialization functions for different features, event handlers
- Depends on: DOM structure from index.html
- Used by: Browser executes on DOMContentLoaded event

## Data Flow

### Primary Page Load Path

### Lightbox Gallery Flow

### Recruitment Terminal Flow

### Mobile Menu Flow

- Local variables in JavaScript functions (closures maintain state)
- DOM class attributes for CSS-driven visibility (menu-toggle.open, nav.active)
- Inline style property manipulation (display, overflow)
- Single boolean flag for terminal bootstrap sequence (booted)

## Key Abstractions

- Purpose: Display fullscreen overlays for user interactions
- Examples: Lightbox gallery viewer, Easter egg decryption console
- Pattern: Hidden by default (display: none), shown on trigger (display: flex), closed by button/ESC/outer-click
- Implementation: `js/main.js` lines 61-77 (lightbox), lines 216-250 (easter egg)
- Purpose: Detect when page sections enter/leave viewport
- Examples: Recruitment terminal bootstrap, scroll spy navigation
- Pattern: Create observer with threshold, observe target elements, run callback when visible
- Implementation: `js/main.js` lines 128-138 (terminal), lines 190-205 (scroll spy)
- Purpose: Centralize event binding and cleanup
- Examples: Click handlers, keyboard handlers, scroll handlers
- Pattern: Query all target elements, forEach attach listener
- Implementation: `js/main.js` initMobileMenu, initLightbox (lines 12-36, 90-119)

## Entry Points

- Location: `index.html` (repository root)
- Triggers: User navigates to URL or browser refresh
- Responsibilities: 
- Location: `js/main.js` lines 1-7
- Triggers: Browser finishes parsing HTML
- Responsibilities:

## Architectural Constraints

- **Threading:** Single-threaded JavaScript event loop (no Web Workers or async operations)
- **Global state:** No module-level singletons; state is local to function scopes (initMobileMenu, initLightbox, etc.)
- **Circular imports:** None (single HTML file, single CSS file, single JS file - no module imports)
- **DOM Dependency:** All JavaScript depends on specific DOM structure defined in index.html (selectors must match)
- **No API Integration:** Currently no backend communication; api/ directory is empty/reserved
- **Client-side only:** No server-side rendering or dynamic content generation

## Anti-Patterns

### Direct DOM Manipulation Without Abstraction

- Example fix: Create `showModal(element)` and `hideModal(element)` utility functions to replace scattered display property assignments

### Hardcoded Selectors in Multiple Functions

- Example: Create `js/gallery-data.js` with image array, import in main.js instead of building from DOM

### Intersection Observer Created Without Explicit Cleanup

- Example: Add `window.addEventListener('beforeunload', () => observer.disconnect())`

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
