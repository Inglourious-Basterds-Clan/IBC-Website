// CONT-07 checks (D-14..D-16): the live Discord members badge. Build-time helpers in
// lib/discord.js, the baked "Discord: N+ osób" fallback in the root and /IBC-Website/ builds
// (every test build runs with DISCORD_FETCH=0, so the committed backstop is baked), and the
// data-js="discord-badge" module turning the built API URL into live text against a stub DOM.
import { test, before, afterEach } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build, read, attrValues } from "./helpers.js";
import site from "../src/_data/site.js";
import { fallbackText, inviteApiUrl } from "../lib/discord.js";

const modulePath = fileURLToPath(new URL("../src/js/modules/discord-badge.js", import.meta.url));
const globalKeys = ["document", "window", "IntersectionObserver"];
const originalFetch = globalThis.fetch;

afterEach(() => {
  for (const key of globalKeys) delete globalThis[key];
  globalThis.fetch = originalFetch;
});

const out = {};
before(() => {
  out.root = build("discord-root");
  out.prefix = build("discord-prefix", { SITE_URL: "https://guard.example", PATH_PREFIX: "/IBC-Website/" });
});

/* --- BUILD OUTPUT HELPERS --- */
// The badge paragraphs of a page: { open, inner } for every element with data-js="discord-badge".
function badges(html) {
  return Array.from(html.matchAll(/<p\b([^>]*\sdata-js="discord-badge"[^>]*)>([\s\S]*?)<\/p>/g), (match) => ({
    open: match[1],
    inner: match[2],
  }));
}

function spanText(inner, className) {
  const match = inner.match(new RegExp(`<span class="${className}">([^<]*)</span>`));
  return match ? match[1] : null;
}

/* --- STUB DOM --- */
function createSpan(text = "") {
  return { textContent: text };
}

// A badge element as the module sees it: data-api-url plus the two spans.
function createBadge(apiUrl, { members = createSpan("200+ osób"), online = createSpan("") } = {}) {
  const find = { ".discord-badge-members": members, ".discord-badge-online": online };
  return {
    members,
    online,
    getAttribute: (name) => (name === "data-api-url" ? apiUrl : null),
    querySelector: (selector) => (Object.hasOwn(find, selector) ? find[selector] : null),
  };
}

// Records every observer; intersect() fires the callback the way a browser would.
function installObserver() {
  const observers = [];
  globalThis.IntersectionObserver = class IntersectionObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.targets = [];
      this.disconnected = false;
      observers.push(this);
    }
    observe(target) {
      this.targets.push(target);
    }
    disconnect() {
      this.disconnected = true;
    }
  };
  function intersect(target) {
    const observer = observers.find((candidate) => candidate.targets.includes(target));
    assert.ok(observer, "no IntersectionObserver observes the badge");
    observer.callback([{ isIntersecting: true, target }]);
  }
  return { observers, intersect };
}

// A fetch stub that records its calls and answers with the given response factory.
function installFetch(respond) {
  const calls = [];
  globalThis.fetch = (url, options) => {
    calls.push({ url, options });
    return respond(url, options);
  };
  return calls;
}

const okResponse = (body) => Promise.resolve({ ok: true, status: 200, json: async () => body });

async function settle() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

async function loadBadge() {
  return import(pathToFileURL(modulePath).href);
}

/* --- TRACER: BUILD -> BAKED FALLBACK -> LIVE TEXT --- */
test("root and prefix builds bake one badge with the API URL and the backstop text", () => {
  for (const outDir of [out.root, out.prefix]) {
    const html = read(outDir, "index.html");
    const found = badges(html);
    assert.equal(found.length, 1, `${outDir}: expected one discord-badge element, found ${found.length}`);
    assert.deepEqual(attrValues(found[0].open, "data-api-url"), [inviteApiUrl(site.discord.invite)]);
    assert.equal(spanText(found[0].inner, "discord-badge-members"), fallbackText(site.discord.membersBackstop));
  }
});

test("end to end: the built data-api-url becomes live member and online text", async () => {
  const [apiUrl] = attrValues(badges(read(out.root, "index.html"))[0].open, "data-api-url");
  const { init } = await loadBadge();
  const { intersect } = installObserver();
  const calls = installFetch(() => okResponse({ approximate_member_count: 246, approximate_presence_count: 108 }));
  const el = createBadge(apiUrl);

  init(el);
  assert.equal(calls.length, 0, "the badge fetched before it neared the viewport");
  intersect(el);
  await settle();

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, apiUrl);
  assert.equal(calls[0].options.credentials, "omit");
  assert.equal(el.members.textContent, "246 osób");
  assert.equal(el.online.textContent, " · 108 online");
});

