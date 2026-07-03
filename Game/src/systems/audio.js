export function createAudioEngine(getEnabled) {
  let audioContext = null;

  function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext) audioContext = new AudioContextClass();
    return audioContext;
  }

  function playTone(frequency, duration = 0.08, type = "sine", gainValue = 0.035) {
    if (!getEnabled()) return;
    const context = getAudioContext();
    if (!context) return;
    if (context.state === "suspended") context.resume();

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = gainValue;
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  function play(kind) {
    const sounds = {
      arrow: () => playTone(520, 0.055, "triangle", 0.028),
      hit: () => playTone(160, 0.07, "square", 0.025),
      loot: () => {
        playTone(660, 0.08, "sine", 0.03);
        window.setTimeout(() => playTone(880, 0.1, "sine", 0.028), 70);
      },
      level: () => {
        playTone(523, 0.09, "triangle", 0.032);
        window.setTimeout(() => playTone(659, 0.09, "triangle", 0.032), 90);
        window.setTimeout(() => playTone(784, 0.14, "triangle", 0.032), 180);
      },
    };
    sounds[kind]?.();
  }

  return { play };
}
