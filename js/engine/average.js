// Durchschnittsgeschwindigkeit aus Abschnitten (Typ U und V) [W34]. Kein DOM.
// Alle Größen in SI (m, s, m/s). Teile: { dx, v } (U: Strecken bekannt) oder { dt, v } (V: Zeiten bekannt).
// Höchstens eine Geschwindigkeit darf fehlen (v: null) – dann wird sie aus dem Ziel-Schnitt bestimmt.

/** v̄ = Gesamtstrecke / Gesamtzeit für Strecken-Abschnitte */
export function avgByDistance(parts) {
  const s = parts.reduce((a, p) => a + p.dx, 0), t = parts.reduce((a, p) => a + p.dx / p.v, 0);
  return s / t;
}

/** v̄ für Zeit-Abschnitte (zeitgewichtetes Mittel) */
export function avgByTime(parts) {
  const s = parts.reduce((a, p) => a + p.v * p.dt, 0), t = parts.reduce((a, p) => a + p.dt, 0);
  return s / t;
}

/**
 * Fehlende Geschwindigkeit für einen Ziel-Schnitt. Rückgabe: Zahl oder Infinity/negativ → unmöglich.
 * mode 'distance' | 'time'
 */
export function missingSpeed(parts, target, mode) {
  const k = parts.findIndex((p) => p.v == null);
  if (k < 0) throw new Error('keine unbekannte Geschwindigkeit');
  if (mode === 'distance') {
    const S = parts.reduce((a, p) => a + p.dx, 0);
    const tKnown = parts.reduce((a, p, i) => a + (i === k ? 0 : p.dx / p.v), 0);
    const tLeft = S / target - tKnown; // so viel Zeit bleibt für den unbekannten Abschnitt
    return tLeft > 1e-12 ? parts[k].dx / tLeft : Infinity;
  }
  const T = parts.reduce((a, p) => a + p.dt, 0);
  const sKnown = parts.reduce((a, p, i) => a + (i === k ? 0 : p.v * p.dt), 0);
  return (target * T - sKnown) / parts[k].dt;
}

/** Zeiten (U) bzw. Strecken (V) der Abschnitte – für die Balken-Darstellung */
export function fillParts(parts, mode) {
  return parts.map((p) => (mode === 'distance' ? { ...p, dt: p.dx / p.v } : { ...p, dx: p.v * p.dt }));
}

/** Einheiten nach SI */
export const SI = { m: 1, km: 1000, s: 1, min: 60, h: 3600, 'm/s': 1, 'km/h': 1 / 3.6 };
