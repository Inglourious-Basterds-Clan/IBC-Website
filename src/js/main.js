/* --- FEATURE LOADER (D-14) --- */
// Module entry. Every page loads this file as <script type="module">, so it runs after the
// DOM is parsed. Each [data-js] element names a feature; the name is only a key into the
// frozen loader map below, and a module specifier is never built from attribute text.
// Literal relative specifiers resolve against this file's own URL, so they work at the
// site root and under a path prefix alike.
const loaders = Object.freeze({
  terminal: () => import('./modules/terminal.js'),
  'scroll-spy': () => import('./modules/scroll-spy.js')
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

/* --- MOBILE MENU --- */
function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const navList = document.querySelector('nav ul');
  const navLinks = document.querySelectorAll('nav ul li a');

  if (toggle && navList) {
    toggle.addEventListener('click', () => {
      navList.classList.toggle('active');
      toggle.classList.toggle('open');
      const isActive = navList.classList.contains('active');
      toggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      document.body.style.overflow = isActive ? 'hidden' : '';
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navList.classList.remove('active');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }
}

/* --- TACTICAL GALLERY LIGHTBOX --- */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const imgEl = document.querySelector('.lightbox-content img');
  const captionEl = document.querySelector('.lightbox-caption');
  const closeBtn = document.querySelector('.lightbox-close');
  const prevBtn = document.querySelector('.lightbox-prev');
  const nextBtn = document.querySelector('.lightbox-next');
  const items = document.querySelectorAll('.gallery-item');

  if (!lightbox || !imgEl || !captionEl || !closeBtn || !prevBtn || !nextBtn || items.length === 0) return;

  let currentIndex = 0;
  let avifSource = null;
  let webpSource = null;
  const imageSources = Array.from(items).map(item => ({
    avif: item.getAttribute('data-lightbox-avif'),
    webp: item.getAttribute('data-lightbox-webp'),
    jpeg: item.getAttribute('data-lightbox-jpeg'),
    title: item.querySelector('h3').textContent,
    desc: item.querySelector('p').textContent
  }));

  // The lightbox <picture> ships without <source>s so nothing downloads before the first open.
  function ensureSources() {
    if (avifSource) return;
    const types = ['image/avif', 'image/webp'];
    const created = types.map(type => {
      const source = document.createElement('source');
      source.type = type;
      imgEl.parentNode.insertBefore(source, imgEl);
      return source;
    });
    avifSource = created[0];
    webpSource = created[1];
  }

  function openLightbox(index) {
    currentIndex = index;
    updateLightboxContent();
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Lock background scroll
  }

  function updateLightboxContent() {
    const data = imageSources[currentIndex];
    ensureSources();
    avifSource.srcset = data.avif;
    webpSource.srcset = data.webp;
    // Set the img src last: changing it makes the browser pick a source again.
    imgEl.src = data.jpeg;
    captionEl.textContent = `${data.title} // ${data.desc}`;
  }

  function closeLightbox() {
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto'; // Unlock background scroll
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % imageSources.length;
    updateLightboxContent();
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + imageSources.length) % imageSources.length;
    updateLightboxContent();
  }

  // Attach click and keyboard events to items
  items.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(index);
      }
    });
  });

  // Controls
  closeBtn.addEventListener('click', closeLightbox);
  nextBtn.addEventListener('click', showNext);
  prevBtn.addEventListener('click', showPrev);

  // Close on outer click
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (lightbox.style.display === 'flex') {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
    }
  });
}

/* --- EASTER EGG DECRYPTION CONSOLE --- */
function initEasterEgg() {
  const trigger = document.getElementById('easteregg-trigger');
  const overlay = document.getElementById('decryption-overlay');
  const closeBtn = document.getElementById('decryption-close');

  if (!trigger || !overlay || !closeBtn) return;

  const openEasterEgg = () => {
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Lock scrolling

    // Log to recruitment terminal console if exists
    const consoleEl = document.getElementById('terminal-console');
    if (consoleEl) {
      const line = document.createElement('div');
      line.className = 'terminal-line';
      const now = new Date();
      const timeStr = String(now.getHours()).padStart(2, '0') + ':' +
                      String(now.getMinutes()).padStart(2, '0') + ':' +
                      String(now.getSeconds()).padStart(2, '0');
      line.innerHTML = `
        <span class="time">${timeStr}</span>
        <span class="tag" style="color: #ef4444">[WARN]</span>
        <span class="message" style="color: #ef4444">RAPORT DIABLO UJAWNIONY. PROTOKÓŁ ZŁAMANY.</span>
      `;
      consoleEl.appendChild(line);
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
  };

  trigger.addEventListener('click', openEasterEgg);
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openEasterEgg();
    }
  });

  closeBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto'; // Unlock scrolling
  });

  // Close on outer click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });
}

// Module scripts are deferred, so the DOM is ready here (no DOMContentLoaded needed).
initMobileMenu();
initLightbox();
initEasterEgg();
initFeatures(document, loaders);
