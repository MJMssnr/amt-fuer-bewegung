// Aufgabentyp F: Live-Steuerung. Eine Figur per Schieberegler (vₓ) so steuern,
// dass ihr t-x-Diagramm dem Plan folgt. Die Geschwindigkeiten rechnet man vorher auf Papier aus.
//
// Ticket-Feld "task":
// { "type":"live", "actor":"plan", "player":"florian", "vmax":4, "tol":0.8, "ghost":false, "paper":"…", "prompt":"…" }
// ghost:false blendet die Soll-Figur in der Animation aus (dann nur nach Diagramm steuern).
// points:true zeigt im Plan nur die Eckpunkte zwischen den Abschnitten – die Linie denkt man sich selbst [W28].
// Knopf „🐢 halbe Zeit“: Zeit läuft halb so schnell, damit man die Linie besser halten kann [W28].

import { series, quantityAt } from '../engine/kinematics.js';
import { Scene } from '../render/scene.js';
import { fmt } from '../render/format.js';
import { frame, actorOf, graphInto } from './common.js';

export function mount(root, { ticket, world, onSolved }) {
  const task = ticket.task;
  const target = actorOf(world, task);
  const vmax = task.vmax ?? 5;
  const { left, right } = frame(root);
  const xs = series(target, 'x').flat().map((p) => p[1]);
  const range = Math.max(...xs) - Math.min(...xs);
  const tol = task.tol ?? Math.max(0.3, 0.08 * range);

  left.innerHTML = `
    <div class="scene-wrap"><canvas class="scene" aria-label="Steuerung"></canvas>
      <div class="live-count hidden"></div></div>
    <div class="live-ctrl">
      <label for="live-v">Deine Geschwindigkeit</label>
      <div class="live-row">
        <button class="btn live-step" data-d="-0.5" aria-label="langsamer">−</button>
        <input id="live-v" class="live-slider" type="range" min="${-vmax}" max="${vmax}" step="0.1" value="0">
        <button class="btn live-step" data-d="0.5" aria-label="schneller">+</button>
      </div>
      <div class="live-v">vₓ = 0 m/s</div>
      <div class="live-row"><button class="btn live-zero">Stopp (vₓ = 0)</button><button class="btn live-slow" type="button" aria-pressed="false">🐢 halbe Zeit</button></div>
    </div>
    <div class="paper-note"><strong>✎ Auf Papier</strong><span></span></div>`;
  // Grundsatz für alle F-Aufträge: Geschwindigkeiten vorher im Kopf oder auf Papier ausrechnen [W28]
  left.querySelector('.paper-note span').textContent = `Rechne vor dem Start alle nötigen Geschwindigkeiten aus (vₓ = Δx / Δt) – dann klappt's! ${task.paper ?? ''}`.trim();

  right.innerHTML = `<p class="prompt"></p><figure class="graph-card axes-card"></figure>
    <div class="calc-actions"><button class="btn btn-check live-start">Start ▶</button></div>
    <div class="feedback" aria-live="polite"></div>`;
  right.querySelector('.prompt').textContent = task.prompt
    ?? 'Folge dem Plan! Die blaue Kurve ist das Soll, deine Bewegung wird orange mitgezeichnet.';
  const plan = task.points ? [] : series(target, 'x');
  const g = graphInto(right.querySelector('.axes-card'), 'xt', plan,
    { tMax: world.tEnd, yRange: [Math.min(...xs) - range * 0.15, Math.max(...xs) + range * 0.15] });
  if (task.points) { // nur die Eckpunkte des Plans
    const corners = [...target.pieces.map((p) => p.t0), target.tEnd];
    corners.forEach((t) => g.dot([t, quantityAt(target, 'x', t)], 'g-dot live-pt', 4.5));
  }

  const slider = left.querySelector('.live-slider');
  const vLabel = left.querySelector('.live-v');
  const btnStart = right.querySelector('.live-start');
  const fb = right.querySelector('.feedback');
  const count = left.querySelector('.live-count');
  const x0 = target.pieces[0].r0[0];
  let v = 0, x = x0, lastT = 0, trace = [], running = false, runs = 0, face = false;

  const setV = (val) => {
    v = Math.max(-vmax, Math.min(vmax, Math.round(val * 10) / 10));
    slider.value = v;
    vLabel.textContent = `vₓ = ${fmt(v, 1)} m/s`;
    if (Math.abs(v) > 0.05) face = v < 0;
  };
  slider.addEventListener('input', () => setV(Number(slider.value)));
  left.querySelectorAll('.live-step').forEach((b) => b.addEventListener('click', () => setV(v + Number(b.dataset.d))));
  left.querySelector('.live-zero').addEventListener('click', () => setV(0));

  const scene = new Scene(left.querySelector('.scene'), world, {
    rate: 1,
    ghost: new Set([target.id]),
    xRange: [Math.min(...xs) - range * 0.15, Math.max(...xs) + range * 0.15],
    extras: () => [{ sprite: task.player ?? 'florian', x, flip: face, moving: running && Math.abs(v) > 0.05 }],
    onTime: (t) => {
      if (running) {
        x += v * Math.max(0, t - lastT);
        lastT = t;
        trace.push([t, x]);
        g.trace(trace);
      }
      g.setCursor(t);
    },
  });
  scene.ghostAlpha = task.ghost === false ? 0 : 0.35;
  scene.draw();
  scene.onEnd = () => { if (running) finish(); };

  async function start() {
    if (running) return;
    btnStart.disabled = true;
    fb.className = 'feedback';
    fb.textContent = '';
    x = x0; lastT = 0; trace = [[0, x0]];
    g.trace(trace);
    scene.setTime(0);
    count.classList.remove('hidden');
    for (const n of ['3', '2', '1', 'Los!']) {
      count.textContent = n;
      await new Promise((r) => setTimeout(r, 650));
    }
    count.classList.add('hidden');
    running = true;
    runs++;
    scene.play();
  }

  function finish() {
    running = false;
    let sum = 0, worst = { d: 0, t: 0 };
    for (const [t, px] of trace) {
      const d = Math.abs(px - quantityAt(target, 'x', t));
      sum += d;
      if (d > worst.d) worst = { d, t };
    }
    const mean = sum / Math.max(1, trace.length);
    const ok = mean <= tol;
    if (ok) {
      fb.className = 'feedback ok';
      fb.textContent = `Punktlandung! Mittlere Abweichung ${fmt(mean, 2)} m (erlaubt: ${fmt(tol, 2)} m).`;
      setTimeout(() => onSolved({ attempts: runs, grade: runs === 1 ? 'perfect' : 'partial' }), 1800);
    } else {
      fb.className = 'feedback bad';
      fb.textContent = `Mittlere Abweichung ${fmt(mean, 2)} m, erlaubt sind ${fmt(tol, 2)} m. `
        + `Am weitesten daneben warst du bei t ≈ ${fmt(worst.t, 1)} s. Prüfe dort die Steigung im Plan und versuch es nochmal!`;
      btnStart.disabled = false;
      btnStart.textContent = 'Nochmal ▶';
    }
  }

  btnStart.addEventListener('click', start);
  const slow = left.querySelector('.live-slow');
  slow.addEventListener('click', () => {
    const on = scene.rate !== 0.5;
    scene.rate = on ? 0.5 : 1;
    slow.setAttribute('aria-pressed', String(on));
    slow.classList.toggle('on', on);
    scene.draw();
  });
  return { destroy: () => { running = false; scene.destroy(); } };
}
