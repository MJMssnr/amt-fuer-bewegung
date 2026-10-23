// Aufgabentyp L: Steigungsdreieck. Im markierten geraden Abschnitt zwei Punkte antippen,
// das Dreieck erscheint; Δt und Δx (bzw. Δvₓ) am Raster ablesen und die Steigung berechnen.
//
// Ticket-Feld "task":
// { "type":"slope", "actor":"car", "given":["anim"], "graph":"xt", "segment":0, "kmh":false, "prompt":"…", "paper":"…" }
// graph "xt" → Steigung = vₓ ; graph "vt" → Steigung = aₓ

import { series, quantityAt } from '../engine/kinematics.js';
import { segmentSlope } from '../engine/geometry.js';
import { sigTolerance } from '../engine/answer.js';
import { KINDS } from '../render/graph.js';
import { fmt, minorDiv } from '../render/format.js';
import { buildLeft, frame, actorOf, graphInto } from './common.js';
import { questionBlock } from './questions.js';

export function mount(root, { ticket, world, onSolved }) {
  const task = ticket.task;
  const actor = actorOf(world, task);
  const kind = task.graph ?? 'xt';
  const K = KINDS[kind];
  const seg = segmentSlope(actor, K.q, task.segment ?? 0);
  const isV = K.q === 'x' || K.q === 'y';
  const slopeName = isV ? 'Geschwindigkeit vₓ' : 'Beschleunigung aₓ';
  const slopeUnit = isV ? 'm/s' : 'm/s²';
  const dName = isV ? 'Δx' : 'Δvₓ';
  const { left, right } = frame(root);
  const L = buildLeft(left, { ticket, world, actor });

  right.innerHTML = `<p class="prompt"></p><figure class="graph-card axes-card sl-card"></figure>
    <p class="sl-info"></p><div class="sl-q hidden"></div>`;
  right.querySelector('.prompt').textContent = task.prompt
    ?? `Tippe zwei Punkte auf der Linie im gelben Abschnitt an. Lies am Steigungsdreieck Δt und ${dName} ab und berechne die ${slopeName}.`;
  const info = right.querySelector('.sl-info');
  const g = graphInto(right.querySelector('.sl-card'), kind, series(actor, K.q), { tMax: world.tEnd });
  L.addCursor(g);
  g.shape([[seg.t0, g.yR.lo], [seg.t1, g.yR.lo], [seg.t1, g.yR.hi], [seg.t0, g.yR.hi]], 'g-band sl-seg');
  g.el.classList.add('sl-draw');

  const dT = g.tR.step / minorDiv(g.tR.step), dY = g.yR.step / minorDiv(g.yR.step);
  const onGrid = (v, d) => Math.abs(v / d - Math.round(v / d)) < 1e-6;
  const at = (t) => quantityAt(actor, K.q, t);

  const qs = [
    { label: 'Δt im Dreieck', unit: 's', truth: 0, help: 'Zähle die Kästchen der waagrechten Kathete und multipliziere mit dem Wert pro Kästchen.' },
    { label: `${dName} im Dreieck`, unit: K.unit, truth: 0, help: 'Senkrechte Kathete: Endwert minus Anfangswert. Geht es nach unten, ist das negativ.' },
    { label: slopeName, unit: slopeUnit, truth: seg.slope,
      hints: [{ value: -seg.slope, text: 'Achte aufs Vorzeichen: Fällt die Linie, ist die Steigung negativ.' },
        ...(Math.abs(seg.slope) > 1e-9 ? [{ value: 1 / seg.slope, text: `Umgekehrt! Steigung = ${dName} / Δt, nicht Δt / ${dName}.` }] : [])],
      help: `Steigung = ${dName} / Δt.` },
  ];
  if (task.kmh && isV) qs.push({ label: 'Geschwindigkeit in km/h', unit: 'km/h', truth: seg.slope * 3.6,
    hints: [{ value: seg.slope / 3.6, text: 'Von m/s nach km/h wird mit 3,6 multipliziert, nicht geteilt.' }] });

  let pts = [], drawn = [], placed = false, locked = false;
  const clear = () => { drawn.forEach((e) => e.remove()); drawn = []; };
  function drawTriangle() {
    clear();
    pts.forEach((p) => drawn.push(g.dot(p)));
    if (pts.length < 2) return;
    const [a, b] = [...pts].sort((p, q) => p[0] - q[0]);
    const c = [b[0], a[1]];
    drawn.push(g.shape([a, c, b], 'g-tri'), g.seg([a, c], 'g-seg leg'), g.seg([c, b], 'g-seg leg'));
    drawn.push(g.note([(a[0] + c[0]) / 2, c[1]], 'Δt = ?', 'g-note leg', [0, b[1] > a[1] ? 14 : -6]));
    drawn.push(g.note(c, `${dName} = ?`, 'g-note leg', [28, (b[1] > a[1] ? -1 : 1) * 14]));
    pts.forEach((p) => drawn.push(g.dot(p)));
    qs[0].truth = b[0] - a[0];
    qs[0].tol = Math.max(sigTolerance(qs[0].truth), dT / 2);
    qs[1].truth = b[1] - a[1];
    qs[1].tol = Math.max(sigTolerance(qs[1].truth), dY / 2);
    const bad = [a, b].filter(([t, y]) => !onGrid(y, dY)).length;
    info.textContent = bad
      ? 'Tipp: Mindestens ein Punkt liegt nicht auf einer Kästchenecke. Dann wird das Ablesen ungenau – such dir lieber Punkte, wo die Linie genau durch eine Ecke geht.'
      : 'Gut gewählt: Beide Punkte liegen auf Kästchenecken. Tippe erneut, um ein neues Dreieck anzulegen.';
    if (!placed) { placed = true; right.querySelector('.sl-q').classList.remove('hidden'); }
  }

  g.el.addEventListener('pointerdown', (e) => {
    if (locked) { info.textContent = 'Das Dreieck ist nach dem ersten Prüfen fest – du kannst nur noch die Zahlen verbessern.'; return; }
    e.preventDefault();
    let [t] = g.toData(e.clientX, e.clientY);
    t = Math.round(Math.min(seg.t1, Math.max(seg.t0, t)) / dT) * dT;
    t = Math.min(seg.t1, Math.max(seg.t0, t));
    if (pts.length >= 2) pts = [];
    if (pts.length === 1 && Math.abs(pts[0][0] - t) < 1e-9) return;
    pts.push([t, at(t)]);
    if (pts.length === 1) info.textContent = 'Jetzt den zweiten Punkt antippen. Je weiter auseinander, desto genauer.';
    drawTriangle();
  });
  info.textContent = `Der gelbe Bereich ist der Abschnitt von ${fmt(seg.t0)} s bis ${fmt(seg.t1)} s.`;

  questionBlock(right.querySelector('.sl-q'), qs, { onSolved, sig: task.sigCheck !== false });
  right.querySelector('.sl-q .btn-check').addEventListener('click', () => { locked = true; });
  return { destroy: () => L.destroy() };
}
