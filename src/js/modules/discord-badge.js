/* --- LIVE DISCORD BADGE --- */
// Hook: data-js="discord-badge". Fetches only its data-api-url (a discord.com API URL).
export function init(el) {
  if (!el) return;
  const apiUrl = el.getAttribute('data-api-url') || '';
  const membersEl = el.querySelector('.discord-badge-members');
  const onlineEl = el.querySelector('.discord-badge-online');
  if (!apiUrl.startsWith('https://discord.com/api/') || !membersEl || !onlineEl) return;
  if (typeof IntersectionObserver !== 'function') return;

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    updateBadge(apiUrl, membersEl, onlineEl);
  }, { rootMargin: '200px' });
  observer.observe(el);
}

const isCount = value => Number.isInteger(value) && value >= 0;

function personWord(n) {
  const category = new Intl.PluralRules('pl-PL').select(n);
  if (category === 'one') return 'osoba';
  if (category === 'few') return 'osoby';
  return 'osób';
}

// Any failure keeps the baked text.
function updateBadge(apiUrl, membersEl, onlineEl) {
  const timeout = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function';
  return fetch(apiUrl, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: timeout ? AbortSignal.timeout(5000) : undefined })
    .then(response => (response.ok ? response.json() : null))
    .then(body => {
      if (!body || !isCount(body.approximate_member_count)) return;
      const members = body.approximate_member_count;
      const online = body.approximate_presence_count;
      membersEl.textContent = members + ' ' + personWord(members);
      if (isCount(online)) onlineEl.textContent = ' · ' + online + ' online';
    })
    .catch(() => {});
}
