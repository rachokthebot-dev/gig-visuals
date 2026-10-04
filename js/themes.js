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
    sdf:      { amp: 1.2, freq: 0.42, fog: 0.085, speed: 1.8, sharp: 0.15 },
    three:    { shape: 'ico',   metal: 0.75, rough: 0.28, disp: 1.1, spin: 0.7 },
    fractal:  { seed: [-0.79, 0.15], zoom: 1.45, iter: 95, ship: false, trap: 0.75, spin: 0.018, cRad: 0.035 },
    // F — mid-tempo rock backbeat, clean verse into a dirty chorus
    audio: { root: 41, drive: 0.75, kick: '1.......1.1.....', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0...5...3...8...', gtr: '0...5...3...8...' },
    milkdrop: { zoom: 0.994, rot: 0.0025, warp: 0.55, decay: 0.965, waveAmp: 0.30 },
    hydra:    { kaleid: 4, oscFreq: 12, modAmt: 0.50, rotSpeed: 0.05, feedback: 0.88 },
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
    sdf:      { amp: 2.2, freq: 0.70, fog: 0.040, speed: 4.0, sharp: 0.75 },
    three:    { shape: 'knot',  metal: 0.95, rough: 0.12, disp: 0.7, spin: 2.2 },
    fractal:  { seed: [-0.40, 0.60], zoom: 1.15, iter: 70, ship: true,  trap: 0.55, spin: 0.085, cRad: 0.055 },
    // E phrygian — fast punk, that flattened second doing the heavy lifting
    audio: { root: 40, drive: 0.85, kick: '1...1...1...1...', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0.1.3.1.0.1.3.1.', gtr: '0.......1.......' },
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
    sdf:      { amp: 1.5, freq: 0.50, fog: 0.060, speed: 2.6, sharp: 0.25 },
    three:    { shape: 'torus', metal: 0.70, rough: 0.30, disp: 1.3, spin: 1.2 },
    fractal:  { seed: [0.285, 0.013], zoom: 1.70, iter: 125, ship: false, trap: 0.90, spin: 0.040, cRad: 0.030 },
    // A — grunge-pop, lands hard on the four
    audio: { root: 45, drive: 0.60, kick: '1.......1.......', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0...0...5...7...', gtr: '0.......5...7...' },
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
    sdf:      { amp: 1.0, freq: 0.60, fog: 0.110, speed: 1.4, sharp: 0.50 },
    three:    { shape: 'ico',   metal: 0.55, rough: 0.52, disp: 0.6, spin: 0.4 },
    fractal:  { seed: [-0.835, -0.232], zoom: 1.05, iter: 80, ship: true,  trap: 0.45, spin: 0.012, cRad: 0.020 },
    // E — half-time sludge, snare only on the three
    audio: { root: 40, drive: 0.90, kick: '1.....1.1.......', snare: '........1.......', hat: '1...1...1...1...', bass: '0.....0.3.....0.', gtr: '0.......3.......' },
    milkdrop: { zoom: 1.006, rot: -0.0015, warp: 0.30, decay: 0.975, waveAmp: 0.22 },
    hydra:    { kaleid: 4, oscFreq: 10, modAmt: 0.30, rotSpeed: 0.03, feedback: 0.90 },
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
    sdf:      { amp: 2.0, freq: 0.38, fog: 0.045, speed: 2.2, sharp: 0.60 },
    three:    { shape: 'torus', metal: 0.92, rough: 0.16, disp: 0.9, spin: 0.8 },
    fractal:  { seed: [-0.702, -0.384], zoom: 1.50, iter: 105, ship: false, trap: 0.80, spin: 0.025, cRad: 0.040 },
    // D major — cleanest of the set, almost no drive
    audio: { root: 38, drive: 0.45, kick: '1.......1.......', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0...a...5...0...', gtr: '0...a...5...0...' },
    hydra:    { kaleid: 6, oscFreq: 17, modAmt: 0.38, rotSpeed: 0.06, feedback: 0.84 },
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
    sdf:      { amp: 1.1, freq: 0.45, fog: 0.095, speed: 1.6, sharp: 0.20 },
    three:    { shape: 'ico',   metal: 0.88, rough: 0.22, disp: 1.5, spin: 0.6 },
    fractal:  { seed: [-0.80, 0.156], zoom: 1.30, iter: 110, ship: false, trap: 0.62, spin: 0.015, cRad: 0.028 },
    // F# — driving eighths on the root, no let-up
    audio: { root: 42, drive: 0.80, kick: '1...1...1...1...', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0.0.0.0.0.0.0.0.', gtr: '0.......5.......' },
    flow:     { count: 700, curl: 0.9, speed: 0.7, trail: 0.08, burst: 1.8 },
    hydra:    { kaleid: 3, oscFreq: 12, modAmt: 0.55, rotSpeed: 0.02, feedback: 0.89 },
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
    sdf:      { amp: 1.8, freq: 0.80, fog: 0.050, speed: 2.8, sharp: 0.80 },
    three:    { shape: 'knot',  metal: 1.00, rough: 0.08, disp: 0.5, spin: 1.1 },
    fractal:  { seed: [0.30, 0.50], zoom: 1.85, iter: 90, ship: false, trap: 1.05, spin: 0.055, cRad: 0.045 },
    // A — jangly and clean, the 80s outlier
    audio: { root: 45, drive: 0.25, kick: '1.......1.......', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0...0...7...5...', gtr: '0...0...7...5...' },
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
    sdf:      { amp: 2.6, freq: 0.55, fog: 0.065, speed: 3.4, sharp: 0.85 },
    three:    { shape: 'ico',   metal: 0.85, rough: 0.20, disp: 1.8, spin: 1.9 },
    fractal:  { seed: [-0.745, 0.113], zoom: 1.20, iter: 130, ship: true,  trap: 0.70, spin: 0.070, cRad: 0.050 },
    // F# — galloping kick under driving eighths
    audio: { root: 42, drive: 0.80, kick: '1..1..1...1..1..', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0.0.0.0.0.0.0.0.', gtr: '0.....0.0.....0.' },
    milkdrop: { zoom: 0.988, rot: 0.006, warp: 0.85, decay: 0.955, waveAmp: 0.42 },
    hydra:    { kaleid: 6, oscFreq: 13, modAmt: 0.55, rotSpeed: 0.22, feedback: 0.83 },
    flow:     { count: 1000, curl: 2.0, speed: 1.4, trail: 0.22, burst: 2.5 }
  }
];

GV.SET_NAME = 'Block Party';
GV.SET_TAGLINE = 'Live visuals, driven by the room';
GV.ART_VARIANTS = 3;

GV.ENGINES = {
  hydra:    { name: 'Hydra',    tag: 'Shader chain' },
  milkdrop: { name: 'MilkDrop', tag: 'Feedback warp' },
  flow:     { name: 'p5',       tag: 'Flow field' },
  fractal:  { name: 'Fractal',  tag: 'Julia orbit traps' },
  three:    { name: 'Three',    tag: 'PBR environment' },
  sdf:      { name: 'SDF',      tag: 'Raymarched terrain' }
};

GV.hexToRgb = function (hex) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
