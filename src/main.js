import './style.css';
import { initRsvpForm } from './rsvp.js';
import { initWishes } from './wishes.js';
import { initEnvelopeIntro } from './envelope.js';
import { initBackgroundMusic, playMusic } from './music.js';
import {
  formatMalayDate,
  initModal,
  openModal,
  closeModal,
  initScrollReveal,
  initSmoothAnchors,
  startCountdown,
  prefersReducedMotion,
} from './utils.js';

/**
 * Editable wedding configuration — update these values for your event.
 */
export const weddingConfig = {
  couple: {
    groom: 'Muhammad Danish Bin Shamsuri',
    bride: 'Nur Yasmin Imanina Binti Mazlan',
  },
  hosts: {
    father: 'MAZLAN BIN SABTHU',
    mother: 'ERNIE HAIRANI BINTI ABD JALIL',
  },
  invitationText:
    'Dengan penuh kesyukuran ke hadrat Allah SWT, kami dengan sukacitanya menjemput Tan Sri / Puan Sri / Dato’ / Datin / Tuan / Puan / Encik / Cik ke majlis perkahwinan puteri kami',
  contacts: [
    {
      name: 'Mazlan (Bapa Pengantin)',
      phone: '0178245464',
      whatsapp: '60178245464',
    },
    {
      name: 'Ernie (Ibu Pengantin)',
      phone: '0127181971',
      whatsapp: '60127181971',
    },
    {
      name: 'Batrisyia (Adik Pengantin)',
      phone: '01156461533',
      whatsapp: '601156461533',
    },
  ],
  event: {
    date: '2026-11-07T11:00:00+08:00',
    day: 'Sabtu',
    startTime: '11:00 pagi',
    endTime: '4:00 petang',
    bersandingTime: '12:00 tengah hari',
    venue: 'Orchid Event Space Larkin',
    address:
      'Level 4, Larkin Junction Mall, Jalan Larkin Perdana 2, Taman Larkin Perdana, 80350 Johor Bahru, Johor',
    dressCode: 'Formal',
    googleMapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Orchid+Event+Space+Larkin+Junction',
    wazeUrl:
      'https://waze.com/ul?q=Orchid%20Event%20Space%20Larkin%20Junction&navigate=yes',
  },
};

const SHEET_MODALS = ['contact-modal', 'location-modal', 'rsvp-nav-modal', 'success-modal'];

function applyWeddingConfig(config) {
  const eventDateObj = new Date(config.event.date);
  const dayNum = String(eventDateObj.getDate()).padStart(2, '0');
  const monthYear = formatMalayDate(config.event.date).replace(/^\d+\s/, '');
  const dateWithDay = `${config.event.day}, ${dayNum} ${monthYear}`;

  const heroDate = document.getElementById('hero-date');
  if (heroDate) heroDate.textContent = dateWithDay;

  const eventDate = document.getElementById('event-date-display');
  if (eventDate) eventDate.textContent = dateWithDay;

  const eventTime = document.getElementById('event-time');
  if (eventTime) {
    eventTime.textContent = `${config.event.startTime} – ${config.event.endTime}`;
  }

  const bersanding = document.getElementById('event-bersanding');
  if (bersanding && config.event.bersandingTime) {
    bersanding.textContent = config.event.bersandingTime;
  }

  const eventVenue = document.getElementById('event-venue');
  if (eventVenue) eventVenue.textContent = config.event.venue;

  const eventAddress = document.getElementById('event-address');
  if (eventAddress) eventAddress.textContent = config.event.address;

  const dressCode = document.getElementById('event-dress-code');
  if (dressCode) dressCode.textContent = config.event.dressCode;

  const hostsEl = document.getElementById('hosts-names');
  if (hostsEl) {
    const andSpan = document.createElement('span');
    andSpan.className = 'invitation__hosts-and';
    andSpan.textContent = '&';
    hostsEl.replaceChildren(
      document.createTextNode(config.hosts.father),
      andSpan,
      document.createTextNode(config.hosts.mother)
    );
  }

  const invitationText = document.getElementById('invitation-text');
  if (invitationText) invitationText.textContent = config.invitationText;

  const groomName = document.getElementById('groom-full-name');
  if (groomName) groomName.textContent = config.couple.groom;

  const brideName = document.getElementById('bride-full-name');
  if (brideName) brideName.textContent = config.couple.bride;

  const mapsBtn = document.getElementById('maps-btn');
  if (mapsBtn) mapsBtn.href = config.event.googleMapsUrl || '#';

  const wazeBtn = document.getElementById('waze-btn');
  if (wazeBtn) wazeBtn.href = config.event.wazeUrl || '#';

  const locationVenue = document.getElementById('location-modal-venue');
  if (locationVenue) locationVenue.textContent = config.event.venue;

  const locationAddress = document.getElementById('location-modal-address');
  if (locationAddress) locationAddress.textContent = config.event.address;

  const locationMaps = document.getElementById('location-maps-btn');
  if (locationMaps) locationMaps.href = config.event.googleMapsUrl || '#';

  const locationWaze = document.getElementById('location-waze-btn');
  if (locationWaze) locationWaze.href = config.event.wazeUrl || '#';

  renderContacts(config.contacts);

  const yearEl = document.getElementById('copyright-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

function renderContacts(contacts) {
  const list = document.getElementById('contact-list');
  if (!list) return;

  list.replaceChildren();

  (contacts || []).forEach((contact) => {
    const item = document.createElement('li');
    item.className = 'contact-list__item';

    const name = document.createElement('span');
    name.className = 'contact-list__name';
    name.textContent = contact.name;

    const actions = document.createElement('div');
    actions.className = 'contact-list__actions';

    if (contact.whatsapp) {
      const wa = document.createElement('a');
      wa.className = 'contact-icon-btn';
      wa.href = `https://wa.me/${String(contact.whatsapp).replace(/\D/g, '')}`;
      wa.target = '_blank';
      wa.rel = 'noopener noreferrer';
      wa.setAttribute('aria-label', `WhatsApp ${contact.name}`);
      wa.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.6 5.95L0 24l6.3-1.65a11.9 11.9 0 0 0 5.76 1.47h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.45-8.44zm-8.46 18.3h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.9 6.98c0 5.45-4.44 9.88-9.89 9.88zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.49s1.07 2.89 1.22 3.09c.15.2 2.11 3.22 5.11 4.51.71.31 1.27.49 1.7.63.72.23 1.37.2 1.89.12.58-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z"/></svg>';
      actions.appendChild(wa);
    }

    if (contact.phone) {
      const call = document.createElement('a');
      call.className = 'contact-icon-btn';
      call.href = `tel:${contact.phone}`;
      call.setAttribute('aria-label', `Telefon ${contact.name}`);
      call.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.68 2.35a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.73-1.27a2 2 0 0 1 2.11-.45c.75.32 1.54.55 2.35.68A2 2 0 0 1 22 16.92z"/></svg>';
      actions.appendChild(call);
    }

    item.append(name, actions);
    list.appendChild(item);
  });
}

function closeOpenSheets() {
  SHEET_MODALS.forEach((id) => {
    const modal = document.getElementById(id);
    if (modal && !modal.hidden) closeModal(id, { immediate: true });
  });
}

function initBottomNav() {
  document.querySelectorAll('[data-open-modal]').forEach((button) => {
    button.addEventListener('click', () => {
      const modalId = button.getAttribute('data-open-modal');
      if (!modalId) return;
      closeOpenSheets();
      openModal(modalId);
    });
  });

  document.querySelectorAll('[data-scroll-to]').forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-scroll-to');
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) return;

      window.setTimeout(() => {
        target.scrollIntoView({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          block: 'start',
        });
      }, 50);
    });
  });
}

function initApp() {
  applyWeddingConfig(weddingConfig);
  initBackgroundMusic();
  initEnvelopeIntro(weddingConfig);
  startCountdown(weddingConfig.event.date, document.getElementById('countdown'));
  SHEET_MODALS.forEach((id) => initModal(id));
  initBottomNav();
  initSmoothAnchors();
  initScrollReveal();
  initRsvpForm();
  initWishes();
}

document.addEventListener('DOMContentLoaded', initApp);
