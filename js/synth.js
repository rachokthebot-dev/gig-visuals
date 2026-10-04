/* Per-song audio bed: drums, bass and guitar at each song's tempo and key.
   Not the songs themselves — a characteristic bed, so the demo makes sound
   and the detector has something real to listen to.

   Patterns are 16 steps = one bar of 4/4 (step 0 = beat 1, 4 = beat 2, ...).
   '.' is a rest; '0'-'9' and 'a'-'f' are semitone offsets above the root. */
window.GV = window.GV || {};

GV.Synth = function (ctx) {
  const master = ctx.createGain();
  master.gain.value = 0.0;             // faded in on start

  // one second of white noise, reused for snare and hats
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  // tanh-ish curve; `drive` picks how hard the guitar is pushed into it
  function curve(k) {
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      c[i] = Math.tanh(x * (1 + k * 12)) / Math.tanh(1 + k * 12);
    }
    return c;
  }

  const freq = m => 440 * Math.pow(2, (m - 69) / 12);
  const parse = ch => ch === '.' ? null : parseInt(ch, 16);

  function env(node, t, peak, attack, decay) {
    const g = node.gain;
    g.setValueAtTime(0.0001, t);
    g.exponentialRampToValueAtTime(peak, t + attack);
    g.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  function kick(t, v) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.09);
    env(g, t, 0.95 * v, 0.004, 0.30);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.4);
  }

  function snare(t, v) {
    const n = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    n.buffer = noiseBuf; n.loop = true;
    bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 0.7;
    env(g, t, 0.42 * v, 0.002, 0.16);
    n.connect(bp).connect(g).connect(master);
    n.start(t); n.stop(t + 0.25);

    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = 185;
    env(og, t, 0.25 * v, 0.002, 0.10);
    o.connect(og).connect(master);
    o.start(t); o.stop(t + 0.2);
  }

  function hat(t, v) {
    const n = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    n.buffer = noiseBuf; n.loop = true;
    hp.type = 'highpass'; hp.frequency.value = 7500;
    env(g, t, 0.10 * v, 0.001, 0.045);
    n.connect(hp).connect(g).connect(master);
    n.start(t); n.stop(t + 0.1);
  }

  function bass(t, midi, dur) {
    const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = freq(midi);
    lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(900, t);
    lp.frequency.exponentialRampToValueAtTime(220, t + dur * 0.8);
    env(g, t, 0.34, 0.008, dur);
    o.connect(lp).connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.1);
  }

  // two detuned saws into a waveshaper — a power chord, root + fifth
  function guitar(t, midi, dur, drive) {
    const ws = ctx.createWaveShaper(); ws.curve = curve(drive);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    const g = ctx.createGain();
    env(g, t, 0.16 + drive * 0.10, 0.006, dur);
    ws.connect(lp).connect(g).connect(master);
    for (const [semi, det] of [[0, -7], [0, 7], [7, 0], [12, 4]]) {
      const o = ctx.createOscillator();
      o.type = drive > 0.4 ? 'sawtooth' : 'triangle';
      o.frequency.value = freq(midi + semi);
      o.detune.value = det;
      o.connect(ws);
      o.start(t); o.stop(t + dur + 0.1);
    }
  }

  let song = null, timer = null, step = 0, nextTime = 0, running = false;
  const LOOKAHEAD = 0.12, TICK = 25;

  function tick() {
    if (!song) return;
    const spStep = (60 / song.bpm) / 4;          // one sixteenth
    while (nextTime < ctx.currentTime + LOOKAHEAD) {
      const a = song.audio, i = step % 16;
      const accent = i === 0 ? 1.0 : 0.82;
      if (a.kick[i]  === '1') kick(nextTime, accent);
      if (a.snare[i] === '1') snare(nextTime, accent);
      if (a.hat[i]   === '1') hat(nextTime, i % 4 === 0 ? 1.0 : 0.6);
      const b = parse(a.bass[i]);
      if (b !== null) bass(nextTime, a.root + b, spStep * 3.2);
      const gtr = parse(a.gtr[i]);
      if (gtr !== null) guitar(nextTime, a.root + 12 + gtr, spStep * 5.5, a.drive);
      nextTime += spStep;
      step++;
    }
  }

  function setSong(th) {
    const changing = song && song.audio !== th.audio;
    song = th;
    if (changing) step = 0;                      // restart the bar on a song change
  }

  function start(th) {
    setSong(th);
    step = 0;
    nextTime = ctx.currentTime + 0.08;
    running = true;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.9, ctx.currentTime + 0.4);
    timer = setInterval(tick, TICK);
  }

  function stop() {
    running = false;
    clearInterval(timer); timer = null;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
  }

  return { node: master, start, stop, setSong, get running() { return running; } };
};
