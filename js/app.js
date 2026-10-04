(function () {
  const T = GV.THEMES;
  const stage = document.getElementById('stage');
  const $ = id => document.getElementById(id);

  let song = 0;
  let override = null;          // forced engine, or null to follow the theme
  let vizzes = {};
  let active = null;
  let dpr = 1, started = false, t0 = 0;

  function make(kind) {
    if (vizzes[kind]) return vizzes[kind];
    const c = document.createElement('canvas');
    stage.appendChild(c);
    const v = kind === 'hydra' ? GV.VizHydra(c)
      : kind === 'milkdrop' ? GV.VizMilkdrop(c)
      : GV.VizFlow(c);
    v.resize(Math.round(innerWidth * dpr), Math.round(innerHeight * dpr));
    vizzes[kind] = v;
    return v;
  }

  function currentKind() { return override || T[song].viz; }

  function show(kind) {
    const v = make(kind);
    if (active === v) return;
    if (active) active.canvas.classList.remove('on');
    active = v;
    v.reset(T[song]);
    v.canvas.classList.add('on');
    $('h-viz').textContent = v.label;
  }

  function resizeAll() {
    dpr = Math.min(2, devicePixelRatio || 1);
    const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    for (const k in vizzes) vizzes[k].resize(w, h);
  }

  function renderSetlist() {
    const ol = $('setlist-items');
    ol.innerHTML = '';
    T.forEach((th, i) => {
      const li = document.createElement('li');
      li.className = i === song ? 'active' : '';
      li.style.setProperty('--accent', th.palette[1]);
      li.title = th.note;
      li.innerHTML =
        '<span class="num">' + (i + 1) + '</span>' +
        '<span class="nm"><span class="t"></span><span class="a"></span></span>' +
        '<span class="sw">' + th.palette.map(c => '<i style="background:' + c + '"></i>').join('') + '</span>';
      li.querySelector('.t').textContent = th.title;
      li.querySelector('.a').textContent = th.artist + ' · ' + th.bpm + ' bpm · ' + th.viz;
      li.onclick = () => select(i);
      ol.appendChild(li);
    });
  }

  function select(i) {
    song = (i + T.length) % T.length;
    const th = T[song];
    document.body.style.background = th.bg;
    GV.Audio.setPrior(th.bpm);
    $('h-index').textContent = song + 1;
    $('h-title').textContent = th.title;
    $('h-artist').textContent = th.artist;
    show(currentKind());
    active.reset(th);
    renderSetlist();
    wake();
  }

  /* --- hud auto-dim --- */
  let idle = 0;
  function wake() { idle = 0; $('hud').classList.remove('dim'); }
  addEventListener('mousemove', wake);
  addEventListener('touchstart', wake, { passive: true });

  /* --- loop --- */
  function frame() {
    requestAnimationFrame(frame);
    const au = GV.Audio.update();
    const th = T[song];
    const t = (performance.now() - t0) / 1000;

    show(currentKind());
    active.draw(au, th, t);

    const bpm = au.bpm ? Math.round(au.bpm) : 0;
    $('h-bpm').textContent = bpm || '--';
    $('h-conf').style.width = Math.round(au.bpmConf * 100) + '%';
    const dot = $('h-beat');
    const s = 0.6 + au.pulse * 1.1;
    dot.style.transform = 'scale(' + s.toFixed(2) + ')';
    dot.style.opacity = (0.15 + au.pulse * 0.85).toFixed(2);
    dot.style.background = th.palette[2];

    idle += 1 / 60;
    if (idle > 4 && $('setlist').hidden) $('hud').classList.add('dim');
  }

  /* --- keys --- */
  addEventListener('keydown', e => {
    if (!started) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowright' || k === ' ') { select(song + 1); e.preventDefault(); }
    else if (k === 'arrowleft') select(song - 1);
    else if (k === '1') { override = 'hydra'; wake(); }
    else if (k === '2') { override = 'milkdrop'; wake(); }
    else if (k === '3') { override = 'flow'; wake(); }
    else if (k === '0') { override = null; wake(); }
    else if (k === 's') $('setlist').hidden = !$('setlist').hidden;
    else if (k === 'h') $('hud').hidden = !$('hud').hidden;
    else if (k === 'f') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    }
  });
  addEventListener('resize', resizeAll);

  /* --- boot --- */
  let useDemo = false;

  function begin(engine) {
    started = true;
    t0 = performance.now();
    $('boot').hidden = true;
    $('hud').hidden = false;
    $('setlist').hidden = false;
    $('h-total').textContent = T.length;
    $('h-src').textContent = useDemo ? 'PREVIEW' : 'MIC';
    $('h-src').classList.toggle('demo', useDemo);
    resizeAll();
    select(0);
    override = engine === 'auto' ? null : engine;
    show(currentKind());
    frame();
  }

  function setSource(demo) {
    useDemo = demo;
    $('src-mic').classList.toggle('on', !demo);
    $('src-demo').classList.toggle('on', demo);
    $('src-mic').setAttribute('aria-pressed', String(!demo));
    $('src-demo').setAttribute('aria-pressed', String(demo));
    $('boot-err').hidden = true;
  }
  $('src-mic').onclick = () => setSource(false);
  $('src-demo').onclick = () => setSource(true);

  document.querySelectorAll('.engine').forEach(btn => {
    btn.onclick = async () => {
      const engine = btn.dataset.engine;
      if (useDemo) { GV.Audio.startDemo(); return begin(engine); }
      try {
        await GV.Audio.start();
        begin(engine);
      } catch (err) {
        const e = $('boot-err');
        e.hidden = false;
        e.textContent = 'Microphone unavailable (' + (err && err.name || err) +
          '). Allow access, or switch to Preview above.';
      }
    };
  });
})();
