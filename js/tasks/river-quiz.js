// Quiz nach dem Fluss-Labor [W34]: 1× Rechnen, 1× Verständnis, 2× Diagramm (t-x und t-vₓ auswählen).
// Bausteine der bekannten Typen: Rechenblock wie H (questions.js), Auswahl wie G, Diagramme wie A.
// Bewertung: alles beim ersten Versuch → perfect; sonst partial; „Lösung zeigen“ beim Rechnen → fail.
//
// quiz (optional im Ticket): { "vb":6, "vf":2, "L":80 }  – Zahlen für Rechnung und Diagramme

import { tripPlan } from '../engine/river.js';
import { buildWorld, series } from '../engine/kinematics.js';
import { drawGraph, KINDS } from '../render/graph.js';
import { questionBlock } from './questions.js';
import { addSignButtons } from '../ui/signbtn.js';
import { shuffle } from './match.js';

const f1 = (v) => v.toFixed(1).replace('.', ',');

export function startQuiz(box, cfg, onSolved, seed) {
  const vb = cfg.vb ?? 6, vf = cfg.vf ?? 2, L = cfg.L ?? 80, p = tripPlan(vb, vf, L);
  let errors = 0, step = 0;
  box.innerHTML = '<p class="prompt rv-qhead"></p><div class="rv-q"></div>';
  const head = box.querySelector('.rv-qhead'), q = box.querySelector('.rv-q');
  const next = () => { step++; [calc, why, xt, vt, done][step - 1](); };

  function calc() {
    head.textContent = `Quiz 1/4 – Rechnen: Boot ${f1(vb)} m/s, Strömung ${f1(vf)} m/s, ${L} m flussauf und zurück.`;
    q.innerHTML = '';
    questionBlock(q, [{ label: 'Durchschnittsgeschwindigkeit', symbol: 'v̄', unit: 'm/s', truth: p.avg,
      hints: [{ value: vb, text: 'Das wäre ohne Strömung richtig. Rechne t₁ und t₂ getrennt aus!' }],
      help: `t₁ = ${L} m / ${f1(vb - vf)} m/s, t₂ = ${L} m / ${f1(vb + vf)} m/s, v̄ = ${2 * L} m / (t₁ + t₂)` }], {
      rule: false,
      onSolved: ({ grade }) => { if (grade === 'fail') return onSolved({ attempts: errors + 3, grade: 'fail' }); if (grade !== 'perfect') errors++; next(); },
    });
    addSignButtons(q);
  }
  function choice(title, opts, render) {
    head.textContent = title;
    q.innerHTML = '<div class="rv-choices"></div><div class="feedback"></div>';
    const list = q.querySelector('.rv-choices'), fb = q.querySelector('.feedback');
    let wrongHere = 0;
    shuffle(opts.map((o, i) => ({ ...o, i })), `${seed}${step}`).forEach((o) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'rv-choice';
      list.appendChild(b);
      render(b, o);
      b.addEventListener('click', () => {
        if (b.disabled) return;
        if (!o.correct) { wrongHere++; b.disabled = true; b.classList.add('wrong'); fb.className = 'feedback bad'; fb.textContent = o.feedback ?? 'Nicht ganz.'; return; }
        if (wrongHere) errors++;
        b.classList.add('right'); list.querySelectorAll('.rv-choice').forEach((x) => (x.disabled = true));
        fb.className = 'feedback ok'; fb.textContent = o.explain ?? 'Richtig!';
        setTimeout(next, 1300);
      });
    });
  }
  function why() {
    choice('Quiz 2/4 – Verständnis: Warum gleicht sich die Strömung nicht aus?', [
      { text: 'Flussauf ist das Boot langsamer und deshalb länger unterwegs. Die lange langsame Phase zählt mehr als die kurze schnelle.', correct: true, explain: 'Genau: Der Schnitt ist zeitgewichtet – und flussauf vergeht viel mehr Zeit.' },
      { text: 'Sie gleicht sich doch aus: Man verliert flussauf genauso viel, wie man flussab gewinnt.', feedback: 'Das ist die typische Fehlvorstellung. Schau ins Fahrtenbuch: v̄ ist kleiner als v_Boot!' },
      { text: 'Weil die Strömung flussauf stärker ist als flussab.', feedback: 'Die Strömung ist überall gleich stark. Es liegt an der Zeit, nicht an der Strömung.' },
      { text: 'Weil das Boot flussab langsamer ist als flussauf.', feedback: 'Umgekehrt: Flussab ist es schneller (v_Boot + v_Fluss).' },
    ], (b, o) => (b.textContent = o.text));
  }
  // Diagramm-Fahrten: richtig, symmetrisch (Fehlvorstellung), vertauscht
  const trips = [
    { correct: true, seg: [{ dt: p.t1, v: vb - vf }, { dt: p.t2, v: -(vb + vf) }], explain: 'Richtig: flussauf flach und lang, flussab steil und kurz.' },
    { seg: [{ dt: p.T / 2, v: (2 * L) / p.T }, { dt: p.T / 2, v: -(2 * L) / p.T }], feedback: 'Symmetrisch wäre es nur ohne Strömung. Flussauf dauert es länger!' },
    { seg: [{ dt: p.t2, v: vb + vf }, { dt: p.t1, v: -(vb - vf) }], feedback: 'Vertauscht: Flussauf (hin) ist das Boot langsamer, nicht schneller.' },
  ];
  const graphBtn = (kind) => (b, o) => {
    const a = buildWorld({ actors: [{ id: 'a', x0: 0, segments: o.seg }] }).actors.get('a');
    const tMax = Math.max(...trips.map((tr) => tr.seg[0].dt + tr.seg[1].dt));
    const yR = kind === 'xt' ? [0, L] : [-(vb + vf), vb + vf];
    const W = Math.max(200, Math.round(b.clientWidth - 20)), H = 84; // Einheiten = Pixel: Beschriftung bleibt lesbar
    b.appendChild(drawGraph(kind, series(a, KINDS[kind].q), { tMax, yRange: yR, width: W, height: H, compact: true, yCount: 2 }).el);
  };
  const xt = () => choice('Quiz 3/4 – Welches t-x-Diagramm passt zur Fahrt (hin flussauf, zurück flussab)?', trips, graphBtn('xt'));
  const vt = () => choice('Quiz 4/4 – Welches t-vₓ-Diagramm passt? (x-Achse zeigt flussauf)', trips, graphBtn('vt'));
  function done() {
    head.textContent = errors ? 'Quiz geschafft!' : 'Quiz fehlerfrei geschafft!';
    q.innerHTML = `<div class="feedback ok">Merke: Strömung (oder Gegenwind) macht eine Hin-und-zurück-Fahrt immer langsamer. Bei ${f1(vb)} m/s und ${f1(vf)} m/s Strömung: v̄ = ${f1(p.avg)} m/s statt ${f1(vb)} m/s.</div>`;
    setTimeout(() => onSolved({ attempts: errors + 1, grade: errors ? 'partial' : 'perfect' }), 1600);
  }
  next();
}
