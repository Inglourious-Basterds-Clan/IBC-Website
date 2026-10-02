// FOUND-02/04/06 client checks: src/js/main.js runs in a node:vm sandbox against a small
// stub DOM, so the recruitment terminal and scroll-spy are tested without a browser.
// Static checks guard the invite source and the writeToConsole sink.
import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const mainPath = fileURLToPath(new URL("../src/js/main.js", import.meta.url));
const mainSource = readFileSync(mainPath, "utf8");
// Same invite pattern as build.test.js, with the scheme optional so a display-only copy counts too.
const inviteDomainPattern = /(?:https?:\/\/)?(?:www\.)?discord(?:\.gg|(?:app)?\.com\/invite)\/[A-Za-z0-9-]+/g;

/* --- STUB DOM HARNESS --- */
function createElement(tagName) {
  return {
    tagName: String(tagName).toUpperCase(),
    className: "",
    textContent: "",
    style: {},
    children: [],
    scrollTop: 0,
    scrollHeight: 100,
    append(...nodes) {
      this.children.push(...nodes);
    },
    appendChild(node) {
      this.children.push(node);
      return node;
    },
  };
}

function createConsoleEl(discordUrl) {
  const el = createElement("div");
  el.id = "terminal-console";
  el.getAttribute = (name) => (name === "data-discord-url" && discordUrl !== undefined ? discordUrl : null);
  return el;
}

function createSection(tagName, id) {
  return {
    tagName,
    getAttribute: (name) => (name === "id" && id ? id : null),
  };
}

// A nav anchor as the browser resolves it: .hash and .pathname come from the absolute URL.
function createLink(href, pathname) {
  const resolved = new URL(href, `http://localhost${pathname}`);
  const classes = new Set();
  return {
    hash: resolved.hash,
    pathname: resolved.pathname,
    getAttribute: (name) => (name === "href" ? href : null),
    addEventListener() {},
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
    },
  };
}

function loadMain({ discordUrl, withTerminal = true, pathname = "/", links = [], sections = [] } = {}) {
  const consoleEl = withTerminal ? createConsoleEl(discordUrl) : null;
  const recruitment = sections.find((section) => section.getAttribute("id") === "recruitment") ||
    createSection("SECTION", "recruitment");
  const observers = [];
  let domReady = null;

  class IntersectionObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.targets = [];
      observers.push(this);
    }
    observe(target) {
      this.targets.push(target);
    }
    disconnect() {}
  }

  const document = {
    addEventListener(type, handler) {
      if (type === "DOMContentLoaded") domReady = handler;
    },
    getElementById(id) {
      if (id === "terminal-console") return consoleEl;
      if (id === "recruitment") return recruitment;
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      if (selector === "nav ul li a") return links;
      if (selector === "section, header") return sections;
      return [];
    },
    createElement,
    body: { style: {} },
  };

  const sandbox = {
    document,
    window: { location: { pathname } },
    IntersectionObserver,
    setTimeout: (callback) => callback(),
  };
  vm.runInNewContext(mainSource, sandbox, { filename: "src/js/main.js" });
  assert.equal(typeof domReady, "function", "main.js did not register a DOMContentLoaded handler");
  domReady();

  function intersect(target) {
    const observer = observers.find((candidate) => candidate.targets.includes(target));
    assert.ok(observer, "no IntersectionObserver observes the target");
    observer.callback([{ isIntersecting: true, target }]);
  }

  return { consoleEl, recruitment, observers, intersect };
}

function bootTerminal(discordUrl) {
  const env = loadMain({ discordUrl });
  env.intersect(env.recruitment);
  return env.consoleEl.children;
}

function messageOf(line) {
  const span = line.children.find((child) => child.className === "message");
  return span ? span.textContent : undefined;
}

/* --- RECRUITMENT TERMINAL (FOUND-04) --- */
test("terminal prints the invite from data-discord-url without its scheme", () => {
  const lines = bootTerminal("https://invite.example/TEST123");
  const messages = lines.map(messageOf);
  assert.ok(
    messages.includes("Połączenie nawiązane: invite.example/TEST123"),
    `connection line missing, got: ${JSON.stringify(messages)}`,
  );
});

test("terminal lines are three spans (time, tag, message)", () => {
  const lines = bootTerminal("https://invite.example/TEST123");
  assert.ok(lines.length >= 4, "boot sequence wrote fewer than 4 lines");
  for (const line of lines) {
    assert.equal(line.className, "terminal-line");
    assert.deepEqual(
      line.children.map((child) => child.className),
      ["time", "tag", "message"],
    );
  }
  assert.equal(messageOf(lines[0]), "Uruchamianie terminala zaciągowego IBC...");
});

test("terminal boots without data-discord-url", () => {
  let lines;
  assert.doesNotThrow(() => {
    lines = bootTerminal(undefined);
  });
  const messages = lines.map(messageOf);
  assert.ok(
    messages.includes("Połączenie nawiązane: "),
    `connection line missing, got: ${JSON.stringify(messages)}`,
  );
});

test("main.js has no invite literal and writeToConsole uses textContent", () => {
  assert.deepEqual(mainSource.match(inviteDomainPattern) || [], [], "main.js contains an invite literal");
  assert.ok(mainSource.includes("getAttribute('data-discord-url')"), "main.js does not read data-discord-url");
  const start = mainSource.indexOf("function writeToConsole");
  const end = mainSource.indexOf("consoleEl.appendChild(line)", start);
  assert.ok(start !== -1 && end !== -1, "writeToConsole body not found");
  const body = mainSource.slice(start, end);
  assert.ok(body.includes("textContent"), "writeToConsole does not use textContent");
  assert.ok(!body.includes("innerHTML"), "writeToConsole still assigns innerHTML");
});

test("main.js is a valid classic script (node --check)", () => {
  const result = spawnSync(process.execPath, ["--check", mainPath], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});

/* --- SCROLL-SPY (FOUND-06) --- */
const sectionIds = ["hero", "about", "gallery", "recruitment"];

function homeSections() {
  return [createSection("HEADER", null), ...sectionIds.map((id) => createSection("SECTION", id))];
}

function navLinks(prefix, pathname = prefix) {
  return sectionIds.map((id) => createLink(`${prefix}#${id}`, pathname));
}

function activeHashes(links) {
  return links.filter((link) => link.classList.contains("active-nav")).map((link) => link.hash);
}

function loadScrollSpy({ pathname, links, sections = homeSections() }) {
  // No terminal, so every IntersectionObserver in the run belongs to scroll-spy.
  return { ...loadMain({ withTerminal: false, pathname, links, sections }), links, sections };
}

test("scroll-spy highlights the intersecting section's link under /IBC-Website/", () => {
  const env = loadScrollSpy({ pathname: "/IBC-Website/", links: navLinks("/IBC-Website/") });
  const about = env.sections.find((section) => section.getAttribute("id") === "about");
  env.intersect(about);
  assert.deepEqual(activeHashes(env.links), ["#about"]);
});

test("scroll-spy maps the fixed header to #hero", () => {
  const env = loadScrollSpy({ pathname: "/", links: navLinks("/") });
  // Highlight another section first, so the header has to move the highlight back.
  env.intersect(env.sections.find((section) => section.getAttribute("id") === "gallery"));
  env.intersect(env.sections.find((section) => section.tagName === "HEADER"));
  assert.deepEqual(activeHashes(env.links), ["#hero"]);
});

test("scroll-spy is inert on a page the nav links do not point at", () => {
  // Prefixed and root-form hrefs both resolve to a path other than the dev page's.
  const links = [...navLinks("/IBC-Website/").slice(0, 2), ...navLinks("/").slice(2)];
  const env = loadScrollSpy({ pathname: "/_dev/layout-test/", links });
  assert.equal(env.observers.length, 0, "scroll-spy created an IntersectionObserver");
  assert.deepEqual(activeHashes(env.links), []);
});

test("scroll-spy ignores nav links without a hash", () => {
  const plain = createLink("/IBC-Website/", "/IBC-Website/");
  const links = [plain, ...navLinks("/IBC-Website/")];
  const env = loadScrollSpy({ pathname: "/IBC-Website/", links });
  env.intersect(env.sections.find((section) => section.getAttribute("id") === "about"));
  assert.equal(plain.classList.contains("active-nav"), false, "hash-less link was highlighted");
  assert.deepEqual(activeHashes(env.links), ["#about"]);
});
