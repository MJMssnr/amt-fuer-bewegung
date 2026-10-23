// Slavis Fotolabor auf der Stadtkarte (Mittelpunkt unten: cx, by) [W22].
// Dunkle Fassade, rote Dunkelkammer-Lampe, im Schaufenster ein Stroboskopbild; ab und zu blitzt es.

import { C, shadow } from './town.js';

const ink = '#1a1c2c';

export function fotolabor(P, cx, by, n, t, dpr) {
  const w = 58, h = 36, x = cx - w / 2, y = by - h;
  shadow(P, cx, by + 1, w + 8);
  P.rect(x - 1, y - 1, w + 2, h + 2, ink);
  P.rect(x, y, w, h, '#3a3f58');
  P.rect(x, y + h - 3, w, 3, '#2a2e42');
  P.rect(x, y, w, 1, 'rgba(255,255,255,0.25)');
  // Flachdach
  P.rect(x - 2, y - 4, w + 4, 4, ink); P.rect(x - 1, y - 3, w + 2, 2, '#566c86');
  // Schild
  const label = n.sign ?? 'FOTOLABOR';
  const sw = Math.max(44, Math.ceil(P.measure(label, 4.8, { bold: true, minPx: 9, dpr }).w) + 6);
  P.rect(cx - sw / 2, y + 2, sw, 9, ink); P.rect(cx - sw / 2 + 1, y + 3, sw - 2, 7, '#f4f4f4');
  P.text(label, cx, y + 6.7, 4.8, { color: ink, bold: true, minPx: 9, dpr });
  // Schaufenster mit Stroboskopbild: Ball in gleichmäßig wachsenden Abständen
  const fx = x + 4, fy = y + 14, fw = 30, fh = 16;
  P.rect(fx - 1, fy - 1, fw + 2, fh + 2, ink); P.rect(fx, fy, fw, fh, '#10122a');
  for (let i = 0; i < 6; i++) {
    const px = fx + 2 + Math.round(0.72 * i * i);
    P.blob(px + 1, fy + 8, 1, i === 5 ? '#ffffff' : `rgba(255,255,255,${0.35 + i * 0.1})`, 1);
  }
  P.rect(fx, fy + 12, fw, 1, '#ffcd75');
  // Tür mit roter Dunkelkammer-Lampe (pulsiert)
  P.rect(x + w - 16, y + h - 19, 11, 19, ink); P.rect(x + w - 15, y + h - 18, 9, 18, '#1f2233');
  P.px(x + w - 8, y + h - 9, C.markY);
  const glow = 0.55 + 0.45 * Math.sin(t * 3);
  P.rect(x + w - 13, y + h - 24, 5, 3, ink);
  P.rect(x + w - 12, y + h - 23, 3, 1, `rgba(228,59,68,${glow.toFixed(2)})`);
  // Blitz alle paar Sekunden: kurz weißes Schaufenster
  if (t % 4.5 < 0.08) P.rect(fx, fy, fw, fh, 'rgba(255,255,255,0.85)');
  P.rect(cx - 12, by - 1, 24, 1, '#b9ae99');
}
