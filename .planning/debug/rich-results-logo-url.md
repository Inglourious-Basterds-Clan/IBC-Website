---
status: diagnosed
trigger: "UAT gap G-02-5: Google Rich Results Test warns 'Nieprawidłowy URL w polu \"logo\" (opcjonalnie)' on the deployed home Organization graph"
created: 2026-10-08T20:25:00Z
updated: 2026-10-08T20:40:00Z
goal: find_root_cause_only
---

## Current Focus

bug_class: Bohrbug (deterministic given the input; the variable is which JSON-LD was pasted)
hypothesis: Test 5 was run in RRT code-snippet mode on the JSON-LD from the local _site/index.html, which the dev server (npm run dev) wrote with http://localhost:8080 absolute URLs. Google cannot fetch a localhost logo, so it flags the one field whose URL it checks for crawlability (logo). The deployed graph itself meets every documented logo rule.
test: (for the user / continuation) re-run RRT in URL mode on https://inglourious-basterds-clan.github.io/IBC-Website/ (or paste the deployed JSON-LD in code mode); then paste the localhost snippet for contrast
expecting: deployed input -> no logo warning (confirms); localhost input -> "Invalid URL in field logo" (reproduces). If the deployed input still warns after a re-run, the localhost hypothesis is wrong for this report and the residual "transient fetch of a brand-new image" candidate applies.
next_action: return ROOT CAUSE FOUND to orchestrator (find_root_cause_only); no source changes
reasoning_checkpoint:
  hypothesis: "The RRT logo warning is caused by testing the dev-server _site JSON-LD, whose logo is http://localhost:8080/assets/brand/ibc-logo-512.png, a URL Google's servers cannot fetch; the 02-05/UAT test step tells the user to paste from _site/index.html."
  confirming_evidence:
    - "_site/index.html (mtime 20:20:06Z, inside UAT window) has logo http://localhost:8080/assets/brand/ibc-logo-512.png and url http://localhost:8080/"
    - "02-05-PLAN.md:135 and 02-05-SUMMARY.md:184 instruct: paste the ld+json block from _site/index.html (code snippet mode); UAT test 5 repeats it as the primary path"
    - "Locally only npm run dev can produce _site (npm run build without SITE_URL throws, CR-01); tests 2 and 6 require npm run dev"
    - "Google RRT help: all resources must be reachable by an anonymous internet user; local-machine content needs a tunnel"
    - "Deployed logo passes every documented rule: absolute https, same host, 200 image/png, no redirect, no X-Robots-Tag, 512x512 PNG, robots allow (root 404 = allow), plain-string form matches Google's own example"
  falsification_test: "User re-runs RRT on the deployed URL / deployed JSON-LD and still gets the logo warning on repeated runs"
  fix_rationale: "Not a code defect: change the verification procedure to test a production-like graph (deployed URL in URL mode, or a build with SITE_URL/PATH_PREFIX set), then re-run test 5"
  blind_spots: "Cannot run Google RRT myself; the user did not say which input mode/source they used; Google does not publish exactly which checks map to 'Invalid URL in field logo'"
  candidate_causes:
    - "data (test input): localhost URLs in the dev-server _site snippet"
    - "environment: transient RRT fetch failure of an image first published <9 min earlier"
    - "config: noindex preview (D-15) - eliminated as a mechanism, see Eliminated"
    - "code: lib/schema.js logo shape/pathPrefix - eliminated"
  and_gate: "no - the localhost input alone is sufficient; noindex and image newness are not needed to produce it"

## Symptoms

expected: Deployed home page (https://inglourious-basterds-clan.github.io/IBC-Website/) JSON-LD passes validator.schema.org and Google Rich Results Test with no errors/warnings: Organization + WebSite detected, alternateName includes "IBC", foundingDate 2018, three sameAs links.
actual: "pass but google reports \"Nieprawidłowy URL w polu \"logo\" (opcjonalnie)\"" (Google Rich Results warns "Invalid URL in field 'logo' (optional)"). schema.org validator and the rest of the graph passed.
errors: Google Rich Results warning: Nieprawidłowy URL w polu "logo" (opcjonalnie)
reproduction: Test 5 in .planning/phases/02-technical-seo/02-UAT.md
started: discovered during UAT right after main pushed and GitHub Pages redeployed (2026-10-08 ~20:14 UTC)

## Eliminated

- hypothesis: lib/schema.js builds a malformed or wrongly-prefixed logo URL (plain string vs ImageObject, missing pathPrefix)
  evidence: Deployed logo = https://inglourious-basterds-clan.github.io/IBC-Website/assets/brand/ibc-logo-512.png, same home value as url/@id; Google's own Organization examples use a plain-string logo ("logo": "https://www.example.com/images/logo.png"); doc says "URL or ImageObject".
  timestamp: 2026-10-08T20:33:00Z

- hypothesis: Image is not crawlable (robots.txt at the github.io host root or subpath blocks it)
  evidence: Host-root robots.txt returns 404 (Google treats 4xx as no restrictions); subpath robots.txt is Allow: / (and is not consulted by crawlers anyway). Googlebot and Google-InspectionTool UAs both get 200 image/png, 0 redirects.
  timestamp: 2026-10-08T20:33:00Z

- hypothesis: Image format/size violates Google's logo rules
  evidence: 512x512 8-bit RGBA PNG, 154476 bytes, valid IHDR; rule is >=112x112 and a Google Images format.
  timestamp: 2026-10-08T20:33:00Z

- hypothesis: The noindex GitHub Pages preview (D-15, Lighthouse is-crawlable failure) makes the logo URL "not indexable" and triggers the warning
  evidence: (1) meta robots noindex is page-level HTML; it cannot attach to the PNG, whose response has no X-Robots-Tag, so the image URL's own "Indexing allowed?" is yes per Google's availability doc. (2) RRT help says noindex/robots-blocked pages "cannot be tested", yet this test ran and detected Organization + WebSite, so noindex did not gate the run. (3) In the likely input (code-snippet paste) the meta robots tag is not even part of what Google sees. Noindex does mean Google never organically crawls/indexes the logo, which only matters for the logo actually appearing in Search (intended for a preview host), not for RRT URL validity.
  timestamp: 2026-10-08T20:35:00Z

## Evidence

- timestamp: 2026-10-08T20:23:41Z
  checked: curl of deployed home page JSON-LD and curl -I of the logo URL
  found: Organization.logo = "https://inglourious-basterds-clan.github.io/IBC-Website/assets/brand/ibc-logo-512.png" (absolute https string). Logo returns 200, Content-Type image/png, 154476 bytes, Last-Modified 2026-10-08 20:14:34 GMT. Home page carries <meta name="robots" content="noindex"> (preview build, D-15).
  implication: The URL is syntactically valid, absolute and publicly reachable to curl; the "invalid URL" must come from how Google's fetcher/validator handles it, not from JSON syntax.

- timestamp: 2026-10-08T20:24:00Z
  checked: lib/schema.js buildSchemaGraph
  found: logo is a plain URL string built as site.url + site.pathPrefix + "assets/brand/ibc-logo-512.png"; url/@id built from the same home value; deployed values match.
  implication: The build produces the intended absolute URL; no pathPrefix bug.

- timestamp: 2026-10-08T20:24:00Z
  checked: robots.txt at host root and subpath; logo fetched with Googlebot UA; PNG header
  found: https://inglourious-basterds-clan.github.io/robots.txt = 404 (GitHub "Site not found"); /IBC-Website/robots.txt = 200 "User-agent: * / Allow: /". Logo with Googlebot UA = 200 image/png 154476 bytes, no X-Robots-Tag, no redirect. PNG = 512x512 8-bit RGBA, valid IHDR.
  implication: Google treats a 4xx robots.txt as "no restrictions", so the image is crawlable. Size (>=112) and format (PNG) meet Google's rules. Not a robots.txt block, not a format/size problem.

- timestamp: 2026-10-08T20:26:00Z
  checked: Google Search Central Organization doc (developers.google.com/search/docs/appearance/structured-data/organization), logo property
  found: "logo: URL or ImageObject ... The image must be 112x112px, at minimum. The image URL must be crawlable and indexable. The image file format must be supported by Google Images. ... looks how you intend on a purely white background." Google's generic error table (support.google.com/webmasters/answer/13300873) only says "Invalid URL in field X: Update the specified property with a valid URL."
  implication: Google's logo check is not just URL syntax; it includes "crawlable AND indexable". Syntax is fine here, so the indexable/fetch side is the remaining candidate.

- timestamp: 2026-10-08T20:27:00Z
  checked: coordinator datapoint: PageSpeed/Lighthouse "is-crawlable" fails on the deployed page
  found: Every Pages page carries <meta name="robots" content="noindex"> by design (D-15; SITE_INDEXABLE never set in CI). The logo PNG is referenced only from the home page JSON-LD (noindex).
  implication: Candidate: Google cannot treat the logo as indexable because its only referrer is a noindex page / the site has zero indexed pages. Must test whether this maps to "Invalid URL".

- timestamp: 2026-10-08T20:30:00Z
  checked: GitHub Actions runs for Inglourious-Basterds-Clan/IBC-Website; git log of src/assets/brand/ibc-logo-512.png; references in deployed HTML
  found: Previous deploy c5ae6c3 on 2026-10-02; current deploy f4ca808 finished 2026-10-08T20:14:39Z. Logo first committed b91c726 (2026-10-07), so it was first public at 20:14:39Z. Deployed home references ibc-logo-512.png exactly once (JSON-LD only; no <img>, icon or og:image uses it).
  implication: The image is brand new and Google has never crawled it; RRT URL mode would not fetch it as a render resource.

- timestamp: 2026-10-08T20:31:00Z
  checked: Google RRT help (support.google.com/webmasters/answer/7445569) and "Check if a URL or image is available to Google" (answer/12061956)
  found: RRT: "All page resources must be accessible by an anonymous user accessing the code from the internet ... If your page is ... hosted on your local machine, you can test it by exposing a tunnel." Noindex note: pages blocked by robots.txt/noindex "cannot be tested", yet this page produced detected Organization + WebSite items. Image availability: "Indexing allowed?" for an image URL reflects a noindex tag or directive on that resource (for a PNG only X-Robots-Tag can carry it; none present).
  implication: The page-level meta noindex does not attach to the PNG, and it did not stop the test from running. Noindex is not a mechanism that turns a reachable absolute logo URL into "invalid URL".

- timestamp: 2026-10-08T20:32:00Z
  checked: local C:/.../IBC-Website/_site/index.html (the file test 5 tells the user to paste from first)
  found: mtime 2026-10-08 22:20:06 +0200 (= 20:20:06Z, inside the UAT window 20:07:47Z-20:23:10Z). Its JSON-LD has "logo":"http://localhost:8080/assets/brand/ibc-logo-512.png" and "url":"http://localhost:8080/". package.json "dev" = "eleventy --serve" writes to _site with the localUrl default (site.js line 12-21); a plain local `npm run build` without SITE_URL throws (CR-01), so the only local _site the user can have is the dev-server one. Tests 2 and 6 require `npm run dev` running.
  implication: STRONG CANDIDATE: if the user pasted the JSON-LD from _site/index.html (test 5's primary instruction), Google's logo check sees a localhost URL that its servers cannot fetch -> "Invalid URL in field logo". schema.org validator does not fetch URLs, so it passes; Google does not fetch url/@id/sameAs, so only logo is flagged. This matches the exact symptom shape (only logo, everything else passes).

- timestamp: 2026-10-08T20:36:00Z
  checked: origin of the test-5 wording (grep .planning/phases/02-technical-seo)
  found: 02-05-PLAN.md:135 "Paste the ld+json block from _site/index.html (code snippet mode) into validator.schema.org and Rich Results"; 02-05-SUMMARY.md:184 same; 02-RESEARCH.md:625 "Rich Results Test accepts a pasted code snippet, so it works before the domain exists"; 02-VALIDATION.md:86 "Paste built _site/index.html". Deploy workflow is the only place SITE_URL/PATH_PREFIX are set (.github/workflows lines 23-24).
  implication: The verification procedure itself routes the tester to a localhost-URL graph. The research assumption holds for syntax validators (schema.org) but not for Google's logo check, which needs a fetchable image URL.

## Resolution

root_cause: "Most likely a test-input defect, not a site defect: test 5 (from 02-05-PLAN.md:135 / 02-VALIDATION.md:86) has the tester paste the JSON-LD from the local _site/index.html in RRT code-snippet mode. Locally that file is written by the dev server (npm run dev, needed for tests 2 and 6) with the localUrl default, so its Organization.logo is http://localhost:8080/assets/brand/ibc-logo-512.png. Google's servers cannot fetch localhost, so RRT flags the logo (the one field whose URL Google checks for crawlability) as an invalid URL, while validator.schema.org (no fetching) and the url/@id/sameAs fields (syntax-only) pass. The deployed graph meets every documented logo rule. The noindex preview (D-15) is NOT a cause. Pending one confirmation: which input the user pasted."
fix: (not applied - find_root_cause_only)
verification:
files_changed: []
