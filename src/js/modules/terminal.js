/* --- TACTICAL RECRUITMENT TERMINAL --- */
// Hook: data-js="terminal" on #terminal-console. The invite comes only from its
// data-discord-url attribute (build-time config) and is written with textContent.
export function init(el) {
  if (!el) return;
  const discordUrl = el.getAttribute('data-discord-url') || '';
  const recSection = document.getElementById('recruitment');
  if (!recSection) return;

  let booted = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !booted) {
        booted = true;
        runBootSequence(el, discordUrl);
      }
    });
  }, { threshold: 0.3 });

  observer.observe(recSection);
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
