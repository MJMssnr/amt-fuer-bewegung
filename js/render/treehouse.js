// Florians Baumhaus auf der Stadtkarte (Mittelpunkt unten: cx, by).

import { C, shadow } from './town.js';

const ink = '#1a1c2c';

export function treehouse(P, cx, by, n, t, dpr) {
  const sway = Math.round(Math.sin(t * 1.1) * 0.6);
  shadow(P, cx, by + 1, 70);
  // Stamm mit Wurzeln
  P.rect(cx - 7, by - 46, 14, 46, ink);
  P.rect(cx - 6, by - 46, 12, 46, C.trunk);
  P.rect(cx + 2, by - 46, 3, 46, C.trunkD);
  P.rect(cx - 4, by - 30, 2, 6, C.trunkD); P.rect(cx - 2, by - 14, 3, 2, C.trunkD);
  P.rect(cx - 12, by - 3, 8, 3, C.trunk); P.rect(cx + 5, by - 3, 9, 3, C.trunk);
  // Krone (hinten)
  P.blob(cx - 22 + sway, by - 62, 18, C.leafD, 14);
  P.blob(cx + 24 + sway, by - 60, 18, C.leafD, 14);
  P.blob(cx + sway, by - 74, 26, C.leafD, 16);
  P.blob(cx - 4 + sway, by - 78, 20, C.leaf, 12);
  P.blob(cx - 22 + sway, by - 64, 12, C.leaf, 9);
  P.blob(cx + 22 + sway, by - 63, 12, C.leaf, 9);
  P.blob(cx - 10 + sway, by - 84, 8, C.leafL, 5);
  // Plattform
  const py = by - 44;
  P.rect(cx - 30, py, 60, 5, ink); P.rect(cx - 29, py + 1, 58, 3, C.wood);
  for (let i = 0; i < 58; i += 6) P.rect(cx - 29 + i, py + 1, 1, 3, C.woodD);
  P.rect(cx - 26, py + 5, 2, 8, C.woodD); P.rect(cx + 24, py + 5, 2, 8, C.woodD);
  // Geländer
  P.rect(cx - 30, py - 7, 60, 2, C.woodD);
  for (let i = 0; i <= 58; i += 6) P.rect(cx - 30 + i, py - 6, 2, 6, C.wood);
  // Häuschen
  const hx = cx - 18, hy = py - 28;
  P.rect(hx - 1, hy - 1, 38, 29, ink);
  P.rect(hx, hy, 36, 27, '#c98a4b');
  for (let r = 0; r < 27; r += 4) P.rect(hx, hy + r, 36, 1, '#a86e36');
  // Dach
  for (let r = 0; r < 7; r++) {
    const w = 44 - r * 6;
    P.rect(cx - w / 2 - 1, hy - 3 - r * 3, w + 2, 4, ink);
    P.rect(cx - w / 2, hy - 2 - r * 3, w, 3, r % 2 ? '#b13e53' : '#c0473b');
  }
  // Rundfenster mit warmem Licht + Tür
  P.blob(cx - 8, hy + 11, 6, ink); P.blob(cx - 8, hy + 11, 5, '#ffe7a3');
  P.rect(cx - 8, hy + 6, 1, 10, ink); P.rect(cx - 13, hy + 11, 10, 1, ink);
  P.rect(cx + 4, hy + 8, 10, 19, ink); P.rect(cx + 5, hy + 9, 8, 18, '#7a4a2a'); P.px(cx + 11, hy + 18, C.markY);
  // Schild
  P.rect(cx - 15, hy + 20, 14, 6, ink); P.rect(cx - 14, hy + 21, 12, 4, '#fff7e0');
  P.text('AMT', cx - 8, hy + 23, 3.4, { color: ink, bold: true, minPx: 7, dpr });
  // Wimpel auf dem Dach
  P.rect(cx, hy - 30, 1, 10, ink);
  for (let i = 0; i < 8; i++) P.rect(cx + 1 + i, hy - 30 + Math.round(Math.sin(t * 5 - i * 0.7)), 1, 4 - Math.floor(i / 2), '#ffcd75');
  // Lichterkette
  for (let i = 0; i < 9; i++) {
    const lx = cx - 28 + i * 7, ly = py - 9 + Math.round(Math.sin(i * 0.9) * 1.5);
    const on = Math.sin(t * 3 + i * 1.7) > -0.3;
    P.rect(lx, ly, 2, 2, on ? ['#ff6b6b', '#ffd166', '#73eff7', '#a7f070'][i % 4] : '#566c86');
  }
  // Strickleiter (schwingt leicht)
  const lad = Math.sin(t * 1.6) * 1.2;
  for (let s = 0; s < 8; s++) {
    const off = Math.round(lad * (s / 8));
    const ly = py + 5 + s * 5;
    P.rect(cx + 16 + off, ly, 1, 5, '#a0622d'); P.rect(cx + 23 + off, ly, 1, 5, '#a0622d');
    P.rect(cx + 16 + off, ly + 4, 8, 1, '#c98a4b');
  }
  // Briefkasten
  P.rect(cx - 22, by - 12, 1, 12, ink);
  P.rect(cx - 26, by - 16, 9, 5, ink); P.rect(cx - 25, by - 15, 7, 3, '#41a6f6');
  if (n.mail) { P.rect(cx - 18, by - 19, 1, 4, ink); P.rect(cx - 17, by - 19, 3, 2, '#e43b44'); }
}
