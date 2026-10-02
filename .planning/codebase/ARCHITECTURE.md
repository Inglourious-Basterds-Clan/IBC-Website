---
last_mapped_commit: 63f2ad5fb842c140afe59fe486169f7da112193b
last_mapped_at: 2026-10-02
---
<!-- refreshed: 2026-10-02 -->

# Architecture

**Analysis Date:** 2026-10-02

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                   HTML Structure Layer                       │
│              `index.html` - Single Page Document             │
│  Header | Hero | About | Gallery | Recruitment | Footer     │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   CSS Layer  │ │ JavaScript   │ │   Assets     │
│ `css/        │ │ `js/main.js` │ │ `assets/`    │
│  style.css`  │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│  DOM Selectors & │      │  Event Listeners │
│  Event Handling  │      │  (Click, Scroll, │
│  `js/main.js`    │      │   Keyboard)      │
└──────────────────┘      └──────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│    User-Visible Updates & Interactions  │
│  (Modal displays, navigation, scrolling)│
└─────────────────────────────────────────┘
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

**Overall:** Vanilla JavaScript Event-Driven Single Page Application (SPA)

**Key Characteristics:**
- No framework dependencies (pure vanilla JS)
- DOM-based state management (visibility classes and inline styles)
- Event listener attachment on DOMContentLoaded
- Modular initialization functions for each feature
- Responsive design with mobile-first approach
- Dark tactical HUD-inspired visual theme

## Layers

**HTML Structure Layer:**
- Purpose: Define semantic page structure with sections for hero, about, gallery, recruitment
- Location: `index.html` (root)
- Contains: Navigation header, main content sections, footer, modal containers
- Depends on: CSS for styling, JavaScript for interactivity
- Used by: Browser renders to display page content

**CSS Visual Layer:**
- Purpose: Apply dark tactical theme, responsive layout, animations, and visual effects
- Location: `css/style.css`
- Contains: CSS variables for colors, typography, grid backgrounds, scanline effects, component styling
- Depends on: Google Fonts for typefaces (Inter, Montserrat, Share Tech Mono)
- Used by: HTML elements through class/id selectors

**JavaScript Interactivity Layer:**
- Purpose: Handle user interactions and manage modal/menu states
- Location: `js/main.js`
- Contains: Five initialization functions for different features, event handlers
- Depends on: DOM structure from index.html
- Used by: Browser executes on DOMContentLoaded event

## Data Flow

### Primary Page Load Path

1. **Browser loads HTML** (`index.html` root)
2. **CSS applies styling** (`css/style.css` linked in `<head>`)
3. **DOMContentLoaded fires** (browser event)
4. **JavaScript initializes** (`js/main.js` script at end of `<body>`)
   - initMobileMenu() - Attaches click handlers to menu toggle
   - initLightbox() - Builds image data array, attaches click/keyboard handlers to gallery items
   - initRecruitmentTerminal() - Sets up IntersectionObserver for recruitment section
   - initScrollSpy() - Sets up IntersectionObserver for navigation sections
   - initEasterEgg() - Attaches click/keyboard handlers to version number trigger
5. **Page is interactive** - User can click, scroll, navigate

### Lightbox Gallery Flow

1. User clicks gallery item (`gallery-item` div, `js/main.js:91`)
2. Click handler calls `openLightbox(index)` (`js/main.js:61`)
3. Function updates image src and caption from `imageSources` array
4. Lightbox container display set to 'flex' to show modal
5. User can navigate with prev/next buttons or arrow keys
6. Close button, outer click, or Escape key closes modal

### Recruitment Terminal Flow

1. Page scrolls into view of recruitment section
2. IntersectionObserver detects section (threshold 0.3)
3. `runBootSequence(consoleEl)` called (`js/main.js:141`)
4. Text output added to terminal with timestamps and status tags
5. Console auto-scrolls to show new messages
6. Terminal runs once per page load (booted flag prevents repeat)

### Mobile Menu Flow

1. User clicks hamburger menu toggle button
2. Click handler toggles `active` class on nav list
3. CSS rule displays/hides mobile menu based on class
4. When nav link clicked, menu closes automatically
5. Overflow hidden on body prevents background scroll when menu open

**State Management:**
- Local variables in JavaScript functions (closures maintain state)
- DOM class attributes for CSS-driven visibility (menu-toggle.open, nav.active)
- Inline style property manipulation (display, overflow)
- Single boolean flag for terminal bootstrap sequence (booted)

## Key Abstractions

**Modal Windows:**
- Purpose: Display fullscreen overlays for user interactions
- Examples: Lightbox gallery viewer, Easter egg decryption console
- Pattern: Hidden by default (display: none), shown on trigger (display: flex), closed by button/ESC/outer-click
- Implementation: `js/main.js` lines 61-77 (lightbox), lines 216-250 (easter egg)

**IntersectionObserver Pattern:**
- Purpose: Detect when page sections enter/leave viewport
- Examples: Recruitment terminal bootstrap, scroll spy navigation
- Pattern: Create observer with threshold, observe target elements, run callback when visible
- Implementation: `js/main.js` lines 128-138 (terminal), lines 190-205 (scroll spy)

**Event Listener Wrapper:**
- Purpose: Centralize event binding and cleanup
- Examples: Click handlers, keyboard handlers, scroll handlers
- Pattern: Query all target elements, forEach attach listener
- Implementation: `js/main.js` initMobileMenu, initLightbox (lines 12-36, 90-119)

## Entry Points

**index.html (Page Load):**
- Location: `index.html` (repository root)
- Triggers: User navigates to URL or browser refresh
- Responsibilities: 
  - Render semantic HTML structure
  - Load CSS stylesheet
  - Load JavaScript module
  - Display initial page content (hero section)
  - Define modals and footer

**js/main.js DOMContentLoaded:**
- Location: `js/main.js` lines 1-7
- Triggers: Browser finishes parsing HTML
- Responsibilities:
  - Initialize all interactive components
  - Attach event listeners
  - Set up observers
  - Prepare page for user interaction

## Architectural Constraints

- **Threading:** Single-threaded JavaScript event loop (no Web Workers or async operations)
- **Global state:** No module-level singletons; state is local to function scopes (initMobileMenu, initLightbox, etc.)
- **Circular imports:** None (single HTML file, single CSS file, single JS file - no module imports)
- **DOM Dependency:** All JavaScript depends on specific DOM structure defined in index.html (selectors must match)
- **No API Integration:** Currently no backend communication; api/ directory is empty/reserved
- **Client-side only:** No server-side rendering or dynamic content generation

## Anti-Patterns

### Direct DOM Manipulation Without Abstraction

**What happens:** Each feature function directly queries, modifies, and styles DOM elements inline
**Why it's wrong:** Hard to test, scattered concerns, brittle selectors, style logic mixed with behavior
**Do this instead:** Abstract common patterns (like modal opening/closing) into reusable helper functions
- Example fix: Create `showModal(element)` and `hideModal(element)` utility functions to replace scattered display property assignments

### Hardcoded Selectors in Multiple Functions

**What happens:** Gallery image sources built from hardcoded data attribute and innerText selectors
**Why it's wrong:** If HTML structure changes, selectors break; maintainability suffers
**Do this instead:** Pass configuration objects or export gallery data structure from data layer
- Example: Create `js/gallery-data.js` with image array, import in main.js instead of building from DOM

### Intersection Observer Created Without Explicit Cleanup

**What happens:** Observers created in initRecruitmentTerminal and initScrollSpy but never disconnected
**Why it's wrong:** Memory leak if script runs multiple times; observers keep running in background
**Do this instead:** Store observer reference, add cleanup function, call on page unload
- Example: Add `window.addEventListener('beforeunload', () => observer.disconnect())`

---

*Architecture analysis: 2026-10-02*
