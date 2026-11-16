// Steampunk: draws the sheet furniture (zone markers, a dimension line on the title, an airship elevation, a title block),
// builds a gear train whose teeth really mesh and turn with the scroll or a hand crank, and a gauge that reads
// steam pressure from scroll speed and depth in fathoms from scroll position.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const NS = 'http://www.w3.org/2000/svg';
  const page = $('.page');
  const hero = $('.hero');
  if (!page || !hero) return;

  // ---------- Sheet furniture ----------
  const zones = (cls, labels) => {
    const el = document.createElement('div');
    el.className = `sp-zones ${cls}`;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = labels.map((l) => `<span>${l}</span>`).join('');
    page.append(el);
    return el;
  };
  const nums = ['8', '7', '6', '5', '4', '3', '2', '1'];
  zones('top', nums);
  zones('bottom', nums);
  const left = zones('left', []);
  const right = zones('right', []);
  const sideZones = () => {
    const n = Math.max(4, Math.min(26, Math.round(page.offsetHeight / 760)));
    const html = Array.from({ length: n }, (_, i) => `<span>${String.fromCharCode(65 + i)}</span>`).join('');
    left.innerHTML = html;
    right.innerHTML = html;
  };

  // A dimension line that measures the title as drawn
  const title = $('.hero-title');
  const dim = document.createElement('div');
  dim.className = 'sp-dim';
  dim.setAttribute('aria-hidden', 'true');
  dim.innerHTML = '<i></i><b></b>';
  title.before(dim);
  const measure = () => {
    const w = title.getBoundingClientRect().width;
    dim.style.width = `${w}px`;
    $('b', dim).textContent = `${Math.round(w)} px`;
  };

  // Airship elevation drawn behind the title, about 6:1
  const airship = () => {
    const cx = 420; const cy = 120; const rx = 300; const ry = 52;
    const half = (x) => ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));
    let ribs = '';
    for (let x = cx - rx + 30; x < cx + rx - 10; x += 30) {
      const h = half(x);
      ribs += `M${x} ${(cy - h).toFixed(1)}V${(cy + h).toFixed(1)}`;
    }
    let lines = '';
    for (const k of [0.45, 0.8]) lines += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${(ry * k).toFixed(1)}" stroke-dasharray="6 5"/>`;
    const gx = 360; const gy = 196;
    return `<svg class="sp-airship" viewBox="60 20 760 290" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">
      <path d="M70 ${cy}H800" stroke-dasharray="26 6 4 6" stroke-width=".9"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" stroke-width="2"/>
      <path d="${ribs}" stroke-width=".8"/>
      ${lines}
      <path d="M150 ${cy - 30}L104 ${cy - 74}H140L196 ${cy - 44}M150 ${cy + 30}L104 ${cy + 74}H140L196 ${cy + 44}" stroke-width="1.6"/>
      <path d="M118 ${cy - 10}v20M110 ${cy - 26}l16 52M110 ${cy + 26}l16-52" stroke-width="1.4"/>
      <path d="M${gx} ${gy}h120a10 10 0 0 1-10 22h-100a10 10 0 0 1-10-22z" stroke-width="1.6"/>
      <path d="M${gx + 20} ${gy + 6}h80M${gx + 30} ${gy}v18M${gx + 50} ${gy}v18M${gx + 70} ${gy}v18M${gx + 90} ${gy}v18" stroke-width=".8"/>
      <path d="M${gx + 4} ${gy}L${gx - 40} ${cy + half(gx - 40) - 1}M${gx + 30} ${gy}L${gx + 10} ${cy + half(gx + 10) - 1}M${gx + 90} ${gy}L${gx + 110} ${cy + half(gx + 110) - 1}M${gx + 116} ${gy}L${gx + 160} ${cy + half(gx + 160) - 1}" stroke-width=".8"/>
      <path d="M${cx - rx} 268H${cx + rx}M${cx - rx} 258v20M${cx + rx} 258v20M${cx - rx} 268l12-4v8zM${cx + rx} 268l-12-4v8z" stroke-width="1"/>
      <path d="M${cx + rx + 20} ${cy - ry}V${cy + ry}M${cx + rx + 12} ${cy - ry}h16M${cx + rx + 12} ${cy + ry}h16" stroke-width="1"/>
      <g fill="currentColor" stroke="none" font-family="Architects Daughter, cursive" font-size="15">
        <text x="${cx - 40}" y="290">L = 6 D</text>
        <text x="${cx + rx + 30}" y="${cy + 5}">D</text>
        <text x="${gx + 150}" y="${gy + 40}">gondola, riveted brass</text>
        <text x="${cx + 80}" y="${cy - ry - 14}">envelope: oiled silk on 21 ribs</text>
      </g>
      <path d="M${gx + 146} ${gy + 34}L${gx + 120} ${gy + 14}M${cx + 76} ${cy - ry - 18}L${cx + 40} ${cy - ry + 4}" stroke-width=".9"/>
    </svg>`;
  };
  hero.insertAdjacentHTML('afterbegin', airship());

  // Title block in the foot, where an engineering drawing keeps it
  const foot = $('.foot');
  if (foot) {
    const sections = $$('main .sec').length;
    const id = String(document.body.dataset.id || '').padStart(3, '0');
    const tb = document.createElement('div');
    tb.className = 'sp-tb';
    tb.innerHTML = `<div class="wide"><small>Title</small>${esc($('.hero-title').textContent)} / ${esc(($('.hero-sub') || {}).textContent || '')}</div>
      <div><small>Dwg. no.</small>${id}</div><div><small>Scale</small>1 : 1</div><div><small>Sheets</small>${sections}</div>
      <div><small>Material</small>Brass, copper</div><div><small>Finish</small>Patina</div><div><small>Drawn by</small>Explore Art Styles</div>`;
    $('p', foot).after(tb);
  }

  // Spec gauges answer a tap on touch screens too
  $$('.spec').forEach((s) => s.addEventListener('click', () => s.classList.toggle('is-tapped')));

  // ---------- Gears ----------
  const P = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
  const f = (n) => n.toFixed(2);
  const circle = (r, cx = 0, cy = 0) => `M${f(cx + r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)}Z`;
  // A spur gear: N teeth on module m, tooth centres at angles k * 360/N, with lightening holes and a bore
  const gearPath = (N, m) => {
    const rp = (m * N) / 2;
    const ra = rp + m;
    const rr = rp - 1.25 * m;
    const T = (2 * Math.PI) / N;
    let d = '';
    for (let i = 0; i < N; i += 1) {
      const a = i * T;
      const pts = [[rr, a - 0.5 * T], [rr, a - 0.27 * T], [ra, a - 0.13 * T], [ra, a + 0.13 * T], [rr, a + 0.27 * T]];
      pts.forEach(([r, ang], k) => {
        const [x, y] = P(r, ang);
        if (i === 0 && k === 0) d += `M${f(x)} ${f(y)}`;
        else if (k === 1 || k === 3) d += `A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y)}`;
        else d += `L${f(x)} ${f(y)}`;
      });
    }
    const [x0, y0] = P(rr, -0.5 * T);
    d += `A${f(rr)} ${f(rr)} 0 0 1 ${f(x0)} ${f(y0)}Z`;
    d += circle(Math.max(3, rp * 0.13));
    if (rp > 34) {
      const k = N > 24 ? 6 : 5;
      for (let i = 0; i < k; i += 1) {
        const [hx, hy] = P(rp * 0.52, (i * 2 * Math.PI) / k);
        d += circle(rp * 0.2, hx, hy);
      }
    } else if (rp > 18) {
      for (let i = 0; i < 4; i += 1) {
        const [hx, hy] = P(rp * 0.5, (i * Math.PI) / 2 + Math.PI / 4);
        d += circle(rp * 0.13, hx, hy);
      }
    }
    return { d, rp, ra };
  };

  // Lay out a train: each gear names its parent and the direction (degrees) from parent to child.
  // Ratios and phases follow from tooth counts, so neighbours keep meshing at every angle.
  const layout = (specs, m) => {
    const out = [];
    specs.forEach((s, i) => {
      const g = { ...s, i, rp: (m * s.n) / 2, T: 360 / s.n };
      if (s.parent == null) {
        g.x = s.x || 0; g.y = s.y || 0; g.ratio = 1; g.c = s.phase || 0;
      } else {
        const p = out[s.parent];
        const phi = s.dir;
        const rad = (phi * Math.PI) / 180;
        const dist = p.rp + g.rp;
        g.x = p.x + dist * Math.cos(rad);
        g.y = p.y + dist * Math.sin(rad);
        const k = p.n / s.n;
        g.ratio = -k * p.ratio;
        g.c = -k * p.c + phi + 180 + g.T / 2 + k * phi;
      }
      out.push(g);
    });
    return out;
  };
  const material = { brass: 'url(#sp-brass)', copper: 'url(#sp-copper)', iron: 'url(#sp-iron)' };
  const defs = `<defs>
    <radialGradient id="sp-brass" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#fbe0a6"/><stop offset=".45" stop-color="#e0ad66"/><stop offset=".8" stop-color="#b47a37"/><stop offset="1" stop-color="#7a4c1d"/></radialGradient>
    <radialGradient id="sp-copper" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#f6b892"/><stop offset=".5" stop-color="#c96c46"/><stop offset="1" stop-color="#6c2f17"/></radialGradient>
    <radialGradient id="sp-iron" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#9aa6ad"/><stop offset=".55" stop-color="#5d6a71"/><stop offset="1" stop-color="#2a3338"/></radialGradient>
  </defs>`;
  const drawTrain = (svg, gears, m, opts = {}) => {
    const nodes = gears.map((g) => {
      const { d } = gearPath(g.n, m);
      const fill = material[g.mat || 'brass'];
      const hub = Math.max(5, g.rp * 0.26);
      const crank = g.crank ? `<path d="M0 0L${f(g.rp * 0.78)} 0" stroke="#3b2409" stroke-width="${f(hub * 0.9)}" stroke-linecap="round"/><path d="M0 0L${f(g.rp * 0.78)} 0" stroke="url(#sp-brass)" stroke-width="${f(hub * 0.55)}" stroke-linecap="round"/><circle cx="${f(g.rp * 0.78)}" cy="0" r="${f(hub * 0.75)}" fill="#5b2e14" stroke="#2b1405" stroke-width="1.5"/><circle cx="${f(g.rp * 0.78 - hub * 0.2)}" cy="${f(-hub * 0.25)}" r="${f(hub * 0.22)}" fill="#a2603a"/>` : '';
      return `<g transform="translate(${f(g.x)} ${f(g.y)})"><g class="sp-rot" data-i="${g.i}">
        <path d="${d}" fill="${fill}" fill-rule="evenodd" stroke="#3a2208" stroke-width="1.3"/>
        <circle r="${f(hub)}" fill="none" stroke="#3a2208" stroke-width="1.2" opacity=".7"/>
        <path d="M${f(-hub * 0.45)} 0H${f(hub * 0.45)}" stroke="#3a2208" stroke-width="2" opacity=".55"/>
        ${crank}
      </g></g>`;
    }).join('');
    svg.innerHTML = defs + `<g class="${opts.shadow ? 'sp-gear-shadow' : ''}">${nodes}</g>`;
    const rots = $$('.sp-rot', svg);
    return (theta) => {
      rots.forEach((el, i) => {
        const g = gears[i];
        el.setAttribute('transform', `rotate(${((g.ratio * theta + g.c) % 360).toFixed(3)})`);
      });
    };
  };
  const fitBox = (gears, m, pad = 6) => {
    let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
    gears.forEach((g) => {
      const r = g.rp + m + pad;
      x0 = Math.min(x0, g.x - r); y0 = Math.min(y0, g.y - r); x1 = Math.max(x1, g.x + r); y1 = Math.max(y1, g.y + r);
    });
    return `${f(x0)} ${f(y0)} ${f(x1 - x0)} ${f(y1 - y0)}`;
  };

  // The hero cluster: a cranked brass driver, a copper idler and smaller wheels
  const M1 = 7;
  const cluster = layout([
    { n: 26, x: 0, y: 0, crank: true },
    { n: 12, parent: 0, dir: -28, mat: 'copper' },
    { n: 18, parent: 1, dir: -100, mat: 'iron' },
    { n: 20, parent: 0, dir: 128, mat: 'brass' },
    { n: 10, parent: 3, dir: 200, mat: 'copper' },
    { n: 15, parent: 0, dir: 62, mat: 'iron' },
  ], M1);
  const clusterEl = document.createElement('div');
  clusterEl.className = 'sp-cluster';
  clusterEl.setAttribute('aria-hidden', 'true');
  clusterEl.innerHTML = '<svg></svg><span class="sp-cluster-note">turn the crank</span>';
  hero.append(clusterEl);
  const csvg = $('svg', clusterEl);
  csvg.setAttribute('viewBox', fitBox(cluster, M1));
  csvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const turnCluster = drawTrain(csvg, cluster, M1, { shadow: true });

  // The margin train on wide screens: a zigzag chain down the right edge
  const trainEl = document.createElement('div');
  trainEl.className = 'sp-train';
  trainEl.setAttribute('aria-hidden', 'true');
  trainEl.innerHTML = '<svg></svg>';
  document.body.append(trainEl);
  const tsvg = $('svg', trainEl);
  const M2 = 5;
  let turnTrain = () => {};
  const buildTrain = () => {
    const h = (innerHeight * 170) / Math.max(60, trainEl.clientWidth || 170);
    const counts = [16, 10, 24, 12, 20, 9, 28, 14, 18, 11, 22, 13];
    const mats = ['brass', 'iron', 'copper', 'brass', 'iron', 'brass', 'copper', 'iron'];
    const specs = [{ n: counts[0], x: 120, y: 30, mat: 'brass' }];
    let i = 1;
    let y = 30;
    while (y < h + 80 && i < 40) {
      const n = counts[i % counts.length];
      const dir = i % 2 ? 108 : 72;
      specs.push({ n, parent: i - 1, dir, mat: mats[i % mats.length] });
      const p = specs[i - 1];
      y += ((M2 * (p.n + n)) / 2) * Math.sin((dir * Math.PI) / 180);
      i += 1;
    }
    const gears = layout(specs, M2);
    tsvg.setAttribute('viewBox', `0 0 170 ${h.toFixed(0)}`);
    tsvg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
    turnTrain = drawTrain(tsvg, gears, M2, { shadow: true });
  };

  // ---------- The gauge: pressure from scroll speed, depth from scroll position ----------
  const gauge = document.createElement('div');
  gauge.className = 'sp-gauge';
  gauge.setAttribute('aria-hidden', 'true');
  const ticks = [];
  for (let v = 0; v <= 200; v += 10) {
    const a = ((-225 + (v / 200) * 270) * Math.PI) / 180;
    const major = v % 40 === 0;
    const [x1, y1] = P(major ? 41 : 45, a);
    const [x2, y2] = P(50, a);
    ticks.push(`<path d="M${f(70 + x1)} ${f(70 + y1)}L${f(70 + x2)} ${f(70 + y2)}" stroke-width="${major ? 2 : 1}"/>`);
    if (major && v > 0 && v < 200) {
      const [tx, ty] = P(33, a);
      ticks.push(`<text x="${f(70 + tx)}" y="${f(70 + ty + 3.5)}" text-anchor="middle" stroke="none" fill="#1d140a" font-size="9.5">${v}</text>`);
    }
  }
  const red = (() => {
    const a0 = ((-225 + (160 / 200) * 270) * Math.PI) / 180;
    const a1 = ((-225 + 270) * Math.PI) / 180;
    const [x0, y0] = P(47.5, a0);
    const [x1, y1] = P(47.5, a1);
    return `<path d="M${f(70 + x0)} ${f(70 + y0)}A47.5 47.5 0 0 1 ${f(70 + x1)} ${f(70 + y1)}" stroke="#a3231b" stroke-width="5" fill="none"/>`;
  })();
  const digits = 5;
  let odo = '';
  for (let i = 0; i < digits; i += 1) {
    const x = 70 - (digits * 10) / 2 + i * 10;
    let strip = '';
    for (let k = 0; k <= 10; k += 1) strip += `<text x="${x + 5}" y="${100 + k * 13}" text-anchor="middle">${k % 10}</text>`;
    odo += `<clipPath id="sp-od${i}"><rect x="${x}" y="89" width="9" height="14"/></clipPath><rect x="${x}" y="89" width="9" height="14" fill="url(#sp-drum)"/><g clip-path="url(#sp-od${i})"><g class="sp-drum" data-i="${i}">${strip}</g></g>`;
  }
  gauge.innerHTML = `<div class="sp-steam"><i></i><i></i><i></i></div>
  <svg viewBox="0 -8 140 150" font-family="Besley, Georgia, serif">
    <defs>
      <radialGradient id="sp-bezel" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#fbe0a6"/><stop offset=".5" stop-color="#d9a35f"/><stop offset="1" stop-color="#6e4318"/></radialGradient>
      <radialGradient id="sp-face" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#fbfaf2"/><stop offset=".85" stop-color="#e8e4d2"/><stop offset="1" stop-color="#bfb8a0"/></radialGradient>
      <linearGradient id="sp-drum" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bdb69f"/><stop offset=".4" stop-color="#f5f2e4"/><stop offset=".6" stop-color="#f5f2e4"/><stop offset="1" stop-color="#a8a18a"/></linearGradient>
    </defs>
    <rect x="62" y="-8" width="16" height="12" rx="2" fill="url(#sp-bezel)" stroke="#4a2c0c"/>
    <circle cx="70" cy="70" r="66" fill="url(#sp-bezel)" stroke="#4a2c0c" stroke-width="1.5"/>
    <circle cx="70" cy="70" r="57" fill="url(#sp-face)" stroke="#4a2c0c" stroke-width="1.5"/>
    ${[0, 1, 2, 3, 4, 5].map((k) => { const [x, y] = P(61.5, (k * Math.PI) / 3 + Math.PI / 6); return `<circle cx="${f(70 + x)}" cy="${f(70 + y)}" r="2.2" fill="#7a4c1d" stroke="#fbe0a6" stroke-width=".6"/>`; }).join('')}
    ${red}
    <g stroke="#1d140a">${ticks.join('')}</g>
    <text x="70" y="56" text-anchor="middle" font-size="7.5" letter-spacing="1" fill="#3b2a18">LBS STEAM</text>
    <rect x="${70 - digits * 5 - 2}" y="87" width="${digits * 10 + 3}" height="18" rx="1.5" fill="#1a120a" stroke="#7a4c1d"/>
    <g font-size="11" font-weight="700" fill="#1b1308">${odo}</g>
    <text x="70" y="117" text-anchor="middle" font-size="7" letter-spacing="1.2" fill="#3b2a18">FATHOMS</text>
    <g class="sp-needle" style="transform-origin: 70px 70px">
      <path d="M68.6 78 L70 22 L71.4 78 Z" fill="#9c1f16"/>
      <path d="M68 70 L70 88 L72 70 Z" fill="#1d140a"/>
    </g>
    <circle cx="70" cy="70" r="5.5" fill="url(#sp-bezel)" stroke="#4a2c0c"/>
  </svg>`;
  hero.append(gauge);
  const needle = $('.sp-needle', gauge);
  const drums = $$('.sp-drum', gauge);
  const setNeedle = (psi) => { needle.style.transform = `rotate(${(-135 + (Math.min(200, psi) / 200) * 270).toFixed(2)}deg)`; };
  const setDepth = (fathoms) => {
    const s = String(Math.max(0, Math.floor(fathoms))).padStart(digits, '0').slice(-digits);
    drums.forEach((dr, i) => { dr.style.transform = `translateY(${-Number(s[i]) * 13}px)`; });
  };
  setNeedle(0);

  // ---------- Motion ----------
  let crank = 0;
  let crankVel = 0;
  let lastY = scrollY;
  let lastT = performance.now();
  let pressure = 0;
  let hot = 0;
  let raf = 0;
  const theta = () => scrollY * 0.24 + crank;
  const frame = (now) => {
    raf = 0;
    const dt = Math.max(1, now - lastT);
    const dy = Math.abs(scrollY - lastY);
    lastY = scrollY;
    lastT = now;
    const target = Math.min(220, (dy / dt) * 95 + Math.abs(crankVel) * 9);
    pressure += (target - pressure) * (target > pressure ? 0.35 : 0.05);
    crankVel *= 0.85;
    if (calm()) pressure = 0;
    setNeedle(pressure);
    setDepth(scrollY / 9);
    hot = pressure > 160 ? Math.min(hot + dt, 2000) : Math.max(0, hot - dt);
    gauge.classList.toggle('is-venting', hot > 160 && !calm());
    const t = calm() ? 0 : theta();
    turnCluster(t);
    turnTrain(t * 1.6);
    if (pressure > 0.5 || hot > 0) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('scroll', kick, { passive: true });

  // Hand crank: drag around the driver's axle
  let dragging = null;
  const axle = () => {
    const box = csvg.getBoundingClientRect();
    const vb = csvg.viewBox.baseVal;
    const s = Math.min(box.width / vb.width, box.height / vb.height);
    const ox = box.left + (box.width - vb.width * s) / 2;
    const oy = box.top + (box.height - vb.height * s) / 2;
    return [ox + (cluster[0].x - vb.x) * s, oy + (cluster[0].y - vb.y) * s];
  };
  const angleAt = (e) => { const [ax, ay] = axle(); return (Math.atan2(e.clientY - ay, e.clientX - ax) * 180) / Math.PI; };
  clusterEl.addEventListener('pointerdown', (e) => {
    if (calm()) return;
    dragging = angleAt(e);
    clusterEl.classList.add('is-cranking');
    clusterEl.setPointerCapture(e.pointerId);
  });
  clusterEl.addEventListener('pointermove', (e) => {
    if (dragging == null) return;
    const a = angleAt(e);
    let d = a - dragging;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    dragging = a;
    crank += d;
    crankVel = d;
    kick();
  });
  const stop = () => { dragging = null; clusterEl.classList.remove('is-cranking'); };
  clusterEl.addEventListener('pointerup', stop);
  clusterEl.addEventListener('pointercancel', stop);

  // Layout that depends on size
  const dock = matchMedia('(min-width: 1420px)');
  const onResize = () => {
    measure();
    sideZones();
    gauge.classList.toggle('is-docked', dock.matches);
    if (dock.matches) buildTrain(); else tsvg.innerHTML = '';
    turnCluster(calm() ? 0 : theta());
    turnTrain(calm() ? 0 : theta() * 1.6);
  };
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(onResize, 120); });
  addEventListener('load', onResize);
  if (document.fonts) document.fonts.ready.then(onResize);
  onResize();
  setDepth(scrollY / 9);
  addEventListener('eas:calm', () => { pressure = 0; hot = 0; onResize(); kick(); });
})();
