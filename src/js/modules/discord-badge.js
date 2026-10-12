/* --- LIVE DISCORD BADGE --- */
// Hook: data-js="discord-badge". Any failure keeps the baked text.
const isCount = n => Number.isInteger(n) && n >= 0;
const words = { one: 'osoba', few: 'osoby' };

export function init(el) {
  if (!el) return;
  const url = el.getAttribute('data-api-url') || '';
  const membersEl = el.querySelector('.discord-badge-members');
  const onlineEl = el.querySelector('.discord-badge-online');
  if (!url.startsWith('https://discord.com/api/') || !membersEl || !onlineEl || typeof IntersectionObserver !== 'function') return;

  let started = false;
  const observer = new IntersectionObserver(entries => {
    if (started || !entries.some(entry => entry.isIntersecting)) return;
    started = true;
    observer.disconnect();
    // Safari 15 has no AbortSignal.timeout.
    const signal = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(5000) : undefined;
    fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer', signal })
      .then(response => (response.ok ? response.json() : null))
      .then(body => {
        const members = body && body.approximate_member_count;
        const online = body && body.approximate_presence_count;
        if (!isCount(members)) return;
        membersEl.textContent = members + ' ' + (words[new Intl.PluralRules('pl-PL').select(members)] || 'osób');
        if (isCount(online)) onlineEl.textContent = ' · ' + online + ' online';
      })
      .catch(() => {});
  }, { rootMargin: '200px' });
  observer.observe(el);
}
