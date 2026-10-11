/* --- EASTER EGG DECRYPTION CONSOLE --- */
// Hook: data-js="easter-egg" on the footer #easteregg-trigger.
export function init(el) {
  if (!el) return;
  const overlay = document.getElementById('decryption-overlay');
  const closeBtn = document.getElementById('decryption-close');

  if (!overlay || !closeBtn) return;

  const closeEasterEgg = () => {
    overlay.classList.remove('is-open');
    document.body.style.overflow = 'auto'; // Unlock scrolling
  };

  const openEasterEgg = () => {
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden'; // Lock scrolling

    // Log to recruitment terminal console if exists (looked up now, so module order never matters)
    const consoleEl = document.getElementById('terminal-console');
    if (consoleEl) {
      const line = document.createElement('div');
      // The alert colour comes from .terminal-line-alert in the stylesheet (D-12)
      line.className = 'terminal-line terminal-line-alert';
      const now = new Date();
      const timeStr = String(now.getHours()).padStart(2, '0') + ':' +
                      String(now.getMinutes()).padStart(2, '0') + ':' +
                      String(now.getSeconds()).padStart(2, '0');
      const parts = [
        { className: 'time', text: timeStr },
        { className: 'tag', text: '[WARN]' },
        { className: 'message', text: 'RAPORT DIABLO UJAWNIONY. PROTOKÓŁ ZŁAMANY.' }
      ];
      parts.forEach(part => {
        const span = document.createElement('span');
        span.className = part.className;
        span.textContent = part.text;
        line.appendChild(span);
      });
      consoleEl.appendChild(line);
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
  };

  el.addEventListener('click', openEasterEgg);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openEasterEgg();
    }
  });

  closeBtn.addEventListener('click', closeEasterEgg);

  // Close on outer click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeEasterEgg();
  });
}
