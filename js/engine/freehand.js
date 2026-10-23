// Freihand (Typ B): Auto-Begradigung einer gezeichneten Spur und Vergleich mit der Lösung. Kein DOM.
// Punkte sind [t, y] in Diagrammwerten; Begradigung arbeitet mit Skalierung (sx, sy) in Pixeln.

/** Ramer-Douglas-Peucker: Spur zu wenigen geraden Stücken vereinfachen. eps in Pixeln. */
export function straighten(pts, { sx = 1, sy = 1, eps = 6 } = {}) {
  if (pts.length < 3) return pts.slice();
  const P = pts.map(([t, y]) => [t * sx, y * sy]);
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = P[a], [bx, by] = P[b];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let best = -1, dmax = 0;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((by - ay) * P[i][0] - (bx - ax) * P[i][1] + bx * ay - by * ax) / len;
      if (d > dmax) { dmax = d; best = i; }
    }
    if (dmax > eps) { keep[best] = true; stack.push([a, best], [best, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

/** Wert einer Polylinie [[t,y],…] bei t (linear), außerhalb: null */
export function polyAt(poly, t) {
  if (!poly.length || t < poly[0][0] - 1e-9 || t > poly[poly.length - 1][0] + 1e-9) return null;
  for (let i = 0; i < poly.length - 1; i++) {
    const [t0, y0] = poly[i], [t1, y1] = poly[i + 1];
    if (t <= t1 + 1e-9) return t1 - t0 < 1e-9 ? y1 : y0 + ((y1 - y0) * (t - t0)) / (t1 - t0);
  }
  return poly[poly.length - 1][1];
}

/**
 * Vergleicht die eigene Linie mit der Lösung truthAt(t).
 * tolY: erlaubte senkrechte Abweichung; tolT: erlaubte Zeitverschiebung (Knicke nicht exakt getroffen).
 * Rückgabe: { ok, missing: 'start'|'end'|null, worst: { t, dy }, first: erste Stelle außerhalb der Toleranz }
 */
export function compareLine(poly, truthAt, { tEnd, tolY, tolT = 0.3, dt = 0.05 }) {
  if (poly.length < 2) return { ok: false, missing: 'start', worst: null };
  if (poly[0][0] > tolT) return { ok: false, missing: 'start', worst: null };
  if (poly[poly.length - 1][0] < tEnd - tolT) return { ok: false, missing: 'end', worst: null };
  let worst = { t: 0, dy: 0 }, first = null;
  for (let t = 0; t <= tEnd + 1e-9; t += dt) {
    const u = polyAt(poly, Math.min(Math.max(t, poly[0][0]), poly[poly.length - 1][0]));
    let best = Infinity, sign = 0;
    for (let s = -tolT; s <= tolT + 1e-9; s += dt) {
      const ts = Math.min(tEnd, Math.max(0, t + s));
      const d = u - truthAt(ts);
      if (Math.abs(d) < best) { best = Math.abs(d); sign = Math.sign(d); }
    }
    if (best > Math.abs(worst.dy)) worst = { t, dy: best * sign };
    if (!first && best > tolY) first = { t, dy: best * sign };
  }
  return { ok: Math.abs(worst.dy) <= tolY, missing: null, worst, first };
}
