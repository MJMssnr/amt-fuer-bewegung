// Bauplatz neben dem Baumhaus [W24]: erst leer mit Schild, im Finale steht hier die rote Rakete.
// LOT.phase: 'empty' | 'ready' (Kisten stehen bereit) | 'done' (nach dem Finale: neue Rakete steht bereit [W33])

import { shadow } from './town.js';
import { rocket } from './vehicles.js';

const ink = '#1a1c2c';
export const LOT = { phase: 'empty' };

export function bauplatz(P, cx, by, n, t, dpr) {
  const w = 44, h = 26, x = cx - w / 2, y = by - h;
  shadow(P, cx, by + 1, w + 4);
  P.rect(x - 1, y - 1, w + 2, h + 2, '#8a7a5c');
  P.rect(x, y, w, h, '#c9b98f');
  for (let i = 0; i < 26; i++) P.px(x + ((i * 17) % w), y + ((i * 11) % h), i % 2 ? '#b3a37b' : '#ddd0a8');
  // Zaunpfosten
  for (const px of [x - 2, x + w + 1]) { P.rect(px, y - 6, 2, h + 6, '#7d4c26'); }
  P.rect(x - 2, y - 4, w + 5, 1, '#7d4c26');
  if (LOT.phase === 'done') {
    P.blob(cx - 4, by - 8, 9, 'rgba(40,40,48,0.35)', 4); // alter Brandfleck
    rocket(P, cx - 4, by - 7, t, 0, true);              // Nachschub: die nächste rote Rakete
  }
  if (LOT.phase === 'ready') {
    for (const [dx, dy] of [[-12, -6], [0, -9], [11, -5]]) {
      P.rect(cx + dx - 5, by + dy - 8, 10, 8, ink); P.rect(cx + dx - 4, by + dy - 7, 8, 6, '#a0622d');
      P.rect(cx + dx - 4, by + dy - 7, 8, 1, '#c58b5e');
    }
  }
  // Schild
  P.rect(cx + 14, y - 14, 1, 12, '#566c86');
  P.rect(cx + 6, y - 20, 18, 8, ink); P.rect(cx + 7, y - 19, 16, 6, '#fff7e0');
  P.text(LOT.phase === 'done' ? '★' : '?', cx + 15, y - 15.6, 4.6, { color: '#b13e53', bold: true, minPx: 8, dpr });
}
