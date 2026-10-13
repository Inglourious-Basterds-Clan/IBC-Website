/* --- FEATURE LOADER (D-14) --- */
// Module entry. Every page loads this file as <script type="module">, so it runs after the
// DOM is parsed. Each [data-js] element names a feature; the name is only a key into the
// frozen loader map below, and a module specifier is never built from attribute text.
// Literal relative specifiers resolve against this file's own URL, so they work at the
// site root and under a path prefix alike. A page fetches only the modules it has hooks for.
// WR-01: the build's ?v=<hash> on this file's URL is appended to each module URL, so a
// deploy never mixes cached modules with new HTML. Hook text still only selects a key.
const version = new URL(import.meta.url).search;
const loaders = Object.freeze({
  menu: () => import('./modules/menu.js' + version),
  lightbox: () => import('./modules/lightbox.js' + version),
  terminal: () => import('./modules/terminal.js' + version),
  'scroll-spy': () => import('./modules/scroll-spy.js' + version),
  'easter-egg': () => import('./modules/easter-egg.js' + version),
  'discord-badge': () => import('./modules/discord-badge.js' + version),
  'hash-redirect': () => import('./modules/hash-redirect.js' + version)
});

export function initFeatures(root, featureLoaders) {
  const hooks = Array.from(root.querySelectorAll('[data-js]'));
  return Promise.all(hooks.map(el => {
    const name = el.getAttribute('data-js');
    // Unknown names (and inherited keys such as "constructor") load nothing.
    if (!Object.prototype.hasOwnProperty.call(featureLoaders, name)) return null;
    return featureLoaders[name]().then(mod => mod.init(el));
  }));
}

initFeatures(document, loaders);
