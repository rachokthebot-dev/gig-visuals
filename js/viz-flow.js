/* p5.js-style generative sketch on canvas 2D: a curl-ish flow field of
   particles, kicked on every detected beat, over a radial spectrum ring. */
window.GV = window.GV || {};

GV.VizFlow = function (canvas) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, parts = [], lastPhase = 0;
  let image = null, reveal = 0, lastT = 0;

  function noise(x, y, t) {
    // cheap smooth field: sum of a few sines, good enough and fast
    return Math.sin(x * 1.7 + t * 0.6) * Math.cos(y * 1.3 - t * 0.45)
      + 0.5 * Math.sin((x + y) * 2.6 + t * 0.9);
  }

  function seed(n) {
    parts = new Array(n);
    for (let i = 0; i < n; i++) {
      parts[i] = {
        x: Math.random() * W, y: Math.random() * H,
        vx: 0, vy: 0,
        life: Math.random(),
        c: (Math.random() * 3) | 0
      };
    }
  }

  function resize(w, h) {
    W = w; H = h;
    canvas.width = w; canvas.height = h;
    if (parts.length) seed(parts.length);
  }

  function setImage(img) { image = img; if (img) reveal = 1; }

  // cover-fit so the picture fills the frame without distorting
  function drawCover(img, alpha) {
    const wh = GV.gl.srcSize(img);
    const ia = wh[0] / wh[1], ca = W / H;
    let w, h;
    if (ca > ia) { w = W; h = W / ia; } else { h = H; w = H * ia; }
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    ctx.globalAlpha = 1;
  }

  function draw(au, th, t) {
    const dt = lastT ? Math.min(0.1, t - lastT) : 0; lastT = t;
    reveal *= Math.exp(-dt / 1.10);
    if (reveal < 0.002) reveal = 0;
    const p = Object.assign({}, GV.VizFlow.DEFAULTS, th.flow);
    if (parts.length !== p.count) seed(p.count);

    // trail: paint the background over the last frame instead of clearing
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = th.bg;
    ctx.globalAlpha = p.trail * (1.1 - au.level * 0.4);
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    // after the trail wash, before the particles, so they ride over it
    if (image) drawCover(image, Math.min(0.90, 0.18 + reveal * 0.6 + au.pulse * 0.12));

    const cx = W / 2, cy = H / 2;
    const beat = au.beatPhase < lastPhase;
    lastPhase = au.beatPhase;
    const scale = 1 / Math.min(W, H);

    // radial spectrum ring
    ctx.globalCompositeOperation = 'lighter';
    const base = Math.min(W, H) * 0.17;
    const n = au.spectrum.length;
    ctx.lineWidth = Math.max(1.5, Math.min(W, H) / 320);
    ctx.strokeStyle = th.palette[1];
    ctx.globalAlpha = 0.35 + au.level * 0.5;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const s = au.spectrum[i % n];
      const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
      const r = base * (1 + s * 1.5 + au.pulse * 0.25);
      const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // beat flash
    if (au.pulse > 0.05) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * (2 + au.pulse * 3));
      g.addColorStop(0, th.palette[2]);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = au.pulse * 0.35;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // particles
    const spd = p.speed * (0.4 + au.mid * 2.0 + au.level * 1.2) * Math.min(W, H) * 0.004;
    const curl = p.curl * (1 + au.high * 2.5);
    ctx.lineWidth = Math.max(1, Math.min(W, H) / 700);
    for (let i = 0; i < parts.length; i++) {
      const q = parts[i];
      const a = noise(q.x * scale * curl, q.y * scale * curl, t) * Math.PI;
      let ax = Math.cos(a), ay = Math.sin(a);
      if (beat) {
        const dx = q.x - cx, dy = q.y - cy, d = Math.hypot(dx, dy) || 1;
        ax += (dx / d) * p.burst * 2.2;
        ay += (dy / d) * p.burst * 2.2;
      }
      q.vx = q.vx * 0.90 + ax * spd * 0.35;
      q.vy = q.vy * 0.90 + ay * spd * 0.35;
      const px = q.x, py = q.y;
      q.x += q.vx; q.y += q.vy;
      q.life -= 0.0025 + au.level * 0.004;

      if (q.life <= 0 || q.x < -20 || q.x > W + 20 || q.y < -20 || q.y > H + 20) {
        const ang = Math.random() * Math.PI * 2;
        const rr = base * (0.3 + Math.random() * 0.7);
        q.x = cx + Math.cos(ang) * rr; q.y = cy + Math.sin(ang) * rr;
        q.vx = q.vy = 0; q.life = 0.6 + Math.random() * 0.4;
        continue;
      }
      ctx.globalAlpha = Math.min(1, q.life) * (0.25 + au.level * 0.6);
      ctx.strokeStyle = th.palette[q.c];
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // Trails are persistent by design, so a song change has to wipe them or the
  // previous song's picture bleeds into the next one.
  function reset(th) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = th.bg;
    ctx.fillRect(0, 0, W, H);
    if (parts.length) seed(parts.length);
  }

  return { canvas, resize, draw, reset, setImage, label: 'p5 — flow field' };
};

/* Any engine can be forced onto any theme, so each carries defaults for the
   params that theme may not define. */
GV.VizFlow.DEFAULTS = { count: 800, curl: 1.2, speed: 0.9, trail: 0.12, burst: 1.4 };
