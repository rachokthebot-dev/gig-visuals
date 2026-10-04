/* Renders the per-song demo beds to 30-second WAVs.
   Patterns and tempos come from js/themes.js so there is one source of truth;
   only the voices are reimplemented here (the browser ones are Web Audio nodes).
   Output is generated audio — nothing sampled, nothing copyrighted. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SR = 44100;
const SECONDS = 30;

const sandbox = {}; sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/themes.js'), 'utf8'), sandbox);
const THEMES = sandbox.GV.THEMES;

const freq = m => 440 * Math.pow(2, (m - 69) / 12);
const parse = ch => ch === '.' ? null : parseInt(ch, 16);

/* RBJ biquad, used as a one-shot filter over a voice's own buffer */
function biquad(type, f0, Q) {
  const w = 2 * Math.PI * f0 / SR, c = Math.cos(w), s = Math.sin(w), al = s / (2 * Q);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lowpass') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
  else if (type === 'highpass') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
  else { b0 = al; b1 = 0; b2 = -al; }                 // bandpass (constant peak)
  a0 = 1 + al; a1 = -2 * c; a2 = 1 - al;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return x => {
    const y = (b0 / a0) * x + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

const mix = (buf, at, samples) => {
  const i0 = Math.round(at * SR);
  for (let i = 0; i < samples.length; i++) {
    const j = i0 + i;
    if (j >= 0 && j < buf.length) buf[j] += samples[i];
  }
};

// exponential decay matching the browser's exponentialRampToValueAtTime shape
const decay = (n, peak, tau) => i => peak * Math.exp(-i / (tau * SR));

function kick(at, v) {
  const n = Math.round(0.4 * SR), o = new Float32Array(n);
  let ph = 0;
  const env = decay(n, 0.95 * v, 0.085);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 44 + (130 - 44) * Math.exp(-t / 0.028);   // pitch drop
    ph += 2 * Math.PI * f / SR;
    o[i] = Math.sin(ph) * env(i);
  }
  return o;
}

function snare(at, v) {
  const n = Math.round(0.25 * SR), o = new Float32Array(n);
  const bp = biquad('bandpass', 1900, 0.7);
  const envN = decay(n, 0.42 * v, 0.05), envT = decay(n, 0.25 * v, 0.032);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    o[i] = bp(Math.random() * 2 - 1) * envN(i);
    ph += 2 * Math.PI * 185 / SR;
    o[i] += Math.sin(ph) * envT(i);
  }
  return o;
}

function hat(at, v) {
  const n = Math.round(0.1 * SR), o = new Float32Array(n);
  const hp = biquad('highpass', 7500, 0.7);
  const env = decay(n, 0.10 * v, 0.016);
  for (let i = 0; i < n; i++) o[i] = hp(Math.random() * 2 - 1) * env(i);
  return o;
}

const saw = ph => 2 * (ph / (2 * Math.PI) - Math.floor(ph / (2 * Math.PI) + 0.5));

function bass(midi, dur) {
  const n = Math.round((dur + 0.1) * SR), o = new Float32Array(n);
  const env = decay(n, 0.34, dur / 3);
  const f = freq(midi);
  let ph = 0;
  // sweep the lowpass the way the browser voice does, in a few segments
  let lp = biquad('lowpass', 900, 2), seg = 0;
  for (let i = 0; i < n; i++) {
    const frac = Math.min(1, i / (dur * 0.8 * SR));
    const want = Math.floor(frac * 8);
    if (want !== seg) { seg = want; lp = biquad('lowpass', 900 * Math.pow(220 / 900, frac), 2); }
    ph += 2 * Math.PI * f / SR;
    o[i] = lp(saw(ph)) * env(i);
  }
  return o;
}

function guitar(midi, dur, drive) {
  const n = Math.round((dur + 0.1) * SR), o = new Float32Array(n);
  const env = decay(n, 0.16 + drive * 0.10, dur / 3);
  const lp = biquad('lowpass', 2600, 0.7);
  const k = 1 + drive * 12, norm = Math.tanh(k);
  // root, root, fifth, octave — a power chord, detuned like the browser voice
  const voices = [[0, -7], [0, 7], [7, 0], [12, 4]].map(([semi, cents]) => ({
    inc: 2 * Math.PI * freq(midi + semi) * Math.pow(2, cents / 1200) / SR, ph: Math.random() * 6.28
  }));
  for (let i = 0; i < n; i++) {
    let x = 0;
    for (const v of voices) { v.ph += v.inc; x += saw(v.ph); }
    o[i] = lp(Math.tanh((x / 4) * k) / norm) * env(i);
  }
  return o;
}

function render(th) {
  const n = SECONDS * SR, buf = new Float32Array(n);
  const a = th.audio;
  const spStep = (60 / th.bpm) / 4;
  const steps = Math.ceil(SECONDS / spStep);
  for (let s = 0; s < steps; s++) {
    const t = s * spStep, i = s % 16;
    if (t > SECONDS) break;
    const accent = i === 0 ? 1.0 : 0.82;
    if (a.kick[i] === '1') mix(buf, t, kick(t, accent));
    if (a.snare[i] === '1') mix(buf, t, snare(t, accent));
    if (a.hat[i] === '1') mix(buf, t, hat(t, i % 4 === 0 ? 1.0 : 0.6));
    const b = parse(a.bass[i]);
    if (b !== null) mix(buf, t, bass(a.root + b, spStep * 3.2));
    const g = parse(a.gtr[i]);
    if (g !== null) mix(buf, t, guitar(a.root + 12 + g, spStep * 5.5, a.drive));
  }
  // top and tail, then normalise to -1 dBFS
  const fi = Math.round(0.05 * SR), fo = Math.round(0.6 * SR);
  for (let i = 0; i < fi; i++) buf[i] *= i / fi;
  for (let i = 0; i < fo; i++) buf[n - 1 - i] *= i / fo;
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(buf[i]));
  const gain = peak > 0 ? (Math.pow(10, -1 / 20) / peak) : 1;
  for (let i = 0; i < n; i++) buf[i] *= gain;
  return { buf, peak };
}

function wav(buf) {
  const n = buf.length, out = Buffer.alloc(44 + n * 2);
  out.write('RIFF', 0); out.writeUInt32LE(36 + n * 2, 4); out.write('WAVE', 8);
  out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22); out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 2, 28);
  out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, buf[i]));
    out.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  return out;
}

const dir = path.join(ROOT, 'demo');
fs.mkdirSync(dir, { recursive: true });
for (const th of THEMES) {
  const { buf, peak } = render(th);
  fs.writeFileSync(path.join(dir, th.id + '.wav'), wav(buf));
  console.log(th.id.padEnd(20), th.bpm + ' bpm', ' peak ' + peak.toFixed(3));
}
console.log('wrote ' + THEMES.length + ' wavs to demo/');
