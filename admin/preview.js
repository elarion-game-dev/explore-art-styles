// The admin's card preview. admin.js renders cards with the site's own card module and posts them here;
// this page shows them with the site's own styles and hover script (assets/browse.js), so the preview behaves like the site.
(() => {
  const grid = document.getElementById('grid');
  const intro = document.getElementById('intro');
  const body = document.body;

  addEventListener('message', (e) => {
    if (e.origin !== location.origin || e.source !== parent) return;
    const m = e.data || {};
    if (m.type === 'render') {
      // The markup comes from src/card.mjs, which escapes every value it writes.
      grid.innerHTML = m.cards;
      grid.classList.toggle('small', m.density === 'small');
      grid.classList.toggle('many', Boolean(m.many));
      for (const [k, v] of Object.entries(m.browse || {})) body.dataset[k] = String(v);
      intro.hidden = !m.intro;
      if (m.intro) {
        intro.querySelector('h1').textContent = m.intro.title;
        const p = intro.querySelector('p');
        p.textContent = m.intro.text;
        p.hidden = !m.intro.text;
      }
      window.EASCards?.observe();
      if (m.hover) for (const c of grid.querySelectorAll('.card')) window.EASCards?.wear(c);
    } else if (m.type === 'hover') {
      for (const c of grid.querySelectorAll('.card')) {
        if (m.on) window.EASCards?.wear(c); else window.EASCards?.shed(c);
      }
    }
  });
  // Links would leave the preview; open the live page in a new tab instead.
  grid.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    window.open(a.href, '_blank', 'noopener');
  });
  parent.postMessage({ type: 'preview-ready' }, location.origin);
})();
