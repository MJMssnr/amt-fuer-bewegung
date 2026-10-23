// Größere Fahrzeuge (prozedurale Pixelart) für Startbildschirm und Finale.
// Koordinaten: x = linke Kante, y = Bodenlinie (Unterkante der Räder), Welt-Einheiten.

const ink = '#1a1c2c';

/** Rad mit sich drehender Speiche. dist = zurückgelegter Weg (für die Drehung). */
export function wheel(P, cx, cy, r, dist, rim = '#94b0c2') {
  P.blob(cx, cy, r, ink);
  P.blob(cx, cy, r - 2, '#333c57');
  P.blob(cx, cy, Math.max(1, r - 3), rim);
  const a = dist / r;
  for (const off of [0, Math.PI]) {
    P.px(cx + Math.round(Math.cos(a + off) * (r - 2)), cy + Math.round(Math.sin(a + off) * (r - 2)), '#f4f4f4');
  }
  P.px(cx, cy, ink);
}

/** Kompaktwagen nach rechts fahrend, 46×18. */
export function car(P, x, y, dist, col = '#e43b44', colD = '#a12a35', t = 0) {
  const bob = Math.round(Math.sin(dist * 0.35) * 0.5);
  const yb = y - bob;
  // Lichtkegel
  for (let i = 0; i < 18; i++) P.rect(x + 46 + i, yb - 11 - i * 0.25, 1, 3 + i * 0.5, `rgba(255,240,170,${0.22 - i * 0.011})`);
  P.rect(x + 2, yb - 13, 43, 9, ink);
  P.rect(x + 3, yb - 12, 41, 7, col);
  P.rect(x + 3, yb - 7, 41, 2, colD);
  P.rect(x + 3, yb - 12, 41, 1, 'rgba(255,255,255,0.35)');
  P.rect(x + 11, yb - 19, 22, 7, ink);
  P.rect(x + 12, yb - 18, 20, 6, col);
  P.rect(x + 13, yb - 17, 8, 4, '#a8ecff'); P.rect(x + 23, yb - 17, 8, 4, '#a8ecff');
  P.rect(x + 13, yb - 17, 3, 1, '#ffffff'); P.rect(x + 23, yb - 17, 3, 1, '#ffffff');
  P.rect(x + 21, yb - 17, 2, 5, colD);
  P.rect(x + 42, yb - 11, 3, 2, '#fff4b0'); P.rect(x + 2, yb - 11, 2, 2, '#ff5a5a');
  P.rect(x + 24, yb - 10, 3, 1, ink);
  wheel(P, x + 11, y - 4, 5, dist); wheel(P, x + 35, y - 4, 5, dist);
}

/** Sportmotorrad nach links fahrend, Fahrer in Rennhaltung, 40×24. */
export function motorbike(P, x, y, dist, t = 0) {
  const lift = Math.max(0, Math.round(Math.sin(t * 1.3) * 4) - 1); // gelegentlicher Wheelie-Ansatz
  wheel(P, x + 7, y - 5 - lift, 6, dist, '#c2c7cf');
  wheel(P, x + 32, y - 5, 6, dist, '#c2c7cf');
  // Verkleidung
  P.rect(x + 4, y - 15 - lift, 26, 8, ink);
  P.rect(x + 5, y - 14 - lift, 24, 6, '#e43b44');
  P.rect(x + 3, y - 12 - lift, 4, 4, ink); P.rect(x + 4, y - 11 - lift, 3, 2, '#fff4b0');
  P.rect(x + 7, y - 13 - lift, 18, 1, '#ff8a8a');
  P.rect(x + 8, y - 18 - lift, 5, 3, '#a8ecff');
  P.rect(x + 14, y - 10, 12, 2, '#f4f4f4');
  P.rect(x + 27, y - 11, 9, 2, '#94b0c2'); P.rect(x + 35, y - 12, 3, 3, '#566c86');
  P.rect(x + 22, y - 17, 10, 3, ink);
  // Fahrer
  P.blob(x + 13, y - 22 - lift, 4, ink); P.blob(x + 13, y - 22 - lift, 3, '#ffcd75');
  P.rect(x + 10, y - 23 - lift, 4, 2, '#1a1c2c'); P.rect(x + 10, y - 23 - lift, 3, 1, '#73eff7');
  P.rect(x + 16, y - 21 - lift, 6, 4, ink); P.rect(x + 20, y - 20, 6, 4, ink);
  P.rect(x + 17, y - 20 - lift, 4, 2, '#ffcd75'); P.rect(x + 21, y - 19, 4, 2, '#ffcd75');
  P.rect(x + 11, y - 18 - lift, 6, 2, ink);
  P.rect(x + 24, y - 16, 3, 6, ink); P.rect(x + 22, y - 11, 4, 2, ink);
}

/** Rakete (Mittelpunkt cx, Unterkante y), 12×34. thrust 0…1 */
export function rocket(P, cx, y, t, thrust = 0, red = false) {
  const body = red ? '#e43b44' : '#f4f4f4', side = red ? '#a12a35' : '#c2c7cf', stripe = red ? '#f4f4f4' : '#e43b44', fin = red ? '#f4f4f4' : '#e43b44';
  const x = cx - 6;
  if (thrust > 0) {
    const len = Math.round((8 + Math.sin(t * 40) * 3 + Math.sin(t * 23) * 2) * thrust);
    for (let i = 0; i < len; i++) {
      const w = Math.max(1, Math.round(5 - i * 0.4));
      const col = i < 2 ? '#ffffff' : i < len * 0.4 ? '#fff1a8' : i < len * 0.75 ? '#ffb347' : '#ff5a36';
      P.rect(cx - w, y + i, 2 * w, 1, col);
    }
  }
  P.rect(x + 3, y - 2, 6, 2, '#566c86');
  // Flossen
  P.rect(x - 2, y - 10, 4, 8, ink); P.rect(x - 1, y - 9, 3, 6, fin);
  P.rect(x + 10, y - 10, 4, 8, ink); P.rect(x + 10, y - 9, 3, 6, fin);
  // Rumpf
  P.rect(x + 1, y - 27, 10, 25, ink);
  P.rect(x + 2, y - 26, 8, 24, body);
  P.rect(x + 8, y - 26, 2, 24, side);
  P.rect(x + 2, y - 8, 8, 2, stripe);
  P.blob(cx, y - 18, 2, ink); P.px(cx - 1, y - 19, '#73eff7'); P.px(cx, y - 18, '#41a6f6');
  // Spitze
  for (let i = 0; i < 7; i++) {
    const w = Math.max(1, 5 - Math.floor(i * 0.75));
    P.rect(cx - w, y - 28 - i, 2 * w, 1, i === 6 ? ink : red ? '#ffcd75' : '#e43b44');
  }
  P.px(cx - 2, y - 30, '#ff8a8a');
}

/** Rauch-/Abgaspartikel: Liste von {x,y,vx,vy,r,life,max,col} */
export function stepParticles(list, dt, wind = 0) {
  for (const p of list) {
    p.x += (p.vx + wind) * dt;
    p.y += p.vy * dt;
    p.vy *= 0.985;
    p.r += (p.grow ?? 3) * dt;
    p.life -= dt;
  }
  for (let i = list.length - 1; i >= 0; i--) if (list[i].life <= 0) list.splice(i, 1);
}
export function drawParticles(P, list) {
  for (const p of list) {
    const a = Math.max(0, Math.min(1, p.life / p.max)) * (p.alpha ?? 0.7);
    P.blob(Math.round(p.x), Math.round(p.y), Math.max(1, Math.round(p.r)), (p.col ?? 'rgba(230,230,240,A)').replace('A', a.toFixed(2)));
  }
}
