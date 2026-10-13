import type { FailSound, SoundSettings, SuccessSound } from "../types";
import { SOUND_KEY, getValue } from "./storage";

/**
 * Verdict sounds, synthesized with Web Audio so nothing copyrighted ships
 * with the extension. Users can upload their own clip for either slot.
 */

let ctx: AudioContext | null = null;
function audio(): AudioContext {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function master(volume: number): GainNode {
  const c = audio();
  const gain = c.createGain();
  gain.gain.value = volume;
  const comp = c.createDynamicsCompressor();
  gain.connect(comp).connect(c.destination);
  return gain;
}

const NOTE = (semitonesFromA4: number) => 440 * 2 ** (semitonesFromA4 / 12);

/** Brass-ish voice: detuned saws through a swelling low-pass filter. */
function brass(out: AudioNode, freq: number, start: number, dur: number, level = 0.22) {
  const c = audio();
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 2;
  filter.frequency.setValueAtTime(freq * 1.5, start);
  filter.frequency.linearRampToValueAtTime(freq * 6, start + 0.08);
  filter.frequency.exponentialRampToValueAtTime(freq * 2.5, start + dur);

  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(level, start + 0.035);
  env.gain.setValueAtTime(level, start + dur * 0.7);
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  filter.connect(env).connect(out);

  for (const detune of [-7, 0, 7]) {
    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(filter);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }
}

function drum(out: AudioNode, start: number, level = 0.5) {
  const c = audio();
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.frequency.setValueAtTime(140, start);
  osc.frequency.exponentialRampToValueAtTime(45, start + 0.25);
  env.gain.setValueAtTime(level, start);
  env.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
  osc.connect(env).connect(out);
  osc.start(start);
  osc.stop(start + 0.4);
}

function noise(seconds: number): AudioBuffer {
  const c = audio();
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** An original "mission complete" fanfare: pickup, rising brass chord, big hit. */
function playMission(volume: number) {
  const out = master(volume);
  const t = audio().currentTime + 0.02;
  // Pickup notes (G – B♭ – C), then a held major chord on C with a drum hit.
  brass(out, NOTE(-2), t, 0.16);
  brass(out, NOTE(1), t + 0.16, 0.16);
  brass(out, NOTE(3), t + 0.32, 0.22);
  drum(out, t + 0.58);
  for (const n of [3, 7, 10, 15]) brass(out, NOTE(n), t + 0.58, 1.5, 0.16);
  brass(out, NOTE(-9), t + 0.58, 1.5, 0.18);
}

function playChime(volume: number) {
  const c = audio();
  const out = master(volume);
  const t = c.currentTime + 0.02;
  [0, 4, 7, 12].forEach((n, i) => {
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.type = "triangle";
    osc.frequency.value = NOTE(n + 3);
    env.gain.setValueAtTime(0.0001, t + i * 0.09);
    env.gain.exponentialRampToValueAtTime(0.3, t + i * 0.09 + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.9);
    osc.connect(env).connect(out);
    osc.start(t + i * 0.09);
    osc.stop(t + i * 0.09 + 1);
  });
}

/**
 * A synthesized dramatic "FAAAH": a breathy "f" (filtered noise) into a
 * sliding, wobbling vowel shaped with "ah" formant filters.
 */
function playFaah(volume: number) {
  const c = audio();
  const out = master(volume);
  const t = c.currentTime + 0.02;

  const fric = c.createBufferSource();
  fric.buffer = noise(0.25);
  const fricFilter = c.createBiquadFilter();
  fricFilter.type = "highpass";
  fricFilter.frequency.value = 2500;
  const fricEnv = c.createGain();
  fricEnv.gain.setValueAtTime(0.0001, t);
  fricEnv.gain.exponentialRampToValueAtTime(0.35, t + 0.06);
  fricEnv.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  fric.connect(fricFilter).connect(fricEnv).connect(out);
  fric.start(t);

  const v = t + 0.14;
  const dur = 1.35;
  const voice = c.createOscillator();
  voice.type = "sawtooth";
  voice.frequency.setValueAtTime(260, v);
  voice.frequency.linearRampToValueAtTime(300, v + 0.18);
  voice.frequency.exponentialRampToValueAtTime(150, v + dur);

  const vibrato = c.createOscillator();
  const vibratoDepth = c.createGain();
  vibrato.frequency.value = 5.5;
  vibratoDepth.gain.setValueAtTime(0, v);
  vibratoDepth.gain.linearRampToValueAtTime(14, v + 0.5);
  vibrato.connect(vibratoDepth).connect(voice.frequency);

  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, v);
  env.gain.exponentialRampToValueAtTime(0.9, v + 0.08);
  env.gain.setValueAtTime(0.9, v + dur * 0.6);
  env.gain.exponentialRampToValueAtTime(0.0001, v + dur);
  env.connect(out);

  // "ah" vowel formants
  for (const [freq, q, gain] of [
    [800, 6, 1],
    [1150, 8, 0.6],
    [2900, 10, 0.25],
  ]) {
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = c.createGain();
    g.gain.value = gain;
    voice.connect(bp).connect(g).connect(env);
  }

  voice.start(v);
  vibrato.start(v);
  voice.stop(v + dur + 0.05);
  vibrato.stop(v + dur + 0.05);
}

function playBuzzer(volume: number) {
  const c = audio();
  const out = master(volume * 0.6);
  const t = c.currentTime + 0.02;
  [0, 0.28].forEach((offset) => {
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.type = "square";
    osc.frequency.value = 110;
    env.gain.setValueAtTime(0.25, t + offset);
    env.gain.setValueAtTime(0.0001, t + offset + 0.22);
    osc.connect(env).connect(out);
    osc.start(t + offset);
    osc.stop(t + offset + 0.25);
  });
}

async function playCustom(kind: "success" | "fail", volume: number): Promise<boolean> {
  const dataUrl = await getValue<string | null>(SOUND_KEY(kind), null);
  if (!dataUrl) return false;
  const el = new Audio(dataUrl);
  el.volume = Math.min(1, Math.max(0, volume));
  await el.play();
  return true;
}

const SUCCESS: Record<Exclude<SuccessSound, "custom" | "none">, (v: number) => void> = {
  mission: playMission,
  chime: playChime,
};
const FAIL: Record<Exclude<FailSound, "custom" | "none">, (v: number) => void> = {
  faah: playFaah,
  buzzer: playBuzzer,
};

export async function playVerdictSound(accepted: boolean, settings: SoundSettings) {
  if (!settings.enabled) return;
  const choice = accepted ? settings.success : settings.fail;
  if (choice === "none") return;
  try {
    if (choice === "custom") {
      if (await playCustom(accepted ? "success" : "fail", settings.volume)) return;
      // No clip uploaded — fall back to the built-in sound.
      (accepted ? playMission : playFaah)(settings.volume);
      return;
    }
    if (accepted) SUCCESS[choice as keyof typeof SUCCESS](settings.volume);
    else FAIL[choice as keyof typeof FAIL](settings.volume);
  } catch {
    /* audio blocked (no user gesture yet) — silently skip */
  }
}

/** Preview from the settings screen. */
export function previewSound(kind: "success" | "fail", settings: SoundSettings) {
  void playVerdictSound(kind === "success", { ...settings, enabled: true });
}
