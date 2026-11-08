// Cassette Futurism: makes the contents list a working switch bank, adds a position counter and a master switch, types the prompt, and builds the tape deck.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];

  // A short relay click, made on the spot. Only ever fires on a press, and never in calm mode.
  let audio;
  const clack = (pitch = 1) => {
    if (calm()) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t = audio.currentTime;
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(1700 * pitch, t);
      o.frequency.exponentialRampToValueAtTime(110, t + 0.03);
      g.gain.setValueAtTime(0.045, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + 0.06);
    } catch { /* no audio available */ }
  };

  // Switch bank: throw a switch to jump to its section. As you scroll, the right switch throws itself.
  const items = $$('.toc li');
  const links = items.map((li) => $('a', li));
  const targets = links.map((a) => document.getElementById(a.hash.slice(1)));
  let held = 0;
  const setOn = (i) => items.forEach((li, n) => {
    li.classList.toggle('on', n === i);
    if (n === i) links[n].setAttribute('aria-current', 'true'); else links[n].removeAttribute('aria-current');
  });
  links.forEach((a, i) => a.addEventListener('click', () => {
    clack();
    setOn(i);
    held = performance.now() + 900;
  }));

  // Rail extras: a tape-style counter tied to page position, and a master switch for page effects.
  const toc = $('.toc');
  const foot = document.createElement('div');
  foot.className = 'cf-rail-foot';
  foot.innerHTML = '<div>Position<div class="cf-counter" aria-hidden="true"><i>0</i><i>0</i><i>0</i><i>0</i></div></div><button class="cf-master" type="button" aria-label="Page effects"><b></b>Effects</button>';
  toc.append(foot);
  const digits = $$('.cf-counter i', foot);
  const master = $('.cf-master', foot);
  const paintMaster = () => master.setAttribute('aria-pressed', String(!calm()));
  paintMaster();
  master.addEventListener('click', () => { $('[data-calm-toggle]').click(); clack(0.7); });
  addEventListener('eas:calm', paintMaster);

  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    const max = Math.max(1, root.scrollHeight - innerHeight);
    String(Math.round((y / max) * 9999)).padStart(4, '0').split('').forEach((d, i) => { digits[i].textContent = d; });
    if (performance.now() < held) return;
    let current = -1;
    targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < innerHeight * 0.42) current = i; });
    setOn(current);
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // The prompt prints at about 300 baud.
  const line = $('.hero-tagline');
  if (line && !calm()) {
    const text = line.textContent;
    line.setAttribute('aria-label', text);
    line.textContent = '';
    let n = 0;
    const finish = () => { clearInterval(timer); line.textContent = text; };
    const timer = setInterval(() => {
      n += 1;
      line.textContent = text.slice(0, n);
      if (n >= text.length) clearInterval(timer);
    }, 34);
    addEventListener('eas:calm', finish, { once: true });
  }

  // Tape deck
  const wrap = $('.music-wrap');
  const tracks = $$('.track-btn');
  if (!wrap || !tracks.length) return;
  const icon = {
    rew: '<svg viewBox="0 0 15 13" aria-hidden="true"><path d="M7 0v13L0 6.500zM15 0v13L8 6.500z"/></svg>',
    play: '<svg viewBox="0 0 15 13" aria-hidden="true"><path d="M2 0l12 6.500L2 13z"/></svg>',
    stop: '<svg viewBox="0 0 15 13" aria-hidden="true"><path d="M2 0h11v13H2z"/></svg>',
    ff: '<svg viewBox="0 0 15 13" aria-hidden="true"><path d="M0 0l7 6.500L0 13zM8 0l7 6.500L8 13z"/></svg>',
  };
  const deck = document.createElement('div');
  deck.className = 'cf-deck';
  deck.dataset.state = 'stop';
  deck.innerHTML = `
    <div class="cf-door"><div class="cf-cassette">
      <div class="cf-label"><span class="cf-hand">ship's tape no. 31</span><b>A</b></div>
      <div class="cf-window"><i class="cf-reel cf-reel-l"></i><i class="cf-reel cf-reel-r"></i></div>
    </div></div>
    <div class="cf-vus" aria-hidden="true"><div class="cf-vu"><i></i><span>LEFT</span></div><div class="cf-vu"><i></i><span>RIGHT</span></div></div>
    <div class="cf-controls">
      <div class="cf-keys" role="group" aria-label="Tape transport">
        <button type="button" data-act="rew" aria-label="Previous track">${icon.rew}REW</button>
        <button type="button" data-act="play" aria-label="Play" aria-pressed="false">${icon.play}PLAY</button>
        <button type="button" data-act="stop" aria-label="Stop">${icon.stop}STOP</button>
        <button type="button" data-act="ff" aria-label="Next track">${icon.ff}FF</button>
      </div>
      <div class="cf-tapecount">COUNT<div class="cf-counter cf-tape-digits" aria-hidden="true"><i>0</i><i>0</i><i>0</i></div></div>
    </div>
    <p class="cf-now" aria-live="polite"></p>`;
  $('h3', wrap).after(deck);

  const nowEl = $('.cf-now', deck);
  const playKey = $('[data-act=play]', deck);
  const tapeDigits = $$('.cf-tape-digits i', deck);
  const reelL = $('.cf-reel-l', deck);
  const reelR = $('.cf-reel-r', deck);
  let current = 0;
  let count = 0;
  let clock = null;

  const paintCount = () => {
    String(count % 1000).padStart(3, '0').split('').forEach((d, i) => { tapeDigits[i].textContent = d; });
    const p = Math.min(1, count / 300);
    reelL.style.setProperty('--pack', String(1 - p));
    reelR.style.setProperty('--pack', String(p));
  };
  const label = (prefix) => {
    const b = tracks[current];
    nowEl.textContent = `${prefix} ${String(current + 1).padStart(2, '0')}: ${b.dataset.track}, ${b.dataset.artist}`;
  };
  const setState = (state) => {
    deck.dataset.state = state;
    playKey.setAttribute('aria-pressed', String(state === 'play'));
    clearInterval(clock);
    clock = null;
    if (state === 'play') clock = setInterval(() => { count += 1; paintCount(); }, 1000);
  };
  // Picking a track on the card, or on the deck, starts the transport. page.js does the real playing.
  tracks.forEach((b, i) => b.addEventListener('click', () => {
    current = i;
    label('PLAY');
    setState('play');
  }));
  $('[data-player-close]').addEventListener('click', () => { setState('stop'); label('STOP'); });
  $('[data-act=play]', deck).addEventListener('click', () => { clack(0.8); tracks[current].click(); });
  $('[data-act=stop]', deck).addEventListener('click', () => { clack(0.8); $('[data-player-close]').click(); });
  const shift = (dir) => {
    clack(0.8);
    current = (current + dir + tracks.length) % tracks.length;
    if (deck.dataset.state === 'play') tracks[current].click();
    else {
      label('READY');
      deck.dataset.state = 'ff';
      setTimeout(() => { if (deck.dataset.state === 'ff') deck.dataset.state = 'stop'; }, 500);
    }
  };
  $('[data-act=rew]', deck).addEventListener('click', () => shift(-1));
  $('[data-act=ff]', deck).addEventListener('click', () => shift(1));
  label('READY');
  paintCount();
})();
