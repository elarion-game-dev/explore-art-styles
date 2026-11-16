// One browse card. The build renders every card with this, and the admin renders its preview with the same code,
// so what the preview shows is what the site will show. Browser-safe: no Node imports.
import { esc, colourBucket, ICON } from './html.js';

export function nameParts(s) {
  const [main, ...rest] = s.name.split(' / ');
  return { main, sub: rest.join(' / ') };
}

const thumbOf = (file) => file.replace(/\.webp$/, '.t.webp');
// JSON in a single-quoted attribute only needs &, ' and < escaped, which keeps the browse page small.
const attrJson = (v) => JSON.stringify(v).replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/</g, '&lt;');
const smallOf = (file) => file.replace(/\.webp$/, '.s.webp');

/**
 * The media a card uses, from the style and its resolved settings (src/settings.mjs resolveStyle):
 * images in order (the first is the card image), the loops its collage plays, and its own hover mode if it has one.
 */
export function cardView(s, resolved) {
  const byFile = new Map([...(s.hero || []), ...(s.gallery || [])].map((i) => [i.file, i]));
  const images = resolved.images.map((f) => byFile.get(f)).filter(Boolean).map((i) => ({
    file: i.file, title: i.title || '', pixel: Boolean(i.pixel), focus: resolved.focus[i.file] || '',
  }));
  const byLoop = new Map((s.loops || []).map((l) => [l.file, l]));
  const loops = resolved.loops.map((f) => byLoop.get(f)).filter(Boolean).map((l) => ({
    mp4: l.file.replace(/\.mp4$/, '.c.mp4'), poster: l.file.replace(/\.mp4$/, '.c.webp'), title: l.title || '',
  }));
  return { images, loops, hover: resolved.hover };
}

/**
 * The words a search looks through, in four fields that rank in this order (browse.js): the name; the labels (family, mood,
 * technique, medium, size, genres, mood words, tagline, core ideas); the references (game, film and image titles, and who made
 * the films and art); and the description. The style's longer guide text is in assets/search-text.json (guideText).
 */
export function searchFields(s) {
  const refs = [...(s.references?.games || []).map((g) => g.title), ...(s.references?.media || []).flatMap((m) => [m.title, m.type]), ...(s.hero || []).map((h) => h.title)];
  const labels = [s.family, s.mood, s.technique, ...(s.medium || []), s.effort, ...(s.goodFor || []), ...(s.moodWords || []), s.tagline, ...(s.core || []).map((c) => c.title)];
  return [s.name, labels, refs, [s.description]].map((f) => [].concat(f).filter(Boolean).join(' '));
}

// Footnote markers like [^roelofs-2014] are not words anyone searches for.
const plain = (t) => String(t ?? '').replace(/\[\^[^\]]*\]/g, '');

/** The style's guide text: what a search falls back on when no name, label or reference matches. */
export function guideText(s) {
  const refs = [...(s.references?.games || []), ...(s.references?.media || [])].map((r) => r.note);
  return [s.title, s.subtitle, ...[].concat(s.feel || []), ...[].concat(s.origins || []), ...(s.core || []).map((c) => c.body), ...(s.how || []).flatMap((h) => [h.title, h.body]), ...refs]
    .map(plain).filter(Boolean).join(' ');
}

/**
 * base is the path from the page to the site root ('' on the browse page, '../' in the admin).
 * view comes from cardView. Hover media (loops, slides) goes in data attributes; browse.js builds it on first hover.
 * eager marks a card that is on screen when the page opens: its image loads at once instead of waiting for layout.
 * 'high' also puts it ahead of other images; give that to the first card only, the one the page is judged by (LCP).
 */
export function card(s, view, { base = '', eager = false } = {}) {
  const colours = [...new Set(s.palette.map((p) => colourBucket(p.hex)))];
  const data = {
    slug: s.slug, family: s.family, mood: s.mood, technique: s.technique, medium: s.medium || [], effort: s.effort, goodFor: s.goodFor || [], colours,
  };
  const ct = s.cardTitle || {};
  const titleStyle = [ct.scale ? `--title-scale:${ct.scale}` : '', ct.font ? `--title-font:'${ct.font}'` : '', ct.case ? `text-transform:${ct.case}` : ''].filter(Boolean).join(';');
  const { main, sub } = nameParts(s);
  const m = (file) => `${base}media/${s.slug}/${file}`;
  const [first, ...rest] = view.images;
  // File names only: browse.js finds the folder from the card image. A slide is [file, pixel, focus], trimmed at the end.
  const slides = view.images.map((i) => (i.focus ? [thumbOf(i.file), i.pixel ? 1 : 0, i.focus] : i.pixel ? [thumbOf(i.file), 1] : [thumbOf(i.file)]));
  const loops = view.loops.map((l) => l.mp4.replace(/\.c\.mp4$/, ''));
  const page = `${base}styles/${s.slug}.html`;
  return `<article class="card" data-card='${attrJson(data)}' data-search='${attrJson(searchFields(s))}' data-name="${esc(s.name)}" data-id="${s.id}" data-skin="${esc(s.slug)}"${view.hover && view.hover !== 'default' ? ` data-hover="${esc(view.hover)}"` : ''} data-slides='${attrJson(slides)}' data-loops='${attrJson(loops)}'${view.faces?.length ? ` data-faces="${esc(view.faces.join('|'))}"` : ''}>
  <a class="card-media" href="${page}" tabindex="-1" aria-hidden="true">
    <img class="card-main${first.pixel ? ' is-pixel' : ''}" src="${m(thumbOf(first.file))}" alt="" width="640" height="400" ${eager === 'high' ? 'fetchpriority="high"' : eager ? 'loading="eager"' : 'loading="lazy"'} decoding="async" style="view-transition-name:hero-${esc(s.slug)}${first.focus ? `;object-position:${esc(first.focus)}` : ''}">
  </a>
  <div class="card-thumbs">${rest.slice(0, 3).map((h, i) => `<a class="card-thumb${h.pixel ? ' is-pixel' : ''}" href="${page}" data-slide="${i + 1}" tabindex="-1" aria-hidden="true" title="${esc(h.title)}"><img src="${m(smallOf(h.file))}" alt="" width="160" height="100" loading="lazy" decoding="async"${h.focus ? ` style="object-position:${esc(h.focus)}"` : ''}></a>`).join('')}</div>
  <div class="card-body">
    <h2 class="card-title"${titleStyle ? ` style="${esc(titleStyle)}"` : ''}><a href="${page}"><span class="card-title-main">${esc(main)}</span>${sub ? `<span class="card-title-sub">${esc(sub)}</span>` : ''}</a></h2>
    <p class="card-desc">${esc(s.description)}</p>
    <div class="card-foot">
      <div class="card-palette" aria-hidden="true">${s.palette.slice(0, 6).map((p) => `<i style="background:${esc(p.hex)}"></i>`).join('')}</div>
      <span class="card-tag">${esc(s.mood)}</span>
    </div>
  </div>
  <button class="card-save" type="button" data-save="${esc(s.slug)}" aria-pressed="false" aria-label="Add ${esc(s.name)} to shortlist" title="Add to shortlist"><span class="i-off">${ICON.starO}</span><span class="i-on">${ICON.star}</span></button>
</article>`;
}
