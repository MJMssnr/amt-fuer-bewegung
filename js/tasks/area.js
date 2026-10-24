// Aufgabentyp K: Flächen-Puzzle. Die Fläche unter dem t-vₓ-Graphen ist in Rechtecke und Dreiecke zerlegt.
// Schüler berechnen jede Teilfläche (mit Vorzeichen!), dann Δx und ggf. Endort oder Weg.
//
// Ticket-Feld "task":
// { "type":"area", "actor":"jo", "given":["anim"], "graph":"vt", "from":0, "to":9,
//   "ask":["pieces","dx","xend","path"], "prompt":"…", "paper":"…" }

import { series } from '../engine/kinematics.js';
import { areaPieces, centroid } from '../engine/geometry.js';
import { KINDS } from '../render/graph.js';
import { fmt as fmtRaw } from '../render/format.js';
import { atLeast2 } from '../engine/sigfig.js';

const fmt = (v) => atLeast2(fmtRaw(v), v); // nie nur 1 g.Z. [W18]
import { buildLeft, frame, actorOf, graphInto } from './common.js';
import { questionBlock } from './questions.js';

const SUB = '₀₁₂₃₄₅₆₇₈₉';
const sub = (n) => String(n).split('').map((d) => SUB[d]).join('');

export function mount(root, { ticket, world, onSolved }) {
  const task = ticket.task;
  const actor = actorOf(world, task);
  const kind = task.graph ?? 'vt';
  const K = KINDS[kind];
  const t1 = task.from ?? 0, t2 = task.to ?? world.tEnd;
  const ask = task.ask ?? ['pieces', 'dx'];
  const { left, right } = frame(root);
  const L = buildLeft(left, { ticket, world, actor });
  const pieces = areaPieces(actor, K.q, t1, t2);

  right.innerHTML = '<p class="prompt"></p><figure class="graph-card axes-card area-card"></figure>';
  right.querySelector('.prompt').textContent = task.prompt
    ?? `Die Fläche unter dem ${K.title} ist zerlegt. Berechne jede Teilfläche – sie ist die Ortsänderung in diesem Stück.`;
  const g = graphInto(right.querySelector('.area-card'), kind, series(actor, K.q), { tMax: world.tEnd });
  L.addCursor(g);
  pieces.forEach((p, i) => {
    g.shape(p.pts, `g-area g-area-${i % 4}${p.area < 0 ? ' neg' : ''}`);
    g.note(centroid(p.pts), `A${sub(i + 1)}`, 'g-area-label', [0, 4]);
  });
  if (t1 > 0) g.seg([[t1, g.yR.lo], [t1, g.yR.hi]], 'g-limit');
  if (t2 < world.tEnd) g.seg([[t2, g.yR.lo], [t2, g.yR.hi]], 'g-limit');

  const sumAbs = pieces.reduce((s, p) => s + Math.abs(p.area), 0);
  const dx = pieces.reduce((s, p) => s + p.area, 0);
  const x0 = actor.pieces[0].r0[0];
  const xAt1 = x0 + areaPieces(actor, K.q, 0, t1).reduce((s, p) => s + p.area, 0);
  const qs = [];
  if (ask.includes('pieces')) {
    pieces.forEach((p, i) => qs.push({
      label: `Teilfläche A${sub(i + 1)}`, unit: 'm', truth: p.area,
      hints: [{ value: -p.area, text: p.area < 0
        ? 'Diese Fläche liegt unter der t-Achse (vₓ < 0). Ihr Beitrag zu Δx ist negativ.'
        : 'Diese Fläche liegt über der t-Achse, ihr Beitrag ist positiv.' },
      ...(p.kind === 'tri' ? [{ value: 2 * p.area, text: 'Dreieck! Die Fläche ist ½ · Grundseite · Höhe.' }] : [])],
      help: p.kind === 'tri' ? 'Dreieck: A = ½ · Δt · Δvₓ. Lies Grundseite und Höhe an den Kästchen ab.' : 'Rechteck: A = Δt · vₓ.',
    }));
  }
  if (ask.includes('dx')) qs.push({
    label: `Ortsänderung Δx von ${fmt(t1)} s bis ${fmt(t2)} s`, unit: 'm', truth: dx,
    hints: Math.abs(sumAbs - dx) > 1e-6 ? [{ value: sumAbs, text: 'Das ist der zurückgelegte Weg. Für Δx zählen Flächen unter der t-Achse negativ!' }] : [],
    help: 'Δx ist die Summe aller Teilflächen, mit Vorzeichen.',
  });
  if (ask.includes('xend')) qs.push({
    label: `Ort x bei t = ${fmt(t2)} s`, unit: 'm', truth: xAt1 + dx,
    hints: Math.abs(xAt1) > 1e-6 ? [{ value: dx, text: `Das ist nur Δx. Gesucht ist der Ort: x = x(${fmt(t1)} s) + Δx.` }] : [],
    help: `Startort plus Ortsänderung: x = x(${fmt(t1)} s) + Δx. Der Startort steht im Datenblatt oder in der Animation.`,
  });
  if (ask.includes('path')) qs.push({
    label: 'zurückgelegter Weg s', unit: 'm', truth: sumAbs,
    hints: Math.abs(sumAbs - dx) > 1e-6 ? [{ value: dx, text: 'Das ist Δx. Für den Weg zählt jedes Stück positiv, auch das Zurücklaufen.' }] : [],
  });

  // Folgefehler [W49]: Δx = Summe DEINER Teilflächen, Endort = Start + DEIN Δx, Weg = Summe der Beträge deiner Teilflächen
  const nP = ask.includes('pieces') ? pieces.length : 0;
  if (nP) {
    const vars = Object.fromEntries(pieces.map((_, i) => [`p${i}`, i]));
    const names = pieces.map((_, i) => `p${i}`);
    const iDx = qs.findIndex((q) => q.label.startsWith('Ortsänderung'));
    if (iDx >= 0) qs[iDx].follows = { vars, expr: names.join('+') };
    const iPath = qs.findIndex((q) => q.label === 'zurückgelegter Weg s');
    if (iPath >= 0) qs[iPath].follows = { vars, expr: names.map((n) => `abs(${n})`).join('+') };
  }
  const iX = qs.findIndex((q) => q.label.startsWith('Ort x bei'));
  const iD = qs.findIndex((q) => q.label.startsWith('Ortsänderung'));
  if (iX >= 0 && iD >= 0) qs[iX].follows = { vars: { d: iD }, expr: `${Math.round(xAt1 * 1e6) / 1e6}+d` };
  questionBlock(right, qs, { onSolved, sig: task.sigCheck !== false });
  return { destroy: () => L.destroy() };
}
