import './style.css';
import { initRsvpForm } from './rsvp.js';
import { initWishes } from './wishes.js';
import {
  formatMalayDate,
  initModal,
  initScrollReveal,
  initSmoothAnchors,
  startCountdown,
  downloadIcsEvent,
} from './utils.js';

/**
 * Editable wedding configuration — update these values for your event.
 */
export const weddingConfig = {
  couple: {
    groom: 'MUHAMMAD DANISH BIN SHAMSURI',
    bride: 'NUR YASMIN IMANINA BINTI MAZLAN',
  },
  event: {
    date: '2027-01-01T11:00:00+08:00',
    day: 'Jumaat',
    startTime: '11:00 pagi',
    endTime: '4:00 petang',
    venue: 'Nama Dewan',
    address: 'Alamat penuh majlis',
    googleMapsUrl: '#',
    wazeUrl: '#',
  },
};

function applyWeddingConfig(config) {
  const dateLabel = formatMalayDate(config.event.date);

  const heroDate = document.getElementById('hero-date');
  if (heroDate) heroDate.textContent = dateLabel;

  const eventDate = document.getElementById('event-date-display');
  if (eventDate) eventDate.textContent = dateLabel;

  const eventDay = document.getElementById('event-day');
  if (eventDay) eventDay.textContent = config.event.day;

  const eventTime = document.getElementById('event-time');
  if (eventTime) {
    eventTime.textContent = `${config.event.startTime} – ${config.event.endTime}`;
  }

  const eventVenue = document.getElementById('event-venue');
  if (eventVenue) eventVenue.textContent = config.event.venue;

  const eventAddress = document.getElementById('event-address');
  if (eventAddress) eventAddress.textContent = config.event.address;

  const groomName = document.getElementById('groom-full-name');
  if (groomName) groomName.textContent = config.couple.groom;

  const brideName = document.getElementById('bride-full-name');
  if (brideName) brideName.textContent = config.couple.bride;

  const mapsBtn = document.getElementById('maps-btn');
  if (mapsBtn) {
    mapsBtn.href = config.event.googleMapsUrl || '#';
    if (!config.event.googleMapsUrl || config.event.googleMapsUrl === '#') {
      mapsBtn.addEventListener('click', (event) => {
        event.preventDefault();
        window.alert('Pautan Google Maps belum ditetapkan. Kemaskini weddingConfig.event.googleMapsUrl.');
      });
    }
  }

  const wazeBtn = document.getElementById('waze-btn');
  if (wazeBtn) {
    wazeBtn.href = config.event.wazeUrl || '#';
    if (!config.event.wazeUrl || config.event.wazeUrl === '#') {
      wazeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        window.alert('Pautan Waze belum ditetapkan. Kemaskini weddingConfig.event.wazeUrl.');
      });
    }
  }

  const calendarBtn = document.getElementById('calendar-btn');
  if (calendarBtn) {
    calendarBtn.addEventListener('click', () => downloadIcsEvent(config));
  }

  const yearEl = document.getElementById('copyright-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

function initApp() {
  applyWeddingConfig(weddingConfig);
  startCountdown(weddingConfig.event.date, document.getElementById('countdown'));
  initModal('success-modal');
  initSmoothAnchors();
  initScrollReveal();
  initRsvpForm();
  initWishes();
}

document.addEventListener('DOMContentLoaded', initApp);
