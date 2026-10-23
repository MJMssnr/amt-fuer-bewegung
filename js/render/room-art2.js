// Baumhaus, Anbau rechts (x 360–480) und neue Gegenstände [W26]: Vitrine mit Rechenmaschinen, Schachbrett,
// Schlafcouch, Discokugel, drei Pflanzen, Bild „Mitarbeiter des Monats“, Bärtis Körbchen, Motorradhelm.

import { C } from './town.js';
import { getSprite } from './pixel.js';

const ink = '#1a1c2c';

export const SLOTS2 = {
  vitrine:     { x: 372, y: 76,  w: 40, h: 52 },
  bild:        { x: 374, y: 22,  w: 36, h: 44 },
  pflanze1:    { x: 338, y: 82,  w: 26, h: 46 },
  pflanze2:    { x: 450, y: 62,  w: 28, h: 66 },
  pflanze3:    { x: 238, y: 8,   w: 24, h: 40 },
  discokugel:  { x: 292, y: 8,   w: 20, h: 30 },
  schach:      { x: 368, y: 146, w: 34, h: 32 },
  couch:       { x: 408, y: 140, w: 68, h: 44 },
  waschbaer:   { x: 262, y: 182, w: 36, h: 16 },
  motorrad:    { x: 418, y: 28,  w: 24, h: 26 },
};

function leaf(P, x, y, w, h, col, dark) {
  for (let i = 0; i < h; i++) {
    const ww = Math.round(w * Math.sin((Math.PI * (i + 0.5)) / h));
    P.rect(x - Math.floor(ww / 2), y + i, ww, 1, i % 3 === 0 ? dark : col);
  }
  P.rect(x, y, 1, h, dark);
}

export const DRAW2 = {
  vitrine(P, t) {
    const { x, y } = SLOTS2.vitrine;
    P.rect(x, y, 40, 52, ink); P.rect(x + 1, y + 1, 38, 50, '#6b4226');
    P.rect(x + 3, y + 3, 34, 40, '#cfe8f5'); P.rect(x + 3, y + 3, 34, 3, '#eef8ff');
    for (const sy of [18, 31]) P.rect(x + 3, y + sy, 34, 1, '#6b4226');
    // mechanische Rechenmaschinen: Kurbel, Tasten, Zählwerk
    const machine = (mx, my, col) => {
      P.rect(mx, my, 12, 8, ink); P.rect(mx + 1, my + 1, 10, 6, col);
      for (let i = 0; i < 4; i++) P.px(mx + 2 + i * 2, my + 5, '#f4f4f4');
      P.rect(mx + 2, my + 2, 6, 1, '#ffcd75');
      const a = t * 2 + mx;
      P.rect(mx + 11, my + 3, 2, 1, ink); P.px(mx + 13 + Math.round(Math.cos(a)), my + 3 + Math.round(Math.sin(a)), '#c2c7cf');
    };
    machine(x + 5, y + 9, '#3b5dc9'); machine(x + 21, y + 9, '#38b764');
    machine(x + 5, y + 22, '#b13e53'); machine(x + 21, y + 22, '#566c86');
    P.rect(x + 8, y + 35, 22, 6, '#94b0c2'); P.text('1937', x + 19, y + 38.4, 3.4, { color: ink, minPx: 7, dpr: P.dpr });
    P.rect(x + 2, y + 45, 36, 5, '#4a2d1a');
    if (Math.sin(t * 0.7) > 0.95) P.rect(x + 6, y + 4, 2, 36, 'rgba(255,255,255,0.6)');
  },
  bild(P, t) {
    const { x, y } = SLOTS2.bild;
    P.rect(x, y, 36, 44, ink); P.rect(x + 1, y + 1, 34, 42, '#d9a03a'); P.rect(x + 3, y + 3, 30, 30, '#7fc8f8');
    const sp = getSprite('florian_down');
    P.image(sp.frames[0], x + 18 - sp.w * 0.9, y + 33 - sp.h * 1.3, sp.w * 1.8, sp.h * 1.3);
    P.rect(x + 3, y + 34, 30, 7, '#fff7e0');
    P.text('Mitarbeiter', x + 18, y + 36.2, 2.6, { color: ink, minPx: 6, dpr: P.dpr });
    P.text('des Monats', x + 18, y + 39.4, 2.6, { color: ink, minPx: 6, dpr: P.dpr });
    P.px(x + 30, y + 6, Math.sin(t * 4) > 0 ? '#fff7e0' : '#ffcd75'); // Glanz
  },
  pflanze1(P, t) { // Monstera im Topf
    const { x, y } = SLOTS2.pflanze1, sw = Math.round(Math.sin(t * 1.3) * 0.8);
    P.rect(x + 6, y + 34, 14, 12, ink); P.rect(x + 7, y + 35, 12, 10, '#c2603a'); P.rect(x + 7, y + 35, 12, 2, '#e07a4f');
    leaf(P, x + 6 + sw, y + 6, 12, 22, C.leaf, C.leafD); leaf(P, x + 19 + sw, y + 2, 12, 24, C.leafD, '#1e6b3a');
    leaf(P, x + 13 + sw, y + 14, 14, 20, '#4fc46a', C.leafD);
    P.px(x + 7 + sw, y + 12, '#1e6b3a'); P.px(x + 20 + sw, y + 10, '#1e6b3a');
  },
  pflanze2(P, t) { // große Bananenstaude in der Ecke
    const { x, y } = SLOTS2.pflanze2, sw = Math.round(Math.sin(t * 1.1 + 1) * 1);
    P.rect(x + 6, y + 50, 16, 16, ink); P.rect(x + 7, y + 51, 14, 14, '#3b5dc9'); P.rect(x + 7, y + 51, 14, 2, '#6f8ef0');
    P.rect(x + 13, y + 20, 2, 31, '#257179');
    leaf(P, x + 6 + sw, y + 4, 10, 30, C.leaf, C.leafD); leaf(P, x + 22 + sw, y + 2, 10, 28, '#4fc46a', C.leafD);
    leaf(P, x + 14 + sw, y - 2, 9, 26, C.leafD, '#1e6b3a');
  },
  pflanze3(P, t) { // Ampelpflanze vom Dachbalken
    const { x, y } = SLOTS2.pflanze3, sw = Math.round(Math.sin(t * 0.9) * 1.2);
    P.rect(x + 11, y, 1, 10, ink);
    P.rect(x + 4 + sw, y + 10, 16, 8, ink); P.rect(x + 5 + sw, y + 11, 14, 6, '#ffcd75');
    for (let i = 0; i < 6; i++) {
      const lx = x + 4 + sw + i * 3, len = 8 + ((i * 5) % 12);
      for (let j = 0; j < len; j += 3) P.rect(lx + Math.round(Math.sin(j + t + i) * 1), y + 17 + j, 2, 2, j % 6 ? C.leaf : C.leafD);
    }
  },
  discokugel(P, t) {
    const { x, y } = SLOTS2.discokugel, cx = x + 10, cy = y + 20;
    P.rect(cx, y, 1, 12, ink);
    P.blob(cx, cy, 8, ink); P.blob(cx, cy, 7, '#c2c7cf');
    for (let i = -6; i <= 6; i += 3) for (let j = -6; j <= 6; j += 3) {
      if (i * i + j * j > 40) continue;
      const on = Math.sin(t * 6 + i * 1.7 + j) > 0.4;
      P.rect(cx + i, cy + j, 2, 2, on ? '#ffffff' : '#94b0c2');
    }
    // Lichtpunkte im Raum
    for (let k = 0; k < 7; k++) {
      const a = t * 0.8 + k * 0.9;
      const lx = 180 + Math.cos(a) * (60 + k * 22), ly = 60 + Math.sin(a * 1.3 + k) * 40;
      P.rect(lx, ly, 2, 2, ['rgba(255,107,213,0.55)', 'rgba(115,239,247,0.55)', 'rgba(255,205,117,0.55)'][k % 3]);
    }
  },
  schach(P, t) {
    const { x, y } = SLOTS2.schach;
    P.rect(x + 15, y + 12, 4, 18, '#4a2d1a'); P.rect(x + 8, y + 28, 18, 3, '#4a2d1a');
    P.rect(x, y + 6, 34, 7, ink);
    for (let i = 0; i < 8; i++) P.rect(x + 1 + i * 4, y + 7, 4, 5, (i % 2) ? '#f4efe3' : '#6b4226');
    // Figuren
    P.rect(x + 6, y + 2, 2, 5, '#f4f4f4'); P.px(x + 6, y + 1, '#f4f4f4');
    P.rect(x + 14, y + 1, 2, 6, ink); P.rect(x + 13, y + 1, 4, 1, ink);
    P.rect(x + 22, y + 3, 2, 4, '#f4f4f4'); P.rect(x + 27, y + 2, 2, 5, ink);
    if (Math.sin(t * 0.5) > 0.9) P.text('Schach!', x + 17, y - 4, 4, { color: '#fff7e0', bg: 'rgba(26,28,44,0.6)', minPx: 8, dpr: P.dpr });
  },
  couch(P, t) {
    const { x, y } = SLOTS2.couch;
    P.rect(x, y + 10, 68, 30, ink);
    P.rect(x + 1, y + 11, 66, 12, '#5a6ec0'); P.rect(x + 1, y + 23, 66, 12, '#3b5dc9');
    P.rect(x + 1, y + 11, 6, 24, '#2f4aa8'); P.rect(x + 61, y + 11, 6, 24, '#2f4aa8');
    P.rect(x + 8, y + 24, 25, 1, '#2f4aa8'); P.rect(x + 35, y + 24, 25, 1, '#2f4aa8');
    // Kissen und Decke
    P.rect(x + 9, y + 15, 12, 8, ink); P.rect(x + 10, y + 16, 10, 6, '#ffcd75');
    P.rect(x + 40, y + 21, 20, 6, '#e43b44'); P.rect(x + 40, y + 21, 20, 1, '#ff6b6b');
    P.rect(x + 4, y + 35, 3, 5, ink); P.rect(x + 61, y + 35, 3, 5, ink);
    P.text('z', x + 52, y + 8 - ((t * 6) % 6), 4, { color: '#fff7e0', minPx: 8, dpr: P.dpr });
  },
  waschbaer(P, t) { // Bärtis Körbchen (Bärti selbst läuft frei herum: js/ui/baerti.js)
    const { x, y } = SLOTS2.waschbaer;
    P.rect(x, y + 4, 36, 12, ink); P.rect(x + 1, y + 5, 34, 10, '#c58b5e');
    for (let i = 2; i < 34; i += 4) P.rect(x + i, y + 6, 2, 8, '#a0622d');
    P.rect(x + 3, y + 3, 30, 3, '#f6a6b2');
    P.text('BÄRTI', x + 18, y + 10.5, 3.6, { color: ink, bold: true, minPx: 7, dpr: P.dpr });
  },
  motorrad(P, t) { // Helm am Haken; das Motorrad selbst steht auf der Karte
    const { x, y } = SLOTS2.motorrad;
    P.rect(x + 11, y, 2, 5, ink);
    P.blob(x + 12, y + 15, 10, ink); P.blob(x + 12, y + 15, 9, '#e43b44');
    P.rect(x + 3, y + 14, 14, 5, ink); P.rect(x + 4, y + 15, 12, 3, '#2b2f6b'); P.rect(x + 5, y + 15, 4, 1, '#73eff7');
    P.rect(x + 9, y + 7, 8, 2, '#f4f4f4'); P.rect(x + 4, y + 22, 16, 3, ink);
  },
};
