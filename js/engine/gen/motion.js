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

export const C = (dt, v) => ({ dt, v0: v, v1: v });  // gleichförmig
export const R = (dt, v0, v1) => ({ dt, v0, v1 });    // gleichmäßig beschleunigt

/** Figuren für das Training (langsam genug für Meter-Skalen bis ~8 m/s) */
export const ACTORS = [
  { id: 'kevin', name: 'Kevin', sprite: 'kevin', dat: 'Kevin' },
  { id: 'jo', name: 'Jo', sprite: 'jo', dat: 'Jo' },
  { id: 'dog', name: 'Brezel', sprite: 'dog', dat: 'Brezel' },
  { id: 'cart', name: 'Einkaufswagen', sprite: 'cart', dat: 'dem Einkaufswagen' },
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

/** Rampe von v0 nach v1 mit „schöner“ Beschleunigung (0,5 / 1 / 2 m/s²) und ganzer Dauer [W49] */
export function ramp(r, v0, v1) {
  const dv = Math.abs(v1 - v0);
  const ok = [0.5, 1, 2].filter((a) => Number.isInteger(dv / a) && dv / a >= 1 && dv / a <= 6);
  return R(ok.length ? dv / pick(r, ok) : dv, v0, v1);
}

/**
 * Zufällige Bewegung aus 2–3 Abschnitten [W49], Eckpunkte auf ganzen Sekunden und ganzen m/s, aₓ ∈ {0,5; 1; 2}.
 * leicht: nur vₓ ≥ 0, 2 Abschnitte · mittel: 3 Abschnitte, gleichförmig und beschleunigt gemischt · schwer: mit Richtungswechsel
 */
export function randomKnots(level, r) {
  const v = () => int(r, 1, 5), d = () => int(r, 2, 4), Rp = (a, b) => ramp(r, a, b);
  if (level === 'leicht') {
    const a = v(), b = v();
    return pick(r, [
      () => [Rp(0, a), C(d(), a)], () => [C(d(), a), Rp(a, 0)],
      () => [C(d(), a), C(d(), a === b ? (b % 5) + 1 : b)], () => [C(d(), a), C(d(), 0)],
    ])();
  }
  if (level === 'mittel') {
    const a = int(r, 2, 5), b = int(r, 1, a - 1);
    return pick(r, [
      () => [Rp(0, a), C(d(), a), Rp(a, 0)], () => [C(d(), b), Rp(b, a), C(d(), a)],
      () => [Rp(0, a), C(d(), a), Rp(a, b)], () => [C(d(), a), Rp(a, 0), C(d(), 0)],
    ])();
  }
  const a = int(r, 2, 4), b = int(r, 1, 3);
  return pick(r, [
    () => [C(d(), a), Rp(a, -b), C(d(), -b)], // Wende
    () => [C(d(), a), C(d(), 0), C(d(), -b)],
    () => [Rp(0, a), Rp(a, -b)],
    () => [C(d(), -a), Rp(-a, b), C(d(), b)],
  ])();
}
