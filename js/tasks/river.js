// Aufgabentyp W: Fluss-Labor [W34]. Simulation: Regler für Strömung (0–4 m/s) und Boot (0–10 m/s, gegenüber dem Wasser),
// Fahrt flussauf zur Boje und zurück im Zeitraffer, t₁/t₂/t_ges live, Fahrtenbuch. Ist das Boot zu schwach,
// treibt es ab und wird am Seil zurückgeholt. Nach ≥ 3 Fahrten (mit und ohne Strömung): Erkenntnis
// „Die Strömung gleicht sich NICHT aus“, dann ein Quiz (js/tasks/river-quiz.js). Geld wie H (Bewertung im Quiz).
//
// Ticket-Feld "task": { "type":"river", "L":60, "prompt":"…", "paper":"…", "quiz":{ … siehe river-quiz.js } }

import { tripPlan, boatAt } from '../engine/river.js';
import { drawRiver } from '../render/river.js';
import { frame } from './common.js';
import { startQuiz } from './river-quiz.js';

const f1 = (v) => v.toFixed(1).replace('.', ',');

export function mount(root, { ticket, onSolved }) {
  const task = ticket.task, L = task.L ?? 60;
  const { left, right } = frame(root);
  left.innerHTML = `<div class="scene-wrap rv-wrap"><canvas class="rv-cv"></canvas></div>
    <div class="rv-ctrl">
      <label>🌊 Strömung <b class="rv-vf">1,0 m/s</b><input type="range" class="rv-sf" min="0" max="4" step="0.5" value="1"></label>
      <label>🚤 Boot <b class="rv-vb">4,0 m/s</b><input type="range" class="rv-sb" min="0" max="10" step="0.5" value="4"></label>
      <button class="btn btn-check rv-go" type="button">▶ Losfahren</button>
    </div>
    <div class="paper-note"><strong>✎ Auf Papier</strong><span></span></div>`;
  left.querySelector('.paper-note span').textContent = task.paper
    ?? 'Rechne vorher: Flussauf ist das Boot mit v_Boot − v_Fluss unterwegs, flussab mit v_Boot + v_Fluss. t = Strecke / Geschwindigkeit. Stimmt deine Vorhersage?';
  right.innerHTML = `<p class="prompt"></p>
    <div class="rv-clock"><span>t₁ (flussauf) <b class="c1">–</b></span><span>t₂ (flussab) <b class="c2">–</b></span><span>t<sub>ges</sub> <b class="c3">–</b></span><span class="rv-speed"></span></div>
    <div class="eb-protocol rv-log"><strong>Fahrtenbuch</strong><table><thead><tr><th>v<sub>Fluss</sub></th><th>v<sub>Boot</sub></th><th>t₁</th><th>t₂</th><th>t<sub>ges</sub></th><th>v̄</th></tr></thead><tbody></tbody></table></div>
    <div class="rv-insight hidden"></div>`;
  right.querySelector('.prompt').textContent = task.prompt ?? `Fahr ${L} m flussauf zur Boje und zurück. Probiere verschiedene Strömungen aus – gleicht sich die Strömung aus?`;

  const cv = left.querySelector('.rv-cv');
  const sf = left.querySelector('.rv-sf'), sb = left.querySelector('.rv-sb'), go = left.querySelector('.rv-go');
  const show = () => { left.querySelector('.rv-vf').textContent = `${f1(+sf.value)} m/s`; left.querySelector('.rv-vb').textContent = `${f1(+sb.value)} m/s`; };
  sf.addEventListener('input', show); sb.addEventListener('input', show); show();

  let run = null, raf = 0, last = performance.now(), anim = 0;
  const runs = [];
  function frameLoop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; anim += dt;
    let x = 0, dir = 1, rope = false, moving = false;
    const vf = run ? run.vf : +sf.value;
    if (run) {
      run.t += dt * run.k; moving = true;
      const p = run.plan;
      if (p.ok) {
        x = boatAt(p, run.t, run.vb, run.vf); dir = run.t <= p.t1 ? 1 : -1;
        clock(Math.min(run.t, p.t1), run.t > p.t1 ? Math.min(run.t - p.t1, p.t2) : null, Math.min(run.t, p.T));
        if (run.t >= p.T) end();
      } else {
        // treibt ab, nach 4 s (Simulation) holt das Seil das Boot zurück
        const tDrift = 4;
        if (run.t < tDrift) { x = boatAt(p, run.t, run.vb, run.vf); dir = 1; clock(run.t, null, run.t); }
        else { rope = true; run.pull ??= boatAt(p, tDrift, run.vb, run.vf); run.pull = Math.min(0, run.pull + dt * L * 0.08); x = run.pull; if (x >= 0) end(); }
      }
    }
    const d = Math.min(window.devicePixelRatio || 1, 3), r = cv.getBoundingClientRect();
    if (r.width && cv.width !== Math.round(r.width * d)) { cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); }
    if (r.width) drawRiver(cv, { L, x, vf, dir, rope, moving, t: anim, dpr: d });
    raf = requestAnimationFrame(frameLoop);
  }
  raf = requestAnimationFrame(frameLoop);

  const clock = (a, b, c) => {
    right.querySelector('.c1').textContent = `${f1(a)} s`;
    right.querySelector('.c2').textContent = b == null ? '–' : `${f1(b)} s`;
    right.querySelector('.c3').textContent = `${f1(c)} s`;
  };
  go.addEventListener('click', () => {
    if (run) return;
    const vb = +sb.value, vf = +sf.value, plan = tripPlan(vb, vf, L);
    const k = plan.ok ? Math.max(1, plan.T / 8) : 1; // ganze Fahrt in höchstens ~8 s
    run = { vb, vf, plan, t: 0, k };
    sf.disabled = sb.disabled = go.disabled = true;
    right.querySelector('.rv-speed').textContent = k > 1.05 ? `⏩ Zeitraffer ×${Math.round(k)}` : '';
  });
  function end() {
    const { vb, vf, plan } = run;
    run = null; sf.disabled = sb.disabled = go.disabled = false;
    const tb = right.querySelector('.rv-log tbody');
    const row = document.createElement('tr');
    if (plan.ok) {
      row.innerHTML = `<td>${f1(vf)}</td><td>${f1(vb)}</td><td>${f1(plan.t1)} s</td><td>${f1(plan.t2)} s</td><td>${f1(plan.T)} s</td><td><b>${f1(plan.avg)} m/s</b></td>`;
      if (vf > 0) row.classList.add('rv-less');
    } else row.innerHTML = `<td>${f1(vf)}</td><td>${f1(vb)}</td><td colspan="4">🪢 zu schwach – Seil!</td>`;
    tb.prepend(row);
    runs.push({ vb, vf, ok: plan.ok });
    insight();
  }
  function insight() {
    const ok = runs.filter((r) => r.ok);
    const box = right.querySelector('.rv-insight');
    if (runs.length < 3 || !ok.some((r) => r.vf === 0) || !ok.some((r) => r.vf > 0)) {
      box.classList.remove('hidden');
      box.textContent = `Noch ${Math.max(0, 3 - runs.length)} Fahrt(en)${ok.some((r) => r.vf === 0) ? '' : ', eine davon ohne Strömung'}${ok.some((r) => r.vf > 0) ? '' : ', eine mit Strömung'}. Vergleiche v̄ mit v_Boot!`;
      return;
    }
    box.classList.remove('hidden'); box.classList.add('ok');
    box.innerHTML = `<b>Erkenntnis:</b> Ohne Strömung ist v̄ = v<sub>Boot</sub>. Mit Strömung ist v̄ <b>immer kleiner</b> – sie gleicht sich NICHT aus! Flussauf ist das Boot langsamer und deshalb <b>länger</b> unterwegs. Diese lange, langsame Phase zählt mehr als die kurze, schnelle zurück.
      <button class="btn btn-check rv-quiz" type="button">Zum Quiz ▶</button>`;
    box.querySelector('.rv-quiz').addEventListener('click', () => { if (run) return; sf.disabled = sb.disabled = go.disabled = true; startQuiz(right, task.quiz ?? {}, onSolved, ticket.id); });
  }
  insight();
  return { destroy: () => cancelAnimationFrame(raf) };
}
