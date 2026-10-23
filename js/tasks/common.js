// Gemeinsame linke Spalte aller Aufgabentypen: Animation, gegebene Diagramme, Datenblatt, Notizzettel.
// given: Liste aus "anim", "data" und Diagrammarten ("xt", "vt", "at", …)

import { series } from '../engine/kinematics.js';
import { drawGraph, KINDS } from '../render/graph.js';
import { Scene } from '../render/scene.js';
import { fmt } from '../render/format.js';

/**
 * Zeichnet ein Diagramm passend zum Seitenverhältnis seines (bereits eingehängten) Kastens,
 * damit breite Kästen nicht mit einem kleinen, schmalen Diagramm gefüllt werden.
 */
export function graphInto(card, kind, pieces, opts = {}) {
  const r = card.clientWidth / Math.max(1, card.clientHeight);
  const H = 200;
  const W = Number.isFinite(r) && r > 0 ? Math.round(Math.min(600, Math.max(240, H * r))) : 320;
  const g = drawGraph(kind, pieces, { ...opts, width: W, height: H });
  card.appendChild(g.el);
  return g;
}

/** Datenblatt einer Bewegung, wie es Florian notiert hätte. */
function dataSheet(world) {
  const box = document.createElement('div');
  box.className = 'data-sheet';
  for (const a of world.actors.values()) {
    const name = a.def.name ?? a.id;
    const rows = a.pieces.map((p, i) => {
      const seg = a.def.segments[i];
      const t = `${fmt(p.t0)} s – ${fmt(p.t1)} s`;
      let what;
      if (Math.abs(p.a[0]) < 1e-9) what = Math.abs(p.v0[0]) < 1e-9 ? 'steht (vₓ = 0)' : `vₓ = ${fmt(p.v0[0])} m/s`;
      else what = `aₓ = ${fmt(p.a[0])} m/s²${p.index === 0 || p.jump ? `, Start mit vₓ = ${fmt(p.v0[0])} m/s` : ''}`;
      const dur = seg.until === 'rest' ? '(bis zum Stillstand)' : '';
      return `<tr><td>${seg.until === 'rest' ? `ab ${fmt(p.t0)} s` : t}</td><td>${what} ${dur}</td></tr>`;
    });
    box.insertAdjacentHTML('beforeend',
      `<div class="ds-actor"><strong>${name}</strong> <span>Start bei x₀ = ${fmt(a.pieces[0].r0[0])} m</span>
       <table>${rows.join('')}</table></div>`);
  }
  return box;
}

/**
 * Baut die linke Spalte in `left` auf.
 * Rückgabe: { cursors: [...], addCursor(g), scene, destroy() }
 */
export function buildLeft(left, { ticket, world, actor }) {
  const task = ticket.task;
  const given = task.given ?? ['anim'];
  const cursors = [];
  let scene = null;

  if (given.includes('anim')) {
    left.insertAdjacentHTML('beforeend', `
      <div class="scene-wrap">
        <canvas class="scene" aria-label="Animation der Bewegung"></canvas>
        <div class="scene-ctrl">
          <button class="btn btn-play" aria-label="Abspielen">▶</button>
          <input class="scrub" type="range" min="0" max="${world.tEnd}" step="0.01" value="0" aria-label="Zeit">
        </div>
      </div>`);
  }
  const graphs = document.createElement('div');
  graphs.className = 'given';
  left.appendChild(graphs);
  const kinds = given.filter((g) => KINDS[g]);
  const cards = kinds.map(() => {
    const card = document.createElement('figure');
    card.className = 'graph-card given-card';
    graphs.appendChild(card);
    return card;
  });
  if (given.includes('data')) graphs.appendChild(dataSheet(world));
  if (!graphs.children.length) graphs.classList.add('empty');

  const paper = task.paper ?? (given.length === 1 && given[0] === 'anim'
    ? 'Spiel die Animation ab und notiere für jeden Abschnitt Dauer und Geschwindigkeit, bevor du antwortest.'
    : null);
  if (paper) {
    left.insertAdjacentHTML('beforeend', `<div class="paper-note"><strong>✎ Auf Papier</strong><span></span></div>`);
    left.querySelector('.paper-note span').textContent = paper;
  }
  // erst jetzt zeichnen, wenn das Layout steht
  kinds.forEach((k, i) => cursors.push(graphInto(cards[i], k, series(actor, KINDS[k].q), { tMax: world.tEnd, compact: true })));

  if (given.includes('anim')) {
    const scrub = left.querySelector('.scrub');
    const playBtn = left.querySelector('.btn-play');
    scene = new Scene(left.querySelector('.scene'), world, {
      onTime: (t) => { scrub.value = t; cursors.forEach((c) => c.setCursor(t)); },
    });
    scene.onEnd = () => (playBtn.textContent = '▶');
    playBtn.addEventListener('click', () => {
      if (scene.playing) { scene.pause(); playBtn.textContent = '▶'; }
      else { scene.play(); playBtn.textContent = '⏸'; }
    });
    scrub.addEventListener('input', () => { scene.pause(); playBtn.textContent = '▶'; scene.setTime(Number(scrub.value)); });
    setTimeout(() => { if (!scene.destroyed) { scene.play(); playBtn.textContent = '⏸'; } }, 400);
  }

  return {
    cursors,
    scene,
    addCursor: (g) => cursors.push(g),
    destroy: () => { if (scene) { scene.destroyed = true; scene.destroy(); } },
  };
}

/** Grundgerüst: linke und rechte Spalte. */
export function frame(root) {
  root.innerHTML = '<div class="task-body"><div class="task-left"></div><div class="task-right"></div></div>';
  return { left: root.querySelector('.task-left'), right: root.querySelector('.task-right') };
}

export const actorOf = (world, task) => world.actors.get(task.actor ?? [...world.actors.keys()][0]);
