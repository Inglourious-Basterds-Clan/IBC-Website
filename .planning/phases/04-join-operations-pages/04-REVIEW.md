---
phase: 04-join-operations-pages
reviewed: 2026-10-13T00:00:00Z
depth: standard
files_reviewed: 49
files_reviewed_list:
  - eleventy.config.js
  - FACTS.md
  - lib/check-perf.js
  - lib/check-seo.js
  - lib/dates.js
  - lib/discord.js
  - lib/html.js
  - lib/images.js
  - lib/js.js
  - lib/reject-output.js
  - lib/schema.js
  - README.md
  - scripts/clean.js
  - src/_data/discordBadge.js
  - src/_data/join.js
  - src/_data/navigation.js
  - src/_data/operations.js
  - src/_data/site.js
  - src/_includes/layouts/base.njk
  - src/_includes/partials/breadcrumbs.njk
  - src/_includes/partials/head.njk
  - src/_includes/partials/header.njk
  - src/css/partials/pages.css
  - src/css/partials/recruitment.css
  - src/css/style.css
  - src/index.njk
  - src/jak-dolaczyc.njk
  - src/js/main.js
  - src/js/modules/discord-badge.js
  - src/js/modules/hash-redirect.js
  - src/js/modules/terminal.js
  - src/operacje.njk
  - test/build.test.js
  - test/client.test.js
  - test/css.test.js
  - test/devpages.test.js
  - test/discord.test.js
  - test/docs.test.js
  - test/helpers.js
  - test/js-version.test.js
  - test/layout.test.js
  - test/links.test.js
  - test/modules.test.js
  - test/pages.test.js
  - test/perf-gate.test.js
  - test/reject-output.test.js
  - test/schema.test.js
  - test/seo.test.js
  - test/seo-gate.test.js
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-10-13
**Depth:** standard
**Files Reviewed:** 49
**Status:** issues_found

## Summary

I reviewed the Phase 4 diff (`77bc1c5..HEAD`): the `/jak-dolaczyc/` and `/operacje/` pages, breadcrumbs with BreadcrumbList, the FAQ with FAQPage, SEO gate rules G11 and G12, the CR-01 output allow-list, the live Discord badge, the legacy `#recruitment` redirect, the nav changes, and the content-hashed JS module URLs (WR-01).

The security-relevant code is sound:
- The JSON-LD escapes `<`.
- The hash redirect only selects a build-time href, so there is no open redirect.
- The badge writes only through `textContent` and checks the API URL prefix.
- `isDisposableOutput` normalises its input through `path.relative`, so lookalike paths and paths outside the repo are refused.
- G11 and G12 compare visible text with the JSON-LD in both directions.

I found no blockers. The main problems:
1. The live Discord badge brings back a third-party browser request that sends the visitor's IP address. The project removed Google Fonts for exactly this GDPR reason.
2. The new data tests require the draft markers to exist, so following the documented FACTS confirmation steps breaks `npm test`.
3. In-page anchors on the new subpages end up hidden under the fixed header.
4. One CR-01 test runs the real `clean.js` against the repository root.

## Warnings

### WR-01: Live Discord badge sends every home-page visitor's IP address to Discord (GDPR), the same problem that led to removing Google Fonts

**File:** `src/js/modules/discord-badge.js:14-31` (hook in `src/index.njk:138`)
**Issue:** When the badge comes within 200 px of the viewport, the browser calls `fetch('https://discord.com/api/v10/invites/...')` with no consent and no notice. `credentials: 'omit'` and `referrerPolicy: 'no-referrer'` remove cookies and the referrer, but the visitor's IP address, User-Agent and request time still reach a US third party. The project's own research gives this as the reason to drop Google Fonts (`.planning/research/PITFALLS.md:21`, `:489`, "sends visitor IPs to Google (GDPR)"), and Phase 3 self-hosted the font for that reason. The site is aimed at Polish visitors, some of them minors (16+). This module adds back the same kind of transfer on the main landing page. The 04-RESEARCH privacy row (V12/V13) only looks at which response fields are shown, not at the request itself.
**Fix:** Pick one and record it as a decision:
- Drop the client fetch. The build already fetches the count (`src/_data/discordBadge.js`), so the baked text can carry the build-time count (rebuild often or on a schedule).
- Fetch only after a user action, such as a "Pokaż liczbę online" button.
- Keep the fetch, but mention the Discord request in a privacy note (polityka prywatności) and add a link to it in the footer.

The simplest option is to bake the full build-time count and delete the module:
```js
// src/_data/discordBadge.js — bake the exact live count when available, no browser fetch
fallbackText: live ? `${live.members} ${personWord(live.members)}` : fallbackText(site.discord.membersBackstop),
```

### WR-02: Tests require the draft markers to exist, so the documented FACTS confirmation steps break `npm test`

**File:** `test/pages.test.js:139`, `test/pages.test.js:271`, `test/pages.test.js:341`, `test/pages.test.js:345`, `test/pages.test.js:352`
**Issue:** FACTS.md, README.md ("Potwierdzenie = usunięcie linii `draft`") and the comments in `src/_data/join.js` / `operations.js` all say: to confirm a text, delete its `draft` line. Several tests fail when the clan does that:
- `:139` `assert.ok(drafted.length > 0, ...)`: confirming FACTS-04 and FACTS-05 leaves no drafted FAQ entry, and the test fails.
- `:271` `assert.ok(operations.evening.draft, "the evening times must stay marked until confirmed")`: confirming FACTS-07 fails it.
- `:341` requires every recap to have a `draft` marker: confirming FACTS-10..13 fails it. A new recap added by following README "Nowa relacja z operacji" (steps 1–3 never mention `draft`) also fails it.
- `:352` requires `lastUpdate.draft`: confirming FACTS-09 fails it.
- `:345` `recap.date < operations.lastUpdate.date` is strict. README step 3 says to set `lastUpdate.date` to today, so a recap of today's operation fails the test.

The marker system is supposed to unblock the indexable build once the texts are confirmed. Instead, confirming them breaks the test suite, and the `if ("draft" in entry)` style used at `:98` shows the intended shape.
**Fix:** Check markers only when they are present, and allow equal dates:
```js
// :139 — drop the "> 0" assertion; iterate drafted entries only
// :271
if (operations.evening.draft) assert.ok(evening.includes(`<!-- ${operations.evening.draft} -->`), ...);
// :341
if ("draft" in recap) assert.match(recap.draft, /^TODO\(FACTS-\d+\)$/, ...);
// :345
assert.ok(recap.date <= operations.lastUpdate.date, ...);
// :352
if ("draft" in operations.lastUpdate) assert.match(operations.lastUpdate.draft, /^TODO\(FACTS-\d+\)$/, ...);
```
The same applies to the per-card check at `:396` (`card.raw.includes(\`<!-- ${recap.draft} -->\`)` with `recap.draft` undefined looks for `<!-- undefined -->`) and the check at `:406`.

### WR-03: Subpage anchors scroll under the fixed header, and FAQ deep links stay collapsed

**File:** `src/css/partials/pages.css:59-61`, `src/jak-dolaczyc.njk:18,27,36,40`, `src/operacje.njk:17-63`, `src/_data/join.js:42-43`
**Issue:** The new pages add anchor targets: `#wymagania`, `#kroki`, `#faq`, one per FAQ entry (`join.js` says "An id is the anchor a recruiter can link to (/jak-dolaczyc/#mody)"), and `#harmonogram` … `#relacje` on `/operacje/`. The header is `position: fixed` (79 px high, 99 px on mobile), and no stylesheet sets `scroll-margin-top` or `scroll-padding-top` (grep finds none). On the home page, each target is a `section` with 100 px top padding, which hides the problem. The new targets are `.page-block` (only a 48 px top margin) and `details.faq-item`, so following `/jak-dolaczyc/#mody` puts the question under the header. The fragment also points at the `<details>` element itself, so the browser does not open it (auto-expand applies only to targets inside a closed `<details>`). A recruiter's link therefore shows a hidden or collapsed question.
**Fix:**
```css
/* pages.css */
.page-block,
.faq-item {
  scroll-margin-top: 100px;
}
@media (max-width: 768px) {
  .page-block,
  .faq-item {
    scroll-margin-top: 120px;
  }
}
```
To open the linked question, add a small `data-js` module (or extend `hash-redirect`) that sets `open = true` on a `details.faq-item` whose id matches `location.hash`. The other option is to state in `join.js` that the id only scrolls to the question.

### WR-04: CR-01 test runs the real `clean.js` against the repository root and its parent

**File:** `test/reject-output.test.js:246-253`
**Issue:** `runClean(".")` and `runClean("..")` run `scripts/clean.js` against the real working tree. The block comment just above (`:214-215`) says "Never pass src, .git or lib to the real clean.js", but the repo root contains all three. The test exists to catch a regression in `isDisposableOutput`. If that regression happens, the test does `rmSync(repoRoot, { recursive: true, force: true })` and deletes the whole working copy, including `.git` and uncommitted work, before its `package.json` check reports anything. In this file, a test that should only fail would destroy data instead.
**Fix:** Run the refusal check on a disposable copy. `clean.js` takes its repo root from its own location, so copying it and its import into a temp root is enough:
```js
test("clean.js still refuses the repo root and its parent", () => {
  const fakeRoot = makeFakeRoot();
  try {
    mkdirSync(join(fakeRoot, "scripts")); mkdirSync(join(fakeRoot, "lib"));
    copyFileSync(join(repoRoot, "scripts/clean.js"), join(fakeRoot, "scripts/clean.js"));
    copyFileSync(join(repoRoot, "lib/reject-output.js"), join(fakeRoot, "lib/reject-output.js"));
    writeFileSync(join(fakeRoot, "package.json"), '{"type":"module"}');
    for (const target of [".", ".."]) {
      const result = spawnSync(process.execPath, ["scripts/clean.js", target], { cwd: fakeRoot, encoding: "utf8" });
      assert.equal(result.status, 1);
    }
    assert.ok(existsSync(join(fakeRoot, "package.json")));
  } finally {
    rmSync(fakeRoot, { recursive: true, force: true });
  }
});
```

## Info

### IN-01: The `/operacje/` schedule and the "Typowy wieczór" timeline disagree

**File:** `src/_data/operations.js:11`, `src/_data/operations.js:50-63`
**Issue:** The schedule says "Misje startują o 19:00 i trwają zwykle 2–3 godziny". The timeline starts the briefing at 19:00 and the mission at 19:15 ("zwykle 2–3 godziny"), then puts the debriefing at "ok. 21:30". A 3-hour mission from 19:15 ends at 22:15. `src/_data/join.js:69` and the home stat card ("19:00 Start misji w weekendy") repeat the 19:00 start. The timeline is drafted (FACTS-07), so it cannot ship to an indexable build as it is, but the clan reviewer should see this conflict.
**Fix:** Add the conflict to the FACTS-07 row so the clan settles it, for example "19:00 odprawa, 19:15 start misji" in every place, or "ok. 21:30–22:15" for the debriefing.

### IN-02: `overflow: hidden` on recap cards clips the `.hud-border` corner brackets

**File:** `src/css/partials/pages.css:243-247`
**Issue:** `.hud-border::before/::after` sit at `top/left: -1px` and `bottom/right: -1px` with 2 px strokes (`components.css:29-39`), so half of each bracket lies over the border. `overflow: hidden` clips everything outside the padding box, so the recap cards show thinner brackets than every other `.hud-border` card.
**Fix:** Remove `overflow: hidden` from `.recap-card`. The image is already `width: 100%` with `object-fit: cover`, so it does not need the clip. If the clip is needed, use `overflow: clip; overflow-clip-margin: 2px;`.

### IN-03: Module versioning (WR-01) only covers `import()` calls in `main.js`, and no test enforces that

**File:** `src/js/main.js:9-18`, `test/js-version.test.js:87-95`
**Issue:** The `?v=` query only reaches modules that `main.js` loads through its loader map. A future static `import { writeToConsole } from './terminal.js'` inside a module (for example, so `easter-egg.js` can stop duplicating the terminal-line code) would load without the version and could be served stale from cache, which brings back the mixed-version bug WR-01 fixed. Today no module imports another one, but no test checks this.
**Fix:** In `test/js-version.test.js`, assert that no file under `src/js/modules/` has an `import` statement or an `import(` call. Alternatively, document that shared code must be passed through `init()` instead of imported.

### IN-04: An exception in the G12 text helpers skips the rejection path and leaves `_site/` in place

**File:** `lib/html.js:44-46` (called from `lib/check-seo.js:300,325-326`)
**Issue:** `String.fromCodePoint(Number(dec))` throws a `RangeError` for a numeric entity above U+10FFFF (for example `&#99999999;` in page text). `checkSite` runs outside any try/catch in `scripts/check-seo.js:47`. The CLI therefore crashes with a stack trace and exit code 1 before `removeRejectedOutput` runs, so the bad `_site/` stays in place. That breaks the CR-02 promise that a rejected build leaves nothing deployable. Phase 4 adds this path: G11 and G12 now run `visibleText` on every page.
**Fix:** Clamp the code point in `visibleText` (`const cp = Number(dec); return cp <= 0x10ffff ? String.fromCodePoint(cp) : "�";`, and the same for hex). Also wrap `checkSite` in the CLI so any thrown error counts as a problem and goes through `removeRejectedOutput`.

---

_Reviewed: 2026-10-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
