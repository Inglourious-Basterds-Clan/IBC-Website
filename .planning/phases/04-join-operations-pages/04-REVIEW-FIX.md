---
phase: 04-join-operations-pages
fixed_at: 2026-10-13T00:00:00Z
review_path: .planning/phases/04-join-operations-pages/04-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 3
skipped: 1
status: partial
---

# Phase 4: Code Review Fix Report

**Fixed at:** 2026-10-13
**Source review:** .planning/phases/04-join-operations-pages/04-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (fix scope: critical + warning; IN-01..IN-04 not in scope)
- Fixed: 3
- Skipped: 1

## Fixed Issues

### WR-02: Tests require the draft markers to exist, so the documented FACTS confirmation steps break `npm test`

**Files modified:** `test/pages.test.js`
**Commit:** 7c062f4
**Applied fix:** Draft markers are now checked only while they exist, at every site the review named:
- The FAQ marker test no longer requires at least one drafted entry.
- The `operations.evening.draft` marker check runs only when the marker is present.
- `recap.draft` and `lastUpdate.draft` are validated with `if ("draft" in …)`.
- The rendered-comment checks for recap cards and "Ostatnia aktualizacja" are guarded.
- `recap.date < lastUpdate.date` is now `<=`, so a recap of today's operation passes.

The confirmed state still gets checked. A confirmed FAQ entry or recap card must not keep a `<!-- TODO(FACTS-NN) -->` comment. The recap data test title also no longer says "drafted".

### WR-03: Subpage anchors scroll under the fixed header, and FAQ deep links stay collapsed

**Files modified:** `src/css/partials/pages.css`, `src/_data/join.js`
**Commit:** fc8a99d
**Applied fix:** Added `scroll-margin-top` to `.page-block` and `.faq-item`: 100px on desktop, and 120px in the partial's existing `max-width: 768px` block. These match the breadcrumb clearance for the 79/99 px fixed header.

The review offered two ways to handle the collapsed FAQ. I did not add JS to auto-open the linked `<details>`, because locked decision D-04 says the FAQ is a native accordion with no JS. Instead I took the review's other option and documented in `join.js` that an FAQ id only scrolls to the question and the accordion stays closed. If the owner wants deep links to open the question, that needs a D-04 change (a small `data-js` module) or moving the id onto the answer `<p>`.

Status: fixed, requires human verification. The scroll offset is visual and should be checked in a browser at `/jak-dolaczyc/#mody` and `/operacje/#relacje`, on desktop and mobile.

### WR-04: CR-01 test runs the real `clean.js` against the repository root and its parent

**Files modified:** `test/reject-output.test.js`
**Commit:** 595317e
**Applied fix:** The root-refusal test now copies `scripts/clean.js` and `lib/reject-output.js` into a throwaway temp tree and runs them from there. It also writes a `{"type":"module"}` `package.json`. Because `clean.js` takes its repo root from its own location, it never sees the real working copy.

One change from the review's suggestion: the copy sits one level down (`<tmp>/ibc-cr01-XXXX/repo`). That way `..` also points inside the throwaway folder, so a regression could not delete the OS temp dir either. The real-repo `runClean` helper is kept only for the `.cache/` and `_test/` fixtures, which are safe.

## Skipped Issues

### WR-01: Live Discord badge sends every home-page visitor's IP address to Discord (GDPR), the same problem that led to removing Google Fonts

**File:** `src/js/modules/discord-badge.js:14-31` (hook in `src/index.njk:138`)
**Reason:** Skipped because this needs an owner decision. The review itself says "Pick one and record it as a decision" (bake-only, click-to-load, or keep the fetch with a privacy note). The browser fetch is how locked decisions D-15 and D-16 are implemented, and threat T-04-10 accepted it as "mitigate". It is also still an open human item: 04-UAT.md item 3 and 04-VERIFICATION.md mark it "owner decision". The bake-only option would delete the module and change about a dozen tests (`discord.test.js`, `modules.test.js`, `docs.test.js`) plus the README. The fixer should not make that call against a locked decision.
**Original issue:** When the badge comes within 200 px of the viewport, the browser fetches the Discord invite API with no consent and no notice. The visitor's IP address, User-Agent and request time reach a US third party. This is the same kind of transfer that led the project to self-host its fonts instead of using Google Fonts.

## Verification

- Every fix was checked by re-reading the changed code. `node --check` passed on each changed JS file.
- Fixes were edited and committed in an isolated git worktree (`.claude/worktrees/rf-04-…`, branch `gsd-reviewfix/04-…`). `main` was then fast-forwarded to 595317e, and the worktree and temp branch were removed.
- Inside the worktree I ran the WR-04 test alone (`node --test --test-name-pattern="refuses the repo root" test/reject-output.test.js`), and it passed.
- **I ran the full `npm test` in the main checkout after the fast-forward: 430 tests, 430 passed, 0 failed (exit 0).** The main checkout also has unrelated uncommitted edits in other test files (`test/deps|facts|fonts|icons|images|seo-assets|seo-files|workflow.test.js`). That run included those edits. None of my commits touch those files.
- `.planning/config.json` (unrelated uncommitted change) was not staged or committed.

---

_Fixed: 2026-10-13_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
