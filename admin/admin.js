// Explore Art Styles admin: edits content/settings.json in the source repository, with a live preview of the cards.
// There is no server. GitHub checks the token on every request, and every publish is one commit, which the
// repository's publish workflow tests, builds and puts live.

import { ConflictError, GitHub } from './github.js';
import { card, cardView } from './lib/card.js';
import { catalogOf, DEFAULT_SETTINGS, normalizeSettings, resolveStyle, serializeSettings } from './lib/settings.js';
import { PANELS } from './panels.js';
import { confirmDialog, h, icon, toast } from './ui.js';

// Clickjacking protection: GitHub Pages can't send frame-ancestors, and a <meta> CSP can't set it.
if (window.top !== window.self) {
  document.documentElement.replaceChildren();
  throw new Error('The admin page refuses to run inside a frame.');
}

const REPO = { owner: 'elarion-game-dev', repo: 'explore-art-styles-source', branch: 'main' };
const SITE_URL = 'https://elarion-game-dev.github.io/explore-art-styles/';
const SETTINGS_PATH = 'content/settings.json';
const TOKEN_KEY = 'eas-admin-token';
const TOKEN_PATTERN = /^(github_pat_|ghp_|gho_)[A-Za-z0-9_]{20,255}$/;
const root = document.getElementById('app');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getPath = (obj, path) => path.split('.').reduce((x, k) => (x == null ? undefined : x[k]), obj);
function setPath(obj, path, value) {
  const keys = path.split('.');
  let x = obj;
  for (const k of keys.slice(0, -1)) {
    if (x[k] == null || typeof x[k] !== 'object') x[k] = {};
    x = x[k];
  }
  x[keys.at(-1)] = value;
}

const startPanel = () => {
  const [panel, style] = location.hash.slice(1).split('/');
  return { panel: PANELS.some((p) => p.id === panel) ? panel : 'overview', style: style || '' };
};

const app = {
  repo: REPO,
  siteUrl: SITE_URL,
  gh: null,
  user: null,
  remembered: false,
  catalog: null, // { built, settings, styles: [...] } from catalog.json
  entries: null, // slug -> catalog entry (src/settings.mjs catalogOf)
  bySlug: new Map(),
  settings: null,
  savedJson: '',
  fileSha: null,
  panel: startPanel().panel,
  style: startPanel().style,
  filter: { q: '', show: 'all' },
  density: 'large',
  forceHover: false,
  publishing: false,

  get: (path) => getPath(app.settings, path),
  set(path, value) {
    remember(path);
    setPath(app.settings, path, value);
    changed();
  },
  /** Put one setting back to its published value. */
  revert(path) {
    lastEdit = { path: '', time: 0 };
    remember();
    const before = getPath(savedSettings(), path);
    if (before === undefined) {
      const keys = path.split('.');
      const parent = getPath(app.settings, keys.slice(0, -1).join('.'));
      if (parent) delete parent[keys.at(-1)];
    } else setPath(app.settings, path, structuredClone(before));
    changed();
    app.rerender();
  },
  normalized: () => normalizeSettings(app.settings, app.entries),
  rerender: () => renderPanel(),

  /** One style's settings with its defaults filled in. */
  resolved: (slug) => resolveStyle(app.normalized(), slug, app.entries[slug]),
  setStyle(slug, key, value) {
    remember(`styles.${slug}.${key}`);
    app.settings.styles ||= {};
    app.settings.styles[slug] ||= {};
    app.settings.styles[slug][key] = value;
    changed();
  },
  resetStyle(slug) {
    remember();
    delete app.settings.styles[slug];
    changed();
    app.rerender();
  },
  isCustom: (slug) => Boolean(app.normalized().styles[slug]),
  goto(panel, style = '') {
    app.panel = panel;
    app.style = panel === 'styles' ? style : '';
    history.replaceState(null, '', `#${panel}${app.style ? `/${app.style}` : ''}`);
    renderNav();
    renderPanel();
    renderPreview();
    ui.editor?.scrollTo({ top: 0 });
    ui.editor?.focus({ preventScroll: true });
  },
  loadHistory: () => app.gh.history(SETTINGS_PATH),
  loadVersion,
  exportJson,
  importJson,
  resetDefaults,
  setHover(on) {
    app.forceHover = on;
    ui.hoverToggle?.setAttribute('aria-pressed', String(on));
    post({ type: 'hover', on });
  },
};

const ui = {};

// --- undo / redo ---------------------------------------------------------------------------
// Snapshots of the whole draft. Typing in one field within a short pause counts as one step.

const UNDO_LIMIT = 200;
const undoStack = [];
const redoStack = [];
let lastEdit = { path: '', time: 0 };

function remember(path = '') {
  const now = Date.now();
  const sameEdit = path && path === lastEdit.path && now - lastEdit.time < 1000;
  lastEdit = { path, time: now };
  if (sameEdit) return;
  undoStack.push(JSON.stringify(app.settings));
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();
  redoStack.length = 0;
}

function step(from, to) {
  if (!from.length || app.publishing) return;
  to.push(JSON.stringify(app.settings));
  app.settings = JSON.parse(from.pop());
  lastEdit = { path: '', time: 0 };
  const focused = document.activeElement?.dataset?.path;
  changed();
  renderPanel();
  if (focused) ui.editor.querySelector(`[data-path="${CSS.escape(focused)}"]`)?.focus({ preventScroll: true });
}

const undo = () => step(undoStack, redoStack);
const redo = () => step(redoStack, undoStack);

let savedCache = { json: '', settings: null };
function savedSettings() {
  if (savedCache.json !== app.savedJson) savedCache = { json: app.savedJson, settings: JSON.parse(app.savedJson) };
  return savedCache.settings;
}

/** Show each field's revert button only while its value differs from the published one. */
function updateReverts() {
  if (!ui.editor) return;
  const buttons = ui.editor.querySelectorAll('[data-revert]');
  if (!buttons.length) return;
  const now = app.normalized();
  const saved = savedSettings();
  for (const button of buttons) {
    const path = button.dataset.revert;
    const before = getPath(saved, path);
    const differs = JSON.stringify(getPath(now, path)) !== JSON.stringify(before);
    button.hidden = !differs;
    if (differs) button.title = before === undefined ? 'Back to the default' : `Back to the published value${typeof before === 'object' ? '' : `: ${String(before).slice(0, 60) || '(empty)'}`}`;
  }
}

// --- token storage ---------------------------------------------------------------------

function storedToken() {
  try {
    const session = sessionStorage.getItem(TOKEN_KEY);
    if (session) return { token: session, remembered: false };
    const local = localStorage.getItem(TOKEN_KEY);
    return local ? { token: local, remembered: true } : null;
  } catch {
    return null;
  }
}

function storeToken(token, keep) {
  try {
    clearToken();
    (keep ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  } catch {
    // storage unavailable (private mode): the session simply won't survive a reload
  }
}

function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

function explain(error) {
  if (error.status === 401) return 'GitHub rejected this token. It may be mistyped, expired or revoked.';
  if (error.status === 404) return `This token can't see ${REPO.owner}/${REPO.repo}. When creating it, choose "Only select repositories" and pick ${REPO.repo}.`;
  if (error.status === 403) return /rate limit/i.test(error.message) ? 'GitHub rate limit reached. Wait a few minutes and try again.' : `GitHub refused: ${error.message}. Check the token has "Contents: Read and write".`;
  if (error instanceof TypeError) return "Couldn't reach GitHub. Check your connection.";
  return error.message || 'Something went wrong.';
}

// --- sign in ---------------------------------------------------------------------------

function tokenUrl() {
  const params = new URLSearchParams({
    name: 'Explore Art Styles admin',
    description: `Lets the admin page at ${location.origin}${location.pathname} change the site's settings.`,
    target_name: REPO.owner,
    expires_in: '90',
    contents: 'write',
    actions: 'read',
  });
  return `https://github.com/settings/personal-access-tokens/new?${params}`;
}

function mark() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'mark');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<rect x="2" y="2" width="9" height="9" rx="1.5" fill="#e4572e"/><rect x="13" y="2" width="9" height="9" rx="4.5" fill="#f3a712"/><rect x="2" y="13" width="9" height="9" rx="4.5" fill="#29a19c"/><rect x="13" y="13" width="9" height="9" rx="1.5" fill="#7d46c9"/>';
  return svg;
}

function showLogin(message) {
  document.title = 'Sign in · Admin · Explore Art Styles';
  const input = h('input', { type: 'password', id: 'token', class: 'input mono', autocomplete: 'off', spellcheck: 'false', placeholder: 'github_pat_…', required: true });
  const keep = h('input', { type: 'checkbox', id: 'remember' });
  const error = h('p', { class: 'login-error', role: 'alert', hidden: !message }, message ?? '');
  const button = h('button', { type: 'submit', class: 'btn btn-primary btn-block' }, 'Sign in');

  const form = h(
    'form',
    {
      class: 'login-card',
      onsubmit: async (event) => {
        event.preventDefault();
        const token = input.value.trim();
        if (!TOKEN_PATTERN.test(token)) {
          error.textContent = 'That doesn\'t look like a GitHub token. Fine-grained tokens start with "github_pat_".';
          error.hidden = false;
          return;
        }
        button.disabled = true;
        button.textContent = 'Checking with GitHub…';
        try {
          await signIn(token, keep.checked);
          storeToken(token, keep.checked);
        } catch (e) {
          error.textContent = explain(e);
          error.hidden = false;
          button.disabled = false;
          button.textContent = 'Sign in';
        }
      },
    },
    h('div', { class: 'login-brand' }, mark(), h('span', {}, 'Explore Art Styles'), h('span', { class: 'login-tag' }, 'admin')),
    h('h1', {}, 'Sign in with a GitHub token'),
    h('p', { class: 'muted' }, 'This page changes the site by saving its settings to the ', h('strong', {}, `${REPO.owner}/${REPO.repo}`), ' repository. GitHub checks the token; it is never sent anywhere else.'),
    h(
      'ol',
      { class: 'steps' },
      h(
        'li',
        {},
        h('a', { href: tokenUrl(), target: '_blank', rel: 'noopener noreferrer' }, 'Create a token on GitHub', icon('external', 'icon icon-xs')),
        '. Name and permissions are filled in (Contents: read and write, Actions: read). Under ',
        h('strong', {}, 'Repository access'),
        ' choose ',
        h('strong', {}, 'Only select repositories'),
        ` → ${REPO.repo}.`
      ),
      h('li', {}, 'Paste the token here.')
    ),
    h('label', { class: 'field-label', for: 'token' }, 'Access token'),
    input,
    h('label', { class: 'check', for: 'remember' }, keep, h('span', {}, 'Keep me signed in on this device. Leave this off on shared computers; otherwise you are signed out when the tab closes.')),
    error,
    button,
    h('p', { class: 'login-foot muted' }, icon('lock', 'icon icon-xs'), 'Lost a device? Revoke the token at github.com/settings/personal-access-tokens.')
  );

  root.replaceChildren(h('div', { class: 'login' }, form));
  input.focus();
}

async function loadCatalog() {
  if (app.catalog) return;
  const response = await fetch('catalog.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Couldn't load the style list (catalog.json, ${response.status}).`);
  app.catalog = await response.json();
  app.entries = catalogOf(app.catalog.styles);
  app.bySlug = new Map(app.catalog.styles.map((s) => [s.slug, s]));
}

async function readSettingsFile(ref) {
  try {
    return await app.gh.readFile(SETTINGS_PATH, ref);
  } catch (error) {
    // No settings file yet: start from the defaults; the first publish creates it.
    if (error.status === 404) return { sha: null, text: serializeSettings(DEFAULT_SETTINGS) };
    throw error;
  }
}

async function signIn(token, remembered) {
  const gh = new GitHub({ token, ...REPO });
  const [user] = await Promise.all([gh.user(), gh.repository(), loadCatalog()]);
  app.gh = gh;
  const file = await readSettingsFile();
  let raw;
  try {
    raw = JSON.parse(file.text);
  } catch {
    throw new Error(`${SETTINGS_PATH} on GitHub isn't valid JSON. Fix it there, or import a backup after signing in.`);
  }
  const settings = normalizeSettings(raw, app.entries);
  Object.assign(app, { user, remembered, fileSha: file.sha, savedJson: serializeSettings(settings), settings: structuredClone(settings) });
  showWorkspace();
  refreshDeployStatus();
}

function signOut() {
  clearToken();
  Object.assign(app, { gh: null, user: null, settings: null, savedJson: '', fileSha: null });
  undoStack.length = 0;
  redoStack.length = 0;
  showLogin('Signed out.');
}

// --- workspace --------------------------------------------------------------------------

function showWorkspace() {
  ui.status = h('span', { class: 'status-text' });
  ui.dot = h('span', { class: 'status-dot' });
  ui.deploy = h('a', { class: 'deploy-pill', target: '_blank', rel: 'noopener noreferrer', dataset: { state: 'idle' } }, h('span', { class: 'deploy-dot' }), h('span', { class: 'deploy-text' }, ''));
  ui.publish = h('button', { type: 'button', class: 'btn btn-primary', title: 'Publish (Ctrl+S)', onclick: () => publish() }, 'Publish');
  ui.undo = h('button', { type: 'button', class: 'icon-btn', title: 'Undo (Ctrl+Z)', 'aria-label': 'Undo', onclick: undo }, icon('undo'));
  ui.redo = h('button', { type: 'button', class: 'icon-btn', title: 'Redo (Ctrl+Shift+Z)', 'aria-label': 'Redo', onclick: redo }, icon('redo'));
  ui.discard = h('button', { type: 'button', class: 'btn btn-ghost', onclick: discard }, 'Discard');
  ui.nav = h('nav', { class: 'sidebar', 'aria-label': 'Settings sections' });
  ui.editor = h('main', { class: 'editor', id: 'editor', tabindex: '-1' });

  const account = h(
    'details',
    { class: 'account' },
    h('summary', { 'aria-label': 'Account' }, app.user.avatar_url ? h('img', { src: app.user.avatar_url, alt: '', width: 28, height: 28 }) : icon('about')),
    h(
      'div',
      { class: 'account-menu' },
      h('p', {}, 'Signed in as ', h('strong', {}, app.user.login)),
      h('p', { class: 'muted' }, app.remembered ? 'Token saved on this device.' : 'Token kept for this tab only.'),
      h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: confirmSignOut }, icon('logout'), 'Sign out')
    )
  );

  ui.frame = h('iframe', { class: 'preview-frame card-frame', title: 'Preview of the browse cards', src: 'preview.html' });
  ui.hoverToggle = h('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'aria-pressed': String(app.forceHover), title: 'Show the cards as if the pointer were on them', onclick: () => app.setHover(!app.forceHover) }, icon('pointer'), 'Hover');
  const densityButton = (d, label, ic) =>
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': label, title: label, 'aria-pressed': String(app.density === d), dataset: { density: d }, onclick: () => setDensity(d) }, icon(ic));
  ui.densities = [densityButton('large', 'Large cards', 'image'), densityButton('small', 'Small cards', 'grid')];
  ui.previewPane = h(
    'aside',
    { class: 'preview-pane', 'aria-label': 'Preview' },
    h(
      'div',
      { class: 'preview-toolbar' },
      h('span', { class: 'preview-label' }, icon('eye'), 'Preview'),
      ui.hoverToggle,
      h('div', { class: 'device-toggle' }, ui.densities),
      h('a', { class: 'icon-btn', href: SITE_URL, target: '_blank', rel: 'noopener noreferrer', title: 'Open the live site', 'aria-label': 'Open the live site' }, icon('external')),
      h('button', { type: 'button', class: 'btn btn-ghost btn-sm preview-close', onclick: () => togglePreview(false) }, 'Back to editing')
    ),
    h('div', { class: 'preview-stage card-stage' }, ui.frame),
    h('p', { class: 'preview-foot muted' }, 'Point at a card to see its hover, or press Hover. The preview uses the site\'s own card styles and script.')
  );

  const topbar = h(
    'header',
    { class: 'topbar' },
    h('a', { class: 'topbar-brand', href: SITE_URL, target: '_blank', rel: 'noopener noreferrer' }, mark(), h('span', {}, 'Explore Art Styles'), h('span', { class: 'login-tag' }, 'admin')),
    h('div', { class: 'topbar-status', 'aria-live': 'polite' }, ui.dot, ui.status),
    ui.deploy,
    h(
      'div',
      { class: 'topbar-actions' },
      h('button', { type: 'button', class: 'btn btn-ghost preview-open', onclick: () => togglePreview(true) }, icon('eye'), 'Preview'),
      h('div', { class: 'undo-group' }, ui.undo, ui.redo),
      ui.discard,
      ui.publish,
      account
    )
  );

  ui.shell = h('div', { class: 'shell' }, topbar, h('div', { class: 'workspace' }, ui.nav, ui.editor, ui.previewPane));
  root.replaceChildren(ui.shell);
  renderNav();
  renderPanel();
  updateStatus();
}

async function confirmSignOut() {
  if (isDirty()) {
    const choice = await confirmDialog({ title: 'Sign out with unpublished changes?', body: 'Your unpublished changes will be lost.', confirm: 'Sign out', danger: true });
    if (choice !== 'ok') return;
  }
  signOut();
}

function renderNav() {
  ui.nav.replaceChildren(
    ...PANELS.map((p) =>
      h('button', { type: 'button', class: `nav-item${app.panel === p.id ? ' active' : ''}`, 'aria-current': app.panel === p.id ? 'page' : null, onclick: () => app.goto(p.id) }, icon(p.icon), h('span', {}, p.label))
    )
  );
}

function renderPanel() {
  const panel = PANELS.find((p) => p.id === app.panel) ?? PANELS[0];
  const scroll = ui.editor.scrollTop;
  ui.editor.replaceChildren(h('div', { class: 'panel' }, panel.render(app)));
  ui.editor.scrollTop = scroll;
  updateReverts();
}

function togglePreview(show) {
  ui.shell.classList.toggle('show-preview', show);
}

function setDensity(d) {
  app.density = d;
  for (const b of ui.densities) b.setAttribute('aria-pressed', String(b.dataset.density === d));
  renderPreview();
}

// --- change tracking -----------------------------------------------------------------------

function isDirty() {
  return serializeSettings(app.normalized()) !== app.savedJson;
}

let previewTimer;
function changed() {
  updateStatus();
  updateReverts();
  clearTimeout(previewTimer);
  previewTimer = setTimeout(renderPreview, 120);
}

function updateStatus() {
  if (!ui.dot) return;
  const dirty = isDirty();
  ui.dot.dataset.state = app.publishing ? 'busy' : dirty ? 'dirty' : 'clean';
  ui.status.textContent = app.publishing ? 'Publishing…' : dirty ? 'Unpublished changes' : 'Everything is published';
  ui.publish.disabled = app.publishing || !dirty;
  ui.discard.hidden = !dirty || app.publishing;
  ui.undo.disabled = app.publishing || !undoStack.length;
  ui.redo.disabled = app.publishing || !redoStack.length;
  document.title = `${dirty ? '• ' : ''}Admin · Explore Art Styles`;
}

window.addEventListener('beforeunload', (event) => {
  if (app.settings && isDirty()) event.preventDefault();
});

window.addEventListener('keydown', (event) => {
  if (!(event.ctrlKey || event.metaKey) || !app.settings || !ui.editor) return;
  const key = event.key.toLowerCase();
  if (key === 's') {
    event.preventDefault();
    publish();
  } else if (key === 'z' || key === 'y') {
    // The admin's own history replaces the browser's per-field undo, so every kind of control behaves the same.
    event.preventDefault();
    if (key === 'y' || event.shiftKey) redo();
    else undo();
  }
});

async function discard() {
  const choice = await confirmDialog({ title: 'Discard unpublished changes?', body: 'The editor goes back to what is published. Undo (Ctrl+Z) brings your changes back.', confirm: 'Discard', danger: true });
  if (choice !== 'ok') return;
  remember();
  app.settings = JSON.parse(app.savedJson);
  changed();
  renderPanel();
}

// --- live preview -------------------------------------------------------------------------

let previewReady = false;
function post(message) {
  if (previewReady) ui.frame?.contentWindow?.postMessage(message, location.origin);
}
window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.source !== ui.frame?.contentWindow) return;
  if (event.data?.type === 'preview-ready') {
    previewReady = true;
    renderPreview();
  }
});

/** The cards the preview shows: the style being edited, or a few published ones for site-wide settings. */
function previewStyles(n) {
  if (app.panel === 'styles' && app.style && app.bySlug.has(app.style)) return [app.bySlug.get(app.style)];
  const published = app.catalog.styles.filter((s) => resolveStyle(n, s.slug, app.entries[s.slug]).published);
  if (app.panel === 'styles') {
    const q = app.filter.q.trim().toLowerCase();
    const hit = published.filter((s) => !q || s.name.toLowerCase().includes(q));
    return (hit.length ? hit : published).slice(0, 3);
  }
  return published.slice(0, 3);
}

function renderPreview() {
  if (!ui.frame || !app.settings) return;
  const n = app.normalized();
  const b = n.browse;
  const list = previewStyles(n);
  const published = app.catalog.styles.filter((s) => resolveStyle(n, s.slug, app.entries[s.slug]).published).length;
  const cards = list.map((s) => card(s, cardView(s, resolveStyle(n, s.slug, app.entries[s.slug])), { base: '../' })).join('\n');
  post({
    type: 'render',
    cards,
    many: list.length > 1,
    density: app.density,
    browse: { hover: b.hoverPreview, skins: b.hoverSkin ? 'on' : 'off', slideMs: b.slideMs, collage: b.collageSize },
    intro: app.panel === 'browse' ? { title: b.introTitle, text: b.introText.replaceAll('{count}', String(published)) } : null,
    hover: app.forceHover,
  });
}

// --- publishing ---------------------------------------------------------------------------------

const BROWSE_AREAS = {
  introTitle: 'intro', introText: 'intro', defaultSort: 'default sort', defaultDensity: 'default card size',
  hoverPreview: 'card hover', hoverSkin: 'card hover', slideMs: 'card hover', collageSize: 'card hover',
};

function commitMessage(before, after) {
  const areas = new Set();
  try {
    const a = JSON.parse(before);
    const b = JSON.parse(after);
    for (const [k, area] of Object.entries(BROWSE_AREAS)) if (JSON.stringify(a.browse?.[k]) !== JSON.stringify(b.browse?.[k])) areas.add(area);
    const slugs = [...new Set([...Object.keys(a.styles || {}), ...Object.keys(b.styles || {})])].filter((s) => JSON.stringify(a.styles?.[s]) !== JSON.stringify(b.styles?.[s]));
    const names = slugs.map((s) => app.bySlug.get(s)?.name || s);
    if (names.length) areas.add(names.length > 3 ? `${names.slice(0, 3).join(', ')} and ${names.length - 3} more` : names.join(', '));
  } catch {
    // first publish or unreadable old file
  }
  return `Update ${areas.size ? [...areas].join(', ') : 'site settings'} via admin`;
}

async function publish({ force = false } = {}) {
  if (app.publishing || !isDirty()) return;
  const normalized = app.normalized();
  const json = serializeSettings(normalized);
  let conflict = false;
  app.publishing = true;
  ui.publish.classList.add('is-loading');
  updateStatus();
  try {
    const { commit, blobs } = await app.gh.commit({
      message: commitMessage(app.savedJson, json),
      files: [{ path: SETTINGS_PATH, content: json, encoding: 'utf-8' }],
      expect: force ? null : { path: SETTINGS_PATH, sha: app.fileSha },
    });
    app.fileSha = blobs[SETTINGS_PATH];
    app.savedJson = json;
    // Edits made while publishing stay in the editor as unpublished changes.
    if (serializeSettings(app.normalized()) === json) {
      app.settings = structuredClone(normalized);
      renderPanel();
    } else updateReverts();
    toast('Published. The site is tested, built and live in a minute or two.');
    watchDeploy(commit.sha);
  } catch (error) {
    if (error instanceof ConflictError) conflict = true;
    else toast(explain(error), 'error');
  } finally {
    app.publishing = false;
    ui.publish.classList.remove('is-loading');
    updateStatus();
  }

  if (conflict) {
    const choice = await confirmDialog({
      title: 'The settings changed on GitHub',
      body: 'Someone (or another browser tab) published since you opened the editor. You can overwrite their version with yours, or load theirs and lose your unpublished changes.',
      confirm: 'Overwrite with mine',
      extra: 'Load theirs',
      danger: true,
    });
    if (choice === 'ok') await publish({ force: true });
    if (choice === 'extra') await reloadFromGitHub();
  }
}

async function reloadFromGitHub() {
  const file = await readSettingsFile();
  const settings = normalizeSettings(JSON.parse(file.text), app.entries);
  remember();
  Object.assign(app, { fileSha: file.sha, savedJson: serializeSettings(settings), settings: structuredClone(settings) });
  changed();
  renderPanel();
  toast('Loaded the latest published settings.');
}

function setDeploy(state, text, url) {
  ui.deploy.dataset.state = state;
  ui.deploy.querySelector('.deploy-text').textContent = text;
  if (url) ui.deploy.href = url;
  else ui.deploy.removeAttribute('href');
}

let deployWatch = 0;
async function watchDeploy(sha) {
  const watchId = ++deployWatch;
  setDeploy('pending', 'Building…');
  const started = Date.now();
  while (Date.now() - started < 12 * 60 * 1000 && watchId === deployWatch) {
    await wait(6000);
    let run;
    try {
      run = await app.gh.latestRun(sha);
    } catch (error) {
      if (error.status === 403 || error.status === 404) return setDeploy('unknown', 'Published · live in a few minutes');
      continue;
    }
    if (!run || watchId !== deployWatch) continue;
    if (run.status === 'completed') {
      return run.conclusion === 'success' ? setDeploy('live', 'Live', run.html_url) : setDeploy('failed', 'Build failed', run.html_url);
    }
    setDeploy('pending', run.status === 'queued' ? 'Queued…' : 'Building…', run.html_url);
  }
  if (watchId === deployWatch) setDeploy('unknown', 'Build still running', `https://github.com/${REPO.owner}/${REPO.repo}/actions`);
}

async function refreshDeployStatus() {
  try {
    const run = await app.gh.latestRun();
    if (!run) return setDeploy('idle', '');
    if (run.status !== 'completed') return watchDeploy(run.head_sha);
    setDeploy(run.conclusion === 'success' ? 'live' : 'failed', run.conclusion === 'success' ? 'Live' : 'Last build failed', run.html_url);
  } catch {
    setDeploy('idle', '');
  }
}

// --- history and backup -------------------------------------------------------------------

async function loadVersion(sha) {
  if (isDirty()) {
    const choice = await confirmDialog({ title: 'Replace unpublished changes?', body: 'Loading an older version replaces what is in the editor now.', confirm: 'Load version', danger: true });
    if (choice !== 'ok') return;
  }
  try {
    const file = await app.gh.readFile(SETTINGS_PATH, sha);
    remember();
    app.settings = normalizeSettings(JSON.parse(file.text), app.entries);
    changed();
    toast('Older version loaded. Check the preview, then Publish to restore it.');
    app.goto('overview');
  } catch (error) {
    toast(explain(error), 'error');
  }
}

function exportJson() {
  const blob = new Blob([serializeSettings(app.normalized())], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: `explore-art-styles-settings-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importJson(file) {
  try {
    if (file.size > 1024 * 1024) throw new Error('That file is too large to be a settings backup.');
    const data = JSON.parse(await file.text());
    const choice = await confirmDialog({ title: 'Import these settings?', body: 'They replace what is in the editor. Nothing goes live until you publish.', confirm: 'Import' });
    if (choice !== 'ok') return;
    remember();
    app.settings = normalizeSettings(data, app.entries);
    changed();
    renderPanel();
    toast('Settings imported. Check the preview, then Publish.');
  } catch (error) {
    toast(error instanceof SyntaxError ? 'That file is not valid JSON.' : error.message, 'error');
  }
}

async function resetDefaults() {
  const choice = await confirmDialog({
    title: 'Reset everything to the defaults?',
    body: 'Every card goes back to its first four images and loops, and the browse page and hover settings go back to the defaults. Nothing goes live until you publish, and older versions stay in History.',
    confirm: 'Reset',
    danger: true,
  });
  if (choice !== 'ok') return;
  remember();
  app.settings = structuredClone(normalizeSettings({}, app.entries));
  changed();
  renderPanel();
}

// --- start --------------------------------------------------------------------------------------

const saved = storedToken();
if (saved) {
  root.replaceChildren(h('div', { class: 'login' }, h('p', { class: 'muted' }, 'Signing in…')));
  signIn(saved.token, saved.remembered).catch((error) => {
    // Forget the token only when GitHub rejects it, not on a dropped connection or a rate limit.
    if (error.status === 401 || error.status === 404 || (error.status === 403 && !/rate limit/i.test(error.message))) clearToken();
    showLogin(explain(error));
  });
} else {
  showLogin();
}
