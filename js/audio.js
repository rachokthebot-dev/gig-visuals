/* Mic capture -> band energies, spectral-flux onsets, autocorrelation tempo. */
window.GV = window.GV || {};

GV.Audio = (function () {
  const FFT = 2048;
  const HIST = 384;            // flux history frames (~6.4s at 60fps)
  const MIN_BPM = 60, MAX_BPM = 200;

  let ctx = null, analyser = null, stream = null;
  let freq = null, time = null, prevMag = null;
  let fluxHist = new Float32Array(HIST), fluxIdx = 0, fluxFilled = 0;
  let frameDt = 1 / 60, lastT = 0;
  let lastOnset = -1e9, beatPhase = 0, pulse = 0;
  let bpm = 0, bpmConf = 0, period = 0.5;
  let prior = 120;
  let demo = false, demoT = 0;

  const out = {
    running: false, demo: false,
    level: 0, bass: 0, lowMid: 0, mid: 0, high: 0,
    flux: 0, bpm: 0, bpmConf: 0, beatPhase: 0, pulse: 0,
    spectrum: new Float32Array(128),
    waveform: new Float32Array(256)
  };

  function binRange(lo, hi) {
    const nyq = ctx.sampleRate / 2, n = analyser.frequencyBinCount;
    return [Math.max(0, Math.floor(lo / nyq * n)), Math.min(n - 1, Math.ceil(hi / nyq * n))];
  }

  function avg(arr, a, b) {
    let s = 0;
    for (let i = a; i <= b; i++) s += arr[i];
    return (b >= a) ? s / (b - a + 1) / 255 : 0;
  }

  async function start() {
    if (out.running) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    });
    const src = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = FFT;
    analyser.smoothingTimeConstant = 0.6;
    src.connect(analyser);
    freq = new Uint8Array(analyser.frequencyBinCount);
    time = new Float32Array(analyser.fftSize);
    prevMag = new Float32Array(analyser.frequencyBinCount);
    out.running = true; out.demo = demo = false;
    lastT = performance.now() / 1000;
  }

  function stop() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (ctx) ctx.close();
    ctx = analyser = stream = null;
    out.running = false;
  }

  function startDemo() {
    if (out.running) stop();
    demo = true; out.demo = true; out.running = true;
    demoT = 0; lastT = performance.now() / 1000;
  }

  function setPrior(b) { prior = b || 120; }

  /* Fold a tempo into [MIN_BPM, MAX_BPM] then toward the song's reference tempo,
     which is what kills the usual half/double-time lock. */
  function foldToPrior(b) {
    while (b < MIN_BPM) b *= 2;
    while (b > MAX_BPM) b /= 2;
    let best = b, bestErr = Math.abs(Math.log2(b / prior));
    for (const m of [0.5, 2, 1 / 3, 3, 2 / 3, 1.5]) {
      const c = b * m;
      if (c < MIN_BPM || c > MAX_BPM) continue;
      const e = Math.abs(Math.log2(c / prior));
      if (e < bestErr) { bestErr = e; best = c; }
    }
    return best;
  }

  function estimateTempo() {
    const n = Math.min(fluxFilled, HIST);
    if (n < 180) return;
    // unwrap ring buffer, mean-remove
    const e = new Float32Array(n);
    let mean = 0;
    for (let i = 0; i < n; i++) { e[i] = fluxHist[(fluxIdx - n + i + HIST) % HIST]; mean += e[i]; }
    mean /= n;
    for (let i = 0; i < n; i++) e[i] -= mean;

    const loLag = Math.max(2, Math.round(60 / MAX_BPM / frameDt));
    const hiLag = Math.min(n - 8, Math.round(60 / MIN_BPM / frameDt));
    let bestLag = 0, bestScore = 0;
    for (let lag = loLag; lag <= hiLag; lag++) {
      let s = 0, na = 0, nb = 0;
      for (let i = 0; i + lag < n; i++) { s += e[i] * e[i + lag]; na += e[i] * e[i]; nb += e[i + lag] * e[i + lag]; }
      const d = Math.sqrt(na * nb);
      if (d <= 0) continue;
      let score = s / d;
      score *= 1 - 0.25 * Math.abs(Math.log2((60 / (lag * frameDt)) / prior)); // mild prior tilt
      if (score > bestScore) { bestScore = score; bestLag = lag; }
    }
    if (!bestLag) return;
    const cand = foldToPrior(60 / (bestLag * frameDt));
    bpmConf = Math.max(0, Math.min(1, bestScore));
    bpm = bpm ? bpm + (cand - bpm) * 0.15 : cand;
    period = 60 / bpm;
  }

  let tempoTick = 0;

  function update() {
    const now = performance.now() / 1000;
    const dt = Math.min(0.1, Math.max(1 / 240, now - lastT));
    lastT = now;
    frameDt = frameDt * 0.95 + dt * 0.05;

    if (!out.running) return out;

    if (demo) {
      demoT += dt;
      period = 60 / prior; bpm = prior; bpmConf = 1;
      const ph = (demoT % period) / period;
      const kick = Math.exp(-ph * 14);
      const snare = Math.exp(-(((demoT % (period * 2)) / period - 1 + 2) % 2) * 10);
      out.bass = 0.25 + 0.7 * kick;
      out.lowMid = 0.2 + 0.4 * kick + 0.25 * Math.abs(Math.sin(demoT * 1.7));
      out.mid = 0.18 + 0.5 * snare + 0.2 * Math.abs(Math.sin(demoT * 2.3));
      out.high = 0.12 + 0.35 * snare + 0.15 * Math.abs(Math.sin(demoT * 5.1));
      out.level = (out.bass + out.mid) * 0.45;
      out.flux = kick;
      for (let i = 0; i < out.spectrum.length; i++) {
        const f = i / out.spectrum.length;
        out.spectrum[i] = Math.max(0, (1 - f) * (0.4 + 0.6 * kick) + 0.25 * Math.sin(demoT * 3 + i * 0.4) * (1 - f));
      }
      for (let i = 0; i < out.waveform.length; i++) {
        const t = i / out.waveform.length;
        out.waveform[i] = 0.6 * Math.sin(t * 28 + demoT * 9) * (0.3 + 0.7 * kick)
          + 0.25 * Math.sin(t * 71 + demoT * 17) * snare;
      }
      beatPhase = ph;
      pulse = Math.max(pulse * Math.exp(-dt * 7), kick);
      out.bpm = bpm; out.bpmConf = 1; out.beatPhase = beatPhase; out.pulse = pulse;
      return out;
    }

    analyser.getByteFrequencyData(freq);
    analyser.getFloatTimeDomainData(time);

    const [b0, b1] = binRange(30, 160);
    const [m0, m1] = binRange(160, 600);
    const [d0, d1] = binRange(600, 2500);
    const [h0, h1] = binRange(2500, 9000);
    const k = 1 - Math.exp(-dt * 14);
    out.bass += (avg(freq, b0, b1) - out.bass) * k;
    out.lowMid += (avg(freq, m0, m1) - out.lowMid) * k;
    out.mid += (avg(freq, d0, d1) - out.mid) * k;
    out.high += (avg(freq, h0, h1) - out.high) * k;

    let rms = 0;
    for (let i = 0; i < time.length; i++) rms += time[i] * time[i];
    out.level += (Math.min(1, Math.sqrt(rms / time.length) * 4) - out.level) * k;

    // spectral flux, weighted to the percussive low-mid where the kit lives
    let f = 0;
    for (let i = b0; i <= h1; i++) {
      const v = freq[i] / 255;
      const d = v - prevMag[i];
      if (d > 0) f += d * (i <= d1 ? 1.6 : 0.5);
      prevMag[i] = v;
    }
    f /= (h1 - b0 + 1);
    out.flux = f;
    fluxHist[fluxIdx] = f;
    fluxIdx = (fluxIdx + 1) % HIST;
    fluxFilled++;

    // adaptive onset threshold over the last ~1s
    const w = Math.min(fluxFilled, 64);
    let mu = 0, sd = 0;
    for (let i = 0; i < w; i++) mu += fluxHist[(fluxIdx - 1 - i + HIST) % HIST];
    mu /= w;
    for (let i = 0; i < w; i++) { const x = fluxHist[(fluxIdx - 1 - i + HIST) % HIST] - mu; sd += x * x; }
    sd = Math.sqrt(sd / w);
    const isOnset = f > mu + 1.6 * sd + 1e-4 && (now - lastOnset) > 0.12;

    if (++tempoTick % 20 === 0) estimateTempo();

    if (bpm) {
      beatPhase = (beatPhase + dt / period) % 1;
      if (isOnset) {
        lastOnset = now;
        // nudge phase toward the onset instead of snapping, so a stray hit can't derail it
        const err = beatPhase > 0.5 ? beatPhase - 1 : beatPhase;
        beatPhase -= err * 0.25;
        if (beatPhase < 0) beatPhase += 1;
      }
    } else if (isOnset) { lastOnset = now; beatPhase = 0; }

    pulse = Math.max(pulse * Math.exp(-dt * 7), isOnset ? Math.min(1, f / (mu + 2 * sd + 1e-5) * 0.5) : 0);

    for (let i = 0; i < out.spectrum.length; i++) {
      const src = Math.floor(Math.pow(i / out.spectrum.length, 1.7) * (analyser.frequencyBinCount - 1));
      out.spectrum[i] = freq[src] / 255;
    }
    const step = Math.floor(time.length / out.waveform.length);
    for (let i = 0; i < out.waveform.length; i++) out.waveform[i] = time[i * step];

    out.bpm = bpm; out.bpmConf = bpmConf; out.beatPhase = beatPhase; out.pulse = pulse;
    return out;
  }

  return { start, stop, startDemo, update, setPrior, data: out };
})();
