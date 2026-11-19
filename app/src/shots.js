// Fixed scenes for screenshots and export checks.
// ?shot=editor — the editor with sample photos loaded.
// ?shot=cover&photo=<pier|boulevard>&caption=<text>&size=<wide|square|portrait>
//   &layout=<a|b|c>&grade=<sunset|neon|vice> — the cover alone, full-bleed.
// ?shot=exporttest — renders every export size and reports their pixel sizes.
// window.__shotReady is set once the scene is painted.
import { blankState, initEditor, loadImage } from './main.js';
import { drawCover, exportCover, SIZES, layoutPanels, topAnchor } from './cover.js';

function markReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
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
  const size = SIZES[query.get('size')] || SIZES.wide;
  const photo = query.get('photo') || 'pier';
  const canvas = document.getElementById('cover');
  canvas.width = size.w;
  canvas.height = size.h;
  const hero = await loadImage(`samples/${photo}.jpg`);
  const second = await loadImage(`samples/${photo === 'pier' ? 'boulevard' : 'pier'}.jpg`);
  const panels = layoutPanels(state.layout, size.w, size.h);
  const place = (img, i, zoom) => {
    const anchor = topAnchor(img, panels[i], zoom);
    return { img, zoom, ox: anchor.ox, oy: anchor.oy, fit: 'fill' };
  };
  state.photos[0] = place(hero, 0, 1);
  state.photos[1] = place(second, 1, 1);
  state.photos[2] = place(hero, 2, 1.1);
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
  await editor.loadSample(0, photo);
  await editor.loadSample(1, photo === 'pier' ? 'boulevard' : 'pier');
  await editor.loadSample(2, photo);
  markReady();
}

async function exportTestScene() {
  const report = document.getElementById('shot-report');
  const state = blankState();
  state.caption = 'EXPORT CHECK';
  const hero = await loadImage('samples/pier.jpg');
  const second = await loadImage('samples/boulevard.jpg');
  state.photos = [
    { img: hero, zoom: 1, ox: 0, oy: 0, fit: 'fill' },
    { img: second, zoom: 1, ox: 0, oy: 0, fit: 'fill' },
    { img: hero, zoom: 1.1, ox: 0, oy: 0, fit: 'fill' },
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
