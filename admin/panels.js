// The admin's panels. Each returns DOM nodes bound to the settings draft through the app object (admin.js).

import { DENSITIES, HOVER_MODES, LIMITS, SORTS, styleDefaults } from './lib/settings.js';
import { card, h, icon, link, note, range, revert, select, text, toast, toggle } from './ui.js';

function head(title, description) {
  return h('header', { class: 'panel-head' }, h('h2', {}, title), description ? h('p', {}, description) : null);
}

const media = (slug, file) => `../media/${slug}/${file}`;
const small = (file) => file.replace(/\.webp$/, '.s.webp');

// --- overview -----------------------------------------------------------------------------------

function overview(app) {
  const n = app.normalized();
  const styles = app.catalog.styles;
  const custom = styles.filter((s) => n.styles[s.slug]).length;
  const hidden = styles.filter((s) => n.styles[s.slug]?.published === false);
  return [
    head('Overview', 'Settings for the browse page and its cards. The words, images and references of each style live in the content files; this page chooses how the cards present them.'),
    h(
      'div',
      { class: 'stat-row' },
      stat(String(styles.length - hidden.length), 'styles published'),
      stat(String(custom), 'styles with their own card settings'),
      stat(HOVER_MODES[n.browse.hoverPreview].split(':')[0], 'on hover')
    ),
    hidden.length ? note(`Hidden from the site: ${hidden.map((s) => s.name).join(', ')}.`, 'warn') : null,
    card(
      'How publishing works',
      null,
      h(
        'ol',
        { class: 'steps' },
        h('li', {}, 'Change settings here. The preview on the right uses the site\'s own card code, so it shows what visitors will see.'),
        h('li', {}, 'Press ', h('strong', {}, 'Publish'), ' (Ctrl+S). That saves one commit to ', h('code', { class: 'inline-code' }, 'content/settings.json'), ' in the source repository.'),
        h('li', {}, 'GitHub then checks the content, builds the site and puts it live, usually within two minutes. The pill in the top bar follows it.')
      ),
      h(
        'div',
        { class: 'link-grid' },
        link(app.siteUrl, 'Live site'),
        link(`https://github.com/${app.repo.owner}/${app.repo.repo}/actions`, 'Build history'),
        link(`https://github.com/${app.repo.owner}/${app.repo.repo}/blob/${app.repo.branch}/content/settings.json`, 'Settings file on GitHub')
      )
    ),
    card(
      'Shortcuts',
      null,
      h('ul', { class: 'bullet-list' }, h('li', {}, 'Ctrl+S publishes.'), h('li', {}, 'Ctrl+Z and Ctrl+Shift+Z undo and redo every change, including resets and imports.'), h('li', {}, 'Revert, next to a changed setting, puts back its published value.'))
    ),
  ];
}

function stat(value, label) {
  return h('div', { class: 'stat' }, h('strong', {}, value), h('span', { class: 'muted' }, label));
}

// --- browse page --------------------------------------------------------------------------------

function browse(app) {
  return [
    head('Browse page', 'The words at the top of the browse page, and how it starts out for a new visitor.'),
    card(
      'Intro',
      null,
      text(app, 'browse.introTitle', { label: 'Heading', maxlength: LIMITS.introTitle, counter: LIMITS.introTitle }),
      text(app, 'browse.introText', { label: 'Text', multiline: true, rows: 3, maxlength: LIMITS.introText, counter: LIMITS.introText, help: '{count} becomes the number of published styles. Leave empty for no text.' })
    ),
    card(
      'Starting view',
      'Visitors can change both; the card size they pick is remembered in their browser.',
      select(app, 'browse.defaultSort', { label: 'Sort', options: SORTS }),
      select(app, 'browse.defaultDensity', { label: 'Card size', options: DENSITIES })
    ),
  ];
}

// --- card hover ---------------------------------------------------------------------------------

function hover(app) {
  const mode = app.get('browse.hoverPreview');
  return [
    head('Card hover', 'What a card does when someone points at it, or reaches it with the keyboard. Touch screens show the card as it is.'),
    card('Preview', null, choiceCards(app, 'browse.hoverPreview', HOVER_MODES), revertRow(app, 'browse.hoverPreview')),
    mode === 'motion'
      ? card('Motion collage', 'Each card plays small copies of its motion loops. Pick which loops, and their order, per style under Styles.', range(app, 'browse.collageSize', { label: 'Loops in the collage', min: 1, max: LIMITS.collage, step: 1, format: (v) => (v === 1 ? '1 loop' : `${v} loops`) }))
      : null,
    mode === 'images'
      ? card('Image slideshow', 'Each card steps through its card images. Pick which images, and their order, per style under Styles.', range(app, 'browse.slideMs', { label: 'Time per image', min: LIMITS.slideMs[0], max: LIMITS.slideMs[1], step: 100, format: (v) => `${(v / 1000).toFixed(1)} s` }))
      : null,
    card(
      'Style skin',
      null,
      toggle(app, 'browse.hoverSkin', { label: 'Turn the card into its style', help: 'The card takes on its style\'s colours, type and frame, like a small copy of its page.' })
    ),
    note('Visitors who ask their system for reduced motion see the collage as still frames and no slideshow.'),
  ];
}

/** Big radio buttons, one per option: { value: 'Label: description' }. */
function choiceCards(app, path, options) {
  const current = app.get(path);
  const name = `choice-${path}`;
  return h(
    'div',
    { class: 'choice-cards', role: 'radiogroup' },
    Object.entries(options).map(([value, labelText]) => {
      const [label, desc] = labelText.split(': ');
      const input = h('input', { type: 'radio', name, value, checked: value === current, class: 'visually-hidden' });
      input.addEventListener('change', () => {
        app.set(path, value);
        app.rerender();
      });
      return h('label', { class: 'choice-card' }, input, h('span', { class: 'choice-label' }, label), desc ? h('span', { class: 'choice-desc muted' }, desc) : null);
    })
  );
}

function revertRow(app, path) {
  return h('div', { class: 'revert-row has-revert' }, revert(app, path));
}

// --- styles -------------------------------------------------------------------------------------

function styles(app) {
  if (app.style && app.bySlug.has(app.style)) return styleEditor(app, app.style);
  return styleList(app);
}

function styleList(app) {
  const n = app.normalized();
  const all = app.catalog.styles;
  const q = app.filter.q.trim().toLowerCase();
  const shown = all.filter((s) => {
    const own = n.styles[s.slug];
    if (app.filter.show === 'custom' && !own) return false;
    if (app.filter.show === 'hidden' && own?.published !== false) return false;
    return !q || `${s.name} ${s.family}`.toLowerCase().includes(q);
  });
  const search = h('input', { type: 'search', class: 'input', placeholder: 'Find a style…', value: app.filter.q, 'aria-label': 'Find a style' });
  search.addEventListener('input', () => {
    app.filter.q = search.value;
    const pos = search.selectionStart;
    app.rerender();
    const again = document.querySelector('.style-search input');
    again?.focus();
    again?.setSelectionRange(pos, pos);
  });
  const filterButton = (value, label) =>
    h('button', { type: 'button', class: 'seg-btn', 'aria-pressed': String(app.filter.show === value), onclick: () => { app.filter.show = value; app.rerender(); } }, label);

  return [
    head('Styles', 'Pick a style to choose its card images, focal points, motion loops and hover, or to hide it from the site.'),
    h('div', { class: 'style-tools' }, h('label', { class: 'style-search' }, icon('search'), search), h('div', { class: 'seg' }, filterButton('all', 'All'), filterButton('custom', 'Customised'), filterButton('hidden', 'Hidden'))),
    shown.length
      ? h(
          'ul',
          { class: 'style-grid' },
          shown.map((s) => {
            const r = app.resolved(s.slug);
            const first = r.images[0];
            const img = h('img', { src: media(s.slug, small(first)), alt: '', loading: 'lazy', width: 160, height: 100 });
            if (r.focus[first]) img.style.objectPosition = r.focus[first];
            const own = n.styles[s.slug];
            return h(
              'li',
              {},
              h(
                'button',
                { type: 'button', class: `style-tile${own?.published === false ? ' is-hidden' : ''}`, onclick: () => app.goto('styles', s.slug) },
                img,
                h('span', { class: 'style-tile-name' }, s.name),
                h('span', { class: 'style-tile-meta muted' }, s.family),
                own ? h('span', { class: 'pill' }, own.published === false ? 'Hidden' : 'Customised') : null
              )
            );
          })
        )
      : h('p', { class: 'muted' }, 'No style matches.'),
  ];
}

function styleEditor(app, slug) {
  const s = app.bySlug.get(slug);
  const all = app.catalog.styles;
  const i = all.findIndex((x) => x.slug === slug);
  const prev = all[(i - 1 + all.length) % all.length];
  const next = all[(i + 1) % all.length];
  const r = app.resolved(slug);
  const def = styleDefaults(app.entries[slug]);

  const published = h('input', { type: 'checkbox', class: 'switch-input', role: 'switch', checked: r.published, id: `pub-${slug}` });
  published.addEventListener('change', () => {
    app.setStyle(slug, 'published', published.checked);
    app.rerender();
  });

  return [
    h(
      'div',
      { class: 'editor-nav' },
      h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => app.goto('styles') }, icon('left'), 'All styles'),
      h(
        'div',
        { class: 'editor-nav-step' },
        h('button', { type: 'button', class: 'icon-btn', title: `Previous: ${prev.name}`, 'aria-label': `Previous style: ${prev.name}`, onclick: () => app.goto('styles', prev.slug) }, icon('left')),
        h('button', { type: 'button', class: 'icon-btn', title: `Next: ${next.name}`, 'aria-label': `Next style: ${next.name}`, onclick: () => app.goto('styles', next.slug) }, icon('right'))
      )
    ),
    head(s.name, `${s.family} · ${s.description}`),
    h('div', { class: 'button-row' }, link(`${app.siteUrl}styles/${slug}.html`, 'Open its page'), app.isCustom(slug) ? h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => app.resetStyle(slug) }, icon('refresh'), 'Reset this style') : null),
    card(
      'On the site',
      null,
      h(
        'div',
        { class: 'field field-toggle has-revert' },
        h('label', { class: 'switch', for: `pub-${slug}` }, published, h('span', { class: 'switch-track', 'aria-hidden': 'true' }), h('span', { class: 'switch-label' }, 'Published')),
        h('p', { class: 'field-help' }, r.published ? 'Visitors can find this style.' : 'Hidden: no card, no page, and other pages leave out their links to it.'),
        revert(app, `styles.${slug}.published`)
      )
    ),
    imagesCard(app, s, r, def),
    focusCard(app, s, r, def),
    loopsCard(app, s, r),
    card(
      'Hover',
      null,
      h(
        'div',
        { class: 'field has-revert' },
        styleSelect(app, slug, 'hover', r.hover, { default: `Site setting (${HOVER_MODES[app.normalized().browse.hoverPreview].split(':')[0]})`, ...Object.fromEntries(Object.entries(HOVER_MODES).map(([k, v]) => [k, v.split(':')[0]])) }, 'What this card does on hover'),
        revert(app, `styles.${slug}.hover`)
      )
    ),
  ];
}

function styleSelect(app, slug, key, current, options, label) {
  const id = `sel-${slug}-${key}`;
  const input = h('select', { id, class: 'input' }, Object.entries(options).map(([v, t]) => h('option', { value: v, selected: v === current }, t)));
  input.addEventListener('change', () => {
    app.setStyle(slug, key, input.value);
    app.rerender();
  });
  return [h('label', { class: 'field-label', for: id }, label), input];
}

// Card images: up to four, in order. The first is the card image; the others sit under it and join the slideshow.
function imagesCard(app, s, r, def) {
  const slug = s.slug;
  const chosen = r.images;
  const set = (list) => {
    app.setStyle(slug, 'images', list);
    app.rerender();
  };
  const move = (from, to) => {
    const list = [...chosen];
    const [x] = list.splice(from, 1);
    list.splice(to, 0, x);
    set(list);
  };
  const byFile = new Map([...s.hero, ...s.gallery].map((img) => [img.file, img]));
  const strip = h(
    'ol',
    { class: 'pick-strip' },
    chosen.map((file, i) => {
      const img = byFile.get(file);
      const pic = h('img', { src: media(slug, small(file)), alt: img?.title || file, width: 160, height: 100 });
      if (r.focus[file]) pic.style.objectPosition = r.focus[file];
      const li = h(
        'li',
        { class: `pick${i === 0 ? ' is-first' : ''}`, draggable: 'true', dataset: { index: String(i) } },
        h('span', { class: 'pick-badge' }, i === 0 ? 'Card image' : String(i + 1)),
        pic,
        h('span', { class: 'pick-title' }, img?.title || file),
        h(
          'div',
          { class: 'pick-actions' },
          h('button', { type: 'button', class: 'icon-btn', title: 'Move left', 'aria-label': `Move ${img?.title || file} left`, disabled: i === 0, onclick: () => move(i, i - 1) }, icon('left')),
          h('button', { type: 'button', class: 'icon-btn', title: 'Move right', 'aria-label': `Move ${img?.title || file} right`, disabled: i === chosen.length - 1, onclick: () => move(i, i + 1) }, icon('right')),
          i ? h('button', { type: 'button', class: 'icon-btn', title: 'Make it the card image', 'aria-label': `Make ${img?.title || file} the card image`, onclick: () => move(i, 0) }, icon('star')) : null,
          h('button', { type: 'button', class: 'icon-btn', title: 'Set its focal point', 'aria-label': `Set the focal point of ${img?.title || file}`, onclick: () => { focusFile.set(slug, file); app.rerender(); } }, icon('focus')),
          chosen.length > 1 ? h('button', { type: 'button', class: 'icon-btn danger', title: 'Remove', 'aria-label': `Remove ${img?.title || file}`, onclick: () => set(chosen.filter((f) => f !== file)) }, icon('close')) : null
        )
      );
      // Drag one onto another to put it there.
      li.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', String(i)); e.dataTransfer.effectAllowed = 'move'; });
      li.addEventListener('dragover', (e) => { e.preventDefault(); li.classList.add('drop'); });
      li.addEventListener('dragleave', () => li.classList.remove('drop'));
      li.addEventListener('drop', (e) => {
        e.preventDefault();
        const from = Number(e.dataTransfer.getData('text/plain'));
        if (Number.isInteger(from) && from !== i) move(from, i);
      });
      return li;
    })
  );
  const library = (title, list) =>
    list.length
      ? h(
          'div',
          { class: 'library' },
          h('h4', { class: 'subhead' }, title),
          h(
            'div',
            { class: 'library-grid' },
            list.map((img) => {
              const on = chosen.includes(img.file);
              const pic = h('img', { src: media(slug, small(img.file)), alt: '', loading: 'lazy', width: 160, height: 100 });
              return h(
                'button',
                {
                  type: 'button',
                  class: `library-item${on ? ' on' : ''}`,
                  'aria-pressed': String(on),
                  title: `${img.title}${img.kind ? ` · ${img.kind}` : ''}${img.year ? ` · ${img.year}` : ''}`,
                  onclick: () => {
                    if (on) {
                      if (chosen.length > 1) set(chosen.filter((f) => f !== img.file));
                      else toast('A card needs at least one image.', 'error');
                    } else if (chosen.length < LIMITS.cardImages) set([...chosen, img.file]);
                    else toast(`Up to ${LIMITS.cardImages} images. Remove one first.`, 'error');
                  },
                },
                pic,
                on ? h('span', { class: 'library-mark' }, String(chosen.indexOf(img.file) + 1)) : null
              );
            })
          )
        )
      : null;
  return card(
    'Card images',
    `The first is the card image. The others sit under it, and the slideshow steps through all of them. Up to ${LIMITS.cardImages}; drag to reorder.`,
    h('div', { class: 'field has-revert' }, strip, revert(app, `styles.${slug}.images`)),
    JSON.stringify(chosen) !== JSON.stringify(def.images) ? h('p', { class: 'field-help' }, 'Default: the page\'s four main images, in order.') : null,
    library('Main images', s.hero),
    library('Gallery', s.gallery)
  );
}

// Which image's focal point is being edited, per style. Starts on the card image.
const focusFile = new Map();

function focusCard(app, s, r, def) {
  const slug = s.slug;
  let file = focusFile.get(slug);
  if (!r.images.includes(file)) file = r.images[0];
  const img = [...s.hero, ...s.gallery].find((x) => x.file === file);
  const current = r.focus[file] || '50% 50%';
  const [fx, fy] = current.split(' ').map((v) => parseFloat(v));

  const pic = h('img', { src: media(slug, file.replace(/\.webp$/, '.t.webp')), alt: img?.title || '', draggable: 'false' });
  const dot = h('span', { class: 'focus-dot', 'aria-hidden': 'true' });
  dot.style.left = `${fx}%`;
  dot.style.top = `${fy}%`;
  const frame = h('div', { class: `focus-frame${img?.pixel ? ' is-pixel' : ''}`, tabindex: '0', role: 'slider', 'aria-label': 'Focal point. Arrow keys move it.', 'aria-valuetext': current }, pic, dot);
  const crops = [['Large card', 'crop-card'], ['Small image', 'crop-thumb'], ['Related styles', 'crop-wide']].map(([label, cls]) => {
    const im = h('img', { src: media(slug, file.replace(/\.webp$/, '.t.webp')), alt: '' });
    im.style.objectPosition = current;
    return h('figure', { class: `crop ${cls}${img?.pixel ? ' is-pixel' : ''}` }, im, h('figcaption', { class: 'muted' }, label));
  });

  const label = h('span', { class: 'muted mono', 'aria-live': 'polite' }, current);
  const setFocus = (x, y, commit = true) => {
    const v = `${Math.round(Math.min(100, Math.max(0, x)))}% ${Math.round(Math.min(100, Math.max(0, y)))}%`;
    label.textContent = v;
    dot.style.left = v.split(' ')[0];
    dot.style.top = v.split(' ')[1];
    frame.setAttribute('aria-valuetext', v);
    for (const c of crops) c.querySelector('img').style.objectPosition = v;
    if (commit) app.setStyle(slug, 'focus', { ...(app.normalized().styles[slug]?.focus || {}), [file]: v });
  };
  const fromEvent = (e) => {
    const b = pic.getBoundingClientRect();
    setFocus(((e.clientX - b.left) / b.width) * 100, ((e.clientY - b.top) / b.height) * 100);
  };
  let dragging = false;
  frame.addEventListener('pointerdown', (e) => { dragging = true; frame.setPointerCapture(e.pointerId); fromEvent(e); });
  frame.addEventListener('pointermove', (e) => { if (dragging) fromEvent(e); });
  frame.addEventListener('pointerup', () => { dragging = false; app.rerender(); });
  frame.addEventListener('keydown', (e) => {
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!d) return;
    e.preventDefault();
    const [x, y] = (frame.getAttribute('aria-valuetext') || current).split(' ').map((v) => parseFloat(v));
    const k = e.shiftKey ? 10 : 1;
    setFocus(x + d[0] * k, y + d[1] * k);
  });

  const tabs = h(
    'div',
    { class: 'seg' },
    r.images.map((f, i) => h('button', { type: 'button', class: 'seg-btn', 'aria-pressed': String(f === file), onclick: () => { focusFile.set(slug, f); app.rerender(); } }, i === 0 ? 'Card image' : `Image ${i + 1}`))
  );
  const own = app.normalized().styles[slug]?.focus?.[file];
  return card(
    'Focal point',
    'Click or drag on the image to choose the part that stays in view when it is cropped. Arrow keys move it by 1%, with Shift by 10%.',
    tabs,
    h('div', { class: 'focus-layout' }, frame, h('div', { class: 'crops' }, crops)),
    h(
      'div',
      { class: 'button-row' },
      label,
      h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => setFocus(50, 50) }, 'Centre'),
      own || def.focus[file]
        ? h('button', {
            type: 'button',
            class: 'btn btn-ghost btn-sm',
            onclick: () => {
              const rest = { ...(app.normalized().styles[slug]?.focus || {}) };
              delete rest[file];
              app.setStyle(slug, 'focus', rest);
              app.rerender();
            },
          }, def.focus[file] ? `Back to the default (${def.focus[file]})` : 'Back to the default')
        : null
    ),
    h('div', { class: 'has-revert revert-row' }, revert(app, `styles.${slug}.focus`))
  );
}

// Motion loops: which play in the card's collage, in order.
function loopsCard(app, s, r) {
  const slug = s.slug;
  const size = app.normalized().browse.collageSize;
  const chosen = r.loops;
  const set = (list) => {
    app.setStyle(slug, 'loops', list);
    app.rerender();
  };
  const rows = s.loops.map((l) => {
    const at = chosen.indexOf(l.file);
    const on = at > -1;
    const box = h('input', { type: 'checkbox', checked: on, 'aria-label': `Play ${l.title} in the collage` });
    box.addEventListener('change', () => {
      if (box.checked) {
        if (chosen.length >= LIMITS.collage) {
          box.checked = false;
          toast(`Up to ${LIMITS.collage} loops. Untick one first.`, 'error');
          return;
        }
        set([...chosen, l.file]);
      } else if (chosen.length > 1) set(chosen.filter((f) => f !== l.file));
      else {
        box.checked = true;
        toast('The collage needs at least one loop.', 'error');
      }
    });
    const move = (d) => {
      const list = [...chosen];
      list.splice(at, 1);
      list.splice(at + d, 0, l.file);
      set(list);
    };
    return {
      order: on ? at : 99 + s.loops.indexOf(l),
      el: h(
        'li',
        { class: `loop-row${on ? ' on' : ''}${on && at >= size ? ' over' : ''}` },
        h('label', { class: 'loop-check' }, box, h('img', { src: media(slug, l.file.replace(/\.mp4$/, '.c.webp')), alt: '', width: 96, height: 60, loading: 'lazy' })),
        h('div', { class: 'loop-text' }, h('strong', {}, `${on ? `${at + 1}. ` : ''}${l.title}`), l.note ? h('span', { class: 'muted' }, l.note) : null, on && at >= size ? h('span', { class: 'muted' }, `Not shown: the collage plays ${size}.`) : null),
        on
          ? h(
              'div',
              { class: 'row-buttons' },
              h('button', { type: 'button', class: 'icon-btn', title: 'Move up', 'aria-label': 'Move up', disabled: at === 0, onclick: () => move(-1) }, icon('up')),
              h('button', { type: 'button', class: 'icon-btn', title: 'Move down', 'aria-label': 'Move down', disabled: at === chosen.length - 1, onclick: () => move(1) }, icon('down'))
            )
          : null
      ),
    };
  });
  return card(
    'Motion collage',
    `The loops the card plays together on hover, in order. The collage shows ${size === 1 ? 'the first' : `the first ${size}`} (set under Card hover).`,
    h('div', { class: 'field has-revert' }, h('ol', { class: 'loop-list' }, rows.sort((a, b) => a.order - b.order).map((x) => x.el)), revert(app, `styles.${slug}.loops`))
  );
}

// --- history ------------------------------------------------------------------------------------

function history(app) {
  const list = h('div', { class: 'history' }, h('p', { class: 'muted' }, 'Loading versions…'));
  app
    .loadHistory()
    .then((commits) => {
      if (!commits.length) return list.replaceChildren(h('p', { class: 'muted' }, 'No published versions yet.'));
      list.replaceChildren(
        ...commits.map((c, i) =>
          h(
            'div',
            { class: 'history-row' },
            h('div', { class: 'history-text' }, h('strong', {}, c.commit.message.split('\n')[0]), h('span', { class: 'muted' }, `${new Date(c.commit.author.date).toLocaleString()} · ${c.author?.login ?? c.commit.author.name}`)),
            i === 0 ? h('span', { class: 'pill' }, 'Current') : h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => app.loadVersion(c.sha) }, 'Load into editor')
          )
        )
      );
    })
    .catch((error) => list.replaceChildren(note(`Couldn't load history: ${error.message}`, 'warn')));

  const importInput = h('input', { type: 'file', accept: 'application/json,.json', class: 'visually-hidden', id: 'import-file' });
  importInput.addEventListener('change', () => {
    const file = importInput.files?.[0];
    importInput.value = '';
    if (file) app.importJson(file);
  });

  return [
    head('History & backup', 'Every publish is a git commit. Load an older version into the editor, check it in the preview, then publish to restore it.'),
    card('Versions', null, list),
    card(
      'Backup',
      null,
      h(
        'div',
        { class: 'button-row' },
        h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => app.exportJson() }, icon('download'), 'Download settings (.json)'),
        h('label', { class: 'btn btn-ghost', for: 'import-file' }, icon('upload'), 'Import settings'),
        importInput,
        h('button', { type: 'button', class: 'btn btn-ghost danger-text', onclick: () => app.resetDefaults() }, icon('refresh'), 'Reset to defaults')
      )
    ),
  ];
}

export const PANELS = [
  { id: 'overview', label: 'Overview', icon: 'overview', render: overview },
  { id: 'styles', label: 'Styles', icon: 'grid', render: styles },
  { id: 'hover', label: 'Card hover', icon: 'pointer', render: hover },
  { id: 'browse', label: 'Browse page', icon: 'sections', render: browse },
  { id: 'history', label: 'History & backup', icon: 'history', render: history },
];
