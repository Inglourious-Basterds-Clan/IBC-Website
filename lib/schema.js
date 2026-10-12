// Build-time code outside src/ (Eleventy never copies it to the output). Builds the JSON-LD graphs,
// pure and unit-tested in test/schema.test.js:
// - the home graph (SEO-05, D-10..D-14): one Organization and one WebSite linked by @id, registered
//   as the schemaGraph filter and rendered by partials/head.njk on the home page only;
// - the subpage graph (SEO-06, D-05, D-17): a BreadcrumbList (plus a FAQPage on the join page),
//   registered as the pageGraph filter and rendered when the front matter has `breadcrumb`.
// Both go through the jsonLd filter.

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

// trail: [{ name, url }] with root-relative page.url values ("/", "/jak-dolaczyc/"). Every item is
// an absolute URL on the same base the canonical uses (url + pathPrefix), the last one included,
// so the last item equals the page canonical at the root and under a path prefix (D-17).
export function buildBreadcrumbList(site, trail) {
  const base = site.url + site.pathPrefix;
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => {
      if (typeof crumb.name !== "string" || crumb.name.trim() === "") {
        throw new Error(`breadcrumb entry ${index + 1} (${JSON.stringify(crumb.url)}) has no name`);
      }
      if (typeof crumb.url !== "string" || !crumb.url.startsWith("/")) {
        throw new Error(`breadcrumb entry ${index + 1} ("${crumb.name}") has url ${JSON.stringify(crumb.url)}, expected a root-relative path`);
      }
      return { "@type": "ListItem", position: index + 1, name: crumb.name, item: base + crumb.url.slice(1) };
    }),
  };
}

// The subpage graph: Start > the page (front matter `breadcrumb`, page.url).
export function buildPageGraph(site, { url, breadcrumb }) {
  const trail = [
    { name: "Start", url: "/" },
    { name: breadcrumb, url },
  ];
  return { "@context": "https://schema.org", "@graph": [buildBreadcrumbList(site, trail)] };
}

// JSON for an inline <script type="application/ld+json">. Every "<" becomes <, so no
// string value can close the script element; JSON.parse still returns the original value.
export function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
