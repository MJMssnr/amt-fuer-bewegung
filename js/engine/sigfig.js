// Gültige Ziffern (g.Z.) einer getippten Eingabe – nach Herrn Messners Regeln [W16, W17]. Kein DOM.
// g.Z. = alle Ziffern ab der ersten von 0 verschiedenen. 00035,4455 → 6; 1,00 → 3; 120 → 3; 0 → 0.
// Standard im Spiel: 2 g.Z. Eine g.Z. ist IMMER zu wenig. Ab 4 g.Z. ist es zu genau. 0 hat keine g.Z. (kein Einwand).

/** Anzahl gültiger Ziffern im getippten Text (nicht in der Zahl! „3,0“ ≠ „3“). NaN bei ungültiger Eingabe. */
export function countSig(text) {
  const t = String(text ?? '').replace(/\s/g, '').replace('−', '-').replace(/^[+-]/, '');
  if (!/^(\d+([.,]\d*)?|[.,]\d+)$/.test(t)) return NaN;
  const digits = t.replace(/[.,]/, '');
  const first = digits.search(/[1-9]/);
  return first < 0 ? 0 : digits.length - first;
}

/** 'few' (genau 1 g.Z.), 'many' (≥ 4 g.Z.) oder null (in Ordnung bzw. 0 / ungültig) */
export function sigVerdict(text, { min = 2, max = 3 } = {}) {
  const n = countSig(text);
  if (!Number.isFinite(n) || n === 0) return null;
  if (n < min) return 'few';
  if (n > max) return 'many';
  return null;
}

/** Vorschlag, wie man es richtig schreibt: auf `digits` g.Z. (mit Dezimalkomma, Nullen am Ende bleiben stehen) */
export function sigSuggest(value, digits = 2) {
  if (!Number.isFinite(value) || value === 0) return '0';
  const mag = Math.floor(Math.log10(Math.abs(value)));
  const dec = Math.max(0, digits - 1 - mag);
  const r = Number(value.toPrecision(digits));
  // große ganze Zahlen (1200 hätte 4 g.Z.) → Zehnerpotenz: 1,2 · 10³
  if (mag >= digits) {
    const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    const m = (r / 10 ** mag).toFixed(digits - 1).replace('.', ',').replace('-', '−');
    return `${m} · 10${String(mag).split('').map((d) => SUP[d]).join('')}`;
  }
  return r.toFixed(dec).replace('.', ',').replace('-', '−');
}

/** Für Texte des Spiels: formatierte Zahl, aber nie mit nur 1 g.Z. („4“ → „4,0“); 0 bleibt 0 [W18] */
export function atLeast2(formatted, value) {
  return countSig(formatted.replace('−', '-')) === 1 ? sigSuggest(value, 2) : formatted;
}
