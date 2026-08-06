"use client";

/**
 * A short synthesized "new order" chime for the KDS / OSS boards — built with
 * the Web Audio API so there's no audio asset to bundle and it works offline.
 *
 * Browsers block audio until the user interacts with the page, so `primeChime()`
 * arms a one-time gesture listener that resumes the audio context. Muting is
 * persisted in localStorage and shared across the boards.
 */

const MUTE_KEY = "tabletap.board.sound.muted";

let ctx: AudioContext | null = null;
let gestureBound = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Resume the audio context on the first user gesture (autoplay policy). */
export function primeChime(): void {
  if (gestureBound || typeof window === "undefined") return;
  gestureBound = true;
  const resume = () => {
    void getCtx()?.resume().catch(() => {});
    window.removeEventListener("pointerdown", resume);
    window.removeEventListener("keydown", resume);
  };
  window.addEventListener("pointerdown", resume);
  window.addEventListener("keydown", resume);
}

export function isChimeMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setChimeMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}

/** Play a short rising two-note bell (A5 → D6). No-op when muted. */
export function playNewOrderChime(): void {
  if (isChimeMuted()) return;
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === "suspended") void audio.resume().catch(() => {});

  const now = audio.currentTime;
  const notes = [
    { freq: 880, at: 0 }, // A5
    { freq: 1174.66, at: 0.14 }, // D6
  ];

  for (const { freq, at } of notes) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;

    const start = now + at;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.4);
  }
}
