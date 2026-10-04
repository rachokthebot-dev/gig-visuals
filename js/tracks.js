/* Matching local audio files to songs in the set list.
   Files never leave the machine and are never committed — either dropped into
   a gitignored ./tracks folder (listed by tracks/manifest.json) or picked by
   hand with the file input. */
window.GV = window.GV || {};

GV.Tracks = (function () {
  const STOP = new Set(['the', 'and', 'feat', 'ft', 'official', 'video', 'audio',
    'lyrics', 'hd', 'remastered', 'live', 'mp3', 'm4a', 'full', 'album', 'version']);

  const norm = s => s.toLowerCase()
    .replace(/\.[a-z0-9]{2,4}$/, '')
    .replace(/\[[^\]]*\]|\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const tokens = s => new Set(norm(s).split(' ').filter(t => t.length > 1 && !STOP.has(t)));

  function score(fileName, th) {
    const f = tokens(fileName);
    if (!f.size) return 0;
    const want = tokens(th.title);
    const artist = tokens(th.artist);
    let hitT = 0, hitA = 0;
    want.forEach(t => { if (f.has(t)) hitT++; });
    artist.forEach(t => { if (f.has(t)) hitA++; });
    // title carries the match; artist only breaks ties between similar titles
    return (hitT / want.size) * 0.85 + (artist.size ? (hitA / artist.size) * 0.15 : 0);
  }

  /* Greedy best-first assignment so two songs can't claim the same file. */
  function assign(entries, themes) {
    const pairs = [];
    themes.forEach((th, ti) => entries.forEach((e, ei) => {
      const s = score(e.name, th);
      if (s >= 0.5) pairs.push({ s, ti, ei });
    }));
    pairs.sort((a, b) => b.s - a.s);
    const byTheme = {}, usedFile = new Set();
    for (const p of pairs) {
      if (byTheme[p.ti] || usedFile.has(p.ei)) continue;
      byTheme[p.ti] = entries[p.ei];
      usedFile.add(p.ei);
    }
    return byTheme;
  }

  const store = {};   // theme index -> { name, url }

  function adopt(entries, themes) {
    const m = assign(entries, themes);
    for (const k in m) {
      if (store[k] && store[k].revoke) URL.revokeObjectURL(store[k].url);
      store[k] = m[k];
    }
    return Object.keys(m).length;
  }

  function fromFiles(fileList, themes) {
    const entries = [...fileList]
      .filter(f => /^audio\//.test(f.type) || /\.(mp3|m4a|aac|ogg|opus|wav|webm|flac)$/i.test(f.name))
      .map(f => ({ name: f.name, url: URL.createObjectURL(f), revoke: true }));
    return adopt(entries, themes);
  }

  /* Optional local convenience: ./tracks/manifest.json is a plain array of
     file names sitting next to it. Absent on the deployed copy, which is the
     point — nothing copyrighted is ever published. */
  async function fromFolder(themes) {
    try {
      const r = await fetch('tracks/manifest.json', { cache: 'no-store' });
      if (!r.ok) return 0;
      const names = await r.json();
      if (!Array.isArray(names)) return 0;
      return adopt(names.map(n => ({ name: n, url: 'tracks/' + encodeURIComponent(n) })), themes);
    } catch (e) { return 0; }
  }

  return {
    fromFiles, fromFolder,
    urlFor: i => store[i] && store[i].url,
    nameFor: i => store[i] && store[i].name,
    count: () => Object.keys(store).length
  };
})();
