// Endlos-Generator für I (Konstrukteur), B (Freihand), F (Live-Steuerung), S (Unfallgutachten) [W49]. Kein DOM.
// Q (Formel) und W (Fluss, Rechenvariante) stehen in formulas.js.

import { int, pick, chance, ACTORS, scenarioFrom, randomKnots, C } from './motion.js';

// ---------- I: Konstrukteur ----------
// Nicht zu abgefahren (Wunsch Herr Messner): höchstens 3 Abschnitte, gegeben immer t-vₓ, gesucht t-x.
export function genConstruct(level, r) {
  const actor = pick(r, ACTORS);
  let knots;
  if (level === 'leicht') { // nur gleichförmige Abschnitte → nur Geraden, Werte = Δx = vₓ · Δt
    knots = [C(int(r, 2, 4), int(r, 1, 4)), C(int(r, 2, 4), pick(r, [0, 1, 2, 3])), ...(chance(r, 0.5) ? [C(int(r, 2, 3), int(r, 1, 4))] : [])];
  } else knots = randomKnots(level === 'mittel' ? 'mittel' : 'schwer', r);
  return { scenario: scenarioFrom(knots, { actor }), task: { type: 'construct', actor: actor.id, given: ['anim', 'vt'], ask: 'xt',
    paper: level === 'leicht' ? 'Δx in jedem Abschnitt = vₓ · Δt. Zum Ort davor addieren. Gleichförmig: immer eine Gerade.'
      : 'Δx in jedem Abschnitt = Fläche unter der t-vₓ-Kurve (Rechteck, Dreieck). Form: aₓ = 0 → Gerade, aₓ > 0 → Linkskurve ⌣, aₓ < 0 → Rechtskurve ⌢.',
    prompt: `Konstruiere das t-x-Diagramm von ${actor.dat}: Ort am Ende jedes Abschnitts und die Form dazwischen.` } };
}

// ---------- B: Freihand ----------
// Gesuchtes Diagramm aus Geraden (gleichförmige Abschnitte), damit die Auto-Begradigung fair prüft.
export function genFreehand(level, r) {
  const actor = pick(r, ACTORS);
  const v = (lo, hi) => int(r, lo, hi);
  let knots, given = ['anim', 'vt'], x0 = 0;
  if (level === 'leicht') knots = [C(int(r, 2, 4), v(1, 3)), C(int(r, 2, 4), pick(r, [0, 1, 2]))];
  else if (level === 'mittel') knots = [C(int(r, 2, 3), v(1, 3)), C(int(r, 1, 3), 0), C(int(r, 2, 3), -v(1, 3))];
  else { // nur Datenblatt, Startort ≠ 0, vier Abschnitte
    x0 = int(r, 2, 8); given = ['anim', 'data'];
    knots = [C(int(r, 2, 3), v(1, 3)), C(int(r, 1, 2), 0), C(int(r, 2, 3), -v(1, 4)), C(int(r, 1, 2), v(1, 2))];
  }
  return { scenario: scenarioFrom(knots, { actor, x0 }), task: { type: 'freehand', actor: actor.id, given, ask: 'xt',
    prompt: `Zeichne das t-x-Diagramm von ${actor.dat} in einem Zug von t = 0 s bis zum Ende. Die Linie wird automatisch begradigt.`,
    paper: 'Berechne zuerst die Ortswerte an den Knickstellen: Δx = vₓ · Δt je Abschnitt – erst dann zeichnen. Eine Fingerbreite daneben zählt noch als richtig.' } };
}

// ---------- F: Live-Steuerung ----------
export function genLive(level, r) {
  const actor = pick(r, ACTORS);
  let knots;
  if (level === 'leicht') knots = [C(int(r, 3, 5), int(r, 1, 3)), C(int(r, 2, 4), pick(r, [0, 2, 3, 4]))];
  else knots = [C(int(r, 3, 4), int(r, 1, 3)), C(int(r, 2, 3), 0), C(int(r, 3, 4), -int(r, 1, 3))];
  const vmax = Math.max(...knots.map((k) => Math.abs(k.v0))) + 2;
  return { scenario: scenarioFrom(knots, { actor }), task: { type: 'live', actor: actor.id, player: 'florian', vmax,
    ghost: level === 'leicht', points: level === 'schwer',
    prompt: level === 'leicht' ? `Lauf ${actor.dat} genau nach – das Vorbild läuft blass mit.`
      : level === 'mittel' ? 'Fahre genau nach Plan. Diesmal ohne Vorbild in der Animation – nur das Diagramm zählt.'
        : 'Fahre genau nach Plan. Der Plan zeigt nur die Eckpunkte – die Geraden dazwischen denkst du dir.',
    paper: 'Lies für jeden Abschnitt Δx und Δt ab und berechne vₓ = Δx / Δt. Fällt die Kurve, ist vₓ negativ.' } };
}

// ---------- S: Unfallgutachten ----------
const A_SURF = { dry: 8, rain: 5, snow: 2 };
export function genSkid(level, r) {
  const weather = level === 'leicht' ? 'dry' : pick(r, ['dry', 'rain', 'snow']);
  const limit = pick(r, weather === 'snow' ? [30, 50] : [30, 50, 70]);
  const len = weather === 'snow' ? int(r, 6, 16) : int(r, 12, 40) / 2; // Spurlänge 6–20 m auf halbe Meter
  const s0 = int(r, 2, 6) / 2, s1 = s0 + len;
  const v1 = level === 'schwer' ? pick(r, [3, 4, 5, 6]) : 0;
  const a = A_SURF[weather], v0 = Math.sqrt(v1 * v1 + 2 * a * len);
  const hints = [{ value: v0, text: 'Das sind m/s. Gefragt ist km/h: mal 3,6.' },
    { value: Math.sqrt(a * len) * 3.6, text: 'Die 2 fehlt: v₀² = 2 · |a| · Δx.' },
    ...(v1 ? [{ value: Math.sqrt(2 * a * len) * 3.6, text: 'Die Restgeschwindigkeit beim Aufprall fehlt: v₀² = v₁² + 2 · |a| · Δx.' }] : [])];
  return { scenario: null, task: { type: 'skid', weather, limit, range: [0, Math.ceil(s1 + 3)], skid: [s0, s1], v1,
    ...(v1 ? { v1Text: `Laut Werkstatt beim Aufprall noch v₁ = ${v1},0 m/s` } : {}),
    prompt: `Erstelle das Gutachten: Wie schnell war das Auto vor dem Bremsen – und war das bei Tempo ${limit} zu schnell?`,
    paper: v1 ? 'v₁² − v₀² = 2 · a · Δx mit a < 0. Nach v₀ umstellen: v₀ = √(v₁² + 2 · |a| · Δx). Achtung: v₁ ist nicht null! Am Ende mal 3,6.'
      : 'Erst messen, dann den Straßenzustand am Bild erkennen. v₀ = √(2 · |a| · Δx), mal 3,6 für km/h, dann mit dem Tempolimit vergleichen.',
    hints, help: `v₀ = √(${v1 ? `(${v1},0 m/s)² + ` : ''}2 · ${a},0 m/s² · Δx), dann mal 3,6.` } };
}
