// Fluss-Labor von oben [W34]: Fluss fließt von rechts nach links. Steg links (x = 0), Boje rechts (x = L).
// Strömungsstriche treiben mit vf, das Floß zeigt seine Fahrtrichtung, optional das Rettungsseil.

const INK = '#1a1c2c';

/** o: { L, x (m), vf, dir: 1|-1, rope: bool, t (s, Animationszeit), dpr } → geo { toPx } */
export function drawRiver(c, o) {
  const ctx = c.getContext('2d'), W = c.width, H = c.height, d = o.dpr ?? 1;
  const top = H * 0.16, bot = H * 0.8, x0 = W * 0.16, x1 = W * 0.86;
  const toPx = (x) => x0 + (x / o.L) * (x1 - x0);
  // Ufer
  ctx.fillStyle = '#6abe30'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#d9c48f'; ctx.fillRect(0, top - 5 * d, W, 5 * d); ctx.fillRect(0, bot, W, 5 * d);
  for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#3d9b3d' : '#26753a'; const tx = ((i * 0.137) % 1) * W; ctx.beginPath(); ctx.arc(tx, top - 13 * d - (i % 3) * 3 * d, 7 * d, 0, 7); ctx.fill(); }
  // Wasser
  ctx.fillStyle = '#4fa4d8'; ctx.fillRect(0, top, W, bot - top);
  ctx.fillStyle = '#3a7fb5'; ctx.fillRect(0, top + (bot - top) * 0.35, W, (bot - top) * 0.3);
  // Strömung: helle Striche treiben nach links, je schneller desto weiter
  const pxPerM = (x1 - x0) / o.L;
  for (let i = 0; i < 26; i++) {
    const yy = top + 6 * d + ((i * 37) % 100) / 100 * (bot - top - 12 * d);
    const base = ((i * 0.173) % 1) * W, shift = (o.t * o.vf * pxPerM) % W;
    const xx = ((base - shift) % W + W) % W;
    ctx.fillStyle = 'rgba(200,236,255,0.7)'; ctx.fillRect(xx, yy, (6 + o.vf * 3) * d, 1.5 * d);
  }
  // Steg und Boje
  ctx.fillStyle = '#a0622d'; ctx.fillRect(toPx(0) - 26 * d, (top + bot) / 2 - 6 * d, 22 * d, 12 * d);
  ctx.fillStyle = '#73441d'; for (let k = 0; k < 4; k++) ctx.fillRect(toPx(0) - 26 * d + k * 6 * d, (top + bot) / 2 - 6 * d, 1.5 * d, 12 * d);
  ctx.fillStyle = INK; ctx.fillRect(toPx(0) - 6 * d, (top + bot) / 2 - 9 * d, 3 * d, 18 * d); // Pfosten
  const by = (top + bot) / 2 + Math.sin(o.t * 2) * 1.5 * d;
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(toPx(o.L), by, 7 * d, 0, 7); ctx.fill();
  ctx.fillStyle = '#e43b44'; ctx.beginPath(); ctx.arc(toPx(o.L), by, 5.5 * d, 0, 7); ctx.fill();
  ctx.fillStyle = '#f4f4f4'; ctx.fillRect(toPx(o.L) - 5.5 * d, by - 1.5 * d, 11 * d, 3 * d);
  // Maßstab am unteren Ufer
  ctx.fillStyle = INK; ctx.font = `${14 * d}px "AmtPixel", monospace`; ctx.textAlign = 'center';
  ctx.fillText('Steg', toPx(0) - 15 * d, bot + 18 * d); ctx.fillText(`Boje · ${o.L} m`, toPx(o.L), bot + 18 * d);
  // Strömungspfeil
  const lbl = `◀ Strömung ${o.vf.toFixed(1).replace('.', ',')} m/s`, lw = ctx.measureText(lbl).width + 10 * d;
  ctx.fillStyle = 'rgba(26,28,44,0.7)'; ctx.fillRect(W - lw - 6 * d, top + 4 * d, lw, 19 * d);
  ctx.fillStyle = '#f4f4f4'; ctx.textAlign = 'left'; ctx.fillText(lbl, W - lw - 1 * d, top + 18 * d);
  // Seil
  const bx = toPx(o.x), byy = (top + bot) / 2;
  if (o.rope) { ctx.strokeStyle = '#ffcd75'; ctx.lineWidth = 2 * d; ctx.beginPath(); ctx.moveTo(toPx(0) - 4 * d, byy); ctx.quadraticCurveTo((toPx(0) + bx) / 2, byy + 10 * d, bx, byy); ctx.stroke(); }
  // Floß mit Motor und Bugwelle
  const dir = o.dir ?? 1, fw = 32 * d, fh = 17 * d;
  if (o.moving) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(bx - dir * (fw / 2 + 10 * d), byy - fh / 2, 8 * d, 2 * d); ctx.fillRect(bx - dir * (fw / 2 + 10 * d), byy + fh / 2 - 2 * d, 8 * d, 2 * d); }
  ctx.fillStyle = INK; ctx.fillRect(bx - fw / 2 - d, byy - fh / 2 - d, fw + 2 * d, fh + 2 * d);
  for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#c58b5e' : '#a0622d'; ctx.fillRect(bx - fw / 2 + k * (fw / 5), byy - fh / 2, fw / 5 - d, fh); }
  ctx.fillStyle = '#e43b44'; ctx.fillRect(bx - dir * (fw / 2 + 4 * d) - 3 * d, byy - 4 * d, 6 * d, 8 * d); // Motor hinten
  ctx.fillStyle = '#ffcd75'; ctx.fillRect(bx - 2 * d, byy - 3 * d, 5 * d, 6 * d); // Florian (von oben)
  return { toPx };
}
