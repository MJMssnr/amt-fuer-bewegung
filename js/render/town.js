// Stadt-Grafik Teil 1: Boden (Gras, Straßen, Gehwege) und Natur (Bäume, Büsche, Blumen, Möbel).
// Alles prozedural in Pixelart-Einheiten; Daten kommen aus data/map.json.

import { hash } from './painter.js';

export const C = {
  ink: '#1a1c2c', grass: '#6abe30', grassD: '#55a828', grassL: '#86d043', grassDD: '#3f8f2a',
  asphalt: '#5a6070', asphaltD: '#4a4f5e', curb: '#d6d0c4', walk: '#cfc6b4', walkD: '#b9ae99',
  mark: '#f4f4f4', markY: '#ffcd75', shadow: 'rgba(20,24,40,0.22)',
  leaf: '#3d9b3d', leafD: '#26753a', leafL: '#7ccf4a', leafLL: '#b4e86a', trunk: '#6b4226', trunkD: '#4a2d1a',
  pine: '#1f6b4a', pineD: '#154d36', pineL: '#2f8a5c', birch: '#eef0e8', blossom: '#f6a6c9', blossomD: '#e07aa8',
  water: '#4fa4d8', waterD: '#3a7fb5', waterL: '#a8e0ff', gravel: '#e3d3a8', gravelD: '#cdb987',
  wood: '#a0622d', woodD: '#73441d', metal: '#94b0c2', metalD: '#566c86',
};
const FLOWERS = ['#ef476f', '#ffd166', '#f78ad1', '#b78cff', '#ffffff', '#ff8c42'];

export const ROAD = 8; // halbe Fahrbahnbreite
export const WALK = 4; // Gehwegbreite

/** Straßen als achsenparallele Segmente: [[x1,y1,x2,y2], ...] */
export function roadSegments(map) {
  return map.roads.map(([a, b]) => {
    const A = map.nodes[a], B = map.nodes[b];
    return [A.x, A.y, B.x, B.y];
  });
}

function segRect([x1, y1, x2, y2], half) {
  return [Math.min(x1, x2) - half, Math.min(y1, y2) - half, Math.abs(x2 - x1) + 2 * half, Math.abs(y2 - y1) + 2 * half];
}

/** Boden: wird einmal in einen Puffer gezeichnet. */
export function drawGround(P, map) {
  const [W, H] = map.size;
  P.rect(0, 0, W, H, C.grass);
  // Grastextur in 4er-Zellen
  for (let y = 0; y < H; y += 4) {
    for (let x = 0; x < W; x += 4) {
      // weiche Flecken statt Schachbrett: grobes Rauschen über 16er-Blöcke
      const r = (hash(x >> 4, y >> 4, 3) + hash(x >> 3, y >> 3, 4)) / 2;
      if (r < 0.22 && hash(x, y, 2) < 0.6) P.rect(x, y, 4, 4, C.grassD);
      else if (r > 0.8 && hash(x, y, 2) < 0.6) P.rect(x, y, 4, 4, C.grassL);
      const t = hash(x, y, 7);
      if (t < 0.05) { P.px(x + 1, y + 2, C.grassDD); P.px(x + 2, y + 1, C.grassDD); P.px(x + 3, y + 2, C.grassDD); }
      else if (t > 0.99) P.px(x + 2, y + 2, FLOWERS[Math.floor(hash(x, y, 9) * FLOWERS.length)]);
    }
  }
  // Flächen aus der Karte (Kies, Pflaster, Parkplatz …)
  for (const a of map.areas || []) drawArea(P, a);

  const segs = roadSegments(map);
  segs.forEach((s) => P.rect(...segRect(s, ROAD + WALK + 1), C.walkD));
  segs.forEach((s) => P.rect(...segRect(s, ROAD + WALK), C.walk));
  // Gehwegplatten-Fugen
  segs.forEach((s) => {
    const [x, y, w, h] = segRect(s, ROAD + WALK);
    const horiz = s[1] === s[3];
    for (let i = 0; i < (horiz ? w : h); i += 6) {
      if (horiz) { P.rect(x + i, y, 1, WALK, C.walkD); P.rect(x + i, y + h - WALK, 1, WALK, C.walkD); }
      else { P.rect(x, y + i, WALK, 1, C.walkD); P.rect(x + w - WALK, y + i, WALK, 1, C.walkD); }
    }
  });
  segs.forEach((s) => P.rect(...segRect(s, ROAD + 1), C.curb));
  segs.forEach((s) => P.rect(...segRect(s, ROAD), C.asphalt));
  // Asphalt-Struktur
  segs.forEach((s) => {
    const [x, y, w, h] = segRect(s, ROAD);
    for (let i = 0; i < w; i += 3) for (let j = 0; j < h; j += 3) if (hash(x + i, y + j, 5) < 0.12) P.px(x + i, y + j, C.asphaltD);
  });
  // Mittellinie (nicht in Kreuzungen)
  const nodesAt = Object.values(map.nodes).map((n) => [n.x, n.y]);
  const nearNode = (x, y) => nodesAt.some(([nx, ny]) => Math.abs(nx - x) < ROAD + 6 && Math.abs(ny - y) < ROAD + 6);
  segs.forEach(([x1, y1, x2, y2]) => {
    const horiz = y1 === y2, len = Math.abs(horiz ? x2 - x1 : y2 - y1), sx = Math.sign(x2 - x1), sy = Math.sign(y2 - y1);
    for (let i = 0; i < len; i += 10) {
      const x = x1 + sx * i, y = y1 + sy * i;
      if (nearNode(x, y)) continue;
      if (horiz) P.rect(x, y, 5 * sx || 5, 1, C.mark); else P.rect(x, y, 1, 5 * sy || 5, C.mark);
    }
  });
  for (const z of map.crosswalks || []) {
    const [x, y, dir] = z;
    for (let i = -ROAD + 1; i < ROAD; i += 3) {
      if (dir === 'h') P.rect(x + i, y - 5, 2, 10, C.mark); else P.rect(x - 5, y + i, 10, 2, C.mark);
    }
  }
}

function drawArea(P, a) {
  const { x, y, w, h } = a;
  switch (a.kind) {
    case 'gravel':
      P.rect(x, y, w, h, C.gravelD); P.rect(x + 1, y + 1, w - 2, h - 2, C.gravel);
      for (let i = 0; i < w; i += 3) for (let j = 0; j < h; j += 3) if (hash(x + i, y + j, 11) < 0.15) P.px(x + i, y + j, C.gravelD);
      break;
    case 'paving':
      P.rect(x, y, w, h, '#c9c2b6');
      for (let i = 0; i < w; i += 5) P.rect(x + i, y, 1, h, '#b3ab9d');
      for (let j = 0; j < h; j += 5) P.rect(x, y + j, w, 1, '#b3ab9d');
      break;
    case 'parking':
      P.rect(x, y, w, h, C.asphalt);
      for (let i = 0; i <= w; i += 14) P.rect(x + i, y + 2, 1, 14, C.mark);
      for (let i = 0; i <= w; i += 14) P.rect(x + i, y + h - 16, 1, 14, C.mark);
      break;
    case 'concrete':
      P.rect(x, y, w, h, '#a9adb6'); P.rect(x + 1, y + 1, w - 2, h - 2, '#bcc0c8');
      for (let i = 0; i < w; i += 16) P.rect(x + i, y, 1, h, '#a9adb6');
      for (let j = 0; j < h; j += 16) P.rect(x, y + j, w, 1, '#a9adb6');
      break;
    case 'pond':
      P.blob(x + w / 2, y + h / 2, w / 2 + 1, '#8a7a5a', h / 2 + 1);
      P.blob(x + w / 2, y + h / 2, w / 2, C.water, h / 2);
      P.blob(x + w / 2 + 2, y + h / 2 + 2, w / 2 - 4, C.waterD, h / 2 - 4);
      P.rect(x + w / 4, y + h / 3, 6, 1, C.waterL); P.rect(x + w / 2, y + h / 2 + 2, 4, 1, C.waterL);
      break;
    case 'flowerbed':
      // Beet mit Steinkante, Blattwerk und 2×2-Blüten
      P.rect(x - 1, y - 1, w + 2, h + 2, '#a39a8a'); P.rect(x, y, w, h, '#6b4a2e');
      P.rect(x + 1, y + 1, w - 2, h - 2, C.leafD);
      for (let i = 1; i < w - 2; i += 2) for (let j = 1; j < h - 2; j += 2) if (hash(x + i, y + j, 15) < 0.5) P.px(x + i, y + j, C.leaf);
      for (let i = 2; i < w - 3; i += 4) for (let j = 1 + ((i / 4) % 2) * 2; j < h - 2; j += 4) {
        const col = a.color ?? FLOWERS[Math.floor(hash(x + i, y + j, 13) * FLOWERS.length)];
        P.rect(x + i, y + j, 2, 2, col); P.px(x + i, y + j, '#ffffff');
      }
      break;
  }
}

// ---------- Objekte (y-sortiert gezeichnet) ----------

export function shadow(P, x, y, w) { P.blob(x, y, w / 2, C.shadow, Math.max(1, Math.round(w / 6))); }

export function tree(P, kind, x, y, time = 0) {
  const sway = Math.round(Math.sin(time * 1.3 + x * 0.1) * 0.6);
  switch (kind) {
    case 'pine':
      shadow(P, x, y, 16);
      P.rect(x - 1, y - 5, 3, 5, C.trunkD);
      for (let i = 0; i < 4; i++) {
        const top = y - 26 + i * 5, hw = 3 + i * 2;
        for (let r = 0; r < 7; r++) {
          const w2 = Math.round((hw * (r + 1)) / 7);
          P.rect(x - w2 + sway * (i < 2), top + r, 2 * w2 + 1, 1, r < 2 ? C.pineL : r > 5 ? C.pineD : C.pine);
        }
      }
      break;
    case 'birch':
      shadow(P, x, y, 14);
      P.rect(x - 1, y - 14, 3, 14, C.birch);
      P.px(x, y - 11, C.ink); P.px(x - 1, y - 7, C.ink); P.px(x + 1, y - 4, C.ink);
      P.blob(x + sway, y - 20, 7, '#5fae3c', 8);
      P.blob(x - 1 + sway, y - 22, 5, C.leafLL, 5);
      P.blob(x + 2 + sway, y - 17, 3, C.leafL, 3);
      break;
    case 'blossom':
    case 'fruit':
    case 'round':
    default: {
      const big = kind === 'round' ? 10 : 9;
      shadow(P, x, y, 22);
      P.rect(x - 2, y - 9, 4, 9, C.trunk); P.rect(x + 1, y - 9, 1, 9, C.trunkD);
      const base = kind === 'blossom' ? C.blossomD : C.leafD;
      const mid = kind === 'blossom' ? C.blossom : C.leaf;
      const hi = kind === 'blossom' ? '#ffd3e6' : C.leafL;
      P.blob(x + sway, y - 17, big, base, big - 1);
      P.blob(x - 1 + sway, y - 19, big - 2, mid, big - 3);
      P.blob(x - 3 + sway, y - 22, 4, hi, 3);
      if (kind === 'fruit') for (const [dx, dy] of [[-5, -15], [3, -20], [5, -13], [-2, -11], [0, -24]]) P.rect(x + dx + sway, y + dy, 2, 2, '#e43b44');
      if (kind === 'blossom') for (const [dx, dy] of [[-6, -14], [4, -21], [6, -15], [-1, -12]]) P.px(x + dx + sway, y + dy, '#ffffff');
    }
  }
}

export function bush(P, x, y, color) {
  shadow(P, x, y, 14);
  P.blob(x, y - 4, 7, C.leafD, 5);
  P.blob(x - 1, y - 5, 5, C.leaf, 4);
  P.rect(x - 3, y - 7, 3, 1, C.leafL);
  if (color) for (const [dx, dy] of [[-4, -5], [2, -7], [4, -3], [-1, -2]]) P.px(x + dx, y + dy, color);
}

export function hedge(P, x, y, w) {
  P.rect(x, y - 6, w, 7, C.leafD);
  P.rect(x, y - 6, w, 2, C.leaf);
  for (let i = 0; i < w; i += 4) P.px(x + i + 1, y - 5, C.leafL);
}

export function bench(P, x, y) {
  P.rect(x - 7, y - 6, 14, 2, C.wood); P.rect(x - 7, y - 3, 14, 2, C.wood);
  P.rect(x - 7, y - 4, 14, 1, C.woodD); P.rect(x - 6, y - 1, 1, 2, C.ink); P.rect(x + 5, y - 1, 1, 2, C.ink);
}

export function lamp(P, x, y, time = 0) {
  P.rect(x, y - 18, 1, 18, C.metalD);
  P.rect(x - 2, y - 21, 5, 3, C.ink);
  P.rect(x - 1, y - 20, 3, 1, Math.sin(time * 2) > -2 ? '#fff4b0' : '#fff');
}

export function flower(P, x, y, col) {
  P.px(x, y, C.leafD); P.px(x, y - 1, col); P.px(x - 1, y - 2, col); P.px(x + 1, y - 2, col); P.px(x, y - 3, col); P.px(x, y - 2, '#ffe680');
}

export function fountain(P, x, y, time) {
  P.blob(x, y, 9, '#9aa3ad', 5); P.blob(x, y, 7, C.water, 4);
  P.rect(x - 1, y - 8, 3, 8, '#c2c7cf');
  for (let i = 0; i < 6; i++) {
    const ph = (time * 2 + i / 6) % 1;
    const dx = Math.round((i % 2 ? 1 : -1) * ph * 6), dy = Math.round(-10 + ph * ph * 12);
    P.px(x + dx, y + dy - 2, C.waterL);
  }
  P.rect(x, y - 11, 1, 3, C.waterL);
}

/** Zeichnet ein Deko-Objekt aus map.json/decor. */
export function decor(P, d, time) {
  switch (d.type) {
    case 'tree': return tree(P, d.kind, d.x, d.y, time);
    case 'bush': return bush(P, d.x, d.y, d.color);
    case 'hedge': return hedge(P, d.x, d.y, d.w);
    case 'bench': return bench(P, d.x, d.y);
    case 'lamp': return lamp(P, d.x, d.y, time);
    case 'fountain': return fountain(P, d.x, d.y, time);
    case 'flowers':
      for (let i = 0; i < (d.n ?? 6); i++)
        flower(P, d.x + Math.round((hash(i, d.x, 17) - 0.5) * (d.w ?? 16)), d.y + Math.round((hash(i, d.y, 19) - 0.5) * 6), d.color ?? FLOWERS[i % FLOWERS.length]);
      return;
  }
}
