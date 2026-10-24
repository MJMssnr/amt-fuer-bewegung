// Endlos-Generator für A (Zuordnen), E (Fehlerjagd), R (Verbinden), V (Schnitt nach Zeiten) [W49]. Kein DOM.
// Bewegungen aus js/engine/gen/motion.js → randomKnots (Eckpunkte gut ablesbar).

import { int, pick, chance, ACTORS, scenarioFrom, randomKnots, C, R } from './motion.js';

const TITLE = { xt: 't-x-Diagramm', vt: 't-vₓ-Diagramm', at: 't-aₓ-Diagramm' };

// ---------- A: Zuordnen ----------
export function genMatch(level, r) {
  const actor = pick(r, ACTORS);
  const knots = randomKnots(level, r);
  const [given, ask] = level === 'leicht' ? pick(r, [['xt', 'vt'], ['vt', 'xt']])
    : level === 'mittel' ? pick(r, [['xt', 'vt'], ['vt', 'xt'], ['vt', 'at']])
      : pick(r, [['vt', 'xt'], ['xt', 'vt'], ['xt', 'at'], ['vt', 'at']]);
  const paper = {
    vt: 'Steigung im t-x-Diagramm = vₓ. Gerade → konstantes vₓ, Kurve → vₓ ändert sich. Fallend → vₓ negativ.',
    xt: 'vₓ > 0: x steigt. vₓ = 0: waagrecht. vₓ < 0: x fällt. Ändert sich vₓ gleichmäßig, wird x zur Parabel.',
    at: 'Steigung im t-vₓ-Diagramm = aₓ. Waagrecht → aₓ = 0. Auch am Umkehrpunkt ändert sich aₓ nicht!',
  }[ask];
  return { scenario: scenarioFrom(knots, { actor }), task: { type: 'match', actor: actor.id, given: ['anim', given], ask, paper,
    prompt: `Hier ist das ${TITLE[given]} von ${actor.dat}. Welches ${TITLE[ask]} passt dazu?` } };
}

// ---------- E: Fehlerjagd ----------
export function genErrorhunt(level, r) {
  const actor = pick(r, ACTORS);
  for (let tries = 0; ; tries++) {
    const knots = randomKnots(level === 'leicht' ? 'leicht' : level === 'mittel' ? 'mittel' : 'schwer', r);
    let graph, error, explain, paper;
    if (level === 'leicht') { // Vorzeichenfehler in einem gleichförmigen Abschnitt (t-x)
      const idx = knots.map((k, i) => (k.v0 === k.v1 && k.v0 !== 0 ? i : -1)).filter((i) => i >= 0);
      if (!idx.length) continue;
      graph = 'xt'; error = { segment: pick(r, idx), kind: 'sign' };
      paper = 'Berechne für jeden Abschnitt Δx = vₓ · Δt aus dem Datenblatt und prüfe, ob das Diagramm dazu passt.';
      explain = 'In diesem Abschnitt geht Ralfs Diagramm in die falsche Richtung: Vorzeichen von vₓ verdreht.';
    } else if (level === 'mittel') { // Zahlenwert falsch (halb oder doppelt) im t-vₓ-Diagramm
      graph = 'vt';
      const i = int(r, 0, knots.length - 1), k = knots[i];
      if (k.v0 === 0 && k.v1 === 0) continue;
      error = { segment: i, kind: 'value', factor: pick(r, [0.5, 2]) };
      paper = 'Vergleiche jeden Abschnitt mit dem Datenblatt: Stimmen vₓ bzw. die Steigung aₓ = Δvₓ / Δt?';
      explain = 'In diesem Abschnitt stimmt der Zahlenwert nicht: Ralf hat die Geschwindigkeit bzw. die Steigung falsch übertragen.';
    } else { // Form falsch: Gerade statt Parabel im t-x-Diagramm
      const idx = knots.map((k, i) => (k.v0 !== k.v1 ? i : -1)).filter((i) => i >= 0);
      if (!idx.length) continue;
      graph = 'xt'; error = { segment: pick(r, idx), kind: 'shape' };
      paper = 'Prüfe in jedem Abschnitt die Form: aₓ = 0 → Gerade, aₓ > 0 → Linkskurve ⌣, aₓ < 0 → Rechtskurve ⌢.';
      explain = 'Hier ist eine Gerade gezeichnet, aber die Bewegung ist beschleunigt: Im t-x-Diagramm muss das eine Parabel sein.';
    }
    if (tries > 20) throw new Error('Fehlerjagd: keine passende Bewegung gefunden');
    return { scenario: scenarioFrom(knots, { actor }), task: { type: 'errorhunt', actor: actor.id, given: ['anim', 'data'], graph, error, paper, explain,
      prompt: `Praktikant Ralf hat das ${TITLE[graph]} von ${actor.dat} gezeichnet – ein Abschnitt ist falsch. Tippe ihn an!` } };
  }
}

// ---------- R: Verbinden ----------
export function genPairs(level, r) {
  const items = [];
  const sig = (k) => k.map((x) => `${x.dt}:${x.v0}:${x.v1}`).join('|');
  const seen = new Set();
  let guard = 0;
  while (items.length < 3 && guard++ < 200) {
    let knots;
    if (level === 'leicht') { // drei Geraden: steil, flach, fallend, stehen …
      knots = [C(6, pick(r, [-3, -2, -1, 0, 1, 2, 3, 4]))];
    } else knots = randomKnots(level === 'mittel' ? 'mittel' : 'schwer', r);
    if (knots.reduce((s, k) => s + k.dt, 0) > 12) continue;
    const key = sig(knots);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(knots);
  }
  // alle gleich lang (gleiche t-Achse): mit der letzten Geschwindigkeit gleichförmig weiter
  const Tmax = Math.max(6, ...items.map((k) => k.reduce((s, x) => s + x.dt, 0)));
  const padded = items.map((k) => { const T = k.reduce((s, x) => s + x.dt, 0), last = k[k.length - 1];
    return T < Tmax ? [...k, C(Tmax - T, last.v1)] : k; });
  const [left, right] = level === 'mittel' && chance(r, 0.3) ? ['vt', 'at'] : ['xt', 'vt'];
  return { scenario: null, task: { type: 'pairs', left, right, items: padded.map((k) => ({ x0: 0, segments: scenarioFrom(k, { actor: ACTORS[0] }).actors[0].segments })),
    prompt: `Verbinde jedes ${TITLE[left]} (links) mit dem passenden ${TITLE[right]} (rechts).`,
    help: left === 'xt' ? 'Steigung im t-x-Diagramm = vₓ. Waagrecht → vₓ = 0, fallend → vₓ negativ, Kurve → vₓ ändert sich.' : 'Steigung im t-vₓ-Diagramm = aₓ. Waagrecht → aₓ = 0.',
    paper: level === 'schwer' ? 'Achte auf Umkehrpunkte: Wo ist die t-x-Kurve waagrecht? Dort ist vₓ = 0.' : 'Vergleiche zuerst die Vorzeichen, dann die Größe der Steigung.' } };
}

// ---------- V: Schnitt nach Zeiten ----------
export function genAvgTime(level, r) {
  const who = pick(r, [{ sprite: 'skater', name: 'Jo' }, { sprite: 'cyclist', name: 'Kevin' }, { sprite: 'postbote', name: 'Paul' }]);
  if (level === 'leicht') {
    const t1 = pick(r, [20, 30, 40, 60]), t2 = pick(r, [20, 30, 40, 60, 90]), v1 = int(r, 4, 9), v2 = int(r, 1, v1 - 2);
    return { scenario: null, task: { type: 'avgtime', sprite: who.sprite, units: { dist: 'm', time: 's', speed: 'm/s' },
      parts: [{ label: 'Schnell', dt: t1, v: v1 }, { label: 'Langsam', dt: t2, v: v2 }],
      prompt: `Wie groß ist die Durchschnittsgeschwindigkeit von ${who.name} insgesamt?`,
      paper: 'Strecke je Abschnitt: Δx = v · Δt. Dann v̄ = Gesamtstrecke / Gesamtzeit. Nur bei GLEICH langen Zeiten ist das der Mittelwert.',
      hints: t1 === t2 ? [] : [{ value: (v1 + v2) / 2, text: 'Das ist der einfache Mittelwert. Hier sind die Zeiten aber verschieden lang – der längere Abschnitt zählt mehr.' }],
      help: 'Strecken addieren, durch die Gesamtzeit teilen.' } };
  }
  if (level === 'mittel') {
    const parts = [['Stadt', pick(r, [10, 15, 20, 30]), pick(r, [24, 30, 36])], ['Landstraße', pick(r, [10, 20, 30, 40]), pick(r, [60, 70, 80])], ['Stau', pick(r, [5, 10, 15]), pick(r, [6, 10, 12])]]
      .map(([label, dt, v]) => ({ label, dt, v }));
    return { scenario: null, task: { type: 'avgtime', sprite: 'postbote', units: { dist: 'km', time: 'min', speed: 'km/h' }, parts,
      prompt: 'Paul fährt seine Runde in drei Abschnitten. Wie groß ist seine Durchschnittsgeschwindigkeit?',
      paper: 'Minuten in Stunden umrechnen (÷ 60), Strecken Δx = v · Δt berechnen, dann v̄ = Gesamtstrecke / Gesamtzeit.',
      hints: [{ value: parts.reduce((s, p) => s + p.v, 0) / 3, text: 'Mittelwert der Geschwindigkeiten? Die Abschnitte dauern verschieden lang – rechne mit den Strecken.' }],
      help: 'Gesamtstrecke in km durch Gesamtzeit in h.' } };
  }
  // schwer: fehlende Geschwindigkeit für einen Ziel-Schnitt, Zeiten teils in h, teils in min
  const t1h = pick(r, [0.5, 1, 1.5, 2]), t2min = pick(r, [20, 30, 40, 45]), v1 = pick(r, [30, 40, 50, 60, 80]);
  const vMissing = pick(r, [60, 75, 90, 100, 120]);
  const T = t1h + t2min / 60, target = Math.round(((v1 * t1h + vMissing * t2min / 60) / T) * 10) / 10;
  return { scenario: null, task: { type: 'avgtime', sprite: 'postbote', units: { dist: 'km', time: 'min', speed: 'km/h' },
    parts: [{ label: 'Landstraße', dt: t1h, tu: 'h', v: v1 }, { label: 'Autobahn', dt: t2min, v: null }], target,
    prompt: `Wie schnell muss Paul auf der Autobahn fahren, damit der Schnitt ${String(target).replace('.', ',')} km/h beträgt?`,
    paper: 'Achtung, Einheiten: einmal h, einmal min! Gesamtstrecke = Ziel-Schnitt · Gesamtzeit. Davon die bekannte Strecke abziehen, Rest durch die Restzeit.',
    hints: [{ value: 2 * target - v1, text: 'Mittelwert-Rechnung? Die beiden Abschnitte dauern verschieden lang.' }],
    help: 'Gesamtzeit in h, Gesamtstrecke = v̄ · t. Fehlende Strecke durch fehlende Zeit.' } };
}
