---
last_mapped_commit: 63f2ad5fb842c140afe59fe486169f7da112193b
last_mapped_at: 2026-10-02
---
# Testing Patterns

**Analysis Date:** 2026-10-02

## Test Framework

**Status:** Not implemented

**Current State:**
- No test framework configured (no Jest, Vitest, Mocha, or similar)
- No test runner installed or available
- No test files present in codebase
- No package.json to manage test dependencies

**Suggested Approach for Future Implementation:**
- For vanilla JavaScript frontend: Vitest or Jest with jsdom
- For accessibility testing: Testing Library or Playwright
- For E2E testing: Cypress or Playwright would test the full experience

## Test File Organization

**Current Location:** N/A - no test files exist

**Recommended Pattern (if testing is added):**
- Locate tests co-located with source: `js/main.test.js` next to `js/main.js`
- Naming convention: `*.test.js` or `*.spec.js` (recommend `.test.js` for consistency)
- Structure tests in single file organized by feature section

**Example structure (if implemented):**

```
js/
├── main.js                    # Source code
└── main.test.js              # Tests for main.js
css/
├── style.css                 # Styles
└── style.test.js            # Future CSS-in-JS or computed style tests (not typical)
```

## Test Structure

**Current:** No tests present

**Recommended Structure (if testing is added):**

For a Vitest setup, tests would follow this pattern based on the code organization:

```javascript
describe('Mobile Menu', () => {
  beforeEach(() => {
    // Setup DOM elements
  });

  it('should toggle menu on button click', () => {
    // Test initMobileMenu() behavior
  });

  it('should close menu when link is clicked', () => {
    // Test link click handler
  });

  it('should update aria-expanded attribute', () => {
    // Test accessibility
  });
});

describe('Lightbox', () => {
  beforeEach(() => {
    // Setup gallery items and lightbox DOM
  });

  it('should open lightbox on item click', () => {
    // Test openLightbox() behavior
  });

  it('should navigate between images', () => {
    // Test showNext/showPrev
  });

  it('should close on ESC key', () => {
    // Test keyboard handler
  });
});
```

**Patterns Observed in Code (to test):**
- Event listeners and their handlers
- DOM manipulation (classList, style properties, visibility)
- State management via closures (e.g., `currentIndex` in lightbox)
- Keyboard event handling (ArrowRight, ArrowLeft, Escape, Enter, Space)
- Intersection Observer triggers (recruitment terminal on scroll)
- Timed animations (setTimeout sequences in boot sequence)

## Mocking

**Current Strategy:** N/A - no test framework

**What Would Need Mocking (if testing is added):**

**DOM Elements:**
- Would use jsdom or test library's test container
- Example: `document.getElementById('lightbox')` needs to be mocked DOM element
- Buttons, inputs, and interactive elements need synthetic events

**Browser APIs:**
- `IntersectionObserver` - would be mocked for unit tests, real in E2E tests
- `setTimeout` - would use fake timers (vitest.useFakeTimers())
- `localStorage` - could be mocked if using session storage in future
- `window.matchMedia` - for responsive design testing

**Events:**
- Click events: synthetic `click()` method or `fireEvent.click()`
- Keyboard events: synthetic with KeyboardEvent
- Scroll events: manually trigger visibility detection

**What NOT to Mock:**
- CSS/styling (hard to test in unit tests; use E2E for visual verification)
- DOM structure (use actual markup structure)
- Event propagation (test with real or realistic synthetic events)

## Fixtures and Factories

**Current:** Not used

**Would Be Needed For:**
- Repeatable DOM setups for each test suite
- Gallery item fixtures (image sources, titles, descriptions)
- Sample event objects (click events, keyboard events)

**Recommended Location:** Separate file or helper function

**Example (if implemented):**

```javascript
// utils/test-fixtures.js
export function createMockGalleryItems() {
  return [
    { src: 'img1.jpg', title: 'Operation 1', desc: 'Description' },
    { src: 'img2.jpg', title: 'Operation 2', desc: 'Description' },
  ];
}

export function createMockDOMElement(selector) {
  return document.querySelector(selector) || document.createElement('div');
}
```

## Coverage

**Requirements:** None enforced

**Current Coverage:** 0% - no tests written

**Recommended Coverage Targets (if implemented):**
- Statements: 70%+ (covers main interactive features)
- Branches: 60%+ (keyboard shortcuts, conditional rendering)
- Functions: 75%+ (all event handlers)
- Lines: 70%+ (key paths through code)

**High Priority Features to Test:**
1. Mobile menu toggle and close behavior
2. Lightbox navigation and close actions
3. Scroll spy navigation highlighting
4. Keyboard navigation (arrows, ESC)
5. Intersection Observer trigger for terminal boot

**View Coverage (if implemented):**

```bash
vitest --coverage

# or

jest --coverage
```

## Test Types

**Unit Tests (if implemented):**
- Scope: Individual function behavior in isolation
- Approach: Mock DOM elements, test function logic directly
- Example: Test `showNext()` correctly increments index with modulo wrapping
- Location: `js/main.test.js` with describe blocks per feature
- Focus: Business logic, edge cases, error conditions

**Integration Tests (if implemented):**
- Scope: Multiple components working together (menu + navigation, gallery + lightbox)
- Approach: Set up real DOM structure, trigger real events
- Example: Click gallery item → lightbox opens → keyboard nav works
- Would require: jsdom + event simulation

**E2E Tests (if implemented - recommended):**
- Framework: Cypress or Playwright (better for this use case)
- Scope: Full user workflows from click to visual result
- Example: User clicks hamburger menu → menu opens visually → user clicks nav link → page scrolls
- Verification: Visual, accessibility, page state
- Would be most valuable for this project's interactive features

**Current Testing Approach:**
- Manual testing via browser
- No automated verification

## Common Patterns to Test

**Async Testing (if needed):**
Would use for setTimeout sequences (e.g., recruitment terminal boot sequence that writes messages with delays):

```javascript
// Would test the timing and sequence of writeToConsole calls
it('should write boot sequence messages in order', async () => {
  vi.useFakeTimers();
  // Trigger runBootSequence
  // Verify message 1 written
  vi.advanceTimersByTime(600);
  // Verify message 2 written
  // etc.
  vi.runAllTimers();
});
```

**Event Testing (most common in this codebase):**

```javascript
// Would test click handlers
it('should open lightbox when gallery item is clicked', () => {
  const item = document.querySelector('.gallery-item');
  fireEvent.click(item);
  expect(document.getElementById('lightbox')).toBeVisible();
});

// Would test keyboard events
it('should navigate with arrow keys', () => {
  // Open lightbox first
  fireEvent.keyDown(document, { key: 'ArrowRight' });
  // Verify next image shown
});
```

**Error Testing (guard clauses):**

```javascript
// Would test early returns and guard clauses
it('should not crash if lightbox element missing', () => {
  document.getElementById('lightbox').remove();
  // Trigger lightbox init
  expect(() => initLightbox()).not.toThrow();
});
```

## Missing Test Infrastructure

**What Would Need to Be Set Up:**

1. **Package Manager:** Add `package.json` with scripts:
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:watch": "vitest --watch",
       "test:coverage": "vitest --coverage"
     }
   }
   ```

2. **Test Configuration:** Create `vitest.config.js`:
   ```javascript
   export default {
     environment: 'jsdom',
     globals: true,
   };
   ```

3. **Test Utilities:** Setup file for DOM cleanup and common helpers

4. **CI/CD Integration:** GitHub Actions workflow to run tests on push (if added to repo)

## Current Risk - No Test Coverage

**Untested Behaviors:**
- Mobile menu opening/closing
- Lightbox image navigation
- Keyboard shortcuts (arrows, ESC, Enter, Space)
- Accessibility attribute updates
- Scroll spy highlighting
- Terminal boot sequence timing
- Easter egg overlay

**Potential Issues Without Tests:**
- Regressions when modifying event handlers
- Accessibility breaking silently
- Browser compatibility issues
- Mobile interaction bugs
- Timing issues in animations/sequences

**Recommendations:**
- Add E2E tests with Cypress first (easier setup for vanilla JS, better for this use case)
- Then add unit tests for complex logic like index wrapping in lightbox
- Focus on interactive features and keyboard navigation as highest priority

---

*Testing analysis: 2026-10-02*
