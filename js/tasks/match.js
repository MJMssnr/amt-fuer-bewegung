// Aufgabentyp A: Zuordnen. Gegeben: Animation und/oder Diagramme. Gesucht: das passende Diagramm.
//
// Ticket-Feld "task":
// { "type":"match", "actor":"car", "given":["anim","xt"], "ask":"vt",
//   "prompt":"Welches t-vₓ-Diagramm passt?", "prefer":["vorzeichen"] }

import { series } from '../engine/kinematics.js';
import { drawGraph, KINDS, rangeOf } from '../render/graph.js';
import { Scene } from '../render/scene.js';
import { makeDistractors } from './distractors.js';

const LETTERS = ['A', 'B', 'C', 'D'];

function shuffle(arr, seed) {
  let s = seed;
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
  const actorId = task.actor ?? [...world.actors.keys()][0];
  const actor = world.actors.get(actorId);
  const given = task.given ?? ['anim'];
  const ask = task.ask ?? 'xt';

  root.innerHTML = `
    <div class="task-body">
      <div class="task-left">
        <div class="scene-wrap ${given.includes('anim') ? '' : 'hidden'}">
          <canvas class="scene" aria-label="Animation der Bewegung"></canvas>
          <div class="scene-ctrl">
            <button class="btn btn-play" aria-label="Abspielen">▶</button>
            <input class="scrub" type="range" min="0" max="${world.tEnd}" step="0.01" value="0" aria-label="Zeit">
          </div>
        </div>
        <div class="given"></div>
        <div class="paper-note hidden"><strong>✎ Auf Papier</strong><span></span></div>
      </div>
      <div class="task-right">
        <p class="prompt"></p>
        <div class="choices"></div>
        <div class="feedback" aria-live="polite"></div>
      </div>
    </div>`;

  const $ = (s) => root.querySelector(s);
  $('.prompt').textContent = task.prompt ?? `Welches ${KINDS[ask].title} passt zu dieser Bewegung?`;

  const cursors = [];
  const graphOpts = { tMax: world.tEnd, compact: true };

  for (const k of given.filter((g) => g !== 'anim')) {
    const card = document.createElement('figure');
    card.className = 'graph-card given-card';
    const g = drawGraph(k, series(actor, KINDS[k].q), graphOpts);
    card.appendChild(g.el);
    $('.given').appendChild(card);
    cursors.push(g);
  }

  // Papier-Auftrag: aus dem Ticket oder Standardtext, wenn links Platz ist
  const paper = task.paper ?? (given.length === 1
    ? 'Spiel die Animation ab und notiere für jeden Abschnitt Dauer und Geschwindigkeit. Berechne die Orte an den Abschnittsgrenzen, bevor du wählst.'
    : null);
  if (paper) {
    $('.paper-note span').textContent = paper;
    $('.paper-note').classList.remove('hidden');
  }

  const { correct, distractors } = makeDistractors(ask, actor, 3, task.prefer);
  const options = shuffle(
    [{ id: 'richtig', pieces: correct, correct: true }, ...distractors],
    [...ticket.id].reduce((h, c) => h + c.charCodeAt(0), 7),
  );

  let attempts = 0;
  let solved = false;
  options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'graph-card choice';
    btn.innerHTML = `<span class="letter">${LETTERS[i]}</span>`;
    const g = drawGraph(ask, opt.pieces, { ...graphOpts, yRange: rangeOf(opt.pieces) });
    btn.appendChild(g.el);
    cursors.push(g);
    btn.addEventListener('click', () => {
      if (solved || btn.disabled) return;
      attempts++;
      const fb = $('.feedback');
      if (opt.correct) {
        solved = true;
        btn.classList.add('right');
        fb.className = 'feedback ok';
        fb.textContent = 'Passt! Genau so sieht die Bewegung aus.';
        root.querySelectorAll('.choice').forEach((b) => (b.disabled = true));
        setTimeout(() => onSolved({ attempts }), 900);
      } else {
        btn.classList.add('wrong');
        btn.disabled = true;
        fb.className = 'feedback bad';
        fb.textContent = opt.feedback;
      }
    });
    $('.choices').appendChild(btn);
  });

  // Animation und Zeit-Cursor koppeln
  const scrub = $('.scrub');
  const playBtn = $('.btn-play');
  const scene = new Scene($('.scene'), world, {
    onTime: (t) => {
      scrub.value = t;
      cursors.forEach((c) => c.setCursor(t));
    },
  });
  scene.onEnd = () => (playBtn.textContent = '▶');
  playBtn.addEventListener('click', () => {
    if (scene.playing) { scene.pause(); playBtn.textContent = '▶'; }
    else { scene.play(); playBtn.textContent = '⏸'; }
  });
  scrub.addEventListener('input', () => { scene.pause(); playBtn.textContent = '▶'; scene.setTime(Number(scrub.value)); });
  if (given.includes('anim')) setTimeout(() => { scene.play(); playBtn.textContent = '⏸'; }, 400);

  return { destroy: () => scene.destroy() };
}
