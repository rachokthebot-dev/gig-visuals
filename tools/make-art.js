/* Generates one original abstract image per song from that song's palette.
   Nothing is traced, sampled or referenced — each composition is procedural,
   seeded from the song id so re-running is stable. These are what ship
   publicly; anything of yours stays in the gitignored art/ folder. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const W = 896, H = 896;

const sandbox = {}; sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/themes.js'), 'utf8'), sandbox);
const THEMES = sandbox.GV.THEMES;

/* ---- deterministic noise ---------------------------------------------- */

function seedFrom(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function prng(seed) { let s = seed || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

function noiseField(seed) {
  const G = 256, g = new Float64Array(G * G), r = prng(seed);
  for (let i = 0; i < g.length; i++) g[i] = r();
  const at = (x, y) => g[((y & (G - 1)) * G + (x & (G - 1)))];
  const sm = t => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    return (at(xi, yi) * (1 - xf) + at(xi + 1, yi) * xf) * (1 - yf)
         + (at(xi, yi + 1) * (1 - xf) + at(xi + 1, yi + 1) * xf) * yf;
  };
}

function fbmFrom(n) {
  return (x, y, oct = 5) => {
    let a = 0.5, s = 0, norm = 0;
    for (let i = 0; i < oct; i++) { s += a * n(x, y); norm += a; x *= 2.03; y *= 2.03; a *= 0.5; }
    return s / norm;
  };
}

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = v => v < 0 ? 0 : v > 255 ? 255 : v;
const sstep = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

/* ---- four compositions, rotated through the set so neighbours differ --- */

const ARCHETYPES = [
  // strata: layered diagonal bands pushed around by noise
  (nx, ny, fbm, r) => {
    const a = nx * 0.62 + ny * 0.78 + (fbm(nx * 1.8 + 11, ny * 1.8 + 7) - 0.5) * 1.1;
    const band = (a * 3.2) - Math.floor(a * 3.2);
    const t = sstep(0.0, 0.55, band) * (1 - sstep(0.75, 1.0, band));
    const edge = 1 - sstep(0.0, 0.07, Math.abs(band - 0.55));
    return { t, edge, grain: fbm(nx * 9 + 3, ny * 9, 3) };
  },
  // radial: concentric rings from an off-centre origin
  (nx, ny, fbm, r) => {
    const cx = r.cx, cy = r.cy;
    const dx = nx - cx, dy = ny - cy;
    const rr = Math.sqrt(dx * dx + dy * dy);
    const warp = (fbm(nx * 1.5 + 21, ny * 1.5 + 5) - 0.5) * 0.85;
    const rings = 0.5 + 0.5 * Math.sin((rr + warp) * 13.5);
    const t = Math.pow(rings, 1.6) * (1 - sstep(0.15, 1.5, rr));
    const edge = Math.pow(rings, 9) * (1 - sstep(0.1, 1.2, rr));
    return { t, edge, grain: fbm(nx * 8 + 2, ny * 8 + 6, 3) };
  },
  // clouds: turbulent fbm masses
  (nx, ny, fbm, r) => {
    const f = fbm(nx * 2.1 + 31, ny * 2.1 + 17, 6);
    const g = fbm(nx * 4.3 - 9, ny * 4.3 + 2, 4);
    const t = sstep(0.34, 0.78, f * 0.75 + g * 0.25);
    const edge = sstep(0.62, 0.70, f) * (1 - sstep(0.70, 0.80, f));
    return { t, edge, grain: g };
  },
  // shards: angular fragments radiating out
  (nx, ny, fbm, r) => {
    const ang = Math.atan2(ny, nx) + (fbm(nx * 1.2 + 4, ny * 1.2 + 19) - 0.5) * 0.9;
    const seg = 7;
    const s = (ang / (Math.PI * 2) * seg) % 1;
    const sh = s < 0 ? s + 1 : s;
    const rr = Math.sqrt(nx * nx + ny * ny);
    const t = sstep(0.1, 0.6, sh) * (1 - sstep(0.4, 1.35, rr));
    const edge = (1 - sstep(0.0, 0.05, Math.abs(sh - 0.1))) * (1 - sstep(0.3, 1.2, rr));
    return { t, edge, grain: fbm(nx * 10, ny * 10 + 8, 3) };
  }
];

function render(theme, idx) {
  const seed = seedFrom(theme.id);
  const rnd = prng(seed);
  const fbm = fbmFrom(noiseField(seed));
  const arch = ARCHETYPES[idx % ARCHETYPES.length];
  const params = { cx: (rnd() - 0.5) * 0.7, cy: (rnd() - 0.5) * 0.7 };
  const bg = hex(theme.bg);
  const c0 = hex(theme.palette[0]), c1 = hex(theme.palette[1]), c2 = hex(theme.palette[2]);
  const rot = rnd() * Math.PI;
  const cs = Math.cos(rot), sn = Math.sin(rot);

  const buf = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let nx = (x / W) * 2 - 1, ny = (y / H) * 2 - 1;
      const rx = nx * cs - ny * sn, ry = nx * sn + ny * cs;
      const { t, edge, grain } = arch(rx, ry, fbm, params);

      let col = mix(bg, c0, 0.55 + 0.45 * t);
      col = mix(col, c1, t * 0.72);
      col = mix(col, c2, Math.min(1, edge * 0.95));

      const rr = Math.sqrt(nx * nx + ny * ny);
      const vig = 1 - 0.55 * sstep(0.55, 1.5, rr);          // keep the corners dark
      const gn = (grain - 0.5) * 16;
      const i = (y * W + x) * 3;
      buf[i]     = clamp(col[0] * vig + gn);
      buf[i + 1] = clamp(col[1] * vig + gn);
      buf[i + 2] = clamp(col[2] * vig + gn);
    }
  }
  return buf;
}

/* ---- minimal PNG writer ------------------------------------------------ */

const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return b => { let c = -1; for (let i = 0; i < b.length; i++) c = t[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
})();

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(CRC(td));
  return Buffer.concat([len, td, crc]);
}

function png(w, h, rgb) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;                                // filter: none
    rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const dir = path.join(ROOT, 'art');
fs.mkdirSync(dir, { recursive: true });
THEMES.forEach((th, i) => {
  const buf = render(th, i);
  const out = path.join(dir, th.id + '.png');
  fs.writeFileSync(out, png(W, H, buf));
  console.log(th.id.padEnd(20), ['strata', 'radial', 'clouds', 'shards'][i % 4].padEnd(8),
    (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
});
console.log('wrote ' + THEMES.length + ' images to art/');
