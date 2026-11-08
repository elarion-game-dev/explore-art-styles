// Cyberpop: the contents work like an anime game's pause menu. The current section is marked as you scroll,
// and picking an item slashes the screen with a cut-in before jumping there. Calm mode jumps straight away.
(() => {
  const root = document.documentElement;
  const isCalm = () => root.dataset.calm === '1' || !document.querySelector('.cp-slash');
  const links = [...document.querySelectorAll('.toc a[href^="#"]')];
  const slash = document.querySelector('.cp-slash');
  const label = slash && slash.querySelector('b');
  if (!links.length) return;

  // Mark the section on screen.
  const targets = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
  function mark() {
    const line = innerHeight * 0.35;
    let here = null;
    for (const t of targets) if (t.getBoundingClientRect().top <= line) here = t;
    for (const a of links) {
      const on = here && a.hash === `#${here.id}`;
      a.classList.toggle('is-here', !!on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    }
  }
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; mark(); });
  }, { passive: true });
  addEventListener('resize', mark);
  mark();

  // The slash. One cut-in per pick, never more than one at a time.
  let busy = false;
  function jump(target) {
    const top = target.getBoundingClientRect().top + scrollY - 70;
    scrollTo({ top, behavior: 'instant' });
    history.replaceState(null, '', `#${target.id}`);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  for (const a of links) {
    a.addEventListener('click', (e) => {
      const target = document.getElementById(a.hash.slice(1));
      if (!target) return;
      e.preventDefault();
      if (isCalm() || !slash || getComputedStyle(slash).display === 'none') { jump(target); return; }
      if (busy) return;
      busy = true;
      label.textContent = a.textContent;
      slash.classList.remove('run');
      void slash.offsetWidth;
      slash.classList.add('run');
      setTimeout(() => jump(target), 330);
      setTimeout(() => { slash.classList.remove('run'); busy = false; mark(); }, 800);
    });
  }
  addEventListener('eas:calm', () => { if (slash) slash.classList.remove('run'); busy = false; });
})();
