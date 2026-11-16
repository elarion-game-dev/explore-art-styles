// 90s FMV: chroma key on the title stage, Cinepak decoding on images, a camera-switching console for the gallery,
// disc swaps as you scroll, and interactive-movie choices at the end of each scene.
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const calm = () => root.dataset.calm === '1';
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };

  // SVG filters that turn an image into Cinepak-sized blocks.
  const sizes = [24, 12, 6, 3];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.innerHTML = sizes.map((n) => `<filter id="fmv-dec${n}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feFlood x="${n / 2}" y="${n / 2}" width="1" height="1"/><feComposite width="${n}" height="${n}"/><feTile result="t"/>
    <feComposite in="SourceGraphic" in2="t" operator="in"/><feMorphology operator="dilate" radius="${n / 2}"/></filter>`).join('');
  document.body.append(svg);

  // Video mode, as in the settings of 1995 FMV games.
  const setMode = (m) => { if (m === 'full') root.dataset.fmvVideo = 'full'; else delete root.dataset.fmvVideo; };
  setMode(store.get('eas-fmv-video'));

  // The title stage: a chroma key you can switch on.
  const stage = $('.hero-text');
  const key = document.createElement('button');
  key.type = 'button';
  key.className = 'fmv-key';
  key.setAttribute('aria-pressed', 'false');
  key.textContent = 'Chroma key';
  key.title = 'Key out the blue screen and composite the title over a rendered set';
  key.addEventListener('click', () => {
    const on = !stage.classList.contains('is-keyed');
    stage.classList.toggle('is-keyed', on);
    key.setAttribute('aria-pressed', String(on));
  });
  const tc = document.createElement('span');
  tc.className = 'fmv-tc';
  tc.setAttribute('aria-hidden', 'true');
  tc.textContent = 'SC 1  TK 3  BLUE SCREEN';
  stage.append(key, tc);

  // The console strip above the monitor bank.
  const strip = document.createElement('div');
  strip.className = 'fmv-strip';
  strip.innerHTML = `<span class="fmv-rec">4 cameras online</span><span>320 x 240 · 15 fps · 256 colours</span>
    <span class="fmv-modes" role="group" aria-label="Video mode"><button type="button" data-mode="lines">Interlaced</button><button type="button" data-mode="full">Full frame</button></span>`;
  $('.hero-gallery').before(strip);
  const modeBtns = $$('[data-mode]', strip);
  const paintModes = () => modeBtns.forEach((b) => b.setAttribute('aria-pressed', String((root.dataset.fmvVideo || 'lines') === b.dataset.mode)));
  modeBtns.forEach((b) => b.addEventListener('click', () => { setMode(b.dataset.mode); store.set('eas-fmv-video', b.dataset.mode); paintModes(); }));
  paintModes();

  // Images decode from big blocks to sharp the first time they come into view.
  const resolve = (el) => {
    clearTimeout(el.fmvT);
    let i = 0;
    const step = () => {
      if (i < sizes.length && !calm()) { el.dataset.dec = sizes[i++]; el.fmvT = setTimeout(step, 110); } else delete el.dataset.dec;
    };
    step();
  };
  const decode = (link) => {
    if (calm() || link.dataset.decoded) return;
    link.dataset.decoded = '1';
    resolve(link);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { decode(e.target); io.unobserve(e.target); }
    }, { threshold: 0.35 });
    $$('.shot-link').forEach((a) => io.observe(a));
  }

  // Loops get the same glass and lines as the monitors.
  for (const v of $$('.loop video')) {
    const wrap = document.createElement('span');
    wrap.className = 'fmv-vid';
    v.before(wrap);
    wrap.append(v);
  }

  // ---- Security monitors: the gallery becomes a camera switcher ----
  const gal = $('.ref-gallery');
  if (gal) {
    const figs = $$('.shot', gal);
    const rooms = ['Hall 2', 'Entryway', 'Kitchen', 'Living room', 'Bedroom', 'Bathroom', 'Driveway', 'Hall 1', 'Garage', 'Attic', 'Den', 'Patio'];
    const box = document.createElement('div');
    box.className = 'fmv-console';
    box.innerHTML = `<div class="fmv-monitor">
      <button class="fmv-screen" type="button" aria-label="Open this camera full frame"><img alt=""><span class="fmv-osd" aria-hidden="true"><span class="fmv-camno"></span><span class="fmv-live">&#9679; Live</span></span><span class="fmv-static"></span></button>
      <div class="fmv-readout"><span class="fmv-room"></span><span class="fmv-clock" aria-hidden="true">26:00</span><span class="fmv-count"></span><button class="fmv-full" type="button">Full frame</button></div>
      <p class="fmv-cap" aria-live="polite"></p>
      <p class="fmv-hint">Pick a camera to switch the monitor. Full frame opens the original image.</p>
    </div>`;
    gal.before(box);
    box.append(gal);
    const screen = $('.fmv-screen', box);
    const img = $('img', screen);
    const fuzz = $('.fmv-static', box);
    const seen = new Set();
    let live = 0;
    let opening = false;
    const openLive = () => { opening = true; $('.shot-link', figs[live]).click(); opening = false; };
    const show = (i, quiet) => {
      live = i;
      const fig = figs[i];
      const a = $('.shot-link', fig);
      seen.add(i);
      figs.forEach((f, j) => { f.classList.toggle('is-live', j === i); f.classList.toggle('is-seen', seen.has(j)); });
      a.setAttribute('aria-current', 'true');
      figs.forEach((f, j) => { if (j !== i) $('.shot-link', f).removeAttribute('aria-current'); });
      screen.classList.toggle('is-pixel', fig.classList.contains('is-pixel'));
      img.src = a.href;
      img.alt = $('img', a).alt;
      $('.fmv-camno', box).textContent = `Cam ${String(i + 1).padStart(2, '0')}`;
      $('.fmv-room', box).textContent = rooms[i % rooms.length];
      $('.fmv-count', box).textContent = seen.size === figs.length ? `All ${figs.length} captured` : `Possible ${figs.length}  Captured ${seen.size}`;
      $('.fmv-cap', box).innerHTML = '';
      const b = document.createElement('b');
      b.textContent = a.dataset.title;
      const m = document.createElement('span');
      m.textContent = [a.dataset.meta, a.dataset.credit, a.dataset.license].filter(Boolean).join(' · ');
      $('.fmv-cap', box).append(b, m);
      if (!quiet && !calm()) { fuzz.classList.remove('on'); void fuzz.offsetWidth; fuzz.classList.add('on'); resolve(screen); }
    };
    // Clicking a camera switches the monitor instead of opening the lightbox.
    gal.addEventListener('click', (e) => {
      const a = e.target.closest('.shot-link');
      if (!a || opening || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      e.stopPropagation();
      show(figs.indexOf(a.closest('.shot')));
    }, true);
    screen.addEventListener('click', openLive);
    $('.fmv-full', box).addEventListener('click', openLive);
    figs.forEach((f) => { $('.shot-link', f).title = 'Switch the monitor to this camera'; });
    show(0, true);

    // The game clock runs down while effects are on.
    let t = 26 * 60;
    const clock = $('.fmv-clock', box);
    setInterval(() => {
      if (calm() || document.hidden) return;
      t = t > 0 ? t - 1 : 26 * 60;
      clock.textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    }, 1000);
  }

  // ---- Choices at the end of each scene ----
  const secs = $$('main .sec');
  const label = (s) => $(`.toc a[href="#${s.id}"]`)?.textContent || $('.sec-title', s).textContent;
  secs.forEach((s, i) => {
    const next = secs[i + 1];
    if (!next || next.id === 'related') return;
    const skip = secs[i + 2];
    const nav = document.createElement('nav');
    nav.className = 'fmv-choice';
    nav.setAttribute('aria-label', 'Choose what to watch next');
    const opts = [['A', 'Keep watching', next], ['B', 'Skip to', skip && skip.id !== 'related' ? skip : null], ['C', 'Rewind to', secs[i - 1] || null]].filter((o) => o[2]);
    nav.innerHTML = '<p>What do you do?</p>';
    for (const [k, verb, target] of opts) {
      const a = document.createElement('a');
      a.href = `#${target.id}`;
      a.innerHTML = `<b>${k}</b>`;
      a.append(`${verb}: ${label(target)}`);
      nav.append(a);
    }
    s.append(nav);
  });

  // ---- Disc swaps: the page is four discs long ----
  const discOf = { feel: 1, core: 1, how: 2, palette: 3, vibe: 3, refs: 4, related: 4 };
  const here = $('.atlas-here');
  const disc = document.createElement('span');
  disc.className = 'fmv-disc';
  disc.innerHTML = '<span class="fmv-cd"></span><span class="fmv-disc-n">Disc 1 of 4</span>';
  here.append(disc);
  const swap = document.createElement('div');
  swap.className = 'fmv-swap';
  swap.setAttribute('aria-hidden', 'true');
  swap.innerHTML = '<span class="fmv-cd"></span><span><span class="fmv-swap-t"></span><small></small></span>';
  document.body.append(swap);
  let current = 1;
  let quiet = true;
  let timers = [];
  const changeDisc = (n) => {
    if (n === current) return;
    current = n;
    $('.fmv-disc-n', disc).textContent = `Disc ${n} of 4`;
    timers.forEach(clearTimeout);
    timers = [];
    if (calm() || quiet) return;
    const cds = $$('.fmv-cd');
    cds.forEach((c) => c.classList.add('spin'));
    $('.fmv-swap-t', swap).textContent = `Please insert disc ${n}`;
    $('small', swap).textContent = 'Reading...';
    swap.classList.add('on');
    timers.push(setTimeout(() => { $('small', swap).textContent = `Disc ${n} ready`; }, 1100));
    timers.push(setTimeout(() => { swap.classList.remove('on'); cds.forEach((c) => c.classList.remove('spin')); }, 2000));
  };
  const onScroll = () => {
    const y = innerHeight * 0.4;
    let n = 1;
    for (const s of secs) if (s.getBoundingClientRect().top < y) n = discOf[s.id] || n;
    changeDisc(n);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  quiet = false;

  addEventListener('eas:calm', () => {
    if (calm()) {
      swap.classList.remove('on');
      $$('.fmv-cd').forEach((c) => c.classList.remove('spin'));
      $$('.shot-link[data-dec]').forEach((a) => delete a.dataset.dec);
    }
  });
})();
