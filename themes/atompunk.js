// Atompunk: starbursts turn as you scroll, the hero gets its roadside sign and atom, and the cheat sheet becomes a wrist computer with working tabs and a dial.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);

  // Every starburst on the page shares one angle, tied to how far you have scrolled.
  let ticking = false;
  const paintSpin = () => {
    ticking = false;
    if (calm()) return;
    root.style.setProperty('--spin', `${(scrollY * 0.12).toFixed(1)}deg`);
    if (gauge) gauge.style.setProperty('--rad', String(Math.min(120, (scrollY / Math.max(1, root.scrollHeight - innerHeight)) * 120 + radJitter).toFixed(1)));
  };
  let gauge = null;
  let radJitter = 0;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(paintSpin); } }, { passive: true });
  addEventListener('eas:calm', () => { if (calm()) root.style.setProperty('--spin', '0deg'); else paintSpin(); });

  // The roadside sign, with a Sputnik star on the pole and a bulb arrow pointing at the pictures.
  const heroText = $('.hero-text');
  if (heroText) {
    const sign = document.createElement('div');
    sign.className = 'ap-sign';
    sign.setAttribute('aria-hidden', 'true');
    sign.innerHTML = `
      <i class="ap-pole"></i>
      <i class="ap-star"></i>
      <div class="ap-board">Tomorrow<small>This way, folks</small></div>
      <i class="ap-arrow"></i>`;
    const atom = document.createElement('div');
    atom.className = 'ap-atom';
    atom.setAttribute('aria-hidden', 'true');
    const orbit = (angle) => `<g transform="rotate(${angle})"><ellipse rx="46" ry="17"/><circle class="e" r="4.4"/></g>`;
    atom.innerHTML = `<svg class="ap-atomsvg" viewBox="-56 -56 112 112">${orbit(0)}${orbit(60)}${orbit(120)}<circle class="nuc" r="9"/></svg>`;
    const flash = document.createElement('div');
    flash.className = 'ap-flash';
    flash.setAttribute('aria-hidden', 'true');
    flash.innerHTML = '<i></i><b>All new<br>for 1958!</b>';
    heroText.append(sign, atom, flash);
  }

  // The wrist computer. The tabs and the dial do the same job, and the arrow keys work on the tabs.
  const side = $('.how-side');
  const specs = side && $('.specs', side);
  const dodont = side && $('.dodont', side);
  if (side && specs && dodont) {
    const tabs = [
      { id: 'specs', label: $('h3', specs)?.textContent || 'Specs' },
      { id: 'do', label: $('.do h3', dodont)?.textContent || 'Do' },
      { id: 'avoid', label: $('.avoid h3', dodont)?.textContent || 'Avoid' },
    ];
    side.classList.add('ap-pip');
    const screen = document.createElement('div');
    screen.className = 'ap-screen';
    const bar = document.createElement('div');
    bar.className = 'ap-tabs';
    bar.setAttribute('role', 'tablist');
    bar.setAttribute('aria-label', 'Wrist computer');
    const buttons = tabs.map((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = t.label;
      b.setAttribute('role', 'tab');
      bar.append(b);
      return b;
    });
    screen.append(bar, specs, dodont);

    const head = document.createElement('div');
    head.className = 'ap-head';
    head.innerHTML = 'Atom-Mate 3000 <small>Wrist computer. Fully transistorized</small>';

    const controls = document.createElement('div');
    controls.className = 'ap-side';
    controls.innerHTML = `
      <div class="ap-gauge" aria-hidden="true"><b></b><span>RADS</span></div>
      <div class="ap-grille" aria-hidden="true"></div>
      <button class="ap-knob" type="button" aria-label="Turn the dial to the next screen"></button>
      <div class="ap-knob-label" aria-hidden="true">Turn me!</div>`;

    const body = document.createElement('div');
    body.className = 'ap-body';
    body.append(screen, controls);
    side.replaceChildren(head, body);
    gauge = $('.ap-gauge', controls);

    const knob = $('.ap-knob', controls);
    let current = 0;
    let turns = 0;
    const show = (i, focus) => {
      current = (i + tabs.length) % tabs.length;
      side.dataset.tab = tabs[current].id;
      buttons.forEach((b, n) => {
        b.setAttribute('aria-selected', String(n === current));
        b.tabIndex = n === current ? 0 : -1;
      });
      if (focus) buttons[current].focus();
    };
    buttons.forEach((b, i) => b.addEventListener('click', () => {
      turns += ((i - current + tabs.length) % tabs.length) * 120;
      knob.style.setProperty('--turn', `${turns}deg`);
      show(i);
    }));
    bar.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      e.stopPropagation(); // keeps the page's arrow keys from changing style while the tabs have focus
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      turns += dir * 120;
      knob.style.setProperty('--turn', `${turns}deg`);
      show(current + dir, true);
    });
    knob.addEventListener('click', () => {
      turns += 120;
      knob.style.setProperty('--turn', `${turns}deg`);
      show(current + 1);
      // The needle jumps a little with every turn, and settles back as you scroll on.
      radJitter = 22;
      paintSpin();
      setTimeout(() => { radJitter = 0; paintSpin(); }, 340);
    });
    show(0);
  }
  paintSpin();
})();
