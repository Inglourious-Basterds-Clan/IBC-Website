// PERF-07 / D-14 module checks: src/js/main.js loads feature modules through data-js hooks
// (initFeatures over a literal loader map), each module's init(el) is a no-op when its
// elements are missing, the lightbox and easter egg behave as before against a stub DOM,
// and the built pages carry exactly the hooks (and modules) they need.
import { test, before, afterEach } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build, read, attrValues, listFiles } from "./helpers.js";

const jsDir = fileURLToPath(new URL("../src/js/", import.meta.url));
const mainPath = join(jsDir, "main.js");
const hookNames = ["menu", "scroll-spy", "lightbox", "terminal", "easter-egg", "hash-redirect"];
const globalKeys = ["document", "window", "IntersectionObserver"];

afterEach(() => {
  for (const key of globalKeys) delete globalThis[key];
});

/* --- STUB DOM --- */
// A minimal element: classList and className share one class set, listeners are recorded
// so a test can count and fire them, and querySelector(All) answer from a lookup table.
function createStub(tagName = "div", { attrs = {}, find = {}, log = null } = {}) {
  const classes = new Set();
  const listeners = {};
  const el = {
    tagName: String(tagName).toUpperCase(),
    attrs: { ...attrs },
    children: [],
    parentNode: null,
    style: {},
    textContent: "",
    scrollTop: 0,
    scrollHeight: 100,
    listeners,
    get className() {
      return Array.from(classes).join(" ");
    },
    set className(value) {
      classes.clear();
      for (const name of String(value).split(/\s+/).filter(Boolean)) classes.add(name);
    },
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      toggle: (name) => (classes.has(name) ? (classes.delete(name), false) : (classes.add(name), true)),
      contains: (name) => classes.has(name),
    },
    getAttribute: (name) => (Object.hasOwn(el.attrs, name) ? el.attrs[name] : null),
    setAttribute: (name, value) => {
      el.attrs[name] = String(value);
    },
    addEventListener(type, handler) {
      (listeners[type] ||= []).push(handler);
    },
    fire(type, event = {}) {
      for (const handler of listeners[type] || []) handler({ target: el, preventDefault() {}, ...event });
    },
    append(...nodes) {
      for (const node of nodes) el.appendChild(node);
    },
    appendChild(node) {
      node.parentNode = el;
      el.children.push(node);
      return node;
    },
    insertBefore(node, ref) {
      node.parentNode = el;
      const index = el.children.indexOf(ref);
      el.children.splice(index === -1 ? el.children.length : index, 0, node);
      return node;
    },
    querySelector: (selector) => (Object.hasOwn(find, selector) ? [].concat(find[selector])[0] ?? null : null),
    querySelectorAll: (selector) => (Object.hasOwn(find, selector) ? [].concat(find[selector]) : []),
  };
  // Optional property-write log, so a test can check the order srcset/src are set in.
  if (log) {
    let srcset = "";
    let src = "";
    Object.defineProperty(el, "srcset", {
      get: () => srcset,
      set: (value) => {
        srcset = value;
        log.push(`${el.type || el.tagName}.srcset`);
      },
    });
    Object.defineProperty(el, "src", {
      get: () => src,
      set: (value) => {
        src = value;
        log.push(`${el.tagName}.src`);
      },
    });
  }
  return el;
}

function listenerCount(...elements) {
  return elements.reduce((sum, el) => sum + Object.values(el.listeners).flat().length, 0);
}

// Installs a document stub. byId answers getElementById, find answers querySelector(All).
function installDocument({ byId = {}, find = {}, log = null } = {}) {
  const doc = createStub("#document", { find });
  doc.body = { style: {} };
  doc.getElementById = (id) => (Object.hasOwn(byId, id) ? byId[id] : null);
  doc.createElement = (tagName) => createStub(tagName, { log });
  globalThis.document = doc;
  return doc;
}

async function loadModule(name) {
  const path = join(jsDir, "modules", `${name}.js`);
  assert.ok(existsSync(path), `src/js/modules/${name}.js does not exist`);
  return import(pathToFileURL(path).href);
}

// main.js calls initFeatures(document, …) at the top level: an empty document keeps that inert.
async function loadMain() {
  installDocument();
  return import(pathToFileURL(mainPath).href);
}

// A root whose querySelectorAll('[data-js]') returns the given hook elements in order.
function hookRoot(names) {
  const hooks = names.map((name) => createStub("div", { attrs: { "data-js": name } }));
  return { hooks, root: createStub("main", { find: { "[data-js]": hooks } }) };
}

// Spy loaders: each records its call and hands back a module whose init records its element.
function spyLoaders(names) {
  const calls = [];
  const inits = [];
  const loaders = {};
  for (const name of names) {
    loaders[name] = () => {
      calls.push(name);
      return Promise.resolve({ init: (el) => inits.push({ name, el }) });
    };
  }
  return { loaders, calls, inits };
}

/* --- LOADER (initFeatures) --- */
test("initFeatures without hooks calls no loader and resolves", async () => {
  const { initFeatures } = await loadMain();
  const { root } = hookRoot([]);
  const spy = spyLoaders(hookNames);
  await initFeatures(root, spy.loaders);
  assert.deepEqual(spy.calls, []);
});

test("initFeatures loads only known hooks and passes the hook element to init", async () => {
  const { initFeatures } = await loadMain();
  const { root, hooks } = hookRoot(["terminal", "nope", "constructor", "__proto__"]);
  const spy = spyLoaders(["terminal", "lightbox"]);
  await initFeatures(root, spy.loaders);
  assert.deepEqual(spy.calls, ["terminal"]);
  assert.equal(spy.inits.length, 1);
  assert.equal(spy.inits[0].el, hooks[0]);
});

test("two elements with the same hook each get their own init call", async () => {
  const { initFeatures } = await loadMain();
  const { root, hooks } = hookRoot(["lightbox", "lightbox"]);
  const spy = spyLoaders(["lightbox"]);
  await initFeatures(root, spy.loaders);
  assert.deepEqual(spy.inits.map((entry) => entry.el), hooks);
});

test("loaders are called in the document order of the hooks", async () => {
  const { initFeatures } = await loadMain();
  const order = ["easter-egg", "menu", "terminal", "scroll-spy", "lightbox"];
  const { root } = hookRoot(order);
  const spy = spyLoaders(hookNames);
  await initFeatures(root, spy.loaders);
  assert.deepEqual(spy.calls, order);
});

test("main.js maps every hook to a literal module import", () => {
  const source = readFileSync(mainPath, "utf8");
  for (const name of hookNames) {
    assert.ok(source.includes(`import('./modules/${name}.js' + version)`), `main.js has no literal import for ${name}`);
  }
  const imports = Array.from(source.matchAll(/import\((.)/g), (match) => match[1]);
  assert.equal(imports.length, hookNames.length, `expected ${hookNames.length} import() calls, found ${imports.length}`);
  for (const quote of imports) assert.ok(quote === "'" || quote === '"', "an import() specifier is not a string literal");
});

/* --- NO-OP GUARDS --- */
test("menu init is a no-op without its hook element or the nav list", async () => {
  const { init } = await loadModule("menu");
  const doc = installDocument();
  assert.doesNotThrow(() => init(null));
  const toggle = createStub("button");
  assert.doesNotThrow(() => init(toggle));
  assert.equal(listenerCount(toggle, doc), 0, "menu attached a listener without nav ul");
});

test("lightbox init is a no-op without the lightbox elements or gallery items", async () => {
  const { init } = await loadModule("lightbox");
  const item = createStub("div", { attrs: { "data-lightbox-jpeg": "a.jpg" } });
  const grid = createStub("div", { find: { ".gallery-item": [item] } });
  const doc = installDocument();
  assert.doesNotThrow(() => init(null));
  assert.doesNotThrow(() => init(grid));
  assert.equal(listenerCount(grid, item, doc), 0, "lightbox attached a listener without #lightbox");

  const env = lightboxDom([]);
  assert.doesNotThrow(() => init(env.grid));
  assert.equal(listenerCount(env.lightbox, env.closeBtn, env.prevBtn, env.nextBtn, env.doc), 0, "lightbox attached a listener without items");
});

test("easter-egg init is a no-op without its hook element, overlay or close button", async () => {
  const { init } = await loadModule("easter-egg");
  const doc = installDocument();
  assert.doesNotThrow(() => init(null));
  const trigger = createStub("span");
  assert.doesNotThrow(() => init(trigger));
  assert.equal(listenerCount(trigger, doc), 0, "easter egg attached a listener without the overlay");
});

/* --- LIGHTBOX BEHAVIOUR --- */
const galleryData = [
  { avif: "/img/a-1600.avif", webp: "/img/a-1600.webp", jpeg: "/img/a-1600.jpeg", title: "Alfa", desc: "Pierwsze" },
  { avif: "/img/b-1600.avif", webp: "/img/b-1600.webp", jpeg: "/img/b-1600.jpeg", title: "Bravo", desc: "Drugie" },
];

function lightboxDom(data) {
  const log = [];
  const items = data.map((entry) =>
    createStub("div", {
      attrs: { "data-lightbox-avif": entry.avif, "data-lightbox-webp": entry.webp, "data-lightbox-jpeg": entry.jpeg },
      find: { h3: Object.assign(createStub("h3"), { textContent: entry.title }), p: Object.assign(createStub("p"), { textContent: entry.desc }) },
    }));
  const grid = createStub("div", { find: { ".gallery-item": items } });
  const picture = createStub("picture");
  const img = createStub("img", { log });
  picture.appendChild(img);
  const lightbox = createStub("div");
  lightbox.className = "lightbox";
  const captionEl = createStub("div");
  const closeBtn = createStub("button");
  const prevBtn = createStub("button");
  const nextBtn = createStub("button");
  const doc = installDocument({
    byId: { lightbox },
    find: {
      ".lightbox-content img": img,
      ".lightbox-caption": captionEl,
      ".lightbox-close": closeBtn,
      ".lightbox-prev": prevBtn,
      ".lightbox-next": nextBtn,
    },
    log,
  });
  return { log, items, grid, picture, img, lightbox, captionEl, closeBtn, prevBtn, nextBtn, doc };
}

test("lightbox opens item 0 with avif/webp sources set before img.src, and ArrowRight shows item 1", async () => {
  const { init } = await loadModule("lightbox");
  const env = lightboxDom(galleryData);
  init(env.grid);
  env.items[0].fire("click");

  const [avif, webp, img] = env.picture.children;
  assert.equal(env.picture.children.length, 3, "expected two <source>s before the <img>");
  assert.deepEqual([avif.tagName, avif.type, webp.tagName, webp.type, img], ["SOURCE", "image/avif", "SOURCE", "image/webp", env.img]);
  assert.equal(avif.srcset, galleryData[0].avif);
  assert.equal(webp.srcset, galleryData[0].webp);
  assert.equal(env.img.src, galleryData[0].jpeg);
  assert.deepEqual(env.log, ["image/avif.srcset", "image/webp.srcset", "IMG.src"]);
  assert.equal(env.captionEl.textContent, "Alfa // Pierwsze");

  env.doc.fire("keydown", { key: "ArrowRight" });
  assert.equal(avif.srcset, galleryData[1].avif);
  assert.equal(webp.srcset, galleryData[1].webp);
  assert.equal(env.img.src, galleryData[1].jpeg);
  assert.equal(env.picture.children.length, 3, "sources were inserted twice");
});

/* --- STATE CLASSES (D-12): is-open instead of style.display --- */
test("lightbox open adds is-open; Escape and the close button remove it; arrows act only while open", async () => {
  const { init } = await loadModule("lightbox");
  const env = lightboxDom(galleryData);
  init(env.grid);

  env.items[0].fire("keydown", { key: "Enter" });
  assert.ok(env.lightbox.classList.contains("is-open"), "Enter on an item did not add is-open");
  assert.ok(env.lightbox.classList.contains("lightbox"), "the base lightbox class was lost");
  env.doc.fire("keydown", { key: "Escape" });
  assert.equal(env.lightbox.classList.contains("is-open"), false, "Escape did not remove is-open");

  env.items[1].fire("click");
  assert.ok(env.lightbox.classList.contains("is-open"));
  env.closeBtn.fire("click");
  assert.equal(env.lightbox.classList.contains("is-open"), false, "the close button did not remove is-open");

  env.items[0].fire("click");
  env.lightbox.fire("click", { target: env.lightbox });
  assert.equal(env.lightbox.classList.contains("is-open"), false, "an outer click did not remove is-open");

  const before = env.img.src;
  env.doc.fire("keydown", { key: "ArrowRight" });
  assert.equal(env.img.src, before, "ArrowRight acted while the lightbox was closed");
  assert.equal(env.lightbox.style.display, undefined, "lightbox wrote style.display");
});

function easterEggDom({ withTerminal = false } = {}) {
  const trigger = createStub("span");
  const overlay = createStub("div");
  overlay.className = "decryption-overlay";
  const closeBtn = createStub("button");
  const consoleEl = createStub("div");
  const byId = { "decryption-overlay": overlay, "decryption-close": closeBtn };
  if (withTerminal) byId["terminal-console"] = consoleEl;
  const doc = installDocument({ byId });
  return { trigger, overlay, closeBtn, consoleEl, doc };
}

test("easter egg open adds is-open to the overlay; close and an outer click remove it", async () => {
  const { init } = await loadModule("easter-egg");
  const env = easterEggDom();
  init(env.trigger);

  env.trigger.fire("click");
  assert.ok(env.overlay.classList.contains("is-open"), "click did not add is-open");
  env.closeBtn.fire("click");
  assert.equal(env.overlay.classList.contains("is-open"), false, "the close button did not remove is-open");

  env.trigger.fire("keydown", { key: " " });
  assert.ok(env.overlay.classList.contains("is-open"), "Space did not add is-open");
  env.overlay.fire("click", { target: env.overlay });
  assert.equal(env.overlay.classList.contains("is-open"), false, "an outer click did not remove is-open");
  assert.ok(env.overlay.classList.contains("decryption-overlay"), "the base overlay class was lost");
  assert.equal(env.overlay.style.display, undefined, "easter egg wrote style.display");
});

test("easter egg appends a terminal-line-alert line built from textContent spans", async () => {
  const { init } = await loadModule("easter-egg");
  const env = easterEggDom({ withTerminal: true });
  init(env.trigger);
  env.trigger.fire("click");

  assert.equal(env.consoleEl.children.length, 1, "no line appended to the terminal");
  const [line] = env.consoleEl.children;
  assert.deepEqual(line.className.split(" ").sort(), ["terminal-line", "terminal-line-alert"]);
  assert.deepEqual(line.children.map((span) => span.className), ["time", "tag", "message"]);
  const [time, tag, message] = line.children;
  assert.match(time.textContent, /^\d{2}:\d{2}:\d{2}$/);
  assert.equal(tag.textContent, "[WARN]");
  assert.equal(message.textContent, "RAPORT DIABLO UJAWNIONY. PROTOKÓŁ ZŁAMANY.");
  for (const span of line.children) assert.deepEqual(span.style, {}, `${span.className} span has an inline style`);
});

/* --- BUILD OUTPUT --- */
let rootDir;
let devDir;

before(() => {
  rootDir = build("modules-root");
  devDir = build("modules-dev", { INCLUDE_DEV_PAGES: "1" });
});

function pages(outDir) {
  return listFiles(outDir, [".html"]).map((path) => ({ rel: relative(outDir, path).replaceAll("\\", "/"), html: readFileSync(path, "utf8") }));
}

test("index.html has exactly one hook for each feature", () => {
  for (const outDir of [rootDir, devDir]) {
    const hooks = attrValues(read(outDir, "index.html"), "data-js");
    for (const name of hookNames) {
      assert.equal(hooks.filter((hook) => hook === name).length, 1, `index.html: expected one data-js="${name}", got ${JSON.stringify(hooks)}`);
    }
    assert.equal(hooks.length, hookNames.length, `index.html has unexpected hooks: ${JSON.stringify(hooks)}`);
  }
});

test("404 and dev pages carry no lightbox or terminal hook", () => {
  const checked = pages(devDir).filter(({ rel }) => rel === "404.html" || /^_dev\/.+\/index\.html$/.test(rel));
  assert.ok(checked.length >= 2, `expected 404.html and the dev pages, found ${checked.map((page) => page.rel)}`);
  assert.ok(pages(rootDir).some(({ rel }) => rel === "404.html"), "root build has no 404.html");
  for (const { rel, html } of [...checked, ...pages(rootDir).filter((page) => page.rel === "404.html")]) {
    const hooks = attrValues(html, "data-js");
    assert.ok(!hooks.includes("lightbox"), `${rel} carries the lightbox hook`);
    assert.ok(!hooks.includes("terminal"), `${rel} carries the terminal hook`);
  }
});

test("every page has exactly one script with a src: the module main.js", () => {
  for (const outDir of [rootDir, devDir]) {
    for (const { rel, html } of pages(outDir)) {
      const scripts = Array.from(html.matchAll(/<script\b[^>]*\ssrc="[^"]*"[^>]*>/g), (match) => match[0]);
      assert.equal(scripts.length, 1, `${rel}: expected one script with a src, found ${JSON.stringify(scripts)}`);
      assert.ok(/\stype="module"/.test(scripts[0]) && /\ssrc="\/js\/main\.js\?v=[0-9a-f]{10}"/.test(scripts[0]), `${rel}: ${scripts[0]}`);
    }
  }
});

test("every data-js hook in the output has its module file", () => {
  for (const outDir of [rootDir, devDir]) {
    const seen = new Set(pages(outDir).flatMap(({ html }) => attrValues(html, "data-js")));
    assert.ok(seen.size > 0, "no data-js hooks in the output");
    for (const hook of seen) {
      assert.ok(existsSync(join(outDir, "js", "modules", `${hook}.js`)), `js/modules/${hook}.js missing for data-js="${hook}"`);
    }
  }
});
