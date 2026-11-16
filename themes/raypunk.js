// Raypunk: builds the magazine. Perspective masthead, a ray gun that reprints the cover in a new ink, running heads with page numbers, "continued on page" jumps, a contents list, a rocket cutaway tied to the cheat sheet, and printed spot art.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const INK = '#15120e';
  const RED = '#e2341a';
  const YEL = '#ffe516';
  const STEEL = '#7d9cab';
  const HULL = '#e6ece0';

  const svg = (cls, vb, body) => `<svg class="${cls}" viewBox="${vb}" aria-hidden="true">${body}</svg>`;
  const line = (d, w = 4, c = INK) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const shape = (d, f, w = 4) => `<path d="${d}" fill="${f}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`;

  // A bullet rocket, nose to the right, with brush-style shading. 480 by 190.
  const rocketArt = (flameClass = '') => `
    ${line('M12 62h52M2 96h46M16 130h52', 5)}
    <g class="${flameClass}">
      ${shape('M122 66 32 54l36 26-60 15 60 15-36 26 90-12Z', RED)}
      <path d="M122 80 76 74l22 13-44 8 44 8-22 13 46-6Z" fill="${YEL}"/>
    </g>
    ${shape('M170 58 124 8h70l50 46Z', RED)}
    ${shape('M112 95c8-36 88-58 188-56 70 1 130 26 172 56-42 30-102 55-172 56-100 2-180-20-188-56Z', HULL, 5)}
    <path d="M115 104c40 12 190 20 350-3-40 26-96 49-165 50-96 2-170-18-185-47Z" fill="${STEEL}"/>
    ${line('M162 70c58-18 138-20 206-5', 7, '#fff')}
    ${line('M112 95c8-36 88-58 188-56 70 1 130 26 172 56-42 30-102 55-172 56-100 2-180-20-188-56Z', 5)}
    ${shape('M372 52c40 10 76 26 100 43-24 17-60 33-100 43 12-28 12-58 0-86Z', RED, 5)}
    ${line('M186 44c12 30 12 72 0 104M348 46c12 30 12 74 0 100', 3)}
    ${[48, 62, 76, 90, 104, 118, 132].map((y) => `<circle cx="194" cy="${y}" r="2.6" fill="${INK}"/><circle cx="356" cy="${y}" r="2.6" fill="${INK}"/>`).join('')}
    ${[232, 276, 320].map((x) => `<circle cx="${x}" cy="84" r="15" fill="#2fb2c4" stroke="${INK}" stroke-width="5"/><path d="M${x - 7} 80a9 9 0 0 1 9-6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`).join('')}
    ${shape('M176 122 108 182h82l64-54Z', RED)}
    ${line('M138 164l58-46', 3)}`;

  // The ray gun, muzzle to the right. 260 by 150.
  const gunArt = `
    ${shape('M58 78h40L84 136q-18 10-38-2Z', '#8a5a2e')}
    ${line('M100 84q14 24-12 32', 4)}
    ${line('M64 94h22M60 108h22', 3)}
    ${shape('M28 40q-12 20 0 42l102 6q14-28 0-54Z', RED, 5)}
    ${line('M36 49l88-5', 5, '#ffd9c0')}
    ${shape('M70 37 44 6l68 28Z', YEL)}
    ${[[146, 24], [166, 20], [184, 16]].map(([x, r]) => `<ellipse cx="${x}" cy="61" rx="8" ry="${r}" fill="${HULL}" stroke="${INK}" stroke-width="4"/>`).join('')}
    ${shape('M190 50h24v22h-24Z', STEEL)}
    ${shape('M212 46 246 24v74L212 76Z', YEL)}
    <ellipse cx="246" cy="61" rx="8" ry="37" fill="${INK}"/>
    <ellipse cx="246" cy="61" rx="4" ry="24" fill="${RED}"/>
    ${[52, 72, 92, 112].map((x) => `<circle cx="${x}" cy="72" r="2.4" fill="${INK}"/>`).join('')}`;

  const ringedPlanet = (cx, cy, r, tilt, body, band) => `
    <g transform="rotate(${tilt} ${cx} ${cy})">
      <path d="M${cx - r * 1.75} ${cy}a${r * 1.75} ${r * 0.42} 0 0 1 ${r * 3.5} 0" fill="none" stroke="${INK}" stroke-width="${r * 0.2}"/>
      <path d="M${cx - r * 1.75} ${cy}a${r * 1.75} ${r * 0.42} 0 0 1 ${r * 3.5} 0" fill="none" stroke="${band}" stroke-width="${r * 0.12}"/>
    </g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${body}" stroke="${INK}" stroke-width="4"/>
    <path d="M${cx - r * 0.2} ${cy + r * 0.98}a${r} ${r} 0 0 0 ${r * 1.15} ${-r * 1.25}a${r * 1.1} ${r * 1.1} 0 0 1 ${-r * 1.15} ${r * 1.25}Z" fill="url(#rp-bd)"/>
    ${line(`M${cx - r * 0.9} ${cy - r * 0.38}q${r * 0.9} ${r * 0.34} ${r * 1.8} 0M${cx - r * 0.98} ${cy + r * 0.12}q${r} ${r * 0.34} ${r * 1.96} 0`, 3)}
    <g transform="rotate(${tilt} ${cx} ${cy})">
      <path d="M${cx - r * 1.75} ${cy}a${r * 1.75} ${r * 0.42} 0 0 0 ${r * 3.5} 0" fill="none" stroke="${INK}" stroke-width="${r * 0.2}"/>
      <path d="M${cx - r * 1.75} ${cy}a${r * 1.75} ${r * 0.42} 0 0 0 ${r * 3.5} 0" fill="none" stroke="${band}" stroke-width="${r * 0.12}"/>
    </g>`;

  const domeCity = `
    ${shape('M196 96V20l8-16 8 16v76Z', HULL)}
    ${shape('M150 96V44l6-14 6 14v52Z', STEEL)}
    ${shape('M240 96V52l6-14 6 14v44Z', STEEL)}
    <path d="M100 100a104 86 0 0 1 208 0Z" fill="#bfe8ee" fill-opacity=".55" stroke="${INK}" stroke-width="5"/>
    ${line('M126 44c36 30 40 40 48 56M282 44c-36 30-40 40-48 56M204 16v84', 2)}
    ${line('M130 42q24-20 54-26', 5, '#fff')}
    ${shape('M64 100h280v12H64Z', RED)}`;

  const robot = `
    ${line('M100 20V5', 4)}<circle cx="100" cy="5" r="4.5" fill="${RED}" stroke="${INK}" stroke-width="2"/>
    ${shape('M70 20h60q6 0 6 6v32q0 6-6 6H70q-6 0-6-6V26q0-6 6-6Z', HULL)}
    <circle cx="86" cy="40" r="9" fill="${YEL}" stroke="${INK}" stroke-width="4"/><circle cx="114" cy="40" r="9" fill="${YEL}" stroke="${INK}" stroke-width="4"/>
    ${line('M86 56h28', 4)}
    ${shape('M58 70h84q6 0 6 6v50q0 6-6 6H58q-6 0-6-6V76q0-6 6-6Z', STEEL, 5)}
    ${shape('M78 84h44v26H78Z', RED)}
    ${line('M52 82 24 104l6 28M148 82l28 22-6 28', 9)}
    ${line('M52 82 24 104l6 28M148 82l28 22-6 28', 3, HULL)}
    ${[60, 140].map((x) => [78, 96, 114].map((y) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${INK}"/>`).join('')).join('')}
    ${line('M60 62q40 6 80 0', 3)}`;

  const dotBall = (() => {
    let s = '';
    for (let y = 0; y < 15; y += 1) for (let x = 0; x < 34; x += 1) {
      const px = 10 + x * 12 + (y % 2) * 6;
      const py = 8 + y * 8.4;
      const r = Math.max(0, 5.4 * (1 - Math.hypot(px - 210, py - 66) / 200));
      if (r > 0.4) s += `<circle cx="${px}" cy="${py.toFixed(1)}" r="${r.toFixed(1)}"/>`;
    }
    return `<g fill="${INK}">${s}</g>`;
  })();

  // Shared dot fill used for shading
  document.body.insertAdjacentHTML('beforeend', `<svg style="position:absolute;width:0;height:0" aria-hidden="true"><defs><pattern id="rp-bd" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="4.5" cy="4.5" r="2.5" fill="${INK}"/></pattern></defs></svg>`);

  // Perspective masthead: each letter is smaller than the last, as on the old covers.
  const title = $('.hero-title');
  if (title) {
    const text = title.textContent.trim();
    title.setAttribute('aria-label', text);
    title.innerHTML = [...text].map((c) => `<span class="rp-l" aria-hidden="true">${c}</span>`).join('');
  }

  // Cover furniture
  const hero = $('.hero');
  const id = document.body.dataset.id || '';
  hero.insertAdjacentHTML('afterbegin', `<div class="rp-strip" aria-hidden="true">
      <span class="rp-vol">Vol. 1, No. ${id}</span>
      <span class="rp-tower">${svg('', '0 0 26 32', line('M13 6 5 31M13 6l8 25M8 21h10M10 14h6', 2.4) + `<circle cx="13" cy="5" r="3.4" fill="${RED}" stroke="${INK}" stroke-width="2"/>`)}Broadcast<br>tonight</span>
      <span class="rp-price">25 Cents</span>
    </div>`);
  $('.hero-text').insertAdjacentHTML('beforeend', `<p class="rp-by">Plates by<b>Frank R. Paul, Alex Raymond,</b><b>Starward Industries, Obsidian</b></p>${svg('rp-rocket', '0 0 480 190', rocketArt('rp-flame'))}`);
  $('.hero-gallery').insertAdjacentHTML('beforebegin', `<div class="rp-gunbox">
      <button class="rp-gun" type="button" aria-label="Fire the ray gun. Each shot reprints the cover in a new ink.">${svg('', '0 0 260 150', gunArt)}<span class="rp-ray">${[0, 1, 2, 3, 4, 5].map((n) => `<i style="--n:${n}"></i>`).join('')}</span></button>
      <p class="rp-gunlabel">Pull the trigger!<small>Each shot reprints the cover in a new ink.</small></p>
    </div><div class="rp-zap" aria-hidden="true">Zzzap!</div>`);

  const inks = ['yellow', 'red', 'teal', 'lilac', 'green'];
  const read = () => { try { return localStorage.getItem('eas-ray-ink'); } catch { return null; } };
  const write = (v) => { try { localStorage.setItem('eas-ray-ink', v); } catch { /* private window */ } };
  const setInk = (name) => { if (name === 'yellow') delete root.dataset.ink; else root.dataset.ink = name; };
  let ink = inks.includes(read()) ? read() : 'yellow';
  setInk(ink);
  const gun = $('.rp-gun');
  let locked = 0;
  gun.addEventListener('click', () => {
    if (performance.now() < locked) return; // never faster than twice a second
    locked = performance.now() + 500;
    const change = () => {
      ink = inks[(inks.indexOf(ink) + 1) % inks.length];
      setInk(ink);
      write(ink);
    };
    if (calm()) { change(); return; }
    gun.classList.remove('fire');
    hero.classList.remove('hit');
    void gun.offsetWidth; // restarts the animations
    gun.classList.add('fire');
    setTimeout(() => { hero.classList.add('hit'); change(); }, 300);
    setTimeout(() => { gun.classList.remove('fire'); hero.classList.remove('hit'); }, 1100);
  });

  // Page numbers: contents list, running heads and the serial jumps all agree.
  const sections = $$('main .sec');
  const pages = [9, 14, 23, 38, 47, 66, 84, 92];
  const pageOf = (sec) => pages[sections.indexOf(sec)];
  const subtitle = $('.hero-sub')?.textContent || '';
  const name = title?.getAttribute('aria-label') || '';
  sections.forEach((sec, i) => {
    const p = pages[i];
    const heading = $('.sec-title', sec);
    sec.insertAdjacentHTML('afterbegin', `<div class="rp-run" aria-hidden="true"><b>${p}</b><span>${name}</span><span>${subtitle}</span><b>${p + 1}</b></div>`);
    const prev = sections[i - 1];
    if (prev) {
      heading.insertAdjacentHTML('beforebegin', `<a class="rp-from" href="#${prev.id}">(Continued from page ${pageOf(prev)})</a>`);
    }
    const next = sections[i + 1];
    if (next) {
      const label = $('.sec-title', next).textContent;
      sec.insertAdjacentHTML('beforeend', `<a class="rp-jump" href="#${next.id}" aria-label="Continue to ${label.replace(/"/g, '&quot;')}, page ${pageOf(next)}">Continued on page ${pageOf(next)}!</a>`);
    }
  });
  $$('.toc a').forEach((a) => {
    const sec = document.getElementById(a.hash.slice(1));
    if (!sec) return;
    a.insertAdjacentHTML('beforeend', `<i class="rp-dots" aria-hidden="true"></i><b class="rp-pg">${pageOf(sec)}</b>`);
  });

  // In #feel, the "continued" line would break the two-page grid, and it is the first spread anyway.
  const feel = document.getElementById('feel');
  if (feel) {
    const planet = ringedPlanet(438, 118, 78, -18, '#f0a030', YEL);
    const stars = [[40, 34], [96, 92], [170, 26], [250, 60], [300, 150], [60, 170], [590, 40], [600, 170], [540, 240], [210, 130], [340, 26]].map(([x, y], n) => `<circle cx="${x}" cy="${y}" r="${n % 3 === 0 ? 2.6 : 1.6}" fill="#fff"/>`).join('');
    const front = `
      <rect width="640" height="400" fill="#0e1533"/>
      <rect width="640" height="400" fill="url(#rp-bd)" opacity=".28"/>
      ${stars}
      <circle cx="128" cy="76" r="30" fill="${HULL}" stroke="${INK}" stroke-width="4"/>
      <circle cx="118" cy="68" r="6" fill="${STEEL}"/><circle cx="140" cy="86" r="4" fill="${STEEL}"/>
      ${planet}
      ${shape('M0 300 70 226l36 42 58-72 58 84 44-36 62 58 60-74 58 70 52-52 76 64 66-44v134H0Z', '#c7361a', 5)}
      <path d="M0 400V326l92-32 66 34 70-30 74 40 86-26 80 26 92-30 80 28v74Z" fill="#5a1f4e" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M0 400V326l92-32 66 34 70-30 74 40 86-26 80 26 92-30 80 28v74Z" fill="url(#rp-bd)" opacity=".5"/>
      <g transform="translate(396 248) scale(.58)">${domeCity}</g>
      <g transform="translate(26 268) rotate(-22) scale(.7)">${rocketArt()}</g>`;
    $('.sec-title', feel).insertAdjacentHTML('afterend', svg('rp-front', '0 0 640 400', front));
    (feel.querySelector('.rp-jump') || feel.lastElementChild).insertAdjacentHTML('beforebegin', `<a class="rp-ad" href="#how">${svg('', '0 0 260 150', gunArt)}<span><b>Build your own at home!</b><span>Complete plans in this issue, page ${pages[2]}. No science required.</span></span></a>`);
  }

  // Spot art for the six panels
  const spots = [
    { art: svg('', '0 0 480 190', rocketArt()), spot: '#ffe516', w: '62%', r: '-8deg' },
    { art: svg('', '0 0 420 150', gunArt + [270, 300, 334, 372].map((x, i) => `<ellipse cx="${x}" cy="61" rx="${7 + i * 2}" ry="${32 + i * 8}" fill="none" stroke="${i % 2 ? YEL : RED}" stroke-width="7"/>`).join('')), spot: '#101a45', dot: 'rgb(255 255 255 / .35)', w: '72%' },
    { art: svg('', '0 0 200 140', robot), spot: '#3cb7c8', dot: 'rgb(21 18 14 / .55)', w: '42%' },
    { art: svg('', '0 0 360 200', ringedPlanet(180, 100, 62, -16, '#f0a030', YEL)), spot: '#101a45', dot: 'rgb(255 255 255 / .35)', w: '68%' },
    { art: svg('', '0 0 408 116', domeCity), spot: '#f58a30', dot: 'rgb(21 18 14 / .5)', w: '84%' },
    { art: svg('', '0 0 420 132', dotBall), spot: '#f8f0da', dot: 'transparent', w: '96%' },
  ];
  $$('.core-item').forEach((item, i) => {
    const s = spots[i % spots.length];
    const box = document.createElement('span');
    box.className = 'rp-spot';
    box.setAttribute('aria-hidden', 'true');
    box.style.setProperty('--spot', s.spot);
    if (s.dot) box.style.setProperty('--dot', s.dot);
    box.style.setProperty('--sw', s.w);
    if (s.r) box.style.setProperty('--sr', s.r);
    box.innerHTML = s.art;
    item.prepend(box);
  });

  // The rocket cutaway. Letters match the rows of the cheat sheet.
  const specs = $('.specs');
  if (specs) {
    const W = '#f2f6ff';
    const part = (key, d, w = 3) => `<path class="rp-part" data-part="${key}" d="${d}" fill="none" stroke="${W}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const rungs = [];
    for (let y = 190; y < 440; y += 16) rungs.push(`M141 ${y}h18`);
    const key = (k, x, y) => `<g class="rp-k" data-key="${k}"><circle cx="${x}" cy="${y}" r="17"/><text x="${x}" y="${y}">${k}</text></g>`;
    const lead = (d) => `<path d="${d}" fill="none" stroke="${YEL}" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/>`;
    const cut = `
      ${part('A', 'M92 396 26 540l4 50 70-70', 4)}
      ${part('A', 'M208 396l66 144-4 50-70-70', 4)}
      ${part('A', 'M150 460v130', 3)}
      <path d="M150 14c-50 56-72 156-72 276 0 100 10 180 26 230h92c16-50 26-130 26-230 0-120-22-220-72-276Z" fill="rgb(255 255 255 / .07)"/>
      ${part('B', 'M150 14c-50 56-72 156-72 276 0 100 10 180 26 230h92c16-50 26-130 26-230 0-120-22-220-72-276Z', 5)}
      ${part('B', 'M116 80c20 10 48 10 68 0M92 170c28 8 88 8 116 0M80 260c40 8 100 8 140 0M79 350c40 8 102 8 142 0M90 440c30 8 90 8 120 0', 3)}
      ${[126, 138, 150, 162, 174].map((x) => `<circle cx="${x}" cy="${x === 150 ? 88 : 86}" r="1.8" fill="${W}"/>`).join('')}
      ${part('C', 'M150 100a24 24 0 1 0 .01 0Z', 4)}
      ${part('C', 'M150 108a16 16 0 1 0 .01 0Z', 2.5)}
      ${part('C', 'M141 118a12 12 0 0 1 8-5', 3)}
      ${part('C', 'M100 196a11 11 0 1 0 .01 0ZM200 196a11 11 0 1 0 .01 0Z', 3)}
      <path d="${rungs.join('')}M141 180V440M159 180V440" fill="none" stroke="${W}" stroke-width="2"/>
      ${part('D', 'M150 14V-8', 4)}
      ${part('D', 'M136 -8c8-6 20-6 28 0M126 -22c14-10 34-10 48 0M116 -36c20-14 48-14 68 0', 3)}
      ${part('E', 'M120 520 104 562h92l-16-42', 4)}
      ${part('E', 'M112 568 128 626l22-34 22 34 16-58', 4)}
      <path d="M124 456h52l10 44H114Z" fill="none" stroke="${W}" stroke-width="3"/>
      ${part('F', 'M78 290c0 40 2 76 6 110', 8)}
      <ellipse cx="184" cy="306" rx="20" ry="38" fill="url(#rp-bl)"/>
      ${part('G', 'M184 268c-11 0-20 17-20 38s9 38 20 38 20-17 20-38-9-38-20-38Z', 3)}
      <ellipse cx="116" cy="306" rx="20" ry="38" fill="none" stroke="${W}" stroke-width="3"/>
      <path d="M104 390h92v34h-92Z" fill="#1c3f8f"/>
      ${part('H', 'M104 390h92v34h-92Z', 3)}
      <text x="150" y="414" fill="${YEL}" text-anchor="middle" style="font:400 22px var(--font-display)">RAY-1</text>
      ${lead('M50 488 16 504M222 232l40-22M126 122 62 134M172 -24l10-4M172 618l58 12M78 340l-42 24M204 306l50 12M196 408l62 18')}
      ${key('A', 2, 512)}${key('B', 276, 200)}${key('C', 46, 138)}${key('D', 196, -32)}${key('E', 246, 632)}${key('F', 20, 372)}${key('G', 270, 322)}${key('H', 274, 432)}`;
    specs.insertAdjacentHTML('beforeend', `<svg class="rp-cut" viewBox="-20 -56 340 700" aria-hidden="true"><defs><pattern id="rp-bl" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="4" cy="4" r="2.2" fill="${YEL}"/></pattern></defs>${cut}</svg>`);
    const cutEl = $('.rp-cut', specs);
    const letters = 'ABCDEFGH';
    const rows = $$('.spec', specs);
    rows.forEach((row, i) => { row.dataset.key = letters[i]; });
    const light = (k, on) => {
      rows.forEach((r) => { if (r.dataset.key === k) r.classList.toggle('on', on); });
      $$(`[data-key="${k}"], [data-part="${k}"]`, cutEl).forEach((el) => el.classList.toggle('on', on));
    };
    const clear = () => letters.split('').forEach((k) => light(k, false));
    rows.forEach((row) => {
      row.addEventListener('pointerenter', () => light(row.dataset.key, true));
      row.addEventListener('pointerleave', () => light(row.dataset.key, false));
      row.addEventListener('click', () => { clear(); light(row.dataset.key, true); });
    });
    $$('.rp-k', cutEl).forEach((g) => {
      g.addEventListener('pointerenter', () => light(g.dataset.key, true));
      g.addEventListener('pointerleave', () => light(g.dataset.key, false));
      g.addEventListener('click', () => { clear(); light(g.dataset.key, true); });
    });
  }
})();
