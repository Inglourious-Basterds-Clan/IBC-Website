---
last_mapped_commit: 498f19eefca8ec513547073c1d87eb4bb2a09b7d
last_mapped_at: 2026-10-13
---
# Coding Conventions

**Analysis Date:** 2026-10-13

Eleventy 3 static site, ESM throughout (`"type": "module"` in `package.json`), Node >= 22.19 (`.nvmrc`). Note: the conventions section of `.claude/CLAUDE.md` describes the pre-migration single-file site and is stale; follow this document.

## Naming Patterns

**Files:**
- kebab-case everywhere: `lib/check-seo.js`, `lib/image-size.js`, `src/js/modules/scroll-spy.js`, `src/_includes/partials/discord-cta.njk`
- Pages are Polish slugs as `.njk`: `src/jak-dolaczyc.njk`, `src/operacje.njk`; permalinks set in front matter (`permalink: /jak-dolaczyc/`)
- Generated non-HTML outputs use `<name>.<ext>.njk`: `src/robots.txt.njk`, `src/sitemap.xml.njk`, `src/site.webmanifest.njk`, `src/web.config.njk`
- Tests: `test/<area>.test.js` (`test/seo-gate.test.js`); shared helpers in `test/helpers.js`
- CLI wrappers in `scripts/` share names with their rule modules in `lib/` (`scripts/check-seo.js` -> `lib/check-seo.js`)

**Functions:**
- camelCase, verb-first: `formatPlDate`, `inviteApiUrl`, `floorCount`, `checkSite`, `removeRejectedOutput`, `buildSchemaGraph`, `renderIcon`
- Client feature modules export a single `init(el)` (`src/js/modules/menu.js`)

**Variables:**
- camelCase; module-level constants are also camelCase (`localUrl`, `nonIndexableUrls`, `inviteApiBase` in `lib/discord.js`), not SCREAMING_CASE
- DOM suffixes `El`, `Btn` (`consoleEl`)

**Types:**
- No TypeScript, no JSDoc types. Contracts described in plain `//` comments above functions.

**CSS:**
- kebab-case classes, component-prefixed (`.discord-badge-members`, `.page-block`, `.req-list`); state classes `.active`, `.open`
- Custom properties in `:root` (`src/css/partials/base.css`)
- JS hooks use `data-js="<feature>"` attributes, never classes (`data-js="discord-badge"`)

## Code Style

**Formatting:**
- No formatter/linter config (no Prettier, ESLint, EditorConfig). Match surrounding file.
- 2-space indent, semicolons, trailing commas in multi-line literals in Node code
- Quotes split by layer:
  - Node/build code (`lib/`, `scripts/`, `test/`, `eleventy.config.js`, `src/_data/`): double quotes
  - Browser code (`src/js/`): single quotes, no trailing commas (`src/js/main.js`)
- Template literals for interpolated messages
- LF line endings in the repo; tests normalise `\r\n` when reading text (`test/workflow.test.js`)

**Linting:**
- None. Correctness enforced by the `node:test` suite and the post-build gates (`scripts/check-seo.js`, `scripts/check-perf.js`).

## Import Organization

**Order:**
1. Node built-ins with `node:` prefix (`import { readFileSync } from "node:fs";`)
2. Third-party (`@11ty/eleventy`, `@11ty/eleventy-img`, `lightningcss`)
3. Local modules via relative paths with `.js` extension (`../lib/seo.js`, `./helpers.js`)

**Path Aliases:**
- None. Use relative paths; compute repo paths with `fileURLToPath(new URL("..", import.meta.url))` (`test/helpers.js`, `scripts/check-seo.js`).

**Client modules:**
- `src/js/main.js` is the only `<script type="module">`; it lazy-loads features from a frozen loader map keyed by `data-js` names. Add new features as `src/js/modules/<name>.js` exporting `init(el)` and register a literal specifier in `loaders` (`'./modules/<name>.js' + version`). Never build a specifier from attribute text.

## Error Handling

**Patterns:**
- Build-time code fails loudly: validate input and `throw new Error(...)` with a message that includes the bad value (`lib/dates.js`, `lib/discord.js`, `lib/icons.js`, `lib/schema.js`, `lib/woff2.js`). A typo must fail the build, not ship.
- Config guards at import time: `src/_data/site.js` throws if `SITE_URL` is blank in a production build (override with `ALLOW_LOCAL_SITE_URL=1` for local/test builds only)
- Network is the exception: `fetchInviteCounts` in `lib/discord.js` never throws or logs, so Discord can never break the build; `DISCORD_FETCH=0` disables it
- Gate scripts collect problems into an array, print each to stderr prefixed `check-seo: ` / `check-perf: `, then `process.exit(1)` and move the output to `<dir>.rejected` (`lib/reject-output.js`)
- Client modules use guard clauses (`if (!el) return;`) and never throw
- `try { ... } catch { ... }` without binding when the error is unused (`src/_data/site.js`)

## Logging

**Framework:** `process.stdout.write` / `process.stderr.write` in `scripts/` only.

**Patterns:**
- Prefix every line with the tool name (`check-seo: LOCAL build (...)`)
- No `console.*` in `lib/` or `src/js/`; the recruitment terminal UI writes its own lines (`src/js/modules/terminal.js`)

## Comments

**When to Comment:**
- Every file opens with a header comment: what it is, where it runs ("Build-time code outside src/"), and which requirement/decision IDs it implements
- Reference planning IDs inline: requirement IDs (`SEO-08`, `CONT-07`), decisions (`D-14`), review findings (`CR-01`, `WR-03`, `IN-02`), pitfalls (`Pitfall 11`). Keep this practice so tests and code trace back to `.planning/`.
- Explain the why and examples of input -> output (`// 246 -> 200, 99 -> 90, 9 -> 9.`)
- Section headers `/* --- NAME --- */` in client JS, CSS and long test files

**JSDoc/TSDoc:**
- Not used.

## Function Design

**Size:** Small pure helpers in `lib/` (5-25 lines); gate rule modules (`lib/check-seo.js`, `lib/check-perf.js`) are the large files (~520 lines).

**Parameters:** Pass config explicitly (`checkSite(outDir, site)`) rather than reading globals, so tests can inject fixture configs. Options objects with destructured defaults are fine (`createBadge(apiUrl, { members, online } = {})`).

**Return Values:** Pure functions return values; validators return arrays of problem strings; client `init` returns nothing.

## Module Design

**Exports:** Named exports in `lib/` and client modules. Default export only for Eleventy config (`eleventy.config.js`) and `_data` files (`src/_data/site.js`).

**Single source of truth:** Shared logic lives once in `lib/` and is imported by both Eleventy and the gates/tests (`lib/seo.js` `isIndexableUrl`, `lib/html.js` re-exported by `test/helpers.js`). Site URL, path prefix and Discord invite come only from `src/_data/site.js`.

**Barrel Files:** Not used.

**Dependencies:** Keep devDependencies minimal and pinned (`package.json`; `test/deps.test.js` enforces). Prefer Node built-ins.

---

*Convention analysis: 2026-10-13*
