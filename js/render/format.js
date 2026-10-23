// Zahlen deutsch formatieren (Dezimalkomma) und Eingaben mit Komma lesen.

const nf = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });
export const fmt = (n, digits) =>
  digits === undefined
    ? nf.format(Math.abs(n) < 1e-9 ? 0 : n)
    : new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(n);

/** "2,5" oder "2.5" -> 2.5 ; ungültig -> NaN */
export const parseNum = (s) => {
  const t = String(s ?? '').replace(/\s/g, '').replace('−', '-').replace(',', '.');
  return t === '' ? NaN : Number(t);
};

/** Schöne Schrittweite (1, 2, 5 · 10^n) für ca. `count` Teilstriche. Ohne 2,5, damit Rasterlinien auf ganzen Werten liegen. */
export function niceStep(range, count = 5) {
  if (!(range > 0)) return 1;
  const raw = range / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const f = raw / mag;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * mag;
}

/** Achsenbereich, der 0 enthält und auf schöne Schritte gerundet ist. */
export function niceRange(min, max, count = 5) {
  let lo = Math.min(0, min);
  let hi = Math.max(0, max);
  if (hi - lo < 1e-9) { lo = -1; hi = 1; }
  const step = niceStep(hi - lo, count);
  lo = Math.floor(lo / step + 1e-9) * step;
  hi = Math.ceil(hi / step - 1e-9) * step;
  return { lo, hi, step };
}

/** Feinraster: Unterteilungen pro Hauptschritt (1 → 5, 2 → 4, 5 → 5), damit Kästchen zählbar sind. */
export function minorDiv(step) {
  const mag = 10 ** Math.floor(Math.log10(step) + 1e-9);
  const f = Math.round((step / mag) * 100) / 100;
  return f === 2 ? 4 : 5;
}
