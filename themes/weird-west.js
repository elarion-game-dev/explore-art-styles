// Weird West: turns the hero into a wanted poster, paints a red sun and an inked sigil behind it, notes the dead man's
// hand under the cards, and lets you shoot holes in the page. Click any empty spot to fire; the revolver in the corner
// counts six rounds and reloads with a spin when you click it or run dry. Calm mode puts the gun away.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const NS = 'http://www.w3.org/2000/svg';
  const hero = $('.hero');
  const text = $('.hero-text');
  if (!hero || !text) return;

  // ---------- The poster ----------
  const wanted = document.createElement('p');
  wanted.className = 'ww-wanted';
  wanted.setAttribute('aria-hidden', 'true');
  wanted.textContent = 'Wanted';
  const dead = document.createElement('p');
  dead.className = 'ww-dead';
  dead.setAttribute('aria-hidden', 'true');
  dead.textContent = 'Dead or undead';
  const reward = document.createElement('p');
  reward.className = 'ww-reward';
  reward.setAttribute('aria-hidden', 'true');
  reward.innerHTML = 'Reward: one silver bullet<small>Apply to the marshal, before sundown</small>';
  text.prepend(wanted, dead);
  text.append(reward);

  const sun = document.createElement('div');
  sun.className = 'ww-sun';
  sun.setAttribute('aria-hidden', 'true');
  hero.prepend(sun);

  // An inked sigil: a ring, a seven-point star drawn in one stroke, and small marks around it
  const sigil = () => {
    const c = 180;
    const pt = (r, a) => [c + r * Math.cos(a - Math.PI / 2), c + r * Math.sin(a - Math.PI / 2)];
    let star = '';
    for (let i = 0; i <= 7; i += 1) {
      const [x, y] = pt(132, ((i * 3) % 7) * ((2 * Math.PI) / 7));
      star += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    let marks = '';
    for (let i = 0; i < 7; i += 1) {
      const a = i * ((2 * Math.PI) / 7) + Math.PI / 7;
      const [x, y] = pt(158, a);
      const [x2, y2] = pt(146, a);
      marks += `M${x2.toFixed(1)} ${y2.toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}`;
      const [cx, cy] = pt(158, a - 0.22);
      marks += `M${(cx - 4).toFixed(1)} ${cy.toFixed(1)}h8M${cx.toFixed(1)} ${(cy - 4).toFixed(1)}v8`;
    }
    const eye = `M${c - 26} ${c}Q${c} ${c - 22} ${c + 26} ${c}Q${c} ${c + 22} ${c - 26} ${c}Z`;
    return `<svg class="ww-sigil" viewBox="0 0 360 360" aria-hidden="true">
      <circle class="draw" cx="${c}" cy="${c}" r="170" style="--len:1070"/>
      <circle class="draw" cx="${c}" cy="${c}" r="140" style="--len:880" stroke-dasharray="2 0"/>
      <path class="draw" d="${star}" style="--len:1900"/>
      <path class="draw" d="${marks}" style="--len:400"/>
      <path class="draw" d="${eye}" style="--len:140"/>
      <circle cx="${c}" cy="${c}" r="10" fill="currentColor" stroke="none"/>
    </svg>`;
  };
  text.insertAdjacentHTML('beforeend', sigil());

  // The fifth card
  const hand = $('.core-list');
  if (hand) {
    const note = document.createElement('p');
    note.className = 'ww-hand-note';
    note.textContent = 'The story goes that Wild Bill Hickok died holding black aces and eights. Nobody agrees on the fifth card.';
    hand.after(note);
  }

  // ---------- Bullet holes ----------
  const layer = document.createElement('div');
  layer.className = 'ww-holes fx';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  // Zero the layer first, or scrollHeight would include it and the page could only ever grow.
  const sizeLayer = () => {
    layer.style.height = '0';
    layer.style.height = `${document.documentElement.scrollHeight}px`;
  };

  let seed = 61;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const holeSvg = () => {
    let cracks = '';
    const n = 5 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2 + rnd() * 0.5;
      const r1 = 7;
      const r2 = 11 + rnd() * 9;
      const mid = a + (rnd() - 0.5) * 0.4;
      cracks += `M${(15 + r1 * Math.cos(a)).toFixed(1)} ${(15 + r1 * Math.sin(a)).toFixed(1)}L${(15 + ((r1 + r2) / 2) * Math.cos(mid)).toFixed(1)} ${(15 + ((r1 + r2) / 2) * Math.sin(mid)).toFixed(1)}L${(15 + r2 * Math.cos(a)).toFixed(1)} ${(15 + r2 * Math.sin(a)).toFixed(1)}`;
    }
    let rim = '';
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      const r = 5.2 + rnd() * 2.2;
      rim += `${i ? 'L' : 'M'}${(15 + r * Math.cos(a)).toFixed(1)} ${(15 + r * Math.sin(a)).toFixed(1)}`;
    }
    return `<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="10" fill="rgb(40 22 8 / .28)"/><path d="${cracks}" stroke="#1c120f" stroke-width=".9" fill="none" opacity=".75"/><path d="${rim}Z" fill="#f6e7c4" opacity=".7" transform="translate(.6 .8)"/><path d="${rim}Z" fill="#0b0705"/></svg>`;
  };
  const MAX = 36;
  const fire = (x, y) => {
    sizeLayer();
    const hole = document.createElement('div');
    hole.className = 'ww-hole';
    hole.style.left = `${x}px`;
    hole.style.top = `${y}px`;
    hole.style.transform = `rotate(${Math.round(rnd() * 360)}deg) scale(${(0.8 + rnd() * 0.4).toFixed(2)})`;
    hole.innerHTML = `${holeSvg()}<i class="ww-flash"></i><i class="ww-smoke"></i>`;
    layer.append(hole);
    while (layer.children.length > MAX) layer.firstElementChild.remove();
  };

  // ---------- The revolver ----------
  const gun = document.createElement('button');
  gun.type = 'button';
  gun.className = 'ww-gun fx';
  gun.setAttribute('aria-label', 'Reload the revolver. Click empty parts of the page to shoot holes in it.');
  const chambers = [];
  let cyl = '';
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const x = 50 + 27 * Math.cos(a);
    const y = 50 + 27 * Math.sin(a);
    chambers.push([x, y]);
    cyl += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" fill="#0b0705"/><g class="ww-round" data-i="${i}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9.5" fill="#d6a93a" stroke="#7a5212" stroke-width="1.5"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#b8862a" stroke="#7a5212"/></g>`;
  }
  let flutes = '';
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    flutes += `<ellipse cx="${(50 + 45 * Math.cos(a)).toFixed(1)}" cy="${(50 + 45 * Math.sin(a)).toFixed(1)}" rx="5" ry="9" transform="rotate(${(a * 180) / Math.PI + 90} ${(50 + 45 * Math.cos(a)).toFixed(1)} ${(50 + 45 * Math.sin(a)).toFixed(1)})" fill="#efdcb3"/>`;
  }
  gun.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="ww-steel" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#8d8f93"/><stop offset=".6" stop-color="#4a4c52"/><stop offset="1" stop-color="#1e1f23"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#ww-steel)" stroke="#1c120f" stroke-width="2"/>${flutes}${cyl}<circle cx="50" cy="50" r="8" fill="#2a2b30" stroke="#1c120f" stroke-width="2"/><circle cx="50" cy="50" r="3" fill="#0b0705"/></svg>`;
  const tip = document.createElement('div');
  tip.className = 'ww-gun-tip fx';
  tip.setAttribute('aria-hidden', 'true');
  document.body.append(gun, tip);
  const rounds = [...gun.querySelectorAll('.ww-round')];
  const cylSvg = gun.querySelector('svg');
  let left = 6;
  let turn = 0;
  let tipTimer;
  const say = (msg) => { tip.textContent = msg; tip.classList.add('on'); clearTimeout(tipTimer); tipTimer = setTimeout(() => tip.classList.remove('on'), 1800); };
  const paintRounds = () => rounds.forEach((r, i) => { r.style.opacity = i < left ? '1' : '0'; });
  const reload = () => {
    left = 6;
    turn += 360;
    cylSvg.style.transform = `rotate(${turn}deg)`;
    paintRounds();
    say('Reloaded. Six rounds.');
  };
  gun.addEventListener('click', (e) => { e.stopPropagation(); reload(); });

  const skip = 'a, button, input, textarea, select, label, summary, video, img, iframe, dialog, .atlas, .player, .lightbox, .toast, [role="button"], .swatch';
  document.addEventListener('click', (e) => {
    if (calm() || e.button !== 0 || e.defaultPrevented) return;
    if (e.target.closest(skip)) return;
    const sel = getSelection();
    if (sel && String(sel).trim()) return;
    if (left === 0) { say('Click. Empty. Click the cylinder to reload.'); return; }
    fire(e.pageX, e.pageY);
    left -= 1;
    turn += 60;
    cylSvg.style.transform = `rotate(${turn}deg)`;
    paintRounds();
    if (left === 0) say('Out of rounds.');
  });
  addEventListener('resize', sizeLayer);
  addEventListener('load', sizeLayer);
  addEventListener('eas:calm', () => { if (calm()) layer.replaceChildren(); });
  sizeLayer();
  paintRounds();
  setTimeout(() => { if (!calm()) say('Click any empty spot to shoot. Six rounds.'); }, 1600);
})();
