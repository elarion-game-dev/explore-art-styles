// Dark Fantasy: gives each core element a relic icon, turns the reference gallery into a reliquary whose lore shows
// in a case beside it while you hold a relic, lights a fire at the foot of the page, and lets its embers drift up
// over everything. The fire is drawn particle by particle and grows warmer as you come down to it; touch it to stoke it.
// Calm mode keeps the fire still and removes the embers.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const calm = () => root.dataset.calm === '1';
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  root.classList.add('df-on');

  /* --- Behind the page: low fog, and the warmth of the fire below --- */
  const scene = el('div', 'df-scene', '<div class="df-fog df-fog-a"></div><div class="df-fog df-fog-b"></div><div class="df-warm"></div>');
  scene.setAttribute('aria-hidden', 'true');
  document.body.prepend(scene);
  const warm = $('.df-warm', scene);

  /* --- Relics: an icon for every core element, chosen by what its title is about --- */
  const ICONS = {
    crown: '<path d="M14 47 11 25l10 8 10-16 10 14 5-5 2 4 3 1-1 16Z"/><path d="M14 47h36M15 52h34"/><circle class="df-fill" cx="11" cy="22" r="2.2"/><circle class="df-fill" cx="31" cy="14.5" r="2.2"/><path d="m24 41 2-2 2 2-2 2Zm12 0 2-2 2 2-2 2Z"/><path d="m53 55 5-6 3 7Z"/><path d="m38 26-2 6 3 4-2 5"/>',
    sword: '<path d="M29 44V13l3-7 3 7v31"/><path d="M32 13v28"/><path d="M17 45h30M17 45c-2 0-3-1.5-3-3M47 45c2 0 3-1.5 3-3"/><path d="M30 46h4v11h-4Z"/><path d="M30 49.5h4M30 53h4"/><circle cx="32" cy="60" r="2.4"/><path d="m35 25-2.2 2 2.2 2"/>',
    cathedral: '<path d="M5 58h54"/><path d="M10 58V27l6-11 6 11v31"/><path d="M42 58V27l3-5.5 2 2.5 2-4 5 7v31"/><path d="M22 58V35l10-12 10 12v23"/><circle cx="32" cy="37" r="5"/><path d="M32 32v10M27 37h10"/><path d="M28 58v-6c0-3 2-5 4-6.5 2 1.5 4 3.5 4 6.5v6"/><path d="M16 31v7M48 31v7"/>',
    painting: '<path d="M7 9h40v33H7Z"/><path d="M12 14h30v23H12Z"/><path d="M15 33c4-6 7-8 11-4s7 1 12-5"/><circle cx="20" cy="21" r="2.3"/><path d="m29 59 18-18"/><path class="df-fill" d="m46 40 4.5-4.5 3 3L49 43Z"/><path d="M52 37c2.5-5 6-9 9-11-1 4-3.5 8-6.5 12Z"/>',
    candle: '<path d="M14 58h36M20 58c2-4 6-6 12-6s10 2 12 6"/><path d="M26 52V31h12v21"/><path d="M26 31c1 4 3 4 3 2s2-1 2 1M34 31v4"/><path d="M32 31v-4"/><path class="df-flame" d="M32 26c-4.2-3.5-3.6-9.2 0-15 3.6 5.8 4.2 11.5 0 15Z"/>',
    page: '<path d="M11 7h31l7 7v17l-4 4 4 4-6 4 4 6-6 9H11Z"/><path d="M42 7v7h7"/><path d="M16 17h21M16 22h24M16 27h18M16 32h22M16 37h16M16 42h20M16 47h14"/><path d="m51 47 7-4 2.5 10-7 4Z"/><path d="m53.5 50.5 4-2"/>',
    ring: '<circle cx="32" cy="39" r="15"/><circle cx="32" cy="39" r="10.5"/><path d="m26 24 6-9 6 9-6 3Z"/><path d="M32 15v12"/>',
  };
  const RULES = [
    ['crown', /\b(kingdom|glory|ruin|fallen|fall|decay|crown|empire|throne)/i],
    ['sword', /\b(warrior|hero|knight|sword|lone|one|fight|combat)/i],
    ['cathedral', /\b(cathedral|relic|monster|church|architect|gothic|castle)/i],
    ['painting', /\b(paint|master|brush|canvas|art)/i],
    ['candle', /\b(fire|light|candle|flame|dark|shadow)/i],
    ['page', /\b(lore|story|stories|fragment|text|myth|told|word)/i],
  ];
  const used = new Set();
  const pick = (title) => {
    for (const [name, re] of RULES) if (!used.has(name) && re.test(title)) { used.add(name); return name; }
    const spare = Object.keys(ICONS).find((n) => !used.has(n)) || 'ring';
    used.add(spare);
    return spare;
  };
  for (const item of $$('.core-item')) {
    const slot = el('span', 'df-relic', `<svg viewBox="0 0 64 64" focusable="false">${ICONS[pick($('h3', item)?.textContent || '')]}</svg>`);
    slot.setAttribute('aria-hidden', 'true');
    item.prepend(slot);
  }

  /* --- Every section's name comes up as you reach it, like the name of a new place --- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.closest('.sec').classList.add('df-seen'); io.unobserve(e.target); }
    }, { threshold: 0.6 });
    $$('.sec .sec-title').forEach((t) => io.observe(t));
  } else {
    $$('.sec').forEach((s) => s.classList.add('df-seen'));
  }

  /* --- The reliquary: hold a relic and its lore shows in the case beside it --- */
  const gallery = $('.ref-gallery');
  const shots = gallery ? $$('.shot', gallery) : [];
  if (shots.length) {
    const vault = el('div', 'df-vault');
    gallery.before(vault);
    vault.append(gallery);
    const lore = el('aside', 'df-lore', `<p class="df-lore-head">Examine</p>
      <div class="df-lore-body"><div class="df-lore-pic"><img alt="" decoding="async"></div>
      <p class="df-lore-name"></p><p class="df-lore-kind"></p><p class="df-lore-text"></p><p class="df-lore-credit"></p></div>
      <p class="df-lore-count"></p>`);
    lore.setAttribute('aria-hidden', 'true');
    vault.append(lore);
    const pic = $('.df-lore-pic img', lore);
    const name = $('.df-lore-name', lore);
    const kind = $('.df-lore-kind', lore);
    const text = $('.df-lore-text', lore);
    const credit = $('.df-lore-credit', lore);
    const count = $('.df-lore-count', lore);

    // On narrow screens there is no case to hold the lore, so each relic carries its own under the name.
    for (const shot of shots) {
      const alt = $('img', shot)?.alt || '';
      const cap = $('figcaption', shot);
      if (alt && cap) {
        const line = el('span', 'df-lore-line');
        line.textContent = alt;
        line.setAttribute('aria-hidden', 'true');
        cap.append(line);
      }
    }

    const seen = new Set();
    let held = null;
    let turn = 0;
    const fill = (shot) => {
      const a = $('.shot-link', shot);
      const img = $('img', a);
      pic.src = img.getAttribute('src');
      pic.classList.toggle('is-pixel', shot.classList.contains('is-pixel'));
      name.textContent = a.dataset.title || '';
      kind.textContent = a.dataset.meta || '';
      text.textContent = img.alt || '';
      credit.textContent = [a.dataset.credit, a.dataset.license].filter(Boolean).join(', ');
      credit.hidden = !credit.textContent;
      count.textContent = seen.size >= shots.length ? 'Every relic examined' : `${seen.size} of ${shots.length} relics examined`;
    };
    const show = (shot, examined = true) => {
      if (examined) seen.add(shot);
      if (held === shot) { fill(shot); return; }
      held?.classList.remove('is-held');
      held = shot;
      shot.classList.add('is-held');
      clearTimeout(turn);
      if (calm()) { fill(shot); return; }
      lore.classList.add('is-turning');
      turn = setTimeout(() => { fill(shot); lore.classList.remove('is-turning'); }, 150);
    };
    for (const shot of shots) {
      shot.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') show(shot); });
      $('.shot-link', shot)?.addEventListener('focus', () => show(shot));
    }
    // The first relic waits in the case before anything is held.
    held = shots[0];
    held.classList.add('is-held');
    fill(held);
  }

  /* --- Embers: they rise from the bottom of the screen, or from the fire itself once it is in sight --- */
  const ecv = $('.decor .df-embers');
  const embers = { burst() {} };
  let hearthBox = null; // where the fire is on screen, kept up to date by the hearth below
  if (ecv && ecv.getContext) {
    const g = ecv.getContext('2d');
    let W = 0;
    let H = 0;
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = innerWidth;
      H = innerHeight;
      ecv.width = Math.round(W * dpr);
      ecv.height = Math.round(H * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    addEventListener('resize', size);
    const spr = document.createElement('canvas');
    spr.width = spr.height = 32;
    const sg = spr.getContext('2d');
    const grad = sg.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,244,214,1)');
    grad.addColorStop(0.16, 'rgba(255,196,120,.95)');
    grad.addColorStop(0.42, 'rgba(238,122,52,.32)');
    grad.addColorStop(1, 'rgba(200,70,20,0)');
    sg.fillStyle = grad;
    sg.fillRect(0, 0, 32, 32);

    const motes = [];
    const add = (x, y, hot) => {
      if (motes.length > 190) return;
      motes.push({ x0: x, x, y, vy: -(26 + Math.random() * 48) * (hot ? 1.7 : 1), drift: gauss() * 9, life: 0, max: (hot ? 2.2 : 3) + Math.random() * (hot ? 3 : 5), s: 5 + Math.random() * 7, ph: Math.random() * 6.3, f: 1.8 + Math.random() * 3.4, sway: 6 + Math.random() * 20 });
    };
    embers.burst = (x, y, n) => { if (!calm()) for (let i = 0; i < n; i++) add(x + gauss() * 30, y + gauss() * 10, true); };
    let raf = 0;
    let last = 0;
    let owed = 0;
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      // More embers the closer you are to the fire.
      owed += dt * (5 + 30 * progress) * (W < 700 ? 0.6 : 1);
      while (owed >= 1) {
        owed -= 1;
        if (hearthBox && hearthBox.top < H && hearthBox.bottom > 0) add(hearthBox.x + gauss() * 26, hearthBox.y + gauss() * 8, false);
        else add(W / 2 + (Math.random() - 0.5) * W * 0.94, H + 8, false);
      }
      g.clearRect(0, 0, W, H);
      g.globalCompositeOperation = 'lighter';
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        m.life += dt;
        if (m.life >= m.max || m.y < -20) { motes.splice(i, 1); continue; }
        m.vy *= 1 - 0.08 * dt;
        m.y += m.vy * dt;
        m.x0 += m.drift * dt;
        m.x = m.x0 + Math.sin(m.ph + m.life * 1.2) * m.sway;
        const k = m.life / m.max;
        const fade = Math.min(1, m.life / 0.35) * (k > 0.6 ? (1 - k) / 0.4 : 1);
        const flick = 0.62 + 0.38 * Math.sin(m.ph + m.life * m.f * 6.283);
        const s = m.s * (1 - 0.45 * k);
        g.globalAlpha = Math.max(0, fade * flick * 0.9);
        g.drawImage(spr, m.x - s / 2, m.y - s / 2, s, s);
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (calm() || document.hidden) { g.clearRect(0, 0, W, H); motes.length = 0; return; }
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    embers.sync = sync;
  }

  /* --- How far down the nave you are: the fire's warmth grows as you come down to it --- */
  let progress = 0;
  let ticking = false;
  const measure = () => {
    ticking = false;
    const max = Math.max(1, root.scrollHeight - innerHeight);
    progress = Math.min(1, Math.max(0, scrollY / max));
    warm.style.opacity = (0.3 + 0.7 * progress ** 1.6).toFixed(3);
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(measure); } }, { passive: true });
  addEventListener('resize', measure);
  measure();

  /* --- The fire at the foot of the page --- */
  const foot = $('.foot');
  let hearthSync = () => {};
  if (foot) {
    const hearth = el('div', 'df-hearth', '<canvas></canvas>');
    hearth.setAttribute('aria-hidden', 'true');
    foot.after(hearth);
    const cv = $('canvas', hearth);
    const g = cv.getContext('2d');
    let W = 0;
    let H = 0;
    const size = () => {
      const r = hearth.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = r.width;
      H = r.height;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();

    const sprite = (r, gg, b) => {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const x = c.getContext('2d');
      const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, `rgba(${r},${gg},${b},1)`);
      gr.addColorStop(0.35, `rgba(${r},${gg},${b},.5)`);
      gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
      x.fillStyle = gr;
      x.fillRect(0, 0, 64, 64);
      return c;
    };
    const SPR = [sprite(255, 240, 200), sprite(255, 186, 92), sprite(240, 112, 44), sprite(150, 44, 22)];
    const flames = [];
    const sparks = [];
    let stoke = 0;
    let t = 0;
    let owed = 0;
    let owedSpark = 0;
    const baseY = () => H - 112;
    const step = (dt) => {
      t += dt;
      stoke = Math.max(0, stoke - dt * 0.45);
      const cx = W / 2;
      const by = baseY();
      owed += dt * (150 + 200 * stoke);
      while (owed >= 1) {
        owed -= 1;
        const core = Math.random() < 0.3;
        flames.push({ x: cx + gauss() * (core ? 12 : 28 + 12 * stoke), y: by - Math.random() * 10, vx: gauss() * 14, vy: -(core ? 150 + Math.random() * 70 : 90 + Math.random() * 90) * (1 + 0.45 * stoke), life: 0, max: 0.7 + Math.random() * 0.6, s: (core ? 40 + Math.random() * 20 : 46 + Math.random() * 36) * (1 + 0.3 * stoke) });
      }
      owedSpark += dt * (5 + 30 * stoke);
      while (owedSpark >= 1) {
        owedSpark -= 1;
        sparks.push({ x: cx + gauss() * 20, y: by - 30, vx: gauss() * 26, vy: -(70 + Math.random() * 90), life: 0, max: 1.1 + Math.random() * 1.4, s: 3 + Math.random() * 4 });
      }
      for (let i = flames.length - 1; i >= 0; i--) {
        const p = flames[i];
        p.life += dt;
        if (p.life >= p.max) { flames.splice(i, 1); continue; }
        p.vx += (cx - p.x) * 2.8 * dt;
        p.vy *= 1 + 0.5 * dt;
        p.x += (p.vx + Math.sin(t * 6.5 + p.y * 0.045) * 16) * dt;
        p.y += p.vy * dt;
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.life += dt;
        if (p.life >= p.max || p.y < 0) { sparks.splice(i, 1); continue; }
        p.x += (p.vx + Math.sin(t * 3 + p.life * 5) * 20) * dt;
        p.y += p.vy * dt;
      }
    };
    // A ring of broken masonry round the fire, the same every visit.
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const stone = (ax, ay, rx, ry) => {
      const pts = [];
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * 2 * (i / 9) + rnd() * 0.3;
        const k = 0.78 + rnd() * 0.3;
        pts.push([ax + Math.cos(a) * rx * k, ay + Math.min(Math.sin(a), 0.62) * ry * k]);
      }
      return { pts, ax, ay, rx, ry };
    };
    const ring = [];
    for (const [deg, r] of [[200, 1], [228, 0.9], [256, 0.85], [284, 0.85], [312, 0.9], [340, 1]]) ring.push({ back: true, ...stone(Math.cos(deg * Math.PI / 180) * 128, Math.sin(deg * Math.PI / 180) * 26 + 6, 26 * r, 15 * r) });
    for (const deg of [165, 135, 105, 75, 45, 15]) ring.push({ back: false, ...stone(Math.cos(deg * Math.PI / 180) * 136, Math.sin(deg * Math.PI / 180) * 30 + 10, 30, 18) });
    const drawStone = (st, cx, by, heat) => {
      const top = by + st.ay - st.ry;
      const lg = g.createLinearGradient(0, top, 0, by + st.ay + st.ry);
      lg.addColorStop(0, `rgba(${Math.round(70 + 60 * heat)},${Math.round(52 + 30 * heat)},${Math.round(40 + 10 * heat)},1)`);
      lg.addColorStop(0.45, '#1f2120');
      lg.addColorStop(1, '#0c0d0d');
      g.fillStyle = lg;
      g.beginPath();
      st.pts.forEach(([x, y], i) => (i ? g.lineTo(cx + x, by + y) : g.moveTo(cx + x, by + y)));
      g.closePath();
      g.fill();
      g.strokeStyle = `rgba(255,170,100,${0.18 + 0.2 * heat})`;
      g.lineWidth = 1.2;
      g.beginPath();
      const upper = st.pts.filter(([, y]) => y < st.ay);
      upper.sort((p, q) => p[0] - q[0]).forEach(([x, y], i) => (i ? g.lineTo(cx + x, by + y) : g.moveTo(cx + x, by + y)));
      g.stroke();
    };
    const log = (x1, y1, x2, y2, w, heat) => {
      const a = Math.atan2(y2 - y1, x2 - x1);
      const len = Math.hypot(x2 - x1, y2 - y1);
      g.save();
      g.translate(x1, y1);
      g.rotate(a);
      const lg = g.createLinearGradient(0, -w / 2, 0, w / 2);
      lg.addColorStop(0, `rgba(${Math.round(150 + 80 * heat)},${Math.round(62 + 30 * heat)},24,1)`);
      lg.addColorStop(0.3, '#3a2216');
      lg.addColorStop(1, '#0d0907');
      g.fillStyle = lg;
      g.beginPath();
      if (g.roundRect) g.roundRect(0, -w / 2, len, w, w / 2); else g.rect(0, -w / 2, len, w);
      g.fill();
      // Charred rings at the ends, glowing a little where the fire has eaten in
      g.fillStyle = `rgba(255,120,40,${0.35 + 0.3 * heat})`;
      g.beginPath();
      g.ellipse(len - w * 0.3, 0, w * 0.22, w * 0.42, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    };
    const draw = () => {
      const cx = W / 2;
      const by = baseY();
      g.clearRect(0, 0, W, H);
      // The fire breathes slowly. It never flashes.
      const breathe = 0.86 + 0.08 * Math.sin(t * 1.7) + 0.05 * Math.sin(t * 4.1 + 1) + 0.22 * stoke;
      let gr = g.createRadialGradient(cx, by - 50, 10, cx, by - 50, Math.max(W, H) * 0.6);
      gr.addColorStop(0, `rgba(255,150,70,${0.3 * breathe})`);
      gr.addColorStop(0.3, `rgba(200,90,40,${0.12 * breathe})`);
      gr.addColorStop(1, 'rgba(120,40,20,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
      // Light pooled on the floor
      g.save();
      g.translate(cx, by + 24);
      g.scale(1, 0.2);
      const fr = Math.min(W * 0.48, 460);
      gr = g.createRadialGradient(0, 0, 0, 0, 0, fr);
      gr.addColorStop(0, `rgba(255,140,60,${0.42 * breathe})`);
      gr.addColorStop(0.5, `rgba(180,70,30,${0.14 * breathe})`);
      gr.addColorStop(1, 'rgba(255,140,60,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(0, 0, fr, 0, Math.PI * 2);
      g.fill();
      g.restore();
      for (const st of ring) if (st.back) drawStone(st, cx, by, breathe);
      // Ash and coals
      gr = g.createRadialGradient(cx, by + 10, 2, cx, by + 10, 84);
      gr.addColorStop(0, `rgba(255,214,140,${0.8 * breathe})`);
      gr.addColorStop(0.32, `rgba(236,98,32,${0.55 * breathe})`);
      gr.addColorStop(0.7, 'rgba(70,40,30,.75)');
      gr.addColorStop(1, 'rgba(40,30,26,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.ellipse(cx, by + 12, 92, 22, 0, 0, Math.PI * 2);
      g.fill();
      log(cx - 92, by + 22, cx + 34, by - 12, 17, breathe);
      log(cx + 94, by + 24, cx - 32, by - 10, 16, breathe);
      log(cx - 46, by + 30, cx + 52, by + 20, 13, breathe);
      for (const st of ring) if (!st.back) drawStone(st, cx, by, breathe * 0.75);
      // Flames, a white core and sparks, added as light
      g.globalCompositeOperation = 'lighter';
      gr = g.createRadialGradient(cx, by - 24, 0, cx, by - 24, 70);
      gr.addColorStop(0, `rgba(255,236,190,${0.5 * breathe})`);
      gr.addColorStop(1, 'rgba(255,170,80,0)');
      g.fillStyle = gr;
      g.fillRect(cx - 80, by - 100, 160, 160);
      for (const p of flames) {
        const k = p.life / p.max;
        const s = p.s * (1 - 0.7 * k);
        const idx = k < 0.18 ? 0 : k < 0.4 ? 1 : k < 0.7 ? 2 : 3;
        g.globalAlpha = Math.min(1, p.life / 0.06) * (1 - k ** 1.5) * 0.4;
        g.drawImage(SPR[idx], p.x - s / 2, p.y - s / 2, s, s);
      }
      for (const p of sparks) {
        const k = p.life / p.max;
        g.globalAlpha = (1 - k) * (0.6 + 0.4 * Math.sin(p.life * 13));
        g.drawImage(SPR[1], p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    };

    let visible = false;
    let raf = 0;
    let last = 0;
    const where = () => {
      const r = hearth.getBoundingClientRect();
      hearthBox = { top: r.top, bottom: r.bottom, x: r.left + r.width / 2, y: r.top + baseY() - 70 };
    };
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      step(dt);
      draw();
      where();
      raf = requestAnimationFrame(loop);
    };
    // A still fire for calm mode: let it burn for a moment out of sight, then draw it once.
    const still = () => {
      if (!flames.length) for (let i = 0; i < 70; i++) step(1 / 60);
      draw();
    };
    hearthSync = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (calm() || document.hidden || !visible) { if (calm()) still(); if (!visible) hearthBox = null; return; }
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; hearthSync(); }).observe(hearth);
    } else {
      visible = true;
    }
    hearth.addEventListener('click', (e) => {
      if (calm()) return;
      stoke = Math.min(1, stoke + 0.7);
      const r = hearth.getBoundingClientRect();
      embers.burst(r.left + r.width / 2, r.top + baseY() - 60, 26);
      e.preventDefault();
    });
    let rs;
    addEventListener('resize', () => { clearTimeout(rs); rs = setTimeout(() => { size(); if (calm()) still(); }, 120); });
    still();
  }

  const syncAll = () => { embers.sync?.(); hearthSync(); };
  addEventListener('eas:calm', syncAll);
  document.addEventListener('visibilitychange', syncAll);
  syncAll();
})();
