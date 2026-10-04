/* MilkDrop / Butterchurn-style: a per-frame warp of the previous frame
   (zoom + rotate + noise warp + decay), with the waveform and a beat shape
   drawn on top each frame so the trails are the picture. */
window.GV = window.GV || {};

GV.VizMilkdrop = function (canvas) {
  const G = GV.gl;
  const gl = G.context(canvas);
  if (!gl) throw new Error('WebGL unavailable');

  const WARP = G.LIB + `
uniform vec2  uRes;
uniform float uTime, uZoom, uRot, uWarp, uDecay, uBass, uMid, uHigh, uPulse;
uniform vec3  uC0, uC2;
uniform sampler2D uPrev;
uniform sampler2D uImg;
uniform float uImgAmt;      // 0 when there is no image
uniform vec2  uImgScale;    // cover-fit correction for the canvas aspect

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 c  = uv - 0.5;
  c.x *= uRes.x / uRes.y;

  float zoom = uZoom - (uBass - 0.25) * 0.02 - uPulse * 0.012;
  float rotA = uRot * (1.0 + uMid * 2.5);

  float w = uWarp * (0.25 + uBass * 1.1);
  c += vec2(
    fbm(c * 2.2 + uTime * 0.21) - 0.5,
    fbm(c * 2.2 - uTime * 0.17 + 9.3) - 0.5
  ) * w * 0.035;

  c = rot(c, rotA);
  c *= zoom;
  c.x /= uRes.x / uRes.y;

  vec3 prev = texture2D(uPrev, c + 0.5).rgb;
  prev *= uDecay - uHigh * 0.012;
  // slow hue drift between the theme's darkest and brightest colour
  prev += (uC0 * 0.012 + uC2 * 0.006 * uPulse);

  // Seed the feedback buffer with the artwork. Because the buffer decays by
  // uDecay every frame, a small per-frame injection reaches a steady state of
  // roughly inj/(1-uDecay) — so this stays small on purpose, and the beat
  // re-forms the image just as the warp is pulling the last one apart.
  if (uImgAmt > 0.0) {
    vec2 iuv = (uv - 0.5) * uImgScale + 0.5;
    vec3 img = texture2D(uImg, iuv).rgb;
    // Normalise against this song's decay: the buffer settles at inj/(1-uDecay),
    // and uDecay runs 0.94-0.98 across the set, which would otherwise make the
    // artwork three times stronger on some songs than others.
    float norm = (1.0 - uDecay) * 22.0;
    // Weight by the picture's own luminance so its bright features seed the
    // warp and its flat dark areas don't wash the whole frame.
    float luma = dot(img, vec3(0.299, 0.587, 0.114));
    float inj = uImgAmt * norm * (0.0016 + uPulse * 0.020);
    prev += img * (0.18 + 0.82 * luma) * inj;
  }

  gl_FragColor = vec4(prev, 1.0);
}`;

  const LINE_VS = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  const LINE_FS = 'precision highp float; uniform vec3 uCol; uniform float uA; void main(){ gl_FragColor = vec4(uCol*uA, 1.0); }';

  const POST = `precision highp float;
uniform sampler2D uTex; uniform vec2 uRes; uniform float uGain;
void main(){
  vec2 uv = gl_FragCoord.xy/uRes;
  vec3 c = texture2D(uTex, uv).rgb;
  vec3 bl = vec3(0.0);
  for(int i=1;i<=4;i++){
    float o = float(i)*1.7/uRes.y;
    bl += texture2D(uTex, uv+vec2(0.0,o)).rgb + texture2D(uTex, uv-vec2(0.0,o)).rgb;
    bl += texture2D(uTex, uv+vec2(o,0.0)).rgb + texture2D(uTex, uv-vec2(o,0.0)).rgb;
  }
  c += bl/16.0 * 0.45;
  c *= uGain;
  gl_FragColor = vec4(pow(c, vec3(0.92)), 1.0);
}`;

  const warp = G.program(gl, WARP);
  const line = G.program(gl, LINE_FS, LINE_VS);
  const post = G.program(gl, POST);
  const quad = G.quad(gl);
  const lineBuf = gl.createBuffer();

  const Uw = {};
  for (const n of ['uRes', 'uTime', 'uZoom', 'uRot', 'uWarp', 'uDecay', 'uBass', 'uMid', 'uHigh',
    'uPulse', 'uC0', 'uC2', 'uPrev', 'uImg', 'uImgAmt', 'uImgScale'])
    Uw[n] = gl.getUniformLocation(warp, n);
  const Ul = { uCol: gl.getUniformLocation(line, 'uCol'), uA: gl.getUniformLocation(line, 'uA') };
  const Up = { uTex: gl.getUniformLocation(post, 'uTex'), uRes: gl.getUniformLocation(post, 'uRes'), uGain: gl.getUniformLocation(post, 'uGain') };

  let a = null, b = null, W = 0, H = 0;
  let imgTex = null, imgAspect = 1, imgAmt = 0;

  // a 1x1 black texture keeps the sampler bound even with no artwork loaded
  const blankTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, blankTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  /* Pass null to clear. Non-power-of-two images are fine here: CLAMP_TO_EDGE
     with LINEAR and no mipmaps is exactly what WebGL1 requires of them. */
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
    imgAspect = img.naturalWidth / img.naturalHeight;
    imgAmt = 1;
  }

  const N = 256;
  const verts = new Float32Array(N * 2);

  function resize(w, h) {
    W = w; H = h;
    canvas.width = w; canvas.height = h;
    a = G.target(gl, w, h);
    b = G.target(gl, w, h);
  }

  function strokeStrip(count, col, alpha) {
    gl.useProgram(line);
    const loc = gl.getAttribLocation(line, 'p');
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
    gl.bufferData(gl.ARRAY_BUFFER, verts.subarray(0, count * 2), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3fv(Ul.uCol, col);
    gl.uniform1f(Ul.uA, alpha);
    gl.drawArrays(gl.LINE_STRIP, 0, count);
  }

  function draw(au, th, t) {
    const p = Object.assign({}, GV.VizMilkdrop.DEFAULTS, th.milkdrop);
    const c = th.palette.map(GV.hexToRgb);
    gl.viewport(0, 0, W, H);

    // 1. warp previous frame into a
    gl.useProgram(warp);
    G.bindQuad(gl, warp, quad);
    gl.uniform2f(Uw.uRes, W, H);
    gl.uniform1f(Uw.uTime, t);
    gl.uniform1f(Uw.uZoom, p.zoom);
    gl.uniform1f(Uw.uRot, p.rot);
    gl.uniform1f(Uw.uWarp, p.warp);
    gl.uniform1f(Uw.uDecay, p.decay);
    gl.uniform1f(Uw.uBass, au.bass);
    gl.uniform1f(Uw.uMid, au.mid);
    gl.uniform1f(Uw.uHigh, au.high);
    gl.uniform1f(Uw.uPulse, au.pulse);
    gl.uniform3fv(Uw.uC0, c[0]);
    gl.uniform3fv(Uw.uC2, c[2]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, b.tex);
    gl.uniform1i(Uw.uPrev, 0);

    // cover-fit: crop the longer axis rather than squashing the picture
    const canvasAspect = W / H;
    const sx = canvasAspect > imgAspect ? 1 : canvasAspect / imgAspect;
    const sy = canvasAspect > imgAspect ? imgAspect / canvasAspect : 1;
    gl.uniform2f(Uw.uImgScale, sx, sy);
    gl.uniform1f(Uw.uImgAmt, imgAmt);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, imgTex || blankTex);
    gl.uniform1i(Uw.uImg, 1);
    gl.activeTexture(gl.TEXTURE0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, a.fbo);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 2. draw this frame's waveform + beat ring into a
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    const amp = p.waveAmp * (0.35 + au.level * 2.2);
    for (let i = 0; i < N; i++) {
      verts[i * 2] = (i / (N - 1)) * 2 - 1;
      verts[i * 2 + 1] = au.waveform[i] * amp;
    }
    strokeStrip(N, c[1], 0.55 + au.level * 0.45);

    const ringR = 0.12 + au.pulse * 0.55 + au.bass * 0.25;
    for (let i = 0; i < N; i++) {
      const ang = (i / (N - 1)) * Math.PI * 2;
      const rr = ringR * (1 + au.waveform[i] * 0.35);
      verts[i * 2] = Math.cos(ang) * rr * (H / W);
      verts[i * 2 + 1] = Math.sin(ang) * rr;
    }
    strokeStrip(N, c[2], 0.25 + au.pulse * 0.75);
    gl.disable(gl.BLEND);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // 3. bloom + composite
    gl.useProgram(post);
    G.bindQuad(gl, post, quad);
    gl.uniform2f(Up.uRes, W, H);
    gl.uniform1f(Up.uGain, 0.9 + au.level * 0.5);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, a.tex);
    gl.uniform1i(Up.uTex, 0);
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

  return { canvas, resize, draw, reset, setImage, label: 'MilkDrop — feedback warp' };
};

GV.VizMilkdrop.DEFAULTS = { zoom: 0.994, rot: 0.003, warp: 0.5, decay: 0.965, waveAmp: 0.3 };
