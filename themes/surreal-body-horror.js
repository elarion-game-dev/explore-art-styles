// Surreal Body Horror: the page has a pulse. A heart in the hero drives the veins along every panel and the edges of the screen,
// and it speeds up when you scroll in a hurry, then settles again. Panel edges breathe through an SVG filter.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const make = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const rng = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // ---- Filters ----
  const wet = (id, warp, blur, soft, surf) => `<filter id="${id}" x="-6%" y="-14%" width="112%" height="128%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".014 .022" numOctaves="2" seed="11" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="${warp}" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feGaussianBlur in="d" stdDeviation="${blur}" result="b"/>
      <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -7" result="g"/>
      <feTurbulence type="fractalNoise" baseFrequency=".5" numOctaves="2" seed="3" result="fine"/>
      <feColorMatrix in="fine" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .13 0" result="pores"/>
      <feGaussianBlur in="g" stdDeviation="${soft}" result="alpha"/>
      <feComposite in="alpha" in2="pores" operator="arithmetic" k1="0" k2="1" k3="-.5" k4="0" result="bump"/>
      <feDiffuseLighting in="bump" surfaceScale="${surf}" diffuseConstant="1.15" lighting-color="#fff4e6" result="df"><feDistantLight azimuth="240" elevation="50"/></feDiffuseLighting>
      <feComposite in="df" in2="g" operator="in" result="lit"/>
      <feBlend in="lit" in2="g" mode="multiply" result="body"/>
      <feSpecularLighting in="bump" surfaceScale="${surf * 1.25}" specularConstant=".95" specularExponent="26" lighting-color="#fff0dc" result="sp"><feDistantLight azimuth="235" elevation="56"/></feSpecularLighting>
      <feComposite in="sp" in2="g" operator="in" result="shine"/>
      <feComposite in="body" in2="shine" operator="arithmetic" k1="0" k2="1" k3=".82" k4="0"/>
    </filter>`;
  const defs = make('div', '', `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
    <filter id="sb-edge" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="15" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="sb-edge-live" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="2" seed="7" result="n"/><feDisplacementMap id="sb-live-map" in="SourceGraphic" in2="n" scale="15" xChannelSelector="R" yChannelSelector="G"/></filter>
    ${wet('sb-wet', 8, 1.6, 3, 7)}
    ${wet('sb-wet-2', 5, 1.1, 2.3, 5)}
    ${wet('sb-wet-s', 3, 1, 1.8, 4)}
  </defs></svg>`);
  document.body.prepend(defs.firstElementChild);
  const liveMap = $('#sb-live-map');

  // ---- Numbered plates ----
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  $$('.sec').forEach((s, i) => { const t = $('.sec-title', s); if (t) t.before(make('span', 'sb-plate-no', `plate ${ROMAN[i]}`)); });
  $$('.toc li').forEach((li) => { li.style.counterIncrement = 'plate'; });

  // ---- Veins along the edges of every membrane ----
  const SKIN = '.feel-body, .origins, .core-item, .steps, .learn, .tracks, .ref-list, .sources, .toc, .hero-gallery .shot, .loop';
  function grow(svg, w, h, seed, opts = {}) {
    const R = rng(seed);
    const reach = opts.reach ?? 32;
    const trunks = opts.trunks ?? Math.round(Math.max(3, (w + h) / 170));
    for (let i = 0; i < trunks; i++) {
      const side = Math.floor(R() * 4);
      const along = side % 2 === 0 ? w : h;
      const start = R() * along;
      const dir = R() < .5 ? -1 : 1;
      const len = 70 + R() * Math.min(420, along * .55);
      const toXY = (a, inset) => (side === 0 ? [a, inset] : side === 1 ? [w - inset, a] : side === 2 ? [a, h - inset] : [inset, a]);
      const walk = (a0, in0, length, wid, depth, col) => {
        let a = a0;
        let ins = in0;
        let d = `M${toXY(a, ins).map((v) => v.toFixed(1)).join(' ')}`;
        const step = 12;
        const n = Math.max(3, Math.floor(length / step));
        let drift = (R() - .3) * 2.4;
        for (let k = 0; k < n; k++) {
          a += dir * step * (.8 + R() * .5);
          drift += (R() - .5) * 2;
          drift = Math.max(-3.4, Math.min(3.4, drift));
          ins = Math.max(1, Math.min(reach, ins + drift));
          const [x, y] = toXY(a, ins);
          if (x < -2 || y < -2 || x > w + 2 || y > h + 2) break;
          d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
          if (depth > 0 && R() < .17) walk(a, ins, length * (.3 + R() * .3), wid * .62, depth - 1, col);
        }
        svg.append(sv('path', { d, stroke: col, 'stroke-width': wid.toFixed(2), 'stroke-opacity': opts.op ?? .62 }));
      };
      const blue = R() < .3;
      walk(start, 2 + R() * 6, len, (opts.wid ?? 2.3) * (.7 + R() * .6), 2, blue ? '#3d3f63' : '#6e1c16');
    }
  }
  const panels = [];
  const glow = new IntersectionObserver((es) => {
    for (const e of es) { e.target.classList.toggle('sb-on', e.isIntersecting); e.target.dataset.vis = e.isIntersecting ? '1' : ''; }
  }, { rootMargin: '10% 0px' });
  $$(SKIN).forEach((el, i) => {
    const s = sv('svg', { class: 'sb-veins', 'aria-hidden': 'true' });
    el.prepend(s);
    el.append(make('i', 'sb-dent'));
    el.style.setProperty('--br', `${6 + (i * 1.7) % 3.5}s`);
    el.style.setProperty('--bd', `${-(i * 1.3) % 5}s`);
    panels.push({ el, s, seed: 40 + i * 13 });
    glow.observe(el);
  });
  function paintVeins() {
    for (const p of panels) {
      const w = p.el.offsetWidth;
      const h = p.el.offsetHeight;
      if (!w || !h) continue;
      p.s.textContent = '';
      p.s.setAttribute('viewBox', `0 0 ${w} ${h}`);
      p.s.setAttribute('preserveAspectRatio', 'none');
      const thin = p.el.matches('.hero-gallery .shot, .loop');
      grow(p.s, w, h, p.seed, thin ? { reach: 5, trunks: 3, wid: 1.5, op: .5 } : { reach: w < 560 ? 12 : Math.min(30, Math.min(w, h) * .14) });
    }
  }

  // Pressing into a panel dents it.
  document.addEventListener('pointermove', (ev) => {
    const el = ev.target.closest?.(SKIN);
    if (sbHover && sbHover !== el) sbHover.classList.remove('sb-hover');
    sbHover = el;
    if (!el || isCalm()) return;
    const r = el.getBoundingClientRect();
    el.classList.add('sb-hover');
    const dent = el.querySelector(':scope > .sb-dent');
    if (dent) { dent.style.setProperty('--mx', `${ev.clientX - r.left}px`); dent.style.setProperty('--my', `${ev.clientY - r.top}px`); }
  }, { passive: true });
  let sbHover = null;

  // ---- The heart ----
  const heart = make('div', 'sb-heart', `<svg viewBox="0 0 200 250" aria-hidden="true">
    <defs><linearGradient id="sb-hg" x1=".2" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#d8895c"/><stop offset=".55" stop-color="#b35138"/><stop offset="1" stop-color="#6c2219"/></linearGradient></defs>
    <path d="M76 88 C66 56 42 48 18 60" fill="none" stroke="#a24a35" stroke-width="20" stroke-linecap="round"/>
    <path d="M132 82 C142 56 168 54 188 70" fill="none" stroke="#6b5a78" stroke-width="16" stroke-linecap="round"/>
    <path d="M98 90 C90 46 118 18 150 30" fill="none" stroke="#c97a55" stroke-width="28" stroke-linecap="round"/>
    <path d="M116 30 L112 6" fill="none" stroke="#c97a55" stroke-width="12" stroke-linecap="round"/>
    <path d="M134 22 L138 2" fill="none" stroke="#c97a55" stroke-width="11" stroke-linecap="round"/>
    <path d="M100 74 C142 56 182 88 172 134 C164 176 132 214 96 240 C60 212 26 174 24 130 C22 90 60 58 100 74 Z" fill="url(#sb-hg)"/>
    <g fill="none" stroke="#5a1710" stroke-linecap="round">
      <path d="M110 84 C96 116 122 146 98 206" stroke-width="5"/>
      <path d="M108 118 C126 124 142 136 150 158" stroke-width="3.6"/>
      <path d="M104 148 C86 156 72 168 64 190" stroke-width="3.2"/>
      <path d="M72 96 C58 112 50 130 50 150" stroke-width="3.4"/>
    </g>
    <g fill="none" stroke="#3d3f63" stroke-opacity=".8" stroke-linecap="round"><path d="M140 92 C150 112 152 124 148 138" stroke-width="3"/><path d="M84 124 C78 138 80 150 74 160" stroke-width="2.4"/></g>
  </svg>`);
  const gallery = $('.hero-gallery');
  gallery.append(heart);
  const vessels = sv('svg', { class: 'sb-vessels', 'aria-hidden': 'true' });
  gallery.prepend(vessels);
  const pulsePaths = [];
  function paintVessels() {
    const w = gallery.offsetWidth;
    const h = gallery.offsetHeight;
    if (!w || !h) return;
    vessels.textContent = '';
    pulsePaths.length = 0;
    vessels.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const cx = w / 2;
    const cy = h / 2;
    const R = rng(9);
    const wob = (n) => (R() - .5) * n;
    const ends = [
      `M${cx} ${cy} C${cx + wob(14)} ${cy * .68} ${cx + wob(18)} ${cy * .36} ${cx + wob(10)} 6`,
      `M${cx} ${cy} C${cx + wob(14)} ${cy * 1.32} ${cx + wob(18)} ${cy * 1.64} ${cx + wob(10)} ${h - 6}`,
      `M${cx} ${cy} C${cx * .7} ${cy + wob(12)} ${cx * .34} ${cy + wob(16)} 8 ${cy + wob(10)}`,
      `M${cx} ${cy} C${cx * 1.3} ${cy + wob(12)} ${cx * 1.66} ${cy + wob(16)} ${w - 8} ${cy + wob(10)}`,
    ];
    ends.forEach((d, i) => {
      vessels.append(sv('path', { d, stroke: '#1d0704', 'stroke-width': 13 }));
      vessels.append(sv('path', { d, stroke: i % 2 ? '#a24a35' : '#7a2a1e', 'stroke-width': 9 }));
      vessels.append(sv('path', { d, stroke: '#e8a884', 'stroke-opacity': .34, 'stroke-width': 2.2, transform: 'translate(-1.4 -1.6)' }));
      const p = sv('path', { d, stroke: '#ffd9b0', 'stroke-opacity': 0, 'stroke-width': 7 });
      vessels.append(p);
      pulsePaths.push(p);
    });
  }

  // ---- The specimen in the core section ----
  const fingers = [84, 93, 102, 111, 120, 129].map((x, i) => {
    const len = [34, 42, 47, 46, 42, 32][i];
    return `<path d="M${x} 262 C${x - 3} ${262 + len * .4} ${x - 5} ${262 + len * .75} ${x - 3} ${262 + len}" stroke="#190a05" stroke-width="10.5" stroke-linecap="round" fill="none"/><path d="M${x} 262 C${x - 3} ${262 + len * .4} ${x - 5} ${262 + len * .75} ${x - 3} ${262 + len}" stroke="#cf8e62" stroke-width="7.6" stroke-linecap="round" fill="none"/><path d="M${x - 4.6} ${258 + len} l3 1" stroke="#efe3cf" stroke-width="3" stroke-linecap="round"/>`;
  }).join('');
  const ribs = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const y = 76 + i * 28;
    const x = 332 - i * 2.2;
    const reach = 84 + i * 15;
    const drop = 44 + i * 3;
    const d = `M${x} ${y} C${x - 34} ${y - 30} ${x - reach} ${y - 22} ${x - reach - 8} ${y + drop}`;
    return `<path d="${d}" stroke="#190a05" stroke-width="10.5" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#efe3cf" stroke-width="7" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#b8a287" stroke-width="1.4" fill="none" transform="translate(1.5 2)"/>`;
  }).join('');
  const specimen = make('li', 'sb-specimen', `<svg viewBox="30 30 390 590" role="img" aria-label="An engraving of a chair whose back is a ribcage and spine. It has a human arm with six fingers, a soft upholstered seat that breathes, and one leg wrapped in bandage.">
    <defs>
      <pattern id="sb-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><line x1="0" y1="0" x2="0" y2="5" stroke="#190a05" stroke-width="1.15"/></pattern>
      <pattern id="sb-hatch2" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-52)"><line x1="0" y1="0" x2="0" y2="4" stroke="#190a05" stroke-width="1"/></pattern>
      <linearGradient id="sb-wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8e5a35"/><stop offset=".45" stop-color="#b98a58"/><stop offset="1" stop-color="#5e371d"/></linearGradient>
      <radialGradient id="sb-cush" cx=".4" cy=".28" r=".85"><stop offset="0" stop-color="#ecb78b"/><stop offset=".55" stop-color="#c8783f"/><stop offset="1" stop-color="#7a3c1f"/></radialGradient>
    </defs>
    <ellipse cx="210" cy="600" rx="150" ry="11" fill="url(#sb-hatch)" opacity=".55"/>
    <!-- back leg -->
    <path d="M286 372 C294 440 306 520 316 594 L296 596 C286 520 272 440 264 372 Z" fill="url(#sb-wood)" stroke="#190a05" stroke-width="3"/>
    <path d="M286 372 C294 440 306 520 316 594 L306 595 C296 520 284 440 276 372 Z" fill="url(#sb-hatch2)" opacity=".55"/>
    <path d="M268 410 C284 430 288 470 298 500 M296 400 C300 440 312 470 310 520" fill="none" stroke="#6e1c16" stroke-width="2.2"/>
    <path d="M275 468 C284 476 298 476 306 462 M277 482 C286 490 300 490 308 476 M279 496 C288 504 302 504 310 490 M281 510 C290 518 304 518 312 504 M283 524 C292 532 306 532 314 518" fill="none" stroke="#190a05" stroke-width="10.5"/>
    <path d="M275 468 C284 476 298 476 306 462 M277 482 C286 490 300 490 308 476 M279 496 C288 504 302 504 310 490 M281 510 C290 518 304 518 312 504 M283 524 C292 532 306 532 314 518" fill="none" stroke="#efe3cf" stroke-width="8"/>
    <!-- spine -->
    <path d="M300 372 C352 300 356 170 336 50" fill="none" stroke="#190a05" stroke-width="24" stroke-linecap="round"/>
    <path d="M300 372 C352 300 356 170 336 50" fill="none" stroke="#efe3cf" stroke-width="18" stroke-dasharray="15 4"/>
    ${ribs}
    <path d="M338 44 l-6 -12 l14 -2 l4 12 Z" fill="#efe3cf" stroke="#190a05" stroke-width="3" stroke-linejoin="round"/>
    <!-- seat frame -->
    <path d="M92 352 L316 352 L314 382 L96 382 Z" fill="url(#sb-wood)" stroke="#190a05" stroke-width="3"/>
    <path d="M96 370 L314 370 L314 382 L96 382 Z" fill="url(#sb-hatch)" opacity=".7"/>
    <!-- the seat, which breathes -->
    <path class="sb-seat" d="M84 340 C78 306 138 294 200 296 C268 296 326 304 326 336 C330 362 264 366 202 366 C140 366 88 366 84 340 Z" fill="url(#sb-cush)" stroke="#190a05" stroke-width="3.2"/>
    <path d="M120 312 C150 304 190 302 220 304" fill="none" stroke="#fff4e6" stroke-width="5" stroke-linecap="round" opacity=".75"/>
    <path d="M128 340 C160 350 240 352 290 340" fill="none" stroke="#6e1c16" stroke-width="2" opacity=".75"/>
    <path d="M216 322 C234 332 252 330 272 326 M238 330 C244 340 258 342 268 344" fill="none" stroke="#3d3f63" stroke-width="1.7" opacity=".85"/>
    <!-- arm support and arm -->
    <path d="M146 300 L140 248 L160 248 L166 300 Z" fill="url(#sb-wood)" stroke="#190a05" stroke-width="3"/>
    <path d="M326 208 C270 192 200 222 118 242" fill="none" stroke="#190a05" stroke-width="35" stroke-linecap="round"/>
    <path d="M326 208 C270 192 200 222 118 242" fill="none" stroke="#cf8e62" stroke-width="29" stroke-linecap="round"/>
    <path d="M300 201 C258 192 200 214 136 234" fill="none" stroke="#fff4e6" stroke-width="4" stroke-linecap="round" opacity=".6"/>
    <path d="M300 222 C260 216 210 232 160 248" fill="none" stroke="url(#sb-hatch)" stroke-width="8" opacity=".85"/>
    <path d="M250 214 C226 212 206 222 186 226 M222 216 C214 226 204 228 194 236" fill="none" stroke="#3d3f63" stroke-width="1.9" opacity=".85"/>
    <path d="M122 226 C150 232 148 262 124 268 C98 276 74 272 74 254 C76 238 100 224 122 226 Z" fill="#cf8e62" stroke="#190a05" stroke-width="3"/>
    ${fingers}
    <path d="M78 246 C96 238 112 236 128 240" fill="none" stroke="#fff4e6" stroke-width="3" stroke-linecap="round" opacity=".6"/>
    <!-- front leg: turned wood that becomes a calf -->
    <path d="M112 382 C106 410 94 440 96 470 C98 510 112 540 110 594 L132 594 C134 540 148 500 146 460 C144 428 138 410 134 382 Z" fill="#cf8e62" stroke="#190a05" stroke-width="3.2"/>
    <path d="M136 396 C142 430 146 470 136 520 C130 548 130 570 130 592 L120 592 C122 556 134 500 128 460 C124 430 126 410 124 390 Z" fill="url(#sb-hatch)" opacity=".62"/>
    <path d="M112 420 C108 444 110 462 116 480" fill="none" stroke="#fff4e6" stroke-width="3.4" stroke-linecap="round" opacity=".6"/>
    <path d="M108 594 L134 594 L136 606 L104 606 Z" fill="url(#sb-wood)" stroke="#190a05" stroke-width="3"/>
  </svg><p><b>Fig. 5.</b> Seat, with attachments. Note the sixth finger.</p>`);
  specimen.setAttribute('aria-label', 'Figure: a chair with a ribcage for a back, a six-fingered arm, a breathing seat and a bandaged leg');
  const coreList = $('.core-list');
  coreList.append(specimen);
  const leaders = sv('svg', { class: 'sb-leaders', 'aria-hidden': 'true' });
  coreList.append(leaders);
  // Anchor points on the drawing, in its viewBox: a ribs, b fingers, c wet seat, d spine, e bandage, f breathing seat.
  const ANCHORS = [[238, 122], [92, 298], [122, 338], [346, 190], [309, 496], [296, 336]];
  function paintLeaders() {
    const box = coreList.getBoundingClientRect();
    const svgEl = $('svg', specimen);
    if (getComputedStyle(leaders).display === 'none' || !svgEl) return;
    const vb = svgEl.getBoundingClientRect();
    leaders.textContent = '';
    leaders.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    $$('.core-item', coreList).forEach((item, i) => {
      const r = item.getBoundingClientRect();
      const a = ANCHORS[i];
      const ax = vb.left - box.left + ((a[0] - 30) / 390) * vb.width;
      const ay = vb.top - box.top + ((a[1] - 30) / 590) * vb.height;
      const left = i < 3;
      const sx = (left ? r.right - box.left - 16 : r.left - box.left + 16);
      const sy = r.top - box.top + r.height * .5;
      const mx = (sx + ax) / 2;
      const ld = `M${sx} ${sy} C${mx} ${sy} ${mx} ${ay} ${ax} ${ay}`;
      leaders.append(sv('path', { d: ld, class: 'sb-l0' }));
      leaders.append(sv('path', { d: ld }));
      leaders.append(sv('circle', { cx: ax, cy: ay, r: 3.6 }));
      leaders.append(sv('circle', { cx: sx, cy: sy, r: 3 }));
    });
  }

  // ---- Veins from the screen edges ----
  const screenVeins = $('.sb-screen');
  function paintScreen() {
    if (!screenVeins) return;
    const w = innerWidth;
    const h = innerHeight;
    screenVeins.textContent = '';
    screenVeins.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const margin = Math.max(0, (w - 1240) / 2);
    if (margin < 40) return;
    const R = rng(77);
    const side = (x0, sign) => {
      for (let i = 0; i < 9; i++) {
        let x = x0;
        let y = R() * h;
        let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
        let head = (R() - .5) * 1.4;
        const n = 8 + R() * 16;
        for (let k = 0; k < n; k++) {
          head += (R() - .5) * .8;
          x += sign * (6 + R() * 6) * Math.cos(head);
          y += 14 * Math.sin(head);
          if (sign * (x - x0) > margin * .8) break;
          d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
        }
        screenVeins.append(sv('path', { d, stroke: R() < .3 ? '#39395f' : '#7a2015', 'stroke-width': (1 + R() * 2.2).toFixed(1), 'stroke-opacity': .7 }));
      }
    };
    side(0, 1);
    side(w, -1);
  }

  // ---- Pulse ----
  const REST = 46;
  let bpm = REST;
  let want = REST;
  let lastY = scrollY;
  let lastT = performance.now();
  addEventListener('scroll', () => {
    const t = performance.now();
    const v = Math.abs(scrollY - lastY) / Math.max(16, t - lastT) * 1000; // px per second
    lastY = scrollY;
    lastT = t;
    want = Math.min(118, Math.max(want, REST + v * .028));
  }, { passive: true });

  const here = $('.atlas-here');
  const readout = make('span', 'sb-bpm', '<svg viewBox="0 0 62 18" aria-hidden="true"><path d="M0 10 H18 l3 -2 l2 2 H28 l3 6 l4 -15 l4 13 l2 -4 H62"/></svg><span data-b>46 bpm</span>');
  readout.setAttribute('aria-hidden', 'true');
  here.after(readout);
  const bpmText = $('[data-b]', readout);
  const trace = $('path', readout);

  const LUB = [
    { transform: 'scale(1)', offset: 0 },
    { transform: 'scale(1.1, 1.07)', offset: .14 },
    { transform: 'scale(.99)', offset: .3 },
    { transform: 'scale(1.05, 1.03)', offset: .44 },
    { transform: 'scale(1)', offset: .78 },
  ];
  function liveBreath() {
    if (!liveMap) return;
    const t0 = performance.now();
    const tick = (t) => {
      const u = (t - t0) / 900;
      if (u >= 1) { liveMap.setAttribute('scale', '15'); return; }
      liveMap.setAttribute('scale', (15 + Math.sin(u * Math.PI) * 11).toFixed(1));
      setTimeout(() => requestAnimationFrame(tick), 60);
    };
    requestAnimationFrame(tick);
  }
  let beatTimer;
  function beat() {
    clearTimeout(beatTimer);
    if (isCalm()) { bpmText.textContent = 'at rest'; return; }
    if (!document.hidden) {
      const r = gallery.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) {
        heart.animate(LUB, { duration: 760, easing: 'ease-out' });
        pulsePaths.forEach((p, i) => {
          const len = p.getTotalLength?.() || 300;
          p.setAttribute('stroke-dasharray', `70 ${len + 80}`);
          p.animate([{ strokeDashoffset: 70, strokeOpacity: .6 }, { strokeDashoffset: -len, strokeOpacity: 0 }], { duration: 950, delay: 60 + i * 15, easing: 'ease-out' });
        });
      }
      const live = $$('.sb-on').slice(0, 8);
      for (const el of live) {
        const sv1 = el.querySelector(':scope > .sb-veins');
        if (sv1) sv1.animate([{ opacity: 1 }, { opacity: .55, offset: .2 }, { opacity: 1 }], { duration: 900, easing: 'ease-in-out' });
      }
      if (screenVeins) screenVeins.animate([{ opacity: .75 }, { opacity: 1, offset: .25 }, { opacity: .75 }], { duration: 1000, easing: 'ease-in-out' });
      trace.animate([{ strokeOpacity: 1 }, { strokeOpacity: .35 }], { duration: 760, easing: 'ease-out' });
      liveBreath();
      bpm += (want - bpm) * .45;
      want += (REST - want) * .22;
      bpmText.textContent = `${Math.round(bpm)} bpm`;
    }
    beatTimer = setTimeout(beat, 60000 / bpm);
  }
  // The panel nearest the middle of the screen is the one whose edge visibly moves.
  let liveEl = null;
  function chooseLive() {
    const mid = innerHeight / 2;
    let best = null;
    let d = 1e9;
    for (const p of panels) {
      if (!p.el.classList.contains('sb-on')) continue;
      const r = p.el.getBoundingClientRect();
      if (r.width < 200) continue;
      const dist = Math.abs((r.top + r.bottom) / 2 - mid);
      if (dist < d) { d = dist; best = p.el; }
    }
    if (best !== liveEl) {
      liveEl?.classList.remove('sb-live');
      best?.classList.add('sb-live');
      liveEl = best;
    }
  }
  setInterval(chooseLive, 800);

  function layout() {
    paintVeins();
    paintVessels();
    paintLeaders();
    paintScreen();
  }
  let resizeT;
  addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(layout, 180); });
  addEventListener('eas:calm', () => beat());
  addEventListener('load', layout);
  document.fonts?.ready?.then(layout);
  layout();
  beatTimer = setTimeout(beat, 600);
})();
