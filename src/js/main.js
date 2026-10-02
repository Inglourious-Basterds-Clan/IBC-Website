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

/* --- TACTICAL RECRUITMENT TERMINAL --- */
function initRecruitmentTerminal() {
  const consoleEl = document.getElementById('terminal-console');
  if (!consoleEl) return;
  const discordUrl = consoleEl.getAttribute('data-discord-url') || '';

  let booted = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !booted) {
        booted = true;
        runBootSequence(consoleEl, discordUrl);
      }
    });
  }, { threshold: 0.3 });

  const recSection = document.getElementById('recruitment');
  if (recSection) observer.observe(recSection);
}

function runBootSequence(consoleEl, discordUrl) {
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
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'time';
    timeSpan.textContent = timeStr;

    const tagSpan = document.createElement('span');
    tagSpan.className = 'tag';
    tagSpan.style.color = status === 'success' ? 'var(--accent-color)' : status === 'error' ? '#ef4444' : 'var(--accent-color)';
    tagSpan.textContent = tag;

    const messageSpan = document.createElement('span');
    messageSpan.className = 'message';
    messageSpan.textContent = message;

    line.append(timeSpan, tagSpan, messageSpan);

    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight; // Autoscroll
  }

  // Simulated start sequence
  writeToConsole('Uruchamianie terminala zaciągowego IBC...');
  
  setTimeout(() => {
    writeToConsole('Wyszukiwanie aktywnego połączenia z serwerem Discord...', 'warn');
  }, 600);

  setTimeout(() => {
    writeToConsole('Połączenie nawiązane: ' + discordUrl.replace(/^https?:\/\//, ''), 'success');
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

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id') || (entry.target.tagName === 'HEADER' ? 'hero' : '');
        if (id) {
          navLinks.forEach(link => {
            link.classList.remove('active-nav');
            const href = link.getAttribute('href');
            if (href === `#${id}`) link.classList.add('active-nav');
          });
        }
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sections.forEach(section => observer.observe(section));
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


