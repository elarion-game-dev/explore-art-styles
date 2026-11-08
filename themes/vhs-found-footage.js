// Found Footage: the camcorder's working parts. Scrolling plays the tape, so the timecode, zoom bar, battery and reels all read from the page.
// The tape index gets real timecodes, autofocus hunts on whatever you point at, and the footer can rewind the tape.
(() => {
  const root = document.documentElement;
  const $ = (q) => document.querySelector(q);
  const $$ = (q) => [...document.querySelectorAll(q)];
  const calm = () => root.dataset.calm === '1';

  const PX_PER_SEC = 6; // 6 pixels of scrolling is one second of tape
  const pad = (n) => String(n).padStart(2, '0');
  const tc = (s) => `${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(Math.floor(s) % 60)}`;

  // ---- Tape index and spines show where each section really is on the tape ----
  const sections = $$('.sec');
  const links = $$('.toc a');
  const stamp = () => {
    for (const s of sections) {
      const top = Math.max(0, s.getBoundingClientRect().top + scrollY - 60);
      const code = tc(top / PX_PER_SEC);
      s.querySelector('.sec-title')?.setAttribute('data-tc', code);
      links.find((a) => a.getAttribute('href') === `#${s.id}`)?.setAttribute('data-tc', code);
    }
  };
  stamp();
  addEventListener('load', stamp);
  let resizeT;
  addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(stamp, 200); });

  // ---- The HUD ----
  const counter = $('.vf-counter');
  const clock = $('.vf-clock');
  const stateWord = $('.vf-state-word');
  const speed = $('.vf-speed');
  const left = $('.vf-left');
  const bar = $('.vf-bar');
  const batt = $('.vf-batt');
  const reelA = $('.vf-reel-a');
  const reelB = $('.vf-reel-b');
  const started = Date.now();
  const BASE = 23 * 3600 + 52 * 60 + 7; // 11:52:07 PM

  const paintClock = () => {
    const t = BASE + Math.floor(scrollY / PX_PER_SEC) + Math.floor((Date.now() - started) / 1000);
    const h24 = Math.floor(t / 3600) % 24;
    const h = h24 % 12 || 12;
    clock.textContent = `${h24 < 12 ? 'AM' : 'PM'} ${pad(h)}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}`;
  };

  let lastY = scrollY;
  let lastT = performance.now();
  let seekT;
  let ticking = false;
  const paint = () => {
    ticking = false;
    const max = Math.max(1, root.scrollHeight - innerHeight);
    const p = Math.min(1, Math.max(0, scrollY / max));
    counter.textContent = tc(scrollY / PX_PER_SEC);
    paintClock();
    bar.style.setProperty('--p', `${(p * 100).toFixed(1)}%`);
    // The battery runs down as the tape runs out
    batt.style.setProperty('--b', `${Math.max(4, Math.round((1 - p) * 100))}%`);
    left.textContent = p > .985 ? 'NO TAPE' : `${Math.max(1, Math.round((1 - p) * 90))} MIN`;
    root.classList.toggle('vf-low', p > .82);
    // Tape moves from the left reel to the right reel, and both turn
    reelA.style.setProperty('--d', `${Math.round(34 - p * 18)}px`);
    reelB.style.setProperty('--d', `${Math.round(16 + p * 18)}px`);
    reelA.style.setProperty('--r', `${Math.round(scrollY * .9)}deg`);
    reelB.style.setProperty('--r', `${Math.round(scrollY * .6)}deg`);
    // Fast scrolling is a tape search
    const now = performance.now();
    const v = Math.abs(scrollY - lastY) / Math.max(1, now - lastT);
    const dir = scrollY - lastY;
    lastY = scrollY;
    lastT = now;
    if (!root.classList.contains('vf-rewinding')) {
      if (v > 1.4) {
        root.classList.add('vf-seek');
        stateWord.textContent = dir > 0 ? 'FF ▶▶' : 'REW ◀◀';
        speed.textContent = 'SEARCH';
        clearTimeout(seekT);
        seekT = setTimeout(() => {
          root.classList.remove('vf-seek');
          stateWord.textContent = 'REC';
          speed.textContent = 'SP';
        }, 320);
      }
    } else if (scrollY < 4) {
      root.classList.remove('vf-rewinding');
      stateWord.textContent = 'REC';
      speed.textContent = 'SP';
    }
    // Index marks what is on screen
    const mark = scrollY + innerHeight * .4;
    let id = null;
    for (const s of sections) if (s.getBoundingClientRect().top + scrollY <= mark) id = s.id;
    for (const a of links) a.classList.toggle('is-now', a.getAttribute('href') === `#${id}`);
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(paint); }
  }, { passive: true });
  paint();
  setInterval(() => { if (!document.hidden && !calm()) paintClock(); }, 1000);

  // ---- Autofocus hunts on whatever you point at ----
  const af = $('.vf-af');
  let afTarget = null;
  let lockT;
  const placeAf = () => {
    if (!afTarget) return;
    const r = afTarget.getBoundingClientRect();
    const hud = af.parentElement.getBoundingClientRect();
    af.style.transform = `translate(${Math.round(r.left - hud.left)}px, ${Math.round(r.top - hud.top)}px)`;
    af.style.width = `${Math.round(r.width)}px`;
    af.style.height = `${Math.round(r.height)}px`;
  };
  const finePointer = matchMedia('(hover: hover)').matches;
  if (finePointer) {
    for (const el of $$('.shot-link, .loop video, .related a')) {
      el.addEventListener('pointerenter', () => {
        if (calm()) return;
        afTarget = el;
        placeAf();
        af.classList.add('on');
        af.classList.remove('lock');
        clearTimeout(lockT);
        lockT = setTimeout(() => af.classList.add('lock'), 520);
        const img = el.querySelector('img');
        if (img) {
          img.classList.remove('vf-hunt');
          void img.offsetWidth;
          img.classList.add('vf-hunt');
          img.addEventListener('animationend', (e) => { if (e.animationName === 'vf-hunt') img.classList.remove('vf-hunt'); }, { once: true });
        }
      });
      el.addEventListener('pointerleave', () => {
        afTarget = null;
        af.classList.remove('on', 'lock');
        clearTimeout(lockT);
      });
    }
    addEventListener('scroll', placeAf, { passive: true });
  }

  addEventListener('eas:calm', () => {
    root.classList.remove('vf-seek', 'vf-rewinding');
    af.classList.remove('on', 'lock');
    stateWord.textContent = 'REC';
    speed.textContent = 'SP';
    paint();
  });

  // ---- End of tape, and a rewind button that really rewinds ----
  const foot = $('.foot');
  const end = document.createElement('div');
  end.className = 'foot-end';
  end.innerHTML = '<strong>END OF TAPE. NOTHING AFTER THIS POINT.</strong><button class="vf-rew" type="button">◀◀ REWIND TAPE</button>';
  foot.prepend(end);
  end.querySelector('button').addEventListener('click', () => {
    if (!calm()) {
      root.classList.add('vf-rewinding');
      stateWord.textContent = 'REW ◀◀';
      speed.textContent = 'SEARCH';
      setTimeout(() => {
        if (root.classList.contains('vf-rewinding')) {
          root.classList.remove('vf-rewinding');
          stateWord.textContent = 'REC';
          speed.textContent = 'SP';
        }
      }, 6000);
    }
    scrollTo({ top: 0, behavior: calm() ? 'auto' : 'smooth' });
  });
})();
