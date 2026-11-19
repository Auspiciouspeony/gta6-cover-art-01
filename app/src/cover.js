// Vice Cover Studio — cover renderer.
// Draws the multi-panel GTA-style poster on any canvas: photo panels on top,
// an original sunset title band (sky, sun disc, skyline, palms) below, and a
// bold outlined caption. No borrowed art, no font files — system fonts only.

export const GRADES = {
  sunset: {
    label: 'Sunset',
    filter: 'saturate(1.28) contrast(1.08) sepia(0.22) hue-rotate(-8deg)',
    skyTop: '#ff9d45',
    skyMid: '#ff5e62',
    skyBottom: '#8b2f9e',
    overlayTop: 'rgba(255,120,40,0.16)',
    overlayBottom: 'rgba(255,0,110,0.16)',
    sun: '#ffd76a',
  },
  neon: {
    label: 'Neon',
    filter: 'saturate(1.65) contrast(1.16) hue-rotate(12deg)',
    skyTop: '#ff2fb3',
    skyMid: '#7b2ff7',
    skyBottom: '#141a4d',
    overlayTop: 'rgba(255,0,180,0.18)',
    overlayBottom: 'rgba(0,220,255,0.16)',
    sun: '#ff5ce1',
  },
  vice: {
    label: 'Vice',
    filter: 'saturate(1.42) contrast(1.06) hue-rotate(-28deg) sepia(0.12)',
    skyTop: '#00c2a8',
    skyMid: '#ff5e8a',
    skyBottom: '#3b1d8f',
    overlayTop: 'rgba(0,220,190,0.14)',
    overlayBottom: 'rgba(255,60,140,0.16)',
    sun: '#ffe95e',
  },
};

export const LAYOUTS = {
  a: { label: 'Hero Split' },
  b: { label: 'Triple Strip' },
  c: { label: 'Feature' },
};

export const SIZES = {
  wide: { w: 1920, h: 1080, label: '1920 × 1080' },
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
};

// Panel rectangles for a layout inside the art area (the top ~76% of the cover).
export function layoutPanels(layout, w, h) {
  const gap = Math.max(4, Math.round(w * 0.007));
  const artH = h * 0.76;
  const x0 = gap;
  const y0 = gap;
  const w2 = w - gap * 2;
  const h2 = artH - gap;
  if (layout === 'b') {
    const pw = (w2 - gap * 2) / 3;
    return [
      { x: x0, y: y0, w: pw, h: h2 },
      { x: x0 + pw + gap, y: y0, w: pw, h: h2 },
      { x: x0 + (pw + gap) * 2, y: y0, w: pw, h: h2 },
    ];
  }
  if (layout === 'c') {
    const topH = h2 * 0.58;
    const bw = (w2 - gap) / 2;
    return [
      { x: x0, y: y0, w: w2, h: topH },
      { x: x0, y: y0 + topH + gap, w: bw, h: h2 - topH - gap },
      { x: x0 + bw + gap, y: y0 + topH + gap, w: bw, h: h2 - topH - gap },
    ];
  }
  // Layout a: Hero Split — big left hero, two stacked on the right.
  const heroW = w2 * 0.6;
  const rw = w2 - heroW - gap;
  const rh = (h2 - gap) / 2;
  return [
    { x: x0, y: y0, w: heroW, h: h2 },
    { x: x0 + heroW + gap, y: y0, w: rw, h: rh },
    { x: x0 + heroW + gap, y: y0 + rh + gap, w: rw, h: rh },
  ];
}

function fitCaption(ctx, text, maxWidth, startSize) {
  let size = startSize;
  const font = (s) => `900 ${s}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  ctx.font = font(size);
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size = Math.floor(size * 0.92);
    ctx.font = font(size);
  }
  return { size, font: font(size) };
}

// Pan offsets that show the top of a photo (where faces usually are) instead
// of its middle, for a fill-fit panel that crops vertically.
export function topAnchor(img, rect, zoom = 1) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dh = ih * scale;
  return { ox: 0, oy: dh > rect.h ? (dh - rect.h) / (2 * rect.h) : 0 };
}

// Draw one photo into one panel rect, honouring zoom, pan offsets and fit mode.
export function drawPanel(ctx, rect, slot, grade, showHints) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const img = slot && slot.img;
  if (!img) {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    g.addColorStop(0, '#3a1c5e');
    g.addColorStop(0.55, '#c94b7c');
    g.addColorStop(1, '#ff8a3d');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    if (showHints) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `700 ${Math.max(11, Math.round(rect.w * 0.045))}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
    ctx.restore();
    return;
  }
  const zoom = slot.zoom || 1;
  const fit = slot.fit || 'fill';
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  let scale;
  if (fit === 'fit') {
    scale = Math.min(rect.w / iw, rect.h / ih) * zoom;
  } else {
    scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  }
  const dw = iw * scale;
  const dh = ih * scale;
  const ox = (slot.ox || 0) * rect.w;
  const oy = (slot.oy || 0) * rect.h;
  const dx = rect.x + (rect.w - dw) / 2 + ox;
  const dy = rect.y + (rect.h - dh) / 2 + oy;
  ctx.filter = grade.filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

// Colour grade overlay washed over the whole cover after the panels are drawn.
export function applyGrade(ctx, w, h, grade) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, grade.overlayTop);
  g.addColorStop(1, grade.overlayBottom);
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  // Gentle vignette so the edges feel finished.
  const v = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(10,0,25,0.22)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

function drawSunDisc(ctx, cx, cy, r, color) {
  const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#fff6c9');
  g.addColorStop(0.45, color);
  g.addColorStop(1, 'rgba(255,120,60,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawSkyline(ctx, x, baseY, w, maxH, color) {
  ctx.fillStyle = color;
  let bx = x;
  // Deterministic pseudo-random heights so the skyline is stable per width.
  let seed = 1234567;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  while (bx < x + w) {
    const bw = w * (0.03 + rnd() * 0.05);
    const bh = maxH * (0.25 + rnd() * 0.75);
    ctx.fillRect(bx, baseY - bh, bw, bh);
    // A couple of lit windows on taller blocks.
    if (bh > maxH * 0.55) {
      ctx.fillStyle = 'rgba(255,214,106,0.85)';
      ctx.fillRect(bx + bw * 0.3, baseY - bh * 0.7, 2, 2);
      ctx.fillRect(bx + bw * 0.6, baseY - bh * 0.45, 2, 2);
      ctx.fillStyle = color;
    }
    bx += bw + w * 0.008;
  }
}

function drawPalm(ctx, x, baseY, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // Trunk: a gentle lean.
  ctx.lineWidth = Math.max(2, s * 0.05);
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + s * 0.12, baseY - s * 0.55, x + s * 0.3, baseY - s);
  ctx.stroke();
  const crownX = x + s * 0.3;
  const crownY = baseY - s;
  // Fronds fanning out from the crown.
  ctx.lineWidth = Math.max(2, s * 0.045);
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI * 0.95) + (i * Math.PI * 0.9) / 6;
    const len = s * (0.55 + (i % 2) * 0.12);
    const ex = crownX + Math.cos(a) * len;
    const ey = crownY + Math.sin(a) * len * 0.55 + s * 0.18;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(
      crownX + Math.cos(a) * len * 0.5,
      crownY + Math.sin(a) * len * 0.5 - s * 0.12,
      ex, ey,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawCaption(ctx, w, bandY, bandH, caption, subtitle) {
  const text = (caption || 'VICE CITY').toUpperCase();
  const maxW = w * 0.92;
  const fitted = fitCaption(ctx, text, maxW, bandH * 0.46);
  ctx.font = fitted.font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = w / 2;
  const cy = bandY + bandH * 0.46;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.shadowColor = '#ff2fb3';
  ctx.shadowBlur = fitted.size * 0.08;
  ctx.shadowOffsetX = fitted.size * 0.035;
  ctx.shadowOffsetY = fitted.size * 0.035;
  ctx.strokeStyle = '#12061f';
  ctx.lineWidth = Math.max(3, fitted.size * 0.085);
  ctx.strokeText(text, cx, cy);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, cx, cy);
  if (subtitle) {
    const subSize = Math.max(10, Math.round(bandH * 0.15));
    ctx.font = `700 ${subSize}px "Helvetica Neue", Arial, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, Math.round(subSize * 0.22))}px`; } catch { /* older canvas */ }
    ctx.fillStyle = '#ffe95e';
    ctx.fillText(subtitle.toUpperCase(), cx, bandY + bandH * 0.85);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
}

function drawTitleBand(ctx, w, h, grade) {
  const bandY = h * 0.76;
  const bandH = h - bandY;
  const sky = ctx.createLinearGradient(0, bandY, 0, h);
  sky.addColorStop(0, grade.skyTop);
  sky.addColorStop(0.55, grade.skyMid);
  sky.addColorStop(1, grade.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, bandY, w, bandH);
  drawSunDisc(ctx, w * 0.84, bandY + bandH * 0.42, bandH * 0.46, grade.sun);
  drawSkyline(ctx, 0, h, w, bandH * 0.62, 'rgba(24,8,44,0.92)');
  drawPalm(ctx, w * 0.03, h, bandH * 0.95, 'rgba(16,5,32,0.95)');
  drawPalm(ctx, w * 0.97, h, bandH * 0.8, 'rgba(16,5,32,0.95)');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// The whole cover: white frame, photo panels, title band, caption, grade.
export function drawCover(ctx, w, h, state, showHints = false) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const panels = layoutPanels(state.layout || 'a', w, h);
  panels.forEach((rect, i) => {
    drawPanel(ctx, rect, state.photos[i] || null, grade, showHints);
  });
  drawTitleBand(ctx, w, h, grade);
  drawCaption(ctx, w, h * 0.76, h * 0.24, state.caption, state.subtitle);
  applyGrade(ctx, w, h, grade);
  // Small maker tag, top-left over the art.
  const tagSize = Math.max(10, Math.round(h * 0.016));
  ctx.font = `700 ${tagSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const label = 'VICE COVER STUDIO';
  const pad = tagSize * 0.7;
  const tw = ctx.measureText(label).width;
  const tx = Math.max(8, Math.round(w * 0.012));
  const ty = Math.max(8, Math.round(h * 0.02));
  ctx.fillStyle = 'rgba(10,4,24,0.62)';
  roundRect(ctx, tx - pad, ty - tagSize * 0.75, tw + pad * 2, tagSize * 1.5, tagSize * 0.75);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, tx, ty);
}

// Render the cover at exact export pixels on a fresh offscreen canvas.
export function exportCover(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, width, height, state, false);
  return canvas;
}
