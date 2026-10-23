// Stadt-Grafik Teil 2: Gebäude und Sonderflächen (Park-Schild, Skatepark-Rampen, Supermarkt …).
// Jedes Gebäude bekommt Mittelpunkt unten (cx, by). Schilder werden als scharfer Text gezeichnet.

import { C, shadow, bush } from './town.js';

const ink = C.ink;

function walls(P, x, y, w, h, col, colD) {
  P.rect(x - 1, y - 1, w + 2, h + 2, ink);
  P.rect(x, y, w, h, col);
  P.rect(x, y + h - 3, w, 3, colD);
  P.rect(x, y, w, 1, 'rgba(255,255,255,0.35)');
}
function window_(P, x, y, w = 6, h = 7, { box = null, shutters = null } = {}) {
  P.rect(x - 1, y - 1, w + 2, h + 2, ink);
  P.rect(x, y, w, h, '#5fc9e8');
  P.rect(x, y, w, 2, '#a8ecff');
  P.rect(x + Math.floor(w / 2), y, 1, h, '#e8f4f8');
  P.px(x + 1, y + 3, '#ffffff');
  if (shutters) { P.rect(x - 3, y - 1, 2, h + 2, shutters); P.rect(x + w + 1, y - 1, 2, h + 2, shutters); }
  if (box) {
    P.rect(x - 1, y + h + 1, w + 2, 2, C.woodD);
    for (let i = 0; i < w + 2; i += 2) P.px(x - 1 + i, y + h, box);
  }
}
function door(P, x, y, w, h, col = '#6b4226') {
  P.rect(x - 1, y - 1, w + 2, h + 1, ink);
  P.rect(x, y, w, h, col);
  P.rect(x + 1, y + 1, w - 2, 1, 'rgba(255,255,255,0.25)');
  P.px(x + w - 2, y + Math.floor(h / 2), C.markY);
}
function roofTiles(P, x, y, w, rows, col, colD) {
  // Satteldach von vorne: Ziegelreihen, nach oben schmaler
  for (let r = 0; r < rows; r++) {
    const inset = rows - 1 - r;
    const yy = y + r * 3;
    P.rect(x + inset * 2 - 1, yy - 1, w - inset * 4 + 2, 4, ink);
    P.rect(x + inset * 2, yy, w - inset * 4, 3, r % 2 ? col : colD);
    for (let i = (r % 2) * 2; i < w - inset * 4; i += 4) P.px(x + inset * 2 + i, yy + 2, 'rgba(0,0,0,0.25)');
  }
}
// Schild wächst mit dem Text (auf kleinen Bildschirmen ist die Mindest-Schriftgröße relativ größer)
function sign(P, txt, cx, y, w, { bg = '#fff7e0', fg = ink, dpr } = {}) {
  const m = P.measure(txt, 5.2, { bold: true, minPx: 9, dpr });
  const ww = Math.max(w, Math.ceil(m.w) + 4), hh = Math.max(7, Math.ceil(m.h) + 1);
  const yy = y + 3.5 - hh / 2;
  P.rect(cx - ww / 2 - 1, yy - 1, ww + 2, hh + 2, ink);
  P.rect(cx - ww / 2, yy, ww, hh, bg);
  P.text(txt, cx, y + 3.6, 5.2, { color: fg, bold: true, minPx: 9, dpr });
}

export function rathaus(P, cx, by, n, t, dpr) {
  const w = 100, h = 48, x = cx - w / 2, y = by - h;
  shadow(P, cx, by + 1, w + 10);
  walls(P, x, y, w, h, '#e9e2cf', '#cfc6ad');
  // Dach
  P.rect(x - 5, y - 9, w + 10, 9, ink); P.rect(x - 4, y - 8, w + 8, 7, '#c0473b'); P.rect(x - 4, y - 8, w + 8, 2, '#de6b55');
  for (let i = 0; i < w + 8; i += 4) P.px(x - 4 + i, y - 3, '#8e2f2a');
  // Turm
  const tx = cx - 13, ty = y - 34;
  P.rect(tx - 1, ty - 1, 28, 27, ink); P.rect(tx, ty, 26, 25, '#e9e2cf'); P.rect(tx, ty + 22, 26, 3, '#cfc6ad');
  P.rect(tx - 3, ty - 9, 32, 9, ink); P.rect(tx - 2, ty - 8, 30, 7, '#c0473b'); P.rect(tx - 2, ty - 8, 30, 2, '#de6b55');
  P.blob(cx, ty + 11, 8, ink, 8); P.blob(cx, ty + 11, 7, '#fbf6e6', 7);
  const ang = t * 0.3, ang2 = t * 0.025;
  for (let i = 1; i < 6; i++) P.px(cx + Math.round(Math.sin(ang) * i), ty + 11 - Math.round(Math.cos(ang) * i), ink);
  for (let i = 1; i < 4; i++) P.px(cx + Math.round(Math.sin(ang2) * i), ty + 11 - Math.round(Math.cos(ang2) * i), '#b13e53');
  // Fahne
  P.rect(cx, ty - 26, 1, 18, ink);
  for (let i = 0; i < 12; i++) {
    const wave = Math.round(Math.sin(t * 4 - i * 0.6));
    P.rect(cx + 1 + i, ty - 26 + wave, 1, 4, '#41a6f6'); P.rect(cx + 1 + i, ty - 22 + wave, 1, 3, '#f4f4f4');
  }
  // Säulen, Fenster, Tür, Treppe
  for (let i = 0; i < 4; i++) { window_(P, x + 8 + i * 10, y + 8); window_(P, x + w - 14 - i * 10, y + 8); }
  for (let i = 0; i < 4; i++) { window_(P, x + 8 + i * 10, y + 24, 6, 8, { box: '#ef476f' }); window_(P, x + w - 14 - i * 10, y + 24, 6, 8, { box: '#ffd166' }); }
  P.rect(cx - 12, y + 16, 24, h - 16, '#ddd4bd');
  for (const dx of [-11, -4, 3, 10]) P.rect(cx + dx, y + 18, 2, h - 21, '#f7f2e4');
  door(P, cx - 5, y + h - 16, 10, 16, '#7a4a2a');
  P.rect(cx - 15, by - 1, 30, 2, '#b9ae99'); P.rect(cx - 17, by + 1, 34, 2, '#cfc6b4');
  sign(P, 'RATHAUS', cx, y + 3, 38, { dpr });
  P.rect(x + 2, by - 7, 14, 7, '#4f6b8a'); P.rect(x + 3, by - 6, 12, 5, '#9ec3e6');
  P.text('AMT ↓', x + 9, by - 3.5, 3.4, { color: ink, bold: true, minPx: 7, dpr });
}

export function house(P, cx, by, n, t, dpr) {
  const w = 54, h = 32, x = cx - w / 2, y = by - h;
  shadow(P, cx, by + 1, w + 8);
  walls(P, x, y, w, h, n.color ?? '#f0d9b5', '#d8bf98');
  roofTiles(P, x - 3, y - 18, w + 6, 6, '#c0473b', '#a33a32');
  P.rect(x + w - 14, y - 26, 6, 10, ink); P.rect(x + w - 13, y - 25, 4, 9, '#8e5a4a');
  const smoke = (t * 0.6) % 1;
  P.blob(x + w - 11 + Math.round(smoke * 4), y - 30 - Math.round(smoke * 10), 2, 'rgba(240,240,240,0.7)');
  window_(P, x + 8, y + 7, 7, 8, { shutters: '#257179', box: '#ef476f' });
  window_(P, x + 22, y + 7, 7, 8, { shutters: '#257179', box: '#ffd166' });
  door(P, x + w - 15, y + h - 17, 9, 17, '#257179');
  P.rect(x + w - 16, by - 1, 11, 1, '#b9ae99');
  // Hausnummer-Schild neben der Tür
  P.rect(x + w - 25, y + h - 15, 8, 7, ink); P.rect(x + w - 24, y + h - 14, 6, 5, '#3b5dc9');
  P.text(n.number ?? '12', x + w - 21, y + h - 11.4, 3.6, { color: '#ffffff', bold: true, minPx: 7, dpr });
  // Vorgarten
  for (let i = 0; i < 6; i++) { P.px(x + 4 + i * 4, by - 1, C.leafD); P.px(x + 4 + i * 4, by - 2, ['#ef476f', '#ffd166', '#f78ad1'][i % 3]); }
}

export function shop(P, cx, by, n, t, dpr) {
  const w = 62, h = 34, x = cx - w / 2, y = by - h;
  shadow(P, cx, by + 1, w + 8);
  walls(P, x, y, w, h, n.wall ?? '#f4ede0', '#ddd2bd');
  P.rect(x - 2, y - 6, w + 4, 6, ink); P.rect(x - 1, y - 5, w + 2, 4, '#5a6070');
  sign(P, n.sign ?? n.name.toUpperCase(), cx, y - 4, w - 6, { bg: n.signBg ?? '#fff7e0', fg: n.signFg ?? ink, dpr });
  // Markise
  const aw = n.color ?? '#b13e53';
  P.rect(x - 2, y + 6, w + 4, 7, ink);
  for (let i = 0; i < w + 2; i += 6) { P.rect(x - 1 + i, y + 7, 3, 5, aw); P.rect(x + 2 + i, y + 7, 3, 5, '#f4f4f4'); }
  for (let i = 0; i < w + 2; i += 6) P.rect(x - 1 + i, y + 12, 3, 1, aw);
  // Schaufenster und Tür
  P.rect(x + 4, y + 15, 30, 16, ink); P.rect(x + 5, y + 16, 28, 14, '#5fc9e8'); P.rect(x + 5, y + 16, 28, 3, '#a8ecff');
  P.rect(x + 7, y + 21, 3, 1, '#ffffff');
  if (n.wares === 'bread') for (const dx of [8, 15, 22, 28]) { P.rect(x + dx, y + 26, 4, 3, '#c58b5e'); P.rect(x + dx, y + 26, 4, 1, '#e7b98a'); }
  if (n.wares === 'bikes') for (const dx of [8, 21]) { P.blob(x + dx + 2, y + 27, 2, ink, 2); P.blob(x + dx + 8, y + 27, 2, ink, 2); P.rect(x + dx + 2, y + 25, 7, 1, '#b13e53'); }
  door(P, x + w - 18, y + h - 18, 10, 18, '#7a4a2a');
  if (n.wares === 'bikes') { // Rad an der Wand
    P.blob(x - 8, by - 4, 3, ink, 3); P.blob(x - 8, by - 4, 2, '#cfd6de', 2);
    P.blob(x + 1, by - 4, 3, ink, 3); P.blob(x + 1, by - 4, 2, '#cfd6de', 2);
    P.rect(x - 8, by - 7, 9, 1, '#41a6f6'); P.rect(x - 4, by - 9, 1, 5, '#41a6f6'); P.rect(x - 6, by - 10, 4, 1, ink);
  }
  if (n.wares === 'bread') { // Brezel-Schild am Ausleger
    P.rect(x + w, y + 2, 7, 1, ink); P.rect(x + w + 6, y + 2, 1, 3, ink);
    const bx = x + w + 6, byy = y + 9;
    for (const [dx, dy] of [[-4, -2], [-3, -3], [-2, -3], [-1, -2], [0, -1], [1, -2], [2, -3], [3, -3], [4, -2], [4, -1], [3, 0], [2, 1], [1, 1], [0, 0], [-1, 1], [-2, 1], [-3, 0], [-4, -1], [-1, 0], [1, 0]])
      P.rect(bx + dx, byy + dy, 1, 1, '#a0622d');
    P.px(bx - 2, byy - 2, '#e7b98a'); P.px(bx + 2, byy - 2, '#e7b98a');
  }
}

export function busstop(P, cx, by, n, t, dpr) {
  shadow(P, cx, by + 1, 54);
  const x = cx - 22, y = by - 24;
  P.rect(x, y, 44, 3, ink); P.rect(x + 1, y + 1, 42, 1, '#566c86');
  P.rect(x + 1, y + 3, 2, 21, ink); P.rect(x + 41, y + 3, 2, 21, ink);
  P.rect(x + 3, y + 4, 38, 14, 'rgba(160,230,255,0.55)'); P.rect(x + 5, y + 5, 10, 1, '#ffffff');
  P.rect(x + 8, by - 6, 26, 2, C.wood); P.rect(x + 9, by - 4, 1, 4, ink); P.rect(x + 32, by - 4, 1, 4, ink);
  P.rect(x + 48, by - 32, 2, 32, '#566c86');
  P.blob(x + 49, by - 36, 6, ink, 6); P.blob(x + 49, by - 36, 5, '#ffcd75', 5);
  P.text('H', x + 49, by - 35.6, 6, { color: '#257179', bold: true, minPx: 8, dpr });
  P.rect(x + 52, by - 28, 6, 8, '#f4f4f4'); P.rect(x + 53, by - 27, 4, 1, ink); P.rect(x + 53, by - 25, 4, 1, ink);
  sign(P, n.sign ?? 'BUSBAHNHOF', cx, y - 9, 44, { bg: '#257179', fg: '#ffffff', dpr });
}

export function supermarket(P, cx, by, n, t, dpr) {
  const w = 128, h = 40, x = cx - w / 2, y = by - h;
  shadow(P, cx, by + 1, w + 10);
  walls(P, x, y, w, h, '#efeae0', '#d6cfc0');
  P.rect(x, y + 4, w, 4, '#38b764'); P.rect(x, y + 8, w, 1, '#257179');
  P.rect(x - 2, y - 4, w + 4, 4, ink);
  sign(P, n.sign ?? 'SUPERMARKT', cx, y - 13, 64, { bg: '#e43b44', fg: '#ffffff', dpr });
  P.rect(cx - 33, y - 5, 2, 4, ink); P.rect(cx + 31, y - 5, 2, 4, ink);
  // Glasfront
  P.rect(x + 6, y + 13, w - 12, 24, ink);
  for (let i = 0; i < 7; i++) {
    const gx = x + 7 + i * 16.4;
    P.rect(gx, y + 14, 15, 22, '#5fc9e8'); P.rect(gx, y + 14, 15, 4, '#a8ecff'); P.rect(gx + 2, y + 20, 1, 6, '#e8f8ff');
  }
  // Regale angedeutet
  for (let i = 0; i < 6; i++) P.rect(x + 12 + i * 18, y + 28, 10, 3, ['#ef476f', '#ffd166', '#38b764', '#ff8c42', '#b78cff', '#f4f4f4'][i]);
  // Schiebetür
  const open = Math.max(0, Math.sin(t * 0.7)) * 4;
  P.rect(cx - 9, y + 16, 18, 21, ink); P.rect(cx - 8 - open, y + 17, 8, 20, '#7fd6ef'); P.rect(cx + open, y + 17, 8, 20, '#7fd6ef');
  // Einkaufswagen-Box
  P.rect(x + w + 4, by - 10, 18, 10, ink); P.rect(x + w + 5, by - 9, 16, 8, '#e43b44');
  for (let i = 0; i < 4; i++) { P.rect(x + w + 6 + i * 4, by - 7, 3, 4, '#c2c7cf'); }
}

/** Parkplatz-Autos von oben */
export function parkedCar(P, x, y, col) {
  P.rect(x - 1, y - 1, 10, 14, ink); P.rect(x, y, 8, 12, col);
  P.rect(x + 1, y + 2, 6, 3, '#a8ecff'); P.rect(x + 1, y + 9, 6, 2, '#5fc9e8'); P.rect(x, y, 8, 1, 'rgba(255,255,255,0.4)');
}

export function parkSign(P, cx, by, n, t, dpr) {
  P.rect(cx - 1, by - 12, 2, 12, C.woodD);
  sign(P, n.sign ?? 'STADTPARK', cx, by - 20, 30, { bg: '#73441d', fg: '#ffe8b0', dpr });
  bush(P, cx - 16, by, '#ef476f');
}

export function skatepark(P, cx, by, n, t, dpr) {
  // Schild am Zaun; die Rampen sind eigene Deko-Objekte
  P.rect(cx - 1, by - 8, 2, 8, ink);
  sign(P, n.sign ?? 'SKATEPARK', cx, by - 15, 36, { bg: '#333c57', fg: '#a7f070', dpr });
}

export function halfpipe(P, x, y, w) {
  // von oben gesehen mit Schattierung (Kurve als Farbverlauf)
  const bands = ['#7f8794', '#959cab', '#aab1bf', '#c3c9d4', '#d7dce4', '#c3c9d4', '#aab1bf', '#959cab', '#7f8794'];
  const bh = 3;
  P.rect(x - 1, y - bands.length * bh - 3, w + 2, bands.length * bh + 4, ink);
  bands.forEach((col, i) => P.rect(x, y - bands.length * bh - 2 + i * bh, w, bh, col));
  P.rect(x, y - bands.length * bh - 2, w, 1, '#f4f4f4'); P.rect(x, y - 2, w, 1, '#f4f4f4');
  P.rect(x + 6, y - 14, 10, 3, '#ef476f'); P.rect(x + 9, y - 16, 5, 2, '#ffd166'); P.rect(x + w - 18, y - 12, 8, 2, '#41a6f6');
}
export function rail(P, x, y, w) {
  P.rect(x, y - 4, w, 1, ink); P.rect(x, y - 3, w, 1, '#c2c7cf');
  P.rect(x + 1, y - 2, 1, 3, ink); P.rect(x + w - 2, y - 2, 1, 3, ink);
}
export function funbox(P, x, y) {
  P.rect(x - 1, y - 13, 26, 14, ink);
  P.rect(x, y - 12, 6, 12, '#959cab'); P.rect(x + 6, y - 12, 12, 12, '#c3c9d4'); P.rect(x + 18, y - 12, 6, 12, '#959cab');
}

export const BUILDINGS = { rathaus, house, shop, busstop, supermarket, park: parkSign, skatepark };
