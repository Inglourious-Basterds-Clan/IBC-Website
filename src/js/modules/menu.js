/* --- MOBILE MENU --- */
// Hook: data-js="menu" on the header .menu-toggle button.
export function init(el) {
  if (!el) return;
  const navList = document.querySelector('nav ul');
  if (!navList) return;
  const navLinks = document.querySelectorAll('nav ul li a');

  el.addEventListener('click', () => {
    navList.classList.toggle('active');
    el.classList.toggle('open');
    const isActive = navList.classList.contains('active');
    el.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    document.body.style.overflow = isActive ? 'hidden' : '';
  });

  // Close menu when a link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navList.classList.remove('active');
      el.classList.remove('open');
      el.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}
