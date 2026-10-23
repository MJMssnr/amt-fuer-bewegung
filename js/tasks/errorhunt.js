// Aufgabentyp E: Fehlerjagd. Praktikant Ralf hat ein Diagramm gezeichnet, ein Abschnitt ist falsch.
// Den falschen Abschnitt im Diagramm antippen.
//
// Ticket-Feld "task":
// { "type":"errorhunt", "actor":"dog", "given":["anim","data"], "graph":"xt",
//   "error":{ "segment":1, "kind":"sign" | "value" | "shape", "factor":0.5 }, "explain":"…" }

import { buildActor, series } from '../engine/kinematics.js';
import { KINDS, rangeOf } from '../render/graph.js';
import { buildLeft, frame, actorOf, graphInto } from './common.js';

/** Abschnitte mit expliziter Dauer und Startgeschwindigkeit (damit Änderungen nichts "verschieben"). */
export function normalizedSegments(actor) {
  return actor.pieces.map((p) => (Math.abs(p.a[0]) + Math.abs(p.a[1]) < 1e-12
    ? { dt: p.t1 - p.t0, v: [...p.v0] }
    : { dt: p.t1 - p.t0, a: [...p.a], v0: [...p.v0] }));
}

/** Diagramm-Daten mit eingebautem Fehler. */
export function faultySeries(actor, kind, error) {
  const q = KINDS[kind].q;
  if (error.kind === 'shape') {
    // Gerade statt Parabel im t-x-Diagramm: Abschnitt durch seine Sehne ersetzen
    return series(actor, q).map((pc, i) => (i === error.segment ? [pc[0], pc[pc.length - 1]] : pc));
  }
  const segs = normalizedSegments(actor);
  const s = segs[error.segment];
  const f = error.kind === 'sign' ? -1 : error.factor ?? 0.5;
  if (s.v) s.v = s.v.map((c) => c * f);
  else s.a = s.a.map((c) => c * f);
  const def = { ...actor.def, r0: actor.pieces[0].r0, segments: segs };
  delete def.x0;
  return series(buildActor(def), q);
}

const DEFAULT_EXPLAIN = {
  sign: 'In diesem Abschnitt stimmt das Vorzeichen nicht: Die Bewegung geht in die andere Richtung.',
  value: 'In diesem Abschnitt stimmt der Zahlenwert nicht. Vergleiche mit den Daten.',
  shape: 'Hier ist eine Gerade gezeichnet, aber die Bewegung ist beschleunigt: Im t-x-Diagramm muss das eine Parabel sein.',
};

export function mount(root, { ticket, world, onSolved }) {
  const task = ticket.task;
  const actor = actorOf(world, task);
  const kind = task.graph ?? 'xt';
  const { left, right } = frame(root);
  const L = buildLeft(left, { ticket, world, actor });

  right.innerHTML = `<p class="prompt"></p><figure class="graph-card axes-card"><span class="ralf-stamp">gez. Ralf, Praktikant</span></figure>
    <div class="feedback" aria-live="polite"></div>`;
  right.querySelector('.prompt').textContent = task.prompt ?? `Ralfs ${KINDS[kind].title} hat einen Fehler. Tippe auf den falschen Abschnitt!`;
  const bad = faultySeries(actor, kind, task.error);
  const good = series(actor, KINDS[kind].q);
  const [lo1, hi1] = rangeOf(bad), [lo2, hi2] = rangeOf(good);
  const bands = actor.pieces.map((p) => [p.t0, p.t1]);
  const g = graphInto(right.querySelector('.axes-card'), kind, bad, { tMax: world.tEnd, bands, yRange: [Math.min(lo1, lo2), Math.max(hi1, hi2)] });
  L.addCursor(g);

  const fb = right.querySelector('.feedback');
  let attempts = 0, solved = false;
  g.bands.forEach((band, i) => band.addEventListener('click', () => {
    if (solved || band.classList.contains('picked-wrong')) return;
    attempts++;
    if (i === task.error.segment) {
      solved = true;
      band.classList.add('picked-right');
      g.overlay(good);
      fb.className = 'feedback ok';
      fb.textContent = `Erwischt! ${task.explain ?? DEFAULT_EXPLAIN[task.error.kind]} Grün gestrichelt: so wäre es richtig.`;
      setTimeout(() => onSolved({ attempts, grade: attempts === 1 ? 'perfect' : 'fail' }), 2600);
    } else {
      band.classList.add('picked-wrong');
      fb.className = 'feedback bad';
      fb.textContent = `Abschnitt ${i + 1} passt zu den Daten. Prüfe die anderen Abschnitte genauso.`;
    }
  }));

  return { destroy: () => L.destroy() };
}
