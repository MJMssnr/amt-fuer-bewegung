// Florians Schule (FOS) auf der Stadtkarte (Mittelpunkt unten: cx, by).

import { C, shadow } from './town.js';

const ink = '#1a1c2c';

export function school(P, cx, by, n, t, dpr) {
  const w = 112, h = 40, x = cx - w / 2, y = by - h;
  shadow(P, cx, by + 1, w + 12);
  // Baukörper
  P.rect(x - 1, y - 1, w + 2, h + 2, ink);
  P.rect(x, y, w, h, '#f2d38a');
  P.rect(x, y + h - 3, w, 3, '#d9b86a');
  P.rect(x, y, w, 1, 'rgba(255,255,255,0.4)');
  // Flachdach mit Attika
  P.rect(x - 3, y - 5, w + 6, 5, ink); P.rect(x - 2, y - 4, w + 4, 3, '#8b6b4a');
  // Fensterbänder
  for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) {
    if (r === 1 && (i === 3 || i === 4)) continue;
    const wx = x + 5 + i * 13, wy = y + 6 + r * 15;
    P.rect(wx - 1, wy - 1, 10, 9, ink); P.rect(wx, wy, 8, 7, '#5fc9e8'); P.rect(wx, wy, 8, 2, '#a8ecff');
    P.rect(wx + 4, wy, 1, 7, '#e8f4f8');
  }
  // Eingang mit Glastür und Vordach
  P.rect(cx - 13, y + 18, 26, 3, ink); P.rect(cx - 12, y + 19, 24, 1, '#566c86');
  P.rect(cx - 9, y + 21, 18, h - 21, ink); P.rect(cx - 8, y + 22, 7, h - 22, '#7fd6ef'); P.rect(cx + 1, y + 22, 7, h - 22, '#7fd6ef');
  P.rect(cx - 12, by - 1, 24, 2, '#b9ae99');
  // Schild
  const label = n.sign ?? 'FOS / BOS';
  const sw = Math.max(40, Math.ceil(P.measure(label, 4.6, { bold: true, minPx: 9, dpr }).w) + 6);
  P.rect(cx - sw / 2, y + 2, sw, 9, ink); P.rect(cx - sw / 2 + 1, y + 3, sw - 2, 7, '#3b5dc9');
  P.text(label, cx, y + 6.6, 4.6, { color: '#ffffff', bold: true, minPx: 9, dpr });
  // Uhr an der Fassade
  P.blob(x + w - 9, y + 26, 4, ink); P.blob(x + w - 9, y + 26, 3, '#fbf6e6');
  P.px(x + w - 9, y + 24, ink); P.px(x + w - 9 + Math.round(Math.sin(t) * 2), y + 26 - Math.round(Math.cos(t) * 2), '#b13e53');
  // Fahnenmast und Fahrradständer
  P.rect(x - 8, y - 22, 1, h + 22, '#566c86');
  for (let i = 0; i < 7; i++) P.rect(x - 7 + i, y - 22 + Math.round(Math.sin(t * 4 - i * 0.7)), 1, 5, i % 2 ? '#ffcd75' : '#3b5dc9');
  for (const dx of [10, 22]) {
    P.blob(x + w + dx - 4, by - 3, 3, ink); P.blob(x + w + dx - 4, by - 3, 2, '#cfd6de');
    P.blob(x + w + dx + 4, by - 3, 3, ink); P.blob(x + w + dx + 4, by - 3, 2, '#cfd6de');
    P.rect(x + w + dx - 4, by - 6, 8, 1, dx === 10 ? '#e43b44' : '#38b764');
  }
  // Schulhof-Kreidezeichnung (Diagramm!)
  P.rect(x + 8, by + 3, 18, 1, '#ffffff'); P.rect(x + 8, by - 9, 1, 13, '#ffffff');
  for (let i = 0; i < 12; i++) P.px(x + 9 + i, by + 2 - Math.round((i * i) / 14), '#ffcd75');
  void C;
}
