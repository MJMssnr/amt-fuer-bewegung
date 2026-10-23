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
