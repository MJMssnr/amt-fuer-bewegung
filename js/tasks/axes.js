// Aufgabentyp C: Achsen-Detektiv. Ein Diagramm ohne Zahlen an den Achsen.
// Aus den Daten der Bewegung auf Papier rechnen, welche Werte an die markierten Linien gehören.
//
// Ticket-Feld "task":
// { "type":"axes", "actor":"kevin", "given":["anim","data"], "graph":"vt", "marks":["t","y"],
//   "prompt":"…", "paper":"…", "hints":{ "t":[…], "y":[…] } }

import { series } from '../engine/kinematics.js';
import { KINDS } from '../render/graph.js';
import { buildLeft, frame, actorOf, graphInto } from './common.js';
import { questionBlock } from './questions.js';

export function mount(root, { ticket, world, onSolved }) {
  const task = ticket.task;
  const actor = actorOf(world, task);
  const kind = task.graph ?? 'vt';
  const K = KINDS[kind];
  const { left, right } = frame(root);
  const L = buildLeft(left, { ticket, world, actor });

  right.innerHTML = '<p class="prompt"></p><figure class="graph-card axes-card"></figure>';
  right.querySelector('.prompt').textContent = task.prompt ?? 'Welche Werte gehören an die markierten Linien?';
  const card = right.querySelector('.axes-card');
  const pieces = series(actor, K.q);

  // Erst ohne Markierung zeichnen, um die Achsenteilung zu kennen; dann mit Markierung neu
  const probe = graphInto(card, kind, pieces, { tMax: world.tEnd, hideScale: true });
  const { tR, yR } = probe;
  card.innerHTML = '';
  const marks = task.marks ?? ['t', 'y'];
  const mt = Math.round(tR.hi / tR.step);
  const my = yR.hi > 1e-9 ? Math.round(yR.hi / yR.step) : Math.round(yR.lo / yR.step);
  const g = graphInto(card, kind, pieces, {
    tMax: world.tEnd, hideScale: true,
    mark: { t: marks.includes('t') ? mt : undefined, y: marks.includes('y') ? my : undefined },
  });
  L.addCursor(g);

  const qs = [];
  if (marks.includes('t')) qs.push({ label: 'Wert an der markierten t-Linie', unit: 's', truth: mt * tR.step, hints: task.hints?.t });
  if (marks.includes('y')) qs.push({ label: `Wert an der markierten ${K.axis}-Linie`, unit: K.unit, truth: my * yR.step, hints: task.hints?.y,
    help: 'Suche einen Punkt der Kurve, dessen Wert du aus den Daten kennst. Zähle dann die Kästchen bis zur markierten Linie.' });
  questionBlock(right, qs, { onSolved, rule: false });

  return { destroy: () => L.destroy() };
}
