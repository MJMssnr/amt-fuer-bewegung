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
  // Sekante [W48]: "secant": [t1, t2] → mittlere Steigung eines gekrümmten Stücks (Punkte fest vorgegeben, Ablesen mit Nachsicht)
  const sec = task.secant;
  // Tangente [W49]: "tangent": t* → Momentangeschwindigkeit; Spieler legt die Tangente selbst (zweiter Punkt frei)
  const tan = task.tangent;
  const seg = tan != null
    ? { t0: Math.max(0, tan - 1), t1: tan + 1, slope: quantityAt(actor, K.q === 'x' ? 'vx' : 'ax', tan) }
    : sec
    ? { t0: sec[0], t1: sec[1], slope: (quantityAt(actor, K.q, sec[1]) - quantityAt(actor, K.q, sec[0])) / (sec[1] - sec[0]) }
    : segmentSlope(actor, K.q, task.segment ?? 0);
  const isV = K.q === 'x' || K.q === 'y';
  const slopeName = tan != null ? 'Momentangeschwindigkeit vₓ' : sec ? (isV ? 'mittlere Geschwindigkeit v̄ₓ' : 'mittlere Beschleunigung āₓ') : isV ? 'Geschwindigkeit vₓ' : 'Beschleunigung aₓ';
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
  const P0 = tan != null ? [tan, quantityAt(actor, K.q, tan)] : null;
  let tanFails = 0, tanLine = null;

  const dT = g.tR.step / minorDiv(g.tR.step), dY = g.yR.step / minorDiv(g.yR.step);
  const onGrid = (v, d) => Math.abs(v / d - Math.round(v / d)) < 1e-6;
  const at = (t) => quantityAt(actor, K.q, t);

  const qs = [
    { label: 'Δt im Dreieck', unit: 's', truth: 0, help: 'Zähle die Kästchen der waagrechten Kathete und multipliziere mit dem Wert pro Kästchen.' },
    { label: `${dName} im Dreieck`, unit: K.unit, truth: 0, help: 'Senkrechte Kathete: Endwert minus Anfangswert. Geht es nach unten, ist das negativ.' },
    { label: slopeName, unit: slopeUnit, truth: seg.slope,
      hints: [{ value: -seg.slope, text: 'Achte aufs Vorzeichen: Fällt die Linie, ist die Steigung negativ.' },
        ...(Math.abs(seg.slope) > 1e-9 ? [{ value: 1 / seg.slope, text: `Umgekehrt! Steigung = ${dName} / Δt, nicht Δt / ${dName}.` }] : [])],
      help: `Steigung = ${dName} / Δt.`,
      follows: { vars: { dt: 0, d: 1 }, expr: 'd/dt' } }, // Folgefehler: mit den eigenen Kathetenwerten weiterrechnen [W48]
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
    if (sec) drawn.push(g.seg([a, b], 'g-seg sl-secant')); // Sekante sichtbar [W48]
    if (tan != null) { // Tangente: Gerade durch beide Punkte über das ganze Diagramm [W49]
      const m = (b[1] - a[1]) / (b[0] - a[0]), y = (t) => a[1] + m * (t - a[0]);
      let t1 = g.tR.lo, t2 = g.tR.hi;
      if (Math.abs(m) > 1e-9) { const ta = a[0] + (g.yR.lo - a[1]) / m, tb = a[0] + (g.yR.hi - a[1]) / m; t1 = Math.max(t1, Math.min(ta, tb)); t2 = Math.min(t2, Math.max(ta, tb)); }
      drawn.push(g.seg([[t1, y(t1)], [t2, y(t2)]], 'g-seg sl-tangent'));
      tanLine = m;
    }
    drawn.push(g.note([(a[0] + c[0]) / 2, c[1]], 'Δt = ?', 'g-note leg', [0, b[1] > a[1] ? 14 : -6]));
    drawn.push(g.note(c, `${dName} = ?`, 'g-note leg', [28, (b[1] > a[1] ? -1 : 1) * 14]));
    pts.forEach((p) => drawn.push(g.dot(p)));
    qs[0].truth = b[0] - a[0];
    qs[0].tol = Math.max(sigTolerance(qs[0].truth), dT / 2);
    qs[1].truth = b[1] - a[1];
    qs[1].tol = Math.max(sigTolerance(qs[1].truth), sec || tan != null ? dY : dY / 2); // Kurve: auf ein Kästchen genau ablesen
    const bad = [a, b].filter(([t, y]) => !onGrid(y, dY)).length;
    info.textContent = tan != null
      ? 'Berührt deine Gerade die Kurve im Punkt P nur (ohne sie zu schneiden)? Dann lies Δt und Δx am Dreieck ab. Neuer Punkt: einfach woanders tippen.'
      : sec
      ? `Die Punkte bei t = ${fmt(sec[0])} s und t = ${fmt(sec[1])} s liegen fest. Lies x an beiden Stellen so genau wie möglich ab – auf ein Kästchen genau reicht.`
      : bad
      ? 'Tipp: Mindestens ein Punkt liegt nicht auf einer Kästchenecke. Dann wird das Ablesen ungenau – such dir lieber Punkte, wo die Linie genau durch eine Ecke geht.'
      : 'Gut gewählt: Beide Punkte liegen auf Kästchenecken. Tippe erneut, um ein neues Dreieck anzulegen.';
    if (!placed) { placed = true; right.querySelector('.sl-q').classList.remove('hidden'); }
  }

  g.el.addEventListener('pointerdown', (e) => {
    if (sec) return; // Sekante: Punkte liegen fest
    if (tan != null) {
      if (locked) { info.textContent = 'Das Dreieck ist nach dem Prüfen fest – du kannst nur noch die Zahlen verbessern.'; return; }
      e.preventDefault();
      let [t, y] = g.toData(e.clientX, e.clientY);
      t = Math.round(Math.min(g.tR.hi, Math.max(g.tR.lo, t)) / dT) * dT;
      y = Math.round(Math.min(g.yR.hi, Math.max(g.yR.lo, y)) / dY) * dY;
      if (Math.abs(t - P0[0]) < 1e-9) return;
      pts = [P0, [t, y]]; drawTriangle(); return;
    }
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
  if (sec) { pts = [[sec[0], at(sec[0])], [sec[1], at(sec[1])]]; drawTriangle(); }
  if (tan != null) { pts = [P0]; drawn.push(g.dot(P0), g.note(P0, 'P', 'g-note leg', [-10, -10])); info.textContent = `P liegt bei t = ${fmt(tan)} s auf der Kurve. Tippe einen zweiten Punkt an, so dass die Gerade durch P die Kurve dort nur berührt (Tangente).`; }

  const done = (r) => onSolved(tanFails && r.grade === 'perfect' ? { ...r, grade: 'partial' } : r);
  questionBlock(right.querySelector('.sl-q'), qs, { onSolved: done, sig: task.sigCheck !== false });
  right.querySelector('.sl-q .btn-check').addEventListener('click', (e) => {
    if (tan != null && tanLine != null) { // Ist das wirklich eine Tangente? Großzügig: ±15 % bzw. ±0,3 m/s [W49]
      const v = seg.slope, ok = Math.abs(tanLine - v) <= Math.max(0.15 * Math.abs(v), 0.3);
      if (!ok) {
        e.stopImmediatePropagation(); tanFails++;
        const fb = right.querySelector('.sl-q .feedback');
        fb.className = 'feedback bad';
        fb.textContent = `Deine Gerade ist noch keine Tangente – sie ist zu ${tanLine > v ? 'steil' : 'flach'} und schneidet die Kurve. Tippe einen neuen zweiten Punkt an.`;
        return;
      }
    }
    locked = true;
  }, true);
  return { destroy: () => L.destroy() };
}
