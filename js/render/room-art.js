// Innenansicht des Baumhauses (360×200 Welt-Einheiten). Jeder Gegenstand hat einen festen Platz.
// SLOTS[id] = { x, y, w, h } (Klickfläche) und eine Zeichenfunktion in DRAW[id].

import { C } from './town.js';

export const ROOM = { W: 360, H: 200, FLOOR: 128 };
const ink = '#1a1c2c';

export const SLOTS = {
  bar:         { x: 14,  y: 76,  w: 52, h: 52 },
  neon:        { x: 16,  y: 16,  w: 52, h: 22 },
  lavalampe:   { x: 76,  y: 98,  w: 16, h: 30 },
  teleskop:    { x: 140, y: 88,  w: 26, h: 40 },
  aquarium:    { x: 172, y: 92,  w: 48, h: 36 },
  rennrad:     { x: 172, y: 30,  w: 56, h: 34 },
  fernseher:   { x: 236, y: 82,  w: 48, h: 36 },
  konsole:     { x: 286, y: 110, w: 20, h: 10 },
  musik:       { x: 314, y: 74,  w: 22, h: 62 },
  teppich:     { x: 128, y: 150, w: 130, h: 30 },
  sessel:      { x: 92,  y: 140, w: 40, h: 40 },
  haengematte: { x: 280, y: 132, w: 74, h: 50 },
  whirlpool:   { x: 14,  y: 160, w: 70, h: 34 },
  kiste:       { x: 136, y: 178, w: 30, h: 20 },
  luke:        { x: 214, y: 184, w: 34, h: 14 },
};

export function drawRoomBase(P, t) {
  const { W, H, FLOOR } = ROOM;
  // Wand aus Brettern
  // senkrechte Bretter mit Maserung und Astlöchern
  for (let x = 0; x < W; x += 14) {
    const shade = ['#b8763c', '#ad6e37', '#c07d41'][(x / 14) % 3];
    P.rect(x, 0, 14, FLOOR, shade);
    P.rect(x, 0, 1, FLOOR, '#7d4c26');
    for (let y = 6 + ((x * 7) % 11); y < FLOOR; y += 23) P.rect(x + 4 + ((x + y) % 5), y, 1, 6, 'rgba(110,62,28,0.35)');
  }
  for (const [kx, ky] of [[30, 44], [200, 100], [290, 60], [80, 96]]) { P.blob(kx, ky, 2, '#7d4c26', 1); P.px(kx, ky, '#5a3519'); }
  // Dachbalken oben
  P.rect(0, 0, W, 8, '#6b4226'); P.rect(0, 7, W, 1, ink);
  // Rundfenster mit Himmel, Blättern und Mond
  const wx = 112, wy = 52;
  P.blob(wx, wy, 26, ink); P.blob(wx, wy, 24, '#6b4226'); P.blob(wx, wy, 21, '#7fc8f8');
  P.blob(wx + 6, wy - 8, 5, '#fdf6d8');
  P.blob(wx - 12 + Math.round(Math.sin(t) * 1), wy + 12, 9, C.leaf); P.blob(wx + 13, wy + 15, 8, C.leafD);
  P.rect(wx - 21, wy, 42, 2, '#6b4226'); P.rect(wx, wy - 21, 2, 42, '#6b4226');
  // Ast, der durch die Wand wächst
  P.rect(W - 70, 10, 70, 8, '#6b4226'); P.rect(W - 70, 16, 70, 2, '#4a2d1a');
  P.blob(W - 74, 14, 6, C.leaf, 5); P.blob(W - 70, 10, 4, C.leafL, 3);
  // Deckenlampe
  P.rect(150, 8, 1, 14, ink); P.blob(150, 24, 4, '#ffe08a', 3);
  for (let r = 18; r > 6; r -= 4) P.blob(150, 26, r, 'rgba(255,230,150,0.06)');
  // Boden
  P.rect(0, FLOOR, W, H - FLOOR, '#9c6233');
  for (let y = FLOOR; y < H; y += 8) P.rect(0, y, W, 1, '#7d4c26');
  for (let x = 0; x < W; x += 36) for (let y = FLOOR; y < H; y += 8) P.rect(x + ((y / 8) % 2) * 18, y, 1, 8, '#7d4c26');
  P.rect(0, FLOOR - 2, W, 3, '#6b4226');
}

/** Gestrichelter Umriss für leere Plätze */
export function emptySlot(P, s) {
  const col = 'rgba(255,240,200,0.45)';
  for (let x = s.x; x < s.x + s.w; x += 4) { P.rect(x, s.y, 2, 1, col); P.rect(x, s.y + s.h - 1, 2, 1, col); }
  for (let y = s.y; y < s.y + s.h; y += 4) { P.rect(s.x, y, 1, 2, col); P.rect(s.x + s.w - 1, y, 1, 2, col); }
}

export const DRAW = {
  bar(P, t) {
    const { x, y } = SLOTS.bar;
    P.rect(x, y + 6, 30, 46, ink); P.rect(x + 1, y + 7, 28, 44, '#e9eef2'); P.rect(x + 1, y + 25, 28, 1, ink);
    P.rect(x + 24, y + 12, 2, 8, '#94b0c2'); P.rect(x + 24, y + 30, 2, 10, '#94b0c2');
    P.rect(x + 3, y + 9, 6, 3, '#41a6f6');
    P.rect(x + 32, y + 30, 20, 2, ink); P.rect(x + 32, y + 12, 20, 2, ink);
    for (const [dx, col] of [[34, '#38b764'], [39, '#e43b44'], [44, '#ffcd75'], [48, '#73eff7']]) { P.rect(x + dx, y + 2, 3, 10, col); P.rect(x + dx + 1, y, 1, 2, col); }
    P.blob(x + 42, y + 27, 6, '#a0622d', 2); P.rect(x + 38, y + 24, 3, 2, '#c58b5e'); P.rect(x + 43, y + 23, 3, 2, '#c58b5e');
  },
  neon(P, t) {
    const { x, y } = SLOTS.neon;
    const on = Math.sin(t * 7) > -0.92;
    P.rect(x, y, 52, 22, '#2b2f6b');
    P.text('AMT', x + 26, y + 11, 11, { color: on ? '#ff6bd5' : '#7a3d6b', bold: true, minPx: 12, dpr: P.dpr });
    if (on) P.rect(x + 4, y + 18, 44, 1, 'rgba(255,107,213,0.5)');
  },
  lavalampe(P, t) {
    const { x, y } = SLOTS.lavalampe;
    P.rect(x + 2, y + 24, 12, 6, '#566c86');
    P.rect(x + 4, y + 4, 8, 20, ink); P.rect(x + 5, y + 5, 6, 19, '#ff8fb1');
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.25 + i / 3) % 1;
      P.blob(x + 8 + Math.round(Math.sin(t + i) * 1), y + 22 - Math.round(Math.sin(ph * Math.PI) * 15), 2, '#ffd166');
    }
    P.rect(x + 5, y, 6, 4, '#566c86');
    P.blob(x + 8, y + 14, 12, 'rgba(255,143,177,0.1)');
  },
  teleskop(P, t) {
    const { x, y } = SLOTS.teleskop;
    P.rect(x + 12, y + 20, 1, 20, ink); P.rect(x + 6, y + 30, 1, 10, ink); P.rect(x + 18, y + 30, 1, 10, ink);
    P.rect(x + 7, y + 30, 11, 1, ink);
    for (let i = 0; i < 18; i++) P.rect(x + 22 - i, y + 22 - Math.round(i * 0.9), 4, 4, i < 3 ? ink : '#41a6f6');
    P.rect(x + 2, y + 4, 5, 5, ink);
  },
  aquarium(P, t) {
    const { x, y } = SLOTS.aquarium;
    P.rect(x + 2, y + 24, 44, 12, '#6b4226');
    P.rect(x, y, 48, 24, ink); P.rect(x + 1, y + 1, 46, 22, '#4fa4d8'); P.rect(x + 1, y + 1, 46, 3, '#a8e0ff');
    P.rect(x + 1, y + 19, 46, 4, '#e3d3a8');
    for (const dx of [6, 14, 38]) { P.rect(x + dx, y + 10, 2, 9, C.leafD); P.rect(x + dx + 1, y + 7, 1, 4, C.leaf); }
    const fx = x + 24 + Math.round(Math.sin(t * 0.8) * 16), dir = Math.cos(t * 0.8);
    P.rect(fx - 3, y + 11, 6, 4, '#ff8c42'); P.rect(fx + (dir > 0 ? -5 : 3), y + 11, 2, 4, '#ff8c42');
    P.px(fx + (dir > 0 ? 2 : -3), y + 12, ink);
    const bub = (t * 0.6) % 1;
    P.px(fx + (dir > 0 ? 4 : -5), y + 10 - Math.round(bub * 8), '#ffffff');
  },
  rennrad(P, t) {
    const { x, y } = SLOTS.rennrad;
    P.rect(x + 24, y, 2, 6, ink); P.rect(x + 22, y + 4, 6, 2, '#566c86');
    for (const cx of [x + 12, x + 44]) { P.blob(cx, y + 22, 11, ink); P.blob(cx, y + 22, 9, '#b8763c'); P.blob(cx, y + 22, 2, '#94b0c2'); }
    P.rect(x + 12, y + 21, 32, 2, '#e43b44'); P.rect(x + 22, y + 8, 2, 14, '#e43b44');
    for (let i = 0; i < 14; i++) P.rect(x + 24 + i, y + 8 + Math.round(i * 0.9), 2, 2, '#e43b44');
    P.rect(x + 18, y + 6, 10, 2, ink); P.rect(x + 38, y + 4, 8, 2, ink);
  },
  fernseher(P, t) {
    const { x, y } = SLOTS.fernseher;
    P.rect(x - 4, y + 36, 74, 10, '#4a2d1a'); P.rect(x - 3, y + 37, 72, 8, '#6b4226');
    P.rect(x, y, 48, 32, ink); P.rect(x + 2, y + 2, 44, 26, '#2b2f6b');
    // Schnecken-Doku
    P.rect(x + 2, y + 22, 44, 6, '#38b764');
    const sx = x + 6 + Math.round(((t * 1.5) % 34));
    P.blob(sx + 4, y + 19, 3, '#c58b5e'); P.rect(sx, y + 21, 9, 2, '#f2c9a0'); P.px(sx + 9, y + 19, ink);
    P.rect(x + 21, y + 32, 6, 4, ink);
  },
  konsole(P, t) {
    const { x, y } = SLOTS.konsole;
    P.rect(x, y + 2, 20, 8, ink); P.rect(x + 1, y + 3, 18, 6, '#e9eef2');
    P.px(x + 16, y + 5, Math.sin(t * 3) > 0 ? '#38b764' : '#257179');
    P.rect(x + 4, y + 10, 8, 3, ink);
  },
  musik(P, t) {
    const { x, y } = SLOTS.musik;
    const pulse = Math.abs(Math.sin(t * 8)) > 0.7 ? 1 : 0;
    P.rect(x, y, 22, 62, ink); P.rect(x + 1, y + 1, 20, 60, '#333c57');
    P.blob(x + 11, y + 15, 6 + pulse, '#1a1c2c'); P.blob(x + 11, y + 15, 2, '#566c86');
    P.blob(x + 11, y + 42, 8 + pulse, '#1a1c2c'); P.blob(x + 11, y + 42, 3, '#566c86');
    if (pulse) { P.rect(x - 6, y + 6, 2, 2, '#ffffff'); P.rect(x - 5, y + 2, 1, 4, '#ffffff'); }
  },
  teppich(P, t) {
    const { x, y, w, h } = SLOTS.teppich;
    P.blob(x + w / 2, y + h / 2, w / 2, '#5a3a8a', h / 2);
    P.blob(x + w / 2, y + h / 2, w / 2 - 4, '#8b5fbf', h / 2 - 3);
    P.blob(x + w / 2, y + h / 2, w / 2 - 14, '#b88ae0', h / 2 - 7);
    for (let i = 0; i < w; i += 6) P.px(x + i, y + h / 2 + Math.round(Math.sin(i) * (h / 2 - 1)), '#ffd166');
  },
  sessel(P, t) {
    const { x, y } = SLOTS.sessel;
    P.rect(x, y + 4, 40, 30, ink); P.rect(x + 1, y + 5, 38, 28, '#e43b44'); P.rect(x + 1, y + 5, 38, 3, '#ff6b6b');
    P.rect(x - 2, y + 16, 8, 20, ink); P.rect(x - 1, y + 17, 6, 18, '#a12a35');
    P.rect(x + 34, y + 16, 8, 20, ink); P.rect(x + 35, y + 17, 6, 18, '#a12a35');
    P.rect(x + 6, y + 22, 28, 10, '#c43540'); P.rect(x + 4, y + 36, 3, 4, ink); P.rect(x + 33, y + 36, 3, 4, ink);
  },
  haengematte(P, t) {
    const { x, y, w } = SLOTS.haengematte;
    P.rect(x, y - 30, 4, 80, '#6b4226'); P.rect(x + w - 4, y - 30, 4, 80, '#6b4226');
    const sw = Math.round(Math.sin(t * 1.4) * 3);
    for (let i = 0; i <= w - 8; i++) {
      const sag = Math.round(Math.sin((i / (w - 8)) * Math.PI) * 14);
      P.rect(x + 4 + i + Math.round(sw * Math.sin((i / (w - 8)) * Math.PI)), y - 18 + sag, 1, 4, i % 6 < 3 ? '#ffcd75' : '#ef7d57');
    }
  },
  whirlpool(P, t) {
    const { x, y, w, h } = SLOTS.whirlpool;
    P.blob(x + w / 2, y + h / 2, w / 2, ink, h / 2);
    P.blob(x + w / 2, y + h / 2, w / 2 - 2, '#e9eef2', h / 2 - 2);
    P.blob(x + w / 2, y + h / 2 + 1, w / 2 - 6, '#4fc3f7', h / 2 - 6);
    for (let i = 0; i < 7; i++) {
      const ph = (t * 0.9 + i * 0.37) % 1;
      P.blob(x + 14 + ((i * 41) % (w - 28)), y + h / 2 + 4 - Math.round(ph * 8), 1 + (i % 2), `rgba(255,255,255,${(1 - ph).toFixed(2)})`);
    }
  },
  kiste(P, t, count = 0, total = 5) {
    const { x, y } = SLOTS.kiste;
    P.rect(x, y, 30, 20, ink); P.rect(x + 1, y + 1, 28, 18, '#a0622d');
    P.rect(x + 1, y + 6, 28, 2, '#73441d'); P.rect(x + 13, y + 1, 4, 6, '#c2c7cf');
    if (count > 0) for (let i = 0; i < count; i++) P.rect(x + 3 + i * 3.6, y + 11, 3, 5, ['#94b0c2', '#c2c7cf', '#e43b44', '#e43b44', '#38b764', '#ffcd75', '#3b5dc9'][i % 7]);
    if (count >= total) {
      const g = 0.25 + Math.abs(Math.sin(t * 3)) * 0.35;
      P.blob(x + 15, y + 10, 22, `rgba(255,220,120,${g.toFixed(2)})`, 14);
      P.text('!', x + 15, y - 8, 9, { color: '#ffcd75', bold: true, minPx: 14, dpr: P.dpr });
    }
  },
  luke(P, t) {
    const { x, y } = SLOTS.luke;
    P.rect(x, y, 34, 14, ink); P.rect(x + 1, y + 1, 32, 12, '#4a2d1a');
    for (let i = 4; i < 32; i += 7) P.rect(x + i, y + 2, 3, 10, '#6b4226');
    P.text('↓ Karte', x + 17, y - 6, 4.6, { color: '#fff7e0', bg: 'rgba(26,28,44,0.6)', minPx: 10, dpr: P.dpr });
  },
};
