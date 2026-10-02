---
last_mapped_commit: 63f2ad5fb842c140afe59fe486169f7da112193b
last_mapped_at: 2026-10-02
---
# Codebase Structure

**Analysis Date:** 2026-10-02

## Directory Layout

```
IBC-Website/
├── .git/                  # Git repository metadata
├── .planning/
│   └── codebase/          # GSD codebase documentation (this directory)
│       ├── ARCHITECTURE.md
│       └── STRUCTURE.md
├── api/                   # Reserved for backend API integration (currently empty)
├── assets/                # Static image files
│   ├── cos.png            # Gallery image: observation point
│   ├── funny.png          # Gallery image: humorous moment
│   ├── hero-bg.jpg        # Hero section background
│   ├── hero.jpg           # Hero section image
│   ├── jo_1967.png        # Gallery image: operation Crimson Dawn
│   ├── logo.png           # Clan logo (48x48 PNG)
│   ├── op_patrol.jpg      # Gallery image: patrol operation
│   ├── patrol.jpg         # Additional patrol image
│   └── sniper.jpg         # Sniper/tactical image
├── css/
│   └── style.css          # All page styling (single CSS file, ~800+ lines)
├── js/
│   └── main.js            # All page interactivity (single JS file, ~260 lines)
├── index.html             # Single-page application root HTML
└── LICENSE                # Project license file
```

## Directory Purposes

**`.git/`:**
- Purpose: Version control metadata
- Contains: Commit history, branch information, git configuration
- Key files: `.git/config`, `.git/HEAD`, `.git/objects`

**`.planning/codebase/`:**
- Purpose: GSD (Getting Shit Done) documentation for codebase analysis
- Contains: Architecture and structure reference documents for development planning
- Key files: `ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `TESTING.md` (as created)

**`api/`:**
- Purpose: Reserved for future backend API integration
- Contains: Currently empty
- Notes: Placeholder directory for server-side code when backend is added

**`assets/`:**
- Purpose: Store static image assets used on the page
- Contains: PNG and JPG images (logo, hero background, gallery photos)
- Key files:
  - `logo.png` - Clan logo (dimensions: 48x48, used in header navigation)
  - `hero-bg.jpg` - Hero section background image
  - `hero.jpg` - Alternative hero section image
  - Gallery images: `op_patrol.jpg`, `jo_1967.png`, `cos.png`, `funny.png`, `patrol.jpg`, `sniper.jpg`

**`css/`:**
- Purpose: Centralize all page styling
- Contains: Single CSS file with complete design system
- Key sections in `style.css`:
  - CSS custom properties (colors, fonts, transitions) - lines 1-35
  - Base/reset styles - lines 38-90
  - Typography - lines 93+
  - Layout components (header, hero, sections, footer)
  - Responsive design (mobile breakpoints)
  - Tactical/HUD visual effects (scanlines, glows, grid backgrounds)

**`js/`:**
- Purpose: Centralize all client-side JavaScript functionality
- Contains: Single JavaScript file with modular initialization functions
- Key functions in `main.js`:
  - `initMobileMenu()` - Mobile navigation toggle (lines 12-36)
  - `initLightbox()` - Gallery image viewer (lines 43-120)
  - `initRecruitmentTerminal()` - Terminal simulation (lines 122-139)
  - `runBootSequence()` - Terminal text output (lines 141-181)
  - `initScrollSpy()` - Active nav highlighting (lines 183-206)
  - `initEasterEgg()` - Hidden console trigger (lines 208-259)

## Key File Locations

**Entry Points:**
- `index.html` - Main single-page application file (297 lines)
  - Contains full semantic HTML structure
  - Loads CSS stylesheet via `<link>` tag
  - Loads JavaScript via `<script>` tag at end of body
  - Defines all page sections: header, hero, about, gallery, recruitment, footer

**Configuration:**
- CSS variables defined in `css/style.css` root selector (lines 4-35)
  - Color scheme: `--bg-primary`, `--accent-color`, `--text-primary`, etc.
  - Typography: `--font-hud`, `--font-body`
  - Transitions: `--transition-speed`
- No external configuration files (.env, config.json, etc.)

**Core Logic:**
- `js/main.js` - All interactivity logic (260 lines)
  - DOMContentLoaded event handler calls all initialization functions
  - Each feature isolated in its own init function
  - Event listeners attached to specific DOM selectors
  - Modal and menu state managed via class toggling and inline styles

**Styling:**
- `css/style.css` - Complete design system (800+ lines)
  - Responsive grid layout with CSS Grid and Flexbox
  - Dark tactical theme with accent gold/sand colors
  - Mobile-first approach with media queries
  - Tactical effects: scanlines, grid backgrounds, glows

**Testing:**
- No automated tests present
- No test directory or test files
- Testing would be manual or browser-based

## Naming Conventions

**Files:**

- **HTML:** Single file `index.html` - standard convention for SPAs
- **CSS:** Single file `style.css` - monolithic approach (all styles in one file)
- **JavaScript:** Single file `main.js` - monolithic approach (all functionality in one file)
- **Images:** Descriptive lowercase names with hyphens: `hero-bg.jpg`, `op_patrol.jpg`, `jo_1967.png`

**Directories:**

- **Lowercase with no hyphens:** `css`, `js`, `assets`, `api` - standard web project convention
- **Dot-prefix for hidden:** `.git`, `.planning` - standard convention for metadata/config directories

**CSS Classes:**

- **BEM-inspired:** `.gallery-item`, `.gallery-overlay`, `.lightbox-content`, `hud-border`, `hud-badge`
- **State classes:** `.active`, `.active-nav`, `.open` - indicate dynamic state
- **Utility classes:** `.hidden`, `hud-btn`, `hud-border` - reusable styling

**CSS IDs:**

- **Page sections:** `#hero`, `#about`, `#gallery`, `#recruitment`
- **Components:** `#lightbox`, `#terminal-console`, `#mobile-nav`, `#decryption-overlay`
- **Interactive elements:** `#easteregg-trigger`, `#decryption-close`

**JavaScript Functions:**

- **camelCase:** `initMobileMenu`, `openLightbox`, `updateLightboxContent`, `showNext`, `closeLightbox`
- **init prefix:** All main feature functions start with `init` (initMobileMenu, initLightbox, etc.)
- **descriptive names:** Function names describe their purpose clearly

**JavaScript Variables:**

- **camelCase for variables:** `booted`, `currentIndex`, `imageSources`, `consoleEl`, `navLinks`
- **const for constants:** Query selectors and configuration values
- **let for mutable:** Loop iterators, state variables within functions

## Where to Add New Code

**New Feature/Component:**
- If minimal (< 50 lines of JS): Add function to `js/main.js`, call in DOMContentLoaded
- If complex: Consider creating `js/feature-name.js` and importing it in index.html
- Add corresponding HTML sections to `index.html`
- Add styling to `css/style.css` (or create `css/feature-name.css` if substantial)

**New Styling:**
- If feature-specific: Add to relevant section in `css/style.css`
- If complex/large: Consider creating `css/feature-name.css` and linking in `index.html` `<head>`
- Always use CSS custom variables for colors (`var(--accent-color)`) not hardcoded values

**New Page Section:**
- Add semantic HTML section to `index.html` with appropriate id attribute
- Create `.section-container` wrapper div (pattern used in about, gallery, recruitment)
- Add section-specific CSS to `css/style.css` using class selectors
- Add initialization function to `js/main.js` if interactivity needed
- Add navigation link to header nav list

**New Gallery Image:**
- Add PNG/JPG to `assets/`
- Add `gallery-item` div to gallery grid in `index.html` with:
  - `data-src="assets/image-name.jpg"` attribute
  - Image `<img>` tag with `loading="lazy"`
  - `.gallery-overlay` div with `<h3>` title and `<p>` description
- No JavaScript changes needed - existing lightbox handles dynamically

**New Modal/Overlay:**
- Pattern: Create container div with id, hidden by default (display: none)
- Add trigger element (button or clickable element) with click handler
- Create init function in `js/main.js` to attach event listeners
- Use pattern from lightbox and easter egg (e.g., close on button, ESC key, outer click)
- CSS: Use `.lightbox` pattern as template for styling

## Special Directories

**`api/` (Empty/Reserved):**
- Purpose: Placeholder for backend API integration
- Generated: No (manually created directory)
- Committed: Yes (exists in repository)
- Notes: Currently unused; prepare when backend service needed

**`assets/` (Static Resources):**
- Purpose: Store all image files referenced in HTML
- Generated: No (manually created during design)
- Committed: Yes (all images tracked in git)
- Notes: Images use relative paths in HTML (`assets/image.jpg`)

**`.planning/` (Documentation):**
- Purpose: GSD workflow documentation and planning
- Generated: Partially (created by GSD tools)
- Committed: Yes (documentation tracked in git)
- Notes: Read-only for development; updated by planning tools

---

*Structure analysis: 2026-10-02*
