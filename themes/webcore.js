// Webcore: puts real GeoCities GIFs everywhere, and adds a hit counter, a guestbook, a webring, a MIDI, a status bar and sparkles on the cursor.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const M = '../media/webcore/gifs/';
  const SIZES = {"fire":[600,50],"rainbow":[600,5],"starline":[562,19],"arrows":[432,17],"hearts":[394,19],"runner":[700,34],"uc-big":[323,118],"uc-worker":[96,66],"uc-sign":[40,38],"uc-orange":[90,85],"welcome":[207,51],"welcome-flowers":[120,50],"smile":[108,74],"mailbox":[94,94],"email-gold":[170,64],"new-arrow":[32,21],"new-big":[80,42],"ghost":[90,90],"gb-pencil":[90,108],"gb-book":[148,80],"prev":[124,92],"next":[124,92],"enter":[80,108],"flee":[80,108],"skull":[37,44],"skull-fire":[71,131],"skull-green":[100,75],"globe":[64,64],"earth":[100,100],"hamster":[60,70],"hamster-big":[100,100],"hamster-walk":[66,26],"hamster2":[60,66],"cool":[79,43],"cool-smile":[32,32],"duck":[53,49],"award":[140,86],"award2":[120,80],"ball-green":[14,14],"ball-purple":[14,14],"ball-blue":[13,13],"star-o":[22,21],"star-p":[22,21],"star-w":[22,21],"star-y":[22,21],"speaker":[99,36],"mininotes":[30,16],"cd":[32,26],"treble":[80,60],"manynotes":[153,66],"pc-guy":[107,98],"pc-tower":[120,83],"pc-type":[134,133],"pc-surf":[120,96],"alien":[75,125],"ufo":[50,50],"ufo2":[54,54],"alien-wave":[30,50],"exit":[75,40],"cat-run":[85,41],"cat-small":[32,32],"counter-guy":[142,45],"skeleton":[32,70],"home-smoke":[80,78],"sparkle":[30,28],"sparkle2":[22,22],"coming":[196,44],"atom":[80,80],"b-netscape":[88,31],"b-ie":[88,31],"b-tracked":[88,31],"b-coolpage":[88,31],"b-evil":[88,31],"b-home":[88,31],"b-yahoo":[88,31],"b-geo":[88,31],"b-mac":[88,31],"b-amiga":[88,31],"b-js":[88,31],"b-winamp":[88,31],"b-pixel":[88,31],"b-frontpage":[88,31],"b-free":[88,31]};
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const make = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html) n.innerHTML = html; return n; };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const gif = (name, alt = '', cls = '', eager = false) => {
    const [w, h] = SIZES[name];
    return `<img class="wc-gif${cls ? ` ${cls}` : ''}" src="${M}${name}.gif" width="${w}" height="${h}" alt="${esc(alt)}"${eager ? '' : ' loading="lazy"'} decoding="async">`;
  };
  const toastEl = $('[data-toast]');
  let toastT;
  const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 2200); };

  // Hero: a rainbow title between two skulls, a scrolling message, and the counter.
  const heroText = $('.hero-text');
  const title = $('.hero-title');
  const titleText = title.textContent;
  const RAINBOW = ['#ff3030', '#ff9000', '#ffff00', '#00ff40', '#00ffff', '#6080ff', '#ff60ff'];
  title.setAttribute('aria-label', titleText);
  title.innerHTML = [...titleText].map((c, i) => `<span aria-hidden="true" style="color:${RAINBOW[i % RAINBOW.length]}">${esc(c)}</span>`).join('');
  const row = make('div', 'wc-title-row');
  title.before(row);
  row.innerHTML = `<a href="#feel" title="Enter">${gif('enter', 'Enter the page', '', true)}</a><a href="../index.html" title="Flee to all styles">${gif('flee', 'Flee to all styles', '', true)}</a>`;
  row.insertBefore(title, row.lastChild);
  const welcome = make('div', 'wc-welcome', gif('ufo', '', '', true) + gif('welcome', 'Welcome', '', true) + gif('ufo', '', '', true));
  heroText.prepend(welcome);

  const MSG = '*** Welcome to my page!!! *** You are now entering the Old Internet *** This page looks best in Netscape Navigator at 800 x 600 *** Please sign my guestbook before you go!!! *** Every little GIF on this page is a real one from GeoCities ***';
  const tagline = $('.hero-tagline');
  tagline.insertAdjacentHTML('afterend', `<marquee class="wc-marquee" scrollamount="5" aria-hidden="true">${MSG}</marquee><p class="wc-marquee-still">Every little GIF on this page is a real one from GeoCities.</p>`);

  const BASE = 8127;
  const hits = (parseInt(store.get('eas-webcore-hits') || '0', 10) || 0) + 1;
  store.set('eas-webcore-hits', String(hits));
  const digits = String(BASE + hits).padStart(7, '0');
  const hitsEl = make('div', 'wc-hits', `${gif('new-big', '', '', true)}<span class="wc-hits-in">You are visitor number <span class="wc-counter" role="img" aria-label="${BASE + hits}">${[...digits].map((d) => `<b>${d}</b>`).join('')}</span><small>The first ${BASE.toLocaleString('en-US')} were me, checking that it worked.</small></span>${gif('uc-sign', '', '', true)}`);
  $('.wc-marquee-still').after(hitsEl);

  // The hero images arrive line by line, like they did at 28.8k.
  const statusText = make('span', '', 'Document: Done');
  const statusBar = make('div', 'wc-status');
  statusBar.setAttribute('aria-hidden', 'true');
  const statusMeter = make('i');
  statusBar.append(statusText, statusMeter);
  document.body.append(statusBar);
  const IDLE = 'Document: Done';
  let loading = 0;
  const setStatus = (t) => { statusText.textContent = t; };
  const shots = $$('.hero-gallery .shot-link');
  if (!isCalm() && 'IntersectionObserver' in window) {
    shots.forEach((s) => s.classList.add('wc-wait'));
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const t = 1 + Math.random() * 0.9;
        e.target.style.setProperty('--t', `${t.toFixed(2)}s`);
        e.target.classList.add('wc-go');
        loading += 1;
        setStatus(`Transferring data from www.geocities.com... (${loading} of ${shots.length} images at 28.8 kbps)`);
        statusMeter.style.setProperty('--p', `${(loading / shots.length) * 100}%`);
        const img = $('img', e.target);
        img.addEventListener('animationend', () => {
          e.target.classList.remove('wc-wait', 'wc-go');
          if (loading === shots.length) { setStatus(IDLE); statusMeter.style.setProperty('--p', '0%'); }
        }, { once: true });
      }
    }, { threshold: 0.1 });
    shots.forEach((s) => io.observe(s));
  }

  // The blue captions under the hero images work like the links they look like.
  $$('.hero-gallery figcaption').forEach((c) => c.addEventListener('click', () => c.previousElementSibling.click()));

  // Toolbar: a location field and a throbber.
  const atlas = $('.atlas');
  const SITE = 'http://www.geocities.com/SiliconValley/Heights/1998/';
  const locField = make('span');
  const loc = make('div', 'wc-loc');
  loc.setAttribute('aria-hidden', 'true');
  loc.append('Location:', locField);
  locField.textContent = `${SITE}webcore.html`;
  atlas.append(loc, make('div', 'wc-throb'));
  atlas.lastChild.setAttribute('aria-hidden', 'true');

  // Left frame.
  const toc = $('.toc');
  const tocList = $('ul', toc);
  toc.insertAdjacentHTML('afterbegin', `<p class="wc-nav-head">Navigate my site!</p>`);
  tocList.insertAdjacentHTML('beforeend', '<li><a href="#wc-guest">Sign my guestbook!</a></li><li><a href="#related">The WebRing</a></li>');
  toc.insertAdjacentHTML('beforeend', `
    <div class="wc-nav-box wc-midi"><b>${gif('mininotes')} This page has music!! fur_elise.mid</b><button type="button" data-midi="play" aria-pressed="false">Play</button><button type="button" data-midi="stop">Stop</button></div>
    <div class="wc-nav-box wc-nav-extra"><a href="#wc-guest" title="Sign my guestbook">${gif('mailbox', 'Sign my guestbook')}</a><br>${gif('b-netscape', 'Netscape Now!')}<br>Best viewed at 800 x 600</div>`);

  // Rails of GIFs down each side of wide screens.
  const page = $('.page');
  const RAIL = ['alien', 'pc-surf', 'duck', 'skeleton', 'hamster2', 'skull-fire', 'cat-run', 'hamster-big', 'earth', 'alien-wave', 'treble', 'smile', 'uc-orange', 'atom', 'ghost', 'home-smoke', 'pc-tower', 'award', 'skull-green', 'cool', 'cat-small', 'ufo2', 'award2', 'manynotes', 'pc-guy', 'welcome-flowers'];
  const railL = make('div', 'wc-rail wc-rail-l');
  const railR = make('div', 'wc-rail wc-rail-r');
  railL.setAttribute('aria-hidden', 'true');
  railR.setAttribute('aria-hidden', 'true');
  RAIL.forEach((n, i) => { (i % 2 ? railR : railL).insertAdjacentHTML('beforeend', gif(n)); });
  RAIL.forEach((n, i) => { (i % 2 ? railL : railR).insertAdjacentHTML('beforeend', gif(n)); });
  page.append(railL, railR);

  // Section titles get flanked, and a divider goes between sections.
  const FLANK = { feel: ['earth', 'earth'], core: ['cool', 'cool'], how: ['uc-sign', 'uc-sign'], palette: ['atom', 'atom'], vibe: ['treble', 'treble'], refs: ['award2', 'award2'], sources: ['gb-book', 'gb-book'], related: ['skull', 'skull'] };
  const DIVIDERS = ['fire', 'rainbow', 'runner', 'starline', 'fire', 'hearts', 'arrows'];
  $$('.sec').forEach((sec, i) => {
    const h = $('.sec-title', sec);
    const [a, b] = FLANK[sec.id] || FLANK.refs;
    h.innerHTML = `${gif(a)}<span>${esc(h.textContent)}</span>${gif(b)}`;
    if (i) sec.insertAdjacentHTML('beforebegin', `<div class="wc-hr" aria-hidden="true">${gif(DIVIDERS[i % DIVIDERS.length])}</div>`);
  });

  // A few real GIFs inside the text, the way people actually placed them.
  const feelBody = $('.feel-body');
  feelBody.insertAdjacentHTML('afterbegin', gif('pc-guy', '', 'wc-float-r'));
  const mood = ['ball-green', 'ball-purple', 'ball-blue', 'star-o', 'star-p', 'star-y'];
  $$('.mood-words li').forEach((li, i) => li.insertAdjacentHTML('afterbegin', gif(mood[i % mood.length])));
  const origH = $('.origins h3');
  origH.insertAdjacentHTML('afterbegin', `${gif('globe')} `);
  origH.insertAdjacentHTML('beforeend', ` ${gif('globe')}`);
  const coreG = ['star-w', 'hamster', 'uc-worker', 'b-netscape', 'counter-guy', 'speaker'];
  $$('.core-item').forEach((c, i) => {
    c.insertAdjacentHTML('afterbegin', gif(coreG[i % coreG.length], '', 'wc-float-r'));
    if (i < 2) $('h3', c).insertAdjacentHTML('beforeend', ` <span class="wc-blink">${gif('new-arrow')}</span>`);
  });
  const steps = $('.steps');
  steps.insertAdjacentHTML('beforebegin', `<div class="wc-uc">${gif('uc-big', 'Under construction')}<br><span>This section is under construction. (Just kidding. It's finished. Mostly.)</span></div>`);
  $$('.step').forEach((s, i) => {
    const g = { 0: 'pc-type', 1: 'uc-orange', 3: 'hamster2', 4: 'atom', 5: 'gb-pencil', 6: 'ghost' }[i];
    if (g) s.insertAdjacentHTML('afterbegin', gif(g, '', i % 2 ? 'wc-float-l' : 'wc-float-r'));
  });
  $('.do h3').insertAdjacentHTML('afterbegin', gif('cool-smile'));
  $('.avoid h3').insertAdjacentHTML('afterbegin', gif('skull'));
  $$('.do li').forEach((li) => li.insertAdjacentHTML('afterbegin', gif('ball-green')));
  $$('.avoid li').forEach((li) => li.insertAdjacentHTML('afterbegin', gif('star-o')));

  // The 216 browser-safe colours.
  const STEPS = ['00', '33', '66', '99', 'CC', 'FF'];
  const safe = [];
  STEPS.forEach((r) => STEPS.forEach((g) => STEPS.forEach((b) => safe.push(`#${r}${g}${b}`))));
  const safeEl = make('div', 'wc-safe', safe.map((h) => `<button type="button" tabindex="-1" style="--c:${h}" data-hex="${h}" aria-label="Copy ${h}"></button>`).join(''));
  const safeHex = make('div', 'wc-safe-hex', 'Point at a square for its hex value. Click to copy.');
  $('.palette-note').after(safeEl, safeHex);
  safeEl.addEventListener('pointerover', (e) => { if (e.target.dataset.hex) safeHex.textContent = e.target.dataset.hex; });
  safeEl.addEventListener('click', async (e) => {
    const h = e.target.dataset.hex;
    if (!h) return;
    try { await navigator.clipboard.writeText(h); toast(`Copied ${h}!!`); } catch { toast(h); }
  });

  // Multimedia.
  const vibeH = $('.music-wrap h3');
  vibeH.insertAdjacentHTML('afterbegin', `${gif('cd')} `);
  vibeH.insertAdjacentHTML('beforeend', ` ${gif('cd')}`);
  const loopH = $('.loops-wrap h3');
  loopH.insertAdjacentHTML('afterbegin', `${gif('hamster-walk')} `);
  loopH.insertAdjacentHTML('beforeend', ` ${gif('hamster-walk')}`);
  const refsLists = $('.ref-lists');
  refsLists.insertAdjacentHTML('beforebegin', `<div class="wc-hr" aria-hidden="true">${gif('starline')}</div>`);
  $('.ref-games h3').insertAdjacentHTML('afterbegin', `${gif('pc-tower', '', 'wc-small')} `);

  // WebRing.
  const prevA = $('.foot-nav a[rel=prev]');
  const nextA = $('.foot-nav a[rel=next]');
  const prevName = prevA.textContent.trim();
  const nextName = nextA.textContent.trim();
  const ring = make('div', 'wc-ring', `
    <p><b>This page is a proud member of the Digital Nostalgia WebRing.</b><br>It has no owner and it has never once been updated.</p>
    <div class="wc-ring-row">
      <a href="${prevA.getAttribute('href')}" title="Previous: ${esc(prevName)}">${gif('prev', `Previous site in the ring: ${prevName}`)}</a>
      <div>[ <a href="#" data-ring-random>Random site</a> | <a href="../index.html">List all sites</a> | <a href="#wc-guest">Join!</a> ]</div>
      <a href="${nextA.getAttribute('href')}" title="Next: ${esc(nextName)}">${gif('next', `Next site in the ring: ${nextName}`)}</a>
    </div>`);
  const relSec = $('#related');
  $('.related', relSec).before(ring);
  $('[data-ring-random]', ring).addEventListener('click', (e) => {
    e.preventDefault();
    const pool = [...$$('.related a', relSec), prevA, nextA].map((a) => a.getAttribute('href'));
    location.href = pool[Math.floor(Math.random() * pool.length)];
  });

  // Guestbook. It really works, and it lives in this browser.
  const SEED = [
    { name: 'WebMaster', when: '03/14/98', msg: 'First post!! Testing my new guestbook script. If you can read this then it works.' },
    { name: 'CoolDude98', when: '04/02/98', msg: 'cool page!! love the flames. check out my page, i have 4 skulls' },
    { name: 'hampster_fan', when: '11/20/98', msg: 'how did u get the text to scroll?? pls tell me the code' },
    { name: 'Mom', when: '12/25/98', msg: 'Very nice dear. How do I get back to the Yahoo?' },
  ];
  const GB_KEY = 'eas-webcore-guestbook';
  const readBook = () => { try { const v = JSON.parse(store.get(GB_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
  const guest = make('section', 'wc-guest', `
    <h2>${gif('gb-pencil', 'Please sign my guest book')}<span>Sign my guestbook!!!</span>${gif('gb-book')}</h2>
    <p>Tell me what you think of my page! The first four entries here are made up. Yours is real, and it stays in your browser.</p>
    <form class="wc-form" autocomplete="off">
      <label for="wc-name">Your name:</label><input id="wc-name" name="name" maxlength="40" required>
      <label for="wc-home">Your homepage:</label><input id="wc-home" name="home" maxlength="120" placeholder="http://">
      <label for="wc-msg">Comments:</label><textarea id="wc-msg" name="msg" maxlength="500" required></textarea>
      <div class="wc-form-btns"><button class="wc-btn" type="submit">Sign It!</button><button class="wc-btn" type="reset">Clear Form</button></div>
    </form>
    <div class="wc-entries" aria-live="polite"></div>`);
  guest.id = 'wc-guest';
  const form = $('form', guest);
  const list = $('.wc-entries', guest);
  const safeHref = (u) => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; } };
  function drawBook() {
    const mine = readBook();
    const entry = (e, i, own) => {
      const href = e.home ? safeHref(e.home) : '';
      return `<div class="wc-entry${own ? ' mine' : ''}"><b>${esc(e.name)}</b>${href ? ` (<a href="${esc(href)}" target="_blank" rel="noopener noreferrer nofollow">my page</a>)` : ''} <small>signed on ${esc(e.when)}</small>${own ? `<button type="button" data-del="${i}" aria-label="Delete this entry">x</button>` : ''}<p>${esc(e.msg)}</p></div>`;
    };
    list.innerHTML = [...mine.map((e, i) => entry(e, i, true)).reverse(), ...SEED.map((e, i) => entry(e, i, false)).reverse()].join('');
  }
  drawBook();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const name = String(d.get('name') || '').trim();
    const msg = String(d.get('msg') || '').trim();
    if (!name || !msg) return;
    const book = readBook();
    book.push({ name: name.slice(0, 40), home: String(d.get('home') || '').trim().slice(0, 120), msg: msg.slice(0, 500), when: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) });
    store.set(GB_KEY, JSON.stringify(book.slice(-50)));
    form.reset();
    drawBook();
    toast('Thank you for signing my guestbook!!!');
  });
  list.addEventListener('click', (e) => {
    const i = e.target.dataset.del;
    if (i === undefined) return;
    const book = readBook();
    book.splice(Number(i), 1);
    store.set(GB_KEY, JSON.stringify(book));
    drawBook();
  });
  $('main').append(make('div', 'wc-hr', gif('runner')), guest);

  // Footer.
  const foot = $('.foot');
  $('p', foot).insertAdjacentHTML('beforebegin', `<p>${gif('email-gold', 'Sign my guestbook')}</p><p class="wc-blink-line">${gif('coming', 'Coming soon')}</p>`);
  $('p', foot).firstChild.outerHTML = `<a href="#wc-guest">${gif('email-gold', 'Sign my guestbook')}</a>`;
  const BADGES = ['b-netscape', 'b-ie', 'b-evil', 'b-geo', 'b-yahoo', 'b-coolpage', 'b-home', 'b-tracked', 'b-mac', 'b-amiga', 'b-js', 'b-free', 'b-frontpage', 'b-winamp', 'b-pixel'];
  $('.foot-nav', foot).insertAdjacentHTML('beforebegin', `<div class="wc-badges" aria-hidden="true">${BADGES.map((b) => gif(b)).join('')}</div><p>Every little GIF on this page was rescued from GeoCities by the Internet Archive. <a href="https://gifcities.org/" target="_blank" rel="noopener noreferrer" style="color:#0ff">Search GifCities</a> for your own.</p><p>Last updated 12/25/98. Best viewed in Netscape Navigator 4 at 800 x 600. <a href="../index.html" title="Exit to all styles">${gif('exit', 'Exit to all styles')}</a></p>`);

  // Status bar shows where a link goes, and the location bar follows the section you are in.
  const toUrl = (a) => {
    const raw = a.getAttribute('href') || '';
    if (/^https?:/.test(raw)) return raw;
    if (raw.startsWith('#')) return `${SITE}webcore.html${raw}`;
    return SITE + raw.replace(/^\.\.\//, '');
  };
  document.addEventListener('mouseover', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    const b = !a && e.target.closest && e.target.closest('button');
    if (a) setStatus(toUrl(a));
    else if (b) setStatus(b.getAttribute('title') || b.getAttribute('aria-label') || b.textContent.trim() || IDLE);
    else if (!loading || loading === shots.length) setStatus(IDLE);
  });
  if ('IntersectionObserver' in window) {
    const io2 = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) locField.textContent = `${SITE}webcore.html#${e.target.id}`;
    }, { rootMargin: '-40% 0px -55% 0px' });
    [...$$('.sec'), guest].forEach((s) => io2.observe(s));
  }

  // "No stealing my graphics."
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest && e.target.closest('.shot img, img.wc-gif')) toast("Hey!! Don't steal my graphics!!! (I stole them too.)");
  });

  // Background MIDI, Für Elise, only if you ask. A cheap square and triangle pair, like a late 90s sound card.
  const NOTES = [[0, 76], [1, 75], [2, 76], [3, 75], [4, 76], [5, 71], [6, 74], [7, 72], [8, 69, 2], [8, 45], [9, 52], [10, 57], [11, 60], [12, 64], [13, 69], [14, 71, 2], [14, 40], [15, 52], [16, 56], [17, 64], [18, 68], [19, 71], [20, 72, 2], [20, 45], [21, 52], [22, 57], [23, 64], [24, 76], [25, 75], [26, 76], [27, 75], [28, 76], [29, 71], [30, 74], [31, 72], [32, 69, 2], [32, 45], [33, 52], [34, 57], [35, 60], [36, 64], [37, 69], [38, 71, 2], [38, 40], [39, 52], [40, 56], [41, 64], [42, 72], [43, 71], [44, 69, 3], [44, 45], [45, 52], [46, 57]];
  const LOOP = 48;
  const SIX = 0.16;
  let ac = null;
  let midiT = 0;
  const hz = (n) => 440 * 2 ** ((n - 69) / 12);
  function queue(start) {
    for (const [t, n, d = 1] of NOTES) {
      const at = start + t * SIX;
      const len = Math.max(0.28, d * SIX * 1.6);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(n < 60 ? 0.07 : 0.11, at + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, at + len);
      g.connect(ac.destination);
      for (const [type, mul] of [['triangle', 1], ['square', 0.22]]) {
        const o = ac.createOscillator();
        const og = ac.createGain();
        o.type = type;
        o.frequency.value = hz(n);
        og.gain.value = mul;
        o.connect(og).connect(g);
        o.start(at);
        o.stop(at + len + 0.02);
      }
    }
    midiT = setTimeout(() => { if (ac) queue(start + LOOP * SIX); }, (start + LOOP * SIX - ac.currentTime - 0.3) * 1000);
  }
  const midiPlay = $('[data-midi=play]');
  function midiStop() {
    clearTimeout(midiT);
    if (ac) { ac.close(); ac = null; }
    midiPlay.setAttribute('aria-pressed', 'false');
  }
  midiPlay.addEventListener('click', () => {
    if (ac) return;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      queue(ac.currentTime + 0.08);
      midiPlay.setAttribute('aria-pressed', 'true');
    } catch { ac = null; }
  });
  $('[data-midi=stop]').addEventListener('click', midiStop);
  $$('.track-btn').forEach((b) => b.addEventListener('click', midiStop));

  // Sparkles follow a real mouse.
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const trail = make('div', 'wc-trail fx');
  trail.setAttribute('aria-hidden', 'true');
  const COUNT = 8;
  const sparks = [];
  if (fine.matches) {
    for (let i = 0; i < COUNT; i += 1) {
      const n = make('span', '', gif(i % 2 ? 'sparkle2' : 'sparkle'));
      const im = n.firstChild;
      im.removeAttribute('loading');
      trail.append(im);
      sparks.push({ el: im, x: 0, y: 0 });
    }
    document.body.append(trail);
    let mx = 0;
    let my = 0;
    let idle = 99;
    let running = false;
    const step = () => {
      let px = mx;
      let py = my;
      for (let i = 0; i < sparks.length; i += 1) {
        const s = sparks[i];
        s.x += (px - s.x) * 0.34;
        s.y += (py - s.y) * 0.34;
        s.el.style.transform = `translate(${(s.x + 12 + i * 2).toFixed(1)}px, ${(s.y + 12 + (i % 3) * 3).toFixed(1)}px)`;
        s.el.style.opacity = idle > 40 ? '0' : String(1 - i * 0.09);
        px = s.x;
        py = s.y;
      }
      idle += 1;
      if (idle < 60 && !isCalm()) requestAnimationFrame(step); else running = false;
    };
    addEventListener('pointermove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      idle = 0;
      if (!running && !isCalm()) { running = true; requestAnimationFrame(step); }
    }, { passive: true });
  }

  // Calm mode: animated GIFs freeze on one frame.
  function freeze(img) {
    if (img.dataset.frozen) return;
    if (!img.complete || !img.naturalWidth) { img.addEventListener('load', () => { if (isCalm()) freeze(img); }, { once: true }); return; }
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.className = img.className;
    c.style.width = `${img.getBoundingClientRect().width || img.naturalWidth}px`;
    try { c.getContext('2d').drawImage(img, 0, 0); } catch { return; }
    img.after(c);
    img.style.display = 'none';
    img.dataset.frozen = '1';
  }
  function thaw(img) {
    if (!img.dataset.frozen) return;
    const c = img.nextElementSibling;
    if (c && c.tagName === 'CANVAS') c.remove();
    img.style.display = '';
    delete img.dataset.frozen;
  }
  function applyCalm() {
    const on = isCalm();
    $$('img.wc-gif').forEach((im) => { if (on) freeze(im); else thaw(im); });
    if (on) shots.forEach((s) => s.classList.remove('wc-wait', 'wc-go'));
  }
  addEventListener('eas:calm', applyCalm);
  applyCalm();
})();
