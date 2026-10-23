// Ausführen mit:  node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWorld, quantityAt } from '../js/engine/kinematics.js';
import { evaluateGoal } from '../js/engine/goals.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);
const one = (segments, extra = {}) => ({ actors: [{ id: 'A', segments, ...extra }] });

test('zwei gleichförmige Abschnitte', () => {
  const sc = one([{ dt: 4.5, v: 2.5 }, { dt: 3, v: -2 }]);
  near(evaluateGoal({ type: 'displacement', actor: 'A' }, sc).value, 5.25);
  near(evaluateGoal({ type: 'totalPath', actor: 'A' }, sc).value, 17.25);
  near(evaluateGoal({ type: 'avgSpeed', actor: 'A' }, sc).value, 2.3);
  near(evaluateGoal({ type: 'avgVelocity', actor: 'A' }, sc).value, 0.7);
});

test('Anhalteweg mit Reaktionszeit, Ende per "rest"', () => {
  const sc = one([{ dt: 1, v: 8 }, { until: 'rest', a: -2 }]);
  const w = buildWorld(sc);
  near(w.tEnd, 5);
  near(evaluateGoal({ type: 'segment', actor: 'A', index: 1 }, sc).value, 16);
  near(evaluateGoal({ type: 'segment', actor: 'A', index: 1, ask: 't' }, sc).value, 4);
  near(evaluateGoal({ type: 'totalPath', actor: 'A' }, sc).value, 24);
});

test('Begegnung zweier Fahrzeuge aus zwei Städten', () => {
  const sc = { actors: [
    { id: 'A', segments: [{ dt: 60, v: 20 }] },
    { id: 'B', x0: 1000, segments: [{ dt: 60, v: -30 }] },
  ] };
  const r = evaluateGoal({ type: 'meet', a: 'A', b: 'B' }, sc);
  near(r.t, 20);
  near(r.x, 400);
});

test('Einholen: Start aus Ruhe gegen konstante Geschwindigkeit', () => {
  const sc = { actors: [
    { id: 'A', segments: [{ dt: 30, a: 2 }] },
    { id: 'B', segments: [{ dt: 30, v: 10 }] },
  ] };
  const r = evaluateGoal({ type: 'meet', a: 'A', b: 'B' }, sc);
  near(r.t, 10);
  near(r.x, 100);
});

test('senkrechter Wurf: Steighöhe und Flugzeit', () => {
  const sc = one([{ until: 'landing', a: [0, -9.81] }], { v0: [0, 20] });
  near(evaluateGoal({ type: 'max', actor: 'A', q: 'y' }, sc).value, 400 / (2 * 9.81));
  near(buildWorld(sc).tEnd, 40 / 9.81);
});

test('waagerechter Wurf: Wurfweite', () => {
  const sc = one([{ until: 'landing', a: [0, -9.81] }], { r0: [0, 20], v0: [5, 0] });
  const w = buildWorld(sc);
  near(quantityAt(w.actors.get('A'), 'x', w.tEnd), 5 * Math.sqrt(40 / 9.81));
});

test('Umkehraufgabe: Treffen genau in der Mitte', () => {
  const sc = { actors: [
    { id: 'A', segments: [{ dt: 100, v: 20 }] },
    { id: 'B', x0: 1000, segments: [{ dt: 100, v: -10 }] },
  ] };
  const r = evaluateGoal({
    type: 'solveFor', unknown: 'actors.B.segments.0.v', range: [-50, -1],
    condition: { type: 'meet', a: 'A', b: 'B', ask: 'x' }, target: 500,
  }, sc);
  near(r.value, -20, 1e-6);
});

test('Tempolimit', () => {
  const sc = one([{ dt: 8, v: 12.5 }]);
  const r = evaluateGoal({ type: 'speedCheck', actor: 'A', limit: 50 }, sc);
  near(r.vmax, 45);
  assert.equal(r.exceeded, 0);
});

test('Zeit bis Endgeschwindigkeit', () => {
  const sc = one([{ dt: 10, a: 1.5 }]);
  near(evaluateGoal({ type: 'timeUntil', actor: 'A', q: 'vx', value: 9 }, sc).value, 6);
});

import { sigTolerance, isClose, matchHint } from '../js/engine/answer.js';
import { parseNum } from '../js/render/format.js';

test('Toleranz in der 2. signifikanten Stelle', () => {
  near(sigTolerance(24), 1);
  near(sigTolerance(592.5), 10);
  near(sigTolerance(2.3), 0.1);
  near(sigTolerance(-7.5), 0.1);
  assert.ok(isClose(25, 24));
  assert.ok(!isClose(25.5, 24));
  assert.ok(isClose(30, 30.47));
  assert.ok(!isClose(8.46, 30.47));
  assert.ok(isClose(-7.4, -7.5));
});

test('Eingabe mit Dezimalkomma und Hinweise', () => {
  near(parseNum('2,5'), 2.5);
  near(parseNum(' 1 200 '), 1200);
  assert.ok(Number.isNaN(parseNum('abc')));
  assert.equal(matchHint(16.2, [{ value: 16, text: 'Reaktionsweg?' }]).text, 'Reaktionsweg?');
  assert.equal(matchHint(30, [{ value: 16, text: 'x' }]), null);
});

import { phrase } from '../js/tasks/describe-text.js';

test('Fachsprache: verzögert nur, wenn |v| abnimmt', () => {
  assert.match(phrase({ dt: 2, v0: -4, a: -1 }), /beschleunigt in −x/);
  assert.match(phrase({ dt: 2, v0: -4, a: 2 }), /verzögert in −x-Richtung bis zum Stillstand/);
  assert.match(phrase({ dt: 2, v0: 4, a: -1 }), /verzögert in \+x/);
  assert.match(phrase({ dt: 3, v0: 0, a: 0 }), /Stillstand/);
  assert.match(phrase({ dt: 3, v0: 2, a: -2 }), /Umkehr/);
});

test('Diagramm-Modul zeichnet eine Kurve (Regressionstest)', async () => {
  const src = (await import('node:fs')).readFileSync(new URL('../js/render/graph.js', import.meta.url), 'utf8');
  assert.match(src, /class: 'g-curve'/);
});

import { evalExpr, pickParams, resolveTicket, applyScenario } from '../js/engine/variants.js';

test('Zufallsvarianten: Ausdrücke, Texte, Szenario', () => {
  near(evalExpr('3000/(va+vb)', { va: 5, vb: 7.5 }), 240);
  assert.throws(() => evalExpr('alert(1)', {}));
  assert.throws(() => evalExpr('window', {}));
  const tk = { id: 't', vary: { options: [{ v: 10 }, { v: 12.5 }], set: { 'actors.car.segments.0.v': 'v' } },
    intro: [['a', 'Er fährt {v} m/s, also {v*3.6} km/h.']], task: { hints: [{ value: '{v*3.6}', text: 'x' }] } };
  const p = pickParams(tk, 42);
  assert.ok([10, 12.5].includes(p.v));
  const r = resolveTicket(tk, { v: 12.5 });
  assert.equal(r.intro[0][1], 'Er fährt 12,5 m/s, also 45 km/h.');
  assert.equal(r.task.hints[0].value, 45);
  const sc = applyScenario({ actors: [{ id: 'car', segments: [{ dt: 8, v: 1 }] }] }, tk, { v: 12.5 });
  assert.equal(sc.actors[0].segments[0].v, 12.5);
  // verschiedene Seeds -> verschiedene Varianten (mindestens einmal)
  const seen = new Set([0, 1, 2, 3, 4, 5, 6, 7].map((s) => pickParams(tk, s).v));
  assert.equal(seen.size, 2);
});

test('Raster: Schritte ohne 2,5; Feinraster zählbar', async () => {
  const { niceStep, minorDiv } = await import('../js/render/format.js');
  assert.equal(niceStep(9, 4), 5);
  assert.equal(niceStep(19, 5), 5);
  assert.equal(minorDiv(5), 5);
  assert.equal(minorDiv(2), 4);
  assert.equal(minorDiv(10), 5);
  assert.equal(minorDiv(0.2), 4);
});

test('Freihand: Begradigung und Vergleich', async () => {
  const { straighten, compareLine } = await import('../js/engine/freehand.js');
  const truth = (t) => (t <= 4 ? 3 * t : 12 - 2 * (t - 4));
  const raw = [];
  for (let t = 0; t <= 7; t += 0.1) raw.push([t, truth(t) + 0.1 * Math.sin(t * 7)]);
  const line = straighten(raw, { sx: 20, sy: 10, eps: 7 });
  assert.ok(line.length <= 5, `zu viele Knicke: ${line.length}`);
  assert.ok(compareLine(line, truth, { tEnd: 7, tolY: 1 }).ok);
  const off = line.map(([t, y]) => [t, y + 2]);
  const r = compareLine(off, truth, { tEnd: 7, tolY: 1 });
  assert.ok(!r.ok && r.first.t < 0.2 && r.first.dy > 0);
  assert.equal(compareLine(line.filter(([t]) => t < 5), truth, { tEnd: 7, tolY: 1 }).missing, 'end');
});
