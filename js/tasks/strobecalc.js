// Aufgabentyp M: Mit einem Stroboskopbild rechnen [W22]. Abstände am Maßband/Maßstab ablesen, vₓ = Δx / Δt.
//
// Ticket-Feld "task": gemeinsame Felder siehe strobe-common.js, dazu
// "questions":[ { "label":"Geschwindigkeit", "symbol":"v_x", "unit":"m/s", "ask":"v", "i":0, "j":5, "hints":[…], "help":"…" } ]
//   ask: "v" (mittlere Geschwindigkeit zwischen Abbild i und j), "kmh" (dasselbe in km/h), "dx" (Abstand i→j), "t" (Zeit i→j)

import { strobeSpeed } from '../engine/strobe.js';
import { frame } from './common.js';
import { questionBlock } from './questions.js';
import { strobeData, photo, flashInfo } from './strobe-common.js';

export function mount(root, { ticket, onSolved }) {
  const task = ticket.task;
  const D = strobeData(task);
  const { left, right } = frame(root);
  left.innerHTML = `<div class="sc-photo"></div><p class="sb-info">${flashInfo(task)}</p>
    ${task.context ? '<div class="strobe-context"></div>' : ''}
    <div class="paper-note"><strong>✎ Auf Papier</strong><span></span></div>`;
  if (task.context) left.querySelector('.strobe-context').textContent = task.context;
  left.querySelector('.paper-note span').textContent = task.paper
    ?? 'Lies ab, wie weit der Körper zwischen zwei Abbildern kommt. Zwischen zwei Abbildern vergeht genau Δt. Dann vₓ = Δx / Δt.';
  const ph = photo(left.querySelector('.sc-photo'), task, { range: D.range, pendulum: D.pendulum, labels: true });
  requestAnimationFrame(() => ph.draw({ positions: D.xs }));

  const n = D.pos.length;
  const qs = task.questions.map((q) => {
    const i = q.i ?? 0, j = q.j ?? n - 1;
    const v = strobeSpeed(D.pos, i, j);
    const truth = { v, kmh: v * 3.6, dx: D.pos[j].x - D.pos[i].x, t: D.pos[j].t - D.pos[i].t }[q.ask ?? 'v'];
    return { ...q, truth };
  });
  right.innerHTML = '<p class="prompt"></p>';
  right.querySelector('.prompt').textContent = task.prompt ?? 'Werte das Stroboskopbild aus.';
  questionBlock(right, qs, { onSolved, sig: task.sigCheck !== false });
  return { destroy: () => ph.destroy() };
}
