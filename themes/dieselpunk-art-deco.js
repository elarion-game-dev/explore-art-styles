// Dieselpunk: builds the drowned city behind the page, the elevator dial and cable, the gilded doors that close on every trip, and the radio tuner.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];

  // A repeatable random series, so the skyline looks the same on every visit
  let seed = 31;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  // One stepped tower: a path that narrows through its setbacks, with a mast on top
  const tower = (x, w, h, ground) => {
    let d = `M${x} ${ground}`;
    let left = x;
    let right = x + w;
    let top = ground - h;
    const steps = 2 + Math.floor(rnd() * 3);
    const rungs = [];
    for (let i = 0; i < steps; i += 1) {
      rungs.push([left, top + (h * 0.32 * i) / steps]);
      left += w * 0.1;
    }
    let y = ground - h * 0.6;
    left = x;
    d = `M${x} ${ground}V${y.toFixed(0)}`;
    for (let i = 0; i < steps; i += 1) {
      left += w * 0.12;
      y -= h * 0.4 / (steps + 1);
      d += `H${left.toFixed(0)}V${y.toFixed(0)}`;
    }
    const mid = x + w / 2;
    d += `H${(mid - 3).toFixed(0)}V${(top - h * 0.08).toFixed(0)}H${(mid + 3).toFixed(0)}V${y.toFixed(0)}`;
    for (let i = 0; i < steps; i += 1) {
      const px = x + w - w * 0.12 * (steps - i);
      d += `H${px.toFixed(0)}V${(y + (h * 0.4) / (steps + 1)).toFixed(0)}`;
      y += h * 0.4 / (steps + 1);
    }
    d += `H${right}V${ground}Z`;
    return d;
  };
  const skyline = () => {
    const G = 900;
    let far = '';
    let near = '';
    let lights = '';
    for (let x = -30; x < 1650; x += 58 + rnd() * 60) far += `<path d="${tower(x, 60 + rnd() * 70, 280 + rnd() * 340, G)}"/>`;
    for (let x = -40; x < 1650; x += 96 + rnd() * 90) {
      const w = 90 + rnd() * 90;
      const h = 120 + rnd() * 340;
      near += `<path d="${tower(x, w, h, G)}"/>`;
      for (let wy = G - h * 0.6 + 20; wy < G - 12; wy += 22) {
        for (let wx = x + 12; wx < x + w - 10; wx += 16) {
          if (rnd() < 0.2) lights += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="5" height="8"/>`;
        }
      }
    }
    return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g fill="#07403a">${far}</g><g fill="#02120f">${near}</g><g fill="#e3ab36" opacity=".75">${lights}</g></svg>`;
  };
  const sea = document.createElement('div');
  sea.className = 'dp-sea';
  sea.setAttribute('aria-hidden', 'true');
  let bubbles = '';
  for (let i = 0; i < 16; i += 1) {
    bubbles += `<i style="--x:${(rnd() * 100).toFixed(1)}%;--s:${(4 + rnd() * 10).toFixed(0)}px;--t:${(9 + rnd() * 12).toFixed(1)}s;--d:${(-rnd() * 20).toFixed(1)}s;--dx:${(-30 + rnd() * 60).toFixed(0)}px"></i>`;
  }
  sea.innerHTML = skyline() + bubbles;
  document.body.prepend(sea);

  // Floors
  const stops = [{ id: 'top', el: $('.hero'), n: 'L', name: 'Lobby' }];
  $$('main .sec').forEach((sec, i) => stops.push({ id: sec.id, el: sec, n: String(i + 1), name: $('.sec-title', sec)?.textContent || sec.id }));
  $('.hero').id = $('.hero').id || 'top';

  // The dial
  const dial = document.createElement('nav');
  dial.className = 'dp-dial';
  dial.setAttribute('aria-label', 'Elevator');
  const arc = 84;
  const angle = (i) => -arc + (2 * arc * i) / (stops.length - 1);
  const needleAt = document.createElement('i');
  needleAt.className = 'dp-needle';
  const hub = document.createElement('i');
  hub.className = 'dp-hub';
  dial.append(needleAt, hub);
  const links = stops.map((s, i) => {
    const a = document.createElement('a');
    a.href = `#${s.id}`;
    a.textContent = s.n;
    a.setAttribute('aria-label', s.n === 'L' ? 'Lobby, top of the page' : `Floor ${s.n}: ${s.name}`);
    a.title = s.name;
    const rad = (angle(i) * Math.PI) / 180;
    a.style.left = `${92 + 74 * Math.sin(rad)}px`;
    a.style.top = `${80 - 62 * Math.cos(rad)}px`;
    dial.append(a);
    return a;
  });
  const now = document.createElement('span');
  now.className = 'dp-now';
  now.setAttribute('aria-hidden', 'true');
  dial.append(now);
  document.body.append(dial);
  document.body.insertAdjacentHTML('beforeend', '<div class="dp-cable" aria-hidden="true"><i class="dp-car"></i></div><div class="dp-pil" aria-hidden="true"></div>');
  const car = $('.dp-car');

  // Doors. Each carries half of a sunburst, so the two halves meet when they close.
  const doorArt = (flip) => {
    let rays = '';
    for (let i = 0; i <= 16; i += 1) {
      const a = (-90 + (i * 180) / 16) * (Math.PI / 180);
      rays += `<path d="M0 500L${(2000 * Math.cos(a)).toFixed(0)} ${(500 + 2000 * Math.sin(a)).toFixed(0)}" stroke="#e3ab36" stroke-width="${i % 2 ? 2 : 5}"/>`;
    }
    return `<svg viewBox="0 0 700 1000" preserveAspectRatio="${flip ? 'xMaxYMid' : 'xMinYMid'} slice" aria-hidden="true"><g transform="${flip ? 'translate(700 0) scale(-1 1)' : ''}" fill="none">${rays}<circle cx="0" cy="500" r="150" fill="#0b0a08" stroke="#e3ab36" stroke-width="6"/><circle cx="0" cy="500" r="118" stroke="#9f711f" stroke-width="3"/><circle cx="0" cy="500" r="82" fill="#e3ab36"/></g></svg>`;
  };
  const doors = document.createElement('div');
  doors.className = 'dp-doors';
  doors.setAttribute('aria-hidden', 'true');
  doors.innerHTML = `<div class="dp-door dp-door-l">${doorArt(true)}</div><div class="dp-door dp-door-r">${doorArt(false)}</div>`;
  document.body.append(doors);

  // A small bell when the car arrives. Quiet, and only after you press something.
  let audio;
  const ding = () => {
    if (calm()) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t = audio.currentTime;
      [1318, 2637].forEach((f, i) => {
        const o = audio.createOscillator();
        const g = audio.createGain();
        o.frequency.value = f;
        g.gain.setValueAtTime(i ? 0.012 : 0.03, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        o.connect(g).connect(audio.destination);
        o.start(t);
        o.stop(t + 0.95);
      });
    } catch { /* no audio available */ }
  };

  // The doors open when you arrive on the page
  if (!calm()) {
    doors.classList.add('shut');
    setTimeout(() => doors.classList.remove('shut'), 120);
  }

  let busy = false;
  const go = (id) => {
    const target = id === 'top' ? $('.hero') : document.getElementById(id);
    if (!target) return;
    const land = () => {
      const y = id === 'top' ? 0 : target.getBoundingClientRect().top + scrollY - 104;
      scrollTo({ top: y, behavior: 'instant' });
      history.replaceState(null, '', `#${id}`);
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    if (calm()) { land(); return; }
    if (busy) return;
    busy = true;
    doors.classList.add('shut');
    setTimeout(() => {
      land();
      ding();
      setTimeout(() => { doors.classList.remove('shut'); busy = false; }, 150);
    }, 430);
  };
  const intercept = (a) => a.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    go(a.hash.slice(1));
  });
  links.forEach(intercept);
  $$('.toc a').forEach(intercept);

  // The needle follows you, floor by floor
  let tops = [];
  const measure = () => { tops = stops.map((s) => s.el.getBoundingClientRect().top + scrollY - 104); tops[0] = 0; };
  let ticking = false;
  const paint = () => {
    ticking = false;
    const y = scrollY;
    let i = 0;
    while (i < tops.length - 1 && y >= tops[i + 1]) i += 1;
    const next = Math.min(tops.length - 1, i + 1);
    const span = Math.max(1, tops[next] - tops[i]);
    const frac = next === i ? 0 : Math.min(1, Math.max(0, (y - tops[i]) / span));
    const a = angle(i) + (angle(next) - angle(i)) * frac;
    dial.style.setProperty('--needle', `${a.toFixed(1)}deg`);
    const near = frac > 0.86 ? next : i;
    links.forEach((l, n) => {
      l.classList.toggle('on', n === near);
      if (n === near) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
    });
    const label = near === 0 ? 'Lobby' : `Floor ${stops[near].n}`;
    if (now.textContent !== label) now.textContent = label;
    const max = Math.max(1, root.scrollHeight - innerHeight);
    car.style.setProperty('--car', `calc(${((y / max) * 100).toFixed(1)}% - ${((y / max) * 30).toFixed(1)}px)`);
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { measure(); request(); });
  addEventListener('load', () => { measure(); request(); });
  document.fonts?.ready.then(() => { measure(); request(); });
  // Lazy images change the height of the page, so check again as they arrive.
  $$('img[loading=lazy]').forEach((img) => img.addEventListener('load', () => { measure(); request(); }, { once: true }));
  measure();
  paint();

  // The radio's tuning dial moves to the track you pick
  const tracks = $('.tracks');
  if (tracks) {
    const buttons = $$('.track-btn', tracks);
    const tuner = document.createElement('div');
    tuner.className = 'dp-tuner';
    tuner.setAttribute('aria-hidden', 'true');
    const place = (i) => 8 + (84 * i) / Math.max(1, buttons.length - 1);
    buttons.forEach((_, i) => { tuner.insertAdjacentHTML('beforeend', `<span style="left:${place(i)}%">${550 + i * 200}</span>`); });
    tuner.insertAdjacentHTML('beforeend', '<i></i>');
    tracks.before(tuner);
    buttons.forEach((b, i) => b.addEventListener('click', () => tuner.style.setProperty('--tune', `${place(i)}%`)));
    tuner.style.setProperty('--tune', `${place(0)}%`);
  }
})();
