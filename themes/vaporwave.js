// Vaporwave: full-width headings, the void behind the page, error dialogs you can drag (they leave the old Windows trail),
// and a speed control that really slows the page, the loops and the music.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const calm = () => root.dataset.calm === '1';
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  // Full-width type. The real text stays available to screen readers through aria-label.
  const wide = (s) => s.replace(/[!-~]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0xFEE0)).replace(/ /g, '　');
  for (const h of $$('.hero-title, .sec-title')) {
    const t = h.textContent;
    h.setAttribute('aria-label', t);
    h.textContent = '';
    const s = el('span');
    s.textContent = wide(h.classList.contains('hero-title') ? t.toUpperCase() : t);
    s.setAttribute('aria-hidden', 'true');
    h.append(s);
  }

  // The void
  const palm = (cls) => {
    const fronds = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = -176 + (i * 172) / (n - 1) + (i % 2 ? 4 : -3);
      const len = 170 + (i % 3) * 22;
      const pts = [];
      const side = [];
      const seg = 12;
      for (let k = 0; k <= seg; k++) {
        const t = k / seg;
        const r = (a + 58 * t * t * (a < -90 ? -1 : 1)) * Math.PI / 180;
        const x = 0 + Math.cos(r) * len * t;
        const y = 0 + Math.sin(r) * len * t + 26 * t * t;
        const w = Math.sin(Math.PI * Math.min(1, t * 1.05)) * 19;
        pts.push(`${(x - Math.sin(r) * (k % 2 ? w : w * .35)).toFixed(1)} ${(y + Math.cos(r) * (k % 2 ? w : w * .35)).toFixed(1)}`);
        side.unshift(`${(x + Math.sin(r) * (k % 2 ? w * .3 : w * .85)).toFixed(1)} ${(y - Math.cos(r) * (k % 2 ? w * .3 : w * .85)).toFixed(1)}`);
      }
      fronds.push(`<path d="M${pts.join('L')}L${side.join('L')}Z" fill="${i % 2 ? '#0d5e63' : '#117a78'}"/>`);
    }
    return `<svg class="vw-palm ${cls}" viewBox="-220 -120 440 620" aria-hidden="true"><path d="M-4 0C8 120 44 300 26 500L66 500C76 300 34 110 10 0Z" fill="#33202c"/><path d="M4 40l26 10M8 100l34 10M18 170l36 8M28 240l36 6M36 310l34 4M42 380l30 3" stroke="#6d4a5e" stroke-width="5"/>${fronds.join('')}</svg>`;
  };
  const voidEl = el('div', 'vw-void', `<div class="vw-floor"><i></i></div>${palm('vw-palm-l')}${palm('vw-palm-r')}<div class="vw-pyr vw-pyr-a"><b><u></u><u></u><u></u><u></u></b></div><div class="vw-pyr vw-pyr-b"><b><u></u><u></u><u></u><u></u></b></div>`);
  voidEl.setAttribute('aria-hidden', 'true');
  document.body.prepend(voidEl);

  // Helios stands in front of the pediment
  const heroText = $('.hero-text');
  const helios = el('img', 'vw-helios');
  helios.src = '../media/vaporwave/helios.webp';
  helios.alt = '';
  helios.width = 288;
  helios.height = 560;
  heroText.prepend(helios);

  // Picture windows get a file name in their title bar
  const fileName = (t) => t.toLowerCase().replace(/[^a-z0-9぀-鿿]+/g, '_').replace(/^_|_$/g, '').slice(0, 26) || 'image';
  for (const f of $$('.shot')) {
    const t = $('.shot-title', f)?.textContent || 'image';
    f.style.setProperty('--t', JSON.stringify(`${fileName(t)}.bmp`));
  }
  document.body.classList.add('vw-ready');

  // The tagline becomes a dialog in the picture grid, and holds the speed control
  const gallery = $('.hero-gallery');
  const tagline = $('.hero-tagline');
  const speedRow = () => el('div', 'vw-speed', `<label>Speed</label><input type="range" min="40" max="100" step="5" value="100" aria-label="Playback speed"><output>100%</output>`);
  const tag = el('div', 'vw-dlg vw-tag');
  tag.append(el('div', 'vw-bar', '<span>Playback settings</span>'));
  tag.append(tagline);
  const heroSpeed = speedRow();
  heroSpeed.append(el('small', '', 'Drag it left. The floor, the loops, the title and the music all slow down. That is the whole trick.'));
  tag.append(heroSpeed);
  gallery.insertBefore(tag, $('.shot-3', gallery));
  gallery.append($('.toc'));
  const musicSpeed = speedRow();
  $('.music-wrap h3').after(musicSpeed);
  musicSpeed.append(el('small', '', 'YouTube only slows in steps of 25% and keeps the pitch. Real vaporwave lets the pitch fall too.'));

  // Speed: every animation, every loop, the title echo and the music dock
  let rate = 1;
  const rateAll = () => {
    if (!calm()) for (const a of document.getAnimations()) a.playbackRate = rate;
    for (const v of $$('video[data-loop]')) v.playbackRate = rate;
    root.style.setProperty('--e', (1.4 + (1 - rate) * 13).toFixed(2));
    tellYoutube();
  };
  const setRate = (pct) => {
    rate = pct / 100;
    for (const row of $$('.vw-speed')) {
      $('input', row).value = pct;
      $('output', row).textContent = `${pct}%`;
    }
    rateAll();
  };
  for (const input of $$('.vw-speed input')) input.addEventListener('input', () => setRate(Number(input.value)));
  addEventListener('eas:calm', () => { if (!calm()) rateAll(); });

  // page.js creates the YouTube frame. Turning on its message channel lets the same slider reach the music.
  const frameBox = $('[data-player-frame]');
  let ytFrame = null;
  const tellYoutube = () => {
    if (!ytFrame?.contentWindow) return;
    const snapped = Math.max(.25, Math.round(rate * 4) / 4);
    const send = (o) => ytFrame.contentWindow.postMessage(JSON.stringify(o), 'https://www.youtube-nocookie.com');
    send({ event: 'listening', id: 'vw', channel: 'widget' });
    send({ event: 'command', func: 'setPlaybackRate', args: [snapped], id: 'vw', channel: 'widget' });
  };
  new MutationObserver(() => {
    const f = $('iframe', frameBox);
    if (!f || f === ytFrame) { if (!f) ytFrame = null; return; }
    ytFrame = f;
    if (!f.src.includes('enablejsapi')) f.src = `${f.src}&enablejsapi=1`;
    f.addEventListener('load', () => [600, 1800, 4000].forEach((t) => setTimeout(tellYoutube, t)));
  }).observe(frameBox, { childList: true });

  // Floating errors
  const ICONS = { err: 'var(--ico-err)', warn: 'var(--ico-warn)', ask: 'var(--ico-ask)', info: 'var(--ico-info)' };
  const page = $('.page');
  const trail = el('div', 'vw-trail');
  document.body.append(trail);

  const dragAndTrail = (box, handleTest) => {
    let sx = 0, sy = 0, ox = 0, oy = 0, drag = false, lastX = 0, lastY = 0, base = '';
    const read = () => (box.style.translate || '0px 0px').split(' ').map((v) => parseFloat(v) || 0);
    box.addEventListener('pointerdown', (e) => {
      if (e.button || !handleTest(e) || e.target.closest('button')) return;
      drag = true;
      [ox, oy] = read();
      sx = e.clientX; sy = e.clientY; lastX = sx; lastY = sy;
      base = getComputedStyle(box).zIndex;
      box.style.zIndex = '30';
      box.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    box.addEventListener('pointermove', (e) => {
      if (!drag) return;
      // Stay on screen, so the page never gains sideways scroll
      const r0 = box.getBoundingClientRect();
      const [nowX, nowY] = read();
      let nx = ox + e.clientX - sx;
      let ny = oy + e.clientY - sy;
      nx = Math.min(nx, nowX + innerWidth - 4 - r0.right);
      nx = Math.max(nx, nowX + 4 - r0.left);
      ny = Math.max(ny, nowY + 44 - r0.top);
      box.style.translate = `${nx}px ${ny}px`;
      if (!calm() && Math.hypot(e.clientX - lastX, e.clientY - lastY) > 26) {
        lastX = e.clientX; lastY = e.clientY;
        const r = box.getBoundingClientRect();
        const c = box.cloneNode(true);
        c.style.cssText = `left:${r.left + scrollX}px;top:${r.top + scrollY}px;width:${r.width}px;height:${r.height}px;transform:none;translate:none;animation-duration:${(1.7 / rate).toFixed(2)}s`;
        if (box.classList.contains('core-item')) c.style.counterSet = `core ${$$('.core-list .core-item').indexOf(box) + 1}`;
        c.setAttribute('aria-hidden', 'true');
        c.inert = true;
        trail.append(c);
        c.addEventListener('animationend', () => c.remove());
        if (trail.children.length > 40) trail.firstChild.remove();
      }
    });
    const end = () => { drag = false; };
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
  };

  let spawned = 0;
  const makeErr = ({ icon, title, body, buttons, pos }) => {
    const d = el('section', 'vw-dlg vw-err');
    d.setAttribute('role', 'alertdialog');
    d.setAttribute('aria-label', title);
    if (pos) Object.assign(d.style, pos);
    const bar = el('div', 'vw-bar', '<span></span><button class="vw-x" type="button" aria-label="Close"></button>');
    $('span', bar).textContent = title;
    const main = el('div', 'vw-err-body', '<div class="vw-err-ico"></div><div class="vw-err-text"></div>');
    $('.vw-err-ico', main).style.background = `${ICONS[icon]} center no-repeat`;
    $('.vw-err-text', main).textContent = body;
    const btns = el('div', 'vw-err-btns');
    for (const [label, act] of buttons) {
      const b = el('button');
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', () => act(d, makeErr));
      btns.append(b);
    }
    d.append(bar, main, btns);
    $('.vw-x', bar).addEventListener('click', () => d.remove());
    dragAndTrail(d, (e) => bar.contains(e.target));
    return d;
  };
  const close = (d) => d.remove();
  // Retry does what Windows did: another identical box, slightly further down.
  const retry = (spec) => (d) => {
    if (spawned > 11) return;
    spawned += 1;
    const copy = makeErr(spec);
    copy.style.left = `${Math.min(d.offsetLeft + 26, d.offsetParent.clientWidth - d.offsetWidth - 4)}px`;
    copy.style.top = `${d.offsetTop + 26}px`;
    copy.style.right = 'auto';
    d.after(copy);
  };

  const DIALOGS = [
    {
      at: '.hero', pos: { left: '-46px', top: '18px' }, icon: 'err', title: 'エラー ERROR 420',
      body: 'The 1990s you are looking for were never released. Please try again in 1995.',
    },
    {
      at: '.hero', pos: { right: '-46px', top: '46px' }, icon: 'warn', title: '警告 Warning',
      body: 'This page was announced but never shipped. Continue anyway?',
    },
    {
      at: '.how-side', pos: { right: '-70px', top: '-44px' }, icon: 'ask', title: '確認 Confirm', mobile: false, min: 1100,
      body: 'Replace all drums with a spa advert?',
    },
    {
      at: '#palette', pos: { right: '190px', top: '30px', width: '280px' }, icon: 'info', title: 'Display Properties', mobile: false, min: 1100,
      body: 'Your monitor is showing 16 colours. All of them are pink.',
    },
  ];
  const wideScreen = matchMedia('(min-width: 721px)').matches;
  for (const spec of DIALOGS) {
    const host = $(spec.at);
    if (!host || (!wideScreen && spec.mobile === false)) continue;
    const full = { ...spec, buttons: [] };
    full.buttons = [['OK', close], ['Retry', retry(full)]];
    host.style.position = 'relative';
    const d = makeErr(full);
    d.dataset.min = spec.min || 1120;
    if (spec.at === '.hero' && !wideScreen) { if (spec.icon === 'err') $('.hero-gallery').after(d); else continue; } else host.prepend(d);
  }
  // Keep the dialogs clear of the text on narrower desktops
  const fit = () => { for (const d of $$('.vw-err[data-min]')) d.hidden = innerWidth < Number(d.dataset.min); };
  if (wideScreen) { fit(); addEventListener('resize', fit); }

  // The page ends on the Floral Shoppe composition
  const footHelios = helios.cloneNode();
  footHelios.className = 'vw-foot-helios';
  $('.foot').prepend(footHelios);

  // The six core alerts can be dragged by their title bars too
  if (matchMedia('(pointer: fine) and (min-width: 721px)').matches) {
    for (const item of $$('.core-item')) {
      dragAndTrail(item, (e) => e.target === item && e.offsetY < 26);
    }
  }

  setRate(100);
})();
