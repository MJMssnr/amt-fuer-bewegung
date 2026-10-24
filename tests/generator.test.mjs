// Endlos-Generator [W47]: Viele Seeds je Typ und Stufe – jede Aufgabe muss lösbar und gut ablesbar sein.
import test from 'node:test';
import assert from 'node:assert/strict';
import { generate, TRAINING, LEVELS } from '../js/engine/gen/index.js';
import { buildWorld, series, quantityAt } from '../js/engine/kinematics.js';
import { areaPieces, segmentSlope } from '../js/engine/geometry.js';
import { evaluateGoal } from '../js/engine/goals.js';
import { evalExpr } from '../js/engine/variants.js';
import { avgByDistance, missingSpeed, SI } from '../js/engine/average.js';
import { UNIT_FACTOR } from '../js/engine/answer.js';

const N = 400;
const nice = (v, step = 0.5) => Math.abs(v / step - Math.round(v / step)) < 1e-9;

for (const { type } of TRAINING) for (const level of LEVELS) {
  test(`Generator ${type} ${level}: ${N} Seeds lösbar und ablesbar`, () => {
    const seen = new Set();
    for (let seed = 1; seed <= N; seed++) {
      const { ticket, scenario } = generate(type, level, seed);
      assert.deepEqual(generate(type, level, seed).scenario, scenario, 'gleicher Seed → gleiche Aufgabe');
      seen.add(JSON.stringify(scenario));
      if (type === 'avgdist') { // U: ohne Szenario
        const t = ticket.task, kV = SI[t.units.speed];
        const parts = t.parts.map((p) => ({ dx: p.dx * SI[t.units.dist], v: p.v == null ? null : p.v * kV }));
        const res = parts.some((p) => p.v == null) ? missingSpeed(parts, t.target * kV, 'distance') : avgByDistance(parts);
        if (t.why) assert.ok(!Number.isFinite(res) || res <= 0, 'unmöglich markiert, aber lösbar');
        else { assert.ok(Number.isFinite(res) && res > 0, `lösbar (Seed ${seed})`); assert.ok(res / kV <= 160, `Ergebnis plausibel (${res / kV})`); }
        seen.add(JSON.stringify(t.parts) + t.target);
        continue;
      }
      const world = buildWorld(scenario);
      if (type === 'calc') { // H: alle Fragen lösbar, Folgefehler-Ausdrücke rechnen mit der Lösung genau die Lösung nach
        const qs = ticket.task.questions.map((q) => ({ ...q, truth: evaluateGoal(q.goal, world).value * (UNIT_FACTOR[q.unit] ?? 1) }));
        for (const q of qs) {
          assert.ok(Number.isFinite(q.truth) && Math.abs(q.truth) > 1e-6, `${q.label} lösbar (Seed ${seed}, ${level})`);
          if (q.follows) {
            const vars = Object.fromEntries(Object.entries(q.follows.vars).map(([n, k]) => [n, qs[k].truth]));
            const f = evalExpr(q.follows.expr, vars);
            assert.ok(Math.abs(f - q.truth) <= 1e-6 * Math.max(1, Math.abs(q.truth)), `Folgefehler-Formel ${q.label}: ${f} ≠ ${q.truth} (Seed ${seed})`);
            for (const h of q.hints ?? []) if (h.expr) assert.ok(Number.isFinite(evalExpr(h.expr, vars)));
          }
        }
        for (const a of world.actors.values()) assert.ok(a.tEnd > 0 && a.tEnd <= 60, `Dauer ${a.tEnd}`);
        continue;
      }
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
        if (level === 'schwer') { // Sekante über ein gekrümmtes t-x-Stück [W48]
          const [t1, t2] = ticket.task.secant;
          assert.equal(ticket.task.graph, 'xt');
          assert.ok(t2 - t1 >= 2 && t1 >= 0 && t2 <= actor.tEnd + 1e-9, `Sekante ${t1}–${t2}`);
          assert.ok(actor.pieces.some((p) => Math.abs(p.a[0]) > 1e-9 && p.t0 < t2 && p.t1 > t1), 'gekrümmt im Bereich');
          for (const t of [t1, t2]) assert.ok(nice(quantityAt(actor, 'x', t), 0.25), `x(${t}) gut ablesbar`);
          continue;
        }
        const s = segmentSlope(actor, K, ticket.task.segment);
        assert.ok(s.straight && Number.isFinite(s.slope) && s.slope !== 0, `Abschnitt gerade, Steigung ≠ 0 (Seed ${seed})`);
        assert.ok(s.t1 - s.t0 >= 2, 'Abschnitt lang genug für ein Dreieck');
        if (level === 'mittel') assert.ok(s.slope < 0, 'mittel: fallende Gerade bzw. aₓ < 0');
      }
    }
    assert.ok(seen.size > N / 4, `genug Abwechslung (${seen.size} verschiedene)`);
  });
}
