document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initLightbox();
  initRecruitmentTerminal();
  initScrollSpy();
  initEasterEgg();
});



/* --- MOBILE MENU --- */
function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const navList = document.querySelector('nav ul');
  const navLinks = document.querySelectorAll('nav ul li a');
  
  if (toggle && navList) {
    toggle.addEventListener('click', () => {
      navList.classList.toggle('active');
      // Simple rotation of menu bars if needed, or toggle aria
      const isActive = navList.classList.contains('active');
      toggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navList.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
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
  
  if (!lightbox || items.length === 0) return;

  let currentIndex = 0;
  const imageSources = Array.from(items).map(item => ({
    src: item.getAttribute('data-src'),
    title: item.querySelector('h3').textContent,
    desc: item.querySelector('p').textContent
  }));

  function openLightbox(index) {
    currentIndex = index;
    updateLightboxContent();
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Lock background scroll
  }

  function updateLightboxContent() {
    const data = imageSources[currentIndex];
    imgEl.src = data.src;
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

  // Attach click to items
  items.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
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

/* --- TACTICAL RECRUITMENT TERMINAL --- */
function initRecruitmentTerminal() {
  const consoleEl = document.getElementById('terminal-console');
  if (!consoleEl) return;

  function writeToConsole(message, status = 'info') {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    
    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2, '0') + ':' + 
                    String(now.getMinutes()).padStart(2, '0') + ':' + 
                    String(now.getSeconds()).padStart(2, '0');
                    
    let tag = '[INFO]';
    if (status === 'success') tag = '[ OK ]';
    if (status === 'error') tag = '[ERR ]';
    if (status === 'warn') tag = '[WARN]';
    
    line.innerHTML = `
      <span class="time">${timeStr}</span>
      <span class="tag" style="color: ${status === 'success' ? 'var(--accent-color)' : status === 'error' ? '#ef4444' : 'var(--accent-color)'}">${tag}</span>
      <span class="message">${message}</span>
    `;
    
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight; // Autoscroll
  }

  // Simulated start sequence
  writeToConsole('Uruchamianie terminala zaciągowego IBC...');
  
  setTimeout(() => {
    writeToConsole('Wyszukiwanie aktywnego połączenia z serwerem Discord...', 'warn');
  }, 600);

  setTimeout(() => {
    writeToConsole('Połączenie nawiązane: discord.gg/DhJwkeehJK', 'success');
  }, 1400);

  setTimeout(() => {
    writeToConsole('Status rekrutacji klanu: OTWARTA (OPEN)', 'success');
    writeToConsole('Wskazówka: Użyj przycisku obok, aby dołączyć do serwera Discord klanu i złożyć podanie.', 'warn');
  }, 2200);
}

/* --- ACTIVE NAVIGATION HIGH-LIGHT ON SCROLL --- */
function initScrollSpy() {
  const sections = document.querySelectorAll('section, header');
  const navLinks = document.querySelectorAll('nav ul li a');
  
  if (navLinks.length === 0) return;

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 120; // Offset for header height
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id') || '';
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active-nav');
      const href = link.getAttribute('href');
      if (href === `#${current}` || (current === 'hero' && href === '#hero')) {
        link.classList.add('active-nav');
      }
    });
  });
}

/* --- EASTER EGG DECRYPTION CONSOLE --- */
function initEasterEgg() {
  const trigger = document.getElementById('easteregg-trigger');
  const overlay = document.getElementById('decryption-overlay');
  const closeBtn = document.getElementById('decryption-close');
  
  if (!trigger || !overlay || !closeBtn) return;

  trigger.addEventListener('click', () => {
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


