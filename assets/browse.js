// Browse and shortlist pages. Cards are already in the HTML; this filters, sorts and remembers.
(() => {
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
  };
  const LIST = 'eas-shortlist';
  const readList = () => { try { const v = JSON.parse(store.get(LIST) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
  const writeList = (l) => store.set(LIST, JSON.stringify(l));
  const closeIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

  function paintCount() {
    const n = readList().length;
    const b = $('#shortlist-count');
    if (b) { b.textContent = n; b.hidden = !n; }
  }
  paintCount();

  const themeBtn = $('#theme');
  themeBtn?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    store.set('eas-theme', next);
  });

  // Optimal string alignment distance: the edits that turn a into b, a swap of neighbours counting as one. Gives up past max.
  function osa(a, b, max = Infinity) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let before = null;
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      let low = i;
      for (let j = 1; j <= b.length; j++) {
        let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, before[j - 2] + 1);
        cur.push(v);
        low = Math.min(low, v);
      }
      if (low > max) return max + 1;
      before = prev;
      prev = cur;
    }
    return prev[b.length];
  }

  if (document.body.classList.contains('shortlist')) { initShortlist(); return; }
  if (document.body.classList.contains('notfound')) { initNotFound(); return; }
  // The admin's card preview (admin/preview.html) uses the cards' hover behaviour and nothing else.
  if (document.body.classList.contains('card-preview')) { window.EASCards = wireCards($('#grid')); return; }

  // ---- Browse ----
  // Search: British and American spellings become one before matching, in the cards and the query alike, and so does
  // punctuation ("low-poly", "low poly"). Each card's words come in four fields (src/card.mjs searchFields), and a match
  // in an earlier one ranks higher: the name, then the labels, then the references, then the description.
  const FOLD = [[/colour/g, 'color'], [/grey/g, 'gray'], [/cosy/g, 'cozy'], [/analogue/g, 'analog'], [/catalogue/g, 'catalog'], [/favourite/g, 'favorite'],
    [/centre/g, 'center'], [/theatre/g, 'theater'], [/armour/g, 'armor'], [/humour/g, 'humor'], [/stylis(e|ed|es|ing|ation)\b/g, 'styliz$1']];
  const norm = (t) => {
    let s = String(t ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [re, to] of FOLD) s = s.replace(re, to);
    return s.replace(/[^a-z0-9]+/g, ' ').trim();
  };
  // Words people search with that the styles say differently. Each word still matches itself too.
  const ALSO = {
    scary: ['horror', 'eerie'], spooky: ['horror', 'eerie'], creepy: ['horror', 'eerie'],
    fps: ['shooter', 'first person'], jrpg: ['rpg'], crpg: ['rpg'], metroidvania: ['platformer'], 'side scroller': ['platformer'], sidescroller: ['platformer'],
    scifi: ['sci fi', 'science fiction'], 'sci fi': ['science fiction'], cartoon: ['toon', 'cel shaded'], cute: ['kawaii'],
  };
  const WEIGHT = [100, 40, 30, 15];
  // The styles' guide text (assets/search-text.json) is only searched when nothing above matches, and ranks lowest.
  const GUIDE = 6;
  const prep = (t) => { const n = norm(t); return { text: ` ${n} `, flat: n.replace(/ /g, '') }; };
  const fieldsOf = (json) => { try { return JSON.parse(json).map(prep); } catch { return []; } };

  const grid = $('#grid');
  const cards = $$('.card', grid).map((el) => ({
    el,
    data: JSON.parse(el.dataset.card),
    fields: fieldsOf(el.dataset.search),
    guide: null,
    name: el.dataset.name,
    id: Number(el.dataset.id),
  }));
  const EFFORT = { 'Solo-friendly': 0, 'Small team': 1, 'Big production': 2 };
  const facets = $$('[data-facet]').map((f) => f.dataset.facet);
  const FAMILY_ORDER = $$('[data-facet="family"] input').map((i) => i.value);
  const DEFAULT_SORT = document.body.dataset.sort || 'family';
  // sort is the visitor's choice once they make one (chosen); until then a search sorts by best match.
  const state = { q: '', sort: DEFAULT_SORT, chosen: false, sel: Object.fromEntries(facets.map((f) => [f, new Set()])) };
  let found = null; // the current search: { hits: Map(card -> score), note }, or null with no search

  // How well a phrase fits a field: as a whole word, as the start of a word, inside a word, or with the spaces taken out ("lowpoly").
  function fit(f, phrase, flat) {
    if (f.text.includes(` ${phrase} `)) return 1;
    if (f.text.includes(` ${phrase}`)) return 0.8;
    if (phrase.length >= 3 && f.text.includes(phrase)) return 0.5;
    if (flat.length >= 4 && f.flat.includes(flat)) return 0.45;
    return 0;
  }
  // The query word by word. Each word lists what it may match: itself, then its other words.
  const parse = (q) => q.split(/\s+/).map(norm).filter(Boolean).map((said) => ({ said, alts: [said, ...(ALSO[said] || [])] }));
  function scoreOf(c, words, guide) {
    let total = 0;
    for (const w of words) {
      let best = 0;
      w.alts.forEach((alt, k) => {
        const flat = alt.replace(/ /g, '');
        const scale = k ? 0.9 : 1;
        c.fields.forEach((f, i) => { best = Math.max(best, WEIGHT[i] * fit(f, alt, flat) * scale); });
        // Guide words are stored without their order, so each part of a phrase is looked for on its own.
        if (guide && c.guide && alt.split(' ').every((p) => c.guide.text.includes(` ${p}`))) best = Math.max(best, GUIDE * scale);
      });
      if (!best) return 0;
      total += best;
    }
    // A name that holds the whole query in order comes first.
    if (words.length > 1 && c.fields[0]?.text.includes(` ${words.map((w) => w.said).join(' ')}`)) total += 50;
    return total;
  }
  const hitsFor = (words, guide) => new Map(cards.map((c) => [c, scoreOf(c, words, guide)]).filter(([, s]) => s > 0));

  // A word nothing matches may be a typo: the closest words on the cards stand in for it.
  let vocab = null;
  function corrections(said) {
    if (said.length < 4 || said.includes(' ')) return null;
    vocab ||= [...new Set(cards.flatMap((c) => c.fields.flatMap((f) => f.text.split(' '))))].filter((v) => v.length >= 3 && /[a-z]/.test(v));
    const max = said.length >= 8 ? 2 : 1;
    let best = max + 1;
    let near = [];
    for (const v of vocab) {
      // Against the whole word, or its start, for a word still being typed.
      const d = Math.min(osa(said, v, max), v.length > said.length ? osa(said, v.slice(0, said.length), max) : max + 1);
      if (d < best) { best = d; near = [v]; } else if (d === best) near.push(v);
    }
    return best <= max ? near.sort((a, b) => Math.abs(a.length - said.length) - Math.abs(b.length - said.length)).slice(0, 3) : null;
  }
  const quote = (list) => list.map((w) => `“${w}”`).join(' or ');

  function runSearch() {
    const words = parse(state.q);
    if (!words.length) return null;
    let hits = hitsFor(words, false);
    if (hits.size) return { hits, note: '' };
    // The guide text loads the first time a search needs it.
    if (!guideReady && !guideFailed) {
      loadGuides();
      return { hits, note: 'Looking through the style guides…', pending: true };
    }
    if (guideReady) {
      hits = hitsFor(words, true);
      if (hits.size) return { hits, note: `No style’s name or labels match ${quote(words.map((w) => w.said))}, so these are the styles whose guides mention it.` };
    }
    const fixed = words.map((w) => (hitsFor([w], false).size ? w : { ...w, fix: corrections(w.said) }));
    if (fixed.some((w) => w.fix)) {
      hits = hitsFor(fixed.map((w) => (w.fix ? { said: w.fix[0], alts: w.fix } : w)), false);
      const typed = fixed.filter((w) => w.fix);
      if (hits.size) return { hits, note: `Nothing matches ${quote(typed.map((w) => w.said))}. Showing results for ${quote(typed.map((w) => w.fix[0]))}.` };
    }
    return { hits, note: '' };
  }

  let guideReady = false;
  let guideFailed = false;
  let guideAsked = false;
  function loadGuides() {
    if (guideAsked) return;
    guideAsked = true;
    fetch('assets/search-text.json').then((r) => (r.ok ? r.json() : Promise.reject(r.status))).then((all) => {
      for (const c of cards) if (all[c.data.slug]) c.guide = prep(all[c.data.slug]);
      guideReady = true;
    }, () => { guideFailed = true; }).then(() => { if (state.q.trim()) update(); });
  }

  const asList = (v) => (Array.isArray(v) ? v : [v]);
  // Within a facet, picking more widens (red or black); facets narrow each other.
  function matchFacet(card, facet) {
    const sel = state.sel[facet];
    if (!sel.size) return true;
    const vals = asList(card.data[facet]);
    return [...sel].some((s) => vals.includes(s));
  }
  const matchQuery = (card) => !found || found.hits.has(card);
  const visible = (except) => cards.filter((c) => matchQuery(c) && facets.every((f) => f === except || matchFacet(c, f)));

  function paintCounts() {
    for (const f of facets) {
      const pool = visible(f);
      for (const input of $$(`[data-facet="${f}"] input`)) {
        const n = pool.filter((c) => asList(c.data[f]).includes(input.value)).length;
        const label = input.closest('label');
        const count = $('[data-count]', label);
        if (count) count.textContent = n;
        // An option that would show nothing can't be picked; one already picked can always be taken off.
        const zero = n === 0 && !input.checked;
        input.disabled = zero;
        label.classList.toggle('is-zero', zero);
      }
    }
  }

  function paintPills() {
    const pills = $('#pills');
    pills.textContent = '';
    for (const f of facets) {
      for (const v of state.sel[f]) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pill';
        b.setAttribute('aria-label', `Remove filter ${v}`);
        if (f === 'colours') {
          const dot = document.createElement('i');
          dot.style.background = getComputedStyle($(`[data-facet="colours"] input[value="${v}"] + i`)).backgroundColor;
          b.append(dot);
        }
        b.append(document.createTextNode(v));
        b.insertAdjacentHTML('beforeend', closeIcon);
        b.addEventListener('click', () => {
          state.sel[f].delete(v);
          $(`[data-facet="${f}"] input[value="${CSS.escape(v)}"]`).checked = false;
          update();
        });
        pills.append(b);
      }
    }
    const active = facets.reduce((n, f) => n + state.sel[f].size, 0);
    const badge = $('#active-count');
    badge.textContent = active;
    badge.hidden = !active;
  }

  // A search sorts by best match unless the visitor picked a sort; without one, "Best match" falls back to the default.
  const sortNow = () => (found ? (state.chosen ? state.sort : 'match') : state.sort === 'match' ? DEFAULT_SORT : state.sort);
  function sorted(list, sort) {
    const arr = [...list];
    // By family: in the order of the Family filter, so a style added later still sits with its family.
    const byFamily = (a, b) => FAMILY_ORDER.indexOf(a.data.family) - FAMILY_ORDER.indexOf(b.data.family) || a.id - b.id;
    if (sort === 'match') arr.sort((a, b) => found.hits.get(b) - found.hits.get(a) || byFamily(a, b));
    else if (sort === 'az') arr.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'easy') arr.sort((a, b) => EFFORT[a.data.effort] - EFFORT[b.data.effort] || a.id - b.id);
    else arr.sort(byFamily);
    return arr;
  }

  function paintGrid(list, sort) {
    const frag = document.createDocumentFragment();
    let family = null;
    for (const c of sorted(list, sort)) {
      if (sort === 'family' && c.data.family !== family) {
        family = c.data.family;
        const h = document.createElement('h2');
        h.className = 'group-head';
        h.textContent = family;
        const n = document.createElement('span');
        n.textContent = list.filter((x) => x.data.family === family).length;
        h.append(' ', n);
        frag.append(h);
      }
      frag.append(c.el);
    }
    grid.textContent = '';
    grid.append(frag);
  }

  function writeUrl() {
    const p = new URLSearchParams();
    if (state.q.trim()) p.set('q', state.q.trim());
    for (const f of facets) if (state.sel[f].size) p.set(f, [...state.sel[f]].join(','));
    if (state.chosen && state.sort !== 'match' && (state.sort !== DEFAULT_SORT || found)) p.set('sort', state.sort);
    const qs = p.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }

  function readUrl() {
    const p = new URLSearchParams(location.search);
    state.q = p.get('q') || '';
    $('#q').value = state.q;
    const sort = p.get('sort');
    if (sort && sort !== 'match' && $(`#sort option[value="${CSS.escape(sort)}"]`)) { state.sort = sort; state.chosen = true; }
    for (const f of facets) {
      for (const v of (p.get(f) || '').split(',').filter(Boolean)) {
        const input = $(`[data-facet="${f}"] input[value="${CSS.escape(v)}"]`);
        if (input) { input.checked = true; state.sel[f].add(v); }
      }
    }
  }

  function update(first = false) {
    found = runSearch();
    if (!found && state.sort === 'match') { state.sort = DEFAULT_SORT; state.chosen = false; }
    const sort = sortNow();
    const select = $('#sort');
    const best = $('option[value="match"]', select);
    best.hidden = best.disabled = !found;
    if (select.value !== sort) select.value = sort;
    const list = visible();
    // On load the page already shows the default view (src/render.mjs writes it so), and redrawing it would only repaint
    // the first card late. Anything a link asks for (a search, a filter, a sort) is drawn as usual.
    if (!(first && !found && list.length === cards.length && sort === DEFAULT_SORT)) paintGrid(list, sort);
    $('#count').textContent = list.length;
    $('#count-word').textContent = list.length === 1 ? 'style' : 'styles';
    const note = found?.note || '';
    if ($('#search-note').textContent !== note) $('#search-note').textContent = note;
    $('#empty').hidden = list.length > 0 || Boolean(found?.pending);
    // While the guide text loads, the counts keep what they showed, so options don't flash off and on.
    if (!found?.pending) paintCounts();
    paintPills();
    writeUrl();
  }

  function clearAll(includeSearch) {
    for (const f of facets) state.sel[f].clear();
    $$('[data-facet] input').forEach((i) => { i.checked = false; });
    if (includeSearch) { state.q = ''; $('#q').value = ''; }
    update();
  }

  for (const f of facets) {
    $$(`[data-facet="${f}"] input`).forEach((input) => input.addEventListener('change', () => {
      if (input.checked) state.sel[f].add(input.value); else state.sel[f].delete(input.value);
      update();
    }));
  }
  $('#q').addEventListener('input', (e) => { state.q = e.target.value; update(); });
  $('#sort').addEventListener('change', (e) => { state.sort = e.target.value; state.chosen = true; update(); });
  $('#clear').addEventListener('click', () => clearAll(false));
  $('#empty-clear').addEventListener('click', () => clearAll(true));

  // Filter drawer, on narrow screens (browse.css, max-width 1020px). While open it is a modal dialog: focus moves into it,
  // and the page behind is inert, so neither Tab nor a screen reader can wander behind the scrim.
  const panel = $('#filters');
  const scrim = $('#scrim');
  const opener = $('#filters-open');
  const drawer = matchMedia('(max-width: 1020px)');
  const behind = [$('.skip'), $('.top'), $('.results')].filter(Boolean);
  const toggleFilters = (open, refocus = true) => {
    panel.classList.toggle('open', open);
    scrim.hidden = !open;
    opener.setAttribute('aria-expanded', String(open));
    if (open) { panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); } else { panel.removeAttribute('role'); panel.removeAttribute('aria-modal'); }
    for (const el of behind) el.inert = open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (!refocus) return;
    const target = open ? $('#filters-close') : opener;
    target.focus();
    // The drawer turns visible the moment it opens (browse.css); should a browser still refuse focus this frame, try the next.
    if (document.activeElement !== target) requestAnimationFrame(() => target.focus());
  };
  opener.addEventListener('click', () => toggleFilters(true));
  $('#filters-close').addEventListener('click', () => toggleFilters(false));
  scrim.addEventListener('click', () => toggleFilters(false));
  // Widening the window past the drawer's breakpoint puts the filters back in the sidebar.
  drawer.addEventListener('change', (e) => { if (!e.matches && panel.classList.contains('open')) toggleFilters(false, false); });

  addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) { e.preventDefault(); $('#q').focus(); $('#q').select(); }
    if (e.key === 'Escape') {
      if (panel.classList.contains('open')) toggleFilters(false);
      else if (e.target.id === 'q') { state.q = ''; e.target.value = ''; update(); e.target.blur(); }
    }
  });

  $('#surprise').addEventListener('click', () => {
    const pool = visible();
    const list = pool.length ? pool : cards;
    location.href = `styles/${list[Math.floor(Math.random() * list.length)].data.slug}.html`;
  });

  // Density
  const setDensity = (d) => {
    grid.classList.toggle('small', d === 'small');
    $$('[data-density]').forEach((b) => {
      const on = b.dataset.density === d;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    store.set('eas-density', d);
  };
  $$('[data-density]').forEach((b) => b.addEventListener('click', () => setDensity(b.dataset.density)));
  // A visitor's own choice beats the default.
  const ownDensity = store.get('eas-density');
  if ((ownDensity === 'small' || ownDensity === 'large') && ownDensity !== (document.body.dataset.density || 'large')) setDensity(ownDensity);

  // Shortlist stars
  function paintSaves() {
    const l = readList();
    $$('[data-save]').forEach((b) => {
      const on = l.includes(b.dataset.save);
      b.setAttribute('aria-pressed', String(on));
      b.title = on ? 'Remove from shortlist' : 'Add to shortlist';
    });
    paintCount();
  }
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-save]');
    if (!b) return;
    const l = readList();
    writeList(l.includes(b.dataset.save) ? l.filter((x) => x !== b.dataset.save) : [...l, b.dataset.save]);
    paintSaves();
  });
  // Coming back from a style page may need a repaint (browsers restore the old page from memory).
  addEventListener('pageshow', paintSaves);

  const cardsUi = wireCards(grid);
  addEventListener('pageshow', cardsUi.reset);

  readUrl();
  update(true);

  // ---- Cards ----
  // Shared by the browse page and the admin's preview. Everything hangs off the grid, so cards added later work too.
  // Settings come from the body's data attributes (src/render.mjs browseData): data-hover, data-skins, data-slide-ms, data-collage.
  function wireCards(grid) {
    const body = document.body;
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const coarse = matchMedia('(hover: none)');
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    const json = (s) => { try { return JSON.parse(s || '[]'); } catch { return []; } };
    const modeOf = (c) => {
      const m = c.dataset.hover || body.dataset.hover || 'motion';
      // A style without motion loops falls back to its images.
      return m === 'motion' && !json(c.dataset.loops).length ? 'images' : m;
    };
    const live = new Map(); // card -> { stop() } while its preview runs
    // Cards list their media by file name (src/card.mjs); the folder is the card image's.
    const dir = (c) => $('.card-main', c).getAttribute('src').replace(/[^/]*$/, '');

    // Small images: hovering one shows it large. Each is a link to the style, so a click opens it (Ctrl, Cmd or the middle
    // button open it in a new tab, as with any link); on touch a tap shows the image large instead.
    function show(c, i) {
      const s = json(c.dataset.slides)[i];
      if (!s) return;
      const main = $('.card-main', c);
      const src = dir(c) + s[0];
      if (main.getAttribute('src') !== src) main.src = src;
      main.classList.toggle('is-pixel', Boolean(s[1]));
      main.style.objectPosition = s[2] || '';
    }
    grid.addEventListener('mouseover', (e) => {
      const t = e.target.closest('.card-thumb');
      if (!t) return;
      const c = t.closest('.card');
      live.get(c)?.stop();
      live.set(c, { stop() {} });
      show(c, Number(t.dataset.slide));
    });
    grid.addEventListener('click', (e) => {
      const t = e.target.closest('.card-thumb');
      if (!t || !coarse.matches) return;
      e.preventDefault();
      show(t.closest('.card'), Number(t.dataset.slide));
    });

    // Motion: the style's loops play together in a grid over the card image. Built once, on the first hover.
    function collage(c) {
      const media = $('.card-media', c);
      let box = $('.card-collage', media);
      if (!box) {
        const n = Math.max(1, Math.min(Number(body.dataset.collage) || 4, 4));
        const loops = json(c.dataset.loops).slice(0, n);
        box = document.createElement('div');
        box.className = `card-collage n${loops.length}${$('.card-main', c).classList.contains('is-pixel') ? ' is-pixel' : ''}`;
        box.setAttribute('aria-hidden', 'true');
        for (const name of loops) {
          const src = `${dir(c)}${name}.c.mp4`;
          const poster = `${dir(c)}${name}.c.webp`;
          const v = document.createElement('video');
          v.muted = true;
          v.defaultMuted = true;
          v.loop = true;
          v.playsInline = true;
          v.preload = 'none';
          v.poster = poster;
          v.disablePictureInPicture = true;
          v.src = src;
          box.append(v);
        }
        media.append(box);
      }
      const vids = $$('video', box);
      let shown = false;
      const reveal = () => { if (!shown && live.has(c)) { shown = true; box.classList.add('on'); } };
      // Show the grid once its posters are in (or a moment has passed), so the card image never blinks to black.
      const posters = vids.map((v) => new Promise((ok) => { const i = new Image(); i.onload = ok; i.onerror = ok; i.src = v.poster; }));
      Promise.race([Promise.all(posters), new Promise((ok) => setTimeout(ok, 450))]).then(reveal);
      // Start the clips a moment apart, so four video decoders don't spin up in the same frame.
      if (!still.matches) {
        vids.forEach((v, i) => setTimeout(() => {
          if (live.has(c)) v.play().then(reveal, () => {});
        }, i * 90));
      }
      return { stop() { box.classList.remove('on'); for (const v of vids) v.pause(); } };
    }

    // Images: the card steps through its images, each one fading in over the last.
    function slideshow(c) {
      const at = dir(c);
      const slides = json(c.dataset.slides).map(([f, pixel, focus]) => [at + f, pixel, focus]);
      if (slides.length < 2 || still.matches) return { stop() {} };
      const ms = Number(body.dataset.slideMs) || 1300;
      for (const s of slides) { const i = new Image(); i.src = s[0]; }
      const media = $('.card-media', c);
      const top = document.createElement('img');
      top.className = 'card-fade';
      top.alt = '';
      top.setAttribute('aria-hidden', 'true');
      media.append(top);
      let i = 0;
      const next = () => {
        i = (i + 1) % slides.length;
        const [src, pixel, focus] = slides[i];
        // The image under the fade becomes the last one shown, so each step fades from what is on screen.
        const main = $('.card-main', c);
        if (top.classList.contains('in')) {
          main.src = top.src;
          main.className = `card-main${top.classList.contains('is-pixel') ? ' is-pixel' : ''}`;
          main.style.objectPosition = top.style.objectPosition;
        }
        top.classList.remove('in');
        top.src = src;
        top.classList.toggle('is-pixel', Boolean(pixel));
        top.style.objectPosition = focus || '';
        top.decode().catch(() => {}).then(() => { if (live.get(c) === run) requestAnimationFrame(() => top.classList.add('in')); });
      };
      const first = setTimeout(next, Math.min(450, ms / 2));
      const timer = setInterval(next, ms);
      const run = { stop() { clearInterval(timer); clearTimeout(first); top.remove(); } };
      return run;
    }

    function start(c) {
      if (!c || live.has(c)) return;
      const m = modeOf(c);
      // Register first: a preview checks it is still the live one before it shows anything.
      const run = { stop() {} };
      live.set(c, run);
      const real = m === 'motion' ? collage(c) : m === 'images' ? slideshow(c) : null;
      if (real) live.set(c, real);
    }
    function stop(c) {
      const run = live.get(c);
      live.delete(c);
      run?.stop();
      show(c, 0);
    }

    // Skins: hovering a card, or reaching it from the keyboard, puts on its skin, a small copy of its style's page
    // (assets/card-skins.css). The card's height is held first, so a skin that sets the words in a wider face can't make its row jump.
    const skins = () => body.dataset.skins !== 'off';
    const wear = (c) => {
      if (!c) return;
      start(c);
      if (!skins() || c.classList.contains('skinned')) return;
      c.style.height = `${c.getBoundingClientRect().height}px`;
      c.classList.add('skinned');
    };
    const shed = (c) => {
      stop(c);
      c.classList.remove('skinned');
      c.style.height = '';
    };
    const keyed = (c) => Boolean(c.querySelector(':focus-visible'));
    grid.addEventListener('pointerover', (e) => { if (e.pointerType !== 'touch') wear(e.target.closest('.card')); });
    grid.addEventListener('pointerout', (e) => {
      const c = e.target.closest('.card');
      if (c && !c.contains(e.relatedTarget) && !keyed(c)) shed(c);
    });
    grid.addEventListener('focusin', (e) => { if (e.target.matches(':focus-visible')) wear(e.target.closest('.card')); });
    grid.addEventListener('focusout', (e) => {
      const c = e.target.closest('.card');
      if (c && !c.contains(e.relatedTarget) && !c.matches(':hover')) shed(c);
    });
    // Skins can follow the pointer (a torch, a searchlight) through --mx and --my, measured from the card's top left.
    grid.addEventListener('pointermove', (e) => {
      const c = e.target.closest('.card.skinned');
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', `${Math.round(e.clientX - r.left)}px`);
      c.style.setProperty('--my', `${Math.round(e.clientY - r.top)}px`);
    });
    // A held height is stale after a resize, and a page restored from memory can come back with the card it left still skinned.
    const reset = () => $$('.card', grid).forEach((c) => {
      if (!c.classList.contains('skinned') && !live.has(c)) return;
      shed(c);
      if (c.matches(':hover')) wear(c);
    });
    addEventListener('resize', reset);

    // Titles preview each style's typeface, and skins use more of its faces. A face loads only as its card nears the screen.
    // On a screen with a mouse, a card near the screen also fetches its skin's faces and textures once the page is idle,
    // so the first hover shows the skin complete instead of swapping fonts in. Phones and Save-Data skip that.
    const base = document.body.classList.contains('card-preview') ? '../' : '';
    for (const href of ['assets/card-fonts.css', 'assets/card-skins.css']) {
      if ($(`link[href$="${href}"]`)) continue;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = base + href;
      document.head.append(link);
    }
    const warmOk = () => fine.matches && !navigator.connection?.saveData;
    const warm = (c) => {
      if (c.classList.contains('warm') || !warmOk()) return;
      c.classList.add('warm');
      // Italic too: a family without an italic face just resolves to the upright one it already has.
      for (const f of (c.dataset.faces || '').split('|').filter(Boolean)) {
        for (const style of ['', 'italic ']) document.fonts?.load(`${style}16px "${f}"`).catch(() => {});
      }
    };
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
    let settled = document.readyState === 'complete';
    const waiting = new Set();
    if (!settled) {
      addEventListener('load', () => setTimeout(() => {
        settled = true;
        waiting.forEach((c) => idle(() => warm(c)));
        waiting.clear();
      }, 800), { once: true });
    }
    const near = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('near');
        near.unobserve(e.target);
        if (settled) idle(() => warm(e.target)); else waiting.add(e.target);
      }
    }, { rootMargin: '500px' });
    const observe = () => $$('.card:not(.near)', grid).forEach((c) => near.observe(c));
    observe();
    return { reset, observe, wear, shed };
  }

  // ---- Shortlist ----
  function initShortlist() {
    const all = JSON.parse($('#sl-data').textContent);
    const bySlug = new Map(all.map((s) => [s.slug, s]));
    const shared = new URLSearchParams(location.search).get('s');
    let list = shared ? shared.split(',').filter((s) => bySlug.has(s)) : readList().filter((s) => bySlug.has(s));
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    function paint() {
      const box = $('#compare');
      box.innerHTML = list.map((slug) => {
        const s = bySlug.get(slug);
        return `<article class="col">
  <div class="col-imgs">${s.hero.map((h) => `<img src="${h.src}" alt="${esc(h.title)}" loading="lazy"${h.pixel ? ' class="is-pixel"' : ''}${h.focus ? ` style="object-position:${esc(h.focus)}"` : ''}>`).join('')}</div>
  <div class="col-body">
    <h2 class="col-title"><a href="styles/${s.slug}.html">${esc(s.name)}</a></h2>
    <p class="col-desc">${esc(s.description)}</p>
    <div class="col-pal" aria-hidden="true">${s.palette.map((c) => `<i style="background:${c}"></i>`).join('')}</div>
    <div class="col-row"><h3>Mood</h3><span>${esc(s.mood)}</span></div>
    <div class="col-row"><h3>Good for</h3><span>${esc(s.goodFor.join(', '))}</span></div>
    <div class="col-row"><h3>Medium and size</h3><span>${esc(s.medium.join(', '))} · ${esc(s.effort)}</span></div>
    <div class="col-row"><h3>Core elements</h3><ul>${s.core.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>
    <button class="tbtn col-remove" type="button" data-remove="${s.slug}">Remove</button>
  </div>
</article>`;
      }).join('');
      $('#sl-empty').hidden = list.length > 0;
      $('#sl-clear').hidden = !list.length;
      $('#sl-share').hidden = !list.length;
      paintCount();
    }
    $('#compare').addEventListener('click', (e) => {
      const b = e.target.closest('[data-remove]');
      if (!b) return;
      list = list.filter((s) => s !== b.dataset.remove);
      if (!shared) writeList(list);
      paint();
    });
    $('#sl-clear').addEventListener('click', () => {
      list = [];
      if (!shared) writeList(list);
      paint();
    });
    $('#sl-share').addEventListener('click', async (e) => {
      const url = `${location.origin}${location.pathname}?s=${list.join(',')}`;
      try { await navigator.clipboard.writeText(url); e.target.textContent = 'Link copied'; } catch { e.target.textContent = url; }
      setTimeout(() => { e.target.textContent = 'Copy link'; }, 1800);
    });
    paint();
  }

  // ---- Not found (404.html) ----
  // Suggests the styles whose address is closest to the one asked for: /styles/vaporwav.html finds Vaporwave.
  function initNotFound() {
    const all = JSON.parse($('#nf-data').textContent);
    const last = decodeURIComponent(location.pathname.split('/').filter(Boolean).pop() || '');
    const asked = last.replace(/\.html?$/i, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (asked.length < 3) return;
    const near = all.map(([slug, name, img]) => {
      const key = slug.replace(/-/g, '');
      const d = key.includes(asked) || asked.includes(key) ? 0 : osa(asked, key) / Math.max(asked.length, key.length);
      return { slug, name, img, d };
    }).filter((s) => s.d <= 0.4).sort((a, b) => a.d - b.d).slice(0, 3);
    if (!near.length) return;
    const list = $('#nf-cards');
    for (const s of near) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `styles/${s.slug}.html`;
      const img = document.createElement('img');
      img.src = s.img;
      img.alt = '';
      img.width = 640;
      img.height = 400;
      const span = document.createElement('span');
      span.textContent = s.name;
      a.append(img, span);
      li.append(a);
      list.append(li);
    }
    $('#nf-guess').hidden = false;
  }
})();
