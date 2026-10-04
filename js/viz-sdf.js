/* Raymarched terrain under volumetric haze.

   Nothing here is geometry — the landscape is a function of position, sampled
   along each ray. That is what lets the artwork enter as *height* rather than
   as a picture pasted on something: at full presence the photograph's luminance
   IS the terrain, and the camera flies through it.

   Renders at a fraction of display resolution and lets the canvas upscale.
   Every pixel runs the march loop, and each step evaluates the whole scene, so
   this is by far the most expensive engine here. */
window.GV = window.GV || {};

GV.VizSdf = function (canvas) {
  const G = GV.gl;
  const gl = G.context(canvas);
  if (!gl) throw new Error('WebGL unavailable');

  const SCALE = 0.55;                       // render scale; canvas CSS upscales

  const FS = G.LIB + `
uniform vec2  uRes;
uniform float uTime, uBass, uMid, uHigh, uPulse, uLevel;
uniform vec3  uC0, uC1, uC2;
uniform float uAmp, uFreq, uFog, uSpeed, uSharp;
uniform sampler2D uImg;
uniform float uImgAmt, uImgHeight, uImgSky, uImgReveal;

float ridged(vec2 p){
  float h = fbm(p);
  return mix(h, 1.0 - abs(h * 2.0 - 1.0), uSharp);
}

float height(vec2 p){
  float h = ridged(p * uFreq);
  if (uImgAmt > 0.0 && uImgHeight > 0.0) {
    // the photograph's luminance becomes relief; fract() tiles it so the
    // camera can keep flying without running off the edge of the picture
    vec3 img = texture2D(uImg, fract(p * 0.032 + 0.5)).rgb;
    float l = dot(img, vec3(0.299, 0.587, 0.114));
    h = mix(h, l * 1.0, uImgHeight);
  }
  return h * uAmp * (0.75 + uBass * 0.9);
}

vec3 sky(vec3 rd){
  float up = clamp(rd.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 s = mix(uC0 * 1.3, uC1 * 0.85, pow(up, 0.7));
  if (uImgAmt > 0.0 && uImgSky > 0.0) {
    vec2 iuv = vec2(atan(rd.z, rd.x) / 6.2831853 + 0.5, clamp(rd.y * 0.5 + 0.5, 0.0, 1.0));
    s = mix(s, texture2D(uImg, iuv).rgb * 1.1, uImgSky);
  }
  return s;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;

  float z = uTime * uSpeed * (0.9 + uLevel * 0.5);
  vec3 ro = vec3(sin(uTime * 0.07) * 1.5, 2.1 + uPulse * 0.45, z);
  vec3 rd = normalize(vec3(uv, 1.25));
  rd.xz = rot(rd.xz, sin(uTime * 0.05) * 0.25);

  // fixed-step march: displacing the field breaks the distance bound that
  // sphere tracing relies on, so step conservatively and refine on the crossing
  float t = 0.4, hit = -1.0, prevD = 1.0;
  for (int i = 0; i < 70; i++) {
    vec3 p = ro + rd * t;
    float d = p.y - height(p.xz);
    if (d < 0.0) { t -= prevD * 0.5; hit = t; break; }
    prevD = max(0.12, d * 0.55);
    t += prevD;
    if (t > 46.0) break;
  }

  vec3 col;
  if (hit > 0.0) {
    vec3 p = ro + rd * hit;
    float e = 0.12;
    vec3 n = normalize(vec3(
      height(p.xz - vec2(e, 0.0)) - height(p.xz + vec2(e, 0.0)),
      2.0 * e,
      height(p.xz - vec2(0.0, e)) - height(p.xz + vec2(0.0, e))));
    vec3 sun = normalize(vec3(0.6, 0.45 + uMid * 0.2, -0.4));
    float dif = clamp(dot(n, sun), 0.0, 1.0);
    float rim = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 2.5);

    vec3 base = mix(uC0, uC1, clamp(p.y / (uAmp * 1.6) + 0.35, 0.0, 1.0));
    col = base * (0.18 + dif * 1.05) + uC2 * rim * (0.5 + uHigh * 1.6);
    col += uC2 * uPulse * 0.35 * dif;

    float fog = 1.0 - exp(-hit * uFog * (0.7 + uMid * 0.8));
    col = mix(col, sky(rd), fog);
  } else {
    col = sky(rd);
  }

  // a little glow toward the sun so the haze reads as volume
  float sunAmt = pow(clamp(dot(rd, normalize(vec3(0.6, 0.3, -0.4))), 0.0, 1.0), 8.0);
  col += uC2 * sunAmt * (0.25 + uPulse * 0.5);
  col *= 0.55 + uLevel * 0.85 + uImgReveal * 0.35;

  gl_FragColor = vec4(col, 1.0);
}`;

  const prog = G.program(gl, FS);
  const quad = G.quad(gl);
  let W = 0, H = 0;
  let imgTex = null, imgSrc = null, imgAmt = 0, reveal = 0, lastT = 0;
  const blankTex = G.blankTexture(gl);

  const U = {};
  for (const n of ['uRes','uTime','uBass','uMid','uHigh','uPulse','uLevel','uC0','uC1','uC2',
    'uAmp','uFreq','uFog','uSpeed','uSharp','uImg','uImgAmt','uImgHeight','uImgSky','uImgReveal'])
    U[n] = gl.getUniformLocation(prog, n);

  function setImage(src) {
    if (!src) { imgAmt = 0; imgSrc = null; return; }
    if (!imgTex) imgTex = gl.createTexture();
    imgSrc = src;
    G.upload(gl, imgTex, src);
    imgAmt = 1; reveal = 1;
  }

  function resize(w, h) {
    W = Math.max(2, Math.round(w * SCALE));
    H = Math.max(2, Math.round(h * SCALE));
    canvas.width = W; canvas.height = H;
  }

  function reset() {}

  function draw(au, th, t) {
    const dt = lastT ? Math.min(0.1, t - lastT) : 0; lastT = t;
    reveal *= Math.exp(-dt / 1.10);
    if (reveal < 0.002) reveal = 0;
    if (G.videoReady(imgSrc)) G.upload(gl, imgTex, imgSrc);

    const P = GV.Art.level;
    const p = Object.assign({}, GV.VizSdf.DEFAULTS, th.sdf);
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
    gl.uniform1f(U.uAmp, p.amp);
    gl.uniform1f(U.uFreq, p.freq);
    gl.uniform1f(U.uFog, p.fog);
    gl.uniform1f(U.uSpeed, p.speed);
    gl.uniform1f(U.uSharp, p.sharp);

    // Presence decides how the picture enters: as distant sky only, or as the
    // ground itself. flatBias runs 0.15 (texture) -> 0.90 (showcase).
    gl.uniform1f(U.uImgAmt, imgAmt * (P.mix > 0 ? 1 : 0));
    gl.uniform1f(U.uImgSky, Math.min(0.85, 0.25 + P.flatBias * 0.5) * P.mix);
    gl.uniform1f(U.uImgHeight, Math.max(0, (P.flatBias - 0.3) * 0.9));
    gl.uniform1f(U.uImgReveal, reveal * P.reveal);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imgTex || blankTex);
    gl.uniform1i(U.uImg, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  return { canvas, resize, draw, reset, setImage, label: 'SDF — raymarched terrain' };
};

GV.VizSdf.DEFAULTS = { amp: 1.6, freq: 0.5, fog: 0.055, speed: 2.4, sharp: 0.4 };
