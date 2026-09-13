type BrowserWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

async function playDefaultTone() {
  const AudioContextConstructor =
    window.AudioContext || (window as BrowserWindow).webkitAudioContext;
  if (!AudioContextConstructor) return;

  const audioContext = new AudioContextConstructor();
  await audioContext.resume();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const start = audioContext.currentTime;

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, start);
  oscillator.frequency.setValueAtTime(660, start + 0.12);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + 0.34);
  oscillator.addEventListener('ended', () => void audioContext.close(), { once: true });
}

export async function playNotificationSound(soundUrl?: string | null) {
  try {
    if (soundUrl) {
      const audio = new Audio(soundUrl);
      audio.volume = 0.8;
      await audio.play();
      return;
    }
    await playDefaultTone();
  } catch {
    try {
      await playDefaultTone();
    } catch {
      // Browsers may block audio until the user has interacted with the page.
    }
  }
}
