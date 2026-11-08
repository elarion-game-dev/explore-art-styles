// Pastel Horror: frosting, stickers, candy hearts and a bunny host. Sections stay fresh until you reach them, then spoil.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  root.classList.add('ph-on');
  let seed = 55;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);

  // ---------- frosting drips, as a mask the CSS stretches taller as a section spoils ----------
  (() => {
    const W = 300, T = 30;
    let d = `M0 0H${W}V${T}`;
    // walk right to left along the bottom edge of the frosting band, dropping drips
    const drips = [];
    let x = W - 8;
    while (x > 20) {
      const w = 12 + rnd() * 16;
      const len = 46 + rnd() * 52;
      drips.push([x - w / 2, w, len]);
      x -= w + 16 + rnd() * 30;
    }
    for (const [cx, w, len] of drips) {
      const l = cx - w / 2, r = cx + w / 2;
      d += `L${(r + 7).toFixed(1)} ${T}C${r.toFixed(1)} ${T} ${r.toFixed(1)} ${T + 3} ${r.toFixed(1)} ${T + 8}`;
      d += `L${r.toFixed(1)} ${(len - w / 2).toFixed(1)}A${(w / 2).toFixed(1)} ${(w / 2).toFixed(1)} 0 0 1 ${l.toFixed(1)} ${(len - w / 2).toFixed(1)}`;
      d += `L${l.toFixed(1)} ${T + 8}C${l.toFixed(1)} ${T + 3} ${l.toFixed(1)} ${T} ${(l - 7).toFixed(1)} ${T}`;
    }
    d += `L0 ${T}Z`;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} 100' preserveAspectRatio='none'><path d='${d}'/></svg>`;
    root.style.setProperty('--drip', `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
  })();

  // ---------- stickers ----------
  const HEART = 'M50 88C20 66 4 48 4 28 4 13 16 4 29 4c10 0 17 6 21 14 4-8 11-14 21-14 13 0 25 9 25 24 0 20-16 38-46 60z';
  function heartSVG(fill, rot) {
    const crack = rot > 0.6 ? `<path d="M50 18l-5 8 6 5-4 6" fill="none" stroke="#5b2c63" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M78 8l-4 7 5 4" fill="none" stroke="#5b2c63" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` : '';
    const aid = rot > 0.8 ? `<g transform="rotate(-38 30 68)"><rect x="12" y="62" width="38" height="11" rx="5.5" fill="#f6d3c2" stroke="#c9958a" stroke-width="1.5"/><rect x="26" y="63" width="10" height="9" fill="#e9b9a8"/></g>` : '';
    return `<svg viewBox="0 0 100 92" aria-hidden="true"><path d="${HEART}" fill="${fill}" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><ellipse cx="27" cy="24" rx="9" ry="5" fill="#fff" opacity=".6" transform="rotate(-30 27 24)"/>${crack}${aid}</svg>`;
  }
  function bunnySVG(mended) {
    const s = '#7b4a77';
    const ears = mended
      ? `<ellipse cx="38" cy="34" rx="13" ry="30" fill="#fff" stroke="${s}" stroke-width="3" transform="rotate(-14 38 34)"/><ellipse cx="38" cy="36" rx="6" ry="20" fill="#ffc6dc" transform="rotate(-14 38 36)"/>
         <ellipse cx="96" cy="50" rx="13" ry="30" fill="#fff" stroke="${s}" stroke-width="3" transform="rotate(62 96 50)"/><ellipse cx="96" cy="50" rx="6" ry="20" fill="#e3c9d6" transform="rotate(62 96 50)"/>
         <path d="M82 46l6 4m-2-8l-2 10" stroke="${s}" stroke-width="2.4" stroke-linecap="round"/>`
      : `<ellipse cx="38" cy="34" rx="13" ry="30" fill="#fff" stroke="${s}" stroke-width="3" transform="rotate(-14 38 34)"/><ellipse cx="38" cy="36" rx="6" ry="20" fill="#ffc6dc" transform="rotate(-14 38 36)"/>
         <ellipse cx="82" cy="34" rx="13" ry="30" fill="#fff" stroke="${s}" stroke-width="3" transform="rotate(14 82 34)"/><ellipse cx="82" cy="36" rx="6" ry="20" fill="#ffc6dc" transform="rotate(14 82 36)"/>`;
    const eyes = mended
      ? `<circle cx="42" cy="80" r="8" fill="#f29cc4" stroke="${s}" stroke-width="2.5"/><circle cx="39.5" cy="77.5" r="1.4" fill="${s}"/><circle cx="44.5" cy="77.5" r="1.4" fill="${s}"/><circle cx="39.5" cy="82.5" r="1.4" fill="${s}"/><circle cx="44.5" cy="82.5" r="1.4" fill="${s}"/>
         <circle cx="78" cy="80" r="6.5" fill="#1e1236"/>
         <path d="M48 58l24 6M52 54l-2 8M58 56l-2 8M64 57l-2 8M70 59l-2 8" stroke="${s}" stroke-width="2.2" stroke-linecap="round"/>`
      : `<circle cx="42" cy="80" r="5.5" fill="#3b2440"/><circle cx="43.8" cy="78" r="1.8" fill="#fff"/><circle cx="78" cy="80" r="5.5" fill="#3b2440"/><circle cx="79.8" cy="78" r="1.8" fill="#fff"/>`;
    const mouth = mended ? `<path d="M50 94q10 7 20 0" fill="none" stroke="${s}" stroke-width="2.6" stroke-linecap="round"/>` : `<path d="M52 92q4 5 8 0q4 5 8 0" fill="none" stroke="${s}" stroke-width="2.6" stroke-linecap="round"/>`;
    return `<svg viewBox="0 0 120 124" aria-hidden="true">${ears}<ellipse cx="60" cy="84" rx="50" ry="37" fill="#fff" stroke="${s}" stroke-width="3"/>
      <ellipse cx="30" cy="93" rx="8" ry="5" fill="#ffb3d1" opacity="${mended ? 0.35 : 0.85}"/><ellipse cx="90" cy="93" rx="8" ry="5" fill="#ffb3d1" opacity="${mended ? 0.35 : 0.85}"/>${eyes}${mouth}</svg>`;
  }
  const STAR = 'M50 4l12 30 32 3-24 21 7 32-27-17-27 17 7-32L6 37l32-3z';
  function starSVG(rot) {
    const face = rot > 0.5
      ? `<path d="M37 46l8 6m0-6l-8 6M55 46l8 6m0-6l-8 6" stroke="#7a4a00" stroke-width="3" stroke-linecap="round"/><path d="M40 66q10-6 20 0" fill="none" stroke="#7a4a00" stroke-width="3" stroke-linecap="round"/>`
      : `<circle cx="41" cy="50" r="3.5" fill="#7a4a00"/><circle cx="59" cy="50" r="3.5" fill="#7a4a00"/><path d="M43 60q7 6 14 0" fill="none" stroke="#7a4a00" stroke-width="3" stroke-linecap="round"/>`;
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${STAR}" fill="#ffd84d" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>${face}</svg>`;
  }
  function candySVG(c) {
    return `<svg viewBox="0 0 120 70" aria-hidden="true"><path d="M30 35L4 12v46zM90 35l26-23v46z" fill="${c}" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><ellipse cx="60" cy="35" rx="32" ry="26" fill="${c}" stroke="#fff" stroke-width="5"/><path d="M40 22q20 26 40 0M40 48q20-26 40 0" fill="none" stroke="#fff" stroke-width="4" opacity=".7"/></svg>`;
  }
  function sparkSVG(c) {
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 2C54 36 64 46 98 50 64 54 54 64 50 98 46 64 36 54 2 50 36 46 46 36 50 2z" fill="${c}" stroke="#fff" stroke-width="5" stroke-linejoin="round"/></svg>`;
  }
  function eyeSVG() {
    return `<svg viewBox="0 0 100 70" aria-hidden="true"><path d="M4 35Q50-14 96 35 50 84 4 35z" fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="round"/><path d="M8 35Q50-8 92 35 50 78 8 35z" fill="#fdf2f8" stroke="#7b4a77" stroke-width="3"/><circle cx="50" cy="35" r="17" fill="#b7a8f0"/><circle cx="50" cy="35" r="8" fill="#1e1236"/></svg>`;
  }

  // ---------- section titles: one span per letter, each with its own way to slip ----------
  for (const h of $$('.sec-title')) {
    const t = h.textContent;
    h.setAttribute('aria-label', t);
    h.textContent = '';
    for (const ch of t) {
      const s = document.createElement('span');
      s.className = 'ph-l';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch;
      s.style.setProperty('--dx', ((rnd() - 0.5) * 10).toFixed(1));
      s.style.setProperty('--dy', ((rnd() - 0.5) * 14).toFixed(1));
      s.style.setProperty('--rz', ((rnd() - 0.5) * 30).toFixed(1));
      h.append(s);
    }
  }

  // ---------- a candy heart on every section, and what it says before and after ----------
  const HEARTS = {
    feel: ['#ffc2d8', 'HI CUTIE', 'HI CUTIE'],
    core: ['#c9ecff', 'HUG ME', 'HOLD ME'],
    how: ['#fff1a8', 'BFF', 'ONLY ME'],
    palette: ['#e2d3fb', 'SO SWEET', 'TOO SWEET'],
    vibe: ['#c9f2dc', 'PLAY?', "DON'T GO"],
    refs: ['#ffd6c4', 'MISS U', 'I SEE U'],
    related: ['#fff', '4EVER', 'STAY 4EVER'],
  };
  const sections = $$('.sec');
  for (const sec of sections) {
    const h = HEARTS[sec.id];
    if (!h) continue;
    const rot = parseFloat(getComputedStyle(sec).getPropertyValue('--rot')) || 0;
    const el = document.createElement('div');
    el.className = 'ph-heart';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `${heartSVG(h[0], rot)}<span>${h[2]}</span>`;
    el.dataset.fresh = h[1];
    el.dataset.spoilt = h[2];
    sec.prepend(el);
    // tea and grape stains on the spoiled slabs, kept faint so text stays readable
    const n = Math.floor(rot * 4);
    const box = document.createElement('div');
    box.setAttribute('aria-hidden', 'true');
    box.style.cssText = 'position:absolute;inset:0;z-index:0;overflow:hidden;border-radius:inherit;pointer-events:none';
    if (n) sec.prepend(box);
    for (let i = 0; i < n; i++) {
      const st = document.createElement('span');
      st.setAttribute('aria-hidden', 'true');
      const size = 120 + rnd() * 220;
      const col = rnd() < 0.5 ? '120 70 40' : '95 45 105';
      st.style.cssText = `position:absolute;z-index:0;pointer-events:none;left:${(rnd() * 80).toFixed(0)}%;top:${(10 + rnd() * 75).toFixed(0)}%;width:${size}px;height:${(size * (0.6 + rnd() * 0.5)).toFixed(0)}px;background:radial-gradient(closest-side,rgb(${col} / ${(0.05 + rot * 0.07).toFixed(2)}),rgb(${col} / ${(0.04 + rot * 0.05).toFixed(2)}) 55%,rgb(${col} / ${(0.07 + rot * 0.06).toFixed(2)}) 78%,transparent);border-radius:${(40 + rnd() * 20).toFixed(0)}% ${(40 + rnd() * 20).toFixed(0)}% ${(40 + rnd() * 20).toFixed(0)}% ${(40 + rnd() * 20).toFixed(0)}%;transform:rotate(${(rnd() * 180).toFixed(0)}deg)`;
      box.append(st);
    }
  }

  // ---------- a sticker beside each core element ----------
  const coreStk = [() => heartSVG('#ffc2d8', 0), () => starSVG(0), () => sparkSVG('#c9ecff'), () => candySVG('#e2d3fb'), () => eyeSVG(), () => heartSVG('#d9cfe0', 0.9)];
  $$('.core-item').forEach((item, i) => {
    const s = document.createElement('span');
    s.className = 'ph-stk';
    s.innerHTML = coreStk[i % coreStk.length]();
    item.prepend(s);
  });

  // ---------- the host: a bunny in the hero, and the same bunny, mended, at the bottom ----------
  const hero = $('.hero');
  const host = document.createElement('div');
  host.className = 'ph-host';
  host.setAttribute('aria-hidden', 'true');
  host.innerHTML = `<span class="ph-bun">${bunnySVG(false)}</span><span class="ph-say">welcome to my page!! ♡</span>`;
  const heroText = $('.hero-text');
  if (matchMedia('(max-width: 900px)').matches) heroText.after(host); else hero.prepend(host);
  const foot = $('.foot');
  const bye = document.createElement('div');
  bye.setAttribute('aria-hidden', 'true');
  bye.innerHTML = `<span class="ph-bun">${bunnySVG(true)}</span><span class="ph-say">you'll come back, right?</span>`;
  foot.prepend(bye);

  // ---------- stickers in the margins, peeling and greying further down ----------
  const gutters = [];
  function placeGutters() {
    gutters.forEach((g) => g.remove());
    gutters.length = 0;
    const page = $('.page').getBoundingClientRect();
    const space = page.left;
    if (space < 90) return;
    const H = document.documentElement.scrollHeight;
    const kinds = [(r) => heartSVG('#ffc2d8', r), (r) => starSVG(r), (r) => candySVG(r > 0.5 ? '#cbbfd2' : '#c9ecff'), (r) => sparkSVG(r > 0.5 ? '#ddd3e2' : '#fff1a8'), (r) => (r > 0.55 ? bunnySVG(true) : bunnySVG(false)), (r) => heartSVG('#e2d3fb', r)];
    let s2 = 7;
    const r2 = () => ((s2 = (s2 * 1103515245 + 12345) >>> 0) / 4294967296);
    let i = 0;
    for (let y = 260; y < H - 300; y += 300 + r2() * 260) {
      const rot = Math.min(1, Math.max(0, (y / H - 0.15) * 1.25));
      const g = document.createElement('div');
      g.className = 'ph-gut';
      g.setAttribute('aria-hidden', 'true');
      const left = i % 2 === 0;
      const size = Math.min(space - 20, 62 + r2() * 26);
      // A turned piece is up to 1.21 times as wide, so the right-hand ones stop short of the window edge and the page never scrolls sideways.
      const x = left ? Math.max(6, (space - size) / 2 + (r2() - 0.5) * 20) : Math.min(page.right + Math.max(6, (space - size) / 2 + (r2() - 0.5) * 20), document.documentElement.clientWidth - size * 1.22 - 6);
      g.style.cssText = `left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;width:${size.toFixed(0)}px;height:${size.toFixed(0)}px;transform:rotate(${((r2() - 0.5) * (30 + rot * 60)).toFixed(0)}deg);filter:saturate(${(1 - rot * 0.75).toFixed(2)}) brightness(${(1 - rot * 0.25).toFixed(2)});opacity:${(1 - rot * 0.25).toFixed(2)}`;
      g.innerHTML = kinds[i % kinds.length](rot);
      document.body.append(g);
      gutters.push(g);
      i++;
    }
  }

  // ---------- sections stay fresh until they are seen, then spoil ----------
  function spoil(sec) {
    sec.classList.remove('fresh');
    const h = $('.ph-heart span', sec);
    if (h) h.textContent = h.parentElement.dataset.spoilt;
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { io.unobserve(e.target); setTimeout(() => spoil(e.target), calm() ? 0 : 350); }
      }
    }, { threshold: 0.18 });
    for (const sec of sections) {
      if (sec.getBoundingClientRect().top > innerHeight * 0.8) {
        sec.classList.add('fresh');
        const h = $('.ph-heart span', sec);
        if (h) h.textContent = h.parentElement.dataset.fresh;
        io.observe(sec);
      }
    }
  }

  // ---------- a little glitter over the box, fading as you leave the top ----------
  const decor = $('.decor');
  if (decor) {
    for (let k = 0; k < 14; k++) {
      const sp = document.createElement('i');
      sp.className = 'ph-spark';
      sp.style.cssText = `left:${(4 + rnd() * 92).toFixed(1)}%;top:${(8 + rnd() * 70).toFixed(1)}%;animation-delay:${(-rnd() * 4.2).toFixed(2)}s;transform:scale(${(0.6 + rnd() * 0.8).toFixed(2)})`;
      decor.append(sp);
    }
    const fade = () => { decor.style.opacity = String(Math.max(0, 1 - scrollY / 900)); };
    addEventListener('scroll', fade, { passive: true });
    fade();
  }

  addEventListener('eas:calm', () => { if (calm()) sections.forEach((s) => { if (s.classList.contains('fresh') && s.getBoundingClientRect().top < innerHeight) spoil(s); }); });
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(placeGutters, 200); });
  addEventListener('load', placeGutters);
  (document.fonts?.ready || Promise.resolve()).then(placeGutters);
})();
