/* Renders the per-song demo beds to 30-second stereo WAVs.
   Patterns and tempos come from js/themes.js so there is one source of truth.
   Everything here is generated — nothing sampled, nothing copyrighted.

   This is deliberately more than oscillators-through-a-clipper. What makes a
   synthesised rock bed read as "played" rather than "programmed":
     - guitars double-tracked as two separate takes panned hard L/R
     - a cabinet response (presence peak + steep rolloff) rather than a lowpass
     - hats built from inharmonic squares, not filtered white noise
     - a room around the kit instead of bone-dry hits
     - timing and velocity humanisation on every note
   It still won't be a recording. For the real songs, use the My tracks source. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SR = 44100;
const SECONDS = 30;

const sandbox = {}; sandbox.window = sandbox;
vm.createContext(sandbox);
const THEMES_FILE = process.argv[2] || 'js/themes.js';
vm.runInContext(fs.readFileSync(path.join(ROOT, THEMES_FILE), 'utf8'), sandbox);
const THEMES = sandbox.GV.THEMES;

const freq = m => 440 * Math.pow(2, (m - 69) / 12);
const parse = ch => ch === '.' ? null : parseInt(ch, 16);
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---- filters ---------------------------------------------------------- */

function biquad(type, f0, Q, dbGain) {
  f0 = Math.max(20, Math.min(SR / 2 - 100, f0));
  const w = 2 * Math.PI * f0 / SR, c = Math.cos(w), s = Math.sin(w), al = s / (2 * Q);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lowpass') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; }
  else if (type === 'highpass') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; }
  else if (type === 'bandpass') { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; }
  else { // peaking
    const A = Math.pow(10, dbGain / 40);
    b0 = 1 + al * A; b1 = -2 * c; b2 = 1 - al * A;
    a0 = 1 + al / A; a1 = -2 * c; a2 = 1 - al / A;
  }
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return x => {
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

const chain = (...fs) => x => fs.reduce((v, f) => f(v), x);

/* A 4x12 cabinet is the difference between "distorted oscillator" and "guitar":
   no top above ~5k, a presence bump, and nothing below the low string. */
const cabinet = () => chain(
  biquad('highpass', 95, 0.7),
  biquad('peaking', 2600, 1.1, 7),
  biquad('peaking', 450, 1.0, -4),
  biquad('lowpass', 6200, 0.8),
  biquad('lowpass', 7000, 0.6)
);

const saw = ph => 2 * (ph / (2 * Math.PI) - Math.floor(ph / (2 * Math.PI) + 0.5));
const square = ph => (ph / (2 * Math.PI) - Math.floor(ph / (2 * Math.PI))) < 0.5 ? 1 : -1;
const decay = (peak, tau) => i => peak * Math.exp(-i / (tau * SR));

/* Asymmetric soft clip — the asymmetry adds even harmonics, which is most of
   what separates a valve amp from a symmetric digital clipper. */
function drive(x, k) {
  const y = x >= 0 ? Math.tanh(x * k) : Math.tanh(x * k * 0.82);
  return y / Math.tanh(k);
}

/* ---- voices ----------------------------------------------------------- */

function kick(v) {
  const n = Math.round(0.55 * SR), o = new Float32Array(n);
  const body = decay(1.0, 0.10), sub = decay(0.30, 0.11), click = decay(0.6, 0.004);
  const hp = biquad('highpass', 1800, 0.7);
  const dc = biquad('highpass', 34, 0.7);
  let p1 = 0, p2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 48 + 105 * Math.exp(-t / 0.022);      // beater pitch drop
    p1 += 2 * Math.PI * f / SR;
    p2 += 2 * Math.PI * 47 / SR;
    let x = Math.sin(p1) * body(i) + Math.sin(p2) * sub(i);
    x += hp(Math.random() * 2 - 1) * click(i);      // beater click
    o[i] = dc(drive(x * 0.9, 1.6)) * v;
  }
  return o;
}

function snare(v) {
  const n = Math.round(0.42 * SR), o = new Float32Array(n);
  // two tuned heads plus a long, slowly-closing noise tail reads as a drum;
  // a single bandpassed burst reads as a hiss
  const b1 = decay(0.45, 0.045), b2 = decay(0.30, 0.030);
  const nz = decay(0.75, 0.085), buzz = decay(0.22, 0.17);
  const bp = biquad('bandpass', 2100, 0.55);
  const bp2 = biquad('bandpass', 4600, 0.8);
  const hp = biquad('highpass', 320, 0.7);
  let p1 = 0, p2 = 0;
  for (let i = 0; i < n; i++) {
    p1 += 2 * Math.PI * 186 / SR;
    p2 += 2 * Math.PI * 263 / SR;
    const w = Math.random() * 2 - 1;
    let x = Math.sin(p1) * b1(i) + Math.sin(p2) * b2(i);
    x += bp(w) * nz(i) + bp2(w) * buzz(i) * 0.6;
    o[i] = drive(hp(x) * 0.8, 1.5) * v;
  }
  return o;
}

/* Six inharmonic squares is the classic metallic-hat recipe; white noise
   through a highpass always sounds like white noise through a highpass. */
const HAT_RATIOS = [2.0, 3.0, 4.16, 5.43, 6.79, 8.21];
function hat(v, open) {
  const dur = open ? 0.30 : 0.065;
  const n = Math.round((dur + 0.03) * SR), o = new Float32Array(n);
  const env = decay(1.0, dur / 3.2);
  // base is chosen so 317*ratios would fall below the highpass; 1400 puts the
  // partials at 2.8-11.5kHz, i.e. inside the band this filter passes
  const hp = chain(biquad('highpass', 6000, 0.7), biquad('highpass', 6000, 0.7));
  const bp = biquad('peaking', 9800, 0.8, 4);
  const ph = HAT_RATIOS.map(() => 0);
  for (let i = 0; i < n; i++) {
    let x = 0;
    for (let k = 0; k < HAT_RATIOS.length; k++) {
      ph[k] += 2 * Math.PI * (1400 * HAT_RATIOS[k]) / SR;
      x += square(ph[k]);
    }
    o[i] = bp(hp(x / 6)) * env(i) * v * 1.9;
  }
  return o;
}

function bass(midi, dur, v) {
  const n = Math.round((dur + 0.15) * SR), o = new Float32Array(n);
  const env = decay(1.0, dur / 2.6);
  const f = freq(midi);
  const lp = biquad('lowpass', 2600, 0.7);
  const body = biquad('peaking', 110, 1.0, 2);
  const hp = biquad('highpass', 45, 0.7);
  const pick = decay(0.35, 0.006);
  const pf = biquad('bandpass', 2600, 0.9);
  let p1 = 0, p2 = 0;
  for (let i = 0; i < n; i++) {
    p1 += 2 * Math.PI * f / SR;
    p2 += 2 * Math.PI * f * 1.002 / SR;             // slight detune, two strings' worth
    let x = saw(p1) * 0.6 + square(p2) * 0.4;
    x = drive(x * 1.3, 2.2) * env(i);
    x += pf(Math.random() * 2 - 1) * pick(i);       // pick attack
    o[i] = hp(body(lp(x))) * v * 0.60;
  }
  return o;
}

/* One take of a power chord. Called twice per hit with fresh randomisation so
   the two takes can be panned apart — double-tracking is the single biggest
   reason a real rhythm track sounds wide and a synth patch sounds flat. */
function guitarTake(midi, dur, driveAmt, v) {
  const n = Math.round((dur + 0.2) * SR), o = new Float32Array(n);
  const env = decay(1.0, dur / 2.4);
  const cab = cabinet();
  const pre = chain(biquad('highpass', 110, 0.7), biquad('peaking', 820, 0.9, 5));
  const k = 2 + driveAmt * 22;
  const pick = decay(0.5, 0.004);
  const pf = biquad('bandpass', 3200, 0.8);
  // root, fifth, octave — two slightly detuned strings each
  const voices = [];
  for (const semi of [0, 7, 12]) {
    for (const d of [-1, 1]) {
      voices.push({
        ph: rnd(0, 6.283),
        inc: 2 * Math.PI * freq(midi + semi) * Math.pow(2, (d * rnd(3, 9)) / 1200) / SR,
        drift: rnd(-0.00002, 0.00002)
      });
    }
  }
  for (let i = 0; i < n; i++) {
    let x = 0;
    for (const vo of voices) { vo.inc += vo.drift / SR; vo.ph += vo.inc; x += saw(vo.ph); }
    x = drive(pre(x / voices.length) * 2.2, k) * env(i);
    x += pf(Math.random() * 2 - 1) * pick(i) * 0.5;
    o[i] = cab(x) * v;
  }
  return o;
}

/* ---- room ------------------------------------------------------------- */

function comb(delay, fb, damp) {
  const buf = new Float32Array(delay);
  let i = 0, last = 0;
  return x => {
    const y = buf[i];
    last = y * (1 - damp) + last * damp;
    buf[i] = x + last * fb;
    i = (i + 1) % delay;
    return y;
  };
}

function allpass(delay, g) {
  const buf = new Float32Array(delay);
  let i = 0;
  return x => {
    const y = buf[i];
    buf[i] = x + y * g;
    i = (i + 1) % delay;
    return y - g * x;
  };
}

/* Schroeder reverb, detuned per channel so the room has width. */
function room(seed) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491].map(d =>
    comb(d + seed, 0.80, 0.28));
  const aps = [556, 441, 341].map(d => allpass(d + seed, 0.5));
  return x => {
    let y = 0;
    for (const c of combs) y += c(x);
    y /= combs.length;
    for (const a of aps) y = a(y);
    return y;
  };
}

/* ---- bus -------------------------------------------------------------- */

function compress(L, R, thresh, ratio, atk, rel) {
  let envv = 0;
  const a = Math.exp(-1 / (atk * SR)), r = Math.exp(-1 / (rel * SR));
  for (let i = 0; i < L.length; i++) {
    const lvl = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    envv = lvl > envv ? a * envv + (1 - a) * lvl : r * envv + (1 - r) * lvl;
    let g = 1;
    if (envv > thresh) g = (thresh + (envv - thresh) / ratio) / envv;
    L[i] *= g; R[i] *= g;
  }
}

/* ---- arrangement ------------------------------------------------------ */

function render(th) {
  const n = SECONDS * SR;
  const L = new Float32Array(n), R = new Float32Array(n);
  const sendL = new Float32Array(n), sendR = new Float32Array(n);
  const a = th.audio;
  const spStep = (60 / th.bpm) / 4;
  const steps = Math.ceil(SECONDS / spStep);

  const place = (at, buf, panL, panR, send) => {
    const i0 = Math.round(at * SR);
    for (let i = 0; i < buf.length; i++) {
      const j = i0 + i;
      if (j < 0 || j >= n) continue;
      L[j] += buf[i] * panL; R[j] += buf[i] * panR;
      if (send) { sendL[j] += buf[i] * panL * send; sendR[j] += buf[i] * panR * send; }
    }
  };

  for (let s = 0; s < steps; s++) {
    const i = s % 16;
    // humanise: a few ms of timing scatter and real velocity variation
    const jitter = rnd(-0.006, 0.006);
    const t = s * spStep + jitter;
    if (t > SECONDS) break;
    const onBeat = i % 4 === 0;
    const accent = (i === 0 ? 1.0 : onBeat ? 0.90 : 0.78) * rnd(0.90, 1.0);

    if (a.kick[i] === '1') place(t, kick(accent), 0.72, 0.72, 0.10);
    if (a.snare[i] === '1') place(t, snare(accent * 0.95), 0.70, 0.70, 0.34);
    if (a.hat[i] === '1') {
      const open = (i === 14);                       // one open hat before the turnaround
      place(t, hat(onBeat ? 0.85 : 0.55, open), 0.46, 0.60, 0.16);
    }
    const b = parse(a.bass[i]);
    if (b !== null) place(t, bass(a.root + b, spStep * 3.2, accent * 0.9), 0.70, 0.70, 0.04);
    const g = parse(a.gtr[i]);
    if (g !== null) {
      const dur = spStep * 5.5, note = a.root + 12 + g, v = accent * 0.55;
      // two independent takes, hard-ish left and right
      place(t + rnd(-0.004, 0.004), guitarTake(note, dur, a.drive, v), 0.92, 0.18, 0.12);
      place(t + rnd(-0.004, 0.004), guitarTake(note, dur, a.drive, v), 0.18, 0.92, 0.12);
    }
  }

  const rl = room(0), rr = room(23);
  for (let i = 0; i < n; i++) {
    L[i] += rl(sendL[i]) * 0.55;
    R[i] += rr(sendR[i]) * 0.55;
  }

  const tiltL = chain(biquad('highpass', 34, 0.7), biquad('peaking', 60, 1.0, -3), biquad('peaking', 9000, 0.7, 2));
  const tiltR = chain(biquad('highpass', 34, 0.7), biquad('peaking', 60, 1.0, -3), biquad('peaking', 9000, 0.7, 2));
  for (let i = 0; i < n; i++) { L[i] = tiltL(L[i]); R[i] = tiltR(R[i]); }

  compress(L, R, 0.30, 3.5, 0.006, 0.12);

  const fi = Math.round(0.03 * SR), fo = Math.round(0.5 * SR);
  for (let i = 0; i < fi; i++) { L[i] *= i / fi; R[i] *= i / fi; }
  for (let i = 0; i < fo; i++) { const g = i / fo; L[n - 1 - i] *= g; R[n - 1 - i] *= g; }

  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const gain = peak > 0 ? Math.pow(10, -1 / 20) / peak : 1;
  for (let i = 0; i < n; i++) { L[i] *= gain; R[i] *= gain; }
  return { L, R, peak };
}

function wav(L, R) {
  const n = L.length, bytes = n * 4, out = Buffer.alloc(44 + bytes);
  out.write('RIFF', 0); out.writeUInt32LE(36 + bytes, 4); out.write('WAVE', 8);
  out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20);
  out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28);
  out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(bytes, 40);
  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, L[i])), r = Math.max(-1, Math.min(1, R[i]));
    out.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    out.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
  }
  return out;
}

const dir = path.join(ROOT, 'demo');
fs.mkdirSync(dir, { recursive: true });
for (const th of THEMES) {
  const t0 = Date.now();
  const { L, R, peak } = render(th);
  fs.writeFileSync(path.join(dir, th.id + '.wav'), wav(L, R));
  console.log(th.id.padEnd(20), String(th.bpm).padStart(3) + ' bpm',
    ' peak ' + peak.toFixed(2), ' ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
console.log('wrote ' + THEMES.length + ' stereo wavs to demo/');
