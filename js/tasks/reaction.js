// Aufgabentyp Reaktionstest: eigene Reaktionszeit messen, damit den eigenen Anhalteweg berechnen.
//
// Ticket-Feld "task":
// { "type":"reaction", "v_kmh":25, "a":4, "sprite":"cyclist", "vehicle":"mit dem Fahrrad", "paper":"…" }

import { buildWorld } from '../engine/kinematics.js';
import { Scene } from '../render/scene.js';
import { fmt } from '../render/format.js';
import { atLeast2 } from '../engine/sigfig.js';
import { frame } from './common.js';
import { questionBlock } from './questions.js';
import { showPolice } from '../ui/police.js';

const TRIALS = 3;

export function mount(root, { ticket, onSolved }) {
  const task = ticket.task;
  const vKmh = task.v_kmh ?? 25, a = task.a ?? 4;
  const v = vKmh / 3.6;
  const { left, right } = frame(root);
  let timer = null, phase = 'idle', t0 = 0, scene = null;
  const times = [];

  left.innerHTML = `
    <div class="reaction">
      <div class="r-light"><span class="lamp red"></span><span class="lamp yellow"></span><span class="lamp green"></span></div>
      <div class="r-status">Tippe auf <b>Start</b>. Sobald die Ampel <b>rot</b> wird: so schnell wie möglich <b>BREMSEN!</b></div>
      <button class="btn r-brake" type="button">Start</button>
      <div class="r-times"></div>
    </div>
    <div class="paper-note"><strong>✎ Auf Papier</strong><span></span></div>`;
  left.querySelector('.paper-note span').textContent = task.paper
    ?? 'Notiere deine Reaktionszeit. Rechne die Geschwindigkeit in m/s um (÷ 3,6). Reaktionsweg = v · t_R, Bremsweg = v² / (2a), Anhalteweg = beides zusammen.';

  right.innerHTML = `<p class="prompt"></p>
    <div class="r-data"><b>Deine Fahrt ${task.vehicle ?? 'mit dem Fahrrad'}:</b><br>
      Geschwindigkeit: ${fmt(vKmh)} km/h · Bremsverzögerung: ${atLeast2(fmt(a), a)} m/s² · Reaktionszeit: <span class="r-tr">wird gemessen …</span></div>
    <div class="r-q"></div>`;
  right.querySelector('.prompt').textContent = task.prompt ?? 'Erst messen, dann rechnen: Wie lang ist DEIN Anhalteweg?';

  const light = left.querySelector('.r-light');
  const status = left.querySelector('.r-status');
  const btn = left.querySelector('.r-brake');
  const list = left.querySelector('.r-times');
  const setLight = (c) => light.querySelectorAll('.lamp').forEach((l) => l.classList.toggle('on', l.classList.contains(c)));

  function arm() {
    phase = 'wait';
    setLight('green');
    btn.textContent = 'BREMSEN!';
    btn.classList.add('armed');
    status.textContent = `Versuch ${times.length + 1} von ${TRIALS}: Warte auf Rot …`;
    timer = setTimeout(() => {
      setLight('yellow');
      timer = setTimeout(() => { phase = 'red'; setLight('red'); t0 = performance.now(); }, 350);
    }, 1200 + Math.random() * 2600);
  }

  function press() {
    if (phase === 'idle' || phase === 'between') { arm(); return; }
    if (phase === 'done') return;
    if (phase === 'wait') {
      clearTimeout(timer);
      phase = 'between';
      setLight('none');
      btn.textContent = 'Nochmal';
      btn.classList.remove('armed');
      status.innerHTML = '<b>Zu früh!</b> Erst bremsen, wenn die Ampel rot ist. Der Versuch zählt nicht.';
      return;
    }
    const dt = (performance.now() - t0) / 1000;
    times.push(dt);
    list.insertAdjacentHTML('beforeend', `<span>${times.length}. Versuch: ${fmt(dt, 2)} s</span>`);
    btn.classList.remove('armed');
    if (times.length < TRIALS) {
      phase = 'between';
      btn.textContent = 'Nächster Versuch';
      status.textContent = `${fmt(dt, 2)} s. Weiter geht's!`;
    } else finishMeasuring();
  }

  function finishMeasuring() {
    phase = 'done';
    const tR = Math.round([...times].sort((x, y) => x - y)[1] * 100) / 100; // Median von 3
    btn.disabled = true;
    btn.textContent = 'Gemessen ✓';
    status.innerHTML = `Deine Reaktionszeit (Median): <b>${fmt(tR, 2)} s</b>.${tR > 1 ? ' Etwas verschlafen? Egal, wir rechnen damit.' : ''}`;
    right.querySelector('.r-tr').innerHTML = `<b>${fmt(tR, 2)} s</b>`;
    if (tR >= 1) showPolice(document.getElementById('task'), { kind: 'tired', input: `${fmt(tR, 2)} s` }); // macht sich Sorgen [W40]
    const sR = v * tR, sB = (v * v) / (2 * a);
    const qs = [
      { label: 'Reaktionsweg', symbol: 's_R', unit: 'm', truth: sR,
        hints: [{ value: vKmh * tR, text: 'Erst die Geschwindigkeit in m/s umrechnen (÷ 3,6)!' }] },
      { label: 'Bremsweg', symbol: 's_B', unit: 'm', truth: sB,
        hints: [{ value: (vKmh * vKmh) / (2 * a), text: 'Mit km/h gerechnet? Erst in m/s umrechnen!' }, { value: (v * v) / a, text: 'Fast! Im Nenner steht 2·a.' }] },
      { label: 'Anhalteweg', symbol: 's_A', unit: 'm', truth: sR + sB,
        hints: [{ value: sB, text: 'Das ist nur der Bremsweg. Während der Reaktionszeit fährst du ungebremst weiter!' }] },
    ];
    questionBlock(right.querySelector('.r-q'), qs, { onSolved: (r) => showRide(tR, r), sig: task.sigCheck !== false });
  }

  // Belohnung: die eigene Fahrt als Animation
  function showRide(tR, result) {
    const world = buildWorld({ actors: [{ id: 'me', name: 'Du', sprite: task.sprite ?? 'cyclist', x0: 0,
      segments: [{ dt: tR, v }, { until: 'rest', a: -a }] }] });
    left.innerHTML = `<div class="scene-wrap"><canvas class="scene"></canvas></div>
      <div class="r-result">Reaktionsweg <b>${fmt(v * tR, 1)} m</b> + Bremsweg <b>${fmt((v * v) / (2 * a), 1)} m</b>
      = Anhalteweg <b>${fmt(v * tR + (v * v) / (2 * a), 1)} m</b>. So weit fährst du, bevor du stehst!</div>
      <button class="btn r-next">Weiter ▶</button>`;
    scene = new Scene(left.querySelector('.scene'), world, { rate: 1 });
    scene.play();
    left.querySelector('.r-next').addEventListener('click', () => onSolved(result), { once: true });
    rideAt = performance.now(); // Leertaste/Enter führt auch weiter [W47]
  }

  btn.addEventListener('pointerdown', (e) => { e.preventDefault(); press(); });
  let rideAt = 0;
  const onKey = (e) => {
    const next = left.querySelector('.r-next');
    if (next && (e.code === 'Space' || e.key === 'Enter') && performance.now() - rideAt > 300) { e.preventDefault(); next.click(); return; }
    if (e.code === 'Space' && phase !== 'done') { e.preventDefault(); press(); }
  };
  document.addEventListener('keydown', onKey);

  return { destroy: () => { clearTimeout(timer); scene?.destroy(); document.removeEventListener('keydown', onKey); } };
}
