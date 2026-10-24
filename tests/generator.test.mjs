// Endlos-Generator [W47]: Viele Seeds je Typ und Stufe – jede Aufgabe muss lösbar und gut ablesbar sein.
import test from 'node:test';
import assert from 'node:assert/strict';
import { generate, TRAINING, LEVELS } from '../js/engine/gen/index.js';
import { buildWorld, series, quantityAt } from '../js/engine/kinematics.js';
import { areaPieces, segmentSlope } from '../js/engine/geometry.js';
import { evaluateGoal } from '../js/engine/goals.js';
import { evalExpr } from '../js/engine/variants.js';
import { avgByDistance, avgByTime, missingSpeed, SI } from '../js/engine/average.js';
import { makeDistractors } from '../js/tasks/distractors.js';
import { ACCEPT } from '../js/tasks/train-check.js';
import { faultySeries } from '../js/tasks/errorhunt.js';
import { KINDS } from '../js/render/graph.js';
import { UNIT_FACTOR } from '../js/engine/answer.js';

const N = 400;
const nice = (v, step = 0.5) => Math.abs(v / step - Math.round(v / step)) < 1e-9;

for (const { type } of TRAINING) for (const level of LEVELS) {
  test(`Generator ${type} ${level}: ${N} Seeds lösbar und ablesbar`, () => {
    const seen = new Set();
    for (let seed = 1; seed <= N; seed++) {
      const { ticket, scenario } = generate(type, level, seed, ACCEPT[type]);
      assert.deepEqual(generate(type, level, seed, ACCEPT[type]).scenario, scenario, 'gleicher Seed → gleiche Aufgabe');
      seen.add(JSON.stringify(scenario));
      if (type === 'avgtime') { // V: ohne Szenario
        const t = ticket.task, kV = SI[t.units.speed];
        const parts = t.parts.map((p) => ({ dt: p.dt * SI[p.tu ?? t.units.time], v: p.v == null ? null : p.v * kV }));
        const res = parts.some((p) => p.v == null) ? missingSpeed(parts, t.target * kV, 'time') : avgByTime(parts);
        assert.ok(Number.isFinite(res) && res > 0 && res / kV < 200, `V lösbar (Seed ${seed}: ${res / kV})`);
        seen.add(JSON.stringify(t.parts) + t.target);
        continue;
      }
      if (type === 'pairs') { // R: drei verschiedene Bewegungen, in beiden Diagrammarten unterscheidbar
        const t = ticket.task;
        assert.equal(t.items.length, 3, 'drei Paare');
        for (const kind of [t.left, t.right]) {
          const sigs = t.items.map((it) => JSON.stringify(series(buildWorld({ actors: [{ id: 'a', ...it }] }).actors.get('a'), KINDS[kind].q).map((pc) => pc.map(([tt, y]) => [Math.round(tt * 100), Math.round(y * 100)]))));
          assert.equal(new Set(sigs).size, 3, `${kind} unterscheidbar (Seed ${seed})`);
        }
        seen.add(JSON.stringify(t.items));
        continue;
      }
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
        if (type === 'match' || type === 'errorhunt') assert.ok(nice(p.a[0], 0.5), `aₓ im Datenblatt glatt (${p.a[0]}, Seed ${seed})`);
      }
      if (type === 'match') { // A: drei verschiedene Distraktoren aus Fehlvorstellungen
        const d = makeDistractors(ticket.task.ask, actor, 3, []);
        assert.equal(d.distractors.length, 3, `3 Distraktoren (Seed ${seed}, ${ticket.task.given[1]}→${ticket.task.ask})`);
        continue;
      }
      if (type === 'errorhunt') { // E: Fehler sichtbar, und zwar im genannten Abschnitt
        const t = ticket.task, q = KINDS[t.graph].q;
        const bad = faultySeries(actor, t.graph, t.error), good = series(actor, q);
        const diff = (i) => bad[i].some(([tt, y], k) => Math.abs(y - (good[i][Math.min(k, good[i].length - 1)]?.[1] ?? y)) > 0.2) || bad[i].length !== good[i].length;
        assert.ok(diff(t.error.segment), `Fehler im Abschnitt ${t.error.segment} sichtbar (Seed ${seed})`);
        continue;
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
        if (ticket.task.tangent != null) { // Tangente [W49]
          const t = ticket.task.tangent;
          assert.ok(t > 0 && t < actor.tEnd, 'Berührpunkt innen');
          assert.ok(actor.pieces.some((p) => Math.abs(p.a[0]) > 1e-9 && p.t0 < t && p.t1 > t), 'gekrümmt bei t*');
          assert.ok(nice(quantityAt(actor, 'x', t), 0.25) && nice(quantityAt(actor, 'vx', t), 0.5), 'P und Steigung gut ablesbar');
          continue;
        }
        if (ticket.task.secant) { // Sekante über ein gekrümmtes t-x-Stück [W48]
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
        if (ticket.task.segment === 1) assert.ok(s.slope < 0, 'fallende Gerade bzw. aₓ < 0');
      }
    }
    assert.ok(seen.size > N / 4, `genug Abwechslung (${seen.size} verschiedene)`);
  });
}
