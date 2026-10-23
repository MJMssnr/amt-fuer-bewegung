// Neue Schauplätze [W32]: Polizeirevier (ganz links) und Hobbywerkstatt (ganz rechts).
// Signatur wie alle Gebäude: (P, cx, by, node, t, dpr) – Mittelpunkt unten.

import { C, shadow } from './town.js';

const ink = '#1a1c2c';

function sign(P, label, cx, y, dpr, bg, fg, minW = 40) {
  const sw = Math.max(minW, Math.ceil(P.measure(label, 4.8, { bold: true, minPx: 9, dpr }).w) + 6);
  P.rect(cx - sw / 2, y, sw, 9, ink); P.rect(cx - sw / 2 + 1, y + 1, sw - 2, 7, bg);
  P.text(label, cx, y + 4.7, 4.8, { color: fg, bold: true, minPx: 9, dpr });
}

/** Polizeirevier: weiß-blaue Fassade, Blaulicht auf dem Dach, Streifenwagen davor */
export function police(P, cx, by, n, t, dpr) {
  const w = 50, h = 38, x = cx - w / 2, y = by - h;
  shadow(P, cx, by + 1, w + 8);
  P.rect(x - 1, y - 1, w + 2, h + 2, ink);
  P.rect(x, y, w, h, '#eef2f6');
  P.rect(x, y + 12, w, 4, '#2a4d8f'); // blaues Band
  P.rect(x, y + h - 3, w, 3, '#c2c7cf');
  // Dach mit Blaulicht
  P.rect(x - 2, y - 4, w + 4, 4, ink); P.rect(x - 1, y - 3, w + 2, 2, '#566c86');
  const on = Math.floor(t * 4) % 2;
  P.rect(cx - 4, y - 8, 8, 4, ink);
  P.rect(cx - 3, y - 7, 3, 2, on ? '#73eff7' : '#2a4d8f'); P.rect(cx, y - 7, 3, 2, on ? '#2a4d8f' : '#73eff7');
  sign(P, n.sign ?? 'POLIZEI', cx, y + 2, dpr, '#2a4d8f', '#f4f4f4');
  // Fenster und Tür
  for (const fx of [x + 4, x + 14]) { P.rect(fx, y + 19, 8, 8, ink); P.rect(fx + 1, y + 20, 6, 6, '#7fc8f8'); P.rect(fx + 1, y + 20, 6, 1, '#cfeeff'); }
  P.rect(x + w - 18, y + h - 17, 12, 17, ink); P.rect(x + w - 17, y + h - 16, 10, 16, '#2a4d8f');
  P.rect(x + w - 12, y + h - 16, 1, 16, ink); P.px(x + w - 14, y + h - 8, C.markY); P.px(x + w - 10, y + h - 8, C.markY);
  // Stern über der Tür
  P.px(x + w - 12, y + h - 21, C.markY); P.rect(x + w - 13, y + h - 20, 3, 1, C.markY); P.px(x + w - 12, y + h - 19, C.markY);
  P.rect(cx - 12, by - 1, 24, 1, '#b9ae99');
}

/** Hobbywerkstatt: Holzschuppen mit offenem Rolltor, Werkbank, Werkzeugwand; ab und zu Schweißfunken */
export function workshop(P, cx, by, n, t, dpr) {
  const w = 48, h = 34, x = cx - w / 2, y = by - h;
  shadow(P, cx, by + 1, w + 8);
  // Satteldach
  for (let i = 0; i < 8; i++) P.rect(x - 3 + i * 0.5 * 2, y - 8 + i, w + 6 - i * 2, 1, i % 2 ? '#9c3b2f' : '#b13e53');
  P.rect(x - 4, y - 1, w + 8, 2, ink);
  P.rect(x - 1, y, w + 2, h + 1, ink);
  for (let i = 0; i < w; i += 4) P.rect(x + i, y + 1, 4, h, i % 8 ? C.wood : '#b8763b');
  sign(P, n.sign ?? 'WERKSTATT', cx, y + 2, dpr, '#ffcd75', ink);
  // offenes Rolltor mit Werkbank und Werkzeugwand
  const dx = x + 6, dy = y + 13, dw = 26, dh = h - 13;
  P.rect(dx - 1, dy - 1, dw + 2, dh + 1, ink); P.rect(dx, dy, dw, dh, '#3a3f58');
  P.rect(dx, dy, dw, 3, '#94b0c2'); P.rect(dx, dy + 3, dw, 1, '#566c86'); // hochgerolltes Tor
  for (const [tx, col] of [[dx + 3, '#c2c7cf'], [dx + 7, '#e43b44'], [dx + 11, '#c2c7cf'], [dx + 16, '#ffcd75']]) P.rect(tx, dy + 6, 1, 5, col);
  P.rect(dx + 2, dy + dh - 8, dw - 4, 2, '#a0622d'); P.rect(dx + 3, dy + dh - 6, 1, 6, '#73441d'); P.rect(dx + dw - 4, dy + dh - 6, 1, 6, '#73441d');
  P.rect(dx + 8, dy + dh - 11, 5, 3, '#38b764'); // Bastelprojekt auf der Werkbank
  // Schweißfunken
  if (t % 3.2 < 0.7) {
    for (let i = 0; i < 5; i++) {
      const a = t * 17 + i * 1.3;
      P.px(dx + 18 + Math.round(Math.cos(a) * 3), dy + dh - 10 - Math.round(Math.abs(Math.sin(a)) * 4), i % 2 ? '#ffffff' : '#ffcd75');
    }
    P.px(dx + 18, dy + dh - 9, '#73eff7');
  }
  // Fenster rechts
  P.rect(x + w - 12, y + 15, 8, 8, ink); P.rect(x + w - 11, y + 16, 6, 6, '#ffe9a8');
  P.rect(cx - 12, by - 1, 24, 1, '#b9ae99');
}
