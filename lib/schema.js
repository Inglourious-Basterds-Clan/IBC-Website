// Build-time code outside src/ (Eleventy never copies it to the output). Builds the home-page
// JSON-LD graph (SEO-05, D-10..D-14): one Organization and one WebSite linked by @id. Pure and
// unit-tested in test/schema.test.js. Registered as the schemaGraph and jsonLd filters in
// eleventy.config.js; partials/head.njk renders it on the home page only.

// Mirrors the hero paragraph in src/index.njk (existing user copy, so no TODO marker).
// test/schema.test.js fails when the two differ, so edit both together (IN-03).
const organizationDescription =
  "Taktyczna symulacja militarna (Milsim) w grze Arma 3. Prowadzimy realistyczne operacje bojowe, " +
  "szkolenia taktyczne i zorganizowane misje kooperacyjne. Stawiamy na immersję, dyscyplinę radiową " +
  "i współpracę zespołową.";

const alternateNames = ["IBC", "IBC Clan"];

// site is src/_data/site.js: url (no trailing slash), pathPrefix ("/" or "/<seg>/"), name,
// social [{ url }] and discord.invite. home equals the canonical URL of the home page.
export function buildSchemaGraph(site) {
  const home = site.url + site.pathPrefix;
  const organizationId = home + "#organization";
  const organization = {
    "@type": "Organization",
    "@id": organizationId,
    name: site.name,
    alternateName: [...alternateNames],
    url: home,
    logo: home + "assets/brand/ibc-logo-512.png",
    foundingDate: "2018",
    description: organizationDescription,
    // D-11/D-13: the same social list the footer renders, then the Discord invite.
    sameAs: [...site.social.map((s) => s.url), site.discord.invite],
  };
  const website = {
    "@type": "WebSite",
    "@id": home + "#website",
    name: site.name,
    alternateName: [...alternateNames],
    url: home,
    inLanguage: "pl-PL",
    publisher: { "@id": organizationId },
  };
  return { "@context": "https://schema.org", "@graph": [organization, website] };
}

// JSON for an inline <script type="application/ld+json">. Every "<" becomes <, so no
// string value can close the script element; JSON.parse still returns the original value.
export function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
