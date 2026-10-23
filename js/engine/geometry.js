// Geometrie im Diagramm, kein DOM:
// - Flächen-Puzzle (Typ K): Fläche unter dem t-v-Graphen in Rechtecke und Dreiecke zerlegen (Fläche = Ortsänderung Δx)
// - Steigungsdreieck (Typ L): Steigung eines geraden Abschnitts (t-x: vₓ, t-vₓ: aₓ)

const EPS = 1e-9;

/**
 * Zerlegt die Fläche zwischen t-vₓ-Graph und t-Achse im Intervall [t1, t2] in Puzzleteile.
 * Pro Abschnitt: konstant → Rechteck; von/auf 0 → Dreieck; sonst Rechteck + Dreieck; Vorzeichenwechsel → zwei Dreiecke.
 * Rückgabe: [{ kind:'rect'|'tri', pts:[[t,v],…], area (mit Vorzeichen), t0, t1 }]
 */
export function areaPieces(actor, q = 'vx', t1 = 0, t2 = actor.tEnd) {
  const out = [];
  const comp = q === 'vy' ? 1 : 0;
  for (const p of actor.pieces) {
    const a = Math.max(t1, p.t0), b = Math.min(t2, p.t1);
    if (b - a < EPS) continue;
    const acc = p.a[comp];
    const vAt = (t) => p.v0[comp] + acc * (t - p.t0);
    const va = vAt(a), vb = vAt(b);
    // Vorzeichenwechsel innerhalb des Abschnitts → an der Nullstelle teilen
    if (va * vb < -EPS && Math.abs(acc) > EPS) {
      const t0 = a - va / acc;
      pushLinear(out, a, t0, va, 0);
      pushLinear(out, t0, b, 0, vAt(b));
    } else pushLinear(out, a, b, va, vAt(b));
  }
  return out.filter((x) => Math.abs(x.area) > 1e-6);
}

function pushLinear(out, a, b, va, vb) {
  const w = b - a;
  if (Math.abs(va - vb) < EPS) {
    out.push({ kind: 'rect', t0: a, t1: b, pts: [[a, 0], [b, 0], [b, va], [a, va]], area: va * w });
    return;
  }
  if (Math.abs(va) < EPS || Math.abs(vb) < EPS) {
    out.push({ kind: 'tri', t0: a, t1: b, pts: [[a, 0], [b, 0], [b, vb], [a, va]].filter((pt, i) => !(i >= 2 && Math.abs(pt[1]) < EPS)), area: ((va + vb) / 2) * w });
    return;
  }
  // gleiches Vorzeichen, Trapez → Rechteck (kleinerer Betrag) + Dreieck darüber
  const base = Math.abs(va) < Math.abs(vb) ? va : vb;
  out.push({ kind: 'rect', t0: a, t1: b, pts: [[a, 0], [b, 0], [b, base], [a, base]], area: base * w });
  out.push({ kind: 'tri', t0: a, t1: b, pts: [[a, base], [b, base], Math.abs(va) > Math.abs(vb) ? [a, va] : [b, vb]], area: ((va + vb) / 2 - base) * w });
}

/** Schwerpunkt eines Polygons (für die Beschriftung A₁, A₂, …) */
export const centroid = (pts) => pts.reduce(([s, u], [t, v]) => [s + t / pts.length, u + v / pts.length], [0, 0]);

/**
 * Steigung des Abschnitts Nr. `index` im Diagramm der Größe q ('x' → vₓ, 'vx' → aₓ).
 * Nur für gerade Abschnitte sinnvoll: bei q='x' muss aₓ = 0 sein.
 */
export function segmentSlope(actor, q, index) {
  const p = actor.pieces[index];
  if (!p) return { slope: NaN, straight: false, t0: NaN, t1: NaN };
  const comp = q === 'y' || q === 'vy' ? 1 : 0;
  if (q === 'x' || q === 'y') return { slope: p.v0[comp], straight: Math.abs(p.a[comp]) < EPS, t0: p.t0, t1: p.t1 };
  return { slope: p.a[comp], straight: true, t0: p.t0, t1: p.t1 };
}
