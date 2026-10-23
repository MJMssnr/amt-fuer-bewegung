// Unfallstelle für Typ S [W32]: Seitenansicht einer Straße mit Bremsspur, stehendem Auto, Wetter und Maßstab am Bordstein.
// Zwei Messmarken (A, B) mit Maßband dazwischen. Nur Darstellung; Ziehen und Prüfen macht js/tasks/skid.js.

import { getSprite } from './pixel.js';

const INK = '#1a1c2c';

/**
 * o: { range:[lo,hi] (m), skid:[x0,x1] (m), weather:'dry'|'rain'|'snow', limit:50, marks:[a,b] | null, dpr }
 * Rückgabe: geo { toPx(x), fromPx(X), road }
 */
export function drawSkid(c, o) {
  const ctx = c.getContext('2d'), W = c.width, H = c.height, d = o.dpr ?? 1;
  const [lo, hi] = o.range, m = 18 * d;
  const toPx = (x) => m + ((x - lo) / (hi - lo)) * (W - 2 * m);
  const fromPx = (X) => lo + ((X - m) / (W - 2 * m)) * (hi - lo);
  const road = H * 0.56, roadH = H * 0.22;
  const wx = o.weather ?? 'dry', t = o.t ?? 0;
  // Himmel und Hintergrund
  const sky = ctx.createLinearGradient(0, 0, 0, road);
  if (wx === 'rain') { sky.addColorStop(0, '#6b7385'); sky.addColorStop(1, '#a3abb9'); }
  else if (wx === 'snow') { sky.addColorStop(0, '#c9d3df'); sky.addColorStop(1, '#eef2f6'); }
  else { sky.addColorStop(0, '#7fc8f8'); sky.addColorStop(1, '#cfeeff'); }
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, road);
  for (let i = 0; i < 7; i++) { // Häuser
    const hx = (i / 7) * W, hw = W / 8, hh = H * (0.18 + ((i * 37) % 5) * 0.05);
    ctx.fillStyle = wx === 'rain' ? '#8a8fa0' : ['#e8b796', '#c9a7d8', '#a8c8e0', '#e6d29a'][i % 4];
    ctx.fillRect(hx, road - roadH * 0.15 - hh, hw, hh);
    if (wx === 'snow') { ctx.fillStyle = '#ffffff'; ctx.fillRect(hx, road - roadH * 0.15 - hh, hw, 3 * d); }
  }
  if (wx === 'dry') { ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(W - 30 * d, 22 * d, 11 * d, 0, 7); ctx.fill(); }
  // Gehweg, Fahrbahn
  ctx.fillStyle = wx === 'snow' ? '#f4f7fa' : '#cfc6b4'; ctx.fillRect(0, road - roadH * 0.15, W, roadH * 0.15);
  ctx.fillStyle = wx === 'rain' ? '#5f6577' : wx === 'snow' ? '#aab3c0' : '#7a8090'; ctx.fillRect(0, road, W, roadH);
  if (wx === 'rain') for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(160,200,235,0.45)'; ctx.fillRect(((i * 0.17 + 0.05) % 1) * W, road + roadH * (0.3 + (i % 3) * 0.2), 26 * d, 2.5 * d); }
  if (wx === 'snow') for (let i = 0; i < 40; i++) { ctx.fillStyle = '#ffffff'; ctx.fillRect(((i * 0.137) % 1) * W, road + ((i * 0.31) % 1) * roadH, 3 * d, 1.5 * d); }
  // Bremsspur: zwei dunkle Streifen, am Anfang blass
  const [s0, s1] = o.skid, X0 = toPx(s0), X1 = toPx(s1);
  const grad = ctx.createLinearGradient(X0, 0, X1, 0);
  grad.addColorStop(0, 'rgba(10,10,14,0.55)'); grad.addColorStop(0.12, 'rgba(10,10,14,0.9)'); grad.addColorStop(1, 'rgba(10,10,14,0.95)');
  ctx.fillStyle = grad;
  ctx.fillRect(X0, road + roadH * 0.3, X1 - X0, 4 * d); ctx.fillRect(X0, road + roadH * 0.62, X1 - X0, 4 * d);
  // Auto: Hinterrad steht am Ende der Spur
  const sp = getSprite('car_red'), k = (H * 0.2) / sp.h, cw = sp.w * k, ch = sp.h * k;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sp.frames[0], X1 - (5.5 / 24) * cw, road + roadH * 0.55 - ch, cw, ch);
  // Hindernis vor dem Auto (Aufprall mit Restgeschwindigkeit) [W33]
  if (o.obstacle) {
    const bx = X1 + (18.5 / 24) * cw + 2 * d, bh = H * 0.17, bw = bh * 0.7, by = road + roadH * 0.55 - bh;
    ctx.fillStyle = INK; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#38b764'; ctx.fillRect(bx + d, by + d, bw - 2 * d, bh - 2 * d);
    ctx.fillStyle = '#257179'; ctx.fillRect(bx - d, by, bw + 2 * d, 3 * d);
    ctx.fillStyle = '#ffcd75'; for (let i = 0; i < 4; i++) ctx.fillRect(bx - 4 * d - i * 2 * d, by + bh * 0.3 + (i % 2) * 4 * d, 2 * d, 2 * d); // Aufprall-Sternchen
  }
  // Tempo-Schild
  const sx = 10 * d, sy = road - roadH * 0.15 - 44 * d;
  ctx.fillStyle = '#94b0c2'; ctx.fillRect(sx + 9 * d, sy + 18 * d, 2 * d, 26 * d);
  ctx.fillStyle = '#e43b44'; ctx.beginPath(); ctx.arc(sx + 10 * d, sy + 10 * d, 10 * d, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(sx + 10 * d, sy + 10 * d, 7.5 * d, 0, 7); ctx.fill();
  ctx.fillStyle = INK; ctx.font = `bold ${9 * d}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(String(o.limit ?? 50), sx + 10 * d, sy + 13.2 * d);
  // Maßstab am Bordstein (unter der Fahrbahn)
  const ry = road + roadH + 3 * d;
  ctx.fillStyle = '#f4f4f4'; ctx.fillRect(0, road + roadH, W, H - road - roadH);
  ctx.fillStyle = INK; ctx.font = `${11 * d}px "AmtPixel", monospace`;
  for (let x = Math.ceil(lo * 2) / 2; x <= hi + 1e-9; x += 0.5) {
    const X = toPx(x), major = Math.abs(x - Math.round(x)) < 1e-6;
    ctx.fillRect(X, ry, 1.5 * d, (major ? 8 : 4) * d);
    if (major && Math.round(x) % (hi - lo > 16 ? 4 : 2) === 0) ctx.fillText(`${Math.round(x)} m`, X, ry + 19 * d);
  }
  // Regen / Schneefall
  if (wx === 'rain') { ctx.strokeStyle = 'rgba(200,225,255,0.6)'; ctx.lineWidth = 1.2 * d; for (let i = 0; i < 50; i++) { const x = ((i * 0.0731 + t * 0.4) % 1) * W, y = ((i * 0.193 + t * 1.3) % 1) * road; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3 * d, y + 9 * d); ctx.stroke(); } }
  if (wx === 'snow') { ctx.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) { const x = ((i * 0.0731 + Math.sin(t + i) * 0.01) % 1) * W, y = ((i * 0.193 + t * 0.15) % 1) * road; ctx.fillRect(x, y, 2.5 * d, 2.5 * d); } }
  // Messmarken mit Maßband
  if (o.marks) {
    const [a, b] = o.marks, A = toPx(a), B = toPx(b), y = road + roadH + 1.5 * d;
    ctx.fillStyle = 'rgba(255,205,117,0.9)'; ctx.fillRect(Math.min(A, B), y - 2 * d, Math.abs(B - A), 4 * d);
    for (const [X, lab] of [[A, 'A'], [B, 'B']]) {
      ctx.fillStyle = INK; ctx.fillRect(X - 0.75 * d, road - 20 * d, 1.5 * d, roadH + 24 * d);
      ctx.fillStyle = '#ffcd75'; ctx.fillRect(X - 9 * d, road - 34 * d, 18 * d, 14 * d);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5 * d; ctx.strokeRect(X - 9 * d, road - 34 * d, 18 * d, 14 * d);
      ctx.fillStyle = INK; ctx.font = `${11 * d}px "AmtPixel", monospace`; ctx.fillText(lab, X, road - 23.5 * d);
    }
    const len = Math.abs(b - a).toFixed(1).replace('.', ',');
    ctx.font = `bold ${12 * d}px system-ui, sans-serif`;
    const tw = ctx.measureText(`${len} m`).width + 8 * d, mx = (A + B) / 2;
    ctx.fillStyle = 'rgba(26,28,44,0.85)'; ctx.fillRect(mx - tw / 2, road - 52 * d, tw, 15 * d);
    ctx.fillStyle = '#ffffff'; ctx.fillText(`${len} m`, mx, road - 40.5 * d);
  }
  return { toPx, fromPx, road, top: road - 34 * d };
}
