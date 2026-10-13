/* --- TACTICAL RECRUITMENT TERMINAL --- */
// Hook: data-js="terminal" on #terminal-console; boots when its enclosing section is seen.
// The invite comes only from data-discord-url (build-time config), written with textContent.
export function init(el) {
  if (!el) return;
  const discordUrl = el.getAttribute('data-discord-url') || '';
  const recSection = el.closest('section');
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

// One terminal line: time, tag and message spans, all written with textContent. The tag
// colour is inherited from .terminal-body; an error tag adds a class, never an inline style (D-12).
export function writeToConsole(consoleEl, message, status = 'info') {
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
  tagSpan.className = status === 'error' ? 'tag tag-error' : 'tag';
  tagSpan.textContent = tag;

  const messageSpan = document.createElement('span');
  messageSpan.className = 'message';
  messageSpan.textContent = message;

  line.append(timeSpan, tagSpan, messageSpan);

  consoleEl.appendChild(line);
  consoleEl.scrollTop = consoleEl.scrollHeight; // Autoscroll
}

function runBootSequence(consoleEl, discordUrl) {
  // Simulated start sequence
  writeToConsole(consoleEl, 'Uruchamianie terminala zaciągowego IBC...');

  setTimeout(() => {
    writeToConsole(consoleEl, 'Wyszukiwanie aktywnego połączenia z serwerem Discord...', 'warn');
  }, 600);

  setTimeout(() => {
    writeToConsole(consoleEl, 'Połączenie nawiązane: ' + discordUrl.replace(/^https?:\/\//, ''), 'success');
  }, 1400);

  setTimeout(() => {
    writeToConsole(consoleEl, 'Status rekrutacji klanu: OTWARTA (OPEN)', 'success');
    writeToConsole(consoleEl, 'Wskazówka: Użyj przycisku obok, aby dołączyć do serwera Discord klanu i złożyć podanie.', 'warn');
  }, 2200);
}
