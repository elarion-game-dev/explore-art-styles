// Flash Cartoon: a 2004 portal page with a Flash movie in its hero.
// Under the four pictures sits the portal's movie page: a header with the movie's title and the star vote, the timeline
// above a centred stage, and the Library and the author's comments below it. The stage opens on a preloader the first
// time it comes into view, counting what is still loading, then plays a vector puppet whose parts are tweened between
// keyframes (motion tweens on the joints, a shape tween on the mouth). The timeline scrubs; onion skin and an ease switch
// show the spacing; pick a part in the Library to see its bounding box and the pivot it turns on. The contents become
// frame labels on a timeline whose playhead follows the section you are reading.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const isCalm = () => root.dataset.calm === '1';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };
  const hero = $('.hero');
  if (!hero) return;

  // ---------- The puppet: one rig, drawn as separate parts that turn on their joints ----------
  const LINE = '#140f1a';
  const C = { skin: '#ffd3a8', skinS: '#efa877', shirt: '#dc3d3c', shirtS: '#a8272b', pants: '#4072d8', pantsS: '#2c519f', shoe: '#f7ea43', shoeS: '#ef9001', hair: '#3a2418', mouth: '#7a1626' };
  // A limb is a fat black line under a thinner coloured one, so its outline is drawn the way a brush would ink it.
  const limb = (x1, y1, x2, y2, col, w = 9) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${LINE}" stroke-width="${w + 7}" stroke-linecap="round"/><path d="M${x1} ${y1}L${x2} ${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  // The heavier ink on the lower right: a black copy of the shape, nudged down and right, under the shape itself.
  const inked = (d, fill, extra = '') => `<path d="${d}" fill="${LINE}" stroke="${LINE}" stroke-width="6" stroke-linejoin="round" transform="translate(2.2 3)"/><path d="${d}" fill="${fill}" stroke="${LINE}" stroke-width="4" stroke-linejoin="round"${extra}/>`;
  const MOUTH = { smile: [-20, 210, 0, 232, 20, 210, 0, 218], oh: [-8, 211, 0, 230, 8, 211, 0, 197], grin: [-25, 205, 0, 254, 25, 205, 0, 214] };
  const mouthD = (m) => `M${m[0].toFixed(1)} ${m[1].toFixed(1)}Q${m[2].toFixed(1)} ${m[3].toFixed(1)} ${m[4].toFixed(1)} ${m[5].toFixed(1)}Q${m[6].toFixed(1)} ${m[7].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}Z`;
  const TORSO = 'M-27 242C-20 235 20 235 27 242L31 292C12 300-12 300-31 292Z';
  const HAIR = 'M-44 168L-38 132L-20 150L-6 116L10 146L30 124L34 152L46 160Q2 132-44 168Z';
  const leg = (s) => `<g class="p-leg${s < 0 ? 'L' : 'R'}" data-part="leg${s < 0 ? 'L' : 'R'}">${limb(13 * s, 288, 14 * s, 320, C.pants, 13)}<ellipse cx="${20 * s}" cy="327" rx="16" ry="8.5" fill="${C.shoe}" stroke="${LINE}" stroke-width="4"/><path d="M${8 * s} 331Q${20 * s} 337 ${33 * s} 330" fill="none" stroke="${C.shoeS}" stroke-width="3.5" stroke-linecap="round"/></g>`;
  const arm = (s, name) => `<g class="p-arm${name}" data-part="arm${name}">${limb(27 * s, 250, 28 * s, 272, C.shirt, 12)}<g class="p-fore${name}" data-part="fore${name}">${limb(28 * s, 272, 28 * s, 294, C.skin, 8)}<circle cx="${28 * s}" cy="301" r="9.5" fill="${C.skin}" stroke="${LINE}" stroke-width="4"/></g></g>`;
  const puppet = (cls) => `<g class="fc-pup ${cls}" transform="translate(275 0)">
    <ellipse class="p-shadow" cx="0" cy="335" rx="52" ry="9" fill="#2f7a2a"/>
    <g class="p-body" data-part="body">
      ${leg(-1)}${leg(1)}
      ${arm(-1, 'B')}
      <g class="p-torso" data-part="torso">${inked(TORSO, C.shirt)}<path d="M12 240L30 243L33 291Q22 296 13 297Z" fill="${C.shirtS}"/><path d="${TORSO}" fill="none" stroke="${LINE}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M-31 281L31 281L31 292C12 300-12 300-31 292Z" fill="${C.pants}" stroke="${LINE}" stroke-width="4" stroke-linejoin="round"/></g>
      <g class="p-head" data-part="head">
        <circle cx="2.2" cy="193" r="56" fill="${LINE}"/>
        <circle cx="0" cy="190" r="54" fill="${C.skin}"/>
        <path d="M44 162A54 54 0 0 1-30 235A60 60 0 0 0 44 162Z" fill="${C.skinS}"/>
        <circle cx="0" cy="190" r="54" fill="none" stroke="${LINE}" stroke-width="4"/>
        ${inked(HAIR, C.hair)}
        <path d="M-31 168L-9 163M9 163L31 168" stroke="${LINE}" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="-18" cy="187" rx="13" ry="16" fill="#fff" stroke="${LINE}" stroke-width="3.5"/><ellipse cx="18" cy="187" rx="13" ry="16" fill="#fff" stroke="${LINE}" stroke-width="3.5"/>
        <circle cx="-14" cy="191" r="6" fill="${LINE}"/><circle cx="22" cy="191" r="6" fill="${LINE}"/>
        <path class="p-mouth" data-part="mouth" d="${mouthD(MOUTH.smile)}" fill="${C.mouth}" stroke="${LINE}" stroke-width="3.5" stroke-linejoin="round"/>
      </g>
      ${arm(1, 'F')}
    </g>
  </g>`;

  const BG = `<g class="fc-bg">
    <rect width="550" height="400" fill="#8ad8f8"/>
    <circle cx="454" cy="89" r="44" fill="${LINE}"/><circle cx="452" cy="86" r="42" fill="#f7ea43"/>
    <path d="M482 56A42 42 0 0 1 430 122A46 46 0 0 0 482 56Z" fill="#ef9001"/><circle cx="452" cy="86" r="42" fill="none" stroke="${LINE}" stroke-width="4"/>
    ${inked('M64 104Q60 78 88 80Q96 56 124 66Q146 50 162 74Q190 72 186 98Q186 112 166 112L80 112Q62 112 64 104Z', '#fff')}
    <path d="M150 104Q172 106 180 96" fill="none" stroke="#c9e9f6" stroke-width="5" stroke-linecap="round"/>
    ${inked('M-10 262Q86 196 186 246Q290 298 382 226Q470 166 560 236L560 410L-10 410Z', '#9ad45f')}
    ${inked('M-10 318Q140 298 275 320Q420 342 560 310L560 410L-10 410Z', '#4faa42')}
    <path d="M-10 372Q150 352 290 376Q430 396 560 366L560 410L-10 410Z" fill="#3c8f34"/>
    <path d="M86 330l6-14 6 14M98 331l5-11 5 11M444 340l6-14 6 14M456 341l5-11 5 11" fill="none" stroke="${LINE}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;

  // ---------- Keyframes: what the animator posed. Everything between is tweened. ----------
  const K = [1, 7, 13, 19, 24];
  const KL = [1, 10, 13, 16, 24];
  const T = {
    bodyY: [K, [0, 0, -58, 0, 0]], bodyR: [K, [0, -5, 6, -3, 0]], shadow: [K, [1, 1, 0.55, 1, 1]],
    head: [K, [0, -10, 12, -6, 0]],
    armF: [K, [-12, 30, -112, -60, -12]], foreF: [K, [-8, -24, -48, 44, -8]],
    armB: [K, [12, -24, 108, 30, 12]], foreB: [K, [8, 18, 46, -12, 8]],
    legL: [KL, [0, 0, 28, 0, 0]], legR: [KL, [0, 0, -24, 0, 0]],
    mouth: [[1, 7, 13, 24], [MOUTH.smile, MOUTH.oh, MOUTH.grin, MOUTH.smile]],
  };
  const LAYERS = [
    { name: 'mouth', tracks: ['mouth'], tween: 'shape' },
    { name: 'head', tracks: ['head'], tween: 'motion' },
    { name: 'arm front', tracks: ['armF', 'foreF'], tween: 'motion' },
    { name: 'body', tracks: ['bodyY', 'bodyR', 'shadow'], tween: 'motion' },
    { name: 'arm back', tracks: ['armB', 'foreB'], tween: 'motion' },
    { name: 'legs', tracks: ['legL', 'legR'], tween: 'motion' },
    { name: 'background', tracks: [], tween: 'static' },
  ];
  const FRAMES = 24;
  const FPS = 12;
  let easeOn = false;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
  const mix = (a, b, t) => (Array.isArray(a) ? a.map((x, i) => x + (b[i] - x) * t) : a + (b - a) * t);
  function sample(name, f) {
    const [keys, vals] = T[name];
    if (f <= keys[0]) return vals[0];
    for (let i = 0; i < keys.length - 1; i++) {
      if (f <= keys[i + 1]) {
        let t = (f - keys[i]) / (keys[i + 1] - keys[i]);
        if (easeOn) t = ease(t);
        return mix(vals[i], vals[i + 1], t);
      }
    }
    return vals[vals.length - 1];
  }

  // ---------- The movie window ----------
  const movie = document.createElement('section');
  movie.className = 'fc-movie';
  movie.setAttribute('aria-label', 'Flash stage: a puppet tweened between keyframes');
  const layerRows = LAYERS.map((L, li) => {
    const keys = L.tracks.length ? T[L.tracks[0]][0] : [1];
    let cells = '';
    for (let f = 1; f <= FRAMES; f++) cells += `<i class="${f % 5 === 0 ? 'c5' : ''}" style="grid-column:${f}"></i>`;
    let marks = '';
    if (L.tween === 'static') {
      marks += `<b class="fc-span fc-static" style="grid-column:1 / ${FRAMES + 1}"></b><b class="fc-key" style="grid-column:1"></b><b class="fc-end" style="grid-column:${FRAMES}"></b>`;
    } else {
      for (let i = 0; i < keys.length - 1; i++) marks += `<b class="fc-span fc-${L.tween}" style="grid-column:${keys[i]} / ${keys[i + 1] + 1};--n:${keys[i + 1] - keys[i] + 1}"></b>`;
      for (const k of keys) marks += `<b class="fc-key" style="grid-column:${k}"></b>`;
    }
    return { name: L.name, html: `<div class="fc-row" data-layer="${li}">${cells}${marks}</div>` };
  });
  let ruler = '';
  for (let f = 1; f <= FRAMES; f++) ruler += `<span style="grid-column:${f}">${f === 1 || f % 5 === 0 ? f : ''}</span>`;
  movie.innerHTML = `
    <div class="fc-portal">
      <p class="fc-badge">Movie</p>
      <div class="fc-mhead">
        <h2 class="fc-mtitle">Kid Jump!</h2>
        <p class="fc-by">A tween test: ${FRAMES} frames at ${FPS} fps on a 550 × 400 stage</p>
      </div>
      <div class="fc-vote" role="group" aria-label="Vote on this style">
        <span class="fc-vote-label">Vote</span>
        <span class="fc-stars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="fc-star" data-n="${n}" aria-label="${n} out of 5" aria-pressed="false"></button>`).join('')}</span>
        <span class="fc-vote-msg" aria-live="polite"></span>
      </div>
    </div>
    <div class="fc-tl">
      <div class="fc-names"><div class="fc-names-head" aria-hidden="true">Timeline</div>${layerRows.map((r, i) => `<div class="fc-name" data-layer="${i}"><i aria-hidden="true"></i>${r.name}</div>`).join('')}</div>
      <div class="fc-frames" role="slider" tabindex="0" aria-label="Frame. Drag or use the arrow keys to scrub the animation" aria-valuemin="1" aria-valuemax="${FRAMES}" aria-valuenow="1">
        <div class="fc-ruler" aria-hidden="true">${ruler}</div>
        ${layerRows.map((r) => r.html).join('')}
        <div class="fc-head" aria-hidden="true"><span class="fc-head-n">1</span></div>
      </div>
      <div class="fc-status">
        <button type="button" class="fc-btn fc-play" aria-pressed="false"><span class="fc-ico" aria-hidden="true"></span><span class="fc-play-label">Play</span></button>
        <button type="button" class="fc-btn fc-onion" aria-pressed="false"><span class="fc-ico" aria-hidden="true"></span>Onion skin</button>
        <button type="button" class="fc-btn fc-ease" aria-pressed="false"><span class="fc-ico" aria-hidden="true"></span>Ease in and out</button>
        <span class="fc-read" aria-live="off"><span>Frame</span><b class="fc-read-f">1</b><span class="fc-read-t">0.0 s</span></span>
      </div>
    </div>
    <div class="fc-stage">
      <div class="fc-screen">
        <svg viewBox="0 0 550 400" role="img" aria-label="A cartoon kid jumping and cheering, drawn in thick black outlines and flat colour">
          <defs><pattern id="fc-hatch" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="rgb(255 255 255 / .35)"/><rect width="2" height="2" fill="#140f1a"/></pattern></defs>
          ${BG}
          <g class="fc-ghosts" opacity=".17">${puppet('g-m2')}${puppet('g-p2')}</g>
          <g class="fc-ghosts" opacity=".32">${puppet('g-m1')}${puppet('g-p1')}</g>
          ${puppet('fc-main')}
        </svg>
      </div>
    </div>
    <div class="fc-under">
      <div class="fc-panel fc-lib">
        <h3 class="fc-panel-head">Library <span>6 items</span></h3>
        <ul class="fc-lib-list"></ul>
      </div>
      <div class="fc-panel fc-help">
        <h3 class="fc-panel-head">Author comments</h3>
        <p>Drag the red playhead along the timeline. The black dots are keyframes: the poses an animator draws. The violet spans are motion tweens and the green one is a shape tween, frames the computer fills in between. Pick a part in the Library to see the point it turns on.</p>
      </div>
    </div>`;
  // The movie sits under the four pictures, so they stay on the first screen.
  ($('.hero-gallery', hero) || $('.hero-text', hero)).after(movie);

  const svg = $('svg', movie);
  const frames = $('.fc-frames', movie);
  const readF = $('.fc-read-f', movie);
  const readT = $('.fc-read-t', movie);
  const headN = $('.fc-head-n', movie);
  const playBtn = $('.fc-play', movie);
  const onionBtn = $('.fc-onion', movie);
  const easeBtn = $('.fc-ease', movie);

  const instance = (g) => {
    const part = (n) => $(`[data-part="${n}"]`, g);
    return { g, body: part('body'), shadow: $('.p-shadow', g), head: part('head'), mouth: part('mouth'), armF: part('armF'), foreF: part('foreF'), armB: part('armB'), foreB: part('foreB'), legL: part('legL'), legR: part('legR') };
  };
  const main = instance($('.fc-main', svg));
  const ghosts = [['g-m2', -2], ['g-m1', -1], ['g-p1', 1], ['g-p2', 2]].map(([c, d]) => ({ ...instance($(`.${c}`, svg)), d }));
  let selMouth = null;

  function pose(p, f) {
    const v = (n) => sample(n, f);
    const sh = v('shadow');
    p.shadow.setAttribute('transform', `translate(0 335) scale(${sh.toFixed(3)} ${sh.toFixed(3)}) translate(0 -335)`);
    p.body.setAttribute('transform', `translate(0 ${v('bodyY').toFixed(2)}) rotate(${v('bodyR').toFixed(2)} 0 290)`);
    p.head.setAttribute('transform', `rotate(${v('head').toFixed(2)} 0 242)`);
    p.armF.setAttribute('transform', `rotate(${v('armF').toFixed(2)} 27 250)`);
    p.foreF.setAttribute('transform', `rotate(${v('foreF').toFixed(2)} 28 272)`);
    p.armB.setAttribute('transform', `rotate(${v('armB').toFixed(2)} -27 250)`);
    p.foreB.setAttribute('transform', `rotate(${v('foreB').toFixed(2)} -28 272)`);
    p.legL.setAttribute('transform', `rotate(${v('legL').toFixed(2)} -13 288)`);
    p.legR.setAttribute('transform', `rotate(${v('legR').toFixed(2)} 13 288)`);
    const d = mouthD(v('mouth'));
    p.mouth.setAttribute('d', d);
    if (p === main && selMouth) selMouth.setAttribute('d', d);
  }

  let frame = 1;
  let onion = false;
  let playing = false;
  // How many onion frames either side to keep drawing while the movie plays. Paused or scrubbing, all four show.
  // tick() lowers it when frames take too long on this device (2: both pairs, 1: the near pair, 0: none while playing).
  let detail = 2;
  // The slider's value is only kept up to date while paused: a screen reader would read out every frame of the movie.
  const sayFrame = (f) => {
    frames.setAttribute('aria-valuenow', f);
    frames.setAttribute('aria-valuetext', `Frame ${f} of ${FRAMES}`);
  };
  function show(f) {
    frame = f;
    pose(main, f);
    // A ghost before frame 1 or after the last frame takes the end pose, so it hides exactly under the puppet: nothing
    // switches on and off as the movie loops. Ghosts beyond what this device can afford while playing are hidden with
    // the visibility attribute, which costs a repaint only.
    if (onion) for (const g of ghosts) {
      const on = !playing || Math.abs(g.d) <= detail;
      if (g.on !== on) { g.g.setAttribute('visibility', on ? 'visible' : 'hidden'); g.on = on; }
      if (on) pose(g, Math.min(FRAMES, Math.max(1, f + g.d)));
    }
    frames.style.setProperty('--f', f);
    if (!playing) sayFrame(f);
    headN.textContent = f;
    readF.textContent = f;
    readT.textContent = `${((f - 1) / FPS).toFixed(1)} s`;
  }
  movie.style.setProperty('--frames', FRAMES);

  // ---------- Playback at 12 frames a second, only while the stage is on screen ----------
  let userPaused = false;
  let onScreen = true;
  let raf = 0;
  let last = 0;
  let acc = 0;
  const STEP = 1000 / FPS;
  // The movie checks its own cost: the script time of each drawn frame, and the gap to the next animation frame, which
  // includes the browser's style and paint work for it. If a loop of 24 drawn frames has three or more slow ones, or
  // the script time stays high, it draws one pair of onion frames fewer while playing.
  let drewAt = 0;
  let jsCost = 0;
  let drawnN = 0;
  let slowN = 0;
  function tick(t) {
    raf = 0;
    if (!playing || !onScreen || document.hidden) { last = 0; drewAt = 0; return; }
    if (drewAt) {
      const gap = t - drewAt;
      drewAt = 0;
      if (onion && detail > 0) {
        drawnN += 1;
        if (gap > 45) slowN += 1;
        if (slowN >= 3 || (drawnN >= 6 && jsCost > 8)) { detail -= 1; drawnN = 0; slowN = 0; jsCost = 0; }
        else if (drawnN >= FRAMES) { drawnN = 0; slowN = 0; }
      }
    }
    if (!last) last = t;
    acc += Math.min(t - last, 250);
    last = t;
    if (acc >= STEP) {
      const n = Math.floor(acc / STEP);
      acc -= n * STEP;
      const t0 = performance.now();
      show(((frame - 1 + n) % FRAMES) + 1);
      jsCost = jsCost * 0.75 + (performance.now() - t0) * 0.25;
      drewAt = t;
    }
    raf = requestAnimationFrame(tick);
  }
  const kick = () => { if (playing && onScreen && !document.hidden && !raf) { last = 0; raf = requestAnimationFrame(tick); } };
  function setPlaying(on) {
    playing = on;
    playBtn.setAttribute('aria-pressed', String(on));
    $('.fc-play-label', playBtn).textContent = on ? 'Pause' : 'Play';
    movie.classList.toggle('is-playing', on);
    if (on) kick(); else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (!on && onion) show(frame); // paused: every onion frame shows again
    if (on) frames.setAttribute('aria-valuetext', 'Playing'); else sayFrame(frame);
  }
  playBtn.addEventListener('click', () => { userPaused = playing; setPlaying(!playing); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { onScreen = es[es.length - 1].isIntersecting; kick(); }, { threshold: 0.1 }).observe($('.fc-stage', movie));
  }
  document.addEventListener('visibilitychange', kick);

  onionBtn.addEventListener('click', () => {
    onion = !onion;
    onionBtn.setAttribute('aria-pressed', String(onion));
    movie.classList.toggle('is-onion', onion); // the two ghost layers are display: none while it is off
    show(frame);
  });
  easeBtn.addEventListener('click', () => {
    easeOn = !easeOn;
    easeBtn.setAttribute('aria-pressed', String(easeOn));
    show(frame);
  });
  for (const g of ghosts) { g.g.setAttribute('visibility', 'hidden'); g.on = false; }

  // ---------- Scrubbing: drag across the frames, or use the arrow keys ----------
  let box = null;
  const frameAt = (x) => Math.min(FRAMES, Math.max(1, Math.floor(((x - box.left) / box.width) * FRAMES) + 1));
  frames.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    box = frames.getBoundingClientRect();
    frames.setPointerCapture(e.pointerId);
    if (playing) { userPaused = true; setPlaying(false); }
    show(frameAt(e.clientX));
    movie.classList.add('is-scrubbing');
  });
  frames.addEventListener('pointermove', (e) => { if (box && frames.hasPointerCapture(e.pointerId)) { const f = frameAt(e.clientX); if (f !== frame) show(f); } });
  const endDrag = () => { box = null; movie.classList.remove('is-scrubbing'); };
  frames.addEventListener('pointerup', endDrag);
  frames.addEventListener('pointercancel', endDrag);
  frames.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
    let f = null;
    if (step) f = Math.min(FRAMES, Math.max(1, frame + step));
    if (e.key === 'Home') f = 1;
    if (e.key === 'End') f = FRAMES;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); playBtn.click(); return; }
    if (f === null) return;
    e.preventDefault();
    e.stopPropagation(); // the page's own arrow keys move between styles
    if (playing) { userPaused = true; setPlaying(false); }
    show(f);
  });

  // ---------- Library: pick a part to see its bounding box and the point it turns on ----------
  const NS = 'http://www.w3.org/2000/svg';
  const LIB = [
    { name: 'head', kind: 'Graphic', layer: 1, host: main.head, pivot: [0, 242] },
    { name: 'mouth', kind: 'Shape', layer: 0, host: main.head, shape: true },
    { name: 'torso', kind: 'Graphic', layer: 3, host: main.body, target: $('[data-part="torso"]', main.g), pivot: [0, 290] },
    { name: 'upper arm', kind: 'Graphic', layer: 2, host: main.armF, target: $(':scope > path:nth-child(2)', main.armF), pivot: [27, 250] },
    { name: 'forearm', kind: 'Graphic', layer: 2, host: main.foreF, pivot: [28, 272] },
    { name: 'leg', kind: 'Graphic', layer: 5, host: main.legR, pivot: [13, 288] },
  ];
  const list = $('.fc-lib-list', movie);
  list.innerHTML = LIB.map((it, i) => `<li><button type="button" class="fc-lib-item" data-i="${i}" aria-pressed="false"><i class="fc-sym ${it.shape ? 'is-shape' : ''}" aria-hidden="true"></i><span>${it.name}</span><small>${it.kind}</small></button></li>`).join('');
  let selected = -1;
  let overlay = null;
  const el = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
  function select(i) {
    overlay?.remove();
    overlay = null;
    selMouth = null;
    $$('.fc-lib-item', list).forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
    $$('[data-layer]', movie).forEach((r) => r.classList.toggle('is-sel', i >= 0 && +r.dataset.layer === LIB[i].layer));
    selected = i;
    if (i < 0) return;
    const it = LIB[i];
    overlay = el('g', { class: 'fc-sel' });
    if (it.shape) {
      // A raw shape has no box: when selected it shows the dotted screen drawn over its fill.
      selMouth = el('path', { d: main.mouth.getAttribute('d'), fill: 'url(#fc-hatch)' });
      overlay.append(selMouth);
    } else {
      const b = (it.target || it.host).getBBox();
      const pad = 12;
      const x = b.x - pad, y = b.y - pad, w = b.width + pad * 2, h = b.height + pad * 2;
      overlay.append(el('rect', { x, y, width: w, height: h, fill: 'none', stroke: '#140f1a', 'stroke-width': 2 }));
      for (const [hx, hy] of [[0, 0], [0.5, 0], [1, 0], [0, 0.5], [1, 0.5], [0, 1], [0.5, 1], [1, 1]]) {
        overlay.append(el('rect', { x: x + w * hx - 4, y: y + h * hy - 4, width: 8, height: 8, fill: '#fff', stroke: '#140f1a', 'stroke-width': 2 }));
      }
      overlay.append(el('circle', { cx: it.pivot[0], cy: it.pivot[1], r: 6.5, fill: '#fff', stroke: '#140f1a', 'stroke-width': 2.5 }));
      overlay.append(el('circle', { cx: it.pivot[0], cy: it.pivot[1], r: 1.8, fill: '#140f1a' }));
    }
    it.host.append(overlay);
  }
  // Parts can be picked on the stage too.
  const PICK = { head: 0, mouth: 1, torso: 2, armF: 3, foreF: 4, legR: 5 };
  main.g.addEventListener('click', (e) => {
    const i = PICK[e.target.closest('[data-part]')?.dataset.part];
    if (i !== undefined) select(i === selected ? -1 : i);
  });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('.fc-lib-item');
    if (!b) return;
    const i = +b.dataset.i;
    select(i === selected ? -1 : i);
  });

  // ---------- The vote: the portal's five stars, kept in this browser only ----------
  const stars = $$('.fc-star', movie);
  const msg = $('.fc-vote-msg', movie);
  const paintVote = (n) => stars.forEach((s) => { const on = +s.dataset.n <= n; s.classList.toggle('on', on); s.setAttribute('aria-pressed', String(+s.dataset.n === n)); });
  const saved = +(store.get('eas-fc-vote') || 0);
  if (saved >= 1 && saved <= 5) { paintVote(saved); msg.textContent = `You voted ${saved}/5`; }
  stars.forEach((s) => s.addEventListener('click', () => {
    const n = +s.dataset.n;
    store.set('eas-fc-vote', String(n));
    paintVote(n);
    msg.textContent = `Thanks for voting! ${n}/5`;
  }));

  // ---------- The preloader: counts the page really loading, then hands over to the movie ----------
  const stage = $('.fc-stage', movie);
  let started = false; // the preloader has handed over, or calm mode skipped it
  function startMovie() {
    started = true;
    if (!isCalm() && !userPaused) setPlaying(true);
  }
  function preload() {
    const loader = document.createElement('div');
    loader.className = 'fc-loader';
    loader.innerHTML = '<p class="fc-loading">Loading<span>.</span><span>.</span><span>.</span></p><div class="fc-meter" aria-hidden="true"><div class="fc-meter-in"></div></div><p class="fc-pct" aria-hidden="true">0%</p><button type="button" class="fc-bigplay" hidden>Play</button>';
    $('.fc-screen', stage).append(loader);
    const fill = $('.fc-meter-in', loader);
    const pct = $('.fc-pct', loader);
    const big = $('.fc-bigplay', loader);
    // What the first screen needs: the first two pictures, the fonts and the page itself.
    const jobs = $$('.hero-gallery img', hero).slice(0, 2).map((img) => (img.complete ? Promise.resolve() : new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); })));
    jobs.push(document.fonts ? document.fonts.ready : Promise.resolve());
    jobs.push(document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => addEventListener('load', r, { once: true })));
    let done = 0;
    jobs.forEach((j) => j.then(() => { done++; }));
    const t0 = performance.now();
    const MIN = 1300;
    const MAX = 6000;
    let shown = 0;
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      loader.classList.add('is-out');
      setTimeout(() => loader.remove(), isCalm() ? 0 : 420);
      startMovie();
    };
    const step = (t) => {
      if (closed) return;
      const real = performance.now() - t0 > MAX ? 1 : done / jobs.length;
      const cap = Math.min(1, (t - t0) / MIN);
      shown = Math.min(cap, shown + Math.max(0.012, (real - shown) * 0.12), real);
      fill.style.transform = `scaleX(${shown.toFixed(3)})`;
      pct.textContent = `${Math.round(shown * 100)}%`;
      if (shown >= 1) {
        loader.classList.add('is-done');
        big.hidden = false;
        big.addEventListener('click', close);
        setTimeout(close, 1400);
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    addEventListener('eas:calm', () => { if (isCalm()) close(); });
  }

  // The preloader runs the first time the stage comes into view, so it is seen, and counts what is still loading then.
  show(1);
  const firstView = (fn) => {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); } }, { threshold: 0.35 });
    io.observe($('.fc-screen', stage));
  };
  if (isCalm()) { show(13); started = true; }
  else firstView(() => { if (isCalm()) { show(13); started = true; } else preload(); });

  addEventListener('eas:calm', (e) => {
    if (e.detail?.calm) { setPlaying(false); }
    else if (!userPaused && started && !$('.fc-loader', stage)) setPlaying(true);
  });

  // ---------- Contents: frame labels on a timeline, with the playhead on the section in view ----------
  const toc = $('.toc');
  if (toc && 'IntersectionObserver' in window) {
    const links = new Map($$('a', toc).map((a) => [a.getAttribute('href').slice(1), a.parentElement]));
    let here = null;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const li = links.get(e.target.id);
        if (li && li !== here) { here?.classList.remove('is-here'); li.classList.add('is-here'); here = li; }
      }
    }, { rootMargin: '-40% 0px -55% 0px' });
    for (const id of links.keys()) { const s = document.getElementById(id); if (s) io.observe(s); }
  }

  // The sunburst behind the title card ends in an inked hill line just under the movie. Measured once, and again
  // when fonts arrive or the window changes size.
  const burst = () => document.body.style.setProperty('--burst-h', `${Math.round(hero.getBoundingClientRect().bottom + scrollY + 4)}px`);
  burst();
  document.fonts?.ready.then(burst);
  addEventListener('load', burst);
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(burst, 150); });

  // Very wide library art gets a whole row of the reference wall. Read from the width and height the page already states.
  for (const img of $$('.ref-gallery .shot img')) {
    const w = +img.getAttribute('width');
    const h = +img.getAttribute('height');
    if (w && h && w / h > 2.4) img.closest('.shot').classList.add('is-wide');
  }
  // In two columns an odd count of ordinary pictures leaves a hole after the last one, so that one takes the whole row.
  const plain = $$('.ref-gallery .shot').filter((s) => !s.classList.contains('is-wide'));
  if (plain.length % 2) plain[plain.length - 1].classList.add('is-odd-last');
})();
