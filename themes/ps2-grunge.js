// PS2-era Grunge: a bulb that can be knocked, a brightness calibration that really dims the room,
// a menu with frame-blended ghosts, and a highlighter that has been through the procedure and marked every number.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private window */ } };

  // The bulb hangs from the top of the page. Knock it and the whole room swings harder for a moment.
  const page = $('.page');
  const bulb = document.createElement('button');
  bulb.type = 'button';
  bulb.className = 'ps2-bulb fx';
  bulb.title = 'Knock the bulb';
  bulb.setAttribute('aria-label', 'Knock the bulb, which makes it swing and flicker');
  bulb.innerHTML = '<svg viewBox="0 0 60 150" width="60" height="150" aria-hidden="true"><path d="M30 0v92" stroke="#15130f" stroke-width="2.4"/><rect x="23" y="88" width="14" height="14" rx="2" fill="#2b2a24"/><rect x="24" y="92" width="12" height="2" fill="#57554a"/><rect x="24" y="97" width="12" height="2" fill="#57554a"/><path class="ps2-glass" d="M24 102c-6 7-13 13-13 23a19 19 0 0 0 38 0c0-10-7-16-13-23z" fill="#ffe9b0"/><path d="M26 118c2-7 6-7 8 0" stroke="#a8742a" stroke-width="1.6" fill="none"/></svg><span class="ps2-halo"></span>';
  page.prepend(bulb);
  let knock;
  bulb.addEventListener('click', () => {
    root.classList.remove('ps2-knock');
    void root.offsetWidth;
    root.classList.add('ps2-knock');
    clearTimeout(knock);
    knock = setTimeout(() => root.classList.remove('ps2-knock'), 2600);
  });

  // The menu: every label gets a blurred twin, so hovering leaves a frame-blended ghost like the PS2's motion trails.
  const toc = $('.toc');
  // Labels read "Statement: the feel" on the page, but a game menu only needs the plain name.
  $$('a', toc).forEach((a) => {
    const plain = a.textContent.split(': ').pop();
    a.textContent = plain;
    a.dataset.t = plain;
  });
  const corner = document.createElement('p');
  corner.className = 'ps2-menu-head';
  corner.textContent = 'Main menu';
  toc.prepend(corner);

  // Brightness calibration, like the screen these games opened with. It controls how dark the room is.
  const cal = document.createElement('div');
  cal.className = 'ps2-cal';
  cal.innerHTML = `<label for="ps2-bright">Brightness</label>
    <input id="ps2-bright" type="range" min="0" max="100" step="5">
    <span class="ps2-mark" aria-hidden="true"></span>
    <p>Adjust until the mark is barely visible.</p>`;
  toc.append(cal);
  const range = $('input', cal);
  const setDark = (v) => { root.style.setProperty('--room', String(1 - v / 100)); root.style.setProperty('--mark', String(v / 170)); };
  const saved = Number(read('eas-ps2-bright'));
  range.value = read('eas-ps2-bright') !== null && !Number.isNaN(saved) ? saved : 55;
  setDark(Number(range.value));
  range.addEventListener('input', () => { setDark(Number(range.value)); write('eas-ps2-bright', range.value); });

  // Someone has been through the procedure with a highlighter and marked every number that matters.
  const NUM = /(?<![A-Za-z]|Hill\s)(\d[\d,.:]*\d|\d)(\s?(?:by|x)\s?\d+)?(\s?(?:to\s\d[\d,.]*\s?)?(?:percent|fps|px|ms|MB|bones|metres))?/g;
  // Only the words are marked: citation numbers and their links stay as they are.
  const markNumbers = (node) => {
    const t = node.data;
    let last = 0;
    let frag = null;
    for (const m of t.matchAll(NUM)) {
      frag ??= document.createDocumentFragment();
      frag.append(t.slice(last, m.index), Object.assign(document.createElement('mark'), { textContent: m[0] }));
      last = m.index + m[0].length;
    }
    if (frag) { frag.append(t.slice(last)); node.replaceWith(frag); }
  };
  $$('.step p, .spec dd').forEach((p) => {
    const walk = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    const texts = [];
    while (walk.nextNode()) if (!walk.currentNode.parentElement.closest('.cite')) texts.push(walk.currentNode);
    texts.forEach(markNumbers);
  });

  // The stamps land when a sheet comes into view, once.
  const stamps = $$('.do, .avoid');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('stamped'); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    stamps.forEach((s) => io.observe(s));
  } else stamps.forEach((s) => s.classList.add('stamped'));

  // Frame numbers on the contact sheet.
  $$('.ref-gallery .shot').forEach((s, i) => { s.dataset.frame = `${i * 2 + 12}A`; });
})();
