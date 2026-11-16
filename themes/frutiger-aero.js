// Frutiger Aero: the sliding world, Vista Sidebar gadgets, bubbles you can pop, and a Wii Menu clock in the footer.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const make = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html) n.innerHTML = html; return n; };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };

  // The world slides past as you scroll: sky, meadow, waterline, deep water.
  const world = make('div', 'aero-world');
  world.setAttribute('aria-hidden', 'true');
  document.body.prepend(world);
  let dive = 0;
  let ticking = false;
  function paintWorld() {
    ticking = false;
    const max = Math.max(1, root.scrollHeight - innerHeight);
    dive = Math.min(1, Math.max(0, scrollY / max));
    const y = isCalm() ? 0.14 : dive;
    world.style.transform = `translate3d(0, ${(-y * (world.offsetHeight - innerHeight)).toFixed(1)}px, 0)`;
    paintWeather();
  }
  const queueWorld = () => { if (!ticking) { ticking = true; requestAnimationFrame(paintWorld); } };
  addEventListener('scroll', queueWorld, { passive: true });
  addEventListener('resize', queueWorld);

  // Sidebar
  const hero = document.querySelector('.hero');
  const side = make('aside', 'aero-sidebar');
  side.setAttribute('aria-label', 'Gadgets');
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i + 1) * Math.PI / 6;
    return `<text x="${(50 + 34.5 * Math.sin(a)).toFixed(1)}" y="${(53.6 - 34.5 * Math.cos(a)).toFixed(1)}" text-anchor="middle" font-size="9.500" font-weight="400" fill="#2a2f33">${i + 1}</text>`;
  }).join('');
  side.innerHTML = `
    <div class="aero-sidectl"><button type="button" class="ctl-add" aria-label="Release some bubbles" title="Release some bubbles">+</button><button type="button" class="ctl-prev" aria-label="Previous section" title="Previous section">&#8249;</button><button type="button" class="ctl-next" aria-label="Next section" title="Next section">&#8250;</button></div>
    <div class="aero-gadget aero-clock" role="img" aria-label="Clock">
      <svg viewBox="0 0 100 100">
        <defs>
          <radialGradient id="aero-rim" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#7b8791"/><stop offset=".6" stop-color="#20272d"/><stop offset="1" stop-color="#050709"/></radialGradient>
          <radialGradient id="aero-face" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="#fffef8"/><stop offset=".8" stop-color="#f1efe6"/><stop offset="1" stop-color="#c9c7bc"/></radialGradient>
          <linearGradient id="aero-gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".82"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        </defs>
        <circle cx="50" cy="50" r="49" fill="url(#aero-rim)"/>
        <circle cx="50" cy="50" r="44" fill="url(#aero-face)"/>
        ${ticks}
        <g stroke-linecap="round">
          <line class="h-h" x1="50" y1="53" x2="50" y2="29" stroke="#111" stroke-width="3"/>
          <line class="h-m" x1="50" y1="54" x2="50" y2="17" stroke="#111" stroke-width="2.200"/>
          <line class="h-s" x1="50" y1="57" x2="50" y2="14" stroke="#c7321b" stroke-width="1"/>
        </g>
        <circle cx="50" cy="50" r="2.800" fill="#111"/>
        <path d="M12 44A38 38 0 0 1 88 44C70 34 30 34 12 44Z" fill="url(#aero-gl)"/>
      </svg>
    </div>
    <div class="aero-gadget aero-weather" data-w="sky"><i aria-hidden="true"></i><div><b data-temp>22°</b><span data-place>Clear sky</span></div></div>
    <div class="aero-gadget aero-popper"><b data-pops>0</b>bubbles popped<span class="aero-meter" aria-hidden="true"><i></i></span><small data-hint>Click one. Ten pops is a surprise.</small></div>
    <div class="aero-gadget aero-slides" aria-hidden="true"></div>`;
  hero.after(side);

  // The contents list becomes a feed gadget on wide screens.
  const toc = document.querySelector('.toc');
  const wide = matchMedia('(min-width: 1240px)');
  const placeToc = () => { if (wide.matches) side.append(toc); else side.after(toc); };
  placeToc();
  wide.addEventListener('change', placeToc);

  const slides = side.querySelector('.aero-slides');
  const heroImgs = [...document.querySelectorAll('.hero-gallery img')];
  heroImgs.forEach((im, i) => { const t = new Image(); t.alt = ''; t.loading = 'lazy'; t.src = im.src.replace(/\.webp$/, '.t.webp'); if (!i) t.className = 'on'; slides.append(t); });
  let slideI = 0;
  setInterval(() => {
    if (isCalm() || !wide.matches) return;
    const kids = slides.children;
    kids[slideI].classList.remove('on');
    slideI = (slideI + 1) % kids.length;
    kids[slideI].classList.add('on');
  }, 5000);

  // Clock
  const hh = side.querySelector('.h-h');
  const hm = side.querySelector('.h-m');
  const hs = side.querySelector('.h-s');
  const fmtTime = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let wiiT = null;
  let wiiD = null;
  function tick() {
    const d = new Date();
    const s = d.getSeconds();
    const m = d.getMinutes() + s / 60;
    const h = (d.getHours() % 12) + m / 60;
    hh.setAttribute('transform', `rotate(${h * 30} 50 50)`);
    hm.setAttribute('transform', `rotate(${m * 6} 50 50)`);
    hs.setAttribute('transform', `rotate(${s * 6} 50 50)`);
    hs.style.display = isCalm() ? 'none' : '';
    if (wiiT) {
      wiiT.textContent = fmtTime.format(d);
      wiiD.textContent = `${days[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
    }
  }

  // Weather follows the dive.
  const weather = side.querySelector('.aero-weather');
  const wxPlace = side.querySelector('[data-place]');
  const wxTemp = side.querySelector('[data-temp]');
  let wxNow = '';
  function paintWeather() {
    const d = isCalm() ? 0 : dive;
    const w = d < 0.3 ? 'sky' : d < 0.6 ? 'meadow' : d < 0.72 ? 'water' : 'deep';
    if (w === wxNow) return;
    wxNow = w;
    weather.dataset.w = w;
    const text = { sky: ['22°', 'Clear sky'], meadow: ['24°', 'Meadow, breezy'], water: ['19°', 'Waterline'], deep: ['14°', 'Deep water'] }[w];
    wxTemp.textContent = text[0];
    wxPlace.textContent = text[1];
  }

  // Contents gadget marks where you are, and the small controls move between sections.
  const links = [...toc.querySelectorAll('a')];
  const sections = [...document.querySelectorAll('.sec')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach((a) => a.classList.toggle('is-here', a.getAttribute('href') === `#${e.target.id}`));
      }
    }, { rootMargin: '-35% 0px -60% 0px' });
    sections.forEach((s) => io.observe(s));
  }
  const moveSection = (dir) => {
    const list = [hero, ...sections];
    const tops = list.map((s) => s.getBoundingClientRect().top + scrollY);
    let i = tops.findLastIndex((t) => t <= scrollY + 90);
    i = Math.min(list.length - 1, Math.max(0, i + dir));
    scrollTo({ top: tops[i] - 56, behavior: isCalm() ? 'auto' : 'smooth' });
  };
  side.querySelector('.ctl-prev').addEventListener('click', () => moveSection(-1));
  side.querySelector('.ctl-next').addEventListener('click', () => moveSection(1));

  // Bubbles. They never take clicks: a press is checked against them and still reaches whatever is underneath.
  const layer = make('div', 'aero-bubbles fx');
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  const bubbles = [];
  const countEl = side.querySelector('[data-pops]');
  const meter = side.querySelector('.aero-meter i');
  const hint = side.querySelector('[data-hint]');
  let pops = parseInt(store.get('eas-aero-pops') || '0', 10) || 0;
  function paintPops() {
    countEl.textContent = pops;
    meter.style.setProperty('--p', `${(pops % 10) * 10}%`);
  }
  paintPops();

  function spawn(fromBottom = true, x, y) {
    const b = make('div', 'aero-bubble');
    const big = Math.random() < 0.22;
    const s = big ? 58 + Math.random() * 50 : 18 + Math.random() * 34;
    b.style.setProperty('--s', `${s}px`);
    layer.append(b);
    const o = {
      el: b, s,
      x: x ?? Math.random() * innerWidth,
      y: y ?? (fromBottom ? innerHeight + s : Math.random() * innerHeight),
      v: 16 + Math.random() * 30 + (70 - Math.min(s, 70)) * 0.28,
      wob: 8 + Math.random() * 20,
      f: 0.5 + Math.random() * 0.9,
      p: Math.random() * 6.28,
    };
    bubbles.push(o);
    return o;
  }

  let audio;
  function popSound() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t = audio.currentTime;
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(620 + Math.random() * 280, t);
      o.frequency.exponentialRampToValueAtTime(1500, t + 0.05);
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + 0.09);
    } catch { /* no audio, no problem */ }
  }

  function burst(x, y, s) {
    const n = make('div', 'aero-pop');
    n.style.transform = `translate(${x}px, ${y}px)`;
    const ring = make('b', 'ring');
    ring.style.width = ring.style.height = `${s}px`;
    ring.style.margin = `${-s / 2}px 0 0 ${-s / 2}px`;
    n.append(ring);
    ring.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.35)', opacity: 0 }], { duration: 170, easing: 'ease-out', fill: 'forwards' });
    for (let i = 0; i < 9; i += 1) {
      const d = make('b', 'drop');
      const a = (i / 9) * 6.28 + Math.random() * 0.4;
      const r = s * 0.5 + 12 + Math.random() * 26;
      n.append(d);
      d.animate([{ transform: `translate(${Math.cos(a) * s * 0.42}px, ${Math.sin(a) * s * 0.42}px)`, opacity: 1 }, { transform: `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r + 14}px) scale(.4)`, opacity: 0 }], { duration: 340 + Math.random() * 120, easing: 'cubic-bezier(.1,.7,.4,1)', fill: 'forwards' });
    }
    layer.append(n);
    setTimeout(() => n.remove(), 520);
  }

  let swarm = 0;
  function pop(o) {
    bubbles.splice(bubbles.indexOf(o), 1);
    o.el.remove();
    burst(o.px, o.py, o.s);
    popSound();
    pops += 1;
    store.set('eas-aero-pops', String(pops));
    paintPops();
    if (pops % 10 === 0) {
      swarm = 24;
      hint.textContent = 'Nice. Here come some more.';
    } else {
      hint.textContent = `${10 - (pops % 10)} more for a surprise.`;
    }
  }

  addEventListener('pointerdown', (e) => {
    if (isCalm() || document.querySelector('dialog[open]')) return;
    let best = null;
    let bestD = Infinity;
    for (const o of bubbles) {
      const d = Math.hypot(e.clientX - o.px, e.clientY - o.py);
      if (d < o.s / 2 + 8 && d < bestD) { best = o; bestD = d; }
    }
    if (best) pop(best);
  }, { passive: true });

  side.querySelector('.ctl-add').addEventListener('click', () => { swarm += 8; });

  let last = performance.now();
  let spawnT = 0;
  let raf = 0;
  function target() {
    const base = Math.round(Math.min(13, 5 + innerWidth / 200));
    return dive > 0.72 ? base + 6 : base;
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    spawnT -= dt;
    if (swarm > 0 && spawnT <= 0) {
      spawn();
      swarm -= 1;
      spawnT = 0.09;
    } else if (bubbles.length < target() && spawnT <= 0) {
      spawn();
      spawnT = 0.7 + Math.random() * 1.2;
    }
    for (let i = bubbles.length - 1; i >= 0; i -= 1) {
      const o = bubbles[i];
      o.y -= o.v * dt;
      o.p += o.f * dt;
      o.px = o.x + Math.sin(o.p) * o.wob;
      o.py = o.y;
      o.el.style.transform = `translate3d(${o.px.toFixed(1)}px, ${o.py.toFixed(1)}px, 0)`;
      if (o.y < -o.s) { o.el.remove(); bubbles.splice(i, 1); }
    }
  }
  function startBubbles() {
    if (raf) return;
    last = performance.now();
    if (!bubbles.length) for (let i = 0; i < 6; i += 1) spawn(false);
    raf = requestAnimationFrame(frame);
  }
  function stopBubbles() { cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopBubbles(); else if (!isCalm()) startBubbles(); });

  // The footer is the bottom of the Wii Menu, so it gets the clock.
  const foot = document.querySelector('.foot');
  const wc = make('div', 'aero-wiiclock', '<span></span><small></small>');
  wc.setAttribute('aria-hidden', 'true');
  foot.prepend(wc);
  wiiT = wc.querySelector('span');
  wiiD = wc.querySelector('small');

  // Empty channels fill the Wii Menu, however many neighbours are built so far.
  const rel = document.querySelector('.related');
  const have = rel.children.length;
  const want = have <= 4 ? 4 : 8;
  for (let i = have; i < want; i += 1) { const li = make('li', 'aero-blank-wrap', '<div class="aero-blank"></div>'); li.setAttribute('aria-hidden', 'true'); rel.append(li); }

  const applyCalm = () => {
    if (isCalm()) stopBubbles(); else startBubbles();
    queueWorld();
    wxNow = '';
    tick();
  };
  addEventListener('eas:calm', applyCalm);
  applyCalm();
  setInterval(tick, 1000);
})();
