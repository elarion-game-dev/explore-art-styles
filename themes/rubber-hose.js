// Rubber Hose: an iris that opens the reel and carries you between sections, dancing title letters,
// a Fleischer-style bouncing ball, and an inkwell host with noodle arms who keeps time on twos.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const BEAT = 500; // ms, 120 BPM: a beat every 12 frames at 24 fps
  const t0 = performance.now();
  const beatPos = (now) => (now - t0) / BEAT;
  const onTwos = (now) => Math.floor((now - t0) / (1000 / 12)) * (1000 / 12) + t0; // hold every drawing for two frames

  // ---------- the iris ----------
  const iris = document.createElement('div');
  iris.className = 'rh-iris gone';
  iris.setAttribute('aria-hidden', 'true');
  document.body.append(iris);
  const after = (ms) => new Promise((r) => setTimeout(r, ms));
  async function irisOpen(x = '50%', y = '45%') {
    iris.classList.remove('gone', 'open');
    iris.classList.add('shut');
    iris.style.setProperty('--ix', x);
    iris.style.setProperty('--iy', y);
    iris.getBoundingClientRect();
    await after(30);
    iris.classList.remove('shut');
    iris.classList.add('open');
    await after(950);
    iris.classList.add('gone');
  }
  async function irisClose(x, y) {
    iris.classList.remove('gone', 'shut');
    iris.classList.add('open');
    iris.style.setProperty('--ix', x);
    iris.style.setProperty('--iy', y);
    iris.getBoundingClientRect();
    await after(20);
    iris.classList.remove('open');
    iris.classList.add('shut');
    await after(480);
  }
  if (!calm()) irisOpen('50%', '30%');

  // Section links close the iris on the link, cut to the section, and open again
  const modified = (e) => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
  for (const a of $$('.toc a')) {
    a.addEventListener('click', async (e) => {
      if (calm() || modified(e)) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      await irisClose(`${e.clientX || innerWidth / 2}px`, `${e.clientY || innerHeight / 2}px`);
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
      history.replaceState(null, '', a.getAttribute('href'));
      const t = $('.sec-title', target)?.getBoundingClientRect();
      irisOpen('50%', t ? `${Math.round(t.top + t.height / 2)}px` : '30%');
    });
  }
  // Leaving for another style: the iris closes first
  for (const a of $$('a[rel=prev], a[rel=next], .atlas-home, .foot-nav a')) {
    a.addEventListener('click', async (e) => {
      if (calm() || modified(e)) return;
      e.preventDefault();
      const r = a.getBoundingClientRect();
      await irisClose(`${Math.round(r.left + r.width / 2)}px`, `${Math.round(r.top + r.height / 2)}px`);
      location.href = a.href;
    });
  }
  addEventListener('pageshow', (e) => { if (e.persisted) iris.classList.add('gone'); });

  // ---------- pictures open with a small iris the first time they are seen ----------
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add('rh-open'); io.unobserve(en.target); }
    }, { threshold: 0.2 });
    for (const s of $$('.shot')) {
      if (s.getBoundingClientRect().top < innerHeight) continue; // already on screen at load: the big iris handles it
      s.classList.add('rh-iris-wait');
      io.observe(s);
    }
  }

  // ---------- title letters dance on the beat ----------
  function letters(el) {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    for (const word of text.split(/(\s+)/)) {
      if (!word) continue;
      if (/^\s+$/.test(word)) { el.append(' '); continue; }
      const w = document.createElement('span');
      w.style.whiteSpace = 'nowrap';
      w.setAttribute('aria-hidden', 'true');
      for (const ch of word) {
        const s = document.createElement('span');
        s.className = 'rh-l';
        s.textContent = ch;
        w.append(s);
      }
      el.append(w);
    }
  }
  letters($('.hero-title'));
  $$('.sec-title').forEach(letters);

  // ---------- the bouncing ball ----------
  function ball(container, targets, opts) {
    const b = document.createElement('span');
    b.className = 'rh-ball';
    b.setAttribute('aria-hidden', 'true');
    container.append(b);
    let pts = [];
    const measure = () => {
      const c = container.getBoundingClientRect();
      pts = targets.map((t) => { const r = t.getBoundingClientRect(); return opts.point(r, c); });
    };
    let visible = false;
    let last = -1;
    const draw = (now) => {
      if (!pts.length) return;
      const n = pts.length;
      const t = beatPos(now);
      const i = Math.floor(t) % n;
      const p = t - Math.floor(t);
      const a = pts[i], z = pts[(i + 1) % n];
      const back = i === n - 1;
      const h = (back ? opts.high * 1.6 : opts.high) * Math.sin(Math.PI * p);
      const x = a[0] + (z[0] - a[0]) * p + (opts.side ? -h : 0);
      const y = a[1] + (z[1] - a[1]) * p - (opts.side ? 0 : h);
      // squash on landing
      const sq = p < 0.08 || p > 0.94 ? 'scale(1.25,.75)' : 'scale(1)';
      b.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) ${sq}`;
      if (i !== last) { opts.mark?.(i, last); last = i; }
    };
    return { b, measure, draw, set visible(v) { visible = v; }, get visible() { return visible; } };
  }
  const tag = $('.hero-tagline');
  const raw = tag.textContent;
  tag.setAttribute('aria-label', raw);
  tag.textContent = '';
  const words = [];
  raw.split(/(\s+)/).forEach((w) => {
    if (/^\s+$/.test(w)) { tag.append(' '); return; }
    const s = document.createElement('span');
    s.className = 'rh-w';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = w;
    tag.append(s);
    words.push(s);
  });
  const balls = [];
  balls.push(ball(tag, words, {
    point: (r, c) => [r.left - c.left + r.width / 2, r.top - c.top + 1],
    high: 24,
    mark: (i, prev) => { words[prev]?.classList.remove('on'); words[i]?.classList.add('on'); },
  }));
  const steps = $$('.step');
  const stepList = $('.steps');
  balls.push(ball(stepList, steps, {
    point: (r, c) => [r.left - c.left + 27, r.top - c.top + 2],
    high: 34,
    side: true,
    mark: (i, prev) => { steps[prev]?.classList.remove('on'); steps[i]?.classList.add('on'); },
  }));
  const measureAll = () => balls.forEach((x) => x.measure());

  // ---------- the inkwell host ----------
  const NS = 'http://www.w3.org/2000/svg';
  function host(small) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rh-host';
    btn.setAttribute('aria-label', 'The inkwell host. Click to make him jump');
    btn.innerHTML = `<svg viewBox="0 0 200 240" aria-hidden="true"><g class="rh-body">
      <path class="rh-leg rh-legl" fill="none" stroke="#180808" stroke-width="9" stroke-linecap="round"/>
      <path class="rh-leg rh-legr" fill="none" stroke="#180808" stroke-width="9" stroke-linecap="round"/>
      <ellipse class="rh-shoe rh-shoel" rx="21" ry="10" fill="#180808"/><ellipse class="rh-shoe rh-shoer" rx="21" ry="10" fill="#180808"/>
      <g class="rh-torso">
        <rect x="52" y="92" width="96" height="104" rx="22" fill="#180808"/>
        <rect x="76" y="74" width="48" height="24" rx="5" fill="#180808"/>
        <g class="rh-lid"><rect x="66" y="58" width="68" height="20" rx="6" fill="#180808"/><rect x="66" y="66" width="68" height="5" fill="#efe5c9"/></g>
        <rect x="70" y="160" width="60" height="26" rx="5" fill="#efe5c9"/>
        <text x="100" y="180" text-anchor="middle" font-family="Ultra, Georgia, serif" font-size="15" fill="#180808">INK</text>
        <ellipse cx="84" cy="120" rx="12" ry="16" fill="#efe5c9"/><ellipse cx="116" cy="120" rx="12" ry="16" fill="#efe5c9"/>
        <g class="rh-pupils"><ellipse cx="87" cy="124" rx="6" ry="9" fill="#180808"/><ellipse cx="119" cy="124" rx="6" ry="9" fill="#180808"/>
        <path d="M88 117l5-3-1 6z" fill="#efe5c9"/><path d="M120 117l5-3-1 6z" fill="#efe5c9"/></g>
        <path d="M76 140q24 24 48 0q-24 8-48 0z" fill="#efe5c9"/><path d="M92 146q8 6 16 0q-8 3-16 0z" fill="#b21938"/>
      </g>
      <path class="rh-arm rh-arml" fill="none" stroke="#180808" stroke-width="8" stroke-linecap="round"/>
      <path class="rh-arm rh-armr" fill="none" stroke="#180808" stroke-width="8" stroke-linecap="round"/>
      ${['l', 'r'].map((s) => `<g class="rh-glove rh-glove${s}"><circle r="13" fill="#fffdf4" stroke="#180808" stroke-width="3"/><path d="M-4 -8v9M1 -8v9" stroke="#180808" stroke-width="2" stroke-linecap="round"/><ellipse cx="11" cy="-7" rx="5" ry="7" fill="#fffdf4" stroke="#180808" stroke-width="3" transform="rotate(30 11 -7)"/></g>`).join('')}
    </g></svg>`;
    const q = (c) => btn.querySelector(c);
    const parts = { body: q('.rh-body'), legl: q('.rh-legl'), legr: q('.rh-legr'), shoel: q('.rh-shoel'), shoer: q('.rh-shoer'), arml: q('.rh-arml'), armr: q('.rh-armr'), glovel: q('.rh-glovel'), glover: q('.rh-glover'), lid: q('.rh-lid'), pupils: q('.rh-pupils') };
    let jumpAt = -1e9;
    btn.addEventListener('click', () => { jumpAt = performance.now(); if (calm()) pose(performance.now(), true); });
    // A noodle limb: a curve from a to b that bows sideways by `bow`
    const noodle = (a, b, bow) => {
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      const cx = mx - (dy / len) * bow, cy = my + (dx / len) * bow;
      return `M${a[0].toFixed(1)} ${a[1].toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
    };
    function pose(now, still) {
      const t = still ? 0.25 : beatPos(onTwos(now));
      const ph = t * Math.PI; // one half-turn per beat
      const s = Math.sin(ph * 2), c = Math.cos(ph * 2);
      const bounce = still ? 0 : Math.abs(Math.sin(ph)) * 7;
      let jump = 0;
      const since = (now - jumpAt) / 600;
      if (since >= 0 && since < 1) jump = Math.sin(since * Math.PI) * 46;
      const squash = still ? 1 : 1 - 0.05 * Math.cos(ph * 2);
      const lift = bounce + jump;
      parts.body.setAttribute('transform', `translate(0 ${(-lift).toFixed(1)})`);
      q('.rh-torso').setAttribute('transform', `translate(100 196) scale(${(2 - squash).toFixed(3)} ${squash.toFixed(3)}) translate(-100 -196)`);
      parts.lid.setAttribute('transform', `rotate(${(-8 + s * 6).toFixed(1)} 100 68)`);
      parts.pupils.setAttribute('transform', `translate(${(s * 3).toFixed(1)} 0)`);
      // legs: alternate kicks on the beat
      const kickL = still ? 0 : Math.max(0, Math.sin(ph)) * 16;
      const kickR = still ? 0 : Math.max(0, -Math.sin(ph)) * 16;
      const hipY = 190, footY = 232 + bounce;
      const fl = [66 - kickL * 0.6, footY - kickL];
      const fr = [134 + kickR * 0.6, footY - kickR];
      parts.legl.setAttribute('d', noodle([82, hipY], [fl[0] + 6, fl[1] - 6], -10 - kickL * 0.4));
      parts.legr.setAttribute('d', noodle([118, hipY], [fr[0] - 6, fr[1] - 6], 10 + kickR * 0.4));
      parts.shoel.setAttribute('cx', (fl[0] - 2).toFixed(1)); parts.shoel.setAttribute('cy', fl[1].toFixed(1));
      parts.shoer.setAttribute('cx', (fr[0] + 2).toFixed(1)); parts.shoer.setAttribute('cy', fr[1].toFixed(1));
      // arms: left swings low, right waves high, both bend like hoses
      const hl = [24 + c * 8, 150 + s * 18];
      const hr = [172 + s * 10, 70 - Math.abs(c) * 22];
      parts.arml.setAttribute('d', noodle([58, 124], hl, 18 + s * 14));
      parts.armr.setAttribute('d', noodle([142, 124], hr, -22 - c * 16));
      parts.glovel.setAttribute('transform', `translate(${hl[0].toFixed(1)} ${hl[1].toFixed(1)}) rotate(${(200 + s * 25).toFixed(0)})`);
      parts.glover.setAttribute('transform', `translate(${hr[0].toFixed(1)} ${hr[1].toFixed(1)}) rotate(${(-30 + c * 30).toFixed(0)})`);
    }
    pose(performance.now(), true);
    return { btn, pose };
  }
  const hosts = [];
  const h1 = host();
  $('.hero-text').prepend(h1.btn);
  const presents = document.createElement('p');
  presents.className = 'rh-presents';
  presents.textContent = 'Explore Art Styles presents';
  $('.hero-kicker').before(presents);
  hosts.push(h1);
  const end = document.createElement('div');
  end.className = 'rh-end';
  end.innerHTML = '<b>The End</b>';
  const h2 = host(true);
  end.append(h2.btn);
  hosts.push(h2);
  $('.foot').prepend(end);

  // ---------- old film decor ----------
  const decor = $('.decor');
  const film = decor && $('.rh-film', decor);
  const dust = [];
  if (film) {
    for (let i = 0; i < 6; i++) {
      const d = document.createElement('i');
      d.className = 'rh-dust';
      film.append(d);
      dust.push(d);
    }
  }
  let lastDust = 0;
  function moveDust(now) {
    if (now - lastDust < 250) return;
    lastDust = now;
    for (const d of dust) {
      const show = Math.random() < 0.45;
      const s = 2 + Math.random() * 5;
      d.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;width:${s.toFixed(1)}px;height:${(s * (0.6 + Math.random() * 0.8)).toFixed(1)}px;opacity:${show ? 1 : 0}`;
    }
  }

  // ---------- one clock for everything ----------
  const visible = new Set();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { for (const e of es) { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); } });
    [tag, stepList, h1.btn, h2.btn].forEach((el) => io.observe(el));
  } else [tag, stepList, h1.btn, h2.btn].forEach((el) => visible.add(el));
  let raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (calm()) return;
    if (visible.has(tag)) balls[0].draw(now);
    if (visible.has(stepList)) balls[1].draw(now);
    if (visible.has(h1.btn)) h1.pose(now);
    if (visible.has(h2.btn)) h2.pose(now);
    moveDust(now);
  }
  function stillAll() {
    words.forEach((w) => w.classList.remove('on'));
    steps.forEach((s) => s.classList.remove('on'));
    hosts.forEach((h) => h.pose(performance.now(), true));
  }
  const start = () => { measureAll(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); };
  addEventListener('eas:calm', () => { if (calm()) stillAll(); measureAll(); });
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(measureAll, 120); });
  (document.fonts?.ready || Promise.resolve()).then(measureAll);
  addEventListener('load', measureAll);
  start();
})();
