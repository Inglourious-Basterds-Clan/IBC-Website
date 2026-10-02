# Phase 1: User Setup Required

**Generated:** 2026-10-02
**Phase:** 01-eleventy-foundation
**Status:** Incomplete

Complete these items for the GitHub Pages deploy to work. Claude automated everything possible (workflow, tests, README); this item requires access to the GitHub repository settings.

## Environment Variables

None. `SITE_URL` and `PATH_PREFIX` are already set in `.github/workflows/pages.yml`; no secrets are needed.

## Dashboard Configuration

- [ ] **Enable GitHub Pages with source GitHub Actions (one-time)**
  - Location: github.com/Inglourious-Basterds-Clan/IBC-Website → Settings → Pages → Build and deployment → Source
  - Set to: `GitHub Actions`
  - Notes: The repo currently has Pages disabled (`has_pages: false`). Until this is set, the `deploy` job of the `Build and deploy` workflow fails on every push to `main` (the `build` job and PR checks are unaffected). After enabling, re-run the latest workflow run (Actions → Build and deploy → Re-run jobs) or push to `main`.

## Verification

After completing setup and pushing (or re-running) on `main`:

```bash
gh run list --workflow pages.yml --limit 1
curl -sI https://inglourious-basterds-clan.github.io/IBC-Website/ | head -1
```

Expected results:
- The latest `Build and deploy` run on `main` is `completed success` (both `build` and `deploy` jobs green)
- `https://inglourious-basterds-clan.github.io/IBC-Website/` returns `HTTP/2 200` and shows the IBC home page with styles and images loading

## Reminder

The deploy folder is now `_site/` (built by `npm run build`), not the repository root. Any other static host must serve the contents of `_site/`.

---

**Once all items complete:** Mark status as "Complete" at top of file.
