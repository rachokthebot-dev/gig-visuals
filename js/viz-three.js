/* A real 3D scene per song, via three.js.

   The song's artwork becomes an equirectangular environment map, so the object
   carries genuine reflections of the photograph and the room behind it is the
   photograph too. That is where the realism comes from — PBR shading against
   real image data, rather than procedural maths pretending to be a surface. */
window.GV = window.GV || {};

GV.VizThree = function (canvas) {
  if (!window.THREE) throw new Error('three.js not loaded');
  const T = window.THREE;

  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(1);                       // canvas is already sized in device px
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputEncoding = T.sRGBEncoding;

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(50, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 4.2);

  const SHAPES = {
    ico:   () => new T.IcosahedronGeometry(1.25, 4),
    torus: () => new T.TorusGeometry(1.0, 0.42, 48, 128),
    knot:  () => new T.TorusKnotGeometry(0.95, 0.30, 220, 36)
  };

  const material = new T.MeshStandardMaterial({
    color: 0xffffff, metalness: 0.9, roughness: 0.18, envMapIntensity: 1.5
  });
  let mesh = null, baseGeo = null, basePos = null, shapeKey = null;

  // two palette-coloured lights so the object still reads before an env map lands
  const keyLight = new T.PointLight(0xffffff, 18, 50);
  const rimLight = new T.PointLight(0xffffff, 14, 50);
  keyLight.position.set(3, 2.5, 3);
  rimLight.position.set(-3.2, -1.8, -2.2);
  scene.add(keyLight, rimLight, new T.AmbientLight(0xffffff, 0.25));

  // a sparse point field for parallax, so the frame isn't just one object
  const dustGeo = new T.BufferGeometry();
  const DUST = 1400, dp = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    const r = 6 + Math.random() * 14, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    dp[i*3] = r * Math.sin(ph) * Math.cos(th);
    dp[i*3+1] = r * Math.sin(ph) * Math.sin(th);
    dp[i*3+2] = r * Math.cos(ph);
  }
  dustGeo.setAttribute('position', new T.BufferAttribute(dp, 3));
  const dust = new T.Points(dustGeo, new T.PointsMaterial({ size: 0.055, transparent: true, opacity: 0.7 }));
  scene.add(dust);

  let envTex = null, imgSrc = null, reveal = 0, lastT = 0, W = 0, H = 0;

  function buildShape(key) {
    if (shapeKey === key) return;
    shapeKey = key;
    if (mesh) { scene.remove(mesh); baseGeo.dispose(); }
    baseGeo = (SHAPES[key] || SHAPES.ico)();
    basePos = baseGeo.attributes.position.array.slice();
    mesh = new T.Mesh(baseGeo, material);
    scene.add(mesh);
  }
  buildShape('ico');

  function setImage(src) {
    if (!src) { scene.environment = null; scene.background = null; imgSrc = null; return; }
    if (envTex) envTex.dispose();
    envTex = GV.gl.isVideo(src) ? new T.VideoTexture(src) : new T.Texture(src);
    envTex.mapping = T.EquirectangularReflectionMapping;
    envTex.encoding = T.sRGBEncoding;
    if (!GV.gl.isVideo(src)) envTex.needsUpdate = true;
    scene.environment = envTex;
    scene.background = envTex;
    imgSrc = src;
    reveal = 1;
  }

  function resize(w, h) {
    W = w; H = h;
    canvas.width = w; canvas.height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function reset() {}

  // cheap value noise, so displacement is smooth rather than jittery
  function n3(x, y, z) {
    return Math.sin(x * 1.7 + z * 0.9) * Math.cos(y * 1.3 - z * 1.1)
         + 0.5 * Math.sin((x + y) * 2.1 + z * 1.7);
  }

  function draw(au, th, t) {
    const dt = lastT ? Math.min(0.1, t - lastT) : 0; lastT = t;
    reveal *= Math.exp(-dt / 1.10);
    if (reveal < 0.002) reveal = 0;

    const p = Object.assign({}, GV.VizThree.DEFAULTS, th.three);
    buildShape(p.shape);

    const c = th.palette.map(GV.hexToRgb);
    keyLight.color.setRGB(c[1][0], c[1][1], c[1][2]);
    rimLight.color.setRGB(c[2][0], c[2][1], c[2][2]);
    dust.material.color.setRGB(c[2][0], c[2][1], c[2][2]);

    material.metalness = p.metal;
    material.roughness = Math.max(0.03, p.rough - au.high * 0.10);
    material.envMapIntensity = 1.1 + au.level * 1.4 + au.pulse * 0.8;
    material.color.setRGB(
      0.55 + c[1][0] * 0.45, 0.55 + c[1][1] * 0.45, 0.55 + c[1][2] * 0.45);

    // breathe the surface on the low end, punch it on the beat
    const amp = p.disp * (0.25 + au.bass * 1.5 + au.pulse * 0.9);
    const pos = baseGeo.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const x = basePos[i], y = basePos[i+1], z = basePos[i+2];
      const d = 1 + amp * 0.18 * n3(x * 1.6 + t * 0.6, y * 1.6, z * 1.6 + t * 0.35);
      pos[i] = x * d; pos[i+1] = y * d; pos[i+2] = z * d;
    }
    baseGeo.attributes.position.needsUpdate = true;
    baseGeo.computeVertexNormals();

    mesh.rotation.y += dt * (0.12 + au.mid * 0.9) * p.spin;
    mesh.rotation.x += dt * (0.05 + au.level * 0.3) * p.spin;
    const s = 1 + au.pulse * 0.10 + au.bass * 0.05;
    mesh.scale.set(s, s, s);

    dust.rotation.y -= dt * 0.03;
    camera.position.x = Math.sin(t * 0.11) * 0.55;
    camera.position.y = Math.cos(t * 0.09) * 0.35;
    camera.position.z = 4.2 - au.pulse * 0.30;
    camera.lookAt(0, 0, 0);

    renderer.toneMappingExposure = 0.95 + au.level * 0.7 + reveal * 0.5;
    renderer.render(scene, camera);
  }

  return { canvas, resize, draw, reset, setImage, label: 'Three — PBR environment' };
};

GV.VizThree.DEFAULTS = { shape: 'ico', metal: 0.9, rough: 0.18, disp: 1.0, spin: 1.0 };
