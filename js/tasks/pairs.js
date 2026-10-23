// Aufgabentyp R: Verbinden [W30]. Links drei t-x-Diagramme, rechts drei t-vₓ-Diagramme (gemischt).
// Mit dem Finger eine Linie von links nach rechts ziehen (oder links antippen, dann rechts antippen).
// Geld wie A: nur beim ersten Prüfen alles richtig → voller Lohn, sonst 0 € (nach Korrektur geht es weiter).
//
// Ticket-Feld "task":
// { "type":"pairs", "left":"xt", "right":"vt", "prompt":"…", "paper":"…",
//   "items":[ { "x0":0, "segments":[ { "dt":6, "v":2 } ] }, … (genau 3) ] }

import { buildWorld, series } from '../engine/kinematics.js';
import { drawGraph, KINDS } from '../render/graph.js';
import { shuffle } from './match.js';

const LET = ['1', '2', '3'], RLET = ['A', 'B', 'C'];

export function mount(root, { ticket, onSolved }) {
  const task = ticket.task, LK = task.left ?? 'xt', RK = task.right ?? 'vt';
  const actors = task.items.map((it) => buildWorld({ actors: [{ id: 'a', x0: it.x0 ?? 0, segments: it.segments }] }).actors.get('a'));
  const tMax = Math.max(...actors.map((a) => a.tEnd));
  const order = shuffle([0, 1, 2], ticket.id + 'R'); // rechts: order[j] = Bewegung in Zeile j
  const range = (kind) => {
    const ys = actors.flatMap((a) => series(a, KINDS[kind].q).flat().map((p) => p[1]));
    return [Math.min(0, ...ys), Math.max(0, ...ys)];
  };
  const yL = range(LK), yR = range(RK);

  root.innerHTML = `<div class="pairs">
    <p class="prompt pairs-prompt"></p>${task.paper ? '<p class="pairs-paper"></p>' : ''}
    <div class="pairs-grid">${[0, 1, 2].map((i) => `
      <figure class="graph-card pair-card" data-side="L" data-i="${i}"><span class="pair-tag">${LET[i]}</span><span class="pair-dot"></span></figure>
      <div class="pair-gap"></div>
      <figure class="graph-card pair-card" data-side="R" data-i="${i}"><span class="pair-tag">${RLET[i]}</span><span class="pair-dot"></span></figure>`).join('')}
      <svg class="pairs-lines"></svg>
    </div>
    <div class="pairs-foot"><div class="feedback" aria-live="polite"></div>
      <button class="btn pairs-reset" type="button">Neu</button><button class="btn btn-check" type="button">Prüfen</button></div>
  </div>`;
  root.querySelector('.pairs-prompt').textContent = task.prompt ?? 'Welches t-vₓ-Diagramm gehört zu welchem t-x-Diagramm? Zieh mit dem Finger eine Linie von links nach rechts.';
  if (task.paper) root.querySelector('.pairs-paper').textContent = `✎ ${task.paper}`;
  const grid = root.querySelector('.pairs-grid'), lines = root.querySelector('.pairs-lines');
  const cards = [...root.querySelectorAll('.pair-card')];
  const card = (side, i) => cards.find((c) => c.dataset.side === side && Number(c.dataset.i) === i);

  // Diagramme zeichnen, sobald das Layout steht
  function drawAll() {
    for (const c of cards) {
      c.querySelector('svg')?.remove();
      const L = c.dataset.side === 'L', i = Number(c.dataset.i), a = actors[L ? i : order[i]], kind = L ? LK : RK;
      const H = Math.max(70, Math.round(c.clientHeight)), W = Math.max(150, Math.round(c.clientWidth));
      const g = drawGraph(kind, series(a, KINDS[kind].q), { tMax, yRange: L ? yL : yR, width: W, height: H, compact: true, yCount: H < 120 ? 2 : 4 });
      c.prepend(g.el);
    }
    drawLines();
  }

  // ---------- Verbindungen ----------
  const link = [null, null, null]; // link[i] = rechte Zeile j für linke Zeile i
  let done = false, attempts = 0, temp = null, pick = null, marks = null;
  const NS = 'http://www.w3.org/2000/svg';
  const dotPos = (side, i) => {
    const g = grid.getBoundingClientRect(), r = card(side, i).querySelector('.pair-dot').getBoundingClientRect();
    return [r.left + r.width / 2 - g.left, r.top + r.height / 2 - g.top];
  };
  function line(a, b, cls) {
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', a[0]); l.setAttribute('y1', a[1]); l.setAttribute('x2', b[0]); l.setAttribute('y2', b[1]);
    l.setAttribute('class', cls); lines.appendChild(l);
  }
  function drawLines() {
    const g = grid.getBoundingClientRect();
    lines.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
    lines.innerHTML = '';
    link.forEach((j, i) => { if (j !== null) line(dotPos('L', i), dotPos('R', j), `pair-line${marks ? (marks[i] ? ' ok' : ' bad') : ''}`); });
    if (temp) line(temp.from, temp.to, 'pair-line temp');
    cards.forEach((c) => {
      const i = Number(c.dataset.i), L = c.dataset.side === 'L';
      c.classList.toggle('linked', L ? link[i] !== null : link.includes(i));
      c.classList.toggle('picked', !!pick && pick.side === c.dataset.side && pick.i === i);
    });
  }
  const connect = (a, b) => { // a, b: { side, i } mit verschiedenen Seiten
    const [l, r] = a.side === 'L' ? [a.i, b.i] : [b.i, a.i];
    for (let k = 0; k < 3; k++) if (link[k] === r) link[k] = null; // rechts nur eine Linie
    link[l] = r; marks = null;
  };
  const hit = (e) => {
    const c = document.elementFromPoint(e.clientX, e.clientY)?.closest('.pair-card');
    return c && root.contains(c) ? { side: c.dataset.side, i: Number(c.dataset.i) } : null;
  };
  let down = null;
  grid.addEventListener('pointerdown', (e) => {
    if (done) return;
    const h = hit(e); if (!h) return;
    e.preventDefault();
    down = { ...h, x: e.clientX, y: e.clientY, moved: false };
    grid.setPointerCapture(e.pointerId);
  });
  grid.addEventListener('pointermove', (e) => {
    if (!down) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) down.moved = true;
    if (!down.moved) return;
    const g = grid.getBoundingClientRect();
    temp = { from: dotPos(down.side, down.i), to: [e.clientX - g.left, e.clientY - g.top] };
    drawLines();
  });
  grid.addEventListener('pointerup', (e) => {
    if (!down) return;
    const h = hit(e), start = down; down = null; temp = null;
    if (start.moved) { if (h && h.side !== start.side) connect(start, h); pick = null; }
    else if (pick && pick.side !== start.side) { connect(pick, start); pick = null; }
    else pick = pick && pick.side === start.side && pick.i === start.i ? null : start;
    drawLines();
  });
  grid.style.touchAction = 'none';

  const fb = root.querySelector('.feedback');
  root.querySelector('.pairs-reset').addEventListener('click', () => { if (!done) { link.fill(null); marks = null; pick = null; drawLines(); } });
  root.querySelector('.btn-check').addEventListener('click', () => {
    if (done) return;
    if (link.includes(null)) { fb.className = 'feedback bad'; fb.textContent = 'Verbinde jedes t-x-Diagramm mit einem t-vₓ-Diagramm.'; return; }
    attempts++;
    marks = link.map((j, i) => order[j] === i);
    drawLines();
    if (marks.every(Boolean)) {
      done = true;
      fb.className = 'feedback ok';
      fb.textContent = attempts === 1 ? 'Alles richtig verbunden!' : 'Jetzt passt alles. Bezahlt wird nur der erste Versuch.';
      setTimeout(() => onSolved({ attempts, grade: attempts === 1 ? 'perfect' : 'fail' }), 1100);
      return;
    }
    fb.className = 'feedback bad';
    fb.textContent = `${marks.filter((m) => !m).length} Linie(n) falsch (rot). ${task.help ?? 'Steigung im t-x-Diagramm = vₓ: steil = schnell, waagrecht = steht, fallend = vₓ negativ.'}`;
  });

  const ro = new ResizeObserver(() => drawAll());
  ro.observe(grid);
  return { destroy: () => ro.disconnect() };
}
