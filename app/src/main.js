// Vice Cover Studio — editor.
// Controls on the left, live canvas preview on the right. Photos are read on
// this machine only and never uploaded. Drag on a panel to pan it, drop a file
// on a panel to fill it, and export a PNG in one click.
import { drawCover, exportCover, GRADES, LAYOUTS, SIZES, layoutPanels, topAnchor } from './cover.js';
import { runShot } from './shots.js';

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

export function blankState() {
  return {
    layout: 'a',
    grade: 'sunset',
    sizeKey: 'wide',
    caption: 'VICE CITY',
    subtitle: 'A STORY IN THREE FRAMES',
    photos: [null, null, null],
  };
}

function newSlot(img) {
  return { img, zoom: 1, ox: 0, oy: 0, fit: 'fill' };
}

export function initEditor(opts = {}) {
  const state = blankState();
  if (opts.caption) state.caption = opts.caption;
  if (opts.subtitle) state.subtitle = opts.subtitle;
  if (opts.layout && LAYOUTS[opts.layout]) state.layout = opts.layout;
  if (opts.grade && GRADES[opts.grade]) state.grade = opts.grade;
  if (opts.sizeKey && SIZES[opts.sizeKey]) state.sizeKey = opts.sizeKey;

  const canvas = document.getElementById('cover');
  const status = document.getElementById('status');
  const captionInput = document.getElementById('caption');
  const subtitleInput = document.getElementById('subtitle');
  const sizeSelect = document.getElementById('size');

  function setStatus(text) {
    status.textContent = text;
  }

  function previewSize() {
    const size = SIZES[state.sizeKey];
    // Keep the preview under ~900 px on its long side.
    const scale = Math.min(1, 900 / Math.max(size.w, size.h));
    return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
  }

  function redraw() {
    const { w, h } = previewSize();
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const ctx = canvas.getContext('2d');
    drawCover(ctx, w, h, state, true);
    const filled = state.photos.filter(Boolean).length;
    setStatus(`${filled} of 3 photos · ${LAYOUTS[state.layout].label} · ${GRADES[state.grade].label} grade · preview ${w}×${h}`);
  }

  function refreshPanelControls() {
    document.querySelectorAll('[data-panel]').forEach((box) => {
      const i = Number(box.dataset.panel);
      const slot = state.photos[i];
      box.classList.toggle('filled', Boolean(slot));
      const zoom = box.querySelector('.zoom');
      if (zoom) zoom.value = slot ? slot.zoom : 1;
      const fit = box.querySelector('.fit');
      if (fit) fit.value = slot ? slot.fit : 'fill';
    });
  }

  function setPhoto(i, img) {
    const slot = newSlot(img);
    // Start panned to the top of the photo so faces are not cropped out.
    const rect = layoutPanels(state.layout, canvas.width, canvas.height)[i];
    const anchor = topAnchor(img, rect, slot.zoom);
    slot.ox = anchor.ox;
    slot.oy = anchor.oy;
    state.photos[i] = slot;
    refreshPanelControls();
    redraw();
  }

  async function loadSample(i, name) {
    try {
      const img = await loadImage(`samples/${name}.jpg`);
      setPhoto(i, img);
      setStatus(`Sample photo loaded into panel ${i + 1}`);
    } catch {
      setStatus('Sample photo failed to load');
    }
  }

  // --- text controls ---
  captionInput.value = state.caption;
  subtitleInput.value = state.subtitle;
  captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
  subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });

  // --- layout / grade / size buttons ---
  document.querySelectorAll('[data-layout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.layout = btn.dataset.layout;
      document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b === btn));
      redraw();
    });
  });
  document.querySelectorAll('[data-grade]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.grade = btn.dataset.grade;
      document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b === btn));
      redraw();
    });
  });
  sizeSelect.addEventListener('change', () => {
    state.sizeKey = sizeSelect.value;
    redraw();
  });

  // --- per-panel controls ---
  document.querySelectorAll('[data-panel]').forEach((box) => {
    const i = Number(box.dataset.panel);
    const file = box.querySelector('input[type=file]');
    file.addEventListener('change', async () => {
      const f = file.files && file.files[0];
      if (!f) return;
      try {
        setPhoto(i, await loadImage(URL.createObjectURL(f)));
      } catch {
        setStatus('That file could not be read as a photo');
      }
      file.value = '';
    });
    box.querySelector('.sample').addEventListener('click', () => {
      loadSample(i, i === 1 ? 'boulevard' : 'pier');
    });
    box.querySelector('.zoom').addEventListener('input', (e) => {
      if (state.photos[i]) {
        state.photos[i].zoom = Number(e.target.value);
        redraw();
      }
    });
    box.querySelector('.fit').addEventListener('change', (e) => {
      if (state.photos[i]) {
        state.photos[i].fit = e.target.value;
        redraw();
      }
    });
    box.querySelector('.clear').addEventListener('click', () => {
      state.photos[i] = null;
      refreshPanelControls();
      redraw();
    });
  });

  document.getElementById('samples-all').addEventListener('click', async () => {
    await loadSample(0, 'pier');
    await loadSample(1, 'boulevard');
    await loadSample(2, 'pier');
    setStatus('Sample photos loaded into all three panels');
  });

  // --- drag to pan, drop to fill ---
  let drag = null;
  function panelAt(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * canvas.width;
    const py = ((clientY - r.top) / r.height) * canvas.height;
    const panels = layoutPanels(state.layout, canvas.width, canvas.height);
    for (let i = 0; i < panels.length; i++) {
      const p = panels[i];
      if (px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h) return { i, rect: p, px, py };
    }
    return null;
  }
  canvas.addEventListener('pointerdown', (e) => {
    const hit = panelAt(e.clientX, e.clientY);
    if (!hit || !state.photos[hit.i]) return;
    const slot = state.photos[hit.i];
    drag = { i: hit.i, rect: hit.rect, startX: hit.px, startY: hit.py, ox: slot.ox, oy: slot.oy };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = canvas.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * canvas.width;
    const py = ((e.clientY - r.top) / r.height) * canvas.height;
    const slot = state.photos[drag.i];
    slot.ox = drag.ox + (px - drag.startX) / drag.rect.w;
    slot.oy = drag.oy + (py - drag.startY) / drag.rect.h;
    redraw();
  });
  const endDrag = () => { drag = null; canvas.style.cursor = 'grab'; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', async (e) => {
    e.preventDefault();
    const hit = panelAt(e.clientX, e.clientY);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!hit || !f || !f.type.startsWith('image/')) return;
    try {
      setPhoto(hit.i, await loadImage(URL.createObjectURL(f)));
    } catch {
      setStatus('That file could not be read as a photo');
    }
  });

  // --- exports ---
  document.querySelectorAll('[data-export]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const size = SIZES[btn.dataset.export];
      const out = exportCover(state, size.w, size.h);
      out.toBlob((blob) => {
        if (!blob) { setStatus('Export failed'); return; }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `vice-cover-${size.w}x${size.h}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        setStatus(`Saved vice-cover-${size.w}x${size.h}.png`);
      }, 'image/png');
    });
  });

  canvas.style.cursor = 'grab';
  refreshPanelControls();
  redraw();
  return { state, redraw, loadSample, setPhoto, canvas };
}

// Boot: a ?shot= query sets up a fixed scene for screenshots, else the editor.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params);
} else {
  initEditor();
}
