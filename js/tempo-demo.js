/* Side-by-side demonstration of the one thing a preset visualiser cannot do.

   Both panels receive identical audio from the same analyser. The left reacts
   to the amplitude envelope, which is how MilkDrop-family visualisers work —
   it has `bass`, `mid`, `treb` and nothing else. The right runs on a tracked
   period and phase, so it knows where the next beat lands before it arrives.

   The clip has six seconds with no percussion at all. That is the whole point:
   the left panel has nothing to follow, the right keeps time. */
(function () {
  const $ = id => document.getElementById(id);
  const CLIPS = [
    { id: 'tempo-breakdown', label: 'Breakdown test', bpm: 120,
      note: '120 BPM · beat, then 6s with no percussion at all, then beat' },
    { id: 'teen-spirit',  label: 'Demo bed · 117', bpm: 117, note: 'steady generated bed' },
    { id: 'immigrant-song', label: 'Demo bed · 113', bpm: 113, note: 'steady generated bed' }
  ];
  let clip = CLIPS[0], running = false, lastPhase = 1, ampFlash = 0, beatFlash = 0, t0 = 0;

  const L = $('cv-amp'), R = $('cv-beat');
  const lc = L.getContext('2d'), rc = R.getContext('2d');

  function size() {
    for (const c of [L, R]) {
      const r = c.getBoundingClientRect();
      const d = Math.min(2, devicePixelRatio || 1);
      c.width = Math.round(r.width * d); c.height = Math.round(r.height * d);
    }
  }
  addEventListener('resize', size);

  function ring(ctx, cv, radius, colour, alpha, width) {
    const w = cv.width, h = cv.height;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.max(1, radius * Math.min(w, h) * 0.42), 0, Math.PI * 2);
    ctx.strokeStyle = colour; ctx.globalAlpha = alpha;
    ctx.lineWidth = width * Math.min(w, h) * 0.012;
    ctx.stroke(); ctx.globalAlpha = 1;
  }

  function paint(ctx, cv, bg) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = bg; ctx.fillRect(0, 0, cv.width, cv.height);
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!L.width || !R.width) size();
    const au = GV.Audio.update();
    const t = (performance.now() - t0) / 1000;
    const dt = 1 / 60;

    // ---- left: amplitude only -------------------------------------------
    paint(lc, L, '#0a0c10');
    ampFlash = Math.max(ampFlash - dt * 4, au.flux > 0.004 ? 1 : 0);
    const amp = 0.18 + au.level * 0.75;
    ring(lc, L, amp, '#5f6b7a', 0.85, 1.1);
    ring(lc, L, amp * (1 + ampFlash * 0.22), '#9fb0c4', 0.25 + ampFlash * 0.7, 1.6);
    lc.fillStyle = '#6d7a89';
    lc.font = (0.030 * L.width) + 'px ui-sans-serif, system-ui, sans-serif';
    lc.textAlign = 'center';
    lc.fillText('level ' + au.level.toFixed(2), L.width / 2, L.height - 0.06 * L.height);

    // ---- right: tempo locked --------------------------------------------
    paint(rc, R, '#070d0c');
    if (au.beatPhase < lastPhase) beatFlash = 1;          // phase wrapped: a beat
    lastPhase = au.beatPhase;
    beatFlash = Math.max(0, beatFlash - dt * 3.2);
    const pulse = 0.30 + beatFlash * 0.55;
    ring(rc, R, pulse, '#2bb4c8', 0.9, 1.3);
    ring(rc, R, pulse * 1.35, '#7fd3a8', 0.18 + beatFlash * 0.6, 1.0);
    // the predicted beat grid keeps advancing whether or not anything is audible
    const bw = R.width, by = R.height - 0.055 * R.height;
    for (let i = 0; i < 16; i++) {
      const x = (i + 0.5) / 16 * bw;
      const on = Math.floor(au.beatPhase * 4) % 4 === i % 4;
      rc.fillStyle = on ? '#2bb4c8' : '#17313a';
      rc.fillRect(x - bw / 90, by, bw / 45, R.height * 0.012);
    }
    rc.fillStyle = '#5d8f93';
    rc.font = (0.030 * R.width) + 'px ui-sans-serif, system-ui, sans-serif';
    rc.textAlign = 'center';
    rc.fillText('phase ' + au.beatPhase.toFixed(2), R.width / 2, R.height - 0.10 * R.height);

    // ---- readouts --------------------------------------------------------
    $('r-bpm').textContent = au.bpm ? Math.round(au.bpm) : '--';
    $('r-conf').style.width = Math.round(au.bpmConf * 100) + '%';
    $('r-flux').textContent = au.flux.toFixed(4);
    $('r-level').textContent = au.level.toFixed(2);

    // mark the silent stretch on the breakdown clip
    const inBreak = clip.id === 'tempo-breakdown' && (t % 26) >= 10 && (t % 26) < 16;
    $('breakbar').classList.toggle('on', inBreak);
  }

  function start(c) {
    clip = c;
    [...document.querySelectorAll('.clip')].forEach(b =>
      b.classList.toggle('on', b.dataset.clip === c.id));
    $('clip-note').textContent = c.note;
    GV.Audio.useTrack('demo/' + c.id + '.mp3', { bpm: c.bpm, id: c.id }, true);
    // unhide BEFORE measuring: a hidden element has a zero bounding rect, so
    // sizing first left both canvases at 0x0 and nothing ever drew
    $('start-wrap').hidden = true;
    $('stage2').hidden = false;
    size();
    if (!running) { running = true; t0 = performance.now(); frame(); }
  }

  const row = $('clips');
  CLIPS.forEach(c => {
    const b = document.createElement('button');
    b.className = 'clip'; b.dataset.clip = c.id; b.textContent = c.label;
    b.onclick = () => start(c);
    row.appendChild(b);
  });
  $('start').onclick = () => start(CLIPS[0]);
  $('mute').onclick = () => {
    GV.Audio.setMuted(!GV.Audio.data.muted);
    $('mute').textContent = GV.Audio.data.muted ? 'Unmute' : 'Mute';
  };
})();
