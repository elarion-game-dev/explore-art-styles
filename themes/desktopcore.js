// Desktopcore: real windows (drag, raise, minimise, maximise, close), Start menu, taskbar, desktop icons, right-click menu, display schemes,
// frozen-PC window trails, a working Paint, a CD player, a helper who knows the time, a screen saver and a safe shut down.
(() => {
  const root = document.documentElement;
  const M = '../media/desktopcore/icons/';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const make = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html !== undefined) n.innerHTML = html; return n; };
  // A list item's words without its citation numbers, for tips that quote it.
  const plain = (el) => { const c = el.cloneNode(true); c.querySelectorAll('.cite').forEach((x) => x.remove()); return c.textContent.trim(); };
  const isCalm = () => root.dataset.calm === '1';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };
  const ico = (n, s = 24) => `<img class="dk-ico" src="${M}${n}.png" width="${s}" height="${s}" alt="">`;
  const toastEl = $('[data-toast]');
  let toastT;
  const toast = (m) => { toastEl.textContent = m; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 2600); };
  const smooth = () => (isCalm() ? 'auto' : 'smooth');
  const canDrag = () => innerWidth > 900;

  // Display scheme
  const SCHEMES = { std: 'Windows Standard', hot: 'Hot Dog Stand', luna: 'Luna (Windows XP)' };
  const setScheme = (s) => { if (s === 'std') delete root.dataset.scheme; else root.dataset.scheme = s; };
  const readScheme = () => { const s = store.get('eas-desktopcore-scheme'); return SCHEMES[s] ? s : 'std'; };
  setScheme(readScheme());

  const wall = make('div', 'dk-wall');
  const trailCv = make('canvas', 'dk-trails');
  wall.setAttribute('aria-hidden', 'true');
  trailCv.setAttribute('aria-hidden', 'true');
  document.body.prepend(trailCv);
  document.body.prepend(wall);

  // ---- window manager ---------------------------------------------------------------------------
  const wins = [];
  let topZ = 20;
  let active = null;
  const tasksEl = make('div', 'dk-tasks');
  let lastFocus = 0;

  function paintTasks() {
    for (const w of wins) {
      w.el.classList.toggle('is-active', w === active);
      if (w.taskEl) w.taskEl.classList.toggle('on', w === active && !w.el.classList.contains('is-min'));
    }
  }
  function focusWin(w, raise = true) {
    if (raise) {
      topZ += 1;
      if (topZ > 800) { topZ = 20; [...wins].sort((a, b) => (Number(a.el.style.zIndex) || 0) - (Number(b.el.style.zIndex) || 0)).forEach((x) => { topZ += 1; if (x.el.style.zIndex) x.el.style.zIndex = topZ; }); topZ += 1; }
      w.el.style.zIndex = topZ;
      lastFocus = performance.now();
    }
    active = w;
    paintTasks();
  }
  function ensureTask(w) {
    if (w.taskEl) return;
    const b = make('button', 'dk-task', `${ico(w.icon, 16)}<span>${w.title}</span>`);
    b.type = 'button';
    b.title = w.title;
    b.addEventListener('click', () => {
      if (w.el.classList.contains('is-min')) { restore(w); return; }
      if (active === w) { minimize(w); return; }
      focusWin(w);
      w.el.scrollIntoView({ behavior: smooth(), block: 'start' });
    });
    w.taskEl = b;
    tasksEl.append(b);
  }
  function dropTask(w) { if (w.taskEl && !w.task) { w.taskEl.remove(); w.taskEl = null; } }
  function fly(from, to) {
    if (isCalm() || !to) return;
    const f = make('div', 'dk-fly');
    document.body.append(f);
    f.animate([
      { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: '24px' },
      { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: '24px' },
    ], { duration: 170, easing: 'linear' }).onfinish = () => f.remove();
  }
  function minimize(w) {
    if (!canDrag()) { w.el.classList.toggle('is-rolled'); return; }
    ensureTask(w);
    const r = w.el.getBoundingClientRect();
    w.el.classList.add('is-min');
    w.el.classList.remove('is-max');
    fly(r, w.taskEl.getBoundingClientRect());
    if (active === w) { active = null; paintTasks(); }
  }
  function restore(w, scroll = true) {
    w.el.classList.remove('is-min', 'is-closed', 'is-rolled');
    if (w.task) ensureTask(w); else dropTask(w);
    focusWin(w);
    if (scroll) w.el.scrollIntoView({ behavior: smooth(), block: 'nearest' });
  }
  function toggleMax(w) {
    const on = w.el.classList.toggle('is-max');
    focusWin(w);
    document.body.style.overflow = $('.is-max') ? 'hidden' : '';
    return on;
  }
  function closeWin(w) {
    if (w.el.classList.contains('is-max')) toggleMax(w);
    w.el.classList.add('is-closed');
    if (w.taskEl) { w.taskEl.remove(); w.taskEl = null; }
    if (active === w) { active = null; paintTasks(); }
    toast('Closed. Start, Restore All Windows brings it back.');
  }

  function makeWin(el, o) {
    const w = { el, title: o.title, icon: o.icon || 'doc', task: !!o.task, dx: 0, dy: 0 };
    el.classList.add('dk-win', ...(o.cls || []));
    const client = o.noClient ? null : make('div', 'dk-client');
    if (client) { client.append(...[...el.childNodes].filter((n) => n !== o.heading)); }
    const bar = make('div', 'dk-bar', `${ico(w.icon, 16)}<div class="dk-bar-t"></div><div class="dk-ctl"><button type="button" class="dk-c min" aria-label="Minimize ${w.title}"></button><button type="button" class="dk-c max" aria-label="Maximize ${w.title}"></button><button type="button" class="dk-c close" aria-label="Close ${w.title}"></button></div>`);
    const t = $('.dk-bar-t', bar);
    if (o.heading) { t.append(o.heading); if (o.app) t.append(make('span', '', `- ${o.app}`)); } else { t.append(make('span', '', o.title)); }
    el.prepend(bar);
    if (o.menu) {
      const m = make('div', 'dk-menu');
      m.setAttribute('aria-hidden', 'false');
      o.menu.forEach((name) => { const b = make('button', '', name); b.type = 'button'; b.dataset.menu = name; b.setAttribute('aria-haspopup', 'menu'); m.append(b); });
      bar.after(m);
      w.menuEl = m;
    }
    if (client) el.append(client);
    if (o.status) el.append(make('div', 'dk-status', o.status));
    w.client = client;
    w.bar = bar;
    $('.min', bar).addEventListener('click', () => minimize(w));
    $('.max', bar).addEventListener('click', () => toggleMax(w));
    $('.close', bar).addEventListener('click', () => closeWin(w));
    bar.addEventListener('dblclick', (e) => { if (!e.target.closest('.dk-ctl') && canDrag()) toggleMax(w); });
    el.addEventListener('pointerdown', () => focusWin(w));
    el.addEventListener('focusin', () => { if (active !== w) focusWin(w); });
    bindDrag(w);
    wins.push(w);
    if (w.task) ensureTask(w);
    return w;
  }

  // Dragging. When trails are on, the window paints itself across the wallpaper, the way it did when a PC froze.
  const tctx = trailCv.getContext('2d');
  let trailsOn = store.get('eas-desktopcore-trails') !== '0';
  let wipeT = 0;
  function sizeTrails() {
    trailCv.width = innerWidth;
    trailCv.height = innerHeight;
  }
  sizeTrails();
  addEventListener('resize', sizeTrails);
  const cssVar = (n) => getComputedStyle(root).getPropertyValue(n).trim();
  function stamp(w) {
    const r = w.el.getBoundingClientRect();
    const hh = 25;
    const h = Math.min(r.height, innerHeight * 1.2);
    tctx.fillStyle = cssVar('--dk') || '#000';
    tctx.fillRect(r.left, r.top, r.width, h);
    tctx.fillStyle = '#fff';
    tctx.fillRect(r.left, r.top, r.width - 1, h - 1);
    tctx.fillStyle = cssVar('--face');
    tctx.fillRect(r.left + 1, r.top + 1, r.width - 2, h - 2);
    const g = tctx.createLinearGradient(r.left, 0, r.right, 0);
    g.addColorStop(0, cssVar('--ta') || '#000080');
    g.addColorStop(1, cssVar('--tb') || '#1084d0');
    tctx.fillStyle = g;
    tctx.fillRect(r.left + 3, r.top + 3, r.width - 6, hh);
    tctx.fillStyle = cssVar('--client');
    tctx.fillRect(r.left + 5, r.top + hh + 5, r.width - 10, h - hh - 10);
  }
  function wipeTrails() {
    clearTimeout(wipeT);
    wipeT = setTimeout(() => {
      const H = trailCv.height;
      let y = 0;
      const step = () => {
        tctx.clearRect(0, y, trailCv.width, 40);
        y += 40;
        if (y < H) requestAnimationFrame(step);
      };
      step();
    }, 2200);
  }
  function bindDrag(w) {
    let sx = 0;
    let sy = 0;
    let ox = 0;
    let oy = 0;
    let rect = null;
    let dragging = false;
    let moved = 0;
    w.bar.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('.dk-ctl') || w.el.classList.contains('is-max') || !canDrag()) return;
      dragging = true;
      moved = 0;
      sx = e.clientX; sy = e.clientY; ox = w.dx; oy = w.dy;
      rect = w.el.getBoundingClientRect();
      w.bar.setPointerCapture(e.pointerId);
      clearTimeout(wipeT);
    });
    w.bar.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      let dx = e.clientX - sx;
      let dy = e.clientY - sy;
      dx = Math.max(90 - rect.right, Math.min(innerWidth - 90 - rect.left, dx));
      dy = Math.max(-rect.top - scrollY, dy);
      w.dx = ox + dx;
      w.dy = oy + dy;
      w.el.style.transform = `translate(${w.dx}px, ${w.dy}px)`;
      moved += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);
      if (trailsOn && !isCalm() && moved > 6) stamp(w);
    });
    const end = () => { if (dragging) { dragging = false; if (trailsOn && !isCalm()) wipeTrails(); } };
    w.bar.addEventListener('pointerup', end);
    w.bar.addEventListener('pointercancel', end);
  }

  // Dropdown menus for the menu bars, plus the right-click menu. Only one is ever open.
  let popEl = null;
  function closePop() {
    if (!popEl) return;
    if (popEl.owner) popEl.owner.setAttribute('aria-expanded', 'false');
    popEl.remove();
    popEl = null;
  }
  function openPop(x, y, items, owner) {
    closePop();
    const p = make('div', 'dk-pop');
    p.setAttribute('role', 'menu');
    items.forEach((it) => {
      if (it === '-') { p.append(make('hr')); return; }
      const b = make('button', '', it.label);
      b.type = 'button';
      b.setAttribute('role', 'menuitem');
      if (it.run) b.addEventListener('click', () => { closePop(); it.run(); }); else b.disabled = true;
      p.append(b);
    });
    document.body.append(p);
    const r = p.getBoundingClientRect();
    p.style.left = `${Math.min(x, innerWidth - r.width - 6)}px`;
    p.style.top = `${Math.min(y, innerHeight - r.height - 40)}px`;
    if (owner) { p.owner = owner; owner.setAttribute('aria-expanded', 'true'); }
    popEl = p;
    const first = $('button:not(:disabled)', p);
    if (first && !owner) first.focus({ preventScroll: true });
  }
  document.addEventListener('pointerdown', (e) => { if (popEl && !popEl.contains(e.target) && !(popEl.owner && popEl.owner === e.target)) closePop(); });
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-menu]');
    if (!b) return;
    const w = wins.find((x) => x.el.contains(b));
    if (popEl && popEl.owner === b) { closePop(); return; }
    const r = b.getBoundingClientRect();
    const items = {
      File: [{ label: 'Minimize', run: () => minimize(w) }, { label: 'Close', run: () => closeWin(w) }],
      Edit: [{ label: 'Undo' }, '-', { label: 'Cut' }, { label: 'Copy' }, { label: 'Paste' }],
      Search: [{ label: 'Find...' }],
      Image: [{ label: 'Clear Image', run: () => clearPaint() }],
      Options: [{ label: 'Display Properties...', run: () => openProps() }],
      View: [{ label: w.el.classList.contains('is-max') ? 'Restore' : 'Maximize', run: () => toggleMax(w) }, { label: 'Refresh', run: () => refreshDesk() }],
      Go: [{ label: 'All Styles', run: () => { location.href = '../index.html'; } }, { label: 'Next Style', run: () => $('a[rel=next]').click() }],
      Favorites: [{ label: 'Add to Shortlist', run: () => $('[data-save]').click() }],
      Device: [{ label: 'CD Audio', run: () => $('#vibe').scrollIntoView({ behavior: smooth() }) }],
      Disc: [{ label: 'Eject' }],
      Help: [{ label: 'Help Topics', run: () => openWin(winLearn) }, '-', { label: 'About This Page', run: () => openWin(winAbout) }],
    }[b.dataset.menu] || [{ label: 'Empty' }];
    openPop(r.left, r.bottom, items, b);
  });

  // ---- taskbar ----------------------------------------------------------------------------------
  const atlas = $('.atlas');
  const startBtn = make('button', 'dk-startbtn', `${ico('start', 20)}<span>Start</span>`);
  startBtn.type = 'button';
  startBtn.setAttribute('aria-haspopup', 'menu');
  startBtn.setAttribute('aria-expanded', 'false');
  atlas.prepend(startBtn, make('i', 'dk-sep'));
  $('.atlas-here').after(make('i', 'dk-sep'), tasksEl);
  const tray = make('div', 'dk-tray', `<button type="button" title="Display Properties" aria-label="Display Properties">${ico('speaker', 16)}</button><span data-clock></span>`);
  atlas.append(tray);
  $('button', tray).addEventListener('click', () => openProps());
  const clock = $('[data-clock]', tray);
  const fmtT = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  const tickClock = () => { clock.textContent = fmtT.format(new Date()); };
  tickClock();
  setInterval(tickClock, 15000);

  // ---- hero windows ----------------------------------------------------------------------------
  const page = $('.page');
  const heroText = $('.hero-text');
  const kicker = $('.hero-kicker');
  const h1 = $('.hero-title');
  const sub = $('.hero-sub');
  const tag = $('.hero-tagline');
  const head = make('div', 'dk-head');
  head.append(kicker, h1, sub);
  heroText.append(head);
  const TIPS = [
    canDrag() ? 'Drag any window by its title bar. Click one to bring it to the front.' : 'On a bigger screen you can drag these windows around. Here, the minimize button rolls one up.',
    'Start is the contents page. Everything here is in there.',
    'Right-click the desktop for Properties, then try Hot Dog Stand if you dare.',
    ...$$('.do li').map(plain),
  ];
  const tip = make('div', 'dk-tip', `${ico('info', 24)}<b>Did you know...</b><p class="dk-tip-t"></p>`);
  tip.prepend();
  tip.querySelector('p').before(tag);
  const tipText = $('.dk-tip-t', tip);
  let tipI = 0;
  tipText.textContent = TIPS[0];
  const tipBtns = make('div', 'dk-tip-btns', '<button type="button" class="dk-btn" data-a="new">What\'s New</button><button type="button" class="dk-btn" data-a="next">Next Tip</button><button type="button" class="dk-btn" data-a="close">Close</button>');
  heroText.append(tip, tipBtns);
  const winWelcome = makeWin(heroText, { title: 'Welcome', icon: 'help' });

  $$('.hero .shot').forEach((s) => {
    const title = $('.shot-title', s).textContent;
    const app = /screenshot/i.test($('.shot-meta', s)?.textContent || '') ? 'Game' : 'Imaging';
    makeWin(s, { title: `${title} - ${app}`, icon: app === 'Game' ? 'cd' : 'display', noClient: true });
  });

  // ---- sections --------------------------------------------------------------------------------
  const secFeel = $('#feel');
  const notepad = make('div', 'dk-notepad');
  const hFeel = $('.sec-title', secFeel);
  notepad.append(hFeel, $('.feel-body', secFeel), $('.mood-words', secFeel));
  secFeel.prepend(notepad);
  makeWin(notepad, { title: 'The feel', heading: hFeel, app: 'Notepad', icon: 'notepad', task: true, menu: ['File', 'Edit', 'Search', 'Help'] });
  const origins = $('.origins', secFeel);
  makeWin(origins, { title: 'History', heading: $('h3', origins), app: 'Readme', icon: 'doc' });

  const secCore = $('#core');
  const control = make('div', 'dk-control');
  const hCore = $('.sec-title', secCore);
  control.append(hCore, $('.core-list', secCore));
  secCore.prepend(control);
  const coreIcons = ['display', 'computer', 'folder', 'control', 'notepad', 'error'];
  $$('.core-item', control).forEach((c, i) => c.insertAdjacentHTML('afterbegin', ico(coreIcons[i % coreIcons.length], 24)));
  makeWin(control, { title: 'Core elements', heading: hCore, app: 'Control Panel', icon: 'control', task: true, menu: ['File', 'Edit', 'View', 'Help'], status: `<span>${$$('.core-item', control).length} object(s)</span>` });

  const secHow = $('#how');
  const setup = make('div', 'dk-setup');
  const hHow = $('.sec-title', secHow);
  const side = make('div', 'dk-setup-side', `${ico('setup', 24)}<span>Style Setup</span>`);
  const setupMain = make('div', 'dk-setup-main');
  setupMain.append($('.steps', secHow));
  const prog = make('div', 'dk-prog', '<span data-prog-label>Setup is copying files...</span><div class="dk-bar-track"><div class="dk-bar-fill"></div></div>');
  const setupBtns = make('div', 'dk-setup-btns');
  setupBtns.append($('.brief', secHow));
  setupBtns.insertAdjacentHTML('beforeend', '<button type="button" class="dk-btn" data-s="back">&lt; Back</button><button type="button" class="dk-btn" data-s="next">Next &gt;</button><button type="button" class="dk-btn" data-s="cancel">Cancel</button>');
  const setupBody = make('div');
  setupBody.style.minWidth = '0';
  setupBody.append(setupMain, prog, setupBtns);
  setup.append(hHow, side, setupBody);
  secHow.prepend(setup);
  makeWin(setup, { title: 'How to do it', heading: hHow, app: 'Setup', icon: 'setup', task: true });

  const specs = $('.specs', secHow);
  specs.prepend(make('div', 'dk-tabs', '<span>General</span>'));
  const specTabs = $('.dk-tabs', specs);
  const hSpecs = $('h3', specs);
  makeWin(specs, { title: 'System Properties', heading: hSpecs, icon: 'computer' });
  $('.dk-client', specs).before(specTabs);
  const dlg = (sel, icon, ok) => {
    const el = $(sel, secHow);
    const h = $('h3', el);
    el.insertAdjacentHTML('afterbegin', ico(icon, 24));
    const w = makeWin(el, { title: h.textContent, heading: h, icon });
    const row = make('div', 'dk-okrow', `<button type="button" class="dk-btn">${ok}</button>`);
    $('button', row).addEventListener('click', () => closeWin(w));
    w.client.append(row);
    return w;
  };
  dlg('.do', 'info', 'OK');
  const winAvoid = dlg('.avoid', 'error', 'Close');
  const learn = $('.learn', secHow);
  const winLearn = makeWin(learn, { title: 'Help Topics', heading: $('h3', learn), icon: 'help' });

  // Paint, and the palette is its colour box
  const secPal = $('#palette');
  const paintWin = make('div', 'dk-paintwin');
  const hPal = $('.sec-title', secPal);
  const paintBox = make('div', 'dk-paint', `<div class="dk-tools" role="group" aria-label="Paint tools">
      <button type="button" data-tool="1" aria-pressed="true" title="Pencil" aria-label="Pencil">${'✎'}</button>
      <button type="button" data-tool="4" aria-pressed="false" title="Brush" aria-label="Brush">${'●'}</button>
      <button type="button" data-tool="10" data-erase="1" aria-pressed="false" title="Eraser" aria-label="Eraser">${'▭'}</button>
      <button type="button" data-clear title="Clear image" aria-label="Clear image">${'✕'}</button>
      <div class="dk-fg" title="Current colour"></div>
    </div><div class="dk-canvaswrap"><canvas width="320" height="110" aria-label="A small drawing canvas"></canvas></div>`);
  paintWin.append(hPal, paintBox, $('.swatches', secPal), $('.palette-note', secPal), $('.palette-actions', secPal));
  secPal.prepend(paintWin);
  makeWin(paintWin, { title: 'Palette', heading: hPal, app: 'Paint', icon: 'paint', task: true, menu: ['File', 'Edit', 'View', 'Image', 'Options', 'Help'] });
  const cv = $('canvas', paintBox);
  const px = cv.getContext('2d');
  let pcol = '#000000';
  let psize = 1;
  let perase = false;
  const pal = JSON.parse($('#palette-data').textContent).colors.map((c) => c.hex);
  const setFg = (c) => { pcol = c; $('.dk-fg', paintBox).style.setProperty('--fg', c); };
  setFg(pal[2]);
  function plot(x, y, s, c) { px.fillStyle = c; px.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s); }
  function liner(x0, y0, x1, y1, s, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i += 1) plot(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, s, c);
  }
  function doodle() {
    // A hill, drawn badly in Paint, the way everyone did.
    px.fillStyle = '#fff';
    px.fillRect(0, 0, cv.width, cv.height);
    const SKY = pal[3];
    const GRASS = '#4f9a24';
    px.fillStyle = SKY;
    px.fillRect(0, 0, cv.width, cv.height);
    let py = 0;
    for (let x = 0; x < cv.width; x += 1) {
      const y = Math.round(78 - 26 * Math.sin((x + 30) / 95) - 5 * Math.sin(x / 31));
      px.fillStyle = GRASS;
      px.fillRect(x, y, 1, cv.height - y);
      py = y;
    }
    void py;
    const cloud = (cx, cy, r) => { for (let i = -3; i <= 3; i += 1) { const rr = Math.max(1, r - Math.abs(i) * 2); px.fillStyle = '#fff'; px.beginPath(); px.arc(cx + i * r * 0.62, cy, rr, 0, 7); px.fill(); } };
    cloud(58, 26, 9);
    cloud(214, 18, 7);
    cloud(150, 38, 5);
    // Crisp the edges back to hard pixels.
    const im = px.getImageData(0, 0, cv.width, cv.height);
    for (let i = 3; i < im.data.length; i += 4) im.data[i] = 255;
    px.putImageData(im, 0, 0);
  }
  doodle();
  function clearPaint() { px.fillStyle = '#fff'; px.fillRect(0, 0, cv.width, cv.height); }
  $$('[data-tool]', paintBox).forEach((b) => b.addEventListener('click', () => {
    psize = Number(b.dataset.tool);
    perase = !!b.dataset.erase;
    $$('[data-tool]', paintBox).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));
  $('[data-clear]', paintBox).addEventListener('click', clearPaint);
  $$('.swatch button', paintWin).forEach((b) => b.addEventListener('click', () => {
    setFg(b.dataset.copy);
    perase = false;
    const pencil = $('[data-tool="1"]', paintBox);
    if ($('[data-erase]', paintBox).getAttribute('aria-pressed') === 'true') pencil.click();
  }));
  let lastP = null;
  const toCanvas = (e) => { const r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) * cv.width / r.width), Math.round((e.clientY - r.top) * cv.height / r.height)]; };
  cv.addEventListener('pointerdown', (e) => {
    cv.setPointerCapture(e.pointerId);
    lastP = toCanvas(e);
    plot(lastP[0], lastP[1], psize, perase ? '#fff' : pcol);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!lastP) return;
    const p = toCanvas(e);
    liner(lastP[0], lastP[1], p[0], p[1], psize, perase ? '#fff' : pcol);
    lastP = p;
  });
  const penUp = () => { lastP = null; };
  cv.addEventListener('pointerup', penUp);
  cv.addEventListener('pointercancel', penUp);

  // Media Player and CD Player
  const secVibe = $('#vibe');
  const hVibe = $('.sec-title', secVibe);
  const media = $('.loops-wrap', secVibe);
  const hLoops = $('h3', media);
  hLoops.remove();
  media.classList.add('dk-media');
  const hVibeWrap = hVibe;
  makeWin(media, { title: 'Feel the vibe', heading: hVibeWrap, app: 'Media Player', icon: 'display', task: true, menu: ['File', 'View', 'Device', 'Help'], status: `<span>${hLoops.textContent}: ${$$('.loop', media).length} clips. Click one to pause it.</span>` });
  const cdW = $('.music-wrap', secVibe);
  cdW.classList.add('dk-cd');
  const hCd = $('h3', cdW);
  const tracksEl = $('.tracks', cdW);
  const nTracks = $$('.track', tracksEl).length;
  cdW.insertBefore(make('div', 'dk-led', `<span data-led>[01] 00:00</span><small data-led-t>Press play</small>`), tracksEl);
  cdW.insertBefore(make('div', 'dk-cdbtns', '<button type="button" class="dk-btn" data-cd="prev" aria-label="Previous track">|&#9664;&#9664;</button><button type="button" class="dk-btn" data-cd="play" aria-label="Play">&#9654;</button><button type="button" class="dk-btn" data-cd="stop" aria-label="Stop">&#9632;</button><button type="button" class="dk-btn" data-cd="next" aria-label="Next track">&#9654;&#9654;|</button>'), tracksEl);
  const cdWin = makeWin(cdW, { title: 'CD Player', heading: hCd, app: 'CD Player', icon: 'cd', menu: ['Disc', 'View', 'Options', 'Help'], status: `<span>${nTracks} tracks</span>` });
  const led = $('[data-led]', cdW);
  const ledT = $('[data-led-t]', cdW);
  const trackBtns = $$('.track-btn', tracksEl);
  let cur = 0;
  let cdT = 0;
  let cdS = 0;
  const pad = (n) => String(n).padStart(2, '0');
  const paintLed = () => {
    const s = cdS ? Math.floor((Date.now() - cdS) / 1000) : 0;
    led.textContent = `[${pad(cur + 1)}] ${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  };
  const cdPlay = (i) => {
    cur = (i + nTracks) % nTracks;
    cdS = Date.now();
    clearInterval(cdT);
    cdT = setInterval(paintLed, 1000);
    ledT.textContent = trackBtns[cur].dataset.track;
    paintLed();
  };
  const cdStop = () => { clearInterval(cdT); cdS = 0; ledT.textContent = 'Stopped'; paintLed(); };
  trackBtns.forEach((b, i) => b.addEventListener('click', () => cdPlay(i)));
  $('[data-player-close]').addEventListener('click', cdStop);
  $$('[data-cd]', cdW).forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.cd;
    if (a === 'stop') { $('[data-player-close]').click(); return; }
    const i = a === 'next' ? cur + 1 : a === 'prev' ? cur - 1 : cur;
    trackBtns[(i + nTracks) % nTracks].click();
  }));

  // Exploring and Favorites
  const secRefs = $('#refs');
  const hRefs = $('.sec-title', secRefs);
  const gal = $('.ref-gallery', secRefs);
  const lists = $('.ref-lists', secRefs);
  const explorer = make('div', 'dk-explorer');
  const nPics = $$('.shot', gal).length;
  const games = $('.ref-games', lists);
  const others = $('.ref-media', lists);
  games.id = 'dk-games';
  others.id = 'dk-other';
  const tree = make('nav', 'dk-tree', `<ul><li><a href="#refs">${ico('computer')}<span>My Computer</span></a><ul>
      <li><a href="#refs">${ico('folder')}<span>Pictures</span></a></li>
      <li><a href="#dk-games">${ico('folder')}<span>Games</span></a></li>
      <li><a href="#dk-other">${ico('folder')}<span>Other programs</span></a></li>
      <li><a href="#how">${ico('setup')}<span>Setup</span></a></li>
      <li><a href="#palette">${ico('paint')}<span>Paint</span></a></li>
    </ul></li></ul>`);
  tree.setAttribute('aria-label', 'Folders');
  explorer.append(hRefs, tree, gal);
  secRefs.prepend(explorer);
  makeWin(explorer, { title: 'More references', heading: hRefs, app: 'Exploring', icon: 'folder', task: true, menu: ['File', 'Edit', 'View', 'Go', 'Favorites', 'Help'], status: `<span>${nPics} object(s)</span><span class="shrink">Click a picture to open it</span>` });
  const favs = make('div', 'dk-favs');
  favs.append(lists);
  secRefs.append(favs);
  makeWin(favs, { title: 'Favorites', icon: 'globe' });

  // Sources: a document window of its own, so the list keeps a frame.
  const secSrc = $('#sources');
  if (secSrc) {
    const hSrc = $('.sec-title', secSrc);
    const srcWin = make('div', 'dk-sources');
    srcWin.append(hSrc, $('.sources', secSrc));
    secSrc.prepend(srcWin);
    makeWin(srcWin, { title: 'Sources', heading: hSrc, app: 'WordPad', icon: 'doc' });
  }
  $('h3', games).insertAdjacentHTML('afterbegin', ico('cd'));
  $('h3', others).insertAdjacentHTML('afterbegin', ico('globe'));

  // Network Neighborhood and About
  const secRel = $('#related');
  const net = make('div', 'dk-network');
  const hRel = $('.sec-title', secRel);
  net.append(hRel, $('.related', secRel));
  secRel.prepend(net);
  makeWin(net, { title: 'Related styles', heading: hRel, app: 'Network Neighborhood', icon: 'network', task: true });
  const foot = $('.foot');
  foot.insertAdjacentHTML('afterbegin', ico('info', 24));
  const winAbout = makeWin(foot, { title: 'About This Page', icon: 'info' });

  // Windows raise on click, but the taskbar also follows you down the page.
  const taskWins = wins.filter((w) => w.task);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (performance.now() - lastFocus < 1200) return;
      for (const e of entries) {
        if (e.isIntersecting) { const w = wins.find((x) => x.el === e.target); if (w) focusWin(w, false); }
      }
    }, { rootMargin: '-46% 0px -50% 0px' });
    taskWins.forEach((w) => io.observe(w.el));
  }
  focusWin(winWelcome, false);

  // Welcome buttons
  tipBtns.addEventListener('click', (e) => {
    const a = e.target.dataset.a;
    if (a === 'next') { tipI = (tipI + 1) % TIPS.length; tipText.textContent = TIPS[tipI]; }
    if (a === 'new') $('#how').scrollIntoView({ behavior: smooth() });
    if (a === 'close') closeWin(winWelcome);
  });

  // Setup wizard: Back and Next move through the steps, and the progress bar is your reading position.
  const steps = $$('.step', setup);
  let stepI = 0;
  const mark = (i, jump) => {
    stepI = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach((s, n) => s.classList.toggle('is-cur', n === stepI));
    if (jump) steps[stepI].scrollIntoView({ behavior: smooth(), block: 'center' });
  };
  setupBtns.addEventListener('click', (e) => {
    const a = e.target.dataset.s;
    if (a === 'back') mark(stepI - 1, true);
    if (a === 'next') mark(stepI + 1, true);
    if (a === 'cancel') toast('Setup cannot be cancelled. You have already learned too much.');
  });
  mark(0, false);
  const fill = $('.dk-bar-fill', setup);
  const progLabel = $('[data-prog-label]', setup);
  let queuedProg = false;
  const paintProg = () => {
    queuedProg = false;
    const r = setup.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (innerHeight * 0.7 - r.top) / Math.max(1, r.height)));
    fill.style.setProperty('--p', `${Math.round(p * 25) * 4}%`);
    progLabel.textContent = p >= 0.99 ? 'Setup is complete. You may now make the style.' : `Setup is copying files... ${Math.round(p * 25) * 4}%`;
  };
  addEventListener('scroll', () => { if (!queuedProg) { queuedProg = true; requestAnimationFrame(paintProg); } }, { passive: true });
  paintProg();

  // ---- Start menu ------------------------------------------------------------------------------
  const start = make('div', 'dk-startmenu');
  start.hidden = true;
  start.setAttribute('role', 'menu');
  start.setAttribute('aria-label', 'Start menu');
  const startList = make('div', 'dk-startlist');
  const toc = $('.toc');
  startList.append(toc);
  const TOC_ICONS = { feel: 'notepad', core: 'control', how: 'setup', palette: 'paint', vibe: 'cd', refs: 'folder' };
  $$('a', toc).forEach((a) => {
    const id = a.getAttribute('href').slice(1);
    a.insertAdjacentHTML('afterbegin', ico(TOC_ICONS[id] || 'doc'));
    a.addEventListener('click', () => { openSection(id); closeStart(); });
  });
  start.append(make('div', 'dk-banner', '<span><b>Desktop</b><em>core</em></span>'), startList);
  startList.insertAdjacentHTML('beforeend', `<hr>
    <a href="#related" data-rel>${ico('network')}<span>Related styles</span></a>
    <button type="button" data-do="restore">${ico('folder')}<span>Restore All Windows</span></button>
    <button type="button" data-do="props">${ico('display')}<span>Settings: Display...</span></button>
    <button type="button" data-do="saver">${ico('computer')}<span>Screen Saver</span></button>
    <a href="../index.html">${ico('globe')}<span>All Styles</span></a>
    <hr>
    <button type="button" data-do="off">${ico('power')}<span>Shut Down...</span></button>`);
  document.body.append(start);
  $('[data-rel]', start).addEventListener('click', () => { openSection('related'); closeStart(); });
  function openStart() { start.hidden = false; startBtn.setAttribute('aria-expanded', 'true'); const f = $('a', start); if (f) f.focus({ preventScroll: true }); }
  function closeStart() { start.hidden = true; startBtn.setAttribute('aria-expanded', 'false'); }
  startBtn.addEventListener('click', () => { if (start.hidden) openStart(); else closeStart(); });
  document.addEventListener('pointerdown', (e) => { if (!start.hidden && !start.contains(e.target) && !startBtn.contains(e.target)) closeStart(); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (!start.hidden) { closeStart(); startBtn.focus(); } closePop(); $$('.is-max').forEach((el) => { const w = wins.find((x) => x.el === el); if (w) toggleMax(w); }); }
  });
  start.addEventListener('click', (e) => {
    const d = e.target.closest('[data-do]');
    if (!d) return;
    closeStart();
    if (d.dataset.do === 'restore') { wins.forEach((w) => { if (w !== propsWin) restore(w, false); w.dx = 0; w.dy = 0; w.el.style.transform = ''; }); closeWin(propsWin); toastEl.classList.remove('on'); }
    if (d.dataset.do === 'props') openProps();
    if (d.dataset.do === 'saver') startSaver();
    if (d.dataset.do === 'off') shutDown();
  });
  function openSection(id) {
    const sec = document.getElementById(id);
    if (!sec) return;
    const list = wins.filter((w) => sec.contains(w.el));
    list.forEach((w) => { if (w.el.classList.contains('is-min') || w.el.classList.contains('is-closed') || w.el.classList.contains('is-rolled')) restore(w, false); });
    if (list[0]) focusWin(list[0]);
    $$('.is-max').forEach((el) => { const w = wins.find((x) => x.el === el); if (w) toggleMax(w); });
  }
  function openWin(w) {
    restore(w, false);
    w.el.scrollIntoView({ behavior: smooth(), block: 'center' });
  }

  // ---- desktop icons ---------------------------------------------------------------------------
  const DESK = [
    ['computer', 'My Computer', () => openGo('core')],
    ['setup', 'Setup', () => openGo('how')],
    ['notepad', 'Readme', () => openGo('feel')],
    ['paint', 'Paint', () => openGo('palette')],
    ['cd', 'CD Player', () => openGo('vibe')],
    ['globe', 'The Internet', () => openGo('refs')],
    ['network', 'Network Neighborhood', () => openGo('related')],
    ['recycle', 'Recycle Bin', () => openWin(winAvoid)],
  ];
  function openGo(id) { openSection(id); document.getElementById(id).scrollIntoView({ behavior: smooth() }); }
  const iconsEl = make('div', 'dk-icons');
  iconsEl.setAttribute('role', 'group');
  iconsEl.setAttribute('aria-label', 'Desktop icons');
  DESK.forEach(([icon, label, run]) => {
    const b = make('button', 'dk-icon', `${ico(icon, 24)}<span>${label}</span>`);
    b.type = 'button';
    b.title = `Open ${label}`;
    let lastDown = 0;
    b.addEventListener('click', (e) => {
      const now = performance.now();
      const open = e.detail === 0 || now - lastDown < 700 || coarse.matches;
      $$('.dk-icon', iconsEl).forEach((x) => x.classList.toggle('sel', x === b));
      lastDown = now;
      if (open) run();
    });
    iconsEl.append(b);
  });
  const coarse = matchMedia('(pointer: coarse)');
  page.prepend(iconsEl);

  // ---- right-click on the desktop --------------------------------------------------------------
  const isDesk = (t) => t === document.documentElement || t === document.body || t === page || t.matches?.('.hero, .sec, main, .dk-icons, .dk-wall, .dk-trails');
  function refreshDesk() { tctx.clearRect(0, 0, trailCv.width, trailCv.height); $$('.dk-icon', iconsEl).forEach((x) => x.classList.remove('sel')); toast('Refreshed.'); }
  document.addEventListener('contextmenu', (e) => {
    if (!isDesk(e.target)) return;
    e.preventDefault();
    openPop(e.clientX, e.clientY, [
      { label: 'Arrange Icons', run: () => { const a = [...iconsEl.children]; a.reverse().forEach((n) => iconsEl.append(n)); } },
      { label: 'Line up Icons' },
      '-',
      { label: 'Refresh', run: refreshDesk },
      { label: 'Screen Saver', run: () => startSaver() },
      '-',
      { label: 'Properties', run: () => openProps() },
    ]);
  });
  document.addEventListener('pointerdown', (e) => { if (isDesk(e.target)) $$('.dk-icon', iconsEl).forEach((x) => x.classList.remove('sel')); });

  // ---- Display Properties ----------------------------------------------------------------------
  const props = make('div', 'dk-props');
  props.innerHTML = `<div class="dk-preview" aria-hidden="true"><i></i><b></b></div>
    <fieldset><legend>Scheme</legend>${Object.entries(SCHEMES).map(([k, v]) => `<label><input type="radio" name="dk-scheme" value="${k}"> ${v}</label>`).join('')}</fieldset>
    <fieldset><legend>Effects</legend><label><input type="checkbox" data-trails> Leave a trail when dragging windows, like a frozen PC</label></fieldset>
    <div class="dk-props-btns"><button type="button" class="dk-btn" data-p="saver">Screen Saver</button><button type="button" class="dk-btn" data-p="ok">OK</button></div>`;
  document.body.append(props);
  const propsWin = makeWin(props, { title: 'Display Properties', icon: 'display' });
  props.classList.add('is-closed');
  $$('.dk-ctl .min, .dk-ctl .max', props).forEach((b) => b.remove());
  const radios = $$('[name=dk-scheme]', props);
  const trailBox = $('[data-trails]', props);
  function openProps() {
    radios.forEach((r) => { r.checked = r.value === readScheme(); });
    trailBox.checked = trailsOn;
    props.classList.remove('is-closed');
    focusWin(propsWin);
    props.style.zIndex = 952;
  }
  radios.forEach((r) => r.addEventListener('change', () => { setScheme(r.value); store.set('eas-desktopcore-scheme', r.value); }));
  trailBox.addEventListener('change', () => { trailsOn = trailBox.checked; store.set('eas-desktopcore-trails', trailsOn ? '1' : '0'); });
  props.addEventListener('click', (e) => {
    const a = e.target.dataset.p;
    if (a === 'ok') props.classList.add('is-closed');
    if (a === 'saver') { props.classList.add('is-closed'); startSaver(); }
  });

  // ---- shut down -------------------------------------------------------------------------------
  function shutDown() {
    const o = make('div', 'dk-off', '<p data-off>Please wait while your computer shuts down.</p>');
    o.setAttribute('role', 'dialog');
    o.setAttribute('aria-label', 'Shut down');
    document.body.append(o);
    const done = () => {
      $('[data-off]', o).textContent = "It's now safe to turn off your computer.";
      o.insertAdjacentHTML('beforeend', '<div class="dk-off-btns"><button type="button" data-r>Restart</button><a href="../index.html">All styles</a></div>');
      const r = $('[data-r]', o);
      r.addEventListener('click', () => { o.remove(); startBtn.focus(); });
      r.focus();
    };
    if (isCalm()) done(); else setTimeout(done, 1400);
  }

  // ---- screen saver ----------------------------------------------------------------------------
  let saverOn = false;
  let lastInput = performance.now();
  function startSaver() {
    if (saverOn || isCalm()) return;
    saverOn = true;
    const o = make('div', 'dk-saver', '<canvas></canvas>');
    o.setAttribute('aria-hidden', 'true');
    document.body.append(o);
    const c = $('canvas', o);
    const g = c.getContext('2d');
    c.width = innerWidth;
    c.height = innerHeight;
    const stars = Array.from({ length: 180 }, () => ({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: Math.random() }));
    let raf = 0;
    let last = performance.now();
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      g.fillStyle = '#000';
      g.fillRect(0, 0, c.width, c.height);
      for (const s of stars) {
        s.z -= dt * 0.22;
        if (s.z <= 0.02) { s.x = (Math.random() - 0.5) * 2; s.y = (Math.random() - 0.5) * 2; s.z = 1; }
        const k = 0.42 / s.z;
        const X = c.width / 2 + s.x * k * c.width * 0.5;
        const Y = c.height / 2 + s.y * k * c.height * 0.5;
        const b = Math.min(255, Math.round((1 - s.z) * 300));
        g.fillStyle = `rgb(${b},${b},${b})`;
        const sz = s.z < 0.3 ? 2 : 1;
        g.fillRect(X, Y, sz, sz);
      }
    };
    raf = requestAnimationFrame(frame);
    const stop = () => {
      cancelAnimationFrame(raf);
      o.remove();
      saverOn = false;
      lastInput = performance.now();
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerdown', stop);
      removeEventListener('keydown', stop);
    };
    let budget = 8;
    const onMove = () => { budget -= 1; if (budget <= 0) stop(); };
    addEventListener('pointermove', onMove);
    addEventListener('pointerdown', stop);
    addEventListener('keydown', stop);
  }
  ['pointermove', 'pointerdown', 'keydown', 'scroll', 'wheel'].forEach((ev) => addEventListener(ev, () => { lastInput = performance.now(); }, { passive: true }));
  setInterval(() => {
    const playing = $('.track.is-playing') || $('dialog[open]');
    if (!saverOn && !playing && !document.hidden && !isCalm() && performance.now() - lastInput > 180000) startSaver();
  }, 5000);

  // ---- the helper ------------------------------------------------------------------------------
  const clip = make('div', 'dk-clip fx');
  clip.hidden = true;
  clip.innerHTML = `<div class="dk-bubble" hidden aria-live="polite"><p></p><div class="dk-bubble-btns"></div></div>
    <button type="button" class="dk-clipbody" aria-label="Ask the helper">
      <svg viewBox="0 0 74 96" aria-hidden="true"><path d="M22 34V78a13 13 0 0 0 26 0V22a9 9 0 0 0-18 0V70a4.500 4.500 0 0 0 9 0V34" fill="none" stroke="#6f7680" stroke-width="5" stroke-linecap="round"/><path d="M22 34V78a13 13 0 0 0 26 0V22a9 9 0 0 0-18 0V70a4.500 4.500 0 0 0 9 0V34" fill="none" stroke="#dfe3e8" stroke-width="2" stroke-linecap="round"/><g class="eyes"><circle cx="26" cy="22" r="9.500" fill="#fff" stroke="#000" stroke-width="1.500"/><circle cx="46" cy="22" r="9.500" fill="#fff" stroke="#000" stroke-width="1.500"/><circle class="pu" cx="26" cy="22" r="4" fill="#111"/><circle class="pu" cx="46" cy="22" r="4" fill="#111"/></g><path d="M17 9l14 4M55 9l-14 4" stroke="#222" stroke-width="3" stroke-linecap="round"/></svg>
    </button>`;
  document.body.append(clip);
  const bubble = $('.dk-bubble', clip);
  const bubbleP = $('p', bubble);
  const bubbleB = $('.dk-bubble-btns', bubble);
  const say = (text, buttons) => {
    clip.hidden = false;
    bubble.hidden = false;
    bubbleP.textContent = text;
    bubbleB.textContent = '';
    (buttons || [['OK', null]]).forEach(([label, run]) => {
      const b = make('button', 'dk-btn', label);
      b.type = 'button';
      b.addEventListener('click', () => { bubble.hidden = true; if (run) run(); });
      bubbleB.append(b);
    });
  };
  const visits = (parseInt(store.get('eas-desktopcore-visits') || '0', 10) || 0) + 1;
  store.set('eas-desktopcore-visits', String(visits));
  const opened = Date.now();
  let saidTime = false;
  const hello = () => {
    if (isCalm() || saverOn) return;
    if (visits > 1) say('You came back. Would you like help with that?', [['Yes', () => openGo('how')], ['No', () => say('OK. I will be right here.', [['Fine', null]])]]);
    else say("It looks like you're studying an art style. Would you like help with that?", [['Yes, show me how', () => openGo('how')], ['Just looking', () => say('OK. I will be right here.', [['Thanks', null]])]]);
  };
  const timeLine = () => {
    if (saidTime || isCalm() || saverOn || !bubble.hidden) return;
    saidTime = true;
    const mins = Math.max(1, Math.round((Date.now() - opened) / 60000));
    say(`It's ${fmtT.format(new Date())}. You've been reading for ${mins} minute${mins === 1 ? '' : 's'}. I've been watching the clock for you.`, [['Thanks', null], ['Please stop', () => { clip.hidden = true; }]]);
  };
  // The helper waits until you have started reading, so that the first screen stays clear.
  let greeted = false;
  const greet = () => { if (!greeted) { greeted = true; hello(); } };
  setTimeout(greet, 30000);
  addEventListener('scroll', () => { if (scrollY > 500 && !greeted) setTimeout(greet, 1500); }, { passive: true });
  setTimeout(timeLine, 150000);
  $('.dk-clipbody', clip).addEventListener('click', () => {
    const list = $$('.do li, .avoid li').map(plain);
    say(`Tip: ${list[Math.floor(Math.random() * list.length)]}`, [['OK', null], ['Go away', () => { clip.hidden = true; }]]);
  });
  const pupils = $$('.pu', clip);
  addEventListener('pointermove', (e) => {
    if (clip.hidden || isCalm()) return;
    const r = clip.getBoundingClientRect();
    const a = Math.atan2(e.clientY - (r.bottom - 74), e.clientX - (r.right - 37));
    const dx = (Math.cos(a) * 3.4).toFixed(1);
    const dy = (Math.sin(a) * 3.4).toFixed(1);
    pupils.forEach((p) => p.setAttribute('transform', `translate(${dx} ${dy})`));
  }, { passive: true });
  addEventListener('eas:calm', () => { if (isCalm()) { tctx.clearRect(0, 0, trailCv.width, trailCv.height); } });
})();
