import { getSupabase, isSupabaseConfigured } from './supabase.js';
import {
  isNameValid,
  isWishMessageValid,
  setFieldError,
  clearFieldError,
  focusFirstInvalid,
} from './validation.js';
import {
  formatMalayDateTime,
  createSafeTextElement,
  setButtonLoading,
  showToast,
} from './utils.js';

const PAGE_SIZE = 6;

let displayedCount = 0;
let allLoadedWishes = [];
let hasMore = true;
let isLoading = false;

/**
 * Initialize wishes form and list.
 */
export function initWishes() {
  initWishesForm();
  loadInitialWishes();

  const loadMoreBtn = document.getElementById('wishes-load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => loadMoreWishes());
  }
}

function initWishesForm() {
  const form = document.getElementById('wishes-form');
  if (!form) return;

  const nameInput = document.getElementById('wish-name');
  const messageInput = document.getElementById('wish-message');
  const counter = document.getElementById('wish-message-counter');
  const submitBtn = document.getElementById('wish-submit');
  const feedback = document.getElementById('wish-feedback');
  const nameError = document.getElementById('wish-name-error');
  const messageError = document.getElementById('wish-message-error');

  let isSubmitting = false;

  const updateCounter = () => {
    const length = messageInput.value.length;
    counter.textContent = `${length} / 500`;
  };

  messageInput.addEventListener('input', () => {
    updateCounter();
    const result = isWishMessageValid(messageInput.value);
    if (result.valid || messageInput.value.length === 0) {
      clearFieldError(messageInput, messageError);
    }
  });

  nameInput.addEventListener('input', () => {
    const result = isNameValid(nameInput.value);
    if (result.valid) clearFieldError(nameInput, nameError);
  });

  updateCounter();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    feedback.textContent = '';
    feedback.className = 'form__feedback';

    const nameResult = isNameValid(nameInput.value);
    const messageResult = isWishMessageValid(messageInput.value);

    setFieldError(nameInput, nameError, nameResult.valid ? '' : nameResult.message);
    setFieldError(messageInput, messageError, messageResult.valid ? '' : messageResult.message);

    const invalid = [];
    if (!nameResult.valid) invalid.push(nameInput);
    if (!messageResult.valid) invalid.push(messageInput);

    if (invalid.length > 0) {
      focusFirstInvalid(invalid);
      return;
    }

    if (!isSupabaseConfigured()) {
      feedback.className = 'form__feedback form__feedback--error';
      feedback.textContent =
        'Sistem belum dikonfigurasi. Sila tetapkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.';
      return;
    }

    isSubmitting = true;
    setButtonLoading(submitBtn, true, 'Sedang dihantar...', 'Hantar Ucapan');

    try {
      const wish = await insertWish({
        name: nameResult.value,
        message: messageResult.value,
      });

      form.reset();
      updateCounter();
      clearFieldError(nameInput, nameError);
      clearFieldError(messageInput, messageError);
      showToast('Terima kasih! Ucapan anda telah dihantar.', 'success');
      prependWish(wish);
    } catch (error) {
      console.error('[Wishes] Submission failed:', error);
      feedback.className = 'form__feedback form__feedback--error';
      feedback.textContent =
        'Maaf, ucapan tidak berjaya dihantar. Sila cuba lagi sebentar lagi.';
    } finally {
      isSubmitting = false;
      setButtonLoading(submitBtn, false, 'Sedang dihantar...', 'Hantar Ucapan');
    }
  });
}

async function insertWish({ name, message }) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('wishes')
    .insert({ name, message })
    .select('id, name, message, created_at')
    .single();

  if (error) throw error;
  return data;
}

async function loadInitialWishes() {
  displayedCount = 0;
  allLoadedWishes = [];
  hasMore = true;
  await fetchAndRenderWishes(true);
}

async function loadMoreWishes() {
  if (!hasMore || isLoading) return;
  await fetchAndRenderWishes(false);
}

async function fetchAndRenderWishes(reset) {
  const listEl = document.getElementById('wishes-list');
  const statusEl = document.getElementById('wishes-status');
  const loadMoreBtn = document.getElementById('wishes-load-more');

  if (!listEl || !statusEl) return;

  if (!isSupabaseConfigured()) {
    statusEl.className = 'wishes-status wishes-status--error';
    statusEl.textContent =
      'Tidak dapat memuatkan ucapan. Supabase belum dikonfigurasi.';
    if (loadMoreBtn) loadMoreBtn.hidden = true;
    return;
  }

  isLoading = true;
  statusEl.className = 'wishes-status wishes-status--loading';
  statusEl.textContent = 'Memuatkan ucapan...';

  try {
    const from = allLoadedWishes.length;
    const to = from + PAGE_SIZE - 1;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('wishes')
      .select('id, name, message, created_at')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const batch = data || [];
    hasMore = batch.length === PAGE_SIZE;
    allLoadedWishes = allLoadedWishes.concat(batch);

    if (reset) {
      listEl.replaceChildren();
      displayedCount = 0;
    }

    if (allLoadedWishes.length === 0) {
      statusEl.className = 'wishes-status wishes-status--empty';
      statusEl.textContent = 'Belum ada ucapan. Jadilah yang pertama!';
      if (loadMoreBtn) loadMoreBtn.hidden = true;
      return;
    }

    statusEl.textContent = '';
    statusEl.className = 'wishes-status';

    const nextBatch = allLoadedWishes.slice(displayedCount, displayedCount + PAGE_SIZE);
    nextBatch.forEach((wish) => listEl.appendChild(createWishCard(wish)));
    displayedCount += nextBatch.length;

    if (loadMoreBtn) {
      loadMoreBtn.hidden = !(hasMore || displayedCount < allLoadedWishes.length);
    }
  } catch (error) {
    console.error('[Wishes] Failed to load:', error);
    statusEl.className = 'wishes-status wishes-status--error';
    statusEl.textContent = 'Gagal memuatkan ucapan. Sila muat semula halaman.';
    if (loadMoreBtn) loadMoreBtn.hidden = true;
  } finally {
    isLoading = false;
  }
}

function prependWish(wish) {
  const listEl = document.getElementById('wishes-list');
  const statusEl = document.getElementById('wishes-status');
  if (!listEl) return;

  if (statusEl) {
    statusEl.textContent = '';
    statusEl.className = 'wishes-status';
  }

  allLoadedWishes.unshift(wish);
  displayedCount += 1;
  listEl.prepend(createWishCard(wish));
}

function createWishCard(wish) {
  const article = document.createElement('article');
  article.className = 'wish-card';

  const name = createSafeTextElement('h4', wish.name, 'wish-card__name');
  const message = createSafeTextElement('p', wish.message, 'wish-card__message');
  const date = createSafeTextElement(
    'time',
    formatMalayDateTime(wish.created_at),
    'wish-card__date'
  );
  date.dateTime = wish.created_at;

  article.append(name, message, date);
  return article;
}
