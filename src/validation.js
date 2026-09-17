/**
 * Reusable form validation helpers for RSVP and wishes.
 */

export function trimValue(value) {
  return String(value ?? '').trim();
}

export function isNameValid(name) {
  const trimmed = trimValue(name);
  if (trimmed.length < 2) {
    return { valid: false, message: 'Nama mestilah sekurang-kurangnya 2 aksara.' };
  }
  if (trimmed.length > 100) {
    return { valid: false, message: 'Nama tidak boleh melebihi 100 aksara.' };
  }
  if (/^\d+$/.test(trimmed)) {
    return { valid: false, message: 'Nama tidak boleh mengandungi nombor sahaja.' };
  }
  return { valid: true, message: '', value: trimmed };
}

/**
 * Accepts common Malaysian mobile formats:
 * 0123456789, 012-3456789, +60123456789, 60123456789
 */
export function isMalaysianPhoneValid(phone) {
  const trimmed = trimValue(phone).replace(/[\s-]/g, '');

  if (!trimmed) {
    return { valid: false, message: 'Nombor telefon diperlukan.' };
  }

  const patterns = [
    /^01[0-9]\d{7,8}$/,
    /^\+601[0-9]\d{7,8}$/,
    /^601[0-9]\d{7,8}$/,
  ];

  const matches = patterns.some((pattern) => pattern.test(trimmed));

  if (!matches) {
    return {
      valid: false,
      message: 'Sila masukkan nombor telefon Malaysia yang sah (cth: 0123456789).',
    };
  }

  return { valid: true, message: '', value: trimmed };
}

export function isPaxValid(pax, attendanceStatus) {
  if (attendanceStatus === 'tidak_hadir') {
    return { valid: true, message: '', value: 0 };
  }

  const number = Number(pax);

  if (!Number.isInteger(number) || Number.isNaN(number)) {
    return { valid: false, message: 'Jumlah kehadiran mestilah nombor yang sah.' };
  }

  if (number < 1 || number > 2) {
    return { valid: false, message: 'Jumlah kehadiran mestilah antara 1 hingga 2.' };
  }

  return { valid: true, message: '', value: number };
}

export function isAttendanceValid(status) {
  if (status !== 'hadir' && status !== 'tidak_hadir') {
    return { valid: false, message: 'Sila pilih status kehadiran.' };
  }
  return { valid: true, message: '', value: status };
}

export function isWishMessageValid(message) {
  const trimmed = trimValue(message);

  if (!trimmed) {
    return { valid: false, message: 'Ucapan tidak boleh kosong.' };
  }

  if (trimmed.length > 500) {
    return { valid: false, message: 'Ucapan tidak boleh melebihi 500 aksara.' };
  }

  return { valid: true, message: '', value: trimmed };
}

export function setFieldError(inputEl, errorEl, message) {
  if (!errorEl) return;

  errorEl.textContent = message || '';

  if (inputEl) {
    if (message) {
      inputEl.classList.add('form__input--error');
      inputEl.setAttribute('aria-invalid', 'true');
    } else {
      inputEl.classList.remove('form__input--error');
      inputEl.removeAttribute('aria-invalid');
    }
  }
}

export function clearFieldError(inputEl, errorEl) {
  setFieldError(inputEl, errorEl, '');
}

export function focusFirstInvalid(fields) {
  const first = fields.find((field) => field && document.contains(field));
  if (first && typeof first.focus === 'function') {
    first.focus({ preventScroll: false });
  }
}
