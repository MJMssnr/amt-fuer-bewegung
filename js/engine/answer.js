// Prüfen von Zahlenantworten. Reine Funktionen, kein DOM.

/** Umrechnungsfaktor von SI in die Anzeigeeinheit. */
export const UNIT_FACTOR = { 'm': 1, 's': 1, 'm/s': 1, 'm/s²': 1, 'km/h': 3.6, 'km': 0.001, 'min': 1 / 60, 'cm': 100, 'h': 1 / 3600 };

/**
 * Toleranz: eine Einheit in der 2. signifikanten Stelle.
 * 24 -> ±1 ; 592,5 -> ±10 ; 2,3 -> ±0,1 ; 0,047 -> ±0,001
 */
export function sigTolerance(truth) {
  const a = Math.abs(truth);
  if (a < 1e-12) return 0.01;
  return 10 ** (Math.floor(Math.log10(a)) - 1);
}

/** Liegt die Eingabe innerhalb der Toleranz? tol überschreibt die Standardtoleranz. */
export function isClose(input, truth, tol) {
  if (!Number.isFinite(input)) return false;
  return Math.abs(input - truth) <= (tol ?? sigTolerance(truth)) * (1 + 1e-9);
}

/** Erstes passende "Typischer-Fehler"-Hinweis-Objekt oder null. */
export function matchHint(input, hints = []) {
  return hints.find((h) => Number.isFinite(h.value) && isClose(input, h.value, h.tol)) ?? null;
}
