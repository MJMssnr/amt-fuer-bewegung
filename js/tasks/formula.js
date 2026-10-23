// Aufgabentyp Q: Bewegungsformel [W30]. Schritt 1: die richtig umgestellte Formel antippen.
// Schritt 2: mit den bekannten Größen ausrechnen und eintippen (Polizist aktiv wie bei H).
// Geld wie H: perfect = beide Schritte beim ersten Versuch; partial = selbst gelöst; fail = „Lösung zeigen“.
//
// Ticket-Feld "task":
// { "type":"formula", "given":["anim"] (nur mit Szenario), "picture":{ "kind":"well", "t":2.4 } (ohne Szenario),
//   "prompt":"…", "paper":"…", "formula":"x = ½ · a · t²", "solveFor":"t",
//   "known":[ { "name":"a", "sym":"a", "value":3, "unit":"m/s²", "text":"3,0 m/s²" }, … ],
//   "choices":[ { "text":"t = √(2x / a)", "correct":true }, { "text":"…", "feedback":"…" } ],
//   "expr":"sqrt(2*x/a)", "label":"Fahrzeit", "symbol":"t", "unit":"s", "hints":[…], "help":"…" }

import { evalExpr } from '../engine/variants.js';
import { buildLeft, frame, actorOf } from './common.js';
import { questionBlock } from './questions.js';
import { dropScene } from '../render/drop.js';
import { shuffle } from './match.js';
import { addSignButtons } from '../ui/signbtn.js';

export function mount(root, { ticket, world, onSolved }) {
  const task = ticket.task;
  const { left, right } = frame(root);
  let L = null, drop = null;

  // ---------- links: Bewegung oder Bild, Bekanntes, Notizzettel ----------
  if (world) L = buildLeft(left, { ticket, world, actor: actorOf(world, task) });
  else {
    if (task.picture?.kind === 'well') drop = dropScene(left, { t: task.picture.t, label: task.picture.label });
    if (task.paper) {
      left.insertAdjacentHTML('beforeend', '<div class="paper-note"><strong>✎ Auf Papier</strong><span></span></div>');
      left.querySelector('.paper-note span').textContent = task.paper;
    }
  }
  const known = document.createElement('div');
  known.className = 'f-known';
  known.innerHTML = `<strong>Bekannt</strong>${task.known.map((k) => `<span>${k.sym} = ${k.text}</span>`).join('')}
    <strong>Gesucht</strong><span>${task.solveFor}</span>`;
  const note = left.querySelector('.paper-note');
  left.insertBefore(known, note ?? null);

  // ---------- rechts: Schritt 1 umstellen ----------
  right.innerHTML = `<p class="prompt"></p>
    <div class="f-step"><div class="f-head">① Umstellen nach <b></b></div>
      <div class="f-formula"></div><div class="f-choices"></div><div class="feedback f-fb" aria-live="polite"></div></div>
    <div class="f-step f-calc hidden"><div class="f-head">② Einsetzen und ausrechnen</div></div>`;
  right.querySelector('.prompt').textContent = task.prompt;
  right.querySelector('.f-head b').textContent = task.solveFor;
  right.querySelector('.f-formula').textContent = task.formula;
  const fb = right.querySelector('.f-fb');
  let wrong1 = 0, step1 = false;
  const list = right.querySelector('.f-choices');
  shuffle(task.choices.map((c) => ({ ...c })), ticket.id).forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'f-choice'; b.textContent = c.text;
    b.addEventListener('click', () => {
      if (step1 || b.disabled) return;
      if (!c.correct) {
        wrong1++; b.disabled = true; b.classList.add('wrong');
        fb.className = 'feedback f-fb bad'; fb.textContent = c.feedback ?? 'Diese Umstellung stimmt nicht. Mach die Probe: Setz sie in die Ausgangsformel ein!';
        return;
      }
      step1 = true; b.classList.add('right');
      list.querySelectorAll('.f-choice').forEach((x) => (x.disabled = true));
      fb.className = 'feedback f-fb ok'; fb.textContent = wrong1 ? 'Jetzt stimmt die Umstellung.' : 'Sauber umgestellt!';
      startCalc();
    });
    list.appendChild(b);
  });

  // ---------- Schritt 2 ausrechnen ----------
  function startCalc() {
    const box = right.querySelector('.f-calc');
    box.classList.remove('hidden');
    const params = Object.fromEntries(task.known.map((k) => [k.name, k.value]));
    const truth = evalExpr(task.expr, params);
    questionBlock(box, [{ label: task.label, symbol: task.symbol, unit: task.unit, truth, hints: task.hints, help: task.help }], {
      sig: task.sigCheck !== false,
      onSolved: ({ attempts, grade }) => onSolved({ attempts: attempts + wrong1, grade: grade === 'perfect' && wrong1 ? 'partial' : grade }),
    });
    box.querySelector('input')?.focus({ preventScroll: true });
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    addSignButtons(box); // ±-Knopf auch für das nachträglich erscheinende Feld
  }

  return { destroy: () => { L?.destroy(); drop?.destroy(); } };
}
