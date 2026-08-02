/**
 * Shared helpers: dates, phones, DOM safety, modals, toasts.
 */

const MALAY_MONTHS = [
  'Januari',
  'Februari',
  'Mac',
  'April',
  'Mei',
  'Jun',
  'Julai',
  'Ogos',
  'September',
  'Oktober',
  'November',
  'Disember',
];

/**
 * Normalize Malaysian phone numbers to a consistent local format: 01XXXXXXXX
 */
export function normalizePhone(phone) {
  let cleaned = String(phone ?? '')
    .trim()
    .replace(/[\s-]/g, '');

  if (cleaned.startsWith('+60')) {
    cleaned = `0${cleaned.slice(3)}`;
  } else if (cleaned.startsWith('60') && cleaned.length >= 11) {
    cleaned = `0${cleaned.slice(2)}`;
  }

  return cleaned;
}

/**
 * Format date in Bahasa Melayu, e.g. "31 Julai 2026, 8:30 malam"
 */
export function formatMalayDateTime(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const day = date.getDate();
  const month = MALAY_MONTHS[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  let period = 'pagi';

  if (hours >= 12 && hours < 19) {
    period = 'petang';
  } else if (hours >= 19 || hours < 1) {
    period = 'malam';
  }

  let displayHour = hours % 12;
  if (displayHour === 0) displayHour = 12;

  return `${day} ${month} ${year}, ${displayHour}:${minutes} ${period}`;
}

/**
 * Format ISO date for display, e.g. "1 Januari 2027"
 */
export function formatMalayDate(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getDate()} ${MALAY_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function createSafeTextElement(tag, text, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.textContent = text;
  return el;
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.hidden = false;
  toast.className = `toast toast--${type} toast--visible`;
  toast.textContent = message;

  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => {
    toast.classList.remove('toast--visible');
    window.setTimeout(() => {
      toast.hidden = true;
      toast.textContent = '';
    }, 300);
  }, 4000);
}

let previouslyFocused = null;
let focusTrapHandler = null;

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  previouslyFocused = document.activeElement;
  modal.hidden = false;
  document.body.classList.add('modal-open');

  requestAnimationFrame(() => {
    modal.classList.add('modal--open');
  });

  const focusable = getFocusableElements(modal);
  const first = focusable[0];
  if (first) first.focus();

  focusTrapHandler = (event) => {
    if (event.key === 'Escape') {
      closeModal(modalId);
      return;
    }

    if (event.key !== 'Tab') return;

    const elements = getFocusableElements(modal);
    if (elements.length === 0) return;

    const firstEl = elements[0];
    const lastEl = elements[elements.length - 1];

    if (event.shiftKey && document.activeElement === firstEl) {
      event.preventDefault();
      lastEl.focus();
    } else if (!event.shiftKey && document.activeElement === lastEl) {
      event.preventDefault();
      firstEl.focus();
    }
  };

  document.addEventListener('keydown', focusTrapHandler);
}

export function closeModal(modalId, { immediate = false } = {}) {
  const modal = document.getElementById(modalId);
  if (!modal || modal.hidden) return;

  modal.classList.remove('modal--open');

  const stillOpen = Array.from(document.querySelectorAll('.modal')).some(
    (el) => el.id !== modalId && !el.hidden
  );
  if (!stillOpen) {
    document.body.classList.remove('modal-open');
  }

  if (focusTrapHandler) {
    document.removeEventListener('keydown', focusTrapHandler);
    focusTrapHandler = null;
  }

  const finish = () => {
    modal.hidden = true;
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
    previouslyFocused = null;
  };

  if (immediate || prefersReducedMotion()) {
    finish();
  } else {
    window.setTimeout(finish, 250);
  }
}

export function initModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.querySelectorAll('[data-modal-close]').forEach((el) => {
    el.addEventListener('click', () => closeModal(modalId));
  });
}

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter(
    (el) =>
      !el.hasAttribute('hidden') &&
      !el.closest('[hidden]') &&
      el.getClientRects().length > 0
  );
}

export function setButtonLoading(button, isLoading, loadingText, idleText) {
  if (!button) return;

  const textEl = button.querySelector('.btn__text');
  button.disabled = isLoading;
  button.classList.toggle('btn--loading', isLoading);
  button.setAttribute('aria-busy', String(isLoading));

  if (textEl) {
    textEl.textContent = isLoading ? loadingText : idleText;
  }
}

export function initScrollReveal() {
  const elements = document.querySelectorAll('.section, .fade-in');

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
}

export function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;

      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  });
}

export function startCountdown(targetIso, rootEl) {
  if (!rootEl) return () => {};

  const daysEl = rootEl.querySelector('[data-unit="days"]');
  const hoursEl = rootEl.querySelector('[data-unit="hours"]');
  const minutesEl = rootEl.querySelector('[data-unit="minutes"]');
  const secondsEl = rootEl.querySelector('[data-unit="seconds"]');
  const target = new Date(targetIso).getTime();

  const update = () => {
    const now = Date.now();
    let diff = Math.max(0, target - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * 1000 * 60 * 60 * 24;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * 1000 * 60 * 60;
    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * 1000 * 60;
    const seconds = Math.floor(diff / 1000);

    setCountdownValue(daysEl, days);
    setCountdownValue(hoursEl, hours);
    setCountdownValue(minutesEl, minutes);
    setCountdownValue(secondsEl, seconds);

    if (target - now <= 0) {
      rootEl.setAttribute('aria-label', 'Majlis telah bermula');
    }
  };

  update();
  const timer = window.setInterval(update, 1000);
  return () => window.clearInterval(timer);
}

function setCountdownValue(el, value) {
  if (!el) return;
  const next = String(value).padStart(2, '0');
  if (el.textContent !== next) {
    el.textContent = next;
    el.classList.remove('countdown__value--tick');
    // Force reflow for animation restart
    void el.offsetWidth;
    el.classList.add('countdown__value--tick');
  }
}
