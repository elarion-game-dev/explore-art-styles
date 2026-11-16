// City Pop: wraps the sleeve in an obi strip and puts a working turntable in the music section.
// Pick a track (or the record itself) and the tonearm swings over and the record turns at 33 1/3.
// Closing the player lifts the arm. Calm mode stops the turning, through the shared calm rules.
(() => {
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];

  // 1. The obi.
  const sleeve = $('.hero-text');
  if (sleeve) {
    const obi = document.createElement('div');
    obi.className = 'cp-obi';
    obi.setAttribute('aria-hidden', 'true');
    obi.innerHTML = '<span class="cp-obi-jp">シティ・ポップ</span><span class="cp-obi-en">City Pop</span><span class="cp-obi-copy">夏の終わりのロング・バケーション</span><span class="cp-obi-price"><b>LP</b>¥2,800</span>';
    sleeve.prepend(obi);
  }

  // 2. The turntable.
  const wrap = $('.music-wrap');
  const tracks = $('.tracks', wrap || document);
  if (!wrap || !tracks) return;
  const side = document.createElement('div');
  side.className = 'cp-side';
  side.innerHTML = `<div class="cp-deck">
      <button type="button" class="cp-platter" aria-label="Play the record"><span class="cp-disc"><span class="cp-label"><b>CITY POP</b><span>SIDE A</span><span>33&#8531;</span></span></span><span class="cp-sheen"></span></button>
      <div class="cp-arm" aria-hidden="true"><i></i></div>
      <div class="cp-knob" aria-hidden="true">33 <i></i> 45</div>
    </div>
    <p class="cp-now" aria-live="polite"></p>`;
  tracks.before(side);
  const deck = $('.cp-deck', side);
  const platter = $('.cp-platter', side);
  const now = $('.cp-now', side);
  const player = $('[data-player]');
  let current = null;

  function start(btn) {
    current = btn;
    deck.classList.add('is-on');
    platter.setAttribute('aria-label', 'Stop the record');
    now.textContent = btn.dataset.track || '';
  }
  function stop() {
    deck.classList.remove('is-on');
    platter.setAttribute('aria-label', 'Play the record');
    now.textContent = '';
  }
  // Only tracks that play in the dock turn the record; the rest open on YouTube (see page.js).
  const plays = (b) => location.protocol !== 'file:' && !('noembed' in b.dataset);
  for (const b of $$('.track-btn', tracks)) b.addEventListener('click', () => { if (plays(b)) start(b); });
  platter.addEventListener('click', () => {
    if (deck.classList.contains('is-on')) {
      const close = $('[data-player-close]');
      if (player && !player.hidden && close) close.click();
      stop();
      return;
    }
    (current || $$('.track-btn', tracks).find(plays) || $('.track-btn', tracks))?.click();
  });
  // The shared player can also be closed from its own button.
  if (player) new MutationObserver(() => { if (player.hidden) stop(); }).observe(player, { attributes: true, attributeFilter: ['hidden'] });
})();
