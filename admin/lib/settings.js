// Site settings: what the admin page edits, stored in content/settings.json and applied by the build.
// This module runs in Node (the build, the checks) and in the browser (the admin), so it imports nothing.
//
// Settings only choose between things the content already has: which images and loops a card uses, how cards
// behave on hover, the browse page's opening words. Anything that doesn't fit is dropped by normalizeSettings,
// so a hand-edited or old file can never break the build.

export const SETTINGS_VERSION = 1;

export const HOVER_MODES = {
  motion: 'Motion collage: its motion loops play in a grid',
  images: 'Image slideshow: the card steps through its images',
  off: 'Still: the card image stays as it is',
};
export const SORTS = { family: 'By family', az: 'A to Z', easy: 'Easiest to make' };
export const DENSITIES = { large: 'Large cards', small: 'Small cards' };

export const LIMITS = {
  cardImages: 4, // the card image plus three small ones under it
  collage: 4,
  slideMs: [700, 4000],
  introTitle: 90,
  introText: 280,
};

export const DEFAULT_SETTINGS = Object.freeze({
  version: SETTINGS_VERSION,
  browse: Object.freeze({
    introTitle: 'Find a look for your game or artwork.',
    introText: '{count} art styles, each with its own page built in that style: references, music, motion, palettes and a how-to.',
    hoverPreview: 'motion',
    hoverSkin: true,
    slideMs: 1300,
    collageSize: 4,
    defaultSort: 'family',
    defaultDensity: 'large',
  }),
  // slug -> { published, images, focus, loops, hover }. A style that isn't listed uses its defaults.
  styles: Object.freeze({}),
});

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max) : null);
const pick = (v, options, fallback) => (Object.hasOwn(options, v) ? v : fallback);
const clampInt = (v, [lo, hi], fallback) => (Number.isFinite(Number(v)) && v !== '' && v !== null ? Math.round(Math.min(hi, Math.max(lo, Number(v)))) : fallback);

/** "x% y%" with both between 0 and 100, rounded to whole percents; anything else is null. */
export function cleanFocus(v) {
  const m = typeof v === 'string' && /^\s*(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%\s*$/.exec(v);
  if (!m) return null;
  const c = (n) => Math.round(Math.min(100, Math.max(0, Number(n))));
  return `${c(m[1])}% ${c(m[2])}%`;
}

/**
 * What each style offers the settings: { slug: { name, images: [{ file, focus }], loops: [{ file }], heroCount } }.
 * The build makes it from the content; the admin loads the same thing from admin/catalog.json.
 */
export function catalogOf(styles) {
  return Object.fromEntries(styles.map((s) => [s.slug, {
    name: s.name,
    family: s.family,
    images: [...(s.hero || []), ...(s.gallery || [])].map((i) => ({ file: i.file, focus: cleanFocus(i.focus) || '' })),
    heroCount: (s.hero || []).length,
    loops: (s.loops || []).map((l) => ({ file: l.file })),
  }]));
}

/** The defaults for one style: its four hero images in order, their focus points, and its first loops. */
export function styleDefaults(entry) {
  const hero = entry.images.slice(0, Math.min(entry.heroCount, LIMITS.cardImages));
  return {
    published: true,
    images: hero.map((i) => i.file),
    focus: Object.fromEntries(entry.images.filter((i) => i.focus).map((i) => [i.file, i.focus])),
    loops: entry.loops.slice(0, LIMITS.collage).map((l) => l.file),
    hover: 'default',
  };
}

/**
 * Cleans settings read from a file or built in the admin. With a catalog, per-style choices are checked against what
 * each style really has, and anything equal to its default is left out, so the file only records real choices.
 */
export function normalizeSettings(raw, catalog = null) {
  const r = isObj(raw) ? raw : {};
  const b = isObj(r.browse) ? r.browse : {};
  const d = DEFAULT_SETTINGS.browse;
  const browse = {
    introTitle: str(b.introTitle, LIMITS.introTitle) || d.introTitle,
    introText: str(b.introText, LIMITS.introText) ?? d.introText,
    hoverPreview: pick(b.hoverPreview, HOVER_MODES, d.hoverPreview),
    hoverSkin: typeof b.hoverSkin === 'boolean' ? b.hoverSkin : d.hoverSkin,
    slideMs: clampInt(b.slideMs, LIMITS.slideMs, d.slideMs),
    collageSize: clampInt(b.collageSize, [1, LIMITS.collage], d.collageSize),
    defaultSort: pick(b.defaultSort, SORTS, d.defaultSort),
    defaultDensity: pick(b.defaultDensity, DENSITIES, d.defaultDensity),
  };
  const styles = {};
  const rs = isObj(r.styles) ? r.styles : {};
  for (const slug of Object.keys(rs).sort()) {
    if (!/^[a-z0-9-]{1,60}$/.test(slug) || !isObj(rs[slug])) continue;
    // A style the catalog doesn't know (added after the admin was built, or removed) keeps its settings, only cleaned.
    const entry = catalog ? catalog[slug] || null : null;
    const x = rs[slug];
    const out = {};
    if (x.published === false) out.published = false;
    const hover = x.hover === 'default' ? 'default' : pick(x.hover, HOVER_MODES, 'default');
    if (hover !== 'default') out.hover = hover;
    const imageFiles = entry ? new Set(entry.images.map((i) => i.file)) : null;
    const okImage = (f) => typeof f === 'string' && /^[\w.-]{1,80}\.webp$/.test(f) && (!imageFiles || imageFiles.has(f));
    if (Array.isArray(x.images)) {
      const list = [...new Set(x.images.filter(okImage))].slice(0, LIMITS.cardImages);
      if (list.length) out.images = list;
    }
    if (isObj(x.focus)) {
      const focus = {};
      for (const f of Object.keys(x.focus).sort()) {
        const v = cleanFocus(x.focus[f]);
        if (okImage(f) && v) focus[f] = v;
      }
      if (Object.keys(focus).length) out.focus = focus;
    }
    const loopFiles = entry ? new Set(entry.loops.map((l) => l.file)) : null;
    if (Array.isArray(x.loops)) {
      const list = [...new Set(x.loops.filter((f) => typeof f === 'string' && /^[\w.-]{1,80}\.mp4$/.test(f) && (!loopFiles || loopFiles.has(f))))].slice(0, LIMITS.collage);
      if (list.length) out.loops = list;
    }
    if (entry) {
      // Leave out what matches the defaults, so the file stays short and its history reads as real decisions.
      const def = styleDefaults(entry);
      if (out.images && JSON.stringify(out.images) === JSON.stringify(def.images)) delete out.images;
      if (out.loops && JSON.stringify(out.loops) === JSON.stringify(def.loops)) delete out.loops;
      if (out.focus) {
        for (const [f, v] of Object.entries(out.focus)) if (def.focus[f] === v) delete out.focus[f];
        if (!Object.keys(out.focus).length) delete out.focus;
      }
    }
    if (Object.keys(out).length) styles[slug] = out;
  }
  return { version: SETTINGS_VERSION, browse, styles };
}

/** One style's settings with its defaults filled in: what the site actually uses. */
export function resolveStyle(settings, slug, entry) {
  const def = styleDefaults(entry);
  const own = settings.styles[slug] || {};
  return {
    published: own.published !== false,
    images: own.images || def.images,
    focus: { ...def.focus, ...(own.focus || {}) },
    loops: own.loops || def.loops,
    hover: own.hover || 'default',
  };
}

export const serializeSettings = (settings) => `${JSON.stringify(settings, null, 2)}\n`;
