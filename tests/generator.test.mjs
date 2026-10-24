// Endlos-Generator [W47]: Viele Seeds je Typ und Stufe – jede Aufgabe muss lösbar und gut ablesbar sein.
import test from 'node:test';
import assert from 'node:assert/strict';
import { generate, TRAINING, LEVELS } from '../js/engine/gen/index.js';
import { buildWorld, series } from '../js/engine/kinematics.js';
import { areaPieces, segmentSlope } from '../js/engine/geometry.js';

const N = 400;
const nice = (v, step = 0.5) => Math.abs(v / step - Math.round(v / step)) < 1e-9;

for (const { type } of TRAINING) for (const level of LEVELS) {
  test(`Generator ${type} ${level}: ${N} Seeds lösbar und ablesbar`, () => {
    const seen = new Set();
    for (let seed = 1; seed <= N; seed++) {
      const { ticket, scenario } = generate(type, level, seed);
      assert.deepEqual(generate(type, level, seed).scenario, scenario, 'gleicher Seed → gleiche Aufgabe');
      seen.add(JSON.stringify(scenario));
      const world = buildWorld(scenario);
      const actor = world.actors.get(ticket.task.actor);
      assert.ok(actor, 'Figur vorhanden');
      assert.ok(actor.tEnd > 0 && actor.tEnd <= 16, `Dauer ${actor.tEnd}`);
      // Eckpunkte: ganze Sekunden, halbe m/s, |v| ≤ 8 m/s
      for (const p of actor.pieces) {
        assert.ok(nice(p.t0, 1) && nice(p.t1, 1), `Zeiten ganzzahlig (${p.t0}, ${p.t1})`);
        const v0 = p.v0[0], v1 = p.v0[0] + p.a[0] * (p.t1 - p.t0);
        assert.ok(nice(v0) && nice(v1), `vₓ halbzahlig (${v0}, ${v1}) Seed ${seed}`);
        assert.ok(Math.abs(v0) <= 8 && Math.abs(v1) <= 8);
      }
      if (type === 'area') {
        const pcs = areaPieces(actor, 'vx', 0, actor.tEnd);
        assert.ok(pcs.length >= 2, 'mindestens zwei Teilflächen');
        for (const pc of pcs) assert.ok(Number.isFinite(pc.area) && nice(pc.t0 ?? 0, 0.5), 'Teilfläche endlich, Nulldurchgang auf halber Sekunde');
        const xs = series(actor, 'x').flat().map(([, x]) => x);
        assert.ok(xs.every(Number.isFinite));
        if (level === 'schwer') assert.ok(pcs.some((pc) => pc.area < 0) && pcs.some((pc) => pc.area > 0), 'Vorzeichenwechsel');
        else assert.ok(pcs.every((pc) => pc.area >= 0), 'nur positive Flächen');
      }
      if (type === 'slope') {
        const K = ticket.task.graph === 'xt' ? 'x' : 'vx';
        const s = segmentSlope(actor, K, ticket.task.segment);
        assert.ok(s.straight && Number.isFinite(s.slope) && s.slope !== 0, `Abschnitt gerade, Steigung ≠ 0 (Seed ${seed})`);
        assert.ok(s.t1 - s.t0 >= 2, 'Abschnitt lang genug für ein Dreieck');
        if (level === 'mittel') assert.ok(s.slope < 0, 'mittel: fallende Gerade');
        if (level === 'schwer') assert.equal(ticket.task.graph, 'vt');
      }
    }
    assert.ok(seen.size > N / 4, `genug Abwechslung (${seen.size} verschiedene)`);
  });
}
