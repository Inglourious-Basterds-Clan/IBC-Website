---
last_mapped_commit: 63f2ad5fb842c140afe59fe486169f7da112193b
last_mapped_at: 2026-10-02
---
# External Integrations

**Analysis Date:** 2026-10-02

## APIs & External Services

**Chat & Community:**
- Discord - Community platform and recruitment hub
  - Invite link: `https://discord.gg/DhJwkeehJK`
  - Reference: `index.html:174, 230, 265`
  - Purpose: Main recruitment channel, community discussion, voice comms coordination
  - No API integration (link-based only)

## Data Storage

**Databases:**
- Not detected - No backend database used

**File Storage:**
- Local filesystem only
- Image assets in `assets/` directory
- Formats: PNG, JPG
- Key images:
  - Logo: `assets/logo.png`
  - Hero backgrounds: `assets/hero.jpg`, `assets/hero-bg.jpg`
  - Gallery: `assets/op_patrol.jpg`, `assets/jo_1967.png`, `assets/cos.png`, `assets/funny.png`
  - Additional: `assets/patrol.jpg`, `assets/sniper.jpg`

**Caching:**
- Browser caching via HTTP headers (not configured in this codebase)
- No application-level caching layer

## Content Delivery

**CDN & Hosted Resources:**

- **Google Fonts** - Font delivery
  - Endpoint: `https://fonts.googleapis.com`
  - Secondary: `https://fonts.gstatic.com` (preconnect)
  - Fonts loaded: Inter, Montserrat, Share Tech Mono
  - Reference: `index.html:14-15`

- **Font Awesome CDN** - Icon library
  - Endpoint: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css`
  - Version: 6.0.0
  - Reference: `index.html:16`
  - Icons: Discord, YouTube, Facebook

## Authentication & Identity

**Auth Provider:**
- None detected - Site is public with no user authentication
- Discord OAuth not yet implemented (no backend to handle it)
- Future potential: Discord OAuth for recruitment workflow

## Monitoring & Observability

**Error Tracking:**
- None detected
- No Sentry, Rollbar, or similar

**Logs:**
- Browser console only (no external logging)
- Terminal output simulated in recruitment section (`js/main.js:141-181`)

**Analytics:**
- Not detected - No Google Analytics, Plausible, or similar tracking

## Social Media Integration

**Social Links (no direct API integration):**
- Discord: `https://discord.gg/DhJwkeehJK`
- YouTube: `https://www.youtube.com/@IBC_A3`
- Facebook: `https://www.facebook.com/IBCA3`
- Reference: `index.html:265-267`
- Purpose: Social proof, community engagement links

## SEO & Metadata

**Structured Data:**
- JSON-LD schema (SportsTeam type)
- Location: `index.html:26-35`
- Fields: Organization name, sport, founding date, description
- Purpose: Search engine optimization, rich snippets

**Open Graph & Meta Tags:**
- og:title, og:description, og:image, og:type
- Location: `index.html:19-23`
- Purpose: Social media sharing preview

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected
- Discord invite is link-only (no webhook events)

## Email Integration

**Email Services:**
- Not detected
- No contact form or email submission

## Payment & Commerce

**Payment Processing:**
- Not applicable - Site is informational only

---

*Integration audit: 2026-10-02*
