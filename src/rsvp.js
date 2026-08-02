import { getSupabase, isSupabaseConfigured } from './supabase.js';
import {
  isNameValid,
  isMalaysianPhoneValid,
  isPaxValid,
  isAttendanceValid,
  setFieldError,
  clearFieldError,
  focusFirstInvalid,
} from './validation.js';
import {
  normalizePhone,
  openModal,
  setButtonLoading,
  showToast,
} from './utils.js';

/**
 * Initialize RSVP form behaviour.
 */
export function initRsvpForm() {
  const form = document.getElementById('rsvp-form');
  if (!form) return;

  const nameInput = document.getElementById('rsvp-name');
  const phoneInput = document.getElementById('rsvp-phone');
  const paxInput = document.getElementById('rsvp-pax');
  const submitBtn = document.getElementById('rsvp-submit');
  const feedback = document.getElementById('rsvp-feedback');
  const attendanceInputs = form.querySelectorAll('input[name="attendance"]');

  const nameError = document.getElementById('rsvp-name-error');
  const phoneError = document.getElementById('rsvp-phone-error');
  const paxError = document.getElementById('rsvp-pax-error');
  const attendanceError = document.getElementById('rsvp-attendance-error');

  let isSubmitting = false;

  loadRsvpCounts();

  const syncPaxWithAttendance = () => {
    const status = form.querySelector('input[name="attendance"]:checked')?.value;
    if (status === 'tidak_hadir') {
      paxInput.value = '0';
      paxInput.disabled = true;
      clearFieldError(paxInput, paxError);
    } else {
      paxInput.disabled = false;
      if (Number(paxInput.value) < 1) {
        paxInput.value = '1';
      }
    }
  };

  attendanceInputs.forEach((input) => {
    input.addEventListener('change', syncPaxWithAttendance);
  });
  syncPaxWithAttendance();

  nameInput.addEventListener('input', () => {
    const result = isNameValid(nameInput.value);
    if (result.valid) clearFieldError(nameInput, nameError);
  });

  phoneInput.addEventListener('input', () => {
    const result = isMalaysianPhoneValid(phoneInput.value);
    if (result.valid) clearFieldError(phoneInput, phoneError);
  });

  paxInput.addEventListener('input', () => {
    const status = form.querySelector('input[name="attendance"]:checked')?.value;
    const result = isPaxValid(paxInput.value, status);
    if (result.valid) clearFieldError(paxInput, paxError);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    feedback.textContent = '';
    feedback.className = 'form__feedback';

    const attendanceStatus = form.querySelector('input[name="attendance"]:checked')?.value;
    const nameResult = isNameValid(nameInput.value);
    const phoneResult = isMalaysianPhoneValid(phoneInput.value);
    const attendanceResult = isAttendanceValid(attendanceStatus);
    const paxResult = isPaxValid(paxInput.value, attendanceStatus);

    setFieldError(nameInput, nameError, nameResult.valid ? '' : nameResult.message);
    setFieldError(phoneInput, phoneError, phoneResult.valid ? '' : phoneResult.message);
    setFieldError(paxInput, paxError, paxResult.valid ? '' : paxResult.message);
    if (attendanceError) {
      attendanceError.textContent = attendanceResult.valid ? '' : attendanceResult.message;
    }

    const invalidFields = [];
    if (!nameResult.valid) invalidFields.push(nameInput);
    if (!phoneResult.valid) invalidFields.push(phoneInput);
    if (!attendanceResult.valid) {
      invalidFields.push(form.querySelector('input[name="attendance"]'));
    }
    if (!paxResult.valid) invalidFields.push(paxInput);

    if (invalidFields.length > 0) {
      focusFirstInvalid(invalidFields);
      return;
    }

    if (!isSupabaseConfigured()) {
      feedback.className = 'form__feedback form__feedback--error';
      feedback.textContent =
        'Sistem belum dikonfigurasi. Sila tetapkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.';
      return;
    }

    const payload = {
      name: nameResult.value,
      phone: normalizePhone(phoneResult.value),
      pax: paxResult.value,
      attendance_status: attendanceResult.value,
    };

    isSubmitting = true;
    setButtonLoading(submitBtn, true, 'Sedang dihantar...', 'Hantar RSVP');

    try {
      const result = await submitRsvp(payload);

      if (result.status === 'cancelled') {
        feedback.className = 'form__feedback';
        feedback.textContent = 'RSVP sedia ada dikekalkan.';
        return;
      }

      form.reset();
      syncPaxWithAttendance();
      clearFieldError(nameInput, nameError);
      clearFieldError(phoneInput, phoneError);
      clearFieldError(paxInput, paxError);
      openModal('success-modal');
      loadRsvpCounts();
    } catch (error) {
      console.error('[RSVP] Submission failed:', error);
      feedback.className = 'form__feedback form__feedback--error';
      feedback.textContent =
        'Maaf, RSVP tidak berjaya dihantar. Sila cuba lagi sebentar lagi.';
    } finally {
      isSubmitting = false;
      setButtonLoading(submitBtn, false, 'Sedang dihantar...', 'Hantar RSVP');
    }
  });
}

/**
 * Submit RSVP with duplicate phone handling via secure RPC.
 */
async function submitRsvp(payload) {
  const supabase = getSupabase();

  const { data: exists, error: checkError } = await supabase.rpc('check_rsvp_phone', {
    p_phone: payload.phone,
  });

  if (checkError) {
    throw checkError;
  }

  let replaceExisting = false;

  if (exists) {
    const confirmed = window.confirm(
      'Nombor telefon ini telah menghantar RSVP sebelum ini.\n\n' +
        'Adakah anda ingin menggantikan RSVP yang lama dengan maklumat baharu?'
    );

    if (!confirmed) {
      return { status: 'cancelled' };
    }

    replaceExisting = true;
  }

  const { data, error } = await supabase.rpc('upsert_rsvp', {
    p_name: payload.name,
    p_phone: payload.phone,
    p_pax: payload.pax,
    p_attendance_status: payload.attendance_status,
    p_replace: replaceExisting,
  });

  if (error) {
    throw error;
  }

  if (data?.status === 'exists_no_replace') {
    showToast('RSVP sedia ada dikekalkan.', 'info');
    return { status: 'cancelled' };
  }

  if (data?.status === 'error') {
    throw new Error(data.message || 'RSVP gagal disimpan.');
  }

  return { status: data?.status || 'ok', data };
}

/**
 * Load aggregate Hadir / Tidak hadir counts (no individual RSVP rows).
 */
async function loadRsvpCounts() {
  const hadirEl = document.getElementById('rsvp-count-hadir');
  const tidakEl = document.getElementById('rsvp-count-tidak-hadir');
  if (!hadirEl || !tidakEl) return;

  if (!isSupabaseConfigured()) {
    hadirEl.textContent = '0';
    tidakEl.textContent = '0';
    return;
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('get_rsvp_counts');

    if (error) throw error;

    const hadir = Number(data?.hadir ?? 0);
    const tidakHadir = Number(data?.tidak_hadir ?? 0);

    hadirEl.textContent = Number.isFinite(hadir) ? String(hadir) : '0';
    tidakEl.textContent = Number.isFinite(tidakHadir) ? String(tidakHadir) : '0';
  } catch (error) {
    console.error('[RSVP] Failed to load counts:', error);
    hadirEl.textContent = '—';
    tidakEl.textContent = '—';
  }
}
