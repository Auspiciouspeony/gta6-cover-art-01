// Fixed scenes for screenshots and export checks (round 2).
// ?shot=editor — the editor with sample photos loaded.
// ?shot=cover&photo=<pier|boulevard>&caption=<text>&size=<wide|square|portrait>
//   &layout=<a|b|c|d|e|f|g|h>&grade=<sunset|neon|vice|gold|teal|rose|dusk|ink>
//   &roles=<comma list>&callout=<text>&seal=<0|1>&billing=<0|1>
//   &titleMode=<band|over> — the cover alone, full-bleed.
// ?shot=exporttest — renders every export size and reports their pixel sizes.
// window.__shotReady is set once the scene is painted.
import { blankState, initEditor, loadImage } from './main.js';
import { drawCover, exportCover, SIZES, layoutPanels, topAnchor } from './cover.js';

function markReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}

function applyPosterParams(state, query) {
  const roles = query.get('roles');
  if (roles) state.roles = roles.split(',').map((r) => r.trim().toUpperCase()).slice(0, 5);
  const callout = query.get('callout');
  if (callout !== null) state.callout = callout;
  if (query.get('seal') !== null) state.seal = query.get('seal') !== '0';
  if (query.get('billing') !== null) state.billing = query.get('billing') !== '0';
  const titleMode = query.get('titleMode');
  if (titleMode === 'over' || titleMode === 'band') state.titleMode = titleMode;
}

async function coverScene(query) {
  document.body.classList.add('shot-cover');
  const state = blankState();
  state.caption = query.get('caption') || 'VICE CITY';
  state.subtitle = query.get('subtitle') || 'A STORY IN THREE FRAMES';
  const layout = query.get('layout');
  if (layout) state.layout = layout;
  const grade = query.get('grade');
  if (grade) state.grade = grade;
  applyPosterParams(state, query);
  const size = SIZES[query.get('size')] || SIZES.wide;
  const photo = query.get('photo') || 'pier';
  const canvas = document.getElementById('cover');
  canvas.width = size.w;
  canvas.height = size.h;
  const panels = layoutPanels(state.layout, size.w, size.h);
  const names = ['pier', 'boulevard', 'pier', 'boulevard', 'pier'];
  const loaded = {};
  for (let i = 0; i < 5; i++) {
    const name = i === 0 ? photo : names[i];
    if (!loaded[name]) loaded[name] = await loadImage(`samples/${name}.jpg`);
    const rect = panels.find((p) => p.photo === i) || panels[Math.min(i, panels.length - 1)];
    const zoom = i === 2 ? 1.1 : 1;
    const anchor = topAnchor(loaded[name], rect, zoom);
    state.photos[i] = { img: loaded[name], zoom, ox: anchor.ox, oy: anchor.oy, fit: 'fill' };
  }
  drawCover(canvas.getContext('2d'), size.w, size.h, state, false);
  markReady();
}

async function editorScene(query) {
  const editor = initEditor({
    caption: query.get('caption') || 'VICE CITY',
    layout: query.get('layout') || 'a',
    grade: query.get('grade') || 'sunset',
    sizeKey: query.get('size') || 'wide',
  });
  const photo = query.get('photo') || 'pier';
  for (let i = 0; i < 5; i++) {
    await editor.loadSample(i, i === 0 ? photo : (i % 2 === 0 ? 'pier' : 'boulevard'));
  }
  markReady();
}

async function exportTestScene() {
  const report = document.getElementById('shot-report');
  const state = blankState();
  state.caption = 'EXPORT CHECK';
  state.callout = 'BEST HEIST OF THE YEAR';
  const hero = await loadImage('samples/pier.jpg');
  const second = await loadImage('samples/boulevard.jpg');
  state.photos = [
    { img: hero, zoom: 1, ox: 0, oy: 0, fit: 'fill' },
    { img: second, zoom: 1, ox: 0, oy: 0, fit: 'fill' },
    { img: hero, zoom: 1.1, ox: 0, oy: 0, fit: 'fill' },
    { img: second, zoom: 1, ox: 0, oy: 0, fit: 'fill' },
    { img: hero, zoom: 1, ox: 0, oy: 0, fit: 'fill' },
  ];
  const results = {};
  for (const [key, size] of Object.entries(SIZES)) {
    const out = exportCover(state, size.w, size.h);
    results[key] = { w: out.width, h: out.height, ok: out.width === size.w && out.height === size.h };
  }
  window.__exportInfo = results;
  if (report) {
    report.hidden = false;
    report.textContent = Object.entries(results)
      .map(([k, r]) => `${k}: ${r.w}x${r.h} ${r.ok ? 'OK' : 'MISMATCH'}`)
      .join(' | ');
  }
  markReady();
}

export async function runShot(shot, query) {
  try {
    if (shot === 'cover') await coverScene(query);
    else if (shot === 'editor') await editorScene(query);
    else if (shot === 'exporttest') await exportTestScene();
    else markReady();
  } catch (err) {
    document.getElementById('status').textContent = `Shot failed: ${err.message}`;
    window.__shotReady = true;
  }
}
