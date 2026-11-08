// Mallsoft: the mall directory kiosk. A real floor plan is the navigation, and YOU ARE HERE follows you down the corridor as you scroll.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const calm = () => root.dataset.calm === '1';
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  // The floor plan. Stores are links; vacant units are left in, because directories never get updated.
  const STORES = [
    { id: 'feel', label: ['The', 'feel'], unit: 101, x: 6, y: 34, w: 106, h: 70, door: [130, 70] },
    { id: 'core', label: ['Core', 'elements'], unit: 102, x: 188, y: 34, w: 106, h: 92, door: [170, 80] },
    { id: 'how', label: ['How to', 'do it'], unit: 103, x: 6, y: 134, w: 88, h: 118, door: [122, 192] },
    { id: 'palette', label: ['Palette'], unit: 104, x: 206, y: 158, w: 88, h: 90, door: [178, 200] },
    { id: 'vibe', label: ['Feel the', 'vibe'], unit: 105, x: 6, y: 298, w: 106, h: 70, door: [130, 332] },
    { id: 'refs', label: ['More', 'references'], unit: 106, x: 188, y: 288, w: 106, h: 84, door: [170, 330] },
    { id: 'related', label: ['Food court: related styles'], unit: 107, x: 30, y: 392, w: 240, h: 30, door: [150, 382], wide: true },
  ];
  const VACANT = [[6, 108, 106, 22], [188, 130, 106, 24], [6, 256, 106, 38], [206, 252, 88, 32], [6, 372, 20, 50], [274, 376, 20, 46]];
  const ENTRANCE = [150, 22];
  const present = STORES.filter((s) => document.getElementById(s.id) && !(s.id === 'related' && !$('.related')?.children.length));

  const storeSvg = (s) => `<a class="ms-store" href="#${s.id}" data-store="${s.id}" aria-label="Unit ${s.unit}: ${s.label.join(' ')}">
      <rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}"/>
      <text class="u" x="${s.x + 6}" y="${s.y + 11}">${s.unit}</text>
      ${s.label.map((t, i) => `<text x="${s.x + (s.wide ? s.w / 2 : 6)}" y="${s.y + (s.wide ? 22 : s.h / 2 + 8) + i * 13}"${s.wide ? ' text-anchor="middle"' : ''}>${t}</text>`).join('')}
    </a>`;
  const map = `<svg class="ms-map" viewBox="0 0 300 430" role="group" aria-label="Floor plan of the page. Each store is a section.">
      <defs><pattern id="ms-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#e5dcc8"/><rect width="2" height="7" fill="#cfc3aa"/></pattern></defs>
      <rect x="0" y="0" width="300" height="430" fill="#fbf6ea"/>
      <path d="M116 26H184V168A52 52 0 0 1 184 262V388H272V426H28V388H116V262A52 52 0 0 1 116 168Z" fill="#f2cdb4" stroke="#1e2f35" stroke-width="1.2"/>
      <rect x="116" y="4" width="68" height="22" fill="#1b7078"/><text x="150" y="18" text-anchor="middle" fill="#fff" font-size="8.5" font-weight="700" font-family="Rubik, sans-serif">MAIN DOORS</text>
      <circle cx="150" cy="215" r="27" fill="#bfe6e4" stroke="#1b7078" stroke-width="1.4"/><circle cx="150" cy="215" r="14" fill="#7fd0cf"/><text x="150" y="218" text-anchor="middle" font-size="7.5" font-weight="500" font-family="Rubik, sans-serif" fill="#0d3f45">FOUNTAIN</text>
      <path d="M124 136l6 14 6-14M164 136l6 14 6-14" fill="none" stroke="#6a5a48" stroke-width="1.2"/>
      <text x="150" y="146" text-anchor="middle" font-size="7" font-family="Rubik, sans-serif" fill="#6a5a48">ESC</text>
      ${VACANT.map(([x, y, w, h]) => `<g class="ms-vacant"><rect x="${x}" y="${y}" width="${w}" height="${h}"/>${w > 40 ? `<text x="${x + w / 2}" y="${y + h / 2 + 3}" text-anchor="middle">VACANT</text>` : ''}</g>`).join('')}
      ${STORES.map(storeSvg).join('')}
      <polyline class="ms-route" points=""/>
      <g class="ms-dot" transform="translate(${ENTRANCE[0]} ${ENTRANCE[1]})"><circle class="ms-ping" r="8" fill="#d62839"/><circle r="5" fill="#d62839" stroke="#fff" stroke-width="1.6"/></g>
    </svg>`;

  const kiosk = el('aside', 'ms-kiosk', `<div class="ms-housing"><div class="ms-panel">
      <button class="ms-toggle" type="button" aria-expanded="false"><i></i><span>You are here</span><em>Map</em></button>
      <div class="ms-fold">
        <div class="ms-head"><span>Mall directory</span><span>Level 1</span></div>
        ${map}
        <div class="ms-where"><i></i><span>You are here</span></div>
      </div></div>
      <div class="ms-fold ms-pa-wrap"><div class="ms-pa"><b>PUBLIC ADDRESS</b><span></span></div></div></div>`);
  kiosk.setAttribute('aria-label', 'Mall directory');
  $('.page').prepend(kiosk);
  $('.ms-panel .ms-fold', kiosk).append($('.toc'));
  if (!$('.related')?.children.length) {
    const s = $('.ms-store[data-store=related]', kiosk);
    s?.classList.add('ms-closed');
    if (s) { s.removeAttribute('href'); $$('text', s).at(-1).textContent = 'Food court: closed'; }
  }

  const toggle = $('.ms-toggle', kiosk);
  const setOpen = (open) => { kiosk.classList.toggle('is-open', open); toggle.setAttribute('aria-expanded', String(open)); $('em', toggle).textContent = open ? 'Close' : 'Map'; };
  toggle.addEventListener('click', () => setOpen(!kiosk.classList.contains('is-open')));
  kiosk.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });

  // Where you are
  const dot = $('.ms-dot', kiosk);
  const route = $('.ms-route', kiosk);
  const whereLine = $('.ms-where span', kiosk);
  const whereStrip = $('span', toggle);
  const secs = present.map((s) => ({ ...s, node: document.getElementById(s.id) }));
  const storeLinks = new Map($$('.ms-store', kiosk).map((a) => [a.dataset.store, a]));
  const listLinks = new Map($$('.toc a', kiosk).map((a) => [a.getAttribute('href').slice(1), a]));
  let current = '';
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const place = () => {
    const anchor = scrollY + innerHeight * .42;
    const tops = secs.map((s) => s.node.getBoundingClientRect().top + scrollY);
    let i = -1;
    tops.forEach((t, k) => { if (t <= anchor) i = k; });
    let pos;
    if (i < 0) pos = lerp(ENTRANCE, secs[0].door, Math.max(0, anchor / tops[0]));
    else if (i === secs.length - 1) pos = secs[i].door;
    else {
      const f = (anchor - tops[i]) / (tops[i + 1] - tops[i]);
      pos = lerp(secs[i].door, secs[i + 1].door, Math.max(0, (f - .55) / .45));
    }
    dot.setAttribute('transform', `translate(${pos[0].toFixed(1)} ${pos[1].toFixed(1)})`);
    const pts = [ENTRANCE, ...secs.slice(0, Math.max(0, i + 1)).map((s) => s.door), pos];
    route.setAttribute('points', pts.map((p) => p.join(',')).join(' '));
    const id = i < 0 ? '' : secs[i].id;
    if (id !== current) {
      current = id;
      storeLinks.forEach((a, k) => a.classList.toggle('is-here', k === id));
      listLinks.forEach((a, k) => a.classList.toggle('is-here', k === id));
      const name = i < 0 ? 'The atrium' : `Unit ${secs[i].unit}, ${secs[i].label.join(' ')}`;
      whereLine.textContent = `You are here: ${name}`;
      whereStrip.textContent = `You are here: ${name}`;
    }
  };
  let queued = false;
  const onScroll = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; place(); }); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  place();

  // Public address announcements
  const PA = [
    'Attention shoppers. The mall will close in 15 minutes.',
    'Would the owner of a beige station wagon please return to Lot C.',
    'The fountain is closed for cleaning until further notice.',
    'One child\'s mitten has been found near the escalators.',
    'Thank you for shopping with us since 1979.',
  ];
  const paText = $('.ms-pa span', kiosk);
  let paIndex = 0;
  paText.textContent = PA[0];
  setInterval(() => {
    if (calm() || document.hidden) return;
    paText.classList.add('fade');
    setTimeout(() => {
      paIndex = (paIndex + 1) % PA.length;
      paText.textContent = PA[paIndex];
      paText.classList.remove('fade');
    }, 650);
  }, 9000);

  // One letter of the big sign is failing, as they do
  const title = $('.hero-title');
  title.setAttribute('aria-label', title.textContent);
  const letters = title.textContent;
  title.innerHTML = '';
  [...letters].forEach((c, i) => {
    const s = el('span');
    s.textContent = c;
    s.setAttribute('aria-hidden', 'true');
    if (i === 5) s.className = 'ms-flick';
    title.append(s);
  });

  // The paint shop's sign is in every colour it stocks
  const paintSign = $('#palette .sec-title');
  if (paintSign) {
    const colors = ['#ff9dc0', '#ffc46b', '#8ff0e8', '#ffe08a', '#c9b6ff', '#9fe0ff', '#ffb59a'];
    const text = paintSign.textContent;
    paintSign.setAttribute('aria-label', text);
    paintSign.textContent = '';
    const w = el('span');
    w.setAttribute('aria-hidden', 'true');
    [...text].forEach((c, i) => {
      const s = el('span');
      s.textContent = c;
      s.style.cssText = `color:${colors[i % colors.length]};--glow:255 240 200`;
      w.append(s);
    });
    paintSign.append(w);
  }

  // Things on the floor between the stores
  const frond = () => {
    const out = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = -168 + (i * 156) / (n - 1);
      const len = 70 + (i % 3) * 8;
      const up = [];
      const down = [];
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        const dir = (a + (a < -90 ? -1 : 1) * 50 * t * t) * Math.PI / 180;
        const x = Math.cos(dir) * len * t;
        const y = Math.sin(dir) * len * t + 14 * t * t;
        const w = Math.sin(Math.PI * Math.min(1, t * 1.02)) * 8;
        up.push(`${(x - Math.sin(dir) * w * (k % 2 ? 1 : .55)).toFixed(1)} ${(y + Math.cos(dir) * w * (k % 2 ? 1 : .55)).toFixed(1)}`);
        down.unshift(`${(x + Math.sin(dir) * w * .25).toFixed(1)} ${(y - Math.cos(dir) * w * .25).toFixed(1)}`);
      }
      out.push(`<path d="M${up.join('L')}L${down.join('L')}Z" fill="${i % 2 ? '#2a6f55' : '#3d8a68'}"/>`);
    }
    return out.join('');
  };
  const planter = (left) => `<svg style="left:${left}" width="150" height="170" viewBox="-75 -100 150 170" aria-hidden="true"><path d="M-3 -6C-1 14 2 32 1 46H9C10 30 6 12 3 -6Z" fill="#6b5236"/>${frond()}<path d="M-34 42H34L28 68H-28Z" fill="#c9a06a"/><rect x="-36" y="38" width="72" height="8" fill="#e8c17c"/><rect x="-34" y="50" width="68" height="4" fill="#0d6f74" opacity=".7"/></svg>`;
  const bench = (left) => `<svg style="left:${left}" width="200" height="80" viewBox="0 0 200 80" aria-hidden="true"><rect x="4" y="22" width="192" height="9" rx="2" fill="#b98a4e"/><rect x="4" y="33" width="192" height="9" rx="2" fill="#a57a42"/><rect x="26" y="42" width="16" height="36" fill="#6f6a60"/><rect x="158" y="42" width="16" height="36" fill="#6f6a60"/></svg>`;
  const wetFloor = (left) => `<svg style="left:${left}" width="66" height="100" viewBox="0 0 66 100" aria-hidden="true"><path d="M12 2H54L64 98H52L46 40H20L14 98H2Z" fill="#f5c518" stroke="#3b3205" stroke-width="1.5"/><text x="33" y="20" text-anchor="middle" font-size="8.5" font-weight="700" font-family="Rubik, sans-serif" fill="#1c1a05">CAUTION</text><text x="33" y="31" text-anchor="middle" font-size="6.5" font-weight="500" font-family="Rubik, sans-serif" fill="#1c1a05">WET FLOOR</text></svg>`;

  const after = (id, node) => { const s = document.getElementById(id); if (s) s.after(node); };
  const gap1 = el('div', 'ms-gap', `${planter('4%')}${bench('24%')}${planter('60%')}${wetFloor('82%')}`);
  gap1.setAttribute('aria-hidden', 'true');
  after('feel', gap1);

  const vacant1 = el('div', 'ms-vacant-front', '<span class="ms-ghost">WALDO\'S SHOES</span><b>SPACE AVAILABLE<i>2,400 sq ft. Call Leasing, 555-0142</i></b>');
  vacant1.setAttribute('aria-hidden', 'true');
  after('core', vacant1);

  const esc = el('div', 'ms-esc', '<i></i><i></i><b>LEVEL 2 ESCALATORS</b>');
  esc.setAttribute('aria-hidden', 'true');
  after('how', esc);

  const gap2 = el('div', 'ms-gap', `${bench('6%')}${planter('36%')}${bench('58%')}`);
  gap2.setAttribute('aria-hidden', 'true');
  after('palette', gap2);

  const vacant2 = el('div', 'ms-vacant-front', '<span class="ms-ghost">VIDEO VILLAGE</span><b>THANK YOU FOR 23 YEARS<i>Please visit our location in the next town over</i></b>');
  vacant2.setAttribute('aria-hidden', 'true');
  after('vibe', vacant2);

  // Exits, in place of plain links
  const navLinks = $$('.foot-nav a');
  navLinks.forEach((a) => a.setAttribute('title', a.textContent.trim()));
})();
