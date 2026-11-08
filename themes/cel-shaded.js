// Cel-Shaded: the page is lit like a toon shader. One key light (the pointer, or a fixed sun) cuts every panel into flat bands,
// and the shader in the header renders a real 3D shape with the same model: a stepped ramp on N·L, an inverted-hull outline
// pushed out in clip space, a rim on the lit side and a hard Blinn-Phong highlight. Its controls restyle the whole page too.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const isCalm = () => root.dataset.calm === '1';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---- lettering: every letter is a small lit shape with its own terminator ----
  const letter = (h) => {
    const text = h.textContent.trim();
    if (!text) return;
    const words = el('span', 'cs-letters');
    words.setAttribute('aria-hidden', 'true');
    text.split(' ').forEach((word, wi) => {
      if (wi) words.append(' ');
      // A hyphen is a place the word may break.
      word.replace(/-/g, '-\n').split('\n').filter(Boolean).forEach((chunk) => {
        const w = el('span', 'cs-w');
        [...chunk].forEach((ch) => { const c = el('span', 'cs-ch'); c.dataset.ch = ch; c.textContent = ch; w.append(c); });
        words.append(w);
      });
    });
    const said = el('span', 'cs-vh');
    said.textContent = text;
    h.textContent = '';
    h.append(said, words);
  };
  $$('.hero-title, .sec-title').forEach(letter);

  // ---- materials: each section is a material slot, as in an engine's material editor ----
  const MATS = { feel: 'M_Skin', core: 'M_Tunic', how: 'M_Paper', palette: 'M_Paint', vibe: 'M_Sea', refs: 'M_Paper', sources: 'M_Paper', related: 'M_Tunic' };
  for (const sec of $$('.sec')) {
    const name = MATS[sec.id];
    const t = $('.sec-title', sec);
    if (!name || !t) continue;
    const chip = el('span', 'cs-mat', `<i class="cs-mat-ball"></i><span class="cs-mat-name">${name}</span><i class="cs-mat-sw" data-k="base"></i><i class="cs-mat-sw" data-k="shade"></i><i class="cs-mat-sw" data-k="rim"></i><i class="cs-mat-sw" data-k="line"></i>`);
    chip.setAttribute('aria-hidden', 'true');
    t.append(chip);
  }

  // The footer floats on the sea as one more lit slab.
  const foot = $('.foot');
  if (foot) {
    const card = el('div', 'foot-card');
    card.append(...foot.childNodes);
    foot.append(card);
  }

  // ---- the sky: a posterised dome with toon clouds, behind everything ----
  const cloud = (id, lobes, w, h) => {
    // The base rect reaches up past every place two lobes meet, so no gap opens between them and the base.
    const shape = lobes.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('') + `<rect x="${lobes[0][0]}" y="${h - 40}" width="${lobes[lobes.length - 1][0] - lobes[0][0]}" height="32" rx="13"/>`;
    return `<svg class="cs-cloud cs-cloud-${id}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
      <defs><clipPath id="cs-cl-${id}">${shape}</clipPath></defs>
      <g fill="#2a6fb0" stroke="#2a6fb0" stroke-width="6">${shape}</g>
      <g fill="#bfe3f7">${shape}</g>
      <g clip-path="url(#cs-cl-${id})"><g class="cs-cloud-lit" fill="#fff">${shape}</g></g>
    </svg>`;
  };
  const sky = el('div', 'cs-sky', [
    cloud('a', [[40, 70, 30], [86, 46, 40], [138, 58, 34], [176, 78, 24]], 220, 112),
    cloud('b', [[34, 58, 24], [70, 40, 32], [110, 52, 26]], 150, 92),
    cloud('c', [[44, 82, 34], [96, 52, 46], [156, 60, 40], [208, 80, 28], [240, 92, 18]], 270, 126),
    cloud('d', [[30, 50, 20], [60, 36, 26], [92, 48, 20]], 120, 76),
  ].join(''));
  sky.setAttribute('aria-hidden', 'true');
  document.body.prepend(sky);

  // ---- the key light ----
  // --lx/--ly point toward the light on screen (y down); --lg is how far it rakes across the page, 0 head-on to 1 grazing.
  const DEFAULT = { x: -0.6, y: -0.8, g: 0.82 };
  let follow = canHover && store.get('eas-cel-light') !== 'fixed';
  let lastKey = '';
  const setLight = (x, y, g) => {
    // Snap to 5 degree steps so the page only repaints when the bands really move.
    const a = Math.round(Math.atan2(y, x) / (Math.PI / 36)) * (Math.PI / 36);
    const gg = Math.round(Math.min(1, Math.max(0.2, g)) * 20) / 20;
    const key = `${a.toFixed(3)}|${gg}`;
    if (key === lastKey) return;
    lastKey = key;
    const lx = Math.cos(a);
    const ly = Math.sin(a);
    const s = root.style;
    s.setProperty('--lx', lx.toFixed(3));
    s.setProperty('--ly', ly.toFixed(3));
    s.setProperty('--lg', String(gg));
    // A gradient angle that runs from the lit side to the shaded side.
    s.setProperty('--la', `${Math.round((Math.atan2(-lx, ly) * 180) / Math.PI)}deg`);
  };
  const rest = () => setLight(DEFAULT.x, DEFAULT.y, DEFAULT.g);
  rest();
  // The page is lit by the same light as the toon shader's stage, which is the only place the pointer moves it.
  // vx and vy are the light's place relative to the stage's centre, 1 at its edge.
  let queued = null;
  const lightPage = (vx, vy) => {
    if (isCalm()) return;
    const run = !queued;
    queued = [vx, vy];
    if (!run) return;
    requestAnimationFrame(() => {
      const [x, y] = queued;
      queued = null;
      // A click on the calm button can land between the move and this frame.
      if (isCalm()) return;
      const len = Math.hypot(x, y);
      if (len < 0.04) setLight(DEFAULT.x, DEFAULT.y, 0.2);
      else setLight(x, y, 0.2 + Math.min(1, len) * 0.8);
    });
  };

  // A light gizmo in the site bar says where the light comes from, and pins it.
  const key = el('button', 'cs-key fx', '<span class="cs-key-ball" aria-hidden="true"></span><span class="cs-key-text"><span class="cs-key-k">Key light</span> <span class="cs-key-v"></span></span>');
  key.type = 'button';
  const paintKey = () => {
    key.setAttribute('aria-pressed', String(follow));
    key.setAttribute('aria-label', 'Key light follows the pointer over the toon shader');
    $('.cs-key-v', key).textContent = follow ? 'follows pointer' : 'fixed';
    key.title = follow ? 'Point at the toon shader to move the light. Click to fix it in the upper left.' : 'Click to let the pointer move the light over the toon shader.';
  };
  // Set once the shader exists: puts its light back in the upper left, and says how to move it.
  let restStage = () => {};
  let paintHint = () => {};
  const actions = $('.atlas-actions');
  if (canHover && actions) {
    actions.before(key);
    paintKey();
    key.addEventListener('click', () => {
      follow = !follow;
      store.set('eas-cel-light', follow ? 'follow' : 'fixed');
      if (!follow) { rest(); restStage(); }
      paintKey();
      paintHint();
    });
  }

  // ---- the toon shader ----
  const MATERIALS = {
    ball: { name: 'ball', lit: '#9afe72', shade: '#337c36' }, // Link's tunic, sampled from The Wind Waker HD
    ring: { name: 'ring', lit: '#fde19d', shade: '#d6925b' }, // Jam's skin, sampled from Guilty Gear Xrd
    knot: { name: 'knot', lit: '#ef5b4c', shade: '#6e1b3a' }, // a red with a cool, chosen shade
  };
  const INK = '#3d1510';
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const css = (c) => `rgb(${c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255)).join(' ')})`;
  const state = { bands: 2, outline: 4, rim: true, spec: true, chosen: true, shape: 'ball', px: -1.15, py: -0.95 };
  const shadeOf = (m) => (state.chosen ? rgb(m.shade) : rgb(m.lit).map((v) => v * 0.4)); // 0.4: the ambient grey of a plain toon tutorial

  const lab = el('div', 'cs-lab');
  lab.innerHTML = `
    <div class="cs-lab-head"><span class="cs-lab-title">Toon shader</span><span class="cs-lab-hint"></span></div>
    <div class="cs-stage" tabindex="0" role="group" aria-label="Light position. Use the arrow keys to move the light.">
      <i class="cs-floor" aria-hidden="true"></i>
      <canvas class="cs-canvas" role="img" aria-label=""></canvas>
      <i class="cs-sun" aria-hidden="true"></i>
    </div>
    <div class="cs-ramp" aria-hidden="true"><span class="cs-ramp-k">Ramp</span><span class="cs-ramp-bar"></span><span class="cs-ramp-ticks"><span>N·L −1</span><span>0</span><span>+1</span></span></div>
    <div class="cs-ui">
      <div class="cs-row" role="group" aria-label="Bands of light"><span class="cs-k">Bands</span><span class="cs-seg">
        <button type="button" data-bands="0">Smooth</button><button type="button" data-bands="2">2</button><button type="button" data-bands="3">3</button><button type="button" data-bands="4">4</button></span></div>
      <label class="cs-row"><span class="cs-k">Outline</span><input type="range" min="0" max="10" step="1" value="4" data-outline><output class="cs-out">4 px</output></label>
      <div class="cs-row cs-checks">
        <label><input type="checkbox" data-opt="rim" checked><span>Rim light</span></label>
        <label><input type="checkbox" data-opt="spec" checked><span>Highlight</span></label>
        <label><input type="checkbox" data-opt="chosen" checked><span>Chosen shade</span></label>
      </div>
      <div class="cs-row" role="group" aria-label="Shape"><span class="cs-k">Shape</span><span class="cs-seg">
        <button type="button" data-shape="ball">Ball</button><button type="button" data-shape="ring">Ring</button><button type="button" data-shape="knot">Knot</button></span></div>
    </div>`;
  const hero = $('.hero');
  const gallery = $('.hero-gallery');
  if (hero && gallery) hero.insertBefore(lab, gallery);
  else document.querySelector('.page')?.prepend(lab);

  const canvas = $('.cs-canvas', lab);
  const stage = $('.cs-stage', lab);
  const sun = $('.cs-sun', lab);
  const rampBar = $('.cs-ramp-bar', lab);

  // Meshes. Normals are exact, because an outline grown along normals breaks open on a mesh with split, flat normals.
  const build = (pos, nor, idx) => {
    // Turn every triangle to face outward (counter-clockwise), whatever order the generator produced.
    for (let i = 0; i < idx.length; i += 3) {
      const [a, b, c] = [idx[i], idx[i + 1], idx[i + 2]].map((k) => k * 3);
      const u = [pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]];
      const v = [pos[c] - pos[a], pos[c + 1] - pos[a + 1], pos[c + 2] - pos[a + 2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const s = n[0] * (nor[a] + nor[b] + nor[c]) + n[1] * (nor[a + 1] + nor[b + 1] + nor[c + 1]) + n[2] * (nor[a + 2] + nor[b + 2] + nor[c + 2]);
      if (s < 0) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
    }
    return { pos: new Float32Array(pos), nor: new Float32Array(nor), idx: new Uint16Array(idx) };
  };
  const grid = (cols, rows, fn) => {
    const pos = [];
    const nor = [];
    const idx = [];
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) { const [p, n] = fn(i / cols, j / rows); pos.push(...p); nor.push(...n); }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i;
      const b = a + cols + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    return build(pos, nor, idx);
  };
  const TAU = Math.PI * 2;
  const MESHES = {
    ball: () => grid(72, 44, (u, v) => {
      const th = v * Math.PI;
      const ph = u * TAU;
      const n = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
      return [n, n];
    }),
    ring: () => grid(110, 44, (u, v) => {
      const a = u * TAU;
      const b = v * TAU;
      const n = [Math.cos(b) * Math.cos(a), Math.sin(b), Math.cos(b) * Math.sin(a)];
      return [[0.7 * Math.cos(a) + 0.32 * n[0], 0.32 * n[1], 0.7 * Math.sin(a) + 0.32 * n[2]], n];
    }),
    knot: () => {
      // A (2,3) torus knot, framed the way three.js builds its tube.
      const P = 2;
      const Q = 3;
      const R = 0.62;
      const T = 0.2;
      const at = (t) => { const qp = (Q / P) * t; const cs = Math.cos(qp); return [R * (2 + cs) * 0.5 * Math.cos(t), R * (2 + cs) * 0.5 * Math.sin(t), R * Math.sin(qp) * 0.5]; };
      return grid(260, 22, (u, v) => {
        const t = u * P * TAU;
        const p1 = at(t);
        const p2 = at(t + 0.01);
        const tg = p2.map((x, i) => x - p1[i]);
        let nn = p2.map((x, i) => x + p1[i]);
        const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
        const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((x) => x / l); };
        const bb = norm(cross(tg, nn));
        nn = norm(cross(bb, tg));
        const cx = -T * Math.cos(v * TAU);
        const cy = T * Math.sin(v * TAU);
        const p = [0, 1, 2].map((i) => p1[i] + cx * nn[i] + cy * bb[i]);
        const n = norm(p.map((x, i) => x - p1[i]));
        // Laid flat, like the ring, so it turns on the spot and the tilt shows the trefoil.
        return [[p[0], p[2], p[1]], [n[0], n[2], n[1]]];
      });
    },
  };
  const POSE = { ball: { pitch: 0.1, scale: 0.8 }, ring: { pitch: 0.95, scale: 0.86 }, knot: { pitch: 0.9, scale: 0.9 } };

  // Small matrix helpers, column-major like WebGL.
  const mul = (a, b) => { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
  const rotY = (a) => { const c = Math.cos(a); const s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); };
  const rotX = (a) => { const c = Math.cos(a); const s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); };
  const scale = (k) => new Float32Array([k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, 0, 0, 0, 1]);
  const move = (z) => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, z, 1]);
  const persp = (fovy, aspect, near, far) => { const f = 1 / Math.tan(fovy / 2); const nf = 1 / (near - far); return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]); };

  const lightVec = () => { const v = [state.px * 1.25, -state.py * 1.25, 1]; const l = Math.hypot(...v); return v.map((x) => x / l); };

  // The same lighting model in plain JavaScript: the ramp strip uses it, and so does the fallback if WebGL is missing.
  const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  const rampAt = (ndl, lit, shd) => {
    if (!state.bands) return mix(shd, lit, Math.max(0, ndl));
    const t = ndl * 0.5 + 0.5;
    let lv = 0;
    for (let i = 1; i < state.bands; i++) { const th = i / state.bands; lv += smooth(th - 0.0025, th + 0.0025, t); }
    return mix(shd, lit, lv / (state.bands - 1));
  };

  const VS = `attribute vec3 aPos; attribute vec3 aNor;
uniform mat4 uMV; uniform mat4 uP; uniform mat3 uN; uniform float uGrow; uniform vec2 uRes;
varying vec3 vN; varying vec3 vP;
void main() {
  vec4 vp = uMV * vec4(aPos, 1.0);
  vec3 n = normalize(uN * aNor);
  vN = n; vP = vp.xyz;
  vec4 c = uP * vp;
  if (uGrow > 0.0) {
    // Inverted hull: push the back faces out along the normal, measured in clip space so 1 means 1 pixel.
    vec2 d = (uP * vec4(n, 0.0)).xy;
    float l = length(d);
    if (l > 0.00001) c.xy += d / l * uGrow * 2.0 / uRes * c.w;
  }
  gl_Position = c;
}`;
  const FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec3 uL; uniform vec3 uLit; uniform vec3 uShade; uniform vec3 uInk;
uniform float uBands; uniform float uRim; uniform float uSpec; uniform float uInkPass;
varying vec3 vN; varying vec3 vP;
void main() {
  if (uInkPass > 0.5) { gl_FragColor = vec4(uInk, 1.0); return; }
  vec3 N = normalize(vN);
  vec3 V = normalize(-vP);
  float ndl = dot(N, uL);
  vec3 col;
  float lit = smoothstep(0.0, 0.01, ndl);
  if (uBands < 0.5) {
    col = mix(uShade, uLit, max(ndl, 0.0));
  } else {
    // A stepped ramp: N.L in half-Lambert form, cut into equal bands, each edge softened by 0.01 so it does not crawl.
    float t = ndl * 0.5 + 0.5;
    float lv = 0.0;
    for (int i = 1; i < 4; i++) {
      float th = float(i) / uBands;
      if (float(i) < uBands) lv += smoothstep(th - 0.0025, th + 0.0025, t);
    }
    col = mix(uShade, uLit, lv / (uBands - 1.0));
  }
  vec3 H = normalize(uL + V);
  float ndh = max(dot(N, H), 0.0);
  float rimDot = 1.0 - dot(V, N);
  float spec;
  float rim;
  if (uBands < 0.5) {
    spec = pow(ndh, 48.0) * lit * 0.85;
    rim = pow(max(rimDot, 0.0), 4.0) * smoothstep(0.0, 0.35, ndl) * 0.7;
  } else {
    // Blinn-Phong with glossiness 32 (squared, as in the tutorial), cut hard; the rim kept to the lit side by N.L to the 0.1.
    spec = smoothstep(0.005, 0.01, pow(ndh * lit, 1024.0));
    rim = smoothstep(0.706, 0.726, rimDot * pow(max(ndl, 0.0001), 0.1));
  }
  col = mix(col, vec3(1.0, 1.0, 0.96), rim * uRim);
  col = mix(col, vec3(1.0), spec * uSpec);
  gl_FragColor = vec4(col, 1.0);
}`;

  let gl = null;
  let draw2d = null;
  try {
    gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true }) || null;
  } catch { gl = null; }

  let prog = null;
  let loc = {};
  const buffers = {};
  if (gl) {
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      for (const n of ['aPos', 'aNor']) loc[n] = gl.getAttribLocation(prog, n);
      for (const n of ['uMV', 'uP', 'uN', 'uGrow', 'uRes', 'uL', 'uLit', 'uShade', 'uInk', 'uBands', 'uRim', 'uSpec', 'uInkPass']) loc[n] = gl.getUniformLocation(prog, n);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clearColor(0, 0, 0, 0);
    } catch (e) {
      console.warn('Cel-Shaded: WebGL shader failed, using the 2D fallback.', e);
      gl = null;
    }
  }
  const meshFor = (name) => {
    if (buffers[name]) return buffers[name];
    const m = MESHES[name]();
    const mk = (target, data) => { const b = gl.createBuffer(); gl.bindBuffer(target, b); gl.bufferData(target, data, gl.STATIC_DRAW); return b; };
    buffers[name] = { pos: mk(gl.ARRAY_BUFFER, m.pos), nor: mk(gl.ARRAY_BUFFER, m.nor), idx: mk(gl.ELEMENT_ARRAY_BUFFER, m.idx), count: m.idx.length };
    return buffers[name];
  };

  let yaw = -0.5;
  let W = 0;
  let H = 0;
  let dpr = 1;
  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (w === W && h === H) return false;
    W = w; H = h;
    canvas.width = W; canvas.height = H;
    return true;
  };

  const renderGL = () => {
    const m = MATERIALS[state.shape];
    const mesh = meshFor(state.shape);
    const pose = POSE[state.shape];
    gl.viewport(0, 0, W, H);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const mv = mul(move(-4.6), mul(rotX(pose.pitch), mul(rotY(yaw), scale(pose.scale))));
    const r = mul(rotX(pose.pitch), rotY(yaw));
    gl.uniformMatrix4fv(loc.uMV, false, mv);
    gl.uniformMatrix4fv(loc.uP, false, persp(0.5, W / H, 0.1, 20));
    gl.uniformMatrix3fv(loc.uN, false, new Float32Array([r[0], r[1], r[2], r[4], r[5], r[6], r[8], r[9], r[10]]));
    gl.uniform2f(loc.uRes, W, H);
    gl.uniform3fv(loc.uL, lightVec());
    gl.uniform3fv(loc.uLit, rgb(m.lit));
    gl.uniform3fv(loc.uShade, shadeOf(m));
    gl.uniform3fv(loc.uInk, rgb(INK));
    gl.uniform1f(loc.uBands, state.bands);
    gl.uniform1f(loc.uRim, state.rim ? 1 : 0);
    gl.uniform1f(loc.uSpec, state.spec ? 1 : 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.pos);
    gl.enableVertexAttribArray(loc.aPos);
    gl.vertexAttribPointer(loc.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.nor);
    gl.enableVertexAttribArray(loc.aNor);
    gl.vertexAttribPointer(loc.aNor, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.idx);
    if (state.outline > 0) {
      // Pass 1: the hull, back faces only, in ink.
      gl.cullFace(gl.FRONT);
      gl.uniform1f(loc.uInkPass, 1);
      gl.uniform1f(loc.uGrow, state.outline * dpr);
      gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    }
    // Pass 2: the shaded surface.
    gl.cullFace(gl.BACK);
    gl.uniform1f(loc.uInkPass, 0);
    gl.uniform1f(loc.uGrow, 0);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
  };

  // Without WebGL: a ray-cast ball on a 2D canvas, same model, outline drawn as a ring.
  if (!gl) {
    const ctx = canvas.getContext('2d');
    lab.classList.add('cs-2d');
    $$('[data-shape]', lab).forEach((b) => { if (b.dataset.shape !== 'ball') b.disabled = true; });
    draw2d = () => {
      const img = ctx.createImageData(W, H);
      const d = img.data;
      const m = MATERIALS.ball;
      const lit = rgb(m.lit);
      const shd = shadeOf(m);
      const ink = rgb(INK);
      const L = lightVec();
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(W, H) * 0.29;
      const ow = state.outline * dpr;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const dx = (x + 0.5 - cx) / R;
          const dy = (y + 0.5 - cy) / R;
          const rr = dx * dx + dy * dy;
          const o = (y * W + x) * 4;
          let c;
          let a = 1;
          if (rr > 1) {
            const dist = (Math.sqrt(rr) - 1) * R;
            if (dist >= ow + 1) continue;
            c = ink;
            a = Math.min(1, ow + 1 - dist);
          } else {
            const N = [dx, -dy, Math.sqrt(1 - rr)];
            const ndl = N[0] * L[0] + N[1] * L[1] + N[2] * L[2];
            c = rampAt(ndl, lit, shd);
            const hv = [L[0], L[1], L[2] + 1];
            const hl = Math.hypot(...hv);
            const ndh = Math.max(0, (N[0] * hv[0] + N[1] * hv[1] + N[2] * hv[2]) / hl);
            const litT = smooth(0, 0.01, ndl);
            const rimDot = 1 - N[2];
            const rim = state.bands ? smooth(0.706, 0.726, rimDot * Math.pow(Math.max(ndl, 0.0001), 0.1)) : Math.pow(rimDot, 4) * smooth(0, 0.35, ndl) * 0.7;
            const spec = state.bands ? smooth(0.005, 0.01, Math.pow(ndh * litT, 1024)) : Math.pow(ndh, 48) * litT * 0.85;
            if (state.rim) c = mix(c, [1, 1, 0.96], rim);
            if (state.spec) c = mix(c, [1, 1, 1], spec);
            if (ow > 0 && rr > 0.98) c = mix(c, ink, Math.min(1, (Math.sqrt(rr) - 0.99) * R));
          }
          d[o] = c[0] * 255; d[o + 1] = c[1] * 255; d[o + 2] = c[2] * 255; d[o + 3] = a * 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };
  }

  const describe = () => {
    const what = { ball: 'ball', ring: 'ring', knot: 'knot' }[gl ? state.shape : 'ball'];
    canvas.setAttribute('aria-label', `A toon-shaded ${what}, lit ${state.bands ? `in ${state.bands} flat bands` : 'smoothly'}${state.outline ? `, with a ${state.outline} pixel ink outline` : ''}${state.rim ? ', a rim light' : ''}${state.spec ? ' and a hard highlight' : ''}.`);
  };
  const paintRamp = () => {
    const m = MATERIALS[gl ? state.shape : 'ball'];
    const lit = rgb(m.lit);
    const shd = shadeOf(m);
    if (!state.bands) {
      rampBar.style.background = `linear-gradient(90deg, ${css(shd)} 0 50%, ${css(lit)} 100%)`;
      return;
    }
    const n = state.bands;
    const stops = [];
    for (let k = 0; k < n; k++) stops.push(`${css(mix(shd, lit, k / (n - 1)))} ${(k / n) * 100}% ${((k + 1) / n) * 100}%`);
    rampBar.style.background = `linear-gradient(90deg, ${stops.join(', ')})`;
  };
  const placeSun = () => {
    let x = state.px;
    let y = state.py;
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    sun.style.left = `${50 + x * 44}%`;
    sun.style.top = `${50 + y * 42}%`;
    stage.style.setProperty('--sx', x.toFixed(3));
  };

  let dirty = true;
  const render = () => {
    resize();
    if (gl) renderGL(); else if (draw2d) draw2d();
    dirty = false;
  };

  // Spin slowly while on screen, unless calm. Otherwise draw only when something changes.
  let onScreen = true;
  let raf = 0;
  let last = 0;
  const loop = (now) => {
    raf = 0;
    if (!onScreen || document.hidden) return;
    const spin = !isCalm() && gl;
    if (spin) {
      yaw += Math.min(0.05, (now - (last || now)) / 1000) * 0.45;
      last = now;
      dirty = true;
    } else last = 0;
    if (dirty) render();
    if (spin) raf = requestAnimationFrame(loop);
  };
  const kick = () => { dirty = true; if (!raf) raf = requestAnimationFrame(loop); };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { onScreen = es[0].isIntersecting; if (onScreen) kick(); }).observe(stage);
  }
  if ('ResizeObserver' in window) new ResizeObserver(() => kick()).observe(canvas);
  document.addEventListener('visibilitychange', kick);

  // The light: the pointer over the stage on a hover screen (unless calm or pinned), a press and drag on the stage, or the arrow keys.
  // Only the stage moves it, so pointing at the rest of the page leaves the light where it was. The page is lit the same way.
  const START = { px: state.px, py: state.py };
  const moved = () => {
    placeSun();
    kick();
    lightPage(state.px, state.py);
  };
  restStage = () => { state.px = START.px; state.py = START.py; placeSun(); kick(); };
  const fromPoint = (cx, cy) => {
    const r = stage.getBoundingClientRect();
    if (!r.width) return;
    state.px = (cx - (r.left + r.width / 2)) / (r.width / 2);
    state.py = (cy - (r.top + r.height / 2)) / (r.height / 2);
    moved();
  };
  let dragging = false;
  stage.addEventListener('pointermove', (e) => {
    if (dragging || (follow && canHover && e.pointerType === 'mouse' && !isCalm())) fromPoint(e.clientX, e.clientY);
  }, { passive: true });
  stage.addEventListener('pointerdown', (e) => {
    dragging = true;
    try { stage.setPointerCapture(e.pointerId); } catch { /* old browser */ }
    fromPoint(e.clientX, e.clientY);
  });
  const stop = () => { dragging = false; };
  stage.addEventListener('pointerup', stop);
  stage.addEventListener('pointercancel', stop);
  stage.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, -0.2], ArrowDown: [0, 0.2] }[e.key];
    if (!step) return;
    e.preventDefault();
    e.stopPropagation(); // the page uses bare arrow keys to change style
    state.px = Math.max(-2.5, Math.min(2.5, state.px + step[0]));
    state.py = Math.max(-2.5, Math.min(2.5, state.py + step[1]));
    moved();
  });

  // Controls. They set the shader's uniforms, and the same values restyle every panel on the page.
  const out = $('.cs-out', lab);
  const paintControls = () => {
    $$('[data-bands]', lab).forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.bands) === state.bands)));
    $$('[data-shape]', lab).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.shape === state.shape)));
    out.textContent = `${state.outline} px`;
    root.dataset.celBands = state.bands ? String(state.bands) : 'smooth';
    root.style.setProperty('--ow', `${(state.outline * 0.75).toFixed(2)}px`);
    root.style.setProperty('--owf', String(state.outline / 4));
    root.dataset.celRim = state.rim ? 'on' : 'off';
    root.dataset.celSpec = state.spec ? 'on' : 'off';
    root.dataset.celShade = state.chosen ? 'chosen' : 'dark';
    describe();
    paintRamp();
  };
  $$('[data-bands]', lab).forEach((b) => b.addEventListener('click', () => { state.bands = Number(b.dataset.bands); paintControls(); kick(); }));
  $$('[data-shape]', lab).forEach((b) => b.addEventListener('click', () => { state.shape = b.dataset.shape; paintControls(); kick(); }));
  $('[data-outline]', lab).addEventListener('input', (e) => { state.outline = Number(e.target.value); paintControls(); kick(); });
  $$('[data-opt]', lab).forEach((c) => c.addEventListener('change', () => { state[c.dataset.opt] = c.checked; paintControls(); kick(); }));

  // In calm mode, or with the light pinned, it only moves when you press on the shape, so the hint says so.
  const hint = $('.cs-lab-hint', lab);
  paintHint = () => { hint.textContent = `${canHover && follow && !isCalm() ? 'Point at the shape to move the light.' : 'Press and drag on the shape to move the light.'} These settings light the whole page too.`; };
  addEventListener('eas:calm', () => {
    if (isCalm()) rest();
    paintHint();
    kick();
  });
  addEventListener('resize', () => { placeSun(); kick(); });

  paintHint();
  paintControls();
  placeSun();
  kick();
})();
