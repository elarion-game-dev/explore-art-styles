// Hauntology: the interval clock. Thirteen lozenges go out one by one as you scroll towards the next programme,
// and the readout says how long is left. Click it to move on. One lozenge never goes out.
(() => {
  const root = document.documentElement;
  const $ = (q) => document.querySelector(q);
  const $$ = (q) => [...document.querySelectorAll(q)];
  const calm = () => root.dataset.calm === '1';
  const PX_PER_SEC = 9;
  const LOZ = 13;
  const words = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'];

  const face = () => {
    let loz = '';
    for (let i = 0; i < LOZ; i++) {
      const a = (i / LOZ) * 360;
      loz += `<path class="ht-loz" data-i="${i}" d="M0 -24 L8.5 0 L0 24 L-8.5 0 Z" transform="translate(100 100) rotate(${a.toFixed(2)}) translate(0 -70)"/>`;
    }
    return `<svg viewBox="0 0 200 200" aria-hidden="true"><circle class="ht-face" cx="100" cy="100" r="99"/>${loz}<circle class="ht-disc" cx="100" cy="100" r="41"/>
      <text class="ht-lab" x="100" y="80">PROGRAMME</text><text class="ht-num" x="100" y="120">1</text><text class="ht-lab" x="100" y="130">FOLLOWS</text><line class="ht-hand" x1="100" y1="100" x2="100" y2="4"/></svg>`;
  };

  // The big clock on the title sheet
  const hero = document.createElement('button');
  hero.type = 'button';
  hero.className = 'ht-clock ht-hero-clock';
  hero.setAttribute('aria-label', 'Interval clock. Go to the next programme');
  hero.innerHTML = `${face()}<span class="ht-read"></span>`;
  $('.hero-text').append(hero);
  // Tagline sits under the clock's readout on the sheet
  const tag = $('.hero-tagline');
  $('.hero-text').insertBefore(tag, hero);

  // The small clock that follows you down the page
  const mini = document.createElement('button');
  mini.type = 'button';
  mini.className = 'ht-clock ht-mini';
  mini.setAttribute('aria-label', 'Interval clock. Go to the next programme');
  mini.innerHTML = `${face()}<span class="ht-read"></span>`;
  document.body.append(mini);

  const clocks = [hero, mini].map((el) => ({
    el,
    loz: [...el.querySelectorAll('.ht-loz')],
    num: el.querySelector('.ht-num'),
    labTop: el.querySelectorAll('.ht-lab')[0],
    labBot: el.querySelectorAll('.ht-lab')[1],
    hand: el.querySelector('.ht-hand'),
    read: el.querySelector('.ht-read'),
  }));
  // The last lozenge is a different colour and it never goes out. Nobody will ever mention this.
  for (const c of clocks) c.loz[LOZ - 1].classList.add('always');

  const sections = $$('.sec');
  const tocLinks = $$('.toc a');
  const titles = sections.map((s) => s.querySelector('.sec-title').textContent.trim().toLowerCase());
  let tops = [];
  const measure = () => { tops = sections.map((s) => s.getBoundingClientRect().top + scrollY); };
  measure();
  addEventListener('load', measure);
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { measure(); paint(); }, 150); });

  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, '0')}`;
  let nextIndex = 0;
  let twitch = 0;
  let sayT;

  function paint() {
    const mark = scrollY + innerHeight * .34;
    let i = tops.findIndex((t) => t > mark);
    if (i === -1) i = tops.length;
    if (i !== nextIndex && mini.classList.contains('on')) {
      // A new programme: the clock says so for a moment, then goes back to being a clock.
      mini.classList.add('say');
      clearTimeout(sayT);
      sayT = setTimeout(() => mini.classList.remove('say'), 3600);
    }
    nextIndex = i;
    const from = i === 0 ? 0 : tops[i - 1];
    const to = i < tops.length ? tops[i] : Math.max(from + 1, root.scrollHeight - innerHeight * .66);
    const frac = Math.min(1, Math.max(0, (mark - from) / (to - from)));
    const lit = Math.ceil((1 - frac) * (LOZ - 1));
    const left = Math.max(0, (to - mark) / PX_PER_SEC);
    let small;
    let text;
    if (i >= tops.length) {
      small = 'No further programmes';
      text = 'Please wait quietly for the bell.';
    } else if (i === tops.length - 1) {
      small = `Programme ${words[i]} follows in ${mmss(left)}`;
      text = 'It is not listed in your notes.';
    } else {
      small = `Programme ${words[i]} follows in ${mmss(left)}`;
      text = titles[i];
    }
    for (const c of clocks) {
      c.loz.forEach((l, n) => { if (n < LOZ - 1) l.classList.toggle('off', n >= lit); });
      c.num.textContent = i >= tops.length ? '-' : String(i + 1);
      c.labBot.textContent = i >= tops.length ? 'THE BELL' : 'FOLLOWS';
      c.hand.setAttribute('transform', `rotate(${((1 - frac) * 360 + twitch).toFixed(1)} 100 100)`);
      c.read.innerHTML = `<small>${small}</small><b>${text}</b>`;
    }
    for (const a of tocLinks) {
      const sectionId = i > 0 ? sections[i - 1].id : null;
      a.classList.toggle('is-now', a.getAttribute('href') === `#${sectionId}`);
    }
  }

  let ticking = false;
  addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => { ticking = false; paint(); });
    }
  }, { passive: true });
  paint();

  addEventListener('eas:calm', () => { twitch = 0; paint(); });

  const go = () => {
    if (nextIndex < tops.length) scrollTo({ top: tops[nextIndex] - 60, behavior: calm() ? 'auto' : 'smooth' });
    else scrollTo({ top: 0, behavior: calm() ? 'auto' : 'smooth' });
  };
  hero.addEventListener('click', go);
  mini.addEventListener('click', go);

  // The small clock takes over once the big one has left the screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => mini.classList.toggle('on', !e.isIntersecting), { threshold: 0 }).observe(hero);
  } else {
    mini.classList.add('on');
  }

  // Once in a while the hand ticks back, by one mark, and then carries on as if nothing happened.
  const back = () => {
    if (!calm() && !document.hidden) {
      twitch = -360 / LOZ;
      paint();
      setTimeout(() => { twitch = 0; paint(); }, 420);
    }
    setTimeout(back, 26000 + Math.random() * 40000);
  };
  setTimeout(back, 14000);
})();
