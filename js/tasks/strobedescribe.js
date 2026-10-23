// Aufgabentyp N: Stroboskopbild beschreiben [W22]. Gleichförmig oder beschleunigt? Die Richtung zeigt das Bild
// allein nicht – sie ergibt sich nur aus dem Zusammenhang (Kontext-Text).
// Bewertung wie A/G: nur der erste Versuch zählt.
//
// Ticket-Feld "task": gemeinsame Felder siehe strobe-common.js, dazu
// "context":"…", "choices":[ { "text":"…", "correct":true, "feedback":"…" }, … ], "explain":"… (nach der richtigen Antwort)"

import { frame } from './common.js';
import { shuffle } from './match.js';
import { strobeData, photo, flashInfo } from './strobe-common.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export function mount(root, { ticket, onSolved }) {
  const task = ticket.task;
  const D = strobeData(task);
  const { left, right } = frame(root);
  left.innerHTML = `<div class="sc-photo"></div><p class="sb-info">${flashInfo(task)}</p>
    <div class="strobe-context"></div><div class="paper-note"><strong>✎ Auf Papier</strong><span></span></div>`;
  left.querySelector('.strobe-context').textContent = task.context ?? '';
  left.querySelector('.paper-note span').textContent = task.paper
    ?? 'Miss die Abstände zwischen benachbarten Abbildern. Gleich groß: gleichförmig. Wachsend oder schrumpfend: beschleunigt. In welche Richtung es geht, verrät erst der Zusammenhang.';
  const ph = photo(left.querySelector('.sc-photo'), task, { range: D.range, pendulum: D.pendulum });
  requestAnimationFrame(() => ph.draw({ positions: D.xs }));

  right.innerHTML = '<p class="prompt"></p><div class="describe-list"></div><div class="feedback" aria-live="polite"></div>';
  right.querySelector('.prompt').textContent = task.prompt ?? 'Welche Beschreibung passt zum Stroboskopbild?';
  const fb = right.querySelector('.feedback');
  let attempts = 0, solved = false;
  shuffle(task.choices.map((c) => ({ ...c })), ticket.id).forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'strobe-choice';
    b.innerHTML = `<span class="letter">${LETTERS[i]}</span>`;
    b.append(c.text);
    b.addEventListener('click', () => {
      if (solved || b.disabled) return;
      attempts++;
      if (c.correct) {
        solved = true;
        b.classList.add('right');
        fb.className = 'feedback ok';
        fb.textContent = task.explain ?? 'Genau so!';
        right.querySelectorAll('.strobe-choice').forEach((x) => (x.disabled = true));
        setTimeout(() => onSolved({ attempts, grade: attempts === 1 ? 'perfect' : 'fail' }), 700);
      } else {
        b.classList.add('wrong'); b.disabled = true;
        fb.className = 'feedback bad';
        fb.textContent = c.feedback ?? 'Das passt nicht. Schau dir die Abstände noch einmal genau an.';
      }
    });
    right.querySelector('.describe-list').appendChild(b);
  });
  return { destroy: () => ph.destroy() };
}
