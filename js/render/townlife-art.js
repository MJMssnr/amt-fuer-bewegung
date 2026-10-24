// Deko mit Bewegung für die Stadtkarte [W33]: Windräder am Rand, Solarmodule auf Dächern, fast durchsichtige Wolken.

const ink = '#1a1c2c';

/** Windrad, Fußpunkt (x, y), Höhe h; Rotor dreht langsam */
export function windmill(P, x, y, t, h = 46, phase = 0) {
  const hubY = y - h;
  for (let i = 0; i < h; i++) { const w = 1 + Math.round((i / h) * 2); P.rect(x - Math.floor(w / 2), hubY + i, w, 1, i % 6 ? '#e8ecf0' : '#c2c7cf'); }
  P.rect(x - 2, hubY - 2, 5, 3, '#c2c7cf'); P.rect(x - 2, hubY - 2, 5, 1, ink);
  const a0 = t * 1.4 + phase, L = h * 0.42;
  for (let k = 0; k < 3; k++) {
    const a = a0 + (k * 2 * Math.PI) / 3;
    for (let r = 2; r < L; r += 1) {
      const px = x + Math.cos(a) * r, py = hubY + Math.sin(a) * r;
      P.rect(Math.round(px), Math.round(py), r < L * 0.7 ? 2 : 1, r < L * 0.7 ? 2 : 1, '#f4f4f4');
    }
  }
  P.rect(x - 1, hubY - 1, 3, 3, '#94b0c2');
  P.rect(x - 3, y - 1, 7, 2, 'rgba(20,24,40,0.2)');
}

/** Solarmodul-Reihe auf einem Dach: n Module ab (x, y) */
export function solar(P, x, y, n = 3, t = 0) {
  for (let i = 0; i < n; i++) {
    const mx = x + i * 9;
    P.rect(mx, y, 8, 5, ink); P.rect(mx + 1, y + 1, 6, 3, '#2b3f8f');
    P.rect(mx + 3, y + 1, 1, 3, '#4b63b5'); P.rect(mx + 1, y + 2, 6, 1, '#4b63b5');
    if (Math.sin(t * 0.8 + i) > 0.92) P.rect(mx + 1, y + 1, 2, 1, '#cfeeff'); // Glanz
  }
}

/** Fast durchsichtige Wolke mit hauchzartem Schatten, zieht am Kartenrand entlang */
export function cloud(P, x, y, s = 1) {
  const parts = [[0, 0, 14], [12, -5, 12], [24, 0, 13], [10, 4, 12], [-10, 3, 9]];
  for (const [dx, dy, r] of parts) P.blob(x + dx * s, y + 40 + dy * s, Math.round(r * s), 'rgba(20,24,40,0.035)');
  for (const [dx, dy, r] of parts) P.blob(x + dx * s, y + dy * s, Math.round(r * s), 'rgba(255,255,255,0.13)');
}

/** Strömung auf dem Fluss: helle Striche treiben nach unten (Fluss fließt von oben nach unten) [W34] */
export function riverFlow(P, x, y, w, h, t) {
  for (let i = 0; i < 14; i++) {
    const yy = y + ((i * 53 + t * 18) % h), off = Math.round(Math.sin(yy / 37) * 4);
    P.rect(x + off + 6 + ((i * 13) % (w - 14)), yy, 1, 4, 'rgba(168,224,255,0.75)');
  }
}

/** Bootssteg „Fluss-Labor“: Steg ins Wasser, Floß mit Motor (schaukelt), Schild am Ufer */
export function dock(P, cx, by, n, t, dpr) {
  const bob = Math.round(Math.sin(t * 2.2));
  for (let i = 0; i < 34; i += 3) { P.rect(cx - 16 + i, by - 6, 3, 8, i % 6 ? '#a0622d' : '#b8763b'); P.rect(cx - 16 + i, by - 6, 1, 8, '#73441d'); }
  P.rect(cx - 16, by + 2, 34, 1, '#4a2d1a');
  for (const px of [cx - 14, cx + 2, cx + 16]) P.rect(px, by + 2, 2, 4, '#4a2d1a');
  // Floß
  const fx = cx + 6, fy = by + 10 + bob;
  P.rect(fx - 10, fy - 3, 20, 6, ink);
  for (let i = 0; i < 18; i += 3) P.rect(fx - 9 + i, fy - 2, 2, 4, '#c58b5e');
  P.rect(fx + 8, fy - 5, 4, 4, '#e43b44'); P.rect(fx + 11, fy - 1, 1, 3, '#94b0c2');
  P.rect(fx - 1, fy - 12, 1, 9, '#73441d'); P.rect(fx, fy - 12, 6, 4, '#ffcd75');
  // Schild
  const sx = cx - 13;
  P.rect(sx, by - 22, 1, 18, '#566c86');
  const label = n.sign ?? 'FLUSS-LABOR';
  const sw = Math.ceil(P.measure(label, 4.4, { bold: true, minPx: 8, dpr }).w) + 6;
  P.rect(sx - sw / 2, by - 30, sw, 9, ink); P.rect(sx - sw / 2 + 1, by - 29, sw - 2, 7, '#73eff7');
  P.text(label, sx, by - 25.4, 4.4, { color: ink, bold: true, minPx: 8, dpr });
}
