// Aufgabentypen U und V: Durchschnittsgeschwindigkeit [W34].
// U (avgdist): Abschnitte mit bekannter STRECKE und je konstanter Geschwindigkeit.
// V (avgtime): Abschnitte mit bekannter ZEIT und je konstanter Geschwindigkeit.
// Variante: eine Abschnittsgeschwindigkeit fehlt (v: null), gesucht ist sie für einen Ziel-Schnitt (target);
// mit "allowImpossible" gibt es den Knopf „🚫 Geht nicht“ (der Klassiker: Schnitt verdoppeln ist unmöglich).
// Links: Streckenband mit Figur im Zeitraffer und Uhr. Rechts: Balken „Strecke“ und „Zeit“ – der unbekannte Balken
// erscheint erst nach dem Lösen (Erkenntnis: langsame Abschnitte dauern länger und zählen deshalb mehr).
// Geld wie H.
//
// Ticket-Feld "task":
// { "type":"avgdist"|"avgtime", "sprite":"cyclist", "units":{ "dist":"km", "time":"min", "speed":"km/h" },
//   "parts":[ { "label":"Bergauf", "dx":4, "v":12 }, … ]  (V: "dt" statt "dx"), "target":20,
//   "allowImpossible":true, "prompt":"…", "paper":"…", "hints":[…], "help":"…" }

import { avgByDistance, avgByTime, missingSpeed, fillParts, SI } from '../engine/average.js';
import { frame } from './common.js';
import { questionBlock } from './questions.js';
import { fmt as fmtRaw } from '../render/format.js';
import { atLeast2 } from '../engine/sigfig.js';
import { getSprite } from '../render/pixel.js';

const COLORS = ['#3b5dc9', '#e43b44', '#38b764', '#f2b52c'];
const fmt = (v) => atLeast2(fmtRaw(v, 2), v);

export function mount(root, { ticket, onSolved }) {
  const task = ticket.task, mode = task.type === 'avgtime' ? 'time' : 'distance';
  const U = { dist: 'm', time: 's', speed: 'm/s', ...task.units };
  const kD = SI[U.dist], kT = SI[U.time], kV = SI[U.speed];
  // in SI rechnen
  const parts = task.parts.map((p) => ({ label: p.label, dx: p.dx != null ? p.dx * kD : undefined, dt: p.dt != null ? p.dt * SI[p.tu ?? U.time] : undefined, v: p.v == null ? null : p.v * kV }));
  const unknown = parts.findIndex((p) => p.v == null);
  let truthSI, ask;
  if (unknown < 0) { ask = 'avg'; truthSI = mode === 'distance' ? avgByDistance(parts) : avgByTime(parts); }
  else { ask = 'missing'; truthSI = missingSpeed(parts, task.target * kV, mode); }
  const impossible = !Number.isFinite(truthSI) || truthSI <= 0;
  const full = fillParts(parts.map((p, i) => (i === unknown ? { ...p, v: impossible ? 1e9 : truthSI } : p)), mode);
  const truth = truthSI / kV;
  const { left, right } = frame(root);

  // ---------- links: Streckenband, Fahrtenbuch, Notizzettel ----------
  const row = (p, i) => {
    const a = mode === 'distance' ? `${fmt(task.parts[i].dx)} ${U.dist}` : `${fmt(task.parts[i].dt)} ${task.parts[i].tu ?? U.time}`;
    const v = task.parts[i].v == null ? `<b>v = ?</b>` : `v = ${fmt(task.parts[i].v)} ${U.speed}`;
    return `<tr><td><span class="avg-dot" style="background:${COLORS[i % 4]}"></span>${p.label}</td><td>${mode === 'distance' ? 'Δx' : 'Δt'} = ${a}</td><td>${v}</td></tr>`;
  };
  left.innerHTML = `<div class="scene-wrap avg-wrap"><canvas class="avg-cv"></canvas></div>
    <div class="eb-protocol avg-log"><strong>Fahrtenbuch</strong><table>${parts.map(row).join('')}</table>
      ${ask === 'missing' ? `<div class="eb-best">Ziel: v̄ = ${fmt(task.target)} ${U.speed}</div>` : ''}</div>
    <div class="paper-note"><strong>✎ Auf Papier</strong><span></span></div>`;
  left.querySelector('.paper-note span').textContent = task.paper ?? (mode === 'distance'
    ? 'v̄ = Gesamtstrecke / Gesamtzeit. Rechne erst für jeden Abschnitt die Zeit aus: Δt = Δx / v. Der Mittelwert der Geschwindigkeiten ist NICHT der Schnitt!'
    : 'v̄ = Gesamtstrecke / Gesamtzeit. Rechne erst für jeden Abschnitt die Strecke aus: Δx = v · Δt.');
  const cv = left.querySelector('.avg-cv'), ctx = cv.getContext('2d');
  const S = full.reduce((a, p) => a + p.dx, 0), T = full.reduce((a, p) => a + p.dt, 0);
  const tStop = impossible ? full.slice(0, unknown).reduce((a, p) => a + p.dt, 0) : T; // „Die Zeit ist schon um“
  const playLen = 6; // Sekunden für die ganze Fahrt
  const sp = getSprite(task.sprite ?? 'cyclist');
  let t0 = performance.now(), raf = 0;
  const posAt = (t) => { let x = 0; for (const p of full) { if (t <= p.dt) return x + p.v * t; x += p.dx; t -= p.dt; } return S; };
  function draw(now) {
    const d = Math.min(window.devicePixelRatio || 1, 3), r = cv.getBoundingClientRect();
    if (r.width && cv.width !== Math.round(r.width * d)) { cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); }
    const W = cv.width, H = cv.height, m = 14 * d, y = H * 0.62;
    const X = (x) => m + (x / S) * (W - 2 * m);
    ctx.fillStyle = '#cfeeff'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#86d043'; ctx.fillRect(0, y + 6 * d, W, H);
    let x = 0;
    full.forEach((p, i) => {
      ctx.fillStyle = COLORS[i % 4]; ctx.fillRect(X(x), y, X(x + p.dx) - X(x), 6 * d);
      ctx.fillStyle = '#1a1c2c'; ctx.font = `${11 * d}px system-ui, sans-serif`; ctx.textAlign = 'center';
      ctx.fillText(task.parts[i].label, (X(x) + X(x + p.dx)) / 2, y + 22 * d);
      x += p.dx;
    });
    const tt = Math.min(tStop, (((now - t0) / 1000) % (playLen + 1.5)) / playLen * T);
    const px = X(posAt(tt)), k = (H * 0.42) / sp.h;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sp.frames[Math.floor(now / 120) % sp.frames.length], px - (sp.w * k) / 2, y - sp.h * k + 2 * d, sp.w * k, sp.h * k);
    ctx.fillStyle = 'rgba(26,28,44,0.8)'; ctx.fillRect(4 * d, 4 * d, 110 * d, 17 * d);
    ctx.fillStyle = '#f4f4f4'; ctx.textAlign = 'left'; ctx.font = `${12 * d}px "AmtPixel", monospace`;
    ctx.fillText(`t = ${fmtRaw(tt / kT, 1)} ${U.time}`, 9 * d, 16 * d);
    if (impossible && tt >= tStop - 1e-9) { ctx.fillStyle = '#e43b44'; ctx.textAlign = 'right'; ctx.fillText('Zeit schon um!', W - 6 * d, 16 * d); }
    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);

  // ---------- rechts: Balken, Fragen ----------
  right.innerHTML = `<p class="prompt"></p>
    <div class="avg-bars">
      <div class="avg-bar" data-k="dx"><span>Strecke</span><div></div></div>
      <div class="avg-bar" data-k="dt"><span>Zeit</span><div></div></div>
    </div><div class="avg-q"></div>`;
  right.querySelector('.prompt').textContent = task.prompt;
  const known = mode === 'distance' ? 'dx' : 'dt';
  function bars(reveal) {
    for (const el of right.querySelectorAll('.avg-bar')) {
      const k = el.dataset.k, box = el.querySelector('div'), tot = full.reduce((a, p) => a + p[k], 0);
      const show = reveal || k === known;
      box.innerHTML = full.map((p, i) => {
        const gone = impossible && k === 'dt' && show; // unmöglich: für den letzten Abschnitt bleibt keine Zeit
        const w = !show ? 100 / full.length : gone ? (i === unknown ? 14 : (86 * p[k]) / (tot - full[unknown].dt)) : (100 * p[k]) / tot;
        const val = k === 'dx' ? `${fmt(p.dx / kD)} ${U.dist}` : `${fmt(p.dt / kT)} ${U.time}`;
        const txt = !show ? '?' : impossible && i === unknown ? (k === 'dt' ? '0!' : val) : val;
        return `<i style="width:${w}%;background:${COLORS[i % 4]}${show ? '' : ';opacity:.35'}">${txt}</i>`;
      }).join('');
    }
  }
  bars(false);
  const qbox = right.querySelector('.avg-q');
  const label = ask === 'avg' ? 'Durchschnittsgeschwindigkeit' : `Geschwindigkeit ${task.parts[unknown].label}`;
  const symbol = ask === 'avg' ? 'v̄' : `v_${unknown + 1}`;
  const hints = [...(task.hints ?? [])];
  if (ask === 'avg' && mode === 'distance') hints.push({ value: parts.reduce((a, p) => a + p.v, 0) / parts.length / kV, text: 'Das ist der Mittelwert der Geschwindigkeiten. Aber auf dem langsamen Abschnitt ist man LÄNGER unterwegs – der zählt mehr!' });
  let wrong = 0, done = false;
  const finish = (grade, attempts) => { done = true; bars(true); onSolved({ attempts, grade }); };
  questionBlock(qbox, [{ label, symbol, unit: U.speed, truth: impossible ? Number.MAX_VALUE : truth, hints, help: task.help }], {
    onSolved: ({ attempts, grade }) => { if (!done) finish(grade, attempts); },
  });
  qbox.querySelector('.btn-check').addEventListener('click', () => { wrong++; }, true);
  if (impossible) { // „Lösung zeigen“ ohne Zahl: Es gibt keine.
    qbox.querySelector('.btn-reveal').addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      const fb = qbox.querySelector('.feedback');
      fb.className = 'feedback'; fb.textContent = 'Lösung: Das geht gar nicht! Die Zeit für den ganzen Weg ist schon nach dem ersten Abschnitt verbraucht. Bezahlt wird diesmal nicht.';
      qbox.querySelectorAll('input, .btn').forEach((x) => (x.disabled = true));
      setTimeout(() => finish('fail', wrong + 1), 1600);
    }, true);
  }
  if (task.allowImpossible) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn avg-impossible'; b.textContent = '🚫 Geht nicht';
    qbox.querySelector('.calc-actions').appendChild(b);
    const fb = qbox.querySelector('.feedback');
    b.addEventListener('click', () => {
      if (done) return;
      if (impossible) {
        fb.className = 'feedback ok';
        fb.textContent = task.impossibleText ?? 'Richtig: Unmöglich! Für den Ziel-Schnitt bräuchte man die ganze Zeit schon für den ersten Abschnitt auf – für den Rest bliebe keine Sekunde übrig.';
        qbox.querySelectorAll('input, .btn').forEach((x) => (x.disabled = true));
        setTimeout(() => finish(wrong ? 'partial' : 'perfect', wrong + 1), 1600);
      } else {
        wrong++; fb.className = 'feedback bad'; fb.textContent = 'Doch, das geht! Rechne aus, wie viel Zeit für den letzten Abschnitt übrig bleibt.';
      }
    });
  }
  return { destroy: () => cancelAnimationFrame(raf) };
}
