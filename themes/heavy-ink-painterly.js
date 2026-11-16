// Heavy Ink / Painted Comic: a portrait card on the splash page, lit by one light from the upper left. Its slider spots
// the blacks: the same shadow shapes go from soft painted values to flat, hard black that joins into big masses.
// How: the shadow shapes are blurred and then thresholded (feGaussianBlur, then a steep feFuncA). A wide blur with a
// gentle slope gives soft painted shading; a narrow blur with a steep slope gives crisp black edges, and lowering the
// threshold lets neighbouring shapes merge. A hot rim appears where the figure's black meets the wall's black.
// The readout weighs every pixel of what is on screen by how close it is to black, so it climbs as the shadows darken.
(() => {
  const root = document.documentElement;
  const hero = document.querySelector('.hero-text');
  if (!hero) return;
  const isCalm = () => Boolean(root.dataset.calm);

  // ---- the portrait (viewBox 300 x 400) ----
  const FIG = 'M100,128 C97,96 104,64 122,52 C140,42 176,41 193,51 C207,61 209,96 207,126 Z M44,140 C66,121 118,113 160,114 C204,115 244,121 258,133 C254,143 236,148 204,149 C158,151 96,152 44,140 Z M104,146 L206,146 C214,158 219,175 219,192 C220,214 214,236 206,258 L210,300 C240,306 276,320 300,336 L300,400 L0,400 L0,352 C30,332 68,318 98,306 L128,298 L130,276 C120,274 110,272 105,265 C100,258 100,250 103,244 C99,240 97,236 99,231 C97,228 96,224 98,219 C95,216 91,214 87,211 C83,208 84,205 87,202 L99,178 C98,170 99,160 104,146 Z';
  const FACE = 'M104,146 L206,146 C214,158 219,175 219,192 C220,214 214,236 206,258 L210,302 L128,302 L130,276 C120,274 110,272 105,265 C100,258 100,250 103,244 C99,240 97,236 99,231 C97,228 96,224 98,219 C95,216 91,214 87,211 C83,208 84,205 87,202 L99,178 C98,170 99,160 104,146 Z';
  const portrait = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" role="img" aria-labelledby="hi-alt">
<title id="hi-alt">A man in a hat, drawn for this page, lit by one light from the upper left. The slider turns his shadows from soft painted tones into solid black shapes.</title>
<defs>
  <radialGradient id="hi-wall" cx="16%" cy="10%" r="100%"><stop offset="0" stop-color="#f8b552"/><stop offset=".33" stop-color="#cf5d2c"/><stop offset=".72" stop-color="#7e2c19"/><stop offset="1" stop-color="#47150c"/></radialGradient>
  <linearGradient id="hi-skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2c69c"/><stop offset=".6" stop-color="#d69c6d"/><stop offset="1" stop-color="#a96b45"/></linearGradient>
  <linearGradient id="hi-hat" x1="0" y1="0" x2="1" y2=".4"><stop offset="0" stop-color="#8f7f5b"/><stop offset="1" stop-color="#4c412e"/></linearGradient>
  <linearGradient id="hi-coat" x1="0" y1="0" x2="1" y2=".3"><stop offset="0" stop-color="#739586"/><stop offset=".7" stop-color="#3e5a52"/><stop offset="1" stop-color="#2a3d38"/></linearGradient>
  <filter id="hi-spot" x="0" y="0" width="300" height="400" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="1.3" result="b"/>
    <feComponentTransfer in="b" result="t"><feFuncA type="linear" slope="16" intercept="-5.26"/></feComponentTransfer>
    <feFlood flood-color="#010100" result="f"/>
    <feComposite in="f" in2="t" operator="in"/>
  </filter>
  <mask id="hi-wallonly" maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="400"><rect width="300" height="400" fill="#fff"/><path d="${FIG}" fill="#000"/></mask>
</defs>
<rect width="300" height="400" fill="url(#hi-wall)"/>
<g fill="none" stroke-linecap="round" opacity=".3">
  <path d="M6,34 C56,24 108,32 152,22" stroke="#ffe0a0" stroke-width="18"/>
  <path d="M-4,82 C26,72 58,80 82,70" stroke="#ffd58a" stroke-width="12"/>
  <path d="M12,236 C30,226 50,232 70,222" stroke="#f39a52" stroke-width="10"/>
  <path d="M214,26 C246,38 270,30 304,42" stroke="#a83a20" stroke-width="18"/>
  <path d="M240,200 C262,210 280,204 304,214" stroke="#6a2414" stroke-width="16"/>
</g>
<path d="${FACE}" fill="url(#hi-skin)"/>
<path d="M196,148 C212,152 219,170 219,192 C220,214 214,236 206,258 L200,254 C206,232 208,208 205,186 C203,168 200,156 196,148 Z" fill="#3b2a1f"/>
<path d="M186,190 C190,180 199,179 204,187 C208,199 207,215 202,227 C198,237 190,238 186,232 C190,224 190,212 187,203 Z" fill="#dba276"/>
<path d="M0,400 L0,352 C30,332 68,318 98,306 L128,298 L210,300 C240,306 276,320 300,336 L300,400 Z" fill="url(#hi-coat)"/>
<path d="M128,300 L100,262 C90,282 90,306 96,326 L122,354 L134,318 Z" fill="#82a698"/>
<path d="M208,300 L224,252 C236,274 238,302 232,328 L214,350 L204,322 Z" fill="#4c6c62"/>
<path d="M100,128 C97,96 104,64 122,52 C140,42 176,41 193,51 C207,61 209,96 207,126 Z" fill="url(#hi-hat)"/>
<path d="M101,112 C135,108 175,108 207,112 L207,127 C170,124 135,124 100,128 Z" fill="#2c2219"/>
<path d="M44,140 C66,121 118,113 160,114 C204,115 244,121 258,133 C254,143 236,148 204,149 C158,151 96,152 44,140 Z" fill="url(#hi-hat)"/>
<g class="hi-shadow" filter="url(#hi-spot)">
  <g mask="url(#hi-wallonly)"><path d="${FIG}" transform="translate(80,22)"/></g>
  <path d="M210,-2 L302,-2 L302,96 C284,88 266,74 252,56 C236,36 222,16 210,-2 Z"/>
  <path d="M0,352 C26,360 52,350 80,362 C100,370 114,382 122,400 L0,400 Z"/>
  <path d="M58,326 C74,340 86,356 92,374 L70,366 C68,352 64,340 58,326 Z"/>
  <path d="M130,300 L208,300 C204,336 196,370 182,400 L118,400 C126,372 132,338 130,300 Z"/>
  <path d="M168,52 C186,46 196,52 200,60 C208,74 209,100 207,126 L176,126 C182,100 180,72 168,52 Z"/>
  <path d="M60,141 C110,150 170,150 230,146 C246,144 254,140 258,134 C250,148 236,152 206,153 C150,156 96,154 60,141 Z"/>
  <path d="M100,146 L212,146 L216,178 C200,182 188,180 178,186 C164,190 150,184 138,190 C126,194 114,186 104,190 L99,178 Z"/>
  <path fill-rule="evenodd" d="M164,186 C170,196 172,204 168,214 C163,228 158,246 154,262 L186,250 L190,236 L188,196 L186,186 Z M172,200 C178,198 182,204 182,212 C181,220 176,226 170,226 C172,216 173,208 172,200 Z"/>
  <path d="M186,200 C192,196 199,197 203,203 C205,213 202,224 197,231 C193,235 189,234 187,230 Z"/>
  <path d="M196,148 C212,152 219,170 219,192 C220,214 214,236 206,258 L198,252 C204,232 206,208 203,188 Z"/>
  <path d="M99,203 C107,205 117,212 123,221 C114,223 106,221 99,216 Z"/>
  <path d="M101,240 C107,240 113,242 117,247 C111,249 105,248 102,246 Z"/>
  <path d="M106,266 C122,276 148,270 170,262 L206,256 L210,312 L142,312 C140,298 136,288 128,284 C118,280 110,276 106,266 Z"/>
  <path d="M206,300 C240,308 276,322 300,338 L300,400 L178,400 C192,372 200,340 206,300 Z"/>
  <path d="M96,326 L122,354 L134,320 L128,302 Z"/>
  <path d="M122,356 C114,372 108,386 106,400 L118,400 C120,386 126,370 134,358 Z"/>
  <path d="M26,354 C40,364 48,382 50,400 L40,400 C38,384 34,368 26,354 Z"/>
</g>
<g class="hi-lines" fill="none" stroke="#010100" stroke-linecap="round" stroke-linejoin="round">
  <path d="M100,128 C97,96 104,64 122,52 C140,42 176,41 193,51 C207,61 209,96 207,126" stroke-width="3"/>
  <path d="M44,140 C66,121 118,113 160,114 C204,115 244,121 258,133 C254,143 236,148 204,149 C158,151 96,152 44,140 Z" stroke-width="3.2"/>
  <path d="M104,190 L99,178 L87,202 C84,205 83,208 87,211 C91,214 95,216 98,219" stroke-width="2.4"/>
  <path d="M98,219 C96,224 97,228 99,231 C97,236 99,240 103,244 C100,250 100,258 105,265 C110,272 120,274 130,276" stroke-width="2.4"/>
  <path d="M99,231 C104,232 108,232 112,231" stroke-width="2"/>
  <path d="M130,276 L128,300 M206,258 L210,300" stroke-width="3"/>
  <path d="M186,190 C190,180 199,179 204,187 C208,199 207,215 202,227 C198,237 190,238 186,232" stroke-width="3"/>
  <path d="M128,300 L100,262 C90,282 90,306 96,326 L122,354 L134,318 Z" stroke-width="3"/>
  <path d="M208,300 L224,252 C236,274 238,302 232,328 L214,350" stroke-width="4"/>
  <path d="M0,352 C30,332 68,318 96,308 M232,312 C258,318 282,326 300,336" stroke-width="3"/>
</g>
<g class="hi-rim" fill="none" stroke="#ffd15b" stroke-linecap="round" stroke-linejoin="round">
  <path d="M190,50 C204,58 209,92 207,126" stroke-width="2.6"/>
  <path d="M232,140 C244,138 252,136 257,133" stroke-width="2"/>
  <path d="M208,150 C216,162 220,178 220,194 C220,216 214,238 207,258 L210,300" stroke-width="2.6"/>
  <path d="M212,301 C244,307 276,320 299,335" stroke-width="2.4"/>
</g>
</svg>`;

  const card = document.createElement('figure');
  card.className = 'hi-card';
  card.innerHTML = `<div class="hi-frame">${portrait}</div>
  <figcaption class="hi-plate">
    <span class="hi-name">Spot the blacks</span>
    <span class="hi-how">One light, from the upper left. Drag to turn soft painted shadows into flat black shapes.</span>
    <input class="hi-range" type="range" min="0" max="100" step="1" value="100" aria-label="Shadows, from soft painted tones to solid black">
    <span class="hi-ends" aria-hidden="true"><span>Painted values</span><span>Solid black</span></span>
    <output class="hi-read" aria-live="polite"><span class="hi-read-text"></span><span class="hi-meter" aria-hidden="true" hidden><i></i></span></output>
  </figcaption>`;
  hero.append(card);

  const svg = card.querySelector('svg');
  const blur = svg.querySelector('feGaussianBlur');
  const funcA = svg.querySelector('feFuncA');
  const flood = svg.querySelector('feFlood');
  const shadow = svg.querySelector('.hi-shadow');
  const lines = svg.querySelector('.hi-lines');
  const rim = svg.querySelector('.hi-rim');
  const range = card.querySelector('.hi-range');
  const readText = card.querySelector('.hi-read-text');
  const meter = card.querySelector('.hi-meter');

  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mix = (c1, c2, t) => { const a = hex(c1); const b = hex(c2); return `#${a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join('')}`; };

  // p = 0: soft painted values. p = 1: solid black with crisp edges.
  const paint = (p) => {
    const k = lerp(1, 16, Math.pow(p, 1.4));
    const threshold = lerp(0.5, 0.22, p);
    blur.setAttribute('stdDeviation', lerp(5, 1.3, p).toFixed(2));
    funcA.setAttribute('slope', k.toFixed(3));
    funcA.setAttribute('intercept', (0.5 - k * threshold).toFixed(3));
    // The shadow colour darkens over the whole slider (fast at first, then easing into black), so the count climbs with it.
    flood.setAttribute('flood-color', mix('#6a3220', '#010100', 1 - Math.pow(1 - p, 1.5)));
    shadow.setAttribute('opacity', lerp(0.62, 1, smooth(0, 0.6, p)).toFixed(3));
    lines.setAttribute('stroke', mix('#6b3d26', '#010100', smooth(0.2, 0.8, p)));
    lines.setAttribute('opacity', lerp(0.22, 1, smooth(0.1, 0.9, p)).toFixed(3));
    rim.setAttribute('opacity', smooth(0.65, 1, p).toFixed(3));
    range.setAttribute('aria-valuetext', p < 0.34 ? 'Soft painted shadows' : p < 0.7 ? 'Darker, firmer shadows' : 'Solid black shapes');
  };

  // ---- how much of the picture is in black shadow: drawn small on a canvas and weighed ----
  // Each pixel counts in full when it is black and fades out of the count as its brightest channel nears 90 of 255,
  // so the number rises steadily as the shadows darken instead of jumping when they cross one cut-off.
  let measuring = 0;
  const clearRead = () => { measuring++; readText.textContent = ''; meter.hidden = true; };
  const measure = () => {
    const id = ++measuring;
    try {
      const src = new XMLSerializer().serializeToString(svg);
      const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml' }));
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (id !== measuring) return;
        try {
          const c = document.createElement('canvas');
          c.width = 150; c.height = 200;
          const g = c.getContext('2d', { willReadFrequently: true });
          g.drawImage(img, 0, 0, 150, 200);
          const d = g.getImageData(0, 0, 150, 200).data;
          let black = 0;
          for (let i = 0; i < d.length; i += 4) {
            const lit = Math.max(d[i], d[i + 1], d[i + 2]);
            if (lit < 90) black += 1 - lit / 90;
          }
          const pc = Math.round((black / (150 * 200)) * 100);
          readText.innerHTML = `<b>${pc}%</b> of the picture is in black shadow`;
          meter.style.setProperty('--black-pc', `${pc}%`);
          meter.hidden = false;
        } catch { readText.textContent = ''; meter.hidden = true; }
      };
      img.onerror = () => { URL.revokeObjectURL(url); };
      img.src = url;
    } catch { /* no measurement on this browser */ }
  };

  let frame = 0;
  const fromRange = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => paint(range.value / 100));
  };
  let settle = 0;
  const measureSoon = () => { clearTimeout(settle); settle = setTimeout(measure, 140); };

  // ---- the first look: the portrait inks itself once as it comes into view ----
  let intro = 0;
  const stopIntro = () => { if (intro) { cancelAnimationFrame(intro); intro = 0; } };
  const runIntro = () => {
    if (isCalm()) return;
    // No count while the picture changes: an earlier count (or one still loading) would describe another picture.
    clearTimeout(settle);
    clearRead();
    const t0 = performance.now();
    const dur = 2200;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const p = t < 0.18 ? 0 : (t - 0.18) / 0.82;
      const e = 1 - Math.pow(1 - p, 3);
      range.value = String(Math.round(e * 100));
      paint(e);
      if (t < 1) intro = requestAnimationFrame(step);
      else { intro = 0; range.value = '100'; paint(1); measure(); }
    };
    paint(0);
    range.value = '0';
    intro = requestAnimationFrame(step);
  };

  range.addEventListener('input', () => { stopIntro(); fromRange(); measureSoon(); });
  // Grabbing the thumb stops a running intro where it is; count that picture, since no input event may follow.
  range.addEventListener('pointerdown', () => { if (intro) { stopIntro(); measureSoon(); } });
  addEventListener('eas:calm', () => {
    if (isCalm() && intro) { stopIntro(); range.value = '100'; paint(1); measure(); }
  });

  paint(1);
  // The count and the first inking wait until the page has loaded and settled, so they never compete with first paint.
  const afterLoad = (fn) => {
    const go = () => setTimeout(fn, 300);
    if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
  };
  afterLoad(() => {
    if (isCalm() || !('IntersectionObserver' in window)) { measure(); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); requestAnimationFrame(runIntro); }
    }, { threshold: 0.45 });
    io.observe(card);
    // Scrolled past already: no intro, just the count.
    setTimeout(() => { if (!intro && range.value === '100') measure(); }, 400);
  });
})();
