// 2D-Kinematik mit stückweise konstanter Beschleunigung.
// Reine Physik, kein DOM. 1D ist der Spezialfall y = 0.
//
// Abschnitt (segment) im JSON:
//   { "dt": 4.5, "v": 2.5 }          konstante Geschwindigkeit (Zahl = x-Richtung, oder [vx, vy])
//   { "dt": 3,   "a": -1.5 }         konstante Beschleunigung ab aktueller Geschwindigkeit
//   { "dt": 2,   "a": -3, "v0": 6 }  wie oben, aber Geschwindigkeit springt vorher auf v0
//   { "until": "rest", "a": -2 }     Dauer ergibt sich aus einem Ereignis (siehe solveUntil)

export const G = 9.81;
const EPS = 1e-9;

export const vec = (v) =>
  Array.isArray(v) ? [Number(v[0]) || 0, Number(v[1]) || 0] : [Number(v) || 0, 0];

/** Kleinste Lösung t > EPS von A t² + B t + C = 0, sonst null. */
export function smallestPositiveRoot(A, B, C, tMin = EPS) {
  const roots = [];
  if (Math.abs(A) < 1e-12) {
    if (Math.abs(B) > 1e-12) roots.push(-C / B);
  } else {
    const D = B * B - 4 * A * C;
    if (D >= -1e-12) {
      const s = Math.sqrt(Math.max(0, D));
      roots.push((-B - s) / (2 * A), (-B + s) / (2 * A));
    }
  }
  const ok = roots.filter((t) => t > tMin).sort((a, b) => a - b);
  return ok.length ? ok[0] : null;
}

const COMP = { x: 0, y: 1 };

/** Dauer eines Abschnitts aus einer Ereignisbedingung. */
export function solveUntil(until, r, v, a) {
  if (until === 'rest' || until === 'stop') {
    // Stillstand: Geschwindigkeitskomponente mit Beschleunigung wird 0
    const k = Math.abs(a[0]) > EPS ? 0 : 1;
    if (Math.abs(a[k]) < EPS) return null;
    const t = -v[k] / a[k];
    return t > EPS ? t : null;
  }
  if (until === 'landing') return smallestPositiveRoot(0.5 * a[1], v[1], r[1]);
  if (until && typeof until === 'object') {
    for (const [key, target] of Object.entries(until)) {
      if (key in COMP) {
        const k = COMP[key];
        return smallestPositiveRoot(0.5 * a[k], v[k], r[k] - target);
      }
      if (key === 'vx' || key === 'vy' || key === 'v') {
        const k = key === 'vy' ? 1 : 0;
        if (Math.abs(a[k]) < EPS) return null;
        const t = (target - v[k]) / a[k];
        return t > EPS ? t : null;
      }
    }
  }
  return null;
}

/** Baut aus einer Akteur-Definition die Abschnitte mit Startzustand. */
export function buildActor(def) {
  let t = 0;
  let r = vec(def.r0 ?? def.x0 ?? 0);
  let v = vec(def.v0 ?? 0);
  const pieces = [];
  (def.segments || []).forEach((s, i) => {
    const jumpFrom = v;
    if (s.v0 !== undefined) v = vec(s.v0);
    let a;
    if (s.v !== undefined) {
      v = vec(s.v);
      a = [0, 0];
    } else {
      a = vec(s.a ?? 0);
    }
    let dt = s.dt;
    if (dt === undefined && s.until !== undefined) dt = solveUntil(s.until, r, v, a);
    if (!(dt > 0)) throw new Error(`Akteur "${def.id}": Abschnitt ${i + 1} hat keine gültige Dauer`);
    const jump = Math.hypot(v[0] - jumpFrom[0], v[1] - jumpFrom[1]) > 1e-6 && i > 0;
    const p = { index: i, t0: t, t1: t + dt, r0: r, v0: v, a, jump };
    pieces.push(p);
    r = posIn(p, dt);
    v = velIn(p, dt);
    t += dt;
  });
  return { id: def.id, def, pieces, tEnd: t };
}

const posIn = (p, tau) => [
  p.r0[0] + p.v0[0] * tau + 0.5 * p.a[0] * tau * tau,
  p.r0[1] + p.v0[1] * tau + 0.5 * p.a[1] * tau * tau,
];
const velIn = (p, tau) => [p.v0[0] + p.a[0] * tau, p.v0[1] + p.a[1] * tau];

export function pieceAt(actor, t) {
  const ps = actor.pieces;
  if (t <= ps[0].t0) return ps[0];
  for (const p of ps) if (t < p.t1) return p;
  return ps[ps.length - 1];
}

/** Zustand zum Zeitpunkt t (auf [0, tEnd] begrenzt). */
export function stateAt(actor, t) {
  const tc = Math.min(Math.max(t, 0), actor.tEnd);
  const p = pieceAt(actor, tc);
  const tau = tc - p.t0;
  return { t: tc, r: posIn(p, tau), v: velIn(p, tau), a: p.a.slice(), piece: p.index };
}

/** Größe als Zahl: x, y, vx, vy, ax, ay, speed (= |v|). */
export function quantityAt(actor, q, t) {
  const s = stateAt(actor, t);
  switch (q) {
    case 'x': return s.r[0];
    case 'y': return s.r[1];
    case 'v': case 'vx': return s.v[0];
    case 'vy': return s.v[1];
    case 'a': case 'ax': return s.a[0];
    case 'ay': return s.a[1];
    case 'speed': return Math.hypot(s.v[0], s.v[1]);
    default: throw new Error(`Unbekannte Größe "${q}"`);
  }
}

/** Polynom-Koeffizienten [c0, c1, c2] einer Größe innerhalb eines Abschnitts (lokale Zeit tau). */
export function polyOf(p, q) {
  const k = q === 'y' || q === 'vy' || q === 'ay' ? 1 : 0;
  if (q === 'x' || q === 'y') return [p.r0[k], p.v0[k], 0.5 * p.a[k]];
  if (q === 'v' || q === 'vx' || q === 'vy') return [p.v0[k], p.a[k], 0];
  return [p.a[k], 0, 0];
}

/**
 * Diagramm-Daten: Liste von Stücken, jedes Stück eine Liste von [t, wert].
 * Sprünge (z. B. in v oder a) bleiben als Lücke zwischen den Stücken.
 */
export function series(actor, q, samplesCurved = 32) {
  return actor.pieces.map((p) => {
    const [, , c2] = polyOf(p, q);
    const n = Math.abs(c2) > EPS ? samplesCurved : 1;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const tau = ((p.t1 - p.t0) * i) / n;
      const [a0, a1, a2] = polyOf(p, q);
      pts.push([p.t0 + tau, a0 + a1 * tau + a2 * tau * tau]);
    }
    return pts;
  });
}

/** Bahnkurve y(x) als Punktliste (für 2D). */
export function trajectory(actor, samples = 32) {
  return actor.pieces.map((p) => {
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const r = posIn(p, ((p.t1 - p.t0) * i) / samples);
      pts.push([r[0], r[1]]);
    }
    return pts;
  });
}

/** Baut alle Akteure eines Szenarios. */
export function buildWorld(scenario) {
  const actors = new Map();
  for (const def of scenario.actors || []) actors.set(def.id, buildActor(def));
  const tEnd = Math.max(...[...actors.values()].map((a) => a.tEnd));
  const is2D = [...actors.values()].some((a) =>
    a.pieces.some((p) => Math.abs(p.r0[1]) > EPS || Math.abs(p.v0[1]) > EPS || Math.abs(p.a[1]) > EPS),
  );
  return { scenario, actors, tEnd, is2D };
}
