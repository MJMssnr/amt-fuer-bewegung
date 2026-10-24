// Endlos-Generator für U (Schnitt nach Strecken) [W48]. Kein DOM, kein Szenario (U rechnet nur mit Abschnitten).
// Stufen: leicht = 2 Abschnitte in m, s, m/s · mittel = 3 Abschnitte in km, min, km/h · schwer = fehlende Geschwindigkeit
// für einen Ziel-Schnitt, manchmal unmöglich („🚫 Geht nicht“ + Begründungsfrage).

import { int, pick, chance } from './motion.js';

const RIDERS = [
  { sprite: 'cyclist', who: 'Kevin', pr: 'er' },
  { sprite: 'bus', who: 'Ötzi', pr: 'er' },
  { sprite: 'car_red', who: 'Frau Brösel', pr: 'sie' },
];

export function genAvgDist(level, r) {
  const R = pick(r, RIDERS);
  if (level === 'leicht') {
    const d1 = pick(r, [100, 150, 200, 300, 400, 500, 600]), d2 = chance(r, 0.5) ? d1 : pick(r, [100, 200, 300, 400]);
    const v1 = int(r, 2, 5), v2 = int(r, v1 + 2, 12);
    return { scenario: null, task: { type: 'avgdist', sprite: R.sprite === 'bus' ? 'cyclist' : R.sprite,
      units: { dist: 'm', time: 's', speed: 'm/s' },
      parts: [{ label: 'Bergauf', dx: d1, v: v1, hill: 1 }, { label: 'Bergab', dx: d2, v: v2, hill: -1 }],
      prompt: `Wie groß ist die Durchschnittsgeschwindigkeit auf der ganzen Strecke?`,
      paper: 'Erst für jeden Abschnitt die Zeit: Δt = Δx / v. Dann v̄ = Gesamtstrecke / Gesamtzeit – NICHT den Mittelwert der Geschwindigkeiten.',
      help: 'Zeiten der Abschnitte addieren, dann Gesamtstrecke durch Gesamtzeit.' } };
  }
  if (level === 'mittel') {
    const R2 = pick(r, RIDERS.slice(1)); // Autobahn nur mit Bus oder Auto
    const names = ['Stadt', 'Landstraße', 'Autobahn'];
    const vs = [pick(r, [20, 24, 30, 36, 40]), pick(r, [50, 60, 70, 80]), pick(r, [90, 100, 110, 120])];
    const ds = [int(r, 2, 8), int(r, 4, 15), int(r, 5, 30)];
    if (chance(r, 0.5)) { names.reverse(); vs.reverse(); ds.reverse(); }
    return { scenario: null, task: { type: 'avgdist', sprite: R2.sprite, units: { dist: 'km', time: 'min', speed: 'km/h' },
      parts: names.map((label, i) => ({ label, dx: ds[i], v: vs[i] })),
      prompt: `${R2.who} fährt drei Abschnitte. Wie groß ist die Durchschnittsgeschwindigkeit insgesamt?`,
      paper: 'Zeit je Abschnitt in h: Δt = Δx / v (mal 60 ergibt min). v̄ = Gesamtstrecke / Gesamtzeit in km/h.',
      help: 'Rechne die Zeiten in Stunden, nicht in Minuten, wenn du km/h willst – oder rechne am Ende um.' } };
  }
  // schwer: fehlende Geschwindigkeit, gleich lange Strecken (der Klassiker), manchmal unmöglich
  const bike = R.sprite === 'cyclist', d = bike ? int(r, 3, 12) : int(r, 4, 30), v1 = pick(r, bike ? [12, 15, 16, 18, 20] : [20, 24, 30, 40, 45, 50, 60]);
  const impossible = chance(r, 0.3);
  let target = impossible ? v1 * pick(r, [2, 2.5, 3]) : Math.round(v1 * pick(r, [1.2, 1.25, 1.3, 1.4]));
  if (!impossible && 1 / (2 / target - 1 / v1) > (bike ? 40 : 150)) target = Math.round(v1 * 1.2); // Rückweg höchstens ~150 km/h
  const why = {
    question: 'Warum ist das unmöglich?',
    choices: [
      { text: `Für ${2 * d} km mit ${target} km/h ist die ganze Zeit schon auf dem ersten Abschnitt verbraucht – für den Rest bleibt keine Sekunde.`, correct: true },
      { text: 'Weil der Mittelwert der beiden Geschwindigkeiten den Ziel-Schnitt nie erreichen kann.', feedback: 'Doch, der Mittelwert ginge schon. Aber der Schnitt ist Gesamtstrecke durch Gesamtzeit – und die Zeit ist schon um.' },
      { text: 'Weil man dafür schneller fahren müsste, als erlaubt ist.', feedback: 'Es klappt mit KEINER Geschwindigkeit, auch nicht unendlich schnell. Wie viel Zeit bleibt übrig?' },
      { text: 'Weil die zweite Strecke zu kurz ist.', feedback: 'Die Strecken sind gleich lang. Entscheidend ist die Zeit, die noch übrig bleibt.' },
    ],
  };
  return { scenario: null, task: { type: 'avgdist', sprite: R.sprite, units: { dist: 'km', time: 'min', speed: 'km/h' },
    parts: [{ label: 'Hinweg', dx: d, v: v1 }, { label: 'Rückweg', dx: d, v: null }], target, allowImpossible: true, ...(impossible ? { why } : {}),
    prompt: `${R.who} fährt ${d} km hin mit ${v1} km/h. Wie schnell muss ${R.pr} zurückfahren, damit der Schnitt ${target} km/h beträgt? (Oder geht das gar nicht?)`,
    paper: `Wie lange darf die ganze Fahrt (${2 * d} km) bei ${target} km/h dauern? Wie lange hat der Hinweg schon gedauert? Was bleibt übrig?`,
    hints: impossible ? [] : [{ value: 2 * target - v1, text: `Das ist die Mittelwert-Rechnung (${v1} + v) / 2 = ${target}. Aber bei gleichen Strecken ist man auf dem langsamen Weg LÄNGER unterwegs – rechne mit den Zeiten!` }],
    help: 'Gesamtzeit = Gesamtstrecke / Ziel-Schnitt. Minus die Zeit für den Hinweg = Zeit für den Rückweg. v = Strecke / diese Zeit.' } };
}
