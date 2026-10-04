/* Hydra-style: an osc -> kaleid -> modulate -> rotate -> feedback chain,
   written straight as a fragment shader with o0 feedback via ping-pong. */
window.GV = window.GV || {};

GV.VizHydra = function (canvas) {
  const G = GV.gl;
  const gl = G.context(canvas);
  if (!gl) throw new Error('WebGL unavailable');

  const FS = G.LIB + `
uniform vec2  uRes;
uniform float uTime, uBass, uMid, uHigh, uPulse, uBeat, uLevel;
uniform vec3  uC0, uC1, uC2;
uniform float uKaleid, uOscFreq, uModAmt, uRotSpeed, uFeedback;
uniform sampler2D uPrev;
uniform sampler2D uImg;
uniform float uImgAmt, uImgReveal;

void main(){
  vec2 fuv = gl_FragCoord.xy / uRes;
  vec2 uv  = (gl_FragCoord.xy - 0.5*uRes) / min(uRes.x, uRes.y);

  // --- kaleid(n) -------------------------------------------------------
  float r = length(uv);
  float a = atan(uv.y, uv.x) + uTime * uRotSpeed + uBeat * 0.5;
  float seg = 6.2831853 / uKaleid;
  a = abs(mod(a, seg) - seg * 0.5);
  vec2 k = vec2(cos(a), sin(a)) * r;

  // --- modulate(noise, amt) -------------------------------------------
  float n = fbm(k * 2.6 + uTime * 0.17);
  k += (n - 0.5) * uModAmt * (0.25 + uBass * 0.9);

  // --- osc(freq, sync, offset), thresholded into ridges ----------------
  // Keeping most of the frame at zero is what gives the feedback trails
  // something to be read against; a smooth sine fills the screen and reads
  // as soup on a projector.
  float f = uOscFreq * (1.0 + uMid * 1.1);
  float o1 = sin(k.x * f + uTime * 2.1 + uHigh * 6.0);
  float o2 = sin(k.y * f * 0.66 - uTime * 1.4 + n * 3.0);
  // k.x and k.y both collapse to zero at the centre, so a purely cartesian
  // oscillator leaves a hole there for the feedback to smear into. A radial
  // ring term keeps the middle of the frame as detailed as the edges.
  float o3 = sin(r * f * 1.35 - uTime * 1.9 + uBass * 5.0);
  float sharp = 7.0 - uLevel * 3.5 - uPulse * 1.5;
  float e1 = pow(max(0.0, o1), sharp);
  float e2 = pow(max(0.0, o2), sharp);
  float e3 = pow(max(0.0, o3), sharp);

  vec3 col = uC0 * 0.22
           + uC1 * e1
           + uC2 * e1 * e2 * 1.7
           + uC1 * e2 * 0.35
           + uC2 * e3 * 0.55;

  // src(image) through the same kaleid coordinates: the symmetry is built out
  // of the picture rather than out of the oscillator.
  if (uImgAmt > 0.0) {
    vec3 img = texture2D(uImg, clamp(k * 0.55 + 0.5, 0.0, 1.0)).rgb;
    float m = clamp(uImgAmt * (0.32 + uImgReveal * 0.55 + uPulse * 0.22), 0.0, 0.92);
    col = mix(col, img * (0.55 + e1 * 1.2 + uPulse * 0.5), m);
  }

  col *= smoothstep(1.25, 0.04, r);          // hard falloff to true black
  col *= 0.30 + 1.25 * uLevel;
  col += uC2 * uPulse * exp(-r * 3.0) * 1.2;

  // --- src(o0).rotate().scale() : feedback -----------------------------
  vec2 c = fuv - 0.5;
  c = rot(c, 0.004 + uBass * 0.02);
  c *= 0.985 - uBass * 0.018;
  vec3 prev = texture2D(uPrev, c + 0.5).rgb * (uFeedback + uPulse * 0.06);
  prev -= 0.004;                             // floor the trails so they reach black

  gl_FragColor = vec4(max(col, max(prev, vec3(0.0))), 1.0);
}`;

  const COPY = `precision highp float; uniform sampler2D uTex; uniform vec2 uRes;
void main(){ gl_FragColor = texture2D(uTex, gl_FragCoord.xy/uRes); }`;

  const prog = G.program(gl, FS);
  const copy = G.program(gl, COPY);
  const quad = G.quad(gl);
  let a = null, b = null, W = 0, H = 0;
  let imgTex = null, imgAmt = 0, reveal = 0, lastT = 0;

  const blankTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, blankTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  function setImage(img) {
    if (!img) { imgAmt = 0; return; }
    if (!imgTex) imgTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, imgTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    imgAmt = 1; reveal = 1;
  }
  const U = {};
  for (const n of ['uRes', 'uTime', 'uBass', 'uMid', 'uHigh', 'uPulse', 'uBeat', 'uLevel',
    'uC0', 'uC1', 'uC2', 'uKaleid', 'uOscFreq', 'uModAmt', 'uRotSpeed', 'uFeedback', 'uPrev',
    'uImg', 'uImgAmt', 'uImgReveal']) {
    U[n] = gl.getUniformLocation(prog, n);
  }
  const Uc = { uTex: gl.getUniformLocation(copy, 'uTex'), uRes: gl.getUniformLocation(copy, 'uRes') };

  function resize(w, h) {
    W = w; H = h;
    canvas.width = w; canvas.height = h;
    a = G.target(gl, w, h);
    b = G.target(gl, w, h);
  }

  function draw(au, th, t) {
    const dt = lastT ? Math.min(0.1, t - lastT) : 0; lastT = t;
    reveal *= Math.exp(-dt / 0.55);
    if (reveal < 0.002) reveal = 0;
    const p = Object.assign({}, GV.VizHydra.DEFAULTS, th.hydra);
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
    gl.uniform1f(U.uBeat, au.beatPhase);
    gl.uniform1f(U.uLevel, au.level);
    gl.uniform3fv(U.uC0, c[0]);
    gl.uniform3fv(U.uC1, c[1]);
    gl.uniform3fv(U.uC2, c[2]);
    gl.uniform1f(U.uKaleid, p.kaleid);
    gl.uniform1f(U.uOscFreq, p.oscFreq);
    gl.uniform1f(U.uModAmt, p.modAmt);
    gl.uniform1f(U.uRotSpeed, p.rotSpeed);
    gl.uniform1f(U.uFeedback, p.feedback);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, b.tex);
    gl.uniform1i(U.uPrev, 0);

    gl.uniform1f(U.uImgAmt, imgAmt);
    gl.uniform1f(U.uImgReveal, reveal);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, imgTex || blankTex);
    gl.uniform1i(U.uImg, 1);
    gl.activeTexture(gl.TEXTURE0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, a.fbo);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.useProgram(copy);
    G.bindQuad(gl, copy, quad);
    gl.uniform2f(Uc.uRes, W, H);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, a.tex);
    gl.uniform1i(Uc.uTex, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const t2 = a; a = b; b = t2;
  }

  function reset() {
    gl.clearColor(0, 0, 0, 1);
    for (const tgt of [a, b]) {
      if (!tgt) continue;
      gl.bindFramebuffer(gl.FRAMEBUFFER, tgt.fbo);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  return { canvas, resize, draw, reset, setImage, label: 'Hydra — shader chain' };
};

GV.VizHydra.DEFAULTS = { kaleid: 5, oscFreq: 12, modAmt: 0.5, rotSpeed: 0.1, feedback: 0.86 };
