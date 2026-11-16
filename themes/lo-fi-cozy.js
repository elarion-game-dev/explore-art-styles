// Lo-Fi Cozy: a desk by a rainy window at night. This script builds the room beside the page (on a phone, above it):
// a window onto a city where rain runs down the glass, a sill with a sleeping cat and a plant, and a desk with a mug,
// a radio and a lamp. The rain is drawn on canvas after Lucas Bebber's method: many small drops that sit still and a few
// big ones that grow, run, merge, leave trails and wipe the small ones from their path, each showing the view behind
// it upside down. The lamp switches the page between warm lamplight and the blue of the night, the radio plays the
// music section (which is itself a radio with a dial), and on a wide screen the city goes from dusk to night as you
// scroll, with lights coming on in other windows.
(() => {
  const root = document.documentElement;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const calm = () => root.dataset.calm === '1';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };
  const hero = $('.hero');
  if (!hero) return;

  // ---- Lamp state, before anything paints ----
  const LAMP = 'eas-lofi-lamp';
  const lampOn = () => root.dataset.lamp !== 'off';
  if (store.get(LAMP) === 'off') root.dataset.lamp = 'off';

  // ---- The room ----
  const LIGHTS = [4, 15, 27, 39, 51, 63, 75, 87, 97];
  const sag = (x) => { const u = (x % 50) / 50; return 4 + 26 * 4 * u * (1 - u); }; // two loops of wire, in % of the strip
  const room = document.createElement('div');
  room.className = 'lc-room';
  room.innerHTML = `
  <div class="lc-wall" aria-hidden="true"></div>
  <div class="lc-scene">
  <div class="lc-window" aria-hidden="true">
    <div class="lc-glass"><canvas class="lc-view"></canvas><canvas class="lc-rain"></canvas></div>
    <div class="lc-bars"></div>
    <div class="lc-curtain"></div>
    <div class="lc-string"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 4Q25 56 50 4Q75 56 100 4" vector-effect="non-scaling-stroke"/></svg>${LIGHTS.map((x, i) => `<i style="left:${x}%;top:${sag(x).toFixed(1)}%;--d:${(-i * 1.7).toFixed(1)}s"></i>`).join('')}</div>
  </div>
  <div class="lc-sill" aria-hidden="true">
    <svg class="lc-plant" viewBox="0 0 90 120">
      <path class="lc-vine" d="M26 70C14 78 10 92 14 106C16 112 13 117 9 119"/>
      <g class="lc-leaves">
        <path d="M14 104c-8 2-12 8-10 14 6 0 11-5 10-14z"/><path d="M12 88c-9-1-14 4-14 10 6 2 12-2 14-10z"/>
        <path d="M45 18c-6 8-6 18 0 26 6-8 6-18 0-26z"/><path d="M30 26c-9 3-12 12-9 21 8-2 12-11 9-21z"/>
        <path d="M62 24c-9-1-15 7-15 16 9 1 15-6 15-16z"/><path d="M22 44c-10 0-16 7-15 15 9 2 15-5 15-15z"/>
        <path d="M70 42c-10-3-17 3-18 12 9 3 17-2 18-12z"/>
      </g>
      <g class="lc-leaves-2">
        <path d="M38 34c-7 5-8 14-3 21 6-5 8-14 3-21z"/><path d="M56 40c-8 1-12 8-11 15 8 0 12-7 11-15z"/>
        <path d="M33 56c-9-2-15 3-16 11 8 2 15-3 16-11z"/><path d="M60 58c-9-3-15 2-16 9 8 3 15-1 16-9z"/>
      </g>
      <path class="lc-pot" d="M24 70H66L61 120H29Z"/><path class="lc-pot-rim" d="M21 64H69V73H21Z"/><path class="lc-pot-hi" d="M30 75H35L32 116H30Z"/>
    </svg>
    <svg class="lc-cat" viewBox="0 0 130 120">
      <g class="lc-tail"><path d="M104 58C116 62 118 78 113 94C110 104 114 112 121 110"/></g>
      <g class="lc-catbody">
        <path class="lc-fur" d="M20 60C16 40 36 22 64 22C94 22 112 38 110 60Z"/>
        <path class="lc-fur-2" d="M12 60C10 46 18 36 30 35C44 34 52 44 50 60Z"/>
        <path class="lc-fur-2" d="M16 42L14 26L28 35Z"/><path class="lc-fur-2" d="M36 35L44 23L48 38Z"/>
        <path class="lc-ear" d="M18 39L17 30L24 35Z"/><path class="lc-ear" d="M39 35L43 28L45 37Z"/>
        <path class="lc-rim" d="M28 34C42 24 74 18 98 34"/><path class="lc-rim" d="M14 44C16 38 22 35 28 35"/>
        <path class="lc-eye" d="M22 48Q26 51 30 48"/><path class="lc-eye" d="M37 47Q40 50 43 47"/>
        <path class="lc-paw" d="M22 60C22 55 30 55 31 60Z"/>
      </g>
    </svg>
  </div>
  <div class="lc-desk">
    <svg class="lc-books" viewBox="0 0 110 54" aria-hidden="true">
      <rect x="6" y="40" width="96" height="14" rx="2" fill="#294e6a"/><rect x="6" y="44" width="96" height="2" fill="#3d6a8c"/>
      <rect x="12" y="27" width="84" height="13" rx="2" fill="#c45a4f"/><rect x="18" y="31" width="40" height="5" rx="1" fill="#f3d9b8" opacity=".8"/>
      <rect x="4" y="15" width="90" height="12" rx="2" fill="#d9b6e8"/><rect x="80" y="15" width="3" height="12" fill="#a67cbd"/>
      <rect x="16" y="5" width="70" height="10" rx="2" fill="#2f5d58"/><rect x="22" y="8" width="26" height="4" rx="1" fill="#e9dcc2" opacity=".7"/>
    </svg>
    <svg class="lc-mug" viewBox="0 0 54 86" aria-hidden="true">
      <g class="lc-steam"><path d="M17 34C11 26 23 20 17 8"/><path d="M27 32C21 24 33 18 27 4"/><path d="M37 34C31 26 43 20 37 10"/></g>
      <path d="M43 50C55 50 55 70 43 70" fill="none" stroke="#d9575a" stroke-width="5.5"/>
      <path d="M8 42H46V74Q46 84 36 84H18Q8 84 8 74Z" fill="#e8665f"/>
      <path d="M12 46H17V78H14Q12 78 12 76Z" fill="#f59a8e" opacity=".75"/>
      <ellipse cx="27" cy="42" rx="19" ry="4" fill="#f6b3a7"/><ellipse cx="27" cy="42.6" rx="16" ry="2.8" fill="#4a2a22"/>
    </svg>
    <button class="lc-radio-btn" type="button" aria-label="Play the radio">
      <svg viewBox="0 0 108 72" aria-hidden="true">
        <defs><pattern id="lc-grille" width="4.6" height="4.6" patternUnits="userSpaceOnUse"><circle cx="2.3" cy="2.3" r="1.2" fill="#0d2626"/></pattern></defs>
        <path d="M24 18Q54 -4 84 18" fill="none" stroke="#173b3b" stroke-width="4" stroke-linecap="round"/>
        <rect x="4" y="16" width="100" height="54" rx="10" fill="#1e4a4a"/><rect x="4" y="16" width="100" height="9" rx="4.5" fill="#2f6b66"/>
        <circle cx="30" cy="45" r="17" fill="#173b3b"/><circle cx="30" cy="45" r="15" fill="url(#lc-grille)"/>
        <rect x="56" y="30" width="40" height="18" rx="3" fill="#24170f"/>
        <text class="lc-clock" x="76" y="43.5" text-anchor="middle">--:--</text>
        <circle cx="62" cy="59" r="4.5" fill="#c27a4a"/><circle cx="90" cy="59" r="4.5" fill="#c27a4a"/>
        <circle class="lc-led" cx="76" cy="59" r="2.4"/>
      </svg>
      <span class="lc-tag">radio</span>
    </button>
    <button class="lc-lamp-btn" type="button" aria-pressed="true" aria-label="Desk lamp">
      <svg viewBox="0 0 150 180" aria-hidden="true">
        <defs><linearGradient id="lc-beam-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a8" stop-opacity=".55"/><stop offset="1" stop-color="#ffe2a8" stop-opacity="0"/></linearGradient></defs>
        <path class="lc-beam" d="M80 88L138 75L170 180H40Z"/>
        <ellipse cx="38" cy="172" rx="30" ry="6" fill="#3c2019"/>
        <path d="M10 172Q10 158 38 158Q66 158 66 172Z" fill="#8f4f35"/><path d="M18 164Q26 160 38 160" stroke="#c27a4a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M38 160L58 92L100 54" fill="none" stroke="#6e3a2a" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="58" cy="92" r="5.5" fill="#b8653f"/><circle cx="100" cy="54" r="5" fill="#b8653f"/>
        <g transform="rotate(-12 104 58)">
          <path d="M92 44H116L134 82H74Z" fill="#b8653f"/><path d="M92 44H100L84 82H74Z" fill="#d48356"/>
          <ellipse class="lc-bulb" cx="104" cy="82" rx="30" ry="6"/>
        </g>
      </svg>
      <span class="lc-tag">lamp</span>
    </button>
  </div>
  </div>`;
  hero.prepend(room);

  // ---- Lamp switch ----
  const lampBtn = $('.lc-lamp-btn', room);
  const paintLamp = () => {
    lampBtn.setAttribute('aria-pressed', String(lampOn()));
    lampBtn.title = lampOn() ? 'Switch the lamp off' : 'Switch the lamp on';
  };
  paintLamp();
  lampBtn.addEventListener('click', () => {
    if (lampOn()) root.dataset.lamp = 'off'; else delete root.dataset.lamp;
    store.set(LAMP, lampOn() ? 'on' : 'off');
    paintLamp();
    rain.lamp();
  });

  // ---- Clock on the radio: the visitor's own time ----
  const clock = $('.lc-clock', room);
  const tick = () => { const d = new Date(); clock.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  tick();
  setInterval(tick, 20000);

  // ---- The rain ----
  const rain = (() => {
    const glass = $('.lc-glass', room);
    const viewCv = $('.lc-view', room);
    const rainCv = $('.lc-rain', room);
    const vctx = viewCv.getContext('2d');
    const ctx = rainCv.getContext('2d');
    const sharp = document.createElement('canvas'); // the view, used inside the drops
    const sctx = sharp.getContext('2d');
    const tiny = document.createElement('canvas'); // a small copy that blurs the view behind the glass
    const tctx = tiny.getContext('2d');
    const dropletCv = document.createElement('canvas'); // the mist of small drops
    const dctx = dropletCv.getContext('2d');
    const QUALITY = [1, .78, .56];
    let quality = 0;
    let W = 0; let H = 0; let S = 1; let K = .25;
    let night = .45; let drawnNight = -1;
    let city = null;
    let drops = [];
    let dropletCount = 0;
    let shadeWarm; let shadeCool; let dot;

    // Sizes are worked in the units of Bebber's demo (radius 10 to 40) and drawn at K css px per unit.
    const O = { minR: 10, maxR: 40, rainChance: .5, dropletsRate: 16, dropletsSize: [3, 6.5], clean: .43, trailRate: 1, trailScale: [.2, .45], collision: .65, collisionInc: .01, boostMul: .05, boost: 1, maxDrops: 300 };
    const rand = (a = 1, b, f) => { if (b === undefined) { b = a; a = 0; } const n = Math.random(); return a + (f ? f(n) : n) * (b - a); };
    const chance = (p) => Math.random() <= p;
    let simW = 1; let simH = 1; let area = 1;

    const mix = (a, b, t) => {
      const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
      const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
      return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(' ')})`;
    };

    // A city of two rows of buildings, made once per size from a fixed seed so it is the same every visit.
    const makeCity = () => {
      let s = 1913;
      const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      const rows = [];
      for (const [layer, top0, top1, w0, w1, cw, ch, ww, wh] of [[0, .46, .66, .07, .15, 6, 8, 2.6, 3.6], [1, .58, .86, .12, .26, 10, 13, 5, 6.5]]) {
        let x = -10;
        while (x < W + 10) {
          const bw = W * (w0 + r() * (w1 - w0));
          const top = H * (top0 + r() * (top1 - top0));
          const wins = [];
          for (let y = top + ch * .9; y < H - ch; y += ch) {
            for (let wx = x + cw * .6; wx < x + bw - cw * .6; wx += cw) wins.push([wx, y, r(), r()]);
          }
          rows.push({ layer, x, w: bw, top, wins, ww, wh, roof: r(), mast: r() < .25 ? r() : 0 });
          x += bw + (layer ? 2 + r() * 10 : 1 + r() * 4);
        }
      }
      const bokeh = Array.from({ length: 9 }, () => [r() * W, H * (.9 + r() * .12), 10 + r() * 22, r()]);
      return { rows, bokeh };
    };

    const drawView = () => {
      if (!W) return;
      const n = night;
      const c = sctx;
      c.setTransform(sharp.width / W, 0, 0, sharp.height / H, 0, 0);
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, mix('#2b2b6a', '#0a0d24', n));
      g.addColorStop(.5, mix('#5b4787', '#181a42', n));
      g.addColorStop(.82, mix('#d0868f', '#3a3474', n));
      g.addColorStop(1, mix('#e6a089', '#4a3a6e', n));
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      // Moon, brighter as the sky darkens
      const mx = W * .26; const my = H * .13; const mr = Math.max(7, W * .028);
      const halo = c.createRadialGradient(mx, my, mr * .6, mx, my, mr * 4);
      halo.addColorStop(0, `rgb(240 236 255 / ${.08 + .14 * n})`);
      halo.addColorStop(1, 'rgb(240 236 255 / 0)');
      c.fillStyle = halo;
      c.fillRect(mx - mr * 4, my - mr * 4, mr * 8, mr * 8);
      c.fillStyle = `rgb(246 240 222 / ${.45 + .5 * n})`;
      c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.fill();
      // Buildings and their windows
      for (const b of city.rows) {
        c.fillStyle = b.layer ? mix('#2a2a58', '#10122e', n) : mix('#4a4280', '#1d1f4a', n);
        c.fillRect(b.x, b.top, b.w, H - b.top);
        if (b.roof > .6) c.fillRect(b.x + b.w * .2, b.top - 6, b.w * .35, 7);
        if (b.mast) {
          c.fillRect(b.x + b.w * .5, b.top - 26 - b.mast * 20, 1.6, 30 + b.mast * 20);
          c.fillStyle = `rgb(255 90 80 / ${.4 + .5 * n})`;
          c.fillRect(b.x + b.w * .5 - 1.2, b.top - 28 - b.mast * 20, 4, 4);
        }
        const lit = (b.layer ? .1 : .14) + .5 * n;
        for (const [wx, wy, t, hue] of b.wins) {
          if (t > lit) continue;
          c.fillStyle = hue < .62 ? (b.layer ? '#ffc672' : '#f7cf8a') : hue < .85 ? '#ffe6b0' : '#9fd2ff';
          c.globalAlpha = b.layer ? .95 : .75;
          c.fillRect(wx, wy, b.ww, b.wh);
        }
        c.globalAlpha = 1;
      }
      // The street's glow and out-of-focus lights low down
      const street = c.createLinearGradient(0, H * .8, 0, H);
      street.addColorStop(0, 'rgb(255 170 110 / 0)');
      street.addColorStop(1, `rgb(255 170 110 / ${.18 + .14 * n})`);
      c.fillStyle = street;
      c.fillRect(0, H * .8, W, H * .2);
      for (const [x, y, r, k] of city.bokeh) {
        const col = k < .55 ? '255 196 120' : k < .8 ? '120 236 200' : '255 120 130';
        const b = c.createRadialGradient(x, y, 0, x, y, r);
        b.addColorStop(0, `rgb(${col} / .55)`);
        b.addColorStop(.7, `rgb(${col} / .3)`);
        b.addColorStop(1, `rgb(${col} / 0)`);
        c.fillStyle = b;
        c.fillRect(x - r, y - r, r * 2, r * 2);
      }
      // The glass shows it out of focus: shrink it and stretch it back
      tctx.setTransform(1, 0, 0, 1, 0, 0);
      tctx.drawImage(sharp, 0, 0, tiny.width, tiny.height);
      vctx.setTransform(1, 0, 0, 1, 0, 0);
      vctx.imageSmoothingQuality = 'high';
      vctx.drawImage(tiny, 0, 0, viewCv.width, viewCv.height);
      drawnNight = n;
    };

    // Sprites: the shading on a drop (dark rim, a highlight from the room, a bright crescent low down), and a small drop.
    const makeShade = (hi) => {
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 80;
      const c = cv.getContext('2d');
      c.translate(32, 40); c.scale(1, 1.25);
      let g = c.createRadialGradient(0, -2, 10, 0, 0, 32);
      g.addColorStop(0, 'rgb(0 0 0 / 0)'); g.addColorStop(.62, 'rgb(6 8 26 / .08)'); g.addColorStop(.86, 'rgb(6 8 26 / .5)'); g.addColorStop(1, 'rgb(6 8 26 / .85)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, 32, 0, Math.PI * 2); c.fill();
      g = c.createRadialGradient(0, 20, 2, 0, 18, 20);
      g.addColorStop(0, 'rgb(255 255 255 / .22)'); g.addColorStop(1, 'rgb(255 255 255 / 0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, 31, 0, Math.PI * 2); c.fill();
      g = c.createRadialGradient(-11, -14, 0, -11, -14, 9);
      g.addColorStop(0, hi); g.addColorStop(1, 'rgb(255 255 255 / 0)');
      c.fillStyle = g; c.beginPath(); c.arc(-11, -14, 9, 0, Math.PI * 2); c.fill();
      return cv;
    };
    const makeDot = () => {
      const cv = document.createElement('canvas');
      cv.width = 16; cv.height = 18;
      const c = cv.getContext('2d');
      c.translate(8, 9);
      const g = c.createRadialGradient(0, 0, 1, 0, 1, 8);
      g.addColorStop(0, 'rgb(200 210 255 / .08)'); g.addColorStop(.65, 'rgb(10 12 34 / .26)'); g.addColorStop(1, 'rgb(10 12 34 / 0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, 8, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgb(255 255 255 / .32)'; c.beginPath(); c.arc(-2.2, -2.6, 1.6, 0, Math.PI * 2); c.fill();
      return cv;
    };

    const drop = (o) => ({ x: 0, y: 0, r: 0, spreadX: 0, spreadY: 0, momentum: 0, momentumX: 0, lastSpawn: 0, nextSpawn: 0, parent: null, isNew: true, killed: false, shrink: 0, ...o });
    const add = (list, o) => { if (drops.length + list.length < O.maxDrops) list.push(drop(o)); };

    const droplet = (x, y, r) => {
      const s = r * K;
      dctx.drawImage(dot, x * K - s, y * K - s, s * 2, s * 2.2);
    };
    const clearDroplets = (x, y, r) => {
      dctx.globalCompositeOperation = 'destination-out';
      dctx.beginPath();
      dctx.ellipse(x * K, y * K, r * K, r * K * 1.4, 0, 0, Math.PI * 2);
      dctx.fill();
      dctx.globalCompositeOperation = 'source-over';
    };

    const step = (ts) => {
      // New small drops on the glass, and a few clear patches where old ones have run together
      dropletCount += O.dropletsRate * ts * area;
      while (dropletCount >= 1) { dropletCount -= 1; droplet(rand(simW), rand(simH), rand(...O.dropletsSize, (n) => n * n)); }
      if (chance(.03 * ts)) clearDroplets(rand(simW), rand(simH), rand(30, 60));
      const next = [];
      // Rain landing
      let count = 0;
      let want = O.rainChance * ts * area;
      want = Math.floor(want) + (chance(want % 1) ? 1 : 0);
      while (count < want) {
        count++;
        const r = rand(O.minR, O.maxR, (n) => n ** 3);
        add(next, { x: rand(simW), y: rand(simH * -.1, simH * .95), r, momentum: 1 + (r - O.minR) * .1 + rand(2), spreadX: 1.5, spreadY: 1.5 });
      }
      drops.sort((a, b) => (a.y * simW + a.x) - (b.y * simW + b.x));
      const dR = O.maxR - O.minR;
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        if (d.killed) continue;
        // Bigger drops are likelier to start running
        if (chance((d.r - O.minR) * (.12 / dR) * ts)) d.momentum += rand((d.r / O.maxR) * 4.5);
        // Only the small drops a runner leaves behind dry up; the rest stay until something runs into them
        if (d.r <= O.minR * .72 && chance(.04 * ts)) d.shrink += .01;
        d.r -= d.shrink * ts;
        if (d.r <= 0) { d.killed = true; continue; }
        // A running drop leaves a trail of small drops behind it
        d.lastSpawn += d.momentum * ts * O.trailRate;
        if (d.lastSpawn > d.nextSpawn && drops.length + next.length < O.maxDrops) {
          next.push(drop({ x: d.x + rand(-d.r, d.r) * .1, y: d.y - d.r * .01, r: d.r * rand(...O.trailScale), spreadY: d.momentum * .1, parent: d }));
          d.r *= .97 ** ts;
          d.lastSpawn = 0;
          d.nextSpawn = rand(O.minR, O.maxR) - d.momentum * 2 * O.trailRate + (O.maxR - d.r);
        }
        d.spreadX *= .4 ** ts;
        d.spreadY *= .7 ** ts;
        const moved = d.momentum > 0;
        if (moved) {
          d.y += d.momentum * ts;
          d.x += d.momentumX * ts;
          if (d.y > simH + d.r) { d.killed = true; continue; }
        }
        // Drops that touch merge into one bigger, faster drop
        if (moved || d.isNew) {
          const end = Math.min(drops.length, i + 70);
          for (let j = i + 1; j < end; j++) {
            const e = drops[j];
            if (e.killed || d.r <= e.r || d.parent === e || e.parent === d) continue;
            const dx = e.x - d.x; const dy = e.y - d.y;
            if (Math.hypot(dx, dy) < (d.r + e.r) * (O.collision + d.momentum * O.collisionInc * ts)) {
              const target = Math.min(O.maxR, Math.sqrt(d.r * d.r + e.r * e.r * .8));
              d.r = target;
              d.momentumX += dx * .1;
              d.spreadX = 0; d.spreadY = 0;
              e.killed = true;
              d.momentum = Math.max(e.momentum, Math.min(40, d.momentum + target * O.boostMul + O.boost));
            }
          }
        }
        d.isNew = false;
        d.momentum -= Math.max(1, O.minR * .5 - d.momentum) * .1 * ts;
        if (d.momentum < 0) d.momentum = 0;
        d.momentumX *= .7 ** ts;
        next.push(d);
        if (moved) clearDroplets(d.x, d.y, d.r * O.clean);
      }
      drops = next.filter((d) => !d.killed);
    };

    const render = () => {
      ctx.setTransform(S, 0, 0, S, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(dropletCv, 0, 0, W, H);
      const shade = lampOn() ? shadeWarm : shadeCool;
      const vx = sharp.width / W; const vy = sharp.height / H;
      for (const d of drops) {
        const x = d.x * K; const y = d.y * K;
        const rx = d.r * K * .82 * (1 + d.spreadX); const ry = d.r * K * 1.02 * (1 + d.spreadY);
        if (rx < 1.6) { ctx.drawImage(dot, x - rx * 1.4, y - ry * 1.4, rx * 2.8, ry * 2.8); continue; }
        // The view behind the drop, from a wider patch of the glass and turned upside down
        const sw = rx * 7; const sh = ry * 6;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.clip();
        ctx.translate(x, y);
        ctx.scale(-1, -1);
        ctx.drawImage(sharp, (x - sw / 2) * vx, (y - sh / 2) * vy, sw * vx, sh * vy, -rx, -ry, rx * 2, ry * 2);
        ctx.restore();
        ctx.drawImage(shade, x - rx * 1.02, y - ry * 1.02, rx * 2.04, ry * 2.04);
      }
    };

    const seed = () => {
      drops = [];
      dctx.setTransform(1, 0, 0, 1, 0, 0);
      dctx.clearRect(0, 0, dropletCv.width, dropletCv.height);
      dctx.setTransform(S, 0, 0, S, 0, 0);
      // Start with a wet window, not an empty one
      for (let i = 0; i < 70 * area; i++) add(drops, { x: rand(simW), y: rand(simH), r: rand(O.minR * .5, O.maxR * .8, (n) => n ** 2), isNew: false });
      for (let i = 0; i < 900 * area; i++) droplet(rand(simW), rand(simH), rand(...O.dropletsSize, (n) => n * n));
      for (let i = 0; i < 24; i++) step(1.5);
    };

    // A coarser canvas for a slow device: the drops stay where they are, and the small ones are scaled across.
    const coarser = () => {
      const old = document.createElement('canvas');
      old.width = dropletCv.width; old.height = dropletCv.height;
      old.getContext('2d').drawImage(dropletCv, 0, 0);
      S = Math.min(devicePixelRatio || 1, 2) * QUALITY[quality];
      rainCv.width = Math.round(W * S); rainCv.height = Math.round(H * S);
      dropletCv.width = rainCv.width; dropletCv.height = rainCv.height;
      dctx.drawImage(old, 0, 0, dropletCv.width, dropletCv.height);
      dctx.setTransform(S, 0, 0, S, 0, 0);
    };
    const resize = (force) => {
      const w = glass.clientWidth; const h = glass.clientHeight;
      if (!w || !h) return;
      const changed = Math.abs(w - W) > 1 || Math.abs(h - H) > 1;
      if (!changed && !force) return;
      W = w; H = h;
      S = Math.min(devicePixelRatio || 1, 2) * QUALITY[quality];
      K = .29 * Math.max(.85, Math.min(1.25, W / 420));
      simW = W / K; simH = H / K;
      area = Math.sqrt((simW * simH) / (1024 * 768));
      rainCv.width = Math.round(W * S); rainCv.height = Math.round(H * S);
      dropletCv.width = rainCv.width; dropletCv.height = rainCv.height;
      sharp.width = Math.round(W * .5); sharp.height = Math.round(H * .5);
      tiny.width = Math.max(8, Math.round(W / 7)); tiny.height = Math.max(8, Math.round(H / 7));
      viewCv.width = Math.round(W * .5); viewCv.height = Math.round(H * .5);
      if (changed || !city) city = makeCity();
      drawView();
      seed();
      render();
    };

    // Animation: about 30 frames a second, only while the window is on screen, the tab is visible and effects are on.
    // If a frame of rain costs too much on this device, the canvas steps down to a coarser resolution.
    let raf = 0; let running = false; let last = 0; let cost = 0; let costFrames = 0; let onScreen = true;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = now - last;
      if (dt < 31) return;
      last = now;
      const t0 = performance.now();
      step(Math.min(dt / 16.67, 3));
      render();
      cost = cost * .9 + (performance.now() - t0) * .1;
      if (++costFrames > 40 && cost > 8 && quality < QUALITY.length - 1) {
        quality += 1;
        O.maxDrops = Math.round(O.maxDrops * .7);
        costFrames = 0; cost = 0;
        coarser();
      }
    };
    const sync = () => {
      const should = onScreen && !document.hidden && !calm() && W > 0;
      if (should && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
      if (!should && running) { running = false; cancelAnimationFrame(raf); raf = 0; }
    };

    const start = () => {
      shadeWarm = makeShade('rgb(255 236 200 / .85)');
      shadeCool = makeShade('rgb(225 235 255 / .8)');
      dot = makeDot();
      resize(true);
      if ('ResizeObserver' in window) {
        let t;
        new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => { resize(); sync(); }, 120); }).observe(glass);
      }
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((es) => { onScreen = es[es.length - 1].isIntersecting; sync(); }).observe(glass);
      }
      document.addEventListener('visibilitychange', sync);
      addEventListener('eas:calm', () => { sync(); if (calm()) render(); });
      sync();
    };

    return {
      start,
      night(n) {
        night = n;
        if (W && Math.abs(n - drawnNight) > .02) { drawView(); if (!running) render(); }
      },
      lamp() { if (W && !running) render(); },
    };
  })();

  // ---- Dusk to night as you read (wide screens, where the window stays beside the page) ----
  const wide = matchMedia('(min-width: 1080px)');
  let scrollMax = 1;
  const measure = () => { scrollMax = Math.max(1, root.scrollHeight - innerHeight); };
  let pending = false;
  const onScroll = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      rain.night(wide.matches ? .28 + .72 * Math.min(1, Math.max(0, scrollY / scrollMax)) : .62);
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); onScroll(); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); onScroll(); }).observe(document.body);

  // ---- The radio: the music section gets a dial and a speaker, and the desk radio plays it ----
  const wrap = $('.music-wrap');
  const player = $('[data-player]');
  const tracks = $$('.music-wrap .track');
  const radioBtn = $('.lc-radio-btn', room);
  if (wrap && tracks.length && player) {
    const n = tracks.length;
    const dial = document.createElement('div');
    dial.className = 'lc-dial';
    dial.setAttribute('aria-hidden', 'true');
    dial.innerHTML = `<div class="lc-band"><span>FM</span>${[88, 92, 96, 100, 104, 108].map((f) => `<b>${f}</b>`).join('')}</div><div class="lc-stations">${tracks.map((_, i) => `<i style="--at:${((i + .5) / n).toFixed(3)}"></i>`).join('')}</div><i class="lc-needle"></i>`;
    const speaker = document.createElement('div');
    speaker.className = 'lc-speaker';
    speaker.setAttribute('aria-hidden', 'true');
    speaker.innerHTML = '<i></i>';
    $('h3', wrap).after(dial);
    wrap.prepend(speaker);
    wrap.style.setProperty('--tune', (.5 / n).toFixed(3));
    tracks.forEach((t, i) => t.style.setProperty('--ch', `"${i + 1}"`));

    const paintRadio = () => {
      const on = !player.hidden;
      const idx = tracks.findIndex((t) => t.classList.contains('is-playing'));
      if (on) root.dataset.radio = 'on'; else delete root.dataset.radio;
      if (idx >= 0) wrap.style.setProperty('--tune', ((idx + .5) / n).toFixed(3));
      radioBtn.setAttribute('aria-label', on ? 'Radio: tune to the next track' : 'Radio: play the music');
      radioBtn.title = on ? 'Next track' : 'Play the music';
    };
    new MutationObserver(paintRadio).observe(player, { attributes: true, attributeFilter: ['hidden'] });
    new MutationObserver(paintRadio).observe($('.tracks', wrap), { subtree: true, attributes: true, attributeFilter: ['class'] });
    paintRadio();
    radioBtn.addEventListener('click', () => {
      const btns = tracks.map((t) => $('.track-btn', t));
      const cur = tracks.findIndex((t) => t.classList.contains('is-playing'));
      btns[player.hidden ? Math.max(0, cur) : (cur + 1) % n].click();
    });
  } else if (radioBtn) {
    radioBtn.hidden = true;
  }

  // ---- Start the rain once the first screen has painted ----
  const go = () => { measure(); rain.start(); onScroll(); };
  requestAnimationFrame(() => setTimeout(go, 60));
})();
