"use client";

let _zzfx: ((...args: number[]) => void) | null = null;
let _muted = false;
let _audioUnlocked = false;

async function loadZzfx() {
  if (typeof window === "undefined") return null;
  if (_zzfx) return _zzfx;
  const mod = await import("zzfx");
  _zzfx = mod.zzfx;
  return _zzfx;
}

/** Call once on first user interaction to unlock AudioContext on mobile. */
export async function unlockAudio() {
  if (_audioUnlocked) return;
  _audioUnlocked = true;
  await loadZzfx();
}

export function setMuted(v: boolean) {
  _muted = v;
}

function play(args: number[]) {
  if (_muted || !_zzfx) return;
  try {
    _zzfx(...args);
  } catch {
    // audio errors are non-fatal
  }
}

// SE presets (zzfx param order: volume, randomness, freq, attack, sustain, release, shape, shapeCurve, ...)
export const SE = {
  tap:     () => play([0.3, 0.02, 440,  0.02, 0,    0.07, 0, 1.3]),
  success: () => play([0.5, 0.1,  700,  0.05, 0.1,  0.3,  0, 2  ]),
  fail:    () => play([0.3, 0.05, 180,  0.02, 0,    0.2,  2, 0.5]),
};
