/* Escape-time fractals: a Julia set (or Burning Ship variant) with orbit traps,
   coloured from the song's palette. The constant c orbits slowly so the shape
   is always morphing; bass widens that orbit, the beat punches the zoom, and
   the artwork is blended through the trap field so the picture and the fractal
   occupy the same image rather than sitting in layers. */
window.GV = window.GV || {};

GV.VizFractal = function (canvas) {
  const G = GV.gl;
  const gl = G.context(canvas);
  if (!gl) throw new Error('WebGL unavailable');

  const FS = G.LIB + `
uniform vec2  uRes;
uniform float uTime, uBass, uMid, uHigh, uPulse, uLevel;
uniform vec3  uC0, uC1, uC2;
uniform vec2  uSeed;
uniform float uZoom, uIter, uShip, uTrap, uSpin, uCRad;
uniform sampler2D uImg;
uniform float uImgAmt, uImgReveal;
uniform vec2  uImgScale;

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);

  float zoom = uZoom * (1.0 - uPulse * 0.14) * (1.0 + uBass * 0.10);
  vec2 z = rot(uv, uTime * uSpin) * zoom;

  // c drifts around a small circle; the drift is what keeps the shape alive
  float a = uTime * 0.19;
  vec2 c = uSeed + vec2(cos(a), sin(a * 1.37)) * (uCRad + uBass * 0.05);

  float trapRing = 1e9, trapCross = 1e9;
  float it = 0.0;
  for (int i = 0; i < 200; i++) {
    if (float(i) >= uIter) break;
    if (uShip > 0.5) z = vec2(abs(z.x), abs(z.y));       // Burning Ship
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    trapRing  = min(trapRing,  abs(length(z) - uTrap));
    trapCross = min(trapCross, min(abs(z.x), abs(z.y)));
    if (dot(z, z) > 256.0) break;
    it += 1.0;
  }

  float esc = it / uIter;
  // smooth shading on the escaped region, orbit traps on the interior
  float band = 0.5 + 0.5 * sin(esc * 24.0 - uTime * 1.2 + uHigh * 4.0);
  float gRing  = exp(-trapRing  * (5.0 - uMid * 2.0));
  float gCross = exp(-trapCross * 18.0);

  vec3 col = uC0 * (0.25 + 0.5 * esc);
  col += uC1 * gRing * (0.75 + uMid * 1.4);
  col += uC2 * gCross * (0.6 + uHigh * 1.8);
  col += uC1 * band * esc * 0.35;
  col += uC2 * uPulse * gRing * 0.9;
  col *= 0.45 + 1.05 * uLevel;

  // the artwork rides the same trap field, so it reads as part of the fractal
  if (uImgAmt > 0.0) {
    vec2 iuv = clamp((uv * 0.62) * uImgScale + 0.5, 0.0, 1.0);
    vec3 img = texture2D(uImg, iuv).rgb;
    float m = clamp(uImgAmt * (0.34 + uImgReveal * 0.5 + uPulse * 0.18), 0.0, 0.9);
    col = mix(col, img * (0.5 + gRing * 1.3 + esc * 0.6), m);
  }

  gl_FragColor = vec4(col, 1.0);
}`;

  const prog = G.program(gl, FS);
  const quad = G.quad(gl);
  let W = 0, H = 0;
  let imgTex = null, imgSrc = null, imgAmt = 0, imgAspect = 1, reveal = 0, lastT = 0;

  const U = {};
  for (const n of ['uRes', 'uTime', 'uBass', 'uMid', 'uHigh', 'uPulse', 'uLevel',
    'uC0', 'uC1', 'uC2', 'uSeed', 'uZoom', 'uIter', 'uShip', 'uTrap', 'uSpin', 'uCRad',
    'uImg', 'uImgAmt', 'uImgReveal', 'uImgScale']) U[n] = gl.getUniformLocation(prog, n);
  const blankTex = G.blankTexture(gl);

  function setImage(src) {
    if (!src) { imgAmt = 0; imgSrc = null; return; }
    if (!imgTex) imgTex = gl.createTexture();
    imgSrc = src;
    G.upload(gl, imgTex, src);
    const wh = G.srcSize(src);
    imgAspect = wh[0] / wh[1];
    imgAmt = 1; reveal = 1;
  }

  function resize(w, h) { W = w; H = h; canvas.width = w; canvas.height = h; }
  function reset() {}

  function draw(au, th, t) {
    const dt = lastT ? Math.min(0.1, t - lastT) : 0; lastT = t;
    reveal *= Math.exp(-dt / 1.10);
    if (reveal < 0.002) reveal = 0;
    if (G.videoReady(imgSrc)) G.upload(gl, imgTex, imgSrc);

    const p = Object.assign({}, GV.VizFractal.DEFAULTS, th.fractal);
    const c = th.palette.map(GV.hexToRgb);
    gl.viewport(0, 0, W, H);
    gl.useProgram(prog);
    G.bindQuad(gl, prog, quad);

    gl.uniform2f(U.uRes, W, H);
    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uBass, au.bass);
    gl.uniform1f(U.uMid, au.mid);
    gl.uniform1f(U.uHigh, au.high);
    gl.uniform1f(U.uPulse, au.pulse);
    gl.uniform1f(U.uLevel, au.level);
    gl.uniform3fv(U.uC0, c[0]);
    gl.uniform3fv(U.uC1, c[1]);
    gl.uniform3fv(U.uC2, c[2]);
    gl.uniform2f(U.uSeed, p.seed[0], p.seed[1]);
    gl.uniform1f(U.uZoom, p.zoom);
    gl.uniform1f(U.uIter, p.iter);
    gl.uniform1f(U.uShip, p.ship ? 1 : 0);
    gl.uniform1f(U.uTrap, p.trap);
    gl.uniform1f(U.uSpin, p.spin);
    gl.uniform1f(U.uCRad, p.cRad);

    const ca = W / H;
    gl.uniform2f(U.uImgScale, ca > imgAspect ? 1 : ca / imgAspect, ca > imgAspect ? imgAspect / ca : 1);
    gl.uniform1f(U.uImgAmt, imgAmt);
    gl.uniform1f(U.uImgReveal, reveal);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imgTex || blankTex);
    gl.uniform1i(U.uImg, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  return { canvas, resize, draw, reset, setImage, label: 'Fractal — Julia orbit traps' };
};

GV.VizFractal.DEFAULTS = { seed: [-0.79, 0.15], zoom: 1.4, iter: 90, ship: false, trap: 0.7, spin: 0.03, cRad: 0.04 };
