# Phase 4: Join & Operations Pages - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-11
**Phase:** 04-join-operations-pages
**Areas discussed:** Clan facts & FAQ, Home vs. subpages & nav, Operation recaps, Discord badge & '20+'

---

## Clan facts & FAQ

| Option | Description | Selected |
|--------|-------------|----------|
| Claude drafts all, TODO | Everything drafted and marked TODO | |
| I'll give facts now | User answers a facts list in-session | ✓ |
| Mix: key facts now | 4–5 key facts now, rest TODO | |

**User's choice:** Gave facts in free text: weekends 19:00, 2–3 h; same-day casual Zeus games (modern only); missions in any era the MM picks (modern, Vietnam, Cold War, sometimes WW2, wh40k/post-apo); mostly PvE, sometimes JO with Polish and foreign clans; age 16, not strict; TeamSpeak + ACRE2 (TFAR for some JOs); ~83 GB / 55 mods via Steam Workshop, preset on Discord; no CDLC required; casual milsim, no RP, follow orders, Polish players; slotting/briefing/debrief/OCAP; join flow pasted from the cadet channel.

| Question | Options | Selected |
|----------|---------|----------|
| Modpack size wording | "ok. 90 GB" / "ok. 83 GB, 55 modów" / "80–90 GB" | "ok. 90 GB" |
| Age wording | "Zalecane 16+" / "Ukończone 16 lat" / no age | "Zalecane 16+" |
| TODO policy | Only inferred bits TODO / Everything TODO | Only inferred bits TODO |
| FAQPage JSON-LD | Yes, from the same data / No | Yes |
| 3-day recruiter rule on site | Yes, framed gently / No | Yes, gently |

---

## Home vs. subpages & nav

| Question | Options | Selected |
|----------|---------|----------|
| Home recruitment section | Teaser + link / Keep as is + link / Move entirely | Teaser + link |
| Nav items | Start/O nas/Operacje/Dołącz / All 4 + 2 pages / Only real pages | Start/O nas/Operacje/Dołącz |
| Old #links | Redirect removed anchors only / Always redirect #recruitment | Redirect removed anchors only |
| #recruitment vs. teaser | Map #recruitment → /jak-dolaczyc/ (teaser gets a new id) / Keep scrolling | Map |
| Home facts | Align with new facts / Leave as is | Align |

---

## Operation recaps

**Notes:** The user said a friend wants an iframe calendar fed by the Discord bot. Clarified that this is ENG-04 (v2, upcoming ops) and doesn't replace recaps (past ops).

| Question | Options | Selected |
|----------|---------|----------|
| Bot calendar vs. Phase 4 | Reserve a slot now / Defer fully to v2 / Build in Phase 4 | Reserve a slot now |
| Recap source | User names real ops / Claude drafts, all TODO / Fewer, real only | Claude drafts, all TODO |
| Recap look | Card with 1 photo / Text-only log | Card with 1 photo |

---

## Discord badge & '20+'

| Question | Options | Selected |
|----------|---------|----------|
| Badge content | Both, labelled as Discord / Online only / Replace the 20+ stat | Both, labelled as Discord |
| Placement & fallback | Near home CTA, build-time number / Hero, static fallback / Header on every page | Near home CTA, build-time number |

---

## Claude's Discretion

- Recap storage: one data file (`src/_data/operations.js`), which Claude proposed and the user didn't object to
- FAQ question list, breadcrumb look, timeline presentation, the badge's backstop number, the hash-redirect map details

## Deferred Ideas

- Bot-fed upcoming missions calendar (ENG-04, v2), with a bot JSON feed preferred over an iframe
- Per-recap pages (ENG-03, v2)
- User shared the squad XML (https://ibc.tacticool.pl/xml/, ~30 members, units.arma3.com/unit/ibc) after the discussion. Recorded as a v2 roster source candidate and a possible sameAs link
