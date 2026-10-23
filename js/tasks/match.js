// Aufgabentyp A: Zuordnen. Gegeben: Animation und/oder Diagramme. Gesucht: das passende Diagramm.
//
// Ticket-Feld "task":
// { "type":"match", "actor":"car", "given":["anim","xt"], "ask":"vt",
//   "prompt":"Welches t-vₓ-Diagramm passt?", "paper":"…", "prefer":["vorzeichen"] }

import { KINDS, rangeOf } from '../render/graph.js';
import { makeDistractors } from './distractors.js';
import { buildLeft, frame, actorOf, graphInto } from './common.js';

const LETTERS = ['A', 'B', 'C', 'D'];

export function shuffle(arr, seedStr) {
  let s = [...seedStr].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 233280, 7);
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function mount(root, { ticket, world, onSolved }) {
  const task = ticket.task;
  const actor = actorOf(world, task);
  const ask = task.ask ?? 'xt';
  const { left, right } = frame(root);
  const L = buildLeft(left, { ticket, world, actor });

  right.innerHTML = `<p class="prompt"></p><div class="choices"></div><div class="feedback" aria-live="polite"></div>`;
  right.querySelector('.prompt').textContent = task.prompt ?? `Welches ${KINDS[ask].title} passt zu dieser Bewegung?`;

  const { correct, distractors } = makeDistractors(ask, actor, 3, task.prefer);
  const options = shuffle([{ id: 'richtig', pieces: correct, correct: true }, ...distractors], ticket.id);

  let attempts = 0, solved = false;
  const fb = right.querySelector('.feedback');
  options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'graph-card choice';
    btn.innerHTML = `<span class="letter">${LETTERS[i]}</span>`;
    right.querySelector('.choices').appendChild(btn);
    L.addCursor(graphInto(btn, ask, opt.pieces, { tMax: world.tEnd, compact: true, yRange: rangeOf(opt.pieces) }));
    btn.addEventListener('click', () => {
      if (solved || btn.disabled) return;
      attempts++;
      if (opt.correct) {
        solved = true;
        btn.classList.add('right');
        fb.className = 'feedback ok';
        fb.textContent = 'Passt! Genau so sieht die Bewegung aus.';
        right.querySelectorAll('.choice').forEach((b) => (b.disabled = true));
        setTimeout(() => onSolved({ attempts, grade: attempts === 1 ? 'perfect' : 'fail' }), 900);
      } else {
        btn.classList.add('wrong');
        btn.disabled = true;
        fb.className = 'feedback bad';
        fb.textContent = opt.feedback;
      }
    });
  });

  return { destroy: () => L.destroy() };
}
