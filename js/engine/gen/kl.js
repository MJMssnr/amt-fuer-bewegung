// Endlos-Generator für K (Flächen-Puzzle) und L (Steigungsdreieck) [W47]. Kein DOM.
// Stufen (ENTSCHEIDUNGEN § 6):
//   K leicht = 2 Abschnitte, nur positiv · mittel = 3 Abschnitte mit Dreieck/Trapez, ggf. Startort ≠ 0 · schwer = Vorzeichenwechsel, Weg vs. Δx
//   L leicht = gleichförmig, steigend · mittel = fallende Gerade zwischen anderen · schwer = t-vₓ, Dreieck auch durch vₓ = 0
// Alle Eckpunkte liegen auf ganzen Sekunden und ganzen bzw. halben m/s (gut ablesbar).

import { int, pick, chance, ACTORS, scenarioFrom } from './motion.js';

const C = (dt, v) => ({ dt, v0: v, v1: v });        // gleichförmig
const R = (dt, v0, v1) => ({ dt, v0, v1 });          // gleichmäßig beschleunigt

// ---------- K: Flächen-Puzzle ----------
export function genArea(level, r) {
  const actor = pick(r, ACTORS);
  let knots, ask = ['pieces', 'dx'], x0 = 0, paper;
  if (level === 'leicht') {
    const v = int(r, 2, 6);
    knots = chance(r, 0.5)
      ? [R(int(r, 2, 4), 0, v), C(int(r, 2, 5), v)]            // anfahren, dann gleichförmig
      : [C(int(r, 2, 5), v), R(int(r, 2, 4), v, 0)];           // gleichförmig, dann bremsen
    paper = 'Rechteck: A = Δt · vₓ. Dreieck: A = ½ · Δt · Δvₓ. Grundseite und Höhe an den Kästchen ablesen.';
  } else if (level === 'mittel') {
    const v1 = int(r, 2, 6), v2 = chance(r, 0.5) ? 0 : int(r, 1, v1 - 1 || 1);
    knots = [R(int(r, 2, 4), 0, v1), C(int(r, 2, 4), v1), R(int(r, 2, 3), v1, v2)];
    if (v2 > 0) knots.push(C(int(r, 1, 3), v2));
    if (chance(r, 0.5)) { x0 = int(r, 2, 15); ask = ['pieces', 'dx', 'xend']; }
    paper = 'Ein Trapez kannst du in Rechteck + Dreieck zerlegen. Δx = Summe aller Teilflächen.' + (x0 ? ' Danach: x = x₀ + Δx (x₀ im Datenblatt).' : '');
  } else {
    const v1 = int(r, 2, 5), v2 = int(r, 1, 4);
    if (chance(r, 0.5)) {
      const a = pick(r, [1, 2]);                                // Wende: Nulldurchgang auf ganzer Sekunde
      const v1n = Math.ceil(v1 / a) * a, v2n = Math.ceil(v2 / a) * a;
      knots = [C(int(r, 1, 3), v1n), R((v1n + v2n) / a, v1n, -v2n), C(int(r, 1, 3), -v2n)];
    } else {
      knots = [C(int(r, 2, 4), v1), C(int(r, 1, 3), 0), C(int(r, 2, 4), -v2)]; // hin, stehen, zurück
      if (chance(r, 0.5)) knots[2] = R(int(r, 2, 3), 0, -v2), knots.push(C(int(r, 1, 2), -v2));
    }
    ask = ['pieces', 'dx', 'path'];
    paper = 'Flächen über der t-Achse zählen für Δx positiv, darunter negativ. Für den Weg s zählt jede Fläche positiv.';
  }
  const scenario = scenarioFrom(knots, { actor, x0 });
  const tEnd = knots.reduce((s, k) => s + k.dt, 0);
  return {
    scenario,
    task: { type: 'area', actor: actor.id, given: x0 ? ['anim', 'data'] : ['anim'], graph: 'vt', from: 0, to: tEnd, ask, paper,
      prompt: `Zerlege die Fläche unter dem t-vₓ-Diagramm von ${actor.dat} und berechne Δx${ask.includes('path') ? ' und den Weg' : ''}${ask.includes('xend') ? ' und den Endort' : ''}.` },
  };
}

// ---------- L: Steigungsdreieck ----------
// Stufen [W49]: leicht = Gerade im t-x-Diagramm (steigend oder fallend) · mittel = Dreieck im t-vₓ-Diagramm oder
// Sekante an gekrümmtem t-x-Stück · schwer = Tangente an gekrümmtes t-x-Stück (Momentangeschwindigkeit)
export function genSlope(level, r) {
  const actor = pick(r, ACTORS);
  const variant = level === 'leicht' ? pick(r, ['rise', 'fall']) : level === 'mittel' ? pick(r, ['vt', 'secant']) : 'tangent';
  let knots, graph = 'xt', segment = 0, paper, extra = {};
  if (variant === 'rise') {
    knots = [C(int(r, 4, 8), pick(r, [1, 1.5, 2, 2.5, 3, 4, 5]))];
    if (chance(r, 0.5)) knots.push(C(int(r, 2, 3), 0));
    paper = 'Wähle zwei Punkte, an denen die Gerade genau durch Kästchenecken geht – möglichst weit auseinander. vₓ = Δx / Δt.';
  } else if (variant === 'fall') {
    const v1 = int(r, 1, 4), v2 = -pick(r, [1, 1.5, 2, 2.5, 3]);
    knots = [C(int(r, 2, 4), v1), C(int(r, 3, 5), v2), C(int(r, 2, 3), pick(r, [0, 1, 2]))];
    segment = 1;
    paper = 'Δx ist Endwert minus Anfangswert. Fällt die Gerade, ist Δx negativ – und damit auch vₓ = Δx / Δt.';
  } else if (variant === 'vt') {
    graph = 'vt';
    const a = pick(r, [0.5, 1, 1.5, 2, 2.5, 3]);
    if (chance(r, 0.5)) { // bremsen bis zum Stillstand oder langsamer werden
      const v0 = a * int(r, 2, Math.max(2, Math.floor(8 / a))), dt = int(r, 2, 4), v1 = Math.max(0, v0 - a * dt);
      knots = [C(int(r, 2, 3), v0), R(dt, v0, v1), C(int(r, 1, 3), v1)];
    } else { // durch vₓ = 0 hindurch (Wende)
      const m = Math.max(1, Math.min(3, Math.floor(6 / a))), n1 = int(r, 1, m), n2 = int(r, 1, m);
      knots = [C(int(r, 1, 3), a * n1), R(n1 + n2, a * n1, -a * n2), C(int(r, 1, 2), -a * n2)];
    }
    segment = 1;
    paper = 'Steigung im t-vₓ-Diagramm ist aₓ = Δvₓ / Δt. Nimmt vₓ ab, ist Δvₓ negativ. Das Dreieck darf über die t-Achse hinweg reichen.';
  } else { // gekrümmtes t-x-Stück: Sekante (mittel) oder Tangente (schwer)
    const a = pick(r, [0.5, 1, 1.5, 2]);
    const kind = pick(r, ['anfahren', 'bremsen', 'knick']);
    let T;
    if (kind === 'anfahren') { const v0 = pick(r, [0, 0, 1, 2]), nMax = Math.min(8, Math.floor((8 - v0) / a)); T = int(r, Math.min(4, nMax), nMax); knots = [R(T, v0, v0 + a * T)]; }
    else if (kind === 'bremsen') { T = int(r, 4, Math.min(8, Math.floor(8 / a))); knots = [R(T, a * T, 0), C(int(r, 1, 2), 0)]; }
    else { T = int(r, 3, Math.min(6, Math.floor(8 / a))); knots = [R(T, 0, a * T), C(int(r, 2, 4), a * T)]; }
    const tEnd = knots.reduce((x, k) => x + k.dt, 0);
    if (variant === 'secant') {
      const t1 = int(r, 0, Math.min(tEnd - 3, T - 1)), t2 = int(r, t1 + 2, tEnd); // Sekante beginnt im gekrümmten Teil
      extra = { secant: [t1, t2] };
      paper = 'Mittlere Geschwindigkeit = Steigung der Sekante: v̄ₓ = Δx / Δt zwischen den beiden markierten Zeitpunkten. Die Kurve ist gebogen – lies so genau wie möglich ab.';
    } else {
      extra = { tangent: int(r, 1, T - 1) }; // Berührpunkt im gekrümmten Teil, nicht am Rand
      paper = 'Die Tangente berührt die Kurve in P und hat dort dieselbe Steigung. Leg sie möglichst lang an, dann ein großes Steigungsdreieck: vₓ = Δx / Δt. Kleine Abweichungen sind beim Tangentenlegen normal.';
    }
  }
  const scenario = scenarioFrom(knots, { actor });
  const prompt = extra.secant ? `Bestimme die mittlere Geschwindigkeit von ${actor.dat} zwischen t = ${extra.secant[0]} s und t = ${extra.secant[1]} s.`
    : extra.tangent != null ? `Wie schnell ist ${actor.dat === 'dem Einkaufswagen' ? 'der Einkaufswagen' : actor.dat} genau bei t = ${extra.tangent} s? Leg eine Tangente an und bestimme die Momentangeschwindigkeit.`
    : `Lege im markierten Abschnitt ein Steigungsdreieck an und bestimme ${graph === 'xt' ? 'die Geschwindigkeit vₓ' : 'die Beschleunigung aₓ'} von ${actor.dat}.`;
  return { scenario, task: { type: 'slope', actor: actor.id, given: ['anim'], graph, segment, paper, prompt, ...extra } };
}
