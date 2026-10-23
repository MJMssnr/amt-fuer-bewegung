// Typ P: Fehlerabschätzung über Größt-/Kleinstwert [W30]
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extremes, diagnose } from '../js/engine/errors.js';

const close = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≠ ${b}`);

test('Summe dreier Strecken: Unsicherheiten addieren sich', () => {
  const m = [{ name: 'a', value: 412, err: 1 }, { name: 'b', value: 250, err: 10 }, { name: 'c', value: 85, err: 2 }];
  const r = extremes('a + b + c', m);
  close(r.best, 747); close(r.max, 760); close(r.min, 734);
  assert.equal(diagnose(757, 'max', 'a + b + c', m, 0.5), 'single');
  assert.equal(diagnose(760, 'max', 'a + b + c', m, 0.5), null);
});

test('Quotient: großer Zähler durch kleinen Nenner', () => {
  const m = [{ name: 'x', value: 1.0, err: 0.2 }, { name: 't', value: 0.2, err: 0.02 }];
  const r = extremes('x / t', m);
  close(r.best, 5); close(r.max, 1.2 / 0.18); close(r.min, 0.8 / 0.22);
  assert.equal(diagnose(1.2 / 0.22, 'max', 'x / t', m, 0.1), 'corner');
  assert.equal(diagnose(5, 'min', 'x / t', m, 0.1), 'best');
});
