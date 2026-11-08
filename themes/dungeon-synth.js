// Dungeon Synth: grows thorns on the logo, builds a working cassette you can label yourself,
// and burns two candles down as the page is read. The light flickers softly and never strobes.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';
  const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private window */ } };

  // A small seeded random, so the logo keeps the same shape on every visit and width.
  const seeded = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };

  /* --- The logo. Letters stay real text; the spikes are mirrored around each line's centre. --- */
  const title = document.querySelector('.hero-title');
  if (title) {
    const text = title.textContent;
    title.setAttribute('aria-label', text);
    title.innerHTML = text.split(' ').map((w) => `<span class="ds-word" aria-hidden="true">${[...w].map((c) => `<span class="ds-l">${c}</span>`).join('')}</span>`).join(' ');
    const svgNS = 'http://www.w3.org/2000/svg';
    const thorns = document.createElementNS(svgNS, 'svg');
    thorns.setAttribute('class', 'ds-thorns');
    thorns.setAttribute('aria-hidden', 'true');
    title.append(thorns);

    const spike = (x, y, w, h, lean) => {
      // Curved like a thorn. Negative h points up.
      const tipX = x + lean;
      const tipY = y + h;
      return `M${x - w / 2} ${y}Q${x - w * 0.18 + lean * 0.25} ${y + h * 0.55} ${tipX} ${tipY}Q${x + w * 0.2 + lean * 0.3} ${y + h * 0.5} ${x + w / 2} ${y}Z`;
    };
    const wing = (x, y, len, thick) => `M${x} ${y - thick / 2}Q${x + len * 0.5} ${y - thick * 0.9} ${x + len} ${y - thick * 1.3}Q${x + len * 0.55} ${y + thick * 0.1} ${x} ${y + thick / 2}Z`;

    const grow = () => {
      const box = title.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(title).fontSize);
      const vw = root.clientWidth;
      const lines = new Map();
      for (const l of title.querySelectorAll('.ds-l')) {
        const r = l.getBoundingClientRect();
        const key = Math.round(r.top / 10);
        if (!lines.has(key)) lines.set(key, []);
        lines.get(key).push({ x: r.left - box.left, w: r.width, top: r.top - box.top, bottom: r.bottom - box.top });
      }
      let d = '';
      const rnd = seeded(1994);
      for (const letters of lines.values()) {
        const x0 = letters[0].x;
        const last = letters[letters.length - 1];
        const x1 = last.x + last.w;
        const cx = (x0 + x1) / 2;
        const top = letters[0].top + fs * 0.26;
        const bottom = letters[0].bottom - fs * 0.24;
        const half = (x1 - x0) / 2;
        const n = Math.max(5, Math.round(half / (fs * 0.17)));
        // Spear in the middle, then a crown whose height swells and falls toward the edges.
        d += spike(cx, top, fs * 0.05, -fs * 1.02, 0);
        d += spike(cx, bottom, fs * 0.04, fs * 0.62, 0);
        for (let i = 0; i < n; i += 1) {
          const t = (i + 0.65) / n;
          const off = (t + (rnd() - 0.5) * 0.5 / n) * half * 0.98;
          const swell = 0.36 + 0.64 * Math.abs(Math.cos(t * Math.PI * 2.5)) ** 2;
          const long = i % 5 === 2 ? 1.45 : 1;
          const up = fs * (0.12 + 0.62 * swell * (0.45 + rnd() * 0.55)) * long;
          const w = fs * 0.016 + up * 0.056;
          const lean = fs * (0.02 + t * 0.09) * (rnd() * 0.8 + 0.2);
          for (const g of [-1, 1]) d += spike(cx + g * off, top, w, -up, g * lean);
          if (i % 2 === 1 || t > 0.8) {
            const dn = fs * (0.1 + 0.44 * (1 - swell * 0.6) * (0.35 + rnd() * 0.65));
            const w2 = fs * 0.014 + dn * 0.05;
            for (const g of [-1, 1]) d += spike(cx + g * off, bottom, w2, dn, g * lean * 0.7);
          }
        }
        // Long wings from the first and last letters, kept inside the screen.
        const room = Math.min(box.left + x0, vw - (box.left + x1)) - 8;
        const len = Math.min(fs * 1.5, room);
        if (len > fs * 0.3) {
          const my = (top + bottom) / 2;
          d += wing(x1 - fs * 0.1, my, len + fs * 0.1, fs * 0.05);
          d += wing(x0 + fs * 0.1, my, -(len + fs * 0.1), fs * 0.05);
          d += wing(x1 - fs * 0.1, my + fs * 0.2, len * 0.62 + fs * 0.1, fs * 0.036);
          d += wing(x0 + fs * 0.1, my + fs * 0.2, -(len * 0.62 + fs * 0.1), fs * 0.036);
        }
      }
      thorns.setAttribute('width', box.width);
      thorns.setAttribute('height', box.height);
      thorns.innerHTML = `<path d="${d}"/>`;
    };
    grow();
    let w8;
    addEventListener('resize', () => { clearTimeout(w8); w8 = setTimeout(grow, 150); });
    if (document.fonts?.ready) document.fonts.ready.then(grow);
  }

  /* --- The cassette. The label is yours to write on; the reels turn while a track plays. --- */
  const wrap = document.querySelector('.music-wrap');
  const list = wrap?.querySelector('.tracks');
  if (list) {
    const items = [...list.querySelectorAll('.track')];
    const head = (t) => { const h = document.createElement('li'); h.className = 'ds-sidehead'; h.setAttribute('aria-hidden', 'true'); h.textContent = t; return h; };
    list.prepend(head('Side A'));
    const mid = Math.ceil(items.length / 2);
    if (items[mid]) items[mid].before(head('Side B'));

    const hub = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#d7d2c5"/><circle cx="20" cy="20" r="11.5" fill="#0d0c0b"/><path d="M20 8.5v6M20 25.5v6M8.5 20h6M25.5 20h6M11.9 11.9l4.2 4.2M23.9 23.9l4.2 4.2M28.1 11.9l-4.2 4.2M16.1 23.9l-4.2 4.2" stroke="#d7d2c5" stroke-width="3.4"/></svg>';
    const deck = document.createElement('div');
    deck.className = 'ds-deck';
    const col = document.createElement('div');
    col.className = 'ds-side-col';
    col.innerHTML = `<div class="ds-tape">
        <div class="ds-label">
          <span class="ds-side">A</span>
          <input class="ds-write" type="text" maxlength="30" aria-label="Write your own label on the cassette" spellcheck="false">
          <span class="ds-write-hint">write your own label</span>
          <i class="ds-rule ds-rule-a"></i>
        </div>
        <div class="ds-window">
          <i class="ds-pack ds-pack-l"></i><i class="ds-pack ds-pack-r"></i>
          <i class="ds-hub ds-hub-l">${hub}</i><i class="ds-hub ds-hub-r">${hub}</i>
        </div>
        <i class="ds-foot"></i>
      </div>
      <p class="ds-counter">Tape counter <b data-ds-count>000</b></p>`;
    list.before(deck);
    deck.append(col, list);

    const input = col.querySelector('.ds-write');
    input.value = read('eas-ds-label') || 'for the long way home';
    input.addEventListener('input', () => write('eas-ds-label', input.value));

    // Reels run while the player is open. The tape packs change size as the counter climbs.
    const player = document.querySelector('[data-player]');
    const count = col.querySelector('[data-ds-count]');
    const tape = col.querySelector('.ds-tape');
    let n = Number(read('eas-ds-count')) || 0;
    let timer = 0;
    const paint = () => {
      count.textContent = String(n % 1000).padStart(3, '0');
      const t = (n % 1000) / 1000;
      tape.style.setProperty('--pack-l', (1 - 0.45 * t).toFixed(3));
      tape.style.setProperty('--pack-r', (0.55 + 0.45 * t).toFixed(3));
    };
    paint();
    const sync = () => {
      const on = player && !player.hidden;
      deck.classList.toggle('is-rolling', Boolean(on));
      clearInterval(timer);
      if (on && !calm()) timer = setInterval(() => { n += 1; paint(); write('eas-ds-count', String(n)); }, 1200);
    };
    if (player) new MutationObserver(sync).observe(player, { attributes: true, attributeFilter: ['hidden'] });
    addEventListener('eas:calm', sync);
  }

  /* --- Candles and the light they give. --- */
  const glow = document.querySelector('.ds-glow');
  const candles = [...document.querySelectorAll('.ds-candle')];
  const burn = () => {
    const max = root.scrollHeight - innerHeight;
    const t = max > 0 ? Math.min(1, scrollY / max) : 0;
    for (const c of candles) c.style.setProperty('--burn', t.toFixed(4));
  };
  addEventListener('scroll', burn, { passive: true });
  addEventListener('resize', burn);
  burn();

  // Slow layered sines, so the light wavers like a real flame. Well under three changes a second.
  let raf = 0;
  const flicker = (ms) => {
    raf = requestAnimationFrame(flicker);
    const s = ms / 1000;
    const v = 0.88 + Math.sin(s * 1.7) * 0.05 + Math.sin(s * 2.9 + 1.3) * 0.04 + Math.sin(s * 5.3 + 0.4) * 0.03;
    if (glow) glow.style.opacity = v.toFixed(3);
  };
  const start = () => { if (!raf && !calm()) raf = requestAnimationFrame(flicker); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; if (glow) glow.style.opacity = ''; };
  addEventListener('eas:calm', (e) => { if (e.detail?.calm) stop(); else start(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  start();
})();
