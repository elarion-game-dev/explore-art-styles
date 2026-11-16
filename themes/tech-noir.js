// Tech-noir: the ESPER. Rest the pointer on an image and the machine enhances. Move it and the machine tracks. Move away and it pulls back.
// Also: a scroll ruler, a crosshair with coordinates, blinds that slide as you scroll, and section jumps that move in steps.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const make = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
  const pad = (n, w = 4) => String(Math.max(0, Math.round(n))).padStart(w, '0');

  const blinds = document.querySelector('.tn-blinds');
  const sweep = document.querySelector('.tn-sweep');
  const atlasH = () => document.querySelector('.atlas').offsetHeight;

  // Ruler down the left edge. It scrolls with the page and marks every section in amber.
  const ruler = make('div', 'tn-ruler fx');
  ruler.setAttribute('aria-hidden', 'true');
  const rc = make('canvas');
  ruler.append(rc);
  document.body.append(ruler);
  const rctx = rc.getContext('2d');
  let marks = [];
  let pointerY = null;
  function readMarks() {
    marks = [...document.querySelectorAll('.hero, .sec')].map((s, i) => ({
      y: s.getBoundingClientRect().top + scrollY,
      label: i === 0 ? 'TOP' : `${String.fromCharCode(64 + i)}${i}`,
    }));
  }
  function sizeRuler() {
    const b = ruler.getBoundingClientRect();
    rc.width = b.width || 56;
    rc.height = b.height || innerHeight;
  }
  function drawRuler() {
    const w = rc.width;
    const h = rc.height;
    if (!w || ruler.offsetParent === null && getComputedStyle(ruler).display === 'none') return;
    const top = scrollY;
    rctx.clearRect(0, 0, w, h);
    rctx.font = '10px "B612 Mono", monospace';
    rctx.textBaseline = 'middle';
    const first = Math.floor(top / 16) * 16;
    for (let y = first; y < top + h; y += 16) {
      const py = y - top + 0.5;
      const major = y % 64 === 0;
      rctx.fillStyle = major ? 'rgba(180,200,215,.55)' : 'rgba(160,185,205,.28)';
      rctx.fillRect(w - (major ? 16 : 7), py, major ? 16 : 7, 1);
      if (y % 128 === 0) {
        rctx.fillStyle = 'rgba(180,200,215,.7)';
        rctx.fillText(pad(y, 5), 4, py);
      }
    }
    for (const m of marks) {
      const py = m.y - top;
      if (py < -12 || py > h + 12) continue;
      rctx.fillStyle = '#f8b418';
      rctx.fillRect(0, py - 8, w, 16);
      rctx.fillStyle = '#000';
      rctx.fillText(`${m.label}`, 5, py);
    }
    if (pointerY !== null) {
      rctx.fillStyle = '#2bf04a';
      rctx.fillRect(w - 16, pointerY - atlasH(), 16, 2);
    }
  }

  // Blinds slide as you scroll, a little slower than the page.
  let queued = false;
  function onFrame() {
    queued = false;
    const y = scrollY;
    const t = `translate3d(0,${(-(y * 0.14) % 92).toFixed(1)}px,0)`;
    if (blinds) blinds.style.transform = t;
    if (sweep) sweep.style.transform = t;
    drawRuler();
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(onFrame); } };
  addEventListener('scroll', queue, { passive: true });
  const refresh = () => { sizeRuler(); readMarks(); queue(); };
  addEventListener('resize', refresh);
  addEventListener('load', refresh);
  addEventListener('eas:calm', refresh);
  if (document.fonts?.ready) document.fonts.ready.then(refresh);
  setInterval(readMarks, 3000);
  refresh();

  // The console: a small panel with an overview of the image and the machine's spoken log.
  const con = make('div', 'tn-console fx', `<div class="tn-brand">esper <small>point, hold still, enhance</small></div>
    <div class="tn-inset"><div class="tn-view"></div></div>
    <div class="tn-coords"><span class="c-z">ZM 0001</span><span class="c-n">NS 0224</span><span class="c-e">EW 0224</span></div>
    <ol class="tn-log"></ol>`);
  con.setAttribute('aria-hidden', 'true');
  document.body.append(con);
  const $inset = con.querySelector('.tn-inset');
  const $view = con.querySelector('.tn-view');
  const $log = con.querySelector('.tn-log');
  const $z = con.querySelector('.c-z');
  const $n = con.querySelector('.c-n');
  const $e = con.querySelector('.c-e');
  let hideTimer = 0;
  function say(line) {
    const li = make('li');
    li.textContent = line;
    $log.append(li);
    while ($log.children.length > 3) $log.firstChild.remove();
  }
  const showConsole = () => { clearTimeout(hideTimer); con.classList.add('on'); };
  const hideConsole = (ms = 1400) => { clearTimeout(hideTimer); hideTimer = setTimeout(() => con.classList.remove('on'), ms); };

  // Section jumps move in steps, with the command read back.
  const toc = document.querySelector('.toc');
  toc.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || isCalm()) return;
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const from = scrollY;
    const to = target.getBoundingClientRect().top + scrollY - atlasH() - 14;
    const dist = to - from;
    const steps = 6;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    for (let i = 1; i <= steps; i += 1) setTimeout(() => scrollTo(0, from + (dist * i) / steps), (i - 1) * 90);
    setTimeout(() => { root.style.scrollBehavior = prev; history.replaceState(null, '', a.getAttribute('href')); }, steps * 90 + 20);
    say(`TRACK ${pad(Math.abs(dist))} ${dist >= 0 ? 'DOWN' : 'UP'}. STOP.`);
    if (fine) { showConsole(); hideConsole(2400); }
  });

  if (!fine) return;

  // Crosshair across the whole page, snapped to an 8 pixel grid.
  const hx = make('div', 'tn-hair x fx');
  const hy = make('div', 'tn-hair y fx');
  const tag = make('div', 'tn-tag fx');
  for (const e of [hx, hy, tag]) { e.setAttribute('aria-hidden', 'true'); document.body.append(e); }
  addEventListener('pointermove', (e) => {
    if (isCalm()) return;
    root.classList.add('tn-on');
    const x = Math.round(e.clientX / 8) * 8;
    const y = Math.round(e.clientY / 8) * 8;
    hx.style.transform = `translateY(${y}px)`;
    hy.style.transform = `translateX(${x}px)`;
    tag.textContent = `${pad(x)} ${pad(y + scrollY)}`;
    tag.style.transform = `translate(${Math.min(x + 8, innerWidth - 90)}px, ${Math.max(y - 20, atlasH() + 4)}px)`;
    pointerY = y;
    queue();
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { root.classList.remove('tn-on'); pointerY = null; queue(); });

  // The ESPER itself.
  const overlay = make('div', 'tn-esper', `<i class="tn-gx"></i><i class="tn-gy"></i><div class="tn-sel"></div><div class="tn-wipe"></div>
    <div class="tn-read"><span class="r-z"></span><span class="r-n"></span><span class="r-e"></span></div>`);
  overlay.setAttribute('aria-hidden', 'true');
  const $gx = overlay.querySelector('.tn-gx');
  const $gy = overlay.querySelector('.tn-gy');
  const $sel = overlay.querySelector('.tn-sel');
  const $wipe = overlay.querySelector('.tn-wipe');
  const $rz = overlay.querySelector('.r-z');
  const $rn = overlay.querySelector('.r-n');
  const $re = overlay.querySelector('.r-e');
  const GRID = 40;
  const ZOOMS = [1, 2, 4, 8];
  let cur = null;
  let still = 0;

  const snap = (v) => Math.round(v * GRID) / GRID;
  const ew = (v) => Math.round(v * 448);

  function apply() {
    const { img, step, cx, cy } = cur;
    const z = ZOOMS[step];
    const left = (cx - 0.5 / z) * z * 100;
    const top = (cy - 0.5 / z) * z * 100;
    img.style.transform = z === 1 ? '' : `translate(${-left}%, ${-top}%) scale(${z})`;
    $view.style.left = `${(cx - 0.5 / z) * 100}%`;
    $view.style.top = `${(cy - 0.5 / z) * 100}%`;
    $view.style.width = `${100 / z}%`;
    $view.style.height = `${100 / z}%`;
    paintRead();
  }
  function paintRead() {
    const z = ZOOMS[cur.step];
    const ns = pad(ew(cur.ny));
    const es = pad(ew(cur.nx));
    const zs = pad(z);
    $rz.textContent = `ZM ${zs}`;
    $rn.textContent = `NS ${ns}`;
    $re.textContent = `EW ${es}`;
    $z.textContent = `ZM ${zs}`;
    $n.textContent = `NS ${ns}`;
    $e.textContent = `EW ${es}`;
  }
  function clamp(v, z) { const m = 0.5 / z; return Math.min(1 - m, Math.max(m, v)); }
  function paintSelection() {
    const z = ZOOMS[Math.min(cur.step + 1, ZOOMS.length - 1)];
    const atMax = cur.step === ZOOMS.length - 1;
    $sel.style.opacity = atMax ? 0 : 1;
    if (cur.step === 0) {
      const w = 100 / z;
      $sel.style.width = `${w}%`;
      $sel.style.height = `${w}%`;
      $sel.style.left = `${(clamp(cur.nx, z) - 0.5 / z) * 100}%`;
      $sel.style.top = `${(clamp(cur.ny, z) - 0.5 / z) * 100}%`;
    } else {
      // Zoomed in, the box sits in the middle: that is what the next step will show.
      $sel.style.width = '50%';
      $sel.style.height = '50%';
      $sel.style.left = '25%';
      $sel.style.top = '25%';
    }
    $gx.style.top = `${cur.ny * 100}%`;
    $gy.style.left = `${cur.nx * 100}%`;
    if (cur.step > 0) { $gx.style.top = '50%'; $gy.style.left = '50%'; }
  }
  function refreshWipe() {
    $wipe.classList.remove('go');
    void $wipe.offsetWidth;
    $wipe.classList.add('go');
  }
  function enhance() {
    if (!cur || cur.step >= ZOOMS.length - 1) return;
    const a = ew(cur.lastX);
    const b = ew(cur.ny);
    cur.step += 1;
    const z = ZOOMS[cur.step];
    cur.cx = clamp(cur.nx, z);
    cur.cy = clamp(cur.ny, z);
    apply();
    paintSelection();
    refreshWipe();
    say(`ENHANCE ${pad(a, 3)} TO ${pad(b, 3)}`);
    cur.lastX = cur.nx;
    clearTimeout(still);
    still = setTimeout(enhance, 1300);
  }
  function enter(link) {
    if (isCalm()) return;
    if (cur && cur.link === link) return;
    leave();
    const img = link.querySelector('img');
    if (!img) return;
    cur = { link, img, step: 0, nx: 0.5, ny: 0.5, cx: 0.5, cy: 0.5, lastX: 0.5, moved: 0, movedY: 0 };
    link.classList.add('tn-live');
    link.append(overlay);
    showConsole();
    const full = link.href;
    if (!img.src.endsWith(full.split('/').pop())) {
      // Gallery images use thumbnails. Enhancing swaps in the full file, so there really is more detail to find.
      const pre = new Image();
      pre.onload = () => { if (cur && cur.img === img) { img.src = full; $inset.style.backgroundImage = `url("${full}")`; } };
      pre.src = full;
    }
    $inset.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
    $inset.style.aspectRatio = `${img.naturalWidth || 16} / ${img.naturalHeight || 10}`;
    say(`LOCATE ${(link.dataset.title || '').toUpperCase()}`);
    apply();
    paintSelection();
    still = setTimeout(enhance, 900);
  }
  function leave() {
    if (!cur) return;
    clearTimeout(still);
    const { link, img, step } = cur;
    img.style.transform = '';
    link.classList.remove('tn-live');
    overlay.remove();
    if (step) say('PULL BACK. STOP.');
    cur = null;
    hideConsole();
  }
  function track(e) {
    if (!cur) return;
    const b = cur.link.getBoundingClientRect();
    const nx = snap(Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)));
    const ny = snap(Math.min(1, Math.max(0, (e.clientY - b.top) / b.height)));
    if (nx === cur.nx && ny === cur.ny) return;
    const dx = nx - cur.nx;
    const dy = ny - cur.ny;
    cur.moved += dx;
    cur.movedY += dy;
    cur.nx = nx;
    cur.ny = ny;
    const z = ZOOMS[cur.step];
    if (cur.step > 0) {
      // Zoomed in, the pointer drags the view by its travel, one grid cell at a time.
      cur.cx = clamp(cur.cx + dx / (z / 2), z);
      cur.cy = clamp(cur.cy + dy / (z / 2), z);
      apply();
    } else {
      paintRead();
    }
    paintSelection();
    clearTimeout(still);
    still = setTimeout(() => {
      if (!cur) return;
      const mx = Math.round(Math.abs(cur.moved) * 448);
      const my = Math.round(Math.abs(cur.movedY) * 448);
      if (cur.step > 0 && (mx > 8 || my > 8)) {
        const parts = [];
        if (mx > 8) parts.push(`TRACK ${mx} ${cur.moved > 0 ? 'RIGHT' : 'LEFT'}`);
        if (my > 8) parts.push(`${parts.length ? '' : 'TRACK '}${my} ${cur.movedY > 0 ? 'DOWN' : 'UP'}`);
        say(`${parts.join(', ')}. STOP.`);
      }
      cur.moved = 0;
      cur.movedY = 0;
      still = setTimeout(enhance, 620);
    }, 180);
  }
  document.addEventListener('mouseover', (e) => { const l = e.target.closest('a.shot-link'); if (l) enter(l); });
  document.addEventListener('mouseout', (e) => {
    if (!cur) return;
    const to = e.relatedTarget;
    if (!to || !cur.link.contains(to)) leave();
  });
  document.addEventListener('mousemove', track, { passive: true });
  addEventListener('eas:calm', () => { if (isCalm()) { leave(); con.classList.remove('on'); root.classList.remove('tn-on'); } });
})();
