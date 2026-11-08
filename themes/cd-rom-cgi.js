// CD-ROM CGI: an installer on the first visit, a hand cursor, and a small rendered hall in the linking book.
// The hall works like Myst: turn with the edges of the picture, then touch the object to go to its section.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const isCalm = () => root.dataset.calm === '1';
  const session = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* private window */ } },
  };

  // ---- the hand: one drawing, turned to point where you can go ----
  const HAND = [
    '.....##.........', '....#oo#........', '....#oo#........', '....#oo#........', '....#oo###......', '....#oo#oo###...', '....#oo#oo#oo##.', '.##.#oo#oo#oo#o#',
    '#oo##oooooooo#o#', '#ooo#oooooooooo#', '.#oo#ooooooooss#', '..#ooooooooooss#', '..#oooooooooss#.', '...#ooooooooss#.', '....#oooooooss#.', '....#ooooooss#..', '.....#oooooss#..', '.....#########..',
  ];
  const OPEN = [
    '.......##.......', '...##.#oo#.##...', '..#oo##oo##oo#..', '..#oo##oo##oo#.#', '...#oo#oo##oo##o', '...#oo#oo##oo#oo', '##.#oooooooo#oo#', '#o##ooooooooooo#',
    '#oo#ooooooooooo#', '.#oo#ooooooooss#', '..#ooooooooooss#', '..#oooooooooss#.', '...#ooooooooss#.', '....#oooooooss#.', '....#ooooooss#..', '.....########...',
  ];
  const rotate = (rows, turn) => {
    const w = rows[0].length;
    if (turn === 'left') return Array.from({ length: w }, (_, x) => rows.map((r) => r[x]).join('')); // transpose: the finger ends up pointing left
    return Array.from({ length: w }, (_, x) => rows.map((r) => r[w - 1 - x]).reverse().join(''));
  };
  const cursor = (rows, s = 2) => {
    const fill = { '#': '#2a1608', o: '#f4dcb8', s: '#c99c6a' };
    let parts = '';
    rows.forEach((row, y) => [...row].forEach((c, x) => { if (fill[c]) parts += `<rect x='${x * s}' y='${y * s}' width='${s}' height='${s}' fill='${fill[c]}'/>`; }));
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${rows[0].length * s}' height='${rows.length * s}' shape-rendering='crispEdges'>${parts}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  };
  root.style.setProperty('--hand-open', `${cursor(OPEN)} 16 12, auto`);
  root.style.setProperty('--hand-point', `${cursor(HAND)} 11 0, pointer`);
  root.style.setProperty('--hand-up', `${cursor(HAND)} 11 0, pointer`);
  root.style.setProperty('--hand-left', `${cursor(rotate(HAND, 'left'))} 0 11, pointer`);
  root.style.setProperty('--hand-right', `${cursor(rotate(HAND, 'right'))} 34 21, pointer`);

  // ---- the installer ----
  const FILES = ['AGES.DAT', 'STAGE01.PCT', 'HYPER.DLL', 'CINEPAK.DRV', 'MARBLE.BMP', 'BRASS.BMP', 'HALL.MOV', 'README.TXT'];
  const bandedBlue = () => {
    // Windows-style setup screens faded from blue to black in visible steps.
    const n = 32;
    const stops = [];
    for (let i = 0; i < n; i++) {
      const b = Math.round(216 * (1 - i / n));
      stops.push(`rgb(0 0 ${b}) ${(i / n) * 100}% ${((i + 1) / n) * 100}%`);
    }
    return `linear-gradient(${stops.join(',')})`;
  };
  const playCover = () => {
    if (isCalm() || innerWidth <= 1160) return;
    const hero = $('.hero-text');
    if (!hero) return;
    const c = document.createElement('div');
    c.className = 'cg-cover';
    c.setAttribute('aria-hidden', 'true');
    c.textContent = 'Linking book';
    hero.append(c);
    c.addEventListener('animationend', () => c.remove());
    setTimeout(() => c.remove(), 1500);
  };
  const runSetup = () => {
    if (isCalm() || session.get('eas-cgi-setup')) return;
    session.set('eas-cgi-setup', '1');
    const s = document.createElement('div');
    s.className = 'cg-setup';
    s.style.background = bandedBlue();
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = `<h2>${document.querySelector('.hero-title')?.textContent || 'CD-ROM'} Setup</h2>
      <div class="cg-dialog"><div class="cg-dtitle">Setup</div><div class="cg-dbody">
      <p>Copying files from Disc 1:</p><p class="cg-file"></p>
      <div class="cg-bar"><div class="cg-fill"></div><div class="cg-pct">0%</div></div>
      <button class="cg-skip" type="button" tabindex="-1">Skip</button></div></div>`;
    document.body.append(s);
    const fill = $('.cg-fill', s);
    const pct = $('.cg-pct', s);
    const file = $('.cg-file', s);
    const start = performance.now();
    const DUR = 1150;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      s.classList.add('done');
      playCover();
      setTimeout(() => s.remove(), 320);
    };
    const tick = (now) => {
      if (finished) return;
      const t = Math.min(1, (now - start) / DUR);
      // Installers never moved smoothly: progress comes in lurches.
      const shown = Math.floor(Math.pow(t, 1.15) * 24) / 24;
      fill.style.width = `${shown * 100}%`;
      pct.textContent = `${Math.round(shown * 100)}%`;
      file.textContent = `C:\\AGES\\${FILES[Math.min(FILES.length - 1, Math.floor(t * FILES.length))]}`;
      if (t < 1) requestAnimationFrame(tick); else setTimeout(finish, 90);
    };
    requestAnimationFrame(tick);
    $('.cg-skip', s).addEventListener('click', finish);
    s.addEventListener('click', finish);
    addEventListener('keydown', finish, { once: true });
  };

  // ---- turning a page to a section ----
  const go = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    const jump = () => { target.scrollIntoView({ behavior: 'auto', block: 'start' }); history.replaceState(null, '', `#${id}`); };
    if (isCalm()) { jump(); return; }
    const f = document.createElement('div');
    f.className = 'cg-flip';
    f.setAttribute('aria-hidden', 'true');
    f.innerHTML = '<i></i>';
    document.body.append(f);
    setTimeout(jump, 330);
    setTimeout(() => f.remove(), 720);
  };
  $$('.toc a').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href').slice(1);
    if (!document.getElementById(id)) return;
    e.preventDefault();
    go(id);
  }));

  // ---- the hall ----
  const tocLinks = $$('.toc a');
  const nodes = tocLinks.map((a, i) => ({ id: a.getAttribute('href').slice(1), label: a.textContent, src: `../media/cd-rom-cgi/hall-${i}.webp` }));
  const heroText = $('.hero-text');
  if (heroText && nodes.length === 6) {
    const panel = document.createElement('div');
    panel.className = 'cg-panel';
    panel.innerHTML = `<div class="cg-stage" role="group" aria-label="A small rendered hall. Turn left or right to find a section, then touch the object to go there.">
      <canvas width="640" height="480"></canvas>
      <button class="cg-hot cg-left" type="button" aria-label="Turn left"><span class="cg-arrow" aria-hidden="true">&#9664;</span></button>
      <button class="cg-hot cg-right" type="button" aria-label="Turn right"><span class="cg-arrow" aria-hidden="true">&#9654;</span></button>
      <button class="cg-hot cg-go" type="button"><span class="cg-plaque"></span></button>
    </div><p class="cg-hint">${matchMedia('(hover: none)').matches ? 'Tap an arrow to turn. Tap the object to go there.' : 'Point at the edges to turn. Touch the object to go there.'}</p>`;
    heroText.append(panel);
    const canvas = $('canvas', panel);
    const ctx = canvas.getContext('2d');
    const plaque = $('.cg-plaque', panel);
    const goBtn = $('.cg-go', panel);
    const images = nodes.map((n) => { const im = new Image(); im.src = n.src; return im; });
    let view = 0;
    let anim = 0;
    const label = () => {
      plaque.textContent = nodes[view].label;
      goBtn.setAttribute('aria-label', `Go to ${nodes[view].label}`);
    };
    // HyperCard's dissolve: the next card comes through in random squares.
    const dissolve = (im) => {
      cancelAnimationFrame(anim);
      if (isCalm() || !im.complete) { if (im.complete) ctx.drawImage(im, 0, 0, 640, 480); else im.onload = () => ctx.drawImage(im, 0, 0, 640, 480); return; }
      const S = 16;
      const cells = [];
      for (let y = 0; y < 480; y += S) for (let x = 0; x < 640; x += S) cells.push([x, y]);
      for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
      const DUR = 380;
      const start = performance.now();
      let done = 0;
      const step = (now) => {
        const want = Math.min(cells.length, Math.ceil(((now - start) / DUR) * cells.length));
        for (; done < want; done++) { const [x, y] = cells[done]; ctx.drawImage(im, x, y, S, S, x, y, S, S); }
        if (done < cells.length) anim = requestAnimationFrame(step); else ctx.drawImage(im, 0, 0, 640, 480);
      };
      anim = requestAnimationFrame(step);
    };
    const turn = (dir) => {
      view = (view + dir + nodes.length) % nodes.length;
      label();
      dissolve(images[view]);
    };
    $('.cg-left', panel).addEventListener('click', () => turn(-1));
    $('.cg-right', panel).addEventListener('click', () => turn(1));
    goBtn.addEventListener('click', () => go(nodes[view].id));
    label();
    if (images[0].complete) ctx.drawImage(images[0], 0, 0, 640, 480);
    else images[0].addEventListener('load', () => { if (view === 0) ctx.drawImage(images[0], 0, 0, 640, 480); }, { once: true });
  }

  runSetup();
})();
