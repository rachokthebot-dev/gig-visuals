/* Images fed into the MilkDrop engine as a texture seed.

   Two layers: the generated artwork in ./art that ships with the app, and an
   optional override from ./my-art (gitignored) or the file picker — which is
   where album covers belong, since those can't be published. */
window.GV = window.GV || {};

GV.Art = (function () {
  const local = GV.Match.store('my-art', ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);
  const cache = {};
  let enabled = true;

  const N = (window.GV && GV.ART_VARIANTS) || 3;
  const shippedUrl = (th, v) => 'art/' + th.id + '-' + ((v % N + N) % N + 1) + '.jpg';

  // A local override is a single picture, so it has no variants.
  function urlFor(i, th, v) {
    return local.urlFor(i) || shippedUrl(th, v || 0);
  }
  const variantsFor = i => local.urlFor(i) ? 1 : N;

  /* Resolves to an HTMLImageElement, or null if nothing loads — a missing
     image must leave the visualiser running, not break it. */
  function load(i, th, v) {
    const url = urlFor(i, th, v);
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
    isLocal: i => !!local.urlFor(i),
    nameFor: i => local.nameFor(i),
    fromFiles: (files, themes) => local.fromFiles(files, themes),
    fromFolder: themes => local.fromFolder(themes),
    localCount: () => local.count(),
    get enabled() { return enabled; },
    set enabled(v) { enabled = !!v; }
  };
})();
