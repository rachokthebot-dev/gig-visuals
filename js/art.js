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
    get enabled() { return enabled; },
    set enabled(v) { enabled = !!v; }
  };
})();
