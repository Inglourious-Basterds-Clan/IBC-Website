// CONT-07 checks (D-14..D-16): the live Discord members badge. Build-time helpers in
// lib/discord.js, the baked "Discord: N+ osób" fallback in the root and /IBC-Website/ builds
// (every test build runs with DISCORD_FETCH=0, so the committed backstop is baked), and the
// data-js="discord-badge" module turning the built API URL into live text against a stub DOM.
import { test, before, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build, read, attrValues } from "./helpers.js";
import site from "../src/_data/site.js";
import {
  fallbackText,
  fetchInviteCounts,
  floorCount,
  inviteApiBase,
  inviteApiUrl,
  inviteCode,
  personWord,
} from "../lib/discord.js";

const modulePath = fileURLToPath(new URL("../src/js/modules/discord-badge.js", import.meta.url));
const libPath = fileURLToPath(new URL("../lib/discord.js", import.meta.url));
const invite = site.discord.invite;
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

/* --- BUILD OUTPUT GUARANTEES (D-14, D-16) --- */
const stripTags = (html) => html.replace(/<[^>]*>/g, "");

test("the badge reads 'Discord: N+ osób/osoby/osoba' with an empty online span", () => {
  for (const outDir of [out.root, out.prefix]) {
    const [badge] = badges(read(outDir, "index.html"));
    assert.ok(stripTags(badge.inner).startsWith("Discord: "), `badge text: ${stripTags(badge.inner)}`);
    assert.match(spanText(badge.inner, "discord-badge-members"), /^\d+\+ (?:osób|osoby|osoba)$/);
    assert.equal(spanText(badge.inner, "discord-badge-online"), "", "an online count is baked into the HTML");
  }
});

test("the badge sits in .recruitment-cta-group right after the Discord invite button", () => {
  for (const outDir of [out.root, out.prefix]) {
    const html = read(outDir, "index.html");
    const groups = Array.from(html.matchAll(/<div class="recruitment-cta-group">([\s\S]*?)<\/p>\s*<\/div>/g), (match) => match[1]);
    assert.equal(groups.length, 1, "expected one recruitment-cta-group holding the badge");
    const group = groups[0];
    const anchor = group.match(/^\s*<a\b([^>]*)>[\s\S]*?<\/a>\s*<p\b[^>]*\sdata-js="discord-badge"/);
    assert.ok(anchor, "the badge does not directly follow the Discord anchor");
    assert.deepEqual(attrValues(anchor[1], "href"), [site.discord.invite]);
  }
});

test("the 20+ active members stat is unchanged next to the badge", () => {
  for (const outDir of [out.root, out.prefix]) {
    const html = read(outDir, "index.html");
    assert.match(html, /<h3>20\+<\/h3>\s*<p>Aktywnych członków<\/p>/);
    assert.ok(!/discord-badge[^"]*"[^>]*>[^<]*członk/i.test(html), "the badge claims clan members");
  }
});

test("under the prefix build data-api-url stays the absolute, unprefixed Discord API URL", () => {
  const [badge] = badges(read(out.prefix, "index.html"));
  const [apiUrl] = attrValues(badge.open, "data-api-url");
  assert.ok(apiUrl.startsWith("https://discord.com/api/v10/invites/"), apiUrl);
  assert.ok(!apiUrl.includes("IBC-Website"), apiUrl);
});

/* --- lib/discord.js: INVITE URL --- */
test("inviteCode reads the last path segment and rejects a missing or malformed code", () => {
  assert.equal(inviteCode("https://discord.gg/DhJwkeehJK"), "DhJwkeehJK");
  assert.throws(() => inviteCode("https://discord.gg/"), /has no invite code/);
  assert.throws(() => inviteCode("https://discord.gg/a b"), /has no invite code/);
});

test("inviteApiUrl is the v10 invite endpoint with counts", () => {
  const url = inviteApiUrl(invite);
  assert.ok(url.startsWith(inviteApiBase), url);
  assert.ok(url.endsWith("?with_counts=true"), url);
  assert.equal(url, `https://discord.com/api/v10/invites/${inviteCode(invite)}?with_counts=true`);
});

/* --- lib/discord.js: ROUNDING AND PLURALS --- */
test("floorCount rounds down at its 10 and 100 boundaries", () => {
  const cases = { 0: 0, 9: 9, 10: 10, 99: 90, 100: 100, 149: 100, 150: 150, 246: 200 };
  for (const [input, expected] of Object.entries(cases)) assert.equal(floorCount(Number(input)), expected, `floorCount(${input})`);
});

test("floorCount rejects negative and non-integer counts", () => {
  assert.throws(() => floorCount(-1));
  assert.throws(() => floorCount(1.5));
  assert.throws(() => floorCount("246"));
});

test("personWord follows Polish plural rules", () => {
  const cases = { 1: "osoba", 2: "osoby", 4: "osoby", 5: "osób", 12: "osób", 14: "osób", 22: "osoby", 25: "osób", 200: "osób" };
  for (const [input, expected] of Object.entries(cases)) assert.equal(personWord(Number(input)), expected, `personWord(${input})`);
});

test("fallbackText bakes the rounded count with its plural", () => {
  assert.equal(fallbackText(240), "200+ osób");
  assert.equal(fallbackText(7), "7+ osób");
  assert.equal(fallbackText(site.discord.membersBackstop), "200+ osób");
});

/* --- lib/discord.js: BUILD-TIME FETCH --- */
const stubResponse = (status, body) => async () => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test("fetchInviteCounts returns exactly the two counts for a valid body", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, json: async () => ({ approximate_member_count: 246, approximate_presence_count: 108, guild: { name: "x" } }) };
  };
  const result = await fetchInviteCounts(invite, { fetchImpl });
  assert.deepEqual(result, { members: 246, online: 108 });
  assert.deepEqual(Object.keys(result).sort(), ["members", "online"]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, inviteApiUrl(invite));
  assert.ok(calls[0].options.signal instanceof AbortSignal, "no AbortSignal passed");
});

test("fetchInviteCounts keeps the members when the presence count is missing", async () => {
  assert.deepEqual(await fetchInviteCounts(invite, { fetchImpl: stubResponse(200, { approximate_member_count: 246 }) }), {
    members: 246,
    online: null,
  });
});

test("fetchInviteCounts returns null on non-2xx responses", async () => {
  assert.equal(await fetchInviteCounts(invite, { fetchImpl: stubResponse(404, { message: "Unknown Invite", code: 10006 }) }), null);
  assert.equal(await fetchInviteCounts(invite, { fetchImpl: stubResponse(429, { message: "rate limited" }) }), null);
});

test("fetchInviteCounts returns null on malformed bodies", async () => {
  const badJson = async () => ({ ok: true, status: 200, json: async () => Promise.reject(new SyntaxError("bad json")) });
  assert.equal(await fetchInviteCounts(invite, { fetchImpl: badJson }), null);
  assert.equal(await fetchInviteCounts(invite, { fetchImpl: stubResponse(200, { approximate_member_count: "246" }) }), null);
  assert.equal(await fetchInviteCounts(invite, { fetchImpl: stubResponse(200, { approximate_member_count: -1 }) }), null);
  assert.equal(await fetchInviteCounts(invite, { fetchImpl: stubResponse(200, null) }), null);
});

test("fetchInviteCounts returns null when the fetch throws or aborts", async () => {
  const throwing = () => {
    throw new TypeError("fetch failed");
  };
  const aborting = () => Promise.reject(new DOMException("The operation was aborted.", "AbortError"));
  assert.equal(await fetchInviteCounts(invite, { fetchImpl: throwing }), null);
  assert.equal(await fetchInviteCounts(invite, { fetchImpl: aborting }), null);
});

test("fetchInviteCounts times out through its AbortSignal", async () => {
  const hanging = (url, { signal }) =>
    new Promise((resolve, reject) => signal.addEventListener("abort", () => reject(signal.reason)));
  assert.equal(await fetchInviteCounts(invite, { fetchImpl: hanging, timeoutMs: 10 }), null);
});

/* --- discord-badge.js MODULE --- */
// Runs the module against one stubbed response; returns the badge, fetch calls and observers.
async function runBadge(respond, apiUrl = inviteApiUrl(invite)) {
  const { init } = await loadBadge();
  const dom = installObserver();
  const calls = installFetch(respond);
  const el = createBadge(apiUrl);
  init(el);
  if (dom.observers.length) dom.intersect(el);
  await settle();
  return { el, calls, ...dom };
}

test("init(null) does nothing", async () => {
  const { init } = await loadBadge();
  const { observers } = installObserver();
  const calls = installFetch(() => okResponse({}));
  assert.doesNotThrow(() => init(null));
  assert.equal(observers.length, 0);
  assert.equal(calls.length, 0);
});

test("a data-api-url outside https://discord.com/api/ never fetches or observes", async () => {
  for (const apiUrl of ["https://evil.example/x", "", "http://discord.com/api/v10/invites/x", "https://discord.com.evil.example/api/"]) {
    const { calls, observers } = await runBadge(() => okResponse({ approximate_member_count: 5 }), apiUrl);
    assert.equal(observers.length, 0, `observer created for ${JSON.stringify(apiUrl)}`);
    assert.equal(calls.length, 0, `fetch called for ${JSON.stringify(apiUrl)}`);
  }
});

test("a badge without its members or online span creates no observer", async () => {
  const { init } = await loadBadge();
  const { observers } = installObserver();
  installFetch(() => okResponse({}));
  init(createBadge(inviteApiUrl(invite), { members: null }));
  init(createBadge(inviteApiUrl(invite), { online: null }));
  assert.equal(observers.length, 0);
});

test("without IntersectionObserver the badge keeps its baked text", async () => {
  const { init } = await loadBadge();
  const calls = installFetch(() => okResponse({ approximate_member_count: 246 }));
  const el = createBadge(inviteApiUrl(invite));
  assert.doesNotThrow(() => init(el));
  await settle();
  assert.equal(calls.length, 0);
  assert.equal(el.members.textContent, "200+ osób");
});

test("failed or malformed responses leave both spans unchanged", async () => {
  const responses = [
    () => Promise.resolve({ ok: false, status: 404, json: async () => ({ message: "Unknown Invite" }) }),
    () => Promise.reject(new TypeError("Failed to fetch")),
    () => Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new SyntaxError("bad json")) }),
    () => okResponse({ approximate_member_count: 1.5, approximate_presence_count: 3 }),
    () => okResponse({ approximate_member_count: "246", approximate_presence_count: 3 }),
    () => okResponse({ approximate_member_count: -4, approximate_presence_count: 3 }),
    () => okResponse(null),
  ];
  for (const respond of responses) {
    const { el, calls } = await runBadge(respond);
    assert.equal(calls.length, 1);
    assert.equal(el.members.textContent, "200+ osób");
    assert.equal(el.online.textContent, "");
  }
});

test("a missing or invalid presence count updates only the members", async () => {
  for (const presence of [undefined, -1, 2.5, "108"]) {
    const { el } = await runBadge(() => okResponse({ approximate_member_count: 246, approximate_presence_count: presence }));
    assert.equal(el.members.textContent, "246 osób");
    assert.equal(el.online.textContent, "", `online span changed for presence ${JSON.stringify(presence)}`);
  }
});

test("live member text uses the Polish plural", async () => {
  const cases = { 1: "1 osoba", 22: "22 osoby", 12: "12 osób", 0: "0 osób" };
  for (const [members, expected] of Object.entries(cases)) {
    const { el } = await runBadge(() => okResponse({ approximate_member_count: Number(members), approximate_presence_count: 0 }));
    assert.equal(el.members.textContent, expected);
    assert.equal(el.online.textContent, " · 0 online");
  }
});

test("the observer disconnects after the first intersection and fetch runs once", async () => {
  const { el, calls, observers, intersect } = await runBadge(() =>
    okResponse({ approximate_member_count: 246, approximate_presence_count: 108 }),
  );
  assert.equal(observers.length, 1);
  assert.equal(observers[0].options.rootMargin, "200px");
  assert.equal(observers[0].disconnected, true);
  observers[0].callback([{ isIntersecting: false, target: el }]);
  intersect(el);
  await settle();
  assert.equal(calls.length, 1);
});

test("a non-intersecting entry does not fetch", async () => {
  const { init } = await loadBadge();
  const { observers } = installObserver();
  const calls = installFetch(() => okResponse({ approximate_member_count: 246 }));
  init(createBadge(inviteApiUrl(invite)));
  observers[0].callback([{ isIntersecting: false }]);
  await settle();
  assert.equal(calls.length, 0);
  assert.equal(observers[0].disconnected, false);
});

test("the fetch omits credentials and the referrer and carries a timeout signal", async () => {
  const { calls } = await runBadge(() => okResponse({ approximate_member_count: 246 }));
  assert.equal(calls[0].options.credentials, "omit");
  assert.equal(calls[0].options.referrerPolicy, "no-referrer");
  assert.ok(calls[0].options.signal instanceof AbortSignal);
});

test("without AbortSignal.timeout (Safari 15) the badge still fetches", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(AbortSignal, "timeout");
  Object.defineProperty(AbortSignal, "timeout", { value: undefined, configurable: true, writable: true });
  try {
    const { el, calls } = await runBadge(() => okResponse({ approximate_member_count: 246, approximate_presence_count: 108 }));
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.signal, undefined);
    assert.equal(el.members.textContent, "246 osób");
  } finally {
    Object.defineProperty(AbortSignal, "timeout", descriptor);
  }
});

/* --- STATIC SOURCE CHECKS --- */
const moduleSource = () => readFileSync(modulePath, "utf8");
const libSource = () => readFileSync(libPath, "utf8");

test("discord-badge.js has no HTML-string sink and no draft marker", () => {
  const source = moduleSource();
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML/.test(source), "discord-badge.js uses an HTML-string sink");
  assert.ok(!new RegExp("\\bTO" + "DO\\b").test(source), "discord-badge.js contains a draft marker");
  assert.ok(source.includes(".catch("), "discord-badge.js has no .catch(");
  assert.ok(!/console\./.test(source), "discord-badge.js logs to the console");
});

test("lib/discord.js and the module read only the two count fields of the invite response", () => {
  const allowed = ["approximate_member_count", "approximate_presence_count"];
  for (const [name, source] of [["lib/discord.js", libSource()], ["discord-badge.js", moduleSource()]]) {
    const fields = source.match(/approximate_\w+/g) || [];
    assert.ok(fields.length >= 2, `${name} reads no count field`);
    for (const field of fields) assert.ok(allowed.includes(field), `${name} reads ${field}`);
    const other = source.match(/\.(?:inviter|guild|channel)\b|\[["'](?:inviter|guild|channel)["']\]/g) || [];
    assert.deepEqual(other, [], `${name} reads inviter/guild/channel`);
    assert.ok(!/console\./.test(source), `${name} logs to the console`);
  }
});

// The home page JS budget (BUDGET.initialJsGzipMaxBytes) is shared by every module on it.
// The plan aimed for 700 B; the guards it requires (URL, spans, observer, AbortSignal feature
// check, response.ok, integer counts) measure 775 B on 2026-10-12, so the cap is 800 B.
test("discord-badge.js stays under 800 B gzip", () => {
  const size = gzipSync(readFileSync(modulePath)).length;
  assert.ok(size < 800, `discord-badge.js is ${size} B gzip`);
});

