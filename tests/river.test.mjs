// Typ W: Fluss-Labor [W34]
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tripPlan, boatAt } from '../js/engine/river.js';

const close = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≠ ${b}`);

test('Ohne Strömung: Schnitt = Bootsgeschwindigkeit', () => {
  close(tripPlan(5, 0, 100).avg, 5);
});
test('Mit Strömung: Schnitt kleiner – es gleicht sich NICHT aus', () => {
  const p = tripPlan(6, 2, 80);
  close(p.t1, 20); close(p.t2, 10); close(p.avg, 160 / 30);
  assert.ok(p.avg < 6);
  close(boatAt(p, 20, 6, 2), 80); close(boatAt(p, 25, 6, 2), 40);
});
test('Zu schwach gegen die Strömung: Boot treibt ab', () => {
  const p = tripPlan(2, 3, 50);
  assert.equal(p.ok, false);
  assert.ok(boatAt(p, 2, 2, 3) < 0);
});
