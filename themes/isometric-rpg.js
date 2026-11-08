// Isometric 90s RPG: a working dialogue log that follows the section you are in, numbered replies (keys 1 to 3)
// that move through the page, party health bars, and the gallery laid out on an isometric map with a legend.
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const calm = () => root.dataset.calm === '1';
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };
  const label = (id) => ($(`.toc a[href="#${id}"]`)?.textContent || $(`#${id} .sec-title`)?.textContent || id).trim();

  // ---- What the narrator says in each section ----
  const LINES = {
    top: ['Narrator', 'You stand before four views of the realm, each painted at a fixed angle and framed in stone.'],
    feel: ['Journal', 'Journal updated. Two pages on why a painted world and small figures work so well.'],
    core: ['Narrator', 'You open the character record. Six traits define this style.'],
    how: ['Spellbook', 'Seven steps memorised, with camera angles, sprite counts and tools to start with.'],
    palette: ['Narrator', 'You open your inventory. Eight colours, taken from the frames and dialogue of the classics. Click one to take it.'],
    vibe: ['Bard', 'A bard tunes up. Three scenes in motion, and five songs if you pick a reply.'],
    refs: ['Narrator', 'You unroll the area map. Nine places to study, then the games and books behind them.'],
    related: ['Narrator', 'Your party gathers. These neighbouring styles are worth a visit.'],
  };

  // ---- Build the log ----
  const log = document.createElement('aside');
  log.className = 'ir-log';
  log.setAttribute('aria-label', 'Dialogue log');
  log.innerHTML = `<div class="ir-box"><div class="ir-lines" role="log" aria-live="polite" tabindex="0"></div>
    <div class="ir-replies" aria-label="Replies"></div></div>
    <div class="ir-side"><button class="ir-min" type="button" aria-label="Make the log smaller" title="Make the log smaller or larger">&#9662;</button><button class="ir-up" type="button" aria-label="Scroll the log up">&#9650;</button><button class="ir-down" type="button" aria-label="Scroll the log down">&#9660;</button></div>`;
  document.body.append(log);
  const lines = $('.ir-lines', log);
  const replies = $('.ir-replies', log);

  const narrow = matchMedia('(max-width: 720px)');
  const setSize = (v) => { root.dataset.irLog = v || (narrow.matches ? 'min' : 'full'); paintMin(); };
  const paintMin = () => {
    const small = root.dataset.irLog === 'min';
    $('.ir-min', log).innerHTML = small ? '&#9652;' : '&#9662;';
    $('.ir-min', log).setAttribute('aria-label', small ? 'Make the log larger' : 'Make the log smaller');
  };
  const saved = store.get('eas-ir-log');
  setSize(saved === 'min' || saved === 'full' ? saved : '');
  $('.ir-min', log).addEventListener('click', () => {
    const v = root.dataset.irLog === 'min' ? 'full' : 'min';
    setSize(v);
    store.set('eas-ir-log', v);
    lines.scrollTop = lines.scrollHeight;
  });
  $('.ir-up', log).addEventListener('click', () => lines.scrollBy({ top: -60 }));
  $('.ir-down', log).addEventListener('click', () => lines.scrollBy({ top: 60 }));

  // New lines type out one character at a time, unless effects are off.
  let typing = null;
  const finishTyping = () => { if (typing) { typing.el.textContent = typing.text; typing.el.parentElement.classList.remove('typing'); clearInterval(typing.t); typing = null; } };
  function say(who, text, cls = '') {
    finishTyping();
    const p = document.createElement('p');
    if (cls) p.className = cls;
    if (who) {
      const w = document.createElement('span');
      w.className = 'who';
      w.textContent = `${who}: `;
      p.append(w);
    }
    const body = document.createElement('span');
    p.append(body);
    lines.append(p);
    while (lines.children.length > 60) lines.firstElementChild.remove();
    if (calm()) {
      body.textContent = text;
    } else {
      // The log is a live region, so screen readers get the whole line at once and not each step of the typing.
      const full = document.createElement('span');
      full.className = 'ir-sr';
      full.textContent = text;
      body.setAttribute('aria-hidden', 'true');
      p.append(full);
      let i = 0;
      p.classList.add('typing');
      typing = { el: body, text, t: setInterval(() => {
        i += 2;
        body.textContent = text.slice(0, i);
        lines.scrollTop = lines.scrollHeight;
        if (i >= text.length) finishTyping();
      }, 18) };
    }
    lines.scrollTop = lines.scrollHeight;
  }

  // ---- Sections and replies ----
  const secs = [$('.hero'), ...$$('main .sec')];
  const ids = secs.map((s) => s.id || 'top');
  let current = null;
  const go = (id) => {
    const el = id === 'top' ? document.body : $(`#${id}`);
    if (id === 'top') scrollTo({ top: 0, behavior: calm() ? 'auto' : 'smooth' });
    else el.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth' });
  };
  function paintReplies(id) {
    // Sections pinned as a rail on wide screens aren't places you can travel to.
    const ids = secs.filter((s) => getComputedStyle(s).position !== 'fixed').map((s) => s.id || 'top');
    const i = ids.indexOf(id);
    const opts = [];
    if (ids[i + 1]) opts.push([`Go on to ${label(ids[i + 1])}`, ids[i + 1]]);
    if (i > 0) opts.push([i === 1 ? 'Go back to the four views' : `Go back to ${label(ids[i - 1])}`, ids[i - 1]]);
    if (i > 1) opts.push(['Return to the top', 'top']);
    replies.textContent = '';
    opts.forEach(([text, target], k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<b>${k + 1}.</b>`;
      b.append(text);
      b.addEventListener('click', () => go(target));
      replies.append(b);
    });
  }
  const tocLinks = $$('.toc a');
  // The rail shows the in-game name. The rest of the label stays for screen readers and in the tooltip.
  tocLinks.forEach((a) => {
    const t = a.textContent;
    const c = t.indexOf(':');
    a.title = t;
    if (c < 0) return;
    a.textContent = t.slice(0, c);
    const more = document.createElement('span');
    more.className = 'ir-more';
    more.textContent = t.slice(c);
    a.append(more);
  });
  function onScroll() {
    const y = innerHeight * 0.35;
    let id = 'top';
    secs.forEach((s, k) => { if (getComputedStyle(s).position !== 'fixed' && s.getBoundingClientRect().top < y) id = ids[k]; });
    if (id === current) return;
    current = id;
    tocLinks.forEach((a) => a.classList.toggle('is-here', a.getAttribute('href') === `#${id}`));
    const [who, text] = LINES[id] || ['Narrator', label(id)];
    say(who, text);
    paintReplies(id);
  }
  addEventListener('scroll', onScroll, { passive: true });

  // Number keys pick a reply, as in the games.
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || $('dialog[open]')) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
    const n = Number(e.key);
    if (n >= 1 && n <= 3) {
      const b = replies.children[n - 1];
      if (b) { e.preventDefault(); b.click(); }
    }
  });

  // ---- Things you do on the page go into the log ----
  document.addEventListener('click', (e) => {
    const lb = e.target.closest('[data-lightbox]');
    if (lb && !e.metaKey && !e.ctrlKey && !e.shiftKey) { say('', `You examine ${lb.dataset.title}.`, 'act'); return; }
    const yt = e.target.closest('[data-yt]');
    if (yt) { say('Bard', `plays ${yt.dataset.track}, by ${yt.dataset.artist}.`); return; }
    const sw = e.target.closest('[data-copy]');
    if (sw) { say('', `You take ${$('.swatch-name', sw)?.textContent || 'a colour'} (${sw.dataset.copy}). It is on your clipboard.`, 'act'); return; }
    if (e.target.closest('[data-palette-dl]')) { say('', 'You pack the palette for your own tools.', 'act'); return; }
    if (e.target.closest('[data-copy-brief]')) { say('', 'The art brief is copied, ready for a design document.', 'act'); return; }
    const save = e.target.closest('[data-save]');
    if (save) setTimeout(() => say('', save.getAttribute('aria-pressed') === 'true' ? 'This style joins your shortlist.' : 'This style leaves your shortlist.', 'sys'), 0);
  });
  addEventListener('eas:calm', () => { finishTyping(); say('', calm() ? 'Effects are off. The torches burn steady.' : 'Effects are on.', 'sys'); });

  // ---- Party health bars under the portraits ----
  $$('.related a').forEach((a, i) => {
    const hp = document.createElement('span');
    hp.className = 'ir-hp';
    hp.setAttribute('aria-hidden', 'true');
    hp.style.setProperty('--hp', `${[100, 82, 64, 91, 74, 55][i % 6]}%`);
    $('img', a).after(hp);
  });

  // ---- The gallery as an isometric map ----
  const gal = $('.ref-gallery');
  if (gal) {
    const figs = $$('.shot', gal);
    const legend = document.createElement('div');
    legend.className = 'ir-legend';
    legend.setAttribute('aria-label', 'Map legend');
    figs.forEach((f, i) => {
      const r = Math.floor(i / 3);
      const k = i % 3;
      f.style.setProperty('--col', (r % 2 ? 2 : 1) + k * 2);
      f.style.setProperty('--row', 1 + r);
      f.dataset.n = i + 1;
      const a = $('.shot-link', f);
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<b>${i + 1}.</b>`;
      const t = document.createElement('span');
      t.style.cssText = 'color:inherit;font-size:inherit';
      t.textContent = a.dataset.title;
      const m = document.createElement('span');
      m.textContent = a.dataset.meta ? ` ${a.dataset.meta}` : '';
      b.append(t, m);
      const lit = (on) => { f.classList.toggle('is-lit', on); b.classList.toggle('is-lit', on); };
      b.addEventListener('mouseenter', () => lit(true));
      b.addEventListener('mouseleave', () => lit(false));
      b.addEventListener('focus', () => lit(true));
      b.addEventListener('blur', () => lit(false));
      b.addEventListener('click', () => a.click());
      f.addEventListener('mouseenter', () => b.classList.add('is-lit'));
      f.addEventListener('mouseleave', () => b.classList.remove('is-lit'));
      legend.append(b);
    });
    gal.after(legend);
  }

  onScroll();
})();
