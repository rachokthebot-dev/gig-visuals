(function () {
  const T = GV.THEMES;
  const stage = document.getElementById('stage');
  const $ = id => document.getElementById(id);

  let song = 0;
  let override = null;          // forced engine, or null to follow the theme
  let source = 'mic';           // 'mic' | 'track' | 'synth'
  let vizzes = {};
  let active = null;
  let dpr = 1, started = false, t0 = 0;

  // 30s generated bed per song, shipped with the app; see tools/render-demo.js
  const demoUrl = i => 'demo/' + T[i].id + '.mp3';

  let artVariant = 0, artTimer = null;

  /* ---- visualizers -------------------------------------------------- */

  function make(kind) {
    if (vizzes[kind]) return vizzes[kind];
    const c = document.createElement('canvas');
    stage.appendChild(c);
    const v = kind === 'hydra' ? GV.VizHydra(c)
      : kind === 'milkdrop' ? GV.VizMilkdrop(c)
      : kind === 'fractal' ? GV.VizFractal(c)
      : kind === 'three' ? GV.VizThree(c)
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
    applyArt();            // a newly-switched-to engine has no image yet
  }

  function resizeAll() {
    dpr = Math.min(2, devicePixelRatio || 1);
    const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    for (const k in vizzes) vizzes[k].resize(w, h);
  }

  /* ---- set list ------------------------------------------------------ */

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
    GV.Audio.setSong(th);
    if (started && source !== 'mic') openFor(song, th);
    $('h-index').textContent = song + 1;
    $('h-title').textContent = th.title;
    $('h-artist').textContent = th.artist;
    show(currentKind());
    active.reset(th);
    applyArt();
    renderSetlist();
    syncTransport();
    wake();
  }

  /* ---- artwork --------------------------------------------------------- */

  // Only the MilkDrop engine takes a texture seed; the others ignore artwork.
  // All three engines take artwork; each uses it differently.
  function applyArt() {
    const v = active;
    if (!v || !v.setImage) return;
    const i = song, th = T[song];
    if (!GV.Art.enabled) { v.setImage(null); return; }
    const n = GV.Art.variantsFor(i);
    GV.Art.load(i, th, artVariant % n).then(img => {
      // a slow loader must not stamp its image over a song or engine we've left
      if (song === i && active === v && GV.Art.enabled) v.setImage(img);
    });
  }

  /* Cycle through a song's images while it plays, so a three-minute song isn't
     one static picture. Each change rides the same reveal the song change uses. */
  function startArtCycle() {
    clearInterval(artTimer);
    artTimer = setInterval(() => {
      if (!started || !GV.Art.enabled) return;
      if (GV.Art.variantsFor(song) < 2) return;
      artVariant++;
      applyArt();
    }, 9000);
  }

  function setArtStatus() {
    const n = GV.Art.localCount();
    $('art-status').textContent = n ? n + ' of ' + T.length + ' from your images' : 'generated set';
  }

  /* ---- transport ------------------------------------------------------ */

  function syncTransport() {
    const d = GV.Audio.data;
    $('c-play').innerHTML = d.playing ? '&#9646;&#9646;' : '&#9654;';
    $('c-play').hidden = source === 'mic';
    $('c-mute').hidden = source === 'mic';
    $('c-mute').innerHTML = d.muted ? '&#128263;' : '&#9834;';
    $('c-mute').classList.toggle('off', d.muted);
  }

  function setSetlist(open) {
    $('setlist').hidden = !open;
    document.body.classList.toggle('setlist-open', open);
  }

  function toLanding() {
    started = false;
    clearInterval(artTimer);
    GV.Audio.stop();
    $('hud').hidden = true;
    setSetlist(false);
    $('boot').hidden = false;
    $('boot-err').hidden = true;
  }

  $('c-back').onclick = toLanding;
  $('c-prev').onclick = () => select(song - 1);
  $('c-next').onclick = () => select(song + 1);
  $('c-play').onclick = () => { GV.Audio.togglePlay(); syncTransport(); wake(); };
  $('c-mute').onclick = () => { GV.Audio.setMuted(!GV.Audio.data.muted); syncTransport(); wake(); };

  /* ---- hud auto-dim --------------------------------------------------- */

  let idle = 0, lastFrame = 0;
  function wake() { idle = 0; $('hud').classList.remove('dim'); }

  addEventListener('mousemove', wake);
  addEventListener('touchstart', wake, { passive: true });

  /* ---- loop ----------------------------------------------------------- */

  function frame() {
    if (!started) return;
    requestAnimationFrame(frame);
    const au = GV.Audio.update();
    const th = T[song];
    const t = (performance.now() - t0) / 1000;

    show(currentKind());
    active.draw(au, th, t);

    $('h-bpm').textContent = au.bpm ? Math.round(au.bpm) : '--';
    $('h-conf').style.width = Math.round(au.bpmConf * 100) + '%';
    const dot = $('h-beat');
    dot.style.transform = 'scale(' + (0.6 + au.pulse * 1.1).toFixed(2) + ')';
    dot.style.opacity = (0.15 + au.pulse * 0.85).toFixed(2);
    dot.style.background = th.palette[2];

    // real elapsed seconds, not an assumed 60fps
    const nowS = performance.now() / 1000;
    idle += Math.min(0.25, lastFrame ? nowS - lastFrame : 0);
    lastFrame = nowS;
    if (idle > 4 && $('setlist').hidden) $('hud').classList.add('dim');
  }

  /* ---- keys ------------------------------------------------------------ */

  addEventListener('keydown', e => {
    if (!started) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') { toLanding(); return; }
    if (k === 'arrowright' || k === ' ') { select(song + 1); e.preventDefault(); }
    else if (k === 'arrowleft') select(song - 1);
    else if (k === '1') { override = 'hydra'; wake(); }
    else if (k === '2') { override = 'milkdrop'; wake(); }
    else if (k === '3') { override = 'flow'; wake(); }
    else if (k === '4') { override = 'fractal'; wake(); }
    else if (k === '5') { override = 'three'; wake(); }
    else if (k === '0') { override = null; wake(); }
    else if (k === 'p') { GV.Audio.togglePlay(); syncTransport(); wake(); }
    else if (k === 'm') { GV.Audio.setMuted(!GV.Audio.data.muted); syncTransport(); wake(); }
    else if (k === 'i') { GV.Art.enabled = !GV.Art.enabled; applyArt(); wake(); }
    else if (k === 's') setSetlist($('setlist').hidden);
    else if (k === 'h') $('hud').hidden = !$('hud').hidden;
    else if (k === 'f') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    }
  });
  addEventListener('resize', resizeAll);

  /* ---- source picking --------------------------------------------------- */

  const NOTES = {
    mic: 'The gig setting — listens to the room and reacts to whatever you play.',
    track: 'Plays your own files, analysed exactly like the mic would be.',
    synth: 'A 30-second bed per song — drums, bass and guitar at that song’s tempo and key. Ships with the app.'
  };

  function renderTrackList() {
    const ul = $('track-list');
    ul.innerHTML = '';
    T.forEach((th, i) => {
      const name = GV.Tracks.nameFor(i);
      const li = document.createElement('li');
      li.innerHTML = '<span class="' + (name ? 'ok' : 'no') + '">' + (name ? '&#10003;' : '&ndash;') + '</span>' +
        '<span class="ti"></span><span class="fn"></span>';
      li.querySelector('.ti').textContent = th.title;
      li.querySelector('.fn').textContent = name || 'demo bed';
      ul.appendChild(li);
    });
  }

  function setSource(s) {
    source = s;
    for (const id of ['mic', 'track', 'synth']) {
      const b = $('src-' + id);
      b.classList.toggle('on', id === s);
      b.setAttribute('aria-pressed', String(id === s));
    }
    $('src-note').textContent = NOTES[s];
    $('track-panel').hidden = s !== 'track';
    $('boot-err').hidden = true;
    if (s === 'track') renderTrackList();
  }

  $('src-mic').onclick = () => setSource('mic');
  $('src-track').onclick = () => setSource('track');
  $('src-synth').onclick = () => setSource('synth');

  $('art-input').onchange = e => {
    GV.Art.fromFiles(e.target.files, T);
    setArtStatus();
    if (started) applyArt();
  };

  $('file-input').onchange = e => {
    const n = GV.Tracks.fromFiles(e.target.files, T);
    renderTrackList();
    const err = $('boot-err');
    if (!n) { err.hidden = false; err.textContent = 'No file names matched a song in the set.'; }
    else err.hidden = true;
  };

  /* ---- boot -------------------------------------------------------------- */

  function begin(engine) {
    started = true;
    t0 = performance.now();
    $('boot').hidden = true;
    $('hud').hidden = false;
    setSetlist(true);
    $('h-total').textContent = T.length;
    $('h-src').textContent = source === 'mic' ? 'MIC' : source === 'track' ? 'TRACKS' : 'DEMO';
    $('h-src').classList.toggle('demo', source !== 'mic');
    resizeAll();
    song = 0;
    override = engine === 'auto' ? null : engine;
    select(0);
    startArtCycle();
    frame();
  }

  // demo clips loop; a real track running out moves the set on, the way it would live
  function openFor(i, th) {
    if (source === 'synth') return GV.Audio.useTrack(demoUrl(i), th, true);
    return GV.Audio.useTrack(GV.Tracks.urlFor(i) || demoUrl(i), th, !GV.Tracks.urlFor(i));
  }

  async function openSource() {
    if (source === 'mic') return GV.Audio.useMic();
    return openFor(0, T[0]);
  }

  document.querySelectorAll('.engine').forEach(btn => {
    btn.onclick = async () => {
      try {
        await openSource();
        begin(btn.dataset.engine);
      } catch (err) {
        const e = $('boot-err');
        e.hidden = false;
        e.textContent = 'Microphone unavailable (' + (err && err.name || err) +
          '). Allow access, or pick another source above.';
      }
    };
  });

  // a track running out moves the set on, the way it would live
  GV.Audio.onEnded(() => { if (started && source === 'track') select(song + 1); });

  // branding comes from the loaded theme file, so both set lists share this page
  document.title = (GV.SET_NAME || 'Block Party') + ' — Gig Visuals';
  $('set-name').textContent = GV.SET_NAME || 'Block Party';
  $('set-tagline').textContent = GV.SET_TAGLINE || 'Live visuals, driven by the room';
  const words = ['zero','one','two','three','four','five','six','seven','eight','nine','ten',
                 'eleven','twelve','thirteen','fourteen','fifteen','sixteen'];
  const sc = $('song-count');
  if (sc) sc.textContent = words[T.length] || String(T.length);

  setSource('mic');
  setArtStatus();
  GV.Tracks.fromFolder(T).then(n => { if (n) { setSource('track'); renderTrackList(); } });
  GV.Art.fromFolder(T).then(n => { if (n) { setArtStatus(); if (started) applyArt(); } });
})();
