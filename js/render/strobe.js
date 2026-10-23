// Stroboskopfoto zeichnen (Typen M, N, O) [W22]. Nur Darstellung.
// Hintergrund: 'night' (dunkles Studio), 'park' (Wiese), 'city' (Skyline). Objekt: 'ball' oder ein Sprite-Name.
// Bahn waagrecht (Standard), senkrecht (vertical: true, z. B. Fallschirmspringer) oder Pendelbogen.

import { getSprite } from './pixel.js';
import { fmt as fmtRaw } from './format.js';
import { atLeast2 } from '../engine/sigfig.js';

const fmt = (v) => atLeast2(fmtRaw(v), v);

const INK = '#1a1c2c';

/** Rechnet zwischen Metern und Canvas-Pixeln um (für Zeichnen und Ziehen). */
export function strobeGeometry(c, o) {
  const W = c.width, H = c.height, dpr = o.dpr ?? 1, m = 34 * dpr;
  if (o.pendulum) {
    const { L, amp } = o.pendulum, A = (amp * Math.PI) / 180;
    const sc = Math.min((W - 2 * m) / (2 * L * Math.sin(A) + 0.2), (H - 2 * m) / L);
    const px = W / 2, py = m * 0.6;
    const toPx = (x) => { const th = Math.asin(Math.max(-1, Math.min(1, x / L))); return [px + L * Math.sin(th) * sc, py + L * Math.cos(th) * sc]; };
    const fromPx = (X, Y) => { const th = Math.atan2(X - px, Y - py); const lim = A * 1.15; return L * Math.sin(Math.max(-lim, Math.min(lim, th))); };
    return { toPx, fromPx, pivot: [px, py], sc, ground: H - m * 0.4 };
  }
  const [lo, hi] = o.range;
  if (o.vertical) {
    const top = m * 1.2, bot = H - m * 0.6;
    const toPx = (x) => [W * 0.42, top + ((x - lo) / (hi - lo)) * (bot - top)];
    const fromPx = (X, Y) => lo + ((Y - top) / (bot - top)) * (hi - lo);
    return { toPx, fromPx, ground: H - m * 0.5 };
  }
  const ground = H * (o.ruler && o.ruler !== 'none' ? 0.66 : 0.8);
  const toPx = (x) => [m + ((x - lo) / (hi - lo)) * (W - 2 * m), ground];
  const fromPx = (X) => lo + ((X - m) / (W - 2 * m)) * (hi - lo);
  return { toPx, fromPx, ground };
}

function background(ctx, W, H, bg, dpr) {
  if (bg === 'park' || bg === 'city') {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#8fd3ff'); sky.addColorStop(1, '#e6f7ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    if (bg === 'city') {
      for (let i = 0; i < 14; i++) {
        const w = W / 12, h = H * (0.25 + ((i * 37) % 23) / 60);
        ctx.fillStyle = ['#c7b3e6', '#e3c4a8', '#b7d3e8', '#d9c1d8'][i % 4];
        ctx.fillRect(i * w * 0.9, H * 0.72 - h, w * 0.8, h);
      }
    }
    ctx.fillStyle = '#5dbb4f'; ctx.fillRect(0, H * 0.72, W, H * 0.28);
    ctx.fillStyle = '#4aa33f';
    for (let x = 0; x < W; x += 9 * dpr) ctx.fillRect(x, H * 0.72 + ((x * 7) % 11) * dpr, 2 * dpr, 3 * dpr);
    return;
  }
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1b1e38'); g.addColorStop(1, '#0c0e1f');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

let vertSmall = false;
function drawObj(ctx, obj, X, Y, s, alpha, flip = false) {
  ctx.globalAlpha = alpha;
  if (obj === 'ball' || !obj) {
    const r = 7 * s;
    ctx.fillStyle = '#ffcd75'; ctx.beginPath(); ctx.arc(X, Y - r, r, 0, 7); ctx.fill();
    ctx.lineWidth = 1.5 * s; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#fff7d6'; ctx.beginPath(); ctx.arc(X - r * 0.35, Y - r * 1.35, r * 0.3, 0, 7); ctx.fill();
  } else {
    const sp = getSprite(obj), k = (vertSmall ? 1.6 : 2.4) * s;
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(X, Y);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(sp.frames[0], (-sp.w * k) / 2, -sp.h * k, sp.w * k, sp.h * k);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/**
 * o: { bg, obj, positions:[x…] (m), range:[lo,hi], vertical, pendulum:{L,amp}, ruler:'band'|'bar'|'none', bar (m),
 *      alpha, flip, labels (Nummern an den Abbildern), dpr, extra:(ctx, geo)=>{} }
 */
export function drawStrobe(c, o) {
  const ctx = c.getContext('2d'), W = c.width, H = c.height, dpr = o.dpr ?? 1;
  const geo = strobeGeometry(c, o);
  background(ctx, W, H, o.bg ?? 'night', dpr);
  const night = (o.bg ?? 'night') === 'night';
  const line = night ? 'rgba(255,255,255,0.35)' : 'rgba(26,28,44,0.45)';
  ctx.lineWidth = 1.5 * dpr;
  if (o.pendulum) {
    const [px, py] = geo.pivot;
    ctx.fillStyle = night ? '#94b0c2' : INK; ctx.fillRect(px - 22 * dpr, py - 4 * dpr, 44 * dpr, 4 * dpr);
    ctx.strokeStyle = line; ctx.setLineDash([3 * dpr, 4 * dpr]);
    ctx.beginPath();
    const A = (o.pendulum.amp * Math.PI) / 180;
    ctx.arc(px, py, o.pendulum.L * geo.sc, Math.PI / 2 - A * 1.1, Math.PI / 2 + A * 1.1); ctx.stroke(); ctx.setLineDash([]);
  } else if (!o.vertical) {
    const [x0] = geo.toPx(o.range[0]), [x1] = geo.toPx(o.range[1]);
    ctx.strokeStyle = line; ctx.beginPath(); ctx.moveTo(x0 - 20 * dpr, geo.ground + 0.5); ctx.lineTo(x1 + 20 * dpr, geo.ground + 0.5); ctx.stroke();
  }
  ruler(ctx, geo, o, dpr, night);
  const alpha = o.alpha ?? 0.6;
  vertSmall = !!o.vertical;
  (o.positions ?? []).forEach((x, i) => {
    let [X, Y] = geo.toPx(x);
    if (o.pendulum) {
      ctx.strokeStyle = night ? 'rgba(255,255,255,0.25)' : 'rgba(26,28,44,0.3)';
      ctx.beginPath(); ctx.moveTo(...geo.pivot); ctx.lineTo(X, Y); ctx.stroke();
      Y += 7 * dpr;
    } else if (o.vertical) Y += 10 * dpr;
    drawObj(ctx, o.obj, X, Y, dpr, i === o.positions.length - 1 ? Math.min(1, alpha + 0.3) : alpha, o.flip);
    if (o.labels) label(ctx, `${i + 1}`, X, Y - (o.obj === 'ball' || !o.obj ? 22 : 44) * dpr, dpr, night);
  });
  o.extra?.(ctx, geo);
  return geo;
}

function label(ctx, txt, X, Y, dpr, night) {
  ctx.font = `${13 * dpr}px "AmtPixel", monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = night ? '#f4f4f4' : INK;
  ctx.fillText(txt, X, Y);
}

function ruler(ctx, geo, o, dpr, night) {
  if (!o.ruler || o.ruler === 'none' || o.pendulum) return;
  const col = night ? '#ffcd75' : INK;
  ctx.fillStyle = col; ctx.strokeStyle = col;
  ctx.font = `${12 * dpr}px "AmtPixel", monospace`; ctx.textAlign = 'center';
  if (o.ruler === 'bar') {
    // Maßstabsleiste: Länge o.bar Meter, unten links
    if (o.vertical) {
      const [X, a] = geo.toPx(o.range[0]), [, b] = geo.toPx(o.range[0] + o.bar), x = X + 46 * dpr;
      ctx.fillRect(x, a, 3 * dpr, b - a); ctx.fillRect(x - 4 * dpr, a, 11 * dpr, 1.5 * dpr); ctx.fillRect(x - 4 * dpr, b - 1.5 * dpr, 11 * dpr, 1.5 * dpr);
      ctx.textAlign = 'left'; ctx.fillText(`${fmt(o.bar)} m`, x + 10 * dpr, (a + b) / 2 + 4 * dpr);
      return;
    }
    const [a] = geo.toPx(o.range[0]), [b] = geo.toPx(o.range[0] + o.bar);
    const y = geo.ground + 26 * dpr;
    ctx.fillRect(a, y, b - a, 3 * dpr); ctx.fillRect(a, y - 4 * dpr, 1.5 * dpr, 11 * dpr); ctx.fillRect(b - 1.5 * dpr, y - 4 * dpr, 1.5 * dpr, 11 * dpr);
    ctx.fillText(`${fmt(o.bar)} m`, (a + b) / 2, y + 16 * dpr);
    return;
  }
  // Maßband mit Teilstrichen
  const [lo, hi] = o.range, span = hi - lo;
  const step = span <= 6 ? 1 : span <= 15 ? 2 : span <= 40 ? 5 : 10;
  const minor = step / (step === 2 ? 4 : 5);
  for (let x = Math.ceil(lo / minor) * minor; x <= hi + 1e-9; x += minor) {
    const major = Math.abs(x / step - Math.round(x / step)) < 1e-6;
    const [X, Y] = geo.toPx(x);
    if (o.vertical) { ctx.fillRect(X + 40 * dpr, Y, (major ? 10 : 5) * dpr, 1.5 * dpr); if (major) { ctx.textAlign = 'left'; ctx.fillText(`${fmt(x)} m`, X + 54 * dpr, Y + 4 * dpr); } }
    else { ctx.fillRect(X, Y + 6 * dpr, 1.5 * dpr, (major ? 10 : 5) * dpr); if (major) ctx.fillText(`${fmt(x)} m`, X, Y + 30 * dpr); }
  }
}
