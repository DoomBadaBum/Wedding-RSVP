/**
 * Background music with floating mute toggle.
 * Browsers often block autoplay until a gesture — we retry on envelope open.
 */

let audio = null;
let toggleBtn = null;
let userMuted = false;

export function initBackgroundMusic() {
  audio = document.getElementById('bg-music');
  toggleBtn = document.getElementById('music-toggle');
  if (!audio || !toggleBtn) return;

  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0.45;
  userMuted = false;

  syncToggleUi(false);

  toggleBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleMusic();
  });

  // Unlock / start on first user interaction (covers autoplay policy).
  const unlock = () => {
    if (!userMuted) playMusic();
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  };
  document.addEventListener('pointerdown', unlock, { passive: true });
  document.addEventListener('keydown', unlock);

  playMusic();
}

export function playMusic() {
  if (!audio || userMuted) return;

  const attempt = audio.play();
  if (attempt && typeof attempt.then === 'function') {
    attempt
      .then(() => syncToggleUi(false))
      .catch(() => {
        syncToggleUi(false);
      });
  }
}

function toggleMusic() {
  if (!audio) return;

  if (!audio.paused && !userMuted) {
    userMuted = true;
    audio.pause();
    syncToggleUi(true);
    return;
  }

  userMuted = false;
  playMusic();
  syncToggleUi(false);
}

function syncToggleUi(muted) {
  if (!toggleBtn) return;
  toggleBtn.classList.toggle('is-muted', muted);
  toggleBtn.setAttribute(
    'aria-label',
    muted ? 'Hidupkan muzik latar' : 'Matikan muzik latar'
  );
  toggleBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
}
