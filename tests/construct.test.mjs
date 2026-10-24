// Konstrukteur (I): Vorschau-Kurve aus den Eingaben des Spielers [W47]
import test from 'node:test';
import assert from 'node:assert/strict';
import { previewPiece } from '../js/tasks/construct.js';

const at = ({ v0, a }, start, s) => start + v0 * s + 0.5 * a * s * s;

test('Umkehr (t45): glatter Übergang ergibt die echte Parabel mit Scheitel bei 12 m', () => {
  const p = previewPiece(8, 8, 4, 'down', 4, 16); // vorher Gerade mit 4 m/s
  assert.equal(p.v0, 4); assert.equal(p.a, -2);
  assert.equal(at(p, 8, 2), 12);
  assert.equal(at(p, 8, 4), 8);
});

test('Losfahren aus der Ruhe: Scheitel am Anfang, Ende stimmt', () => {
  const p = previewPiece(0, 9, 3, 'up', null, 20);
  assert.equal(p.v0, 0); assert.ok(p.a > 0); assert.ok(Math.abs(at(p, 0, 3) - 9) < 1e-9);
});

test('Bremsen bis zum Stillstand: Scheitel am Ende (Steigung dort 0)', () => {
  const p = previewPiece(0, 9, 3, 'down', null, 20);
  assert.ok(p.a < 0); assert.ok(Math.abs(p.v0 + p.a * 3) < 1e-9); assert.ok(Math.abs(at(p, 0, 3) - 9) < 1e-9);
});

test('Widerspricht die vorige Steigung der gewählten Form, zeigt die Vorschau trotzdem die gewählte Form', () => {
  const p = previewPiece(0, 9, 3, 'up', 10, 20); // mit 10 m/s weiter wäre aₓ < 0
  assert.ok(p.a > 0);
});

test('Gerade bleibt Gerade, gleicher Start- und Endwert ohne Vorwissen ist trotzdem gekrümmt', () => {
  assert.deepEqual(previewPiece(2, 6, 2, 'line'), { v0: 2, a: 0 });
  assert.ok(previewPiece(5, 5, 2, 'up', null, 10).a > 0);
});
