// Endlos-Generator für Q (Bewegungsformel umstellen + ausrechnen) und W (Fluss-Labor als Rechenvariante) [W49]. Kein DOM.
// Jede Vorlage: Formel, gesuchte Größe, Auswahl (richtig + typische Umstell-Fehler), Ausdruck zum Ausrechnen.
// Gegebene Werte mit 2 g.Z., Ergebnis darf krumm sein.

import { int, pick } from './motion.js';

const n = (x) => { const s = String(Math.round(x * 100) / 100).replace('.', ','); return Number.isInteger(x) && Math.abs(x) < 10 ? `${s},0` : s; };
const K = (name, sym, value, unit) => ({ name, sym, value, unit, text: `${n(value)} ${unit}` });
const CAR = { id: 'car', name: 'Auto', sprite: 'car_red' };
const scen = (segments) => ({ id: 'training', title: 'Training', actors: [{ ...CAR, x0: 0, segments }] });

const Q = {
  leicht: [
    (r) => { const a = pick(r, [1.5, 2.0, 2.5, 3.0, 4.0]), t = int(r, 4, 9);
      return { scenario: scen([{ dt: t, a }]), prompt: `Das Auto beschleunigt aus dem Stand mit ${n(a)} m/s². Wie lange dauert es, bis es ${n(a * t)} m/s schnell ist?`,
        formula: 'v = a · t', solveFor: 't', known: [K('a', 'a', a, 'm/s²'), K('v', 'v', a * t, 'm/s')],
        choices: [{ text: 't = v / a', correct: true }, { text: 't = v · a', feedback: 'Malnehmen wäre falsch herum: Teile beide Seiten durch a.' }, { text: 't = a / v', feedback: 'Bruch verkehrt. Einheitenprobe: (m/s²)/(m/s) = 1/s, nicht s.' }, { text: 't = v − a', feedback: 'a steht als Faktor da, nicht als Summand – also teilen.' }],
        expr: 'v/a', label: 'Zeit', symbol: 't', unit: 's' }; },
    (r) => { const a = pick(r, [0.8, 1.2, 1.5, 2.5, 3.5]), t = int(r, 3, 10);
      return { scenario: scen([{ dt: t, a }]), prompt: `Das Auto ist nach ${n(t)} s aus dem Stand ${n(a * t)} m/s schnell. Wie groß ist seine Beschleunigung?`,
        formula: 'v = a · t', solveFor: 'a', known: [K('t', 't', t, 's'), K('v', 'v', a * t, 'm/s')],
        choices: [{ text: 'a = v / t', correct: true }, { text: 'a = v · t', feedback: 'Einheitenprobe: m/s · s = m – das ist keine Beschleunigung.' }, { text: 'a = t / v', feedback: 'Bruch verkehrt.' }, { text: 'a = v − t', feedback: 'Geschwindigkeit minus Zeit geht nicht – verschiedene Einheiten!' }],
        expr: 'v/t', label: 'Beschleunigung', symbol: 'a', unit: 'm/s²' }; },
    (r) => { const a = pick(r, [1.0, 1.5, 2.0, 3.0]), t = int(r, 4, 8), x = 0.5 * a * t * t;
      return { scenario: scen([{ dt: t, a }]), prompt: `Das Auto legt aus dem Stand in ${n(t)} s genau ${n(x)} m zurück. Wie groß ist die Beschleunigung?`,
        formula: 'x = ½ · a · t²', solveFor: 'a', known: [K('x', 'x', x, 'm'), K('t', 't', t, 's')],
        choices: [{ text: 'a = 2 · x / t²', correct: true }, { text: 'a = x / (2 · t²)', feedback: 'Das ½ falsch umgestellt: Beide Seiten mal 2 gibt 2 · x = a · t².' }, { text: 'a = 2 · x / t', feedback: 't steht im Quadrat – durch t² teilen.' }, { text: 'a = x / t²', feedback: 'Das ½ ist verschwunden. Erst mal 2!' }],
        expr: '2*x/(t*t)', label: 'Beschleunigung', symbol: 'a', unit: 'm/s²' }; },
  ],
  mittel: [
    (r) => { const a = pick(r, [1.5, 2.0, 2.5, 3.0, 4.0]), x = pick(r, [50, 80, 100, 120, 150, 200]);
      return { scenario: scen([{ until: { x }, a }]), prompt: `Wie lange braucht das Auto aus dem Stand für ${x} m bei ${n(a)} m/s²?`,
        formula: 'x = ½ · a · t²', solveFor: 't', known: [K('a', 'a', a, 'm/s²'), K('x', 'x', x, 'm')],
        choices: [{ text: 't = √(2 · x / a)', correct: true }, { text: 't = 2 · x / a', feedback: 'Die Wurzel fehlt: t steht im Quadrat.' }, { text: 't = √(x / (2 · a))', feedback: 'Das ½ falsch umgestellt: Beide Seiten mal 2 gibt 2 · x = a · t².' }, { text: 't = √(2 · a / x)', feedback: 'Bruch verkehrt. Einheitenprobe!' }],
        expr: 'sqrt(2*x/a)', label: 'Fahrzeit', symbol: 't', unit: 's', hints: [{ value: (2 * x) / a, text: 'Das ist t² in s². Zieh noch die Wurzel!' }] }; },
    (r) => { const a = pick(r, [1.5, 2.0, 2.5, 3.0]), x = pick(r, [40, 60, 80, 100, 150]);
      return { scenario: scen([{ until: { x }, a }]), prompt: `Wie schnell ist das Auto, wenn es aus dem Stand mit ${n(a)} m/s² genau ${x} m beschleunigt hat?`,
        formula: 'v² = 2 · a · x', solveFor: 'v', known: [K('a', 'a', a, 'm/s²'), K('x', 'x', x, 'm')],
        choices: [{ text: 'v = √(2 · a · x)', correct: true }, { text: 'v = 2 · a · x', feedback: 'Das ist v². Die Wurzel fehlt.' }, { text: 'v = √(a · x)', feedback: 'Die 2 gehört mit unter die Wurzel.' }, { text: 'v = 2 · a · √x', feedback: 'Die Wurzel gilt für das ganze Produkt 2 · a · x.' }],
        expr: 'sqrt(2*a*x)', label: 'Geschwindigkeit', symbol: 'v', unit: 'm/s', hints: [{ value: 2 * a * x, text: 'Das ist v². Zieh noch die Wurzel!' }] }; },
    (r) => { const v = pick(r, [10, 12, 14, 15, 16, 20]), a = pick(r, [4.0, 5.0, 6.0, 8.0]);
      return { scenario: scen([{ until: 'rest', v0: v, a: -a }]), prompt: `Das Auto bremst aus ${v} m/s mit ${n(a)} m/s² bis zum Stillstand. Wie lang ist der Bremsweg?`,
        formula: 'v² = 2 · a · x', solveFor: 'x', known: [K('v', 'v', v, 'm/s'), K('a', '|a|', a, 'm/s²')],
        choices: [{ text: 'x = v² / (2 · a)', correct: true }, { text: 'x = v / (2 · a)', feedback: 'v steht im Quadrat – das bleibt beim Umstellen so.' }, { text: 'x = 2 · a / v²', feedback: 'Bruch verkehrt. Einheitenprobe: Es muss m herauskommen.' }, { text: 'x = v² · 2 · a', feedback: 'Durch 2 · a teilen, nicht malnehmen.' }],
        expr: 'v*v/(2*a)', label: 'Bremsweg', symbol: 'x', unit: 'm', hints: [{ value: (v * v) / a, text: 'Die 2 im Nenner fehlt.' }] }; },
    (r) => { const v = pick(r, [12, 15, 18, 20, 25]), x = pick(r, [20, 25, 30, 40, 50]);
      return { scenario: scen([{ until: 'rest', v0: v, a: -(v * v) / (2 * x) }]), prompt: `Das Auto kommt aus ${v} m/s auf ${x} m zum Stehen. Wie groß ist die Bremsverzögerung?`,
        formula: 'v² = 2 · a · x', solveFor: 'a', known: [K('v', 'v', v, 'm/s'), K('x', 'x', x, 'm')],
        choices: [{ text: 'a = v² / (2 · x)', correct: true }, { text: 'a = v / (2 · x)', feedback: 'v steht im Quadrat.' }, { text: 'a = 2 · x / v²', feedback: 'Bruch verkehrt.' }, { text: 'a = v² / x', feedback: 'Die 2 fehlt im Nenner.' }],
        expr: 'v*v/(2*x)', label: 'Bremsverzögerung', symbol: '|a|', unit: 'm/s²' }; },
  ],
  schwer: [
    (r) => { const v0 = pick(r, [2, 3, 4, 5, 6]), t = int(r, 4, 8), a = pick(r, [0.5, 1.0, 1.5, 2.0]), x = v0 * t + 0.5 * a * t * t;
      return { scenario: scen([{ dt: t, v0, a }]), prompt: `Der Wagen fährt mit ${n(v0)} m/s los und legt in ${n(t)} s ${n(x)} m zurück. Wie groß ist die Beschleunigung?`,
        formula: 'x = v₀ · t + ½ · a · t²', solveFor: 'a', known: [K('x', 'x', x, 'm'), K('v', 'v₀', v0, 'm/s'), K('t', 't', t, 's')],
        choices: [{ text: 'a = 2 · (x − v₀ · t) / t²', correct: true }, { text: 'a = 2 · x / t² − v₀', feedback: 'v₀ · t muss VOR dem Teilen abgezogen werden.' }, { text: 'a = (x − v₀ · t) / t²', feedback: 'Das ½ ist verschwunden: erst mal 2.' }, { text: 'a = 2 · (x + v₀ · t) / t²', feedback: 'Vorzeichen: v₀ · t wird auf die andere Seite gebracht, also abgezogen.' }],
        expr: '2*(x-v*t)/(t*t)', label: 'Beschleunigung', symbol: 'a', unit: 'm/s²', hints: [{ value: (2 * x) / (t * t), text: 'Du hast den Anteil v₀ · t vergessen.' }] }; },
    (r) => { const v0 = pick(r, [14, 16, 18, 20, 25]), a = pick(r, [3.0, 4.0, 5.0]), x = pick(r, [10, 15, 20]);
      const v = Math.sqrt(v0 * v0 - 2 * a * x); if (!(v > 1)) return null;
      return { scenario: scen([{ until: { x }, v0, a: -a }]), prompt: `Das Auto prallt nach ${x} m Bremsweg (|a| = ${n(a)} m/s²) mit ${n(Math.round(v * 10) / 10)} m/s auf ein Hindernis. Wie schnell war es vorher?`,
        formula: 'v² = v₀² − 2 · |a| · x', solveFor: 'v₀', known: [K('v', 'v', Math.round(v * 10) / 10, 'm/s'), K('a', '|a|', a, 'm/s²'), K('x', 'x', x, 'm')],
        choices: [{ text: 'v₀ = √(v² + 2 · |a| · x)', correct: true }, { text: 'v₀ = v + √(2 · |a| · x)', feedback: 'Die Wurzel aus einer Summe ist nicht die Summe der Wurzeln.' }, { text: 'v₀ = √(v² − 2 · |a| · x)', feedback: 'Vorzeichen: 2 · |a| · x kommt beim Umstellen auf die andere Seite.' }, { text: 'v₀ = v² + 2 · |a| · x', feedback: 'Das ist v₀². Die Wurzel fehlt.' }],
        expr: 'sqrt(v*v+2*a*x)', label: 'Anfangsgeschwindigkeit', symbol: 'v₀', unit: 'm/s' }; },
    (r) => { const v0 = pick(r, [2, 3, 4, 5]), a = pick(r, [0.5, 1.0, 1.5, 2.0]), t = int(r, 3, 8), v = v0 + a * t;
      return { scenario: scen([{ dt: t, v0, a }]), prompt: `Das Auto wird von ${n(v0)} m/s auf ${n(v)} m/s schneller, mit ${n(a)} m/s². Wie lange dauert das?`,
        formula: 'v = v₀ + a · t', solveFor: 't', known: [K('v', 'v', v, 'm/s'), K('w', 'v₀', v0, 'm/s'), K('a', 'a', a, 'm/s²')],
        choices: [{ text: 't = (v − v₀) / a', correct: true }, { text: 't = v / a − v₀', feedback: 'Erst v₀ abziehen, dann durch a teilen.' }, { text: 't = (v + v₀) / a', feedback: 'v₀ wird beim Umstellen abgezogen.' }, { text: 't = a / (v − v₀)', feedback: 'Bruch verkehrt.' }],
        expr: '(v-w)/a', label: 'Dauer', symbol: 't', unit: 's', hints: [{ value: v / a, text: 'Die Anfangsgeschwindigkeit v₀ fehlt.' }] }; },
  ],
};

export function genFormula(level, r) {
  for (;;) {
    const q = pick(r, Q[level])(r);
    if (!q) continue;
    const { scenario, ...rest } = q;
    return { scenario, task: { type: 'formula', actor: 'car', given: ['anim'], paper: 'Erst die Formel auf dem Zettel umstellen, dann Zahlen mit Einheiten einsetzen.', ...rest } };
  }
}

// ---------- W: Fluss-Labor als Rechenvariante ----------
const W = {
  leicht: [
    (r) => { const L = pick(r, [40, 60, 80, 100]), vb = pick(r, [3, 4, 5, 6]), vf = pick(r, [0.5, 1.0, 1.5, 2.0]);
      return { prompt: `Hildes Floß fährt ${L} m flussauf. Wie lange dauert das?`, formula: 'L = (v_B − v_F) · t₁', solveFor: 't₁',
        known: [K('L', 'L', L, 'm'), K('b', 'v_B (Boot)', vb, 'm/s'), K('f', 'v_F (Fluss)', vf, 'm/s')],
        choices: [{ text: 't₁ = L / (v_B − v_F)', correct: true }, { text: 't₁ = L / (v_B + v_F)', feedback: 'Flussauf bremst die Strömung: Das Boot kommt nur mit v_B − v_F voran.' }, { text: 't₁ = L / v_B', feedback: 'Die Strömung fehlt.' }, { text: 't₁ = (v_B − v_F) / L', feedback: 'Bruch verkehrt.' }],
        expr: 'L/(b-f)', label: 'Zeit flussauf', symbol: 't₁', unit: 's', mode: { L, vb, vf, dir: 1 } }; },
    (r) => { const L = pick(r, [40, 60, 80, 100]), vb = pick(r, [3, 4, 5]), vf = pick(r, [0.5, 1.0, 1.5, 2.0]);
      return { prompt: `Wie lange braucht Hildes Floß für ${L} m flussab zurück zum Steg?`, formula: 'L = (v_B + v_F) · t₂', solveFor: 't₂',
        known: [K('L', 'L', L, 'm'), K('b', 'v_B (Boot)', vb, 'm/s'), K('f', 'v_F (Fluss)', vf, 'm/s')],
        choices: [{ text: 't₂ = L / (v_B + v_F)', correct: true }, { text: 't₂ = L / (v_B − v_F)', feedback: 'Flussab schiebt die Strömung mit: v_B + v_F.' }, { text: 't₂ = L / v_F', feedback: 'Das Boot fährt ja selbst auch.' }, { text: 't₂ = L · (v_B + v_F)', feedback: 'Einheitenprobe: m · m/s ist keine Zeit.' }],
        expr: 'L/(b+f)', label: 'Zeit flussab', symbol: 't₂', unit: 's', mode: { L, vb, vf, dir: -1 } }; },
  ],
  mittel: [
    (r) => { const L = pick(r, [50, 60, 80, 100]), vb = pick(r, [3, 4, 5, 6]), vf = pick(r, [0.5, 1.0, 1.5, 2.0]), t1 = Math.round((L / (vb - vf)) * 10) / 10;
      return { prompt: `Flussauf braucht das Floß für ${L} m genau ${n(t1)} s. Wie schnell strömt der Fluss?`, formula: 'L = (v_B − v_F) · t₁', solveFor: 'v_F',
        known: [K('L', 'L', L, 'm'), K('b', 'v_B (Boot)', vb, 'm/s'), K('t', 't₁', t1, 's')],
        choices: [{ text: 'v_F = v_B − L / t₁', correct: true }, { text: 'v_F = L / t₁ − v_B', feedback: 'Vorzeichen: Das ergäbe eine negative Strömung.' }, { text: 'v_F = v_B + L / t₁', feedback: 'Erst durch t₁ teilen, dann auf die andere Seite – mit Vorzeichenwechsel.' }, { text: 'v_F = L / (v_B · t₁)', feedback: 'Einheitenprobe: Das ist gar keine Geschwindigkeit.' }],
        expr: 'b-L/t', label: 'Strömung', symbol: 'v_F', unit: 'm/s', mode: { L, vb, vf, dir: 1 } }; },
    (r) => { const L = pick(r, [60, 80, 100, 120]), vb = pick(r, [3, 4, 5, 6]), vf = pick(r, [0.5, 1.0, 1.5]);
      return { prompt: `Wie lange dauert die ganze Fahrt: ${L} m flussauf und wieder zurück?`, formula: 'T = L / (v_B − v_F) + L / (v_B + v_F)', solveFor: 'T',
        known: [K('L', 'L', L, 'm'), K('b', 'v_B (Boot)', vb, 'm/s'), K('f', 'v_F (Fluss)', vf, 'm/s')],
        choices: [{ text: 'T = L / (v_B − v_F) + L / (v_B + v_F)', correct: true }, { text: 'T = 2 · L / v_B', feedback: 'Das gilt nur ohne Strömung. Die Strömung gleicht sich NICHT aus!' }, { text: 'T = 2 · L / (v_B − v_F)', feedback: 'Zurück geht es flussab – schneller.' }, { text: 'T = L / (v_B − v_F) − L / (v_B + v_F)', feedback: 'Die Zeiten werden addiert.' }],
        expr: 'L/(b-f)+L/(b+f)', label: 'Gesamtzeit', symbol: 'T', unit: 's', hints: [{ value: (2 * L) / vb, text: 'Das wäre die Zeit ohne Strömung. Mit Strömung dauert es LÄNGER.' }], mode: { L, vb, vf, dir: 1 } }; },
  ],
  schwer: [
    (r) => { const L = pick(r, [50, 60, 70, 80, 90, 100, 120]), vf = pick(r, [0.5, 0.8, 1.0, 1.2, 1.5, 2.0]), T = pick(r, [30, 40, 45, 50, 60, 75, 80]);
      const vb = (L + Math.sqrt(L * L + T * T * vf * vf)) / T; if (vb - vf < 0.5) return null;
      return { prompt: `Hilde will ${L} m flussauf und zurück in genau ${T} s schaffen. Wie schnell muss ihr Floß gegenüber dem Wasser sein?`,
        formula: 'T = 2 · L · v_B / (v_B² − v_F²)', solveFor: 'v_B',
        known: [K('L', 'L', L, 'm'), K('f', 'v_F (Fluss)', vf, 'm/s'), K('T', 'T', T, 's')],
        choices: [{ text: 'v_B = (L + √(L² + T² · v_F²)) / T', correct: true }, { text: 'v_B = 2 · L / T', feedback: 'Das wäre ohne Strömung richtig. Mit Strömung braucht es mehr.' }, { text: 'v_B = 2 · L / T + v_F', feedback: 'Plausibel geraten, aber nicht umgestellt: Es ist eine quadratische Gleichung in v_B.' }, { text: 'v_B = (L − √(L² + T² · v_F²)) / T', feedback: 'Das ist die negative Lösung der quadratischen Gleichung.' }],
        expr: '(L+sqrt(L*L+T*T*f*f))/T', label: 'Bootsgeschwindigkeit', symbol: 'v_B', unit: 'm/s', hints: [{ value: (2 * L) / T, text: 'Ohne Strömung würde das reichen – mit Strömung nicht.' }],
        paper: 'Mit v_B multiplizieren: T · v_B² − 2 · L · v_B − T · v_F² = 0. Mitternachtsformel, positive Lösung.', mode: { L, vb, vf, dir: 1 } }; },
    (r) => { const L = pick(r, [50, 60, 80, 100, 120]), vb = pick(r, [2.5, 3, 3.5, 4, 5, 6]), vf = pick(r, [0.5, 0.8, 1.0, 1.5, 2.0]);
      return { prompt: `Wie groß ist die Durchschnittsgeschwindigkeit für ${L} m flussauf und zurück?`, formula: 'v̄ = 2 · L / (L / (v_B − v_F) + L / (v_B + v_F))', solveFor: 'v̄',
        known: [K('b', 'v_B (Boot)', vb, 'm/s'), K('f', 'v_F (Fluss)', vf, 'm/s'), K('L', 'L', L, 'm')],
        choices: [{ text: 'v̄ = (v_B² − v_F²) / v_B', correct: true }, { text: 'v̄ = v_B', feedback: 'Die Strömung gleicht sich NICHT aus – flussauf bist du länger unterwegs.' }, { text: 'v̄ = ((v_B − v_F) + (v_B + v_F)) / 2', feedback: 'Mittelwert der Geschwindigkeiten – aber die Zeiten sind verschieden lang.' }, { text: 'v̄ = v_B − v_F', feedback: 'Das ist nur die Geschwindigkeit flussauf.' }],
        expr: '(b*b-f*f)/b', label: 'Durchschnitt', symbol: 'v̄', unit: 'm/s', hints: [{ value: vb, text: 'Das wäre ohne Strömung. Der Schnitt ist KLEINER.' }],
        paper: 'Kürzen: 2L / (L/(v_B − v_F) + L/(v_B + v_F)) – L kürzt sich heraus. Auf den Hauptnenner bringen!', mode: { L, vb, vf, dir: -1 } }; },
  ],
};

export function genRiverCalc(level, r) {
  for (;;) {
    const q = pick(r, W[level])(r);
    if (!q) continue;
    const { mode, ...rest } = q;
    return { scenario: null, task: { type: 'formula', picture: { kind: 'river', ...mode }, paper: 'Flussauf: v_B − v_F, flussab: v_B + v_F. Zeit = Strecke / Geschwindigkeit.', ...rest } };
  }
}
