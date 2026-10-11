/* --- TACTICAL GALLERY LIGHTBOX --- */
// Hook: data-js="lightbox" on .gallery-grid. The lightbox itself lives in the page body.
export function init(el) {
  if (!el) return;
  const lightbox = document.getElementById('lightbox');
  const imgEl = document.querySelector('.lightbox-content img');
  const captionEl = document.querySelector('.lightbox-caption');
  const closeBtn = document.querySelector('.lightbox-close');
  const prevBtn = document.querySelector('.lightbox-prev');
  const nextBtn = document.querySelector('.lightbox-next');
  const items = el.querySelectorAll('.gallery-item');

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
    lightbox.classList.add('is-open');
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
    lightbox.classList.remove('is-open');
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
    if (lightbox.classList.contains('is-open')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
    }
  });
}
