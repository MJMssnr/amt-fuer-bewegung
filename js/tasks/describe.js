// Aufgabentyp G: Bewegung beschreiben. Welche fachsprachliche Beschreibung passt?
//
// Ticket-Feld "task":
// { "type":"describe", "actor":"jo", "given":["anim","vt"], "prompt":"…", "paper":"…", "prefer":["signA"] }

import { buildLeft, frame, actorOf } from './common.js';
import { segmentsOf, makeDescriptions } from './describe-text.js';
import { shuffle } from './match.js';

const LETTERS = ['A', 'B', 'C', 'D'];

export function mount(root, { ticket, world, onSolved }) {
  const task = ticket.task;
  const actor = actorOf(world, task);
  const { left, right } = frame(root);
  root.querySelector('.task-body').classList.add('wide-right');
  const L = buildLeft(left, { ticket, world, actor });

  right.innerHTML = `<p class="prompt"></p><div class="describe-list"></div><div class="feedback" aria-live="polite"></div>`;
  right.querySelector('.prompt').textContent = task.prompt ?? 'Welche Beschreibung der Bewegung ist fachlich korrekt?';

  const { correct, distractors } = makeDescriptions(segmentsOf(actor), 3, task.prefer);
  const options = shuffle([{ text: correct, correct: true }, ...distractors], ticket.id);
  const fb = right.querySelector('.feedback');
  let attempts = 0, solved = false;

  options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'desc-opt';
    btn.innerHTML = `<span class="letter">${LETTERS[i]}</span>`;
    btn.append(opt.text);
    btn.addEventListener('click', () => {
      if (solved || btn.disabled) return;
      attempts++;
      if (opt.correct) {
        solved = true;
        btn.classList.add('right');
        fb.className = 'feedback ok';
        fb.textContent = 'Fachlich sauber beschrieben!';
        right.querySelectorAll('.desc-opt').forEach((b) => (b.disabled = true));
        setTimeout(() => onSolved({ attempts, grade: attempts === 1 ? 'perfect' : 'fail' }), 1100);
      } else {
        btn.classList.add('wrong');
        btn.disabled = true;
        fb.className = 'feedback bad';
        fb.textContent = opt.feedback;
      }
    });
    right.querySelector('.describe-list').appendChild(btn);
  });

  return { destroy: () => L.destroy() };
}
