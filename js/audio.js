/* One analysis path, three sources.
   - mic     : the room, at the gig
   - track   : the user's own local file, via an <audio> element
   - synth   : the built-in per-song bed, so the shared link is never silent
   Only track and synth reach the speakers; routing the mic there would howl. */
window.GV = window.GV || {};

GV.Audio = (function () {
  const FFT = 2048;
  const HIST = 384;            // flux frames (~6.4s at 60fps)
  const MIN_BPM = 60, MAX_BPM = 200;

  let ctx = null, analyser = null, outGain = null;
  let stream = null, micNode = null, elNode = null, synth = null, el = null;
  let freq = null, timeBuf = null, prevMag = null;
  let fluxHist = new Float32Array(HIST), fluxIdx = 0, fluxFilled = 0;
  let frameDt = 1 / 60, lastT = 0, tempoTick = 0;
  let lastOnset = -1e9, beatPhase = 0, pulse = 0;
  let bpm = 0, bpmConf = 0, period = 0.5, prior = 120;
  let theme = null, endedCb = null;

  const out = {
    running: false, mode: 'mic', muted: false, playing: false,
    level: 0, bass: 0, lowMid: 0, mid: 0, high: 0,
    flux: 0, bpm: 0, bpmConf: 0, beatPhase: 0, pulse: 0,
    spectrum: new Float32Array(128),
    waveform: new Float32Array(256)
  };

  function ensure() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = ctx.createAnalyser();
    analyser.fftSize = FFT;
    analyser.smoothingTimeConstant = 0.6;
    outGain = ctx.createGain();
    outGain.gain.value = 1;
    outGain.connect(ctx.destination);
    freq = new Uint8Array(analyser.frequencyBinCount);
    timeBuf = new Float32Array(analyser.fftSize);
    prevMag = new Float32Array(analyser.frequencyBinCount);
    el = new Audio();
    el.crossOrigin = 'anonymous';
    el.preload = 'auto';
    el.addEventListener('play', () => { out.playing = true; });
    el.addEventListener('pause', () => { out.playing = false; });
    el.addEventListener('ended', () => { if (endedCb) endedCb(); });
    elNode = ctx.createMediaElementSource(el);   // only legal once per element
    elNode.connect(analyser);
    elNode.connect(outGain);
  }

  /* Seed from the song's reference tempo rather than zero: detection needs ~3s
     of history, and a dead beat pulse between songs is very visible at a gig.
     Confidence starts at 0 and only rises once the autocorrelation agrees. */
  function resetDetector() {
    fluxIdx = 0; fluxFilled = 0; fluxHist.fill(0);
    if (prevMag) prevMag.fill(0);
    bpm = prior; period = 60 / prior; bpmConf = 0; pulse = 0; beatPhase = 0;
  }

  function detach() {
    if (micNode) { micNode.disconnect(); micNode = null; }
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    if (synth) { synth.stop(); synth.node.disconnect(); synth = null; }
    if (el) { el.pause(); el.removeAttribute('src'); el.load(); }
    out.playing = false;
  }

  async function useMic() {
    ensure(); detach();
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    });
    micNode = ctx.createMediaStreamSource(stream);
    micNode.connect(analyser);                   // deliberately not to outGain
    out.mode = 'mic'; out.running = true;
    resetDetector();
    lastT = performance.now() / 1000;
    await ctx.resume();
  }

  function useSynth(th) {
    theme = th; prior = th.bpm || 120;
    ensure(); detach();
    synth = GV.Synth(ctx);
    synth.node.connect(analyser);
    synth.node.connect(outGain);
    synth.start(th);
    out.mode = 'synth'; out.running = true; out.playing = true;
    resetDetector();
    lastT = performance.now() / 1000;
    ctx.resume();
  }

  /* Tracks fall back to the synth bed per song, so a half-filled tracks folder
     still plays all the way through the set. */
  function useTrack(url, th) {
    theme = th; prior = th.bpm || 120;
    ensure();
    if (url) {
      if (synth) { synth.stop(); synth.node.disconnect(); synth = null; }
      if (micNode) { micNode.disconnect(); micNode = null; }
      if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
      el.src = url;
      el.currentTime = 0;
      el.play().catch(() => {});
    } else {
      el.pause(); el.removeAttribute('src'); el.load();
      if (!synth) { synth = GV.Synth(ctx); synth.node.connect(analyser); synth.node.connect(outGain); synth.start(th); }
      else synth.setSong(th);
      out.playing = true;
    }
    out.mode = 'track'; out.running = true;
    resetDetector();
    lastT = performance.now() / 1000;
    ctx.resume();
  }

  function setSong(th) {
    theme = th;
    prior = th.bpm || 120;
    if (synth) synth.setSong(th);
    resetDetector();
  }

  function togglePlay() {
    if (out.mode === 'mic') return;
    if (el && el.src && !el.paused) { el.pause(); return; }
    if (el && el.src) { el.play().catch(() => {}); return; }
    if (synth && theme) {
      if (synth.running) { synth.stop(); out.playing = false; }
      else { synth.start(theme); out.playing = true; }
    }
  }

  function setMuted(m) {
    out.muted = m;
    if (outGain) outGain.gain.value = m ? 0 : 1;   // analyser is upstream, visuals keep reacting
  }

  function stop() { detach(); out.running = false; }

  /* ---- analysis ---------------------------------------------------- */

  function binRange(lo, hi) {
    const nyq = ctx.sampleRate / 2, n = analyser.frequencyBinCount;
    return [Math.max(0, Math.floor(lo / nyq * n)), Math.min(n - 1, Math.ceil(hi / nyq * n))];
  }

  function avg(arr, a, b) {
    let s = 0;
    for (let i = a; i <= b; i++) s += arr[i];
    return (b >= a) ? s / (b - a + 1) / 255 : 0;
  }

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
      let sc = s / d;
      sc *= 1 - 0.25 * Math.abs(Math.log2((60 / (lag * frameDt)) / prior));
      if (sc > bestScore) { bestScore = sc; bestLag = lag; }
    }
    if (!bestLag) return;
    const cand = foldToPrior(60 / (bestLag * frameDt));
    bpmConf = Math.max(0, Math.min(1, bestScore));
    bpm = bpm ? bpm + (cand - bpm) * 0.15 : cand;
    period = 60 / bpm;
  }

  function update() {
    const now = performance.now() / 1000;
    const dt = Math.min(0.1, Math.max(1 / 240, now - lastT));
    lastT = now;
    frameDt = frameDt * 0.95 + dt * 0.05;
    if (!out.running) return out;

    analyser.getByteFrequencyData(freq);
    analyser.getFloatTimeDomainData(timeBuf);

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
    for (let i = 0; i < timeBuf.length; i++) rms += timeBuf[i] * timeBuf[i];
    out.level += (Math.min(1, Math.sqrt(rms / timeBuf.length) * 4) - out.level) * k;

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
    const step = Math.floor(timeBuf.length / out.waveform.length);
    for (let i = 0; i < out.waveform.length; i++) out.waveform[i] = timeBuf[i * step];

    out.bpm = bpm; out.bpmConf = bpmConf; out.beatPhase = beatPhase; out.pulse = pulse;
    return out;
  }

  return { useMic, useSynth, useTrack, setSong, togglePlay, setMuted, stop, update, data: out,
           onEnded: cb => { endedCb = cb; } };
})();
