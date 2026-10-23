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
import { UNIT_FACTOR, isClose, matchHint } from '../engine/answer.js';
import { fmt, parseNum } from '../render/format.js';
import { buildLeft, frame, actorOf } from './common.js';

const sym = (s) => (s ? s.replace(/_(\w+)/, '<sub>$1</sub>') : '');

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

  right.innerHTML = `
    <p class="prompt"></p>
    <form class="calc-list" autocomplete="off"></form>
    <div class="calc-actions">
      <button class="btn btn-check" type="button">Prüfen</button>
      <button class="btn btn-reveal hidden" type="button">Lösung zeigen</button>
    </div>
    <div class="feedback" aria-live="polite"></div>`;
  right.querySelector('.prompt').textContent = task.prompt ?? 'Rechne auf Papier und trage die Ergebnisse ein.';
  const list = right.querySelector('.calc-list');
  qs.forEach((q, i) => {
    list.insertAdjacentHTML('beforeend', `
      <label class="calc-row">
        <span class="calc-label">${q.label}${q.symbol ? ` ${sym(q.symbol)}` : ''}</span>
        <span class="calc-input"><input inputmode="decimal" enterkeyhint="${i === qs.length - 1 ? 'done' : 'next'}" data-i="${i}" aria-label="${q.label}"><span class="unit">${q.unit ?? ''}</span></span>
        <span class="calc-mark" aria-hidden="true"></span>
      </label>`);
  });
  const inputs = [...list.querySelectorAll('input')];
  const fb = right.querySelector('.feedback');
  const btnCheck = right.querySelector('.btn-check');
  const btnReveal = right.querySelector('.btn-reveal');
  let wrongChecks = 0, done = false;

  inputs.forEach((inp, i) => inp.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (i < inputs.length - 1) inputs[i + 1].focus(); else check();
  }));

  function finish(attempts) {
    done = true;
    inputs.forEach((inp) => (inp.disabled = true));
    btnCheck.disabled = true;
    btnReveal.classList.add('hidden');
    setTimeout(() => onSolved({ attempts }), 1400);
  }

  function check() {
    if (done) return;
    const msgs = [];
    let allRight = true;
    qs.forEach((q, i) => {
      const row = inputs[i].closest('.calc-row');
      const val = parseNum(inputs[i].value);
      row.classList.remove('ok', 'bad');
      if (!Number.isFinite(val)) { allRight = false; msgs.push(`<b>${q.label}:</b> Hier fehlt noch eine Zahl.`); return; }
      if (isClose(val, q.truth, q.tol)) { row.classList.add('ok'); inputs[i].disabled = true; return; }
      allRight = false;
      row.classList.add('bad');
      const hint = matchHint(val, q.hints);
      if (hint) msgs.push(`<b>${q.label}:</b> ${hint.text}`);
      else if (Math.sign(val) !== Math.sign(q.truth) && isClose(-val, q.truth, q.tol)) msgs.push(`<b>${q.label}:</b> Der Betrag stimmt, aber das Vorzeichen nicht. In welche Richtung zeigt die x-Achse?`);
      else if (wrongChecks >= 1 && q.help) msgs.push(`<b>${q.label}:</b> ${q.help}`);
      else msgs.push(`<b>${q.label}:</b> Das stimmt noch nicht. Rechne nochmal nach.`);
    });
    if (allRight) {
      fb.className = 'feedback ok';
      fb.textContent = wrongChecks ? 'Jetzt stimmt alles!' : 'Alles richtig, sauber gerechnet!';
      finish(wrongChecks + 1);
      return;
    }
    wrongChecks++;
    fb.className = 'feedback bad';
    fb.innerHTML = msgs.join('<br>');
    if (wrongChecks >= 2) btnReveal.classList.remove('hidden');
  }

  btnCheck.addEventListener('click', check);
  btnReveal.addEventListener('click', () => {
    qs.forEach((q, i) => {
      inputs[i].value = fmt(q.truth, 2);
      inputs[i].closest('.calc-row').classList.remove('bad');
      inputs[i].closest('.calc-row').classList.add('shown');
    });
    fb.className = 'feedback';
    fb.textContent = 'Das sind die Lösungen. Vergleiche sie mit deinem Rechenweg auf Papier. Die Belohnung gibt es nur zur Hälfte.';
    finish(99);
  });

  return { destroy: () => L.destroy() };
}
