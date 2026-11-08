// Behaviour shared by every style page: shortlist, calm mode, lightbox, motion loops, music, palette and brief tools.
(() => {
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const root = document.documentElement;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };

  const toastEl = $('[data-toast]');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('on'), 1800);
  }

  async function copy(text, done) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement('textarea');
      t.value = text;
      document.body.append(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    toast(done);
  }

  // Shortlist
  const KEY = 'eas-shortlist';
  const readList = () => { try { const v = JSON.parse(store.get(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
  for (const b of $$('[data-save]')) {
    const slug = b.dataset.save;
    const paint = () => b.setAttribute('aria-pressed', String(readList().includes(slug)));
    paint();
    b.addEventListener('click', () => {
      const l = readList();
      const has = l.includes(slug);
      store.set(KEY, JSON.stringify(has ? l.filter((x) => x !== slug) : [...l, slug]));
      paint();
      toast(has ? 'Removed from shortlist' : 'Added to shortlist');
    });
  }

  // Calm mode
  const calmBtn = $('[data-calm-toggle]');
  const calmLabel = $('[data-calm-label]');
  const isCalm = () => root.dataset.calm === '1';
  function paintCalm() {
    calmBtn.setAttribute('aria-pressed', String(isCalm()));
    calmLabel.textContent = isCalm() ? 'Effects off' : 'Effects on';
  }
  paintCalm();
  calmBtn.addEventListener('click', () => {
    if (isCalm()) delete root.dataset.calm; else root.dataset.calm = '1';
    store.set('eas-calm', isCalm() ? '1' : '0');
    paintCalm();
    syncLoops();
    dispatchEvent(new CustomEvent('eas:calm', { detail: { calm: isCalm() } }));
  });

  // Motion loops play while on screen.
  const loops = $$('video[data-loop]');
  const visible = new Set();
  function syncLoops() {
    for (const v of loops) {
      if (visible.has(v) && !isCalm() && !v.dataset.userPaused) v.play().catch(() => {});
      else if (!v.dataset.userPlaying) v.pause();
    }
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target); else { visible.delete(e.target); delete e.target.dataset.userPlaying; }
      }
      syncLoops();
    }, { threshold: 0.25 });
    loops.forEach((v) => io.observe(v));
  }
  for (const v of loops) {
    v.addEventListener('click', () => {
      if (v.paused) { delete v.dataset.userPaused; v.dataset.userPlaying = '1'; v.play().catch(() => {}); } else { v.dataset.userPaused = '1'; delete v.dataset.userPlaying; v.pause(); }
    });
  }

  // Music plays in a small dock, so it carries on while you read the rest of the page.
  const player = $('[data-player]');
  const frame = $('[data-player-frame]');
  function stopMusic() {
    frame.textContent = '';
    player.hidden = true;
    $$('.track.is-playing').forEach((t) => t.classList.remove('is-playing'));
  }
  for (const b of $$('[data-yt]')) {
    b.addEventListener('click', () => {
      if (location.protocol === 'file:' || 'noembed' in b.dataset) {
        // YouTube refuses to embed on file:// pages, and some videos refuse every embed.
        open(`https://www.youtube.com/watch?v=${b.dataset.yt}`, '_blank', 'noopener');
        return;
      }
      $$('.track.is-playing').forEach((t) => t.classList.remove('is-playing'));
      b.closest('.track').classList.add('is-playing');
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1&rel=0`;
      f.title = `${b.dataset.track}, ${b.dataset.artist}`;
      f.allow = 'autoplay; encrypted-media; picture-in-picture';
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      f.allowFullscreen = true;
      frame.textContent = '';
      frame.append(f);
      $('[data-player-title]').textContent = b.dataset.track;
      $('[data-player-artist]').textContent = b.dataset.artist;
      player.hidden = false;
    });
  }
  $('[data-player-close]').addEventListener('click', stopMusic);

  // Lightbox
  const dlg = $('[data-lightbox-dialog]');
  const lbLinks = $$('[data-lightbox]');
  let lbIndex = 0;
  function showLb(i) {
    lbIndex = (i + lbLinks.length) % lbLinks.length;
    const a = lbLinks[lbIndex];
    const img = $('[data-lb-img]');
    const fig = $('.lb-figure');
    fig.classList.toggle('is-pixel', Boolean(a.closest('.is-pixel')));
    img.src = a.href;
    img.alt = a.querySelector('img')?.alt || '';
    $('[data-lb-title]').textContent = a.dataset.title || '';
    $('[data-lb-meta]').textContent = a.dataset.meta || '';
    const credit = [a.dataset.credit, a.dataset.license].filter(Boolean).join(', ');
    $('[data-lb-credit]').textContent = credit;
    const src = $('[data-lb-source]');
    src.href = a.dataset.source || a.href;
  }
  lbLinks.forEach((a, i) => a.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    showLb(i);
    dlg.showModal();
  }));
  $('[data-lb-close]').addEventListener('click', () => dlg.close());
  $('[data-lb-prev]').addEventListener('click', () => showLb(lbIndex - 1));
  $('[data-lb-next]').addEventListener('click', () => showLb(lbIndex + 1));
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.classList.contains('lb-figure')) dlg.close(); });

  // Keyboard: arrows move through images in the lightbox, otherwise through styles.
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (dlg.open) {
      if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
      if (e.key === 'ArrowRight') showLb(lbIndex + 1);
      return;
    }
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
    if (e.key === 'ArrowLeft') $('a[rel=prev]')?.click();
    if (e.key === 'ArrowRight') $('a[rel=next]')?.click();
  });

  // Palette tools
  const pal = JSON.parse($('#palette-data').textContent);
  $$('[data-copy]').forEach((b) => b.addEventListener('click', () => copy(b.dataset.copy, `Copied ${b.dataset.copy}`)));
  $$('[data-palette-dl]').forEach((b) => b.addEventListener('click', () => {
    const type = b.dataset.paletteDl;
    const slug = document.body.dataset.slug;
    const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const text = type === 'gpl'
      ? `GIMP Palette\nName: ${pal.name}\nColumns: ${pal.colors.length}\n#\n${pal.colors.map((c) => `${toRgb(c.hex).map((v) => String(v).padStart(3)).join(' ')}\t${c.name}`).join('\n')}\n`
      : `${pal.colors.map((c) => c.hex.slice(1)).join('\n')}\n`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = `${slug}.${type}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }));

  const briefBtn = $('[data-copy-brief]');
  if (briefBtn) briefBtn.addEventListener('click', () => copy($('#brief-text').content.textContent, 'Brief copied'));

  // Balance. The cheat sheet sits beside Do and Avoid, and the games list beside "Film, art and more". When one side
  // is much longer, the other leaves a big empty hole. Try a few arrangements, measure each, keep the tightest.
  const holeOf = (box, items) => {
    const bw = box.getBoundingClientRect().width;
    const cols = new Map();
    const range = document.createRange();
    for (const el of items) {
      const r = el.getBoundingClientRect();
      if (!r.height || r.width > bw * 0.8) continue;
      // Where the content ends, not the box: a theme may stretch a short card to its neighbour's height.
      range.selectNodeContents(el);
      const key = Math.round(r.left / 12);
      cols.set(key, Math.max(cols.get(key) ?? -Infinity, range.getBoundingClientRect().bottom));
    }
    const b = [...cols.values()];
    return b.length < 2 ? 0 : Math.max(...b) - Math.min(...b);
  };
  function balance(box, items, layouts) {
    if (!box || items.some((el) => !el)) return;
    box.classList.remove(...layouts);
    const base = holeOf(box, items);
    if (base < 200) return;
    let best = { cls: null, score: base + box.offsetHeight * 0.3 };
    for (const cls of layouts) {
      box.classList.add(cls);
      const score = holeOf(box, items) + box.offsetHeight * 0.3;
      if (score < best.score - 60) best = { cls, score };
      box.classList.remove(cls);
    }
    if (best.cls) box.classList.add(best.cls);
  }
  function balanceAll() {
    const side = $('.how-side');
    const specs = side && $(':scope > .specs', side);
    const dd = side && $(':scope > .dodont', side);
    if (specs && dd) {
      side.classList.remove('how-b', 'how-c'); // measure the theme's own columns, not a previous pass
      const sw = specs.offsetWidth, dw = dd.offsetWidth;
      side.style.setProperty('--hb-cols', `minmax(0, ${sw || 1}fr) minmax(0, ${dw || 1}fr)`);
      balance(side, [specs, $('.do', dd), $('.avoid', dd)], ['how-b', 'how-c']);
    }
    const lists = $('.ref-lists');
    if (lists) balance(lists, $$(':scope > .ref-list', lists), ['rl-stack']);
  }
  let balanceTimer;
  const rebalance = () => { clearTimeout(balanceTimer); balanceTimer = setTimeout(balanceAll, 150); };
  // After the theme script has run (it may move these blocks), again once fonts are in, and once more at load.
  document.addEventListener('DOMContentLoaded', () => { balanceAll(); document.fonts?.ready.then(balanceAll); });
  addEventListener('load', balanceAll);
  addEventListener('resize', rebalance);
})();
