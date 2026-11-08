// Quake-style / 90s FPS: a working drop-down console (press ~), a status bar whose weapon slots are the contents (keys 1 to 6),
// and torches that run on Quake's own light-style strings, a to z at 10 steps a second.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1';
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];

  // ---- Torches -------------------------------------------------------------------------------------------
  const hero = $('.hero');
  for (const side of ['l', 'r']) {
    const t = document.createElement('span');
    t.className = `q-torch q-torch-${side} fx`;
    t.setAttribute('aria-hidden', 'true');
    hero.append(t);
  }
  // Two of id's flicker styles from Quake's world.qc. 'a' is dark, 'm' normal, 'z' double bright, stepped 10 times a second.
  const STYLE = ['mmnmmommommnonmmonqnmmo', 'nmonqnmomnmomomno'];
  let lightT = 0; let step = 0;
  const torches = $$('.q-torch');
  function lightTick(now) {
    requestAnimationFrame(lightTick);
    if (isCalm() || now - lightT < 100) return;
    lightT = now; step++;
    torches.forEach((t, i) => {
      const s = STYLE[i % 2]; const v = (s.charCodeAt(step % s.length) - 97) / 12;
      t.style.setProperty('--lit', v.toFixed(2));
    });
  }
  requestAnimationFrame(lightTick);

  // ---- Status bar: the contents become weapon slots, joined by armour, health, ammo and four runes ------------
  const toc = $('.toc');
  const links = $$('a', toc);
  const IDS = links.map((a) => a.getAttribute('href').slice(1));
  links.forEach((a, i) => {
    const t = a.textContent;
    a.innerHTML = `<b>${i + 1}</b><span>${t}</span>`;
    a.title = `${t} (key ${i + 1})`;
    a.setAttribute('aria-label', t);
  });
  const hud = document.createElement('div');
  hud.className = 'q-stats';
  hud.setAttribute('aria-hidden', 'true');
  hud.innerHTML = `<span class="q-stat q-armor"><i>Armor</i><b>100</b></span><span class="q-stat q-health"><i>Health</i><b>100</b></span><span class="q-stat q-ammo"><i>Ammo</i><b>6</b></span><span class="q-runes"><u></u><u></u><u></u><u></u></span>`;
  toc.append(hud);
  const elHealth = $('.q-health b', hud); const elAmmo = $('.q-ammo b', hud); const elArmor = $('.q-armor b', hud);
  const runes = $$('.q-runes u', hud);
  let god = false; let dead = false;
  const secs = IDS.map((id) => document.getElementById(id));
  function syncHud() {
    const max = root.scrollHeight - innerHeight; const p = max > 0 ? scrollY / max : 0;
    let cur = -1;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.45) cur = i; });
    links.forEach((a, i) => { a.classList.toggle('is-here', i === cur); a.classList.toggle('is-past', i < cur); });
    runes.forEach((r, i) => r.classList.toggle('on', p >= (i + 1) * 0.245));
    if (!god && !dead) { elHealth.textContent = String(Math.max(13, Math.round(100 - p * 87))); elAmmo.textContent = String(IDS.length - Math.max(0, cur + 1)); }
  }
  addEventListener('scroll', syncHud, { passive: true });
  addEventListener('resize', syncHud);
  syncHud();

  // Jumping scrolls instantly, the way a level change does
  const go = (id) => {
    if (id === 'top') { scrollTo({ top: 0, behavior: 'instant' }); return; }
    const s = document.getElementById(id);
    if (s) { s.scrollIntoView({ behavior: isCalm() ? 'auto' : 'instant', block: 'start' }); history.replaceState(null, '', `#${id}`); }
  };
  links.forEach((a, i) => a.addEventListener('click', (e) => { e.preventDefault(); go(IDS[i]); }));

  // ---- The console -------------------------------------------------------------------------------------------
  const con = document.createElement('div');
  con.className = 'q-con';
  con.setAttribute('role', 'dialog');
  con.setAttribute('aria-label', 'Console');
  con.innerHTML = `<div class="q-log" aria-live="polite"></div><form class="q-line"><label for="q-in">]</label><input id="q-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go"></form><span class="q-ver">Explore Art Styles 1.09</span>`;
  document.body.append(con);
  const log = $('.q-log', con); const input = $('input', con);
  const print = (txt, cls) => { const p = document.createElement('p'); p.textContent = txt; if (cls) p.className = cls; log.append(p); log.scrollTop = log.scrollHeight; };
  const LEVELS = { feel: 'E1M1: The Feel', core: 'E1M2: Core Elements', how: 'E1M3: How To Do It', palette: 'E1M4: Palette', vibe: 'E1M5: Feel The Vibe', refs: 'E1M6: More References', related: 'E1M7: Related Styles', start: 'START: Introduction' };
  const ALIAS = { e1m1: 'feel', e1m2: 'core', e1m3: 'how', e1m4: 'palette', e1m5: 'vibe', e1m6: 'refs', e1m7: 'related', start: 'start', dm3: 'refs' };
  print('Quake-style console. Type help for commands, or press ~ to close.', 'hi');
  const open = (on) => {
    const now = on ?? !con.classList.contains('on');
    con.classList.toggle('on', now);
    root.classList.toggle('q-con-open', now);
    if (now) setTimeout(() => input.focus(), isCalm() ? 0 : 140); else input.blur();
  };
  const conBtn = document.createElement('button');
  conBtn.type = 'button'; conBtn.className = 'atlas-btn q-con-btn'; conBtn.innerHTML = '<span class="q-tilde">~</span><span class="atlas-label">Console</span>'; conBtn.title = 'Open the console';
  $('.atlas-actions').prepend(conBtn);
  conBtn.addEventListener('click', () => open());
  const hint = document.createElement('p');
  hint.className = 'q-hint';
  hint.innerHTML = '<button type="button"><kbd>~</kbd> console</button> <span>Try <code>help</code>, <code>map how</code> or <code>r_drawflat 1</code>. <span class="q-keys">Keys 1 to 6 jump between sections.</span></span>';
  $('.hero-text').append(hint);
  $('button', hint).addEventListener('click', () => open(true));

  const toggle = (cls) => { const on = !root.classList.contains(cls); root.classList.toggle(cls, on); return on; };
  let quadT;
  const COMMANDS = {
    help: () => {
      print('map <feel core how palette vibe refs related start>');
      print('god  noclip  notarget  kill  impulse 11  give');
      print('r_drawflat 0|1   gl_texturemode gl_nearest|gl_linear');
      print('save  next  prev  quit  clear  echo <text>  maps');
    },
    maps: () => Object.entries(LEVELS).forEach(([k, v]) => print(`${k.padEnd(8)} ${v}`)),
    map: (a) => {
      const name = ALIAS[a] || a;
      if (!name) { print('map <levelname>: changes level. Try maps.'); return; }
      if (!LEVELS[name]) { print(`Couldn't spawn server maps/${a}.bsp`, 'err'); return; }
      print(`Changing level... ${LEVELS[name]}`, 'hi');
      open(false);
      go(name === 'start' ? 'top' : name);
    },
    god: () => {
      god = !god; root.classList.toggle('q-god', god);
      elArmor.textContent = god ? '666' : '100';
      if (god) { elHealth.textContent = '666'; } else syncHud();
      print(god ? 'godmode ON' : 'godmode OFF', 'hi');
    },
    noclip: () => { print('noclip ON'); open(false); scrollTo({ top: root.scrollHeight, behavior: isCalm() ? 'auto' : 'smooth' }); },
    notarget: () => print('notarget ON. Nothing on this page was going to attack you anyway.'),
    kill: () => {
      dead = true; elHealth.textContent = '0'; root.classList.add('q-dead');
      print('You suicide.', 'err'); open(false);
      setTimeout(() => { dead = false; root.classList.remove('q-dead'); scrollTo({ top: 0, behavior: 'instant' }); syncHud(); }, 1300);
    },
    impulse: (a) => {
      if (a === '11') { $('.q-runes')?.classList.add('all'); runes.forEach((r) => r.classList.add('on')); print('You got the rune!', 'hi'); return; }
      if (a === '9') { print('All weapons. This page has none, so have some shortcuts: keys 1 to 6.'); return; }
      if (a === '255') { COMMANDS.quad(); return; }
      print(`impulse ${a || '?'}: nothing happens.`);
    },
    quad: () => {
      root.classList.add('q-quad'); print('You got the Quad Damage. Images glow blue for 30 seconds.', 'hi');
      clearTimeout(quadT); quadT = setTimeout(() => root.classList.remove('q-quad'), 30000);
    },
    give: () => print('Nothing to give. Type save to keep this style on your shortlist.'),
    r_drawflat: (a) => {
      const on = a === undefined ? toggle('q-flat') : a !== '0';
      root.classList.toggle('q-flat', on);
      print(`r_drawflat is "${on ? 1 : 0}". ${on ? 'Every surface is now one flat colour, so you can read the brushes.' : ''}`);
    },
    gl_texturemode: (a) => {
      const linear = a ? /linear/i.test(a) : !root.classList.contains('q-linear');
      root.classList.toggle('q-linear', linear);
      print(`gl_texturemode ${linear ? 'GL_LINEAR: smooth and blurry. The pixels are hiding.' : 'GL_NEAREST: chunky texels, every one visible.'}`);
    },
    save: () => { $('.atlas [data-save]')?.click(); print('Saved to shortlist. (Press the star again to remove it.)', 'hi'); },
    next: () => $('a[rel=next]')?.click(),
    prev: () => $('a[rel=prev]')?.click(),
    quit: () => { print('Quitting...'); location.href = '../index.html'; },
    clear: () => { log.textContent = ''; },
    echo: (...w) => print(w.join(' ')),
    fov: (a) => print(`fov is "${a || 90}". Sadly this page has only two dimensions.`),
  };
  const history_ = []; let hi = 0;
  $('form', con).addEventListener('submit', (e) => {
    e.preventDefault();
    const line = input.value.trim();
    input.value = '';
    if (!line) return;
    print(`]${line}`, 'cmd');
    history_.push(line); hi = history_.length;
    const [cmd, ...args] = line.split(/\s+/);
    const fn = COMMANDS[cmd.toLowerCase()];
    if (fn) fn(...args); else if (ALIAS[cmd.toLowerCase()] || LEVELS[cmd.toLowerCase()]) COMMANDS.map(cmd.toLowerCase()); else print(`Unknown command "${cmd}". Type help.`, 'err');
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); hi = Math.max(0, hi - 1); input.value = history_[hi] || ''; }
    if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(history_.length, hi + 1); input.value = history_[hi] || ''; }
    if (e.key === 'Tab') {
      e.preventDefault();
      const v = input.value.toLowerCase();
      const parts = v.split(' ');
      const pool = parts.length > 1 && parts[0] === 'map' ? Object.keys(LEVELS).map((k) => `map ${k}`) : Object.keys(COMMANDS);
      const hit = pool.find((k) => k.startsWith(v));
      if (hit) input.value = `${hit}${parts.length > 1 ? '' : ' '}`;
    }
  });
  addEventListener('keydown', (e) => {
    if (document.querySelector('dialog[open]')) return;
    if (e.key === '`' || e.key === '~' || e.key === '²' || e.key === '§') { e.preventDefault(); open(); return; }
    if (e.key === 'Escape' && con.classList.contains('on')) { open(false); return; }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
    const n = Number(e.key);
    if (n >= 1 && n <= IDS.length) go(IDS[n - 1]);
  });

  // ---- Slipgate warp on images: the turbulence in themes/quake-90s-fps.html only runs while you point at something ----
  const turb = document.getElementById('q-turb');
  let warpT = 0; let warpOn = 0;
  function warp(now) {
    if (!warpOn || !turb) return;
    requestAnimationFrame(warp);
    if (now - warpT < 66) return;
    warpT = now;
    const t = now / 1000;
    turb.setAttribute('baseFrequency', `${(0.012 + Math.sin(t * 1.3) * 0.003).toFixed(4)} ${(0.018 + Math.cos(t * 1.1) * 0.004).toFixed(4)}`);
  }
  $$('.ref-gallery .shot-link, .hero-gallery .shot-link').forEach((a) => {
    a.addEventListener('pointerenter', () => { if (isCalm()) return; warpOn++; if (warpOn === 1) requestAnimationFrame(warp); });
    a.addEventListener('pointerleave', () => { warpOn = Math.max(0, warpOn - 1); });
  });
})();
