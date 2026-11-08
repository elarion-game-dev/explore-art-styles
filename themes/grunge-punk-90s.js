// Grunge zine: ransom-note title you can re-cut, torn paper edges, and a working photocopier that pushes the page one generation further.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const isCalm = () => root.dataset.calm === '1';
  const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  // Paper edges. Points are percentages plus a few pixels of jitter, so the edge looks the same on a big sheet and a small scrap.
  function edge(r, side, torn, amp, step) {
    const pts = [];
    const n = torn ? step : 1;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * 100;
      const a = (torn ? r() * amp : r() * 2.2).toFixed(1);
      const b = (r() * 1.4 - 0.7).toFixed(1);
      if (side === 0) pts.push(`calc(${t}% + ${b}px) ${a}px`);
      if (side === 1) pts.push(`calc(100% - ${a}px) calc(${t}% + ${b}px)`);
      if (side === 2) pts.push(`calc(${100 - t}% + ${b}px) calc(100% - ${a}px)`);
      if (side === 3) pts.push(`${a}px calc(${100 - t}% + ${b}px)`);
    }
    return pts;
  }
  function tear(el, seed, { t = 0, r: right = 0, b = 0, l = 0, amp = 6, step = 26 } = {}) {
    const r = rng(seed);
    const pts = [...edge(r, 0, t, amp, step), ...edge(r, 1, right, amp, step), ...edge(r, 2, b, amp, step), ...edge(r, 3, l, amp, step)];
    el.style.setProperty('--tear', `polygon(${pts.join(',')})`);
  }
  $$('.shot-link').forEach((a, i) => tear(a, 11 + i * 7));
  $$('.core-item').forEach((el, i) => tear(el, 40 + i * 5, { b: i % 2, r: i % 3 === 0 ? 1 : 0, amp: 5, step: 18 }));
  tear($('.feel-body'), 7, { b: 1, r: 1, amp: 8, step: 34 });
  tear($('.origins'), 9, { l: 1, amp: 5, step: 30 });
  tear($('.specs'), 13, { t: 1, b: 1, amp: 5, step: 24 });
  tear($('.do'), 21, { r: 1, amp: 4 });
  tear($('.avoid'), 22, { b: 1, amp: 5 });
  tear($('.learn'), 23, { t: 1, amp: 6, step: 40 });
  tear($('.music-wrap'), 27, { b: 1, t: 1, amp: 6, step: 30 });
  $$('.ref-list').forEach((el, i) => tear(el, 31 + i, { t: i, b: 1 - i, amp: 6, step: 28 }));
  $$('.swatch button').forEach((el, i) => tear(el, 60 + i * 3, { t: i % 2, b: 1 - (i % 2), amp: 4, step: 12 }));
  $$('.sec-core, .sec-how, .sec-refs').forEach((el, i) => tear(el, 90 + i * 4, { t: 1, b: 1, amp: 16, step: 70 }));

  // Headline words get their own span, so each section can set them differently.
  $$('.sec-title').forEach((h) => {
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', words.join(' '));
    h.innerHTML = words.map((w, i) => `<span class="w w${i + 1}" aria-hidden="true">${w.replace(/[<&]/g, '')}</span>`).join(' ');
  });

  // The tagline is cut into one strip per sentence. A single sentence is cut into two to four strips of words.
  const tag = $('.hero-tagline');
  let bits = tag.textContent.match(/[^.]+\./g) || [];
  const words = tag.textContent.trim().split(/\s+/);
  if (bits.length < 2 && words.length > 4) {
    const n = Math.min(4, Math.ceil(words.length / 3));
    const per = Math.ceil(words.length / n);
    bits = Array.from({ length: n }, (_, i) => words.slice(i * per, (i + 1) * per).join(' ')).filter(Boolean);
  }
  if (bits.length > 1) {
    tag.setAttribute('aria-label', tag.textContent);
    tag.innerHTML = bits.map((b) => `<span aria-hidden="true">${b.trim()}</span>`).join(' ');
  }

  // Ransom note. Every letter is a scrap, and adjacent letters never share a face or a stock.
  const title = $('.hero-title');
  const text = title.textContent.trim();
  title.setAttribute('aria-label', text);
  const FACES = [
    { f: "'Anton'", s: 1.02, c: 'uppercase' },
    { f: "'Abril Fatface'", s: 0.98, c: 'none' },
    { f: "'UnifrakturCook'", s: 1.04, c: 'none', w: 700 },
    { f: "'Alfa Slab One'", s: 0.86, c: 'uppercase' },
    { f: "'Special Elite'", s: 1.06, c: 'lowercase' },
    { f: "'Permanent Marker'", s: 0.98, c: 'uppercase' },
    { f: "'Bowlby One'", s: 0.82, c: 'lowercase' },
    { f: "'Courier Prime'", s: 1.12, c: 'uppercase', w: 700 },
  ];
  const STOCK = [
    ['var(--white)', 'var(--toner)'],
    ['var(--toner)', 'var(--white)'],
    ['var(--yellow)', 'var(--toner)'],
    ['var(--pink)', 'var(--toner)'],
    ['var(--red)', 'var(--white)'],
    ['var(--ochre)', 'var(--toner)'],
    ['var(--white)', 'var(--red)'],
  ];
  const pick = (r, list, not) => { let i; do { i = Math.floor(r() * list.length); } while (i === not); return i; };
  function cut(seed, animate) {
    const r = rng(seed);
    let f = -1;
    let k = -1;
    title.innerHTML = text.split(' ').map((word) => `<span class="gp-word" aria-hidden="true">${[...word].map((ch, n) => {
      f = pick(r, FACES, f);
      k = pick(r, STOCK, k);
      const face = FACES[f];
      const [bg, fg] = STOCK[k];
      const rot = ((r() * 11) - 5.5).toFixed(1);
      const y = ((r() * 0.13) - 0.065).toFixed(3);
      const delay = animate ? `--d:${n * 45}ms;` : '';
      return `<span class="gp-l${animate ? ' is-new' : ''}" style="${delay}--r:${rot}deg;--y:${y}em;--f:${face.f};--s:${face.s};--c:${face.c};--w:${face.w || 400};--bg:${bg};--fg:${fg}"><i>${ch}</i></span>`;
    }).join('')}</span>`).join(' ');
    $$('.gp-l i', title).forEach((el, i) => tear(el, seed + i * 3));
  }
  let cutSeed = 18;
  cut(cutSeed, false);
  title.addEventListener('click', () => cut(cutSeed = (cutSeed * 31 + 7) >>> 0 || 3, !isCalm()));
  const recut = document.createElement('button');
  recut.type = 'button';
  recut.className = 'gp-recut';
  recut.textContent = 'cut it again';
  recut.addEventListener('click', () => cut(cutSeed = (cutSeed * 31 + 7) >>> 0 || 3, !isCalm()));
  title.after(recut);

  // The photocopier. Each press makes a copy of the copy.
  const NOTES = {
    1: 'Original. Full colour, clean edges.',
    2: 'First copy. The colour has gone and the midtones are going.',
    3: 'Second copy. Greys crush to black or white.',
    4: 'Third copy. Pure toner. Hover an image for the original.',
  };
  const read = () => { try { return localStorage.getItem('eas-grunge-gen'); } catch { return null; } };
  const write = (v) => { try { localStorage.setItem('eas-grunge-gen', v); } catch { /* private window */ } };
  const panel = document.createElement('aside');
  panel.className = 'gp-copier';
  panel.setAttribute('aria-label', 'Photocopier');
  panel.innerHTML = `
    <div class="gp-lcd" aria-hidden="true"><small>GEN</small><b class="gp-num">1</b></div>
    <button class="gp-start" type="button" title="Run this page through the copier again">COPY</button>
    <button class="gp-clear" type="button" title="Back to the original" aria-label="Back to the original">C</button>
    <p class="gp-note" role="status"></p>`;
  document.body.append(panel);
  const num = $('.gp-num', panel);
  const note = $('.gp-note', panel);
  const scan = $('.gp-scan');
  let noteTimer;
  let gen = 1;
  function setGen(n, say = true) {
    gen = n;
    if (n === 1) delete root.dataset.gen; else root.dataset.gen = String(n);
    num.textContent = String(n);
    write(String(n));
    if (say) {
      note.textContent = NOTES[n];
      note.classList.add('on');
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => note.classList.remove('on'), 3600);
    }
  }
  const saved = Number(read());
  if (saved >= 2 && saved <= 4) setGen(saved, false);
  let busy = false;
  $('.gp-start', panel).addEventListener('click', () => {
    if (busy) return;
    const next = gen >= 4 ? 1 : gen + 1;
    if (isCalm() || !scan) { setGen(next); return; }
    busy = true;
    scan.classList.remove('run');
    void scan.offsetWidth;
    scan.classList.add('run');
    setTimeout(() => setGen(next), 700);
    setTimeout(() => { scan.classList.remove('run'); busy = false; }, 1500);
  });
  $('.gp-clear', panel).addEventListener('click', () => setGen(1));
})();
