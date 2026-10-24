// Aufgabentyp „Konstrukteur“: Diagramm selbst bauen. Für jeden Abschnitt den Endwert eintragen
// (auf Papier berechnet) und die Form wählen: Gerade, Linkskurve (⌣, aₓ > 0) oder Rechtskurve (⌢, aₓ < 0).
// Die eigene Kurve wird live gezeichnet.
//
// Ticket-Feld "task":
// { "type":"construct", "actor":"kevin", "given":["anim","vt"], "ask":"xt", "prompt":"…", "paper":"…" }

import { series, quantityAt } from '../engine/kinematics.js';
import { sigTolerance, isClose } from '../engine/answer.js';
import { KINDS, rangeOf } from '../render/graph.js';
import { fmt, parseNum } from '../render/format.js';
import { buildLeft, frame, actorOf, graphInto } from './common.js';
import { sigPatrol } from '../ui/police.js';

const SHAPES = {
  line: { label: 'Gerade', path: 'M3 21 L25 3' },
  up: { label: 'Linkskurve ⌣', path: 'M3 21 Q 19 21 25 3' },
  down: { label: 'Rechtskurve ⌢', path: 'M3 21 Q 9 3 25 3' },
};
const icon = (k) => `<svg viewBox="0 0 28 24" aria-hidden="true"><path d="${SHAPES[k].path}"/></svg>`;

/** Lösung: Werte an den Abschnittsgrenzen und Formen je Abschnitt. */
export function constructTruth(actor, ask) {
  const q = KINDS[ask].q;
  const times = [...actor.pieces.map((p) => p.t0), actor.tEnd];
  const values = times.map((t, i) => (i === times.length - 1 ? quantityAt(actor, q, t) : quantityAt(actor, q, t + 1e-9)));
  const comp = q === 'y' ? 1 : 0;
  const shapes = actor.pieces.map((p) => {
    if (q !== 'x' && q !== 'y') return 'line';
    const a = p.a[comp];
    return Math.abs(a) < 1e-9 ? 'line' : a > 0 ? 'up' : 'down';
  });
  return { times, values, shapes };
}

/**
 * Vorschau-Stück von start nach end in der Dauer T mit gewählter Form [W47].
 * Rückgabe { v0, a } für x(s) = start + v0·s + ½·a·s².
 * Passt die Steigung des vorigen Stücks (slope) zur gewählten Krümmung, wird sie übernommen (glatter Übergang,
 * so entsteht z. B. die Umkehr-Parabel bei t45). Sonst liegt der Scheitel am Anfang bzw. Ende des Stücks
 * (Losfahren aus der Ruhe, Bremsen bis zum Stillstand) oder – bei gleichem Start- und Endwert – in der Mitte.
 */
export function previewPiece(start, end, T, shape, slope = null, span = 1) {
  const d = end - start;
  if (shape !== 'up' && shape !== 'down') return { v0: d / T, a: 0 };
  const sgn = shape === 'up' ? 1 : -1;
  if (slope !== null && Number.isFinite(slope)) {
    const a = (2 * (d - slope * T)) / (T * T);
    if (Math.sign(a) === sgn) return { v0: slope, a };
  }
  if (Math.abs(d) < 1e-9 * Math.max(1, span)) { const a = (sgn * 8 * 0.15 * span) / (T * T); return { v0: (-a * T) / 2, a }; }
  if (Math.sign(d) === sgn) return { v0: 0, a: (2 * d) / (T * T) };   // Scheitel am Anfang
  return { v0: (2 * d) / T, a: (-2 * d) / (T * T) };                  // Scheitel am Ende
}

export function mount(root, { ticket, world, onSolved }) {
  const task = ticket.task;
  const actor = actorOf(world, task);
  const ask = task.ask ?? 'xt';
  const K = KINDS[ask];
  const { left, right } = frame(root);
  const L = buildLeft(left, { ticket, world, actor });
  const truth = constructTruth(actor, ask);
  const withShapes = K.q === 'x' || K.q === 'y';
  const n = truth.shapes.length;

  const [lo, hi] = rangeOf(series(actor, K.q));
  const span = Math.max(1, hi - lo);
  const tolOf = (v) => Math.max(sigTolerance(v), 0.02 * span);

  right.innerHTML = `<p class="prompt"></p><figure class="graph-card axes-card"></figure>
    <div class="construct" style="--n:${n}">
      <div class="c-start">Start: ${K.axis}(0) = ${fmt(truth.values[0])} ${K.unit}</div>
      ${truth.shapes.map((_, i) => `
        <div class="c-col" data-i="${i}">
          <div class="c-time">${fmt(truth.times[i])} – ${fmt(truth.times[i + 1])} s</div>
          ${withShapes ? `<div class="c-shapes">${Object.keys(SHAPES).map((k) => `<button type="button" class="c-shape" data-k="${k}" title="${SHAPES[k].label}" aria-label="${SHAPES[k].label}">${icon(k)}</button>`).join('')}</div>` : ''}
          <label class="c-val"><span>${K.axis}(${fmt(truth.times[i + 1])} s)</span><input inputmode="decimal" aria-label="${K.axis} bei ${fmt(truth.times[i + 1])} s"></label>
        </div>`).join('')}
    </div>
    <div class="calc-actions">
      <button class="btn btn-check" type="button">Prüfen</button>
      <button class="btn btn-reveal hidden" type="button">Lösung zeigen</button>
    </div>
    <div class="feedback" aria-live="polite"></div>`;
  right.querySelector('.prompt').textContent = task.prompt ?? `Konstruiere das ${K.title}: Endwert und Form für jeden Abschnitt.`;

  const card = right.querySelector('.axes-card');
  const yRange = [Math.min(0, lo), hi + span * 0.3];
  const g = graphInto(card, ask, [], { tMax: world.tEnd, yRange });
  L.addCursor(g);

  const cols = [...right.querySelectorAll('.c-col')];
  const inputs = cols.map((c) => c.querySelector('input'));
  const chosen = new Array(n).fill(withShapes ? null : 'line');
  const fb = right.querySelector('.feedback');
  let wrongChecks = 0, done = false;

  // Live-Vorschau der eigenen Kurve: echte Parabelstücke statt einer symmetrischen „Beule“ [W47].
  // Vorher war die Kurve bei gleichem Start- und Endwert (Umkehr, t45) fast flach.
  function redraw() {
    const pts = [];
    let start = truth.values[0], slope = null; // Steigung am Ende des vorigen Stücks (aus den Eingaben des Spielers)
    for (let i = 0; i < n; i++) {
      const end = parseNum(inputs[i].value);
      if (!Number.isFinite(end)) break;
      const t0 = truth.times[i], t1 = truth.times[i + 1], shape = chosen[i] ?? 'line';
      const { v0, a } = previewPiece(start, end, t1 - t0, shape, slope, span);
      for (let k = 0; k <= 24; k++) {
        const s = (k / 24) * (t1 - t0);
        pts.push([t0 + s, start + v0 * s + 0.5 * a * s * s]);
      }
      slope = v0 + a * (t1 - t0);
      start = end;
    }
    g.trace(pts.length ? pts : [[0, truth.values[0]]]);
  }

  cols.forEach((col, i) => {
    col.querySelectorAll('.c-shape').forEach((b) => b.addEventListener('click', () => {
      if (done) return;
      chosen[i] = b.dataset.k;
      col.querySelectorAll('.c-shape').forEach((x) => x.classList.toggle('on', x === b));
      redraw();
    }));
    inputs[i].addEventListener('input', redraw);
    inputs[i].addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (i < n - 1) inputs[i + 1].focus(); else check();
    });
  });
  redraw();

  function finish(grade) {
    done = true;
    inputs.forEach((x) => (x.disabled = true));
    right.querySelector('.btn-check').disabled = true;
    right.querySelector('.btn-reveal').classList.add('hidden');
    g.overlay(series(actor, K.q));
    setTimeout(() => onSolved({ attempts: wrongChecks + 1, grade }), 2200);
  }

  let patrolling = false;
  async function check() {
    if (done || patrolling) return;
    patrolling = true;
    // I: Polizist nur auf Wunsch (sigCheck: true) [W20]
    try { await sigPatrol(inputs.map((input) => ({ input })), { enabled: task.sigCheck === true }); } finally { patrolling = false; }
    const msgs = [];
    cols.forEach((col, i) => {
      const val = parseNum(inputs[i].value);
      const okVal = Number.isFinite(val) && isClose(val, truth.values[i + 1], tolOf(truth.values[i + 1]));
      const okShape = chosen[i] === truth.shapes[i];
      col.classList.toggle('ok', okVal && okShape);
      col.classList.toggle('bad', !(okVal && okShape));
      const name = `Abschnitt ${i + 1}`;
      if (!Number.isFinite(val)) msgs.push(`<b>${name}:</b> Der Endwert fehlt noch.`);
      else if (!okVal) msgs.push(`<b>${name}:</b> ${K.axis}(${fmt(truth.times[i + 1])} s) stimmt nicht. ${K.q === 'x' ? 'Δx ist die Fläche unter der t-vₓ-Kurve in diesem Abschnitt.' : 'Δvₓ ist die Fläche unter der t-aₓ-Kurve.'}`);
      if (withShapes && !chosen[i]) msgs.push(`<b>${name}:</b> Wähle noch die Form.`);
      else if (!okShape) msgs.push(`<b>${name}:</b> Die Form passt nicht. Gleichförmig: Gerade. aₓ > 0: Linkskurve ⌣. aₓ < 0: Rechtskurve ⌢.`);
    });
    if (!msgs.length) {
      fb.className = 'feedback ok';
      fb.textContent = wrongChecks ? 'Jetzt stimmt dein Diagramm! Grün gestrichelt: die exakte Kurve.' : 'Perfekt konstruiert! Grün gestrichelt: die exakte Kurve.';
      finish(wrongChecks ? 'partial' : 'perfect');
      return;
    }
    wrongChecks++;
    fb.className = 'feedback bad';
    fb.innerHTML = msgs.slice(0, 3).join('<br>');
    if (wrongChecks >= 2) right.querySelector('.btn-reveal').classList.remove('hidden');
  }

  right.querySelector('.btn-check').addEventListener('click', check);
  right.querySelector('.btn-reveal').addEventListener('click', () => {
    cols.forEach((col, i) => {
      inputs[i].value = fmt(truth.values[i + 1], 2);
      chosen[i] = truth.shapes[i];
      col.querySelectorAll('.c-shape').forEach((x) => x.classList.toggle('on', x.dataset.k === truth.shapes[i]));
      col.classList.remove('bad');
    });
    redraw();
    fb.className = 'feedback';
    fb.textContent = 'So sieht die Lösung aus. Vergleiche mit deinem Papier. Bezahlt wird diesmal nicht.';
    finish('fail');
  });

  return { destroy: () => L.destroy() };
}
