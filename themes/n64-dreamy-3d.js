// N64 / Dreamy Early 3D: the page floats in a real low-poly world. WebGL at about 320 x 240, scaled up soft, with 32 x 32 textures,
// vertex colours and horizon fog. Scrolling flies the camera. Paintings ripple when touched, letters stretch when grabbed, and each section holds a star.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private window */ } };
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  // ---- World ------------------------------------------------------------------------------------
  const world = { fog: true, linear: true, gouraud: true, sunset: 0 };
  const canvas = document.createElement('canvas');
  canvas.className = 'n64-world';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: true });

  if (gl) initWorld(); else canvas.remove();

  function initWorld() {
    const VS = `attribute vec3 p; attribute vec3 c; attribute vec2 uv; uniform mat4 vp; uniform vec2 scroll; uniform vec4 fogR;
      varying vec3 vC; varying vec2 vU; varying float vF;
      void main(){ vec4 q = vp * vec4(p, 1.0); gl_Position = q; vC = c; vU = uv + scroll; vF = clamp((q.w - fogR.x) / (fogR.y - fogR.x), 0.0, 1.0) * fogR.z; }`;
    const FS = `precision mediump float; varying vec3 vC; varying vec2 vU; varying float vF; uniform sampler2D t; uniform vec3 fogC; uniform vec4 ctl; uniform vec3 tint;
      void main(){ vec4 tx = texture2D(t, vU); if (tx.a < ctl.x) discard; vec3 col = tx.rgb * (ctl.y > .5 ? vC : vec3(.9)) * tint; col = mix(col, fogC, vF * ctl.w); gl_FragColor = vec4(col, tx.a * ctl.z); }`;
    const prog = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, FS]]) {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); gl.attachShader(prog, s);
    }
    gl.linkProgram(prog); gl.useProgram(prog);
    const U = (n) => gl.getUniformLocation(prog, n);
    const A = (n) => gl.getAttribLocation(prog, n);
    const uni = { vp: U('vp'), scroll: U('scroll'), fogR: U('fogR'), fogC: U('fogC'), ctl: U('ctl'), tint: U('tint') };
    const attr = { p: A('p'), c: A('c'), uv: A('uv') };

    // Textures: 32 x 32, the size the console's 4 KB cache really allowed, smeared by bilinear filtering
    let seed = 64;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const textures = [];
    function tex(size, paint) {
      const c = document.createElement('canvas'); c.width = c.height = size;
      paint(c.getContext('2d'), size);
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      textures.push(t);
      return t;
    }
    const blot = (g, s, n, cols, a = 0.5, r = 3) => { for (let i = 0; i < n; i++) { g.globalAlpha = rnd() * a; g.fillStyle = cols[Math.floor(rnd() * cols.length)]; g.beginPath(); g.arc(rnd() * s, rnd() * s, 1 + rnd() * r, 0, 7); g.fill(); } g.globalAlpha = 1; };
    const TX = {
      detail: tex(32, (g, s) => { g.fillStyle = '#e4e4e4'; g.fillRect(0, 0, s, s); blot(g, s, 60, ['#fff', '#b8b8b8', '#cfcfcf'], 0.6, 3); }),
      stone: tex(32, (g, s) => {
        g.fillStyle = '#efe6cc'; g.fillRect(0, 0, s, s);
        g.fillStyle = '#b4a788';
        for (let y = 0; y < s; y += 8) { g.fillRect(0, y, s, 1); for (let x = (y / 8) % 2 ? 8 : 0; x < s; x += 16) g.fillRect(x, y, 1, 8); }
        blot(g, s, 26, ['#d5c9a8', '#fff5dc'], 0.5, 2);
      }),
      roof: tex(32, (g, s) => { g.fillStyle = '#d33a2c'; g.fillRect(0, 0, s, s); g.fillStyle = '#8e1c17'; for (let y = 0; y < s; y += 8) g.fillRect(0, y, s, 2); blot(g, s, 20, ['#ee6146', '#a82418'], 0.4, 2); }),
      water: tex(32, (g, s) => { g.fillStyle = '#2d78d8'; g.fillRect(0, 0, s, s); g.strokeStyle = '#9bd2ff'; for (let i = 0; i < 9; i++) { g.globalAlpha = 0.25 + rnd() * 0.5; g.beginPath(); const y = rnd() * s; g.moveTo(0, y); g.bezierCurveTo(10, y - 6, 20, y + 6, s, y); g.stroke(); } g.globalAlpha = 1; }),
      tree: tex(32, (g, s) => {
        g.clearRect(0, 0, s, s); g.fillStyle = '#6a4021'; g.fillRect(14, 22, 4, 10);
        const blob = (x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
        blob(16, 13, 12, '#1f7a2a'); blob(13, 11, 8, '#2f9a35'); blob(19, 9, 6, '#47b845'); blob(12, 16, 5, '#1c6d26');
      }),
      cloud: tex(64, (g, s) => {
        g.clearRect(0, 0, s, s);
        for (let i = 0; i < 8; i++) {
          const x = rnd() * s; const y = rnd() * s; const r = 5 + rnd() * 9;
          for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]) {
            const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
            gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
          }
        }
      }),
      white: tex(4, (g, s) => { g.fillStyle = '#fff'; g.fillRect(0, 0, s, s); }),
    };
    function setFilter() {
      const f = world.linear ? gl.LINEAR : gl.NEAREST;
      for (const t of textures) { gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f); }
    }
    setFilter();

    // Mesh helpers: x y z r g b u v
    const mesh = () => [];
    const vert = (m, p, c, uv) => m.push(p[0], p[1], p[2], c[0], c[1], c[2], uv[0], uv[1]);
    const tri = (m, a, b, c) => { for (const v of [a, b, c]) vert(m, v.p, v.c, v.t); };
    const quad = (m, a, b, c, d) => { tri(m, a, b, c); tri(m, a, c, d); };
    function upload(m) {
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m), gl.STATIC_DRAW);
      return { b, n: m.length / 8 };
    }

    // Island: smooth noise, Gouraud colours by height and slope
    const CX = 0; const CZ = -48; const CH = 12;
    const height = (x, z) => {
      const r = Math.hypot(x, z) / 128;
      const isl = 1 - r * r;
      const roll = (Math.sin(x * 0.045) + Math.sin(z * 0.06 + 1.2) + 0.6 * Math.sin((x + z) * 0.09)) * 3.2 + Math.sin(x * 0.018 + 2) * Math.cos(z * 0.021) * 8;
      const h = roll * Math.max(0, isl) + 15 * isl - 3;
      return mix(CH, h, smooth(20, 40, Math.hypot(x - CX, z - CZ)));
    };
    const grass = (x, z) => {
      const h = height(x, z);
      const e = 1.2;
      const nx = height(x - e, z) - height(x + e, z); const nz = height(x, z - e) - height(x, z + e);
      const l = Math.max(0.55, Math.min(1.25, 0.95 + (nx * 0.32 + nz * 0.34) * 0.5));
      let col;
      if (h < 1.5) col = [0.98, 0.9, 0.58]; else if (h < 3) col = [mix(0.98, 0.42, (h - 1.5) / 1.5), mix(0.9, 0.78, (h - 1.5) / 1.5), mix(0.58, 0.24, (h - 1.5) / 1.5)];
      else col = [0.38 + Math.sin(x * 0.2) * 0.04, 0.78 + Math.sin(z * 0.17) * 0.06, 0.23];
      return { h, c: col.map((v) => v * l) };
    };
    const terrain = mesh();
    {
      const N = 56; const S = 6; const O = -N * S / 2;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const V = (a, b) => { const x = O + a * S; const z = O + b * S; const g = grass(x, z); return { p: [x, g.h, z], c: g.c, t: [x / 18, z / 18] }; };
        quad(terrain, V(i, j + 1), V(i + 1, j + 1), V(i + 1, j), V(i, j));
      }
    }
    // Distant mountains
    const hills = mesh();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * 6.283 + rnd() * 0.2; const R = 300 + rnd() * 50; const x = Math.cos(a) * R; const z = Math.sin(a) * R; const w = 44 + rnd() * 40; const h = 44 + rnd() * 54;
      for (let k = 0; k < 6; k++) {
        const a0 = (k / 6) * 6.283; const a1 = ((k + 1) / 6) * 6.283; const lit = 0.7 + 0.3 * Math.max(0, Math.cos(a0 - 0.6));
        tri(hills, { p: [x + Math.cos(a0) * w, -2, z + Math.sin(a0) * w], c: [0.36 * lit, 0.62 * lit, 0.4 * lit], t: [0, 0] }, { p: [x, h, z], c: [0.72, 0.84, 0.86], t: [0.5, 1] }, { p: [x + Math.cos(a1) * w, -2, z + Math.sin(a1) * w], c: [0.36 * lit, 0.62 * lit, 0.4 * lit], t: [1, 0] });
      }
    }
    // The castle: boxes and cones, cream walls, red roofs
    const walls = mesh(); const roofs = mesh(); const plain = mesh();
    const prism = (m, x, z, r, y0, y1, n, shade = 1) => {
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * 6.283; const a1 = ((k + 1) / n) * 6.283;
        const l0 = (0.62 + 0.42 * Math.max(0, Math.cos(a0 - 1))) * shade; const l1 = (0.62 + 0.42 * Math.max(0, Math.cos(a1 - 1))) * shade;
        const C = (l) => [l, l, l * 0.97];
        const P = (a, y) => [x + Math.cos(a) * r, y, z + Math.sin(a) * r];
        quad(m, { p: P(a0, y0), c: C(l0 * 0.8), t: [k, 0] }, { p: P(a1, y0), c: C(l1 * 0.8), t: [k + 1, 0] }, { p: P(a1, y1), c: C(l1), t: [k + 1, (y1 - y0) / 6] }, { p: P(a0, y1), c: C(l0), t: [k, (y1 - y0) / 6] });
      }
    };
    const cone = (m, x, z, r, y0, y1, n) => {
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * 6.283; const a1 = ((k + 1) / n) * 6.283;
        const l = 0.72 + 0.34 * Math.max(0, Math.cos(a0 - 1));
        tri(m, { p: [x + Math.cos(a0) * r, y0, z + Math.sin(a0) * r], c: [l, l, l], t: [k, 0] }, { p: [x, y1, z], c: [1.15, 1.1, 1.1], t: [k + 0.5, 2] }, { p: [x + Math.cos(a1) * r, y0, z + Math.sin(a1) * r], c: [l, l, l], t: [k + 1, 0] });
      }
    };
    const block = (m, x0, x1, y0, y1, z0, z1) => {
      const c = (l) => [l, l, l * 0.97]; const F = 1; const S = 0.72; const R = 0.86; const T = 1.08;
      const u = (x1 - x0) / 6; const v = (y1 - y0) / 6; const w = (z1 - z0) / 6;
      quad(m, { p: [x0, y0, z1], c: c(F * 0.8), t: [0, 0] }, { p: [x1, y0, z1], c: c(F * 0.8), t: [u, 0] }, { p: [x1, y1, z1], c: c(F), t: [u, v] }, { p: [x0, y1, z1], c: c(F), t: [0, v] });
      quad(m, { p: [x1, y0, z0], c: c(S * 0.8), t: [0, 0] }, { p: [x0, y0, z0], c: c(S * 0.8), t: [u, 0] }, { p: [x0, y1, z0], c: c(S), t: [u, v] }, { p: [x1, y1, z0], c: c(S), t: [0, v] });
      quad(m, { p: [x1, y0, z1], c: c(R * 0.8), t: [0, 0] }, { p: [x1, y0, z0], c: c(R * 0.8), t: [w, 0] }, { p: [x1, y1, z0], c: c(R), t: [w, v] }, { p: [x1, y1, z1], c: c(R), t: [0, v] });
      quad(m, { p: [x0, y0, z0], c: c(S * 0.8), t: [0, 0] }, { p: [x0, y0, z1], c: c(S * 0.8), t: [w, 0] }, { p: [x0, y1, z1], c: c(S), t: [w, v] }, { p: [x0, y1, z0], c: c(S), t: [0, v] });
      quad(m, { p: [x0, y1, z1], c: c(T), t: [0, 0] }, { p: [x1, y1, z1], c: c(T), t: [u, 0] }, { p: [x1, y1, z0], c: c(T), t: [u, w] }, { p: [x0, y1, z0], c: c(T), t: [0, w] });
    };
    block(walls, CX - 16, CX + 16, CH, CH + 15, CZ - 10, CZ + 8);
    block(walls, CX - 7, CX + 7, CH + 15, CH + 27, CZ - 6, CZ + 5);
    block(walls, CX - 4, CX + 4, CH, CH + 4, CZ + 8, CZ + 13);
    for (const [dx, dz, r, h] of [[-17, 8, 4.2, 25], [17, 8, 4.2, 25], [-17, -10, 3.6, 22], [17, -10, 3.6, 22], [0, -1, 4.6, 39]]) {
      prism(walls, CX + dx, CZ + dz, r, CH, CH + h, 8);
      cone(roofs, CX + dx, CZ + dz, r + 1.2, CH + h, CH + h + r * 2.3, 8);
    }
    block(roofs, CX - 16.5, CX + 16.5, CH + 15, CH + 16, CZ - 10.5, CZ + 8.5);
    // Door and a round window
    const flat = (x0, x1, y0, y1, z, c) => quad(plain, { p: [x0, y0, z], c, t: [0, 0] }, { p: [x1, y0, z], c, t: [1, 0] }, { p: [x1, y1, z], c, t: [1, 1] }, { p: [x0, y1, z], c, t: [0, 1] });
    flat(CX - 2.2, CX + 2.2, CH, CH + 3.6, CZ + 13.04, [0.25, 0.14, 0.08]);
    for (let k = 0; k < 10; k++) {
      const a0 = (k / 10) * 6.283; const a1 = ((k + 1) / 10) * 6.283; const r = 2.8; const y = CH + 20; const z = CZ + 5.04;
      tri(plain, { p: [CX, y, z], c: [1, 0.86, 0.3], t: [0, 0] }, { p: [CX + Math.cos(a0) * r, y + Math.sin(a0) * r, z], c: [0.2, 0.45, 0.95], t: [0, 0] }, { p: [CX + Math.cos(a1) * r, y + Math.sin(a1) * r, z], c: [0.95, 0.25, 0.35], t: [0, 0] });
    }
    // Trees: two crossed cards each, the classic early-3D trick
    const trees = mesh();
    {
      let placed = 0; let guard = 0;
      while (placed < 64 && guard++ < 900) {
        const x = (rnd() - 0.5) * 230; const z = (rnd() - 0.5) * 230; const h = height(x, z);
        if (h < 4 || Math.hypot(x - CX, z - CZ) < 34 || (Math.abs(x) < 26 && z > CZ)) continue; // keep the view of the castle clear
        const s = 4 + rnd() * 4; const W = [1, 1, 1];
        quad(trees, { p: [x - s, h - 0.4, z], c: W, t: [0, 1] }, { p: [x + s, h - 0.4, z], c: W, t: [1, 1] }, { p: [x + s, h + s * 2.1, z], c: W, t: [1, 0] }, { p: [x - s, h + s * 2.1, z], c: W, t: [0, 0] });
        quad(trees, { p: [x, h - 0.4, z - s], c: W, t: [0, 1] }, { p: [x, h - 0.4, z + s], c: W, t: [1, 1] }, { p: [x, h + s * 2.1, z + s], c: W, t: [1, 0] }, { p: [x, h + s * 2.1, z - s], c: W, t: [0, 0] });
        placed++;
      }
    }
    const waterM = mesh();
    { const R = 900; const W = [1, 1, 1]; quad(waterM, { p: [-R, 0, R], c: W, t: [-R / 16, R / 16] }, { p: [R, 0, R], c: W, t: [R / 16, R / 16] }, { p: [R, 0, -R], c: W, t: [R / 16, -R / 16] }, { p: [-R, 0, -R], c: W, t: [-R / 16, -R / 16] }); }
    const cloudM = mesh();
    { const R = 900; const Y = 92; const W = [1, 1, 1]; quad(cloudM, { p: [-R, Y, -R], c: W, t: [0, 0] }, { p: [R, Y, -R], c: W, t: [9, 0] }, { p: [R, Y, R], c: W, t: [9, 9] }, { p: [-R, Y, R], c: W, t: [0, 9] }); }
    // Sky: a dome of vertex colours. Pure Gouraud.
    const SKY = [[0, [0.9, 0.96, 1]], [0.07, [0.68, 0.87, 1]], [0.24, [0.34, 0.66, 1]], [0.6, [0.16, 0.42, 0.92]], [1, [0.08, 0.24, 0.74]]];
    const skyM = mesh();
    {
      const ring = 18;
      for (let r = 0; r < SKY.length - 1; r++) for (let k = 0; k < ring; k++) {
        const [e0, c0] = SKY[r]; const [e1, c1] = SKY[r + 1];
        const P = (a, e) => { const y = e * 3.14 / 2; return [Math.cos(a) * Math.cos(y) * 200, Math.sin(y) * 200, Math.sin(a) * Math.cos(y) * 200]; };
        const a0 = (k / ring) * 6.283; const a1 = ((k + 1) / ring) * 6.283;
        quad(skyM, { p: P(a0, e0), c: c0, t: [0, 0] }, { p: P(a1, e0), c: c0, t: [0, 0] }, { p: P(a1, e1), c: c1, t: [0, 0] }, { p: P(a0, e1), c: c1, t: [0, 0] });
      }
      // skirt below the horizon
      for (let k = 0; k < ring; k++) {
        const a0 = (k / ring) * 6.283; const a1 = ((k + 1) / ring) * 6.283; const c = SKY[0][1];
        quad(skyM, { p: [Math.cos(a0) * 200, -60, Math.sin(a0) * 200], c, t: [0, 0] }, { p: [Math.cos(a1) * 200, -60, Math.sin(a1) * 200], c, t: [0, 0] }, { p: [Math.cos(a1) * 200, 0, Math.sin(a1) * 200], c, t: [0, 0] }, { p: [Math.cos(a0) * 200, 0, Math.sin(a0) * 200], c, t: [0, 0] });
      }
    }
    // A spinning star
    const starM = mesh();
    {
      const R = 2.6; const r = 1.15; const D = 0.8; const G = (l) => [1.12 * l, 0.86 * l, 0.22 * l];
      for (const z of [D, -D]) for (let k = 0; k < 10; k++) {
        const a0 = 1.5708 + (k / 10) * 6.283; const a1 = 1.5708 + ((k + 1) / 10) * 6.283;
        const R0 = k % 2 ? r : R; const R1 = k % 2 ? R : r;
        tri(starM, { p: [0, 0, z], c: G(1.25), t: [0, 0] }, { p: [Math.cos(a0) * R0, Math.sin(a0) * R0, 0], c: G(0.72), t: [0, 0] }, { p: [Math.cos(a1) * R1, Math.sin(a1) * R1, 0], c: G(0.72), t: [0, 0] });
      }
    }
    const G = {
      sky: upload(skyM), terrain: upload(terrain), hills: upload(hills), walls: upload(walls), roofs: upload(roofs), plain: upload(plain), trees: upload(trees), water: upload(waterM), cloud: upload(cloudM), star: upload(starM),
    };

    // Matrices
    const mul = (a, b) => { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
    const persp = (fovy, asp, n, f) => { const t = 1 / Math.tan(fovy / 2); return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, (2 * f * n) / (n - f), 0]); };
    const look = (e, c) => {
      const z = norm(sub(e, c)); const x = norm(cross([0, 1, 0], z)); const y = cross(z, x);
      return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1]);
    };
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const trans = (x, y, z, ry = 0) => { const c = Math.cos(ry); const s = Math.sin(ry); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, x, y, z, 1]); };

    // Camera path: scrolling the page flies through these
    const PATH = [
      [[0, 10, 118], [0, 66, -48]], [[58, 21, 88], [-4, 24, -48]], [[74, 30, 14], [-12, 16, -50]], [[28, 40, -92], [0, 22, -48]],
      [[-54, 30, -94], [0, 16, -40]], [[-96, 18, -22], [-20, 8, 22]], [[-72, 11, 64], [4, 8, 30]], [[-18, 20, 124], [0, 40, -48]],
    ];
    const cr = (a, b, c, d, t) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    function along(u, idx) {
      const n = PATH.length - 1; const f = Math.max(0, Math.min(0.9999, u)) * n; const i = Math.floor(f); const t = f - i;
      const P = (k) => PATH[Math.max(0, Math.min(n, k))][idx];
      return [0, 1, 2].map((a) => cr(P(i - 1)[a], P(i)[a], P(i + 1)[a], P(i + 2)[a], t));
    }
    const STARS = [[0, 26, 70], [62, 26, 36], [38, 34, -78], [-46, 28, -76], [-90, 22, 10], [-44, 20, 92]];

    function resize() {
      const asp = Math.min(2.2, Math.max(0.46, innerWidth / innerHeight));
      const h = asp < 1 ? 320 : 240; const w = Math.round(h * asp);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
    }
    resize();
    addEventListener('resize', () => { resize(); dirty = true; });

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enableVertexAttribArray(attr.p); gl.enableVertexAttribArray(attr.c); gl.enableVertexAttribArray(attr.uv);
    function draw(g, texture, vp, o = {}) {
      gl.bindBuffer(gl.ARRAY_BUFFER, g.b);
      gl.vertexAttribPointer(attr.p, 3, gl.FLOAT, false, 32, 0);
      gl.vertexAttribPointer(attr.c, 3, gl.FLOAT, false, 32, 12);
      gl.vertexAttribPointer(attr.uv, 2, gl.FLOAT, false, 32, 24);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniformMatrix4fv(uni.vp, false, vp);
      gl.uniform2f(uni.scroll, o.sx || 0, o.sy || 0);
      gl.uniform4f(uni.ctl, o.cut ?? 0.01, world.gouraud ? 1 : 0, o.alpha ?? 1, o.noFog ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, g.n);
    }

    let scrollU = 0; let current = 0; let time = 0; let last = 0; let dirty = true;
    const readScroll = () => { if (isCalm()) return; const max = root.scrollHeight - innerHeight; scrollU = max > 0 ? scrollY / max : 0; dirty = true; };
    addEventListener('scroll', readScroll, { passive: true });
    readScroll();
    current = scrollU;

    function frame(now) {
      requestAnimationFrame(frame);
      const calm = isCalm();
      if (document.hidden || (calm && !dirty)) return;
      if (!calm && now - last < 41) return; // about 24 frames a second, like the games
      time += calm ? 0 : (now - last) / 1000;
      last = now; dirty = false;
      current += (scrollU - current) * (calm ? 1 : 0.12);
      const e = along(current, 0); const c = along(current, 1);
      const eye = [e[0] + Math.sin(time * 0.31) * 2.2, e[1] + Math.sin(time * 0.47) * 0.9, e[2] + Math.cos(time * 0.27) * 2.2];
      const target = [c[0] + Math.sin(time * 0.19) * 1.5, c[1], c[2]];
      const proj = persp(1.02, canvas.width / canvas.height, 1, 900);
      const view = look(eye, target);
      const vp = mul(proj, view);
      const sun = world.sunset;
      const fogC = [mix(0.9, 1, sun), mix(0.96, 0.68, sun), mix(1, 0.5, sun)];
      gl.uniform3f(uni.fogC, fogC[0], fogC[1], fogC[2]);
      gl.uniform4f(uni.fogR, 60, 330, world.fog ? 1 : 0, 0);
      gl.uniform3f(uni.tint, mix(1, 1.12, sun), mix(1, 0.74, sun), mix(1, 0.62, sun));
      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
      // Sky follows the camera, draws behind everything
      gl.depthMask(false); gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      draw(G.sky, TX.white, mul(vp, trans(eye[0], eye[1], eye[2])), { noFog: true });
      gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
      draw(G.hills, TX.white, vp);
      gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); gl.frontFace(gl.CCW);
      draw(G.terrain, TX.detail, vp);
      draw(G.walls, TX.stone, vp);
      draw(G.roofs, TX.roof, vp);
      draw(G.plain, TX.white, vp);
      gl.disable(gl.CULL_FACE);
      draw(G.trees, TX.tree, vp, { cut: 0.42 });
      for (let i = 0; i < STARS.length; i++) {
        const s = STARS[i];
        draw(G.star, TX.white, mul(vp, trans(s[0], s[1] + Math.sin(time * 1.3 + i) * 0.9, s[2], time * 1.6 + i)));
      }
      gl.enable(gl.BLEND);
      gl.depthMask(false);
      draw(G.water, TX.water, vp, { alpha: 0.82, sx: time * 0.014, sy: time * 0.007 });
      gl.uniform4f(uni.fogR, 180, 900, world.fog ? 1 : 0, 0);
      draw(G.cloud, TX.cloud, vp, { alpha: 0.78, sx: time * 0.003, sy: time * 0.0012 });
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
    requestAnimationFrame(frame);
    addEventListener('eas:calm', () => { readScroll(); dirty = true; });
    world.refresh = () => { dirty = true; };
    world.setFilter = setFilter;
  }

  // ---- The title: real 3D letters you can pull, like the face on Super Mario 64's title screen ------
  const title = $('.hero-title');
  const text = title.textContent.trim();
  title.setAttribute('aria-label', text);
  const LAYERS = 12;
  title.innerHTML = `<span class="n64-word" aria-hidden="true">${[...text].map((ch, i) => `<span class="n64-ch n64-ch-${i % 3}" data-i="${i}">${Array.from({ length: LAYERS }, (_, k) => `<i style="--z:${k}">${ch}</i>`).join('')}<b>${ch}</b></span>`).join('')}</span>`;
  const word = $('.n64-word', title);
  const chars = $$('.n64-ch', title);
  let mx = 0; let my = 0; let wob = 0;
  addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  const stretch = chars.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, held: false }));
  const paintCh = (el, s) => {
    el.style.setProperty('--sx', `${s.x.toFixed(1)}px`);
    el.style.setProperty('--sy', `${s.y.toFixed(1)}px`);
    const m = Math.hypot(s.x, s.y);
    el.style.setProperty('--ss', (1 + Math.min(m, 170) / 300).toFixed(3));
    el.style.setProperty('--sa', `${(s.x * 0.04).toFixed(2)}deg`);
  };
  chars.forEach((el, i) => {
    const s = stretch[i];
    el.addEventListener('pointerdown', (e) => {
      s.held = { x: e.clientX - s.x, y: e.clientY - s.y };
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    el.addEventListener('pointermove', (e) => { if (s.held) { s.x = e.clientX - s.held.x; s.y = e.clientY - s.held.y; paintCh(el, s); } });
    const end = () => { s.held = false; };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerenter', () => { if (!s.held && !isCalm()) { s.vy -= 7; s.vx += (i % 2 ? 4 : -4); } });
  });
  function titleLoop(t) {
    requestAnimationFrame(titleLoop);
    if (isCalm()) { word.style.transform = 'none'; return; }
    wob = t / 1000;
    word.style.transform = `rotateX(${(-my * 26 + Math.sin(wob * 0.8) * 5).toFixed(2)}deg) rotateY(${(mx * 40 + Math.sin(wob * 0.55) * 11).toFixed(2)}deg)`;
    stretch.forEach((s, i) => {
      if (s.held) return;
      if (Math.abs(s.x) + Math.abs(s.y) + Math.abs(s.vx) + Math.abs(s.vy) < 0.05) return;
      s.vx += -s.x * 0.09; s.vy += -s.y * 0.09; s.vx *= 0.83; s.vy *= 0.83; s.x += s.vx; s.y += s.vy;
      paintCh(chars[i], s);
    });
  }
  requestAnimationFrame(titleLoop);

  // ---- Painting ripple: a grid of tiles pushed by a radial wave, lit by its slope -----------------
  const rip = { canvas: document.createElement('canvas'), active: null };
  rip.canvas.className = 'n64-ripple';
  rip.canvas.setAttribute('aria-hidden', 'true');
  const rg = rip.canvas.getContext('2d');
  let ripT = 0;
  function startRipple(link, x, y) {
    const img = $('img', link);
    if (!img || !img.complete || !img.naturalWidth || isCalm()) return;
    const r = link.getBoundingClientRect();
    const W = Math.min(link.clientWidth, 760); const H = Math.round(W * (link.clientHeight / link.clientWidth));
    rip.canvas.width = W; rip.canvas.height = H;
    rip.active = { link, img, W, H, ox: ((x - r.left) / r.width) * W, oy: ((y - r.top) / r.height) * H, amp: Math.max(W, H) * 0.04, t: 0 };
    link.append(rip.canvas);
    cancelAnimationFrame(ripT);
    ripT = requestAnimationFrame(rippleFrame);
  }
  function rippleFrame() {
    const a = rip.active;
    if (!a) return;
    a.t += 1 / 30;
    a.amp *= a.hold ? 0.998 : 0.967;
    const { W, H, img } = a;
    // Source rectangle for object-fit: cover (or contain)
    const iw = img.naturalWidth; const ih = img.naturalHeight;
    const contain = a.link.closest('.is-contain');
    const k = contain ? Math.max(iw / W, ih / H) : Math.min(iw / W, ih / H);
    const sw = W * k; const sh = H * k; const sx0 = (iw - sw) / 2; const sy0 = (ih - sh) / 2;
    const cols = 44; const rows = Math.round(cols * (H / W)); const cw = W / cols; const ch = H / rows;
    rg.drawImage(img, sx0, sy0, sw, sh, 0, 0, W, H); // the flat picture underneath hides any cracks between tiles
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const cx = (i + 0.5) * cw; const cy = (j + 0.5) * ch;
      const dx = cx - a.ox; const dy = cy - a.oy; const d = Math.hypot(dx, dy) || 1;
      const phase = d * 0.085 - a.t * 8;
      const falloff = Math.exp(-d / (Math.max(W, H) * 0.55));
      const w = Math.sin(phase) * a.amp * falloff;
      const ox = (dx / d) * w; const oy = (dy / d) * w;
      rg.drawImage(img, sx0 + (i - 0.1) * cw * k, sy0 + (j - 0.1) * ch * k, cw * 1.2 * k, ch * 1.2 * k, (i - 0.1) * cw + ox, (j - 0.1) * ch + oy, cw * 1.2, ch * 1.2);
      const slope = Math.cos(phase) * falloff * (a.amp / (Math.max(W, H) * 0.04));
      if (slope > 0.05) { rg.fillStyle = `rgba(255,255,255,${(slope * 0.26).toFixed(3)})`; rg.fillRect(i * cw + ox, j * ch + oy, cw, ch); } else if (slope < -0.05) { rg.fillStyle = `rgba(0,0,40,${(-slope * 0.24).toFixed(3)})`; rg.fillRect(i * cw + ox, j * ch + oy, cw, ch); }
    }
    if (a.amp < 0.25) { rip.canvas.remove(); rip.active = null; return; }
    ripT = requestAnimationFrame(rippleFrame);
  }
  function wirePainting(link) {
    link.addEventListener('pointerenter', (e) => startRipple(link, e.clientX, e.clientY));
    link.addEventListener('pointermove', (e) => {
      const a = rip.active;
      if (a && a.link === link && a.amp < Math.max(a.W, a.H) * 0.02) { const r = link.getBoundingClientRect(); a.ox = ((e.clientX - r.left) / r.width) * a.W; a.oy = ((e.clientY - r.top) / r.height) * a.H; a.amp = Math.max(a.W, a.H) * 0.03; }
    });
  }
  $$('.shot-link').forEach(wirePainting);

  // ---- Course select: the contents are six small paintings ----------------------------------------
  const toc = $('.toc');
  const thumbs = $$('.hero-gallery img, .ref-gallery img').map((i) => i.getAttribute('src'));
  const pick = [0, 4, 6, 8, 10, 2];
  $$('a', toc).forEach((a, i) => {
    const label = a.textContent;
    a.innerHTML = `<span class="n64-mini"><img src="${thumbs[pick[i]] || thumbs[0]}" alt="" loading="lazy" decoding="async"></span><span class="n64-mini-t">${label.split(': ').pop()}</span><span class="n64-mini-s" data-star="${i}" aria-hidden="true"></span>`;
    wirePainting(a.querySelector('.n64-mini'));
  });
  const head = document.createElement('p');
  head.className = 'n64-select';
  head.textContent = 'Select a course';
  toc.prepend(head);

  // ---- Stars: one per section, collected by reading it ----------------------------------------------
  const SECTIONS = ['feel', 'core', 'how', 'palette', 'vibe', 'refs'];
  let got;
  try { got = new Set(JSON.parse(read('eas-n64-stars') || '[]')); } catch { got = new Set(); }
  const atlas = $('.atlas');
  const hud = document.createElement('span');
  hud.className = 'n64-hud';
  hud.title = 'One star for each section you read';
  hud.innerHTML = '<i class="n64-star"></i><span>&times;</span><b>0</b>';
  $('.atlas-here', atlas)?.after(hud);
  const pop = document.createElement('div');
  pop.className = 'n64-pop';
  pop.setAttribute('role', 'status');
  pop.innerHTML = '<i class="n64-star n64-star-big"></i><span></span>';
  document.body.append(pop);
  let popT;
  function paintStars() {
    $('b', hud).textContent = String(got.size);
    SECTIONS.forEach((id, i) => {
      const on = got.has(id);
      $(`[data-star="${i}"]`, toc)?.classList.toggle('on', on);
      $(`#${id} .sec-title`)?.classList.toggle('has-star', on);
    });
    if (got.size === SECTIONS.length && !world.sunset) { world.sunset = 1; world.refresh?.(); root.classList.add('n64-allstars'); }
  }
  function collect(id) {
    if (got.has(id)) return;
    got.add(id);
    write('eas-n64-stars', JSON.stringify([...got]));
    paintStars();
    hud.classList.remove('bump'); void hud.offsetWidth; hud.classList.add('bump');
    if (!isCalm()) {
      $('span', pop).textContent = got.size === SECTIONS.length ? 'All six stars! The sun goes down over the island.' : 'You got a star!';
      pop.classList.add('on');
      clearTimeout(popT);
      popT = setTimeout(() => pop.classList.remove('on'), got.size === SECTIONS.length ? 3200 : 1500);
    }
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { const id = e.target.id; setTimeout(() => { if (Math.abs(e.target.getBoundingClientRect().top) < innerHeight) collect(id); }, 500); } });
    }, { rootMargin: '-35% 0px -35% 0px' });
    SECTIONS.forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }
  paintStars();

  // ---- Jump into a painting: a star-shaped iris closes, the scene changes, the iris opens ---------------
  const iris = document.createElement('div');
  iris.className = 'n64-iris';
  iris.setAttribute('aria-hidden', 'true');
  document.body.append(iris);
  const starPath = (cx, cy, R) => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2; const r = i % 2 ? R * 0.46 : R;
      d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
    }
    return `${d}Z`;
  };
  function irisTo(from, to, cx, cy, ms, done) {
    const w = innerWidth; const h = innerHeight; const t0 = performance.now();
    iris.style.display = 'block';
    const step = (t) => {
      const u = Math.min(1, (t - t0) / ms);
      const R = from + (to - from) * u;
      iris.style.clipPath = `path(evenodd, "M0 0H${w}V${h}H0Z${starPath(cx, cy, R)}")`;
      if (u < 1) requestAnimationFrame(step); else done?.();
    };
    requestAnimationFrame(step);
  }
  $$('a', toc).forEach((a) => a.addEventListener('click', (e) => {
    const target = $(a.getAttribute('href'));
    if (!target || isCalm() || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    const r = a.getBoundingClientRect();
    const cx = r.left + r.width / 2; const cy = r.top + r.height / 2;
    const big = Math.hypot(innerWidth, innerHeight) * 1.25;
    irisTo(big, 0, cx, cy, 420, () => {
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
      history.replaceState(null, '', a.getAttribute('href'));
      setTimeout(() => irisTo(0, big, innerWidth / 2, innerHeight / 2, 520, () => { iris.style.display = 'none'; }), 120);
    });
  }));

  // ---- The palette as the console would have used it: colours at the vertices, blended across triangles ----
  const swatches = $('.swatches');
  if (swatches) {
    const cols = JSON.parse($('#palette-data').textContent).colors.map((c) => [1, 3, 5].map((i) => parseInt(c.hex.slice(i, i + 2), 16)));
    const c = document.createElement('canvas');
    c.className = 'n64-gouraud';
    c.setAttribute('aria-hidden', 'true');
    const W = 160; const H = 24; c.width = W; c.height = H;
    const g = c.getContext('2d'); const img = g.createImageData(W, H);
    const n = cols.length - 1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const v = y / (H - 1); const f = (x / (W - 1)) * n; const i = Math.min(n - 1, Math.floor(f)); const t = f - i;
      // Top edge runs along the palette, the bottom edge is one colour behind: a strip of triangles
      const A = cols[i]; const B = cols[i + 1]; const C = cols[Math.max(0, i - 1)];
      for (let k = 0; k < 3; k++) {
        const top = A[k] + (B[k] - A[k]) * t; const bot = C[k] + (A[k] - C[k]) * t;
        img.data[(y * W + x) * 4 + k] = top + (bot - top) * v;
      }
      img.data[(y * W + x) * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    swatches.before(c);
  }

  // ---- Console settings: flip the features that made the N64 look like an N64, on the world behind the page -----
  if (gl) {
    const set = document.createElement('div');
    set.className = 'n64-settings';
    set.setAttribute('role', 'group');
    set.setAttribute('aria-label', 'Rendering features of the world behind this page');
    set.innerHTML = '<span>Try it on the world behind this page:</span>';
    for (const [key, label] of [['linear', 'Bilinear filter'], ['fog', 'Horizon fog'], ['gouraud', 'Vertex colour']]) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = label;
      const sync = () => b.setAttribute('aria-pressed', String(world[key]));
      sync();
      b.addEventListener('click', () => {
        world[key] = !world[key];
        if (key === 'linear') world.setFilter();
        sync(); world.refresh?.();
      });
      set.append(b);
    }
    const core = $('#core .core-list');
    core?.parentNode.insertBefore(set, core);
  }
})();
