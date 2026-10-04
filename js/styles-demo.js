/* One song, one set of artwork, eight MilkDrop styles side by side.

   Every tile runs the same engine on the same audio and the same picture — the
   only difference is the parameter block. They are my own, written to show what
   the added controls actually do rather than to imitate any existing preset. */
(function () {
  const $ = id => document.getElementById(id);
  const SONG_ID = 'anton-trava';

  const STYLES = [
    { name: 'Tunnel',    note: 'uniform zoom inward · line wave',
      p: { zoom: 0.990, rot: 0.003, warp: 0.45, decay: 0.966, waveAmp: 0.32, wave: 0 } },
    { name: 'Drift',     note: 'stretched horizontally · sideways pull',
      p: { zoom: 0.998, rot: 0.001, warp: 0.35, decay: 0.972, waveAmp: 0.28, wave: 0,
           sx: 1.006, sy: 0.995, dx: 0.5 } },
    { name: 'Curtain',   note: 'stretched vertically · falling',
      p: { zoom: 0.998, rot: 0.0008, warp: 0.40, decay: 0.970, waveAmp: 0.30, wave: 0,
           sx: 0.995, sy: 1.007, dy: -0.6 } },
    { name: 'Bloom',     note: 'zoom outward · circle wave',
      p: { zoom: 1.005, rot: 0.002, warp: 0.55, decay: 0.974, waveAmp: 0.26, wave: 1, ring: 0 } },
    { name: 'Spiral',    note: 'double spiral · strong rotation',
      p: { zoom: 0.992, rot: 0.013, warp: 0.50, decay: 0.964, waveAmp: 0.22, wave: 2, ring: 0.3, waveThick: 0.16, decay: 0.944 } },
    { name: 'Starburst', note: 'radial spokes · mirrored echo',
      p: { zoom: 0.993, rot: 0.004, warp: 0.30, decay: 0.968, waveAmp: 0.34, wave: 3,
           echo: 0.40, echoScale: 0.58, ring: 0, waveThick: 0.30, decay: 0.958 } },
    { name: 'Scope',     note: 'wave against a delayed copy · short trails',
      p: { zoom: 0.996, rot: 0.002, warp: 0.25, decay: 0.948, waveAmp: 0.40, wave: 4, ring: 0.3, waveThick: 0.55 } },
    { name: 'Prism',     note: 'echo plus slow hue rotation',
      p: { zoom: 0.994, rot: 0.005, warp: 0.60, decay: 0.970, waveAmp: 0.28, wave: 1,
           echo: 0.40, echoScale: 0.70, hue: 0.19, ring: 0, waveThick: 0.5, decay: 0.967 } }
  ];

  const theme = GV.THEMES.find(t => t.id === SONG_ID) || GV.THEMES[0];
  const tiles = [];
  let variant = 0, started = false, expanded = null;

  function themeFor(style) {
    return Object.assign({}, theme, { milkdrop: style.p });
  }

  function build() {
    const grid = $('grid');
    STYLES.forEach((st, i) => {
      const fig = document.createElement('figure');
      fig.className = 'tile';
      fig.innerHTML = '<figcaption><b></b><span></span></figcaption>';
      fig.querySelector('b').textContent = st.name;
      fig.querySelector('span').textContent = st.note;
      const cv = document.createElement('canvas');
      fig.insertBefore(cv, fig.firstChild);
      fig.onclick = () => expand(i);
      grid.appendChild(fig);
      let viz = null;
      try { viz = GV.VizMilkdrop(cv); } catch (e) { fig.classList.add('failed'); }
      tiles.push({ fig, cv, viz, style: st });
    });
  }

  function sizeTiles() {
    tiles.forEach(t => {
      if (!t.viz) return;
      const r = t.cv.getBoundingClientRect();
      const d = expanded !== null ? Math.min(2, devicePixelRatio || 1) : 1;
      t.viz.resize(Math.max(2, Math.round(r.width * d)), Math.max(2, Math.round(r.height * d)));
    });
  }
  addEventListener('resize', sizeTiles);

  function applyArt() {
    const url = 'art/' + SONG_ID + '-' + (variant + 1) + '.jpg';
    const img = new Image();
    img.onload = () => tiles.forEach(t => t.viz && t.viz.setImage(img));
    img.onerror = () => tiles.forEach(t => t.viz && t.viz.setImage(null));
    img.src = url;
    $('art-label').textContent = 'image ' + (variant + 1) + ' of 3';
  }

  function expand(i) {
    expanded = expanded === i ? null : i;
    document.body.classList.toggle('expanded', expanded !== null);
    tiles.forEach((t, j) => t.fig.classList.toggle('big', expanded === j));
    tiles.forEach((t, j) => t.fig.hidden = expanded !== null && expanded !== j);
    requestAnimationFrame(sizeTiles);
  }

  function frame() {
    requestAnimationFrame(frame);
    const au = GV.Audio.update();
    const t = performance.now() / 1000;
    tiles.forEach(tl => {
      if (!tl.viz || tl.fig.hidden) return;
      tl.viz.draw(au, themeFor(tl.style), t);
    });
    $('r-bpm').textContent = au.bpm ? Math.round(au.bpm) : '--';
  }

  $('start').onclick = () => {
    if (started) return;
    started = true;
    $('start').hidden = true;
    $('panel').hidden = false;
    build();
    sizeTiles();                 // must happen before the first draw
    applyArt();
    GV.Audio.useTrack('demo/' + SONG_ID + '.mp3', theme, true);
    GV.Audio.setMuted(true);                       // starts silent on purpose
    frame();
  };

  $('art-next').onclick = e => { e.stopPropagation(); variant = (variant + 1) % 3; applyArt(); };
  $('mute').onclick = () => {
    GV.Audio.setMuted(!GV.Audio.data.muted);
    $('mute').textContent = GV.Audio.data.muted ? 'Sound on' : 'Mute';
  };
  addEventListener('keydown', e => { if (e.key === 'Escape' && expanded !== null) expand(expanded); });
})();
