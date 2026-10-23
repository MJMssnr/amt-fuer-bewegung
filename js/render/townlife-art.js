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
