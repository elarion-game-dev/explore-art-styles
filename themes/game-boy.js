// Game Boy: adds a working control pad under the screen.
(() => {
  const root = document.documentElement;
  const screens = ['dmg', 'pocket', 'light'];
  const names = { dmg: 'DMG GREEN', pocket: 'POCKET GREY', light: 'LIGHT TEAL' };
  const read = () => { try { return localStorage.getItem('eas-gb-screen'); } catch { return null; } };
  const write = (v) => { try { localStorage.setItem('eas-gb-screen', v); } catch { /* private window */ } };
  const setScreen = (s) => { if (s === 'dmg') delete root.dataset.lcd; else root.dataset.lcd = s; };
  setScreen(screens.includes(read()) ? read() : 'dmg');

  const deck = document.createElement('div');
  deck.className = 'gb-deck';
  deck.innerHTML = `
    <div class="gb-word">GAME BOY <small>style page. D-pad left and right change style. SELECT changes the screen.</small></div>
    <div class="gb-dpad" role="group" aria-label="Directional pad">
      <button class="gb-up" type="button" aria-label="Previous section">▲</button>
      <button class="gb-left" type="button" aria-label="Previous style">◄</button>
      <button class="gb-mid" type="button" tabindex="-1" aria-hidden="true"></button>
      <button class="gb-right" type="button" aria-label="Next style">►</button>
      <button class="gb-down" type="button" aria-label="Next section">▼</button>
    </div>
    <div class="gb-sys">
      <button class="gb-select" type="button" aria-label="Change screen colour">SELECT</button>
      <button class="gb-start" type="button" aria-label="Back to top">START</button>
    </div>
    <div class="gb-ab">
      <button class="gb-b" type="button" aria-label="Back to all styles">B</button>
      <button class="gb-a" type="button" aria-label="Next section">A</button>
    </div>`;
  document.querySelector('.page').after(deck);

  const label = document.createElement('div');
  label.className = 'gb-lcd-label';
  label.setAttribute('aria-live', 'polite');
  document.body.append(label);
  let t;
  const flash = (msg) => {
    label.textContent = msg;
    label.classList.add('on');
    clearTimeout(t);
    t = setTimeout(() => label.classList.remove('on'), 1400);
  };

  const sections = () => [...document.querySelectorAll('.hero, .sec')];
  const moveSection = (dir) => {
    const list = sections();
    const y = scrollY + 90;
    const tops = list.map((s) => s.getBoundingClientRect().top + scrollY);
    let i = tops.findLastIndex((top) => top <= y);
    i = Math.min(list.length - 1, Math.max(0, i + dir));
    scrollTo({ top: tops[i] - 56, behavior: root.dataset.calm ? 'auto' : 'smooth' });
  };

  const on = (cls, fn) => deck.querySelector(cls).addEventListener('click', fn);
  on('.gb-left', () => document.querySelector('a[rel=prev]').click());
  on('.gb-right', () => document.querySelector('a[rel=next]').click());
  on('.gb-up', () => moveSection(-1));
  on('.gb-down', () => moveSection(1));
  on('.gb-a', () => moveSection(1));
  on('.gb-b', () => { location.href = '../index.html'; });
  on('.gb-start', () => scrollTo({ top: 0, behavior: root.dataset.calm ? 'auto' : 'smooth' }));
  on('.gb-select', () => {
    const now = root.dataset.lcd || 'dmg';
    const next = screens[(screens.indexOf(now) + 1) % screens.length];
    setScreen(next);
    write(next);
    flash(names[next]);
  });
})();
