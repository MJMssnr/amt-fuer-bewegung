// Bausteine für den Endlos-Generator [W47]. Kein DOM.
// Zufall mit Seed (reproduzierbar), „schöne“ Zahlen für alles, was man ablesen oder einzeichnen muss.

/** mulberry32: kleiner, schneller Zufallsgenerator mit Seed → Funktion r() ∈ [0, 1) */
export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
export const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
export const chance = (r, p) => r() < p;

/** Figuren für das Training (langsam genug für Meter-Skalen bis ~8 m/s) */
export const ACTORS = [
  { id: 'kevin', name: 'Kevin', sprite: 'kevin' },
  { id: 'jo', name: 'Jo', sprite: 'jo' },
  { id: 'dog', name: 'Brezel', sprite: 'dog' },
  { id: 'cart', name: 'Einkaufswagen', sprite: 'cart' },
];

/**
 * Geschwindigkeitsverlauf aus Eckpunkten → Szenario.
 * knots: [{ dt, v0, v1 }] je Abschnitt (v0 = Wert am Anfang, v1 = am Ende; gleich → gleichförmig).
 * Sprünge zwischen Abschnitten sind erlaubt (wie in den Story-Aufträgen, z. B. Anhalten → Zurück).
 */
export function scenarioFrom(knots, { actor, x0 = 0, title = 'Training' }) {
  const segments = knots.map((k, i) => {
    const prevEnd = i ? knots[i - 1].v1 : 0;
    if (k.v0 === k.v1) return { dt: k.dt, v: k.v0 };
    if (Math.abs(k.v0 - prevEnd) > 1e-9) return { dt: k.dt, v0: k.v0, a: (k.v1 - k.v0) / k.dt };
    return { dt: k.dt, a: (k.v1 - k.v0) / k.dt };
  });
  return { id: 'training', title, actors: [{ id: actor.id, name: actor.name, sprite: actor.sprite, x0, segments }] };
}

/** Δx und Weg aus den Eckpunkten (Kontrolle für Tests; die Aufgaben rechnen selbst mit der Engine) */
export function areaOf(knots) {
  let dx = 0, path = 0;
  for (const { dt, v0, v1 } of knots) {
    dx += ((v0 + v1) / 2) * dt;
    if (v0 * v1 >= 0) path += (Math.abs(v0 + v1) / 2) * dt;
    else { const tc = (v0 / (v0 - v1)) * dt; path += (Math.abs(v0) * tc + Math.abs(v1) * (dt - tc)) / 2; }
  }
  return { dx, path };
}
