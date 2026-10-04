/* Matching local file names to songs in the set list. Shared by the audio
   track loader and the image loader — both face the same messy-filename job. */
window.GV = window.GV || {};

GV.Match = (function () {
  const STOP = new Set(['the', 'and', 'feat', 'ft', 'official', 'video', 'audio',
    'lyrics', 'hd', 'remastered', 'live', 'mp3', 'm4a', 'full', 'album', 'version',
    'cover', 'art', 'artwork', 'front', 'sleeve']);

  const norm = s => s.toLowerCase()
    .replace(/\.[a-z0-9]{2,4}$/, '')
    .replace(/\[[^\]]*\]|\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const tokens = s => new Set(norm(s).split(' ').filter(t => t.length > 1 && !STOP.has(t)));

  function score(fileName, th) {
    const f = tokens(fileName);
    if (!f.size) return 0;
    const want = tokens(th.title), artist = tokens(th.artist);
    let hitT = 0, hitA = 0;
    want.forEach(t => { if (f.has(t)) hitT++; });
    artist.forEach(t => { if (f.has(t)) hitA++; });
    // title carries the match; artist only breaks ties between similar titles
    return (hitT / want.size) * 0.85 + (artist.size ? (hitA / artist.size) * 0.15 : 0);
  }

  const artistScore = (fileName, th) => {
    const f = tokens(fileName), a = tokens(th.artist);
    if (!a.size || !f.size) return 0;
    let hit = 0;
    a.forEach(t => { if (f.has(t)) hit++; });
    return hit / a.size;
  };

  /* Greedy best-first, so two songs can't claim the same file.

     Then a second pass on artist alone, but only for artists appearing exactly
     once in the set. Cover art is usually named for the album rather than the
     track ("Nirvana - Nevermind.jpg"), which the title-based pass can never
     match; when the artist is unique the attribution is still unambiguous. */
  function assign(entries, themes, min) {
    const pairs = [];
    themes.forEach((th, ti) => entries.forEach((e, ei) => {
      const s = score(e.name, th);
      if (s >= (min || 0.5)) pairs.push({ s, ti, ei });
    }));
    pairs.sort((a, b) => b.s - a.s);
    const byTheme = {}, used = new Set();
    for (const p of pairs) {
      if (byTheme[p.ti] || used.has(p.ei)) continue;
      byTheme[p.ti] = entries[p.ei];
      used.add(p.ei);
    }

    const perArtist = {};
    themes.forEach(th => { perArtist[th.artist] = (perArtist[th.artist] || 0) + 1; });
    const second = [];
    themes.forEach((th, ti) => {
      if (byTheme[ti] || perArtist[th.artist] !== 1) return;
      entries.forEach((e, ei) => {
        if (used.has(ei)) return;
        const s = artistScore(e.name, th);
        if (s >= 0.999) second.push({ s, ti, ei });
      });
    });
    for (const p of second) {
      if (byTheme[p.ti] || used.has(p.ei)) continue;
      byTheme[p.ti] = entries[p.ei];
      used.add(p.ei);
    }
    return byTheme;
  }

  /* A store of theme-index -> {name, url}, fed either by a file picker or by a
     manifest.json listing a gitignored folder's contents. */
  function store(folder, exts) {
    const items = {};
    const re = new RegExp('\\.(' + exts.join('|') + ')$', 'i');

    function adopt(entries, themes) {
      const m = assign(entries, themes);
      for (const k in m) {
        if (items[k] && items[k].revoke) URL.revokeObjectURL(items[k].url);
        items[k] = m[k];
      }
      return Object.keys(m).length;
    }

    return {
      fromFiles(fileList, themes) {
        return adopt([...fileList]
          .filter(f => re.test(f.name))
          .map(f => ({ name: f.name, url: URL.createObjectURL(f), revoke: true })), themes);
      },
      async fromFolder(themes) {
        try {
          const r = await fetch(folder + '/manifest.json', { cache: 'no-store' });
          if (!r.ok) return 0;
          const names = await r.json();
          if (!Array.isArray(names)) return 0;
          return adopt(names.map(n => ({ name: n, url: folder + '/' + encodeURIComponent(n) })), themes);
        } catch (e) { return 0; }
      },
      urlFor: i => items[i] && items[i].url,
      nameFor: i => items[i] && items[i].name,
      count: () => Object.keys(items).length
    };
  }

  return { score, assign, store };
})();
