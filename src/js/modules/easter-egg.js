/* --- EASTER EGG DECRYPTION CONSOLE --- */
// Hook: data-js="easter-egg" on the footer #easteregg-trigger.
export function init(el) {
  if (!el) return;
  const overlay = document.getElementById('decryption-overlay');
  const closeBtn = document.getElementById('decryption-close');

  if (!overlay || !closeBtn) return;

  const openEasterEgg = () => {
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Lock scrolling

    // Log to recruitment terminal console if exists (looked up now, so module order never matters)
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

  el.addEventListener('click', openEasterEgg);
  el.addEventListener('keydown', (e) => {
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
