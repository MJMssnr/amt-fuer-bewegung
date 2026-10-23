// Fehlerabschätzung (Typ P) [W30]: größter und kleinster möglicher Wert eines Ergebnisses aus Messwerten mit ± Unsicherheit.
// Methode der Schule: alle Ecken des Unsicherheits-Kastens durchrechnen (Größtwert/Kleinstwert), keine Fehlerfortpflanzung.
// Kein DOM.

import { evalExpr } from './variants.js';

/**
 * measures: [{ name: 'x', value: 1.0, err: 0.2 }, …], expr: 'x / t'
 * Rückgabe: { best, max, min, corners: [{ values, result }] }
 */
export function extremes(expr, measures) {
  const best = evalExpr(expr, Object.fromEntries(measures.map((m) => [m.name, m.value])));
  const corners = [];
  const n = measures.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    const values = Object.fromEntries(measures.map((m, i) => [m.name, m.value + ((mask >> i) & 1 ? m.err : -m.err)]));
    corners.push({ values, result: evalExpr(expr, values) });
  }
  const rs = corners.map((c) => c.result);
  return { best, max: Math.max(...rs), min: Math.min(...rs), corners };
}

/**
 * Typische Fehler erkennen: Antwort passt zu einer „falschen Ecke“ (z. B. (x+Δx)/(t+Δt) für v_max)
 * oder zur linearen Näherung. Rückgabe: Schlüssel des Fehlers oder null.
 */
export function diagnose(answer, which, expr, measures, tol) {
  const ex = extremes(expr, measures);
  const target = ex[which];
  if (Math.abs(answer - target) <= tol) return null;
  if (Math.abs(answer - ex.best) <= tol) return 'best';
  if (ex.corners.some((c) => Math.abs(c.result - answer) <= tol)) return 'corner';
  // nur die größte Einzelunsicherheit verwendet (bei Summen typisch)
  const one = measures.map((m) => evalExpr(expr, Object.fromEntries(measures.map((k) => [k.name, k === m ? k.value + (which === 'max' ? k.err : -k.err) : k.value]))));
  if (one.some((r) => Math.abs(r - answer) <= tol)) return 'single';
  return null;
}
