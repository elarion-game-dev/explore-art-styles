// Dark Academia: real book furniture. Running heads and folios, working footnotes, a previous reader's marginalia,
// a magic square from Durer's Melencolia I, a ribbon that marks your place, and a date due slip stamped with today.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const q = (s, el = document) => el.querySelector(s);
  const qq = (s, el = document) => [...el.querySelectorAll(s)];
  const make = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

  // ---- Title page: Durer's magic square as the printer's device ----
  const square = [16, 3, 2, 13, 5, 10, 11, 8, 9, 6, 7, 12, 4, 15, 14, 1];
  const text = q('.hero-text');
  const device = make('div', 'da-device', square.map((n) => `<span>${n}</span>`).join(''));
  device.setAttribute('aria-hidden', 'true');
  const sum = make('p', 'da-sum');
  sum.setAttribute('aria-hidden', 'true');
  const imprint = make('p', 'da-imprint', 'Volume LVIII of the Series<br>MMXXVI');
  text.append(device, sum, imprint);
  const cells = qq('span', device);
  const lines = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15], [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15], [0, 5, 10, 15], [3, 6, 9, 12]];
  let lineAt = 0;
  const showLine = (cellIndex) => {
    const options = lines.filter((l) => l.includes(cellIndex));
    const line = options[lineAt++ % options.length];
    cells.forEach((c, i) => c.classList.toggle('on', line.includes(i)));
    sum.textContent = `${line.map((i) => square[i]).join(' + ')} = 34`;
  };
  cells.forEach((c, i) => c.addEventListener('pointerenter', () => showLine(i)));
  device.addEventListener('pointerleave', () => { cells.forEach((c) => c.classList.remove('on')); sum.textContent = ''; });

  // A library's oval stamp on the title page.
  const stamp = make('div', 'da-stamp', `<svg viewBox="0 0 200 130" width="100%" height="100%" aria-hidden="true" fill="none" stroke="#4f3a78">
    <defs><filter id="da-rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" result="d"/><feColorMatrix in="n" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -3.4 2.5" result="m"/><feComposite in="d" in2="m" operator="in"/></filter>
      <path id="da-st1" d="M24 65a76 43 0 0 1 152 0"/><path id="da-st2" d="M9 65a91 56 0 0 0 182 0"/></defs>
    <g filter="url(#da-rough)">
      <ellipse cx="100" cy="65" rx="97" ry="62" stroke-width="3.500"/><ellipse cx="100" cy="65" rx="70" ry="38" stroke-width="1.200"/>
      <g fill="#4f3a78" stroke="none" font-family="Georgia, 'Times New Roman', serif" text-anchor="middle">
        <text font-size="12" letter-spacing="3"><textPath href="#da-st1" startOffset="50%">EX LIBRIS</textPath></text>
        <text font-size="11" letter-spacing="1.500"><textPath href="#da-st2" startOffset="50%">NOT TO BE REMOVED</textPath></text>
        <text x="100" y="68" font-size="23">No. 58</text>
        <text x="100" y="84" font-size="9" letter-spacing=".8">EXPLORE ART STYLES</text>
      </g>
    </g></svg>`);
  stamp.setAttribute('aria-hidden', 'true');
  text.append(stamp);

  // ---- Running heads, folios and the contents page ----
  // The plates are unnumbered prelims. Numbered pages start at the first chapter, as in a real book.
  const secs = qq('.sec');
  const pageOf = new Map();
  let page = 1;
  for (const sec of secs) {
    pageOf.set(sec.id, page);
    const title = q('.sec-title', sec).textContent;
    const run = make('div', 'da-run', `<span><b>${page}</b>Dark Academia</span><span>${title}<b>${page + 1}</b></span>`);
    run.setAttribute('aria-hidden', 'true');
    sec.prepend(run);
    page += 2;
  }
  for (const a of qq('.toc a')) {
    const id = a.getAttribute('href').slice(1);
    if (pageOf.has(id)) a.append(make('span', 'da-leader'), make('span', 'da-folio', String(pageOf.get(id))));
  }
  // ---- A reader's pencil: underlines in the text ----
  function wrapPhrase(scope, phrase, cls, build) {
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.closest('.da-marg, .da-notes, .da-run')) continue;
      const at = node.textContent.indexOf(phrase);
      if (at < 0) continue;
      const range = document.createRange();
      range.setStart(node, at);
      range.setEnd(node, at + phrase.length);
      const span = make('span', cls);
      range.surroundContents(span);
      if (build) build(span);
      return span;
    }
    return null;
  }
  const underlines = [
    ['.feel-body', 'it can hurt you'],
    ['.origins', 'older than its name'],
    ['.core-item:nth-child(1)', 'hide the flame behind a figure'],
    ['.core-item:nth-child(6)', 'Romantic madness and perhaps murder'],
    ['.step:nth-child(2)', 'paint a full moon in the window'],
    ['.step:nth-child(5)', 'lines averaging 45 to 90 characters'],
  ];
  for (const [sel, phrase] of underlines) {
    const scope = q(sel);
    if (scope) wrapPhrase(scope, phrase, 'da-ul');
  }

  // ---- Footnotes. These are real, and they teach something. ----
  const marks = ['*', '†', '‡', '§', '‖', '¶'];
  const notes = [
    ['#feel', '.feel-body', 'dimly lit libraries', 'Gothic fiction found its manuscripts in libraries from the start: Horace Walpole’s The Castle of Otranto (1764) claimed to be a translation of an old manuscript found in one.'],
    ['#feel', '.feel-body', 'one flame', 'Joseph Wright of Derby painted this light again and again in the 1760s and 1770s. See Plate I, where the lamp is hidden behind the figure in silhouette.'],
    ['#core', '.core-item:nth-child(5)', 'an orrery', 'A clockwork model that shows the planets in motion. Its cousin the astrolabe, a hand-held model of the sky, was used to find the time and the height of stars. Either one makes a good puzzle object, since it is already a machine for working things out.'],
    ['#core', '.core-item:nth-child(6)', 'esoteric and mysterious subjects', 'Durer’s Melencolia I (1514) hangs a four by four magic square on the wall. Every row, column and diagonal adds up to 34, and the bottom row gives the date. It is the device on this book’s title page. Try it with your pointer.'],
    ['#how', '.step:nth-child(2)', '1800 K for candle light', 'Many game lighting tools take colour temperature directly, so you can type the number in rather than choosing an orange by eye.'],
    ['#palette', '.palette-note', 'Pentiment.', 'If you name a palette, try the method of Werner’s Nomenclature of Colours (1814), which identifies each colour by an animal, a plant and a mineral. Darwin took a copy on the Beagle.'],
  ];
  let fnCount = 0;
  const perSection = new Map();
  for (const [secSel, scopeSel, phrase, body] of notes) {
    const sec = q(secSel);
    const scope = q(scopeSel, sec);
    if (!scope) continue;
    const list = perSection.get(sec) || [];
    perSection.set(sec, list);
    const mark = marks[list.length];
    const id = ++fnCount;
    const span = wrapPhrase(scope, phrase, 'da-noted');
    if (!span) continue;
    const ref = make('sup', 'da-ref', `<a href="#da-fn${id}" id="da-fr${id}" aria-label="Footnote ${id}">${mark}</a>`);
    span.after(ref);
    list.push(make('li', '', `<a href="#da-fr${id}" aria-label="Back to text">${mark}</a> ${body}`));
    list[list.length - 1].id = `da-fn${id}`;
    const li = list[list.length - 1];
    q('a', ref).addEventListener('pointerenter', () => li.classList.add('on'));
    q('a', ref).addEventListener('pointerleave', () => li.classList.remove('on'));
  }
  for (const [sec, list] of perSection) {
    const ol = make('ol', 'da-notes');
    ol.setAttribute('aria-label', 'Footnotes');
    ol.append(...list);
    sec.append(ol);
  }

  // ---- Marginalia: someone has been here before you ----
  const margin = [
    ['.sec-feel .origins', 'reread Tartt over the break', 'r'],
    ['.core-item:nth-child(1)', 'where is the candle? see plate 1', 'l'],
    ['.core-item:nth-child(4)', 'buy a lens', 'r'],
    ['.core-item:nth-child(5)', 'yes. all of it.', 'l'],
    ['.step:nth-child(1)', 'squint test!', 'l'],
    ['.step:nth-child(4)', 'never white', 'r'],
    ['.step:nth-child(5)', 'count them', 'l'],
    ['.avoid', 'guilty', 'r'],
    ['.palette-note', 'mix own oxblood', 'l'],
    ['.ref-media', 'borrowed by J.M., not returned', 'r'],
  ];
  for (const [sel, note, side] of margin) {
    const at = q(sel);
    if (!at) continue;
    at.classList.add('da-anchor');
    const m = make('span', `da-marg da-marg-${side}`);
    m.textContent = note;
    m.setAttribute('aria-hidden', 'true');
    at.append(m);
  }

  // ---- Date due slip and pocket, in the back of the book ----
  const fmt = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const due = new Date(Date.now() + 14 * 864e5);
  const old = ['12 OCT 1931', '03 MAR 1962', '19 NOV 1987', '07 FEB 2004', '31 OCT 2019'];
  const tilts = ['-1.5deg', '1deg', '-.5deg', '2deg', '-2deg', '1deg'];
  const slip = make('div', 'da-slip', `<b>DATE DUE</b><ul>${[...old, fmt(due)].map((d, i) => `<li style="--r:${tilts[i]}"${i === old.length ? ' class="is-today"' : ''}>${d}</li>`).join('')}</ul><small>The last stamp is yours.</small>`);
  const pocket = make('div', 'da-pocket');
  pocket.append(slip, make('div', 'da-pocketfront', 'Library Pocket<br>Fines are charged on overdue books'));
  q('.foot').append(pocket);
  if ('IntersectionObserver' in window) {
    const today = q('.is-today', slip);
    today.style.visibility = 'hidden';
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      today.style.visibility = '';
      today.classList.add('thump');
      io.disconnect();
    }, { threshold: .6 });
    io.observe(slip);
  }

  // ---- The ribbon marks how far you have read ----
  let queued = false;
  const paintRibbon = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    root.style.setProperty('--read', max > 0 ? (scrollY / max).toFixed(4) : '0');
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(paintRibbon); } }, { passive: true });
  addEventListener('resize', paintRibbon);
  paintRibbon();

  // ---- Choosing a chapter turns a page ----
  const book3d = make('div', 'da-book3d');
  book3d.setAttribute('aria-hidden', 'true');
  const leaf = make('div', 'da-turn');
  book3d.append(leaf);
  book3d.hidden = true;
  document.body.append(book3d);
  for (const a of qq('.toc a, .da-notes a, .da-ref a')) {
    if (!a.closest('.toc')) continue;
    a.addEventListener('click', (e) => {
      if (isCalm() || innerWidth <= 820) return;
      const target = document.getElementById(a.getAttribute('href').slice(1));
      if (!target) return;
      e.preventDefault();
      book3d.hidden = false;
      leaf.classList.remove('go');
      void leaf.offsetWidth;
      leaf.classList.add('go');
      setTimeout(() => {
        root.style.scrollBehavior = 'auto';
        target.scrollIntoView();
        root.style.scrollBehavior = '';
        history.replaceState(null, '', `#${target.id}`);
      }, 300);
      setTimeout(() => { book3d.hidden = true; leaf.classList.remove('go'); }, 640);
    });
  }
})();
