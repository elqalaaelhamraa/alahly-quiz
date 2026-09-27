// All sounds are synthesised with the Web Audio API – no audio files to ship.
import { soundOn } from './store.js';

let ctx;
function audio() {
  if (!soundOn()) return null;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function noise(ac, seconds) {
  const buf = ac.createBuffer(1, ac.sampleRate * seconds, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  return src;
}

function env(ac, g, t, { a = 0.02, peak = 1, hold = 0, r = 0.3 }) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.setValueAtTime(peak, t + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + r);
}

function distortion(ac, amount = 40) {
  const ws = ac.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) {
    const x = (i / 1023) * 2 - 1;
    curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
  }
  ws.curve = curve;
  return ws;
}

function kick(ac, t, vol = 0.8) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.25);
  env(ac, g, t, { a: 0.005, peak: vol, r: 0.3 });
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + 0.4);
}

export function roar(scale = 1) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.02;
  const dur = 1.9 * scale;
  const out = ac.createGain();
  env(ac, out, t, { a: 0.18, peak: 0.9, hold: dur * 0.35, r: dur * 0.6 });
  out.connect(ac.destination);

  // Growling throat: detuned saws, pitch falling, distorted and chopped by a fast LFO.
  const growl = ac.createGain();
  growl.gain.value = 0.6;
  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();
  lfo.frequency.setValueAtTime(28, t);
  lfo.frequency.linearRampToValueAtTime(18, t + dur);
  lfoGain.gain.value = 0.45;
  lfo.connect(lfoGain).connect(growl.gain);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(300, t);
  lp.frequency.exponentialRampToValueAtTime(1400, t + 0.25);
  lp.frequency.exponentialRampToValueAtTime(260, t + dur);
  const dist = distortion(ac, 60);
  [0, 7, -6].forEach((detune) => {
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(95 + detune, t);
    o.frequency.linearRampToValueAtTime(140 + detune, t + 0.3);
    o.frequency.exponentialRampToValueAtTime(55 + detune, t + dur);
    o.connect(dist);
    o.start(t);
    o.stop(t + dur + 0.1);
  });
  dist.connect(lp).connect(growl).connect(out);

  // Breath
  const n = noise(ac, dur + 0.2);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(500, t);
  bp.frequency.exponentialRampToValueAtTime(900, t + 0.3);
  bp.frequency.exponentialRampToValueAtTime(250, t + dur);
  const ng = ac.createGain();
  ng.gain.value = 0.5;
  n.connect(bp).connect(ng).connect(out);
  lfo.start(t);
  lfo.stop(t + dur + 0.1);
  n.start(t);
}

export function eagleCheer(scale = 1) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.02;
  // Screech
  const o = ac.createOscillator();
  const g = ac.createGain();
  const vib = ac.createOscillator();
  const vibG = ac.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(2600, t);
  o.frequency.exponentialRampToValueAtTime(1500, t + 0.7);
  vib.frequency.value = 38;
  vibG.gain.value = 120;
  vib.connect(vibG).connect(o.frequency);
  const hp = ac.createBiquadFilter();
  hp.type = 'bandpass';
  hp.frequency.value = 2200;
  hp.Q.value = 3;
  env(ac, g, t, { a: 0.03, peak: 0.35, hold: 0.25, r: 0.45 });
  o.connect(hp).connect(g).connect(ac.destination);
  o.start(t);
  vib.start(t);
  o.stop(t + 0.8);
  vib.stop(t + 0.8);
  if (scale < 1) return;

  // Stadium crowd swell + drums
  const n = noise(ac, 3);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 900;
  bp.Q.value = 0.6;
  const cg = ac.createGain();
  env(ac, cg, t + 0.5, { a: 0.6, peak: 0.35, hold: 0.8, r: 1 });
  n.connect(bp).connect(cg).connect(ac.destination);
  n.start(t + 0.5);
  [0.6, 0.9, 1.2, 1.35, 1.5].forEach((d) => kick(ac, t + d, 0.7));
}

export function burner(scale = 1) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.02;
  const n = noise(ac, 2.5 * scale);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(300, t);
  bp.frequency.linearRampToValueAtTime(700, t + 1);
  const g = ac.createGain();
  env(ac, g, t, { a: 0.15, peak: 0.7, hold: 0.9 * scale, r: 0.9 * scale });
  n.connect(bp).connect(g).connect(ac.destination);
  n.start(t);
  chime(ac, t + 1.1 * scale, [659.25, 880, 1318.5]);
}

function chime(ac, t, notes, gap = 0.12, type = 'sine', vol = 0.18) {
  notes.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.value = f;
    env(ac, g, t + i * gap, { a: 0.01, peak: vol, r: 0.9 });
    o.connect(g).connect(ac.destination);
    o.start(t + i * gap);
    o.stop(t + i * gap + 1);
  });
}

export function concert(scale = 1) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.02;
  chime(ac, t, [261.6, 329.6, 392, 523.3, 659.3, 784, 1046.5].slice(0, scale < 1 ? 4 : 7), 0.09, 'triangle', 0.2);
  if (scale < 1) return;
  [0, 0.45, 0.9].forEach((d) => kick(ac, t + 0.7 + d, 0.8));
  const n = noise(ac, 1.5);
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6000;
  const g = ac.createGain();
  env(ac, g, t + 1.6, { a: 0.005, peak: 0.25, r: 1.2 });
  n.connect(hp).connect(g).connect(ac.destination);
  n.start(t + 1.6);
}

export function click() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.frequency.setValueAtTime(900, t);
  o.frequency.exponentialRampToValueAtTime(500, t + 0.06);
  env(ac, g, t, { a: 0.003, peak: 0.08, r: 0.06 });
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + 0.1);
}

export const SOUNDS = { lion: roar, eagle: eagleCheer, balloon: burner, concert };
