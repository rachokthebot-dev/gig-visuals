/* Images fed into the MilkDrop engine as a texture seed.

   Two layers: the generated artwork in ./art that ships with the app, and an
   optional override from ./my-art (gitignored) or the file picker — which is
   where album covers belong, since those can't be published. */
window.GV = window.GV || {};

GV.Art = (function () {
  const local = GV.Match.store('my-art', ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);
  const vids  = GV.Match.store('my-video', ['mp4', 'm4v', 'mov', 'webm']);
  const cache = {};
  let enabled = true;

  /* How much the artwork asserts itself.

     This is not just a dimmer. At `texture` the picture is meant to stop being
     a picture: the reveal that re-forms it on each song change is nearly off,
     and Hydra leans on its mirror-tiled sample (which destroys legibility)
     while Three drops the photo as a backdrop and keeps it only in reflections.
     The result reads as stage lighting rather than as content competing with
     the band. `showcase` is the opposite, and is what the shared link wants. */
  const LEVELS = [
    { id: 'texture',  label: 'TEXTURE',  mix: 0.45, reveal: 0.15, flatBias: 0.15, background: false },
    { id: 'balanced', label: 'BALANCED', mix: 1.00, reveal: 1.00, flatBias: 0.65, background: true  },
    { id: 'showcase', label: 'SHOWCASE', mix: 1.35, reveal: 1.50, flatBias: 0.90, background: true  }
  ];
  const KEY = 'gv-presence';
  let idx = 1;
  try { const v = localStorage.getItem(KEY); if (v !== null) idx = Math.min(2, Math.max(0, +v | 0)); } catch (e) {}

  function setPresence(i) {
    idx = ((i % LEVELS.length) + LEVELS.length) % LEVELS.length;
    try { localStorage.setItem(KEY, String(idx)); } catch (e) {}
    return LEVELS[idx];
  }

  const N = (window.GV && GV.ART_VARIANTS) || 3;
  const shippedUrl = (th, v) => 'art/' + th.id + '-' + ((v % N + N) % N + 1) + '.jpg';

  // A local override is a single asset, so it has no variants.
  function urlFor(i, th, v) {
    return vids.urlFor(i) || local.urlFor(i) || shippedUrl(th, v || 0);
  }
  const variantsFor = i => (vids.urlFor(i) || local.urlFor(i)) ? 1 : N;

  /* A clip has to be muted and inline for browsers to let it autoplay. */
  function loadVideo(url) {
    if (cache[url] !== undefined) return Promise.resolve(cache[url]);
    return new Promise(res => {
      const v = document.createElement('video');
      v.src = url; v.loop = true; v.muted = true; v.defaultMuted = true;
      v.playsInline = true; v.autoplay = true; v.crossOrigin = 'anonymous';
      v.addEventListener('loadeddata', () => { v.play().catch(() => {}); cache[url] = v; res(v); }, { once: true });
      v.addEventListener('error', () => { cache[url] = null; res(null); }, { once: true });
      v.load();
    });
  }

  /* Resolves to an HTMLImageElement, or null if nothing loads — a missing
     image must leave the visualiser running, not break it. */
  function load(i, th, v) {
    const url = urlFor(i, th, v);
    if (vids.urlFor(i) === url) return loadVideo(url);
    if (cache[url] !== undefined) return Promise.resolve(cache[url]);
    return new Promise(res => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { cache[url] = img; res(img); };
      img.onerror = () => { cache[url] = null; res(null); };
      img.src = url;
    });
  }

  return {
    load, urlFor, variantsFor,
    isLocal: i => !!(local.urlFor(i) || vids.urlFor(i)),
    isVideo: i => !!vids.urlFor(i),
    nameFor: i => vids.nameFor(i) || local.nameFor(i),
    fromFiles: (files, themes) => {
      const all = [...files];
      const isVid = f => /^video\//.test(f.type) || /\.(mp4|m4v|mov|webm)$/i.test(f.name);
      return local.fromFiles(all.filter(f => !isVid(f)), themes)
           + vids.fromFiles(all.filter(isVid), themes);
    },
    fromFolder: themes => Promise.all([local.fromFolder(themes), vids.fromFolder(themes)]).then(r => r[0] + r[1]),
    localCount: () => local.count() + vids.count(),
    get level() { return LEVELS[idx]; },
    cyclePresence: () => setPresence(idx + 1),
    setPresence,
    get enabled() { return enabled; },
    set enabled(v) { enabled = !!v; }
  };
})();
