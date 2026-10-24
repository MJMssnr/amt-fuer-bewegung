// Kleine Effekte zu Bärtis Aktivitäten auf der Karte [W42, W43]: Keks, Fisch, Angel, Erde beim Wühlen, Wurm,
// Wasserspritzer am Brunnen, Pinkeln (plus Pfütze), Schwindel-Sternchen, Schreck „!“, stolzes Glitzern, Schütteln;
// [W52] Mülltonne (Zeug fliegt, Bananenschale), Freudentanz (Herzen, Noten), Schmetterling, Herzchen auf dem Rücken.

export function drawFx(P, b, { x, y, w, h, dpr }) {
  const t = b.t, dir = b.flip ? -1 : 1, hx = x + dir * w * 0.3;
  switch (b.fx) {
    case 'cookie':
      P.blob(hx + dir * 2, y - 3, 1.5, '#c58b5e');
      if (Math.sin(t * 9) > 0.7) P.px(hx, b.pos.y, '#e7b98a');
      break;
    case 'fish':
      P.rect(hx - 3, y - 4, 6, 2, '#94b0c2'); P.px(hx + (b.flip ? -4 : 3), y - 4, '#566c86');
      if (Math.sin(t * 9) > 0.7) P.px(hx, b.pos.y, '#94b0c2');
      break;
    case 'fishing':
      P.rect(hx, y - 9, 1, 8, '#73441d'); P.rect(hx + 1, y - 9, 6, 1, '#73441d');
      P.rect(hx + 7, y - 9, 1, 6 + Math.round(Math.sin(t * 3)), '#f4f4f4');
      break;
    case 'z': P.text('z', x + 5, y - h - 2 - ((t * 4) % 4), 3.6, { color: '#ffffff', minPx: 8, dpr }); break;
    case 'dig': // Erdbrocken fliegen nach hinten
      for (let i = 0; i < 4; i++) {
        const ph = (t * 2.2 + i / 4) % 1;
        P.rect(x - dir * (3 + ph * 9), y - 1 - Math.sin(ph * Math.PI) * 6, 1, 1, i % 2 ? '#6b4a2e' : '#9c6233');
      }
      break;
    case 'worm': { // zappelnder Wurm im Maul
      const wig = Math.round(Math.sin(t * 12));
      P.rect(hx + dir * 2, y - 4 + wig, 2, 1, '#f6a6b2'); P.rect(hx + dir * 4, y - 4 - wig, 2, 1, '#e48d9b');
      break;
    }
    case 'splash': // Bärti patscht ins Becken, Tropfen fliegen
      for (let i = 0; i < 6; i++) {
        const ph = (t * 1.8 + i / 6) % 1, sx = (i % 2 ? 1 : -1) * (2 + i);
        P.px(x + dir * 6 + sx * ph, y - 2 - Math.sin(ph * Math.PI) * 8, i % 3 ? '#a8e4ff' : '#ffffff');
      }
      break;
    case 'pee': { // kleiner gelber Bogen nach hinten an die Wand (flackert)
      if (Math.sin(t * 30) < -0.6) break;
      const rx = x - dir * w * 0.42;
      for (let i = 0; i < 5; i++) P.px(rx - dir * i, y - 3 + Math.round((i * i) / 6), '#ffe066');
      break;
    }
    case 'dizzy':
      for (let i = 0; i < 3; i++) { const a = t * 4 + i * 2.1; P.rect(x + Math.cos(a) * 5, y - h + 1 + Math.sin(a) * 1.5, 1, 1, '#ffcd75'); }
      break;
    case 'oops': if (Math.sin(t * 8) > -0.3) P.text('!', x, y - h - 3, 3.6, { color: '#ffcd75', minPx: 8, dpr }); break;
    case 'proud':
      for (let i = 0; i < 3; i++) { const a = (t * 1.5 + i / 3) % 1; P.px(x - 5 + i * 5, y - h - 1 - a * 5, a < 0.7 ? '#ffffff' : '#ffcd75'); }
      break;
    case 'shake': // schüttelt das Wasser aus dem Fell
      for (let i = 0; i < 4; i++) { const a = t * 7 + i * 1.6; P.px(x + Math.cos(a) * 6, y - 3 + Math.sin(a) * 2, '#a8e4ff'); }
      break;
    case 'trash': // Zeug fliegt aus der Tonne [W52]
      for (let i = 0; i < 5; i++) {
        const ph = (t * 1.6 + i / 5) % 1, c = ['#f2b52c', '#94b0c2', '#ef7d57', '#f4f4f4', '#38b764'][i];
        P.rect(x + dir * 5 - dir * ph * 10, y - 6 - Math.sin(ph * Math.PI) * 9, 1.3, 1.3, c);
      }
      break;
    case 'banana': // Beute im Maul: Bananenschale
      P.rect(hx + dir * 1, y - 4, 3, 1, '#ffe066'); P.px(hx + dir * 4, y - 3, '#ffe066'); P.px(hx - dir * 1, y - 3, '#c9a227');
      break;
    case 'joy': // Herzchen und Noten steigen auf
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.9 + i / 3) % 1, px = x - 5 + i * 5 + Math.sin(ph * 6) * 1.5, py = y - h - 1 - ph * 9;
        if (i === 1) P.text('♪', px, py, 3.4, { color: '#ffffff', minPx: 8, dpr }); else heart(P, px, py, ph < 0.75 ? '#e43b44' : 'rgba(228,59,68,0.5)');
      }
      break;
    case 'hearts':
      for (let i = 0; i < 2; i++) { const ph = (t * 0.8 + i / 2) % 1; heart(P, x - 3 + i * 6, y - h - 2 - ph * 7, ph < 0.75 ? '#e43b44' : 'rgba(228,59,68,0.5)'); }
      break;
    case 'butterfly': butterflyAt(P, x + dir * (8 + Math.sin(t * 2) * 3), y - 10 + Math.sin(t * 3.1) * 2, t); break;
    case 'flyaway': butterflyAt(P, x + dir * (10 + (t % 3) * 12), y - 12 - (t % 3) * 8, t); if (Math.sin(t * 8) > -0.3) P.text('?', x, y - h - 3, 3.6, { color: '#ffcd75', minPx: 8, dpr }); break;
    default:
  }
}

function heart(P, x, y, c) {
  for (const [dx, dy] of [[-1, 0], [1, 0], [-1, -1], [1, -1], [0, 0], [0, 1]]) P.px(x + dx, y + dy, c);
}
function butterflyAt(P, x, y, t) {
  const open = Math.sin(t * 18) > 0;
  P.px(x, y, '#1a1c2c');
  P.rect(x - (open ? 2 : 1), y - 1, open ? 2 : 1, 2, '#f2b52c'); P.rect(x + 1, y - 1, open ? 2 : 1, 2, '#f2b52c');
}

/** Mülltonne (grün, Deckel; offen, wenn Bärti drin wühlt) [W52] */
export function drawBin(P, x, y, open, t) {
  P.blob(x, y + 1, 3.5, 'rgba(0,0,0,0.25)', 1.2);
  P.rect(x - 3, y - 7, 6, 7, '#1a1c2c'); P.rect(x - 2.5, y - 6.5, 5, 6.5, '#2f7a46'); P.rect(x - 2, y - 5, 1, 4, '#38b764');
  if (open) { P.rect(x - 4, y - 10 - Math.abs(Math.sin(t * 6)), 5, 1.2, '#1a1c2c'); }
  else P.rect(x - 3.5, y - 8, 7, 1.5, '#1a1c2c');
}

/** Pfützen am Polizeirevier, trocknen langsam (25 s) */
export function drawPuddles(P, list, t) {
  for (const p of list) {
    const a = Math.max(0, 1 - (t - p.t0) / 25);
    P.blob(p.x, p.y, 3, `rgba(255,224,102,${(0.55 * a).toFixed(2)})`, 1.5);
  }
}
