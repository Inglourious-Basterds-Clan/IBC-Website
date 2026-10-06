# Phase 2: Technical SEO - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-06
**Phase:** 02-technical-seo
**Areas discussed:** Search snippet wording, Share image & favicon, Clan identity in JSON-LD, Indexing guard & 404

User note during area selection: "website will be hosted on windows server IIS".

---

## Search snippet wording

| Option | Description | Selected |
|--------|-------------|----------|
| Keyword first | 'Klan Arma 3 Milsim – Inglourious Basterds Clan (IBC)' | ✓ |
| Brand first | 'Inglourious Basterds Clan (IBC) – klan Arma 3 milsim' | |
| Keep HUD style | 'IBC Clan // Klan Arma 3 Milsim' | |

| Option | Description | Selected |
|--------|-------------|----------|
| Page title + ' \| IBC' | Short suffix appended by the layout | ✓ |
| Page title + full name | Longer, gets truncated | |
| Fully custom per page | No automatic suffix | |

| Option | Description | Selected |
|--------|-------------|----------|
| Recruitment pitch | Claude drafts, marked TODO | ✓ |
| Keep the current text | Reuse existing description | |
| I'll write it | User provides wording | |

| Option | Description | Selected |
|--------|-------------|----------|
| TODO + gate | Markers + FACTS.md, deploy blocked until confirmed | ✓ |
| Review in the PR, no markers | Final-looking copy reviewed in the diff | |

| Option | Description | Selected |
|--------|-------------|----------|
| Fail the build | Page-specific description required (404 exempt) | ✓ |
| Fall back to default | Site-wide description fallback | |

---

## Share image & favicon

| Option | Description | Selected |
|--------|-------------|----------|
| Designed card | hero-bg crop + logo + text, versioned file | ✓ |
| Plain hero crop | Crop/resize hero-bg only | |
| I'll provide one | User supplies image | |

| Option | Description | Selected |
|--------|-------------|----------|
| One default, overridable | ogImage front matter override | ✓ |
| Strictly one image | No override | |

| Option | Description | Selected |
|--------|-------------|----------|
| Logo on dark tile | Rose on #080e11 rounded tile | ✓ |
| 'IBC' monogram | Letters on dark tile | |
| Plain logo downscale | Transparent rose, faint on light tabs | |

| Option | Description | Selected |
|--------|-------------|----------|
| Site background | --bg-primary #080e11 | ✓ |
| Accent beige | #cbb18a | |

**Notes:** Claude inspected logo.png. It is a pale beige low-poly rose on transparent, too faint at 16–32 px without a background.

---

## Clan identity in JSON-LD

| Option | Description | Selected |
|--------|-------------|----------|
| YouTube @IBC_A3 | Footer link | ✓ |
| Facebook IBCA3 | Footer link | ✓ |
| Discord invite | Invite URL, not a profile page | ✓ |
| Steam group / other | — | |

| Option | Description | Selected |
|--------|-------------|----------|
| 'IBC' + 'IBC Clan' | Two alternate names | ✓ |
| 'IBC' only | As in requirement | |

| Option | Description | Selected |
|--------|-------------|----------|
| Dark-tile 512px icon | Readable on white | |
| Transparent rose | Resized logo.png | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, one list | site.social feeds footer + sameAs | ✓ |
| No, leave footer as is | Separate copies | |

---

## Indexing guard & 404

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit opt-in flag | noindex unless SITE_INDEXABLE=1 | ✓ |
| Auto-detect by host | github.io/localhost/IP → noindex | |

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal web.config | 404 httpErrors + .webmanifest MIME | ✓ |
| Plus HTTPS/www redirects | Needs URL Rewrite | |
| No, I'll configure IIS | Document only | |

| Option | Description | Selected |
|--------|-------------|----------|
| HUD 'signal lost' | Tactical flavour + plain line + home + Discord | ✓ |
| Plain and simple | One sentence + links | |

| Option | Description | Selected |
|--------|-------------|----------|
| Keep as noindex preview | Pages keeps deploying, always noindex | ✓ |
| Shut it down at cutover | Disable Pages deploy | |

**Notes:** The "keep as preview" option first mentioned a cross-domain canonical to the real domain. Claude corrected this in the conversation: the preview keeps a self-canonical, because noindex + cross-domain canonical send conflicting signals.

| Option | Description | Selected |
|--------|-------------|----------|
| Only indexable builds | TODOs fail when SITE_INDEXABLE=1; other checks fail every build | ✓ |
| Every production build | Pages preview blocked too | |

---

## Claude's Discretion

- Partial/filter/script names, the OG card and icon generation method, the icon size set, sitemap lastmod strategy, how check-seo.js is wired, TODO marker syntax, the exact Polish wording (marked TODO).

## Deferred Ideas

- IIS https/www redirects (server setup, out of scope; checklist mention only).
- .avif/.woff2 MIME maps in web.config (Phase 3).
