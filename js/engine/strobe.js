// Stroboskopbilder (Typen M, N, O) [W22]. Kein DOM.
// Eine Bewegung wird zu festen Blitzzeitpunkten „fotografiert“: Ort des Körpers bei t₀, t₀+Δt, t₀+2Δt, …
//
// Bewegung ("motion" im Ticket):
//   { "kind":"kin", "x0":0, "segments":[ … wie in Szenarien … ] }            gerade Bahn (x)
//   { "kind":"pendulum", "L":1.2, "amp":35, "D":2.0 }                         Pendel: einmal von links nach rechts
//      L = Fadenlänge in m, amp = Auslenkung in Grad, D = Dauer des Durchschwingens in s

import { buildActor, quantityAt } from './kinematics.js';

/** Funktion t ↦ { x, y } (y nur beim Pendel, Höhe über dem tiefsten Punkt) und Gesamtdauer */
export function motionOf(m) {
  if (m.kind === 'pendulum') {
    const A = (m.amp * Math.PI) / 180, D = m.D;
    return {
      tEnd: D,
      at: (t) => {
        const th = -A * Math.cos((Math.PI * Math.min(Math.max(t, 0), D)) / D);
        return { x: m.L * Math.sin(th), y: m.L * (1 - Math.cos(th)), th };
      },
    };
  }
  const a = buildActor({ id: 'obj', x0: m.x0 ?? 0, segments: m.segments });
  return { tEnd: a.tEnd, at: (t) => ({ x: quantityAt(a, 'x', t), y: 0 }) };
}

/** Blitzzeitpunkte: n Blitze ab t0 im Abstand dt */
export const flashTimes = ({ n, dt, t0 = 0 }) => Array.from({ length: n }, (_, k) => t0 + k * dt);

/** Orte der Abbilder */
export function strobePositions(motion, flash) {
  const M = motionOf(motion);
  return flashTimes(flash).map((t) => ({ t, ...M.at(t) }));
}

/** Mittlere Geschwindigkeit zwischen erstem und letztem Abbild (bzw. zwischen Abbild i und j) */
export function strobeSpeed(pos, i = 0, j = pos.length - 1) {
  return (pos[j].x - pos[i].x) / (pos[j].t - pos[i].t);
}

/**
 * Qualitativer Vergleich eines selbst gebauten Stroboskopbilds (Typ O).
 * user, truth: Orte (gleiche Länge, gleiche Einheit). tol: erlaubte Abweichung je Abbild.
 * Prüft: Reihenfolge, Lage jedes Abbilds (±tol), Muster der Abstände (gleich / wachsend / schrumpfend).
 * Rückgabe: { ok, far:[i…], order:boolean, pattern:[{ i, want:'gleich'|'größer'|'kleiner' }] }
 */
export function checkStrobe(user, truth, { tol }) {
  const dir = Math.sign(truth[truth.length - 1] - truth[0]) || 1;
  const u = user.map((x) => x * dir), w = truth.map((x) => x * dir);
  let order = true;
  for (let i = 1; i < u.length; i++) if (u[i] <= u[i - 1]) order = false;
  const far = u.map((x, i) => (Math.abs(x - w[i]) > tol ? i : -1)).filter((i) => i >= 0);
  const gw = w.slice(1).map((x, i) => x - w[i]), gu = u.slice(1).map((x, i) => x - u[i]);
  const mean = gw.reduce((s, g) => s + Math.abs(g), 0) / Math.max(1, gw.length);
  const pattern = [];
  for (let i = 0; i < gw.length - 1; i++) {
    const dW = gw[i + 1] - gw[i], dU = gu[i + 1] - gu[i];
    const want = Math.abs(dW) < 0.15 * mean ? 'gleich' : dW > 0 ? 'größer' : 'kleiner';
    const ok = want === 'gleich' ? Math.abs(dU) < 0.45 * mean : Math.sign(dU) === Math.sign(dW);
    if (!ok) pattern.push({ i, want });
  }
  return { ok: order && !far.length && !pattern.length, far, order, pattern };
}

/** Beschleunigung aus drei aufeinanderfolgenden Abbildern ab i (zweite Differenz) */
export function strobeAccel(pos, i = 0) {
  const dt = pos[i + 1].t - pos[i].t;
  return (pos[i + 2].x - 2 * pos[i + 1].x + pos[i].x) / (dt * dt);
}
