// Aufgabentyp D: Regie (Variante a) [W17]. Das Drehbuch verlangt Ereignisse (Ort zu einer Zeit, Begegnung).
// Der Schüler stellt für bestimmte Akteure Startort x₀, Startzeit t₀ und vₓ ein, ruft „Action!“ und sieht,
// ob die Szene klappt. Im t-x-Diagramm stehen feste Akteure und die Drehbuch-Punkte als Planungshilfe.
//
// Ticket-Feld "task":
// { "type":"direct", "tEnd":25,
//   "controls":[ { "actor":"jo", "fields":["x0","v"] } ],          // einstellbar: x0, t0, v
//   "events":[ { "type":"at", "actor":"jo", "t":10, "x":160, "label":"Kamera 1: …" },
//              { "type":"meet", "a":"kevin", "b":"jo", "t":20, "x":120, "label":"Kamera 2: …" } ],
//   "tolX":2, "tolT":0.5, "prompt":"…", "paper":"…", "hints":{ "jo.v": [ { "value":4, "text":"…" } ] } }
// Feste Werte (z. B. Kevins vₓ, Jos t₀) kommen aus dem Szenario.

import { series } from '../engine/kinematics.js';
import { runTake } from '../engine/direct.js';
import { matchHint } from '../engine/answer.js';
import { atLeast2 } from '../engine/sigfig.js';
import { Scene } from '../render/scene.js';
import { fmt as fmtRaw, parseNum } from '../render/format.js';
import { frame, graphInto } from './common.js';

const fmt = (v) => atLeast2(fmtRaw(v), v);
const FIELD = { x0: ['Startort x₀', 'm'], t0: ['Startzeit t₀', 's'], v: ['Geschwindigkeit vₓ', 'm/s'] };

export function mount(root, { ticket, world, onSolved }) {
  const task = ticket.task;
  const base = { actors: [...world.actors.values()].map((a) => a.def) };
  const tEnd = task.tEnd ?? world.tEnd;
  const tol = { tolX: task.tolX ?? 2, tolT: task.tolT ?? 0.5 };
  const controlled = new Set(task.controls.map((c) => c.actor));
  const name = (id) => world.actors.get(id)?.def.name ?? id;
  const { left, right } = frame(root);

  // ---------- linke Spalte: Filmset ----------
  left.innerHTML = `<div class="scene-wrap"><canvas class="scene" aria-label="Filmset"></canvas>
      <div class="scene-ctrl"><button class="btn btn-play" type="button">▶</button><span class="dr-clap">🎬 Probe: noch nichts eingestellt</span></div></div>
    <div class="paper-note"><strong>✎ Auf Papier</strong><span></span></div>`;
  left.querySelector('.paper-note span').textContent = task.paper
    ?? 'Trage die Drehbuch-Punkte ins t-x-Diagramm ein und zeichne die Geraden. Steigung = vₓ, Achsenabschnitt = x₀.';

  // ---------- rechte Spalte: Drehbuch, Plan, Regler ----------
  const fixedRows = [...world.actors.values()].filter((a) => !controlled.has(a.id)).map((a) => {
    const p = a.pieces.find((q) => Math.abs(q.v0[0]) > 1e-9) ?? a.pieces[0];
    return `<li><b>${name(a.id)}</b> (steht fest): startet bei x₀ = ${fmt(a.pieces[0].r0[0])} m${p.t0 > 0 ? `, fährt los bei t = ${fmt(p.t0)} s` : ' bei t = 0'} mit vₓ = ${fmt(p.v0[0])} m/s</li>`;
  }).join('');
  const ctlFixed = task.controls.map((c) => {
    const d = world.actors.get(c.actor).def;
    const t0 = d.t0 ?? 0;
    return !c.fields.includes('t0') ? `<li><b>${name(c.actor)}</b>: startet bei t = ${fmt(t0)} s – den Rest bestimmst du.</li>` : '';
  }).join('');
  right.innerHTML = `<p class="prompt"></p>
    <div class="drehbuch"><div class="db-head">🎬 Drehbuch</div><ol class="db-events">${task.events.map((e) => `<li>${e.label}</li>`).join('')}</ol>
      <ul class="db-cast">${fixedRows}${ctlFixed}</ul></div>
    <figure class="graph-card axes-card dr-card"></figure>
    <form class="calc-list dr-inputs" autocomplete="off">${task.controls.map((c) => c.fields.map((f) => `
      <label class="calc-row"><span class="calc-label">${name(c.actor)}: ${FIELD[f][0]}</span>
        <span class="calc-input"><input inputmode="decimal" data-key="${c.actor}.${f}"><span class="unit">${FIELD[f][1]}</span></span>
        <span class="calc-mark" aria-hidden="true"></span></label>`).join('')).join('')}</form>
    <div class="calc-actions"><button class="btn btn-check dr-action" type="button">Klappe – Action! 🎬</button>
      <button class="btn btn-reveal hidden" type="button">Lösung zeigen</button></div>
    <div class="feedback" aria-live="polite"></div>`;
  right.querySelector('.prompt').textContent = task.prompt ?? 'Stell die Szene so ein, dass alles nach Drehbuch passiert.';

  // Plan: t-x-Diagramm mit festen Akteuren und Drehbuch-Punkten
  const xs = [...task.events.map((e) => e.x), ...[...world.actors.values()].flatMap((a) => series(a, 'x').flat().map((p) => p[1]))];
  const g = graphInto(right.querySelector('.dr-card'), 'xt',
    [...world.actors.values()].filter((a) => !controlled.has(a.id)).flatMap((a) => series(a, 'x')),
    { tMax: tEnd, yRange: [Math.min(0, ...xs), Math.max(...xs) * 1.1] });
  task.events.forEach((e, i) => { g.dot([e.t, e.x], 'g-dot dr-star', 5); g.note([e.t, e.x], `${i + 1}`, 'g-note dr-num', [0, -9]); });

  const inputs = [...right.querySelectorAll('.dr-inputs input')];
  const fb = right.querySelector('.feedback');
  const clap = left.querySelector('.dr-clap');
  const playBtn = left.querySelector('.btn-play');
  let scene = null, takes = 0, done = false, mine = null;

  const showScene = (w, hideControlled = false) => {
    scene?.destroy();
    // Vor der ersten Klappe sind die einstellbaren Akteure noch nicht am Set
    scene = new Scene(left.querySelector('.scene'), w, { onTime: (t) => g.setCursor(t), ghost: hideControlled ? controlled : undefined });
    if (hideControlled) scene.ghostAlpha = 0;
    scene.onEnd = () => (playBtn.textContent = '▶');
    scene.draw();
    return scene;
  };
  showScene(world, true);
  playBtn.addEventListener('click', () => {
    if (scene.playing) { scene.pause(); playBtn.textContent = '▶'; }
    else { if (scene.t >= tEnd - 1e-3) scene.setTime(0); scene.play(); playBtn.textContent = '⏸'; }
  });

  const read = () => {
    const values = {};
    for (const inp of inputs) {
      const [id, f] = inp.dataset.key.split('.');
      const n = parseNum(inp.value);
      if (!Number.isFinite(n)) return null;
      (values[id] ??= {})[f] = n;
    }
    return values;
  };

  function action() {
    if (done) return;
    const values = read();
    if (!values) { fb.className = 'feedback bad'; fb.textContent = 'Erst alle Werte einstellen, dann „Action!“.'; return; }
    takes++;
    const { world: w, results } = runTake(base, values, tEnd, task.events, tol);
    mine?.remove();
    mine = g.overlay([...controlled].flatMap((id) => series(w.actors.get(id), 'x')), 'g-trace-direct');
    clap.textContent = `🎬 Klappe, die ${takes}.`;
    fb.className = 'feedback'; fb.textContent = 'Kamera läuft …';
    const btn = right.querySelector('.dr-action');
    btn.disabled = true;
    const sc = showScene(w);
    sc.setTime(0); sc.play(); playBtn.textContent = '⏸';
    sc.onEnd = () => { playBtn.textContent = '▶'; judge(results, values); };
  }

  function judge(results, values) {
    const btn = right.querySelector('.dr-action');
    const lines = results.map((r, i) => {
      const what = r.ev.type === 'meet'
        ? (Number.isFinite(r.t) ? `Begegnung bei t ≈ ${fmt(round1(r.t))} s und x ≈ ${fmt(round1(r.x))} m` : 'keine Begegnung')
        : `${name(r.ev.actor)} war bei t = ${fmt(r.ev.t)} s bei x ≈ ${fmt(round1(r.x))} m`;
      return `${r.ok ? '✅' : '❌'} Szene ${i + 1}: ${what}`;
    });
    if (results.every((r) => r.ok)) {
      done = true;
      fb.className = 'feedback ok';
      fb.innerHTML = `Im Kasten! ${takes === 1 ? 'Gleich die erste Klappe sitzt.' : `Nach ${takes} Klappen sitzt die Szene.`}<br>${lines.join('<br>')}`;
      inputs.forEach((i) => (i.disabled = true));
      btn.textContent = 'Im Kasten ✓';
      setTimeout(() => onSolved({ attempts: takes, grade: takes === 1 ? 'perfect' : 'partial' }), 600);
      return;
    }
    const tips = [];
    for (const inp of inputs) {
      const h = matchHint(parseNum(inp.value), task.hints?.[inp.dataset.key]);
      if (h) tips.push(h.text);
    }
    fb.className = 'feedback bad';
    fb.innerHTML = `Cut! Das war noch nicht nach Drehbuch.<br>${lines.join('<br>')}${tips.length ? `<br><b>Tipp:</b> ${tips.join(' ')}` : ''}`;
    btn.disabled = false;
    btn.textContent = 'Nochmal: Action! 🎬';
    if (takes >= 2 && task.solution) right.querySelector('.btn-reveal').classList.remove('hidden');
  }

  right.querySelector('.dr-action').addEventListener('click', action);
  right.querySelector('.btn-reveal').addEventListener('click', () => {
    for (const inp of inputs) {
      const [id, f] = inp.dataset.key.split('.');
      inp.value = fmtRaw(task.solution[id][f]);
      inp.disabled = true;
    }
    const { world: w } = runTake(base, task.solution, tEnd, task.events, tol);
    mine?.remove();
    mine = g.overlay([...controlled].flatMap((id) => series(w.actors.get(id), 'x')), 'g-overlay');
    showScene(w).play();
    done = true;
    fb.className = 'feedback';
    fb.textContent = 'So hätte es geklappt. Vergleiche mit deinem Plan auf Papier. Bezahlt wird diesmal nicht.';
    setTimeout(() => onSolved({ attempts: takes, grade: 'fail' }), 600);
  });
  inputs.forEach((inp, i) => inp.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (i < inputs.length - 1) inputs[i + 1].focus(); else action();
  }));

  return { destroy: () => scene?.destroy() };
}

const round1 = (v) => Math.round(v * 10) / 10;
