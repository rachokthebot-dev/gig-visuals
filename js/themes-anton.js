/* Themes for the "Anton 10.2026" set — Russian rock, deliberately bright.
   Where the Block Party set runs dark (sludge green, black water, scorched
   orange), this one is built on warm light: open sky, spring, gold, brass.

   bpm and key are measured values out of Shreddy, not estimates, so the demo
   beds sit in each song's real tempo and key and the tempo prior is exact.
   Scenes are drawn from what each song is about — its subject and mood. */
window.GV = window.GV || {};

GV.SET_NAME = 'Anton 10.2026';
GV.SET_TAGLINE = 'Russian rock · 14 songs';
GV.ART_VARIANTS = 2;   // bumped to 3 once the third variant is generated

GV.THEMES = [
  {
    id: 'anton-svoboda', title: 'Песня о свободе', artist: 'DDT',
    gloss: 'Song of Freedom', bpm: 136, key: 'G Major', viz: 'three',
    note: 'Open sky and wind — the widest, brightest look in the set',
    bg: '#071726', palette: ['#1d5c8f', '#6fc5f5', '#ffd98a'],
    audio:    { root: 43, drive: 0.55, kick: '1...1...1...1...', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0...0...7...5...', gtr: '0...0...7...5...' },
    three:    { shape: 'ico',   metal: 0.82, rough: 0.22, disp: 1.2, spin: 1.0 },
    milkdrop: { zoom: 0.990, rot: 0.004, warp: 0.55, decay: 0.966, waveAmp: 0.34 },
    hydra:    { kaleid: 6, oscFreq: 13, modAmt: 0.45, rotSpeed: 0.09, feedback: 0.86 },
    flow:     { count: 950, curl: 1.3, speed: 1.1, trail: 0.14, burst: 1.4 },
    fractal:  { seed: [-0.70, 0.27], zoom: 1.5, iter: 95, ship: false, trap: 0.85, spin: 0.03, cRad: 0.04 }
  },
  {
    id: 'anton-vesna', title: 'Снова Весна', artist: 'Машина Времени',
    gloss: 'Spring Again', bpm: 103, key: 'G Major', viz: 'flow',
    note: 'Blossom and new green — particles as petals in low sun',
    bg: '#0b1709', palette: ['#4f9d3a', '#b7e86a', '#ffc2d9'],
    audio:    { root: 43, drive: 0.40, kick: '1.......1.......', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0...4...7...4...', gtr: '0.......7...4...' },
    flow:     { count: 1100, curl: 1.1, speed: 0.85, trail: 0.13, burst: 1.2 },
    three:    { shape: 'ico',   metal: 0.60, rough: 0.38, disp: 1.3, spin: 0.7 },
    milkdrop: { zoom: 0.993, rot: 0.003, warp: 0.50, decay: 0.968, waveAmp: 0.30 },
    hydra:    { kaleid: 5, oscFreq: 12, modAmt: 0.50, rotSpeed: 0.06, feedback: 0.87 },
    fractal:  { seed: [0.30, 0.52], zoom: 1.6, iter: 100, ship: false, trap: 0.95, spin: 0.02, cRad: 0.035 }
  },
  {
    id: 'anton-zveryok', title: 'Зверёк', artist: 'Чиж & Co',
    gloss: 'Little Creature', bpm: 136, key: 'A Minor', viz: 'hydra',
    note: 'Dappled woodland light — warm amber through moss green',
    bg: '#0d1206', palette: ['#3f5a1c', '#9fc93a', '#ffd982'],
    audio:    { root: 45, drive: 0.62, kick: '1...1...1...1...', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0.0.0.0.5.5.7.7.', gtr: '0.......5...7...' },
    hydra:    { kaleid: 7, oscFreq: 15, modAmt: 0.40, rotSpeed: 0.12, feedback: 0.85 },
    milkdrop: { zoom: 0.991, rot: 0.005, warp: 0.45, decay: 0.962, waveAmp: 0.33 },
    flow:     { count: 900, curl: 1.7, speed: 1.2, trail: 0.17, burst: 1.5 },
    three:    { shape: 'knot',  metal: 0.70, rough: 0.30, disp: 0.9, spin: 1.4 },
    fractal:  { seed: [-0.52, 0.57], zoom: 1.4, iter: 90, ship: false, trap: 0.70, spin: 0.04, cRad: 0.04 }
  },
  {
    id: 'anton-rastamany', title: 'Растаманы Из Глубинки', artist: 'Аквариум',
    gloss: 'Rastamen from the Backwoods', bpm: 144, key: 'A Major', viz: 'milkdrop',
    note: 'Sunlit meadow haze — green, gold and a warm red thread',
    bg: '#0e1405', palette: ['#2f6b1e', '#e8c54a', '#e4612f'],
    audio:    { root: 45, drive: 0.50, kick: '1.......1.......', snare: '....1.......1...', hat: '..1...1...1...1.', bass: '0..0..0...5..5..', gtr: '....0.......5...' },
    milkdrop: { zoom: 0.992, rot: 0.0035, warp: 0.60, decay: 0.964, waveAmp: 0.30 },
    hydra:    { kaleid: 6, oscFreq: 14, modAmt: 0.48, rotSpeed: 0.10, feedback: 0.86 },
    flow:     { count: 1000, curl: 1.4, speed: 1.3, trail: 0.19, burst: 1.6 },
    three:    { shape: 'torus', metal: 0.75, rough: 0.28, disp: 1.1, spin: 1.2 },
    fractal:  { seed: [-0.16, 0.65], zoom: 1.45, iter: 95, ship: false, trap: 0.80, spin: 0.05, cRad: 0.045 }
  },
  {
    id: 'anton-pyatiy-etazh', title: 'Моя любовь на пятом этаже', artist: 'Секрет',
    gloss: 'My Love on the Fifth Floor', bpm: 89, key: 'C Major', viz: 'flow',
    note: '60s pop warmth — coral and sky over a sunlit courtyard',
    bg: '#120a10', palette: ['#c4506b', '#ff9aa8', '#8ad4ff'],
    audio:    { root: 36, drive: 0.30, kick: '1.......1.......', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0...5...7...5...', gtr: '0...5...7...5...' },
    flow:     { count: 850, curl: 0.9, speed: 0.75, trail: 0.11, burst: 1.1 },
    milkdrop: { zoom: 0.995, rot: 0.002, warp: 0.40, decay: 0.971, waveAmp: 0.26 },
    hydra:    { kaleid: 5, oscFreq: 11, modAmt: 0.42, rotSpeed: 0.05, feedback: 0.88 },
    three:    { shape: 'torus', metal: 0.65, rough: 0.34, disp: 0.8, spin: 0.6 },
    fractal:  { seed: [0.37, 0.34], zoom: 1.7, iter: 110, ship: false, trap: 0.95, spin: 0.02, cRad: 0.03 }
  },
  {
    id: 'anton-tutankhamon', title: 'Тутанхамон', artist: 'Наутилус Помпилиус',
    gloss: 'Tutankhamun', bpm: 118, key: 'D Major', viz: 'fractal',
    note: 'Desert gold and turquoise — hot stone under a high sun',
    bg: '#120c03', palette: ['#8a5a14', '#f0c04a', '#39c9c0'],
    audio:    { root: 38, drive: 0.65, kick: '1...1...1...1...', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0...0...a...7...', gtr: '0.......a...7...' },
    fractal:  { seed: [-0.66, 0.36], zoom: 1.35, iter: 115, ship: false, trap: 0.72, spin: 0.035, cRad: 0.038 },
    milkdrop: { zoom: 0.990, rot: 0.005, warp: 0.52, decay: 0.963, waveAmp: 0.32 },
    hydra:    { kaleid: 8, oscFreq: 16, modAmt: 0.35, rotSpeed: 0.08, feedback: 0.86 },
    flow:     { count: 900, curl: 1.5, speed: 1.0, trail: 0.15, burst: 1.3 },
    three:    { shape: 'ico',   metal: 0.95, rough: 0.14, disp: 0.7, spin: 0.9 }
  },
  {
    id: 'anton-moy-drug', title: 'Мой друг (Лучше всех играет блюз)', artist: 'Машина Времени',
    gloss: 'My Friend (Plays the Blues Best)', bpm: 99, key: 'C# Minor', viz: 'milkdrop',
    note: 'Warm club light — brass and amber against deep blue',
    bg: '#060a14', palette: ['#1b3358', '#e0a444', '#ffe6b0'],
    audio:    { root: 37, drive: 0.55, kick: '1.....1.1.......', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0...0...5...7...', gtr: '0.......5...7...' },
    milkdrop: { zoom: 0.994, rot: 0.0025, warp: 0.46, decay: 0.969, waveAmp: 0.29 },
    hydra:    { kaleid: 5, oscFreq: 12, modAmt: 0.46, rotSpeed: 0.06, feedback: 0.88 },
    flow:     { count: 800, curl: 1.0, speed: 0.8, trail: 0.12, burst: 1.2 },
    three:    { shape: 'torus', metal: 0.90, rough: 0.18, disp: 0.8, spin: 0.7 },
    fractal:  { seed: [-0.74, 0.18], zoom: 1.5, iter: 105, ship: false, trap: 0.78, spin: 0.025, cRad: 0.035 }
  },
  {
    id: 'anton-slovar', title: 'Англо-русский словарь', artist: 'Сплин',
    gloss: 'English-Russian Dictionary', bpm: 99, key: 'C Major', viz: 'hydra',
    note: 'Paper and ink in afternoon light — cream, warm gold, deep blue',
    bg: '#100c06', palette: ['#5a4526', '#e8d2a0', '#3f74c0'],
    audio:    { root: 36, drive: 0.48, kick: '1.......1.......', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0...0...5...3...', gtr: '0...0...5...3...' },
    hydra:    { kaleid: 6, oscFreq: 18, modAmt: 0.30, rotSpeed: 0.07, feedback: 0.87 },
    milkdrop: { zoom: 0.993, rot: 0.003, warp: 0.42, decay: 0.967, waveAmp: 0.28 },
    flow:     { count: 880, curl: 1.2, speed: 0.9, trail: 0.13, burst: 1.2 },
    three:    { shape: 'ico',   metal: 0.70, rough: 0.30, disp: 0.9, spin: 0.8 },
    fractal:  { seed: [0.28, 0.01], zoom: 1.65, iter: 120, ship: false, trap: 0.90, spin: 0.03, cRad: 0.03 }
  },
  {
    id: 'anton-videli-noch', title: 'Видели ночь', artist: 'Виктор Цой',
    gloss: 'We Saw the Night', bpm: 162, key: 'A Minor', viz: 'three',
    note: 'City lights at speed — warm lamplight over electric blue',
    bg: '#05070f', palette: ['#13224a', '#4f9bff', '#ffc46b'],
    audio:    { root: 45, drive: 0.70, kick: '1...1...1...1...', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0.0.0.0.0.0.0.0.', gtr: '0.......5.......' },
    three:    { shape: 'knot',  metal: 0.95, rough: 0.12, disp: 0.8, spin: 1.8 },
    milkdrop: { zoom: 0.988, rot: 0.006, warp: 0.58, decay: 0.958, waveAmp: 0.38 },
    hydra:    { kaleid: 4, oscFreq: 14, modAmt: 0.42, rotSpeed: 0.16, feedback: 0.84 },
    flow:     { count: 1200, curl: 2.0, speed: 1.5, trail: 0.22, burst: 2.0 },
    fractal:  { seed: [-0.78, 0.12], zoom: 1.25, iter: 95, ship: true, trap: 0.65, spin: 0.06, cRad: 0.05 }
  },
  {
    id: 'anton-38y', title: 'Дополнительный 38й', artist: 'Чиж & Co',
    gloss: 'The Extra 38th', bpm: 108, key: 'E Minor', viz: 'milkdrop',
    note: 'Rails at golden hour — warm orange along cold steel',
    bg: '#0d0a06', palette: ['#4a3a22', '#f09a3c', '#8fc4e8'],
    audio:    { root: 40, drive: 0.52, kick: '1.......1.1.....', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0...0...3...5...', gtr: '0.......3...5...' },
    milkdrop: { zoom: 0.991, rot: 0.0045, warp: 0.56, decay: 0.965, waveAmp: 0.31 },
    hydra:    { kaleid: 6, oscFreq: 13, modAmt: 0.44, rotSpeed: 0.09, feedback: 0.86 },
    flow:     { count: 900, curl: 1.3, speed: 1.0, trail: 0.15, burst: 1.3 },
    three:    { shape: 'torus', metal: 0.85, rough: 0.20, disp: 1.0, spin: 1.0 },
    fractal:  { seed: [-0.59, 0.43], zoom: 1.4, iter: 100, ship: false, trap: 0.75, spin: 0.03, cRad: 0.04 }
  },
  {
    id: 'anton-lyubite', title: 'Любите девушки', artist: 'Валерий Сюткин',
    gloss: 'Love, Girls', bpm: 103, key: 'A# Major', viz: 'flow',
    note: 'Retro summer cheer — candy coral, turquoise and cream',
    bg: '#120c12', palette: ['#e2577a', '#ffd166', '#53d2c8'],
    audio:    { root: 46, drive: 0.28, kick: '1.......1.......', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0...4...7...4...', gtr: '0...4...7...4...' },
    flow:     { count: 1050, curl: 1.2, speed: 1.0, trail: 0.14, burst: 1.4 },
    milkdrop: { zoom: 0.994, rot: 0.0035, warp: 0.44, decay: 0.969, waveAmp: 0.28 },
    hydra:    { kaleid: 7, oscFreq: 15, modAmt: 0.40, rotSpeed: 0.09, feedback: 0.86 },
    three:    { shape: 'torus', metal: 0.72, rough: 0.30, disp: 0.9, spin: 1.1 },
    fractal:  { seed: [0.40, 0.28], zoom: 1.6, iter: 105, ship: false, trap: 0.92, spin: 0.04, cRad: 0.035 }
  },
  {
    id: 'anton-stakany', title: 'Стаканы', artist: 'Аквариум',
    gloss: 'Glasses', bpm: 144, key: 'B Major', viz: 'fractal',
    note: 'Light refracting through glass — amber, rose and gold',
    bg: '#120b06', palette: ['#6b3f18', '#ffb04a', '#ff7a9c'],
    audio:    { root: 47, drive: 0.45, kick: '1...1...1...1...', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0...0...5...7...', gtr: '0...0...5...7...' },
    fractal:  { seed: [0.34, 0.44], zoom: 1.75, iter: 120, ship: false, trap: 1.00, spin: 0.05, cRad: 0.042 },
    milkdrop: { zoom: 0.990, rot: 0.005, warp: 0.54, decay: 0.962, waveAmp: 0.32 },
    hydra:    { kaleid: 8, oscFreq: 17, modAmt: 0.36, rotSpeed: 0.11, feedback: 0.85 },
    flow:     { count: 980, curl: 1.6, speed: 1.3, trail: 0.18, burst: 1.5 },
    three:    { shape: 'ico',   metal: 0.93, rough: 0.10, disp: 0.9, spin: 1.3 }
  },
  {
    id: 'anton-rocknroll', title: 'Мама, это рок-н-ролл', artist: 'DDT',
    gloss: 'Mama, This Is Rock and Roll', bpm: 96, key: 'E Minor', viz: 'hydra',
    note: 'Stage light and confetti — hot red through gold and white',
    bg: '#120503', palette: ['#8c1d1d', '#ff6a3c', '#ffd98a'],
    audio:    { root: 40, drive: 0.78, kick: '1.......1.1.....', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0...0...3...5...', gtr: '0...0...3...5...' },
    hydra:    { kaleid: 5, oscFreq: 14, modAmt: 0.44, rotSpeed: 0.10, feedback: 0.85 },
    milkdrop: { zoom: 0.989, rot: 0.005, warp: 0.58, decay: 0.961, waveAmp: 0.36 },
    flow:     { count: 1000, curl: 1.7, speed: 1.2, trail: 0.20, burst: 1.8 },
    three:    { shape: 'knot',  metal: 0.88, rough: 0.18, disp: 1.1, spin: 1.3 },
    fractal:  { seed: [-0.45, 0.58], zoom: 1.3, iter: 95, ship: false, trap: 0.68, spin: 0.045, cRad: 0.045 }
  },
  {
    id: 'anton-trava', title: 'Трава у дома', artist: 'Земляне',
    gloss: 'Grass by the Home', bpm: 129, key: 'A Minor', viz: 'three',
    note: 'Earth from orbit — the blue limb catching sunrise',
    bg: '#030810', palette: ['#0f3a63', '#4fb8e8', '#ffd98a'],
    audio:    { root: 45, drive: 0.58, kick: '1...1...1...1...', snare: '....1.......1...', hat: '1.1.1.1.1.1.1.1.', bass: '0...0...5...3...', gtr: '0.......5...3...' },
    three:    { shape: 'ico',   metal: 0.80, rough: 0.24, disp: 1.0, spin: 0.5 },
    milkdrop: { zoom: 0.992, rot: 0.0030, warp: 0.50, decay: 0.966, waveAmp: 0.33 },
    hydra:    { kaleid: 6, oscFreq: 13, modAmt: 0.42, rotSpeed: 0.07, feedback: 0.87 },
    flow:     { count: 1000, curl: 1.2, speed: 1.0, trail: 0.14, burst: 1.4 },
    fractal:  { seed: [-0.73, 0.21], zoom: 1.45, iter: 105, ship: false, trap: 0.82, spin: 0.028, cRad: 0.038 }
  }
];

GV.ENGINES = {
  hydra:    { name: 'Hydra',    tag: 'Shader chain' },
  milkdrop: { name: 'MilkDrop', tag: 'Feedback warp' },
  flow:     { name: 'p5',       tag: 'Flow field' },
  fractal:  { name: 'Fractal',  tag: 'Julia orbit traps' },
  three:    { name: 'Three',    tag: 'PBR environment' }
};

GV.hexToRgb = function (hex) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
