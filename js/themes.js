/* Per-song themes for the "Block Party" set list.
   Every song carries parameters for all three engines, because the engine is
   the viewer's choice — you can walk the whole set in any one of them.
   `viz` is just the engine the song is happiest in.
   `bpm` is a reference tempo used only as a prior for the detector; it stops
   the usual half-/double-time lock. Detected tempo always wins. */
window.GV = window.GV || {};

GV.THEMES = [
  {
    id: 'teen-spirit',
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    bpm: 117,
    viz: 'milkdrop',
    note: 'Nevermind pool — chlorine blue and bleached yellow, drifting underwater',
    bg: '#04141c',
    palette: ['#0e5f74', '#2bb4c8', '#e3d14a'],
    milkdrop: { zoom: 0.994, rot: 0.0025, warp: 0.55, decay: 0.965, waveAmp: 0.30 },
    hydra:    { kaleid: 4, oscFreq: 9,  modAmt: 0.80, rotSpeed: 0.05, feedback: 0.90 },
    flow:     { count: 800, curl: 0.8, speed: 0.6, trail: 0.10, burst: 1.0 }
  },
  {
    id: 'come-out-and-play',
    title: 'Come Out and Play',
    artist: 'The Offspring',
    bpm: 162,
    viz: 'hydra',
    note: 'Smash-era SoCal — scorched orange on black, hard snap on the beat',
    bg: '#0a0300',
    palette: ['#1a0a00', '#ff6a00', '#ffd400'],
    hydra:    { kaleid: 3, oscFreq: 14, modAmt: 0.45, rotSpeed: 0.18, feedback: 0.80 },
    milkdrop: { zoom: 0.985, rot: 0.008, warp: 0.35, decay: 0.940, waveAmp: 0.45 },
    flow:     { count: 1100, curl: 2.2, speed: 1.6, trail: 0.28, burst: 2.2 }
  },
  {
    id: 'seether',
    title: 'Seether',
    artist: 'Veruca Salt',
    bpm: 97,
    viz: 'flow',
    note: 'Candy-violet 90s alt — sugar-rush particles, pink over deep purple',
    bg: '#120618',
    palette: ['#ff2e88', '#b14cff', '#ffd1ec'],
    flow:     { count: 900, curl: 1.5, speed: 1.0, trail: 0.16, burst: 1.3 },
    hydra:    { kaleid: 6, oscFreq: 16, modAmt: 0.55, rotSpeed: 0.14, feedback: 0.84 },
    milkdrop: { zoom: 0.991, rot: 0.005, warp: 0.60, decay: 0.958, waveAmp: 0.35 }
  },
  {
    id: 'man-in-the-box',
    title: 'Man in the Box',
    artist: 'Alice In Chains',
    bpm: 106,
    viz: 'milkdrop',
    note: 'Facelift sludge — bile green, and the only theme that zooms inward',
    bg: '#0a0d07',
    palette: ['#1d2a10', '#7f9c2a', '#c9d98a'],
    milkdrop: { zoom: 1.006, rot: -0.0015, warp: 0.30, decay: 0.975, waveAmp: 0.22 },
    hydra:    { kaleid: 4, oscFreq: 6, modAmt: 0.35, rotSpeed: 0.03, feedback: 0.92 },
    flow:     { count: 600, curl: 0.6, speed: 0.5, trail: 0.07, burst: 0.9 }
  },
  {
    id: 'sweet-child',
    title: "Sweet Child O' Mine",
    artist: "Guns N' Roses",
    bpm: 125,
    viz: 'hydra',
    note: 'Appetite — desert gold and blood red, slow sepia bloom',
    bg: '#0d0603',
    palette: ['#2a1206', '#d98824', '#c0202a'],
    hydra:    { kaleid: 5, oscFreq: 8, modAmt: 0.70, rotSpeed: 0.06, feedback: 0.90 },
    milkdrop: { zoom: 0.996, rot: 0.0018, warp: 0.45, decay: 0.972, waveAmp: 0.28 },
    flow:     { count: 750, curl: 1.0, speed: 0.8, trail: 0.12, burst: 1.2 }
  },
  {
    id: 'possum-kingdom',
    title: 'Possum Kingdom',
    artist: 'Toadies',
    bpm: 120,
    viz: 'flow',
    note: 'Rubberneck lake at night — black water, moon-silver, one red eye',
    bg: '#04060f',
    palette: ['#1b3a6b', '#8fb6d9', '#d42030'],
    flow:     { count: 700, curl: 0.9, speed: 0.7, trail: 0.08, burst: 1.8 },
    hydra:    { kaleid: 2, oscFreq: 10, modAmt: 0.90, rotSpeed: 0.02, feedback: 0.93 },
    milkdrop: { zoom: 0.998, rot: 0.0012, warp: 0.70, decay: 0.978, waveAmp: 0.25 }
  },
  {
    id: 'chain-gang',
    title: 'Back On the Chain Gang',
    artist: 'Pretenders',
    bpm: 119,
    viz: 'hydra',
    note: '80s chrome and steel — cold blue links with a warm amber highlight',
    bg: '#050a10',
    palette: ['#0d2030', '#4f9fd1', '#ffb347'],
    hydra:    { kaleid: 8, oscFreq: 20, modAmt: 0.22, rotSpeed: 0.10, feedback: 0.86 },
    milkdrop: { zoom: 0.992, rot: 0.004, warp: 0.25, decay: 0.962, waveAmp: 0.32 },
    flow:     { count: 850, curl: 1.8, speed: 1.1, trail: 0.18, burst: 1.1 }
  },
  {
    id: 'immigrant-song',
    title: 'Immigrant Song',
    artist: 'Led Zeppelin',
    bpm: 113,
    viz: 'milkdrop',
    note: 'Ice and fire — a cyan glacier torn open by molten orange',
    bg: '#02080c',
    palette: ['#0b3a4a', '#39d6ff', '#ff5a12'],
    milkdrop: { zoom: 0.988, rot: 0.006, warp: 0.85, decay: 0.955, waveAmp: 0.42 },
    hydra:    { kaleid: 6, oscFreq: 11, modAmt: 0.85, rotSpeed: 0.22, feedback: 0.83 },
    flow:     { count: 1000, curl: 2.0, speed: 1.4, trail: 0.22, burst: 2.5 }
  }
];

GV.ENGINES = {
  hydra:    { name: 'Hydra',    tag: 'Shader chain' },
  milkdrop: { name: 'MilkDrop', tag: 'Feedback warp' },
  flow:     { name: 'p5',       tag: 'Flow field' }
};

GV.hexToRgb = function (hex) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
