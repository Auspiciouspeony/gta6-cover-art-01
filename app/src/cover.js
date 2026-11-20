// Vice Cover Studio — cover renderer (round 2).
// Draws the multi-panel GTA-style poster on any canvas: photo panels on top,
// an original sunset title band (sky, sun disc, skyline, palms) below, and a
// bold outlined caption. Poster dressing on top: cast role tags on the panels,
// an optional callout badge, a seal stamp and a billing block, plus a pop-out
// hero panel that breaks out of the frame and a title-over-the-art mode.
// No borrowed art, no font files — system fonts only.

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
  gold: {
    label: 'Gold',
    filter: 'saturate(1.35) contrast(1.1) sepia(0.45) hue-rotate(-12deg)',
    skyTop: '#ffc53d',
    skyMid: '#ff8a3d',
    skyBottom: '#7a2d12',
    overlayTop: 'rgba(255,190,60,0.18)',
    overlayBottom: 'rgba(160,60,0,0.16)',
    sun: '#fff3b0',
  },
  teal: {
    label: 'Teal',
    filter: 'saturate(1.3) contrast(1.08) hue-rotate(140deg)',
    skyTop: '#19d3c5',
    skyMid: '#0e7f8c',
    skyBottom: '#0b2a4d',
    overlayTop: 'rgba(0,220,200,0.15)',
    overlayBottom: 'rgba(0,90,160,0.16)',
    sun: '#c8fff4',
  },
  rose: {
    label: 'Rose',
    filter: 'saturate(1.5) contrast(1.1) hue-rotate(-45deg) sepia(0.08)',
    skyTop: '#ff7a9e',
    skyMid: '#e13d7a',
    skyBottom: '#4d1030',
    overlayTop: 'rgba(255,90,140,0.16)',
    overlayBottom: 'rgba(120,0,60,0.16)',
    sun: '#ffd1de',
  },
  dusk: {
    label: 'Dusk',
    filter: 'saturate(1.15) contrast(1.14) brightness(0.96) hue-rotate(18deg)',
    skyTop: '#5a3d99',
    skyMid: '#2c1a5e',
    skyBottom: '#0d0620',
    overlayTop: 'rgba(120,80,220,0.16)',
    overlayBottom: 'rgba(10,0,40,0.2)',
    sun: '#ffb347',
  },
  ink: {
    label: 'Poster Ink',
    filter: 'grayscale(0.85) contrast(1.28) brightness(1.04)',
    skyTop: '#f2ead8',
    skyMid: '#d8c49a',
    skyBottom: '#241a10',
    overlayTop: 'rgba(255,244,214,0.12)',
    overlayBottom: 'rgba(20,12,4,0.18)',
    sun: '#fff8e0',
  },
};

export const LAYOUTS = {
  a: { label: 'Hero Split' },
  b: { label: 'Triple Strip' },
  c: { label: 'Feature' },
  d: { label: 'Pop-Out Hero' },
  e: { label: 'Seven Panel' },
  f: { label: 'Slanted Strip' },
  g: { label: 'Five Frame' },
  h: { label: 'Feature Stack' },
};

export const SIZES = {
  wide: { w: 1920, h: 1080, label: '1920 × 1080' },
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
};

export const DEFAULT_ROLES = [
  'THE DRIVER',
  'THE FIXER',
  'THE LOOKOUT',
  'THE GETAWAY',
  'THE INSIDE MAN',
];

// Panel rectangles for a layout inside the art area (the top ~76% of the
// cover). Each panel names the photo slot it shows (photo: 0-4), or -1 for an
// original-art panel. popout panels are drawn after the title band, breaking
// out of the frame; slant panels are clipped as parallelograms.
export function layoutPanels(layout, w, h) {
  const gap = Math.max(4, Math.round(w * 0.007));
  const artH = h * 0.76;
  const x0 = gap;
  const y0 = gap;
  const w2 = w - gap * 2;
  const h2 = artH - gap;
  if (layout === 'b') {
    const pw = (w2 - gap * 2) / 3;
    return [0, 1, 2].map((p, i) => ({
      x: x0 + (pw + gap) * i, y: y0, w: pw, h: h2, photo: p,
    }));
  }
  if (layout === 'c') {
    const topH = h2 * 0.58;
    const bw = (w2 - gap) / 2;
    return [
      { x: x0, y: y0, w: w2, h: topH, photo: 0 },
      { x: x0, y: y0 + topH + gap, w: bw, h: h2 - topH - gap, photo: 1 },
      { x: x0 + bw + gap, y: y0 + topH + gap, w: bw, h: h2 - topH - gap, photo: 2 },
    ];
  }
  if (layout === 'd') {
    // Pop-Out Hero — big left hero that overlaps the title band, two stacked right.
    const heroW = w2 * 0.58;
    const rw = w2 - heroW - gap;
    const rh = (h2 - gap) / 2;
    return [
      { x: x0, y: y0, w: heroW, h: h2, photo: 0, popout: true, popExtra: (h - artH) * 0.5 },
      { x: x0 + heroW + gap, y: y0, w: rw, h: rh, photo: 1 },
      { x: x0 + heroW + gap, y: y0 + rh + gap, w: rw, h: rh, photo: 2 },
    ];
  }
  if (layout === 'e') {
    // Seven Panel — big hero left, six small cells right (two are art panels).
    const heroW = w2 * 0.52;
    const rx = x0 + heroW + gap;
    const rw = w2 - heroW - gap;
    const cw = (rw - gap) / 2;
    const ch = (h2 - gap * 2) / 3;
    const cells = [1, 2, 3, 4, -1, -1];
    const out = [{ x: x0, y: y0, w: heroW, h: h2, photo: 0 }];
    cells.forEach((p, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      out.push({
        x: rx + col * (cw + gap), y: y0 + row * (ch + gap), w: cw, h: ch, photo: p,
      });
    });
    return out;
  }
  if (layout === 'f') {
    // Slanted Strip — three diagonal panels, slanted like a speed line.
    const pw = (w2 - gap * 2) / 3;
    const slant = Math.round(w * 0.035);
    return [0, 1, 2].map((p, i) => ({
      x: x0 + (pw + gap) * i, y: y0, w: pw, h: h2, photo: p, slant,
    }));
  }
  if (layout === 'g') {
    // Five Frame — wide hero on top, four frames below.
    const topH = h2 * 0.55;
    const bw = (w2 - gap * 3) / 4;
    const out = [{ x: x0, y: y0, w: w2, h: topH, photo: 0 }];
    for (let i = 0; i < 4; i++) {
      out.push({
        x: x0 + i * (bw + gap), y: y0 + topH + gap, w: bw, h: h2 - topH - gap, photo: i + 1,
      });
    }
    return out;
  }
  if (layout === 'h') {
    // Feature Stack — tall hero left, three stacked right.
    const heroW = w2 * 0.55;
    const rw = w2 - heroW - gap;
    const rh = (h2 - gap * 2) / 3;
    const out = [{ x: x0, y: y0, w: heroW, h: h2, photo: 0 }];
    for (let i = 0; i < 3; i++) {
      out.push({
        x: x0 + heroW + gap, y: y0 + i * (rh + gap), w: rw, h: rh, photo: i + 1,
      });
    }
    return out;
  }
  // Layout a: Hero Split — big left hero, two stacked on the right.
  const heroW = w2 * 0.6;
  const rw = w2 - heroW - gap;
  const rh = (h2 - gap) / 2;
  return [
    { x: x0, y: y0, w: heroW, h: h2, photo: 0 },
    { x: x0 + heroW + gap, y: y0, w: rw, h: rh, photo: 1 },
    { x: x0 + heroW + gap, y: y0 + rh + gap, w: rw, h: rh, photo: 2 },
  ];
}

// The title band's caption area: full width, except the pop-out hero layout,
// where the hero overlaps the band's left side and the caption sits right.
export function captionArea(layout, w) {
  if (layout === 'd') {
    const gap = Math.max(4, Math.round(w * 0.007));
    const heroW = (w - gap * 2) * 0.58;
    return { x: heroW + gap * 2, w: w - heroW - gap * 3 };
  }
  return { x: 0, w };
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

// Original mini sunset art for art panels: sky, sun, skyline, one palm.
function drawArtPanel(ctx, rect, grade) {
  const sky = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  sky.addColorStop(0, grade.skyTop);
  sky.addColorStop(0.6, grade.skyMid);
  sky.addColorStop(1, grade.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  drawSunDisc(ctx, rect.x + rect.w * 0.72, rect.y + rect.h * 0.34, Math.min(rect.w, rect.h) * 0.22, grade.sun);
  drawSkyline(ctx, rect.x, rect.y + rect.h, rect.w, rect.h * 0.34, 'rgba(24,8,44,0.92)');
  drawPalm(ctx, rect.x + rect.w * 0.1, rect.y + rect.h, Math.min(rect.w, rect.h) * 0.5, 'rgba(16,5,32,0.95)');
}

// A cast role tag chip on a photo panel, bottom-left (inset past a slant).
function drawRoleTag(ctx, rect, role) {
  if (!role || rect.w < 90) return;
  const size = Math.max(9, Math.round(Math.min(rect.w * 0.055, rect.h * 0.11)));
  ctx.font = `800 ${size}px "Helvetica Neue", Arial, sans-serif`;
  const text = role.toUpperCase();
  const tw = ctx.measureText(text).width;
  const pad = size * 0.7;
  const bx = rect.x + (rect.slant || 0) + Math.max(6, rect.w * 0.03);
  const by = rect.y + rect.h - Math.max(6, rect.h * 0.06) - size * 1.7;
  ctx.fillStyle = 'rgba(10,4,24,0.78)';
  roundRect(ctx, bx, by, tw + pad * 2, size * 1.7, size * 0.4);
  ctx.fill();
  ctx.fillStyle = '#ffe95e';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + pad, by + size * 0.88);
}

// Draw one photo into one panel rect, honouring zoom, pan offsets and fit mode.
export function drawPanel(ctx, rect, slot, grade, showHints, role) {
  const slant = rect.slant || 0;
  const drawRect = slant
    ? { x: rect.x - slant, y: rect.y, w: rect.w + slant * 2, h: rect.h }
    : rect;
  ctx.save();
  ctx.beginPath();
  if (slant) {
    ctx.moveTo(rect.x + slant, rect.y);
    ctx.lineTo(rect.x + rect.w + slant, rect.y);
    ctx.lineTo(rect.x + rect.w - slant, rect.y + rect.h);
    ctx.lineTo(rect.x - slant, rect.y + rect.h);
    ctx.closePath();
  } else {
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.clip();
  if (rect.photo === -1 || !slot || !slot.img) {
    if (rect.photo === -1) {
      drawArtPanel(ctx, drawRect, grade);
    } else {
      const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
      g.addColorStop(0, '#3a1c5e');
      g.addColorStop(0.55, '#c94b7c');
      g.addColorStop(1, '#ff8a3d');
      ctx.fillStyle = g;
      ctx.fillRect(drawRect.x, drawRect.y, drawRect.w, drawRect.h);
      if (showHints) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = `700 ${Math.max(11, Math.round(rect.w * 0.045))}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
      }
    }
    ctx.restore();
    return;
  }
  const img = slot.img;
  const zoom = slot.zoom || 1;
  const fit = slot.fit || 'fill';
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  let scale;
  if (fit === 'fit') {
    scale = Math.min(drawRect.w / iw, drawRect.h / ih) * zoom;
  } else {
    scale = Math.max(drawRect.w / iw, drawRect.h / ih) * zoom;
  }
  const dw = iw * scale;
  const dh = ih * scale;
  const ox = (slot.ox || 0) * rect.w;
  const oy = (slot.oy || 0) * rect.h;
  const dx = drawRect.x + (drawRect.w - dw) / 2 + ox;
  const dy = drawRect.y + (drawRect.h - dh) / 2 + oy;
  ctx.filter = grade.filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  if (role) drawRoleTag(ctx, rect, role);
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

// Angled callout badge over the art, top-right: a quoted line of praise.
function drawCallout(ctx, w, h, text) {
  if (!text) return;
  const artH = h * 0.76;
  const size = Math.max(11, Math.round(h * 0.024));
  ctx.save();
  ctx.font = `800 ${size}px "Helvetica Neue", Arial, sans-serif`;
  const label = `★ “${text.toUpperCase()}”`;
  const tw = ctx.measureText(label).width;
  const pad = size * 0.8;
  const bw = tw + pad * 2;
  const bh = size * 2.1;
  const bx = w - bw - Math.max(10, w * 0.02);
  const by = Math.max(10, artH * 0.07);
  ctx.translate(bx + bw / 2, by + bh / 2);
  ctx.rotate(-0.045);
  ctx.fillStyle = '#ffe95e';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = size * 0.5;
  ctx.shadowOffsetY = size * 0.18;
  roundRect(ctx, -bw / 2, -bh / 2, bw, bh, size * 0.35);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#1c0a2e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, size * 0.06);
  ctx.restore();
}

// Circular seal stamp. cx/cy/r are explicit so the pop-out layout can stamp
// the hero photo instead of the title band.
function drawSeal(ctx, grade, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.12);
  ctx.fillStyle = 'rgba(18,6,31,0.88)';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = grade.sun;
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = grade.sun;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const big = Math.max(9, Math.round(r * 0.34));
  ctx.font = `900 ${big}px "Arial Black", Arial, sans-serif`;
  ctx.fillText('VICE', 0, -r * 0.16);
  const small = Math.max(7, Math.round(r * 0.16));
  ctx.font = `800 ${small}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillText('★ EST. 2026 ★', 0, r * 0.3);
  ctx.restore();
}

// Movie-poster billing block: tiny credits along the bottom of the band.
function drawBilling(ctx, w, h, roles) {
  const bandY = h * 0.76;
  const bandH = h - bandY;
  const size = Math.max(8, Math.round(bandH * 0.085));
  ctx.save();
  ctx.font = `700 ${size}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  const cast = (roles || []).filter(Boolean).slice(0, 3).join('  ·  ');
  ctx.fillText('A LEONIDA PICTURE', w / 2, bandY + bandH * 0.86);
  if (cast) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(cast, w / 2, bandY + bandH * 0.94);
  }
  ctx.restore();
}

function drawCaption(ctx, w, bandY, bandH, caption, subtitle, area, billing, titleOver) {
  const cx = area.x + area.w / 2;
  const maxW = area.w * 0.94;
  if (!titleOver) {
    const text = (caption || 'VICE CITY').toUpperCase();
    const fitted = fitCaption(ctx, text, maxW, bandH * 0.46);
    ctx.font = fitted.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
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
  }
  if (subtitle) {
    // Shrink the subtitle (with its letter-spacing) until it fits the area,
    // so it never runs under the seal stamp.
    let subSize = Math.max(10, Math.round(bandH * (titleOver ? 0.24 : 0.15)));
    const subFont = (s) => `700 ${s}px "Helvetica Neue", Arial, sans-serif`;
    const spacing = () => Math.max(2, Math.round(subSize * 0.22));
    ctx.font = subFont(subSize);
    try { ctx.letterSpacing = `${spacing()}px`; } catch { /* older canvas */ }
    while (subSize > 8 && ctx.measureText(subtitle.toUpperCase()).width > maxW) {
      subSize = Math.floor(subSize * 0.92);
      ctx.font = subFont(subSize);
      try { ctx.letterSpacing = `${spacing()}px`; } catch { /* older canvas */ }
    }
    ctx.fillStyle = '#ffe95e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      subtitle.toUpperCase(), cx,
      bandY + bandH * (billing ? (titleOver ? 0.62 : 0.72) : (titleOver ? 0.55 : 0.85)),
    );
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
}

// Big title drawn over the art area itself, GTA key-art style.
function drawTitleOverArt(ctx, w, h, caption) {
  const text = (caption || 'VICE CITY').toUpperCase();
  const artH = h * 0.76;
  const fitted = fitCaption(ctx, text, w * 0.96, h * 0.11);
  ctx.save();
  ctx.font = fitted.font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = w / 2;
  const cy = artH * 0.12;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = fitted.size * 0.1;
  ctx.shadowOffsetX = fitted.size * 0.04;
  ctx.shadowOffsetY = fitted.size * 0.04;
  ctx.strokeStyle = '#12061f';
  ctx.lineWidth = Math.max(3, fitted.size * 0.09);
  ctx.strokeText(text, cx, cy);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

function drawTitleBand(ctx, w, h, grade, state) {
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

// The whole cover: white frame, photo panels, title band, caption, grade,
// poster dressing (callout, seal, billing) and any pop-out hero on top.
export function drawCover(ctx, w, h, state, showHints = false) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  const layout = state.layout || 'a';
  const roles = state.roles || DEFAULT_ROLES;
  const titleOver = state.titleMode === 'over';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const panels = layoutPanels(layout, w, h);
  const popouts = panels.filter((p) => p.popout);
  panels.filter((p) => !p.popout).forEach((rect) => {
    const slot = rect.photo >= 0 ? (state.photos[rect.photo] || null) : null;
    drawPanel(ctx, rect, slot, grade, showHints, slot ? roles[rect.photo] : null);
  });
  drawTitleBand(ctx, w, h, grade, state);
  // Keep the caption and subtitle clear of the seal stamp on the right.
  // The pop-out layout stamps its seal on the hero photo instead, so its
  // band caption keeps the full right-hand area.
  const bandH = h * 0.24;
  const area = captionArea(layout, w);
  if (state.seal && layout !== 'd') area.w = Math.max(100, area.w - bandH * 1.0);
  drawCaption(
    ctx, w, h * 0.76, h * 0.24, state.caption, state.subtitle,
    area, Boolean(state.billing), titleOver,
  );
  if (state.seal && layout !== 'd') {
    const r = bandH * 0.44;
    drawSeal(ctx, grade, w - r - Math.max(10, w * 0.02), h * 0.76 + bandH * 0.52, r);
  }
  if (state.billing) drawBilling(ctx, w, h, roles);
  // Pop-out hero last: it breaks out of the frame over the title band.
  popouts.forEach((rect) => {
    const slot = state.photos[rect.photo] || null;
    const tall = { ...rect, h: rect.h + (rect.popExtra || 0) };
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = Math.max(8, w * 0.012);
    ctx.shadowOffsetY = Math.max(4, h * 0.006);
    drawPanel(ctx, tall, slot, grade, showHints, slot ? roles[rect.photo] : null);
    ctx.restore();
    // Crisp white cut-out border around the popped hero.
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(3, w * 0.006);
    ctx.strokeRect(tall.x, tall.y, tall.w, tall.h);
    ctx.restore();
  });
  // Title over the art goes on top of everything in the art area (a pop-out
  // hero would otherwise hide it), callout badge on top of that. The pop-out
  // layout's seal stamps the hero photo's lower corner, clear of the band.
  if (titleOver) drawTitleOverArt(ctx, w, h, state.caption);
  if (state.callout) drawCallout(ctx, w, h, state.callout);
  if (state.seal && layout === 'd') {
    const gap = Math.max(4, Math.round(w * 0.007));
    const heroRight = gap + (w - gap * 2) * 0.58;
    const r = bandH * 0.24;
    drawSeal(ctx, grade, heroRight - r - gap, h * 0.76 + bandH * 0.3, r);
  }
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
