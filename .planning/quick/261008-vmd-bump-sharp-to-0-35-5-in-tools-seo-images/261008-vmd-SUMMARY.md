---
phase: quick-261008-vmd
plan: 01
subsystem: tooling/seo-images
status: complete
tags: [security, dependencies, sharp, npm-audit, supply-chain]
requires: []
provides:
  - "tools/seo-images pinned to sharp 0.35.5 (exact) with regenerated lockfile"
  - "T-02-SC isolation test asserts 0.35.5"
affects:
  - "02-SECURITY.md T-02-ADV-01 follow-up (closed)"
  - "STATE.md 02-02 decision to stay on sharp 0.35.4 (superseded)"
tech-stack:
  added: []
  patterns: ["exact-pin dependency in isolated tool package", "human-vetted package legitimacy gate before install"]
key-files:
  created: []
  modified:
    - tools/seo-images/package.json
    - tools/seo-images/package-lock.json
    - test/seo-assets.test.js
decisions:
  - "sharp bumped to 0.35.5 (user-vetted) in tools/seo-images; committed SEO images not regenerated"
metrics:
  duration: "~2 min"
  completed: 2026-10-08
  started: 2026-10-08T20:54:03Z
  finished: 2026-10-08T20:55:06Z
actuals:
  tokens: 6000
  tasks: 2
  commits: 2
plan_head_before: 9111cd3042a154b5d8a28dd8ffcb07def71ce981
plan_head_after: 03ce0deb00b6d8e2c653b2c7e90d96db790146b7
---

# Quick Task 261008-vmd: Bump sharp to 0.35.5 in tools/seo-images Summary

The isolated SEO image tool now pins sharp exactly to 0.35.5 (user-vetted, integrity `sha512-Ywn4OnzG...`). Its lockfile now uses @img/sharp-libvips 1.3.4, which closes GHSA-wq5f-xc86-pv6w / CVE-2026-96889. The committed SEO images were not regenerated.

## Tasks

| Task | Name | Outcome | Commit |
| ---- | ---- | ------- | ------ |
| 1 | Package legitimacy gate (checkpoint:human-verify, blocking-human) | Approved by user | none (read-only) |
| 2 | Bump exact pin to 0.35.5: test, manifest, lockfile, audit (tracer, TDD) | Done | 4cefe94 (RED), 03ce0de (GREEN) |

### Task 1 checkpoint outcome

The orchestrator ran the read-only `npm view sharp@0.35.5` queries and showed them to the user. The live registry values matched the plan's recorded values exactly:
- repository: lovell/sharp; only maintainer: lovell
- no install, preinstall or postinstall scripts
- optionalDependencies: only `@img/sharp-*` 0.35.5 and `@img/sharp-libvips-*` 1.3.4
- dist.integrity: `sha512-Ywn4OnzGukp7CDMrp08RQ50YKmuwG47brZgIVPTvBaaAfQlRlygrRqSrxdCiL9M+LlzLBiJ68IR1QqvzHyjC7g==`

The user's reply, verbatim: **"approved sharp 0.35.5"**. Before the approval, nothing in tools/seo-images had changed (`git diff --quiet 9111cd3 -- tools/seo-images` exited 0 at execution start).

### Task 2 results

- **Audit before:** `npm --prefix tools/seo-images audit` reported `sharp <0.35.5, Severity: high, GHSA-wq5f-xc86-pv6w`: 1 high severity vulnerability (exit 1).
- **Audit after:** `found 0 vulnerabilities` (exit 0).
- **Lockfile:** `node_modules/sharp` is 0.35.5, resolved from `https://registry.npmjs.org/sharp/-/sharp-0.35.5.tgz`. Its integrity matches the approved value exactly. All 27 `@img/` entries were checked: every `@img/sharp-*` is at 0.35.5, and every `@img/sharp-libvips-*` went from **1.3.3 to 1.3.4**.
- **Smoke import (generator not run):** sharp 0.35.5, rsvg 2.63.2, vips 8.18.7.
- **`npm --prefix tools/seo-images ls sharp`:** `sharp@0.35.5`.
- **Root `npm test`:** 163 tests, 163 pass, 0 fail.
- **TDD:** RED was confirmed before the manifest edit. T-02-SC failed with actual `'0.35.4'` and expected `'0.35.5'` (5 pass / 1 fail in seo-assets.test.js). After the install it was GREEN.
- **Doc sweep:** `git grep -F "0.35.4"` outside .planning finds no matches. README.md and FACTS.md name sharp without a version, so nothing changed there.
- **Scope checks:** `git diff --name-only 9111cd3 -- . ":(exclude).planning"` lists only the three planned files. The test diff is exactly two lines (72 and 79), and only the version literals changed. The root package.json/package-lock.json, src/assets and src/favicon.ico are unchanged, with no untracked files under them.

## TDD Gate Compliance

- RED: `4cefe94` test(quick-261008-vmd). The T-02-SC assertion failed for the intended reason, a version mismatch against the 0.35.4 manifest.
- GREEN: `03ce0de` fix(quick-261008-vmd). The manifest pin and the regenerated lockfile make it pass. Full suite 163/163.
- REFACTOR: not needed.

## Closures and Supersessions

- **Closes** the T-02-ADV-01 follow-up in `.planning/phases/02-technical-seo/02-SECURITY.md` ("Vet and pin sharp >= 0.35.5 ... update the version pins in test/seo-assets.test.js:72,79"). The vet, pin and test-pin steps are done. The follow-up's "rerun the generator" step was **deliberately skipped** at the user's instruction.
- **Supersedes** the STATE.md 02-02 decision to stay on sharp 0.35.4 until 0.35.5 was vetted.
- **Not regenerated:** src/assets/og, src/assets/icons, src/assets/brand and src/favicon.ico are byte-identical to the base. The advisory affects decoding at generation time, not the produced files (T-vmd-02, accepted).

## Deviations from Plan

None. The plan was executed exactly as written. (Task 1 was resolved by the orchestrator before this executor ran, as instructed.)

Note: commits were made directly on `main`. The project config uses `branching_strategy: none`, and the orchestrator explicitly told the executor to commit on the main working tree.

## Threat Model Coverage

- T-vmd-SC (mitigate): a blocking-human gate ran before the install. Exact pin. The lockfile integrity was asserted to equal the approved value. The install ran only inside tools/seo-images, and the root manifests are unchanged.
- T-vmd-01 (mitigate): the audit exits 0, and libvips binaries are at 1.3.4.
- T-vmd-02 (accept): the images were verified unchanged.

## Self-Check: PASSED

- FOUND: tools/seo-images/package.json (`"sharp": "0.35.5"`)
- FOUND: tools/seo-images/package-lock.json (sharp-0.35.5.tgz, approved integrity)
- FOUND: test/seo-assets.test.js (two `"0.35.5"` assertions)
- FOUND: commit 4cefe94
- FOUND: commit 03ce0de
