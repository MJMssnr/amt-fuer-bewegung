// Typ D Regie (Variante a): Der Schüler stellt für Akteure Startort x₀, Startzeit t₀ (Wartezeit) und vₓ ein,
// damit die Ereignisse im Drehbuch eintreten (Ort zu einer Zeit, Begegnung). Kein DOM [W17].
//
// Bewegungsmodell je Akteur: bis t₀ steht er bei x₀, danach gleichförmig mit vₓ.

import { buildWorld, quantityAt } from './kinematics.js';
import { evaluateGoal } from './goals.js';

/** Szenario aus Basis-Szenario (Namen, Sprites, feste Werte) und den eingestellten Werten. */
export function castScenario(base, values, tEnd) {
  return {
    ...base,
    actors: base.actors.map((a) => {
      const v = { x0: a.x0 ?? 0, t0: a.t0 ?? 0, v: a.segments?.[a.segments.length - 1]?.v ?? 0, ...(values[a.id] || {}) };
      const segs = v.t0 > 1e-9
        ? [{ dt: v.t0, v: 0 }, { dt: Math.max(1e-3, tEnd - v.t0), v: v.v }]
        : [{ dt: tEnd, v: v.v }];
      return { ...a, x0: v.x0, segments: segs };
    }),
  };
}

/**
 * Prüft die Drehbuch-Ereignisse in einer Welt.
 * events: [{ type:'at', actor, t, x, label } | { type:'meet', a, b, t, x, label }]
 * Rückgabe: [{ ok, ev, t, x }]  (t, x = was tatsächlich passiert)
 */
export function checkScript(world, events, { tolX = 2, tolT = 0.5 } = {}) {
  return events.map((ev) => {
    if (ev.type === 'at') {
      const x = quantityAt(world.actors.get(ev.actor), 'x', ev.t);
      return { ev, t: ev.t, x, ok: Math.abs(x - ev.x) <= tolX };
    }
    const m = evaluateGoal({ type: 'meet', a: ev.a, b: ev.b, ask: 't' }, world);
    const t = m.value;
    const x = Number.isFinite(t) ? quantityAt(world.actors.get(ev.a), 'x', t) : NaN;
    return { ev, t, x, ok: Number.isFinite(t) && Math.abs(t - ev.t) <= tolT && Math.abs(x - ev.x) <= tolX };
  });
}

/** Bequem: Welt bauen und prüfen */
export function runTake(base, values, tEnd, events, tol) {
  const world = buildWorld(castScenario(base, values, tEnd));
  return { world, results: checkScript(world, events, tol) };
}
