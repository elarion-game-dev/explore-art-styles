// Analog Horror: the station's working parts. An emergency crawl that changes with each segment, a listings grid that marks what is on air,
// a forecast that goes wrong as you scroll, an agency seal, and hidden frames you are asked not to look at.
(() => {
  const root = document.documentElement;
  const $ = (q) => document.querySelector(q);
  const calm = () => root.dataset.calm === '1';

  // ---- The seal of an office nobody has heard of ----
  let sealId = 0;
  const seal = () => {
    const id = `ah-ring-${sealId++}`;
    const rays = Array.from({ length: 24 }, (_, i) => {
      const a = (i / 24) * Math.PI * 2;
      const r1 = i % 2 ? 40 : 34;
      return `M${(100 + Math.cos(a) * r1).toFixed(1)} ${(100 + Math.sin(a) * r1).toFixed(1)}L${(100 + Math.cos(a) * 57).toFixed(1)} ${(100 + Math.sin(a) * 57).toFixed(1)}`;
    }).join('');
    return `<svg class="ah-seal" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="${id}" d="M100 100m-75 0a75 75 0 1 1 150 0a75 75 0 1 1 -150 0"/></defs>
      <circle cx="100" cy="100" r="96" fill="rgb(0 0 0 / .55)" stroke="currentColor" stroke-width="3"/><circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" stroke-width="2"/>
      <text fill="currentColor" font-family="Arimo, Arial, sans-serif" font-weight="700" font-size="14.5"><textPath href="#${id}" textLength="462" lengthAdjust="spacing">COUNTY OFFICE OF PUBLIC REASSURANCE ★ </textPath></text>
      <path d="${rays}" stroke="currentColor" stroke-width="2.4" fill="none"/>
      <path d="M58 100Q100 64 142 100Q100 136 58 100z" fill="currentColor" stroke="#000" stroke-width="3"/><circle cx="100" cy="100" r="17" fill="#000"/><circle cx="100" cy="100" r="6.5" fill="currentColor"/></svg>`;
  };
  $('.hero-text').insertAdjacentHTML('beforeend', seal());
  $('.foot').insertAdjacentHTML('afterbegin', seal());

  // ---- Hidden frames. Each one is a real tip, as a reward for looking. ----
  const rough = (id) => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>`;
  const art = {
    face: `<svg viewBox="0 0 160 120" aria-hidden="true"><defs>${rough('ah-r1')}</defs><rect width="160" height="120" fill="#06123a"/><g filter="url(#ah-r1)">
      <path d="M80 8c30 0 44 24 40 56-3 26-20 48-40 48s-37-22-40-48C36 32 50 8 80 8z" fill="#9fd1cc"/>
      <path d="M50 50c7-9 20-9 27 0-7 7-20 7-27 0zM83 50c7-9 20-9 27 0-7 7-20 7-27 0z" fill="#06123a"/><circle cx="64" cy="49" r="2.4" fill="#e5f6fe"/><circle cx="96" cy="49" r="2.4" fill="#e5f6fe"/>
      <path d="M76 56l-4 18h16l-4-18z" fill="#6aa7a2"/><path d="M46 80c17 11 51 11 68 0-7 15-20 24-34 24s-27-9-34-24z" fill="#06123a"/><path d="M58 88h44M64 96h32" stroke="#9fd1cc" stroke-width="2"/></g></svg>`,
    moon: `<svg viewBox="0 0 160 120" aria-hidden="true"><defs>${rough('ah-r2')}</defs><rect width="160" height="120" fill="#04041a"/><g filter="url(#ah-r2)"><circle cx="98" cy="30" r="62" fill="#e5f6fe"/>
      <path d="M62 44c6-6 13-2 16 4s-4 14-11 12-10-11-5-16zM98 12c8-5 18 0 19 7s-6 12-14 11-11-13-5-18zM112 56c5-4 12-1 13 4s-3 9-8 8-9-8-5-12z" fill="#a9b6dd"/></g>
      <text x="10" y="106" fill="#ff5a62" font-family="'Jersey 25',monospace" font-size="17" letter-spacing=".5">IT IS SAFE TO LOOK NOW</text></svg>`,
    map: `<svg viewBox="0 0 160 120" aria-hidden="true"><rect width="160" height="120" fill="#0b0f62"/><path d="M6 20l44-8 26 12 40-14 38 18-6 40-30 34-44-6-40 14-30-34z" fill="#1b2bb6" stroke="#9fe8ff" stroke-width="1.5"/>
      <path d="M50 12l-6 44 40 10 32-24 0-32M84 66l-10 42M44 56L12 74M116 42l34 28" fill="none" stroke="#9fe8ff" stroke-width="1"/><path d="M44 56l40 10-10 42-24-2-10-22z" fill="#c4101c" stroke="#fff" stroke-width="1.5"/>
      <text x="48" y="84" fill="#fff" font-family="'Jersey 25',monospace" font-size="17">YOU</text><text x="90" y="24" fill="#ffd83a" font-family="'Jersey 25',monospace" font-size="15">NO SIGNAL</text></svg>`,
  };
  const frames = [
    { after: '.sec-feel .origins', art: 'face', code: 'HIDDEN FRAME 0412', tip: 'Hide a shape in the static and let it pass for a glitch the first time. Later, let it resolve into what was there all along.' },
    { after: '.sec-core .core-list', art: 'moon', code: 'HIDDEN FRAME 0977', tip: 'Bring a name back a second, third and fourth time, until its part in the story becomes clear too late.' },
    { after: '.sec-how .brief', art: 'map', code: 'HIDDEN FRAME 1138', tip: 'Keep your geography small and specific: one county, its towns, a station\'s call letters. Real names lent Candle Cove a little verisimilitude.' },
  ];
  for (const f of frames) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ah-dnl';
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `<span class="ah-dnl-frame">${art[f.art]}<span class="ah-dnl-text"><b>${f.code}</b>${f.tip}</span></span>
      <span class="ah-dnl-cover" aria-hidden="true"><span class="ah-dnl-warn">Please do not look at this frame</span><span class="ah-dnl-sub">hover or tap to look anyway</span></span>`;
    b.addEventListener('click', () => {
      const open = b.classList.toggle('is-open');
      b.setAttribute('aria-pressed', String(open));
    });
    const anchor = $(f.after);
    if (anchor) anchor.after(b);
  }

  // ---- Colour bars: the small second tier runs in reverse, like the real test signal ----
  const swatches = [...document.querySelectorAll('.swatch')];
  swatches.forEach((s, i) => s.style.setProperty('--m', swatches[swatches.length - 1 - i].style.getPropertyValue('--c')));

  // ---- The crawl changes with the segment on screen ----
  const crawlText = $('.ah-crawl-text');
  const notices = {
    hero: 'THE FOLLOWING MESSAGE IS TRANSMITTED AT THE REQUEST OF THE COUNTY OFFICE OF PUBLIC REASSURANCE.   THIS IS NOT A TEST.   REMAIN INDOORS AND KEEP READING.   DO NOT ADJUST YOUR SET.',
    feel: 'RESIDENTS ARE REMINDED THAT THE BROADCAST IS CALM.   THE BROADCAST WOULD LIKE YOU TO BE CALM.   THERE IS NO NEED TO LOOK OUTSIDE AT THIS TIME.',
    core: 'IF THE PRESENTER HAS STOPPED BLINKING, NOTE THE TIME AND CONTINUE WATCHING.   THE FORECAST FOR THIS AREA HAS BEEN WITHDRAWN.',
    how: 'INSTRUCTIONS WILL BE REPEATED.   INSTRUCTIONS WILL BE REPEATED.   IT IS IMPORTANT THAT YOU DO NOT SKIP PART 4.   INSTRUCTIONS WILL BE REPEATED.',
    palette: 'THESE COLOURS HAVE BEEN CLEARED FOR PUBLIC VIEWING.   THE EIGHTH COLOUR HAS BEEN REMOVED FOR YOUR PROTECTION.',
    vibe: 'AUDIO IS PROVIDED FOR YOUR COMFORT.   IF YOU HEAR YOUR OWN NAME, LOWER THE VOLUME AND REMAIN SEATED.',
    refs: 'OTHER STATIONS MAY STILL BE ON THE AIR.   THIS OFFICE CANNOT CONFIRM WHAT THEY ARE SHOWING.',
    related: 'TO LEAVE THIS BROADCAST, USE THE NEXT CHANNEL.   THIS STATION WILL BE HERE WHEN YOU COME BACK.',
    foot: 'THIS CONCLUDES OUR BROADCAST DAY.   THANK YOU FOR WATCHING.   WE WILL KEEP WATCHING.',
  };
  let current = 'hero';
  const setCrawl = (key, restart = true) => {
    if (crawlText.dataset.key === key) return;
    crawlText.dataset.key = key;
    crawlText.textContent = `${notices[key]}   ${notices[key]}`;
    // A constant speed of about 90 pixels a second, whatever the length of the message.
    const width = crawlText.getBoundingClientRect().width || crawlText.textContent.length * 11;
    crawlText.style.setProperty('--crawl-dur', `${Math.round((width + innerWidth) / 90)}s`);
    if (restart) {
      crawlText.style.animation = 'none';
      void crawlText.offsetWidth;
      crawlText.style.animation = '';
    }
  };
  setCrawl('hero', false);

  // ---- Listings grid and forecast follow the scroll ----
  const tocLinks = [...document.querySelectorAll('.toc a')];
  const sections = [...document.querySelectorAll('.sec')];
  const cond = $('.ah-bug-cond');
  const conditionAt = (p) => {
    const t = Math.round(61 - p * 101); // 61 degrees at the top, 40 below at the bottom
    const word = p < .3 ? 'CLEAR' : p < .6 ? 'STILL' : p < .9 ? 'NO WIND' : 'DO NOT';
    return `${word} ${t}°F`;
  };
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const p = Math.min(1, scrollY / max);
    cond.textContent = conditionAt(p);
    const mark = scrollY + innerHeight * .4;
    let id = scrollY < 200 ? 'hero' : null;
    for (const s of sections) if (s.getBoundingClientRect().top + scrollY <= mark) id = s.id;
    if (p > .985) id = 'foot';
    for (const a of tocLinks) a.classList.toggle('is-now', a.getAttribute('href') === `#${id}`);
    if (id && id !== current) {
      current = id;
      if (!calm() && notices[id]) setCrawl(id);
    }
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // ---- The station clock is your clock ----
  const timeEl = $('.ah-bug-time');
  const tick = () => { timeEl.textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toUpperCase(); };
  tick();
  setInterval(tick, 20000);

  // ---- Once in a long while the station ident is not the station ident ----
  const call = $('.ah-bug-call');
  const subliminal = () => {
    if (!calm() && !document.hidden) {
      const was = call.textContent;
      call.textContent = 'BEHIND YOU';
      call.style.color = '#ff5a62';
      setTimeout(() => { call.textContent = was; call.style.color = ''; }, 140);
    }
    setTimeout(subliminal, 40000 + Math.random() * 50000);
  };
  setTimeout(subliminal, 30000);

  addEventListener('eas:calm', (e) => { if (!e.detail.calm && notices[current]) { crawlText.dataset.key = ''; setCrawl(current); } });
})();
