// Aufgabentyp H: Berechnen. Werte auf Papier ausrechnen, Ergebnis eintippen.
// Toleranz: eine Einheit in der 2. signifikanten Stelle (js/engine/answer.js), pro Frage über "tol" änderbar.
//
// Ticket-Feld "task":
// { "type":"calc", "given":["anim","data"], "prompt":"…", "paper":"…",
//   "questions":[ { "label":"Treffzeitpunkt", "symbol":"t_T", "unit":"s",
//                   "goal":{ "type":"meet", "a":"anna", "b":"bernd", "ask":"t" },
//                   "hints":[ { "value":600, "text":"Typischer Fehler …" } ],
//                   "help":"Allgemeiner Tipp nach dem 2. Fehlversuch" } ] }

import { evaluateGoal } from '../engine/goals.js';
import { UNIT_FACTOR } from '../engine/answer.js';
import { buildLeft, frame, actorOf } from './common.js';
import { questionBlock } from './questions.js';

export function mount(root, { ticket, world, onSolved }) {
  const task = ticket.task;
  const { left, right } = frame(root);
  const L = buildLeft(left, { ticket, world, actor: actorOf(world, task) });

  const qs = task.questions.map((q) => {
    const factor = q.factor ?? UNIT_FACTOR[q.unit] ?? 1;
    const truth = evaluateGoal(q.goal, world).value * factor;
    if (!Number.isFinite(truth)) console.warn(`Frage "${q.label}" hat keine Lösung`, q.goal);
    return { ...q, truth };
  });

  right.innerHTML = '<p class="prompt"></p>';
  right.querySelector('.prompt').textContent = task.prompt ?? 'Rechne auf Papier und trage die Ergebnisse ein.';
  questionBlock(right, qs, { onSolved });

  return { destroy: () => L.destroy() };
}
