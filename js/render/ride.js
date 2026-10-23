// Florian auf Rennrad oder Rennmotorrad auf der Stadtkarte [W26].
// Welt-Maßstab der Karte: Florian ist 14×22 groß. Seitenansicht bei waagrechter Fahrt, sonst kompakte Front/Heck-Ansicht.
// Motorrad: pitch > 0 Wheelie (um das Hinterrad), pitch < 0 Stoppie (um das Vorderrad), lean = Schräglage in der Kurve.

import { getSprite } from './pixel.js';

const ink = '#1a1c2c';

function wheel(P, x, y, r, rot, rim = '#c2c7cf') {
  P.blob(x, y, r, ink); P.blob(x, y, r - 1, '#3a3f58'); P.blob(x, y, 1, rim);
  for (let i = 0; i < 2; i++) {
    const a = rot + (i * Math.PI) / 2;
    P.px(x + Math.round(Math.cos(a) * (r - 2)), y + Math.round(Math.sin(a) * (r - 2)), rim);
    P.px(x - Math.round(Math.cos(a) * (r - 2)), y - Math.round(Math.sin(a) * (r - 2)), rim);
  }
}

/** Oberkörper von Florian (Seitenansicht), ab Zeile 0 bis rows, an Position (x, y) = linke obere Ecke */
function torso(P, x, y, rows, flip, helmet) {
  const sp = getSprite('florian_side'), fr = sp.frames[0];
  const ctx = P.ctx, X = P.X(x), Y = P.Y(y), W = P.X(x + sp.w) - X, H = P.Y(y + rows) - Y;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  if (flip) { ctx.translate(X + W, Y); ctx.scale(-1, 1); ctx.drawImage(fr, 0, 0, sp.w, rows, 0, 0, W, H); }
  else ctx.drawImage(fr, 0, 0, sp.w, rows, X, Y, W, H);
  ctx.restore();
  if (helmet) {
    P.blob(x + 7, y + 4, 5, ink); P.blob(x + 7, y + 4, 4, '#e43b44');
    P.rect(x + (flip ? 2 : 8), y + 3, 4, 2, '#2b2f6b'); P.px(x + (flip ? 3 : 10), y + 3, '#73eff7');
  }
}

/** Rennrad. dist = gefahrene Strecke (für Raddrehung und Tretbewegung) */
export function bikeRide(P, x, y, dir, flip, dist) {
  if (dir !== 'side') return compact(P, x, y, dir, dist, '#e43b44', false);
  const s = flip ? -1 : 1, rot = dist / 4;
  wheel(P, x - 7 * s, y - 4, 4, rot); wheel(P, x + 7 * s, y - 4, 4, rot);
  // Rahmen
  for (let i = 0; i <= 7; i++) P.px(x - 7 * s + i * s, y - 4 - Math.round(i * 0.6), '#e43b44');
  for (let i = 0; i <= 7; i++) P.px(x + i * s, y - 8 + Math.round(i * 0.5), '#e43b44');
  P.rect(x - 1, y - 9, 2, 5, '#e43b44'); P.rect(x + 5 * s - (s < 0 ? 2 : 0), y - 11, 3, 1, ink);
  // Florian: Oberkörper nach vorn gebeugt, Beine treten
  torso(P, x - 7 + 1 * s, y - 22, 14, flip, false);
  const a = dist / 3;
  for (const ph of [0, Math.PI]) {
    const fx = x + Math.round(Math.cos(a + ph) * 2) * s, fy = y - 5 + Math.round(Math.sin(a + ph) * 2);
    P.rect(Math.min(x, fx), Math.min(y - 9, fy), Math.abs(fx - x) + 1, Math.abs(fy - (y - 9)) + 1, '#29366f');
    P.rect(fx - 1, fy, 2, 1, '#f4f4f4');
  }
}

/** Rennmotorrad mit Wheelie/Stoppie, Schräglage und Knieschleifer-Funken */
export function motoRide(P, x, y, dir, flip, dist, { pitch = 0, lean = 0, t = 0 } = {}) {
  if (dir !== 'side') return compact(P, x, y, dir, dist, '#e43b44', true);
  const s = flip ? -1 : 1, rot = dist / 4;
  const ctx = P.ctx;
  // Drehpunkt: Hinterrad (Wheelie) oder Vorderrad (Stoppie)
  const pivX = pitch >= 0 ? x - 8 * s : x + 9 * s, pivY = y - 4;
  ctx.save();
  ctx.translate(P.X(pivX), P.Y(pivY));
  ctx.rotate(-pitch * s + lean * 0.35);
  ctx.translate(-P.X(pivX), -P.Y(pivY));
  wheel(P, x - 8 * s, y - 4, 4, rot); wheel(P, x + 9 * s, y - 4, 4, rot);
  // Verkleidung
  const L = (dx) => (s > 0 ? x + dx : x - dx);
  P.rect(Math.min(L(-6), L(10)), y - 11, 16, 5, ink);
  P.rect(Math.min(L(-5), L(9)), y - 10, 14, 3, '#e43b44');
  P.rect(Math.min(L(6), L(10)), y - 12, 4, 2, ink); P.px(L(9), y - 10, '#fff4b0');
  P.rect(Math.min(L(-6), L(-1)), y - 7, 5, 2, '#94b0c2'); // Auspuff
  P.rect(Math.min(L(-2), L(4)), y - 7, 6, 2, '#f4f4f4');
  // Fahrer tief geduckt mit Helm
  torso(P, x - 7 - 1 * s, y - 20, 12, flip, true);
  P.rect(Math.min(L(-2), L(3)), y - 9, 5, 2, '#29366f');
  if (Math.abs(lean) > 0.3) { // Knie am Boden: Funken
    const kx = L(1), ky = y - 1;
    for (let i = 0; i < 4; i++) P.px(kx - s * (i * 2 + Math.round(Math.random() * 2)), ky - Math.round(Math.random() * 2), i % 2 ? '#ffcd75' : '#ffffff');
  }
  ctx.restore();
}

/** Kompakte Ansicht von vorn/hinten bei senkrechter Fahrt */
function compact(P, x, y, dir, dist, col, helmet) {
  const sp = getSprite(`florian_${dir}`), fr = sp.frames[0];
  P.rect(x - 1, y - 8, 2, 8, ink); P.rect(x - 1, y - 7, 2, 6, '#3a3f58');
  if (Math.floor(dist / 3) % 2) P.px(x, y - 4, '#c2c7cf');
  P.rect(x - 4, y - 11, 8, 3, ink); P.rect(x - 3, y - 10, 6, 1, col);
  const ctx = P.ctx, X = P.X(x - sp.w / 2), Y = P.Y(y - 24), W = P.X(x + sp.w / 2) - X, H = P.Y(y - 24 + 15) - Y;
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(fr, 0, 0, sp.w, 15, X, Y, W, H); ctx.restore();
  if (helmet) { P.blob(x, y - 20, 5, ink); P.blob(x, y - 20, 4, '#e43b44'); if (dir === 'down') P.rect(x - 3, y - 21, 6, 2, '#2b2f6b'); }
}

/** Abgasschwaden: Liste { x, y, t0 } wird vom Aufrufer gepflegt */
export function smoke(P, puffs, now) {
  for (const p of puffs) {
    const a = (now - p.t0) / 0.9;
    if (a >= 1) continue;
    const r = 1 + Math.round(a * 4);
    P.blob(p.x - p.vx * a * 10, p.y - a * 6, r, `rgba(220,224,232,${(0.55 * (1 - a)).toFixed(2)})`);
  }
}
