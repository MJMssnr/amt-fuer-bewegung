// Aufgabentyp B: Freihand zeichnen. Mit Finger/Maus das Diagramm ins leere Raster zeichnen;
// beim Loslassen wird die Spur automatisch zu Geradenstücken begradigt (Auto-Begradigung) und mit Toleranz geprüft.
//
// Ticket-Feld "task":
// { "type":"freehand", "actor":"dog", "given":["anim","vt"], "ask":"xt", "tolY":1, "tolT":0.3, "prompt":"…", "paper":"…" }
// Sinnvoll für Bewegungen, deren gesuchtes Diagramm aus Geraden besteht (z. B. t-x bei gleichförmigen Abschnitten).

import { series, quantityAt } from '../engine/kinematics.js';
import { straighten, compareLine } from '../engine/freehand.js';
import { KINDS, rangeOf } from '../render/graph.js';
import { fmt } from '../render/format.js';
import { buildLeft, frame, actorOf, graphInto } from './common.js';

export function mount(root, { ticket, world, onSolved }) {
  const task = ticket.task;
  const actor = actorOf(world, task);
  const ask = task.ask ?? 'xt';
  const K = KINDS[ask];
  const { left, right } = frame(root);
  const L = buildLeft(left, { ticket, world, actor });
  const truth = series(actor, K.q);
  const [lo, hi] = rangeOf(truth);
  const span = Math.max(1, hi - lo);
  const tolY = task.tolY ?? 0.08 * span;
  const tolT = task.tolT ?? 0.3;
  const tEnd = world.tEnd;
  const truthAt = (t) => quantityAt(actor, K.q, Math.min(t, tEnd));

  right.innerHTML = `<p class="prompt"></p><figure class="graph-card axes-card fh-card"></figure>
    <div class="calc-actions">
      <button class="btn fh-clear" type="button">Neu zeichnen</button>
      <button class="btn btn-check" type="button">Prüfen</button>
      <button class="btn btn-reveal hidden" type="button">Lösung zeigen</button>
    </div>
    <div class="feedback" aria-live="polite"></div>`;
  right.querySelector('.prompt').textContent = task.prompt
    ?? `Zeichne das ${K.title} mit dem Finger (oder der Maus) in einem Zug von t = 0 bis t = ${fmt(tEnd)} s. Beim Loslassen wird begradigt.`;

  const card = right.querySelector('.fh-card');
  const g = graphInto(card, ask, [], { tMax: tEnd, yRange: [lo < 0 ? lo - span * 0.1 : 0, hi + span * 0.25] });
  L.addCursor(g);
  const svg = g.el;
  svg.style.touchAction = 'none';
  svg.classList.add('fh-draw');

  const fb = right.querySelector('.feedback');
  let raw = [], line = [], drawing = false, wrongChecks = 0, done = false;

  // Pixel pro Einheit (für die Begradigung in Bildschirm-Maßstab)
  const [x0, y0] = g.toPx([0, 0]), [x1, y1] = g.toPx([1, 1]);
  const sx = Math.abs(x1 - x0), sy = Math.abs(y1 - y0);

  const add = (e) => {
    const [t, y] = g.toData(e.clientX, e.clientY);
    const tc = Math.max(0, Math.min(tEnd, t));
    // Ein Diagramm ist eine Funktion von t: rückwärts gezeichnete Punkte ignorieren
    if (raw.length && tc <= raw[raw.length - 1][0] + 1e-6) return;
    raw.push([tc, y]);
    g.trace(raw);
  };
  svg.addEventListener('pointerdown', (e) => {
    if (done) return;
    e.preventDefault();
    svg.setPointerCapture?.(e.pointerId);
    drawing = true; raw = []; line = [];
    const [t] = g.toData(e.clientX, e.clientY);
    if (t < tolT * 3) { raw.push([0, g.toData(e.clientX, e.clientY)[1]]); }
    add(e);
    fb.className = 'feedback'; fb.textContent = '';
  });
  svg.addEventListener('pointermove', (e) => { if (drawing) add(e); });
  const up = () => {
    if (!drawing) return;
    drawing = false;
    line = straighten(raw, { sx, sy, eps: task.eps ?? 7 });
    g.trace(line);
    svg.classList.toggle('fh-has', line.length > 1);
  };
  svg.addEventListener('pointerup', up);
  svg.addEventListener('pointercancel', up);

  function finish(grade) {
    done = true;
    right.querySelectorAll('.calc-actions .btn').forEach((b) => (b.disabled = true));
    g.overlay(truth);
    setTimeout(() => onSolved({ attempts: wrongChecks + 1, grade }), 2200);
  }

  function check() {
    if (done) return;
    if (line.length < 2) { fb.className = 'feedback bad'; fb.textContent = 'Zeichne zuerst eine Linie ins Diagramm.'; return; }
    const r = compareLine(line, truthAt, { tEnd, tolY, tolT });
    if (r.ok) {
      fb.className = 'feedback ok';
      fb.textContent = wrongChecks ? 'Jetzt passt deine Linie! Grün gestrichelt: die exakte Lösung.' : 'Sauber gezeichnet! Grün gestrichelt: die exakte Lösung.';
      finish(wrongChecks ? 'partial' : 'perfect');
      return;
    }
    wrongChecks++;
    fb.className = 'feedback bad';
    if (r.missing === 'start') fb.textContent = 'Fang ganz links bei t = 0 s an – der Startwert gehört dazu.';
    else if (r.missing === 'end') fb.textContent = `Zeichne bis zum Ende, also bis t = ${fmt(tEnd)} s.`;
    else {
      const f = r.first ?? r.worst;
      fb.innerHTML = `Ab t ≈ ${fmt(f.t, 1)} s liegt deine Linie ${f.dy > 0 ? 'zu hoch' : 'zu tief'} (um etwa ${fmt(Math.abs(f.dy), 1)} ${K.unit}).`
        + (K.q === 'x' ? ' Tipp: Δx in einem Abschnitt ist die Fläche unter der t-vₓ-Kurve.' : '');
    }
    if (wrongChecks >= 2) right.querySelector('.btn-reveal').classList.remove('hidden');
  }

  right.querySelector('.btn-check').addEventListener('click', check);
  right.querySelector('.fh-clear').addEventListener('click', () => { if (!done) { raw = []; line = []; g.trace([]); fb.textContent = ''; } });
  right.querySelector('.btn-reveal').addEventListener('click', () => {
    fb.className = 'feedback';
    fb.textContent = 'So sieht die Lösung aus. Vergleiche mit deinem Papier. Bezahlt wird diesmal nicht.';
    finish('fail');
  });

  return { destroy: () => L.destroy() };
}
