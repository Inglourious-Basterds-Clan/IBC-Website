/* --- FEATURE LOADER (D-14) --- */
// Module entry. Every page loads this file as <script type="module">, so it runs after the
// DOM is parsed. Each [data-js] element names a feature; the name is only a key into the
// frozen loader map below, and a module specifier is never built from attribute text.
// Literal relative specifiers resolve against this file's own URL, so they work at the
// site root and under a path prefix alike. A page fetches only the modules it has hooks for.
const loaders = Object.freeze({
  menu: () => import('./modules/menu.js'),
  lightbox: () => import('./modules/lightbox.js'),
  terminal: () => import('./modules/terminal.js'),
  'scroll-spy': () => import('./modules/scroll-spy.js'),
  'easter-egg': () => import('./modules/easter-egg.js')
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
