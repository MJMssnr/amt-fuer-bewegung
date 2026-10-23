// Auswertbare Fragen ("Goals") an ein Szenario. Erweiterbar über registerGoal().
// Jeder Goal-Typ liefert ein Objekt mit benannten Ergebnissen, z. B. { t, x }.
// Welche Größe abgefragt wird, steht im Goal als "ask" (Standard: erster Schlüssel).

import { buildWorld, stateAt, quantityAt, polyOf, smallestPositiveRoot } from './kinematics.js';

const REGISTRY = new Map();

/** Neuen Goal-Typ anmelden: fn(goal, world) -> { name: zahl, ... } */
export function registerGoal(type, fn, meta = {}) {
  REGISTRY.set(type, { fn, ...meta });
}
export const goalTypes = () => [...REGISTRY.keys()];

/** Wertet ein Goal aus. Gibt { ...ergebnisse, value } zurück. */
export function evaluateGoal(goal, scenarioOrWorld) {
  const world = scenarioOrWorld.actors instanceof Map ? scenarioOrWorld : buildWorld(scenarioOrWorld);
  const entry = REGISTRY.get(goal.type);
  if (!entry) throw new Error(`Unbekannter Goal-Typ "${goal.type}"`);
  const res = entry.fn(goal, world);
  const key = goal.ask ?? Object.keys(res)[0];
  return { ...res, value: res[key] };
}

const actorOf = (world, id) => {
  const a = world.actors.get(id);
  if (!a) throw new Error(`Akteur "${id}" existiert nicht`);
  return a;
};
const axisOf = (goal) => (goal.axis === 'y' ? 'y' : 'x');
const velOf = (axis) => (axis === 'y' ? 'vy' : 'vx');

// ---------- Basis-Goals ----------

registerGoal('valueAt', (g, w) => ({ value: quantityAt(actorOf(w, g.actor), g.q, g.t) }));

registerGoal('duration', (g, w) => ({ t: actorOf(w, g.actor).tEnd }));

registerGoal('displacement', (g, w) => {
  const A = actorOf(w, g.actor);
  const ax = axisOf(g);
  return { d: quantityAt(A, ax, A.tEnd) - quantityAt(A, ax, 0) };
});

/** Zurückgelegter Weg (Betrag aufsummiert) entlang einer Achse, exakt. */
function pathLength(A, ax, t0 = 0, t1 = A.tEnd) {
  const vq = velOf(ax);
  let s = 0;
  for (const p of A.pieces) {
    const a = Math.max(p.t0, t0);
    const b = Math.min(p.t1, t1);
    if (b <= a) continue;
    const [v0, acc] = polyOf(p, vq);
    const cuts = [a, b];
    if (Math.abs(acc) > 1e-12) {
      const tz = p.t0 - v0 / acc; // Umkehrpunkt
      if (tz > a && tz < b) cuts.splice(1, 0, tz);
    }
    for (let i = 0; i < cuts.length - 1; i++) {
      s += Math.abs(quantityAt(A, ax, cuts[i + 1] - 1e-12) - quantityAt(A, ax, cuts[i]));
    }
  }
  return s;
}

/** Bahnlänge in 2D (numerisch, Simpson). */
function arcLength(A, t0 = 0, t1 = A.tEnd, n = 400) {
  const h = (t1 - t0) / n;
  let s = 0;
  for (let i = 0; i <= n; i++) {
    const f = quantityAt(A, 'speed', t0 + i * h);
    s += f * (i === 0 || i === n ? 1 : i % 2 ? 4 : 2);
  }
  return (s * h) / 3;
}

registerGoal('totalPath', (g, w) => {
  const A = actorOf(w, g.actor);
  return { s: g.axis === '2d' ? arcLength(A) : pathLength(A, axisOf(g)) };
});

registerGoal('avgSpeed', (g, w) => {
  const A = actorOf(w, g.actor);
  const s = g.axis === '2d' ? arcLength(A) : pathLength(A, axisOf(g));
  return { v: s / A.tEnd };
});

registerGoal('avgVelocity', (g, w) => {
  const A = actorOf(w, g.actor);
  const ax = axisOf(g);
  return { v: (quantityAt(A, ax, A.tEnd) - quantityAt(A, ax, 0)) / A.tEnd };
});

/** Weg und Dauer eines einzelnen Abschnitts (z. B. Bremsweg, Bremszeit). */
registerGoal('segment', (g, w) => {
  const A = actorOf(w, g.actor);
  const p = A.pieces[g.index];
  if (!p) throw new Error(`Abschnitt ${g.index} fehlt bei "${g.actor}"`);
  return { s: pathLength(A, axisOf(g), p.t0, p.t1), t: p.t1 - p.t0 };
});

/** Maximum/Minimum einer Größe (z. B. maximale Höhe, Höchstgeschwindigkeit). */
function extremum(A, q, sign) {
  let best = { t: 0, value: sign * -Infinity };
  const consider = (t) => {
    const val = q === 'speed' ? quantityAt(A, 'speed', t) : quantityAt(A, q, t);
    if (sign * val > sign * best.value) best = { t, value: val };
  };
  for (const p of A.pieces) {
    consider(p.t0);
    consider(p.t1 - 1e-12);
    if (q === 'x' || q === 'y') {
      const [, c1, c2] = polyOf(p, q);
      if (Math.abs(c2) > 1e-12) {
        const tv = p.t0 - c1 / (2 * c2);
        if (tv > p.t0 && tv < p.t1) consider(tv);
      }
    }
  }
  return best;
}
registerGoal('max', (g, w) => {
  const e = extremum(actorOf(w, g.actor), g.q, +1);
  return { value: e.value, t: e.t };
});
registerGoal('min', (g, w) => {
  const e = extremum(actorOf(w, g.actor), g.q, -1);
  return { value: e.value, t: e.t };
});

/** Erster Zeitpunkt, zu dem eine Größe einen Wert erreicht. */
registerGoal('timeUntil', (g, w) => {
  const A = actorOf(w, g.actor);
  for (const p of A.pieces) {
    const [c0, c1, c2] = polyOf(p, g.q);
    if (Math.abs(c0 - g.value) < 1e-9 && p.index === 0) return { t: p.t0 };
    const tau = smallestPositiveRoot(c2, c1, c0 - g.value, -1e-9);
    if (tau !== null && p.t0 + tau <= p.t1 + 1e-9) return { t: p.t0 + tau };
  }
  return { t: NaN };
});

/** Treffen/Einholen zweier Akteure entlang einer Achse (exakt, stückweise quadratisch). */
registerGoal('meet', (g, w) => {
  const A = actorOf(w, g.a);
  const B = actorOf(w, g.b);
  const ax = axisOf(g);
  const tStart = g.after ?? 0;
  const tStop = Math.min(A.tEnd, B.tEnd);
  const cuts = [...new Set([tStart, tStop, ...A.pieces.map((p) => p.t0), ...B.pieces.map((p) => p.t0)])]
    .filter((t) => t >= tStart && t <= tStop)
    .sort((a, b) => a - b);
  for (let i = 0; i < cuts.length - 1; i++) {
    const T = cuts[i];
    const len = cuts[i + 1] - T;
    const sa = stateAt(A, T + 1e-12);
    const sb = stateAt(B, T + 1e-12);
    const k = ax === 'y' ? 1 : 0;
    const C = quantityAt(A, ax, T) - quantityAt(B, ax, T);
    const Bc = sa.v[k] - sb.v[k];
    const Ac = 0.5 * (sa.a[k] - sb.a[k]);
    if (Math.abs(C) < 1e-9 && (T > tStart || g.includeStart)) return { t: T, x: quantityAt(A, ax, T) };
    const tau = smallestPositiveRoot(Ac, Bc, C, 1e-9);
    if (tau !== null && tau <= len + 1e-9) return { t: T + tau, x: quantityAt(A, ax, T + tau) };
  }
  return { t: NaN, x: NaN };
});

/** Abstand zweier Akteure zu einem Zeitpunkt. */
registerGoal('distanceAt', (g, w) => {
  const sa = stateAt(actorOf(w, g.a), g.t);
  const sb = stateAt(actorOf(w, g.b), g.t);
  return g.axis === '2d'
    ? { d: Math.hypot(sa.r[0] - sb.r[0], sa.r[1] - sb.r[1]) }
    : { d: Math.abs(sa.r[axisOf(g) === 'y' ? 1 : 0] - sb.r[axisOf(g) === 'y' ? 1 : 0]) };
});

/** Tempolimit-Prüfung. limit in km/h. */
registerGoal('speedCheck', (g, w) => {
  const e = extremum(actorOf(w, g.actor), 'speed', +1);
  const kmh = e.value * 3.6;
  return { vmax: kmh, exceeded: kmh > g.limit + 1e-9 ? 1 : 0 };
});

// ---------- Umkehraufgaben ----------

function setPath(obj, path, value) {
  const keys = path.split('.');
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    o = Array.isArray(o) ? o[Number(k)] : k === 'actors' ? o.actors : o[k];
    if (o === undefined) throw new Error(`Pfad "${path}" ungültig`);
  }
  const last = keys[keys.length - 1];
  o[last] = value;
}
function resolveActorPath(scenario, path) {
  // "actors.B.segments.0.v" -> Akteur über id statt Index ansprechen
  const m = path.match(/^actors\.([^.]+)\.(.+)$/);
  if (!m) return path;
  const idx = scenario.actors.findIndex((a) => a.id === m[1]);
  if (idx < 0) throw new Error(`Akteur "${m[1]}" existiert nicht`);
  return `actors.${idx}.${m[2]}`;
}

/**
 * Sucht den Wert eines unbekannten Parameters, sodass condition den Zielwert target liefert.
 * { type:"solveFor", unknown:"actors.B.segments.0.v", range:[0,30],
 *   condition:{ type:"meet", a:"A", b:"B", ask:"x" }, target: 150 }
 */
registerGoal('solveFor', (g, w) => {
  const base = w.scenario;
  const path = resolveActorPath(base, g.unknown);
  const f = (val) => {
    const sc = structuredClone(base);
    setPath(sc, path, val);
    try {
      const r = evaluateGoal(g.condition, sc).value;
      return Number.isFinite(r) ? r - g.target : NaN;
    } catch {
      return NaN;
    }
  };
  const [lo, hi] = g.range ?? [-100, 100];
  const N = 200;
  let prev = { x: lo, f: f(lo) };
  const hits = [];
  for (let i = 1; i <= N; i++) {
    const x = lo + ((hi - lo) * i) / N;
    const fx = f(x);
    if (Number.isFinite(prev.f) && Number.isFinite(fx) && prev.f * fx <= 0) {
      let a = prev.x, b = x, fa = prev.f;
      for (let j = 0; j < 80; j++) {
        const m = (a + b) / 2;
        const fm = f(m);
        if (!Number.isFinite(fm)) break;
        if (fa * fm <= 0) b = m;
        else { a = m; fa = fm; }
      }
      hits.push((a + b) / 2);
    }
    prev = { x, f: fx };
  }
  const uniq = hits.filter((h, i) => i === 0 || Math.abs(h - hits[i - 1]) > 1e-6);
  return { value: uniq.length ? uniq[0] : NaN, solutions: uniq.length };
});
