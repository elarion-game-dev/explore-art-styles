// Frutiger Eco: a plant in the margin that grows as you read and never shrinks, a trees-planted counter with a forest on the back cover, wind turbines, a thumb index and real charts.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const M = '../media/frutiger-eco/';
  const make = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html) n.innerHTML = html; return n; };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };
  const page = document.querySelector('.page');
  const hero = document.querySelector('.hero');

  // Cover: the last word gets its own colour, a spray of leaves, a wind farm on the hill.
  const h1 = document.querySelector('.hero-title');
  h1.innerHTML = h1.textContent.replace(/\s*(Eco)$/, ' <span class="eco-word">$1</span>');
  const spray = make('img', 'eco-spray');
  spray.src = `${M}spray.svg`;
  spray.alt = '';
  spray.width = 232;
  spray.height = 188;
  hero.append(spray);

  const turbine = (x, y, h, dur, delay) => {
    const r = h * 0.52;
    const blade = (a) => `<path d="M0 0C${r * 0.09} ${-r * 0.26} ${r * 0.06} ${-r * 0.78} 0 ${-r}C${-r * 0.03} ${-r * 0.7} ${-r * 0.05} ${-r * 0.3} 0 0Z" transform="rotate(${a})" fill="#f4f8f0" stroke="#5f8f52" stroke-width=".7"/>`;
    return `<g transform="translate(${x} ${y})"><path d="M${-h * 0.018} ${h}L${-h * 0.009} 0L${h * 0.009} 0L${h * 0.018} ${h}Z" fill="#f4f8f0" stroke="#5f8f52" stroke-width=".7"/><g class="eco-rotor" style="animation-duration:${dur}s;animation-delay:${delay}s">${blade(0)}${blade(120)}${blade(240)}</g><circle r="${h * 0.022}" fill="#0b5d3b"/></g>`;
  };
  const wind = make('div', 'eco-wind', `<svg viewBox="0 0 1200 130" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${[
    [64, 56, 74, 5.2, -1], [176, 70, 60, 4.2, -2.4], [286, 62, 66, 5.8, -0.6], [930, 74, 56, 3.8, -1.7], [1036, 56, 74, 4.8, -3], [1140, 66, 64, 5.4, -2],
  ].map((t) => turbine(...t)).join('')}</svg>`);
  wind.setAttribute('aria-hidden', 'true');
  hero.append(wind);

  // Front page: contents beside a growth chart.
  const toc = document.querySelector('.toc');
  const front = make('div', 'eco-front');
  toc.before(front);
  front.append(toc);
  const pts = [[30, 150], [170, 124], [310, 104], [450, 64], [610, 16]];
  const line = pts.reduce((d, [x, y], i) => {
    if (!i) return `M${x} ${y}`;
    const [px, py] = pts[i - 1];
    const mx = (px + x) / 2;
    return `${d}C${mx} ${py} ${mx} ${y} ${x} ${y}`;
  }, '');
  const miles = [
    [2005, 'GE launches Ecomagination'],
    [2006, 'Planet Earth goes out in high definition'],
    [2007, 'Wii Fit turns from blue to green'],
    [2009, 'Flower blows a petal out of the city'],
    [2023, 'Terra Nil restores a wasteland'],
  ];
  const high = make('div', 'eco-high', `
    <h2 class="eco-high-title">Highlights of the period</h2>
    <svg class="eco-chart" viewBox="0 0 640 180" aria-hidden="true">
      <defs><linearGradient id="eco-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8cc63f" stop-opacity=".55"/><stop offset="1" stop-color="#8cc63f" stop-opacity="0"/></linearGradient></defs>
      <path d="${line}L610 176L30 176Z" fill="url(#eco-area)"/>
      <path d="M0 176H640" stroke="#0b5d3b"/>
      <path class="eco-chart-line" d="${line}"/>
      ${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#fff" stroke="#2e9e3f" stroke-width="3"/>`).join('')}
      <image href="${M}leaf.svg" x="596" y="-38" width="30" height="54" transform="rotate(16 610 16)"/>
    </svg>
    <div class="eco-miles">${miles.map(([y, t]) => `<div><b>${y}</b><span>${t}</span></div>`).join('')}</div>
    <p class="eco-small">Chart 1. Green optimism in games and advertising. The dates are real. The curve is not to scale.</p>`);
  front.append(high);

  // Roadmap: a rising bar per phase, each one jumps to its step.
  const steps = [...document.querySelectorAll('.step')];
  steps.forEach((s, i) => { s.id = `phase-${i + 1}`; });
  const bars = make('nav', 'eco-bars');
  bars.setAttribute('aria-label', 'Phases of the roadmap');
  bars.innerHTML = steps.map((s, i) => `<a href="#phase-${i + 1}" style="--i:${i}" title="${s.querySelector('h3').textContent.replace(/"/g, '&quot;')}">${i + 1}</a>`).join('');
  document.querySelector('.steps').before(bars);

  // Palette: a doughnut with real shares, counted from the four hero images.
  const swatches = document.querySelector('.swatches');
  const shares = [28.7, 21.9, 18.0, 9.1, 8.0, 5.4, 4.9, 4.0];
  const swatchEls = [...swatches.children];
  const colours = JSON.parse(document.querySelector('#palette-data').textContent).colors;
  const C = 2 * Math.PI * 40;
  let run = 0;
  const donutSvg = shares.map((s, i) => {
    const len = (s / 100) * C;
    const piece = `<circle data-i="${i}" cx="60" cy="60" r="40" stroke="${colours[i].hex}" stroke-dasharray="${(len - 0.8).toFixed(2)} ${(C - len + 0.8).toFixed(2)}" stroke-dashoffset="${(-run).toFixed(2)}"/>`;
    run += len;
    return piece;
  }).join('');
  const donut = make('figure', 'eco-donut-wrap', `<svg class="eco-donut" viewBox="0 0 120 120" aria-hidden="true">${donutSvg}</svg><figcaption><b data-readout>Chart 2</b>Share of the pixels in Figures 1 to 4, by nearest swatch.</figcaption>`);
  const wrap = make('div', 'eco-palette');
  swatches.before(wrap);
  wrap.append(swatches, donut);
  const readout = donut.querySelector('[data-readout]');
  const rings = [...donut.querySelectorAll('circle')];
  swatchEls.forEach((el, i) => {
    const on = () => { rings.forEach((r, n) => r.classList.toggle('on', n === i)); el.classList.add('is-on'); readout.textContent = `${colours[i].name}: ${shares[i]}%`; };
    const off = () => { rings[i].classList.remove('on'); el.classList.remove('is-on'); readout.textContent = 'Chart 2'; };
    el.addEventListener('pointerenter', on);
    el.addEventListener('pointerleave', off);
    el.addEventListener('focusin', on);
    el.addEventListener('focusout', off);
  });

  // Thumb index down the right edge.
  const secs = [...document.querySelectorAll('.sec')];
  const tabsCols = ['#083f28', '#0b5d3b', '#157a3e', '#2e8f3a', '#3f9a33', '#4f9a22', '#5b8f14'];
  const tabs = make('nav', 'eco-tabs');
  tabs.setAttribute('aria-label', 'Report sections');
  tabs.innerHTML = secs.map((s, i) => `<a href="#${s.id}" style="--c:${tabsCols[i % tabsCols.length]}" data-label="${s.querySelector('.sec-title').textContent.replace(/"/g, '&quot;')}" aria-label="${s.querySelector('.sec-title').textContent.replace(/"/g, '&quot;')}">${String(i + 1).padStart(2, '0')}</a>`).join('');
  document.body.append(tabs);
  const tabLinks = [...tabs.children];

  // The plant. Scroll progress feeds a high-water mark, so it only ever grows.
  const H = 800;
  const X = 56;
  const stemPts = [];
  for (let y = H; y >= 40; y -= 40) stemPts.push([X + Math.sin(y / 74) * 13, y]);
  const stemD = stemPts.reduce((d, [x, y], i) => {
    if (!i) return `M${x.toFixed(1)} ${y}`;
    const [px, py] = stemPts[i - 1];
    return `${d}Q${px.toFixed(1)} ${(py + y) / 2} ${((px + x) / 2).toFixed(1)} ${(py + y) / 2}`;
  }, '');
  const leaves = [];
  const count = 11;
  for (let i = 0; i < count; i += 1) {
    const y = H - 44 - i * 62;
    const x = X + Math.sin(y / 74) * 13;
    const side = i % 2 ? 1 : -1;
    const s = 1 - i * 0.035;
    const w = 46 * s;
    const h = w * 2.118;
    leaves.push({ at: (H - y) / (H - 40), html: `<g class="pl" transform="translate(${x.toFixed(1)} ${y}) rotate(${side * (40 + (i % 3) * 7)})"><image class="pu" href="${M}leaf.svg" x="${(-w * 0.47).toFixed(1)}" y="${(-h * 0.861).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"/></g>` });
  }
  const petals = Array.from({ length: 16 }, (_, i) => `<path d="M0 -9C5 -15 4 -24 0 -30C-4 -24 -5 -15 0 -9Z" fill="#f7d326" stroke="#e0ac12" stroke-width=".6" transform="rotate(${i * 22.5})"/>`).join('');
  const plant = make('div', 'eco-plant', `<svg viewBox="0 0 118 ${H}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <defs><linearGradient id="eco-stem-g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#0b5d3b"/><stop offset="1" stop-color="#6fc226"/></linearGradient></defs>
    <path class="eco-stem" d="${stemD}"/>
    ${leaves.map((l) => l.html).join('')}
    <g transform="translate(${(stemPts[stemPts.length - 1][0]).toFixed(1)} 40)"><g class="eco-bloom">${petals}<circle r="11" fill="#2b2622"/><circle r="11" fill="none" stroke="#cfd3cd" stroke-width="1.500" stroke-dasharray="2 2"/><circle r="3" fill="#cfd3cd"/></g></g>
  </svg>`);
  plant.setAttribute('aria-hidden', 'true');
  document.body.append(plant);
  const stem = plant.querySelector('.eco-stem');
  const stemLen = stem.getTotalLength();
  stem.style.strokeDasharray = `${stemLen}`;
  const leafEls = [...plant.querySelectorAll('.pl')];
  const bloom = plant.querySelector('.eco-bloom');

  // Trees planted. Reading plants them, and so does the button. Figures unaudited.
  const box = make('div', 'eco-trees', '<span class="eco-n" aria-live="polite">0</span><span class="eco-l">trees<span class="eco-lx"> planted</span>*</span><button type="button">Plant one</button>');
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', 'Trees planted');
  document.body.append(box);
  const numEl = box.querySelector('.eco-n');
  let trees = parseInt(store.get('eas-eco-trees') || '0', 10) || 0;
  let readPlanted = 0;

  // The forest on the back cover. Seeded, so your trees stay where they grew.
  const foot = document.querySelector('.foot');
  const FW = 1600;
  const FH = 118;
  // The drawing is 1600 wide with hills running 1600 further on each side, so the svg only crops sideways and never scales up
  // (scaling up on wide screens cut the tops off the trees).
  const forest = make('div', 'eco-forest', `<svg viewBox="${-FW} 0 ${FW * 3} ${FH}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><linearGradient id="eco-crown" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a5d92a"/><stop offset=".5" stop-color="#3fa52c"/><stop offset="1" stop-color="#0d6b34"/></linearGradient></defs>
    <path d="M-1600 84C-1100 70-300 122 0 96C300 70 600 66 900 84S1400 100 1600 82C1800 64 2700 98 3200 86V118H-1600Z" fill="#083f28"/><g data-trees></g></svg>`);
  forest.setAttribute('aria-hidden', 'true');
  foot.prepend(forest);
  const treeLayer = forest.querySelector('[data-trees]');
  let shown = 0;
  const rnd = (seed) => { const x = Math.sin(seed * 127.1 + 11.7) * 43758.5453; return x - Math.floor(x); };
  const MAX_SHOWN = 90;
  function addTree(i, fresh) {
    const reach = ((i + 1) * 17) % 780;
    const x = FW / 2 + (i % 2 ? 1 : -1) * (reach + rnd(i) * 12);
    const base = 88 + Math.sin(x / 220) * 6;
    const s = 0.55 + rnd(i + 0.5) * 0.65;
    const r = 22 * s;
    const svgNS = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('class', `eco-tree${fresh ? ' new' : ''}`);
    g.innerHTML = `<rect x="${(x - 2.2 * s).toFixed(1)}" y="${(base - 22 * s).toFixed(1)}" width="${(4.4 * s).toFixed(1)}" height="${(26 * s).toFixed(1)}" fill="#5e4524"/><circle cx="${x.toFixed(1)}" cy="${(base - 22 * s - r * 0.7).toFixed(1)}" r="${r.toFixed(1)}" fill="url(#eco-crown)"/><ellipse cx="${(x - r * 0.3).toFixed(1)}" cy="${(base - 22 * s - r * 1.1).toFixed(1)}" rx="${(r * 0.36).toFixed(1)}" ry="${(r * 0.22).toFixed(1)}" fill="#fff" opacity=".42"/>`;
    treeLayer.append(g);
  }
  function paintTrees(fresh) {
    numEl.textContent = trees.toLocaleString('en-US');
    const want = Math.min(trees, MAX_SHOWN);
    while (shown < want) { addTree(shown, fresh && !isCalm()); shown += 1; }
  }
  paintTrees(false);
  const plantOne = () => { trees += 1; store.set('eas-eco-trees', String(trees)); paintTrees(true); };
  box.querySelector('button').addEventListener('click', plantOne);

  // On a phone the counter would sit on top of the text, so it waits on the back cover with the forest.
  const phone = matchMedia('(max-width: 760px)');
  const placeBox = () => { if (phone.matches) foot.querySelector('p').before(box); else document.body.append(box); };
  placeBox();
  phone.addEventListener('change', placeBox);

  const print = make('p', 'eco-print', '* Trees are imaginary. Figures unaudited. Please consider the environment before printing this page.');
  foot.querySelector('p').after(print);

  let peak = 0;
  let queued = false;
  function paint() {
    queued = false;
    const max = Math.max(1, root.scrollHeight - innerHeight);
    const prog = Math.min(1, Math.max(0, scrollY / max));
    if (prog > peak) peak = prog;
    const p = isCalm() ? 1 : Math.max(0.075, peak);
    stem.style.strokeDashoffset = `${stemLen * (1 - p)}`;
    leaves.forEach((l, i) => leafEls[i].classList.toggle('on', p > l.at));
    bloom.classList.toggle('on', p > 0.985);
    // Reading plants a tree for every twelfth of the report you reach.
    const earned = Math.floor(peak * 12);
    if (earned > readPlanted) {
      trees += earned - readPlanted;
      readPlanted = earned;
      store.set('eas-eco-trees', String(trees));
      paintTrees(true);
    }
    // Thumb index marks the current section.
    const y = scrollY + innerHeight * 0.4;
    let cur = -1;
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top + scrollY <= y) cur = i; });
    tabLinks.forEach((a, i) => a.setAttribute('aria-current', String(i === cur)));
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  addEventListener('eas:calm', queue);
  paint();
  void page;
})();
