// VHS Pop: builds Ocean Drive, turns each section into a VHS box, puts spines on a shelf, and adds fast-forward, rewind and an on-screen display.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const calm = () => root.dataset.calm === '1';
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const sticker = (text, cls = '') => { const s = el('span', `vh-stick ${cls}`); s.textContent = text; s.setAttribute('aria-hidden', 'true'); return s; };

  // ---- Ocean Drive at dusk ----
  const palm = (x, base, s, fill = '#2a0d3f') => {
    const fronds = [];
    for (let i = 0; i < 9; i++) {
      const a = -172 + i * 20;
      const up = [];
      const down = [];
      const len = 62 + (i % 3) * 8;
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        const dir = ((a + (a < -90 ? -1 : 1) * 56 * t * t) * Math.PI) / 180;
        const px = Math.cos(dir) * len * t;
        const py = Math.sin(dir) * len * t + 14 * t * t;
        const w = Math.sin(Math.PI * Math.min(1, t * 1.03)) * 7;
        up.push(`${(px - Math.sin(dir) * w * (k % 2 ? 1 : .5)).toFixed(1)} ${(py + Math.cos(dir) * w * (k % 2 ? 1 : .5)).toFixed(1)}`);
        down.unshift(`${(px + Math.sin(dir) * w * .25).toFixed(1)} ${(py - Math.cos(dir) * w * .25).toFixed(1)}`);
      }
      fronds.push(`<path d="M${up.join('L')}L${down.join('L')}Z"/>`);
    }
    return `<g transform="translate(${x} ${base}) scale(${s})" fill="${fill}"><path d="M-4 0C-2 -70 4 -130 0 -190L6 -190C12 -130 6 -70 8 0Z"/><g transform="translate(3 -190)">${fronds.join('')}</g></g>`;
  };
  const windows = (x, y, cols, rows, cw, ch, gx, gy, c = '#2b1a5c') => {
    let s = '';
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) s += `<rect x="${x + q * (cw + gx)}" y="${y + r * (ch + gy)}" width="${cw}" height="${ch}" fill="${(q * 7 + r * 3) % 5 === 0 ? '#ffe9a0' : c}"/>`;
    return s;
  };
  const eyebrow = (x, y, w, c = '#fff') => `<path d="M${x - 6} ${y}h${w + 12}l-5 7h${-(w + 2)}z" fill="${c}" opacity=".85"/>`;
  const sky = `<svg class="vh-sky" viewBox="-400 0 2240 330" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><filter id="vh-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <linearGradient id="vh-shade" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".0"/><stop offset="1" stop-color="#3a0a55" stop-opacity=".34"/></linearGradient></defs>
    <path d="M-400 330V226h120v-46h90v60h90v-30h100v26h90v-40h60v30h70v-60h90v70h60v-30h70v30h120v-50h70v50h80v-90h70v80h120v-40h80v50h90v-70h70v60h120v-60h90v50h100v-40h110v60h100v90z" fill="#5e1a78" opacity=".55"/>

    <g><!-- Hotel, mint -->
      <rect x="40" y="110" width="340" height="220" fill="#7fe8d2"/><rect x="186" y="62" width="48" height="268" fill="#a9f5e4"/><rect x="170" y="86" width="16" height="244" fill="#6fd8c4"/><rect x="234" y="86" width="16" height="244" fill="#6fd8c4"/>
      ${eyebrow(58, 150, 96)}${eyebrow(268, 150, 96)}${eyebrow(58, 216, 96)}${eyebrow(268, 216, 96)}
      ${windows(66, 156, 3, 1, 24, 40, 12, 0)}${windows(276, 156, 3, 1, 24, 40, 12, 0)}${windows(66, 222, 3, 1, 24, 40, 12, 0)}${windows(276, 222, 3, 1, 24, 40, 12, 0)}
      <rect x="40" y="110" width="340" height="220" fill="url(#vh-shade)"/>
      <path d="M40 110H170V86H186V62H234V86H250V110H380" fill="none" stroke="#ff2d9e" stroke-width="4" filter="url(#vh-glow)"/>
      <rect x="40" y="274" width="340" height="56" fill="#123b4a"/><text x="210" y="316" text-anchor="middle" font-family="Yellowtail, cursive" font-size="44" fill="#fff" filter="url(#vh-glow)">The Flamingo</text>
    </g>
    <g><!-- Hotel, pink, rounded corner -->
      <path d="M520 330V150a60 60 0 0 1 60-60H860V330Z" fill="#ff9ec9"/>
      ${[0, 1, 2].map((k) => `<circle cx="${560 + k * 8}" cy="${150 + k * 52}" r="17" fill="#2b1a5c" stroke="#fff" stroke-width="4"/>`).join('')}
      ${eyebrow(620, 128, 212, '#fff4e0')}${eyebrow(620, 196, 212, '#fff4e0')}
      ${windows(626, 136, 5, 1, 30, 40, 13, 0)}${windows(626, 204, 5, 1, 30, 40, 13, 0)}
      <path d="M520 330V150a60 60 0 0 1 60-60H860" fill="none" stroke="#18e0d0" stroke-width="4" filter="url(#vh-glow)"/>
      
      <rect x="520" y="274" width="340" height="56" fill="#3a1450"/>
      <text x="690" y="314" text-anchor="middle" font-family="Bungee, sans-serif" font-size="32" fill="#f5df05" filter="url(#vh-glow)">REWIND VIDEO</text>
    </g>
    <g><!-- The video blade sign -->
      <rect x="864" y="66" width="52" height="208" rx="6" fill="#1b0b33" stroke="#ff2d9e" stroke-width="3" filter="url(#vh-glow)"/>
      ${[...'VIDEO'].map((ch, i) => `<text x="890" y="${108 + i * 38}" text-anchor="middle" font-family="Bungee, sans-serif" font-size="34" fill="#ffd6ee" filter="url(#vh-glow)">${ch}</text>`).join('')}
    </g>
    <g><!-- Hotel, peach with fins -->
      <rect x="1000" y="130" width="380" height="200" fill="#ffc89a"/><path d="M1000 130l26-30h328l26 30z" fill="#ffdcba"/>
      ${[0, 1, 2, 3].map((k) => `<rect x="${1046 + k * 90}" y="100" width="20" height="230" fill="#ffe7cf"/>`).join('')}
      ${windows(1014, 160, 4, 2, 24, 42, 66, 26)}
      <rect x="1000" y="130" width="380" height="200" fill="url(#vh-shade)"/>
      <path d="M1000 130l26-30h328l26 30" fill="none" stroke="#5ad5be" stroke-width="4" filter="url(#vh-glow)"/>
      <rect x="1000" y="282" width="380" height="48" fill="#2b1a5c"/><path d="M1000 282H1380" stroke="#ff2d9e" stroke-width="4" filter="url(#vh-glow)"/>
    </g>
    <g><!-- More of the street, for wide screens -->
      <rect x="-380" y="140" width="300" height="190" fill="#c9b6ff"/><path d="M-380 140l30-30h240l30 30z" fill="#dccfff"/>${windows(-360, 168, 5, 2, 26, 38, 26, 22)}<path d="M-380 140l30-30h240l30 30" fill="none" stroke="#f5df05" stroke-width="4" filter="url(#vh-glow)"/>
      <rect x="1460" y="120" width="340" height="210" fill="#9fdcff"/><rect x="1590" y="80" width="80" height="250" fill="#c4ebff"/>${windows(1480, 150, 3, 2, 24, 40, 14, 26)}${windows(1684, 150, 3, 2, 24, 40, 14, 26)}<path d="M1460 120H1590V80H1670V120H1800" fill="none" stroke="#ff2d9e" stroke-width="4" filter="url(#vh-glow)"/>
    </g>
    ${palm(446, 330, .92)}${palm(948, 330, .78)}${palm(1408, 330, 1.05)}${palm(14, 330, 1.1)}${palm(-30, 330, .8)}${palm(1436, 330, .7)}${palm(-400, 330, 1)}${palm(1830, 330, 1)}
  </svg>`;
  const heroText = $('.hero-text');
  heroText.insertAdjacentHTML('afterbegin', sky);
  const fascia = el('div', 'vh-fascia', '<span>OPEN 7 DAYS</span><span>NEW RELEASES EVERY TUESDAY</span><span>MEMBERS ONLY</span>');
  fascia.setAttribute('aria-hidden', 'true');
  const awning = el('div', 'vh-awning');
  awning.setAttribute('aria-hidden', 'true');
  heroText.append(fascia, awning);

  // ---- New releases ----
  const rack = $('.hero-gallery');
  const rackTitle = el('p', 'vh-rack-title', 'New releases');
  rackTitle.setAttribute('aria-hidden', 'true');
  rack.prepend(rackTitle);
  [['NEW!', ''], ['2 NIGHTS', 'y'], ['$2.99', 'p'], ['HOT', 'm']].forEach(([t, c], i) => $(`.shot-${i + 1}`, rack).append(sticker(t, c)));

  // ---- The shelf ----
  const toc = $('.toc');
  const ul = $('ul', toc);
  const makeSpine = (a, i) => {
    const text = a.textContent;
    a.setAttribute('aria-label', text);
    a.innerHTML = `<span class="vh-sp-top" aria-hidden="true">VHS</span><span class="vh-sp-text"></span><span class="vh-sp-num" aria-hidden="true">${i + 1}</span>`;
    $('.vh-sp-text', a).textContent = text;
  };
  const SPINE = [['#ed008e', '#fff'], ['#0d8f86', '#fff'], ['#d6a400', '#16101f'], ['#6a2bc2', '#fff'], ['#c83d12', '#fff'], ['#1565b5', '#fff']];
  $$('a', ul).forEach((a, i) => { makeSpine(a, i); a.style.setProperty('--s', SPINE[i][0]); a.style.setProperty('--t', SPINE[i][1]); });
  for (const a of $$('a', ul)) {
    a.addEventListener('click', () => {
      $$('li', ul).forEach((li) => li.classList.remove('is-out'));
      if (!calm()) a.parentElement.classList.add('is-out');
    });
  }
  const FAKES = [['NEON ALIBI', '#7a1c8c'], ['PASTEL JUSTICE', '#d24f7e'], ['LATE FEE', '#26364f'], ['BISCAYNE HEAT', '#a8541f'], ['TRACKING ERROR', '#3b5e4f'], ['RENTAL COPY', '#5c3a78'], ['MONDAY NIGHT', '#20518f'], ['SURF PATROL', '#1f7d78'], ['MINT CONDITION', '#4a7f6a'], ['HEAD CLEANER', '#6b6b78'], ['ONE MORE NIGHT', '#8c2f4f'], ['CASH ONLY', '#2f6b3a']];
  const fake = ([t, c]) => { const li = el('li', 'vh-fake', `<b style="--s:${c}"><span class="vh-sp-top">VHS</span><span class="vh-sp-text">${t}</span><span></span></b>`); li.setAttribute('aria-hidden', 'true'); return li; };
  const items = $$('li', ul);
  ul.prepend(fake(FAKES[0]), fake(FAKES[1]), fake(FAKES[2]));
  items[1].after(fake(FAKES[3]));
  items[2].after(fake(FAKES[4]), fake(FAKES[5]));
  items[4].after(fake(FAKES[6]));
  items[5].after(fake(FAKES[7]), fake(FAKES[8]), fake(FAKES[9]), fake(FAKES[10]), fake(FAKES[11]));
  const tocTitle = el('p', 'vh-toc-title', '<span>Browse the shelf</span><span>Bright spines are in stock</span>');
  tocTitle.setAttribute('aria-hidden', 'true');
  toc.prepend(tocTitle);

  // ---- Cover art ----
  const ART = {
    feel: `<defs><linearGradient id="vc1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#160a38"/><stop offset=".5" stop-color="#6a1a80"/><stop offset=".8" stop-color="#e8417f"/><stop offset="1" stop-color="#ff9e6b"/></linearGradient></defs><rect width="300" height="530" fill="url(#vc1)"/>
      <g fill="none" stroke="#ff4fb0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 4px #ff2d9e) drop-shadow(0 0 12px #ff2d9e)"><path d="M178 132c26-6 42 14 26 38-14 20-42 22-36 50 3 15 22 22 40 16"/><path d="M178 132c-14 2-22 12-34 28-2-14 8-34 28-40 14-3 30 2 38 16"/><path d="M208 236c36-6 62 18 54 46-8 26-44 34-74 20-22-10-28-34-20-52"/><path d="M204 318V400M204 400L188 412M222 318c0 24 22 28 22 44s-18 16-22 6"/></g>
      <circle cx="176" cy="130" r="3.500" fill="#fff"/>`,
    core: `<rect width="300" height="530" fill="#5ad5be"/><path d="M0 530V180L300 40V530Z" fill="#ff77b8"/><path d="M0 250L300 110V132L0 272Z" fill="#fff4e0" opacity=".8"/>
      <path d="M150 42c-10 0-14 8-10 14s12 4 10 14v8" fill="none" stroke="#2b1a5c" stroke-width="5" stroke-linecap="round"/><path d="M150 78L74 110h152Z" fill="none" stroke="#2b1a5c" stroke-width="5"/>
      <path d="M78 110c14-6 30-10 44-10l28 40 28-40c14 0 30 4 44 10l36 138-34 10-14-74v130H90V184l-14 74-34-10Z" fill="#fff0f6" stroke="#2b1a5c" stroke-width="3"/>
      <path d="M122 100l28 40 28-40c-10 26-14 60-14 130h-28c0-70-4-104-14-130Z" fill="#18c9bc"/><path d="M122 100L136 170 150 140ZM178 100L164 170 150 140Z" fill="#ffd9e8" stroke="#2b1a5c" stroke-width="2"/>
      <path d="M42 248l34 10 6-20-34-10ZM258 248l-34 10-6-20 34-10Z" fill="#ffc3dc" stroke="#2b1a5c" stroke-width="2"/>`,
    how: `<rect width="300" height="530" fill="#0b2a8a"/><g stroke="#3f6df0" stroke-width="1.5" opacity=".7">${[...Array(13).keys()].map((i) => `<path d="M${i * 25} 0V530"/>`).join('')}${[...Array(22).keys()].map((i) => `<path d="M0 ${i * 25}H300"/>`).join('')}</g>
      <rect x="28" y="66" width="244" height="110" rx="4" fill="#1a1a24" stroke="#f5df05" stroke-width="3"/><rect x="48" y="88" width="120" height="16" fill="#000" stroke="#555"/><rect x="48" y="118" width="74" height="26" fill="#04120a"/><text x="55" y="139" font-family="VT323, monospace" font-size="27" fill="#7dff8e">12:00</text>
      <g fill="#3b3845" stroke="#000">${[0, 1, 2, 3].map((k) => `<rect x="${178 + k * 21}" y="88" width="18" height="14"/>`).join('')}</g>
      <path d="M198 118l38 21-38 21z" fill="#f5df05"/>
      <text x="26" y="222" font-family="Bungee, sans-serif" font-size="30" fill="#f5df05">VOL. 1</text>`,
    palette: `<rect width="300" height="530" fill="#0b0810"/>${['#ed008e', '#ff8a00', '#f5df05', '#5ad5be', '#3f8bff', '#b79cff'].map((c, i) => `<path d="M-20 ${70 + i * 28}L320 ${10 + i * 28}V${36 + i * 28}L-20 ${96 + i * 28}Z" fill="${c}"/>`).join('')}
      <text x="150" y="304" text-anchor="middle" font-family="Bungee, sans-serif" font-size="58" font-style="italic" fill="#fff">E-180</text><text x="150" y="332" text-anchor="middle" font-family="VT323, monospace" font-size="24" fill="#cdc2e6">HIGH GRADE VIDEO CASSETTE</text>`,
    vibe: `<rect width="300" height="530" fill="#ed008e"/><g fill="#ff5fb4">${[...Array(10).keys()].map((i) => `<path d="M150 150L${150 + Math.cos(i * .628) * 420} ${150 + Math.sin(i * .628) * 420}L${150 + Math.cos(i * .628 + .3) * 420} ${150 + Math.sin(i * .628 + .3) * 420}Z"/>`).join('')}</g>
      <rect x="44" y="60" width="212" height="172" rx="16" fill="#1b0b33" stroke="#fff" stroke-width="4"/>${['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'].map((c, i) => `<rect x="${58 + i * 22}" y="76" width="22" height="104" fill="${c}"/>`).join('')}<rect x="58" y="180" width="154" height="24" fill="#111"/><circle cx="234" cy="108" r="11" fill="#555" stroke="#fff"/><circle cx="234" cy="150" r="11" fill="#555" stroke="#fff"/><path d="M92 60L60 26M208 60l32-34" stroke="#fff" stroke-width="4"/>
      <path d="M254 248l-26 42h18l-16 40 40-54h-20l18-28z" fill="#f5df05" stroke="#2b1a5c" stroke-width="2.5"/>`,
    refs: `<rect width="300" height="530" fill="#f5df05"/><path d="M150 46l28 58 64 9-46 45 11 63-57-30-57 30 11-63-46-45 64-9z" fill="#ed008e" stroke="#16101f" stroke-width="4"/><text x="150" y="140" text-anchor="middle" font-family="Bungee, sans-serif" font-size="27" fill="#fff" transform="rotate(-6 150 140)">STAFF</text><text x="150" y="172" text-anchor="middle" font-family="Bungee, sans-serif" font-size="27" fill="#fff" transform="rotate(-6 150 172)">PICKS</text>
`,
    related: `<rect width="300" height="530" fill="#3a0a22"/><g fill="#7a1035">${[...Array(10).keys()].map((i) => `<path d="M${i * 32} 0c8 180-8 340 0 530h24c-8-190 8-350 0-530z"/>`).join('')}</g><rect x="24" y="70" width="252" height="130" rx="8" fill="#16101f" stroke="#f5df05" stroke-width="4"/>${[...Array(15).keys()].map((i) => `<circle cx="${36 + i * 16.300}" cy="82" r="4" fill="#ffe9a0"/><circle cx="${36 + i * 16.300}" cy="188" r="4" fill="#ffe9a0"/>`).join('')}<text x="150" y="130" text-anchor="middle" font-family="Bungee, sans-serif" font-size="30" fill="#fff">COMING</text><text x="150" y="165" text-anchor="middle" font-family="Bungee, sans-serif" font-size="30" fill="#fff">SOON</text>`,
  };
  const COVERS = {
    feel: { tag: 'It came from the late-night shelf.', rate: 'R', run: '96 MIN', stick: 'NEW!', cls: '', ty: '57%', tgy: '77%', tsh: '#5a0a50' },
    core: { tag: 'Six elements. One look. No witnesses.', rate: 'PG', run: '6 ELEMENTS', stick: '$1.99', cls: 'y', ty: '62%', tgy: '79%', tsh: '#2b1a5c', tg: '#2b1a5c' },
    how: { tag: 'A step-by-step home video guide.', rate: 'G', run: '7 CHAPTERS', stick: '2 NIGHTS', cls: 'm', ty: '50%', tgy: '74%', tsh: '#0a1a5a', tg: '#fff4e0' },
    palette: { tag: 'Eight colours, sampled from the source.', rate: 'E', run: '180 MIN', stick: 'BLANK', cls: 'p', ty: '67%', tgy: '77%', tsh: '#2b1a5c', tg: '#fff4e0' },
    vibe: { tag: 'Now showing on the store TVs.', rate: 'PG', run: 'HI-FI', stick: 'HOT', cls: 'y', ty: '57%', tgy: '77%', tsh: '#5a0a50', tg: '#fff' },
    refs: { tag: 'Rent them all. Return them never.', rate: 'R', run: 'MIXED', stick: 'STAFF PICK', cls: 'p', ty: '48%', tgy: '74%', tsh: '#ed008e', tg: '#16101f' },
    related: { tag: 'If you liked this tape.', rate: 'NR', run: 'TBA', stick: 'SOON', cls: '', ty: '46%', tgy: '74%', tsh: '#16101f', tg: '#ffe9a0' },
  };
  const hiFi = 'HI-FI STEREO';
  for (const sec of $$('main > .sec')) {
    const c = COVERS[sec.id];
    if (!c) continue;
    const title = $('.sec-title', sec);
    const back = el('div', 'vh-back');
    while (sec.firstChild) back.append(sec.firstChild);
    title.remove();
    const cover = el('div', 'vh-cover', `<svg class="vh-art" viewBox="0 0 300 530" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${ART[sec.id]}</svg>
      <div class="vh-band" aria-hidden="true"><span>REWIND VIDEO</span><b>VHS</b></div>`);
    cover.style.cssText = `--ty:${c.ty};--tgy:${c.tgy};--tsh:${c.tsh};${c.tg ? `--tg:${c.tg};` : ''}`;
    cover.append(title);
    const tag = el('p', 'vh-tag');
    tag.textContent = c.tag;
    tag.setAttribute('aria-hidden', 'true');
    cover.append(tag);
    const bot = el('div', 'vh-bot', `<span class="vh-rate">${c.rate}</span><span>${hiFi}</span><span>${c.run}</span>`);
    bot.setAttribute('aria-hidden', 'true');
    cover.append(bot, sticker(c.stick, c.cls));
    sec.append(cover, back);
  }
  // ---- Tape effects ----
  const noiseTile = document.createElement('canvas');
  noiseTile.width = 256;
  noiseTile.height = 32;
  const nc = noiseTile.getContext('2d');
  const nd = nc.createImageData(256, 32);
  for (let i = 0; i < nd.data.length; i += 4) {
    const on = Math.random() < .34;
    const v = 150 + Math.random() * 105;
    nd.data[i] = v; nd.data[i + 1] = v; nd.data[i + 2] = v;
    nd.data[i + 3] = on ? 110 + Math.random() * 140 : 0;
  }
  nc.putImageData(nd, 0, 0);
  root.style.setProperty('--noise', `url(${noiseTile.toDataURL()})`);

  const osd = $('.vh-osd');
  const strips = $$('.vh-strip');
  const page = $('.page');
  let rewinding = false;
  let state = '';
  let vel = 0;
  let y = scrollY;
  let raf = 0;
  let lastMove = 0;
  let lastJitter = 0;
  let osdTimer;
  const fmt = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const secs = Math.round((scrollY / max) * 96 * 60);
    return `SP ${Math.floor(secs / 3600)}:${String(Math.floor(secs / 60) % 60).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  };
  const showOsd = (word, keep) => {
    if (!osd) return;
    $('b', osd).textContent = word;
    $('span', osd).textContent = fmt();
    osd.classList.add('on');
    clearTimeout(osdTimer);
    if (!keep) osdTimer = setTimeout(() => osd.classList.remove('on'), 1700);
  };
  const setState = (s) => {
    if (s === state) return;
    state = s;
    if (s === 'play') {
      delete root.dataset.tape;
      page.style.removeProperty('translate');
      showOsd('▶ PLAY');
    } else {
      root.dataset.tape = s;
      showOsd(s === 'ff' ? '▶▶ FF' : '◀◀ REW', true);
    }
  };
  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    const ny = scrollY;
    const dy = ny - y;
    y = ny;
    if (dy !== 0) lastMove = now;
    vel += (dy - vel) * .24;
    const speed = Math.abs(vel);
    if (speed > 24 || rewinding) setState(vel > 0 && !rewinding ? 'ff' : 'rew');
    else if (speed < 7 && state && state !== 'play') setState('play');
    if (state === 'ff' || state === 'rew') {
      if (osd) $('span', osd).textContent = fmt();
      if (now - lastJitter > 70) {
        lastJitter = now;
        for (const s of strips) {
          s.style.top = `${Math.random() * 96}%`;
          s.style.height = `${8 + Math.random() * 36}px`;
          s.style.backgroundPosition = `${Math.random() * 256}px ${Math.random() * 32}px`;
          s.style.transform = `translateX(${(Math.random() - .5) * 24}px)`;
        }
        page.style.translate = `${((Math.random() - .5) * 2.4).toFixed(1)}px 0`;
      }
    }
    if (!rewinding && now - lastMove > 500 && speed < .3) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
  const wake = () => { if (!raf && !calm()) { lastMove = performance.now(); raf = requestAnimationFrame(tick); } };
  addEventListener('scroll', wake, { passive: true });
  addEventListener('eas:calm', () => {
    if (calm()) {
      cancelAnimationFrame(raf);
      raf = 0;
      delete root.dataset.tape;
      state = '';
      page.style.removeProperty('translate');
    }
  });
  if (!calm()) { state = 'play'; showOsd('▶ PLAY'); }

  // ---- Be kind, rewind ----
  const toastEl = $('[data-toast]');
  let toastTimer;
  const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2600); };
  const foot = $('.foot');
  const counter = el('div', 'vh-counter', `<div><h2>Be kind, rewind</h2><p>Please return this page to the start for the next member. Late fees are $1 a night.</p></div>
    <button class="vh-rewind" type="button" aria-label="Rewind to the top of the page">◀◀ REW</button>`);
  foot.prepend(counter);
  $('.vh-rewind', counter).addEventListener('click', () => {
    $$('li', ul).forEach((li) => li.classList.remove('is-out'));
    if (calm()) { scrollTo({ top: 0, behavior: 'auto' }); toast('Thanks for rewinding. No late fee.'); return; }
    const start = scrollY;
    const dur = Math.max(1400, Math.min(3400, start * .32));
    const t0 = performance.now();
    rewinding = true;
    wake();
    const step = (now) => {
      const u = Math.min(1, (now - t0) / dur);
      const e = u < .5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
      scrollTo({ top: start * (1 - e), behavior: 'instant' });
      if (u < 1) requestAnimationFrame(step);
      else {
        rewinding = false;
        toast('Thanks for rewinding. No late fee.');
      }
    };
    requestAnimationFrame(step);
  });
})();
