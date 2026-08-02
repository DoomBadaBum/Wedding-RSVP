import { prefersReducedMotion } from './utils.js';

/**
 * Closed-envelope intro matching the letter template.
 * Click opens the flap, reveals maroon card + florals, then shows the site.
 */
export function initEnvelopeIntro(config) {
  const intro = document.getElementById('envelope-intro');
  const openBtn = document.getElementById('open-envelope');
  if (!intro || !openBtn) return;

  // Refresh can restore the previous scroll position under the intro overlay.
  // Keep guests at the top until they open the letter.
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

  const cardDate = document.getElementById('letter-card-date');
  const cardPlace = document.getElementById('letter-card-place');

  if (config?.event?.date) {
    const d = new Date(config.event.date);
    const formatted = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    if (cardDate) cardDate.textContent = formatted;
  }

  if (cardPlace && config?.event?.venue) {
    cardPlace.textContent = config.event.venue;
  }

  let opened = false;

  const finish = () => {
    intro.hidden = true;
    intro.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('envelope-locked');
    document.body.classList.add('envelope-opened');
    window.scrollTo(0, 0);
    const mainFocus = document.getElementById('utama') || document.body;
    if (typeof mainFocus.focus === 'function') {
      mainFocus.setAttribute('tabindex', '-1');
      mainFocus.focus({ preventScroll: true });
    }
  };

  const openEnvelope = () => {
    if (opened) return;
    opened = true;
    openBtn.disabled = true;
    window.scrollTo(0, 0);

    if (prefersReducedMotion()) {
      intro.classList.add('is-open', 'is-done');
      finish();
      return;
    }

    intro.classList.add('is-opening');
    window.requestAnimationFrame(() => intro.classList.add('is-open'));

    window.setTimeout(() => intro.classList.add('is-done'), 2400);
    window.setTimeout(finish, 3250);
  };

  openBtn.addEventListener('click', openEnvelope);
  openBtn.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEnvelope();
    }
  });

  // Some browsers restore scroll after load / bfcache; keep the intro at the top.
  window.addEventListener('pageshow', () => {
    if (!opened) window.scrollTo(0, 0);
  });
}
