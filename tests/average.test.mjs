// Typ U/V: Durchschnittsgeschwindigkeit [W34]
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { avgByDistance, avgByTime, missingSpeed } from '../js/engine/average.js';

const close = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≠ ${b}`);

test('Strecken: gleiche Strecken mit 30 und 60 → 40, nicht 45', () => {
  close(avgByDistance([{ dx: 10, v: 30 }, { dx: 10, v: 60 }]), 40);
});
test('Zeiten: gleiche Zeiten mit 30 und 60 → 45', () => {
  close(avgByTime([{ dt: 1, v: 30 }, { dt: 1, v: 60 }]), 45);
});
test('Ziel-Schnitt: Strecken, auch der unmögliche Klassiker', () => {
  close(missingSpeed([{ dx: 10, v: 30 }, { dx: 10, v: null }], 40, 'distance'), 60);
  assert.equal(missingSpeed([{ dx: 10, v: 30 }, { dx: 10, v: null }], 60, 'distance'), Infinity);
});
test('Ziel-Schnitt: Zeiten', () => {
  close(missingSpeed([{ dt: 2, v: 10 }, { dt: 1, v: null }], 12, 'time'), 16);
});
