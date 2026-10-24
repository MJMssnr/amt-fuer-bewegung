// Endlos-Generator für H (Berechnen) [W48]. Kein DOM.
// Stufen (ENTSCHEIDUNGEN § 6): leicht = eine Gleichung · mittel = zwei Abschnitte · schwer = Einholen/Begegnung.
// Gegebene Werte mit 2 g.Z. (Datenblatt), Ergebnisse dürfen krumm sein (runden gehört dazu).
// Folgefehler: Folgefragen rechnen mit dem Wert des Spielers weiter ("follows", js/tasks/questions.js).

import { int, pick, chance } from './motion.js';

const f1 = (v) => String(Math.round(v * 100) / 100).replace('.', ','); // für Hilfetexte
const CAR = { id: 'car', name: 'Auto', sprite: 'car_red', nom: 'Das Auto', pr: 'es' };
const BUS = { id: 'bus', name: 'Stadtbus', sprite: 'bus', nom: 'Der Stadtbus', pr: 'er' };
const BIKE = { id: 'kevin', name: 'Kevin', sprite: 'kevin', nom: 'Kevin', pr: 'er' };
const PAUL = { id: 'paul', name: 'Paul Paket', sprite: 'postbote' };
const actorDef = (a, x0, segments) => ({ id: a.id, name: a.name, sprite: a.sprite, x0, segments });

export function genCalc(level, r) {
  if (level === 'leicht') return chance(r, 0.5) ? startUp(r) : brake(r);
  if (level === 'mittel') return chance(r, 0.5) ? startCruise(r) : stopping(r);
  return pick(r, [meetHead, catchUp, catchUpLead])(r);
}

const task = (actors, prompt, paper, questions, given = ['anim', 'data']) => ({
  scenario: { id: 'training', title: 'Training', actors },
  task: { type: 'calc', given, prompt, paper, questions },
});

// ---------- leicht ----------
function startUp(r) { // Anfahren aus der Ruhe
  const A = pick(r, [CAR, BUS, BIKE]), a = pick(r, A === BIKE ? [0.5, 0.8, 1.2, 1.5] : [1.2, 1.5, 2.0, 2.5, 3.0]), T = pick(r, [4, 5, 6, 8, 10]);
  const v = a * T, s = 0.5 * a * T * T;
  return task([actorDef(A, 0, [{ dt: T, a }])],
    `${A.nom} fährt aus dem Stand an. Wie schnell ist ${A.pr} am Ende, und welchen Weg legt ${A.pr} dabei zurück?`,
    'Gleichmäßig beschleunigt aus der Ruhe: vₓ = aₓ · t und x = ½ · aₓ · t².',
    [
      { label: 'Endgeschwindigkeit', symbol: 'v_E', unit: 'm/s', goal: { type: 'valueAt', actor: A.id, q: 'vx', t: T },
        hints: [{ value: a * T * T, text: 'Das ist aₓ · t². Für die Geschwindigkeit gilt vₓ = aₓ · t.' }, { value: a / T, text: 'Malnehmen, nicht teilen: vₓ = aₓ · t.' }],
        help: `vₓ = ${f1(a)} m/s² · ${T} s.` },
      { label: 'Weg', symbol: 'Δx', unit: 'm', goal: { type: 'displacement', actor: A.id },
        follows: { vars: { v: 0 }, expr: `v*${T}/2` },
        hints: [{ value: a * T * T, text: 'Das ½ fehlt: x = ½ · aₓ · t².' }, { expr: `v*${T}`, text: 'So weit käme es nur mit konstanter Endgeschwindigkeit. Es wird aber erst schneller: Δx = ½ · vₓ · t.' }],
        help: `x = ½ · aₓ · t² = ½ · ${f1(a)} m/s² · (${T} s)². (Kontrolle: ${f1(s)} m = ½ · ${f1(v)} m/s · ${T} s.)` },
    ]);
}

function brake(r) { // Bremsen bis zum Stillstand
  const A = pick(r, [CAR, BUS]), v0 = pick(r, [8, 10, 12, 14, 15, 16, 18, 20]), a = pick(r, [2.0, 2.5, 3.0, 4.0, 5.0, 6.0]);
  return task([actorDef(A, 0, [{ until: 'rest', v0, a: -a }])],
    `${A.nom} bremst aus ${v0} m/s gleichmäßig bis zum Stillstand. Wie lange dauert das, und wie lang ist der Bremsweg?`,
    'Bremszeit: t = v₀ / |aₓ|. Bremsweg: Δx = v₀² / (2 · |aₓ|) – oder ½ · v₀ · t (Dreiecksfläche im t-vₓ-Diagramm).',
    [
      { label: 'Bremszeit', symbol: 't_B', unit: 's', goal: { type: 'segment', actor: A.id, index: 0, ask: 't' },
        hints: [{ value: v0 * a, text: 'Teilen, nicht malnehmen: t = v₀ / |aₓ|.' }], help: `t = ${v0} m/s / ${f1(a)} m/s².` },
      { label: 'Bremsweg', symbol: 's_B', unit: 'm', goal: { type: 'segment', actor: A.id, index: 0, ask: 's' },
        follows: { vars: { t: 0 }, expr: `${v0}*t/2` },
        hints: [{ value: (v0 * v0) / a, text: 'Die 2 im Nenner fehlt: Δx = v₀² / (2 · |aₓ|).' }, { expr: `${v0}*t`, text: 'So weit käme es ohne Bremsen. Beim Bremsen ist es die Dreiecksfläche: ½ · v₀ · t.' }],
        help: `Δx = ½ · ${v0} m/s · t_B.` },
    ]);
}

// ---------- mittel ----------
function startCruise(r) { // anfahren, dann gleichförmig
  const A = pick(r, [CAR, BUS]), a = pick(r, [1.0, 1.5, 2.0, 2.5]), T1 = pick(r, [4, 5, 6, 8]), T2 = pick(r, [5, 6, 8, 10, 12, 15]);
  const v = a * T1, kmh = chance(r, 0.4);
  const qs = [
    { label: 'Höchstgeschwindigkeit', symbol: 'v_max', unit: 'm/s', goal: { type: 'valueAt', actor: A.id, q: 'vx', t: T1 + T2 / 2 },
      hints: [{ value: a * (T1 + T2), text: 'Beschleunigt wird nur im ersten Abschnitt.' }], help: `vₓ = ${f1(a)} m/s² · ${T1} s.` },
    { label: 'Gesamtweg', symbol: 'Δx', unit: 'm', goal: { type: 'displacement', actor: A.id },
      follows: { vars: { v: 0 }, expr: `v*${T1}/2+v*${T2}` },
      hints: [{ expr: `v*${T1 + T2}`, text: 'Im ersten Abschnitt war es noch langsamer: dort ist es eine Dreiecksfläche, ½ · v · t.' }, { expr: `v*${T1}/2`, text: 'Das ist nur der erste Abschnitt. Danach fährt es noch gleichförmig weiter.' }],
      help: 'Fläche unter t-vₓ: Dreieck + Rechteck.' },
    { label: 'Durchschnittsgeschwindigkeit', symbol: 'v̄', unit: kmh ? 'km/h' : 'm/s', goal: { type: 'avgVelocity', actor: A.id },
      follows: { vars: { s: 1, v: 0 }, expr: `s/${T1 + T2}${kmh ? '*3.6' : ''}` },
      hints: [{ expr: kmh ? `v*3.6/2` : 'v/2', text: 'Nicht die Geschwindigkeiten mitteln: v̄ = Gesamtweg / Gesamtzeit.' }, ...(kmh ? [{ expr: `s/${T1 + T2}`, text: 'Das ist m/s. Gefragt ist km/h: mal 3,6.' }] : [])],
      help: `v̄ = Δx / ${T1 + T2} s${kmh ? ', dann mal 3,6' : ''}.` },
  ];
  const n = (x) => String(x).replace('.', ',') + (Number.isInteger(x) && x < 10 ? ',0' : '');
  return task([actorDef(A, 0, [{ dt: T1, a }, { dt: T2, v }])],
    `${A.nom} fährt ${n(T1)} s lang mit ${n(a)} m/s² aus dem Stand an und dann ${n(T2)} s gleichförmig weiter. Berechne Höchstgeschwindigkeit, Gesamtweg und Durchschnittsgeschwindigkeit.`,
    'Höchstgeschwindigkeit: vₓ = aₓ · t₁. Gesamtweg = Fläche unter t-vₓ (Dreieck + Rechteck). Durchschnitt = Gesamtweg / Gesamtzeit.',
    qs, ['anim']); // ohne Datenblatt: es würde die Höchstgeschwindigkeit verraten
}

function stopping(r) { // Reaktionszeit + Bremsen = Anhalteweg
  const A = CAR, kmh = pick(r, [30, 36, 50, 54, 72]), v0 = kmh / 3.6, tr = pick(r, [0.8, 1.0, 1.2, 1.5]), a = pick(r, [4.0, 5.0, 6.0, 8.0]);
  return task([actorDef(A, 0, [{ dt: tr, v: Math.round(v0 * 1000) / 1000 }, { until: 'rest', a: -a }])],
    `Ein Auto fährt mit ${kmh} km/h. Der Fahrer reagiert nach ${String(tr).replace('.', ',')} s und bremst dann mit ${String(a).replace('.', ',')} m/s². Wie lang ist der Anhalteweg?`,
    'Erst km/h in m/s umrechnen (durch 3,6). Reaktionsweg: v · t_R. Bremsweg: v² / (2 · |aₓ|). Anhalteweg = Summe.',
    [
      { label: 'Reaktionsweg', symbol: 's_R', unit: 'm', goal: { type: 'segment', actor: A.id, index: 0, ask: 's' },
        hints: [{ value: kmh * tr, text: 'Erst in m/s umrechnen: km/h durch 3,6.' }], help: `s_R = ${f1(v0)} m/s · ${String(tr).replace('.', ',')} s.` },
      { label: 'Bremsweg', symbol: 's_B', unit: 'm', goal: { type: 'segment', actor: A.id, index: 1, ask: 's' },
        hints: [{ value: (v0 * v0) / a, text: 'Die 2 im Nenner fehlt: s_B = v² / (2 · |aₓ|).' }, { value: (kmh * kmh) / (2 * a), text: 'Mit km/h gerechnet? Erst in m/s umrechnen.' }], help: 's_B = v² / (2 · |aₓ|) mit v in m/s.' },
      { label: 'Anhalteweg', symbol: 's_A', unit: 'm', goal: { type: 'displacement', actor: A.id },
        follows: { vars: { r: 0, b: 1 }, expr: 'r+b' }, help: 'Anhalteweg = Reaktionsweg + Bremsweg.' },
    ], ['anim']); // alle Angaben im Text, das Datenblatt würde die m/s schon verraten
}

// ---------- schwer ----------
function meetHead(r) { // Begegnung: zwei gleichförmig aufeinander zu
  const v1 = pick(r, [2, 3, 4, 5, 6]), v2 = pick(r, [2, 3, 4, 5, 6, 8]);
  const D = Math.min(pick(r, [60, 80, 100, 120, 150, 200, 250]), Math.floor(((v1 + v2) * 30) / 10) * 10); // Begegnung nach höchstens ~30 s
  const tm = D / (v1 + v2), T = Math.ceil(tm * 1.3);
  return task([actorDef(BIKE, 0, [{ dt: T, v: v1 }]), actorDef({ id: 'jo', name: 'Jo', sprite: 'jo' }, D, [{ dt: T, v: -v2 }])],
    'Kevin und Jo fahren gleichzeitig los, aufeinander zu. Wann und wo begegnen sie sich?',
    'Für beide x(t) = x₀ + vₓ · t aufstellen (Jos vₓ ist negativ!), gleichsetzen, nach t auflösen. Dann t in eine Gleichung einsetzen.',
    [
      { label: 'Zeitpunkt der Begegnung', symbol: 't_B', unit: 's', goal: { type: 'meet', a: 'kevin', b: 'jo', ask: 't' },
        hints: [{ value: D / Math.abs(v1 - v2 || 1e-3), text: 'Subtrahiert statt addiert? Sie fahren aufeinander zu: der Abstand schrumpft mit v₁ + v₂.' }, { value: D / v1, text: 'So lange bräuchte Kevin allein für die ganze Strecke. Jo kommt ihm aber entgegen.' }],
        help: `${v1} · t = ${D} − ${v2} · t.` },
      { label: 'Ort der Begegnung', symbol: 'x_B', unit: 'm', goal: { type: 'meet', a: 'kevin', b: 'jo', ask: 'x' },
        follows: { vars: { t: 0 }, expr: `${v1}*t` }, hints: [{ expr: `${v2}*t`, text: 'Das ist Jos gefahrene Strecke. Gefragt ist der Ort – von x = 0 aus gemessen.' }],
        help: `x_B = ${v1} m/s · t_B.` },
    ]);
}

function catchUp(r) { // Einholen aus dem Stand, gleicher Startort
  const v = pick(r, [3, 4, 5, 6]), a = pick(r, [0.5, 1.0, 1.5, 2.0]), te = (2 * v) / a, T = Math.ceil(te * 1.25);
  return task([actorDef(PAUL, 0, [{ dt: T, v }]), actorDef(BIKE, 0, [{ dt: T, a }])],
    'Paul läuft gleichförmig los, Kevin startet im selben Moment am selben Ort aus dem Stand. Wann und wo holt Kevin Paul ein – und wie schnell ist Kevin dann?',
    'Paul: x = vₓ · t. Kevin: x = ½ · aₓ · t². Gleichsetzen – t = 0 ist der Start, die andere Lösung ist das Einholen.',
    [
      { label: 'Zeitpunkt des Einholens', symbol: 't_E', unit: 's', goal: { type: 'meet', a: 'paul', b: 'kevin', ask: 't', after: 0.01 },
        hints: [{ value: v / a, text: 'Da sind beide gleich SCHNELL – eingeholt ist Paul noch nicht. Setze die ORTE gleich.' }], help: `${v} · t = ½ · ${f1(a)} · t².` },
      { label: 'Ort des Einholens', symbol: 'x_E', unit: 'm', goal: { type: 'meet', a: 'paul', b: 'kevin', ask: 'x', after: 0.01 },
        follows: { vars: { t: 0 }, expr: `${v}*t` }, help: `x_E = ${v} m/s · t_E.` },
      { label: 'Kevins Geschwindigkeit dabei', symbol: 'v_K', unit: 'm/s', goal: { type: 'valueAt', actor: 'kevin', q: 'vx', t: te },
        follows: { vars: { t: 0 }, expr: `${a}*t` }, hints: [{ value: v, text: 'Das ist Pauls Geschwindigkeit. Kevin ist beim Einholen schneller: vₓ = aₓ · t.' }], help: 'vₓ = aₓ · t_E.' },
    ]);
}

function catchUpLead(r) { // Einholen mit Wegvorsprung → quadratische Gleichung
  const v = pick(r, [2, 3, 4]), a = pick(r, [1.0, 1.5, 2.0]), d = pick(r, [5, 8, 10, 12, 15, 20]);
  const te = (v + Math.sqrt(v * v + 2 * a * d)) / a, T = Math.ceil(te * 1.25);
  return task([actorDef(PAUL, d, [{ dt: T, v }]), actorDef(BIKE, 0, [{ dt: T, a }])],
    `Paul hat ${d} m Vorsprung und läuft gleichförmig. Kevin startet im selben Moment aus dem Stand. Wann und wo holt Kevin Paul ein?`,
    `Paul: x = ${d} m + vₓ · t. Kevin: x = ½ · aₓ · t². Gleichsetzen ergibt eine quadratische Gleichung – nur die positive Lösung ergibt Sinn.`,
    [
      { label: 'Zeitpunkt des Einholens', symbol: 't_E', unit: 's', goal: { type: 'meet', a: 'paul', b: 'kevin', ask: 't' },
        hints: [{ value: (2 * v) / a, text: 'Das wäre ohne Vorsprung richtig. Paul startet aber weiter vorn.' }], help: `½ · ${f1(a)} · t² − ${v} · t − ${d} = 0 → Mitternachtsformel.` },
      { label: 'Ort des Einholens', symbol: 'x_E', unit: 'm', goal: { type: 'meet', a: 'paul', b: 'kevin', ask: 'x' },
        follows: { vars: { t: 0 }, expr: `${d}+${v}*t` }, hints: [{ expr: `${v}*t`, text: 'Das ist nur Pauls gelaufene Strecke. Sein Startort liegt beim Vorsprung.' }],
        help: `x_E = ${d} m + ${v} m/s · t_E.` },
    ]);
}
