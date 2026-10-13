/* --- LEGACY HASH REDIRECT --- */
// Hook: data-js="hash-redirect"; old #hashes follow the href of a[data-legacy-hash].
export function init(el) {
  if (!el) return;
  const links = Array.from(el.querySelectorAll('a[data-legacy-hash]'));
  if (links.length === 0) return;

  function redirect() {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    // Exact match only; the target is the link's own build-time href.
    const link = links.find(candidate => candidate.getAttribute('data-legacy-hash') === hash);
    if (link) window.location.replace(link.href);
  }

  redirect();
  window.addEventListener('hashchange', redirect);
}
