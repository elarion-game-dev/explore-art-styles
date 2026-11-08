// Soviet Retrofuturism: builds the fixed Lissitzky composition behind the page and turns its wedge to point at each section as you scroll. Also: title strips, the plan's progress, cut-paper figures, the Shukhov radio tower and the approval stamp.
(() => {
  const root = document.documentElement;
  const calm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];

  // The stage
  const stage = document.createElement('div');
  stage.className = 'sr-stage';
  stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = `
    <i class="sr-half"></i>
    <i class="sr-disc"></i>
    <div class="sr-orbit"><svg class="sr-sputnik" viewBox="0 0 44 44"><g stroke="#e3362f" stroke-width="1.6" fill="none"><path d="M22 22 2 5M22 22 7 2M22 22 2 39M22 22 7 42"/></g><circle cx="22" cy="22" r="9" fill="#84d1d7" stroke="#0a171e" stroke-width="1.6"/></svg></div>
    <div class="sr-wedge"><i class="sr-tri"></i><div class="sr-word"><span></span></div></div>`;
  document.body.prepend(stage);
  const wordEl = $('.sr-word span', stage);

  // Title strips, a slogan, and the megaphone's horn
  const title = $('.hero-title');
  if (title) {
    const words = title.textContent.trim().split(/\s+/);
    title.setAttribute('aria-label', words.join(' '));
    title.innerHTML = words.map((w, i) => `<span class="sr-t sr-t${i + 1}" aria-hidden="true">${w}</span>`).join('');
  }
  $('.hero-text')?.insertAdjacentHTML('beforeend', '<span class="sr-slogan" aria-hidden="true">Вперёд, к звёздам!</span>');
  $('.toc')?.insertAdjacentHTML('afterbegin', '<i class="sr-horn" aria-hidden="true"></i>');

  // Cut-paper figures for the six core elements
  const figs = [
    '<i style="left:0;top:0;width:100%;height:100%;background:#cf1510;clip-path:polygon(0 8%,100% 62%,0 96%)"></i><i style="right:6%;top:12%;width:92px;height:92px;border-radius:50%;background:#fbf2d9;clip-path:circle(50%);z-index:-1"></i>',
    '<i style="left:0;bottom:0;width:33.3%;height:100%;background:#cf1510"></i><i style="left:33.3%;bottom:0;width:33.3%;height:100%;background:#000;box-shadow:inset 0 0 0 2px #fbf2d9"></i><i style="left:66.6%;bottom:0;width:33.4%;height:100%;background:#fbf2d9"></i>',
    '<i style="left:4%;bottom:0;width:16%;height:96%;background:#fbf2d9"></i><i style="left:24%;bottom:0;width:16%;height:72%;background:#cf1510"></i><i style="left:44%;bottom:0;width:16%;height:50%;background:#fbf2d9"></i><i style="left:64%;bottom:0;width:16%;height:30%;background:#cf1510"></i><i style="left:84%;bottom:0;width:12%;height:14%;background:#fbf2d9"></i>',
    '<i style="left:8%;top:6%;width:102px;height:102px;background:#cf1510;clip-path:polygon(50% 0,62% 36%,100% 38%,69% 60%,80% 96%,50% 75%,20% 96%,31% 60%,0 38%,38% 36%)"></i><i style="left:44%;top:-40%;width:6px;height:180%;background:#fbf2d9;transform:rotate(34deg)"></i>',
    '<i style="left:50%;top:50%;width:150px;height:44px;margin:-22px 0 0 -75px;border:5px solid #fbf2d9;border-radius:50%;transform:rotate(-18deg)"></i><i style="left:50%;top:50%;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:50%;background:#cf1510"></i><i style="left:calc(50% + 62px);top:20%;width:12px;height:12px;border-radius:50%;background:#84d1d7"></i>',
    '<i style="left:0;top:0;width:100%;height:100%;background:#fbf2d9;clip-path:polygon(0 100%,100% 0,100% 100%)"></i><i style="left:6%;top:8%;width:62px;height:62px;border-radius:50%;background:#cf1510"></i><i style="left:58%;top:56%;width:34%;height:8px;background:#000;transform:rotate(-20deg)"></i>',
  ];
  $$('.core-item').forEach((item, i) => {
    const f = document.createElement('span');
    f.className = 'sr-fig';
    f.setAttribute('aria-hidden', 'true');
    f.innerHTML = figs[i % figs.length];
    item.prepend(f);
  });

  // The Shukhov radio tower beside the track list. It transmits while music plays.
  const tracksEl = $('.tracks');
  let towerEl = null;
  if (tracksEl) {
    const cx = 110;
    let s = '';
    const secs = [[96, 62, 620, 500], [62, 46, 500, 400], [46, 34, 400, 310], [34, 25, 310, 230], [25, 18, 230, 160], [18, 12, 160, 100]];
    secs.forEach(([r0, r1, y0, y1]) => {
      const N = 18;
      for (let i = 0; i < N; i += 1) {
        const a = (i / N) * Math.PI * 2;
        const tw = Math.PI * 0.62;
        s += `<path class="s" d="M${(cx + r0 * Math.cos(a)).toFixed(1)} ${y0}L${(cx + r1 * Math.cos(a + tw)).toFixed(1)} ${y1}M${(cx + r0 * Math.cos(a)).toFixed(1)} ${y0}L${(cx + r1 * Math.cos(a - tw)).toFixed(1)} ${y1}"/>`;
      }
      [[r0, y0], [r1, y1]].forEach(([r, y]) => { s += `<ellipse class="r" cx="${cx}" cy="${y}" rx="${r}" ry="${(r * 0.1).toFixed(1)}"/>`; });
    });
    s += `<path class="r" d="M${cx} 100V52"/><circle cx="${cx}" cy="48" r="5" fill="#e3362f"/>`;
    [20, 36, 52, 68].forEach((r, n) => { s += `<path class="w" style="--n:${n}" d="M${cx - r} ${48 - r * 0.3}A${r} ${r} 0 0 1 ${cx + r} ${48 - r * 0.3}"/>`; });
    tracksEl.insertAdjacentHTML('beforebegin', `<svg class="sr-tower" viewBox="0 -30 220 660" aria-hidden="true">${s}</svg>`);
    towerEl = $('.sr-tower');
    $$('.track-btn').forEach((b) => b.addEventListener('click', () => towerEl.classList.add('on')));
    $('[data-player-close]')?.addEventListener('click', () => towerEl.classList.remove('on'));
  }

  // The plan's progress, in the site bar
  const here = $('.atlas-here');
  let planEl = null;
  if (here) {
    planEl = document.createElement('span');
    planEl.className = 'sr-plan';
    planEl.setAttribute('aria-hidden', 'true');
    here.after(planEl);
  }

  // The wedge rests on the side of the page away from each panel, and swings across as the next panel arrives.
  const sections = $$('main .sec');
  const words = { feel: 'Ощущение', core: 'Основы', how: 'Метод', palette: 'Палитра', vibe: 'Звук', refs: 'Архив', related: 'Далее' };
  let tops = [];
  const measure = () => { tops = sections.map((s) => s.getBoundingClientRect().top + scrollY); };
  const smooth = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
  const START = -16;
  let ticking = false;
  const paint = () => {
    ticking = false;
    const y = scrollY;
    const vh = innerHeight;
    const max = Math.max(1, root.scrollHeight - vh);
    const pct = Math.min(100, Math.round((y / max) * 100));
    root.style.setProperty('--plan', `${pct}%`);
    if (planEl) planEl.textContent = pct >= 100 ? 'Plan fulfilled ahead of schedule!' : `Plan fulfilled: ${pct}%`;
    let a = START;
    let current = -1;
    tops.forEach((top, i) => {
      const start = top - vh * 0.85;
      const k = smooth((y - start) / (vh * 0.75));
      a += i === 0 ? -START * k : 180 * k;
      if (y > top - vh * 0.5) current = i;
    });
    if (!calm()) root.style.setProperty('--a', `${a.toFixed(2)}deg`);
    const text = current >= 0 ? words[sections[current].id] || '' : '';
    if (wordEl.textContent !== text) wordEl.textContent = text;
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { measure(); request(); });
  addEventListener('load', () => { measure(); request(); });
  document.fonts?.ready.then(() => { measure(); request(); });
  addEventListener('eas:calm', () => {
    if (calm()) root.style.setProperty('--a', `${START}deg`);
    request();
  });
  measure();
  paint();

  // Copying the brief earns the approval stamp
  const copy = $('[data-copy-brief]');
  if (copy) {
    copy.addEventListener('click', () => {
      $('.sr-approved')?.remove();
      copy.closest('.brief').insertAdjacentHTML('beforeend', '<span class="sr-approved" aria-hidden="true">УТВЕРЖДЕНО</span>');
    });
  }
})();
