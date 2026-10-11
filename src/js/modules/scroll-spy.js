/* --- ACTIVE NAVIGATION HIGH-LIGHT ON SCROLL --- */
// Hook: data-js="scroll-spy" on the header <nav>.
export function init(el) {
  if (!el) return;
  // Only links that point at this same document (home); on other pages scroll-spy is a no-op.
  const navLinks = Array.from(el.querySelectorAll('ul li a'))
    .filter(link => link.hash && link.pathname === window.location.pathname);

  if (navLinks.length === 0) return;

  const sections = document.querySelectorAll('section, header');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id') || (entry.target.tagName === 'HEADER' ? 'hero' : '');
        if (id) {
          navLinks.forEach(link => {
            link.classList.remove('active-nav');
            if (link.hash === '#' + id) link.classList.add('active-nav');
          });
        }
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sections.forEach(section => observer.observe(section));
}
