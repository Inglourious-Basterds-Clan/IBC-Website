---
phase: quick-261008-vmd
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tools/seo-images/package.json
  - tools/seo-images/package-lock.json
  - test/seo-assets.test.js
autonomous: false
requirements: [T-02-ADV-01]  # 02-SECURITY.md follow-up "Vet and pin sharp >= 0.35.5"; no REQUIREMENTS.md ID applies to a tool dependency bump

estimate:
  tokens: 25000
  raw_tokens: 25000
  tasks: 2
  confidence: low

must_haves:
  truths:
    - "A human approved sharp@0.35.5 (lovell/sharp, approved integrity) in this session before anything was installed (T-vmd-SC)"
    - "`npm --prefix tools/seo-images audit` exits 0 and reports found 0 vulnerabilities, so GHSA-wq5f-xc86-pv6w / CVE-2026-96889 is closed"
    - "tools/seo-images/package.json pins sharp exactly to \"0.35.5\" with no caret or tilde"
    - "tools/seo-images/package-lock.json resolves sharp 0.35.5 with the approved integrity, every @img/sharp-* platform binary at 0.35.5 and every @img/sharp-libvips-* binary at 1.3.4"
    - "Root `npm test` passes (163/163) and test/seo-assets.test.js asserts 0.35.5 for both the manifest pin and the lockfile"
    - "The sharp module installed in tools/seo-images loads and reports version 0.35.5, without running the image generator"
    - "The committed SEO images (src/assets/og, src/assets/icons, src/assets/brand, src/favicon.ico) and the root package.json/package-lock.json are unchanged"
  artifacts:
    - path: "tools/seo-images/package.json"
      provides: "Isolated tool package pinning sharp exactly to 0.35.5"
      contains: "\"sharp\": \"0.35.5\""
    - path: "tools/seo-images/package-lock.json"
      provides: "Lockfile for the tool package with sharp 0.35.5 and its @img binaries plus integrity hashes"
      contains: "sharp-0.35.5.tgz"
    - path: "test/seo-assets.test.js"
      provides: "T-02-SC isolation test asserting the 0.35.5 pin in the manifest and the lockfile"
      contains: "\"0.35.5\""
  key_links:
    - from: "test/seo-assets.test.js"
      to: "tools/seo-images/package.json and tools/seo-images/package-lock.json"
      via: "readJson() in the test 'the image tool is isolated from the site build (T-02-SC)'"
      pattern: "tool\\.dependencies\\.sharp|node_modules/sharp"
    - from: "tools/seo-images/package.json"
      to: "tools/seo-images/package-lock.json"
      via: "npm install run inside tools/seo-images"
      pattern: "\"sharp\": \"0.35.5\""
    - from: "tools/seo-images/package-lock.json"
      to: "npm audit advisory database"
      via: "npm --prefix tools/seo-images audit"
      pattern: "found 0 vulnerabilities"
---

<objective>
Bump the isolated image-generator dependency sharp from its current exact pin to exactly 0.35.5 in tools/seo-images, regenerate that package's lockfile, and update the two version assertions in test/seo-assets.test.js, so `npm audit` in tools/seo-images reports 0 vulnerabilities.

Purpose: `npm --prefix tools/seo-images audit` reports one high-severity advisory on the current sharp (GHSA-wq5f-xc86-pv6w, CVE-2026-96889, in the librsvg bundled with the prebuilt libvips binaries). 0.35.5 ships libvips 1.3.4 binaries with the fix. This closes the open follow-up in .planning/phases/02-technical-seo/02-SECURITY.md ("Vet and pin sharp >= 0.35.5 ... update the version pins in test/seo-assets.test.js:72,79") and the STATE.md 02-02 decision that the upgrade waits for the user to vet 0.35.5.

Scope limits set by the user:
- Do NOT regenerate the committed images (src/assets/og, src/assets/icons, src/assets/brand, src/favicon.ico). This overrides the 02-SECURITY.md follow-up's "rerun the generator" step.
- Root-level Eleventy audit findings are out of scope (no upstream fix). The root package.json and package-lock.json must not change.
- Keep the exact-pin style (no caret, no tilde).

Output: updated tools/seo-images/package.json, regenerated tools/seo-images/package-lock.json, updated test/seo-assets.test.js. tools/seo-images/node_modules is refreshed but is gitignored (.gitignore line 6, `node_modules/`).
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.claude/CLAUDE.md
@tools/seo-images/package.json
@test/seo-assets.test.js
@.planning/phases/02-technical-seo/02-SECURITY.md

<interfaces>
Facts observed at planning time (2026-10-08). The executor re-checks them live and does not trust them blindly:

- tools/seo-images/package.json: `"dependencies": { "sharp": "<old exact pin>" }`, `"engines": { "node": ">=22.19" }`, script `generate` = `node make-seo-images.js`. No other dependencies.
- test/seo-assets.test.js, test "the image tool is isolated from the site build (T-02-SC)" (lines 70-80):
  - line 72: `assert.equal(tool.dependencies.sharp, "<old version>");`
  - line 79: `assert.equal(lock.packages["node_modules/sharp"].version, "<old version>");`
  - lines 75-76 assert the root package.json has no sharp. Leave them as they are.
- Current `npm --prefix tools/seo-images audit` output: "sharp <0.35.5, Severity: high, GHSA-wq5f-xc86-pv6w ... 1 high severity vulnerability" (exit 1).
- Registry, `npm view sharp@0.35.5`:
  - version 0.35.5, published 2026-09-27T13:46:24Z (11 days old, current `latest` dist-tag)
  - repository.url `git+https://github.com/lovell/sharp.git`; maintainers `lovell <npm@lovell.info>`
  - no `install`, `preinstall` or `postinstall` scripts
  - engines node >=20.9.0 (compatible with the tool's >=22.19)
  - optionalDependencies: only `@img/sharp-*` at 0.35.5 and `@img/sharp-libvips-*` at 1.3.4 (the current lockfile has libvips 1.3.3)
  - dist.integrity `sha512-Ywn4OnzGukp7CDMrp08RQ50YKmuwG47brZgIVPTvBaaAfQlRlygrRqSrxdCiL9M+LlzLBiJ68IR1QqvzHyjC7g==`
- The only tracked files outside .planning that contain the old version string are tools/seo-images/package.json, tools/seo-images/package-lock.json and test/seo-assets.test.js. README.md (lines 213, 244) and FACTS.md mention sharp without a version. Files under .planning are historical records (02-02 PLAN/SUMMARY, 02-SECURITY, 02-UAT, STATE decision log). Do not edit them.
- Smoke import that works today from the repo root: `(cd tools/seo-images && node --input-type=module -e "import sharp from 'sharp'; console.log(sharp.versions.sharp, sharp.versions.rsvg)")`.
- Root `npm test` = `node --test "test/*.test.js"`, currently 163 pass / 0 fail.
</interfaces>
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking-human">
  <name>Task 1: Package legitimacy gate, so the user vets sharp@0.35.5 before it is installed</name>
  <files>(none, read-only registry queries)</files>
  <read_first>
    - .planning/phases/02-technical-seo/02-SECURITY.md (row T-02-ADV-01 and "Follow-ups (non-blocking)")
    - .planning/STATE.md (Decisions, the 02-02 entry on sharp)
  </read_first>
  <action>Before presenting this checkpoint, run these read-only registry queries from the repo root and show their raw output to the user. Install nothing. The queries are: `npm view sharp@0.35.5 name version repository.url maintainers dist.integrity engines scripts.install scripts.preinstall scripts.postinstall`, `npm view sharp@0.35.5 optionalDependencies`, `npm view sharp dist-tags`, and `npm view sharp time --json` filtered to the 0.35.5 line (for example piped through `grep '"0.35.5"'`). Compare the live output with the planning-time facts in the interfaces block: repository lovell/sharp, sole maintainer lovell, published 2026-09-27, no install, preinstall or postinstall scripts, optionalDependencies limited to @img/sharp-* 0.35.5 and @img/sharp-libvips-* 1.3.4, and the integrity value starting sha512-Ywn4OnzG. Call out any difference explicitly. This gate is required because the 02-02 decision in STATE.md and the 02-SECURITY.md follow-up both say the upgrade needs the user to vet 0.35.5, and because a version only 11 days old trips the research "too-new" signal. A package-legitimacy checkpoint is never auto-approved: ignore workflow.auto_advance, and do not apply the end-of-phase human_verify_mode to this gate (T-vmd-SC).</action>
  <what-built>Nothing is installed yet. The executor ran read-only `npm view` queries for sharp@0.35.5 and is showing their output next to the planning-time values.</what-built>
  <how-to-verify>
    1. Open https://www.npmjs.com/package/sharp. Check that the repository link is github.com/lovell/sharp, that lovell is the maintainer and that weekly downloads are in the tens of millions.
    2. In the Versions tab, confirm that 0.35.5 exists, was published 2026-09-27 and is tagged `latest`.
    3. Optional: open https://github.com/advisories/GHSA-wq5f-xc86-pv6w and confirm that 0.35.5 is listed as the patched version.
    4. In the executor's output, confirm that `repository.url` points at lovell/sharp, that no install, preinstall or postinstall script is printed, and that `optionalDependencies` lists only `@img/sharp-*` and `@img/sharp-libvips-*` packages.
    5. Confirm that the integrity printed is `sha512-Ywn4OnzGukp7CDMrp08RQ50YKmuwG47brZgIVPTvBaaAfQlRlygrRqSrxdCiL9M+LlzLBiJ68IR1QqvzHyjC7g==`. Task 2 checks the lockfile against this exact value.
  </how-to-verify>
  <resume-signal>Type "approved sharp 0.35.5" to install it, or describe what looks wrong.</resume-signal>
  <verify>
    <automated>npm view sharp@0.35.5 repository.url | grep -q "lovell/sharp" && test "$(npm view sharp@0.35.5 dist.integrity)" = "sha512-Ywn4OnzGukp7CDMrp08RQ50YKmuwG47brZgIVPTvBaaAfQlRlygrRqSrxdCiL9M+LlzLBiJ68IR1QqvzHyjC7g=="</automated>
    <fails_when>non-zero exit: the repository URL does not contain lovell/sharp, or the live registry integrity differs from the value the plan was written against (in that case stop and report it, do not continue to Task 2)</fails_when>
  </verify>
  <acceptance_criteria>
    - The user replied "approved sharp 0.35.5" (or an equally explicit approval) in this session
    - `npm view sharp@0.35.5 version` prints `0.35.5`
    - Nothing in tools/seo-images changed before the approval (`git diff --quiet 9111cd3 -- tools/seo-images` exits 0 at the moment of approval; 9111cd3 is the planning-time base commit)
  </acceptance_criteria>
  <done>A human approved sharp@0.35.5 against the live registry facts, and nothing was installed before the approval.</done>
</task>

<task type="tracer" tdd="true">
  <name>Task 2: End-to-end bump of the exact pin to 0.35.5 (test assertions, manifest, lockfile, audit) without regenerating images</name>
  <files>test/seo-assets.test.js, tools/seo-images/package.json, tools/seo-images/package-lock.json</files>
  <read_first>
    - test/seo-assets.test.js (lines 70-80, the T-02-SC isolation test)
    - tools/seo-images/package.json
    - .gitignore (confirms that node_modules/ is ignored at any depth)
  </read_first>
  <behavior>
    - The T-02-SC test expects `tool.dependencies.sharp === "0.35.5"` and `lock.packages["node_modules/sharp"].version === "0.35.5"`. It fails (RED) after step 1 and passes (GREEN) after the reinstall.
    - The root package.json still has no sharp in dependencies or devDependencies (existing assertions on lines 75-76 are untouched and still pass).
    - `npm --prefix tools/seo-images audit` exits 0 with "found 0 vulnerabilities".
  </behavior>
  <action>This is the single vertical slice through every layer the change touches: test expectation, tool manifest, tool lockfile, installed module and audit. Work in this order.
(1) RED: in test/seo-assets.test.js change only the two expected-version string literals in the test "the image tool is isolated from the site build (T-02-SC)", on line 72 (`tool.dependencies.sharp`) and line 79 (`lock.packages["node_modules/sharp"].version`), to "0.35.5". Change nothing else in the file. Run `node --test test/seo-assets.test.js` and confirm the T-02-SC test fails because the manifest still holds the old pin.
(2) In tools/seo-images/package.json set `dependencies.sharp` to the exact string "0.35.5". Keep the exact-pin style with no caret or tilde (user instruction). Leave name, engines, scripts and description unchanged.
(3) GREEN: from the repo root run `(cd tools/seo-images && npm install)` so npm rewrites tools/seo-images/package-lock.json and refreshes the gitignored tools/seo-images/node_modules. Do not use `npm audit fix --force`, because it bypasses the reviewed manifest edit. Do not run `npm install sharp@0.35.5` without `--save-exact`, because that writes a caret range. Do not run any npm install at the repo root, and do not touch the root package.json or package-lock.json: sharp must stay out of the site build and CI (T-02-SC, T-vmd-SC).
(4) Do NOT run `npm run generate` or tools/seo-images/make-seo-images.js. The committed images in src/assets/og, src/assets/icons, src/assets/brand and src/favicon.ico stay byte-identical (user instruction, which overrides the "rerun the generator" step of the 02-SECURITY.md follow-up). Proving that the new module loads is enough: run the smoke import from the interfaces block and confirm that it prints 0.35.5 plus the bundled rsvg version.
(5) Confirm that the regenerated lockfile carries the integrity the user approved in Task 1 for sharp, every @img/sharp-* platform entry at 0.35.5 and every @img/sharp-libvips-* entry at 1.3.4. The verify command checks this.
(6) Doc sweep: search tracked files outside .planning for the previous version string (for example `git grep -nF` with the old value and the pathspec `":(exclude).planning"`). At planning time only the three files of this task matched, and README.md and FACTS.md name sharp without a version. If the sweep finds any other doc, update it to 0.35.5. Leave .planning history files unchanged.
(7) Run root `npm test` and confirm 163 pass / 0 fail.
For the SUMMARY: record that this closes the 02-SECURITY.md follow-up for T-02-ADV-01 (vet, pin and test pins), that the generator rerun was deliberately skipped per the user, and that the STATE.md 02-02 decision about keeping the old version is superseded. Add a key decision line saying "sharp bumped to 0.35.5 (user-vetted) in tools/seo-images; committed SEO images not regenerated".</action>
  <verify>
    <automated>npm --prefix tools/seo-images audit && npm test && node -e "const p=require('./tools/seo-images/package-lock.json').packages;const bad=[];if(p[''].dependencies.sharp!=='0.35.5')bad.push('root pin');if(p['node_modules/sharp'].integrity!=='sha512-Ywn4OnzGukp7CDMrp08RQ50YKmuwG47brZgIVPTvBaaAfQlRlygrRqSrxdCiL9M+LlzLBiJ68IR1QqvzHyjC7g==')bad.push('sharp integrity');for(const [k,v] of Object.entries(p)){if(k.startsWith('node_modules/@img/sharp-libvips-')){if(v.version!=='1.3.4')bad.push(k)}else if(k.startsWith('node_modules/@img/sharp-')&&v.version!=='0.35.5')bad.push(k)}if(bad.length){console.error('lock mismatch: '+bad.join(', '));process.exit(1)}" && (cd tools/seo-images && node --input-type=module -e "import sharp from 'sharp'; if (sharp.versions.sharp !== '0.35.5') process.exit(1); console.log(sharp.versions.sharp, sharp.versions.rsvg)") && ! git grep -qF "0.35.4" -- . ":(exclude).planning" && git diff --quiet 9111cd3 -- package.json package-lock.json src/assets src/favicon.ico && test -z "$(git status --porcelain --untracked-files=all -- src/assets src/favicon.ico)"</automated>
    <fails_when>non-zero exit from any of these: the tool audit still reports a vulnerability; root npm test has a failure; the lockfile root pin, sharp integrity, an @img/sharp-* version other than 0.35.5 or an @img/sharp-libvips-* version other than 1.3.4; the installed sharp module does not load or reports a version other than 0.35.5; a tracked file outside .planning still contains the previous version string; the root package.json or package-lock.json changed; or any committed SEO image under src/assets or src/favicon.ico is modified or new</fails_when>
  </verify>
  <acceptance_criteria>
    - `node -e "process.exit(require('./tools/seo-images/package.json').dependencies.sharp === '0.35.5' ? 0 : 1)"` exits 0 (exact string, so a caret or tilde fails)
    - `npm --prefix tools/seo-images ls sharp` prints `sharp@0.35.5`
    - `npm --prefix tools/seo-images audit` prints "found 0 vulnerabilities" and exits 0
    - root `npm test` reports 163 pass, 0 fail
    - `git diff --name-only 9111cd3 -- . ":(exclude).planning"` (planning-time base commit; covers committed and uncommitted changes) lists only tools/seo-images/package.json, tools/seo-images/package-lock.json and test/seo-assets.test.js
    - `git diff -U0 9111cd3 -- test/seo-assets.test.js` shows exactly two changed lines (72 and 79), both only changing the version literal
    - `git diff --quiet 9111cd3 -- package.json package-lock.json src/assets src/favicon.ico` exits 0 (the root manifests and the committed images are unchanged relative to the base), and `git status --porcelain --untracked-files=all -- src/assets src/favicon.ico` prints nothing
  </acceptance_criteria>
  <done>tools/seo-images pins sharp exactly to 0.35.5 with a regenerated lockfile that matches the user-approved integrity, `npm audit` there reports 0 vulnerabilities, root `npm test` passes 163/163 with the updated assertions, and no committed image or root manifest changed.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| npm registry -> tools/seo-images/node_modules | Third-party package and native prebuilt binaries (sharp, @img/sharp-*, @img/sharp-libvips-*) enter the developer machine |
| tool package -> site build/CI | sharp must stay isolated in tools/seo-images; the root `npm ci` in CI never installs it |
| generator inputs -> sharp decoders (librsvg) | Pre-existing boundary (T-02-ADV-01). This plan swaps the vulnerable decoder build for the fixed one and does not change the inputs |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-vmd-SC | Tampering | npm install of sharp 0.35.5 and its @img binaries in tools/seo-images | high | mitigate | Blocking-human legitimacy checkpoint (Task 1) before any install, never auto-approved; exact pin "0.35.5"; the Task 2 verify asserts that the lockfile's sharp integrity equals the integrity the user approved and that every @img/sharp-* / libvips entry is at the expected version; install runs only inside tools/seo-images, and the verify plus test lines 75-76 assert that the root manifests stay free of sharp |
| T-vmd-01 | Elevation of privilege | librsvg inside the prebuilt libvips bundled with the old sharp (GHSA-wq5f-xc86-pv6w, CVE-2026-96889) | high | mitigate | Bump to sharp 0.35.5, which ships @img/sharp-libvips-* 1.3.4; the Task 2 verify requires `npm --prefix tools/seo-images audit` to exit 0 with 0 vulnerabilities; the existing code controls from T-02-ADV-01 (constant-built SVG, signature-checked raster inputs) stay in place |
| T-vmd-02 | Tampering | committed SEO images (src/assets/og, icons, brand, src/favicon.ico) | low | accept | Not regenerated, per the user. They are static output files produced earlier from constant SVG and signature-checked rasters; the advisory affects decoding at generation time, not the produced files. The Task 2 verify asserts that they are unchanged, and the existing header-parser tests keep checking them |
</threat_model>

<verification>
- Task 1: the user approved sharp@0.35.5 after seeing the live registry facts, and nothing was installed before that.
- Task 2 automated verify passes as one chain: tool audit clean, root tests green, lockfile versions and integrity correct, the module loads at 0.35.5, no stray old version string outside .planning, root manifests unchanged, committed images untouched.
</verification>

<success_criteria>
- `npm --prefix tools/seo-images audit` reports found 0 vulnerabilities.
- Root `npm test` passes 163/163.
- tools/seo-images/package.json has `"sharp": "0.35.5"` (exact), and the lockfile resolves sharp-0.35.5.tgz with the approved integrity.
- test/seo-assets.test.js lines 72 and 79 assert "0.35.5".
- No image regeneration happened, and the root package.json/package-lock.json did not change.
</success_criteria>

<output>
Create `.planning/quick/261008-vmd-bump-sharp-to-0-35-5-in-tools-seo-images/261008-vmd-SUMMARY.md` with `status: complete` in its frontmatter when done. Record the audit before and after, the approved integrity, the libvips binary version change (1.3.3 to 1.3.4), the explicit note that the committed images were not regenerated, and that the T-02-ADV-01 follow-up in 02-SECURITY.md is closed by this task.
</output>
